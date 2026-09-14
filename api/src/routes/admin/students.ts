// Admin → Oʻquvchilar: roʻyxat, profil, yaratish (ota-ona bilan bitta tranzaksiyada), holat, parol, guruhga yozish.
// Agentlararo shartnoma (ROL-AGENTLAR.md): GET /students, POST/DELETE /students/:id/enrollments — admin-a ham chaqiradi.
import type { FastifyInstance, FastifyRequest } from "fastify";
import { Prisma, type StudentStatus } from "@prisma/client";
import { z } from "zod";
import { prisma, type Tx } from "../../db.js";
import { auditCtx, idParam, pageQuery, paged, paginate, parse, zYmd } from "../../lib/http.js";
import { writeAudit } from "../../lib/audit.js";
import { notifyParents } from "../../lib/notify.js";
import { badRequest, conflict, notFound } from "../../lib/errors.js";
import { hashPassword, tempPassword } from "../../lib/password.js";
import {
  avgLabel,
  csvDate,
  currentPeriod,
  dateOnly,
  effectiveStatus,
  levelName,
  levelShort,
  monthRange,
  pct,
  paymentStatusWhere,
  sendCsv,
  STUDENT_STATUS_LABEL,
  PAY_STATUS_LABEL,
  todayDateOnly,
  toCsv,
  ymdOfDateOnly,
  zBool,
  zName,
  zPeriod,
  zPhoneLoose,
  zRelation,
  nextStudentCode,
} from "./b/helpers.js";

const zStatus = z.enum(["ACTIVE", "ACADEMIC_LEAVE", "GRADUATED", "LEFT"]);
const zEnrollStatus = z.enum(["ACTIVE", "WAITING"]);
const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

const listQuery = pageQuery.extend({
  // ko'rsatilmasa — ketganlardan tashqari hammasi (KPI "Jami" bilan bir xil); ALL — ketganlar bilan birga
  status: z.union([zStatus, z.literal("ALL")]).optional(),
  groupId: z.string().max(40).optional(),
  levelId: z.string().max(40).optional(),
  payment: z.enum(["PAID", "PENDING", "OVERDUE", "NONE"]).optional(),
  period: zPeriod.optional(),
  telegram: z.enum(["linked", "unlinked"]).optional(),
  sort: z.enum(["name", "code", "newest"]).default("name"),
});
type ListQuery = z.infer<typeof listQuery>;

const ACTIVE_ENR = { in: ["ACTIVE", "WAITING"] as ("ACTIVE" | "WAITING")[] };

function searchWhere(raw: string): Prisma.UserWhereInput {
  const t = raw.trim().replace(/^#/, "");
  const digits = t.replace(/\D/g, "");
  const or: Prisma.UserWhereInput[] = [
    { fullName: { contains: t, mode: "insensitive" } },
    { studentProfile: { code: { contains: t, mode: "insensitive" } } },
    { parents: { some: { parent: { fullName: { contains: t, mode: "insensitive" } } } } },
  ];
  if (digits.length >= 3) {
    or.push({ phone: { contains: digits } });
    or.push({ parents: { some: { parent: { phone: { contains: digits } } } } });
    or.push({ studentProfile: { code: { contains: digits } } });
  }
  return { OR: or };
}

// ─────────── Dublikat nazorati ───────────

const APOSTROPHES = /[ʻʼ'`‘’]/g;
/** Ism kaliti: harf kattaligi, apostrof turi (oʻ/o'), ortiqcha bo'shliq va so'zlar tartibi farq qilmaydi. */
function nameKey(s: string) {
  return s.toLowerCase().replace(APOSTROPHES, "'").split(/\s+/).filter(Boolean).sort().join(" ");
}

/**
 * Yangi o'quvchiga o'xshash yozuvlar: ism kaliti bir xil yoki o'quvchi telefoni bir xil.
 * blocking — ism bir xil + umumiy ota-ona + o'quvchi hali o'qiyapti (aniq dublikat, qo'shib bo'lmaydi).
 */
async function findDuplicates(db: Tx | typeof prisma, input: { fullName: string; phone?: string | null; parentPhones: string[] }) {
  const key = nameKey(input.fullName);
  // SQL'da oldindan saralash: ismdagi eng uzun bo'lak (apostrofsiz) uchrashi kerak, aniq solishtirish — JS'da
  const longest = key.split(/[\s']+/).sort((a, b) => b.length - a.length)[0] ?? "";
  const or: Prisma.UserWhereInput[] = [];
  if (longest.length >= 2) or.push({ fullName: { contains: longest, mode: "insensitive" } });
  if (input.phone) or.push({ phone: input.phone });
  if (!or.length) return [];
  const rows = await db.user.findMany({
    where: { role: "STUDENT", studentProfile: { isNot: null }, OR: or },
    select: {
      id: true,
      fullName: true,
      phone: true,
      studentProfile: { select: { code: true, status: true } },
      parents: { orderBy: { createdAt: "asc" }, select: { relation: true, parent: { select: { fullName: true, phone: true, login: true } } } },
    },
    take: 200,
  });
  return rows.flatMap((r) => {
    const sameName = nameKey(r.fullName) === key;
    const samePhone = !!input.phone && r.phone === input.phone;
    if (!sameName && !samePhone) return [];
    const sharedParent = r.parents.some(
      (p) => input.parentPhones.includes(p.parent.login) || (!!p.parent.phone && input.parentPhones.includes(p.parent.phone)),
    );
    const status = r.studentProfile!.status;
    return [
      {
        id: r.id,
        code: r.studentProfile!.code,
        fullName: r.fullName,
        status,
        parents: r.parents.map((p) => ({ fullName: p.parent.fullName, phone: p.parent.phone, relation: p.relation })),
        sameName,
        samePhone,
        sharedParent,
        blocking: sameName && sharedParent && (status === "ACTIVE" || status === "ACADEMIC_LEAVE"),
      },
    ];
  });
}

function listWhere(q: ListQuery): Prisma.UserWhereInput {
  const and: Prisma.UserWhereInput[] = [{ role: "STUDENT", studentProfile: { isNot: null } }];
  if (q.q) and.push(searchWhere(q.q));
  if (!q.status) and.push({ studentProfile: { status: { not: "LEFT" } } });
  else if (q.status !== "ALL") and.push({ studentProfile: { status: q.status } });
  if (q.groupId) and.push({ enrollments: { some: { groupId: q.groupId, status: ACTIVE_ENR } } });
  if (q.levelId) and.push({ enrollments: { some: { status: ACTIVE_ENR, group: { levelId: q.levelId } } } });
  if (q.telegram === "linked") and.push({ parents: { some: { parent: { telegramLink: { isActive: true } } } } });
  if (q.telegram === "unlinked") and.push({ parents: { none: { parent: { telegramLink: { isActive: true } } } } });
  if (q.payment) {
    const period = q.period ?? currentPeriod();
    if (q.payment === "NONE") and.push({ payments: { none: { period, status: { not: "CANCELLED" } } } });
    else and.push({ payments: { some: { period, ...paymentStatusWhere(q.payment) } } });
  }
  return { AND: and };
}

const listInclude = {
  studentProfile: true,
  enrollments: {
    where: { status: ACTIVE_ENR },
    orderBy: { joinedAt: "desc" as const },
    include: { group: { select: { id: true, code: true, name: true, status: true, level: { select: { code: true, name: true } } } } },
  },
  parents: {
    orderBy: { createdAt: "asc" as const },
    include: { parent: { select: { id: true, fullName: true, phone: true, isActive: true, telegramLink: { select: { isActive: true, username: true } } } } },
  },
} satisfies Prisma.UserInclude;
type ListRow = Prisma.UserGetPayload<{ include: typeof listInclude }>;

/** Bir nechta o'quvchi uchun davomat foizi (jami). */
async function attendanceMap(ids: string[], range?: { start: Date; end: Date }) {
  if (!ids.length) return new Map<string, { attended: number; total: number; percent: number | null }>();
  const rows = await prisma.attendance.groupBy({
    by: ["studentId", "status"],
    where: { studentId: { in: ids }, ...(range ? { lesson: { startsAt: { gte: range.start, lt: range.end } } } : {}) },
    _count: { _all: true },
  });
  const m = new Map<string, { attended: number; total: number; percent: number | null }>();
  for (const r of rows) {
    const cur = m.get(r.studentId) ?? { attended: 0, total: 0, percent: null };
    cur.total += r._count._all;
    if (r.status === "PRESENT" || r.status === "LATE") cur.attended += r._count._all;
    m.set(r.studentId, cur);
  }
  for (const v of m.values()) v.percent = pct(v.attended, v.total, 0);
  return m;
}

/** Davr bo'yicha umumlashgan to'lov holati (eng yomoni). */
async function paymentMap(ids: string[], period: string) {
  const m = new Map<string, { status: string; amount: number; dueDate: string | null }>();
  if (!ids.length) return m;
  const rows = await prisma.payment.findMany({
    where: { studentId: { in: ids }, period, status: { not: "CANCELLED" } },
    select: { studentId: true, status: true, dueDate: true, amount: true },
  });
  const rank: Record<string, number> = { OVERDUE: 3, PENDING: 2, PAID: 1 };
  const today = todayDateOnly();
  for (const r of rows) {
    const st = effectiveStatus(r, today);
    const cur = m.get(r.studentId);
    if (!cur || rank[st] > rank[cur.status]) m.set(r.studentId, { status: st, amount: r.amount, dueDate: ymdOfDateOnly(r.dueDate) });
  }
  return m;
}

function mapListRow(
  u: ListRow,
  att: Map<string, { attended: number; total: number; percent: number | null }>,
  pay: Map<string, { status: string; amount: number; dueDate: string | null }>,
) {
  const sp = u.studentProfile!;
  const firstGroup = u.enrollments[0]?.group;
  return {
    id: u.id,
    fullName: u.fullName,
    code: sp.code,
    status: sp.status,
    phone: u.phone,
    isActive: u.isActive,
    enrolledAt: ymdOfDateOnly(sp.enrolledAt),
    groups: u.enrollments.map((e) => ({
      id: e.group.id,
      code: e.group.code,
      name: e.group.name,
      level: levelShort(e.group.level),
      enrollmentStatus: e.status,
    })),
    level: levelShort(firstGroup?.level),
    parents: u.parents.map((p) => ({
      id: p.parent.id,
      fullName: p.parent.fullName,
      phone: p.parent.phone,
      relation: p.relation,
      telegramLinked: !!p.parent.telegramLink?.isActive,
    })),
    telegramLinked: u.parents.some((p) => p.parent.telegramLink?.isActive),
    attendance: att.get(u.id)?.percent ?? null,
    payment: pay.get(u.id) ?? null,
  };
}

const orderBy = (sort: ListQuery["sort"]): Prisma.UserOrderByWithRelationInput[] =>
  sort === "code"
    ? [{ studentProfile: { code: "asc" } }]
    : sort === "newest"
      ? [{ studentProfile: { enrolledAt: "desc" } }, { createdAt: "desc" }]
      : [{ fullName: "asc" }];

// ─────────── Guruhga yozish (POST /students va /students/:id/enrollments uchun umumiy) ───────────

async function enrollInTx(
  tx: Tx,
  req: FastifyRequest,
  student: { id: string; fullName: string },
  groupId: string,
  requested?: "ACTIVE" | "WAITING",
) {
  // guruh qatorini qulflash — sig'im tekshiruvi parallel so'rovlarda ham to'g'ri bo'lsin
  const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "Group" WHERE id = ${groupId} FOR UPDATE`;
  if (!locked.length) throw notFound("Guruh topilmadi");
  const group = await tx.group.findUniqueOrThrow({ where: { id: groupId } });
  if (group.status === "FINISHED") throw badRequest("Guruh yakunlangan — unga oʻquvchi qoʻshib boʻlmaydi");

  const existing = await tx.groupStudent.findUnique({ where: { groupId_studentId: { groupId, studentId: student.id } } });
  if (existing && existing.status !== "LEFT") throw conflict("Oʻquvchi allaqachon shu guruhda", "ALREADY_ENROLLED");

  const taken = await tx.groupStudent.count({ where: { groupId, status: ACTIVE_ENR } });
  if (taken >= group.capacity && requested !== "WAITING") {
    throw conflict(`Guruh toʻla (${taken}/${group.capacity}). Kutish roʻyxatiga qoʻshish mumkin`, "GROUP_FULL");
  }
  const status = requested ?? (group.status === "ENROLLING" ? "WAITING" : "ACTIVE");
  const today = todayDateOnly();
  const row = existing
    ? await tx.groupStudent.update({
        where: { groupId_studentId: { groupId, studentId: student.id } },
        data: { status, joinedAt: today, leftAt: null },
      })
    : await tx.groupStudent.create({ data: { groupId, studentId: student.id, status, joinedAt: today } });

  await writeAudit(tx, {
    ...auditCtx(req),
    action: "student.enroll",
    entityType: "Student",
    entityId: student.id,
    summary: `${student.fullName} → ${group.name} guruhiga qoʻshildi${status === "WAITING" ? " (kutish roʻyxati)" : ""}`,
    before: existing ? { studentId: student.id, groupId, status: existing.status } : null,
    after: { studentId: student.id, groupId, groupName: group.name, status, joinedAt: ymdOfDateOnly(today) },
  });
  await notifyParents(tx, student.id, {
    type: "enrollment.added",
    title: "Guruhga qoʻshildi",
    body: `Farzandingiz ${student.fullName} “${group.name}” guruhiga qoʻshildi${status === "WAITING" ? " (guruh boshlanishi kutilmoqda)" : ""}.`,
    link: "/ota-ona",
  });
  return {
    studentId: student.id,
    groupId,
    status: row.status,
    joinedAt: ymdOfDateOnly(row.joinedAt),
    group: { id: group.id, code: group.code, name: group.name },
    seats: { taken: taken + 1, capacity: group.capacity },
  };
}

async function getStudentOr404(id: string, db: Tx | typeof prisma = prisma) {
  const u = await db.user.findFirst({ where: { id, role: "STUDENT" }, include: { studentProfile: true } });
  if (!u || !u.studentProfile) throw notFound("Oʻquvchi topilmadi");
  return u as typeof u & { studentProfile: NonNullable<typeof u.studentProfile> };
}

// ─────────── Yaratish sxemasi ───────────

const parentInput = z.object({
  fullName: z.string().trim().max(120).optional(),
  phone: zPhoneLoose,
  relation: zRelation.default("Ota"),
});

const createBody = z.object({
  fullName: zName,
  phone: z.union([zPhoneLoose, z.literal("").transform(() => null), z.null()]).optional(),
  birthDate: zYmd.optional().nullable(),
  goal: optText(120),
  turnstileId: optText(40),
  enrolledAt: zYmd.optional(),
  parents: z.array(parentInput).min(1, "Kamida bitta ota-ona kiriting").max(3),
  groupId: z.string().max(40).optional().nullable(),
  enrollmentStatus: zEnrollStatus.optional(),
  // o'xshash (lekin aniq dublikat emas) o'quvchi topilganda admin tasdiqlagan
  allowDuplicate: z.boolean().optional(),
});

const updateBody = z
  .object({
    fullName: zName.optional(),
    phone: z.union([zPhoneLoose, z.literal("").transform(() => null), z.null()]).optional(),
    birthDate: zYmd.optional().nullable(),
    goal: optText(120),
    turnstileId: optText(40),
    enrolledAt: zYmd.optional(),
  })
  .refine((o) => Object.keys(o).length > 0, "Oʻzgartirish uchun maydon yuboring");

export default async function students(app: FastifyInstance) {
  // ── Ro'yxat (shartnoma: { items:[{id,fullName,code,status,phone,groups,parents}], total, page, pageSize, pages }) ──
  app.get("/students", async (req) => {
    const q = parse(listQuery, req.query);
    const where = listWhere(q);
    const [total, rows] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({ where, include: listInclude, orderBy: orderBy(q.sort), ...paginate(q) }),
    ]);
    const ids = rows.map((r) => r.id);
    const [att, pay] = await Promise.all([attendanceMap(ids), paymentMap(ids, q.period ?? currentPeriod())]);
    return paged(rows.map((r) => mapListRow(r, att, pay)), total, q);
  });

  // ── Forma tanlagichlari: guruhlar (band o'rinlar bilan) va leveller ──
  app.get("/students/options", async () => {
    const [groups, levels, counts] = await Promise.all([
      prisma.group.findMany({
        where: { status: { not: "FINISHED" } },
        orderBy: { code: "asc" },
        select: {
          id: true, code: true, name: true, status: true, capacity: true, monthlyFee: true, levelId: true,
          level: { select: { code: true, name: true } }, teacher: { select: { fullName: true } },
        },
      }),
      prisma.level.findMany({ orderBy: { order: "asc" }, select: { id: true, code: true, name: true } }),
      prisma.groupStudent.groupBy({ by: ["groupId"], where: { status: ACTIVE_ENR }, _count: { _all: true } }),
    ]);
    const taken = new Map(counts.map((c) => [c.groupId, c._count._all]));
    return {
      groups: groups.map((g) => ({
        id: g.id, code: g.code, name: g.name, status: g.status, capacity: g.capacity, taken: taken.get(g.id) ?? 0,
        monthlyFee: g.monthlyFee, levelId: g.levelId, level: levelShort(g.level), teacher: g.teacher?.fullName ?? null,
      })),
      levels: levels.map((l) => ({ ...l, label: levelName(l) ?? l.name })),
    };
  });

  // ── Dublikat tekshiruvi (forma to'ldirilayotganda; POST /students ham shu qoidani majburiy qo'llaydi) ──
  app.get("/students/duplicates", async (req) => {
    const q = parse(
      z.object({
        fullName: z.string().trim().min(3).max(120),
        phone: zPhoneLoose.optional(),
        parentPhones: z.string().max(200).optional(),
      }),
      req.query,
    );
    const parentPhones = parse(z.array(zPhoneLoose).max(3), (q.parentPhones ?? "").split(",").map((s) => s.trim()).filter(Boolean));
    return { items: await findDuplicates(prisma, { fullName: q.fullName, phone: q.phone, parentPhones }) };
  });

  // ── Sarlavha statistikasi ──
  app.get("/students/stats", async (req) => {
    const { period = currentPeriod() } = parse(z.object({ period: zPeriod.optional() }), req.query);
    const range = monthRange(period);
    const base: Prisma.UserWhereInput = { role: "STUDENT", studentProfile: { isNot: null } };
    const [byStatus, newThisMonth, linked, parentsUnlinked, parentsTotal, monthAtt] = await Promise.all([
      prisma.studentProfile.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.studentProfile.count({ where: { enrolledAt: { gte: dateOnly(`${period}-01`), lt: dateOnly(ymdFromDate(range.end)) } } }),
      prisma.user.count({
        where: { ...base, studentProfile: { status: { not: "LEFT" } }, parents: { some: { parent: { telegramLink: { isActive: true } } } } },
      }),
      prisma.user.count({
        where: { role: "PARENT", isActive: true, telegramLink: { is: null }, children: { some: { student: { studentProfile: { status: { not: "LEFT" } } } } } },
      }).then(async (noLink) =>
        noLink +
        (await prisma.user.count({
          where: { role: "PARENT", isActive: true, telegramLink: { isActive: false }, children: { some: { student: { studentProfile: { status: { not: "LEFT" } } } } } },
        })),
      ),
      prisma.user.count({ where: { role: "PARENT", isActive: true, children: { some: { student: { studentProfile: { status: { not: "LEFT" } } } } } } }),
      prisma.attendance.groupBy({
        by: ["status"],
        where: { lesson: { startsAt: { gte: range.start, lt: range.end } }, student: { studentProfile: { status: { not: "LEFT" } } } },
        _count: { _all: true },
      }),
    ]);
    const s: Record<StudentStatus, number> = { ACTIVE: 0, ACADEMIC_LEAVE: 0, GRADUATED: 0, LEFT: 0 };
    for (const r of byStatus) s[r.status] = r._count._all;
    const total = s.ACTIVE + s.ACADEMIC_LEAVE + s.GRADUATED;
    const attTotal = monthAtt.reduce((a, r) => a + r._count._all, 0);
    const attended = monthAtt.filter((r) => r.status === "PRESENT" || r.status === "LATE").reduce((a, r) => a + r._count._all, 0);
    return {
      period,
      total,
      byStatus: s,
      newThisMonth,
      telegram: { linked, total, percent: pct(linked, total, 0) },
      parents: { total: parentsTotal, unlinked: parentsUnlinked },
      attendanceMonth: pct(attended, attTotal, 1),
    };
  });

  // ── CSV eksport (joriy filtrlar bilan) ──
  app.get("/students/export.csv", async (req, reply) => {
    const q = parse(listQuery.omit({ page: true, pageSize: true }), req.query);
    const where = listWhere({ ...q, page: 1, pageSize: 1 });
    const rows = await prisma.user.findMany({ where, include: listInclude, orderBy: orderBy(q.sort), take: 5000 });
    const ids = rows.map((r) => r.id);
    const period = q.period ?? currentPeriod();
    const [att, pay] = await Promise.all([attendanceMap(ids), paymentMap(ids, period)]);
    const csv = toCsv(
      ["Kod", "Ism-familiya", "Holat", "Telefon", "Guruh", "Level", "Ota-ona", "Ota-ona telefoni", "Telegram", "Davomat %", `Toʻlov (${period})`, "Oʻqishga kelgan"],
      rows.map((r) => {
        const m = mapListRow(r, att, pay);
        return [
          m.code,
          m.fullName,
          STUDENT_STATUS_LABEL[m.status],
          m.phone ?? "",
          m.groups.map((g) => g.name).join("; "),
          m.level ?? "",
          m.parents.map((p) => `${p.fullName} (${p.relation})`).join("; "),
          m.parents.map((p) => p.phone ?? "").join("; "),
          m.telegramLinked ? "Ulangan" : "Ulanmagan",
          m.attendance ?? "",
          m.payment ? PAY_STATUS_LABEL[m.payment.status] : "—",
          csvDate(r.studentProfile?.enrolledAt),
        ];
      }),
    );
    return sendCsv(reply, `oquvchilar-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  });

  // ── To'liq profil ──
  app.get("/students/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const { period = currentPeriod() } = parse(z.object({ period: zPeriod.optional() }), req.query);
    const u = await prisma.user.findFirst({
      where: { id, role: "STUDENT" },
      include: {
        studentProfile: true,
        parents: {
          orderBy: { createdAt: "asc" },
          include: {
            parent: {
              select: {
                id: true, fullName: true, phone: true, login: true, isActive: true, lastLoginAt: true,
                telegramLink: { select: { isActive: true, username: true, linkedAt: true } },
              },
            },
          },
        },
        enrollments: {
          orderBy: [{ status: "asc" }, { joinedAt: "desc" }],
          include: {
            group: {
              include: {
                level: { select: { code: true, name: true } },
                teacher: { select: { id: true, fullName: true } },
                room: { select: { id: true, name: true, location: true } },
              },
            },
          },
        },
      },
    });
    if (!u || !u.studentProfile) throw notFound("Oʻquvchi topilmadi");
    const sp = u.studentProfile;
    const range = monthRange(period);
    const activeGroupIds = u.enrollments.filter((e) => e.status !== "LEFT").map((e) => e.groupId);

    const [attAll, attMonth, gradeAgg, recentGrades, hwTotal, hwDone, payments, nextLesson, audit] = await Promise.all([
      prisma.attendance.groupBy({ by: ["status"], where: { studentId: id }, _count: { _all: true } }),
      prisma.attendance.groupBy({
        by: ["status"],
        where: { studentId: id, lesson: { startsAt: { gte: range.start, lt: range.end } } },
        _count: { _all: true },
      }),
      prisma.grade.aggregate({ where: { studentId: id }, _avg: { value: true }, _count: { _all: true } }),
      prisma.grade.findMany({
        where: { studentId: id },
        orderBy: { gradedAt: "desc" },
        take: 5,
        select: { id: true, value: true, kind: true, title: true, gradedAt: true, group: { select: { name: true } } },
      }),
      prisma.homework.count({
        where: { group: { students: { some: { studentId: id } } }, dueAt: { lte: new Date() } },
      }),
      prisma.submission.count({
        where: { studentId: id, status: { in: ["SUBMITTED", "REVIEWED", "RETURNED"] }, homework: { dueAt: { lte: new Date() } } },
      }),
      prisma.payment.findMany({
        where: { studentId: id },
        orderBy: [{ period: "desc" }, { createdAt: "desc" }],
        take: 6,
        include: { group: { select: { id: true, name: true } } },
      }),
      activeGroupIds.length
        ? prisma.lesson.findFirst({
            where: { groupId: { in: activeGroupIds }, startsAt: { gte: new Date() }, status: { in: ["PLANNED", "IN_PROGRESS"] } },
            orderBy: { startsAt: "asc" },
            select: { id: true, title: true, startsAt: true, endsAt: true, group: { select: { name: true } }, room: { select: { name: true } } },
          })
        : null,
      prisma.auditLog.findMany({
        where: {
          OR: [
            { entityId: id },
            { after: { path: ["studentId"], equals: id } },
            { before: { path: ["studentId"], equals: id } },
          ],
        },
        orderBy: { id: "desc" },
        take: 10,
        select: { id: true, at: true, action: true, summary: true, actorRole: true, actor: { select: { fullName: true } } },
      }),
    ]);

    const summarize = (rows: { status: string; _count: { _all: number } }[]) => {
      const by: Record<string, number> = { PRESENT: 0, LATE: 0, EXCUSED: 0, ABSENT: 0 };
      for (const r of rows) by[r.status] = r._count._all;
      const total = by.PRESENT + by.LATE + by.EXCUSED + by.ABSENT;
      const attended = by.PRESENT + by.LATE;
      return { attended, total, percent: pct(attended, total, 0), byStatus: by };
    };
    const avg = gradeAgg._avg.value != null ? Math.round(gradeAgg._avg.value * 10) / 10 : null;
    const today = todayDateOnly();
    const currentPay = payments.filter((p) => p.period === period && p.status !== "CANCELLED");
    const active = u.enrollments.find((e) => e.status !== "LEFT");

    return {
      id: u.id,
      fullName: u.fullName,
      login: u.login,
      phone: u.phone,
      isActive: u.isActive,
      mustChangePassword: u.mustChangePassword,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      code: sp.code,
      status: sp.status,
      birthDate: ymdOfDateOnly(sp.birthDate),
      goal: sp.goal,
      turnstileId: sp.turnstileId,
      enrolledAt: ymdOfDateOnly(sp.enrolledAt),
      leftAt: ymdOfDateOnly(sp.leftAt),
      level: levelName(active?.group.level),
      groups: u.enrollments.map((e) => ({
        id: e.group.id,
        code: e.group.code,
        name: e.group.name,
        level: levelName(e.group.level),
        teacher: e.group.teacher,
        room: e.group.room,
        days: e.group.days,
        startTime: e.group.startTime,
        endTime: e.group.endTime,
        monthlyFee: e.group.monthlyFee,
        groupStatus: e.group.status,
        enrollmentStatus: e.status,
        joinedAt: ymdOfDateOnly(e.joinedAt),
        leftAt: ymdOfDateOnly(e.leftAt),
      })),
      parents: u.parents.map((p) => ({
        id: p.parent.id,
        fullName: p.parent.fullName,
        phone: p.parent.phone,
        login: p.parent.login,
        relation: p.relation,
        isActive: p.parent.isActive,
        lastLoginAt: p.parent.lastLoginAt,
        telegram: p.parent.telegramLink
          ? { linked: p.parent.telegramLink.isActive, username: p.parent.telegramLink.username, linkedAt: p.parent.telegramLink.linkedAt }
          : { linked: false, username: null, linkedAt: null },
      })),
      attendance: { total: summarize(attAll), month: summarize(attMonth), period },
      grades: {
        average: avg,
        label: avgLabel(avg),
        count: gradeAgg._count._all,
        recent: recentGrades.map((g) => ({ id: g.id, value: g.value, kind: g.kind, title: g.title, gradedAt: g.gradedAt, group: g.group.name })),
      },
      homework: { done: Math.min(hwDone, hwTotal), total: hwTotal, percent: pct(Math.min(hwDone, hwTotal), hwTotal, 0) },
      coins: { balance: sp.coinBalance, streakDays: sp.streakDays },
      payment: {
        period,
        status: currentPay.length
          ? currentPay.map((p) => effectiveStatus(p, today)).sort((a, b) => (["OVERDUE", "PENDING", "PAID"].indexOf(a) - ["OVERDUE", "PENDING", "PAID"].indexOf(b)))[0]
          : null,
      },
      payments: payments.map((p) => ({
        id: p.id,
        period: p.period,
        amount: p.amount,
        status: effectiveStatus(p, today),
        dueDate: ymdOfDateOnly(p.dueDate),
        paidAt: p.paidAt,
        method: p.method,
        receiptNo: p.receiptNo,
        group: p.group,
      })),
      nextLesson,
      audit: audit.map((a) => ({ ...a, id: a.id.toString() })),
    };
  });

  // ── Yaratish: o'quvchi + ota-ona(lar) + ixtiyoriy guruh — bitta tranzaksiya ──
  app.post("/students", async (req) => {
    const body = parse(createBody, req.body);
    const phones = body.parents.map((p) => p.phone);
    if (new Set(phones).size !== phones.length) throw badRequest("Ota-onalar telefon raqamlari takrorlanmasin");
    if (body.phone && phones.includes(body.phone)) throw badRequest("Oʻquvchi va ota-ona telefoni bir xil boʻlmasin");

    // Mavjud ota-onalarni oldindan aniqlash (parol xeshini tranzaksiyadan tashqarida hisoblash uchun)
    const existingUsers = await prisma.user.findMany({ where: { login: { in: phones } }, select: { id: true, login: true, role: true, fullName: true } });
    for (const eu of existingUsers) {
      if (eu.role !== "PARENT") throw conflict(`${eu.login} raqami boshqa akkauntga (${eu.role === "TEACHER" ? "ustoz" : eu.role === "ADMIN" ? "admin" : "oʻquvchi"}) tegishli`, "LOGIN_TAKEN");
    }
    const newParents = body.parents.filter((p) => !existingUsers.some((eu) => eu.login === p.phone));
    for (const p of newParents) if (!p.fullName || p.fullName.length < 3) throw badRequest(`${p.phone} uchun ota-ona ism-familiyasini kiriting`);
    if (body.turnstileId && (await prisma.studentProfile.findUnique({ where: { turnstileId: body.turnstileId } }))) {
      throw conflict("Bu turniket ID boshqa oʻquvchiga biriktirilgan", "TURNSTILE_TAKEN");
    }

    const studentPw = tempPassword();
    const studentHash = await hashPassword(studentPw);
    const parentPw = new Map<string, { pw: string; hash: string }>();
    for (const p of newParents) {
      const pw = tempPassword();
      parentPw.set(p.phone, { pw, hash: await hashPassword(pw) });
    }

    const result = await prisma.$transaction(async (tx) => {
      const code = await nextStudentCode(tx);
      // Dublikat nazorati — nextStudentCode qulfi ostida, parallel so'rovlar ham ikki nusxa yarata olmaydi
      const dups = await findDuplicates(tx, { fullName: body.fullName, phone: body.phone, parentPhones: phones });
      const exact = dups.find((d) => d.blocking);
      if (exact) throw conflict(`${exact.fullName} (#${exact.code}) shu ota-ona bilan allaqachon roʻyxatda — qayta qoʻshilmaydi`, "DUPLICATE_STUDENT");
      if (dups.length && !body.allowDuplicate) {
        throw conflict(
          `Oʻxshash oʻquvchi bor: ${dups.map((d) => `${d.fullName} (#${d.code})`).join(", ")}. Boshqa oʻquvchi boʻlsa, tasdiqlab qayta yuboring`,
          "POSSIBLE_DUPLICATE",
        );
      }
      const student = await tx.user.create({
        data: {
          login: code,
          passwordHash: studentHash,
          role: "STUDENT",
          fullName: body.fullName,
          phone: body.phone ?? null,
          title: "Oʻquvchi",
          mustChangePassword: true,
          studentProfile: {
            create: {
              code,
              birthDate: body.birthDate ? dateOnly(body.birthDate) : null,
              goal: body.goal,
              turnstileId: body.turnstileId,
              enrolledAt: body.enrolledAt ? dateOnly(body.enrolledAt) : todayDateOnly(),
            },
          },
        },
      });

      const credentials: {
        role: "STUDENT" | "PARENT"; userId: string; fullName: string; login: string; password: string | null; existing: boolean; relation?: string;
      }[] = [{ role: "STUDENT", userId: student.id, fullName: student.fullName, login: code, password: studentPw, existing: false }];

      const parentsAudit: unknown[] = [];
      for (const p of body.parents) {
        let parent = await tx.user.findUnique({ where: { login: p.phone } });
        let created = false;
        if (parent && parent.role !== "PARENT") throw conflict(`${p.phone} raqami boshqa akkauntga tegishli`, "LOGIN_TAKEN");
        if (!parent) {
          const secret = parentPw.get(p.phone)!;
          parent = await tx.user.create({
            data: {
              login: p.phone, passwordHash: secret.hash, role: "PARENT", fullName: p.fullName!, phone: p.phone,
              title: p.relation, mustChangePassword: true,
            },
          });
          created = true;
          await writeAudit(tx, {
            ...auditCtx(req), action: "parent.create", entityType: "User", entityId: parent.id,
            summary: `Ota-ona akkaunti yaratildi: ${parent.fullName} (${p.phone})`,
            after: { id: parent.id, login: parent.login, fullName: parent.fullName, phone: parent.phone, role: "PARENT", studentId: student.id },
          });
        }
        await tx.parentStudent.create({ data: { parentId: parent.id, studentId: student.id, relation: p.relation } });
        parentsAudit.push({ id: parent.id, fullName: parent.fullName, phone: parent.phone, relation: p.relation, created });
        credentials.push({
          role: "PARENT", userId: parent.id, fullName: parent.fullName, login: parent.login,
          password: created ? parentPw.get(p.phone)!.pw : null, existing: !created, relation: p.relation,
        });
      }

      await writeAudit(tx, {
        ...auditCtx(req),
        action: "student.create",
        entityType: "Student",
        entityId: student.id,
        summary: `Yangi oʻquvchi: ${student.fullName} (${code})`,
        after: {
          studentId: student.id, code, fullName: student.fullName, phone: student.phone, birthDate: body.birthDate ?? null,
          goal: body.goal, turnstileId: body.turnstileId, parents: parentsAudit, groupId: body.groupId ?? null,
          ...(dups.length ? { confirmedDuplicateOf: dups.map((d) => d.code) } : {}),
        },
      });

      const enrollment = body.groupId ? await enrollInTx(tx, req, student, body.groupId, body.enrollmentStatus) : null;
      return { student: { id: student.id, code, fullName: student.fullName }, credentials, enrollment };
    });
    return result;
  });

  // ── Tahrirlash ──
  app.put("/students/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(updateBody, req.body);
    return prisma.$transaction(async (tx) => {
      const u = await getStudentOr404(id, tx);
      if (body.turnstileId && body.turnstileId !== u.studentProfile.turnstileId) {
        const clash = await tx.studentProfile.findUnique({ where: { turnstileId: body.turnstileId } });
        if (clash) throw conflict("Bu turniket ID boshqa oʻquvchiga biriktirilgan", "TURNSTILE_TAKEN");
      }
      const before = {
        fullName: u.fullName, phone: u.phone, birthDate: ymdOfDateOnly(u.studentProfile.birthDate), goal: u.studentProfile.goal,
        turnstileId: u.studentProfile.turnstileId, enrolledAt: ymdOfDateOnly(u.studentProfile.enrolledAt),
      };
      const after = {
        fullName: body.fullName ?? before.fullName,
        phone: body.phone !== undefined ? body.phone : before.phone,
        birthDate: body.birthDate !== undefined ? body.birthDate : before.birthDate,
        goal: body.goal !== undefined ? body.goal : before.goal,
        turnstileId: body.turnstileId !== undefined ? body.turnstileId : before.turnstileId,
        enrolledAt: body.enrolledAt ?? before.enrolledAt,
      };
      await tx.user.update({
        where: { id },
        data: {
          fullName: after.fullName,
          phone: after.phone,
          studentProfile: {
            update: {
              birthDate: after.birthDate ? dateOnly(after.birthDate) : null,
              goal: after.goal,
              turnstileId: after.turnstileId,
              enrolledAt: after.enrolledAt ? dateOnly(after.enrolledAt) : undefined,
            },
          },
        },
      });
      const changedKeys = (Object.keys(after) as (keyof typeof after)[]).filter((k) => after[k] !== before[k]);
      if (changedKeys.length) {
        await writeAudit(tx, {
          ...auditCtx(req), action: "student.update", entityType: "Student", entityId: id,
          summary: `${after.fullName} maʼlumotlari tahrirlandi (${changedKeys.join(", ")})`,
          before: { studentId: id, ...Object.fromEntries(changedKeys.map((k) => [k, before[k]])) },
          after: { studentId: id, ...Object.fromEntries(changedKeys.map((k) => [k, after[k]])) },
        });
      }
      return { id, ...after, changed: changedKeys };
    });
  });

  // ── Holat: ACTIVE / ACADEMIC_LEAVE / GRADUATED / LEFT ──
  app.post("/students/:id/status", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(z.object({ status: zStatus, date: zYmd.optional(), note: z.string().trim().max(500).optional() }), req.body);
    return prisma.$transaction(async (tx) => {
      const u = await getStudentOr404(id, tx);
      const prev = u.studentProfile.status;
      if (prev === body.status) throw badRequest("Holat oʻzgarmadi");
      const date = body.date ? dateOnly(body.date) : todayDateOnly();
      const closing = body.status === "LEFT" || body.status === "GRADUATED";
      let closed: { groupId: string; name: string }[] = [];
      if (closing) {
        const open = await tx.groupStudent.findMany({ where: { studentId: id, status: ACTIVE_ENR }, include: { group: { select: { name: true } } } });
        closed = open.map((e) => ({ groupId: e.groupId, name: e.group.name }));
        await tx.groupStudent.updateMany({ where: { studentId: id, status: ACTIVE_ENR }, data: { status: "LEFT", leftAt: date } });
      }
      await tx.studentProfile.update({ where: { userId: id }, data: { status: body.status, leftAt: closing ? date : null } });
      await writeAudit(tx, {
        ...auditCtx(req), action: "student.status", entityType: "Student", entityId: id,
        summary: `${u.fullName}: holat «${STUDENT_STATUS_LABEL[prev]}» → «${STUDENT_STATUS_LABEL[body.status]}»${body.note ? ` — ${body.note}` : ""}`,
        before: { studentId: id, status: prev, leftAt: ymdOfDateOnly(u.studentProfile.leftAt) },
        after: { studentId: id, status: body.status, date: ymdOfDateOnly(date), note: body.note ?? null, closedEnrollments: closed },
      });
      return { id, status: body.status, leftAt: closing ? ymdOfDateOnly(date) : null, closedEnrollments: closed };
    });
  });

  // ── Parolni tiklash (vaqtinchalik parol faqat shu javobda) ──
  app.post("/students/:id/reset-password", async (req) => {
    const { id } = parse(idParam, req.params);
    const u = await getStudentOr404(id);
    const pw = tempPassword();
    const hash = await hashPassword(pw);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { passwordHash: hash, mustChangePassword: true } });
      await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      await writeAudit(tx, {
        ...auditCtx(req), action: "student.reset_password", entityType: "User", entityId: id,
        summary: `${u.fullName} (${u.login}) paroli tiklandi`,
        after: { studentId: id, mustChangePassword: true, sessionsRevoked: true },
      });
    });
    return { userId: id, fullName: u.fullName, login: u.login, password: pw };
  });

  // ── Guruhga qo'shish (shartnoma) ──
  app.post("/students/:id/enrollments", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(z.object({ groupId: z.string().min(1).max(40), status: zEnrollStatus.optional() }), req.body);
    return prisma.$transaction(async (tx) => {
      const u = await getStudentOr404(id, tx);
      if (u.studentProfile.status === "LEFT" || u.studentProfile.status === "GRADUATED") {
        throw badRequest("Ketgan yoki bitirgan oʻquvchini guruhga qoʻshib boʻlmaydi — avval holatini «Faol» qiling");
      }
      return enrollInTx(tx, req, u, body.groupId, body.status);
    });
  });

  // ── Guruhdan chiqarish (shartnoma) ──
  app.delete("/students/:id/enrollments/:groupId", async (req) => {
    const { id, groupId } = parse(z.object({ id: z.string().min(1).max(40), groupId: z.string().min(1).max(40) }), req.params);
    return prisma.$transaction(async (tx) => {
      const u = await getStudentOr404(id, tx);
      const e = await tx.groupStudent.findUnique({ where: { groupId_studentId: { groupId, studentId: id } }, include: { group: { select: { name: true } } } });
      if (!e || e.status === "LEFT") throw notFound("Oʻquvchi bu guruhda emas");
      const today = todayDateOnly();
      await tx.groupStudent.update({ where: { groupId_studentId: { groupId, studentId: id } }, data: { status: "LEFT", leftAt: today } });
      await writeAudit(tx, {
        ...auditCtx(req), action: "student.unenroll", entityType: "Student", entityId: id,
        summary: `${u.fullName} ${e.group.name} guruhidan chiqarildi`,
        before: { studentId: id, groupId, status: e.status },
        after: { studentId: id, groupId, groupName: e.group.name, status: "LEFT", leftAt: ymdOfDateOnly(today) },
      });
      return { studentId: id, groupId, status: "LEFT", leftAt: ymdOfDateOnly(today) };
    });
  });
}

function ymdFromDate(d: Date) {
  // monthRange().end — Toshkent yarim tuni (UTC 19:00 oldingi kun) → "YYYY-MM-DD"
  return new Date(d.getTime() + 5 * 3600_000).toISOString().slice(0, 10);
}

