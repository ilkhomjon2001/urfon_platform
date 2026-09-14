// Admin → Hisobotlar: oylik moliya, oʻquvchilar dinamikasi, davomat, ustoz yuklamasi, Telegram qamrovi, uyga vazifa.
// Toʻlov raqamlari Payments sahifasi bilan bir xil funksiyadan (paymentTotals) olinadi — mos kelishi kafolatlanadi.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { parse } from "../../lib/http.js";
import {
  csvDate,
  currentPeriod,
  dateOnly,
  effectiveStatus,
  METHOD_LABEL,
  monthRange,
  PAY_STATUS_LABEL,
  paymentStatusWhere,
  paymentTotals,
  pct,
  periodLabel,
  sendCsv,
  shiftPeriod,
  todayDateOnly,
  toCsv,
  ymdOfDateOnly,
  zPeriod,
} from "./b/helpers.js";

/** Ustoz uchun haftalik me'yor (soat). Yuklama % = haftalik soat / me'yor. */
const WEEKLY_NORM_HOURS = 20;

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

async function buildReport(period: string) {
  const { start, end } = monthRange(period);
  const monthStart = dateOnly(`${period}-01`);
  const monthEnd = dateOnly(`${shiftPeriod(period, 1)}-01`);
  const today = todayDateOnly();

  // ── Moliya ──
  const periods = Array.from({ length: 6 }, (_, i) => shiftPeriod(period, i - 5));
  const [totals, seriesRows, overdueRows, methodRows] = await Promise.all([
    paymentTotals({ period }),
    prisma.payment.findMany({ where: { period: { in: periods } }, select: { period: true, status: true, amount: true, paidAmount: true, dueDate: true } }),
    prisma.payment.findMany({
      where: { period, ...paymentStatusWhere("OVERDUE", today) },
      orderBy: { dueDate: "asc" },
      include: {
        student: {
          select: {
            id: true, fullName: true, studentProfile: { select: { code: true, status: true } },
            parents: { select: { relation: true, parent: { select: { fullName: true, phone: true, telegramLink: { select: { isActive: true } } } } } },
          },
        },
        group: { select: { id: true, name: true } },
      },
    }),
    // usullar kesimi: shu davr hisoblariga taqsimlangan tushumlar (qisman ham) + tushumsiz eski toʻlangan hisoblar
    prisma.$queryRaw<{ method: string; amount: bigint; count: number }[]>`
      SELECT method, SUM(amount)::bigint AS amount, COUNT(DISTINCT k)::int AS count FROM (
        SELECT t.method::text AS method, a.amount, t.id AS k
        FROM "PaymentAllocation" a
        JOIN "PaymentTransaction" t ON t.id = a."transactionId"
        JOIN "Payment" p ON p.id = a."paymentId"
        WHERE p.period = ${period} AND t."reversedAt" IS NULL AND p.status <> 'CANCELLED'
        UNION ALL
        SELECT p.method::text, p.amount, p.id
        FROM "Payment" p
        WHERE p.period = ${period} AND p.status = 'PAID' AND p.method IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM "PaymentAllocation" a WHERE a."paymentId" = p.id)
      ) x GROUP BY method`,
  ]);
  const series = periods.map((p) => {
    const rows = seriesRows.filter((r) => r.period === p);
    const collected = rows.filter((r) => r.status !== "CANCELLED").reduce((a, r) => a + (r.status === "PAID" ? r.amount : r.paidAmount), 0);
    const plan = rows.filter((r) => r.status !== "CANCELLED").reduce((a, r) => a + r.amount, 0);
    return { period: p, label: periodLabel(p), collected, plan, percent: pct(collected, plan, 0) };
  });

  // ── O'quvchilar dinamikasi ──
  // Aholi (D sanasida): o'qishga kelgan va D dan oldin "ketgan" (LEFT) bo'lmagan o'quvchilar (KANON: jami bitirganlarni ham o'z ichiga oladi).
  const population = (d: Date) =>
    prisma.studentProfile.count({ where: { enrolledAt: { lt: d }, NOT: { status: "LEFT", leftAt: { lt: d } } } });
  const [startCount, endCount, newCount, leftRows, graduated] = await Promise.all([
    population(monthStart),
    population(monthEnd),
    prisma.studentProfile.count({ where: { enrolledAt: { gte: monthStart, lt: monthEnd } } }),
    prisma.studentProfile.findMany({
      where: { status: "LEFT", leftAt: { gte: monthStart, lt: monthEnd } },
      select: { userId: true, code: true, leftAt: true, user: { select: { fullName: true } } },
      orderBy: { leftAt: "desc" },
    }),
    prisma.studentProfile.count({ where: { status: "GRADUATED", leftAt: { gte: monthStart, lt: monthEnd } } }),
  ]);
  const leftNotes = leftRows.length
    ? await prisma.auditLog.findMany({
        where: { action: "student.status", entityId: { in: leftRows.map((r) => r.userId) } },
        orderBy: { id: "desc" },
        select: { entityId: true, after: true },
      })
    : [];
  const churn = pct(leftRows.length, startCount, 1);

  // ── Davomat guruhlar kesimida ──
  const attRows = await prisma.$queryRaw<{ groupId: string; status: string; n: bigint }[]>`
    SELECT l."groupId" AS "groupId", a.status::text AS status, COUNT(*)::bigint AS n
    FROM "Attendance" a JOIN "Lesson" l ON l.id = a."lessonId"
    WHERE l."startsAt" >= ${start} AND l."startsAt" < ${end}
    GROUP BY 1, 2`;
  const hwRows = await prisma.$queryRaw<{ groupId: string; homework: bigint; expected: bigint; done: bigint; onTime: bigint }[]>`
    SELECT h."groupId" AS "groupId",
           COUNT(DISTINCT h.id)::bigint AS homework,
           COUNT(gs."studentId")::bigint AS expected,
           COUNT(s.id) FILTER (WHERE s.status IN ('SUBMITTED','REVIEWED','RETURNED'))::bigint AS done,
           COUNT(s.id) FILTER (WHERE s.status IN ('SUBMITTED','REVIEWED','RETURNED') AND NOT s."isLate")::bigint AS "onTime"
    FROM "Homework" h
    JOIN "GroupStudent" gs ON gs."groupId" = h."groupId" AND gs.status <> 'WAITING'
         AND gs."joinedAt" <= (h."dueAt" AT TIME ZONE 'Asia/Tashkent')::date
         AND (gs."leftAt" IS NULL OR gs."leftAt" >= (h."dueAt" AT TIME ZONE 'Asia/Tashkent')::date)
    LEFT JOIN "Submission" s ON s."homeworkId" = h.id AND s."studentId" = gs."studentId"
    WHERE h."dueAt" >= ${start} AND h."dueAt" < ${end}
    GROUP BY 1`;

  const groups = await prisma.group.findMany({
    where: { OR: [{ status: { not: "FINISHED" } }, { id: { in: [...attRows.map((r) => r.groupId), ...hwRows.map((r) => r.groupId)] } }] },
    select: {
      id: true, code: true, name: true, status: true, days: true, startTime: true, endTime: true, capacity: true, teacherId: true,
      teacher: { select: { id: true, fullName: true } },
      _count: { select: { students: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { code: "asc" },
  });
  const gName = new Map(groups.map((g) => [g.id, g]));

  const attByGroup = new Map<string, { attended: number; total: number; late: number; absent: number }>();
  for (const r of attRows) {
    const cur = attByGroup.get(r.groupId) ?? { attended: 0, total: 0, late: 0, absent: 0 };
    const n = Number(r.n);
    cur.total += n;
    if (r.status === "PRESENT" || r.status === "LATE") cur.attended += n;
    if (r.status === "LATE") cur.late += n;
    if (r.status === "ABSENT" || r.status === "EXCUSED") cur.absent += n;
    attByGroup.set(r.groupId, cur);
  }
  const attendance = [...attByGroup.entries()]
    .map(([groupId, v]) => ({
      groupId,
      code: gName.get(groupId)?.code ?? "",
      name: gName.get(groupId)?.name ?? "—",
      teacher: gName.get(groupId)?.teacher?.fullName ?? null,
      attended: v.attended,
      total: v.total,
      late: v.late,
      absent: v.absent,
      percent: pct(v.attended, v.total, 0),
    }))
    .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0));
  const attAll = attendance.reduce((a, g) => ({ attended: a.attended + g.attended, total: a.total + g.total }), { attended: 0, total: 0 });

  // ── Ustozlar yuklamasi ──
  const teachers = await prisma.user.findMany({ where: { role: "TEACHER", isActive: true }, select: { id: true, fullName: true, title: true }, orderBy: { fullName: "asc" } });
  const activeGroups = groups.filter((g) => g.status !== "FINISHED");
  const distinct = await prisma.groupStudent.findMany({
    where: { status: "ACTIVE", group: { status: { not: "FINISHED" }, teacherId: { not: null } } },
    select: { studentId: true, group: { select: { teacherId: true } } },
  });
  const lessonsDone = await prisma.lesson.groupBy({ by: ["groupId"], where: { startsAt: { gte: start, lt: end }, status: "DONE" }, _count: { _all: true } });
  const doneByGroup = new Map(lessonsDone.map((l) => [l.groupId, l._count._all]));
  const teacherLoad = teachers
    .map((t) => {
      const tg = activeGroups.filter((g) => g.teacherId === t.id);
      const weeklyMin = tg.reduce((a, g) => a + g.days.length * Math.max(0, minutes(g.endTime) - minutes(g.startTime)), 0);
      const weeklyHours = Math.round((weeklyMin / 60) * 10) / 10;
      const students = new Set(distinct.filter((d) => d.group.teacherId === t.id).map((d) => d.studentId)).size;
      const loadPercent = Math.round((weeklyHours / WEEKLY_NORM_HOURS) * 100);
      return {
        id: t.id,
        fullName: t.fullName,
        title: t.title,
        groups: tg.length,
        students,
        weeklyHours,
        lessonsDone: tg.reduce((a, g) => a + (doneByGroup.get(g.id) ?? 0), 0),
        loadPercent,
        loadLabel: loadPercent >= 90 ? "Yuqori" : loadPercent >= 55 ? "Meʼyorda" : "Boʻsh vaqt bor",
      };
    })
    .sort((a, b) => b.weeklyHours - a.weeklyHours);
  const unassignedGroups = activeGroups.filter((g) => !g.teacherId).map((g) => ({ id: g.id, code: g.code, name: g.name }));
  const withGroups = teacherLoad.filter((t) => t.groups > 0);

  // ── Telegram qamrovi ──
  const notLeft = { studentProfile: { status: { not: "LEFT" as const } } };
  const [stuTotal, stuLinked, parTotal, parLinked, unlinkedParents] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT", ...notLeft } }),
    prisma.user.count({ where: { role: "STUDENT", ...notLeft, parents: { some: { parent: { telegramLink: { isActive: true } } } } } }),
    prisma.user.count({ where: { role: "PARENT", isActive: true, children: { some: { student: notLeft } } } }),
    prisma.user.count({ where: { role: "PARENT", isActive: true, telegramLink: { isActive: true }, children: { some: { student: notLeft } } } }),
    prisma.user.findMany({
      where: { role: "PARENT", isActive: true, children: { some: { student: notLeft } }, OR: [{ telegramLink: { is: null } }, { telegramLink: { isActive: false } }] },
      select: { id: true, fullName: true, phone: true, children: { select: { student: { select: { id: true, fullName: true } } } } },
      orderBy: { fullName: "asc" },
      take: 50,
    }),
  ]);

  // ── Uyga vazifa ──
  const homework = hwRows
    .map((r) => ({
      groupId: r.groupId,
      code: gName.get(r.groupId)?.code ?? "",
      name: gName.get(r.groupId)?.name ?? "—",
      homework: Number(r.homework),
      expected: Number(r.expected),
      done: Number(r.done),
      onTime: Number(r.onTime),
      percent: pct(Number(r.done), Number(r.expected), 0),
    }))
    .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0));
  const hwAll = homework.reduce((a, h) => ({ done: a.done + h.done, expected: a.expected + h.expected }), { done: 0, expected: 0 });

  return {
    period,
    periodLabel: periodLabel(period),
    range: { from: ymdOfDateOnly(monthStart), to: ymdOfDateOnly(new Date(monthEnd.getTime() - 86_400_000)) },
    revenue: { ...totals, series },
    methods: methodRows
      .filter((m) => m.method)
      .map((m) => ({ method: m.method, label: METHOD_LABEL[m.method], amount: Number(m.amount), count: m.count }))
      .sort((a, b) => b.amount - a.amount),
    overdue: overdueRows.map((p) => ({
      id: p.id,
      student: { id: p.student.id, fullName: p.student.fullName, code: p.student.studentProfile?.code ?? "", status: p.student.studentProfile?.status ?? null },
      group: p.group,
      amount: p.amount - p.paidAmount, // qolgan qarz (qisman toʻlangan boʻlishi mumkin)
      paidAmount: p.paidAmount,
      status: effectiveStatus(p, today),
      dueDate: ymdOfDateOnly(p.dueDate),
      daysOverdue: Math.max(0, Math.round((today.getTime() - p.dueDate.getTime()) / 86_400_000)),
      parents: p.student.parents.map((x) => ({ fullName: x.parent.fullName, phone: x.parent.phone, relation: x.relation, telegramLinked: !!x.parent.telegramLink?.isActive })),
    })),
    students: {
      start: startCount,
      end: endCount,
      new: newCount,
      left: leftRows.length,
      graduated,
      net: endCount - startCount,
      retention: churn == null ? null : Math.round((100 - churn) * 10) / 10,
      churn,
      leftList: leftRows.map((r) => {
        const a = leftNotes.find((n) => n.entityId === r.userId && (n.after as { status?: string } | null)?.status === "LEFT");
        return { id: r.userId, fullName: r.user.fullName, code: r.code, date: ymdOfDateOnly(r.leftAt), note: ((a?.after as { note?: string } | null)?.note) ?? null };
      }),
    },
    attendance: { average: pct(attAll.attended, attAll.total, 1), groups: attendance },
    teachers: {
      items: teacherLoad,
      normHours: WEEKLY_NORM_HOURS,
      totalGroups: activeGroups.length,
      avgGroups: withGroups.length ? Math.round((activeGroups.filter((g) => g.teacherId).length / withGroups.length) * 10) / 10 : null,
      avgStudents: withGroups.length ? Math.round((withGroups.reduce((a, t) => a + t.students, 0) / withGroups.length) * 10) / 10 : null,
      unassignedGroups,
    },
    telegram: {
      students: { linked: stuLinked, total: stuTotal, percent: pct(stuLinked, stuTotal, 0) },
      parents: { linked: parLinked, total: parTotal, percent: pct(parLinked, parTotal, 0) },
      unlinkedParents: unlinkedParents.map((p) => ({ id: p.id, fullName: p.fullName, phone: p.phone, children: p.children.map((c) => c.student) })),
    },
    homework: { average: pct(hwAll.done, hwAll.expected, 0), groups: homework },
  };
}

const reportQuery = z.object({ period: zPeriod.optional() });

export default async function reports(app: FastifyInstance) {
  app.get("/reports", async (req) => {
    const { period = currentPeriod() } = parse(reportQuery, req.query);
    return buildReport(period);
  });

  app.get("/reports/export.csv", async (req, reply) => {
    const { period = currentPeriod(), table } = parse(
      reportQuery.extend({ table: z.enum(["summary", "overdue", "attendance", "teachers", "homework", "revenue", "telegram"]).default("summary") }),
      req.query,
    );
    const r = await buildReport(period);
    let csv: string;
    switch (table) {
      case "overdue":
        csv = toCsv(
          ["Oʻquvchi", "Kod", "Guruh", "Summa (soʻm)", "Muddat", "Kechikish (kun)", "Ota-ona", "Telefon"],
          r.overdue.map((o) => [o.student.fullName, o.student.code, o.group?.name ?? "", o.amount, csvDate(o.dueDate ? dateOnly(o.dueDate) : null), o.daysOverdue, o.parents.map((p) => p.fullName).join("; "), o.parents.map((p) => p.phone ?? "").join("; ")]),
        );
        break;
      case "attendance":
        csv = toCsv(["Guruh kodi", "Guruh", "Ustoz", "Keldi", "Jami belgilar", "Kechikdi", "Kelmadi", "Davomat %"], r.attendance.groups.map((g) => [g.code, g.name, g.teacher ?? "", g.attended, g.total, g.late, g.absent, g.percent ?? ""]));
        break;
      case "teachers":
        csv = toCsv(["Ustoz", "Guruhlar", "Oʻquvchilar", "Haftalik soat", "Oʻtilgan darslar (oy)", "Yuklama %", "Holat"], r.teachers.items.map((t) => [t.fullName, t.groups, t.students, t.weeklyHours, t.lessonsDone, t.loadPercent, t.loadLabel]));
        break;
      case "homework":
        csv = toCsv(["Guruh kodi", "Guruh", "Vazifalar", "Kutilgan topshiriqlar", "Topshirilgan", "Oʻz vaqtida", "Bajarilish %"], r.homework.groups.map((h) => [h.code, h.name, h.homework, h.expected, h.done, h.onTime, h.percent ?? ""]));
        break;
      case "revenue":
        csv = toCsv(["Davr", "Reja (soʻm)", "Yigʻilgan (soʻm)", "Bajarilish %"], r.revenue.series.map((s) => [s.label, s.plan, s.collected, s.percent ?? ""]));
        break;
      case "telegram":
        csv = toCsv(["Ota-ona", "Telefon", "Farzand(lar)"], r.telegram.unlinkedParents.map((p) => [p.fullName, p.phone ?? "", p.children.map((c) => c.fullName).join("; ")]));
        break;
      default:
        csv = toCsv(
          ["Koʻrsatkich", "Qiymat"],
          [
            ["Davr", r.periodLabel],
            ["Reja (soʻm)", r.revenue.plan],
            ["Yigʻilgan (soʻm)", r.revenue.collected],
            ["Kutilayotgan (soʻm)", r.revenue.pending],
            ["Muddati oʻtgan (soʻm)", r.revenue.overdue],
            ["Bajarilish %", r.revenue.collectedPercent ?? ""],
            [`${PAY_STATUS_LABEL.PAID} (soni)`, r.revenue.counts.PAID],
            [`${PAY_STATUS_LABEL.PENDING} (soni)`, r.revenue.counts.PENDING],
            [`${PAY_STATUS_LABEL.OVERDUE} (soni)`, r.revenue.counts.OVERDUE],
            ["Oy boshida oʻquvchilar", r.students.start],
            ["Oy oxirida oʻquvchilar", r.students.end],
            ["Yangi", r.students.new],
            ["Ketgan", r.students.left],
            ["Bitirgan", r.students.graduated],
            ["Sof oʻsish", r.students.net],
            ["Retention %", r.students.retention ?? ""],
            ["Churn %", r.students.churn ?? ""],
            ["Oʻrtacha davomat %", r.attendance.average ?? ""],
            ["Uyga vazifa bajarilishi %", r.homework.average ?? ""],
            ["Telegram qamrovi (oʻquvchilar) %", r.telegram.students.percent ?? ""],
          ],
        );
    }
    return sendCsv(reply, `hisobot-${period}-${table}.csv`, csv);
  });
}
