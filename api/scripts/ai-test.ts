// AI kalitini tekshirish: qaysi provayder ulangan va namuna matn qanday chiqadi.
//   npm run ai:test -w api
import { prisma } from "../src/db.js";
import { aiProvider } from "../src/lib/ai.js";
import { parentBriefFor } from "../src/lib/parent-brief.js";

console.log("Provayder:", aiProvider === "none" ? "kalit yoʻq — zaxira shablon ishlaydi" : aiProvider);

const link = await prisma.lessonTopic.findFirst({
  where: { topic: { NOT: { lessonPlan: { equals: null } } } },
  orderBy: { lesson: { startsAt: "desc" } },
  select: { lesson: { select: { id: true, title: true, summary: true, parentBrief: true, group: { select: { name: true, ageGroup: true } } } } },
});
if (!link) {
  console.log("Rejasi bor dars topilmadi — avval dars oʻtkazilishi kerak.");
} else {
  const brief = await parentBriefFor({ ...link.lesson, parentBrief: null }); // keshni chetlab, yangi matn
  console.log("\nDars:", link.lesson.title);
  console.log("Manba:", brief.source);
  console.log("\nBugun nimani oʻrgandi:", brief.summary);
  if (brief.words.length) console.log("Yangi soʻzlar:", brief.words.join(" · "));
  console.log("Farzandingizdan soʻrashingiz mumkin:");
  for (const q of brief.questions) console.log("  •", q);
}
await prisma.$disconnect();
