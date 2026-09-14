import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { canAccessFile } from "../lib/access.js";
import { authenticate } from "../lib/auth.js";
import { notFound } from "../lib/errors.js";
import { idParam, parse } from "../lib/http.js";
import { saveMultipart, sendFile } from "../lib/storage.js";

export default async function filesRoutes(app: FastifyInstance) {
  app.addHook("onRequest", authenticate);

  // Umumiy yuklash: fayl hali hech narsaga bog'lanmagan bo'ladi; keyin attachFiles() bilan bog'lanadi.
  app.post("/", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (req) => {
    const { files } = await saveMultipart(req, prisma);
    return { files: files.map((f) => ({ id: f.id, originalName: f.originalName, mime: f.mime, size: f.size })) };
  });

  app.get("/:id", async (req, reply) => {
    const { id } = parse(idParam, req.params);
    const f = await canAccessFile(req.auth, id);
    if (!f) throw notFound("Fayl topilmadi");
    if (f.material) await prisma.material.updateMany({ where: { fileId: f.id }, data: { downloads: { increment: 1 } } });
    const download = (req.query as Record<string, string>)?.download === "1";
    return sendFile(reply, f, !download);
  });
}
