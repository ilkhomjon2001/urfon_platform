// URFON formatlash qoidalari (KANON §3). Barcha vaqtlar Asia/Tashkent (UTC+5, yozgi vaqt yoʻq).
import type { Tone } from "./types";

/** Boʻlinmas boʻsh joy (U+00A0): raqam guruhlari va "soʻm" oldidan. */
export const NBSP = "\u00A0";
const TZ_OFFSET_MS = 5 * 3_600_000;
const DAY_MS = 86_400_000;

export const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
] as const;

/** Indeks 0 = Dushanba (ISO 1). `WEEKDAYS_FULL[isoWeekday - 1]` */
export const WEEKDAYS_FULL = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"] as const;
export const WEEKDAYS_SHORT = ["Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"] as const;

export type DateInput = Date | string | number;

export function toDate(d: DateInput): Date {
  return d instanceof Date ? d : new Date(d);
}

/** Toshkent vaqti boʻyicha sana qismlari. month: 0–11, weekday: 1=Du … 7=Ya. */
export function tzParts(d: DateInput) {
  const t = new Date(toDate(d).getTime() + TZ_OFFSET_MS);
  const wd = t.getUTCDay();
  return {
    year: t.getUTCFullYear(),
    month: t.getUTCMonth(),
    day: t.getUTCDate(),
    hours: t.getUTCHours(),
    minutes: t.getUTCMinutes(),
    weekday: wd === 0 ? 7 : wd,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Toshkent kuni "YYYY-MM-DD" (API'dagi `date` parametrlari uchun). */
export function toYmd(d: DateInput = new Date()) {
  const p = tzParts(d);
  return `${p.year}-${pad(p.month + 1)}-${pad(p.day)}`;
}

/** Bugungi kun (Toshkent) "YYYY-MM-DD". */
export const todayYmd = () => toYmd(new Date());

/** Ikki sana orasidagi kalendar kunlari farqi (Toshkent): b - a. */
export function dayDiff(a: DateInput, b: DateInput) {
  const pa = tzParts(a);
  const pb = tzParts(b);
  return Math.round((Date.UTC(pb.year, pb.month, pb.day) - Date.UTC(pa.year, pa.month, pa.day)) / DAY_MS);
}

// ---------------------------------------------------------------- raqamlar

/** 1240 → "1 240" (NBSP), 4.6 → "4.6". `decimals` berilsa aniq shuncha kasr. */
export function fmtNum(value: number | null | undefined, decimals?: number): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const s = decimals != null ? abs.toFixed(decimals) : String(Math.round(abs * 100) / 100);
  const [int, frac] = s.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return (value < 0 ? "−" : "") + grouped + (frac ? "." + frac : "");
}

/** 850000 → "850 000 soʻm" */
export function fmtMoney(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${fmtNum(Math.round(value))}${NBSP}soʻm`;
}

/** 93 → "93%", 92.8 → "92.8%". Qiymat 0–100 oraligʻida. */
export function fmtPercent(value: number | null | undefined, maxDecimals = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const k = 10 ** maxDecimals;
  return `${fmtNum(Math.round(value * k) / k)}%`;
}

/** Bayt → "4.2 MB", "850 KB". */
export function fmtFileSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Soniya → "3:15" yoki "1:02:03". */
export function fmtDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** "+998901234567" → "+998 90 123-45-67" */
export function fmtPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const m = phone.replace(/[^\d+]/g, "").match(/^\+?998(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+998 ${m[1]} ${m[2]}-${m[3]}-${m[4]}` : phone;
}

// ---------------------------------------------------------------- sanalar

/** "24-may, 2024"; `{ year: false }` → "24-may" */
export function fmtDate(d: DateInput | null | undefined, opts: { year?: boolean } = {}): string {
  if (d == null) return "—";
  const p = tzParts(d);
  const base = `${p.day}-${MONTHS[p.month]}`;
  return opts.year === false ? base : `${base}, ${p.year}`;
}

/** "24-may" */
export const fmtDayMonth = (d: DateInput) => fmtDate(d, { year: false });

/** Jadval formati: "24.05.2024" */
export function fmtDateShort(d: DateInput | null | undefined): string {
  if (d == null) return "—";
  const p = tzParts(d);
  return `${pad(p.day)}.${pad(p.month + 1)}.${p.year}`;
}

/** "14:00" */
export function fmtTime(d: DateInput | null | undefined): string {
  if (d == null) return "—";
  const p = tzParts(d);
  return `${pad(p.hours)}:${pad(p.minutes)}`;
}

/** Jadval (audit) formati: "24.05.2024 14:00" */
export const fmtDateTime = (d: DateInput) => `${fmtDateShort(d)} ${fmtTime(d)}`;

/** "Bugun" / "Kecha" / "Ertaga" yoki null. */
export function relDayWord(d: DateInput, now: DateInput = new Date()): "Bugun" | "Kecha" | "Ertaga" | null {
  const diff = dayDiff(now, d);
  if (diff === 0) return "Bugun";
  if (diff === -1) return "Kecha";
  if (diff === 1) return "Ertaga";
  return null;
}

/** "Bugun" / "Kecha" / "Ertaga" / "24-may, 2024" */
export function fmtRelDay(d: DateInput, now: DateInput = new Date()): string {
  return relDayWord(d, now) ?? fmtDate(d);
}

/** Lenta/xabarlar: "Bugun, 16:32" · "Kecha, 22:15" · "23-may, 16:40" · "23.05.2023, 16:40" */
export function fmtRelDateTime(d: DateInput, now: DateInput = new Date()): string {
  const word = relDayWord(d, now);
  const time = fmtTime(d);
  if (word) return `${word}, ${time}`;
  return tzParts(d).year === tzParts(now).year ? `${fmtDayMonth(d)}, ${time}` : `${fmtDateShort(d)}, ${time}`;
}

/** Hafta kuni: "Juma" yoki qisqa "Ju". */
export function fmtWeekday(d: DateInput, short = false): string {
  const wd = tzParts(d).weekday;
  return short ? WEEKDAYS_SHORT[wd - 1] : WEEKDAYS_FULL[wd - 1];
}

/** "May, 2024" (oy bosh harf bilan) — "Joriy oy: May, 2024". */
export function fmtMonthYear(d: DateInput): string {
  const p = tzParts(d);
  const m = MONTHS[p.month];
  return `${m[0].toUpperCase()}${m.slice(1)}, ${p.year}`;
}

type TimeLike = string | DateInput;
const asTime = (t: TimeLike) => (typeof t === "string" && /^\d{1,2}:\d{2}$/.test(t) ? t.padStart(5, "0") : fmtTime(t));

/** "14:00–15:30" (en dash) */
export const fmtTimeRange = (start: TimeLike, end: TimeLike) => `${asTime(start)}–${asTime(end)}`;

/** Jadval: fmtDays([1,3,5], "14:00", "15:30") → "Du · Cho · Ju, 14:00–15:30". Kunlar ISO: 1=Du … 7=Ya. */
export function fmtDays(days: number[], start?: TimeLike, end?: TimeLike): string {
  const names = days.map((d) => WEEKDAYS_SHORT[(d - 1 + 7) % 7]).join(" · ");
  if (!start) return names;
  return `${names}, ${end ? fmtTimeRange(start, end) : asTime(start)}`;
}

/** Oʻquv yili chipi: "2023–2024 oʻquv yili · Bahorgi semestr" (sentabrdan yangi yil). */
export function academicYearLabel(d: DateInput = new Date()): string {
  const { year, month } = tzParts(d);
  const start = month >= 8 ? year : year - 1;
  const term = month >= 8 || month === 0 ? "Kuzgi semestr" : month <= 5 ? "Bahorgi semestr" : "Yozgi taʼtil";
  return `${start}–${start + 1} oʻquv yili · ${term}`;
}

// ---------------------------------------------------------------- baholar (5 ballik)

const GRADE_LABEL: Record<number, string> = { 5: "Aʼlo", 4: "Yaxshi", 3: "Qoniqarli", 2: "Qoniqarsiz" };

/** 5 → "Aʼlo", 4 → "Yaxshi", 3 → "Qoniqarli", 2 → "Qoniqarsiz" */
export function gradeLabel(grade: number | null | undefined): string {
  if (grade == null) return "—";
  return GRADE_LABEL[Math.round(grade)] ?? "—";
}

/** Baho chipi ohangi. */
export function gradeTone(grade: number | null | undefined): Tone {
  if (grade == null) return "neutral";
  const g = Math.round(grade);
  return g >= 5 ? "success" : g === 4 ? "primary" : g === 3 ? "warning" : "danger";
}

/** Oʻrtacha baho nomi: ≥4.5 Aʼlo, ≥3.5 Yaxshi, ≥2.5 Qoniqarli, aks holda Qoniqarsiz. */
export function avgLabel(avg: number | null | undefined): string {
  if (avg == null || !Number.isFinite(avg)) return "—";
  if (avg >= 4.5) return "Aʼlo";
  if (avg >= 3.5) return "Yaxshi";
  if (avg >= 2.5) return "Qoniqarli";
  return "Qoniqarsiz";
}

export function avgTone(avg: number | null | undefined): Tone {
  if (avg == null || !Number.isFinite(avg)) return "neutral";
  return avg >= 4.5 ? "success" : avg >= 3.5 ? "primary" : avg >= 2.5 ? "warning" : "danger";
}

/** 4.6 → "4.6" (har doim bitta kasr). */
export const fmtAvg = (avg: number | null | undefined) => (avg == null || !Number.isFinite(avg) ? "—" : avg.toFixed(1));

// ---------------------------------------------------------------- ismlar

/** "Ali Valiyev" → "AV", "Dr. Nigora Karimova" → "NK" */
export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => w && !w.endsWith("."));
  const letters = words.slice(0, 2).map((w) => Array.from(w)[0] ?? "");
  return letters.join("").toUpperCase() || "?";
}
