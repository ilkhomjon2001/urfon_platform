// Admin: ustozlar — ro'yxat (yuklama, davomat, tekshiruvlar), tafsilot, akkaunt yaratish/tahrirlash,
// bloklash/qayta faollashtirish, parol tiklash, bo'sh vaqt bo'yicha tanlash.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { writeAudit } from "../../lib/audit.js";
import { normalizeLogin } from "../../lib/auth.js";
import { startOfMonthTz, toDbDate } from "../../lib/dates.js";
import { badRequest, conflict, notFound } from "../../lib/errors.js";
import { auditCtx, idParam, parse, zTime, zYmd } from "../../lib/http.js";
import { notify } from "../../lib/notify.js";
import { hashPassword, tempPassword } from "../../lib/password.js";
import { BUSY_STATUSES, levelLabel, pct, round1, scheduleText, slotsOverlap, toMin, weeklyHoursOf } from "./a/schedule.js";
import { zDaysCsv } from "./lookups.js";

const zId = z.string().min(1).max(40);
const zPhoneLoose = z
  .string()
  .trim()
  .min(9, "Telefon raqamini kiriting")
  .max(30)
  .transform((s) => normalizeLogin(s))
  .refine((s) => /^\+998\d{9}$/.test(s), "Telefon +998 XX XXX-XX-XX koʻrinishida boʻlsin");

const profileFields = {
  fullName: z.string().trim().min(3, "F.I.Sh. kamida 3 belgi").max(80),
  phone: zPhoneLoose,
  title: z.string().trim().max(80).nullable().optional(),
  specialization: z.string().trim().max(80).nullable().optional(),
  certificates: z.array(z.string().trim().min(1).max(60)).max(12).optional(),
  experienceYears: z.number().int().min(0).max(60).nullable().optional(),
  bio: z.string().trim().max(1500).nullable().optional(),
  responseTime: z.string().trim().max(60).nullable().optional(),
};
const createBody = z.object(profileFields);
const updateBody = z.object(profileFields).partial();

const HIGH_LOAD_HOURS = 16; // haftasiga shundan ko'p — "yuklama yuqori"

type TeacherStats = {
  groupsCount: number; weeklyHours: number; studentsCount: number;
  attendancePct: number | null; pendingReviews: number; overdueReviews: number;
};

/** Ustozlar bo'yicha agregatlar (faqat faol/qabul guruhlari hisobga olinadi). */
async function teacherStats(ids: string[], now = new Date()): Promise<Map<string, TeacherStats>> {
  const monthStart = startOfMonthTz(now);
  const overdueBefore = new Date(now.getTime() - 48 * 3600_000);
  const [groups, enr, subs, att] = await Promise.all([
    prisma.group.findMany({
      where: { teacherId: { in: ids }, status: { in: BUSY_STATUSES } },
      select: { teacherId: true, days: true, startTime: true, endTime: true },
    }),
    prisma.groupStudent.findMany({
      where: { status: "ACTIVE", group: { teacherId: { in: ids }, status: { in: BUSY_STATUSES } } },
      select: { studentId: true, group: { select: { teacherId: true } } },
    }),
    prisma.submission.findMany({
      where: { status: "SUBMITTED", homework: { group: { teacherId: { in: ids } } } },
      select: { submittedAt: true, homework: { select: { group: { select: { teacherId: true } } } } },
    }),
    prisma.attendance.findMany({
      where: { lesson: { startsAt: { gte: monthStart, lte: now }, group: { teacherId: { in: ids } } } },
      select: { status: true, lesson: { select: { group: { select: { teacherId: true } } } } },
    }),
  ]);
  const out = new Map<string, TeacherStats>();
  const get = (id: string) => {
    let s = out.get(id);
    if (!s) {
      s = { groupsCount: 0, weeklyHours: 0, studentsCount: 0, attendancePct: null, pendingReviews: 0, overdueReviews: 0 };
      out.set(id, s);
    }
    return s;
  };
  for (const id of ids) get(id);
  for (const g of groups) {
    const s = get(g.teacherId!);
    s.groupsCount++;
    s.weeklyHours += weeklyHoursOf(g);
  }
  const students = new Map<string, Set<string>>();
  for (const e of enr) {
    const t = e.group.teacherId!;
    if (!students.has(t)) students.set(t, new Set());
    students.get(t)!.add(e.studentId);
  }
  for (const [t, set] of students) get(t).studentsCount = set.size;
  for (const sub of subs) {
    const s = get(sub.homework.group.teacherId!);
    s.pendingReviews++;
    if (sub.submittedAt && sub.submittedAt < overdueBefore) s.overdueReviews++;
  }
  const attAgg = new Map<string, { p: number; t: number }>();
  for (const a of att) {
    const t = a.lesson.group.teacherId!;
    const m = attAgg.get(t) ?? { p: 0, t: 0 };
    m.t++;
    if (a.status === "PRESENT" || a.status === "LATE") m.p++;
    attAgg.set(t, m);
  }
  for (const [t, m] of attAgg) get(t).attendancePct = pct(m.p, m.t);
  for (const s of out.values()) s.weeklyHours = round1(s.weeklyHours);
  return out;
}

async function getTeacher(id: string) {
  const t = await prisma.user.findFirst({ where: { id, role: "TEACHER" }, include: { teacherProfile: true, telegramLink: true } });
  if (!t) throw notFound("Ustoz topilmadi");
  return t;
}

function profileSnapshot(t: {
  fullName: string; login: string; title: string | null;
  teacherProfile: { specialization: string | null; certificates: string[]; experienceYears: number | null; bio: string | null; responseTime: string | null } | null;
}) {
  return {
    fullName: t.fullName,
    phone: t.login,
    title: t.title,
    specialization: t.teacherProfile?.specialization ?? null,
    certificates: t.teacherProfile?.certificates ?? [],
    experienceYears: t.teacherProfile?.experienceYears ?? null,
    bio: t.teacherProfile?.bio ?? null,
    responseTime: t.teacherProfile?.responseTime ?? null,
  };
}

export default async function teachers(app: FastifyInstance) {
  // ─── Ro'yxat ───
  app.get("/teachers", async (req) => {
    const q = parse(
      z.object({ q: z.string().trim().max(100).optional(), status: z.enum(["active", "inactive", "all"]).default("all") }),
      req.query,
    );
    const now = new Date();
    const rows = await prisma.user.findMany({
      where: {
        role: "TEACHER",
        ...(q.status === "active" ? { isActive: true } : q.status === "inactive" ? { isActive: false } : {}),
        ...(q.q
          ? {
              OR: [
                { fullName: { contains: q.q, mode: "insensitive" as const } },
                { login: { contains: q.q.replace(/[\s()-]/g, "") } },
                { teacherProfile: { specialization: { contains: q.q, mode: "insensitive" as const } } },
              ],
            }
          : {}),
      },
      orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
      include: {
        teacherProfile: true,
        telegramLink: { select: { isActive: true } },
        teachingGroups: {
          where: { status: { in: BUSY_STATUSES } },
          orderBy: { code: "asc" },
          select: { id: true, code: true, name: true, status: true, days: true, startTime: true, endTime: true },
        },
      },
    });
    const stats = await teacherStats(rows.map((r) => r.id), now);
    const items = rows.map((t) => {
      const s = stats.get(t.id)!;
      return {
        id: t.id,
        fullName: t.fullName,
        login: t.login,
        phone: t.phone ?? t.login,
        title: t.title,
        avatarUrl: t.avatarUrl,
        isActive: t.isActive,
        mustChangePassword: t.mustChangePassword,
        lastLoginAt: t.lastLoginAt,
        telegramLinked: !!t.telegramLink?.isActive,
        specialization: t.teacherProfile?.specialization ?? null,
        certificates: t.teacherProfile?.certificates ?? [],
        experienceYears: t.teacherProfile?.experienceYears ?? null,
        groups: t.teachingGroups.map((g) => ({ id: g.id, code: g.code, name: g.name, status: g.status, scheduleText: scheduleText(g.days, g.startTime, g.endTime) })),
        ...s,
        highLoad: s.weeklyHours >= HIGH_LOAD_HOURS,
        createdAt: t.createdAt,
      };
    });
    const all = await prisma.user.groupBy({ by: ["isActive"], where: { role: "TEACHER" }, _count: { _all: true } });
    const activeTeachers = all.find((a) => a.isActive)?._count._all ?? 0;
    const busyGroups = await prisma.group.groupBy({ by: ["teacherId"], where: { status: { in: BUSY_STATUSES } }, _count: { _all: true } });
    const assigned = busyGroups.filter((g) => g.teacherId).reduce((s, g) => s + g._count._all, 0);
    const unassigned = busyGroups.find((g) => !g.teacherId)?._count._all ?? 0;
    const activeItems = items.filter((i) => i.isActive);
    return {
      items,
      summary: {
        total: activeTeachers + (all.find((a) => !a.isActive)?._count._all ?? 0),
        active: activeTeachers,
        inactive: all.find((a) => !a.isActive)?._count._all ?? 0,
        avgGroups: activeTeachers ? round1(assigned / activeTeachers) : 0,
        totalWeeklyHours: round1(activeItems.reduce((s, i) => s + i.weeklyHours, 0)),
        pendingReviews: activeItems.reduce((s, i) => s + i.pendingReviews, 0),
        overdueReviews: activeItems.reduce((s, i) => s + i.overdueReviews, 0),
        withoutTelegram: activeItems.filter((i) => !i.telegramLinked).length,
        unassignedGroups: unassigned,
      },
    };
  });

  // ─── Berilgan vaqt uchun ustozlar bandligi (guruhga biriktirish oynasi) ───
  app.get("/teachers/availability", async (req) => {
    const q = parse(
      z.object({ days: zDaysCsv, startTime: zTime, endTime: zTime, startDate: zYmd.optional(), excludeGroupId: zId.optional() }),
      req.query,
    );
    if (toMin(q.endTime) <= toMin(q.startTime)) throw badRequest("Tugash vaqti boshlanishdan keyin boʻlsin");
    const slot = { days: q.days, startTime: q.startTime, endTime: q.endTime, startDate: q.startDate ? toDbDate(q.startDate) : null };
    const rows = await prisma.user.findMany({
      where: { role: "TEACHER", isActive: true },
      orderBy: { fullName: "asc" },
      include: {
        teacherProfile: { select: { specialization: true, certificates: true } },
        teachingGroups: {
          where: { status: { in: BUSY_STATUSES }, ...(q.excludeGroupId ? { id: { not: q.excludeGroupId } } : {}) },
          select: { id: true, code: true, name: true, days: true, startTime: true, endTime: true, startDate: true, endDate: true },
        },
      },
    });
    const stats = await teacherStats(rows.map((r) => r.id));
    const items = rows.map((t) => {
      const conflicts = t.teachingGroups.filter((g) => slotsOverlap(slot, g));
      const s = stats.get(t.id)!;
      const weeklyHours = round1(t.teachingGroups.reduce((sum, g) => sum + weeklyHoursOf(g), 0));
      return {
        id: t.id,
        fullName: t.fullName,
        title: t.title,
        avatarUrl: t.avatarUrl,
        specialization: t.teacherProfile?.specialization ?? null,
        certificates: t.teacherProfile?.certificates ?? [],
        groupsCount: t.teachingGroups.length,
        weeklyHours,
        studentsCount: s.studentsCount,
        highLoad: weeklyHours >= HIGH_LOAD_HOURS,
        busy: conflicts.length > 0,
        conflicts: conflicts.map((g) => ({ id: g.id, code: g.code, name: g.name, scheduleText: scheduleText(g.days, g.startTime, g.endTime) })),
        recommended: false,
      };
    });
    items.sort((a, b) => Number(a.busy) - Number(b.busy) || a.weeklyHours - b.weeklyHours || a.fullName.localeCompare(b.fullName));
    const best = items.find((i) => !i.busy);
    if (best) best.recommended = true;
    return { items, slotText: scheduleText(q.days, q.startTime, q.endTime) };
  });

  // ─── Tafsilot ───
  app.get("/teachers/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const t = await getTeacher(id);
    const now = new Date();
    const [groups, stats, upcoming, activity] = await Promise.all([
      prisma.group.findMany({
        where: { teacherId: id },
        orderBy: [{ status: "asc" }, { code: "asc" }],
        include: {
          level: true,
          room: { select: { id: true, name: true, location: true } },
          _count: { select: { students: { where: { status: "ACTIVE" } } } },
        },
      }),
      teacherStats([id], now),
      prisma.lesson.findMany({
        where: { group: { teacherId: id }, status: { in: ["PLANNED", "IN_PROGRESS"] }, endsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        take: 6,
        select: {
          id: true, number: true, startsAt: true, endsAt: true, status: true,
          group: { select: { id: true, name: true } }, room: { select: { name: true } },
        },
      }),
      prisma.auditLog.findMany({
        where: { OR: [{ actorId: id }, { entityType: "User", entityId: id }] },
        orderBy: { id: "desc" },
        take: 8,
        select: { id: true, at: true, action: true, summary: true, actor: { select: { fullName: true } } },
      }),
    ]);
    const done = await prisma.lesson.groupBy({
      by: ["groupId"],
      where: { groupId: { in: groups.map((g) => g.id) }, status: "DONE" },
      _count: { _all: true },
    });
    const doneMap = new Map(done.map((d) => [d.groupId, d._count._all]));
    const busy = groups.filter((g) => BUSY_STATUSES.includes(g.status));
    const timetable = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
      day,
      items: busy
        .filter((g) => g.days.includes(day))
        .sort((a, b) => toMin(a.startTime) - toMin(b.startTime))
        .map((g) => ({ groupId: g.id, name: g.name, startTime: g.startTime, endTime: g.endTime, room: g.room?.name ?? null })),
    }));
    return {
      id: t.id,
      fullName: t.fullName,
      login: t.login,
      phone: t.phone ?? t.login,
      title: t.title,
      avatarUrl: t.avatarUrl,
      isActive: t.isActive,
      mustChangePassword: t.mustChangePassword,
      lastLoginAt: t.lastLoginAt,
      createdAt: t.createdAt,
      telegramLinked: !!t.telegramLink?.isActive,
      telegramUsername: t.telegramLink?.username ?? null,
      profile: {
        specialization: t.teacherProfile?.specialization ?? null,
        certificates: t.teacherProfile?.certificates ?? [],
        experienceYears: t.teacherProfile?.experienceYears ?? null,
        bio: t.teacherProfile?.bio ?? null,
        responseTime: t.teacherProfile?.responseTime ?? null,
      },
      stats: { ...stats.get(id)!, highLoad: stats.get(id)!.weeklyHours >= HIGH_LOAD_HOURS },
      groups: groups.map((g) => ({
        id: g.id, code: g.code, name: g.name, status: g.status,
        level: levelLabel(g.level),
        room: g.room,
        scheduleText: scheduleText(g.days, g.startTime, g.endTime),
        weeklyHours: round1(weeklyHoursOf(g)),
        studentsCount: g._count.students,
        capacity: g.capacity,
        progress: Math.min(100, Math.round(((doneMap.get(g.id) ?? 0) / Math.max(1, g.totalLessons)) * 100)),
      })),
      timetable,
      upcoming: upcoming.map((l) => ({ ...l, room: l.room?.name ?? null })),
      activity: activity.map((a) => ({ id: a.id.toString(), at: a.at, action: a.action, summary: a.summary, actor: a.actor?.fullName ?? null })),
    };
  });

  // ─── Yangi ustoz akkaunti (vaqtinchalik parol bir marta ko'rsatiladi) ───
  app.post("/teachers", async (req, reply) => {
    const b = parse(createBody, req.body);
    const exists = await prisma.user.findUnique({ where: { login: b.phone }, select: { id: true } });
    if (exists) throw conflict("Bu telefon raqami bilan akkaunt allaqachon mavjud", "LOGIN_TAKEN");
    const password = tempPassword();
    const passwordHash = await hashPassword(password);
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          login: b.phone,
          phone: b.phone,
          passwordHash,
          role: "TEACHER",
          fullName: b.fullName,
          title: b.title?.trim() || "Ustoz",
          mustChangePassword: true,
          teacherProfile: {
            create: {
              specialization: b.specialization ?? null,
              certificates: b.certificates ?? [],
              experienceYears: b.experienceYears ?? null,
              bio: b.bio ?? null,
              responseTime: b.responseTime ?? null,
            },
          },
        },
        include: { teacherProfile: true },
      });
      await writeAudit(tx, {
        ...auditCtx(req), action: "teacher.create", entityType: "User", entityId: u.id,
        summary: `Yangi ustoz akkaunti ochildi: ${u.fullName} (${u.login})`,
        after: profileSnapshot(u),
      });
      return u;
    });
    reply.status(201);
    return { teacher: { id: user.id, fullName: user.fullName, login: user.login }, tempPassword: password };
  });

  // ─── Tahrirlash ───
  app.put("/teachers/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const b = parse(updateBody, req.body);
    const t = await getTeacher(id);
    if (b.phone && b.phone !== t.login) {
      const exists = await prisma.user.findUnique({ where: { login: b.phone }, select: { id: true } });
      if (exists) throw conflict("Bu telefon raqami bilan akkaunt allaqachon mavjud", "LOGIN_TAKEN");
    }
    const before = profileSnapshot(t);
    return prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: {
          ...(b.fullName ? { fullName: b.fullName } : {}),
          ...(b.phone ? { login: b.phone, phone: b.phone } : {}),
          ...(b.title !== undefined ? { title: b.title?.trim() || "Ustoz" } : {}),
          teacherProfile: {
            upsert: {
              create: {
                specialization: b.specialization ?? null,
                certificates: b.certificates ?? [],
                experienceYears: b.experienceYears ?? null,
                bio: b.bio ?? null,
                responseTime: b.responseTime ?? null,
              },
              update: {
                ...(b.specialization !== undefined ? { specialization: b.specialization } : {}),
                ...(b.certificates !== undefined ? { certificates: b.certificates } : {}),
                ...(b.experienceYears !== undefined ? { experienceYears: b.experienceYears } : {}),
                ...(b.bio !== undefined ? { bio: b.bio } : {}),
                ...(b.responseTime !== undefined ? { responseTime: b.responseTime } : {}),
              },
            },
          },
        },
        include: { teacherProfile: true },
      });
      const after = profileSnapshot(u);
      const keys = (Object.keys(after) as (keyof typeof after)[]).filter((k) => JSON.stringify(after[k]) !== JSON.stringify(before[k]));
      if (keys.length) {
        await writeAudit(tx, {
          ...auditCtx(req), action: "teacher.update", entityType: "User", entityId: id,
          summary: `Ustoz maʼlumotlari tahrirlandi: ${u.fullName}${keys.includes("phone") ? " (login oʻzgardi)" : ""}`,
          before: Object.fromEntries(keys.map((k) => [k, before[k]])),
          after: Object.fromEntries(keys.map((k) => [k, after[k]])),
        });
      }
      return { ok: true, id: u.id, changed: keys };
    });
  });

  // ─── Bloklash (faol guruhlari bo'lsa — tasdiq kerak) ───
  app.post("/teachers/:id/deactivate", async (req, reply) => {
    const { id } = parse(idParam, req.params);
    const b = parse(z.object({ force: z.boolean().optional(), reason: z.string().trim().max(300).optional() }), req.body ?? {});
    const t = await getTeacher(id);
    if (!t.isActive) throw badRequest("Ustoz akkaunti allaqachon bloklangan");
    const active = await prisma.group.findMany({
      where: { teacherId: id, status: { in: BUSY_STATUSES } },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true, status: true, days: true, startTime: true, endTime: true },
    });
    if (active.length && !b.force) {
      return reply.status(409).send({
        error: {
          code: "TEACHER_HAS_GROUPS",
          message: `${t.fullName}da ${active.length} ta faol guruh bor: ${active.map((g) => g.name).join(", ")}. Bloklasangiz, bu guruhlar ustozsiz qoladi`,
          groups: active.map((g) => ({ id: g.id, code: g.code, name: g.name, status: g.status, scheduleText: scheduleText(g.days, g.startTime, g.endTime) })),
        },
      });
    }
    await prisma.$transaction(async (tx) => {
      for (const g of active) {
        await tx.group.update({ where: { id: g.id }, data: { teacherId: null } });
        await writeAudit(tx, {
          ...auditCtx(req), action: "group.assign_teacher", entityType: "Group", entityId: g.id,
          summary: `${g.name} guruhidan ustoz ${t.fullName} olib tashlandi (akkaunt bloklandi)`,
          before: { teacher: t.fullName, teacherId: id }, after: { teacher: null, teacherId: null },
        });
      }
      await tx.user.update({ where: { id }, data: { isActive: false } });
      const s = await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      await writeAudit(tx, {
        ...auditCtx(req), action: "user.deactivate", entityType: "User", entityId: id,
        summary: `Ustoz akkaunti bloklandi: ${t.fullName}${active.length ? `; ${active.length} ta guruh ustozsiz qoldi` : ""}${b.reason ? ` — ${b.reason}` : ""}`,
        before: { isActive: true }, after: { isActive: false, revokedSessions: s.count, unassignedGroups: active.map((g) => g.name) },
      });
    });
    return { ok: true, unassignedGroups: active.length };
  });

  app.post("/teachers/:id/activate", async (req) => {
    const { id } = parse(idParam, req.params);
    const t = await getTeacher(id);
    if (t.isActive) throw badRequest("Ustoz akkaunti allaqachon faol");
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { isActive: true } });
      await writeAudit(tx, {
        ...auditCtx(req), action: "user.reactivate", entityType: "User", entityId: id,
        summary: `Ustoz akkaunti qayta faollashtirildi: ${t.fullName}`,
        before: { isActive: false }, after: { isActive: true },
      });
    });
    return { ok: true };
  });

  // ─── Parolni tiklash (yangi vaqtinchalik parol bir marta ko'rsatiladi) ───
  app.post("/teachers/:id/reset-password", async (req) => {
    const { id } = parse(idParam, req.params);
    const t = await getTeacher(id);
    const password = tempPassword();
    const passwordHash = await hashPassword(password);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { passwordHash, mustChangePassword: true } });
      const s = await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      await writeAudit(tx, {
        ...auditCtx(req), action: "user.password_reset", entityType: "User", entityId: id,
        summary: `Ustoz paroli tiklandi: ${t.fullName}`,
        after: { mustChangePassword: true, revokedSessions: s.count },
      });
      await notify(tx, {
        userId: id, type: "account.password_reset", title: "Parolingiz tiklandi",
        body: "Administrator parolingizni tikladi. Yangi vaqtinchalik parol bilan kiring va uni oʻzgartiring", telegram: true,
      });
    });
    return { ok: true, login: t.login, tempPassword: password };
  });
}
