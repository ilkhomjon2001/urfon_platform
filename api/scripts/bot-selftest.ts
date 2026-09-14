// Oflayn selftest: haqiqiy token va tarmoqsiz — bot (grammY transformer bilan), worker, turniket, rejali ishlar.
//   DATABASE_URL=postgresql://urfon:urfon@localhost:5433/urfon_ops JWT_SECRET=<32+> npx tsx scripts/bot-selftest.ts
// Har ishga tushishda yangi (suffiksli) fixture'lar yaratiladi. Lead bazasida (urfon) ishlamaydi.
export {};
process.env.TURNSTILE_API_KEY ||= "selftest-turnstile-key-0123456789abcdef";
process.env.APP_ORIGIN ||= "https://urfon.test";
process.env.NODE_ENV ||= "test";
process.env.TELEGRAM_BOT_USERNAME ||= "urfon_test_bot";

const dbUrl = process.env.DATABASE_URL ?? "";
if (!dbUrl || new URL(dbUrl).pathname.replace(/^\//, "") === "urfon") {
  console.error("Selftest faqat alohida test bazasida ishlaydi (DATABASE_URL=…/urfon_ops).");
  process.exit(2);
}

const { prisma } = await import("../src/db.js");
const { createBot } = await import("../src/bot/bot.js");
const { processNotificationBatch, skipStaleNotifications } = await import("../src/bot/worker.js");
const { buildApp } = await import("../src/app.js");
const { runDailyParentReports, runPaymentJobs, runCleanup, runMonthlyReports } = await import("../src/jobs/index.js");
const { addDays, endOfDayTz, startOfMonthTz, ymdTz, periodOf } = await import("../src/lib/dates.js");
const { touchStreak } = await import("../src/lib/coins.js");

// ───────────── mini test runner ─────────────
let passed = 0;
const failures: string[] = [];
function check(name: string, cond: unknown, detail?: unknown) {
  if (cond) {
    passed++;
    console.log(`  ok  ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL ${name}${detail !== undefined ? `\n       ${typeof detail === "string" ? detail : JSON.stringify(detail)}` : ""}`);
  }
}
const section = (s: string) => console.log(`\n== ${s}`);

const quietLog = { info: () => {}, warn: (...a: unknown[]) => console.log("  [warn]", ...a), error: (...a: unknown[]) => console.log("  [error]", ...a) };

// ───────────── fixture'lar ─────────────
const sfx = Date.now().toString(36);
const rnd = () => Math.floor(Math.random() * 90_000) + 10_000;
const now = new Date();
const mkUser = (role: "ADMIN" | "TEACHER" | "PARENT" | "STUDENT", fullName: string) =>
  prisma.user.create({ data: { login: `selftest-${role.toLowerCase()}-${sfx}-${rnd()}`, passwordHash: "selftest-no-login", role, fullName } });

const teacher = await mkUser("TEACHER", "Alisher Qosimov");
const admin = await mkUser("ADMIN", "Sanjar Rahimov");
const parent = await mkUser("PARENT", "Rustam Valiyev");
const student = await mkUser("STUDENT", "Ali Valiyev");
const student2 = await mkUser("STUDENT", "Bekzod Karimov");
const turn1 = `TURN-${sfx}-1`;
const turn2 = `TURN-${sfx}-2`;
await prisma.studentProfile.create({ data: { userId: student.id, code: `ST-${sfx}1`, turnstileId: turn1, coinBalance: 1230, streakDays: 0 } });
await prisma.studentProfile.create({ data: { userId: student2.id, code: `ST-${sfx}2`, turnstileId: turn2 } });
await prisma.parentStudent.createMany({ data: [{ parentId: parent.id, studentId: student.id, relation: "Ota" }, { parentId: parent.id, studentId: student2.id, relation: "Ota" }] });
const group = await prisma.group.create({
  data: { code: `GR-${sfx}`, name: "IELTS Foundation #3", teacherId: teacher.id, days: [1, 2, 3, 4, 5, 6, 7], startTime: "14:00", endTime: "15:30", startDate: addDays(now, -60) },
});
await prisma.groupStudent.createMany({ data: [{ groupId: group.id, studentId: student.id }, { groupId: group.id, studentId: student2.id }] });
const lesson = await prisma.lesson.create({
  data: { groupId: group.id, title: "Unit 4 — My Family & Relationships (2-qism)", startsAt: new Date(now.getTime() - 5 * 60_000), endsAt: new Date(now.getTime() + 85 * 60_000), status: "IN_PROGRESS" },
});
// student2: ustoz qoʻlda "kelmadi" qoʻygan — turniket buni oʻzgartirmasligi kerak
await prisma.attendance.create({ data: { lessonId: lesson.id, studentId: student2.id, status: "ABSENT", source: "MANUAL", markedById: teacher.id } });
await prisma.grade.create({ data: { studentId: student.id, groupId: group.id, lessonId: lesson.id, kind: "SPEAKING", value: 5, title: "Unit 3 speaking <interview>", givenById: teacher.id, comment: "Juda yaxshi!" } });
const dueToday = new Date(Math.min(now.getTime() + 2 * 3_600_000, endOfDayTz(now).getTime() - 60_000));
await prisma.homework.create({ data: { groupId: group.id, lessonId: lesson.id, title: "Unit 4 — Family words", dueAt: dueToday, createdById: teacher.id } });
const hw2 = await prisma.homework.create({ data: { groupId: group.id, title: "Listening Practice Test #4", dueAt: addDays(now, 2), createdById: teacher.id } });
await prisma.submission.create({ data: { homeworkId: hw2.id, studentId: student.id, status: "SUBMITTED", submittedAt: now } });
const payDue = await prisma.payment.create({
  data: { studentId: student.id, groupId: group.id, period: periodOf(now), amount: 850_000, dueDate: new Date(`${ymdTz(addDays(now, 1))}T00:00:00Z`) },
});
const payLate = await prisma.payment.create({
  data: { studentId: student2.id, groupId: group.id, period: periodOf(addDays(now, -31)), amount: 850_000, dueDate: new Date(`${ymdTz(addDays(now, -3))}T00:00:00Z`) },
});
const code = (userId: string, extra: Partial<{ usedAt: Date; expiresAt: Date; createdAt: Date }> = {}) =>
  prisma.telegramLinkCode.create({ data: { code: `st${sfx}${rnd()}`, userId, expiresAt: new Date(now.getTime() + 30 * 60_000), ...extra } });
const parentCode = await code(parent.id);
const staleCode = await code(parent.id, { usedAt: addDays(now, -2), createdAt: addDays(now, -2) });

// ───────────── oflayn bot ─────────────
type Call = { method: string; payload: Record<string, any> };
const calls: Call[] = [];
let blockedChat: string | null = null;
const bot = createBot("123456:SELFTEST", {
  log: quietLog,
  botInfo: {
    id: 123456, is_bot: true, first_name: "URFON", username: "urfon_test_bot",
    can_join_groups: false, can_read_all_group_messages: false, supports_inline_queries: false,
    can_connect_to_business: false, has_main_web_app: false,
  } as any,
});
bot.api.config.use(async (_prev, method, payload) => {
  const p = (payload ?? {}) as Record<string, any>;
  calls.push({ method, payload: p });
  if (method === "sendMessage" && blockedChat && String(p.chat_id) === blockedChat) {
    return { ok: false, error_code: 403, description: "Forbidden: bot was blocked by the user" } as any;
  }
  if (method === "sendMessage") {
    return { ok: true, result: { message_id: calls.length, date: Math.floor(Date.now() / 1000), chat: { id: Number(p.chat_id), type: "private" }, text: p.text } } as any;
  }
  return { ok: true, result: true } as any;
});

let updateId = 1;
async function say(chatId: number, text: string, username = "rustam_valiyev") {
  const from = calls.length;
  const cmd = text.startsWith("/") ? [{ type: "bot_command", offset: 0, length: text.split(" ")[0].length }] : undefined;
  await bot.handleUpdate({
    update_id: updateId++,
    message: {
      message_id: updateId, date: Math.floor(Date.now() / 1000), text, entities: cmd,
      chat: { id: chatId, type: "private", first_name: "Test" },
      from: { id: chatId, is_bot: false, first_name: "Test", username },
    },
  } as any);
  const sent = calls.slice(from).filter((c) => c.method === "sendMessage");
  return { text: sent.map((c) => String(c.payload.text)).join("\n---\n"), sent };
}

const chatParent = 700_000_000 + rnd();
const chatStranger = 710_000_000 + rnd();
const chatStudent = 720_000_000 + rnd();
const chatTeacher = 730_000_000 + rnd();
const chatAdmin = 740_000_000 + rnd();

const app = await buildApp();
const key = process.env.TURNSTILE_API_KEY!;
const turnstile = (payload: unknown, apiKey: string | null = key) =>
  app.inject({ method: "POST", url: "/api/integrations/turnstile", headers: apiKey ? { "x-api-key": apiKey } : {}, payload: payload as any });

try {
  // ───────────── 1. Turniket ─────────────
  section("Turniket integratsiyasi");
  const coinsBefore = (await prisma.studentProfile.findUniqueOrThrow({ where: { userId: student.id } })).coinBalance;
  check("kalitsiz → 401", (await turnstile({ turnstileId: turn1 }, null)).statusCode === 401);
  check("notoʻgʻri kalit → 401", (await turnstile({ turnstileId: turn1 }, "wrong-key")).statusCode === 401);
  check("nomaʼlum turniket ID → 404", (await turnstile({ turnstileId: "TURN-NOPE" })).statusCode === 404);
  check("notoʻgʻri vaqt → 400", (await turnstile({ turnstileId: turn1, at: "kecha" })).statusCode === 400);
  const arrival = new Date(now.getTime() - 2 * 60_000);
  const r1 = await turnstile({ turnstileId: turn1, at: arrival.toISOString(), direction: "in" });
  const j1 = r1.json();
  check("kirish → 200 created PRESENT", r1.statusCode === 200 && j1.action === "created" && j1.status === "PRESENT", j1);
  const att = await prisma.attendance.findUnique({ where: { lessonId_studentId: { lessonId: lesson.id, studentId: student.id } } });
  check("Attendance source=TURNSTILE, arrivedAt yozildi", att?.source === "TURNSTILE" && att.arrivedAt?.getTime() === arrival.getTime());
  const coinsAfter = (await prisma.studentProfile.findUniqueOrThrow({ where: { userId: student.id } })).coinBalance;
  check("ATTENDANCE tanga berildi (+5, seriya birinchi kun)", coinsAfter - coinsBefore === 5, { coinsBefore, coinsAfter });
  const arrivedNote = await prisma.notification.findFirst({ where: { userId: parent.id, type: "attendance.arrived" }, orderBy: { createdAt: "desc" } });
  check("ota-onaga 'markazga keldi' xabari", !!arrivedNote && arrivedNote.body.startsWith("Ali Valiyev ") && arrivedNote.body.includes("da markazga keldi"), arrivedNote?.body);
  check("audit attendance.turnstile", !!(await prisma.auditLog.findFirst({ where: { action: "attendance.turnstile", entityId: att?.id } })));
  const r2 = await turnstile({ turnstileId: turn1 });
  check("takroriy oʻtish → duplicate", r2.json().action === "duplicate", r2.json());
  check("takroriy oʻtishda tanga qayta berilmadi", (await prisma.studentProfile.findUniqueOrThrow({ where: { userId: student.id } })).coinBalance === coinsAfter);
  const r3 = await turnstile({ turnstileId: turn2 });
  const att2 = await prisma.attendance.findUnique({ where: { lessonId_studentId: { lessonId: lesson.id, studentId: student2.id } } });
  check("ustozning qoʻlda qoʻygan belgisi oʻzgarmadi (kept_manual, ABSENT)", r3.json().action === "kept_manual" && att2?.status === "ABSENT", r3.json());
  check("direction=out → ignored", (await turnstile({ turnstileId: turn1, direction: "out" })).json().action === "ignored");

  // ───────────── 2. Bot: ulanmagan chat ─────────────
  section("Bot: ulanmagan foydalanuvchi");
  const inv = await say(chatStranger, "/start notogri-kod-123");
  check("notoʻgʻri kod → yoʻriqnoma (Sozlamalar)", inv.text.includes("yaroqsiz") && inv.text.includes("Sozlamalar"), inv.text);
  const leak = await say(chatStranger, "Bugun");
  check("ulanmagan chat 'Bugun' → maʼlumot oshkor qilinmaydi", leak.text.includes("Sozlamalar") && !leak.text.includes("Ali") && !leak.text.includes("IELTS"), leak.text);
  const leak2 = await say(chatStranger, "/tolovlar");
  check("ulanmagan chat /tolovlar → maʼlumot yoʻq", !leak2.text.includes("soʻm") && leak2.text.includes("Sozlamalar"), leak2.text);

  // ───────────── 3. Bot: ulash ─────────────
  section("Bot: /start <kod> bilan ulash");
  const link = await say(chatParent, `/start ${parentCode.code}`);
  const tl = await prisma.telegramLink.findUnique({ where: { userId: parent.id } });
  check("TelegramLink yaratildi (chatId, username)", tl?.chatId === String(chatParent) && tl.isActive && tl.username === "rustam_valiyev");
  check("salomlashuv ism bilan", link.text.includes("Rustam Valiyev"), link.text);
  const kb = link.sent.at(-1)?.payload.reply_markup?.keyboard?.flat().map((b: any) => b.text) ?? [];
  check("ota-ona menyusi (Bugun, Jadval, Toʻlovlar, Baholar, Farzandlar)", ["Bugun", "Jadval", "Toʻlovlar", "Baholar", "Farzandlar"].every((b) => kb.includes(b)), kb);
  check("kod ishlatilgan deb belgilandi", !!(await prisma.telegramLinkCode.findUnique({ where: { code: parentCode.code } }))?.usedAt);
  check("audit telegram.link", !!(await prisma.auditLog.findFirst({ where: { action: "telegram.link", actorId: parent.id } })));
  const reuse = await say(chatStranger, `/start ${parentCode.code}`);
  check("kodni ikkinchi marta ishlatib boʻlmaydi", reuse.text.includes("yaroqsiz") && !(await prisma.telegramLink.findUnique({ where: { chatId: String(chatStranger) } })));

  // ───────────── 4. Ota-ona menyulari ─────────────
  section("Bot: ota-ona menyulari");
  const today = await say(chatParent, "Bugun");
  check("Bugun: ikkala farzand", today.text.includes("Ali Valiyev") && today.text.includes("Bekzod Karimov"), today.text);
  check("Bugun: davomat + kelgan vaqt", /keldi \(\d\d:\d\d\)/.test(today.text), today.text);
  check("Bugun: baho 5 (Aʼlo), HTML escape", today.text.includes("5 (Aʼlo)") && today.text.includes("&lt;interview&gt;") && !today.text.includes("<interview>"), today.text);
  check("Bugun: uyga vazifa va tangalar", today.text.includes("Unit 4 — Family words") && today.text.includes("Kumush tangalar: bugun +"), today.text);
  check("Bugun: Bekzod — kelmadi", today.text.includes("kelmadi"), today.text);
  const sched = await say(chatParent, "Jadval");
  check("Jadval: shu hafta darslari", sched.text.includes("shu haftalik jadval") && sched.text.includes("IELTS Foundation #3"), sched.text);
  const pays = await say(chatParent, "Toʻlovlar");
  check("Toʻlovlar: 850 000 soʻm (NBSP) va kutilmoqda", pays.text.includes("850 000 soʻm") && pays.text.includes("kutilmoqda"), pays.text);
  check("Toʻlovlar: muddati oʻtgan PENDING ham 'muddati oʻtgan'", pays.text.includes("muddati oʻtgan"), pays.text);
  const grades = await say(chatParent, "Baholar");
  check("Baholar: oxirgi baholar + izoh", grades.text.includes("oxirgi baholar") && grades.text.includes("Juda yaxshi!"), grades.text);
  const kids = await say(chatParent, "Farzandlar");
  const cb = kids.sent.at(-1)?.payload.reply_markup?.inline_keyboard?.[0]?.[0]?.callback_data as string | undefined;
  check("Farzandlar: roʻyxat + inline tugmalar", kids.text.includes("Farzandlarim") && !!cb && cb.startsWith("p:today:"), kids.text);
  if (cb) {
    const before = calls.length;
    await bot.handleUpdate({ update_id: updateId++, callback_query: { id: "cb1", chat_instance: "x", data: cb, from: { id: chatParent, is_bot: false, first_name: "T" }, message: { message_id: 1, date: 0, chat: { id: chatParent, type: "private", first_name: "T" }, text: "x" } } } as any);
    const t = calls.slice(before).filter((c) => c.method === "sendMessage").map((c) => c.payload.text).join("");
    check("inline tugma → faqat bitta farzand", t.includes("Ali Valiyev") && !t.includes("Bekzod"), t);
    // boshqa odamning farzandi IDsi bilan soxta callback
    const before2 = calls.length;
    await bot.handleUpdate({ update_id: updateId++, callback_query: { id: "cb2", chat_instance: "x", data: `p:today:${teacher.id}`, from: { id: chatParent, is_bot: false, first_name: "T" }, message: { message_id: 1, date: 0, chat: { id: chatParent, type: "private", first_name: "T" }, text: "x" } } } as any);
    const t2 = calls.slice(before2).filter((c) => c.method === "sendMessage").map((c) => c.payload.text).join("");
    check("begona studentId callback → topilmadi", t2.includes("topilmadi") && !t2.includes("Alisher"), t2);
  }
  const stu = await say(chatParent, "Tangalar");
  check("ota-onaga oʻquvchi menyusi berilmaydi", stu.text.includes("menyudan"), stu.text);

  // ───────────── 5. Oʻquvchi, ustoz, admin ─────────────
  section("Bot: oʻquvchi / ustoz / admin");
  await say(chatStudent, `/start ${(await code(student.id)).code}`, "ali_v");
  const coins = await say(chatStudent, "Tangalar");
  check("Tangalar: balans, unvon, 7 kun", coins.text.includes("1 235") && coins.text.includes("Kumush burgut") && coins.text.includes("Oxirgi 7 kun"), coins.text);
  check("Tangalar: boshqalar bilan solishtirish yoʻq", !/reyting|oʻrin|ortda/i.test(coins.text));
  const hw = await say(chatStudent, "Vazifalar");
  check("Vazifalar: ochiq vazifa (topshirilgani chiqmaydi)", hw.text.includes("Unit 4 — Family words") && !hw.text.includes("Listening Practice"), hw.text);
  const sToday = await say(chatStudent, "Bugun");
  check("oʻquvchi Bugun", sToday.text.includes("Darslar") && sToday.text.includes("keldi"), sToday.text);
  await say(chatTeacher, `/start ${(await code(teacher.id)).code}`, "alisher");
  const rev = await say(chatTeacher, "Tekshiruv");
  check("ustoz Tekshiruv: guruh boʻyicha 1 ta", rev.text.includes("IELTS Foundation #3 — 1 ta"), rev.text);
  const tl2 = await say(chatTeacher, "Bugungi darslar");
  check("ustoz Bugungi darslar: davomat 2/2", tl2.text.includes("davomat: 2/2"), tl2.text);
  await say(chatAdmin, `/start ${(await code(admin.id)).code}`, "sanjar");
  const ad = await say(chatAdmin, "Bugun");
  check("admin Bugun: darslar, davomat %, toʻlovlar", ad.text.includes("Darslar:") && ad.text.includes("Davomat:") && ad.text.includes("Muddati oʻtgan"), ad.text);

  // ───────────── 6. Worker ─────────────
  section("Bildirishnoma worker");
  const old = await prisma.notification.create({ data: { userId: parent.id, type: "test.old", title: "Eski", body: "x", createdAt: addDays(now, -2) } });
  const stale = await skipStaleNotifications();
  check("24 soatdan eski PENDING → SKIPPED", stale >= 1 && (await prisma.notification.findUniqueOrThrow({ where: { id: old.id } })).status === "SKIPPED");
  const n1 = await prisma.notification.create({ data: { userId: parent.id, type: "grade.new", title: "Yangi baho <5>", body: "Ali Valiyev: Speaking — 5 (Aʼlo)", link: "/ota-ona" } });
  const nobody = await mkUser("PARENT", "Ulanmagan Ota");
  const n2 = await prisma.notification.create({ data: { userId: nobody.id, type: "grade.new", title: "X", body: "y" } });
  blockedChat = String(chatStudent);
  const n3 = await prisma.notification.create({ data: { userId: student.id, type: "homework.reviewed", title: "Tekshirildi", body: "z" } });
  const before = calls.length;
  let res = await processNotificationBatch(bot.api, quietLog);
  while (res.picked === 20) res = await processNotificationBatch(bot.api, quietLog);
  const sentMsgs = calls.slice(before).filter((c) => c.method === "sendMessage");
  const m1 = sentMsgs.find((c) => String(c.payload.text).includes("Yangi baho"));
  check("PENDING → sendMessage (qalin sarlavha, escape)", !!m1 && m1.payload.text.startsWith("<b>Yangi baho &lt;5&gt;</b>\n") && m1.payload.chat_id === String(chatParent), m1?.payload);
  check("link tugmasi https://urfon.test/ota-ona", m1?.payload.reply_markup?.inline_keyboard?.[0]?.[0]?.url === "https://urfon.test/ota-ona", m1?.payload.reply_markup);
  const s1 = await prisma.notification.findUniqueOrThrow({ where: { id: n1.id } });
  check("status SENT + sentAt", s1.status === "SENT" && !!s1.sentAt);
  check("ulanmagan foydalanuvchi → SKIPPED", (await prisma.notification.findUniqueOrThrow({ where: { id: n2.id } })).status === "SKIPPED");
  const s3 = await prisma.notification.findUniqueOrThrow({ where: { id: n3.id } });
  const stLink = await prisma.telegramLink.findUnique({ where: { userId: student.id } });
  check("403 bot bloklangan → FAILED + ulanish oʻchirildi", s3.status === "FAILED" && stLink?.isActive === false, { status: s3.status, error: s3.error, link: stLink?.isActive });
  blockedChat = null;
  check("turniket xabari ham yuborildi", (await prisma.notification.findUniqueOrThrow({ where: { id: arrivedNote!.id } })).status === "SENT");
  const again = await processNotificationBatch(bot.api, quietLog);
  check("qayta ishga tushirish — hech narsa ikki marta yuborilmaydi", again.sent === 0, again);

  // ───────────── 7. /uzish ─────────────
  section("Bot: /uzish");
  const un = await say(chatParent, "/uzish");
  check("/uzish → isActive=false", un.text.includes("uzildi") && (await prisma.telegramLink.findUnique({ where: { userId: parent.id } }))?.isActive === false);
  check("audit telegram.unlink", !!(await prisma.auditLog.findFirst({ where: { action: "telegram.unlink", actorId: parent.id } })));
  const after = await say(chatParent, "Bugun");
  check("uzilgandan keyin maʼlumot yoʻq", after.text.includes("Sozlamalar") && !after.text.includes("Ali"), after.text);
  const nAfter = await prisma.notification.create({ data: { userId: parent.id, type: "grade.new", title: "Keyin", body: "q" } });
  await processNotificationBatch(bot.api, quietLog);
  check("uzilgan ota-onaga xabar → SKIPPED", (await prisma.notification.findUniqueOrThrow({ where: { id: nAfter.id } })).status === "SKIPPED");
  // qayta ulash (yangi kod) va chatni boshqa akkauntga oʻtkazish
  await say(chatParent, `/start ${(await code(parent.id)).code}`);
  check("qayta ulash → isActive=true", (await prisma.telegramLink.findUnique({ where: { userId: parent.id } }))?.isActive === true);

  // ───────────── 8. Rejali ishlar ─────────────
  section("Rejali ishlar");
  const d1 = await runDailyParentReports(now, quietLog);
  const rep = await prisma.report.findUnique({ where: { type_period_studentId: { type: "DAILY_PARENT", period: ymdTz(now), studentId: student.id } } });
  check("DAILY_PARENT hisobot yaratildi", !!rep && d1.created >= 1, d1);
  const daily = await prisma.notification.findFirst({ where: { userId: parent.id, type: "report.daily" }, orderBy: { createdAt: "desc" } });
  check("kunlik hisobot xabari (ota-onaga)", !!daily && daily.body.includes("Dars: IELTS Foundation #3") && daily.body.includes("Kumush tangalar"), daily?.body);
  const d2 = await runDailyParentReports(now, quietLog);
  check("kunlik hisobot idempotent", d2.created === 0 && d2.existed >= 1, d2);
  const p1 = await runPaymentJobs(now, quietLog);
  check("toʻlov eslatmasi (ertaga)", p1.reminders >= 1 && !!(await prisma.notification.findFirst({ where: { type: "payment.due", payload: { path: ["paymentId"], equals: payDue.id } } })), p1);
  check("muddati oʻtgan → OVERDUE", (await prisma.payment.findUniqueOrThrow({ where: { id: payLate.id } })).status === "OVERDUE", p1);
  check("audit payment.overdue (actor null)", !!(await prisma.auditLog.findFirst({ where: { action: "payment.overdue", entityId: payLate.id, actorId: null } })));
  check("adminlarga umumlashtirilgan xabar", !!(await prisma.notification.findFirst({ where: { userId: admin.id, type: "payment.overdue" } })));
  const p2 = await runPaymentJobs(now, quietLog);
  check("toʻlov ishi idempotent", p2.reminders === 0 && p2.overdue === 0, p2);
  const nextMonth = startOfMonthTz(addDays(startOfMonthTz(now), 32));
  const mo = await runMonthlyReports(nextMonth, quietLog);
  const mrep = await prisma.report.findUnique({ where: { type_period_studentId: { type: "MONTHLY_PARENT", period: periodOf(now), studentId: student.id } } });
  check("MONTHLY_PARENT yaratildi", !!mrep, mo);
  const adminRep = await prisma.report.findFirst({ where: { type: "MONTHLY_ADMIN", period: periodOf(now) } });
  const adminNote = await prisma.notification.findFirst({ where: { userId: admin.id, type: "report.monthly_admin" } });
  // davr boʻyicha bitta: oldingi selftest yugurishida yaratilgan boʻlsa, bu safar qayta yaratilmaydi
  check("MONTHLY_ADMIN mavjud (yangi boʻlsa — adminga xabar)", !!adminRep && (mo.admin.created ? !!adminNote : true), mo.admin);
  const monthly = await prisma.notification.findFirst({ where: { userId: parent.id, type: "report.monthly" }, orderBy: { createdAt: "desc" } });
  check("oylik xabar: davomat, baho, vazifa, tanga", !!monthly && ["Davomat:", "Oʻrtacha baho:", "Uyga vazifalar:", "Kumush tangalar:"].every((s) => monthly.body.includes(s)), monthly?.body);
  const mo2 = await runMonthlyReports(nextMonth, quietLog);
  check("oylik hisobot idempotent", mo2.created === 0 && mo2.admin.created === false, mo2);
  const cl = await runCleanup(now);
  check("cleanup: ishlatilgan eski kod oʻchirildi", !(await prisma.telegramLinkCode.findUnique({ where: { code: staleCode.code } })), cl);

  // ───────────── 9. Diagnostika: kanondagi matnlar ASCII apostrofsiz ─────────────
  section("Til");
  const texts = calls.filter((c) => c.method === "sendMessage").map((c) => String(c.payload.text));
  const bad = texts.filter((t) => /[A-Za-z]'[A-Za-z]/.test(t.replace(/&#?\w+;/g, "")));
  check("bot matnlarida ASCII ' yoʻq", bad.length === 0, bad.slice(0, 2));

  section("Diagnostika (lib/coins.ts touchStreak)");
  const p0 = await prisma.studentProfile.findUniqueOrThrow({ where: { userId: student.id } });
  await touchStreak(prisma, student.id, now).catch((e) => console.log("  touchStreak xato:", e.code ?? e.message));
  const pA = await prisma.studentProfile.findUniqueOrThrow({ where: { userId: student.id } });
  console.log(`  bugun ${ymdTz(now)}: lastStreakDate=${p0.lastStreakDate?.toISOString().slice(0, 10)} streak=${p0.streakDays} → 2-chaqiruv: streak=${pA.streakDays}`);
  if (pA.streakDays !== p0.streakDays) console.log("  ⚠ touchStreak bir kunda ikkinchi chaqiruvda seriyani oshirdi (DATE ustun ±1 kun). Lead uchun eslatma.");
} catch (e) {
  failures.push(`kutilmagan xato: ${(e as Error).message}`);
  console.error(e);
} finally {
  await app.close();
  await prisma.$disconnect();
}

console.log(`\n${passed} ta ok, ${failures.length} ta xato`);
if (failures.length) console.log(failures.map((f) => ` - ${f}`).join("\n"));
process.exit(failures.length ? 1 : 0);
