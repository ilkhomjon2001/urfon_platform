// Materiallar (resurslar bazasi), xabarlar, imtihonlar, bildirishnomalar, hisobotlar.
import type { Prisma } from "@prisma/client";
import type { Db } from "../../src/db.js";
import { storeFile, type FileSpec } from "./files.js";
import type { HwRec, SubRec } from "./homework.js";
import type { AttRec, LessonRec } from "./lessons.js";
import type { Model } from "./plan.js";
import type { Structure } from "./structure.js";
import { Rng, addMin, at, cid, dm, happened, insertMany, monthLabel, nextWeekday, som, ymdAdd, type Clock } from "./util.js";

const MB = 1024 * 1024;
const L = (m: Model, code: string, ymd: string) => null as unknown as LessonRec; // (tip yordamchisi)
void L;

// ───────────────────────────── Materiallar ─────────────────────────────

export async function writeMaterials(db: Db, m: Model, st: Structure, lessons: Map<string, LessonRec[]>) {
  const { clock } = m;
  const T = clock.T;
  const rng = new Rng("urfon-materials");
  const alisher = m.staff.get("alisher")!.id;
  const nigora = m.staff.get("nigora")!.id;
  const nodira = m.staff.get("nodira")!.id;
  const gid = (c: string) => m.groups.get(c)!.id;
  const l2 = st.topics.get("L2")!;
  const gr03 = lessons.get("GR-03")!;
  const L1 = gr03.find((l) => l.ymd === m.L(1))!;
  const levelId = (c: string) => st.levels.get(c)!;
  let n = 0;
  const add = async (
    file: FileSpec | null,
    mat: { title: string; description?: string; type: Prisma.MaterialCreateManyInput["type"]; url?: string; level?: string; topicId?: string | null; group?: string | null; lessonId?: string | null; by: string; downloads: number; at: Date },
  ) => {
    const f = file ? await storeFile(db, file, { uploadedById: mat.by, createdAt: mat.at }) : null;
    await db.material.create({
      data: {
        title: mat.title, description: mat.description ?? null, type: mat.type, fileId: f?.id ?? null, url: mat.url ?? null, levelId: mat.level ? levelId(mat.level) : null,
        topicId: mat.topicId ?? null, groupId: mat.group ? gid(mat.group) : null, lessonId: mat.lessonId ?? null, uploadedById: mat.by, downloads: mat.downloads, createdAt: mat.at,
      },
    });
    n++;
  };
  const u4 = l2[3].id;
  // 22-may darsi (KANON §7): 4 ta fayl
  await add({ name: "Unit 4 — Presentation Slides.pdf", bytes: Math.round(4.2 * MB), lines: ["Unit 4 — My Family & Relationships", "Immediate family · extended relatives · kinship terms", "Present Perfect vs Past Simple", "Speaking Part 2: Describe a family member you admire"] },
    { title: "Unit 4 — Presentation Slides.pdf", description: "Dars taqdimoti va grammatika qoidalari", type: "PDF", level: "L2", topicId: u4, group: "GR-03", lessonId: L1.id, by: alisher, downloads: 12, at: at(L1.ymd, "18:00") });
  await add({ name: "Unit 4 — Native Audio.mp3", seconds: 195, bytes: Math.round(8.5 * MB) },
    { title: "Unit 4 — Native Audio.mp3", description: "Tinglab tushunish audio mashqi · 3:15 daqiqa", type: "AUDIO", level: "L2", topicId: u4, group: "GR-03", lessonId: L1.id, by: alisher, downloads: 9, at: at(L1.ymd, "18:01") });
  await add({ name: "Speaking Vocabulary & Idioms.docx", lines: ["take after · get along with · look up to · bring up", "a close-knit family · supportive siblings · black sheep"] },
    { title: "Speaking Vocabulary & Idioms.docx", description: "Mustaqil takrorlash lugʻat varaqasi", type: "DOC", level: "L2", topicId: u4, group: "GR-03", lessonId: L1.id, by: alisher, downloads: 7, at: at(L1.ymd, "18:02") });
  await add({ name: "Homework Assignment Sheet.pdf", bytes: 750 * 1024, lines: ["Unit 4 — Family words", "1) 12 ta soʻz  2) 1–2 daqiqalik audio  3) sevimli ibora"] },
    { title: "Homework Assignment Sheet.pdf", description: "Uy vazifasi yoʻriqnomasi va mashqlar", type: "PDF", level: "L2", topicId: u4, group: "GR-03", lessonId: L1.id, by: alisher, downloads: 10, at: at(L1.ymd, "18:03") });
  await add({ name: "Grammar — Present Perfect vs Past Simple.pdf", bytes: Math.round(1.1 * MB), lines: ["Qoidalar jadvali", "have/has + V3  vs  V2", "ever · never · already · yet · last year · ago"] },
    { title: "Grammar: Present Perfect vs Past Simple", description: "Qoidalar jadvali · 1.1 MB", type: "PDF", level: "L2", topicId: u4, group: "GR-03", by: alisher, downloads: 8, at: at(L1.ymd, "18:05") });
  await add(null, { title: "Speaking Part 1: Cue Cards", description: "30 ta interaktiv kartochka", type: "LINK", url: "https://quizlet.com/urfon/speaking-part-1-cue-cards", level: "L2", topicId: u4, group: "GR-03", by: alisher, downloads: 23, at: at(m.L(2), "17:40") });
  // oldingi unitlar (GR-03)
  for (const u of [1, 2, 3]) {
    const first = gr03.find((l) => l.unit === u)!;
    await add({ name: `Unit ${u} — Presentation Slides.pdf`, bytes: rng.int(1_500_000, 3_800_000), lines: [l2[u - 1].title, `Level 2 · IELTS Foundation · Unit ${u}`] },
      { title: `Unit ${u} — Presentation Slides.pdf`, description: "Dars taqdimoti", type: "PDF", level: "L2", topicId: l2[u - 1].id, group: "GR-03", lessonId: first.id, by: alisher, downloads: rng.int(10, 14), at: addMin(first.endsAt, 150) });
    await add({ name: `Unit ${u} — Audio.mp3`, seconds: rng.int(120, 200), lowBitrate: true },
      { title: `Unit ${u} — Audio.mp3`, description: "Tinglash mashqi", type: "AUDIO", level: "L2", topicId: l2[u - 1].id, group: "GR-03", lessonId: first.id, by: alisher, downloads: rng.int(8, 14), at: addMin(first.endsAt, 155) });
  }
  // Level 2 lug'atlari (umumiy baza, Nigora)
  for (const t of l2.slice(0, 7)) {
    await add({ name: `Level 2 · Unit ${t.unit} Wordlist.pdf`, lines: [t.title, ...[]] },
      { title: `Level 2 · Unit ${t.unit} Wordlist`, description: `${t.title} — lugʻat roʻyxati`, type: "PDF", level: "L2", topicId: t.id, by: nigora, downloads: rng.int(40, 140), at: at(ymdAdd(T, -200 + t.unit * 3), "11:00") });
  }
  const u7 = l2[6].id;
  await add({ name: "Unit_7_Syllabus_LessonPlan.pdf", bytes: Math.round(1.8 * MB), lines: ["Unit 7 — Travel, Transport & Places", "4 dars · 6 akademik soat"] },
    { title: "Unit 7 — Syllabus & Lesson Plan", description: "Ustozlar uchun dars rejasi", type: "PDF", level: "L2", topicId: u7, by: nigora, downloads: 6, at: at(ymdAdd(T, -9), "14:10") });
  await add({ name: "Vocabulary_travel_transport.docx", lines: ["journey · destination · itinerary · public transport"] },
    { title: "Vocabulary: travel & transport", description: "Unit 7 lugʻati", type: "DOC", level: "L2", topicId: u7, by: nigora, downloads: 4, at: at(ymdAdd(T, -9), "14:12") });
  // Resurslar bazasi mockupi
  await add({ name: "Cambridge IELTS 18 Academic — Audio & Keys.pdf", lines: ["Cambridge IELTS 18 Academic", "Full Audio & Answer Keys (PDF + MP3 · 185 MB toʻplam)"] },
    { title: "Cambridge IELTS 18 Academic Full Audio & Keys", description: "PDF + MP3 · 185 MB toʻplam (demo nusxa)", type: "PDF", level: "L5", by: alisher, downloads: 248, at: happened(clock, addMin(clock.now, -10)) });
  await add({ name: "Writing Task 2 Band 8.0+ Model Essays.pdf", lines: ["Band 8.0+ namunaviy esselar", "Opinion · Discussion · Advantages/Disadvantages"] },
    { title: "Writing Task 2 Band 8.0+ Model Essays & Vocabulary", description: "14.2 MB · IELTS Band 7.0+ guruhiga biriktirilgan", type: "PDF", level: "L5", group: "GR-18", by: alisher, downloads: 342, at: at(ymdAdd(T, -1), "18:30") });
  await add({ name: "C1 Advanced Inversion & Conditional Structures Guide.pdf", lines: ["Inversion · Mixed conditionals · Cleft sentences", "Ustoz kaliti kiritilgan"] },
    { title: "C1 Advanced Inversion & Conditional Structures Guide", description: "8.5 MB · Ustoz kaliti kiritilgan", type: "PDF", level: "L4", group: "GR-09", by: alisher, downloads: 96, at: at(ymdAdd(T, -12), "17:50") });
  await add({ name: "Mock Exam #4 Reading & Listening Answer Sheets.zip", lines: ["Faqat ustozlar uchun"] },
    { title: "Mock Exam #4 Reading & Listening Answer Sheets", description: `Maxfiy · Faqat ustozlar · Imtihon sanasi: ${dm(nextWeekday(T, 6))}`, type: "DOC", by: alisher, downloads: 0, at: at(ymdAdd(T, -3), "16:20") });
  await add({ name: "IELTS Speaking Cue Cards toʻplami.pdf", lines: ["Part 2 kartochkalari: 60 ta mavzu"] },
    { title: "IELTS Speaking Cue Cards toʻplami", description: "Part 2 uchun 60 ta kartochka (yangilangan)", type: "PDF", level: "L3", by: nodira, downloads: 57, at: happened(clock, at(T, "11:20")) });
  await add(null, { title: "IELTS Speaking Part 2 — Band 8 namunaviy javob (video)", description: "12 daqiqalik video dars", type: "VIDEO", url: "https://www.youtube.com/watch?v=urfonSpk2B8", level: "L3", by: alisher, downloads: 131, at: at(ymdAdd(T, -40), "20:00") });
  await add(null, { title: "Listening Section 4: Academic Notes strategiyasi (video)", description: "18 daqiqalik video dars", type: "VIDEO", url: "https://www.youtube.com/watch?v=urfonLis4Nt", level: "L5", group: "GR-18", by: alisher, downloads: 64, at: at(ymdAdd(T, -25), "20:00") });
  await add({ name: "Writing Task 1 — Line graph samples.pdf", lines: ["6 ta namunaviy hisobot"] },
    { title: "Writing Task 1 — Line graph samples", description: "Namunaviy hisobotlar", type: "PDF", level: "L3", group: "GR-11", by: m.staff.get("shahzodbek")!.id, downloads: 41, at: at(ymdAdd(T, -6), "18:00") });
  await add({ name: "Kids Starters — Animals Flashcards.pdf", lines: ["cat · dog · lion · elephant · monkey · rabbit"] },
    { title: "Kids Starters — Animals Flashcards", description: "Rangli kartochkalar (chop etish uchun)", type: "PDF", level: "KIDS", group: "GR-15", by: m.staff.get("malika")!.id, downloads: 18, at: at(ymdAdd(T, -15), "12:00") });
  await add({ name: "Kids — Hello Song.mp3", seconds: 95, lowBitrate: true },
    { title: "Kids — Hello Song", description: "Qoʻshiq (audio)", type: "AUDIO", level: "KIDS", group: "GR-17", by: m.staff.get("malika")!.id, downloads: 25, at: at(ymdAdd(T, -30), "12:00") });
  await add({ name: "Grammar Intensive — Worksheet 12.pdf", lines: ["Past Simple: regular & irregular verbs"] },
    { title: "Grammar Intensive — Worksheet 12", description: "Past Simple mashqlari", type: "PDF", level: "L1", group: "GR-16", by: m.staff.get("jasurbek")!.id, downloads: 30, at: at(ymdAdd(T, -8), "19:40") });
  await add({ name: "Mock Speaking — Band Descriptors.pdf", lines: ["Fluency & Coherence · Lexical Resource · Grammar · Pronunciation"] },
    { title: "Mock Speaking — Band Descriptors", description: "Weekend Club uchun baholash mezonlari", type: "PDF", group: "GR-20", by: alisher, downloads: 38, at: at(ymdAdd(T, -20), "16:40") });
  return n;
}

// ───────────────────────────── Xabarlar ─────────────────────────────

type Msg = { from: string; body: string; at: Date; lessonId?: string; isQuestion?: boolean; file?: FileSpec };

export async function writeMessages(db: Db, m: Model, lessons: Map<string, LessonRec[]>) {
  const { clock } = m;
  const T = clock.T;
  const H = (ymd: string, hhmm: string, sec = 0) => happened(clock, at(ymd, hhmm, sec));
  const S = (k: string) => m.staff.get(k)!.id;
  const St = (k: string) => m.byKey.get(k)!.id;
  const P = (k: string) => m.parentByKey.get(k)!.id;
  const gr03 = lessons.get("GR-03")!;
  const L1 = gr03.find((l) => l.ymd === m.L(1))!;
  const nextSat = nextWeekday(T, 6);
  const alisher = S("alisher");
  let threads = 0;

  const thread = async (o: { kind?: "DIRECT" | "GROUP"; subject?: string; studentKey?: string; group?: string; members: string[]; msgs: Msg[]; unreadFor?: Record<string, number> }) => {
    const msgs = [...o.msgs].sort((a, b) => a.at.getTime() - b.at.getTime());
    const t = await db.thread.create({
      data: {
        kind: o.kind ?? "DIRECT", subject: o.subject ?? null, studentId: o.studentKey ? St(o.studentKey) : null, groupId: o.group ? m.groups.get(o.group)!.id : null,
        createdAt: msgs[0].at, lastMessageAt: msgs[msgs.length - 1].at,
      },
    });
    const ids = msgs.map(() => cid());
    await insertMany(db.message, msgs.map((x, i) => ({ id: ids[i], threadId: t.id, senderId: x.from, body: x.body, lessonId: x.lessonId ?? null, isQuestion: !!x.isQuestion, createdAt: x.at })));
    for (const [i, x] of msgs.entries()) if (x.file) await storeFile(db, x.file, { uploadedById: x.from, createdAt: x.at, messageId: ids[i] });
    // o'qilgan: odatiy — oxirgi xabargacha; unreadFor[user] = oxirgi N ta boshqalar xabari o'qilmagan
    await insertMany(db.threadParticipant, o.members.map((u) => {
      const unread = o.unreadFor?.[u] ?? 0;
      const others = msgs.filter((x) => x.from !== u);
      let lastReadAt: Date | null = msgs[msgs.length - 1].at;
      if (unread > 0) lastReadAt = others.length > unread ? addMin(others[others.length - unread - 1].at, 1) : null;
      if (unread < 0) lastReadAt = null;
      return { threadId: t.id, userId: u, lastReadAt };
    }));
    threads++;
  };

  // 1) Rustam Valiyev ↔ Alisher (Ali haqida)
  await thread({
    subject: "Ali Valiyev", studentKey: "ali", members: [P("rustam"), alisher], msgs: [
      { from: P("rustam"), at: at(m.L(6), "12:10"), body: "Assalomu alaykum ustoz, Ali bugun oilaviy sabab bilan darsga kela olmaydi. Uzr soʻraymiz." },
      { from: alisher, at: at(m.L(6), "12:40"), body: "Vaalaykum assalom, Rustam aka. Tushunarli, sababli deb belgilab qoʻyaman. Dars materiallarini kabinetga joylayman, Ali uyda koʻrib chiqsin." },
      { from: alisher, at: at(ymdAdd(m.L(1), -1), "19:30"), body: "Rustam aka, Ali darsda juda faol va erkin fikrlaydi. Oʻzlashtirish yanada tezlashishi uchun har kuni kechqurun 15 daqiqa BBC audio-yangiliklarini tinglash va oʻqigan kitobini inglizcha qisqa aytib berishini soʻrashingizni tavsiya qilaman." },
      { from: P("rustam"), at: at(m.L(1), "15:38"), lessonId: L1.id, body: "Assalomu alaykum! Darsdagi taqdimot faylini telefondan ochishda biroz qiyinchilik boʻldi." },
      { from: alisher, at: at(m.L(1), "15:45"), body: "Assalomu alaykum, Rustam aka! Faylni Telegram bot orqali ham toʻgʻridan-toʻgʻri yubordim, bemalol yuklab olishingiz mumkin. Ali bugun juda faol qatnashdi!" },
      { from: P("rustam"), at: H(ymdAdd(T, -1), "19:10"), lessonId: L1.id, isQuestion: true, body: "Uyda qanday yordam bera olaman?" },
      { from: alisher, at: H(ymdAdd(T, -1), "20:05"), body: "Ali bilan Unit 4 soʻzlarini kechqurun 10 daqiqa takrorlang: oila aʼzolari haqida savol bering, u inglizcha javob bersin. Audio vazifani bugun emas, muddat kuni 20:00 gacha yuklashi kerak — shoshilmasin, sifatli yozsin." },
    ],
  });
  // 2) Ali ↔ Alisher (o'quvchi chati) — 1 ta o'qilmagan
  await thread({
    members: [St("ali"), alisher], unreadFor: { [alisher]: 1 }, msgs: [
      { from: St("ali"), at: H(ymdAdd(T, -1), "18:20"), body: "Ustoz, Unit 4 vazifasida audio necha daqiqa boʻlishi kerak?" },
      { from: alisher, at: H(ymdAdd(T, -1), "18:45"), body: "Salom Ali! 1–2 daqiqa, kamida 5 ta gap. «Native Audio.mp3» ni tinglab, talaffuzni mashq qiling." },
      { from: St("ali"), at: H(T, "11:20"), body: "Alisher aka, Unit 4 audio yozuvimni yukladim, sevimli iborani kechqurun yozib qoʻyaman." },
    ],
  });
  // 3) Bekzod ↔ Alisher
  await thread({
    members: [St("bekzod"), alisher], msgs: [
      { from: St("bekzod"), at: H(T, "10:15"), body: "Assalomu alaykum ustoz! Unit 4 topshirigʻini yukladim." },
      { from: alisher, at: H(T, "10:20"), body: "Va alaykum assalom Bekzod! Yaxshi, qabul qilindi. Rubrika asosida 4 soat ichida tekshirilib, baholanadi." },
      { from: alisher, at: H(T, "10:22"), body: "Resurslar bazasidan: Speaking Cue Cards — keyingi dars uchun tayyorlanib keling.", file: { name: "Unit 4 — Speaking Cue Cards.pdf", lines: ["Describe a family member you admire", "Describe a family celebration", "Describe your grandparents"] } },
    ],
  });
  // 4) Nilufar ↔ Alisher — 1 ta o'qilmagan
  await thread({
    members: [St("nilufar"), alisher], unreadFor: { [alisher]: 1 }, msgs: [
      { from: St("nilufar"), at: H(T, "11:08"), body: "Ustoz, sevimli iborani matn qilib yozsam boʻladimi yoki audioda ham aytaymi?" },
    ],
  });
  // 5) Madina Rahmatova ↔ Alisher — 1 ta o'qilmagan
  await thread({
    members: [St("madina_rh"), alisher], unreadFor: { [alisher]: 1 }, msgs: [
      { from: alisher, at: at(ymdAdd(T, -2), "17:10"), body: "Madina, oldingi essayingizda 2-paragrafni qayta koʻrib chiqing: misol argumentni toʻliq qoʻllab-quvvatlamayapti." },
      { from: St("madina_rh"), at: H(T, "11:05"), body: "Vazifamni tekshirib berdingizmi, rahmat katta!" },
    ],
  });
  // 6) GR-18 o'quvchisi ↔ Alisher (javob berilgan)
  const g18 = m.byKey.get("GR-18-4")!.id;
  await thread({
    members: [g18, alisher], msgs: [
      { from: g18, at: H(T, "10:40"), body: "Ustoz, Writing Task 2 boʻyicha lugʻat faylini ham tashlay olasizmi?" },
      { from: alisher, at: H(T, "10:52"), body: "Albatta, «Writing Task 2 Band 8.0+ Model Essays» faylini resurslar bazasiga yukladim." },
    ],
  });
  // 7) Dilshod Temirov ↔ Alisher (Jasur haqida) — 2 ta o'qilmagan
  await thread({
    subject: "Jasur Temirov", studentKey: "jasur_t", members: [P("dilshod"), alisher], unreadFor: { [alisher]: 2 }, msgs: [
      { from: P("dilshod"), at: H(ymdAdd(T, -1), "20:15"), body: "Assalomu alaykum ustoz, Jasurning faolligi qanday?" },
      { from: P("dilshod"), at: H(ymdAdd(T, -1), "20:17"), body: "Grammar Masterclass darslarida uyga vazifalarni oʻz vaqtida topshiryaptimi?" },
    ],
  });
  // 8) Jahongir Karimov ↔ Alisher (Bekzod haqida)
  await thread({
    subject: "Bekzod Karimov", studentKey: "bekzod", members: [P("jahongir"), alisher], msgs: [
      { from: P("jahongir"), at: at(ymdAdd(T, -6), "21:05"), body: "Assalomu alaykum, Bekzod Speaking boʻyicha qiynalayotganini aytdi. Qanday mashq qilsin?" },
      { from: alisher, at: at(ymdAdd(T, -6), "21:40"), body: "Vaalaykum assalom! Har kuni 5 daqiqa oʻzi haqida audio yozib, qayta tinglasin. Shanba kungi Speaking klubga ham taklif qilaman." },
    ],
  });
  // 9) boshqa ota-onalar ↔ Alisher (o'qilgan)
  const parentsOf = (key: string) => m.parents.find((p) => p.children.includes(m.byKey.get(key)!.id))!;
  const extra: [string, string, string][] = [
    ["GR-04-0", "Assalomu alaykum ustoz, oʻgʻlim yangi guruhga moslashyaptimi?", "Vaalaykum assalom! Ha, birinchi haftada juda yaxshi natija koʻrsatdi."],
    ["GR-18-3", "Ustoz, qizim Mock imtihonga tayyormi?", "Ha, oxirgi Listening testida 7.0 oldi. Writing ustida biroz ishlaymiz."],
    ["GR-04-6", "Shanba kungi klubga qatnashishi shartmi?", "Ixtiyoriy, lekin Speaking uchun juda foydali. Tavsiya qilaman."],
    ["GR-03-4", "Assalomu alaykum, farzandim Unit 3 testidan qanday natija oldi?", "Vaalaykum assalom! 4.2 — yaxshi natija, lugʻatni takrorlash tavsiya etiladi."],
  ];
  for (const [i, [k, q, a]] of extra.entries()) {
    const p = parentsOf(k);
    await thread({ subject: m.byKey.get(k)!.fullName, studentKey: k, members: [p.id, alisher], msgs: [
      { from: p.id, at: at(ymdAdd(T, -(3 + i * 2)), "19:20"), body: q }, { from: alisher, at: at(ymdAdd(T, -(3 + i * 2)), "20:05"), body: a },
    ] });
  }
  // 10) Admin ↔ Alisher
  await thread({
    members: [S("sanjar"), alisher], msgs: [
      { from: S("sanjar"), at: H(T, "15:50"), body: "Alisher, IELTS Foundation #5 uchun 204-xona biriktirildi (Du · Cho · Ju, 18:00). Ustoz masalasini dushanbagacha hal qilamiz." },
      { from: alisher, at: H(T, "15:58"), body: "Rahmat, Sanjar aka. Kamola Tursunova nomzodini qoʻllab-quvvatlayman." },
    ],
  });
  await thread({
    members: [S("nodira"), alisher], msgs: [
      { from: S("nodira"), at: at(ymdAdd(T, -2), "09:10"), body: "Alisher aka, 12-xonadagi naushniklar almashtirildi, Listening darslari uchun tayyor." },
      { from: alisher, at: at(ymdAdd(T, -2), "09:25"), body: "Katta rahmat, Nodira opa!" },
    ],
  });
  // 11) Gulnoza Rahimova ↔ Shahzodbek; Jahongir ↔ Nodira (to'lov)
  await thread({
    subject: "Madina Rahimova", studentKey: "madina_r", members: [P("gulnoza"), S("shahzodbek")], msgs: [
      { from: P("gulnoza"), at: at(ymdAdd(T, -4), "18:30"), body: "Assalomu alaykum, Madina Writing Task 1 ni qayerda mashq qilsa boʻladi?" },
      { from: S("shahzodbek"), at: at(ymdAdd(T, -4), "19:02"), body: "Vaalaykum assalom! Resurslar boʻlimida «Line graph samples» fayli bor, haftasiga 2 ta hisobot yozsin." },
    ],
  });
  await thread({
    subject: "Bekzod Karimov", studentKey: "bekzod", members: [P("jahongir"), S("nodira")], msgs: [
      { from: S("nodira"), at: at(ymdAdd(T, -2), "11:00"), body: `Assalomu alaykum, Jahongir aka. Bekzodning ${monthLabel(T.slice(0, 7))} oyi toʻlovi (850 000 soʻm) muddati — ${dm(ymdAdd(T, 1))}.` },
      { from: P("jahongir"), at: at(ymdAdd(T, -2), "12:15"), body: "Rahmat, muddatgacha kassaga olib boraman." },
    ],
  });

  // 12) GROUP — e'lonlar kanallari (ustoz + ota-onalar)
  const groupParents = (code: string) => [...new Set(m.students.filter((s) => s.enrollments.some((e) => e.group === code && e.status === "ACTIVE")).flatMap((s) => s.parentIds))];
  const ann = async (code: string, msgs: Msg[], unreadParents = 0) => {
    const parents = groupParents(code);
    const unreadFor: Record<string, number> = {};
    parents.slice(0, unreadParents).forEach((p) => (unreadFor[p] = 1));
    await thread({ kind: "GROUP", subject: `${m.groups.get(code)!.name} — eʼlonlar`, group: code, members: [alisher, ...parents], msgs, unreadFor });
  };
  await ann("GR-03", [
    { from: alisher, at: at(m.L(6), "16:00"), body: `Hurmatli ota-onalar! ${dm(m.L(4))} kuni Unit 3 lugʻat testi boʻlib oʻtadi. Farzandlaringiz Unit 3 lugʻatini takrorlashsin.` },
    { from: alisher, at: H(ymdAdd(T, -1), "18:00"), body: `Hurmatli ota-onalar! ${dm(nextSat)} (shanba) soat 09:00 da Katta zalda Markaz Mock imtihoni (LRW) boʻlib oʻtadi. Farzandlaringiz 08:40 gacha kelishsin, qalam va suv olishsin.` },
  ], 4);
  await ann("GR-18", [{ from: alisher, at: at(ymdAdd(T, -2), "12:00"), body: "Hurmatli ota-onalar! Writing Task 2 esselari muddati — bugun 23:59. Oʻquvchilarga eslatib qoʻying." }]);
  await ann("GR-09", [{ from: alisher, at: at(ymdAdd(T, -1), "17:45"), body: "Audio yozuv resurslar bazasiga yuklandi. Inversion worksheet muddati — 20:00." }]);
  return threads;
}

// ───────────────────────────── Imtihonlar ─────────────────────────────

export async function writeExams(db: Db, m: Model, lessons: Map<string, LessonRec[]>, att: AttRec[]) {
  const { clock } = m;
  const T = clock.T;
  const rng = new Rng("urfon-exams");
  const sanjar = m.staff.get("sanjar")!.id;
  const alisher = m.staff.get("alisher")!.id;
  const gid = (c: string) => m.groups.get(c)!.id;
  const ali = m.byKey.get("ali")!;
  const nextSat = nextWeekday(T, 6);
  const members = (code: string) => m.students.filter((s) => s.enrollments.some((e) => e.group === code && e.status === "ACTIVE"));
  const half = (x: number) => Math.round(x * 2) / 2;
  const results: Prisma.ExamResultCreateManyInput[] = [];
  const exam = async (d: Prisma.ExamCreateManyInput) => (await db.exam.create({ data: d })).id;

  await exam({ groupId: null, title: "Markaz Mock imtihoni (LRW)", type: "MOCK", startsAt: at(nextSat, "09:00"), durationMin: 210, location: "Katta zal", description: "54 nomzod roʻyxatdan oʻtgan · Listening, Reading, Writing · Nazoratchi: Alisher Qosimov", createdById: sanjar, createdAt: at(ymdAdd(T, -12), "10:00") });
  // o'tgan markaz mock'i (4 hafta oldin)
  const past = await exam({ groupId: null, title: "Markaz Mock imtihoni (LRW)", type: "MOCK", startsAt: at(ymdAdd(nextSat, -28), "09:00"), durationMin: 210, location: "Katta zal", description: "Oylik markaz Mock sinovi · 48 nomzod", createdById: sanjar, createdAt: at(ymdAdd(nextSat, -40), "10:00") });
  const bandBase: Record<string, number> = { "GR-18": 6.9, "GR-12": 6.4, "GR-11": 5.9, "GR-03": 5.4 };
  for (const [code, base] of Object.entries(bandBase)) {
    for (const s of members(code).slice(0, code === "GR-03" ? 10 : code === "GR-11" ? 10 : 16)) {
      if (results.some((r) => r.examId === past && r.studentId === s.id)) continue;
      const [l, r, w] = s.id === ali.id ? [6.0, 5.5, 5.5] : [0, 0, 0].map(() => Math.max(4, Math.min(8.5, half(base + (s.mean - 4.2) * 0.8 + (rng.next() - 0.5)))));
      results.push({ examId: past, studentId: s.id, listening: l, reading: r, writing: w, band: half((l + r + w) / 3), comment: null, createdAt: at(ymdAdd(nextSat, -26), "15:00") });
    }
  }
  // GR-03: Listening Practice Test #4 (T−1, 16:40 da topshirildi)
  const lpt = await exam({ groupId: gid("GR-03"), title: "Listening Practice Test #4", type: "QUIZ", startsAt: at(ymdAdd(T, -1), "16:00"), durationMin: 40, location: "Onlayn (platforma)", description: "40 ta savol · IELTS Listening formatida", createdById: alisher, createdAt: at(ymdAdd(T, -3), "12:00") });
  for (const s of members("GR-03")) {
    if (s.id !== ali.id && !rng.chance(0.85)) continue;
    const correct = s.id === ali.id ? 32 : Math.max(18, Math.min(38, Math.round(22 + (s.mean - 3.5) * 9 + rng.int(-3, 3))));
    const band = correct >= 35 ? 7.5 : correct >= 32 ? 6.0 + (correct - 32) * 0.5 : correct >= 26 ? 5.5 + Math.floor((correct - 26) / 3) * 0.5 : 5.0;
    results.push({ examId: lpt, studentId: s.id, percent: Math.round((correct * 100) / 40), listening: s.id === ali.id ? 6.0 : Math.min(7.5, band), comment: `${correct}/40 toʻgʻri`, createdAt: happened(clock, at(ymdAdd(T, -1), "16:40", rng.int(0, s.id === ali.id ? 0 : 1500))) });
  }
  // GR-18: Full Listening Mock Test 4
  const flm = await exam({ groupId: gid("GR-18"), title: "Full Listening Mock Test 4 (Cambridge 18, Test 2)", type: "MOCK", startsAt: at(ymdAdd(T, -1), "20:00"), durationMin: 40, location: "Onlayn (platforma)", description: "40 ta savol", createdById: alisher, createdAt: at(ymdAdd(T, -4), "12:00") });
  for (const s of members("GR-18")) {
    const isSh = s.key === "shahnoza";
    const b = isSh ? 7.5 : Math.max(5.5, Math.min(8.5, half(6.8 + (s.mean - 4.2) + (rng.next() - 0.5))));
    results.push({ examId: flm, studentId: s.id, listening: b, band: b, comment: isSh ? "Band 7.5" : null, createdAt: happened(clock, at(ymdAdd(T, -1), isSh ? "22:15" : "21:00", isSh ? 0 : rng.int(0, 3000))) });
  }
  // GR-12: Advanced Mock #3 (to'liq)
  const am3 = await exam({ groupId: gid("GR-12"), title: "Advanced Mock #3 (Full IELTS)", type: "MOCK", startsAt: at(ymdAdd(nextSat, -14), "09:00"), durationMin: 195, location: "302-xona", description: "Listening, Reading, Writing + Speaking", createdById: m.staff.get("shahzodbek")!.id, createdAt: at(ymdAdd(nextSat, -24), "10:00") });
  for (const s of members("GR-12")) {
    const v = () => Math.max(5, Math.min(8, half(6.5 + (s.mean - 4.2) * 0.9 + (rng.next() - 0.5))));
    const [l, r, w, sp] = [v(), v(), v(), v()];
    results.push({ examId: am3, studentId: s.id, listening: l, reading: r, writing: w, speaking: sp, band: half((l + r + w + sp) / 4), createdAt: at(ymdAdd(nextSat, -12), "16:00") });
  }
  // kelajakdagi imtihonlar
  const gr03 = lessons.get("GR-03")!;
  const l33 = gr03.find((l) => l.n === 33)!;
  await exam({ groupId: gid("GR-03"), title: "Unit 6 — Midterm Progress Check & Mini Mock Exam", type: "MIDTERM", startsAt: l33.startsAt, durationMin: 90, location: "204-xona", description: "1–5 unitlar boʻyicha oraliq nazorat + Speaking interview", createdById: alisher, createdAt: at(ymdAdd(T, -5), "12:00") });
  let finalYmd = ymdAdd(T, 49);
  while (new Date(`${finalYmd}T00:00:00Z`).getUTCDay() !== 1) finalYmd = ymdAdd(finalYmd, 1);
  await exam({ groupId: gid("GR-03"), title: "Level 2 yakuniy imtihoni", type: "FINAL", startsAt: at(finalYmd, "14:00"), durationMin: 180, location: "204-xona", description: "Level 2 · IELTS Foundation yakuniy imtihoni (LRWS). Natija Level 3 ga oʻtish uchun asos.", createdById: m.staff.get("nigora")!.id, createdAt: at(ymdAdd(T, -30), "10:00") });
  await exam({ groupId: gid("GR-18"), title: "IELTS Band 7.0+ — Full Mock #5", type: "MOCK", startsAt: at(ymdAdd(nextSat, 14), "09:00"), durationMin: 210, location: "Katta zal", description: "Toʻliq IELTS Mock (LRW) + Speaking ertasi kuni", createdById: alisher, createdAt: at(ymdAdd(T, -2), "10:00") });
  await insertMany(db.examResult, results);
  void att;
  return results.length;
}

// ───────────────────────────── Bildirishnomalar va hisobotlar ─────────────────────────────

export async function writeNotifications(db: Db, m: Model, lessons: Map<string, LessonRec[]>, hw: { hws: HwRec[]; subs: SubRec[] }) {
  const { clock } = m;
  const T = clock.T;
  const H = (ymd: string, hhmm: string) => happened(clock, at(ymd, hhmm));
  const tg = new Set(m.parents.filter((p) => p.telegram).map((p) => p.id));
  for (const s of m.staff.values()) if (s.telegram) tg.add(s.id);
  const lessonT = lessons.get("GR-03")!.find((l) => l.ymd === T)!;
  const started = lessonT.status !== "PLANNED";
  const rows: Prisma.NotificationCreateManyInput[] = [];
  const add = (userId: string, type: string, title: string, body: string, when: Date, o: { link?: string; read?: boolean; payload?: Prisma.InputJsonValue } = {}) => {
    const has = tg.has(userId);
    rows.push({
      id: cid(), userId, type, title, body, link: o.link ?? null, payload: o.payload, telegram: true, status: has ? "SENT" : "SKIPPED", attempts: has ? 1 : 0,
      sentAt: has ? addMin(when, 0.2) : null, readAt: o.read ? addMin(when, 7) > clock.now ? null : addMin(when, 7) : null, createdAt: when,
    });
  };
  const S = (k: string) => m.staff.get(k)!.id;
  const rustam = m.parentByKey.get("rustam")!.id;
  const ali = m.byKey.get("ali")!.id;
  const L1 = m.L(1);
  // Rustam Valiyev
  add(rustam, "payment.paid", "Toʻlov qabul qilindi", `Ali Valiyev · ${monthLabel(T.slice(0, 7))} · 850 000 soʻm (Payme)`, H(`${T.slice(0, 7)}-${String(Math.min(10, Number(T.slice(8)))).padStart(2, "0")}`, "11:33"), { link: "/ota-ona/tolovlar", read: true });
  add(rustam, "report.daily", "Kunlik hisobot: Ali Valiyev", `${dm(L1)}: darsga keldi (13:52), darsdagi baho 5 (Aʼlo). Uyga vazifa: «Unit 4 — Family words», muddat ${dm(T)}, 20:00.`, at(L1, "17:30"), { link: "/ota-ona", read: true });
  add(rustam, "message.new", "Alisher Qosimovdan yangi xabar", "Ali bilan Unit 4 soʻzlarini kechqurun 10 daqiqa takrorlang…", H(ymdAdd(T, -1), "20:05"), { link: "/ota-ona/aloqa", read: true });
  add(rustam, "homework.due", "Uyga vazifa eslatmasi", "Ali Valiyev: «Unit 4 — Family words» bugun 20:00 gacha topshirilishi kerak.", H(T, "12:00"), { link: "/ota-ona/vazifalar" });
  if (started) add(rustam, "attendance.present", "Ali darsga keldi", "Ali Valiyev bugun 13:55 da 204-xonaga keldi (turniket orqali qayd etildi).", at(T, "13:55"), { link: "/ota-ona/darslar", read: true });
  add(rustam, "grade.new", "Yangi baho: 5 (Aʼlo)", "Unit 3 — Daily Routines speaking vazifasi Alisher Qosimov tomonidan qayta tekshirildi (4 → 5).", H(T, "16:32"), { link: "/ota-ona/baholar" });
  // Ali
  add(ali, "homework.due", "Bugun 20:00 gacha", "Unit 4 — Family words: lugʻat va speaking audio. Qoralama saqlangan — topshirishni unutmang!", H(T, "08:00"), { link: "/oquvchi/vazifalar", read: true });
  if (started) add(ali, "coins.awarded", "+5 tanga", "Darsga keldingiz (204-xona) — oʻz vaqtida.", at(T, "13:55"), { link: "/oquvchi/yutuqlar" });
  add(ali, "homework.reviewed", "Vazifa tekshirildi: 5 (Aʼlo)", "Unit 3 — Daily Routines: «Ajoyib intilish, barakalla Ali!»", H(T, "16:32"), { link: "/oquvchi/vazifalar" });
  // Alisher
  add(S("alisher"), "exam.assigned", "Shanbalik Mock imtihoni", `Siz ${dm(nextWeekday(T, 6))} kuni 09:00 dagi Markaz Mock imtihoniga nazoratchi sifatida biriktirildingiz (Katta zal, 54 nomzod).`, at(ymdAdd(T, -3), "10:00"), { link: "/ustoz/mock", read: true });
  add(S("alisher"), "homework.submitted", "Yangi topshiriq: Bekzod Karimov", "Unit 4 — Family words (audio, 1:45)", H(T, "10:12"), { link: "/ustoz/vazifalar", read: true });
  add(S("alisher"), "homework.submitted", "Yangi topshiriq: Madina Rahmatova", "Writing Task 2 Essay — «Technology and education equality» (312 soʻz)", H(T, "11:45"), { link: "/ustoz/vazifalar" });
  add(S("alisher"), "message.new", "Ali Valiyevdan yangi xabar", "Alisher aka, Unit 4 audio yozuvimni yukladim…", H(T, "11:20"), { link: "/ustoz/xabarlar" });
  add(S("alisher"), "message.new", "Dilshod Temirovdan yangi xabar", "Assalomu alaykum ustoz, Jasurning faolligi qanday?", H(ymdAdd(T, -1), "20:15"), { link: "/ustoz/xabarlar" });
  // Sanjar
  add(S("sanjar"), "payment.due", "12 ta toʻlov kutilmoqda", `Jami 10 200 000 soʻm · muddat: ${dm(ymdAdd(T, 1))}.`, H(T, "09:00"), { link: "/admin/tolovlar", read: true });
  add(S("sanjar"), "payment.overdue", "2 ta toʻlov muddati oʻtgan", "Jami qarz: 1 600 000 soʻm (Jasur Umidov va yana 1 oʻquvchi). Eslatma yuborish tavsiya etiladi.", H(T, "09:01"), { link: "/admin/tolovlar" });
  add(S("sanjar"), "homework.review_overdue", "5 ta vazifa tekshirilmagan", "IELTS Intermediate #1 · Writing Task 1 — 3 kun kechikmoqda.", H(T, "09:02"), { link: "/admin" });
  add(S("sanjar"), "group.no_teacher", "IELTS Foundation #5 guruhiga ustoz biriktirilmagan", `14 nafar oʻquvchi kutmoqda. Darslar ${dm(nextWeekday(T, 1))} kuni 18:00 da boshlanadi (204-xona).`, H(T, "15:46"), { link: "/admin/guruhlar" });
  // boshqalar
  add(m.parentByKey.get("jahongir")!.id, "payment.due", "Toʻlov eslatmasi", `Bekzod Karimov · 850 000 soʻm · muddat ${dm(ymdAdd(T, 1))}.`, H(T, "09:05"), { link: "/ota-ona/tolovlar" });
  add(m.parentByKey.get("dilnoza")!.id, "payment.overdue", "Toʻlov muddati oʻtgan", "Jasur Umidov · 750 000 soʻm · 4 kun kechikkan.", H(T, "09:06"), { link: "/ota-ona/tolovlar" });
  add(S("nigora"), "topic.draft", "Qoralama mavzular", "Level 3 · Unit 14 va Level 6 · Unit 5–6 hali tasdiqlanmagan.", at(ymdAdd(T, -1), "10:00"), { link: "/admin/mavzular", read: true });
  add(S("nodira"), "payment.due", "Bugungi kassa", `${som(10_200_000)} soʻm kutilmoqda (12 ta).`, H(T, "08:35"), { link: "/admin/tolovlar", read: true });
  await insertMany(db.notification, rows);
  void hw;
  return rows.length;
}

export async function writeReports(db: Db, m: Model, clock: Clock) {
  const T = clock.T;
  const ali = m.byKey.get("ali")!.id;
  const prevMonth = new Date(Date.UTC(Number(T.slice(0, 4)), Number(T.slice(5, 7)) - 2, 1)).toISOString().slice(0, 7);
  await db.report.createMany({
    data: [
      { type: "DAILY_PARENT", period: m.L(1), studentId: ali, payload: { student: "Ali Valiyev", lesson: "Unit 4 — My Family & Relationships (1-qism)", attendance: { status: "PRESENT", arrivedAt: "13:52" }, grades: [{ title: "Unit 4 — darsdagi faollik", value: 5 }], homework: { title: "Unit 4 — Family words", due: `${T} 20:00` } }, createdAt: at(m.L(1), "17:30") },
      { type: "DAILY_PARENT", period: ymdAdd(T, -1), studentId: ali, payload: { student: "Ali Valiyev", lesson: null, exam: { title: "Listening Practice Test #4", percent: 80, listening: 6.0 }, coins: { today: 12 } }, createdAt: at(ymdAdd(T, -1), "17:30") },
      { type: "MONTHLY_ADMIN", period: prevMonth, studentId: null, payload: { students: { total: 114, active: 106 }, payments: { collected: 91_300_000 }, attendance: 91.1 }, createdAt: at(`${T.slice(0, 7)}-01`, "08:00") },
    ],
  });
}
