// admin-a sahifalari uchun API javob turlari (api/src/routes/admin/{groups,teachers,curriculum,lookups,dashboard}.ts).
import type { ISODate, Paginated, PlanLesson } from "@/lib/types";

export type GroupStatus = "ENROLLING" | "ACTIVE" | "FINISHED";
export type EnrollmentStatus = "ACTIVE" | "WAITING" | "LEFT";
export type LessonStatus = "PLANNED" | "IN_PROGRESS" | "DONE" | "CANCELLED";
export type TopicStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface LevelRef {
  id: string;
  code: string;
  name: string;
  label: string | null;
}

export interface RoomRef {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  kind: string | null;
}

export interface TeacherRef {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  title: string | null;
  isActive: boolean;
  specialization: string | null;
}

export interface GroupRow {
  id: string;
  code: string;
  name: string;
  status: GroupStatus;
  level: LevelRef | null;
  teacher: TeacherRef | null;
  room: RoomRef | null;
  days: number[];
  startTime: string;
  endTime: string;
  scheduleText: string;
  weeklyHours: number;
  capacity: number;
  studentsCount: number;
  waitingCount: number;
  leftCount: number;
  monthlyFee: number;
  startDate: ISODate;
  endDate: ISODate | null;
  totalLessons: number;
  progress: { done: number; planned: number; cancelled: number; total: number; percent: number };
  attendancePct: number | null;
  nextLesson: { id: string; number: number | null; startsAt: ISODate; endsAt: ISODate; status: LessonStatus } | null;
  createdAt: ISODate;
}

export interface GroupsSummary {
  total: number;
  all: number;
  active: number;
  enrolling: number;
  finished: number;
  newThisMonth: number;
  studentsCount: number;
  waitingStudents: number;
  capacity: number;
  withoutTeacher: {
    id: string;
    code: string;
    name: string;
    status: GroupStatus;
    startDate: ISODate;
    scheduleText: string;
    nextLessonAt: ISODate | null;
    studentsCount: number;
    waitingCount: number;
  }[];
}

export type GroupsResponse = Paginated<GroupRow> & { summary: GroupsSummary };

export interface GroupStudent {
  id: string;
  fullName: string;
  phone: string | null;
  code: string | null;
  studentStatus: string | null;
  enrollmentStatus: EnrollmentStatus;
  joinedAt: ISODate;
  leftAt: ISODate | null;
  telegramLinked: boolean;
  attendancePct: number | null;
  parents: { id: string; fullName: string; phone: string | null; relation: string; telegramLinked: boolean }[];
}

export interface GroupDetail extends GroupRow {
  attendance: { monthPct: number | null; overallPct: number | null };
  students: GroupStudent[];
  upcoming: { id: string; number: number | null; title: string | null; startsAt: ISODate; endsAt: ISODate; status: LessonStatus; room: string | null }[];
  recent: { id: string; number: number | null; title: string | null; startsAt: ISODate; topics: string[]; present: number; marked: number }[];
  history: AuditItem[];
}

export interface AuditItem {
  id: string;
  at: ISODate;
  action: string;
  summary: string | null;
  actor: string | null;
}

export interface Lookups {
  levels: (LevelRef & { order: number })[];
  rooms: RoomRef[];
  teachers: { id: string; fullName: string; title: string | null; specialization: string | null }[];
  groups: { id: string; code: string; name: string; status: GroupStatus; teacherId: string | null; levelId: string | null; roomId: string | null }[];
}

export interface ConflictRef {
  id: string;
  code: string;
  name: string;
  scheduleText: string;
}

export interface TeacherAvailability {
  id: string;
  fullName: string;
  title: string | null;
  avatarUrl: string | null;
  specialization: string | null;
  certificates: string[];
  groupsCount: number;
  weeklyHours: number;
  studentsCount: number;
  highLoad: boolean;
  busy: boolean;
  conflicts: ConflictRef[];
  recommended: boolean;
}

export interface RoomAvailability extends RoomRef {
  busy: boolean;
  fits: boolean;
  conflicts: ConflictRef[];
}

export interface RoomRow extends RoomRef {
  branch: { id: string; name: string };
  weeklyHours: number;
  groups: { id: string; code: string; name: string; status: GroupStatus; capacity: number; scheduleText: string; teacherName: string | null }[];
}

// ─── Ustozlar ───
export interface TeacherStats {
  groupsCount: number;
  weeklyHours: number;
  studentsCount: number;
  attendancePct: number | null;
  pendingReviews: number;
  overdueReviews: number;
  highLoad: boolean;
}

export interface TeacherRow extends TeacherStats {
  id: string;
  fullName: string;
  login: string;
  phone: string;
  title: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: ISODate | null;
  telegramLinked: boolean;
  specialization: string | null;
  certificates: string[];
  experienceYears: number | null;
  groups: { id: string; code: string; name: string; status: GroupStatus; scheduleText: string }[];
  createdAt: ISODate;
}

export interface TeachersResponse {
  items: TeacherRow[];
  summary: {
    total: number;
    active: number;
    inactive: number;
    avgGroups: number;
    totalWeeklyHours: number;
    pendingReviews: number;
    overdueReviews: number;
    withoutTelegram: number;
    unassignedGroups: number;
  };
}

export interface TeacherDetail {
  id: string;
  fullName: string;
  login: string;
  phone: string;
  title: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: ISODate | null;
  createdAt: ISODate;
  telegramLinked: boolean;
  telegramUsername: string | null;
  profile: {
    specialization: string | null;
    certificates: string[];
    experienceYears: number | null;
    bio: string | null;
    responseTime: string | null;
  };
  stats: TeacherStats;
  groups: {
    id: string;
    code: string;
    name: string;
    status: GroupStatus;
    level: string | null;
    room: { id: string; name: string; location: string | null } | null;
    scheduleText: string;
    weeklyHours: number;
    studentsCount: number;
    capacity: number;
    progress: number;
  }[];
  timetable: { day: number; items: { groupId: string; name: string; startTime: string; endTime: string; room: string | null }[] }[];
  upcoming: { id: string; number: number | null; startsAt: ISODate; endsAt: ISODate; status: LessonStatus; group: { id: string; name: string }; room: string | null }[];
  activity: AuditItem[];
}

// ─── Mavzular bazasi ───
/** Bosqich tavsifi: kimga moʻljallangan, CEFR darajasi, necha hafta va nima oʻrgatadi. */
export interface LevelMeta {
  audience: string | null;
  cefr: string | null;
  weeks: number | null;
  description: string | null;
}

export interface LevelStat extends LevelMeta {
  id: string;
  code: string;
  name: string;
  order: number;
  label: string | null;
  topicsCount: number;
  published: number;
  draft: number;
  archived: number;
  lessons: number;
  hours: number;
  materialsCount: number;
  groups: { id: string; code: string; name: string; status: GroupStatus }[];
  groupsCount: number;
  lastUpdatedAt: ISODate | null;
  lastAuthor: string | null;
}

export interface TopicRow {
  id: string;
  unit: number;
  title: string;
  description: string | null;
  objectives: string[];
  vocabulary: string[];
  grammar: string | null;
  lessonsCount: number;
  hours: number;
  /** darsma-dars reja: [{ focus, sb, steps[], homework }] */
  lessonPlan: PlanLesson[] | null;
  status: TopicStatus;
  available: boolean;
  author: { id: string; fullName: string; title: string | null } | null;
  materialsCount: number;
  materialTypes: string[];
  homeworkCount: number;
  usage: number;
  groupsUsing: { id: string; name: string }[];
  currentGroups: { id: string; name: string }[];
  lastUsedAt: ISODate | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface TopicsResponse {
  level: LevelRef & { order: number } & LevelMeta;
  stats: {
    topics: number;
    published: number;
    draft: number;
    archived: number;
    lessons: number;
    hours: number;
    materials: number;
    materialsCoveragePct: number | null;
    groups: { id: string; code: string; name: string }[];
    lastUpdatedAt: ISODate | null;
    lastAuthor: { fullName: string; title: string | null } | null;
  };
  counts: { all: number; ACTIVE: number; PUBLISHED: number; DRAFT: number; ARCHIVED: number };
  items: TopicRow[];
}

// ─── Bosh sahifa ───
export type AlertSeverity = "high" | "medium" | "low";

export interface DashboardAlert {
  id: string;
  kind: "group_without_teacher" | "overdue_payments" | "low_attendance" | "late_reviews" | "unmarked_lessons" | string;
  severity: AlertSeverity;
  title: string;
  subtitle: string;
  section: string;
  context: string | null;
  dueAt: ISODate | null;
  to: string;
  action: string;
  amount?: number;
  items?: { id: string; label: string; to: string }[];
}

export interface DashboardData {
  now: ISODate;
  period: string;
  monthStart: ISODate;
  kpis: {
    students: {
      active: number; total: number; academicLeave: number; graduated: number; left: number;
      newThisMonth: number; leftThisMonth: number; prevMonthActive: number; changePct: number | null;
    };
    attendance: {
      todayPct: number | null; todayPresent: number; todayMarked: number; todayExpected: number;
      todayExcused: number; todayAbsent: number; monthPct: number | null; monthMarked: number;
    };
    payments: {
      collected: number; collectedCount: number; plan: number; planPct: number | null;
      pending: number; pendingCount: number; overdue: number; overdueCount: number;
    };
    groups: {
      active: number; enrolling: number; finished: number; withoutTeacher: number;
      roomsUsed: number; roomsTotal: number; roomsUsagePct: number | null;
    };
    teachers: { active: number; avgGroups: number };
    telegram: {
      parentsTotal: number; parentsLinked: number; parentsPct: number | null;
      studentsTotal: number; studentsLinked: number; studentsPct: number | null;
    };
  };
  todayLessons: {
    id: string;
    number: number | null;
    title: string | null;
    startsAt: ISODate;
    endsAt: ISODate;
    status: LessonStatus;
    live: boolean;
    overdue: boolean;
    group: { id: string; code: string; name: string };
    teacher: { id: string; fullName: string } | null;
    room: string | null;
    students: number;
    marked: number;
    present: number;
  }[];
  alerts: DashboardAlert[];
  recentAudit: {
    id: string; at: ISODate; action: string; entityType: string; entityId: string | null;
    summary: string | null; actor: string; actorRole: string | null;
  }[];
  charts: {
    revenue: { period: string; label: string; collected: number; pending: number; overdue: number }[];
    attendanceTrend: { weekStart: ISODate; label: string; pct: number | null; marked: number }[];
    studentsGrowth: { period: string; label: string; count: number }[];
    levels: { id: string | null; label: string; students: number; pct: number | null }[];
    levelTotal: number;
  };
}

/** admin-b kontrakti: GET /api/admin/students */
export interface AdminStudentItem {
  id: string;
  fullName: string;
  code: string;
  status: string;
  phone: string | null;
  groups: { id: string; name: string }[];
  parents: { id: string; fullName: string; phone: string | null }[];
}
