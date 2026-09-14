// Administrator akkauntini yaratish (production'da birinchi admin uchun).
//   npm run admin:create -w api                       (ADMIN_LOGIN, ADMIN_PASSWORD, ADMIN_NAME muhitdan)
//   npx tsx scripts/create-admin.ts <login> <parol> ["F.I.Sh"] [--reset-password]
// Login mavjud boʻlsa: admin boʻlsa — faqat --reset-password bilan parol yangilanadi; boshqa rol — xato.
import { prisma } from "../src/db.js";
import { writeAudit } from "../src/lib/audit.js";
import { hashPassword, passwordRule } from "../src/lib/password.js";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const reset = process.argv.includes("--reset-password");
const rawLogin = (args[0] ?? process.env.ADMIN_LOGIN ?? "").trim();
const password = args[1] ?? process.env.ADMIN_PASSWORD ?? "";
const fullName = (args[2] ?? process.env.ADMIN_NAME ?? "Bosh administrator").trim();

// lib/auth.ts normalizeLogin bilan bir xil (u config/JWT_SECRET ni talab qilgani uchun bu yerda takrorlangan)
function normalizeLogin(raw: string) {
  const s = raw.trim();
  const st = s.match(/^st[\s-]?(\d{3,6})$/i);
  if (st) return `ST-${st[1]}`;
  const digits = s.replace(/[^\d]/g, "");
  if (/^[+\d\s()-]+$/.test(s) && digits.length >= 9) return digits.length === 9 ? `+998${digits}` : `+${digits}`;
  return s.toLowerCase();
}

async function main() {
  if (!rawLogin || !password) {
    console.error("ADMIN_LOGIN va ADMIN_PASSWORD berilmagan. Foydalanish: create-admin <login> <parol> [\"F.I.Sh\"] [--reset-password]");
    return 1;
  }
  if (password.length < passwordRule.min) {
    console.error(passwordRule.message);
    return 1;
  }
  const login = normalizeLogin(rawLogin);
  const existing = await prisma.user.findUnique({ where: { login } });
  if (existing) {
    if (existing.role !== "ADMIN") {
      console.error(`"${login}" loginli foydalanuvchi allaqachon bor (rol: ${existing.role}).`);
      return 1;
    }
    if (!reset) {
      console.log(`Admin allaqachon mavjud: ${login}. Parolni yangilash uchun --reset-password qoʻshing.`);
      return 0;
    }
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: existing.id }, data: { passwordHash: await hashPassword(password), isActive: true } });
      await writeAudit(tx, { action: "user.password_reset", entityType: "User", entityId: existing.id, summary: `Admin paroli CLI orqali yangilandi (${login})` });
    });
    console.log(`OK: ${login} paroli yangilandi`);
    return 0;
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({ data: { login, passwordHash, role: "ADMIN", fullName, title: "Bosh administrator", phone: login.startsWith("+") ? login : null } });
    await writeAudit(tx, { action: "user.create", entityType: "User", entityId: u.id, summary: `Administrator yaratildi (CLI): ${fullName}`, after: { login, role: "ADMIN" } });
    return u;
  });
  console.log(`OK: administrator yaratildi — ${user.login} (${user.fullName})`);
  return 0;
}

const code = await main().catch((e) => {
  console.error(e);
  return 1;
});
await prisma.$disconnect();
process.exit(code);
