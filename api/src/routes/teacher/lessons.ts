// Ustoz: dars o'tkazish rejimi (teacher-a) — mavzu tanlash (bazadan), boshlash/yakunlash,
// davomat, faollik tangasi, darsdagi baho va baho tahriri.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AttendanceStatus, Prisma } from "@prisma/client";
import { prisma, type Tx } from "../../db.js";
import { parse, auditCtx, idParam, zGrade } from "../../lib/http.js";
import { assertTeacherLesson } from "../../lib/access.js";
import { writeAudit } from "../../lib/audit.js";
import { awardCoins, coinRef, revokeCoins, touchStreak } from "../../lib/coins.js";
import { notifyParents } from "../../lib/notify.js";
import { badRequest, notFound } from "../../lib/errors.js";
import { startOfDayTz } from "../../lib/dates.js";
import { GAMIFICATION } from "../../config/gamification.js";
import { ATT_LABEL, GRADE_NAME, dayMonthTz, hhmmTz, initials, levelDto, roomDto, scheduleText, topicLabel } from "./groups.js";

type LessonWithGroup = Awaited<ReturnType<typeof assertTeacherLesson>>;

const PRESENT_SET = new Set<AttendanceStatus>(["PRESENT", "LATE"]);
const dayKey = (d: Date) => startOfDayTz(d).getTime();
const fmtV = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
const parentLessonLink = (lessonId: string) => `/ota-ona/darslar/${lessonId}`;

function timing(l: { startsAt: Date }, now = new Date()) {
  const ld = dayKey(l.startsAt);
  const td = dayKey(now);
  return { isToday: ld === td, isFuture: ld > td, isPast: ld < td };
}

/** Davomat/baho/faollik faqat bugungi yoki o'tgan, bekor qilinmagan darsda. */
function assertMarkable(l: LessonWithGroup) {
  if (l.status === "CANCELLED") throw badRequest("Dars bekor qilingan");
  if (timing(l).isFuture) throw badRequest("Kelgusi kundagi dars uchun bu amalni bajarib boʻlmaydi");
}

const lessonName = (l: LessonWithGroup) => `${l.group.name}, ${dayMonthTz(l.startsAt)} ${hhmmTz(l.startsAt)}`;

async function activeMembers(db: Tx | typeof prisma, groupId: string) {
  const rows = await db.groupStudent.findMany({
    where: { groupId, status: "ACTIVE" },
    select: { student: { select: { id: true, fullName: true } } },
  });
  return new Map(rows.map((r) => [r.student.id, r.student]));
}

/** Mavzu asosida dars nomi: "Unit 4 — My Family & Relationships" (+ "(2-qism)" agar mavzu oldin ham o'tilgan bo'lsa). */
async function autoTitle(db: Tx, l: LessonWithGroup, t: { id: string; unit: number; title: string }) {
  const before = await db.lessonTopic.count({
    where: { topicId: t.id, lesson: { groupId: l.groupId, status: { not: "CANCELLED" }, startsAt: { lt: l.startsAt }, id: { not: l.id } } },
  });
  return before > 0 ? `${topicLabel(t)} (${before + 1}-qism)` : topicLabel(t);
}

const attendanceItem = z.object({
  studentId: z.string().min(1).max(40),
  status: z.enum(["PRESENT", "LATE", "EXCUSED", "ABSENT"]),
  arrivedAt: z.string().datetime({ offset: true }).nullable().optional(),
  note: z.string().trim().max(300).nullable().optional(),
});
const attendanceBody = z.object({ items: z.array(attendanceItem).min(1).max(100) });
const finishBody = z.object({
  summary: z.string().trim().max(3000).nullable().optional(),
  homeworkNote: z.string().trim().max(1000).nullable().optional(),
});
const patchBody = finishBody.extend({ title: z.string().trim().min(1).max(200).optional() });
const topicsBody = z.object({ topicIds: z.array(z.string().min(1).max(40)).max(5) });
const activityBody = z.object({
  studentId: z.string().min(1).max(40),
  amount: z.number().int().min(GAMIFICATION.coins.ACTIVITY.min).max(GAMIFICATION.coins.ACTIVITY.max),
  note: z.string().trim().max(200).nullable().optional(),
});
const skillEnum = z.enum(["SPEAKING", "LISTENING", "READING", "WRITING", "GRAMMAR", "VOCABULARY"]);
const gradeBody = z.object({
  studentId: z.string().min(1).max(40),
  value: zGrade,
  skill: skillEnum.nullable().optional(),
  title: z.string().trim().max(150).nullable().optional(),
  comment: z.string().trim().max(1000).nullable().optional(),
});
const gradeEditBody = z
  .object({
    value: z.number().min(2, "Baho 2 dan 5 gacha").max(5, "Baho 2 dan 5 gacha").optional(),
    skill: skillEnum.nullable().optional(),
    title: z.string().trim().max(150).nullable().optional(),
    comment: z.string().trim().max(1000).nullable().optional(),
  })
  .refine((b) => Object.values(b).some((v) => v !== undefined), "Oʻzgartirish uchun maydon yuborilmadi");
const lessonStudentParam = z.object({ id: z.string().min(1).max(40), studentId: z.string().min(1).max(40) });

export default async function lessons(app: FastifyInstance) {
  // ───────────── Dars sahifasi (lesson mode) ─────────────
  app.get("/lessons/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    await assertTeacherLesson(req.auth.userId, id);
    const now = new Date();
    const l = await prisma.lesson.findUniqueOrThrow({
      where: { id },
      include: {
        room: true,
        group: { include: { level: true, room: true } },
        topics: {
          include: {
            topic: { select: { id: true, unit: true, title: true, description: true, grammar: true, vocabulary: true, objectives: true, lessonsCount: true, lessonPlan: true } },
          },
        },
        attendance: { include: { markedBy: { select: { id: true, fullName: true } } } },
        grades: { orderBy: { gradedAt: "asc" } },
        materials: {
          orderBy: { createdAt: "asc" },
          include: { file: { select: { id: true, originalName: true, mime: true, size: true } } },
        },
        homework: {
          orderBy: { createdAt: "asc" },
          include: { _count: { select: { submissions: { where: { status: { in: ["SUBMITTED", "REVIEWED", "RETURNED"] } } } } } },
        },
      },
    });
    const g = l.group;

    const [members, coins, levelTopics, coveredRows, lastDone, prev, next] = await Promise.all([
      prisma.groupStudent.findMany({
        where: { groupId: g.id, status: "ACTIVE" },
        select: { student: { select: { id: true, fullName: true, studentProfile: { select: { code: true } } } } },
      }),
      prisma.coinTransaction.findMany({ where: { refType: "lesson", refId: id, reason: { in: ["ATTENDANCE", "ACTIVITY"] } } }),
      g.levelId ? prisma.topic.findMany({ where: { levelId: g.levelId, status: "PUBLISHED" }, orderBy: { unit: "asc" } }) : Promise.resolve([]),
      prisma.lessonTopic.findMany({
        where: { lesson: { groupId: g.id, status: "DONE", id: { not: id } } },
        select: { topicId: true, lesson: { select: { startsAt: true } } },
      }),
      prisma.lesson.findFirst({
        where: { groupId: g.id, status: "DONE", id: { not: id }, startsAt: { lt: l.startsAt } },
        orderBy: { startsAt: "desc" },
        include: { topics: { include: { topic: { select: { id: true, unit: true, title: true } } } } },
      }),
      prisma.lesson.findFirst({ where: { groupId: g.id, startsAt: { lt: l.startsAt } }, orderBy: { startsAt: "desc" }, select: { id: true, startsAt: true, title: true } }),
      prisma.lesson.findFirst({ where: { groupId: g.id, startsAt: { gt: l.startsAt } }, orderBy: { startsAt: "asc" }, select: { id: true, startsAt: true, title: true } }),
    ]);

    // Guruhdan chiqqan, lekin shu darsda yozuvi bor o'quvchilar ham (faqat ko'rish uchun)
    const activeIds = new Set(members.map((m) => m.student.id));
    const extraIds = [...new Set([...l.attendance.map((a) => a.studentId), ...l.grades.map((gr) => gr.studentId)])].filter((sid) => !activeIds.has(sid));
    const extra = extraIds.length
      ? await prisma.user.findMany({ where: { id: { in: extraIds } }, select: { id: true, fullName: true, studentProfile: { select: { code: true } } } })
      : [];
    const roster = [...members.map((m) => ({ ...m.student, active: true })), ...extra.map((s) => ({ ...s, active: false }))].sort((a, b) =>
      a.active === b.active ? a.fullName.localeCompare(b.fullName) : a.active ? -1 : 1,
    );

    const attBy = new Map(l.attendance.map((a) => [a.studentId, a]));
    const students = roster.map((s) => {
      const a = attBy.get(s.id);
      const act = coins.find((c) => c.studentId === s.id && c.reason === "ACTIVITY");
      const attCoin = coins.find((c) => c.studentId === s.id && c.reason === "ATTENDANCE");
      return {
        id: s.id,
        fullName: s.fullName,
        initials: initials(s.fullName),
        code: s.studentProfile?.code ?? null,
        active: s.active,
        attendance: a
          ? { status: a.status, arrivedAt: a.arrivedAt, source: a.source, note: a.note, markedBy: a.markedBy, updatedAt: a.updatedAt }
          : null,
        activity: act ? { amount: act.amount, note: act.note } : null,
        coins: (act?.amount ?? 0) + (attCoin?.amount ?? 0),
        grades: l.grades
          .filter((gr) => gr.studentId === s.id)
          .map((gr) => ({ id: gr.id, value: gr.value, label: GRADE_NAME[Math.round(gr.value)] ?? null, kind: gr.kind, skill: gr.skill, title: gr.title, comment: gr.comment, gradedAt: gr.gradedAt })),
      };
    });
    const act = students.filter((s) => s.active);
    const cnt = (st: AttendanceStatus) => act.filter((s) => s.attendance?.status === st).length;
    const counts = {
      total: act.length,
      present: cnt("PRESENT"),
      late: cnt("LATE"),
      excused: cnt("EXCUSED"),
      absent: cnt("ABSENT"),
      unmarked: act.filter((s) => !s.attendance).length,
    };

    // Mavzular bazasi: guruh leveli, faqat PUBLISHED; "keyingi tavsiya" = birinchi o'tilmagan mavzu
    const coveredBy = new Map<string, { count: number; lastAt: Date }>();
    for (const r of coveredRows) {
      const cur = coveredBy.get(r.topicId);
      if (!cur) coveredBy.set(r.topicId, { count: 1, lastAt: r.lesson.startsAt });
      else {
        cur.count++;
        if (r.lesson.startsAt > cur.lastAt) cur.lastAt = r.lesson.startsAt;
      }
    }
    const availableTopics = levelTopics.map((t) => ({
      id: t.id,
      unit: t.unit,
      title: t.title,
      label: topicLabel(t),
      description: t.description,
      grammar: t.grammar,
      vocabulary: t.vocabulary,
      lessonsCount: t.lessonsCount,
      hours: t.hours,
      coveredLessons: coveredBy.get(t.id)?.count ?? 0,
      covered: coveredBy.has(t.id),
      lastCoveredAt: coveredBy.get(t.id)?.lastAt ?? null,
    }));
    // Unit bir necha darsdan iborat boʻlishi mumkin (lessonsCount): tavsiya — darslari hali tugamagan birinchi unit
    const suggested = availableTopics.find((t) => t.coveredLessons < Math.max(1, t.lessonsCount)) ?? null;
    const lastTopics = (lastDone?.topics ?? []).map((t) => t.topic).sort((a, b) => a.unit - b.unit);
    const t = timing(l, now);

    return {
      lesson: {
        id: l.id,
        number: l.number,
        title: l.title,
        startsAt: l.startsAt,
        endsAt: l.endsAt,
        status: l.status,
        summary: l.summary,
        homeworkNote: l.homeworkNote,
        room: roomDto(l.room ?? g.room),
        ...t,
        canStart: l.status === "PLANNED" && !t.isFuture,
        canFinish: (l.status === "PLANNED" || l.status === "IN_PROGRESS") && !t.isFuture,
        canMark: l.status !== "CANCELLED" && !t.isFuture,
      },
      group: {
        id: g.id,
        code: g.code,
        name: g.name,
        status: g.status,
        level: levelDto(g.level),
        room: roomDto(g.room),
        schedule: { days: g.days, startTime: g.startTime, endTime: g.endTime, text: scheduleText(g.days, g.startTime, g.endTime) },
        totalLessons: g.totalLessons,
      },
      students,
      counts,
      // part — bu dars unitning nechanchi darsi (dars rejasidagi qaysi band koʻrsatiladi)
      topics: l.topics
        .map((lt) => ({ ...lt.topic, part: coveredRows.filter((r) => r.topicId === lt.topic.id && r.lesson.startsAt < l.startsAt).length + 1 }))
        .sort((a, b) => a.unit - b.unit),
      availableTopics,
      suggestedTopicId: suggested?.id ?? null,
      lastTopic: lastTopics.length ? { ...lastTopics[lastTopics.length - 1], lessonId: lastDone!.id, startsAt: lastDone!.startsAt } : null,
      materials: l.materials.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        type: m.type,
        url: m.url,
        file: m.file,
        createdAt: m.createdAt,
      })),
      homework: l.homework.map((h) => ({
        id: h.id,
        title: h.title,
        description: h.description,
        type: h.type,
        dueAt: h.dueAt,
        coinReward: h.coinReward,
        submitted: h._count.submissions,
        createdAt: h.createdAt,
      })),
      nav: { prev, next },
      coinRules: { attendance: GAMIFICATION.coins.ATTENDANCE, activity: GAMIFICATION.coins.ACTIVITY },
    };
  });

  // ───────────── Mavzu tanlash (faqat bazadagi PUBLISHED, guruh leveli) ─────────────
  app.put("/lessons/:id/topics", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(topicsBody, req.body);
    const l = await assertTeacherLesson(req.auth.userId, id);
    if (l.status === "CANCELLED") throw badRequest("Bekor qilingan dars uchun mavzu tanlab boʻlmaydi");
    const ids = [...new Set(body.topicIds)];
    if (ids.length && !l.group.levelId) throw badRequest("Guruhga level biriktirilmagan — mavzular bazasidan tanlab boʻlmaydi");
    const topics = ids.length
      ? await prisma.topic.findMany({
          where: { id: { in: ids }, levelId: l.group.levelId!, status: "PUBLISHED" },
          select: { id: true, unit: true, title: true },
          orderBy: { unit: "asc" },
        })
      : [];
    if (topics.length !== ids.length) throw badRequest("Mavzu topilmadi yoki bu guruh leveliga tegishli emas");

    return prisma.$transaction(async (tx) => {
      const before = (
        await tx.lessonTopic.findMany({ where: { lessonId: id }, select: { topic: { select: { id: true, unit: true, title: true } } } })
      )
        .map((r) => r.topic)
        .sort((a, b) => a.unit - b.unit);
      const same = before.length === topics.length && before.every((b, i) => b.id === topics[i]!.id);
      if (same) return { id, title: l.title, topics, changed: false };

      await tx.lessonTopic.deleteMany({ where: { lessonId: id } });
      if (topics.length) await tx.lessonTopic.createMany({ data: topics.map((t) => ({ lessonId: id, topicId: t.id })) });

      // Nom bo'sh bo'lsa yoki avvalgi mavzudan avtomatik olingan bo'lsa — yangilanadi
      const oldAuto = before[0] ? topicLabel(before[0]) : null;
      const wasAuto = !l.title || (oldAuto != null && l.title.startsWith(oldAuto));
      let title = l.title;
      if (wasAuto) title = topics[0] ? await autoTitle(tx, l, topics[0]) : oldAuto ? null : l.title;
      if (title !== l.title) await tx.lesson.update({ where: { id }, data: { title } });

      await writeAudit(tx, {
        ...auditCtx(req),
        action: "lesson.topics",
        entityType: "Lesson",
        entityId: id,
        summary: `${lessonName(l)} darsi mavzusi: ${topics.length ? topics.map(topicLabel).join("; ") : "olib tashlandi"}`,
        before: { topics: before.map(topicLabel), title: l.title },
        after: { topics: topics.map(topicLabel), title },
      });
      return { id, title, topics, changed: true };
    });
  });

  // ───────────── Boshlash / yakunlash / xulosa ─────────────
  app.post("/lessons/:id/start", async (req) => {
    const { id } = parse(idParam, req.params);
    const l = await assertTeacherLesson(req.auth.userId, id);
    if (l.status === "CANCELLED") throw badRequest("Dars bekor qilingan");
    if (l.status === "DONE") throw badRequest("Dars allaqachon yakunlangan");
    if (timing(l).isFuture) throw badRequest("Kelgusi kundagi darsni boshlab boʻlmaydi");
    if (l.status === "IN_PROGRESS") return { id, status: l.status, changed: false };
    return prisma.$transaction(async (tx) => {
      const row = await tx.lesson.update({ where: { id }, data: { status: "IN_PROGRESS" } });
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "lesson.start",
        entityType: "Lesson",
        entityId: id,
        summary: `${lessonName(l)} darsi boshlandi`,
        before: { status: l.status },
        after: { status: row.status },
      });
      return { id, status: row.status, changed: true };
    });
  });

  app.post("/lessons/:id/finish", async (req, reply) => {
    const { id } = parse(idParam, req.params);
    const body = parse(finishBody, req.body ?? {});
    const l = await assertTeacherLesson(req.auth.userId, id);
    if (l.status === "CANCELLED") throw badRequest("Dars bekor qilingan");
    if (l.status === "DONE") throw badRequest("Dars allaqachon yakunlangan");
    if (timing(l).isFuture) throw badRequest("Kelgusi kundagi darsni yakunlab boʻlmaydi");

    const members = await activeMembers(prisma, l.groupId);
    const marked = new Set(
      (await prisma.attendance.findMany({ where: { lessonId: id }, select: { studentId: true } })).map((a) => a.studentId),
    );
    const missing = [...members.values()].filter((s) => !marked.has(s.id)).sort((a, b) => a.fullName.localeCompare(b.fullName));
    if (missing.length) {
      return reply.status(400).send({
        error: {
          code: "ATTENDANCE_INCOMPLETE",
          message: `Davomat belgilanmagan (${missing.length} ta): ${missing.map((s) => s.fullName).join(", ")}`,
          students: missing,
        },
      });
    }

    return prisma.$transaction(async (tx) => {
      const data: Prisma.LessonUpdateInput = { status: "DONE" };
      if (body.summary !== undefined) data.summary = body.summary || null;
      if (body.homeworkNote !== undefined) data.homeworkNote = body.homeworkNote || null;
      const row = await tx.lesson.update({ where: { id }, data });
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "lesson.finish",
        entityType: "Lesson",
        entityId: id,
        summary: `${lessonName(l)} darsi yakunlandi`,
        before: { status: l.status, summary: l.summary, homeworkNote: l.homeworkNote },
        after: { status: row.status, summary: row.summary, homeworkNote: row.homeworkNote },
      });
      return { id, status: row.status, summary: row.summary, homeworkNote: row.homeworkNote };
    });
  });

  // Xulosa / uyga vazifa izohi / nomni saqlash (ota-onaga ko'rinadi)
  app.patch("/lessons/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(patchBody, req.body ?? {});
    const l = await assertTeacherLesson(req.auth.userId, id);
    if (l.status === "CANCELLED") throw badRequest("Dars bekor qilingan");
    const data: Prisma.LessonUpdateInput = {};
    if (body.summary !== undefined && (body.summary || null) !== l.summary) data.summary = body.summary || null;
    if (body.homeworkNote !== undefined && (body.homeworkNote || null) !== l.homeworkNote) data.homeworkNote = body.homeworkNote || null;
    if (body.title !== undefined && body.title !== l.title) data.title = body.title;
    if (!Object.keys(data).length) return { id, title: l.title, summary: l.summary, homeworkNote: l.homeworkNote, changed: false };
    return prisma.$transaction(async (tx) => {
      const row = await tx.lesson.update({ where: { id }, data });
      const pick = (x: { title: string | null; summary: string | null; homeworkNote: string | null }) =>
        Object.fromEntries(Object.keys(data).map((k) => [k, x[k as keyof typeof x]]));
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "lesson.update",
        entityType: "Lesson",
        entityId: id,
        summary: `${lessonName(l)} darsi maʼlumoti yangilandi`,
        before: pick(l),
        after: pick(row),
      });
      return { id, title: row.title, summary: row.summary, homeworkNote: row.homeworkNote, changed: true };
    });
  });

  // ───────────── Davomat ─────────────
  app.put("/lessons/:id/attendance", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(attendanceBody, req.body);
    const l = await assertTeacherLesson(req.auth.userId, id);
    assertMarkable(l);
    const now = new Date();
    const { isToday } = timing(l, now);
    const seen = new Set<string>();
    for (const it of body.items) {
      if (seen.has(it.studentId)) throw badRequest("Bir oʻquvchi roʻyxatda ikki marta kelgan");
      seen.add(it.studentId);
    }
    const members = await activeMembers(prisma, l.groupId);
    for (const it of body.items) if (!members.has(it.studentId)) throw badRequest("Oʻquvchi bu guruhning faol roʻyxatida yoʻq");

    return prisma.$transaction(async (tx) => {
      const existing = new Map(
        (await tx.attendance.findMany({ where: { lessonId: id, studentId: { in: [...seen] } } })).map((a) => [a.studentId, a]),
      );
      type Snap = { status: AttendanceStatus; arrivedAt: string | null; note: string | null; source?: string };
      const changes: { studentId: string; fullName: string; before: Snap | null; after: Snap }[] = [];
      let notified = 0;

      for (const it of body.items) {
        const s = members.get(it.studentId)!;
        const ex = existing.get(it.studentId);
        let arrivedAt: Date | null =
          it.arrivedAt !== undefined ? (it.arrivedAt ? new Date(it.arrivedAt) : null) : (ex?.arrivedAt ?? null);
        // Kechikdi deb belgilanganda vaqt yo'q bo'lsa — bugungi dars uchun hozirgi vaqt
        if (it.status === "LATE" && !arrivedAt && isToday && now > l.startsAt) arrivedAt = now;
        const note = it.note !== undefined ? it.note || null : (ex?.note ?? null);
        if (ex && ex.status === it.status && (ex.arrivedAt?.getTime() ?? null) === (arrivedAt?.getTime() ?? null) && ex.note === note) continue;

        // TURNSTILE yozuvini ustoz o'zgartira oladi: manba va arrivedAt saqlanadi, kim belgilagani yoziladi
        await tx.attendance.upsert({
          where: { lessonId_studentId: { lessonId: id, studentId: it.studentId } },
          create: { lessonId: id, studentId: it.studentId, status: it.status, arrivedAt, note, source: "MANUAL", markedById: req.auth.userId },
          update: { status: it.status, arrivedAt, note, markedById: req.auth.userId },
        });

        const wasPresent = !!ex && PRESENT_SET.has(ex.status);
        const isPresent = PRESENT_SET.has(it.status);
        if (isPresent) {
          // idempotent (ON CONFLICT DO NOTHING): turniket yoki oldingi belgi bergan bo'lsa qayta berilmaydi
          await awardCoins(tx, {
            studentId: it.studentId,
            reason: "ATTENDANCE",
            groupId: l.groupId,
            ...coinRef.lesson(id),
            createdById: req.auth.userId,
          });
          if (isToday && !wasPresent) await touchStreak(tx, it.studentId, now);
        } else {
          await revokeCoins(tx, it.studentId, "ATTENDANCE", "lesson", id);
          await revokeCoins(tx, it.studentId, "ACTIVITY", "lesson", id); // qatnashmagan bo'lsa faollik tangasi ham bekor
        }

        if (ex?.status !== it.status && (it.status === "ABSENT" || it.status === "LATE")) {
          const when = isToday ? "bugun" : `${dayMonthTz(l.startsAt)} kuni`;
          const where = `${l.group.name}, ${hhmmTz(l.startsAt)}–${hhmmTz(l.endsAt)}`;
          let bodyText: string;
          if (it.status === "ABSENT") bodyText = `${s.fullName} ${when} darsga kelmadi (${where}).`;
          else {
            const mins = arrivedAt ? Math.round((arrivedAt.getTime() - l.startsAt.getTime()) / 60_000) : 0;
            bodyText = `${s.fullName} ${when} darsga ${mins > 0 ? `${mins} daqiqa ` : ""}kechikdi (${where}).`;
          }
          notified += await notifyParents(tx, it.studentId, {
            type: it.status === "ABSENT" ? "attendance.absent" : "attendance.late",
            title: it.status === "ABSENT" ? "Darsga kelmadi" : "Darsga kechikdi",
            body: bodyText,
            link: parentLessonLink(id),
            payload: { lessonId: id, studentId: it.studentId, status: it.status },
          });
        }

        const snap = (x: { status: AttendanceStatus; arrivedAt: Date | null; note: string | null }): Snap => ({
          status: x.status,
          arrivedAt: x.arrivedAt?.toISOString() ?? null,
          note: x.note,
        });
        changes.push({
          studentId: it.studentId,
          fullName: s.fullName,
          before: ex ? { ...snap(ex), source: ex.source } : null,
          after: snap({ status: it.status, arrivedAt, note }),
        });
      }

      if (changes.length) {
        const txt = changes
          .slice(0, 6)
          .map((c) => `${c.fullName}: ${c.before ? ATT_LABEL[c.before.status] + " → " : ""}${ATT_LABEL[c.after.status]}`)
          .join("; ");
        await writeAudit(tx, {
          ...auditCtx(req),
          action: "attendance.update",
          entityType: "Lesson",
          entityId: id,
          summary: `${lessonName(l)} davomati: ${txt}${changes.length > 6 ? ` va yana ${changes.length - 6} ta` : ""}`,
          before: changes.map((c) => ({ studentId: c.studentId, fullName: c.fullName, ...(c.before ?? { status: null }) })),
          after: changes.map((c) => ({ studentId: c.studentId, fullName: c.fullName, ...c.after })),
        });
      }
      const rows = await tx.attendance.findMany({
        where: { lessonId: id },
        select: { studentId: true, status: true, arrivedAt: true, source: true, note: true },
      });
      return { changed: changes.length, notified, attendance: rows };
    });
  });

  // ───────────── Darsdagi faollik tangasi (+1..+5, har o'quvchiga bitta) ─────────────
  app.post("/lessons/:id/activity", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(activityBody, req.body);
    const l = await assertTeacherLesson(req.auth.userId, id);
    assertMarkable(l);
    const members = await activeMembers(prisma, l.groupId);
    const s = members.get(body.studentId);
    if (!s) throw badRequest("Oʻquvchi bu guruhning faol roʻyxatida yoʻq");
    const att = await prisma.attendance.findUnique({ where: { lessonId_studentId: { lessonId: id, studentId: body.studentId } } });
    if (att && !PRESENT_SET.has(att.status)) throw badRequest("Darsda qatnashmagan oʻquvchiga faollik tangasi berilmaydi");
    const note = body.note || null;

    return prisma.$transaction(async (tx) => {
      const ex = await tx.coinTransaction.findFirst({ where: { studentId: body.studentId, reason: "ACTIVITY", refType: "lesson", refId: id } });
      if (ex && ex.amount === body.amount && (ex.note ?? null) === note) {
        return { studentId: body.studentId, amount: ex.amount, note: ex.note, changed: false };
      }
      if (ex) await revokeCoins(tx, body.studentId, "ACTIVITY", "lesson", id);
      await awardCoins(tx, {
        studentId: body.studentId,
        reason: "ACTIVITY",
        amount: body.amount,
        groupId: l.groupId,
        ...coinRef.lesson(id),
        note,
        createdById: req.auth.userId,
      });
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "coins.activity",
        entityType: "Lesson",
        entityId: id,
        summary: `${s.fullName}: darsdagi faollik ${ex ? `+${ex.amount} → ` : ""}+${body.amount} tanga (${lessonName(l)})`,
        before: ex ? { studentId: s.id, amount: ex.amount, note: ex.note } : null,
        after: { studentId: s.id, amount: body.amount, note },
      });
      return { studentId: body.studentId, amount: body.amount, note, changed: true };
    });
  });

  app.delete("/lessons/:id/activity/:studentId", async (req) => {
    const { id, studentId } = parse(lessonStudentParam, req.params);
    const l = await assertTeacherLesson(req.auth.userId, id);
    assertMarkable(l);
    return prisma.$transaction(async (tx) => {
      const t = await revokeCoins(tx, studentId, "ACTIVITY", "lesson", id);
      if (!t) throw notFound("Faollik tangasi topilmadi");
      const u = await tx.user.findUnique({ where: { id: studentId }, select: { fullName: true } });
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "coins.activity",
        entityType: "Lesson",
        entityId: id,
        summary: `${u?.fullName ?? "Oʻquvchi"}: darsdagi faollik tangasi bekor qilindi (+${t.amount}, ${lessonName(l)})`,
        before: { studentId, amount: t.amount, note: t.note },
        after: null,
      });
      return { studentId, removed: true };
    });
  });

  // ───────────── Darsdagi baho ─────────────
  app.post("/lessons/:id/grades", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(gradeBody, req.body);
    const l = await assertTeacherLesson(req.auth.userId, id);
    assertMarkable(l);
    const members = await activeMembers(prisma, l.groupId);
    const s = members.get(body.studentId);
    if (!s) throw badRequest("Oʻquvchi bu guruhning faol roʻyxatida yoʻq");
    const title = body.title || l.title || null;

    return prisma.$transaction(async (tx) => {
      const g = await tx.grade.create({
        data: {
          studentId: s.id,
          groupId: l.groupId,
          lessonId: id,
          kind: "CLASSWORK",
          skill: body.skill ?? null,
          value: body.value,
          title,
          comment: body.comment || null,
          givenById: req.auth.userId,
        },
      });
      const label = GRADE_NAME[body.value];
      await notifyParents(tx, s.id, {
        type: "grade.new",
        title: "Yangi baho",
        body: `${s.fullName} darsda ${body.value} (${label}) oldi${title ? ` — ${title}` : ""}.`,
        link: parentLessonLink(id),
        payload: { gradeId: g.id, lessonId: id, studentId: s.id, value: body.value },
      });
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "grade.create",
        entityType: "Grade",
        entityId: g.id,
        summary: `${s.fullName}: darsdagi baho ${body.value} (${label})${title ? ` — ${title}` : ""}`,
        after: { studentId: s.id, lessonId: id, kind: g.kind, value: g.value, skill: g.skill, title: g.title, comment: g.comment },
      });
      return { id: g.id, studentId: s.id, value: g.value, label, kind: g.kind, skill: g.skill, title: g.title, comment: g.comment, gradedAt: g.gradedAt };
    });
  });

  // Baho tahriri (o'z guruhidagi istalgan baho) — kanon "4 → 5" audit hodisasi
  app.put("/grades/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(gradeEditBody, req.body);
    const g = await prisma.grade.findFirst({
      where: { id, group: { teacherId: req.auth.userId } },
      include: { student: { select: { fullName: true } } },
    });
    if (!g) throw notFound("Baho topilmadi");
    if (body.value !== undefined && (g.kind === "CLASSWORK" || g.kind === "HOMEWORK") && !Number.isInteger(body.value)) {
      throw badRequest("Baho 2 dan 5 gacha butun son boʻlishi kerak");
    }
    const data: Prisma.GradeUpdateInput = {};
    if (body.value !== undefined && body.value !== g.value) data.value = body.value;
    if (body.skill !== undefined && body.skill !== g.skill) data.skill = body.skill;
    if (body.title !== undefined && (body.title || null) !== g.title) data.title = body.title || null;
    if (body.comment !== undefined && (body.comment || null) !== g.comment) data.comment = body.comment || null;
    const snap = (x: { value: number; skill: string | null; title: string | null; comment: string | null }) => ({
      value: x.value, skill: x.skill, title: x.title, comment: x.comment,
    });
    if (!Object.keys(data).length) return { ...snap(g), id, changed: false };

    return prisma.$transaction(async (tx) => {
      const row = await tx.grade.update({ where: { id }, data });
      if (data.value !== undefined && g.submissionId) {
        await tx.submission.update({ where: { id: g.submissionId }, data: { score: Math.round(row.value) } });
      }
      const name = g.title || "Baho";
      const valueChanged = data.value !== undefined;
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "grade.update",
        entityType: "Grade",
        entityId: id,
        summary: valueChanged
          ? `${name} bahosi ${fmtV(g.value)} → ${fmtV(row.value)} (${g.student.fullName})`
          : `${name} bahosi tahrirlandi (${g.student.fullName})`,
        before: snap(g),
        after: snap(row),
      });
      if (valueChanged) {
        await notifyParents(tx, g.studentId, {
          type: "grade.updated",
          title: "Baho oʻzgartirildi",
          body: `${g.student.fullName}: “${name}” bahosi ${fmtV(g.value)} dan ${fmtV(row.value)} ga oʻzgartirildi.`,
          link: g.lessonId ? parentLessonLink(g.lessonId) : "/ota-ona/baholar",
          payload: { gradeId: id, studentId: g.studentId, before: g.value, after: row.value },
        });
      }
      return { ...snap(row), id, label: GRADE_NAME[Math.round(row.value)] ?? null, changed: true };
    });
  });

  // Xato qo'yilgan darsdagi bahoni o'chirish (faqat CLASSWORK, vazifaga bog'lanmagan)
  app.delete("/grades/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const g = await prisma.grade.findFirst({
      where: { id, group: { teacherId: req.auth.userId } },
      include: { student: { select: { fullName: true } } },
    });
    if (!g) throw notFound("Baho topilmadi");
    if (g.kind !== "CLASSWORK" || g.submissionId) throw badRequest("Faqat darsdagi bahoni oʻchirish mumkin");
    return prisma.$transaction(async (tx) => {
      await tx.grade.delete({ where: { id } });
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "grade.delete",
        entityType: "Grade",
        entityId: id,
        summary: `${g.student.fullName}: darsdagi baho ${fmtV(g.value)} oʻchirildi${g.title ? ` — ${g.title}` : ""}`,
        before: { studentId: g.studentId, lessonId: g.lessonId, value: g.value, skill: g.skill, title: g.title, comment: g.comment },
      });
      return { id, removed: true };
    });
  });
}
