// Backend (platforma/api) bilan umumiy shartnoma turlari. Barcha sanalar ISO satr.

export type ISODate = string;

export type Role = "ADMIN" | "TEACHER" | "PARENT" | "STUDENT";

/** UI ohanglari: Badge, StatCard, ProgressBar va h.k. uchun yagona nomlar. */
export type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "gold" | "navy";

export interface StudentLevel {
  /** "Level 2 · IELTS Foundation" */
  name: string;
  /** 0–100 */
  progress: number;
}

export interface StudentInfo {
  /** "ST-8492" */
  code: string;
  coinBalance: number;
  streakDays: number;
  level: StudentLevel | null;
  group: { id: string; name: string } | null;
}

export interface ChildSummary {
  id: string;
  fullName: string;
  code: string;
  groupName: string | null;
}

export interface User {
  id: string;
  login: string;
  role: Role;
  fullName: string;
  /** "IELTS katta ustozi", "Bosh administrator", "Ota", "Level 2 oʻquvchisi" */
  title: string | null;
  phone: string | null;
  avatarUrl: string | null;
  mustChangePassword: boolean;
  telegramLinked: boolean;
  /** Markaz filiali (headerdagi chip) */
  branch?: { name: string } | null;
  student?: StudentInfo | null;
  children?: ChildSummary[];
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  createdAt: ISODate;
  readAt: ISODate | null;
}
/** Global DOM `Notification` bilan adashmaslik uchun asosiy nom AppNotification. */
export type Notification = AppNotification;

/** GET /api/me/nav-badges → { [navKey]: 12 | "2 kechikkan" } */
export type NavBadges = Partial<Record<string, number | string | null>>;

/** Sahifalangan roʻyxat (api/src/lib/http.ts → paged()). Soʻrov: ?page=1&pageSize=20&q=... */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export interface ApiErrorBody {
  error: { code: string; message: string; issues?: unknown[] };
}

/** Yuklangan fayl metamaʼlumoti. Kontent: GET /api/files/:id (auth bilan). */
export interface FileMeta {
  id: string;
  originalName: string;
  mime: string;
  size: number;
  createdAt?: ISODate;
}

// ─── Darsma-dars reja (Topic.lessonPlan) ───
/** Dars ichidagi bitta bosqich: nomi, necha daqiqa va aniq qadamlar. */
export interface PlanBlock {
  title: string;
  minutes: number;
  points: string[];
}

/** Bitta darsning toʻliq rejasi. Bloklar yigʻindisi 90 daqiqa. */
export interface PlanLesson {
  focus: string;
  sb: string;
  maqsad: string[];
  lugat: string[];
  resurslar: string[];
  blocks: PlanBlock[];
  uyga: string[];
  ustozga: string;
}

/** Dars rejalari oʻqish sahifasi: bosqich va uning unitlari (GET …/curriculum/levels/:id/plan). */
export interface PlanLevel {
  id: string;
  code: string;
  name: string;
  label: string;
  audience: string | null;
  cefr: string | null;
  weeks: number | null;
  description: string | null;
}

export interface PlanUnitDto {
  id: string;
  unit: number;
  title: string;
  description: string | null;
  grammar: string | null;
  vocabulary: string[];
  status: string;
  lessons: PlanLesson[];
}

/** Oʻqish sahifasidagi yosh toifasi: teen = 13–16, kids = 8–12 */
export type PlanTrack = "teen" | "kids";

export interface LevelPlanResponse {
  level: PlanLevel;
  track: PlanTrack;
  /** qaysi yosh toifasi uchun reja bor */
  tracks: Record<PlanTrack, boolean>;
  units: PlanUnitDto[];
  totalLessons: number;
}
