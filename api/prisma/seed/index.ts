// URFON — DEMO seed. Ishga tushirish: `npm run db:seed -w api` (platforma papkasidan).
// Sanalar real "bugun" (Asia/Tashkent) ga nisbatan; SEED_TODAY=YYYY-MM-DD bilan almashtirish mumkin.
// Langar T = bugundan oldingi/teng oxirgi GR-03 dars kuni (Du/Cho/Ju). Kanon "24-may, Juma" = T.
import { prisma } from "../../src/db.js";
import { hashPassword } from "../../src/lib/password.js";
import { deleteStored } from "../../src/lib/storage.js";
import { writeAuditLog } from "./auditlog.js";
import { planCoins, writeCoins } from "./coins.js";
import { writeExams, writeMaterials, writeMessages, writeNotifications, writeReports } from "./content.js";
import { planPayments, writePayments } from "./finance.js";
import { planHomework, writeHomework } from "./homework.js";
import { planAttendance, planLessons, writeLessons } from "./lessons.js";
import { writePeople } from "./people.js";
import { buildModel } from "./plan.js";
import { writeBranchRoomsLevels, writeGroups, writeTopics } from "./structure.js";
import { dm, makeClock } from "./util.js";

async function wipe() {
  // eski yuklangan fayllarni diskdan ham o'chiramiz (qayta seed'da axlat qolmasin)
  const files = await prisma.file.findMany({ select: { storageKey: true } }).catch(() => []);
  for (const f of files) await deleteStored(f);
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables.map((t) => `"${t.tablename}"`).join(", ");
  // AuditLog trigger'lari TRUNCATE ni ham bloklaydi — vaqtincha o'chiriladi (bitta tranzaksiyada)
  await prisma.$transaction([
    prisma.$executeRawUnsafe(`ALTER TABLE "AuditLog" DISABLE TRIGGER USER`),
    prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`),
    prisma.$executeRawUnsafe(`ALTER TABLE "AuditLog" ENABLE TRIGGER USER`),
  ]);
  return { tables: tables.length, files: files.length };
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.SEED_FORCE !== "1") {
    console.error("✗ Demo seed production muhitida ishlamaydi (majburlash uchun SEED_FORCE=1). Production uchun: npm run db:seed:prod -w api");
    process.exit(1);
  }
  const t0 = Date.now();
  const clock = makeClock();
  const step = (s: string) => console.log(`  · ${s} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  console.log(`URFON demo seed — bugun ${clock.today}, langar T = ${clock.T} (kanon 24-may, Juma), hozir ${clock.now.toISOString()}`);

  const w = await wipe();
  step(`tozalandi: ${w.tables} ta jadval, ${w.files} ta fayl`);
  const m = buildModel(clock);
  console.log(`  · kanon sanalar: 22-may → ${dm(m.L(1))}, 20-may → ${dm(m.L(2))}, 10-may → ${dm(m.L(6))}`);
  const pw = await hashPassword(process.env.DEMO_PASSWORD || "urfon2024");

  const base = await writeBranchRoomsLevels(prisma);
  const people = await writePeople(prisma, m, pw);
  step(`foydalanuvchilar: ${people.users}, Telegram: ${people.telegram}`);
  const topics = await writeTopics(prisma, m, base.levels);
  const st = { ...base, topics };
  const enrollments = await writeGroups(prisma, m, st);
  step(`guruhlar: ${m.groups.size}, aʼzolik: ${enrollments}`);

  const lessons = planLessons(m, st);
  const att = planAttendance(m, lessons);
  const hw = planHomework(m, lessons, att);
  const coins = planCoins(m, lessons, att, hw);
  await writeLessons(prisma, m, st, lessons, att);
  step(`darslar: ${[...lessons.values()].flat().length}, davomat: ${att.length}`);
  const hwr = await writeHomework(prisma, m, hw, clock);
  step(`vazifalar: ${hwr.homework}, topshiriqlar: ${hwr.submissions}, baholar: ${hwr.grades}, fayllar: ${hwr.files}`);
  const nCoins = await writeCoins(prisma, m, coins);
  step(`tanga tranzaksiyalari: ${nCoins}`);
  const pay = planPayments(m);
  const nPay = await writePayments(prisma, pay);
  step(`toʻlovlar: ${nPay}`);
  const nMat = await writeMaterials(prisma, m, st, lessons);
  const nThr = await writeMessages(prisma, m, lessons);
  const nRes = await writeExams(prisma, m, lessons, att);
  step(`materiallar: ${nMat}, suhbatlar: ${nThr}, imtihon natijalari: ${nRes}`);

  const ali = m.byKey.get("ali")!;
  const h27 = hw.hws.find((h) => h.group === "GR-03" && h.lessonN === 27)!;
  const h28 = hw.hws.find((h) => h.canon === "h28")!;
  const aliH27 = hw.subs.find((s) => s.hwId === h27.id && s.studentId === ali.id)!;
  const aliDraft = hw.subs.find((s) => s.hwId === h28.id && s.studentId === ali.id)!;
  const aliGrade = await prisma.grade.findUniqueOrThrow({ where: { submissionId: aliH27.id } });
  const nAudit = await writeAuditLog(prisma, m, { payments: pay.rows, dupPaymentId: pay.dup.id, aliGradeId: aliGrade.id, aliSubmissionId: aliDraft.id, gr05Room: st.rooms.get("204-xona")! });
  const nNot = await writeNotifications(prisma, m, lessons, hw);
  await writeReports(prisma, m, clock);
  step(`audit: ${nAudit}, bildirishnomalar: ${nNot}`);
  console.log(`✓ Tayyor: ${((Date.now() - t0) / 1000).toFixed(1)} s. Demo parol: ${process.env.DEMO_PASSWORD ? "(DEMO_PASSWORD)" : "urfon2024"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
