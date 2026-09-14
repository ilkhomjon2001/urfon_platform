// To'lovlar (KANON §9): o'tgan 4 oy — to'langan; joriy oy — 102 to'langan (86 400 000 so'm),
// 12 kutilmoqda (10 200 000, muddat T+1), 2 muddati o'tgan (1 600 000). Kvitansiya: KV-YYYY-MM-####.
import type { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import type { Db } from "../../src/db.js";
import type { Model, StudentPlan } from "./plan.js";
import { Rng, addMonths, at, cid, dateOnly, happened, insertMany, monthLabel, som, ymdAdd, ymdOf } from "./util.js";

export const TARGET = { paid: 86_400_000, paidCount: 102, pending: 10_200_000, pendingCount: 12, overdue: 1_600_000, overdueCount: 2 };

export type PayRow = Prisma.PaymentCreateManyInput & { id: string; student: StudentPlan };

export function planPayments(m: Model) {
  const { clock } = m;
  const T = clock.T;
  const rng = new Rng("urfon-payments");
  const P = T.slice(0, 7);
  const nodira = m.staff.get("nodira")!.id;
  const sanjar = m.staff.get("sanjar")!.id;
  const K = (k: string) => m.byKey.get(k)!;
  const G = (c: string) => m.groups.get(c)!;
  const dueDay = Math.min(Number(ymdAdd(T, 1).slice(8, 10)), 28);
  const receipts = new Map<string, number>();
  const receipt = (period: string) => {
    const n = (receipts.get(period) ?? 0) + 1;
    receipts.set(period, n);
    return `KV-${period}-${String(n).padStart(4, "0")}`;
  };
  const METHODS: [PaymentMethod, number][] = [["PAYME", 0.35], ["CLICK", 0.3], ["CASH", 0.2], ["CARD", 0.1], ["TRANSFER", 0.05]];
  const method = (): PaymentMethod => {
    let r = rng.next();
    for (const [mth, p] of METHODS) if ((r -= p) < 0) return mth;
    return "CASH";
  };
  const creator = (mth: PaymentMethod) => (mth === "CLICK" || mth === "PAYME" ? null : rng.chance(0.75) ? nodira : sanjar);
  const providerNote = (mth: PaymentMethod) =>
    mth === "PAYME" ? `Payme tranzaksiyasi #PM-${rng.int(90000, 99999)}` : mth === "CLICK" ? `Click tranzaksiyasi #CL-${rng.int(10000, 19999)}` : mth === "CASH" ? `Kassa orderi #KS-${rng.int(200, 499)}` : mth === "TRANSFER" ? `Hisob-faktura #BF-${rng.int(700, 799)}` : `Terminal cheki #TR-${rng.int(1000, 9999)}`;

  const feeGroup = (s: StudentPlan) => m.primary(s) ?? s.enrollments.find((e) => e.status === "LEFT")?.group ?? "GR-18";
  const grants = new Set([m.byKey.get("GR-18-0")!.id, m.byKey.get("GR-18-1")!.id]);
  const baseAmount = (s: StudentPlan, period: string) => {
    const fee = G(feeGroup(s)).fee;
    let a = fee;
    const notes: string[] = [];
    if (s.siblingDiscount) {
      a -= fee / 10;
      notes.push("Oilaviy chegirma 10%");
    }
    if (grants.has(s.id) && period >= addMonths(P, -2)) {
      a -= fee / 2;
      notes.push("IELTS 7.0+ natijasi uchun grant — 50%");
    }
    return { amount: a, notes };
  };

  const rows: PayRow[] = [];
  const add = (s: StudentPlan, r: Omit<Prisma.PaymentCreateManyInput, "studentId">) => {
    const row = { ...r, id: cid(), studentId: s.id, student: s } as PayRow;
    rows.push(row);
    return row;
  };

  // ── o'tgan 4 oy ──
  for (let back = 4; back >= 1; back--) {
    const Q = addMonths(P, -back);
    const qStart = `${Q}-01`;
    const qEnd = ymdAdd(`${addMonths(Q, 1)}-01`, -1);
    for (const s of m.students) {
      const left = s.leftYmd ?? s.enrollments.find((e) => e.status === "LEFT")?.left;
      if (s.enrolledYmd > qEnd || (left && left < qStart)) continue;
      const { amount, notes } = baseAmount(s, Q);
      const mth = method();
      const late = rng.chance(0.04);
      const paidYmd = late ? `${Q}-${String(Math.min(28, dueDay + rng.int(2, 6))).padStart(2, "0")}` : ymdAdd(qStart, rng.int(-3, 12));
      add(s, {
        groupId: G(feeGroup(s)).id, period: Q, amount, status: "PAID", dueDate: dateOnly(`${Q}-${String(dueDay).padStart(2, "0")}`),
        paidAt: at(paidYmd < s.enrolledYmd ? s.enrolledYmd : paidYmd, `${String(rng.int(9, 20)).padStart(2, "0")}:${String(rng.int(0, 59)).padStart(2, "0")}`), method: mth,
        receiptNo: receipt(Q), note: [...notes, late ? "Kechikib toʻlandi" : null, providerNote(mth)].filter(Boolean).join(" · "), createdById: creator(mth),
        createdAt: at(qStart, "08:00"),
      });
    }
  }

  // ── joriy oy ──
  const pStart = `${P}-01`;
  const dueCur = dateOnly(ymdAdd(T, 1));
  const gen = (code: string, i: number) => m.byKey.get(`${code}-${i}`)!;
  const pending = [K("bekzod"), gen("GR-03", 1), gen("GR-03", 2), gen("GR-04", 1), gen("GR-04", 2), gen("GR-04", 3), K("otabek_n"), K("zarina"), gen("GR-05", 0), gen("GR-05", 1), gen("GR-05", 2), gen("GR-05", 3)];
  const overdueActive = gen("GR-04", 5);
  const noRow = K("asadbek");
  const special: Record<string, { day: number; time: string; method: PaymentMethod; note: string; today?: boolean }> = {
    [K("ali").id]: { day: 10, time: "11:32", method: "PAYME", note: "Payme tranzaksiyasi #PM-99214" },
    [K("madina_r").id]: { day: 12, time: "16:04", method: "CLICK", note: "Click Up tranzaksiyasi #CL-10294" },
    [K("kamila").id]: { day: 8, time: "09:15", method: "TRANSFER", note: "Bank oʻtkazmasi · Hisob-faktura #BF-771" },
    [K("shaxboz").id]: { day: 11, time: "17:45", method: "CASH", note: "Naqd (kassa) · Kassa orderi #KS-338" },
    [K("doniyor").id]: { day: 0, time: "12:40", method: "CLICK", note: "Click Billing Webhook · Toʻlov #1040", today: true },
    [K("sardor").id]: { day: 0, time: "12:50", method: "PAYME", note: "Toʻlovchi: Sherzod Aliyev (otasi) · Payme", today: true },
  };
  const tDay = Number(T.slice(8, 10));
  const paidRows: PayRow[] = [];
  for (const s of m.students) {
    if (s.status !== "ACTIVE" || s === noRow) continue;
    const { amount, notes } = baseAmount(s, P);
    const grp = G(feeGroup(s)).id;
    if (pending.includes(s)) {
      add(s, { groupId: grp, period: P, amount, status: "PENDING", dueDate: dueCur, note: `${monthLabel(P)} oyi uchun toʻlov`, createdAt: at(pStart, "08:00") });
      continue;
    }
    if (s === overdueActive) {
      add(s, { groupId: grp, period: P, amount, status: "OVERDUE", dueDate: dateOnly(ymdAdd(T, -4)), note: "4 kun kechikkan · SMS eslatma yuborildi", createdAt: at(pStart, "08:00") });
      continue;
    }
    const sp = special[s.id];
    let paidAt: Date;
    let mth: PaymentMethod;
    let note: string;
    if (sp) {
      mth = sp.method;
      note = sp.note;
      // kanon kunlari (10-, 12-…) T dan keyin bo'lsa T dan oldingi kunga suriladi; oy 1-kuni T bo'lsa — ertalab
      const day = Math.min(sp.day, Math.max(1, tDay - 1));
      const ymd = sp.today ? T : `${P}-${String(day).padStart(2, "0")}`;
      paidAt = happened(clock, at(ymd, !sp.today && ymd === T ? `10:${sp.time.slice(3)}` : sp.time));
    } else {
      mth = method();
      note = providerNote(mth);
      const lastDay = ymdAdd(T, -1) < pStart ? T : ymdAdd(T, -1);
      const span = Math.max(0, Math.round((new Date(lastDay).getTime() - new Date(pStart).getTime()) / 86_400_000));
      const ymd0 = ymdAdd(pStart, rng.int(-3, Math.min(span, 14)));
      const ymd = ymd0 < s.enrolledYmd ? s.enrolledYmd : ymd0;
      // T kunidagi tasodifiy to'lovlar faqat ertalab (kanon 12:40/12:50 va 15:45/16:32 dan oldin qolsin)
      const hh = ymd >= T ? rng.int(8, 11) : rng.int(9, 20);
      paidAt = happened(clock, at(ymd > T ? T : ymd, `${String(hh).padStart(2, "0")}:${String(rng.int(0, 59)).padStart(2, "0")}`));
    }
    const r = add(s, {
      groupId: grp, period: P, amount, status: "PAID", dueDate: dueCur, paidAt, method: mth, receiptNo: "", note: [...notes, note].join(" · "),
      createdById: creator(mth), createdAt: paidAt,
    });
    paidRows.push(r);
  }
  // Jasur Umidov — akademik ta'tilda, to'lov muddati o'tgan
  const ju = K("jasur_u");
  add(ju, { groupId: G("GR-15").id, period: P, amount: G("GR-15").fee, status: "OVERDUE", dueDate: dateOnly(ymdAdd(T, -4)), note: "4 kun kechikkan · Akademik taʼtildan oldingi qarzdorlik", createdAt: at(pStart, "08:00") });

  // aniq yig'indi: qoldiq "ortiqcha to'lov" sifatida hisobga olinadi
  let diff = paidRows.reduce((a, r) => a + r.amount, 0) - TARGET.paid;
  for (const r of rng.shuffle(paidRows.filter((x) => !special[x.studentId] && !x.note!.includes("grant")))) {
    if (diff <= 0) break;
    const d = Math.min(diff, Math.floor(r.amount / 2 / 5000) * 5000, 300_000);
    r.amount -= d;
    r.note = `Oʻtgan oydagi ortiqcha toʻlov hisobga olindi (−${som(d)} soʻm) · ${r.note}`;
    diff -= d;
  }
  if (diff !== 0) console.warn(`  ! Toʻlovlar: yigʻindi ${diff} soʻmga farq qiladi`);
  // kvitansiya raqamlari to'lov vaqti tartibida
  for (const r of paidRows.sort((a, b) => (a.paidAt as Date).getTime() - (b.paidAt as Date).getTime())) r.receiptNo = receipt(P);

  // Bekzod: noto'g'ri kiritilgan dublikat to'lov (bugun 13:05 da bekor qilingan)
  const dup = add(K("bekzod"), {
    groupId: G("GR-03").id, period: P, amount: 850_000, status: "CANCELLED" as PaymentStatus, dueDate: dueCur, paidAt: null, method: "CASH",
    note: "Notoʻgʻri kiritilgan dublikat toʻlov (850 000 soʻm) bekor qilindi · Toʻlov #1039", createdById: nodira,
    createdAt: happened(clock, at(T, "12:58")), updatedAt: happened(clock, at(T, "13:05")),
  });
  return { rows, dup, P };
}

export async function writePayments(db: Db, plan: ReturnType<typeof planPayments>) {
  await insertMany(
    db.payment,
    plan.rows.map(({ student: _s, ...r }) => ({
      ...r, receiptNo: r.receiptNo || null, paidAmount: r.status === "PAID" ? r.amount : 0, updatedAt: r.updatedAt ?? r.paidAt ?? r.createdAt,
    })),
  );
  // Toʻlov daftari (lib/billing.ts): har bir toʻlangan hisob — kassaga kelgan pul (tushum) + taqsimot, kvitansiya raqami bir xil
  const paid = plan.rows.filter((r) => r.status === "PAID" && r.receiptNo && r.paidAt && r.method);
  const txs = paid.map((r) => ({
    id: cid(), studentId: r.studentId, amount: r.amount, method: r.method as PaymentMethod, paidAt: r.paidAt as Date, receiptNo: r.receiptNo as string,
    note: r.note ?? null, createdById: r.createdById ?? null, createdAt: r.paidAt as Date, paymentId: r.id,
  }));
  await insertMany(db.paymentTransaction, txs.map(({ paymentId: _p, ...t }) => t));
  await insertMany(db.paymentAllocation, txs.map((t) => ({ id: cid(), transactionId: t.id, paymentId: t.paymentId, amount: t.amount, createdAt: t.createdAt })));
  void ymdOf;
  return plan.rows.length;
}
