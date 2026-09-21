// /api/parent/shop?studentId= — farzandning tanga doʻkoni. Ota-ona farzand yigʻgan tangalarni
// uning nomidan sovgʻaga almashtirishi, buyurtmalarni koʻrishi va topshirilmaganini bekor qilishi mumkin.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { notFound } from "../../lib/errors.js";
import { idParam, parse } from "../../lib/http.js";
import { cancelOrder, catalogFor, orderDto, orderInclude, placeOrder } from "../../lib/shop.js";
import { childQuery, loadChild, zId } from "./common.js";

export default async function shop(app: FastifyInstance) {
  app.get("/shop", async (req) => {
    const { studentId } = parse(childQuery, req.query);
    const child = await loadChild(req.auth.userId, studentId);
    const [catalog, orders, earned] = await Promise.all([
      catalogFor(prisma, child.id),
      prisma.shopOrder.findMany({ where: { studentId: child.id }, include: orderInclude, orderBy: { createdAt: "desc" }, take: 30 }),
      prisma.coinTransaction.aggregate({ where: { studentId: child.id, amount: { gt: 0 } }, _sum: { amount: true } }),
    ]);
    return { ...catalog, earned: earned._sum.amount ?? 0, child: { id: child.id, fullName: child.info.fullName }, orders: orders.map(orderDto) };
  });

  app.post("/shop/orders", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (req, reply) => {
    const body = parse(z.object({ studentId: zId, itemId: zId, note: z.string().trim().max(300).nullish() }), req.body);
    const child = await loadChild(req.auth.userId, body.studentId);
    const o = await prisma.$transaction((tx) =>
      placeOrder(tx, { itemId: body.itemId, studentId: child.id, requestedBy: { id: req.auth.userId, role: req.auth.role }, note: body.note }),
    );
    reply.code(201);
    return orderDto(o);
  });

  app.post("/shop/orders/:id/cancel", async (req) => {
    const { id } = parse(idParam, req.params);
    const { studentId } = parse(childQuery, req.query);
    const child = await loadChild(req.auth.userId, studentId);
    const own = await prisma.shopOrder.findFirst({ where: { id, studentId: child.id }, select: { id: true } });
    if (!own) throw notFound("Buyurtma topilmadi");
    await prisma.$transaction((tx) => cancelOrder(tx, id, { id: req.auth.userId, role: req.auth.role }));
    return orderDto(await prisma.shopOrder.findUniqueOrThrow({ where: { id }, include: orderInclude }));
  });
}
