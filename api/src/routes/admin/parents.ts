// Admin → Ota-onalar: roʻyxat, profil, yaratish/bogʻlash, uzish, parol, bloklash — hammasi audit bilan.
import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma, type Tx } from "../../db.js";
import { auditCtx, idParam, pageQuery, paged, paginate, parse } from "../../lib/http.js";
import { writeAudit } from "../../lib/audit.js";
import { notify } from "../../lib/notify.js";
import { badRequest, conflict, notFound } from "../../lib/errors.js";
import { hashPassword, tempPassword } from "../../lib/password.js";
import { csvDateTime, pct, sendCsv, STUDENT_STATUS_LABEL, toCsv, zBool, zName, zPhoneLoose, zRelation } from "./b/helpers.js";

const listQuery = pageQuery.extend({
  telegram: z.enum(["linked", "unlinked"]).optional(),
  active: zBool.optional(),
  studentId: z.string().max(40).optional(),
  sort: z.enum(["name", "lastLogin", "newest"]).default("name"),
});
type ListQuery = z.infer<typeof listQuery>;

const ROLE_UZ: Record<string, string> = { ADMIN: "admin", TEACHER: "ustoz", STUDENT: "oʻquvchi", PARENT: "ota-ona" };

function listWhere(q: Omit<ListQuery, "page" | "pageSize">): Prisma.UserWhereInput {
  const and: Prisma.UserWhereInput[] = [{ role: "PARENT" }];
  if (q.q) {
    const t = q.q.trim();
    const digits = t.replace(/\D/g, "");
    const or: Prisma.UserWhereInput[] = [
      { fullName: { contains: t, mode: "insensitive" } },
      { children: { some: { student: { fullName: { contains: t, mode: "insensitive" } } } } },
      { children: { some: { student: { studentProfile: { code: { contains: t.replace(/^#/, ""), mode: "insensitive" } } } } } },
    ];
    if (digits.length >= 3) or.push({ phone: { contains: digits } });
    and.push({ OR: or });
  }
  if (q.telegram === "linked") and.push({ telegramLink: { isActive: true } });
  if (q.telegram === "unlinked") and.push({ OR: [{ telegramLink: { is: null } }, { telegramLink: { isActive: false } }] });
  if (q.active !== undefined) and.push({ isActive: q.active });
  if (q.studentId) and.push({ children: { some: { studentId: q.studentId } } });
  return { AND: and };
}

const listInclude = {
  telegramLink: { select: { isActive: true, username: true, linkedAt: true } },
  children: {
    orderBy: { createdAt: "asc" as const },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          studentProfile: { select: { code: true, status: true } },
          enrollments: { where: { status: { in: ["ACTIVE" as const, "WAITING" as const] } }, select: { group: { select: { id: true, name: true } } } },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;
type Row = Prisma.UserGetPayload<{ include: typeof listInclude }>;

const mapRow = (u: Row) => ({
  id: u.id,
  fullName: u.fullName,
  phone: u.phone,
  login: u.login,
  title: u.title,
  isActive: u.isActive,
  mustChangePassword: u.mustChangePassword,
  lastLoginAt: u.lastLoginAt,
  createdAt: u.createdAt,
  telegram: { linked: !!u.telegramLink?.isActive, username: u.telegramLink?.username ?? null, linkedAt: u.telegramLink?.linkedAt ?? null },
  children: u.children.map((c) => ({
    id: c.student.id,
    fullName: c.student.fullName,
    code: c.student.studentProfile?.code ?? "",
    status: c.student.studentProfile?.status ?? "ACTIVE",
    relation: c.relation,
    groups: c.student.enrollments.map((e) => e.group),
  })),
});

const orderBy = (sort: ListQuery["sort"]): Prisma.UserOrderByWithRelationInput[] =>
  sort === "lastLogin" ? [{ lastLoginAt: { sort: "desc", nulls: "last" } }] : sort === "newest" ? [{ createdAt: "desc" }] : [{ fullName: "asc" }];

async function getParentOr404(id: string, db: Tx | typeof prisma = prisma) {
  const u = await db.user.findFirst({ where: { id, role: "PARENT" } });
  if (!u) throw notFound("Ota-ona topilmadi");
  return u;
}

async function getStudentOr404(id: string, db: Tx | typeof prisma = prisma) {
  const s = await db.user.findFirst({ where: { id, role: "STUDENT" }, select: { id: true, fullName: true, studentProfile: { select: { code: true } } } });
  if (!s) throw notFound("Oʻquvchi topilmadi");
  return s;
}

export default async function parents(app: FastifyInstance) {
  app.get("/parents", async (req) => {
    const q = parse(listQuery, req.query);
    const where = listWhere(q);
    const [total, rows] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({ where, include: listInclude, orderBy: orderBy(q.sort), ...paginate(q) }),
    ]);
    return paged(rows.map(mapRow), total, q);
  });

  app.get("/parents/stats", async () => {
    const [total, linked, inactive, neverLoggedIn, mustChange] = await Promise.all([
      prisma.user.count({ where: { role: "PARENT" } }),
      prisma.user.count({ where: { role: "PARENT", telegramLink: { isActive: true } } }),
      prisma.user.count({ where: { role: "PARENT", isActive: false } }),
      prisma.user.count({ where: { role: "PARENT", lastLoginAt: null } }),
      prisma.user.count({ where: { role: "PARENT", mustChangePassword: true } }),
    ]);
    return { total, telegram: { linked, unlinked: total - linked, percent: pct(linked, total, 0) }, inactive, neverLoggedIn, mustChangePassword: mustChange };
  });

  /** Telefon bo'yicha mavjud akkauntni tekshirish (formada "bog'lanadi" ogohlantirishi uchun). */
  app.get("/parents/lookup", async (req) => {
    const { phone } = parse(z.object({ phone: zPhoneLoose }), req.query);
    const u = await prisma.user.findUnique({ where: { login: phone }, include: listInclude });
    if (!u) return { phone, exists: false, parent: null, conflictRole: null };
    if (u.role !== "PARENT") return { phone, exists: true, parent: null, conflictRole: u.role };
    return { phone, exists: true, parent: mapRow(u), conflictRole: null };
  });

  app.get("/parents/export.csv", async (req, reply) => {
    const q = parse(listQuery.omit({ page: true, pageSize: true }), req.query);
    const rows = await prisma.user.findMany({ where: listWhere(q), include: listInclude, orderBy: orderBy(q.sort), take: 5000 });
    const csv = toCsv(
      ["Ism-familiya", "Telefon", "Farzand(lar)", "Guruh(lar)", "Qarindoshlik", "Telegram", "Oxirgi kirish", "Holat"],
      rows.map(mapRow).map((p) => [
        p.fullName,
        p.phone ?? "",
        p.children.map((c) => `${c.fullName} (${c.code})`).join("; "),
        p.children.flatMap((c) => c.groups.map((g) => g.name)).join("; "),
        p.children.map((c) => c.relation).join("; "),
        p.telegram.linked ? `Ulangan${p.telegram.username ? ` @${p.telegram.username}` : ""}` : "Ulanmagan",
        csvDateTime(p.lastLoginAt),
        p.isActive ? "Faol" : "Bloklangan",
      ]),
    );
    return sendCsv(reply, `ota-onalar-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  });

  app.get("/parents/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const u = await prisma.user.findFirst({ where: { id, role: "PARENT" }, include: listInclude });
    if (!u) throw notFound("Ota-ona topilmadi");
    const [notifications, audit, notifStats] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, type: true, title: true, status: true, createdAt: true, readAt: true },
      }),
      prisma.auditLog.findMany({
        where: { OR: [{ entityId: id }, { actorId: id }, { after: { path: ["parentId"], equals: id } }] },
        orderBy: { id: "desc" },
        take: 10,
        select: { id: true, at: true, action: true, summary: true, actorRole: true, actor: { select: { fullName: true } } },
      }),
      prisma.notification.groupBy({ by: ["status"], where: { userId: id, telegram: true }, _count: { _all: true } }),
    ]);
    return {
      ...mapRow(u),
      children: mapRow(u).children.map((c) => ({ ...c, statusLabel: STUDENT_STATUS_LABEL[c.status] })),
      notifications,
      notificationStats: Object.fromEntries(notifStats.map((r) => [r.status, r._count._all])),
      audit: audit.map((a) => ({ ...a, id: a.id.toString() })),
    };
  });

  // ── Yangi ota-ona yaratish yoki mavjudini farzandga bog'lash ──
  app.post("/parents", async (req) => {
    const body = parse(
      z.object({ fullName: z.string().trim().max(120).optional(), phone: zPhoneLoose, studentId: z.string().min(1).max(40), relation: zRelation.default("Ota") }),
      req.body,
    );
    const student = await getStudentOr404(body.studentId);
    const existing = await prisma.user.findUnique({ where: { login: body.phone } });
    if (existing && existing.role !== "PARENT") throw conflict(`${body.phone} raqami boshqa akkauntga (${ROLE_UZ[existing.role]}) tegishli`, "LOGIN_TAKEN");
    if (!existing && (!body.fullName || body.fullName.length < 3)) throw badRequest("Ota-ona ism-familiyasini kiriting");
    let pw: string | null = null;
    let hash: string | null = null;
    if (!existing) {
      pw = tempPassword();
      hash = await hashPassword(pw);
    }
    return prisma.$transaction(async (tx) => {
      let parent = existing;
      if (!parent) {
        const clash = await tx.user.findUnique({ where: { login: body.phone } });
        if (clash) throw conflict("Bu telefon raqami bilan akkaunt allaqachon mavjud", "LOGIN_TAKEN");
        parent = await tx.user.create({
          data: { login: body.phone, phone: body.phone, passwordHash: hash!, role: "PARENT", fullName: body.fullName!, title: body.relation, mustChangePassword: true },
        });
        await writeAudit(tx, {
          ...auditCtx(req), action: "parent.create", entityType: "User", entityId: parent.id,
          summary: `Ota-ona akkaunti yaratildi: ${parent.fullName} (${body.phone})`,
          after: { parentId: parent.id, login: parent.login, fullName: parent.fullName, phone: parent.phone, role: "PARENT", studentId: student.id },
        });
      }
      const link = await tx.parentStudent.findUnique({ where: { parentId_studentId: { parentId: parent.id, studentId: student.id } } });
      if (link) throw conflict(`${parent.fullName} allaqachon ${student.fullName} bilan bogʻlangan`, "ALREADY_LINKED");
      await tx.parentStudent.create({ data: { parentId: parent.id, studentId: student.id, relation: body.relation } });
      await writeAudit(tx, {
        ...auditCtx(req), action: "parent.link", entityType: "Student", entityId: student.id,
        summary: `${parent.fullName} (${body.relation}) → ${student.fullName} farzandiga bogʻlandi`,
        after: { parentId: parent.id, studentId: student.id, relation: body.relation },
      });
      return {
        parent: { id: parent.id, fullName: parent.fullName, phone: parent.phone },
        student: { id: student.id, fullName: student.fullName },
        credentials: { role: "PARENT", userId: parent.id, fullName: parent.fullName, login: parent.login, password: pw, existing: !!existing, relation: body.relation },
      };
    });
  });

  // ── Mavjud ota-onani yana bir farzandga bog'lash ──
  app.post("/parents/:id/children", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(z.object({ studentId: z.string().min(1).max(40), relation: zRelation.default("Ota") }), req.body);
    return prisma.$transaction(async (tx) => {
      const parent = await getParentOr404(id, tx);
      const student = await getStudentOr404(body.studentId, tx);
      const link = await tx.parentStudent.findUnique({ where: { parentId_studentId: { parentId: id, studentId: student.id } } });
      if (link) throw conflict(`${parent.fullName} allaqachon ${student.fullName} bilan bogʻlangan`, "ALREADY_LINKED");
      await tx.parentStudent.create({ data: { parentId: id, studentId: student.id, relation: body.relation } });
      await writeAudit(tx, {
        ...auditCtx(req), action: "parent.link", entityType: "Student", entityId: student.id,
        summary: `${parent.fullName} (${body.relation}) → ${student.fullName} farzandiga bogʻlandi`,
        after: { parentId: id, studentId: student.id, relation: body.relation },
      });
      return { parentId: id, studentId: student.id, relation: body.relation };
    });
  });

  // ── Bog'lanishni uzish ──
  app.delete("/parents/:id/children/:studentId", async (req) => {
    const { id, studentId } = parse(z.object({ id: z.string().min(1).max(40), studentId: z.string().min(1).max(40) }), req.params);
    return prisma.$transaction(async (tx) => {
      const parent = await getParentOr404(id, tx);
      const link = await tx.parentStudent.findUnique({
        where: { parentId_studentId: { parentId: id, studentId } },
        include: { student: { select: { fullName: true } } },
      });
      if (!link) throw notFound("Bogʻlanish topilmadi");
      await tx.parentStudent.delete({ where: { parentId_studentId: { parentId: id, studentId } } });
      await writeAudit(tx, {
        ...auditCtx(req), action: "parent.unlink", entityType: "Student", entityId: studentId,
        summary: `${parent.fullName} va ${link.student.fullName} oʻrtasidagi bogʻlanish uzildi`,
        before: { parentId: id, studentId, relation: link.relation },
        after: null,
      });
      return { parentId: id, studentId, unlinked: true };
    });
  });

  // ── Tahrirlash (telefon = login) ──
  app.put("/parents/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(
      z.object({ fullName: zName.optional(), phone: zPhoneLoose.optional() }).refine((o) => o.fullName || o.phone, "Oʻzgartirish uchun maydon yuboring"),
      req.body,
    );
    return prisma.$transaction(async (tx) => {
      const p = await getParentOr404(id, tx);
      if (body.phone && body.phone !== p.login) {
        const clash = await tx.user.findUnique({ where: { login: body.phone } });
        if (clash) throw conflict("Bu telefon raqami bilan akkaunt allaqachon mavjud", "LOGIN_TAKEN");
      }
      const before = { fullName: p.fullName, phone: p.phone, login: p.login };
      const after = { fullName: body.fullName ?? p.fullName, phone: body.phone ?? p.phone, login: body.phone ?? p.login };
      await tx.user.update({ where: { id }, data: after });
      await writeAudit(tx, {
        ...auditCtx(req), action: "parent.update", entityType: "User", entityId: id,
        summary: `Ota-ona maʼlumotlari tahrirlandi: ${after.fullName}`,
        before: { parentId: id, ...before }, after: { parentId: id, ...after },
      });
      return { id, ...after };
    });
  });

  // ── Parolni tiklash (vaqtinchalik parol faqat shu javobda) ──
  app.post("/parents/:id/reset-password", async (req) => {
    const { id } = parse(idParam, req.params);
    const p = await getParentOr404(id);
    const pw = tempPassword();
    const hash = await hashPassword(pw);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { passwordHash: hash, mustChangePassword: true } });
      await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      await writeAudit(tx, {
        ...auditCtx(req), action: "parent.reset_password", entityType: "User", entityId: id,
        summary: `${p.fullName} (${p.login}) paroli tiklandi`,
        after: { parentId: id, mustChangePassword: true, sessionsRevoked: true },
      });
    });
    return { userId: id, fullName: p.fullName, login: p.login, password: pw };
  });

  // ── Bloklash / qayta faollashtirish ──
  app.post("/parents/:id/active", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(z.object({ isActive: z.boolean(), reason: z.string().trim().max(300).optional() }), req.body);
    return prisma.$transaction(async (tx) => {
      const p = await getParentOr404(id, tx);
      if (p.isActive === body.isActive) throw badRequest(body.isActive ? "Akkaunt allaqachon faol" : "Akkaunt allaqachon bloklangan");
      await tx.user.update({ where: { id }, data: { isActive: body.isActive } });
      if (!body.isActive) await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      await writeAudit(tx, {
        ...auditCtx(req), action: body.isActive ? "parent.activate" : "parent.deactivate", entityType: "User", entityId: id,
        summary: `${p.fullName} akkaunti ${body.isActive ? "qayta faollashtirildi" : "bloklandi"}${body.reason ? ` — ${body.reason}` : ""}`,
        before: { parentId: id, isActive: p.isActive }, after: { parentId: id, isActive: body.isActive, reason: body.reason ?? null },
      });
      if (body.isActive) {
        await notify(tx, { userId: id, type: "account.activated", title: "Akkaunt faollashtirildi", body: "URFON kabinetingizga yana kirishingiz mumkin.", link: "/ota-ona" });
      }
      return { id, isActive: body.isActive };
    });
  });
}
