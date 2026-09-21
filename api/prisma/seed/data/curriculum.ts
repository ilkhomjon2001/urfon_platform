// URFON ingliz tili oʻquv dasturi (Mavzular bazasi uchun maʼlumot).
// Tartib (2026-09-21, egasi tasdiqlagan): har level — alohida kitob.
//   Starter → Beginner → Elementary → Pre-Intermediate → Intermediate → Upper-Intermediate, keyin CEFR (Multilevel) va IELTS.
// Hozircha faqat Beginner toʻla: Cambridge Prepare 2e Level 1 (Starter + 1–20-unitlar), darsma-dars reja bilan (./prepare1).
// Bitta level ichida ikki yosh toifasi: 13–16 yosh (lessonPlan, tezroq) va 8–12 yosh (kidsPlan, sekinroq) —
// guruhning ageGroup maydoniga qarab tanlanadi. Qolgan levellar kitobi tanlangach toʻldiriladi (hozir unitlari yoʻq).
// Til: title/description/objectives — oʻzbekcha (lotin), vocabulary/grammar — inglizcha.
import { PREPARE1, type PlanLesson } from "./prepare1.js";

export type CurriculumUnit = {
  unit: number;
  title: string;
  description: string;
  objectives: string[];
  vocabulary: string[];
  grammar: string;
  /** 13–16 yosh darslari soni (Topic.lessonsCount) */
  lessonsCount: number;
  hours: number;
  /** darsma-dars reja, 13–16 yosh (faqat ustoz va admin koʻradi) */
  lessonPlan?: PlanLesson[];
  /** darsma-dars reja, 8–12 yosh */
  kidsPlan?: PlanLesson[];
};

export type CurriculumLevel = {
  code: string;
  name: string;
  order: number;
  cefr: string;
  /** 13–16 yosh uchun taxminiy davomiylik (hafta) */
  weeks: number | null;
  /** kimga moʻljallangan */
  audience: string;
  /** level nima oʻrgatadi va qaysi kitob asosida (admin panelda koʻrinadi) */
  description: string;
  units: CurriculumUnit[];
};

const PENDING = "Alohida kitob asosida oʻtiladi — kitob tanlangach unitlar va darsma-dars reja shu yerga qoʻshiladi.";

// ─── Beginner: Prepare 2e Level 1 ───
const beginnerUnits: CurriculumUnit[] = PREPARE1.units.map((u) => ({
  unit: u.unit,
  title: u.title,
  description: u.description,
  objectives: u.objectives,
  vocabulary: u.vocabulary,
  grammar: u.grammar,
  lessonsCount: u.teen.length,
  hours: u.teen.length * 1.5,
  lessonPlan: u.teen,
  kidsPlan: u.kids,
}));
const teenLessons = beginnerUnits.reduce((s, u) => s + u.lessonsCount, 0);
const kidsLessons = beginnerUnits.reduce((s, u) => s + (u.kidsPlan?.length ?? 0), 0);

export const CURRICULUM: CurriculumLevel[] = [
  {
    code: "STARTER",
    name: "Starter",
    order: 1,
    cefr: "Pre-A1",
    weeks: null,
    audience: "Nolldan boshlovchilar",
    description: `Alifbo, eng birinchi soʻzlar va oddiy iboralar. ${PENDING}`,
    units: [],
  },
  {
    code: "BEGINNER",
    name: "Beginner",
    order: 2,
    cefr: "A1",
    weeks: Math.ceil(teenLessons / 3),
    audience: "13–16 va 8–12 yosh",
    description:
      `Cambridge Prepare 2e Level 1: Starter va 1–20-unitlar (Culture, Life Skills, Review va testlar bilan). ` +
      `13–16 yosh — ${teenLessons} dars (haftasiga 3 ta, ≈ ${Math.round(teenLessons / 3 / 4.3)} oy). ` +
      `8–12 yosh — ${kidsLessons} dars (≈ ${Math.round(kidsLessons / 3 / 4.3)} oy): xuddi shu kitob, sekinroq, qoʻshiq, oʻyin va koʻproq takrorlash bilan.`,
    units: beginnerUnits,
  },
  { code: "ELEMENTARY", name: "Elementary", order: 3, cefr: "A2", weeks: null, audience: "13–16 va 8–12 yosh", description: PENDING, units: [] },
  { code: "PRE_INT", name: "Pre-Intermediate", order: 4, cefr: "A2+ → B1", weeks: null, audience: "13–16 va 8–12 yosh", description: PENDING, units: [] },
  { code: "INTERMEDIATE", name: "Intermediate", order: 5, cefr: "B1", weeks: null, audience: "13–16 yosh", description: PENDING, units: [] },
  { code: "UPPER_INT", name: "Upper-Intermediate", order: 6, cefr: "B1+ → B2", weeks: null, audience: "13–16 yosh", description: PENDING, units: [] },
  {
    code: "CEFR",
    name: "CEFR (Multilevel)",
    order: 7,
    cefr: "B1 → B2",
    weeks: null,
    audience: "Kursni bitirganlar",
    description: "Milliy Multilevel imtihoniga tayyorlov (B2 uchun 51–64 ball). Dastur va kitob tanlangach qoʻshiladi.",
    units: [],
  },
  {
    code: "IELTS",
    name: "IELTS",
    order: 8,
    cefr: "B1 → B2+",
    weeks: null,
    audience: "Kursni bitirganlar",
    description: "IELTS tayyorlov (Foundation va Intensive). Dastur va kitob tanlangach qoʻshiladi.",
    units: [],
  },
];

/**
 * Eski level kodlari → yangi level. Import paytida ulardagi guruhlar yangi levelga koʻchiriladi;
 * K1/K2/KIDS dagi guruhlar 8–12 yosh (KIDS) deb belgilanadi. L1 qatori Beginner ga aylantiriladi (id saqlanadi).
 */
export const LEGACY_LEVELS: Record<string, { to: string; kids?: boolean }> = {
  L1: { to: "BEGINNER" },
  L2: { to: "BEGINNER" },
  K1: { to: "BEGINNER", kids: true },
  K2: { to: "BEGINNER", kids: true },
  KIDS: { to: "BEGINNER", kids: true },
  L3: { to: "ELEMENTARY" },
  L4: { to: "PRE_INT" },
  L5: { to: "INTERMEDIATE" },
  L6: { to: "UPPER_INT" },
};
