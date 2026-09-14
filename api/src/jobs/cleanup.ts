// Tungi tozalash (03:00): eskirgan sessiyalar, ishlatilgan/eskirgan Telegram ulash kodlari va
// hech narsaga bog'lanmagan (POST /api/files dan keyin tashlab ketilgan) fayllar — disk to'lib qolmasin.
import { prisma } from "../db.js";
import { deleteStored } from "../lib/storage.js";

const DAY = 86_400_000;

export async function runCleanup(now = new Date()) {
  const sessions = await prisma.session.deleteMany({
    where: { OR: [{ expiresAt: { lt: new Date(now.getTime() - 7 * DAY) } }, { revokedAt: { lt: new Date(now.getTime() - 30 * DAY) } }] },
  });
  const linkCodes = await prisma.telegramLinkCode.deleteMany({
    where: { createdAt: { lt: new Date(now.getTime() - DAY) }, OR: [{ usedAt: { not: null } }, { expiresAt: { lt: now } }] },
  });
  const orphanWhere = {
    createdAt: { lt: new Date(now.getTime() - DAY) },
    submissionId: null, homeworkId: null, messageId: null, material: { is: null },
  };
  const orphans = await prisma.file.findMany({ where: orphanWhere, select: { id: true, storageKey: true }, take: 5000 });
  if (orphans.length) {
    await prisma.file.deleteMany({ where: { id: { in: orphans.map((f) => f.id) }, ...orphanWhere } });
    for (const f of orphans) await deleteStored(f);
  }
  return { sessions: sessions.count, linkCodes: linkCodes.count, orphanFiles: orphans.length };
}
