import type { CoinReason } from "@prisma/client";
import type { Db } from "../db.js";
import { GAMIFICATION } from "../config/gamification.js";
import { addDays, dbDateYmd, toDbDate, ymdTz } from "./dates.js";

/**
 * Tanga hodisalari uchun YAGONA ref konvensiyasi (idempotentlik shunga tayanadi):
 *   ATTENDANCE        → coinRef.lesson(lessonId)        (bir darsga bir marta)
 *   ACTIVITY          → coinRef.lesson(lessonId)        (bir darsga bir marta; o'zgartirish = revoke + award)
 *   HOMEWORK_ON_TIME  → coinRef.submission(submissionId)
 *   STREAK            → coinRef.day("YYYY-MM-DD")
 *   MANUAL / SPEND    → ref ixtiyoriy (izoh majburiy)
 */
export const coinRef = {
  lesson: (lessonId: string) => ({ refType: "lesson", refId: lessonId }),
  submission: (submissionId: string) => ({ refType: "submission", refId: submissionId }),
  day: (ymd: string) => ({ refType: "day", refId: ymd }),
};

type Award = {
  studentId: string;
  reason: CoinReason;
  amount?: number; // ACTIVITY/MANUAL uchun majburiy; boshqalarida config'dan olinadi
  groupId?: string | null;
  refType?: string | null;
  refId?: string | null;
  note?: string | null;
  createdById?: string | null;
  at?: Date;
};

function amountFor(a: Award): number {
  const c = GAMIFICATION.coins;
  switch (a.reason) {
    case "HOMEWORK_ON_TIME": return c.HOMEWORK_ON_TIME;
    case "ATTENDANCE": return c.ATTENDANCE;
    case "STREAK": return c.STREAK;
    case "ACTIVITY": {
      const v = Math.round(a.amount ?? 0);
      if (v < c.ACTIVITY.min || v > c.ACTIVITY.max) throw new Error(`Faollik tangasi ${c.ACTIVITY.min}…${c.ACTIVITY.max} oraligʻida boʻlishi kerak`);
      return v;
    }
    default:
      if (!a.amount) throw new Error("Tanga miqdori koʻrsatilmagan");
      return Math.round(a.amount);
  }
}

/**
 * Tanga beradi. Idempotent: bir hodisa (studentId+reason+refType+refId) uchun bir marta.
 * ON CONFLICT DO NOTHING ishlatiladi — tranzaksiya ichida ham xavfsiz (Postgres tranzaksiyasini buzmaydi).
 * Qaytaradi: yangi tranzaksiya yoki null (allaqachon berilgan).
 */
export async function awardCoins(db: Db, a: Award) {
  const amount = amountFor(a);
  const data = {
    studentId: a.studentId, groupId: a.groupId ?? null, amount, reason: a.reason,
    refType: a.refType ?? null, refId: a.refId ?? null, note: a.note ?? null,
    createdById: a.createdById ?? null, ...(a.at ? { createdAt: a.at } : {}),
  };
  const r = await db.coinTransaction.createMany({ data: [data], skipDuplicates: true });
  if (r.count === 0) return null;
  await db.studentProfile.update({ where: { userId: a.studentId }, data: { coinBalance: { increment: amount } } });
  return db.coinTransaction.findFirst({
    where: { studentId: a.studentId, reason: a.reason, refType: data.refType, refId: data.refId },
    orderBy: { createdAt: "desc" },
  });
}

/** Berilgan tangani bekor qiladi (masalan, davomat PRESENT → ABSENT o'zgarganda). */
export async function revokeCoins(db: Db, studentId: string, reason: CoinReason, refType: string, refId: string) {
  const t = await db.coinTransaction.findFirst({ where: { studentId, reason, refType, refId } });
  if (!t) return null;
  await db.coinTransaction.delete({ where: { id: t.id } });
  await db.studentProfile.update({ where: { userId: studentId }, data: { coinBalance: { decrement: t.amount } } });
  return t;
}

/** Kunlik seriya: o'quvchi bugun faol bo'lganda chaqiriladi (vazifa topshirish, darsga kelish). Idempotent. */
export async function touchStreak(db: Db, studentId: string, at = new Date()) {
  const p = await db.studentProfile.findUnique({ where: { userId: studentId }, select: { streakDays: true, lastStreakDate: true } });
  if (!p) return;
  const today = ymdTz(at);
  const last = p.lastStreakDate ? dbDateYmd(p.lastStreakDate) : null;
  if (last === today) return;
  const streak = last === ymdTz(addDays(at, -1)) ? p.streakDays + 1 : 1;
  // shartli yangilash: parallel chaqiruvda faqat bittasi o'tadi
  const r = await db.studentProfile.updateMany({
    where: { userId: studentId, streakDays: p.streakDays, lastStreakDate: p.lastStreakDate },
    data: { streakDays: streak, lastStreakDate: toDbDate(today) },
  });
  if (r.count === 1 && streak > 1) {
    await awardCoins(db, { studentId, reason: "STREAK", ...coinRef.day(today), at });
  }
}
