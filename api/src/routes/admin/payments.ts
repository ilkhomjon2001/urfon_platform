// Admin → Toʻlovlar. Ikki qatlam (lib/billing.ts, Tarbion modeli): oylik hisoblar (Payment) va kassaga kelgan pul —
// tushumlar (PaymentTransaction). Pul eng eski qarzdan boshlab taqsimlanadi, ortigʻi avans. Bekor qilish — storno.
import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../db.js";
import { auditCtx, idParam, pageQuery, paged, paginate, parse, zYmd } from "../../lib/http.js";
import { writeAudit } from "../../lib/audit.js";
import { notifyParents } from "../../lib/notify.js";
import { badRequest, conflict, notFound } from "../../lib/errors.js";
import { addDays, atTz, ymdTz } from "../../lib/dates.js";
import { allBalances, generateCharges, lockStudent, receivePayment, reverseTransaction, studentBalance } from "../../lib/billing.js";
import {
  csvDate,
  csvDateTime,
  currentPeriod,
  dateOnly,
  dayMonth,
  effectiveStatus,
  fmtMoney,
  METHOD_LABEL,
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
const zAmount = z.number().int().min(1000, "Summa kamida 1 000 soʻm").max(100_000_000);

// ─────────── Oylik hisoblar ───────────

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
        { allocations: { some: { transaction: { receiptNo: { contains: t, mode: "insensitive" } } } } },
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
  allocations: {
    where: { transaction: { reversedAt: null } },
    orderBy: { createdAt: "asc" as const },
    select: { amount: true, transaction: { select: { id: true, receiptNo: true, paidAt: true, method: true } } },
  },
} satisfies Prisma.PaymentInclude;
type Row = Prisma.PaymentGetPayload<{ include: typeof include }>;

function mapRow(p: Row, today = todayDateOnly()) {
  const status = effectiveStatus(p, today);
  const daysOverdue = status === "OVERDUE" ? Math.max(0, Math.round((today.getTime() - p.dueDate.getTime()) / 86_400_000)) : 0;
  const paidAmount = status === "PAID" ? p.amount : p.paidAmount;
  const receipts = p.allocations.map((a) => ({
    transactionId: a.transaction.id, receiptNo: a.transaction.receiptNo, amount: a.amount, paidAt: a.transaction.paidAt, method: a.transaction.method,
  }));
  const last = receipts[receipts.length - 1];
  return {
    id: p.id,
    student: { id: p.student.id, fullName: p.student.fullName, code: p.student.studentProfile?.code ?? "", status: p.student.studentProfile?.status ?? null },
    group: p.group ? { id: p.group.id, code: p.group.code, name: p.group.name, room: p.group.room?.name ?? null, teacher: p.group.teacher?.fullName ?? null } : null,
    period: p.period,
    amount: p.amount,
    paidAmount,
    outstanding: status === "CANCELLED" ? 0 : p.amount - paidAmount,
    status,
    rawStatus: p.status,
    dueDate: ymdOfDateOnly(p.dueDate),
    daysOverdue,
    paidAt: p.paidAt ?? last?.paidAt ?? null,
    method: p.method ?? last?.method ?? null,
    receiptNo: last?.receiptNo ?? p.receiptNo,
    receipts,
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

// ─────────── Tushumlar (kassaga kelgan pul) ───────────

const txInclude = {
  student: { select: { id: true, fullName: true, studentProfile: { select: { code: true } } } },
  createdBy: { select: { fullName: true } },
  reversedBy: { select: { fullName: true } },
  allocations: {
    orderBy: { createdAt: "asc" as const },
    select: { amount: true, payment: { select: { id: true, period: true, group: { select: { id: true, name: true } } } } },
  },
} satisfies Prisma.PaymentTransactionInclude;
type TxRow = Prisma.PaymentTransactionGetPayload<{ include: typeof txInclude }>;

function mapTx(t: TxRow) {
  const allocated = t.allocations.reduce((s, a) => s + a.amount, 0);
  return {
    id: t.id,
    student: { id: t.student.id, fullName: t.student.fullName, code: t.student.studentProfile?.code ?? "" },
    amount: t.amount,
    method: t.method,
    paidAt: t.paidAt,
    receiptNo: t.receiptNo,
    note: t.note,
    createdAt: t.createdAt,
    createdBy: t.createdBy?.fullName ?? null,
    reversed: t.reversedAt ? { at: t.reversedAt, by: t.reversedBy?.fullName ?? null, reason: t.reverseReason } : null,
    allocations: t.allocations.map((a) => ({
      paymentId: a.payment.id, period: a.payment.period, periodLabel: periodLabel(a.payment.period), amount: a.amount, group: a.payment.group,
    })),
    /** taqsimlanmagan qism (avans) */
    advance: t.reversedAt ? 0 : t.amount - allocated,
  };
}

const txFilter = z.object({
  q: z.string().trim().max(100).optional(),
  from: zYmd.optional(),
  to: zYmd.optional(),
  method: zMethod.optional(),
  studentId: z.string().max(40).optional(),
  reversed: z.enum(["exclude", "only"]).optional(),
});
const txList = pageQuery.merge(txFilter);

function txWhere(f: z.infer<typeof txFilter>): Prisma.PaymentTransactionWhereInput {
  const and: Prisma.PaymentTransactionWhereInput[] = [];
  if (f.from) and.push({ paidAt: { gte: atTz(f.from, "00:00") } });
  if (f.to) and.push({ paidAt: { lt: addDays(atTz(f.to, "00:00"), 1) } });
  if (f.method) and.push({ method: f.method });
  if (f.studentId) and.push({ studentId: f.studentId });
  if (f.reversed === "exclude") and.push({ reversedAt: null });
  else if (f.reversed === "only") and.push({ reversedAt: { not: null } });
  if (f.q) {
    const t = f.q.trim().replace(/^#/, "");
    and.push({
      OR: [
        { student: { fullName: { contains: t, mode: "insensitive" } } },
        { student: { studentProfile: { code: { contains: t, mode: "insensitive" } } } },
        { receiptNo: { contains: t, mode: "insensitive" } },
        { note: { contains: t, mode: "insensitive" } },
      ],
    });
  }
  return { AND: and };
}

async function centerInfo(studentId: string) {
  const [branch, parents] = await Promise.all([
    prisma.branch.findFirst({ orderBy: { name: "asc" } }),
    prisma.parentStudent.findMany({ where: { studentId }, include: { parent: { select: { fullName: true } } } }),
  ]);
  return {
    payers: parents.map((x) => `${x.parent.fullName} (${x.relation})`),
    center: { name: "URFON oʻquv markazi", branch: branch?.name ?? null, address: branch?.address ?? null, phone: branch?.phone ?? null },
  };
}

/** Tushum kvitansiyasi (chop etish uchun). */
async function transactionReceipt(id: string) {
  const t = await prisma.paymentTransaction.findUnique({ where: { id }, include: txInclude });
  if (!t) throw notFound("Kvitansiya topilmadi");
  const m = mapTx(t);
  const periods = [...new Set(m.allocations.map((a) => a.period))].sort();
  const groups = [...new Map(m.allocations.filter((a) => a.group).map((a) => [a.group!.id, a.group!.name])).values()];
  return {
    id: t.id,
    transactionId: t.id,
    receiptNo: t.receiptNo,
    status: t.reversedAt ? ("CANCELLED" as const) : ("PAID" as const),
    paidAt: t.paidAt,
    method: t.method,
    methodLabel: METHOD_LABEL[t.method],
    amount: t.amount,
    amountLabel: fmtMoney(t.amount),
    period: periods[0] ?? null,
    periodLabel: periods.length ? periods.map(periodLabel).join(", ") : "Avans (keyingi oylar uchun)",
    note: t.note,
    student: m.student,
    group: groups.length ? { name: groups.join(", "), code: "" } : null,
    allocations: m.allocations,
    advance: m.advance,
    reversed: m.reversed,
    cashier: m.createdBy,
    ...(await centerInfo(t.studentId)),
  };
}

// ─────────── Qarzdorlar / balans ───────────

const balQuery = pageQuery.extend({
  groupId: z.string().max(40).optional(),
  filter: z.enum(["all", "debtors", "overdue", "partial", "advance", "clear", "none"]).default("all"),
  sort: z.enum(["debt", "name", "lastPaid"]).default("debt"),
});

type BalanceState = "overdue" | "partial" | "debt" | "advance" | "clear" | "none";

const studentSelect = {
  id: true,
  fullName: true,
  phone: true,
  studentProfile: { select: { code: true, status: true } },
  enrollments: {
    where: { status: { in: ["ACTIVE", "WAITING"] as ("ACTIVE" | "WAITING")[] } },
    orderBy: { joinedAt: "desc" as const },
    select: { status: true, group: { select: { id: true, name: true, monthlyFee: true, status: true } } },
  },
  parents: {
    orderBy: { createdAt: "asc" as const },
    select: { relation: true, parent: { select: { fullName: true, phone: true, telegramLink: { select: { isActive: true } } } } },
  },
} satisfies Prisma.UserSelect;
type StudentLite = Prisma.UserGetPayload<{ select: typeof studentSelect }>;

function studentDto(s: StudentLite) {
  const active = s.enrollments.find((e) => e.status === "ACTIVE") ?? s.enrollments[0];
  return {
    student: { id: s.id, fullName: s.fullName, code: s.studentProfile?.code ?? "", status: s.studentProfile?.status ?? null, phone: s.phone },
    groups: s.enrollments.map((e) => ({ id: e.group.id, name: e.group.name, monthlyFee: e.group.monthlyFee, waiting: e.status === "WAITING" })),
    monthlyFee: active?.group.monthlyFee ?? null,
    parents: s.parents.map((p) => ({ fullName: p.parent.fullName, phone: p.parent.phone, relation: p.relation, telegramLinked: !!p.parent.telegramLink?.isActive })),
  };
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
      ["Oʻquvchi", "Kod", "Guruh", "Davr", "Summa (soʻm)", "Toʻlangan (soʻm)", "Qoldiq (soʻm)", "Holat", "Muddat", "Toʻlangan vaqt", "Usul", "Kvitansiya", "Izoh"],
      rows.map((r) => {
        const m = mapRow(r, today);
        return [
          m.student.fullName, m.student.code, m.group?.name ?? "", m.period, m.amount, m.paidAmount, m.outstanding, PAY_STATUS_LABEL[m.status],
          csvDate(r.dueDate), csvDateTime(m.paidAt), m.method ? METHOD_LABEL[m.method] : "", m.receipts.map((x) => x.receiptNo).join("; ") || (m.receiptNo ?? ""), r.note ?? "",
        ];
      }),
    );
    return sendCsv(reply, `tolovlar-${f.period ?? "barchasi"}.csv`, csv);
  });

  // ── Qarzdorlar / balans (Tarbion: "Hammasi / Qarzdorlar / Yarim toʻlagan / Toʻlagan / Hisobsiz") ──
  app.get("/payments/balances", async (req) => {
    const q = parse(balQuery, req.query);
    const bal = await allBalances();
    const withMoney = [...bal.entries()].filter(([, b]) => b.outstanding > 0 || b.advance > 0).map(([id]) => id);
    const and: Prisma.UserWhereInput[] = [
      { role: "STUDENT", studentProfile: { isNot: null } },
      { OR: [{ studentProfile: { status: { not: "LEFT" } } }, { id: { in: withMoney } }] },
    ];
    if (q.q) {
      const t = q.q.trim().replace(/^#/, "");
      const digits = t.replace(/\D/g, "");
      and.push({
        OR: [
          { fullName: { contains: t, mode: "insensitive" } },
          { studentProfile: { code: { contains: t, mode: "insensitive" } } },
          { parents: { some: { parent: { fullName: { contains: t, mode: "insensitive" } } } } },
          ...(digits.length >= 3 ? [{ parents: { some: { parent: { phone: { contains: digits } } } } }] : []),
        ],
      });
    }
    if (q.groupId) and.push({ enrollments: { some: { groupId: q.groupId, status: { in: ["ACTIVE", "WAITING"] } } } });
    const students = await prisma.user.findMany({ where: { AND: and }, select: studentSelect });

    const rows = students.map((s) => {
      const b = bal.get(s.id);
      const outstanding = b?.outstanding ?? 0;
      const advance = b?.advance ?? 0;
      const state: BalanceState =
        (b?.overdue ?? 0) > 0 ? "overdue"
        : outstanding > 0 ? ((b?.partialCount ?? 0) > 0 ? "partial" : "debt")
        : advance > 0 ? "advance"
        : (b?.chargeCount ?? 0) > 0 || (b?.paid ?? 0) > 0 ? "clear"
        : "none";
      return {
        ...studentDto(s),
        charged: b?.charged ?? 0,
        paid: b?.paid ?? 0,
        outstanding,
        overdue: b?.overdue ?? 0,
        advance,
        balance: advance - outstanding,
        openCount: b?.openCount ?? 0,
        partialCount: b?.partialCount ?? 0,
        oldestDue: ymdOfDateOnly(b?.oldestDue ?? null),
        lastPaidAt: b?.lastPaidAt ?? null,
        state,
      };
    });
    type BRow = (typeof rows)[number];
    const is: Record<typeof q.filter, (r: BRow) => boolean> = {
      all: () => true,
      debtors: (r) => r.outstanding > 0,
      overdue: (r) => r.overdue > 0,
      partial: (r) => r.state === "partial",
      advance: (r) => r.advance > 0,
      clear: (r) => r.state === "clear" || r.state === "advance",
      none: (r) => r.state === "none",
    };
    const counts = Object.fromEntries((Object.keys(is) as (keyof typeof is)[]).map((k) => [k, rows.filter(is[k]).length])) as Record<keyof typeof is, number>;
    const totals = {
      outstanding: rows.reduce((s, r) => s + r.outstanding, 0),
      overdue: rows.reduce((s, r) => s + r.overdue, 0),
      advance: rows.reduce((s, r) => s + r.advance, 0),
      debtors: counts.debtors,
    };
    const list = rows.filter(is[q.filter]);
    list.sort((a, b) =>
      q.sort === "name"
        ? a.student.fullName.localeCompare(b.student.fullName)
        : q.sort === "lastPaid"
          ? (b.lastPaidAt?.getTime() ?? 0) - (a.lastPaidAt?.getTime() ?? 0)
          : b.outstanding - a.outstanding || b.overdue - a.overdue || a.student.fullName.localeCompare(b.student.fullName),
    );
    const start = (q.page - 1) * q.pageSize;
    return { ...paged(list.slice(start, start + q.pageSize), list.length, q), counts, totals };
  });

  // ── Oʻquvchi toʻlov daftari: balans, hisoblar, tushumlar (qabul qilish oynasi va yon panel) ──
  app.get("/payments/students/:id/ledger", async (req) => {
    const { id } = parse(idParam, req.params);
    const s = await prisma.user.findFirst({ where: { id, role: "STUDENT" }, select: studentSelect });
    if (!s || !s.studentProfile) throw notFound("Oʻquvchi topilmadi");
    const [balance, charges, txs] = await Promise.all([
      studentBalance(prisma, id),
      prisma.payment.findMany({ where: { studentId: id }, include, orderBy: [{ period: "desc" }, { createdAt: "desc" }] }),
      prisma.paymentTransaction.findMany({ where: { studentId: id }, include: txInclude, orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }] }),
    ]);
    const dto = studentDto(s);
    const today = todayDateOnly();
    return {
      ...dto,
      balance,
      suggestedAmount: balance.outstanding > 0 ? balance.outstanding : (dto.monthlyFee ?? 0),
      charges: charges.map((c) => mapRow(c, today)),
      transactions: txs.map(mapTx),
    };
  });

  // ── Kassaga pul kiritish (istalgan summa; eng eski qarzdan yopiladi, ortigʻi avans) ──
  app.post("/payments/receive", async (req) => {
    const body = parse(
      z.object({ studentId: z.string().min(1).max(40), amount: zAmount, method: zMethod, paidAt: zPaidAt, note: z.string().trim().max(300).optional() }),
      req.body,
    );
    const paidAt = resolvePaidAt(body.paidAt);
    const r = await prisma.$transaction((tx) =>
      receivePayment(tx, auditCtx(req), { studentId: body.studentId, amount: body.amount, method: body.method, paidAt, note: body.note }),
    );
    const t = await prisma.paymentTransaction.findUniqueOrThrow({ where: { id: r.transaction.id }, include: txInclude });
    return { transaction: mapTx(t), balance: r.balance };
  });

  // ── Tushumlar (kassa daftari) ──
  app.get("/payments/transactions", async (req) => {
    const q = parse(txList, req.query);
    const where = txWhere(q);
    const [total, rows, byMethod] = await Promise.all([
      prisma.paymentTransaction.count({ where }),
      prisma.paymentTransaction.findMany({ where, include: txInclude, orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }], ...paginate(q) }),
      prisma.paymentTransaction.groupBy({ by: ["method"], where: { AND: [where, { reversedAt: null }] }, _sum: { amount: true }, _count: { _all: true } }),
    ]);
    const methods = byMethod
      .map((m) => ({ method: m.method, label: METHOD_LABEL[m.method], amount: m._sum.amount ?? 0, count: m._count._all }))
      .sort((a, b) => b.amount - a.amount);
    return {
      ...paged(rows.map(mapTx), total, q),
      totals: { amount: methods.reduce((s, m) => s + m.amount, 0), count: methods.reduce((s, m) => s + m.count, 0), methods },
    };
  });

  app.get("/payments/transactions/export.csv", async (req, reply) => {
    const f = parse(txFilter, req.query);
    const rows = await prisma.paymentTransaction.findMany({ where: txWhere(f), include: txInclude, orderBy: [{ paidAt: "desc" }], take: 20_000 });
    const csv = toCsv(
      ["Kvitansiya", "Sana", "Oʻquvchi", "Kod", "Summa (soʻm)", "Usul", "Qaysi oylar", "Avans (soʻm)", "Qabul qildi", "Izoh", "Holat"],
      rows.map((t) => {
        const m = mapTx(t);
        return [
          m.receiptNo, csvDateTime(m.paidAt), m.student.fullName, m.student.code, m.amount, METHOD_LABEL[m.method],
          m.allocations.map((a) => `${a.periodLabel}: ${a.amount}`).join("; "), m.advance, m.createdBy ?? "", m.note ?? "",
          m.reversed ? `Bekor qilingan: ${m.reversed.reason ?? ""}` : "Qabul qilingan",
        ];
      }),
    );
    return sendCsv(reply, `tushumlar-${f.from ?? "boshidan"}-${f.to ?? ymdTz()}.csv`, csv);
  });

  app.get("/payments/transactions/:id/receipt", async (req) => {
    const { id } = parse(idParam, req.params);
    return transactionReceipt(id);
  });

  // ── Storno: tushum bekor qilinadi (yozuv qoladi), yopgan oylari qayta ochiladi ──
  app.post("/payments/transactions/:id/reverse", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(z.object({ reason: z.string().trim().min(3, "Sababini yozing").max(300) }), req.body);
    return prisma.$transaction((tx) => reverseTransaction(tx, auditCtx(req), id, body.reason));
  });

  // ── Oylik hisob-kitob (idempotent; avans darhol yopiladi) ──
  app.post("/payments/generate", async (req) => {
    const body = parse(
      z.object({ period: zPeriod, dueDate: zYmd, groupId: z.string().max(40).optional(), notify: z.boolean().default(true) }),
      req.body,
    );
    if (body.groupId && !(await prisma.group.findUnique({ where: { id: body.groupId }, select: { id: true } }))) throw notFound("Guruh topilmadi");
    return prisma.$transaction(
      (tx) => generateCharges(tx, auditCtx(req), { period: body.period, dueDate: dateOnly(body.dueDate), groupId: body.groupId, notify: body.notify }),
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
        amount: zAmount,
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
      if (dup) throw conflict(`${periodLabel(body.period)} uchun bu guruh hisobi allaqachon mavjud — roʻyxatdan «Qabul qilish» tugmasini ishlating`, "PAYMENT_EXISTS");
    }
    const paidAt = body.pay ? resolvePaidAt(body.pay.paidAt) : null;
    const res = await prisma.$transaction(async (tx) => {
      await lockStudent(tx, body.studentId);
      const created = await tx.payment.create({
        data: {
          studentId: body.studentId, groupId: body.groupId ?? null, period: body.period, amount: body.amount,
          dueDate: dateOnly(body.dueDate), note: body.note ?? null, createdById: req.auth.userId,
        },
        select: { id: true },
      });
      await writeAudit(tx, {
        ...auditCtx(req), action: "payment.create", entityType: "Payment", entityId: created.id,
        summary: `${student.fullName}: ${fmtMoney(body.amount)} hisob yaratildi (${periodLabel(body.period)})`,
        after: { studentId: body.studentId, groupId: body.groupId ?? null, period: body.period, amount: body.amount, dueDate: body.dueDate, note: body.note ?? null, status: "PENDING" },
      });
      if (body.pay && paidAt) {
        const r = await receivePayment(tx, auditCtx(req), { studentId: body.studentId, amount: body.amount, method: body.pay.method, paidAt, first: created.id });
        return { id: created.id, transactionId: r.transaction.id, receiptNo: r.transaction.receiptNo };
      }
      await notifyParents(tx, body.studentId, {
        type: "payment.new",
        title: "Yangi toʻlov",
        body: `${student.fullName} uchun toʻlov: ${fmtMoney(body.amount)} (${periodLabel(body.period)}). Muddat: ${dayMonth(dateOnly(body.dueDate))}.`,
        link: "/ota-ona/tolovlar",
        payload: { paymentId: created.id },
      });
      return { id: created.id, transactionId: null, receiptNo: null };
    });
    const row = await prisma.payment.findUniqueOrThrow({ where: { id: res.id }, include });
    return { ...mapRow(row), transactionId: res.transactionId, receiptNo: res.receiptNo ?? mapRow(row).receiptNo };
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

  // ── Hisobni qabul qilish: tushum yaratiladi va avval shu hisobga taqsimlanadi (qisman ham mumkin) ──
  app.post("/payments/:id/pay", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(
      z.object({ method: zMethod, paidAt: zPaidAt, note: z.string().trim().max(300).optional(), amount: zAmount.optional() }),
      req.body,
    );
    const paidAt = resolvePaidAt(body.paidAt);
    const r = await prisma.$transaction(async (tx) => {
      const head = await tx.payment.findUnique({ where: { id }, select: { studentId: true } });
      if (!head) throw notFound("Toʻlov topilmadi");
      await lockStudent(tx, head.studentId);
      const p = await tx.payment.findUniqueOrThrow({ where: { id }, select: { studentId: true, status: true, amount: true, paidAmount: true } });
      if (p.status === "PAID") throw conflict("Bu hisob allaqachon toʻliq toʻlangan", "ALREADY_PAID");
      if (p.status === "CANCELLED") throw badRequest("Bekor qilingan hisobni qabul qilib boʻlmaydi");
      return receivePayment(tx, auditCtx(req), {
        studentId: p.studentId, amount: body.amount ?? p.amount - p.paidAmount, method: body.method, paidAt, note: body.note, first: id,
      });
    });
    const updated = await prisma.payment.findUniqueOrThrow({ where: { id }, include });
    return { ...mapRow(updated), transactionId: r.transaction.id, receiptNo: r.transaction.receiptNo, balance: r.balance };
  });

  // ── Hisobni bekor qilish (unga pul taqsimlanmagan boʻlsa) ──
  app.post("/payments/:id/cancel", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(z.object({ reason: z.string().trim().min(3, "Sababini yozing").max(300) }), req.body);
    return prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "Payment" WHERE id = ${id} FOR UPDATE`;
      if (!locked.length) throw notFound("Toʻlov topilmadi");
      const p = await tx.payment.findUniqueOrThrow({ where: { id }, include });
      if (p.status === "CANCELLED") throw badRequest("Hisob allaqachon bekor qilingan");
      if (p.paidAmount > 0 || p.allocations.length) {
        throw badRequest("Bu hisobga toʻlov taqsimlangan — avval «Tushumlar» boʻlimida tegishli toʻlovni bekor qiling (storno)");
      }
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
    const due = p.amount - p.paidAmount;
    const recent = await prisma.notification.findFirst({
      where: { type: "payment.reminder", createdAt: { gte: new Date(Date.now() - 6 * 3600_000) }, payload: { path: ["paymentId"], equals: id } },
    });
    if (recent) throw conflict("Eslatma soʻnggi 6 soat ichida allaqachon yuborilgan", "REMINDER_RECENT");
    return prisma.$transaction(async (tx) => {
      const partial = p.paidAmount > 0 ? ` (${fmtMoney(p.paidAmount)} toʻlangan, qoldiq ${fmtMoney(due)})` : "";
      const sent = await notifyParents(tx, p.studentId, {
        type: "payment.reminder",
        title: status === "OVERDUE" ? "Toʻlov muddati oʻtdi" : "Toʻlov eslatmasi",
        body:
          status === "OVERDUE"
            ? `${p.student.fullName} uchun ${periodLabel(p.period)} toʻlovi (${fmtMoney(p.amount)})${partial} muddati ${dayMonth(p.dueDate)} kuni oʻtgan. Iltimos, ${fmtMoney(due)} ni toʻlang.`
            : `${p.student.fullName} uchun ${periodLabel(p.period)} toʻlovi: ${fmtMoney(due)}${partial}. Muddat: ${dayMonth(p.dueDate)}.`,
        link: "/ota-ona/tolovlar",
        payload: { paymentId: id },
      });
      if (!sent) throw badRequest("Oʻquvchiga ota-ona bogʻlanmagan");
      await writeAudit(tx, {
        ...auditCtx(req), action: "payment.remind", entityType: "Payment", entityId: id,
        summary: `${p.student.fullName}: toʻlov eslatmasi ${sent} ta ota-onaga yuborildi (${fmtMoney(due)})`,
        after: { studentId: p.studentId, status, due, parents: sent },
      });
      return { sent };
    });
  });

  // ── Chop etiladigan kvitansiya: hisobni oxirgi yopgan tushum (eski yozuvlarda — hisobning oʻzi) ──
  app.get("/payments/:id/receipt", async (req) => {
    const { id } = parse(idParam, req.params);
    const p = await prisma.payment.findUnique({ where: { id }, include });
    if (!p) throw notFound("Toʻlov topilmadi");
    const last = p.allocations[p.allocations.length - 1];
    if (last) return transactionReceipt(last.transaction.id);
    if (!p.receiptNo || !p.paidAt) throw badRequest("Bu hisob boʻyicha hali toʻlov qabul qilinmagan — kvitansiya yoʻq");
    const payEntry = await prisma.auditLog.findFirst({
      where: { entityType: "Payment", entityId: id, action: "payment.pay" },
      orderBy: { id: "desc" },
      select: { actor: { select: { fullName: true } } },
    });
    return {
      id: p.id,
      transactionId: null,
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
      student: { id: p.student.id, fullName: p.student.fullName, code: p.student.studentProfile?.code ?? "" },
      group: p.group ? { name: p.group.name, code: p.group.code } : null,
      allocations: [{ paymentId: p.id, period: p.period, periodLabel: periodLabel(p.period), amount: p.amount, group: p.group ? { id: p.group.id, name: p.group.name } : null }],
      advance: 0,
      reversed: null,
      cashier: payEntry?.actor?.fullName ?? null,
      ...(await centerInfo(p.studentId)),
    };
  });
}
