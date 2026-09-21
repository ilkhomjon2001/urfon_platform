// URFON oʻquv dasturini (prisma/seed/data/curriculum.ts) bazaga yuklaydi. Qayta ishga tushirish xavfsiz:
//   • eski L1 qatori (bor boʻlsa va BEGINNER hali yoʻq boʻlsa) BEGINNER ga aylantiriladi — id, guruhlar va unitlar saqlanadi;
//   • level — code boʻyicha upsert (nom, tartib, tavsif yangilanadi);
//   • unit — (level, unit raqami) boʻyicha yangilanadi yoki yaratiladi; dasturda yoʻq unitlar ARCHIVED qilinadi;
//   • dasturda yoʻq eski levellar (L2–L6, K1, K2, KIDS …): guruhlari LEGACY_LEVELS boʻyicha yangi levelga koʻchiriladi
//     (K* dagilar 8–12 yosh deb belgilanadi), unitlari arxivlanadi, hech narsaga bogʻlanmagan unitlar va boʻsh level oʻchiriladi.
// Ishlatish: npm run curriculum:import -w api            (production: docker compose exec app npm run curriculum:import -w api)
//            npm run curriculum:import -w api -- --dry   (faqat nima oʻzgarishini koʻrsatadi)
import { Prisma } from "@prisma/client";
import { prisma } from "../src/db.js";
import { writeAudit } from "../src/lib/audit.js";
import { CURRICULUM, LEGACY_LEVELS } from "../prisma/seed/data/curriculum.js";

const dry = process.argv.includes("--dry");
const json = (v: unknown[] | undefined) => (v?.length ? (v as Prisma.InputJsonValue) : Prisma.DbNull);

async function main() {
  const stats = {
    levelsCreated: 0, levelsUpdated: 0, topicsCreated: 0, topicsUpdated: 0, topicsArchived: 0,
    renamed: [] as string[], groupsMoved: [] as string[], levelsRemoved: [] as string[], levelsKept: [] as string[],
  };

  // 1) L1 → BEGINNER (bir martalik): guruhlar va unitlar oʻz joyida qoladi
  const beginner = await prisma.level.findUnique({ where: { code: "BEGINNER" } });
  const l1 = await prisma.level.findUnique({ where: { code: "L1" } });
  if (!beginner && l1) {
    if (!dry) await prisma.level.update({ where: { id: l1.id }, data: { code: "BEGINNER" } });
    stats.renamed.push("L1 → BEGINNER");
  }

  // 2) Dasturdagi levellar va unitlar
  for (const lv of CURRICULUM) {
    const before = await prisma.level.findUnique({ where: { code: lv.code } });
    if (dry) {
      console.log(`${before ? "~" : "+"} ${lv.code} · ${lv.name} (${lv.cefr}, ${lv.units.length} unit)`);
      if (before) stats.levelsUpdated++;
      else stats.levelsCreated++;
      continue;
    }
    const meta = { name: lv.name, order: lv.order, audience: lv.audience, cefr: lv.cefr, weeks: lv.weeks, description: lv.description };
    const level = await prisma.level.upsert({ where: { code: lv.code }, create: { code: lv.code, ...meta }, update: meta });
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
        lessonPlan: json(u.lessonPlan),
        kidsPlan: json(u.kidsPlan),
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

  // 3) Dasturda yoʻq eski levellar
  const codes = CURRICULUM.map((l) => l.code);
  const old = await prisma.level.findMany({
    where: { code: { notIn: codes } },
    select: { id: true, code: true, groups: { select: { id: true, code: true } } },
  });
  for (const o of old) {
    const map = LEGACY_LEVELS[o.code];
    const target = map ? await prisma.level.findUnique({ where: { code: map.to }, select: { id: true } }) : null;
    if (target && o.groups.length) {
      if (!dry) {
        await prisma.group.updateMany({
          where: { levelId: o.id },
          data: { levelId: target.id, ...(map!.kids ? { ageGroup: "KIDS" as const } : {}) },
        });
      }
      stats.groupsMoved.push(`${o.groups.map((g) => g.code).join(", ")}: ${o.code} → ${map!.to}${map!.kids ? " (8–12 yosh)" : ""}`);
    }
    if (dry) continue;
    await prisma.topic.updateMany({ where: { levelId: o.id, status: { not: "ARCHIVED" } }, data: { status: "ARCHIVED" } });
    // hech narsaga bogʻlanmagan unitlar oʻchiriladi; darsda, vazifada yoki materialda ishlatilganlari arxivda qoladi
    await prisma.topic.deleteMany({ where: { levelId: o.id, lessons: { none: {} }, homework: { none: {} }, materials: { none: {} } } });
    const left = await prisma.level.findUnique({ where: { id: o.id }, select: { _count: { select: { groups: true, topics: true } } } });
    if (left && left._count.groups === 0 && left._count.topics === 0) {
      await prisma.level.delete({ where: { id: o.id } });
      stats.levelsRemoved.push(o.code);
    } else if (left) {
      stats.levelsKept.push(`${o.code} (${left._count.groups} guruh, ${left._count.topics} arxivdagi unit — darslarda ishlatilgan)`);
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
