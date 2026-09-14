// Tashqi qurilmalar integratsiyasi. Turniket: POST /api/integrations/turnstile
// Autentifikatsiya: X-Api-Key == TURNSTILE_API_KEY (doimiy vaqtli taqqoslash). Kalit sozlanmagan boʻlsa — 404.
import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { writeAudit } from "../lib/audit.js";
import { awardCoins, coinRef, touchStreak } from "../lib/coins.js";
import { badRequest, notFound, unauthorized } from "../lib/errors.js";
import { parse } from "../lib/http.js";
import { notifyParents } from "../lib/notify.js";
import { fmtTime, fmtTimeRange } from "../bot/format.js";

export const TURNSTILE = {
  earlyWindowMin: 60, // darsdan 60 daqiqa oldin kirgan ham shu darsga hisoblanadi
  lateAfterMin: 10, // boshlanganidan 10 daqiqadan keyin — LATE
};

const bodySchema = z.object({
  turnstileId: z.string().trim().min(1).max(64),
  at: z.string().trim().max(40).optional(),
  direction: z.enum(["in", "out"]).default("in"),
});

function keyMatches(given: unknown, expected: string) {
  if (typeof given !== "string" || !given) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** ISO vaqt; offset boʻlmasa Toshkent vaqti deb qabul qilinadi ("2024-05-24T13:55:00"). */
function parseAt(raw: string | undefined, now: Date) {
  if (!raw) return now;
  const local = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/.test(raw);
  const d = new Date(local ? `${raw}+05:00` : raw);
  if (Number.isNaN(d.getTime())) throw badRequest("at: ISO vaqt formatida boʻlsin (2024-05-24T13:55:00+05:00)");
  if (d.getTime() > now.getTime() + 10 * 60_000) throw badRequest("at: vaqt kelajakda boʻlishi mumkin emas");
  if (d.getTime() < now.getTime() - 3 * 86_400_000) throw badRequest("at: 3 kundan eski hodisa qabul qilinmaydi");
  return d;
}

type Ctx = { ip: string | null; userAgent: string | null };

/**
 * Turniketdan kirish: bugungi dars (startsAt−60 daq … endsAt) topiladi, davomat PRESENT/LATE qilinadi,
 * tanga + seriya, ota-onaga xabar, audit. Ustoz qoʻlda qoʻygan belgi hech qachon oʻzgartirilmaydi.
 */
export async function registerTurnstileArrival(studentId: string, fullName: string, at: Date, ctx: Ctx) {
  const lesson = await prisma.lesson.findFirst({
    where: {
      status: { not: "CANCELLED" },
      startsAt: { lte: new Date(at.getTime() + TURNSTILE.earlyWindowMin * 60_000) },
      endsAt: { gte: at },
      group: { students: { some: { studentId, status: "ACTIVE" } } },
    },
    orderBy: { startsAt: "asc" },
    select: { id: true, groupId: true, startsAt: true, endsAt: true, group: { select: { name: true } } },
  });
  if (!lesson) return { ok: true, matched: false, action: "no_lesson" as const };

  const status = at.getTime() > lesson.startsAt.getTime() + TURNSTILE.lateAfterMin * 60_000 ? "LATE" : "PRESENT";
  const time = fmtTime(at);
  let result: { ok: true; matched: true; action: "created" | "duplicate" | "kept_manual"; lessonId: string; status: string };
  try {
    result = await prisma.$transaction(async (tx) => {
      const existing = await tx.attendance.findUnique({ where: { lessonId_studentId: { lessonId: lesson.id, studentId } } });
      if (existing) {
        // qoʻlda qoʻyilgan belgi saqlanadi; faqat kelgan vaqti boʻsh boʻlsa toʻldiriladi
        if (existing.source !== "TURNSTILE" && !existing.arrivedAt && (existing.status === "PRESENT" || existing.status === "LATE")) {
          await tx.attendance.update({ where: { id: existing.id }, data: { arrivedAt: at } });
        }
        return {
          ok: true as const, matched: true as const, lessonId: lesson.id, status: existing.status,
          action: existing.source === "TURNSTILE" ? ("duplicate" as const) : ("kept_manual" as const),
        };
      }
      const att = await tx.attendance.create({
        data: { lessonId: lesson.id, studentId, status, arrivedAt: at, source: "TURNSTILE" },
      });
      await awardCoins(tx, { studentId, reason: "ATTENDANCE", groupId: lesson.groupId, ...coinRef.lesson(lesson.id), at });
      await notifyParents(tx, studentId, {
        type: "attendance.arrived",
        title: "Markazga keldi",
        body: `${fullName} ${time} da markazga keldi. Dars: ${lesson.group.name}, ${fmtTimeRange(lesson.startsAt, lesson.endsAt)}.`,
        link: "/ota-ona",
        payload: { lessonId: lesson.id, attendanceId: att.id, status },
      });
      await writeAudit(tx, {
        actorId: null, actorRole: null, ip: ctx.ip, userAgent: ctx.userAgent,
        action: "attendance.turnstile", entityType: "Attendance", entityId: att.id,
        summary: `${fullName} turniketdan oʻtdi (${time}) — ${lesson.group.name}: ${status === "LATE" ? "kechikib keldi" : "keldi"}`,
        after: { lessonId: lesson.id, studentId, status, arrivedAt: at.toISOString(), source: "TURNSTILE" },
      });
      return { ok: true as const, matched: true as const, action: "created" as const, lessonId: lesson.id, status };
    });
  } catch (e) {
    // bir vaqtda ikki oʻtish — ikkinchisi takror
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: true, matched: true, action: "duplicate" as const, lessonId: lesson.id };
    }
    throw e;
  }
  if (result.action === "created") {
    // Seriya alohida: touchStreak ichidagi takroriy tanga (P2002) asosiy tranzaksiyani buzmasin
    await touchStreak(prisma, studentId, at).catch(() => {});
  }
  return result;
}

export default async function integrationsRoutes(app: FastifyInstance) {
  app.post("/turnstile", { config: { rateLimit: { max: 3000, timeWindow: "1 minute" } } }, async (req) => {
    const expected = config.TURNSTILE_API_KEY;
    if (!expected) throw notFound("Topilmadi");
    if (!keyMatches(req.headers["x-api-key"], expected)) throw unauthorized("API kalit notoʻgʻri", "INVALID_API_KEY");
    const body = parse(bodySchema, req.body);
    const at = parseAt(body.at, new Date());
    const profile = await prisma.studentProfile.findUnique({
      where: { turnstileId: body.turnstileId },
      select: { userId: true, user: { select: { fullName: true, isActive: true } } },
    });
    if (!profile || !profile.user.isActive) throw notFound("Bu turniket ID boʻyicha oʻquvchi topilmadi");
    // Chiqish hozircha faqat qabul qilinadi (modelda chiqish vaqti yoʻq)
    if (body.direction === "out") return { ok: true, matched: false, action: "ignored" };
    const r = await registerTurnstileArrival(profile.userId, profile.user.fullName, at, {
      ip: req.ip, userAgent: req.headers["user-agent"]?.slice(0, 300) ?? null,
    });
    req.log.info({ turnstileId: body.turnstileId, ...r }, "Turniket hodisasi");
    return r;
  });
}
