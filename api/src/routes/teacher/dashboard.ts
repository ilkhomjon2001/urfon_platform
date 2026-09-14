// Ustoz: bosh sahifa (teacher-a).
import type { FastifyInstance } from "fastify";
import { prisma } from "../../db.js";
import { unreadThreadCount } from "../../lib/messaging.js";
import { addDays, isoWeekdayTz, startOfDayTz, startOfMonthTz, ymdTz } from "../../lib/dates.js";
import { DAY_LONG, groupStats, groupWeeklyHours, hhmmTz, initials, levelDto, pct, round1, roomDto } from "./groups.js";

const auditLink = (entityType: string, entityId: string | null) =>
  entityType === "Lesson" && entityId ? `/ustoz/darslar/${entityId}` : entityType === "Submission" ? "/ustoz/vazifalar" : null;

export default async function dashboard(app: FastifyInstance) {
  app.get("/dashboard", async (req) => {
    const uid = req.auth.userId;
    const now = new Date();
    const dayStart = startOfDayTz(now);
    const dayEnd = addDays(dayStart, 1);
    const monthStart = startOfMonthTz(now);

    const [me, groups] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: uid },
        select: { fullName: true, title: true, avatarUrl: true, teacherProfile: { select: { specialization: true, responseTime: true } } },
      }),
      prisma.group.findMany({ where: { teacherId: uid }, include: { level: true, room: true }, orderBy: [{ startTime: "asc" }, { code: "asc" }] }),
    ]);
    const live = groups.filter((g) => g.status !== "FINISHED");
    const ids = groups.length ? groups.map((g) => g.id) : ["-"];
    const liveIds = live.map((g) => g.id);
    const subWhere = { status: "SUBMITTED" as const, homework: { group: { teacherId: uid } } };

    const [stats, todayLessons, students, pendingReviews, latestSubs, exams, unreadMessages, monthAtt, audits, submittedRecent, turnstile] =
      await Promise.all([
        groupStats(liveIds, now),
        prisma.lesson.findMany({
          where: { groupId: { in: ids }, startsAt: { gte: dayStart, lt: dayEnd } },
          orderBy: { startsAt: "asc" },
          include: {
            room: true,
            topics: { include: { topic: { select: { id: true, unit: true, title: true } } } },
            attendance: { select: { status: true } },
          },
        }),
        prisma.groupStudent.findMany({
          where: { groupId: { in: liveIds.length ? liveIds : ["-"] }, status: "ACTIVE" },
          select: { studentId: true },
          distinct: ["studentId"],
        }),
        prisma.submission.count({ where: subWhere }),
        prisma.submission.findMany({
          where: subWhere,
          orderBy: { submittedAt: "desc" },
          take: 5,
          include: {
            student: { select: { id: true, fullName: true, studentProfile: { select: { code: true } } } },
            homework: { select: { id: true, title: true, type: true, dueAt: true, group: { select: { id: true, code: true, name: true } } } },
          },
        }),
        prisma.exam.findMany({
          where: { startsAt: { gte: now }, OR: [{ groupId: { in: ids } }, { groupId: null }] },
          orderBy: { startsAt: "asc" },
          take: 4,
          include: { group: { select: { id: true, code: true, name: true } }, _count: { select: { results: true } } },
        }),
        unreadThreadCount(uid),
        prisma.$queryRaw<{ attended: number; total: number }[]>`
          SELECT count(*) FILTER (WHERE a.status IN ('PRESENT','LATE'))::int AS attended, count(*)::int AS total
          FROM "Attendance" a JOIN "Lesson" l ON l.id = a."lessonId"
          WHERE l."groupId" = ANY(${ids}) AND l."startsAt" >= ${monthStart} AND l."startsAt" <= ${now} AND l.status <> 'CANCELLED'`,
        prisma.auditLog.findMany({
          where: { actorId: uid },
          orderBy: { at: "desc" },
          take: 6,
          select: { id: true, at: true, action: true, entityType: true, entityId: true, summary: true },
        }),
        prisma.submission.findMany({
          where: { homework: { group: { teacherId: uid } }, submittedAt: { not: null }, status: { not: "DRAFT" } },
          orderBy: { submittedAt: "desc" },
          take: 6,
          select: { id: true, submittedAt: true, isLate: true, student: { select: { fullName: true } }, homework: { select: { title: true } } },
        }),
        prisma.attendance.findMany({
          where: { source: "TURNSTILE", arrivedAt: { gte: dayStart, lt: dayEnd }, lesson: { groupId: { in: ids } } },
          orderBy: { arrivedAt: "desc" },
          take: 6,
          select: { id: true, arrivedAt: true, status: true, student: { select: { fullName: true } }, lesson: { select: { id: true } } },
        }),
      ]);

    const gMap = new Map(groups.map((g) => [g.id, g]));
    const firstUpcoming = todayLessons.find((l) => l.status !== "DONE" && l.status !== "CANCELLED" && l.endsAt >= now);
    const todayItems = todayLessons.map((l) => {
      const g = gMap.get(l.groupId)!;
      const st = stats(g.id);
      const attended = l.attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
      return {
        id: l.id,
        number: l.number,
        title: l.title,
        startsAt: l.startsAt,
        endsAt: l.endsAt,
        start: hhmmTz(l.startsAt),
        end: hhmmTz(l.endsAt),
        status: l.status,
        group: { id: g.id, code: g.code, name: g.name, level: levelDto(g.level) },
        room: roomDto(l.room ?? g.room),
        topics: l.topics.map((t) => t.topic).sort((a, b) => a.unit - b.unit),
        attended,
        marked: l.attendance.length,
        total: st.studentsCount,
        isNext: firstUpcoming?.id === l.id,
        action: l.status === "IN_PROGRESS" ? "continue" : l.status === "PLANNED" ? "start" : "view",
      };
    });

    // Keyingi dars (bugundan boshlab, barcha guruhlar bo'yicha)
    const nexts = live
      .map((g) => ({ g, n: stats(g.id).nextLesson }))
      .filter((x) => x.n)
      .sort((a, b) => a.n!.startsAt.getTime() - b.n!.startsAt.getTime());
    const nextLesson = nexts[0]
      ? {
          id: nexts[0].n!.id,
          title: nexts[0].n!.title,
          startsAt: nexts[0].n!.startsAt,
          start: hhmmTz(nexts[0].n!.startsAt),
          status: nexts[0].n!.status,
          room: nexts[0].n!.room ?? roomDto(nexts[0].g.room),
          group: { id: nexts[0].g.id, code: nexts[0].g.code, name: nexts[0].g.name },
        }
      : null;

    type Act = { id: string; at: Date; kind: string; icon: string; text: string; link: string | null };
    const activity: Act[] = [
      ...audits.map((a) => ({
        id: `a${a.id}`,
        at: a.at,
        kind: a.action,
        icon: a.action.startsWith("grade") ? "grade" : a.action.startsWith("attendance") ? "how_to_reg" : a.action.startsWith("coins") ? "toll" : "edit_note",
        text: a.summary ?? a.action,
        link: auditLink(a.entityType, a.entityId),
      })),
      ...submittedRecent.map((s) => ({
        id: `s${s.id}`,
        at: s.submittedAt!,
        kind: "submission",
        icon: "assignment_turned_in",
        text: `${s.student.fullName} “${s.homework.title}” vazifasini topshirdi${s.isLate ? " (kechikib)" : ""}`,
        link: "/ustoz/vazifalar",
      })),
      ...turnstile.map((t) => ({
        id: `t${t.id}`,
        at: t.arrivedAt!,
        kind: "turnstile",
        icon: "door_open",
        text: `${t.student.fullName} turniketdan oʻtdi (${hhmmTz(t.arrivedAt!)})`,
        link: `/ustoz/darslar/${t.lesson.id}`,
      })),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 8);

    const ma = monthAtt[0];
    return {
      teacher: { fullName: me.fullName, title: me.title, avatarUrl: me.avatarUrl, specialization: me.teacherProfile?.specialization ?? null },
      today: { date: ymdTz(now), weekday: isoWeekdayTz(now), weekdayName: DAY_LONG[isoWeekdayTz(now)] },
      stats: {
        groups: live.length,
        activeGroups: live.filter((g) => g.status === "ACTIVE").length,
        enrollingGroups: live.filter((g) => g.status === "ENROLLING").length,
        // KANON §6: "Jami 16 + 14 + 8 + 18 + 12 = 68" — guruhlardagi faol o'rinlar yig'indisi
        students: live.reduce((s, g) => s + stats(g.id).studentsCount, 0),
        uniqueStudents: students.length,
        weeklyHours: round1(live.reduce((s, g) => s + groupWeeklyHours(g), 0)),
        pendingReviews,
        monthAttendancePct: ma ? pct(ma.attended, ma.total) : null,
        todayLessons: todayItems.filter((l) => l.status !== "CANCELLED").length,
        todayDone: todayItems.filter((l) => l.status === "DONE").length,
      },
      nextLesson,
      todayLessons: todayItems,
      latestSubmissions: latestSubs.map((s) => ({
        id: s.id,
        submittedAt: s.submittedAt,
        isLate: s.isLate,
        student: { id: s.student.id, fullName: s.student.fullName, initials: initials(s.student.fullName), code: s.student.studentProfile?.code ?? null },
        homework: { id: s.homework.id, title: s.homework.title, type: s.homework.type, dueAt: s.homework.dueAt },
        group: s.homework.group,
      })),
      upcomingExams: exams.map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        startsAt: e.startsAt,
        durationMin: e.durationMin,
        location: e.location,
        group: e.group,
        resultsCount: e._count.results,
      })),
      unreadMessages,
      groupProgress: live.map((g) => {
        const st = stats(g.id);
        return {
          id: g.id,
          code: g.code,
          name: g.name,
          status: g.status,
          level: levelDto(g.level),
          doneLessons: st.doneLessons,
          totalLessons: g.totalLessons,
          progressPct: g.totalLessons ? Math.round((st.doneLessons * 100) / g.totalLessons) : 0,
          monthAttendancePct: st.monthAttendancePct,
          averageGrade: st.averageGrade,
          averageGradeLabel: st.averageGradeLabel,
          studentsCount: st.studentsCount,
          pendingReviews: st.pendingReviews,
          currentUnit: st.currentUnit,
        };
      }),
      recentActivity: activity,
    };
  });
}
