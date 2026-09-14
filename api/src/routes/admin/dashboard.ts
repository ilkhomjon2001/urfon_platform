// Admin bosh sahifasi: KPI, bugungi darslar, diqqat talab qiladigan holatlar, audit lentasi, grafiklar.
import type { FastifyInstance } from "fastify";
import { prisma } from "../../db.js";
import { addDays, endOfDayTz, periodOf, startOfDayTz, startOfMonthTz, startOfWeekTz, toDbDate, ymdTz } from "../../lib/dates.js";
import { BUSY_STATUSES, levelLabel, pct, scheduleText } from "./a/schedule.js";

const MONTH_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
const LOW_ATTENDANCE = 75;
const REVIEW_SLA_H = 48;

const isPresent = (s: string) => s === "PRESENT" || s === "LATE";

/** "2024-05" → oldingi n ta davr (o'sish tartibida, oxirgisi joriy) */
function lastPeriods(period: string, n: number) {
  const [y, m] = period.split("-").map(Number);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export default async function dashboard(app: FastifyInstance) {
  app.get("/dashboard", async () => {
    const now = new Date();
    const dayStart = startOfDayTz(now);
    const dayEnd = endOfDayTz(now);
    const monthStart = startOfMonthTz(now);
    const period = periodOf(now);
    const monthStartDate = toDbDate(`${period}-01`); // @db.Date ustunlar uchun
    const periods = lastPeriods(period, 6);

    const [
      studentStatus, newStudents, leftStudents, profiles,
      attToday, attMonth, todayLessons,
      payAgg, overdueRows, planRows,
      groups, teachersActive, roomsTotal,
      parentsTotal, parentsLinked, studentsTotal, studentsLinked,
      lowAttRows, lateSubs, unmarked, audit, revenueRows, trendRows, levelRows,
    ] = await Promise.all([
      prisma.studentProfile.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.studentProfile.count({ where: { enrolledAt: { gte: monthStartDate } } }),
      prisma.studentProfile.count({ where: { leftAt: { gte: monthStartDate } } }),
      prisma.studentProfile.findMany({ select: { enrolledAt: true, leftAt: true, status: true } }),
      prisma.attendance.groupBy({ by: ["status"], where: { lesson: { startsAt: { gte: dayStart, lte: dayEnd } } }, _count: { _all: true } }),
      prisma.attendance.groupBy({ by: ["status"], where: { lesson: { startsAt: { gte: monthStart, lte: now } } }, _count: { _all: true } }),
      prisma.lesson.findMany({
        where: { startsAt: { gte: dayStart, lte: dayEnd } },
        orderBy: { startsAt: "asc" },
        select: {
          id: true, number: true, title: true, startsAt: true, endsAt: true, status: true,
          room: { select: { name: true } },
          group: {
            select: {
              id: true, code: true, name: true, teacher: { select: { id: true, fullName: true } },
              _count: { select: { students: { where: { status: "ACTIVE" } } } },
            },
          },
          attendance: { select: { status: true } },
        },
      }),
      prisma.payment.groupBy({ by: ["status"], where: { period }, _sum: { amount: true }, _count: { _all: true } }),
      prisma.payment.findMany({ where: { status: "OVERDUE" }, select: { amount: true, dueDate: true, studentId: true } }),
      prisma.groupStudent.findMany({
        where: { status: "ACTIVE", group: { status: { in: BUSY_STATUSES } } },
        select: { group: { select: { monthlyFee: true } } },
      }),
      prisma.group.findMany({
        select: {
          id: true, code: true, name: true, status: true, teacherId: true, roomId: true, startDate: true,
          days: true, startTime: true, endTime: true, capacity: true, levelId: true,
          _count: { select: { students: { where: { status: { in: ["ACTIVE", "WAITING"] } } } } },
        },
      }),
      prisma.user.count({ where: { role: "TEACHER", isActive: true } }),
      prisma.room.count(),
      prisma.user.count({ where: { role: "PARENT", isActive: true } }),
      prisma.user.count({ where: { role: "PARENT", isActive: true, telegramLink: { isActive: true } } }),
      prisma.user.count({ where: { role: "STUDENT", isActive: true, studentProfile: { status: { not: "LEFT" } } } }),
      prisma.user.count({ where: { role: "STUDENT", isActive: true, studentProfile: { status: { not: "LEFT" } }, telegramLink: { isActive: true } } }),
      prisma.attendance.groupBy({ by: ["studentId", "status"], where: { lesson: { startsAt: { gte: monthStart, lte: now } } }, _count: { _all: true } }),
      prisma.submission.findMany({
        where: { status: "SUBMITTED", submittedAt: { lt: new Date(now.getTime() - REVIEW_SLA_H * 3600_000) } },
        select: { submittedAt: true, homework: { select: { group: { select: { id: true, name: true, teacher: { select: { id: true, fullName: true } } } } } } },
      }),
      prisma.lesson.findMany({
        where: { status: { in: ["PLANNED", "IN_PROGRESS"] }, endsAt: { lt: now, gte: addDays(now, -7) } },
        select: { id: true, startsAt: true, group: { select: { id: true, name: true, teacher: { select: { fullName: true } } } } },
        orderBy: { startsAt: "asc" },
      }),
      prisma.auditLog.findMany({
        orderBy: { id: "desc" },
        take: 8,
        select: { id: true, at: true, action: true, entityType: true, entityId: true, summary: true, actor: { select: { fullName: true, role: true } } },
      }),
      prisma.payment.groupBy({ by: ["period", "status"], where: { period: { in: periods } }, _sum: { amount: true } }),
      prisma.attendance.findMany({
        where: { lesson: { startsAt: { gte: addDays(startOfWeekTz(now), -7 * 7), lte: now } } },
        select: { status: true, lesson: { select: { startsAt: true } } },
      }),
      prisma.groupStudent.findMany({
        where: { status: "ACTIVE", group: { status: { in: BUSY_STATUSES } } },
        select: { studentId: true, group: { select: { level: { select: { id: true, code: true, name: true, order: true } } } } },
      }),
    ]);

    // ── O'quvchilar ──
    const st = Object.fromEntries(studentStatus.map((s) => [s.status, s._count._all])) as Record<string, number>;
    const activeStudents = st.ACTIVE ?? 0;
    const prevActive = activeStudents - newStudents + leftStudents;

    // ── Davomat ──
    const sumAtt = (rows: { status: string; _count: { _all: number } }[]) => {
      const total = rows.reduce((s, r) => s + r._count._all, 0);
      const present = rows.filter((r) => isPresent(r.status)).reduce((s, r) => s + r._count._all, 0);
      const excused = rows.find((r) => r.status === "EXCUSED")?._count._all ?? 0;
      const absent = rows.find((r) => r.status === "ABSENT")?._count._all ?? 0;
      const late = rows.find((r) => r.status === "LATE")?._count._all ?? 0;
      return { total, present, excused, absent, late, pct: pct(present, total) };
    };
    const today = sumAtt(attToday);
    const month = sumAtt(attMonth);
    const expectedToday = todayLessons.filter((l) => l.status !== "CANCELLED").reduce((s, l) => s + l.group._count.students, 0);

    // ── To'lovlar ──
    const pay = (s: string) => payAgg.find((p) => p.status === s);
    const collected = pay("PAID")?._sum.amount ?? 0;
    const plan = planRows.reduce((s, r) => s + r.group.monthlyFee, 0);
    const overdueSum = overdueRows.reduce((s, r) => s + r.amount, 0);
    const oldestDue = overdueRows.reduce<Date | null>((m, r) => (!m || r.dueDate < m ? r.dueDate : m), null);

    // ── Guruhlar ──
    const busy = groups.filter((g) => BUSY_STATUSES.includes(g.status));
    const noTeacher = busy.filter((g) => !g.teacherId);
    const usedRooms = new Set(busy.map((g) => g.roomId).filter(Boolean)).size;

    // ── Diqqat talab qiladi ──
    type Alert = {
      id: string; kind: string; severity: "high" | "medium" | "low"; title: string; subtitle: string;
      section: string; context: string | null; due: string | null; dueAt: Date | null; to: string; action: string;
      amount?: number;
      items?: { id: string; label: string; to: string }[];
    };
    const alerts: Alert[] = [];
    if (noTeacher.length) {
      const nextLessons = await prisma.lesson.findMany({
        where: { groupId: { in: noTeacher.map((g) => g.id) }, status: "PLANNED", startsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        distinct: ["groupId"],
        select: { groupId: true, startsAt: true },
      });
      const nextMap = new Map(nextLessons.map((l) => [l.groupId, l.startsAt]));
      for (const g of noTeacher) {
        const nextAt = nextMap.get(g.id) ?? null;
        alerts.push({
          id: `no-teacher-${g.id}`,
          kind: "group_without_teacher",
          severity: "high",
          title: `${g.name} guruhiga ustoz biriktirilmagan`,
          subtitle: `${g._count.students} nafar oʻquvchi kutmoqda · ${scheduleText(g.days, g.startTime, g.endTime)}`,
          section: "Guruhlar",
          context: g.name,
          due: null,
          dueAt: nextAt,
          to: `/admin/guruhlar?group=${g.id}&assign=1`,
          action: "Ustoz biriktirish",
        });
      }
    }
    if (overdueRows.length) {
      alerts.push({
        id: "overdue-payments",
        kind: "overdue_payments",
        severity: "medium",
        title: `${overdueRows.length} ta toʻlov muddati oʻtgan`,
        subtitle: `Jami qarz: ${overdueSum.toLocaleString("ru-RU").replace(/\s/g, " ")} soʻm`,
        amount: overdueSum,
        section: "Moliya va toʻlovlar",
        context: `${new Set(overdueRows.map((r) => r.studentId)).size} nafar oʻquvchi`,
        due: null,
        dueAt: oldestDue,
        to: "/admin/tolovlar?status=OVERDUE",
        action: "Koʻrish",
      });
    }
    // davomati past o'quvchilar (oy davomida kamida 3 ta belgilangan dars)
    const perStudent = new Map<string, { p: number; t: number }>();
    for (const r of lowAttRows) {
      const m = perStudent.get(r.studentId) ?? { p: 0, t: 0 };
      m.t += r._count._all;
      if (isPresent(r.status)) m.p += r._count._all;
      perStudent.set(r.studentId, m);
    }
    const low = [...perStudent].filter(([, m]) => m.t >= 3 && (m.p / m.t) * 100 < LOW_ATTENDANCE);
    if (low.length) {
      const users = await prisma.user.findMany({
        where: { id: { in: low.map(([id]) => id) } },
        select: { id: true, fullName: true, studentProfile: { select: { code: true } } },
      });
      const sorted = low.map(([id, m]) => ({ id, pct: Math.round((m.p / m.t) * 100), u: users.find((u) => u.id === id) })).sort((a, b) => a.pct - b.pct);
      alerts.push({
        id: "low-attendance",
        kind: "low_attendance",
        severity: "medium",
        title: `${low.length} nafar oʻquvchi davomati ${LOW_ATTENDANCE}% dan past`,
        subtitle: sorted.slice(0, 3).map((s) => `${s.u?.fullName ?? "—"} (${s.pct}%)`).join(", ") + (sorted.length > 3 ? " …" : ""),
        section: "Davomat",
        context: "Joriy oy",
        due: null,
        dueAt: null,
        to: "/admin/oquvchilar",
        action: "Koʻrish",
        items: sorted.slice(0, 8).map((s) => ({
          id: s.id,
          label: `${s.u?.fullName ?? "—"} — ${s.pct}%`,
          to: `/admin/oquvchilar?q=${encodeURIComponent(s.u?.studentProfile?.code ?? s.u?.fullName ?? "")}`,
        })),
      });
    }
    if (lateSubs.length) {
      const byTeacher = new Map<string, { name: string; n: number; groups: Set<string> }>();
      for (const s of lateSubs) {
        const t = s.homework.group.teacher;
        const key = t?.id ?? "none";
        const m = byTeacher.get(key) ?? { name: t?.fullName ?? "Ustozsiz guruh", n: 0, groups: new Set<string>() };
        m.n++;
        m.groups.add(s.homework.group.name);
        byTeacher.set(key, m);
      }
      const top = [...byTeacher].sort((a, b) => b[1].n - a[1].n);
      const oldest = lateSubs.reduce<Date | null>((m, s) => (s.submittedAt && (!m || s.submittedAt < m) ? s.submittedAt : m), null);
      alerts.push({
        id: "late-reviews",
        kind: "late_reviews",
        severity: "medium",
        title: `${lateSubs.length} ta vazifa ${REVIEW_SLA_H} soatdan beri tekshirilmagan`,
        subtitle: top.slice(0, 3).map(([, m]) => `${m.name} — ${m.n} ta`).join(", "),
        section: "Akademik nazorat",
        context: [...new Set(top.flatMap(([, m]) => [...m.groups]))].slice(0, 2).join(", "),
        due: null,
        dueAt: oldest,
        to: top[0][0] !== "none" ? `/admin/ustozlar?teacher=${top[0][0]}` : "/admin/ustozlar",
        action: "Koʻrish",
      });
    }
    if (unmarked.length) {
      const g0 = unmarked[0].group;
      alerts.push({
        id: "unmarked-lessons",
        kind: "unmarked_lessons",
        severity: "low",
        title: `${unmarked.length} ta dars yakunlanmagan`,
        subtitle: `Davomat va dars xulosasi kiritilmagan (oxirgi 7 kun). Masalan: ${g0.name}${g0.teacher ? `, ${g0.teacher.fullName}` : ""}`,
        section: "Darslar",
        context: [...new Set(unmarked.map((l) => l.group.name))].slice(0, 2).join(", "),
        due: null,
        dueAt: unmarked[0].startsAt,
        to: `/admin/guruhlar?group=${g0.id}`,
        action: "Guruhni ochish",
      });
    }

    // ── Grafiklar ──
    const revenue = periods.map((p) => {
      const rows = revenueRows.filter((r) => r.period === p);
      const s = (st: string) => rows.find((r) => r.status === st)?._sum.amount ?? 0;
      const m = Number(p.slice(5)) - 1;
      return { period: p, label: MONTH_SHORT[m], collected: s("PAID"), pending: s("PENDING"), overdue: s("OVERDUE") };
    });
    const weekStart = startOfWeekTz(now);
    const trend = Array.from({ length: 8 }, (_, i) => {
      const from = addDays(weekStart, -7 * (7 - i));
      const to = addDays(from, 7);
      const rows = trendRows.filter((r) => r.lesson.startsAt >= from && r.lesson.startsAt < to);
      const ymd = ymdTz(from);
      return {
        weekStart: from,
        label: `${Number(ymd.slice(8))}.${ymd.slice(5, 7)}`,
        pct: pct(rows.filter((r) => isPresent(r.status)).length, rows.length),
        marked: rows.length,
      };
    });
    const growth = periods.map((p) => {
      const [y, m] = p.split("-").map(Number);
      const end = toDbDate(new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10)); // keyingi oy boshi (@db.Date)
      const count = profiles.filter((s) => s.enrolledAt < end && (!s.leftAt || s.leftAt >= end) && (s.status === "ACTIVE" || s.status === "ACADEMIC_LEAVE" || s.leftAt)).length;
      return { period: p, label: MONTH_SHORT[m - 1], count };
    });
    const byLevel = new Map<string, { id: string | null; label: string; order: number; students: Set<string> }>();
    for (const r of levelRows) {
      const lv = r.group.level;
      const key = lv?.id ?? "none";
      const m = byLevel.get(key) ?? { id: lv?.id ?? null, label: levelLabel(lv) ?? "Levelsiz", order: lv?.order ?? 999, students: new Set<string>() };
      m.students.add(r.studentId);
      byLevel.set(key, m);
    }
    const levelTotal = [...byLevel.values()].reduce((s, l) => s + l.students.size, 0);
    const levels = [...byLevel.values()]
      .sort((a, b) => a.order - b.order)
      .map((l) => ({ id: l.id, label: l.label, students: l.students.size, pct: pct(l.students.size, levelTotal) }));

    const SEV = { high: 0, medium: 1, low: 2 } as const;
    alerts.sort((a, b) => SEV[a.severity] - SEV[b.severity]);

    return {
      now,
      period,
      monthStart,
      kpis: {
        students: {
          active: activeStudents,
          total: Object.values(st).reduce((s, n) => s + n, 0),
          academicLeave: st.ACADEMIC_LEAVE ?? 0,
          graduated: st.GRADUATED ?? 0,
          left: st.LEFT ?? 0,
          newThisMonth: newStudents,
          leftThisMonth: leftStudents,
          prevMonthActive: prevActive,
          changePct: prevActive > 0 ? Math.round(((activeStudents - prevActive) / prevActive) * 1000) / 10 : null,
        },
        attendance: {
          todayPct: today.pct,
          todayPresent: today.present,
          todayMarked: today.total,
          todayExpected: expectedToday,
          todayExcused: today.excused,
          todayAbsent: today.absent,
          monthPct: month.pct,
          monthMarked: month.total,
        },
        payments: {
          collected,
          collectedCount: pay("PAID")?._count._all ?? 0,
          plan,
          planPct: pct(collected, plan),
          pending: pay("PENDING")?._sum.amount ?? 0,
          pendingCount: pay("PENDING")?._count._all ?? 0,
          overdue: overdueSum,
          overdueCount: overdueRows.length,
        },
        groups: {
          active: groups.filter((g) => g.status === "ACTIVE").length,
          enrolling: groups.filter((g) => g.status === "ENROLLING").length,
          finished: groups.filter((g) => g.status === "FINISHED").length,
          withoutTeacher: noTeacher.length,
          roomsUsed: usedRooms,
          roomsTotal,
          roomsUsagePct: pct(usedRooms, roomsTotal),
        },
        teachers: {
          active: teachersActive,
          avgGroups: teachersActive ? Math.round((busy.filter((g) => g.teacherId).length / teachersActive) * 10) / 10 : 0,
        },
        telegram: {
          parentsTotal, parentsLinked, parentsPct: pct(parentsLinked, parentsTotal),
          studentsTotal, studentsLinked, studentsPct: pct(studentsLinked, studentsTotal),
        },
      },
      todayLessons: todayLessons.map((l) => {
        const live = l.status === "IN_PROGRESS" || (l.status === "PLANNED" && l.startsAt <= now && l.endsAt >= now);
        return {
          id: l.id,
          number: l.number,
          title: l.title,
          startsAt: l.startsAt,
          endsAt: l.endsAt,
          status: l.status,
          live,
          overdue: l.status === "PLANNED" && l.endsAt < now,
          group: { id: l.group.id, code: l.group.code, name: l.group.name },
          teacher: l.group.teacher,
          room: l.room?.name ?? null,
          students: l.group._count.students,
          marked: l.attendance.length,
          present: l.attendance.filter((a) => isPresent(a.status)).length,
        };
      }),
      alerts,
      recentAudit: audit.map((a) => ({
        id: a.id.toString(), at: a.at, action: a.action, entityType: a.entityType, entityId: a.entityId,
        summary: a.summary, actor: a.actor?.fullName ?? "Tizim", actorRole: a.actor?.role ?? null,
      })),
      charts: { revenue, attendanceTrend: trend, studentsGrowth: growth, levels, levelTotal },
    };
  });
}
