// Markaz vaqti: Asia/Tashkent (UTC+5, yozgi vaqt yo'q). Server UTC'da ishlasa ham kun chegarasi shu bo'yicha.
const OFFSET_MS = 5 * 3600_000;

/** Toshkent vaqti bo'yicha kun boshi (UTC Date sifatida). */
export function startOfDayTz(d: Date = new Date()) {
  const local = new Date(d.getTime() + OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - OFFSET_MS);
}

export function endOfDayTz(d: Date = new Date()) {
  return new Date(startOfDayTz(d).getTime() + 86_400_000 - 1);
}

/** Toshkent vaqti bo'yicha "YYYY-MM-DD". */
export function ymdTz(d: Date = new Date()) {
  return new Date(d.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

/** Toshkent vaqti bo'yicha ISO hafta kuni: 1=Du … 7=Ya. */
export function isoWeekdayTz(d: Date = new Date()) {
  const wd = new Date(d.getTime() + OFFSET_MS).getUTCDay();
  return wd === 0 ? 7 : wd;
}

/** "YYYY-MM-DD" + "14:00" (Toshkent) → UTC Date. */
export function atTz(ymd: string, hhmm: string) {
  return new Date(`${ymd}T${hhmm}:00+05:00`);
}

export function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * 86_400_000);
}

/** Hafta boshi (Dushanba 00:00, Toshkent). */
export function startOfWeekTz(d: Date = new Date()) {
  const s = startOfDayTz(d);
  return addDays(s, -(isoWeekdayTz(d) - 1));
}

/** Oy boshi (Toshkent). */
export function startOfMonthTz(d: Date = new Date()) {
  const ymd = ymdTz(d);
  return atTz(`${ymd.slice(0, 7)}-01`, "00:00");
}

/**
 * `@db.Date` ustunlar uchun (Payment.dueDate, Group.startDate, StudentProfile.enrolledAt …).
 * Prisma sanani UTC kuni bo'yicha saqlaydi, shuning uchun Toshkent kuni → "YYYY-MM-DDT00:00:00Z".
 * startOfDayTz() natijasini @db.Date ga YOZMANG — bir kun orqaga suriladi.
 */
export const toDbDate = (d: Date | string = new Date()) =>
  new Date(`${typeof d === "string" ? d : ymdTz(d)}T00:00:00Z`);

/** @db.Date ustundan o'qilgan qiymat → "YYYY-MM-DD". */
export const dbDateYmd = (d: Date) => d.toISOString().slice(0, 10);

/** "2024-05" */
export const periodOf = (d: Date = new Date()) => ymdTz(d).slice(0, 7);
