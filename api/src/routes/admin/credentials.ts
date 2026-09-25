// Admin → Kirish maʼlumotlari: oʻquvchi va ota-ona login/parollarini ommaviy koʻrish va yangilash.
// Parollar bazada shifrlangan — eskisini koʻrsatib boʻlmaydi, faqat yangi vaqtinchalik parol beriladi.
// Xavfsizlik: kabinetdan foydalanayotgan (parolini almashtirgan) odamning paroli faqat aniq tanlanganda yangilanadi.
import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../db.js";
import { writeAudit } from "../../lib/audit.js";
import { badRequest } from "../../lib/errors.js";
import { auditCtx, parse } from "../../lib/http.js";
import { hashPassword, tempPassword } from "../../lib/password.js";

const zId = z.string().min(1).max(40);

const listQuery = z.object({
  q: z.string().trim().max(100).optional(),
  groupId: zId.optional(),
  who: z.enum(["all", "students", "parents"]).default("all"),
  /** faqat hali kabinetga kirmaganlar (vaqtinchalik parol hanuz oʻzgarmagan) */
  pending: z.coerce.boolean().default(false),
});

const resetBody = z.object({
  userIds: z.array(zId).min(1, "Hech kim tanlanmagan").max(500),
  /** kabinetdan foydalanayotganlarni ham yangilash (ular tizimdan chiqib ketadi) */
  includeActive: z.boolean().default(false),
});

/** Oʻquvchi va uning ota-onalari — bitta oila qatori. */
const studentSelect = {
  id: true,
  fullName: true,
  login: true,
  isActive: true,
  lastLoginAt: true,
  mustChangePassword: true,
  studentProfile: { select: { code: true, status: true } },
  enrollments: {
    where: { status: { in: ["ACTIVE", "WAITING"] as const } },
    select: { status: true, group: { select: { id: true, code: true, name: true } } },
    orderBy: { joinedAt: "desc" as const },
    take: 1,
  },
  parents: {
    select: {
      relation: true,
      parent: { select: { id: true, fullName: true, login: true, phone: true, isActive: true, lastLoginAt: true, mustChangePassword: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.UserSelect;

export default async function credentials(app: FastifyInstance) {
  // Roʻyxat: oila boʻyicha (oʻquvchi + ota-onalari), kim kabinetga kirgan-kirmagani bilan
  app.get("/credentials", async (req) => {
    const q = parse(listQuery, req.query);
    const where: Prisma.UserWhereInput = {
      role: "STUDENT",
      studentProfile: { status: { not: "LEFT" } },
      ...(q.groupId ? { enrollments: { some: { groupId: q.groupId, status: { in: ["ACTIVE", "WAITING"] } } } } : {}),
      ...(q.q
        ? {
            OR: [
              { fullName: { contains: q.q, mode: "insensitive" } },
              { login: { contains: q.q, mode: "insensitive" } },
              { parents: { some: { parent: { OR: [{ fullName: { contains: q.q, mode: "insensitive" } }, { login: { contains: q.q } }] } } } },
            ],
          }
        : {}),
    };
    const rows = await prisma.user.findMany({ where, select: studentSelect, orderBy: { fullName: "asc" }, take: 1000 });
    const families = rows.map((s) => {
      const e = s.enrollments[0];
      return {
        student: {
          userId: s.id,
          fullName: s.fullName,
          login: s.login,
          code: s.studentProfile?.code ?? null,
          neverLoggedIn: !s.lastLoginAt,
          pending: s.mustChangePassword,
          lastLoginAt: s.lastLoginAt,
        },
        group: e ? { id: e.group.id, code: e.group.code, name: e.group.name, status: e.status } : null,
        parents: s.parents.map((p) => ({
          userId: p.parent.id,
          fullName: p.parent.fullName,
          login: p.parent.login,
          relation: p.relation,
          neverLoggedIn: !p.parent.lastLoginAt,
          pending: p.parent.mustChangePassword,
          lastLoginAt: p.parent.lastLoginAt,
        })),
      };
    });
    const flat = families.flatMap((f) => [f.student, ...f.parents]);
    const filtered =
      q.who === "students" ? families.map((f) => ({ ...f, parents: [] })) : q.who === "parents" ? families.filter((f) => f.parents.length) : families;
    return {
      families: q.pending ? filtered.filter((f) => f.student.neverLoggedIn || f.parents.some((p) => p.neverLoggedIn)) : filtered,
      stats: {
        students: families.length,
        parents: families.reduce((a, f) => a + f.parents.length, 0),
        neverLoggedIn: flat.filter((x) => x.neverLoggedIn).length,
        active: flat.filter((x) => !x.neverLoggedIn).length,
      },
    };
  });

  // Ommaviy parol yangilash: tanlangan foydalanuvchilarga yangi vaqtinchalik parol (javobda bir marta koʻrsatiladi)
  app.post("/credentials/reset", async (req) => {
    const body = parse(resetBody, req.body);
    const users = await prisma.user.findMany({
      where: { id: { in: body.userIds }, role: { in: ["STUDENT", "PARENT"] } },
      select: { id: true, fullName: true, login: true, role: true, lastLoginAt: true, children: { select: { student: { select: { fullName: true } } } } },
    });
    if (!users.length) throw badRequest("Foydalanuvchilar topilmadi");
    const target = body.includeActive ? users : users.filter((u) => !u.lastLoginAt);
    if (!target.length) throw badRequest("Tanlanganlarning hammasi kabinetdan foydalanmoqda — ularni yangilash uchun alohida tasdiq kerak");

    const withHash = await Promise.all(
      target.map(async (u) => {
        const pw = tempPassword();
        return { u, pw, hash: await hashPassword(pw) };
      }),
    );

    await prisma.$transaction(async (tx) => {
      for (const m of withHash) {
        await tx.user.update({ where: { id: m.u.id }, data: { passwordHash: m.hash, mustChangePassword: true } });
        await tx.session.updateMany({ where: { userId: m.u.id, revokedAt: null }, data: { revokedAt: new Date() } });
      }
      await writeAudit(tx, {
        ...auditCtx(req), action: "credentials.bulk_reset", entityType: "User", entityId: "bulk",
        summary: `Ommaviy parol yangilandi: ${withHash.length} ta akkaunt (${withHash.filter((m) => m.u.role === "STUDENT").length} oʻquvchi, ${withHash.filter((m) => m.u.role === "PARENT").length} ota-ona)`,
        after: { count: withHash.length, includeActive: body.includeActive, logins: withHash.map((m) => m.u.login) },
      });
    });

    return {
      count: withHash.length,
      skipped: users.length - target.length,
      credentials: withHash.map((m) => ({
        userId: m.u.id,
        role: m.u.role,
        fullName: m.u.fullName,
        login: m.u.login,
        password: m.pw,
        student: m.u.role === "PARENT" ? (m.u.children[0]?.student.fullName ?? null) : m.u.fullName,
      })),
    };
  });
}
