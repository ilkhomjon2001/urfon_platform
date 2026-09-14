// Foydalanuvchilar: xodimlar, 124 o'quvchi, ota-onalar, profillar, ParentStudent, TelegramLink.
import type { Prisma } from "@prisma/client";
import type { Db } from "../../src/db.js";
import type { Model } from "./plan.js";
import { LEVELS } from "./data/canon.js";
import { at, dateOnly, happened, insertMany, ymdAdd, Rng } from "./util.js";

export async function writePeople(db: Db, m: Model, pwHash: string) {
  const { clock } = m;
  const T = clock.T;
  const rng = new Rng("urfon-people-write");
  const users: Prisma.UserCreateManyInput[] = [];
  const teacherProfiles: Prisma.TeacherProfileCreateManyInput[] = [];
  const telegram: Prisma.TelegramLinkCreateManyInput[] = [];
  const recentLogin = (hhmm: string, daysAgo = 0) => happened(clock, at(ymdAdd(T, -daysAgo), hhmm));

  const loginTimes: Record<string, Date> = {
    sanjar: recentLogin("08:52"), alisher: recentLogin("09:40"), shahzodbek: recentLogin("10:02"), malika: recentLogin("09:15"),
    jasurbek: recentLogin("13:10", 1), john: recentLogin("14:05"), kamola: recentLogin("11:30", 2), nigora: recentLogin("09:05"), nodira: recentLogin("08:31"),
  };
  for (const s of m.staff.values()) {
    users.push({
      id: s.id, login: s.login, passwordHash: pwHash, role: s.role, fullName: s.fullName, phone: s.login, title: s.title,
      avatarUrl: s.avatarUrl ?? null, createdAt: at(ymdAdd(T, s.key === "kamola" ? -35 : -420), "09:00"), lastLoginAt: loginTimes[s.key] ?? null,
    });
    if (s.profile) teacherProfiles.push({ userId: s.id, ...s.profile });
    if (s.telegram) {
      telegram.push({ id: `tg-${s.key}`, userId: s.id, chatId: String(4_100_000 + users.length * 7919), username: s.telegram, linkedAt: at(ymdAdd(T, -rng.int(60, 300)), "12:00") });
    }
  }

  const levelTitle = (code: string | null) => {
    if (!code) return null;
    const g = m.groups.get(code)!;
    if (!g.level) return null;
    if (g.level === "KIDS") return "Kids oʻquvchisi";
    return `Level ${LEVELS.find((l) => l.code === g.level)!.order} oʻquvchisi`;
  };
  const studentProfiles: Prisma.StudentProfileCreateManyInput[] = [];
  for (const s of m.students) {
    const prim = m.primary(s);
    users.push({
      id: s.id, login: s.code, passwordHash: pwHash, role: "STUDENT", fullName: s.fullName, phone: null,
      title: s.status === "GRADUATED" ? "Bitiruvchi" : levelTitle(prim ?? s.enrollments[0]?.group ?? null), avatarUrl: null,
      createdAt: at(s.enrolledYmd, "10:00", rng.int(0, 3000)),
      lastLoginAt: s.key === "ali" ? recentLogin("11:12") : s.status === "ACTIVE" && rng.chance(0.7) ? at(ymdAdd(T, -rng.int(1, 6)), "19:30", rng.int(0, 7200)) : null,
    });
    studentProfiles.push({
      userId: s.id, code: s.code, birthDate: dateOnly(s.birthYmd), goal: s.goal, turnstileId: s.turnstile ? `TURN-${s.code.slice(3)}` : null,
      status: s.status, enrolledAt: dateOnly(s.enrolledYmd), leftAt: s.leftYmd ? dateOnly(s.leftYmd) : null,
    });
  }

  const byId = new Map(m.students.map((s) => [s.id, s]));
  const parentStudent: Prisma.ParentStudentCreateManyInput[] = [];
  for (const p of m.parents) {
    const firstChild = p.children.map((c) => byId.get(c)!).sort((a, b) => a.enrolledYmd.localeCompare(b.enrolledYmd))[0];
    users.push({
      id: p.id, login: p.phone, passwordHash: pwHash, role: "PARENT", fullName: p.fullName, phone: p.phone, title: p.relation, avatarUrl: null,
      createdAt: at(firstChild.enrolledYmd, "10:05", rng.int(0, 600)),
      lastLoginAt: p.key === "rustam" ? recentLogin("14:28") : rng.chance(0.6) ? at(ymdAdd(T, -rng.int(0, 9)), "20:10", rng.int(0, 7200)) : null,
    });
    for (const c of p.children) parentStudent.push({ parentId: p.id, studentId: c, relation: p.relation, createdAt: at(byId.get(c)!.enrolledYmd, "10:06") });
    if (p.telegram) {
      const linkedYmd = firstChild.enrolledYmd > ymdAdd(T, -1) ? ymdAdd(T, -1) : ymdAdd(firstChild.enrolledYmd, rng.int(1, 20));
      telegram.push({
        id: `tg-${p.key}`, userId: p.id, chatId: p.telegram.chatId, username: p.telegram.username,
        linkedAt: at(linkedYmd < T ? linkedYmd : ymdAdd(T, -1), "21:00", rng.int(0, 3000)),
      });
    }
  }

  await insertMany(db.user, users);
  await insertMany(db.teacherProfile, teacherProfiles);
  await insertMany(db.studentProfile, studentProfiles);
  await insertMany(db.parentStudent, parentStudent);
  await insertMany(db.telegramLink, telegram);
  return { users: users.length, telegram: telegram.length };
}
