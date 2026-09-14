// teacher-b API turlari: /api/teacher/{homework,submissions,exams,materials,announcements} va /api/messages.
import type { FileMeta, ISODate, Paginated, Role } from "@/lib/types";

export interface GroupRef {
  id: string;
  code: string;
  name: string;
}

// ---------------------------------------------------------------- uyga vazifa

export type HwType = "TEXT" | "AUDIO" | "FILE" | "QUIZ";

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  /** To'g'ri variant indeksi */
  answer: number;
}

export interface HwStats {
  students: number;
  submitted: number;
  awaiting: number;
  reviewed: number;
  returned: number;
  late: number;
  missing: number;
  drafts: number;
  avgScore: number | null;
}

export interface Homework {
  id: string;
  title: string;
  description: string | null;
  type: HwType;
  dueAt: ISODate;
  createdAt: ISODate;
  coinReward: number;
  group: GroupRef;
  lesson: { id: string; title: string | null; number: number | null; startsAt: ISODate } | null;
  topic: { id: string; unit: number; title: string } | null;
  files: FileMeta[];
  questionsCount: number | null;
  isOpen: boolean;
  stats: HwStats;
  content?: { questions?: QuizQuestion[] } | null;
}

export interface RosterRow {
  student: { id: string; fullName: string; code: string | null };
  submission: {
    id: string;
    status: SubStatus;
    submittedAt: ISODate | null;
    isLate: boolean;
    score: number | null;
    coinsAwarded: number;
  } | null;
  hasDraft: boolean;
}

export interface HomeworkDetail extends Homework {
  roster: RosterRow[];
}

export interface HwStatsSummary {
  activeHomework: number;
  activeGroups: number;
  groups: number;
  awaiting: number;
  awaitingByType: Record<HwType, number>;
  onTimeRate: number | null;
  onTimeRatePrev: number | null;
  avgScore: number | null;
  reviewedTotal: number;
  avgReviewHours: number | null;
  reviewedToday: number;
  todayTarget: number;
  reviewedByDay: { date: string; count: number }[];
  coinsOnTime: number;
}

export interface HwFormOptions {
  lessons: { id: string; title: string | null; number: number | null; startsAt: ISODate; topicId: string | null }[];
  topics: { id: string; unit: number; title: string }[];
}

// ---------------------------------------------------------------- topshiriqlar

export type SubStatus = "DRAFT" | "SUBMITTED" | "REVIEWED" | "RETURNED";

export interface QuizScore {
  total: number;
  correct: number;
  percent: number;
  suggested: number;
  items?: { id: string; text: string; options: string[]; answer: number; given: number | null; correct: boolean }[];
}

export interface Submission {
  id: string;
  status: SubStatus;
  text: string | null;
  wordCount: number;
  submittedAt: ISODate | null;
  isLate: boolean;
  score: number | null;
  feedback: string | null;
  coinsAwarded: number;
  reviewedAt: ISODate | null;
  coinsOnReview: number;
  student: { id: string; fullName: string; code: string | null };
  homework: { id: string; title: string; type: HwType; dueAt: ISODate; group: GroupRef };
  files: FileMeta[];
  quiz: QuizScore | null;
}

export interface SubmissionDetail extends Submission {
  answers?: unknown;
  homework: Submission["homework"] & { description: string | null; files: FileMeta[] };
  reviewer: { id: string; fullName: string } | null;
  studentStats: { homeworkAvg: number | null; homeworkGraded: number };
  coinsAwardedNow?: number;
}

export interface SubmissionList extends Paginated<Submission> {
  counts: { SUBMITTED: number; REVIEWED: number; RETURNED: number };
}

// ---------------------------------------------------------------- guruhlar (e'lon oynasi, filtrlar)

export interface TeacherGroup extends GroupRef {
  status: "ENROLLING" | "ACTIVE" | "FINISHED";
  days: number[];
  startTime: string;
  endTime: string;
  level: { id: string; code: string; name: string } | null;
  room: { id: string; name: string; location: string | null } | null;
  activeStudents: number;
  parents: number;
  parentsTelegram: number;
  threadId: string | null;
  announcements: number;
  lastAnnouncementAt: ISODate | null;
}

export interface Announcement {
  id: string;
  threadId: string;
  body: string;
  createdAt: ISODate;
  sender: { id: string; fullName: string };
  files: FileMeta[];
  group: GroupRef;
  recipients: number;
  readCount: number;
}

// ---------------------------------------------------------------- imtihonlar

export type ExamType = "MOCK" | "MIDTERM" | "FINAL" | "QUIZ";

export interface Exam {
  id: string;
  title: string;
  type: ExamType;
  startsAt: ISODate;
  endsAt: ISODate;
  durationMin: number;
  location: string | null;
  description: string | null;
  group: GroupRef | null;
  isCenter: boolean;
  canEdit: boolean;
  status: "upcoming" | "ongoing" | "past";
  resultsCount: number;
  candidates: number;
  avgBand: number | null;
  avgPercent: number | null;
}

export interface ExamResultValues {
  band: number | null;
  percent: number | null;
  listening: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
  comment: string | null;
}

export interface ExamDetail extends Exam {
  rows: {
    student: { id: string; fullName: string; code: string | null };
    group: GroupRef;
    active: boolean;
    result: (ExamResultValues & { updatedAt: ISODate }) | null;
  }[];
}

// ---------------------------------------------------------------- materiallar

export type MaterialType = "PDF" | "AUDIO" | "VIDEO" | "DOC" | "IMAGE" | "LINK";

export interface LevelRef {
  id: string;
  code: string;
  name: string;
}

export interface Material {
  id: string;
  title: string;
  description: string | null;
  type: MaterialType;
  url: string | null;
  file: FileMeta | null;
  level: LevelRef | null;
  topic: { id: string; unit: number; title: string } | null;
  group: GroupRef | null;
  lesson: { id: string; title: string | null; number: number | null; startsAt: ISODate } | null;
  uploadedBy: { id: string; fullName: string };
  downloads: number;
  createdAt: ISODate;
  scope: "library" | "group";
  mine: boolean;
}

export interface MaterialList extends Paginated<Material> {
  types: Partial<Record<MaterialType, number>>;
}

export interface MaterialStats {
  total: number;
  library: number;
  inGroups: number;
  groupsWithMaterials: number;
  groups: number;
  mine: number;
  totalDownloads: number;
  totalSize: number;
  byType: { type: MaterialType; count: number; size: number }[];
  byLevel: { level: LevelRef; count: number; size: number }[];
  top: { id: string; title: string; downloads: number } | null;
  recent: Material[];
}

export interface MaterialOptions {
  levels: LevelRef[];
  topics: { id: string; unit: number; title: string; levelId: string }[];
  groups: (GroupRef & { levelId: string | null })[];
}

// ---------------------------------------------------------------- xabarlar (/api/messages)

export interface MsgUser {
  id: string;
  fullName: string;
  role: Role;
  title: string | null;
  avatarUrl: string | null;
}

export interface ThreadItem {
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

export interface ThreadMessage {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  isQuestion: boolean;
  createdAt: ISODate;
  sender: MsgUser;
  files: FileMeta[];
  lesson: { id: string; title: string | null; startsAt: ISODate } | null;
}

export interface TeacherContacts {
  parents: (MsgUser & { about: { studentId: string; studentName: string; relation: string }; group: { id: string; name: string } | null })[];
  students: (MsgUser & { group: { id: string; name: string } | null })[];
  admins: MsgUser[];
}
