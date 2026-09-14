// Bildirishnomalar (outbox). Servislar shu yerga yozadi; ilova ichidagi qo'ng'iroqcha
// shu jadvaldan o'qiydi, bot worker (src/bot) esa PENDING yozuvlarni Telegram'ga yuboradi.
import type { Prisma } from "@prisma/client";
import type { Db } from "../db.js";

export type NotifyInput = {
  userId: string;
  type: string; // "homework.reviewed" | "attendance.absent" | "payment.due" | "message.new" | "grade.new" | …
  title: string;
  body: string;
  link?: string; // ilova ichidagi yo'l, masalan "/ota-ona/darslar/<id>"
  payload?: Prisma.InputJsonValue;
  telegram?: boolean; // default true
};

export async function notify(db: Db, n: NotifyInput) {
  return db.notification.create({
    data: {
      userId: n.userId, type: n.type, title: n.title, body: n.body, link: n.link ?? null,
      payload: n.payload, telegram: n.telegram ?? true,
    },
  });
}

/** O'quvchining barcha ota-onalariga bildirishnoma. `link` ota-ona kabinetidagi yo'l bo'lsin. */
export async function notifyParents(db: Db, studentId: string, n: Omit<NotifyInput, "userId">) {
  const parents = await db.parentStudent.findMany({ where: { studentId }, select: { parentId: true } });
  for (const p of parents) await notify(db, { ...n, userId: p.parentId });
  return parents.length;
}
