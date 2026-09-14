// Admin: guruhlar — ro'yxat, tafsilot, yaratish (dars jadvali generatsiyasi bilan), tahrirlash,
// ustoz/xona biriktirish (to'qnashuv tekshiruvi bilan), yakunlash.
import type { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, type Db, type Tx } from "../../db.js";
import { writeAudit } from "../../lib/audit.js";
import { dbDateYmd, startOfMonthTz, toDbDate } from "../../lib/dates.js";
import { badRequest, conflict, notFound } from "../../lib/errors.js";
import { auditCtx, idParam, paged, pageQuery, parse, zTime, zYmd } from "../../lib/http.js";
import { notify } from "../../lib/notify.js";
import {
  BUSY_STATUSES, conflictText, findConflicts, levelLabel, pct, regenerateFutureLessons, round1, scheduleText, toMin,
  updateFutureLessonsRoom, weeklyHoursOf,
} from "./a/schedule.js";

const zId = z.string().min(1).max(40);
const zDays = z
  .array(z.number().int().min(1).max(7))
  .min(1, "Kamida bitta dars kunini tanlang")
  .max(7)
  .transform((d) => [...new Set(d)].sort((a, b) => a - b));

const fields = {
  name: z.string().trim().min(2, "Guruh nomi kamida 2 belgidan iborat boʻlsin").max(80),
  levelId: zId.nullable().optional(),
  roomId: zId.nullable().optional(),
  days: zDays,
  startTime: zTime,
  endTime: zTime,
  capacity: z.number().int().min(1, "Sigʻim kamida 1").max(100),
  monthlyFee: z.number().int().min(0).max(100_000_000),
  startDate: zYmd,
  totalLessons: z.number().int().min(1, "Darslar soni kamida 1").max(500),
};
const createBody = z.object({
  ...fields,
  teacherId: zId.nullable().optional(),
  status: z.enum(["ENROLLING", "ACTIVE"]).default("ENROLLING"),
});
const updateBody = z.object({ ...fields, status: z.enum(["ENROLLING", "ACTIVE"]) }).partial();

const listQuery = pageQuery.extend({
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  status: z.enum(["ENROLLING", "ACTIVE", "FINISHED"]).optional(),
  levelId: zId.optional(),
  teacherId: zId.optional(), // "none" = ustoz biriktirilmagan
  roomId: zId.optional(),
});

const groupInclude = {
  level: true,
  room: true,
  teacher: {
    select: { id: true, fullName: true, avatarUrl: true, title: true, isActive: true, teacherProfile: { select: { specialization: true } } },
  },
} satisfies Prisma.GroupInclude;
type GroupFull = Prisma.GroupGetPayload<{ include: typeof groupInclude }>;

// @db.Date ustunlar: yozish toDbDate(), o'qish dbDateYmd() (API-KONVENSIYA)
const ymdDate = (ymd: string) => toDbDate(ymd);
const dateYmd = dbDateYmd;
const LOCK_SCHEDULE = 424243; // jadval o'zgarishlari ketma-ket bajarilsin (to'qnashuv tekshiruvi poygasiz)

function assertTimes(start: string, end: string) {
  if (toMin(end) <= toMin(start)) throw badRequest("Dars tugash vaqti boshlanish vaqtidan keyin boʻlsin");
  if (toMin(end) - toMin(start) > 6 * 60) throw badRequest("Dars davomiyligi 6 soatdan oshmasin");
}

async function loadRefs(db: Db, ids: { levelId?: string | null; roomId?: string | null; teacherId?: string | null }) {
  const [level, room, teacher] = await Promise.all([
    ids.levelId ? db.level.findUnique({ where: { id: ids.levelId } }) : null,
    ids.roomId ? db.room.findUnique({ where: { id: ids.roomId } }) : null,
    ids.teacherId ? db.user.findFirst({ where: { id: ids.teacherId, role: "TEACHER" }, select: { id: true, fullName: true, isActive: true } }) : null,
  ]);
  if (ids.levelId && !level) throw notFound("Level topilmadi");
  if (ids.roomId && !room) throw notFound("Xona topilmadi");
  if (ids.teacherId && !teacher) throw notFound("Ustoz topilmadi");
  if (teacher && !teacher.isActive) throw badRequest("Bu ustoz akkaunti faol emas");
  return { level, room, teacher };
}

async function nextCode(tx: Tx) {
  const rows = await tx.group.findMany({ where: { code: { startsWith: "GR-" } }, select: { code: true } });
  const max = rows.reduce((m, r) => {
    const n = Number(r.code.slice(3));
    return Number.isInteger(n) ? Math.max(m, n) : m;
  }, 0);
  return `GR-${String(max + 1).padStart(2, "0")}`;
}

/** Audit uchun o'qiladigan holat. */
function snapshot(g: {
  name: string; days: number[]; startTime: string; endTime: string; capacity: number; monthlyFee: number;
  startDate: Date; totalLessons: number; status: string;
}, names: { level?: string | null; room?: string | null; teacher?: string | null }) {
  return {
    name: g.name,
    level: names.level ?? null,
    room: names.room ?? null,
    teacher: names.teacher ?? null,
    schedule: scheduleText(g.days, g.startTime, g.endTime),
    capacity: g.capacity,
    monthlyFee: g.monthlyFee,
    startDate: dateYmd(g.startDate),
    totalLessons: g.totalLessons,
    status: g.status,
  };
}

function diff<T extends Record<string, unknown>>(before: T, after: T) {
  const keys = Object.keys(after).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
  return {
    keys,
    before: Object.fromEntries(keys.map((k) => [k, before[k]])),
    after: Object.fromEntries(keys.map((k) => [k, after[k]])),
  };
}

/** Guruhlar bo'yicha agregatlar: o'quvchilar, darslar, keyingi dars, oylik davomat. */
async function groupStats(ids: string[], now: Date) {
  const monthStart = startOfMonthTz(now);
  const [enr, les, next, att] = await Promise.all([
    prisma.groupStudent.groupBy({ by: ["groupId", "status"], where: { groupId: { in: ids } }, _count: { _all: true } }),
    prisma.lesson.groupBy({ by: ["groupId", "status"], where: { groupId: { in: ids } }, _count: { _all: true } }),
    prisma.lesson.findMany({
      where: { groupId: { in: ids }, status: { in: ["PLANNED", "IN_PROGRESS"] }, endsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      distinct: ["groupId"],
      select: { id: true, groupId: true, startsAt: true, endsAt: true, number: true, status: true },
    }),
    prisma.attendance.findMany({
      where: { lesson: { groupId: { in: ids }, startsAt: { gte: monthStart, lte: now } } },
      select: { status: true, lesson: { select: { groupId: true } } },
    }),
  ]);
  const enrMap = new Map<string, { ACTIVE: number; WAITING: number; LEFT: number }>();
  for (const r of enr) {
    const m = enrMap.get(r.groupId) ?? { ACTIVE: 0, WAITING: 0, LEFT: 0 };
    m[r.status] = r._count._all;
    enrMap.set(r.groupId, m);
  }
  const lesMap = new Map<string, Record<string, number>>();
  for (const r of les) {
    const m = lesMap.get(r.groupId) ?? {};
    m[r.status] = r._count._all;
    lesMap.set(r.groupId, m);
  }
  const nextMap = new Map(next.map((l) => [l.groupId, l]));
  const attMap = new Map<string, { present: number; total: number }>();
  for (const a of att) {
    const m = attMap.get(a.lesson.groupId) ?? { present: 0, total: 0 };
    m.total++;
    if (a.status === "PRESENT" || a.status === "LATE") m.present++;
    attMap.set(a.lesson.groupId, m);
  }
  return { enrMap, lesMap, nextMap, attMap };
}

function toRow(g: GroupFull, s: Awaited<ReturnType<typeof groupStats>>) {
  const e = s.enrMap.get(g.id) ?? { ACTIVE: 0, WAITING: 0, LEFT: 0 };
  const l = s.lesMap.get(g.id) ?? {};
  const a = s.attMap.get(g.id);
  const done = l.DONE ?? 0;
  const next = s.nextMap.get(g.id);
  return {
    id: g.id,
    code: g.code,
    name: g.name,
    status: g.status,
    level: g.level ? { id: g.level.id, code: g.level.code, name: g.level.name, label: levelLabel(g.level) } : null,
    teacher: g.teacher
      ? {
          id: g.teacher.id, fullName: g.teacher.fullName, avatarUrl: g.teacher.avatarUrl, title: g.teacher.title,
          isActive: g.teacher.isActive, specialization: g.teacher.teacherProfile?.specialization ?? null,
        }
      : null,
    room: g.room ? { id: g.room.id, name: g.room.name, location: g.room.location, capacity: g.room.capacity, kind: g.room.kind } : null,
    days: [...g.days].sort((x, y) => x - y),
    startTime: g.startTime,
    endTime: g.endTime,
    scheduleText: scheduleText(g.days, g.startTime, g.endTime),
    weeklyHours: round1(weeklyHoursOf(g)),
    capacity: g.capacity,
    studentsCount: e.ACTIVE,
    waitingCount: e.WAITING,
    leftCount: e.LEFT,
    monthlyFee: g.monthlyFee,
    startDate: g.startDate,
    endDate: g.endDate,
    totalLessons: g.totalLessons,
    progress: {
      done,
      planned: (l.PLANNED ?? 0) + (l.IN_PROGRESS ?? 0),
      cancelled: l.CANCELLED ?? 0,
      total: g.totalLessons,
      percent: Math.min(100, Math.round((done / Math.max(1, g.totalLessons)) * 100)),
    },
    attendancePct: a ? pct(a.present, a.total) : null,
    nextLesson: next ? { id: next.id, number: next.number, startsAt: next.startsAt, endsAt: next.endsAt, status: next.status } : null,
    createdAt: g.createdAt,
  };
}

const STATUS_ORDER = { ACTIVE: 0, ENROLLING: 1, FINISHED: 2 } as const;

export default async function groups(app: FastifyInstance) {
  // ─── Ro'yxat + umumiy ko'rsatkichlar ───
  app.get("/groups", async (req) => {
    const q = parse(listQuery, req.query);
    const now = new Date();
    const all = await prisma.group.findMany({ include: groupInclude, orderBy: { code: "asc" } });
    const stats = await groupStats(all.map((g) => g.id), now);
    const rows = all.map((g) => toRow(g, stats));

    const open = rows.filter((r) => r.status !== "FINISHED");
    const monthStart = startOfMonthTz(now);
    const summary = {
      total: open.length,
      all: rows.length,
      active: rows.filter((r) => r.status === "ACTIVE").length,
      enrolling: rows.filter((r) => r.status === "ENROLLING").length,
      finished: rows.filter((r) => r.status === "FINISHED").length,
      newThisMonth: rows.filter((r) => r.createdAt >= monthStart).length,
      studentsCount: open.reduce((s, r) => s + r.studentsCount, 0),
      waitingStudents: open.reduce((s, r) => s + r.waitingCount, 0),
      capacity: open.reduce((s, r) => s + r.capacity, 0),
      withoutTeacher: open
        .filter((r) => !r.teacher)
        .map((r) => ({
          id: r.id, code: r.code, name: r.name, status: r.status, startDate: r.startDate, scheduleText: r.scheduleText,
          nextLessonAt: r.nextLesson?.startsAt ?? null, studentsCount: r.studentsCount, waitingCount: r.waitingCount,
        })),
    };

    const needle = q.q?.toLowerCase();
    const items = rows
      .filter((r) => !q.status || r.status === q.status)
      .filter((r) => !q.levelId || r.level?.id === q.levelId)
      .filter((r) => !q.teacherId || (q.teacherId === "none" ? !r.teacher : r.teacher?.id === q.teacherId))
      .filter((r) => !q.roomId || r.room?.id === q.roomId)
      .filter(
        (r) =>
          !needle ||
          r.name.toLowerCase().includes(needle) ||
          r.code.toLowerCase().includes(needle) ||
          (r.room?.name.toLowerCase().includes(needle) ?? false) ||
          (r.teacher?.fullName.toLowerCase().includes(needle) ?? false),
      )
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.code.localeCompare(b.code));
    const start = (q.page - 1) * q.pageSize;
    return { ...paged(items.slice(start, start + q.pageSize), items.length, q), summary };
  });

  // ─── Tafsilot ───
  app.get("/groups/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const g = await prisma.group.findUnique({ where: { id }, include: groupInclude });
    if (!g) throw notFound("Guruh topilmadi");
    const now = new Date();
    const stats = await groupStats([id], now);
    const row = toRow(g, stats);

    const [enrollments, attByStudent, attAll, upcoming, recent, history] = await Promise.all([
      prisma.groupStudent.findMany({
        where: { groupId: id },
        include: {
          student: {
            select: {
              id: true, fullName: true, phone: true,
              studentProfile: { select: { code: true, status: true } },
              telegramLink: { select: { isActive: true } },
              parents: {
                select: {
                  relation: true,
                  parent: { select: { id: true, fullName: true, phone: true, telegramLink: { select: { isActive: true } } } },
                },
              },
            },
          },
        },
      }),
      prisma.attendance.groupBy({ by: ["studentId", "status"], where: { lesson: { groupId: id } }, _count: { _all: true } }),
      prisma.attendance.groupBy({ by: ["status"], where: { lesson: { groupId: id } }, _count: { _all: true } }),
      prisma.lesson.findMany({
        where: { groupId: id, status: { in: ["PLANNED", "IN_PROGRESS"] }, endsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        take: 6,
        select: { id: true, number: true, title: true, startsAt: true, endsAt: true, status: true, room: { select: { name: true } } },
      }),
      prisma.lesson.findMany({
        where: { groupId: id, status: "DONE" },
        orderBy: { startsAt: "desc" },
        take: 5,
        select: {
          id: true, number: true, title: true, startsAt: true,
          topics: { select: { topic: { select: { unit: true, title: true } } } },
          attendance: { select: { status: true } },
        },
      }),
      prisma.auditLog.findMany({
        where: { entityType: "Group", entityId: id },
        orderBy: { id: "desc" },
        take: 10,
        select: { id: true, at: true, action: true, summary: true, actor: { select: { fullName: true } } },
      }),
    ]);

    const perStudent = new Map<string, { present: number; total: number }>();
    for (const r of attByStudent) {
      const m = perStudent.get(r.studentId) ?? { present: 0, total: 0 };
      m.total += r._count._all;
      if (r.status === "PRESENT" || r.status === "LATE") m.present += r._count._all;
      perStudent.set(r.studentId, m);
    }
    const ENR_ORDER = { ACTIVE: 0, WAITING: 1, LEFT: 2 } as const;
    const students = enrollments
      .map((e) => {
        const a = perStudent.get(e.studentId);
        return {
          id: e.student.id,
          fullName: e.student.fullName,
          phone: e.student.phone,
          code: e.student.studentProfile?.code ?? null,
          studentStatus: e.student.studentProfile?.status ?? null,
          enrollmentStatus: e.status,
          joinedAt: e.joinedAt,
          leftAt: e.leftAt,
          telegramLinked: !!e.student.telegramLink?.isActive,
          attendancePct: a ? pct(a.present, a.total) : null,
          parents: e.student.parents.map((p) => ({
            id: p.parent.id, fullName: p.parent.fullName, phone: p.parent.phone, relation: p.relation,
            telegramLinked: !!p.parent.telegramLink?.isActive,
          })),
        };
      })
      .sort((a, b) => ENR_ORDER[a.enrollmentStatus] - ENR_ORDER[b.enrollmentStatus] || a.fullName.localeCompare(b.fullName));

    const totalAtt = attAll.reduce((s, r) => s + r._count._all, 0);
    const presentAtt = attAll.filter((r) => r.status === "PRESENT" || r.status === "LATE").reduce((s, r) => s + r._count._all, 0);

    return {
      ...row,
      attendance: { monthPct: row.attendancePct, overallPct: pct(presentAtt, totalAtt) },
      students,
      upcoming: upcoming.map((l) => ({ ...l, room: l.room?.name ?? null })),
      recent: recent.map((l) => ({
        id: l.id, number: l.number, title: l.title, startsAt: l.startsAt,
        topics: l.topics.map((t) => `Unit ${t.topic.unit} — ${t.topic.title}`),
        present: l.attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length,
        marked: l.attendance.length,
      })),
      history: history.map((h) => ({ id: h.id.toString(), at: h.at, action: h.action, summary: h.summary, actor: h.actor?.fullName ?? null })),
    };
  });

  // ─── Yaratish (dars jadvali bilan) ───
  app.post("/groups", async (req, reply) => {
    const b = parse(createBody, req.body);
    assertTimes(b.startTime, b.endTime);
    const refs = await loadRefs(prisma, b);
    if (refs.room && b.capacity > refs.room.capacity) {
      throw badRequest(`Guruh sigʻimi (${b.capacity}) xona sigʻimidan (${refs.room.capacity} oʻrin) oshmasin`);
    }
    const startDate = ymdDate(b.startDate);
    const slot = { days: b.days, startTime: b.startTime, endTime: b.endTime, startDate, endDate: null };

    const created = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_SCHEDULE})`;
      const dup = await tx.group.findFirst({ where: { name: { equals: b.name, mode: "insensitive" }, status: { in: BUSY_STATUSES } } });
      if (dup) throw conflict(`“${b.name}” nomli faol guruh allaqachon mavjud (${dup.code})`, "DUPLICATE_NAME");
      if (refs.room) {
        const c = await findConflicts(tx, { roomId: refs.room.id }, slot);
        if (c.length) throw conflict(`${refs.room.name} bu vaqtda band: ${conflictText(c)}`, "ROOM_BUSY");
      }
      if (refs.teacher) {
        const c = await findConflicts(tx, { teacherId: refs.teacher.id }, slot);
        if (c.length) throw conflict(`${refs.teacher.fullName} bu vaqtda boshqa guruhda dars oʻtadi: ${conflictText(c)}`, "TEACHER_BUSY");
      }
      const code = await nextCode(tx);
      const g = await tx.group.create({
        data: {
          code, name: b.name, levelId: b.levelId ?? null, roomId: b.roomId ?? null, teacherId: b.teacherId ?? null,
          days: b.days, startTime: b.startTime, endTime: b.endTime, capacity: b.capacity, monthlyFee: b.monthlyFee,
          startDate, totalLessons: b.totalLessons, status: b.status,
        },
      });
      const gen = await regenerateFutureLessons(tx, g);
      const sched = scheduleText(g.days, g.startTime, g.endTime);
      await writeAudit(tx, {
        ...auditCtx(req), action: "group.create", entityType: "Group", entityId: g.id,
        summary: `Yangi guruh ochildi: ${g.name} (${code}), ${sched}; ${gen.created} ta dars rejalashtirildi`,
        after: snapshot(g, { level: levelLabel(refs.level), room: refs.room?.name, teacher: refs.teacher?.fullName }),
      });
      if (refs.room) {
        await writeAudit(tx, {
          ...auditCtx(req), action: "group.assign_room", entityType: "Group", entityId: g.id,
          summary: `${g.name} guruhiga ${refs.room.name} biriktirildi`,
          before: { room: null }, after: { room: refs.room.name, roomId: refs.room.id },
        });
      }
      if (refs.teacher) {
        await writeAudit(tx, {
          ...auditCtx(req), action: "group.assign_teacher", entityType: "Group", entityId: g.id,
          summary: `${g.name} guruhiga ${refs.teacher.fullName} biriktirildi`,
          before: { teacher: null }, after: { teacher: refs.teacher.fullName, teacherId: refs.teacher.id },
        });
        await notify(tx, {
          userId: refs.teacher.id, type: "group.assigned", title: "Sizga yangi guruh biriktirildi",
          body: `Sizga yangi guruh biriktirildi: ${g.name} (${sched})`, link: `/ustoz/guruhlar/${g.id}`,
        });
      }
      return { id: g.id, code, lessonsCreated: gen.created, endDate: gen.endDate };
    });
    reply.status(201);
    return created;
  });

  // ─── Tahrirlash (jadval/xona o'zgarsa — faqat kelajakdagi PLANNED darslar qayta quriladi) ───
  app.put("/groups/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const b = parse(updateBody, req.body);
    const g = await prisma.group.findUnique({ where: { id }, include: groupInclude });
    if (!g) throw notFound("Guruh topilmadi");

    const reopening = g.status === "FINISHED" && b.status !== undefined;
    const next = {
      name: b.name ?? g.name,
      levelId: b.levelId !== undefined ? b.levelId : g.levelId,
      roomId: b.roomId !== undefined ? b.roomId : g.roomId,
      days: b.days ?? [...g.days].sort((x, y) => x - y),
      startTime: b.startTime ?? g.startTime,
      endTime: b.endTime ?? g.endTime,
      capacity: b.capacity ?? g.capacity,
      monthlyFee: b.monthlyFee ?? g.monthlyFee,
      startDate: b.startDate ? ymdDate(b.startDate) : g.startDate,
      totalLessons: b.totalLessons ?? g.totalLessons,
      status: b.status ?? g.status,
    };
    assertTimes(next.startTime, next.endTime);
    const oldDays = [...g.days].sort((x, y) => x - y);
    const sameDays = next.days.length === oldDays.length && next.days.every((d, i) => d === oldDays[i]);
    const scheduleChanged =
      !sameDays || next.startTime !== g.startTime || next.endTime !== g.endTime ||
      next.startDate.getTime() !== g.startDate.getTime() || next.totalLessons !== g.totalLessons || reopening;
    const roomChanged = next.roomId !== g.roomId;
    if (g.status === "FINISHED" && !reopening && (scheduleChanged || roomChanged)) {
      throw badRequest("Yakunlangan guruh jadvalini oʻzgartirib boʻlmaydi. Avval guruhni qayta faollashtiring");
    }

    const refs = await loadRefs(prisma, {
      levelId: b.levelId !== undefined && b.levelId !== g.levelId ? b.levelId : null,
      roomId: roomChanged ? next.roomId : null,
    });
    const level = b.levelId !== undefined && b.levelId !== g.levelId ? refs.level : g.level;
    const room = roomChanged ? refs.room : g.room;
    if ((roomChanged || b.capacity !== undefined) && room && next.capacity > room.capacity) {
      throw badRequest(`Guruh sigʻimi (${next.capacity}) xona sigʻimidan (${room.capacity} oʻrin) oshmasin`);
    }
    const counts = await prisma.groupStudent.groupBy({ by: ["status"], where: { groupId: id }, _count: { _all: true } });
    const activeCount = counts.find((c) => c.status === "ACTIVE")?._count._all ?? 0;
    const waitingCount = counts.find((c) => c.status === "WAITING")?._count._all ?? 0;
    const activating = g.status === "ENROLLING" && next.status === "ACTIVE";
    if (next.capacity < activeCount + (activating ? waitingCount : 0)) {
      throw badRequest(`Sigʻim guruhdagi oʻquvchilar sonidan (${activeCount + (activating ? waitingCount : 0)}) kam boʻlmasin`);
    }
    const slot = { days: next.days, startTime: next.startTime, endTime: next.endTime, startDate: next.startDate, endDate: scheduleChanged ? null : g.endDate };

    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_SCHEDULE})`;
      if (b.name && b.name.toLowerCase() !== g.name.toLowerCase()) {
        const dup = await tx.group.findFirst({
          where: { id: { not: id }, name: { equals: b.name, mode: "insensitive" }, status: { in: BUSY_STATUSES } },
        });
        if (dup) throw conflict(`“${b.name}” nomli faol guruh allaqachon mavjud (${dup.code})`, "DUPLICATE_NAME");
      }
      if ((scheduleChanged || roomChanged) && next.roomId && room) {
        const c = await findConflicts(tx, { roomId: next.roomId }, slot, id);
        if (c.length) throw conflict(`${room.name} bu vaqtda band: ${conflictText(c)}`, "ROOM_BUSY");
      }
      if (scheduleChanged && g.teacherId && g.teacher) {
        const c = await findConflicts(tx, { teacherId: g.teacherId }, slot, id);
        if (c.length) throw conflict(`${g.teacher.fullName} bu vaqtda boshqa guruhda dars oʻtadi: ${conflictText(c)}`, "TEACHER_BUSY");
      }
      let activated = 0;
      if (activating) {
        const r = await tx.groupStudent.updateMany({ where: { groupId: id, status: "WAITING" }, data: { status: "ACTIVE" } });
        activated = r.count;
      }
      const updated = await tx.group.update({ where: { id }, data: next });
      let lessons: Awaited<ReturnType<typeof regenerateFutureLessons>> | null = null;
      let roomLessons = 0;
      if (scheduleChanged) lessons = await regenerateFutureLessons(tx, updated);
      else if (roomChanged) roomLessons = await updateFutureLessonsRoom(tx, id, next.roomId);

      const d = diff(
        snapshot(g, { level: levelLabel(g.level), room: g.room?.name, teacher: g.teacher?.fullName }),
        snapshot(updated, { level: levelLabel(level), room: room?.name, teacher: g.teacher?.fullName }),
      );
      if (d.keys.length) {
        const parts: string[] = [];
        if (d.keys.includes("schedule")) parts.push(`jadval: ${d.after.schedule}`);
        if (d.keys.includes("room")) parts.push(`xona: ${d.after.room ?? "—"}`);
        if (d.keys.includes("status")) parts.push(activating ? `faollashtirildi (${activated} ta oʻquvchi faol)` : `holat: ${d.after.status}`);
        const rest = d.keys.filter((k) => !["schedule", "room", "status"].includes(k));
        if (rest.length) parts.push(`${rest.length} ta maydon`);
        await writeAudit(tx, {
          ...auditCtx(req), action: "group.update", entityType: "Group", entityId: id,
          summary: `${updated.name} tahrirlandi — ${parts.join(", ")}${lessons ? `; kelajakdagi darslar qayta rejalandi (${lessons.rescheduled + lessons.created})` : ""}`,
          before: d.before, after: d.after,
        });
      }
      if (g.teacherId && (d.keys.includes("schedule") || d.keys.includes("room"))) {
        await notify(tx, {
          userId: g.teacherId, type: "group.schedule_changed", title: "Guruh jadvali oʻzgardi",
          body: `${updated.name}: ${scheduleText(updated.days, updated.startTime, updated.endTime)}${room ? `, ${room.name}` : ""}`,
          link: `/ustoz/guruhlar/${id}`,
        });
      }
      return { lessons, roomLessons, activated };
    });
    return { ok: true, ...result };
  });

  // ─── Ustoz biriktirish / olib tashlash ───
  app.put("/groups/:id/teacher", async (req) => {
    const { id } = parse(idParam, req.params);
    const { teacherId } = parse(z.object({ teacherId: zId.nullable() }), req.body);
    const g = await prisma.group.findUnique({ where: { id }, include: { teacher: { select: { id: true, fullName: true } } } });
    if (!g) throw notFound("Guruh topilmadi");
    if (g.teacherId === teacherId) return { ok: true, unchanged: true };
    const { teacher } = await loadRefs(prisma, { teacherId });
    if (teacher && g.status === "FINISHED") throw badRequest("Yakunlangan guruhga ustoz biriktirib boʻlmaydi");
    const sched = scheduleText(g.days, g.startTime, g.endTime);

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_SCHEDULE})`;
      if (teacher) {
        const c = await findConflicts(tx, { teacherId: teacher.id }, g, id);
        if (c.length) throw conflict(`${teacher.fullName} bu vaqtda boshqa guruhda dars oʻtadi: ${conflictText(c)}`, "TEACHER_BUSY");
      }
      await tx.group.update({ where: { id }, data: { teacherId } });
      const summary = teacher
        ? g.teacher
          ? `${g.name}: ustoz almashtirildi — ${g.teacher.fullName} → ${teacher.fullName}`
          : `${g.name} guruhiga ${teacher.fullName} biriktirildi`
        : `${g.name} guruhidan ustoz ${g.teacher?.fullName ?? ""} olib tashlandi`;
      await writeAudit(tx, {
        ...auditCtx(req), action: "group.assign_teacher", entityType: "Group", entityId: id, summary,
        before: { teacher: g.teacher?.fullName ?? null, teacherId: g.teacherId },
        after: { teacher: teacher?.fullName ?? null, teacherId },
      });
      if (teacher) {
        await notify(tx, {
          userId: teacher.id, type: "group.assigned", title: "Sizga yangi guruh biriktirildi",
          body: `Sizga yangi guruh biriktirildi: ${g.name} (${sched})`, link: `/ustoz/guruhlar/${id}`,
        });
      }
      if (g.teacher) {
        await notify(tx, {
          userId: g.teacher.id, type: "group.unassigned", title: "Guruh boshqa ustozga oʻtkazildi",
          body: `${g.name} guruhi endi sizga biriktirilmagan`, link: "/ustoz/guruhlar",
        });
      }
    });
    return { ok: true };
  });

  // ─── Xona biriktirish ───
  app.put("/groups/:id/room", async (req) => {
    const { id } = parse(idParam, req.params);
    const { roomId } = parse(z.object({ roomId: zId.nullable() }), req.body);
    const g = await prisma.group.findUnique({ where: { id }, include: { room: { select: { id: true, name: true } } } });
    if (!g) throw notFound("Guruh topilmadi");
    if (g.roomId === roomId) return { ok: true, unchanged: true, lessonsUpdated: 0 };
    const { room } = await loadRefs(prisma, { roomId });
    if (room && g.status === "FINISHED") throw badRequest("Yakunlangan guruhga xona biriktirib boʻlmaydi");
    if (room) {
      const students = await prisma.groupStudent.count({ where: { groupId: id, status: { in: ["ACTIVE", "WAITING"] } } });
      if (students > room.capacity) throw badRequest(`${room.name} sigʻimi (${room.capacity} oʻrin) guruhdagi oʻquvchilar sonidan (${students}) kam`);
    }
    const lessonsUpdated = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_SCHEDULE})`;
      if (room) {
        const c = await findConflicts(tx, { roomId: room.id }, g, id);
        if (c.length) throw conflict(`${room.name} bu vaqtda band: ${conflictText(c)}`, "ROOM_BUSY");
      }
      await tx.group.update({ where: { id }, data: { roomId } });
      const n = await updateFutureLessonsRoom(tx, id, roomId);
      await writeAudit(tx, {
        ...auditCtx(req), action: "group.assign_room", entityType: "Group", entityId: id,
        summary: room
          ? g.room
            ? `${g.name}: xona almashtirildi — ${g.room.name} → ${room.name}`
            : `${g.name} guruhiga ${room.name} biriktirildi`
          : `${g.name} guruhidan ${g.room?.name ?? "xona"} olib tashlandi`,
        before: { room: g.room?.name ?? null, roomId: g.roomId },
        after: { room: room?.name ?? null, roomId, futureLessons: n },
      });
      if (g.teacherId) {
        await notify(tx, {
          userId: g.teacherId, type: "group.room_changed", title: "Guruh xonasi oʻzgardi",
          body: `${g.name}: ${room ? `darslar endi ${room.name}${room.location ? ` (${room.location})` : ""} da` : "xona olib tashlandi"}`,
          link: `/ustoz/guruhlar/${id}`,
        });
      }
      return n;
    });
    return { ok: true, lessonsUpdated };
  });

  // ─── Yakunlash / arxivlash ───
  app.post("/groups/:id/finish", async (req) => {
    const { id } = parse(idParam, req.params);
    const g = await prisma.group.findUnique({ where: { id } });
    if (!g) throw notFound("Guruh topilmadi");
    if (g.status === "FINISHED") throw badRequest("Guruh allaqachon yakunlangan");
    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.lesson.updateMany({
        where: { groupId: id, status: "PLANNED", startsAt: { gte: now } },
        data: { status: "CANCELLED" },
      });
      const today = toDbDate(now);
      const waiting = await tx.groupStudent.updateMany({ where: { groupId: id, status: "WAITING" }, data: { status: "LEFT", leftAt: today } });
      await tx.group.update({ where: { id }, data: { status: "FINISHED", endDate: today } });
      await writeAudit(tx, {
        ...auditCtx(req), action: "group.finish", entityType: "Group", entityId: id,
        summary: `${g.name} guruhi yakunlandi; ${cancelled.count} ta rejalashtirilgan dars bekor qilindi`,
        before: { status: g.status }, after: { status: "FINISHED", cancelledLessons: cancelled.count, waitingRemoved: waiting.count },
      });
      if (g.teacherId) {
        await notify(tx, {
          userId: g.teacherId, type: "group.finished", title: "Guruh yakunlandi",
          body: `${g.name} guruhi yakunlandi va arxivga oʻtkazildi`, link: `/ustoz/guruhlar/${id}`,
        });
      }
      return { cancelledLessons: cancelled.count };
    });
    return { ok: true, ...result };
  });
}
