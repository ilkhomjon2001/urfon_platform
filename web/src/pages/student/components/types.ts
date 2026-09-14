// /api/student/* javob turlari (api/src/routes/student/*.ts bilan bir xil). Sanalar ISO satr.
import type { FileMeta, ISODate } from "@/lib/types";

export type HwType = "TEXT" | "AUDIO" | "FILE" | "QUIZ";
export type HwState = "NEW" | "DRAFT" | "SUBMITTED" | "REVIEWED" | "RETURNED";
export type LessonStatus = "PLANNED" | "IN_PROGRESS" | "DONE" | "CANCELLED";
export type AttendanceStatus = "PRESENT" | "LATE" | "EXCUSED" | "ABSENT";
export type MaterialType = "PDF" | "AUDIO" | "VIDEO" | "DOC" | "IMAGE" | "LINK";

export interface RoomRef {
  name: string;
  location: string | null;
}
export interface TeacherRef {
  id: string;
  fullName: string;
  title?: string | null;
  avatarUrl?: string | null;
  specialization?: string | null;
  responseTime?: string | null;
}
export interface CoinTitle {
  current: string;
  next: { name: string; remaining: number } | null;
}

// ─────────────────────────── Dashboard ───────────────────────────

export interface DashLesson {
  id: string;
  title: string;
  startsAt: ISODate;
  endsAt: ISODate;
  status: LessonStatus;
  room: RoomRef | null;
  group: { id: string; name: string; code: string };
  teacher: { id: string; fullName: string } | null;
  topics: (string | null)[];
}

export interface DashMaterial {
  id: string;
  title: string;
  type: MaterialType;
  url: string | null;
  description: string | null;
  createdAt: ISODate;
  file: FileMeta | null;
  topic: string | null;
}

export interface DashOpenHomework {
  id: string;
  title: string;
  description: string | null;
  type: HwType;
  typeLabel: string;
  dueAt: ISODate;
  overdue: boolean;
  group: { id: string; name: string };
  topic: { unit: number; label: string | null } | null;
  coinReward: number;
  state: HwState;
  stateLabel: string;
  progress: {
    fileCount: number;
    audioCount: number;
    imageCount: number;
    hasText: boolean;
    answered: number;
    questionCount: number;
    draftUpdatedAt: ISODate | null;
  };
}

export interface DashGrade {
  id: string;
  value: number;
  label: string | null;
  kind: string;
  kindLabel: string;
  skill: string | null;
  title: string | null;
  gradedAt: ISODate;
  lessonId: string | null;
}

export interface ExamRef {
  id: string;
  title: string;
  type: "MOCK" | "MIDTERM" | "FINAL" | "QUIZ";
  startsAt: ISODate;
  durationMin: number;
  location: string | null;
  group: { name: string } | null;
}

export interface StudentDashboard {
  now: ISODate;
  student: {
    fullName: string;
    firstName: string;
    code: string | null;
    coinBalance: number;
    title: CoinTitle;
    streakDays: number;
    streakActiveToday: boolean;
  };
  level: {
    group: { id: string; name: string; code: string };
    code: string | null;
    name: string;
    shortName: string | null;
    levelName: string | null;
    progress: number;
    doneLessons: number;
    totalLessons: number;
    prev: { name: string | null; shortName: string } | null;
    next: { name: string | null; shortName: string; levelName: string } | null;
    finalExam: { id: string; title: string; startsAt: ISODate } | null;
  } | null;
  teacher: TeacherRef | null;
  todayLessons: DashLesson[];
  upcomingLessons: DashLesson[];
  lastLesson:
    | (DashLesson & {
        attendance: { status: AttendanceStatus; label: string; arrivedAt: ISODate | null } | null;
        grade: { value: number | null; label: string | null } | null;
        coins: number;
      })
    | null;
  openHomework: DashOpenHomework[];
  stats: {
    attendance: { attended: number; total: number; percent: number | null; missed: number; excused: number; late: number };
    homework: { done: number; total: number; pending: number };
  };
  growth: {
    thisWeek: number;
    lastWeek: number;
    diff: number;
    weekStart: ISODate;
    lastWeekStart: ISODate;
    streakDays: number;
    streakBonus: number;
    homeworkReward: number;
    grades: { current: number | null; previous: number | null };
  };
  grades: {
    average: number | null;
    averageLabel: string | null;
    count: number;
    recent: DashGrade[];
    series: { value: number; gradedAt: ISODate }[];
  };
  upcomingExam: ExamRef | null;
  materials: { total: number; latest: DashMaterial[] };
}

// ─────────────────────────── Darslar ───────────────────────────

export interface TopicRef {
  id: string;
  unit: number;
  label: string | null;
}

export interface LessonBase {
  id: string;
  number: number | null;
  title: string;
  startsAt: ISODate;
  endsAt: ISODate;
  status: LessonStatus;
  isToday: boolean;
  isNow: boolean;
  room: RoomRef | null;
  group: { id: string; name: string; code: string };
  teacher: { id: string; fullName: string; title: string | null } | null;
  topics: TopicRef[];
}

export interface LessonMaterial {
  id: string;
  title: string;
  type: MaterialType;
  url: string | null;
  description: string | null;
  file: FileMeta | null;
}

export interface LessonDetail extends LessonBase {
  summary: string | null;
  homeworkNote: string | null;
  attendance: { status: AttendanceStatus; label: string; arrivedAt: ISODate | null; note: string | null } | null;
  grades: { id: string; kind: string; kindLabel: string; skill: string | null; value: number; label: string | null; title: string | null; comment: string | null }[];
  coins: number;
  materials: LessonMaterial[];
  homework: { id: string; title: string; type: HwType; dueAt: ISODate; state: HwState; stateLabel: string; score: number | null }[];
}

export interface UpcomingLessons {
  range: "upcoming";
  from: ISODate;
  to: ISODate;
  now: ISODate;
  items: (LessonBase & { homeworkNote: string | null })[];
  next: LessonBase | null;
  exams: ExamRef[];
  schedule: {
    group: { id: string; name: string; code: string; status: string };
    enrollment: "ACTIVE" | "WAITING" | "LEFT";
    days: number[];
    startTime: string;
    endTime: string;
    room: RoomRef | null;
    teacher: { id: string; fullName: string } | null;
    startDate: ISODate;
  }[];
}

export interface PastLessons {
  range: "past";
  now: ISODate;
  items: LessonDetail[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  stats: { attended: number; marked: number; percent: number | null; excused: number; absent: number; late: number };
}

// ─────────────────────────── Vazifalar ───────────────────────────

export interface HomeworkListItem {
  id: string;
  title: string;
  description: string | null;
  type: HwType;
  typeLabel: string;
  dueAt: ISODate;
  createdAt: ISODate;
  group: { id: string; name: string };
  topic: { id: string; unit: number; label: string | null } | null;
  lesson: { id: string; title: string | null; startsAt: ISODate } | null;
  coinReward: number;
  state: HwState;
  stateLabel: string;
  open: boolean;
  overdue: boolean;
  submission: {
    id: string;
    status: HwState;
    submittedAt: ISODate | null;
    isLate: boolean;
    reviewedAt: ISODate | null;
    score: number | null;
    scoreLabel: string | null;
    feedback: string | null;
    coinsAwarded: number;
    fileCount: number;
    hasText: boolean;
    updatedAt: ISODate;
  } | null;
}

export interface HomeworkList {
  items: HomeworkListItem[];
  counts: { open: number; done: number; all: number };
  coinReward: number;
  now: ISODate;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[] | null;
  correct?: unknown;
}

export interface Submission {
  id: string;
  status: HwState;
  text: string | null;
  answers: Record<string, string | number> | null;
  files: FileMeta[];
  submittedAt: ISODate | null;
  isLate: boolean;
  reviewedAt: ISODate | null;
  reviewer: { id: string; fullName: string } | null;
  score: number | null;
  scoreLabel: string | null;
  feedback: string | null;
  coinsAwarded: number;
  updatedAt: ISODate;
}

export interface HomeworkDetail {
  id: string;
  title: string;
  description: string | null;
  type: HwType;
  typeLabel: string;
  dueAt: ISODate;
  createdAt: ISODate;
  now: ISODate;
  group: { id: string; name: string };
  topic: TopicRef | null;
  lesson: { id: string; title: string | null; startsAt: ISODate } | null;
  teacher: TeacherRef | null;
  content: {
    steps: { title: string | null; text: string }[];
    vocabulary: string[];
    tip: string | null;
    criteria: { label: string; points: number | null }[];
    questions: QuizQuestion[];
    timeLimitMin?: number | null;
  };
  requirements: { needsFile: boolean; needsAudio: boolean; needsText: boolean; needsAnswers: boolean; questionCount: number; maxFiles: number };
  attachments: FileMeta[];
  lessonMaterials: LessonMaterial[];
  reward: { onTime: number; streak: number };
  state: HwState;
  stateLabel: string;
  overdue: boolean;
  canEdit: boolean;
  submission: Submission | null;
  previous: {
    homework: { id: string; title: string; topic: string | null };
    score: number | null;
    scoreLabel: string | null;
    feedback: string | null;
    reviewedAt: ISODate | null;
  } | null;
  streak: { days: number; activeToday: boolean; bonus: number };
}

export interface DraftResponse {
  submission: Submission;
  state: HwState;
  stateLabel: string;
}

export interface SubmitResponse extends DraftResponse {
  expectedCoins: number;
  streakDays: number;
  coinBalance: number;
}

// ─────────────────────────── Materiallar ───────────────────────────

export interface MaterialItem {
  id: string;
  title: string;
  description: string | null;
  type: MaterialType;
  url: string | null;
  createdAt: ISODate;
  file: FileMeta | null;
  source: "group" | "library";
  group: { id: string; name: string } | null;
  topic: TopicRef | null;
  lesson: { id: string; title: string | null; startsAt: ISODate } | null;
  uploadedBy: string;
}

export interface MaterialsResponse {
  total: number;
  scopeTotal: number;
  counts: Partial<Record<MaterialType, number>>;
  topics: { id: string; unit: number; label: string; level: string | null; count: number }[];
  sections: { topic: { id: string; unit: number; label: string; level: string | null } | null; items: MaterialItem[] }[];
}

// ─────────────────────────── Yutuqlar ───────────────────────────

export interface CoinTx {
  id: string;
  amount: number;
  reason: string;
  reasonLabel: string;
  title: string;
  detail: string | null;
  link: string | null;
  ref: { type: string; id: string | null } | null;
  createdAt: ISODate;
}

export interface Achievements {
  now: ISODate;
  balance: number;
  title: {
    current: string;
    currentMin: number;
    next: { name: string; remaining: number; target: number } | null;
    progress: number;
    all: { name: string; min: number; reached: boolean }[];
  };
  streak: { days: number; activeToday: boolean; bonus: number };
  growth: {
    thisWeek: number;
    lastWeek: number;
    diff: number;
    thisMonth: number;
    lastMonth: number;
    weeks: { start: ISODate; end: ISODate; coins: number; current: boolean }[];
    thisWeekByReason: { reason: string; label: string; amount: number }[];
  };
  rules: { key: string; title: string; description: string; amount: number | null; min: number | null; max: number | null; hint: string }[];
  milestones: { key: string; title: string; achieved: boolean; progress: { current: number; target: number } | null; hint: string; date?: ISODate | null }[];
  transactions: { items: CoinTx[]; total: number };
  groups: {
    group: { id: string; name: string };
    period: string;
    weekStart: ISODate;
    members: { name: string; initials: string; coins: number; isMe: boolean }[];
    total: { week: number; allTime: number };
  }[];
}

// ─────────────────────────── Xabarlar (/api/messages) ───────────────────────────

export interface MsgUser {
  id: string;
  fullName: string;
  role: "ADMIN" | "TEACHER" | "PARENT" | "STUDENT";
  title: string | null;
  avatarUrl: string | null;
}

export interface ThreadRow {
  id: string;
  kind: "DIRECT" | "GROUP";
  subject: string | null;
  title: string;
  participants: MsgUser[];
  group: { id: string; name: string } | null;
  student: { id: string; fullName: string } | null;
  lastMessage: { body: string; createdAt: ISODate; senderId: string } | null;
  lastMessageAt: ISODate;
  unread: number;
}

export interface MessageRow {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: ISODate;
  sender: MsgUser;
  files: FileMeta[];
  lesson?: { id: string; title: string | null; startsAt: ISODate } | null;
}

export interface StudentContacts {
  teachers: (MsgUser & { teachingGroups: { id: string; name: string }[] })[];
}
