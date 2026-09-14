// /api/student/homework — o'quvchining uyga vazifalari: ro'yxat, tafsilot, qoralama, fayllar, topshirish.
// Tanga topshirishda BERILMAYDI: ustoz tekshirganda (o'z vaqtida bo'lsa) teacher/homework.ts awardCoins qiladi.
import type { FastifyInstance } from "fastify";
import { Prisma, type SubmissionStatus } from "@prisma/client";
import { z } from "zod";
import { prisma, type Db } from "../../db.js";
import { GAMIFICATION } from "../../config/gamification.js";
import { writeAudit } from "../../lib/audit.js";
import { touchStreak } from "../../lib/coins.js";
import { dbDateYmd, ymdTz } from "../../lib/dates.js";
import { badRequest, conflict, notFound } from "../../lib/errors.js";
import { auditCtx, idParam, parse } from "../../lib/http.js";
import { notify } from "../../lib/notify.js";
import { attachFiles, deleteStored } from "../../lib/storage.js";
import {
  HOMEWORK_TYPE_LABEL,
  HW_STATE_LABEL,
  accessIds,
  activeIds,
  assertStudentHomework,
  fileSel,
  gradeLabel,
  hwState,
  isOpenState,
  myEnrollments,
  normalizeContent,
  topicLabel,
} from "./shared.js";

const MAX_FILES = 10;

const listQuery = z.object({ status: z.enum(["open", "done", "all"]).default("open") });

const answerValue = z.union([z.string().max(2000), z.number().int().min(0).max(1000)]);
const draftBody = z.object({
  text: z.string().max(5000, "Matn 5 000 belgidan oshmasin").nullable().optional(),
  answers: z.record(z.string().min(1).max(40), answerValue).nullable().optional(),
  fileIds: z.array(z.string().min(1).max(40)).max(MAX_FILES).optional(),
});
type DraftBody = z.infer<typeof draftBody>;

const fileParams = z.object({ id: z.string().min(1).max(40), fileId: z.string().min(1).max(40) });

const subInclude = {
  files: { select: fileSel, orderBy: { createdAt: "asc" } },
  reviewer: { select: { id: true, fullName: true } },
} satisfies Prisma.SubmissionInclude;

type SubRow = Prisma.SubmissionGetPayload<{ include: typeof subInclude }>;

async function coinsFor(db: Db, studentId: string, submissionId: string) {
  const agg = await db.coinTransaction.aggregate({
    where: { studentId, refType: "submission", refId: submissionId, amount: { gt: 0 } },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

function subDto(s: SubRow, coinsReceived: number) {
  return {
    id: s.id,
    status: s.status,
    text: s.text,
    answers: (s.answers ?? null) as Record<string, string | number> | null,
    files: s.files,
    submittedAt: s.submittedAt,
    isLate: s.isLate,
    reviewedAt: s.reviewedAt,
    reviewer: s.reviewer,
    score: s.score,
    scoreLabel: gradeLabel(s.score),
    feedback: s.feedback,
    coinsAwarded: Math.max(s.coinsAwarded, coinsReceived),
    updatedAt: s.updatedAt,
  };
}

/** QUIZ javoblari: kalit — savol id'si, variantli savolda qiymat — variant indeksi. */
function checkAnswers(answers: Record<string, string | number>, questions: { id: string; options: string[] | null }[]) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  for (const [k, v] of Object.entries(answers)) {
    const q = byId.get(k);
    if (!q) throw badRequest("Javob notoʻgʻri savolga berilgan");
    if (q.options) {
      const idx = typeof v === "number" ? v : Number.NaN;
      if (!Number.isInteger(idx) || idx < 0 || idx >= q.options.length) throw badRequest("Javob variantlardan birini tanlang");
    }
  }
}

export default async function homework(app: FastifyInstance) {
  // ── Ro'yxat ──
  app.get("/homework", async (req) => {
    const { status } = parse(listQuery, req.query);
    const studentId = req.auth.userId;
    const es = await myEnrollments(studentId);
    const active = new Set(activeIds(es));
    const rows = await prisma.homework.findMany({
      where: { groupId: { in: accessIds(es) } },
      orderBy: { dueAt: "desc" },
      take: 400,
      include: {
        group: { select: { id: true, name: true } },
        topic: { select: { id: true, unit: true, title: true } },
        lesson: { select: { id: true, title: true, startsAt: true } },
        submissions: {
          where: { studentId },
          select: { id: true, status: true, submittedAt: true, isLate: true, reviewedAt: true, score: true, feedback: true, coinsAwarded: true, updatedAt: true, _count: { select: { files: true } }, text: true },
        },
      },
    });
    const now = new Date();
    const items = rows.map((h) => {
      const sub = h.submissions[0] ?? null;
      const state = hwState(sub);
      return {
        id: h.id,
        title: h.title,
        description: h.description,
        type: h.type,
        typeLabel: HOMEWORK_TYPE_LABEL[h.type],
        dueAt: h.dueAt,
        createdAt: h.createdAt,
        group: h.group,
        topic: h.topic ? { id: h.topic.id, unit: h.topic.unit, label: topicLabel(h.topic) } : null,
        lesson: h.lesson,
        coinReward: GAMIFICATION.coins.HOMEWORK_ON_TIME,
        state,
        stateLabel: HW_STATE_LABEL[state],
        open: isOpenState(state) && active.has(h.groupId),
        overdue: isOpenState(state) && h.dueAt < now,
        submission: sub
          ? {
              id: sub.id, status: sub.status, submittedAt: sub.submittedAt, isLate: sub.isLate, reviewedAt: sub.reviewedAt,
              score: sub.score, scoreLabel: gradeLabel(sub.score), feedback: sub.feedback, coinsAwarded: sub.coinsAwarded,
              fileCount: sub._count.files, hasText: !!sub.text?.trim(), updatedAt: sub.updatedAt,
            }
          : null,
      };
    });
    const openItems = items.filter((i) => i.open).sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt));
    const doneItems = items
      .filter((i) => i.state === "SUBMITTED" || i.state === "REVIEWED")
      .sort((a, b) => +new Date(b.submission?.submittedAt ?? b.dueAt) - +new Date(a.submission?.submittedAt ?? a.dueAt));
    const list = status === "open" ? openItems : status === "done" ? doneItems : items;
    return {
      items: list,
      counts: { open: openItems.length, done: doneItems.length, all: items.length },
      coinReward: GAMIFICATION.coins.HOMEWORK_ON_TIME,
      now,
    };
  });

  // ── Tafsilot ──
  app.get("/homework/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const studentId = req.auth.userId;
    const hw = await assertStudentHomework(studentId, id);
    const [full, sub, profile] = await Promise.all([
      prisma.homework.findUniqueOrThrow({
        where: { id },
        include: {
          files: { select: fileSel, orderBy: { createdAt: "asc" } },
          createdBy: { select: { id: true, fullName: true, title: true, avatarUrl: true, role: true, teacherProfile: { select: { specialization: true, responseTime: true } } } },
          group: {
            select: {
              teacher: { select: { id: true, fullName: true, title: true, avatarUrl: true, teacherProfile: { select: { specialization: true, responseTime: true } } } },
            },
          },
        },
      }),
      prisma.submission.findUnique({ where: { homeworkId_studentId: { homeworkId: id, studentId } }, include: subInclude }),
      prisma.studentProfile.findUnique({ where: { userId: studentId }, select: { streakDays: true, lastStreakDate: true } }),
    ]);
    const now = new Date();
    const state = hwState(sub);
    const enrolledActive = hw.group.students.some((s) => s.status === "ACTIVE");
    const content = normalizeContent(full.content, hw.type, {
      revealAnswers: state === "REVIEWED" && hw.dueAt < now,
      topicVocabulary: hw.topic?.vocabulary,
    });

    const lessonMaterials = hw.lessonId
      ? await prisma.material.findMany({
          where: { lessonId: hw.lessonId, OR: [{ groupId: hw.groupId }, { groupId: null }] },
          orderBy: { createdAt: "asc" },
          select: { id: true, title: true, type: true, url: true, description: true, file: { select: fileSel } },
        })
      : [];

    const previous = await prisma.submission.findFirst({
      where: { studentId, status: "REVIEWED", homeworkId: { not: id }, homework: { groupId: hw.groupId } },
      orderBy: { reviewedAt: "desc" },
      select: {
        score: true, feedback: true, reviewedAt: true, coinsAwarded: true,
        homework: { select: { id: true, title: true, topic: { select: { unit: true, title: true } } } },
      },
    });

    const t = full.group.teacher ?? (full.createdBy.role === "TEACHER" ? full.createdBy : null);
    return {
      id: hw.id,
      title: hw.title,
      description: hw.description,
      type: hw.type,
      typeLabel: HOMEWORK_TYPE_LABEL[hw.type],
      dueAt: hw.dueAt,
      createdAt: hw.createdAt,
      now,
      group: { id: hw.group.id, name: hw.group.name },
      topic: hw.topic ? { id: hw.topic.id, unit: hw.topic.unit, label: topicLabel(hw.topic) } : null,
      lesson: hw.lesson,
      teacher: t
        ? { id: t.id, fullName: t.fullName, title: t.title, avatarUrl: t.avatarUrl, specialization: t.teacherProfile?.specialization ?? null, responseTime: t.teacherProfile?.responseTime ?? null }
        : null,
      content,
      requirements: {
        needsFile: hw.type === "AUDIO" || hw.type === "FILE",
        needsAudio: hw.type === "AUDIO",
        needsText: hw.type === "TEXT",
        needsAnswers: hw.type === "QUIZ",
        questionCount: content.questions.length,
        maxFiles: MAX_FILES,
      },
      attachments: full.files,
      lessonMaterials,
      reward: { onTime: GAMIFICATION.coins.HOMEWORK_ON_TIME, streak: GAMIFICATION.coins.STREAK },
      state,
      stateLabel: HW_STATE_LABEL[state],
      overdue: isOpenState(state) && hw.dueAt < now,
      canEdit: enrolledActive && isOpenState(state),
      submission: sub ? subDto(sub, await coinsFor(prisma, studentId, sub.id)) : null,
      previous: previous
        ? {
            homework: { id: previous.homework.id, title: previous.homework.title, topic: topicLabel(previous.homework.topic) },
            score: previous.score, scoreLabel: gradeLabel(previous.score), feedback: previous.feedback, reviewedAt: previous.reviewedAt,
          }
        : null,
      streak: {
        days: profile?.streakDays ?? 0,
        activeToday: !!profile?.lastStreakDate && dbDateYmd(profile.lastStreakDate) === ymdTz(now),
        bonus: GAMIFICATION.coins.STREAK,
      },
    };
  });

  /** Qoralamaga yozish (tranzaksiya ichida). Topshirilgan/tekshirilgan bo'lsa 409. */
  async function applyDraft(tx: Prisma.TransactionClient, hw: Awaited<ReturnType<typeof assertStudentHomework>>, studentId: string, body: DraftBody) {
    if (!hw.group.students.some((s) => s.status === "ACTIVE")) throw notFound("Vazifa topilmadi");
    const existing = await tx.submission.findUnique({ where: { homeworkId_studentId: { homeworkId: hw.id, studentId } }, include: { _count: { select: { files: true } } } });
    if (existing?.status === "SUBMITTED") throw conflict("Vazifa allaqachon topshirilgan — ustoz tekshiruvini kuting", "ALREADY_SUBMITTED");
    if (existing?.status === "REVIEWED") throw conflict("Vazifa tekshirilgan — endi oʻzgartirib boʻlmaydi", "ALREADY_REVIEWED");

    if (body.answers) {
      const { questions } = normalizeContent((await tx.homework.findUniqueOrThrow({ where: { id: hw.id }, select: { content: true } })).content, hw.type);
      checkAnswers(body.answers, questions);
    }
    const data: Prisma.SubmissionUpdateInput = {};
    if (body.text !== undefined) data.text = body.text?.trim() ? body.text : null;
    if (body.answers !== undefined) data.answers = body.answers === null ? Prisma.DbNull : body.answers;

    const sub = existing
      ? Object.keys(data).length
        ? await tx.submission.update({ where: { id: existing.id }, data })
        : existing
      : await tx.submission.create({
          data: {
            homeworkId: hw.id, studentId, status: "DRAFT",
            text: body.text?.trim() ? body.text : null,
            answers: body.answers ? body.answers : undefined,
          },
        });
    const fileIds = [...new Set(body.fileIds ?? [])];
    if (fileIds.length) {
      const have = existing?._count.files ?? 0;
      if (have + fileIds.length > MAX_FILES) throw badRequest(`Koʻpi bilan ${MAX_FILES} ta fayl biriktirish mumkin`);
      await attachFiles(tx, fileIds, studentId, { submissionId: sub.id });
    }
    return { sub, before: existing?.status ?? null };
  }

  // ── Qoralama (autosave) ──
  app.put("/homework/:id/draft", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(draftBody, req.body ?? {});
    const studentId = req.auth.userId;
    const hw = await assertStudentHomework(studentId, id);
    const subId = await prisma.$transaction(async (tx) => (await applyDraft(tx, hw, studentId, body)).sub.id);
    const sub = await prisma.submission.findUniqueOrThrow({ where: { id: subId }, include: subInclude });
    return { submission: subDto(sub, 0), state: sub.status, stateLabel: HW_STATE_LABEL[sub.status] };
  });

  // ── Qoralamadagi o'z faylini o'chirish ──
  app.delete("/homework/:id/files/:fileId", async (req) => {
    const { id, fileId } = parse(fileParams, req.params);
    const studentId = req.auth.userId;
    await assertStudentHomework(studentId, id);
    const f = await prisma.file.findFirst({
      where: { id: fileId, uploadedById: studentId, submission: { homeworkId: id, studentId } },
      include: { submission: { select: { status: true } } },
    });
    if (!f) throw notFound("Fayl topilmadi");
    if (f.submission && !(["DRAFT", "RETURNED"] as SubmissionStatus[]).includes(f.submission.status)) {
      throw conflict("Topshirilgan vazifadagi faylni oʻchirib boʻlmaydi");
    }
    await prisma.file.delete({ where: { id: f.id } });
    await deleteStored(f);
    return { ok: true };
  });

  // ── Topshirish ──
  app.post("/homework/:id/submit", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(draftBody, req.body ?? {});
    const { userId: studentId, fullName } = req.auth;
    const hw = await assertStudentHomework(studentId, id);
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const { sub, before } = await applyDraft(tx, hw, studentId, body);
      const cur = await tx.submission.findUniqueOrThrow({ where: { id: sub.id }, include: { _count: { select: { files: true } }, files: { select: { mime: true } } } });

      // Tur bo'yicha majburiy kontent
      if (hw.type === "AUDIO" && cur._count.files < 1) throw badRequest("Topshirishdan oldin audio yozib oling yoki audio faylni yuklang", "CONTENT_REQUIRED");
      if (hw.type === "FILE" && cur._count.files < 1) throw badRequest("Topshirishdan oldin kamida bitta fayl yuklang", "CONTENT_REQUIRED");
      if (hw.type === "TEXT" && !cur.text?.trim()) throw badRequest("Topshirishdan oldin javob matnini yozing", "CONTENT_REQUIRED");
      if (hw.type === "QUIZ") {
        const { questions } = normalizeContent((await tx.homework.findUniqueOrThrow({ where: { id }, select: { content: true } })).content, "QUIZ");
        const answers = (cur.answers ?? {}) as Record<string, unknown>;
        const answered = questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== null && String(answers[q.id]).trim() !== "").length;
        if (!questions.length) throw badRequest("Bu testda savollar yoʻq — ustozga murojaat qiling");
        if (answered < questions.length) throw badRequest(`Barcha savollarga javob bering (${questions.length} tadan ${answered} tasi belgilangan)`, "CONTENT_REQUIRED");
      }

      const isLate = now > hw.dueAt;
      const upd = await tx.submission.updateMany({
        where: { id: sub.id, status: { in: ["DRAFT", "RETURNED"] } },
        data: { status: "SUBMITTED", submittedAt: now, isLate },
      });
      if (upd.count !== 1) throw conflict("Vazifa allaqachon topshirilgan", "ALREADY_SUBMITTED");

      await touchStreak(tx, studentId, now); // idempotent, tranzaksiya ichida xavfsiz (lib/coins.ts)

      const teacherId = hw.group.teacherId ?? hw.createdById;
      if (teacherId) {
        await notify(tx, {
          userId: teacherId,
          type: "homework.submitted",
          title: `${fullName} vazifani topshirdi`,
          body: `${hw.title} · ${hw.group.name}${isLate ? " · muddatidan keyin" : ""}${before === "RETURNED" ? " · qayta topshirildi" : ""}`,
          link: `/ustoz/vazifalar?homeworkId=${hw.id}`,
          telegram: false, // har bir topshiriq uchun Telegram — ortiqcha; qoʻngʻiroqchada koʻrinadi
        });
      }
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "homework.submit",
        entityType: "Submission",
        entityId: sub.id,
        summary: `${fullName} «${hw.title}» vazifasini topshirdi${isLate ? " (muddatidan keyin)" : ""}`,
        before: { status: before ?? "DRAFT" },
        after: { status: "SUBMITTED", isLate },
      });
      return { subId: sub.id, isLate };
    });

    const [sub, profile] = await Promise.all([
      prisma.submission.findUniqueOrThrow({ where: { id: result.subId }, include: subInclude }),
      prisma.studentProfile.findUnique({ where: { userId: studentId }, select: { streakDays: true, coinBalance: true } }),
    ]);
    return {
      submission: subDto(sub, 0),
      state: sub.status,
      stateLabel: HW_STATE_LABEL[sub.status],
      // Tanga ustoz tekshirgandan keyin beriladi (faqat o'z vaqtida topshirilgan bo'lsa)
      expectedCoins: result.isLate ? 0 : GAMIFICATION.coins.HOMEWORK_ON_TIME,
      streakDays: profile?.streakDays ?? 0,
      coinBalance: profile?.coinBalance ?? 0,
    };
  });
}
