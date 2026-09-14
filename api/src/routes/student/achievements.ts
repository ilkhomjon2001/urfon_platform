// /api/student/achievements — kumush tangalar va yutuqlar. KANON §8 (bosimsiz):
//  • asosiy ko'rinish — bolaning O'Z o'sishi (o'tgan haftaga nisbatan);
//  • "Guruhdagi faollik" — alohida bo'lim, faqat shu haftada yig'ilgan tanga, ism + bosh harflar;
//    boshqalarning seriyasi, Level'i, umumiy balansi, o'rni ("Top N", "X dan N ta ortdasiz") YO'Q.
// Barcha raqamlar (qoidalar, unvonlar) config/gamification.ts dan — web'da hardcode qilinmaydi.
import type { FastifyInstance } from "fastify";
import type { CoinTransaction } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../db.js";
import { GAMIFICATION, coinTitle } from "../../config/gamification.js";
import { addDays, dbDateYmd, startOfMonthTz, ymdTz } from "../../lib/dates.js";
import { paged, paginate, parse } from "../../lib/http.js";
import { COIN_REASON_LABEL, activeIds, myEnrollments, primaryEnrollment } from "./shared.js";

const txQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const WEEKS = 8;

// Shaxsiy nishonlar — faqat o'z natijasi bo'yicha (boshqalar bilan solishtirish yo'q)
const MILESTONE = { homework: 10, lessonsInRow: 12, activeWeek: 50, longStreak: 30, audio: 10, examPercent: 90, examBand: 7 } as const;

const initials = (name: string) =>
  name.trim().split(/\s+/).filter((w) => w && !w.endsWith(".")).slice(0, 2).map((w) => Array.from(w)[0] ?? "").join("").toUpperCase();

/** Tranzaksiyalarga odam o'qiydigan sarlavha, izoh va havola qo'shadi. */
async function describe(rows: (CoinTransaction & { createdBy: { fullName: string } | null })[]) {
  const ids = (t: string[]) => [...new Set(rows.filter((r) => r.refId && t.includes(r.refType ?? "")).map((r) => r.refId!))];
  const subIds = ids(["submission"]);
  const lessonish = ids(["attendance", "lesson"]);
  const [subs, atts, lessons] = await Promise.all([
    subIds.length
      ? prisma.submission.findMany({ where: { id: { in: subIds } }, select: { id: true, isLate: true, homework: { select: { id: true, title: true } } } })
      : [],
    lessonish.length
      ? prisma.attendance.findMany({ where: { id: { in: lessonish } }, select: { id: true, status: true, lesson: { select: { id: true, title: true, room: { select: { name: true } }, group: { select: { room: { select: { name: true } } } } } } } })
      : [],
    lessonish.length ? prisma.lesson.findMany({ where: { id: { in: lessonish } }, select: { id: true, title: true, room: { select: { name: true } }, group: { select: { room: { select: { name: true } } } } } }) : [],
  ]);
  const subMap = new Map(subs.map((s) => [s.id, s]));
  const attMap = new Map(atts.map((a) => [a.id, a]));
  const lesMap = new Map(lessons.map((l) => [l.id, l]));

  return rows.map((r) => {
    let title: string = COIN_REASON_LABEL[r.reason];
    let detail: string | null = r.note;
    let link: string | null = null;
    const sub = r.refId ? subMap.get(r.refId) : undefined;
    const lesson = r.refId ? (attMap.get(r.refId)?.lesson ?? lesMap.get(r.refId)) : undefined;
    if (sub) {
      title = `Uyga vazifa: ${sub.homework.title}`;
      detail = detail ?? (r.reason === "HOMEWORK_ON_TIME" ? "Oʻz vaqtida" : null);
      link = `/oquvchi/vazifalar/${sub.homework.id}`;
    } else if (lesson) {
      const room = lesson.room?.name ?? lesson.group.room?.name;
      if (r.reason === "ATTENDANCE") title = room ? `Darsga keldi (${room})` : "Darsga keldi";
      else if (r.reason === "ACTIVITY") title = "Darsdagi faollik";
      detail = detail ?? lesson.title;
    } else if (r.reason === "STREAK") {
      title = "Kunlik seriya";
    }
    if (r.reason === "ACTIVITY" && r.createdBy) detail = detail ? `${detail} · ${r.createdBy.fullName}` : `Ustoz ${r.createdBy.fullName}`;
    return {
      id: r.id,
      amount: r.amount,
      reason: r.reason,
      reasonLabel: COIN_REASON_LABEL[r.reason],
      title,
      detail,
      link,
      ref: r.refType ? { type: r.refType, id: r.refId } : null,
      createdAt: r.createdAt,
    };
  });
}

export default async function achievements(app: FastifyInstance) {
  app.get("/achievements", async (req) => {
    const studentId = req.auth.userId;
    const now = new Date();
    // 7 kunlik siljuvchi oynalar: oxirgisi — "oxirgi 7 kun" (KANON §8), dushanba kuni ham nolga tushmaydi
    const weekStart = addDays(now, -7);
    const seriesStart = addDays(now, -7 * WEEKS);
    const monthStart = startOfMonthTz(now);
    const lastMonthStart = startOfMonthTz(addDays(monthStart, -1));
    const earliest = seriesStart < lastMonthStart ? seriesStart : lastMonthStart;

    const [profile, es, recentTx, txCount] = await Promise.all([
      prisma.studentProfile.findUnique({ where: { userId: studentId } }),
      myEnrollments(studentId),
      prisma.coinTransaction.findMany({ where: { studentId, createdAt: { gte: earliest } }, select: { amount: true, reason: true, createdAt: true } }),
      prisma.coinTransaction.count({ where: { studentId } }),
    ]);
    const latestRows = await prisma.coinTransaction.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { createdBy: { select: { fullName: true } } },
    });

    const balance = profile?.coinBalance ?? 0;
    const streakDays = profile?.streakDays ?? 0;
    const activeToday = !!profile?.lastStreakDate && dbDateYmd(profile.lastStreakDate) === ymdTz(now);

    // ── Unvon ──
    const t = coinTitle(balance);
    const titles = GAMIFICATION.titles;
    const curIdx = titles.findIndex((x) => x.name === t.current);
    const curMin = titles[curIdx]?.min ?? 0;
    const nextMin = t.next ? titles[curIdx + 1]?.min ?? null : null;
    const title = {
      current: t.current,
      currentMin: curMin,
      next: t.next && nextMin != null ? { name: t.next.name, remaining: t.next.remaining, target: nextMin } : null,
      progress: nextMin != null ? Math.round(((balance - curMin) / (nextMin - curMin)) * 100) : 100,
      all: titles.map((x) => ({ name: x.name, min: x.min, reached: balance >= x.min })),
    };

    // ── O'z o'sishi: haftalik seriya (faqat yig'ilgan, ya'ni musbat) ──
    const earned = recentTx.filter((x) => x.amount > 0);
    const weeks = Array.from({ length: WEEKS }, (_, i) => {
      const start = addDays(seriesStart, i * 7);
      const end = addDays(start, 7);
      const last = i === WEEKS - 1;
      const coins = earned.filter((x) => x.createdAt >= start && (last || x.createdAt < end)).reduce((a, b) => a + b.amount, 0);
      return { start, end: last ? now : addDays(end, -1), coins, current: last };
    });
    const thisWeek = weeks[WEEKS - 1].coins;
    const lastWeek = weeks[WEEKS - 2].coins;
    const sum = (from: Date, to?: Date) => earned.filter((x) => x.createdAt >= from && (!to || x.createdAt < to)).reduce((a, b) => a + b.amount, 0);
    const byReason: Record<string, number> = {};
    for (const x of earned) if (x.createdAt >= weekStart) byReason[x.reason] = (byReason[x.reason] ?? 0) + x.amount;

    // ── Qoidalar (config'dan) ──
    const c = GAMIFICATION.coins;
    const rules = [
      { key: "HOMEWORK_ON_TIME", title: "Uyga vazifa", description: "Uyga vazifani toʻliq va oʻz vaqtida topshirsangiz, ustoz tekshirgandan keyin beriladi.", amount: c.HOMEWORK_ON_TIME, min: null, max: null, hint: "Oʻz vaqtida topshirilsa" },
      { key: "ATTENDANCE", title: "Darsga kelish", description: "Har bir darsga kelganingiz uchun — tayyorgarlik va intizom bilan qatnashing.", amount: c.ATTENDANCE, min: null, max: null, hint: "Har bir dars uchun" },
      { key: "ACTIVITY", title: "Darsdagi faollik", description: "Darsdagi dialoglar, savollarga javob va ustozning maxsus ragʻbati.", amount: null, min: c.ACTIVITY.min, max: c.ACTIVITY.max, hint: "Ustoz belgilaydi" },
      { key: "STREAK", title: "Kunlik seriya", description: "Har kuni biror foydali ish qilsangiz: vazifa topshirish yoki darsga kelish.", amount: c.STREAK, min: null, max: null, hint: "Har kuni" },
    ];

    // ── Shaxsiy nishonlar ──
    const primary = primaryEnrollment(es);
    const [submittedCount, audioCount, lastAttendance, bestExam, doneLessons, finalExam] = await Promise.all([
      prisma.submission.count({ where: { studentId, status: { in: ["SUBMITTED", "REVIEWED"] } } }),
      prisma.submission.count({ where: { studentId, status: { in: ["SUBMITTED", "REVIEWED"] }, homework: { type: "AUDIO" } } }),
      prisma.attendance.findMany({ where: { studentId }, orderBy: { lesson: { startsAt: "desc" } }, take: 60, select: { status: true } }),
      prisma.examResult.findFirst({ where: { studentId }, orderBy: [{ percent: "desc" }], select: { percent: true, band: true } }),
      primary ? prisma.lesson.count({ where: { groupId: primary.groupId, status: "DONE" } }) : 0,
      primary ? prisma.exam.findFirst({ where: { groupId: primary.groupId, type: "FINAL" }, orderBy: { startsAt: "desc" }, select: { startsAt: true } }) : null,
    ]);
    let inRow = 0;
    for (const a of lastAttendance) {
      if (a.status === "PRESENT" || a.status === "LATE") inRow++;
      else if (a.status === "ABSENT") break; // sababli qoldirish seriyani uzmaydi
    }
    const bestWeek = Math.max(0, ...weeks.map((w) => w.coins));
    const examOk = !!bestExam && ((bestExam.percent ?? 0) >= MILESTONE.examPercent || (bestExam.band ?? 0) >= MILESTONE.examBand);
    const lvProgress = primary ? Math.min(100, Math.round((doneLessons / Math.max(1, primary.group.totalLessons)) * 100)) : 0;
    const lvName = primary?.group.level?.code.startsWith("L") ? `Level ${primary.group.level.code.slice(1)}` : (primary?.group.level?.name ?? "Level");
    const m = (key: string, name: string, current: number, target: number, hint: string) => ({
      key, title: name, achieved: current >= target, progress: { current: Math.min(current, target), target }, hint,
    });
    const milestones = [
      m("first_step", "Ilk qadam", submittedCount, 1, "Birinchi vazifa topshirildi"),
      m("homework_10", `${MILESTONE.homework} ta vazifa`, submittedCount, MILESTONE.homework, `${Math.min(submittedCount, MILESTONE.homework)} / ${MILESTONE.homework} ta vazifa`),
      m("lessons_row", "Dars qoldirmasdan", inRow, MILESTONE.lessonsInRow, `${Math.min(inRow, MILESTONE.lessonsInRow)} / ${MILESTONE.lessonsInRow} dars ketma-ket`),
      m("active_week", "Faol hafta", bestWeek, MILESTONE.activeWeek, `Bir haftada ${MILESTONE.activeWeek}+ tanga`),
      { key: "level_done", title: `${lvName} yakuni`, achieved: lvProgress >= 100, progress: { current: lvProgress, target: 100 }, hint: finalExam ? "Yakuniy imtihon" : `${lvProgress}% oʻtildi`, date: finalExam?.startsAt ?? null },
      m("long_streak", "Uzun seriya", streakDays, MILESTONE.longStreak, `${Math.min(streakDays, MILESTONE.longStreak)} / ${MILESTONE.longStreak} kun`),
      m("speaking", "Speaking ustasi", audioCount, MILESTONE.audio, `${Math.min(audioCount, MILESTONE.audio)} / ${MILESTONE.audio} ta audio`),
      { key: "exam", title: "Imtihon ustasi", achieved: examOk, progress: null, hint: `Mock ${MILESTONE.examPercent}%+` },
    ];

    // ── Guruhdagi faollik (alohida, tinch bo'lim): faqat shu hafta yig'ilgan tangalar ──
    const groups = [];
    for (const e of es.filter((x) => activeIds(es).includes(x.groupId))) {
      const members = await prisma.groupStudent.findMany({
        where: { groupId: e.groupId, status: "ACTIVE" },
        select: { studentId: true, student: { select: { fullName: true } } },
      });
      const ids = members.map((x) => x.studentId);
      const [weekAgg, allAgg] = await Promise.all([
        prisma.coinTransaction.groupBy({
          by: ["studentId"],
          where: { studentId: { in: ids }, amount: { gt: 0 }, createdAt: { gte: weekStart }, OR: [{ groupId: e.groupId }, { groupId: null }] },
          _sum: { amount: true },
        }),
        prisma.coinTransaction.aggregate({ where: { groupId: e.groupId, amount: { gt: 0 } }, _sum: { amount: true } }),
      ]);
      const wk = new Map(weekAgg.map((x) => [x.studentId, x._sum.amount ?? 0]));
      const list = members
        .map((x) => ({ name: x.student.fullName, initials: initials(x.student.fullName), coins: wk.get(x.studentId) ?? 0, isMe: x.studentId === studentId }))
        .sort((a, b) => b.coins - a.coins || a.name.localeCompare(b.name, "uz"));
      groups.push({
        group: { id: e.group.id, name: e.group.name },
        period: GAMIFICATION.leaderboard.period,
        weekStart,
        members: list,
        total: { week: list.reduce((a, b) => a + b.coins, 0), allTime: allAgg._sum.amount ?? 0 },
      });
    }

    return {
      now,
      balance,
      title,
      streak: { days: streakDays, activeToday, bonus: c.STREAK },
      growth: {
        thisWeek,
        lastWeek,
        diff: thisWeek - lastWeek,
        thisMonth: sum(monthStart),
        lastMonth: sum(lastMonthStart, monthStart),
        weeks,
        thisWeekByReason: Object.entries(byReason).map(([reason, amount]) => ({ reason, label: COIN_REASON_LABEL[reason as keyof typeof COIN_REASON_LABEL], amount })),
      },
      rules,
      milestones,
      transactions: { items: await describe(latestRows), total: txCount },
      groups,
    };
  });

  app.get("/achievements/transactions", async (req) => {
    const q = parse(txQuery, req.query);
    const studentId = req.auth.userId;
    const [total, rows] = await Promise.all([
      prisma.coinTransaction.count({ where: { studentId } }),
      prisma.coinTransaction.findMany({
        where: { studentId },
        orderBy: { createdAt: "desc" },
        ...paginate(q),
        include: { createdBy: { select: { fullName: true } } },
      }),
    ]);
    return paged(await describe(rows), total, q);
  });
}
