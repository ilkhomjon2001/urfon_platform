// Gamifikatsiya qoidalari — YAGONA JOY. Kodning boshqa joyida tanga/XP miqdori yozilmaydi.
// Ikki xil hisob (markaz egasi tasdiqlagan, 2026-09-21):
//   • XP (tajriba) — faqat oshadi, sarflanmaydi. XP ga qarab bosqich (0–8) belgilanadi.
//   • Kumush (tanga) — doʻkonda sarflanadi. Bir xil harakat uchun bosqich qancha yuqori boʻlsa, shuncha koʻp kumush.
//     Tajribani bosqichga bogʻlash oʻquvchini uzoq oʻqishga undaydi (LTV).
// Jadval: markaz egasining «Baholash tizimi» jadvali. Shahar/respublika/xalqaro musobaqa va tanlovlarda
// 4–8-bosqich kataklari boʻsh edi — 3-bosqich qiymati olindi.
// KANON §8: bolani boshqalar bilan solishtiruvchi matnlar yoʻq.

/** Bosqich chegaralari (XP): i-bosqichga oʻtish uchun kerakli jami XP. Taxminan: haftasiga ≈ 30–40 XP. */
export const STAGES = [0, 150, 400, 800, 1400, 2200, 3200, 4500, 6000] as const;

type Rule = { title: string; xp: number; kumush: readonly number[] };
const r = (title: string, xp: number, kumush: number[]): Rule => {
  // boʻsh qolgan yuqori bosqichlar oxirgi berilgan qiymatni oladi
  const full = Array.from({ length: STAGES.length }, (_, i) => kumush[Math.min(i, kumush.length - 1)]);
  return { title, xp, kumush: full };
};

export const RULES = {
  ATTENDANCE: r("Darsga oʻz vaqtida kelish", 5, [5, 5, 7, 9, 11, 14, 17, 21, 24]),

  GRADE_3: r("Baho 3 (60–70 ball)", 2, [2, 2, 3, 4, 5, 6, 7, 9, 10]),
  GRADE_4: r("Baho 4 (71–85 ball)", 5, [5, 5, 7, 9, 11, 14, 17, 21, 24]),
  GRADE_5: r("Baho 5 (86–94 ball)", 8, [8, 8, 10, 13, 16, 20, 24, 29, 35]),
  GRADE_5P: r("Baho 5+ (95–100 ball)", 10, [10, 10, 13, 17, 21, 26, 32, 38, 45]),

  INTERNAL_1: r("Ichki musobaqa — 1-oʻrin", 25, [25, 25, 25, 50, 50, 75, 75, 100, 100]),
  INTERNAL_2: r("Ichki musobaqa — 2-oʻrin", 20, [20, 20, 20, 40, 40, 60, 60, 80, 80]),
  INTERNAL_3: r("Ichki musobaqa — 3-oʻrin", 15, [15, 15, 15, 30, 30, 45, 45, 60, 60]),
  INTERNAL_P: r("Ichki musobaqada ishtirok", 10, [10, 10, 10, 20, 20, 30, 30, 40, 40]),

  CITY_1: r("Shahar musobaqasi — 1-oʻrin", 200, [200, 200, 300, 300]),
  CITY_2: r("Shahar musobaqasi — 2-oʻrin", 150, [150, 150, 200, 200]),
  CITY_3: r("Shahar musobaqasi — 3-oʻrin", 100, [100, 100, 150, 150]),
  CITY_P: r("Shahar musobaqasida ishtirok", 50, [50, 50, 100, 100]),

  REPUBLIC_1: r("Respublika musobaqasi — 1-oʻrin", 500, [500, 500, 750, 750]),
  REPUBLIC_2: r("Respublika musobaqasi — 2-oʻrin", 300, [300, 300, 500, 500]),
  REPUBLIC_3: r("Respublika musobaqasi — 3-oʻrin", 200, [200, 200, 350, 350]),
  REPUBLIC_P: r("Respublika musobaqasida ishtirok", 50, [50, 50, 100, 100]),

  INTL_1: r("Xalqaro musobaqa — 1-oʻrin", 1000, [1000, 1000, 1200, 1200]),
  INTL_2: r("Xalqaro musobaqa — 2-oʻrin", 800, [800, 800, 1000, 1000]),
  INTL_3: r("Xalqaro musobaqa — 3-oʻrin", 650, [650, 650, 800, 800]),
  INTL_P: r("Xalqaro musobaqada ishtirok", 500, [500, 500, 600, 600]),

  TANLOV_1: r("Tanlov — 1-oʻrin", 100, [100, 100, 150, 150]),
  TANLOV_2: r("Tanlov — 2-oʻrin", 80, [80, 80, 100, 100]),
  TANLOV_3: r("Tanlov — 3-oʻrin", 60, [60, 60, 80, 80]),
  TANLOV_P: r("Tanlovda ishtirok", 30, [30, 30, 50, 50]),

  PRESENTATION: r("3 oylik taqdimot (barcha qatnashuvchilarga)", 25, [25]),
} as const;
export type RuleKey = keyof typeof RULES;

/** Admin «Mukofot berish» oynasi va qoidalar jadvali uchun guruhlar. */
export const RULE_GROUPS: { key: string; title: string; rules: RuleKey[] }[] = [
  { key: "lesson", title: "Dars", rules: ["ATTENDANCE"] },
  { key: "grade", title: "Baholar (vazifa, darsdagi baho, imtihon)", rules: ["GRADE_3", "GRADE_4", "GRADE_5", "GRADE_5P"] },
  { key: "internal", title: "Ichki musobaqa", rules: ["INTERNAL_1", "INTERNAL_2", "INTERNAL_3", "INTERNAL_P"] },
  { key: "city", title: "Shahar musobaqasi", rules: ["CITY_1", "CITY_2", "CITY_3", "CITY_P"] },
  { key: "republic", title: "Respublika musobaqasi", rules: ["REPUBLIC_1", "REPUBLIC_2", "REPUBLIC_3", "REPUBLIC_P"] },
  { key: "intl", title: "Xalqaro musobaqa", rules: ["INTL_1", "INTL_2", "INTL_3", "INTL_P"] },
  { key: "tanlov", title: "Tanlovlar", rules: ["TANLOV_1", "TANLOV_2", "TANLOV_3", "TANLOV_P"] },
  { key: "presentation", title: "Taqdimot", rules: ["PRESENTATION"] },
];

/** Admin qoʻlda beradigan mukofotlar (musobaqa, tanlov, taqdimot). */
export const AWARD_RULES = RULE_GROUPS.filter((g) => !["lesson", "grade"].includes(g.key)).flatMap((g) => g.rules);

export const GAMIFICATION = {
  /** Darsdagi faollik — ustoz belgilaydi (jadvaldan tashqari kichik ragʻbat, XP = kumush, bosqichga bogʻliq emas) */
  activity: { min: 1, max: 5 },
  leaderboard: {
    scope: "group" as const, // markaz bo'yicha reyting yo'q
    period: "week" as const,
    showOthersStreak: false,
    showOthersLevel: false,
  },
} as const;

/** XP → bosqich (0–8). */
export function stageOf(xp: number) {
  let s = 0;
  for (let i = 0; i < STAGES.length; i++) if (xp >= STAGES[i]) s = i;
  return s;
}

export const stageName = (s: number) => `${s}-bosqich`;

/** Qoida boʻyicha shu bosqichda beriladigan XP va kumush. */
export function ruleAmount(rule: RuleKey, stage: number) {
  const x = RULES[rule];
  return { xp: x.xp, kumush: x.kumush[Math.min(Math.max(stage, 0), x.kumush.length - 1)] };
}

/** Uy vazifasi uchun eng yuqori mukofot (5 baho) — shu XP dagi bosqich boʻyicha kumush. */
export const homeworkReward = (xp = 0) => ruleAmount("GRADE_5", stageOf(xp)).kumush;

/** Baho (2–5) yoki foiz (0–100) → qoida. 3 dan past boʻlsa — hech narsa. */
export function gradeRule(value: number | null | undefined, percent?: number | null): RuleKey | null {
  if (percent != null) {
    if (percent >= 95) return "GRADE_5P";
    if (percent >= 86) return "GRADE_5";
    if (percent >= 71) return "GRADE_4";
    if (percent >= 60) return "GRADE_3";
    return null;
  }
  if (value == null) return null;
  if (value >= 4.5) return "GRADE_5";
  if (value >= 3.5) return "GRADE_4";
  if (value >= 2.5) return "GRADE_3";
  return null;
}

/**
 * Bosqich holati (avvalgi «unvon» oʻrnida; shakl saqlangan): joriy bosqich, keyingisigacha qancha XP.
 * `xp` — oʻquvchining jami tajribasi.
 */
export function coinTitle(xp: number) {
  const s = stageOf(xp);
  const next = s + 1 < STAGES.length ? { name: stageName(s + 1), remaining: STAGES[s + 1] - xp } : null;
  return { current: stageName(s), stage: s, next };
}
