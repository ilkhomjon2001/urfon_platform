// Uyga vazifalar, topshiriqlar (22 ta SUBMITTED — Alisher), baholar. Avval xotirada reja, keyin yozish.
import type { GradeKind, HomeworkType, Prisma, Skill, SubmissionStatus } from "@prisma/client";
import type { Db } from "../../src/db.js";
import { ALI_GRADES, CANON_HW, FEEDBACK_3, FEEDBACK_4, FEEDBACK_5, GR03_PLAN, RETURN_NOTES } from "./data/plans.js";
import { storeFile, type FileSpec } from "./files.js";
import { answersFor, buildQuiz, type QuizQuestion } from "./data/quiz.js";
import type { LessonRec, AttRec } from "./lessons.js";
import type { Model, StudentPlan } from "./plan.js";
import { MIN, Rng, addMin, at, cid, happened, insertMany, nextWeekday, ymdAdd, ymdOf, type Clock } from "./util.js";

export type HwRec = {
  id: string; group: string; lessonId: string | null; lessonN: number; topicId: string | null; title: string; desc: string;
  type: HomeworkType; skill: Skill; dueAt: Date; createdAt: Date; createdById: string; canon?: string;
  content: { questions: QuizQuestion[] } | null; // QUIZ: ilova formati
};
type HwSpec = Omit<HwRec, "id" | "content">;
export type SubRec = {
  id: string; hwId: string; studentId: string; group: string; status: SubmissionStatus; submittedAt: Date | null; isLate: boolean;
  reviewerId: string | null; reviewedAt: Date | null; score: number | null; feedback: string | null; coins: number; createdAt: Date;
  text: string | null; answers: Prisma.InputJsonValue | null; files: FileSpec[]; pinnedCoinAt?: Date; gradeComment?: string;
  /** coin solver chegaralari (faqat Ali uchun ishlatiladi) */
  canMove?: boolean;
};
export type GradeRec = {
  id: string; studentId: string; group: string; lessonId: string | null; submissionId: string | null; kind: GradeKind; skill: Skill | null;
  value: number; title: string; comment: string | null; givenById: string; gradedAt: Date; updatedAt: Date;
};

const TEXTS = [
  "My favourite place in my city is the central park. I usually go there with my friends at the weekend.",
  "In my opinion, technology helps students learn faster, but teachers are still very important.",
  "Every morning I get up at seven o'clock, have breakfast and go to school by bus.",
  "My family is not very big. I have one brother and one sister, and we get along well.",
];
const GROUP_SKILLS: Record<string, [HomeworkType, Skill, string][]> = {
  default: [["FILE", "WRITING", "yozma ish"], ["AUDIO", "SPEAKING", "speaking audio"], ["QUIZ", "VOCABULARY", "lugʻat testi"], ["QUIZ", "READING", "reading mashqi"], ["QUIZ", "LISTENING", "listening mashqi"]],
  kids: [["FILE", "WRITING", "ish daftari (rasm)"], ["QUIZ", "VOCABULARY", "soʻz oʻyini"], ["AUDIO", "SPEAKING", "qoʻshiq/sheʼr yodlash (audio)"]],
  grammar: [["QUIZ", "GRAMMAR", "grammatika mashqlari"], ["TEXT", "WRITING", "gaplar tuzish"], ["FILE", "GRAMMAR", "worksheet (rasm/PDF)"]],
  club: [["AUDIO", "SPEAKING", "self-recording"]],
};

const between = (a: Date, b: Date, f: number) => new Date(a.getTime() + Math.max(0, b.getTime() - a.getTime()) * f);

export function planHomework(m: Model, lessons: Map<string, LessonRec[]>, att: AttRec[]) {
  const { clock } = m;
  const T = clock.T;
  const rng = new Rng("urfon-homework");
  const hws: HwRec[] = [];
  const subs: SubRec[] = [];
  const grades: GradeRec[] = [];
  const alisher = m.staff.get("alisher")!.id;
  const attended = new Set(att.filter((a) => a.status === "PRESENT" || a.status === "LATE").map((a) => `${a.lessonId}:${a.studentId}`));
  const members = (code: string, ymd: string) =>
    m.students.filter((s) => s.enrollments.some((e) => e.group === code && e.status !== "WAITING" && e.joined <= ymd && (!e.left || e.left > ymd)));
  const teacherId = (code: string) => {
    const g = m.groups.get(code)!;
    return g.teacher ? m.staff.get(g.teacher)!.id : m.staff.get("nigora")!.id;
  };
  const nextDue = (code: string, l: LessonRec) => {
    const g = m.groups.get(code)!;
    const next = g.allDates.find((d) => d > l.ymd) ?? ymdAdd(l.ymd, 7);
    return at(next, g.code === "GR-20" ? "12:00" : "20:00");
  };
  const feedbackFor = (score: number) => rng.pick(score >= 5 ? FEEDBACK_5 : score === 4 ? FEEDBACK_4 : FEEDBACK_3);
  const now = clock.now;
  const latestOk = new Date(now.getTime() - 15 * MIN);

  const addHw = (h: HwSpec) => {
    const id = cid();
    const content = h.type === "QUIZ" ? buildQuiz(h.title, h.skill, h.group, m.groups.get(h.group)!.level, `${h.group}:${h.lessonN}:${h.title}`) : null;
    const r: HwRec = { ...h, id, content };
    hws.push(r);
    return r;
  };
  const mkSub = (h: HwRec, s: StudentPlan, p: Partial<SubRec>): SubRec => {
    const r: SubRec = {
      id: cid(), hwId: h.id, studentId: s.id, group: h.group, status: "SUBMITTED", submittedAt: null, isLate: false, reviewerId: null,
      reviewedAt: null, score: null, feedback: null, coins: 0, createdAt: h.createdAt, text: null, answers: null, files: [], ...p,
    };
    if (r.submittedAt && !p.createdAt) r.createdAt = addMin(r.submittedAt, -rng.int(5, 90));
    if (r.createdAt < h.createdAt) r.createdAt = h.createdAt;
    if (!r.text && h.type === "TEXT" && r.submittedAt) r.text = rng.pick(TEXTS);
    subs.push(r);
    return r;
  };
  const review = (r: SubRec, s: StudentPlan, reviewedAt: Date, score?: number) => {
    r.status = "REVIEWED";
    r.score = score ?? rng.grade(s.mean);
    r.reviewerId = teacherId(r.group);
    r.reviewedAt = reviewedAt;
    r.feedback = feedbackFor(r.score);
    r.coins = r.isLate ? 0 : 10;
  };

  // ── Oddiy (o'tgan) vazifa: topshirish ehtimoli, kechikish, tekshiruv ──
  const regularSubs = (h: HwRec, allowPending: boolean) => {
    for (const s of members(h.group, ymdOf(h.createdAt))) {
      if (!rng.chance(Math.min(0.97, 0.72 + (s.mean - 3.5) * 0.18))) continue;
      const late = rng.chance(0.06);
      let submittedAt = late ? addMin(h.dueAt, rng.int(60, 1800)) : addMin(h.dueAt, -rng.int(90, 2400));
      if (submittedAt < addMin(h.createdAt, 60)) submittedAt = addMin(h.createdAt, rng.int(60, 180));
      if (submittedAt > latestOk) continue;
      const r = mkSub(h, s, { submittedAt, isLate: late });
      let rev = addMin(submittedAt > h.dueAt ? submittedAt : h.dueAt, rng.int(240, 1800));
      if (rev > latestOk) rev = between(submittedAt, latestOk, 0.7);
      if (allowPending && rev > addMin(now, -60 * 36)) continue; // hali tekshirilmagan
      review(r, s, rev);
    }
  };

  const doneBefore = (code: string) => lessons.get(code)!.filter((l) => l.ymd < T && l.status === "DONE");

  for (const g of m.groups.values()) {
    if (g.code === "GR-05") continue;
    const list = lessons.get(g.code)!;
    const kind = g.level === "KIDS" ? "kids" : g.plan === "gr09" || g.plan === "gr21" || g.level === "L1" ? "grammar" : g.plan === "gr20" ? "club" : "default";

    if (g.code === "GR-03") {
      for (const l of list.slice(0, 28)) {
        const p = GR03_PLAN[l.n - 1].hw!;
        addHw({ group: g.code, lessonId: l.id, lessonN: l.n, topicId: l.topicId, title: p.title, desc: p.desc, type: p.type, skill: p.skill, dueAt: nextDue(g.code, l), createdAt: addMin(l.endsAt, 20), createdById: alisher, canon: l.n === 28 ? "h28" : undefined });
      }
      continue;
    }
    const canonLessons = new Map<string, string>();
    const before = doneBefore(g.code);
    if (g.code === "GR-18") {
      canonLessons.set(before[before.length - 1].id, "gr18Essay");
      canonLessons.set(before[before.length - 2].id, "gr18Report");
    }
    if (g.code === "GR-09") canonLessons.set(before[before.length - 1].id, "gr09Sheet");
    if (g.code === "GR-20") canonLessons.set(before[before.length - 1].id, "gr20Rec");
    if (g.code === "GR-11") {
      const l = [...before].reverse().find((x) => x.ymd <= ymdAdd(T, -4));
      if (l) canonLessons.set(l.id, "gr11Late");
    }
    const lastDone = [...list].reverse().find((l) => l.status === "DONE");
    for (const l of list) {
      if (l.status !== "DONE") continue;
      const c = canonLessons.get(l.id);
      const regular = l.n % 2 === 0 || l.id === lastDone?.id || g.code === "GR-20";
      if (!c && !regular) continue;
      const base = l.title.replace(/ \(\d+-qism\)$/, "");
      let spec: HwSpec;
      if (c === "gr18Essay") spec = { group: g.code, lessonId: l.id, lessonN: l.n, topicId: l.topicId, title: CANON_HW.gr18Essay.title, desc: CANON_HW.gr18Essay.desc, type: "FILE", skill: "WRITING", dueAt: at(T, "23:59"), createdAt: addMin(l.endsAt, 15), createdById: alisher, canon: c };
      else if (c === "gr18Report") spec = { group: g.code, lessonId: l.id, lessonN: l.n, topicId: l.topicId, title: CANON_HW.gr18Report.title, desc: CANON_HW.gr18Report.desc, type: "FILE", skill: "WRITING", dueAt: at(T, "12:00"), createdAt: addMin(l.endsAt, 15), createdById: alisher, canon: c };
      else if (c === "gr09Sheet") spec = { group: g.code, lessonId: l.id, lessonN: l.n, topicId: null, title: CANON_HW.gr09Sheet.title, desc: CANON_HW.gr09Sheet.desc, type: "FILE", skill: "GRAMMAR", dueAt: at(T, "20:00"), createdAt: addMin(l.endsAt, 10), createdById: alisher, canon: c };
      else if (c === "gr20Rec") spec = { group: g.code, lessonId: l.id, lessonN: l.n, topicId: null, title: CANON_HW.gr20Rec.title, desc: CANON_HW.gr20Rec.desc, type: "AUDIO", skill: "SPEAKING", dueAt: at(nextWeekday(T, 1), "12:00"), createdAt: addMin(l.endsAt, 10), createdById: alisher, canon: c };
      else if (c === "gr11Late") spec = { group: g.code, lessonId: l.id, lessonN: l.n, topicId: l.topicId, title: "Writing Task 1: Line graph report", desc: "Chiziqli grafik boʻyicha 150 soʻzlik hisobot. Overview va asosiy trendlarni yozing.", type: "FILE", skill: "WRITING", dueAt: nextDue(g.code, l), createdAt: addMin(l.endsAt, 15), createdById: teacherId(g.code), canon: c };
      else {
        const [type, skill, label] = GROUP_SKILLS[kind][l.n % GROUP_SKILLS[kind].length];
        spec = { group: g.code, lessonId: l.id, lessonN: l.n, topicId: l.topicId, title: `${base} — ${label}`, desc: `Darsda oʻtilgan mavzu boʻyicha ${label}. Baholash mezonlari ilovada.`, type, skill, dueAt: nextDue(g.code, l), createdAt: addMin(l.endsAt, 15), createdById: teacherId(g.code) };
      }
      addHw(spec);
    }
  }

  // ── Topshiriqlar ──
  const ali = m.byKey.get("ali")!;
  const K = (k: string) => m.byKey.get(k)!;
  const pickN = (arr: StudentPlan[], n: number, must: StudentPlan[] = []) => {
    const rest = rng.shuffle(arr.filter((s) => !must.includes(s)));
    return [...must, ...rest].slice(0, n);
  };
  for (const h of hws) {
    const g = m.groups.get(h.group)!;
    const mem = members(h.group, ymdOf(h.createdAt));
    if (h.group === "GR-03" && h.canon !== "h28") {
      const n = h.lessonN;
      for (const s of mem) {
        if (s.id === ali.id) continue;
        if (!rng.chance(Math.min(0.97, 0.78 + (s.mean - 3.5) * 0.15))) continue;
        const late = rng.chance(0.05);
        const submittedAt = late ? addMin(h.dueAt, rng.int(60, 900)) : addMin(h.dueAt, -rng.int(120, 1500));
        const r = mkSub(h, s, { submittedAt: submittedAt < addMin(h.createdAt, 60) ? addMin(h.createdAt, 90) : submittedAt, isLate: late });
        // Unit 3 speaking (27) — Alisher bugun 16:20–16:32 da hammasini baholadi
        const rev = n === 27 ? happened(clock, at(T, "16:20", rng.int(0, 700))) : addMin(h.dueAt, rng.int(300, 1500));
        review(r, s, rev > latestOk ? between(r.submittedAt!, latestOk, 0.8) : rev);
      }
      if (n < 28) {
        const p = GR03_PLAN[n - 1].hw!;
        if (p.ali !== null) {
          const dueYmd = ymdOf(h.dueAt);
          const submittedAt = n === 27 ? at(ymdAdd(dueYmd, -1), "18:57", 12) : at(ymdAdd(dueYmd, -1), "18:00", rng.int(0, 7000));
          const r = mkSub(h, ali, { submittedAt });
          if (n === 27) {
            const autoAt = at(ymdAdd(dueYmd, -1), "19:02", 11);
            review(r, ali, happened(clock, at(T, "16:32", 10)), 5);
            r.reviewerId = alisher;
            r.feedback = "Ajoyib intilish, barakalla Ali! Hamma soʻzlarni toʻgʻri bogʻlab yozgansiz. Navbatdagi Unit 4 vazifasida ham shunday faol boʻling.";
            r.gradeComment = "Talaffuz aniq, yangi soʻzlarni oʻrinli qoʻlladi.";
            r.pinnedCoinAt = autoAt;
          } else {
            const rev = at(ymdAdd(dueYmd, 1), "11:00", rng.int(0, 3600));
            review(r, ali, rev > latestOk ? between(submittedAt, latestOk, 0.8) : rev, p.ali);
            r.canMove = true;
          }
        }
      }
      continue;
    }
    if (!h.canon) {
      regularSubs(h, g.teacher !== "alisher" && h.dueAt > addMin(now, -60 * 30));
      continue;
    }
    const c0 = h.createdAt;
    const win = (f: number) => between(addMin(c0, 60), latestOk, f);
    if (h.canon === "gr18Essay") {
      const sel = pickN(mem, 14, [K("madina_rh"), K("shahnoza")]);
      const pending = [K("madina_rh"), ...sel.filter((s) => s !== K("madina_rh") && s !== K("shahnoza")).slice(0, 4)];
      for (const s of sel) {
        if (pending.includes(s)) {
          const t = s === K("madina_rh") ? happened(clock, at(T, "11:45")) : win(0.55 + rng.next() * 0.4);
          mkSub(h, s, { submittedAt: t, files: [{ name: s === K("madina_rh") ? "Madina_Rahmatova_WT2_Technology_in_Schools.pdf" : `${s.fullName.replace(/ /g, "_")}_WT2_essay.pdf`, title: "Writing Task 2: Technology in Schools", lines: ["312 soʻz · Opinion essay"] }] });
        } else {
          const r = mkSub(h, s, { submittedAt: win(rng.next() * 0.5) });
          review(r, s, between(r.submittedAt!, latestOk, 0.5 + rng.next() * 0.4));
        }
      }
    } else if (h.canon === "gr18Report") {
      for (const s of mem) {
        if (s === K("shahnoza")) {
          const t = at(ymdAdd(T, -1), "22:15");
          mkSub(h, s, { submittedAt: t > c0 ? t : win(0.5), files: [{ name: "Shahnoza_Ismoilova_Task1_Bar_chart.pdf", title: "Task 1 Academic Report", lines: ["178 soʻz · 1 ta jadval ilovasi"] }] });
          continue;
        }
        const r = mkSub(h, s, { submittedAt: win(rng.next() * 0.4) });
        review(r, s, between(r.submittedAt!, latestOk, 0.3 + rng.next() * 0.5));
      }
    } else if (h.canon === "gr09Sheet") {
      const pending = [K("diyorbek"), K("jasur_t"), ...rng.shuffle(mem.filter((s) => s !== K("diyorbek") && s !== K("jasur_t"))).slice(0, 4)];
      for (const s of mem) {
        if (pending.includes(s)) {
          const t = s === K("diyorbek") || s === K("jasur_t") ? at(ymdAdd(T, -1), "19:40", rng.int(0, 50)) : win(0.6 + rng.next() * 0.35);
          mkSub(h, s, { submittedAt: t > addMin(c0, 30) ? happened(clock, t) : win(0.7), files: [{ name: s === K("jasur_t") ? "Inversion_test_daftar.png" : `${s.code}_inversion_sheet.pdf`, title: "Advanced Inversion Worksheet", lines: ["30 ta gapni oʻzgartirish va qayta yozish"] }] });
        } else {
          const r = mkSub(h, s, { submittedAt: win(rng.next() * 0.5) });
          review(r, s, between(r.submittedAt!, latestOk, 0.5 + rng.next() * 0.4));
        }
      }
    } else if (h.canon === "gr20Rec") {
      const sel = pickN(mem, 8);
      sel.forEach((s, i) => {
        const r = mkSub(h, s, { submittedAt: win(rng.next() * 0.9), files: i >= 4 ? [{ name: `${s.code}_part1-2_recording.mp3`, seconds: 150, lowBitrate: true }] : [] });
        if (i < 4) review(r, s, between(r.submittedAt!, latestOk, 0.6));
      });
    } else if (h.canon === "h28") {
      // Unit 4 — Family words: 11/14 topshirilgan (5 tekshirilgan, 6 kutmoqda), Ali — qoralama, 2 kishi hali yo'q
      const others = mem.filter((s) => s !== ali);
      const reviewed = pickN(others.filter((s) => s !== K("bekzod")), 5, [K("malikay"), K("doniyor"), K("nilufar")]);
      const pending = pickN(others.filter((s) => !reviewed.includes(s)), 6, [K("bekzod")]);
      for (const s of reviewed) {
        const r = mkSub(h, s, { submittedAt: between(addMin(c0, 150), happened(clock, at(T, "09:00")), rng.next()), files: [{ name: `${s.fullName.replace(/ /g, "_")}_unit4_audio.mp3`, seconds: rng.int(70, 115), lowBitrate: true }] });
        review(r, s, happened(clock, at(T, "12:10", rng.int(0, 4800))));
      }
      for (const s of pending) {
        const t = s === K("bekzod") ? happened(clock, at(T, "10:12")) : between(addMin(c0, 180), happened(clock, at(T, "11:00")), rng.next());
        mkSub(h, s, { submittedAt: t, text: s === K("bekzod") ? "Oila haqida monolog va sevimli ibora: «close-knit family»." : null, files: [{ name: s === K("bekzod") ? "Unit 4 audio yozuvi.mp3" : `${s.fullName.replace(/ /g, "_")}_unit4.mp3`, seconds: s === K("bekzod") ? 105 : rng.int(60, 110), lowBitrate: true }] });
      }
      const draftAt = happened(clock, at(T, "11:15", 33));
      mkSub(h, ali, {
        status: "DRAFT", submittedAt: null, createdAt: draftAt, files: [
          { name: "ali_valiyev_family_words_homework.png", bytes: 2_400_000 },
          { name: "ali_speaking_recording_unit4.mp3", seconds: 84 },
        ],
      });
    } else if (h.canon === "gr11Late") {
      const sel = mem.filter(() => rng.chance(0.9));
      sel.forEach((s, i) => {
        let t = addMin(h.dueAt, -rng.int(120, 1200));
        if (t < addMin(c0, 60)) t = addMin(c0, 90);
        const r = mkSub(h, s, { submittedAt: t, files: i < 5 ? [{ name: `${s.code}_writing_task1.pdf`, title: "Writing Task 1: Line graph report" }] : [] });
        if (i >= 5) review(r, s, between(t, latestOk, 0.6));
      });
    }
  }

  // Alisherning eski vazifalaridan 5 tasi qayta ishlashga qaytarilgan
  const alisherGroups = new Set(["GR-03", "GR-04", "GR-18", "GR-09", "GR-20"]);
  const hwById = new Map(hws.map((h) => [h.id, h]));
  const returnable = subs.filter((s) => s.status === "REVIEWED" && s.studentId !== ali.id && alisherGroups.has(s.group) && !hwById.get(s.hwId)!.canon && hwById.get(s.hwId)!.lessonN !== 27);
  for (const r of rng.shuffle(returnable).slice(0, 5)) {
    r.status = "RETURNED";
    r.score = null;
    r.coins = 0;
    r.feedback = rng.pick(RETURN_NOTES);
  }

  // ── QUIZ javoblari: o'quvchi formati { qid: variantIndeksi }, baho javoblarga mos ──
  const qrng = new Rng("urfon-quiz-answers");
  const meanOf = new Map(m.students.map((s) => [s.id, s.mean]));
  for (const s of subs) {
    const h = hwById.get(s.hwId)!;
    if (h.type !== "QUIZ" || !h.content || !s.submittedAt) continue;
    s.answers = answersFor(h.content.questions, s.status === "REVIEWED" ? s.score : null, meanOf.get(s.studentId) ?? 4, qrng).answers;
  }

  // ── Uyga vazifadan tashqari baholar ──
  const lessonByN = (code: string, n: number) => lessons.get(code)!.find((l) => l.n === n)!;
  for (const a of ALI_GRADES) {
    const l = lessonByN("GR-03", a.lesson);
    grades.push({ id: cid(), studentId: ali.id, group: "GR-03", lessonId: l.id, submissionId: null, kind: a.kind, skill: a.skill, value: a.value, title: a.title, comment: a.comment ?? null, givenById: alisher, gradedAt: addMin(l.endsAt, 5), updatedAt: addMin(l.endsAt, 5) });
  }
  const GR03_CANON: Record<number, [GradeKind, Skill, string]> = {
    22: ["TEST", "GRAMMAR", "Grammar quiz (Unit 2)"], 25: ["TEST", "VOCABULARY", "Unit 3 lugʻat testi"], 26: ["MOCK", "SPEAKING", "Speaking Mock"],
    27: ["SPEAKING", "SPEAKING", "Speaking interview (Unit 3)"], 28: ["CLASSWORK", "SPEAKING", "Unit 4 — darsdagi faollik"],
  };
  const kindCycle: [GradeKind, Skill][] = [["CLASSWORK", "SPEAKING"], ["TEST", "VOCABULARY"], ["CLASSWORK", "READING"], ["TEST", "GRAMMAR"], ["WRITING", "WRITING"], ["TEST", "LISTENING"]];
  for (const a of att) {
    if (a.status !== "PRESENT" && a.status !== "LATE") continue;
    if (a.studentId === ali.id && a.group === "GR-03") continue;
    const l = lessonByN(a.group, a.n);
    if (l.status !== "DONE") continue;
    const s = m.students.find((x) => x.id === a.studentId)!;
    const g = m.groups.get(a.group)!;
    let spec: [GradeKind, Skill, string] | null = null;
    if (a.group === "GR-03" && GR03_CANON[a.n]) spec = GR03_CANON[a.n];
    else if (a.n % 4 === 0) {
      const [k, sk] = kindCycle[(a.n / 4) % kindCycle.length];
      spec = [k, g.level === "KIDS" && sk === "WRITING" ? "VOCABULARY" : sk, `${l.title.replace(/ \(\d+-qism\)$/, "")} — ${k === "TEST" ? "nazorat testi" : "darsdagi ish"}`];
    } else if (rng.chance(0.12)) spec = ["CLASSWORK", "SPEAKING", `${l.title.replace(/ \(\d+-qism\)$/, "")} — darsdagi faollik`];
    if (!spec) continue;
    const fractional = spec[0] === "TEST" || spec[0] === "MOCK" || spec[0] === "SPEAKING";
    const raw = s.mean + (rng.next() - 0.5) * 1.2;
    const value = fractional ? Math.max(2.4, Math.min(5, Math.round(raw * 5) / 5)) : Math.max(2, Math.min(5, Math.round(raw)));
    grades.push({ id: cid(), studentId: s.id, group: a.group, lessonId: l.id, submissionId: null, kind: spec[0], skill: spec[1], value, title: spec[2], comment: null, givenById: teacherId(a.group), gradedAt: addMin(l.endsAt, rng.int(0, 60)), updatedAt: addMin(l.endsAt, 60) });
  }
  return { hws, subs, grades };
}

export async function writeHomework(db: Db, m: Model, plan: ReturnType<typeof planHomework>, clock: Clock) {
  const { hws, subs, grades } = plan;
  const groupId = (c: string) => m.groups.get(c)!.id;
  await insertMany(
    db.homework,
    hws.map((h) => ({
      id: h.id, groupId: groupId(h.group), lessonId: h.lessonId, topicId: h.topicId, title: h.title, description: h.desc, type: h.type,
      content: h.content ?? undefined,
      dueAt: h.dueAt, coinReward: 10, createdById: h.createdById, createdAt: h.createdAt, updatedAt: h.createdAt,
    })),
  );
  await insertMany(
    db.submission,
    subs.map((s) => ({
      id: s.id, homeworkId: s.hwId, studentId: s.studentId, status: s.status, text: s.text, answers: s.answers ?? undefined, submittedAt: s.submittedAt,
      isLate: s.isLate, reviewerId: s.reviewerId, reviewedAt: s.reviewedAt, score: s.score, feedback: s.feedback, coinsAwarded: s.coins,
      createdAt: s.createdAt, updatedAt: s.reviewedAt ?? s.submittedAt ?? s.createdAt,
    })),
  );
  // tekshirilgan har bir topshiriq — HOMEWORK bahosi
  const hwById = new Map(hws.map((h) => [h.id, h]));
  const all: GradeRec[] = [...grades];
  for (const s of subs) {
    if (s.status !== "REVIEWED" || s.score === null) continue;
    const h = hwById.get(s.hwId)!;
    all.push({ id: cid(), studentId: s.studentId, group: s.group, lessonId: h.lessonId, submissionId: s.id, kind: "HOMEWORK", skill: h.skill, value: s.score, title: h.title, comment: s.gradeComment ?? s.feedback, givenById: s.reviewerId!, gradedAt: s.reviewedAt!, updatedAt: s.reviewedAt! });
  }
  await insertMany(
    db.grade,
    all.map((g) => ({ id: g.id, studentId: g.studentId, groupId: groupId(g.group), lessonId: g.lessonId, submissionId: g.submissionId, kind: g.kind, skill: g.skill, value: g.value, title: g.title, comment: g.comment, givenById: g.givenById, gradedAt: g.gradedAt, updatedAt: g.updatedAt })),
  );

  // Fayllar: vazifa ilovalari (Unit 4) va joriy topshiriqlar
  const h28 = hws.find((h) => h.canon === "h28")!;
  const alisher = m.staff.get("alisher")!.id;
  await storeFile(db, { name: "Unit 4 Wordlist.pdf", bytes: 1_200_000, lines: ["father · mother · sibling · twins · cousin · nephew", "niece · grandparents · step-mother · in-laws · spouse · relative"] }, { uploadedById: alisher, createdAt: addMin(h28.createdAt, 2), homeworkId: h28.id });
  await storeFile(db, { name: "Speaking Script.docx", lines: ["Namuna: “There are five people in my family…”", "My elder sister is very supportive and we get along really well."] }, { uploadedById: alisher, createdAt: addMin(h28.createdAt, 3), homeworkId: h28.id });
  await storeFile(db, { name: "Yoʻriqnoma — Unit 4 Family words.pdf", lines: ["1. Lugʻat daftariga 12 ta soʻzni yozish", "2. Speaking audio (1–2 daqiqa)", "3. Sevimli iborani izohda qoldirish"] }, { uploadedById: alisher, createdAt: addMin(h28.createdAt, 4), homeworkId: h28.id });
  let nFiles = 3;
  for (const s of subs) {
    for (const f of s.files) {
      await storeFile(db, f, { uploadedById: s.studentId, createdAt: s.submittedAt ?? s.createdAt, submissionId: s.id });
      nFiles++;
    }
  }
  void clock;
  return { homework: hws.length, submissions: subs.length, grades: all.length, files: nFiles };
}
