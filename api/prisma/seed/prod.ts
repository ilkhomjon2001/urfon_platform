// Production bootstrap: faqat filial (+ xonalar), leveller va bitta ADMIN. Idempotent, hech narsa o'chirmaydi.
// Ishga tushirish: ADMIN_LOGIN=+998901112233 ADMIN_PASSWORD=... ADMIN_NAME="Ism Familiya" npm run db:seed:prod -w api
// Mavjud admin parolini qayta o'rnatish uchun: ADMIN_RESET_PASSWORD=1
import { prisma } from "../../src/db.js";
import { writeAudit } from "../../src/lib/audit.js";
import { hashPassword, passwordRule } from "../../src/lib/password.js";
import { BRANCH, ROOMS } from "./data/canon.js";
import { CURRICULUM } from "./data/curriculum.js";

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

/** Telefon bo'lsa +998XXXXXXXXX ko'rinishiga keltiradi, aks holda o'zgarishsiz. */
export function normalizeLogin(raw: string) {
  const s = raw.trim();
  if (!/^[+\d\s()-]+$/.test(s)) return s;
  const d = s.replace(/\D/g, "");
  if (d.length === 9) return `+998${d}`;
  if (d.length === 12 && d.startsWith("998")) return `+${d}`;
  return s.startsWith("+") ? `+${d}` : d;
}

async function main() {
  const rawLogin = process.env.ADMIN_LOGIN?.trim();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME?.trim() || "Bosh administrator";
  if (!rawLogin) fail("ADMIN_LOGIN majburiy (masalan, +998901112233)");
  if (!password) fail("ADMIN_PASSWORD majburiy");
  if (password.length < passwordRule.min) fail(passwordRule.message);
  const login = normalizeLogin(rawLogin);

  // filial: BRANCH_NAME berilsa shu nom (haqiqiy markaz), aks holda KANON demo filiali
  const branchName = process.env.BRANCH_NAME?.trim() || BRANCH.name;
  let branch = (await prisma.branch.findFirst({ where: { name: branchName } })) ?? (await prisma.branch.findFirst());
  if (!branch) {
    branch = await prisma.branch.create({
      data: branchName === BRANCH.name ? BRANCH : { name: branchName, address: process.env.BRANCH_ADDRESS || null, phone: process.env.BRANCH_PHONE || null },
    });
  }
  // xonalar: faqat SEED_ROOMS=1 bo'lsa KANON demo xonalari (haqiqiy markazda admin o'zi qo'shadi: Guruhlar → Xonalar)
  if (process.env.SEED_ROOMS === "1") {
    for (const r of ROOMS) {
      await prisma.room.upsert({
        where: { branchId_name: { branchId: branch.id, name: r.name } },
        create: { branchId: branch.id, name: r.name, location: r.location, capacity: r.capacity, kind: r.kind },
        update: {},
      });
    }
  }
  // leveller
  // URFON oʻquv dasturi levellari (unitlari: npm run curriculum:import -w api)
  for (const l of CURRICULUM) await prisma.level.upsert({ where: { code: l.code }, create: { code: l.code, name: l.name, order: l.order }, update: {} });

  // admin
  const existing = await prisma.user.findUnique({ where: { login } });
  if (existing) {
    const reset = process.env.ADMIN_RESET_PASSWORD === "1";
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN", isActive: true, fullName: process.env.ADMIN_NAME?.trim() || existing.fullName, ...(reset ? { passwordHash: await hashPassword(password), mustChangePassword: false } : {}) },
    });
    console.log(`✓ Admin mavjud: ${login}${reset ? " (parol yangilandi)" : " (parol oʻzgartirilmadi; yangilash uchun ADMIN_RESET_PASSWORD=1)"}`);
  } else {
    const u = await prisma.user.create({
      data: { login, passwordHash: await hashPassword(password), role: "ADMIN", fullName: name, phone: login.startsWith("+") ? login : null, title: "Bosh administrator" },
    });
    await writeAudit(prisma, { actorId: null, actorRole: null, action: "user.create", entityType: "User", entityId: u.id, summary: `Tizim oʻrnatildi: administrator ${name} (${login}) yaratildi`, after: { role: "ADMIN", login } });
    console.log(`✓ Admin yaratildi: ${login} — ${name}`);
  }
  const rooms = await prisma.room.count({ where: { branchId: branch.id } });
  const levels = await prisma.level.count();
  console.log(`✓ ${branch.name}: ${rooms} ta xona, ${levels} ta level`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
