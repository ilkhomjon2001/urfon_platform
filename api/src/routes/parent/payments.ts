// GET /api/parent/payments?studentId= — farzand balansi (qarz / avans), oylik hisoblar (qisman toʻlov bilan),
// tushumlar va kvitansiyalar. Onlayn toʻlov integratsiyasi hozircha yoʻq — yoʻriqnoma web'da matn.
import type { FastifyInstance } from "fastify";
import { config } from "../../config.js";
import { prisma } from "../../db.js";
import { METHOD_LABEL, studentBalance } from "../../lib/billing.js";
import { parse } from "../../lib/http.js";
import { periodOf, toDbDate, ymdTz } from "../../lib/dates.js";
import { childQuery, loadChild } from "./common.js";

export default async function payments(app: FastifyInstance) {
  app.get("/payments", async (req) => {
    const { studentId } = parse(childQuery, req.query);
    const child = await loadChild(req.auth.userId, studentId);
    const now = new Date();
    const period = periodOf(now);
    const today = toDbDate();

    const [rows, txs, balance] = await Promise.all([
      prisma.payment.findMany({
        where: { studentId: child.id, status: { not: "CANCELLED" } },
        orderBy: [{ period: "desc" }, { dueDate: "desc" }],
        select: {
          id: true, period: true, amount: true, paidAmount: true, status: true, dueDate: true, paidAt: true, method: true, receiptNo: true, note: true, createdAt: true,
          group: { select: { id: true, code: true, name: true } },
          allocations: {
            where: { transaction: { reversedAt: null } },
            orderBy: { createdAt: "asc" },
            select: { amount: true, transaction: { select: { id: true, receiptNo: true, paidAt: true, method: true } } },
          },
        },
      }),
      prisma.paymentTransaction.findMany({
        where: { studentId: child.id },
        orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true, amount: true, method: true, paidAt: true, receiptNo: true, note: true, reversedAt: true, reverseReason: true,
          allocations: { orderBy: { createdAt: "asc" }, select: { amount: true, payment: { select: { period: true, group: { select: { name: true } } } } } },
        },
      }),
      studentBalance(prisma, child.id),
    ]);

    const items = rows.map(({ allocations, ...p }) => {
      const status = p.status === "PENDING" && p.dueDate < today ? ("OVERDUE" as const) : p.status;
      const paidAmount = status === "PAID" ? p.amount : p.paidAmount;
      const last = allocations[allocations.length - 1]?.transaction;
      return {
        ...p,
        status,
        paidAmount,
        outstanding: p.amount - paidAmount,
        partial: status !== "PAID" && paidAmount > 0,
        paidAt: p.paidAt ?? last?.paidAt ?? null,
        method: p.method ?? last?.method ?? null,
        receiptNo: last?.receiptNo ?? p.receiptNo,
        transactionId: last?.id ?? null,
      };
    });
    const unpaid = items.filter((p) => p.status === "PENDING" || p.status === "OVERDUE").sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    const current = items.find((p) => p.period === period) ?? unpaid[0] ?? items[0] ?? null;
    const year = period.slice(0, 4);
    const valid = txs.filter((t) => !t.reversedAt);

    const branch = child.info.group?.branch ?? (await prisma.branch.findFirst({ select: { id: true, name: true, address: true, phone: true } }));

    return {
      now,
      period,
      dueDay: config.PAYMENT_DUE_DAY,
      child: {
        id: child.info.id,
        fullName: child.info.fullName,
        code: child.info.code,
        group: child.info.group ? { name: child.info.group.name, code: child.info.group.code, monthlyFee: child.info.group.monthlyFee } : null,
      },
      current,
      summary: {
        outstanding: balance.outstanding,
        outstandingCount: unpaid.length,
        overdue: balance.overdue,
        hasOverdue: balance.overdue > 0,
        advance: balance.advance,
        balance: balance.balance,
        nextDue: unpaid[0] ?? null,
        paidThisYear: valid.filter((t) => ymdTz(t.paidAt).startsWith(year)).reduce((s, t) => s + t.amount, 0)
          // eski (tushumsiz) toʻlangan hisoblar ham hisobga olinsin
          + items.filter((p) => p.status === "PAID" && !p.transactionId && p.period.startsWith(year)).reduce((s, p) => s + p.amount, 0),
        paidCount: valid.length + items.filter((p) => p.status === "PAID" && !p.transactionId).length,
        monthlyFee: child.info.group?.monthlyFee ?? null,
      },
      items,
      transactions: txs.map((t) => ({
        id: t.id,
        amount: t.amount,
        method: t.method,
        methodLabel: METHOD_LABEL[t.method],
        paidAt: t.paidAt,
        receiptNo: t.receiptNo,
        note: t.note,
        reversed: t.reversedAt ? { at: t.reversedAt, reason: t.reverseReason } : null,
        allocations: t.allocations.map((a) => ({ period: a.payment.period, amount: a.amount, group: a.payment.group?.name ?? null })),
        advance: t.reversedAt ? 0 : t.amount - t.allocations.reduce((s, a) => s + a.amount, 0),
      })),
      branch,
    };
  });
}
