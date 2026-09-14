// Lokal ishlab chiqish uchun Postgres (Docker/Postgres o'rnatish shart emas).
// Foydalanish: npm run db:start   → postgresql://urfon:urfon@localhost:5433/urfon
// Ma'lumotlar .dev-db/ papkasida saqlanadi. To'xtatish: Ctrl+C.
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataDir = path.join(root, process.env.DEV_DB_DIR || ".dev-db-utf8");
const port = Number(process.env.DEV_DB_PORT || 5433);

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "urfon",
  password: "urfon",
  port,
  persistent: true,
  // Windows'da standart kodirovka WIN1252 bo'lib qoladi — oʻ/gʻ (U+02BB) saqlanmaydi
  initdbFlags: ["--encoding=UTF8", "--locale=C", "--lc-messages=C"],
  onLog: () => {},
});

const fresh = !existsSync(path.join(dataDir, "PG_VERSION"));
if (fresh) await pg.initialise();
await pg.start();
if (fresh) await pg.createDatabase("urfon");
console.log(`Postgres tayyor: postgresql://urfon:urfon@localhost:${port}/urfon`);

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
