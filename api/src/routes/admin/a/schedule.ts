// admin-a yordamchilari: guruh jadvali, vaqt to'qnashuvi, dars jadvalini generatsiya qilish.
// (groups.ts, teachers.ts, lookups.ts, dashboard.ts shu fayldan foydalanadi)
import type { GroupStatus } from "@prisma/client";
import type { Db, Tx } from "../../../db.js";
import { addDays, atTz, dbDateYmd, isoWeekdayTz, toDbDate, ymdTz } from "../../../lib/dates.js";

export const WEEKDAYS_SHORT = ["Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"] as const;

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** "Du · Cho · Ju, 14:00–15:30" */
export function scheduleText(days: number[], start: string, end: string) {
  const names = [...days].sort((a, b) => a - b).map((d) => WEEKDAYS_SHORT[d - 1]).join(" · ");
  return `${names}, ${start}–${end}`;
}

/** Guruhning haftalik dars soati: 3 kun × 1.5 soat = 4.5 */
export const weeklyHoursOf = (g: { days: number[]; startTime: string; endTime: string }) =>
  (g.days.length * Math.max(0, toMin(g.endTime) - toMin(g.startTime))) / 60;

export const round1 = (n: number) => Math.round(n * 10) / 10;

export const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 1000) / 10 : null);

export type Slot = {
  days: number[];
  startTime: string;
  endTime: string;
  startDate?: Date | null;
  endDate?: Date | null;
};

/** Ikki haftalik jadval kesishadimi: umumiy kun + vaqt oralig'i kesishuvi + sanalar oralig'i kesishuvi. */
export function slotsOverlap(a: Slot, b: Slot) {
  if (!a.days.some((d) => b.days.includes(d))) return false;
  if (!(toMin(a.startTime) < toMin(b.endTime) && toMin(b.startTime) < toMin(a.endTime))) return false;
  // biri tugagandan keyin ikkinchisi boshlansa — to'qnashuv yo'q
  if (a.endDate && b.startDate && b.startDate > a.endDate) return false;
  if (b.endDate && a.startDate && a.startDate > b.endDate) return false;
  return true;
}

/** Jadvalni band qiluvchi guruh holatlari (yakunlangan guruh jadvalni band qilmaydi). */
export const BUSY_STATUSES: GroupStatus[] = ["ACTIVE", "ENROLLING"];

type ConflictGroup = { id: string; code: string; name: string; days: number[]; startTime: string; endTime: string; startDate: Date; endDate: Date | null };

/** Berilgan jadval bilan to'qnashadigan faol guruhlar (ustoz yoki xona bo'yicha). */
export async function findConflicts(
  db: Db,
  where: { teacherId?: string; roomId?: string },
  slot: Slot,
  excludeGroupId?: string,
): Promise<ConflictGroup[]> {
  const groups = await db.group.findMany({
    where: { ...where, status: { in: BUSY_STATUSES }, ...(excludeGroupId ? { id: { not: excludeGroupId } } : {}) },
    select: { id: true, code: true, name: true, days: true, startTime: true, endTime: true, startDate: true, endDate: true },
  });
  return groups.filter((g) => slotsOverlap(slot, g));
}

export const conflictText = (gs: ConflictGroup[]) =>
  gs.map((g) => `${g.name} (${scheduleText(g.days, g.startTime, g.endTime)})`).join("; ");

/** "L2" → "Level 2 · IELTS Foundation", "KIDS" → "Kids" */
export function levelLabel(lv: { code: string; name: string } | null | undefined) {
  if (!lv) return null;
  const m = lv.code.match(/^L(\d+)$/);
  return m ? `Level ${m[1]} · ${lv.name}` : lv.name;
}

/**
 * Jadval bo'yicha dars vaqtlari: `from` ("YYYY-MM-DD", Toshkent kuni) dan boshlab guruh kunlarida,
 * `after` dan keyin boshlanadiganlari, `count` ta. Vaqtlar atTz(ymd, "HH:MM") bilan quriladi.
 */
export function buildSlots(opts: { days: number[]; startTime: string; endTime: string; from: string; after?: Date; count: number }) {
  const out: { startsAt: Date; endsAt: Date }[] = [];
  if (!opts.days.length || opts.count <= 0) return out;
  let ymd = opts.from;
  for (let guard = 0; out.length < opts.count && guard < 3660; guard++) {
    const dayStart = atTz(ymd, "12:00");
    if (opts.days.includes(isoWeekdayTz(dayStart))) {
      const startsAt = atTz(ymd, opts.startTime);
      if (!opts.after || startsAt > opts.after) out.push({ startsAt, endsAt: atTz(ymd, opts.endTime) });
    }
    ymd = ymdTz(addDays(dayStart, 1));
  }
  return out;
}

/**
 * Guruhning KELAJAKDAGI rejalashtirilgan (PLANNED) darslarini jadvalga moslab qayta quradi.
 * O'tgan, o'tilgan, bekor qilingan va boshlangan darslarga tegilmaydi.
 * Kerakli darslar soni: totalLessons − (o'tgan/o'tilgan, bekor qilinmagan darslar).
 * Mavjud kelajak darslari qayta vaqtlanadi (ularga bog'langan vazifa/material saqlanadi), ortig'i o'chiriladi
 * (bog'liq ma'lumoti bo'lsa — CANCELLED), yetmagani yaratiladi. Oxirgi dars sanasi group.endDate ga yoziladi.
 */
export async function regenerateFutureLessons(
  tx: Tx,
  group: { id: string; days: number[]; startTime: string; endTime: string; startDate: Date; totalLessons: number; roomId: string | null },
  now = new Date(),
) {
  const lessons = await tx.lesson.findMany({
    where: { groupId: group.id },
    orderBy: [{ startsAt: "asc" }],
    select: { id: true, status: true, startsAt: true, number: true },
  });
  const isFuturePlanned = (l: { status: string; startsAt: Date }) => l.status === "PLANNED" && l.startsAt >= now;
  const kept = lessons.filter((l) => !isFuturePlanned(l));
  const future = lessons.filter(isFuturePlanned);
  const keptCounted = kept.filter((l) => l.status !== "CANCELLED");
  const needed = Math.max(0, group.totalLessons - keptCounted.length);
  const lastKept = kept.length ? kept[kept.length - 1].startsAt : null;
  const after = lastKept && lastKept > now ? lastKept : new Date(now.getTime() - 1);
  // group.startDate — @db.Date (dbDateYmd bilan o'qiladi); bugundan oldin bo'lsa, bugundan boshlanadi
  const startYmd = dbDateYmd(group.startDate);
  const todayYmd = ymdTz(now);
  const from = startYmd > todayYmd ? startYmd : todayYmd;
  const slots = buildSlots({ days: group.days, startTime: group.startTime, endTime: group.endTime, from, after, count: needed });

  let number = keptCounted.reduce((m, l) => Math.max(m, l.number ?? 0), keptCounted.length);
  // mavjud kelajak darslarini qayta vaqtlash
  const reuse = Math.min(future.length, slots.length);
  // noyob raqamlar to'qnashmasligi uchun avval barcha kelajak darslarini vaqtincha raqamsiz qilamiz
  if (future.length) await tx.lesson.updateMany({ where: { id: { in: future.map((l) => l.id) } }, data: { number: null } });
  for (let i = 0; i < reuse; i++) {
    number++;
    await tx.lesson.update({
      where: { id: future[i].id },
      data: { startsAt: slots[i].startsAt, endsAt: slots[i].endsAt, roomId: group.roomId, number },
    });
  }
  // yetmaganlarini yaratish
  const toCreate = slots.slice(reuse).map((s) => {
    number++;
    return { groupId: group.id, roomId: group.roomId, number, startsAt: s.startsAt, endsAt: s.endsAt, status: "PLANNED" as const };
  });
  if (toCreate.length) await tx.lesson.createMany({ data: toCreate });
  // ortiqchalarini olib tashlash
  const extra = future.slice(reuse).map((l) => l.id);
  let removed = 0;
  let cancelled = 0;
  if (extra.length) {
    const del = await tx.lesson.deleteMany({
      where: { id: { in: extra }, homework: { none: {} }, materials: { none: {} }, grades: { none: {} }, messages: { none: {} } },
    });
    removed = del.count;
    const rest = await tx.lesson.updateMany({ where: { id: { in: extra } }, data: { status: "CANCELLED" } });
    cancelled = rest.count;
  }
  const last = await tx.lesson.findFirst({
    where: { groupId: group.id, status: { not: "CANCELLED" } },
    orderBy: { startsAt: "desc" },
    select: { startsAt: true },
  });
  const endDate = last ? toDbDate(last.startsAt) : null; // @db.Date — Toshkent kuni
  await tx.group.update({ where: { id: group.id }, data: { endDate } });
  return { rescheduled: reuse, created: toCreate.length, removed, cancelled, endDate };
}

/** Kelajakdagi rejalashtirilgan darslarning xonasini yangilash. */
export async function updateFutureLessonsRoom(tx: Tx, groupId: string, roomId: string | null, now = new Date()) {
  const r = await tx.lesson.updateMany({ where: { groupId, status: "PLANNED", startsAt: { gte: now } }, data: { roomId } });
  return r.count;
}
