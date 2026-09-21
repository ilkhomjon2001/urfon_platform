// /api/student/shop — tanga doʻkoni: oʻquvchi yigʻgan tangalarini narsalarga almashtiradi.
// Buyurtmani markaz administratori topshiradi; topshirilguncha oʻquvchi uni bekor qilib, tangani qaytarib olishi mumkin.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { notFound } from "../../lib/errors.js";
import { idParam, parse } from "../../lib/http.js";
import { cancelOrder, catalogFor, orderDto, orderInclude, placeOrder } from "../../lib/shop.js";

export default async function shop(app: FastifyInstance) {
  app.get("/shop", async (req) => {
    const studentId = req.auth.userId;
    const [catalog, orders] = await Promise.all([
      catalogFor(prisma, studentId),
      prisma.shopOrder.findMany({ where: { studentId }, include: orderInclude, orderBy: { createdAt: "desc" }, take: 30 }),
    ]);
    return { ...catalog, orders: orders.map(orderDto) };
  });

  app.post("/shop/orders", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (req, reply) => {
    const { itemId } = parse(z.object({ itemId: z.string().min(1).max(40) }), req.body);
    const me = req.auth;
    const o = await prisma.$transaction((tx) => placeOrder(tx, { itemId, studentId: me.userId, requestedBy: { id: me.userId, role: me.role } }));
    reply.code(201);
    return orderDto(o);
  });

  app.post("/shop/orders/:id/cancel", async (req) => {
    const { id } = parse(idParam, req.params);
    const own = await prisma.shopOrder.findFirst({ where: { id, studentId: req.auth.userId }, select: { id: true } });
    if (!own) throw notFound("Buyurtma topilmadi");
    await prisma.$transaction((tx) => cancelOrder(tx, id, { id: req.auth.userId, role: req.auth.role }));
    return orderDto(await prisma.shopOrder.findUniqueOrThrow({ where: { id }, include: orderInclude }));
  });
}
