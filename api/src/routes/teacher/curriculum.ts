// Ustoz: dars rejalari (oʻqish uchun). Faqat tasdiqlangan mavzular koʻrinadi.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { idParam, parse } from "../../lib/http.js";
import { levelPlan, planLevels } from "../../lib/lesson-plans.js";

export default async function curriculum(app: FastifyInstance) {
  app.get("/curriculum/levels", async (req) => {
    const [items, groups] = await Promise.all([
      planLevels(true),
      prisma.group.findMany({ where: { teacherId: req.auth.userId, status: { not: "FINISHED" }, levelId: { not: null } }, select: { levelId: true, ageGroup: true } }),
    ]);
    // "mine" — ustozning faol guruhlari oʻqiyotgan levellar va ularning yosh toifasi (sahifa shulardan boshlanadi)
    const mine = new Map<string, "teen" | "kids">();
    for (const g of groups) if (!mine.has(g.levelId!)) mine.set(g.levelId!, g.ageGroup === "KIDS" ? "kids" : "teen");
    return { items, mine: [...mine].map(([levelId, track]) => ({ levelId, track })) };
  });

  app.get("/curriculum/levels/:id/plan", async (req) => {
    const { id } = parse(idParam, req.params);
    const { track } = parse(z.object({ track: z.enum(["teen", "kids"]).default("teen") }), req.query);
    return levelPlan(id, true, track);
  });
}
