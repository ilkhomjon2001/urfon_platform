// Admin: umumiy ro'yxatlar (selectlar uchun) va xonalar boshqaruvi.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { writeAudit } from "../../lib/audit.js";
import { toDbDate } from "../../lib/dates.js";
import { badRequest, conflict, notFound } from "../../lib/errors.js";
import { auditCtx, idParam, parse, zTime, zYmd } from "../../lib/http.js";
import { BUSY_STATUSES, levelLabel, round1, scheduleText, slotsOverlap, toMin, weeklyHoursOf } from "./a/schedule.js";

const zId = z.string().min(1).max(40);

/** "1,3,5" → [1,3,5] */
export const zDaysCsv = z
  .string()
  .regex(/^[1-7](,[1-7])*$/, "Kunlar 1..7 vergul bilan (masalan 1,3,5)")
  .transform((s) => [...new Set(s.split(",").map(Number))].sort((a, b) => a - b));

const roomBody = z.object({
  name: z.string().trim().min(1, "Xona nomini kiriting").max(60),
  location: z.string().trim().max(120).nullable().optional(),
  capacity: z.number().int().min(1, "Sigʻim kamida 1").max(500),
  kind: z.string().trim().max(60).nullable().optional(),
});

export default async function lookups(app: FastifyInstance) {
  // Formalardagi selectlar uchun (admin-b ham ishlatadi)
  app.get("/lookups", async () => {
    const [levels, rooms, teachers, groups] = await Promise.all([
      prisma.level.findMany({ orderBy: { order: "asc" } }),
      prisma.room.findMany({ orderBy: { name: "asc" } }),
      prisma.user.findMany({
        where: { role: "TEACHER", isActive: true },
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true, title: true, teacherProfile: { select: { specialization: true } } },
      }),
      prisma.group.findMany({
        orderBy: { code: "asc" },
        select: { id: true, code: true, name: true, status: true, teacherId: true, levelId: true, roomId: true },
      }),
    ]);
    return {
      levels: levels.map((l) => ({ id: l.id, code: l.code, name: l.name, order: l.order, label: levelLabel(l) })),
      rooms: rooms.map((r) => ({ id: r.id, name: r.name, location: r.location, capacity: r.capacity, kind: r.kind })),
      teachers: teachers.map((t) => ({ id: t.id, fullName: t.fullName, title: t.title, specialization: t.teacherProfile?.specialization ?? null })),
      groups,
    };
  });

  // Xonalar ro'yxati + bandlik
  app.get("/rooms", async () => {
    const rooms = await prisma.room.findMany({
      orderBy: { name: "asc" },
      include: {
        branch: { select: { id: true, name: true } },
        groups: {
          where: { status: { in: BUSY_STATUSES } },
          orderBy: { startTime: "asc" },
          select: {
            id: true, code: true, name: true, status: true, days: true, startTime: true, endTime: true, capacity: true,
            teacher: { select: { fullName: true } },
          },
        },
      },
    });
    return {
      items: rooms.map((r) => ({
        id: r.id,
        name: r.name,
        location: r.location,
        capacity: r.capacity,
        kind: r.kind,
        branch: r.branch,
        weeklyHours: round1(r.groups.reduce((s, g) => s + weeklyHoursOf(g), 0)),
        groups: r.groups.map((g) => ({
          id: g.id, code: g.code, name: g.name, status: g.status, capacity: g.capacity,
          scheduleText: scheduleText(g.days, g.startTime, g.endTime),
          teacherName: g.teacher?.fullName ?? null,
        })),
      })),
    };
  });

  // Berilgan vaqt uchun xonalar bandligi (guruh yaratish / xona biriktirish oynasi)
  app.get("/rooms/availability", async (req) => {
    const q = parse(
      z.object({
        days: zDaysCsv,
        startTime: zTime,
        endTime: zTime,
        startDate: zYmd.optional(),
        capacity: z.coerce.number().int().min(0).max(500).optional(),
        excludeGroupId: zId.optional(),
      }),
      req.query,
    );
    if (toMin(q.endTime) <= toMin(q.startTime)) throw badRequest("Tugash vaqti boshlanishdan keyin boʻlsin");
    const slot = { days: q.days, startTime: q.startTime, endTime: q.endTime, startDate: q.startDate ? toDbDate(q.startDate) : null };
    const rooms = await prisma.room.findMany({
      orderBy: { name: "asc" },
      include: {
        groups: {
          where: { status: { in: BUSY_STATUSES }, ...(q.excludeGroupId ? { id: { not: q.excludeGroupId } } : {}) },
          select: { id: true, code: true, name: true, days: true, startTime: true, endTime: true, startDate: true, endDate: true },
        },
      },
    });
    const items = rooms.map((r) => {
      const conflicts = r.groups.filter((g) => slotsOverlap(slot, g));
      return {
        id: r.id,
        name: r.name,
        location: r.location,
        capacity: r.capacity,
        kind: r.kind,
        busy: conflicts.length > 0,
        fits: q.capacity == null || r.capacity >= q.capacity,
        conflicts: conflicts.map((g) => ({ id: g.id, code: g.code, name: g.name, scheduleText: scheduleText(g.days, g.startTime, g.endTime) })),
      };
    });
    items.sort((a, b) => Number(a.busy) - Number(b.busy) || Number(b.fits) - Number(a.fits) || a.name.localeCompare(b.name));
    return { items };
  });

  app.post("/rooms", async (req, reply) => {
    const b = parse(roomBody, req.body);
    const branch = await prisma.branch.findFirst({ orderBy: { name: "asc" } });
    if (!branch) throw badRequest("Filial topilmadi");
    const exists = await prisma.room.findFirst({ where: { branchId: branch.id, name: { equals: b.name, mode: "insensitive" } } });
    if (exists) throw conflict(`“${b.name}” nomli xona allaqachon mavjud`);
    const room = await prisma.$transaction(async (tx) => {
      const r = await tx.room.create({
        data: { branchId: branch.id, name: b.name, location: b.location ?? null, capacity: b.capacity, kind: b.kind ?? null },
      });
      await writeAudit(tx, {
        ...auditCtx(req), action: "room.create", entityType: "Room", entityId: r.id,
        summary: `Yangi xona qoʻshildi: ${r.name} (${r.capacity} oʻrin)`,
        after: { name: r.name, location: r.location, capacity: r.capacity, kind: r.kind },
      });
      return r;
    });
    reply.status(201);
    return room;
  });

  app.put("/rooms/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const b = parse(roomBody.partial(), req.body);
    const room = await prisma.room.findUnique({ where: { id }, include: { groups: { where: { status: { in: BUSY_STATUSES } }, select: { name: true, capacity: true } } } });
    if (!room) throw notFound("Xona topilmadi");
    if (b.name && b.name.toLowerCase() !== room.name.toLowerCase()) {
      const exists = await prisma.room.findFirst({ where: { branchId: room.branchId, name: { equals: b.name, mode: "insensitive" }, id: { not: id } } });
      if (exists) throw conflict(`“${b.name}” nomli xona allaqachon mavjud`);
    }
    if (b.capacity != null) {
      const tooBig = room.groups.filter((g) => g.capacity > b.capacity!);
      if (tooBig.length) {
        throw badRequest(`Xonadagi guruh sigʻimi kattaroq: ${tooBig.map((g) => `${g.name} (${g.capacity})`).join(", ")}`);
      }
    }
    const before = { name: room.name, location: room.location, capacity: room.capacity, kind: room.kind };
    const after = {
      name: b.name ?? room.name,
      location: b.location !== undefined ? b.location : room.location,
      capacity: b.capacity ?? room.capacity,
      kind: b.kind !== undefined ? b.kind : room.kind,
    };
    const changed = (Object.keys(after) as (keyof typeof after)[]).filter((k) => after[k] !== before[k]);
    if (!changed.length) return room;
    return prisma.$transaction(async (tx) => {
      const r = await tx.room.update({ where: { id }, data: after });
      await writeAudit(tx, {
        ...auditCtx(req), action: "room.update", entityType: "Room", entityId: id,
        summary: `Xona tahrirlandi: ${r.name}`,
        before: Object.fromEntries(changed.map((k) => [k, before[k]])),
        after: Object.fromEntries(changed.map((k) => [k, after[k]])),
      });
      return r;
    });
  });
}
