// Dev: seed qilingan bazani har bir agent/dasturchi uchun nusxalaydi (Postgres TEMPLATE — bir zumda).
// Foydalanish: node tools/clone-db.mjs <manba> <nom1> [nom2 …]
//   node tools/clone-db.mjs urfon urfon_admin urfon_teacher
// Manba bazaga shu payt hech kim ulanmagan bo'lishi kerak (API'ni vaqtincha to'xtating).
import { createRequire } from "node:module";
const require = createRequire(new URL("../api/package.json", import.meta.url));
const { PrismaClient } = require("@prisma/client");

const [src, ...targets] = process.argv.slice(2);
if (!src || !targets.length) {
  console.error("Foydalanish: node tools/clone-db.mjs <manba> <nom1> [nom2 …]");
  process.exit(1);
}
const ident = (s) => {
  if (!/^[a-z_][a-z0-9_]*$/.test(s)) throw new Error(`Notoʻgʻri baza nomi: ${s}`);
  return `"${s}"`;
};
const base = process.env.DEV_DB_ADMIN_URL || "postgresql://urfon:urfon@localhost:5433/postgres";
const db = new PrismaClient({ datasources: { db: { url: base } } });
try {
  for (const t of targets) {
    await db.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${ident(t)} WITH (FORCE)`);
    await db.$executeRawUnsafe(`CREATE DATABASE ${ident(t)} TEMPLATE ${ident(src)}`);
    console.log(`OK: ${src} → ${t}`);
  }
} finally {
  await db.$disconnect();
}
