// /api/student/lessons — o'quvchining darslari: kelgusi jadval va o'tgan darslar (mavzu, xulosa, o'z davomati/bahosi, materiallar).
import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../db.js";
import { addDays, startOfDayTz } from "../../lib/dates.js";
import { notFound } from "../../lib/errors.js";
import { idParam, paged, paginate, parse } from "../../lib/http.js";
import {
  ATTENDANCE_LABEL,
  GRADE_KIND_LABEL,
  HW_STATE_LABEL,
  accessIds,
  activeIds,
  assertStudentLesson,
  fileSel,
  gradeLabel,
  hwState,
  myEnrollments,
  topicLabel,
} from "./shared.js";

const listQuery = z.object({
  range: z.enum(["upcoming", "past"]).default("upcoming"),
  groupId: z.string().min(1).max(40).optional(),
  days: z.coerce.number().int().min(1).max(31).default(14),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

const lessonInclude = {
  room: { select: { name: true, location: true } },
  group: {
    select: {
      id: true, name: true, code: true, days: true, startTime: true, endTime: true,
      room: { select: { name: true, location: true } },
      teacher: { select: { id: true, fullName: true, title: true } },
    },
  },
  topics: { select: { topic: { select: { id: true, unit: true, title: true } } } },
} satisfies Prisma.LessonInclude;

type LessonRow = Prisma.LessonGetPayload<{ include: typeof lessonInclude }>;

function baseCard(l: LessonRow, now: Date) {
  const room = l.room ?? l.group.room;
  return {
    id: l.id,
    number: l.number,
    title: l.title ?? topicLabel(l.topics[0]?.topic) ?? l.group.name,
    startsAt: l.startsAt,
    endsAt: l.endsAt,
    status: l.status,
    isToday: startOfDayTz(l.startsAt).getTime() === startOfDayTz(now).getTime(),
    isNow: l.startsAt <= now && l.endsAt >= now && l.status !== "CANCELLED",
    room: room ? { name: room.name, location: room.location } : null,
    group: { id: l.group.id, name: l.group.name, code: l.group.code },
    teacher: l.group.teacher,
    topics: l.topics.map((t) => ({ id: t.topic.id, unit: t.topic.unit, label: topicLabel(t.topic) })),
  };
}

/** Darslar ro'yxatiga o'quvchining o'z davomati, baholari, tangalari, materiallar va vazifalarni qo'shadi. */
async function enrich(studentId: string, groupIds: string[], lessons: LessonRow[], now: Date) {
  const ids = lessons.map((l) => l.id);
  if (!ids.length) return [];
  const [att, grades, materials, homework] = await Promise.all([
    prisma.attendance.findMany({ where: { studentId, lessonId: { in: ids } }, select: { id: true, lessonId: true, status: true, arrivedAt: true, note: true } }),
    prisma.grade.findMany({ where: { studentId, lessonId: { in: ids } }, orderBy: { gradedAt: "asc" }, select: { id: true, lessonId: true, kind: true, skill: true, value: true, title: true, comment: true } }),
    prisma.material.findMany({
      where: { lessonId: { in: ids }, OR: [{ groupId: { in: groupIds } }, { groupId: null }] },
      orderBy: { createdAt: "asc" },
      select: { id: true, lessonId: true, title: true, type: true, url: true, description: true, file: { select: fileSel } },
    }),
    prisma.homework.findMany({
      where: { lessonId: { in: ids } },
      select: { id: true, lessonId: true, title: true, type: true, dueAt: true, submissions: { where: { studentId }, select: { status: true, score: true } } },
    }),
  ]);
  const attIds = att.map((a) => a.id);
  const coins = await prisma.coinTransaction.findMany({
    where: { studentId, amount: { gt: 0 }, refId: { in: [...ids, ...attIds] } },
    select: { refId: true, amount: true, reason: true },
  });
  const attByLesson = new Map(att.map((a) => [a.lessonId, a]));
  const lessonOfRef = new Map<string, string>([...ids.map((i) => [i, i] as const), ...att.map((a) => [a.id, a.lessonId] as const)]);
  const coinsByLesson = new Map<string, number>();
  for (const c of coins) {
    const lid = c.refId ? lessonOfRef.get(c.refId) : undefined;
    if (lid) coinsByLesson.set(lid, (coinsByLesson.get(lid) ?? 0) + c.amount);
  }
  return lessons.map((l) => {
    const a = attByLesson.get(l.id);
    return {
      ...baseCard(l, now),
      summary: l.summary,
      homeworkNote: l.homeworkNote,
      attendance: a ? { status: a.status, label: ATTENDANCE_LABEL[a.status], arrivedAt: a.arrivedAt, note: a.note } : null,
      grades: grades
        .filter((g) => g.lessonId === l.id)
        .map((g) => ({ id: g.id, kind: g.kind, kindLabel: GRADE_KIND_LABEL[g.kind], skill: g.skill, value: g.value, label: gradeLabel(g.value), title: g.title, comment: g.comment })),
      coins: coinsByLesson.get(l.id) ?? 0,
      materials: materials.filter((m) => m.lessonId === l.id).map(({ lessonId: _l, ...m }) => m),
      homework: homework
        .filter((h) => h.lessonId === l.id)
        .map((h) => {
          const s = hwState(h.submissions[0]);
          return { id: h.id, title: h.title, type: h.type, dueAt: h.dueAt, state: s, stateLabel: HW_STATE_LABEL[s], score: h.submissions[0]?.score ?? null };
        }),
    };
  });
}

export default async function lessons(app: FastifyInstance) {
  app.get("/lessons", async (req) => {
    const q = parse(listQuery, req.query);
    const studentId = req.auth.userId;
    const now = new Date();
    const es = await myEnrollments(studentId);
    const acc = accessIds(es);
    if (q.groupId && !acc.includes(q.groupId)) throw notFound("Guruh topilmadi");

    if (q.range === "upcoming") {
      const act = activeIds(es, true);
      const groupIds = q.groupId ? act.filter((g) => g === q.groupId) : act;
      const from = startOfDayTz(now);
      const to = addDays(from, q.days);
      const [rows, exams] = await Promise.all([
        prisma.lesson.findMany({
          where: { groupId: { in: groupIds }, startsAt: { gte: from, lt: to } },
          orderBy: { startsAt: "asc" },
          take: 100,
          include: lessonInclude,
        }),
        prisma.exam.findMany({
          where: { startsAt: { gte: now, lt: addDays(from, 31) }, OR: [{ groupId: { in: groupIds } }, { groupId: null, type: "MOCK" }] },
          orderBy: { startsAt: "asc" },
          select: { id: true, title: true, type: true, startsAt: true, durationMin: true, location: true, group: { select: { name: true } } },
        }),
      ]);
      // Oraliqda dars bo'lmasa — keyingi eng yaqin dars (masalan, guruh hali boshlanmagan)
      const next = rows.length
        ? null
        : await prisma.lesson.findFirst({ where: { groupId: { in: groupIds }, startsAt: { gte: to }, status: { not: "CANCELLED" } }, orderBy: { startsAt: "asc" }, include: lessonInclude });
      const enrolled = es.filter((e) => groupIds.includes(e.groupId));
      return {
        range: "upcoming" as const,
        from,
        to,
        now,
        items: rows.map((l) => ({
          ...baseCard(l, now),
          homeworkNote: l.homeworkNote,
        })),
        next: next ? baseCard(next, now) : null,
        exams,
        schedule: enrolled.map((e) => ({
          group: { id: e.group.id, name: e.group.name, code: e.group.code, status: e.group.status },
          enrollment: e.status,
          days: e.group.days,
          startTime: e.group.startTime,
          endTime: e.group.endTime,
          room: e.group.room ? { name: e.group.room.name, location: e.group.room.location } : null,
          teacher: e.group.teacher ? { id: e.group.teacher.id, fullName: e.group.teacher.fullName } : null,
          startDate: e.group.startDate,
        })),
      };
    }

    const groupIds = q.groupId ? [q.groupId] : acc;
    const where: Prisma.LessonWhereInput = { groupId: { in: groupIds }, startsAt: { lt: now } };
    const [total, rows, attStats] = await Promise.all([
      prisma.lesson.count({ where }),
      prisma.lesson.findMany({ where, orderBy: { startsAt: "desc" }, ...paginate(q), include: lessonInclude }),
      prisma.attendance.groupBy({ by: ["status"], where: { studentId, lesson: { groupId: { in: groupIds } } }, _count: { _all: true } }),
    ]);
    const items = await enrich(studentId, acc, rows, now);
    const cnt = (s: string) => attStats.find((a) => a.status === s)?._count._all ?? 0;
    const marked = attStats.reduce((a, b) => a + b._count._all, 0);
    const attended = cnt("PRESENT") + cnt("LATE");
    return {
      range: "past" as const,
      now,
      ...paged(items, total, q),
      stats: { attended, marked, percent: marked ? Math.round((attended / marked) * 100) : null, excused: cnt("EXCUSED"), absent: cnt("ABSENT"), late: cnt("LATE") },
    };
  });

  app.get("/lessons/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const studentId = req.auth.userId;
    await assertStudentLesson(studentId, id);
    const es = await myEnrollments(studentId);
    const row = await prisma.lesson.findUniqueOrThrow({ where: { id }, include: lessonInclude });
    const [item] = await enrich(studentId, accessIds(es), [row], new Date());
    return item;
  });
}
