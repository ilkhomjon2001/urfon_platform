// Toʻlov daftari (Tarbion_school modeli asosida). Oylik hisob (Payment) va kassaga kelgan pul (PaymentTransaction)
// alohida yoziladi. Pul oyga bogʻlanmaydi: eng eski ochiq hisobdan boshlab taqsimlanadi (PaymentAllocation),
// ortigʻi avans boʻlib qoladi va keyingi hisob yaratilganda avtomatik yopiladi. Bekor qilish — storno (oʻchirilmaydi).
// Qarzdorlik = ochiq hisoblarning toʻlanmagan qismi; balans = avans − qarzdorlik (manfiy — qarz).
import type { PaymentMethod } from "@prisma/client";
import { prisma, type Tx } from "../db.js";
import { fmtDbDate, fmtMoney, fmtPeriod } from "../bot/format.js";
import { writeAudit, type AuditInput } from "./audit.js";
import { dbDateYmd, toDbDate, ymdTz } from "./dates.js";
import { badRequest, notFound } from "./errors.js";
import { notifyParents } from "./notify.js";

export type Actor = Pick<AuditInput, "actorId" | "actorRole" | "ip" | "userAgent">;
export const SYSTEM_ACTOR: Actor = { actorId: null, actorRole: null };

/** Ochiq (toʻliq yopilmagan) hisob holatlari. */
export const OPEN_STATUSES = ["PENDING", "OVERDUE"] as const;

export const METHOD_LABEL: Record<string, string> = {
  CASH: "Naqd (kassa)",
  CARD: "Karta",
  CLICK: "Click",
  PAYME: "Payme",
  TRANSFER: "Bank oʻtkazmasi",
};

/** Bitta oʻquvchining toʻlov amallari ketma-ket bajariladi — ikki kassir bir vaqtda bossa ham taqsimot buzilmaydi. */
export async function lockStudent(tx: Tx, studentId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(424246, hashtext(${studentId}))`;
}

/** Kvitansiya raqami: KV-YYYY-MM-#### (oy boʻyicha ketma-ket, eski hisob va yangi tushum raqamlari birga). Qulf bilan. */
export async function nextReceiptNo(tx: Tx, paidAt: Date) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(424244)`;
  const prefix = `KV-${ymdTz(paidAt).slice(0, 7)}-`;
  const rows = await tx.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(r FROM ${prefix.length + 1}::int) AS INTEGER)) AS max FROM (
      SELECT "receiptNo" AS r FROM "Payment" WHERE "receiptNo" LIKE ${prefix + "%"}
      UNION ALL
      SELECT "receiptNo" AS r FROM "PaymentTransaction" WHERE "receiptNo" LIKE ${prefix + "%"}
    ) x WHERE r ~ '^KV-[0-9]{4}-[0-9]{2}-[0-9]+$'`;
  return `${prefix}${String(Number(rows[0]?.max ?? 0) + 1).padStart(4, "0")}`;
}

export type Applied = { paymentId: string; period: string; amount: number; transactionId: string; closed: boolean };

/**
 * Oʻquvchining taqsimlanmagan pulini ochiq hisoblarga yopadi: pul — eng eskisidan, hisob — muddati eng yaqinidan.
 * `first` berilsa, oʻsha hisob birinchi yopiladi (roʻyxatdagi «Qabul qilish»). Chaqiruvchi lockStudent() qilgan boʻlsin.
 */
export async function applyCredit(tx: Tx, studentId: string, first?: string): Promise<Applied[]> {
  const txs = await tx.paymentTransaction.findMany({
    where: { studentId, reversedAt: null },
    orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }],
    select: { id: true, amount: true, method: true, paidAt: true, allocations: { select: { amount: true } } },
  });
  const money = txs.map((t) => ({ ...t, left: t.amount - t.allocations.reduce((s, a) => s + a.amount, 0) })).filter((t) => t.left > 0);
  if (!money.length) return [];
  const open = await tx.payment.findMany({
    where: { studentId, status: { in: [...OPEN_STATUSES] } },
    orderBy: [{ dueDate: "asc" }, { period: "asc" }, { createdAt: "asc" }],
    select: { id: true, period: true, amount: true, paidAmount: true },
  });
  if (first) open.sort((a, b) => (a.id === first ? -1 : b.id === first ? 1 : 0));

  const applied: Applied[] = [];
  let mi = 0;
  for (const p of open) {
    if (mi >= money.length) break;
    let need = p.amount - p.paidAmount;
    let paid = p.paidAmount;
    let last: (typeof money)[number] | null = null;
    while (need > 0 && mi < money.length) {
      const m = money[mi];
      const take = Math.min(need, m.left);
      await tx.paymentAllocation.create({ data: { transactionId: m.id, paymentId: p.id, amount: take } });
      m.left -= take;
      need -= take;
      paid += take;
      last = m;
      applied.push({ paymentId: p.id, period: p.period, amount: take, transactionId: m.id, closed: need === 0 });
      if (m.left === 0) mi++;
    }
    if (last) {
      await tx.payment.update({
        where: { id: p.id },
        data: need === 0 ? { paidAmount: paid, status: "PAID", paidAt: last.paidAt, method: last.method } : { paidAmount: paid },
      });
    }
  }
  return applied;
}

/** Bitta oʻquvchi balansi. */
export async function studentBalance(db: Tx | typeof prisma, studentId: string) {
  const open = await db.payment.findMany({
    where: { studentId, status: { in: [...OPEN_STATUSES] } },
    select: { amount: true, paidAmount: true, dueDate: true, status: true },
  });
  const money = await db.paymentTransaction.aggregate({ where: { studentId, reversedAt: null }, _sum: { amount: true } });
  const alloc = await db.paymentAllocation.aggregate({ where: { transaction: { studentId, reversedAt: null } }, _sum: { amount: true } });
  const today = toDbDate();
  const outstanding = open.reduce((s, p) => s + p.amount - p.paidAmount, 0);
  const overdue = open.filter((p) => p.status === "OVERDUE" || p.dueDate < today).reduce((s, p) => s + p.amount - p.paidAmount, 0);
  const advance = Math.max(0, (money._sum.amount ?? 0) - (alloc._sum.amount ?? 0));
  return { outstanding, overdue, advance, balance: advance - outstanding, openCount: open.length };
}
export type Balance = Awaited<ReturnType<typeof studentBalance>>;

/** Barcha oʻquvchilar balansi (qarzdorlar roʻyxati uchun) — 3 ta agregat soʻrov. */
export async function allBalances() {
  const today = toDbDate();
  const [charged, open, money, alloc] = await Promise.all([
    prisma.$queryRaw<{ studentId: string; charged: bigint; n: number }[]>`
      SELECT "studentId", SUM(amount)::bigint AS charged, COUNT(*)::int AS n FROM "Payment" WHERE status <> 'CANCELLED' GROUP BY 1`,
    prisma.$queryRaw<{ studentId: string; outstanding: bigint; overdue: bigint; open: number; partial: number; oldestDue: Date | null }[]>`
      SELECT "studentId",
             SUM(amount - "paidAmount")::bigint AS outstanding,
             SUM(CASE WHEN status = 'OVERDUE' OR "dueDate" < ${today} THEN amount - "paidAmount" ELSE 0 END)::bigint AS overdue,
             COUNT(*)::int AS open,
             COUNT(*) FILTER (WHERE "paidAmount" > 0)::int AS partial,
             MIN("dueDate") AS "oldestDue"
      FROM "Payment" WHERE status IN ('PENDING', 'OVERDUE') GROUP BY 1`,
    prisma.$queryRaw<{ studentId: string; paid: bigint; lastPaidAt: Date | null }[]>`
      SELECT "studentId", SUM(amount)::bigint AS paid, MAX("paidAt") AS "lastPaidAt"
      FROM "PaymentTransaction" WHERE "reversedAt" IS NULL GROUP BY 1`,
    prisma.$queryRaw<{ studentId: string; allocated: bigint }[]>`
      SELECT t."studentId", SUM(a.amount)::bigint AS allocated
      FROM "PaymentAllocation" a JOIN "PaymentTransaction" t ON t.id = a."transactionId"
      WHERE t."reversedAt" IS NULL GROUP BY 1`,
  ]);
  const allocated = new Map(alloc.map((r) => [r.studentId, Number(r.allocated)]));
  type B = {
    charged: number; chargeCount: number; outstanding: number; overdue: number; openCount: number; partialCount: number;
    oldestDue: Date | null; advance: number; paid: number; lastPaidAt: Date | null;
  };
  const m = new Map<string, B>();
  const get = (id: string) => {
    let v = m.get(id);
    if (!v) m.set(id, (v = { charged: 0, chargeCount: 0, outstanding: 0, overdue: 0, openCount: 0, partialCount: 0, oldestDue: null, advance: 0, paid: 0, lastPaidAt: null }));
    return v;
  };
  for (const r of charged) Object.assign(get(r.studentId), { charged: Number(r.charged), chargeCount: r.n });
  for (const r of open) Object.assign(get(r.studentId), { outstanding: Number(r.outstanding), overdue: Number(r.overdue), openCount: r.open, partialCount: r.partial, oldestDue: r.oldestDue });
  for (const r of money) Object.assign(get(r.studentId), { paid: Number(r.paid), lastPaidAt: r.lastPaidAt, advance: Math.max(0, Number(r.paid) - (allocated.get(r.studentId) ?? 0)) });
  return m;
}

/** Kassaga pul kiritish: tushum + kvitansiya + taqsimot + audit + ota-onaga xabar. */
export async function receivePayment(
  tx: Tx,
  actor: Actor,
  input: { studentId: string; amount: number; method: PaymentMethod; paidAt: Date; note?: string | null; first?: string },
) {
  if (!Number.isInteger(input.amount) || input.amount < 1000) throw badRequest("Summa kamida 1 000 soʻm boʻlsin");
  await lockStudent(tx, input.studentId);
  const student = await tx.user.findFirst({
    where: { id: input.studentId, role: "STUDENT" },
    select: { id: true, fullName: true, studentProfile: { select: { code: true } } },
  });
  if (!student) throw notFound("Oʻquvchi topilmadi");
  const receiptNo = await nextReceiptNo(tx, input.paidAt);
  const t = await tx.paymentTransaction.create({
    data: {
      studentId: input.studentId, amount: input.amount, method: input.method, paidAt: input.paidAt, receiptNo,
      note: input.note?.trim() || null, createdById: actor.actorId ?? null,
    },
  });
  const applied = (await applyCredit(tx, input.studentId, input.first)).filter((a) => a.transactionId === t.id);
  const bal = await studentBalance(tx, input.studentId);
  const months = [...new Set(applied.map((a) => fmtPeriod(a.period)))];
  await writeAudit(tx, {
    ...actor,
    action: "payment.receive",
    entityType: "PaymentTransaction",
    entityId: t.id,
    summary: `${student.fullName}: ${fmtMoney(input.amount)} qabul qilindi (${METHOD_LABEL[input.method]}, ${receiptNo})${months.length ? ` — ${months.join(", ")}` : " — avans"}`,
    after: {
      studentId: input.studentId, amount: input.amount, method: input.method, paidAt: input.paidAt.toISOString(), receiptNo,
      note: t.note, allocations: applied.map((a) => ({ paymentId: a.paymentId, period: a.period, amount: a.amount })),
      outstanding: bal.outstanding, advance: bal.advance,
    },
  });
  const rest = bal.outstanding > 0 ? `Qolgan qarzdorlik: ${fmtMoney(bal.outstanding)}.` : bal.advance > 0 ? `Avans (keyingi oylar uchun): ${fmtMoney(bal.advance)}.` : "Qarzdorlik yoʻq.";
  await notifyParents(tx, input.studentId, {
    type: "payment.received",
    title: "Toʻlov qabul qilindi",
    body: `${student.fullName} uchun ${fmtMoney(input.amount)} qabul qilindi (${METHOD_LABEL[input.method]})${months.length ? `: ${months.join(", ")}` : ""}. Kvitansiya: ${receiptNo}. ${rest}`,
    link: "/ota-ona/tolovlar",
    payload: { transactionId: t.id, receiptNo },
  });
  return { transaction: t, applied, balance: bal, student };
}

/** Storno: tushum bekor qilinadi (yozuv qoladi), yopgan hisoblari qayta ochiladi, qolgan avans qayta taqsimlanadi. */
export async function reverseTransaction(tx: Tx, actor: Actor, id: string, reason: string) {
  const head = await tx.paymentTransaction.findUnique({ where: { id }, select: { studentId: true } });
  if (!head) throw notFound("Tushum topilmadi");
  await lockStudent(tx, head.studentId);
  const t = await tx.paymentTransaction.findUniqueOrThrow({
    where: { id },
    include: {
      student: { select: { fullName: true } },
      allocations: { include: { payment: { select: { id: true, period: true, status: true, paidAmount: true, dueDate: true } } } },
    },
  });
  if (t.reversedAt) throw badRequest("Bu tushum allaqachon bekor qilingan");
  await tx.paymentTransaction.update({ where: { id }, data: { reversedAt: new Date(), reversedById: actor.actorId ?? null, reverseReason: reason } });
  const today = toDbDate();
  const byPayment = new Map<string, { p: (typeof t.allocations)[number]["payment"]; amount: number }>();
  for (const a of t.allocations) {
    const cur = byPayment.get(a.paymentId) ?? { p: a.payment, amount: 0 };
    cur.amount += a.amount;
    byPayment.set(a.paymentId, cur);
  }
  for (const { p, amount } of byPayment.values()) {
    const paidAmount = Math.max(0, p.paidAmount - amount);
    await tx.payment.update({
      where: { id: p.id },
      data: p.status === "CANCELLED" ? { paidAmount } : { paidAmount, status: p.dueDate < today ? "OVERDUE" : "PENDING", paidAt: null, method: null },
    });
  }
  await applyCredit(tx, t.studentId);
  const bal = await studentBalance(tx, t.studentId);
  await writeAudit(tx, {
    ...actor,
    action: "payment.reverse",
    entityType: "PaymentTransaction",
    entityId: id,
    summary: `${t.student.fullName}: ${fmtMoney(t.amount)} tushum bekor qilindi (${t.receiptNo}) — ${reason}`,
    before: { studentId: t.studentId, amount: t.amount, receiptNo: t.receiptNo, reversed: false },
    after: { studentId: t.studentId, amount: t.amount, receiptNo: t.receiptNo, reversed: true, reason, reopened: [...byPayment.keys()], outstanding: bal.outstanding },
  });
  await notifyParents(tx, t.studentId, {
    type: "payment.reversed",
    title: "Toʻlov bekor qilindi",
    body: `${t.student.fullName}: ${fmtMoney(t.amount)} (${t.receiptNo}) toʻlovi bekor qilindi — ${reason}.${bal.outstanding > 0 ? ` Qarzdorlik: ${fmtMoney(bal.outstanding)}.` : ""}`,
    link: "/ota-ona/tolovlar",
    payload: { transactionId: id },
  });
  return { id, receiptNo: t.receiptNo, balance: bal };
}

/**
 * Oylik hisob-kitob (idempotent): faol guruhlardagi faol oʻquvchilarga davr uchun hisob yaratadi,
 * mavjud avansni ularga yopadi va (xohlansa) ota-onalarga xabar beradi. Admin tugmasi va 1-sana kroni shuni chaqiradi.
 */
export async function generateCharges(tx: Tx, actor: Actor, opts: { period: string; dueDate: Date; groupId?: string; notify: boolean }) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(424245)`;
  const groupWhere = { status: { not: "FINISHED" as const }, ...(opts.groupId ? { id: opts.groupId } : {}) };
  const enrollments = await tx.groupStudent.findMany({
    where: { status: "ACTIVE", group: groupWhere },
    include: {
      group: { select: { id: true, name: true, monthlyFee: true } },
      student: { select: { id: true, fullName: true, studentProfile: { select: { status: true, code: true } } } },
    },
  });
  const existing = await tx.payment.findMany({
    where: { period: opts.period, groupId: { in: [...new Set(enrollments.map((e) => e.groupId))] } },
    select: { studentId: true, groupId: true },
  });
  const has = new Set(existing.map((e) => `${e.studentId}:${e.groupId}`));
  const inactive = enrollments.filter((e) => e.student.studentProfile?.status !== "ACTIVE");
  const toCreate = enrollments.filter((e) => e.student.studentProfile?.status === "ACTIVE" && e.group.monthlyFee > 0 && !has.has(`${e.studentId}:${e.groupId}`));
  const freeGroups = enrollments.filter((e) => e.group.monthlyFee <= 0).length;
  const waiting = await tx.groupStudent.count({ where: { status: "WAITING", group: groupWhere } });

  const created: { id: string; studentId: string; amount: number; groupName: string; fullName: string }[] = [];
  for (const e of toCreate) {
    const p = await tx.payment.create({
      data: {
        studentId: e.studentId, groupId: e.groupId, period: opts.period, amount: e.group.monthlyFee, status: "PENDING",
        dueDate: opts.dueDate, createdById: actor.actorId ?? null,
      },
      select: { id: true },
    });
    created.push({ id: p.id, studentId: e.studentId, amount: e.group.monthlyFee, groupName: e.group.name, fullName: e.student.fullName });
  }
  // avans bor oʻquvchilarning yangi hisobi darhol yopiladi
  const covered = new Map<string, number>();
  for (const sid of new Set(created.map((c) => c.studentId))) {
    await lockStudent(tx, sid);
    for (const a of await applyCredit(tx, sid)) covered.set(a.paymentId, (covered.get(a.paymentId) ?? 0) + a.amount);
  }
  const totalAmount = created.reduce((a, c) => a + c.amount, 0);
  const coveredByAdvance = [...covered.values()].reduce((a, n) => a + n, 0);
  const skippedExisting = enrollments.length - inactive.length - toCreate.length - freeGroups;
  await writeAudit(tx, {
    ...actor,
    action: "payment.generate",
    entityType: "Payment",
    entityId: opts.period,
    summary: `${fmtPeriod(opts.period)} uchun ${created.length} ta hisob yaratildi (${fmtMoney(totalAmount)}), ${skippedExisting} ta mavjud edi${coveredByAdvance ? `, avansdan ${fmtMoney(coveredByAdvance)} yopildi` : ""}`,
    after: {
      period: opts.period, dueDate: dbDateYmd(opts.dueDate), groupId: opts.groupId ?? null, created: created.length, skippedExisting,
      skippedInactive: inactive.length, waiting, totalAmount, coveredByAdvance,
    },
  });
  if (opts.notify) {
    for (const c of created) {
      const cov = covered.get(c.id) ?? 0;
      const tail = cov >= c.amount ? "Avansdan toʻliq yopildi — toʻlash shart emas." : cov > 0 ? `Avansdan ${fmtMoney(cov)} yopildi, qolgani: ${fmtMoney(c.amount - cov)}.` : `Muddat: ${fmtDbDate(opts.dueDate, false)}.`;
      await notifyParents(tx, c.studentId, {
        type: "payment.new",
        title: "Yangi oylik toʻlov",
        body: `${c.fullName}: ${fmtPeriod(opts.period)} uchun toʻlov — ${fmtMoney(c.amount)} (${c.groupName}). ${tail}`,
        link: "/ota-ona/tolovlar",
        payload: { paymentId: c.id },
      });
    }
  }
  return { period: opts.period, dueDate: dbDateYmd(opts.dueDate), created: created.length, skippedExisting, skippedInactive: inactive.length, waiting, totalAmount, coveredByAdvance };
}
