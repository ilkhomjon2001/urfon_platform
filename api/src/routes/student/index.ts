// /api/student/* — faqat STUDENT roli. Guard shu yerda; ichki fayllar qo'shimcha tekshiruvsiz ishlaydi,
// lekin ko'lamni (o'z guruhi / o'z farzandi) lib/access.ts orqali tekshirishi SHART.
import type { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../lib/auth.js";
import dashboard from "./dashboard.js";
import lessons from "./lessons.js";
import homework from "./homework.js";
import materials from "./materials.js";
import achievements from "./achievements.js";

export default async function studentRoutes(app: FastifyInstance) {
  app.addHook("onRequest", authenticate);
  app.addHook("preHandler", requireRole("STUDENT"));
  await app.register(dashboard);
  await app.register(lessons);
  await app.register(homework);
  await app.register(materials);
  await app.register(achievements);
}
