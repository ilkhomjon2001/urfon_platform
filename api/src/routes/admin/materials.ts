// Admin: resurslar bazasi (Material) — markaz egasi barcha materiallarni ko'radi, tahrirlaydi va o'chiradi.
// Ko'rinish qoidasi Material.groupId ustunida: null → umumiy baza (barcha ustozlar), to'ldirilgan → faqat o'sha guruh.
// Level/mavzu esa o'quvchi kabinetidagi filtr uchun (api/src/routes/student/materials.ts → scopeWhere).
import type { FastifyInstance } from "fastify";
import type { MaterialType, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../db.js";
import { writeAudit } from "../../lib/audit.js";
import { badRequest, notFound } from "../../lib/errors.js";
import { auditCtx, idParam, paged, paginate, parse } from "../../lib/http.js";
import { deleteStored } from "../../lib/storage.js";
import { typeFromMime } from "../teacher/resources.js";

const MAT_TYPES = ["PDF", "AUDIO", "VIDEO", "DOC", "IMAGE", "LINK"] as const;
const zId = z.string().min(1).max(40);

const matInclude = {
  file: { select: { id: true, originalName: true, mime: true, size: true } },
  topic: { select: { id: true, unit: true, title: true, levelId: true } },
  group: { select: { id: true, code: true, name: true } },
  lesson: { select: { id: true, title: true, number: true, startsAt: true } },
  uploadedBy: { select: { id: true, fullName: true, role: true } },
} satisfies Prisma.MaterialInclude;
type MatRow = Prisma.MaterialGetPayload<{ include: typeof matInclude }>;

type LevelRef = { id: string; code: string; name: string };

async function levelMap(ids: (string | null | undefined)[]) {
  const uniq = [...new Set(ids.filter(Boolean))] as string[];
  if (!uniq.length) return new Map<string, LevelRef>();
  const ls = await prisma.level.findMany({ where: { id: { in: uniq } }, select: { id: true, code: true, name: true } });
  return new Map(ls.map((l) => [l.id, l]));
}

/** Ustoz tomonidagi DTO bilan bir xil shakl (mine o'rniga uploadedBy.role qo'shilgan). */
function matDto(m: MatRow, levels: Map<string, LevelRef>) {
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
  };
}

const listQuery = z.object({
  scope: z.enum(["all", "library", "group"]).default("all"),
  groupId: zId.optional(),
  type: z.enum(MAT_TYPES).optional(),
  levelId: zId.optional(),
  topicId: zId.optional(),
  uploadedById: zId.optional(),
  q: z.string().trim().max(100).optional(),
  // "downloads"/"title" — admin nomlari, "popular"/"name" — ustoz tomonidagi nomlar (ikkalasi ham ishlaydi)
  sort: z.enum(["new", "downloads", "title", "popular", "name"]).default("new"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
});

const createBody = z.object({
  title: z.string().trim().min(2, "Nomi kamida 2 belgi").max(200),
  description: z.string().trim().max(2000).nullish(),
  fileId: zId.nullish(),
  url: z
    .string()
    .trim()
    .url("Havola notoʻgʻri")
    .max(1000)
    .refine((u) => /^https?:\/\//i.test(u), "Havola http(s) bilan boshlansin")
    .nullish(),
  levelId: zId.nullish(),
  topicId: zId.nullish(),
  groupId: zId.nullish(),
});

const updateBody = z.object({
  title: z.string().trim().min(2, "Nomi kamida 2 belgi").max(200).optional(),
  description: z.string().trim().max(2000).nullish(),
  levelId: zId.nullish(),
  topicId: zId.nullish(),
  groupId: zId.nullish(),
});

/** Mavzu → uning level'i; mavzu topilmasa 400. */
async function topicLevel(topicId: string) {
  const t = await prisma.topic.findUnique({ where: { id: topicId }, select: { id: true, levelId: true } });
  if (!t) throw badRequest("Mavzu topilmadi");
  return t.levelId;
}

async function assertLevel(levelId: string) {
  const l = await prisma.level.findUnique({ where: { id: levelId }, select: { id: true } });
  if (!l) throw badRequest("Level topilmadi");
}

async function assertGroup(groupId: string) {
  const g = await prisma.group.findUnique({ where: { id: groupId }, select: { id: true, name: true } });
  if (!g) throw badRequest("Guruh topilmadi");
  return g;
}

export default async function materials(app: FastifyInstance) {
  // Ro'yxat: barcha materiallar (ko'lam cheklovisiz), filtr va saralash bilan
  app.get("/materials", async (req) => {
    const q = parse(listQuery, req.query);
    const p = { page: q.page, pageSize: q.perPage ?? q.pageSize };
    const scopeWhere: Prisma.MaterialWhereInput = q.groupId
      ? { groupId: q.groupId }
      : q.scope === "library"
        ? { groupId: null }
        : q.scope === "group"
          ? { groupId: { not: null } }
          : {};
    const filters: Prisma.MaterialWhereInput[] = [
      scopeWhere,
      ...(q.levelId ? [{ OR: [{ levelId: q.levelId }, { topic: { levelId: q.levelId } }] }] : []),
      ...(q.topicId ? [{ topicId: q.topicId }] : []),
      ...(q.uploadedById ? [{ uploadedById: q.uploadedById }] : []),
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
      q.sort === "downloads" || q.sort === "popular"
        ? [{ downloads: "desc" }, { createdAt: "desc" }]
        : q.sort === "title" || q.sort === "name"
          ? [{ title: "asc" }]
          : [{ createdAt: "desc" }, { id: "desc" }];
    const [rows, total, typeGroups] = await Promise.all([
      prisma.material.findMany({ where, include: matInclude, orderBy, ...paginate(p) }),
      prisma.material.count({ where }),
      prisma.material.groupBy({ by: ["type"], where: whereNoType, _count: { _all: true } }),
    ]);
    const levels = await levelMap(rows.flatMap((r) => [r.levelId, r.topic?.levelId]));
    const types: Record<string, number> = {};
    for (const t of typeGroups) types[t.type] = t._count._all;
    return { ...paged(rows.map((m) => matDto(m, levels)), total, p), types };
  });

  // Yuqoridagi kartalar: soni, hajmi, turlari, levellari, so'nggi 5 ta
  app.get("/materials/stats", async () => {
    const all = await prisma.material.findMany({
      select: {
        id: true, type: true, groupId: true, levelId: true, downloads: true, createdAt: true,
        topic: { select: { levelId: true } },
        file: { select: { size: true } },
      },
    });
    const levels = await levelMap(all.flatMap((m) => [m.levelId, m.topic?.levelId]));
    const byType = new Map<string, { type: string; count: number; size: number }>();
    const byLevel = new Map<string, { level: LevelRef; count: number; size: number }>();
    let totalSize = 0;
    let noLevel = 0;
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
      } else {
        noLevel++;
      }
    }
    const recentRows = await prisma.material.findMany({ include: matInclude, orderBy: { createdAt: "desc" }, take: 5 });
    const recentLevels = await levelMap(recentRows.flatMap((r) => [r.levelId, r.topic?.levelId]));
    return {
      total: all.length,
      library: all.filter((m) => !m.groupId).length,
      inGroups: all.filter((m) => m.groupId).length,
      groupsWithMaterials: new Set(all.map((m) => m.groupId).filter(Boolean)).size,
      withoutLevel: noLevel,
      totalDownloads: all.reduce((a, m) => a + m.downloads, 0),
      totalSize,
      byType: [...byType.values()].sort((a, b) => b.size - a.size || b.count - a.count),
      byLevel: [...byLevel.values()].sort((a, b) => a.level.code.localeCompare(b.level.code)),
      recent: recentRows.map((m) => matDto(m, recentLevels)),
    };
  });

  // Yuklash/tahrirlash oynasi uchun variantlar
  app.get("/materials/options", async () => {
    const [levels, topics, groups] = await Promise.all([
      prisma.level.findMany({ orderBy: { order: "asc" }, select: { id: true, code: true, name: true } }),
      prisma.topic.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ levelId: "asc" }, { unit: "asc" }],
        select: { id: true, unit: true, title: true, levelId: true },
      }),
      prisma.group.findMany({
        where: { status: { not: "FINISHED" } },
        orderBy: { code: "asc" },
        select: { id: true, code: true, name: true, levelId: true },
      }),
    ]);
    return { levels, topics, groups };
  });

  // Yangi material: avval POST /api/files (multipart), keyin shu yerga fileId bilan
  app.post("/materials", async (req, reply) => {
    const body = parse(createBody, req.body);
    const me = req.auth.userId;
    if (!body.fileId && !body.url) throw badRequest("Fayl yoki havola kerak");
    if (body.fileId && body.url) throw badRequest("Fayl yoki havoladan faqat bittasi");

    const groupId = body.groupId ?? null;
    if (groupId) await assertGroup(groupId);
    let levelId = body.levelId ?? null;
    if (body.topicId) levelId ??= await topicLevel(body.topicId);
    if (body.levelId) await assertLevel(body.levelId);

    let type: MaterialType;
    if (body.fileId) {
      const f = await prisma.file.findFirst({
        where: { id: body.fileId, uploadedById: me, submissionId: null, homeworkId: null, messageId: null, material: { is: null } },
      });
      if (!f) throw badRequest("Fayl topilmadi yoki allaqachon ishlatilgan");
      type = typeFromMime(f.mime);
    } else {
      type = "LINK";
    }

    const created = await prisma.$transaction(async (tx) => {
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
          uploadedById: me,
        },
      });
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "material.create",
        entityType: "Material",
        entityId: row.id,
        summary: `“${row.title}” materiali ${groupId ? "guruhga biriktirildi" : "resurslar bazasiga yuklandi"}`,
        after: { title: row.title, type: row.type, fileId: row.fileId, url: row.url, levelId: row.levelId, topicId: row.topicId, groupId: row.groupId },
      });
      return row;
    });
    const row = await prisma.material.findUniqueOrThrow({ where: { id: created.id }, include: matInclude });
    reply.code(201);
    return matDto(row, await levelMap([row.levelId, row.topic?.levelId]));
  });

  // Tahrirlash: nomi, izohi va biriktirilishi (level / mavzu / guruh)
  app.put("/materials/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(updateBody, req.body);
    const m = await prisma.material.findUnique({ where: { id }, include: matInclude });
    if (!m) throw notFound("Material topilmadi");

    const data: Prisma.MaterialUpdateInput = {};
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    const set = (key: string, oldValue: unknown, newValue: unknown) => {
      if (oldValue === newValue) return false;
      before[key] = oldValue;
      after[key] = newValue;
      return true;
    };

    if (body.title !== undefined && set("title", m.title, body.title)) data.title = body.title;
    if (body.description !== undefined) {
      const next = body.description || null;
      if (set("description", m.description, next)) data.description = next;
    }
    if (body.groupId !== undefined) {
      const next = body.groupId || null;
      if (next) await assertGroup(next);
      if (set("groupId", m.groupId, next)) data.group = next ? { connect: { id: next } } : { disconnect: true };
    }
    let topicId = m.topicId;
    if (body.topicId !== undefined) {
      const next = body.topicId || null;
      if (next) await topicLevel(next);
      if (set("topicId", m.topicId, next)) data.topic = next ? { connect: { id: next } } : { disconnect: true };
      topicId = next;
    }
    // levelId — oddiy ustun (FK emas). Berilmasa, yangi mavzudan olinadi.
    let levelId = body.levelId !== undefined ? body.levelId || null : m.levelId;
    if (levelId) await assertLevel(levelId);
    if (body.levelId === undefined && body.topicId !== undefined && topicId) levelId = await topicLevel(topicId);
    if (set("levelId", m.levelId, levelId)) data.levelId = levelId;

    if (!Object.keys(after).length) return matDto(m, await levelMap([m.levelId, m.topic?.levelId]));

    await prisma.$transaction(async (tx) => {
      await tx.material.update({ where: { id }, data });
      await writeAudit(tx, {
        ...auditCtx(req),
        action: "material.update",
        entityType: "Material",
        entityId: id,
        summary: `“${(after.title as string) ?? m.title}” materiali tahrirlandi`,
        before,
        after,
      });
    });
    const row = await prisma.material.findUniqueOrThrow({ where: { id }, include: matInclude });
    return matDto(row, await levelMap([row.levelId, row.topic?.levelId]));
  });

  // O'chirish: admin istalganini o'chira oladi (File yozuvi va diskdagi fayl bilan birga)
  app.delete("/materials/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const m = await prisma.material.findUnique({ where: { id }, include: matInclude });
    if (!m) throw notFound("Material topilmadi");
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
        before: { title: m.title, type: m.type, fileId: m.fileId, url: m.url, levelId: m.levelId, topicId: m.topicId, groupId: m.groupId, downloads: m.downloads },
      });
    });
    if (file) await deleteStored(file);
    return { ok: true };
  });
}
