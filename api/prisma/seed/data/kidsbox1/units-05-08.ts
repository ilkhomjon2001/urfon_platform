import type { BookUnit } from "../prepare1/types.js";

// Starter — Kids Box 1 (Pupil Book), 5–8-unitlar. Faqat Pupil Book bor: Activity Book, Teacher Book va audio yoʻq.
// Audio trek raqamlari kitobdagidek beriladi; audio boʻlmasa, ustoz oʻzi oʻqib beradi.
export const KB1_UNITS_05_08: BookUnit[] = [
  // ───────────────────────── Unit 5 ─────────────────────────
  {
    unit: 5,
    title: "Unit 5 · Our pets",
    description: "Bolalar uy hayvonlari nomlarini, koʻplikdagi They are … gapini va big, small, clean, dirty, long, short sifatlarini oʻrganadi.",
    objectives: [
      "Olti uy hayvonini nomlab, rasmda koʻrsatib ayta oladi.",
      "They are … bilan bir nechta narsani sifat orqali tasvirlab ayta oladi.",
      "Qisqa e tovushini (ten, red, pets) toʻgʻri talaffuz qilib ayta oladi.",
    ],
    vocabulary: ["bird", "cat", "dog", "fish", "horse", "mouse", "big", "small", "clean", "dirty", "long", "short"],
    grammar: "They are … It is / They are big / small / clean / dirty / long / short. They are not big. Are they short?",
    lessons: [
      {
        focus: "Uy hayvonlari: lugʻat va chant",
        sb: "34–35",
        maqsad: [
          "Oʻquvchilar olti uy hayvonini nomlab, rasmda koʻrsata oladilar.",
          "Oʻquvchilar chantni harakat bilan birga ayta oladilar.",
          "Oʻquvchilar hayvon va sonni eshitib, toʻgʻri rasmni topa oladilar.",
        ],
        lugat: [
          "pet – uy hayvoni",
          "bird – qush",
          "cat – mushuk",
          "dog – it",
          "fish – baliq",
          "horse – ot",
          "mouse – sichqon",
          "They are … – Ular …",
        ],
        resurslar: [
          "SB 34–35",
          "Audio CD2 26, 27, 29, 30",
          "Uy hayvonlari flashcardlari (6 ta) va 1–10 son kartochkalari",
          "Kichik toʻp (Pass the ball uchun)",
          "Doska va rangli markerlar",
        ],
        blocks: [
          {
            title: "Warm-up: oʻtgan unit takrori",
            minutes: 10,
            points: [
              "Salomlashish, sanab chiqish 1–10 (qarsak bilan).",
              "4-unit lugʻati (oila aʼzolari va sifatlar) flashcardlar bilan tez takrorlanadi: ustoz koʻrsatadi, sinf aytadi.",
              "Ustoz sumkadan oʻyinchoq mushuk yoki it rasmini chiqarib, bugungi mavzu uy hayvonlari ekanini aytadi.",
            ],
          },
          {
            title: "Vocabulary: pet show (SB 34, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "1-mashq (CD2 26): Listen and point — bolalar eshitgan hayvonni barmoq bilan koʻrsatadi. Audio boʻlmasa, ustoz soʻzlarni oʻzi aralash tartibda aytadi.",
              "2-mashq (CD2 27): Listen and repeat — har soʻz avval sekin, keyin tez, keyin shivirlab takrorlanadi.",
              "Har hayvonga harakat biriktiriladi: mushuk panjasi, it vovullashi, qush qanoti, baliq suzishi, ot chopishi, sichqon kichik qadamlari.",
            ],
          },
          {
            title: "TPR: flashcard va harakat",
            minutes: 12,
            points: [
              "Ustoz flashcardni koʻrsatadi, bolalar hayvonni aytib harakatini qiladi.",
              "Teskarisi: ustoz faqat harakat qiladi, bolalar soʻzni topadi.",
              "Flashcardlar doskaga yopishtiriladi, bittasi olib qoʻyiladi — bolalar qaysi hayvon yoʻqligini aytadi (What is missing?).",
            ],
          },
          {
            title: "Chant (SB 35, 3-mashq)",
            minutes: 13,
            points: [
              "3-mashq (CD2 29): Say the chant — avval bir marta tinglanadi, bolalar rasmdagi hayvonlarni koʻrsatib boradi.",
              "Chant qatorma-qator ustoz ortidan aytiladi, keyin sinf ikki guruhga boʻlinib navbat bilan aytadi.",
              "Audio boʻlmasa, ustoz ritmni qarsak bilan ushlab, chantni oʻzi aytib beradi.",
            ],
          },
          {
            title: "Listening: sonlar va hayvonlar (SB 35, 4-mashq)",
            minutes: 15,
            points: [
              "Ustoz doskada bitta mushuk va ikkita mushuk chizib, koʻplikda s qoʻshilishini (cats, dogs) koʻrsatadi; mouse soʻzining koʻpligi mice ekanini rasm bilan beradi.",
              "4-mashq (CD2 30): Listen and say the number — bolalar eshitgan rasm raqamini aytadi. Audio boʻlmasa, ustoz rasmni tasvirlab aytadi (masalan, They are cats. They are grey.), bolalar raqamni topadi.",
              "Juftlikda: biri rasmni tasvirlaydi, sherigi raqamni aytadi.",
            ],
          },
          {
            title: "Oʻyin: Pass the ball",
            minutes: 15,
            points: [
              "Bolalar doira boʻlib turadi, musiqa yoki qarsak davomida toʻp uzatiladi.",
              "Toʻxtaganda toʻp qoʻlida qolgan bola ustoz koʻrsatgan flashcarddagi hayvonni aytadi va harakatini koʻrsatadi.",
              "Ikkinchi bosqichda bola hayvon va sonni aytadi: three dogs, two birds.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Chant yana bir marta harakat bilan aytiladi.",
              "Har bola oʻziga yoqqan hayvonni aytadi: I like cats.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Oʻz uy hayvonini (yoki orzu qilgan hayvonini) chizib, ostiga inglizcha nomini yozib kelish.",
          "Olti hayvon nomini oilasiga harakat bilan aytib berish.",
        ],
        ustozga: "Bolalar mouse soʻzining koʻpligini mouses deb aytadi va fish soʻziga s qoʻshadi — ikkalasini ham rasm juftligi bilan bering, qoida sifatida tushuntirmang. Bird va horse soʻzlaridagi r tovushini oʻzbekcha kuchli r bilan aytmaslikka eʼtibor bering.",
      },
      {
        focus: "Sifatlar va They are … (qoʻshiq bilan)",
        sb: "36–37",
        maqsad: [
          "Oʻquvchilar big, small, clean, dirty, long, short sifatlarini harakat bilan ayta oladilar.",
          "Oʻquvchilar It is … va They are … gaplari bilan narsalarni tasvirlay oladilar.",
          "Oʻquvchilar koʻrsatmani tinglab, uy hayvonlari bilan harakat bajara oladilar.",
        ],
        lugat: [
          "big – katta",
          "small – kichik",
          "clean – toza",
          "dirty – iflos",
          "long – uzun",
          "short – kalta",
          "It is … – U (bitta narsa) …",
          "They are … – Ular …",
        ],
        resurslar: [
          "SB 36–37",
          "Audio CD2 31, 32, 34, 35",
          "Sifat juftliklari uchun narsalar: uzun va kalta qalam, katta va kichik kitob, toza va iflos (boʻyalgan) qogʻoz",
          "Uy hayvonlari flashcardlari",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: chant va What is missing?",
            minutes: 10,
            points: [
              "Oʻtgan darsdagi chant (SB 35, 3-mashq) harakat bilan aytiladi.",
              "Hayvon flashcardlari bilan What is missing? oʻyini oʻynaladi.",
              "Uy vazifasidagi rasmlar qisqa koʻrsatiladi: bola rasmni koʻtarib hayvon nomini aytadi.",
            ],
          },
          {
            title: "Vocabulary: sifatlar (SB 36, 5–6-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz real narsalar bilan juftliklarni koʻrsatadi: uzun va kalta qalam, katta va kichik kitob, toza va iflos qogʻoz.",
              "5-mashq (CD2 31): Listen and point — bolalar rasmdagi narsani koʻrsatadi. Audio boʻlmasa, ustoz narsa va sifatni oʻzi aytadi.",
              "6-mashq (CD2 32): Listen and repeat — bitta narsa uchun It is …, bir nechta narsa uchun They are … aytiladi.",
            ],
          },
          {
            title: "TPR: sifatlar harakati",
            minutes: 12,
            points: [
              "Har sifatga harakat: big — qoʻllarni keng ochish, small — barmoqlarni yaqinlashtirish, long — qoʻllarni yonga choʻzish, short — kaftlarni yaqin tutish, clean — yuzni silash, dirty — burunni jiyirish.",
              "Ustoz sifatni aytadi, bolalar harakat qiladi; keyin tezlik oshiriladi.",
              "Qarama-qarshi oʻyin: ustoz big deydi, bolalar small deb javob beradi.",
            ],
          },
          {
            title: "Listen and do the actions (SB 37, 7-mashq)",
            minutes: 13,
            points: [
              "7-mashq (CD2 34): bolalar koʻrsatmani eshitib, rasmdagi bolalar kabi hayvon bilan harakat qiladi (itni silash, baliqqa qarash va h.k.).",
              "Audio boʻlmasa, ustoz koʻrsatmani oʻzi aytib, birinchi marta oʻzi ham harakat qiladi.",
              "Keyin ikki-uch bola ustoz rolida koʻrsatma beradi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Simon says",
            minutes: 10,
            points: [
              "Simon says sifat va hayvon harakatlari bilan oʻynaladi: Simon says be a big dog.",
              "Xato qilgan bola chiqmaydi, balki bir marta sakraydi va oʻyinda davom etadi.",
            ],
          },
          {
            title: "Song (SB 37, 8-mashq)",
            minutes: 17,
            points: [
              "8-mashq (CD2 35): Sing the song — avval tinglanadi, bolalar eshitgan hayvon nomida qoʻl koʻtaradi.",
              "Qoʻshiq qatorma-qator oʻrganiladi, har bir hayvon harakati bilan kuylanadi.",
              "Audio boʻlmasa, ustoz qoʻshiqni tanish ohangda ritm bilan aytadi yoki uni chant qilib oʻtkazadi.",
              "Yakunda qoʻshiq ikki guruhga boʻlib, musobaqa shaklida kuylanadi.",
            ],
          },
          {
            title: "Yakun: tasvirlash va uy vazifasi",
            minutes: 13,
            points: [
              "Ustoz sinfdagi narsalarni koʻrsatadi, bolalar It is long. They are small. kabi gap aytadi.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Uyda bitta katta va bitta kichik narsani topib, rasmini chizish va big / small deb imzolash.",
          "Qoʻshiqni oilaga harakat bilan kuylab berish.",
        ],
        ustozga: "Bolalar koʻplikda ham It is … deydi — bitta narsa uchun bir barmoq, koʻp narsa uchun butun kaft koʻrsatadigan ishora kiriting. Long va short ni big va small bilan chalkashtirmasliklari uchun har doim real narsa bilan koʻrsating.",
      },
      {
        focus: "Monty phonics (e) va hikoya",
        sb: "38–39",
        maqsad: [
          "Oʻquvchilar qisqa e tovushini ten, red, pets soʻzlarida toʻgʻri ayta oladilar.",
          "Oʻquvchilar They are … bilan rasmni tasvirlab, sherigiga topdira oladilar.",
          "Oʻquvchilar hikoyani rasm orqali tushunib, rollarda ijro eta oladilar.",
        ],
        lugat: [
          "ten – oʻn",
          "red – qizil",
          "pet – uy hayvoni",
          "ugly – xunuk",
          "happy – xursand",
          "Number six. – Oltinchi raqam.",
          "guess – taxmin qilmoq",
          "story – hikoya",
        ],
        resurslar: [
          "SB 38–39",
          "Audio CD2 37, 39",
          "Uy hayvonlari va sifat flashcardlari",
          "Hikoya rollari uchun oddiy niqob yoki nomli kartochkalar (Maskman, Marie, Monty)",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: qoʻshiq va sifatlar",
            minutes: 10,
            points: [
              "8-mashqdagi qoʻshiq (SB 37) harakat bilan kuylanadi.",
              "Sifat harakatlari tez takrorlanadi: ustoz aytadi, bolalar koʻrsatadi.",
            ],
          },
          {
            title: "Monty phonics: qisqa e (SB 38, 9-mashq)",
            minutes: 12,
            points: [
              "9-mashq (CD2 37): bolalar ten, red va rasm ostidagi qisqa ibora tovushini tinglaydi. Audio boʻlmasa, ustoz soʻzlarni aniq, ogʻzini koʻrsatib aytadi.",
              "Ustoz doskaga e harfini katta yozadi; bolalar e tovushi bor soʻzni eshitganda qoʻl koʻtaradi (ten, bed, pen, red, cat, dog).",
              "Ibora sekin, tez va shivirlab takrorlanadi; eng aniq aytgan bola Monty yulduzchasini oladi.",
            ],
          },
          {
            title: "Say and guess (SB 38, 10-mashq)",
            minutes: 15,
            points: [
              "Ustoz namuna beradi: bitta rasmni sifatlar bilan tasvirlaydi, bolalar rasm raqami va hayvon nomini aytadi.",
              "10-mashq: juftlikda biri rasmni They are … bilan tasvirlaydi, sherigi raqam va hayvonni topadi; keyin rollar almashadi.",
              "Ustoz aylanib yuradi, gap toʻliq aytilishini (They are small and white) talab qiladi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Run to the card",
            minutes: 8,
            points: [
              "Hayvon flashcardlari xonaning turli burchagiga yopishtiriladi.",
              "Ustoz sifat va hayvonni aytadi (They are dirty dogs), bolalar tegishli kartochka tomonga yuguradi.",
            ],
          },
          {
            title: "Story (SB 39, 11-mashq)",
            minutes: 18,
            points: [
              "Tinglashdan oldin: bolalar rasmlarga qarab, kimlar borligini va qaysi hayvonlar koʻrinishini aytadi.",
              "11-mashq (CD2 39): Listen to the story — bolalar har rasmni eshitganda raqamini koʻrsatib boradi. Audio boʻlmasa, ustoz hikoyani ovozini oʻzgartirib, rollarda oʻqib beradi.",
              "Tushunishni tekshirish: ustoz har rasm boʻyicha oddiy savol beradi (qaysi hayvon? katta yoki kichik?), bolalar bir soʻz bilan javob beradi.",
            ],
          },
          {
            title: "Act out the story (SB 39, 12-mashq)",
            minutes: 17,
            points: [
              "Sinf uch-toʻrt kishilik guruhlarga boʻlinadi, har guruh rollarni taqsimlaydi.",
              "12-mashq: guruhlar hikoyani oʻz soʻzlari va harakatlar bilan ijro etadi; ustoz qiyin joylarda pichirlab yordam beradi.",
              "Ikki-uch guruh sinf oldida chiqadi, qolganlar qarsak bilan qoʻllab-quvvatlaydi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Phonics iborasi yana bir marta aytiladi.",
              "Bolalar unitdagi eng yoqqan soʻzni aytadi; yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Qisqa e tovushli uchta soʻzni (ten, red, pet) rasm bilan chizib kelish.",
          "Hikoyani oilaga rasmlarni koʻrsatib oʻzbekcha yoki inglizcha soʻzlar bilan aytib berish.",
        ],
        ustozga: "Qisqa e tovushini bolalar oʻzbekcha e kabi choʻzib yoki i ga yaqin aytadi — ogʻizni biroz ochib, qisqa aytishni koʻrsating. Act out paytida uyalchan bolalarga soʻzsiz rol (hayvon) bering, ular ham ishtirok etsin.",
      },
    ],
  },

  // ───────────────────────── Unit 6 ─────────────────────────
  {
    unit: 6,
    title: "Unit 6 · My face",
    description: "Bolalar yuz qismlarini, I have got / Have you got …? tuzilmasini, besh sezgini va uy hayvonlariga gʻamxoʻrlik qilishni oʻrganadi.",
    objectives: [
      "Yuz qismlarini nomlab, oʻzida va rasmda koʻrsatib ayta oladi.",
      "I have got … va Have you got …? bilan oʻzini tasvirlab, savol berib ayta oladi.",
      "Besh sezgini va uy hayvoniga qanday gʻamxoʻrlik qilishni oddiy soʻzlar bilan ayta oladi.",
    ],
    vocabulary: ["ears", "eyes", "face", "hair", "mouth", "nose", "teeth", "hear", "see", "smell", "taste", "touch", "feed", "walk"],
    grammar: "I have got … Have you got …? Yes, I have. No, I have not.",
    lessons: [
      {
        focus: "Yuz qismlari: lugʻat va chant",
        sb: "40–41",
        maqsad: [
          "Oʻquvchilar yetti yuz qismini nomlab, oʻzida koʻrsata oladilar.",
          "Oʻquvchilar chantni koʻrsatish harakati bilan ayta oladilar.",
          "Oʻquvchilar notoʻgʻri gapni eshitib, uni toʻgʻrilay oladilar.",
        ],
        lugat: [
          "face – yuz",
          "eye / eyes – koʻz / koʻzlar",
          "ear / ears – quloq / quloqlar",
          "nose – burun",
          "mouth – ogʻiz",
          "hair – soch",
          "teeth – tishlar",
          "monster – maxluq",
        ],
        resurslar: [
          "SB 40–41",
          "Audio CD2 40, 41, 43, 44",
          "Yuz qismlari flashcardlari yoki doskaga chizilgan katta yuz",
          "Kichik koʻzgu (ixtiyoriy)",
          "Doska va rangli markerlar",
        ],
        blocks: [
          {
            title: "Warm-up: uy hayvonlari takrori",
            minutes: 10,
            points: [
              "5-unit chanti (SB 35, 3-mashq) harakat bilan aytiladi.",
              "Say and guess oʻyini qisqa takrorlanadi: ustoz hayvonni tasvirlaydi, bolalar topadi.",
            ],
          },
          {
            title: "Vocabulary: TV monster (SB 40, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "1-mashq (CD2 40): Listen and point — bolalar rasmdagi maxluqning yuz qismini koʻrsatadi. Audio boʻlmasa, ustoz soʻzlarni aralash tartibda aytadi.",
              "2-mashq (CD2 41): Listen and repeat — har soʻz aytilganda bolalar oʻz yuzida shu qismni koʻrsatadi.",
              "Ustoz doskaga katta yuz chizadi, bolalar navbat bilan chiqib bir qismini chizadi va nomini aytadi.",
            ],
          },
          {
            title: "Oʻyin: Touch your …",
            minutes: 12,
            points: [
              "Ustoz Touch your nose deydi, bolalar koʻrsatadi; tezlik asta oshiriladi.",
              "Hazil bosqich: ustoz ataylab boshqa joyni koʻrsatadi, bolalar faqat eshitganiga ishonishi kerak.",
              "Juftlikda: biri buyruq beradi, sherigi bajaradi.",
            ],
          },
          {
            title: "Chant (SB 41, 3-mashq)",
            minutes: 13,
            points: [
              "3-mashq (CD2 43): Say the chant — bolalar tinglab, 1–8-rasmlarni tartib bilan koʻrsatadi.",
              "Chant qatorma-qator aytiladi, har qatorda tegishli yuz qismi koʻrsatiladi.",
              "Audio boʻlmasa, ustoz ritmni stolni urib ushlab, chantni oʻzi aytadi.",
            ],
          },
          {
            title: "Listen and correct (SB 41, 4-mashq)",
            minutes: 15,
            points: [
              "Ustoz rasmdagi maxluq haqida ataylab xato gap aytadi, bolalar No! deb toʻgʻri variantni aytadi (boy yoki girl, rang, katta yoki kichik).",
              "4-mashq (CD2 44): bolalar har gapni eshitib toʻgʻrilaydi. Audio boʻlmasa, ustoz gaplarni oʻzi aytadi.",
              "Juftlikda: biri rasm haqida xato gap aytadi, sherigi toʻgʻrilaydi.",
            ],
          },
          {
            title: "Mini-loyiha: mening maxluqim",
            minutes: 15,
            points: [
              "Har bola oʻz maxluqini chizadi: koʻzlar, quloqlar va tishlar sonini oʻzi tanlaydi.",
              "Rasm ostiga ustoz bilan birga ikki-uch soʻz yoziladi (three eyes, big mouth).",
              "Bolalar juftlikda rasmni koʻrsatib, yuz qismlarini sanab aytadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Touch your … oʻyini yana bir marta tez oʻynaladi.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Maxluq rasmini tugatib, yuz qismlarini inglizcha imzolab kelish.",
          "Oila aʼzolaridan biriga Touch your nose kabi buyruqlar berib oʻynash.",
        ],
        ustozga: "Bolalar eye va ear soʻzlarini chalkashtiradi — har safar koʻz va quloqni koʻrsatib ayting. Teeth va hair soʻzlariga s qoʻshmaslik kerakligini rasm bilan eslatib turing.",
      },
      {
        focus: "I have got va Have you got …? (qoʻshiq bilan)",
        sb: "42–43",
        maqsad: [
          "Oʻquvchilar I have got … bilan oʻz tashqi koʻrinishini tasvirlay oladilar.",
          "Oʻquvchilar Have you got …? savolini berib, Yes, I have yoki No, I have not deb javob bera oladilar.",
          "Oʻquvchilar sherigi tasvirini eshitib, maxluqni chiza oladilar.",
        ],
        lugat: [
          "I have got … – Menda … bor",
          "Have you got …? – Senda … bormi?",
          "Yes, I have. – Ha, bor.",
          "No, I have not. – Yoʻq, yoʻq.",
          "yellow face – sariq yuz",
          "very ugly – juda xunuk",
          "draw – chizmoq",
        ],
        resurslar: [
          "SB 42–43",
          "Audio CD2 46, 47, 49",
          "Yuz qismlari flashcardlari",
          "Oq qogʻoz va rangli qalamlar",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: chant va Touch your …",
            minutes: 10,
            points: [
              "3-mashq chanti (SB 41) koʻrsatish harakati bilan aytiladi.",
              "Uy vazifasidagi maxluqlar koʻrsatiladi, ustoz har biri haqida bitta savol beradi.",
            ],
          },
          {
            title: "Grammar: I have got (SB 42, 5–6-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz oʻzini koʻrsatib gapiradi: I have got brown eyes. I have got short hair. — doskaga I have got … va Have you got …? yoziladi.",
              "5-mashq (CD2 46): Listen and point — bolalar gapirayotgan maxluqni koʻrsatadi. Audio boʻlmasa, ustoz maxluqlar ovozida oʻzi gapiradi.",
              "6-mashq (CD2 47): Listen and repeat — savol va javoblar xor bilan, keyin juftlikda takrorlanadi.",
            ],
          },
          {
            title: "Oʻyin: Find someone who …",
            minutes: 13,
            points: [
              "Bolalar sinf boʻylab yurib Have you got brown eyes? / Have you got long hair? savollarini beradi.",
              "Yes, I have degan bolaning ismini ustoz bergan kichik varaqqa (rasmli) yozadi yoki belgi qoʻyadi.",
              "Yakunda ustoz nechta bolaning koʻzi jigarrang ekanini birga sanaydi.",
            ],
          },
          {
            title: "Song (SB 43, 7-mashq)",
            minutes: 15,
            points: [
              "7-mashq (CD2 49): Sing the song — birinchi tinglashda bolalar eshitgan yuz qismini koʻrsatadi.",
              "Qoʻshiq qismlarga boʻlib oʻrganiladi, harakatlar bilan kuylanadi.",
              "Audio boʻlmasa, ustoz qoʻshiqni chant sifatida ritm bilan aytadi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Monster walk",
            minutes: 7,
            points: [
              "Ustoz maxluq harakatini aytadi (big monster, small monster, happy monster), bolalar joyida shunday yuradi.",
              "Toʻxta degan buyruqda hamma qotib qoladi.",
            ],
          },
          {
            title: "Say and listen. Draw (SB 43, 8-mashq)",
            minutes: 20,
            points: [
              "Ustoz namuna beradi: I have got three eyes. I have got a big mouth. — bolalar doskada birga chizadi.",
              "8-mashq: juftlikda biri maxluqni I have got … bilan tasvirlaydi, sherigi koʻrmasdan chizadi.",
              "Rollar almashadi; oxirida rasmlar solishtiriladi — bir xilmi?",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ikki-uch juftlik rasmini sinfga koʻrsatib, maxluqni tasvirlaydi.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Oʻzining portretini chizib, ostiga ustoz bilan yozilgan namuna asosida ikki gap yozish (I have got …).",
          "Oiladan kimgadir Have you got …? deb uchta savol berib, javobini eslab kelish.",
        ],
        ustozga: "Bolalar I have got oʻrniga I am got yoki faqat I got deydi — doskada have soʻzini boshqa rang bilan ajrating. Qisqa javobda Yes, I have got deb uzaytirmasliklari kerak, Yes, I have yetarli.",
      },
      {
        focus: "Monty phonics (gr, br, fr), oʻyin va hikoya",
        sb: "44–45",
        maqsad: [
          "Oʻquvchilar gr, br, fr qoʻshma tovushlarini toʻgʻri ayta oladilar.",
          "Oʻquvchilar Have you got …? savollari bilan sherigining qatorini topa oladilar.",
          "Oʻquvchilar hikoyani tinglab, gaplarga yes yoki no deb javob bera oladilar.",
        ],
        lugat: [
          "green – yashil",
          "brown – jigarrang",
          "frog – qurbaqa",
          "bike – velosiped",
          "train – poyezd",
          "Have you got a …? – Senda … bormi?",
          "yes / no – ha / yoʻq",
        ],
        resurslar: [
          "SB 44–45",
          "Audio CD2 51, 54, 55",
          "Yes va no kartochkalari",
          "Oʻyinchoq flashcardlari (3-unitdan)",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: qoʻshiq va savol-javob",
            minutes: 10,
            points: [
              "7-mashqdagi qoʻshiq (SB 43) kuylanadi.",
              "Ustoz bir necha bolaga Have you got a brother? / Have you got a bike? deb savol beradi.",
            ],
          },
          {
            title: "Monty phonics: gr, br, fr (SB 44, 9-mashq)",
            minutes: 12,
            points: [
              "9-mashq (CD2 51): green, brown, frog soʻzlari va ibora tinglanadi. Audio boʻlmasa, ustoz soʻzlarni boʻgʻinlab aytadi.",
              "Ustoz ikki tovush qanday qoʻshilishini qoʻl harakati bilan koʻrsatadi (g + r = gr).",
              "Ibora avval sekin, keyin tez aytiladi; qurbaqa kabi sakrab aytish oʻyini.",
            ],
          },
          {
            title: "Play the game. Ask and guess (SB 44, 10-mashq)",
            minutes: 16,
            points: [
              "3-unit oʻyinchoqlari flashcardlar bilan qisqa takrorlanadi (bike, car, ball, train).",
              "Ustoz namuna koʻrsatadi: 1–4-qatorlardan birini yashirin tanlaydi, bolalar Have you got a …? deb savol berib topadi.",
              "10-mashq: juftlikda bir bola qator tanlaydi, sherigi savollar bilan qaysi qator ekanini topadi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Frog jump",
            minutes: 7,
            points: [
              "Ustoz soʻz aytadi: gr, br yoki fr bilan boshlansa bolalar qurbaqadek sakraydi, boshlanmasa joyida turadi.",
              "Soʻzlar: green, brown, frog, red, grey, bird, friend.",
            ],
          },
          {
            title: "Story (SB 45, 11-mashq)",
            minutes: 18,
            points: [
              "Tinglashdan oldin: bolalar rasmlardagi maxluqni koʻrib, uning yuz qismlarini aytadi va hikoyada nima boʻlishini taxmin qiladi.",
              "11-mashq (CD2 54): Listen to the story — har rasm raqami koʻrsatib boriladi. Audio boʻlmasa, ustoz hikoyani rollarda, ovozini oʻzgartirib oʻqiydi.",
              "Tushunish: ustoz har rasm boʻyicha oddiy savol beradi, bolalar bir-ikki soʻz bilan javob beradi.",
            ],
          },
          {
            title: "Listen and say yes or no (SB 45, 12-mashq) va act out",
            minutes: 17,
            points: [
              "12-mashq (CD2 55): bolalar gapni eshitib yes yoki no kartochkasini koʻtaradi. Audio boʻlmasa, ustoz hikoya haqida toʻgʻri va notoʻgʻri gaplarni oʻzi aytadi.",
              "Uch kishilik guruhlarda hikoyaning ikki-uch rasmi harakat va qisqa iboralar bilan ijro etiladi.",
              "Bitta guruh sinf oldida chiqadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Phonics iborasi yana bir marta aytiladi.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Yashil va jigarrang qurbaqa chizib, ostiga green, brown, frog deb yozish.",
          "Oʻz oʻyinchoqlaridan uchtasini chizib, I have got a … deb imzolash.",
        ],
        ustozga: "Qoʻshma tovushlarda bolalar orasiga unli qoʻshib gi-reen yoki fi-rog deydi — ikki tovushni bir nafasda aytishni sekin mashq qildiring. Oʻyinda savol toʻliq aytilishini talab qiling, faqat soʻz aytish bilan cheklanmasin.",
      },
      {
        focus: "Marie science: sezgilar va Trevor values: uy hayvoniga gʻamxoʻrlik",
        sb: "46–47",
        maqsad: [
          "Oʻquvchilar besh sezgini nomlab, tegishli aʼzo bilan bogʻlay oladilar.",
          "Oʻquvchilar uy hayvoniga gʻamxoʻrlik qilish harakatlarini (brush, feed, walk, wash) ayta oladilar.",
          "Oʻquvchilar hayvonlarga mehribon boʻlish nega muhimligini oʻz hayotidan misol bilan tushuntira oladilar.",
        ],
        lugat: [
          "see – koʻrmoq",
          "hear – eshitmoq",
          "smell – hidlamoq",
          "taste – tatib koʻrmoq",
          "touch – ushlamoq, tegmoq",
          "brush – taramoq",
          "feed – ovqat bermoq",
          "walk – sayr qildirmoq",
          "wash – yuvmoq",
        ],
        resurslar: [
          "SB 46–47",
          "Audio CD2 56, 57",
          "Sezgi uchun narsalar: olma yoki limon boʻlagi, gul, qoʻngʻiroq, yumshoq mato, rangli rasm",
          "Koʻz bogʻlash uchun roʻmolcha",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: yuz qismlari",
            minutes: 10,
            points: [
              "Touch your … oʻyini yuz qismlari bilan oʻynaladi.",
              "3-mashq chanti (SB 41) bir marta aytiladi.",
            ],
          },
          {
            title: "Marie science: The senses (SB 46, 1-mashq)",
            minutes: 15,
            points: [
              "Ustoz koʻz, quloq, burun, ogʻiz va qoʻlni koʻrsatib, sezgi feʼllarini harakat bilan beradi: see, hear, smell, taste, touch.",
              "1-mashq (CD2 56): Listen and point — bolalar markaziy aʼzo va unga bogʻlangan rasmni koʻrsatadi. Audio boʻlmasa, ustoz rasm va sezgini oʻzi aytadi.",
            ],
          },
          {
            title: "Point and say the sense (SB 46, 2-mashq) va sezgi tajribasi",
            minutes: 17,
            points: [
              "2-mashq: juftlikda biri rasmni koʻrsatadi, sherigi sezgini aytadi (gul — smell, qoʻshiq aytayotgan qush — hear).",
              "Sezgi tajribasi: koʻzi bogʻlangan bola narsani ushlaydi, hidlaydi yoki tovushini eshitadi va qaysi sezgi ishlaganini aytadi.",
              "Sinf har tajribadan keyin I can smell / I can hear deb takrorlaydi (can oldingi unitlardan tanish boʻlmasa, faqat feʼlni aytish yetarli).",
            ],
          },
          {
            title: "Trevor values: Look after pets (SB 47, 3-mashq)",
            minutes: 13,
            points: [
              "Ustoz rasmlarni koʻrsatib, brush, feed, walk, wash harakatlarini beradi.",
              "3-mashq (CD2 57): Listen and say the number — bolalar eshitgan harakat qaysi rasmda ekanini aytadi. Audio boʻlmasa, ustoz harakatni aytadi (Walk the dog.), bolalar raqamni topadi.",
            ],
          },
          {
            title: "Do the actions. Guess (SB 47, 4-mashq)",
            minutes: 12,
            points: [
              "4-mashq: bola soʻzsiz harakat koʻrsatadi (itni sayr qildirish, baliqqa ovqat berish), sinf inglizcha topadi.",
              "Toʻgʻri topgan bola keyingi harakatni koʻrsatadi.",
            ],
          },
          {
            title: "Qadriyat muhokamasi: hayvonlarga mehr",
            minutes: 13,
            points: [
              "Oʻzbekcha suhbat: Uyingizda hayvon bormi? Unga kim ovqat beradi? Koʻchadagi mushuk yoki itga qanday munosabatda boʻlamiz?",
              "Ustoz hayotiy misol keltiradi: suv idishini unutib qoʻyilgan qushcha yoki yozda suvsiz qolgan it — hayvon oʻzi soʻray olmaydi, shuning uchun unga biz gʻamxoʻrlik qilamiz.",
              "Har bola bir gap bilan vaʼda beradi: I feed my cat. yoki I walk my dog. (hayvoni boʻlmasa, qoʻshnisining hayvoni yoki orzu qilgan hayvoni haqida).",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Besh sezgi feʼli va toʻrt gʻamxoʻrlik feʼli harakat bilan tez takrorlanadi.",
              "Yulduzcha bilan baholash; keyingi dars oʻyin-test boʻlishi aytiladi.",
            ],
          },
        ],
        uyga: [
          "Uy hayvoniga (yoki oʻyinchoq hayvonga) gʻamxoʻrlik qilayotgan oʻzini chizib, feed / walk / brush / wash deb imzolash.",
          "1–6-unitlar flashcardlarini (yoki rasmlarini) koʻrib, soʻzlarni oilaga aytib berish.",
        ],
        ustozga: "Sezgi tajribasida ovqat ishlatsangiz, bolalarda allergiya yoʻqligini oldindan soʻrang. Qadriyat muhokamasi oʻzbekcha boʻlishi mumkin, lekin har bola oxirida bitta inglizcha gap aytsin.",
      },
      {
        focus: "Mid-level test (1–6-unitlar)",
        sb: "—",
        maqsad: [
          "Oʻquvchilar 1–6-unitlar lugʻatini (sonlar, maktab buyumlari, oʻyinchoqlar, oila, uy hayvonlari, yuz) rasmli topshiriqlarda koʻrsata oladilar.",
          "Oʻquvchilar qisqa tinglash va rasmli matn boʻyicha topshiriq bajara oladilar.",
          "Oʻquvchilar ustoz bilan yakkama-yakka suhbatda oʻzi, oilasi va tashqi koʻrinishi haqida gapira oladilar.",
        ],
        lugat: [
          "listen – tinglamoq",
          "look – qaramoq",
          "match – moslamoq",
          "colour – boʻyamoq",
          "tick – belgi qoʻymoq",
          "Where is …? – … qayerda?",
          "Who is he? – U kim?",
          "I have got … – Menda … bor",
        ],
        resurslar: [
          "Markaz testi (1–6-unitlar): rasmli yozma varaqlar",
          "Test tinglash qismi uchun audio yoki ustoz oʻqiydigan matn",
          "Rangli qalamlar",
          "Speaking uchun rasm kartochkalari (oila, hayvonlar, oʻyinchoqlar, yuz)",
          "Yulduzcha stikerlar va baholash jadvali",
        ],
        blocks: [
          {
            title: "Warm-up va topshiriq turlarini koʻrsatish",
            minutes: 10,
            points: [
              "Sevimli chant yoki qoʻshiq bilan qisqa takror (masalan, 5-unit chanti).",
              "Ustoz har topshiriq turini doskada bitta namuna bilan koʻrsatadi: moslash, boʻyash, belgi qoʻyish.",
              "Bolalarga bu musobaqa-oʻyin ekani, har kim yulduzcha olishi aytiladi.",
            ],
          },
          {
            title: "Lugʻat: rasm va soʻzni moslash",
            minutes: 15,
            points: [
              "Topshiriqlar: sonlar 1–10, ranglar, maktab buyumlari, oʻyinchoqlar, oila aʼzolari, uy hayvonlari va yuz qismlari rasmlarini soʻz bilan moslash.",
              "Ustoz sinf boʻylab yurib, faqat topshiriqni tushunmagan bolaga oʻzbekcha tushuntiradi, javobni aytmaydi.",
            ],
          },
          {
            title: "Grammatika: toʻgʻri soʻzni tanlash",
            minutes: 12,
            points: [
              "Rasmga qarab ikki variantdan birini doiraga olish: He is / She is, It is / They are, in / on / under, I have got / Have you got.",
              "Ustoz har gapni ovoz chiqarib bir marta oʻqib beradi, chunki bolalar hali sekin oʻqiydi.",
            ],
          },
          {
            title: "Listening: rasmli tinglash va moslash",
            minutes: 15,
            points: [
              "Ustoz (yoki audio) qisqa gaplarni ikki martadan, pauza bilan aytadi: rang, son, hayvon, yuz qismi.",
              "Bolalar rasmni boʻyaydi (masalan, qizil sichqonni), rasmga belgi qoʻyadi yoki ism bilan chiziq tortib moslaydi.",
            ],
          },
          {
            title: "Reading: rasmli qisqa gaplar",
            minutes: 13,
            points: [
              "Uch-toʻrt qisqa gap (masalan, maxluqning koʻzlari va soch rangi haqida) oʻqiladi, bolalar mos rasmni tanlaydi.",
              "Rasm haqidagi gapga yes yoki no belgisi qoʻyiladi.",
            ],
          },
          {
            title: "Speaking: ustoz bilan yakkama-yakka",
            minutes: 15,
            points: [
              "Ustoz har bola bilan 1–2 daqiqa suhbatlashadi: What is your name? How old are you? Who is he? Have you got a pet? Where is the ball? — rasm kartochkalari bilan.",
              "Qolgan bolalar shu vaqtda oʻz maxluqini chizib, yuz qismlarini imzolaydi.",
              "Ustoz jadvalga uch belgi qoʻyadi: tushundi, soʻz bilan javob berdi, toʻliq gap aytdi.",
            ],
          },
          {
            title: "Yakun: oʻyin shaklida tahlil",
            minutes: 10,
            points: [
              "Eng koʻp xato qilingan uch-toʻrt savol Pass the ball oʻyini orqali birga qayta ishlanadi.",
              "Har bolaga yulduzcha va bitta aniq maslahat beriladi; hech kim past natija uchun qoralanmaydi.",
            ],
          },
        ],
        uyga: [
          "Ustoz belgilagan oʻnta soʻz uchun kichik flashcard yasash (bir tomonda rasm, bir tomonda soʻz).",
          "Testda qiyin boʻlgan bitta topshiriqni uyda ota-ona bilan qayta bajarish.",
        ],
        ustozga: "Bolalar oldida test soʻzini koʻp ishlatmang — buni oʻyin yoki musobaqa deb ataing. Speaking qismida bola jim qolsa, savolni rasm bilan qayta bering yoki tanlov bering (Is it a cat or a dog?).",
      },
    ],
  },

  // ───────────────────────── Unit 7 ─────────────────────────
  {
    unit: 7,
    title: "Unit 7 · Wild animals",
    description: "Bolalar yovvoyi hayvonlar va tana aʼzolari nomlarini hamda They have got / They have not got tuzilmasini oʻrganadi.",
    objectives: [
      "Yetti yovvoyi hayvonni nomlab, harakati bilan koʻrsatib ayta oladi.",
      "They have got … va They have not got … bilan hayvonlarni tasvirlab ayta oladi.",
      "Have they got …? savolini berib, qisqa javob bilan ayta oladi.",
    ],
    vocabulary: ["crocodile", "elephant", "giraffe", "hippo", "monkey", "snake", "tiger", "arm", "foot / feet", "hand", "leg", "tail"],
    grammar: "They have got / They have not got arms / feet / hands / legs / tails. Have they got long legs? Yes, they have. No, they have not.",
    lessons: [
      {
        focus: "Yovvoyi hayvonlar: lugʻat va chant",
        sb: "48–49",
        maqsad: [
          "Oʻquvchilar yetti yovvoyi hayvonni nomlab, rasmda koʻrsata oladilar.",
          "Oʻquvchilar chantni hayvon harakatlari bilan ayta oladilar.",
          "Oʻquvchilar rasm boʻyicha oddiy savollarga javob bera oladilar.",
        ],
        lugat: [
          "wild animal – yovvoyi hayvon",
          "crocodile – timsoh",
          "elephant – fil",
          "giraffe – jirafa",
          "hippo – begemot",
          "monkey – maymun",
          "snake – ilon",
          "tiger – yoʻlbars",
        ],
        resurslar: [
          "SB 48–49",
          "Audio CD3 2, 3, 5, 6",
          "Yovvoyi hayvonlar flashcardlari",
          "Uy hayvonlari flashcardlari (solishtirish uchun)",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: uy hayvonlari va yuz qismlari",
            minutes: 10,
            points: [
              "Uy hayvonlari flashcardlari bilan What is missing? oʻyini.",
              "Ustoz yovvoyi hayvonlar rasmi bor kitob yoki plakatni koʻrsatib, bolalar biladigan hayvonlarni oʻzbekcha aytishini soʻraydi.",
            ],
          },
          {
            title: "Vocabulary: animal book (SB 48, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "1-mashq (CD3 2): Listen and point — bolalar rasmdagi hayvonni koʻrsatadi. Audio boʻlmasa, ustoz nomlarni aralash tartibda aytadi.",
              "2-mashq (CD3 3): Listen and repeat — soʻzlar boʻgʻinlab qarsak bilan aytiladi (cro-co-dile, e-le-phant).",
              "Har hayvonga harakat: fil — qoʻl bilan xartum, jirafa — boʻyni choʻzish, timsoh — ogʻizni qoʻl bilan ochib yopish, ilon — qoʻlni toʻlqinlantirish.",
            ],
          },
          {
            title: "Oʻyin: Pet or wild?",
            minutes: 10,
            points: [
              "Ustoz uy va yovvoyi hayvon kartochkalarini aralashtirib koʻrsatadi.",
              "Uy hayvoni boʻlsa bolalar oʻtiradi, yovvoyi boʻlsa oʻrnidan turib hayvon nomini aytadi.",
            ],
          },
          {
            title: "Chant with actions (SB 49, 3-mashq)",
            minutes: 15,
            points: [
              "3-mashq (CD3 5): Say the chant. Do the actions — avval tinglab, rasmdagi hayvonlar koʻrsatiladi.",
              "Chant qatorma-qator aytiladi, har hayvon harakati bilan.",
              "Audio boʻlmasa, ustoz ritmni qarsak bilan ushlab chantni aytadi; ikkinchi marta bolalar yolgʻiz aytadi.",
            ],
          },
          {
            title: "Listen and point. Answer (SB 49, 4-mashq)",
            minutes: 15,
            points: [
              "4-mashq (CD3 6): bolalar eshitgan hayvonni koʻrsatib, savolga javob beradi (nechta? qanday rangda? katta yoki kichik?). Audio boʻlmasa, ustoz savollarni oʻzi beradi.",
              "Ustoz javobni They are … shaklida takrorlaydi, bolalar ortidan aytadi.",
              "Juftlikda: biri How many tigers? kabi savol beradi, sherigi rasmdan sanab javob beradi.",
            ],
          },
          {
            title: "Oʻyin: Animal Bingo",
            minutes: 15,
            points: [
              "Har bola varaqni toʻrtga boʻlib, toʻrtta yovvoyi hayvonni kichik qilib chizadi (yoki nomini yozadi).",
              "Ustoz hayvon nomlarini aytadi, bolalar oʻzida bor rasmni oʻchiradi; birinchi toʻldirgan bola Bingo! deydi va hayvonlarini aytadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Chant harakat bilan yana bir marta aytiladi.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Eng yoqqan yovvoyi hayvonni chizib, nomini inglizcha yozib kelish.",
          "Chantni oilaga harakat bilan aytib berish.",
        ],
        ustozga: "Hippo va crocodile kabi uzun soʻzlarda urgʻu xato tushadi — boʻgʻinlab, qarsak bilan mashq qildiring. Harakatli oʻyinlarda sinf shovqini oshadi, shuning uchun bir tovushli toʻxtatish belgisini (qoʻngʻiroq yoki qarsak) oldindan kelishib oling.",
      },
      {
        focus: "Tana aʼzolari va They have got (qoʻshiq bilan)",
        sb: "50–51",
        maqsad: [
          "Oʻquvchilar arm, hand, leg, foot, feet, tail soʻzlarini oʻzida va rasmda koʻrsata oladilar.",
          "Oʻquvchilar They have got … va They have not got … bilan hayvonlarni tasvirlay oladilar.",
          "Oʻquvchilar What am I? oʻyinida hayvonni harakat bilan koʻrsatib, topdira oladilar.",
        ],
        lugat: [
          "arm – qoʻl (yelkadan)",
          "hand – kaft, qoʻl",
          "leg – oyoq",
          "foot / feet – oyoq panjasi / panjalari",
          "tail – dum",
          "They have got … – Ularda … bor",
          "They have not got … – Ularda … yoʻq",
          "What am I? – Men kimman?",
        ],
        resurslar: [
          "SB 50–51",
          "Audio CD3 7, 8, 10",
          "Yovvoyi hayvonlar va tana aʼzolari flashcardlari",
          "Doska va rangli markerlar",
        ],
        blocks: [
          {
            title: "Warm-up: chant va Bingo takrori",
            minutes: 10,
            points: [
              "3-mashq chanti (SB 49) harakat bilan aytiladi.",
              "Ustoz hayvonni harakat bilan koʻrsatadi, bolalar nomini aytadi.",
            ],
          },
          {
            title: "Vocabulary va grammar (SB 50, 5–6-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz oʻzida koʻrsatadi: arm, hand, leg, foot; maymun rasmida tail. Bolalar Touch your … bilan takrorlaydi.",
              "5-mashq (CD3 7): Listen and point — bolalar eshitgan tana aʼzosi va hayvonni koʻrsatadi. Audio boʻlmasa, ustoz gaplarni oʻzi aytadi.",
              "6-mashq (CD3 8): Listen and repeat — doskaga ikki ustun: They have got (belgi) va They have not got (xoch); misol: Snakes have not got legs.",
            ],
          },
          {
            title: "Oʻyin: True or false stand up",
            minutes: 12,
            points: [
              "Ustoz hayvon haqida gap aytadi (Elephants have got big ears. Snakes have got arms.).",
              "Toʻgʻri boʻlsa bolalar turadi, notoʻgʻri boʻlsa oʻtiradi va toʻgʻrisini aytishga harakat qiladi.",
            ],
          },
          {
            title: "Song (SB 51, 7-mashq)",
            minutes: 15,
            points: [
              "7-mashq (CD3 10): Sing the song — birinchi tinglashda bolalar eshitgan hayvon nomida qoʻl koʻtaradi.",
              "Sinf toʻrt guruhga (hayvonlar) boʻlinadi, har guruh oʻz hayvoni qismida turib harakat qiladi.",
              "Audio boʻlmasa, ustoz qoʻshiqni ritm bilan chant qilib aytadi.",
            ],
          },
          {
            title: "Act it out and say (SB 51, 8-mashq)",
            minutes: 15,
            points: [
              "Ustoz namuna: filni harakat bilan koʻrsatib What am I? deb soʻraydi, bolalar You are an elephant deb javob beradi.",
              "8-mashq: bolalar navbat bilan hayvonni koʻrsatadi, sinf topadi; keyin kichik guruhlarda davom etadi.",
              "an elephant va a tiger farqi eshitish orqali eslatiladi.",
            ],
          },
          {
            title: "Mini-loyiha: aralash hayvon",
            minutes: 13,
            points: [
              "Har bola ikki hayvonni qoʻshib gʻalati hayvon chizadi (masalan, filning quloqlari va ilonning dumi).",
              "Ustoz bilan birga bitta gap yoziladi: It has got … yoki They have got … (bolaning darajasiga qarab).",
              "Juftlikda rasmni koʻrsatib, qaysi aʼzo qaysi hayvondan ekanini aytadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Qoʻshiq yana bir marta kuylanadi.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Aralash hayvon rasmini tugatib, tana aʼzolarini imzolash.",
          "Oilaga ikki gap aytib berish: Snakes have not got legs. Monkeys have got tails.",
        ],
        ustozga: "Foot va feet notoʻgʻri koʻpligini bolalar foots deb aytadi — rasm juftligi bilan qayta-qayta koʻrsating. They have got va They are ni chalkashtirmasliklari uchun doskada ikki xil rang ishlating.",
      },
      {
        focus: "Monty phonics (i), oʻyin va hikoya",
        sb: "52–53",
        maqsad: [
          "Oʻquvchilar qisqa i tovushini fish, big, six soʻzlarida toʻgʻri ayta oladilar.",
          "Oʻquvchilar Have they got …? savolini berib, qisqa javob bera oladilar.",
          "Oʻquvchilar hikoyani tinglab, rollarda ijro eta oladilar.",
        ],
        lugat: [
          "fish – baliq",
          "big – katta",
          "six – olti",
          "Have they got …? – Ularda … bormi?",
          "Yes, they have. – Ha, bor.",
          "No, they have not. – Yoʻq, yoʻq.",
          "head – bosh",
          "nose – burun",
        ],
        resurslar: [
          "SB 52–53",
          "Audio CD3 12, 14",
          "Yovvoyi hayvonlar flashcardlari",
          "Hikoya rollari uchun nomli kartochkalar yoki oddiy niqoblar",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: qoʻshiq va What am I?",
            minutes: 10,
            points: [
              "7-mashqdagi qoʻshiq (SB 51) harakat bilan kuylanadi.",
              "What am I? oʻyini ikki-uch marta oʻynaladi.",
            ],
          },
          {
            title: "Monty phonics: qisqa i (SB 52, 9-mashq)",
            minutes: 12,
            points: [
              "9-mashq (CD3 12): fish, big va ibora tinglanadi. Audio boʻlmasa, ustoz soʻzlarni aniq aytadi.",
              "Bolalar i tovushi bor soʻzda qoʻl koʻtaradi: six, big, fish, pink, dog, sit, cat.",
              "Ibora sekin, tez va shivirlab takrorlanadi.",
            ],
          },
          {
            title: "Play the game. Ask and answer (SB 52, 10-mashq)",
            minutes: 16,
            points: [
              "Ustoz jadvaldagi soʻzlarni tushuntiradi: big / small (heads, ears, feet, mouths), short / long (tails, noses, legs, arms).",
              "Ustoz yashirin bitta hayvonni tanlaydi, bolalar Have they got small ears? kabi savollar bilan topadi.",
              "10-mashq: juftlikda biri hayvon tanlaydi, sherigi savollar berib topadi; rollar almashadi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Jungle walk",
            minutes: 7,
            points: [
              "Ustoz hayvon nomini aytadi, bolalar oʻsha hayvon kabi sinf boʻylab yuradi.",
              "Timsoh degan soʻzda hamma joyida qotib qoladi.",
            ],
          },
          {
            title: "Story (SB 53, 11-mashq)",
            minutes: 18,
            points: [
              "Tinglashdan oldin: bolalar rasmlarda qaysi hayvonlarni koʻrayotganini aytadi va qahramonlar nima qilishini taxmin qiladi.",
              "11-mashq (CD3 14): Listen to the story — har rasm raqami koʻrsatib boriladi. Audio boʻlmasa, ustoz hikoyani ovozini oʻzgartirib, rollarda oʻqiydi.",
              "Tushunish: ustoz har rasm boʻyicha savol beradi (Who is this? Is it big?), bolalar qisqa javob beradi.",
            ],
          },
          {
            title: "Act out the story (SB 53, 12-mashq)",
            minutes: 17,
            points: [
              "Toʻrt-besh kishilik guruhlarda rollar taqsimlanadi (qahramonlar va hayvonlar).",
              "12-mashq: guruhlar hikoyani harakat va oʻz soʻzlari bilan ijro etadi; ustoz qiyin iboralarda yordam beradi.",
              "Ikki guruh sinf oldida chiqadi, sinf qarsak bilan qoʻllaydi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Phonics iborasi yana bir marta aytiladi.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Oltita katta baliq chizib, ostiga ibora qismini (six big fish) yozish.",
          "Bir yovvoyi hayvon haqida ikki gap tayyorlash: They have got … They have not got …",
        ],
        ustozga: "Qisqa i ni bolalar choʻzib ii deb aytadi — fish va feet farqini ogʻiz harakati bilan koʻrsating. Oʻyinda savolni Have they got …? bilan boshlash qiyin, doskada savol qolipini qoldiring.",
      },
    ],
  },

  // ───────────────────────── Unit 8 ─────────────────────────
  {
    unit: 8,
    title: "Unit 8 · My clothes",
    description: "Bolalar kiyim nomlarini, He / She has got … tuzilmasini, hayvonlarning yashash joylarini va tabiatni sevishni oʻrganadi hamda 5–8-unitlarni takrorlaydi.",
    objectives: [
      "Olti kiyim nomini aytib, rang bilan tasvirlab ayta oladi.",
      "He has got … / She has not got … bilan boshqa odamning kiyimini tasvirlab ayta oladi.",
      "Hayvon qayerda yashashini (forest, plain, river) va tabiatni qanday asrashni oddiy soʻzlar bilan ayta oladi.",
    ],
    vocabulary: ["jacket", "shoes", "skirt", "socks", "trousers", "T-shirt", "forest", "plain", "river", "happy", "sad"],
    grammar: "He / She has got … He / She has not got … Has Simon got my red trousers?",
    lessons: [
      {
        focus: "Kiyimlar: lugʻat va chant",
        sb: "54–55",
        maqsad: [
          "Oʻquvchilar olti kiyim nomini aytib, rasmda koʻrsata oladilar.",
          "Oʻquvchilar chantni ayta oladilar.",
          "Oʻquvchilar kiyim va rang tasvirini eshitib, toʻgʻri bolani topa oladilar.",
        ],
        lugat: [
          "clothes – kiyimlar",
          "jacket – kurtka",
          "shoes – tufli, oyoq kiyim",
          "skirt – yubka",
          "socks – paypoq",
          "trousers – shim",
          "T-shirt – futbolka",
          "put on – kiymoq",
        ],
        resurslar: [
          "SB 54–55",
          "Audio CD3 15, 16, 18, 19",
          "Kiyim flashcardlari va real kiyimlar (kurtka, paypoq, futbolka)",
          "Rang kartochkalari",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: yovvoyi hayvonlar takrori",
            minutes: 10,
            points: [
              "7-unit chanti (SB 49, 3-mashq) harakat bilan aytiladi.",
              "Ranglar rang kartochkalari bilan tez takrorlanadi — bugun ular kiyimlar bilan kerak boʻladi.",
            ],
          },
          {
            title: "Vocabulary: messy bedroom (SB 54, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz sumkadan real kiyimlarni birma-bir chiqaradi, bolalar nomini ortidan takrorlaydi.",
              "1-mashq (CD3 15): Listen and point — bolalar rasmdagi kiyimni koʻrsatadi. Audio boʻlmasa, ustoz nomlarni aralash tartibda aytadi.",
              "2-mashq (CD3 16): Listen and repeat — trousers va shoes doim koʻplikda ekanini ikki barmoq ishorasi bilan koʻrsating.",
            ],
          },
          {
            title: "TPR: Put on your …",
            minutes: 12,
            points: [
              "Ustoz Put on your jacket, Take off your shoes deydi, bolalar mim bilan kiyadi yoki yechadi.",
              "Point to your T-shirt / socks buyruqlari bilan bolalar oʻz kiyimini koʻrsatadi.",
            ],
          },
          {
            title: "Chant (SB 55, 3-mashq)",
            minutes: 13,
            points: [
              "3-mashq (CD3 18): Say the chant — bolalar tinglab, rasmdagi kiyimlarni koʻrsatadi.",
              "Chant qatorma-qator aytiladi, keyin ikki guruhga boʻlib navbat bilan.",
              "Audio boʻlmasa, ustoz ritmni qarsak bilan ushlab chantni oʻzi aytadi.",
            ],
          },
          {
            title: "Listen and say the number (SB 55, 4-mashq)",
            minutes: 15,
            points: [
              "Bolalar 1–4-rasmlardagi kiyim va ranglarni birga aytadi.",
              "4-mashq (CD3 19): bolalar tasvirni eshitib, bolaning raqamini aytadi. Audio boʻlmasa, ustoz bitta bolaning kiyimini rang bilan tasvirlaydi, sinf raqamni topadi.",
              "Juftlikda: biri rasmdagi bolani tasvirlaydi, sherigi raqamni aytadi.",
            ],
          },
          {
            title: "Oʻyin: Memory (kiyim juftliklari)",
            minutes: 15,
            points: [
              "Juftlik kartochkalar (rasm va soʻz yoki ikki bir xil rasm) stolga teskari qoʻyiladi.",
              "Guruhlarda bolalar navbat bilan ikki kartochka ochadi va soʻzni ovoz chiqarib aytadi; juftlik topilsa, kartochkani oladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz sinfdagi bir bolaning kiyimini aytadi (a blue T-shirt, black shoes), sinf kim ekanini topadi.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Olti kiyim uchun kichik flashcard yasash (rasm va soʻz).",
          "Ertalab kiyinayotganda kiyim nomlarini inglizcha aytish va oilaga oʻrgatish.",
        ],
        ustozga: "Bolalar trouser yoki shoe deb birlikda aytadi — bu soʻzlar doim juftlik ekanini real kiyim bilan koʻrsating. T-shirt soʻzida t tovushini aniq aytishga eʼtibor bering.",
      },
      {
        focus: "He has got / She has got (qoʻshiq bilan)",
        sb: "56–57",
        maqsad: [
          "Oʻquvchilar He has got … va She has got … bilan boshqa odamning kiyimini tasvirlay oladilar.",
          "Oʻquvchilar He has not got … bilan inkor gap ayta oladilar.",
          "Oʻquvchilar notoʻgʻri tasvirni eshitib, uni toʻgʻrilay oladilar.",
        ],
        lugat: [
          "He has got … – Unda (oʻgʻil bola) … bor",
          "She has got … – Unda (qiz bola) … bor",
          "He has not got … – Unda … yoʻq",
          "Has he got …? – Unda … bormi?",
          "my – mening",
          "red trousers – qizil shim",
          "correct – toʻgʻrilamoq",
        ],
        resurslar: [
          "SB 56–57",
          "Audio CD3 21, 22, 25, 26",
          "Kiyim flashcardlari va real kiyimlar",
          "Kiyimsiz odam shakli chizilgan varaqlar (boʻyash uchun)",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: chant va Put on your …",
            minutes: 10,
            points: [
              "3-mashq chanti (SB 55) aytiladi.",
              "Put on your … buyruqlari bilan qisqa TPR.",
            ],
          },
          {
            title: "Grammar: He has got / She has got (SB 56, 5–6-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz bir oʻgʻil va bir qiz bolani oldinga chiqaradi: He has got a blue T-shirt. She has got black shoes. — doskaga he / she has got va has not got yoziladi.",
              "5-mashq (CD3 21): Listen and point — bolalar rasmdagi kiyim va qahramonni koʻrsatadi. Audio boʻlmasa, ustoz rasmdagi qahramonlar rolida oʻzi gapiradi.",
              "6-mashq (CD3 22): Listen and repeat — gaplar xor bilan, keyin yakka takrorlanadi.",
            ],
          },
          {
            title: "Oʻyin: Who is it?",
            minutes: 13,
            points: [
              "Ustoz sinfdagi bir bolaning kiyimini tasvirlaydi: She has got a pink T-shirt. She has not got a skirt.",
              "Bolalar kim ekanini topadi; topgan bola keyingi tasvirni aytadi.",
            ],
          },
          {
            title: "Listen and correct (SB 57, 7-mashq)",
            minutes: 15,
            points: [
              "Ustoz rasmdagi oʻgʻil va qiz bola haqida ataylab xato gap aytadi, bolalar No! deb toʻgʻrilaydi.",
              "7-mashq (CD3 25): bolalar har gapni eshitib toʻgʻrilaydi. Audio boʻlmasa, ustoz gaplarni oʻzi aytadi.",
              "Juftlikda: biri xato gap aytadi, sherigi toʻgʻrilaydi.",
            ],
          },
          {
            title: "Song (SB 57, 8-mashq)",
            minutes: 15,
            points: [
              "8-mashq (CD3 26): Sing the song — birinchi tinglashda bolalar eshitgan kiyimni oʻzida koʻrsatadi.",
              "Qoʻshiq qismlarga boʻlib oʻrganiladi va kiyinish harakatlari bilan kuylanadi.",
              "Audio boʻlmasa, ustoz qoʻshiqni ritm bilan chant qilib aytadi.",
            ],
          },
          {
            title: "Boʻyash va tasvirlash",
            minutes: 12,
            points: [
              "Har bola odam shaklini kiyintirib boʻyaydi (oʻgʻil yoki qiz).",
              "Juftlikda rasmni koʻrsatib aytadi: He has got a green jacket. He has not got socks.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ikki-uch bola rasmini sinfga tasvirlaydi.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Oila aʼzolaridan birini chizib, kiyimini rang bilan imzolash (She has got a …).",
          "Qoʻshiqni oilaga kuylab berish.",
        ],
        ustozga: "Bolalar He have got yoki She have got deydi — he va she bilan has ishlatilishini doskada boshqa rang bilan belgilang. Gapda he va she ni aralashtirsa, rasmga ishora qilib qayta soʻrang.",
      },
      {
        focus: "Monty phonics (o), tasvirlash va hikoya",
        sb: "58–59",
        maqsad: [
          "Oʻquvchilar qisqa o tovushini orange, socks, dog soʻzlarida toʻgʻri ayta oladilar.",
          "Oʻquvchilar kiyim tasviri boʻyicha qahramonni topa oladilar.",
          "Oʻquvchilar hikoyani tinglab, rasm raqamini aytib, uni ijro eta oladilar.",
        ],
        lugat: [
          "orange – toʻq sariq",
          "socks – paypoq",
          "dog – it",
          "long – uzun",
          "yellow jacket – sariq kurtka",
          "swimming pool – basseyn",
          "Whose …? – … kimniki?",
        ],
        resurslar: [
          "SB 58–59",
          "Audio CD3 29, 31, 32",
          "Kiyim flashcardlari",
          "Hikoya uchun real kiyimlar (kurtka, tufli, futbolka)",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: qoʻshiq va Who is it?",
            minutes: 10,
            points: [
              "8-mashqdagi qoʻshiq (SB 57) kuylanadi.",
              "Who is it? oʻyini bir-ikki marta oʻynaladi.",
            ],
          },
          {
            title: "Monty phonics: qisqa o (SB 58, 9-mashq)",
            minutes: 12,
            points: [
              "9-mashq (CD3 29): orange, socks, dog va ibora tinglanadi. Audio boʻlmasa, ustoz soʻzlarni aniq aytadi.",
              "Bolalar o tovushi bor soʻzda qoʻl koʻtaradi: dog, box, sock, frog, cat, pen.",
              "Ibora sekin, tez, shivirlab va baland ovozda takrorlanadi.",
            ],
          },
          {
            title: "Ask and answer (SB 58, 10-mashq)",
            minutes: 15,
            points: [
              "Bolalar rasmdagi qahramonlar ismlari va kiyimlarini birga aytadi.",
              "10-mashq: juftlikda biri qahramonni She has got … / He has got … bilan tasvirlaydi, sherigi ismini aytadi.",
              "Qiyinlashtirish: tasvirda bitta inkor gap boʻlsin (He has not got a jacket).",
            ],
          },
          {
            title: "Harakatli tanaffus: Stand up if …",
            minutes: 8,
            points: [
              "Ustoz aytadi: Stand up if you have got white socks. Sit down if you have got a blue T-shirt.",
              "Bolalar oʻz kiyimiga qarab turadi yoki oʻtiradi.",
            ],
          },
          {
            title: "Story (SB 59, 11-mashq)",
            minutes: 17,
            points: [
              "Tinglashdan oldin: bolalar basseyn yonidagi kiyimlarni rasmlarda topib nomlaydi va ular kimniki ekanini taxmin qiladi.",
              "11-mashq (CD3 31): Listen to the story — har rasm raqami koʻrsatib boriladi. Audio boʻlmasa, ustoz hikoyani rollarda oʻqiydi.",
              "Tushunish: ustoz har rasm boʻyicha oddiy savol beradi, bolalar qisqa javob beradi.",
            ],
          },
          {
            title: "Listen and say the number (SB 59, 12-mashq) va act out",
            minutes: 18,
            points: [
              "12-mashq (CD3 32): bolalar hikoyadan gapni eshitib, rasm raqamini aytadi. Audio boʻlmasa, ustoz har rasmga oid gapni oʻz soʻzlari bilan aytadi.",
              "Guruhlarda real kiyimlar bilan hikoya ijro etiladi: bolalar kiyimni topib, kimniki ekanini aytadi.",
              "Bitta-ikkita guruh sinf oldida chiqadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Phonics iborasi yana bir marta aytiladi.",
              "Yulduzcha bilan baholash; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Toʻq sariq paypoq kiygan uzun it chizib, ibora qismini (orange socks) yozish.",
          "Oila aʼzosining kiyimini ikki gap bilan tasvirlab berish.",
        ],
        ustozga: "Qisqa o ni bolalar oʻzbekcha a yoki choʻziq o bilan aytadi — ogʻizni yumaloq ochib, qisqa aytishni koʻrsating. Hikoyani ijro etishda real kiyimlar bolalarni juda qiziqtiradi, lekin kiyim yechish emas, faqat ushlab koʻrsatish yetarli ekanini oldindan ayting.",
      },
      {
        focus: "Marie geography: yashash joylari va Trevor values: tabiatni sev",
        sb: "60–61",
        maqsad: [
          "Oʻquvchilar forest, plain, river soʻzlarini aytib, hayvonni yashash joyiga moslay oladilar.",
          "Oʻquvchilar hikoyani tinglab, vaziyatga happy yoki sad deb javob bera oladilar.",
          "Oʻquvchilar tabiatni asrash uchun oʻzi nima qila olishini misol bilan ayta oladilar.",
        ],
        lugat: [
          "forest – oʻrmon",
          "plain – dasht, tekislik",
          "river – daryo",
          "habitat – yashash joyi",
          "nature – tabiat",
          "happy – xursand",
          "sad – xafa",
          "rubbish – axlat",
        ],
        resurslar: [
          "SB 60–61",
          "Audio CD3 33, 34, 35",
          "Yovvoyi hayvonlar flashcardlari",
          "Uch katta varaq: forest, plain, river (doskaga)",
          "Happy va sad yuzcha kartochkalari",
        ],
        blocks: [
          {
            title: "Warm-up: yovvoyi hayvonlar",
            minutes: 10,
            points: [
              "What am I? oʻyini yovvoyi hayvonlar bilan oʻynaladi.",
              "7-unit chanti (SB 49) bir marta aytiladi.",
            ],
          },
          {
            title: "Marie geography: Habitats (SB 60, 1-mashq)",
            minutes: 15,
            points: [
              "Ustoz doskaga daryo, dasht va oʻrmonni oddiy chizadi, soʻzlarni harakat bilan beradi (river — toʻlqin, plain — keng qoʻl, forest — daraxt).",
              "1-mashq (CD3 33): Listen and point — bolalar rasmdagi yashash joyi va hayvonni koʻrsatadi. Audio boʻlmasa, ustoz hayvon va joyni oʻzi aytadi.",
            ],
          },
          {
            title: "Look and say (SB 60, 2-mashq) va saralash oʻyini",
            minutes: 15,
            points: [
              "2-mashq: juftlikda biri hayvonni soʻraydi, sherigi uning yashash joyini aytadi.",
              "Saralash: bolalar navbat bilan hayvon flashcardini doskadagi forest, plain yoki river varagʻiga yopishtiradi va joyni aytadi.",
              "Bahs boʻlsa (masalan, fil ikki joyda), ustoz ikkalasi ham toʻgʻri boʻlishi mumkinligini aytadi.",
            ],
          },
          {
            title: "Trevor values: Love nature (SB 61, 3-mashq)",
            minutes: 15,
            points: [
              "Tinglashdan oldin: bolalar toʻrt rasmni solishtiradi — qaysi rasmda joy toza, qaysisida iflos?",
              "3-mashq (CD3 34): Listen to the story — rasm raqamlari koʻrsatib boriladi. Audio boʻlmasa, ustoz hikoyani oʻz soʻzlari bilan, rasmlarga ishora qilib aytib beradi.",
              "Ustoz clean va dirty soʻzlarini (5-unitdan) eslatib, rasmlarga qoʻllaydi.",
            ],
          },
          {
            title: "Listen. Say happy or sad (SB 61, 4-mashq)",
            minutes: 10,
            points: [
              "4-mashq (CD3 35): bolalar vaziyatni eshitib happy yoki sad kartochkasini koʻtaradi va aytadi. Audio boʻlmasa, ustoz vaziyatlarni oʻzi aytadi (daryoga axlat tashlash, daraxt ekish).",
              "Har javobdan keyin ustoz nega shunday ekanini bir soʻz bilan soʻraydi.",
            ],
          },
          {
            title: "Qadriyat muhokamasi va act out",
            minutes: 15,
            points: [
              "Oʻzbekcha suhbat: Parkda yoki ariq boʻyida axlat koʻrganmisiz? Hayvonlar va qushlar u yerda qanday yashaydi? Biz nima qila olamiz?",
              "Hayotiy misol: sayrdan keyin axlatni paketga yigʻib olish, ariqqa narsa tashlamaslik, daraxtga ozor bermaslik.",
              "Guruhlarda hikoyadagi toza va iflos joy sahnasi harakat bilan ijro etiladi, oxirida hamma happy deb qichqiradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Har bola tabiat uchun bitta ishni aytadi (oʻzbekcha, soʻng ustoz bilan inglizcha soʻzini: clean, tree, river).",
              "Yulduzcha bilan baholash; keyingi dars 5–8-unitlar takrori ekani aytiladi.",
            ],
          },
        ],
        uyga: [
          "Bir yashash joyini (forest, plain yoki river) va unda yashaydigan ikki hayvonni chizib, imzolash.",
          "Oila bilan birga uy yoki hovlida bitta tabiatni asrash ishini qilish (axlat yigʻish, gulga suv quyish) va keyingi darsda aytib berish.",
        ],
        ustozga: "Plain soʻzi bolalarga tanish emas — dasht rasmini katta va aniq koʻrsating, samolyot soʻzi bilan chalkashtirmasliklari uchun tekislik harakatini qoʻllang. Qadriyat suhbatini nasihatga aylantirmang, bolalarning oʻz tajribasini soʻzlashiga imkon bering.",
      },
      {
        focus: "Review 5–8: takrorlash oʻyinlari",
        sb: "62–63",
        maqsad: [
          "Oʻquvchilar 5–8-unitlar lugʻatini (uy va yovvoyi hayvonlar, yuz, tana, kiyimlar) tez va toʻgʻri ayta oladilar.",
          "Oʻquvchilar tasvirni eshitib, toʻgʻri rasmni topa oladilar.",
          "Oʻquvchilar stol oʻyinida soʻzlarni gap ichida ishlata oladilar.",
        ],
        lugat: [
          "review – takrorlash",
          "start – boshlanish",
          "finish – tugash",
          "dice – oʻyin toshi (kubik)",
          "Your turn. – Sening navbating.",
          "It is a hippo. – Bu begemot.",
          "match – moslamoq",
        ],
        resurslar: [
          "SB 62–63",
          "Audio CD3 36",
          "5–8-unitlar flashcardlari",
          "Oʻyin toshlari (kubik) va har guruh uchun kichik belgi (tugma, rangli qogʻoz)",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: unitlar chanti va qoʻshiqlari",
            minutes: 10,
            points: [
              "Bolalar tanlagan ikki chant yoki qoʻshiq (5–8-unitlardan) harakat bilan aytiladi.",
              "Uy vazifasida qilingan tabiat ishlari haqida ikki-uch bola qisqa aytib beradi.",
            ],
          },
          {
            title: "Flashcard marafoni",
            minutes: 12,
            points: [
              "Sinf ikki jamoaga boʻlinadi, ustoz 5–8-unitlar flashcardlarini tez koʻrsatadi.",
              "Birinchi toʻgʻri aytgan jamoa ochko oladi; ikkinchi bosqichda soʻz sifat bilan aytiladi (a long snake, red trousers).",
            ],
          },
          {
            title: "Listen and say the number (SB 62, 1-mashq)",
            minutes: 15,
            points: [
              "Bolalar 1–8-rasmlardagi odamlar, hayvonlar va kiyimlarni birga aytadi.",
              "1-mashq (CD3 36): bolalar gapni eshitib, rasm raqamini aytadi. Audio boʻlmasa, ustoz har rasmni He has got … / They have got … bilan tasvirlaydi, sinf raqamni topadi.",
              "Juftlikda: biri rasmni tasvirlaydi, sherigi raqamni aytadi.",
            ],
          },
          {
            title: "Look, read and match (SB 62, 2-mashq)",
            minutes: 13,
            points: [
              "Bolalar yaqindan olingan hayvon koʻzlari fotosuratiga qarab, qaysi hayvon ekanini taxmin qiladi.",
              "2-mashq: rasm va soʻz ustoz bilan birga moslanadi, bolalar It is a … deb javob beradi.",
              "Qoʻshimcha: ustoz boshqa hayvonning bir qismini (dum, quloq) chizadi, bolalar topadi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Simon says (aralash)",
            minutes: 8,
            points: [
              "Simon says hayvon harakatlari, yuz qismlari va kiyim buyruqlari bilan oʻynaladi.",
              "Oxirgi uch buyruq eng tez aytiladi.",
            ],
          },
          {
            title: "Play the game. Say the words (SB 63, 3-mashq)",
            minutes: 22,
            points: [
              "Ustoz qoidani koʻrsatadi: kubik tashlanadi, belgi yuriladi, tushgan katakdagi soʻz aytiladi.",
              "3-mashq: toʻrt kishilik guruhlarda oʻynaladi; soʻzni ayta olmagan bola bir katak orqaga qaytadi.",
              "Qiyinlashtirish: kuchli bolalar soʻzni gap bilan aytadi (I have got a jacket. It is a big hippo.).",
              "Birinchi Finish ga yetgan bola ustoz bilan birga barcha soʻzlarni tez aytib chiqadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Har bola 5–8-unitlardan eng yoqqan soʻzini va sababini aytadi.",
              "Yulduzcha bilan baholash; jamoalar ochkosi eʼlon qilinadi; uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "5–8-unitlar soʻzlaridan oʻz stol oʻyinini (10–12 katak) chizib, oila bilan oʻynash.",
          "Oʻzini sevimli kiyimlarida chizib, ikki gap yozish (I have got …).",
        ],
        ustozga: "Stol oʻyinida kuchli bolalar tez oʻynab, boshqalarga navbat bermaydi — har guruhga navbatni kuzatadigan bola tayinlang. Takrorda bolalar has got va have got ni hali aralashtiradi, xatoni darhol toʻgʻrilamasdan, gapni toʻgʻri shaklda qayta aytib bering.",
      },
    ],
  },
];
