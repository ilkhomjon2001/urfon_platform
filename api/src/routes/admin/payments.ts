// Admin → Toʻlovlar: operatsion daftar. Oylik hisob-kitob, qabul qilish (kvitansiya), bekor qilish, eslatma, CSV.
import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma, type Tx } from "../../db.js";
import { auditCtx, idParam, pageQuery, paged, paginate, parse, zYmd } from "../../lib/http.js";
import { writeAudit } from "../../lib/audit.js";
import { notifyParents } from "../../lib/notify.js";
import { badRequest, conflict, notFound } from "../../lib/errors.js";
import { atTz, ymdTz } from "../../lib/dates.js";
import {
  csvDate,
  csvDateTime,
  currentPeriod,
  dateOnly,
  dayMonth,
  effectiveStatus,
  fmtMoney,
  METHOD_LABEL,
  nextReceiptNo,
  PAY_STATUS_LABEL,
  paymentStatusWhere,
  paymentTotals,
  periodLabel,
  sendCsv,
  todayDateOnly,
  toCsv,
  ymdOfDateOnly,
  zPeriod,
} from "./b/helpers.js";

const zMethod = z.enum(["CASH", "CARD", "CLICK", "PAYME", "TRANSFER"]);
const zPayStatus = z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]);

const filterQuery = z.object({
  q: z.string().trim().max(100).optional(),
  period: zPeriod.optional(),
  status: zPayStatus.optional(),
  groupId: z.string().max(40).optional(),
  method: zMethod.optional(),
  studentId: z.string().max(40).optional(),
  sort: z.enum(["due", "paidAt", "amount", "name"]).default("name"),
});
const listQuery = pageQuery.merge(filterQuery);
type Filter = z.infer<typeof filterQuery>;

/** Holatdan tashqari filtrlar (jami va tablar shu bo'yicha). */
function baseWhere(f: Filter): Prisma.PaymentWhereInput {
  const and: Prisma.PaymentWhereInput[] = [];
  if (f.period) and.push({ period: f.period });
  if (f.groupId) and.push({ groupId: f.groupId });
  if (f.method) and.push({ method: f.method });
  if (f.studentId) and.push({ studentId: f.studentId });
  if (f.q) {
    const t = f.q.trim().replace(/^#/, "");
    and.push({
      OR: [
        { student: { fullName: { contains: t, mode: "insensitive" } } },
        { student: { studentProfile: { code: { contains: t, mode: "insensitive" } } } },
        { group: { name: { contains: t, mode: "insensitive" } } },
        { receiptNo: { contains: t, mode: "insensitive" } },
      ],
    });
  }
  return { AND: and };
}

const whereOf = (f: Filter): Prisma.PaymentWhereInput =>
  f.status ? { AND: [baseWhere(f), paymentStatusWhere(f.status)] } : baseWhere(f);

const include = {
  student: { select: { id: true, fullName: true, studentProfile: { select: { code: true, status: true } } } },
  group: {
    select: {
      id: true, code: true, name: true,
      room: { select: { name: true } },
      teacher: { select: { fullName: true } },
    },
  },
} satisfies Prisma.PaymentInclude;
type Row = Prisma.PaymentGetPayload<{ include: typeof include }>;

function mapRow(p: Row, today = todayDateOnly()) {
  const status = effectiveStatus(p, today);
  const daysOverdue = status === "OVERDUE" ? Math.max(0, Math.round((today.getTime() - p.dueDate.getTime()) / 86_400_000)) : 0;
  return {
    id: p.id,
    student: { id: p.student.id, fullName: p.student.fullName, code: p.student.studentProfile?.code ?? "", status: p.student.studentProfile?.status ?? null },
    group: p.group ? { id: p.group.id, code: p.group.code, name: p.group.name, room: p.group.room?.name ?? null, teacher: p.group.teacher?.fullName ?? null } : null,
    period: p.period,
    amount: p.amount,
    status,
    rawStatus: p.status,
    dueDate: ymdOfDateOnly(p.dueDate),
    daysOverdue,
    paidAt: p.paidAt,
    method: p.method,
    receiptNo: p.receiptNo,
    note: p.note,
    createdAt: p.createdAt,
  };
}

const orderBy = (sort: Filter["sort"]): Prisma.PaymentOrderByWithRelationInput[] =>
  sort === "due"
    ? [{ dueDate: "asc" }, { student: { fullName: "asc" } }]
    : sort === "paidAt"
      ? [{ paidAt: { sort: "desc", nulls: "last" } }]
      : sort === "amount"
        ? [{ amount: "desc" }]
        : [{ student: { fullName: "asc" } }, { period: "desc" }];

/** paidAt: ISO vaqt yoki "YYYY-MM-DD" (bugun bo'lsa — hozirgi vaqt). Kelajak — 400. */
function resolvePaidAt(v?: string) {
  const now = new Date();
  if (!v) return now;
  let d: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) d = v === ymdTz(now) ? now : atTz(v, "12:00");
  else d = new Date(v);
  if (Number.isNaN(d.getTime())) throw badRequest("Toʻlov sanasi notoʻgʻri");
  if (d.getTime() > now.getTime() + 5 * 60_000) throw badRequest("Toʻlov sanasi kelajakda boʻlishi mumkin emas");
  return d;
}

const zPaidAt = z.union([z.string().datetime({ offset: true }), zYmd]).optional();

async function payInTx(
  tx: Tx,
  req: Parameters<typeof auditCtx>[0],
  id: string,
  body: { method: z.infer<typeof zMethod>; paidAt?: string; note?: string },
) {
  // qatorni qulflash — ikki kassir bir vaqtda bossa ham ikki marta qabul qilinmaydi
  const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "Payment" WHERE id = ${id} FOR UPDATE`;
  if (!locked.length) throw notFound("Toʻlov topilmadi");
  const p = await tx.payment.findUniqueOrThrow({ where: { id }, include });
  if (p.status === "PAID") throw conflict(`Toʻlov allaqachon qabul qilingan (${p.receiptNo ?? "kvitansiyasiz"})`, "ALREADY_PAID");
  if (p.status === "CANCELLED") throw badRequest("Bekor qilingan toʻlovni qabul qilib boʻlmaydi");
  const paidAt = resolvePaidAt(body.paidAt);
  const receiptNo = await nextReceiptNo(tx, paidAt);
  const note = body.note?.trim() ? body.note.trim() : p.note;
  const updated = await tx.payment.update({ where: { id }, data: { status: "PAID", paidAt, method: body.method, receiptNo, note }, include });
  await writeAudit(tx, {
    ...auditCtx(req),
    action: "payment.pay",
    entityType: "Payment",
    entityId: id,
    summary: `${p.student.fullName}: ${fmtMoney(p.amount)} qabul qilindi (${METHOD_LABEL[body.method]}, ${receiptNo})`,
    before: { studentId: p.studentId, status: effectiveStatus(p), amount: p.amount, period: p.period, paidAt: null, method: null, receiptNo: null },
    after: { studentId: p.studentId, status: "PAID", amount: p.amount, period: p.period, paidAt: paidAt.toISOString(), method: body.method, receiptNo, note },
  });
  await notifyParents(tx, p.studentId, {
    type: "payment.received",
    title: "Toʻlov qabul qilindi",
    body: `Toʻlov qabul qilindi: ${fmtMoney(p.amount)} — ${p.student.fullName}, ${periodLabel(p.period)}${p.group ? `, ${p.group.name}` : ""}. Kvitansiya: ${receiptNo}.`,
    link: "/ota-ona/tolovlar",
    payload: { paymentId: id, receiptNo },
  });
  return updated;
}

export default async function payments(app: FastifyInstance) {
  // ── Ro'yxat + jami ──
  app.get("/payments", async (req) => {
    const q = parse(listQuery, req.query);
    const where = whereOf(q);
    const [total, rows, totals] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({ where, include, orderBy: orderBy(q.sort), ...paginate(q) }),
      paymentTotals(baseWhere(q)),
    ]);
    const today = todayDateOnly();
    return { ...paged(rows.map((r) => mapRow(r, today)), total, q), totals };
  });

  /** Mavjud davrlar (tanlagich uchun) — eng yangisi birinchi. */
  app.get("/payments/periods", async () => {
    const rows = await prisma.payment.groupBy({ by: ["period"], _count: { _all: true }, orderBy: { period: "desc" } });
    const current = currentPeriod();
    return { current, latest: rows[0]?.period ?? current, items: rows.map((r) => ({ period: r.period, label: periodLabel(r.period), count: r._count._all })) };
  });

  app.get("/payments/export.csv", async (req, reply) => {
    const f = parse(filterQuery, req.query);
    const rows = await prisma.payment.findMany({ where: whereOf(f), include, orderBy: orderBy(f.sort), take: 10_000 });
    const today = todayDateOnly();
    const csv = toCsv(
      ["Oʻquvchi", "Kod", "Guruh", "Davr", "Summa (soʻm)", "Holat", "Muddat", "Toʻlangan vaqt", "Usul", "Kvitansiya", "Izoh"],
      rows.map((r) => {
        const m = mapRow(r, today);
        return [
          m.student.fullName, m.student.code, m.group?.name ?? "", m.period, m.amount, PAY_STATUS_LABEL[m.status],
          csvDate(r.dueDate), csvDateTime(r.paidAt), r.method ? METHOD_LABEL[r.method] : "", r.receiptNo ?? "", r.note ?? "",
        ];
      }),
    );
    return sendCsv(reply, `tolovlar-${f.period ?? "barchasi"}.csv`, csv);
  });

  // ── Oylik hisob-kitob (idempotent) ──
  app.post("/payments/generate", async (req) => {
    const body = parse(
      z.object({ period: zPeriod, dueDate: zYmd, groupId: z.string().max(40).optional(), notify: z.boolean().default(true) }),
      req.body,
    );
    if (body.groupId && !(await prisma.group.findUnique({ where: { id: body.groupId }, select: { id: true } }))) throw notFound("Guruh topilmadi");
    return prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(424245)`;
        const enrollments = await tx.groupStudent.findMany({
          where: { status: "ACTIVE", group: { status: { not: "FINISHED" } }, ...(body.groupId ? { groupId: body.groupId } : {}) },
          include: {
            group: { select: { id: true, name: true, monthlyFee: true } },
            student: { select: { id: true, fullName: true, studentProfile: { select: { status: true } } } },
          },
        });
        const existing = await tx.payment.findMany({
          where: { period: body.period, groupId: { in: [...new Set(enrollments.map((e) => e.groupId))] } },
          select: { studentId: true, groupId: true },
        });
        const has = new Set(existing.map((e) => `${e.studentId}:${e.groupId}`));
        const inactive = enrollments.filter((e) => e.student.studentProfile?.status !== "ACTIVE");
        const toCreate = enrollments.filter((e) => e.student.studentProfile?.status === "ACTIVE" && !has.has(`${e.studentId}:${e.groupId}`));
        const dueDate = dateOnly(body.dueDate);
        if (toCreate.length) {
          await tx.payment.createMany({
            data: toCreate.map((e) => ({
              studentId: e.studentId, groupId: e.groupId, period: body.period, amount: e.group.monthlyFee,
              status: "PENDING" as const, dueDate, createdById: req.auth.userId,
            })),
          });
        }
        const totalAmount = toCreate.reduce((a, e) => a + e.group.monthlyFee, 0);
        const skipped = enrollments.length - inactive.length - toCreate.length;
        await writeAudit(tx, {
          ...auditCtx(req),
          action: "payment.generate",
          entityType: "Payment",
          entityId: body.period,
          summary: `${periodLabel(body.period)} uchun ${toCreate.length} ta hisob yaratildi (${fmtMoney(totalAmount)}), ${skipped} ta mavjud edi`,
          after: {
            period: body.period, dueDate: body.dueDate, groupId: body.groupId ?? null, created: toCreate.length, skippedExisting: skipped,
            skippedInactive: inactive.length, totalAmount,
          },
        });
        if (body.notify) {
          for (const e of toCreate) {
            await notifyParents(tx, e.studentId, {
              type: "payment.new",
              title: "Yangi oylik toʻlov",
              body: `${periodLabel(body.period)} uchun toʻlov: ${fmtMoney(e.group.monthlyFee)} (${e.group.name}). Muddat: ${dayMonth(dueDate)}.`,
              link: "/ota-ona/tolovlar",
            });
          }
        }
        return { period: body.period, dueDate: body.dueDate, created: toCreate.length, skippedExisting: skipped, skippedInactive: inactive.length, totalAmount };
      },
      { timeout: 60_000 },
    );
  });

  // ── Qo'lda hisob (ixtiyoriy darhol qabul qilish bilan) ──
  app.post("/payments", async (req) => {
    const body = parse(
      z.object({
        studentId: z.string().min(1).max(40),
        groupId: z.string().max(40).optional().nullable(),
        period: zPeriod,
        amount: z.number().int().min(1000, "Summa kamida 1 000 soʻm").max(100_000_000),
        dueDate: zYmd,
        note: z.string().trim().max(300).optional(),
        pay: z.object({ method: zMethod, paidAt: zPaidAt }).optional(),
      }),
      req.body,
    );
    const student = await prisma.user.findFirst({ where: { id: body.studentId, role: "STUDENT" }, select: { id: true, fullName: true } });
    if (!student) throw notFound("Oʻquvchi topilmadi");
    if (body.groupId) {
      const g = await prisma.group.findUnique({ where: { id: body.groupId }, select: { id: true } });
      if (!g) throw notFound("Guruh topilmadi");
      const enr = await prisma.groupStudent.findUnique({ where: { groupId_studentId: { groupId: body.groupId, studentId: body.studentId } } });
      if (!enr) throw badRequest("Oʻquvchi bu guruhda oʻqimaydi");
      const dup = await prisma.payment.findFirst({ where: { studentId: body.studentId, groupId: body.groupId, period: body.period, status: { not: "CANCELLED" } } });
      if (dup) throw conflict(`${periodLabel(body.period)} uchun bu guruh toʻlovi allaqachon mavjud`, "PAYMENT_EXISTS");
    }
    return prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          studentId: body.studentId, groupId: body.groupId ?? null, period: body.period, amount: body.amount,
          dueDate: dateOnly(body.dueDate), note: body.note ?? null, createdById: req.auth.userId,
        },
        include,
      });
      await writeAudit(tx, {
        ...auditCtx(req), action: "payment.create", entityType: "Payment", entityId: created.id,
        summary: `${student.fullName}: ${fmtMoney(body.amount)} hisob yaratildi (${periodLabel(body.period)})`,
        after: { studentId: body.studentId, groupId: body.groupId ?? null, period: body.period, amount: body.amount, dueDate: body.dueDate, note: body.note ?? null, status: "PENDING" },
      });
      if (body.pay) {
        const paid = await payInTx(tx, req, created.id, { method: body.pay.method, paidAt: body.pay.paidAt });
        return mapRow(paid);
      }
      await notifyParents(tx, body.studentId, {
        type: "payment.new",
        title: "Yangi toʻlov",
        body: `${student.fullName} uchun toʻlov: ${fmtMoney(body.amount)} (${periodLabel(body.period)}). Muddat: ${dayMonth(dateOnly(body.dueDate))}.`,
        link: "/ota-ona/tolovlar",
      });
      return mapRow(created);
    });
  });

  app.get("/payments/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const p = await prisma.payment.findUnique({ where: { id }, include });
    if (!p) throw notFound("Toʻlov topilmadi");
    const history = await prisma.auditLog.findMany({
      where: { entityType: "Payment", entityId: id },
      orderBy: { id: "desc" },
      select: { id: true, at: true, action: true, summary: true, actor: { select: { fullName: true } } },
    });
    return { ...mapRow(p), history: history.map((h) => ({ ...h, id: h.id.toString() })) };
  });

  // ── Qabul qilish → PAID + kvitansiya KV-YYYY-MM-#### ──
  app.post("/payments/:id/pay", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(z.object({ method: zMethod, paidAt: zPaidAt, note: z.string().trim().max(300).optional() }), req.body);
    const updated = await prisma.$transaction((tx) => payInTx(tx, req, id, body));
    return mapRow(updated);
  });

  // ── Bekor qilish ──
  app.post("/payments/:id/cancel", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(z.object({ reason: z.string().trim().min(3, "Sababini yozing").max(300) }), req.body);
    return prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "Payment" WHERE id = ${id} FOR UPDATE`;
      if (!locked.length) throw notFound("Toʻlov topilmadi");
      const p = await tx.payment.findUniqueOrThrow({ where: { id }, include });
      if (p.status === "CANCELLED") throw badRequest("Toʻlov allaqachon bekor qilingan");
      const note = [p.note, `Bekor qilindi: ${body.reason}`].filter(Boolean).join(" · ").slice(0, 500);
      const updated = await tx.payment.update({ where: { id }, data: { status: "CANCELLED", note }, include });
      await writeAudit(tx, {
        ...auditCtx(req), action: "payment.cancel", entityType: "Payment", entityId: id,
        summary: `${p.student.fullName}: ${fmtMoney(p.amount)} ${p.status === "PAID" ? "toʻlovi (qabul qilingan) " : "hisobi "}bekor qilindi — ${body.reason}`,
        before: { studentId: p.studentId, status: effectiveStatus(p), amount: p.amount, receiptNo: p.receiptNo },
        after: { studentId: p.studentId, status: "CANCELLED", amount: p.amount, receiptNo: p.receiptNo, reason: body.reason },
      });
      return mapRow(updated);
    });
  });

  // ── Ota-onaga eslatma (Telegram/qo'ng'iroqcha) ──
  app.post("/payments/:id/remind", async (req) => {
    const { id } = parse(idParam, req.params);
    const p = await prisma.payment.findUnique({ where: { id }, include });
    if (!p) throw notFound("Toʻlov topilmadi");
    const status = effectiveStatus(p);
    if (status !== "PENDING" && status !== "OVERDUE") throw badRequest("Eslatma faqat kutilayotgan yoki muddati oʻtgan toʻlov uchun");
    const recent = await prisma.notification.findFirst({
      where: { type: "payment.reminder", createdAt: { gte: new Date(Date.now() - 6 * 3600_000) }, payload: { path: ["paymentId"], equals: id } },
    });
    if (recent) throw conflict("Eslatma soʻnggi 6 soat ichida allaqachon yuborilgan", "REMINDER_RECENT");
    return prisma.$transaction(async (tx) => {
      const sent = await notifyParents(tx, p.studentId, {
        type: "payment.reminder",
        title: status === "OVERDUE" ? "Toʻlov muddati oʻtdi" : "Toʻlov eslatmasi",
        body:
          status === "OVERDUE"
            ? `${p.student.fullName} uchun ${periodLabel(p.period)} toʻlovi (${fmtMoney(p.amount)}) muddati ${dayMonth(p.dueDate)} kuni oʻtgan. Iltimos, toʻlovni amalga oshiring.`
            : `${p.student.fullName} uchun ${periodLabel(p.period)} toʻlovi: ${fmtMoney(p.amount)}. Muddat: ${dayMonth(p.dueDate)}.`,
        link: "/ota-ona/tolovlar",
        payload: { paymentId: id },
      });
      if (!sent) throw badRequest("Oʻquvchiga ota-ona bogʻlanmagan");
      await writeAudit(tx, {
        ...auditCtx(req), action: "payment.remind", entityType: "Payment", entityId: id,
        summary: `${p.student.fullName}: toʻlov eslatmasi ${sent} ta ota-onaga yuborildi`,
        after: { studentId: p.studentId, status, parents: sent },
      });
      return { sent };
    });
  });

  // ── Chop etiladigan kvitansiya ma'lumoti ──
  app.get("/payments/:id/receipt", async (req) => {
    const { id } = parse(idParam, req.params);
    const p = await prisma.payment.findUnique({ where: { id }, include });
    if (!p) throw notFound("Toʻlov topilmadi");
    if (!p.receiptNo || !p.paidAt) throw badRequest("Bu toʻlov hali qabul qilinmagan — kvitansiya yoʻq");
    const [branch, payEntry, parents] = await Promise.all([
      prisma.branch.findFirst({ orderBy: { name: "asc" } }),
      prisma.auditLog.findFirst({ where: { entityType: "Payment", entityId: id, action: "payment.pay" }, orderBy: { id: "desc" }, select: { actor: { select: { fullName: true } } } }),
      prisma.parentStudent.findMany({ where: { studentId: p.studentId }, include: { parent: { select: { fullName: true } } } }),
    ]);
    return {
      id: p.id,
      receiptNo: p.receiptNo,
      status: p.status,
      paidAt: p.paidAt,
      method: p.method,
      methodLabel: p.method ? METHOD_LABEL[p.method] : null,
      amount: p.amount,
      amountLabel: fmtMoney(p.amount),
      period: p.period,
      periodLabel: periodLabel(p.period),
      note: p.note,
      student: { fullName: p.student.fullName, code: p.student.studentProfile?.code ?? "" },
      group: p.group ? { name: p.group.name, code: p.group.code } : null,
      payers: parents.map((x) => `${x.parent.fullName} (${x.relation})`),
      cashier: payEntry?.actor?.fullName ?? null,
      center: { name: "URFON oʻquv markazi", branch: branch?.name ?? null, address: branch?.address ?? null, phone: branch?.phone ?? null },
    };
  });
}
