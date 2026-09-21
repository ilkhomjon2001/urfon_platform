// GET /api/parent/grades?studentId=&from=YYYY-MM-DD&to=YYYY-MM-DD — farzandning to'liq profili va o'zlashtirishi.
// Faqat farzandning o'z natijalari va "Aʼlo chegarasi (4.5)" mo'ljal chizig'i. Guruh o'rtachasi/reyting YO'Q (KANON §8).
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { parse, zYmd } from "../../lib/http.js";
import { addDays, atTz, endOfDayTz, startOfMonthTz, startOfWeekTz } from "../../lib/dates.js";
import {
  ALA_THRESHOLD,
  attendanceStats,
  avg,
  avgLabel,
  childExamWhere,
  childHomeworkWhere,
  childLessonWhere,
  childQuery,
  distribution,
  GRADE_KIND_LABEL,
  gradeSkill,
  loadChild,
  round2,
} from "./common.js";

const query = childQuery.extend({ from: zYmd.optional(), to: zYmd.optional() });

const SKILL_ORDER = ["SPEAKING", "LISTENING", "READING", "WRITING", "GRAMMAR", "VOCABULARY"];

export default async function grades(app: FastifyInstance) {
  app.get("/grades", async (req) => {
    const q = parse(query, req.query);
    const child = await loadChild(req.auth.userId, q.studentId);
    const now = new Date();
    const from = q.from ? atTz(q.from, "00:00") : null;
    const to = q.to ? endOfDayTz(atTz(q.to, "12:00")) : now;
    const upTo = to < now ? to : now;
    const range = { ...(from ? { gte: from } : {}), lte: to };
    const primary = child.primaryGroup;

    const [gradeRows, lessonRows, homework, results, upcomingExams, levels, doneInGroup, finalExam] = await Promise.all([
      prisma.grade.findMany({
        where: { studentId: child.id, gradedAt: range },
        orderBy: { gradedAt: "desc" },
        select: {
          id: true, value: true, kind: true, skill: true, title: true, comment: true, gradedAt: true,
          lesson: { select: { id: true, title: true, startsAt: true } },
          group: { select: { name: true } },
          givenBy: { select: { fullName: true } },
        },
      }),
      prisma.lesson.findMany({
        where: childLessonWhere(child, { startsAt: { ...(from ? { gte: from } : {}), lte: upTo } }),
        select: { startsAt: true, endsAt: true, status: true, attendance: { where: { studentId: child.id }, select: { status: true } } },
      }),
      prisma.homework.findMany({
        where: childHomeworkWhere(child, { createdAt: { lte: now }, dueAt: range }),
        select: { dueAt: true, submissions: { where: { studentId: child.id }, select: { status: true, isLate: true } } },
      }),
      prisma.examResult.findMany({
        where: { studentId: child.id, exam: { startsAt: range } },
        orderBy: { exam: { startsAt: "desc" } },
        select: {
          id: true, band: true, percent: true, listening: true, reading: true, writing: true, speaking: true, comment: true, createdAt: true,
          exam: { select: { id: true, title: true, type: true, startsAt: true, location: true } },
        },
      }),
      prisma.exam.findMany({
        where: { startsAt: { gt: now }, ...childExamWhere(child) },
        orderBy: { startsAt: "asc" },
        take: 3,
        select: { id: true, title: true, type: true, startsAt: true, durationMin: true, location: true },
      }),
      prisma.level.findMany({ orderBy: { order: "asc" }, select: { id: true, code: true, name: true, order: true } }),
      primary ? prisma.lesson.count({ where: { groupId: primary.id, status: "DONE" } }) : Promise.resolve(0),
      primary
        ? prisma.exam.findFirst({ where: { groupId: primary.id, type: "FINAL" }, orderBy: { startsAt: "desc" }, select: { startsAt: true, title: true } })
        : Promise.resolve(null),
    ]);

    const values = gradeRows.map((g) => g.value);
    const average = avg(values);

    // O'z o'sishi: oxirgi 4 hafta vs undan oldingi 4 hafta (davr oxiriga nisbatan)
    const cut = addDays(upTo, -28);
    const cut2 = addDays(upTo, -56);
    const recentAvg = avg(gradeRows.filter((g) => g.gradedAt > cut).map((g) => g.value));
    const prevAvg = avg(gradeRows.filter((g) => g.gradedAt <= cut && g.gradedAt > cut2).map((g) => g.value));
    const growth = recentAvg != null && prevAvg != null ? round2(recentAvg - prevAvg) : null;

    // Ko'nikmalar
    const bySkill = new Map<string, { all: number[]; recent: number[]; prev: number[] }>();
    for (const g of gradeRows) {
      const sk = gradeSkill(g);
      if (!sk) continue;
      const e = bySkill.get(sk) ?? { all: [], recent: [], prev: [] };
      e.all.push(g.value);
      if (g.gradedAt > cut) e.recent.push(g.value);
      else if (g.gradedAt > cut2) e.prev.push(g.value);
      bySkill.set(sk, e);
    }
    const skills = [...bySkill.entries()]
      .sort((a, b) => SKILL_ORDER.indexOf(a[0]) - SKILL_ORDER.indexOf(b[0]))
      .map(([skill, e]) => {
        const a = avg(e.all);
        const r = avg(e.recent);
        const p = avg(e.prev);
        const trend = r != null && p != null ? round2(r - p) : null;
        return { skill, average: a, count: e.all.length, trend, belowAla: a != null && a < ALA_THRESHOLD };
      });

    // Vaqt bo'yicha qator: hafta (uzun davr bo'lsa oy) kesimida o'rtacha
    const sortedAsc = [...gradeRows].sort((a, b) => a.gradedAt.getTime() - b.gradedAt.getTime());
    const spanDays = sortedAsc.length ? (sortedAsc.at(-1)!.gradedAt.getTime() - sortedAsc[0].gradedAt.getTime()) / 86_400_000 : 0;
    const bucket: "week" | "month" = spanDays > 7 * 26 ? "month" : "week";
    const buckets = new Map<string, { start: Date; values: number[]; best: { title: string | null; value: number; kind: string } | null }>();
    for (const g of sortedAsc) {
      const start = bucket === "week" ? startOfWeekTz(g.gradedAt) : startOfMonthTz(g.gradedAt);
      const key = start.toISOString();
      const b = buckets.get(key) ?? { start, values: [], best: null };
      b.values.push(g.value);
      if (!b.best || g.value >= b.best.value) b.best = { title: g.title, value: g.value, kind: g.kind };
      buckets.set(key, b);
    }
    const series = [...buckets.values()].map((b) => ({ start: b.start, average: avg(b.values), count: b.values.length, best: b.best }));

    // Uyga vazifalar
    const hwDone = homework.filter((h) => ["SUBMITTED", "REVIEWED"].includes(h.submissions[0]?.status ?? ""));
    const hwTotal = homework.length;

    // Level xaritasi (faqat farzandning o'z yo'li)
    const curLevel = primary?.level ?? null;
    const progress = primary ? Math.min(100, Math.round((doneInGroup / Math.max(1, primary.totalLessons)) * 100)) : 0;
    // Har level — alohida kitob; 8–12 va 13–16 yosh bir xil zinapoyadan oʻtadi (faqat surʼati farq qiladi)
    const path = levels;
    const levelMap = path.map((l) => {
      const state = !curLevel
        ? "PLANNED"
        : l.id === curLevel.id
          ? "CURRENT"
          : l.order < curLevel.order
            ? "DONE"
            : path.find((x) => x.order > curLevel.order)?.id === l.id
              ? "NEXT"
              : "PLANNED";
      return {
        id: l.id,
        code: l.code,
        name: l.name,
        order: l.order,
        state,
        progress: state === "DONE" ? 100 : state === "CURRENT" ? progress : 0,
        finalExamAt: state === "CURRENT" ? (finalExam?.startsAt ?? null) : null,
      };
    });

    const teacher = child.info.group?.teacher ?? null;

    return {
      now,
      range: { from: from ?? null, to },
      child: child.info,
      threshold: ALA_THRESHOLD,
      average,
      label: avgLabel(average),
      growth,
      count: values.length,
      distribution: distribution(values),
      skills,
      bucket,
      series,
      grades: gradeRows.slice(0, 50).map((g) => ({
        id: g.id,
        value: g.value,
        kind: g.kind,
        kindLabel: GRADE_KIND_LABEL[g.kind] ?? g.kind,
        skill: gradeSkill(g),
        title: g.title,
        comment: g.comment,
        gradedAt: g.gradedAt,
        teacher: g.givenBy.fullName,
        group: g.group.name,
        lesson: g.lesson,
      })),
      exams: results.map((r) => ({
        id: r.id,
        exam: r.exam,
        band: r.band,
        percent: r.percent,
        sections: { listening: r.listening, reading: r.reading, writing: r.writing, speaking: r.speaking },
        comment: r.comment,
      })),
      upcomingExams,
      attendance: attendanceStats(lessonRows, now),
      homework: {
        total: hwTotal,
        done: hwDone.length,
        onTime: hwDone.filter((h) => !h.submissions[0]?.isLate).length,
        percent: hwTotal ? Math.round((hwDone.length / hwTotal) * 100) : null,
      },
      level: primary ? { label: child.info.group?.level?.label ?? primary.name, lessonsDone: doneInGroup, totalLessons: primary.totalLessons, progress } : null,
      levelMap,
      teacher,
    };
  });
}
