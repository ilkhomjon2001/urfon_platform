// Seed kanon invariantlarini tekshiradi. Ishga tushirish: npx tsx prisma/seed/verify.ts
import { prisma } from "../../src/db.js";
import { verifyAuditChain } from "../../src/lib/audit.js";
import { dbDateYmd } from "../../src/lib/dates.js";
import { TARGET } from "./finance.js";
import { at, dow, hhmmOf, lessonDayBack, makeClock, nextWeekday, ymdAdd } from "./util.js";

const results: { ok: boolean; name: string; detail: string }[] = [];
const check = (name: string, ok: boolean, detail: string | number = "") => results.push({ ok, name, detail: String(detail) });
const r1 = (x: number) => Math.round(x * 10) / 10;

// Ingliz tilidagi so'zlardagi apostrof — ruxsat etilgan
const ENGLISH_OK = new Set(["o'clock", "don't", "can't", "i'm", "it's", "author's", "writer's", "children's", "let's", "won't", "isn't", "you're", "we're", "that's"]);

async function main() {
  const clock = makeClock();
  const { T, now } = clock;
  const L = (k: number) => (k === 0 ? T : lessonDayBack([1, 3, 5], T, k));
  const tStart = at(T, "00:00");

  // ── o'quvchilar ──
  const byStatus = await prisma.studentProfile.groupBy({ by: ["status"], _count: { _all: true } });
  const st = Object.fromEntries(byStatus.map((b) => [b.status, b._count._all]));
  const total = Object.values(st).reduce((a, b) => a + b, 0);
  check("124 oʻquvchi (116 faol / 6 taʼtil / 2 bitirgan)", total === 124 && st.ACTIVE === 116 && st.ACADEMIC_LEAVE === 6 && st.GRADUATED === 2, JSON.stringify(st));
  const noParent = await prisma.user.count({ where: { role: "STUDENT", parents: { none: {} } } });
  check("har bir oʻquvchida ota-ona akkaunti bor", noParent === 0, `${noParent} ta yoʻq`);
  const kidsAvatar = await prisma.user.count({ where: { role: "STUDENT", avatarUrl: { not: null } } });
  check("bolalarda surat yoʻq", kidsAvatar === 0, kidsAvatar);
  const codes = await prisma.studentProfile.findMany({ select: { code: true } });
  check("oʻquvchi kodlari ST-#### formatida", codes.every((c) => /^ST-\d{4}$/.test(c.code)), "");
  const linked = await prisma.user.count({ where: { role: "STUDENT", studentProfile: { status: { not: "LEFT" } }, parents: { some: { parent: { telegramLink: { isActive: true } } } } } });
  check("Telegram: 108 oʻquvchining ota-onasi ulangan (87%)", linked === 108, `${linked} (${Math.round((linked * 100) / 124)}%)`);
  const rustam = await prisma.user.findUnique({ where: { login: "+998901234567" }, include: { telegramLink: true, children: { include: { student: { include: { studentProfile: true } } } } } });
  const kids = [...(rustam?.children ?? [])].sort((a, b) => a.student.studentProfile!.enrolledAt.getTime() - b.student.studentProfile!.enrolledAt.getTime());
  check("Rustam Valiyev: @rustam_valiyev, 2 farzand (Ali birinchi, keyin Fotima)", rustam?.telegramLink?.username === "rustam_valiyev" && rustam.telegramLink.chatId === "6810291" && kids.length === 2 && kids[0].student.login === "ST-8492", kids.map((c) => `${c.student.studentProfile?.code} ${dbDateYmd(c.student.studentProfile!.enrolledAt)}`).join(", "));
  const aliEnrolled = kids[0] ? dbDateYmd(kids[0].student.studentProfile!.enrolledAt) : "";
  check("Ali: 15-yanvar (kanon) = T − 130 kun", aliEnrolled === ymdAdd(T, -130), aliEnrolled);

  // ── xodimlar va guruhlar ──
  const teachers = await prisma.user.count({ where: { role: "TEACHER" } });
  check("6 ta ustoz", teachers === 6, teachers);
  const groups = await prisma.group.findMany({ include: { teacher: true, room: true, _count: { select: { students: { where: { status: { in: ["ACTIVE", "WAITING"] } } } } } } });
  const gs = Object.fromEntries(["ACTIVE", "ENROLLING"].map((s) => [s, groups.filter((g) => g.status === s).length]));
  check("12 guruh (9 faol, 3 yangi qabul)", groups.length === 12 && gs.ACTIVE === 9 && gs.ENROLLING === 3, JSON.stringify(gs));
  const ali5 = groups.filter((g) => g.teacher?.login === "+998901000002");
  const ali5n = ali5.reduce((a, g) => a + g._count.students, 0);
  check("Alisher Qosimov: 5 guruh, 68 oʻquvchi", ali5.length === 5 && ali5n === 68, `${ali5.map((g) => `${g.code}:${g._count.students}`).join(" ")} = ${ali5n}`);
  const counts: Record<string, number> = { "GR-03": 14, "GR-04": 8, "GR-05": 14, "GR-18": 16, "GR-09": 18, "GR-20": 12, "GR-11": 16, "GR-12": 12, "GR-15": 10, "GR-16": 15 };
  const bad = Object.entries(counts).filter(([c, n]) => groups.find((g) => g.code === c)?._count.students !== n);
  check("KANON §6 guruh sonlari", bad.length === 0, bad.map(([c]) => c).join(",") || "hammasi mos");
  const gr05 = groups.find((g) => g.code === "GR-05")!;
  const waiting = await prisma.groupStudent.count({ where: { groupId: gr05.id, status: "WAITING" } });
  check("GR-05: ustozsiz, 204-xona, 14 kutmoqda, keyingi dushanba boshlanadi", !gr05.teacherId && gr05.room?.name === "204-xona" && waiting === 14 && dbDateYmd(gr05.startDate) === nextWeekday(T, 1), `${dbDateYmd(gr05.startDate)}`);

  // ── GR-03 darslari ──
  const gr03 = groups.find((g) => g.code === "GR-03")!;
  const lessons = await prisma.lesson.findMany({ where: { groupId: gr03.id }, orderBy: { startsAt: "asc" } });
  const doneBefore = lessons.filter((l) => l.status === "DONE" && l.startsAt < tStart).length;
  check("GR-03: 48 dars, T gacha 28 tasi oʻtilgan (58%)", gr03.totalLessons === 48 && lessons.length === 48 && doneBefore === 28, `${doneBefore}/48`);
  const l28 = lessons.find((l) => l.number === 28)!;
  check("28-dars = kanon 22-may: Unit 4 (1-qism)", l28.title === "Unit 4 — My Family & Relationships (1-qism)" && l28.startsAt.getTime() === at(L(1), "14:00").getTime(), `${L(1)} ${l28.title}`);
  const l29 = lessons.find((l) => l.number === 29)!;
  check("29-dars = T, Unit 4 (2-qism), holati soatga mos", l29.startsAt.getTime() === at(T, "14:00").getTime() && l29.status === (l29.endsAt <= now ? "DONE" : l29.startsAt <= now ? "IN_PROGRESS" : "PLANNED"), l29.status);
  const mats = await prisma.material.findMany({ where: { lessonId: l28.id }, include: { file: true } });
  check("22-may materiallari: Slides.pdf (4.2 MB) va Native Audio.mp3", mats.some((x) => x.title === "Unit 4 — Presentation Slides.pdf" && Math.abs((x.file?.size ?? 0) - 4.2 * 1048576) < 20_000) && mats.some((x) => x.title === "Unit 4 — Native Audio.mp3"), mats.map((x) => x.title).join(" | "));

  // ── Ali ──
  const ali = await prisma.user.findUniqueOrThrow({ where: { login: "ST-8492" }, include: { studentProfile: true } });
  const att = await prisma.attendance.findMany({ where: { studentId: ali.id, lesson: { groupId: gr03.id, startsAt: { lt: tStart } } }, include: { lesson: true } });
  const came = att.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  check("Ali davomati: 28 darsdan 26 tasi (93%)", att.length === 28 && came === 26, `${came}/${att.length} = ${Math.round((came * 100) / att.length)}%`);
  const exc = att.find((a) => a.status === "EXCUSED");
  check("Ali: 10-may (L−6) sababli, 22-may 13:52 da keldi", exc?.lesson.number === 23 && dbDateYmd(new Date(exc.lesson.startsAt.getTime() + 5 * 3600e3)) === L(6) && hhmmOf(att.find((a) => a.lesson.number === 28)!.arrivedAt!) === "13:52", `${L(6)}`);
  const grades = await prisma.grade.findMany({ where: { studentId: ali.id } });
  const avg = grades.reduce((a, g) => a + g.value, 0) / grades.length;
  const fives = grades.filter((g) => Math.round(g.value) === 5).length;
  check("Ali oʻrtacha bahosi 4.6 (5: 60%, 4: 40%)", r1(avg) === 4.6 && Math.round((fives * 100) / grades.length) === 60, `${avg.toFixed(3)} · ${fives}/${grades.length}`);
  const skill = (s: string) => {
    const g = grades.filter((x) => x.skill === s);
    return r1(g.reduce((a, x) => a + x.value, 0) / g.length);
  };
  check("Koʻnikmalar: Speaking 4.7, Listening 4.6, Reading 4.4, Writing 4.5", skill("SPEAKING") === 4.7 && skill("LISTENING") === 4.6 && skill("READING") === 4.4 && skill("WRITING") === 4.5, `${skill("SPEAKING")} / ${skill("LISTENING")} / ${skill("READING")} / ${skill("WRITING")}`);
  const canonGrades = ["Unit 3 lugʻat testi:4.6", "Speaking Mock:4.8", "Speaking interview (Unit 3):4.8"].every((s) => { const [t, v] = s.split(":"); return grades.some((g) => g.title === t && g.value === Number(v)); });
  check("Kanon baholar: Unit 3 testi 4.6, Speaking Mock 4.8, interview 4.8", canonGrades, "");
  const hwAll = await prisma.homework.findMany({ where: { groupId: gr03.id }, include: { submissions: { where: { studentId: ali.id }, include: { files: true } } } });
  const onTime = hwAll.filter((h) => h.submissions.some((s) => (s.status === "REVIEWED" || s.status === "SUBMITTED") && !s.isLate)).length;
  check("Ali uyga vazifalari 25/28 (oʻz vaqtida)", hwAll.length === 28 && onTime === 25, `${onTime}/${hwAll.length}`);
  const fw = hwAll.find((h) => h.title === "Unit 4 — Family words")!;
  const draft = fw.submissions[0];
  check("«Unit 4 — Family words» (AUDIO, muddat T 20:00): Ali — DRAFT, fayl bilan", fw.type === "AUDIO" && fw.dueAt.getTime() === at(T, "20:00").getTime() && draft?.status === "DRAFT" && !draft.submittedAt && draft.files.length >= 1, `${draft?.status}, ${draft?.files.length} fayl`);
  const g27 = grades.find((g) => g.kind === "HOMEWORK" && g.title === "Unit 3 — Daily Routines: speaking audio");
  check("Unit 3 speaking bahosi 5 (4 → 5)", g27?.value === 5, g27?.updatedAt.toISOString() ?? "");
  const coins = await prisma.coinTransaction.aggregate({ where: { studentId: ali.id }, _sum: { amount: true } });
  const w1 = await prisma.coinTransaction.aggregate({ where: { studentId: ali.id, amount: { gt: 0 }, createdAt: { gte: new Date(now.getTime() - 7 * 86400e3) } }, _sum: { amount: true } });
  const w2 = await prisma.coinTransaction.aggregate({ where: { studentId: ali.id, amount: { gt: 0 }, createdAt: { gte: new Date(now.getTime() - 14 * 86400e3), lt: new Date(now.getTime() - 7 * 86400e3) } }, _sum: { amount: true } });
  check("Ali tangalari: 1 240 (balans = yigʻindi)", ali.studentProfile!.coinBalance === 1240 && coins._sum.amount === 1240, `${ali.studentProfile!.coinBalance} / ${coins._sum.amount}`);
  check("Ali: oxirgi 7 kun +85, oldingi 7 kun +65", w1._sum.amount === 85 && w2._sum.amount === 65, `+${w1._sum.amount} / +${w2._sum.amount}`);
  check("Ali: seriya 7 kun, lastStreakDate = T", ali.studentProfile!.streakDays === 7 && dbDateYmd(ali.studentProfile!.lastStreakDate!) === T, `${ali.studentProfile!.streakDays}, ${dbDateYmd(ali.studentProfile!.lastStreakDate!)}`);
  const mismatch = await prisma.$queryRaw<{ n: number }[]>`SELECT count(*)::int AS n FROM "StudentProfile" sp WHERE sp."coinBalance" <> COALESCE((SELECT sum(amount) FROM "CoinTransaction" c WHERE c."studentId" = sp."userId"), 0)`;
  check("barcha oʻquvchilar: coinBalance = tranzaksiyalar yigʻindisi", mismatch[0].n === 0, mismatch[0].n);
  const badRefs = await prisma.coinTransaction.count({ where: { OR: [{ reason: { in: ["ATTENDANCE", "ACTIVITY"] }, refType: { not: "lesson" } }, { reason: "HOMEWORK_ON_TIME", refType: { not: "submission" } }, { reason: "STREAK", refType: { not: "day" } }] } });
  check("tanga ref konvensiyasi (coinRef)", badRefs === 0, badRefs);
  const peers = await prisma.studentProfile.findMany({ where: { code: { in: ["ST-8433", "ST-8447", "ST-8456", "ST-8411", "ST-8468", "ST-8479"] } } });
  check("Guruhdagi faollik: 1 410 / 1 350 / 1 290 / 1 180 / 1 120 / 980", peers.map((p) => p.coinBalance).sort((a, b) => b - a).join(",") === "1410,1350,1290,1180,1120,980", peers.map((p) => `${p.code}:${p.coinBalance}`).join(" "));

  // ── ustoz vazifalari ──
  const pending = await prisma.submission.count({ where: { status: "SUBMITTED", homework: { group: { teacher: { login: "+998901000002" } } } } });
  check("Alisher: tekshiruvni kutayotgan 22 ta ish", pending === 22, pending);
  const alisherThreads = await prisma.$queryRaw<{ n: number }[]>`
    SELECT count(*)::int AS n FROM "Message" m JOIN "ThreadParticipant" tp ON tp."threadId" = m."threadId"
    JOIN "User" u ON u.id = tp."userId" WHERE u.login = '+998901000002' AND m."senderId" <> u.id AND (tp."lastReadAt" IS NULL OR m."createdAt" > tp."lastReadAt")`;
  check("Alisher: 5 ta oʻqilmagan xabar", alisherThreads[0].n === 5, alisherThreads[0].n);
  const q = await prisma.message.count({ where: { isQuestion: true, lessonId: l28.id } });
  check("Rustam: dars tafsilotidan savol (isQuestion, lessonId)", q >= 1, q);

  // ── QUIZ formati (ilova: content.questions[{id,text,options,answer}], answers {qid: indeks}) ──
  const quizHw = await prisma.homework.findMany({ where: { type: "QUIZ" }, include: { submissions: { where: { status: { in: ["SUBMITTED", "REVIEWED", "RETURNED"] } } } } });
  let badQ = 0, badA = 0, badS = 0, nSub = 0;
  type QQ = { id: string; text: string; options: string[]; answer: number };
  for (const h of quizHw) {
    const qs = (h.content as { questions?: QQ[] } | null)?.questions;
    if (!Array.isArray(qs) || qs.length < 8 || qs.length > 10 || new Set(qs.map((q) => q.id)).size !== qs.length || qs.some((q) => !q.id || !q.text || !Array.isArray(q.options) || q.options.length < 2 || !Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length)) {
      badQ++;
      continue;
    }
    for (const s of h.submissions) {
      nSub++;
      const a = s.answers as Record<string, number> | null;
      if (!a || Array.isArray(a) || "correct" in a || qs.some((q) => !Number.isInteger(a[q.id]) || a[q.id] < 0 || a[q.id] >= q.options.length)) {
        badA++;
        continue;
      }
      if (s.status === "REVIEWED") {
        const p = Math.round((qs.filter((q) => a[q.id] === q.answer).length * 100) / qs.length);
        if ((p >= 85 ? 5 : p >= 70 ? 4 : p >= 50 ? 3 : 2) !== s.score) badS++;
      }
    }
  }
  check("QUIZ: 8–10 savol, javoblar {qid: indeks}, baho javoblarga mos", quizHw.length > 0 && badQ === 0 && badA === 0 && badS === 0, `${quizHw.length} ta test, ${nSub} ta javob · xato: savol ${badQ}, javob ${badA}, baho ${badS}`);

  // ── moliya ──
  const P = T.slice(0, 7);
  const agg = await prisma.payment.groupBy({ by: ["status"], where: { period: P }, _count: { _all: true }, _sum: { amount: true } });
  const g = (s: string) => agg.find((a) => a.status === s);
  check(`${P}: 102 toʻlangan — 86 400 000 soʻm`, g("PAID")?._count._all === TARGET.paidCount && g("PAID")?._sum.amount === TARGET.paid, `${g("PAID")?._count._all} · ${g("PAID")?._sum.amount}`);
  check(`${P}: 12 kutilmoqda — 10 200 000 soʻm`, g("PENDING")?._count._all === TARGET.pendingCount && g("PENDING")?._sum.amount === TARGET.pending, `${g("PENDING")?._count._all} · ${g("PENDING")?._sum.amount}`);
  check(`${P}: 2 muddati oʻtgan — 1 600 000 soʻm`, g("OVERDUE")?._count._all === TARGET.overdueCount && g("OVERDUE")?._sum.amount === TARGET.overdue, `${g("OVERDUE")?._count._all} · ${g("OVERDUE")?._sum.amount}`);
  const bek = await prisma.payment.findFirst({ where: { period: P, status: "PENDING", student: { login: "ST-8411" } } });
  const jas = await prisma.payment.findFirst({ where: { period: P, status: "OVERDUE", student: { login: "ST-8204" } } });
  check("Bekzod Karimov kutilmoqda (muddat T+1), Jasur Umidov muddati oʻtgan", !!bek && dbDateYmd(bek.dueDate) === ymdAdd(T, 1) && !!jas, bek ? dbDateYmd(bek.dueDate) : "");
  const rcpt = await prisma.payment.count({ where: { receiptNo: { not: null }, NOT: { receiptNo: { startsWith: "KV-" } } } });
  check("kvitansiyalar KV-YYYY-MM-#### formatida", rcpt === 0, rcpt);

  // ── imtihon, audit ──
  const mock = await prisma.exam.findFirst({ where: { title: "Markaz Mock imtihoni (LRW)", startsAt: { gt: now } } });
  const sat = dow(T) === 5 ? ymdAdd(T, 1) : nextWeekday(T, 6);
  check("Markaz Mock imtihoni: keyingi shanba 09:00, Katta zal", mock?.startsAt.getTime() === at(sat, "09:00").getTime() && mock.location === "Katta zal", sat);
  const chain = await verifyAuditChain();
  check("Audit zanjiri butun (verifyAuditChain)", chain.ok, `${chain.checked} ta yozuv`);
  const last2 = await prisma.auditLog.findMany({ orderBy: { id: "desc" }, take: 2 });
  check("Audit oxiri: 15:45 xona biriktirish → 16:32 baho 4 → 5", last2[1]?.action === "group.assign_room" && last2[0]?.action === "grade.update" && (last2[0].before as { value?: number })?.value === 4 && (last2[0].after as { value?: number })?.value === 5, last2.map((a) => `${hhmmOf(a.at)} ${a.action}`).reverse().join(" → "));

  // ── kelajakdagi vaqtlar ──
  const future = await prisma.$queryRaw<{ t: string; n: number }[]>`
    SELECT 'Attendance' t, count(*)::int n FROM "Attendance" WHERE "arrivedAt" > ${now} OR "createdAt" > ${now}
    UNION ALL SELECT 'Submission', count(*)::int FROM "Submission" WHERE "submittedAt" > ${now} OR "reviewedAt" > ${now} OR "createdAt" > ${now}
    UNION ALL SELECT 'Grade', count(*)::int FROM "Grade" WHERE "gradedAt" > ${now}
    UNION ALL SELECT 'Coin', count(*)::int FROM "CoinTransaction" WHERE "createdAt" > ${now}
    UNION ALL SELECT 'Payment', count(*)::int FROM "Payment" WHERE "paidAt" > ${now} OR "createdAt" > ${now}
    UNION ALL SELECT 'Message', count(*)::int FROM "Message" WHERE "createdAt" > ${now}
    UNION ALL SELECT 'Notification', count(*)::int FROM "Notification" WHERE "createdAt" > ${now}
    UNION ALL SELECT 'AuditLog', count(*)::int FROM "AuditLog" WHERE "at" > ${now}
    UNION ALL SELECT 'File', count(*)::int FROM "File" WHERE "createdAt" > ${now}
    UNION ALL SELECT 'Lesson DONE', count(*)::int FROM "Lesson" WHERE status = 'DONE' AND "endsAt" > ${now}
    UNION ALL SELECT 'ExamResult', count(*)::int FROM "ExamResult" WHERE "createdAt" > ${now}`;
  const fut = future.filter((f) => f.n > 0);
  check("kelajakdagi vaqt yoʻq (rejalashtirilganlardan tashqari)", fut.length === 0, fut.map((f) => `${f.t}:${f.n}`).join(" ") || "—");

  // ── o'zbekcha apostrof ──
  const texts = await prisma.$queryRaw<{ src: string; v: string }[]>`
    SELECT 'User' src, "fullName" || ' ' || coalesce(title,'') v FROM "User"
    UNION ALL SELECT 'Topic', title || ' ' || coalesce(description,'') || ' ' || array_to_string(objectives,' ') || ' ' || coalesce(grammar,'') FROM "Topic"
    UNION ALL SELECT 'Group', name FROM "Group"
    UNION ALL SELECT 'Room', name || ' ' || coalesce(location,'') || ' ' || coalesce(kind,'') FROM "Room"
    UNION ALL SELECT 'Branch', name || ' ' || coalesce(address,'') FROM "Branch"
    UNION ALL SELECT 'Lesson', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce("homeworkNote",'') FROM "Lesson"
    UNION ALL SELECT 'Homework', title || ' ' || coalesce(description,'') FROM "Homework"
    UNION ALL SELECT 'Submission', coalesce(feedback,'') || ' ' || coalesce(text,'') FROM "Submission"
    UNION ALL SELECT 'Grade', coalesce(title,'') || ' ' || coalesce(comment,'') FROM "Grade"
    UNION ALL SELECT 'Exam', title || ' ' || coalesce(description,'') || ' ' || coalesce(location,'') FROM "Exam"
    UNION ALL SELECT 'ExamResult', coalesce(comment,'') FROM "ExamResult"
    UNION ALL SELECT 'Material', title || ' ' || coalesce(description,'') FROM "Material"
    UNION ALL SELECT 'File', "originalName" FROM "File"
    UNION ALL SELECT 'Message', body FROM "Message"
    UNION ALL SELECT 'Thread', coalesce(subject,'') FROM "Thread"
    UNION ALL SELECT 'Payment', coalesce(note,'') FROM "Payment"
    UNION ALL SELECT 'Coin', coalesce(note,'') FROM "CoinTransaction"
    UNION ALL SELECT 'Notification', title || ' ' || body FROM "Notification"
    UNION ALL SELECT 'AuditLog', coalesce(summary,'') || ' ' || coalesce(before::text,'') || ' ' || coalesce(after::text,'') FROM "AuditLog"
    UNION ALL SELECT 'TeacherProfile', coalesce(bio,'') || ' ' || coalesce("responseTime",'') || ' ' || coalesce(specialization,'') FROM "TeacherProfile"
    UNION ALL SELECT 'StudentProfile', coalesce(goal,'') FROM "StudentProfile"`;
  const offenders = new Map<string, number>();
  for (const { src, v } of texts) {
    for (const mt of v.matchAll(/[\p{L}ʻʼ]*[A-Za-z]['‘’`][A-Za-z][\p{L}ʻʼ]*/gu)) {
      if (ENGLISH_OK.has(mt[0].toLowerCase())) continue;
      const k = `${src}: ${mt[0]}`;
      offenders.set(k, (offenders.get(k) ?? 0) + 1);
    }
  }
  check("oʻzbekcha matnda ASCII/tipografik apostrof yoʻq (ʻ U+02BB, ʼ U+02BC)", offenders.size === 0, [...offenders.keys()].slice(0, 8).join(" | ") || `${texts.length} ta matn tekshirildi`);

  // ── natija ──
  const w = Math.max(...results.map((r) => r.name.length));
  for (const r of results) console.log(`${r.ok ? "✓" : "✗"} ${r.name.padEnd(w)}  ${r.detail}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `\n✗ ${failed} ta tekshiruv oʻtmadi (${results.length} tadan)` : `\n✓ Barcha ${results.length} ta tekshiruv oʻtdi (T = ${T}, hozir ${now.toISOString()})`);
  if (failed) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
