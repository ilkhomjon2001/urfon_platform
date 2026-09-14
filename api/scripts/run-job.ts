// Rejali ishni qoʻlda ishga tushirish (ops / test).
//   npx tsx scripts/run-job.ts <ish> [YYYY-MM-DD]
//   ishlar: daily-report | monthly-report | payments | cleanup | notifications
// Sana berilsa, ish oʻsha kuni oʻz vaqtida (Toshkent) ishlagandek bajariladi:
//   daily-report 2024-05-24   → 24-may kunlik hisoboti
//   monthly-report 2024-06-01 → May, 2024 oylik hisoboti
// "notifications" — PENDING bildirishnomalarni hozir Telegramga yuborish (TELEGRAM_BOT_TOKEN kerak).
import { Bot } from "grammy";
import { config } from "../src/config.js";
import { prisma } from "../src/db.js";
import { atTz } from "../src/lib/dates.js";
import { JOBS } from "../src/jobs/index.js";
import { processNotificationBatch, skipStaleNotifications } from "../src/bot/worker.js";

const [name, ymd] = process.argv.slice(2);
const names = [...Object.keys(JOBS), "notifications"];

if (!name || !names.includes(name) || (ymd && !/^\d{4}-\d{2}-\d{2}$/.test(ymd))) {
  console.error(`Foydalanish: run-job <${names.join("|")}> [YYYY-MM-DD]`);
  for (const [n, j] of Object.entries(JOBS)) console.error(`  ${n.padEnd(15)} ${j.at}  ${j.description}`);
  process.exit(1);
}

let code = 0;
try {
  if (name === "notifications") {
    if (!config.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN boʻsh");
    const api = new Bot(config.TELEGRAM_BOT_TOKEN).api;
    console.log("Eski (24 soat+) oʻtkazib yuborildi:", await skipStaleNotifications());
    for (;;) {
      const r = await processNotificationBatch(api);
      console.log(JSON.stringify(r));
      if (r.picked === 0 || r.rateLimited) break;
    }
  } else {
    const job = JOBS[name];
    const at = ymd ? atTz(ymd, job.at) : new Date();
    console.log(`${name} → ${at.toISOString()} (${job.description})`);
    console.log(JSON.stringify(await job.run(at, console), null, 2));
  }
} catch (e) {
  console.error(e);
  code = 1;
} finally {
  await prisma.$disconnect();
}
process.exit(code);
