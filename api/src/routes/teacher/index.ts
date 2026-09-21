// /api/teacher/* — faqat TEACHER roli. Guard shu yerda; ichki fayllar qo'shimcha tekshiruvsiz ishlaydi,
// lekin ko'lamni (o'z guruhi / o'z farzandi) lib/access.ts orqali tekshirishi SHART.
import type { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../lib/auth.js";
import dashboard from "./dashboard.js";
import groups from "./groups.js";
import lessons from "./lessons.js";
import schedule from "./schedule.js";
import homework from "./homework.js";
import exams from "./exams.js";
import resources from "./resources.js";
import curriculum from "./curriculum.js";
import announcements from "./announcements.js";

export default async function teacherRoutes(app: FastifyInstance) {
  app.addHook("onRequest", authenticate);
  app.addHook("preHandler", requireRole("TEACHER"));
  await app.register(dashboard);
  await app.register(groups);
  await app.register(lessons);
  await app.register(schedule);
  await app.register(homework);
  await app.register(exams);
  await app.register(resources);
  await app.register(curriculum);
  await app.register(announcements);
}
