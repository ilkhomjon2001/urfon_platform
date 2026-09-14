// GET /api/parent/dashboard?studentId= — ota-ona bosh sahifasi (tanlangan farzand bo'yicha).
// Hech qanday solishtirish yo'q (guruh o'rtachasi, reyting): faqat farzandning o'z ko'rsatkichlari (KANON §8).
import type { FastifyInstance } from "fastify";
import { prisma } from "../../db.js";
import { config } from "../../config.js";
import { coinTitle } from "../../config/gamification.js";
import { parse } from "../../lib/http.js";
import { addDays, endOfDayTz, startOfDayTz, startOfMonthTz } from "../../lib/dates.js";
import {
  attendanceStats,
  avg,
  avgLabel,
  childExamWhere,
  childHomeworkWhere,
  childLessonWhere,
  childQuery,
  distribution,
  GRADE_KIND_LABEL,
  gradeSkill,
  loadChild,
  teacherDto,
  teacherSel,
} from "./common.js";

type TodayState =
  | "NO_LESSON" // bugun dars yo'q
  | "CANCELLED" // dars bekor qilingan
  | "NOT_YET" // dars hali boshlanmagan, farzand kelmagan
  | "ARRIVED" // turniketdan o'tdi, dars hali boshlanmagan
  | "IN_LESSON" // darsda
  | "ATTENDED" // dars tugadi, qatnashdi
  | "NOT_ARRIVED" // dars boshlangan, farzand hali kelmagan
  | "EXCUSED" // sababli kelmadi
  | "ABSENT" // kelmadi
  | "UNMARKED"; // dars tugagan, davomat belgilanmagan

export default async function dashboard(app: FastifyInstance) {
  app.get("/dashboard", async (req) => {
    const { studentId } = parse(childQuery, req.query);
    const child = await loadChild(req.auth.userId, studentId);
    const now = new Date();
    const dayStart = startOfDayTz(now);
    const dayEnd = endOfDayTz(now);
    const monthStart = startOfMonthTz(now);
    const nextMonthStart = startOfMonthTz(addDays(monthStart, 40));
    const primary = child.primaryGroup;

    const lessonSel = {
      id: true,
      number: true,
      title: true,
      startsAt: true,
      endsAt: true,
      status: true,
      summary: true,
      homeworkNote: true,
      groupId: true,
      room: { select: { name: true, location: true } },
      group: { select: { id: true, name: true, room: { select: { name: true, location: true } }, teacher: { select: teacherSel }, level: true } },
      topics: { select: { topic: { select: { unit: true, title: true } } } },
      attendance: { where: { studentId }, select: { status: true, arrivedAt: true, source: true } },
    } as const;

    const [
      lessons,
      nextLesson,
      grades,
      homework,
      coinLast7,
      coinPrev7,
      summaryLesson,
      exam,
      payments,
      doneInGroup,
      submissions,
      materials,
      telegram,
    ] = await Promise.all([
      // davomat hisobi uchun: oy oxirigacha bo'lgan barcha darslar
      prisma.lesson.findMany({ where: childLessonWhere(child, { startsAt: { lt: nextMonthStart } }), orderBy: { startsAt: "asc" }, select: lessonSel }),
      prisma.lesson.findFirst({
        where: childLessonWhere(child, { startsAt: { gt: now }, status: { not: "CANCELLED" }, groupId: { in: child.activeGroupIds } }),
        orderBy: { startsAt: "asc" },
        select: lessonSel,
      }),
      prisma.grade.findMany({
        where: { studentId },
        orderBy: { gradedAt: "desc" },
        select: {
          id: true, value: true, kind: true, skill: true, title: true, comment: true, gradedAt: true, updatedAt: true,
          lesson: { select: { id: true, title: true, startsAt: true } },
          givenBy: { select: { fullName: true } },
          submissionId: true,
        },
      }),
      prisma.homework.findMany({
        where: childHomeworkWhere(child, { createdAt: { lte: now } }),
        orderBy: { dueAt: "asc" },
        select: {
          id: true, title: true, type: true, dueAt: true, lessonId: true, coinReward: true,
          group: { select: { name: true } },
          submissions: { where: { studentId }, select: { status: true, isLate: true, submittedAt: true, score: true } },
        },
      }),
      prisma.coinTransaction.aggregate({ where: { studentId, amount: { gt: 0 }, createdAt: { gte: addDays(now, -7) } }, _sum: { amount: true } }),
      prisma.coinTransaction.aggregate({
        where: { studentId, amount: { gt: 0 }, createdAt: { gte: addDays(now, -14), lt: addDays(now, -7) } },
        _sum: { amount: true },
      }),
      prisma.lesson.findFirst({
        where: childLessonWhere(child, { startsAt: { lte: now }, summary: { not: null } }),
        orderBy: { startsAt: "desc" },
        select: lessonSel,
      }),
      prisma.exam.findFirst({
        where: { startsAt: { gt: now }, ...childExamWhere(child) },
        orderBy: { startsAt: "asc" },
        select: { id: true, title: true, type: true, startsAt: true, durationMin: true, location: true, description: true, group: { select: { name: true } } },
      }),
      prisma.payment.findMany({
        where: { studentId, status: { in: ["PENDING", "OVERDUE"] } },
        orderBy: { dueDate: "asc" },
        select: { id: true, period: true, amount: true, paidAmount: true, status: true, dueDate: true, group: { select: { name: true } } },
      }),
      primary ? prisma.lesson.count({ where: { groupId: primary.id, status: "DONE" } }) : Promise.resolve(0),
      prisma.submission.findMany({
        where: { studentId, submittedAt: { not: null }, status: { not: "DRAFT" } },
        orderBy: { submittedAt: "desc" },
        take: 15,
        select: { id: true, status: true, submittedAt: true, isLate: true, homework: { select: { id: true, title: true, type: true } } },
      }),
      prisma.material.findMany({
        where: {
          createdAt: { lte: now },
          OR: [{ groupId: { in: child.groupIds } }, { lesson: childLessonWhere(child) }],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true, title: true, type: true, createdAt: true, lessonId: true, url: true,
          file: { select: { id: true, originalName: true, mime: true, size: true } },
        },
      }),
      prisma.telegramLink.findUnique({ where: { userId: req.auth.userId }, select: { isActive: true, username: true, linkedAt: true } }),
    ]);

    // ── Bugungi holat ──
    const today = lessons.filter((l) => l.startsAt >= dayStart && l.startsAt <= dayEnd);
    const current =
      today.find((l) => l.status !== "CANCELLED" && l.startsAt <= now && l.endsAt >= now) ??
      today.find((l) => l.status !== "CANCELLED" && l.startsAt > now) ??
      [...today].reverse().find((l) => l.status !== "CANCELLED") ??
      today[0] ??
      null;
    let state: TodayState = "NO_LESSON";
    const att = current?.attendance[0] ?? null;
    if (current) {
      if (current.status === "CANCELLED") state = "CANCELLED";
      else if (att?.status === "PRESENT" || att?.status === "LATE") {
        state = now < current.startsAt ? "ARRIVED" : now <= current.endsAt ? "IN_LESSON" : "ATTENDED";
      } else if (att?.status === "EXCUSED") state = "EXCUSED";
      else if (att?.status === "ABSENT") state = "ABSENT";
      else state = now < current.startsAt ? "NOT_YET" : now <= current.endsAt ? "NOT_ARRIVED" : "UNMARKED";
    }

    const lessonBrief = (l: (typeof lessons)[number] | null) =>
      l && {
        id: l.id,
        number: l.number,
        title: l.title,
        startsAt: l.startsAt,
        endsAt: l.endsAt,
        status: l.status,
        homeworkNote: l.homeworkNote,
        topics: l.topics.map((t) => t.topic),
        group: { id: l.group.id, name: l.group.name, level: l.group.level ? { code: l.group.level.code, name: l.group.level.name } : null },
        room: l.room ?? l.group.room,
        teacher: teacherDto(l.group.teacher),
        attendance: l.attendance[0] ?? null,
      };

    // ── Ko'rsatkichlar ──
    const held = lessons.filter((l) => l.startsAt <= now);
    const total = attendanceStats(held, now);
    const month = attendanceStats(lessons.filter((l) => l.startsAt >= monthStart), now);

    const values = grades.map((g) => g.value);
    const average = avg(values);

    const hwDone = (s?: { status: string }) => s?.status === "SUBMITTED" || s?.status === "REVIEWED";
    const hwTotal = homework.length;
    const done = homework.filter((h) => hwDone(h.submissions[0]));
    const openHw = homework
      .filter((h) => {
        const s = h.submissions[0];
        return s?.status === "RETURNED" || (!hwDone(s) && h.dueAt > now);
      })
      .map((h) => ({
        id: h.id,
        title: h.title,
        type: h.type,
        dueAt: h.dueAt,
        lessonId: h.lessonId,
        coinReward: h.coinReward,
        groupName: h.group.name,
        submissionStatus: h.submissions[0]?.status ?? null,
      }));

    const skills = new Map<string, number[]>();
    for (const g of grades) {
      const sk = gradeSkill(g);
      if (sk) skills.set(sk, [...(skills.get(sk) ?? []), g.value]);
    }

    const balance = child.coins.balance;
    const title = coinTitle(balance);

    // ── Faoliyat lentasi ──
    type Activity = { id: string; type: "grade" | "attendance" | "homework" | "material"; at: Date; [k: string]: unknown };
    const activity: Activity[] = [
      ...grades.slice(0, 15).map((g) => ({
        id: `g-${g.id}`,
        type: "grade" as const,
        at: g.updatedAt > g.gradedAt ? g.updatedAt : g.gradedAt,
        value: g.value,
        kind: g.kind,
        kindLabel: GRADE_KIND_LABEL[g.kind] ?? g.kind,
        title: g.title,
        comment: g.comment,
        teacher: g.givenBy.fullName,
        lessonId: g.lesson?.id ?? null,
        lessonTitle: g.lesson?.title ?? null,
      })),
      ...held
        .filter((l) => l.attendance[0])
        .slice(-15)
        .map((l) => ({
          id: `a-${l.id}`,
          type: "attendance" as const,
          at: l.attendance[0].arrivedAt ?? l.startsAt,
          status: l.attendance[0].status,
          arrivedAt: l.attendance[0].arrivedAt,
          source: l.attendance[0].source,
          lessonId: l.id,
          lessonTitle: l.title,
          lessonStartsAt: l.startsAt,
          room: (l.room ?? l.group.room)?.name ?? null,
        })),
      ...submissions.map((s) => ({
        id: `s-${s.id}`,
        type: "homework" as const,
        at: s.submittedAt as Date,
        status: s.status,
        isLate: s.isLate,
        homeworkId: s.homework.id,
        title: s.homework.title,
      })),
      ...materials.map((m) => ({
        id: `m-${m.id}`,
        type: "material" as const,
        at: m.createdAt,
        title: m.title,
        materialType: m.type,
        lessonId: m.lessonId,
        url: m.url,
        file: m.file,
      })),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 30);

    const branch = child.info.group?.branch ?? (await prisma.branch.findFirst({ select: { id: true, name: true, address: true, phone: true } }));

    return {
      now,
      child: child.info,
      today: { state, lesson: lessonBrief(current), attendance: att },
      nextLesson: lessonBrief(nextLesson),
      metrics: {
        attendance: { total, month },
        grades: { average, label: avgLabel(average), count: values.length, distribution: distribution(values) },
        homework: {
          total: hwTotal,
          done: done.length,
          onTime: done.filter((h) => !h.submissions[0]?.isLate).length,
          open: openHw.length,
          missed: homework.filter((h) => !hwDone(h.submissions[0]) && h.submissions[0]?.status !== "RETURNED" && h.dueAt <= now).length,
          percent: hwTotal ? Math.round((done.length / hwTotal) * 100) : null,
        },
        level: primary
          ? {
              label: child.info.group?.level?.label ?? primary.name,
              lessonsDone: doneInGroup,
              totalLessons: primary.totalLessons,
              progress: Math.min(100, Math.round((doneInGroup / Math.max(1, primary.totalLessons)) * 100)),
            }
          : null,
        coins: {
          balance,
          streakDays: child.coins.streakDays,
          last7Days: coinLast7._sum.amount ?? 0,
          prev7Days: coinPrev7._sum.amount ?? 0,
          title: title.current,
          next: title.next,
        },
        skills: [...skills.entries()].map(([skill, vs]) => ({ skill, average: avg(vs), count: vs.length })),
      },
      recentGrades: grades.slice(0, 5).map((g) => ({
        id: g.id,
        value: g.value,
        kind: g.kind,
        kindLabel: GRADE_KIND_LABEL[g.kind] ?? g.kind,
        skill: gradeSkill(g),
        title: g.title,
        comment: g.comment,
        gradedAt: g.gradedAt,
        teacher: g.givenBy.fullName,
        lesson: g.lesson,
      })),
      latestSummary: summaryLesson && {
        lessonId: summaryLesson.id,
        title: summaryLesson.title,
        startsAt: summaryLesson.startsAt,
        summary: summaryLesson.summary,
        teacher: teacherDto(summaryLesson.group.teacher),
      },
      openHomework: openHw.slice(0, 5),
      upcomingExam: exam,
      payment: payments.length
        ? {
            current: payments[0],
            count: payments.length,
            totalDue: payments.reduce((s, p) => s + p.amount - p.paidAmount, 0),
            hasOverdue: payments.some((p) => p.status === "OVERDUE"),
          }
        : null,
      teacher: child.info.group?.teacher ?? null,
      branch,
      telegram: { linked: !!telegram?.isActive, username: telegram?.username ?? null, linkedAt: telegram?.linkedAt ?? null, botUsername: config.TELEGRAM_BOT_USERNAME },
      activity,
    };
  });
}
