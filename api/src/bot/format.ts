// Bot va hisobot matnlari uchun formatlash (KANON §3; web/src/lib/format.ts bilan bir xil qoidalar).
// Barcha vaqtlar Asia/Tashkent (UTC+5, yozgi vaqt yoʻq).
import type { AttendanceStatus, GradeKind, PaymentStatus } from "@prisma/client";

export const NBSP = " ";
const TZ_OFFSET_MS = 5 * 3_600_000;
const DAY_MS = 86_400_000;

export const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"] as const;
export const WEEKDAYS_SHORT = ["Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"] as const;

/** HTML parse_mode uchun: foydalanuvchi kiritgan har qanday matn shu orqali o'tadi. */
export function esc(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tzParts(d: Date) {
  const t = new Date(d.getTime() + TZ_OFFSET_MS);
  const wd = t.getUTCDay();
  return { year: t.getUTCFullYear(), month: t.getUTCMonth(), day: t.getUTCDate(), hours: t.getUTCHours(), minutes: t.getUTCMinutes(), weekday: wd === 0 ? 7 : wd };
}
const pad = (n: number) => String(n).padStart(2, "0");

/** 1240 → "1 240" (NBSP), 4.6 → "4.6" */
export function fmtNum(value: number): string {
  const abs = Math.abs(value);
  const [int, frac] = String(Math.round(abs * 100) / 100).split(".");
  return (value < 0 ? "−" : "") + int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) + (frac ? "." + frac : "");
}

/** 850000 → "850 000 soʻm" */
export const fmtMoney = (v: number) => `${fmtNum(Math.round(v))}${NBSP}soʻm`;

/** 93 → "93%", 92.83 → "92.8%" */
export const fmtPercent = (v: number) => `${fmtNum(Math.round(v * 10) / 10)}%`;

/** "24-may, 2024"; year=false → "24-may" */
export function fmtDate(d: Date, year = true) {
  const p = tzParts(d);
  return year ? `${p.day}-${MONTHS[p.month]}, ${p.year}` : `${p.day}-${MONTHS[p.month]}`;
}

/** Date ustun (@db.Date, UTC yarim tun) uchun: kalendar sanasini o'zgartirmasdan "25-may, 2024". */
export function fmtDbDate(d: Date, year = true) {
  const m = MONTHS[d.getUTCMonth()];
  return year ? `${d.getUTCDate()}-${m}, ${d.getUTCFullYear()}` : `${d.getUTCDate()}-${m}`;
}

/** "14:00" */
export function fmtTime(d: Date) {
  const p = tzParts(d);
  return `${pad(p.hours)}:${pad(p.minutes)}`;
}

/** "14:00–15:30" */
export const fmtTimeRange = (a: Date, b: Date) => `${fmtTime(a)}–${fmtTime(b)}`;

export const weekdayShort = (d: Date) => WEEKDAYS_SHORT[tzParts(d).weekday - 1];

function dayDiff(a: Date, b: Date) {
  const pa = tzParts(a);
  const pb = tzParts(b);
  return Math.round((Date.UTC(pb.year, pb.month, pb.day) - Date.UTC(pa.year, pa.month, pa.day)) / DAY_MS);
}

/** "Bugun" / "Ertaga" / "Kecha" / "24-may, 2024" */
export function fmtRelDay(d: Date, now = new Date()) {
  const diff = dayDiff(now, d);
  if (diff === 0) return "Bugun";
  if (diff === 1) return "Ertaga";
  if (diff === -1) return "Kecha";
  return tzParts(d).year === tzParts(now).year ? fmtDate(d, false) : fmtDate(d);
}

/** "Bugun, 20:00" / "26-may, 20:00" */
export const fmtRelDateTime = (d: Date, now = new Date()) => `${fmtRelDay(d, now)}, ${fmtTime(d)}`;

/** "2024-05" → "May, 2024" */
export function fmtPeriod(period: string) {
  const [y, m] = period.split("-").map(Number);
  const name = MONTHS[(m || 1) - 1];
  return `${name[0].toUpperCase()}${name.slice(1)}, ${y}`;
}

/** "2024-05" → "mayda" (jumla ichida: "mayda 4.4 edi") */
export function monthLocative(period: string) {
  const m = Number(period.split("-")[1]) || 1;
  return `${MONTHS[m - 1]}da`;
}

// ── Baholar (5 ballik) ──
const GRADE_LABEL: Record<number, string> = { 5: "Aʼlo", 4: "Yaxshi", 3: "Qoniqarli", 2: "Qoniqarsiz" };
export const gradeLabel = (v: number) => GRADE_LABEL[Math.round(v)] ?? "—";

/** Oʻrtacha: ≥4.5 Aʼlo, ≥3.5 Yaxshi, ≥2.5 Qoniqarli, aks holda Qoniqarsiz */
export function avgLabel(avg: number) {
  if (avg >= 4.5) return "Aʼlo";
  if (avg >= 3.5) return "Yaxshi";
  if (avg >= 2.5) return "Qoniqarli";
  return "Qoniqarsiz";
}

/** 5 → "5", 4.6 → "4.6" */
export const fmtGrade = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
export const fmtAvg = (v: number) => v.toFixed(1);

export const GRADE_KIND: Record<GradeKind, string> = {
  HOMEWORK: "Uyga vazifa",
  CLASSWORK: "Darsdagi faollik",
  TEST: "Test",
  SPEAKING: "Speaking",
  WRITING: "Writing",
  MOCK: "Mock imtihon",
};

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "keldi",
  LATE: "kechikib keldi",
  EXCUSED: "kelmadi (sababli)",
  ABSENT: "kelmadi",
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  PENDING: "kutilmoqda",
  PAID: "toʻlangan",
  OVERDUE: "muddati oʻtgan",
  CANCELLED: "bekor qilingan",
};

/** "+5" / "−3" / "0" */
export const fmtSigned = (n: number) => (n > 0 ? `+${fmtNum(n)}` : fmtNum(n));
