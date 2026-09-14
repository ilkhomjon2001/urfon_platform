// KANON.md §5–§6 dagi statik ma'lumotlar: leveller, xonalar, guruhlar, xodimlar, nomli o'quvchilar va ota-onalar.
import type { GroupStatus, Role } from "@prisma/client";

export const BRANCH = {
  name: "Chilonzor filiali",
  address: "Toshkent sh., Chilonzor tumani, Bunyodkor shoh koʻchasi, 12-uy (Bosh bino)",
  phone: "+998 71 200-44-22",
};

export const LEVELS = [
  { code: "L1", name: "Beginner / Starter", order: 1 },
  { code: "L2", name: "IELTS Foundation", order: 2 },
  { code: "L3", name: "IELTS Intermediate", order: 3 },
  { code: "L4", name: "IELTS Advanced & Mock", order: 4 },
  { code: "L5", name: "Band 7.0+ Masterclass", order: 5 },
  { code: "L6", name: "Academic Fluency", order: 6 },
  { code: "KIDS", name: "Kids", order: 7 },
] as const;

export const ROOMS = [
  { name: "204-xona", location: "Bosh bino, 2-qavat", capacity: 16, kind: "Smart Board" },
  { name: "205-xona", location: "Bosh bino, 2-qavat", capacity: 14, kind: null },
  { name: "12-xona", location: "Bosh bino, 1-qavat", capacity: 16, kind: "Audio Lab" },
  { name: "04-xona", location: "Bosh bino, 1-qavat", capacity: 18, kind: null },
  { name: "02-xona", location: "Bosh bino, 1-qavat", capacity: 4, kind: "Speaking Room" },
  { name: "Konferensiya zali", location: "Bosh bino, 3-qavat", capacity: 30, kind: "Konferensiya zali" },
  { name: "108-xona", location: "Bosh bino, 1-qavat", capacity: 16, kind: null },
  { name: "302-xona", location: "Bosh bino, 3-qavat", capacity: 14, kind: null },
  { name: "102-xona", location: "Bosh bino, 1-qavat", capacity: 12, kind: "Bolalar zali" },
  { name: "105-xona", location: "Bosh bino, 1-qavat", capacity: 15, kind: null },
  { name: "206-xona", location: "Bosh bino, 2-qavat", capacity: 6, kind: "Ustozlar xonasi" },
  { name: "Katta zal", location: "Bosh bino, 1-qavat", capacity: 60, kind: "Imtihon zali" },
] as const;

export type Plan = "gr03" | "gr04" | "gr09" | "gr20" | "gr21" | "level";

export type GroupSpec = {
  code: string;
  name: string;
  level: string | null;
  teacher: string | null; // xodim kaliti
  room: string;
  days: number[];
  start: string;
  end: string;
  capacity: number;
  status: GroupStatus;
  fee: number;
  totalLessons: number;
  doneBeforeT: number; // T dan oldin o'tilgan darslar soni (startDate shundan hisoblanadi)
  plan: Plan;
  note?: string;
};

// 12 ta guruh: 9 faol, 3 yangi qabul (GR-04, GR-05, GR-21)
export const GROUPS: GroupSpec[] = [
  { code: "GR-03", name: "IELTS Foundation #3", level: "L2", teacher: "alisher", room: "204-xona", days: [1, 3, 5], start: "14:00", end: "15:30", capacity: 16, status: "ACTIVE", fee: 850_000, totalLessons: 48, doneBeforeT: 28, plan: "gr03" },
  { code: "GR-04", name: "IELTS Foundation #4", level: "L2", teacher: "alisher", room: "205-xona", days: [1, 3, 5], start: "16:00", end: "17:30", capacity: 14, status: "ENROLLING", fee: 850_000, totalLessons: 48, doneBeforeT: 5, plan: "gr04" },
  { code: "GR-05", name: "IELTS Foundation #5", level: "L2", teacher: null, room: "204-xona", days: [1, 3, 5], start: "18:00", end: "19:30", capacity: 16, status: "ENROLLING", fee: 850_000, totalLessons: 48, doneBeforeT: 0, plan: "level" },
  { code: "GR-18", name: "IELTS Band 7.0+ Intensive", level: "L5", teacher: "alisher", room: "12-xona", days: [1, 3, 5], start: "10:00", end: "11:30", capacity: 16, status: "ACTIVE", fee: 1_000_000, totalLessons: 48, doneBeforeT: 28, plan: "level" },
  { code: "GR-09", name: "Grammar Masterclass (C1)", level: "L4", teacher: "alisher", room: "04-xona", days: [2, 4], start: "16:00", end: "17:30", capacity: 18, status: "ACTIVE", fee: 950_000, totalLessons: 24, doneBeforeT: 18, plan: "gr09", note: "IELTS guruhlari oʻquvchilari uchun qoʻshimcha modul (asosiy paket narxiga kiritilgan)" },
  { code: "GR-20", name: "Weekend Speaking & Mock Club", level: null, teacher: "alisher", room: "Konferensiya zali", days: [6], start: "14:00", end: "16:30", capacity: 16, status: "ACTIVE", fee: 0, totalLessons: 24, doneBeforeT: 12, plan: "gr20", note: "Markaz oʻquvchilari uchun bepul klub" },
  { code: "GR-11", name: "IELTS Intermediate #1", level: "L3", teacher: "shahzodbek", room: "108-xona", days: [2, 4, 6], start: "16:00", end: "17:30", capacity: 16, status: "ACTIVE", fee: 900_000, totalLessons: 48, doneBeforeT: 30, plan: "level" },
  { code: "GR-12", name: "IELTS Advanced Mock #2", level: "L4", teacher: "shahzodbek", room: "302-xona", days: [1, 3, 5], start: "09:30", end: "11:00", capacity: 14, status: "ACTIVE", fee: 950_000, totalLessons: 48, doneBeforeT: 34, plan: "level" },
  { code: "GR-15", name: "Kids Starters #5", level: "KIDS", teacher: "malika", room: "102-xona", days: [2, 4, 6], start: "10:00", end: "11:30", capacity: 12, status: "ACTIVE", fee: 750_000, totalLessons: 48, doneBeforeT: 32, plan: "level" },
  { code: "GR-17", name: "Kids Movers #2", level: "KIDS", teacher: "malika", room: "102-xona", days: [1, 3, 5], start: "15:00", end: "16:30", capacity: 12, status: "ACTIVE", fee: 750_000, totalLessons: 48, doneBeforeT: 20, plan: "level" },
  { code: "GR-16", name: "Grammar Intensive #2", level: "L1", teacher: "jasurbek", room: "105-xona", days: [2, 4, 6], start: "18:00", end: "19:30", capacity: 15, status: "ACTIVE", fee: 800_000, totalLessons: 48, doneBeforeT: 40, plan: "level" },
  { code: "GR-21", name: "Grammar Booster #1", level: null, teacher: "jasurbek", room: "105-xona", days: [2, 4], start: "14:00", end: "15:30", capacity: 12, status: "ENROLLING", fee: 600_000, totalLessons: 16, doneBeforeT: 3, plan: "gr21", note: "IELTS guruhlari oʻquvchilari uchun qoʻshimcha grammatika moduli (paketga kiritilgan)" },
];

export type StaffSpec = {
  key: string;
  role: Role;
  fullName: string;
  login: string;
  title: string;
  avatarUrl?: string;
  telegram?: string; // username
  profile?: { specialization: string; certificates: string[]; experienceYears: number; bio: string; responseTime: string };
};

export const STAFF: StaffSpec[] = [
  { key: "sanjar", role: "ADMIN", fullName: "Sanjar Rahimov", login: "+998901000001", title: "Bosh administrator" },
  {
    key: "alisher", role: "TEACHER", fullName: "Alisher Qosimov", login: "+998901000002", title: "IELTS katta ustozi", avatarUrl: "/avatars/alisher-qosimov.jpg", telegram: "alisher_qosimov",
    profile: { specialization: "IELTS 8.5", certificates: ["IELTS Academic 8.5", "CELTA"], experienceYears: 7, bio: "7 yillik xalqaro taʼlim tajribasi. 300+ oʻquvchilari IELTS 7.0+ natija koʻrsatgan.", responseTime: "odatda 1–2 soat" },
  },
  {
    key: "shahzodbek", role: "TEACHER", fullName: "Shahzodbek Saidov", login: "+998901000003", title: "IELTS ustozi", avatarUrl: "/avatars/shahzodbek-saidov.jpg", telegram: "shahzodbek_s",
    profile: { specialization: "CELTA", certificates: ["CELTA", "IELTS Academic 8.0"], experienceYears: 5, bio: "IELTS Intermediate va Advanced guruhlari ustozi. Writing va Mock tahlili boʻyicha mutaxassis.", responseTime: "odatda 2–3 soat" },
  },
  {
    key: "malika", role: "TEACHER", fullName: "Malika Umarova", login: "+998901000004", title: "Kids ustozi", avatarUrl: "/avatars/malika-umarova.jpg", telegram: "malika_umarova",
    profile: { specialization: "TESOL", certificates: ["TESOL Sertifikati", "TKT Young Learners"], experienceYears: 6, bio: "Bolalar bilan oʻyin va qoʻshiqlar orqali ishlash tajribasi 6 yil.", responseTime: "odatda 1–2 soat" },
  },
  {
    key: "jasurbek", role: "TEACHER", fullName: "Jasurbek Rustamov", login: "+998901000005", title: "Grammar ustozi",
    profile: { specialization: "Grammar (CEFR C2)", certificates: ["CEFR C2", "TKT Module 1–3"], experienceYears: 4, bio: "Grammatika intensivlari va Grammar Booster modullari ustozi.", responseTime: "odatda 3–4 soat" },
  },
  {
    key: "john", role: "TEACHER", fullName: "John Smith", login: "+998901000006", title: "Speaking club moderatori",
    profile: { specialization: "Native speaker (UK)", certificates: ["CELTA", "DELTA Module 2"], experienceYears: 10, bio: "Londonlik native speaker. Speaking club va talaffuz boʻyicha individual mashgʻulotlar.", responseTime: "odatda 1 kun" },
  },
  {
    key: "kamola", role: "TEACHER", fullName: "Kamola Tursunova", login: "+998901000007", title: "IELTS ustozi",
    profile: { specialization: "IELTS 8.0", certificates: ["IELTS Academic 8.0", "CELTA"], experienceYears: 3, bio: "Yangi ustoz. Level 2 · IELTS Foundation guruhlari uchun nomzod (IELTS Foundation #5).", responseTime: "odatda 2–3 soat" },
  },
  { key: "nigora", role: "ADMIN", fullName: "Dr. Nigora Karimova", login: "+998901000008", title: "Bosh akademik metodist", avatarUrl: "/avatars/nigora-karimova.jpg" },
  { key: "nodira", role: "ADMIN", fullName: "Nodira Olimova", login: "+998712004422", title: "Filial koordinatori" },
];

export type NamedStudent = {
  key: string;
  fullName: string;
  code: string;
  gender: "m" | "f";
  groups: string[]; // birinchisi — asosiy (to'lov shu guruh bo'yicha)
  status?: "ACADEMIC_LEAVE";
  leftGroup?: string; // akademik ta'tildagilar uchun
  parent: { key: string; fullName: string; relation: "Ota" | "Ona"; phone?: string; telegram?: string | false; chatId?: string };
  goal?: string;
  coins?: number; // "Guruhdagi faollik" uchun aniq balans
  turnstile?: boolean;
};

// KANON §5 dagi nomli o'quvchilar
export const NAMED_STUDENTS: NamedStudent[] = [
  { key: "ali", fullName: "Ali Valiyev", code: "ST-8492", gender: "m", groups: ["GR-03"], goal: "IELTS 7.5+", coins: 1240, parent: { key: "rustam", fullName: "Rustam Valiyev", relation: "Ota", phone: "+998901234567", telegram: "rustam_valiyev", chatId: "6810291" } },
  { key: "fotima", fullName: "Fotima Valiyeva", code: "ST-8621", gender: "f", groups: ["GR-15"], goal: "Ingliz tilida erkin muloqot", parent: { key: "rustam", fullName: "Rustam Valiyev", relation: "Ota" } },
  { key: "bekzod", fullName: "Bekzod Karimov", code: "ST-8411", gender: "m", groups: ["GR-03"], coins: 1180, parent: { key: "jahongir", fullName: "Jahongir Karimov", relation: "Ota", phone: "+998977401122", telegram: false } },
  { key: "malikay", fullName: "Malika Yusupova", code: "ST-8433", gender: "f", groups: ["GR-03", "GR-20"], coins: 1410, parent: { key: "p_yusupova", fullName: "Dilfuza Yusupova", relation: "Ona" } },
  { key: "doniyor", fullName: "Doniyor Qodirov", code: "ST-8447", gender: "m", groups: ["GR-03", "GR-20"], coins: 1350, parent: { key: "p_qodirov", fullName: "Baxtiyor Qodirov", relation: "Ota" } },
  { key: "nilufar", fullName: "Nilufar Saidova", code: "ST-8456", gender: "f", groups: ["GR-03", "GR-20"], coins: 1290, parent: { key: "p_saidova", fullName: "Muhayyo Saidova", relation: "Ona" } },
  { key: "temur", fullName: "Temur Xolmatov", code: "ST-8468", gender: "m", groups: ["GR-03"], coins: 1120, parent: { key: "p_xolmatov", fullName: "Anvar Xolmatov", relation: "Ota" } },
  { key: "sevara", fullName: "Sevara Nurmatova", code: "ST-8479", gender: "f", groups: ["GR-03"], coins: 980, parent: { key: "p_nurmatova", fullName: "Gulchehra Nurmatova", relation: "Ona" } },
  { key: "madina_r", fullName: "Madina Rahimova", code: "ST-8495", gender: "f", groups: ["GR-11"], parent: { key: "gulnoza", fullName: "Gulnoza Rahimova", relation: "Ona", phone: "+998935128899", telegram: "gulnoza_rahimova" } },
  { key: "madina_rh", fullName: "Madina Rahmatova", code: "ST-9214", gender: "f", groups: ["GR-18", "GR-20"], goal: "IELTS 7.5+", parent: { key: "p_rahmatov", fullName: "Shuhrat Rahmatov", relation: "Ota" } },
  { key: "shahnoza", fullName: "Shahnoza Ismoilova", code: "ST-9034", gender: "f", groups: ["GR-18", "GR-09"], goal: "IELTS 8.0", parent: { key: "p_ismoilova", fullName: "Mavluda Ismoilova", relation: "Ona" } },
  { key: "diyorbek", fullName: "Diyorbek Joʻrayev", code: "ST-7190", gender: "m", groups: ["GR-12", "GR-09"], parent: { key: "p_jorayev", fullName: "Otabek Joʻrayev", relation: "Ota" } },
  { key: "jasur_t", fullName: "Jasur Temirov", code: "ST-7195", gender: "m", groups: ["GR-12", "GR-09"], parent: { key: "dilshod", fullName: "Dilshod Temirov", relation: "Ota", telegram: "dilshod_temirov" } },
  { key: "jasur_u", fullName: "Jasur Umidov", code: "ST-8204", gender: "m", groups: [], status: "ACADEMIC_LEAVE", leftGroup: "GR-15", parent: { key: "dilnoza", fullName: "Dilnoza Umidova", relation: "Ona", phone: "+998913334455", telegram: false } },
  { key: "kamila", fullName: "Kamila Toirova", code: "ST-8119", gender: "f", groups: ["GR-12", "GR-09", "GR-20"], parent: { key: "farhod", fullName: "Farhod Toirov", relation: "Ota", phone: "+998909987766", telegram: "farhod_toirov" } },
  { key: "shaxboz", fullName: "Shaxboz Ergashev", code: "ST-7992", gender: "m", groups: ["GR-16"], parent: { key: "lola", fullName: "Lola Ergasheva", relation: "Ona", phone: "+998946543210", telegram: "lola_ergasheva" } },
  { key: "sardor", fullName: "Sardor Aliyev", code: "ST-8501", gender: "m", groups: ["GR-05"], turnstile: false, parent: { key: "sherzod", fullName: "Sherzod Aliyev", relation: "Ota", telegram: "sherzod_aliyev" } },
  { key: "otabek_n", fullName: "Otabek Nazarov", code: "ST-8502", gender: "m", groups: ["GR-05"], turnstile: false, parent: { key: "p_nazarov", fullName: "Olim Nazarov", relation: "Ota" } },
  { key: "zarina", fullName: "Zarina Yusupova", code: "ST-8503", gender: "f", groups: ["GR-05"], turnstile: false, parent: { key: "p_yusupov2", fullName: "Rahim Yusupov", relation: "Ota" } },
  { key: "asadbek", fullName: "Asadbek Tursunov", code: "ST-8504", gender: "m", groups: ["GR-05"], turnstile: false, parent: { key: "p_tursunova", fullName: "Nargiza Tursunova", relation: "Ona" } },
];

// Kirish testi natijalari (admin "Oʻquvchilarni guruhga qoʻshish" oynasi)
export const ENTRY_TESTS: Record<string, number> = { "ST-8501": 72, "ST-8502": 68, "ST-8503": 80, "ST-8504": 76 };
