// Dars rejalarini oʻqish sahifasi uchun: bosqich (level) boʻyicha unitlar va har unitning darsma-dars rejasi.
// Admin (barcha amaldagi mavzular) va ustoz (faqat tasdiqlanganlar) bir xil shakldagi javob oladi.
import { prisma } from "../db.js";
import { notFound } from "./errors.js";

const label = (l: { code: string; name: string }) => {
  const m = l.code.match(/^L(\d+)$/);
  return m ? `Level ${m[1]} · ${l.name}` : l.name;
};

type LevelRow = { id: string; code: string; name: string; order: number; audience: string | null; cefr: string | null; weeks: number | null; description: string | null };
const levelDto = (l: LevelRow) => ({
  id: l.id, code: l.code, name: l.name, order: l.order, label: label(l),
  audience: l.audience, cefr: l.cefr, weeks: l.weeks, description: l.description,
});

const lessonCount = (plan: unknown) => (Array.isArray(plan) ? plan.length : 0);

/** Oʻqish sahifasidagi yosh toifasi: teen = 13–16 (lessonPlan), kids = 8–12 (kidsPlan). */
export type PlanTrack = "teen" | "kids";
/** kids rejasi boʻlmagan unit uchun teen rejasi ishlatiladi */
export const planFor = (t: { lessonPlan: unknown; kidsPlan: unknown }, track: PlanTrack): unknown[] =>
  track === "kids" && Array.isArray(t.kidsPlan) && t.kidsPlan.length ? t.kidsPlan : Array.isArray(t.lessonPlan) ? t.lessonPlan : [];

/** Bosqichlar roʻyxati: har birida nechta unit va nechta rejali dars borligi bilan. */
export async function planLevels(publishedOnly: boolean) {
  const levels = await prisma.level.findMany({
    orderBy: { order: "asc" },
    include: {
      topics: {
        where: { status: publishedOnly ? "PUBLISHED" : { not: "ARCHIVED" } },
        select: { lessonPlan: true, kidsPlan: true },
      },
    },
  });
  return levels.map((l) => ({
    ...levelDto(l),
    units: l.topics.length,
    lessons: l.topics.reduce((s, t) => s + lessonCount(t.lessonPlan), 0),
    kidsLessons: l.topics.reduce((s, t) => s + lessonCount(t.kidsPlan), 0),
  }));
}

/** Bitta bosqichning toʻliq rejasi: unitlar tartibida, har unitda darslar roʻyxati. */
export async function levelPlan(levelId: string, publishedOnly: boolean, track: PlanTrack = "teen") {
  const level = await prisma.level.findUnique({ where: { id: levelId } });
  if (!level) throw notFound("Bosqich topilmadi");
  const topics = await prisma.topic.findMany({
    where: { levelId, status: publishedOnly ? "PUBLISHED" : { not: "ARCHIVED" } },
    orderBy: { unit: "asc" },
    select: { id: true, unit: true, title: true, description: true, grammar: true, vocabulary: true, status: true, lessonPlan: true, kidsPlan: true },
  });
  const units = topics.map(({ lessonPlan, kidsPlan, ...t }) => ({ ...t, lessons: planFor({ lessonPlan, kidsPlan }, track) }));
  // qaysi yosh toifasi uchun reja borligi — sahifa almashtirgichni shunga qarab koʻrsatadi
  const tracks = { teen: topics.some((t) => lessonCount(t.lessonPlan) > 0), kids: topics.some((t) => lessonCount(t.kidsPlan) > 0) };
  return { level: levelDto(level), track, tracks, units, totalLessons: units.reduce((s, u) => s + u.lessons.length, 0) };
}
