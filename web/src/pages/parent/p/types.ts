// /api/parent/* javob turlari (api/src/routes/parent/*.ts bilan bir xil). Sanalar ISO satr.
import type { ISODate } from "@/lib/types";

export type AttendanceStatus = "PRESENT" | "LATE" | "EXCUSED" | "ABSENT";
export type DayState = AttendanceStatus | "PLANNED" | "IN_PROGRESS" | "UNMARKED" | "CANCELLED";
export type LessonStatus = "PLANNED" | "IN_PROGRESS" | "DONE" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
export type PaymentMethod = "CASH" | "CARD" | "CLICK" | "PAYME" | "TRANSFER";
export type HomeworkType = "TEXT" | "AUDIO" | "FILE" | "QUIZ";
export type HwState = "open" | "submitted" | "reviewed" | "returned" | "missed";
export type SubmissionStatus = "DRAFT" | "SUBMITTED" | "REVIEWED" | "RETURNED";
export type MaterialType = "PDF" | "AUDIO" | "VIDEO" | "DOC" | "IMAGE" | "LINK";

export interface FileInfo {
  id: string;
  originalName: string;
  mime: string;
  size: number;
}

export interface TeacherCard {
  id: string;
  fullName: string;
  title: string | null;
  avatarUrl: string | null;
  specialization: string | null;
  responseTime: string | null;
  experienceYears: number | null;
}

export interface Branch {
  id?: string;
  name: string;
  address: string | null;
  phone: string | null;
}

export interface ChildGroup {
  id: string;
  code: string;
  name: string;
  status: "ENROLLING" | "ACTIVE" | "FINISHED";
  days: number[];
  startTime: string;
  endTime: string;
  startDate: ISODate;
  endDate: ISODate | null;
  totalLessons: number;
  monthlyFee: number;
  level: { id: string; code: string; name: string; order: number; label: string | null } | null;
  room: { id: string; name: string; location: string | null } | null;
  branch: Branch | null;
  teacher: TeacherCard | null;
}

export interface ChildInfo {
  id: string;
  fullName: string;
  code: string;
  status: "ACTIVE" | "ACADEMIC_LEAVE" | "GRADUATED" | "LEFT";
  goal: string | null;
  turnstileId: string | null;
  enrolledAt: ISODate | null;
  birthDate: ISODate | null;
  relation: string;
  group: ChildGroup | null;
  groups: (ChildGroup & { enrollmentStatus: "ACTIVE" | "WAITING" | "LEFT"; joinedAt: ISODate; leftAt: ISODate | null })[];
}

export interface AttStats {
  planned: number;
  held: number;
  upcoming: number;
  attended: number;
  present: number;
  late: number;
  excused: number;
  absent: number;
  missed: number;
  marked: number;
  percent: number | null;
}

export interface DistItem {
  value: number;
  count: number;
  percent: number;
}

export interface AttendanceMark {
  status: AttendanceStatus;
  arrivedAt: ISODate | null;
  source: string;
  note?: string | null;
}

export interface LessonBrief {
  id: string;
  number: number | null;
  title: string | null;
  startsAt: ISODate;
  endsAt: ISODate;
  status: LessonStatus;
  homeworkNote: string | null;
  topics: { unit: number; title: string }[];
  group: { id: string; name: string; level: { code: string; name: string } | null };
  room: { name: string; location: string | null } | null;
  teacher: TeacherCard | null;
  attendance: AttendanceMark | null;
}

export type TodayState =
  | "NO_LESSON"
  | "CANCELLED"
  | "NOT_YET"
  | "ARRIVED"
  | "IN_LESSON"
  | "ATTENDED"
  | "NOT_ARRIVED"
  | "EXCUSED"
  | "ABSENT"
  | "UNMARKED";

export interface GradeItem {
  id: string;
  value: number;
  kind: string;
  kindLabel: string;
  skill: string | null;
  title: string | null;
  comment: string | null;
  gradedAt: ISODate;
  teacher: string;
  group?: string;
  lesson: { id: string; title: string | null; startsAt: ISODate } | null;
}

export type ActivityItem =
  | {
      id: string;
      type: "grade";
      at: ISODate;
      value: number;
      kind: string;
      kindLabel: string;
      title: string | null;
      comment: string | null;
      teacher: string;
      lessonId: string | null;
      lessonTitle: string | null;
    }
  | {
      id: string;
      type: "attendance";
      at: ISODate;
      status: AttendanceStatus;
      arrivedAt: ISODate | null;
      source: string;
      lessonId: string;
      lessonTitle: string | null;
      lessonStartsAt: ISODate;
      room: string | null;
    }
  | { id: string; type: "homework"; at: ISODate; status: SubmissionStatus; isLate: boolean; homeworkId: string; title: string }
  | {
      id: string;
      type: "material";
      at: ISODate;
      title: string;
      materialType: MaterialType;
      lessonId: string | null;
      url: string | null;
      file: FileInfo | null;
    };

export interface ExamBrief {
  id: string;
  title: string;
  type: "MOCK" | "MIDTERM" | "FINAL" | "QUIZ";
  startsAt: ISODate;
  durationMin: number;
  location: string | null;
  description?: string | null;
  group?: { name: string } | null;
}

export interface PaymentRow {
  id: string;
  period: string;
  amount: number;
  status: PaymentStatus;
  dueDate: ISODate;
  paidAt?: ISODate | null;
  method?: PaymentMethod | null;
  receiptNo?: string | null;
  note?: string | null;
  createdAt?: ISODate;
  group: { id?: string; code?: string; name: string } | null;
}

export interface DashboardData {
  now: ISODate;
  child: ChildInfo;
  today: { state: TodayState; lesson: LessonBrief | null; attendance: AttendanceMark | null };
  nextLesson: LessonBrief | null;
  metrics: {
    attendance: { total: AttStats; month: AttStats };
    grades: { average: number | null; label: string | null; count: number; distribution: DistItem[] };
    homework: { total: number; done: number; onTime: number; open: number; missed: number; percent: number | null };
    level: { label: string; lessonsDone: number; totalLessons: number; progress: number } | null;
    coins: {
      balance: number;
      streakDays: number;
      last7Days: number;
      prev7Days: number;
      title: string;
      next: { name: string; remaining: number } | null;
    };
    skills: { skill: string; average: number | null; count: number }[];
  };
  recentGrades: GradeItem[];
  latestSummary: { lessonId: string; title: string | null; startsAt: ISODate; summary: string; teacher: TeacherCard | null } | null;
  openHomework: {
    id: string;
    title: string;
    type: HomeworkType;
    dueAt: ISODate;
    lessonId: string | null;
    coinReward: number;
    groupName: string;
    submissionStatus: SubmissionStatus | null;
  }[];
  upcomingExam: ExamBrief | null;
  payment: { current: PaymentRow; count: number; totalDue: number; hasOverdue: boolean } | null;
  teacher: TeacherCard | null;
  branch: Branch | null;
  telegram: { linked: boolean; username: string | null; linkedAt: ISODate | null; botUsername: string };
  activity: ActivityItem[];
}

export interface CalendarLesson {
  id: string;
  number: number | null;
  title: string | null;
  startsAt: ISODate;
  endsAt: ISODate;
  status: LessonStatus;
  state: DayState;
  hasSummary: boolean;
  topics: { unit: number; title: string }[];
  group: { id: string; code: string; name: string };
  room: { name: string; location: string | null } | null;
  attendance: AttendanceMark | null;
  grades: { value: number; kind: string; title: string | null }[];
  gradeAvg: number | null;
  homework: { id: string; title: string; dueAt: ISODate }[];
  materialsCount: number;
}

export interface LessonsData {
  now: ISODate;
  month: string;
  child: ChildInfo;
  stats: AttStats;
  range: { first: string | null; last: string | null };
  lessons: CalendarLesson[];
}

export interface LessonQuestion {
  id: string;
  threadId: string;
  body: string;
  createdAt: ISODate;
  isQuestion: boolean;
  mine: boolean;
  sender: { id: string; fullName: string; role: string; avatarUrl: string | null };
  files: FileInfo[];
}

export interface LessonDetailData {
  now: ISODate;
  child: { id: string; fullName: string; code: string };
  lesson: {
    id: string;
    number: number | null;
    title: string | null;
    startsAt: ISODate;
    endsAt: ISODate;
    durationMin: number;
    status: LessonStatus;
    state: DayState;
    summary: string | null;
    homeworkNote: string | null;
    topics: {
      id: string;
      unit: number;
      title: string;
      description: string | null;
      objectives: string[];
      vocabulary: string[];
      grammar: string | null;
    }[];
    group: { id: string; code: string; name: string; totalLessons: number; level: { code: string; name: string; label: string | null } | null };
    room: { name: string; location: string | null } | null;
    branch: Branch | null;
    teacher: TeacherCard | null;
  };
  attendance: AttendanceMark | null;
  grades: Omit<GradeItem, "lesson" | "group">[];
  coins: { total: number; items: { id: string; amount: number; reason: string; note: string | null; createdAt: ISODate }[] };
  materials: {
    id: string;
    title: string;
    description: string | null;
    type: MaterialType;
    url: string | null;
    file: FileInfo | null;
    createdAt: ISODate;
  }[];
  homework: {
    id: string;
    title: string;
    description: string | null;
    type: HomeworkType;
    dueAt: ISODate;
    coinReward: number;
    files: FileInfo[];
    state: HwState;
    submission: {
      id: string;
      status: SubmissionStatus;
      submittedAt: ISODate | null;
      isLate: boolean;
      score: number | null;
      feedback: string | null;
      reviewedAt: ISODate | null;
      coinsAwarded: number;
      files: FileInfo[];
    } | null;
  }[];
  questions: { threadId: string | null; items: LessonQuestion[] };
}

export interface GradesData {
  now: ISODate;
  range: { from: ISODate | null; to: ISODate };
  child: ChildInfo;
  threshold: number;
  average: number | null;
  label: string | null;
  growth: number | null;
  count: number;
  distribution: DistItem[];
  skills: { skill: string; average: number | null; count: number; trend: number | null; belowAla: boolean }[];
  bucket: "week" | "month";
  series: { start: ISODate; average: number | null; count: number; best: { title: string | null; value: number; kind: string } | null }[];
  grades: GradeItem[];
  exams: {
    id: string;
    exam: { id: string; title: string; type: ExamBrief["type"]; startsAt: ISODate; location: string | null };
    band: number | null;
    percent: number | null;
    sections: { listening: number | null; reading: number | null; writing: number | null; speaking: number | null };
    comment: string | null;
  }[];
  upcomingExams: ExamBrief[];
  attendance: AttStats;
  homework: { total: number; done: number; onTime: number; percent: number | null };
  level: { label: string; lessonsDone: number; totalLessons: number; progress: number } | null;
  levelMap: {
    id: string;
    code: string;
    name: string;
    order: number;
    state: "DONE" | "CURRENT" | "NEXT" | "PLANNED";
    progress: number;
    finalExamAt: ISODate | null;
  }[];
  teacher: TeacherCard | null;
}

export interface HomeworkItem {
  id: string;
  title: string;
  description: string | null;
  type: HomeworkType;
  dueAt: ISODate;
  createdAt: ISODate;
  coinReward: number;
  group: { id: string; name: string };
  lesson: { id: string; title: string | null; startsAt: ISODate } | null;
  topic: { unit: number; title: string } | null;
  teacher: TeacherCard | null;
  files: FileInfo[];
  state: HwState;
  hasDraft: boolean;
  submission: {
    id: string;
    status: SubmissionStatus;
    submittedAt: ISODate | null;
    isLate: boolean;
    score: number | null;
    feedback: string | null;
    reviewedAt: ISODate | null;
    coinsAwarded: number;
    reviewer: string | null;
    files: FileInfo[];
  } | null;
}

export interface HomeworkData {
  now: ISODate;
  child: { id: string; fullName: string; code: string };
  counts: Record<HwState | "all", number>;
  summary: { total: number; done: number; onTime: number; percent: number | null };
  items: HomeworkItem[];
}

export interface PaymentsData {
  now: ISODate;
  period: string;
  child: { id: string; fullName: string; code: string; group: { name: string; code: string; monthlyFee: number } | null };
  current: PaymentRow | null;
  summary: {
    outstanding: number;
    outstandingCount: number;
    hasOverdue: boolean;
    nextDue: PaymentRow | null;
    paidThisYear: number;
    paidCount: number;
    monthlyFee: number | null;
  };
  items: PaymentRow[];
  branch: Branch | null;
}
