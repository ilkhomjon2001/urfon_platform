// Ota-ona va admin hisobotlari. Idempotent: Report [type, period, studentId] noyob — qayta ishga
// tushirilsa hisobot ham, bildirishnoma ham takrorlanmaydi. KANON §8: faqat bolaning oʻz koʻrsatkichlari.
import { Prisma, type AttendanceStatus } from "@prisma/client";
import { prisma } from "../db.js";
import { notify, notifyParents } from "../lib/notify.js";
import { addDays, endOfDayTz, periodOf, startOfDayTz, startOfMonthTz, ymdTz } from "../lib/dates.js";
import {
  ATTENDANCE_LABEL, GRADE_KIND, fmtAvg, fmtDate, fmtGrade, fmtMoney, fmtNum, fmtPercent, fmtPeriod, fmtSigned, fmtTime,
  avgLabel, gradeLabel, monthLocative,
} from "../bot/format.js";
import { attendanceRate, homeworkState } from "../bot/views.js";
import type { Log } from "../bot/bot.js";

const isUnique = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

/** @db.Date ustun uchun kalendar sanasi (UTC yarim tun): "2024-05-01" → 2024-05-01T00:00Z */
const dateCol = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

// ───────────────────────── Kunlik (20:30) ─────────────────────────

/** Bugun darsi boʻlgan har bir faol oʻquvchi uchun DAILY_PARENT hisobot + ota-onaga xabar. */
export async function runDailyParentReports(now = new Date(), log: Log = console) {
  const from = startOfDayTz(now);
  const to = endOfDayTz(now);
  const period = ymdTz(now);
  const lessons = await prisma.lesson.findMany({
    where: { startsAt: { gte: from, lte: to }, status: { not: "CANCELLED" } },
    select: { group: { select: { students: { where: { status: "ACTIVE" }, select: { studentId: true } } } } },
  });
  const ids = [...new Set(lessons.flatMap((l) => l.group.students.map((s) => s.studentId)))];
  const students = await prisma.user.findMany({
    where: { id: { in: ids }, isActive: true, studentProfile: { status: "ACTIVE" } },
    select: { id: true, fullName: true },
  });
  let created = 0;
  let existed = 0;
  let notified = 0;
  for (const s of students) {
    const done = await prisma.report.findUnique({ where: { type_period_studentId: { type: "DAILY_PARENT", period, studentId: s.id } }, select: { id: true } });
    if (done) {
      existed++;
      continue;
    }
    try {
      const { payload, body } = await dailyContent(s.id, now);
      await prisma.$transaction(async (tx) => {
        await tx.report.create({ data: { type: "DAILY_PARENT", period, studentId: s.id, payload } });
        notified += await notifyParents(tx, s.id, {
          type: "report.daily",
          title: `Kunlik hisobot: ${s.fullName}, ${fmtDate(now, false)}`,
          body,
          link: "/ota-ona",
          payload: { reportType: "DAILY_PARENT", period, studentId: s.id },
        });
      });
      created++;
    } catch (e) {
      if (isUnique(e)) existed++;
      else log.error(e, `Kunlik hisobot yaratilmadi (${s.id})`);
    }
  }
  return { period, students: students.length, created, existed, notified };
}

async function dailyContent(studentId: string, now: Date) {
  const from = startOfDayTz(now);
  const to = endOfDayTz(now);
  const enrolled = { students: { some: { studentId, status: "ACTIVE" as const } } };
  const [lessons, grades, due, assigned, coins, submittedToday] = await Promise.all([
    prisma.lesson.findMany({
      where: { group: enrolled, startsAt: { gte: from, lte: to }, status: { not: "CANCELLED" } },
      orderBy: { startsAt: "asc" },
      select: { id: true, title: true, startsAt: true, endsAt: true, group: { select: { name: true } }, attendance: { where: { studentId }, select: { status: true, arrivedAt: true } } },
    }),
    prisma.grade.findMany({ where: { studentId, gradedAt: { gte: from, lte: to } }, orderBy: { gradedAt: "asc" }, select: { value: true, kind: true, title: true, comment: true } }),
    prisma.homework.findMany({
      where: { group: enrolled, dueAt: { gte: from, lte: to } },
      orderBy: { dueAt: "asc" },
      select: { id: true, title: true, dueAt: true, submissions: { where: { studentId }, select: { status: true } } },
    }),
    prisma.homework.findMany({
      where: { group: enrolled, createdAt: { gte: from, lte: to }, dueAt: { gt: to } },
      orderBy: { dueAt: "asc" },
      select: { id: true, title: true, dueAt: true },
    }),
    prisma.coinTransaction.aggregate({ where: { studentId, amount: { gt: 0 }, createdAt: { gte: from, lte: to } }, _sum: { amount: true } }),
    prisma.submission.count({ where: { studentId, submittedAt: { gte: from, lte: to } } }),
  ]);
  const coinsToday = coins._sum.amount ?? 0;

  const lines: string[] = [];
  for (const l of lessons) {
    const a = l.attendance[0];
    const state = !a
      ? "davomat belgilanmagan"
      : (a.status === "PRESENT" || a.status === "LATE") && a.arrivedAt
        ? `${ATTENDANCE_LABEL[a.status]}, ${fmtTime(a.arrivedAt)}`
        : ATTENDANCE_LABEL[a.status];
    lines.push(`Dars: ${l.group.name} (${fmtTime(l.startsAt)}) — ${state}.`);
  }
  if (grades.length) {
    lines.push(`Baholar: ${grades.map((g) => `${fmtGrade(g.value)} (${gradeLabel(g.value)}) — ${g.title ?? GRADE_KIND[g.kind]}`).join("; ")}.`);
  } else lines.push("Bugun baho qoʻyilmadi.");
  for (const h of due) lines.push(`Uyga vazifa: “${h.title}” — ${fmtTime(h.dueAt)} gacha, ${homeworkState(h.submissions[0]?.status, h.dueAt, now)}.`);
  for (const h of assigned) lines.push(`Yangi uyga vazifa: “${h.title}” — ${fmtDate(h.dueAt, false)}, ${fmtTime(h.dueAt)} gacha.`);
  if (submittedToday) lines.push(`Bugun ${submittedToday} ta uyga vazifa topshirildi.`);
  lines.push(`Kumush tangalar: bugun ${fmtSigned(coinsToday)}.`);

  const payload = {
    date: ymdTz(now),
    lessons: lessons.map((l) => ({
      id: l.id, group: l.group.name, title: l.title, startsAt: l.startsAt.toISOString(), endsAt: l.endsAt.toISOString(),
      attendance: l.attendance[0]?.status ?? null, arrivedAt: l.attendance[0]?.arrivedAt?.toISOString() ?? null,
    })),
    grades: grades.map((g) => ({ value: g.value, kind: g.kind, title: g.title, comment: g.comment })),
    homeworkDue: due.map((h) => ({ id: h.id, title: h.title, dueAt: h.dueAt.toISOString(), status: h.submissions[0]?.status ?? null })),
    homeworkAssigned: assigned.map((h) => ({ id: h.id, title: h.title, dueAt: h.dueAt.toISOString() })),
    submittedToday,
    coins: coinsToday,
  } satisfies Prisma.InputJsonValue;
  return { payload, body: lines.join("\n") };
}

// ───────────────────────── Oylik (1-sana, 10:00) ─────────────────────────

/** Oʻtgan oy uchun MONTHLY_PARENT (har bir faol oʻquvchi) va MONTHLY_ADMIN. `now` — ishga tushgan payt. */
export async function runMonthlyReports(now = new Date(), log: Log = console) {
  const to = startOfMonthTz(now); // joriy oy boshi (oraliq oxiri, kirmaydi)
  const from = startOfMonthTz(addDays(to, -1)); // oʻtgan oy boshi
  const prevFrom = startOfMonthTz(addDays(from, -1));
  const period = periodOf(from);
  const prevPeriod = periodOf(prevFrom);

  const students = await prisma.user.findMany({
    where: { role: "STUDENT", isActive: true, studentProfile: { status: "ACTIVE" } },
    select: { id: true, fullName: true },
  });
  let created = 0;
  let existed = 0;
  let notified = 0;
  for (const s of students) {
    const done = await prisma.report.findUnique({ where: { type_period_studentId: { type: "MONTHLY_PARENT", period, studentId: s.id } }, select: { id: true } });
    if (done) {
      existed++;
      continue;
    }
    try {
      const { payload, body } = await monthlyStudentContent(s.id, from, to, prevFrom, period, prevPeriod);
      await prisma.$transaction(async (tx) => {
        await tx.report.create({ data: { type: "MONTHLY_PARENT", period, studentId: s.id, payload } });
        notified += await notifyParents(tx, s.id, {
          type: "report.monthly",
          title: `Oylik hisobot: ${s.fullName} — ${fmtPeriod(period)}`,
          body,
          link: "/ota-ona",
          payload: { reportType: "MONTHLY_PARENT", period, studentId: s.id },
        });
      });
      created++;
    } catch (e) {
      if (isUnique(e)) existed++;
      else log.error(e, `Oylik hisobot yaratilmadi (${s.id})`);
    }
  }
  const admin = await monthlyAdminReport(from, to, period, log);
  return { period, students: students.length, created, existed, notified, admin };
}

async function monthlyStudentContent(studentId: string, from: Date, to: Date, prevFrom: Date, period: string, prevPeriod: string) {
  const inMonth = { gte: from, lt: to };
  const [att, grades, prevGrades, enrollments, coins, gradeComments, feedbacks] = await Promise.all([
    prisma.attendance.findMany({ where: { studentId, lesson: { startsAt: inMonth } }, select: { status: true } }),
    prisma.grade.aggregate({ where: { studentId, gradedAt: inMonth }, _avg: { value: true }, _count: { _all: true } }),
    prisma.grade.aggregate({ where: { studentId, gradedAt: { gte: prevFrom, lt: from } }, _avg: { value: true }, _count: { _all: true } }),
    prisma.groupStudent.findMany({ where: { studentId }, select: { groupId: true, joinedAt: true } }),
    prisma.coinTransaction.aggregate({ where: { studentId, amount: { gt: 0 }, createdAt: inMonth }, _sum: { amount: true } }),
    prisma.grade.count({ where: { studentId, gradedAt: inMonth, comment: { not: null } } }),
    prisma.submission.count({ where: { studentId, reviewedAt: inMonth, feedback: { not: null } } }),
  ]);
  // oʻquvchi guruhga qoʻshilgandan keyingi uyga vazifalar
  const joined = new Map(enrollments.map((e) => [e.groupId, e.joinedAt]));
  const hws = await prisma.homework.findMany({
    where: { groupId: { in: [...joined.keys()] }, dueAt: inMonth },
    select: { groupId: true, dueAt: true, submissions: { where: { studentId }, select: { status: true, submittedAt: true } } },
  });
  const relevant = hws.filter((h) => h.dueAt >= (joined.get(h.groupId) ?? from));
  const submitted = relevant.filter((h) => h.submissions.some((x) => x.status !== "DRAFT" && x.submittedAt)).length;

  const rate = attendanceRate(att);
  const avg = grades._avg.value;
  const prevAvg = prevGrades._avg.value;
  const coinsEarned = coins._sum.amount ?? 0;
  const comments = gradeComments + feedbacks;
  const byStatus = att.reduce<Partial<Record<AttendanceStatus, number>>>((m, a) => ((m[a.status] = (m[a.status] ?? 0) + 1), m), {});

  const lines: string[] = [];
  lines.push(rate ? `Davomat: ${fmtPercent(rate.percent)} (${rate.total} darsdan ${rate.came} tasiga keldi).` : "Davomat: bu oyda belgilangan dars yoʻq.");
  if (avg != null) {
    const prev = prevAvg != null ? `, ${monthLocative(prevPeriod)} ${fmtAvg(prevAvg)} edi` : "";
    lines.push(`Oʻrtacha baho: ${fmtAvg(avg)} (${avgLabel(avg)})${prev}.`);
  } else lines.push("Oʻrtacha baho: bu oyda baho qoʻyilmagan.");
  lines.push(relevant.length ? `Uyga vazifalar: ${relevant.length} tadan ${submitted} tasi topshirildi.` : "Uyga vazifalar: bu oyda berilmagan.");
  lines.push(`Kumush tangalar: ${fmtSigned(coinsEarned)}.`);
  if (comments) lines.push(`Ustoz izohlari: ${comments} ta — platformada oʻqishingiz mumkin.`);

  const payload = {
    period,
    attendance: rate ? { percent: Math.round(rate.percent * 10) / 10, came: rate.came, total: rate.total, byStatus } : null,
    grades: { average: avg != null ? Math.round(avg * 100) / 100 : null, label: avg != null ? avgLabel(avg) : null, count: grades._count._all },
    previous: { period: prevPeriod, average: prevAvg != null ? Math.round(prevAvg * 100) / 100 : null },
    homework: { total: relevant.length, submitted, percent: relevant.length ? Math.round((submitted / relevant.length) * 1000) / 10 : null },
    coins: coinsEarned,
    teacherComments: comments,
  } satisfies Prisma.InputJsonValue;
  return { payload, body: lines.join("\n") };
}

/** MONTHLY_ADMIN (studentId = null). NULL unique'da takrorlanishi mumkinligi uchun advisory lock bilan tekshiriladi. */
async function monthlyAdminReport(from: Date, to: Date, period: string, log: Log) {
  const inMonth = { gte: from, lt: to };
  const next = periodOf(to);
  const dateRange = { gte: dateCol(`${period}-01`), lt: dateCol(`${next}-01`) };
  const [byStatus, newcomers, left, payments, collected, overdueNow, att, lessonsHeld] = await Promise.all([
    prisma.studentProfile.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.studentProfile.count({ where: { enrolledAt: dateRange } }),
    prisma.studentProfile.count({ where: { leftAt: dateRange } }),
    prisma.payment.groupBy({ by: ["status"], where: { period }, _sum: { amount: true, paidAmount: true }, _count: { _all: true } }),
    // oy ichida kassaga kelgan pul — tushumlar (storno qilinganlarsiz)
    prisma.paymentTransaction.aggregate({ where: { reversedAt: null, paidAt: inMonth }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.payment.aggregate({ where: { status: "OVERDUE" }, _sum: { amount: true, paidAmount: true }, _count: { _all: true } }),
    prisma.attendance.findMany({ where: { lesson: { startsAt: inMonth } }, select: { status: true } }),
    prisma.lesson.count({ where: { startsAt: inMonth, status: { not: "CANCELLED" } } }),
  ]);
  const st = Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])) as Record<string, number>;
  const pay = Object.fromEntries(
    payments.map((r) => [r.status, { count: r._count._all, amount: r._sum.amount ?? 0, paid: r._sum.paidAmount ?? 0 }]),
  ) as Record<string, { count: number; amount: number; paid: number }>;
  const raw = (k: string) => pay[k] ?? { count: 0, amount: 0, paid: 0 };
  // davr boʻyicha: toʻlangan = toʻliq + qisman; kutilmoqda / muddati oʻtgan — toʻlanmagan qism
  const periodPay = {
    PAID: { count: raw("PAID").count, amount: raw("PAID").amount + raw("PENDING").paid + raw("OVERDUE").paid },
    PENDING: { count: raw("PENDING").count, amount: raw("PENDING").amount - raw("PENDING").paid },
    OVERDUE: { count: raw("OVERDUE").count, amount: raw("OVERDUE").amount - raw("OVERDUE").paid },
  };
  const p = (k: keyof typeof periodPay) => periodPay[k];
  const rate = attendanceRate(att);

  const payload = {
    period,
    students: { active: st.ACTIVE ?? 0, academicLeave: st.ACADEMIC_LEAVE ?? 0, graduated: st.GRADUATED ?? 0, left: st.LEFT ?? 0, newInMonth: newcomers, leftInMonth: left },
    payments: {
      period: { paid: p("PAID"), pending: p("PENDING"), overdue: p("OVERDUE") },
      collectedInMonth: { count: collected._count._all, amount: collected._sum.amount ?? 0 },
      overdueNow: { count: overdueNow._count._all, amount: (overdueNow._sum.amount ?? 0) - (overdueNow._sum.paidAmount ?? 0) },
    },
    attendance: rate ? { percent: Math.round(rate.percent * 10) / 10, came: rate.came, total: rate.total } : null,
    lessonsHeld,
  } satisfies Prisma.InputJsonValue;
  const body = [
    `Oʻquvchilar: ${fmtNum(payload.students.active)} faol · ${payload.students.academicLeave} akademik taʼtilda · ${payload.students.graduated} bitirgan.`,
    `Oy davomida: +${newcomers} yangi, −${left} ketdi.`,
    `Toʻlovlar (${fmtPeriod(period)}): yigʻildi ${fmtMoney(p("PAID").amount)} (${p("PAID").count} ta) · kutilmoqda ${fmtMoney(p("PENDING").amount)} (${p("PENDING").count} ta) · muddati oʻtgan ${fmtMoney(p("OVERDUE").amount)} (${p("OVERDUE").count} ta).`,
    `Oy ichida qabul qilingan toʻlovlar: ${fmtMoney(payload.payments.collectedInMonth.amount)}.`,
    rate ? `Davomat: ${fmtPercent(rate.percent)} (${fmtNum(lessonsHeld)} ta dars).` : `Darslar: ${fmtNum(lessonsHeld)} ta.`,
  ].join("\n");

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`report:MONTHLY_ADMIN:${period}`}))`;
      const exists = await tx.report.findFirst({ where: { type: "MONTHLY_ADMIN", period, studentId: null }, select: { id: true } });
      if (exists) return { created: false, notified: 0 };
      await tx.report.create({ data: { type: "MONTHLY_ADMIN", period, payload } });
      const admins = await tx.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
      for (const a of admins) {
        await notify(tx, { userId: a.id, type: "report.monthly_admin", title: `Oylik hisobot — ${fmtPeriod(period)}`, body, link: "/admin", payload: { reportType: "MONTHLY_ADMIN", period } });
      }
      return { created: true, notified: admins.length };
    });
  } catch (e) {
    log.error(e, "Admin oylik hisoboti yaratilmadi");
    return { created: false, notified: 0, error: true };
  }
}
