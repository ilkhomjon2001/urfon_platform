// GET /api/parent/payments?studentId= — farzand to'lovlari, joriy oy holati, kvitansiya uchun ma'lumot.
// Onlayn to'lov integratsiyasi hozircha yo'q — faqat ko'rish (to'lov yo'riqnomasi web'da matn).
import type { FastifyInstance } from "fastify";
import { prisma } from "../../db.js";
import { parse } from "../../lib/http.js";
import { periodOf } from "../../lib/dates.js";
import { childQuery, loadChild } from "./common.js";

export default async function payments(app: FastifyInstance) {
  app.get("/payments", async (req) => {
    const { studentId } = parse(childQuery, req.query);
    const child = await loadChild(req.auth.userId, studentId);
    const now = new Date();
    const period = periodOf(now);

    const rows = await prisma.payment.findMany({
      where: { studentId: child.id, status: { not: "CANCELLED" } },
      orderBy: [{ period: "desc" }, { dueDate: "desc" }],
      select: {
        id: true, period: true, amount: true, status: true, dueDate: true, paidAt: true, method: true, receiptNo: true, note: true, createdAt: true,
        group: { select: { id: true, code: true, name: true } },
      },
    });

    const unpaid = rows.filter((p) => p.status === "PENDING" || p.status === "OVERDUE").sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    const current = rows.find((p) => p.period === period) ?? unpaid[0] ?? rows[0] ?? null;
    const year = period.slice(0, 4);
    const paidThisYear = rows.filter((p) => p.status === "PAID" && p.period.startsWith(year));

    const branch = child.info.group?.branch ?? (await prisma.branch.findFirst({ select: { id: true, name: true, address: true, phone: true } }));

    return {
      now,
      period,
      child: {
        id: child.info.id,
        fullName: child.info.fullName,
        code: child.info.code,
        group: child.info.group ? { name: child.info.group.name, code: child.info.group.code, monthlyFee: child.info.group.monthlyFee } : null,
      },
      current,
      summary: {
        outstanding: unpaid.reduce((s, p) => s + p.amount, 0),
        outstandingCount: unpaid.length,
        hasOverdue: unpaid.some((p) => p.status === "OVERDUE"),
        nextDue: unpaid[0] ?? null,
        paidThisYear: paidThisYear.reduce((s, p) => s + p.amount, 0),
        paidCount: rows.filter((p) => p.status === "PAID").length,
        monthlyFee: child.info.group?.monthlyFee ?? null,
      },
      items: rows,
      branch,
    };
  });
}
