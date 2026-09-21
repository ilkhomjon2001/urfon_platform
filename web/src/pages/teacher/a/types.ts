// teacher-a API javob turlari (api/src/routes/teacher/{dashboard,groups,lessons,schedule}.ts bilan bir xil).
import type { ISODate, PlanLesson } from "@/lib/types";

export type LessonStatus = "PLANNED" | "IN_PROGRESS" | "DONE" | "CANCELLED";
export type AttStatus = "PRESENT" | "LATE" | "EXCUSED" | "ABSENT";
export type GroupStatus = "ENROLLING" | "ACTIVE" | "FINISHED";
export type Skill = "SPEAKING" | "LISTENING" | "READING" | "WRITING" | "GRAMMAR" | "VOCABULARY";
export type GradeKind = "HOMEWORK" | "CLASSWORK" | "TEST" | "SPEAKING" | "WRITING" | "MOCK";
export type HomeworkType = "TEXT" | "AUDIO" | "FILE" | "QUIZ";
export type MaterialType = "PDF" | "AUDIO" | "VIDEO" | "DOC" | "IMAGE" | "LINK";

export interface LevelDto {
  id: string;
  code: string;
  name: string;
  order: number;
  /** "Level 2 · IELTS Foundation" */
  label: string;
}
export interface RoomDto {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  kind: string | null;
}
export interface TopicLite {
  id: string;
  unit: number;
  title: string;
}
export interface ScheduleDto {
  days: number[];
  startTime: string;
  endTime: string;
  /** "Du · Cho · Ju, 14:00–15:30" */
  text: string;
}

// ───────────── Guruhlar ─────────────
export interface GroupCard {
  id: string;
  code: string;
  name: string;
  status: GroupStatus;
  level: LevelDto | null;
  room: RoomDto | null;
  schedule: ScheduleDto;
  weeklyHours: number;
  startDate: ISODate;
  endDate: ISODate | null;
  capacity: number;
  totalLessons: number;
  studentsCount: number;
  waitingCount: number;
  doneLessons: number;
  progressPct: number;
  monthAttendancePct: number | null;
  averageGrade: number | null;
  averageGradeLabel: string | null;
  gradesCount: number;
  pendingReviews: number;
  nextLesson: {
    id: string;
    title: string | null;
    startsAt: ISODate;
    endsAt: ISODate;
    status: LessonStatus;
    room: RoomDto | null;
    topics: TopicLite[];
  } | null;
  lastLesson: { id: string; title: string | null; startsAt: ISODate; topics: TopicLite[] } | null;
  currentUnit: TopicLite | null;
}

export interface GroupsResponse {
  items: GroupCard[];
  summary: {
    groups: number;
    activeGroups: number;
    enrollingGroups: number;
    students: number;
    weeklyHours: number;
    monthAttendancePct: number | null;
    averageGrade: number | null;
    averageGradeLabel: string | null;
    pendingReviews: number;
  };
}

export interface ParentDto {
  id: string;
  fullName: string;
  phone: string | null;
  relation: string;
  telegramLinked: boolean;
}

export interface GroupStudentRow {
  id: string;
  fullName: string;
  initials: string;
  code: string | null;
  studentStatus: string | null;
  enrollmentStatus: "ACTIVE" | "WAITING";
  joinedAt: ISODate;
  attendance: { attended: number; total: number; pct: number | null };
  averageGrade: number | null;
  averageGradeLabel: string | null;
  gradesCount: number;
  homework: { done: number; total: number };
  coinsWeek: number;
  parents: ParentDto[];
  parentTelegramLinked: boolean;
}

export interface GroupLessonRow {
  id: string;
  number: number | null;
  title: string | null;
  startsAt: ISODate;
  endsAt: ISODate;
  status: LessonStatus;
  room: RoomDto | null;
  topics: TopicLite[];
  summary: string | null;
  attendance: { present: number; late: number; excused: number; absent: number; marked: number; attended: number; total: number };
}

export interface SyllabusTopic extends TopicLite {
  description: string | null;
  grammar: string | null;
  lessonsCount: number;
  hours: number;
  status: "PUBLISHED" | "ARCHIVED" | "DRAFT";
  covered: boolean;
  coveredLessons: number;
  plannedLessons: number;
  lastCoveredAt: ISODate | null;
  nextPlannedAt: ISODate | null;
}

export interface ActivityRow {
  studentId: string;
  fullName: string;
  initials: string;
  coins: number;
  attendance: number;
  activity: number;
  homework: number;
  other: number;
}

export interface GroupDetailResponse {
  group: GroupCard;
  students: GroupStudentRow[];
  lessons: GroupLessonRow[];
  syllabus: { level: LevelDto | null; topics: SyllabusTopic[]; coveredCount: number; total: number; nextTopic: TopicLite | null };
  activity: { weekStart: ISODate; items: ActivityRow[]; groupTotal: number; prevWeekTotal: number };
}

export interface GradeDto {
  id: string;
  value: number;
  label: string | null;
  kind: GradeKind;
  skill: Skill | null;
  title: string | null;
  comment: string | null;
  gradedAt: ISODate;
}

export interface StudentProfileResponse {
  student: {
    id: string;
    fullName: string;
    initials: string;
    code: string | null;
    status: string | null;
    goal: string | null;
    enrolledAt: ISODate | null;
    coinBalance: number;
    enrollmentStatus: "ACTIVE" | "WAITING" | "LEFT";
    joinedAt: ISODate;
  };
  parents: ParentDto[];
  stats: {
    attendance: { attended: number; total: number; pct: number | null };
    averageGrade: number | null;
    averageGradeLabel: string | null;
    homework: { done: number; total: number };
  };
  recentGrades: (GradeDto & { lesson: { id: string; title: string | null; startsAt: ISODate } | null })[];
  recentAttendance: {
    lessonId: string;
    title: string | null;
    startsAt: ISODate;
    lessonStatus: LessonStatus;
    status: AttStatus | null;
    arrivedAt: ISODate | null;
    source: string | null;
  }[];
}

// ───────────── Dars ─────────────
export interface LessonStudent {
  id: string;
  fullName: string;
  initials: string;
  code: string | null;
  active: boolean;
  attendance: {
    status: AttStatus;
    arrivedAt: ISODate | null;
    source: string;
    note: string | null;
    markedBy: { id: string; fullName: string } | null;
    updatedAt: ISODate;
  } | null;
  activity: { amount: number; note: string | null } | null;
  coins: number;
  grades: GradeDto[];
}

export interface AvailableTopic extends TopicLite {
  label: string;
  description: string | null;
  grammar: string | null;
  vocabulary: string[];
  lessonsCount: number;
  hours: number;
  coveredLessons: number;
  covered: boolean;
  lastCoveredAt: ISODate | null;
}

export interface LessonHomework {
  id: string;
  title: string;
  description: string | null;
  type: HomeworkType;
  dueAt: ISODate;
  coinReward: number;
  submitted: number;
  createdAt: ISODate;
}

export interface LessonMaterial {
  id: string;
  title: string;
  description: string | null;
  type: MaterialType;
  url: string | null;
  file: { id: string; originalName: string; mime: string; size: number } | null;
  createdAt: ISODate;
}

/** Darsma-dars reja (Mavzular bazasi → unit.lessonPlan) — tuzilishi @/lib/types da */
export type { PlanLesson };

export interface LessonResponse {
  lesson: {
    id: string;
    number: number | null;
    title: string | null;
    startsAt: ISODate;
    endsAt: ISODate;
    status: LessonStatus;
    summary: string | null;
    homeworkNote: string | null;
    room: RoomDto | null;
    isToday: boolean;
    isFuture: boolean;
    isPast: boolean;
    canStart: boolean;
    canFinish: boolean;
    canMark: boolean;
  };
  group: {
    id: string;
    code: string;
    name: string;
    status: GroupStatus;
    level: LevelDto | null;
    /** 13–16 (TEENS) yoki 8–12 (KIDS) — dars rejasi shunga qarab tanlanadi */
    ageGroup: "TEENS" | "KIDS";
    room: RoomDto | null;
    schedule: ScheduleDto;
    totalLessons: number;
  };
  students: LessonStudent[];
  counts: { total: number; present: number; late: number; excused: number; absent: number; unmarked: number };
  topics: (TopicLite & {
    description: string | null;
    grammar: string | null;
    vocabulary: string[];
    objectives: string[];
    lessonsCount: number;
    lessonPlan: PlanLesson[] | null;
    /** bu dars unitning nechanchi darsi (1 dan) */
    part: number;
  })[];
  availableTopics: AvailableTopic[];
  suggestedTopicId: string | null;
  lastTopic: (TopicLite & { lessonId: string; startsAt: ISODate }) | null;
  materials: LessonMaterial[];
  homework: LessonHomework[];
  nav: {
    prev: { id: string; startsAt: ISODate; title: string | null } | null;
    next: { id: string; startsAt: ISODate; title: string | null } | null;
  };
  coinRules: { attendance: number; activity: { min: number; max: number } };
}

// ───────────── Dashboard ─────────────
export interface TodayLesson {
  id: string;
  number: number | null;
  title: string | null;
  startsAt: ISODate;
  endsAt: ISODate;
  start: string;
  end: string;
  status: LessonStatus;
  group: { id: string; code: string; name: string; level: LevelDto | null };
  room: RoomDto | null;
  topics: TopicLite[];
  attended: number;
  marked: number;
  total: number;
  isNext: boolean;
  action: "start" | "continue" | "view";
}

export interface DashboardResponse {
  teacher: { fullName: string; title: string | null; avatarUrl: string | null; specialization: string | null };
  today: { date: string; weekday: number; weekdayName: string };
  stats: {
    groups: number;
    activeGroups: number;
    enrollingGroups: number;
    students: number;
    weeklyHours: number;
    pendingReviews: number;
    monthAttendancePct: number | null;
    todayLessons: number;
    todayDone: number;
  };
  nextLesson: {
    id: string;
    title: string | null;
    startsAt: ISODate;
    start: string;
    status: LessonStatus;
    room: RoomDto | null;
    group: { id: string; code: string; name: string };
  } | null;
  todayLessons: TodayLesson[];
  latestSubmissions: {
    id: string;
    submittedAt: ISODate | null;
    isLate: boolean;
    student: { id: string; fullName: string; initials: string; code: string | null };
    homework: { id: string; title: string; type: HomeworkType; dueAt: ISODate };
    group: { id: string; code: string; name: string };
  }[];
  upcomingExams: {
    id: string;
    title: string;
    type: "MOCK" | "MIDTERM" | "FINAL" | "QUIZ";
    startsAt: ISODate;
    durationMin: number;
    location: string | null;
    group: { id: string; code: string; name: string } | null;
    resultsCount: number;
  }[];
  unreadMessages: number;
  groupProgress: {
    id: string;
    code: string;
    name: string;
    status: GroupStatus;
    level: LevelDto | null;
    doneLessons: number;
    totalLessons: number;
    progressPct: number;
    monthAttendancePct: number | null;
    averageGrade: number | null;
    averageGradeLabel: string | null;
    studentsCount: number;
    pendingReviews: number;
    currentUnit: TopicLite | null;
  }[];
  recentActivity: { id: string; at: ISODate; kind: string; icon: string; text: string; link: string | null }[];
}

// ───────────── Jadval ─────────────
export interface ScheduleLesson {
  id: string;
  number: number | null;
  title: string | null;
  startsAt: ISODate;
  endsAt: ISODate;
  date: string;
  start: string;
  end: string;
  status: LessonStatus;
  group: { id: string; code: string; name: string; level: LevelDto | null };
  room: RoomDto | null;
  topics: TopicLite[];
  attended: number;
  total: number;
}

export interface ScheduleExam {
  id: string;
  title: string;
  type: "MOCK" | "MIDTERM" | "FINAL" | "QUIZ";
  startsAt: ISODate;
  date: string;
  start: string;
  end: string;
  durationMin: number;
  location: string | null;
  group: { id: string; code: string; name: string } | null;
}

export interface ScheduleResponse {
  weekStart: string;
  weekEnd: string;
  prevWeekStart: string;
  nextWeekStart: string;
  today: string;
  isCurrentWeek: boolean;
  days: { date: string; weekday: number; short: string; long: string; isToday: boolean; lessonsCount: number; examsCount: number }[];
  lessons: ScheduleLesson[];
  exams: ScheduleExam[];
  groups: { id: string; code: string; name: string }[];
  stats: { lessons: number; hours: number; groups: number; rooms: RoomDto[]; todayLessons: number; nextLesson: ScheduleLesson | null };
  timeRange: { from: string; to: string };
  workHours: { from: string; to: string };
}

export interface RoomLesson {
  id: string | null;
  own: boolean;
  startsAt: ISODate;
  endsAt: ISODate;
  start: string;
  end: string;
  status: LessonStatus;
  title: string | null;
  group: { code: string; name: string };
  teacher: { fullName: string } | null;
}

export interface RoomsResponse {
  date: string;
  today: string;
  weekday: number;
  rooms: (RoomDto & { branch: { id: string; name: string }; lessons: RoomLesson[]; busyMinutes: number; loadPct: number; hasOwn: boolean })[];
  unassigned: RoomLesson[];
  workHours: { from: string; to: string };
}
