import { Prisma } from "@prisma/client";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export const badRequest = (message = "Soʻrov notoʻgʻri", code = "BAD_REQUEST") => new HttpError(400, code, message);
export const unauthorized = (message = "Tizimga kiring", code = "UNAUTHORIZED") => new HttpError(401, code, message);
export const forbidden = (message = "Bu amal uchun ruxsat yoʻq", code = "FORBIDDEN") => new HttpError(403, code, message);
export const notFound = (message = "Maʼlumot topilmadi", code = "NOT_FOUND") => new HttpError(404, code, message);
export const conflict = (message = "Bunday yozuv allaqachon mavjud", code = "CONFLICT") => new HttpError(409, code, message);

export function errorHandler(err: FastifyError | Error, req: FastifyRequest, reply: FastifyReply) {
  if (err instanceof HttpError) {
    return reply.status(err.status).send({ error: { code: err.code, message: err.message } });
  }
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const field = issue?.path.join(".");
    return reply.status(400).send({
      error: { code: "VALIDATION", message: issue ? `${field ? field + ": " : ""}${issue.message}` : "Maʼlumot notoʻgʻri", issues: err.issues },
    });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Maʼlumot topilmadi" } });
    if (err.code === "P2002") return reply.status(409).send({ error: { code: "CONFLICT", message: "Bunday yozuv allaqachon mavjud" } });
    if (err.code === "P2003") return reply.status(409).send({ error: { code: "CONFLICT", message: "Bogʻliq maʼlumot mavjud" } });
  }
  const fe = err as FastifyError;
  if (fe.statusCode === 429) {
    return reply.status(429).send({ error: { code: "RATE_LIMIT", message: "Juda koʻp urinish. Birozdan keyin qayta urinib koʻring" } });
  }
  if (fe.code === "FST_REQ_FILE_TOO_LARGE") {
    return reply.status(413).send({ error: { code: "FILE_TOO_LARGE", message: "Fayl hajmi juda katta" } });
  }
  if (fe.validation || (fe.statusCode && fe.statusCode < 500)) {
    return reply.status(fe.statusCode ?? 400).send({ error: { code: fe.code ?? "BAD_REQUEST", message: fe.message } });
  }
  req.log.error(err);
  return reply.status(500).send({ error: { code: "INTERNAL", message: "Serverda xatolik yuz berdi" } });
}
