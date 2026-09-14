import { createHash, randomBytes } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { forbidden, unauthorized } from "./errors.js";

export type AuthUser = { userId: string; role: Role; fullName: string };

declare module "fastify" {
  interface FastifyRequest {
    auth: AuthUser;
  }
}

const secret = new TextEncoder().encode(config.JWT_SECRET);
const ISS = "urfon";

export async function signAccess(u: { id: string; role: Role }) {
  return new SignJWT({ role: u.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(u.id)
    .setIssuer(ISS)
    .setIssuedAt()
    .setExpirationTime(`${config.accessTtlSec}s`)
    .sign(secret);
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Yangi refresh token: bazada faqat hash saqlanadi, brauzerga httpOnly cookie. */
export async function issueRefresh(reply: FastifyReply, req: FastifyRequest, userId: string) {
  const token = randomBytes(32).toString("base64url");
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + config.refreshTtlDays * 86_400_000),
      userAgent: req.headers["user-agent"]?.slice(0, 300) ?? null,
      ip: req.ip,
    },
  });
  reply.setCookie(config.refreshCookie, token, {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: config.refreshTtlDays * 86_400,
  });
  return session;
}

export function clearRefresh(reply: FastifyReply) {
  reply.clearCookie(config.refreshCookie, { path: "/api/auth" });
}

/**
 * Refresh token rotatsiyasi. Bekor qilingan token qayta ishlatilsa (o'g'irlik belgisi),
 * foydalanuvchining barcha sessiyalari bekor qilinadi.
 */
export async function rotateRefresh(req: FastifyRequest, reply: FastifyReply) {
  const token = req.cookies[config.refreshCookie];
  if (!token) throw unauthorized();
  const s = await prisma.session.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
  if (!s) throw unauthorized();
  if (s.revokedAt) {
    // Faqat ROTATSIYA qilingan (replacedBy bor) tokenning qayta ishlatilishi o'g'irlik belgisi.
    // Logout yoki parol o'zgarishi bilan bekor qilingan token — shunchaki eskirgan sessiya
    // (aks holda eski qurilma urinishi foydalanuvchining yangi sessiyasini ham o'chirib yuborardi).
    // 10 soniya ichidagi parallel so'rovlar (bir nechta tab) ham o'g'irlik emas.
    const theft = !!s.replacedBy && Date.now() - s.revokedAt.getTime() >= 10_000;
    if (theft) await prisma.session.updateMany({ where: { userId: s.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    clearRefresh(reply);
    throw unauthorized("Sessiya tugagan, qayta kiring");
  }
  if (s.expiresAt < new Date() || !s.user.isActive) {
    clearRefresh(reply);
    throw unauthorized("Sessiya tugagan, qayta kiring");
  }
  const next = await issueRefresh(reply, req, s.userId);
  await prisma.session.update({ where: { id: s.id }, data: { revokedAt: new Date(), replacedBy: next.id } });
  return s.user;
}

export async function revokeRefresh(req: FastifyRequest) {
  const token = req.cookies[config.refreshCookie];
  if (token) await prisma.session.updateMany({ where: { tokenHash: sha256(token), revokedAt: null }, data: { revokedAt: new Date() } });
}

/** onRequest hook: Bearer access token → req.auth. Faol bo'lmagan foydalanuvchi darhol bloklanadi. */
export async function authenticate(req: FastifyRequest) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) throw unauthorized();
  let sub: string, role: Role;
  try {
    const { payload } = await jwtVerify(h.slice(7), secret, { issuer: ISS, algorithms: ["HS256"] });
    sub = payload.sub as string;
    role = payload.role as Role;
  } catch {
    throw unauthorized("Sessiya muddati tugagan", "TOKEN_EXPIRED");
  }
  const user = await prisma.user.findUnique({
    where: { id: sub },
    select: { id: true, role: true, fullName: true, isActive: true, mustChangePassword: true },
  });
  if (!user || !user.isActive || user.role !== role) throw unauthorized();
  // Vaqtinchalik parol bilan faqat /api/me (profil, parolni o'zgartirish) ishlaydi
  if (user.mustChangePassword && !req.url.startsWith("/api/me")) {
    throw forbidden("Avval vaqtinchalik parolni oʻzgartiring", "PASSWORD_CHANGE_REQUIRED");
  }
  req.auth = { userId: user.id, role: user.role, fullName: user.fullName };
}

export const requireRole = (...roles: Role[]) => async (req: FastifyRequest) => {
  if (!req.auth || !roles.includes(req.auth.role)) throw forbidden();
};

/** Login maydonini normallashtirish: "+998 90 123-45-67" → "+998901234567", "st8492" → "ST-8492". */
export function normalizeLogin(raw: string) {
  const s = raw.trim();
  const st = s.match(/^st[\s-]?(\d{3,6})$/i);
  if (st) return `ST-${st[1]}`;
  const digits = s.replace(/[^\d]/g, "");
  if (/^[+\d\s()-]+$/.test(s) && digits.length >= 9) {
    if (digits.length === 9) return `+998${digits}`;
    return `+${digits}`;
  }
  return s.toLowerCase();
}
