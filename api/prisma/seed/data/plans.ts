// Darslar va uyga vazifalar rejasi. GR-03 — KANON §7 ga moslab qo'lda yozilgan (28-dars = 22-may, Unit 4 1-qism).
import type { GradeKind, HomeworkType, Skill } from "@prisma/client";

export type HwSpec = { title: string; type: HomeworkType; skill: Skill; desc: string; ali: number | null };
export type LessonSpec = { title: string; unit: number | null; hw?: HwSpec };

const U = (n: number, name: string) => `Unit ${n} — ${name}`;
const L2 = [
  "", "Introduction to IELTS & Everyday Communication", "Hobbies, Free Time & Present Simple/Continuous",
  "Daily Routines, Habitual Actions & Frequency Adverbs", "My Family & Relationships", "Food, Culture & Ordering in a Restaurant",
  "Midterm Progress Check & Mini Mock Exam", "Travel, Transport & Places", "Health, Sport & Healthy Lifestyle",
  "Education, Work & Future Plans", "Technology, Media & Communication", "Environment, Weather & Nature", "Final Review & Level 2 Mock Exam",
];
const hw = (title: string, type: HomeworkType, skill: Skill, desc: string, ali: number | null): HwSpec => ({ title, type, skill, desc, ali });

// Ali uchun uyga vazifa baholari: 25 ta (h9, h16 topshirilmagan; h28 — joriy qoralama)
export const GR03_PLAN: LessonSpec[] = [
  { title: "Kirish: diagnostik test va IELTS formati", unit: null, hw: hw("Kirish — Level 1 lugʻat takrori", "QUIZ", "VOCABULARY", "Level 1 dagi 40 ta asosiy soʻz boʻyicha onlayn test.", 4) },
  { title: "Kirish: Level 1 takrori (grammatika)", unit: null, hw: hw("Kirish — Grammar diagnostika mashqlari", "QUIZ", "GRAMMAR", "Zamonlar va savol tuzish boʻyicha 25 ta mashq.", 4) },
  { title: "Kirish: Level 1 takrori (lugʻat va nutq)", unit: null, hw: hw("Kirish — Oʻzim haqimda (audio)", "AUDIO", "SPEAKING", "Oʻzingiz haqingizda 1 daqiqalik audio yozing.", 4) },
  { title: `${U(1, L2[1])} (1-qism)`, unit: 1, hw: hw("Unit 1 — Listening: personal details", "QUIZ", "LISTENING", "Shaxsiy maʼlumotlarni tinglab yozib olish (10 savol).", 4) },
  { title: `${U(1, L2[1])} (2-qism)`, unit: 1, hw: hw("Unit 1 — Short email to a friend", "TEXT", "WRITING", "Doʻstingizga oʻzingizni tanishtiruvchi 80–100 soʻzlik xat yozing.", 4) },
  { title: "Unit 1 — Speaking Part 1: tanishuv savollari", unit: 1, hw: hw("Unit 1 — Speaking Part 1 savollari (audio)", "AUDIO", "SPEAKING", "Part 1 dagi 5 ta savolga audio javob yozing.", 5) },
  { title: "Unit 1 — Reading: matching headings", unit: 1, hw: hw("Unit 1 — Reading: matching headings", "QUIZ", "READING", "Qisqa matn va 6 ta sarlavhani moslashtiring.", 4) },
  { title: "Unit 1 — Listening Section 1 amaliyoti", unit: 1, hw: hw("Unit 1 — Listening Section 1 amaliyoti", "QUIZ", "LISTENING", "Section 1 formatidagi 10 ta savol.", 5) },
  { title: "Unit 1 — Fonetika va talaffuz asoslari", unit: 1, hw: hw("Unit 1 — Talaffuz mashqi (audio)", "AUDIO", "SPEAKING", "Minimal juftliklar roʻyxatini ovoz chiqarib oʻqing va yozib yuklang.", null) },
  { title: "Unit 1 — Writing: my city", unit: 1, hw: hw("Unit 1 — Paragraph: my city", "TEXT", "WRITING", "Shahringiz haqida 120 soʻzlik paragraf yozing.", 5) },
  { title: "Unit 1 — Numbers & spelling", unit: 1, hw: hw("Unit 1 — Numbers & spelling dictation", "QUIZ", "LISTENING", "Sonlar va ismlarni harflab yozish diktanti.", 4) },
  { title: "Unit 1 — Takrorlash va mini test", unit: 1, hw: hw("Unit 1 — Lugʻat kartochkalari", "QUIZ", "VOCABULARY", "Unit 1 lugʻati boʻyicha 30 ta kartochka.", 5) },
  { title: `${U(2, L2[2])} (1-qism)`, unit: 2, hw: hw("Unit 2 — My hobbies (audio)", "AUDIO", "SPEAKING", "Sevimli mashgʻulotingiz haqida 1 daqiqa gapiring.", 5) },
  { title: `${U(2, L2[2])} (2-qism)`, unit: 2, hw: hw("Unit 2 — Present Simple vs Continuous", "QUIZ", "GRAMMAR", "Ikki zamonni farqlash boʻyicha 20 ta mashq.", 5) },
  { title: "Unit 2 — Reading: True/False/Not Given", unit: 2, hw: hw("Unit 2 — Reading: True/False/Not Given", "QUIZ", "READING", "Boʻsh vaqt haqidagi matn boʻyicha 8 ta TFNG savol.", 5) },
  { title: "Unit 2 — Paragraph writing", unit: 2, hw: hw("Unit 2 — Mini insho: free time", "TEXT", "WRITING", "Boʻsh vaqtingiz haqida 150 soʻzlik mini insho.", null) },
  { title: "Unit 2 — Listening: leisure activities", unit: 2, hw: hw("Unit 2 — Listening: leisure activities", "QUIZ", "LISTENING", "Dam olish faoliyatlari haqida 10 ta savol.", 5) },
  { title: "Unit 2 — Speaking Part 2 cue card", unit: 2, hw: hw("Unit 2 — Speaking Part 2 cue card", "AUDIO", "SPEAKING", "“Describe a hobby you enjoy” kartochkasi boʻyicha 1.5 daqiqa.", 4) },
  { title: "Unit 2 — Frequency adverbs va zamonlar", unit: 2, hw: hw("Unit 2 — Paragraph writing", "FILE", "WRITING", "Daftarga yozilgan paragrafni rasmga olib yuklang.", 4) },
  { title: `${U(2, L2[2])} (3-qism)`, unit: 2, hw: hw("Unit 2 — Describe your weekend (audio)", "AUDIO", "SPEAKING", "Dam olish kuningizni 1–2 daqiqada hikoya qiling.", 5) },
  { title: "Unit 2 — Grammar Focus", unit: 2, hw: hw("Unit 2 — Listening Section 2", "QUIZ", "LISTENING", "Section 2 formatidagi 10 ta savol.", 5) },
  { title: "Unit 2 — Grammar quiz", unit: 2, hw: hw("Unit 2 — Reading: short answers", "QUIZ", "READING", "Qisqa javobli 8 ta savol.", 4) },
  { title: "Unit 3 — Speaking Drill", unit: 3, hw: hw("Unit 3 — Daily routine monologue", "AUDIO", "SPEAKING", "Kun tartibingiz haqida 1 daqiqalik monolog.", 5) },
  { title: "Unit 3 — Writing Task 1", unit: 3, hw: hw("Unit 3 — Writing Task 1: routine chart", "FILE", "WRITING", "Kun tartibi jadvali boʻyicha 120 soʻzlik tavsif.", 5) },
  { title: "Unit 3 — Lugʻat testi", unit: 3, hw: hw("Unit 3 — Listening: timetables", "QUIZ", "LISTENING", "Jadval va vaqtlarni tinglab toʻldirish.", 5) },
  { title: "Unit 3 — Speaking Mock", unit: 3, hw: hw("Unit 3 — Frequency adverbs speaking drill", "AUDIO", "SPEAKING", "10 ta savolga chastota ravishlari bilan audio javob.", 5) },
  { title: "Unit 3 — Speaking interview", unit: 3, hw: hw("Unit 3 — Daily Routines: speaking audio", "AUDIO", "SPEAKING", "Kun tartibingiz haqida 1–2 daqiqalik audio. Chastota ravishlaridan kamida 5 tasini qoʻllang.", 5) },
  {
    title: `${U(4, L2[4])} (1-qism)`, unit: 4,
    hw: hw("Unit 4 — Family words", "AUDIO", "SPEAKING", "Darsda oʻrganilgan 12 ta yangi soʻzni lugʻat daftaringizga yozing, oilangiz haqida 1–2 daqiqalik audio hikoya yozib yuklang va eng yoqqan sevimli iborangizni qoldiring.", null),
  },
  { title: `${U(4, L2[4])} (2-qism)`, unit: 4 },
  { title: `${U(5, L2[5])} (1-qism)`, unit: 5 },
  { title: "Unit 5 — Takrorlash (Final Review)", unit: 5 },
  { title: "Unit 5 — Oylik nazorat", unit: 5 },
  ...[6, 7, 8, 9, 10, 11].flatMap((u) => [1, 2].map((k) => ({ title: `${U(u, L2[u])} (${k}-qism)`, unit: u }))),
  { title: `${U(12, L2[12])} (1-qism)`, unit: 12 },
  { title: `${U(12, L2[12])} (2-qism)`, unit: 12 },
  { title: "Level 2 — Umumiy takrorlash", unit: 12 },
  { title: "Level 2 — Yakuniy imtihonga tayyorgarlik", unit: 12 },
];

// Ali: uyga vazifadan tashqari 15 ta baho (lesson = GR-03 dars raqami)
export type AliGrade = { lesson: number; kind: GradeKind; skill: Skill; value: number; title: string; comment?: string };
export const ALI_GRADES: AliGrade[] = [
  { lesson: 8, kind: "CLASSWORK", skill: "LISTENING", value: 4, title: "Listening Section 1 — darsdagi mashq" },
  { lesson: 10, kind: "TEST", skill: "READING", value: 4, title: "Reading mini test (Unit 1)" },
  { lesson: 12, kind: "TEST", skill: "GRAMMAR", value: 4, title: "Unit 1 grammatika testi" },
  { lesson: 13, kind: "TEST", skill: "VOCABULARY", value: 5, title: "Unit 2 lugʻat testi" },
  { lesson: 14, kind: "CLASSWORK", skill: "SPEAKING", value: 4, title: "Unit 2 — speaking drill" },
  { lesson: 16, kind: "CLASSWORK", skill: "READING", value: 5, title: "Unit 2 — reading darsdagi ish" },
  { lesson: 17, kind: "TEST", skill: "WRITING", value: 4, title: "Unit 2 — paragraph writing testi" },
  { lesson: 19, kind: "TEST", skill: "LISTENING", value: 5, title: "Listening Practice Test #3" },
  { lesson: 20, kind: "CLASSWORK", skill: "GRAMMAR", value: 5, title: "Unit 2 — darsdagi javoblar" },
  { lesson: 22, kind: "TEST", skill: "GRAMMAR", value: 4.2, title: "Grammar quiz (Unit 2)", comment: "Present Simple va Present Continuous farqida 2 ta xatolik kuzatildi, qoʻshimcha mashq berildi." },
  { lesson: 24, kind: "CLASSWORK", skill: "WRITING", value: 5, title: "Writing Task 1 — darsdagi ish" },
  { lesson: 25, kind: "TEST", skill: "VOCABULARY", value: 4.6, title: "Unit 3 lugʻat testi", comment: "40 ta savoldan 37 tasiga toʻgʻri javob berdi. Soʻzlarni kontekstda qoʻllashda oʻsish bor." },
  { lesson: 26, kind: "MOCK", skill: "SPEAKING", value: 4.8, title: "Speaking Mock", comment: "Savollarga ishonch bilan, ravon javob berdi." },
  { lesson: 27, kind: "SPEAKING", skill: "SPEAKING", value: 4.8, title: "Speaking interview (Unit 3)", comment: "Fikrini ravon bayon qildi, chastota ravishlarini oʻrinli qoʻlladi." },
  { lesson: 28, kind: "CLASSWORK", skill: "SPEAKING", value: 5, title: "Unit 4 — darsdagi faollik", comment: "Ali dars davomida juda faol qatnashdi, oila aʼzolari mavzusidagi yangi leksikalarni erkin nutqda toʻgʻri qoʻllay oldi." },
];

// Ali qatnashmagan darslar
export const ALI_ABSENT = 9; // sababsiz
export const ALI_EXCUSED = 23; // canon 10-may (sababli)

export const GR03_L28_SUMMARY = [
  "Oilaviy munosabatlar lugʻati, IELTS Speaking 1-2 boʻlimlariga kirish hamda Present Perfect va Past Simple qoidalari tahlili.",
  "1. Yangi leksika: 24 ta ilgʻor soʻz va iboralar (immediate family, extended relatives, kinship terms, personality idioms).",
  "2. Grammatika: Present Perfect vs Past Simple — oilaviy xotiralarni hikoya qilishda qoʻllash.",
  "3. Speaking: juftlikda “Describe a family member you admire” mavzusida 2 daqiqalik monolog.",
  "4. Fonetika: qisqartmalar (contractions) va ravonlik mashqlari.",
].join("\n");

export const GR09_TITLES = [
  "Tense Review: Narrative Tenses in Academic Writing", "Perfect Aspect & Nuanced Time Reference", "Future in the Past",
  "Modal Verbs of Deduction & Speculation", "Conditionals I: Zero to Third", "Conditionals II: Mixed & Implied",
  "Passive Voice in Academic Prose", "Causatives: have/get something done", "Relative Clauses: Defining & Non-defining",
  "Participle Clauses", "Noun Clauses & Reported Speech", "Hedging & Boosting Devices", "Cleft Sentences for Emphasis",
  "Ellipsis & Substitution", "Inversion after Negative Adverbials", "Subjunctive mood & Nuanced Tenses",
  "Inversion & Complex Clauses (C1)", "Inversion & Emphatic Structures in Academic Prose", "C1 Academic Collocations & Test 4",
  "Nominalisation in Academic Style", "Discourse Markers & Cohesion", "Error Correction Workshop", "C1 Grammar Mock Test",
  "Yakuniy tahlil va sertifikatlash",
];

export const GR20_TITLES = [
  "Speaking Part 1: Warm-up & Fluency", "Debate: Technology in Education", "Part 2 Cue Card Marathon", "1-on-1 Mock Speaking Interviews",
  "Part 3: Abstract Discussion", "Debate: City vs Countryside", "Pronunciation & Intonation Clinic", "Mock Speaking & Band Descriptors",
  "Part 2: Storytelling Techniques", "Debate: Social Media & Teenagers", "Idioms in Natural Speech", "Full Speaking Mock & Feedback",
  "Speaking Part 2–3 va debat: Debate & Expressing Opinions", "Part 3: Environment & Society", "Mock Speaking Interviews (2-bosqich)",
  "Debate: Remote Work", "Fluency Games & Role-play", "Part 2: Describing Places", "Mock Speaking & Band Descriptors (2)",
  "Debate: Tradition vs Modernity", "Part 3: Education Systems", "Speaking Mock Marathon", "Klub yakuniy debati", "Mavsum yakuni va sertifikatlar",
];

export const GR21_TITLES = [
  "Grammar Booster: Tenses Overview", "Articles & Determiners", "Present Perfect in Use", "Modal Verbs in Context",
  "Comparatives & Superlatives", "Conditionals Made Simple", "Passive Voice Basics", "Relative Clauses", "Reported Speech",
  "Gerund vs Infinitive", "Prepositions of Time & Place", "Linking Words for Writing", "Word Formation", "Error Correction",
  "Mini Test", "Yakuniy test",
];

// Alisher guruhlaridagi joriy (kanon) uyga vazifalar — Vazifalar markazi mockupi
export const CANON_HW = {
  gr18Essay: { title: "Writing Task 2: Opinion vs Discussion Essay — Technology & Education", desc: "Oʻquvchilar kamida 250 soʻzdan iborat toʻliq esse yozishi, ikkala nuqtai nazarni tahlil qilib, shaxsiy xulosani 4 bosqichli argument bilan asoslashi shart." },
  gr18Report: { title: "Task 1 Academic Report (Bar chart analysis)", desc: "Ustunli diagramma boʻyicha 150–180 soʻzlik akademik hisobot." },
  gr09Sheet: { title: "Advanced Inversion & C1 Structures Practice Sheet (30 ta mashq)", desc: "Inversion jumlalari, shart ergash gaplar va aralash tipdagi tuzilmalar ustida mustahkamlash mashqlari toʻplami." },
  gr20Rec: { title: "Part 1 & 2 Self-Recordings & Vocabulary Log", desc: "Haftalik mavzu boʻyicha kamida 8 ta C1 ibora ishlatilgan 3 ta audio javob va lugʻat konspekti." },
};

export const FEEDBACK_5 = [
  "Ajoyib ish! Barcha talablar bajarilgan.", "Aʼlo, soʻz boyligi va aniqlik yuqori darajada.", "Juda yaxshi tayyorlangan, barakalla!",
  "Mukammal bajarilgan, shu ruhda davom eting.", "Talaffuz aniq, yangi soʻzlarni oʻrinli qoʻlladi.",
];
export const FEEDBACK_4 = [
  "Yaxshi ish, lekin bir nechta grammatik xato bor.", "Yaxshi. Bogʻlovchilarni koʻproq ishlating.", "Mazmun yaxshi, imloga eʼtibor bering.",
  "Yaxshi harakat, javoblarni biroz kengaytiring.", "Yaxshi, lekin ravonlik ustida ishlash kerak.",
];
export const FEEDBACK_3 = [
  "Qoniqarli. Qoidalarni qayta koʻrib chiqing.", "Topshiriq toʻliq bajarilmagan, qoʻshimcha mashq qiling.", "Xatolar koʻp, ustoz bilan konsultatsiyaga yoziling.",
];
export const RETURN_NOTES = [
  "Audio fayl eshitilmayapti, iltimos qayta yozib yuklang.", "Esse hajmi 250 soʻzdan kam — kengaytirib qayta topshiring.",
  "Rasm xira chiqqan, daftarni yorugʻda qayta suratga oling.", "Topshiriqning 2-qismi bajarilmagan.", "Fayl notoʻgʻri vazifaga yuklangan, qayta topshiring.",
];

export const LESSON_SUMMARIES = [
  (t: string) => `«${t}» mavzusi boʻyicha yangi lugʻat oʻrganildi, juftlikda nutq amaliyoti va qisqa test bajarildi.`,
  (t: string) => `«${t}»: grammatik qoida tushuntirildi, 12 ta mashq bajarildi, uyga vazifa berildi.`,
  (t: string) => `«${t}» darsida tinglab tushunish mashqlari va guruhda muhokama oʻtkazildi.`,
  (t: string) => `«${t}»: oʻquvchilar mini taqdimot qildi, ustoz individual izoh berdi.`,
  (t: string) => `«${t}» boʻyicha reading strategiyalari va vaqtni boshqarish mashq qilindi.`,
];
