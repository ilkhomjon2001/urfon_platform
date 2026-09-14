// Xabarlar xizmati — barcha rollar uchun umumiy (routes/messages.ts orqali).
import type { Role } from "@prisma/client";
import { prisma } from "../db.js";
import type { AuthUser } from "./auth.js";
import { assertParentChild, assertTeacherStudent, assertThreadParticipant, canMessage } from "./access.js";
import { badRequest, forbidden, notFound } from "./errors.js";
import { notify } from "./notify.js";
import { attachFiles } from "./storage.js";

const userSel = { id: true, fullName: true, role: true, title: true, avatarUrl: true } as const;

export const inboxLink = (role: Role, threadId: string) =>
  role === "TEACHER" ? `/ustoz/xabarlar?t=${threadId}`
  : role === "PARENT" ? `/ota-ona/aloqa?t=${threadId}`
  : role === "STUDENT" ? `/oquvchi/chat?t=${threadId}`
  : undefined;

export async function unreadThreadCount(userId: string) {
  const [r] = await prisma.$queryRaw<{ n: number }[]>`
    SELECT count(*)::int AS n FROM "ThreadParticipant" tp
    WHERE tp."userId" = ${userId} AND EXISTS (
      SELECT 1 FROM "Message" m WHERE m."threadId" = tp."threadId" AND m."senderId" <> ${userId}
      AND (tp."lastReadAt" IS NULL OR m."createdAt" > tp."lastReadAt"))`;
  return r?.n ?? 0;
}

/** O'qilmagan xabarlar soni (sidebar badge'i uchun). */
export async function unreadMessageCount(userId: string) {
  const [r] = await prisma.$queryRaw<{ n: number }[]>`
    SELECT count(*)::int AS n FROM "Message" m
    JOIN "ThreadParticipant" tp ON tp."threadId" = m."threadId" AND tp."userId" = ${userId}
    WHERE m."senderId" <> ${userId} AND (tp."lastReadAt" IS NULL OR m."createdAt" > tp."lastReadAt")`;
  return r?.n ?? 0;
}

export async function listThreads(userId: string) {
  const threads = await prisma.thread.findMany({
    where: { participants: { some: { userId } } },
    orderBy: { lastMessageAt: "desc" },
    take: 200,
    include: {
      participants: { include: { user: { select: userSel } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true, senderId: true } },
      group: { select: { id: true, name: true } },
    },
  });
  const unread = await prisma.$queryRaw<{ threadId: string; n: number }[]>`
    SELECT m."threadId", count(*)::int AS n FROM "Message" m
    JOIN "ThreadParticipant" tp ON tp."threadId" = m."threadId" AND tp."userId" = ${userId}
    WHERE m."senderId" <> ${userId} AND (tp."lastReadAt" IS NULL OR m."createdAt" > tp."lastReadAt")
    GROUP BY m."threadId"`;
  const unreadMap = new Map(unread.map((u) => [u.threadId, u.n]));
  const studentIds = [...new Set(threads.map((t) => t.studentId).filter(Boolean))] as string[];
  const students = await prisma.user.findMany({ where: { id: { in: studentIds } }, select: { id: true, fullName: true } });
  const sMap = new Map(students.map((s) => [s.id, s.fullName]));

  return threads.map((t) => {
    // e'lon kanalida boshqa ota-onalar ro'yxati oshkor qilinmaydi
    const others = t.participants
      .filter((p) => p.userId !== userId && !(t.kind === "GROUP" && p.user.role === "PARENT"))
      .map((p) => p.user);
    return {
      id: t.id,
      kind: t.kind,
      subject: t.subject,
      title: t.kind === "GROUP" ? (t.subject ?? t.group?.name ?? "Guruh") : (others[0]?.fullName ?? "Suhbat"),
      participants: others,
      group: t.group,
      student: t.studentId ? { id: t.studentId, fullName: sMap.get(t.studentId) ?? "" } : null,
      lastMessage: t.messages[0] ?? null,
      lastMessageAt: t.lastMessageAt,
      unread: unreadMap.get(t.id) ?? 0,
    };
  });
}

export async function getThreadMessages(userId: string, threadId: string, opts: { before?: Date; limit?: number } = {}) {
  await assertThreadParticipant(userId, threadId);
  const messages = await prisma.message.findMany({
    where: { threadId, ...(opts.before ? { createdAt: { lt: opts.before } } : {}) },
    orderBy: { createdAt: "desc" },
    take: Math.min(opts.limit ?? 50, 200),
    include: {
      sender: { select: userSel },
      files: { select: { id: true, originalName: true, mime: true, size: true } },
      lesson: { select: { id: true, title: true, startsAt: true } },
    },
  });
  await prisma.threadParticipant.update({ where: { threadId_userId: { threadId, userId } }, data: { lastReadAt: new Date() } });
  return messages.reverse();
}

export type SendInput = { body: string; lessonId?: string | null; isQuestion?: boolean; fileIds?: string[] };

/**
 * Xabarga biriktirilgan kontekst (qaysi farzand / qaysi dars) yuboruvchiga tegishli ekanini tekshiradi:
 * ota-ona — faqat o'z farzandi va uning guruhidagi dars; ustoz — o'z o'quvchisi va o'z guruhi darsi;
 * o'quvchi — faqat o'zi va o'z guruhi darsi. Aks holda 404.
 */
async function assertMessageContext(auth: AuthUser, studentId?: string | null, lessonId?: string | null, toUserId?: string) {
  if (studentId) {
    if (auth.role === "PARENT") {
      await assertParentChild(auth.userId, studentId);
      // farzand haqidagi suhbat faqat unga dars beradigan ustoz bilan
      if (toUserId) {
        const to = await prisma.user.findUnique({ where: { id: toUserId }, select: { role: true } });
        if (to?.role === "TEACHER" && !(await prisma.groupStudent.findFirst({ where: { studentId, group: { teacherId: toUserId } } }))) {
          throw notFound("Bu ustoz farzandingizga dars bermaydi");
        }
      }
    }
    else if (auth.role === "TEACHER") await assertTeacherStudent(auth.userId, studentId);
    else if (auth.role === "STUDENT" && studentId !== auth.userId) throw notFound("Oʻquvchi topilmadi");
  }
  if (lessonId) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { groupId: true, group: { select: { teacherId: true } } } });
    if (!lesson) throw notFound("Dars topilmadi");
    let ok = auth.role === "ADMIN";
    if (auth.role === "TEACHER") ok = lesson.group.teacherId === auth.userId;
    if (auth.role === "STUDENT") {
      ok = !!(await prisma.groupStudent.findFirst({ where: { groupId: lesson.groupId, studentId: auth.userId } }));
    }
    if (auth.role === "PARENT") {
      ok = !!(await prisma.groupStudent.findFirst({
        where: { groupId: lesson.groupId, ...(studentId ? { studentId } : {}), student: { parents: { some: { parentId: auth.userId } } } },
      }));
    }
    if (!ok) throw notFound("Dars topilmadi");
  }
}

export async function sendMessage(auth: AuthUser, threadId: string, input: SendInput) {
  await assertThreadParticipant(auth.userId, threadId);
  const thread = await prisma.thread.findUniqueOrThrow({ where: { id: threadId }, include: { participants: { include: { user: { select: { id: true, role: true } } } } } });
  if (thread.kind === "GROUP" && !(auth.role === "TEACHER" || auth.role === "ADMIN")) {
    throw forbidden("Bu eʼlonlar kanali — javobni ustozga shaxsiy xabar orqali yozing");
  }
  const body = input.body.trim();
  if (!body && !input.fileIds?.length) throw badRequest("Xabar boʻsh");
  await assertMessageContext(auth, thread.studentId, input.lessonId);
  const msg = await prisma.$transaction(async (tx) => {
    const m = await tx.message.create({
      data: { threadId, senderId: auth.userId, body, lessonId: input.lessonId ?? null, isQuestion: !!input.isQuestion },
    });
    if (input.fileIds?.length) await attachFiles(tx, input.fileIds, auth.userId, { messageId: m.id });
    await tx.thread.update({ where: { id: threadId }, data: { lastMessageAt: m.createdAt } });
    await tx.threadParticipant.update({ where: { threadId_userId: { threadId, userId: auth.userId } }, data: { lastReadAt: m.createdAt } });
    for (const p of thread.participants) {
      if (p.userId === auth.userId) continue;
      await notify(tx, {
        userId: p.userId,
        type: "message.new",
        title: `${auth.fullName}dan yangi xabar`,
        body: body.slice(0, 300) || "Fayl yuborildi",
        link: inboxLink(p.user.role, threadId),
      });
    }
    return m;
  });
  return prisma.message.findUniqueOrThrow({
    where: { id: msg.id },
    include: { sender: { select: userSel }, files: { select: { id: true, originalName: true, mime: true, size: true } } },
  });
}

/** Yangi suhbat (yoki mavjud DIRECT suhbatni qayta ishlatish) va birinchi xabar. */
export async function startThread(
  auth: AuthUser,
  input: SendInput & { toUserId: string; studentId?: string | null; subject?: string | null },
) {
  if (!(await canMessage(auth, input.toUserId))) throw forbidden("Bu foydalanuvchiga xabar yozish mumkin emas");
  await assertMessageContext(auth, input.studentId, input.lessonId, input.toUserId);
  const existing = await prisma.thread.findFirst({
    where: {
      kind: "DIRECT",
      studentId: input.studentId ?? null,
      AND: [{ participants: { some: { userId: auth.userId } } }, { participants: { some: { userId: input.toUserId } } }],
    },
  });
  const thread =
    existing ??
    (await prisma.thread.create({
      data: {
        kind: "DIRECT",
        subject: input.subject ?? null,
        studentId: input.studentId ?? null,
        participants: { create: [{ userId: auth.userId }, { userId: input.toUserId }] },
      },
    }));
  const message = await sendMessage(auth, thread.id, input);
  return { threadId: thread.id, message };
}

/** Kim bilan yozishish mumkin (yangi suhbat oynasi uchun). */
export async function listContacts(auth: AuthUser) {
  const { userId, role } = auth;
  const admins = () =>
    prisma.user.findMany({ where: { role: "ADMIN", isActive: true, id: { not: userId } }, select: userSel, orderBy: { fullName: "asc" } });
  if (role === "TEACHER") {
    const students = await prisma.user.findMany({
      where: { role: "STUDENT", isActive: true, enrollments: { some: { group: { teacherId: userId } } } },
      select: { ...userSel, enrollments: { where: { group: { teacherId: userId } }, select: { group: { select: { id: true, name: true } } } }, parents: { select: { relation: true, parent: { select: userSel } } } },
      orderBy: { fullName: "asc" },
    });
    const parents = students.flatMap((s) =>
      s.parents.map((p) => ({ ...p.parent, about: { studentId: s.id, studentName: s.fullName, relation: p.relation }, group: s.enrollments[0]?.group ?? null })),
    );
    return {
      parents,
      students: students.map(({ parents: _p, enrollments, ...s }) => ({ ...s, group: enrollments[0]?.group ?? null })),
      admins: await admins(),
    };
  }
  if (role === "PARENT") {
    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER", isActive: true, teachingGroups: { some: { students: { some: { student: { parents: { some: { parentId: userId } } } } } } } },
      select: { ...userSel, teacherProfile: { select: { responseTime: true } }, teachingGroups: { where: { students: { some: { student: { parents: { some: { parentId: userId } } } } } }, select: { id: true, name: true } } },
    });
    return { teachers, admins: await admins() };
  }
  if (role === "STUDENT") {
    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER", isActive: true, teachingGroups: { some: { students: { some: { studentId: userId } } } } },
      select: { ...userSel, teachingGroups: { where: { students: { some: { studentId: userId } } }, select: { id: true, name: true } } },
    });
    return { teachers };
  }
  const teachers = await prisma.user.findMany({ where: { role: "TEACHER", isActive: true }, select: userSel, orderBy: { fullName: "asc" } });
  return { teachers, admins: await admins() };
}
