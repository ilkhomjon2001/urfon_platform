// Cambridge Prepare 2nd edition, Level 1 (A1) — URFON oʻquv markazi uchun darsma-dars rejalar.
// Manba: Student Book (SB), Workbook (WB) va Teacher Book (TB). Markaz kitobni litsenziya asosida sotib olgan.
// Sana: 2026-09-16.
//
// Format: dars 90 daqiqa, haftasiga 3 marta. Kitob ikki URFON darajasiga boʻlingan:
//   Teens 13–16 (tezroq): L1 = Starter + Unit 1–10 (Culture 1–3, Life Skills 1–2, Review 1–2), ~30 dars;
//                         L2 = Unit 11–20 (Culture 4–5, Life Skills 3–5, Review 3–5), ~30 dars.
//     Unitga 2 dars (Starter 2), Culture / Life Skills / Review — 1 darsdan,
//     mid-level test (Unit 5 va Unit 15 dan keyin) va end-of-level test (Unit 10 va Unit 20 dan keyin).
//   Kids 8–12 (sekinroq, daraja 3+ oy): K1 (L1 mazmuni) va K2 (L2 mazmuni), ~42–44 dars.
//     Unitga 3 dars (Starter 3), Culture 1, Life Skills 1, Review 2 (takrorlash + oʻyinlar), testlar.
//     Kids darslarida koʻproq drilling, TPR, flashcard, qoʻshiq va oʻyinlar, phonics, SB 124–125 dagi
//     Extra activities; yozma ishlar qisqartiriladi yoki ustoz bilan birga bajariladi; har dars takrordan boshlanadi.
// Platforma "unit"i = kitob uniti; Culture / Life Skills / Review / testlar oʻzidan oldingi unitga qoʻshilgan.
//
// Mualliflik huquqi: kitobdan faqat sahifa raqamlari, boʻlim nomlari, mashq va audio raqamlari hamda
// video nomlariga havola qilinadi; mashqlar oʻz soʻzlarimiz bilan qisqa bayon qilingan. Oʻqish matnlari,
// dialoglar, audioskriptlar va javoblar koʻchirilmagan. Unit boʻyicha lugʻat roʻyxati 12 soʻzdan oshmaydi.

export type PlanLesson = {
  focus: string; // darsning qisqa nomi (oʻzbekcha)
  sb: string; // SB sahifalari yoki testlar uchun "—"
  steps: string[]; // 3–6 qadam, dars tartibida
  homework: string; // uyga vazifa
};

export type PlanUnit = {
  unit: number; // 0..20 (kitob uniti)
  title: string;
  description: string;
  objectives: string[];
  vocabulary: string[];
  grammar: string;
  teen: PlanLesson[];
  kids: PlanLesson[];
};

const L = (focus: string, sb: string, steps: string[], homework: string): PlanLesson => ({ focus, sb, steps, homework });

const testLesson = (focus: string, scope: string, kids: boolean, homework: string): PlanLesson =>
  L(
    focus,
    "—",
    kids
      ? [
          "Warm-up: flashcard va qoʻshiq bilan qisqa takror (10 daqiqa), testdagi topshiriq turlarini namuna bilan koʻrsatish",
          `Yozma qism: ${scope} lugʻati va grammatikasi — rasmli moslash, boʻyash, toʻgʻri soʻzni tanlash`,
          "Listening va Reading: qisqa audio va rasmli matn boʻyicha yes / no va moslash topshiriqlari",
          "Speaking: ustoz bilan yakkama-yakka qisqa suhbat (oʻzi, oilasi, buyumlari haqida savollar)",
          "Yakun: natijalarni oʻyin shaklida tahlil qilish, har bir oʻquvchiga yulduzcha va maslahat",
        ]
      : [
          "Warm-up: 5 daqiqalik ogʻzaki takror va test tuzilishini tushuntirish",
          `Yozma qism: ${scope} boʻyicha Vocabulary va Grammar topshiriqlari (markaz testi)`,
          "Listening va Reading qismlari: kitobdagi Review topshiriqlari formatida",
          "Writing: qisqa matn (40–60 soʻz) va Speaking: juftlikda savol-javob, ustoz baholaydi",
          "Yakun: umumiy xatolarni tahlil qilish va shaxsiy takrorlash rejasini berish",
        ],
    homework,
  );

export const PREPARE1: { book: string; units: PlanUnit[] } = {
  book: "Cambridge Prepare 2e, Level 1 (A1)",
  units: [
    {
      unit: 0,
      title: "Starter · In the classroom",
      description: "Alifbo, 1–20 sonlar, hafta kunlari, sinf buyumlari, ranglar va oylar bilan tanishuv darslari.",
      objectives: [
        "Ismini harflab ayta oladi, yoshini va ismini soʻray oladi",
        "Sinf buyumlari va ranglarini a / an hamda this, that, these, those bilan ayta oladi",
        "Hafta kunlari va oylarni tartib bilan aytib, tugʻilgan kunini soʻray oladi",
      ],
      vocabulary: ["alphabet", "numbers 1–20", "Monday … Sunday", "January … December", "board", "desk", "pencil case", "ruler", "rubber", "black", "yellow", "orange"],
      grammar: "a / an; this, that, these, those",
      teen: [
        L("Alifbo, sonlar va kunlar", "10–11", [
          "Warm-up: tanishuv, kitob tuzilishini koʻrsatish (Welcome to Prepare, SB 8–9)",
          "Vocabulary: The alphabet — 1–3-mashqlar (audio 01–03), ismlarni juftlikda harflab aytish",
          "Vocabulary: Numbers — 4–7-mashqlar (audio 04–05), oxirida sonlar bilan Bingo",
          "Vocabulary: Days — 8-mashq (audio 06), kunlarni kalendarga tartib bilan yozish",
          "Speaking — 1-mashq: What / How savollarini tuzib, sinf boʻylab yurib soʻrash",
        ], "WB 4–5: 1–6-mashqlar (alifbo, sonlar, kunlar)"),
        L("Sinfxona, ranglar va oylar", "12–13", [
          "Warm-up: Spelling bee va 1–20 sonlar zanjiri",
          "Vocabulary: The classroom — 1-mashq (audio 07); Grammar: a / an — 1-mashq",
          "Vocabulary: Colours — 1–3-mashqlar (audio 08), soʻzni emas, rangni ayt oʻyini",
          "Grammar: this, that, these, those — 1–3-mashqlar, sinfdagi buyumlar haqida savol-javob (Grammar reference SB 136)",
          "Vocabulary: Months — 1–3-mashqlar (audio 09–10), When is your birthday? soʻrovnomasi va sinf jadvali",
        ], "WB 6–7: 7–8-mashqlar, Grammar 1–3, Months 1, Listening 1, Writing 1"),
      ],
      kids: [
        L("Alifbo va sonlar (qoʻshiq va oʻyinlar)", "10–11", [
          "Warm-up: tanishuv oʻyini — toʻp otib, ism aytish",
          "Vocabulary: The alphabet — 1–3-mashqlar (audio 01–03), alifbo qoʻshigʻi, harflarni havoda yozish (TPR)",
          "Phonics: unli harflar A, E, I, O, U; har kim oʻz ismini harflab aytadi",
          "Vocabulary: Numbers — 4–6-mashqlar (audio 04–05), shamlarni sanash",
          "Oʻyin: 7-mashq — sonlar bilan Bingo",
        ], "WB 4: 1–3-mashqlar (alifbo va sonlar)"),
        L("Hafta kunlari va sinf buyumlari", "11–12", [
          "Warm-up: 1–20 sonlarni sanash zanjiri va alifbo qoʻshigʻi",
          "Vocabulary: Days — 8-mashq (audio 06), kunlar qoʻshigʻi, kartochkalarni tartib bilan terish",
          "Speaking — 1-mashq: What is your name? / How old are you? savollari bilan sinf boʻylab yurish",
          "Vocabulary: The classroom — 1-mashq (audio 07), flashcardlar va Touch the … (TPR) oʻyini",
          "Grammar: a / an — 1-mashq, buyumlarni koʻrsatib a / an bilan aytish",
        ], "WB 5–6: 4–7-mashqlar (kunlar va sinf buyumlari)"),
        L("Ranglar, this / that va oylar", "12–13", [
          "Warm-up: sehrli xalta — xaltadagi sinf buyumini ushlab topish",
          "Vocabulary: Colours — 1–3-mashqlar (audio 08), soʻzni emas, rangni ayt oʻyini",
          "Grammar: this, that, these, those — 1–3-mashqlar, yaqin va uzoqdagi buyumlarni koʻrsatib (TPR)",
          "Vocabulary: Months — 1–2-mashqlar (audio 09–10), oylar qoʻshigʻi",
          "Tugʻilgan kunlar qatori: oʻquvchilar oylar boʻyicha saf tortadi, 3-mashqdagi jadvalni birga toʻldirish",
        ], "WB 6–7: 8-mashq (ranglar), Grammar 1–3 (boʻyash), Months 1"),
      ],
    },
    {
      unit: 1,
      title: "Unit 1 · All about me",
      description: "Oʻzi haqida gapirish: ism, yosh, telefon raqami, shaxsiy buyumlar, mamlakat va millatlar.",
      objectives: [
        "Oʻzini va doʻstini qisqa gaplar bilan tanishtira oladi",
        "my, your, his, her va am / is / are shakllarini toʻgʻri qoʻllaydi",
        "Qayerdan ekanini va millatini aytib, boshqalardan soʻray oladi",
      ],
      vocabulary: ["bag", "camera", "chair", "phone", "photo", "watch", "student", "friend", "Italy / Italian", "Turkey / Turkish", "Brazil / Brazilian", "China / Chinese"],
      grammar: "Determiners (my, your, his, her); be singular (+); be plural (+); be singular and plural (−)",
      teen: [
        L("Lugʻat, tinglash va be (birlik)", "14–15", [
          "Warm-up: About you savollari (What is your name? Where are you from?) juftlikda",
          "Vocabulary: Objects and people — 1-mashq (audio 11)",
          "Listening — 2–3-mashqlar (audio 12); 4–5-mashqlar (audio 13): tanishuv dialogini uch kishilik guruhda oʻz ismlari bilan mashq qilish",
          "Grammar: Determiners — 1–2-mashqlar; be singular (+) — 3–4-mashqlar (Grammar reference SB 137)",
          "Speaking — 5–7-mashqlar: telefon raqamini soʻrash, oʻz rasmini yasab tanishtirish, guruh oʻyini",
        ], "WB 8–9: Vocabulary 1–2, Listening 3–5, Grammar 1–4"),
        L("Mamlakatlar, millatlar va be (+ / −)", "16–17", [
          "Warm-up: Hot seat — bir oʻquvchi oʻzi haqida gapiradi, sinf savol beradi",
          "Vocabulary va Reading: Countries and nationalities — 1–3-mashqlar (audio 14–15), jadval va bayroqlar",
          "Pronunciation: from — 4-mashq (audio 16); 5-mashq: chantni tinglab toʻldirish (audio 17)",
          "Grammar: be plural (+), be singular and plural (−) — 1–3-mashqlar, chantni guruhda aytish",
          "Talking points va Speaking: All about me — 1-mashq, doʻstiga oʻzini tanishtirish",
        ], "WB 10–11: Vocabulary 1–3, Reading 4–5, Grammar 1–3, Writing 1–2 (oʻzi haqida matn)"),
      ],
      kids: [
        L("Lugʻat va tanishuv dialogi", "14", [
          "Warm-up: Starter takrori — harflab aytish va sonlar bilan Bingo",
          "Vocabulary: Objects and people — 1-mashq (audio 11), flashcardlar va What is missing? oʻyini",
          "Listening — 2–3-mashqlar (audio 12), rasmdagi qahramonlarni barmoq bilan koʻrsatish",
          "4–5-mashqlar (audio 13): salomlashish va xayrlashish dialogini niqoblar bilan rolda oʻynash",
        ], "WB 8: Vocabulary 1–2 (rasmli soʻzlar)"),
        L("Grammatika: my, your, his, her va am / is / are", "15", [
          "Warm-up: sinfdagi buyumlarni koʻrsatib This is my … zanjiri",
          "Grammar: Determiners — 1–2-mashqlar, oʻquvchilarning haqiqiy sumkalari bilan his / her mashqi",
          "Grammar: be singular (+) — 3–4-mashqlar, toʻliq va qisqa shakllarni kartochkalar bilan juftlash",
          "Speaking — 5-mashq: telefon raqamini soʻrash (oʻylab topilgan raqamlar bilan)",
          "6–7-mashqlar: oʻz rasmini chizib, guruhda tanishtirish oʻyini",
        ], "WB 9: Grammar 1–3"),
        L("Mamlakatlar va millatlar (chant bilan)", "16–17", [
          "Warm-up: dunyo xaritasida mamlakatlarni topish",
          "Reading: Countries and nationalities — 1–3-mashqlar (audio 14–15), bayroqlarni moslash",
          "Pronunciation: from — 4-mashq (audio 16); chant — 5-mashq (audio 17), qarsak bilan ritmda aytish",
          "Grammar: be plural va inkor shakl — 1–3-mashqlar, chantni guruhlarda ijro etish",
          "Speaking: All about me — 1-mashq; oʻzi haqida 3 ta gapni ustoz bilan doskada yozish",
        ], "WB 10: Vocabulary 1–3 (millatlar) va oʻzi haqida 3 ta gap"),
      ],
    },
    {
      unit: 2,
      title: "Unit 2 · My family + Culture: The United Kingdom",
      description: "Oila aʼzolari, his-tuygʻu sifatlari va Birlashgan Qirollik mamlakatlari haqida.",
      objectives: [
        "Oila aʼzolarini tanishtirib, Possessive s bilan qarindoshlikni ayta oladi",
        "His-tuygʻusini aytib, be savollari va qisqa javoblarni qoʻllay oladi",
        "Birlashgan Qirollikning toʻrt mamlakati, millati va poytaxtlarini ayta oladi",
      ],
      vocabulary: ["mum and dad", "brother and sister", "parents", "daughter", "son", "husband and wife", "children", "baby", "bored", "hungry", "tired", "funny"],
      grammar: "Possessive s; Determiners (our, their); be questions and short answers",
      teen: [
        L("Oila: oʻqish, lugʻat va Possessive s", "18–19", [
          "Warm-up: About you — Where is your family from? How old are the people in your family?",
          "Reading: Families — 1–2-mashqlar (audio 18); Vocabulary — 3-mashq (audio 19)",
          "Pronunciation: and — 4-mashq (audio 20)",
          "Grammar: Possessive s — 3–5-mashqlar; Determiners (our, their) — 1–2-mashqlar (Grammar reference SB 138)",
          "Talking points: video 01 (Me and you) va juftlikda savol-javob",
        ], "WB 12–13: oila soʻzlari, Reading va Grammar (Possessive s, our / their)"),
        L("His-tuygʻular, tinglash va be savollari", "20–21", [
          "Warm-up: oila rasmiga 2 daqiqa qarab, kitobni yopib eslash (19-bet, 5-mashq)",
          "Vocabulary: Adjectives: feelings — 1–2-mashqlar (audio 21), mimika oʻyini",
          "Listening — 3–4-mashqlar (audio 22), rasmli hikoyani tartiblash",
          "Grammar: be questions and short answers — 1–4-mashqlar; 5-mashq: Extra activities (SB 124) juftlikda",
          "Writing: 6–7-mashqlar va Writing 1 — oila aʼzosi uchun web sahifa (katta harf va nuqta qoidasi)",
        ], "WB 14–15: sifatlar, Listening, Grammar va Writing"),
        L("Culture: The United Kingdom", "22–23 (Culture)", [
          "Warm-up: 1-mashq — juftlikda muhokama; 2-mashq: xarita va rasmlar boʻyicha taxmin",
          "Reading — 3–4-mashqlar (audio 23) va Factfile",
          "Vocabulary — 5–7-mashqlar (audio 24–25): mamlakat, millat va poytaxtlar",
          "Listening — 8–9-mashqlar (audio 26); Talking points va Interesting fact (funt va pens)",
          "Culture video 02 va Project: guruhda Oʻzbekiston haqida poster rejasini tuzish",
        ], "Project: Oʻzbekiston yoki boshqa mamlakat haqida poster (xarita, shaharlar, ramzlar, sport, pul)"),
      ],
      kids: [
        L("Oila soʻzlari va oʻqish", "18", [
          "Warm-up: millatlar chantini takrorlash",
          "Vocabulary: oila soʻzlari flashcardlar bilan; Reading — 1–2-mashqlar (audio 18)",
          "3-mashq (audio 19): soʻzlarni takrorlash, Finger family qoʻshigʻi",
          "Pronunciation: and — 4-mashq (audio 20), juft soʻzlarni qarsak bilan aytish",
          "About you: oila rasmini chizib, 3 kishini tanishtirish",
        ], "WB 12: 1–2-mashqlar (oila soʻzlari)"),
        L("Possessive s, our / their", "19", [
          "Warm-up: oila rasmi bilan Who is this? oʻyini",
          "Grammar: Possessive s — 3–4-mashqlar; bu kimning? oʻyini — buyumlar egasini Possessive s bilan aytish",
          "5-mashq: rasmga 2 daqiqa qarab, kitobni yopib eslash (Memory oʻyini)",
          "Grammar: Determiners our / their — 1–2-mashqlar",
          "Talking points: video 01 va ustoz bilan birga savol-javob",
        ], "WB 13: Grammar — 2 ta mashq (Possessive s va our / their)"),
        L("His-tuygʻular va be savollari", "20–21", [
          "Warm-up: How are you today? — his-tuygʻu kartochkalari",
          "Vocabulary: Adjectives: feelings — 1-mashq (audio 21); 2-mashq: mimika oʻyini (Charades)",
          "Listening — 3–4-mashqlar (audio 22)",
          "Grammar: be questions and short answers — 1–3-mashqlar, Are you hungry? – Yes, I am. zanjir oʻyini",
          "Writing: 6-mashqdagi web sahifani ustoz bilan birga toʻldirish (qisqartirilgan)",
        ], "WB 14: 1–2-mashqlar (sifatlar) va oʻz web sahifasiga rasm chizish"),
        L("Culture: The United Kingdom", "22–23 (Culture)", [
          "Warm-up: xaritada Birlashgan Qirollikni topish, 1-mashq savollari",
          "Reading — 2–4-mashqlar (audio 23): toʻrt bola qayerdan ekanini topish",
          "Vocabulary — 5–7-mashqlar (audio 24–25), millat va poytaxtlarni kartochkalar bilan moslash",
          "Culture video 02 va Listening — 8-mashq (audio 26)",
          "Project: kichik guruhda Oʻzbekiston haqida rasmli poster",
        ], "Posterni oila bilan tugatish va 3 ta gap bilan tanishtirishga tayyorlanish"),
      ],
    },
    {
      unit: 3,
      title: "Unit 3 · My home",
      description: "Uy va xonalar hamda xonadagi buyumlarni there is / there are va have got bilan tasvirlash.",
      objectives: [
        "Uydagi xonalar va xonadagi buyumlarni nomlay oladi",
        "There is / There are va in / on bilan uyini tasvirlay oladi",
        "have got / has got bilan oʻzi va boshqalarning buyumlari haqida gapira oladi",
      ],
      vocabulary: ["bathroom", "bedroom", "dining room", "hall", "kitchen", "living room", "window", "wall", "bookcase", "board game", "clock", "poster"],
      grammar: "there is / there are; in / on; have got (+)",
      teen: [
        L("Xonalar, tinglash va there is / there are", "24–25", [
          "Warm-up: About you — Where do you live? Is your home big or small?",
          "Vocabulary: Rooms — 1–3-mashqlar (audio 27)",
          "Listening — 4-mashq (audio 28); 5-mashq: gap aytib, xonani topish oʻyini",
          "Grammar: there is / there are; in / on — 1–4-mashqlar (audio 29), Grammar reference SB 139",
          "Speaking va Writing — 5–6-mashqlar: uyi haqida 5 ta gap, sherigining uyi haqida yozish",
        ], "WB 16–17: Rooms, Listening va Grammar (there is / there are)"),
        L("Xonamdagi buyumlar va have got", "26–27", [
          "Warm-up: Draw and guess — ustoz xona chizadi, sinf buyumlarni aytadi",
          "Vocabulary: Things in my room — 1-mashq (audio 30); Reading — 2–3-mashqlar (audio 31)",
          "Pronunciation: Lists — 1-mashq (audio 32); Speaking — 2-mashq: kichik guruhlarda roʻyxat oʻyini",
          "Grammar: have got (+) — 1–3-mashqlar; also bilan 4–5-mashqlar (xonasini chizib yozish)",
          "Talking points: sevimli rang, oʻyin va buyum haqida juftlikda suhbat",
        ], "WB 18–19: Things in my room, Reading, Grammar (have got) va Writing"),
      ],
      kids: [
        L("Xonalar va tinglash", "24", [
          "Warm-up: oila soʻzlarini Memory oʻyini bilan takrorlash",
          "Vocabulary: Rooms — 1–3-mashqlar (audio 27); sinf burchaklari xona boʻladi, Run to the kitchen! (TPR)",
          "Listening — 4-mashq (audio 28), xonalarni tartib bilan raqamlash",
          "5-mashq: rangni aytib, xonani topish oʻyini juftlikda",
        ], "WB 16: xonalar soʻzlari (1–2 ta mashq)"),
        L("there is / there are; in / on", "25", [
          "Warm-up: Rooms flashcardlari bilan tezkor aytish",
          "Grammar: there is / there are — 1-mashq, sinfdagi buyumlarni sanab There are … gaplari",
          "2–3-mashqlar (audio 29): yes / no deb javob berish va takrorlash",
          "in / on: oʻyinchoq va quti bilan TPR (Put the pen on the book.)",
          "4-mashqni birga bajarish; 5-mashq: uyi haqida 3 ta gap aytish",
        ], "WB 17: there is / there are — 2 ta mashq"),
        L("Xonamdagi buyumlar va have got", "26–27", [
          "Warm-up: sehrli xalta — buyumni ushlab There is a … deyish",
          "Vocabulary: Things in my room — 1-mashq (audio 30), Memory tray oʻyini",
          "Reading — 2-mashq (audio 31) va 3-mashqni birga bajarish",
          "Pronunciation: Lists — 1-mashq (audio 32); 2-mashq: roʻyxat zanjiri oʻyini",
          "Grammar: have got (+) — 1–3-mashqlar; 5-mashq: xonasini chizib, 2–3 ta gap yozish",
        ], "WB 18: Things in my room va xona rasmi ostiga 3 ta gap"),
      ],
    },
    {
      unit: 4,
      title: "Unit 4 · My things + Life Skills: Being creative and being you + Review 1",
      description: "Maktab sumkasidagi buyumlar, ularni tasvirlovchi sifatlar, have got inkor va savol shakllari; Life Skills va Review 1 (Unit 1–4).",
      objectives: [
        "have got / has got inkor shakli bilan sumkasida nima yoʻqligini ayta oladi",
        "Buyumlarni rang va sifatlar bilan tasvirlay oladi (a clean, light blue bag)",
        "Have you got …? savollari bilan soʻrovnoma oʻtkazib, natijani yoza oladi",
      ],
      vocabulary: ["coat", "gloves", "hat", "keys", "scarf", "wallet", "water bottle", "clean / dirty", "light / dark", "long / short", "new / old"],
      grammar: "have got (−); have got questions and short answers",
      teen: [
        L("Sumkamdagi buyumlar va have got (−)", "28–29", [
          "Warm-up: About you — xonadagi buyumlar haqida 1 daqiqa gapirish",
          "Vocabulary: Things in my school bag — 1-mashq (audio 33); Reading — 2–3-mashqlar (audio 34), bloglarni sumkalarga moslash",
          "Pronunciation: Syllables — 4-mashq (audio 35–36), boʻgʻinlarni qarsak bilan sanash",
          "Grammar: have got (−) — 1–3-mashqlar (audio 37), Grammar reference SB 140",
          "4-mashq: 1 daqiqada roʻyxat tuzish, juftlik va guruhda solishtirish",
        ], "WB 20–21: sumka buyumlari, Reading va Grammar (have got −)"),
        L("Sifatlar, tinglash va have got savollari", "30–31", [
          "Warm-up: sinfdagi 3 ta buyumni rang va sifat bilan tasvirlash",
          "Vocabulary: Adjectives: things — 1–5-mashqlar (audio 38)",
          "Listening — 6–7-mashqlar (audio 39): Emmada nima yoʻqligini topish",
          "Grammar: have got questions — 1–3-mashqlar (audio 40); Talking points: video 03 (Things in your bag)",
          "Writing — 1-mashq: 6 ta Have you got …? savolidan soʻrovnoma, 4 kishidan soʻrab natijani yozish",
        ], "WB 22–23: Adjectives, Listening, Grammar va Writing (soʻrovnoma)"),
        L("Life Skills: Being creative and being you", "32–33 (Life Skills)", [
          "Warm-up: 1-mashq — sevimli xona va rang haqida juftlikda muhokama",
          "Reading — 2–3-mashqlar (audio 41): rasmlarga qarab taxmin, intervyuni oʻqib tekshirish",
          "4–6-mashqlar: notoʻgʻri soʻzni tuzatish, yangi soʻzlar (sofa, rug, shelf, light, fishbowl) va oʻz mehmonxonasi haqida gaplar",
          "Listening — 7–8-mashqlar (audio 42); Useful language — 9–10-mashqlar (looks like, cool)",
          "Project: yangi yotoqxona rejasini chizib, sherigiga tanishtirish",
        ], "Project: yangi xona rejasini tugatish va 5–6 gap bilan tasvirlash"),
        L("Review 1 (Unit 1–4)", "34–35 (Review 1)", [
          "Warm-up: Unit 1–4 soʻzlari boʻyicha jamoaviy tezkor viktorina",
          "Vocabulary — 1–3-mashqlar; Grammar — 1–2-mashqlar",
          "Listening — 1-mashq: ikki oʻquvchi haqidagi maʼlumotlarni toʻldirish; Reading — 1-mashq (right / wrong)",
          "Speaking — 1-mashq: Have you got …? ochko oʻyini",
          "Writing — 1-mashq: gaplarni katta harf va nuqta bilan qayta yozish; umumiy xatolar tahlili",
        ], "Vocabulary list (SB 126–127): Unit 1–4 soʻzlari va Grammar reference (SB 137–140) mashqlari"),
      ],
      kids: [
        L("Sumkamdagi buyumlar", "28", [
          "Warm-up: xona rasmi boʻyicha have got gaplarini takrorlash",
          "Vocabulary: Things in my school bag — 1-mashq (audio 33), haqiqiy buyumlar bilan sehrli sumka oʻyini",
          "Reading — 2-mashq (audio 34): qaysi sumka kimniki?",
          "3-mashq: rasmga qarab juftlikda aytish va topish",
          "Chant: What is in your bag? ritmida buyumlarni sanash",
        ], "WB 20: sumka buyumlari (1–2 ta mashq)"),
        L("have got inkor shakli va boʻgʻinlar", "29", [
          "Warm-up: flashcardlar — buyumni koʻrsatib I have got … / I have not got …",
          "Pronunciation: Syllables — 4-mashq (audio 35–36), boʻgʻinlarni qarsak va sakrash bilan sanash",
          "Grammar: have got (−) — 1–2-mashqlar (audio 37), yes / no kartochkalari bilan",
          "3-mashqni birga bajarish; 4-mashq: 1 daqiqada roʻyxat tuzish musobaqasi",
        ], "WB 21: have got (−) — 2 ta mashq"),
        L("Sifatlar va Have you got …?", "30–31", [
          "Warm-up: big / small, clean / dirty kartochkalari bilan TPR",
          "Vocabulary: Adjectives: things — 1–4-mashqlar (audio 38), rasmdan buyumlarni topish",
          "Listening — 6–7-mashqlar (audio 39)",
          "Grammar: have got questions — 1–3-mashqlar (audio 40); video 03",
          "Speaking: Find someone who … soʻrovi (Writing 1-mashq ogʻzaki, 3 ta savol bilan)",
        ], "WB 22: sifatlar va 3 ta Have you got …? savoli"),
        L("Life Skills: Being creative and being you", "32–33 (Life Skills)", [
          "Warm-up: 1-mashq — sevimli rang va sevimli xona",
          "Reading — 2–3-mashqlar (audio 41), rasmlar orqali taxmin qilish",
          "5-mashq: sofa, rug, light, shelf, fishbowl flashcardlari; Listening — 7-mashq (audio 42)",
          "Useful language — 9-mashq: looks like … va It is cool.",
          "Project: orzudagi xonani chizib, 3 ta gap bilan tanishtirish",
        ], "Rasmni tugatib, oilaga inglizcha tanishtirish"),
        L("Review 1: lugʻat va grammatika oʻyinlari", "34 (Review 1)", [
          "Warm-up: Unit 1–4 flashcardlari bilan Board race",
          "Vocabulary — 1–3-mashqlar (3-mashq juftlikda savol-javob)",
          "Grammar — 1–2-mashqlar, ustoz bilan birga",
          "Oʻyin: O va X — har bir katak uchun bitta savol (be, have got, there is / there are)",
        ], "Unit 1–4 soʻzlaridan 10 tasini rasm bilan lugʻat daftariga yozish"),
        L("Review 1: koʻnikmalar va takrorlash oʻyinlari", "35 (Review 1)", [
          "Warm-up: Simon says (sinf buyumlari va ranglar)",
          "Listening — 1-mashq (ikki marta, pauzalar bilan)",
          "Reading — 1-mashq: Keira uyi haqida right / wrong, rasm bilan tekshirish",
          "Speaking — 1-mashq: sumkadagi 6 ta buyum boʻyicha ochko oʻyini",
          "Writing — 1-mashq: katta harf va nuqta bilan gaplar (avval birga, keyin mustaqil 2 ta)",
        ], "WB 8–23 dagi bajarilmagan mashqlardan ustoz tanlagan 2–3 tasini tugatish"),
      ],
    },
    {
      unit: 5,
      title: "Unit 5 · What can you do? + Mid-level test",
      description: "Qobiliyatlar va faoliyatlar, tana aʼzolari, can / cannot va joy predloglari; L1 / K1 oraliq testi.",
      objectives: [
        "can / cannot bilan nima qila olishi va qila olmasligini ayta oladi",
        "Tana aʼzolarini nomlaydi va buyumlar joyini in, on, behind, under bilan ayta oladi",
        "and, but, or bilan qobiliyatlari haqida gaplar tuza oladi",
      ],
      vocabulary: ["ride a horse", "swim underwater", "paint a picture", "play the guitar", "speak Italian", "cook spaghetti", "arm", "ear", "face", "foot / feet", "hand", "tooth / teeth"],
      grammar: "can / cannot (positive, negative, questions, short answers); Prepositions: in, on, behind, under",
      teen: [
        L("Qobiliyatlar, tinglash va can", "36–37", [
          "Warm-up: About you — sumkadagi 5 ta buyumni aytib, sherigi bilan solishtirish",
          "Vocabulary: Activities and skills — 1-mashq (audio 45); Listening — 2-mashq (audio 46)",
          "Grammar: can / cannot — 1–2-mashqlar (audio 46), Grammar reference SB 141",
          "Pronunciation: can / cannot — 3–4-mashqlar (audio 47–48)",
          "5–8-mashqlar: savollar tuzish, jadval boʻyicha sherigidan soʻrash, and / but / or bilan 6 ta gap yozish",
        ], "WB 24–25: Activities and skills, Listening va Grammar (can)"),
        L("Tana aʼzolari, oʻqish va predloglar", "38–39", [
          "Warm-up: Can you …? zanjiri — har bir oʻquvchi keyingisidan soʻraydi",
          "Vocabulary: Parts of the body — 1-mashq (audio 49); 2–3-mashqlar (audio 50): koʻrsatish oʻyini",
          "Reading: Rubberboy — 4-mashq (audio 51)",
          "Grammar: Prepositions: in, on, behind, under — 1–2-mashqlar (Grammar reference SB 142); Talking points: video 04 (What can you do?)",
          "Speaking — 1-mashq: qiziq harakatlar boʻyicha sinf boʻylab Can you …? soʻrovi",
        ], "WB 26–27: Parts of the body, Reading, Grammar (predloglar) va Writing"),
        testLesson("Mid-level test (L1)", "Starter–Unit 5", false, "Xatolar ustida ishlash: test tahlilida belgilangan 2–3 mavzu boʻyicha Grammar reference (SB 136–142) mashqlari"),
      ],
      kids: [
        L("Qobiliyatlar va tinglash", "36", [
          "Warm-up: sumka buyumlarini sehrli sumka oʻyini bilan takrorlash",
          "Vocabulary: Activities and skills — 1-mashq (audio 45), har bir faoliyatni harakat bilan koʻrsatish (TPR)",
          "Listening — 2-mashq (audio 46), yes / no kartochkalarini koʻtarish",
          "Charades: bir oʻquvchi harakatni koʻrsatadi, sinf topadi",
        ], "WB 24: faoliyat soʻzlari (1–2 ta mashq)"),
        L("can / cannot (oʻyinlar bilan)", "37", [
          "Warm-up: faoliyatlar flashcardlari bilan tezkor aytish",
          "Grammar: can / cannot — 1–2-mashqlar (audio 46), bosh barmoq yuqoriga / pastga bilan javob",
          "Pronunciation: can / cannot — 3–4-mashqlar (audio 47–48)",
          "6–7-mashqlar: jadvalni toʻldirib, sherigidan Can you …? deb soʻrash",
          "8-mashq: and / but bilan 2 ta gapni ustoz bilan birga yozish",
        ], "WB 25: can — 2 ta mashq"),
        L("Tana aʼzolari va predloglar", "38–39", [
          "Warm-up: Head, shoulders, knees and toes qoʻshigʻi",
          "Vocabulary: Parts of the body — 1-mashq (audio 49); 2–3-mashqlar (audio 50) va Simon says",
          "Reading: Rubberboy — 4-mashq (audio 51), savollarga birga javob berish",
          "Grammar: in, on, behind, under — 1–2-mashqlar; oʻyinchoqni sinfda yashirib Where is it? oʻyini; video 04",
          "Speaking — 1-mashq: qiziq harakatlar boʻyicha Can you …? soʻrovi",
        ], "WB 26: tana aʼzolari va rasmga 3 ta predlogli gap"),
        testLesson("Mid-level test (K1)", "Starter–Unit 5", true, "Test tahlilidan keyin ustoz belgilagan 10 ta soʻzni rasm bilan takrorlash"),
      ],
    },
    {
      unit: 6,
      title: "Unit 6 · Party time! + Culture: Holidays in the USA",
      description: "Oziq-ovqat va ichimliklar, sanaladigan va sanalmaydigan otlar, vaqtni aytish va ziyofatga taklifnoma; AQSh bayramlari.",
      objectives: [
        "Ovqat va ichimliklarni nomlab, some, any, lots of bilan gapira oladi",
        "Vaqtni aytib, on, at, from, until bilan ziyofat kuni, vaqti va joyini ayta oladi",
        "Ziyofatga taklifnoma yozib, taklifga javob bera oladi",
      ],
      vocabulary: ["biscuits", "bread", "butter", "cheese", "chicken", "eggs", "juice", "milk", "pasta", "rice", "soup", "tomatoes"],
      grammar: "Countable and uncountable nouns; some, any, lots of; Prepositions: on, at, from, until",
      teen: [
        L("Ovqat, tinglash va some / any / lots of", "40–41", [
          "Warm-up: About you — 2 daqiqada eng koʻp ovqat soʻzini yozish musobaqasi",
          "Vocabulary: Food and drinks — 1–3-mashqlar (audio 52): ustunlarga ajratish, yoqtirgan va yoqtirmagan ovqatlar",
          "Listening — 4-mashq (audio 53): sinf ziyofatiga kim nima olib keladi",
          "Grammar: Countable and uncountable nouns — 1–2-mashqlar; some, any, lots of — 3–4-mashqlar (Grammar reference SB 143)",
          "Pronunciation: some — 5-mashq (audio 54); 6–8-mashqlar: ziyofat rasmi, xarid roʻyxati va sinfga aytib berish",
        ], "WB 28–29: Food and drinks, Listening va Grammar (some, any, lots of)"),
        L("Vaqt, taklifnomalar va on / at / from / until", "42–43", [
          "Warm-up: What time is it? — ustoz soat maketida vaqt koʻrsatadi",
          "Reading: taklifnomalar — 1-mashq (audio 55); Listening — 2-mashq (audio 56)",
          "Vocabulary: Telling the time (1) — 3–4-mashqlar (audio 57–58)",
          "Grammar: Prepositions: on, at, from, until — 1–3-mashqlar; Extra activities (SB 124) dialoglarini kun, vaqt va joyni oʻzgartirib mashq qilish",
          "Writing — 1-mashq: oʻz ziyofatiga taklifnoma yozish; Talking points",
        ], "WB 30–31: Telling the time, Grammar (predloglar) va Writing (taklifnoma)"),
        L("Culture: Holidays in the USA", "44–45 (Culture)", [
          "Warm-up: 1-mashq (audio 59) — rasmlardagi soʻzlar; 2-mashq: juftlikda savollar",
          "Reading — 3–4-mashqlar (audio 60): kalendar va jadval bilan ishlash",
          "5–6-mashqlar: bayram taomlari soʻzlari va 3 ta gap",
          "Listening — 7–8-mashqlar (audio 61); Talking points; Culture video 05 (Fourth of July in the USA)",
          "Project: guruhda Oʻzbekistondagi bayram (masalan, Navroʻz) haqida web sahifa rejasini tuzish",
        ], "Project: bayram haqida web sahifa (qachon, nima uchun, nima qilinadi, qanday taomlar) — keyingi darsda taqdimot"),
      ],
      kids: [
        L("Ovqat va ichimliklar", "40", [
          "Warm-up: Can you …? oʻyini bilan Unit 5 takrori",
          "Vocabulary: Food and drinks — 1-mashq (audio 52), rasmli mahsulotlar bilan doʻkon oʻyini",
          "2-mashq: ovqatlarni ustunlarga ajratish (kartochkalarni doskaga yopishtirish)",
          "3-mashq: I like … / I do not like … — yuz ifodalari bilan",
          "Listening — 4-mashq (audio 53)",
        ], "WB 28: ovqat soʻzlari (1–2 ta mashq)"),
        L("some, any, lots of va xarid roʻyxati", "41", [
          "Warm-up: Food flashcardlari bilan What is missing?",
          "Grammar: Countable and uncountable nouns — 1–2-mashqlar, ikki savat oʻyini (sanaladigan / sanalmaydigan)",
          "Grammar: some, any, lots of — 3–4-mashqlar ustoz bilan birga",
          "Pronunciation: some — 5-mashq (audio 54)",
          "7–8-mashqlar: ziyofat uchun rasmli xarid roʻyxati va sinfga aytib berish",
        ], "WB 29: some / any — 2 ta mashq"),
        L("Vaqt va taklifnoma", "42–43", [
          "Warm-up: qogʻoz soat yasash va vaqtni koʻrsatish",
          "Reading: taklifnomalar — 1-mashq (audio 55); Listening — 2-mashq (audio 56)",
          "Telling the time (1) — 3–4-mashqlar (audio 57–58) va What is the time, Mr Wolf? oʻyini",
          "Grammar: on, at, from, until — 1–2-mashqlar, kun / vaqt / joy kartochkalarini saralash",
          "Writing — 1-mashq: taklifnomani shablon asosida birga toʻldirish",
        ], "WB 30: vaqt mashqlari va oʻz taklifnomasini bezash"),
        L("Culture: Holidays in the USA", "44–45 (Culture)", [
          "Warm-up: 1-mashq (audio 59) — bayroq, parad, mushakbozlik, barbekyu rasmlari",
          "Reading — 3-mashq (audio 60): kalendardan sanalarni topish",
          "5-mashq: bayram taomlari soʻzlarini harflardan yigʻish oʻyini",
          "Culture video 05 va Listening — 7-mashq (audio 61)",
          "Project: Navroʻz haqida rasmli plakat (sana, taomlar, nima qilamiz)",
        ], "Plakatga 3 ta inglizcha gap yozib kelish"),
      ],
    },
    {
      unit: 7,
      title: "Unit 7 · My day",
      description: "Kundalik ishlar, vaqtni aytish (half past, quarter to) va Present simple ning tasdiq va inkor shakllari.",
      objectives: [
        "Kundalik ishlarini tartib bilan aytib bera oladi",
        "Vaqtni half past, quarter past, quarter to bilan ayta oladi",
        "Present simple ning tasdiq va inkor shakllari bilan oʻzi va boshqalarning kuni haqida gapira oladi",
      ],
      vocabulary: ["get up", "get dressed", "have a shower", "have breakfast", "catch the bus to school", "walk to school", "have lunch", "have dinner", "go to bed", "half past", "quarter past", "quarter to"],
      grammar: "Present simple (+) and -s / -es endings; Present simple (−) with do not / does not",
      teen: [
        L("Kundalik ishlar va Present simple (+)", "46–47", [
          "Warm-up: About you — ertalab va maktabda tushlikda nima yeysiz?",
          "Vocabulary: Daily activities — 1–2-mashqlar (audio 62)",
          "Listening — 3–5-mashqlar (audio 63): foto klub va Joséning kuni",
          "Grammar: Present simple (+) — 1–2-mashqlar (Grammar reference SB 144); Pronunciation: Present simple endings — 3-mashq (audio 65–66)",
          "4–6-mashqlar: sherigining kuni haqida gapirish va yozish; 6-mashq (audio 64) — ikki farqni topish",
        ], "WB 32–33: Daily activities, Listening va Grammar (Present simple +)"),
        L("Vaqt, blog va Present simple (−)", "48–49", [
          "Warm-up: soat maketida vaqtni aytish zanjiri",
          "Vocabulary: Telling the time (2) — 1–2-mashqlar (audio 67–68)",
          "Reading: My Brazil blog — 3–4-mashqlar (audio 69)",
          "Grammar: Present simple (−) — 1–4-mashqlar (audio 70); Talking points: video 06 (Daily routine)",
          "Speaking — 1–2-mashqlar: Lesedining kuni va oʻz kuni orasidagi farqlar",
        ], "WB 34–35: Telling the time, Reading, Grammar (−) va Writing: oʻz kuni haqida matn"),
      ],
      kids: [
        L("Kundalik ishlar (TPR)", "46", [
          "Warm-up: ovqat soʻzlari bilan Bingo",
          "Vocabulary: Daily activities — 1-mashq (audio 62), har bir ishni mimika bilan koʻrsatish, This is the way we … qoʻshigʻi",
          "2-mashq: rasm harfini aytib, ishni topish juftlikda",
          "Listening — 4-mashq (audio 63), savollarga birga javob berish",
        ], "WB 32: kundalik ishlar (1–2 ta mashq)"),
        L("Present simple (+): -s / -es", "47", [
          "Warm-up: kundalik ishlar kartochkalarini kun tartibida terish",
          "Grammar: Present simple (+) — 1–2-mashqlar, I get up / She gets up farqini rangli boʻr bilan koʻrsatish",
          "Pronunciation: 3-mashq (audio 65–66), -s va -es tovushlarini qarsak bilan ajratish",
          "4-mashq: juftlikda kunini aytib berish; 5-mashq: sherigi haqida 2–3 gap",
        ], "WB 33: Present simple (+) — 2 ta mashq"),
        L("Vaqtni aytish va Present simple (−)", "48–49", [
          "Warm-up: What is the time, Mr Wolf? oʻyini",
          "Vocabulary: Telling the time (2) — 1–2-mashqlar (audio 67–68), soatlarni chizish",
          "Reading: My Brazil blog — 3-mashq (audio 69), ustoz bilan qismlab oʻqish",
          "Grammar: Present simple (−) — 1–2-mashqlar (audio 70), 4-mashqni birga; video 06",
          "Speaking — 2-mashq: Lesedi va oʻz kuni orasidagi 2 ta farq",
        ], "WB 34: vaqt mashqlari va oʻz kun tartibi (4 ta rasm va vaqt)"),
      ],
    },
    {
      unit: 8,
      title: "Unit 8 · At school + Life Skills: Learning English + Review 2",
      description: "Maktab fanlari va dars jadvali, Present simple savollari va Wh- savollar; Life Skills: ingliz tilini oʻrganish va Review 2 (Unit 5–8).",
      objectives: [
        "Maktab fanlari va dars jadvali haqida gapira oladi",
        "Present simple savollari va qisqa javoblarni qoʻllay oladi",
        "Who, What, Where, When, How often, Why bilan savol berib, doʻsti haqida yoza oladi",
      ],
      vocabulary: ["art", "English", "French", "geography", "history", "IT", "maths", "music", "PE", "science", "catch", "meet"],
      grammar: "Present simple questions and short answers; Wh- questions",
      teen: [
        L("Maktab fanlari va Present simple savollari", "50–51", [
          "Warm-up: About you — darslar qachon boshlanadi va tugaydi?",
          "Vocabulary: School subjects — 1–2-mashqlar (audio 71)",
          "Listening — 3–5-mashqlar (audio 72): dars jadvalidagi oʻzgarishlar",
          "Grammar: Present simple questions — 1–2-mashqlar (audio 73), Grammar reference SB 145",
          "3-mashq: savollar tuzib, juftlikda soʻrash",
        ], "WB 36–37: School subjects, Listening va Grammar (Present simple ?)"),
        L("School of the Air va Wh- savollar", "52–53", [
          "Warm-up: Talking points — video 07 (School subjects) va savollar",
          "Reading: School of the Air — 1–3-mashqlar (audio 74)",
          "Vocabulary: Words with two meanings — 4–6-mashqlar",
          "Grammar: Wh- questions — 1–4-mashqlar; Pronunciation: Wh- questions — 5–6-mashqlar (audio 75)",
          "Writing — 1–2-mashqlar: doʻstidan maktabi haqida intervyu olib, matn yozish",
        ], "WB 38–39: Reading, Grammar (Wh- questions) va Writing"),
        L("Life Skills: Learning English", "54–55 (Life Skills)", [
          "Warm-up: 1–2-mashqlar — sevimli fan va ingliz tilini oʻrganish usullari",
          "Reading — 3–4-mashqlar (audio 76): forumdagi maslahatlar",
          "5–6-mashqlar: feʼl va soʻz birikmalari (read comics, watch TV, write letters …)",
          "Listening — 7–9-mashqlar (audio 77); Useful language: What about …? / You can … — 10-mashq",
          "Project: doʻst uchun 4 ta top tips rejasi va juftlikda almashish",
        ], "Project: ingliz tilini oʻrganish rejasi (reading, listening, writing, vocabulary) — 4 ta maslahat"),
        L("Review 2 (Unit 5–8)", "56–57 (Review 2)", [
          "Warm-up: Unit 5–8 soʻzlari bilan jamoaviy Pictionary",
          "Vocabulary — 1–2-mashqlar; Grammar — 1–3-mashqlar",
          "Listening — 1-mashq (audio 78): intervyu va notoʻgʻri gaplarni tuzatish",
          "Reading — 1-mashq: pen pal xabari; Speaking — 1-mashq: rasmlar boʻyicha kun tartibi",
          "Writing — 1-mashq: Rodrigoga oʻzi haqida email",
        ], "Emailni tugatish; Vocabulary list: Unit 5–8 soʻzlari va Grammar reference (SB 141–145) mashqlari"),
      ],
      kids: [
        L("Maktab fanlari", "50", [
          "Warm-up: soat maketi bilan vaqtni aytish oʻyini",
          "Vocabulary: School subjects — 1-mashq (audio 71), fanlarni mimika bilan koʻrsatish",
          "2-mashq: oʻz dars jadvali boʻyicha When is maths? savol-javobi",
          "Listening — 3-mashq (audio 72), eshitilgan fanlarni belgilash",
          "5-mashq: sevimli fanlar soʻrovi va sinf diagrammasi",
        ], "WB 36: fanlar (1–2 ta mashq)"),
        L("Do you …? Does she …?", "51", [
          "Warm-up: fanlar flashcardlari bilan Hangman",
          "Grammar: Present simple questions — 1-mashq, Do / Does kartochkalari bilan",
          "2-mashq (audio 73): Lara jadvali boʻyicha savol-javob",
          "3-mashq: Find someone who … (Do you go to school on Saturdays?) oʻyini",
        ], "WB 37: Present simple ? — 2 ta mashq"),
        L("School of the Air va Wh- savollar", "52–53", [
          "Warm-up: video 07 va Talking points savollari",
          "Reading: School of the Air — 1-mashq (audio 74), 2-mashqni birga (yes / no)",
          "Grammar: Wh- questions — 1–3-mashqlar, savol soʻzlarini javob rasmlariga moslash",
          "Pronunciation: Wh- questions — 5–6-mashqlar (audio 75), savollarni ritm bilan aytish",
          "Writing: doʻstidan 3 ta savol soʻrab, javoblarini birga yozish (qisqartirilgan)",
        ], "WB 38: Reading va 3 ta Wh- savol"),
        L("Life Skills: Learning English", "54–55 (Life Skills)", [
          "Warm-up: 2-mashq — qaysi usullardan foydalanasan? (qoʻl koʻtarish)",
          "Reading — 3-mashq (audio 76), ustoz bilan qisqartirib oʻqish",
          "5–6-mashqlar: read comics, watch TV, listen to music birikmalari — rasmlar bilan",
          "Listening — 7-mashq (audio 77)",
          "Project: vocabulary cards yasash — har kim 5 ta soʻz kartochkasi",
        ], "Uyda 5 ta buyumga inglizcha nomini yopishtirish"),
        L("Review 2: lugʻat va grammatika oʻyinlari", "56 (Review 2)", [
          "Warm-up: Unit 5–8 flashcardlari bilan Board race",
          "Vocabulary — 1–2-mashqlar (tana aʼzolarini rasmda belgilash)",
          "Grammar — 1–2-mashqlar ustoz bilan; 3-mashq: can / cannot jadvali boʻyicha gaplar",
          "Oʻyin: savol kartochkalari bilan stol oʻyini (Do you …? Can you …?)",
        ], "Unit 5–8 dan 10 ta soʻzni rasm bilan lugʻat daftariga yozish"),
        L("Review 2: koʻnikmalar va takrorlash oʻyinlari", "57 (Review 2)", [
          "Warm-up: Simon says (tana aʼzolari va kundalik ishlar)",
          "Speaking — 1-mashq: rasmlar boʻyicha kun tartibini aytish",
          "Listening — 1-mashq (audio 78), ikki marta, pauzalar bilan",
          "Reading — 1-mashq: Rodrigo xabari, savollarga birga javob",
          "Writing: Rodrigoga 4–5 gapli javob (shablon asosida)",
        ], "Rodrigoga javobni chiroyli koʻchirib, rasm chizish"),
      ],
    },
    {
      unit: 9,
      title: "Unit 9 · Feeling good",
      description: "Sport va faoliyatlar, sogʻlom turmush tarzi, like + -ing va olmoshlarning obyekt shakli.",
      objectives: [
        "Sport va faoliyatlarni nomlab, play bilan ishlatiladiganlarini ajrata oladi",
        "like / do not like + -ing va good at bilan qiziqishlari haqida gapira oladi",
        "me, you, him, her, it, us, them olmoshlarini qoʻllab, sogʻliq haqida maslahat bera oladi",
      ],
      vocabulary: ["badminton", "basketball", "dancing", "hockey", "running", "swimming", "table tennis", "tennis", "feel better", "good for you", "breakfast"],
      grammar: "like + -ing (+ / −); Object pronouns: me, you, him, her, it, us, them",
      teen: [
        L("Sport, tinglash va like + -ing", "58–59", [
          "Warm-up: About you — qaysi faoliyatlarni yoqtirasiz, doʻstlaringiz bilan nima qilasiz?",
          "Vocabulary: Sports and activities — 1–2-mashqlar (audio 80–81), play bilan ishlatiladigan sportlar",
          "Listening — 3–4-mashqlar (audio 82); Pronunciation: Word stress — 5-mashq (audio 83)",
          "Grammar: like + -ing — 1–3-mashqlar, -ing imlo qoidalari (Grammar reference SB 146)",
          "4–6-mashqlar: jadvalni toʻldirish, ikki doʻst bilan suhbat va ular haqida yozish; Talking points: video 08 (Feeling good)",
        ], "WB 40–41: Sports and activities, Listening va Grammar (like + -ing)"),
        L("Ask the doctor: sogʻliq va olmoshlar", "60–61", [
          "Warm-up: Good for you / Not good for you — tezkor saralash oʻyini",
          "Vocabulary va Reading: Health — 1–2-mashqlar (audio 84), maktublarni javoblarga moslash",
          "3–6-mashqlar: sogʻlom nonushta (javoblar Extra activities SB 124 da), yangi iboralar va jadval",
          "Grammar: Pronouns — 1–3-mashqlar; 4–5-mashqlar: Dr Smartga maktub yozish va sherigining maktubiga javob",
          "Speaking — 1-mashq: dam olish kunlari yoqtirgan 5 ta ish va ularning foydasi",
        ], "WB 42–43: Health, Reading, Grammar (pronouns) va Writing"),
      ],
      kids: [
        L("Sport va faoliyatlar", "58", [
          "Warm-up: fanlar va kun tartibi flashcardlari takrori",
          "Vocabulary: Sports and activities — 1–2-mashqlar (audio 80–81), har bir sportni harakat bilan koʻrsatish",
          "Listening — 3-mashq (audio 82), rasmlarga ism yozish",
          "Pronunciation: Word stress — 5-mashq (audio 83), urgʻuli boʻgʻinda sakrash",
          "Oʻyin: Charades — sportni mimika bilan topish",
        ], "WB 40: sport soʻzlari (1–2 ta mashq)"),
        L("I like …ing", "59", [
          "Warm-up: yoqtirgan sportni aytib, harakat qilish zanjiri",
          "Grammar: like + -ing — 1–2-mashqlar, -ing qoidalari rangli kartochkalar bilan",
          "3-mashq ustoz bilan; 4-mashq: jadvalni yuz ifodalari bilan toʻldirish",
          "5-mashq: ikki doʻsti bilan suhbat; video 08",
        ], "WB 41: like + -ing — 2 ta mashq"),
        L("Sogʻlom boʻlish va olmoshlar", "60–61", [
          "Warm-up: sogʻlom va sogʻlom emas ovqatlar — ikki savat oʻyini",
          "Reading: Ask the doctor — 1-mashq (audio 84), maktublarni ustoz bilan qismlab oʻqish",
          "3-mashq: nonushtalarni Extra activities (SB 124) orqali tekshirish; 5-mashq: jadval",
          "Grammar: Pronouns — 1–3-mashqlar, olmosh kartochkalari bilan TPR (Give it to him.)",
          "Speaking — 1-mashq: yoqtirgan 3 ta ishi foydalimi?; 6-mashq: nonushtada nima yeysan?",
        ], "WB 42: Health va sogʻlom nonushta rasmi 2 ta gap bilan"),
      ],
    },
    {
      unit: 10,
      title: "Unit 10 · Things we do + Culture: Youth clubs in the UK + End-of-level test",
      description: "Maktabdan keyingi mashgʻulotlar, uy ishlari va Present continuous; Buyuk Britaniyadagi yoshlar klublari; L1 / K1 yakuniy testi.",
      objectives: [
        "Hozir sodir boʻlayotgan ishlarni Present continuous bilan ayta oladi",
        "Present continuous savollari va qisqa javoblarini qoʻllay oladi",
        "Maktabdan keyingi mashgʻulotlar va uy ishlari haqida gapirib, oʻzi haqida blog yoza oladi",
      ],
      vocabulary: ["athletics club", "board games club", "coding club", "drama club", "cookery club", "carry the shopping", "clean the bath", "do the washing-up", "feed the cat", "make your bed", "tidy your room", "walk the dog"],
      grammar: "Present continuous (+ / −); Present continuous questions and short answers",
      teen: [
        L("Klublar, tinglash va Present continuous", "62–63", [
          "Warm-up: About you — maktabingizda qanday klublar bor?",
          "Vocabulary: After-school activities — 1–2-mashqlar (audio 85), uch kishilik guruhda klub tanlash",
          "Listening — 3–5-mashqlar (audio 86): Freyaning klublari",
          "Grammar: Present continuous (+ / −) — 1–3-mashqlar (audio 87), Grammar reference SB 147",
          "4-mashq: mimika oʻyini — Student A harakat qiladi, B va C savol berib topadi",
        ], "WB 44–45: After-school activities, Listening va Grammar (Present continuous)"),
        L("Uy ishlari, hikoya va Present continuous savollari", "64–65", [
          "Warm-up: What are you doing? — rasm kartochkalari bilan tezkor savol",
          "Vocabulary: Jobs around the house — 1-mashq (audio 88); Reading — 2–4-mashqlar (audio 89)",
          "Pronunciation: Yes / No questions — 3-mashq (audio 90); 4–5-mashqlar: xotiradan savol-javob va hikoyani rolda oʻynash",
          "Grammar: Present continuous questions — 1–2-mashqlar; Talking points",
          "Writing — 1–2-mashqlar: Matt blogi asosida oʻzi haqida blog yozish",
        ], "WB 46–47: Jobs around the house, Reading, Grammar va Writing (blog)"),
        L("Culture: Youth clubs in the UK", "66–67 (Culture)", [
          "Warm-up: 1-mashq — maktabdan keyin nima qilasiz?; Factfile",
          "Reading: City Youth Club blog — 2–4-mashqlar (audio 91)",
          "5-mashq: I like … / I do not like … bilan oʻzi haqida gaplar",
          "Listening — 6–7-mashqlar (audio 92); Talking points; Culture video 09 (Boy and Girl Scouts)",
          "Project: maktab yonidagi xayoliy yoshlar klubi uchun blog sahifasi (guruhda)",
        ], "Project: blog sahifasini tugatib taqdimotga tayyorlanish; yakuniy test uchun Unit 6–10 takrori"),
        testLesson("End-of-level test (L1)", "Unit 1–10 (asosan Unit 6–10)", false, "Keyingi daraja oldidan: Grammar reference (SB 143–147) va test tahlilidagi xatolar ustida ishlash"),
      ],
      kids: [
        L("Maktabdan keyingi klublar", "62", [
          "Warm-up: I like …ing zanjiri bilan Unit 9 takrori",
          "Vocabulary: After-school activities — 1-mashq (audio 85), klub rasmlari bilan Memory",
          "2-mashq: 3 ta klub tanlash va guruhda aytish",
          "Listening — 3–4-mashqlar (audio 86), rasmlarni kunlarga moslash",
        ], "WB 44: klublar soʻzlari (1–2 ta mashq)"),
        L("Present continuous: hozir nima qilyapman?", "63", [
          "Warm-up: ustoz harakat qiladi, sinf You are … deb aytadi",
          "Grammar: Present continuous (+ / −) — 1–2-mashqlar, am / is / are + -ing kartochkalari",
          "3-mashq (audio 87): rasm boʻyicha yes / no",
          "4-mashq: guruhlarda mimika oʻyini (draw, sit, stand on one leg …)",
        ], "WB 45: Present continuous — 2 ta mashq"),
        L("Uy ishlari va hikoya", "64–65", [
          "Warm-up: uy ishlari mimikasi (TPR)",
          "Vocabulary: Jobs around the house — 1-mashq (audio 88); Reading — 2-mashq (audio 89), rollarda oʻqish",
          "Pronunciation: Yes / No questions — 3-mashq (audio 90); Grammar: Present continuous questions — 1–2-mashqlar",
          "5-mashq: hikoyani kichik guruhlarda sahnalashtirish",
          "Writing: blogni shablon asosida 3–4 gap bilan birga yozish",
        ], "WB 46: uy ishlari va uyda qilgan yordami haqida 2 ta gap"),
        L("Culture: Youth clubs in the UK", "66–67 (Culture)", [
          "Warm-up: 1-mashq savollari rasmlar yordamida",
          "Reading — 2–3-mashqlar (audio 91), ismlarni topish oʻyini",
          "4–5-mashqlar: faoliyatlar va I like … gaplari",
          "Culture video 09 va Listening — 6-mashq (audio 92)",
          "Project: orzudagi klub plakati (nomi, kunlari, mashgʻulotlari)",
        ], "Plakatni tugatish; yakuniy test uchun Unit 6–10 soʻzlarini takrorlash"),
        testLesson("End-of-level test (K1)", "Unit 1–10 (asosan Unit 6–10)", true, "Sevimli chant yoki qoʻshiqni oila oldida aytib berish va WB dagi bajarilmagan mashqlarni tugatish"),
      ],
    },
    {
      unit: 11,
      title: "Unit 11 · My digital life",
      description: "Oʻyin-kulgi va texnologiya: mashhur odam bilan intervyu, raqamli qurilmalar, chastota ravishlari va How much / How many.",
      objectives: [
        "always, often, sometimes, never bilan biror ishni qanchalik tez-tez qilishini ayta oladi",
        "Raqamli qurilmalarni nomlab, ular bilan nima qilishini ayta oladi",
        "How much …? / How many …? bilan soʻrovnoma oʻtkazib, natijani sinfga aytib bera oladi",
      ],
      vocabulary: ["fans", "band", "TV show", "newspaper", "concert", "movies", "digital camera", "fitness tracker", "laptop", "smartphone", "smart speaker", "tablet"],
      grammar: "Adverbs of frequency: always, often, sometimes, never; How much …? / How many …?",
      teen: [
        L("Oʻyin-kulgi, intervyu va chastota ravishlari", "68–69", [
          "Warm-up: About you — hozir nima qilyapsiz? (Present continuous takrori)",
          "Vocabulary: Entertainment — 1-mashq; Listening — 2-mashq (audio 93): Joséning TV intervyusi",
          "3-mashq: soʻz va maʼnolarni moslash (audio 94); 4-mashq: intervyuni qayta tinglab soʻzlarni belgilash (audio 93)",
          "Grammar: Adverbs of frequency — 1–4-mashqlar (audio 95), Grammar reference SB 148",
          "5-mashq: sevimli film, TV show, guruh va qoʻshiq haqida juftlikda suhbat",
        ], "WB 48–49: Entertainment, Listening va Grammar (adverbs of frequency)"),
        L("Texnologiya, How much / How many va soʻrovnoma", "70–71", [
          "Warm-up: sinfdagi qurilmalarni sanash — How many phones are there?",
          "Vocabulary: Technology — 1–2-mashqlar (audio 96); Reading — 3–5-mashqlar (audio 97)",
          "Grammar: How much …? / How many …? — 1-mashq; 2-mashq: Extra activities (SB 125) testi",
          "Pronunciation: /w/ and /v/ — 3-mashq (audio 98)",
          "Speaking — 1–3-mashqlar: 6 ta savolli soʻrovnoma va uch doʻst haqida sinfga hisobot",
        ], "WB 50–51: Technology, Reading, Grammar va Writing"),
      ],
      kids: [
        L("Mashhur odam va oʻyin-kulgi soʻzlari", "68", [
          "Warm-up: Present continuous mimika oʻyini (Unit 10 takrori)",
          "Vocabulary: Entertainment — 3-mashq (audio 94), flashcardlar va maʼnoni topish oʻyini",
          "1-mashq: rasm boʻyicha savollar; Listening — 2-mashq (audio 93), yes / no kartochkalari",
          "5-mashq: sevimli film va qoʻshiq — sinf soʻrovi",
        ], "WB 48: Entertainment soʻzlari (1–2 ta mashq)"),
        L("always, often, sometimes, never", "69", [
          "Warm-up: chastota shkalasi — 100%, 50%, 0% yozilgan burchaklarga yugurish oʻyini",
          "Grammar: Adverbs of frequency — 1–2-mashqlar, ravishni gapdagi oʻrniga qoʻyish (soʻz kartochkalari)",
          "3-mashq (audio 95) ustoz bilan",
          "4-mashq: oʻzi haqida gaplar va juftlikda solishtirish",
        ], "WB 49: Grammar — 2 ta mashq"),
        L("Qurilmalar va How many?", "70–71", [
          "Warm-up: qurilmalar rasmlari bilan What is missing?",
          "Vocabulary: Technology — 1–2-mashqlar (audio 96); Reading — 3-mashq (audio 97)",
          "Grammar: How much …? / How many …? — 1-mashq, sanaladigan / sanalmaydigan takrori; Extra activities (SB 125)",
          "Pronunciation: /w/ and /v/ — 3-mashq (audio 98), tez aytish (tongue twister)",
          "Speaking: 3 ta savolli kichik soʻrovnoma (Speaking 1–2 qisqartirilgan)",
        ], "WB 50: Technology va 3 ta How many …? gap"),
      ],
    },
    {
      unit: 12,
      title: "Unit 12 · Working life + Life Skills: Being careful on the internet + Review 3",
      description: "Kasblar, Present simple va Present continuous farqi, kafeda buyurtma berish; internetda xavfsizlik va Review 3 (Unit 9–12).",
      objectives: [
        "Kasblarni nomlab, odamlar ishda nima qilishini ayta oladi",
        "Present simple va Present continuous ni farqlab qoʻllay oladi",
        "Can I …? / Can you …? bilan kafeda iltimos qila va ruxsat soʻray oladi",
      ],
      vocabulary: ["doctor", "farmer", "firefighter", "journalist", "lorry driver", "musician", "nurse", "waiter / waitress", "cup", "fork", "knife", "plate"],
      grammar: "Present simple and present continuous; can: requests and permission",
      teen: [
        L("Kasblar, tinglash va Present simple / continuous", "72–73", [
          "Warm-up: About you — oilangizdagilar kim boʻlib ishlaydi?",
          "Vocabulary: Jobs — 1–3-mashqlar (audio 99)",
          "Listening — 4–5-mashqlar (audio 100): Meganning oilasi",
          "Grammar: Present simple and present continuous — 1–3-mashqlar (audio 101), Grammar reference SB 149",
          "4–5-mashqlar: dialoglarni juftlikda oʻqish; oila aʼzolari hozir nima qilayotganini taxmin qilish",
        ], "WB 52–53: Jobs, Listening va Grammar"),
        L("Kafeda: iltimos va ruxsat", "74–75", [
          "Warm-up: kafe menyusi rasmi — What would you like?",
          "Reading: In a café — 1–2-mashqlar (audio 102); Vocabulary — 3–4-mashqlar (audio 103)",
          "Grammar: can: requests and permission — 1–2-mashqlar (Grammar reference SB 149)",
          "Pronunciation: Intonation — 3-mashq (audio 104); 4-mashq: ofitsiant bilan dialog",
          "Writing — 1–2-mashqlar: oʻz kafesi menyusi va dialog, sinf oldida ijro",
        ], "WB 54–55: In a café, Grammar (can) va Writing (menyu va dialog)"),
        L("Life Skills: Being careful on the internet", "76–77 (Life Skills)", [
          "Warm-up: 1-mashq — kompyuter va telefondan qanchalik foydalanasiz?",
          "Internet quiz — 2–3-mashqlar (audio 105–106), javoblarni tekshirish",
          "4–6-mashqlar: xavfsizlik qoidalari va iboralar (surf the internet, join social media sites …)",
          "Cyber bullying: 7-mashq (audio 107), Listening — 8–9-mashqlar (audio 108); Useful language — 10-mashq (nima qilish va nima qilmaslik kerak)",
          "Project: Be safe on the internet posteri",
        ], "Project: internet xavfsizligi posteri (nima qilish kerak, nima qilmaslik kerak, kimdan yordam soʻrash)"),
        L("Review 3 (Unit 9–12)", "78–79 (Review 3)", [
          "Warm-up: Grammar 2-mashq — savol soʻzlari bilan O va X oʻyini",
          "Grammar — 1 va 3-mashqlar; Vocabulary — 1–3-mashqlar",
          "Speaking — 1-mashq: kafeda yetishmayotgan narsani soʻrash (rolda)",
          "Listening — 1-mashq (audio 109): Danielning telefon qoʻngʻiroqlari; Reading — 1-mashq (yes / no)",
          "Writing — 1-mashq: mijoz va ofitsiant dialogi",
        ], "Vocabulary list: Unit 9–12 soʻzlari va Grammar reference (SB 146–149) mashqlari"),
      ],
      kids: [
        L("Kasblar", "72", [
          "Warm-up: How often …? zanjiri bilan Unit 11 takrori",
          "Vocabulary: Jobs — 1-mashq (audio 99), kasblarni mimika bilan topish (Charades)",
          "2-mashq: kasb va feʼlni kartochkalar bilan moslash",
          "Listening — 4-mashq (audio 100), rasmdagi odamlarni topish",
        ], "WB 52: kasblar (1–2 ta mashq)"),
        L("Har kuni yoki hozir?", "73", [
          "Warm-up: kasb kartochkasi — He drives a lorry. / Now he is eating.",
          "Grammar: Present simple and present continuous — 1–2-mashqlar, every day / now belgilari bilan saralash",
          "3-mashq (audio 101) ustoz bilan; 4-mashq: dialoglarni juftlikda oʻqish",
          "5-mashq: oiladagi kasblar haqida 2 ta gap",
        ], "WB 53: Grammar — 2 ta mashq"),
        L("Kafe oʻyini: Can I …? Can you …?", "74–75", [
          "Warm-up: idish-tovoq rasmlari bilan sehrli xalta",
          "Reading: In a café — 1–2-mashqlar (audio 102); Vocabulary — 3-mashq (audio 103)",
          "Grammar: can: requests and permission — 1–2-mashqlar; Pronunciation: Intonation — 3-mashq (audio 104)",
          "Rol oʻyini: sinfda kafe — menyu, ofitsiant va mijozlar (Writing 1–2 ogʻzaki)",
        ], "WB 54: kafe soʻzlari va rasmli menyu"),
        L("Life Skills: Being careful on the internet", "76–77 (Life Skills)", [
          "Warm-up: 1-mashq savollari — telefon va kompyuterdan foydalanish",
          "Internet quiz — 2–3-mashqlar (audio 105–106), ustoz bilan birga",
          "4-mashq: toʻgʻri va notoʻgʻri — qizil / yashil kartochkalar",
          "Cyber bullying: 7-mashq (audio 107) — muammo boʻlsa kattalarga aytish",
          "Project: Be safe! plakati — 3 ta qoida rasmlar bilan",
        ], "Plakatni oila bilan muhokama qilib tugatish"),
        L("Review 3: lugʻat va grammatika oʻyinlari", "78 (Review 3)", [
          "Warm-up: Unit 9–12 flashcardlari bilan Board race",
          "Grammar — 1-mashq ustoz bilan; 3-mashq: How often …? savol-javobi",
          "Vocabulary — 1–3-mashqlar (uy ishlari birikmalari, soʻzlar, kasblar anagrammasi)",
          "Oʻyin: 2-mashqdagi O va X — savol soʻzlari bilan",
        ], "Unit 9–12 dan 10 ta soʻzni rasm bilan lugʻat daftariga yozish"),
        L("Review 3: koʻnikmalar va takrorlash oʻyinlari", "79 (Review 3)", [
          "Warm-up: Simon says (sport va uy ishlari)",
          "Speaking — 1-mashq: kafe oʻyini, yetishmayotgan narsani soʻrash",
          "Listening — 1-mashq (audio 109), ikki marta, pauzalar bilan",
          "Reading — 1-mashq: Lucas haqida yes / no",
          "Writing: kafe dialogini shablon asosida 4 gap bilan yozish",
        ], "WB 40–55 dagi bajarilmagan mashqlardan ustoz tanlagan 2–3 tasini tugatish"),
      ],
    },
    {
      unit: 13,
      title: "Unit 13 · Places",
      description: "Shahardagi joylar, joylarni tasvirlovchi sifatlar, Is there a …? / Are there any …? va joy predloglari.",
      objectives: [
        "Shahardagi joylarni nomlab, u yerda nima qilinishini ayta oladi",
        "Is there a …? / Are there any …? bilan shahri haqida soʻray va javob bera oladi",
        "Sevimli joyini sifatlar va inside, outside, above, below, near bilan tasvirlay oladi",
      ],
      vocabulary: ["bank", "cinema", "hospital", "hotel", "museum", "station", "supermarket", "university", "beautiful", "cheap", "expensive", "safe"],
      grammar: "Is there a …? / Are there any …?; Prepositions: inside, outside, above, below, near",
      teen: [
        L("Shahardagi joylar va Is there a …?", "80–81", [
          "Warm-up: About you — dam olish kunlari shaharda qayerga borasiz?",
          "Vocabulary: Places in a town — 1–2-mashqlar (audio 111); Pronunciation: /s/ and /k/ — 3-mashq (audio 112)",
          "4–5-mashqlar: joylar va maqsadlar, oʻz shahri boʻyicha word map",
          "Listening — 6–8-mashqlar (audio 113): fotograflar va José",
          "Grammar: Is there a …? / Are there any …? — 1–3-mashqlar (audio 114), Grammar reference SB 150; 4-mashq: Extra activities (SB 125) juftlikda",
        ], "WB 56–57: Places in a town, Listening va Grammar"),
        L("Sevimli joy: sifatlar va predloglar", "82–83", [
          "Warm-up: Guess the place — joyni tasvirlab, sherigi topadi",
          "Reading: My favourite place — 1–3-mashqlar (audio 115)",
          "Vocabulary: Adjectives: places — 4–7-mashqlar (audio 116), qarama-qarshi sifatlar",
          "Grammar: Prepositions: inside, outside, above, below, near — 1–3-mashqlar (Grammar reference SB 150); Talking points: video 10 (Favourite places)",
          "Speaking — 1-mashq: word map asosida yashash joyi haqida suhbat",
        ], "WB 58–59: Adjectives, Reading, Grammar (predloglar) va Writing: sevimli joy"),
      ],
      kids: [
        L("Shahar joylari", "80", [
          "Warm-up: kasb va joyni moslash oʻyini (doctor → hospital)",
          "Vocabulary: Places in a town — 1–2-mashqlar (audio 111), sinfda shahar xaritasi yasash",
          "Pronunciation: /s/ and /k/ — 3-mashq (audio 112), c harfining ikki tovushi",
          "4-mashq: joy va maqsadni ustoz bilan moslash",
        ], "WB 56: joylar (1–2 ta mashq)"),
        L("Is there a …? Are there any …?", "81", [
          "Warm-up: sinf xaritasida Where is the bank? oʻyini",
          "Listening — 7-mashq (audio 113): fotograflar nima qilmoqchi?",
          "Grammar: Is there a …? / Are there any …? — 1–3-mashqlar (audio 114), yes / no kartochkalari",
          "4-mashq: Extra activities (SB 125) — shahar rasmidagi binolarni topish oʻyini",
        ], "WB 57: Grammar — 2 ta mashq"),
        L("Sevimli joy va predloglar", "82–83", [
          "Warm-up: inside / outside, above / below — quti va oʻyinchoq bilan TPR",
          "Reading: My favourite place — 1–2-mashqlar (audio 115), ustoz bilan qismlab oʻqish",
          "Vocabulary: Adjectives: places — 4-mashq (audio 116); 6-mashq: qarama-qarshi soʻzlarni juftlash oʻyini",
          "Grammar: Prepositions — 1–2-mashqlar; video 10",
          "Speaking: sevimli joyi haqida 3 ta gap (rasm bilan)",
        ], "WB 58: sifatlar va sevimli joy rasmi 3 ta gap bilan"),
      ],
    },
    {
      unit: 14,
      title: "Unit 14 · Out and about + Culture: Museums around the world",
      description: "Transport, Londonda harakatlanish, because / and / but / or bogʻlovchilari, dam olish rejalari va takliflar; dunyo muzeylari.",
      objectives: [
        "Transport turlarini nomlab, qayerga nima bilan borishini ayta oladi",
        "because, and, but, or bilan gaplarni bogʻlay oladi",
        "Shall we …? / Let us … bilan taklif berib, doʻstlari bilan reja tuza oladi va email yoza oladi",
      ],
      vocabulary: ["bike", "boat", "bus", "coach", "plane", "taxi", "train", "tram", "Underground", "go shopping", "visit a museum", "meet friends"],
      grammar: "because, and, but, or; Suggestions: Shall we …? / Let us …",
      teen: [
        L("Transport va because / and / but / or", "84–85", [
          "Warm-up: About you — maktabga qanday borasiz, doʻstlaringiz bilan yurasizmi?",
          "Vocabulary: Transport — 1–2-mashqlar (audio 117)",
          "Reading: Getting around London — 3–4-mashqlar (audio 118); 5-mashq: shahringizdagi transport",
          "Grammar: because, and, but, or — 1–4-mashqlar (Grammar reference SB 151)",
          "Pronunciation: Final /m/ and /n/ sounds — 5-mashq (audio 119)",
        ], "WB 60–61: Transport, Reading va Grammar (because, and, but, or)"),
        L("Dam olish rejalari: Shall we …?", "86–87", [
          "Warm-up: Talking points — dam olish kunlari nima qilishni yoqtirasiz?",
          "Vocabulary va Listening: Phrases: going out — 1–3-mashqlar (audio 120), Anyaning kundaligi; 4-mashq (audio 121)",
          "Grammar: Shall we …? / Let us … — 1–3-mashqlar (audio 120), Grammar reference SB 151",
          "4–5-mashqlar: eʼlonlar asosida kundalik tuzish va uch doʻst bilan reja (namuna — Extra activities SB 125)",
          "Writing — 1–2-mashqlar: yangi doʻstga gʻoyalar bilan email",
        ], "WB 62–63: Phrases: going out, Grammar va Writing (email)"),
        L("Culture: Museums around the world", "88–89 (Culture)", [
          "Warm-up: 1-mashq — muzey haqida sifatlar va savollar; 2-mashq: taxmin",
          "Reading — 3–5-mashqlar (audio 122), jadval va feʼl birikmalari",
          "Listening — 6–7-mashqlar (audio 123): Bethning taqdimoti",
          "Talking points va Culture video 11 (Famous museums around the world)",
          "Project: Oʻzbekistondagi muzey haqida poster rejasi (masalan, Toshkent yoki Samarqanddagi muzey)",
        ], "Project: muzey posteri (nomi, joyi, turi, nima uchun yoqadi, u yerda nima qilish mumkin) — taqdimotga tayyorlanish"),
      ],
      kids: [
        L("Transport", "84", [
          "Warm-up: shahar joylari flashcardlari bilan takror",
          "Vocabulary: Transport — 1-mashq (audio 117), transport tovushlari va harakatlari bilan TPR",
          "2-mashq: ustoz oʻqigan taʼrifni tinglab transportni topish",
          "Reading: Getting around London — 3-mashq (audio 118), qisqartirilgan",
          "5-mashq: maktabga nima bilan kelasiz? — sinf diagrammasi",
        ], "WB 60: transport soʻzlari (1–2 ta mashq)"),
        L("because, and, but, or", "85", [
          "Warm-up: I go to school by … zanjiri",
          "Grammar: because, and, but, or — 1-mashq, bogʻlovchi kartochkalari bilan gap qurish oʻyini",
          "2–3-mashqlar ustoz bilan birga",
          "Pronunciation: Final /m/ and /n/ sounds — 5-mashq (audio 119)",
        ], "WB 61: Grammar — 2 ta mashq"),
        L("Dam olish rejalari va takliflar", "86–87", [
          "Warm-up: go / meet / visit + joy — birikma oʻyini",
          "Listening — 1-mashq (audio 120), Anyaning kundaligiga ismlarni yozish",
          "Vocabulary — 4-mashq (audio 121), iboralarni moslash",
          "Grammar: Shall we …? / Let us … — 1–3-mashqlar; Extra activities (SB 125) dialogini juftlikda oʻqish",
          "Writing: yangi doʻstga 3–4 gapli taklif (shablon bilan)",
        ], "WB 62: iboralar va dam olish kuni rejasi rasmi"),
        L("Culture: Museums around the world", "88–89 (Culture)", [
          "Warm-up: 1-mashq — muzey sifatlari (beautiful, boring, interesting) kartochkalari",
          "Reading — 3-mashq (audio 122): qaysi muzey qaysi mamlakatda?",
          "5-mashq: play, do, draw, visit birikmalari",
          "Culture video 11 va Listening — 6-mashq (audio 123)",
          "Project: sinf muzeyi — har kim sevimli buyumini olib kelib, 2 ta gap bilan tanishtiradi",
        ], "Oʻzbekistondagi bitta muzey rasmi va 2 ta gap"),
      ],
    },
    {
      unit: 15,
      title: "Unit 15 · What shall I wear? + Mid-level test",
      description: "Kiyimlar, otlarning koʻplik shakli va imlosi, odamlarning tashqi koʻrinishini tasvirlash; L2 / K2 oraliq testi.",
      objectives: [
        "Kiyimlarni nomlab, kim nima kiyganini ayta oladi",
        "Otlarning koʻplik shakllarini toʻgʻri yozadi va talaffuz qiladi",
        "is, has got va is wearing bilan odamni tasvirlay oladi",
      ],
      vocabulary: ["dress", "jacket", "jeans", "shirt", "shoes", "skirt", "trousers", "glasses", "long hair", "beard", "tall", "slim"],
      grammar: "Plurals: spelling (-s, -es, -ies); Describing people: is / has got / is wearing",
      teen: [
        L("Kiyimlar va koʻplik shakli", "90–91", [
          "Warm-up: About you — sevimli kiyimlaringiz qaysi, xarid qilishni yoqtirasizmi?",
          "Listening — 1–2-mashqlar (audio 124): Joséga yordam",
          "Vocabulary: Clothes — 3–5-mashqlar (audio 125), sinfdoshi nima kiyganini aytish",
          "Grammar: Plurals: spelling — 1-mashq (Grammar reference SB 152); Pronunciation: Plurals — 2–3-mashqlar (audio 126–128)",
          "4–5-mashqlar: ikki rasm orasidagi farqlar; Talking points: video 12 (Clothes)",
        ], "WB 64–65: Clothes, Listening va Grammar (plurals)"),
        L("Odamlarni tasvirlash", "92–93", [
          "Warm-up: Who is it? — sinfdoshni tashqi koʻrinishi boʻyicha topish",
          "Vocabulary: Phrases: people — 1–2-mashqlar; Reading — 3–4-mashqlar (audio 129)",
          "Grammar: Describing people — 1–4-mashqlar: is va has qisqa shakllari, rasmlar boʻyicha taʼrif",
          "Speaking — 1–3-mashqlar: karnaval kiyimidagi rasmni tasvirlash, sherigi chizadi, solishtirish",
        ], "WB 66–67: Phrases: people, Reading, Grammar va Writing (odamni tasvirlash)"),
        testLesson("Mid-level test (L2)", "Unit 11–15", false, "Xatolar ustida ishlash: test tahlilidagi mavzular boʻyicha Grammar reference (SB 148–152) mashqlari"),
      ],
      kids: [
        L("Kiyimlar", "90", [
          "Warm-up: transport va joylar takrori (Pictionary)",
          "Vocabulary: Clothes — 3-mashq (audio 125), kiyim flashcardlari va Put on your … (TPR)",
          "Listening — 1-mashq (audio 124), rasmlar boʻyicha birga gaplashish",
          "5-mashq: What are you wearing today? — juftlikda",
          "Oʻyin: Dress the teacher — kiyim kartochkalarini ustozga yopishtirish",
        ], "WB 64: kiyimlar (1–2 ta mashq)"),
        L("Koʻplik: -s, -es, -ies", "91", [
          "Warm-up: bitta va koʻp — flashcardlar bilan one dress, two dresses",
          "Grammar: Plurals: spelling — 1-mashq, uch savat oʻyini (-s, -es, -ies)",
          "Pronunciation: Plurals — 2–3-mashqlar (audio 126–128), /s/ /z/ /ɪz/ tovushlarini harakat bilan",
          "4-mashq: ikki rasm orasidagi farqlarni topish; video 12",
        ], "WB 65: plurals — 2 ta mashq"),
        L("Odamlarni tasvirlash va karnaval", "92–93", [
          "Warm-up: Guess who? oʻyini (tashqi koʻrinish kartochkalari)",
          "Vocabulary: Phrases: people — 1–2-mashqlar; Reading — 3-mashq (audio 129), ustoz bilan",
          "Grammar: Describing people — 1–3-mashqlar, is / has got / is wearing kartochkalari",
          "Speaking — 1–3-mashqlar: karnaval kiyimidagi rasm diktanti (Picture dictation)",
        ], "WB 66: odam tasviri va karnaval rasmiga 3 ta gap"),
        testLesson("Mid-level test (K2)", "Unit 11–15", true, "Test tahlilidan keyin ustoz belgilagan 10 ta soʻzni rasm bilan takrorlash"),
      ],
    },
    {
      unit: 16,
      title: "Unit 16 · Buy it! + Life Skills: Looking after our world + Review 4",
      description: "Xarid va doʻkonlar, pul va narxlar, need va want, too + sifat; kiyimlarni qayta ishlatish va Review 4 (Unit 13–16).",
      objectives: [
        "need va want farqini bilib, nima kerakligini ayta oladi",
        "Narxlarni aytib, doʻkonda xarid dialogini tuza oladi",
        "too + sifat bilan nima uchun biror narsani olmasligini tushuntira oladi",
      ],
      vocabulary: ["birthday card", "diary", "paint", "scissors", "stamps", "sweets", "rucksack", "toothbrush", "umbrella", "pound", "euro", "dollar"],
      grammar: "need, want (+ noun / + to + verb); too + adjective",
      teen: [
        L("Xarid roʻyxati: need va want", "94–95", [
          "Warm-up: About you — xarid qilishni yoqtirasizmi, nega?",
          "Vocabulary: Shopping — 1-mashq (audio 130); Listening — 2–3-mashqlar (audio 131)",
          "Grammar: need, want — 1–6-mashqlar (Grammar reference SB 153)",
          "Listening — 7-mashq (audio 132): qaysi doʻkon kerak?",
          "8-mashq: juftlikda tadbir tanlab, nima kerakligini muhokama qilish",
        ], "WB 68–69: Shopping, Listening va Grammar (need, want)"),
        L("Pul, narxlar va too", "96–97", [
          "Warm-up: How much is it? — narx kartochkalari bilan auksion oʻyini",
          "Reading: Money and prices — 1–2-mashqlar (audio 133); 3-mashq: narxlarni takrorlash (audio 134)",
          "4–6-mashqlar: valyuta belgilari, narxni topish oʻyini, buy / pay",
          "Grammar: too — 1–4-mashqlar (Grammar reference SB 153); Pronunciation: /ʃ/ and /s/ — 7-mashq (audio 135)",
          "Writing — 1-mashq: juftlikda xarid dialogi yozib, boshqa juftlikka oʻqib berish",
        ], "WB 70–71: Money and prices, Reading, Grammar (too) va Writing"),
        L("Life Skills: Looking after our world", "98–99 (Life Skills)", [
          "Warm-up: 1–2-mashqlar — eski kiyimlar bilan nima qilamiz?",
          "Reading — 3–4-mashqlar (audio 136): kiyimlarni qayta ishlatish haqida maqola",
          "5–6-mashqlar: reuse, repair, exchange, throw away iboralari",
          "Listening — 7–9-mashqlar (audio 137); Useful language — 10-mashq",
          "Project: Look after our world taqdimotini guruhda rejalashtirish",
        ], "Project: uy va maktabdagi eski narsalardan foydalanish gʻoyalari bilan taqdimot (rasmlar bilan)"),
        L("Review 4 (Unit 13–16)", "100–101 (Review 4)", [
          "Warm-up: Vocabulary 3-mashq — orqa oʻgirib, sherigi nima kiyganini aytish",
          "Grammar — 1–2-mashqlar; Vocabulary — 1–2-mashqlar",
          "Speaking — 1-mashq: kinoga borishdan oldin nima sotib olamiz? (Shall we …?)",
          "Reading — 1–2-mashqlar: qisqa xabarlar; Listening — 1-mashq (audio 138): narxlar",
          "Writing — 1-mashq: ota-onaga qisqa xat (note)",
        ], "Vocabulary list: Unit 13–16 soʻzlari va Grammar reference (SB 150–153) mashqlari"),
      ],
      kids: [
        L("Doʻkon oʻyini", "94", [
          "Warm-up: kiyimlar va koʻplik shakli takrori",
          "Vocabulary: Shopping — 1-mashq (audio 130), sinfda doʻkon: buyum rasmlari va narx yorliqlari",
          "Listening — 2–3-mashqlar (audio 131), dadaning roʻyxatini belgilash",
          "Oʻyin: Shopping list memory — roʻyxatni eslab qolib aytish",
        ], "WB 68: xarid soʻzlari (1–2 ta mashq)"),
        L("need va want", "95", [
          "Warm-up: I want … / I need … — rasm kartochkalari (ice cream, umbrella)",
          "Grammar: need, want — 1–4-mashqlar ustoz bilan; 5-mashq: qoidani birga topish",
          "Listening — 7-mashq (audio 132), doʻkonlarni moslash",
          "8-mashq: ziyofat uchun nima kerak? — guruhda roʻyxat",
        ], "WB 69: need / want — 2 ta mashq"),
        L("Pul, narxlar va too", "96–97", [
          "Warm-up: oʻyin pullari bilan sanash",
          "Reading: Money and prices — 1-mashq (audio 133), dialoglarni rollarda oʻqish; 3-mashq (audio 134)",
          "4-mashq: valyuta belgilari; Grammar: too — 1–3-mashqlar, too big / too small kiyimlar bilan",
          "Pronunciation: /ʃ/ and /s/ — 7-mashq (audio 135)",
          "Rol oʻyini: doʻkonda xarid (Writing 1-mashq ogʻzaki)",
        ], "WB 70: narxlar va rasmli narx roʻyxati"),
        L("Life Skills: Looking after our world", "98–99 (Life Skills)", [
          "Warm-up: 1-mashq — eski kiyimlaring bilan nima qilasan?",
          "Reading — 3-mashq (audio 136), ustoz bilan qisqartirib; 4-mashq: right / wrong",
          "5-mashq: reuse, repair, exchange rasmlari",
          "Listening — 7-mashq (audio 137)",
          "Project: eski quti yoki paypoqdan buyum yasab, 2 ta gap bilan tanishtirish",
        ], "Uyda bitta eski narsani qayta ishlatib, rasmini olib kelish"),
        L("Review 4: lugʻat va grammatika oʻyinlari", "100 (Review 4)", [
          "Warm-up: Unit 13–16 flashcardlari bilan Board race",
          "Grammar — 1-mashq: koʻplik qoidalari savat oʻyini bilan",
          "Vocabulary — 1–2-mashqlar: rasmdagi shahar va yotoqxona",
          "Vocabulary — 3-mashq: kim nima kiygan? oʻyini",
        ], "Unit 13–16 dan 10 ta soʻzni rasm bilan lugʻat daftariga yozish"),
        L("Review 4: koʻnikmalar va takrorlash oʻyinlari", "101 (Review 4)", [
          "Warm-up: Simon says (kiyimlar va transport)",
          "Speaking — 1-mashq: kinoga borishdan oldin xarid (Shall we …?)",
          "Grammar — 2-mashq ustoz bilan; Reading — 1-mashq: xabarlarni toʻldirish",
          "Listening — 1-mashq (audio 138), narxlarni yozish",
          "Writing — 1-mashq: onasiga 2–3 gapli note (shablon bilan)",
        ], "WB 56–71 dagi bajarilmagan mashqlardan ustoz tanlagan 2–3 tasini tugatish"),
      ],
    },
    {
      unit: 17,
      title: "Unit 17 · Different places",
      description: "Tabiat, turli joylar va uylar, qisqa va uzun sifatlarning qiyosiy darajasi; oilaviy sayohat joylari.",
      objectives: [
        "Tabiat soʻzlari bilan joylarni tasvirlay oladi",
        "Qisqa sifatlarni -er than bilan qiyoslay oladi",
        "Uzun sifatlarni more … than bilan qiyoslab, qaysi joyga borishni tanlay oladi",
      ],
      vocabulary: ["beach", "countryside", "forest", "garden", "river", "sea", "amazing", "attractive", "exciting", "popular", "unusual", "wonderful"],
      grammar: "Comparatives: short adjectives (-er than); Comparatives: long adjectives (more … than)",
      teen: [
        L("Tabiat, tinglash va -er than", "102–103", [
          "Warm-up: About you — shaharda yoki qishloqda yashaysizmi, uyingiz qanday?",
          "Vocabulary: The natural world — 1–2-mashqlar (audio 140)",
          "Listening — 3–5-mashqlar (audio 141–142): Joséning uyi; 6-mashq: qayerda yashashni xohlaysiz?",
          "Grammar: Comparatives: short adjectives — 1–3-mashqlar (Grammar reference SB 154); Pronunciation: than — 4-mashq (audio 143)",
          "5–6-mashqlar: uyini rasmlardagi uylar bilan solishtirish, rasmlar boʻyicha juftlikda qiyoslash",
        ], "WB 72–73: The natural world, Listening va Grammar (comparatives)"),
        L("Great days out: more … than", "104–105", [
          "Warm-up: toʻrtta sayohat joyi rasmi — qaysi biri yoqadi?",
          "Vocabulary: Adjectives: opinions — 1-mashq (audio 144); Reading — 2–4-mashqlar (audio 145)",
          "Talking points: video 13 (Great places) va savollar",
          "Grammar: Comparatives: long adjectives — 1–4-mashqlar; 5-mashq: toʻrt oila uchun eng mos joyni tanlash",
          "Speaking — 1–2-mashqlar: oilaviy sayohat joyini tanlab, sinfga tanishtirish",
        ], "WB 74–75: Adjectives: opinions, Reading, Grammar va Writing (sevimli sayohat joyi)"),
      ],
      kids: [
        L("Tabiat soʻzlari", "102", [
          "Warm-up: doʻkon soʻzlari va narxlar takrori",
          "Vocabulary: The natural world — 1–2-mashqlar (audio 140), tabiat rasmlari bilan Guess the picture",
          "Listening — 3-mashq (audio 141), savollarga birga javob",
          "5–6-mashqlar: rasmlardagi uylar — qaysi birida yashashni xohlaysan?",
        ], "WB 72: tabiat soʻzlari (1–2 ta mashq)"),
        L("bigger, smaller, older", "103", [
          "Warm-up: oʻquvchilarni boʻyi boʻyicha saflash — taller than oʻyini",
          "Grammar: Comparatives: short adjectives — 1–2-mashqlar, imlo qoidalari rangli kartochkalar bilan",
          "Pronunciation: than — 4-mashq (audio 143)",
          "3 va 6-mashqlar: rasmlar boʻyicha juftlikda qiyoslash",
        ], "WB 73: comparatives — 2 ta mashq"),
        L("Qiziq joylar va more … than", "104–105", [
          "Warm-up: amazing, exciting, popular — sifat kartochkalari va yuz ifodalari",
          "Vocabulary: Adjectives: opinions — 1-mashq (audio 144); Reading — 2-mashq (audio 145), ustoz bilan qismlab",
          "Talking points: video 13",
          "Grammar: Comparatives: long adjectives — 1–2-mashqlar, more … than kartochkalari",
          "Speaking — 2-mashq: juftlikda bitta joy tanlab, 3 ta gap bilan tanishtirish",
        ], "WB 74: sifatlar va sayohat joyi rasmi 2 ta gap bilan"),
      ],
    },
    {
      unit: 18,
      title: "Unit 18 · The weather + Culture: Beach culture in Australia and New Zealand",
      description: "Ob-havo va fasllar, it olmoshi, taʼtil va sayohat feʼllari, with / for / until; Avstraliya va Yangi Zelandiyadagi plyaj madaniyati.",
      objectives: [
        "Ob-havo va fasllarni tasvirlab, it bilan gapira oladi",
        "with, for, until bilan taʼtil haqida maʼlumot bera oladi",
        "Taʼtildan doʻstiga otkritka yoza oladi",
      ],
      vocabulary: ["autumn", "winter", "spring", "summer", "rain", "snow", "sun", "wind", "catch", "fly", "stay", "tent"],
      grammar: "it (weather; subject and object); Prepositions: with, for, until",
      teen: [
        L("Ob-havo va it", "106–107", [
          "Warm-up: About you — yilning sevimli fasli qaysi, nega?",
          "Vocabulary: Weather — 1-mashq (audio 146)",
          "Reading: What do you think about the weather? — 2–4-mashqlar (audio 147)",
          "Grammar: it — 1–5-mashqlar: soʻrovnoma va sherigi haqida sinfga aytib berish (Grammar reference SB 155)",
          "Pronunciation: Vowel sounds — 5-mashq (audio 148); Talking points: video 14 (The weather)",
        ], "WB 76–77: Weather, Reading va Grammar (it)"),
        L("Taʼtil: tinglash, with / for / until va otkritka", "108–109", [
          "Warm-up: rasmlar boʻyicha — bu odamlar taʼtilda nima qilyapti?",
          "Vocabulary va Listening: Holidays — 1–3-mashqlar (audio 149): uchta telefon xabari",
          "Grammar: Prepositions: with, for, until — 1–2-mashqlar (Grammar reference SB 155)",
          "Vocabulary — 4–7-mashqlar: taʼtil haqida gaplar, sayohat feʼllari va get soʻzining maʼnolari",
          "Writing — 1-mashq: taʼtildan doʻstga otkritka va sinfga oʻqib berish",
        ], "WB 78–79: Holidays, Listening, Grammar va Writing (otkritka)"),
        L("Culture: Beach culture in Australia and New Zealand", "110–111 (Culture)", [
          "Warm-up: 1-mashq — plyajga qanchalik tez-tez borasiz?; Factfile",
          "Reading: Kiwi Summer Camp — 2–3-mashqlar (audio 150)",
          "4–6-mashqlar: snorkelling, kayaking, sandboarding soʻzlari va jadval",
          "Listening — 7–8-mashqlar (audio 151): Shane va surfing lageri; Culture video 15 (A Trip to New Zealand)",
          "Project: plyajdagi yozgi lager uchun reklama varaqasi (guruhda)",
        ], "Project: yozgi lager varaqasini tugatish (nomi, joyi, muddati, kun davomidagi mashgʻulotlar)"),
      ],
      kids: [
        L("Ob-havo va fasllar", "106", [
          "Warm-up: tabiat soʻzlari va comparatives takrori",
          "Vocabulary: Weather — 1-mashq (audio 146), ob-havo harakatlari bilan TPR (yomgʻir, shamol, qor)",
          "Qoʻshiq: How is the weather? va fasllar qoʻshigʻi",
          "Reading — 3-mashq (audio 147), ustoz bilan 3–4 ta xabarni oʻqish",
        ], "WB 76: ob-havo soʻzlari (1–2 ta mashq)"),
        L("It is cold today!", "107", [
          "Warm-up: bugungi ob-havo — deraza oldida It is … deyish",
          "Grammar: it — 1–2-mashqlar ustoz bilan",
          "3-mashq: soʻrovnoma savollarini juftlikda soʻrash",
          "Pronunciation: Vowel sounds — 5-mashq (audio 148), bir xil tovushli soʻzlarni juftlash oʻyini; video 14",
        ], "WB 77: it — 2 ta mashq"),
        L("Taʼtil va otkritka", "108–109", [
          "Warm-up: taʼtil rasmlari — Where are they? What are they doing?",
          "Listening: Holidays — 2-mashq (audio 149), xabarlarni rasmlarga moslash",
          "Grammar: with, for, until — 1-mashqdagi otkritkani birga toʻldirish",
          "Vocabulary — 5-mashq: sayohat feʼllari va joylar kartochkalari",
          "Writing: otkritkani shablon asosida 3–4 gap bilan yozish va bezash",
        ], "WB 78: taʼtil soʻzlari va otkritkani tugatish"),
        L("Culture: Beach culture in Australia and New Zealand", "110–111 (Culture)", [
          "Warm-up: xaritada Avstraliya va Yangi Zelandiyani topish; 1-mashq",
          "Reading — 2-mashq (audio 150), rasmlar orqali",
          "4-mashq: mask, paddle, board — rasm va harakat bilan",
          "Culture video 15 va Listening — 7-mashq (audio 151)",
          "Project: yozgi lager plakati (nomi va 3 ta mashgʻulot rasmi)",
        ], "Plakatga 3 ta gap yozib kelish"),
      ],
    },
    {
      unit: 19,
      title: "Unit 19 · A fantastic concert",
      description: "Konsert haqidagi hikoya, sifatlar, Past simple: was / were va hozirgi va oʻtgan zamondagi Wh- savollar.",
      objectives: [
        "was / were bilan oʻtgan voqealar haqida gapira oladi",
        "Voqea va odamlarni sifatlar bilan tasvirlay oladi",
        "Hozirgi va oʻtgan zamonda Wh- savollar tuzib, intervyu oʻtkaza oladi",
      ],
      vocabulary: ["difficult", "easy", "excited", "friendly", "late", "loud", "brilliant", "heavy", "pleased", "quick", "ready", "strong"],
      grammar: "Past simple: be (was / were, questions and short answers); Wh- questions in the present and past",
      teen: [
        L("Konsert hikoyasi va was / were", "112–113", [
          "Warm-up: About you — doʻstlar bilan qayerga borishni yoqtirasiz?",
          "Vocabulary: Adjectives (1) — 1–3-mashqlar (audio 152): rasmlarni tartiblash va sifatlar",
          "Grammar: Past simple: be — 1–3-mashqlar (Grammar reference SB 156)",
          "Pronunciation: was — 4-mashq (audio 153)",
          "4-mashq: Where were you …? savollari bilan juftlikda savol-javob",
        ], "WB 80–81: Adjectives, Listening va Grammar (was / were)"),
        L("Sound engineer: sifatlar va Wh- savollar", "114–115", [
          "Warm-up: Where were you yesterday at six? zanjiri",
          "Reading: Sandy Berry haqidagi maqola — 1–3-mashqlar (audio 154)",
          "Vocabulary: Adjectives (2) — 4-mashq",
          "Grammar: Wh- questions in the present and past — 1–4-mashqlar (Grammar reference SB 156)",
          "Speaking — 1–2-mashqlar: savollarni sherigiga va ustozga berish; Talking points",
        ], "WB 82–83: Adjectives, Reading, Grammar va Writing"),
      ],
      kids: [
        L("Konsert hikoyasi va sifatlar", "112", [
          "Warm-up: ob-havo va fasllar takrori",
          "Vocabulary: Adjectives (1) — 1–2-mashqlar (audio 152), rasmlarni juftlikda tartiblash",
          "3-mashq: sifatlarni harakat bilan koʻrsatish (fast / slow, loud, late)",
          "Listening: hikoyani qayta tinglab rasmlarni koʻrsatish (audio 152)",
        ], "WB 80: sifatlar (1–2 ta mashq)"),
        L("was / were", "113", [
          "Warm-up: kecha qayerda eding? — rasm kartochkalari (at home, at school, at the park)",
          "Grammar: Past simple: be — 1–2-mashqlar, was / were kartochkalari",
          "Pronunciation: was — 4-mashq (audio 153)",
          "3-mashq ustoz bilan; Where were you …? savol zanjiri",
        ], "WB 81: was / were — 2 ta mashq"),
        L("Savollar va intervyu", "114–115", [
          "Warm-up: savol soʻzlari (Who, What, Where, When, Why, How) kartochkalari",
          "Reading — 1-mashq (audio 154), maqolaning birinchi qismini birga oʻqish",
          "Vocabulary: Adjectives (2) — 4-mashq ustoz bilan",
          "Grammar: Wh- questions — 1-mashq; 4-mashq: soʻzlardan savol tuzish oʻyini",
          "Speaking — 1-mashq: sherigidan 3 ta savol soʻrash",
        ], "WB 82: sifatlar va sherigi uchun 3 ta savol"),
      ],
    },
    {
      unit: 20,
      title: "Unit 20 · Animals + Life Skills: Deciding things together + Review 5 + End-of-level test",
      description: "Yovvoyi, uy va ferma hayvonlari, toʻgʻri feʼllarning Past simple tasdiq va inkor shakllari; birgalikda qaror qabul qilish, Review 5 va L2 / K2 yakuniy testi.",
      objectives: [
        "Yovvoyi, uy va ferma hayvonlarini nomlab tasvirlay oladi",
        "Toʻgʻri feʼllarning Past simple shakli (-ed) va did not bilan oʻtgan voqealarni ayta oladi",
        "Oʻquv yili haqida sharh yoza oladi va guruhda birgalikda qaror qabul qila oladi",
      ],
      vocabulary: ["bear", "crocodile", "elephant", "giraffe", "monkey", "tiger", "cow", "donkey", "kitten", "puppy", "rabbit", "sheep"],
      grammar: "Past simple regular verbs (+); Past simple (−) with did not",
      teen: [
        L("Yovvoyi hayvonlar va Past simple (+)", "116–117", [
          "Warm-up: About you — sevimli hayvonlaringiz qaysi, uy hayvoningiz bormi?",
          "Vocabulary: Wild animals — 1–2-mashqlar (audio 155): hayvonni tasvirlab topish",
          "Reading: Alessandroning yozgi kuni — 3–5-mashqlar (audio 156)",
          "Grammar: Past simple (+) — 1–4-mashqlar (Grammar reference SB 157); Pronunciation: Extra syllable — 5-mashq (audio 157)",
          "6-mashq: oʻtgan dam olish kuni haqida juftlikda gapirish",
        ], "WB 84–85: Wild animals, Reading va Grammar (Past simple +)"),
        L("Uy va ferma hayvonlari, Past simple (−)", "118–119", [
          "Warm-up: Last weekend I … zanjiri",
          "Vocabulary: Pets and farm animals — 1–3-mashqlar (audio 158–159)",
          "Listening — 4–5-mashqlar (audio 160): Zaraning hayvonlari",
          "Grammar: Past simple (−) — 1–4-mashqlar (audio 161): hikoyani oʻtgan zamonga oʻtkazish",
          "Writing — 1-mashq: maktab sayti uchun oʻquv yili sharhi (Prepare Level 1 dagi sevimli unitlar bilan)",
        ], "WB 86–87: Pets and farm animals, Listening, Grammar va Writing (sharh)"),
        L("Life Skills: Deciding things together", "120–121 (Life Skills)", [
          "Warm-up: 1-mashq — doʻstlar bilan film tanlash qiyinmi?",
          "Reading — 2–6-mashqlar (audio 162): film afishalari va xabarlar",
          "Listening — 7–8-mashqlar (audio 163): pitsa uchun tanlov",
          "Useful language — 9–10-mashqlar: I really like … / I really do not like … / I think … is OK.",
          "Project: guruhda shanba kungi kino va pitsa rejasi — birgalikda qaror qabul qilib, sinfga aytish",
        ], "Project yakuni: guruh qarori va sabablarini 5–6 gap bilan yozish"),
        L("Review 5 (Unit 17–20)", "122–123 (Review 5)", [
          "Warm-up: Unit 17–20 soʻzlari boʻyicha jamoaviy viktorina",
          "Grammar — 1–3-mashqlar; Vocabulary — 1–2-mashqlar",
          "Listening — 1-mashq (audio 164): Gavin sayohatlaridagi ob-havo",
          "Reading — 1-mashq: haikular (audio 165); Speaking — 1-mashq: sayyoh bilan intervyu",
          "Writing — 1-mashq: oʻz haikusini yozish",
        ], "Vocabulary list: Unit 17–20 soʻzlari va Grammar reference (SB 154–157) mashqlari; yakuniy testga tayyorlanish"),
        testLesson("End-of-level test (L2)", "Unit 11–20 (asosan Unit 16–20)", false, "Keyingi daraja oldidan: test tahlilidagi xatolar va Grammar reference (SB 153–157) mashqlari"),
      ],
      kids: [
        L("Yovvoyi hayvonlar", "116", [
          "Warm-up: sifatlar va was / were takrori",
          "Vocabulary: Wild animals — 1-mashq (audio 155), hayvonlar harakati va tovushi bilan TPR",
          "2-mashq: hayvonni tasvirlab topish (It has got a long neck.)",
          "Reading — 3-mashq (audio 156), sarlavha tanlash, ustoz bilan qismlab oʻqish",
        ], "WB 84: hayvonlar soʻzlari (1–2 ta mashq)"),
        L("Past simple: -ed", "117", [
          "Warm-up: kecha nima qilding? — rasm kartochkalari",
          "Grammar: Past simple (+) — 1–3-mashqlar, -ed / -ied kartochkalarini saralash",
          "Pronunciation: Extra syllable — 5-mashq (audio 157), qarsak bilan",
          "6-mashq: oʻtgan dam olish kuni haqida 2 ta gap",
        ], "WB 85: Past simple (+) — 2 ta mashq"),
        L("Uy va ferma hayvonlari, did not", "118–119", [
          "Warm-up: Old MacDonald had a farm qoʻshigʻi",
          "Vocabulary: Pets and farm animals — 1–3-mashqlar (audio 158–159), uy va ferma ustunlari",
          "Listening — 4-mashq (audio 160)",
          "Grammar: Past simple (−) — 1–2-mashqlar (audio 161), did not kartochkalari",
          "Writing: oʻquv yili haqida 3–4 gap (sevimli unit va klub) — shablon bilan",
        ], "WB 86: hayvonlar va oʻquv yili haqidagi gaplarni tugatish"),
        L("Life Skills: Deciding things together", "120–121 (Life Skills)", [
          "Warm-up: 1-mashq — sevimli film va doʻstlar bilan tanlash",
          "Reading — 2–3-mashqlar (audio 162), afishalar va tanlov",
          "Listening — 7-mashq (audio 163): pitsaga nima qoʻyishdi?",
          "Useful language — 9-mashq: I really like … / I think … is OK.",
          "Project: guruhda qogʻoz pitsa — har kim bitta masalliq taklif qiladi, birgalikda tanlanadi",
        ], "Oila bilan birgalikda dam olish kuni rejasini tuzib, 2 ta gap yozish"),
        L("Review 5: lugʻat va grammatika oʻyinlari", "122 (Review 5)", [
          "Warm-up: Unit 17–20 flashcardlari bilan Board race",
          "Grammar — 1-mashq: qiyoslash oʻyini (Apples are nicer than chocolate.)",
          "Grammar — 3-mashq: hikoyani ustoz bilan oʻtgan zamonda toʻldirish",
          "Vocabulary — 1–2-mashqlar: tabiat va hayvonlar topishmoqlari",
        ], "Unit 17–20 dan 10 ta soʻzni rasm bilan lugʻat daftariga yozish"),
        L("Review 5: koʻnikmalar va takrorlash oʻyinlari", "123 (Review 5)", [
          "Warm-up: ob-havo harakatlari bilan Simon says",
          "Listening — 1-mashq (audio 164), oylar va ob-havoni chiziq bilan bogʻlash",
          "Reading — 1-mashq (audio 165): haikularni rasmlarga moslash",
          "Speaking — 1-mashq: sayyoh bilan intervyu (rolda, 3–4 savol)",
          "Writing — 1-mashq: ob-havo haqida qisqa haiku (birga)",
        ], "Haikuni rasm bilan bezash; yakuniy test uchun soʻzlarni takrorlash"),
        testLesson("End-of-level test (K2)", "Unit 11–20 (asosan Unit 16–20)", true, "Oʻquv yili yakuni: sevimli chant yoki haikuni oila oldida aytib berish va WB dagi bajarilmagan mashqlarni tugatish"),
      ],
    },
  ],
};

// Jami darslar (har biri 90 daqiqa, haftasiga 3 ta):
//   L1 (Teens 13–16, Starter + Unit 1–10): 31 dars (~10 hafta)
//   K1 (Kids 8–12, Starter + Unit 1–10):   44 dars (~15 hafta)
//   L2 (Teens 13–16, Unit 11–20):          30 dars (~10 hafta)
//   K2 (Kids 8–12, Unit 11–20):            43 dars (~14–15 hafta)
