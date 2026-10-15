// Ota-onaga ketadigan kunlik xabarning «jonli» qismi: bugun nima oʻrganilgani va farzanddan
// soʻrash mumkin boʻlgan savollar. Matnni Claude yozadi, natija darsga bogʻlab saqlanadi
// (Lesson.parentBrief) — demak bir dars uchun bir marta chaqiriladi, guruhdagi hamma oʻquvchiga shu matn ketadi.
//
// Matnni AI yozadi (GEMINI_API_KEY yoki ANTHROPIC_API_KEY — qaysi biri .env da boʻlsa, lib/ai.ts tanlaydi).
// Kalit boʻlmasa yoki soʻrov xato bersa — zaxira matn ishlatiladi: ota-ona baribir mavzuni va savollarni
// oladi, faqat jumlalar shablondan boʻladi. Hisobot hech qachon toʻxtamaydi.
import type { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { aiJson, aiProvider } from "./ai.js";
import { planFor } from "./lesson-plans.js";

export type ParentBrief = {
  /** 1–2 jumla: bugun bola nimani oʻrgandi / nima qila oladigan boʻldi */
  summary: string;
  /** ota-ona farzandiga beradigan 2–3 savol */
  questions: string[];
  /** yangi soʻzlar: "word – maʼno" (bor boʻlsa) */
  words: string[];
  /** matn qayerdan: model nomi yoki zaxira shablon */
  source: "gemini" | "claude" | "fallback";
};

type LessonRow = {
  id: string;
  title: string | null;
  summary: string | null;
  parentBrief: Prisma.JsonValue;
  group: { name: string; ageGroup: "TEENS" | "KIDS" };
};

/** Dars rejasidan shu darsga tegishli qism: maqsad, lugʻat, uy vazifasi. */
async function planPart(lessonId: string, ageGroup: "TEENS" | "KIDS") {
  const links = await prisma.lessonTopic.findMany({
    where: { lessonId },
    select: { topic: { select: { id: true, title: true, description: true, lessonPlan: true, kidsPlan: true } } },
  });
  const topic = links[0]?.topic;
  if (!topic) return null;
  // nechanchi qism: shu mavzu shu guruhda necha marta oʻtilgan
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { groupId: true, startsAt: true } });
  const before = lesson
    ? await prisma.lessonTopic.count({
        where: { topicId: topic.id, lesson: { groupId: lesson.groupId, status: { not: "CANCELLED" }, startsAt: { lt: lesson.startsAt } } },
      })
    : 0;
  const plan = planFor({ lessonPlan: topic.lessonPlan, kidsPlan: topic.kidsPlan }, ageGroup === "KIDS" ? "kids" : "teen");
  const part = (plan[before] ?? plan[0]) as { focus?: string; maqsad?: string[]; lugat?: string[]; uyga?: string[] } | undefined;
  return { topic, part, no: before + 1 };
}

/** Zaxira matn (AI ishlamaganda): reja maʼlumotidan shablon boʻyicha. */
function fallbackBrief(args: { lessonTitle: string | null; focus?: string; maqsad?: string[]; words: string[] }): ParentBrief {
  const what = args.maqsad?.[0] ?? args.focus ?? args.lessonTitle ?? "bugungi mavzu";
  const qs: string[] = [];
  const w = args.words.slice(0, 2);
  for (const pair of w) {
    const [en, uz] = pair.split("–").map((x) => x.trim());
    if (en && uz) qs.push(`«${uz}» ingliz tilida qanday boʻladi?`);
  }
  qs.push(`Bugun darsda nima oʻrganding? Menga bitta misol aytib ber.`);
  return { summary: what.replace(/^Oʻquvchilar\s+/i, "Farzandingiz "), questions: qs.slice(0, 3), words: args.words.slice(0, 5), source: "fallback" };
}

const SYSTEM = [
  "Sen Oʻzbekistondagi URFON oʻquv markazining ota-onalarga xabar yozuvchi yordamchisisan.",
  "Vazifang: bugungi dars rejasiga qarab, ota-onaga tushunarli qilib (1) bola nimani oʻrganganini va",
  "(2) ota-ona kechqurun farzandidan soʻrashi mumkin boʻlgan savollarni yozish.",
  "",
  "Qoidalar:",
  "- Faqat oʻzbek tilida (lotin), sodda va iliq ohangda yoz. Pedagogik atama ishlatma.",
  "- Apostrof sifatida faqat ʻ (U+02BB) va ʼ (U+02BC) belgilarini ishlat: oʻquvchi, maʼlumot.",
  "- Savollar bolaga beriladigan jonli savol boʻlsin: ota-ona uyda 2 daqiqada soʻray oladigan.",
  "- Ingliz tili darsi boʻlsa, savollarda inglizcha soʻz yoki ibora boʻlsin (tarjimasi qavsda).",
  "- Hech narsa oʻylab topma: faqat berilgan reja va mavzudan foydalan.",
  "- Bolani boshqalar bilan solishtirma, bosim oʻtkazuvchi gap yozma.",
  "",
  'Javobni faqat JSON qaytar: {"summary": "...", "questions": ["...", "...", "..."]}',
  "summary — 1–2 jumla, «Farzandingiz ...» deb boshlansin. questions — 2 yoki 3 ta savol.",
].join("\n");

/** Modeldan matn soʻraydi va tekshiradi. Natija boʻsh/notoʻgʻri boʻlsa — null. */
async function askModel(input: string): Promise<{ summary: string; questions: string[] } | null> {
  const parsed = await aiJson<{ summary?: unknown; questions?: unknown }>(SYSTEM, input);
  if (!parsed) return null;
  const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
  const questions = Array.isArray(parsed.questions)
    ? parsed.questions.filter((q): q is string => typeof q === "string" && q.trim().length > 3).map((q) => q.trim()).slice(0, 3)
    : [];
  if (!summary || !questions.length) return null;
  return { summary, questions };
}

/**
 * Dars uchun ota-ona matni. Bir marta yaratiladi va Lesson.parentBrief da saqlanadi.
 * Xato boʻlsa zaxira matn qaytadi (va saqlanmaydi — keyingi urinishda AI qayta sinaladi).
 */
export async function parentBriefFor(lesson: LessonRow, log: { warn: (e: unknown, m?: string) => void } = console): Promise<ParentBrief> {
  const saved = lesson.parentBrief as ParentBrief | null;
  if (saved && typeof saved.summary === "string" && Array.isArray(saved.questions)) return saved;

  const plan = await planPart(lesson.id, lesson.group.ageGroup);
  const words = plan?.part?.lugat ?? [];
  const fallback = fallbackBrief({ lessonTitle: lesson.title, focus: plan?.part?.focus, maqsad: plan?.part?.maqsad, words });

  const facts = [
    `Guruh: ${lesson.group.name} (${lesson.group.ageGroup === "KIDS" ? "8–12 yosh" : "13–16 yosh"})`,
    `Dars nomi: ${lesson.title ?? "—"}`,
    plan ? `Mavzu: ${plan.topic.title} (${plan.no}-dars)` : null,
    plan?.topic.description ? `Mavzu tavsifi: ${plan.topic.description}` : null,
    plan?.part?.focus ? `Bugungi dars yoʻnalishi: ${plan.part.focus}` : null,
    plan?.part?.maqsad?.length ? `Dars maqsadlari:\n- ${plan.part.maqsad.join("\n- ")}` : null,
    words.length ? `Yangi soʻzlar:\n- ${words.join("\n- ")}` : null,
    plan?.part?.uyga?.length ? `Uy vazifasi:\n- ${plan.part.uyga.join("\n- ")}` : null,
    lesson.summary ? `Ustozning dars xulosasi: ${lesson.summary}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const ai = await askModel(facts);
    if (!ai) return fallback;
    const brief: ParentBrief = { ...ai, words: words.slice(0, 5), source: aiProvider === "gemini" ? "gemini" : "claude" };
    await prisma.lesson.update({ where: { id: lesson.id }, data: { parentBrief: brief as unknown as Prisma.InputJsonValue } });
    return brief;
  } catch (e) {
    log.warn(e, `Ota-ona matni AI bilan yozilmadi (${lesson.id}) — zaxira matn ishlatildi`);
    return fallback;
  }
}
