// GET /api/parent/homework?studentId=&status=open|submitted|reviewed|returned|missed|all
// Ota-ona uchun faqat o'qish: farzandning uyga vazifalari va ularning holati.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { parse } from "../../lib/http.js";
import { childHomeworkWhere, childQuery, loadChild, teacherDto, teacherSel } from "./common.js";

const STATES = ["open", "submitted", "reviewed", "returned", "missed"] as const;
type HwState = (typeof STATES)[number];

const query = childQuery.extend({ status: z.enum([...STATES, "all"]).default("all") });
const fileSel = { id: true, originalName: true, mime: true, size: true } as const;

export default async function homework(app: FastifyInstance) {
  app.get("/homework", async (req) => {
    const q = parse(query, req.query);
    const child = await loadChild(req.auth.userId, q.studentId);
    const now = new Date();

    const rows = await prisma.homework.findMany({
      where: childHomeworkWhere(child, { createdAt: { lte: now } }),
      orderBy: { dueAt: "desc" },
      take: 300,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        dueAt: true,
        createdAt: true,
        coinReward: true,
        group: { select: { id: true, name: true } },
        lesson: { select: { id: true, title: true, startsAt: true } },
        topic: { select: { unit: true, title: true } },
        createdBy: { select: teacherSel },
        files: { select: fileSel },
        submissions: {
          where: { studentId: child.id },
          select: {
            id: true, status: true, submittedAt: true, isLate: true, score: true, feedback: true, reviewedAt: true, coinsAwarded: true, updatedAt: true,
            reviewer: { select: { fullName: true } },
            files: { select: fileSel },
          },
        },
      },
    });

    const items = rows.map((h) => {
      const s = h.submissions[0] ?? null;
      const state: HwState =
        s?.status === "REVIEWED" ? "reviewed"
        : s?.status === "RETURNED" ? "returned"
        : s?.status === "SUBMITTED" ? "submitted"
        : h.dueAt > now ? "open"
        : "missed";
      return {
        id: h.id,
        title: h.title,
        description: h.description,
        type: h.type,
        dueAt: h.dueAt,
        createdAt: h.createdAt,
        coinReward: h.coinReward,
        group: h.group,
        lesson: h.lesson,
        topic: h.topic,
        teacher: teacherDto(h.createdBy),
        files: h.files,
        state,
        hasDraft: s?.status === "DRAFT",
        submission:
          s && s.status !== "DRAFT"
            ? {
                id: s.id, status: s.status, submittedAt: s.submittedAt, isLate: s.isLate, score: s.score, feedback: s.feedback,
                reviewedAt: s.reviewedAt, coinsAwarded: s.coinsAwarded, reviewer: s.reviewer?.fullName ?? null, files: s.files,
              }
            : null,
      };
    });

    const counts = Object.fromEntries([...STATES.map((k) => [k, 0]), ["all", items.length]]) as Record<HwState | "all", number>;
    for (const i of items) counts[i.state]++;

    // Ochiq/qaytarilgan — eng yaqin muddat birinchi; qolganlari — eng yangisi birinchi
    const urgent = (i: (typeof items)[number]) => i.state === "open" || i.state === "returned";
    const filtered = items
      .filter((i) => q.status === "all" || i.state === q.status)
      .sort((a, b) => {
        if (urgent(a) !== urgent(b)) return urgent(a) ? -1 : 1;
        return urgent(a) ? a.dueAt.getTime() - b.dueAt.getTime() : b.dueAt.getTime() - a.dueAt.getTime();
      });

    const done = counts.submitted + counts.reviewed;
    return {
      now,
      child: { id: child.info.id, fullName: child.info.fullName, code: child.info.code },
      counts,
      summary: {
        total: items.length,
        done,
        onTime: items.filter((i) => (i.state === "submitted" || i.state === "reviewed") && !i.submission?.isLate).length,
        percent: items.length ? Math.round((done / items.length) * 100) : null,
      },
      items: filtered,
    };
  });
}
