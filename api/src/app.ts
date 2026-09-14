import { existsSync } from "node:fs";
import path from "node:path";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { errorHandler } from "./lib/errors.js";
import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js";
import filesRoutes from "./routes/files.js";
import messagesRoutes from "./routes/messages.js";
import integrationsRoutes from "./routes/integrations.js";
import adminRoutes from "./routes/admin/index.js";
import teacherRoutes from "./routes/teacher/index.js";
import parentRoutes from "./routes/parent/index.js";
import studentRoutes from "./routes/student/index.js";

export async function buildApp() {
  const app = Fastify({
    logger: config.isProd
      ? { level: "info", redact: ["req.headers.authorization", "req.headers.cookie"] }
      : { level: "info", transport: undefined },
    // X-Forwarded-For faqat lokal/xususiy tarmoqdagi proxy'dan (Caddy docker tarmog'ida) qabul qilinadi —
    // aks holda soxta sarlavha bilan login rate-limit'ini chetlab o'tish mumkin
    trustProxy: config.TRUST_PROXY,
    bodyLimit: 1024 * 1024,
  });

  await app.register(helmet, {
    contentSecurityPolicy: config.isProd
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            mediaSrc: ["'self'", "blob:"],
            fontSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            frameAncestors: ["'none'"],
            objectSrc: ["'none'"],
            // HTTPS bo'lmasa brauzer resurslarni https ga "ko'tarib" sindirib qo'ymasin
            upgradeInsecureRequests: config.secureCookies ? [] : null,
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    hsts: config.secureCookies ? undefined : false,
  });
  await app.register(cors, { origin: config.isProd ? config.APP_ORIGIN : true, credentials: true });
  await app.register(cookie);
  await app.register(rateLimit, { max: 600, timeWindow: "1 minute" });
  await app.register(multipart, { limits: { fileSize: config.MAX_UPLOAD_MB * 1024 * 1024, files: 5, fields: 20 } });
  app.setErrorHandler(errorHandler);

  app.get("/api/health", async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, time: new Date().toISOString() };
  });

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(meRoutes, { prefix: "/api/me" });
  await app.register(filesRoutes, { prefix: "/api/files" });
  await app.register(messagesRoutes, { prefix: "/api/messages" });
  await app.register(integrationsRoutes, { prefix: "/api/integrations" });
  // Rol bo'yicha qat'iy ajratilgan API: har bir prefiks o'z rolini talab qiladi (routes/<rol>/index.ts)
  await app.register(adminRoutes, { prefix: "/api/admin" });
  await app.register(teacherRoutes, { prefix: "/api/teacher" });
  await app.register(parentRoutes, { prefix: "/api/parent" });
  await app.register(studentRoutes, { prefix: "/api/student" });

  // Production: web/dist ni shu server beradi (SPA fallback)
  const webDist = config.WEB_DIST ? path.resolve(config.WEB_DIST) : null;
  if (webDist && existsSync(webDist)) {
    await app.register(fastifyStatic, {
      root: webDist,
      wildcard: false,
      // /assets/* nomida hash bor — o'zgarmaydi; index.html va boshqalar qisqa keshda
      setHeaders: (res, filePath) => {
        res.setHeader(
          "Cache-Control",
          /[\\/]assets[\\/]/.test(filePath) ? "public, max-age=31536000, immutable" : "no-cache",
        );
      },
    });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith("/api/")) return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Topilmadi" } });
      return reply.header("Cache-Control", "no-cache").sendFile("index.html");
    });
  } else {
    app.setNotFoundHandler((_req, reply) => reply.status(404).send({ error: { code: "NOT_FOUND", message: "Topilmadi" } }));
  }

  return app;
}
