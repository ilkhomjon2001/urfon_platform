// Ustoz: haftalik dars jadvali va auditoriyalar bandligi (teacher-a).
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { parse, zYmd } from "../../lib/http.js";
import { addDays, atTz, isoWeekdayTz, startOfDayTz, startOfWeekTz, ymdTz } from "../../lib/dates.js";
import { DAY_LONG, DAY_SHORT, hhmmTz, levelDto, round1, roomDto } from "./groups.js";

const WORK_FROM = "08:30";
const WORK_TO = "21:00";
const minutes = (a: Date, b: Date) => Math.max(0, Math.round((b.getTime() - a.getTime()) / 60_000));

export default async function schedule(app: FastifyInstance) {
  app.get("/schedule", async (req) => {
    const q = parse(z.object({ weekStart: zYmd.optional() }), req.query);
    const now = new Date();
    const ws = startOfWeekTz(q.weekStart ? atTz(q.weekStart, "12:00") : now);
    const we = addDays(ws, 7);

    const groups = await prisma.group.findMany({
      where: { teacherId: req.auth.userId },
      include: { level: true, room: true },
      orderBy: { code: "asc" },
    });
    const ids = groups.length ? groups.map((g) => g.id) : ["-"];
    const [lessons, activeCounts, exams] = await Promise.all([
      prisma.lesson.findMany({
        where: { groupId: { in: ids }, startsAt: { gte: ws, lt: we } },
        orderBy: { startsAt: "asc" },
        include: {
          room: true,
          topics: { include: { topic: { select: { id: true, unit: true, title: true } } } },
          _count: { select: { attendance: { where: { status: { in: ["PRESENT", "LATE"] } } } } },
        },
      }),
      prisma.groupStudent.groupBy({ by: ["groupId"], where: { groupId: { in: ids }, status: "ACTIVE" }, _count: { _all: true } }),
      prisma.exam.findMany({
        where: { startsAt: { gte: ws, lt: we }, OR: [{ groupId: { in: ids } }, { groupId: null }] },
        orderBy: { startsAt: "asc" },
        include: { group: { select: { id: true, code: true, name: true } } },
      }),
    ]);
    const gMap = new Map(groups.map((g) => [g.id, g]));
    const cMap = new Map(activeCounts.map((c) => [c.groupId, c._count._all]));

    const items = lessons.map((l) => {
      const g = gMap.get(l.groupId)!;
      return {
        id: l.id,
        number: l.number,
        title: l.title,
        startsAt: l.startsAt,
        endsAt: l.endsAt,
        date: ymdTz(l.startsAt),
        start: hhmmTz(l.startsAt),
        end: hhmmTz(l.endsAt),
        status: l.status,
        group: { id: g.id, code: g.code, name: g.name, level: levelDto(g.level) },
        room: roomDto(l.room ?? g.room),
        topics: l.topics.map((t) => t.topic).sort((a, b) => a.unit - b.unit),
        attended: l._count.attendance,
        total: cMap.get(g.id) ?? 0,
      };
    });
    const live = items.filter((l) => l.status !== "CANCELLED");
    const today = ymdTz(now);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(ws, i);
      const date = ymdTz(d);
      return {
        date,
        weekday: i + 1,
        short: DAY_SHORT[i + 1],
        long: DAY_LONG[i + 1],
        isToday: date === today,
        lessonsCount: live.filter((l) => l.date === date).length,
        examsCount: exams.filter((e) => ymdTz(e.startsAt) === date).length,
      };
    });
    const rooms = [...new Map(live.filter((l) => l.room).map((l) => [l.room!.id, l.room!])).values()];
    const next = live.find((l) => l.endsAt >= now && l.status !== "DONE") ?? null;
    const starts = live.map((l) => l.start).sort();
    const ends = live.map((l) => l.end).sort();

    return {
      weekStart: ymdTz(ws),
      weekEnd: ymdTz(addDays(ws, 6)),
      prevWeekStart: ymdTz(addDays(ws, -7)),
      nextWeekStart: ymdTz(addDays(ws, 7)),
      today,
      isCurrentWeek: ws.getTime() === startOfWeekTz(now).getTime(),
      days,
      lessons: items,
      exams: exams.map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        startsAt: e.startsAt,
        date: ymdTz(e.startsAt),
        start: hhmmTz(e.startsAt),
        end: hhmmTz(new Date(e.startsAt.getTime() + e.durationMin * 60_000)),
        durationMin: e.durationMin,
        location: e.location,
        group: e.group,
      })),
      groups: groups.map((g) => ({ id: g.id, code: g.code, name: g.name })),
      stats: {
        lessons: live.length,
        hours: round1(live.reduce((s, l) => s + minutes(l.startsAt, l.endsAt), 0) / 60),
        groups: new Set(live.map((l) => l.group.id)).size,
        rooms,
        todayLessons: live.filter((l) => l.date === today).length,
        nextLesson: next,
      },
      timeRange: { from: starts[0] ?? WORK_FROM, to: ends[ends.length - 1] ?? WORK_TO },
      workHours: { from: WORK_FROM, to: WORK_TO },
    };
  });

  // Auditoriyalar bandligi: xona bandligi maxfiy emas (guruh va ustoz nomi ko'rinadi),
  // lekin boshqa ustozning dars ID'si berilmaydi — faqat o'z darslari bosiladi.
  app.get("/rooms-occupancy", async (req) => {
    const q = parse(z.object({ date: zYmd.optional() }), req.query);
    const now = new Date();
    const day = q.date ? atTz(q.date, "00:00") : startOfDayTz(now);
    const [rooms, lessons] = await Promise.all([
      prisma.room.findMany({ include: { branch: { select: { id: true, name: true } } } }),
      prisma.lesson.findMany({
        where: { startsAt: { gte: day, lt: addDays(day, 1) }, status: { not: "CANCELLED" } },
        orderBy: { startsAt: "asc" },
        include: {
          group: {
            select: { id: true, code: true, name: true, roomId: true, teacherId: true, teacher: { select: { fullName: true } } },
          },
        },
      }),
    ]);
    const dayMinutes = minutes(atTz(ymdTz(day), WORK_FROM), atTz(ymdTz(day), WORK_TO));
    const toItem = (l: (typeof lessons)[number]) => {
      const own = l.group.teacherId === req.auth.userId;
      return {
        id: own ? l.id : null,
        own,
        startsAt: l.startsAt,
        endsAt: l.endsAt,
        start: hhmmTz(l.startsAt),
        end: hhmmTz(l.endsAt),
        status: l.status,
        title: own ? l.title : null,
        group: { code: l.group.code, name: l.group.name },
        teacher: l.group.teacher ? { fullName: l.group.teacher.fullName } : null,
      };
    };
    const byRoom = new Map<string, ReturnType<typeof toItem>[]>();
    const unassigned: ReturnType<typeof toItem>[] = [];
    for (const l of lessons) {
      const rid = l.roomId ?? l.group.roomId;
      if (!rid) {
        unassigned.push(toItem(l));
        continue;
      }
      if (!byRoom.has(rid)) byRoom.set(rid, []);
      byRoom.get(rid)!.push(toItem(l));
    }
    const out = rooms
      .map((r) => {
        const ls = byRoom.get(r.id) ?? [];
        const busy = ls.reduce((s, l) => s + minutes(l.startsAt, l.endsAt), 0);
        return {
          ...roomDto(r)!,
          branch: r.branch,
          lessons: ls,
          busyMinutes: busy,
          loadPct: dayMinutes ? Math.min(100, Math.round((busy * 100) / dayMinutes)) : 0,
          hasOwn: ls.some((l) => l.own),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "uz", { numeric: true }));
    return {
      date: ymdTz(day),
      today: ymdTz(now),
      weekday: isoWeekdayTz(day),
      rooms: out,
      unassigned,
      workHours: { from: WORK_FROM, to: WORK_TO },
    };
  });
}
