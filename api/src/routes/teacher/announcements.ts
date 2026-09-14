// Ustoz → guruh ota-onalariga e'lon. Har guruh uchun bitta GROUP thread (ustoz + faol o'quvchilarning
// ota-onalari). Har e'londa yangi yozilgan o'quvchilarning ota-onalari qo'shiladi. Yuborish lib/messaging
// orqali (bildirishnoma — message.new — o'sha yerda, bot Telegram'ga yetkazadi). Ota-ona faqat o'qiydi.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { auditCtx, parse } from "../../lib/http.js";
import { assertTeacherGroup, teacherGroupIds } from "../../lib/access.js";
import { writeAudit } from "../../lib/audit.js";
import { sendMessage } from "../../lib/messaging.js";

const zId = z.string().min(1).max(40);

/** Guruh faol o'quvchilarining ota-onalari (takrorlanmas). */
async function groupParentIds(groupId: string) {
  const links = await prisma.parentStudent.findMany({
    where: { student: { enrollments: { some: { groupId, status: "ACTIVE" } } }, parent: { isActive: true } },
    select: { parentId: true },
  });
  return [...new Set(links.map((l) => l.parentId))];
}

/** GROUP thread'ni topadi yoki yaratadi va ishtirokchilarni sinxronlaydi (ustoz + ota-onalar). */
async function ensureGroupThread(teacherId: string, group: { id: string; name: string }) {
  const parentIds = await groupParentIds(group.id);
  let thread = await prisma.thread.findFirst({ where: { kind: "GROUP", groupId: group.id }, orderBy: { createdAt: "asc" } });
  if (!thread) {
    thread = await prisma.thread.create({
      data: { kind: "GROUP", groupId: group.id, subject: `${group.name} — eʼlonlar` },
    });
  }
  await prisma.threadParticipant.createMany({
    data: [teacherId, ...parentIds].map((userId) => ({ threadId: thread.id, userId })),
    skipDuplicates: true,
  });
  return { thread, parentIds };
}

export default async function announcements(app: FastifyInstance) {
  // Guruhlar ro'yxati (e'lon yozish oynasi va xabarlar sahifasidagi "Guruh profili" uchun)
  app.get("/announcements/groups", async (req) => {
    const me = req.auth.userId;
    const groups = await prisma.group.findMany({
      where: { teacherId: me },
      orderBy: [{ status: "asc" }, { code: "asc" }],
      select: {
        id: true, code: true, name: true, status: true, days: true, startTime: true, endTime: true,
        level: { select: { id: true, code: true, name: true } },
        room: { select: { id: true, name: true, location: true } },
        threads: { where: { kind: "GROUP" }, select: { id: true, lastMessageAt: true, _count: { select: { messages: true } } }, orderBy: { createdAt: "asc" }, take: 1 },
      },
    });
    const out = [];
    for (const g of groups) {
      const [activeStudents, parentIds] = await Promise.all([
        prisma.groupStudent.count({ where: { groupId: g.id, status: "ACTIVE" } }),
        groupParentIds(g.id),
      ]);
      const telegram = parentIds.length ? await prisma.telegramLink.count({ where: { userId: { in: parentIds }, isActive: true } }) : 0;
      const t = g.threads[0];
      const { threads: _t, ...rest } = g;
      out.push({
        ...rest,
        activeStudents,
        parents: parentIds.length,
        parentsTelegram: telegram,
        threadId: t?.id ?? null,
        announcements: t?._count.messages ?? 0,
        lastAnnouncementAt: t && t._count.messages ? t.lastMessageAt : null,
      });
    }
    return out;
  });

  // E'lonlar tarixi (o'z guruhlari), o'qilganlik bilan
  app.get("/announcements", async (req) => {
    const q = parse(z.object({ groupId: zId.optional(), limit: z.coerce.number().int().min(1).max(100).default(30) }), req.query);
    const me = req.auth.userId;
    if (q.groupId) await assertTeacherGroup(me, q.groupId);
    const gids = q.groupId ? [q.groupId] : await teacherGroupIds(me);
    const threads = await prisma.thread.findMany({
      where: { kind: "GROUP", groupId: { in: gids } },
      select: { id: true, group: { select: { id: true, code: true, name: true } }, participants: { select: { userId: true, lastReadAt: true } } },
    });
    const tMap = new Map(threads.map((t) => [t.id, t]));
    const msgs = await prisma.message.findMany({
      where: { threadId: { in: threads.map((t) => t.id) } },
      orderBy: { createdAt: "desc" },
      take: q.limit,
      include: {
        sender: { select: { id: true, fullName: true } },
        files: { select: { id: true, originalName: true, mime: true, size: true } },
      },
    });
    return msgs.map((m) => {
      const t = tMap.get(m.threadId)!;
      const others = t.participants.filter((p) => p.userId !== m.senderId);
      return {
        id: m.id,
        threadId: m.threadId,
        body: m.body,
        createdAt: m.createdAt,
        sender: m.sender,
        files: m.files,
        group: t.group,
        recipients: others.length,
        readCount: others.filter((p) => p.lastReadAt && p.lastReadAt >= m.createdAt).length,
      };
    });
  });

  app.post("/announcements", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (req, reply) => {
    const body = parse(
      z.object({
        groupId: zId,
        body: z.string().trim().max(4000).default(""),
        fileIds: z.array(zId).max(5).default([]),
      }),
      req.body,
    );
    if (!body.body && !body.fileIds.length) return reply.code(400).send({ error: { code: "VALIDATION", message: "Eʼlon matni boʻsh" } });
    const me = req.auth.userId;
    const group = await assertTeacherGroup(me, body.groupId);
    const { thread, parentIds } = await ensureGroupThread(me, group);
    const message = await sendMessage(req.auth, thread.id, { body: body.body, fileIds: body.fileIds });
    await writeAudit(prisma, {
      ...auditCtx(req),
      action: "announcement.create",
      entityType: "Message",
      entityId: message.id,
      summary: `${group.name}: ota-onalarga eʼlon yuborildi (${parentIds.length} ta)`,
      after: { threadId: thread.id, groupId: group.id, recipients: parentIds.length, body: body.body.slice(0, 500), files: body.fileIds.length },
    });
    reply.code(201);
    return { threadId: thread.id, recipients: parentIds.length, message };
  });
}
