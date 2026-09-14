// Rejali ishlar (croner, Asia/Tashkent). Hammasi idempotent — qoʻlda qayta ishga tushirish
// (scripts/run-job.ts) yoki ikkinchi nusxa takroriy hisobot/xabar yaratmaydi.
import { Cron } from "croner";
import type { FastifyBaseLogger } from "fastify";
import type { Log } from "../bot/bot.js";
import { runCleanup } from "./cleanup.js";
import { runPaymentJobs } from "./payments.js";
import { runDailyParentReports, runMonthlyReports } from "./reports.js";

export { runCleanup, runPaymentJobs, runDailyParentReports, runMonthlyReports };

export const TZ = "Asia/Tashkent";

type Job = { pattern: string; at: string; description: string; run: (now: Date, log: Log) => Promise<unknown> };

export const JOBS: Record<string, Job> = {
  "daily-report": { pattern: "30 20 * * *", at: "20:30", description: "Ota-onalarga kunlik hisobot", run: runDailyParentReports },
  "monthly-report": { pattern: "0 10 1 * *", at: "10:00", description: "Oylik hisobot (ota-ona + admin)", run: runMonthlyReports },
  payments: { pattern: "0 10 * * *", at: "10:00", description: "Toʻlov eslatmasi va muddati oʻtganlar", run: runPaymentJobs },
  cleanup: { pattern: "0 3 * * *", at: "03:00", description: "Eski sessiya va ulash kodlarini tozalash", run: runCleanup },
};

let crons: Cron[] = [];
let catchUpTimer: NodeJS.Timeout | null = null;

async function runLogged(name: string, log: Log, now = new Date()) {
  const t = Date.now();
  try {
    const r = await JOBS[name].run(now, log);
    log.info({ job: name, ms: Date.now() - t, result: r }, `Rejali ish bajarildi: ${name}`);
  } catch (e) {
    log.error(e, `Rejali ish xatosi: ${name}`);
  }
}

/** Server oʻsha vaqtda oʻchiq boʻlgan boʻlsa — ishga tushganda bugungi oʻtkazib yuborilgan ishlarni bajaradi. */
async function catchUp(log: Log) {
  const local = new Date(Date.now() + 5 * 3_600_000);
  const hm = local.getUTCHours() * 60 + local.getUTCMinutes();
  if (hm >= 20 * 60 + 30) await runLogged("daily-report", log);
  if (hm >= 10 * 60 && hm < 20 * 60) await runLogged("payments", log);
  if (local.getUTCDate() === 1 && hm >= 10 * 60) await runLogged("monthly-report", log);
}

export function startJobs(log: FastifyBaseLogger) {
  stopJobs();
  for (const name of Object.keys(JOBS)) {
    crons.push(new Cron(JOBS[name].pattern, { name, timezone: TZ, protect: true }, () => runLogged(name, log)));
  }
  catchUpTimer = setTimeout(() => void catchUp(log), 30_000);
  log.info(`Rejali ishlar yoqildi (${TZ}): ${Object.entries(JOBS).map(([n, j]) => `${n} ${j.at}`).join(", ")}`);
}

export function stopJobs() {
  for (const c of crons) c.stop();
  crons = [];
  if (catchUpTimer) clearTimeout(catchUpTimer);
  catchUpTimer = null;
}
