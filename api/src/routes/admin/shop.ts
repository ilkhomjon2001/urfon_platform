// Admin: tanga doʻkoni — narsalar (vitrina) va buyurtmalar (topshirish / bekor qilish).
// Asosiy mantiq lib/shop.ts da; bu yerda faqat tekshiruv, audit va roʻyxatlar.
import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../db.js";
import { writeAudit } from "../../lib/audit.js";
import { badRequest, notFound } from "../../lib/errors.js";
import { auditCtx, idParam, paged, paginate, parse } from "../../lib/http.js";
import { startOfMonthTz } from "../../lib/dates.js";
import { deleteStored } from "../../lib/storage.js";
import { randomUUID } from "node:crypto";
import { AWARD_RULES, GAMIFICATION, RULES, RULE_GROUPS, STAGES, type RuleKey, ruleAmount, stageOf } from "../../config/gamification.js";
import { awardCoins, coinRef } from "../../lib/coins.js";
import { notify, notifyParents } from "../../lib/notify.js";
import {
  SHOP_REF, cancelOrder, catalogFor, deliverOrder, itemDto, itemSelect, orderDto, orderInclude, orderNo, placeOrder,
} from "../../lib/shop.js";

const zId = z.string().min(1).max(40);
const CATEGORIES = ["STATIONERY", "SWAG", "PRIVILEGE", "GIFT"] as const;

const itemBody = z.object({
  title: z.string().trim().min(2, "Nomi kamida 2 belgi").max(120),
  description: z.string().trim().max(1000).nullish(),
  category: z.enum(CATEGORIES).default("GIFT"),
  price: z.coerce.number().int("Narx butun son boʻlsin").min(1, "Narx kamida 1 tanga").max(100_000),
  stock: z.coerce.number().int().min(0, "Zaxira manfiy boʻlmasin").max(100_000).nullish(),
  perStudentLimit: z.coerce.number().int().min(1).max(1000).nullish(),
  imageFileId: zId.nullish(),
  isActive: z.boolean().default(true),
  sort: z.coerce.number().int().min(0).max(10_000).default(0),
});
const itemUpdate = itemBody.partial();

const orderQuery = z.object({
  status: z.enum(["PENDING", "DELIVERED", "CANCELLED", "all"]).default("all"),
  q: z.string().trim().max(100).optional(),
  itemId: zId.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

async function assertImage(fileId: string, adminId: string, currentItemId?: string) {
  const f = await prisma.file.findFirst({
    where: {
      id: fileId, uploadedById: adminId, submissionId: null, homeworkId: null, messageId: null, material: { is: null },
      OR: [{ shopItem: { is: null } }, ...(currentItemId ? [{ shopItem: { is: { id: currentItemId } } }] : [])],
    },
    select: { id: true, mime: true },
  });
  if (!f) throw badRequest("Rasm topilmadi yoki allaqachon ishlatilgan");
  if (!f.mime.startsWith("image/")) throw badRequest("Faqat rasm (JPG, PNG, WEBP) yuklang");
}

export default async function shop(app: FastifyInstance) {
  // Yuqoridagi koʻrsatkichlar
  app.get("/shop/summary", async () => {
    const monthStart = startOfMonthTz(new Date());
    const [pending, delivered, deliveredMonth, spentAll, spentMonth, items, circulating, top] = await Promise.all([
      prisma.shopOrder.count({ where: { status: "PENDING" } }),
      prisma.shopOrder.count({ where: { status: "DELIVERED" } }),
      prisma.shopOrder.count({ where: { status: "DELIVERED", handledAt: { gte: monthStart } } }),
      prisma.shopOrder.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { price: true } }),
      prisma.shopOrder.aggregate({ where: { status: { not: "CANCELLED" }, createdAt: { gte: monthStart } }, _sum: { price: true } }),
      prisma.shopItem.findMany({ where: { isActive: true }, select: { stock: true } }),
      prisma.studentProfile.aggregate({ where: { status: { not: "LEFT" } }, _sum: { coinBalance: true } }),
      prisma.shopOrder.groupBy({ by: ["itemId"], where: { status: { not: "CANCELLED" } }, _count: { _all: true }, orderBy: { _count: { itemId: "desc" } }, take: 5 }),
    ]);
    const topItems = top.length
      ? await prisma.shopItem.findMany({ where: { id: { in: top.map((t) => t.itemId) } }, select: { id: true, title: true, price: true } })
      : [];
    const byId = new Map(topItems.map((i) => [i.id, i]));
    return {
      pending,
      delivered,
      deliveredMonth,
      spentTotal: spentAll._sum.price ?? 0,
      spentMonth: spentMonth._sum.price ?? 0,
      activeItems: items.length,
      outOfStock: items.filter((i) => i.stock === 0).length,
      circulating: circulating._sum.coinBalance ?? 0,
      top: top.map((t) => ({ item: byId.get(t.itemId) ?? null, count: t._count._all })).filter((t) => t.item),
    };
  });

  // Barcha narsalar (arxivdagilar ham), har biri uchun buyurtmalar soni
  app.get("/shop/items", async () => {
    const [items, stats] = await Promise.all([
      prisma.shopItem.findMany({ select: itemSelect, orderBy: [{ isActive: "desc" }, { sort: "asc" }, { price: "asc" }, { createdAt: "asc" }] }),
      prisma.shopOrder.groupBy({ by: ["itemId", "status"], _count: { _all: true } }),
    ]);
    const count = (id: string, s: string) => stats.find((x) => x.itemId === id && x.status === s)?._count._all ?? 0;
    return {
      items: items.map((i) => ({ ...itemDto(i), orders: { pending: count(i.id, "PENDING"), delivered: count(i.id, "DELIVERED") } })),
    };
  });

  app.post("/shop/items", async (req, reply) => {
    const body = parse(itemBody, req.body);
    if (body.imageFileId) await assertImage(body.imageFileId, req.auth.userId);
    const row = await prisma.$transaction(async (tx) => {
      const r = await tx.shopItem.create({
        data: {
          title: body.title, description: body.description || null, category: body.category, price: body.price,
          stock: body.stock ?? null, perStudentLimit: body.perStudentLimit ?? null, imageFileId: body.imageFileId ?? null,
          isActive: body.isActive, sort: body.sort,
        },
        select: itemSelect,
      });
      await writeAudit(tx, {
        ...auditCtx(req), action: "shop.item_create", entityType: "ShopItem", entityId: r.id,
        summary: `Doʻkonga “${r.title}” qoʻshildi (${r.price} tanga)`,
        after: { title: r.title, price: r.price, stock: r.stock, category: r.category, perStudentLimit: r.perStudentLimit },
      });
      return r;
    });
    reply.code(201);
    return itemDto(row);
  });

  app.put("/shop/items/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const body = parse(itemUpdate, req.body);
    const old = await prisma.shopItem.findUnique({ where: { id }, select: { ...itemSelect, imageFileId: true } });
    if (!old) throw notFound("Narsa topilmadi");
    if (body.imageFileId && body.imageFileId !== old.imageFileId) await assertImage(body.imageFileId, req.auth.userId, id);

    const data: Prisma.ShopItemUncheckedUpdateInput = {};
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    const put = <K extends keyof typeof old>(key: K & string, next: unknown) => {
      if (next === undefined || old[key] === next) return;
      before[key] = old[key];
      after[key] = next;
      (data as Record<string, unknown>)[key] = next;
    };
    put("title", body.title);
    put("description", body.description === undefined ? undefined : body.description || null);
    put("category", body.category);
    put("price", body.price);
    put("stock", body.stock === undefined ? undefined : body.stock ?? null);
    put("perStudentLimit", body.perStudentLimit === undefined ? undefined : body.perStudentLimit ?? null);
    put("imageFileId", body.imageFileId === undefined ? undefined : body.imageFileId ?? null);
    put("isActive", body.isActive);
    put("sort", body.sort);
    if (!Object.keys(data).length) return itemDto(old);

    const oldImage = "imageFileId" in data && old.imageFileId
      ? await prisma.file.findUnique({ where: { id: old.imageFileId }, select: { id: true, storageKey: true } })
      : null;
    const row = await prisma.$transaction(async (tx) => {
      const r = await tx.shopItem.update({ where: { id }, data, select: itemSelect });
      if (oldImage) await tx.file.delete({ where: { id: oldImage.id } });
      await writeAudit(tx, {
        ...auditCtx(req), action: "shop.item_update", entityType: "ShopItem", entityId: id,
        summary: `Doʻkon: “${r.title}” tahrirlandi`, before, after,
      });
      return r;
    });
    if (oldImage) await deleteStored(oldImage);
    return itemDto(row);
  });

  // Buyurtmasi bor narsa oʻchirilmaydi — arxivga olinadi (tarix saqlanadi)
  app.delete("/shop/items/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    const item = await prisma.shopItem.findUnique({ where: { id }, select: { id: true, title: true, price: true, imageFileId: true, _count: { select: { orders: true } } } });
    if (!item) throw notFound("Narsa topilmadi");
    if (item._count.orders > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.shopItem.update({ where: { id }, data: { isActive: false } });
        await writeAudit(tx, { ...auditCtx(req), action: "shop.item_archive", entityType: "ShopItem", entityId: id, summary: `Doʻkon: “${item.title}” arxivga olindi` });
      });
      return { ok: true, archived: true };
    }
    const image = item.imageFileId ? await prisma.file.findUnique({ where: { id: item.imageFileId }, select: { id: true, storageKey: true } }) : null;
    await prisma.$transaction(async (tx) => {
      await tx.shopItem.delete({ where: { id } });
      if (image) await tx.file.delete({ where: { id: image.id } });
      await writeAudit(tx, {
        ...auditCtx(req), action: "shop.item_delete", entityType: "ShopItem", entityId: id,
        summary: `Doʻkondan “${item.title}” oʻchirildi`, before: { title: item.title, price: item.price },
      });
    });
    if (image) await deleteStored(image);
    return { ok: true, archived: false };
  });

  app.get("/shop/orders", async (req) => {
    const q = parse(orderQuery, req.query);
    const where: Prisma.ShopOrderWhereInput = {
      ...(q.status !== "all" ? { status: q.status } : {}),
      ...(q.itemId ? { itemId: q.itemId } : {}),
      ...(q.q
        ? {
            OR: [
              { student: { fullName: { contains: q.q, mode: "insensitive" } } },
              { student: { studentProfile: { code: { contains: q.q, mode: "insensitive" } } } },
              { item: { title: { contains: q.q, mode: "insensitive" } } },
              ...(/^#?\d+$/.test(q.q) ? [{ number: Number(q.q.replace("#", "")) }] : []),
            ],
          }
        : {}),
    };
    const [rows, total, counts] = await Promise.all([
      prisma.shopOrder.findMany({
        where, include: orderInclude, ...paginate(q),
        // kutilayotganlar — eng eskisi birinchi (navbat), qolganlari — eng yangisi birinchi
        orderBy: q.status === "PENDING" ? [{ createdAt: "asc" }] : [{ createdAt: "desc" }],
      }),
      prisma.shopOrder.count({ where }),
      prisma.shopOrder.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    const c = Object.fromEntries(counts.map((x) => [x.status, x._count._all]));
    return { ...paged(rows.map(orderDto), total, q), counts: { PENDING: c.PENDING ?? 0, DELIVERED: c.DELIVERED ?? 0, CANCELLED: c.CANCELLED ?? 0 } };
  });

  // Oʻquvchi nomidan buyurtma (markazga kelib “shuni olaman” desa)
  app.get("/shop/students", async (req) => {
    const { q } = parse(z.object({ q: z.string().trim().max(100).default("") }), req.query);
    const rows = await prisma.user.findMany({
      where: {
        role: "STUDENT", isActive: true, studentProfile: { status: { not: "LEFT" } },
        ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { studentProfile: { code: { contains: q, mode: "insensitive" } } }] } : {}),
      },
      select: { id: true, fullName: true, studentProfile: { select: { code: true, coinBalance: true } } },
      orderBy: { fullName: "asc" },
      take: 20,
    });
    return { items: rows.map((s) => ({ id: s.id, fullName: s.fullName, code: s.studentProfile?.code ?? null, balance: s.studentProfile?.coinBalance ?? 0 })) };
  });

  app.get("/shop/students/:id/catalog", async (req) => {
    const { id } = parse(idParam, req.params);
    return catalogFor(prisma, id);
  });

  app.post("/shop/orders", async (req, reply) => {
    const body = parse(z.object({ studentId: zId, itemId: zId, note: z.string().trim().max(300).nullish(), deliverNow: z.boolean().default(false) }), req.body);
    const me = { id: req.auth.userId, role: req.auth.role };
    const order = await prisma.$transaction(async (tx) => {
      const o = await placeOrder(tx, { itemId: body.itemId, studentId: body.studentId, requestedBy: me, note: body.note });
      if (body.deliverNow) await deliverOrder(tx, o.id, me.id);
      await writeAudit(tx, {
        ...auditCtx(req), action: "shop.order_create", entityType: "ShopOrder", entityId: o.id,
        summary: `${o.student.fullName} uchun “${o.item.title}” buyurtma qilindi (${orderNo(o.number)}, ${o.price} tanga)${body.deliverNow ? " va topshirildi" : ""}`,
        after: { itemId: o.itemId, studentId: o.studentId, price: o.price },
      });
      return o;
    });
    reply.code(201);
    return orderDto(await prisma.shopOrder.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude }));
  });

  app.post("/shop/orders/:id/deliver", async (req) => {
    const { id } = parse(idParam, req.params);
    await prisma.$transaction(async (tx) => {
      const o = await deliverOrder(tx, id, req.auth.userId);
      await writeAudit(tx, {
        ...auditCtx(req), action: "shop.order_deliver", entityType: "ShopOrder", entityId: id,
        summary: `Buyurtma ${orderNo(o.number)} (“${o.item.title}”) topshirildi`,
      });
    });
    return orderDto(await prisma.shopOrder.findUniqueOrThrow({ where: { id }, include: orderInclude }));
  });

  app.post("/shop/orders/:id/cancel", async (req) => {
    const { id } = parse(idParam, req.params);
    const { reason } = parse(z.object({ reason: z.string().trim().max(300).nullish() }), req.body ?? {});
    await prisma.$transaction(async (tx) => {
      const o = await cancelOrder(tx, id, { id: req.auth.userId, role: req.auth.role }, reason);
      await writeAudit(tx, {
        ...auditCtx(req), action: "shop.order_cancel", entityType: "ShopOrder", entityId: id,
        summary: `Buyurtma ${orderNo(o.number)} (“${o.item.title}”) bekor qilindi, ${o.price} tanga qaytarildi${reason ? `: ${reason}` : ""}`,
        after: { refType: SHOP_REF, refunded: o.price },
      });
    });
    return orderDto(await prisma.shopOrder.findUniqueOrThrow({ where: { id }, include: orderInclude }));
  });

  // ───────────── Qoidalar jadvali va mukofot berish (musobaqa, tanlov, taqdimot) ─────────────
  app.get("/shop/rules", async () => ({
    stages: STAGES,
    activity: GAMIFICATION.activity,
    groups: RULE_GROUPS.map((g) => ({ key: g.key, title: g.title, rules: g.rules.map((k) => ({ key: k, title: RULES[k].title, xp: RULES[k].xp, kumush: RULES[k].kumush })) })),
    awardable: AWARD_RULES,
  }));

  app.get("/shop/groups", async () => {
    const rows = await prisma.group.findMany({
      where: { status: { not: "FINISHED" } },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true, _count: { select: { students: { where: { status: "ACTIVE" } } } } },
    });
    return { items: rows.map((g) => ({ id: g.id, code: g.code, name: g.name, students: g._count.students })) };
  });

  app.post("/shop/awards", async (req, reply) => {
    const body = parse(
      z
        .object({
          rule: z.enum(AWARD_RULES as [RuleKey, ...RuleKey[]]),
          note: z.string().trim().min(2, "Musobaqa yoki tadbir nomini yozing").max(200),
          studentIds: z.array(zId).max(200).default([]),
          groupId: zId.nullish(),
        })
        .refine((b) => b.studentIds.length > 0 || !!b.groupId, "Oʻquvchi yoki guruhni tanlang"),
      req.body,
    );
    const ids = new Set(body.studentIds);
    if (body.groupId) {
      const members = await prisma.groupStudent.findMany({ where: { groupId: body.groupId, status: "ACTIVE" }, select: { studentId: true } });
      for (const m of members) ids.add(m.studentId);
    }
    const students = await prisma.user.findMany({
      where: { id: { in: [...ids] }, role: "STUDENT", studentProfile: { status: { not: "LEFT" } } },
      select: { id: true, fullName: true, studentProfile: { select: { xp: true } } },
    });
    if (!students.length) throw badRequest("Mukofot beriladigan faol oʻquvchi topilmadi");
    const rule = RULES[body.rule];
    const reason = body.rule === "PRESENTATION" ? "PRESENTATION" : "CONTEST";

    const given = await prisma.$transaction(async (tx) => {
      const out: { studentId: string; fullName: string; stage: number; kumush: number; xp: number }[] = [];
      for (const s of students) {
        const stage = stageOf(s.studentProfile?.xp ?? 0);
        const t = await awardCoins(tx, {
          studentId: s.id, reason, rule: body.rule, groupId: body.groupId ?? null,
          ...coinRef.award(randomUUID()), note: `${rule.title}: ${body.note}`, createdById: req.auth.userId,
        });
        if (!t) continue;
        out.push({ studentId: s.id, fullName: s.fullName, stage, kumush: t.amount, xp: t.xp });
        const text = `${rule.title} — «${body.note}»: +${t.xp} XP va +${t.amount} kumush.`;
        await notify(tx, { userId: s.id, type: "coins.award", telegram: false, title: "Tabriklaymiz! Mukofot", body: text, link: "/oquvchi/yutuqlar" });
        await notifyParents(tx, s.id, { type: "coins.award", title: "Farzandingiz mukofotlandi", body: `${s.fullName}: ${text}`, link: "/ota-ona/dokon" });
      }
      await writeAudit(tx, {
        ...auditCtx(req), action: "coins.award", entityType: "CoinTransaction", entityId: body.rule,
        summary: `${rule.title} — «${body.note}»: ${out.length} ta oʻquvchiga (${out.map((o) => `${o.fullName} +${o.kumush}`).join(", ")})`,
        after: { rule: body.rule, note: body.note, students: out.map((o) => ({ id: o.studentId, stage: o.stage, kumush: o.kumush, xp: o.xp })) },
      });
      return out;
    });
    reply.code(201);
    return { rule: body.rule, title: rule.title, given, preview: ruleAmount(body.rule, 0) };
  });
}
