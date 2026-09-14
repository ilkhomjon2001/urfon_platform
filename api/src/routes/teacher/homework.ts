// Ustoz: uyga vazifalar (yaratish/tahrirlash), topshiriqlarni tekshirish, baho + tanga, ota-onaga xabar.
// Kelishuv (ROL-AGENTLAR.md): POST /homework va GET /homework ni teacher-a ham chaqiradi.
import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import type { HomeworkType, Skill, SubmissionStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../db.js";
import { auditCtx, idParam, paged, paginate, parse, zGrade } from "../../lib/http.js";
import {
  assertTeacherGroup,
  assertTeacherHomework,
  assertTeacherLesson,
  assertTeacherSubmission,
  teacherGroupIds,
} from "../../lib/access.js";
import { writeAudit } from "../../lib/audit.js";
import { badRequest, conflict, notFound } from "../../lib/errors.js";
import { notify, notifyParents } from "../../lib/notify.js";
import { attachFiles, deleteStored } from "../../lib/storage.js";
import { awardCoins, coinRef } from "../../lib/coins.js";
import { GAMIFICATION } from "../../config/gamification.js";
import { addDays, startOfDayTz, ymdTz } from "../../lib/dates.js";

// ───────────────────────── yordamchilar ─────────────────────────

const HW_TYPES = ["TEXT", "AUDIO", "FILE", "QUIZ"] as const;
const GRADE_NAME: Record<number, string> = { 5: "Aʼlo", 4: "Yaxshi", 3: "Qoniqarli", 2: "Qoniqarsiz" };
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const pad = (n: number) => String(n).padStart(2, "0");
/** "24-may, 20:00" (Toshkent) */
function fmtDue(d: Date) {
  const t = new Date(d.getTime() + 5 * 3600_000);
  return `${t.getUTCDate()}-${MONTHS[t.getUTCMonth()]}, ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`;
}
const gradeText = (score: number) => `${score} (${GRADE_NAME[score] ?? ""})`;
const STUDENT_LINK = (homeworkId: string) => `/oquvchi/vazifalar/${homeworkId}`;
const PARENT_LINK = "/ota-ona/vazifalar";

const fileSel = { id: true, originalName: true, mime: true, size: true } as const;
const groupSel = { id: true, code: true, name: true } as const;

// QUIZ: { questions: [{ id, text, options[], answer }] } — answer = to'g'ri variant indeksi (0..n-1).
// Klient variant matnini yuborsa ham qabul qilinadi va indeksga aylantiriladi.
const quizQuestion = z.object({
  id: z.string().trim().min(1).max(40),
  text: z.string().trim().min(1, "Savol matni boʻsh").max(1000),
  options: z.array(z.string().trim().min(1, "Variant boʻsh").max(300)).min(2, "Kamida 2 ta variant").max(8),
  answer: z.union([z.number().int().min(0), z.string().trim().min(1)]),
});
const quizContent = z.object({ questions: z.array(quizQuestion).min(1, "Kamida 1 ta savol").max(50) });
type QuizQ = { id: string; text: string; options: string[]; answer: number };

function normalizeContent(type: HomeworkType, content: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (type === "QUIZ") {
    const c = parse(quizContent, content);
    const ids = new Set<string>();
    const questions: QuizQ[] = c.questions.map((q, i) => {
      if (ids.has(q.id)) throw badRequest(`Savol ID takrorlangan: ${q.id}`);
      ids.add(q.id);
      const idx = typeof q.answer === "number" ? q.answer : q.options.indexOf(q.answer);
      if (idx < 0 || idx >= q.options.length) throw badRequest(`${i + 1}-savol: toʻgʻri javob variantlar ichida boʻlishi kerak`);
      return { id: q.id, text: q.text, options: q.options, answer: idx };
    });
    return { questions };
  }
  if (content === undefined || content === null) return Prisma.DbNull;
  const c = parse(z.record(z.unknown()), content);
  if (JSON.stringify(c).length > 20_000) throw badRequest("Vazifa tarkibi juda katta");
  return c as Prisma.InputJsonValue;
}

function quizQuestions(content: unknown): QuizQ[] | null {
  const qs = (content as { questions?: unknown } | null)?.questions;
  if (!Array.isArray(qs)) return null;
  return qs.filter((q): q is QuizQ => !!q && typeof q === "object" && Array.isArray((q as QuizQ).options));
}

/** O'quvchi javobini variant indeksiga keltiradi. answers: {qid: idx|matn} | [{id|questionId, answer|value}] | [idx…] */
function givenAnswer(answers: unknown, q: QuizQ, i: number): number | null {
  let v: unknown = null;
  if (Array.isArray(answers)) {
    const hit = answers.find((a) => a && typeof a === "object" && ((a as { id?: string }).id === q.id || (a as { questionId?: string }).questionId === q.id));
    v = hit ? ((hit as { answer?: unknown }).answer ?? (hit as { value?: unknown }).value ?? null) : (typeof answers[i] !== "object" ? answers[i] : null);
  } else if (answers && typeof answers === "object") {
    v = (answers as Record<string, unknown>)[q.id] ?? null;
  }
  if (typeof v === "number" && Number.isInteger(v)) return v;
  if (typeof v === "string") {
    if (/^\d+$/.test(v)) return Number(v);
    const idx = q.options.indexOf(v);
    return idx >= 0 ? idx : null;
  }
  return null;
}

const suggestFromPercent = (p: number) => (p >= 85 ? 5 : p >= 70 ? 4 : p >= 50 ? 3 : 2);

/** Savollar soni: {questions:[…]} yoki eski/seed formati {questions: 20, …} */
function quizCount(content: unknown): number | null {
  const q = (content as { questions?: unknown } | null)?.questions;
  if (Array.isArray(q)) return q.length;
  return typeof q === "number" ? q : null;
}

/** QUIZ avtomatik tekshiruvi (ustozga tavsiya; yakuniy bahoni ustoz qo'yadi). */
function quizScore(content: unknown, answers: unknown, withItems = false) {
  // Oldindan hisoblangan natija (seed / tashqi test): { correct, total }
  const summary = answers as { correct?: unknown; total?: unknown } | null;
  if (summary && typeof summary === "object" && !Array.isArray(summary) && typeof summary.correct === "number" && typeof summary.total === "number" && summary.total > 0) {
    const percent = Math.round((summary.correct / summary.total) * 100);
    return { total: summary.total, correct: summary.correct, percent, suggested: suggestFromPercent(percent), ...(withItems ? { items: [] } : {}) };
  }
  const qs = quizQuestions(content);
  if (!qs?.length) return null;
  const items = qs.map((q, i) => {
    const given = givenAnswer(answers, q, i);
    return { id: q.id, text: q.text, options: q.options, answer: q.answer, given, correct: given === q.answer };
  });
  const correct = items.filter((x) => x.correct).length;
  const percent = Math.round((correct / qs.length) * 100);
  return { total: qs.length, correct, percent, suggested: suggestFromPercent(percent), ...(withItems ? { items } : {}) };
}

const wordCount = (t: string | null) => (t ? t.trim().split(/\s+/).filter(Boolean).length : 0);
const isLateSub = (s: { isLate: boolean; submittedAt: Date | null }, dueAt: Date) => s.isLate || (!!s.submittedAt && s.submittedAt > dueAt);

// ───────────────────────── vazifa statistikasi ─────────────────────────

type HwForStats = { id: string; groupId: string };
async function statsFor(hws: HwForStats[]) {
  const groupIds = [...new Set(hws.map((h) => h.groupId))];
  const [enrolls, subs] = await Promise.all([
    prisma.groupStudent.findMany({ where: { groupId: { in: groupIds }, status: "ACTIVE" }, select: { groupId: true, studentId: true } }),
    prisma.submission.findMany({
      where: { homeworkId: { in: hws.map((h) => h.id) } },
      select: { homeworkId: true, studentId: true, status: true, isLate: true, score: true },
    }),
  ]);
  const active = new Map<string, Set<string>>();
  for (const e of enrolls) {
    if (!active.has(e.groupId)) active.set(e.groupId, new Set());
    active.get(e.groupId)!.add(e.studentId);
  }
  const byHw = new Map<string, typeof subs>();
  for (const s of subs) {
    if (!byHw.has(s.homeworkId)) byHw.set(s.homeworkId, []);
    byHw.get(s.homeworkId)!.push(s);
  }
  const out = new Map<string, ReturnType<typeof calc>>();
  function calc(h: HwForStats) {
    const students = active.get(h.groupId) ?? new Set<string>();
    const list = (byHw.get(h.id) ?? []).filter((s) => s.status !== "DRAFT");
    const submittedActive = list.filter((s) => students.has(s.studentId)).length;
    const scores = list.filter((s) => s.status === "REVIEWED" && s.score != null).map((s) => s.score!);
    return {
      students: students.size,
      submitted: list.length, // topshirilgan (tekshirilgan/qaytarilgan ham)
      awaiting: list.filter((s) => s.status === "SUBMITTED").length,
      reviewed: list.filter((s) => s.status === "REVIEWED").length,
      returned: list.filter((s) => s.status === "RETURNED").length,
      late: list.filter((s) => s.isLate).length,
      missing: Math.max(0, students.size - submittedActive),
      drafts: (byHw.get(h.id) ?? []).filter((s) => s.status === "DRAFT").length,
      avgScore: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null,
    };
  }
  for (const h of hws) out.set(h.id, calc(h));
  return out;
}

const hwInclude = {
  group: { select: groupSel },
  lesson: { select: { id: true, title: true, number: true, startsAt: true } },
  topic: { select: { id: true, unit: true, title: true } },
  files: { select: fileSel },
} satisfies Prisma.HomeworkInclude;
type HwRow = Prisma.HomeworkGetPayload<{ include: typeof hwInclude }>;

function hwDto(h: HwRow, stats: Awaited<ReturnType<typeof statsFor>>, withContent = false) {
  return {
    id: h.id,
    title: h.title,
    description: h.description,
    type: h.type,
    dueAt: h.dueAt,
    createdAt: h.createdAt,
    coinReward: GAMIFICATION.coins.HOMEWORK_ON_TIME,
    group: h.group,
    lesson: h.lesson,
    topic: h.topic,
    files: h.files,
    questionsCount: h.type === "QUIZ" ? quizCount(h.content) : null,
    isOpen: h.dueAt.getTime() >= Date.now(),
    stats: stats.get(h.id)!,
    ...(withContent ? { content: h.content } : {}),
  };
}

// ───────────────────────── topshiriq DTO ─────────────────────────

const subInclude = {
  student: { select: { id: true, fullName: true, studentProfile: { select: { code: true } } } },
  homework: { select: { id: true, title: true, type: true, dueAt: true, content: true, groupId: true, lessonId: true, group: { select: groupSel } } },
  files: { select: fileSel },
} satisfies Prisma.SubmissionInclude;
type SubRow = Prisma.SubmissionGetPayload<{ include: typeof subInclude }>;

function subDto(s: SubRow, detail = false) {
  const late = isLateSub(s, s.homework.dueAt);
  return {
    id: s.id,
    status: s.status,
    text: s.text,
    wordCount: wordCount(s.text),
    submittedAt: s.submittedAt,
    isLate: late,
    score: s.score,
    feedback: s.feedback,
    coinsAwarded: s.coinsAwarded,
    reviewedAt: s.reviewedAt,
    // "+10 tanga" ishorasi: o'z vaqtida topshirilgan va hali tanga berilmagan bo'lsa
    coinsOnReview: !late && s.coinsAwarded === 0 ? GAMIFICATION.coins.HOMEWORK_ON_TIME : 0,
    student: { id: s.student.id, fullName: s.student.fullName, code: s.student.studentProfile?.code ?? null },
    homework: { id: s.homework.id, title: s.homework.title, type: s.homework.type, dueAt: s.homework.dueAt, group: s.homework.group },
    files: s.files,
    quiz: s.homework.type === "QUIZ" ? quizScore(s.homework.content, s.answers, detail) : null,
    ...(detail ? { answers: s.answers } : {}),
  };
}

// ───────────────────────── sxemalar ─────────────────────────

const zId = z.string().min(1).max(40);
const hwCreate = z.object({
  groupId: zId,
  lessonId: zId.nullish(),
  topicId: zId.nullish(),
  title: z.string().trim().min(2, "Sarlavha kamida 2 belgi").max(200),
  description: z.string().trim().max(5000).nullish(),
  type: z.enum(HW_TYPES).default("TEXT"),
  dueAt: z.coerce.date(),
  content: z.unknown().optional(),
  fileIds: z.array(zId).max(5).default([]),
  notify: z.boolean().default(true),
});
const hwUpdate = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(5000).nullish(),
  type: z.enum(HW_TYPES).optional(),
  dueAt: z.coerce.date().optional(),
  lessonId: zId.nullish(),
  topicId: zId.nullish(),
  content: z.unknown().optional(),
  addFileIds: z.array(zId).max(5).default([]),
  removeFileIds: z.array(zId).max(20).default([]),
});

const DUE_MIN_MS = 5 * 60_000; // muddat hozirdan kamida 5 daqiqa keyin

async function checkLinks(teacherId: string, groupId: string, lessonId?: string | null, topicId?: string | null) {
  if (lessonId) {
    const l = await assertTeacherLesson(teacherId, lessonId);
    if (l.groupId !== groupId) throw badRequest("Dars boshqa guruhga tegishli");
  }
  if (topicId) {
    const t = await prisma.topic.findUnique({ where: { id: topicId }, select: { id: true } });
    if (!t) throw badRequest("Mavzu topilmadi");
  }
}

// ───────────────────────── marshrutlar ─────────────────────────

export default async function homework(app: FastifyInstance) {
  // Ro'yxat (statistika bilan). teacher-a dars sahifasi: ?groupId=&lessonId=
  app.get("/homework", async (req) => {
    const q = parse(
      z.object({
        groupId: zId.optional(),
        lessonId: zId.optional(),
        topicId: zId.optional(),
        type: z.enum(HW_TYPES).optional(),
        status: z.enum(["all", "active", "past", "review"]).default("all"),
        q: z.string().trim().max(100).optional(),
        limit: z.coerce.number().int().min(1).max(200).default(100),
      }),
      req.query,
    );
    const me = req.auth.userId;
    if (q.groupId) await assertTeacherGroup(me, q.groupId);
    if (q.lessonId) await assertTeacherLesson(me, q.lessonId);
    const now = new Date();
    const where: Prisma.HomeworkWhereInput = {
      group: { teacherId: me },
      ...(q.groupId ? { groupId: q.groupId } : {}),
      ...(q.lessonId ? { lessonId: q.lessonId } : {}),
      ...(q.topicId ? { topicId: q.topicId } : {}),
      ...(q.type ? { type: q.type } : {}),
      ...(q.q ? { title: { contains: q.q, mode: "insensitive" } } : {}),
      ...(q.status === "active" ? { dueAt: { gte: now } } : {}),
      ...(q.status === "past" ? { dueAt: { lt: now } } : {}),
      ...(q.status === "review" ? { submissions: { some: { status: "SUBMITTED" } } } : {}),
    };
    const rows = await prisma.homework.findMany({
      where,
      include: hwInclude,
      orderBy: { dueAt: q.status === "active" ? "asc" : "desc" },
      take: q.limit,
    });
    const stats = await statsFor(rows);
    return rows.map((h) => hwDto(h, stats));
  });

  // Sahifa tepasidagi ko'rsatkichlar va "tekshiruv samaradorligi"
  app.get("/homework/stats", async (req) => {
    const me = req.auth.userId;
    const gids = await teacherGroupIds(me);
    const now = new Date();
    const d30 = addDays(now, -30);
    const d60 = addDays(now, -60);
    const [active, awaiting, recent, prev, reviewed, reviewedWeek] = await Promise.all([
      prisma.homework.findMany({ where: { groupId: { in: gids }, dueAt: { gte: now } }, select: { id: true, groupId: true } }),
      prisma.submission.findMany({ where: { status: "SUBMITTED", homework: { groupId: { in: gids } } }, select: { homework: { select: { type: true } } } }),
      prisma.submission.findMany({
        where: { status: { not: "DRAFT" }, submittedAt: { gte: d30 }, homework: { groupId: { in: gids } } },
        select: { isLate: true },
      }),
      prisma.submission.findMany({
        where: { status: { not: "DRAFT" }, submittedAt: { gte: d60, lt: d30 }, homework: { groupId: { in: gids } } },
        select: { isLate: true },
      }),
      prisma.submission.findMany({
        where: { status: "REVIEWED", score: { not: null }, homework: { groupId: { in: gids } } },
        select: { score: true, submittedAt: true, reviewedAt: true },
        orderBy: { reviewedAt: "desc" },
        take: 500,
      }),
      prisma.submission.findMany({
        where: { reviewerId: me, reviewedAt: { gte: addDays(startOfDayTz(now), -6) } },
        select: { reviewedAt: true },
      }),
    ]);
    const byType: Record<string, number> = { TEXT: 0, AUDIO: 0, FILE: 0, QUIZ: 0 };
    for (const a of awaiting) byType[a.homework.type]++;
    const rate = (xs: { isLate: boolean }[]) => (xs.length ? Math.round((xs.filter((x) => !x.isLate).length / xs.length) * 1000) / 10 : null);
    const scores = reviewed.map((r) => r.score!);
    const hours = reviewed
      .filter((r) => r.submittedAt && r.reviewedAt && r.reviewedAt > r.submittedAt)
      .slice(0, 100)
      .map((r) => (r.reviewedAt!.getTime() - r.submittedAt!.getTime()) / 3_600_000);
    const days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const ymd = ymdTz(addDays(startOfDayTz(now), -i));
      days.push({ date: ymd, count: reviewedWeek.filter((r) => r.reviewedAt && ymdTz(r.reviewedAt) === ymd).length });
    }
    const todayYmd = ymdTz(now);
    const reviewedToday = days.find((d) => d.date === todayYmd)?.count ?? 0;
    return {
      activeHomework: active.length,
      activeGroups: new Set(active.map((a) => a.groupId)).size,
      groups: gids.length,
      awaiting: awaiting.length,
      awaitingByType: byType,
      onTimeRate: rate(recent),
      onTimeRatePrev: rate(prev),
      avgScore: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null,
      reviewedTotal: scores.length,
      avgReviewHours: hours.length ? Math.round((hours.reduce((a, b) => a + b, 0) / hours.length) * 10) / 10 : null,
      reviewedToday,
      todayTarget: reviewedToday + awaiting.length,
      reviewedByDay: days,
      coinsOnTime: GAMIFICATION.coins.HOMEWORK_ON_TIME,
    };
  });

  // "Yangi vazifa" oynasi uchun: guruhning yaqin darslari va Level mavzulari
  app.get("/homework/form-options", async (req) => {
    const q = parse(z.object({ groupId: zId }), req.query);
    const g = await assertTeacherGroup(req.auth.userId, q.groupId);
    const now = new Date();
    const [lessons, topics] = await Promise.all([
      prisma.lesson.findMany({
        where: { groupId: g.id, status: { not: "CANCELLED" }, startsAt: { gte: addDays(now, -21), lte: addDays(now, 14) } },
        orderBy: { startsAt: "desc" },
        take: 20,
        select: { id: true, title: true, number: true, startsAt: true, topics: { select: { topicId: true }, take: 1 } },
      }),
      g.levelId
        ? prisma.topic.findMany({ where: { levelId: g.levelId, status: { not: "ARCHIVED" } }, orderBy: { unit: "asc" }, select: { id: true, unit: true, title: true } })
        : Promise.resolve([]),
    ]);
    return {
      lessons: lessons.map(({ topics: t, ...l }) => ({ ...l, topicId: t[0]?.topicId ?? null })),
      topics,
    };
  });

  // Hali topshirmaganlarga eslatma (o'quvchi — ilova ichida, ota-ona — Telegram orqali)
  app.post("/homework/:id/remind", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(z.object({ parents: z.boolean().default(true) }), req.body ?? {});
    const h = await assertTeacherHomework(req.auth.userId, id);
    if (h.dueAt.getTime() < Date.now()) throw badRequest("Muddati tugagan vazifa uchun eslatma yuborilmaydi");
    const [enrolls, subs] = await Promise.all([
      prisma.groupStudent.findMany({ where: { groupId: h.groupId, status: "ACTIVE" }, select: { student: { select: { id: true, fullName: true } } } }),
      prisma.submission.findMany({ where: { homeworkId: id, status: { not: "DRAFT" } }, select: { studentId: true } }),
    ]);
    const done = new Set(subs.map((s) => s.studentId));
    const missing = enrolls.map((e) => e.student).filter((s) => !done.has(s.id));
    if (!missing.length) throw badRequest("Barcha oʻquvchilar topshirgan");
    const due = fmtDue(h.dueAt);
    const parents = await prisma.$transaction(async (tx) => {
      let n = 0;
      for (const s of missing) {
        await notify(tx, {
          userId: s.id,
          type: "homework.reminder",
          title: "Uyga vazifa eslatmasi",
          body: `“${h.title}” — muddat ${due}. Topshirishni unutmang!`,
          link: STUDENT_LINK(id),
          telegram: false,
        });
        if (body.parents) {
          n += await notifyParents(tx, s.id, {
            type: "homework.reminder",
            title: "Uyga vazifa eslatmasi",
            body: `${s.fullName} “${h.title}” vazifasini hali topshirmagan. Muddat: ${due}`,
            link: PARENT_LINK,
            payload: { homeworkId: id, studentId: s.id },
          });
        }
      }
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "homework.remind",
        entityType: "Homework",
        entityId: id,
        summary: `“${h.title}”: ${missing.length} ta oʻquvchiga eslatma yuborildi`,
        after: { students: missing.map((s) => s.id), parents: n },
      });
      return n;
    });
    return { students: missing.length, parents };
  });

  // Bitta vazifa: tarkib (QUIZ javoblari bilan — faqat ustozga), fayllar, guruh bo'yicha holat
  app.get("/homework/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    await assertTeacherHomework(req.auth.userId, id);
    const h = await prisma.homework.findUniqueOrThrow({ where: { id }, include: hwInclude });
    const stats = await statsFor([h]);
    const [enrolls, subs] = await Promise.all([
      prisma.groupStudent.findMany({
        where: { groupId: h.groupId, status: "ACTIVE" },
        select: { student: { select: { id: true, fullName: true, studentProfile: { select: { code: true } } } } },
        orderBy: { student: { fullName: "asc" } },
      }),
      prisma.submission.findMany({
        where: { homeworkId: id },
        select: { id: true, studentId: true, status: true, submittedAt: true, isLate: true, score: true, coinsAwarded: true },
      }),
    ]);
    const subMap = new Map(subs.map((s) => [s.studentId, s]));
    return {
      ...hwDto(h, stats, true),
      roster: enrolls.map(({ student }) => {
        const s = subMap.get(student.id);
        return {
          student: { id: student.id, fullName: student.fullName, code: student.studentProfile?.code ?? null },
          submission: s && s.status !== "DRAFT" ? { ...s, isLate: isLateSub(s, h.dueAt) } : null,
          hasDraft: s?.status === "DRAFT",
        };
      }),
    };
  });

  // Yangi vazifa (kelishuv: teacher-a "Uyga vazifa berish")
  app.post("/homework", async (req, reply) => {
    const body = parse(hwCreate, req.body);
    const me = req.auth.userId;
    const group = await assertTeacherGroup(me, body.groupId);
    await checkLinks(me, body.groupId, body.lessonId, body.topicId);
    if (body.dueAt.getTime() < Date.now() + DUE_MIN_MS) throw badRequest("Muddat kelajakdagi vaqt boʻlishi kerak");
    const content = normalizeContent(body.type, body.content);
    const created = await prisma.$transaction(async (tx) => {
      const h = await tx.homework.create({
        data: {
          groupId: body.groupId,
          lessonId: body.lessonId ?? null,
          topicId: body.topicId ?? null,
          title: body.title,
          description: body.description || null,
          type: body.type,
          content,
          dueAt: body.dueAt,
          coinReward: GAMIFICATION.coins.HOMEWORK_ON_TIME,
          createdById: me,
        },
      });
      if (body.fileIds.length) await attachFiles(tx, body.fileIds, me, { homeworkId: h.id });
      let notified = 0;
      if (body.notify) {
        const students = await tx.groupStudent.findMany({
          where: { groupId: body.groupId, status: "ACTIVE" },
          select: { student: { select: { id: true, fullName: true } } },
        });
        const due = fmtDue(body.dueAt);
        for (const { student } of students) {
          await notify(tx, {
            userId: student.id,
            type: "homework.new",
            title: "Yangi uyga vazifa",
            body: `Yangi uyga vazifa: ${body.title}, muddat ${due}`,
            link: STUDENT_LINK(h.id),
            payload: { homeworkId: h.id },
            telegram: false,
          });
          notified += await notifyParents(tx, student.id, {
            type: "homework.new",
            title: "Yangi uyga vazifa",
            body: `${student.fullName}ga yangi uyga vazifa berildi: “${body.title}”, muddat ${due}`,
            link: PARENT_LINK,
            payload: { homeworkId: h.id, studentId: student.id },
          });
        }
      }
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "homework.create",
        entityType: "Homework",
        entityId: h.id,
        summary: `${group.name}: “${body.title}” uyga vazifasi berildi (muddat ${fmtDue(body.dueAt)})`,
        after: { groupId: h.groupId, lessonId: h.lessonId, title: h.title, type: h.type, dueAt: h.dueAt, files: body.fileIds.length },
      });
      return { h, notified };
    });
    const row = await prisma.homework.findUniqueOrThrow({ where: { id: created.h.id }, include: hwInclude });
    reply.code(201);
    return { ...hwDto(row, await statsFor([row]), true), parentsNotified: created.notified };
  });

  app.put("/homework/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(hwUpdate, req.body);
    const me = req.auth.userId;
    const old = await assertTeacherHomework(me, id);
    const submitted = await prisma.submission.count({ where: { homeworkId: id, status: { not: "DRAFT" } } });
    const type = body.type ?? old.type;
    if (body.type && body.type !== old.type && submitted) throw conflict("Topshiriqlar bor — vazifa turini oʻzgartirib boʻlmaydi");
    await checkLinks(me, old.groupId, body.lessonId, body.topicId);
    if (body.dueAt && body.dueAt.getTime() !== old.dueAt.getTime() && body.dueAt.getTime() < Date.now() + DUE_MIN_MS) {
      throw badRequest("Muddat kelajakdagi vaqt boʻlishi kerak");
    }
    const data: Prisma.HomeworkUncheckedUpdateInput = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.type !== undefined) data.type = body.type;
    if (body.dueAt !== undefined) data.dueAt = body.dueAt;
    if (body.lessonId !== undefined) data.lessonId = body.lessonId ?? null;
    if (body.topicId !== undefined) data.topicId = body.topicId ?? null;
    if (body.content !== undefined || (body.type && body.type !== old.type)) data.content = normalizeContent(type, body.content ?? null);

    const removed = body.removeFileIds.length
      ? await prisma.file.findMany({ where: { id: { in: body.removeFileIds }, homeworkId: id }, select: { id: true, storageKey: true } })
      : [];
    if (removed.length !== body.removeFileIds.length) throw badRequest("Fayl topilmadi");
    const dueChanged = body.dueAt && body.dueAt.getTime() !== old.dueAt.getTime();

    await prisma.$transaction(async (tx) => {
      const h = await tx.homework.update({ where: { id }, data });
      if (body.addFileIds.length) await attachFiles(tx, body.addFileIds, me, { homeworkId: id });
      if (removed.length) await tx.file.deleteMany({ where: { id: { in: removed.map((f) => f.id) } } });
      if (dueChanged) {
        const students = await tx.groupStudent.findMany({ where: { groupId: old.groupId, status: "ACTIVE" }, select: { studentId: true } });
        for (const s of students) {
          await notify(tx, {
            userId: s.studentId,
            type: "homework.updated",
            title: "Vazifa muddati oʻzgardi",
            body: `“${h.title}” — yangi muddat ${fmtDue(h.dueAt)}`,
            link: STUDENT_LINK(id),
            telegram: false,
          });
        }
      }
      const pick = (o: Record<string, unknown>) => Object.fromEntries(Object.keys(data).map((k) => [k, o[k]]));
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "homework.update",
        entityType: "Homework",
        entityId: id,
        summary: `“${h.title}” uyga vazifasi tahrirlandi`,
        before: { ...pick(old as unknown as Record<string, unknown>), ...(removed.length ? { removedFiles: removed.map((f) => f.id) } : {}) },
        after: { ...pick(h as unknown as Record<string, unknown>), ...(body.addFileIds.length ? { addedFiles: body.addFileIds } : {}) },
      });
    });
    for (const f of removed) await deleteStored(f);
    const row = await prisma.homework.findUniqueOrThrow({ where: { id }, include: hwInclude });
    return hwDto(row, await statsFor([row]), true);
  });

  app.delete("/homework/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const h = await assertTeacherHomework(req.auth.userId, id);
    const subs = await prisma.submission.count({ where: { homeworkId: id } });
    if (subs) throw conflict("Bu vazifaga oʻquvchilar javob yozishni boshlagan — oʻchirib boʻlmaydi");
    const files = await prisma.file.findMany({ where: { homeworkId: id }, select: { storageKey: true } });
    await prisma.$transaction(async (tx) => {
      await tx.homework.delete({ where: { id } });
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "homework.delete",
        entityType: "Homework",
        entityId: id,
        summary: `“${h.title}” uyga vazifasi oʻchirildi`,
        before: { groupId: h.groupId, title: h.title, type: h.type, dueAt: h.dueAt },
      });
    });
    for (const f of files) await deleteStored(f);
    return { ok: true };
  });

  // ─────────── Topshiriqlar (tekshiruv navbati) ───────────

  app.get("/submissions", async (req) => {
    const q = parse(
      z.object({
        status: z.enum(["SUBMITTED", "REVIEWED", "RETURNED", "ALL"]).default("SUBMITTED"),
        groupId: zId.optional(),
        homeworkId: zId.optional(),
        studentId: zId.optional(),
        type: z.enum(HW_TYPES).optional(),
        q: z.string().trim().max(100).optional(),
        sort: z.enum(["newest", "oldest"]).default("newest"),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(200).default(50),
      }),
      req.query,
    );
    const me = req.auth.userId;
    if (q.groupId) await assertTeacherGroup(me, q.groupId);
    if (q.homeworkId) await assertTeacherHomework(me, q.homeworkId);
    const base: Prisma.SubmissionWhereInput = {
      homework: {
        group: { teacherId: me },
        ...(q.groupId ? { groupId: q.groupId } : {}),
        ...(q.type ? { type: q.type } : {}),
      },
      ...(q.homeworkId ? { homeworkId: q.homeworkId } : {}),
      ...(q.studentId ? { studentId: q.studentId } : {}),
      ...(q.q ? { student: { fullName: { contains: q.q, mode: "insensitive" } } } : {}),
    };
    const where: Prisma.SubmissionWhereInput = {
      ...base,
      status: q.status === "ALL" ? { not: "DRAFT" } : q.status,
    };
    const [rows, total, grouped] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: subInclude,
        orderBy: [{ submittedAt: q.sort === "newest" ? "desc" : "asc" }, { id: "asc" }],
        ...paginate(q),
      }),
      prisma.submission.count({ where }),
      prisma.submission.groupBy({ by: ["status"], where: { ...base, status: { not: "DRAFT" } }, _count: { _all: true } }),
    ]);
    const counts: Record<string, number> = { SUBMITTED: 0, REVIEWED: 0, RETURNED: 0 };
    for (const g of grouped) counts[g.status] = g._count._all;
    return { ...paged(rows.map((s) => subDto(s)), total, q), counts };
  });

  app.get("/submissions/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    await assertTeacherSubmission(req.auth.userId, id);
    const s = await prisma.submission.findUniqueOrThrow({ where: { id }, include: subInclude });
    if (s.status === "DRAFT") throw notFound("Topshiriq topilmadi");
    const [hw, grades] = await Promise.all([
      prisma.homework.findUniqueOrThrow({ where: { id: s.homeworkId }, select: { description: true, files: { select: fileSel } } }),
      prisma.grade.aggregate({
        where: { studentId: s.studentId, groupId: s.homework.groupId, kind: "HOMEWORK" },
        _avg: { value: true },
        _count: { _all: true },
      }),
    ]);
    const reviewer = s.reviewerId ? await prisma.user.findUnique({ where: { id: s.reviewerId }, select: { id: true, fullName: true } }) : null;
    return {
      ...subDto(s, true),
      homework: { ...subDto(s).homework, description: hw.description, files: hw.files },
      reviewer,
      studentStats: {
        homeworkAvg: grades._avg.value != null ? Math.round(grades._avg.value * 10) / 10 : null,
        homeworkGraded: grades._count._all,
      },
    };
  });

  // Baholash: REVIEWED + Grade(HOMEWORK) + o'z vaqtida bo'lsa tanga (idempotent) + o'quvchi/ota-onaga xabar + audit.
  app.post("/submissions/:id/review", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(z.object({ score: zGrade, feedback: z.string().trim().max(2000).nullish() }), req.body);
    const me = req.auth.userId;
    await assertTeacherSubmission(me, id);
    const s = await prisma.submission.findUniqueOrThrow({ where: { id }, include: subInclude });
    if (s.status !== "SUBMITTED" && s.status !== "REVIEWED") {
      throw badRequest(s.status === "RETURNED" ? "Topshiriq qayta ishlashga qaytarilgan — oʻquvchi qayta topshirishini kuting" : "Topshiriq hali topshirilmagan");
    }
    const late = isLateSub(s, s.homework.dueAt);
    const first = s.status === "SUBMITTED" || s.score == null;
    const prevScore = s.score;
    const feedback = body.feedback || null;
    const hwTitle = s.homework.title;
    const name = s.student.fullName;

    const result = await prisma.$transaction(async (tx) => {
      const oldGrade = await tx.grade.findUnique({ where: { submissionId: id } });
      const grade = await tx.grade.upsert({
        where: { submissionId: id },
        create: {
          studentId: s.studentId,
          groupId: s.homework.groupId,
          lessonId: s.homework.lessonId,
          submissionId: id,
          kind: "HOMEWORK",
          skill: (s.homework.type === "AUDIO" ? "SPEAKING" : null) as Skill | null,
          value: body.score,
          title: hwTitle,
          comment: feedback,
          givenById: me,
        },
        update: { value: body.score, comment: feedback, givenById: me },
      });
      let coinsNow = 0;
      let coinsTotal = s.coinsAwarded;
      // tanga faqat bir marta: yozuvda allaqachon berilgan bo'lsa ham, unique ref (coinRef) bo'yicha ham
      if (!late && s.coinsAwarded === 0) {
        // idempotent: coinRef.submission — qayta baholashda ikkinchi marta berilmaydi (ON CONFLICT DO NOTHING)
        const t = await awardCoins(tx, {
          studentId: s.studentId,
          reason: "HOMEWORK_ON_TIME",
          groupId: s.homework.groupId,
          ...coinRef.submission(id),
          createdById: me,
          note: hwTitle,
        });
        if (t) coinsNow = t.amount;
        const ct = t ?? (await tx.coinTransaction.findFirst({ where: { studentId: s.studentId, reason: "HOMEWORK_ON_TIME", ...coinRef.submission(id) } }));
        coinsTotal = ct?.amount ?? 0;
      }
      const updated = await tx.submission.update({
        where: { id },
        data: { status: "REVIEWED", score: body.score, feedback, reviewerId: me, reviewedAt: new Date(), coinsAwarded: coinsTotal },
      });

      const changed = !first && prevScore !== body.score;
      if (first || changed) {
        const what = first
          ? `vazifasi tekshirildi: ${gradeText(body.score)}`
          : `vazifasi bahosi oʻzgartirildi: ${prevScore} → ${gradeText(body.score)}`;
        await notify(tx, {
          userId: s.studentId,
          type: "homework.reviewed",
          title: first ? "Vazifangiz tekshirildi" : "Vazifa bahosi oʻzgartirildi",
          body: `“${hwTitle}” ${what}${coinsNow ? `, +${coinsNow} tanga` : ""}${feedback ? `. Izoh: ${feedback.slice(0, 200)}` : ""}`,
          link: STUDENT_LINK(s.homeworkId),
          payload: { submissionId: id, homeworkId: s.homeworkId, score: body.score },
          telegram: false,
        });
        await notifyParents(tx, s.studentId, {
          type: "homework.reviewed",
          title: first ? "Uyga vazifa tekshirildi" : "Vazifa bahosi oʻzgartirildi",
          body: `${name}ning “${hwTitle}” ${what}`,
          link: PARENT_LINK,
          payload: { submissionId: id, homeworkId: s.homeworkId, studentId: s.studentId, score: body.score },
        });
      } else if (feedback && feedback !== s.feedback) {
        await notify(tx, {
          userId: s.studentId,
          type: "homework.feedback",
          title: "Ustoz izohi yangilandi",
          body: `“${hwTitle}”: ${feedback.slice(0, 250)}`,
          link: STUDENT_LINK(s.homeworkId),
          telegram: false,
        });
      }

      if (changed) {
        await writeAudit(tx, {
          ...auditCtx(req),
          action: "grade.update",
          entityType: "Grade",
          entityId: grade.id,
          summary: `${name} — “${hwTitle}” bahosi ${prevScore} → ${body.score}`,
          before: { value: oldGrade?.value ?? prevScore, comment: oldGrade?.comment ?? s.feedback, submissionId: id },
          after: { value: body.score, comment: feedback, submissionId: id },
        });
      } else {
        await writeAudit(tx, {
          ...auditCtx(req),
          action: "submission.review",
          entityType: "Submission",
          entityId: id,
          summary: `${name} — “${hwTitle}”: ${gradeText(body.score)}${late ? " (kechikkan)" : ""}${coinsNow ? `, +${coinsNow} tanga` : ""}`,
          before: first ? { status: s.status } : { status: s.status, score: prevScore, feedback: s.feedback },
          after: { status: "REVIEWED", score: body.score, feedback, gradeId: grade.id, coinsAwarded: coinsTotal, isLate: late },
        });
      }
      return { updated, coinsNow };
    });
    const row = await prisma.submission.findUniqueOrThrow({ where: { id }, include: subInclude });
    return { ...subDto(row, true), coinsAwardedNow: result.coinsNow };
  });

  // Qayta ishlashga qaytarish (o'quvchi qayta topshira oladi)
  app.post("/submissions/:id/return", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(z.object({ feedback: z.string().trim().min(3, "Nimani tuzatish kerakligini yozing").max(2000) }), req.body);
    const me = req.auth.userId;
    await assertTeacherSubmission(me, id);
    const s = await prisma.submission.findUniqueOrThrow({ where: { id }, include: subInclude });
    if (s.status !== "SUBMITTED") {
      throw badRequest(s.status === "REVIEWED" ? "Tekshirilgan topshiriqni qaytarib boʻlmaydi — bahoni oʻzgartiring" : "Faqat tekshiruv kutayotgan topshiriq qaytariladi");
    }
    await prisma.$transaction(async (tx) => {
      await tx.submission.update({
        where: { id },
        data: { status: "RETURNED" satisfies SubmissionStatus, feedback: body.feedback, reviewerId: me, reviewedAt: new Date() },
      });
      await notify(tx, {
        userId: s.studentId,
        type: "homework.returned",
        title: "Vazifa qayta ishlashga qaytarildi",
        body: `“${s.homework.title}”: ${body.feedback.slice(0, 250)}`,
        link: STUDENT_LINK(s.homeworkId),
        payload: { submissionId: id, homeworkId: s.homeworkId },
        telegram: false,
      });
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "submission.return",
        entityType: "Submission",
        entityId: id,
        summary: `${s.student.fullName} — “${s.homework.title}” qayta ishlashga qaytarildi`,
        before: { status: s.status, feedback: s.feedback },
        after: { status: "RETURNED", feedback: body.feedback },
      });
    });
    const row = await prisma.submission.findUniqueOrThrow({ where: { id }, include: subInclude });
    return subDto(row, true);
  });
}
