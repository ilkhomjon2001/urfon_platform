// /api/admin/* — faqat ADMIN roli. Guard shu yerda; ichki fayllar qo'shimcha tekshiruvsiz ishlaydi,
// lekin ko'lamni (o'z guruhi / o'z farzandi) lib/access.ts orqali tekshirishi SHART.
import type { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../lib/auth.js";
import dashboard from "./dashboard.js";
import groups from "./groups.js";
import teachers from "./teachers.js";
import curriculum from "./curriculum.js";
import materials from "./materials.js";
import lookups from "./lookups.js";
import students from "./students.js";
import parents from "./parents.js";
import payments from "./payments.js";
import reports from "./reports.js";
import audit from "./audit.js";

export default async function adminRoutes(app: FastifyInstance) {
  app.addHook("onRequest", authenticate);
  app.addHook("preHandler", requireRole("ADMIN"));
  await app.register(dashboard);
  await app.register(groups);
  await app.register(teachers);
  await app.register(curriculum);
  await app.register(materials);
  await app.register(lookups);
  await app.register(students);
  await app.register(parents);
  await app.register(payments);
  await app.register(reports);
  await app.register(audit);
}
