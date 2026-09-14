// O'quvchi kabineti uchun umumiy yordamchilar (plagin emas — index.ts ro'yxatiga kirmaydi).
// Ko'lam qoidasi: o'quvchi faqat o'z ma'lumotini ko'radi — hamma so'rov req.auth.userId bo'yicha,
// boshqa guruhning homework/lesson/material id'si so'ralsa 404.
import type { AttendanceStatus, CoinReason, GradeKind, HomeworkType, Level, SubmissionStatus, Topic } from "@prisma/client";
import { prisma } from "../../db.js";
import { notFound } from "../../lib/errors.js";

// ─────────────────────────── guruhlar ───────────────────────────

/** O'quvchining barcha a'zoliklari (tarix uchun: LEFT ham). */
export async function myEnrollments(studentId: string) {
  return prisma.groupStudent.findMany({
    where: { studentId },
    include: {
      group: {
        include: {
          level: true,
          room: true,
          teacher: { select: { id: true, fullName: true, title: true, avatarUrl: true, teacherProfile: { select: { specialization: true, responseTime: true } } } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });
}

export type Enrollment = Awaited<ReturnType<typeof myEnrollments>>[number];

/** Ruxsat doirasi: a'zo bo'lgan (hozir yoki avval) guruhlar. */
export const accessIds = (es: Enrollment[]) => es.map((e) => e.groupId);
/** Hozirgi guruhlar (ochiq vazifa, jadval). WAITING — guruh hali boshlanmagan, jadvalda ko'rinadi. */
export const activeIds = (es: Enrollment[], includeWaiting = false) =>
  es.filter((e) => e.status === "ACTIVE" || (includeWaiting && e.status === "WAITING")).map((e) => e.groupId);
/** Asosiy guruh (sidebar'dagi Level widgeti bilan bir xil: eng oxirgi ACTIVE). */
export const primaryEnrollment = (es: Enrollment[]) => es.find((e) => e.status === "ACTIVE") ?? null;

// ─────────────────────────── yorliqlar ───────────────────────────

export const topicLabel = (t: Pick<Topic, "unit" | "title"> | null | undefined) => (t ? `Unit ${t.unit} — ${t.title}` : null);

export function levelLabel(lv: Pick<Level, "code" | "name"> | null | undefined, sep = " · ") {
  if (!lv) return null;
  return lv.code.startsWith("L") ? `Level ${lv.code.slice(1)}${sep}${lv.name}` : lv.name;
}

const GRADE_LABEL: Record<number, string> = { 5: "Aʼlo", 4: "Yaxshi", 3: "Qoniqarli", 2: "Qoniqarsiz" };
export const gradeLabel = (v: number | null | undefined) => (v == null ? null : (GRADE_LABEL[Math.round(v)] ?? null));
export function avgLabel(avg: number | null) {
  if (avg == null) return null;
  return avg >= 4.5 ? "Aʼlo" : avg >= 3.5 ? "Yaxshi" : avg >= 2.5 ? "Qoniqarli" : "Qoniqarsiz";
}
export const round1 = (n: number) => Math.round(n * 10) / 10;

export const GRADE_KIND_LABEL: Record<GradeKind, string> = {
  HOMEWORK: "Uyga vazifa",
  CLASSWORK: "Darsdagi faollik",
  TEST: "Test",
  SPEAKING: "Speaking",
  WRITING: "Writing",
  MOCK: "Mock imtihon",
};

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Keldi",
  LATE: "Kechikib keldi",
  EXCUSED: "Sababli kelmadi",
  ABSENT: "Kelmadi",
};

export const HOMEWORK_TYPE_LABEL: Record<HomeworkType, string> = {
  TEXT: "Matnli javob",
  AUDIO: "Audio topshiriq",
  FILE: "Fayl yuklash",
  QUIZ: "Test",
};

export const COIN_REASON_LABEL: Record<CoinReason, string> = {
  HOMEWORK_ON_TIME: "Uyga vazifa oʻz vaqtida",
  ATTENDANCE: "Darsga keldi",
  ACTIVITY: "Darsdagi faollik",
  STREAK: "Kunlik seriya",
  MANUAL: "Qoʻshimcha mukofot",
  SPEND: "Tanga sarflandi",
};

// ─────────────────────────── vazifa holati ───────────────────────────

/** O'quvchi nuqtai nazaridan vazifa holati. */
export type StudentHwState = "NEW" | SubmissionStatus;

export const HW_STATE_LABEL: Record<StudentHwState, string> = {
  NEW: "Bajarilmagan",
  DRAFT: "Qoralama saqlangan",
  SUBMITTED: "Tekshiruvda",
  REVIEWED: "Tekshirildi",
  RETURNED: "Qayta ishlashga qaytarildi",
};

export const hwState = (sub: { status: SubmissionStatus } | null | undefined): StudentHwState => sub?.status ?? "NEW";
export const isOpenState = (s: StudentHwState) => s === "NEW" || s === "DRAFT" || s === "RETURNED";

// ─────────────────────────── vazifa kontenti ───────────────────────────
// Homework.content (Json) tuzilmasi erkin: ustoz formasi yoki seed yozadi. Qo'llab-quvvatlanadi:
//   [ {q, options[], answer} … ]                             — faqat test savollari
//   { steps|instructions: [{title,text}|string], vocabulary: [], tip, criteria: [{label,points}], questions: [...] }
// O'quvchiga to'g'ri javoblar HECH QACHON yuborilmaydi (tekshiruvdan va muddatdan keyin — ixtiyoriy ochiladi).

export type QuizQuestion = { id: string; text: string; options: string[] | null; correct?: unknown };
export type HwContent = {
  steps: { title: string | null; text: string }[];
  vocabulary: string[];
  tip: string | null;
  criteria: { label: string; points: number | null }[];
  questions: QuizQuestion[];
  timeLimitMin: number | null;
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

function normQuestions(raw: unknown, revealAnswers: boolean): QuizQuestion[] {
  if (!Array.isArray(raw)) return [];
  const out: QuizQuestion[] = [];
  raw.forEach((item, i) => {
    const o = obj(item);
    const text = o ? str(o.q ?? o.question ?? o.text ?? o.title) : str(item);
    if (!text) return;
    const options = o && Array.isArray(o.options) ? o.options.map(str).filter(Boolean) : null;
    const q: QuizQuestion = { id: o && (typeof o.id === "string" || typeof o.id === "number") ? String(o.id) : String(i), text, options: options?.length ? options : null };
    if (revealAnswers && o) {
      const c = o.answer ?? o.correct ?? o.correctIndex;
      if (c !== undefined) q.correct = c;
    }
    out.push(q);
  });
  return out;
}

export function normalizeContent(raw: unknown, type: HomeworkType, opts: { revealAnswers?: boolean; topicVocabulary?: string[] } = {}): HwContent {
  const reveal = !!opts.revealAnswers;
  const o = obj(raw);
  const empty: HwContent = { steps: [], vocabulary: opts.topicVocabulary ?? [], tip: null, criteria: [], questions: [], timeLimitMin: null };
  if (Array.isArray(raw)) return { ...empty, questions: type === "QUIZ" || raw.some((x) => obj(x)?.options) ? normQuestions(raw, reveal) : [] };
  if (!o) return empty;
  const stepsRaw = (Array.isArray(o.steps) ? o.steps : Array.isArray(o.instructions) ? o.instructions : Array.isArray(o.tasks) ? o.tasks : []) as unknown[];
  const steps = stepsRaw
    .map((s) => {
      const so = obj(s);
      return so ? { title: str(so.title) || null, text: str(so.text ?? so.description ?? so.body) } : { title: null, text: str(s) };
    })
    .filter((s) => s.title || s.text);
  const vocabulary = Array.isArray(o.vocabulary) ? o.vocabulary.map(str).filter(Boolean) : (opts.topicVocabulary ?? []);
  const criteria = (Array.isArray(o.criteria) ? o.criteria : Array.isArray(o.rubric) ? o.rubric : [])
    .map((c) => {
      const co = obj(c);
      return co ? { label: str(co.label ?? co.title ?? co.name), points: typeof co.points === "number" ? co.points : typeof co.max === "number" ? co.max : null } : { label: str(c), points: null };
    })
    .filter((c) => c.label);
  return {
    steps,
    vocabulary,
    tip: str(o.tip ?? o.hint) || null,
    criteria,
    // teacher-b formati: { questions: [{ id, text, options, answer }] }; seed/eski format: { questions: 20, sample: [...] }
    questions: normQuestions(Array.isArray(o.questions) ? o.questions : (o.sample ?? o.quiz ?? o.items), reveal),
    timeLimitMin: typeof o.timeLimitMin === "number" ? o.timeLimitMin : null,
  };
}

// ─────────────────────────── ko'lam tekshiruvlari ───────────────────────────

/** Vazifa o'quvchining guruhiga tegishli bo'lmasa 404. */
export async function assertStudentHomework(studentId: string, homeworkId: string) {
  const hw = await prisma.homework.findFirst({
    where: { id: homeworkId, group: { students: { some: { studentId } } } },
    include: {
      group: { select: { id: true, name: true, teacherId: true, students: { where: { studentId }, select: { status: true } } } },
      topic: { select: { id: true, unit: true, title: true, vocabulary: true } },
      lesson: { select: { id: true, title: true, startsAt: true } },
    },
  });
  if (!hw) throw notFound("Vazifa topilmadi");
  return hw;
}

export async function assertStudentLesson(studentId: string, lessonId: string) {
  const l = await prisma.lesson.findFirst({ where: { id: lessonId, group: { students: { some: { studentId } } } } });
  if (!l) throw notFound("Dars topilmadi");
  return l;
}

export const fileSel = { id: true, originalName: true, mime: true, size: true, createdAt: true } as const;
