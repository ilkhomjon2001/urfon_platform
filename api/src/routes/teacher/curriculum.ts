// Ustoz: dars rejalari (oʻqish uchun). Faqat tasdiqlangan mavzular koʻrinadi.
import type { FastifyInstance } from "fastify";
import { prisma } from "../../db.js";
import { idParam, parse } from "../../lib/http.js";
import { levelPlan, planLevels } from "../../lib/lesson-plans.js";

export default async function curriculum(app: FastifyInstance) {
  app.get("/curriculum/levels", async (req) => {
    const [items, groups] = await Promise.all([
      planLevels(true),
      prisma.group.findMany({ where: { teacherId: req.auth.userId, status: { not: "FINISHED" }, levelId: { not: null } }, select: { levelId: true } }),
    ]);
    // "mine" — ustozning faol guruhlari oʻqiyotgan bosqichlar (sahifa shulardan boshlanadi)
    return { items, mine: [...new Set(groups.map((g) => g.levelId!))] };
  });

  app.get("/curriculum/levels/:id/plan", async (req) => {
    const { id } = parse(idParam, req.params);
    return levelPlan(id, true);
  });
}
