import { randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { authenticate, issueRefresh } from "../lib/auth.js";
import { writeAudit } from "../lib/audit.js";
import { badRequest } from "../lib/errors.js";
import { auditCtx, parse } from "../lib/http.js";
import { unreadMessageCount } from "../lib/messaging.js";
import { hashPassword, passwordRule, verifyPassword } from "../lib/password.js";
import { buildUserDto } from "../lib/user-dto.js";

export default async function meRoutes(app: FastifyInstance) {
  app.addHook("onRequest", authenticate);

  app.get("/", async (req) => buildUserDto(req.auth.userId));

  // Sidebar badge'lari: kalitlar web/src/components/shell/nav.ts dagi nav kalitlari bilan bir xil
  app.get("/nav-badges", async (req) => {
    const { userId, role } = req.auth;
    const now = new Date();
    if (role === "ADMIN") {
      const [groups, teachers, students, overdue] = await Promise.all([
        prisma.group.count({ where: { status: { not: "FINISHED" } } }),
        prisma.user.count({ where: { role: "TEACHER", isActive: true } }),
        prisma.studentProfile.count(),
        prisma.payment.count({ where: { status: "OVERDUE" } }),
      ]);
      return { groups, teachers, students, payments: overdue ? `${overdue} kechikkan` : 0 };
    }
    if (role === "TEACHER") {
      const [homework, messages] = await Promise.all([
        prisma.submission.count({ where: { status: "SUBMITTED", homework: { group: { teacherId: userId } } } }),
        unreadMessageCount(userId),
      ]);
      return { homework, messages };
    }
    if (role === "PARENT") {
      const kids = await prisma.parentStudent.findMany({ where: { parentId: userId }, select: { studentId: true } });
      let homework = 0;
      for (const { studentId } of kids) homework += await openHomeworkCount(studentId, now);
      return { homework, contact: await unreadMessageCount(userId) };
    }
    const open = await openHomeworkCount(userId, now);
    return { homework: open ? `${open} yangi` : 0, chat: await unreadMessageCount(userId) };
  });

  app.get("/notifications", async (req) => {
    const items = await prisma.notification.findMany({
      where: { userId: req.auth.userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, type: true, title: true, body: true, link: true, createdAt: true, readAt: true },
    });
    const unread = await prisma.notification.count({ where: { userId: req.auth.userId, readAt: null } });
    return { items, unread };
  });

  app.post("/notifications/read", async (req) => {
    const body = parse(z.object({ ids: z.array(z.string()).max(100).optional(), all: z.boolean().optional() }), req.body);
    const where = body.all ? { userId: req.auth.userId, readAt: null } : { userId: req.auth.userId, id: { in: body.ids ?? [] } };
    const r = await prisma.notification.updateMany({ where, data: { readAt: new Date() } });
    return { updated: r.count };
  });

  app.post("/password", { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } }, async (req, reply) => {
    const body = parse(
      z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(passwordRule.min, passwordRule.message).max(200) }),
      req.body,
    );
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.auth.userId } });
    if (!(await verifyPassword(user.passwordHash, body.currentPassword))) throw badRequest("Joriy parol notoʻgʻri", "WRONG_PASSWORD");
    if (body.currentPassword === body.newPassword) throw badRequest("Yangi parol eskisidan farq qilsin");
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(body.newPassword), mustChangePassword: false } });
      // boshqa qurilmalardagi (ehtimol o'g'irlangan) sessiyalar bekor qilinadi
      const s = await tx.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
      await writeAudit(tx, {
        ...auditCtx(req), action: "auth.password_change", entityType: "User", entityId: user.id, summary: "Parol oʻzgartirildi",
        after: { revokedSessions: s.count },
      });
    });
    // joriy qurilma uchun yangi refresh sessiya (cookie path /api/auth — shu javob orqali o'rnatiladi)
    await issueRefresh(reply, req, user.id);
    return { ok: true };
  });

  // Telegram botni ulash: bir martalik kod → t.me/<bot>?start=<code>
  app.post("/telegram-link", async (req) => {
    const code = randomBytes(9).toString("base64url");
    await prisma.telegramLinkCode.create({
      data: { code, userId: req.auth.userId, expiresAt: new Date(Date.now() + 30 * 60_000) },
    });
    return { code, url: `https://t.me/${config.TELEGRAM_BOT_USERNAME}?start=${code}`, expiresInMin: 30 };
  });
}

async function openHomeworkCount(studentId: string, now: Date) {
  return prisma.homework.count({
    where: {
      dueAt: { gte: now },
      group: { students: { some: { studentId, status: "ACTIVE" } } },
      submissions: { none: { studentId, status: { in: ["SUBMITTED", "REVIEWED"] } } },
    },
  });
}
