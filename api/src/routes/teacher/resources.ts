// Ustoz: resurslar bazasi (Material). Umumiy baza (groupId = null) — barcha ustozlarga ko'rinadi;
// guruh materiallari — faqat o'z guruhlari. O'chirish — faqat o'zi yuklagan materialni.
//
// "Guruhga ulashish" qarori: Material.fileId @unique va fayl ruxsati materialning guruhiga qarab
// tekshiriladi (canAccessFile). Shuning uchun guruhga ulashganda YANGI Material yozuvi yaratiladi va
// fayl diskda nusxalanadi (yangi File). Natija: nusxaning o'z hayoti bor (asl material o'chirilsa ham
// guruhdagi nusxa ishlaydi), o'quvchi/ota-ona ruxsati guruh bo'yicha to'g'ri ishlaydi. LINK turi — url nusxalanadi.
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import type { MaterialType, Prisma } from "@prisma/client";
import { z } from "zod";
import { config } from "../../config.js";
import { prisma } from "../../db.js";
import { auditCtx, idParam, paged, paginate, parse } from "../../lib/http.js";
import { assertTeacherGroup, assertTeacherLesson, teacherGroupIds } from "../../lib/access.js";
import { writeAudit } from "../../lib/audit.js";
import { badRequest, conflict, forbidden, notFound } from "../../lib/errors.js";
import { notify } from "../../lib/notify.js";
import { deleteStored, saveBuffer } from "../../lib/storage.js";

const MAT_TYPES = ["PDF", "AUDIO", "VIDEO", "DOC", "IMAGE", "LINK"] as const;
const zId = z.string().min(1).max(40);
const STUDENT_LINK = "/oquvchi/materiallar";

export function typeFromMime(mime: string): MaterialType {
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("audio/")) return "AUDIO";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("image/")) return "IMAGE";
  return "DOC";
}

const matInclude = {
  file: { select: { id: true, originalName: true, mime: true, size: true } },
  topic: { select: { id: true, unit: true, title: true, levelId: true } },
  group: { select: { id: true, code: true, name: true } },
  lesson: { select: { id: true, title: true, number: true, startsAt: true } },
  uploadedBy: { select: { id: true, fullName: true } },
} satisfies Prisma.MaterialInclude;
type MatRow = Prisma.MaterialGetPayload<{ include: typeof matInclude }>;

async function levelMap(ids: (string | null | undefined)[]) {
  const uniq = [...new Set(ids.filter(Boolean))] as string[];
  if (!uniq.length) return new Map<string, { id: string; code: string; name: string }>();
  const ls = await prisma.level.findMany({ where: { id: { in: uniq } }, select: { id: true, code: true, name: true } });
  return new Map(ls.map((l) => [l.id, l]));
}

function matDto(m: MatRow, me: string, levels: Awaited<ReturnType<typeof levelMap>>) {
  const levelId = m.levelId ?? m.topic?.levelId ?? null;
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    type: m.type,
    url: m.url,
    file: m.file,
    level: levelId ? (levels.get(levelId) ?? null) : null,
    topic: m.topic ? { id: m.topic.id, unit: m.topic.unit, title: m.topic.title } : null,
    group: m.group,
    lesson: m.lesson,
    uploadedBy: m.uploadedBy,
    downloads: m.downloads,
    createdAt: m.createdAt,
    scope: m.groupId ? ("group" as const) : ("library" as const),
    mine: m.uploadedById === me,
  };
}

/** Ustoz ko'ra oladigan materiallar: umumiy baza + o'z guruhlari. */
const visibleWhere = (gids: string[]): Prisma.MaterialWhereInput => ({ OR: [{ groupId: null }, { groupId: { in: gids } }] });

async function visibleMaterial(me: string, id: string) {
  const gids = await teacherGroupIds(me);
  const m = await prisma.material.findFirst({ where: { id, ...visibleWhere(gids) }, include: matInclude });
  if (!m) throw notFound("Material topilmadi");
  return m;
}

const createBody = z.object({
  title: z.string().trim().min(2, "Nomi kamida 2 belgi").max(200),
  type: z.enum(MAT_TYPES).optional(),
  fileId: zId.nullish(),
  url: z.string().trim().url("Havola notoʻgʻri").max(1000).refine((u) => /^https?:\/\//i.test(u), "Havola http(s) bilan boshlansin").nullish(),
  groupId: zId.nullish(),
  lessonId: zId.nullish(),
  topicId: zId.nullish(),
  levelId: zId.nullish(),
  description: z.string().trim().max(2000).nullish(),
  notify: z.boolean().default(false), // guruh materiali bo'lsa o'quvchilarga bildirishnoma
  note: z.string().trim().max(300).nullish(),
});

async function notifyGroupStudents(tx: Prisma.TransactionClient, groupId: string, title: string, note?: string | null) {
  const students = await tx.groupStudent.findMany({ where: { groupId, status: "ACTIVE" }, select: { studentId: true } });
  for (const s of students) {
    await notify(tx, {
      userId: s.studentId,
      type: "material.new",
      title: "Yangi oʻquv materiali",
      body: `${title}${note ? ` — ${note}` : ""}`,
      link: STUDENT_LINK,
    });
  }
  return students.length;
}

export default async function resources(app: FastifyInstance) {
  app.get("/materials", async (req) => {
    const q = parse(
      z.object({
        scope: z.enum(["library", "group", "all"]).default("all"),
        groupId: zId.optional(),
        type: z.enum(MAT_TYPES).optional(),
        levelId: zId.optional(),
        topicId: zId.optional(),
        lessonId: zId.optional(),
        mine: z.enum(["1", "0"]).optional(),
        q: z.string().trim().max(100).optional(),
        sort: z.enum(["new", "popular", "name"]).default("new"),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
      }),
      req.query,
    );
    const me = req.auth.userId;
    const gids = await teacherGroupIds(me);
    if (q.groupId) await assertTeacherGroup(me, q.groupId);
    if (q.lessonId) await assertTeacherLesson(me, q.lessonId);
    const scopeWhere: Prisma.MaterialWhereInput = q.groupId
      ? { groupId: q.groupId }
      : q.scope === "library"
        ? { groupId: null }
        : q.scope === "group"
          ? { groupId: { in: gids } }
          : visibleWhere(gids);
    const filters: Prisma.MaterialWhereInput[] = [
      scopeWhere,
      ...(q.levelId ? [{ OR: [{ levelId: q.levelId }, { topic: { levelId: q.levelId } }] }] : []),
      ...(q.topicId ? [{ topicId: q.topicId }] : []),
      ...(q.lessonId ? [{ lessonId: q.lessonId }] : []),
      ...(q.mine === "1" ? [{ uploadedById: me }] : []),
      ...(q.q
        ? [
            {
              OR: [
                { title: { contains: q.q, mode: "insensitive" as const } },
                { description: { contains: q.q, mode: "insensitive" as const } },
                { file: { originalName: { contains: q.q, mode: "insensitive" as const } } },
                { topic: { title: { contains: q.q, mode: "insensitive" as const } } },
              ],
            },
          ]
        : []),
    ];
    const whereNoType: Prisma.MaterialWhereInput = { AND: filters };
    const where: Prisma.MaterialWhereInput = { AND: [...filters, ...(q.type ? [{ type: q.type }] : [])] };
    const orderBy: Prisma.MaterialOrderByWithRelationInput[] =
      q.sort === "popular" ? [{ downloads: "desc" }, { createdAt: "desc" }] : q.sort === "name" ? [{ title: "asc" }] : [{ createdAt: "desc" }, { id: "desc" }];
    const [rows, total, typeGroups] = await Promise.all([
      prisma.material.findMany({ where, include: matInclude, orderBy, ...paginate(q) }),
      prisma.material.count({ where }),
      prisma.material.groupBy({ by: ["type"], where: whereNoType, _count: { _all: true } }),
    ]);
    const levels = await levelMap(rows.flatMap((r) => [r.levelId, r.topic?.levelId]));
    const types: Record<string, number> = {};
    for (const t of typeGroups) types[t.type] = t._count._all;
    return { ...paged(rows.map((m) => matDto(m, me, levels)), total, q), types };
  });

  // Yuklash oynasi uchun: Level'lar, mavzular, o'z guruhlari
  app.get("/materials/options", async (req) => {
    const [levels, topics, groups] = await Promise.all([
      prisma.level.findMany({ orderBy: { order: "asc" }, select: { id: true, code: true, name: true } }),
      prisma.topic.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ levelId: "asc" }, { unit: "asc" }], select: { id: true, unit: true, title: true, levelId: true } }),
      prisma.group.findMany({ where: { teacherId: req.auth.userId }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true, levelId: true } }),
    ]);
    return { levels, topics, groups };
  });

  // Yuqoridagi kartalar, "Level bo'yicha to'plamlar", xotira taqsimoti, so'nggi yuklanganlar
  app.get("/materials/stats", async (req) => {
    const me = req.auth.userId;
    const gids = await teacherGroupIds(me);
    const all = await prisma.material.findMany({
      where: visibleWhere(gids),
      select: {
        id: true, title: true, type: true, groupId: true, levelId: true, downloads: true, uploadedById: true, createdAt: true,
        topic: { select: { levelId: true } },
        file: { select: { size: true } },
      },
    });
    const levels = await levelMap(all.flatMap((m) => [m.levelId, m.topic?.levelId]));
    const byType = new Map<string, { type: string; count: number; size: number }>();
    const byLevel = new Map<string, { level: { id: string; code: string; name: string }; count: number; size: number }>();
    let totalSize = 0;
    for (const m of all) {
      const size = m.file?.size ?? 0;
      totalSize += size;
      const t = byType.get(m.type) ?? { type: m.type, count: 0, size: 0 };
      t.count++;
      t.size += size;
      byType.set(m.type, t);
      const lid = m.levelId ?? m.topic?.levelId;
      const lv = lid ? levels.get(lid) : null;
      if (lv) {
        const l = byLevel.get(lv.id) ?? { level: lv, count: 0, size: 0 };
        l.count++;
        l.size += size;
        byLevel.set(lv.id, l);
      }
    }
    const top = [...all].sort((a, b) => b.downloads - a.downloads)[0] ?? null;
    const recentRows = await prisma.material.findMany({ where: visibleWhere(gids), include: matInclude, orderBy: { createdAt: "desc" }, take: 5 });
    return {
      total: all.length,
      library: all.filter((m) => !m.groupId).length,
      inGroups: all.filter((m) => m.groupId).length,
      groupsWithMaterials: new Set(all.map((m) => m.groupId).filter(Boolean)).size,
      groups: gids.length,
      mine: all.filter((m) => m.uploadedById === me).length,
      totalDownloads: all.reduce((a, m) => a + m.downloads, 0),
      totalSize,
      byType: [...byType.values()].sort((a, b) => b.size - a.size || b.count - a.count),
      byLevel: [...byLevel.values()].sort((a, b) => a.level.code.localeCompare(b.level.code)),
      top: top && top.downloads > 0 ? { id: top.id, title: top.title, downloads: top.downloads } : null,
      recent: recentRows.map((m) => matDto(m, me, levels)),
    };
  });

  // Yangi material (kelishuv: teacher-a "Material biriktirish"). Fayl avval POST /api/files.
  app.post("/materials", async (req, reply) => {
    const body = parse(createBody, req.body);
    const me = req.auth.userId;
    if (!body.fileId && !body.url) throw badRequest("Fayl yoki havola kerak");
    if (body.fileId && body.url) throw badRequest("Fayl yoki havoladan faqat bittasi");
    let groupId = body.groupId ?? null;
    if (groupId) await assertTeacherGroup(me, groupId);
    if (body.lessonId) {
      const l = await assertTeacherLesson(me, body.lessonId);
      if (groupId && l.groupId !== groupId) throw badRequest("Dars boshqa guruhga tegishli");
      groupId = l.groupId; // darsga biriktirilgan material — o'sha guruhniki
    }
    let levelId = body.levelId ?? null;
    if (body.topicId) {
      const t = await prisma.topic.findUnique({ where: { id: body.topicId }, select: { levelId: true } });
      if (!t) throw badRequest("Mavzu topilmadi");
      levelId ??= t.levelId;
    }
    if (body.levelId && !(await prisma.level.findUnique({ where: { id: body.levelId }, select: { id: true } }))) throw badRequest("Level topilmadi");

    let type: MaterialType;
    if (body.fileId) {
      const f = await prisma.file.findFirst({
        where: { id: body.fileId, uploadedById: me, submissionId: null, homeworkId: null, messageId: null, material: { is: null } },
      });
      if (!f) throw badRequest("Fayl topilmadi yoki allaqachon ishlatilgan");
      type = body.type && body.type !== "LINK" ? body.type : typeFromMime(f.mime);
    } else {
      type = "LINK";
    }

    const m = await prisma.$transaction(async (tx) => {
      const row = await tx.material.create({
        data: {
          title: body.title,
          description: body.description || null,
          type,
          fileId: body.fileId ?? null,
          url: body.url ?? null,
          levelId,
          topicId: body.topicId ?? null,
          groupId,
          lessonId: body.lessonId ?? null,
          uploadedById: me,
        },
      });
      if (groupId && body.notify) await notifyGroupStudents(tx, groupId, body.title, body.note);
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "material.create",
        entityType: "Material",
        entityId: row.id,
        summary: `“${row.title}” materiali ${groupId ? "guruhga biriktirildi" : "resurslar bazasiga yuklandi"}`,
        after: { title: row.title, type: row.type, fileId: row.fileId, url: row.url, groupId: row.groupId, lessonId: row.lessonId, topicId: row.topicId },
      });
      return row;
    });
    const row = await prisma.material.findUniqueOrThrow({ where: { id: m.id }, include: matInclude });
    reply.code(201);
    return matDto(row, me, await levelMap([row.levelId, row.topic?.levelId]));
  });

  // Guruhga ulashish: yangi Material + faylning nusxasi (yuqoridagi izohga qarang)
  app.post("/materials/:id/share", async (req, reply) => {
    const { id } = parse(idParam, req.params);
    const body = parse(
      z.object({ groupId: zId, lessonId: zId.nullish(), note: z.string().trim().max(300).nullish(), notify: z.boolean().default(true) }),
      req.body,
    );
    const me = req.auth.userId;
    const src = await visibleMaterial(me, id);
    const group = await assertTeacherGroup(me, body.groupId);
    if (body.lessonId) {
      const l = await assertTeacherLesson(me, body.lessonId);
      if (l.groupId !== body.groupId) throw badRequest("Dars boshqa guruhga tegishli");
    }
    if (src.groupId === body.groupId) throw conflict("Material allaqachon shu guruhda");
    const dup = await prisma.material.findFirst({ where: { groupId: body.groupId, title: src.title, type: src.type } });
    if (dup) throw conflict("Bu guruhda shunday nomli material bor");

    let newFileId: string | null = null;
    let storageKey: string | null = null;
    if (src.fileId) {
      const f = await prisma.file.findUniqueOrThrow({ where: { id: src.fileId } });
      let buf: Buffer;
      try {
        buf = await readFile(path.resolve(config.uploadDir, f.storageKey));
      } catch {
        throw badRequest("Asl fayl diskda topilmadi");
      }
      const copy = await saveBuffer(prisma, buf, { originalName: f.originalName, mime: f.mime, uploadedById: me });
      newFileId = copy.id;
      storageKey = copy.storageKey;
    }
    try {
      const m = await prisma.$transaction(async (tx) => {
        const row = await tx.material.create({
          data: {
            title: src.title,
            description: src.description,
            type: src.type,
            fileId: newFileId,
            url: src.url,
            levelId: src.levelId ?? src.topic?.levelId ?? null,
            topicId: src.topicId,
            groupId: body.groupId,
            lessonId: body.lessonId ?? null,
            uploadedById: me,
          },
        });
        const notified = body.notify ? await notifyGroupStudents(tx, body.groupId, src.title, body.note) : 0;
        await writeAudit(tx, {
          ...auditCtx(req),
          action: "material.share",
          entityType: "Material",
          entityId: row.id,
          summary: `“${src.title}” ${group.name} guruhiga ulashildi`,
          after: { sourceId: src.id, groupId: body.groupId, fileId: newFileId, notified },
        });
        return row;
      });
      const row = await prisma.material.findUniqueOrThrow({ where: { id: m.id }, include: matInclude });
      reply.code(201);
      return matDto(row, me, await levelMap([row.levelId, row.topic?.levelId]));
    } catch (e) {
      if (newFileId && storageKey) {
        await prisma.file.delete({ where: { id: newFileId } }).catch(() => {});
        await deleteStored({ storageKey });
      }
      throw e;
    }
  });

  app.delete("/materials/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const me = req.auth.userId;
    const m = await visibleMaterial(me, id);
    if (m.uploadedById !== me) throw forbidden("Faqat oʻzingiz yuklagan materialni oʻchira olasiz");
    const file = m.fileId ? await prisma.file.findUnique({ where: { id: m.fileId }, select: { id: true, storageKey: true } }) : null;
    await prisma.$transaction(async (tx) => {
      await tx.material.delete({ where: { id } });
      if (file) await tx.file.delete({ where: { id: file.id } });
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "material.delete",
        entityType: "Material",
        entityId: id,
        summary: `“${m.title}” materiali oʻchirildi`,
        before: { title: m.title, type: m.type, fileId: m.fileId, url: m.url, groupId: m.groupId, downloads: m.downloads },
      });
    });
    if (file) await deleteStored(file);
    return { ok: true };
  });
}
