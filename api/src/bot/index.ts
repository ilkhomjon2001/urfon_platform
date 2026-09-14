// Telegram bot (grammY) + bildirishnoma worker. API bilan bir jarayonda ishlaydi (src/index.ts).
// Rejim: long polling. Webhook hozircha yoʻq (bitta server uchun polling yetarli; kelajakda
// TELEGRAM_WEBHOOK_URL bilan Fastify route qoʻshish mumkin — deploy/README-DEPLOY.md).
import type { FastifyBaseLogger } from "fastify";
import type { Bot } from "grammy";
import { config } from "../config.js";
import { BOT_COMMANDS, createBot } from "./bot.js";
import { skipStaleNotifications, startWorker, stopWorker } from "./worker.js";

let bot: Bot | null = null;

export async function startBot(log: FastifyBaseLogger) {
  if (!config.TELEGRAM_BOT_TOKEN) {
    log.info("Telegram bot oʻchiq (TELEGRAM_BOT_TOKEN boʻsh) — bildirishnomalar faqat ilova ichida koʻrinadi");
    return;
  }
  const b = createBot(config.TELEGRAM_BOT_TOKEN, { log });
  await b.init(); // getMe — token notoʻgʻri boʻlsa shu yerda xato
  if (b.botInfo.username.toLowerCase() !== config.TELEGRAM_BOT_USERNAME.replace(/^@/, "").toLowerCase()) {
    log.warn(
      `TELEGRAM_BOT_USERNAME (${config.TELEGRAM_BOT_USERNAME}) haqiqiy bot nomiga (@${b.botInfo.username}) mos emas — ulash havolalari notoʻgʻri boʻladi`,
    );
  }
  await b.api.setMyCommands(BOT_COMMANDS).catch((e) => log.warn(e, "setMyCommands bajarilmadi"));
  const stale = await skipStaleNotifications();
  if (stale) log.info(`${stale} ta eski (24 soatdan ortiq) bildirishnoma Telegramga yuborilmaydi`);
  bot = b;
  void b
    .start({
      allowed_updates: ["message", "callback_query", "my_chat_member"],
      onStart: (me) => log.info(`Telegram bot ishga tushdi: @${me.username} (long polling)`),
    })
    .catch((e) => log.error(e, "Telegram long polling toʻxtadi (token yoki boshqa nusxa bilan ziddiyat?)"));
  startWorker(b.api, log);
}

export async function stopBot() {
  await stopWorker();
  if (bot?.isRunning()) await bot.stop();
  bot = null;
}
