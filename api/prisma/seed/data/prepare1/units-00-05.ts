// Cambridge Prepare 2e, Level 1 (A1) — Starter va Unit 1–5 uchun batafsil darsma-dars rejalar.
// Har dars 90 daqiqa. Kitobdan faqat sahifa, mashq va audio raqamlariga havola qilinadi;
// topshiriqlar oʻz soʻzimiz bilan qisqa bayon etilgan, matn va javoblar koʻchirilmagan.

import type { PlanUnit } from "./types.js";

export const UNITS_00_05: PlanUnit[] = [
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
      {
        focus: "Alifbo, sonlar va hafta kunlari",
        sb: "10–11",
        maqsad: [
          "Oʻquvchilar ingliz alifbosining 26 harfini tanib, oʻz ismi va familiyasini harflab ayta oladilar.",
          "Oʻquvchilar 1–20 sonlarni eshitib taniydilar va ogʻzaki tez ayta oladilar.",
          "Oʻquvchilar hafta kunlarini tartib bilan aytib, What is your name? va How old are you? savollarini bera oladilar.",
        ],
        lugat: [
          "alphabet – alifbo",
          "letter – harf",
          "number – son, raqam",
          "name – ism",
          "spell – harflab aytish",
          "Monday – dushanba",
          "Wednesday – chorshanba",
          "Saturday – shanba",
          "Sunday – yakshanba",
          "How old are you? – Necha yoshdasan?",
        ],
        resurslar: [
          "SB 8–11 (Welcome to Prepare va Starter unit)",
          "Audio 01–06",
          "Alifbo harflari va 1–20 sonlar yozilgan kartochkalar",
          "Doska va marker, proyektor",
          "Bingo uchun boʻsh 3×3 katakli varaqlar",
        ],
        blocks: [
          {
            title: "Warm-up va tanishuv",
            minutes: 10,
            points: [
              "Ustoz oʻzini inglizcha tanishtiradi va SB 8–9 dagi Welcome to Prepare sahifasi orqali kitob tuzilishini koʻrsatadi.",
              "Oʻquvchilar doira boʻlib toʻp uzatadi: toʻpni olgan kishi Hello, I am … deb ismini aytadi.",
              "Doskaga darsning uchta maqsadi yoziladi, oʻquvchilar daftariga sana va mavzuni yozadi.",
            ],
          },
          {
            title: "Vocabulary: The alphabet (SB 10, 1–3-mashqlar)",
            minutes: 20,
            points: [
              "1-mashq: audio 01 tinglanadi, alifbo ikki marta takrorlanadi.",
              "Ustoz harflarni tovushi boʻyicha guruhlab doskaga yozadi (A H J K / B C D E G / F L M N S X).",
              "2–3-mashqlar: audio 02–03 dagi harflab aytilgan ismlar yozib olinadi va juftlikda tekshiriladi.",
              "Juftlikda: har kim oʻz ism-familiyasini sherigiga harflab aytadi, sherigi yozib beradi va koʻrsatadi.",
            ],
          },
          {
            title: "Vocabulary: Numbers 1–20 (SB 10, 4–7-mashqlar)",
            minutes: 15,
            points: [
              "4–5-mashqlar: audio 04–05 bilan sonlar tinglanadi va takrorlanadi.",
              "Sonlar zanjiri: sinf navbat bilan 1 dan 20 gacha, soʻng teskari tartibda sanaydi.",
              "6–7-mashqlar bajariladi; ustoz thirteen va thirty tipidagi chalgʻituvchi juftlikni hozircha faqat eshittirib oʻtadi.",
            ],
          },
          {
            title: "Vocabulary: Days of the week (SB 11, 8-mashq)",
            minutes: 15,
            points: [
              "8-mashq: audio 06 bilan hafta kunlari tinglanadi va takrorlanadi.",
              "Kartochkalar aralashtiriladi, kichik guruhlar kunlarni tartib bilan terish boʻyicha musobaqalashadi.",
              "Ustoz qoidani taʼkidlaydi: hafta kunlari inglizchada doim katta harf bilan yoziladi.",
              "Oʻquvchilar oʻz dars jadvalini inglizcha kun nomlari bilan daftariga koʻchiradi.",
            ],
          },
          {
            title: "Speaking: sinf soʻrovi (SB 11, Speaking 1-mashq)",
            minutes: 20,
            points: [
              "Ustoz doskada namuna savollarni tuzadi: What is your name? How do you spell it? How old are you?",
              "Oʻquvchilar uch ustunli jadval chizadi va sinf boʻylab yurib kamida besh kishidan soʻraydi.",
              "Ism faqat harflab aytiladi — daftar koʻrsatilmaydi, shunda alifbo amalda mustahkamlanadi.",
              "Uch oʻquvchi yigʻilgan maʼlumotni sinfga aytib beradi: This is Aziza. She is 13.",
            ],
          },
          {
            title: "Yakun, baholash va uy vazifasi",
            minutes: 10,
            points: [
              "Tezkor tekshiruv: ustoz besh harf va besh sonni aytadi, oʻquvchilar daftarga yozadi va oʻzaro tekshiradi.",
              "Hafta kunlari birga takrorlanadi; ustoz uy vazifasini tushuntirib, WB betlarini koʻrsatadi.",
            ],
          },
        ],
        uyga: [
          "WB 4–5: 1–6-mashqlar (alifbo, sonlar, hafta kunlari).",
          "Oʻz ism-familiyasini va uch oila aʼzosining ismini harflab aytishni uyda mashq qilib kelish.",
        ],
        ustozga: "Eng koʻp uchraydigan xato — G va J hamda E va I harflarining talaffuzi aralashib ketishi; bu ikki juftlikni alohida mashq qiling. Hafta kunlari katta harf bilan yozilishini birinchi darsdanoq talab qiling, keyin tuzatish qiyin boʻladi.",
      },
      {
        focus: "Sinf buyumlari, a / an, ranglar, this / that va oylar",
        sb: "12–13",
        maqsad: [
          "Oʻquvchilar sinf buyumlarini nomlab, ular oldida a yoki an ni toʻgʻri qoʻllay oladilar.",
          "Oʻquvchilar asosiy ranglarni aytib, buyumni rang bilan tasvirlay oladilar.",
          "Oʻquvchilar this, that, these, those ni farqlab, oylarni aytadilar va tugʻilgan kunini soʻray oladilar.",
        ],
        lugat: [
          "board – doska",
          "desk – parta",
          "pencil case – qalamdon",
          "ruler – chizgʻich",
          "rubber – oʻchirgʻich",
          "black – qora",
          "yellow – sariq",
          "orange – toʻq sariq",
          "this / that – bu / ana u",
          "birthday – tugʻilgan kun",
        ],
        resurslar: [
          "SB 12–13, Grammar reference SB 136",
          "Audio 07–10",
          "Sinf buyumlari (haqiqiy: ruler, rubber, pencil case) va rang kartochkalari",
          "Doska, marker, proyektor",
        ],
        blocks: [
          {
            title: "Warm-up: oʻtgan darsni takrorlash",
            minutes: 8,
            points: [
              "Spelling bee: ustoz besh soʻzni harflab aytadi, oʻquvchilar yozadi.",
              "1–20 sonlar zanjiri, soʻng faqat juft sonlar bilan takror.",
              "Hafta kunlarini tez aytish musobaqasi (ikki jamoa).",
            ],
          },
          {
            title: "Vocabulary: The classroom (SB 12, 1-mashq)",
            minutes: 15,
            points: [
              "1-mashq: audio 07 bilan sinf buyumlari tinglanadi va rasmga moslanadi.",
              "Ustoz haqiqiy buyumlarni koʻtarib nomini aytadi, sinf xor bilan takrorlaydi.",
              "Oʻquvchilar sinfda koʻrgan buyumlarini 2 daqiqada roʻyxat qilib yozadi va sanab solishtiradi.",
            ],
          },
          {
            title: "Grammar: a / an (SB 12, Grammar 1-mashq)",
            minutes: 15,
            points: [
              "Ustoz doskaga misol yozib, qoidani oʻquvchilarning oʻzidan chiqaradi: undosh tovush oldidan a, unli tovush oldidan an.",
              "1-mashq bajariladi, javoblar juftlikda tekshiriladi; Grammar reference SB 136 ochiladi.",
              "Zanjir mashqi: har bir oʻquvchi sinfdagi bitta buyumni koʻrsatib It is a … yoki It is an … deydi.",
            ],
          },
          {
            title: "Vocabulary: Colours (SB 12, 1–3-mashqlar)",
            minutes: 12,
            points: [
              "1–3-mashqlar: audio 08 bilan ranglar tinglanadi va takrorlanadi.",
              "Soʻzni emas, rangni ayt oʻyini: doskada soʻz boshqa rangda yozilgan, oʻquvchi rangni aytishi kerak.",
              "Juftlikda buyumlar rang bilan tasvirlanadi: a black board, an orange pencil case.",
            ],
          },
          {
            title: "Grammar: this, that, these, those (SB 13, 1–3-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz doskaga yaqin va uzoq, birlik va koʻplik chizmasini chizib, toʻrt shaklni joylashtiradi.",
              "1–3-mashqlar bajariladi; javoblar umumiy tekshiriladi.",
              "Juftlikda savol-javob: What is this? / What are those? — sinfdagi buyumlarni koʻrsatib.",
            ],
          },
          {
            title: "Vocabulary: Months va tugʻilgan kun soʻrovnomasi (SB 13, 1–3-mashqlar)",
            minutes: 15,
            points: [
              "1–2-mashqlar: audio 09–10 bilan oylar tinglanadi va tartibga solinadi.",
              "3-mashq: When is your birthday? savoli bilan sinf jadvali toʻldiriladi.",
              "Oʻquvchilar oylar boʻyicha guruhlanadi va qaysi oyda eng koʻp tugʻilgan kun borligini aniqlaydi.",
            ],
          },
          {
            title: "Yakun, baholash va uy vazifasi",
            minutes: 10,
            points: [
              "Tezkor oʻyin: ustoz buyumni koʻrsatadi, oʻquvchi a / an, rang va this / that bilan toʻliq gap tuzadi.",
              "Oylar tartib bilan birga aytiladi; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 6–7: 7–8-mashqlar, Grammar 1–3, Months 1, Listening 1, Writing 1.",
          "Oʻz qalamdonidagi besh buyumni rang va a / an bilan yozib kelish (a yellow ruler).",
        ],
        ustozga: "an faqat unli harf emas, unli tovush oldidan kelishini eslatib turing — oʻquvchilar an ruler deb xato qiladi. this / these va that / those farqini masofa bilan koʻrsating: oʻzingiz sinf boʻylab yurib namoyish qiling.",
      },
    ],
    kids: [
      {
        focus: "Alifbo va sonlar (qoʻshiq va oʻyinlar)",
        sb: "10–11",
        maqsad: [
          "Oʻquvchilar alifbo qoʻshigʻini kuylab, harflarni tanib ayta oladilar.",
          "Oʻquvchilar oʻz ismini harflab ayta oladilar.",
          "Oʻquvchilar 1–20 sonlarni sanab, eshitgan sonini taniy oladilar.",
        ],
        lugat: [
          "letter – harf",
          "number – son",
          "name – ism",
          "one, two, three – bir, ikki, uch",
          "ten – oʻn",
          "twenty – yigirma",
          "Hello – Salom",
          "spell – harflab aytish",
        ],
        resurslar: [
          "SB 10–11",
          "Audio 01–05",
          "Alifbo va son kartochkalari (katta oʻlchamda)",
          "Yumshoq toʻp, stiker va yulduzchalar",
          "Bingo uchun 3×3 katakli varaqlar",
        ],
        blocks: [
          {
            title: "Warm-up: tanishuv oʻyini",
            minutes: 10,
            points: [
              "Doira boʻlib toʻp otiladi: toʻpni olgan bola Hello, I am … deydi.",
              "Ustoz ism yozilgan bejlarni tarqatadi, har kim oʻz ismini baland ovozda aytadi.",
              "Sinf qoidalari rasmli kartochkalar bilan koʻrsatiladi: Listen, Look, Speak English.",
            ],
          },
          {
            title: "Alifbo qoʻshigʻi (SB 10, 1-mashq)",
            minutes: 15,
            points: [
              "1-mashq: audio 01 tinglanadi, alifbo qoʻshigʻi ikki marta kuylanadi.",
              "Harflar avval havoda barmoq bilan, soʻng partada yoziladi (TPR).",
              "Alifbo kartochkalari polga teriladi, ustoz aytgan harfga sakrash oʻyini oʻynaladi.",
            ],
          },
          {
            title: "Harflab aytish (SB 10, 2–3-mashqlar)",
            minutes: 12,
            points: [
              "2–3-mashqlar: audio 02–03 tinglanib, harflar daftarga yozib olinadi.",
              "Har bir bola oʻz ismini harflab aytadi, sinf doskaga birga yozadi.",
            ],
          },
          {
            title: "Phonics: unli harflar A, E, I, O, U",
            minutes: 13,
            points: [
              "Beshta unli harf kartochkasi koʻrsatiladi, har biriga alohida harakat belgilanadi.",
              "Ustoz qisqa soʻz aytadi, bolalar ichidagi unlini eshitib mos harakatni bajaradi.",
              "Mini-mashq: beshta qisqa soʻzda tushib qolgan unli harf toʻldiriladi.",
            ],
          },
          {
            title: "Vocabulary: Numbers (SB 10, 4–6-mashqlar)",
            minutes: 15,
            points: [
              "4–5-mashqlar: audio 04–05 tinglanadi, sonlar barmoq bilan koʻrsatiladi.",
              "Sanoq qoʻshigʻi kuylanadi, soʻng sakrab sanash (1–20).",
              "6-mashq bajariladi; ustoz sonlarning soʻz shaklini doskaga yozib koʻrsatadi.",
            ],
          },
          {
            title: "Oʻyin: Bingo (SB 11, 7-mashq)",
            minutes: 15,
            points: [
              "Har bir bola 3×3 katakka 1–20 orasidan toʻqqizta son yozadi.",
              "Ustoz sonlarni aytadi, qatorni toʻldirgan bola Bingo! deb baqiradi.",
              "Ikkinchi bosqichda gʻolib bola sonlarni oʻzi aytadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Alifbo qoʻshigʻi yana bir marta birga kuylanadi.",
              "Har bir bolaga yulduzcha beriladi, uy vazifasi rasm bilan tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 4: 1–3-mashqlar (alifbo va sonlar).",
          "Oʻz ismini alifbo kartochkalari bilan uyda terib, ota-onaga harflab aytib berish.",
        ],
        ustozga: "Kichik yoshda harf nomi va harf tovushi aralashadi — bu darsda faqat harf nomini talab qiling, tovushni phonics blokida alohida bering. Bingoda sonlarni sekin va ikki marta ayting, aks holda bolalar chalgʻiydi.",
      },
      {
        focus: "Hafta kunlari va sinf buyumlari",
        sb: "11–12",
        maqsad: [
          "Oʻquvchilar hafta kunlarini qoʻshiq bilan tartib bilan ayta oladilar.",
          "Oʻquvchilar sinf buyumlarini nomlab, koʻrsata oladilar.",
          "Oʻquvchilar a va an ni buyum nomi oldida ishlata boshlaydilar.",
        ],
        lugat: [
          "Monday – dushanba",
          "Tuesday – seshanba",
          "Friday – juma",
          "Sunday – yakshanba",
          "board – doska",
          "desk – parta",
          "pencil case – qalamdon",
          "ruler – chizgʻich",
          "rubber – oʻchirgʻich",
        ],
        resurslar: [
          "SB 11–12",
          "Audio 06–07",
          "Hafta kunlari va sinf buyumlari kartochkalari",
          "Haqiqiy sinf buyumlari, sehrli xalta",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: oʻtgan darsni takrorlash",
            minutes: 10,
            points: [
              "Alifbo qoʻshigʻi birga kuylanadi.",
              "1–20 sonlar zanjiri, soʻng bir qatorli tezkor Bingo.",
            ],
          },
          {
            title: "Vocabulary: Days (SB 11, 8-mashq)",
            minutes: 12,
            points: [
              "8-mashq: audio 06 tinglanadi, kunlar takrorlanadi.",
              "Hafta kunlari qoʻshigʻi kuylanadi, har kunga bitta harakat qoʻshiladi (TPR).",
            ],
          },
          {
            title: "Kunlar bilan oʻyinlar",
            minutes: 15,
            points: [
              "Kartochkalar aralashtiriladi, guruhlar kunlarni tartib bilan terish boʻyicha musobaqalashadi.",
              "Ustoz kunni aytadi, bola keyingi kunni aytadi (zanjir).",
              "Yetti bola kun kartochkasini olib, tartib bilan saf tortadi.",
            ],
          },
          {
            title: "Speaking: tanishuv savollari (SB 11, Speaking 1-mashq)",
            minutes: 15,
            points: [
              "Ustoz ikki savolni doskaga rasm bilan yozadi: What is your name? / How old are you?",
              "Bolalar sinf boʻylab yurib uch kishidan soʻraydi va ismni kichik jadvalga yozadi.",
              "Uch bola sinfga sherigini tanishtiradi: This is Ali. He is 9.",
            ],
          },
          {
            title: "Vocabulary: The classroom (SB 12, 1-mashq)",
            minutes: 13,
            points: [
              "1-mashq: audio 07 tinglanadi, buyumlar rasmga moslanadi.",
              "Flashcardlar koʻrsatiladi, sinf xor bilan takrorlaydi.",
              "Touch the board! / Touch your ruler! — TPR oʻyini oʻynaladi.",
            ],
          },
          {
            title: "Grammar: a / an (SB 12, 1-mashq)",
            minutes: 15,
            points: [
              "Ustoz ikki qutini koʻrsatadi: biriga a, ikkinchisiga an yoziladi, buyum kartochkalari saralanadi.",
              "1-mashq birga bajariladi.",
              "Har bir bola bitta buyumni koʻtarib It is a … yoki It is an … deydi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Hafta kunlari qoʻshigʻi yana bir marta kuylanadi.",
              "Sehrli xaltadan buyum olib nomini aytish bilan dars yakunlanadi; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 5–6: 4–7-mashqlar (kunlar va sinf buyumlari).",
          "Qalamdondagi uchta buyumni rasm chizib, tagiga inglizcha nomini yozib kelish.",
        ],
        ustozga: "Bolalar Tuesday va Thursday ni aralashtiradi — bu ikki kunni alohida harakat bilan bogʻlang. a / an ni qoida sifatida emas, quloq bilan tanlash orqali oʻrgating: koʻp misol eshittiring.",
      },
      {
        focus: "Ranglar, this / that va oylar",
        sb: "12–13",
        maqsad: [
          "Oʻquvchilar asosiy ranglarni aytib, buyumni rang bilan tasvirlay oladilar.",
          "Oʻquvchilar this va that ni yaqin va uzoq buyum uchun ishlata oladilar.",
          "Oʻquvchilar oylarni tartib bilan aytib, tugʻilgan kuni qaysi oyda ekanini ayta oladilar.",
        ],
        lugat: [
          "black – qora",
          "yellow – sariq",
          "orange – toʻq sariq",
          "red – qizil",
          "blue – koʻk",
          "this – bu (yaqin)",
          "that – ana u (uzoq)",
          "January – yanvar",
          "June – iyun",
          "birthday – tugʻilgan kun",
        ],
        resurslar: [
          "SB 12–13",
          "Audio 08–10",
          "Rang kartochkalari va rangli qalamlar",
          "Oylar kartochkalari, sehrli xalta",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: sehrli xalta",
            minutes: 10,
            points: [
              "Bola xaltaga qoʻl solib buyumni ushlaydi va koʻrmasdan nomini taxmin qiladi.",
              "Toʻgʻri topsa sinf qarsak chaladi; oʻyin besh-olti bola bilan takrorlanadi.",
            ],
          },
          {
            title: "Vocabulary: Colours (SB 12, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "1–2-mashqlar: audio 08 tinglanadi, ranglar takrorlanadi.",
              "Ustoz rang kartochkasini koʻtaradi, bolalar shu rangdagi narsani sinfda topib koʻrsatadi.",
              "Ranglar qoʻshigʻi kuylanadi.",
            ],
          },
          {
            title: "Rang oʻyinlari (SB 12, 3-mashq)",
            minutes: 12,
            points: [
              "3-mashq bajariladi.",
              "Soʻzni emas, rangni ayt oʻyini: doskada soʻz boshqa rangda yozilgan.",
              "Juftlikda buyumlar rang bilan aytiladi: a yellow pencil case.",
            ],
          },
          {
            title: "Grammar: this, that, these, those (SB 13, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz yaqindagi va uzoqdagi buyumni koʻrsatib farqni harakat bilan namoyish qiladi (TPR).",
              "1–2-mashqlar birga bajariladi.",
              "Bolalar juftlikda buyum koʻrsatib This is a … / That is a … deydi.",
            ],
          },
          {
            title: "Vocabulary: Months (SB 13, 1–2-mashqlar)",
            minutes: 13,
            points: [
              "1–2-mashqlar: audio 09–10 tinglanadi, oylar takrorlanadi.",
              "Oylar qoʻshigʻi kuylanadi, kartochkalar tartib bilan teriladi.",
            ],
          },
          {
            title: "Tugʻilgan kunlar qatori (SB 13, 3-mashq)",
            minutes: 15,
            points: [
              "Bolalar oʻz tugʻilgan oyi boʻyicha sinfda saf tortadi (yanvardan dekabrgacha).",
              "3-mashqdagi jadval ustoz bilan birga toʻldiriladi.",
              "Har bir bola My birthday is in … deb aytadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ranglar va oylar qoʻshiqlari qisqacha takrorlanadi.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 6–7: 8-mashq (ranglar), Grammar 1–3 (boʻyash), Months 1.",
          "Oʻz tugʻilgan kunini rasm bilan chizib, oy nomini inglizcha yozib kelish.",
        ],
        ustozga: "this va that ni faqat rasmdan emas, sinfda haqiqiy masofa bilan koʻrsating — bolalar shundagina farqni his qiladi. Oylar 12 ta, bir darsda hammasini yodlashni talab qilmang; qoʻshiq va qator oʻyini bilan tanishtirish kifoya.",
      },
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
      {
        focus: "Shaxsiy buyumlar, tanishuv dialogi va be (birlik)",
        sb: "14–15",
        maqsad: [
          "Oʻquvchilar shaxsiy buyumlar nomini aytib, ularni egasi bilan bogʻlay oladilar.",
          "Oʻquvchilar my, your, his, her ni toʻgʻri tanlab ishlata oladilar.",
          "Oʻquvchilar am / is / are bilan oʻzi va sherigi haqida qisqa gaplar tuza oladilar.",
        ],
        lugat: [
          "bag – sumka",
          "camera – fotoapparat",
          "chair – stul",
          "phone – telefon",
          "photo – surat",
          "watch – qoʻl soati",
          "student – oʻquvchi, talaba",
          "friend – doʻst",
          "his / her – uning (erkak / ayol)",
        ],
        resurslar: [
          "SB 14–15, Grammar reference SB 137",
          "Audio 11–13",
          "Shaxsiy buyumlar flashcardlari",
          "Doska, marker, proyektor",
          "Oʻquvchilarning oʻz buyumlari (telefon, soat, sumka)",
        ],
        blocks: [
          {
            title: "Warm-up: About you (SB 14)",
            minutes: 10,
            points: [
              "Juftlikda oʻtgan darsdagi savollar takrorlanadi: What is your name? How do you spell it?",
              "Ustoz yangi savolni qoʻshadi: Where are you from? va doskaga yozadi.",
              "Uch-toʻrt oʻquvchi sherigini sinfga tanishtiradi.",
            ],
          },
          {
            title: "Vocabulary: Objects and people (SB 14, 1-mashq)",
            minutes: 15,
            points: [
              "1-mashq: audio 11 tinglanadi, soʻzlar rasmga moslanadi va takrorlanadi.",
              "Flashcardlar bilan tezkor aytish; ustoz urgʻuni koʻrsatadi (CAmera, PHOto).",
              "Oʻquvchilar oʻz stolidagi buyumlarni sanab, roʻyxatni sherigi bilan solishtiradi.",
            ],
          },
          {
            title: "Listening: tanishuv dialogi (SB 14, 2–5-mashqlar)",
            minutes: 15,
            points: [
              "2–3-mashqlar: audio 12 tinglanadi, umumiy mazmun boʻyicha topshiriq bajariladi.",
              "4–5-mashqlar: audio 13 ikki marta tinglanadi, tafsilotlar toʻldiriladi.",
              "Uch kishilik guruhda dialog oʻz ismlari bilan qayta oʻqiladi.",
            ],
          },
          {
            title: "Grammar: Determiners va be singular (+) (SB 15, 1–4-mashqlar)",
            minutes: 20,
            points: [
              "Determiners 1–2-mashqlar: ustoz his / her ni sinfdagi haqiqiy buyumlar bilan namoyish qiladi.",
              "be singular (+) 3–4-mashqlar: toʻliq va qisqa shakllar jadvali doskada tuziladi.",
              "Grammar reference SB 137 ochilib, qoida oʻqiladi va daftarga koʻchiriladi.",
              "Tezkor mashq: ustoz oʻquvchini koʻrsatadi, sinf This is his bag. yoki This is her watch. deydi.",
            ],
          },
          {
            title: "Speaking: telefon raqami va tanishtirish (SB 15, 5–7-mashqlar)",
            minutes: 20,
            points: [
              "5-mashq: What is your phone number? savoli bilan raqam soʻraladi (oʻylab topilgan raqamlar bilan).",
              "6-mashq: har bir oʻquvchi oʻz kartochkasini (ism, yosh, mamlakat, buyum) tayyorlaydi.",
              "7-mashq: guruh oʻyini — kartochkalar aralashtirilib, egasi topiladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Doskada besh gapdagi xato shakllar birga tuzatiladi (I is / He are).",
              "Uy vazifasi tushuntiriladi va WB betlari koʻrsatiladi.",
            ],
          },
        ],
        uyga: [
          "WB 8–9: Vocabulary 1–2, Listening 3–5, Grammar 1–4.",
          "Oʻz buyumlaridan beshtasini yozib, har biriga my yoki his / her bilan gap tuzish.",
        ],
        ustozga: "Eng koʻp uchraydigan xato — his / her ni buyumga qarab tanlash, chunki oʻzbekchada uning shakli bir xil. Egasi erkak boʻlsa his, ayol boʻlsa her ekanini haqiqiy oʻquvchilar misolida bir necha marta takrorlang.",
      },
      {
        focus: "Mamlakatlar, millatlar va be (+ / −)",
        sb: "16–17",
        maqsad: [
          "Oʻquvchilar mamlakat va millat soʻzlarini juftlab ayta oladilar.",
          "Oʻquvchilar be ning koʻplik va inkor shakllarini toʻgʻri qoʻllay oladilar.",
          "Oʻquvchilar Where are you from? savoliga javob berib, oʻzi haqida qisqa taqdimot qila oladilar.",
        ],
        lugat: [
          "Italy / Italian – Italiya / italyan",
          "Turkey / Turkish – Turkiya / turk",
          "Brazil / Brazilian – Braziliya / brazilyalik",
          "China / Chinese – Xitoy / xitoy",
          "Uzbekistan / Uzbek – Oʻzbekiston / oʻzbek",
          "country – mamlakat",
          "nationality – millat",
          "from – dan (qayerdan)",
          "flag – bayroq",
        ],
        resurslar: [
          "SB 16–17, Grammar reference SB 137",
          "Audio 14–17",
          "Dunyo xaritasi va bayroq kartochkalari",
          "Doska, marker, proyektor",
        ],
        blocks: [
          {
            title: "Warm-up: Hot seat",
            minutes: 10,
            points: [
              "Bir oʻquvchi sinf oldiga oʻtiradi va oʻzi haqida uch gap aytadi.",
              "Sinf be bilan savol beradi (Are you 13? Is your bag black?), oʻquvchi javob beradi.",
              "Oʻyin uch-toʻrt marta takrorlanadi.",
            ],
          },
          {
            title: "Vocabulary va Reading: Countries and nationalities (SB 16, 1–3-mashqlar)",
            minutes: 18,
            points: [
              "1-mashq: audio 14 bilan mamlakat nomlari tinglanadi, xaritada topiladi.",
              "2–3-mashqlar: audio 15 bilan millat soʻzlari, jadval va bayroqlar moslanadi.",
              "Ustoz yasalish qoliplarini doskaga ustunlab yozadi (-ian, -ish, -ese).",
              "Oʻquvchilar Oʻzbekiston va qoʻshni mamlakatlarni shu qoliplar bilan qoʻshib yozadi.",
            ],
          },
          {
            title: "Pronunciation: from va chant (SB 16, 4–5-mashqlar)",
            minutes: 12,
            points: [
              "4-mashq: audio 16 bilan from soʻzining kuchsiz shakli tinglanadi va takrorlanadi.",
              "5-mashq: audio 17 dagi chant tinglanib, boʻsh joylar toʻldiriladi.",
              "Chant qarsak bilan ritmda ikki guruhda aytiladi.",
            ],
          },
          {
            title: "Grammar: be plural (+) va be (−) (SB 17, 1–3-mashqlar)",
            minutes: 20,
            points: [
              "Ustoz doskada be ning toʻliq jadvalini (birlik va koʻplik, tasdiq va inkor) tuzadi.",
              "1–3-mashqlar bajariladi, javoblar juftlikda tekshiriladi.",
              "Grammar reference SB 137 boʻyicha qisqa shakllar (is not / are not) mashq qilinadi.",
              "Tezkor mashq: ustoz notoʻgʻri gap aytadi, sinf inkor bilan tuzatadi.",
            ],
          },
          {
            title: "Talking points va Speaking: All about me (SB 17, 1-mashq)",
            minutes: 20,
            points: [
              "Talking points savollari juftlikda muhokama qilinadi.",
              "Speaking 1-mashq: har bir oʻquvchi oʻzi haqida besh gap tayyorlaydi (ism, yosh, mamlakat, millat, sevimli buyum).",
              "Juftliklar almashtiriladi, oʻquvchi sherigini sinfga uchinchi shaxsda tanishtiradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Millat soʻzlari boʻyicha tezkor viktorina (ustoz mamlakatni aytadi, sinf millatni).",
              "Writing uy vazifasi tushuntiriladi: oʻzi haqida qisqa matn tuzilishi doskada koʻrsatiladi.",
            ],
          },
        ],
        uyga: [
          "WB 10–11: Vocabulary 1–3, Reading 4–5, Grammar 1–3, Writing 1–2 (oʻzi haqida matn).",
          "Besh mamlakat va ularning millatini jadval qilib yozib kelish.",
        ],
        ustozga: "Millat soʻzlari ham katta harf bilan yozilishini alohida taʼkidlang — bu eng koʻp uchraydigan yozma xato. Inkorda oʻquvchilar I am not ni I not am tarzida tuzadi; tartibni doskadagi jadval bilan mustahkamlang.",
      },
    ],
    kids: [
      {
        focus: "Shaxsiy buyumlar va tanishuv dialogi",
        sb: "14",
        maqsad: [
          "Oʻquvchilar shaxsiy buyumlar nomini tanib, ayta oladilar.",
          "Oʻquvchilar salomlashish va xayrlashish iboralarini ishlata oladilar.",
          "Oʻquvchilar qisqa dialogni rolda oʻynay oladilar.",
        ],
        lugat: [
          "bag – sumka",
          "camera – fotoapparat",
          "chair – stul",
          "phone – telefon",
          "photo – surat",
          "watch – qoʻl soati",
          "friend – doʻst",
          "Goodbye – Xayr",
        ],
        resurslar: [
          "SB 14",
          "Audio 11–13",
          "Buyum flashcardlari, haqiqiy buyumlar",
          "Qogʻoz niqoblar yoki qahramon kartochkalari",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: Starter takrori",
            minutes: 12,
            points: [
              "Alifbo qoʻshigʻi va ism harflab aytish.",
              "Bir qatorli tezkor Bingo (1–20).",
              "Ranglar kartochkalari bilan qisqa takror.",
            ],
          },
          {
            title: "Vocabulary: Objects and people (SB 14, 1-mashq)",
            minutes: 15,
            points: [
              "1-mashq: audio 11 tinglanadi, soʻzlar rasmga moslanadi.",
              "Flashcardlar koʻrsatiladi, sinf xor bilan takrorlaydi.",
              "Ustoz haqiqiy buyumlarni stolga qoʻyadi, bolalar nomini aytib koʻrsatadi.",
            ],
          },
          {
            title: "Oʻyin: What is missing?",
            minutes: 13,
            points: [
              "Stolga oltita buyum qoʻyiladi, bolalar koʻzini yumadi, bittasi olib qoʻyiladi.",
              "Bolalar qaysi buyum yoʻqligini inglizcha aytadi.",
              "Oʻyin bolalar navbat bilan boshqarishi bilan davom etadi.",
            ],
          },
          {
            title: "Listening (SB 14, 2–3-mashqlar)",
            minutes: 15,
            points: [
              "2–3-mashqlar: audio 12 tinglanadi.",
              "Bolalar rasmdagi qahramonlarni barmoq bilan koʻrsatib boradi.",
              "Ikkinchi tinglashda javoblar birga tekshiriladi.",
            ],
          },
          {
            title: "Dialog (SB 14, 4-mashq)",
            minutes: 12,
            points: [
              "4-mashq: audio 13 tinglanadi, dialog satrma-satr takrorlanadi.",
              "Ustoz salomlashish va xayrlashish iboralarini doskaga rasm bilan yozadi.",
            ],
          },
          {
            title: "Rolli oʻyin (SB 14, 5-mashq)",
            minutes: 13,
            points: [
              "5-mashq: bolalar niqob yoki kartochka olib, dialogni juftlikda oʻynaydi.",
              "Ikki-uch juftlik sinf oldida chiqib koʻrsatadi, sinf qarsak chaladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Buyum flashcardlari bilan tezkor takror.",
              "Yulduzcha bilan baholash, uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 8: Vocabulary 1–2 (rasmli soʻzlar).",
          "Uydagi uchta buyumni rasm chizib, inglizcha nomini yozib kelish.",
        ],
        ustozga: "watch soʻzi bolalarda soat maʼnosida emas, koʻrmoq maʼnosida chalkashishi mumkin — faqat qoʻl soati rasmi bilan bering. Dialogni yoddan aytishni talab qilmang, kartochkaga qarab oʻqish kifoya.",
      },
      {
        focus: "my, your, his, her va am / is / are",
        sb: "15",
        maqsad: [
          "Oʻquvchilar my, your, his, her ni buyum egasiga qarab tanlay oladilar.",
          "Oʻquvchilar am, is, are shakllarini oddiy gaplarda ishlata oladilar.",
          "Oʻquvchilar telefon raqamini soʻrab va aytib bera oladilar.",
        ],
        lugat: [
          "my – mening",
          "your – sening",
          "his – uning (oʻgʻil bola)",
          "her – uning (qiz bola)",
          "I am – men … man",
          "he is / she is – u … (erkak / ayol)",
          "phone number – telefon raqami",
          "student – oʻquvchi",
        ],
        resurslar: [
          "SB 15",
          "Buyum flashcardlari va oʻquvchilarning haqiqiy sumkalari",
          "am / is / are yozilgan katta kartochkalar",
          "Rangli qalamlar va A4 varaqlar",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: This is my … zanjiri",
            minutes: 10,
            points: [
              "Bolalar doira boʻlib buyumini koʻtaradi va This is my … deydi.",
              "Ustoz oldingi darsdagi buyum soʻzlarini flashcard bilan tez takrorlaydi.",
            ],
          },
          {
            title: "Grammar: Determiners (SB 15, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz doskaga toʻrt soʻzni rasm bilan joylashtiradi: my, your, his, her.",
              "1–2-mashqlar birga bajariladi, javoblar xor bilan aytiladi.",
            ],
          },
          {
            title: "Amaliyot: his / her haqiqiy buyumlar bilan",
            minutes: 15,
            points: [
              "Ustoz bir bolaning sumkasini koʻtaradi: This is his bag. yoki This is her bag.",
              "Bolalar navbat bilan sherigining buyumini koʻrsatib gap tuzadi.",
              "Xato qilgan bola sinf yordami bilan tuzatadi, ustoz baland ovozda tanqid qilmaydi.",
            ],
          },
          {
            title: "Grammar: be singular (+) (SB 15, 3–4-mashqlar)",
            minutes: 15,
            points: [
              "3–4-mashqlar bajariladi.",
              "am / is / are kartochkalari tarqatiladi; ustoz gap boshini aytadi, bola mos kartochkani koʻtaradi.",
              "Toʻliq va qisqa shakllar kartochkalar bilan juftlanadi.",
            ],
          },
          {
            title: "Speaking: telefon raqami (SB 15, 5-mashq)",
            minutes: 12,
            points: [
              "5-mashq: ustoz oʻylab topilgan raqam beradi, bolalar juftlikda soʻraydi va yozadi.",
              "Raqamlar birma-bir emas, ikkitalab aytish mashq qilinadi.",
            ],
          },
          {
            title: "Oʻz kartochkasi bilan tanishtirish (SB 15, 6–7-mashqlar)",
            minutes: 13,
            points: [
              "6-mashq: har bir bola oʻzining rasmli kartochkasini chizadi (ism, yosh, sevimli buyum).",
              "7-mashq: kartochkalar aralashtirilib, guruh egasini topish oʻyinini oʻynaydi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz besh gap aytadi, bolalar toʻgʻri yoki xato ekanini bosh barmoq bilan koʻrsatadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 9: Grammar 1–3.",
          "Oʻz kartochkasini uyda rangli qilib tugatib kelish.",
        ],
        ustozga: "Bolalar he va she ni ham aralashtiradi — doskaga oʻgʻil va qiz rasmini chizib, har safar koʻrsatib turing. Telefon raqamini haqiqiy raqam bilan soʻramang, faqat oʻylab topilgan raqamlar bilan ishlang.",
      },
      {
        focus: "Mamlakatlar va millatlar (chant bilan)",
        sb: "16–17",
        maqsad: [
          "Oʻquvchilar besh-olti mamlakat va millat nomini ayta oladilar.",
          "Oʻquvchilar I am from … deb qayerdan ekanini ayta oladilar.",
          "Oʻquvchilar chantni ritm bilan aytib, be ning koʻplik shaklini eshitib taniydilar.",
        ],
        lugat: [
          "Italy / Italian – Italiya / italyan",
          "Turkey / Turkish – Turkiya / turk",
          "Brazil / Brazilian – Braziliya / brazilyalik",
          "China / Chinese – Xitoy / xitoy",
          "Uzbekistan / Uzbek – Oʻzbekiston / oʻzbek",
          "flag – bayroq",
          "country – mamlakat",
          "from – dan (qayerdan)",
        ],
        resurslar: [
          "SB 16–17",
          "Audio 14–17",
          "Dunyo xaritasi va bayroq kartochkalari",
          "Chant uchun boʻsh joy yoki gilamcha",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: xaritada mamlakatlarni topish",
            minutes: 10,
            points: [
              "Xaritada Oʻzbekiston topiladi, ustoz qoʻshni mamlakatlarni koʻrsatadi.",
              "Bayroq kartochkalari koʻrsatiladi, bolalar taniganini aytadi.",
            ],
          },
          {
            title: "Reading: Countries (SB 16, 1–2-mashqlar)",
            minutes: 12,
            points: [
              "1–2-mashqlar: audio 14 tinglanadi, mamlakatlar rasm va xaritaga moslanadi.",
              "Soʻzlar xor bilan takrorlanadi.",
            ],
          },
          {
            title: "Vocabulary: bayroq va millat moslash (SB 16, 3-mashq)",
            minutes: 15,
            points: [
              "3-mashq: audio 15 tinglanadi, millat soʻzlari takrorlanadi.",
              "Bayroq va millat kartochkalari polda juftlanadi (Memory oʻyini).",
              "Ustoz katta harf qoidasini rasm bilan eslatadi.",
            ],
          },
          {
            title: "Pronunciation: from (SB 16, 4-mashq)",
            minutes: 13,
            points: [
              "4-mashq: audio 16 tinglanadi, from soʻzining qisqa aytilishi mashq qilinadi.",
              "Bolalar I am from Uzbekistan. gapini ritm bilan takrorlaydi.",
            ],
          },
          {
            title: "Chant (SB 16, 5-mashq)",
            minutes: 15,
            points: [
              "5-mashq: audio 17 tinglanadi, chant boʻsh joylari birga toʻldiriladi.",
              "Chant qarsak va oyoq urish bilan ikki guruhda aytiladi.",
              "Bir guruh savol, ikkinchisi javob qismini aytadi.",
            ],
          },
          {
            title: "Grammar va Speaking: All about me (SB 17, 1–3-mashqlar)",
            minutes: 15,
            points: [
              "Grammar 1–3-mashqlar: be koʻplik va inkor shakllari ustoz bilan birga bajariladi.",
              "Speaking 1-mashq: har bir bola oʻzi haqida uch gap aytadi.",
              "Uch gap doskada ustoz bilan birga yoziladi va daftarga koʻchiriladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Chant yana bir marta aytiladi.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 10: Vocabulary 1–3 (millatlar).",
          "Oʻzi haqida uch gap yozib, tagiga bayrogʻini chizib kelish.",
        ],
        ustozga: "Millat soʻzlarining oxiri (-ian, -ish, -ese) bolalarga qiyin — yozishni emas, ogʻzaki tanishni maqsad qiling. Chantni kamida uch marta takrorlang: birinchi marta tinglash, ikkinchi marta shivirlab, uchinchi marta baland ovozda.",
      },
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
      {
        focus: "Oila: oʻqish, lugʻat va Possessive s",
        sb: "18–19",
        maqsad: [
          "Oʻquvchilar oila aʼzolarini nomlab, oʻz oilasini qisqa tanishtira oladilar.",
          "Oʻquvchilar Possessive s bilan kimning kimi ekanini ayta oladilar.",
          "Oʻquvchilar our va their olmoshlarini toʻgʻri qoʻllay oladilar.",
        ],
        lugat: [
          "mum and dad – oyi va dada",
          "brother and sister – aka-uka va opa-singil",
          "parents – ota-ona",
          "daughter – qiz (farzand)",
          "son – oʻgʻil (farzand)",
          "husband and wife – er va xotin",
          "children – bolalar",
          "baby – chaqaloq",
          "our / their – bizning / ularning",
        ],
        resurslar: [
          "SB 18–19, Grammar reference SB 138",
          "Audio 18–20, video 01 (Me and you)",
          "Oila daraxti namunasi (doskada yoki slaydda)",
          "Oila aʼzolari flashcardlari",
          "Doska, marker, proyektor",
        ],
        blocks: [
          {
            title: "Warm-up: About you (SB 18)",
            minutes: 10,
            points: [
              "Juftlikda savol-javob: Where is your family from? How old are the people in your family?",
              "Ustoz doskaga oddiy oila daraxti chizadi va oʻz oilasi misolida namuna beradi.",
            ],
          },
          {
            title: "Reading: Families (SB 18, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "1-mashq: rasmlarga qarab matn mavzusi taxmin qilinadi.",
              "2-mashq: audio 18 bilan matn tinglanadi va oʻqiladi, topshiriq bajariladi.",
              "Javoblar juftlikda tekshiriladi, ustoz notoʻgʻri javoblarni matndan topib koʻrsatadi.",
            ],
          },
          {
            title: "Vocabulary: oila soʻzlari (SB 18, 3-mashq)",
            minutes: 13,
            points: [
              "3-mashq: audio 19 bilan soʻzlar tinglanadi va takrorlanadi.",
              "Oʻquvchilar oʻz oila daraxtini chizib, inglizcha nom yozadi.",
              "Ustoz children va baby ning koʻplik shakllariga alohida toʻxtaladi.",
            ],
          },
          {
            title: "Pronunciation: and (SB 18, 4-mashq)",
            minutes: 10,
            points: [
              "4-mashq: audio 20 bilan and soʻzining kuchsiz talaffuzi tinglanadi.",
              "Juft soʻzlar (mum and dad, brother and sister) qarsak ritmida takrorlanadi.",
            ],
          },
          {
            title: "Grammar: Possessive s (SB 19, 3–5-mashqlar)",
            minutes: 17,
            points: [
              "Ustoz doskada Possessive s qoidasini oʻquvchilarning oʻzidan chiqaradi.",
              "3–4-mashqlar bajariladi, Grammar reference SB 138 ochiladi.",
              "5-mashq: rasmga ikki daqiqa qaraladi, kitob yopilib, yodda qolgani Possessive s bilan aytiladi.",
            ],
          },
          {
            title: "Grammar: our / their va Talking points (SB 19, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "Determiners 1–2-mashqlar bajariladi, oldingi darsdagi my / your / his / her bilan bir jadvalga yigʻiladi.",
              "Video 01 (Me and you) koʻriladi va Talking points savollari juftlikda muhokama qilinadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Tezkor mashq: ustoz ikki ism aytadi, oʻquvchi Possessive s bilan bogʻlaydi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 12–13: oila soʻzlari, Reading va Grammar (Possessive s, our / their).",
          "Oʻz oila daraxtini toza koʻchirib, har bir aʼzoga bittadan Possessive s li gap yozib kelish.",
        ],
        ustozga: "Possessive s va be ning qisqa shakli yozuvda bir xil koʻrinadi — oʻquvchilar ularni aralashtiradi. Doskada ikkita misolni yonma-yon yozib, maʼnosini soʻrash orqali farqni koʻrsating.",
      },
      {
        focus: "His-tuygʻular, tinglash va be savollari",
        sb: "20–21",
        maqsad: [
          "Oʻquvchilar his-tuygʻu sifatlarini aytib, oʻz holatini tasvirlay oladilar.",
          "Oʻquvchilar be bilan savol tuzib, qisqa javob bera oladilar.",
          "Oʻquvchilar oila aʼzosi haqida qisqa matn yoza oladilar.",
        ],
        lugat: [
          "bored – zerikkan",
          "hungry – och",
          "tired – charchagan",
          "funny – kulgili",
          "happy – xursand",
          "sad – xafa",
          "thirsty – chanqagan",
          "Are you …? – Sen … misan?",
          "Yes, I am. / No, I am not. – Ha / Yoʻq",
        ],
        resurslar: [
          "SB 19–21, SB 124 (Extra activities), Grammar reference SB 138",
          "Audio 21–22",
          "His-tuygʻu kartochkalari (smaylik rasmlari)",
          "Doska, marker, proyektor",
        ],
        blocks: [
          {
            title: "Warm-up: Memory (SB 19, 5-mashq)",
            minutes: 10,
            points: [
              "19-betdagi oila rasmiga ikki daqiqa qaraladi, kitob yopiladi.",
              "Juftlikda yodda qolgani Possessive s bilan aytiladi, keyin tekshiriladi.",
            ],
          },
          {
            title: "Vocabulary: Adjectives — feelings (SB 20, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "1-mashq: audio 21 bilan sifatlar tinglanadi va rasmga moslanadi.",
              "2-mashq bajariladi; mimika oʻyini — bir oʻquvchi his-tuygʻuni yuz ifodasi bilan koʻrsatadi.",
              "Ustoz I am hungry. kabi gaplarni doskaga yozib, be bilan bogʻlanishini koʻrsatadi.",
            ],
          },
          {
            title: "Listening (SB 20, 3–4-mashqlar)",
            minutes: 15,
            points: [
              "3-mashq: audio 22 birinchi marta umumiy mazmun uchun tinglanadi.",
              "4-mashq: ikkinchi tinglashda tafsilotlar toʻldiriladi.",
              "Rasmli hikoya tartibga solinadi va javoblar tekshiriladi.",
            ],
          },
          {
            title: "Grammar: be questions and short answers (SB 21, 1–5-mashqlar)",
            minutes: 20,
            points: [
              "Ustoz doskada soʻz tartibini koʻrsatadi: be gap boshiga chiqadi.",
              "1–4-mashqlar bajariladi, Grammar reference SB 138 ochiladi.",
              "Zanjir mashqi: Are you tired? – Yes, I am. / No, I am not. — har bir oʻquvchi keyingisidan soʻraydi.",
              "5-mashq: SB 124 dagi Extra activities juftlikda bajariladi.",
            ],
          },
          {
            title: "Writing: oila aʼzosi uchun web sahifa (SB 21, 6–7-mashqlar va Writing 1)",
            minutes: 20,
            points: [
              "6-mashq: namuna matn oʻqilib, tuzilishi tahlil qilinadi.",
              "Ustoz katta harf va nuqta qoidasini doskada eslatadi.",
              "7-mashq va Writing 1: har bir oʻquvchi bitta oila aʼzosi haqida 40–50 soʻzlik matn yozadi.",
              "Juftlikda almashib oʻqiladi, sherigi katta harf va nuqtani tekshiradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ikki-uch oʻquvchi oʻz matnini oʻqib beradi, sinf bitta savol beradi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 14–15: sifatlar, Listening, Grammar va Writing.",
          "Web sahifa matnini toza koʻchirib, rasm bilan bezab kelish.",
        ],
        ustozga: "Qisqa javobda oʻquvchilar Yes, I am. oʻrniga Yes, I do. deb xato qiladi — savoldagi feʼl javobda takrorlanishini taʼkidlang. I am hungry tipidagi gaplarda oʻzbekcha taʼsirida be tushib qolishi ham tez-tez uchraydi.",
      },
      {
        focus: "Culture: The United Kingdom",
        sb: "22–23 (Culture)",
        maqsad: [
          "Oʻquvchilar Birlashgan Qirollikning toʻrt mamlakati va poytaxtlarini ayta oladilar.",
          "Oʻquvchilar mamlakat, millat va poytaxt soʻzlarini bogʻlab gap tuza oladilar.",
          "Oʻquvchilar oʻz mamlakati haqida poster rejasini tuza oladilar.",
        ],
        lugat: [
          "England / English – Angliya / ingliz",
          "Scotland / Scottish – Shotlandiya / shotland",
          "Wales / Welsh – Uels / uelslik",
          "Northern Ireland – Shimoliy Irlandiya",
          "capital city – poytaxt",
          "pound – funt (pul birligi)",
          "flag – bayroq",
          "population – aholi soni",
        ],
        resurslar: [
          "SB 22–23 (Culture) va Factfile",
          "Audio 23–26, Culture video 02",
          "Birlashgan Qirollik xaritasi va bayroqlari",
          "Poster uchun A3 varaq, rangli qalam va marker",
          "Proyektor",
        ],
        blocks: [
          {
            title: "Warm-up va taxmin (SB 22, 1–2-mashqlar)",
            minutes: 10,
            points: [
              "1-mashq: juftlikda muhokama — Birlashgan Qirollik haqida nima bilamiz?",
              "2-mashq: xarita va rasmlarga qarab taxmin qilinadi, javoblar doskaga yoziladi.",
            ],
          },
          {
            title: "Reading va Factfile (SB 22, 3–4-mashqlar)",
            minutes: 18,
            points: [
              "3-mashq: audio 23 bilan matn tinglanadi va oʻqiladi.",
              "4-mashq bajariladi; doskadagi taxminlar tekshirib chiqiladi.",
              "Factfile jadvali guruhda oʻqilib, asosiy raqamlar daftarga koʻchiriladi.",
            ],
          },
          {
            title: "Vocabulary: mamlakat, millat va poytaxtlar (SB 23, 5–7-mashqlar)",
            minutes: 15,
            points: [
              "5–6-mashqlar: audio 24–25 bilan soʻzlar tinglanadi va moslanadi.",
              "7-mashq bajariladi; kartochkalar bilan mamlakat – millat – poytaxt uchligi teriladi.",
            ],
          },
          {
            title: "Listening (SB 23, 8–9-mashqlar)",
            minutes: 15,
            points: [
              "8-mashq: audio 26 birinchi marta umumiy mazmun uchun tinglanadi.",
              "9-mashq: ikkinchi tinglashda tafsilotlar yoziladi va tekshiriladi.",
            ],
          },
          {
            title: "Culture video 02 va Interesting fact",
            minutes: 12,
            points: [
              "Culture video 02 koʻriladi, ustoz koʻrishdan oldin ikki savol beradi.",
              "Interesting fact (funt va pens) muhokama qilinadi, Oʻzbekiston puli bilan solishtiriladi.",
            ],
          },
          {
            title: "Project: poster rejasi",
            minutes: 12,
            points: [
              "Guruhlar Oʻzbekiston yoki boshqa mamlakat haqida poster rejasini tuzadi.",
              "Reja bandlari: xarita, poytaxt, yirik shaharlar, bayroq, sport, pul birligi.",
              "Har bir guruh vazifalarni aʼzolar orasida taqsimlaydi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 8,
            points: [
              "Toʻrt mamlakat va poytaxti tezkor viktorina bilan takrorlanadi.",
              "Project topshirish muddati va baholash mezonlari aytiladi.",
            ],
          },
        ],
        uyga: [
          "Project: Oʻzbekiston yoki boshqa mamlakat haqida poster (xarita, shaharlar, ramzlar, sport, pul).",
          "Posterga kamida besh inglizcha gap yozib kelish.",
        ],
        ustozga: "Oʻquvchilar England va the United Kingdom ni bir xil deb oʻylaydi — xaritada aniq koʻrsatib, farqni bir necha marta takrorlang. Project uchun internetdan rasm nusxalash emas, oʻz qoʻli bilan chizish talab qilinsin.",
      },
    ],
    kids: [
      {
        focus: "Oila soʻzlari va oʻqish",
        sb: "18",
        maqsad: [
          "Oʻquvchilar oila aʼzolarini nomlab, oʻz oilasini koʻrsata oladilar.",
          "Oʻquvchilar qisqa matnni rasm yordamida tushuna oladilar.",
          "Oʻquvchilar juft soʻzlarni and bilan ritmda ayta oladilar.",
        ],
        lugat: [
          "mum – oyi",
          "dad – dada",
          "brother – aka, uka",
          "sister – opa, singil",
          "parents – ota-ona",
          "baby – chaqaloq",
          "family – oila",
          "grandma / grandpa – buvi / bobo",
        ],
        resurslar: [
          "SB 18",
          "Audio 18–20",
          "Oila aʼzolari flashcardlari va barmoq qoʻgʻirchoqlari",
          "A4 varaq va rangli qalamlar",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: millatlar chanti",
            minutes: 10,
            points: [
              "Oʻtgan darsdagi chant birga aytiladi.",
              "Bayroq kartochkalari bilan tezkor takror.",
            ],
          },
          {
            title: "Vocabulary: oila flashcardlari",
            minutes: 13,
            points: [
              "Ustoz oila aʼzolari flashcardlarini birma-bir koʻrsatadi, sinf xor bilan takrorlaydi.",
              "Kartochkalar doskaga oila daraxti shaklida joylashtiriladi.",
            ],
          },
          {
            title: "Reading: Families (SB 18, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "1-mashq: rasmlarga qarab suhbat.",
              "2-mashq: audio 18 tinglanadi, matn ustoz bilan birga oʻqiladi.",
              "Topshiriq birga bajariladi, javoblar matndan barmoq bilan koʻrsatiladi.",
            ],
          },
          {
            title: "Soʻzlarni mustahkamlash va qoʻshiq (SB 18, 3-mashq)",
            minutes: 12,
            points: [
              "3-mashq: audio 19 tinglanadi va takrorlanadi.",
              "Finger family qoʻshigʻi barmoq harakatlari bilan kuylanadi.",
            ],
          },
          {
            title: "Pronunciation: and (SB 18, 4-mashq)",
            minutes: 15,
            points: [
              "4-mashq: audio 20 tinglanadi.",
              "Juft soʻzlar qarsak bilan aytiladi: mum and dad, brother and sister.",
              "Ikki jamoa navbat bilan juft soʻzlarni ritmda aytish musobaqasini oʻtkazadi.",
            ],
          },
          {
            title: "About you: oila rasmi",
            minutes: 15,
            points: [
              "Har bir bola oʻz oilasini chizadi va uch kishini inglizcha imzolaydi.",
              "Bolalar kichik guruhda rasmni koʻrsatib This is my mum. deb tanishtiradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Flashcardlar bilan tezkor takror.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 12: 1–2-mashqlar (oila soʻzlari).",
          "Oila rasmini uyda rangli qilib tugatib kelish.",
        ],
        ustozga: "brother va sister soʻzlari oʻzbekchada yoshga qarab ikki xil (aka-uka, opa-singil) — bolalarga inglizchada farq yoʻqligini tushuntiring. Rasm chizishga ajratilgan vaqtni qatʼiy nazorat qiling, aks holda blok choʻzilib ketadi.",
      },
      {
        focus: "Possessive s va our / their",
        sb: "19",
        maqsad: [
          "Oʻquvchilar Possessive s bilan buyum egasini ayta oladilar.",
          "Oʻquvchilar our va their olmoshlarini tanib ishlata oladilar.",
          "Oʻquvchilar rasmni eslab, oila haqida qisqa gaplar tuza oladilar.",
        ],
        lugat: [
          "mum – oyi",
          "dad – dada",
          "sister – opa, singil",
          "brother – aka, uka",
          "our – bizning",
          "their – ularning",
          "Whose is it? – Bu kimniki?",
          "family – oila",
        ],
        resurslar: [
          "SB 19",
          "Video 01 (Me and you)",
          "Oʻquvchilarning buyumlari (qalam, oʻchirgʻich, sumka)",
          "Oila aʼzolari flashcardlari",
          "Doska, marker, proyektor",
        ],
        blocks: [
          {
            title: "Warm-up: Who is this?",
            minutes: 10,
            points: [
              "Oila rasmlari koʻrsatiladi, bolalar Who is this? savoliga javob beradi.",
              "Oila soʻzlari flashcard bilan tez takrorlanadi.",
            ],
          },
          {
            title: "Grammar: Possessive s (SB 19, 3-mashq)",
            minutes: 15,
            points: [
              "Ustoz bir bolaning qalamini koʻtaradi va egasi ismiga s qoʻshib gap tuzadi, namunani doskaga yozadi.",
              "3-mashq birga bajariladi, javoblar xor bilan aytiladi.",
            ],
          },
          {
            title: "Amaliyot: bu kimniki? oʻyini (SB 19, 4-mashq)",
            minutes: 15,
            points: [
              "4-mashq bajariladi.",
              "Bolalar bittadan buyumni qutiga soladi, ustoz olib koʻtaradi, sinf egasini Possessive s bilan aytadi.",
            ],
          },
          {
            title: "Memory oʻyini (SB 19, 5-mashq)",
            minutes: 12,
            points: [
              "Rasmga ikki daqiqa qaraladi, kitob yopiladi.",
              "Bolalar yodda qolgan uch narsani aytadi, sinf birga tekshiradi.",
            ],
          },
          {
            title: "Grammar: our / their (SB 19, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz sinfni ikki guruhga boʻlib our va their farqini harakat bilan koʻrsatadi.",
              "1–2-mashqlar ustoz bilan birga bajariladi.",
            ],
          },
          {
            title: "Talking points: video 01",
            minutes: 13,
            points: [
              "Video 01 koʻriladi, ustoz koʻrishdan oldin bitta oddiy savol beradi.",
              "Koʻrgandan keyin savol-javob ustoz bilan birga oʻtkaziladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Tezkor oʻyin: ustoz buyumni koʻtaradi, bola egasini aytadi.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 13: Grammar — ikki mashq (Possessive s va our / their).",
          "Uydagi uch buyumni kimnikiligi bilan yozib kelish.",
        ],
        ustozga: "Possessive s ni bolalar koʻplik qoʻshimchasi deb oʻylaydi — ikkita rasmni yonma-yon qoʻyib (bitta qalam va koʻp qalam) farqni koʻrsating. Buyum oʻyinida hamma bolaga navbat yetishiga eʼtibor bering.",
      },
      {
        focus: "His-tuygʻular va be savollari",
        sb: "20–21",
        maqsad: [
          "Oʻquvchilar his-tuygʻu sifatlarini aytib, mimika bilan koʻrsata oladilar.",
          "Oʻquvchilar Are you …? savoliga qisqa javob bera oladilar.",
          "Oʻquvchilar ustoz yordamida qisqa web sahifa matnini toʻldira oladilar.",
        ],
        lugat: [
          "bored – zerikkan",
          "hungry – och",
          "tired – charchagan",
          "funny – kulgili",
          "happy – xursand",
          "sad – xafa",
          "Are you …? – Sen … misan?",
          "Yes, I am. – Ha",
        ],
        resurslar: [
          "SB 20–21",
          "Audio 21–22",
          "His-tuygʻu smaylik kartochkalari",
          "Web sahifa namunasi (kattalashtirilgan varaq)",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: How are you today?",
            minutes: 10,
            points: [
              "Har bir bola smaylik kartochkasini tanlab, oʻz kayfiyatini koʻrsatadi.",
              "Ustoz yangi sifatlarni kartochka bilan tanishtiradi.",
            ],
          },
          {
            title: "Vocabulary: feelings (SB 20, 1-mashq)",
            minutes: 13,
            points: [
              "1-mashq: audio 21 tinglanadi, sifatlar rasmga moslanadi.",
              "Soʻzlar yuz ifodasi bilan birga takrorlanadi (TPR).",
            ],
          },
          {
            title: "Oʻyin: Charades (SB 20, 2-mashq)",
            minutes: 12,
            points: [
              "2-mashq bajariladi.",
              "Bir bola his-tuygʻuni mimika bilan koʻrsatadi, sinf inglizcha topadi.",
            ],
          },
          {
            title: "Listening (SB 20, 3–4-mashqlar)",
            minutes: 15,
            points: [
              "3-mashq: audio 22 tinglanadi, bolalar rasmni barmoq bilan kuzatadi.",
              "4-mashq ikkinchi tinglashda birga bajariladi.",
            ],
          },
          {
            title: "Grammar: be questions and short answers (SB 21, 1–3-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz Are you hungry? savolini doskaga rasm bilan yozadi.",
              "1–3-mashqlar birga bajariladi.",
              "Zanjir oʻyini: Are you tired? – Yes, I am. / No, I am not.",
            ],
          },
          {
            title: "Writing: web sahifa (SB 21, 6-mashq)",
            minutes: 15,
            points: [
              "6-mashqdagi namuna ustoz bilan birga oʻqiladi.",
              "Bolalar qisqartirilgan shaklni (ism, yosh, oila aʼzosi) toʻldiradi.",
              "Ustoz doskada bitta namunani birga yozib beradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Smaylik kartochkalari bilan tezkor takror.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 14: 1–2-mashqlar (sifatlar).",
          "Oʻz web sahifasiga rasm chizib, ismi va yoshini yozib kelish.",
        ],
        ustozga: "Bolalar I am hungry oʻrniga I hungry deb aytadi — am ni har safar qoʻl harakati bilan eslatib turing. Charades oʻyinida uyalchan bolalarni majburlamang, ular avval juftlikda mashq qilsin.",
      },
      {
        focus: "Culture: The United Kingdom",
        sb: "22–23 (Culture)",
        maqsad: [
          "Oʻquvchilar Birlashgan Qirollikning toʻrt mamlakatini xaritada koʻrsata oladilar.",
          "Oʻquvchilar mamlakat va poytaxt juftlarini moslay oladilar.",
          "Oʻquvchilar oʻz mamlakati haqida rasmli poster tayyorlay oladilar.",
        ],
        lugat: [
          "England – Angliya",
          "Scotland – Shotlandiya",
          "Wales – Uels",
          "Northern Ireland – Shimoliy Irlandiya",
          "London – London",
          "capital city – poytaxt",
          "flag – bayroq",
          "map – xarita",
        ],
        resurslar: [
          "SB 22–23 (Culture)",
          "Audio 23–26, Culture video 02",
          "Birlashgan Qirollik xaritasi va bayroq kartochkalari",
          "Poster uchun A3 varaq, rangli qalam, yelim",
          "Proyektor",
        ],
        blocks: [
          {
            title: "Warm-up: xaritada UK (SB 22, 1-mashq)",
            minutes: 10,
            points: [
              "Xaritada Birlashgan Qirollik topiladi va Oʻzbekiston bilan solishtiriladi.",
              "1-mashq savollari ustoz bilan birga muhokama qilinadi.",
            ],
          },
          {
            title: "Reading (SB 22, 2–3-mashqlar)",
            minutes: 15,
            points: [
              "2-mashq: rasmlarga qarab taxmin qilinadi.",
              "3-mashq: audio 23 tinglanadi, matn ustoz bilan birga oʻqiladi.",
              "Toʻrt bola qayerdan ekani topiladi va xaritada koʻrsatiladi.",
            ],
          },
          {
            title: "Matn boʻyicha topshiriq (SB 22, 4-mashq)",
            minutes: 12,
            points: [
              "4-mashq birga bajariladi.",
              "Javoblar matndan barmoq bilan topib koʻrsatiladi.",
            ],
          },
          {
            title: "Vocabulary: millat va poytaxtlar (SB 23, 5–7-mashqlar)",
            minutes: 15,
            points: [
              "5–6-mashqlar: audio 24–25 tinglanadi va takrorlanadi.",
              "7-mashq bajariladi; kartochkalar bilan mamlakat va poytaxt juftlanadi.",
            ],
          },
          {
            title: "Culture video 02 va Listening (SB 23, 8-mashq)",
            minutes: 13,
            points: [
              "Culture video 02 koʻriladi.",
              "8-mashq: audio 26 tinglanadi va birga tekshiriladi.",
            ],
          },
          {
            title: "Project: rasmli poster",
            minutes: 15,
            points: [
              "Kichik guruhlar Oʻzbekiston haqida rasmli poster boshlaydi.",
              "Har bir guruh xarita, bayroq va uchta rasm chizadi.",
              "Ustoz poster ostiga yoziladigan uch gapni doskada namuna qilib beradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Toʻrt mamlakat nomi birga takrorlanadi.",
              "Yulduzcha bilan baholash; project muddati aytiladi.",
            ],
          },
        ],
        uyga: [
          "Posterni oila bilan tugatish.",
          "Poster haqida uch inglizcha gap aytishga tayyorlanish.",
        ],
        ustozga: "Bu dars koʻp yangi nom beradi — hammasini yodlashni talab qilmang, xaritada koʻrsata olish kifoya. Poster ishini vaqt bilan cheklang va guruhda har bir bolaning vazifasi borligiga ishonch hosil qiling.",
      },
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
      {
        focus: "Xonalar, tinglash va there is / there are",
        sb: "24–25",
        maqsad: [
          "Oʻquvchilar uydagi xonalarni nomlab, oʻz uyini qisqa tasvirlay oladilar.",
          "Oʻquvchilar there is va there are ni birlik va koʻplikka qarab tanlay oladilar.",
          "Oʻquvchilar in va on predloglari bilan buyum joyini ayta oladilar.",
        ],
        lugat: [
          "bathroom – hammom",
          "bedroom – yotoqxona",
          "dining room – ovqatlanish xonasi",
          "hall – dahliz",
          "kitchen – oshxona",
          "living room – mehmonxona",
          "window – deraza",
          "wall – devor",
          "in / on – ichida / ustida",
        ],
        resurslar: [
          "SB 24–25, Grammar reference SB 139",
          "Audio 27–29",
          "Uy rejasi rasmi (slayd yoki chizma)",
          "Xonalar flashcardlari",
          "Doska, marker, proyektor",
        ],
        blocks: [
          {
            title: "Warm-up: About you (SB 24)",
            minutes: 10,
            points: [
              "Juftlikda savol-javob: Where do you live? Is your home big or small?",
              "Ustoz doskaga oddiy uy rejasini chizib, xona nomlarini soʻraydi.",
            ],
          },
          {
            title: "Vocabulary: Rooms (SB 24, 1–3-mashqlar)",
            minutes: 15,
            points: [
              "1-mashq: audio 27 bilan xonalar tinglanadi va rasmga moslanadi.",
              "2–3-mashqlar bajariladi, javoblar juftlikda tekshiriladi.",
              "Oʻquvchilar oʻz uyi rejasini chizib, xonalarni inglizcha imzolaydi.",
            ],
          },
          {
            title: "Listening (SB 24, 4–5-mashqlar)",
            minutes: 15,
            points: [
              "4-mashq: audio 28 ikki marta tinglanadi, topshiriq bajariladi.",
              "5-mashq: bir oʻquvchi xona haqida gap aytadi, sherigi qaysi xona ekanini topadi.",
            ],
          },
          {
            title: "Grammar: there is / there are; in / on (SB 25, 1–4-mashqlar)",
            minutes: 20,
            points: [
              "Ustoz doskada birlik va koʻplik farqini misol bilan koʻrsatadi.",
              "1–3-mashqlar bajariladi (audio 29 bilan tekshiriladi).",
              "Grammar reference SB 139 ochilib, qoida daftarga koʻchiriladi.",
              "4-mashq: in va on predloglari sinfdagi haqiqiy buyumlar bilan mashq qilinadi.",
            ],
          },
          {
            title: "Speaking va Writing (SB 25, 5–6-mashqlar)",
            minutes: 20,
            points: [
              "5-mashq: har bir oʻquvchi oʻz uyi haqida besh gap aytadi, sherigi tinglab yozib boradi.",
              "6-mashq: oʻquvchi sherigining uyi haqida 40–50 soʻzlik matn yozadi.",
              "Matnlar almashtirilib oʻqiladi, egasi maʼlumot toʻgʻriligini tekshiradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Tezkor mashq: ustoz buyum aytadi, sinf there is yoki there are bilan gap tuzadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 16–17: Rooms, Listening va Grammar (there is / there are).",
          "Oʻz uyi rejasini chizib, har bir xona haqida bittadan gap yozib kelish.",
        ],
        ustozga: "Oʻzbekchada there is / there are ga toʻgʻridan-toʻgʻri moslik yoʻq, shuning uchun oʻquvchilar bu qurilmani tashlab ketadi (In my home two bedrooms). Har bir gapni there bilan boshlashni bir necha dars davomida talab qiling.",
      },
      {
        focus: "Xonamdagi buyumlar va have got",
        sb: "26–27",
        maqsad: [
          "Oʻquvchilar xonadagi buyumlarni nomlab, oʻz xonasini tasvirlay oladilar.",
          "Oʻquvchilar have got va has got ni toʻgʻri tanlab ishlata oladilar.",
          "Oʻquvchilar also soʻzi bilan gaplarni bogʻlay oladilar.",
        ],
        lugat: [
          "bookcase – kitob javoni",
          "board game – stol oʻyini",
          "clock – devor soati",
          "poster – plakat",
          "window – deraza",
          "wall – devor",
          "have got / has got – bor (egalik)",
          "also – shuningdek",
        ],
        resurslar: [
          "SB 26–27, Grammar reference SB 139",
          "Audio 30–32",
          "Xona buyumlari flashcardlari",
          "A4 varaq va rangli qalam (xona chizmasi uchun)",
          "Doska, marker, proyektor",
        ],
        blocks: [
          {
            title: "Warm-up: Draw and guess",
            minutes: 10,
            points: [
              "Ustoz doskaga xona chizadi, oʻquvchilar buyumlarni inglizcha aytadi.",
              "Keyin bir oʻquvchi chizadi, sinf there is / there are bilan tasvirlaydi.",
            ],
          },
          {
            title: "Vocabulary: Things in my room (SB 26, 1-mashq)",
            minutes: 13,
            points: [
              "1-mashq: audio 30 bilan soʻzlar tinglanadi va rasmga moslanadi.",
              "Flashcardlar bilan tezkor aytish, soʻzlar daftarga koʻchiriladi.",
            ],
          },
          {
            title: "Reading (SB 26, 2–3-mashqlar)",
            minutes: 15,
            points: [
              "2-mashq: audio 31 bilan matn tinglanadi va oʻqiladi.",
              "3-mashq bajariladi, javoblar matndan dalil bilan koʻrsatiladi.",
            ],
          },
          {
            title: "Pronunciation: Lists va Speaking (SB 26, 1–2-mashqlar)",
            minutes: 12,
            points: [
              "Pronunciation 1-mashq: audio 32 bilan roʻyxat ohangi tinglanadi.",
              "Speaking 2-mashq: kichik guruhlarda roʻyxat zanjiri oʻyini oʻynaladi.",
            ],
          },
          {
            title: "Grammar: have got (+) (SB 27, 1–3-mashqlar)",
            minutes: 18,
            points: [
              "Ustoz doskada have got va has got jadvalini tuzadi.",
              "1–3-mashqlar bajariladi, Grammar reference SB 139 ochiladi.",
              "Tezkor mashq: ustoz oʻquvchini koʻrsatadi, sinf He has got a … deb gap tuzadi.",
            ],
          },
          {
            title: "Writing: also bilan (SB 27, 4–5-mashqlar)",
            minutes: 12,
            points: [
              "4-mashq: also soʻzining gapda joylashuvi tahlil qilinadi.",
              "5-mashq: oʻquvchilar oʻz xonasini chizib, also bilan bogʻlangan gaplar yozadi.",
            ],
          },
          {
            title: "Talking points va yakun",
            minutes: 10,
            points: [
              "Juftlikda suhbat: sevimli rang, sevimli oʻyin va sevimli buyum.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 18–19: Things in my room, Reading, Grammar (have got) va Writing.",
          "Oʻz xonasi rasmini tugatib, ostiga also ishlatilgan kamida ikki gap yozib kelish.",
        ],
        ustozga: "has got faqat he, she, it bilan kelishini doskadagi jadval bilan mustahkamlang — oʻquvchilar My sister have got deb xato qiladi. also gap oʻrtasida, feʼldan keyin kelishini alohida koʻrsating.",
      },
    ],
    kids: [
      {
        focus: "Xonalar va tinglash",
        sb: "24",
        maqsad: [
          "Oʻquvchilar uydagi xonalarni nomlay oladilar.",
          "Oʻquvchilar eshitgan xona nomini tanib, koʻrsata oladilar.",
          "Oʻquvchilar oʻz uyidagi xonalar haqida ayta boshlaydilar.",
        ],
        lugat: [
          "bathroom – hammom",
          "bedroom – yotoqxona",
          "kitchen – oshxona",
          "living room – mehmonxona",
          "dining room – ovqatlanish xonasi",
          "hall – dahliz",
          "home – uy",
          "door – eshik",
        ],
        resurslar: [
          "SB 24",
          "Audio 27–28",
          "Xonalar flashcardlari (katta oʻlchamda)",
          "Sinf burchaklariga osiladigan xona belgilari",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: oila soʻzlari Memory",
            minutes: 10,
            points: [
              "Oila kartochkalari bilan Memory oʻyini.",
              "His-tuygʻu smayliklari bilan qisqa takror.",
            ],
          },
          {
            title: "Vocabulary: Rooms (SB 24, 1-mashq)",
            minutes: 13,
            points: [
              "1-mashq: audio 27 tinglanadi, xonalar rasmga moslanadi.",
              "Flashcardlar koʻrsatiladi, sinf xor bilan takrorlaydi.",
            ],
          },
          {
            title: "TPR: Run to the kitchen!",
            minutes: 15,
            points: [
              "Sinf burchaklariga xona belgilari osiladi.",
              "Ustoz xona nomini aytadi, bolalar shu burchakka yuguradi.",
              "Keyin bolalar navbat bilan buyruq beradi.",
            ],
          },
          {
            title: "Mustahkamlash (SB 24, 2–3-mashqlar)",
            minutes: 12,
            points: [
              "2–3-mashqlar ustoz bilan birga bajariladi.",
              "Bolalar oʻz uyi rejasini chizib boshlaydi.",
            ],
          },
          {
            title: "Listening (SB 24, 4-mashq)",
            minutes: 15,
            points: [
              "4-mashq: audio 28 ikki marta tinglanadi.",
              "Xonalar tartib bilan raqamlanadi, javoblar birga tekshiriladi.",
            ],
          },
          {
            title: "Oʻyin: xonani top (SB 24, 5-mashq)",
            minutes: 15,
            points: [
              "5-mashq: bir bola xonadagi narsani aytadi, sherigi xonani topadi.",
              "Oʻyin juftlikda, keyin sinf oldida ikki-uch marta takrorlanadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Flashcardlar bilan tezkor takror.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 16: xonalar soʻzlari (bir-ikki mashq).",
          "Oʻz uyi rejasini chizib, xonalarni inglizcha imzolab kelish.",
        ],
        ustozga: "living room va dining room ikki soʻzdan iborat — bolalar birinchi soʻzni tushirib qoldiradi. Har safar ikki qarsak bilan ayting, shunda ikki soʻz ekani esda qoladi. TPR oʻyinida sinf xavfsizligiga eʼtibor bering.",
      },
      {
        focus: "there is / there are; in / on",
        sb: "25",
        maqsad: [
          "Oʻquvchilar there is va there are ni farqlab ishlata oladilar.",
          "Oʻquvchilar in va on bilan buyum joyini ayta oladilar.",
          "Oʻquvchilar oʻz uyi haqida uch gap tuza oladilar.",
        ],
        lugat: [
          "there is – bor (bitta)",
          "there are – bor (koʻp)",
          "in – ichida",
          "on – ustida",
          "table – stol",
          "box – quti",
          "bedroom – yotoqxona",
          "kitchen – oshxona",
        ],
        resurslar: [
          "SB 25",
          "Audio 29",
          "Xonalar flashcardlari",
          "Oʻyinchoq, quti va kitob (predloglar uchun)",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: Rooms flashcardlari",
            minutes: 10,
            points: [
              "Flashcardlar tez koʻrsatiladi, bolalar nomini aytadi.",
              "Oʻtgan darsdagi TPR oʻyini qisqa takrorlanadi.",
            ],
          },
          {
            title: "Grammar: there is / there are (SB 25, 1-mashq)",
            minutes: 15,
            points: [
              "Ustoz bitta qalam va koʻp qalam koʻrsatib farqni namoyish qiladi.",
              "1-mashq birga bajariladi.",
              "Sinfdagi buyumlar sanab, There are … gaplari tuziladi.",
            ],
          },
          {
            title: "Mustahkamlash (SB 25, 2–3-mashqlar)",
            minutes: 13,
            points: [
              "2–3-mashqlar: audio 29 tinglanadi.",
              "Bolalar yes yoki no kartochkasini koʻtarib javob beradi.",
            ],
          },
          {
            title: "in / on bilan TPR",
            minutes: 15,
            points: [
              "Ustoz buyruq beradi: Put the pen on the book. / Put the pen in the box.",
              "Bolalar buyruqni bajaradi, keyin navbat bilan buyruq beradi.",
              "Doskaga ikki rasm chizilib, in va on imzolanadi.",
            ],
          },
          {
            title: "Amaliyot (SB 25, 4-mashq)",
            minutes: 12,
            points: [
              "4-mashq ustoz bilan birga bajariladi.",
              "Javoblar xor bilan aytiladi va daftarga koʻchiriladi.",
            ],
          },
          {
            title: "Speaking (SB 25, 5-mashq)",
            minutes: 15,
            points: [
              "5-mashq: har bir bola oʻz uyi haqida uch gap aytadi.",
              "Gaplar doskada ustoz bilan birga tuziladi va daftarga yoziladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Tezkor oʻyin: ustoz buyumni joylashtiradi, bolalar in yoki on deb aytadi.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 17: there is / there are — ikki mashq.",
          "Uyining bir xonasini chizib, ostiga ikkita there is yoki there are gapi yozib kelish.",
        ],
        ustozga: "Bolalar there are dan keyin koʻplik qoʻshimchasini tushirib qoldiradi (There are three bedroom). Har gapdan keyin oxiridagi s ni birga aytishni odat qiling. in va on ni faqat rasm emas, haqiqiy buyum bilan koʻrsating.",
      },
      {
        focus: "Xonamdagi buyumlar va have got",
        sb: "26–27",
        maqsad: [
          "Oʻquvchilar xonadagi buyumlarni nomlay oladilar.",
          "Oʻquvchilar have got bilan nimasi borligini ayta oladilar.",
          "Oʻquvchilar oʻz xonasi haqida qisqa gaplar yoza oladilar.",
        ],
        lugat: [
          "bookcase – kitob javoni",
          "board game – stol oʻyini",
          "clock – devor soati",
          "poster – plakat",
          "bed – karavot",
          "lamp – chiroq",
          "have got – bor (menda)",
          "has got – bor (unda)",
        ],
        resurslar: [
          "SB 26–27",
          "Audio 30–32",
          "Xona buyumlari flashcardlari, sehrli xalta",
          "Memory tray (patnis va 8 buyum)",
          "A4 varaq va rangli qalamlar",
        ],
        blocks: [
          {
            title: "Warm-up: sehrli xalta",
            minutes: 10,
            points: [
              "Bola xaltadan buyum olib There is a … deydi.",
              "Oʻtgan darsdagi in va on buyruqlari qisqa takrorlanadi.",
            ],
          },
          {
            title: "Vocabulary: Things in my room (SB 26, 1-mashq)",
            minutes: 13,
            points: [
              "1-mashq: audio 30 tinglanadi, soʻzlar rasmga moslanadi.",
              "Flashcardlar bilan xor takror.",
            ],
          },
          {
            title: "Oʻyin: Memory tray",
            minutes: 12,
            points: [
              "Patnisga sakkiz buyum qoʻyiladi, bolalar bir daqiqa qaraydi.",
              "Patnis yopiladi, bolalar eslagan buyumlarini aytadi va yozadi.",
            ],
          },
          {
            title: "Reading (SB 26, 2–3-mashqlar)",
            minutes: 15,
            points: [
              "2-mashq: audio 31 tinglanadi, matn ustoz bilan birga oʻqiladi.",
              "3-mashq birga bajariladi, javoblar matndan koʻrsatiladi.",
            ],
          },
          {
            title: "Pronunciation: Lists (SB 26, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "1-mashq: audio 32 tinglanadi, roʻyxat ohangi takrorlanadi.",
              "2-mashq: roʻyxat zanjiri oʻyini — har bir bola bitta buyum qoʻshadi.",
            ],
          },
          {
            title: "Grammar: have got (+) (SB 27, 1–3 va 5-mashqlar)",
            minutes: 15,
            points: [
              "1–3-mashqlar ustoz bilan birga bajariladi.",
              "5-mashq: bolalar oʻz xonasini chizib, ostiga ikki-uch gap yozadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ikki-uch bola oʻz rasmini koʻrsatib gap aytadi.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 18: Things in my room.",
          "Xona rasmi ostiga have got ishlatilgan uch gap yozib kelish.",
        ],
        ustozga: "have got bolalarga ikki soʻzli feʼl sifatida qiyin — have va got ni doim birga aytishni odat qildiring, alohida qoldirmang. Roʻyxat zanjiri oʻyinida oxirgi buyumdan oldin ohang koʻtarilishini oʻzingiz namoyish qiling.",
      },
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
      {
        focus: "Sumkamdagi buyumlar va have got (−)",
        sb: "28–29",
        maqsad: [
          "Oʻquvchilar maktab sumkasidagi buyumlarni nomlay oladilar.",
          "Oʻquvchilar have got inkor shakli bilan nimasi yoʻqligini ayta oladilar.",
          "Oʻquvchilar soʻzlardagi boʻgʻin sonini eshitib ajrata oladilar.",
        ],
        lugat: [
          "coat – palto",
          "gloves – qoʻlqop",
          "hat – shlyapa, qalpoq",
          "keys – kalitlar",
          "scarf – sharf",
          "wallet – hamyon",
          "water bottle – suv shishasi",
          "have not got – yoʻq (menda)",
          "syllable – boʻgʻin",
        ],
        resurslar: [
          "SB 28–29, Grammar reference SB 140",
          "Audio 33–37",
          "Sumka buyumlari flashcardlari yoki haqiqiy buyumlar",
          "Doska, marker, proyektor",
          "Sekundomer (roʻyxat musobaqasi uchun)",
        ],
        blocks: [
          {
            title: "Warm-up: About you (SB 28)",
            minutes: 10,
            points: [
              "Har bir oʻquvchi oʻz xonasidagi buyumlar haqida bir daqiqa gapiradi.",
              "Sherigi tinglab, ikki savol beradi (have got bilan).",
            ],
          },
          {
            title: "Vocabulary: Things in my school bag (SB 28, 1-mashq)",
            minutes: 13,
            points: [
              "1-mashq: audio 33 bilan soʻzlar tinglanadi va rasmga moslanadi.",
              "Oʻquvchilar oʻz sumkasidagi buyumlarni chiqarib, inglizcha nomini aytadi.",
            ],
          },
          {
            title: "Reading (SB 28, 2–3-mashqlar)",
            minutes: 15,
            points: [
              "2-mashq: audio 34 bilan bloglar tinglanadi va oʻqiladi.",
              "3-mashq: bloglar sumkalarga moslanadi, javob matndagi dalil bilan asoslanadi.",
            ],
          },
          {
            title: "Pronunciation: Syllables (SB 28, 4-mashq)",
            minutes: 12,
            points: [
              "4-mashq: audio 35–36 tinglanadi.",
              "Boʻgʻinlar qarsak bilan sanaladi, soʻzlar doskada ustunlarga ajratiladi.",
            ],
          },
          {
            title: "Grammar: have got (−) (SB 29, 1–3-mashqlar)",
            minutes: 20,
            points: [
              "Ustoz doskada tasdiq va inkor shakllarini yonma-yon yozadi.",
              "1–3-mashqlar bajariladi (audio 37 bilan tekshiriladi).",
              "Grammar reference SB 140 ochiladi, qisqa shakllar (have not / has not) mashq qilinadi.",
              "Zanjir mashqi: har bir oʻquvchi sumkasida nima yoʻqligini aytadi.",
            ],
          },
          {
            title: "Speaking: roʻyxat musobaqasi (SB 29, 4-mashq)",
            minutes: 12,
            points: [
              "4-mashq: bir daqiqada sumkasidagi buyumlar roʻyxati tuziladi.",
              "Juftlikda, keyin toʻrt kishilik guruhda roʻyxatlar solishtiriladi.",
              "Guruh umumiy roʻyxatini inkor gaplar bilan sinfga aytadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 8,
            points: [
              "Doskadagi besh gapdagi xato inkor shakllar birga tuzatiladi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 20–21: sumka buyumlari, Reading va Grammar (have got inkor).",
          "Oʻz sumkasida boʻlmagan besh buyumni inkor gap bilan yozib kelish.",
        ],
        ustozga: "Oʻquvchilar inkorda I do not have got deb qoʻshib yuboradi — have got ning inkori do siz yasalishini taʼkidlang. gloves va keys doim koʻplikda ishlatilishini ham eslatib oʻting.",
      },
      {
        focus: "Sifatlar, tinglash va have got savollari",
        sb: "30–31",
        maqsad: [
          "Oʻquvchilar buyumlarni sifatlar bilan tasvirlay oladilar.",
          "Oʻquvchilar Have you got …? savolini tuzib, qisqa javob bera oladilar.",
          "Oʻquvchilar sinf soʻrovnomasini oʻtkazib, natijasini yoza oladilar.",
        ],
        lugat: [
          "clean / dirty – toza / kir",
          "light / dark – ochiq / toʻq (rang)",
          "long / short – uzun / kalta",
          "new / old – yangi / eski",
          "big / small – katta / kichik",
          "Have you got …? – Senda … bormi?",
          "Yes, I have. / No, I have not. – Ha / Yoʻq",
        ],
        resurslar: [
          "SB 30–31, Grammar reference SB 140",
          "Audio 38–40, video 03 (Things in your bag)",
          "Sifatlar kartochkalari va turli buyumlar",
          "Soʻrovnoma jadvali uchun varaqlar",
          "Doska, marker, proyektor",
        ],
        blocks: [
          {
            title: "Warm-up: buyumlarni tasvirlash",
            minutes: 10,
            points: [
              "Har bir oʻquvchi sinfdagi uch buyumni rang va sifat bilan tasvirlaydi.",
              "Ustoz sifatlar tartibini doskada eslatadi: sifat + rang + ot.",
            ],
          },
          {
            title: "Vocabulary: Adjectives — things (SB 30, 1–5-mashqlar)",
            minutes: 18,
            points: [
              "1–2-mashqlar: audio 38 bilan sifatlar tinglanadi va juftlanadi.",
              "3–4-mashqlar bajariladi, javoblar juftlikda tekshiriladi.",
              "5-mashq: oʻquvchilar oʻz buyumlarini ikki sifat bilan tasvirlaydi.",
            ],
          },
          {
            title: "Listening (SB 30, 6–7-mashqlar)",
            minutes: 15,
            points: [
              "6-mashq: audio 39 birinchi marta umumiy mazmun uchun tinglanadi.",
              "7-mashq: ikkinchi tinglashda nima yoʻqligi aniqlanadi va yoziladi.",
            ],
          },
          {
            title: "Grammar: have got questions (SB 31, 1–3-mashqlar)",
            minutes: 17,
            points: [
              "Ustoz doskada savol tartibini koʻrsatadi: have gap boshiga chiqadi.",
              "1–3-mashqlar bajariladi (audio 40 bilan tekshiriladi).",
              "Grammar reference SB 140 ochiladi, qisqa javob shakllari mashq qilinadi.",
            ],
          },
          {
            title: "Writing: sinf soʻrovnomasi (SB 31, Writing 1-mashq va video 03)",
            minutes: 20,
            points: [
              "Video 03 (Things in your bag) koʻriladi va qisqa muhokama qilinadi.",
              "Writing 1-mashq: oʻquvchilar olti Have you got …? savolini tuzadi.",
              "Toʻrt kishidan soʻrab, jadval toʻldiriladi.",
              "Natija boʻyicha uch-toʻrt gapdan iborat qisqa hisobot yoziladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ikki-uch oʻquvchi soʻrovnoma natijasini sinfga aytadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 22–23: Adjectives, Listening, Grammar va Writing (soʻrovnoma).",
          "Soʻrovnoma hisobotini toza koʻchirib, uch xulosa gapi qoʻshib kelish.",
        ],
        ustozga: "Sifatlar tartibi (a new black bag, a black new bag emas) oʻquvchilarga qiyin — doskada qolip yozib, har mashqda unga qaytib turing. Qisqa javobda got takrorlanmasligini (Yes, I have.) alohida mashq qiling.",
      },
      {
        focus: "Life Skills: Being creative and being you",
        sb: "32–33 (Life Skills)",
        maqsad: [
          "Oʻquvchilar xona jihozlarini nomlab, oʻz xonasini tasvirlay oladilar.",
          "Oʻquvchilar looks like va cool kabi foydali iboralarni ishlata oladilar.",
          "Oʻquvchilar yangi xona rejasini tuzib, uni sherigiga taqdim eta oladilar.",
        ],
        lugat: [
          "sofa – divan",
          "rug – gilamcha",
          "shelf – javon, tokcha",
          "light – chiroq",
          "fishbowl – baliq akvariumi",
          "creative – ijodiy",
          "looks like – oʻxshaydi",
          "cool – zoʻr, ajoyib",
        ],
        resurslar: [
          "SB 32–33 (Life Skills)",
          "Audio 41–42",
          "Xona jihozlari flashcardlari",
          "A3 varaq, chizgʻich va rangli qalamlar (xona rejasi uchun)",
          "Proyektor",
        ],
        blocks: [
          {
            title: "Warm-up (SB 32, 1-mashq)",
            minutes: 10,
            points: [
              "1-mashq: juftlikda muhokama — sevimli xona va sevimli rang.",
              "Ustoz javoblarni doskaga yigʻib, sinf statistikasini chiqaradi.",
            ],
          },
          {
            title: "Reading (SB 32, 2–3-mashqlar)",
            minutes: 15,
            points: [
              "2-mashq: rasmlarga qarab taxmin qilinadi.",
              "3-mashq: audio 41 bilan intervyu tinglanadi va oʻqiladi, taxminlar tekshiriladi.",
            ],
          },
          {
            title: "Vocabulary va mustahkamlash (SB 32, 4–6-mashqlar)",
            minutes: 15,
            points: [
              "4-mashq: gaplardagi notoʻgʻri soʻz topilib tuzatiladi.",
              "5-mashq: yangi soʻzlar (sofa, rug, shelf, light, fishbowl) rasmga moslanadi.",
              "6-mashq: oʻquvchilar oʻz mehmonxonasi haqida gaplar tuzadi.",
            ],
          },
          {
            title: "Listening (SB 33, 7–8-mashqlar)",
            minutes: 15,
            points: [
              "7-mashq: audio 42 birinchi marta tinglanadi.",
              "8-mashq: ikkinchi tinglashda tafsilotlar yoziladi va tekshiriladi.",
            ],
          },
          {
            title: "Useful language (SB 33, 9–10-mashqlar)",
            minutes: 12,
            points: [
              "9-mashq: looks like va It is cool. iboralari tahlil qilinadi.",
              "10-mashq bajariladi; juftlikda ibora bilan rasm tasvirlanadi.",
            ],
          },
          {
            title: "Project: yangi yotoqxona rejasi",
            minutes: 15,
            points: [
              "Har bir oʻquvchi A3 varaqqa yangi yotoqxona rejasini chizadi.",
              "Rejaga kamida besh jihoz va rang tanlovi kiritiladi.",
              "Juftlikda taqdim etiladi, sherigi Useful language iboralari bilan fikr bildiradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 8,
            points: [
              "Ikki oʻquvchi rejasini sinfga koʻrsatadi.",
              "Uy vazifasi va baholash mezonlari aytiladi.",
            ],
          },
        ],
        uyga: [
          "Project: yangi xona rejasini tugatish va besh-olti gap bilan tasvirlash.",
          "Tavsifda kamida ikkita Useful language iborasidan foydalanish.",
        ],
        ustozga: "Bu dars jihoz nomlari koʻp — hammasini yodlashni emas, rejada ishlata olishni maqsad qiling. Chizishga ketadigan vaqtni qatʼiy nazorat qiling, aks holda taqdimotga vaqt qolmaydi.",
      },
      {
        focus: "Review 1 (Unit 1–4)",
        sb: "34–35 (Review 1)",
        maqsad: [
          "Oʻquvchilar Unit 1–4 lugʻatini va grammatikasini takrorlab mustahkamlaydilar.",
          "Oʻquvchilar tinglash va oʻqish topshiriqlarini mustaqil bajara oladilar.",
          "Oʻquvchilar gaplarni katta harf va nuqta qoidasiga rioya qilib yoza oladilar.",
        ],
        lugat: [
          "family – oila",
          "bedroom – yotoqxona",
          "wallet – hamyon",
          "nationality – millat",
          "have got – bor (egalik)",
          "there is / there are – bor",
          "clean / dirty – toza / kir",
          "hungry – och",
        ],
        resurslar: [
          "SB 34–35 (Review 1), SB 126–127 (Vocabulary list)",
          "Grammar reference SB 137–140",
          "Unit 1–4 flashcardlari",
          "Doska, marker, proyektor",
        ],
        blocks: [
          {
            title: "Warm-up: jamoaviy viktorina",
            minutes: 10,
            points: [
              "Sinf ikki jamoaga boʻlinadi, ustoz Unit 1–4 soʻzlarini soʻraydi.",
              "Har toʻgʻri javob uchun ochko beriladi, natija doskada yozib boriladi.",
            ],
          },
          {
            title: "Vocabulary (SB 34, 1–3-mashqlar)",
            minutes: 15,
            points: [
              "1–2-mashqlar mustaqil bajariladi, javoblar juftlikda tekshiriladi.",
              "3-mashq juftlikda savol-javob shaklida oʻtkaziladi.",
            ],
          },
          {
            title: "Grammar (SB 34, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "1–2-mashqlar mustaqil bajariladi.",
              "Ustoz koʻp uchragan xatolarni doskaga yigʻib, birga tahlil qiladi.",
              "Zarur boʻlsa Grammar reference SB 137–140 ochiladi.",
            ],
          },
          {
            title: "Listening va Reading (SB 35, 1-mashqlar)",
            minutes: 15,
            points: [
              "Listening 1-mashq: ikki oʻquvchi haqidagi maʼlumotlar toʻldiriladi (ikki marta tinglanadi).",
              "Reading 1-mashq: matn oʻqilib, right / wrong belgilanadi.",
            ],
          },
          {
            title: "Speaking (SB 35, 1-mashq)",
            minutes: 12,
            points: [
              "Have you got …? savollari bilan ochko oʻyini oʻynaladi.",
              "Juftliklar almashtiriladi, ustoz kuzatib xatolarni yozib boradi.",
            ],
          },
          {
            title: "Writing (SB 35, 1-mashq)",
            minutes: 13,
            points: [
              "Gaplar katta harf va nuqta bilan qayta yoziladi.",
              "Juftlikda almashib tekshiriladi, ustoz namunani doskada koʻrsatadi.",
            ],
          },
          {
            title: "Yakun: xatolar tahlili",
            minutes: 10,
            points: [
              "Ustoz yozib olgan xatolarni sinf bilan birga tuzatadi.",
              "Har bir oʻquvchi oʻziga takrorlash uchun ikki mavzu belgilaydi.",
            ],
          },
        ],
        uyga: [
          "Vocabulary list (SB 126–127): Unit 1–4 soʻzlari va Grammar reference (SB 137–140) mashqlari.",
          "Oʻzi belgilagan ikki mavzu boʻyicha WB dagi bajarilmagan mashqlarni tugatish.",
        ],
        ustozga: "Review darsini test kabi emas, xatolar ustida ishlash darsi sifatida oʻtkazing — har bir xatoni sabab bilan tushuntiring. Speaking oʻyinida ochko emas, toʻgʻri savol tuzish muhimligini eslatib turing.",
      },
    ],
    kids: [
      {
        focus: "Sumkamdagi buyumlar",
        sb: "28",
        maqsad: [
          "Oʻquvchilar maktab sumkasidagi buyumlarni nomlay oladilar.",
          "Oʻquvchilar rasmga qarab kimning sumkasi ekanini topa oladilar.",
          "Oʻquvchilar buyum nomlarini chant ritmida ayta oladilar.",
        ],
        lugat: [
          "coat – palto",
          "gloves – qoʻlqop",
          "hat – shlyapa, qalpoq",
          "keys – kalitlar",
          "scarf – sharf",
          "wallet – hamyon",
          "water bottle – suv shishasi",
          "school bag – maktab sumkasi",
        ],
        resurslar: [
          "SB 28",
          "Audio 33–34",
          "Haqiqiy buyumlar va katta sumka (sehrli sumka oʻyini uchun)",
          "Buyum flashcardlari",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: have got takrori",
            minutes: 10,
            points: [
              "Xona rasmlari koʻrsatiladi, bolalar have got bilan gap tuzadi.",
              "Oʻtgan darsdagi buyum flashcardlari tez takrorlanadi.",
            ],
          },
          {
            title: "Vocabulary: Things in my school bag (SB 28, 1-mashq)",
            minutes: 13,
            points: [
              "1-mashq: audio 33 tinglanadi, soʻzlar rasmga moslanadi.",
              "Flashcardlar bilan xor takror, har soʻzga bitta harakat qoʻshiladi (TPR).",
            ],
          },
          {
            title: "Oʻyin: sehrli sumka",
            minutes: 15,
            points: [
              "Katta sumkaga haqiqiy buyumlar solinadi.",
              "Bola qoʻlini solib, koʻrmasdan buyumni ushlab nomini taxmin qiladi.",
              "Toʻgʻri topsa buyumni chiqarib sinfga koʻrsatadi.",
            ],
          },
          {
            title: "Reading (SB 28, 2-mashq)",
            minutes: 12,
            points: [
              "2-mashq: audio 34 tinglanadi, matn ustoz bilan birga oʻqiladi.",
              "Qaysi sumka kimniki ekani topiladi.",
            ],
          },
          {
            title: "Mustahkamlash (SB 28, 3-mashq)",
            minutes: 15,
            points: [
              "3-mashq juftlikda bajariladi.",
              "Bolalar rasmga qarab buyumni aytadi, sherigi koʻrsatadi.",
              "Javoblar sinf bilan birga tekshiriladi.",
            ],
          },
          {
            title: "Chant: What is in your bag?",
            minutes: 15,
            points: [
              "Ustoz oddiy chant ritmini beradi, bolalar buyumlarni ketma-ket qoʻshadi.",
              "Chant qarsak bilan ikki guruhda aytiladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Flashcardlar bilan tezkor takror.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 20: sumka buyumlari (bir-ikki mashq).",
          "Oʻz sumkasidagi besh buyumni rasm bilan chizib, nomini yozib kelish.",
        ],
        ustozga: "gloves va keys doim koʻplikda ishlatiladi — bolalarga bitta qoʻlqop emas, juft koʻrinishida koʻrsating. Sehrli sumka oʻyinida hamma bolaga navbat yetishini nazorat qiling.",
      },
      {
        focus: "have got inkor shakli va boʻgʻinlar",
        sb: "29",
        maqsad: [
          "Oʻquvchilar have not got bilan nimasi yoʻqligini ayta oladilar.",
          "Oʻquvchilar soʻzdagi boʻgʻin sonini qarsak bilan sanay oladilar.",
          "Oʻquvchilar tez roʻyxat tuzish topshirigʻini bajara oladilar.",
        ],
        lugat: [
          "have not got – yoʻq (menda)",
          "coat – palto",
          "hat – shlyapa, qalpoq",
          "keys – kalitlar",
          "wallet – hamyon",
          "scarf – sharf",
          "syllable – boʻgʻin",
          "clap – qarsak chalmoq",
        ],
        resurslar: [
          "SB 28–29",
          "Audio 35–37",
          "Buyum flashcardlari",
          "Yes va no kartochkalari",
          "Doska, marker, sekundomer",
        ],
        blocks: [
          {
            title: "Warm-up: I have got … flashcardlari",
            minutes: 10,
            points: [
              "Ustoz kartochkani koʻrsatadi, bola I have got a … deydi.",
              "Kartochka teskari qilinsa, bola I have not got a … deydi.",
            ],
          },
          {
            title: "Pronunciation: Syllables (SB 28, 4-mashq)",
            minutes: 13,
            points: [
              "4-mashq: audio 35–36 tinglanadi.",
              "Har soʻz qarsak bilan boʻgʻinlarga ajratiladi.",
            ],
          },
          {
            title: "Boʻgʻin oʻyinlari",
            minutes: 15,
            points: [
              "Polga 1, 2, 3 raqamlari qoʻyiladi; ustoz soʻz aytadi, bola boʻgʻin soniga sakraydi.",
              "Guruhlar soʻzlarni boʻgʻin soni boʻyicha ustunlarga teradi.",
            ],
          },
          {
            title: "Grammar: have got (−) (SB 29, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz doskaga tasdiq va inkorni ikki rangda yozadi.",
              "1–2-mashqlar: audio 37 tinglanadi, bolalar yes yoki no kartochkasini koʻtaradi.",
            ],
          },
          {
            title: "Mustahkamlash (SB 29, 3-mashq)",
            minutes: 12,
            points: [
              "3-mashq ustoz bilan birga bajariladi.",
              "Javoblar xor bilan aytiladi va daftarga koʻchiriladi.",
            ],
          },
          {
            title: "Oʻyin: roʻyxat musobaqasi (SB 29, 4-mashq)",
            minutes: 15,
            points: [
              "4-mashq: bir daqiqada sumkasidagi buyumlar roʻyxati tuziladi.",
              "Guruhlar roʻyxatlarini solishtiradi, eng koʻp soʻz topgan guruh gʻolib boʻladi.",
              "Har bir guruh bitta inkor gap aytadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Tezkor oʻyin: ustoz buyum aytadi, bola bor yoki yoʻqligini inglizcha aytadi.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 21: have got inkor shakli — ikki mashq.",
          "Uyda boʻlmagan uch buyumni inkor gap bilan yozib kelish.",
        ],
        ustozga: "Bolalar not soʻzini tushirib qoldiradi yoki notoʻgʻri joyga qoʻyadi — inkorni doim qoʻl belgisi bilan birga ayting. Boʻgʻin oʻyini shovqinli boʻladi, oldindan toʻxtash signalini kelishib oling.",
      },
      {
        focus: "Sifatlar va Have you got …?",
        sb: "30–31",
        maqsad: [
          "Oʻquvchilar buyumlarni sifatlar bilan tasvirlay oladilar.",
          "Oʻquvchilar Have you got …? savolini berib, qisqa javob ayta oladilar.",
          "Oʻquvchilar sinfda kichik soʻrov oʻtkaza oladilar.",
        ],
        lugat: [
          "clean / dirty – toza / kir",
          "long / short – uzun / kalta",
          "new / old – yangi / eski",
          "big / small – katta / kichik",
          "light / dark – ochiq / toʻq (rang)",
          "Have you got …? – Senda … bormi?",
          "Yes, I have. – Ha, bor",
        ],
        resurslar: [
          "SB 30–31",
          "Audio 38–40, video 03 (Things in your bag)",
          "Sifat kartochkalari (juft-juft qilib)",
          "Turli oʻlchamdagi buyumlar",
          "Doska, marker, proyektor",
        ],
        blocks: [
          {
            title: "Warm-up: sifat kartochkalari TPR",
            minutes: 10,
            points: [
              "Ustoz big deydi, bolalar qoʻlini keng yoyadi; small deydi, kichraytiradi.",
              "Har bir sifat juftiga alohida harakat belgilanadi.",
            ],
          },
          {
            title: "Vocabulary: Adjectives — things (SB 30, 1–2-mashqlar)",
            minutes: 12,
            points: [
              "1–2-mashqlar: audio 38 tinglanadi, sifatlar juftlanadi.",
              "Soʻzlar harakat bilan birga takrorlanadi.",
            ],
          },
          {
            title: "Mustahkamlash (SB 30, 3–4-mashqlar)",
            minutes: 15,
            points: [
              "3–4-mashqlar ustoz bilan birga bajariladi.",
              "Bolalar rasmdan buyumlarni topib, sifat bilan aytadi.",
            ],
          },
          {
            title: "Listening (SB 30, 6–7-mashqlar)",
            minutes: 13,
            points: [
              "6-mashq: audio 39 tinglanadi.",
              "7-mashq ikkinchi tinglashda birga bajariladi.",
            ],
          },
          {
            title: "Grammar: have got questions (SB 31, 1–3-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz savol tartibini doskada rasm bilan koʻrsatadi.",
              "1–3-mashqlar: audio 40 bilan birga bajariladi.",
              "Qisqa javoblar kartochka koʻtarish bilan mashq qilinadi.",
            ],
          },
          {
            title: "Speaking: Find someone who …",
            minutes: 15,
            points: [
              "Video 03 koʻriladi.",
              "Bolalar uch savol bilan sinf boʻylab yurib soʻraydi va ism yozadi.",
              "Uch bola natijasini sinfga aytadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Sifat kartochkalari bilan tezkor takror.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 22: sifatlar.",
          "Uchta Have you got …? savolini yozib, oila aʼzolaridan soʻrab kelish.",
        ],
        ustozga: "Bolalar savolda have ni gap boshiga chiqarmay You have got …? deb soʻraydi — savol ohangini emas, soʻz tartibini talab qiling. Find someone who oʻyinida sinf boʻylab yurish qoidalarini oldindan aytib qoʻying.",
      },
      {
        focus: "Life Skills: Being creative and being you",
        sb: "32–33 (Life Skills)",
        maqsad: [
          "Oʻquvchilar xona jihozlarini nomlay oladilar.",
          "Oʻquvchilar orzudagi xonasini chizib, uch gap bilan tanishtira oladilar.",
          "Oʻquvchilar looks like va cool iboralarini ishlata boshlaydilar.",
        ],
        lugat: [
          "sofa – divan",
          "rug – gilamcha",
          "shelf – javon, tokcha",
          "light – chiroq",
          "fishbowl – baliq akvariumi",
          "favourite – sevimli",
          "looks like – oʻxshaydi",
          "cool – zoʻr",
        ],
        resurslar: [
          "SB 32–33 (Life Skills)",
          "Audio 41–42",
          "Jihoz flashcardlari",
          "A4 varaq va rangli qalamlar",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up (SB 32, 1-mashq)",
            minutes: 10,
            points: [
              "1-mashq: sevimli rang va sevimli xona haqida qisqa suhbat.",
              "Bolalar sevimli rangini rangli qalam koʻtarib koʻrsatadi.",
            ],
          },
          {
            title: "Reading (SB 32, 2-mashq)",
            minutes: 12,
            points: [
              "2-mashq: rasmlarga qarab taxmin qilinadi.",
              "Audio 41 tinglanadi, matn ustoz bilan birga oʻqiladi.",
            ],
          },
          {
            title: "Matn boʻyicha topshiriq (SB 32, 3-mashq)",
            minutes: 15,
            points: [
              "3-mashq birga bajariladi.",
              "Javoblar matndan barmoq bilan topib koʻrsatiladi.",
            ],
          },
          {
            title: "Vocabulary: yangi jihozlar (SB 32, 5-mashq)",
            minutes: 15,
            points: [
              "5-mashq: sofa, rug, light, shelf, fishbowl flashcardlari koʻrsatiladi.",
              "Soʻzlar xor bilan takrorlanadi va rasmga moslanadi.",
              "Bolalar sinf rasmida jihozlarni topib koʻrsatadi.",
            ],
          },
          {
            title: "Listening va Useful language (SB 33, 7 va 9-mashqlar)",
            minutes: 13,
            points: [
              "7-mashq: audio 42 tinglanadi va birga tekshiriladi.",
              "9-mashq: looks like va It is cool. iboralari takrorlanadi.",
            ],
          },
          {
            title: "Project: orzudagi xona",
            minutes: 15,
            points: [
              "Har bir bola orzudagi xonasini chizadi.",
              "Rasmga kamida toʻrt jihoz kiritiladi va inglizcha imzolanadi.",
              "Bolalar juftlikda rasmni koʻrsatib uch gap aytadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ikki bola rasmini sinfga koʻrsatadi.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Rasmni uyda tugatib, oilaga inglizcha tanishtirish.",
          "Rasmdagi toʻrt jihoz nomini daftarga yozib kelish.",
        ],
        ustozga: "fishbowl va shelf bolalarga yangi va qiyin — rasm bilan bogʻlang, yozishni talab qilmang. Chizishga 10 daqiqadan koʻp vaqt ketmasligini kuzatib boring.",
      },
      {
        focus: "Review 1: lugʻat va grammatika oʻyinlari",
        sb: "34 (Review 1)",
        maqsad: [
          "Oʻquvchilar Unit 1–4 soʻzlarini oʻyin orqali takrorlaydilar.",
          "Oʻquvchilar be, have got va there is / there are shakllarini ajrata oladilar.",
          "Oʻquvchilar juftlikda savol berib, javob ayta oladilar.",
        ],
        lugat: [
          "family – oila",
          "bedroom – yotoqxona",
          "hat – shlyapa, qalpoq",
          "hungry – och",
          "there is – bor (bitta)",
          "have got – bor (egalik)",
          "his / her – uning",
          "our – bizning",
        ],
        resurslar: [
          "SB 34 (Review 1)",
          "Unit 1–4 flashcardlari",
          "O va X oʻyini uchun doskada katak chizmasi",
          "Doska, marker",
          "Kichik mukofot stikerlari",
        ],
        blocks: [
          {
            title: "Warm-up: Board race",
            minutes: 10,
            points: [
              "Sinf ikki jamoaga boʻlinadi.",
              "Ustoz soʻzni oʻzbekcha aytadi, birinchi boʻlib doskaga toʻgʻri yozgan jamoa ochko oladi.",
            ],
          },
          {
            title: "Vocabulary (SB 34, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "1–2-mashqlar ustoz bilan birga bajariladi.",
              "Javoblar xor bilan aytiladi va daftarga koʻchiriladi.",
            ],
          },
          {
            title: "Vocabulary (SB 34, 3-mashq)",
            minutes: 13,
            points: [
              "3-mashq juftlikda savol-javob shaklida oʻtkaziladi.",
              "Ikki-uch juftlik sinf oldida namoyish qiladi.",
            ],
          },
          {
            title: "Grammar (SB 34, 1-mashq)",
            minutes: 15,
            points: [
              "Ustoz doskada be, have got va there is jadvalini birga tuzadi.",
              "1-mashq ustoz bilan birga bajariladi.",
            ],
          },
          {
            title: "Grammar (SB 34, 2-mashq)",
            minutes: 12,
            points: [
              "2-mashq juftlikda bajariladi.",
              "Javoblar sinf bilan tekshiriladi, xatolar doskada tuzatiladi.",
            ],
          },
          {
            title: "Oʻyin: O va X",
            minutes: 15,
            points: [
              "Doskaga toʻqqiz katak chiziladi, har katakka mavzu yoziladi.",
              "Jamoa katakni tanlab, shu mavzudagi savolga javob beradi (be, have got, there is / there are).",
              "Toʻgʻri javobdan keyin jamoa oʻz belgisini qoʻyadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Natijalar eʼlon qilinadi, har bir bolaga stiker beriladi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Unit 1–4 soʻzlaridan oʻntasini rasm bilan lugʻat daftariga yozish.",
          "Shu soʻzlardan uchtasi bilan gap tuzib kelish.",
        ],
        ustozga: "Review darsini baho darsi qilib koʻrsatmang — bolalar oʻyin orqali takrorlaganini sezmasligi kerak. Board race da sekin yozadigan bolalarni ham jamoaga qoʻshib, har kimga navbat bering.",
      },
      {
        focus: "Review 1: koʻnikmalar va takrorlash oʻyinlari",
        sb: "35 (Review 1)",
        maqsad: [
          "Oʻquvchilar qisqa audioni tinglab, maʼlumotni topa oladilar.",
          "Oʻquvchilar rasmli matnni oʻqib, right va wrong ni belgilay oladilar.",
          "Oʻquvchilar gaplarni katta harf va nuqta bilan yoza oladilar.",
        ],
        lugat: [
          "listen – tinglamoq",
          "read – oʻqimoq",
          "write – yozmoq",
          "right / wrong – toʻgʻri / notoʻgʻri",
          "capital letter – katta harf",
          "full stop – nuqta",
          "bag – sumka",
          "house – uy",
        ],
        resurslar: [
          "SB 35 (Review 1)",
          "Review audio treklari",
          "Sinf buyumlari va rang kartochkalari (Simon says uchun)",
          "Doska va marker",
          "Yulduzcha stikerlar",
        ],
        blocks: [
          {
            title: "Warm-up: Simon says",
            minutes: 10,
            points: [
              "Sinf buyumlari va ranglar bilan Simon says oʻyini oʻynaladi.",
              "Buyruqlar tezlashtirilib boriladi.",
            ],
          },
          {
            title: "Listening (SB 35, 1-mashq)",
            minutes: 15,
            points: [
              "Audio ikki marta, pauzalar bilan tinglanadi.",
              "Bolalar jadvalni toʻldiradi, javoblar birga tekshiriladi.",
            ],
          },
          {
            title: "Reading (SB 35, 1-mashq)",
            minutes: 15,
            points: [
              "Matn ustoz bilan birga oʻqiladi.",
              "Bolalar right yoki wrong belgilaydi va rasmda tekshiradi.",
            ],
          },
          {
            title: "Speaking (SB 35, 1-mashq)",
            minutes: 13,
            points: [
              "Sumkadagi olti buyum boʻyicha ochko oʻyini oʻynaladi.",
              "Juftliklar bir marta almashtiriladi.",
            ],
          },
          {
            title: "Writing: birga yozish (SB 35, 1-mashq)",
            minutes: 15,
            points: [
              "Ustoz doskada birinchi ikki gapni bolalar bilan birga tuzatib yozadi.",
              "Katta harf va nuqta qoidasi rangli marker bilan belgilanadi.",
            ],
          },
          {
            title: "Writing: mustaqil yozish",
            minutes: 12,
            points: [
              "Bolalar qolgan ikki gapni mustaqil qayta yozadi.",
              "Juftlikda almashib tekshiriladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz har bir bolaga bitta maqtov va bitta maslahat aytadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 8–23 dagi bajarilmagan mashqlardan ustoz tanlagan ikki-uchtasini tugatish.",
          "Lugʻat daftaridagi Unit 1–4 soʻzlarini ota-onaga aytib berish.",
        ],
        ustozga: "Yozma qismda bolalar katta harfni faqat gap boshida deb tushunadi — ism, mamlakat va hafta kunlarida ham kerakligini misol bilan koʻrsating. Tinglashni albatta ikki marta bering va birinchi tinglashda yozishni talab qilmang.",
      },
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
      {
        focus: "Qobiliyatlar, tinglash va can",
        sb: "36–37",
        maqsad: [
          "Oʻquvchilar faoliyat va qobiliyat iboralarini nomlay oladilar.",
          "Oʻquvchilar can va cannot bilan qobiliyat haqida gap tuza oladilar.",
          "Oʻquvchilar and, but, or bogʻlovchilari bilan gaplarni bogʻlay oladilar.",
        ],
        lugat: [
          "ride a horse – otga minmoq",
          "swim underwater – suv ostida suzmoq",
          "paint a picture – rasm chizmoq (boʻyoq bilan)",
          "play the guitar – gitara chalmoq",
          "speak Italian – italyanchada gapirmoq",
          "cook spaghetti – spagetti pishirmoq",
          "can / cannot – qila olaman / qila olmayman",
          "and / but / or – va / lekin / yoki",
        ],
        resurslar: [
          "SB 36–37, Grammar reference SB 141",
          "Audio 45–48",
          "Faoliyat flashcardlari",
          "Soʻrov jadvali uchun varaqlar",
          "Doska, marker, proyektor",
        ],
        blocks: [
          {
            title: "Warm-up: About you (SB 36)",
            minutes: 10,
            points: [
              "Har bir oʻquvchi sumkasidagi besh buyumni aytadi, sherigi solishtiradi.",
              "Ustoz yangi mavzuga oʻtish uchun oʻzi qila oladigan ikki ishni aytadi.",
            ],
          },
          {
            title: "Vocabulary: Activities and skills (SB 36, 1-mashq)",
            minutes: 13,
            points: [
              "1-mashq: audio 45 bilan iboralar tinglanadi va rasmga moslanadi.",
              "Ustoz iboralarning feʼl + ot tuzilishini doskada koʻrsatadi.",
            ],
          },
          {
            title: "Listening (SB 36, 2-mashq)",
            minutes: 15,
            points: [
              "2-mashq: audio 46 birinchi marta umumiy mazmun uchun tinglanadi.",
              "Ikkinchi tinglashda kim nimani qila olishi jadvalga yoziladi.",
            ],
          },
          {
            title: "Grammar: can / cannot (SB 37, 1–2-mashqlar)",
            minutes: 17,
            points: [
              "Ustoz doskada can dan keyin feʼl asosiy shaklda kelishini koʻrsatadi (to yoʻq).",
              "1–2-mashqlar bajariladi (audio 46 bilan tekshiriladi).",
              "Grammar reference SB 141 ochiladi va qoida daftarga koʻchiriladi.",
            ],
          },
          {
            title: "Pronunciation: can / cannot (SB 37, 3–4-mashqlar)",
            minutes: 12,
            points: [
              "3-mashq: audio 47 bilan can ning kuchsiz talaffuzi tinglanadi.",
              "4-mashq: audio 48 bilan cannot ning urgʻuli talaffuzi solishtiriladi.",
              "Oʻquvchilar juftlikda gapni aytadi, sherigi tasdiqmi yoki inkormi deb topadi.",
            ],
          },
          {
            title: "Speaking va Writing (SB 37, 5–8-mashqlar)",
            minutes: 15,
            points: [
              "5-mashq: Can you …? savollari tuziladi.",
              "6–7-mashqlar: jadval boʻyicha sherikdan soʻraladi va natija belgilanadi.",
              "8-mashq: and, but, or bilan olti gap yoziladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 8,
            points: [
              "Ikki-uch oʻquvchi sherigi haqida gap aytadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 24–25: Activities and skills, Listening va Grammar (can).",
          "Oʻzi qila oladigan uch va qila olmaydigan ikki ishni and va but bilan yozib kelish.",
        ],
        ustozga: "Eng koʻp uchraydigan xato — can dan keyin to qoʻshish (I can to swim) va uchinchi shaxsda s qoʻshish (He cans). Ikkala xatoni ham doskaga yozib, birga tuzating. cannot va can talaffuzidagi farq tinglashda muhim, shuning uchun 3–4-mashqlarni shoshirmang.",
      },
      {
        focus: "Tana aʼzolari, oʻqish va predloglar",
        sb: "38–39",
        maqsad: [
          "Oʻquvchilar tana aʼzolarini nomlay oladilar.",
          "Oʻquvchilar matnni oʻqib, asosiy maʼlumotni topa oladilar.",
          "Oʻquvchilar in, on, behind, under bilan buyum joyini ayta oladilar.",
        ],
        lugat: [
          "arm – qoʻl (yelkadan)",
          "ear – quloq",
          "face – yuz",
          "foot / feet – oyoq panjasi / panjalari",
          "hand – kaft, qoʻl",
          "tooth / teeth – tish / tishlar",
          "behind – orqasida",
          "under – ostida",
        ],
        resurslar: [
          "SB 38–39, Grammar reference SB 142",
          "Audio 49–51, video 04 (What can you do?)",
          "Tana aʼzolari plakati yoki chizmasi",
          "Oʻyinchoq va quti (predloglar oʻyini uchun)",
          "Doska, marker, proyektor",
        ],
        blocks: [
          {
            title: "Warm-up: Can you …? zanjiri",
            minutes: 10,
            points: [
              "Har bir oʻquvchi keyingisidan Can you …? deb soʻraydi va qisqa javob oladi.",
              "Ustoz xato qilgan savollarni yozib boradi va oxirida tuzatadi.",
            ],
          },
          {
            title: "Vocabulary: Parts of the body (SB 38, 1-mashq)",
            minutes: 13,
            points: [
              "1-mashq: audio 49 bilan soʻzlar tinglanadi va rasmga moslanadi.",
              "Ustoz foot / feet va tooth / teeth notoʻgʻri koʻpliklarini alohida yozadi.",
            ],
          },
          {
            title: "Mustahkamlash (SB 38, 2–3-mashqlar)",
            minutes: 12,
            points: [
              "2–3-mashqlar: audio 50 tinglanadi.",
              "Oʻquvchilar eshitgan aʼzoni oʻzida tez koʻrsatadi (musobaqa shaklida).",
            ],
          },
          {
            title: "Reading: Rubberboy (SB 38, 4-mashq)",
            minutes: 17,
            points: [
              "4-mashq: audio 51 bilan matn tinglanadi va oʻqiladi.",
              "Topshiriq bajariladi, javoblar matndagi dalil bilan asoslanadi.",
              "Juftlikda muhokama: matndagi qobiliyat haqida fikr bildirish.",
            ],
          },
          {
            title: "Grammar: Prepositions in, on, behind, under (SB 39, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz oʻyinchoq va quti bilan toʻrt predlogni namoyish qiladi.",
              "1–2-mashqlar bajariladi, Grammar reference SB 142 ochiladi.",
            ],
          },
          {
            title: "Talking points va Speaking (SB 39, 1-mashq)",
            minutes: 13,
            points: [
              "Video 04 (What can you do?) koʻriladi va qisqa muhokama qilinadi.",
              "Speaking 1-mashq: qiziq harakatlar boʻyicha sinf boʻylab Can you …? soʻrovi oʻtkaziladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Soʻrov natijasi sinfda umumlashtiriladi.",
              "Uy vazifasi tushuntiriladi va test darsi haqida ogohlantiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 26–27: Parts of the body, Reading, Grammar (predloglar) va Writing.",
          "Starter–Unit 5 lugʻatini va grammatikasini test uchun takrorlash.",
        ],
        ustozga: "Notoʻgʻri koʻpliklar (feet, teeth) oʻquvchilarga yangi — ularni alohida ustunga yozib, har darsda qaytaring. Predloglarni faqat rasmdan emas, haqiqiy buyum bilan koʻrsating, shunda behind va under aralashmaydi.",
      },
      {
        focus: "Mid-level test (L1)",
        sb: "—",
        maqsad: [
          "Oʻquvchilar Starter–Unit 5 lugʻati va grammatikasi boʻyicha bilimini mustaqil koʻrsata oladilar.",
          "Oʻquvchilar tinglash, oʻqish, yozish va gapirish topshiriqlarini test formatida bajara oladilar.",
          "Oʻquvchilar oʻz xatolarini tushunib, keyingi takrorlash rejasini belgilay oladilar.",
        ],
        lugat: [
          "test – test, nazorat",
          "listening – tinglab tushunish",
          "reading – oʻqib tushunish",
          "writing – yozish",
          "speaking – gapirish",
          "can / cannot – qila olaman / olmayman",
          "have got – bor (egalik)",
          "there is / there are – bor",
        ],
        resurslar: [
          "Markaz testi (Starter–Unit 5): yozma varaqlar",
          "Test uchun audio trek va pleyer",
          "Speaking uchun savol kartochkalari",
          "Baholash jadvali (ustoz uchun)",
          "Doska, marker, sekundomer",
        ],
        blocks: [
          {
            title: "Warm-up va test tuzilishini tushuntirish",
            minutes: 10,
            points: [
              "Besh daqiqalik ogʻzaki takror: can, have got, be, there is / there are.",
              "Ustoz test qismlarini va har qismga ajratilgan vaqtni doskaga yozadi.",
            ],
          },
          {
            title: "Yozma qism: Vocabulary va Grammar",
            minutes: 20,
            points: [
              "Starter–Unit 5 boʻyicha lugʻat va grammatika topshiriqlari mustaqil bajariladi.",
              "Ustoz vaqtni doskada belgilab boradi va savollarga javob bermaydi.",
            ],
          },
          {
            title: "Listening va Reading qismlari",
            minutes: 20,
            points: [
              "Listening: audio ikki marta qoʻyiladi, javoblar varaqqa yoziladi.",
              "Reading: kitobdagi Review topshiriqlari formatidagi matn oʻqilib, savollarga javob beriladi.",
            ],
          },
          {
            title: "Writing qismi",
            minutes: 15,
            points: [
              "Oʻquvchilar berilgan mavzuda 40–60 soʻzlik qisqa matn yozadi.",
              "Baholash mezonlari (mazmun, grammatika, katta harf va nuqta) oldindan eslatiladi.",
            ],
          },
          {
            title: "Speaking qismi",
            minutes: 15,
            points: [
              "Juftlikda savol-javob oʻtkaziladi, ustoz kuzatib baholaydi.",
              "Qolgan oʻquvchilar shu vaqtda yozma qismni tekshirib oʻtiradi.",
            ],
          },
          {
            title: "Yakun: umumiy xatolar tahlili",
            minutes: 10,
            points: [
              "Ustoz eng koʻp uchragan uch-toʻrt xatoni doskada tahlil qiladi.",
              "Har bir oʻquvchiga shaxsiy takrorlash rejasi (ikki-uch mavzu) beriladi.",
            ],
          },
        ],
        uyga: [
          "Xatolar ustida ishlash: test tahlilida belgilangan ikki-uch mavzu boʻyicha Grammar reference (SB 136–142) mashqlari.",
          "Test varaqasidagi har bir xato gapni toʻgʻri shaklda qayta yozib kelish.",
        ],
        ustozga: "Test kuni yangi mavzu bermang va Warm-up ni qisqa tuting, shunda oʻquvchilar bosim his qilmaydi. Speaking qismini yozma bilan bir vaqtda oʻtkazsangiz, sinfda jimlik qoidasini oldindan kelishib oling.",
      },
    ],
    kids: [
      {
        focus: "Qobiliyatlar va tinglash",
        sb: "36",
        maqsad: [
          "Oʻquvchilar faoliyat iboralarini harakat bilan koʻrsatib ayta oladilar.",
          "Oʻquvchilar eshitgan faoliyatni tanib, yes yoki no deb javob bera oladilar.",
          "Oʻquvchilar Charades oʻyinida iborani harakat orqali ifodalay oladilar.",
        ],
        lugat: [
          "ride a horse – otga minmoq",
          "swim – suzmoq",
          "paint a picture – rasm chizmoq",
          "play the guitar – gitara chalmoq",
          "cook – ovqat pishirmoq",
          "dance – raqsga tushmoq",
          "sing – qoʻshiq aytmoq",
          "run – yugurmoq",
        ],
        resurslar: [
          "SB 36",
          "Audio 45–46",
          "Faoliyat flashcardlari (harakatli rasmlar)",
          "Yes va no kartochkalari",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: sehrli sumka",
            minutes: 10,
            points: [
              "Sumka buyumlari sehrli sumka oʻyini bilan takrorlanadi.",
              "Sifat kartochkalari bilan qisqa takror.",
            ],
          },
          {
            title: "Vocabulary: Activities and skills (SB 36, 1-mashq)",
            minutes: 13,
            points: [
              "1-mashq: audio 45 tinglanadi, iboralar rasmga moslanadi.",
              "Har bir ibora harakat bilan koʻrsatiladi (TPR).",
            ],
          },
          {
            title: "Harakatli mashq: flashcard va TPR",
            minutes: 15,
            points: [
              "Ustoz kartochkani koʻrsatadi, bolalar harakatni bajaradi.",
              "Keyin teskarisi: ustoz harakat qiladi, bolalar iborani aytadi.",
              "Tezlik oshirilib, oʻyin musobaqaga aylantiriladi.",
            ],
          },
          {
            title: "Listening (SB 36, 2-mashq)",
            minutes: 12,
            points: [
              "2-mashq: audio 46 tinglanadi.",
              "Bolalar yes yoki no kartochkasini koʻtaradi, javoblar birga tekshiriladi.",
            ],
          },
          {
            title: "Oʻyin: Charades",
            minutes: 15,
            points: [
              "Bir bola kartochkani olib, iborani faqat harakat bilan koʻrsatadi.",
              "Sinf inglizcha topadi; toʻgʻri topgan bola keyingi navbatni oladi.",
            ],
          },
          {
            title: "Mini-loyiha: men qila olaman",
            minutes: 15,
            points: [
              "Har bir bola oʻzi qila oladigan ikki ishni rasm qilib chizadi.",
              "Rasm ostiga ibora yoziladi, bolalar juftlikda koʻrsatib aytadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Flashcardlar bilan tezkor takror.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 24: faoliyat soʻzlari (bir-ikki mashq).",
          "Oʻzi qila oladigan ikki ishni rasm bilan chizib kelish.",
        ],
        ustozga: "Iboralar ikki-uch soʻzdan iborat (play the guitar) — bolalar oxirgi soʻzni aytib qoʻyadi. Har safar toʻliq iborani harakat bilan birga aytishni talab qiling. Charades oʻyinida uyalchan bolalar uchun juftlikda koʻrsatish imkonini bering.",
      },
      {
        focus: "can va cannot (oʻyinlar bilan)",
        sb: "37",
        maqsad: [
          "Oʻquvchilar can bilan qila oladigan ishini ayta oladilar.",
          "Oʻquvchilar cannot bilan qila olmaydigan ishini ayta oladilar.",
          "Oʻquvchilar Can you …? savolini berib, jadval toʻldira oladilar.",
        ],
        lugat: [
          "can – qila olaman",
          "cannot – qila olmayman",
          "Can you …? – Sen … qila olasanmi?",
          "Yes, I can. – Ha, qila olaman",
          "No, I cannot. – Yoʻq, qila olmayman",
          "swim – suzmoq",
          "ride a bike – velosiped haydamoq",
          "and / but – va / lekin",
        ],
        resurslar: [
          "SB 37",
          "Audio 46–48",
          "Faoliyat flashcardlari",
          "Soʻrov jadvali chizilgan varaqlar",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: flashcardlar bilan tezkor aytish",
            minutes: 10,
            points: [
              "Faoliyat kartochkalari tez koʻrsatiladi, bolalar iborani aytadi.",
              "Oʻtgan darsdagi Charades qisqa takrorlanadi.",
            ],
          },
          {
            title: "Grammar: can va cannot (SB 37, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz doskaga ikki rangda can va cannot yozadi va harakat bilan bogʻlaydi.",
              "1–2-mashqlar: audio 46 bilan birga bajariladi.",
            ],
          },
          {
            title: "Oʻyin: bosh barmoq yuqoriga yoki pastga",
            minutes: 13,
            points: [
              "Ustoz gap aytadi, bolalar can boʻlsa barmoqni yuqoriga, cannot boʻlsa pastga koʻtaradi.",
              "Keyin bolalar navbat bilan gap aytadi.",
            ],
          },
          {
            title: "Pronunciation: can va cannot (SB 37, 3–4-mashqlar)",
            minutes: 15,
            points: [
              "3-mashq: audio 47 tinglanadi.",
              "4-mashq: audio 48 tinglanadi, ikki talaffuz solishtiriladi.",
              "Bolalar juftlikda gap aytadi, sherigi qaysi shakl ekanini topadi.",
            ],
          },
          {
            title: "Jadvalni toʻldirish (SB 37, 6-mashq)",
            minutes: 12,
            points: [
              "6-mashq: bolalar oʻz jadvalini toʻldiradi.",
              "Ustoz doskada namuna jadvalni koʻrsatadi.",
            ],
          },
          {
            title: "Soʻrov va yozish (SB 37, 7–8-mashqlar)",
            minutes: 15,
            points: [
              "7-mashq: Can you …? savoli bilan uch bolaga savol beriladi.",
              "8-mashq: and va but bilan ikki gap ustoz bilan birga yoziladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ikki-uch bola oʻz gapini sinfga oʻqib beradi.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 25: can — ikki mashq.",
          "Oʻzi qila oladigan bir va qila olmaydigan bir ishni yozib kelish.",
        ],
        ustozga: "Bolalar cannot ni ikki soʻz qilib ajratib yozadi yoki can not deb aytadi — doskada bir soʻz ekanini koʻrsating. Barmoq oʻyini butun sinfni jalb qiladi, shuning uchun uni tez-tez takrorlang.",
      },
      {
        focus: "Tana aʼzolari va predloglar",
        sb: "38–39",
        maqsad: [
          "Oʻquvchilar tana aʼzolarini nomlab, oʻzida koʻrsata oladilar.",
          "Oʻquvchilar qisqa matnni rasm yordamida tushuna oladilar.",
          "Oʻquvchilar in, on, behind, under bilan buyum joyini ayta oladilar.",
        ],
        lugat: [
          "arm – qoʻl (yelkadan)",
          "ear – quloq",
          "face – yuz",
          "foot / feet – oyoq panjasi / panjalari",
          "hand – kaft, qoʻl",
          "tooth / teeth – tish / tishlar",
          "behind – orqasida",
          "under – ostida",
        ],
        resurslar: [
          "SB 38–39",
          "Audio 49–51, video 04 (What can you do?)",
          "Tana aʼzolari plakati",
          "Oʻyinchoq va quti (yashirish oʻyini uchun)",
          "Doska, marker, proyektor",
        ],
        blocks: [
          {
            title: "Warm-up: Head, shoulders, knees and toes",
            minutes: 10,
            points: [
              "Qoʻshiq harakat bilan ikki marta kuylanadi, tezligi oshiriladi.",
              "Ustoz yangi soʻzlarni plakatda koʻrsatadi.",
            ],
          },
          {
            title: "Vocabulary: Parts of the body (SB 38, 1-mashq)",
            minutes: 12,
            points: [
              "1-mashq: audio 49 tinglanadi, soʻzlar rasmga moslanadi.",
              "Bolalar eshitgan aʼzoni oʻzida koʻrsatadi.",
            ],
          },
          {
            title: "Mustahkamlash va Simon says (SB 38, 2–3-mashqlar)",
            minutes: 13,
            points: [
              "2–3-mashqlar: audio 50 tinglanadi va birga bajariladi.",
              "Simon says oʻyini tana aʼzolari bilan oʻynaladi.",
            ],
          },
          {
            title: "Reading: Rubberboy (SB 38, 4-mashq)",
            minutes: 15,
            points: [
              "4-mashq: audio 51 tinglanadi, matn ustoz bilan birga oʻqiladi.",
              "Savollarga birga javob beriladi, javoblar matndan koʻrsatiladi.",
            ],
          },
          {
            title: "Grammar: in, on, behind, under (SB 39, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz oʻyinchoqni quti bilan turli joyga qoʻyib, toʻrt predlogni koʻrsatadi.",
              "1–2-mashqlar birga bajariladi.",
              "Doskaga toʻrt rasm chizilib, predloglar imzolanadi.",
            ],
          },
          {
            title: "Oʻyin: Where is it? va video 04",
            minutes: 15,
            points: [
              "Oʻyinchoq sinfda yashiriladi, bolalar predloglar bilan taxmin qiladi.",
              "Video 04 koʻriladi.",
              "Speaking 1-mashq: qiziq harakatlar boʻyicha Can you …? soʻrovi oʻtkaziladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Tana aʼzolari qoʻshigʻi yana bir marta kuylanadi.",
              "Yulduzcha bilan baholash; uy vazifasi va test haqida aytiladi.",
            ],
          },
        ],
        uyga: [
          "WB 26: tana aʼzolari.",
          "Rasm chizib, ostiga predlogli uch gap yozib kelish.",
        ],
        ustozga: "foot / feet va tooth / teeth notoʻgʻri koʻpliklarini rasm juftligi bilan bering, qoida sifatida tushuntirmang. Yashirish oʻyinida sinf tartibini saqlash uchun bir vaqtda faqat ikki bolani izlashga qoʻying.",
      },
      {
        focus: "Mid-level test (K1)",
        sb: "—",
        maqsad: [
          "Oʻquvchilar Starter–Unit 5 lugʻatini rasmli topshiriqlarda koʻrsata oladilar.",
          "Oʻquvchilar qisqa audio va rasmli matn boʻyicha topshiriq bajara oladilar.",
          "Oʻquvchilar ustoz bilan qisqa suhbatda oʻzi haqida gapira oladilar.",
        ],
        lugat: [
          "test – nazorat ishi",
          "listen – tinglamoq",
          "read – oʻqimoq",
          "match – moslamoq",
          "colour – boʻyamoq",
          "can – qila olaman",
          "have got – bor (menda)",
          "there is – bor (bitta)",
        ],
        resurslar: [
          "Markaz testi (Starter–Unit 5): rasmli yozma varaqlar",
          "Test audio treki va pleyer",
          "Rangli qalamlar",
          "Speaking uchun rasm kartochkalari",
          "Yulduzcha stikerlar va baholash jadvali",
        ],
        blocks: [
          {
            title: "Warm-up va topshiriq turlarini koʻrsatish",
            minutes: 10,
            points: [
              "Flashcard va qoʻshiq bilan qisqa takror oʻtkaziladi.",
              "Ustoz har bir topshiriq turini doskada bitta namuna bilan koʻrsatadi.",
            ],
          },
          {
            title: "Yozma qism: lugʻat",
            minutes: 15,
            points: [
              "Rasmli moslash va boʻyash topshiriqlari bajariladi.",
              "Ustoz sinf boʻylab yurib, faqat topshiriqni tushunmagan bolaga yordam beradi.",
            ],
          },
          {
            title: "Yozma qism: grammatika",
            minutes: 15,
            points: [
              "Toʻgʻri soʻzni tanlash topshiriqlari bajariladi (be, have got, can, there is).",
              "Vaqt doskada belgilab boriladi.",
            ],
          },
          {
            title: "Listening",
            minutes: 15,
            points: [
              "Qisqa audio ikki marta, pauzalar bilan qoʻyiladi.",
              "Bolalar yes va no hamda moslash topshiriqlarini bajaradi.",
            ],
          },
          {
            title: "Reading",
            minutes: 15,
            points: [
              "Rasmli qisqa matn oʻqiladi.",
              "Bolalar matnga mos rasmni belgilaydi va savollarga javob beradi.",
            ],
          },
          {
            title: "Speaking: ustoz bilan yakkama-yakka",
            minutes: 10,
            points: [
              "Ustoz har bir bola bilan qisqa suhbat oʻtkazadi (oʻzi, oilasi, buyumlari, qobiliyatlari).",
              "Qolgan bolalar shu vaqtda rasm boʻyash topshirigʻini bajaradi.",
            ],
          },
          {
            title: "Yakun: natijalar va maslahat",
            minutes: 10,
            points: [
              "Natijalar oʻyin shaklida tahlil qilinadi, hech kim past baho bilan qoralanmaydi.",
              "Har bir bolaga yulduzcha va bitta aniq maslahat beriladi.",
            ],
          },
        ],
        uyga: [
          "Test tahlilidan keyin ustoz belgilagan oʻnta soʻzni rasm bilan takrorlash.",
          "Xato qilingan ikki topshiriqni uyda qayta bajarish.",
        ],
        ustozga: "Kichik yoshda test soʻzini ishlatmang — buni oʻyin yoki musobaqa deb ataing, shunda bolalar hayajonlanmaydi. Speaking qismida savollarni sekin va rasm bilan bering, bola javob bera olmasa, yordamchi savol bilan yoʻnaltiring.",
      },
    ],
  },
];
