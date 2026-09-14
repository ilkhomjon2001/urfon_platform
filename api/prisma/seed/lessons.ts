// Darslar (startDate → T+21; GR-03 — to'liq 48), LessonTopic, davomat.
import type { AttendanceStatus, LessonStatus, Prisma } from "@prisma/client";
import type { Db } from "../../src/db.js";
import { GR03_L28_SUMMARY, GR03_PLAN, GR09_TITLES, GR20_TITLES, GR21_TITLES, LESSON_SUMMARIES, ALI_ABSENT, ALI_EXCUSED } from "./data/plans.js";
import type { Model } from "./plan.js";
import type { Structure, TopicRec } from "./structure.js";
import { Rng, addMin, at, cid, dm, insertMany } from "./util.js";

export type LessonRec = {
  id: string; group: string; n: number; ymd: string; startsAt: Date; endsAt: Date; status: LessonStatus;
  title: string; unit: number | null; topicId: string | null; summary: string | null; homeworkNote: string | null;
};
export type AttRec = { id: string; lessonId: string; studentId: string; status: AttendanceStatus; arrivedAt: Date | null; group: string; n: number };

function unitPlan(topics: TopicRec[], total: number, first?: number) {
  const out: { unit: number; part: number; topic: TopicRec }[] = [];
  const counts = topics.map((t, i) => (i === 0 && first ? first : t.lessons));
  let i = 0;
  while (out.length < total) {
    const t = topics[Math.min(i, topics.length - 1)];
    const c = counts[Math.min(i, topics.length - 1)];
    for (let k = 1; k <= c && out.length < total; k++) out.push({ unit: t.unit, part: k, topic: t });
    i++;
  }
  return out;
}

export function planLessons(m: Model, st: Structure) {
  const { clock } = m;
  const rng = new Rng("urfon-lessons");
  const lessons = new Map<string, LessonRec[]>();
  for (const g of m.groups.values()) {
    const topics = g.level ? st.topics.get(g.level)! : [];
    const up = g.plan === "level" ? unitPlan(topics, g.totalLessons) : g.plan === "gr04" ? unitPlan(topics, g.totalLessons, 5) : null;
    const recs: LessonRec[] = [];
    g.dates.forEach((ymd, i) => {
      const n = i + 1;
      const startsAt = at(ymd, g.start);
      const endsAt = at(ymd, g.end);
      const status: LessonStatus = endsAt <= clock.now ? "DONE" : startsAt <= clock.now ? "IN_PROGRESS" : "PLANNED";
      let title: string;
      let unit: number | null = null;
      let topicId: string | null = null;
      if (g.plan === "gr03") {
        const p = GR03_PLAN[i];
        title = p.title;
        unit = p.unit;
        topicId = p.unit ? topics[p.unit - 1].id : null;
      } else if (up) {
        const u = up[i];
        title = `Unit ${u.unit} — ${u.topic.title} (${u.part}-qism)`;
        unit = u.unit;
        topicId = u.topic.id;
      } else {
        const list = g.plan === "gr09" ? GR09_TITLES : g.plan === "gr20" ? GR20_TITLES : GR21_TITLES;
        title = list[i % list.length];
      }
      let summary: string | null = null;
      let homeworkNote: string | null = null;
      if (status === "DONE") summary = rng.pick(LESSON_SUMMARIES)(title.replace(/ \(\d+-qism\)$/, ""));
      if (g.code === "GR-03" && n === 28) {
        summary = GR03_L28_SUMMARY;
        homeworkNote = `Unit 4 — Family words: 12 ta soʻz, 1–2 daqiqalik audio va sevimli ibora. Muddati: ${dm(m.clock.T)}, 20:00.`;
      }
      if (g.code === "GR-03" && n === 27) summary = "Unit 3 boʻyicha individual Speaking interview oʻtkazildi: har bir oʻquvchi 4–5 daqiqa kun tartibi va odatlar haqida gapirdi, chastota ravishlari baholandi.";
      recs.push({ id: cid(), group: g.code, n, ymd, startsAt, endsAt, status, title, unit, topicId, summary, homeworkNote });
    });
    lessons.set(g.code, recs);
  }
  return lessons;
}

export function planAttendance(m: Model, lessons: Map<string, LessonRec[]>) {
  const rng = new Rng("urfon-attendance");
  const out: AttRec[] = [];
  const ali = m.byKey.get("ali")!;
  for (const g of m.groups.values()) {
    const members = m.students.flatMap((s) => s.enrollments.filter((e) => e.group === g.code && e.status !== "WAITING").map((e) => ({ s, e })));
    for (const l of lessons.get(g.code)!) {
      if (l.status === "PLANNED") continue;
      for (const { s, e } of members) {
        if (e.joined > l.ymd || (e.left && e.left <= l.ymd)) continue;
        let status: AttendanceStatus;
        let arrivedAt: Date | null;
        if (s.id === ali.id && g.code === "GR-03") {
          status = l.n === ALI_ABSENT ? "ABSENT" : l.n === ALI_EXCUSED ? "EXCUSED" : "PRESENT";
          const mins = l.n === 28 ? 8 : l.n === 29 ? 5 : rng.int(3, 14);
          arrivedAt = status === "PRESENT" ? addMin(l.startsAt, -mins) : null;
        } else {
          const r = rng.next();
          const pPresent = s.attend;
          status = r < pPresent - 0.03 ? "PRESENT" : r < pPresent ? "LATE" : r < pPresent + (1 - pPresent) / 2 ? "EXCUSED" : "ABSENT";
          arrivedAt = status === "PRESENT" ? addMin(l.startsAt, -rng.int(1, 15)) : status === "LATE" ? addMin(l.startsAt, rng.int(5, 18)) : null;
        }
        if (arrivedAt && arrivedAt > m.clock.now) continue; // hali kelmagan
        out.push({ id: cid(), lessonId: l.id, studentId: s.id, status, arrivedAt, group: g.code, n: l.n });
      }
    }
  }
  return out;
}

export async function writeLessons(db: Db, m: Model, st: Structure, lessons: Map<string, LessonRec[]>, att: AttRec[]) {
  const rows: Prisma.LessonCreateManyInput[] = [];
  const lt: Prisma.LessonTopicCreateManyInput[] = [];
  for (const g of m.groups.values()) {
    for (const l of lessons.get(g.code)!) {
      rows.push({
        id: l.id, groupId: g.id, roomId: st.rooms.get(g.room)!, number: l.n, title: l.title, startsAt: l.startsAt, endsAt: l.endsAt,
        status: l.status, summary: l.summary, homeworkNote: l.homeworkNote, createdAt: at(g.createdYmd, "12:00"),
        updatedAt: l.status === "DONE" ? addMin(l.endsAt, 5) : at(g.createdYmd, "12:00"),
      });
      if (l.topicId) lt.push({ lessonId: l.id, topicId: l.topicId });
    }
  }
  await insertMany(db.lesson, rows);
  await insertMany(db.lessonTopic, lt);
  const teacherOf = new Map([...m.groups.values()].map((g) => [g.code, g.teacher ? m.staff.get(g.teacher)!.id : null]));
  const byLesson = new Map([...lessons.values()].flat().map((l) => [l.id, l]));
  await insertMany(
    db.attendance,
    att.map((a) => {
      const l = byLesson.get(a.lessonId)!;
      const turnstile = a.arrivedAt !== null && a.status === "PRESENT";
      const note = a.status === "EXCUSED" ? "Sababli — ota-ona oldindan xabar berdi" : a.status === "LATE" ? "Kechikib keldi" : null;
      const created = a.arrivedAt ?? addMin(l.startsAt, 10);
      return {
        id: a.id, lessonId: a.lessonId, studentId: a.studentId, status: a.status, arrivedAt: a.arrivedAt, source: turnstile ? "TURNSTILE" : "MANUAL",
        note, markedById: turnstile ? null : teacherOf.get(a.group) ?? null, createdAt: created, updatedAt: created,
      };
    }),
  );
}
