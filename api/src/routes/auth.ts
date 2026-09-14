import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { clearRefresh, issueRefresh, normalizeLogin, revokeRefresh, rotateRefresh, signAccess } from "../lib/auth.js";
import { writeAudit } from "../lib/audit.js";
import { HttpError, unauthorized } from "../lib/errors.js";
import { parse } from "../lib/http.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { buildUserDto } from "../lib/user-dto.js";

const loginBody = z.object({ login: z.string().trim().min(1).max(64), password: z.string().min(1).max(200) });

// Foydalanuvchi topilmaganda ham vaqt bir xil ketishi uchun (login mavjudligini oshkor qilmaslik)
let dummyHash: Promise<string> | null = null;

export default async function authRoutes(app: FastifyInstance) {
  app.post(
    "/login",
    // production: IP boshiga 15 daqiqada 10 urinish; dev'da testlar/skrinshotlar uchun yumshoq
    { config: { rateLimit: { max: config.isProd ? 10 : 500, timeWindow: "15 minutes" } } },
    async (req, reply) => {
      const body = parse(loginBody, req.body);
      const login = normalizeLogin(body.login);
      const user = await prisma.user.findUnique({ where: { login }, include: { studentProfile: { select: { status: true } } } });
      if (user) {
        // akkaunt bo'yicha qulf: IP almashtirib parol terish (brute-force) ham to'xtaydi
        const recentFails = await prisma.auditLog.count({
          where: { actorId: user.id, action: "auth.login_failed", at: { gte: new Date(Date.now() - 15 * 60_000) } },
        });
        if (recentFails >= 10) {
          throw new HttpError(429, "ACCOUNT_LOCKED", "Juda koʻp notoʻgʻri urinish. 15 daqiqadan keyin qayta urinib koʻring");
        }
      }
      dummyHash ??= hashPassword("dummy-password-for-timing");
      const ok = user ? await verifyPassword(user.passwordHash, body.password) : (await verifyPassword(await dummyHash, body.password), false);
      const blocked = !!user && (!user.isActive || user.studentProfile?.status === "LEFT");
      if (!user || !ok || blocked) {
        if (user) {
          await writeAudit(prisma, {
            actorId: user.id, actorRole: user.role, action: "auth.login_failed", entityType: "User", entityId: user.id,
            summary: user.isActive ? "Notoʻgʻri parol" : "Bloklangan akkaunt bilan kirish urinishi", ip: req.ip,
            userAgent: req.headers["user-agent"]?.slice(0, 300),
          });
        }
        throw unauthorized("Login yoki parol notoʻgʻri", "INVALID_CREDENTIALS");
      }
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      await issueRefresh(reply, req, user.id);
      return { accessToken: await signAccess(user), user: await buildUserDto(user.id) };
    },
  );

  app.post("/refresh", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (req, reply) => {
    const user = await rotateRefresh(req, reply);
    return { accessToken: await signAccess(user), user: await buildUserDto(user.id) };
  });

  app.post("/logout", async (req, reply) => {
    await revokeRefresh(req);
    clearRefresh(reply);
    return reply.status(204).send();
  });
}
