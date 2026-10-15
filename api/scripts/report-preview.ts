// Ota-onaga ketadigan kunlik xabarni koʻrsatadi (hech narsa yuborilmaydi, bazaga yozilmaydi).
//   npm run report:preview -w api            → bugun darsi boʻlgan birinchi oʻquvchi
//   npm run report:preview -w api -- Zuhra   → ismi mos oʻquvchi
import { prisma } from "../src/db.js";
import { dailyContent } from "../src/jobs/reports.js";
import { endOfDayTz, startOfDayTz } from "../src/lib/dates.js";

const q = process.argv.slice(2).join(" ").trim();
const now = new Date();
const lessons = await prisma.lesson.findMany({
  where: { startsAt: { gte: startOfDayTz(now), lte: endOfDayTz(now) }, status: { not: "CANCELLED" } },
  select: { group: { select: { name: true, students: { where: { status: "ACTIVE" }, select: { student: { select: { id: true, fullName: true } } } } } } },
});
const all = lessons.flatMap((l) => l.group.students.map((s) => s.student));
const student = q ? all.find((s) => s.fullName.toLowerCase().includes(q.toLowerCase())) : all[0];
if (!student) {
  console.log(q ? `“${q}” boʻyicha bugun darsi boʻlgan oʻquvchi topilmadi.` : "Bugun darsi boʻlgan oʻquvchi yoʻq.");
} else {
  const { body } = await dailyContent(student.id, now, student.fullName);
  console.log(`=== ${student.fullName} ===\n`);
  console.log(body);
}
await prisma.$disconnect();
