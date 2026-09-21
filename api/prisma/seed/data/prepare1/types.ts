// Darsma-dars rejaning tuzilishi. Har bir dars 90 daqiqa (1,5 soat), haftasiga 3 marta.
// Reja ustoz dars oʻtayotganda ekranda ochiladi, shuning uchun qadamlar aniq va bajariladigan boʻlishi kerak:
// har blokda necha daqiqa, nima qilinadi, qaysi mashq va audio ishlatiladi.

/** Dars ichidagi bitta bosqich: nomi, davomiyligi va aniq qadamlar. */
export type PlanBlock = {
  /** "Warm-up va oʻtgan darsni takrorlash" — raqamsiz, UI oʻzi raqamlaydi */
  title: string;
  /** shu bosqichga ajratilgan daqiqa; darsdagi barcha bloklar yigʻindisi 90 boʻlsin */
  minutes: number;
  /** 2–5 ta aniq qadam: nima qilinadi, qaysi mashq/audio, qanday tashkil etiladi */
  points: string[];
};

export type PlanLesson = {
  /** darsning qisqa nomi (oʻzbekcha) */
  focus: string;
  /** SB sahifalari, testlar uchun "—" */
  sb: string;
  /** 2–3 ta natija: "Oʻquvchilar ... oladilar" */
  maqsad: string[];
  /** 5–10 ta soʻz: "word – oʻzbekcha maʼnosi" */
  lugat: string[];
  /** darsga kerak boʻladigan narsalar (kitob, audio, flashcard, doska va h.k.) */
  resurslar: string[];
  /** dars bosqichlari tartib bilan; minutes yigʻindisi = 90 */
  blocks: PlanBlock[];
  /** uyga vazifa (1–3 band) */
  uyga: string[];
  /** ustozga metodik eslatma: nima qiyin keladi, nimaga eʼtibor berish kerak */
  ustozga: string;
};

export type PlanUnit = {
  /** kitob uniti: 0 = Starter, 1..20 */
  unit: number;
  title: string;
  description: string;
  objectives: string[];
  vocabulary: string[];
  grammar: string;
  /** 13–16 yosh (tezroq): unitga 2–3 dars */
  teen: PlanLesson[];
  /** 8–12 yosh (sekinroq): unitga 3–4 dars */
  kids: PlanLesson[];
};

/** Bloklar yigʻindisi 90 daqiqa ekanini tekshiradi (import paytida xato darrov koʻrinadi). */
export function checkMinutes(units: PlanUnit[], label: string) {
  const bad: string[] = [];
  for (const u of units) {
    for (const [track, list] of [["teen", u.teen], ["kids", u.kids]] as const) {
      for (const l of list) {
        const sum = l.blocks.reduce((s, b) => s + b.minutes, 0);
        if (sum !== 90) bad.push(`${label} unit ${u.unit} ${track} "${l.focus}": ${sum} daqiqa`);
      }
    }
  }
  if (bad.length) throw new Error(`Dars davomiyligi 90 daqiqa emas:\n  ${bad.join("\n  ")}`);
  return units;
}

/** Bitta yosh toifasi uchun yozilgan kitob uniti (masalan Starter — Kid's Box 1, faqat 8–12 yosh). */
export type BookUnit = {
  unit: number;
  title: string;
  description: string;
  objectives: string[];
  vocabulary: string[];
  grammar: string;
  lessons: PlanLesson[];
};

/** BookUnit darslarining har biri 90 daqiqa ekanini tekshiradi. */
export function checkBookMinutes(units: BookUnit[], label: string) {
  const bad = units.flatMap((u) =>
    u.lessons
      .map((l) => ({ l, sum: l.blocks.reduce((s, b) => s + b.minutes, 0) }))
      .filter((x) => x.sum !== 90)
      .map((x) => `${label} unit ${u.unit} "${x.l.focus}": ${x.sum} daqiqa`),
  );
  if (bad.length) throw new Error(`Dars davomiyligi 90 daqiqa emas:\n  ${bad.join("\n  ")}`);
  return units;
}
