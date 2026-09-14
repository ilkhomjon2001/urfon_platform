// Dev yordamchi: bitta foydalanuvchi yaratadi/yangilaydi.
// npx tsx scripts/create-dev-user.ts <login> <password> <ROLE> "<F.I.Sh>"
import { prisma } from "../src/db.js";
import { hashPassword } from "../src/lib/password.js";
import { normalizeLogin } from "../src/lib/auth.js";

const [login, password, role = "ADMIN", fullName = "Dev Admin"] = process.argv.slice(2);
if (!login || !password) {
  console.error("Foydalanish: tsx scripts/create-dev-user.ts <login> <password> [ROLE] [F.I.Sh]");
  process.exit(1);
}
const l = normalizeLogin(login);
const passwordHash = await hashPassword(password);
const u = await prisma.user.upsert({
  where: { login: l },
  update: { passwordHash, isActive: true },
  create: { login: l, passwordHash, role: role as never, fullName },
});
console.log(`OK: ${u.login} (${u.role})`);
await prisma.$disconnect();
