// Tanga doʻkoni — YAGONA mantiq joyi (admin, oʻquvchi va ota-ona marshrutlari shu yerdan foydalanadi).
//  • Buyurtma: zaxira va balans shartli UPDATE bilan kamaytiriladi (parallel bosishda manfiyga tushmaydi),
//    tanga darhol yechiladi — CoinTransaction SPEND, refType "shop_order", refId = buyurtma id.
//  • Bekor qilish (faqat PENDING): SPEND yozuvi oʻchiriladi, balans va zaxira qaytadi.
//  • Topshirish: admin narsani qoʻliga berganda PENDING → DELIVERED.
import type { Prisma, Role, ShopCategory, ShopOrderStatus } from "@prisma/client";
import type { Db, Tx } from "../db.js";
import { badRequest, notFound } from "./errors.js";
import { notify, notifyParents } from "./notify.js";

export const SHOP_REF = "shop_order";

export const SHOP_CATEGORY_LABEL: Record<ShopCategory, string> = {
  STATIONERY: "Oʻquv qurollari",
  SWAG: "URFON mahsulotlari",
  PRIVILEGE: "Imtiyozlar",
  GIFT: "Sovgʻalar",
};

export const SHOP_STATUS_LABEL: Record<ShopOrderStatus, string> = {
  PENDING: "Topshirilishi kutilmoqda",
  DELIVERED: "Topshirildi",
  CANCELLED: "Bekor qilindi",
};

export const orderNo = (n: number) => `#${String(n).padStart(4, "0")}`;

export const itemSelect = {
  id: true, title: true, description: true, category: true, price: true, stock: true,
  perStudentLimit: true, isActive: true, sort: true, createdAt: true, updatedAt: true,
  image: { select: { id: true, originalName: true, mime: true, size: true } },
} satisfies Prisma.ShopItemSelect;
export type ItemRow = Prisma.ShopItemGetPayload<{ select: typeof itemSelect }>;

export function itemDto(i: ItemRow) {
  return {
    id: i.id,
    title: i.title,
    description: i.description,
    category: i.category,
    categoryLabel: SHOP_CATEGORY_LABEL[i.category],
    price: i.price,
    stock: i.stock,
    perStudentLimit: i.perStudentLimit,
    isActive: i.isActive,
    sort: i.sort,
    image: i.image,
    createdAt: i.createdAt,
  };
}

export const orderInclude = {
  item: { select: { id: true, title: true, category: true, image: { select: { id: true, originalName: true, mime: true, size: true } } } },
  student: { select: { id: true, fullName: true, studentProfile: { select: { code: true } } } },
  requestedBy: { select: { id: true, fullName: true, role: true } },
  handledBy: { select: { id: true, fullName: true } },
} satisfies Prisma.ShopOrderInclude;
export type OrderRow = Prisma.ShopOrderGetPayload<{ include: typeof orderInclude }>;

export function orderDto(o: OrderRow) {
  return {
    id: o.id,
    number: o.number,
    no: orderNo(o.number),
    status: o.status,
    statusLabel: SHOP_STATUS_LABEL[o.status],
    price: o.price,
    note: o.note,
    cancelReason: o.cancelReason,
    createdAt: o.createdAt,
    handledAt: o.handledAt,
    item: { id: o.item.id, title: o.item.title, category: o.item.category, image: o.item.image },
    student: { id: o.student.id, fullName: o.student.fullName, code: o.student.studentProfile?.code ?? null },
    requestedBy: o.requestedBy,
    handledBy: o.handledBy,
  };
}

/** Oʻquvchi bu narsani necha marta olgan (bekor qilinganlar hisoblanmaydi). */
export async function boughtCounts(db: Db, studentId: string) {
  const rows = await db.shopOrder.groupBy({ by: ["itemId"], where: { studentId, status: { not: "CANCELLED" } }, _count: { _all: true } });
  return new Map(rows.map((r) => [r.itemId, r._count._all]));
}

/**
 * Doʻkon vitrinasi (oʻquvchi va ota-ona uchun): faqat faol narsalar + har biri uchun "olsa boʻladimi" holati.
 * Sabab matni tugma ostida koʻrsatiladi.
 */
export async function catalogFor(db: Db, studentId: string) {
  const [profile, items, bought] = await Promise.all([
    db.studentProfile.findUnique({ where: { userId: studentId }, select: { coinBalance: true, status: true } }),
    db.shopItem.findMany({ where: { isActive: true }, select: itemSelect, orderBy: [{ sort: "asc" }, { price: "asc" }, { createdAt: "asc" }] }),
    boughtCounts(db, studentId),
  ]);
  const balance = profile?.coinBalance ?? 0;
  const left = profile?.status === "LEFT";
  return {
    balance,
    items: items.map((i) => {
      const count = bought.get(i.id) ?? 0;
      let blocked: string | null = null;
      if (left) blocked = "Oʻquvchi markazda oʻqimayapti";
      else if (i.stock === 0) blocked = "Tugagan";
      else if (i.perStudentLimit != null && count >= i.perStudentLimit) blocked = i.perStudentLimit === 1 ? "Allaqachon olingan" : `Limit: ${i.perStudentLimit} marta`;
      else if (balance < i.price) blocked = `Yana ${i.price - balance} tanga kerak`;
      return { ...itemDto(i), bought: count, canBuy: !blocked, blocked, missing: Math.max(0, i.price - balance) };
    }),
  };
}

type PlaceInput = { itemId: string; studentId: string; requestedBy: { id: string; role: Role; fullName?: string }; note?: string | null };

/** Buyurtma berish (tranzaksiya ichida chaqiriladi). */
export async function placeOrder(tx: Tx, input: PlaceInput) {
  const { itemId, studentId, requestedBy } = input;
  const item = await tx.shopItem.findUnique({ where: { id: itemId } });
  if (!item || !item.isActive) throw notFound("Bu narsa doʻkonda yoʻq");
  const profile = await tx.studentProfile.findUnique({ where: { userId: studentId }, select: { status: true, user: { select: { fullName: true } } } });
  if (!profile) throw notFound("Oʻquvchi topilmadi");
  if (profile.status === "LEFT") throw badRequest("Oʻquvchi markazda oʻqimayapti");

  if (item.perStudentLimit != null) {
    const count = await tx.shopOrder.count({ where: { itemId, studentId, status: { not: "CANCELLED" } } });
    if (count >= item.perStudentLimit) throw badRequest(item.perStudentLimit === 1 ? "Bu narsa allaqachon olingan" : `Bu narsani ${item.perStudentLimit} martadan koʻp olib boʻlmaydi`, "SHOP_LIMIT");
  }
  if (item.stock != null) {
    const s = await tx.shopItem.updateMany({ where: { id: itemId, stock: { gte: 1 } }, data: { stock: { decrement: 1 } } });
    if (!s.count) throw badRequest("Afsuski, bu narsa tugagan", "SHOP_OUT_OF_STOCK");
  }
  const b = await tx.studentProfile.updateMany({ where: { userId: studentId, coinBalance: { gte: item.price } }, data: { coinBalance: { decrement: item.price } } });
  if (!b.count) throw badRequest("Tanga yetarli emas", "SHOP_NO_COINS");

  const order = await tx.shopOrder.create({
    data: { itemId, studentId, price: item.price, requestedById: requestedBy.id, note: input.note || null },
    include: orderInclude,
  });
  await tx.coinTransaction.create({
    data: {
      studentId, amount: -item.price, reason: "SPEND", refType: SHOP_REF, refId: order.id,
      note: `Doʻkon: ${item.title}`, createdById: requestedBy.id,
    },
  });

  // Bildirishnomalar: adminlarga (topshirish uchun), oʻquvchiga va ota-onaga (kim buyurtma bergan boʻlsa ham xabardor)
  const who = requestedBy.role === "PARENT" ? "ota-onasi" : requestedBy.role === "ADMIN" ? "administrator" : "oʻzi";
  const admins = await tx.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
  for (const a of admins) {
    await notify(tx, {
      userId: a.id, type: "shop.order", telegram: false,
      title: `Yangi buyurtma ${orderNo(order.number)}`,
      body: `${profile.user.fullName}: “${item.title}” (${item.price} tanga) — ${who} buyurtma berdi`,
      link: "/admin/dokon?t=orders",
    });
  }
  if (requestedBy.role !== "STUDENT") {
    await notify(tx, {
      userId: studentId, type: "shop.order", telegram: false,
      title: "Doʻkondan sovgʻa buyurtma qilindi",
      body: `“${item.title}” — ${item.price} tanga. Markazdan olib ketishingiz mumkin (buyurtma ${orderNo(order.number)}).`,
      link: "/oquvchi/dokon",
    });
  }
  if (requestedBy.role !== "PARENT") {
    await notifyParents(tx, studentId, {
      type: "shop.order",
      title: "Farzandingiz tangalarini almashtirdi",
      body: `${profile.user.fullName} “${item.title}” uchun ${item.price} tanga sarfladi (buyurtma ${orderNo(order.number)}).`,
      link: "/ota-ona/dokon",
    });
  }
  return order;
}

/** Bekor qilish: tanga va zaxira qaytadi. Faqat PENDING buyurtma. */
export async function cancelOrder(tx: Tx, orderId: string, by: { id: string; role: Role }, reason?: string | null) {
  const o = await tx.shopOrder.findUnique({ where: { id: orderId }, include: { item: { select: { title: true } } } });
  if (!o) throw notFound("Buyurtma topilmadi");
  if (o.status !== "PENDING") throw badRequest("Faqat topshirilmagan buyurtmani bekor qilish mumkin");
  const r = await tx.shopOrder.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "CANCELLED", cancelReason: reason || null, handledById: by.id, handledAt: new Date() },
  });
  if (!r.count) throw badRequest("Buyurtma holati oʻzgargan, sahifani yangilang");
  await tx.coinTransaction.deleteMany({ where: { studentId: o.studentId, reason: "SPEND", refType: SHOP_REF, refId: o.id } });
  await tx.studentProfile.update({ where: { userId: o.studentId }, data: { coinBalance: { increment: o.price } } });
  await tx.shopItem.updateMany({ where: { id: o.itemId, stock: { not: null } }, data: { stock: { increment: 1 } } });

  if (by.role === "ADMIN") {
    const body = `“${o.item.title}” buyurtmasi ${orderNo(o.number)} bekor qilindi, ${o.price} tanga qaytarildi.${reason ? ` Sabab: ${reason}` : ""}`;
    await notify(tx, { userId: o.studentId, type: "shop.cancelled", telegram: false, title: "Buyurtma bekor qilindi", body, link: "/oquvchi/dokon" });
    await notifyParents(tx, o.studentId, { type: "shop.cancelled", title: "Buyurtma bekor qilindi", body, link: "/ota-ona/dokon" });
  }
  return o;
}

/** Topshirildi deb belgilash (admin). */
export async function deliverOrder(tx: Tx, orderId: string, adminId: string) {
  const o = await tx.shopOrder.findUnique({ where: { id: orderId }, include: { item: { select: { title: true } } } });
  if (!o) throw notFound("Buyurtma topilmadi");
  if (o.status !== "PENDING") throw badRequest("Bu buyurtma allaqachon yopilgan");
  const r = await tx.shopOrder.updateMany({ where: { id: orderId, status: "PENDING" }, data: { status: "DELIVERED", handledById: adminId, handledAt: new Date() } });
  if (!r.count) throw badRequest("Buyurtma holati oʻzgargan, sahifani yangilang");
  await notify(tx, {
    userId: o.studentId, type: "shop.delivered", telegram: false,
    title: "Sovgʻangiz topshirildi",
    body: `“${o.item.title}” (${orderNo(o.number)}) — mehnatingiz samarasi. Tabriklaymiz!`,
    link: "/oquvchi/dokon",
  });
  return o;
}
