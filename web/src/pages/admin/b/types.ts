// admin-b sahifalari uchun API turlari (api/src/routes/admin/{students,parents,payments,reports,audit}.ts bilan mos).
import type { ISODate, Paginated, Role } from "@/lib/types";

export type StudentStatus = "ACTIVE" | "ACADEMIC_LEAVE" | "GRADUATED" | "LEFT";
export type EnrollmentStatus = "ACTIVE" | "WAITING" | "LEFT";
export type PaymentStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
export type PaymentMethod = "CASH" | "CARD" | "CLICK" | "PAYME" | "TRANSFER";
export type Relation = "Ota" | "Ona" | "Vasiy";

// ─────────── Oʻquvchilar ───────────

export interface StudentRow {
  id: string;
  fullName: string;
  code: string;
  status: StudentStatus;
  phone: string | null;
  isActive: boolean;
  enrolledAt: string | null;
  groups: { id: string; code: string; name: string; level: string | null; enrollmentStatus: EnrollmentStatus }[];
  level: string | null;
  parents: { id: string; fullName: string; phone: string | null; relation: string; telegramLinked: boolean }[];
  telegramLinked: boolean;
  attendance: number | null;
  payment: { status: PaymentStatus; amount: number; dueDate: string | null } | null;
}

export interface StudentStats {
  period: string;
  total: number;
  byStatus: Record<StudentStatus, number>;
  newThisMonth: number;
  telegram: { linked: number; total: number; percent: number | null };
  parents: { total: number; unlinked: number };
  attendanceMonth: number | null;
}

export interface AttendanceSummary {
  attended: number;
  total: number;
  percent: number | null;
  byStatus: Record<"PRESENT" | "LATE" | "EXCUSED" | "ABSENT", number>;
}

export interface MiniAudit {
  id: string;
  at: ISODate;
  action: string;
  summary: string | null;
  actorRole: Role | null;
  actor: { fullName: string } | null;
}

export interface StudentDetail {
  id: string;
  fullName: string;
  login: string;
  phone: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: ISODate | null;
  createdAt: ISODate;
  code: string;
  status: StudentStatus;
  birthDate: string | null;
  goal: string | null;
  turnstileId: string | null;
  enrolledAt: string | null;
  leftAt: string | null;
  level: string | null;
  groups: {
    id: string;
    code: string;
    name: string;
    level: string | null;
    teacher: { id: string; fullName: string } | null;
    room: { id: string; name: string; location: string | null } | null;
    days: number[];
    startTime: string;
    endTime: string;
    monthlyFee: number;
    groupStatus: "ENROLLING" | "ACTIVE" | "FINISHED";
    enrollmentStatus: EnrollmentStatus;
    joinedAt: string | null;
    leftAt: string | null;
  }[];
  parents: {
    id: string;
    fullName: string;
    phone: string | null;
    login: string;
    relation: string;
    isActive: boolean;
    lastLoginAt: ISODate | null;
    telegram: { linked: boolean; username: string | null; linkedAt: ISODate | null };
  }[];
  attendance: { total: AttendanceSummary; month: AttendanceSummary; period: string };
  grades: {
    average: number | null;
    label: string | null;
    count: number;
    recent: { id: string; value: number; kind: string; title: string | null; gradedAt: ISODate; group: string }[];
  };
  homework: { done: number; total: number; percent: number | null };
  coins: { balance: number; streakDays: number };
  payment: { period: string; status: PaymentStatus | null };
  payments: {
    id: string;
    period: string;
    amount: number;
    status: PaymentStatus;
    dueDate: string | null;
    paidAt: ISODate | null;
    method: PaymentMethod | null;
    receiptNo: string | null;
    group: { id: string; name: string } | null;
  }[];
  nextLesson: {
    id: string;
    title: string | null;
    startsAt: ISODate;
    endsAt: ISODate;
    group: { name: string };
    room: { name: string } | null;
  } | null;
  audit: MiniAudit[];
}

export interface Credential {
  role: "STUDENT" | "PARENT";
  userId: string;
  fullName: string;
  login: string;
  password: string | null;
  existing: boolean;
  relation?: string;
}

export interface CreateStudentResult {
  student: { id: string; code: string; fullName: string };
  credentials: Credential[];
  enrollment: { groupId: string; status: EnrollmentStatus; group: { name: string } } | null;
}

export interface ResetResult {
  userId: string;
  fullName: string;
  login: string;
  password: string;
}

// ─────────── Lookups (admin-a) ───────────

export interface Lookups {
  levels: { id: string; code: string; name: string }[];
  rooms: { id: string; name: string; location: string | null; capacity: number }[];
  teachers: { id: string; fullName: string }[];
  groups: { id: string; code: string; name: string; status: "ENROLLING" | "ACTIVE" | "FINISHED"; teacherId: string | null }[];
}

// ─────────── Ota-onalar ───────────

export interface ParentRow {
  id: string;
  fullName: string;
  phone: string | null;
  login: string;
  title: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: ISODate | null;
  createdAt: ISODate;
  telegram: { linked: boolean; username: string | null; linkedAt: ISODate | null };
  children: {
    id: string;
    fullName: string;
    code: string;
    status: StudentStatus;
    relation: string;
    groups: { id: string; name: string }[];
  }[];
}

export interface ParentDetail extends ParentRow {
  notifications: { id: string; type: string; title: string; status: string; createdAt: ISODate; readAt: ISODate | null }[];
  notificationStats: Partial<Record<"PENDING" | "SENT" | "FAILED" | "SKIPPED", number>>;
  audit: MiniAudit[];
}

export interface ParentStats {
  total: number;
  telegram: { linked: number; unlinked: number; percent: number | null };
  inactive: number;
  neverLoggedIn: number;
  mustChangePassword: number;
}

export interface ParentLookup {
  phone: string;
  exists: boolean;
  parent: ParentRow | null;
  conflictRole: Role | null;
}

// ─────────── Toʻlovlar ───────────

/** Hisobni yopgan tushum ulushi (bitta tushum bir hisobga bir necha marta taqsimlangan boʻlishi mumkin). */
export interface ChargeReceipt {
  transactionId: string;
  receiptNo: string;
  amount: number;
  paidAt: ISODate;
  method: PaymentMethod;
}

/** Oylik hisob (Payment). PAID ⇔ toʻliq yopilgan; qisman — PENDING/OVERDUE va paidAmount > 0. */
export interface PaymentRow {
  id: string;
  student: { id: string; fullName: string; code: string; status: StudentStatus | null };
  group: { id: string; code: string; name: string; room: string | null; teacher: string | null } | null;
  period: string;
  amount: number;
  paidAmount: number;
  outstanding: number;
  status: PaymentStatus;
  rawStatus: PaymentStatus;
  dueDate: string | null;
  daysOverdue: number;
  paidAt: ISODate | null;
  method: PaymentMethod | null;
  receiptNo: string | null;
  receipts: ChargeReceipt[];
  note: string | null;
  createdAt: ISODate;
}

export interface PaymentTotals {
  plan: number;
  collected: number;
  /** qisman toʻlangan hisoblar soni */
  partial: number;
  /** kutilayotgan hisoblarning TOʻLANMAGAN qismi */
  pending: number;
  overdue: number;
  cancelled: number;
  collectedPercent: number | null;
  avgAmount: number | null;
  count: number;
  counts: Record<"ALL" | PaymentStatus, number>;
  students: Record<"PAID" | "PENDING" | "OVERDUE", number>;
}

export type PaymentList = Paginated<PaymentRow> & { totals: PaymentTotals };

export interface PaymentPeriods {
  current: string;
  latest: string;
  items: { period: string; label: string; count: number }[];
}

/** Tushumning qaysi oyga qancha taqsimlangani. */
export interface TxAllocation {
  paymentId: string;
  period: string;
  periodLabel: string;
  amount: number;
  group: { id: string; name: string } | null;
}

export interface TxReversed {
  at: ISODate;
  by: string | null;
  reason: string | null;
}

/** Kvitansiya: tushum (transactionId) yoki eski hisob (transactionId: null) boʻyicha. */
export interface Receipt {
  id: string;
  transactionId: string | null;
  receiptNo: string;
  status: PaymentStatus;
  paidAt: ISODate;
  method: PaymentMethod | null;
  methodLabel: string | null;
  amount: number;
  amountLabel: string;
  period: string | null;
  periodLabel: string;
  note: string | null;
  student: { id: string; fullName: string; code: string };
  group: { name: string; code: string } | null;
  allocations: TxAllocation[];
  advance: number;
  reversed: TxReversed | null;
  payers: string[];
  cashier: string | null;
  center: { name: string; branch: string | null; address: string | null; phone: string | null };
}

/** Kassaga kelgan pul (PaymentTransaction). */
export interface PaymentTx {
  id: string;
  student: { id: string; fullName: string; code: string };
  amount: number;
  method: PaymentMethod;
  paidAt: ISODate;
  receiptNo: string;
  note: string | null;
  createdAt: ISODate;
  createdBy: string | null;
  reversed: TxReversed | null;
  allocations: TxAllocation[];
  /** taqsimlanmagan qism (avans) */
  advance: number;
}

export interface TxList extends Paginated<PaymentTx> {
  totals: { amount: number; count: number; methods: { method: PaymentMethod; label: string; amount: number; count: number }[] };
}

export interface StudentBalance {
  outstanding: number;
  overdue: number;
  advance: number;
  /** avans − qarzdorlik (manfiy — qarz) */
  balance: number;
  openCount: number;
}

export interface BillingStudent {
  student: { id: string; fullName: string; code: string; status: StudentStatus | null; phone: string | null };
  groups: { id: string; name: string; monthlyFee: number; waiting: boolean }[];
  monthlyFee: number | null;
  parents: { fullName: string; phone: string | null; relation: string; telegramLinked: boolean }[];
}

export type BalanceState = "overdue" | "partial" | "debt" | "advance" | "clear" | "none";
export type BalanceFilter = "all" | "debtors" | "overdue" | "partial" | "advance" | "clear" | "none";

export interface BalanceRow extends BillingStudent {
  charged: number;
  paid: number;
  outstanding: number;
  overdue: number;
  advance: number;
  balance: number;
  openCount: number;
  partialCount: number;
  oldestDue: string | null;
  lastPaidAt: ISODate | null;
  state: BalanceState;
}

export interface BalanceList extends Paginated<BalanceRow> {
  counts: Record<BalanceFilter, number>;
  totals: { outstanding: number; overdue: number; advance: number; debtors: number };
}

export interface Ledger extends BillingStudent {
  balance: StudentBalance;
  suggestedAmount: number;
  charges: PaymentRow[];
  transactions: PaymentTx[];
}

export interface ReceiveResult {
  transaction: PaymentTx;
  balance: StudentBalance;
}

export interface GenerateResult {
  period: string;
  dueDate: string;
  created: number;
  skippedExisting: number;
  skippedInactive: number;
  /** boshlanmagan guruhlarning kutish roʻyxatidagilar — ularga hisob yozilmaydi */
  waiting: number;
  totalAmount: number;
  coveredByAdvance: number;
}

// ─────────── Hisobotlar ───────────

export interface Report {
  period: string;
  periodLabel: string;
  range: { from: string; to: string };
  revenue: PaymentTotals & { series: { period: string; label: string; collected: number; plan: number; percent: number | null }[] };
  methods: { method: PaymentMethod; label: string; amount: number; count: number }[];
  overdue: {
    id: string;
    student: { id: string; fullName: string; code: string; status: StudentStatus | null };
    group: { id: string; name: string } | null;
    /** qolgan (toʻlanmagan) qarz */
    amount: number;
    paidAmount: number;
    status: PaymentStatus;
    dueDate: string | null;
    daysOverdue: number;
    parents: { fullName: string; phone: string | null; relation: string; telegramLinked: boolean }[];
  }[];
  students: {
    start: number;
    end: number;
    new: number;
    left: number;
    graduated: number;
    net: number;
    retention: number | null;
    churn: number | null;
    leftList: { id: string; fullName: string; code: string; date: string | null; note: string | null }[];
  };
  attendance: {
    average: number | null;
    groups: { groupId: string; code: string; name: string; teacher: string | null; attended: number; total: number; late: number; absent: number; percent: number | null }[];
  };
  teachers: {
    items: { id: string; fullName: string; title: string | null; groups: number; students: number; weeklyHours: number; lessonsDone: number; loadPercent: number; loadLabel: string }[];
    normHours: number;
    totalGroups: number;
    avgGroups: number | null;
    avgStudents: number | null;
    unassignedGroups: { id: string; code: string; name: string }[];
  };
  telegram: {
    students: { linked: number; total: number; percent: number | null };
    parents: { linked: number; total: number; percent: number | null };
    unlinkedParents: { id: string; fullName: string; phone: string | null; children: { id: string; fullName: string }[] }[];
  };
  homework: {
    average: number | null;
    groups: { groupId: string; code: string; name: string; homework: number; expected: number; done: number; onTime: number; percent: number | null }[];
  };
}

// ─────────── Audit ───────────

export interface AuditChange {
  path: string;
  before: unknown;
  after: unknown;
  kind: "added" | "removed" | "changed";
}

export interface AuditRow {
  id: string;
  at: ISODate;
  actor: { id: string; fullName: string; role: Role; title: string | null } | null;
  actorRole: Role | null;
  action: string;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  entitySub: string | null;
  summary: string | null;
  ip: string | null;
  userAgent: string | null;
  hash: string;
  prevHash: string | null;
  hasDiff: boolean;
  preview: AuditChange[];
}

export interface AuditPage {
  items: AuditRow[];
  nextCursor: string | null;
  total: number;
}

export interface AuditDetail extends AuditRow {
  before: unknown;
  after: unknown;
  changes: AuditChange[];
  integrity: { hashValid: boolean; linkValid: boolean };
  prevId: string | null;
  nextId: string | null;
}

export interface AuditStats {
  total: number;
  today: number;
  yesterday: number;
  changePercent: number | null;
  securityAlertsToday: number;
  last: { id: string; at: ISODate; hash: string } | null;
  firstAt: ISODate | null;
}

export interface AuditVerify {
  ok: boolean;
  brokenAt: string | null;
  checked: number;
  lastId: string | null;
  lastHash: string | null;
  checkedAt: ISODate;
  tookMs: number;
}

export interface AuditFacets {
  actions: { action: string; count: number }[];
  entityTypes: { entityType: string; count: number }[];
  actors: { id: string; fullName: string; role: Role; count: number }[];
}
