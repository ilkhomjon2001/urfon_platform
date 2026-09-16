// Cambridge Prepare 2nd edition, Level 1 (A1) — Unit 16–20 uchun batafsil darsma-dars rejalar.
// Manba: prepare1.ts dagi mavjud rejalar (sahifa, mashq va audio raqamlari kitobdan olingan).
// Har dars 90 daqiqa; bloklar yigʻindisi aniq 90 boʻlishi shart.
//
// Mualliflik huquqi: kitobdan matn, dialog, audioskript va javoblar koʻchirilmagan —
// faqat sahifa / mashq / audio raqamlariga havola qilinadi va topshiriq oʻz soʻzimiz bilan bayon etilgan.

import type { PlanUnit } from "./types.js";

export const UNITS_16_20: PlanUnit[] = [
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
      {
        focus: "Xarid roʻyxati: need va want",
        sb: "94–95",
        maqsad: [
          "Oʻquvchilar xarid va doʻkon soʻzlarini tanib, nima sotib olmoqchi ekanini ayta oladilar.",
          "Oʻquvchilar need va want feʼllarini ot bilan va to + feʼl bilan toʻgʻri qoʻllay oladilar.",
          "Oʻquvchilar qisqa audio suhbatdan kerakli buyum va doʻkon nomini ajratib ola oladilar.",
        ],
        lugat: [
          "birthday card – tugʻilgan kun tabrignomasi",
          "diary – kundalik daftar",
          "paint – boʻyoq",
          "scissors – qaychi",
          "stamps – pochta markalari",
          "sweets – shirinliklar",
          "rucksack – ryukzak",
          "toothbrush – tish choʻtkasi",
          "need – kerak boʻlmoq",
          "want – xohlamoq",
        ],
        resurslar: ["SB 94–95", "WB 68–69", "audio 130, 131, 132", "xarid buyumlari flashcardlari", "doska va marker"],
        blocks: [
          {
            title: "Warm-up va oʻtgan darsni takrorlash",
            minutes: 10,
            points: [
              "About you savollari bilan boshlanadi: xarid qilishni yoqtirasizmi, kim bilan borasiz, nega?",
              "Oʻtgan unitdagi kiyim va shahar soʻzlaridan 8 tasi tez soʻrov tarzida takrorlanadi.",
              "Ustoz doska oʻrtasiga SHOPPING soʻzini yozib, oʻquvchilar bilgan doʻkon nomlarini yigʻadi.",
            ],
          },
          {
            title: "Vocabulary: Shopping taqdimoti",
            minutes: 18,
            points: [
              "1-mashq (audio 130) tinglanadi, soʻzlar rasmlar bilan moslanadi va xorda takrorlanadi.",
              "Ustoz flashcardlarni doskaga ilib, har biriga narx yorligʻi qoʻyadi va soʻzlarni talaffuz bilan mustahkamlaydi.",
              "Oʻquvchilar daftarga 8 ta yangi soʻzni oʻzbekcha maʼnosi bilan koʻchiradilar.",
            ],
          },
          {
            title: "Listening: kimga nima kerak",
            minutes: 15,
            points: [
              "2-mashq (audio 131) birinchi marta umumiy tushunish uchun tinglanadi.",
              "3-mashq uchun audio ikkinchi marta qoʻyiladi, oʻquvchilar javoblarni belgilaydilar.",
              "Javoblar juftlikda solishtiriladi, keyin sinf bilan tekshiriladi.",
            ],
          },
          {
            title: "Grammar: need va want",
            minutes: 20,
            points: [
              "1–3-mashqlar orqali need va want shakllari aniqlanadi (Grammar reference SB 153).",
              "Ustoz doskada ikki ustun tuzadi: need / want + ot va need / want + to + feʼl.",
              "4–6-mashqlar yakka bajariladi, keyin javoblar juftlikda tekshiriladi.",
              "Ustoz maʼno farqini soʻraydi: nima haqiqatan kerak, nima shunchaki xohish.",
            ],
          },
          {
            title: "Listening va Speaking: qaysi doʻkon kerak",
            minutes: 17,
            points: [
              "7-mashq (audio 132) tinglanadi, buyum va doʻkon moslanadi.",
              "8-mashq: juftlikda tadbir tanlanadi (tugʻilgan kun, piknik, sayohat) va unga nima kerakligi muhokama qilinadi.",
              "Har juftlik roʻyxatini sinfga aytadi, sinf need yoki want ekanini baholaydi.",
            ],
          },
          {
            title: "Yakun, baholash va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz 5 ta soʻzni oʻzbekchadan inglizchaga tez soʻrash orqali tekshiradi.",
              "Har oʻquvchi bitta I need … va bitta I want … gapi aytib chiqadi.",
              "Uy vazifasi tushuntiriladi va daftarga yozib olinadi.",
            ],
          },
        ],
        uyga: [
          "WB 68–69: Shopping, Listening va Grammar (need, want) mashqlari.",
          "Kelgusi hafta uchun oʻzingizga kerak boʻlgan 5 ta narsani I need … koʻrinishida yozing.",
        ],
        ustozga: "need va want koʻpincha aralashtiriladi — oʻquvchilar barcha xohishga need deyishadi; maʼno farqini hayotiy misol bilan ajrating. want to + feʼl shaklida to tushib qolishi tez uchraydigan xato.",
      },
      {
        focus: "Pul, narxlar va too + sifat",
        sb: "96–97",
        maqsad: [
          "Oʻquvchilar narxlarni ingliz tilida ayta va tinglab yoza oladilar.",
          "Oʻquvchilar too + sifat bilan nima uchun biror narsani olmasligini tushuntira oladilar.",
          "Oʻquvchilar doʻkonda xarid dialogini yozib, juftlikda ijro eta oladilar.",
        ],
        lugat: [
          "pound – funt (Britaniya puli)",
          "euro – yevro",
          "dollar – dollar",
          "price – narx",
          "buy – sotib olmoq",
          "pay – toʻlamoq",
          "expensive – qimmat",
          "cheap – arzon",
          "too big – juda katta",
          "umbrella – soyabon",
        ],
        resurslar: ["SB 96–97", "WB 70–71", "audio 133, 134, 135", "narx kartochkalari va oʻyin pullari", "proyektor"],
        blocks: [
          {
            title: "Warm-up: How much is it?",
            minutes: 10,
            points: [
              "Narx kartochkalari bilan auksion oʻyini oʻtkaziladi: ustoz buyumni koʻrsatadi, oʻquvchilar narx taklif qiladilar.",
              "Oʻtgan darsdagi need va want dan 5 ta gap tez takrorlanadi.",
            ],
          },
          {
            title: "Reading: Money and prices",
            minutes: 18,
            points: [
              "1–2-mashqlar (audio 133) bilan matn oʻqiladi va asosiy maʼlumot topiladi.",
              "3-mashq (audio 134): narxlar tinglab takrorlanadi, ustoz pound, euro, dollar oʻqilishini alohida mashq qildiradi.",
              "Oʻquvchilar 5 ta narxni ustoz aytishi boʻyicha daftarga yozadilar va juftlikda tekshiradilar.",
            ],
          },
          {
            title: "Vocabulary: valyuta, buy va pay",
            minutes: 15,
            points: [
              "4–5-mashqlar: valyuta belgilari va narxni topish oʻyini bajariladi.",
              "6-mashq: buy va pay feʼllari farqi misollar bilan aniqlanadi.",
              "Ustoz doskada buy something / pay for something modelini yozadi, oʻquvchilar 3 tadan gap tuzadilar.",
            ],
          },
          {
            title: "Grammar: too + adjective",
            minutes: 17,
            points: [
              "1–2-mashqlar orqali too ning maʼnosi aniqlanadi (Grammar reference SB 153).",
              "Ustoz kiyim rasmlari bilan too big, too small, too expensive modelini koʻrsatadi.",
              "3–4-mashqlar yakka bajariladi, javoblar sinf bilan tekshiriladi.",
              "Ustoz very va too farqini qisqa misollar bilan ajratadi.",
            ],
          },
          {
            title: "Pronunciation va Writing: xarid dialogi",
            minutes: 20,
            points: [
              "7-mashq (audio 135): /ʃ/ va /s/ tovushlari farqlanadi, minimal juftliklar takrorlanadi.",
              "Writing 1-mashq: juftlikda doʻkonda xarid dialogi yoziladi (salomlashish, narx soʻrash, too bilan rad javobi, xarid).",
              "Ikki juftlik oʻzaro dialogini oʻqib beradi va bir-birini baholaydi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Eng yaxshi ikki dialog sinf oldida ijro etiladi.",
              "Ustoz umumiy xatolarni doskada tuzatadi (ayniqsa too va narx oʻqilishi).",
              "Uy vazifasi beriladi va yoziladi.",
            ],
          },
        ],
        uyga: [
          "WB 70–71: Money and prices, Reading, Grammar (too) va Writing mashqlari.",
          "Oʻz dialogingizni toza koʻchirib, 6–8 gapga yetkazing.",
        ],
        ustozga: "Narxlarni oʻqish (masalan pound va pence birga aytilishi) oʻquvchilarga qiyin boʻladi — bir necha marta xorda takrorlating. too ni very oʻrnida ishlatish eng koʻp uchraydigan xato.",
      },
      {
        focus: "Life Skills: Looking after our world",
        sb: "98–99 (Life Skills)",
        maqsad: [
          "Oʻquvchilar eski kiyim va buyumlarni qayta ishlatish haqidagi matnni tushuna oladilar.",
          "Oʻquvchilar reuse, repair, exchange, throw away iboralarini oʻz nutqida qoʻllay oladilar.",
          "Oʻquvchilar guruhda atrof-muhitni asrash boʻyicha taqdimot rejalashtira oladilar.",
        ],
        lugat: [
          "reuse – qayta ishlatmoq",
          "repair – taʼmirlamoq",
          "exchange – almashtirmoq",
          "throw away – tashlab yubormoq",
          "second-hand – ishlatilgan, ikkinchi qoʻl",
          "rubbish – axlat",
          "clothes – kiyim-kechak",
          "world – dunyo",
          "look after – gʻamxoʻrlik qilmoq",
          "useful – foydali",
        ],
        resurslar: ["SB 98–99 (Life Skills)", "audio 136, 137", "eski kiyim yoki buyum rasmlari", "guruh ishi uchun katta qogʻoz va marker", "proyektor"],
        blocks: [
          {
            title: "Warm-up: eski narsalar bilan nima qilamiz",
            minutes: 10,
            points: [
              "1–2-mashqlar muhokama qilinadi: kichkina boʻlib qolgan kiyimlar bilan nima qilinadi?",
              "Ustoz doskaga oʻquvchilar aytgan gʻoyalarni yozib, mavzuga kirish qiladi.",
            ],
          },
          {
            title: "Reading: qayta ishlatish haqidagi maqola",
            minutes: 18,
            points: [
              "3-mashq (audio 136): matn birinchi marta umumiy mazmun uchun oʻqiladi.",
              "4-mashq: batafsil savollarga javob topiladi, oʻquvchilar matndan dalil koʻrsatadilar.",
              "Notanish soʻzlar kontekstdan taxmin qilinadi, ustoz faqat tasdiqlaydi.",
            ],
          },
          {
            title: "Vocabulary: reuse, repair, exchange, throw away",
            minutes: 15,
            points: [
              "5–6-mashqlar bajariladi, iboralar rasm va vaziyat bilan moslanadi.",
              "Ustoz har ibora uchun bitta misol gap beradi, oʻquvchilar oʻz misolini tuzadilar.",
              "Tez oʻyin: ustoz vaziyat aytadi, oʻquvchilar mos iborani baland aytadilar.",
            ],
          },
          {
            title: "Listening va Useful language",
            minutes: 17,
            points: [
              "7–8-mashqlar (audio 137) tinglanadi va javoblar belgilanadi.",
              "9-mashq bilan tafsilotlar tekshiriladi.",
              "10-mashq: Useful language iboralari koʻrib chiqiladi va juftlikda qisqa muhokamada qoʻllanadi.",
            ],
          },
          {
            title: "Project: Look after our world taqdimoti",
            minutes: 20,
            points: [
              "Sinf 3–4 kishilik guruhlarga boʻlinadi.",
              "Har guruh uy va maktabdagi eski narsalardan foydalanish boʻyicha 4 ta gʻoya tanlaydi.",
              "Katta qogʻozda taqdimot rejasi tuziladi: sarlavha, gʻoyalar, rasm oʻrinlari, kim nima aytadi.",
              "Ustoz guruhlarni aylanib, Useful language iboralarini ishlatishga undaydi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Har guruh rejasini 1 daqiqada sinfga qisqa tanishtiradi.",
              "Sinf eng amaliy gʻoyani tanlaydi.",
              "Taqdimotni uyda tugatish topshirigʻi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Project: uy va maktabdagi eski narsalardan foydalanish gʻoyalari bilan taqdimotni rasmlar bilan tugatish.",
          "Taqdimotda aytadigan 4–5 gapni yozib, uyda ovoz chiqarib mashq qiling.",
        ],
        ustozga: "Project vaqtida oʻquvchilar ona tiliga oʻtib ketishadi — guruhlarga Useful language iboralari yozilgan kartochka tarqating. throw away kabi phrasal verb larda away ni tushirib qoldirish tez uchraydigan xato.",
      },
      {
        focus: "Review 4 (Unit 13–16) — barcha koʻnikmalar",
        sb: "100–101 (Review 4)",
        maqsad: [
          "Oʻquvchilar Unit 13–16 lugʻati va grammatikasini takrorlab, mustahkamlay oladilar.",
          "Oʻquvchilar Shall we …? bilan taklif qilib, birgalikda reja tuza oladilar.",
          "Oʻquvchilar qisqa xabarlarni oʻqib tushunib, ota-onasiga note yoza oladilar.",
        ],
        lugat: [
          "Shall we …? – ...aylikmi? (taklif)",
          "price – narx",
          "clothes – kiyim-kechak",
          "shopping list – xarid roʻyxati",
          "note – qisqa xat, eslatma",
          "sweets – shirinliklar",
          "rucksack – ryukzak",
          "too expensive – juda qimmat",
        ],
        resurslar: ["SB 100–101 (Review 4)", "audio 138", "Unit 13–16 flashcardlari", "doska", "yozma ish uchun qogʻoz"],
        blocks: [
          {
            title: "Warm-up: Vocabulary 3-mashq",
            minutes: 10,
            points: [
              "Oʻquvchilar orqa oʻgirib, sherigi nima kiyganini eslab aytadi.",
              "Ustoz 6 ta soʻzni tez soʻrov bilan takrorlaydi.",
            ],
          },
          {
            title: "Grammar takrori",
            minutes: 18,
            points: [
              "1–2-mashqlar yakka bajariladi (koʻplik, need / want, too).",
              "Javoblar juftlikda solishtiriladi, keyin doskada tekshiriladi.",
              "Ustoz koʻp xato boʻlgan qoidani qisqa jadval bilan qayta tushuntiradi.",
            ],
          },
          {
            title: "Vocabulary takrori",
            minutes: 15,
            points: [
              "Vocabulary 1–2-mashqlar bajariladi.",
              "Qiyin soʻzlar roʻyxati tuzilib, doskaga yoziladi.",
              "Tez oʻyin: ustoz taʼrif aytadi, jamoalar soʻzni topadi.",
            ],
          },
          {
            title: "Speaking: kinoga borishdan oldin",
            minutes: 15,
            points: [
              "Speaking 1-mashq: juftlikda Shall we …? bilan taklif va javob mashq qilinadi.",
              "Har juftlik kinoga borishdan oldin nima sotib olishini kelishib oladi.",
              "Ikki juftlik sinf oldida qisqa dialogini koʻrsatadi.",
            ],
          },
          {
            title: "Reading va Listening",
            minutes: 17,
            points: [
              "Reading 1–2-mashqlar: qisqa xabarlar oʻqilib, savollarga javob beriladi.",
              "Listening 1-mashq (audio 138): narxlar tinglab yoziladi.",
              "Javoblar sinf bilan tekshiriladi va qiyin joylar qayta tinglanadi.",
            ],
          },
          {
            title: "Writing va yakun",
            minutes: 15,
            points: [
              "Writing 1-mashq: ota-onaga qisqa note yoziladi (nima kerak, qancha pul, qachon).",
              "Juftlikda almashib oʻqiladi va 2 ta yaxshi jihat aytiladi.",
              "Ustoz Unit 13–16 boʻyicha shaxsiy takrorlash maslahati beradi va uy vazifasini tushuntiradi.",
            ],
          },
        ],
        uyga: [
          "Vocabulary list: Unit 13–16 soʻzlarini takrorlash va Grammar reference (SB 150–153) mashqlari.",
          "Note ni toza koʻchirib, 40–50 soʻzga yetkazing.",
        ],
        ustozga: "Review darsida barcha mashqni ulgurishga urinmang — 1–2 ta mashqni uyga qoldirib, sinfda xato koʻp boʻlgan mavzuni chuqurroq ishlang. Shall we …? dan keyin to qoʻshib yuborish tez uchraydigan xato.",
      },
    ],
    kids: [
      {
        focus: "Doʻkon oʻyini: xarid soʻzlari",
        sb: "94",
        maqsad: [
          "Oʻquvchilar 8 ta xarid buyumini nomlab, rasm bilan moslay oladilar.",
          "Oʻquvchilar qisqa audio roʻyxatdan kerakli buyumlarni belgilay oladilar.",
          "Oʻquvchilar sinf doʻkonida oddiy xarid iboralarini qoʻllay oladilar.",
        ],
        lugat: [
          "birthday card – tugʻilgan kun tabrignomasi",
          "diary – kundalik daftar",
          "paint – boʻyoq",
          "scissors – qaychi",
          "stamps – pochta markalari",
          "sweets – shirinliklar",
          "rucksack – ryukzak",
          "toothbrush – tish choʻtkasi",
        ],
        resurslar: ["SB 94", "WB 68", "audio 130, 131", "xarid buyumlari flashcardlari", "sinf doʻkoni uchun narx yorliqlari"],
        blocks: [
          {
            title: "Warm-up va takrorlash",
            minutes: 10,
            points: [
              "Kiyim soʻzlari flashcard bilan tez takrorlanadi.",
              "Koʻplik shakli oʻyini: ustoz bitta soʻz aytadi, oʻquvchilar koʻpligini baland aytadi.",
            ],
          },
          {
            title: "Yangi soʻzlar taqdimoti",
            minutes: 15,
            points: [
              "1-mashq (audio 130) tinglanadi, soʻzlar rasmlarga moslanadi.",
              "Ustoz har soʻzni flashcard bilan koʻrsatib, xorda 3 marta takrorlatadi.",
              "Sekin-tez oʻyini: ustoz soʻzni sekin yoki tez aytadi, bolalar xuddi shunday takrorlaydi.",
            ],
          },
          {
            title: "Sinf doʻkoni",
            minutes: 15,
            points: [
              "Partaga buyum rasmlari va narx yorliqlari qoʻyiladi.",
              "Bolalar navbat bilan sotuvchi va xaridor boʻladilar: I want a rucksack, please.",
              "Ustoz har juftlikni kuzatib, talaffuzni tuzatadi.",
            ],
          },
          {
            title: "Listening: dadaning roʻyxati",
            minutes: 15,
            points: [
              "2-mashq (audio 131) tinglanadi, rasmlar belgilanadi.",
              "3-mashq uchun audio qayta qoʻyiladi.",
              "Javoblar sinf bilan rasmlarni koʻrsatib tekshiriladi.",
            ],
          },
          {
            title: "Harakatli tanaffus va TPR",
            minutes: 10,
            points: [
              "Ustoz soʻz aytadi, bolalar shu buyumga mos harakat qiladi (qaychi qirqish, tish yuvish, soyabon ochish).",
              "Tez aytilganda xato qilganlar oʻtiradi.",
            ],
          },
          {
            title: "Oʻyin: Shopping list memory",
            minutes: 15,
            points: [
              "Birinchi bola I need some sweets deydi, keyingisi uni takrorlab oʻzinikini qoʻshadi.",
              "Zanjir uzilmaguncha davom etadi, ikki jamoa musobaqalashadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Flashcardlar tez koʻrsatilib, soʻzlar takrorlanadi.",
              "Har bola bitta sevimli buyumini aytadi.",
              "WB topshirigʻi tushuntirilib, kundalikka yoziladi.",
            ],
          },
        ],
        uyga: [
          "WB 68: xarid soʻzlari boʻyicha 1–2 ta mashq.",
          "Uydagi 4 ta narsani rasm bilan chizib, inglizcha nomini yozing.",
        ],
        ustozga: "scissors va sweets har doim koʻplikda ishlatilishini alohida koʻrsating — bolalar a scissor deb xato qiladilar. Flashcardlarni keyingi darsda ham saqlang.",
      },
      {
        focus: "need va want",
        sb: "95",
        maqsad: [
          "Oʻquvchilar I need … va I want … gaplarini toʻgʻri tuza oladilar.",
          "Oʻquvchilar kerak narsa va xohish orasidagi farqni rasm orqali koʻrsata oladilar.",
          "Oʻquvchilar audio asosida buyum va doʻkonni moslay oladilar.",
        ],
        lugat: [
          "need – kerak boʻlmoq",
          "want – xohlamoq",
          "ice cream – muzqaymoq",
          "umbrella – soyabon",
          "toothbrush – tish choʻtkasi",
          "party – ziyofat",
          "shop – doʻkon",
          "buy – sotib olmoq",
        ],
        resurslar: ["SB 95", "WB 69", "audio 132", "need / want rasm kartochkalari", "doska va rangli marker"],
        blocks: [
          {
            title: "Warm-up: oʻtgan darsni takrorlash",
            minutes: 10,
            points: [
              "Xarid soʻzlari flashcard bilan tez takrorlanadi.",
              "Ustoz rasm koʻrsatadi, bolalar I want a … deb gap tuzadilar.",
            ],
          },
          {
            title: "need va want taqdimoti",
            minutes: 15,
            points: [
              "Ustoz ikki rasm koʻrsatadi: yomgʻirda soyabon (need) va muzqaymoq (want).",
              "Doskada ikki rangli ustun tuziladi, bolalar kartochkalarni toʻgʻri ustunga qoʻyadilar.",
              "Model gaplar xorda takrorlanadi.",
            ],
          },
          {
            title: "Grammar mashqlari ustoz bilan",
            minutes: 15,
            points: [
              "1–2-mashqlar butun sinf bilan birga bajariladi.",
              "3–4-mashqlar yakka bajarilib, juftlikda tekshiriladi.",
              "Ustoz qiyin gaplarni doskada birga tuzatadi.",
            ],
          },
          {
            title: "Qoidani birga topish",
            minutes: 10,
            points: [
              "5-mashq: bolalar qoidani oʻzlari toʻldiradilar.",
              "Ustoz need + ot va want + to + feʼl modelini oddiy chizma bilan koʻrsatadi.",
            ],
          },
          {
            title: "Listening: qaysi doʻkon",
            minutes: 15,
            points: [
              "7-mashq (audio 132) tinglanadi, buyum va doʻkon chiziq bilan bogʻlanadi.",
              "Audio ikkinchi marta qoʻyilib, javoblar tekshiriladi.",
            ],
          },
          {
            title: "Guruh ishi: ziyofat roʻyxati",
            minutes: 15,
            points: [
              "8-mashq: kichik guruhlarda ziyofat uchun kerakli narsalar roʻyxati tuziladi.",
              "Har guruh 4 ta band yozadi va sinfga oʻqib beradi.",
              "Sinf har bandni need yoki want deb baholaydi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Tez oʻyin: ustoz narsani aytadi, bolalar need yoki want deb baqiradi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 69: need / want boʻyicha 2 ta mashq.",
          "Ziyofat uchun 3 ta kerakli narsani rasm bilan chizing va I need … deb yozing.",
        ],
        ustozga: "Bolalar want dan keyin to ni tushirib qoldiradilar (I want buy). Har gapda to ni qoʻl harakati bilan koʻrsatib mustahkamlang.",
      },
      {
        focus: "Pul, narxlar va too",
        sb: "96–97",
        maqsad: [
          "Oʻquvchilar narxlarni tinglab tushunib, oddiy narxni ayta oladilar.",
          "Oʻquvchilar too big va too small iboralarini kiyim rasmlari bilan qoʻllay oladilar.",
          "Oʻquvchilar doʻkonda xarid rol oʻyinini bajara oladilar.",
        ],
        lugat: [
          "pound – funt (Britaniya puli)",
          "euro – yevro",
          "dollar – dollar",
          "money – pul",
          "price – narx",
          "too big – juda katta",
          "too small – juda kichik",
          "How much is it? – bu qancha turadi?",
        ],
        resurslar: ["SB 96–97", "WB 70", "audio 133, 134, 135", "oʻyin pullari va narx yorliqlari", "kiyim flashcardlari"],
        blocks: [
          {
            title: "Warm-up: oʻyin pullari bilan sanash",
            minutes: 10,
            points: [
              "Bolalar oʻyin pullarini sanab, 1 dan 20 gacha takrorlaydilar.",
              "Ustoz kichik summalarni koʻrsatadi, bolalar baland aytadilar.",
            ],
          },
          {
            title: "Reading: Money and prices",
            minutes: 15,
            points: [
              "1-mashq (audio 133) tinglanadi va dialoglar rollarda oʻqiladi.",
              "Ustoz har dialogni ikki bolaga oʻqitadi, sinf tinglaydi.",
            ],
          },
          {
            title: "Narxlarni tinglash",
            minutes: 10,
            points: [
              "3-mashq (audio 134): narxlar tinglab takrorlanadi.",
              "Ustoz 5 ta narx aytadi, bolalar doskadagi toʻgʻri yorliqni koʻrsatadi.",
            ],
          },
          {
            title: "Valyuta belgilari",
            minutes: 10,
            points: [
              "4-mashq bajariladi: funt, yevro, dollar belgilari moslanadi.",
              "Bolalar daftarga uchta belgini chizib, nomini yozadilar.",
            ],
          },
          {
            title: "Grammar: too big / too small",
            minutes: 15,
            points: [
              "1–3-mashqlar bajariladi.",
              "Ustoz katta va kichik kiyim rasmlarini koʻrsatib, It is too big / too small modelini beradi.",
              "Bolalar navbat bilan rasm tanlab, too bilan gap tuzadilar.",
            ],
          },
          {
            title: "Pronunciation va rol oʻyini",
            minutes: 20,
            points: [
              "7-mashq (audio 135): /ʃ/ va /s/ tovushlari farqlanadi, shop va sock kabi soʻzlar takrorlanadi.",
              "Writing 1-mashq ogʻzaki bajariladi: juftlikda doʻkon rol oʻyini (salom, narx soʻrash, too bilan rad javobi).",
              "Ikki juftlik sinf oldida koʻrsatadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz 5 ta narx va 3 ta too gapini takrorlatadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 70: narxlar boʻyicha mashqlar.",
          "Rasmli narx roʻyxati tuzing: 4 ta buyum, har biriga narx yozing.",
        ],
        ustozga: "/ʃ/ va /s/ farqi oʻzbek tilida yoʻq emas, lekin bolalar shop ni sop deb aytishi mumkin — ogʻiz shaklini koʻrsatib mashq qildiring. Narxlarni yozishda valyuta belgisini tushirib qoldirish tez uchraydi.",
      },
      {
        focus: "Life Skills: Looking after our world",
        sb: "98–99 (Life Skills)",
        maqsad: [
          "Oʻquvchilar eski narsalarni qayta ishlatish gʻoyasini tushuna oladilar.",
          "Oʻquvchilar reuse, repair, exchange soʻzlarini rasm bilan moslay oladilar.",
          "Oʻquvchilar eski buyumdan yangi narsa yasab, 2 gap bilan tanishtira oladilar.",
        ],
        lugat: [
          "reuse – qayta ishlatmoq",
          "repair – taʼmirlamoq",
          "exchange – almashtirmoq",
          "old – eski",
          "new – yangi",
          "clothes – kiyim-kechak",
          "box – quti",
          "world – dunyo",
        ],
        resurslar: ["SB 98–99 (Life Skills)", "audio 136, 137", "eski quti, paypoq, tugma kabi materiallar", "yelim, qaychi, rangli qogʻoz", "reuse / repair / exchange rasm kartochkalari"],
        blocks: [
          {
            title: "Warm-up va takrorlash",
            minutes: 10,
            points: [
              "Oʻtgan darsdagi narx va too gaplari tez takrorlanadi.",
              "1-mashq: eski kiyimlaring bilan nima qilasan? — bolalar rasm koʻrsatib javob beradilar.",
            ],
          },
          {
            title: "Reading ustoz bilan",
            minutes: 15,
            points: [
              "3-mashq (audio 136) tinglanadi, ustoz matnni qisqartirib, rasmlar bilan tushuntiradi.",
              "Har paragrafdan keyin bitta oddiy savol beriladi.",
            ],
          },
          {
            title: "Right / wrong mashqi",
            minutes: 10,
            points: [
              "4-mashq bajariladi: gaplar right yoki wrong deb belgilanadi.",
              "Bolalar javobini matndan koʻrsatib isbotlaydilar.",
            ],
          },
          {
            title: "Yangi soʻzlar: reuse, repair, exchange",
            minutes: 15,
            points: [
              "5-mashq: rasmlar soʻzlarga moslanadi.",
              "Ustoz har soʻzni harakat bilan koʻrsatadi (taʼmirlash, almashish), bolalar takrorlaydilar.",
              "Kartochka oʻyini: ustoz vaziyat aytadi, bolalar mos kartochkani koʻtaradi.",
            ],
          },
          {
            title: "Listening",
            minutes: 10,
            points: [
              "7-mashq (audio 137) tinglanadi va javoblar belgilanadi.",
              "Audio ikkinchi marta qoʻyilib tekshiriladi.",
            ],
          },
          {
            title: "Project: eski narsadan yangi buyum",
            minutes: 20,
            points: [
              "Bolalar eski quti yoki paypoqdan buyum yasaydilar (qalamdon, qoʻgʻirchoq).",
              "Ustoz aylanib yurib, xavfsizlik qoidalariga rioya qilinishini nazorat qiladi.",
              "Har bola buyumini 2 gap bilan tanishtiradi: This is my … / It is made of an old ….",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Buyumlar sinf burchagiga koʻrgazma qilib qoʻyiladi.",
              "Ustoz eng ijodiy 3 ta ishni maqtaydi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Uyda bitta eski narsani qayta ishlating va rasmini olib keling.",
          "Buyumingiz haqida 2 ta inglizcha gap yozing.",
        ],
        ustozga: "Qaychi va yelim bilan ishlaganda xavfsizlik qoidalarini dars boshida eslatib oʻting. Yasash vaqti choʻzilib ketmasligi uchun taymer qoʻying.",
      },
      {
        focus: "Review 4: lugʻat va grammatika oʻyinlari",
        sb: "100 (Review 4)",
        maqsad: [
          "Oʻquvchilar Unit 13–16 soʻzlarini oʻyin orqali takrorlay oladilar.",
          "Oʻquvchilar koʻplik qoidalarini toʻgʻri qoʻllay oladilar.",
          "Oʻquvchilar rasm boʻyicha shahar va xona buyumlarini nomlay oladilar.",
        ],
        lugat: [
          "clothes – kiyim-kechak",
          "bedroom – yotoqxona",
          "town – shahar",
          "shop – doʻkon",
          "sweets – shirinliklar",
          "scissors – qaychi",
          "umbrella – soyabon",
          "diary – kundalik daftar",
        ],
        resurslar: ["SB 100 (Review 4)", "Unit 13–16 flashcardlari", "doska va ikki jamoa uchun marker", "koʻplik qoidalari uchun uch savat yoki quti"],
        blocks: [
          {
            title: "Warm-up: Board race",
            minutes: 10,
            points: [
              "Sinf ikki jamoaga boʻlinadi.",
              "Ustoz flashcard koʻrsatadi, jamoalardan bittasi soʻzni doskaga yozadi.",
            ],
          },
          {
            title: "Grammar: koʻplik qoidalari",
            minutes: 15,
            points: [
              "1-mashq bajariladi.",
              "Savat oʻyini: uch savatga -s, -es va notoʻgʻri koʻplik yoziladi, bolalar soʻz kartochkalarini toʻgʻri savatga tashlaydilar.",
              "Ustoz xato tushgan kartochkalarni sinf bilan birga tuzatadi.",
            ],
          },
          {
            title: "Vocabulary: rasmdagi shahar",
            minutes: 15,
            points: [
              "Vocabulary 1-mashq bajariladi.",
              "Bolalar rasmda koʻrgan 6 ta joyni sanab aytadilar.",
            ],
          },
          {
            title: "Vocabulary: yotoqxona",
            minutes: 15,
            points: [
              "Vocabulary 2-mashq bajariladi.",
              "Xotira oʻyini: rasm 20 soniya koʻrsatiladi, keyin yopiladi va bolalar eslagan buyumlarni aytadilar.",
            ],
          },
          {
            title: "Harakatli tanaffus",
            minutes: 10,
            points: [
              "Simon says oʻyini kiyim va buyum soʻzlari bilan oʻynaladi.",
              "Xato qilgan bola keyingi bosqichda ustozga yordamchi boʻladi.",
            ],
          },
          {
            title: "Vocabulary 3-mashq: kim nima kiygan",
            minutes: 15,
            points: [
              "Bolalar juftlikda bir-birini kuzatadilar, keyin orqa oʻgirib kiyimini aytadilar.",
              "Ustoz She is wearing … modelini doskada eslatib turadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz 8 ta soʻzni tez soʻrov bilan takrorlaydi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Unit 13–16 dan 10 ta soʻzni rasm bilan lugʻat daftariga yozing.",
          "Yozgan soʻzlaringizdan 3 tasi bilan gap tuzing.",
        ],
        ustozga: "Board race da faqat tez yozganlar emas, toʻgʻri yozganlar ham ragʻbatlantirilsin. Koʻplikda -es qoidasi (boxes, watches) eng koʻp xato beradigan joy.",
      },
      {
        focus: "Review 4: koʻnikmalar va takrorlash oʻyinlari",
        sb: "101 (Review 4)",
        maqsad: [
          "Oʻquvchilar Shall we …? bilan taklif qilib, javob bera oladilar.",
          "Oʻquvchilar audio asosida narxlarni yozib ola oladilar.",
          "Oʻquvchilar shablon yordamida onasiga qisqa note yoza oladilar.",
        ],
        lugat: [
          "Shall we …? – ...aylikmi? (taklif)",
          "cinema – kinoteatr",
          "note – qisqa xat",
          "price – narx",
          "bus – avtobus",
          "sweets – shirinliklar",
          "ticket – chipta",
          "money – pul",
        ],
        resurslar: ["SB 101 (Review 4)", "WB 56–71", "audio 138", "note uchun shablon varaqasi", "kiyim va transport flashcardlari"],
        blocks: [
          {
            title: "Warm-up: Simon says",
            minutes: 10,
            points: [
              "Kiyim va transport soʻzlari bilan Simon says oʻynaladi.",
              "Xato qilganlar keyingi bosqichda ustozga yordam beradi.",
            ],
          },
          {
            title: "Speaking: kinoga borishdan oldin",
            minutes: 15,
            points: [
              "Speaking 1-mashq: juftlikda Shall we …? bilan taklif qilinadi.",
              "Ustoz doskada Yes, good idea. / No, it is too expensive. javob modellarini beradi.",
              "Uch juftlik sinf oldida koʻrsatadi.",
            ],
          },
          {
            title: "Grammar ustoz bilan",
            minutes: 15,
            points: [
              "Grammar 2-mashq butun sinf bilan birga bajariladi.",
              "Har gapdan keyin ustoz qoidani qisqa eslatadi.",
            ],
          },
          {
            title: "Reading: xabarlarni toʻldirish",
            minutes: 15,
            points: [
              "Reading 1-mashq bajariladi.",
              "Bolalar javobini juftlikda solishtiradilar.",
            ],
          },
          {
            title: "Listening: narxlar",
            minutes: 10,
            points: [
              "Listening 1-mashq (audio 138) tinglanadi, narxlar yoziladi.",
              "Audio ikkinchi marta qoʻyilib tekshiriladi.",
            ],
          },
          {
            title: "Writing: onasiga note",
            minutes: 15,
            points: [
              "Writing 1-mashq shablon bilan bajariladi: 2–3 gap.",
              "Ustoz har bolaga yordam berib, imloni tuzatadi.",
              "Ikki bola notini sinfga oʻqib beradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz Unit 13–16 boʻyicha eng yaxshi natijalarni maqtaydi.",
              "Bajarilmagan WB mashqlaridan uy vazifasi belgilanadi.",
            ],
          },
        ],
        uyga: [
          "WB 56–71 dagi bajarilmagan mashqlardan ustoz tanlagan 2–3 tasini tugating.",
          "Note ni toza daftarga koʻchiring va bezang.",
        ],
        ustozga: "Yozma ishda bolalar oʻzbekcha gap tuzilishini koʻchirishadi — shablonni doskada ochiq qoldiring. Shall we …? dan keyin feʼlning asl shakli kelishini eslatib turing.",
      },
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
      {
        focus: "Tabiat soʻzlari, tinglash va -er than",
        sb: "102–103",
        maqsad: [
          "Oʻquvchilar tabiat soʻzlari bilan yashash joyini tasvirlay oladilar.",
          "Oʻquvchilar qisqa sifatlarning qiyosiy darajasini imlo qoidalari bilan toʻgʻri yasay oladilar.",
          "Oʻquvchilar audio asosida uy va joy haqidagi tafsilotlarni tushuna oladilar.",
        ],
        lugat: [
          "beach – plyaj, dengiz boʻyi",
          "countryside – qishloq joy",
          "forest – oʻrmon",
          "garden – bogʻ",
          "river – daryo",
          "sea – dengiz",
          "than – ...ga qaraganda",
          "quiet – tinch, sokin",
          "noisy – shovqinli",
          "modern – zamonaviy",
        ],
        resurslar: ["SB 102–103", "WB 72–73", "audio 140, 141, 142, 143", "tabiat rasmlari yoki slaydlar", "doska va proyektor"],
        blocks: [
          {
            title: "Warm-up va oʻtgan unitni takrorlash",
            minutes: 10,
            points: [
              "About you savollari: shaharda yoki qishloqda yashaysiz, uyingiz qanday?",
              "Unit 16 dan 5 ta soʻz va bitta too gapi tez takrorlanadi.",
              "Ustoz doskada ikki ustun ochadi: city / countryside — oʻquvchilar afzalliklarini aytadilar.",
            ],
          },
          {
            title: "Vocabulary: The natural world",
            minutes: 17,
            points: [
              "1-mashq (audio 140) tinglanadi, soʻzlar rasmlar bilan moslanadi.",
              "2-mashq bajariladi, oʻquvchilar oʻz hududidagi tabiat obyektlarini nomlaydilar.",
              "Ustoz talaffuzga eʼtibor beradi, ayniqsa forest va countryside soʻzlarida.",
            ],
          },
          {
            title: "Listening: Joséning uyi",
            minutes: 18,
            points: [
              "3-mashq (audio 141) umumiy tushunish uchun tinglanadi.",
              "4–5-mashqlar (audio 142) uchun audio qayta qoʻyiladi va tafsilotlar belgilanadi.",
              "Javoblar juftlikda solishtirilib, sinf bilan tekshiriladi.",
            ],
          },
          {
            title: "Grammar: qisqa sifatlar qiyosi",
            minutes: 20,
            points: [
              "1–2-mashqlar orqali -er than qoidasi aniqlanadi (Grammar reference SB 154).",
              "Ustoz doskada imlo qoidalarini jadvalga soladi: -er, -r, undosh ikkilanishi, -y ning -ier ga oʻzgarishi.",
              "3-mashq yakka bajariladi va doskada tekshiriladi.",
              "4-mashq (audio 143): than soʻzining zaif talaffuzi mashq qilinadi.",
            ],
          },
          {
            title: "Speaking: uylarni qiyoslash",
            minutes: 15,
            points: [
              "5-mashq: oʻquvchi oʻz uyini kitobdagi uylar bilan solishtiradi.",
              "6-mashq: juftlikda rasmlar boʻyicha kamida 6 ta qiyosiy gap tuziladi.",
              "Ikki juftlik gaplarini sinfga aytadi, sinf xatolarni topadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz 6 ta sifatni aytadi, oʻquvchilar qiyosiy shaklini baland aytadilar.",
              "Umumiy xatolar doskada tuzatiladi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 72–73: The natural world, Listening va Grammar (comparatives) mashqlari.",
          "Oʻz shahringiz va boshqa shahar haqida 5 ta qiyosiy gap yozing.",
        ],
        ustozga: "Imlo qoidalari (big → bigger, easy → easier) eng koʻp xato beradigan joy — jadvalni doskada dars oxirigacha qoldiring. than oʻrniga that yozib yuborish ham tez uchraydi.",
      },
      {
        focus: "Great days out: more … than va sayohat joyini tanlash",
        sb: "104–105",
        maqsad: [
          "Oʻquvchilar fikr bildiruvchi sifatlar bilan joylarni baholay oladilar.",
          "Oʻquvchilar uzun sifatlarni more … than bilan qiyoslay oladilar.",
          "Oʻquvchilar oilaga mos sayohat joyini tanlab, sabablarini tushuntira oladilar.",
        ],
        lugat: [
          "amazing – hayratlanarli",
          "attractive – koʻrkam, jozibali",
          "exciting – qiziqarli, hayajonli",
          "popular – mashhur",
          "unusual – gʻayrioddiy",
          "wonderful – ajoyib",
          "day out – bir kunlik sayr",
          "interesting – qiziqarli",
          "expensive – qimmat",
          "relaxing – dam beruvchi",
        ],
        resurslar: ["SB 104–105", "WB 74–75", "audio 144, 145", "video 13 (Great places)", "proyektor va sayohat joyi rasmlari"],
        blocks: [
          {
            title: "Warm-up: qaysi joy yoqadi",
            minutes: 10,
            points: [
              "Toʻrtta sayohat joyi rasmi koʻrsatiladi, oʻquvchilar bittasini tanlab sababini aytadilar.",
              "Oʻtgan darsdagi qisqa sifatlar qiyosi 5 ta gap bilan takrorlanadi.",
            ],
          },
          {
            title: "Vocabulary: Adjectives: opinions",
            minutes: 15,
            points: [
              "1-mashq (audio 144) tinglanadi, sifatlar maʼnosi aniqlanadi.",
              "Ustoz sifatlarni ijobiy va neytral guruhlarga ajratadi.",
              "Oʻquvchilar har sifat uchun bitta joy nomi aytadilar.",
            ],
          },
          {
            title: "Reading: Great days out",
            minutes: 18,
            points: [
              "2-mashq (audio 145): matn umumiy mazmun uchun oʻqiladi.",
              "3–4-mashqlar bilan tafsilotlar topiladi, oʻquvchilar javobni matndan koʻrsatadilar.",
              "Notanish soʻzlar kontekstdan taxmin qilinadi.",
            ],
          },
          {
            title: "Talking points va video",
            minutes: 12,
            points: [
              "Video 13 (Great places) koʻriladi.",
              "Talking points savollari juftlikda muhokama qilinadi.",
              "Ikki juftlik fikrini sinfga aytadi.",
            ],
          },
          {
            title: "Grammar: more … than",
            minutes: 20,
            points: [
              "1–2-mashqlar orqali uzun sifatlar qoidasi aniqlanadi.",
              "Ustoz doskada ikki ustun tuzadi: qisqa sifat (-er than) va uzun sifat (more … than).",
              "3–4-mashqlar yakka bajarilib, juftlikda tekshiriladi.",
              "5-mashq: toʻrt oila uchun eng mos joy tanlanadi va sabab aytiladi.",
            ],
          },
          {
            title: "Speaking va yakun",
            minutes: 15,
            points: [
              "Speaking 1–2-mashqlar: juftlikda oilaviy sayohat joyi tanlanadi.",
              "Har juftlik joyni sinfga tanishtiradi va kamida 3 ta qiyosiy gap ishlatadi.",
              "Ustoz umumiy xatolarni tuzatib, uy vazifasini beradi.",
            ],
          },
        ],
        uyga: [
          "WB 74–75: Adjectives: opinions, Reading, Grammar va Writing mashqlari.",
          "Sevimli sayohat joyingiz haqida 50–60 soʻzli matn yozing va uni boshqa joy bilan qiyoslang.",
        ],
        ustozga: "Oʻquvchilar more bilan -er ni birga ishlatishadi (more bigger) — bu eng tipik xato, doskada qizil bilan belgilab qoʻying. good → better istisnosini ham eslatib oʻting.",
      },
    ],
    kids: [
      {
        focus: "Tabiat soʻzlari",
        sb: "102",
        maqsad: [
          "Oʻquvchilar 6 ta tabiat soʻzini tanib, rasm bilan moslay oladilar.",
          "Oʻquvchilar qayerda yashashni xohlashini oddiy gap bilan ayta oladilar.",
          "Oʻquvchilar qisqa audiodan asosiy maʼlumotni tushuna oladilar.",
        ],
        lugat: [
          "beach – plyaj, dengiz boʻyi",
          "countryside – qishloq joy",
          "forest – oʻrmon",
          "garden – bogʻ",
          "river – daryo",
          "sea – dengiz",
          "house – uy",
          "big – katta",
        ],
        resurslar: ["SB 102", "WB 72", "audio 140, 141", "tabiat rasm kartochkalari", "doska"],
        blocks: [
          {
            title: "Warm-up va takrorlash",
            minutes: 10,
            points: [
              "Unit 16 dagi doʻkon soʻzlari va narxlar tez takrorlanadi.",
              "Ustoz 4 ta narx aytadi, bolalar yozadilar.",
            ],
          },
          {
            title: "Yangi soʻzlar taqdimoti",
            minutes: 15,
            points: [
              "1-mashq (audio 140) tinglanadi va soʻzlar rasmlarga moslanadi.",
              "Ustoz har soʻzni kartochka bilan koʻrsatib, xorda takrorlatadi.",
              "2-mashq bajariladi.",
            ],
          },
          {
            title: "Oʻyin: Guess the picture",
            minutes: 15,
            points: [
              "Ustoz rasmni sekin ochadi, bolalar soʻzni topadilar.",
              "Keyin bolalar navbat bilan yetakchi boʻladi.",
            ],
          },
          {
            title: "Listening",
            minutes: 15,
            points: [
              "3-mashq (audio 141) tinglanadi.",
              "Savollarga butun sinf bilan birga javob beriladi.",
              "Audio ikkinchi marta qoʻyilib tekshiriladi.",
            ],
          },
          {
            title: "Harakatli tanaffus",
            minutes: 10,
            points: [
              "TPR: ustoz sea deganda suzish, forest deganda daraxt boʻlish kabi harakatlar bajariladi.",
              "Keyin bolalar navbat bilan buyruq beradi, sinf harakatni bajaradi.",
            ],
          },
          {
            title: "Qaysi uyda yashashni xohlaysan",
            minutes: 15,
            points: [
              "5–6-mashqlar: rasmlardagi uylar koʻrib chiqiladi.",
              "Har bola I want to live in … deb bitta gap aytadi va sababini oddiy soʻz bilan qoʻshadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Kartochkalar tez koʻrsatilib, soʻzlar takrorlanadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 72: tabiat soʻzlari boʻyicha 1–2 ta mashq.",
          "Oʻzingiz yashamoqchi boʻlgan joyni chizib, inglizcha nomini yozing.",
        ],
        ustozga: "countryside uzun soʻz — boʻgʻinlarga ajratib (country + side) oʻrgating. Bolalar sea va see ni aralashtirishi mumkin, rasm bilan farqlang.",
      },
      {
        focus: "bigger, smaller, older",
        sb: "103",
        maqsad: [
          "Oʻquvchilar qisqa sifatlarga -er qoʻshib qiyoslay oladilar.",
          "Oʻquvchilar than soʻzini toʻgʻri talaffuz qila oladilar.",
          "Oʻquvchilar rasmlar boʻyicha juftlikda qiyosiy gap tuza oladilar.",
        ],
        lugat: [
          "big – bigger – katta – kattaroq",
          "small – smaller – kichik – kichikroq",
          "old – older – eski, keksa – eskiroq",
          "young – younger – yosh – yoshroq",
          "tall – taller – boʻyi baland – balandroq",
          "long – longer – uzun – uzunroq",
          "than – ...ga qaraganda",
          "new – newer – yangi – yangiroq",
        ],
        resurslar: ["SB 103", "WB 73", "audio 143", "rangli imlo qoidasi kartochkalari", "qiyoslash uchun turli oʻlchamdagi buyumlar"],
        blocks: [
          {
            title: "Warm-up: taller than oʻyini",
            minutes: 10,
            points: [
              "Bolalar boʻyi boʻyicha saflanadilar.",
              "Har bola yonidagiga qarab I am taller than … yoki I am shorter than … deb aytadi.",
            ],
          },
          {
            title: "Grammar taqdimoti",
            minutes: 15,
            points: [
              "Ustoz ikki qalam yoki ikki kitobni solishtirib, This one is bigger than that one modelini beradi.",
              "1-mashq butun sinf bilan bajariladi.",
              "Model gap xorda takrorlanadi.",
            ],
          },
          {
            title: "Imlo qoidalari kartochkalar bilan",
            minutes: 15,
            points: [
              "Rangli kartochkalarda uch qoida koʻrsatiladi: faqat -er, undosh ikkilanishi, -y → -ier.",
              "Bolalar soʻz kartochkalarini toʻgʻri rangga qoʻyadilar.",
              "2-mashq bajariladi.",
            ],
          },
          {
            title: "Pronunciation: than",
            minutes: 10,
            points: [
              "4-mashq (audio 143) tinglanadi va takrorlanadi.",
              "Ustoz than ning sekin va tez talaffuzini qiyoslab koʻrsatadi.",
            ],
          },
          {
            title: "Harakatli tanaffus",
            minutes: 10,
            points: [
              "Ustoz ikki narsani aytadi, bolalar kattarogʻi tomonga yuguradi yoki qoʻl koʻtaradi.",
              "Har turdan keyin bitta bola nima uchun shunday tanlaganini qiyosiy gap bilan aytadi.",
            ],
          },
          {
            title: "Juftlikda qiyoslash",
            minutes: 20,
            points: [
              "3-mashq yakka bajariladi va tekshiriladi.",
              "6-mashq: juftlikda rasmlar boʻyicha kamida 5 ta gap tuziladi.",
              "Ustoz aylanib yurib, -er va than ishlatilishini nazorat qiladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz 6 ta sifatni aytadi, bolalar qiyosiy shaklini xorda aytadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 73: comparatives boʻyicha 2 ta mashq.",
          "Oila aʼzolaringizni qiyoslab 3 ta gap yozing (masalan boʻy va yosh boʻyicha).",
        ],
        ustozga: "Bolalar than ni tushirib qoldiradilar (My bag is bigger.) — har gapda than ni barmoq bilan sanatib mustahkamlang. bigger da g ning ikkilanishi alohida mashq talab qiladi.",
      },
      {
        focus: "Qiziq joylar va more … than",
        sb: "104–105",
        maqsad: [
          "Oʻquvchilar fikr bildiruvchi sifatlarni tanib, joylarni baholay oladilar.",
          "Oʻquvchilar uzun sifatlarni more … than bilan qiyoslay oladilar.",
          "Oʻquvchilar bitta sayohat joyini 3 ta gap bilan tanishtira oladilar.",
        ],
        lugat: [
          "amazing – hayratlanarli",
          "exciting – qiziqarli, hayajonli",
          "popular – mashhur",
          "unusual – gʻayrioddiy",
          "wonderful – ajoyib",
          "attractive – koʻrkam",
          "more … than – ...ga qaraganda koʻproq ...",
          "place – joy",
        ],
        resurslar: ["SB 104–105", "WB 74", "audio 144, 145", "video 13", "sifat kartochkalari va yuz ifodasi rasmlari"],
        blocks: [
          {
            title: "Warm-up: sifat kartochkalari",
            minutes: 10,
            points: [
              "amazing, exciting, popular kartochkalari koʻrsatiladi, bolalar mos yuz ifodasini koʻrsatadilar.",
              "Oʻtgan darsdagi -er than dan 4 ta gap takrorlanadi.",
            ],
          },
          {
            title: "Vocabulary: Adjectives: opinions",
            minutes: 15,
            points: [
              "1-mashq (audio 144) tinglanadi va soʻzlar maʼnosi aniqlanadi.",
              "Bolalar har sifat uchun bitta joy yoki narsa aytadilar.",
              "Xorda takrorlash bilan talaffuz mustahkamlanadi.",
            ],
          },
          {
            title: "Reading ustoz bilan",
            minutes: 15,
            points: [
              "2-mashq (audio 145) qismlab oʻqiladi, ustoz har qismdan keyin rasm koʻrsatadi.",
              "Oddiy savollar bilan tushunish tekshiriladi.",
            ],
          },
          {
            title: "Talking points va video 13",
            minutes: 10,
            points: [
              "Video 13 koʻriladi.",
              "Bolalar videoda koʻrgan 3 ta narsani aytadilar.",
            ],
          },
          {
            title: "Grammar: more … than",
            minutes: 15,
            points: [
              "1-mashq butun sinf bilan bajariladi.",
              "Ustoz uzun sifatlar uchun more … than kartochkasini doskaga ilib qoʻyadi.",
              "2-mashq juftlikda bajariladi va tekshiriladi.",
            ],
          },
          {
            title: "Speaking: joyni tanishtirish",
            minutes: 15,
            points: [
              "Speaking 2-mashq: juftlikda bitta joy tanlanadi.",
              "Har juftlik 3 ta gap tayyorlaydi: joy nomi, nimasi bilan qiziq, nima bilan qiyoslanadi.",
              "Juftliklar sinfga tanishtiradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz 5 ta sifatni takrorlatadi.",
              "Eng yaxshi taqdimot uchun ragʻbat beriladi va uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 74: sifatlar boʻyicha mashqlar.",
          "Sevimli sayohat joyingizni chizib, 2 ta gap yozing.",
        ],
        ustozga: "Bolalar more exciting oʻrniga excitinger deyishadi — qaysi sifat uzun ekanini boʻgʻin sanab koʻrsating. Video davomiyligini nazorat qiling, muhokamaga vaqt qolsin.",
      },
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
      {
        focus: "Ob-havo, fasllar va it",
        sb: "106–107",
        maqsad: [
          "Oʻquvchilar ob-havo va fasllarni ingliz tilida tasvirlay oladilar.",
          "Oʻquvchilar it olmoshini ob-havo gaplarida va ega-toʻldiruvchi oʻrnida toʻgʻri qoʻllay oladilar.",
          "Oʻquvchilar ob-havo haqidagi fikrlar matnini oʻqib tushuna oladilar.",
        ],
        lugat: [
          "autumn – kuz",
          "winter – qish",
          "spring – bahor",
          "summer – yoz",
          "rain – yomgʻir",
          "snow – qor",
          "sun – quyosh",
          "wind – shamol",
          "cloudy – bulutli",
          "warm – iliq",
        ],
        resurslar: ["SB 106–107", "WB 76–77", "audio 146, 147, 148", "video 14 (The weather)", "ob-havo belgilari flashcardlari"],
        blocks: [
          {
            title: "Warm-up va oʻtgan unitni takrorlash",
            minutes: 10,
            points: [
              "About you: yilning sevimli fasli qaysi, nega?",
              "Unit 17 dan 5 ta qiyosiy gap tez takrorlanadi.",
              "Ustoz bugungi ob-havoni soʻraydi va doskaga yozadi.",
            ],
          },
          {
            title: "Vocabulary: Weather",
            minutes: 15,
            points: [
              "1-mashq (audio 146) tinglanadi, soʻzlar rasmlar bilan moslanadi.",
              "Ustoz ot va sifat shakllarini ajratadi: rain / rainy, sun / sunny, wind / windy.",
              "Oʻquvchilar jadvalni daftarga koʻchiradilar.",
            ],
          },
          {
            title: "Reading: ob-havo haqida fikrlar",
            minutes: 18,
            points: [
              "2-mashq (audio 147): matn umumiy mazmun uchun oʻqiladi.",
              "3–4-mashqlar bilan tafsilotlar topiladi va javoblar matndan koʻrsatiladi.",
              "Oʻquvchilar matndagi fikrlardan qaysi biriga qoʻshilishini aytadilar.",
            ],
          },
          {
            title: "Grammar: it",
            minutes: 20,
            points: [
              "1–2-mashqlar orqali it ning ob-havo gaplaridagi vazifasi aniqlanadi (Grammar reference SB 155).",
              "Ustoz it ning ega va toʻldiruvchi oʻrnidagi farqini misollar bilan koʻrsatadi.",
              "3-mashq: soʻrovnoma savollari juftlikda soʻraladi.",
              "4-mashq yakka bajariladi va tekshiriladi.",
            ],
          },
          {
            title: "Speaking, Pronunciation va video",
            minutes: 17,
            points: [
              "5-mashq (audio 148): unli tovushlar farqlanadi va minimal juftliklar takrorlanadi.",
              "Har oʻquvchi sherigi haqida soʻrovnoma natijasini sinfga aytadi.",
              "Video 14 (The weather) koʻrilib, Talking points muhokama qilinadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz 6 ta ob-havo soʻzini tez soʻrov bilan takrorlaydi.",
              "Har oʻquvchi bitta It is … gapi aytadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 76–77: Weather, Reading va Grammar (it) mashqlari.",
          "Bir hafta davomida har kuni ob-havoni bitta inglizcha gap bilan yozib boring.",
        ],
        ustozga: "Oʻzbek tilida ega tushirib qoldiriladi, shuning uchun oʻquvchilar Is cold today deb yozadilar — it ning majburiyligini alohida taʼkidlang. rain / rainy farqi ham tez-tez xato beradi.",
      },
      {
        focus: "Taʼtil: tinglash, with / for / until va otkritka",
        sb: "108–109",
        maqsad: [
          "Oʻquvchilar taʼtil va sayohat soʻzlarini qoʻllab, rejasi haqida gapira oladilar.",
          "Oʻquvchilar with, for va until predloglarini toʻgʻri tanlay oladilar.",
          "Oʻquvchilar taʼtildan doʻstiga qisqa otkritka yoza oladilar.",
        ],
        lugat: [
          "catch – ushlamoq, ulgurmoq (catch a bus)",
          "fly – uchmoq",
          "stay – qolmoq, turmoq",
          "tent – chodir",
          "holiday – taʼtil",
          "postcard – otkritka",
          "until – ...gacha",
          "for – ...davomida",
          "with – ...bilan",
          "get – yetib bormoq, olmoq",
        ],
        resurslar: ["SB 108–109", "WB 78–79", "audio 149", "taʼtil rasmlari va otkritka namunasi", "doska"],
        blocks: [
          {
            title: "Warm-up: taʼtil rasmlari",
            minutes: 10,
            points: [
              "Rasmlar koʻrsatiladi, oʻquvchilar bu odamlar nima qilayotganini aytadilar.",
              "Oʻtgan darsdagi it gaplaridan 4 tasi takrorlanadi.",
            ],
          },
          {
            title: "Vocabulary va Listening: Holidays",
            minutes: 20,
            points: [
              "1-mashq: taʼtil soʻzlari koʻrib chiqiladi.",
              "2–3-mashqlar (audio 149): uchta telefon xabari tinglanadi va tafsilotlar belgilanadi.",
              "Audio ikkinchi marta qoʻyilib, javoblar juftlikda solishtiriladi.",
            ],
          },
          {
            title: "Grammar: with, for, until",
            minutes: 18,
            points: [
              "1-mashq orqali predloglar maʼnosi aniqlanadi (Grammar reference SB 155).",
              "Ustoz doskada uch ustun tuzadi: kim bilan (with), qancha vaqt (for), qachongacha (until).",
              "2-mashq yakka bajarilib, doskada tekshiriladi.",
            ],
          },
          {
            title: "Vocabulary: sayohat feʼllari va get",
            minutes: 17,
            points: [
              "4–5-mashqlar: taʼtil haqidagi gaplar toʻldiriladi.",
              "6-mashq: sayohat feʼllari koʻrib chiqiladi.",
              "7-mashq: get soʻzining turli maʼnolari misollar bilan ajratiladi.",
            ],
          },
          {
            title: "Writing: otkritka",
            minutes: 15,
            points: [
              "Writing 1-mashq: taʼtildan doʻstga otkritka yoziladi (qayerda, kim bilan, qancha vaqt, ob-havo).",
              "Ustoz doskada tuzilma beradi: salom, joy, mashgʻulot, ob-havo, xayrlashuv.",
              "Juftlikda almashib oʻqiladi va tuzatiladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Uch oʻquvchi otkritkasini sinfga oʻqib beradi.",
              "Ustoz umumiy xatolarni tuzatadi va uy vazifasini beradi.",
            ],
          },
        ],
        uyga: [
          "WB 78–79: Holidays, Listening, Grammar va Writing (otkritka) mashqlari.",
          "Otkritkani toza koʻchirib, rasm yoki rasmli fon bilan bezang.",
        ],
        ustozga: "for va until farqi qiyin: for muddat, until esa chegara nuqtasini bildiradi — vaqt chizigʻi chizib koʻrsating. catch soʻzining ulgurmoq maʼnosi oʻquvchilarga yangi boʻladi.",
      },
      {
        focus: "Culture: Beach culture in Australia and New Zealand",
        sb: "110–111 (Culture)",
        maqsad: [
          "Oʻquvchilar Avstraliya va Yangi Zelandiyadagi plyaj madaniyati haqidagi matnni tushuna oladilar.",
          "Oʻquvchilar suv sporti turlariga oid soʻzlarni qoʻllay oladilar.",
          "Oʻquvchilar guruhda yozgi lager uchun reklama varaqasi tayyorlay oladilar.",
        ],
        lugat: [
          "beach – plyaj",
          "snorkelling – snorkling (naycha bilan suv ostini kuzatish)",
          "kayaking – kayak eshkak eshish",
          "sandboarding – qum boʻylab taxtada uchish",
          "surfing – serfing",
          "camp – lager",
          "safe – xavfsiz",
          "wave – toʻlqin",
          "sunny – quyoshli",
          "activity – mashgʻulot",
        ],
        resurslar: ["SB 110–111 (Culture)", "audio 150, 151", "Culture video 15 (A Trip to New Zealand)", "xarita", "varaqa uchun A3 qogʻoz va markerlar"],
        blocks: [
          {
            title: "Warm-up va Factfile",
            minutes: 10,
            points: [
              "1-mashq: plyajga qanchalik tez-tez borasiz? — qisqa suhbat.",
              "Xaritada Avstraliya va Yangi Zelandiya topiladi.",
              "Factfile maʼlumotlari tez oʻqilib, qiziqarli fakt tanlanadi.",
            ],
          },
          {
            title: "Reading: Kiwi Summer Camp",
            minutes: 18,
            points: [
              "2-mashq (audio 150): matn umumiy mazmun uchun oʻqiladi.",
              "3-mashq bilan tafsilotlar topiladi.",
              "Oʻquvchilar matndagi lager kunini oʻz maktab kuni bilan qiyoslaydilar.",
            ],
          },
          {
            title: "Vocabulary: suv sporti",
            minutes: 15,
            points: [
              "4–5-mashqlar: snorkelling, kayaking, sandboarding soʻzlari rasm bilan moslanadi.",
              "6-mashq: jadval toʻldiriladi.",
              "Oʻquvchilar qaysi mashgʻulotni sinab koʻrmoqchi ekanini aytadilar.",
            ],
          },
          {
            title: "Listening va Culture video",
            minutes: 17,
            points: [
              "7–8-mashqlar (audio 151) tinglanadi, Shane va surfing lageri haqidagi tafsilotlar belgilanadi.",
              "Culture video 15 koʻriladi.",
              "Oʻquvchilar videodan 3 ta yangi maʼlumot aytadilar.",
            ],
          },
          {
            title: "Project: yozgi lager varaqasi",
            minutes: 20,
            points: [
              "Sinf 3–4 kishilik guruhlarga boʻlinadi.",
              "Har guruh lager nomi, joyi, muddati va kunlik mashgʻulotlar roʻyxatini tuzadi.",
              "A3 qogʻozda varaqa chizmasi tayyorlanadi, matn qisqa iboralar bilan yoziladi.",
              "Ustoz aylanib yurib, until va for ishlatilishini nazorat qiladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Har guruh varaqasini 1 daqiqada tanishtiradi.",
              "Sinf ovoz berib eng jozibali lagerni tanlaydi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Project: yozgi lager varaqasini tugating (nomi, joyi, muddati, kun davomidagi mashgʻulotlar).",
          "Varaqadagi matnni 40–50 soʻzga yetkazing va imlosini tekshiring.",
        ],
        ustozga: "Suv sporti soʻzlari uzun va talaffuzi qiyin — boʻgʻinlarga ajratib mashq qildiring. Guruh ishida bitta oʻquvchi hamma ishni qilib qoʻymasligi uchun rol taqsimlang.",
      },
    ],
    kids: [
      {
        focus: "Ob-havo va fasllar",
        sb: "106",
        maqsad: [
          "Oʻquvchilar 4 ta fasl va 6 ta ob-havo soʻzini nomlay oladilar.",
          "Oʻquvchilar ob-havo qoʻshigʻini aytib, harakat bilan koʻrsata oladilar.",
          "Oʻquvchilar qisqa matndan ob-havo haqidagi maʼlumotni topa oladilar.",
        ],
        lugat: [
          "autumn – kuz",
          "winter – qish",
          "spring – bahor",
          "summer – yoz",
          "rain – yomgʻir",
          "snow – qor",
          "sun – quyosh",
          "wind – shamol",
        ],
        resurslar: ["SB 106", "WB 76", "audio 146, 147", "ob-havo va fasl flashcardlari", "qoʻshiq uchun audio yoki video"],
        blocks: [
          {
            title: "Warm-up va takrorlash",
            minutes: 10,
            points: [
              "Unit 17 dagi tabiat soʻzlari kartochka bilan takrorlanadi.",
              "Ustoz 4 ta qiyosiy gap aytadi, bolalar toʻgʻri yoki notoʻgʻri deydilar.",
            ],
          },
          {
            title: "Yangi soʻzlar va TPR",
            minutes: 15,
            points: [
              "1-mashq (audio 146) tinglanadi va soʻzlar rasmlarga moslanadi.",
              "TPR: yomgʻir uchun barmoq bilan tomchi, shamol uchun tebranish, qor uchun titrash harakati.",
              "Ustoz soʻzni aytadi, bolalar harakatni bajaradi va aksincha.",
            ],
          },
          {
            title: "Fasllar",
            minutes: 15,
            points: [
              "Toʻrt fasl kartochkasi doskaga ilinadi.",
              "Bolalar har faslga mos ob-havo soʻzini qoʻyadilar.",
              "Har bola sevimli faslini aytadi: I like summer.",
            ],
          },
          {
            title: "Qoʻshiq",
            minutes: 15,
            points: [
              "How is the weather? qoʻshigʻi tinglanadi va harakatlar bilan aytiladi.",
              "Fasllar qoʻshigʻi ikki guruhga boʻlinib navbat bilan aytiladi.",
            ],
          },
          {
            title: "Reading ustoz bilan",
            minutes: 15,
            points: [
              "3-mashq (audio 147): ustoz 3–4 ta qisqa xabarni bolalar bilan birga oʻqiydi.",
              "Har xabardan keyin oddiy savol beriladi.",
            ],
          },
          {
            title: "Oʻyin: Weather bingo",
            minutes: 10,
            points: [
              "Bolalar 4 ta ob-havo rasmini tanlaydilar.",
              "Ustoz soʻz aytadi, mos rasm belgilanadi; birinchi qatorni yopgan Bingo deydi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Flashcardlar tez koʻrsatilib, soʻzlar takrorlanadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 76: ob-havo soʻzlari boʻyicha 1–2 ta mashq.",
          "Toʻrt fasl uchun kichik rasm chizib, inglizcha nomini yozing.",
        ],
        ustozga: "autumn soʻzida n harfi oʻqilmasligini alohida koʻrsating. Qoʻshiqni bir necha dars davomida takrorlang, bu soʻzlarni mustahkamlaydi.",
      },
      {
        focus: "It is cold today!",
        sb: "107",
        maqsad: [
          "Oʻquvchilar It is … bilan bugungi ob-havoni ayta oladilar.",
          "Oʻquvchilar it bilan oddiy savol va javob tuza oladilar.",
          "Oʻquvchilar bir xil unli tovushli soʻzlarni juftlay oladilar.",
        ],
        lugat: [
          "It is cold. – Havo sovuq.",
          "It is hot. – Havo issiq.",
          "It is raining. – Yomgʻir yogʻyapti.",
          "sunny – quyoshli",
          "windy – shamolli",
          "cloudy – bulutli",
          "today – bugun",
          "weather – ob-havo",
        ],
        resurslar: ["SB 107", "WB 77", "audio 148", "video 14", "unli tovush juftliklari kartochkalari"],
        blocks: [
          {
            title: "Warm-up: deraza oldida",
            minutes: 10,
            points: [
              "Bolalar derazaga qarab bugungi ob-havoni It is … deb aytadilar.",
              "Ustoz doskaga kunning ob-havo belgisini chizadi.",
            ],
          },
          {
            title: "Grammar: it taqdimoti",
            minutes: 15,
            points: [
              "Ustoz It is sunny. / It is not sunny. modelini rasm bilan koʻrsatadi.",
              "1-mashq butun sinf bilan bajariladi.",
              "Model gap xorda takrorlanadi.",
            ],
          },
          {
            title: "Grammar mashqi",
            minutes: 15,
            points: [
              "2-mashq ustoz bilan birga bajariladi.",
              "Ustoz it ni tushirib qoldirgan gaplarni doskaga yozib, bolalarga tuzattiradi.",
            ],
          },
          {
            title: "Soʻrovnoma juftlikda",
            minutes: 15,
            points: [
              "3-mashq: bolalar juftlikda savol beradilar va javoblarni belgilaydilar.",
              "Har juftlik bitta natijani sinfga aytadi.",
            ],
          },
          {
            title: "Pronunciation: unli tovushlar",
            minutes: 10,
            points: [
              "5-mashq (audio 148) tinglanadi va takrorlanadi.",
              "Juftlash oʻyini: bir xil unli tovushli soʻz kartochkalari topiladi.",
            ],
          },
          {
            title: "Video 14 va harakatli takrorlash",
            minutes: 15,
            points: [
              "Video 14 koʻriladi.",
              "Bolalar videodagi ob-havo turlarini harakat bilan koʻrsatadilar.",
              "Ustoz videodan 3 ta soʻzni doskaga yozadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Har bola bitta It is … gapi aytadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 77: it boʻyicha 2 ta mashq.",
          "Uch kunlik ob-havo kundaligi yuriting: har kunga bitta It is … gapi.",
        ],
        ustozga: "Bolalar Is cold today deb it ni tushirib qoldiradilar — it uchun alohida kartochka tayyorlab, har gapda uni doskaga qoʻydiring.",
      },
      {
        focus: "Taʼtil va otkritka",
        sb: "108–109",
        maqsad: [
          "Oʻquvchilar taʼtil va sayohat soʻzlarini tanib, rasm bilan moslay oladilar.",
          "Oʻquvchilar with, for, until bilan otkritka matnini toʻldira oladilar.",
          "Oʻquvchilar shablon asosida 3–4 gapli otkritka yoza oladilar.",
        ],
        lugat: [
          "holiday – taʼtil",
          "tent – chodir",
          "stay – qolmoq",
          "fly – uchmoq",
          "catch – ushlamoq, ulgurmoq",
          "postcard – otkritka",
          "with – ...bilan",
          "until – ...gacha",
        ],
        resurslar: ["SB 108–109", "WB 78", "audio 149", "otkritka shabloni va rangli qalamlar", "taʼtil rasm kartochkalari"],
        blocks: [
          {
            title: "Warm-up: taʼtil rasmlari",
            minutes: 10,
            points: [
              "Rasmlar koʻrsatiladi, bolalar Where are they? What are they doing? savollariga javob beradilar.",
              "Oʻtgan darsdagi It is … gaplari takrorlanadi.",
            ],
          },
          {
            title: "Listening: Holidays",
            minutes: 15,
            points: [
              "2-mashq (audio 149) tinglanadi, xabarlar rasmlarga moslanadi.",
              "Audio ikkinchi marta qoʻyilib tekshiriladi.",
            ],
          },
          {
            title: "Grammar: with, for, until",
            minutes: 15,
            points: [
              "1-mashqdagi otkritka butun sinf bilan birga toʻldiriladi.",
              "Ustoz uch predlogni uch rangda doskaga yozadi va maʼnosini rasm bilan koʻrsatadi.",
            ],
          },
          {
            title: "Vocabulary: sayohat feʼllari",
            minutes: 15,
            points: [
              "5-mashq: sayohat feʼllari va joylar kartochkalari bilan ishlanadi.",
              "Oʻyin: ustoz feʼlni aytadi, bolalar mos harakatni bajaradi (fly, stay, catch a bus).",
            ],
          },
          {
            title: "Harakatli tanaffus",
            minutes: 10,
            points: [
              "Chodir tikish, sumka koʻtarish, avtobusga yugurish harakatlari bilan TPR.",
              "Ustoz feʼlni aytadi, bolalar harakatni bajaradi; tez aytilganda xato qilganlar oʻtiradi.",
            ],
          },
          {
            title: "Writing: otkritka",
            minutes: 15,
            points: [
              "Shablon asosida 3–4 gapli otkritka yoziladi.",
              "Ustoz har bolaga yordam beradi, imloni tekshiradi.",
              "Otkritkaning orqa tomoni rasm bilan bezatiladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Uch bola otkritkasini sinfga oʻqib beradi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 78: taʼtil soʻzlari boʻyicha mashqlar.",
          "Otkritkangizni uyda tugating va bezang.",
        ],
        ustozga: "Yozishdan oldin shablonni doskada ochiq qoldiring, aks holda bolalar bitta gapda toʻxtab qoladi. Bezash vaqti yozishdan koʻp boʻlib ketmasligiga eʼtibor bering.",
      },
      {
        focus: "Culture: Beach culture in Australia and New Zealand",
        sb: "110–111 (Culture)",
        maqsad: [
          "Oʻquvchilar Avstraliya va Yangi Zelandiyani xaritadan topa oladilar.",
          "Oʻquvchilar plyaj mashgʻulotlariga oid soʻzlarni rasm bilan moslay oladilar.",
          "Oʻquvchilar yozgi lager plakatini tayyorlab, tanishtira oladilar.",
        ],
        lugat: [
          "beach – plyaj",
          "sea – dengiz",
          "mask – niqob (suv ostida koʻrish uchun)",
          "paddle – eshkak, eshkak eshmoq",
          "board – taxta",
          "camp – lager",
          "swim – suzmoq",
          "sand – qum",
        ],
        resurslar: ["SB 110–111 (Culture)", "audio 150, 151", "Culture video 15", "dunyo xaritasi", "plakat uchun A3 qogʻoz va rangli qalamlar"],
        blocks: [
          {
            title: "Warm-up: xarita bilan ishlash",
            minutes: 10,
            points: [
              "Xaritada Avstraliya va Yangi Zelandiya topiladi.",
              "1-mashq: bolalar plyajda nima qilishni yoqtirishini aytadilar.",
            ],
          },
          {
            title: "Reading rasmlar orqali",
            minutes: 15,
            points: [
              "2-mashq (audio 150): ustoz matnni rasmlar bilan qismlab tushuntiradi.",
              "Har qismdan keyin bitta oddiy savol beriladi.",
            ],
          },
          {
            title: "Yangi soʻzlar: mask, paddle, board",
            minutes: 15,
            points: [
              "4-mashq bajariladi: soʻzlar rasm bilan moslanadi.",
              "Har soʻz harakat bilan koʻrsatiladi va xorda takrorlanadi.",
              "Kartochka oʻyini: ustoz harakat qiladi, bolalar soʻzni aytadi.",
            ],
          },
          {
            title: "Culture video 15",
            minutes: 10,
            points: [
              "Video koʻriladi.",
              "Bolalar videoda koʻrgan 3 ta narsani aytadilar.",
            ],
          },
          {
            title: "Listening",
            minutes: 10,
            points: [
              "7-mashq (audio 151) tinglanadi va javoblar belgilanadi.",
              "Audio ikkinchi marta qoʻyilib tekshiriladi.",
            ],
          },
          {
            title: "Project: yozgi lager plakati",
            minutes: 20,
            points: [
              "Kichik guruhlarda plakat chiziladi: lager nomi va 3 ta mashgʻulot rasmi.",
              "Har mashgʻulot tagiga inglizcha soʻz yoziladi.",
              "Guruhlar plakatini koʻtarib, soʻzlarni aytib chiqadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Plakatlar sinf devoriga osiladi.",
              "Ustoz 5 ta yangi soʻzni takrorlatadi va uy vazifasini beradi.",
            ],
          },
        ],
        uyga: [
          "Plakatingizga 3 ta inglizcha gap yozib keling.",
          "Yangi 5 ta soʻzni lugʻat daftariga rasm bilan yozing.",
        ],
        ustozga: "Plakat ishi chizishga aylanib ketmasligi uchun taymer qoʻying va har guruhdan kamida 3 ta inglizcha soʻz talab qiling. board va bored talaffuzini aralashtirmaslikka eʼtibor bering.",
      },
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
      {
        focus: "Konsert hikoyasi va was / were",
        sb: "112–113",
        maqsad: [
          "Oʻquvchilar hikoya rasmlarini tartiblab, voqeani sifatlar bilan tasvirlay oladilar.",
          "Oʻquvchilar was va were ni tasdiq, inkor va savol shaklida toʻgʻri qoʻllay oladilar.",
          "Oʻquvchilar Where were you …? savollari bilan juftlikda suhbat qura oladilar.",
        ],
        lugat: [
          "difficult – qiyin",
          "easy – oson",
          "excited – hayajonlangan",
          "friendly – doʻstona",
          "late – kech",
          "loud – baland ovozli",
          "concert – konsert",
          "was / were – edi",
          "ticket – chipta",
          "crowded – gavjum",
        ],
        resurslar: ["SB 112–113", "WB 80–81", "audio 152, 153", "hikoya rasmlari va sifat kartochkalari", "doska"],
        blocks: [
          {
            title: "Warm-up va oʻtgan unitni takrorlash",
            minutes: 10,
            points: [
              "About you: doʻstlar bilan qayerga borishni yoqtirasiz?",
              "Unit 18 dan 5 ta ob-havo va taʼtil soʻzi takrorlanadi.",
              "Ustoz konsert soʻzini doskaga yozib, u bilan bogʻliq soʻzlarni yigʻadi.",
            ],
          },
          {
            title: "Vocabulary: Adjectives (1)",
            minutes: 18,
            points: [
              "1-mashq (audio 152): hikoya tinglanib, rasmlar tartiblanadi.",
              "2–3-mashqlar: sifatlar maʼnosi aniqlanadi va gaplarga qoʻyiladi.",
              "Oʻquvchilar har sifat uchun oʻz hayotidan bitta misol aytadilar.",
            ],
          },
          {
            title: "Grammar: Past simple be",
            minutes: 20,
            points: [
              "1-mashq orqali was va were tanlovi aniqlanadi (Grammar reference SB 156).",
              "Ustoz doskada jadval tuzadi: I / he / she / it → was, you / we / they → were.",
              "2-mashq: inkor shakllari mashq qilinadi.",
              "3-mashq: savol va qisqa javoblar bajariladi va doskada tekshiriladi.",
            ],
          },
          {
            title: "Pronunciation: was",
            minutes: 12,
            points: [
              "4-mashq (audio 153) tinglanadi: was ning kuchli va zaif shakllari farqlanadi.",
              "Oʻquvchilar gaplarni ikki xil urgʻu bilan takrorlaydilar.",
            ],
          },
          {
            title: "Speaking: Where were you …?",
            minutes: 20,
            points: [
              "4-mashq (Speaking qismi): juftlikda Where were you …? savollari beriladi.",
              "Har oʻquvchi kamida 5 ta savol soʻrab, javoblarni yozib boradi.",
              "Uch oʻquvchi sherigi haqida sinfga aytib beradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz 6 ta ega aytadi, oʻquvchilar was yoki were deb javob beradi.",
              "Umumiy xatolar doskada tuzatiladi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 80–81: Adjectives, Listening va Grammar (was / were) mashqlari.",
          "Kecha kunning 5 ta vaqti uchun qayerda boʻlganingizni yozing (At seven I was …).",
        ],
        ustozga: "Oʻquvchilar koʻplikda ham was ishlatib yuboradilar (They was late) — jadvalni doskada qoldiring. Savol tuzishda soʻz tartibi (Where were you?) alohida mashq talab qiladi.",
      },
      {
        focus: "Sound engineer: sifatlar va Wh- savollar",
        sb: "114–115",
        maqsad: [
          "Oʻquvchilar kasb haqidagi maqolani oʻqib, asosiy maʼlumotni topa oladilar.",
          "Oʻquvchilar hozirgi va oʻtgan zamonda Wh- savollar tuza oladilar.",
          "Oʻquvchilar tayyorlagan savollari bilan qisqa intervyu oʻtkaza oladilar.",
        ],
        lugat: [
          "brilliant – zoʻr, ajoyib",
          "heavy – ogʻir",
          "pleased – mamnun",
          "quick – tez",
          "ready – tayyor",
          "strong – kuchli",
          "sound engineer – tovush muhandisi",
          "equipment – jihoz",
          "stage – sahna",
          "job – ish, kasb",
        ],
        resurslar: ["SB 114–115", "WB 82–83", "audio 154", "savol soʻzlari kartochkalari", "doska va proyektor"],
        blocks: [
          {
            title: "Warm-up: savol zanjiri",
            minutes: 10,
            points: [
              "Where were you yesterday at six? savoli zanjir boʻyicha aylantiriladi.",
              "Oʻtgan darsdagi 5 ta sifat takrorlanadi.",
            ],
          },
          {
            title: "Reading: Sandy Berry haqidagi maqola",
            minutes: 20,
            points: [
              "1-mashq (audio 154): matn umumiy mazmun uchun oʻqiladi.",
              "2–3-mashqlar: tafsilotlar topiladi, javoblar matndan koʻrsatiladi.",
              "Oʻquvchilar bu kasbning ijobiy va qiyin tomonlarini sanaydilar.",
            ],
          },
          {
            title: "Vocabulary: Adjectives (2)",
            minutes: 15,
            points: [
              "4-mashq bajariladi: yangi sifatlar gaplarga qoʻyiladi.",
              "Ustoz sifatlarni odam va narsa tasnifiga ajratadi.",
              "Oʻquvchilar juftlikda 5 ta gap tuzadilar.",
            ],
          },
          {
            title: "Grammar: Wh- questions",
            minutes: 20,
            points: [
              "1–2-mashqlar orqali hozirgi va oʻtgan zamondagi savol tuzilishi aniqlanadi (Grammar reference SB 156).",
              "Ustoz doskada sxema chizadi: Wh- soʻz + yordamchi feʼl + ega + feʼl.",
              "3–4-mashqlar yakka bajarilib, doskada tekshiriladi.",
            ],
          },
          {
            title: "Speaking: intervyu",
            minutes: 15,
            points: [
              "Speaking 1-mashq: oʻquvchilar 5 ta savol tayyorlaydilar.",
              "2-mashq: savollar sheriklariga va ustozga beriladi, javoblar yozib olinadi.",
              "Talking points savollari qisqa muhokama qilinadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ikki oʻquvchi intervyu natijasini sinfga aytadi.",
              "Ustoz savol tuzilishidagi umumiy xatolarni tuzatadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 82–83: Adjectives, Reading, Grammar va Writing mashqlari.",
          "Oila aʼzolaringizdan biriga 5 ta Wh- savol tayyorlab, javoblarini yozib keling.",
        ],
        ustozga: "Savolda yordamchi feʼlni tushirib qoldirish (Where you were?) eng tipik xato — sxemani doskada koʻrinarli joyda qoldiring. Oʻtgan zamon savolida asosiy feʼl asl shaklda qolishini ham eslatib turing.",
      },
    ],
    kids: [
      {
        focus: "Konsert hikoyasi va sifatlar",
        sb: "112",
        maqsad: [
          "Oʻquvchilar hikoya rasmlarini toʻgʻri tartibda joylashtira oladilar.",
          "Oʻquvchilar 6 ta sifatni tanib, harakat bilan koʻrsata oladilar.",
          "Oʻquvchilar tinglash asosida mos rasmni topa oladilar.",
        ],
        lugat: [
          "difficult – qiyin",
          "easy – oson",
          "excited – hayajonlangan",
          "friendly – doʻstona",
          "late – kech",
          "loud – baland ovozli",
          "fast – tez",
          "slow – sekin",
        ],
        resurslar: ["SB 112", "WB 80", "audio 152", "hikoya rasmlari nusxalari", "sifat kartochkalari"],
        blocks: [
          {
            title: "Warm-up va takrorlash",
            minutes: 10,
            points: [
              "Ob-havo va fasllar kartochka bilan takrorlanadi.",
              "Bolalar bugungi ob-havoni It is … deb aytadilar.",
            ],
          },
          {
            title: "Hikoya bilan tanishish",
            minutes: 15,
            points: [
              "1-mashq (audio 152) tinglanadi.",
              "Bolalar juftlikda rasmlarni tartiblaydilar.",
              "Tartib sinf bilan tekshiriladi, ustoz hikoyani qisqa gaplar bilan takrorlaydi.",
            ],
          },
          {
            title: "Yangi sifatlar",
            minutes: 15,
            points: [
              "2-mashq bajariladi: sifatlar rasm va gaplarga moslanadi.",
              "Ustoz har sifatni kartochka bilan koʻrsatib, xorda takrorlatadi.",
            ],
          },
          {
            title: "Harakat bilan koʻrsatish",
            minutes: 15,
            points: [
              "3-mashq: sifatlar harakat bilan namoyish qilinadi (fast, slow, loud, late).",
              "Oʻyin: ustoz sifatni aytadi, bolalar harakat qiladi; sekin boʻlganlar oʻtiradi.",
            ],
          },
          {
            title: "Listening: rasmni koʻrsat",
            minutes: 15,
            points: [
              "Audio 152 qayta tinglanadi.",
              "Bolalar eshitgan qismiga mos rasmni koʻrsatadilar.",
              "Ustoz har qismdan keyin bitta oddiy savol beradi.",
            ],
          },
          {
            title: "Oʻyin: sifatlar bingosi",
            minutes: 10,
            points: [
              "Bolalar 4 ta sifat tanlab yozadilar.",
              "Ustoz taʼrif aytadi, mos sifat belgilanadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Kartochkalar tez koʻrsatilib, sifatlar takrorlanadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 80: sifatlar boʻyicha 1–2 ta mashq.",
          "Oʻzingizni va doʻstingizni tasvirlaydigan 2 ta sifat yozing.",
        ],
        ustozga: "excited va difficult uzun soʻzlar — boʻgʻinlarga ajratib, qarsak bilan mashq qildiring. Hikoya tartibida bolalar rasmlarga emas, ovozga tayanishi uchun audio kamida ikki marta qoʻyilsin.",
      },
      {
        focus: "was / were",
        sb: "113",
        maqsad: [
          "Oʻquvchilar was va were ni toʻgʻri tanlab, oddiy oʻtgan zamon gapini tuza oladilar.",
          "Oʻquvchilar was soʻzining talaffuzini toʻgʻri takrorlay oladilar.",
          "Oʻquvchilar Where were you …? savoliga javob bera oladilar.",
        ],
        lugat: [
          "was – edi (birlik)",
          "were – edi (koʻplik)",
          "yesterday – kecha",
          "at home – uyda",
          "at school – maktabda",
          "at the park – bogʻda",
          "happy – xursand",
          "tired – charchagan",
        ],
        resurslar: ["SB 113", "WB 81", "audio 153", "was / were rangli kartochkalari", "joy rasmlari (uy, maktab, bogʻ)"],
        blocks: [
          {
            title: "Warm-up: kecha qayerda eding",
            minutes: 10,
            points: [
              "Joy rasmlari doskaga ilinadi.",
              "Ustoz Yesterday I was at home modelini beradi, bolalar rasm tanlab takrorlaydilar.",
            ],
          },
          {
            title: "Grammar taqdimoti",
            minutes: 15,
            points: [
              "Ikki rangli kartochka bilan qoida koʻrsatiladi: I, he, she, it → was; you, we, they → were.",
              "Bolalar egani eshitib, mos rangdagi kartochkani koʻtaradilar.",
              "1-mashq butun sinf bilan bajariladi.",
            ],
          },
          {
            title: "Grammar mashqi",
            minutes: 15,
            points: [
              "2-mashq juftlikda bajariladi.",
              "Javoblar doskada tekshiriladi, ustoz xatolarni birga tuzatadi.",
            ],
          },
          {
            title: "Pronunciation: was",
            minutes: 10,
            points: [
              "4-mashq (audio 153) tinglanadi va takrorlanadi.",
              "Ustoz was ning gapda qisqa aytilishini koʻrsatadi.",
            ],
          },
          {
            title: "Harakatli tanaffus",
            minutes: 10,
            points: [
              "Sinf burchaklariga joy nomlari yopishtiriladi; ustoz gap aytadi, bolalar mos burchakka yuguradi.",
              "Har turdan keyin bitta bola oʻz gapini was yoki were bilan takrorlaydi.",
            ],
          },
          {
            title: "Savol zanjiri",
            minutes: 20,
            points: [
              "3-mashq ustoz bilan bajariladi.",
              "Where were you …? savoli zanjir boʻyicha aylantiriladi: har bola javob berib, keyingisiga savol beradi.",
              "Ustoz doskada savol modelini ochiq qoldiradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz 6 ta ega aytadi, bolalar was yoki were deb javob beradi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 81: was / were boʻyicha 2 ta mashq.",
          "Kecha qayerda boʻlganingiz haqida 3 ta gap yozing.",
        ],
        ustozga: "Bolalar oʻtgan zamon tushunchasini yangi oʻrganmoqda — har gapda kecha soʻzini qoʻshib, vaqtni aniq koʻrsating. They was eng koʻp uchraydigan xato.",
      },
      {
        focus: "Savollar va intervyu",
        sb: "114–115",
        maqsad: [
          "Oʻquvchilar savol soʻzlarini tanib, mos savolni tanlay oladilar.",
          "Oʻquvchilar soʻzlardan Wh- savol tuza oladilar.",
          "Oʻquvchilar sherigidan 3 ta savol soʻrab, javobini ayta oladilar.",
        ],
        lugat: [
          "Who – kim",
          "What – nima",
          "Where – qayerda",
          "When – qachon",
          "Why – nega",
          "How – qanday",
          "brilliant – zoʻr",
          "ready – tayyor",
        ],
        resurslar: ["SB 114–115", "WB 82", "audio 154", "savol soʻzlari kartochkalari", "intervyu uchun mikrofon shakli yoki oʻyinchoq"],
        blocks: [
          {
            title: "Warm-up: savol soʻzlari",
            minutes: 10,
            points: [
              "Kartochkalar koʻrsatiladi, bolalar savol soʻzini oʻzbekchaga tarjima qiladilar.",
              "Oʻtgan darsdagi was / were dan 4 ta gap takrorlanadi.",
            ],
          },
          {
            title: "Reading ustoz bilan",
            minutes: 15,
            points: [
              "1-mashq (audio 154): maqolaning birinchi qismi birga oʻqiladi.",
              "Ustoz har jumladan keyin oddiy savol beradi.",
              "Bolalar matndan 3 ta tanish soʻzni topadilar.",
            ],
          },
          {
            title: "Vocabulary: Adjectives (2)",
            minutes: 15,
            points: [
              "4-mashq ustoz bilan bajariladi.",
              "Har sifat uchun bitta oddiy misol gap tuziladi.",
            ],
          },
          {
            title: "Grammar: Wh- questions",
            minutes: 15,
            points: [
              "1-mashq butun sinf bilan bajariladi.",
              "Ustoz doskada savol sxemasini rangli kartochkalar bilan yigʻadi.",
            ],
          },
          {
            title: "Oʻyin: soʻzlardan savol tuzish",
            minutes: 10,
            points: [
              "4-mashq: soʻz kartochkalari aralashtirilib, bolalar toʻgʻri tartibda joylashtiradilar.",
              "Eng tez toʻgʻri tuzgan juftlik gʻolib boʻladi.",
            ],
          },
          {
            title: "Speaking: intervyu",
            minutes: 15,
            points: [
              "Speaking 1-mashq: har bola sherigidan 3 ta savol soʻraydi.",
              "Oʻyinchoq mikrofon bilan uch juftlik sinf oldida intervyu koʻrsatadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Savol soʻzlari kartochka bilan tez takrorlanadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 82: sifatlar boʻyicha mashqlar.",
          "Sherigingiz uchun 3 ta savol yozib keling.",
        ],
        ustozga: "Bolalar savolda soʻz tartibini buzadilar — rangli kartochkalar bilan sxemani koʻrsatish eng samarali usul. Why savoliga javobda because ni ishlatishni sekin-asta oʻrgating.",
      },
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
      {
        focus: "Yovvoyi hayvonlar va Past simple (+)",
        sb: "116–117",
        maqsad: [
          "Oʻquvchilar yovvoyi hayvonlarni nomlab, tasvir orqali topa oladilar.",
          "Oʻquvchilar toʻgʻri feʼllarning -ed shaklini imlo qoidalari bilan yasay oladilar.",
          "Oʻquvchilar oʻtgan dam olish kuni haqida qisqa gapira oladilar.",
        ],
        lugat: [
          "bear – ayiq",
          "crocodile – timsoh",
          "elephant – fil",
          "giraffe – jirafa",
          "monkey – maymun",
          "tiger – yoʻlbars",
          "wild animal – yovvoyi hayvon",
          "visited – tashrif buyurdi",
          "watched – tomosha qildi",
          "neck – boʻyin",
        ],
        resurslar: ["SB 116–117", "WB 84–85", "audio 155, 156, 157", "hayvon flashcardlari", "doska va -ed imlo jadvali"],
        blocks: [
          {
            title: "Warm-up va oʻtgan unitni takrorlash",
            minutes: 10,
            points: [
              "About you: sevimli hayvonlaringiz qaysi, uy hayvoningiz bormi?",
              "Unit 19 dan 5 ta was / were gapi takrorlanadi.",
              "Ustoz doskaga ANIMALS yozib, oʻquvchilar bilgan hayvon nomlarini yigʻadi.",
            ],
          },
          {
            title: "Vocabulary: Wild animals",
            minutes: 15,
            points: [
              "1-mashq (audio 155) tinglanadi, soʻzlar rasmlarga moslanadi.",
              "2-mashq: hayvon tasvirlab topiladi (It has got a long neck.).",
              "Oʻquvchilar juftlikda 4 ta hayvonni tasvirlab, sherigiga topdiradilar.",
            ],
          },
          {
            title: "Reading: Alessandroning yozgi kuni",
            minutes: 18,
            points: [
              "3-mashq (audio 156): matn umumiy mazmun uchun oʻqiladi.",
              "4–5-mashqlar bilan tafsilotlar topiladi.",
              "Ustoz matndagi oʻtgan zamon feʼllarini ajratib olishni soʻraydi.",
            ],
          },
          {
            title: "Grammar: Past simple (+)",
            minutes: 20,
            points: [
              "1–2-mashqlar orqali -ed qoidasi aniqlanadi (Grammar reference SB 157).",
              "Ustoz doskada imlo jadvali tuzadi: -ed, -d, -ied, undosh ikkilanishi.",
              "3–4-mashqlar yakka bajarilib, doskada tekshiriladi.",
            ],
          },
          {
            title: "Pronunciation va Speaking",
            minutes: 17,
            points: [
              "5-mashq (audio 157): -ed qoʻshimchasi qoʻshimcha boʻgʻin beradigan holatlar farqlanadi.",
              "6-mashq: juftlikda oʻtgan dam olish kuni haqida gapiriladi, kamida 5 ta -ed feʼl ishlatiladi.",
              "Ikki oʻquvchi sherigi haqida sinfga aytib beradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz 8 ta feʼlni aytadi, oʻquvchilar -ed shaklini baland aytadi.",
              "Umumiy imlo xatolari doskada tuzatiladi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 84–85: Wild animals, Reading va Grammar (Past simple +) mashqlari.",
          "Oʻtgan dam olish kuni haqida 5 ta gap yozing, har gapda -ed feʼl boʻlsin.",
        ],
        ustozga: "-ed ning uch xil talaffuzi (/t/, /d/, /ɪd/) oʻquvchilarga qiyin — barchasini /ed/ deb oʻqishadi. Imloda stopped kabi undosh ikkilanishi ham tez xato beradi.",
      },
      {
        focus: "Uy va ferma hayvonlari, Past simple (−)",
        sb: "118–119",
        maqsad: [
          "Oʻquvchilar uy va ferma hayvonlarini ajratib nomlay oladilar.",
          "Oʻquvchilar did not bilan oʻtgan zamon inkor gapini tuza oladilar.",
          "Oʻquvchilar oʻquv yili haqida qisqa sharh yoza oladilar.",
        ],
        lugat: [
          "cow – sigir",
          "donkey – eshak",
          "kitten – mushukcha",
          "puppy – kuchukcha",
          "rabbit – quyon",
          "sheep – qoʻy",
          "pet – uy hayvoni",
          "farm – ferma",
          "did not – ...madi (inkor)",
          "review – sharh",
        ],
        resurslar: ["SB 118–119", "WB 86–87", "audio 158, 159, 160, 161", "hayvon flashcardlari", "sharh uchun tuzilma varaqasi"],
        blocks: [
          {
            title: "Warm-up: Last weekend I … zanjiri",
            minutes: 10,
            points: [
              "Zanjir oʻyini: har oʻquvchi oldingisini takrorlab, oʻz -ed gapini qoʻshadi.",
              "Oʻtgan darsdagi 5 ta yovvoyi hayvon takrorlanadi.",
            ],
          },
          {
            title: "Vocabulary: Pets and farm animals",
            minutes: 18,
            points: [
              "1-mashq (audio 158) tinglanadi, soʻzlar rasmlar bilan moslanadi.",
              "2–3-mashqlar (audio 159): hayvonlar uy va ferma ustunlariga ajratiladi.",
              "Ustoz sheep soʻzining koʻplikda oʻzgarmasligini alohida koʻrsatadi.",
            ],
          },
          {
            title: "Listening: Zaraning hayvonlari",
            minutes: 15,
            points: [
              "4-mashq (audio 160) tinglanadi.",
              "5-mashq uchun audio qayta qoʻyiladi va tafsilotlar belgilanadi.",
              "Javoblar juftlikda solishtiriladi.",
            ],
          },
          {
            title: "Grammar: Past simple (−)",
            minutes: 20,
            points: [
              "1–2-mashqlar orqali did not qoidasi aniqlanadi.",
              "Ustoz doskada koʻrsatadi: did not + feʼlning asl shakli (did not watched emas).",
              "3–4-mashqlar (audio 161): hikoya oʻtgan zamonga oʻtkaziladi va tekshiriladi.",
            ],
          },
          {
            title: "Writing: oʻquv yili sharhi",
            minutes: 17,
            points: [
              "Writing 1-mashq: maktab sayti uchun sharh yoziladi.",
              "Ustoz tuzilma beradi: nimani oʻrgandik, qaysi unit yoqdi, nima qiyin boʻldi, keyingi reja.",
              "Oʻquvchilar kamida 2 ta inkor gap ishlatadilar.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ikki oʻquvchi sharhini sinfga oʻqib beradi.",
              "Ustoz umumiy xatolarni tuzatadi va uy vazifasini beradi.",
            ],
          },
        ],
        uyga: [
          "WB 86–87: Pets and farm animals, Listening, Grammar va Writing (sharh) mashqlari.",
          "Sharhni toza koʻchirib, 60–70 soʻzga yetkazing.",
        ],
        ustozga: "did not dan keyin feʼlga -ed qoʻshib yuborish eng koʻp uchraydigan xato — bu qoidani qizil rangda doskaga yozib qoʻying. sheep va fish kabi oʻzgarmas koʻpliklarni ham eslatib oʻting.",
      },
      {
        focus: "Life Skills: Deciding things together",
        sb: "120–121 (Life Skills)",
        maqsad: [
          "Oʻquvchilar guruhda fikr bildirib, umumiy qarorga kela oladilar.",
          "Oʻquvchilar afisha va qisqa xabarlardan kerakli maʼlumotni topa oladilar.",
          "Oʻquvchilar fikr bildirish iboralarini nutqida qoʻllay oladilar.",
        ],
        lugat: [
          "decide – qaror qilmoq",
          "together – birgalikda",
          "choose – tanlamoq",
          "agree – rozi boʻlmoq",
          "disagree – rozi boʻlmaslik",
          "film poster – film afishasi",
          "topping – pitsa ustidagi masalliq",
          "vote – ovoz bermoq",
          "opinion – fikr",
          "plan – reja",
        ],
        resurslar: ["SB 120–121 (Life Skills)", "audio 162, 163", "Useful language kartochkalari", "guruh ishi uchun qogʻoz", "doska"],
        blocks: [
          {
            title: "Warm-up: tanlash qiyinmi",
            minutes: 10,
            points: [
              "1-mashq: doʻstlar bilan film tanlash qiyinmi? — qisqa suhbat.",
              "Ustoz doskada oʻquvchilar aytgan qiyinchiliklarni yozadi.",
            ],
          },
          {
            title: "Reading: film afishalari va xabarlar",
            minutes: 20,
            points: [
              "2–3-mashqlar (audio 162): afishalar oʻqilib, asosiy maʼlumot topiladi.",
              "4–5-mashqlar: xabarlardagi fikrlar aniqlanadi.",
              "6-mashq bajariladi va javoblar tekshiriladi.",
            ],
          },
          {
            title: "Listening: pitsa uchun tanlov",
            minutes: 15,
            points: [
              "7-mashq (audio 163) tinglanadi.",
              "8-mashq uchun audio qayta qoʻyilib, kim nimani tanlagani belgilanadi.",
              "Oʻquvchilar guruh qanday qarorga kelganini aytadilar.",
            ],
          },
          {
            title: "Useful language",
            minutes: 15,
            points: [
              "9–10-mashqlar: fikr bildirish iboralari koʻrib chiqiladi.",
              "Ustoz iboralarni kuchli, neytral va salbiy fikrga ajratadi.",
              "Oʻquvchilar juftlikda har ibora bilan bittadan gap tuzadilar.",
            ],
          },
          {
            title: "Project: shanba kungi reja",
            minutes: 20,
            points: [
              "Guruhlar shanba kungi kino va pitsa rejasini tuzadilar.",
              "Har aʼzo oʻz taklifini Useful language iboralari bilan bildiradi.",
              "Guruh ovoz berib yakuniy qarorga keladi va sabablarini yozadi.",
              "Ustoz aylanib yurib, hamma gapirishini nazorat qiladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Har guruh qarorini va 2 ta sababini sinfga aytadi.",
              "Sinf eng asosli qarorni tanlaydi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Project yakuni: guruh qarori va sabablarini 5–6 gap bilan yozing.",
          "Fikr bildirish iboralaridan 3 tasini yodlab keling.",
        ],
        ustozga: "Guruh muhokamasida bitta oʻquvchi hukmron boʻlib qolmasligi uchun har aʼzoga navbat kartochkasi bering. I do not agree ni qoʻpol emas, muloyim ohangda aytishni namuna bilan koʻrsating.",
      },
      {
        focus: "Review 5 (Unit 17–20) — barcha koʻnikmalar",
        sb: "122–123 (Review 5)",
        maqsad: [
          "Oʻquvchilar Unit 17–20 lugʻati va grammatikasini takrorlab mustahkamlay oladilar.",
          "Oʻquvchilar audio asosida sayohat va ob-havo maʼlumotini topa oladilar.",
          "Oʻquvchilar qisqa haiku yoza oladilar.",
        ],
        lugat: [
          "haiku – haiku (qisqa sheʼr)",
          "traveller – sayyoh",
          "weather – ob-havo",
          "forest – oʻrmon",
          "elephant – fil",
          "exciting – qiziqarli",
          "was / were – edi",
          "visited – tashrif buyurdi",
        ],
        resurslar: ["SB 122–123 (Review 5)", "audio 164, 165", "Unit 17–20 soʻz kartochkalari", "viktorina uchun doska", "haiku uchun rangli qogʻoz"],
        blocks: [
          {
            title: "Warm-up: jamoaviy viktorina",
            minutes: 10,
            points: [
              "Sinf ikki jamoaga boʻlinadi.",
              "Ustoz Unit 17–20 soʻzlari boʻyicha taʼrif aytadi, jamoalar soʻzni topadi.",
            ],
          },
          {
            title: "Grammar takrori",
            minutes: 18,
            points: [
              "1–3-mashqlar yakka bajariladi (comparatives, was / were, Past simple).",
              "Javoblar juftlikda solishtirilib, doskada tekshiriladi.",
              "Ustoz koʻp xato boʻlgan qoidani qisqa jadval bilan qayta koʻrsatadi.",
            ],
          },
          {
            title: "Vocabulary takrori",
            minutes: 12,
            points: [
              "Vocabulary 1–2-mashqlar bajariladi.",
              "Qiyin soʻzlar roʻyxati tuzilib, oʻquvchilar daftariga koʻchiriladi.",
            ],
          },
          {
            title: "Listening: Gavin sayohatlari",
            minutes: 15,
            points: [
              "Listening 1-mashq (audio 164) tinglanadi, joy va ob-havo bogʻlanadi.",
              "Audio ikkinchi marta qoʻyilib, javoblar tekshiriladi.",
            ],
          },
          {
            title: "Reading va Speaking",
            minutes: 20,
            points: [
              "Reading 1-mashq (audio 165): haikular oʻqilib, rasmlarga moslanadi.",
              "Speaking 1-mashq: juftlikda sayyoh bilan intervyu oʻtkaziladi (kamida 5 savol).",
              "Ikki juftlik intervyusini sinfga koʻrsatadi.",
            ],
          },
          {
            title: "Writing va yakun",
            minutes: 15,
            points: [
              "Writing 1-mashq: har oʻquvchi oʻz haikusini yozadi.",
              "Haikular rangli qogʻozga koʻchirilib, sinf devoriga osiladi.",
              "Ustoz yakuniy test tuzilishini tushuntirib, takrorlash rejasini beradi.",
            ],
          },
        ],
        uyga: [
          "Vocabulary list: Unit 17–20 soʻzlarini takrorlash va Grammar reference (SB 154–157) mashqlari.",
          "Yakuniy testga tayyorgarlik: Unit 11–20 dagi qiyin 20 ta soʻzni takrorlang.",
        ],
        ustozga: "Bu dars yakuniy testdan oldingi oxirgi takror — oʻquvchilar eng koʻp xato qilgan 2–3 mavzuga koʻproq vaqt ajrating. Haiku yozishda soʻz sonini qatʼiy talab qilmang, asosiysi tasvir boʻlsin.",
      },
      {
        focus: "End-of-level test (L2)",
        sb: "—",
        maqsad: [
          "Oʻquvchilar Unit 11–20 boʻyicha lugʻat va grammatika bilimini mustaqil koʻrsata oladilar.",
          "Oʻquvchilar tinglash, oʻqish, yozish va gapirish koʻnikmalarini test formatida namoyish eta oladilar.",
          "Oʻquvchilar oʻz xatolarini tahlil qilib, keyingi daraja uchun reja tuza oladilar.",
        ],
        lugat: [
          "test – nazorat ishi",
          "instruction – topshiriq koʻrsatmasi",
          "answer – javob",
          "mistake – xato",
          "score – ball",
          "level – daraja",
          "revision – takrorlash",
          "result – natija",
        ],
        resurslar: ["Markaz yakuniy testi (Unit 11–20)", "test audiosi va ovoz kuchaytirgich", "javob varaqalari", "soat yoki taymer", "baholash jadvali"],
        blocks: [
          {
            title: "Warm-up va test tuzilishini tushuntirish",
            minutes: 10,
            points: [
              "Qisqa ogʻzaki takror: Unit 11–20 dan 6 ta savol.",
              "Ustoz test qismlarini va har qismga ajratilgan vaqtni doskaga yozadi.",
              "Topshiriq turlari bitta namuna bilan koʻrsatiladi.",
            ],
          },
          {
            title: "Yozma qism: Vocabulary va Grammar",
            minutes: 25,
            points: [
              "Unit 11–20 boʻyicha lugʻat va grammatika topshiriqlari mustaqil bajariladi.",
              "Ustoz sinfni kuzatadi, savollarga javob bermaydi, faqat texnik yordam beradi.",
              "Vaqt tugashidan 5 daqiqa oldin ogohlantiriladi.",
            ],
          },
          {
            title: "Listening qismi",
            minutes: 15,
            points: [
              "Audio ikki marta qoʻyiladi.",
              "Oʻquvchilar javoblarni varaqaga koʻchiradilar.",
              "Ustoz vaqtni nazorat qiladi.",
            ],
          },
          {
            title: "Reading qismi",
            minutes: 15,
            points: [
              "Review formatidagi oʻqish topshiriqlari bajariladi.",
              "Oʻquvchilar javobni matndan belgilab qoʻyadilar.",
            ],
          },
          {
            title: "Writing va Speaking",
            minutes: 15,
            points: [
              "Writing: 50–60 soʻzli qisqa matn yoziladi.",
              "Speaking: ustoz navbat bilan juftliklarni chaqirib, qisqa savol-javob oʻtkazadi va baholaydi.",
              "Boshqa oʻquvchilar shu vaqtda yozma qismni yakunlaydilar.",
            ],
          },
          {
            title: "Yakun: tahlil va keyingi daraja rejasi",
            minutes: 10,
            points: [
              "Ustoz umumiy taassurotni aytadi va eng koʻp uchragan xatolarni sanaydi.",
              "Har oʻquvchiga shaxsiy takrorlash yoʻnalishi beriladi.",
              "Keyingi daraja mazmuni qisqa tanishtiriladi.",
            ],
          },
        ],
        uyga: [
          "Keyingi daraja oldidan: test tahlilidagi xatolar ustida ishlash va Grammar reference (SB 153–157) mashqlari.",
          "Oʻzingiz uchun 10 ta qiyin soʻzdan iborat shaxsiy takrorlash roʻyxati tuzing.",
        ],
        ustozga: "Test darsida vaqtni qatʼiy nazorat qiling va Speaking qismini yozma ish bilan bir vaqtda oʻtkazing, aks holda 90 daqiqa yetmaydi. Natijalarni keyingi darsda tahlil qiling, bugun faqat umumiy fikr ayting.",
      },
    ],
    kids: [
      {
        focus: "Yovvoyi hayvonlar",
        sb: "116",
        maqsad: [
          "Oʻquvchilar 6 ta yovvoyi hayvonni nomlay oladilar.",
          "Oʻquvchilar hayvonni tasvirlab, sherigiga topdira oladilar.",
          "Oʻquvchilar qisqa matnga mos sarlavha tanlay oladilar.",
        ],
        lugat: [
          "bear – ayiq",
          "crocodile – timsoh",
          "elephant – fil",
          "giraffe – jirafa",
          "monkey – maymun",
          "tiger – yoʻlbars",
          "long neck – uzun boʻyin",
          "big teeth – katta tishlar",
        ],
        resurslar: ["SB 116", "WB 84", "audio 155, 156", "hayvon flashcardlari", "hayvon ovozlari audiosi"],
        blocks: [
          {
            title: "Warm-up va takrorlash",
            minutes: 10,
            points: [
              "Unit 19 dagi sifatlar va was / were kartochka bilan takrorlanadi.",
              "Ustoz 4 ta gap aytadi, bolalar was yoki were deb toʻldiradi.",
            ],
          },
          {
            title: "Yangi soʻzlar va TPR",
            minutes: 15,
            points: [
              "1-mashq (audio 155) tinglanadi, soʻzlar rasmlarga moslanadi.",
              "Har hayvon harakati va ovozi bilan koʻrsatiladi (fil xartumi, maymun sakrashi).",
              "Ustoz soʻzni aytadi, bolalar harakatni bajaradi.",
            ],
          },
          {
            title: "Oʻyin: hayvon ovozlari",
            minutes: 10,
            points: [
              "Ustoz hayvon ovozini qoʻyadi yoki taqlid qiladi, bolalar nomini aytadi.",
              "Keyin bolalar navbat bilan yetakchi boʻladi.",
            ],
          },
          {
            title: "Tasvirlab topish",
            minutes: 15,
            points: [
              "2-mashq bajariladi.",
              "Ustoz It has got a long neck. modelini doskaga yozadi.",
              "Bolalar juftlikda hayvon tasvirlab, sherigiga topdiradilar.",
            ],
          },
          {
            title: "Reading ustoz bilan",
            minutes: 15,
            points: [
              "3-mashq (audio 156): matn qismlab oʻqiladi.",
              "Bolalar mos sarlavhani tanlaydilar.",
              "Har qismdan keyin oddiy savol beriladi.",
            ],
          },
          {
            title: "Chizish va nomlash",
            minutes: 15,
            points: [
              "Bolalar sevimli yovvoyi hayvonini chizadilar.",
              "Rasm tagiga inglizcha nomini va bitta tasvirlovchi soʻz yozadilar.",
              "Uch bola rasmini sinfga koʻrsatadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Flashcardlar tez koʻrsatilib, soʻzlar takrorlanadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 84: hayvon soʻzlari boʻyicha 1–2 ta mashq.",
          "Sevimli hayvoningiz haqida 2 ta gap yozing.",
        ],
        ustozga: "crocodile va giraffe talaffuzi qiyin — boʻgʻinlarga ajratib, qarsak bilan mashq qildiring. Bolalar hayvon nomiga a artiklini qoʻshishni unutadilar.",
      },
      {
        focus: "Past simple: -ed",
        sb: "117",
        maqsad: [
          "Oʻquvchilar toʻgʻri feʼllarga -ed qoʻshishni oʻrgana oladilar.",
          "Oʻquvchilar -ed ning qoʻshimcha boʻgʻin beradigan holatini eshitib ajrata oladilar.",
          "Oʻquvchilar oʻtgan dam olish kuni haqida 2 ta gap ayta oladilar.",
        ],
        lugat: [
          "played – oʻynadi",
          "watched – tomosha qildi",
          "visited – tashrif buyurdi",
          "walked – yurdi, sayr qildi",
          "helped – yordam berdi",
          "studied – oʻqidi, dars qildi",
          "yesterday – kecha",
          "last weekend – oʻtgan dam olish kuni",
        ],
        resurslar: ["SB 117", "WB 85", "audio 157", "-ed / -ied saralash kartochkalari", "harakat rasm kartochkalari"],
        blocks: [
          {
            title: "Warm-up: kecha nima qilding",
            minutes: 10,
            points: [
              "Harakat rasm kartochkalari koʻrsatiladi.",
              "Ustoz Yesterday I played modelini beradi, bolalar rasm tanlab takrorlaydilar.",
            ],
          },
          {
            title: "Grammar taqdimoti",
            minutes: 15,
            points: [
              "Ustoz feʼlning hozirgi va oʻtgan shaklini ikki kartochkada koʻrsatadi.",
              "1-mashq butun sinf bilan bajariladi.",
              "Model gaplar xorda takrorlanadi.",
            ],
          },
          {
            title: "Kartochkalarni saralash",
            minutes: 15,
            points: [
              "Uch quti qoʻyiladi: -ed, -d, -ied.",
              "Bolalar feʼl kartochkalarini toʻgʻri qutiga tashlaydilar.",
              "2-mashq bajariladi va tekshiriladi.",
            ],
          },
          {
            title: "Grammar mashqi",
            minutes: 15,
            points: [
              "3-mashq juftlikda bajariladi.",
              "Ustoz aylanib yurib yordam beradi, javoblar doskada tekshiriladi.",
            ],
          },
          {
            title: "Pronunciation: qarsak bilan",
            minutes: 10,
            points: [
              "5-mashq (audio 157) tinglanadi.",
              "Qoʻshimcha boʻgʻin eshitilganda bolalar qarsak chaladi (visited, wanted).",
            ],
          },
          {
            title: "Speaking: oʻtgan dam olish kuni",
            minutes: 15,
            points: [
              "6-mashq: har bola oʻtgan dam olish kuni haqida 2 ta gap aytadi.",
              "Ustoz doskada Last weekend I … modelini ochiq qoldiradi.",
              "Gaplar guruhda navbat bilan aytiladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz 6 ta feʼlni aytadi, bolalar -ed shaklini xorda aytadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 85: Past simple (+) boʻyicha 2 ta mashq.",
          "Oʻtgan dam olish kuni haqida 2 ta gap yozing va rasm chizing.",
        ],
        ustozga: "Bolalar -ed ni hamma joyda /ed/ deb oʻqiydilar — qarsak oʻyini bu farqni eng yaxshi sezdiradi. studied kabi -y → -ied oʻzgarishini alohida kartochka bilan koʻrsating.",
      },
      {
        focus: "Uy va ferma hayvonlari, did not",
        sb: "118–119",
        maqsad: [
          "Oʻquvchilar uy va ferma hayvonlarini ajratib nomlay oladilar.",
          "Oʻquvchilar did not bilan oddiy inkor gap tuza oladilar.",
          "Oʻquvchilar oʻquv yili haqida shablon bilan 3–4 gap yoza oladilar.",
        ],
        lugat: [
          "cow – sigir",
          "donkey – eshak",
          "kitten – mushukcha",
          "puppy – kuchukcha",
          "rabbit – quyon",
          "sheep – qoʻy",
          "farm – ferma",
          "did not – ...madi",
        ],
        resurslar: ["SB 118–119", "WB 86", "audio 158, 159, 160, 161", "hayvon flashcardlari", "did not kartochkasi va yozuv shabloni"],
        blocks: [
          {
            title: "Warm-up: Old MacDonald had a farm",
            minutes: 10,
            points: [
              "Qoʻshiq harakatlar va hayvon ovozlari bilan aytiladi.",
              "Oʻtgan darsdagi 4 ta -ed feʼl takrorlanadi.",
            ],
          },
          {
            title: "Yangi soʻzlar",
            minutes: 15,
            points: [
              "1-mashq (audio 158) tinglanadi va soʻzlar rasmlarga moslanadi.",
              "Ustoz flashcardlarni koʻrsatib, xorda takrorlatadi.",
            ],
          },
          {
            title: "Uy va ferma ustunlari",
            minutes: 15,
            points: [
              "2–3-mashqlar (audio 159) bajariladi.",
              "Doskada ikki ustun tuziladi, bolalar kartochkalarni toʻgʻri ustunga ilib chiqadilar.",
              "Ustoz sheep koʻplikda oʻzgarmasligini koʻrsatadi.",
            ],
          },
          {
            title: "Listening",
            minutes: 10,
            points: [
              "4-mashq (audio 160) tinglanadi va javoblar belgilanadi.",
              "Audio ikkinchi marta qoʻyilib tekshiriladi.",
            ],
          },
          {
            title: "Grammar: did not",
            minutes: 15,
            points: [
              "1-mashq (audio 161) butun sinf bilan bajariladi.",
              "Ustoz did not kartochkasini koʻtarganda bolalar feʼlni asl shaklda aytadilar.",
              "2-mashq juftlikda bajariladi.",
            ],
          },
          {
            title: "Writing: oʻquv yili haqida",
            minutes: 15,
            points: [
              "Shablon bilan 3–4 gap yoziladi: sevimli unit, sevimli qoʻshiq, sevimli oʻyin.",
              "Ustoz har bolaga yordam beradi va imloni tekshiradi.",
              "Ikki bola yozganini sinfga oʻqib beradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Hayvon flashcardlari tez takrorlanadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "WB 86: hayvonlar boʻyicha mashqlar.",
          "Oʻquv yili haqidagi gaplaringizni tugating va rasm bilan bezang.",
        ],
        ustozga: "did not dan keyin feʼlga -ed qoʻshib yuborish tez uchraydi — kartochka oʻyini bu xatoning oldini oladi. Qoʻshiqni har dars boshida takrorlash hayvon soʻzlarini mustahkamlaydi.",
      },
      {
        focus: "Life Skills: Deciding things together",
        sb: "120–121 (Life Skills)",
        maqsad: [
          "Oʻquvchilar oʻz fikrini oddiy iboralar bilan bildira oladilar.",
          "Oʻquvchilar guruhda ovoz berib umumiy qarorga kela oladilar.",
          "Oʻquvchilar afisha va qisqa matndan maʼlumot topa oladilar.",
        ],
        lugat: [
          "I like … – men … yoqtiraman",
          "I do not like … – men … yoqtirmayman",
          "It is OK. – Yaxshi, boʻladi.",
          "choose – tanlamoq",
          "together – birgalikda",
          "film – kino",
          "pizza – pitsa",
          "topping – pitsa ustidagi masalliq",
        ],
        resurslar: ["SB 120–121 (Life Skills)", "audio 162, 163", "qogʻoz pitsa shakli va masalliq rasmlari", "Useful language kartochkalari", "rangli qalamlar"],
        blocks: [
          {
            title: "Warm-up: sevimli film",
            minutes: 10,
            points: [
              "1-mashq: bolalar sevimli filmini aytadilar.",
              "Ustoz doʻstlar bilan tanlash qiyinmi degan savolni beradi.",
            ],
          },
          {
            title: "Reading: afishalar",
            minutes: 15,
            points: [
              "2-mashq (audio 162): afishalar rasmlar orqali koʻrib chiqiladi.",
              "3-mashq bajariladi: kim qaysi filmni tanlagani topiladi.",
            ],
          },
          {
            title: "Listening: pitsa tanlovi",
            minutes: 10,
            points: [
              "7-mashq (audio 163) tinglanadi.",
              "Bolalar pitsaga nima qoʻyilganini rasmda belgilaydilar.",
            ],
          },
          {
            title: "Useful language",
            minutes: 15,
            points: [
              "9-mashq: fikr bildirish iboralari koʻrib chiqiladi.",
              "Ustoz I really like … / I think … is OK. modelini kartochka bilan beradi.",
              "Bolalar navbat bilan bitta ovqat haqida fikr bildiradilar.",
            ],
          },
          {
            title: "Harakatli tanaffus",
            minutes: 10,
            points: [
              "Ustoz mahsulot nomini aytadi, yoqtirganlar oʻrnidan turadi, yoqtirmaganlar oʻtiradi.",
              "Har turdan keyin bitta bola I like … yoki I do not like … deb sababini aytadi.",
            ],
          },
          {
            title: "Project: qogʻoz pitsa",
            minutes: 20,
            points: [
              "Guruhlarda katta qogʻoz pitsa tayyorlanadi.",
              "Har bola bitta masalliq taklif qiladi va iborani ishlatib aytadi.",
              "Guruh ovoz berib 4 ta masalliqni tanlaydi va pitsani bezaydi.",
              "Har guruh pitsasini sinfga tanishtiradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Pitsalar devorga osiladi.",
              "Ustoz fikr bildirish iboralarini takrorlatadi va uy vazifasini beradi.",
            ],
          },
        ],
        uyga: [
          "Oila bilan birgalikda dam olish kuni rejasini tuzing va 2 ta gap yozing.",
          "Fikr bildirish iboralaridan 2 tasini yodlab keling.",
        ],
        ustozga: "Ovoz berish vaqtida hamma bola gapirishi uchun navbat kartochkasidan foydalaning. Yoqtirmaslikni muloyim aytishni namuna bilan koʻrsating.",
      },
      {
        focus: "Review 5: lugʻat va grammatika oʻyinlari",
        sb: "122 (Review 5)",
        maqsad: [
          "Oʻquvchilar Unit 17–20 soʻzlarini oʻyin orqali takrorlay oladilar.",
          "Oʻquvchilar qiyoslash va Past simple gaplarini toʻgʻri tuza oladilar.",
          "Oʻquvchilar topishmoqlar orqali tabiat va hayvon soʻzlarini topa oladilar.",
        ],
        lugat: [
          "forest – oʻrmon",
          "river – daryo",
          "beach – plyaj",
          "tiger – yoʻlbars",
          "rabbit – quyon",
          "nicer than – ...dan yaxshiroq",
          "played – oʻynadi",
          "visited – tashrif buyurdi",
        ],
        resurslar: ["SB 122 (Review 5)", "Unit 17–20 flashcardlari", "doska va ikki jamoa uchun marker", "topishmoq kartochkalari"],
        blocks: [
          {
            title: "Warm-up: Board race",
            minutes: 10,
            points: [
              "Sinf ikki jamoaga boʻlinadi.",
              "Ustoz flashcard koʻrsatadi, jamoa vakili soʻzni doskaga yozadi.",
            ],
          },
          {
            title: "Grammar: qiyoslash oʻyini",
            minutes: 15,
            points: [
              "1-mashq bajariladi.",
              "Ustoz ikki narsani aytadi, bolalar qiyosiy gap tuzadilar (Apples are nicer than chocolate.).",
              "Eng koʻp toʻgʻri gap tuzgan jamoa gʻolib boʻladi.",
            ],
          },
          {
            title: "Grammar: hikoyani toʻldirish",
            minutes: 15,
            points: [
              "3-mashq ustoz bilan birga bajariladi.",
              "Har boʻsh joy uchun bolalar feʼlning oʻtgan zamon shaklini aytadilar.",
              "Toʻldirilgan hikoya oxirida birga oʻqiladi.",
            ],
          },
          {
            title: "Vocabulary: tabiat topishmoqlari",
            minutes: 15,
            points: [
              "Vocabulary 1-mashq bajariladi.",
              "Ustoz topishmoq aytadi, bolalar tabiat soʻzini topadilar.",
            ],
          },
          {
            title: "Harakatli tanaffus",
            minutes: 10,
            points: [
              "Hayvon harakatlari bilan TPR: ustoz nomini aytadi, bolalar taqlid qiladi.",
              "Keyin bolalar navbat bilan hayvonni koʻrsatadi, sinf nomini topadi.",
            ],
          },
          {
            title: "Vocabulary: hayvon topishmoqlari",
            minutes: 15,
            points: [
              "Vocabulary 2-mashq bajariladi.",
              "Bolalar juftlikda hayvon tasvirlab, sherigiga topdiradilar.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz 8 ta soʻzni tez soʻrov bilan takrorlaydi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Unit 17–20 dan 10 ta soʻzni rasm bilan lugʻat daftariga yozing.",
          "Yozgan soʻzlaringizdan 3 tasi bilan gap tuzing.",
        ],
        ustozga: "Oʻyin paytida ham toʻgʻri shakl talab qilinsin, aks holda xatolar mustahkamlanib qoladi. Qiyoslashda than ni tushirib qoldirish tez uchraydi.",
      },
      {
        focus: "Review 5: koʻnikmalar va haiku",
        sb: "123 (Review 5)",
        maqsad: [
          "Oʻquvchilar audio asosida oy va ob-havoni bogʻlay oladilar.",
          "Oʻquvchilar haikularni rasmlarga moslay oladilar.",
          "Oʻquvchilar ustoz bilan birga qisqa haiku yoza oladilar.",
        ],
        lugat: [
          "haiku – haiku (qisqa sheʼr)",
          "traveller – sayyoh",
          "month – oy",
          "weather – ob-havo",
          "snow – qor",
          "rain – yomgʻir",
          "sun – quyosh",
          "wind – shamol",
        ],
        resurslar: ["SB 123 (Review 5)", "audio 164, 165", "haiku uchun rangli qogʻoz va qalamlar", "ob-havo kartochkalari", "intervyu uchun oʻyinchoq mikrofon"],
        blocks: [
          {
            title: "Warm-up: Simon says",
            minutes: 10,
            points: [
              "Ob-havo harakatlari bilan Simon says oʻynaladi.",
              "Bolalar bugungi ob-havoni It is … deb aytadilar.",
            ],
          },
          {
            title: "Listening: oy va ob-havo",
            minutes: 15,
            points: [
              "Listening 1-mashq (audio 164) tinglanadi.",
              "Oylar va ob-havo chiziq bilan bogʻlanadi.",
              "Audio ikkinchi marta qoʻyilib tekshiriladi.",
            ],
          },
          {
            title: "Reading: haikular",
            minutes: 15,
            points: [
              "Reading 1-mashq (audio 165): haikular tinglanadi va rasmlarga moslanadi.",
              "Ustoz haiku nima ekanini oddiy tilda tushuntiradi.",
            ],
          },
          {
            title: "Speaking: sayyoh bilan intervyu",
            minutes: 15,
            points: [
              "Speaking 1-mashq: juftlikda rol oʻyini oʻtkaziladi.",
              "Har juftlik 3–4 savol beradi va javob oladi.",
              "Ikki juftlik oʻyinchoq mikrofon bilan sinf oldida koʻrsatadi.",
            ],
          },
          {
            title: "Harakatli tanaffus",
            minutes: 10,
            points: [
              "Fasllar qoʻshigʻi harakatlar bilan aytiladi.",
              "Har fasl uchun bitta ob-havo soʻzi baland aytiladi.",
            ],
          },
          {
            title: "Writing: birga haiku yozish",
            minutes: 15,
            points: [
              "Writing 1-mashq: ustoz doskada sinf bilan birga bitta haiku tuzadi.",
              "Keyin har bola oʻz haikusini rangli qogʻozga yozadi.",
              "Ustoz aylanib yurib yordam beradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Haikular sinf devoriga osiladi va uch bola oʻqib beradi.",
              "Ustoz yakuniy test haqida qisqa maʼlumot beradi va uy vazifasini tushuntiradi.",
            ],
          },
        ],
        uyga: [
          "Haikuni rasm bilan bezang.",
          "Yakuniy test uchun Unit 17–20 soʻzlarini takrorlang.",
        ],
        ustozga: "Haiku yozishda boʻgʻin sonini qatʼiy talab qilmang — bolalar uchun 3 qatorli qisqa tasvir yetarli. Yozishdan oldin albatta birgalikda bitta namuna tuzing.",
      },
      {
        focus: "End-of-level test (K2)",
        sb: "—",
        maqsad: [
          "Oʻquvchilar Unit 11–20 soʻz va grammatikasini oʻyinli test formatida koʻrsata oladilar.",
          "Oʻquvchilar qisqa audio va rasmli matnni tushunib, topshiriqni bajara oladilar.",
          "Oʻquvchilar ustoz bilan yakkama-yakka qisqa suhbatda oʻzi haqida gapira oladilar.",
        ],
        lugat: [
          "test – nazorat ishi",
          "match – moslamoq",
          "colour – boʻyamoq",
          "circle – aylana ichiga olmoq",
          "yes / no – ha / yoʻq",
          "answer – javob",
          "star – yulduzcha",
          "well done – barakalla",
        ],
        resurslar: ["Markaz yakuniy testi (Unit 11–20, kids formati)", "test audiosi", "rangli qalamlar va yulduzcha stikerlar", "flashcardlar", "taymer"],
        blocks: [
          {
            title: "Warm-up: flashcard va qoʻshiq bilan takror",
            minutes: 10,
            points: [
              "Unit 11–20 flashcardlari tez koʻrsatiladi.",
              "Sevimli qoʻshiq bir marta aytiladi.",
              "Ustoz test topshiriqlari turini bitta namuna bilan koʻrsatadi.",
            ],
          },
          {
            title: "Yozma qism: lugʻat",
            minutes: 15,
            points: [
              "Rasmli moslash va boʻyash topshiriqlari bajariladi.",
              "Ustoz sinfni kuzatib, faqat koʻrsatmani tushuntiradi.",
            ],
          },
          {
            title: "Yozma qism: grammatika",
            minutes: 15,
            points: [
              "Toʻgʻri soʻzni tanlash va gapni toʻldirish topshiriqlari bajariladi.",
              "Vaqt tugashidan oldin ogohlantiriladi.",
            ],
          },
          {
            title: "Listening",
            minutes: 15,
            points: [
              "Qisqa audio ikki marta qoʻyiladi.",
              "Bolalar yes / no va moslash topshiriqlarini bajaradilar.",
            ],
          },
          {
            title: "Reading",
            minutes: 10,
            points: [
              "Rasmli qisqa matn oʻqiladi.",
              "Gaplar toʻgʻri yoki notoʻgʻri deb belgilanadi.",
            ],
          },
          {
            title: "Speaking: ustoz bilan yakkama-yakka",
            minutes: 15,
            points: [
              "Ustoz navbat bilan har bolani chaqirib, oʻzi, oilasi va sevimli hayvoni haqida 4–5 savol beradi.",
              "Qolgan bolalar shu vaqtda rasmli topshiriqni yakunlaydilar.",
            ],
          },
          {
            title: "Yakun: oʻyin shaklida tahlil",
            minutes: 10,
            points: [
              "Ustoz umumiy natijani oʻyin tarzida eʼlon qiladi.",
              "Har bolaga yulduzcha va bitta shaxsiy maslahat beriladi.",
              "Oʻquv yili yakuni tabriklanadi.",
            ],
          },
        ],
        uyga: [
          "Oʻquv yili yakuni: sevimli chant yoki haikuni oila oldida aytib bering.",
          "WB dagi bajarilmagan mashqlarni tugating.",
        ],
        ustozga: "Kids test darsida bolalar hayajonlanadi — testni oʻyin deb atab, bosim oʻtkazmang. Speaking qismini boshqa bolalar chizish bilan band boʻlgan paytda oʻtkazing.",
      },
    ],
  },
];
