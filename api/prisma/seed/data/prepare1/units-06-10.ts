// Cambridge Prepare 2e, Level 1 (A1) — Unit 6–10 uchun batafsil darsma-dars rejalar.
// Har dars 90 daqiqa; bloklar yigʻindisi aniq 90 boʻlishi shart (types.ts dagi checkMinutes tekshiradi).
// Kitobdan faqat sahifa, mashq va audio raqamlariga havola qilinadi; matn va javoblar koʻchirilmagan.

import type { PlanUnit } from "./types.js";

export const UNITS_06_10: PlanUnit[] = [
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
      {
        focus: "Ovqat va ichimliklar, Listening va some / any / lots of",
        sb: "40–41",
        maqsad: [
          "Oʻquvchilar 12 ta oziq-ovqat va ichimlik soʻzini tanib, ularni sanaladigan va sanalmaydigan otlarga ajrata oladilar.",
          "Oʻquvchilar some, any va lots of ni tasdiq, inkor va soʻroq gaplarda toʻgʻri qoʻllay oladilar.",
          "Oʻquvchilar sinf ziyofati uchun xarid roʻyxatini tuzib, uni sinfga aytib bera oladilar.",
        ],
        lugat: [
          "biscuits – pechenye",
          "bread – non",
          "cheese – pishloq",
          "chicken – tovuq goʻshti",
          "eggs – tuxum",
          "juice – sharbat",
          "milk – sut",
          "rice – guruch",
          "soup – shoʻrva",
          "tomatoes – pomidor",
        ],
        resurslar: [
          "SB 40–41 va WB 28–29",
          "Audio 52, 53, 54",
          "Ovqat va ichimlik flashcardlari (yoki rasmlari)",
          "Doska, magnit yoki skotch, rangli marker",
          "Proyektor (ziyofat rasmini koʻrsatish uchun)",
        ],
        blocks: [
          {
            title: "Warm-up va Unit 5 takrori",
            minutes: 10,
            points: [
              "Sinf ikki jamoaga boʻlinadi: 2 daqiqada doskaga bilgan ovqat soʻzlarini yozish musobaqasi.",
              "About you savollari ogʻzaki soʻraladi: qaysi ovqatni yoqtirasiz, ziyofatda nima yeysiz?",
              "Ustoz Unit 5 dagi can / cannot bilan 3 ta tezkor savol berib, oʻtgan darsni eslatadi.",
            ],
          },
          {
            title: "Vocabulary: Food and drinks (1–3-mashqlar)",
            minutes: 20,
            points: [
              "Flashcardlar bilan 12 ta soʻz tanishtiriladi, audio 52 eshittirilib talaffuz takrorlanadi.",
              "1–2-mashqlar bajariladi: soʻzlar rasmlarga moslanadi va ustunlarga ajratiladi.",
              "3-mashq: har bir oʻquvchi yoqtirgan va yoqtirmagan uchtadan mahsulotni yozadi, juftlikda almashadilar.",
              "Ustoz doskada ikki ustun tuzadi: food / drink — oʻquvchilar kartochkalarni oʻz ustuniga yopishtiradi.",
            ],
          },
          {
            title: "Listening: sinf ziyofatiga kim nima olib keladi (4-mashq)",
            minutes: 15,
            points: [
              "Tinglashdan oldin jadval koʻrib chiqiladi va oʻquvchilar taxmin qilishadi.",
              "Audio 53 ikki marta eshittiriladi: birinchi marta umumiy tushunish, ikkinchi marta javoblarni yozish uchun.",
              "Javoblar juftlikda solishtirilib, keyin sinf bilan tekshiriladi.",
            ],
          },
          {
            title: "Grammar: Countable / uncountable va some, any, lots of (1–4-mashqlar)",
            minutes: 20,
            points: [
              "Ustoz doskada ikki ustun chizadi: a tomato / two tomatoes va milk (sanalmaydi) misollari bilan qoida chiqariladi.",
              "1–2-mashqlar yakka bajariladi, javoblar sinf bilan tekshiriladi.",
              "some (tasdiq), any (inkor va savol), lots of (koʻp miqdor) farqi Grammar reference SB 143 yordamida koʻrsatiladi.",
              "3–4-mashqlar bajariladi; xato koʻp chiqqan gaplar doskada birga tuzatiladi.",
            ],
          },
          {
            title: "Pronunciation va Speaking (5–8-mashqlar)",
            minutes: 15,
            points: [
              "5-mashq: audio 54 bilan some soʻzining zaif talaffuzi mashq qilinadi.",
              "6-mashq: ziyofat rasmi boʻyicha juftlikda There is / There are va some, any bilan gaplar tuziladi.",
              "7–8-mashqlar: uch kishilik guruhlarda sinf ziyofati uchun xarid roʻyxati tuziladi va sinfga aytib beriladi.",
            ],
          },
          {
            title: "Yakun, baholash va uy vazifasi",
            minutes: 10,
            points: [
              "Tezkor soʻrov: ustoz mahsulot nomini aytadi, oʻquvchilar some yoki a / an bilan javob beradi.",
              "Har bir guruhga roʻyxati uchun qisqa fikr-mulohaza beriladi.",
              "Uy vazifasi tushuntiriladi va birinchi mashq namuna sifatida birga boshlanadi.",
            ],
          },
        ],
        uyga: [
          "WB 28–29: Food and drinks lugʻati hamda Listening mashqlari.",
          "WB 29 dagi Grammar bloki: some, any, lots of mashqlari.",
          "Uydagi muzlatgichdan 6 ta mahsulotni inglizcha yozib kelish (sanaladigan / sanalmaydigan deb belgilab).",
        ],
        ustozga: "Oʻquvchilar koʻpincha a bread yoki two milks kabi xato qiladi — sanalmaydigan otlar oldida a / an ishlatilmasligini har misolda takrorlab eslating. some soʻzi urgʻusiz talaffuz qilinishiga alohida eʼtibor bering.",
      },
      {
        focus: "Vaqtni aytish, taklifnoma va on / at / from / until",
        sb: "42–43",
        maqsad: [
          "Oʻquvchilar vaqtni inglizcha soʻrab va ayta oladilar.",
          "Oʻquvchilar on, at, from, until predloglarini kun, vaqt va davr bilan toʻgʻri qoʻllay oladilar.",
          "Oʻquvchilar ziyofatga qisqa taklifnoma yozib, unda kun, vaqt va joyni koʻrsata oladilar.",
        ],
        lugat: [
          "invitation – taklifnoma",
          "party – ziyofat",
          "What time is it? – Soat necha?",
          "half – yarim",
          "on Saturday – shanba kuni",
          "at four – soat toʻrtda",
          "from … until … – … dan … gacha",
          "come – kelmoq",
          "bring – olib kelmoq",
        ],
        resurslar: [
          "SB 42–43 va WB 30–31",
          "Audio 55, 56, 57, 58",
          "Harakatlanadigan strelkali qogʻoz soat maketi",
          "Kun / vaqt / joy yozilgan saralash kartochkalari",
          "Doska va rangli marker",
        ],
        blocks: [
          {
            title: "Warm-up: What time is it?",
            minutes: 10,
            points: [
              "Ustoz soat maketida vaqt koʻrsatadi, oʻquvchilar navbat bilan aytadi.",
              "Oʻtgan darsdan 5 ta ovqat soʻzi some / any bilan tezkor takrorlanadi.",
            ],
          },
          {
            title: "Reading va Listening: taklifnomalar (1–2-mashqlar)",
            minutes: 15,
            points: [
              "1-mashq: taklifnomalar audio 55 bilan oʻqiladi, oʻquvchilar kun, vaqt va joyni topadi.",
              "2-mashq: audio 56 eshittiriladi, oʻquvchilar kerakli maʼlumotni belgilaydi.",
              "Javoblar juftlikda solishtiriladi, keyin sinf bilan tekshiriladi.",
            ],
          },
          {
            title: "Vocabulary: Telling the time (1) (3–4-mashqlar)",
            minutes: 15,
            points: [
              "Audio 57 bilan vaqt shakllari tanishtiriladi va xor bilan takrorlanadi.",
              "3–4-mashqlar bajariladi (audio 58 bilan tekshiriladi).",
              "Juftlikda soat maketi bilan savol-javob mashqi oʻtkaziladi.",
            ],
          },
          {
            title: "Grammar: Prepositions on, at, from, until (1–3-mashqlar)",
            minutes: 18,
            points: [
              "Doskada uch ustun: on + kun, at + vaqt, from … until … + davr — misollar bilan qoida chiqariladi.",
              "1–2-mashqlar yakka bajariladi va juftlikda tekshiriladi.",
              "3-mashq: oʻquvchilar oʻz jadvallari asosida gaplar tuzadi.",
            ],
          },
          {
            title: "Speaking: Extra activities (SB 124) dialoglari",
            minutes: 12,
            points: [
              "Juftliklar SB 124 dagi dialogni oʻqiydi, soʻng kun, vaqt va joyni oʻzgartirib qayta ijro etadi.",
              "Ikki juftlik sinf oldida oʻz variantini koʻrsatadi.",
            ],
          },
          {
            title: "Writing: oʻz taklifnomasi (1-mashq) va Talking points",
            minutes: 12,
            points: [
              "Doskada taklifnoma tuzilishi eslatiladi: kim, nima, qachon, qayerda, nima olib kelish kerak.",
              "Har bir oʻquvchi oʻz ziyofatiga taklifnoma yozadi.",
              "Taklifnomalar almashtiriladi, sherik yes / no bilan javob yozadi; Talking points savollari muhokama qilinadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 8,
            points: [
              "Tezkor oʻyin: ustoz kun yoki vaqt aytadi, oʻquvchilar toʻgʻri predlogni baqiradi.",
              "Uy vazifasi beriladi va baholash mezoni eslatiladi.",
            ],
          },
        ],
        uyga: [
          "WB 30–31: Telling the time mashqlari va predloglar (on, at, from, until) bloki.",
          "WB 31 dagi Writing: taklifnoma topshirigʻini toʻliq bajarish.",
        ],
        ustozga: "at va on ni chalkashtirish eng koʻp uchraydigan xato (at Monday). Har tuzatishda doskadagi uch ustunga qaytib koʻrsating. Vaqtni aytishda oʻquvchilar raqamlarni oʻzbekcha tartibda aytishga urinadi — namunani sekin va bir necha marta takrorlang.",
      },
      {
        focus: "Culture: Holidays in the USA",
        sb: "44–45 (Culture)",
        maqsad: [
          "Oʻquvchilar AQShdagi asosiy bayramlar va ular nishonlanadigan sanalar haqida oʻqib tushuna oladilar.",
          "Oʻquvchilar bayram taomlari va anʼanalarini nomlab, ular haqida sodda gaplar tuza oladilar.",
          "Oʻquvchilar Oʻzbekistondagi bayram haqida inglizcha web sahifa rejasini tuza oladilar.",
        ],
        lugat: [
          "holiday – bayram, dam olish kuni",
          "celebrate – nishonlamoq",
          "parade – parad",
          "fireworks – mushakbozlik",
          "barbecue – barbekyu, olovda pishirilgan taom",
          "flag – bayroq",
          "turkey – kurka",
          "special – alohida, maxsus",
        ],
        resurslar: [
          "SB 44–45 (Culture)",
          "Audio 59, 60, 61",
          "Culture video 05 (Fourth of July in the USA)",
          "Proyektor va kolonka",
          "Plakat qogʻozi va rangli markerlar (project uchun)",
        ],
        blocks: [
          {
            title: "Warm-up: bayram soʻzlari (1–2-mashqlar)",
            minutes: 10,
            points: [
              "1-mashq: audio 59 bilan rasmlardagi soʻzlar tanishtiriladi va takrorlanadi.",
              "2-mashq: juftlikda savollar beriladi — qanday bayramlarni bilasiz, qachon nishonlanadi?",
            ],
          },
          {
            title: "Reading: AQSh bayramlari (3–4-mashqlar)",
            minutes: 18,
            points: [
              "3-mashq: matn audio 60 bilan bir marta eshitilib oʻqiladi, umumiy mazmun aniqlanadi.",
              "4-mashq: kalendar va jadval toʻldiriladi, oʻquvchilar javobni matndagi qaysi qatordan topganini koʻrsatadi.",
              "Notanish soʻzlar doskaga chiqariladi va kontekstdan maʼnosi topiladi.",
            ],
          },
          {
            title: "Bayram taomlari va gaplar (5–6-mashqlar)",
            minutes: 12,
            points: [
              "5-mashq: bayram taomlari soʻzlari bilan ishlanadi, talaffuz mashq qilinadi.",
              "6-mashq: har bir oʻquvchi 3 ta gap yozadi va sherigiga oʻqib beradi.",
            ],
          },
          {
            title: "Listening (7–8-mashqlar)",
            minutes: 15,
            points: [
              "Tinglashdan oldin savollar oʻqib chiqiladi va kutilayotgan javob turi aniqlanadi.",
              "Audio 61 ikki marta eshittiriladi, 7–8-mashqlar bajariladi.",
              "Javoblar sinf bilan tekshiriladi va qiyin qism qayta eshittiriladi.",
            ],
          },
          {
            title: "Culture video 05 va Talking points",
            minutes: 12,
            points: [
              "Video 05 koʻrsatiladi; oʻquvchilar koʻrgan 3 ta narsani yozib boradi.",
              "Talking points savollari kichik guruhlarda muhokama qilinadi.",
              "Har guruhdan bir oʻquvchi guruh fikrini sinfga aytadi.",
            ],
          },
          {
            title: "Project: Oʻzbekiston bayrami haqida web sahifa rejasi",
            minutes: 15,
            points: [
              "Guruhlar bayram tanlaydi (masalan, Navroʻz) va rejani toʻrt qismga boʻladi: qachon, nima uchun, nima qilinadi, qanday taomlar.",
              "Har guruh sahifaning eskizini chizadi va inglizcha sarlavhalar yozadi.",
              "Ustoz guruhlar orasida yurib, soʻz va grammatikaga yordam beradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 8,
            points: [
              "Har guruh loyihasining bir jumlasini sinfga oʻqib beradi.",
              "Keyingi darsdagi taqdimot tartibi va baholash mezoni eʼlon qilinadi.",
            ],
          },
        ],
        uyga: [
          "Project: bayram haqida web sahifani tugatish (qachon, nima uchun, nima qilinadi, qanday taomlar) — keyingi darsda taqdimot.",
          "Culture boʻlimidagi 8 ta yangi soʻzni lugʻat daftariga rasm yoki tarjima bilan yozish.",
        ],
        ustozga: "Loyihada oʻquvchilar internetdan tayyor matn koʻchirishga urinadi — oʻz soʻzlari bilan, sodda gaplarda yozishni talab qiling. Guruhlarni oldindan taqsimlab, har kimga aniq qism bering, aks holda bitta oʻquvchi hamma ishni bajaradi.",
      },
    ],
    kids: [
      {
        focus: "Ovqat va ichimliklar bilan tanishuv",
        sb: "40",
        maqsad: [
          "Oʻquvchilar 12 ta oziq-ovqat va ichimlik soʻzini rasm boʻyicha tanib, talaffuz qila oladilar.",
          "Oʻquvchilar ovqat va ichimliklarni ikki guruhga ajrata oladilar.",
          "Oʻquvchilar I like … / I do not like … bilan oʻz didini ayta oladilar.",
        ],
        lugat: [
          "bread – non",
          "cheese – pishloq",
          "milk – sut",
          "juice – sharbat",
          "eggs – tuxum",
          "rice – guruch",
          "soup – shoʻrva",
          "tomatoes – pomidor",
        ],
        resurslar: [
          "SB 40 va WB 28",
          "Audio 52, 53",
          "Ovqat flashcardlari va oʻyinchoq mahsulotlar (doʻkon oʻyini uchun)",
          "Doska, magnit, tabassum va xafa yuz rasmchalari",
        ],
        blocks: [
          {
            title: "Warm-up: Unit 5 takrori",
            minutes: 10,
            points: [
              "Can you …? oʻyini: ustoz savol beradi, oʻquvchilar Yes, I can / No, I cannot deb harakat bilan javob beradi.",
              "Oʻtgan darsdagi 5 ta soʻz flashcard bilan tezkor takrorlanadi.",
            ],
          },
          {
            title: "Vocabulary: Food and drinks (1-mashq)",
            minutes: 15,
            points: [
              "Flashcardlar bilan soʻzlar tanishtiriladi, audio 52 eshittirilib xor bilan takrorlanadi.",
              "Ustoz kartochkani koʻrsatadi, sinf soʻzni baqiradi; tezlik asta oshiriladi.",
              "1-mashq kitobda bajariladi.",
            ],
          },
          {
            title: "Doʻkon oʻyini",
            minutes: 12,
            points: [
              "Sinf burchagida kichik doʻkon tashkil qilinadi.",
              "Oʻquvchilar navbat bilan sotuvchi va xaridor boʻladi: Bread, please. – Here you are.",
              "Ustoz har juftlikning talaffuzini eshitib, yordam beradi.",
            ],
          },
          {
            title: "2-mashq: ustunlarga ajratish",
            minutes: 13,
            points: [
              "Doskada food va drink ustunlari chiziladi.",
              "Oʻquvchilar navbat bilan chiqib, kartochkani oʻz ustuniga yopishtiradi va soʻzni aytadi.",
              "Kitobdagi 2-mashq shundan keyin yakka bajariladi.",
            ],
          },
          {
            title: "3-mashq: I like … / I do not like …",
            minutes: 15,
            points: [
              "Ustoz tabassum va xafa yuz rasmchalarini koʻtarib namuna beradi.",
              "Oʻquvchilar zanjir boʻylab oʻz gapini aytadi: I like cheese. I do not like soup.",
              "3-mashq kitobda toʻldiriladi.",
            ],
          },
          {
            title: "Listening (4-mashq, audio 53)",
            minutes: 15,
            points: [
              "Tinglashdan oldin rasmlar koʻrib chiqiladi.",
              "Audio 53 ikki marta, pauzalar bilan eshittiriladi.",
              "Javoblar birga tekshiriladi va qiyin qism qayta eshittiriladi.",
            ],
          },
          {
            title: "Yakun: chant va uy vazifasi",
            minutes: 10,
            points: [
              "Ovqat soʻzlari bilan qisqa chant qarsak ostida aytiladi.",
              "Har bir oʻquvchi darsda eng yoqqan soʻzini aytib chiqadi.",
              "WB 28 vazifasi koʻrsatiladi va birinchi qatori birga bajariladi.",
            ],
          },
        ],
        uyga: [
          "WB 28: ovqat soʻzlari boʻyicha 1–2 ta mashq.",
          "Yoqtirgan 3 ta taomni chizib, ostiga inglizcha nomini yozib kelish.",
        ],
        ustozga: "Kichik yoshdagilar juice va eggs talaffuzida qiynaladi — soʻzni boʻgʻinlab, qarsak bilan takrorlating. Doʻkon oʻyinida navbatni aniq belgilang, aks holda faol bolalar hammasini oʻzi oʻynaydi.",
      },
      {
        focus: "some, any, lots of va xarid roʻyxati",
        sb: "41",
        maqsad: [
          "Oʻquvchilar sanaladigan va sanalmaydigan otlarni ikki guruhga ajrata oladilar.",
          "Oʻquvchilar some, any va lots of ni sodda gaplarda ishlatishni mashq qila oladilar.",
          "Oʻquvchilar ziyofat uchun rasmli xarid roʻyxatini tuzib, sinfga koʻrsata oladilar.",
        ],
        lugat: [
          "some – biroz, bir nechta",
          "any – hech qanday, biror",
          "lots of – juda koʻp",
          "butter – sariyogʻ",
          "biscuits – pechenye",
          "chicken – tovuq goʻshti",
          "pasta – makaron",
          "shopping list – xarid roʻyxati",
        ],
        resurslar: [
          "SB 41 va WB 29",
          "Audio 54",
          "Ikki savat yoki quti (sanaladigan / sanalmaydigan uchun)",
          "Ovqat flashcardlari va A4 qogʻoz, rangli qalamlar",
        ],
        blocks: [
          {
            title: "Warm-up: What is missing?",
            minutes: 10,
            points: [
              "Doskaga 8 ta ovqat flashcardi qoʻyiladi, oʻquvchilar koʻzini yumadi, ustoz bittasini olib qoʻyadi.",
              "Oʻquvchilar yoʻqolgan soʻzni topib aytadi; oʻyin 4–5 marta takrorlanadi.",
            ],
          },
          {
            title: "Grammar: Countable / uncountable (1–2-mashqlar)",
            minutes: 15,
            points: [
              "Ikki savat oʻyini: sanaladigan mahsulotlar bir savatga, sanalmaydiganlari boshqasiga solinadi.",
              "Ustoz har kartochkada an egg – eggs yoki milk namunasini aytadi.",
              "1–2-mashqlar kitobda bajariladi va birga tekshiriladi.",
            ],
          },
          {
            title: "Grammar: some, any, lots of (3–4-mashqlar)",
            minutes: 15,
            points: [
              "Doskada uch rangli qoida yoziladi: some (tasdiq), any (inkor va savol), lots of (koʻp).",
              "3–4-mashqlar ustoz bilan birga, ogʻzaki namunadan keyin yoziladi.",
              "Har javob uchun oʻquvchi doskaga chiqib rangli marker bilan toʻgʻri soʻzni belgilaydi.",
            ],
          },
          {
            title: "Pronunciation: some (5-mashq, audio 54)",
            minutes: 10,
            points: [
              "Audio 54 eshittiriladi, some soʻzining qisqa talaffuzi qarsak bilan mashq qilinadi.",
              "Zanjir mashqi: har bir oʻquvchi We have got some … deb davom ettiradi.",
            ],
          },
          {
            title: "7–8-mashqlar: rasmli xarid roʻyxati",
            minutes: 15,
            points: [
              "Juftliklar ziyofat uchun 6 ta mahsulotni tanlaydi va A4 qogʻozga chizadi.",
              "Har rasm ostiga some yoki lots of bilan yoziladi.",
              "Ustoz yurib, imlo va grammatikaga yordam beradi.",
            ],
          },
          {
            title: "Taqdimot: roʻyxatni sinfga aytib berish",
            minutes: 15,
            points: [
              "Har juftlik roʻyxatini koʻtarib, 3 ta gap aytadi.",
              "Sinf eng mazali roʻyxatga ovoz beradi.",
              "Ustoz har juftlikka bitta maqtov va bitta maslahat beradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Tezkor oʻyin: ustoz mahsulot aytadi, sinf some yoki a / an deb javob beradi.",
              "WB 29 vazifasi koʻrsatiladi va namuna qatori birga bajariladi.",
            ],
          },
        ],
        uyga: [
          "WB 29: some / any boʻyicha 2 ta mashq.",
          "Xarid roʻyxatini uyda rangli bezab, 2 ta yangi mahsulot qoʻshib kelish.",
        ],
        ustozga: "Bu yoshda qoidani yodlatish emas, koʻp marta ogʻzaki takrorlatish samarali — har mashqdan oldin 3 ta namuna gapni xor bilan aytdiring. any ni inkor gapda ishlatishni bolalar tez unutadi, shuning uchun doskadagi rangli qoidani dars oxirigacha oʻchirmang.",
      },
      {
        focus: "Vaqtni aytish va taklifnoma",
        sb: "42–43",
        maqsad: [
          "Oʻquvchilar soatni koʻrib, vaqtni inglizcha ayta oladilar.",
          "Oʻquvchilar on, at predloglarini kun va vaqt bilan toʻgʻri qoʻllay oladilar.",
          "Oʻquvchilar shablon asosida oddiy taklifnomani toʻldira oladilar.",
        ],
        lugat: [
          "time – vaqt",
          "What time is it? – Soat necha?",
          "party – ziyofat",
          "invitation – taklifnoma",
          "day – kun",
          "come – kelmoq",
          "on Sunday – yakshanba kuni",
          "at five – soat beshda",
        ],
        resurslar: [
          "SB 42–43 va WB 30",
          "Audio 55, 56, 57, 58",
          "Qogʻoz tarelka, strelka va tugmacha (soat yasash uchun)",
          "Kun / vaqt / joy kartochkalari",
          "Taklifnoma shabloni (chop etilgan)",
        ],
        blocks: [
          {
            title: "Warm-up: qogʻoz soat yasash",
            minutes: 10,
            points: [
              "Har bir oʻquvchi qogʻoz tarelkadan oʻz soatini yasaydi (raqamlar oldindan yozilgan boʻlishi mumkin).",
              "Ustoz vaqt aytadi, oʻquvchilar strelkani oʻsha vaqtga qoʻyadi.",
            ],
          },
          {
            title: "Reading: taklifnomalar (1-mashq, audio 55)",
            minutes: 12,
            points: [
              "Taklifnoma rasmi koʻrsatiladi, oʻquvchilar qaysi soʻzlarni taniyotganini aytadi.",
              "Audio 55 bilan matn birga oʻqiladi, kun va vaqt rangli qalam bilan belgilanadi.",
            ],
          },
          {
            title: "Listening (2-mashq, audio 56)",
            minutes: 10,
            points: [
              "Audio 56 ikki marta eshittiriladi.",
              "Oʻquvchilar javoblarni belgilaydi va juftlikda solishtiradi.",
            ],
          },
          {
            title: "Telling the time (1) (3–4-mashqlar)",
            minutes: 15,
            points: [
              "Audio 57 bilan vaqt shakllari tanishtiriladi va xor bilan takrorlanadi.",
              "3–4-mashqlar bajariladi, audio 58 bilan tekshiriladi.",
              "Juftlikda qogʻoz soat bilan savol-javob mashqi.",
            ],
          },
          {
            title: "Oʻyin: What is the time, Mr Wolf?",
            minutes: 13,
            points: [
              "Bir oʻquvchi Mr Wolf boʻlib sinf oldida turadi, qolganlar savol beradi.",
              "Mr Wolf vaqt aytadi, sinf shuncha qadam tashlaydi.",
              "Oʻyin 3–4 marta, har safar yangi Mr Wolf bilan takrorlanadi.",
            ],
          },
          {
            title: "Grammar: on, at, from, until (1–2-mashqlar)",
            minutes: 15,
            points: [
              "Kun / vaqt / joy kartochkalari uch qutiga saralanadi.",
              "Doskada on Monday va at three namunasi rangli yoziladi.",
              "1–2-mashqlar ustoz bilan birga bajariladi.",
            ],
          },
          {
            title: "Writing: taklifnoma (1-mashq) va yakun",
            minutes: 15,
            points: [
              "Shablon tarqatiladi, ustoz doskada birinchi qatorini birga toʻldiradi.",
              "Oʻquvchilar oʻz taklifnomasini toʻldirib bezaydi.",
              "Bir nechta taklifnoma sinfga koʻrsatiladi; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 30: vaqtni aytish boʻyicha mashqlar.",
          "Oʻz taklifnomasini uyda rangli bezab, oila aʼzosiga inglizcha oʻqib berish.",
        ],
        ustozga: "Soat yasash koʻp vaqt olishi mumkin — tarelkalarga raqamlarni oldindan yozib qoʻying. Bolalar at three ni chalkashtirib in three deyishi tez-tez uchraydi; har tuzatishda kartochka qutisiga ishora qiling.",
      },
      {
        focus: "Culture: Holidays in the USA",
        sb: "44–45 (Culture)",
        maqsad: [
          "Oʻquvchilar AQSh bayramlari bilan bogʻliq soʻzlarni rasm orqali tanib ayta oladilar.",
          "Oʻquvchilar kalendardan bayram sanalarini topa oladilar.",
          "Oʻquvchilar Navroʻz haqida rasmli plakat tayyorlab, sodda inglizcha gaplar yoza oladilar.",
        ],
        lugat: [
          "holiday – bayram",
          "flag – bayroq",
          "parade – parad",
          "fireworks – mushakbozlik",
          "barbecue – barbekyu",
          "cake – tort",
          "family – oila",
          "celebrate – nishonlamoq",
        ],
        resurslar: [
          "SB 44–45 (Culture)",
          "Audio 59, 60, 61",
          "Culture video 05",
          "Harf kartochkalari (soʻz yigʻish oʻyini uchun)",
          "Plakat qogʻozi, rangli qalam va yopishtiruvchi",
        ],
        blocks: [
          {
            title: "Warm-up: bayram rasmlari (1-mashq, audio 59)",
            minutes: 10,
            points: [
              "Bayroq, parad, mushakbozlik va barbekyu rasmlari koʻrsatiladi.",
              "Audio 59 bilan soʻzlar takrorlanadi; ustoz rasmga ishora qiladi, sinf soʻzni baqiradi.",
            ],
          },
          {
            title: "Reading: kalendar bilan ishlash (3-mashq, audio 60)",
            minutes: 15,
            points: [
              "Matn audio 60 bilan qismlab eshitiladi, har qismdan keyin pauza qilinadi.",
              "Oʻquvchilar kalendardan bayram sanalarini topib belgilaydi.",
              "Javoblar sinf bilan tekshiriladi.",
            ],
          },
          {
            title: "5-mashq: bayram taomlari soʻzlarini yigʻish",
            minutes: 12,
            points: [
              "Harf kartochkalari tarqatiladi, guruhlar soʻzlarni yigʻadi.",
              "Eng tez yiqqan guruh soʻzni sinfga aytadi va maʼnosini koʻrsatadi.",
              "5-mashq kitobda toʻldiriladi.",
            ],
          },
          {
            title: "Culture video 05",
            minutes: 10,
            points: [
              "Video koʻrsatiladi; oʻquvchilar koʻrgan 3 ta narsani barmoq bilan sanab boradi.",
              "Videodan keyin sinf birgalikda koʻrganlarini sanab chiqadi.",
            ],
          },
          {
            title: "Listening (7-mashq, audio 61)",
            minutes: 13,
            points: [
              "Savollar oldindan oʻqib chiqiladi.",
              "Audio 61 ikki marta, pauzalar bilan eshittiriladi.",
              "Javoblar birga tekshiriladi.",
            ],
          },
          {
            title: "Project: Navroʻz plakati",
            minutes: 20,
            points: [
              "Guruhlar plakatga Navroʻz rasmini chizadi: sana, taomlar, nima qilamiz.",
              "Ustoz doskaga foydali iboralarni yozib qoʻyadi (We eat …, We visit …).",
              "Har guruh plakatini koʻtarib bitta gap aytadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Dars soʻzlari flashcard bilan tezkor takrorlanadi.",
              "Har bir oʻquvchi eng yoqqan bayramni aytadi.",
              "Uy vazifasi tushuntiriladi va namuna gap doskada koʻrsatiladi.",
            ],
          },
        ],
        uyga: [
          "Plakatga 3 ta inglizcha gap yozib kelish.",
          "Bayram soʻzlaridan 5 tasini lugʻat daftariga rasm bilan yozish.",
        ],
        ustozga: "Plakat ishida bolalar chizishga berilib ketib, yozuvni unutadi — vaqtni taymer bilan boʻlib bering (12 daqiqa rasm, 8 daqiqa yozuv). Videodan keyin savollarni sodda tuting, toʻliq gap talab qilmang.",
      },
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
      {
        focus: "Kundalik ishlar va Present simple (+)",
        sb: "46–47",
        maqsad: [
          "Oʻquvchilar kundalik ishlarni nomlab, ularni kun tartibi boʻyicha ketma-ket ayta oladilar.",
          "Oʻquvchilar Present simple tasdiq shaklini, jumladan uchinchi shaxs birlikdagi -s / -es qoʻshimchasini toʻgʻri qoʻllay oladilar.",
          "Oʻquvchilar sherigining kuni haqida soʻrab, olgan maʼlumotini yozma bayon qila oladilar.",
        ],
        lugat: [
          "get up – uygʻonib turmoq",
          "get dressed – kiyinmoq",
          "have a shower – dush qabul qilmoq",
          "have breakfast – nonushta qilmoq",
          "catch the bus to school – maktabga avtobusda bormoq",
          "walk to school – maktabga piyoda bormoq",
          "have lunch – tushlik qilmoq",
          "have dinner – kechki ovqat qilmoq",
          "go to bed – uxlashga yotmoq",
        ],
        resurslar: [
          "SB 46–47 va WB 32–33",
          "Audio 62, 63, 64, 65, 66",
          "Kundalik ishlar rasm kartochkalari",
          "Doska va rangli boʻr yoki marker",
        ],
        blocks: [
          {
            title: "Warm-up va Unit 6 takrori",
            minutes: 10,
            points: [
              "About you savollari: ertalab nima yeysiz, maktabda tushlikda nima yeysiz?",
              "Unit 6 dan 5 ta ovqat soʻzi va vaqt shakllari tezkor takrorlanadi.",
            ],
          },
          {
            title: "Vocabulary: Daily activities (1–2-mashqlar)",
            minutes: 15,
            points: [
              "Rasm kartochkalari bilan iboralar tanishtiriladi, audio 62 eshittiriladi.",
              "1–2-mashqlar bajariladi; oʻquvchilar iboralarni kun tartibi boʻyicha raqamlaydi.",
              "Juftlikda kartochkalarni tartib bilan terish musobaqasi oʻtkaziladi.",
            ],
          },
          {
            title: "Listening: foto klub va Joséning kuni (3–5-mashqlar)",
            minutes: 18,
            points: [
              "Tinglashdan oldin savollar oʻqib chiqiladi va kutilayotgan javob turi aniqlanadi.",
              "Audio 63 ikki marta eshittiriladi; 3–5-mashqlar bajariladi.",
              "Javoblar juftlikda solishtirilib, keyin sinf bilan tekshiriladi.",
            ],
          },
          {
            title: "Grammar: Present simple (+) (1–2-mashqlar)",
            minutes: 20,
            points: [
              "Doskada I get up va She gets up namunasi rangli koʻrsatiladi, -s va -es qoidasi chiqariladi.",
              "Grammar reference SB 144 birga koʻrib chiqiladi.",
              "1–2-mashqlar yakka bajariladi va sinf bilan tekshiriladi.",
              "Tezkor drilling: ustoz olmoshni aytadi, oʻquvchilar feʼlni toʻgʻri shaklda takrorlaydi.",
            ],
          },
          {
            title: "Pronunciation: Present simple endings (3-mashq)",
            minutes: 10,
            points: [
              "Audio 65–66 eshittiriladi, -s tovushining uch xil talaffuzi ajratiladi.",
              "Oʻquvchilar soʻzlarni ustunlarga ajratadi va xor bilan takrorlaydi.",
            ],
          },
          {
            title: "Speaking va Writing (4–6-mashqlar)",
            minutes: 12,
            points: [
              "4-mashq: juftlikda sherigining kuni haqida savol-javob.",
              "5-mashq: olingan maʼlumot asosida 4–5 gap yoziladi.",
              "6-mashq: audio 64 bilan ikki farq topiladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 5,
            points: [
              "Zanjir mashqi: har bir oʻquvchi kun tartibidan bitta gap aytadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 32–33: Daily activities lugʻati va Listening mashqlari.",
          "WB 33: Present simple (+) grammatika bloki.",
        ],
        ustozga: "Eng koʻp uchraydigan xato — uchinchi shaxs birlikda -s ni tushirib qoldirish (She get up). Doskada -s ni boshqa rangda yozib, dars davomida koʻrsatib turing; goes va watches kabi -es olgan feʼllarni alohida roʻyxat qilib bering.",
      },
      {
        focus: "Vaqtni aytish (2), blog va Present simple (−)",
        sb: "48–49",
        maqsad: [
          "Oʻquvchilar vaqtni half past, quarter past va quarter to bilan ayta oladilar.",
          "Oʻquvchilar blog matnini oʻqib, undagi asosiy maʼlumotni topa oladilar.",
          "Oʻquvchilar do not / does not bilan inkor gaplar tuzib, oʻz kuni bilan boshqa kunni solishtira oladilar.",
        ],
        lugat: [
          "half past – yarim oʻtgan (soat yarmi)",
          "quarter past – chorak oʻtgan",
          "quarter to – chorak kam",
          "always – doim",
          "usually – odatda",
          "never – hech qachon",
          "start – boshlanmoq",
          "finish – tugamoq",
          "different – boshqacha, farqli",
        ],
        resurslar: [
          "SB 48–49 va WB 34–35",
          "Audio 67, 68, 69, 70",
          "Video 06 (Daily routine) va proyektor",
          "Soat maketi va doska",
        ],
        blocks: [
          {
            title: "Warm-up: vaqt zanjiri",
            minutes: 10,
            points: [
              "Ustoz soat maketida vaqt koʻrsatadi, oʻquvchilar zanjir boʻylab aytadi.",
              "Oʻtgan darsdan 5 ta kundalik ish Present simple (+) bilan takrorlanadi.",
            ],
          },
          {
            title: "Vocabulary: Telling the time (2) (1–2-mashqlar)",
            minutes: 15,
            points: [
              "Audio 67 bilan half past, quarter past va quarter to tanishtiriladi.",
              "Doskada soat aylanasi chizilib, chorak va yarim qismlar rangli boʻyaladi.",
              "1–2-mashqlar bajariladi va audio 68 bilan tekshiriladi.",
            ],
          },
          {
            title: "Reading: My Brazil blog (3–4-mashqlar)",
            minutes: 18,
            points: [
              "Sarlavha va rasmga qarab mazmun taxmin qilinadi.",
              "Matn audio 69 bilan bir marta eshitilib oʻqiladi, keyin savollar bilan qayta oʻqiladi.",
              "3–4-mashqlar bajariladi; oʻquvchilar javobni matndan koʻrsatadi.",
            ],
          },
          {
            title: "Grammar: Present simple (−) (1–4-mashqlar)",
            minutes: 22,
            points: [
              "Doskada do not va does not shakllari hamda ularning qisqargan koʻrinishi koʻrsatiladi.",
              "does not dan keyin feʼl asosiy shaklda qolishi alohida taʼkidlanadi.",
              "1–3-mashqlar yakka bajariladi, 4-mashq audio 70 bilan tekshiriladi.",
              "Tuzatish mashqi: doskadagi 5 ta xato gap sinf bilan birga toʻgʻrilanadi.",
            ],
          },
          {
            title: "Speaking: Lesedining kuni va video 06",
            minutes: 17,
            points: [
              "Video 06 koʻrsatiladi; oʻquvchilar koʻrgan 3 ta ishni yozadi.",
              "Speaking 1–2-mashqlar: juftlikda Lesedining kuni va oʻz kuni orasidagi farqlar aytiladi.",
              "Har juftlik 2 ta farqni inkor gap bilan sinfga aytadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 8,
            points: [
              "Tezkor soʻrov: ustoz vaqt aytadi, oʻquvchilar soat maketida koʻrsatadi.",
              "Uy vazifasi va yozma ish uchun baholash mezoni tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 34–35: Telling the time, Reading va Present simple (−) mashqlari.",
          "WB 35 Writing: oʻz kuni haqida 50–60 soʻzlik matn.",
        ],
        ustozga: "does not dan keyin feʼlga -s qoʻshish (She does not gets up) juda tez-tez uchraydi — bu xatoni doskada alohida yozib, ustidan chizib koʻrsating. quarter to konstruksiyasi oʻzbek tilidagi tartibga teskari, shuning uchun soat aylanasidagi vizual namuna zarur.",
      },
    ],
    kids: [
      {
        focus: "Kundalik ishlar (TPR va qoʻshiq)",
        sb: "46",
        maqsad: [
          "Oʻquvchilar kundalik ishlarni harakat bilan koʻrsatib, inglizcha nomlay oladilar.",
          "Oʻquvchilar kundalik ishlarni kun tartibi boʻyicha tartiblay oladilar.",
          "Oʻquvchilar qisqa audioni tinglab, eshitgan ishini rasmga moslay oladilar.",
        ],
        lugat: [
          "get up – uygʻonmoq",
          "get dressed – kiyinmoq",
          "have a shower – dush qabul qilmoq",
          "have breakfast – nonushta qilmoq",
          "walk to school – maktabga piyoda bormoq",
          "have lunch – tushlik qilmoq",
          "have dinner – kechki ovqat qilmoq",
          "go to bed – uxlashga yotmoq",
        ],
        resurslar: [
          "SB 46 va WB 32",
          "Audio 62, 63",
          "Kundalik ishlar rasm kartochkalari",
          "Ovqat flashcardlari va Bingo jadvallari",
        ],
        blocks: [
          {
            title: "Warm-up: ovqat soʻzlari bilan Bingo",
            minutes: 10,
            points: [
              "Har bir oʻquvchiga 6 katakli Bingo jadvali beriladi, oʻzi ovqat rasmlarini chizadi yoki yopishtiradi.",
              "Ustoz soʻzlarni aytadi, oʻquvchilar belgilaydi; birinchi toʻldirgan Bingo deb baqiradi.",
            ],
          },
          {
            title: "Vocabulary: Daily activities (1-mashq, audio 62)",
            minutes: 15,
            points: [
              "Har bir ibora ustoz tomonidan mimika bilan koʻrsatiladi, sinf takrorlaydi (TPR).",
              "Audio 62 eshittiriladi, oʻquvchilar rasmni barmoq bilan koʻrsatadi.",
              "1-mashq kitobda bajariladi.",
            ],
          },
          {
            title: "Qoʻshiq: This is the way we …",
            minutes: 12,
            points: [
              "Qoʻshiq ustoz bilan birga harakatlar qoʻshib aytiladi.",
              "Har bandda yangi ibora qoʻyiladi: get dressed, have breakfast, walk to school.",
              "Sinf ikki guruhga boʻlinib, navbat bilan kuylaydi.",
            ],
          },
          {
            title: "2-mashq: juftlikda rasm harfini topish",
            minutes: 13,
            points: [
              "Bir oʻquvchi iborani aytadi, sherigi rasm harfini topadi.",
              "Rollar almashtiriladi.",
              "2-mashq kitobda toʻldiriladi.",
            ],
          },
          {
            title: "Listening (4-mashq, audio 63)",
            minutes: 15,
            points: [
              "Rasmlar oldindan koʻrib chiqiladi.",
              "Audio 63 ikki marta, pauzalar bilan eshittiriladi.",
              "Savollarga sinf bilan birga javob beriladi.",
            ],
          },
          {
            title: "Oʻyin: kun tartibi zanjiri",
            minutes: 15,
            points: [
              "Kartochkalar aralashtirilib tarqatiladi.",
              "Oʻquvchilar sinf oldida kun tartibi boʻyicha saf tortadi va har biri oʻz iborasini aytadi.",
              "Oʻyin ikki jamoa orasida vaqtga qarab takrorlanadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Qoʻshiq oxirgi marta birga aytiladi.",
              "Har bir oʻquvchi ertalab qiladigan bitta ishini aytadi.",
              "WB 32 vazifasi koʻrsatiladi.",
            ],
          },
        ],
        uyga: [
          "WB 32: kundalik ishlar boʻyicha 1–2 ta mashq.",
          "Oʻz kun tartibidan 4 ta ishni chizib, ostiga inglizcha yozib kelish.",
        ],
        ustozga: "have breakfast va have lunch iboralarida bolalar have ni tushirib qoldiradi — har takrorlashda ikki soʻzni bitta harakat bilan bogʻlang. TPR paytida sinf tartibini saqlash uchun harakatlarni oʻtirgan holda ham bajarish mumkinligini koʻrsating.",
      },
      {
        focus: "Present simple (+): -s va -es",
        sb: "47",
        maqsad: [
          "Oʻquvchilar I get up va She gets up shakllari orasidagi farqni tushuna oladilar.",
          "Oʻquvchilar -s va -es tovushlarini quloq bilan ajrata oladilar.",
          "Oʻquvchilar sherigi haqida 2–3 ta sodda gap tuza oladilar.",
        ],
        lugat: [
          "he – u (erkak)",
          "she – u (ayol)",
          "gets up – uygʻonadi",
          "goes – boradi",
          "watches – tomosha qiladi",
          "has breakfast – nonushta qiladi",
          "every day – har kuni",
          "then – keyin",
        ],
        resurslar: [
          "SB 47 va WB 33",
          "Audio 65, 66",
          "Kundalik ishlar kartochkalari",
          "Doska va rangli boʻr yoki marker",
        ],
        blocks: [
          {
            title: "Warm-up: kartochkalarni tartibda terish",
            minutes: 10,
            points: [
              "Guruhlarga kartochkalar tarqatiladi, kun tartibi boʻyicha teriladi.",
              "Har guruh oʻz tartibini sinfga aytib beradi.",
            ],
          },
          {
            title: "Grammar: Present simple (+) — 1-mashq",
            minutes: 15,
            points: [
              "Ustoz avval oʻzi haqida gapiradi (I get up at seven), keyin oʻquvchi haqida (She gets up at seven).",
              "1-mashq kitobda bajariladi va birga tekshiriladi.",
            ],
          },
          {
            title: "2-mashq va rangli boʻr bilan qoida",
            minutes: 13,
            points: [
              "Doskada I / you / we / they va he / she / it ikki ustunga ajratiladi.",
              "-s qoʻshimchasi boshqa rangda yoziladi va sinf birga takrorlaydi.",
              "2-mashq bajariladi; har javobda oʻquvchi -s bor-yoʻqligini aytadi.",
            ],
          },
          {
            title: "Pronunciation (3-mashq, audio 65–66)",
            minutes: 12,
            points: [
              "Audio 65–66 eshittiriladi.",
              "-s va -es tovushlari qarsak bilan ajratiladi: bir qarsak -s, ikki qarsak -es.",
              "Soʻzlar ustunlarga ajratiladi va xor bilan takrorlanadi.",
            ],
          },
          {
            title: "4-mashq: juftlikda kunini aytib berish",
            minutes: 15,
            points: [
              "Juftliklar navbat bilan oʻz kunini 4 ta gapda aytadi.",
              "Tinglagan sherik kartochkalarni tartib bilan terib boradi.",
              "Ikki juftlik sinf oldida namuna koʻrsatadi.",
            ],
          },
          {
            title: "5-mashq: sherigi haqida yozish",
            minutes: 15,
            points: [
              "Doskada namuna gap yoziladi: He gets up at seven.",
              "Har bir oʻquvchi sherigi haqida 2–3 gap yozadi.",
              "Ustoz yurib, -s qoʻshimchasini tekshiradi va yordam beradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Tezkor oʻyin: ustoz olmosh aytadi, sinf feʼlni toʻgʻri shaklda baqiradi.",
              "Bir nechta oʻquvchi yozganini oʻqib beradi.",
              "WB 33 vazifasi koʻrsatiladi.",
            ],
          },
        ],
        uyga: [
          "WB 33: Present simple (+) boʻyicha 2 ta mashq.",
          "Oila aʼzosi haqida 2 ta gap yozib kelish (My mum gets up at …).",
        ],
        ustozga: "Bu yoshda qoidani gapirib tushuntirish emas, rang va harakat orqali koʻrsatish ishlaydi: -s ni doim bir xil rangda yozing. Yozma ishni albatta ustoz nazorati ostida bajarting, aks holda xato shakl yodda qolib ketadi.",
      },
      {
        focus: "Vaqtni aytish (2) va Present simple (−)",
        sb: "48–49",
        maqsad: [
          "Oʻquvchilar half past va quarter bilan vaqtni ayta oladilar.",
          "Oʻquvchilar blog matnini ustoz bilan oʻqib, asosiy maʼlumotni topa oladilar.",
          "Oʻquvchilar do not va does not bilan sodda inkor gap tuza oladilar.",
        ],
        lugat: [
          "half past – yarim oʻtgan",
          "quarter past – chorak oʻtgan",
          "quarter to – chorak kam",
          "do not – emas (I / you / we / they uchun)",
          "does not – emas (he / she / it uchun)",
          "morning – ertalab",
          "evening – kechqurun",
          "school – maktab",
        ],
        resurslar: [
          "SB 48–49 va WB 34",
          "Audio 67, 68, 69, 70",
          "Video 06 va proyektor",
          "Qogʻoz soat maketlari va doska",
        ],
        blocks: [
          {
            title: "Warm-up: What is the time, Mr Wolf?",
            minutes: 10,
            points: [
              "Oʻyin oʻtgan darsdagidek oʻynaladi, endi half past shakllari ham ishlatiladi.",
              "Oʻyin 3 marta takrorlanadi.",
            ],
          },
          {
            title: "Telling the time (2) (1–2-mashqlar)",
            minutes: 15,
            points: [
              "Audio 67 bilan yangi shakllar tanishtiriladi va xor bilan takrorlanadi.",
              "Doskada soat aylanasi chorakka boʻlinib boʻyaladi.",
              "1–2-mashqlar bajariladi va audio 68 bilan tekshiriladi.",
            ],
          },
          {
            title: "Soat chizish amaliyoti",
            minutes: 12,
            points: [
              "Ustoz vaqt aytadi, oʻquvchilar daftarda soat chizib strelkalarni qoʻyadi.",
              "Juftlikda tekshiriladi.",
              "Eng qiyin ikkita vaqt sinf bilan birga takrorlanadi.",
            ],
          },
          {
            title: "Reading: My Brazil blog (3-mashq, audio 69)",
            minutes: 15,
            points: [
              "Matn audio 69 bilan qismlab oʻqiladi, har qismdan keyin bitta savol beriladi.",
              "Oʻquvchilar vaqt va kundalik ishlarni rangli qalam bilan belgilaydi.",
              "3-mashq birga tekshiriladi.",
            ],
          },
          {
            title: "Grammar: Present simple (−) (1–2 va 4-mashqlar)",
            minutes: 18,
            points: [
              "Doskada I do not … va She does not … namunasi rangli koʻrsatiladi.",
              "1–2-mashqlar ustoz bilan birga bajariladi.",
              "4-mashq audio 70 bilan tekshiriladi.",
              "Ogʻzaki drilling: ustoz tasdiq gap aytadi, sinf uni inkorga aylantiradi.",
            ],
          },
          {
            title: "Speaking (2-mashq) va video 06",
            minutes: 12,
            points: [
              "Video 06 koʻrsatiladi.",
              "Juftlikda Lesedi va oʻz kuni orasidagi 2 ta farq aytiladi.",
              "Bir nechta juftlik sinfga farqlarini aytadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 8,
            points: [
              "Tezkor takror: ustoz soat koʻrsatadi, sinf vaqtni aytadi.",
              "WB 34 vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 34: vaqtni aytish mashqlari.",
          "Oʻz kun tartibini 4 ta rasm va vaqt bilan chizib kelish.",
        ],
        ustozga: "Kichik yoshdagilar quarter to ni teskari tushunadi — soat aylanasidagi rangli boʻlaklar bilan har safar koʻrsating. Inkor gapda does not dan keyin -s qoʻshilmasligini ogʻzaki drilling orqali mustahkamlang.",
      },
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
      {
        focus: "Maktab fanlari va Present simple savollari",
        sb: "50–51",
        maqsad: [
          "Oʻquvchilar 10 ta maktab fani nomini tanib, oʻz dars jadvali haqida gapira oladilar.",
          "Oʻquvchilar Do you …? va Does he …? savollarini tuzib, qisqa javob bera oladilar.",
          "Oʻquvchilar dars jadvalidagi oʻzgarishlar haqidagi audioni tinglab, kerakli maʼlumotni topa oladilar.",
        ],
        lugat: [
          "art – tasviriy sanʼat",
          "English – ingliz tili",
          "French – fransuz tili",
          "geography – geografiya",
          "history – tarix",
          "IT – informatika",
          "maths – matematika",
          "music – musiqa",
          "PE – jismoniy tarbiya",
          "science – tabiiy fanlar",
        ],
        resurslar: [
          "SB 50–51 va WB 36–37",
          "Audio 71, 72, 73",
          "Fan nomlari flashcardlari",
          "Boʻsh dars jadvali shabloni",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up va Unit 7 takrori",
            minutes: 10,
            points: [
              "About you savollari: darslar qachon boshlanadi va tugaydi?",
              "Present simple (+ / −) bilan 5 ta tezkor gap aytiladi (oʻtgan dars takrori).",
            ],
          },
          {
            title: "Vocabulary: School subjects (1–2-mashqlar)",
            minutes: 15,
            points: [
              "Flashcardlar bilan fan nomlari tanishtiriladi, audio 71 eshittiriladi.",
              "Urgʻu va talaffuz xor bilan mashq qilinadi (geography, science).",
              "1–2-mashqlar bajariladi va sinf bilan tekshiriladi.",
            ],
          },
          {
            title: "Listening: dars jadvalidagi oʻzgarishlar (3–5-mashqlar)",
            minutes: 18,
            points: [
              "Tinglashdan oldin jadval koʻrib chiqiladi va qaysi maʼlumot kerakligi aniqlanadi.",
              "Audio 72 ikki marta eshittiriladi; 3–5-mashqlar bajariladi.",
              "Javoblar juftlikda solishtiriladi, qiyin qism qayta eshittiriladi.",
            ],
          },
          {
            title: "Grammar: Present simple questions (1–2-mashqlar)",
            minutes: 22,
            points: [
              "Doskada Do / Does yordamchi feʼllari va soʻz tartibi koʻrsatiladi (Grammar reference SB 145).",
              "Qisqa javoblar alohida yozib qoʻyiladi: Yes, I do. / No, she does not.",
              "1–2-mashqlar bajariladi, 2-mashq audio 73 bilan tekshiriladi.",
              "Drilling: ustoz tasdiq gap aytadi, oʻquvchilar uni savolga aylantiradi.",
            ],
          },
          {
            title: "3-mashq: savol tuzib, juftlikda soʻrash",
            minutes: 17,
            points: [
              "Har bir oʻquvchi 5 ta savol yozadi (fanlar va dars jadvali haqida).",
              "Juftlikda savol-javob oʻtkaziladi, javoblar qisqa shaklda beriladi.",
              "Ikki juftlik sinf oldida namuna koʻrsatadi va sinf xatolarni tuzatadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 8,
            points: [
              "Zanjir mashqi: har oʻquvchi sherigiga bitta savol beradi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 36–37: School subjects lugʻati va Listening mashqlari.",
          "WB 37: Present simple savollari boʻyicha grammatika bloki.",
        ],
        ustozga: "Oʻquvchilar Do she …? yoki Does she goes …? kabi xato qiladi — yordamchi feʼl va asosiy feʼl oʻrtasidagi vazifa taqsimotini doskada koʻrsating. Qisqa javoblarni toʻliq gap bilan almashtirmaslik uchun alohida drilling oʻtkazing.",
      },
      {
        focus: "School of the Air va Wh- savollar",
        sb: "52–53",
        maqsad: [
          "Oʻquvchilar uzoq hududdagi maktab haqidagi matnni oʻqib, asosiy maʼlumotni topa oladilar.",
          "Oʻquvchilar Who, What, Where, When, How often, Why savol soʻzlari bilan savol tuza oladilar.",
          "Oʻquvchilar doʻstidan intervyu olib, uning maktabi haqida qisqa matn yoza oladilar.",
        ],
        lugat: [
          "catch – ushlamoq, ilinmoq (avtobusga)",
          "meet – uchrashmoq",
          "far – uzoq",
          "lesson – dars",
          "timetable – dars jadvali",
          "How often …? – Qanchalik tez-tez …?",
          "Why …? – Nima uchun …?",
          "because – chunki",
        ],
        resurslar: [
          "SB 52–53 va WB 38–39",
          "Audio 74, 75",
          "Video 07 (School subjects) va proyektor",
          "Savol soʻzlari kartochkalari",
        ],
        blocks: [
          {
            title: "Warm-up: video 07 va Talking points",
            minutes: 10,
            points: [
              "Video 07 koʻrsatiladi, oʻquvchilar eshitgan fan nomlarini yozib boradi.",
              "Talking points savollari juftlikda qisqa muhokama qilinadi.",
            ],
          },
          {
            title: "Reading: School of the Air (1–3-mashqlar)",
            minutes: 18,
            points: [
              "Rasm va sarlavhaga qarab mazmun taxmin qilinadi.",
              "Matn audio 74 bilan eshitilib oʻqiladi, keyin savollar bilan qayta oʻqiladi.",
              "1–3-mashqlar bajariladi; javoblar matndagi qatorga havola bilan asoslanadi.",
            ],
          },
          {
            title: "Vocabulary: Words with two meanings (4–6-mashqlar)",
            minutes: 12,
            points: [
              "catch va meet kabi soʻzlarning ikki maʼnosi misollar bilan ajratiladi.",
              "4–6-mashqlar bajariladi va juftlikda tekshiriladi.",
            ],
          },
          {
            title: "Grammar: Wh- questions (1–4-mashqlar)",
            minutes: 20,
            points: [
              "Savol soʻzlari kartochkalari doskaga terilib, har biriga javob turi yoziladi (odam, joy, vaqt, sabab).",
              "Soʻz tartibi namunasi koʻrsatiladi: savol soʻzi + do / does + ega + feʼl.",
              "1–4-mashqlar bajariladi va sinf bilan tekshiriladi.",
            ],
          },
          {
            title: "Pronunciation: Wh- questions (5–6-mashqlar)",
            minutes: 10,
            points: [
              "Audio 75 eshittiriladi, savol ohangi (pasayuvchi intonatsiya) ajratiladi.",
              "Savollar ritm bilan xor va yakka tartibda takrorlanadi.",
            ],
          },
          {
            title: "Writing: intervyu va matn (1–2-mashqlar)",
            minutes: 15,
            points: [
              "1-mashq: oʻquvchilar doʻstidan maktabi haqida 5 ta savol soʻraydi va javoblarni yozib oladi.",
              "2-mashq: olingan javoblar asosida qisqa matn yoziladi.",
              "Ustoz yurib, soʻz tartibi va -s qoʻshimchasini tekshiradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 5,
            points: [
              "Bir nechta oʻquvchi matnini oʻqib beradi.",
              "Uy vazifasi va Writing uchun baholash mezoni eslatiladi.",
            ],
          },
        ],
        uyga: [
          "WB 38–39: Reading va Wh- questions mashqlari.",
          "WB 39 Writing: doʻsti haqidagi matnni tugatib, toza koʻchirish.",
        ],
        ustozga: "Wh- savollarda yordamchi feʼlni tushirib qoldirish (Where you go?) eng koʻp uchraydigan xato — doskadagi soʻz tartibi formulasini dars davomida koʻrinib turadigan joyda qoldiring. Intervyuda javoblarni toʻliq gap bilan yozishga undang, aks holda Writing bosqichida material yetmaydi.",
      },
      {
        focus: "Life Skills: Learning English",
        sb: "54–55 (Life Skills)",
        maqsad: [
          "Oʻquvchilar ingliz tilini oʻrganish usullari haqidagi forum maslahatlarini oʻqib tushuna oladilar.",
          "Oʻquvchilar read comics, watch TV kabi soʻz birikmalarini toʻgʻri qoʻllay oladilar.",
          "Oʻquvchilar doʻsti uchun 4 ta amaliy maslahatdan iborat reja tuza oladilar.",
        ],
        lugat: [
          "practise – mashq qilmoq",
          "learn – oʻrganmoq",
          "advice – maslahat",
          "comics – komikslar",
          "subtitles – subtitrlar",
          "vocabulary notebook – lugʻat daftari",
          "What about …? – … haqida nima deysiz?",
          "You can … – Siz … qilishingiz mumkin",
        ],
        resurslar: [
          "SB 54–55 (Life Skills)",
          "Audio 76, 77",
          "Doska va marker",
          "A4 qogʻoz (top tips rejasi uchun)",
        ],
        blocks: [
          {
            title: "Warm-up (1–2-mashqlar)",
            minutes: 10,
            points: [
              "1-mashq: sevimli fan haqida qisqa soʻrov oʻtkaziladi.",
              "2-mashq: oʻquvchilar ingliz tilini qanday oʻrganishini belgilab, juftlikda solishtiradi.",
            ],
          },
          {
            title: "Reading: forumdagi maslahatlar (3–4-mashqlar)",
            minutes: 18,
            points: [
              "Matn audio 76 bilan eshitilib oʻqiladi.",
              "3–4-mashqlar bajariladi: maslahatlar mualliflarga moslanadi.",
              "Har oʻquvchi oʻziga eng foydali maslahatni tanlab, sababini aytadi.",
            ],
          },
          {
            title: "Soʻz birikmalari (5–6-mashqlar)",
            minutes: 15,
            points: [
              "Doskada ikki ustun: feʼl va ot — oʻquvchilar toʻgʻri juftlikni topadi.",
              "5–6-mashqlar bajariladi va sinf bilan tekshiriladi.",
              "Tezkor oʻyin: ustoz feʼlni aytadi, sinf mos otni qoʻshadi.",
            ],
          },
          {
            title: "Listening (7–9-mashqlar)",
            minutes: 15,
            points: [
              "Savollar oldindan oʻqib chiqiladi.",
              "Audio 77 ikki marta eshittiriladi; 7–9-mashqlar bajariladi.",
              "Javoblar sinf bilan tekshiriladi.",
            ],
          },
          {
            title: "Useful language (10-mashq)",
            minutes: 12,
            points: [
              "What about …? va You can … iboralari namunalar bilan tanishtiriladi.",
              "10-mashq bajariladi.",
              "Juftlikda rolli mashq: biri muammo aytadi, ikkinchisi maslahat beradi.",
            ],
          },
          {
            title: "Project: doʻst uchun 4 ta top tips",
            minutes: 15,
            points: [
              "Har bir oʻquvchi reading, listening, writing va vocabulary boʻyicha bittadan maslahat yozadi.",
              "Maslahatlar juftlikda almashtiriladi va sherik bittasini tanlab, sababini aytadi.",
              "Ustoz eng amaliy maslahatlarni doskaga koʻchiradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 5,
            points: [
              "Sinf umumiy 4 ta maslahatni ovoz berish orqali tanlaydi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Project: ingliz tilini oʻrganish rejasi (reading, listening, writing, vocabulary) — 4 ta maslahat.",
          "Life Skills boʻlimidagi yangi soʻz birikmalarini lugʻat daftariga yozish.",
        ],
        ustozga: "Maslahatlar umumiy boʻlib qolmasligi uchun har bandda qachon va qancha vaqt degan savolni talab qiling. practise feʼlidan keyin -ing kelishini alohida eslatib oʻting.",
      },
      {
        focus: "Review 2 (Unit 5–8)",
        sb: "56–57 (Review 2)",
        maqsad: [
          "Oʻquvchilar Unit 5–8 lugʻati va grammatikasini takrorlab, mustahkamlay oladilar.",
          "Oʻquvchilar tinglash va oʻqish topshiriqlarida asosiy maʼlumotni topa oladilar.",
          "Oʻquvchilar oʻzi haqida qisqa email yoza oladilar.",
        ],
        lugat: [
          "review – takrorlash",
          "pen pal – xat orqali doʻst",
          "email – elektron xat",
          "correct – toʻgʻri, tuzatmoq",
          "mistake – xato",
          "daily routine – kun tartibi",
          "subject – fan",
          "free time – boʻsh vaqt",
        ],
        resurslar: [
          "SB 56–57 (Review 2) va Grammar reference SB 141–145",
          "Audio 78",
          "Unit 5–8 flashcardlari",
          "Doska va sekundomer (Pictionary uchun)",
        ],
        blocks: [
          {
            title: "Warm-up: jamoaviy Pictionary",
            minutes: 10,
            points: [
              "Sinf ikki jamoaga boʻlinadi, Unit 5–8 soʻzlari chiziladi va topiladi.",
              "Har topilgan soʻz uchun ball beriladi.",
            ],
          },
          {
            title: "Vocabulary (1–2-mashqlar)",
            minutes: 15,
            points: [
              "1–2-mashqlar yakka bajariladi.",
              "Javoblar juftlikda solishtirilib, keyin sinf bilan tekshiriladi.",
              "Xato koʻp chiqqan soʻzlar doskaga yozilib takrorlanadi.",
            ],
          },
          {
            title: "Grammar (1–3-mashqlar)",
            minutes: 18,
            points: [
              "1–3-mashqlar bajariladi.",
              "Har mashqdan keyin tegishli qoida Grammar reference (SB 141–145) dan eslatiladi.",
              "Umumiy xatolar doskada birga tuzatiladi.",
            ],
          },
          {
            title: "Listening (1-mashq, audio 78)",
            minutes: 12,
            points: [
              "Audio 78 ikki marta eshittiriladi.",
              "Oʻquvchilar notoʻgʻri gaplarni topib tuzatadi.",
              "Javoblar sinf bilan tekshiriladi.",
            ],
          },
          {
            title: "Reading: pen pal xabari (1-mashq)",
            minutes: 12,
            points: [
              "Matn mustaqil oʻqiladi va savollarga javob yoziladi.",
              "Juftlikda tekshiriladi, ustoz qiyin joylarni tushuntiradi.",
            ],
          },
          {
            title: "Speaking (1-mashq)",
            minutes: 10,
            points: [
              "Rasmlar boʻyicha kun tartibi juftlikda aytib beriladi.",
              "Tinglagan sherik 2 ta savol beradi.",
            ],
          },
          {
            title: "Writing (1-mashq) va yakun",
            minutes: 13,
            points: [
              "Email tuzilishi doskada eslatiladi: salomlashuv, oʻzi haqida, savollar, xayrlashuv.",
              "Oʻquvchilar Rodrigoga email yoza boshlaydi.",
              "Dars oxirida uy vazifasi va Vocabulary list topshirigʻi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Rodrigoga yozilgan emailni tugatish (60–80 soʻz).",
          "Vocabulary list: Unit 5–8 soʻzlarini takrorlash va Grammar reference (SB 141–145) mashqlari.",
        ],
        ustozga: "Review darsida barcha mashqni ulgurishga urinmang — xato koʻp chiqqan ikki mavzuga koʻproq vaqt ajrating. Emailda oʻquvchilar faqat oʻzi haqida yozib, savol berishni unutadi; shablonda savollar qismini alohida belgilab qoʻying.",
      },
    ],
    kids: [
      {
        focus: "Maktab fanlari",
        sb: "50",
        maqsad: [
          "Oʻquvchilar 10 ta fan nomini tanib, harakat bilan koʻrsata oladilar.",
          "Oʻquvchilar oʻz dars jadvali boʻyicha When is maths? savoliga javob bera oladilar.",
          "Oʻquvchilar sinfdagi sevimli fanlar soʻrovini oʻtkazib, natijani diagrammada koʻrsata oladilar.",
        ],
        lugat: [
          "art – tasviriy sanʼat",
          "English – ingliz tili",
          "geography – geografiya",
          "history – tarix",
          "maths – matematika",
          "music – musiqa",
          "PE – jismoniy tarbiya",
          "science – tabiiy fanlar",
        ],
        resurslar: [
          "SB 50 va WB 36",
          "Audio 71, 72",
          "Fan flashcardlari",
          "Soat maketi (warm-up uchun)",
          "Katta qogʻoz va rangli qalam (diagramma uchun)",
        ],
        blocks: [
          {
            title: "Warm-up: vaqtni aytish oʻyini",
            minutes: 10,
            points: [
              "Ustoz soat maketida vaqt koʻrsatadi, oʻquvchilar aytadi.",
              "Oʻtgan darsdagi 4 ta kundalik ish TPR bilan takrorlanadi.",
            ],
          },
          {
            title: "Vocabulary: School subjects (1-mashq, audio 71)",
            minutes: 15,
            points: [
              "Har fan uchun harakat oʻylab topiladi (maths — barmoq sanash, music — kuylash).",
              "Audio 71 eshittiriladi va soʻzlar xor bilan takrorlanadi.",
              "1-mashq kitobda bajariladi.",
            ],
          },
          {
            title: "2-mashq: When is maths?",
            minutes: 13,
            points: [
              "Oʻquvchilar oʻz dars jadvalini kitobdagi shablonga koʻchiradi.",
              "Juftlikda savol-javob: When is maths? — On Monday.",
              "Ikki juftlik sinf oldida namuna koʻrsatadi.",
            ],
          },
          {
            title: "Listening (3-mashq, audio 72)",
            minutes: 12,
            points: [
              "Audio 72 ikki marta, pauzalar bilan eshittiriladi.",
              "Oʻquvchilar eshitgan fanlarni belgilaydi.",
              "Javoblar birga tekshiriladi.",
            ],
          },
          {
            title: "5-mashq: sevimli fanlar soʻrovi",
            minutes: 15,
            points: [
              "Har oʻquvchi 5 ta sinfdoshidan What is your favourite subject? deb soʻraydi.",
              "Natijalar katta qogʻozdagi ustunli diagrammaga rangli qalamda kiritiladi.",
              "Sinf eng mashhur fanni aniqlaydi.",
            ],
          },
          {
            title: "Oʻyin: fan flashcardlari bilan Memory",
            minutes: 15,
            points: [
              "Kartochkalar juft-juft qilib teskari yotqiziladi.",
              "Oʻquvchilar navbat bilan ikkitasini ochib, soʻzni aytadi.",
              "Toʻgʻri juft topgan oʻquvchi kartochkani oladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Fan nomlari oxirgi marta harakat bilan takrorlanadi.",
              "Har bir oʻquvchi sevimli fanini aytadi.",
              "WB 36 vazifasi koʻrsatiladi.",
            ],
          },
        ],
        uyga: [
          "WB 36: fan nomlari boʻyicha 1–2 ta mashq.",
          "Oʻz dars jadvalini inglizcha chizib kelish (hafta kunlari va fanlar).",
        ],
        ustozga: "maths va PE qisqartmalari bolalarga notanish — ularni alohida rasm bilan bogʻlang. Soʻrov mashqida sinfda shovqin koʻtarilmasligi uchun oʻquvchilarni kichik guruhlarga boʻlib yuboring.",
      },
      {
        focus: "Do you …? Does she …?",
        sb: "51",
        maqsad: [
          "Oʻquvchilar Do va Does bilan sodda savol tuza oladilar.",
          "Oʻquvchilar Yes, I do / No, I do not qisqa javoblarini ishlata oladilar.",
          "Oʻquvchilar Find someone who oʻyinida sinfdoshlaridan maʼlumot yigʻa oladilar.",
        ],
        lugat: [
          "Do you …? – Sen … qilasanmi?",
          "Does she …? – U … qiladimi?",
          "Yes, I do. – Ha.",
          "No, I do not. – Yoʻq.",
          "like – yoqtirmoq",
          "study – oʻqimoq, oʻrganmoq",
          "Saturday – shanba",
          "timetable – dars jadvali",
        ],
        resurslar: [
          "SB 51 va WB 37",
          "Audio 73",
          "Do / Does yozilgan katta kartochkalar",
          "Find someone who jadvali (chop etilgan)",
          "Doska",
        ],
        blocks: [
          {
            title: "Warm-up: fanlar bilan Hangman",
            minutes: 10,
            points: [
              "Doskada fan nomlari harflab topiladi.",
              "Topilgan soʻz harakat bilan takrorlanadi.",
            ],
          },
          {
            title: "Grammar: Do / Does kartochkalari (1-mashq)",
            minutes: 15,
            points: [
              "Ikki oʻquvchi Do va Does kartochkalarini ushlab turadi.",
              "Ustoz ega aytadi, sinf qaysi kartochka kerakligini koʻrsatadi.",
              "1-mashq kitobda birga bajariladi.",
            ],
          },
          {
            title: "2-mashq: Lara jadvali (audio 73)",
            minutes: 15,
            points: [
              "Jadval birga koʻrib chiqiladi.",
              "Audio 73 eshittiriladi va 2-mashq bajariladi.",
              "Juftlikda jadval boʻyicha savol-javob oʻtkaziladi.",
            ],
          },
          {
            title: "Qisqa javoblar drillingi",
            minutes: 12,
            points: [
              "Ustoz savol beradi, sinf faqat qisqa javob bilan javob qaytaradi.",
              "Oʻquvchilar bosh barmogʻi bilan ha yoki yoʻq ishorasini ham koʻrsatadi.",
              "Tezlik asta oshiriladi.",
            ],
          },
          {
            title: "3-mashq: Find someone who …",
            minutes: 18,
            points: [
              "Jadval tarqatiladi, oʻquvchilar sinf boʻylab yurib savol beradi.",
              "Har bandga bitta ism yoziladi (takrorlanmasin).",
              "Jadvalni birinchi toʻldirgan oʻquvchi gʻolib.",
            ],
          },
          {
            title: "Natijalarni aytib berish",
            minutes: 10,
            points: [
              "Bir nechta oʻquvchi topgan maʼlumotini sinfga aytadi.",
              "Ustoz uchinchi shaxs shaklini doskada koʻrsatib tuzatadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Zanjir mashqi: har oʻquvchi qoʻshnisiga bitta savol beradi.",
              "WB 37 vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 37: Present simple savollari boʻyicha 2 ta mashq.",
          "Oila aʼzosiga 3 ta inglizcha savol berib, javobini yozib kelish.",
        ],
        ustozga: "Bolalar savolda Do ni tushirib qoldirib, faqat ohang bilan savol qilishga urinadi — kartochkali oʻyinni har darsda qisqa takrorlang. Qisqa javobda do soʻzini unutish ham tez-tez uchraydi.",
      },
      {
        focus: "School of the Air va Wh- savollar",
        sb: "52–53",
        maqsad: [
          "Oʻquvchilar matnni ustoz bilan oʻqib, yes / no savollariga javob bera oladilar.",
          "Oʻquvchilar savol soʻzlarini javob turiga moslay oladilar.",
          "Oʻquvchilar doʻstiga 3 ta Wh- savol berib, javobini yoza oladilar.",
        ],
        lugat: [
          "Who? – Kim?",
          "What? – Nima?",
          "Where? – Qayerda?",
          "When? – Qachon?",
          "Why? – Nima uchun?",
          "far – uzoq",
          "radio – radio",
          "lesson – dars",
        ],
        resurslar: [
          "SB 52–53 va WB 38",
          "Audio 74, 75",
          "Video 07 va proyektor",
          "Savol soʻzlari va javob rasmlari kartochkalari",
        ],
        blocks: [
          {
            title: "Warm-up: video 07",
            minutes: 10,
            points: [
              "Video 07 koʻrsatiladi.",
              "Oʻquvchilar koʻrgan fanlarni barmoq bilan sanab boradi va nomlaydi.",
            ],
          },
          {
            title: "Reading: School of the Air (1-mashq, audio 74)",
            minutes: 15,
            points: [
              "Rasmga qarab savollar beriladi: bu qayer, bolalar nima qilyapti?",
              "Matn audio 74 bilan qismlab oʻqiladi, har qismdan keyin pauza qilinadi.",
              "1-mashq birga bajariladi.",
            ],
          },
          {
            title: "2-mashq: yes / no",
            minutes: 12,
            points: [
              "Gaplar birma-bir oʻqiladi, oʻquvchilar yashil yoki qizil kartochka koʻtaradi.",
              "Har javob matndan koʻrsatilib tasdiqlanadi.",
            ],
          },
          {
            title: "Grammar: Wh- questions (1–3-mashqlar)",
            minutes: 18,
            points: [
              "Savol soʻzlari kartochkalari javob rasmlariga moslanadi (Who — odam, Where — joy).",
              "1–3-mashqlar ustoz bilan birga bajariladi.",
              "Har javobda oʻquvchi qaysi savol soʻzi kerakligini avval aytadi.",
            ],
          },
          {
            title: "Pronunciation (5–6-mashqlar, audio 75)",
            minutes: 12,
            points: [
              "Audio 75 eshittiriladi.",
              "Savollar ritm va qarsak bilan takrorlanadi.",
              "Juftlikda navbat bilan savol berish mashqi.",
            ],
          },
          {
            title: "Writing: 3 ta savol va javob",
            minutes: 15,
            points: [
              "Doskada uch namuna savol yoziladi.",
              "Oʻquvchilar sherigiga savol berib, javoblarni birga yozadi.",
              "Ustoz har juftlikka yordam beradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 8,
            points: [
              "Bir nechta juftlik savol-javobini sinfga koʻrsatadi.",
              "WB 38 vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 38: Reading mashqlari.",
          "3 ta Wh- savol yozib, oila aʼzosidan javobini olib kelish.",
        ],
        ustozga: "Savol soʻzlarining maʼnosi bir-biriga qorishib ketadi (When va Where) — ularni har doim bir xil rasm va imo-ishora bilan bogʻlang. Yozma qismni ustoz nazorati ostida, qisqa gaplarda bajarting.",
      },
      {
        focus: "Life Skills: Learning English",
        sb: "54–55 (Life Skills)",
        maqsad: [
          "Oʻquvchilar ingliz tilini oʻrganish usullarini rasm orqali tanib ayta oladilar.",
          "Oʻquvchilar read comics, watch TV, listen to music birikmalarini ishlata oladilar.",
          "Oʻquvchilar oʻzi uchun soʻz kartochkalari tayyorlay oladilar.",
        ],
        lugat: [
          "read comics – komiks oʻqimoq",
          "watch TV – televizor koʻrmoq",
          "listen to music – musiqa tinglamoq",
          "write words – soʻz yozmoq",
          "play games – oʻyin oʻynamoq",
          "learn – oʻrganmoq",
          "word card – soʻz kartochkasi",
          "every day – har kuni",
        ],
        resurslar: [
          "SB 54–55 (Life Skills)",
          "Audio 76, 77",
          "Qalin qogʻoz kartochkalar va rangli qalam",
          "Doska va yopishtiruvchi",
        ],
        blocks: [
          {
            title: "Warm-up (2-mashq)",
            minutes: 10,
            points: [
              "Ustoz usullarni birma-bir aytadi, oʻquvchilar qoʻl koʻtarib javob beradi.",
              "Natija doskada oddiy diagramma koʻrinishida yoziladi.",
            ],
          },
          {
            title: "Reading (3-mashq, audio 76)",
            minutes: 15,
            points: [
              "Matn audio 76 bilan qisqartirilgan holda, ustoz bilan qismlab oʻqiladi.",
              "Har qismdan keyin bitta sodda savol beriladi.",
              "3-mashq birga bajariladi.",
            ],
          },
          {
            title: "Soʻz birikmalari (5–6-mashqlar)",
            minutes: 15,
            points: [
              "Rasmlar bilan feʼl va ot juftliklari doskada moslanadi.",
              "5–6-mashqlar kitobda bajariladi.",
              "Har birikma harakat bilan takrorlanadi.",
            ],
          },
          {
            title: "Listening (7-mashq, audio 77)",
            minutes: 12,
            points: [
              "Audio 77 ikki marta, pauzalar bilan eshittiriladi.",
              "Oʻquvchilar javoblarni belgilaydi va birga tekshiriladi.",
            ],
          },
          {
            title: "Project: vocabulary cards yasash",
            minutes: 20,
            points: [
              "Har oʻquvchi 5 ta soʻz tanlaydi va kartochka yasaydi: bir tomonda soʻz, ikkinchisida rasm.",
              "Ustoz imlo va rasm mosligini tekshiradi.",
              "Kartochkalar sinf devoriga vaqtincha yopishtiriladi.",
            ],
          },
          {
            title: "Oʻyin: kartochkalar bilan Memory",
            minutes: 10,
            points: [
              "Guruhlar oʻz kartochkalarini almashtirib, soʻz va rasmni juftlaydi.",
              "Har topilgan juft uchun ball beriladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 8,
            points: [
              "Har bir oʻquvchi bitta yangi soʻzini sinfga koʻrsatadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Uyda 5 ta buyumga inglizcha nomini yozib yopishtirish.",
          "Yasalgan soʻz kartochkalarini keyingi darsga olib kelish.",
        ],
        ustozga: "Kartochka yasashda bolalar bezakka koʻp vaqt sarflaydi — taymer qoʻying va bir kartochkaga 3 daqiqadan koʻp bermang. Birikmalarni alohida soʻz sifatida emas, bir butun ibora sifatida yodlatish samaraliroq.",
      },
      {
        focus: "Review 2: lugʻat va grammatika oʻyinlari",
        sb: "56 (Review 2)",
        maqsad: [
          "Oʻquvchilar Unit 5–8 lugʻatini oʻyin orqali takrorlay oladilar.",
          "Oʻquvchilar can / cannot va Present simple shakllarini sodda gaplarda ishlata oladilar.",
          "Oʻquvchilar savol kartochkalari bilan bir-biriga savol berib javob ola oladilar.",
        ],
        lugat: [
          "body – tana",
          "arm – qoʻl",
          "leg – oyoq",
          "subject – fan",
          "breakfast – nonushta",
          "can – ola bilmoq",
          "cannot – ola bilmaslik",
          "every day – har kuni",
        ],
        resurslar: [
          "SB 56 (Review 2) va WB 36–39",
          "Unit 5–8 flashcardlari",
          "Savol kartochkalari va stol oʻyini maydoni",
          "Doska, zar va fishkalar",
        ],
        blocks: [
          {
            title: "Warm-up: Board race",
            minutes: 10,
            points: [
              "Ikki jamoa navbat bilan doskaga yugurib, ustoz aytgan soʻzni yozadi.",
              "Toʻgʻri yozilgan har soʻz uchun ball beriladi.",
            ],
          },
          {
            title: "Vocabulary (1–2-mashqlar)",
            minutes: 15,
            points: [
              "1-mashq: tana aʼzolari rasmda belgilanadi.",
              "2-mashq bajariladi va birga tekshiriladi.",
              "Xato chiqqan soʻzlar flashcard bilan qayta takrorlanadi.",
            ],
          },
          {
            title: "Grammar (1–2-mashqlar)",
            minutes: 15,
            points: [
              "1–2-mashqlar ustoz bilan birga bajariladi.",
              "Har javobdan keyin qoida bir gapda eslatiladi.",
            ],
          },
          {
            title: "3-mashq: can / cannot jadvali",
            minutes: 15,
            points: [
              "Jadval birga koʻrib chiqiladi.",
              "Oʻquvchilar jadval boʻyicha gaplar tuzadi va harakat bilan koʻrsatadi.",
              "3-mashq kitobda toʻldiriladi.",
            ],
          },
          {
            title: "Stol oʻyini: savol kartochkalari",
            minutes: 15,
            points: [
              "Guruhlarda zar tashlanadi va katakdagi savolga javob beriladi (Do you …? Can you …?).",
              "Javob bera olgan oʻquvchi oldinga yuradi.",
              "Ustoz aylanib, javoblarni tinglaydi va tuzatadi.",
            ],
          },
          {
            title: "Qoʻshimcha oʻyin: Bingo",
            minutes: 10,
            points: [
              "Unit 5–8 soʻzlari bilan Bingo oʻynaladi.",
              "Gʻolib soʻzlarini ovoz chiqarib takrorlaydi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Sinf eng qiyin 5 ta soʻzni birga aniqlaydi va takrorlaydi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Unit 5–8 dan 10 ta soʻzni rasm bilan lugʻat daftariga yozish.",
          "WB 36–39 dan bajarilmagan bitta mashqni tugatish.",
        ],
        ustozga: "Oʻyin koʻp boʻlgani uchun qoidalarni har safar qisqa va bir xil tarzda tushuntiring, aks holda vaqt tushuntirishga ketadi. Stol oʻyinida sekin oʻquvchilarga yordamchi sifatida kuchliroq sherik biriktiring.",
      },
      {
        focus: "Review 2: koʻnikmalar va takrorlash",
        sb: "57 (Review 2)",
        maqsad: [
          "Oʻquvchilar rasmlar boʻyicha kun tartibini ogʻzaki bayon qila oladilar.",
          "Oʻquvchilar qisqa audio va matndan asosiy maʼlumotni topa oladilar.",
          "Oʻquvchilar shablon asosida 4–5 gapli javob xati yoza oladilar.",
        ],
        lugat: [
          "morning – ertalab",
          "afternoon – tushdan keyin",
          "evening – kechqurun",
          "friend – doʻst",
          "write – yozmoq",
          "answer – javob, javob bermoq",
          "hello – salom",
          "goodbye – xayr",
        ],
        resurslar: [
          "SB 57 (Review 2)",
          "Audio 78",
          "Javob xati shabloni (chop etilgan)",
          "Kun tartibi rasm kartochkalari",
        ],
        blocks: [
          {
            title: "Warm-up: Simon says",
            minutes: 10,
            points: [
              "Tana aʼzolari va kundalik ishlar buyruqlari bilan oʻyin oʻynaladi.",
              "Xato qilgan oʻquvchi keyingi buyruqni oʻzi aytadi.",
            ],
          },
          {
            title: "Speaking (1-mashq)",
            minutes: 15,
            points: [
              "Rasmlar tartib bilan koʻrib chiqiladi.",
              "Oʻquvchilar juftlikda kun tartibini aytib beradi (kamida 5 gap).",
              "Ikki juftlik sinf oldida namuna koʻrsatadi.",
            ],
          },
          {
            title: "Listening (1-mashq, audio 78)",
            minutes: 15,
            points: [
              "Audio 78 ikki marta, pauzalar bilan eshittiriladi.",
              "Oʻquvchilar javoblarni belgilaydi.",
              "Qiyin qism uchinchi marta qayta eshittiriladi va birga tekshiriladi.",
            ],
          },
          {
            title: "Reading: Rodrigo xabari (1-mashq)",
            minutes: 15,
            points: [
              "Matn ustoz bilan qismlab oʻqiladi.",
              "Savollarga birga javob beriladi, javob matndan koʻrsatiladi.",
            ],
          },
          {
            title: "Writing: javob xati",
            minutes: 20,
            points: [
              "Shablon tarqatiladi va birinchi gap doskada birga yoziladi.",
              "Har oʻquvchi 4–5 gapli javob yozadi.",
              "Ustoz yurib, imlo va gap tuzilishiga yordam beradi.",
            ],
          },
          {
            title: "Oʻyin: sinf zanjiri",
            minutes: 8,
            points: [
              "Har oʻquvchi zanjir boʻylab oʻzi haqida bitta gap aytadi.",
              "Keyingi oʻquvchi avval oldingisini takrorlaydi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 7,
            points: [
              "Bir nechta oʻquvchi xatini oʻqib beradi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Rodrigoga javobni chiroyli koʻchirib, ustiga rasm chizish.",
          "Unit 5–8 dagi sevimli 5 ta soʻzni ovoz chiqarib takrorlash.",
        ],
        ustozga: "Yozma ishda bolalar shablondan koʻchirib qoʻya qoladi — har bir oʻquvchidan kamida ikkita oʻz gapini talab qiling. Listening qismida javobni birinchi eshitishdayoq yozishga shoshiltirmang.",
      },
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
      {
        focus: "Sport va faoliyatlar, Listening va like + -ing",
        sb: "58–59",
        maqsad: [
          "Oʻquvchilar sport va faoliyat nomlarini bilib, play bilan ishlatiladiganlarini ajrata oladilar.",
          "Oʻquvchilar like / do not like + -ing konstruksiyasini toʻgʻri imlo bilan qoʻllay oladilar.",
          "Oʻquvchilar ikki doʻsti bilan suhbat oʻtkazib, ular haqida yozma bayon tuza oladilar.",
        ],
        lugat: [
          "badminton – badminton",
          "basketball – basketbol",
          "dancing – raqs tushish",
          "hockey – xokkey",
          "running – yugurish",
          "swimming – suzish",
          "table tennis – stol tennisi",
          "tennis – tennis",
          "good at – … da yaxshi",
        ],
        resurslar: [
          "SB 58–59 va WB 40–41",
          "Audio 80, 81, 82, 83",
          "Sport flashcardlari",
          "Video 08 (Feeling good) va proyektor",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up va Unit 8 takrori",
            minutes: 10,
            points: [
              "About you savollari: qaysi faoliyatlarni yoqtirasiz, doʻstlaringiz bilan nima qilasiz?",
              "Unit 8 dan 5 ta savol Do you …? shaklida tezkor takrorlanadi.",
            ],
          },
          {
            title: "Vocabulary: Sports and activities (1–2-mashqlar)",
            minutes: 15,
            points: [
              "Flashcardlar bilan sport nomlari tanishtiriladi, audio 80 eshittiriladi.",
              "Doskada uch ustun: play, go, do — soʻzlar toʻgʻri ustunga ajratiladi.",
              "1–2-mashqlar bajariladi va audio 81 bilan tekshiriladi.",
            ],
          },
          {
            title: "Listening (3–4-mashqlar, audio 82)",
            minutes: 15,
            points: [
              "Tinglashdan oldin savollar oʻqib chiqiladi.",
              "Audio 82 ikki marta eshittiriladi; 3–4-mashqlar bajariladi.",
              "Javoblar juftlikda solishtiriladi.",
            ],
          },
          {
            title: "Pronunciation: Word stress (5-mashq)",
            minutes: 8,
            points: [
              "Audio 83 eshittiriladi, urgʻuli boʻgʻin aniqlanadi.",
              "Soʻzlar urgʻu sxemasi boʻyicha guruhlarga ajratiladi va takrorlanadi.",
            ],
          },
          {
            title: "Grammar: like + -ing (1–3-mashqlar)",
            minutes: 20,
            points: [
              "Doskada -ing imlo qoidalari koʻrsatiladi: run — running, dance — dancing, swim — swimming.",
              "Grammar reference SB 146 birga koʻrib chiqiladi.",
              "1–3-mashqlar bajariladi va sinf bilan tekshiriladi.",
              "Tezkor drilling: ustoz feʼlni aytadi, oʻquvchilar -ing shaklini qaytaradi.",
            ],
          },
          {
            title: "Speaking va Writing (4–6-mashqlar) va video 08",
            minutes: 17,
            points: [
              "4-mashq: jadval oʻz maʼlumotlari bilan toʻldiriladi.",
              "5-mashq: ikki doʻsti bilan suhbat oʻtkaziladi, javoblar jadvalga yoziladi.",
              "6-mashq: ular haqida 4–5 gap yoziladi; Talking points muhokama qilinadi va video 08 koʻrsatiladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 5,
            points: [
              "Zanjir mashqi: har oʻquvchi I like …ing bilan bitta gap aytadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 40–41: Sports and activities lugʻati va Listening mashqlari.",
          "WB 41: like + -ing grammatika bloki.",
        ],
        ustozga: "Eng koʻp uchraydigan xato — like dan keyin infinitiv ishlatish (I like swim) va -ing imlosi (swiming). Imlo qoidalarini doskada uch guruhga boʻlib yozing va dars oxirigacha oʻchirmang. play football / go swimming farqini ham alohida taʼkidlang.",
      },
      {
        focus: "Ask the doctor: sogʻliq va obyekt olmoshlari",
        sb: "60–61",
        maqsad: [
          "Oʻquvchilar sogʻliq haqidagi maktub va javoblarni oʻqib, mos juftlikni topa oladilar.",
          "Oʻquvchilar me, you, him, her, it, us, them olmoshlarini toʻgʻri qoʻllay oladilar.",
          "Oʻquvchilar sogʻlom turmush tarzi haqida qisqa maktub yozib, unga javob bera oladilar.",
        ],
        lugat: [
          "feel better – oʻzini yaxshi his qilmoq",
          "good for you – siz uchun foydali",
          "breakfast – nonushta",
          "healthy – sogʻlom",
          "tired – charchagan",
          "advice – maslahat",
          "him – unga (erkak)",
          "her – unga (ayol)",
          "them – ularga",
        ],
        resurslar: [
          "SB 60–61 (va javoblar uchun Extra activities SB 124) hamda WB 42–43",
          "Audio 84",
          "Sogʻlom va sogʻlom emas ovqat rasmlari",
          "Doska va olmosh kartochkalari",
        ],
        blocks: [
          {
            title: "Warm-up: Good for you / Not good for you",
            minutes: 10,
            points: [
              "Ovqat va faoliyat rasmlari tezkor ikki guruhga saralanadi.",
              "Har tanlov qisqa sabab bilan izohlanadi.",
            ],
          },
          {
            title: "Reading: Ask the doctor (1–2-mashqlar)",
            minutes: 18,
            points: [
              "Maktublar audio 84 bilan eshitilib oʻqiladi.",
              "1–2-mashqlar: maktublar javoblarga moslanadi.",
              "Har moslik matndagi kalit soʻz bilan asoslanadi.",
            ],
          },
          {
            title: "Sogʻlom nonushta va yangi iboralar (3–6-mashqlar)",
            minutes: 15,
            points: [
              "3-mashq bajariladi, javoblar Extra activities (SB 124) orqali tekshiriladi.",
              "4–5-mashqlar: yangi iboralar jadvalga kiritiladi.",
              "6-mashq: juftlikda oʻz nonushtasi muhokama qilinadi.",
            ],
          },
          {
            title: "Grammar: Object pronouns (1–3-mashqlar)",
            minutes: 18,
            points: [
              "Doskada ega va obyekt olmoshlari jufti yoziladi: I — me, he — him, they — them.",
              "1–3-mashqlar bajariladi va sinf bilan tekshiriladi.",
              "Tezkor drilling: ustoz otni aytadi, oʻquvchilar mos olmoshni qaytaradi.",
            ],
          },
          {
            title: "Writing: Dr Smartga maktub (4–5-mashqlar)",
            minutes: 17,
            points: [
              "4-mashq: har oʻquvchi sogʻliq bilan bogʻliq muammo haqida qisqa maktub yozadi.",
              "Maktublar almashtiriladi.",
              "5-mashq: sherigining maktubiga maslahat bilan javob yoziladi (kamida 2 ta olmosh ishlatilsin).",
            ],
          },
          {
            title: "Speaking (1-mashq)",
            minutes: 7,
            points: [
              "Juftlikda dam olish kunlari yoqtirgan 5 ta ish aytiladi.",
              "Har ish uchun foydalimi yoki yoʻqmi degan savolga javob beriladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 5,
            points: [
              "Eng yaxshi ikki maslahat sinfga oʻqib beriladi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 42–43: Health lugʻati, Reading va Object pronouns mashqlari.",
          "WB 43 Writing: sogʻlom turmush tarzi haqida qisqa matn.",
        ],
        ustozga: "Oʻzbek tilida olmosh kelishik qoʻshimchasi bilan berilgani uchun oʻquvchilar he va him ni chalkashtiradi — doskadagi juftliklar jadvalini har tuzatishda koʻrsating. Maktub yozishda mavzu tor boʻlsin: bitta muammo, ikkita maslahat.",
      },
    ],
    kids: [
      {
        focus: "Sport va faoliyatlar",
        sb: "58",
        maqsad: [
          "Oʻquvchilar 8 ta sport nomini harakat bilan koʻrsatib ayta oladilar.",
          "Oʻquvchilar audioni tinglab, sportni rasmga moslay oladilar.",
          "Oʻquvchilar soʻzlardagi urgʻuli boʻgʻinni topa oladilar.",
        ],
        lugat: [
          "badminton – badminton",
          "basketball – basketbol",
          "dancing – raqs tushish",
          "hockey – xokkey",
          "running – yugurish",
          "swimming – suzish",
          "table tennis – stol tennisi",
          "tennis – tennis",
        ],
        resurslar: [
          "SB 58 va WB 40",
          "Audio 80, 81, 82, 83",
          "Sport flashcardlari",
          "Fan va kun tartibi kartochkalari (warm-up uchun)",
        ],
        blocks: [
          {
            title: "Warm-up: flashcard takrori",
            minutes: 10,
            points: [
              "Fan nomlari va kundalik ishlar kartochkalari tezkor takrorlanadi.",
              "Ustoz kartochkani koʻrsatadi, sinf soʻzni baqiradi.",
            ],
          },
          {
            title: "Vocabulary: Sports and activities (1–2-mashqlar)",
            minutes: 15,
            points: [
              "Har sport uchun harakat koʻrsatiladi va sinf takrorlaydi (TPR).",
              "Audio 80 eshittiriladi va soʻzlar xor bilan takrorlanadi.",
              "1–2-mashqlar bajariladi, audio 81 bilan tekshiriladi.",
            ],
          },
          {
            title: "play va go farqi",
            minutes: 12,
            points: [
              "Doskada ikki ustun chiziladi: play va go.",
              "Oʻquvchilar kartochkalarni oʻz ustuniga yopishtiradi.",
              "Ogʻzaki drilling: ustoz sport nomini aytadi, sinf play yoki go deb javob beradi.",
            ],
          },
          {
            title: "Listening (3-mashq, audio 82)",
            minutes: 13,
            points: [
              "Rasmlar oldindan koʻrib chiqiladi.",
              "Audio 82 ikki marta, pauzalar bilan eshittiriladi.",
              "Oʻquvchilar rasmlarga ism yozadi va birga tekshiriladi.",
            ],
          },
          {
            title: "Pronunciation: Word stress (5-mashq, audio 83)",
            minutes: 10,
            points: [
              "Audio 83 eshittiriladi.",
              "Oʻquvchilar urgʻuli boʻgʻinda sakraydi yoki qarsak chaladi.",
              "Soʻzlar guruhlarga ajratib takrorlanadi.",
            ],
          },
          {
            title: "Oʻyin: Charades",
            minutes: 20,
            points: [
              "Oʻquvchi kartochkadagi sportni mimika bilan koʻrsatadi.",
              "Sinf toʻgʻri nomni topadi va gap tuzadi: He plays tennis.",
              "Oʻyin ikki jamoa orasida ball hisobida oʻtkaziladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Sport nomlari oxirgi marta harakat bilan takrorlanadi.",
              "Har oʻquvchi sevimli sportini aytadi.",
              "WB 40 vazifasi koʻrsatiladi.",
            ],
          },
        ],
        uyga: [
          "WB 40: sport soʻzlari boʻyicha 1–2 ta mashq.",
          "Sevimli sportini chizib, ostiga inglizcha nomini yozib kelish.",
        ],
        ustozga: "badminton va basketball soʻzlari uzun — ularni boʻgʻinlab, qarsak bilan takrorlating. Charades oʻyinida navbatni kartochka orqali belgilang, aks holda uyatchan bolalar chetda qoladi.",
      },
      {
        focus: "I like …ing",
        sb: "59",
        maqsad: [
          "Oʻquvchilar I like / I do not like + -ing bilan gap tuza oladilar.",
          "Oʻquvchilar -ing qoʻshimchasining sodda imlo qoidalarini qoʻllay oladilar.",
          "Oʻquvchilar ikki doʻsti bilan qisqa suhbat oʻtkaza oladilar.",
        ],
        lugat: [
          "like – yoqtirmoq",
          "do not like – yoqtirmaslik",
          "swimming – suzish",
          "running – yugurish",
          "dancing – raqs tushish",
          "playing – oʻynash",
          "reading – oʻqish",
          "singing – kuylash",
        ],
        resurslar: [
          "SB 59 va WB 41",
          "Video 08 va proyektor",
          "Rangli -ing qoida kartochkalari",
          "Tabassum va xafa yuz rasmchalari",
        ],
        blocks: [
          {
            title: "Warm-up: sport zanjiri",
            minutes: 10,
            points: [
              "Har oʻquvchi sevimli sportini aytib, harakatini koʻrsatadi.",
              "Keyingi oʻquvchi avval oldingisini takrorlaydi.",
            ],
          },
          {
            title: "Grammar: like + -ing (1-mashq)",
            minutes: 15,
            points: [
              "Ustoz tabassum va xafa yuz rasmchalari bilan namuna beradi.",
              "Sinf xor bilan I like swimming. I do not like running. deb takrorlaydi.",
              "1-mashq kitobda bajariladi.",
            ],
          },
          {
            title: "2-mashq va -ing qoidalari",
            minutes: 15,
            points: [
              "Rangli kartochkalarda uch qoida koʻrsatiladi: oddiy qoʻshish, e tushishi, undosh ikkilanishi.",
              "Oʻquvchilar feʼllarni toʻgʻri qutiga joylaydi.",
              "2-mashq bajariladi va birga tekshiriladi.",
            ],
          },
          {
            title: "3-mashq ustoz bilan",
            minutes: 12,
            points: [
              "Mashq gaplari birma-bir ogʻzaki aytilib, keyin yoziladi.",
              "Har javobda oʻquvchi qaysi qoida ishlaganini koʻrsatadi.",
            ],
          },
          {
            title: "4-mashq: jadvalni toʻldirish",
            minutes: 13,
            points: [
              "Oʻquvchilar jadvalga yuz ifodalari chizib, oʻz didini belgilaydi.",
              "Juftlikda jadval boʻyicha savol-javob oʻtkaziladi.",
            ],
          },
          {
            title: "5-mashq: suhbat va video 08",
            minutes: 15,
            points: [
              "Har oʻquvchi ikki doʻstidan soʻrab, javoblarni jadvalga yozadi.",
              "Video 08 koʻrsatiladi va koʻrilgan faoliyatlar sanab chiqiladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Bir nechta oʻquvchi doʻsti haqida bitta gap aytadi.",
              "WB 41 vazifasi koʻrsatiladi.",
            ],
          },
        ],
        uyga: [
          "WB 41: like + -ing boʻyicha 2 ta mashq.",
          "Oʻzi yoqtirgan va yoqtirmagan 2 tadan faoliyatni chizib, ostiga gap yozib kelish.",
        ],
        ustozga: "Bolalar I like swim deb aytishga moyil — har gapda -ing ni ovoz bilan choʻzib takrorlating. Imlo qoidalarini yodlatmang, kartochkalar bilan saralash orqali mustahkamlang.",
      },
      {
        focus: "Sogʻlom boʻlish va olmoshlar",
        sb: "60–61",
        maqsad: [
          "Oʻquvchilar sogʻlom va sogʻlom boʻlmagan taomlarni ajrata oladilar.",
          "Oʻquvchilar me, him, her, them olmoshlarini sodda gaplarda ishlata oladilar.",
          "Oʻquvchilar oʻz nonushtasi haqida gapira oladilar.",
        ],
        lugat: [
          "healthy – sogʻlom",
          "good for you – foydali",
          "breakfast – nonushta",
          "feel better – oʻzini yaxshi his qilmoq",
          "me – menga",
          "him – unga (erkak)",
          "her – unga (ayol)",
          "them – ularga",
        ],
        resurslar: [
          "SB 60–61 (javoblar uchun Extra activities SB 124) va WB 42",
          "Audio 84",
          "Ikki savat va ovqat rasmlari",
          "Olmosh kartochkalari va kichik toʻp",
        ],
        blocks: [
          {
            title: "Warm-up: ikki savat oʻyini",
            minutes: 10,
            points: [
              "Ovqat rasmlari sogʻlom va sogʻlom emas savatlariga ajratiladi.",
              "Har tanlov qisqa izohlanadi: It is good for you.",
            ],
          },
          {
            title: "Reading: Ask the doctor (1-mashq, audio 84)",
            minutes: 15,
            points: [
              "Maktublar audio 84 bilan qismlab oʻqiladi.",
              "Har qismdan keyin bitta sodda savol beriladi.",
              "1-mashq birga bajariladi.",
            ],
          },
          {
            title: "3-mashq: sogʻlom nonushta",
            minutes: 12,
            points: [
              "Oʻquvchilar nonushta variantlarini tanlaydi.",
              "Javoblar Extra activities (SB 124) orqali tekshiriladi.",
              "Sinf eng sogʻlom nonushtani birga tanlaydi.",
            ],
          },
          {
            title: "5-mashq: jadval",
            minutes: 10,
            points: [
              "Jadval ustoz bilan birga toʻldiriladi.",
              "Har qator ogʻzaki bir gap bilan izohlanadi.",
            ],
          },
          {
            title: "Grammar: Object pronouns (1–3-mashqlar)",
            minutes: 18,
            points: [
              "Olmosh kartochkalari tarqatiladi, ustoz otni aytadi, oʻquvchilar kartochkani koʻtaradi.",
              "Toʻp bilan TPR: Give it to him. Give it to her.",
              "1–3-mashqlar ustoz bilan birga bajariladi.",
            ],
          },
          {
            title: "Speaking (1 va 6-mashqlar)",
            minutes: 15,
            points: [
              "Har oʻquvchi yoqtirgan 3 ta ishini aytib, foydalimi degan savolga javob beradi.",
              "6-mashq: juftlikda nonushtada nima yeyishi muhokama qilinadi.",
              "Bir nechta oʻquvchi sinfga aytib beradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Olmoshlar toʻp oʻyini bilan oxirgi marta takrorlanadi.",
              "WB 42 vazifasi koʻrsatiladi.",
            ],
          },
        ],
        uyga: [
          "WB 42: Health boʻyicha mashqlar.",
          "Sogʻlom nonushta rasmini chizib, 2 ta inglizcha gap yozib kelish.",
        ],
        ustozga: "Toʻp bilan olmosh oʻyini juda faol oʻtadi — oldindan xavfsiz joy va yumshoq toʻp tanlang. him va her ni chalkashtirish odatiy; har kartochkada erkak va ayol rasmini qoʻyib bering.",
      },
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
      {
        focus: "Klublar, Listening va Present continuous",
        sb: "62–63",
        maqsad: [
          "Oʻquvchilar maktabdan keyingi klub nomlarini bilib, oʻzlariga mos klubni tanlay oladilar.",
          "Oʻquvchilar Present continuous ning tasdiq va inkor shakllarini toʻgʻri tuza oladilar.",
          "Oʻquvchilar hozir bajarilayotgan ish haqida gapirib, mimika oʻyinida qoʻllay oladilar.",
        ],
        lugat: [
          "athletics club – yengil atletika toʻgaragi",
          "board games club – stol oʻyinlari toʻgaragi",
          "coding club – dasturlash toʻgaragi",
          "drama club – teatr toʻgaragi",
          "cookery club – pazandalik toʻgaragi",
          "join – qoʻshilmoq",
          "at the moment – hozir",
          "now – hozir",
        ],
        resurslar: [
          "SB 62–63 va WB 44–45",
          "Audio 85, 86, 87",
          "Klub nomlari flashcardlari",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up va Unit 9 takrori",
            minutes: 10,
            points: [
              "About you savoli: maktabingizda qanday klublar bor, qaysi biriga borasiz?",
              "Unit 9 dan 5 ta gap I like …ing bilan tezkor takrorlanadi.",
            ],
          },
          {
            title: "Vocabulary: After-school activities (1–2-mashqlar)",
            minutes: 15,
            points: [
              "Flashcardlar bilan klub nomlari tanishtiriladi, audio 85 eshittiriladi.",
              "1-mashq bajariladi va talaffuz xor bilan mashq qilinadi.",
              "2-mashq: uch kishilik guruhda klub tanlanadi va sabab aytiladi.",
            ],
          },
          {
            title: "Listening: Freyaning klublari (3–5-mashqlar)",
            minutes: 18,
            points: [
              "Tinglashdan oldin savollar va jadval koʻrib chiqiladi.",
              "Audio 86 ikki marta eshittiriladi; 3–5-mashqlar bajariladi.",
              "Javoblar juftlikda solishtiriladi va sinf bilan tekshiriladi.",
            ],
          },
          {
            title: "Grammar: Present continuous (+ / −) (1–3-mashqlar)",
            minutes: 22,
            points: [
              "Doskada formula koʻrsatiladi: am / is / are + feʼl + -ing.",
              "Present simple bilan farqi ikki misolda solishtiriladi (every day va now).",
              "1–3-mashqlar bajariladi, 3-mashq audio 87 bilan tekshiriladi (Grammar reference SB 147).",
            ],
          },
          {
            title: "4-mashq: mimika oʻyini",
            minutes: 17,
            points: [
              "Student A harakat qiladi, B va C Present continuous savollari bilan topadi.",
              "Rollar almashtiriladi, har guruh kamida 3 ta harakatni oʻynaydi.",
              "Ustoz aylanib, yordamchi feʼl tushib qolmasligini nazorat qiladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 8,
            points: [
              "Zanjir mashqi: har oʻquvchi sinfdoshi nima qilayotganini aytadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 44–45: After-school activities lugʻati va Listening mashqlari.",
          "WB 45: Present continuous grammatika bloki.",
        ],
        ustozga: "Oʻquvchilar am / is / are yordamchi feʼlini tushirib qoldiradi (He playing) — doskadagi formulani dars davomida koʻrinadigan joyda saqlang. Present simple bilan farqni har mashqdan keyin bitta misol orqali eslatib turing.",
      },
      {
        focus: "Uy ishlari, hikoya va Present continuous savollari",
        sb: "64–65",
        maqsad: [
          "Oʻquvchilar uy ishlari nomlarini bilib, kim nima qilayotganini ayta oladilar.",
          "Oʻquvchilar Present continuous savollari va qisqa javoblarini qoʻllay oladilar.",
          "Oʻquvchilar namuna blog asosida oʻzi haqida qisqa blog yoza oladilar.",
        ],
        lugat: [
          "carry the shopping – xaridni koʻtarib bermoq",
          "clean the bath – vannani tozalamoq",
          "do the washing-up – idish yuvmoq",
          "feed the cat – mushukni boqmoq",
          "make your bed – karavotni yigʻishtirmoq",
          "tidy your room – xonani tartibga keltirmoq",
          "walk the dog – itni sayr qildirmoq",
          "help – yordam bermoq",
        ],
        resurslar: [
          "SB 64–65 va WB 46–47",
          "Audio 88, 89, 90",
          "Uy ishlari rasm kartochkalari",
          "Blog shabloni va doska",
        ],
        blocks: [
          {
            title: "Warm-up: What are you doing?",
            minutes: 10,
            points: [
              "Rasm kartochkalari koʻrsatiladi, oʻquvchilar tezkor savol-javob qiladi.",
              "Oʻtgan darsdagi klub nomlari qisqa takrorlanadi.",
            ],
          },
          {
            title: "Vocabulary: Jobs around the house (1-mashq)",
            minutes: 10,
            points: [
              "Audio 88 eshittiriladi, iboralar harakat bilan takrorlanadi.",
              "1-mashq bajariladi; oʻquvchilar uyda qaysi ishni qilishini belgilaydi.",
            ],
          },
          {
            title: "Reading: hikoya (2–4-mashqlar)",
            minutes: 18,
            points: [
              "Rasmlar boʻyicha voqea taxmin qilinadi.",
              "Matn audio 89 bilan eshitilib oʻqiladi.",
              "2–4-mashqlar bajariladi va javoblar matndan asoslanadi.",
            ],
          },
          {
            title: "Pronunciation (3-mashq) va xotira mashqi (4–5-mashqlar)",
            minutes: 15,
            points: [
              "Audio 90 bilan Yes / No savollari ohangi mashq qilinadi.",
              "4-mashq: kitob yopiq holda xotiradan savol-javob.",
              "5-mashq: hikoya kichik guruhlarda rolda oʻynaladi.",
            ],
          },
          {
            title: "Grammar: Present continuous questions (1–2-mashqlar)",
            minutes: 17,
            points: [
              "Doskada savol tartibi koʻrsatiladi: am / is / are + ega + feʼl + -ing.",
              "Qisqa javoblar alohida yozib qoʻyiladi.",
              "1–2-mashqlar bajariladi; Talking points muhokama qilinadi.",
            ],
          },
          {
            title: "Writing: oʻzi haqida blog (1–2-mashqlar)",
            minutes: 15,
            points: [
              "Namuna blog tuzilishi tahlil qilinadi: kirish, hozir nima qilyapman, uy ishlari, yakun.",
              "Oʻquvchilar oʻz blogini yoza boshlaydi (60–80 soʻz).",
              "Ustoz yurib, yordamchi feʼl va -ing shaklini tekshiradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 5,
            points: [
              "Ikki oʻquvchi blogini oʻqib beradi.",
              "Uy vazifasi va baholash mezoni eslatiladi.",
            ],
          },
        ],
        uyga: [
          "WB 46–47: Jobs around the house, Reading va Grammar mashqlari.",
          "WB 47 Writing: blogni tugatib, toza koʻchirish.",
        ],
        ustozga: "Uy ishlari iboralarida artikl va egalik olmoshi tushib qoladi (make bed) — iborani bir butun holda yodlating. Savol tuzishda soʻz tartibi buzilsa, doskadagi formulaga qaytib koʻrsating.",
      },
      {
        focus: "Culture: Youth clubs in the UK",
        sb: "66–67 (Culture)",
        maqsad: [
          "Oʻquvchilar Buyuk Britaniyadagi yoshlar klublari haqidagi blogni oʻqib tushuna oladilar.",
          "Oʻquvchilar oʻz qiziqishlari haqida like / do not like bilan gapira oladilar.",
          "Oʻquvchilar guruhda xayoliy yoshlar klubi uchun blog sahifasi tayyorlay oladilar.",
        ],
        lugat: [
          "youth club – yoshlar klubi",
          "member – aʼzo",
          "activity – mashgʻulot",
          "free – bepul",
          "meet – uchrashmoq",
          "volunteer – koʻngilli",
          "once a week – haftada bir marta",
          "join – qoʻshilmoq",
        ],
        resurslar: [
          "SB 66–67 (Culture)",
          "Audio 91, 92",
          "Culture video 09 (Boy and Girl Scouts) va proyektor",
          "Plakat qogʻozi yoki noutbuk (blog sahifasi uchun)",
        ],
        blocks: [
          {
            title: "Warm-up (1-mashq) va Factfile",
            minutes: 10,
            points: [
              "1-mashq: maktabdan keyin nima qilasiz degan savol muhokama qilinadi.",
              "Factfile birga oʻqilib, eng qiziq maʼlumot belgilanadi.",
            ],
          },
          {
            title: "Reading: City Youth Club blogi (2–4-mashqlar)",
            minutes: 18,
            points: [
              "Blog audio 91 bilan eshitilib oʻqiladi.",
              "2–4-mashqlar bajariladi va javoblar matndan koʻrsatiladi.",
              "Notanish soʻzlar kontekstdan aniqlanadi.",
            ],
          },
          {
            title: "5-mashq: oʻzi haqida gaplar",
            minutes: 10,
            points: [
              "Oʻquvchilar I like … / I do not like … bilan 3 ta gap yozadi.",
              "Juftlikda almashib, umumiy qiziqish topiladi.",
            ],
          },
          {
            title: "Listening (6–7-mashqlar, audio 92)",
            minutes: 15,
            points: [
              "Savollar oldindan oʻqiladi.",
              "Audio 92 ikki marta eshittiriladi; 6–7-mashqlar bajariladi.",
              "Javoblar sinf bilan tekshiriladi.",
            ],
          },
          {
            title: "Culture video 09 va Talking points",
            minutes: 12,
            points: [
              "Video 09 koʻrsatiladi; oʻquvchilar 3 ta mashgʻulotni yozib boradi.",
              "Talking points savollari kichik guruhlarda muhokama qilinadi.",
            ],
          },
          {
            title: "Project: xayoliy yoshlar klubi blogi",
            minutes: 20,
            points: [
              "Guruhlar klub nomi, kunlari, mashgʻulotlari va aʼzolik shartlarini belgilaydi.",
              "Blog sahifasining eskizi chiziladi va inglizcha sarlavhalar yoziladi.",
              "Ustoz har guruhga til boʻyicha yordam beradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 5,
            points: [
              "Har guruh loyihasidan bir jumlani sinfga oʻqiydi.",
              "Yakuniy test tuzilishi va takrorlash rejasi eʼlon qilinadi.",
            ],
          },
        ],
        uyga: [
          "Project: blog sahifasini tugatib, taqdimotga tayyorlanish.",
          "Yakuniy test uchun Unit 6–10 lugʻati va Grammar reference (SB 143–147) ni takrorlash.",
        ],
        ustozga: "Loyihada guruh ichida vazifalarni oldindan taqsimlang (matn, dizayn, taqdimot), aks holda bir oʻquvchi hamma ishni bajaradi. Test oldidan takrorlash rejasini aniq sanalar bilan bering.",
      },
      {
        focus: "End-of-level test (L1)",
        sb: "—",
        maqsad: [
          "Oʻquvchilar Unit 1–10 lugʻati va grammatikasini test formatida qoʻllay oladilar.",
          "Oʻquvchilar tinglash va oʻqish topshiriqlarini belgilangan vaqtda bajara oladilar.",
          "Oʻquvchilar oʻz natijalarini tahlil qilib, keyingi daraja uchun takrorlash rejasini tuza oladilar.",
        ],
        lugat: [
          "test – test, nazorat ishi",
          "answer – javob",
          "question – savol",
          "score – ball, natija",
          "mistake – xato",
          "correct – toʻgʻri",
          "part – qism",
          "time limit – vaqt chegarasi",
        ],
        resurslar: [
          "Markaz testi: Unit 1–10 (asosan Unit 6–10) boʻyicha topshiriqlar",
          "Test audiosi va kolonka",
          "Soat yoki taymer",
          "Javob varaqalari va qalam",
        ],
        blocks: [
          {
            title: "Warm-up va test tuzilishini tushuntirish",
            minutes: 10,
            points: [
              "5 daqiqalik ogʻzaki takror: Unit 6–10 dan tezkor savollar.",
              "Test qismlari, vaqt taqsimoti va baholash mezoni doskada koʻrsatiladi.",
            ],
          },
          {
            title: "Yozma qism: Vocabulary va Grammar",
            minutes: 25,
            points: [
              "Oʻquvchilar mustaqil ishlaydi, ustoz faqat texnik savollarga javob beradi.",
              "Vaqt qolgani doskada har 10 daqiqada yangilanadi.",
            ],
          },
          {
            title: "Listening qismi",
            minutes: 12,
            points: [
              "Savollar oʻqib chiqilgach, audio ikki marta qoʻyiladi.",
              "Oxirida javoblarni koʻchirish uchun 2 daqiqa beriladi.",
            ],
          },
          {
            title: "Reading qismi",
            minutes: 13,
            points: [
              "Review topshiriqlari formatidagi matn va savollar mustaqil bajariladi.",
              "Vaqt tugashidan 2 daqiqa oldin ogohlantirish beriladi.",
            ],
          },
          {
            title: "Writing: qisqa matn (40–60 soʻz)",
            minutes: 15,
            points: [
              "Mavzu eʼlon qilinadi va tuzilish qisqa eslatiladi.",
              "Oʻquvchilar matnni yozadi va oʻzi bir marta tekshirib chiqadi.",
            ],
          },
          {
            title: "Speaking: juftlikda savol-javob",
            minutes: 10,
            points: [
              "Juftliklar navbat bilan ustoz oldida savol-javob qiladi.",
              "Ustoz talaffuz, ravonlik va grammatika boʻyicha ball qoʻyadi.",
            ],
          },
          {
            title: "Yakun: umumiy xatolar tahlili",
            minutes: 5,
            points: [
              "Eng koʻp uchragan 3 ta xato doskada koʻrsatiladi.",
              "Har oʻquvchiga shaxsiy takrorlash yoʻnalishi beriladi.",
            ],
          },
        ],
        uyga: [
          "Test tahlilidagi xatolar ustida ishlash: har xato uchun 2 ta toʻgʻri gap yozish.",
          "Keyingi daraja oldidan Grammar reference (SB 143–147) ni takrorlash.",
        ],
        ustozga: "Test kunida vaqtni qatʼiy nazorat qiling va har qism boshida ogohlantiring. Speaking qismini boshqa oʻquvchilar yozma ish bilan band boʻlgan paytda oʻtkazsangiz, vaqt yetadi.",
      },
    ],
    kids: [
      {
        focus: "Maktabdan keyingi klublar",
        sb: "62",
        maqsad: [
          "Oʻquvchilar 5 ta klub nomini rasm orqali tanib ayta oladilar.",
          "Oʻquvchilar oʻziga yoqqan 3 ta klubni tanlab, guruhda ayta oladilar.",
          "Oʻquvchilar audioni tinglab, mashgʻulotlarni kunlarga moslay oladilar.",
        ],
        lugat: [
          "athletics club – yengil atletika toʻgaragi",
          "board games club – stol oʻyinlari toʻgaragi",
          "coding club – dasturlash toʻgaragi",
          "drama club – teatr toʻgaragi",
          "cookery club – pazandalik toʻgaragi",
          "club – toʻgarak, klub",
          "day – kun",
          "after school – darsdan keyin",
        ],
        resurslar: [
          "SB 62 va WB 44",
          "Audio 85, 86",
          "Klub rasm kartochkalari (Memory uchun juft nusxada)",
          "Katta qogʻoz (sinf soʻrovi uchun)",
        ],
        blocks: [
          {
            title: "Warm-up: I like …ing zanjiri",
            minutes: 10,
            points: [
              "Har oʻquvchi I like …ing bilan bitta gap aytadi va harakat koʻrsatadi.",
              "Unit 9 sport soʻzlari shu tariqa takrorlanadi.",
            ],
          },
          {
            title: "Vocabulary: After-school activities (1-mashq, audio 85)",
            minutes: 15,
            points: [
              "Klub rasmlari koʻrsatiladi va nomlari xor bilan takrorlanadi.",
              "Audio 85 eshittiriladi, oʻquvchilar rasmni barmoq bilan koʻrsatadi.",
              "1-mashq kitobda bajariladi.",
            ],
          },
          {
            title: "Memory oʻyini",
            minutes: 12,
            points: [
              "Juft kartochkalar teskari yotqiziladi.",
              "Oʻquvchilar navbat bilan ikkitasini ochib, klub nomini aytadi.",
              "Toʻgʻri juft topgan oʻquvchi kartochkani oladi.",
            ],
          },
          {
            title: "2-mashq: 3 ta klub tanlash",
            minutes: 13,
            points: [
              "Har oʻquvchi 3 ta klubni belgilaydi.",
              "Guruhda navbat bilan aytiladi: I like the drama club.",
              "Har guruh eng mashhur klubni aniqlaydi.",
            ],
          },
          {
            title: "Listening (3–4-mashqlar, audio 86)",
            minutes: 15,
            points: [
              "Jadval oldindan koʻrib chiqiladi.",
              "Audio 86 ikki marta, pauzalar bilan eshittiriladi.",
              "Rasmlar kunlarga moslanadi va birga tekshiriladi.",
            ],
          },
          {
            title: "Sinf soʻrovi",
            minutes: 15,
            points: [
              "Oʻquvchilar 5 ta sinfdoshidan qaysi klubni yoqtirishini soʻraydi.",
              "Natijalar katta qogʻozdagi diagrammaga kiritiladi.",
              "Sinf eng mashhur klubni aniqlab, birga sanab chiqadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Klub nomlari flashcard bilan oxirgi marta takrorlanadi.",
              "Har oʻquvchi orzusidagi klubni aytadi.",
              "WB 44 vazifasi koʻrsatiladi.",
            ],
          },
        ],
        uyga: [
          "WB 44: klublar boʻyicha 1–2 ta mashq.",
          "Orzudagi klubni chizib, ostiga inglizcha nomini yozib kelish.",
        ],
        ustozga: "Klub nomlari uzun soʻz birikmalari — ularni ikki qismga boʻlib (drama + club) takrorlating. Soʻrov mashqida har oʻquvchiga aniq 5 ta sinfdosh belgilab bering, aks holda vaqt choʻzilib ketadi.",
      },
      {
        focus: "Present continuous: hozir nima qilyapman?",
        sb: "63",
        maqsad: [
          "Oʻquvchilar am / is / are + -ing shaklini tuza oladilar.",
          "Oʻquvchilar hozir bajarilayotgan harakatni ayta oladilar.",
          "Oʻquvchilar mimika oʻyinida savol berib, harakatni topa oladilar.",
        ],
        lugat: [
          "now – hozir",
          "am / is / are – boʻlmoq feʼlining shakllari",
          "reading – oʻqiyapti",
          "writing – yozyapti",
          "drawing – chizyapti",
          "sitting – oʻtiribdi",
          "standing – turibdi",
          "jumping – sakrayapti",
        ],
        resurslar: [
          "SB 63 va WB 45",
          "Audio 87",
          "am / is / are kartochkalari va feʼl rasmlari",
          "Doska va rangli marker",
        ],
        blocks: [
          {
            title: "Warm-up: ustoz harakat qiladi",
            minutes: 10,
            points: [
              "Ustoz harakat bajaradi, sinf You are … deb aytadi.",
              "Keyin oʻquvchilar navbat bilan harakat koʻrsatadi.",
            ],
          },
          {
            title: "Grammar: Present continuous (1-mashq)",
            minutes: 15,
            points: [
              "Doskada formula rangli yoziladi: am / is / are + feʼl + -ing.",
              "Ustoz namuna gaplarni harakat bilan aytadi, sinf takrorlaydi.",
              "1-mashq kitobda bajariladi.",
            ],
          },
          {
            title: "2-mashq: am / is / are kartochkalari",
            minutes: 15,
            points: [
              "Uch oʻquvchi kartochkalarni ushlab turadi.",
              "Ustoz ega aytadi, sinf qaysi kartochka kerakligini koʻrsatadi.",
              "2-mashq kitobda toʻldiriladi.",
            ],
          },
          {
            title: "3-mashq: yes / no (audio 87)",
            minutes: 12,
            points: [
              "Rasm birga koʻrib chiqiladi.",
              "Audio 87 eshittiriladi, oʻquvchilar yashil yoki qizil kartochka koʻtaradi.",
              "Javoblar rasmga qarab asoslanadi.",
            ],
          },
          {
            title: "4-mashq: guruhlarda mimika oʻyini",
            minutes: 18,
            points: [
              "Bir oʻquvchi harakat qiladi (draw, sit, stand on one leg).",
              "Guruh Are you …ing? savoli bilan topadi.",
              "Har guruh kamida 4 ta harakatni oʻynaydi.",
            ],
          },
          {
            title: "Yozma mashq: 3 ta gap",
            minutes: 10,
            points: [
              "Doskada namuna gap yoziladi: I am sitting.",
              "Har oʻquvchi sinfdoshlari haqida 3 ta gap yozadi.",
              "Ustoz yurib, yordamchi feʼlni tekshiradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Bir nechta oʻquvchi gapini oʻqib beradi.",
              "WB 45 vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 45: Present continuous boʻyicha 2 ta mashq.",
          "Uyda oila aʼzosini chizib, u nima qilayotganini bitta gap bilan yozib kelish.",
        ],
        ustozga: "Bolalar yordamchi feʼlni tushirib qoldiradi (He playing) — kartochkali oʻyinni har darsda 2 daqiqa takrorlang. -ing imlosida sitting va running kabi undosh ikkilanishini alohida koʻrsating.",
      },
      {
        focus: "Uy ishlari va hikoya",
        sb: "64–65",
        maqsad: [
          "Oʻquvchilar uy ishlari iboralarini harakat bilan koʻrsatib ayta oladilar.",
          "Oʻquvchilar hikoyani rollarda oʻqib, sahnalashtira oladilar.",
          "Oʻquvchilar shablon asosida 3–4 gapli blog yoza oladilar.",
        ],
        lugat: [
          "carry the shopping – xaridni koʻtarib bermoq",
          "clean the bath – vannani tozalamoq",
          "do the washing-up – idish yuvmoq",
          "feed the cat – mushukni boqmoq",
          "make your bed – karavotni yigʻishtirmoq",
          "tidy your room – xonani yigʻishtirmoq",
          "walk the dog – itni sayr qildirmoq",
          "help – yordam bermoq",
        ],
        resurslar: [
          "SB 64–65 va WB 46",
          "Audio 88, 89, 90",
          "Uy ishlari rasm kartochkalari",
          "Blog shabloni (chop etilgan) va doska",
        ],
        blocks: [
          {
            title: "Warm-up: uy ishlari mimikasi (TPR)",
            minutes: 10,
            points: [
              "Ustoz iborani aytadi, sinf harakatni bajaradi.",
              "Keyin oʻquvchilar navbat bilan buyruq beradi.",
            ],
          },
          {
            title: "Vocabulary: Jobs around the house (1-mashq, audio 88)",
            minutes: 12,
            points: [
              "Rasm kartochkalari bilan iboralar tanishtiriladi.",
              "Audio 88 eshittiriladi va xor bilan takrorlanadi.",
              "1-mashq kitobda bajariladi.",
            ],
          },
          {
            title: "Reading: hikoya (2-mashq, audio 89)",
            minutes: 15,
            points: [
              "Rasmlarga qarab voqea taxmin qilinadi.",
              "Matn audio 89 bilan eshitiladi, keyin rollarda oʻqiladi.",
              "2-mashq birga bajariladi.",
            ],
          },
          {
            title: "Pronunciation (3-mashq, audio 90)",
            minutes: 10,
            points: [
              "Audio 90 eshittiriladi.",
              "Yes / No savollari ohangi qoʻl harakati bilan mashq qilinadi.",
            ],
          },
          {
            title: "Grammar: Present continuous questions (1–2-mashqlar)",
            minutes: 15,
            points: [
              "Doskada savol tartibi rangli koʻrsatiladi.",
              "1–2-mashqlar ustoz bilan birga bajariladi.",
              "Juftlikda rasm boʻyicha savol-javob oʻtkaziladi.",
            ],
          },
          {
            title: "5-mashq: hikoyani sahnalashtirish",
            minutes: 15,
            points: [
              "Kichik guruhlarga rollar taqsimlanadi.",
              "Guruhlar 5 daqiqa mashq qilib, keyin sinfga koʻrsatadi.",
              "Sinf har guruhga qarsak bilan baho beradi.",
            ],
          },
          {
            title: "Writing: blog va yakun",
            minutes: 13,
            points: [
              "Shablon tarqatiladi, birinchi gap doskada birga yoziladi.",
              "Har oʻquvchi 3–4 gap yozadi.",
              "Ikki oʻquvchi oʻqib beradi; WB 46 vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 46: uy ishlari boʻyicha mashqlar.",
          "Uyda qilgan yordami haqida 2 ta gap yozib kelish.",
        ],
        ustozga: "Sahnalashtirish uchun vaqtni qatʼiy belgilang (5 daqiqa mashq, 10 daqiqa koʻrsatuv). Uy ishlari iboralarida the va your artikllari tushib qolmasligiga eʼtibor bering.",
      },
      {
        focus: "Culture: Youth clubs in the UK",
        sb: "66–67 (Culture)",
        maqsad: [
          "Oʻquvchilar yoshlar klubi haqidagi matndan ismlar va mashgʻulotlarni topa oladilar.",
          "Oʻquvchilar I like … bilan oʻz qiziqishini ayta oladilar.",
          "Oʻquvchilar orzudagi klub uchun plakat tayyorlay oladilar.",
        ],
        lugat: [
          "youth club – yoshlar klubi",
          "member – aʼzo",
          "activity – mashgʻulot",
          "meet – uchrashmoq",
          "friend – doʻst",
          "play – oʻynamoq",
          "every week – har hafta",
          "fun – qiziqarli",
        ],
        resurslar: [
          "SB 66–67 (Culture)",
          "Audio 91, 92",
          "Culture video 09 va proyektor",
          "Plakat qogʻozi, rangli qalam va yopishtiruvchi",
        ],
        blocks: [
          {
            title: "Warm-up (1-mashq)",
            minutes: 10,
            points: [
              "Savollar rasmlar yordamida beriladi: darsdan keyin nima qilasan?",
              "Oʻquvchilar javoblarini harakat bilan koʻrsatadi.",
            ],
          },
          {
            title: "Reading: blog (2–3-mashqlar, audio 91)",
            minutes: 15,
            points: [
              "Matn audio 91 bilan qismlab oʻqiladi.",
              "Ismlarni topish oʻyini: ustoz mashgʻulotni aytadi, oʻquvchilar ismni topadi.",
              "2–3-mashqlar birga bajariladi.",
            ],
          },
          {
            title: "4–5-mashqlar: faoliyatlar va I like …",
            minutes: 13,
            points: [
              "4-mashq bajariladi va javoblar tekshiriladi.",
              "5-mashq: har oʻquvchi I like … bilan 2 ta gap aytadi.",
            ],
          },
          {
            title: "Culture video 09",
            minutes: 10,
            points: [
              "Video koʻrsatiladi.",
              "Oʻquvchilar koʻrgan 3 ta mashgʻulotni sanab beradi.",
            ],
          },
          {
            title: "Listening (6-mashq, audio 92)",
            minutes: 12,
            points: [
              "Savollar oldindan koʻrib chiqiladi.",
              "Audio 92 ikki marta, pauzalar bilan eshittiriladi.",
              "Javoblar birga tekshiriladi.",
            ],
          },
          {
            title: "Project: orzudagi klub plakati",
            minutes: 20,
            points: [
              "Guruhlar plakatga klub nomi, kunlari va mashgʻulotlarini yozib chizadi.",
              "Ustoz doskaga foydali iboralarni yozib qoʻyadi (We play …, We meet on …).",
              "Har guruh plakatini koʻtarib bitta gap aytadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Dars soʻzlari tezkor takrorlanadi.",
              "Yakuniy test uchun takrorlash rejasi sodda tilda tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Plakatni uyda tugatib bezash.",
          "Yakuniy test uchun Unit 6–10 soʻzlarini kartochkalar bilan takrorlash.",
        ],
        ustozga: "Plakat ishida yozuvga vaqt qolishi uchun taymer qoʻying (12 daqiqa rasm, 8 daqiqa yozuv). Test haqida gapirganda bolalarni qoʻrqitmang — uni oʻyin va yulduzchalar bilan bogʻlab tushuntiring.",
      },
      {
        focus: "End-of-level test (K1)",
        sb: "—",
        maqsad: [
          "Oʻquvchilar Unit 1–10 lugʻati va grammatikasini oʻyinli test formatida koʻrsata oladilar.",
          "Oʻquvchilar qisqa audio va rasmli matn boʻyicha topshiriqlarni bajara oladilar.",
          "Oʻquvchilar ustoz bilan qisqa suhbatda oʻzi va oilasi haqida gapira oladilar.",
        ],
        lugat: [
          "test – test",
          "answer – javob",
          "question – savol",
          "match – moslamoq",
          "colour – boʻyamoq, rang",
          "circle – aylana chizmoq",
          "yes – ha",
          "no – yoʻq",
        ],
        resurslar: [
          "Markaz testi: Unit 1–10 (asosan Unit 6–10) boʻyicha rasmli topshiriqlar",
          "Test audiosi va kolonka",
          "Flashcardlar va sevimli qoʻshiq",
          "Rangli qalam va yulduzcha stikerlar",
        ],
        blocks: [
          {
            title: "Warm-up: flashcard va qoʻshiq",
            minutes: 10,
            points: [
              "Sevimli qoʻshiq birga aytiladi.",
              "Unit 6–10 flashcardlari tezkor takrorlanadi.",
            ],
          },
          {
            title: "Test topshiriq turlarini namuna bilan koʻrsatish",
            minutes: 10,
            points: [
              "Har topshiriq turi doskada bitta namuna bilan koʻrsatiladi (moslash, boʻyash, tanlash).",
              "Oʻquvchilar namunani birga bajaradi.",
            ],
          },
          {
            title: "Yozma qism: lugʻat va grammatika",
            minutes: 20,
            points: [
              "Rasmli moslash, boʻyash va toʻgʻri soʻzni tanlash topshiriqlari bajariladi.",
              "Ustoz aylanib yuradi, faqat topshiriqni tushuntiradi, javob bermaydi.",
            ],
          },
          {
            title: "Listening qismi",
            minutes: 12,
            points: [
              "Audio ikki marta, pauzalar bilan qoʻyiladi.",
              "Oʻquvchilar yes / no va moslash topshiriqlarini bajaradi.",
            ],
          },
          {
            title: "Reading qismi",
            minutes: 12,
            points: [
              "Rasmli matn boʻyicha sodda savollar mustaqil bajariladi.",
              "Ustoz vaqt qolganini oʻquvchilarga eslatib turadi.",
            ],
          },
          {
            title: "Speaking: ustoz bilan yakkama-yakka",
            minutes: 16,
            points: [
              "Qolgan oʻquvchilar rasm chizish yoki oʻyin kartochkalari bilan band boʻladi.",
              "Har oʻquvchi ustoz bilan oʻzi, oilasi va buyumlari haqida 4–5 savolga javob beradi.",
              "Ustoz javoblarni qisqa jadvalga belgilaydi.",
            ],
          },
          {
            title: "Yakun: natijalar va maslahat",
            minutes: 10,
            points: [
              "Natijalar oʻyin shaklida tahlil qilinadi, javoblar birga tekshiriladi.",
              "Har oʻquvchiga yulduzcha va bitta aniq maslahat beriladi.",
            ],
          },
        ],
        uyga: [
          "Sevimli chant yoki qoʻshiqni oila oldida aytib berish.",
          "WB dagi bajarilmagan mashqlarni tugatish.",
        ],
        ustozga: "Kichik yoshdagilar test soʻzidan hayiqadi — uni oʻyin va yulduzchalar bilan bogʻlang, vaqtni qatʼiy oʻlchamang. Speaking qismini boshqa bolalar chizish bilan band boʻlgan paytda oʻtkazsangiz, hamma ulguradi.",
      },
    ],
  },
];
