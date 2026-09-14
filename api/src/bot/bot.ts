// URFON Telegram boti (grammY). Faqat shaxsiy chatlar. Ulanmagan chatga hech qanday maʼlumot berilmaydi.
// Ulash: web kabinet → Sozlamalar → "Telegram botni ulash" → t.me/<bot>?start=<bir martalik kod>.
import { Bot, InlineKeyboard, Keyboard, type BotConfig, type Context } from "grammy";
import type { Role } from "@prisma/client";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { writeAudit } from "../lib/audit.js";
import { esc, fmtDate } from "./format.js";
import {
  type BotUser, firstName, parentChildren, renderAdminToday, renderChildrenList, renderCoins, renderDay, renderGrades,
  renderOpenHomework, renderPayments, renderTeacherReview, renderTeacherToday, renderWeek, studentDay,
} from "./views.js";

export type Log = { info: (...a: any[]) => void; warn: (...a: any[]) => void; error: (...a: any[]) => void };

type Action = "today" | "schedule" | "payments" | "grades" | "children" | "homework" | "coins" | "lessons" | "review";

export const BTN = {
  today: "Bugun",
  schedule: "Jadval",
  payments: "Toʻlovlar",
  grades: "Baholar",
  children: "Farzandlar",
  homework: "Vazifalar",
  coins: "Tangalar",
  lessons: "Bugungi darslar",
  review: "Tekshiruv",
} as const;

const LABEL_ACTION = new Map<string, Action>(Object.entries(BTN).map(([k, v]) => [v, k as Action]));

const COMMAND_ACTION: Record<string, Action> = {
  bugun: "today", jadval: "schedule", tolovlar: "payments", baholar: "grades", farzandlar: "children",
  vazifalar: "homework", tangalar: "coins", darslar: "lessons", tekshiruv: "review",
};

const ALLOWED: Record<Role, Action[]> = {
  PARENT: ["today", "schedule", "payments", "grades", "children"],
  STUDENT: ["today", "schedule", "homework", "coins"],
  TEACHER: ["lessons", "review"],
  ADMIN: ["today"],
};

export const BOT_COMMANDS = [
  { command: "start", description: "Boshlash / menyu" },
  { command: "bugun", description: "Bugungi holat" },
  { command: "yordam", description: "Yordam" },
  { command: "uzish", description: "Botni akkauntdan uzish" },
];

const ROLE_INTRO: Record<Role, string> = {
  PARENT: "Endi farzandingizning davomati, baholari, uyga vazifalari va toʻlovlari haqidagi xabarlar shu yerga keladi. Har kuni kechqurun qisqa kunlik hisobot yuboriladi.",
  STUDENT: "Endi darslar, uyga vazifalar va kumush tangalar haqidagi xabarlar shu yerga keladi.",
  TEACHER: "Endi bugungi darslaringiz va tekshiruvni kutayotgan uyga vazifalarni shu yerdan koʻrishingiz mumkin.",
  ADMIN: "Endi markazning kunlik koʻrsatkichlari va muhim bildirishnomalar shu yerga keladi.",
};

// ───────────────────────── maʼlumot qatlami ─────────────────────────

/** Chatga ulangan faol foydalanuvchi yoki null. Har bir soʻrovda qayta tekshiriladi. */
export async function linkedUser(chatId: string | number): Promise<BotUser | null> {
  const link = await prisma.telegramLink.findUnique({
    where: { chatId: String(chatId) },
    select: { isActive: true, user: { select: { id: true, role: true, fullName: true, isActive: true } } },
  });
  if (!link?.isActive || !link.user.isActive) return null;
  return { id: link.user.id, role: link.user.role, fullName: link.user.fullName };
}

/** Bir martalik kod bilan ulash. Kod atomar "band qilinadi" (ikki marta ishlatib boʻlmaydi). */
export async function linkWithCode(code: string, chatId: string, username: string | null) {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.telegramLinkCode.updateMany({ where: { code, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now } });
    if (claimed.count !== 1) return null;
    const lc = await tx.telegramLinkCode.findUniqueOrThrow({
      where: { code },
      select: { user: { select: { id: true, role: true, fullName: true, isActive: true } } },
    });
    const user = lc.user;
    if (!user.isActive) return null;
    // bitta chat — bitta foydalanuvchi: chat boshqa akkauntga ulangan boʻlsa, oʻsha bogʻlanish oʻchiriladi
    const displaced = await tx.telegramLink.findFirst({ where: { chatId, NOT: { userId: user.id } }, select: { id: true, userId: true } });
    if (displaced) await tx.telegramLink.delete({ where: { id: displaced.id } });
    const before = await tx.telegramLink.findUnique({ where: { userId: user.id }, select: { chatId: true, isActive: true } });
    const link = await tx.telegramLink.upsert({
      where: { userId: user.id },
      create: { userId: user.id, chatId, username, isActive: true },
      update: { chatId, username, isActive: true, linkedAt: now },
    });
    await writeAudit(tx, {
      actorId: user.id, actorRole: user.role, action: "telegram.link", entityType: "TelegramLink", entityId: link.id,
      summary: `Telegram bot ulandi${username ? ` (@${username})` : ""}`,
      before: before ?? undefined,
      after: { chatId, username, isActive: true, ...(displaced ? { replacedUserId: displaced.userId } : {}) },
    });
    return { user: { id: user.id, role: user.role, fullName: user.fullName } satisfies BotUser, linkId: link.id };
  });
}

/** Chatni akkauntdan uzish (isActive=false). Qaytaradi: uzilgan foydalanuvchi yoki null. */
export async function unlinkChat(chatId: string, reason: "command" | "blocked") {
  return prisma.$transaction(async (tx) => {
    const link = await tx.telegramLink.findUnique({ where: { chatId }, select: { id: true, isActive: true, user: { select: { id: true, role: true } } } });
    if (!link?.isActive) return null;
    await tx.telegramLink.update({ where: { id: link.id }, data: { isActive: false } });
    await writeAudit(tx, {
      actorId: reason === "command" ? link.user.id : null,
      actorRole: reason === "command" ? link.user.role : null,
      action: reason === "command" ? "telegram.unlink" : "telegram.blocked",
      entityType: "TelegramLink", entityId: link.id,
      summary: reason === "command" ? "Telegram bot uzildi (/uzish)" : "Foydalanuvchi botni bloklagan — Telegram ulanishi oʻchirildi",
      before: { isActive: true }, after: { isActive: false },
    });
    return link.user;
  });
}

// ───────────────────────── matnlar va klaviaturalar ─────────────────────────

const notLinkedText = (reason?: string) =>
  [
    reason ? `${reason}\n` : "Assalomu alaykum! Bu — URFON oʻquv markazining boti.\n",
    "Botdan foydalanish uchun uni shaxsiy kabinetingizga ulang:",
    `1. Platformaga kiring: ${esc(config.APP_ORIGIN)}`,
    "2. Sozlamalar → “Telegram botni ulash” tugmasini bosing.",
    "3. Ochilgan havola sizni shu botga qaytaradi va akkaunt avtomatik ulanadi.",
    "",
    "Havola 30 daqiqa amal qiladi va faqat bir marta ishlatiladi.",
  ].join("\n");

async function menuKeyboard(u: BotUser) {
  const kb = new Keyboard();
  switch (u.role) {
    case "PARENT": {
      kb.text(BTN.today).text(BTN.schedule).row().text(BTN.payments).text(BTN.grades);
      const n = await prisma.parentStudent.count({ where: { parentId: u.id } });
      if (n > 1) kb.row().text(BTN.children);
      break;
    }
    case "STUDENT":
      kb.text(BTN.today).text(BTN.schedule).row().text(BTN.homework).text(BTN.coins);
      break;
    case "TEACHER":
      kb.text(BTN.lessons).text(BTN.review);
      break;
    case "ADMIN":
      kb.text(BTN.today);
      break;
  }
  return kb.resized().persistent();
}

/** Telegram xabar chegarasi 4096 belgi — boʻlimlar boʻyicha boʻlib yuboriladi. */
export function splitMessage(text: string, limit = 3900): string[] {
  if (text.length <= limit) return [text];
  const parts: string[] = [];
  let cur = "";
  for (const block of text.split("\n")) {
    if (cur && cur.length + block.length + 1 > limit) {
      parts.push(cur);
      cur = "";
    }
    cur = cur ? `${cur}\n${block}` : block.slice(0, limit);
  }
  if (cur) parts.push(cur);
  return parts;
}

async function replyLong(ctx: Context, text: string, extra: Parameters<Context["reply"]>[1] = {}) {
  const parts = splitMessage(text);
  for (let i = 0; i < parts.length; i++) {
    await ctx.reply(parts[i], { parse_mode: "HTML", link_preview_options: { is_disabled: true }, ...(i === parts.length - 1 ? extra : {}) });
  }
}

/** Menyu amali → matn. `onlyStudentId` faqat ota-ona uchun va oldindan tekshirilgan boʻlishi kerak. */
export async function renderAction(u: BotUser, action: Action, now = new Date(), onlyStudentId?: string): Promise<{ text: string; inline?: InlineKeyboard }> {
  if (u.role === "PARENT") {
    let kids = await parentChildren(u.id);
    if (!kids.length) return { text: "Akkauntingizga hali farzand biriktirilmagan. Markaz administratoriga murojaat qiling." };
    if (onlyStudentId) kids = kids.filter((k) => k.id === onlyStudentId);
    if (action === "children") {
      const kb = new InlineKeyboard();
      for (const k of kids) {
        const n = esc(firstName(k.fullName));
        kb.text(`${n}: bugun`, `p:today:${k.id}`).text("jadval", `p:schedule:${k.id}`).text("baholar", `p:grades:${k.id}`).text("toʻlovlar", `p:payments:${k.id}`).row();
      }
      return { text: renderChildrenList(kids), inline: kb };
    }
    const blocks: string[] = [];
    for (const k of kids) {
      const name = `<b>${esc(k.fullName)}</b>`;
      if (action === "today") blocks.push(renderDay(await studentDay(k.id, now), `${name} — bugun, ${fmtDate(now, false)}`, now));
      else if (action === "schedule") blocks.push(await renderWeek(k.id, `${name} — shu haftalik jadval`, now));
      else if (action === "payments") blocks.push(await renderPayments(k.id, `${name} — toʻlovlar`, now));
      else if (action === "grades") blocks.push(await renderGrades(k.id, `${name} — oxirgi baholar`));
    }
    return { text: blocks.join("\n\n") };
  }
  if (u.role === "STUDENT") {
    if (action === "today") return { text: renderDay(await studentDay(u.id, now), `<b>Bugun, ${fmtDate(now, false)}</b>`, now) };
    if (action === "schedule") return { text: await renderWeek(u.id, "<b>Shu haftalik jadval</b>", now) };
    if (action === "homework") return { text: await renderOpenHomework(u.id, now) };
    if (action === "coins") return { text: await renderCoins(u.id, now) };
  }
  if (u.role === "TEACHER") {
    if (action === "lessons" || action === "today") return { text: await renderTeacherToday(u.id, now) };
    if (action === "review") return { text: await renderTeacherReview(u.id) };
  }
  if (u.role === "ADMIN" && action === "today") return { text: await renderAdminToday(now) };
  return { text: "Bu boʻlim sizning akkauntingiz uchun mavjud emas. Quyidagi menyudan tanlang." };
}

// ───────────────────────── bot ─────────────────────────

export function createBot(token: string, opts: { botInfo?: BotConfig<Context>["botInfo"]; log?: Log; now?: () => Date } = {}) {
  const log: Log = opts.log ?? console;
  const now = opts.now ?? (() => new Date());
  const bot = new Bot(token, opts.botInfo ? { botInfo: opts.botInfo } : undefined);

  // Faqat shaxsiy chat: guruh/kanalda maʼlumot koʻrsatilmaydi va ulanish qilinmaydi
  bot.use(async (ctx, next) => {
    if (ctx.chat && ctx.chat.type !== "private") {
      if (ctx.message?.text?.startsWith("/")) await ctx.reply("Bot faqat shaxsiy chatda ishlaydi.").catch(() => {});
      return;
    }
    await next();
  });

  const replyNotLinked = (ctx: Context, reason?: string) =>
    ctx.reply(notLinkedText(reason), { parse_mode: "HTML", link_preview_options: { is_disabled: true }, reply_markup: { remove_keyboard: true } });

  const showMenu = async (ctx: Context, u: BotUser, greeting: string) =>
    ctx.reply(greeting, { parse_mode: "HTML", reply_markup: await menuKeyboard(u) });

  const respond = async (ctx: Context, action: Action) => {
    const u = await linkedUser(ctx.chat!.id);
    if (!u) return replyNotLinked(ctx);
    if (!ALLOWED[u.role].includes(action) && !(u.role === "TEACHER" && action === "today")) {
      return showMenu(ctx, u, "Bu boʻlim sizning akkauntingiz uchun mavjud emas. Quyidagi menyudan tanlang.");
    }
    const r = await renderAction(u, action, now());
    return replyLong(ctx, r.text, r.inline ? { reply_markup: r.inline } : {});
  };

  bot.command("start", async (ctx) => {
    const code = ctx.match.trim();
    const chatId = String(ctx.chat.id);
    if (!code) {
      const u = await linkedUser(chatId);
      if (u) return showMenu(ctx, u, `Assalomu alaykum, <b>${esc(u.fullName)}</b>! Quyidagi menyudan tanlang.`);
      return replyNotLinked(ctx);
    }
    const res = /^[A-Za-z0-9_-]{6,64}$/.test(code) ? await linkWithCode(code, chatId, ctx.from?.username ?? null) : null;
    if (!res) return replyNotLinked(ctx, "Bu havola yaroqsiz yoki muddati oʻtgan.");
    log.info({ userId: res.user.id, role: res.user.role }, "Telegram bot ulandi");
    return showMenu(
      ctx,
      res.user,
      [`Assalomu alaykum, <b>${esc(res.user.fullName)}</b>!`, "URFON boti akkauntingizga ulandi.", "", ROLE_INTRO[res.user.role], "", "Botni uzish: /uzish"].join("\n"),
    );
  });

  bot.command("uzish", async (ctx) => {
    const user = await unlinkChat(String(ctx.chat.id), "command");
    if (!user) return ctx.reply("Bu chat hech qaysi akkauntga ulanmagan.", { reply_markup: { remove_keyboard: true } });
    return ctx.reply(
      "Bot akkauntingizdan uzildi. Endi bu chatga xabar yuborilmaydi.\nQayta ulash: platformada Sozlamalar → “Telegram botni ulash”.",
      { reply_markup: { remove_keyboard: true } },
    );
  });

  bot.command(["yordam", "help", "menyu", "menu"], async (ctx) => {
    const u = await linkedUser(ctx.chat.id);
    if (!u) return replyNotLinked(ctx);
    return showMenu(ctx, u, [`<b>${esc(u.fullName)}</b>, quyidagi menyudan tanlang.`, "", "Botni akkauntdan uzish: /uzish"].join("\n"));
  });

  bot.command(Object.keys(COMMAND_ACTION), (ctx) => respond(ctx, COMMAND_ACTION[ctx.message?.text?.slice(1).split(/[\s@]/)[0] ?? ""] ?? "today"));

  bot.hears([...LABEL_ACTION.keys()], (ctx) => respond(ctx, LABEL_ACTION.get(ctx.message!.text!)!));

  // Farzand tugmalari (ota-ona): p:<amal>:<studentId> — bogʻlanish har safar qayta tekshiriladi
  bot.callbackQuery(/^p:(today|schedule|payments|grades):([a-z0-9]{10,40})$/, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const u = ctx.chat ? await linkedUser(ctx.chat.id) : null;
    if (!u) return ctx.chat ? replyNotLinked(ctx) : undefined;
    const studentId = ctx.match[2];
    const own = u.role === "PARENT" && (await prisma.parentStudent.findUnique({ where: { parentId_studentId: { parentId: u.id, studentId } } }));
    if (!own) return ctx.reply("Maʼlumot topilmadi.");
    const r = await renderAction(u, ctx.match[1] as Action, now(), studentId);
    return replyLong(ctx, r.text);
  });
  bot.on("callback_query", (ctx) => ctx.answerCallbackQuery().catch(() => {}));

  // Foydalanuvchi botni bloklasa — ulanish oʻchiriladi (xabar yuborishga urinish toʻxtaydi)
  bot.on("my_chat_member", async (ctx) => {
    const st = ctx.myChatMember.new_chat_member.status;
    if (ctx.chat.type === "private" && st === "kicked") {
      const u = await unlinkChat(String(ctx.chat.id), "blocked");
      if (u) log.info({ userId: u.id }, "Foydalanuvchi botni blokladi — ulanish oʻchirildi");
    }
  });

  bot.on("message", async (ctx) => {
    const u = await linkedUser(ctx.chat.id);
    if (!u) return replyNotLinked(ctx);
    return showMenu(ctx, u, "Quyidagi menyudan tanlang.");
  });

  bot.catch((err) => log.error({ err: err.error, update: err.ctx.update.update_id }, "Telegram bot xatosi"));
  return bot;
}
