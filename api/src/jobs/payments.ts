// Toʻlov kronlari (Asia/Tashkent). Hammasi idempotent — qayta ishga tushirish xavfsiz.
//  • billing          — har oyning 1-sanasi 09:00: oylik hisoblar (muddat — PAYMENT_DUE_DAY), avans yopiladi, ota-onaga xabar
//  • payment-reminder — har oyning PAYMENT_DUE_DAY-sanasi 10:00: qarzi borlarning ota-onalariga Telegram eslatma + adminlarga jamlanma
//  • payments         — har kuni 10:00: ertaga muddati tugaydigan hisob (oylik eslatma kuni emas) → eslatma; muddati oʻtgan → OVERDUE
import { config } from "../config.js";
import { prisma } from "../db.js";
import { writeAudit } from "../lib/audit.js";
import { generateCharges, SYSTEM_ACTOR } from "../lib/billing.js";
import { notify, notifyParents } from "../lib/notify.js";
import { addDays, periodOf, toDbDate, ymdTz } from "../lib/dates.js";
import { fmtDbDate, fmtMoney, fmtPeriod } from "../bot/format.js";
import type { Log } from "../bot/bot.js";

const dateCol = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

/** Davrning toʻlov muddati (@db.Date): "2026-10" → 2026-10-05. */
export const dueDateOf = (period: string) => toDbDate(`${period}-${String(config.PAYMENT_DUE_DAY).padStart(2, "0")}`);

const select = {
  id: true, studentId: true, amount: true, paidAmount: true, period: true, dueDate: true,
  group: { select: { name: true } },
  student: { select: { fullName: true } },
} as const;

/** 1-sana: joriy oy uchun hisoblar. */
export async function runMonthlyBilling(now = new Date(), _log: Log = console) {
  const period = periodOf(now);
  return prisma.$transaction((tx) => generateCharges(tx, SYSTEM_ACTOR, { period, dueDate: dueDateOf(period), notify: true }), { timeout: 120_000 });
}

/** Toʻlov kuni (5-sana): qarzi borlarning ota-onalariga bitta jamlangan eslatma (oʻquvchi × davr uchun bir marta). */
export async function runMonthlyReminder(now = new Date(), log: Log = console) {
  const period = periodOf(now);
  const today = dateCol(ymdTz(now));
  const open = await prisma.payment.findMany({
    where: { status: { in: ["PENDING", "OVERDUE"] }, dueDate: { lte: today }, student: { studentProfile: { status: { not: "LEFT" } } } },
    select: { studentId: true, period: true, amount: true, paidAmount: true, student: { select: { fullName: true, studentProfile: { select: { code: true } } } } },
    orderBy: { dueDate: "asc" },
  });
  const by = new Map<string, { name: string; code: string; total: number; current: number; older: number; olderPeriods: Set<string> }>();
  for (const p of open) {
    const due = p.amount - p.paidAmount;
    if (due <= 0) continue;
    const v = by.get(p.studentId) ?? { name: p.student.fullName, code: p.student.studentProfile?.code ?? "", total: 0, current: 0, older: 0, olderPeriods: new Set<string>() };
    v.total += due;
    if (p.period === period) v.current += due;
    else {
      v.older += due;
      v.olderPeriods.add(p.period);
    }
    by.set(p.studentId, v);
  }

  let parents = 0;
  let students = 0;
  let skipped = 0;
  for (const [studentId, v] of by) {
    const already = await prisma.notification.findFirst({
      where: { type: "payment.monthly_reminder", AND: [{ payload: { path: ["studentId"], equals: studentId } }, { payload: { path: ["period"], equals: period } }] },
      select: { id: true },
    });
    if (already) {
      skipped++;
      continue;
    }
    const lines = [
      `${v.name} (#${v.code}) uchun toʻlanishi kerak: ${fmtMoney(v.total)}.`,
      v.current > 0 && v.older > 0
        ? `Shundan ${fmtPeriod(period)}: ${fmtMoney(v.current)}, oldingi oylar qarzi: ${fmtMoney(v.older)}.`
        : v.older > 0
          ? `Oldingi oylar qarzi: ${[...v.olderPeriods].sort().map(fmtPeriod).join(", ")}.`
          : `${fmtPeriod(period)} uchun toʻlov muddati — bugun.`,
      `Toʻlovni markaz kassasida (naqd yoki karta) yoki Click/Payme orqali qiling — izohga oʻquvchi ID raqamini (#${v.code}) yozing.`,
    ];
    try {
      const n = await prisma.$transaction((tx) =>
        notifyParents(tx, studentId, {
          type: "payment.monthly_reminder",
          title: "Oylik toʻlov eslatmasi",
          body: lines.join("\n"),
          link: "/ota-ona/tolovlar",
          payload: { studentId, period, amount: v.total },
        }),
      );
      if (n) {
        parents += n;
        students++;
      }
    } catch (e) {
      log.error(e, `Toʻlov eslatmasi yuborilmadi (${studentId})`);
    }
  }

  // Adminlarga bitta jamlanma
  let adminsNotified = 0;
  if (by.size) {
    const sent = await prisma.notification.findFirst({ where: { type: "payment.reminder_summary", payload: { path: ["period"], equals: period } }, select: { id: true } });
    if (!sent) {
      const total = [...by.values()].reduce((s, v) => s + v.total, 0);
      const list = [...by.values()].sort((a, b) => b.total - a.total).slice(0, 10).map((v) => `• ${v.name} — ${fmtMoney(v.total)}`);
      if (by.size > 10) list.push(`… va yana ${by.size - 10} ta`);
      const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
      await prisma.$transaction(async (tx) => {
        for (const a of admins) {
          await notify(tx, {
            userId: a.id,
            type: "payment.reminder_summary",
            title: `Toʻlov kuni: ${by.size} ta oʻquvchi qarzdor`,
            body: [`Jami qarzdorlik: ${fmtMoney(total)}. Ota-onalarga eslatma yuborildi.`, ...list].join("\n"),
            link: "/admin/tolovlar",
            payload: { period },
          });
        }
      });
      adminsNotified = admins.length;
    }
  }
  return { period, debtors: by.size, students, parents, skipped, adminsNotified };
}

/** Har kuni: ertaga muddati tugaydigan hisob uchun eslatma va muddati oʻtganlarni OVERDUE qilish. */
export async function runPaymentJobs(now = new Date(), log: Log = console) {
  const today = dateCol(ymdTz(now));
  const tomorrowYmd = ymdTz(addDays(now, 1));
  const tomorrow = dateCol(tomorrowYmd);

  // 1) Eslatma: muddati ertaga. Ertaga oylik eslatma kuni boʻlsa — oʻsha kungi jamlangan eslatma yetarli.
  const skipDueDay = Number(tomorrowYmd.slice(8, 10)) === config.PAYMENT_DUE_DAY;
  const dueTomorrow = skipDueDay ? [] : await prisma.payment.findMany({ where: { status: "PENDING", dueDate: tomorrow }, select });
  let reminders = 0;
  for (const p of dueTomorrow) {
    const due = p.amount - p.paidAmount;
    if (due <= 0) continue;
    const already = await prisma.notification.findFirst({ where: { type: "payment.due", payload: { path: ["paymentId"], equals: p.id } }, select: { id: true } });
    if (already) continue;
    const what = `${fmtPeriod(p.period)}${p.group ? ` · ${p.group.name}` : ""}`;
    reminders += await prisma.$transaction((tx) =>
      notifyParents(tx, p.studentId, {
        type: "payment.due",
        title: "Toʻlov muddati ertaga",
        body: `${p.student.fullName}: ${what} uchun toʻlov — ${fmtMoney(due)}. Toʻlov muddati: ${fmtDbDate(p.dueDate)}.`,
        link: "/ota-ona/tolovlar",
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
        const due = p.amount - p.paidAmount;
        const what = `${fmtPeriod(p.period)}${p.group ? ` · ${p.group.name}` : ""}`;
        await writeAudit(tx, {
          actorId: null, actorRole: null, action: "payment.overdue", entityType: "Payment", entityId: p.id,
          summary: `${p.student.fullName} — ${what} toʻlovi muddati oʻtdi (${fmtMoney(due)}, muddat ${fmtDbDate(p.dueDate)})`,
          before: { status: "PENDING" }, after: { status: "OVERDUE" },
        });
        await notifyParents(tx, p.studentId, {
          type: "payment.overdue",
          title: "Toʻlov muddati oʻtdi",
          body: `${p.student.fullName}: ${what} uchun ${fmtMoney(due)} toʻlov muddati (${fmtDbDate(p.dueDate)}) oʻtdi. Iltimos, toʻlovni amalga oshiring yoki markaz bilan bogʻlaning.`,
          link: "/ota-ona/tolovlar",
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
    const total = marked.reduce((s, p) => s + p.amount - p.paidAmount, 0);
    const list = marked.slice(0, 10).map((p) => `• ${p.student.fullName} — ${fmtPeriod(p.period)}, ${fmtMoney(p.amount - p.paidAmount)}`);
    if (marked.length > 10) list.push(`… va yana ${marked.length - 10} ta`);
    const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
    await prisma.$transaction(async (tx) => {
      for (const a of admins) {
        await notify(tx, {
          userId: a.id,
          type: "payment.overdue",
          title: `${marked.length} ta toʻlov muddati oʻtdi`,
          body: [`Jami: ${fmtMoney(total)}.`, ...list].join("\n"),
          link: "/admin/tolovlar",
          payload: { paymentIds: marked.map((p) => p.id) },
        });
      }
    });
    adminsNotified = admins.length;
  }
  return { dueTomorrow: dueTomorrow.length, reminders, overdue: marked.length, adminsNotified };
}
