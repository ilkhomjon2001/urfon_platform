// Ota-ona API uchun umumiy yordamchilar (faqat parent/*.ts ichida ishlatiladi).
// Qoida: har bir handler avval loadChild() ni chaqiradi — u assertParentChild() orqali
// "bu farzand shu ota-onaniki" ekanini tekshiradi (aks holda 404).
import type { AttendanceStatus, LessonStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../db.js";
import { assertParentChild } from "../../lib/access.js";
import { notFound } from "../../lib/errors.js";
import { startOfDayTz } from "../../lib/dates.js";

export const zId = z.string().min(1).max(40);
export const childQuery = z.object({ studentId: zId });

export const teacherSel = {
  id: true,
  fullName: true,
  title: true,
  avatarUrl: true,
  teacherProfile: { select: { specialization: true, responseTime: true, experienceYears: true, certificates: true } },
} satisfies Prisma.UserSelect;

type TeacherRow = Prisma.UserGetPayload<{ select: typeof teacherSel }>;

export function teacherDto(t: TeacherRow | null | undefined) {
  if (!t) return null;
  return {
    id: t.id,
    fullName: t.fullName,
    title: t.title,
    avatarUrl: t.avatarUrl,
    specialization: t.teacherProfile?.specialization ?? null,
    responseTime: t.teacherProfile?.responseTime ?? null,
    experienceYears: t.teacherProfile?.experienceYears ?? null,
  };
}

/** "Level 2 · IELTS Foundation" (lib/user-dto.ts bilan bir xil). */
export function levelName(lv: { code: string; name: string } | null | undefined) {
  if (!lv) return null;
  return `${lv.code.startsWith("L") ? `Level ${lv.code.slice(1)} · ` : ""}${lv.name}`;
}

const groupInclude = {
  level: true,
  teacher: { select: teacherSel },
  room: { include: { branch: true } },
} satisfies Prisma.GroupInclude;

type GroupRow = Prisma.GroupGetPayload<{ include: typeof groupInclude }>;

export function groupDto(g: GroupRow) {
  return {
    id: g.id,
    code: g.code,
    name: g.name,
    status: g.status,
    days: g.days,
    startTime: g.startTime,
    endTime: g.endTime,
    startDate: g.startDate,
    endDate: g.endDate,
    totalLessons: g.totalLessons,
    monthlyFee: g.monthlyFee,
    level: g.level ? { id: g.level.id, code: g.level.code, name: g.level.name, order: g.level.order, label: levelName(g.level) } : null,
    room: g.room ? { id: g.room.id, name: g.room.name, location: g.room.location } : null,
    branch: g.room?.branch ? { id: g.room.branch.id, name: g.room.branch.name, address: g.room.branch.address, phone: g.room.branch.phone } : null,
    teacher: teacherDto(g.teacher),
  };
}

/** Farzand guruhdagi a'zolik oynasi: faqat shu oraliqdagi darslar/vazifalar unga tegishli. */
export type Window = { groupId: string; from: Date; to: Date | null };

/**
 * Farzandni tekshiradi va yuklaydi. Boshqa oilaning farzandi → 404.
 * `groups` — barcha a'zoliklar (ACTIVE → WAITING → LEFT tartibida), `primary` — asosiy (joriy) guruh.
 */
export async function loadChild(parentId: string, studentId: string) {
  const link = await assertParentChild(parentId, studentId);
  const s = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      studentProfile: true,
      enrollments: { include: { group: { include: groupInclude } }, orderBy: { joinedAt: "desc" } },
    },
  });
  if (!s || s.role !== "STUDENT") throw notFound("Farzand topilmadi");

  const rank = { ACTIVE: 0, WAITING: 1, LEFT: 2 } as const;
  const enrollments = [...s.enrollments].sort((a, b) => rank[a.status] - rank[b.status]);
  const primary = enrollments[0] ?? null;
  const windows: Window[] = enrollments.map((e) => ({
    groupId: e.groupId,
    from: startOfDayTz(e.joinedAt),
    // chiqqan kuni endi guruh a'zosi emas (leftAt — eksklyuziv chegara)
    to: e.leftAt ? startOfDayTz(e.leftAt) : null,
  }));

  const profile = s.studentProfile;
  return {
    id: s.id,
    relation: link.relation,
    windows,
    groupIds: enrollments.map((e) => e.groupId),
    activeGroupIds: enrollments.filter((e) => e.status !== "LEFT").map((e) => e.groupId),
    primaryGroup: primary?.group ?? null,
    info: {
      id: s.id,
      fullName: s.fullName,
      code: profile?.code ?? "",
      status: profile?.status ?? "ACTIVE",
      goal: profile?.goal ?? null,
      turnstileId: profile?.turnstileId ?? null,
      enrolledAt: profile?.enrolledAt ?? null,
      birthDate: profile?.birthDate ?? null,
      relation: link.relation,
      group: primary ? groupDto(primary.group) : null,
      groups: enrollments.map((e) => ({ ...groupDto(e.group), enrollmentStatus: e.status, joinedAt: e.joinedAt, leftAt: e.leftAt })),
    },
    coins: { balance: profile?.coinBalance ?? 0, streakDays: profile?.streakDays ?? 0 },
  };
}

export type Child = Awaited<ReturnType<typeof loadChild>>;

const NONE = "__none__";

/** Farzandga tegishli darslar filtri (a'zolik oynasi bo'yicha). */
export function childLessonWhere(child: Child, extra: Prisma.LessonWhereInput = {}): Prisma.LessonWhereInput {
  if (!child.windows.length) return { id: NONE };
  return {
    AND: [
      { OR: child.windows.map((w) => ({ groupId: w.groupId, startsAt: { gte: w.from, ...(w.to ? { lte: w.to } : {}) } })) },
      extra,
    ],
  };
}

/** Farzandga tegishli uyga vazifalar filtri (muddati a'zolik oynasida). */
export function childHomeworkWhere(child: Child, extra: Prisma.HomeworkWhereInput = {}): Prisma.HomeworkWhereInput {
  if (!child.windows.length) return { id: NONE };
  return {
    AND: [
      { OR: child.windows.map((w) => ({ groupId: w.groupId, dueAt: { gte: w.from, ...(w.to ? { lte: w.to } : {}) } })) },
      extra,
    ],
  };
}

/**
 * Farzandga ko'rinadigan imtihonlar: o'z guruhlari + markaz miqyosidagi (groupId = null) Mock imtihonlar.
 * Markaz Mock imtihonlari IELTS yo'nalishi uchun — Kids guruhidagi bolaga ko'rsatilmaydi.
 */
export function childExamWhere(child: Child): Prisma.ExamWhereInput {
  const kids = child.primaryGroup?.ageGroup === "KIDS";
  return { OR: [{ groupId: { in: child.activeGroupIds } }, ...(kids ? [] : [{ groupId: null }])] };
}

/** Dars farzandga tegishlimi (guruhi + a'zolik oynasi). Aks holda 404. */
export async function assertChildLesson(child: Child, lessonId: string) {
  const l = await prisma.lesson.findFirst({ where: { id: lessonId, ...childLessonWhere(child) }, select: { id: true } });
  if (!l) throw notFound("Dars topilmadi");
  return l;
}

// ── Davomat holati ──

/** Kalendar/ro'yxat uchun bitta dars holati. */
export type DayState = AttendanceStatus | "PLANNED" | "IN_PROGRESS" | "UNMARKED" | "CANCELLED";

export function dayState(
  l: { startsAt: Date; endsAt: Date; status: LessonStatus },
  a: { status: AttendanceStatus } | null | undefined,
  now: Date,
): DayState {
  if (l.status === "CANCELLED") return "CANCELLED";
  if (a) return a.status;
  if (l.startsAt > now) return "PLANNED";
  if (l.endsAt > now) return "IN_PROGRESS";
  return "UNMARKED";
}

export function attendanceStats(
  rows: { startsAt: Date; endsAt: Date; status: LessonStatus; attendance: { status: AttendanceStatus }[] }[],
  now: Date,
) {
  let planned = 0, held = 0, upcoming = 0, present = 0, late = 0, excused = 0, absent = 0;
  for (const l of rows) {
    if (l.status === "CANCELLED") continue;
    planned++;
    if (l.startsAt > now) {
      upcoming++;
      continue;
    }
    held++;
    const a = l.attendance[0]?.status;
    if (a === "PRESENT") present++;
    else if (a === "LATE") late++;
    else if (a === "EXCUSED") excused++;
    else if (a === "ABSENT") absent++;
  }
  const attended = present + late;
  const marked = attended + excused + absent;
  return {
    planned,
    held,
    upcoming,
    attended,
    present,
    late,
    excused,
    absent,
    missed: excused + absent,
    marked,
    percent: marked ? Math.round((attended / marked) * 100) : null,
  };
}

// ── Baholar ──

export const round1 = (n: number) => Math.round(n * 10) / 10;
export const round2 = (n: number) => Math.round(n * 100) / 100;

export function avg(values: number[]) {
  return values.length ? round2(values.reduce((s, v) => s + v, 0) / values.length) : null;
}

/** 4.5+ Aʼlo, 3.5+ Yaxshi, 2.5+ Qoniqarli, aks holda Qoniqarsiz (KANON §3). */
export function avgLabel(a: number | null) {
  if (a == null) return null;
  if (a >= 4.5) return "Aʼlo";
  if (a >= 3.5) return "Yaxshi";
  if (a >= 2.5) return "Qoniqarli";
  return "Qoniqarsiz";
}

/** Baholar taqsimoti: 5/4/3/2 (yaxlitlangan qiymat bo'yicha) soni va foizi. */
export function distribution(values: number[]) {
  const counts: Record<"5" | "4" | "3" | "2", number> = { "5": 0, "4": 0, "3": 0, "2": 0 };
  for (const v of values) {
    const r = Math.min(5, Math.max(2, Math.round(v)));
    counts[String(r) as "5" | "4" | "3" | "2"]++;
  }
  const total = values.length;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  return (["5", "4", "3", "2"] as const).map((k) => ({ value: Number(k), count: counts[k], percent: pct(counts[k]) }));
}

export const ALA_THRESHOLD = 4.5;

/** Baho turi nomi (UI'da ko'rsatish uchun). */
export const GRADE_KIND_LABEL: Record<string, string> = {
  HOMEWORK: "Uyga vazifa",
  CLASSWORK: "Darsdagi faollik",
  TEST: "Test",
  SPEAKING: "Speaking",
  WRITING: "Writing",
  MOCK: "Mock imtihon",
};

/** Baho qaysi ko'nikmaga tegishli (skill bo'lmasa turidan). */
export function gradeSkill(g: { skill: string | null; kind: string }) {
  if (g.skill) return g.skill;
  if (g.kind === "SPEAKING") return "SPEAKING";
  if (g.kind === "WRITING") return "WRITING";
  return null;
}
