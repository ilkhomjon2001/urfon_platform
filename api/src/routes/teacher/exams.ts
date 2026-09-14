// Ustoz: Mock imtihonlar. O'z guruhlari imtihonlari (yaratish, tahrirlash, natija kiritish) +
// markaz miqyosidagi imtihonlar (groupId = null) — faqat ko'rish, natijalardan faqat o'z o'quvchilariniki.
import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../db.js";
import { auditCtx, idParam, parse } from "../../lib/http.js";
import { assertTeacherGroup, teacherGroupIds } from "../../lib/access.js";
import { writeAudit } from "../../lib/audit.js";
import { badRequest, conflict, forbidden, notFound } from "../../lib/errors.js";
import { notify, notifyParents } from "../../lib/notify.js";

const EXAM_TYPES = ["MOCK", "MIDTERM", "FINAL", "QUIZ"] as const;
const TYPE_NAME: Record<string, string> = { MOCK: "Mock imtihon", MIDTERM: "Oraliq imtihon", FINAL: "Yakuniy imtihon", QUIZ: "Test" };
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const pad = (n: number) => String(n).padStart(2, "0");
function fmtWhen(d: Date) {
  const t = new Date(d.getTime() + 5 * 3600_000);
  return `${t.getUTCDate()}-${MONTHS[t.getUTCMonth()]}, ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`;
}
const STUDENT_LINK = "/oquvchi";
const PARENT_LINK = "/ota-ona/baholar";

/** IELTS umumiy band: 4 ko'nikma o'rtachasi, eng yaqin 0.5 ga (x.25 → x.5, x.75 → x+1). */
export function ieltsOverall(l: number, r: number, w: number, s: number) {
  const avg = (l + r + w + s) / 4;
  return Math.round(avg * 2 + 1e-9) / 2;
}
const fmtBand = (v: number) => v.toFixed(1);

const zId = z.string().min(1).max(40);
const zBand = z
  .number()
  .min(0, "Band 0 dan 9 gacha")
  .max(9, "Band 0 dan 9 gacha")
  .refine((v) => Number.isInteger(v * 2), "Band 0.5 qadam bilan boʻlsin");

const examBody = z.object({
  groupId: zId,
  title: z.string().trim().min(2, "Nomi kamida 2 belgi").max(200),
  type: z.enum(EXAM_TYPES).default("MOCK"),
  startsAt: z.coerce.date(),
  durationMin: z.coerce.number().int().min(10).max(600).default(180),
  location: z.string().trim().max(200).nullish(),
  description: z.string().trim().max(3000).nullish(),
  notify: z.boolean().default(true),
});

const resultItem = z.object({
  studentId: zId,
  band: zBand.nullish(),
  percent: z.number().int().min(0, "Foiz 0–100").max(100, "Foiz 0–100").nullish(),
  listening: zBand.nullish(),
  reading: zBand.nullish(),
  writing: zBand.nullish(),
  speaking: zBand.nullish(),
  comment: z.string().trim().max(500).nullish(),
});

type ResultRow = { band: number | null; percent: number | null; listening: number | null; reading: number | null; writing: number | null; speaking: number | null; comment: string | null };
const RESULT_KEYS = ["band", "percent", "listening", "reading", "writing", "speaking", "comment"] as const;
const pickResult = (r: ResultRow): ResultRow => Object.fromEntries(RESULT_KEYS.map((k) => [k, r[k] ?? null])) as ResultRow;

function resultText(r: ResultRow) {
  const parts: string[] = [];
  if (r.band != null) {
    const skills = [
      r.listening != null ? `L ${fmtBand(r.listening)}` : null,
      r.reading != null ? `R ${fmtBand(r.reading)}` : null,
      r.writing != null ? `W ${fmtBand(r.writing)}` : null,
      r.speaking != null ? `S ${fmtBand(r.speaking)}` : null,
    ].filter(Boolean);
    parts.push(`Band ${fmtBand(r.band)}${skills.length ? ` (${skills.join(" · ")})` : ""}`);
  }
  if (r.percent != null) parts.push(`${r.percent}%`);
  return parts.join(", ") || "natija kiritildi";
}

const examInclude = { group: { select: { id: true, code: true, name: true, teacherId: true } } } satisfies Prisma.ExamInclude;
type ExamRow = Prisma.ExamGetPayload<{ include: typeof examInclude }>;

/** Ustoz ko'ra oladigan imtihon (o'z guruhi yoki markaz miqyosidagi). Aks holda 404. */
async function visibleExam(teacherId: string, id: string) {
  const e = await prisma.exam.findFirst({
    where: { id, OR: [{ groupId: null }, { group: { teacherId } }] },
    include: examInclude,
  });
  if (!e) throw notFound("Imtihon topilmadi");
  return e;
}
/** Tahrirlash faqat o'z guruhi imtihoni uchun; markaz imtihoni — 403. */
async function editableExam(teacherId: string, id: string) {
  const e = await visibleExam(teacherId, id);
  if (!e.groupId) throw forbidden("Markaz imtihonini faqat administrator tahrirlaydi");
  return e;
}

function examDto(e: ExamRow, extra: { resultsCount: number; candidates: number; avgBand: number | null; avgPercent: number | null }) {
  const endsAt = new Date(e.startsAt.getTime() + e.durationMin * 60_000);
  const { group } = e;
  return {
    id: e.id,
    title: e.title,
    type: e.type,
    startsAt: e.startsAt,
    endsAt,
    durationMin: e.durationMin,
    location: e.location,
    description: e.description,
    group: group ? { id: group.id, code: group.code, name: group.name } : null,
    isCenter: !e.groupId,
    canEdit: !!e.groupId,
    status: endsAt.getTime() < Date.now() ? "past" : e.startsAt.getTime() <= Date.now() ? "ongoing" : "upcoming",
    ...extra,
  };
}

const avg = (xs: number[], digits = 1) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10 ** digits) / 10 ** digits : null);

async function ownStudentIds(teacherId: string) {
  const es = await prisma.groupStudent.findMany({ where: { group: { teacherId }, status: "ACTIVE" }, select: { studentId: true } });
  return new Set(es.map((e) => e.studentId));
}

export default async function exams(app: FastifyInstance) {
  app.get("/exams", async (req) => {
    const q = parse(
      z.object({
        scope: z.enum(["upcoming", "past", "all"]).default("all"),
        groupId: zId.optional(),
        type: z.enum(EXAM_TYPES).optional(),
      }),
      req.query,
    );
    const me = req.auth.userId;
    if (q.groupId) await assertTeacherGroup(me, q.groupId);
    const gids = await teacherGroupIds(me);
    const now = new Date();
    const rows = await prisma.exam.findMany({
      where: {
        ...(q.groupId ? { groupId: q.groupId } : { OR: [{ groupId: null }, { groupId: { in: gids } }] }),
        ...(q.type ? { type: q.type } : {}),
        // "o'tgan" — boshlangan vaqti o'tgan; tugash vaqti DTO'da hisoblanadi
        ...(q.scope === "upcoming" ? { startsAt: { gte: addHours(now, -12) } } : {}),
        ...(q.scope === "past" ? { startsAt: { lt: now } } : {}),
      },
      include: examInclude,
      orderBy: { startsAt: q.scope === "upcoming" ? "asc" : "desc" },
      take: 200,
    });
    const own = await ownStudentIds(me);
    const [results, groupCounts] = await Promise.all([
      prisma.examResult.findMany({ where: { examId: { in: rows.map((r) => r.id) } }, select: { examId: true, studentId: true, band: true, percent: true } }),
      prisma.groupStudent.groupBy({ by: ["groupId"], where: { groupId: { in: gids }, status: "ACTIVE" }, _count: { _all: true } }),
    ]);
    const gc = new Map(groupCounts.map((g) => [g.groupId, g._count._all]));
    const items = rows
      .map((e) => {
        // markaz imtihonida faqat o'z o'quvchilarining natijalari hisobga olinadi
        const rs = results.filter((r) => r.examId === e.id && (e.groupId ? true : own.has(r.studentId)));
        return examDto(e, {
          resultsCount: rs.length,
          candidates: e.groupId ? (gc.get(e.groupId) ?? 0) : own.size,
          avgBand: avg(rs.map((r) => r.band).filter((v): v is number => v != null)),
          avgPercent: avg(rs.map((r) => r.percent).filter((v): v is number => v != null), 0),
        });
      })
      .filter((e) => (q.scope === "upcoming" ? e.status !== "past" : q.scope === "past" ? e.status === "past" : true));
    return items;
  });

  app.get("/exams/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const me = req.auth.userId;
    const e = await visibleExam(me, id);
    // Qatorlar: guruh imtihoni — guruhning faol o'quvchilari (+ natijasi bor, lekin ketganlar);
    // markaz imtihoni — ustozning barcha faol o'quvchilari (faqat ko'rish).
    const enrollWhere: Prisma.GroupStudentWhereInput = e.groupId ? { groupId: e.groupId } : { group: { teacherId: me }, status: "ACTIVE" };
    const [enrolls, results] = await Promise.all([
      prisma.groupStudent.findMany({
        where: enrollWhere,
        select: {
          status: true,
          group: { select: { id: true, code: true, name: true } },
          student: { select: { id: true, fullName: true, studentProfile: { select: { code: true } } } },
        },
        orderBy: { student: { fullName: "asc" } },
      }),
      prisma.examResult.findMany({ where: { examId: id } }),
    ]);
    const rMap = new Map(results.map((r) => [r.studentId, r]));
    const seen = new Set<string>();
    const rows = enrolls
      .filter((en) => {
        if (seen.has(en.student.id)) return false;
        if (e.groupId && en.status !== "ACTIVE" && !rMap.has(en.student.id)) return false;
        seen.add(en.student.id);
        return true;
      })
      .map((en) => {
        const r = rMap.get(en.student.id);
        return {
          student: { id: en.student.id, fullName: en.student.fullName, code: en.student.studentProfile?.code ?? null },
          group: en.group,
          active: en.status === "ACTIVE",
          result: r ? { ...pickResult(r), updatedAt: r.createdAt } : null,
        };
      });
    const rs = rows.map((r) => r.result).filter((r): r is NonNullable<typeof r> => !!r);
    return {
      ...examDto(e, {
        resultsCount: rs.length,
        candidates: rows.filter((r) => r.active).length,
        avgBand: avg(rs.map((r) => r.band).filter((v): v is number => v != null)),
        avgPercent: avg(rs.map((r) => r.percent).filter((v): v is number => v != null), 0),
      }),
      rows,
    };
  });

  app.post("/exams", async (req, reply) => {
    const body = parse(examBody, req.body);
    const me = req.auth.userId;
    const group = await assertTeacherGroup(me, body.groupId);
    const exam = await prisma.$transaction(async (tx) => {
      const e = await tx.exam.create({
        data: {
          groupId: body.groupId,
          title: body.title,
          type: body.type,
          startsAt: body.startsAt,
          durationMin: body.durationMin,
          location: body.location || null,
          description: body.description || null,
          createdById: me,
        },
      });
      if (body.notify && body.startsAt.getTime() > Date.now()) {
        const students = await tx.groupStudent.findMany({
          where: { groupId: body.groupId, status: "ACTIVE" },
          select: { student: { select: { id: true, fullName: true } } },
        });
        const when = `${fmtWhen(body.startsAt)}${body.location ? `, ${body.location}` : ""}`;
        for (const { student } of students) {
          await notify(tx, {
            userId: student.id,
            type: "exam.scheduled",
            title: `${TYPE_NAME[body.type]} rejalashtirildi`,
            body: `“${body.title}” — ${when}`,
            link: STUDENT_LINK,
            payload: { examId: e.id },
            telegram: false,
          });
          await notifyParents(tx, student.id, {
            type: "exam.scheduled",
            title: `${TYPE_NAME[body.type]} rejalashtirildi`,
            body: `${student.fullName}: “${body.title}” — ${when}`,
            link: PARENT_LINK,
            payload: { examId: e.id, studentId: student.id },
          });
        }
      }
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "exam.create",
        entityType: "Exam",
        entityId: e.id,
        summary: `${group.name}: “${e.title}” (${TYPE_NAME[e.type]}) — ${fmtWhen(e.startsAt)}`,
        after: { groupId: e.groupId, title: e.title, type: e.type, startsAt: e.startsAt, durationMin: e.durationMin, location: e.location },
      });
      return e;
    });
    reply.code(201);
    const row = await prisma.exam.findUniqueOrThrow({ where: { id: exam.id }, include: examInclude });
    return examDto(row, { resultsCount: 0, candidates: 0, avgBand: null, avgPercent: null });
  });

  app.put("/exams/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(examBody.omit({ groupId: true, notify: true }).partial(), req.body);
    const me = req.auth.userId;
    const old = await editableExam(me, id);
    const data: Prisma.ExamUncheckedUpdateInput = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.type !== undefined) data.type = body.type;
    if (body.startsAt !== undefined) data.startsAt = body.startsAt;
    if (body.durationMin !== undefined) data.durationMin = body.durationMin;
    if (body.location !== undefined) data.location = body.location || null;
    if (body.description !== undefined) data.description = body.description || null;
    const moved = body.startsAt && body.startsAt.getTime() !== old.startsAt.getTime();
    await prisma.$transaction(async (tx) => {
      const e = await tx.exam.update({ where: { id }, data });
      if (moved && e.startsAt.getTime() > Date.now()) {
        const students = await tx.groupStudent.findMany({ where: { groupId: old.groupId!, status: "ACTIVE" }, select: { student: { select: { id: true, fullName: true } } } });
        for (const { student } of students) {
          await notify(tx, { userId: student.id, type: "exam.updated", title: "Imtihon vaqti oʻzgardi", body: `“${e.title}” — ${fmtWhen(e.startsAt)}`, link: STUDENT_LINK, telegram: false });
          await notifyParents(tx, student.id, { type: "exam.updated", title: "Imtihon vaqti oʻzgardi", body: `${student.fullName}: “${e.title}” — yangi vaqt ${fmtWhen(e.startsAt)}`, link: PARENT_LINK });
        }
      }
      const pick = (o: Record<string, unknown>) => Object.fromEntries(Object.keys(data).map((k) => [k, o[k]]));
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "exam.update",
        entityType: "Exam",
        entityId: id,
        summary: `“${e.title}” imtihoni tahrirlandi`,
        before: pick(old as unknown as Record<string, unknown>),
        after: pick(e as unknown as Record<string, unknown>),
      });
    });
    const row = await prisma.exam.findUniqueOrThrow({ where: { id }, include: examInclude });
    const count = await prisma.examResult.count({ where: { examId: id } });
    return examDto(row, { resultsCount: count, candidates: 0, avgBand: null, avgPercent: null });
  });

  app.delete("/exams/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const e = await editableExam(req.auth.userId, id);
    const n = await prisma.examResult.count({ where: { examId: id } });
    if (n) throw conflict("Natijalar kiritilgan imtihonni oʻchirib boʻlmaydi");
    await prisma.$transaction(async (tx) => {
      await tx.exam.delete({ where: { id } });
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "exam.delete",
        entityType: "Exam",
        entityId: id,
        summary: `“${e.title}” imtihoni oʻchirildi`,
        before: { groupId: e.groupId, title: e.title, type: e.type, startsAt: e.startsAt },
      });
    });
    return { ok: true };
  });

  // Natijalar: faqat shu guruh o'quvchilari; band 0–9 (0.5 qadam), foiz 0–100.
  // 4 ko'nikma to'liq bo'lsa umumiy band avtomatik (IELTS yaxlitlash). Bo'sh qator — natijani o'chiradi.
  app.put("/exams/:id/results", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(z.object({ items: z.array(resultItem).min(1).max(200), notify: z.boolean().default(true) }), req.body);
    const me = req.auth.userId;
    const exam = await editableExam(me, id);
    const ids = body.items.map((i) => i.studentId);
    if (new Set(ids).size !== ids.length) throw badRequest("Oʻquvchi takrorlangan");
    const enrolled = await prisma.groupStudent.findMany({
      where: { groupId: exam.groupId!, studentId: { in: ids } },
      select: { student: { select: { id: true, fullName: true } } },
    });
    if (enrolled.length !== ids.length) throw notFound("Oʻquvchi topilmadi");
    const names = new Map(enrolled.map((e) => [e.student.id, e.student.fullName]));

    const normalized = body.items.map((i) => {
      const r: ResultRow = {
        band: i.band ?? null,
        percent: i.percent ?? null,
        listening: i.listening ?? null,
        reading: i.reading ?? null,
        writing: i.writing ?? null,
        speaking: i.speaking ?? null,
        comment: i.comment || null,
      };
      if (r.listening != null && r.reading != null && r.writing != null && r.speaking != null) {
        r.band = ieltsOverall(r.listening, r.reading, r.writing, r.speaking);
      }
      const empty = RESULT_KEYS.every((k) => r[k] == null);
      return { studentId: i.studentId, r, empty };
    });

    const changes = await prisma.$transaction(async (tx) => {
      const existing = await tx.examResult.findMany({ where: { examId: id, studentId: { in: ids } } });
      const exMap = new Map(existing.map((e) => [e.studentId, e]));
      const out: { studentId: string; before: ResultRow | null; after: ResultRow | null }[] = [];
      for (const n of normalized) {
        const old = exMap.get(n.studentId);
        const before = old ? pickResult(old) : null;
        if (n.empty) {
          if (old) {
            await tx.examResult.delete({ where: { id: old.id } });
            out.push({ studentId: n.studentId, before, after: null });
          }
          continue;
        }
        if (before && RESULT_KEYS.every((k) => before[k] === n.r[k])) continue; // o'zgarmagan
        await tx.examResult.upsert({
          where: { examId_studentId: { examId: id, studentId: n.studentId } },
          create: { examId: id, studentId: n.studentId, ...n.r },
          update: n.r,
        });
        out.push({ studentId: n.studentId, before, after: n.r });
        if (body.notify) {
          const name = names.get(n.studentId)!;
          const text = resultText(n.r);
          await notify(tx, {
            userId: n.studentId,
            type: "exam.result",
            title: before ? "Imtihon natijasi yangilandi" : "Imtihon natijasi",
            body: `“${exam.title}”: ${text}`,
            link: STUDENT_LINK,
            payload: { examId: id },
            telegram: false,
          });
          await notifyParents(tx, n.studentId, {
            type: "exam.result",
            title: before ? "Imtihon natijasi yangilandi" : "Imtihon natijasi",
            body: `${name} — “${exam.title}”: ${text}`,
            link: PARENT_LINK,
            payload: { examId: id, studentId: n.studentId },
          });
        }
      }
      if (out.length) {
        await writeAudit(tx, {
          ...auditCtx(req),
          action: "exam.results",
          entityType: "Exam",
          entityId: id,
          summary: `“${exam.title}”: ${out.length} ta oʻquvchi natijasi kiritildi`,
          before: out.map((o) => ({ studentId: o.studentId, ...(o.before ?? {}) })),
          after: out.map((o) => ({ studentId: o.studentId, ...(o.after ?? { deleted: true }) })),
        });
      }
      return out;
    });
    return { saved: changes.filter((c) => c.after).length, removed: changes.filter((c) => !c.after).length, unchanged: normalized.length - changes.length };
  });
}

function addHours(d: Date, h: number) {
  return new Date(d.getTime() + h * 3_600_000);
}
