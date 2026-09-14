// Kumush tangalar (GAMIFICATION qoidalari bo'yicha) va balans/seriya keshi.
// Ali: jami 1 240, oxirgi 7 kun (now−7d … now) +85, undan oldingi 7 kun +65, seriya 7 (lastStreakDate = T).
import type { CoinReason, Prisma } from "@prisma/client";
import type { Db } from "../../src/db.js";
import { GAMIFICATION } from "../../src/config/gamification.js";
import { coinRef } from "../../src/lib/coins.js";
import type { HwRec, SubRec } from "./homework.js";
import type { AttRec, LessonRec } from "./lessons.js";
import type { Model, StudentPlan } from "./plan.js";
import { DAY, MIN, Rng, addMin, at, cid, dateOnly, happened, sum, ymdAdd, ymdOf } from "./util.js";

const C = GAMIFICATION.coins;
type Row = Prisma.CoinTransactionCreateManyInput;
export type CoinPlan = { rows: Row[]; balance: Map<string, number>; streak: Map<string, { days: number; last: string | null }> };

export function planCoins(m: Model, lessons: Map<string, LessonRec[]>, att: AttRec[], hw: { hws: HwRec[]; subs: SubRec[] }): CoinPlan {
  const { clock } = m;
  const { T, now } = clock;
  const rng = new Rng("urfon-coins");
  const rows: Row[] = [];
  const lessonById = new Map([...lessons.values()].flat().map((l) => [l.id, l]));
  const hwById = new Map(hw.hws.map((h) => [h.id, h]));
  const gid = (code: string | null) => (code ? m.groups.get(code)!.id : null);
  const teacherOf = (code: string) => {
    const g = m.groups.get(code)!;
    return g.teacher ? m.staff.get(g.teacher)!.id : null;
  };
  const sanjar = m.staff.get("sanjar")!.id;
  const push = (studentId: string, reason: CoinReason, amount: number, createdAt: Date, extra: Partial<Row> = {}) => {
    const r: Row = { id: cid(), studentId, amount, reason, createdAt, refType: null, refId: null, groupId: null, note: null, createdById: null, ...extra };
    rows.push(r);
    return r;
  };
  const attendedBy = new Map<string, AttRec[]>();
  for (const a of att) {
    if ((a.status !== "PRESENT" && a.status !== "LATE") || !a.arrivedAt || a.arrivedAt > now) continue;
    (attendedBy.get(a.studentId) ?? attendedBy.set(a.studentId, []).get(a.studentId)!).push(a);
  }
  const subsBy = new Map<string, SubRec[]>();
  for (const s of hw.subs) (subsBy.get(s.studentId) ?? subsBy.set(s.studentId, []).get(s.studentId)!).push(s);
  const activityAt = (l: LessonRec) => addMin(l.startsAt, 75);
  const streakAt = (ymd: string) => (ymd === T ? happened(clock, at(T, "12:05")) : at(ymd, "20:30"));
  const streakRow = (s: StudentPlan, ymd: string, when?: Date) => push(s.id, "STREAK", C.STREAK, when ?? streakAt(ymd), { ...coinRef.day(ymd) });
  const legacy = (s: StudentPlan, amount: number, fromYmd: string, toYmd: string) => {
    // oldingi davr: haftalik MANUAL yozuvlar (eski jurnaldan ko'chirilgan)
    if (amount <= 0) return;
    const weeks = Math.max(1, Math.floor((new Date(toYmd).getTime() - new Date(fromYmd).getTime()) / (7 * DAY)));
    const chunks = Math.min(weeks, Math.max(1, Math.ceil(amount / 60)));
    let left = amount;
    for (let i = 0; i < chunks; i++) {
      const a = i === chunks - 1 ? left : Math.round(amount / chunks);
      left -= a;
      push(s.id, "MANUAL", a, at(ymdAdd(fromYmd, i * 7 + 4), "18:00"), { note: `Eski jurnaldan koʻchirilgan tangalar (${i + 1}-hafta: davomat, vazifalar va faollik)`, createdById: sanjar });
    }
  };

  const balance = new Map<string, number>();
  const streak = new Map<string, { days: number; last: string | null }>();
  const ali = m.byKey.get("ali")!;

  for (const s of m.students) {
    const start = rows.length;
    const attended = attendedBy.get(s.id) ?? [];
    const mySubs = (subsBy.get(s.id) ?? []).filter((x) => x.status === "REVIEWED" && x.coins > 0);

    if (s.id === ali.id) {
      planAli(s);
    } else {
      for (const a of attended) push(s.id, "ATTENDANCE", C.ATTENDANCE, a.arrivedAt!, { ...coinRef.lesson(a.lessonId), groupId: gid(a.group) });
      const acts: Row[] = [];
      for (const a of attended) {
        const l = lessonById.get(a.lessonId)!;
        if (activityAt(l) > now || !rng.chance(0.5)) continue;
        acts.push(push(s.id, "ACTIVITY", rng.int(C.ACTIVITY.min, C.ACTIVITY.max), activityAt(l), { ...coinRef.lesson(l.id), groupId: gid(a.group), createdById: teacherOf(a.group) }));
      }
      for (const x of mySubs) push(s.id, "HOMEWORK_ON_TIME", C.HOMEWORK_ON_TIME, x.reviewedAt!, { ...coinRef.submission(x.id), groupId: gid(hwById.get(x.hwId)!.group), createdById: x.reviewerId });
      // seriya
      let days = 0;
      let last: string | null = null;
      if (s.status === "ACTIVE" && attended.length) {
        const r = rng.next();
        days = s.coins ? rng.int(3, 9) : r < 0.45 ? rng.int(2, 10) : r < 0.7 ? 1 : 0;
        last = days ? (rng.chance(0.65) ? T : ymdAdd(T, -1)) : ymdAdd(T, -rng.int(3, 12));
        for (let i = 0; i < days - 1; i++) {
          const d = ymdAdd(last, -i);
          if (streakAt(d) <= now) streakRow(s, d);
        }
      }
      streak.set(s.id, { days, last });
      // oldingi davr
      const firstJoin = s.enrollments.map((e) => e.joined).sort()[0] ?? s.leftYmd ?? T;
      const natural = sum(rows.slice(start).map((r) => r.amount));
      if (s.coins) {
        let nat = natural;
        while (nat > s.coins && acts.length) {
          const r = acts.pop()!;
          rows.splice(rows.indexOf(r), 1);
          nat -= r.amount;
        }
        legacy(s, s.coins - nat, s.enrolledYmd, ymdAdd(firstJoin, -3));
      } else if (s.status !== "ACTIVE") {
        const end = s.leftYmd ?? s.enrollments[0]?.left ?? ymdAdd(T, -30);
        legacy(s, rng.int(30, 140) * 10, s.enrolledYmd, end);
      } else if (s.enrolledYmd < ymdAdd(firstJoin, -14)) {
        const weeks = Math.floor((new Date(firstJoin).getTime() - new Date(s.enrolledYmd).getTime()) / (7 * DAY));
        legacy(s, weeks * rng.int(15, 40), s.enrolledYmd, ymdAdd(firstJoin, -3));
      }
    }
    balance.set(s.id, sum(rows.slice(start).map((r) => r.amount)));
  }
  return { rows, balance, streak };

  // ───────────── Ali: oynalar bo'yicha aniq moslash ─────────────
  function planAli(s: StudentPlan) {
    const W1s = new Date(now.getTime() - 7 * DAY);
    const W2s = new Date(now.getTime() - 14 * DAY);
    const win = (d: Date) => (d >= W1s ? 1 : d >= W2s ? 2 : 0);
    const gr03 = lessons.get("GR-03")!;
    const L1 = gr03.find((l) => l.ymd === m.L(1))!;

    // qat'iy hodisalar
    const fixed: { amount: number; at: Date; make: () => void }[] = [];
    for (const a of attendedBy.get(s.id) ?? []) fixed.push({ amount: C.ATTENDANCE, at: a.arrivedAt!, make: () => push(s.id, "ATTENDANCE", C.ATTENDANCE, a.arrivedAt!, { ...coinRef.lesson(a.lessonId), groupId: gid("GR-03") }) });
    for (let i = 0; i <= 5; i++) {
      const d = ymdAdd(T, -i);
      const when = d === T ? happened(clock, at(T, "11:16")) : at(d, "20:30");
      fixed.push({ amount: C.STREAK, at: when, make: () => streakRow(s, d, when) });
    }
    const subs = (subsBy.get(s.id) ?? []).filter((x) => x.status === "REVIEWED" && x.coins > 0);
    for (const x of subs.filter((x) => !x.canMove)) {
      const when = x.pinnedCoinAt ?? x.reviewedAt!;
      fixed.push({ amount: C.HOMEWORK_ON_TIME, at: when, make: () => push(s.id, "HOMEWORK_ON_TIME", C.HOMEWORK_ON_TIME, when, { ...coinRef.submission(x.id), groupId: gid("GR-03"), createdById: m.staff.get("alisher")!.id, note: x.pinnedCoinAt ? "Avtomatik baholash tizimi" : null }) });
    }
    const gr03Start = m.groups.get("GR-03")!.startDate;
    const manualAt = at(ymdAdd(gr03Start, -2), "12:00");
    fixed.push({ amount: 100, at: manualAt, make: () => push(s.id, "MANUAL", 100, manualAt, { note: "Level 1 · Beginner / Starter muvaffaqiyatli yakunlandi — sovgʻa tangalar", createdById: m.staff.get("nigora")!.id }) });

    // ko'chiriladigan tekshiruvlar (vaqti o'zgarishi mumkin)
    const movable = subs.filter((x) => x.canMove).sort((a, b) => b.submittedAt!.getTime() - a.submittedAt!.getTime());
    const lb = (x: SubRec) => addMin(x.submittedAt!, 40);
    const ub = addMin(now, -15);
    const slots = gr03.filter((l) => l.status !== "PLANNED" && activityAt(l) <= now && (attendedBy.get(s.id) ?? []).some((a) => a.lessonId === l.id));
    const fixedIn = (w: number) => sum(fixed.filter((f) => win(f.at) === w).map((f) => f.amount));
    const revIn = (w: number) => movable.filter((x) => win(x.reviewedAt!) === w).length;
    const slotsIn = (w: number) => slots.filter((l) => win(activityAt(l)) === w);

    // W1 = 85
    const need1 = () => 85 - fixedIn(1) - 10 * revIn(1);
    const cap1 = 5 * slotsIn(1).length;
    for (const x of movable) {
      if (need1() <= cap1) break;
      if (win(x.reviewedAt!) === 1) continue;
      const t = new Date(Math.max(lb(x).getTime(), W1s.getTime() + 30 * MIN + rng.int(0, 3000) * 1000));
      if (t <= ub) x.reviewedAt = t;
    }
    for (const x of [...movable].reverse()) {
      if (need1() >= Math.min(cap1, slotsIn(1).length + 4)) break;
      if (win(x.reviewedAt!) !== 1 || lb(x) >= addMin(W1s, -30)) continue;
      x.reviewedAt = new Date(Math.max(lb(x).getTime(), W2s.getTime() + 60 * MIN));
    }
    // W2 = 65 (qo'shimcha: seriya kunlari)
    const streakCand2 = [] as string[];
    for (let d = ymdAdd(T, -13); d <= ymdAdd(T, -8); d = ymdAdd(d, 1)) if (win(at(d, "20:30")) === 2) streakCand2.push(d);
    const cap2 = 5 * slotsIn(2).length;
    const need2 = () => 65 - fixedIn(2) - 10 * revIn(2);
    for (const x of movable) {
      if (need2() - 2 * streakCand2.length <= cap2 - 2) break;
      if (win(x.reviewedAt!) !== 0) continue;
      const t = new Date(Math.max(lb(x).getTime(), W2s.getTime() + 45 * MIN));
      if (t < addMin(W1s, -30)) x.reviewedAt = t;
    }
    for (const x of [...movable].reverse()) {
      if (need2() >= slotsIn(2).length) break;
      if (win(x.reviewedAt!) !== 2 || lb(x) >= addMin(W2s, -60)) continue;
      x.reviewedAt = new Date(Math.max(lb(x).getTime(), W2s.getTime() - 3 * 3600_000));
    }
    let k2 = 0;
    let best = Infinity;
    const n2 = slotsIn(2).length;
    for (let k = 0; k <= streakCand2.length; k++) {
      const rem = need2() - 2 * k;
      if (rem < n2 || rem > 5 * n2) continue;
      const score = Math.abs(rem / Math.max(1, n2) - 3.2);
      if (score < best) {
        best = score;
        k2 = k;
      }
    }
    // hodisalarni yozish
    for (const f of fixed) f.make();
    for (const x of movable) push(s.id, "HOMEWORK_ON_TIME", C.HOMEWORK_ON_TIME, x.reviewedAt!, { ...coinRef.submission(x.id), groupId: gid("GR-03"), createdById: m.staff.get("alisher")!.id });
    const streak2 = streakCand2.slice(streakCand2.length - k2);
    for (const d of streak2) streakRow(s, d);
    const giveActivity = (list: LessonRec[], total: number, pin?: LessonRec) => {
      if (!list.length || total <= 0) return total;
      const vals = new Map<string, number>();
      let rem = total;
      if (pin && list.includes(pin)) {
        vals.set(pin.id, Math.min(5, rem));
        rem -= vals.get(pin.id)!;
      }
      const rest = list.filter((l) => !vals.has(l.id));
      rest.forEach((l, i) => {
        const v = Math.min(5, Math.ceil(rem / (rest.length - i)));
        vals.set(l.id, v);
        rem -= v;
      });
      for (const l of list) {
        const v = vals.get(l.id)!;
        if (v > 0) push(s.id, "ACTIVITY", v, activityAt(l), { ...coinRef.lesson(l.id), groupId: gid("GR-03"), createdById: m.staff.get("alisher")!.id, note: l.id === L1.id ? "Unit 4 darsidagi faollik" : null });
      }
      return rem;
    };
    const left1 = giveActivity(slotsIn(1), need1(), L1);
    const left2 = giveActivity(slotsIn(2), need2() - 2 * k2);
    // W0: qolgani — eski davr (Level 1) va GR-03 ning boshlanishi
    const slots0 = slotsIn(0);
    const streak0: string[] = [];
    for (let d = gr03Start; d < ymdAdd(T, -14); d = ymdAdd(d, 1)) if (win(at(d, "20:30")) === 0 && rng.chance(0.55)) streak0.push(d);
    for (const d of streak0) streakRow(s, d);
    const soFar = sum(rows.filter((r) => r.studentId === s.id).map((r) => r.amount));
    const remaining0 = 1240 - soFar;
    const act0 = Math.min(remaining0 - 300, slots0.length * 4);
    const leftAct = giveActivity(slots0, Math.max(0, act0));
    const final = 1240 - sum(rows.filter((r) => r.studentId === s.id).map((r) => r.amount));
    legacy(s, final, s.enrolledYmd, ymdAdd(gr03Start, -4));
    if (left1 || left2 || leftAct < 0) console.warn(`  ! Ali tangalari: moslashda qoldiq (W1 ${left1}, W2 ${left2})`);
    streak.set(s.id, { days: 7, last: T });
  }
}

export async function writeCoins(db: Db, m: Model, cp: CoinPlan) {
  const size = 3000;
  for (let i = 0; i < cp.rows.length; i += size) await db.coinTransaction.createMany({ data: cp.rows.slice(i, i + size) });
  for (const s of m.students) {
    const st = cp.streak.get(s.id) ?? { days: 0, last: null };
    await db.studentProfile.update({
      where: { userId: s.id },
      data: { coinBalance: cp.balance.get(s.id) ?? 0, streakDays: st.days, lastStreakDate: st.last ? dateOnly(st.last) : null },
    });
  }
  void ymdOf;
  return cp.rows.length;
}
