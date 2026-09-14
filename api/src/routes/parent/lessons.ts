// Ota-ona: dars kunlari taqvimi va dars tafsiloti.
//   GET /api/parent/lessons?studentId=&month=YYYY-MM
//   GET /api/parent/lessons/:lessonId?studentId=
// Dars farzand a'zo bo'lgan guruhga (a'zolik oynasida) tegishli bo'lmasa — 404.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { parse } from "../../lib/http.js";
import { addDays, atTz, periodOf, startOfMonthTz } from "../../lib/dates.js";
import {
  assertChildLesson,
  attendanceStats,
  avg,
  childLessonWhere,
  childQuery,
  dayState,
  GRADE_KIND_LABEL,
  gradeSkill,
  levelName,
  loadChild,
  teacherDto,
  teacherSel,
  zId,
} from "./common.js";

const listQuery = childQuery.extend({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Oy YYYY-MM koʻrinishida boʻlsin")
    .optional(),
});

const fileSel = { id: true, originalName: true, mime: true, size: true } as const;

export default async function lessons(app: FastifyInstance) {
  app.get("/lessons", async (req) => {
    const q = parse(listQuery, req.query);
    const child = await loadChild(req.auth.userId, q.studentId);
    const now = new Date();
    const month = q.month ?? periodOf(now);
    const from = atTz(`${month}-01`, "00:00");
    const to = startOfMonthTz(addDays(from, 40));

    const [rows, first, last] = await Promise.all([
      prisma.lesson.findMany({
        where: childLessonWhere(child, { startsAt: { gte: from, lt: to } }),
        orderBy: { startsAt: "asc" },
        select: {
          id: true,
          number: true,
          title: true,
          startsAt: true,
          endsAt: true,
          status: true,
          summary: true,
          room: { select: { name: true, location: true } },
          group: { select: { id: true, code: true, name: true, room: { select: { name: true, location: true } } } },
          topics: { select: { topic: { select: { unit: true, title: true } } } },
          attendance: { where: { studentId: child.id }, select: { status: true, arrivedAt: true, source: true, note: true } },
          grades: { where: { studentId: child.id }, select: { value: true, kind: true, title: true } },
          homework: { select: { id: true, title: true, dueAt: true } },
          _count: { select: { materials: true } },
        },
      }),
      prisma.lesson.findFirst({ where: childLessonWhere(child), orderBy: { startsAt: "asc" }, select: { startsAt: true } }),
      prisma.lesson.findFirst({ where: childLessonWhere(child), orderBy: { startsAt: "desc" }, select: { startsAt: true } }),
    ]);

    return {
      now,
      month,
      child: child.info,
      stats: attendanceStats(rows, now),
      range: { first: first ? periodOf(first.startsAt) : null, last: last ? periodOf(last.startsAt) : null },
      lessons: rows.map((l) => {
        const a = l.attendance[0] ?? null;
        return {
          id: l.id,
          number: l.number,
          title: l.title,
          startsAt: l.startsAt,
          endsAt: l.endsAt,
          status: l.status,
          state: dayState(l, a, now),
          hasSummary: !!l.summary,
          topics: l.topics.map((t) => t.topic),
          group: { id: l.group.id, code: l.group.code, name: l.group.name },
          room: l.room ?? l.group.room,
          attendance: a,
          grades: l.grades.map((g) => ({ value: g.value, kind: g.kind, title: g.title })),
          gradeAvg: avg(l.grades.map((g) => g.value)),
          homework: l.homework,
          materialsCount: l._count.materials,
        };
      }),
    };
  });

  app.get("/lessons/:lessonId", async (req) => {
    const { lessonId } = parse(z.object({ lessonId: zId }), req.params);
    const { studentId } = parse(childQuery, req.query);
    const parentId = req.auth.userId;
    const child = await loadChild(parentId, studentId);
    await assertChildLesson(child, lessonId);
    const now = new Date();

    const l = await prisma.lesson.findUniqueOrThrow({
      where: { id: lessonId },
      include: {
        room: { include: { branch: true } },
        group: { include: { level: true, teacher: { select: teacherSel }, room: { include: { branch: true } } } },
        topics: { include: { topic: true } },
        attendance: { where: { studentId } },
        grades: { where: { studentId }, include: { givenBy: { select: { fullName: true } } }, orderBy: { gradedAt: "asc" } },
        materials: { include: { file: { select: fileSel } }, orderBy: { createdAt: "asc" } },
        homework: {
          orderBy: { dueAt: "asc" },
          include: {
            files: { select: fileSel },
            submissions: {
              where: { studentId },
              select: {
                id: true, status: true, submittedAt: true, isLate: true, score: true, feedback: true, reviewedAt: true, coinsAwarded: true,
                files: { select: fileSel },
              },
            },
          },
        },
      },
    });
    const att = l.attendance[0] ?? null;
    const topicIds = l.topics.map((t) => t.topicId);

    const [topicMaterials, coins, lessonMsgs] = await Promise.all([
      // Mavzuga biriktirilgan (darsga emas) materiallar: shu guruh yoki umumiy baza
      topicIds.length
        ? prisma.material.findMany({
            where: { topicId: { in: topicIds }, lessonId: null, OR: [{ groupId: l.groupId }, { groupId: null }] },
            include: { file: { select: fileSel } },
            orderBy: { createdAt: "asc" },
          })
        : Promise.resolve([]),
      prisma.coinTransaction.findMany({
        where: {
          studentId,
          OR: [
            { refType: "lesson", refId: lessonId },
            { refType: "attendance", refId: lessonId },
            ...(att ? [{ refType: "attendance", refId: att.id }] : []),
          ],
        },
        select: { id: true, amount: true, reason: true, note: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      // Ota-ona shu dars bo'yicha yozgan savollar (faqat o'zi qatnashgan suhbatlarda)
      prisma.message.findMany({
        where: { lessonId, thread: { participants: { some: { userId: parentId } } } },
        orderBy: { createdAt: "asc" },
        select: { threadId: true, createdAt: true },
      }),
    ]);

    // Savol-javoblar: shu darsga bog'langan xabarlar + ulardan keyingi ustoz javoblari
    // (ota-ona boshqa mavzuda yozguncha yoki ustoz boshqa darsni belgilaguncha).
    const threadIds = [...new Set(lessonMsgs.map((m) => m.threadId))];
    const questions: {
      id: string; threadId: string; body: string; createdAt: Date; isQuestion: boolean; mine: boolean;
      sender: { id: string; fullName: string; role: string; avatarUrl: string | null };
      files: { id: string; originalName: string; mime: string; size: number }[];
    }[] = [];
    for (const threadId of threadIds) {
      const firstAt = lessonMsgs.find((m) => m.threadId === threadId)!.createdAt;
      const msgs = await prisma.message.findMany({
        where: { threadId, createdAt: { gte: firstAt } },
        orderBy: { createdAt: "asc" },
        take: 200,
        select: {
          id: true, threadId: true, body: true, createdAt: true, isQuestion: true, lessonId: true, senderId: true,
          sender: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
          files: { select: fileSel },
        },
      });
      let inBlock = false;
      for (const m of msgs) {
        const mine = m.senderId === parentId;
        if (m.lessonId === lessonId) inBlock = true;
        else if (mine || m.lessonId) inBlock = false;
        if (!inBlock) continue;
        questions.push({ id: m.id, threadId: m.threadId, body: m.body, createdAt: m.createdAt, isQuestion: m.isQuestion, mine, sender: m.sender, files: m.files });
      }
    }
    questions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const room = l.room ?? l.group.room;
    const seen = new Set<string>();
    const materials = [...l.materials, ...topicMaterials]
      .filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)))
      .map((m) => ({ id: m.id, title: m.title, description: m.description, type: m.type, url: m.url, file: m.file, createdAt: m.createdAt }));

    return {
      now,
      child: { id: child.info.id, fullName: child.info.fullName, code: child.info.code },
      lesson: {
        id: l.id,
        number: l.number,
        title: l.title,
        startsAt: l.startsAt,
        endsAt: l.endsAt,
        durationMin: Math.round((l.endsAt.getTime() - l.startsAt.getTime()) / 60_000),
        status: l.status,
        state: dayState(l, att, now),
        summary: l.summary,
        homeworkNote: l.homeworkNote,
        topics: l.topics.map(({ topic: t }) => ({
          id: t.id, unit: t.unit, title: t.title, description: t.description, objectives: t.objectives, vocabulary: t.vocabulary, grammar: t.grammar,
        })),
        group: {
          id: l.group.id, code: l.group.code, name: l.group.name, totalLessons: l.group.totalLessons,
          level: l.group.level ? { code: l.group.level.code, name: l.group.level.name, label: levelName(l.group.level) } : null,
        },
        room: room ? { name: room.name, location: room.location } : null,
        branch: room?.branch ? { name: room.branch.name, address: room.branch.address, phone: room.branch.phone } : null,
        teacher: teacherDto(l.group.teacher),
      },
      attendance: att && { status: att.status, arrivedAt: att.arrivedAt, source: att.source, note: att.note },
      grades: l.grades.map((g) => ({
        id: g.id, value: g.value, kind: g.kind, kindLabel: GRADE_KIND_LABEL[g.kind] ?? g.kind, skill: gradeSkill(g),
        title: g.title, comment: g.comment, gradedAt: g.gradedAt, teacher: g.givenBy.fullName,
      })),
      coins: { total: coins.reduce((s, c) => s + c.amount, 0), items: coins },
      materials,
      homework: l.homework.map((h) => {
        const s = h.submissions[0] ?? null;
        return {
          id: h.id, title: h.title, description: h.description, type: h.type, dueAt: h.dueAt, coinReward: h.coinReward, files: h.files,
          submission: s,
          state: s?.status === "REVIEWED" ? "reviewed" : s?.status === "RETURNED" ? "returned" : s?.status === "SUBMITTED" ? "submitted" : h.dueAt > now ? "open" : "missed",
        };
      }),
      questions: { threadId: questions.at(-1)?.threadId ?? threadIds.at(-1) ?? null, items: questions },
    };
  });
}
