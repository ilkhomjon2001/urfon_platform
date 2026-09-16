// URFON oʻquv dasturini (prisma/seed/data/curriculum.ts) bazaga yuklaydi: levellar nomi va tartibi,
// CEFR va IELTS dasturlari, har bir unit (Topic). Qayta ishga tushirish xavfsiz:
//   • level — code boʻyicha upsert (nom va tartib yangilanadi);
//   • unit — (level, unit raqami) boʻyicha yangilanadi yoki yaratiladi; dasturdan chiqib qolgan unitlar ARCHIVED qilinadi;
//   • dasturda yoʻq eski level — guruh ham, unit ham bogʻlanmagan boʻlsa oʻchiriladi, aks holda qoldiriladi (hisobotda koʻrinadi).
// Ishlatish: npm run curriculum:import -w api            (production: docker compose exec app npm run curriculum:import -w api)
//            npm run curriculum:import -w api -- --dry   (faqat nima oʻzgarishini koʻrsatadi)
import { Prisma } from "@prisma/client";
import { prisma } from "../src/db.js";
import { writeAudit } from "../src/lib/audit.js";
import { CURRICULUM } from "../prisma/seed/data/curriculum.js";

const dry = process.argv.includes("--dry");

async function main() {
  const stats = { levelsCreated: 0, levelsUpdated: 0, topicsCreated: 0, topicsUpdated: 0, topicsArchived: 0, levelsRemoved: [] as string[], levelsKept: [] as string[] };

  for (const lv of CURRICULUM) {
    const before = await prisma.level.findUnique({ where: { code: lv.code } });
    if (dry) {
      console.log(`${before ? "~" : "+"} ${lv.code} · ${lv.name} (${lv.cefr}, ${lv.weeks} hafta, ${lv.units.length} unit)`);
      if (before) stats.levelsUpdated++;
      else stats.levelsCreated++;
      continue;
    }
    const meta = { name: lv.name, order: lv.order, audience: lv.audience, cefr: lv.cefr, weeks: lv.weeks, description: lv.description };
    const level = await prisma.level.upsert({
      where: { code: lv.code },
      create: { code: lv.code, ...meta },
      update: meta,
    });
    if (before) stats.levelsUpdated++;
    else stats.levelsCreated++;

    const existing = await prisma.topic.findMany({ where: { levelId: level.id }, select: { id: true, unit: true, status: true } });
    const byUnit = new Map(existing.map((t) => [t.unit, t]));
    for (const u of lv.units) {
      const data = {
        title: u.title,
        description: u.description,
        objectives: u.objectives,
        vocabulary: u.vocabulary,
        grammar: u.grammar,
        lessonsCount: u.lessonsCount,
        hours: u.hours,
        lessonPlan: u.lessonPlan?.length ? (u.lessonPlan as Prisma.InputJsonValue) : Prisma.DbNull,
        status: "PUBLISHED" as const,
      };
      const cur = byUnit.get(u.unit);
      if (cur) {
        await prisma.topic.update({ where: { id: cur.id }, data });
        stats.topicsUpdated++;
      } else {
        await prisma.topic.create({ data: { ...data, levelId: level.id, unit: u.unit } });
        stats.topicsCreated++;
      }
    }
    const units = new Set(lv.units.map((u) => u.unit));
    const stale = existing.filter((t) => !units.has(t.unit) && t.status !== "ARCHIVED");
    if (stale.length) {
      await prisma.topic.updateMany({ where: { id: { in: stale.map((t) => t.id) } }, data: { status: "ARCHIVED" } });
      stats.topicsArchived += stale.length;
    }
  }

  // Dasturda yoʻq eski levellar (masalan, demo "KIDS")
  const codes = CURRICULUM.map((l) => l.code);
  const old = await prisma.level.findMany({
    where: { code: { notIn: codes } },
    select: { id: true, code: true, name: true, _count: { select: { groups: true, topics: true } } },
  });
  for (const o of old) {
    if (o._count.groups === 0 && o._count.topics === 0) {
      if (!dry) await prisma.level.delete({ where: { id: o.id } });
      stats.levelsRemoved.push(o.code);
    } else {
      stats.levelsKept.push(`${o.code} (${o._count.groups} guruh, ${o._count.topics} unit)`);
    }
  }

  const total = CURRICULUM.reduce((s, l) => s + l.units.length, 0);
  const summary = `Oʻquv dasturi yuklandi: ${CURRICULUM.length} ta level, ${total} ta unit (yangi ${stats.topicsCreated}, yangilangan ${stats.topicsUpdated})`;
  if (!dry) {
    await writeAudit(prisma, {
      actorId: null,
      actorRole: null,
      action: "curriculum.import",
      entityType: "Level",
      entityId: null,
      summary,
      after: { levels: CURRICULUM.map((l) => ({ code: l.code, name: l.name, units: l.units.length })), ...stats },
    });
  }
  console.log(`${dry ? "[dry] " : "✓ "}${summary}`);
  console.log(stats);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
