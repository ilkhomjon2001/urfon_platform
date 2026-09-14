import { createHash } from "node:crypto";
import type { Role } from "@prisma/client";
import { prisma, type Db, type Tx } from "../db.js";

export type AuditInput = {
  actorId?: string | null;
  actorRole?: Role | null;
  action: string; // "grade.update", "payment.create", "group.assign_teacher" …
  entityType: string; // "Grade", "Payment", "Group" …
  entityId?: string | null;
  summary?: string; // odam o'qiydigan matn: "Unit 3 speaking bahosi 4 → 5"
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
  at?: Date;
};

// jsonb kalit tartibini o'zgartiradi, shuning uchun hash barqaror (saralangan) JSON'dan olinadi
export function stableStringify(v: unknown): string {
  if (v === undefined) return "null";
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (v instanceof Date) return JSON.stringify(v.toISOString());
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
    .join(",")}}`;
}

const toJson = (v: unknown) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

export function auditHash(prevHash: string | null, e: {
  at: Date; actorId: string | null; action: string; entityType: string; entityId: string | null;
  summary: string | null; before: unknown; after: unknown;
}) {
  const payload = stableStringify([prevHash ?? "", e.at.toISOString(), e.actorId, e.action, e.entityType, e.entityId, e.summary, e.before ?? null, e.after ?? null]);
  return createHash("sha256").update(payload).digest("hex");
}

async function append(tx: Tx, input: AuditInput) {
  // zanjir ketma-ketligi uchun global qulf (tranzaksiya oxirida bo'shaydi)
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(424242)`;
  const last = await tx.auditLog.findFirst({ orderBy: { id: "desc" }, select: { hash: true } });
  const at = input.at ?? new Date();
  const before = toJson(input.before);
  const after = toJson(input.after);
  const row = {
    at,
    actorId: input.actorId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    summary: input.summary ?? null,
    before: before ?? null,
    after: after ?? null,
  };
  const hash = auditHash(last?.hash ?? null, row);
  return tx.auditLog.create({
    data: {
      ...row,
      before: before ?? undefined,
      after: after ?? undefined,
      actorRole: input.actorRole ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      prevHash: last?.hash ?? null,
      hash,
    },
  });
}

/**
 * Audit yozuvi qo'shadi. Tranzaksiya ichida chaqirilsa (tx), o'sha tranzaksiyaga qo'shiladi —
 * asosiy o'zgarish bilan birga yoziladi yoki birga bekor bo'ladi.
 */
export async function writeAudit(db: Db, input: AuditInput) {
  if ("$transaction" in db) return prisma.$transaction((tx) => append(tx, input));
  return append(db as Tx, input);
}

/** Zanjirni tekshiradi: birinchi buzilgan yozuv id'sini qaytaradi yoki null. */
export async function verifyAuditChain(limit = 100_000) {
  let prev: string | null = null;
  let cursor: bigint | undefined;
  let checked = 0;
  for (;;) {
    const rows: Awaited<ReturnType<typeof prisma.auditLog.findMany>> = await prisma.auditLog.findMany({
      orderBy: { id: "asc" },
      take: 1000,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (!rows.length) break;
    for (const r of rows) {
      const h = auditHash(prev, { ...r, before: r.before, after: r.after });
      if (r.prevHash !== prev || h !== r.hash) return { ok: false, brokenAt: r.id.toString(), checked };
      prev = r.hash;
      checked++;
      if (checked >= limit) return { ok: true, brokenAt: null, checked };
    }
    cursor = rows[rows.length - 1].id;
  }
  return { ok: true, brokenAt: null, checked };
}
