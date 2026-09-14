// Seed uchun umumiy yordamchilar: deterministik PRNG, sana arifmetikasi (Toshkent), "T" langari.
import { atTz, toDbDate, ymdTz } from "../../src/lib/dates.js";

export const DAY = 86_400_000;
export const MIN = 60_000;

// ─────────────── Sana (YYYY-MM-DD satrlari, Toshkent kalendari) ───────────────

export const ymdAdd = (ymd: string, n: number) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** ISO hafta kuni: 1=Du … 7=Ya */
export const dow = (ymd: string) => {
  const w = new Date(`${ymd}T00:00:00Z`).getUTCDay();
  return w === 0 ? 7 : w;
};
/** @db.Date ustunlari uchun (UTC yarim tun — Postgres sana qismini oladi). */
export const dateOnly = (ymd: string) => toDbDate(ymd);
/** Toshkent vaqti bo'yicha lahza. */
export const at = (ymd: string, hhmm: string, sec = 0) => new Date(atTz(ymd, hhmm).getTime() + sec * 1000);
export const addMin = (d: Date, m: number) => new Date(d.getTime() + m * MIN);
export const daysBetween = (a: string, b: string) => Math.round((dateOnly(b).getTime() - dateOnly(a).getTime()) / DAY);
export const hhmmOf = (d: Date) => new Date(d.getTime() + 5 * 3600_000).toISOString().slice(11, 16);
export const ymdOf = (d: Date) => ymdTz(d);
export const monthStart = (ymd: string) => `${ymd.slice(0, 7)}-01`;
export const addMonths = (period: string, n: number) => {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};

/** start (shu kun ham) dan boshlab `days` hafta kunlariga to'g'ri keladigan `count` ta sana. */
export function lessonDatesFrom(days: number[], startYmd: string, count: number) {
  const out: string[] = [];
  let d = startYmd;
  while (out.length < count) {
    if (days.includes(dow(d))) out.push(d);
    d = ymdAdd(d, 1);
  }
  return out;
}
/** `beforeYmd` dan (o'zi kirmaydi) orqaga `n`-chi dars kuni. */
export function lessonDayBack(days: number[], beforeYmd: string, n: number) {
  let d = beforeYmd;
  let k = 0;
  while (k < n) {
    d = ymdAdd(d, -1);
    if (days.includes(dow(d))) k++;
  }
  return d;
}
/** `afterYmd` dan keyingi (o'zi kirmaydi) birinchi `weekday` kuni. */
export function nextWeekday(afterYmd: string, weekday: number) {
  let d = ymdAdd(afterYmd, 1);
  while (dow(d) !== weekday) d = ymdAdd(d, 1);
  return d;
}

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
/** "24-may" */
export const dm = (ymd: string) => `${Number(ymd.slice(8, 10))}-${MONTHS[Number(ymd.slice(5, 7)) - 1]}`;
/** "May, 2024" */
export const monthLabel = (period: string) => {
  const m = MONTHS[Number(period.slice(5, 7)) - 1];
  return `${m[0].toUpperCase()}${m.slice(1)}, ${period.slice(0, 4)}`;
};
/** 850000 → "850 000" (KANON §3: minglik bo'lak bo'sh joy bilan) */
export const som = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// ─────────────── Soat: "bugun" (T) langari ───────────────

export type Clock = {
  realNow: Date;
  today: string; // Toshkent bo'yicha bugun (yoki SEED_TODAY)
  now: Date; // seed "hozir" deb biladigan lahza
  T: string; // langar: today dan oldingi/teng oxirgi GR-03 dars kuni (Du/Cho/Ju)
  cutoff: Date; // now − 10 daqiqa: undan keyingi "bo'lib o'tgan" hodisalar siqiladi
};

export function makeClock(): Clock {
  const realNow = new Date();
  const realToday = ymdTz(realNow);
  const envToday = process.env.SEED_TODAY?.trim();
  if (envToday && !/^\d{4}-\d{2}-\d{2}$/.test(envToday)) throw new Error("SEED_TODAY YYYY-MM-DD formatida boʻlishi kerak");
  const today = envToday || realToday;
  const envNow = process.env.SEED_NOW?.trim(); // test uchun: "HH:MM"
  let now: Date;
  if (envNow) now = atTz(today, envNow);
  else if (today === realToday) now = realNow;
  else now = atTz(today, hhmmOf(realNow));
  let T = today;
  while (![1, 3, 5].includes(dow(T))) T = ymdAdd(T, -1);
  return { realNow, today, now, T, cutoff: new Date(now.getTime() - 10 * MIN) };
}

/**
 * "Bo'lib o'tgan" hodisa vaqti: hozirdan oldin bo'lsa o'zgarmaydi, aks holda (masalan, kanondagi 16:32
 * hali kelmagan bo'lsa) tartibni saqlagan holda (cutoff, now) oralig'iga siqiladi. Monoton funksiya.
 */
export function happened(clock: Clock, d: Date): Date {
  const c = clock.cutoff.getTime();
  if (d.getTime() <= c) return d;
  const span = clock.now.getTime() - 1000 - c;
  const x = (d.getTime() - c) / (6 * 3600_000);
  return new Date(c + Math.floor(span * (1 - Math.exp(-x))));
}
export const isPast = (clock: Clock, d: Date) => d.getTime() <= clock.now.getTime();

// ─────────────── Deterministik PRNG ───────────────

export class Rng {
  private s: number;
  constructor(seed: string) {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    this.s = h >>> 0;
  }
  next() {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(a: number, b: number) {
    return a + Math.floor(this.next() * (b - a + 1));
  }
  chance(p: number) {
    return this.next() < p;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  shuffle<T>(arr: readonly T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  /** o'rtacha `mean` atrofida 2..5 butun baho */
  grade(mean: number) {
    const v = Math.round(mean + (this.next() - 0.5) * 1.6);
    return Math.max(2, Math.min(5, v));
  }
}

// cuid ko'rinishidagi deterministik ID (qayta seed'da ham bir xil)
const idRng = new Rng("urfon-ids");
const ALPH = "0123456789abcdefghijklmnopqrstuvwxyz";
export function cid() {
  let s = "c";
  for (let i = 0; i < 24; i++) s += ALPH[idRng.int(0, 35)];
  return s;
}

// ─────────────── Ommaviy yozish ───────────────

type CreateManyDelegate = { createMany: (args: { data: any[]; skipDuplicates?: boolean }) => Promise<{ count: number }> };
export async function insertMany(delegate: CreateManyDelegate, rows: any[], size = 2000) {
  let n = 0;
  for (let i = 0; i < rows.length; i += size) n += (await delegate.createMany({ data: rows.slice(i, i + size) })).count;
  return n;
}

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
