// Toʻlov muddatlari (har kuni 10:00): ertaga muddati tugaydigan PENDING → eslatma;
// muddati oʻtgan PENDING → OVERDUE (+ audit, ota-ona va adminlarga xabar). Qayta ishga tushirish xavfsiz.
import { prisma } from "../db.js";
import { writeAudit } from "../lib/audit.js";
import { notify, notifyParents } from "../lib/notify.js";
import { addDays, ymdTz } from "../lib/dates.js";
import { fmtDbDate, fmtMoney, fmtPeriod } from "../bot/format.js";
import type { Log } from "../bot/bot.js";

const dateCol = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

const select = {
  id: true, studentId: true, amount: true, period: true, dueDate: true,
  group: { select: { name: true } },
  student: { select: { fullName: true } },
} as const;

export async function runPaymentJobs(now = new Date(), log: Log = console) {
  const today = dateCol(ymdTz(now));
  const tomorrow = dateCol(ymdTz(addDays(now, 1)));

  // 1) Eslatma: muddati ertaga
  const dueTomorrow = await prisma.payment.findMany({ where: { status: "PENDING", dueDate: tomorrow }, select });
  let reminders = 0;
  for (const p of dueTomorrow) {
    const already = await prisma.notification.findFirst({ where: { type: "payment.due", payload: { path: ["paymentId"], equals: p.id } }, select: { id: true } });
    if (already) continue;
    const what = `${fmtPeriod(p.period)}${p.group ? ` · ${p.group.name}` : ""}`;
    reminders += await prisma.$transaction((tx) =>
      notifyParents(tx, p.studentId, {
        type: "payment.due",
        title: "Toʻlov muddati ertaga",
        body: `${p.student.fullName}: ${what} uchun toʻlov — ${fmtMoney(p.amount)}. Toʻlov muddati: ${fmtDbDate(p.dueDate)}.`,
        link: "/ota-ona",
        payload: { paymentId: p.id },
      }),
    );
  }

  // 2) Muddati oʻtdi: PENDING → OVERDUE (har bir qator shartli yangilanadi — ikki nusxa bir-birini takrorlamaydi)
  const late = await prisma.payment.findMany({ where: { status: "PENDING", dueDate: { lt: today } }, select, orderBy: { dueDate: "asc" } });
  const marked: typeof late = [];
  for (const p of late) {
    try {
      const ok = await prisma.$transaction(async (tx) => {
        const r = await tx.payment.updateMany({ where: { id: p.id, status: "PENDING" }, data: { status: "OVERDUE" } });
        if (r.count !== 1) return false;
        const what = `${fmtPeriod(p.period)}${p.group ? ` · ${p.group.name}` : ""}`;
        await writeAudit(tx, {
          actorId: null, actorRole: null, action: "payment.overdue", entityType: "Payment", entityId: p.id,
          summary: `${p.student.fullName} — ${what} toʻlovi muddati oʻtdi (${fmtMoney(p.amount)}, muddat ${fmtDbDate(p.dueDate)})`,
          before: { status: "PENDING" }, after: { status: "OVERDUE" },
        });
        await notifyParents(tx, p.studentId, {
          type: "payment.overdue",
          title: "Toʻlov muddati oʻtdi",
          body: `${p.student.fullName}: ${what} uchun ${fmtMoney(p.amount)} toʻlov muddati (${fmtDbDate(p.dueDate)}) oʻtdi. Iltimos, toʻlovni amalga oshiring yoki markaz bilan bogʻlaning.`,
          link: "/ota-ona",
          payload: { paymentId: p.id },
        });
        return true;
      });
      if (ok) marked.push(p);
    } catch (e) {
      log.error(e, `Toʻlov OVERDUE qilinmadi (${p.id})`);
    }
  }

  // Adminlarga bitta umumlashtirilgan xabar (har bir toʻlov uchun alohida emas)
  let adminsNotified = 0;
  if (marked.length) {
    const total = marked.reduce((s, p) => s + p.amount, 0);
    const list = marked.slice(0, 10).map((p) => `• ${p.student.fullName} — ${fmtPeriod(p.period)}, ${fmtMoney(p.amount)}`);
    if (marked.length > 10) list.push(`… va yana ${marked.length - 10} ta`);
    const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
    await prisma.$transaction(async (tx) => {
      for (const a of admins) {
        await notify(tx, {
          userId: a.id,
          type: "payment.overdue",
          title: `${marked.length} ta toʻlov muddati oʻtdi`,
          body: [`Jami: ${fmtMoney(total)}.`, ...list].join("\n"),
          link: "/admin",
          payload: { paymentIds: marked.map((p) => p.id) },
        });
      }
    });
    adminsNotified = admins.length;
  }
  return { dueTomorrow: dueTomorrow.length, reminders, overdue: marked.length, adminsNotified };
}
