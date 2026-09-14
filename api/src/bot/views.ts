// Bot menyulari uchun maʼlumot + matn (HTML parse_mode). Har bir funksiya faqat berilgan
// foydalanuvchiga tegishli maʼlumotni oʻqiydi — chaqiruvchi (bot.ts) foydalanuvchi ulanganini va
// ota-ona ↔ farzand bogʻlanishini tekshirgan boʻlishi SHART.
// KANON §8: bolani boshqalar bilan solishtirish yoʻq — faqat oʻz koʻrsatkichlari.
import type { AttendanceStatus, LessonStatus, Role, SubmissionStatus } from "@prisma/client";
import { prisma } from "../db.js";
import { studentGroupIds } from "../lib/access.js";
import { studentBalance } from "../lib/billing.js";
import { addDays, endOfDayTz, periodOf, startOfDayTz, startOfWeekTz, ymdTz } from "../lib/dates.js";
import { coinTitle } from "../config/gamification.js";
import {
  ATTENDANCE_LABEL, GRADE_KIND, esc, fmtDate, fmtDbDate, fmtGrade, fmtMoney, fmtNum, fmtPercent, fmtPeriod,
  fmtRelDateTime, fmtSigned, fmtTime, fmtTimeRange, gradeLabel, weekdayShort,
} from "./format.js";

export type BotUser = { id: string; role: Role; fullName: string };

// ───────────────────────── umumiy yordamchilar ─────────────────────────

type LessonLite = {
  startsAt: Date;
  endsAt: Date;
  status: LessonStatus;
  attendance: { status: AttendanceStatus; arrivedAt: Date | null }[];
};

/** Dars holati bitta oʻquvchi uchun: "keldi (13:55)", "kelmadi", "hali boshlanmagan"… */
export function lessonState(l: LessonLite, now: Date) {
  if (l.status === "CANCELLED") return "bekor qilindi";
  const a = l.attendance[0];
  if (a) {
    const came = a.status === "PRESENT" || a.status === "LATE";
    return came && a.arrivedAt ? `${ATTENDANCE_LABEL[a.status]} (${fmtTime(a.arrivedAt)})` : ATTENDANCE_LABEL[a.status];
  }
  if (l.startsAt > now) return "hali boshlanmagan";
  return "davomat hali belgilanmagan";
}

export function homeworkState(status: SubmissionStatus | undefined, dueAt: Date, now: Date) {
  switch (status) {
    case "SUBMITTED": return "topshirildi, tekshirilmoqda";
    case "REVIEWED": return "tekshirildi";
    case "RETURNED": return "qayta ishlashga qaytarildi";
    default: return dueAt < now ? "topshirilmadi" : "hali topshirilmagan";
  }
}

/** (PRESENT + LATE) / barcha belgilanganlar. EXCUSED ham maxrajda (KANON §7: 10 darsdan 9 → 90%). */
export function attendanceRate(rows: { status: AttendanceStatus }[]) {
  if (!rows.length) return null;
  const came = rows.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  return { came, total: rows.length, percent: (came / rows.length) * 100 };
}

const gradeTitle = (g: { kind: keyof typeof GRADE_KIND; title: string | null }) =>
  g.title ? `${GRADE_KIND[g.kind]} — ${esc(g.title)}` : GRADE_KIND[g.kind];

const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? full;

export async function parentChildren(parentId: string) {
  const links = await prisma.parentStudent.findMany({
    where: { parentId },
    orderBy: { createdAt: "asc" },
    select: {
      student: {
        select: {
          id: true,
          fullName: true,
          studentProfile: { select: { code: true } },
          enrollments: { where: { status: "ACTIVE" }, select: { group: { select: { name: true } } } },
        },
      },
    },
  });
  return links.map((l) => l.student);
}

// ───────────────────────── Bugun (oʻquvchi / ota-ona) ─────────────────────────

export async function studentDay(studentId: string, now = new Date()) {
  const from = startOfDayTz(now);
  const to = endOfDayTz(now);
  const groupIds = await studentGroupIds(studentId);
  const [lessons, grades, homework, coins, submittedToday] = await Promise.all([
    prisma.lesson.findMany({
      where: { groupId: { in: groupIds }, startsAt: { gte: from, lte: to } },
      orderBy: { startsAt: "asc" },
      select: {
        id: true, startsAt: true, endsAt: true, status: true,
        group: { select: { name: true } },
        attendance: { where: { studentId }, select: { status: true, arrivedAt: true } },
      },
    }),
    prisma.grade.findMany({
      where: { studentId, gradedAt: { gte: from, lte: to } },
      orderBy: { gradedAt: "asc" },
      select: { value: true, kind: true, title: true },
    }),
    prisma.homework.findMany({
      where: { groupId: { in: groupIds }, dueAt: { gte: from, lte: to } },
      orderBy: { dueAt: "asc" },
      select: { title: true, dueAt: true, submissions: { where: { studentId }, select: { status: true } } },
    }),
    prisma.coinTransaction.aggregate({ where: { studentId, amount: { gt: 0 }, createdAt: { gte: from, lte: to } }, _sum: { amount: true } }),
    prisma.submission.count({ where: { studentId, submittedAt: { gte: from, lte: to } } }),
  ]);
  return { lessons, grades, homework, coinsToday: coins._sum.amount ?? 0, submittedToday };
}

export function renderDay(d: Awaited<ReturnType<typeof studentDay>>, heading: string, now: Date) {
  const out = [heading];
  if (!d.lessons.length) out.push("Bugun dars yoʻq.");
  else {
    out.push("", "<b>Darslar</b>");
    for (const l of d.lessons) out.push(`• ${fmtTimeRange(l.startsAt, l.endsAt)} · ${esc(l.group.name)} — ${lessonState(l, now)}`);
  }
  out.push("");
  if (d.grades.length) {
    out.push("<b>Baholar</b>");
    for (const g of d.grades) out.push(`• ${fmtGrade(g.value)} (${gradeLabel(g.value)}) · ${gradeTitle(g)}`);
  } else out.push("Bugun baho qoʻyilmadi.");
  if (d.homework.length) {
    out.push("", "<b>Uyga vazifa</b>");
    for (const h of d.homework) out.push(`• ${esc(h.title)} — ${fmtTime(h.dueAt)} gacha · ${homeworkState(h.submissions[0]?.status, h.dueAt, now)}`);
  }
  if (d.submittedToday) out.push(`Bugun topshirilgan uyga vazifalar: ${d.submittedToday} ta`);
  out.push("", `Kumush tangalar: bugun ${fmtSigned(d.coinsToday)}`);
  return out.join("\n");
}

// ───────────────────────── Jadval (shu hafta) ─────────────────────────

export async function renderWeek(studentId: string, heading: string, now = new Date()) {
  const from = startOfWeekTz(now);
  const groupIds = await studentGroupIds(studentId);
  const lessons = await prisma.lesson.findMany({
    where: { groupId: { in: groupIds }, startsAt: { gte: from, lt: addDays(from, 7) } },
    orderBy: { startsAt: "asc" },
    select: {
      startsAt: true, endsAt: true, status: true,
      room: { select: { name: true } },
      group: { select: { name: true, room: { select: { name: true } } } },
      attendance: { where: { studentId }, select: { status: true, arrivedAt: true } },
    },
  });
  const out = [heading];
  if (!lessons.length) out.push("Bu hafta dars rejalashtirilmagan.");
  const today = ymdTz(now);
  for (const l of lessons) {
    const room = l.room?.name ?? l.group.room?.name;
    const isToday = ymdTz(l.startsAt) === today;
    const past = l.startsAt <= now || l.status === "CANCELLED";
    const state = past ? ` — ${lessonState(l, now)}` : isToday ? " — bugun" : "";
    out.push(`• ${weekdayShort(l.startsAt)}, ${fmtDate(l.startsAt, false)} · ${fmtTimeRange(l.startsAt, l.endsAt)} · ${esc(l.group.name)}${room ? ` · ${esc(room)}` : ""}${state}`);
  }
  return out.join("\n");
}

// ───────────────────────── Toʻlovlar ─────────────────────────

export async function renderPayments(studentId: string, heading: string, now = new Date()) {
  const period = periodOf(now);
  const rows = await prisma.payment.findMany({
    where: { studentId, status: { not: "CANCELLED" }, OR: [{ period }, { status: { in: ["PENDING", "OVERDUE"] } }] },
    orderBy: [{ dueDate: "asc" }],
    select: { period: true, amount: true, paidAmount: true, status: true, dueDate: true, paidAt: true, group: { select: { name: true } } },
  });
  const out = [heading];
  if (!rows.length) out.push(`${fmtPeriod(period)} uchun toʻlov yozuvi yoʻq.`);
  let due = 0;
  const todayCol = new Date(`${ymdTz(now)}T00:00:00Z`); // dueDate — @db.Date (UTC yarim tun)
  for (const p of rows) {
    let state: string;
    const left = p.amount - p.paidAmount;
    if (p.status === "PAID") state = `toʻlangan${p.paidAt ? ` (${fmtDate(p.paidAt)})` : ""}`;
    else if (p.status === "OVERDUE" || p.dueDate < todayCol) state = `muddati oʻtgan (${fmtDbDate(p.dueDate)})`;
    else state = `kutilmoqda, muddati ${fmtDbDate(p.dueDate)}`;
    if (p.status !== "PAID" && p.paidAmount > 0) state += `; ${fmtMoney(p.paidAmount)} toʻlangan, qoldiq ${fmtMoney(left)}`;
    if (p.status === "PENDING" || p.status === "OVERDUE") due += left;
    out.push(`• ${fmtPeriod(p.period)}${p.group ? ` · ${esc(p.group.name)}` : ""} — ${fmtMoney(p.amount)}, ${state}`);
  }
  const { advance } = await studentBalance(prisma, studentId);
  if (due > 0) out.push("", `Toʻlanishi kerak: <b>${fmtMoney(due)}</b>`);
  else if (rows.length) out.push("", "Qarzdorlik yoʻq.");
  if (advance > 0) out.push(`Avans (keyingi oylar uchun): ${fmtMoney(advance)}`);
  return out.join("\n");
}

// ───────────────────────── Baholar (oxirgi 5 ta) ─────────────────────────

export async function renderGrades(studentId: string, heading: string) {
  const grades = await prisma.grade.findMany({
    where: { studentId },
    orderBy: { gradedAt: "desc" },
    take: 5,
    select: { value: true, kind: true, title: true, comment: true, gradedAt: true, group: { select: { name: true } } },
  });
  const out = [heading];
  if (!grades.length) out.push("Hali baho qoʻyilmagan.");
  for (const g of grades) {
    out.push(`• ${fmtDate(g.gradedAt, false)} · <b>${fmtGrade(g.value)}</b> (${gradeLabel(g.value)}) · ${gradeTitle(g)}`);
    if (g.comment) out.push(`  <i>${esc(g.comment.length > 160 ? g.comment.slice(0, 157) + "…" : g.comment)}</i>`);
  }
  return out.join("\n");
}

// ───────────────────────── Oʻquvchi: vazifalar, tangalar ─────────────────────────

export async function renderOpenHomework(studentId: string, now = new Date()) {
  const groupIds = await studentGroupIds(studentId);
  const hws = await prisma.homework.findMany({
    where: {
      groupId: { in: groupIds },
      OR: [
        { dueAt: { gte: now }, submissions: { none: { studentId, status: { in: ["SUBMITTED", "REVIEWED"] } } } },
        { submissions: { some: { studentId, status: "RETURNED" } } },
      ],
    },
    orderBy: { dueAt: "asc" },
    take: 10,
    select: { title: true, dueAt: true, coinReward: true, group: { select: { name: true } }, submissions: { where: { studentId }, select: { status: true } } },
  });
  const out = ["<b>Uyga vazifalar</b>"];
  if (!hws.length) out.push("Ochiq uyga vazifa yoʻq. Barakalla!");
  const manyGroups = new Set(hws.map((h) => h.group.name)).size > 1;
  for (const h of hws) {
    const st = h.submissions[0]?.status;
    const note = st === "DRAFT" ? " · qoralama saqlangan" : st === "RETURNED" ? " · qayta ishlash kerak" : "";
    out.push(`• ${esc(h.title)}${manyGroups ? ` (${esc(h.group.name)})` : ""} — ${fmtRelDateTime(h.dueAt, now)} gacha${note}`);
  }
  if (hws.length) out.push("", "Vazifani platformadagi “Uyga vazifalar” boʻlimida topshiring.");
  return out.join("\n");
}

export async function renderCoins(studentId: string, now = new Date()) {
  const p = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
  if (!p) return "Oʻquvchi profili topilmadi.";
  const day0 = startOfDayTz(now);
  const from7 = addDays(day0, -6);
  const from14 = addDays(from7, -7);
  const tx = await prisma.coinTransaction.findMany({
    where: { studentId, amount: { gt: 0 }, createdAt: { gte: from14 } },
    select: { amount: true, createdAt: true },
  });
  const perDay = new Map<string, number>();
  let last7 = 0;
  let prev7 = 0;
  for (const t of tx) {
    if (t.createdAt >= from7) {
      last7 += t.amount;
      const k = ymdTz(t.createdAt);
      perDay.set(k, (perDay.get(k) ?? 0) + t.amount);
    } else prev7 += t.amount;
  }
  // seriya: oxirgi faollik bugun/kecha boʻlsa amalda (DATE ustun ±1 kun farqiga bardoshli)
  const lastYmd = p.lastStreakDate?.toISOString().slice(0, 10);
  const gapDays = lastYmd ? Math.round((Date.parse(ymdTz(now)) - Date.parse(lastYmd)) / 86_400_000) : Infinity;
  const streak = gapDays <= 2 ? p.streakDays : 0;
  const title = coinTitle(p.coinBalance);
  const out = [
    "<b>Kumush tangalar</b>",
    `Balans: <b>${fmtNum(p.coinBalance)}</b> tanga · unvon: ${esc(title.current)}`,
  ];
  if (title.next) out.push(`${fmtNum(title.next.remaining)} tangadan keyin “${esc(title.next.name)}” unvoni`);
  out.push(`Seriya: ${streak} kun`, "", `Oxirgi 7 kun: <b>${fmtSigned(last7)}</b> (oldingi 7 kunda ${fmtSigned(prev7)})`);
  for (let i = 0; i < 7; i++) {
    const d = addDays(from7, i);
    const v = perDay.get(ymdTz(d)) ?? 0;
    out.push(`${weekdayShort(d)}, ${fmtDate(d, false)}: ${fmtSigned(v)}`);
  }
  return out.join("\n");
}

// ───────────────────────── Ustoz ─────────────────────────

export async function renderTeacherToday(teacherId: string, now = new Date()) {
  const lessons = await prisma.lesson.findMany({
    where: { group: { teacherId }, startsAt: { gte: startOfDayTz(now), lte: endOfDayTz(now) } },
    orderBy: { startsAt: "asc" },
    select: {
      startsAt: true, endsAt: true, status: true,
      room: { select: { name: true } },
      group: { select: { name: true, room: { select: { name: true } }, _count: { select: { students: { where: { status: "ACTIVE" } } } } } },
      _count: { select: { attendance: true } },
    },
  });
  const out = [`<b>Bugungi darslar</b> — ${fmtDate(now, false)}`];
  if (!lessons.length) out.push("Bugun dars yoʻq.");
  for (const l of lessons) {
    const room = l.room?.name ?? l.group.room?.name;
    const state = l.status === "CANCELLED"
      ? "bekor qilindi"
      : l._count.attendance
        ? `davomat: ${l._count.attendance}/${l.group._count.students}`
        : l.startsAt > now ? "hali boshlanmagan" : "davomat belgilanmagan";
    out.push(`• ${fmtTimeRange(l.startsAt, l.endsAt)} · ${esc(l.group.name)}${room ? ` · ${esc(room)}` : ""} — ${state}`);
  }
  return out.join("\n");
}

export async function renderTeacherReview(teacherId: string) {
  const subs = await prisma.submission.findMany({
    where: { status: "SUBMITTED", homework: { group: { teacherId } } },
    select: { homework: { select: { group: { select: { name: true } } } } },
  });
  const byGroup = new Map<string, number>();
  for (const s of subs) byGroup.set(s.homework.group.name, (byGroup.get(s.homework.group.name) ?? 0) + 1);
  const out = ["<b>Tekshiruvni kutayotgan uyga vazifalar</b>"];
  if (!subs.length) out.push("Hozircha tekshiriladigan ish yoʻq.");
  for (const [name, n] of [...byGroup].sort((a, b) => b[1] - a[1])) out.push(`• ${esc(name)} — ${n} ta`);
  if (subs.length) out.push("", `Jami: <b>${subs.length} ta</b>`);
  return out.join("\n");
}

// ───────────────────────── Admin ─────────────────────────

export async function renderAdminToday(now = new Date()) {
  const from = startOfDayTz(now);
  const to = endOfDayTz(now);
  const [lessons, cancelled, att, paid, overdue] = await Promise.all([
    prisma.lesson.count({ where: { startsAt: { gte: from, lte: to }, status: { not: "CANCELLED" } } }),
    prisma.lesson.count({ where: { startsAt: { gte: from, lte: to }, status: "CANCELLED" } }),
    prisma.attendance.findMany({ where: { lesson: { startsAt: { gte: from, lte: to } } }, select: { status: true } }),
    prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: from, lte: to } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.payment.aggregate({ where: { status: "OVERDUE" }, _sum: { amount: true }, _count: { _all: true } }),
  ]);
  const rate = attendanceRate(att);
  const out = [
    `<b>Markaz — bugun, ${fmtDate(now, false)}</b>`,
    `Darslar: ${lessons} ta${cancelled ? ` (bekor qilingan: ${cancelled})` : ""}`,
    rate ? `Davomat: <b>${fmtPercent(rate.percent)}</b> (belgilangan ${rate.total} tadan ${rate.came} tasi keldi)` : "Davomat: hali belgilanmagan",
    `Bugun toʻlangan: ${paid._count._all} ta · ${fmtMoney(paid._sum.amount ?? 0)}`,
    `Muddati oʻtgan toʻlovlar: ${overdue._count._all} ta${overdue._count._all ? ` · ${fmtMoney(overdue._sum.amount ?? 0)}` : ""}`,
  ];
  return out.join("\n");
}

// ───────────────────────── Farzandlar roʻyxati ─────────────────────────

export function renderChildrenList(children: Awaited<ReturnType<typeof parentChildren>>) {
  const out = ["<b>Farzandlarim</b>"];
  for (const c of children) {
    const groups = c.enrollments.map((e) => e.group.name).join(", ");
    out.push(`• <b>${esc(c.fullName)}</b>${c.studentProfile ? ` · #${esc(c.studentProfile.code)}` : ""}${groups ? ` · ${esc(groups)}` : ""}`);
  }
  out.push("", "Farzand boʻyicha maʼlumot uchun quyidagi tugmalardan birini tanlang.");
  return out.join("\n");
}

export { firstName };
