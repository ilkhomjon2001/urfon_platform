// /api/student/dashboard — o'quvchi bosh sahifasi: salom, bugungi dars, ochiq vazifa, o'z o'sishi, Level, baholar.
// Faqat o'z ma'lumoti (req.auth.userId). Boshqa bolalar bilan solishtirish yo'q (KANON §8).
import type { FastifyInstance } from "fastify";
import { prisma } from "../../db.js";
import { GAMIFICATION, coinTitle } from "../../config/gamification.js";
import { addDays, dbDateYmd, endOfDayTz, startOfDayTz, ymdTz } from "../../lib/dates.js";
import {
  ATTENDANCE_LABEL,
  GRADE_KIND_LABEL,
  HOMEWORK_TYPE_LABEL,
  HW_STATE_LABEL,
  accessIds,
  activeIds,
  avgLabel,
  fileSel,
  gradeLabel,
  hwState,
  levelLabel,
  myEnrollments,
  normalizeContent,
  primaryEnrollment,
  round1,
  topicLabel,
} from "./shared.js";

const avg = (xs: number[]) => (xs.length ? round1(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

export default async function dashboard(app: FastifyInstance) {
  app.get("/dashboard", async (req) => {
    const studentId = req.auth.userId;
    const now = new Date();
    const todayStart = startOfDayTz(now);
    const todayEnd = endOfDayTz(now);
    // O'sish oynalari — "oxirgi 7 kun" va undan oldingi 7 kun (KANON §8: "Oxirgi 7 kunda +85 (o'tgan hafta +65)").
    // Kalendar hafta dushanba kuni bolaga "0" ko'rsatib qo'yardi.
    const weekStart = addDays(now, -7);
    const lastWeekStart = addDays(now, -14);

    const [user, profile, es] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: studentId }, select: { fullName: true } }),
      prisma.studentProfile.findUnique({ where: { userId: studentId } }),
      myEnrollments(studentId),
    ]);
    const acc = accessIds(es);
    const act = activeIds(es, true);
    const primary = primaryEnrollment(es);

    const lessonInclude = {
      room: { select: { name: true, location: true } },
      group: { select: { id: true, name: true, code: true, room: { select: { name: true, location: true } }, teacher: { select: { id: true, fullName: true } } } },
      topics: { select: { topic: { select: { id: true, unit: true, title: true } } } },
    } as const;

    const [
      doneLessons, levels, finalExam, todayLessons, upcomingLessons, lastLesson, openHw, attendance,
      hwTotal, hwDone, coinsWeek, coinsLastWeek, grades, upcomingExam, materials, materialsCount,
    ] = await Promise.all([
      primary ? prisma.lesson.count({ where: { groupId: primary.groupId, status: "DONE" } }) : 0,
      prisma.level.findMany({ orderBy: { order: "asc" } }),
      primary ? prisma.exam.findFirst({ where: { groupId: primary.groupId, type: "FINAL" }, orderBy: { startsAt: "desc" } }) : null,
      prisma.lesson.findMany({
        where: { groupId: { in: act }, startsAt: { gte: todayStart, lte: todayEnd }, status: { not: "CANCELLED" } },
        orderBy: { startsAt: "asc" },
        include: lessonInclude,
      }),
      prisma.lesson.findMany({
        where: { groupId: { in: act }, startsAt: { gt: todayEnd }, status: { not: "CANCELLED" } },
        orderBy: { startsAt: "asc" },
        take: 3,
        include: lessonInclude,
      }),
      prisma.lesson.findFirst({
        where: { groupId: { in: acc }, status: "DONE", startsAt: { lt: now } },
        orderBy: { startsAt: "desc" },
        include: {
          ...lessonInclude,
          attendance: { where: { studentId }, select: { id: true, status: true, arrivedAt: true } },
          grades: { where: { studentId }, select: { value: true, kind: true } },
        },
      }),
      prisma.homework.findMany({
        where: {
          groupId: { in: activeIds(es) },
          submissions: { none: { studentId, status: { in: ["SUBMITTED", "REVIEWED"] } } },
        },
        orderBy: { dueAt: "asc" },
        take: 5,
        include: {
          group: { select: { id: true, name: true } },
          topic: { select: { id: true, unit: true, title: true } },
          submissions: { where: { studentId }, include: { files: { select: fileSel } } },
        },
      }),
      prisma.attendance.groupBy({ by: ["status"], where: { studentId, lesson: { groupId: { in: acc } } }, _count: { _all: true } }),
      prisma.homework.count({ where: { groupId: { in: acc } } }),
      prisma.submission.count({ where: { studentId, status: { in: ["SUBMITTED", "REVIEWED"] }, homework: { groupId: { in: acc } } } }),
      prisma.coinTransaction.aggregate({ where: { studentId, amount: { gt: 0 }, createdAt: { gte: weekStart } }, _sum: { amount: true } }),
      prisma.coinTransaction.aggregate({ where: { studentId, amount: { gt: 0 }, createdAt: { gte: lastWeekStart, lt: weekStart } }, _sum: { amount: true } }),
      prisma.grade.findMany({ where: { studentId }, orderBy: { gradedAt: "desc" }, take: 60, select: { id: true, kind: true, skill: true, value: true, title: true, gradedAt: true, lessonId: true } }),
      prisma.exam.findFirst({
        where: { startsAt: { gte: now }, OR: [{ groupId: { in: acc } }, { groupId: null, results: { some: { studentId } } }, { groupId: null, type: "MOCK" }] },
        orderBy: { startsAt: "asc" },
        select: { id: true, title: true, type: true, startsAt: true, durationMin: true, location: true, group: { select: { name: true } } },
      }),
      prisma.material.findMany({
        where: { groupId: { in: acc } },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { id: true, title: true, type: true, url: true, description: true, createdAt: true, file: { select: fileSel }, topic: { select: { unit: true, title: true } } },
      }),
      prisma.material.count({ where: { groupId: { in: acc } } }),
    ]);

    // ── Level ──
    let level = null;
    if (primary) {
      const lv = primary.group.level;
      const idx = lv ? levels.findIndex((l) => l.id === lv.id) : -1;
      const sameTrack = (l: (typeof levels)[number] | undefined) => (l && l.code.startsWith("L") === !!lv?.code.startsWith("L") ? l : undefined);
      const prev = idx > 0 ? sameTrack(levels[idx - 1]) : undefined;
      const next = idx >= 0 ? sameTrack(levels[idx + 1]) : undefined;
      const total = Math.max(1, primary.group.totalLessons);
      level = {
        group: { id: primary.group.id, name: primary.group.name, code: primary.group.code },
        code: lv?.code ?? null,
        name: levelLabel(lv) ?? primary.group.name,
        shortName: lv?.code.startsWith("L") ? `Level ${lv.code.slice(1)}` : (lv?.name ?? null),
        levelName: lv?.name ?? null,
        progress: Math.min(100, Math.round((doneLessons / total) * 100)),
        doneLessons,
        totalLessons: primary.group.totalLessons,
        prev: prev ? { name: levelLabel(prev), shortName: `Level ${prev.code.slice(1)}` } : null,
        next: next ? { name: levelLabel(next), shortName: next.code.startsWith("L") ? `Level ${next.code.slice(1)}` : next.name, levelName: next.name } : null,
        finalExam: finalExam ? { id: finalExam.id, title: finalExam.title, startsAt: finalExam.startsAt } : null,
      };
    }

    // ── Darslar ──
    type L = (typeof todayLessons)[number];
    const lessonCard = (l: L) => {
      const room = l.room ?? l.group.room;
      return {
        id: l.id,
        title: l.title ?? topicLabel(l.topics[0]?.topic) ?? l.group.name,
        startsAt: l.startsAt,
        endsAt: l.endsAt,
        status: l.status,
        room: room ? { name: room.name, location: room.location } : null,
        group: { id: l.group.id, name: l.group.name, code: l.group.code },
        teacher: l.group.teacher ? { id: l.group.teacher.id, fullName: l.group.teacher.fullName } : null,
        topics: l.topics.map((t) => topicLabel(t.topic)),
      };
    };
    let last = null;
    if (lastLesson) {
      const att = lastLesson.attendance[0] ?? null;
      const coins = await prisma.coinTransaction.aggregate({
        where: { studentId, amount: { gt: 0 }, OR: [{ refId: lastLesson.id }, ...(att ? [{ refId: att.id }] : [])] },
        _sum: { amount: true },
      });
      const gs = lastLesson.grades.map((g) => g.value);
      last = {
        ...lessonCard(lastLesson),
        attendance: att ? { status: att.status, label: ATTENDANCE_LABEL[att.status], arrivedAt: att.arrivedAt } : null,
        grade: gs.length ? { value: avg(gs), label: gradeLabel(avg(gs)) } : null,
        coins: coins._sum.amount ?? 0,
      };
    }

    // ── Ochiq vazifalar ──
    const openHomework = openHw
      .filter((h) => h.dueAt >= todayStart || h.submissions[0]?.status === "RETURNED" || h.submissions[0]?.status === "DRAFT")
      .slice(0, 3)
      .map((h) => {
        const sub = h.submissions[0] ?? null;
        const state = hwState(sub);
        const files = sub?.files ?? [];
        const answers = (sub?.answers ?? {}) as Record<string, unknown>;
        const questionCount = h.type === "QUIZ" ? normalizeContent(h.content, h.type).questions.length : 0;
        return {
          id: h.id,
          title: h.title,
          description: h.description,
          type: h.type,
          typeLabel: HOMEWORK_TYPE_LABEL[h.type],
          dueAt: h.dueAt,
          overdue: h.dueAt < now,
          group: h.group,
          topic: h.topic ? { unit: h.topic.unit, label: topicLabel(h.topic) } : null,
          coinReward: GAMIFICATION.coins.HOMEWORK_ON_TIME,
          state,
          stateLabel: HW_STATE_LABEL[state],
          progress: {
            fileCount: files.length,
            audioCount: files.filter((f) => f.mime.startsWith("audio/")).length,
            imageCount: files.filter((f) => f.mime.startsWith("image/")).length,
            hasText: !!sub?.text?.trim(),
            answered: Object.values(answers).filter((v) => v !== null && v !== undefined && String(v).trim() !== "").length,
            questionCount,
            draftUpdatedAt: sub?.updatedAt ?? null,
          },
        };
      });

    // ── Statistika ──
    const cnt = (s: string) => attendance.find((a) => a.status === s)?._count._all ?? 0;
    const attTotal = attendance.reduce((a, b) => a + b._count._all, 0);
    const attended = cnt("PRESENT") + cnt("LATE");
    const pendingHw = openHw.filter((h) => h.dueAt >= now).length;

    // ── Baholar (faqat o'zi) ──
    const d30 = addDays(now, -30);
    const d60 = addDays(now, -60);
    const cur30 = grades.filter((g) => g.gradedAt >= d30).map((g) => g.value);
    const prev30 = grades.filter((g) => g.gradedAt < d30 && g.gradedAt >= d60).map((g) => g.value);
    const allAvgRow = await prisma.grade.aggregate({ where: { studentId }, _avg: { value: true }, _count: { _all: true } });
    const allAvg = allAvgRow._avg.value != null ? round1(allAvgRow._avg.value) : null;

    const thisWeek = coinsWeek._sum.amount ?? 0;
    const lastWeek = coinsLastWeek._sum.amount ?? 0;
    const balance = profile?.coinBalance ?? 0;
    const firstName = user.fullName.split(/\s+/)[0] ?? user.fullName;
    const t = primary?.group.teacher ?? null;

    return {
      now,
      student: {
        fullName: user.fullName,
        firstName,
        code: profile?.code ?? null,
        coinBalance: balance,
        title: coinTitle(balance),
        streakDays: profile?.streakDays ?? 0,
        streakActiveToday: !!profile?.lastStreakDate && dbDateYmd(profile.lastStreakDate) === ymdTz(now),
      },
      level,
      teacher: t
        ? { id: t.id, fullName: t.fullName, title: t.title, avatarUrl: t.avatarUrl, specialization: t.teacherProfile?.specialization ?? null, responseTime: t.teacherProfile?.responseTime ?? null }
        : null,
      todayLessons: todayLessons.map(lessonCard),
      upcomingLessons: upcomingLessons.map(lessonCard),
      lastLesson: last,
      openHomework,
      stats: {
        attendance: { attended, total: attTotal, percent: attTotal ? Math.round((attended / attTotal) * 100) : null, missed: cnt("EXCUSED") + cnt("ABSENT"), excused: cnt("EXCUSED"), late: cnt("LATE") },
        homework: { done: hwDone, total: hwTotal, pending: pendingHw },
      },
      growth: {
        thisWeek,
        lastWeek,
        diff: thisWeek - lastWeek,
        weekStart,
        lastWeekStart,
        streakDays: profile?.streakDays ?? 0,
        streakBonus: GAMIFICATION.coins.STREAK,
        homeworkReward: GAMIFICATION.coins.HOMEWORK_ON_TIME,
        grades: { current: avg(cur30), previous: avg(prev30) },
      },
      grades: {
        average: allAvg,
        averageLabel: avgLabel(allAvg),
        count: allAvgRow._count._all,
        recent: grades.slice(0, 5).map((g) => ({
          id: g.id, value: g.value, label: gradeLabel(g.value), kind: g.kind, kindLabel: GRADE_KIND_LABEL[g.kind], skill: g.skill, title: g.title, gradedAt: g.gradedAt, lessonId: g.lessonId,
        })),
        // o'z baholari trendi (eski → yangi), oxirgi 10 ta
        series: grades.slice(0, 10).reverse().map((g) => ({ value: g.value, gradedAt: g.gradedAt })),
      },
      upcomingExam,
      materials: {
        total: materialsCount,
        latest: materials.map((m) => ({ ...m, topic: topicLabel(m.topic) })),
      },
    };
  });
}
