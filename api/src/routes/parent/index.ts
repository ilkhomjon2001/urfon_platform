// /api/parent/* — faqat PARENT roli. Guard shu yerda; ichki fayllar qo'shimcha tekshiruvsiz ishlaydi,
// lekin ko'lamni (o'z guruhi / o'z farzandi) lib/access.ts orqali tekshirishi SHART.
import type { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../lib/auth.js";
import dashboard from "./dashboard.js";
import lessons from "./lessons.js";
import grades from "./grades.js";
import homework from "./homework.js";
import payments from "./payments.js";

export default async function parentRoutes(app: FastifyInstance) {
  app.addHook("onRequest", authenticate);
  app.addHook("preHandler", requireRole("PARENT"));
  await app.register(dashboard);
  await app.register(lessons);
  await app.register(grades);
  await app.register(homework);
  await app.register(payments);
}
