// Bitta kishiga NAMUNA kunlik hisobot yuboradi (ota-onalarga ommaviy ketmaydi).
//   npm run report:test-send -w api -- "Zuhra" <userId> [YYYY-MM-DD]
// userId — xabarni oladigan foydalanuvchi (Telegramga ulangan boʻlsa, botga ham boradi).
import { prisma } from "../src/db.js";
import { dailyContent } from "../src/jobs/reports.js";
import { notify } from "../src/lib/notify.js";
import { fmtDate } from "../src/bot/format.js";

const [name, userId, ymd] = process.argv.slice(2);
if (!name || !userId) {
  console.error('Ishlatish: npm run report:test-send -w api -- "Ism" <userId> [YYYY-MM-DD]');
  process.exit(1);
}
const when = ymd ? new Date(`${ymd}T17:00:00+05:00`) : new Date();
const student = await prisma.user.findFirst({ where: { role: "STUDENT", fullName: { contains: name, mode: "insensitive" } }, select: { id: true, fullName: true } });
const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, fullName: true, telegramLink: { select: { isActive: true, username: true } } } });
if (!student) throw new Error(`Oʻquvchi topilmadi: ${name}`);
if (!target) throw new Error(`Foydalanuvchi topilmadi: ${userId}`);

const { body } = await dailyContent(student.id, when, student.fullName);
const title = `Namuna: kunlik hisobot — ${student.fullName}, ${fmtDate(when, false)}`;
await notify(prisma, { userId: target.id, type: "report.daily.test", title, body, link: "/ota-ona" });
console.log(`Yuborildi → ${target.fullName} (Telegram: ${target.telegramLink?.isActive ? (target.telegramLink.username ?? "ulangan") : "ulanmagan"})\n`);
console.log(title + "\n" + body);
await prisma.$disconnect();
