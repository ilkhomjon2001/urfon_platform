// Tizim jurnali: ~3 hafta realistik harakatlar, oxirida T kunining kanon voqealari (15:45, 16:32).
// writeAudit() hash-zanjiri kiritish tartibiga bog'liq — shuning uchun avval vaqt bo'yicha saralanadi.
import type { Role } from "@prisma/client";
import type { Db } from "../../src/db.js";
import { writeAudit, type AuditInput } from "../../src/lib/audit.js";
import type { PayRow } from "./finance.js";
import type { Model } from "./plan.js";
import { Rng, at, dm, happened, som, ymdAdd, ymdOf } from "./util.js";

const IP = {
  sanjar: ["84.54.72.19", "Windows 11 · Edge 125"], nodira: ["84.54.72.21", "Windows 10 · Chrome 124"], alisher: ["195.158.12.84", "Chrome 125 · macOS"],
  shahzodbek: ["195.158.33.102", "Windows 10 · Chrome 124"], nigora: ["84.54.72.30", "macOS · Safari 17"], rustam: ["213.230.88.14", "iOS 17.5 · Mobile Safari"],
  ali: ["213.230.88.14", "Android App (Samsung S23)"], click: ["185.139.137.10", "Click Billing Webhook"], payme: ["185.8.212.44", "Payme Merchant API"],
  bot: ["149.154.167.220", "Telegram Bot API"],
} as const;
const METHOD: Record<string, string> = { CASH: "naqd", CARD: "karta", CLICK: "Click orqali", PAYME: "Payme orqali", TRANSFER: "bank oʻtkazmasi" };

export async function writeAuditLog(db: Db, m: Model, ctx: { payments: PayRow[]; dupPaymentId: string; aliGradeId: string; aliSubmissionId: string; gr05Room: string }) {
  const { clock } = m;
  const T = clock.T;
  const rng = new Rng("urfon-audit");
  const H = (ymd: string, hhmm: string, sec = 0) => happened(clock, at(ymd, hhmm, sec));
  const S = (k: string) => m.staff.get(k)!;
  const entries: AuditInput[] = [];
  const who = (k: keyof typeof IP) => ({ ip: IP[k][0], userAgent: IP[k][1] });
  const staffActor = (k: string) => ({ actorId: S(k).id, actorRole: S(k).role as Role });
  const add = (e: AuditInput) => {
    if (e.at && e.at <= clock.now) entries.push(e);
  };
  const start = ymdAdd(T, -21);

  // kundalik kirishlar
  for (let d = start; d <= T; d = ymdAdd(d, 1)) {
    const wd = new Date(`${d}T00:00:00Z`).getUTCDay();
    if (wd === 0) continue;
    for (const [k, hh] of [["sanjar", "08:4"], ["nodira", "08:3"], ["alisher", "09:3"]] as const) {
      add({ ...staffActor(k), action: "auth.login", entityType: "User", entityId: S(k).id, summary: "Tizimga kirish (parol)", ...who(k), at: H(d, `${hh}${rng.int(0, 9)}`, rng.int(0, 59)) });
    }
    if (rng.chance(0.4)) add({ ...staffActor("nigora"), action: "auth.login", entityType: "User", entityId: S("nigora").id, summary: "Tizimga kirish (parol)", ...who("nigora"), at: H(d, "09:0" + rng.int(0, 9)) });
  }
  // to'lovlar (so'nggi 3 hafta)
  const startDate = at(start, "00:00");
  for (const p of ctx.payments) {
    if (p.status !== "PAID" && p.id !== ctx.dupPaymentId) continue;
    const when = (p.id === ctx.dupPaymentId ? p.createdAt : p.paidAt) as Date;
    if (!when || when < startDate) continue;
    const sys = p.method === "CLICK" || p.method === "PAYME";
    const creator = p.createdById ? [...m.staff.values()].find((s) => s.id === p.createdById)! : null;
    add({
      actorId: sys ? null : creator?.id ?? null, actorRole: sys ? null : "ADMIN", action: "payment.create", entityType: "Payment", entityId: p.id,
      summary: `Toʻlov qabul qilindi: ${p.student.fullName} (#${p.student.code}) — ${som(p.amount)} soʻm (${METHOD[p.method as string] ?? "—"})`,
      after: { amount: p.amount, method: p.method, period: p.period, receiptNo: p.receiptNo || null, status: "PAID" },
      ...(sys ? who(p.method === "CLICK" ? "click" : "payme") : who(creator?.key === "sanjar" ? "sanjar" : "nodira")), at: when,
    });
  }
  // guruhlar va o'quvchilar
  const gr04 = m.groups.get("GR-04")!;
  const gr05 = m.groups.get("GR-05")!;
  add({ ...staffActor("sanjar"), action: "group.create", entityType: "Group", entityId: gr04.id, summary: "Yangi guruh ochildi: IELTS Foundation #4 (205-xona, Du · Cho · Ju, 16:00–17:30)", after: { code: "GR-04", status: "ENROLLING" }, ...who("sanjar"), at: at(gr04.createdYmd, "11:00") });
  add({ ...staffActor("sanjar"), action: "group.assign_teacher", entityType: "Group", entityId: gr04.id, summary: "IELTS Foundation #4 guruhiga Alisher Qosimov biriktirildi", before: { teacher: null }, after: { teacher: "Alisher Qosimov" }, ...who("sanjar"), at: at(ymdAdd(T, -18), "10:20") });
  add({ ...staffActor("sanjar"), action: "group.create", entityType: "Group", entityId: gr05.id, summary: "Yangi guruh ochildi: IELTS Foundation #5 (Du · Cho · Ju, 18:00–19:30) — ustoz va xona hali biriktirilmagan", after: { code: "GR-05", status: "ENROLLING", room: null, teacher: null }, ...who("sanjar"), at: at(gr05.createdYmd, "11:00") });
  for (const s of m.students.filter((x) => x.enrollments.some((e) => e.group === "GR-05"))) {
    const e = s.enrollments.find((x) => x.group === "GR-05")!;
    if (s.enrolledYmd >= start) add({ ...staffActor("nodira"), action: "user.create", entityType: "User", entityId: s.id, summary: `Yangi oʻquvchi roʻyxatga olindi: ${s.fullName} (#${s.code})`, after: { role: "STUDENT", code: s.code }, ...who("nodira"), at: at(s.enrolledYmd, "10:00", rng.int(0, 3000)) });
    const enrollAt = s.key === "sardor" ? H(T, "15:40") : at(e.joined, "10:40", rng.int(0, 3000));
    add({ ...staffActor(s.key === "sardor" ? "sanjar" : "nodira"), action: "group.enroll", entityType: "GroupStudent", entityId: s.id, summary: `${s.fullName} IELTS Foundation #5 guruhiga yozildi (kutmoqda)`, after: { group: "GR-05", status: "WAITING" }, ...who(s.key === "sardor" ? "sanjar" : "nodira"), at: enrollAt });
  }
  const ju = m.byKey.get("jasur_u")!;
  add({ ...staffActor("sanjar"), action: "student.status", entityType: "StudentProfile", entityId: ju.id, summary: "Jasur Umidov (#ST-8204) akademik taʼtilga chiqarildi (ota-ona arizasi asosida)", before: { status: "ACTIVE" }, after: { status: "ACADEMIC_LEAVE" }, ...who("sanjar"), at: at(ymdAdd(T, -6), "11:30") });
  add({ ...staffActor("nodira"), action: "payment.remind", entityType: "Payment", entityId: null, summary: "Qarzdorlik SMS yuborildi: Dilnoza Umidova (Jasur Umidov) — 750 000 soʻm", ...who("nodira"), at: at(ymdAdd(T, -2), "10:15") });
  // akademik harakatlar
  const ali = m.byKey.get("ali")!;
  add({ ...staffActor("alisher"), action: "attendance.update", entityType: "Attendance", entityId: ali.id, summary: `Ali Valiyev: ${dm(m.L(6))} davomati «sababli» deb belgilandi (ota-ona xabari)`, before: { status: "ABSENT" }, after: { status: "EXCUSED" }, ...who("alisher"), at: at(m.L(6), "12:45") });
  add({ ...staffActor("alisher"), action: "material.create", entityType: "Material", entityId: null, summary: "IELTS Foundation #3: «Unit 4 — Presentation Slides.pdf» (4.2 MB) yuklandi", ...who("alisher"), at: at(m.L(1), "18:00", 20) });
  add({ ...staffActor("nigora"), action: "topic.update", entityType: "Topic", entityId: null, summary: "Level 2 · Unit 7 — Travel, Transport & Places: dars rejasi va lugʻat fayllari biriktirildi", ...who("nigora"), at: at(ymdAdd(T, -9), "14:15") });
  add({ ...staffActor("nigora"), action: "topic.create", entityType: "Topic", entityId: null, summary: "Level 6 · Unit 5–6 qoralama sifatida qoʻshildi", after: { status: "DRAFT" }, ...who("nigora"), at: at(ymdAdd(T, -8), "11:40") });
  add({ ...staffActor("shahzodbek"), action: "grade.update", entityType: "Grade", entityId: null, summary: "IELTS Advanced Mock #2: Writing bahosi 3 → 4 (qayta tekshiruv)", before: { value: 3 }, after: { value: 4 }, ...who("shahzodbek"), at: at(ymdAdd(T, -5), "18:20") });
  add({ ...staffActor("sanjar"), action: "room.assign", entityType: "Group", entityId: m.groups.get("GR-21")!.id, summary: "Grammar Booster #1 guruhiga 105-xona biriktirildi", before: { room: null }, after: { room: "105-xona" }, ...who("sanjar"), at: at(m.groups.get("GR-21")!.createdYmd, "12:00") });

  // ── T kuni (KANON §7) ──
  add({ ...staffActor("shahzodbek"), action: "schedule.view", entityType: "Room", entityId: null, summary: "Dars jadvali va xonalar bandligi: 204-xona dars vaqtlari tekshirildi", ...who("shahzodbek"), at: H(T, "10:02", 18) });
  add({ actorId: ali.id, actorRole: "STUDENT", action: "submission.draft", entityType: "Submission", entityId: ctx.aliSubmissionId, summary: "Uyga vazifa: Unit 4 — Family words — audio fayl (ali_speaking_recording_unit4.mp3) yuklandi — qoralama", ...who("ali"), at: H(T, "11:15", 33) });
  const dup = ctx.payments.find((p) => p.id === ctx.dupPaymentId)!;
  add({ ...staffActor("sanjar"), action: "payment.cancel", entityType: "Payment", entityId: dup.id, summary: "Toʻlov #1039 (Bekzod Karimov): notoʻgʻri kiritilgan dublikat toʻlov (850 000 soʻm) bekor qilindi", before: { status: "PAID", amount: 850_000 }, after: { status: "CANCELLED" }, ...who("sanjar"), at: H(T, "13:05", 40) });
  add({ actorId: m.parentByKey.get("rustam")!.id, actorRole: "PARENT", action: "auth.login", entityType: "User", entityId: m.parentByKey.get("rustam")!.id, summary: "Ota-ona kabineti (avtorizatsiya) — muvaffaqiyatli kirish", ...who("rustam"), at: H(T, "14:28", 19) });
  add({ actorId: null, actorRole: null, action: "notification.sent", entityType: "Notification", entityId: null, summary: "Telegram xabar — Rustam Valiyev (ota-ona): kunlik davomat va yangi baho hisoboti", ...who("bot"), at: H(T, "15:12", 44) });
  add({ ...staffActor("sanjar"), action: "group.assign_room", entityType: "Group", entityId: gr05.id, summary: "Sanjar Rahimov IELTS Foundation #5 guruhiga 204-xonani biriktirdi", before: { room: "Biriktirilmagan", roomId: null }, after: { room: "204-xona", roomId: ctx.gr05Room }, ...who("sanjar"), at: H(T, "15:45", 2) });
  add({
    ...staffActor("alisher"), action: "grade.update", entityType: "Grade", entityId: ctx.aliGradeId, summary: "Baho — Ali Valiyev (#ST-8492): 4 → 5 (Unit 3 Speaking)",
    before: { value: 4, baho: 4, modul: "Unit 3: Daily Routines — Speaking", izoh: "Uy vazifasi topshirildi (avtomatik baholash)", yangilagan: "Avtomatik baholash tizimi", vaqt: `${ymdAdd(m.L(1), -1)} 19:02:11` },
    after: { value: 5, baho: 5, modul: "Unit 3: Daily Routines — Speaking", izoh: "Unit 3 speaking audiosi qayta tekshirildi", yangilagan: "Alisher Qosimov (Ustoz)", sabab: "Oʻquvchi tomonidan toʻgʻrilangan audio fayl taqdim etildi, fon shovqinlari tuzatilib topshiriq mezonlariga toʻliq javob bergani uchun baho 5 ga koʻtarildi." },
    ip: IP.alisher[0], userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36", at: H(T, "16:32", 10),
  });

  entries.sort((a, b) => a.at!.getTime() - b.at!.getTime());
  for (const e of entries) await writeAudit(db, e);
  void ymdOf;
  return entries.length;
}
