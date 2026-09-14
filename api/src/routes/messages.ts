// Xabarlar — barcha rollar uchun umumiy. Kim kim bilan yozisha olishi lib/access.ts → canMessage().
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../lib/auth.js";
import { idParam, parse } from "../lib/http.js";
import { getThreadMessages, listContacts, listThreads, sendMessage, startThread } from "../lib/messaging.js";

const sendBody = z.object({
  body: z.string().max(4000).default(""),
  lessonId: z.string().max(40).nullish(),
  isQuestion: z.boolean().optional(),
  fileIds: z.array(z.string().max(40)).max(5).optional(),
});

export default async function messagesRoutes(app: FastifyInstance) {
  app.addHook("onRequest", authenticate);

  app.get("/threads", async (req) => listThreads(req.auth.userId));

  app.get("/threads/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const q = parse(z.object({ before: z.coerce.date().optional(), limit: z.coerce.number().int().min(1).max(200).optional() }), req.query);
    return getThreadMessages(req.auth.userId, id, q);
  });

  app.post("/threads/:id/messages", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (req) => {
    const { id } = parse(idParam, req.params);
    return sendMessage(req.auth, id, parse(sendBody, req.body));
  });

  // Yangi suhbat: { toUserId, body, studentId?, subject?, lessonId?, isQuestion?, fileIds? }
  app.post("/", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (req) => {
    const body = parse(
      sendBody.extend({ toUserId: z.string().min(1).max(40), studentId: z.string().max(40).nullish(), subject: z.string().max(200).nullish() }),
      req.body,
    );
    return startThread(req.auth, body);
  });

  app.get("/contacts", async (req) => listContacts(req.auth));
}
