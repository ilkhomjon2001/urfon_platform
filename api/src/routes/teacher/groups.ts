// Ustoz: "Guruhlarim" va guruh tafsiloti (teacher-a).
// Ko'lam: faqat req.auth.userId ga biriktirilgan guruhlar (assertTeacherGroup / teacherId filtri).
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AttendanceStatus, CoinReason, Level, Room } from "@prisma/client";
import { prisma } from "../../db.js";
import { parse, idParam } from "../../lib/http.js";
import { assertTeacherGroup } from "../../lib/access.js";
import { notFound } from "../../lib/errors.js";
import { addDays, dbDateYmd, startOfMonthTz, startOfWeekTz } from "../../lib/dates.js";

// ───────────────────────── Umumiy yordamchilar (dashboard/lessons/schedule ham ishlatadi) ─────────────────────────

export const DAY_SHORT = ["", "Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"] as const;
export const DAY_LONG = ["", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"] as const;
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const OFFSET_MS = 5 * 3600_000;

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

export const scheduleText = (days: number[], start: string, end: string) =>
  `${[...days].sort((a, b) => a - b).map((d) => DAY_SHORT[d] ?? "").join(" · ")}, ${start}–${end}`;

/** Guruh jadvali bo'yicha haftalik soat (1 kasr). */
export const groupWeeklyHours = (g: { days: number[]; startTime: string; endTime: string }) =>
  (g.days.length * Math.max(0, toMin(g.endTime) - toMin(g.startTime))) / 60;

export const round1 = (n: number) => Math.round(n * 10) / 10;
/** Foiz, 1 kasr bilan (92.8). Maxraj 0 bo'lsa null. */
export const pct = (a: number, b: number) => (b > 0 ? round1((a * 100) / b) : null);

export function gradeLabel(v: number | null | undefined) {
  if (v == null) return null;
  if (v >= 4.5) return "Aʼlo";
  if (v >= 3.5) return "Yaxshi";
  if (v >= 2.5) return "Qoniqarli";
  return "Qoniqarsiz";
}
export const GRADE_NAME: Record<number, string> = { 5: "Aʼlo", 4: "Yaxshi", 3: "Qoniqarli", 2: "Qoniqarsiz" };

export const ATT_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Keldi",
  LATE: "Kechikdi",
  EXCUSED: "Sababli",
  ABSENT: "Kelmadi",
};

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Toshkent vaqti "HH:MM". */
export const hhmmTz = (d: Date) => new Date(d.getTime() + OFFSET_MS).toISOString().slice(11, 16);
/** "14-sentabr" (Toshkent). */
export function dayMonthTz(d: Date) {
  const l = new Date(d.getTime() + OFFSET_MS);
  return `${l.getUTCDate()}-${MONTHS[l.getUTCMonth()]}`;
}

export const levelDto = (l: Level | null) =>
  l ? { id: l.id, code: l.code, name: l.name, order: l.order, label: /^L\d+$/.test(l.code) ? `Level ${l.order} · ${l.name}` : l.name } : null;

export const roomDto = (r: Room | null) => (r ? { id: r.id, name: r.name, location: r.location, capacity: r.capacity, kind: r.kind } : null);

type TopicLite = { id: string; unit: number; title: string };
export const topicLabel = (t: TopicLite) => `Unit ${t.unit} — ${t.title}`;

/** Bir nechta guruh bo'yicha karta ko'rsatkichlari (bitta so'rovlar to'plami bilan). */
export async function groupStats(groupIds: string[], now = new Date()) {
  const ids = groupIds.length ? groupIds : ["-"];
  const monthStart = startOfMonthTz(now);
  const [active, waiting, done, att, grades, pending, upcoming, lastDone] = await Promise.all([
    prisma.groupStudent.groupBy({ by: ["groupId"], where: { groupId: { in: ids }, status: "ACTIVE" }, _count: { _all: true } }),
    prisma.groupStudent.groupBy({ by: ["groupId"], where: { groupId: { in: ids }, status: "WAITING" }, _count: { _all: true } }),
    prisma.lesson.groupBy({ by: ["groupId"], where: { groupId: { in: ids }, status: "DONE" }, _count: { _all: true } }),
    prisma.$queryRaw<{ groupId: string; attended: number; total: number }[]>`
      SELECT l."groupId", count(*) FILTER (WHERE a.status IN ('PRESENT','LATE'))::int AS attended, count(*)::int AS total
      FROM "Attendance" a JOIN "Lesson" l ON l.id = a."lessonId"
      WHERE l."groupId" = ANY(${ids}) AND l."startsAt" >= ${monthStart} AND l."startsAt" <= ${now} AND l.status <> 'CANCELLED'
      GROUP BY l."groupId"`,
    prisma.grade.groupBy({ by: ["groupId"], where: { groupId: { in: ids } }, _avg: { value: true }, _count: { _all: true } }),
    prisma.$queryRaw<{ groupId: string; n: number }[]>`
      SELECT h."groupId", count(*)::int AS n FROM "Submission" s JOIN "Homework" h ON h.id = s."homeworkId"
      WHERE s.status = 'SUBMITTED' AND h."groupId" = ANY(${ids}) GROUP BY h."groupId"`,
    prisma.lesson.findMany({
      where: { groupId: { in: ids }, status: { in: ["PLANNED", "IN_PROGRESS"] }, endsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      distinct: ["groupId"],
      include: { topics: { include: { topic: { select: { id: true, unit: true, title: true } } } }, room: true },
    }),
    prisma.lesson.findMany({
      where: { groupId: { in: ids }, status: "DONE" },
      orderBy: { startsAt: "desc" },
      distinct: ["groupId"],
      include: { topics: { include: { topic: { select: { id: true, unit: true, title: true } } } } },
    }),
  ]);
  const m = <T extends { groupId: string }>(rows: T[]) => new Map(rows.map((r) => [r.groupId, r]));
  const [mA, mW, mD, mAtt, mG, mP, mU, mL] = [m(active), m(waiting), m(done), m(att), m(grades), m(pending), m(upcoming), m(lastDone)];
  return (groupId: string) => {
    const a = mAtt.get(groupId);
    const g = mG.get(groupId);
    const next = mU.get(groupId);
    const last = mL.get(groupId);
    const lastTopics = (last?.topics ?? []).map((t) => t.topic).sort((x, y) => x.unit - y.unit);
    const avg = g?._avg.value ?? null;
    return {
      studentsCount: mA.get(groupId)?._count._all ?? 0,
      waitingCount: mW.get(groupId)?._count._all ?? 0,
      doneLessons: mD.get(groupId)?._count._all ?? 0,
      monthAttendancePct: a ? pct(a.attended, a.total) : null,
      averageGrade: avg != null ? round1(avg) : null,
      averageGradeLabel: gradeLabel(avg),
      gradesCount: g?._count._all ?? 0,
      pendingReviews: mP.get(groupId)?.n ?? 0,
      nextLesson: next
        ? {
            id: next.id,
            title: next.title,
            startsAt: next.startsAt,
            endsAt: next.endsAt,
            status: next.status,
            room: roomDto(next.room),
            topics: next.topics.map((t) => t.topic),
          }
        : null,
      lastLesson: last ? { id: last.id, title: last.title, startsAt: last.startsAt, topics: lastTopics } : null,
      currentUnit: lastTopics.length ? lastTopics[lastTopics.length - 1] : null,
    };
  };
}

type GroupRow = Awaited<ReturnType<typeof loadGroups>>[number];
function loadGroups(teacherId: string, where: { id?: string } = {}) {
  return prisma.group.findMany({
    where: { teacherId, ...where },
    include: { level: true, room: true },
    orderBy: [{ startTime: "asc" }, { code: "asc" }],
  });
}

function groupCard(g: GroupRow, st: ReturnType<Awaited<ReturnType<typeof groupStats>>>) {
  return {
    id: g.id,
    code: g.code,
    name: g.name,
    status: g.status,
    level: levelDto(g.level),
    room: roomDto(g.room),
    schedule: { days: g.days, startTime: g.startTime, endTime: g.endTime, text: scheduleText(g.days, g.startTime, g.endTime) },
    weeklyHours: round1(groupWeeklyHours(g)),
    startDate: dbDateYmd(g.startDate),
    endDate: g.endDate ? dbDateYmd(g.endDate) : null,
    capacity: g.capacity,
    totalLessons: g.totalLessons,
    ...st,
    progressPct: g.totalLessons ? Math.round((st.doneLessons * 100) / g.totalLessons) : 0,
  };
}

// ───────────────────────── Routes ─────────────────────────

const studentParam = z.object({ id: z.string().min(1).max(40), studentId: z.string().min(1).max(40) });

export default async function groups(app: FastifyInstance) {
  // Guruhlarim — kartalar + umumiy ko'rsatkichlar
  app.get("/groups", async (req) => {
    const rows = await loadGroups(req.auth.userId);
    const stats = await groupStats(rows.map((g) => g.id));
    const items = rows.map((g) => groupCard(g, stats(g.id)));
    const live = items.filter((g) => g.status !== "FINISHED");
    const attVals = live.map((g) => g.monthAttendancePct).filter((v): v is number => v != null);
    const gradeRows = live.filter((g) => g.averageGrade != null && g.gradesCount > 0);
    const gradeSum = gradeRows.reduce((s, g) => s + (g.averageGrade ?? 0) * g.gradesCount, 0);
    const gradeCnt = gradeRows.reduce((s, g) => s + g.gradesCount, 0);
    const students = await prisma.groupStudent.findMany({
      where: { group: { teacherId: req.auth.userId, status: { not: "FINISHED" } }, status: "ACTIVE" },
      select: { studentId: true },
      distinct: ["studentId"],
    });
    return {
      items,
      summary: {
        groups: live.length,
        activeGroups: live.filter((g) => g.status === "ACTIVE").length,
        enrollingGroups: live.filter((g) => g.status === "ENROLLING").length,
        // KANON §6: guruhlardagi faol o'quvchilar yig'indisi (16 + 14 + 8 + 18 + 12 = 68)
        students: live.reduce((s, g) => s + g.studentsCount, 0),
        uniqueStudents: students.length,
        weeklyHours: round1(live.reduce((s, g) => s + g.weeklyHours, 0)),
        monthAttendancePct: attVals.length ? round1(attVals.reduce((s, v) => s + v, 0) / attVals.length) : null,
        averageGrade: gradeCnt ? round1(gradeSum / gradeCnt) : null,
        averageGradeLabel: gradeCnt ? gradeLabel(gradeSum / gradeCnt) : null,
        pendingReviews: live.reduce((s, g) => s + g.pendingReviews, 0),
      },
    };
  });

  // Guruh tafsiloti: sarlavha, o'quvchilar, darslar, sillabus, guruhdagi faollik
  app.get("/groups/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    await assertTeacherGroup(req.auth.userId, id);
    const now = new Date();
    const [g] = await loadGroups(req.auth.userId, { id });
    if (!g) throw notFound("Guruh topilmadi");
    const stats = (await groupStats([id], now))(id);
    const weekStart = startOfWeekTz(now);
    const prevWeekStart = addDays(weekStart, -7);

    const [enrollments, attRows, gradeAgg, homework, subs, coinsWeek, coinsPrevWeek, lessons, lessonAtt, topics, lessonTopics] =
      await Promise.all([
        prisma.groupStudent.findMany({
          where: { groupId: id, status: { in: ["ACTIVE", "WAITING"] } },
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                studentProfile: { select: { code: true, status: true } },
                parents: {
                  select: {
                    relation: true,
                    parent: { select: { id: true, fullName: true, phone: true, telegramLink: { select: { isActive: true } } } },
                  },
                },
              },
            },
          },
        }),
        prisma.$queryRaw<{ studentId: string; attended: number; total: number }[]>`
          SELECT a."studentId", count(*) FILTER (WHERE a.status IN ('PRESENT','LATE'))::int AS attended, count(*)::int AS total
          FROM "Attendance" a JOIN "Lesson" l ON l.id = a."lessonId"
          WHERE l."groupId" = ${id} AND l.status <> 'CANCELLED' GROUP BY a."studentId"`,
        prisma.grade.groupBy({ by: ["studentId"], where: { groupId: id }, _avg: { value: true }, _count: { _all: true } }),
        prisma.homework.findMany({ where: { groupId: id }, select: { id: true, dueAt: true } }),
        prisma.submission.findMany({
          where: { homework: { groupId: id }, status: { in: ["SUBMITTED", "REVIEWED", "RETURNED"] } },
          select: { homeworkId: true, studentId: true },
        }),
        prisma.coinTransaction.groupBy({
          by: ["studentId", "reason"],
          where: { groupId: id, createdAt: { gte: weekStart } },
          _sum: { amount: true },
        }),
        prisma.coinTransaction.aggregate({ where: { groupId: id, createdAt: { gte: prevWeekStart, lt: weekStart } }, _sum: { amount: true } }),
        prisma.lesson.findMany({
          where: { groupId: id },
          orderBy: { startsAt: "asc" },
          include: { room: true, topics: { include: { topic: { select: { id: true, unit: true, title: true } } } } },
        }),
        prisma.attendance.groupBy({ by: ["lessonId", "status"], where: { lesson: { groupId: id } }, _count: { _all: true } }),
        g.levelId
          ? prisma.topic.findMany({ where: { levelId: g.levelId, status: { not: "DRAFT" } }, orderBy: { unit: "asc" } })
          : Promise.resolve([]),
        prisma.lessonTopic.findMany({
          where: { lesson: { groupId: id, status: { not: "CANCELLED" } } },
          select: { topicId: true, lesson: { select: { id: true, status: true, startsAt: true } } },
        }),
      ]);

    // ── O'quvchilar
    const mAtt = new Map(attRows.map((r) => [r.studentId, r]));
    const mGrade = new Map(gradeAgg.map((r) => [r.studentId, r]));
    const dueIds = new Set(homework.filter((h) => h.dueAt <= now).map((h) => h.id));
    const subByStudent = new Map<string, Set<string>>();
    for (const s of subs) {
      if (!subByStudent.has(s.studentId)) subByStudent.set(s.studentId, new Set());
      subByStudent.get(s.studentId)!.add(s.homeworkId);
    }
    const coinsBy = new Map<string, { total: number; byReason: Partial<Record<CoinReason, number>> }>();
    for (const c of coinsWeek) {
      const cur = coinsBy.get(c.studentId) ?? { total: 0, byReason: {} };
      const v = c._sum.amount ?? 0;
      cur.total += v;
      cur.byReason[c.reason] = (cur.byReason[c.reason] ?? 0) + v;
      coinsBy.set(c.studentId, cur);
    }

    const students = enrollments
      .map((e) => {
        const s = e.student;
        const a = mAtt.get(s.id);
        const gr = mGrade.get(s.id);
        const submitted = subByStudent.get(s.id) ?? new Set<string>();
        const early = [...submitted].filter((hid) => !dueIds.has(hid)).length;
        const hwDone = [...submitted].filter((hid) => dueIds.has(hid)).length + early;
        const avg = gr?._avg.value ?? null;
        const parents = s.parents.map((p) => ({
          id: p.parent.id,
          fullName: p.parent.fullName,
          phone: p.parent.phone,
          relation: p.relation,
          telegramLinked: !!p.parent.telegramLink?.isActive,
        }));
        return {
          id: s.id,
          fullName: s.fullName,
          initials: initials(s.fullName),
          code: s.studentProfile?.code ?? null,
          studentStatus: s.studentProfile?.status ?? null,
          enrollmentStatus: e.status,
          joinedAt: dbDateYmd(e.joinedAt),
          attendance: { attended: a?.attended ?? 0, total: a?.total ?? 0, pct: a ? pct(a.attended, a.total) : null },
          averageGrade: avg != null ? round1(avg) : null,
          averageGradeLabel: gradeLabel(avg),
          gradesCount: gr?._count._all ?? 0,
          homework: { done: hwDone, total: dueIds.size + early },
          coinsWeek: coinsBy.get(s.id)?.total ?? 0,
          parents,
          parentTelegramLinked: parents.some((p) => p.telegramLinked),
        };
      })
      .sort((x, y) => (x.enrollmentStatus === y.enrollmentStatus ? x.fullName.localeCompare(y.fullName) : x.enrollmentStatus === "ACTIVE" ? -1 : 1));

    // ── Darslar (timeline)
    const attByLesson = new Map<string, Partial<Record<AttendanceStatus, number>>>();
    for (const r of lessonAtt) {
      const cur = attByLesson.get(r.lessonId) ?? {};
      cur[r.status] = r._count._all;
      attByLesson.set(r.lessonId, cur);
    }
    const activeCount = students.filter((s) => s.enrollmentStatus === "ACTIVE").length;
    const lessonItems = lessons.map((l) => {
      const c = attByLesson.get(l.id) ?? {};
      const present = c.PRESENT ?? 0;
      const late = c.LATE ?? 0;
      const excused = c.EXCUSED ?? 0;
      const absent = c.ABSENT ?? 0;
      return {
        id: l.id,
        number: l.number,
        title: l.title,
        startsAt: l.startsAt,
        endsAt: l.endsAt,
        status: l.status,
        room: roomDto(l.room ?? g.room),
        topics: l.topics.map((t) => t.topic).sort((a, b) => a.unit - b.unit),
        summary: l.summary,
        attendance: { present, late, excused, absent, marked: present + late + excused + absent, attended: present + late, total: activeCount },
      };
    });

    // ── Sillabus (LessonTopic asosida)
    const covered = new Map<string, { done: number; planned: number; lastDoneAt: Date | null; nextAt: Date | null }>();
    for (const lt of lessonTopics) {
      const cur = covered.get(lt.topicId) ?? { done: 0, planned: 0, lastDoneAt: null, nextAt: null };
      if (lt.lesson.status === "DONE") {
        cur.done++;
        if (!cur.lastDoneAt || lt.lesson.startsAt > cur.lastDoneAt) cur.lastDoneAt = lt.lesson.startsAt;
      } else {
        cur.planned++;
        if (lt.lesson.startsAt >= now && (!cur.nextAt || lt.lesson.startsAt < cur.nextAt)) cur.nextAt = lt.lesson.startsAt;
      }
      covered.set(lt.topicId, cur);
    }
    const syllabus = topics
      .filter((t) => t.status === "PUBLISHED" || covered.has(t.id))
      .map((t) => {
        const c = covered.get(t.id);
        return {
          id: t.id,
          unit: t.unit,
          title: t.title,
          description: t.description,
          grammar: t.grammar,
          lessonsCount: t.lessonsCount,
          hours: t.hours,
          status: t.status,
          covered: (c?.done ?? 0) > 0,
          coveredLessons: c?.done ?? 0,
          plannedLessons: c?.planned ?? 0,
          lastCoveredAt: c?.lastDoneAt ?? null,
          nextPlannedAt: c?.nextAt ?? null,
        };
      });
    const firstUncovered = syllabus.find((t) => !t.covered && t.status === "PUBLISHED") ?? null;

    // ── Guruhdagi faollik (faqat guruh ichida, haftalik tanga; seriya/level ko'rsatilmaydi — KANON §8)
    const activity = students
      .filter((s) => s.enrollmentStatus === "ACTIVE")
      .map((s) => {
        const c = coinsBy.get(s.id);
        return {
          studentId: s.id,
          fullName: s.fullName,
          initials: s.initials,
          coins: c?.total ?? 0,
          attendance: c?.byReason.ATTENDANCE ?? 0,
          activity: c?.byReason.ACTIVITY ?? 0,
          homework: c?.byReason.HOMEWORK_ON_TIME ?? 0,
          other: (c?.total ?? 0) - (c?.byReason.ATTENDANCE ?? 0) - (c?.byReason.ACTIVITY ?? 0) - (c?.byReason.HOMEWORK_ON_TIME ?? 0),
        };
      })
      .sort((a, b) => b.coins - a.coins || a.fullName.localeCompare(b.fullName));

    return {
      group: groupCard(g, stats),
      students,
      lessons: lessonItems,
      syllabus: {
        level: levelDto(g.level),
        topics: syllabus,
        coveredCount: syllabus.filter((t) => t.covered).length,
        total: syllabus.length,
        nextTopic: firstUncovered ? { id: firstUncovered.id, unit: firstUncovered.unit, title: firstUncovered.title } : null,
      },
      activity: {
        weekStart,
        items: activity,
        groupTotal: activity.reduce((s, a) => s + a.coins, 0),
        prevWeekTotal: coinsPrevWeek._sum.amount ?? 0,
      },
    };
  });

  // O'quvchi mini-profili (guruh ichida)
  app.get("/groups/:id/students/:studentId", async (req) => {
    const { id, studentId } = parse(studentParam, req.params);
    await assertTeacherGroup(req.auth.userId, id);
    const e = await prisma.groupStudent.findUnique({
      where: { groupId_studentId: { groupId: id, studentId } },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            studentProfile: { select: { code: true, status: true, goal: true, enrolledAt: true, coinBalance: true } },
            parents: {
              select: {
                relation: true,
                parent: { select: { id: true, fullName: true, phone: true, telegramLink: { select: { isActive: true } } } },
              },
            },
          },
        },
      },
    });
    if (!e) throw notFound("Oʻquvchi topilmadi");
    const now = new Date();
    const [grades, pastLessons, att, gradeAgg, hwDue, submitted] = await Promise.all([
      prisma.grade.findMany({
        where: { studentId, groupId: id },
        orderBy: { gradedAt: "desc" },
        take: 10,
        include: { lesson: { select: { id: true, title: true, startsAt: true } } },
      }),
      prisma.lesson.findMany({
        where: { groupId: id, startsAt: { lte: now }, status: { not: "CANCELLED" } },
        orderBy: { startsAt: "desc" },
        take: 10,
        select: { id: true, title: true, startsAt: true, status: true, attendance: { where: { studentId } } },
      }),
      prisma.$queryRaw<{ attended: number; total: number }[]>`
        SELECT count(*) FILTER (WHERE a.status IN ('PRESENT','LATE'))::int AS attended, count(*)::int AS total
        FROM "Attendance" a JOIN "Lesson" l ON l.id = a."lessonId"
        WHERE l."groupId" = ${id} AND a."studentId" = ${studentId} AND l.status <> 'CANCELLED'`,
      prisma.grade.aggregate({ where: { studentId, groupId: id }, _avg: { value: true } }),
      prisma.homework.count({ where: { groupId: id, dueAt: { lte: now } } }),
      prisma.submission.count({
        where: { studentId, homework: { groupId: id, dueAt: { lte: now } }, status: { in: ["SUBMITTED", "REVIEWED", "RETURNED"] } },
      }),
    ]);
    const s = e.student;
    const a = att[0] ?? { attended: 0, total: 0 };
    const avg = gradeAgg._avg.value;
    return {
      student: {
        id: s.id,
        fullName: s.fullName,
        initials: initials(s.fullName),
        code: s.studentProfile?.code ?? null,
        status: s.studentProfile?.status ?? null,
        goal: s.studentProfile?.goal ?? null,
        enrolledAt: s.studentProfile?.enrolledAt ? dbDateYmd(s.studentProfile.enrolledAt) : null,
        coinBalance: s.studentProfile?.coinBalance ?? 0,
        enrollmentStatus: e.status,
        joinedAt: dbDateYmd(e.joinedAt),
      },
      parents: s.parents.map((p) => ({
        id: p.parent.id,
        fullName: p.parent.fullName,
        phone: p.parent.phone,
        relation: p.relation,
        telegramLinked: !!p.parent.telegramLink?.isActive,
      })),
      stats: {
        attendance: { ...a, pct: pct(a.attended, a.total) },
        averageGrade: avg != null ? round1(avg) : null,
        averageGradeLabel: gradeLabel(avg),
        homework: { done: submitted, total: hwDue },
      },
      recentGrades: grades.map((gr) => ({
        id: gr.id,
        value: gr.value,
        label: GRADE_NAME[Math.round(gr.value)] ?? null,
        kind: gr.kind,
        skill: gr.skill,
        title: gr.title,
        comment: gr.comment,
        gradedAt: gr.gradedAt,
        lesson: gr.lesson,
      })),
      recentAttendance: pastLessons.map((l) => ({
        lessonId: l.id,
        title: l.title,
        startsAt: l.startsAt,
        lessonStatus: l.status,
        status: l.attendance[0]?.status ?? null,
        arrivedAt: l.attendance[0]?.arrivedAt ?? null,
        source: l.attendance[0]?.source ?? null,
      })),
    };
  });
}
