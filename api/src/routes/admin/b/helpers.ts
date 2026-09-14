// admin-b yordamchilari (students / parents / payments / reports / audit uchun umumiy).
import type { FastifyReply } from "fastify";
import type { PaymentStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { normalizeLogin } from "../../../lib/auth.js";
import { atTz, dbDateYmd, periodOf, startOfDayTz, toDbDate, ymdTz } from "../../../lib/dates.js";
import { badRequest } from "../../../lib/errors.js";
import { prisma, type Tx } from "../../../db.js";

// ─────────── Telefon ───────────

/** "+998 90 123-45-67" / "901234567" → "+998901234567"; noto'g'ri bo'lsa 400. */
export function normPhone(raw: string) {
  const p = normalizeLogin(raw);
  if (!/^\+998\d{9}$/.test(p)) throw badRequest("Telefon +998XXXXXXXXX koʻrinishida boʻlsin");
  return p;
}

export const zPhoneLoose = z
  .string()
  .trim()
  .min(9, "Telefon raqamini kiriting")
  .max(24)
  .transform((s, ctx) => {
    const p = normalizeLogin(s);
    if (!/^\+998\d{9}$/.test(p)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Telefon +998XXXXXXXXX koʻrinishida boʻlsin" });
      return z.NEVER;
    }
    return p;
  });

export const zPeriod = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Davr YYYY-MM koʻrinishida boʻlsin");
export const zName = z.string().trim().min(3, "Ism-familiyani toʻliq kiriting").max(120);
export const zRelation = z.enum(["Ota", "Ona", "Vasiy"]);
export const zBool = z.enum(["true", "false", "1", "0"]).transform((v) => v === "true" || v === "1");

// ─────────── Sanalar ───────────

/** "2024-05" → oy boshi va keyingi oy boshi (Toshkent, UTC Date). */
export function monthRange(period: string) {
  const [y, m] = period.split("-").map(Number);
  const start = atTz(`${period}-01`, "00:00");
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  const end = atTz(`${ny}-${String(nm).padStart(2, "0")}-01`, "00:00");
  return { start, end };
}

/** "2024-05" dan n oy oldingi/keyingi davr. */
export function shiftPeriod(period: string, n: number) {
  const [y, m] = period.split("-").map(Number);
  const idx = y * 12 + (m - 1) + n;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}

export const currentPeriod = () => periodOf(new Date());

/** "YYYY-MM-DD" (Toshkent) → @db.Date qiymati. Konvensiya: lib/dates.ts → toDbDate / dbDateYmd. */
export const dateOnly = (ymd: string) => toDbDate(ymd);
/** Bugungi Toshkent kuni @db.Date sifatida ("muddati o'tgan" = dueDate < todayDateOnly()). */
export const todayDateOnly = () => toDbDate();
/** @db.Date qiymati → "YYYY-MM-DD" (null xavfsiz). */
export const ymdOfDateOnly = (d: Date | null | undefined) => (d ? dbDateYmd(d) : null);

export { startOfDayTz };

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
/** "2024-05" → "May 2024" */
export function periodLabel(period: string) {
  const [y, m] = period.split("-").map(Number);
  const name = MONTHS[m - 1];
  return `${name[0].toUpperCase()}${name.slice(1)} ${y}`;
}
/** Date (@db.Date) → "25-may" */
export function dayMonth(d: Date) {
  const s = d.toISOString().slice(0, 10);
  return `${Number(s.slice(8, 10))}-${MONTHS[Number(s.slice(5, 7)) - 1]}`;
}

// ─────────── Pul ───────────

/** 850000 → "850 000 soʻm" */
export const fmtMoney = (n: number) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} soʻm`;

// ─────────── To'lov holati ───────────

/** Muddati o'tgan PENDING ham "OVERDUE" deb hisoblanadi (kron bo'lmasa ham to'g'ri). */
export function effectiveStatus(p: { status: PaymentStatus; dueDate: Date }, today = todayDateOnly()): PaymentStatus {
  if (p.status === "PENDING" && p.dueDate < today) return "OVERDUE";
  return p.status;
}

/** Holat filtri → Prisma where (effektiv holat bo'yicha). */
export function paymentStatusWhere(status: PaymentStatus, today = todayDateOnly()): Prisma.PaymentWhereInput {
  switch (status) {
    case "PENDING":
      return { status: "PENDING", dueDate: { gte: today } };
    case "OVERDUE":
      return { OR: [{ status: "OVERDUE" }, { status: "PENDING", dueDate: { lt: today } }] };
    default:
      return { status };
  }
}

export const METHOD_LABEL: Record<string, string> = {
  CASH: "Naqd (kassa)",
  CARD: "Karta",
  CLICK: "Click",
  PAYME: "Payme",
  TRANSFER: "Bank oʻtkazmasi",
};
export const PAY_STATUS_LABEL: Record<string, string> = {
  PENDING: "Kutilmoqda",
  PAID: "Toʻlangan",
  OVERDUE: "Muddati oʻtgan",
  CANCELLED: "Bekor qilingan",
};
export const STUDENT_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Faol",
  ACADEMIC_LEAVE: "Akademik taʼtil",
  GRADUATED: "Bitirgan",
  LEFT: "Ketgan",
};

// ─────────── Maxfiylik ───────────

const SECRET_KEYS = new Set(["passwordhash", "password", "temppassword", "tokenhash", "token", "accesstoken", "refreshtoken"]);

/** Javob/auditdan parol va tokenlarni rekursiv olib tashlaydi. */
export function stripSecrets<T>(v: T): T {
  if (v === null || v === undefined || typeof v !== "object") return v;
  if (v instanceof Date) return v;
  if (Array.isArray(v)) return v.map(stripSecrets) as T;
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (SECRET_KEYS.has(k.toLowerCase())) continue;
    out[k] = stripSecrets(val);
  }
  return out as T;
}

// ─────────── CSV ───────────

const cell = (v: unknown) => {
  if (v === null || v === undefined) return "";
  let s = v instanceof Date ? v.toISOString() : String(v);
  // CSV/formula injection (OWASP): =, @, TAB, CR bilan yoki +/- dan keyin raqam bo'lmagan matn bilan boshlansa — "'" prefiksi.
  // Sof raqam va telefon (+998901234567, -5) o'zgarmaydi.
  if (typeof v === "string" && (/^[=@\t\r]/.test(s) || (/^[+-]/.test(s) && !/^[+-][\d\s().-]*$/.test(s)))) s = `'${s}`;
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const BOM = String.fromCharCode(0xfeff);
/** UTF-8 BOM bilan CSV (Excel ʻ harfini to'g'ri ko'rsatadi). Ajratgich — vergul. */
export function toCsv(header: string[], rows: unknown[][]) {
  const lines = [header.map(cell).join(","), ...rows.map((r) => r.map(cell).join(","))];
  return BOM + lines.join("\r\n") + "\r\n";
}

export function sendCsv(reply: FastifyReply, filename: string, content: string) {
  return reply
    .header("Content-Type", "text/csv; charset=utf-8")
    .header("Content-Disposition", `attachment; filename="${filename}"`)
    .header("Cache-Control", "no-store")
    .send(content);
}

/** Toshkent vaqti "24.05.2024 16:32" */
export function csvDateTime(d: Date | null | undefined) {
  if (!d) return "";
  const t = new Date(d.getTime() + 5 * 3600_000).toISOString();
  return `${t.slice(8, 10)}.${t.slice(5, 7)}.${t.slice(0, 4)} ${t.slice(11, 16)}`;
}
export function csvDate(d: Date | null | undefined) {
  if (!d) return "";
  const t = d.toISOString();
  return `${t.slice(8, 10)}.${t.slice(5, 7)}.${t.slice(0, 4)}`;
}

// ─────────── Statistika ───────────

export const pct = (a: number, b: number, digits = 1) => (b > 0 ? Math.round((a / b) * 100 * 10 ** digits) / 10 ** digits : null);

export function avgLabel(avg: number | null) {
  if (avg == null) return null;
  if (avg >= 4.5) return "Aʼlo";
  if (avg >= 3.5) return "Yaxshi";
  if (avg >= 2.5) return "Qoniqarli";
  return "Qoniqarsiz";
}

/** Level nomi: "Level 2 · IELTS Foundation" yoki "Kids". */
export function levelName(l: { code: string; name: string } | null | undefined) {
  if (!l) return null;
  return l.code.startsWith("L") && /^\d+$/.test(l.code.slice(1)) ? `Level ${l.code.slice(1)} · ${l.name}` : l.name;
}
export function levelShort(l: { code: string; name: string } | null | undefined) {
  if (!l) return null;
  return l.code.startsWith("L") && /^\d+$/.test(l.code.slice(1)) ? `Level ${l.code.slice(1)}` : l.name;
}

// ─────────── Kodlar ───────────

/** Keyingi bo'sh o'quvchi kodi: ST-#### (mavjud eng katta raqam + 1). Tranzaksiya ichida, qulf bilan. */
export async function nextStudentCode(tx: Tx) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(424243)`;
  const rows = await tx.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(code FROM 4) AS INTEGER)) AS max FROM "StudentProfile" WHERE code ~ '^ST-[0-9]+$'`;
  let n = Number(rows[0]?.max ?? 1000) + 1;
  for (;;) {
    const code = `ST-${String(n).padStart(4, "0")}`;
    const clash = await tx.user.findUnique({ where: { login: code }, select: { id: true } });
    if (!clash) return code;
    n++;
  }
}

/** Kvitansiya raqami: KV-YYYY-MM-#### (oy bo'yicha ketma-ket). Tranzaksiya ichida, qulf bilan. */
export async function nextReceiptNo(tx: Tx, paidAt: Date) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(424244)`;
  const ym = ymdTz(paidAt).slice(0, 7);
  const prefix = `KV-${ym}-`;
  const rows = await tx.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING("receiptNo" FROM ${prefix.length + 1}::int) AS INTEGER)) AS max
    FROM "Payment" WHERE "receiptNo" LIKE ${prefix + "%"} AND "receiptNo" ~ '^KV-[0-9]{4}-[0-9]{2}-[0-9]+$'`;
  const n = Number(rows[0]?.max ?? 0) + 1;
  return `${prefix}${String(n).padStart(4, "0")}`;
}

// ─────────── To'lov jami (Payments va Reports sahifalari bir xil hisoblashi uchun YAGONA joy) ───────────

export async function paymentTotals(where: Prisma.PaymentWhereInput) {
  const rows = await prisma.payment.findMany({ where, select: { studentId: true, status: true, dueDate: true, amount: true } });
  const today = todayDateOnly();
  const sum = { PAID: 0, PENDING: 0, OVERDUE: 0, CANCELLED: 0 } as Record<PaymentStatus, number>;
  const cnt = { PAID: 0, PENDING: 0, OVERDUE: 0, CANCELLED: 0 } as Record<PaymentStatus, number>;
  const stu = { PAID: new Set<string>(), PENDING: new Set<string>(), OVERDUE: new Set<string>(), CANCELLED: new Set<string>() };
  for (const r of rows) {
    const st = effectiveStatus(r, today);
    sum[st] += r.amount;
    cnt[st] += 1;
    stu[st].add(r.studentId);
  }
  const plan = sum.PAID + sum.PENDING + sum.OVERDUE;
  const active = cnt.PAID + cnt.PENDING + cnt.OVERDUE;
  return {
    plan,
    collected: sum.PAID,
    pending: sum.PENDING,
    overdue: sum.OVERDUE,
    cancelled: sum.CANCELLED,
    collectedPercent: pct(sum.PAID, plan, 0),
    avgAmount: active ? Math.round(plan / active) : null,
    count: rows.length,
    counts: { ALL: rows.length, ...cnt },
    students: { PAID: stu.PAID.size, PENDING: stu.PENDING.size, OVERDUE: stu.OVERDUE.size },
  };
}
