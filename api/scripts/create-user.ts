// Ops: foydalanuvchi yaratish (odatda ustoz yoki qo'shimcha admin). Vaqtinchalik parol bir marta chiqariladi,
// birinchi kirishda almashtirish majburiy. Keyin admin panelida telefonini kiritsa, login telefonga almashadi.
//   npx tsx scripts/create-user.ts --role TEACHER --name "Muhabbat Abduqaxxorova" --login muhabbat [--title "Ustoz"]
import { prisma } from "../src/db.js";
import { normalizeLogin } from "../src/lib/auth.js";
import { writeAudit } from "../src/lib/audit.js";
import { hashPassword, tempPassword } from "../src/lib/password.js";

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1] ?? "");
const role = (args.get("role") || "TEACHER").toUpperCase();
const fullName = args.get("name")?.trim();
const rawLogin = args.get("login")?.trim();
if (!fullName || !rawLogin || !["TEACHER", "ADMIN"].includes(role)) {
  console.error('Foydalanish: tsx scripts/create-user.ts --role TEACHER|ADMIN --name "F.I.Sh" --login <telefon|login> [--title "…"]');
  process.exit(1);
}
const login = normalizeLogin(rawLogin);
if (await prisma.user.findUnique({ where: { login } })) {
  console.error(`✗ ${login} logini band`);
  process.exit(1);
}
const password = tempPassword(10);
const user = await prisma.$transaction(async (tx) => {
  const u = await tx.user.create({
    data: {
      login, fullName, role: role as "TEACHER" | "ADMIN", passwordHash: await hashPassword(password), mustChangePassword: true,
      phone: login.startsWith("+") ? login : null, title: args.get("title") || (role === "TEACHER" ? "Ustoz" : "Administrator"),
      ...(role === "TEACHER" ? { teacherProfile: { create: {} } } : {}),
    },
  });
  await writeAudit(tx, {
    actorId: null, actorRole: null, action: role === "TEACHER" ? "teacher.create" : "user.create", entityType: "User", entityId: u.id,
    summary: `${role === "TEACHER" ? "Ustoz" : "Administrator"} akkaunti ochildi: ${fullName} (${login})`, after: { role, login },
  });
  return u;
});
console.log(`✓ ${user.fullName} — login: ${user.login}  vaqtinchalik parol: ${password}  (birinchi kirishda almashtiriladi)`);
await prisma.$disconnect();
