import type { CoinReason } from "@prisma/client";
import type { Db } from "../db.js";
import { GAMIFICATION, type RuleKey, ruleAmount, stageOf } from "../config/gamification.js";
import { addDays, dbDateYmd, toDbDate, ymdTz } from "./dates.js";

/**
 * Tanga hodisalari uchun YAGONA ref konvensiyasi (idempotentlik shunga tayanadi):
 *   ATTENDANCE   → coinRef.lesson(lessonId)      (bir darsga bir marta; faqat oʻz vaqtida kelganda)
 *   ACTIVITY     → coinRef.lesson(lessonId)      (bir darsga bir marta; o'zgartirish = revoke + award)
 *   GRADE        → coinRef.grade(gradeId) yoki coinRef.exam(examResultId)  (baho oʻzgarsa revoke + award)
 *   CONTEST / PRESENTATION → coinRef.award(yangi id) (admin qoʻlda beradi)
 *   MANUAL / SPEND → ref ixtiyoriy (izoh majburiy)
 * HOMEWORK_ON_TIME va STREAK — eski qoidalar (tarixda qoladi, endi berilmaydi).
 */
export const coinRef = {
  lesson: (lessonId: string) => ({ refType: "lesson", refId: lessonId }),
  submission: (submissionId: string) => ({ refType: "submission", refId: submissionId }),
  day: (ymd: string) => ({ refType: "day", refId: ymd }),
  grade: (gradeId: string) => ({ refType: "grade", refId: gradeId }),
  exam: (resultId: string) => ({ refType: "exam_result", refId: resultId }),
  award: (id: string) => ({ refType: "award", refId: id }),
};

type Award = {
  studentId: string;
  reason: CoinReason;
  /** jadval qoidasi (ATTENDANCE, GRADE_*, musobaqalar…) — kumush bosqichga qarab hisoblanadi */
  rule?: RuleKey;
  amount?: number; // ACTIVITY/MANUAL uchun majburiy
  groupId?: string | null;
  refType?: string | null;
  refId?: string | null;
  note?: string | null;
  createdById?: string | null;
  at?: Date;
};

async function amountFor(db: Db, a: Award): Promise<{ amount: number; xp: number }> {
  if (a.rule) {
    const p = await db.studentProfile.findUnique({ where: { userId: a.studentId }, select: { xp: true } });
    const { xp, kumush } = ruleAmount(a.rule, stageOf(p?.xp ?? 0));
    return { amount: kumush, xp };
  }
  switch (a.reason) {
    case "ACTIVITY": {
      const c = GAMIFICATION.activity;
      const v = Math.round(a.amount ?? 0);
      if (v < c.min || v > c.max) throw new Error(`Faollik tangasi ${c.min}…${c.max} oraligʻida boʻlishi kerak`);
      return { amount: v, xp: v };
    }
    case "MANUAL":
    case "SPEND":
      if (!a.amount) throw new Error("Tanga miqdori koʻrsatilmagan");
      return { amount: Math.round(a.amount), xp: 0 };
    default:
      throw new Error(`${a.reason} uchun qoida (rule) koʻrsatilmagan`);
  }
}

/**
 * Tanga (kumush) va XP beradi. Idempotent: bir hodisa (studentId+reason+refType+refId) uchun bir marta.
 * ON CONFLICT DO NOTHING ishlatiladi — tranzaksiya ichida ham xavfsiz (Postgres tranzaksiyasini buzmaydi).
 * Qaytaradi: yangi tranzaksiya yoki null (allaqachon berilgan).
 */
export async function awardCoins(db: Db, a: Award) {
  const { amount, xp } = await amountFor(db, a);
  const data = {
    studentId: a.studentId, groupId: a.groupId ?? null, amount, xp, reason: a.reason,
    refType: a.refType ?? null, refId: a.refId ?? null, note: a.note ?? null,
    createdById: a.createdById ?? null, ...(a.at ? { createdAt: a.at } : {}),
  };
  const r = await db.coinTransaction.createMany({ data: [data], skipDuplicates: true });
  if (r.count === 0) return null;
  await db.studentProfile.update({ where: { userId: a.studentId }, data: { coinBalance: { increment: amount }, xp: { increment: xp } } });
  return db.coinTransaction.findFirst({
    where: { studentId: a.studentId, reason: a.reason, refType: data.refType, refId: data.refId },
    orderBy: { createdAt: "desc" },
  });
}

/** Baho uchun tanga: eski yozuvni bekor qilib, yangi baho boʻyicha qayta beradi. Qaytaradi: berilgan kumush. */
export async function syncGradeCoins(
  db: Db,
  g: { studentId: string; groupId?: string | null; ref: { refType: string; refId: string }; rule: RuleKey | null; note?: string | null; createdById?: string | null },
) {
  const old = await db.coinTransaction.findFirst({ where: { studentId: g.studentId, reason: "GRADE", ...g.ref } });
  if (old) await revokeCoins(db, g.studentId, "GRADE", g.ref.refType, g.ref.refId);
  if (!g.rule) return 0;
  const t = await awardCoins(db, { studentId: g.studentId, reason: "GRADE", rule: g.rule, groupId: g.groupId, ...g.ref, note: g.note, createdById: g.createdById });
  return t?.amount ?? 0;
}

/** Berilgan tangani bekor qiladi (masalan, davomat PRESENT → ABSENT o'zgarganda). */
export async function revokeCoins(db: Db, studentId: string, reason: CoinReason, refType: string, refId: string) {
  const t = await db.coinTransaction.findFirst({ where: { studentId, reason, refType, refId } });
  if (!t) return null;
  await db.coinTransaction.delete({ where: { id: t.id } });
  await db.studentProfile.update({ where: { userId: studentId }, data: { coinBalance: { decrement: t.amount }, xp: { decrement: t.xp } } });
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
  await db.studentProfile.updateMany({
    where: { userId: studentId, streakDays: p.streakDays, lastStreakDate: p.lastStreakDate },
    data: { streakDays: streak, lastStreakDate: toDbDate(today) },
  });
  // Kunlik seriya hisoblanadi va koʻrsatiladi, lekin 2026-09-21 dan tanga berilmaydi (jadvalda yoʻq)
}

/** Jami tajriba (XP) — bosqich shunga qarab. Doʻkonda xarid qilish XP ni kamaytirmaydi. */
export async function earnedTotal(db: Db, studentId: string) {
  const p = await db.studentProfile.findUnique({ where: { userId: studentId }, select: { xp: true } });
  return p?.xp ?? 0;
}
