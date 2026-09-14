import { config } from "./config.js";
import { buildApp } from "./app.js";
import { prisma } from "./db.js";
import { startBot, stopBot } from "./bot/index.js";
import { startJobs, stopJobs } from "./jobs/index.js";

const app = await buildApp();
await app.listen({ port: config.PORT, host: config.HOST });

// Bot va rejali ishlar API bilan bir jarayonda (token bo'lmasa bot o'chiq)
try {
  await startBot(app.log);
} catch (e) {
  app.log.error(e, "Telegram botni ishga tushirib boʻlmadi");
}
startJobs(app.log);

const shutdown = async (signal: string) => {
  app.log.info(`${signal}: toʻxtatilmoqda…`);
  stopJobs();
  await stopBot().catch(() => {});
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
