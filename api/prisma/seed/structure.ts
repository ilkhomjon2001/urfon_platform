// Filial, xonalar, leveller, mavzular (sillabus), guruhlar va guruh a'zoligi.
import type { Prisma } from "@prisma/client";
import type { Db } from "../../src/db.js";
import { BRANCH, LEVELS, ROOMS } from "./data/canon.js";
import { SYLLABUS } from "./data/syllabus.js";
import type { Model } from "./plan.js";
import { at, cid, dateOnly, insertMany, ymdAdd } from "./util.js";

export type TopicRec = { id: string; unit: number; title: string; lessons: number; levelCode: string };
export type Structure = {
  branchId: string;
  rooms: Map<string, string>;
  levels: Map<string, string>;
  topics: Map<string, TopicRec[]>; // level code → unit tartibida
};

export async function writeBranchRoomsLevels(db: Db): Promise<Omit<Structure, "topics">> {
  const branch = await db.branch.create({ data: BRANCH });
  const rooms = new Map<string, string>();
  for (const r of ROOMS) {
    const row = await db.room.create({ data: { branchId: branch.id, name: r.name, location: r.location, capacity: r.capacity, kind: r.kind } });
    rooms.set(r.name, row.id);
  }
  const levels = new Map<string, string>();
  for (const l of LEVELS) {
    const row = await db.level.create({ data: { code: l.code, name: l.name, order: l.order } });
    levels.set(l.code, row.id);
  }
  return { branchId: branch.id, rooms, levels };
}

export async function writeTopics(db: Db, m: Model, levels: Map<string, string>) {
  const T = m.clock.T;
  const nigora = m.staff.get("nigora")!.id;
  const topics = new Map<string, TopicRec[]>();
  const rows: Prisma.TopicCreateManyInput[] = [];
  for (const [code, list] of Object.entries(SYLLABUS)) {
    const recs: TopicRec[] = [];
    for (const t of list) {
      const id = cid();
      recs.push({ id, unit: t.unit, title: t.title, lessons: t.lessons, levelCode: code });
      // L2 oxirgi marta "14-mart" da yangilangan (T − 71 kun); qoralamalar yaqinda
      const updated = t.status === "DRAFT" ? ymdAdd(T, -(3 + t.unit)) : code === "L2" ? ymdAdd(T, -71) : ymdAdd(T, -(90 + t.unit * 3));
      rows.push({
        id, levelId: levels.get(code)!, unit: t.unit, title: t.title, description: t.description, objectives: t.objectives,
        vocabulary: t.vocabulary, grammar: t.grammar, lessonsCount: t.lessons, hours: t.lessons * 1.5, status: t.status ?? "PUBLISHED",
        authorId: nigora, createdAt: at(ymdAdd(T, t.status === "DRAFT" ? -20 : -240), "10:00", t.unit * 60), updatedAt: at(updated, "15:20"),
      });
    }
    topics.set(code, recs);
  }
  await insertMany(db.topic, rows);
  return topics;
}

export async function writeGroups(db: Db, m: Model, s: Omit<Structure, "topics">) {
  const rows: Prisma.GroupCreateManyInput[] = [];
  for (const g of m.groups.values()) {
    rows.push({
      id: g.id, code: g.code, name: g.name, levelId: g.level ? s.levels.get(g.level)! : null,
      teacherId: g.teacher ? m.staff.get(g.teacher)!.id : null, roomId: s.rooms.get(g.room)!, days: g.days,
      startTime: g.start, endTime: g.end, capacity: g.capacity, status: g.status, startDate: dateOnly(g.startDate),
      endDate: dateOnly(g.endDate), monthlyFee: g.fee, totalLessons: g.totalLessons, createdAt: at(g.createdYmd, "11:00"),
      updatedAt: at(g.code === "GR-05" ? m.clock.T : g.createdYmd, "11:00"),
    });
  }
  await insertMany(db.group, rows);

  const gs: Prisma.GroupStudentCreateManyInput[] = [];
  for (const st of m.students) {
    for (const e of st.enrollments) {
      gs.push({ groupId: m.groups.get(e.group)!.id, studentId: st.id, status: e.status, joinedAt: dateOnly(e.joined), leftAt: e.left ? dateOnly(e.left) : null });
    }
  }
  await insertMany(db.groupStudent, gs);
  return gs.length;
}
