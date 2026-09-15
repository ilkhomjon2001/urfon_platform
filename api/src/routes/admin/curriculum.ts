// Admin: Mavzular bazasi (o'quv dasturi / sillabus). Ustozlar dars o'tganda faqat PUBLISHED mavzularni tanlaydi.
import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../db.js";
import { writeAudit } from "../../lib/audit.js";
import { addDays } from "../../lib/dates.js";
import { badRequest, conflict, notFound } from "../../lib/errors.js";
import { auditCtx, idParam, parse } from "../../lib/http.js";
import { BUSY_STATUSES, levelLabel, pct } from "./a/schedule.js";

const zId = z.string().min(1).max(40);
const zList = z.array(z.string().trim().min(1).max(200)).max(40);
const topicFields = {
  title: z.string().trim().min(3, "Mavzu nomi kamida 3 belgi").max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  objectives: zList.optional(),
  vocabulary: zList.optional(),
  grammar: z.string().trim().max(500).nullable().optional(),
  lessonsCount: z.number().int().min(1, "Darslar soni kamida 1").max(100),
  hours: z.number().min(0.5, "Soat kamida 0.5").max(300),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
};
const createBody = z.object({ ...topicFields, levelId: zId, status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT") });
const updateBody = z.object(topicFields).partial();

const STATUS_LABEL = { DRAFT: "Qoralama", PUBLISHED: "Tasdiqlangan", ARCHIVED: "Arxivlangan" } as const;
const topicName = (t: { unit: number; title: string }) => `Unit ${t.unit} — ${t.title}`;

function topicSnapshot(t: {
  unit: number; title: string; description: string | null; objectives: string[]; vocabulary: string[];
  grammar: string | null; lessonsCount: number; hours: number; status: string;
}) {
  return {
    unit: t.unit, title: t.title, description: t.description, objectives: t.objectives, vocabulary: t.vocabulary,
    grammar: t.grammar, lessonsCount: t.lessonsCount, hours: t.hours, status: t.status,
  };
}

async function getTopic(id: string) {
  const t = await prisma.topic.findUnique({ where: { id }, include: { level: true } });
  if (!t) throw notFound("Mavzu topilmadi");
  return t;
}

export default async function curriculum(app: FastifyInstance) {
  // ─── Levellar + statistika ───
  app.get("/curriculum/levels", async () => {
    const [levels, materials] = await Promise.all([
      prisma.level.findMany({
        orderBy: { order: "asc" },
        include: {
          topics: { select: { id: true, status: true, lessonsCount: true, hours: true, updatedAt: true, author: { select: { fullName: true } } } },
          groups: { where: { status: { in: BUSY_STATUSES } }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true, status: true } },
        },
      }),
      prisma.material.findMany({
        where: { OR: [{ levelId: { not: null } }, { topicId: { not: null } }] },
        select: { levelId: true, topic: { select: { levelId: true } } },
      }),
    ]);
    const matCount = new Map<string, number>();
    for (const m of materials) {
      const lv = m.topic?.levelId ?? m.levelId;
      if (lv) matCount.set(lv, (matCount.get(lv) ?? 0) + 1);
    }
    return {
      items: levels.map((l) => {
        const live = l.topics.filter((t) => t.status !== "ARCHIVED");
        const last = [...l.topics].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
        return {
          id: l.id,
          code: l.code,
          name: l.name,
          order: l.order,
          label: levelLabel(l),
          topicsCount: live.length,
          published: l.topics.filter((t) => t.status === "PUBLISHED").length,
          draft: l.topics.filter((t) => t.status === "DRAFT").length,
          archived: l.topics.filter((t) => t.status === "ARCHIVED").length,
          lessons: live.reduce((s, t) => s + t.lessonsCount, 0),
          hours: Math.round(live.reduce((s, t) => s + t.hours, 0) * 10) / 10,
          materialsCount: matCount.get(l.id) ?? 0,
          groups: l.groups,
          groupsCount: l.groups.length,
          lastUpdatedAt: last?.updatedAt ?? null,
          lastAuthor: last?.author?.fullName ?? null,
        };
      }),
    };
  });

  app.post("/curriculum/levels", async (req, reply) => {
    const b = parse(
      z.object({
        code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{1,12}$/, "Kod lotin harf/raqam (masalan L7)"),
        name: z.string().trim().min(2).max(80),
        order: z.number().int().min(0).max(1000).optional(),
      }),
      req.body,
    );
    if (await prisma.level.findUnique({ where: { code: b.code } })) throw conflict(`“${b.code}” kodli level mavjud`);
    const max = await prisma.level.aggregate({ _max: { order: true } });
    const level = await prisma.$transaction(async (tx) => {
      const l = await tx.level.create({ data: { code: b.code, name: b.name, order: b.order ?? (max._max.order ?? 0) + 1 } });
      await writeAudit(tx, {
        ...auditCtx(req), action: "level.create", entityType: "Level", entityId: l.id,
        summary: `Yangi bosqich yaratildi: ${levelLabel(l)}`, after: { code: l.code, name: l.name, order: l.order },
      });
      return l;
    });
    reply.status(201);
    return { ...level, label: levelLabel(level) };
  });

  app.put("/curriculum/levels/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const b = parse(z.object({ name: z.string().trim().min(2).max(80).optional(), order: z.number().int().min(0).max(1000).optional() }), req.body);
    const l = await prisma.level.findUnique({ where: { id } });
    if (!l) throw notFound("Level topilmadi");
    return prisma.$transaction(async (tx) => {
      const u = await tx.level.update({ where: { id }, data: b });
      await writeAudit(tx, {
        ...auditCtx(req), action: "level.update", entityType: "Level", entityId: id,
        summary: `Bosqich tahrirlandi: ${levelLabel(u)}`, before: { name: l.name, order: l.order }, after: { name: u.name, order: u.order },
      });
      return { ...u, label: levelLabel(u) };
    });
  });

  // ─── Level mavzulari (unit tartibida) ───
  app.get("/curriculum/levels/:id/topics", async (req) => {
    const { id } = parse(idParam, req.params);
    const q = parse(
      z.object({ status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "ACTIVE"]).optional(), q: z.string().trim().max(100).optional() }),
      req.query,
    );
    const level = await prisma.level.findUnique({ where: { id } });
    if (!level) throw notFound("Level topilmadi");
    const topics = await prisma.topic.findMany({
      where: { levelId: id },
      orderBy: { unit: "asc" },
      include: { author: { select: { id: true, fullName: true, title: true } } },
    });
    const ids = topics.map((t) => t.id);
    const now = new Date();
    const recentFrom = addDays(now, -14);
    const [materials, homework, links] = await Promise.all([
      prisma.material.findMany({ where: { topicId: { in: ids } }, select: { topicId: true, type: true } }),
      prisma.homework.groupBy({ by: ["topicId"], where: { topicId: { in: ids } }, _count: { _all: true } }),
      prisma.lessonTopic.findMany({
        where: { topicId: { in: ids } },
        select: {
          topicId: true,
          lesson: { select: { startsAt: true, status: true, group: { select: { id: true, name: true, status: true } } } },
        },
      }),
    ]);
    const mat = new Map<string, { count: number; types: Set<string> }>();
    for (const m of materials) {
      const x = mat.get(m.topicId!) ?? { count: 0, types: new Set<string>() };
      x.count++;
      x.types.add(m.type);
      mat.set(m.topicId!, x);
    }
    const hw = new Map(homework.map((h) => [h.topicId!, h._count._all]));
    const usage = new Map<string, { lessons: number; groups: Map<string, string>; current: Map<string, string>; lastUsedAt: Date | null }>();
    for (const l of links) {
      const u = usage.get(l.topicId) ?? { lessons: 0, groups: new Map(), current: new Map(), lastUsedAt: null };
      u.lessons++;
      u.groups.set(l.lesson.group.id, l.lesson.group.name);
      if (l.lesson.startsAt >= recentFrom && l.lesson.startsAt <= addDays(now, 7) && l.lesson.group.status !== "FINISHED") {
        u.current.set(l.lesson.group.id, l.lesson.group.name);
      }
      if (l.lesson.startsAt <= now && (!u.lastUsedAt || l.lesson.startsAt > u.lastUsedAt)) u.lastUsedAt = l.lesson.startsAt;
      usage.set(l.topicId, u);
    }
    const rows = topics.map((t) => {
      const m = mat.get(t.id);
      const u = usage.get(t.id);
      return {
        id: t.id,
        unit: t.unit,
        title: t.title,
        description: t.description,
        objectives: t.objectives,
        vocabulary: t.vocabulary,
        grammar: t.grammar,
        lessonsCount: t.lessonsCount,
        hours: t.hours,
        lessonPlan: t.lessonPlan,
        status: t.status,
        available: t.status === "PUBLISHED",
        author: t.author,
        materialsCount: m?.count ?? 0,
        materialTypes: m ? [...m.types] : [],
        homeworkCount: hw.get(t.id) ?? 0,
        usage: u?.lessons ?? 0,
        groupsUsing: u ? [...u.groups].map(([gid, name]) => ({ id: gid, name })) : [],
        currentGroups: u ? [...u.current].map(([gid, name]) => ({ id: gid, name })) : [],
        lastUsedAt: u?.lastUsedAt ?? null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    });
    const live = rows.filter((r) => r.status !== "ARCHIVED");
    const needle = q.q?.toLowerCase();
    const items = rows
      .filter((r) => (q.status === "ACTIVE" ? r.status !== "ARCHIVED" : !q.status || r.status === q.status))
      .filter(
        (r) =>
          !needle ||
          r.title.toLowerCase().includes(needle) ||
          (r.description?.toLowerCase().includes(needle) ?? false) ||
          (r.grammar?.toLowerCase().includes(needle) ?? false) ||
          r.vocabulary.some((v) => v.toLowerCase().includes(needle)) ||
          `unit ${r.unit}` === needle,
      );
    const last = [...topics].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
    const groups = await prisma.group.findMany({
      where: { levelId: id, status: { in: BUSY_STATUSES } },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    });
    return {
      level: { id: level.id, code: level.code, name: level.name, order: level.order, label: levelLabel(level) },
      stats: {
        topics: live.length,
        published: rows.filter((r) => r.status === "PUBLISHED").length,
        draft: rows.filter((r) => r.status === "DRAFT").length,
        archived: rows.filter((r) => r.status === "ARCHIVED").length,
        lessons: live.reduce((s, r) => s + r.lessonsCount, 0),
        hours: Math.round(live.reduce((s, r) => s + r.hours, 0) * 10) / 10,
        materials: live.reduce((s, r) => s + r.materialsCount, 0),
        materialsCoveragePct: pct(live.filter((r) => r.materialsCount > 0).length, live.length),
        groups,
        lastUpdatedAt: last?.updatedAt ?? null,
        lastAuthor: last ? (await prisma.topic.findUnique({ where: { id: last.id }, select: { author: { select: { fullName: true, title: true } } } }))?.author ?? null : null,
      },
      counts: { all: rows.length, ACTIVE: live.length, PUBLISHED: rows.filter((r) => r.status === "PUBLISHED").length, DRAFT: rows.filter((r) => r.status === "DRAFT").length, ARCHIVED: rows.filter((r) => r.status === "ARCHIVED").length },
      items,
    };
  });

  // ─── Mavzu yaratish (oxiriga qo'shiladi) ───
  app.post("/curriculum/topics", async (req, reply) => {
    const b = parse(createBody, req.body);
    const level = await prisma.level.findUnique({ where: { id: b.levelId } });
    if (!level) throw notFound("Level topilmadi");
    const topic = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(424244)`;
      const max = await tx.topic.aggregate({ where: { levelId: b.levelId }, _max: { unit: true } });
      const t = await tx.topic.create({
        data: {
          levelId: b.levelId, unit: (max._max.unit ?? 0) + 1, title: b.title, description: b.description ?? null,
          objectives: b.objectives ?? [], vocabulary: b.vocabulary ?? [], grammar: b.grammar ?? null,
          lessonsCount: b.lessonsCount, hours: b.hours, status: b.status, authorId: req.auth.userId,
        },
      });
      await writeAudit(tx, {
        ...auditCtx(req), action: "topic.create", entityType: "Topic", entityId: t.id,
        summary: `${levelLabel(level)}: yangi mavzu — ${topicName(t)} (${STATUS_LABEL[t.status]})`,
        after: topicSnapshot(t),
      });
      return t;
    });
    reply.status(201);
    return topic;
  });

  // ─── Mavzuni tahrirlash (status ham) ───
  app.put("/curriculum/topics/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const b = parse(updateBody, req.body);
    const t = await getTopic(id);
    const before = topicSnapshot(t);
    return prisma.$transaction(async (tx) => {
      const u = await tx.topic.update({ where: { id }, data: b });
      const after = topicSnapshot(u);
      const keys = (Object.keys(after) as (keyof typeof after)[]).filter((k) => JSON.stringify(after[k]) !== JSON.stringify(before[k]));
      if (keys.length) {
        const archived = keys.includes("status") && u.status === "ARCHIVED";
        await writeAudit(tx, {
          ...auditCtx(req), action: archived ? "topic.archive" : "topic.update", entityType: "Topic", entityId: id,
          summary: archived
            ? `${levelLabel(t.level)}: mavzu arxivlandi — ${topicName(u)}`
            : `${levelLabel(t.level)}: mavzu tahrirlandi — ${topicName(u)}${keys.includes("status") ? ` (${STATUS_LABEL[u.status]})` : ""}`,
          before: Object.fromEntries(keys.map((k) => [k, before[k]])),
          after: Object.fromEntries(keys.map((k) => [k, after[k]])),
        });
      }
      return u;
    });
  });

  app.post("/curriculum/topics/:id/archive", async (req) => {
    const { id } = parse(idParam, req.params);
    const t = await getTopic(id);
    if (t.status === "ARCHIVED") throw badRequest("Mavzu allaqachon arxivlangan");
    return prisma.$transaction(async (tx) => {
      const u = await tx.topic.update({ where: { id }, data: { status: "ARCHIVED" } });
      await writeAudit(tx, {
        ...auditCtx(req), action: "topic.archive", entityType: "Topic", entityId: id,
        summary: `${levelLabel(t.level)}: mavzu arxivlandi — ${topicName(t)}`,
        before: { status: t.status }, after: { status: "ARCHIVED" },
      });
      return u;
    });
  });

  // ─── Nusxa (qoralama sifatida oxiriga) ───
  app.post("/curriculum/topics/:id/duplicate", async (req, reply) => {
    const { id } = parse(idParam, req.params);
    const t = await getTopic(id);
    const copy = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(424244)`;
      const max = await tx.topic.aggregate({ where: { levelId: t.levelId }, _max: { unit: true } });
      const c = await tx.topic.create({
        data: {
          levelId: t.levelId, unit: (max._max.unit ?? 0) + 1, title: `${t.title} (nusxa)`.slice(0, 160),
          description: t.description, objectives: t.objectives, vocabulary: t.vocabulary, grammar: t.grammar,
          lessonsCount: t.lessonsCount, hours: t.hours, lessonPlan: t.lessonPlan ?? Prisma.DbNull, status: "DRAFT", authorId: req.auth.userId,
        },
      });
      await writeAudit(tx, {
        ...auditCtx(req), action: "topic.create", entityType: "Topic", entityId: c.id,
        summary: `${levelLabel(t.level)}: ${topicName(t)} nusxalandi → ${topicName(c)} (qoralama)`,
        after: topicSnapshot(c),
      });
      return c;
    });
    reply.status(201);
    return copy;
  });

  // ─── Tartiblash: berilgan mavzular o'zlari egallagan unit o'rinlarida qayta joylashtiriladi ───
  app.post("/curriculum/levels/:id/reorder", async (req) => {
    const { id } = parse(idParam, req.params);
    const { topicIds } = parse(
      z.object({
        topicIds: z.array(zId).min(2, "Kamida 2 ta mavzu").max(300).refine((a) => new Set(a).size === a.length, "Takrorlangan mavzu bor"),
      }),
      req.body,
    );
    const level = await prisma.level.findUnique({ where: { id } });
    if (!level) throw notFound("Level topilmadi");
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(424244)`;
      const topics = await tx.topic.findMany({ where: { id: { in: topicIds }, levelId: id }, select: { id: true, unit: true, title: true } });
      if (topics.length !== topicIds.length) throw badRequest("Mavzular roʻyxati shu levelga tegishli emas");
      const byId = new Map(topics.map((t) => [t.id, t]));
      const slots = topics.map((t) => t.unit).sort((a, b) => a - b);
      const plan = topicIds.map((tid, i) => ({ id: tid, from: byId.get(tid)!.unit, to: slots[i], title: byId.get(tid)!.title }));
      const moved = plan.filter((p) => p.from !== p.to);
      if (!moved.length) return { ok: true, moved: 0 };
      // @@unique([levelId, unit]) buzilmasligi uchun: avval vaqtincha manfiy, keyin yakuniy qiymat
      for (const p of moved) await tx.topic.update({ where: { id: p.id }, data: { unit: -p.to } });
      for (const p of moved) await tx.topic.update({ where: { id: p.id }, data: { unit: p.to } });
      await writeAudit(tx, {
        ...auditCtx(req), action: "topic.reorder", entityType: "Level", entityId: id,
        summary: `${levelLabel(level)}: mavzular tartibi oʻzgartirildi (${moved.length} ta)`,
        before: moved.map((p) => ({ unit: p.from, title: p.title })),
        after: moved.map((p) => ({ unit: p.to, title: p.title })),
      });
      return { ok: true, moved: moved.length };
    });
  });
}
