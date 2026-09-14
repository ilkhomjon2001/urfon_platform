import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { randomBytes } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { File as DbFile } from "@prisma/client";
import { config } from "../config.js";
import type { Db } from "../db.js";
import { badRequest } from "./errors.js";

// Ruxsat etilgan turlar (kengaytma → MIME). Bajariladigan fayllar qabul qilinmaydi.
const ALLOWED: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".webm": "audio/webm", // brauzerda yozilgan ovoz (MediaRecorder)
  ".mp4": "video/mp4",
  ".zip": "application/zip",
};

export type FileLinks = { submissionId?: string; homeworkId?: string; messageId?: string };

function safeName(name: string) {
  const base = path.basename(name).normalize("NFC").replace(/[^\p{L}\p{N}\p{M}._ ()[\],&+#—–-]+/gu, "_").slice(-120);
  return base || "fayl";
}

function keyFor(name: string) {
  const d = new Date();
  const dir = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return `${dir}/${randomBytes(12).toString("hex")}${path.extname(name).toLowerCase()}`;
}

function mimeFor(name: string) {
  const ext = path.extname(name).toLowerCase();
  const mime = ALLOWED[ext];
  if (!mime) throw badRequest(`Bu turdagi fayl qabul qilinmaydi (${ext || "kengaytmasiz"})`, "FILE_TYPE");
  return mime;
}

const absPath = (key: string) => {
  const p = path.resolve(config.uploadDir, key);
  if (!p.startsWith(path.resolve(config.uploadDir))) throw badRequest("Notoʻgʻri fayl yoʻli");
  return p;
};

/** Tayyor Buffer'ni saqlaydi (seed, generatsiya qilingan hisobotlar uchun). */
export async function saveBuffer(db: Db, buf: Buffer, meta: { originalName: string; mime?: string; uploadedById: string } & FileLinks) {
  const originalName = safeName(meta.originalName);
  const mime = meta.mime ?? mimeFor(originalName);
  const storageKey = keyFor(originalName);
  const p = absPath(storageKey);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, buf);
  return db.file.create({
    data: {
      originalName, mime, size: buf.length, storageKey, uploadedById: meta.uploadedById,
      submissionId: meta.submissionId, homeworkId: meta.homeworkId, messageId: meta.messageId,
    },
  });
}

/**
 * multipart/form-data so'rovidagi barcha fayllarni saqlaydi va oddiy maydonlarni qaytaradi.
 * Foydalanish: const { files, fields } = await saveMultipart(req, db, { homeworkId })
 */
export async function saveMultipart(req: FastifyRequest, db: Db, links: FileLinks = {}, maxFiles = 5) {
  const files: DbFile[] = [];
  const fields: Record<string, string> = {};
  for await (const part of req.parts()) {
    if (part.type === "field") {
      fields[part.fieldname] = String(part.value);
      continue;
    }
    if (files.length >= maxFiles) throw badRequest(`Koʻpi bilan ${maxFiles} ta fayl`);
    const originalName = safeName(part.filename);
    const mime = mimeFor(originalName);
    const storageKey = keyFor(originalName);
    const p = absPath(storageKey);
    await mkdir(path.dirname(p), { recursive: true });
    await pipeline(part.file, createWriteStream(p));
    if (part.file.truncated) {
      await unlink(p).catch(() => {});
      throw badRequest(`Fayl hajmi ${config.MAX_UPLOAD_MB} MB dan oshmasin`, "FILE_TOO_LARGE");
    }
    const { size } = await stat(p);
    files.push(
      await db.file.create({
        data: { originalName, mime, size, storageKey, uploadedById: req.auth.userId, ...links },
      }),
    );
  }
  return { files, fields };
}

/** Faylni javob sifatida yuboradi (ruxsat oldin tekshirilgan bo'lishi kerak). */
export async function sendFile(reply: FastifyReply, f: DbFile, inline = true) {
  const p = absPath(f.storageKey);
  const st = await stat(p).catch(() => null);
  if (!st?.isFile()) {
    return reply.status(404).send({ error: { code: "FILE_MISSING", message: "Fayl serverda topilmadi" } });
  }
  const encoded = encodeURIComponent(f.originalName);
  const inlineOk = inline && /^(image|audio|video)\/|^application\/pdf$/.test(f.mime);
  reply
    .header("Content-Type", f.mime)
    .header("Content-Length", st.size)
    .header("Content-Disposition", `${inlineOk ? "inline" : "attachment"}; filename*=UTF-8''${encoded}`)
    .header("Cache-Control", "private, max-age=3600")
    .header("X-Content-Type-Options", "nosniff");
  return reply.send(createReadStream(p));
}

/**
 * POST /api/files orqali oldin yuklangan fayllarni obyektga bog'laydi.
 * Faqat shu foydalanuvchi yuklagan va hali bog'lanmagan fayllar qabul qilinadi.
 */
export async function attachFiles(db: Db, fileIds: string[], uploadedById: string, links: FileLinks) {
  if (!fileIds.length) return 0;
  const r = await db.file.updateMany({
    where: { id: { in: fileIds }, uploadedById, submissionId: null, homeworkId: null, messageId: null, material: { is: null } },
    data: links,
  });
  if (r.count !== fileIds.length) throw badRequest("Fayl topilmadi yoki allaqachon ishlatilgan");
  return r.count;
}

export async function deleteStored(f: Pick<DbFile, "storageKey">) {
  await unlink(absPath(f.storageKey)).catch(() => {});
}
