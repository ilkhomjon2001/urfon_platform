import type { FastifyRequest } from "fastify";
import { z, type ZodTypeAny } from "zod";
import type { AuditInput } from "./audit.js";

/** Zod bilan tekshiradi; xato bo'lsa 400 (errorHandler ZodError'ni ushlaydi). */
export const parse = <S extends ZodTypeAny>(schema: S, value: unknown): z.infer<S> => schema.parse(value);

/** Audit uchun kontekst: kim, qayerdan. `writeAudit(db, { ...auditCtx(req), action, … })` */
export function auditCtx(req: FastifyRequest): Pick<AuditInput, "actorId" | "actorRole" | "ip" | "userAgent"> {
  return {
    actorId: req.auth?.userId ?? null,
    actorRole: req.auth?.role ?? null,
    ip: req.ip,
    userAgent: req.headers["user-agent"]?.slice(0, 300) ?? null,
  };
}

export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  q: z.string().trim().max(100).optional(),
});

export const paginate = (p: { page: number; pageSize: number }) => ({ skip: (p.page - 1) * p.pageSize, take: p.pageSize });

export const paged = <T>(items: T[], total: number, p: { page: number; pageSize: number }) => ({
  items,
  total,
  page: p.page,
  pageSize: p.pageSize,
  pages: Math.max(1, Math.ceil(total / p.pageSize)),
});

export const idParam = z.object({ id: z.string().min(1).max(40) });

// Umumiy zod qoidalar
export const zPhone = z.string().trim().regex(/^\+998\d{9}$/, "Telefon +998XXXXXXXXX koʻrinishida boʻlsin");
export const zTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Vaqt HH:MM koʻrinishida boʻlsin");
export const zYmd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD koʻrinishida boʻlsin");
export const zGrade = z.number().int().min(2, "Baho 2 dan 5 gacha").max(5, "Baho 2 dan 5 gacha");
