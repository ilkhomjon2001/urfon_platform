// Oʻquvchi va ota-onalarga doimiy parol berib, roʻyxatni CSV holida chiqaradi (chop etish yoki Excel uchun).
// Admin paneldagi «Kirish maʼlumotlari» sahifasi bilan bir xil ish qiladi — bu variant server tarafida ishlaydi.
//   npm run credentials:issue -w api             → faqat hali kabinetga kirmaganlarga (xavfsiz)
//   npm run credentials:issue -w api -- --all    → hammaga (kabinetdan foydalanayotganlar ham chiqib ketadi!)
//   npm run credentials:issue -w api -- --dry    → hech nima oʻzgartirmay, kimga tegishini koʻrsatadi
import { prisma } from "../src/db.js";
import { writeAudit } from "../src/lib/audit.js";
import { hashPassword, tempPassword } from "../src/lib/password.js";

const all = process.argv.includes("--all");
const dry = process.argv.includes("--dry");

const csvCell = (v: string) => (/[;"\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);

async function main() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", isActive: true, studentProfile: { status: { not: "LEFT" } } },
    orderBy: { fullName: "asc" },
    select: {
      id: true, fullName: true, login: true, lastLoginAt: true,
      enrollments: {
        where: { status: { in: ["ACTIVE", "WAITING"] } },
        orderBy: { joinedAt: "desc" },
        take: 1,
        select: { group: { select: { code: true, name: true } } },
      },
      parents: { orderBy: { createdAt: "asc" }, select: { relation: true, parent: { select: { id: true, fullName: true, login: true, lastLoginAt: true } } } },
    },
  });

  type Row = { userId: string; kind: string; fullName: string; student: string; group: string; login: string; lastLoginAt: Date | null };
  const rows: Row[] = [];
  for (const s of students) {
    const group = s.enrollments[0] ? `${s.enrollments[0].group.code} · ${s.enrollments[0].group.name}` : "";
    rows.push({ userId: s.id, kind: "Oʻquvchi", fullName: s.fullName, student: s.fullName, group, login: s.login, lastLoginAt: s.lastLoginAt });
    for (const p of s.parents) {
      rows.push({ userId: p.parent.id, kind: `Ota-ona (${p.relation})`, fullName: p.parent.fullName, student: s.fullName, group, login: p.parent.login, lastLoginAt: p.parent.lastLoginAt });
    }
  }
  // bitta ota-ona bir necha farzandga biriktirilgan boʻlsa, parol bir marta yangilanadi
  const seen = new Set<string>();
  const target = rows.filter((r) => (all || !r.lastLoginAt) && !seen.has(r.userId) && (seen.add(r.userId), true));

  if (dry) {
    console.log(`[dry] ${target.length} ta akkauntga parol beriladi (jami ${rows.length} qator):`);
    for (const r of target) console.log(`  ${r.kind} · ${r.fullName} · ${r.login}${r.lastLoginAt ? " (kabinetdan foydalanmoqda!)" : ""}`);
    return;
  }

  const made = new Map<string, string>();
  for (const r of target) {
    const pw = tempPassword();
    const hash = await hashPassword(pw);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: r.userId }, data: { passwordHash: hash, mustChangePassword: false } });
      await tx.session.updateMany({ where: { userId: r.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    });
    made.set(r.userId, pw);
  }
  await writeAudit(prisma, {
    actorId: null,
    actorRole: null,
    action: "credentials.bulk_reset",
    entityType: "User",
    entityId: "script",
    summary: `Skript orqali ommaviy parol berildi: ${made.size} ta akkaunt${all ? " (hammaga)" : " (hali kirmaganlarga)"}`,
    after: { count: made.size, all },
  });

  console.log(["Kim", "Ism", "Oʻquvchi", "Guruh", "Login", "Parol"].join(";"));
  for (const r of rows) {
    const pw = made.get(r.userId);
    console.log([r.kind, r.fullName, r.student, r.group, r.login, pw ?? "(eski parol saqlandi)"].map(csvCell).join(";"));
  }
  console.error(`\n✓ ${made.size} ta akkauntga yangi parol berildi`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
