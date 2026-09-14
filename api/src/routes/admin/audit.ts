// Admin → Tizim jurnali (Audit log). QAT'IY FAQAT O'QISH: yangilash/o'chirish endpointlari yo'q
// (DB trigger ham UPDATE/DELETE/TRUNCATE ni bloklaydi). BigInt id → satr sifatida.
import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../db.js";
import { parse, zYmd } from "../../lib/http.js";
import { auditHash, verifyAuditChain } from "../../lib/audit.js";
import { atTz, startOfDayTz } from "../../lib/dates.js";
import { notFound } from "../../lib/errors.js";
import { csvDateTime, sendCsv, stripSecrets, toCsv } from "./b/helpers.js";

const filterQuery = z.object({
  actorId: z.string().max(40).optional(),
  actorRole: z.enum(["ADMIN", "TEACHER", "PARENT", "STUDENT", "SYSTEM"]).optional(),
  action: z.string().trim().max(60).optional(), // prefiks: "grade." yoki aniq "payment.pay"
  entityType: z.string().trim().max(40).optional(),
  entityId: z.string().trim().max(60).optional(),
  from: zYmd.optional(),
  to: zYmd.optional(),
  q: z.string().trim().max(100).optional(),
});
type Filter = z.infer<typeof filterQuery>;

function whereOf(f: Filter): Prisma.AuditLogWhereInput {
  const and: Prisma.AuditLogWhereInput[] = [];
  if (f.actorId) and.push({ actorId: f.actorId });
  if (f.actorRole === "SYSTEM") and.push({ actorId: null });
  else if (f.actorRole) and.push({ actorRole: f.actorRole });
  if (f.action) and.push({ action: { startsWith: f.action } });
  if (f.entityType) and.push({ entityType: f.entityType });
  if (f.entityId) and.push({ entityId: f.entityId });
  if (f.from) and.push({ at: { gte: atTz(f.from, "00:00") } });
  if (f.to) and.push({ at: { lt: new Date(atTz(f.to, "00:00").getTime() + 86_400_000) } });
  if (f.q) {
    const t = f.q.trim().replace(/^#/, "");
    const or: Prisma.AuditLogWhereInput[] = [
      { summary: { contains: t, mode: "insensitive" } },
      { action: { contains: t, mode: "insensitive" } },
      { entityId: t },
      { ip: { startsWith: t } },
      { actor: { fullName: { contains: t, mode: "insensitive" } } },
    ];
    if (/^\d{1,18}$/.test(t)) or.push({ id: BigInt(t) });
    and.push({ OR: or });
  }
  return { AND: and };
}

// ─────────── Diff ───────────

type Change = { path: string; before: unknown; after: unknown; kind: "added" | "removed" | "changed" };

const isPlain = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function flatten(v: unknown, prefix: string, out: Map<string, unknown>) {
  if (isPlain(v) && Object.keys(v).length) {
    for (const [k, val] of Object.entries(v)) flatten(val, prefix ? `${prefix}.${k}` : k, out);
  } else if (prefix) out.set(prefix, v);
  return out;
}

export function diffJson(before: unknown, after: unknown): Change[] {
  const b = flatten(before ?? {}, "", new Map());
  const a = flatten(after ?? {}, "", new Map());
  const keys = [...new Set([...b.keys(), ...a.keys()])];
  const out: Change[] = [];
  for (const k of keys) {
    const hasB = b.has(k);
    const hasA = a.has(k);
    const vb = b.get(k);
    const va = a.get(k);
    if (hasB && hasA && JSON.stringify(vb) === JSON.stringify(va)) continue;
    out.push({ path: k, before: hasB ? vb : null, after: hasA ? va : null, kind: !hasB ? "added" : !hasA ? "removed" : "changed" });
  }
  // jsonb kalit tartibini o'zgartiradi — muhim maydonlar birinchi chiqsin (jadvaldagi qisqa ko'rinish uchun)
  const PRIORITY = ["status", "value", "score", "amount", "isActive", "teacherId", "roomId", "groupId", "method", "receiptNo"];
  const rank = (p: string) => {
    const i = PRIORITY.indexOf(p.split(".").pop() ?? p);
    return i === -1 ? PRIORITY.length : i;
  };
  return out.sort((a, b) => rank(a.path) - rank(b.path));
}

// ─────────── Obyekt nomlari ───────────

async function entityLabels(items: { entityType: string; entityId: string | null }[]) {
  const ids = (type: string[]) => [...new Set(items.filter((i) => type.includes(i.entityType) && i.entityId).map((i) => i.entityId!))];
  const userIds = ids(["User", "Student", "Teacher", "Parent"]);
  const groupIds = ids(["Group"]);
  const payIds = ids(["Payment"]);
  const gradeIds = ids(["Grade"]);
  const hwIds = ids(["Homework"]);
  const [users, groups, pays, grades, hws] = await Promise.all([
    userIds.length ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, fullName: true, studentProfile: { select: { code: true } } } }) : [],
    groupIds.length ? prisma.group.findMany({ where: { id: { in: groupIds } }, select: { id: true, name: true } }) : [],
    payIds.length ? prisma.payment.findMany({ where: { id: { in: payIds } }, select: { id: true, receiptNo: true, student: { select: { fullName: true } } } }) : [],
    gradeIds.length ? prisma.grade.findMany({ where: { id: { in: gradeIds } }, select: { id: true, student: { select: { fullName: true, studentProfile: { select: { code: true } } } } } }) : [],
    hwIds.length ? prisma.homework.findMany({ where: { id: { in: hwIds } }, select: { id: true, title: true } }) : [],
  ]);
  const m = new Map<string, { label: string; sub: string | null }>();
  for (const u of users) m.set(u.id, { label: u.fullName, sub: u.studentProfile ? `#${u.studentProfile.code}` : null });
  for (const g of groups) m.set(g.id, { label: g.name, sub: null });
  for (const p of pays) m.set(p.id, { label: `Toʻlov — ${p.student.fullName}`, sub: p.receiptNo });
  for (const g of grades) m.set(g.id, { label: `Baho — ${g.student.fullName}`, sub: g.student.studentProfile ? `#${g.student.studentProfile.code}` : null });
  for (const h of hws) m.set(h.id, { label: `Uyga vazifa: ${h.title}`, sub: null });
  return m;
}

const listSelect = {
  id: true, at: true, actorId: true, actorRole: true, action: true, entityType: true, entityId: true, summary: true,
  before: true, after: true, ip: true, userAgent: true, hash: true, prevHash: true,
  actor: { select: { id: true, fullName: true, role: true, title: true } },
} satisfies Prisma.AuditLogSelect;
type Row = Prisma.AuditLogGetPayload<{ select: typeof listSelect }>;

function mapRow(r: Row, labels: Map<string, { label: string; sub: string | null }>) {
  const before = stripSecrets(r.before);
  const after = stripSecrets(r.after);
  const changes = diffJson(before, after);
  const ent = r.entityId ? labels.get(r.entityId) : undefined;
  return {
    id: r.id.toString(),
    at: r.at,
    actor: r.actor ? { id: r.actor.id, fullName: r.actor.fullName, role: r.actor.role, title: r.actor.title } : null,
    actorRole: r.actorRole,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    entityLabel: ent?.label ?? null,
    entitySub: ent?.sub ?? null,
    summary: r.summary,
    ip: r.ip,
    userAgent: r.userAgent,
    hash: r.hash,
    prevHash: r.prevHash,
    hasDiff: before != null || after != null,
    preview: changes.filter((c) => c.kind === "changed").slice(0, 2),
  };
}

export default async function audit(app: FastifyInstance) {
  // ── Ro'yxat: kursor bo'yicha (id kamayish tartibida) ──
  app.get("/audit", async (req) => {
    const q = parse(
      filterQuery.extend({ cursor: z.string().regex(/^\d{1,19}$/).optional(), limit: z.coerce.number().int().min(1).max(200).default(30) }),
      req.query,
    );
    const where = whereOf(q);
    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: q.cursor ? { AND: [where, { id: { lt: BigInt(q.cursor) } }] } : where,
        orderBy: { id: "desc" },
        take: q.limit + 1,
        select: listSelect,
      }),
      prisma.auditLog.count({ where }),
    ]);
    const page = rows.slice(0, q.limit);
    const labels = await entityLabels(page);
    return {
      items: page.map((r) => mapRow(r, labels)),
      nextCursor: rows.length > q.limit ? page[page.length - 1].id.toString() : null,
      total,
    };
  });

  app.get("/audit/stats", async () => {
    const today = startOfDayTz();
    const yesterday = new Date(today.getTime() - 86_400_000);
    const [total, todayCount, yesterdayCount, alertsToday, last, first] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { at: { gte: today } } }),
      prisma.auditLog.count({ where: { at: { gte: yesterday, lt: today } } }),
      prisma.auditLog.count({ where: { at: { gte: today }, action: "auth.login_failed" } }),
      prisma.auditLog.findFirst({ orderBy: { id: "desc" }, select: { id: true, at: true, hash: true } }),
      prisma.auditLog.findFirst({ orderBy: { id: "asc" }, select: { at: true } }),
    ]);
    return {
      total,
      today: todayCount,
      yesterday: yesterdayCount,
      changePercent: yesterdayCount ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100) : null,
      securityAlertsToday: alertsToday,
      last: last ? { id: last.id.toString(), at: last.at, hash: last.hash } : null,
      firstAt: first?.at ?? null,
    };
  });

  /** Filtr tanlagichlari uchun: amallar, obyekt turlari, faol foydalanuvchilar. */
  app.get("/audit/facets", async () => {
    const [actions, types, actors] = await Promise.all([
      prisma.auditLog.groupBy({ by: ["action"], _count: { _all: true }, orderBy: { action: "asc" } }),
      prisma.auditLog.groupBy({ by: ["entityType"], _count: { _all: true }, orderBy: { entityType: "asc" } }),
      prisma.auditLog.groupBy({ by: ["actorId"], _count: { _all: true }, where: { actorId: { not: null } }, orderBy: { _count: { actorId: "desc" } }, take: 100 }),
    ]);
    const users = await prisma.user.findMany({ where: { id: { in: actors.map((a) => a.actorId!).filter(Boolean) } }, select: { id: true, fullName: true, role: true } });
    return {
      actions: actions.map((a) => ({ action: a.action, count: a._count._all })),
      entityTypes: types.map((t) => ({ entityType: t.entityType, count: t._count._all })),
      actors: users.map((u) => ({ ...u, count: actors.find((a) => a.actorId === u.id)?._count._all ?? 0 })).sort((a, b) => a.fullName.localeCompare(b.fullName)),
    };
  });

  /** Butun zanjirni tekshirish (sha256 + prevHash bog'lanishi). */
  app.get("/audit/verify", async () => {
    const started = Date.now();
    const res = await verifyAuditChain();
    const last = await prisma.auditLog.findFirst({ orderBy: { id: "desc" }, select: { id: true, hash: true } });
    return { ...res, lastId: last?.id.toString() ?? null, lastHash: last?.hash ?? null, checkedAt: new Date(), tookMs: Date.now() - started };
  });

  app.get("/audit/export.csv", async (req, reply) => {
    const f = parse(filterQuery, req.query);
    const rows = await prisma.auditLog.findMany({ where: whereOf(f), orderBy: { id: "desc" }, take: 10_000, select: listSelect });
    const labels = await entityLabels(rows);
    const csv = toCsv(
      ["ID", "Vaqt", "Foydalanuvchi", "Rol", "Amal", "Obyekt turi", "Obyekt", "Obyekt ID", "Tafsilot", "IP", "Qurilma", "Hash"],
      rows.map((r) => {
        const m = mapRow(r, labels);
        return [m.id, csvDateTime(r.at), m.actor?.fullName ?? "Tizim", r.actorRole ?? "", r.action, r.entityType, m.entityLabel ?? "", r.entityId ?? "", r.summary ?? "", r.ip ?? "", r.userAgent ?? "", r.hash];
      }),
    );
    return sendCsv(reply, `tizim-jurnali-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  });

  app.get("/audit/:id", async (req) => {
    const { id } = parse(z.object({ id: z.string().max(20) }), req.params);
    if (!/^\d{1,19}$/.test(id)) throw notFound("Yozuv topilmadi");
    const r = await prisma.auditLog.findUnique({ where: { id: BigInt(id) }, select: listSelect });
    if (!r) throw notFound("Yozuv topilmadi");
    const [prev, next, labels] = await Promise.all([
      prisma.auditLog.findFirst({ where: { id: { lt: r.id } }, orderBy: { id: "desc" }, select: { id: true, hash: true } }),
      prisma.auditLog.findFirst({ where: { id: { gt: r.id } }, orderBy: { id: "asc" }, select: { id: true, prevHash: true } }),
      entityLabels([r]),
    ]);
    // Shu yozuvning o'zini tekshirish: hash qayta hisoblanadi va qo'shnilar bilan bog'lanish solishtiriladi
    const recomputed = auditHash(r.prevHash, { ...r, before: r.before, after: r.after });
    const before = stripSecrets(r.before);
    const after = stripSecrets(r.after);
    return {
      ...mapRow(r, labels),
      before,
      after,
      changes: diffJson(before, after),
      integrity: {
        hashValid: recomputed === r.hash,
        linkValid: (prev?.hash ?? null) === r.prevHash && (!next || next.prevHash === r.hash),
      },
      prevId: prev?.id.toString() ?? null,
      nextId: next?.id.toString() ?? null,
    };
  });
}
