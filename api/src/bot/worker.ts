// Bildirishnoma worker: Notification outbox (status=PENDING, telegram=true) → Telegram.
// Bir nechta nusxa ishlasa ham ikki marta yuborilmaydi: qatorlar `FOR UPDATE SKIP LOCKED` bilan
// tranzaksiya davomida qulflanadi va shu tranzaksiyada SENT/SKIPPED/FAILED qilinadi.
// Kafolat: "kamida bir marta" — jarayon yuborish va commit orasida qulasa, paketdagi xabar qayta ketishi mumkin.
import { GrammyError, InlineKeyboard, type Api } from "grammy";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { writeAudit } from "../lib/audit.js";
import { esc } from "./format.js";
import type { Log } from "./bot.js";

export const WORKER = {
  intervalMs: 5_000,
  batch: 20,
  maxAttempts: 5,
  backoffBaseSec: 30, // n-urinish createdAt + 30·(2ⁿ−1) s dan keyin: 30 s, 1.5 daq, 3.5 daq, 7.5 daq
  globalGapMs: 40, // ≈25 xabar/s (Telegram: ~30/s)
  chatGapMs: 1_000, // bitta chatga 1 xabar/s
  staleHours: 24,
};

let timer: NodeJS.Timeout | null = null;
let running: Promise<unknown> | null = null;
let stopped = true;
let pausedUntil = 0;
let lastGlobal = 0;
const lastPerChat = new Map<string, number>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function pace(chatId: string) {
  const now = Date.now();
  const wait = Math.max(lastGlobal + WORKER.globalGapMs - now, (lastPerChat.get(chatId) ?? 0) + WORKER.chatGapMs - now, 0);
  if (wait > 0) await sleep(wait);
  lastGlobal = Date.now();
  lastPerChat.set(chatId, lastGlobal);
  if (lastPerChat.size > 5000) lastPerChat.clear();
}

/** Ilova ichidagi yoʻl → toʻliq URL. Telegram URL-tugmasi faqat https (localhost rad etiladi). */
export function notificationMessage(n: { title: string; body: string; link: string | null }) {
  let text = `<b>${esc(n.title)}</b>\n${esc(n.body)}`;
  let markup: InlineKeyboard | undefined;
  if (n.link) {
    const url = /^https?:\/\//.test(n.link) ? n.link : `${config.APP_ORIGIN.replace(/\/$/, "")}${n.link.startsWith("/") ? "" : "/"}${n.link}`;
    if (url.startsWith("https://")) markup = new InlineKeyboard().url("Platformada ochish", url);
    else text += `\n\n${esc(url)}`;
  }
  return { text, markup };
}

/** Ishga tushganda: 24 soatdan eski PENDING'lar yuborilmaydi (uzilishdan keyin "sel" boʻlmasin). */
export async function skipStaleNotifications(now = new Date()) {
  const r = await prisma.notification.updateMany({
    where: { status: "PENDING", telegram: true, createdAt: { lt: new Date(now.getTime() - WORKER.staleHours * 3_600_000) } },
    data: { status: "SKIPPED", error: `${WORKER.staleHours} soatdan eski — Telegramga yuborilmadi` },
  });
  return r.count;
}

type Row = { id: string; userId: string; title: string; body: string; link: string | null; attempts: number };
export type BatchResult = { picked: number; sent: number; skipped: number; failed: number; retry: number; rateLimited: boolean };

/** Bitta paket: qulflash → yuborish → holatni yozish (bitta tranzaksiyada). */
export async function processNotificationBatch(api: Api, log: Log = console): Promise<BatchResult> {
  const res: BatchResult = { picked: 0, sent: 0, skipped: 0, failed: 0, retry: 0, rateLimited: false };
  await prisma.$transaction(
    async (tx) => {
      // createdAt — UTC timestamp (tz'siz), shuning uchun now() ham UTC'ga keltiriladi
      const rows = await tx.$queryRaw<Row[]>`
        SELECT id, "userId", title, body, link, attempts
        FROM "Notification"
        WHERE status = 'PENDING' AND telegram = true
          AND "createdAt" <= (now() AT TIME ZONE 'UTC') - make_interval(secs => ${WORKER.backoffBaseSec}::double precision * (power(2, attempts) - 1))
        ORDER BY "createdAt" ASC
        LIMIT ${WORKER.batch}
        FOR UPDATE SKIP LOCKED`;
      res.picked = rows.length;
      if (!rows.length) return;

      const links = await tx.telegramLink.findMany({
        where: { userId: { in: [...new Set(rows.map((r) => r.userId))] }, isActive: true, user: { isActive: true } },
        select: { id: true, userId: true, chatId: true },
      });
      const linkOf = new Map(links.map((l) => [l.userId, l]));

      for (const n of rows) {
        const link = linkOf.get(n.userId);
        if (!link) {
          await tx.notification.update({ where: { id: n.id }, data: { status: "SKIPPED", error: "Telegram ulanmagan" } });
          res.skipped++;
          continue;
        }
        const { text, markup } = notificationMessage(n);
        try {
          await pace(link.chatId);
          await api.sendMessage(link.chatId, text, { parse_mode: "HTML", link_preview_options: { is_disabled: true }, reply_markup: markup });
          await tx.notification.update({ where: { id: n.id }, data: { status: "SENT", sentAt: new Date(), attempts: n.attempts + 1, error: null } });
          res.sent++;
        } catch (e) {
          if (e instanceof GrammyError && e.error_code === 429) {
            // Telegram "sekinroq" dedi: urinish hisoblanmaydi, qolganlari keyingi aylanishda
            pausedUntil = Date.now() + (e.parameters.retry_after ?? 5) * 1000;
            res.rateLimited = true;
            break;
          }
          const desc = e instanceof GrammyError ? `${e.error_code}: ${e.description}` : e instanceof Error ? e.message : String(e);
          const dead = e instanceof GrammyError && (e.error_code === 403 || (e.error_code === 400 && /chat not found|user is deactivated/i.test(e.description)));
          if (dead) {
            // bot bloklangan / chat yoʻq — ulanish oʻchiriladi, keyingi xabarlar SKIPPED boʻladi
            await tx.telegramLink.update({ where: { id: link.id }, data: { isActive: false } });
            await writeAudit(tx, {
              action: "telegram.blocked", entityType: "TelegramLink", entityId: link.id,
              summary: `Telegramga yuborib boʻlmadi (${desc.slice(0, 120)}) — ulanish oʻchirildi`,
              before: { isActive: true }, after: { isActive: false },
            });
            linkOf.delete(n.userId);
            await tx.notification.update({ where: { id: n.id }, data: { status: "FAILED", attempts: n.attempts + 1, error: desc.slice(0, 500) } });
            res.failed++;
            continue;
          }
          const attempts = n.attempts + 1;
          const final = attempts >= WORKER.maxAttempts;
          await tx.notification.update({ where: { id: n.id }, data: { attempts, error: desc.slice(0, 500), ...(final ? { status: "FAILED" } : {}) } });
          if (final) res.failed++;
          else res.retry++;
          log.warn({ notificationId: n.id, attempts, err: desc }, "Telegram xabar yuborilmadi");
        }
      }
    },
    { timeout: 120_000, maxWait: 10_000 },
  );
  return res;
}

export function startWorker(api: Api, log: Log) {
  if (!stopped) return;
  stopped = false;
  const tick = async () => {
    if (stopped) return;
    running = (async () => {
      try {
        if (Date.now() < pausedUntil) return;
        // navbat boʻshaguncha (bir aylanishda koʻpi bilan 10 paket)
        for (let i = 0; i < 10 && !stopped; i++) {
          const r = await processNotificationBatch(api, log);
          if (r.sent || r.failed) log.info({ ...r }, "Telegram bildirishnomalar");
          if (r.picked < WORKER.batch || r.rateLimited) break;
        }
      } catch (e) {
        log.error(e, "Bildirishnoma worker xatosi");
      }
    })();
    await running;
    running = null;
    if (!stopped) timer = setTimeout(tick, WORKER.intervalMs);
  };
  timer = setTimeout(tick, 1_000);
}

export async function stopWorker() {
  stopped = true;
  if (timer) clearTimeout(timer);
  timer = null;
  await running;
}
