// /api/student/materials — o'z guruhlarining materiallari + umumiy resurslar bazasi (groupId = null),
// mavzu (Unit) bo'yicha guruhlangan. Fayl yuklash: GET /api/files/:id (ruxsat u yerda ham tekshiriladi).
import type { FastifyInstance } from "fastify";
import { MaterialType, type Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../db.js";
import { notFound } from "../../lib/errors.js";
import { idParam, parse } from "../../lib/http.js";
import { accessIds, fileSel, levelLabel, myEnrollments, topicLabel } from "./shared.js";

const listQuery = z.object({
  type: z.nativeEnum(MaterialType).optional(),
  topicId: z.string().min(1).max(40).optional(),
  q: z.string().trim().max(100).optional(),
  scope: z.enum(["all", "group", "library"]).default("all"),
});

const matSelect = {
  id: true, title: true, description: true, type: true, url: true, createdAt: true, groupId: true,
  file: { select: fileSel },
  topic: { select: { id: true, unit: true, title: true, level: { select: { id: true, code: true, name: true, order: true } } } },
  lesson: { select: { id: true, title: true, startsAt: true } },
  group: { select: { id: true, name: true } },
  uploadedBy: { select: { fullName: true } },
} satisfies Prisma.MaterialSelect;

type MatRow = Prisma.MaterialGetPayload<{ select: typeof matSelect }>;

/** O'quvchiga ko'rinadigan materiallar: o'z guruhlari + o'z Level'iga tegishli (yoki umumiy) kutubxona. */
async function scopeWhere(studentId: string): Promise<{ where: Prisma.MaterialWhereInput; groupIds: string[] }> {
  const es = await myEnrollments(studentId);
  const groupIds = accessIds(es);
  const levelIds = [...new Set(es.map((e) => e.group.levelId).filter(Boolean))] as string[];
  const library: Prisma.MaterialWhereInput = {
    groupId: null,
    AND: [
      { OR: [{ levelId: null }, { levelId: { in: levelIds } }] },
      { OR: [{ topicId: null }, { topic: { levelId: { in: levelIds } } }] },
    ],
  };
  return { where: { OR: [{ groupId: { in: groupIds } }, library] }, groupIds };
}

function dto(m: MatRow) {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    type: m.type,
    url: m.url,
    createdAt: m.createdAt,
    file: m.file,
    source: m.groupId ? ("group" as const) : ("library" as const),
    group: m.group,
    topic: m.topic ? { id: m.topic.id, unit: m.topic.unit, label: topicLabel(m.topic) } : null,
    lesson: m.lesson,
    uploadedBy: m.uploadedBy.fullName,
  };
}

export default async function materials(app: FastifyInstance) {
  app.get("/materials", async (req) => {
    const q = parse(listQuery, req.query);
    const { where } = await scopeWhere(req.auth.userId);
    const all = await prisma.material.findMany({ where, orderBy: { createdAt: "desc" }, take: 500, select: matSelect });

    const inScope = all.filter((m) => (q.scope === "group" ? !!m.groupId : q.scope === "library" ? !m.groupId : true));
    const needle = q.q?.toLocaleLowerCase("uz");
    const filtered = inScope.filter(
      (m) =>
        (!q.type || m.type === q.type) &&
        (!q.topicId || m.topic?.id === q.topicId) &&
        (!needle || m.title.toLocaleLowerCase("uz").includes(needle) || (m.description ?? "").toLocaleLowerCase("uz").includes(needle)),
    );

    // Filtr variantlari (turi va mavzusi) — joriy ko'lamdagi barcha materiallardan
    const counts: Partial<Record<MaterialType, number>> = {};
    for (const m of inScope) counts[m.type] = (counts[m.type] ?? 0) + 1;
    const topicMap = new Map<string, { id: string; unit: number; label: string; level: string | null; order: number; count: number }>();
    for (const m of inScope) {
      if (!m.topic) continue;
      const t = topicMap.get(m.topic.id) ?? { id: m.topic.id, unit: m.topic.unit, label: topicLabel(m.topic)!, level: levelLabel(m.topic.level), order: m.topic.level.order, count: 0 };
      t.count++;
      topicMap.set(m.topic.id, t);
    }
    const topics = [...topicMap.values()].sort((a, b) => b.order - a.order || b.unit - a.unit);

    // Bo'limlar: mavzu bo'yicha (eng yangi Unit yuqorida), mavzusizlar oxirida
    const sections = new Map<string, { topic: { id: string; unit: number; label: string; level: string | null } | null; order: number; unit: number; items: ReturnType<typeof dto>[] }>();
    for (const m of filtered) {
      const key = m.topic?.id ?? "_general";
      const s = sections.get(key) ?? {
        topic: m.topic ? { id: m.topic.id, unit: m.topic.unit, label: topicLabel(m.topic)!, level: levelLabel(m.topic.level) } : null,
        order: m.topic?.level.order ?? -1,
        unit: m.topic?.unit ?? -1,
        items: [],
      };
      s.items.push(dto(m));
      sections.set(key, s);
    }
    return {
      total: filtered.length,
      scopeTotal: inScope.length,
      counts,
      topics: topics.map(({ order: _o, ...t }) => t),
      sections: [...sections.values()].sort((a, b) => b.order - a.order || b.unit - a.unit).map(({ order: _o, unit: _u, ...s }) => s),
    };
  });

  app.get("/materials/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const { where } = await scopeWhere(req.auth.userId);
    const m = await prisma.material.findFirst({ where: { AND: [{ id }, where] }, select: matSelect });
    if (!m) throw notFound("Material topilmadi");
    return dto(m);
  });
}
