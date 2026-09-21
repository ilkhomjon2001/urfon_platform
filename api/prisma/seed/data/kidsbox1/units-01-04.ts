import type { BookUnit } from "../prepare1/types.js";

// Starter leveli (8–12 yosh) — Kid Box 1, Pupil Book, 1–4-unitlar (kitob betlari 4–33).
// Faqat Pupil Book bor: audio boʻlmasa, ustoz treklarni oʻzi oʻqib beradi yoki rolda aytadi.
export const KB1_UNITS_01_04: BookUnit[] = [
  // ───────────────────────────── UNIT 1 ─────────────────────────────
  {
    unit: 1,
    title: "Unit 1 · Hello!",
    description: "Oʻquvchilar kitob qahramonlari bilan tanishadi, oʻzini tanishtiradi, 1–10 gacha sanaydi va ranglarni oʻrganadi.",
    objectives: [
      "Salomlashib, ismini va yoshini ayta oladi.",
      "1 dan 10 gacha sonlarni sanab ayta oladi.",
      "Yettita asosiy rangni nomlab ayta oladi.",
    ],
    vocabulary: [
      "one – ten (1–10)",
      "hello",
      "goodbye",
      "name",
      "blue",
      "green",
      "orange",
      "pink",
      "purple",
      "red",
      "yellow",
      "star",
    ],
    grammar: "Hello, I am … / What is your name? / Goodbye. / How old are you? I am …",
    lessons: [
      {
        focus: "Salomlashish, qahramonlar va 1–10 sonlari",
        sb: "4–5",
        maqsad: [
          "Oʻquvchilar Hello, I am … va Goodbye iboralari bilan salomlashib xayrlasha oladilar.",
          "Oʻquvchilar What is your name? savoliga javob bera oladilar.",
          "Oʻquvchilar 1 dan 10 gacha sanab, chantda ayta oladilar.",
        ],
        lugat: [
          "Hello – Salom",
          "Goodbye – Xayr",
          "name – ism",
          "one, two, three – bir, ikki, uch",
          "four, five, six – toʻrt, besh, olti",
          "seven, eight – yetti, sakkiz",
          "nine, ten – toʻqqiz, oʻn",
        ],
        resurslar: [
          "SB 4–5",
          "Audio CD1 2, 3, 5, 6 (boʻlmasa ustoz oʻzi aytadi)",
          "Qahramonlar rasmi (Mr Star oilasi, Marie, Maskman, Monty) — kitobdan koʻrsatiladi yoki doskaga chiziladi",
          "1–10 sonli kartochkalar",
          "Kichik yumshoq toʻp",
        ],
        blocks: [
          {
            title: "Warm-up: tanishuv doirasi",
            minutes: 10,
            points: [
              "Ustoz qoʻl silkitib Hello, I am … deb oʻzini tanishtiradi, bolalar doira boʻlib turadi.",
              "Toʻp uzatiladi: toʻpni olgan bola Hello, I am … deb ismini aytadi.",
              "Ustoz birinchi dars qoidalarini (tinglash, qoʻl koʻtarish) imo-ishora bilan koʻrsatadi.",
            ],
          },
          {
            title: "Qahramonlar bilan tanishuv (SB 4, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "1-mashq (CD1 2): Listen and point — bolalar tinglab, eshitgan qahramonini barmoq bilan koʻrsatadi. Audio boʻlmasa, ustoz ismlarni aralash tartibda aytadi.",
              "2-mashq (CD1 3): Listen and repeat — ismlar xor bilan, keyin qatorma-qator takrorlanadi.",
              "Ustoz Who is this? deb rasmni koʻrsatadi, bolalar ismni aytadi (Stella, Simon, Suzy, Mr Star, Mrs Star).",
            ],
          },
          {
            title: "Harakatlar bilan tinglash (SB 5, 3-mashq)",
            minutes: 12,
            points: [
              "3-mashq (CD1 5): Listen and do the actions — Marie, Maskman va Monty bilan tanishiladi; bolalar audio boʻyicha qoʻl silkitish, salomlashish harakatlarini qiladi.",
              "Audio boʻlmasa, ustoz har bir qahramon rolida salomlashadi, bolalar harakatini qaytaradi.",
              "Ikkinchi marta bolalar faqat harakat qiladi, ustoz ismni aytmay qahramonni tasvirlaydi.",
            ],
          },
          {
            title: "Sonlar 1–10 va chant (SB 5, 4-mashq)",
            minutes: 15,
            points: [
              "Ustoz barmoqlar bilan 1–10 ni sanaydi, bolalar barmoq koʻrsatib takrorlaydi.",
              "4-mashq (CD1 6): Say the chant — avval tinglanadi, keyin sonlarni ritm bilan qarsak chalib aytishadi. Audio boʻlmasa, ustoz chantni oʻzi ritm bilan aytadi.",
              "Chant ikki guruhda: bir guruh toq, ikkinchisi juft sonlarni aytadi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Jump and count",
            minutes: 8,
            points: [
              "Ustoz son kartochkasini koʻrsatadi, bolalar shuncha marta sakrab, sonni baland aytadi.",
              "Oxirida teskari sanash: 10 dan 1 gacha sekin choʻkkalab tushish.",
            ],
          },
          {
            title: "Oʻyin: What is your name? va Number Bingo",
            minutes: 20,
            points: [
              "Ustoz What is your name? savolini doskaga rasm bilan yozadi; bolalar sinf boʻylab yurib uch nafar doʻstidan soʻraydi va Goodbye deb xayrlashadi.",
              "Number Bingo: bolalar qogʻozga 1–10 dan istalgan toʻrtta sonni yozadi, ustoz aralash aytadi, hammasini chizgan bola Bingo! deydi.",
              "Gʻolib keyingi turda sonlarni oʻzi aytib boshqaradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Sonlar chanti yana bir marta tik turib aytiladi.",
              "Har bir bola chiqib ketayotganda ustozga Goodbye deydi va ismini aytadi.",
              "Uy vazifasi tushuntiriladi, yulduzcha bilan baholanadi.",
            ],
          },
        ],
        uyga: [
          "Oʻzining rasmini chizib, tagiga Hello, I am … deb ismini yozish (ustoz namuna beradi).",
          "Uyda oila aʼzolariga 1–10 sonlarini inglizcha sanab berish.",
        ],
        ustozga: "Bolalar I am oʻrniga faqat ismini aytishga yoki Hello va Goodbye ni almashtirishga moyil — qoʻl silkitish harakati bilan farqlang. Sonlarda three va tree, seven va eleven talaffuzini sekin, aniq koʻrsating.",
      },
      {
        focus: "How old are you? va ranglar qoʻshigʻi",
        sb: "6–7",
        maqsad: [
          "Oʻquvchilar How old are you? deb soʻrab, I am … deb yoshini ayta oladilar.",
          "Oʻquvchilar yettita rangni tanib, nomlay oladilar.",
          "Oʻquvchilar ranglar qoʻshigʻini harakat bilan kuylay oladilar.",
        ],
        lugat: [
          "How old are you? – Necha yoshdasan?",
          "red – qizil",
          "yellow – sariq",
          "blue – koʻk",
          "green – yashil",
          "orange – toʻq sariq",
          "pink – pushti",
          "purple – binafsha",
        ],
        resurslar: [
          "SB 6–7",
          "Audio CD1 7, 8, 10, 12 (boʻlmasa ustoz oʻzi aytadi)",
          "Rang kartochkalari yoki rangli qogʻozlar (7 ta rang)",
          "1–10 sonli kartochkalar",
          "Rangli qalamlar",
        ],
        blocks: [
          {
            title: "Warm-up: sonlar chanti va ismlar",
            minutes: 10,
            points: [
              "4-mashq chanti (CD1 6) qarsak bilan takrorlanadi.",
              "Toʻp uzatish: What is your name? — I am … zanjiri butun sinf boʻylab.",
              "Ustoz son kartochkasini tez koʻrsatadi, bolalar sonni aytadi.",
            ],
          },
          {
            title: "Yosh haqida soʻrash (SB 6, 5–6-mashqlar)",
            minutes: 15,
            points: [
              "5-mashq (CD1 7): Listen and point — rasmda Stella va Meera Suzy bilan gaplashadi, bolalar gapirayotgan qahramonni koʻrsatadi. Audio boʻlmasa, ustoz ikki ovozda rolni oʻqiydi.",
              "6-mashq (CD1 8): Listen and repeat — Simon, Meera, Suzy va Stella yoshlari aytiladi; bolalar qahramon va sonni takrorlaydi.",
              "Ustoz rasmni koʻrsatib How old is Simon? emas, oddiy qilib Simon? deb soʻraydi, bolalar yoshini (six) aytadi.",
            ],
          },
          {
            title: "Juftlikda: How old are you?",
            minutes: 12,
            points: [
              "Ustoz bir bolaga How old are you? deb soʻraydi, javobni I am … bilan toʻldirishga yordam beradi.",
              "Bolalar juftlikda soʻrab, doʻstining yoshini barmoq bilan koʻrsatadi.",
              "Bir-ikki juftlik sinf oldida chiqib savol-javobni aytadi.",
            ],
          },
          {
            title: "Ranglar va qoʻshiq (SB 7, 7-mashq)",
            minutes: 15,
            points: [
              "Ustoz rang kartochkalarini birma-bir koʻrsatib nomini aytadi, sinf xor bilan takrorlaydi.",
              "7-mashq (CD1 10): Sing the song — kamalak rasmi boʻyicha tinglanadi; har bir bola bitta rang kartochkasini ushlaydi va oʻz rangi eshitilganda kartochkani koʻtaradi.",
              "Audio boʻlmasa, ustoz ranglarni kamalak tartibida kuylab aytadi, bolalar qaytaradi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Touch something red",
            minutes: 8,
            points: [
              "Ustoz Touch something blue! deydi, bolalar sinfdagi shu rangdagi narsaga yugurib tegadi.",
              "Oxirgi yetib kelgan bola keyingi rangni aytadi.",
            ],
          },
          {
            title: "Rang tinglash va oʻyin (SB 7, 8-mashq)",
            minutes: 20,
            points: [
              "8-mashq (CD1 12): Listen and say the colour — bolalar tinglab, dogʻ raqamiga mos rangni aytadi. Audio boʻlmasa, ustoz raqamni aytadi, bolalar rangni topadi.",
              "Oʻyin: Colour and number — ustoz Number three! desa, bolalar 3-dogʻning rangini aytadi, keyin teskarisi: rang aytiladi, raqam topiladi.",
              "Juftlikda: bir bola raqam aytadi, sherigi rangni aytadi; 3 daqiqadan keyin almashadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ranglar qoʻshigʻi kartochkalar bilan yana bir marta kuylanadi.",
              "Har bir bola chiqishdan oldin How old are you? savoliga javob beradi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Kamalak chizib, har bir rang yoniga ustoz bergan namunadan rang nomini koʻchirib yozish.",
          "Oila aʼzolariga How old are you? deb soʻrab, javobni rasmda son bilan belgilab kelish.",
        ],
        ustozga: "Orange va purple eng qiyin soʻzlar — talaffuzni boʻgʻinlab bering. Bolalar yoshini aytganda I am soʻzini tashlab ketadi; toʻliq javobni qoʻl bilan ikki barmoq koʻrsatib (I + am) eslatib turing.",
      },
      {
        focus: "Monty phonics (s), savol-javob va birinchi hikoya",
        sb: "8–9",
        maqsad: [
          "Oʻquvchilar s tovushini six va star soʻzlarida aniq talaffuz qila oladilar.",
          "Oʻquvchilar What is your name? va How old are you? savollarini doʻstiga bera oladilar.",
          "Oʻquvchilar hikoyani tinglab, rasmlar tartibini topa oladilar.",
        ],
        lugat: [
          "six – olti",
          "star – yulduz",
          "toys – oʻyinchoqlar",
          "box – quti",
          "name – ism",
          "old – yoshda (necha yosh)",
        ],
        resurslar: [
          "SB 8–9",
          "Audio CD1 14, 17, 18 (boʻlmasa ustoz oʻzi oʻqiydi va rolda aytadi)",
          "Yulduzcha shaklidagi qogʻoz kesmalar",
          "Qahramon niqoblari yoki ism kartochkalari (Marie, Maskman, Monty)",
          "Rang va son kartochkalari",
        ],
        blocks: [
          {
            title: "Warm-up: ranglar qoʻshigʻi va sonlar",
            minutes: 10,
            points: [
              "7-mashq qoʻshigʻi (CD1 10) rang kartochkalari bilan kuylanadi.",
              "Tezkor savol: ustoz kartochka koʻrsatadi, bolalar rang yoki sonni aytadi.",
              "Ikki-uch bola How old are you? deb ustozga savol beradi.",
            ],
          },
          {
            title: "Monty phonics: s tovushi (SB 8, 9-mashq)",
            minutes: 12,
            points: [
              "9-mashq (CD1 14): Monty phonics — six va star soʻzlari tinglanadi, bolalar s tovushini ilon kabi uzun aytadi (sss).",
              "Kitobdagi qisqa ibora sekin, keyin tez, keyin shivirlab takrorlanadi. Audio boʻlmasa, ustoz oʻzi aniq talaffuz qilib beradi.",
              "Ustoz boshqa soʻzlarni aytadi (seven, Simon, Suzy, pen), s bilan boshlansa bolalar yulduzchani koʻtaradi.",
            ],
          },
          {
            title: "Savol-javob (SB 8, 10-mashq)",
            minutes: 15,
            points: [
              "10-mashq: Ask the questions — bolalar rasmdagi toʻrt qahramonni tanlab, uning rolida ism va yoshini aytadi; sherigi savol beradi.",
              "Ustoz avval bitta kuchli oʻquvchi bilan namuna koʻrsatadi.",
              "Soʻng bolalar oʻz ismlari va yoshlari bilan juftlikda savol-javob qiladi.",
            ],
          },
          {
            title: "Hikoya: tinglash (SB 9, 11-mashq)",
            minutes: 15,
            points: [
              "Ustoz rasmlarni koʻrsatib, qahramonlarni soʻraydi: Who is this? — bolalar Marie, Maskman deb javob beradi.",
              "11-mashq (CD1 17): Listen to the story — bolalar tinglab, har bir kadrni barmoq bilan kuzatib boradi.",
              "Audio boʻlmasa, ustoz hikoyani kadrma-kadr ovoz va mimika bilan aytib beradi; oʻzbekcha qisqa savol bilan tushunishni tekshiradi (Maskman nima qildi?).",
            ],
          },
          {
            title: "Harakatli tanaffus: Simon says",
            minutes: 8,
            points: [
              "Simon says bilan: Simon says wave! Simon says jump! Simon says say hello!",
              "Simon says aytilmasa harakat qilmaydi — xato qilgan bola bir marta qarsak chaladi va oʻyinda qoladi.",
            ],
          },
          {
            title: "Hikoya kadrlari va act out (SB 9, 12-mashq)",
            minutes: 20,
            points: [
              "12-mashq (CD1 18): Listen and say the number — bolalar eshitgan qismga mos kadr raqamini aytadi. Audio boʻlmasa, ustoz kadrdagi voqeani oddiy soʻzlar bilan aytadi, bolalar raqamni topadi.",
              "Ustoz uch guruhga boʻladi (Marie, Maskman, Monty); har guruh ovoz va mimika bilan oʻz qahramonini koʻrsatadi.",
              "Ikki-uch bola niqob taqib hikoyani qisqa sahna qilib koʻrsatadi, sinf qarsak chaladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Unit 1 soʻzlari tezkor takrorlanadi: sonlar, ranglar, salomlashish.",
              "Har bir bola bitta rang va bitta sonni aytib, yulduzcha oladi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Oltita yulduz chizib, har birini boshqa rangga boʻyash va rang nomini oilaga aytib berish.",
          "Sonlar chantini uyda bir marta takrorlash.",
        ],
        ustozga: "Hikoyada har soʻzni tushunish shart emas — rasm va ovoz orqali mazmunni ilgʻash kifoya. Phonics mashqida bolalar six soʻzini sh bilan aytishi mumkin; tishlar orasidan chiqadigan toza s ni koʻrsating.",
      },
    ],
  },

  // ───────────────────────────── UNIT 2 ─────────────────────────────
  {
    unit: 2,
    title: "Unit 2 · My school",
    description: "Oʻquvchilar sinf buyumlarini nomlaydi, odamlarni tanishtiradi (He is / She is) va hol-ahvol soʻrashni oʻrganadi.",
    objectives: [
      "Oltita sinf buyumini rang va son bilan qoʻshib ayta oladi.",
      "Who is that? savoliga He is … / She is … deb javob ayta oladi.",
      "How are you? deb soʻrab, I am fine, thank you deb javob ayta oladi.",
    ],
    vocabulary: [
      "book",
      "chair",
      "eraser",
      "pen",
      "pencil",
      "table",
      "bag",
      "school",
      "friend",
      "plus (adding)",
      "Great!",
      "OK",
    ],
    grammar: "Who is that? He is … / She is … / How are you? I am fine, thank you. / Come on! Letʼs play.",
    lessons: [
      {
        focus: "Sinf buyumlari va chant",
        sb: "10–11",
        maqsad: [
          "Oʻquvchilar oltita sinf buyumini tanib, nomlay oladilar.",
          "Oʻquvchilar buyumni son va rang bilan ayta oladilar (six orange chairs).",
          "Oʻquvchilar notoʻgʻri gapni No, … deb toʻgʻrilay oladilar.",
        ],
        lugat: [
          "book – kitob",
          "chair – stul",
          "eraser – oʻchirgʻich",
          "pen – ruchka",
          "pencil – qalam",
          "table – stol",
          "No – Yoʻq",
        ],
        resurslar: [
          "SB 10–11",
          "Audio CD1 19, 20, 22, 23 (boʻlmasa ustoz oʻzi aytadi)",
          "Haqiqiy sinf buyumlari: kitob, ruchka, qalam, oʻchirgʻich",
          "Rang va son kartochkalari",
          "Mato yoki xalta (Feely bag oʻyini uchun)",
        ],
        blocks: [
          {
            title: "Warm-up: Unit 1 takrori",
            minutes: 10,
            points: [
              "Ranglar qoʻshigʻi (CD1 10) va sonlar chanti (CD1 6) qisqa takrorlanadi.",
              "Toʻp uzatish: What is your name? — How old are you? savollari bilan.",
              "Ustoz sinfdagi narsalarni koʻrsatib rangini soʻraydi.",
            ],
          },
          {
            title: "Lugʻat: sinf buyumlari (SB 10, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz haqiqiy buyumlarni birma-bir koʻtarib nomini aytadi, bolalar takrorlaydi.",
              "1-mashq (CD1 19): Listen and point — bolalar rasmda eshitgan buyumini koʻrsatadi. Audio boʻlmasa, ustoz soʻzlarni aralash aytadi.",
              "2-mashq (CD1 20): Listen and repeat — xor, keyin qatorlar, keyin yakka ovozda.",
            ],
          },
          {
            title: "TPR: Show me a pencil",
            minutes: 10,
            points: [
              "Ustoz Show me a pen! Touch your book! deb buyruq beradi, bolalar oʻz partasidan koʻrsatadi.",
              "Tezlik oshiriladi; keyin bir-ikki bola ustoz oʻrnida buyruq beradi.",
            ],
          },
          {
            title: "Chant (SB 11, 3-mashq)",
            minutes: 12,
            points: [
              "3-mashq (CD1 22): Say the chant — avval tinglanadi, bolalar har bir buyum eshitilganda uni koʻtaradi.",
              "Audio boʻlmasa, ustoz buyumlarni qarsak ritmi bilan aytadi, bolalar qaytaradi.",
              "Chant ikki guruhda navbat bilan, oxirida butun sinf bilan aytiladi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Run to the chair",
            minutes: 8,
            points: [
              "Ustoz buyum nomini aytadi (table, chair, book), bolalar sinfdagi shu buyumga borib tegadi.",
              "Oxirida hamma oʻz stuliga qaytib jim oʻtiradi.",
            ],
          },
          {
            title: "Tinglash va toʻgʻrilash (SB 11, 4-mashq)",
            minutes: 25,
            points: [
              "Ustoz doskada son + rang + buyum tartibini rasm bilan koʻrsatadi (masalan, uchta qizil qalam).",
              "4-mashq (CD1 23): Listen and correct — audio atayin notoʻgʻri gap aytadi, bolalar rasmga qarab No, … deb toʻgʻrilaydi. Audio boʻlmasa, ustoz oʻzi notoʻgʻri gap aytadi (sonni yoki rangni almashtirib).",
              "Juftlikda: bir bola kitobdagi rasmga qarab notoʻgʻri gap aytadi, sherigi toʻgʻrilaydi.",
              "Feely bag: xaltadagi buyumni qoʻl bilan ushlab topish va nomini aytish.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Chant yana bir marta buyumlarni koʻtarib aytiladi.",
              "What is missing? — stoldan bitta buyum yashiriladi, bolalar topadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Sumkasidagi buyumlarni chizib, har birining nomini ustoz namunasidan koʻchirib yozish.",
          "Uydagilarga oltita sinf buyumini inglizcha koʻrsatib aytib berish.",
        ],
        ustozga: "Bolalar pen va pencil ni chalkashtiradi — haqiqiy buyumni koʻrsatmasdan soʻzni bermang. Koʻplikda (chairs, pens) oxirgi s ni tashlab ketishadi; qoʻl bilan ilon harakati qilib eslating.",
      },
      {
        focus: "Who is that? He is / She is va qoʻgʻirchoq qoʻshigʻi",
        sb: "12–13",
        maqsad: [
          "Oʻquvchilar Who is that? deb soʻrab, He is … / She is … deb javob bera oladilar.",
          "Oʻquvchilar he va she ni oʻgʻil bola va qiz bolaga toʻgʻri qoʻllay oladilar.",
          "Oʻquvchilar How are you? — I am fine, thank you. almashinuvini qoʻshiq orqali ayta oladilar.",
        ],
        lugat: [
          "Who is that? – Anavi kim?",
          "he – u (oʻgʻil bola, erkak)",
          "she – u (qiz bola, ayol)",
          "school – maktab",
          "How are you? – Qalaysan?",
          "fine – yaxshi",
          "thank you – rahmat",
          "puppet – qoʻgʻirchoq (barmoq qoʻgʻirchogʻi)",
        ],
        resurslar: [
          "SB 12–13",
          "Audio CD1 24, 25, 27 (boʻlmasa ustoz oʻzi aytadi)",
          "Qalin qogʻoz, qaychi, yelim, rangli qalamlar (barmoq qoʻgʻirchoqlari uchun)",
          "Qahramonlar rasmi (Stella, Simon, Meera, Lenny, Alex)",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: chant va buyumlar",
            minutes: 10,
            points: [
              "3-mashq chanti (CD1 22) buyumlarni koʻtarib aytiladi.",
              "Ustoz son + rang + buyum aytadi, bolalar toʻgʻri yoki notoʻgʻriligini Yes / No bilan topadi.",
              "Oʻtgan dars uy vazifasi rasmlari koʻrib chiqiladi.",
            ],
          },
          {
            title: "Grammatika: Who is that? (SB 12, 5–6-mashqlar)",
            minutes: 15,
            points: [
              "5-mashq (CD1 24): Listen and point — maktab hovlisidagi bolalar koʻrsatiladi, bolalar eshitgan qahramonni koʻrsatadi. Audio boʻlmasa, ustoz Who is that? deb rasmni koʻrsatadi va javobni rolda aytadi.",
              "6-mashq (CD1 25): Listen and repeat — savol va javob xor bilan takrorlanadi.",
              "Ustoz doskaga oʻgʻil bola va qiz bola rasmini chizib, tagiga He is va She is ni yozadi.",
            ],
          },
          {
            title: "Oʻyin: Who is that? (sinfdoshlar bilan)",
            minutes: 12,
            points: [
              "Ustoz bir bolani koʻrsatib Who is that? deydi, sinf He is Aziz. yoki She is Madina. deb javob beradi.",
              "Qoʻshimcha: He is eight. — yoshini ham qoʻshib aytish.",
              "Koʻzi bogʻlangan bola ovozdan sinfdoshini topadi: Who is that? — She is …",
            ],
          },
          {
            title: "Qoʻgʻirchoq yasash (SB 13, 7-mashq)",
            minutes: 15,
            points: [
              "7-mashq: Make the puppets — kitobdagi fotoga qarab bolalar qogʻozdan barmoq qoʻgʻirchoqlari (Simon, Stella, Suzy va boshqalar) yasaydi.",
              "Ustoz shablonni oldindan chizib beradi; bolalar boʻyab, kesib, halqa qilib yelimlaydi.",
              "Ish davomida ustoz Who is that? deb soʻrab yuradi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Boys stand up, girls sit down",
            minutes: 8,
            points: [
              "Ustoz He! desa oʻgʻil bolalar, She! desa qiz bolalar oʻrnidan turadi.",
              "Tezlik oshiriladi; keyin ism aytiladi va sinf He yoki She deb qichqiradi.",
            ],
          },
          {
            title: "Qoʻshiq qoʻgʻirchoqlar bilan (SB 13, 8-mashq)",
            minutes: 20,
            points: [
              "Ustoz How are you? — I am fine, thank you. almashinuvini qoʻl imo-ishorasi bilan oʻrgatadi.",
              "8-mashq (CD1 27): Sing the song — bolalar qoʻgʻirchoqlarini barmoqqa taqib, qoʻshiqdagi qahramon aytilganda oʻsha barmoqni qimirlatadi. Audio boʻlmasa, ustoz sodda ohang bilan savol-javobni kuylaydi.",
              "Juftlikda qoʻgʻirchoqlar bir-biridan How are you? deb soʻraydi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Uch-toʻrt bola qoʻgʻirchogʻini koʻrsatib He is Simon. / She is Stella. deydi.",
              "Ustoz chiqishda har bir bolaga How are you? deb soʻraydi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Qoʻgʻirchoqlarni uyga olib borib, oila aʼzolariga He is … / She is … deb tanishtirish.",
          "Oilasidan kimgadir How are you? deb soʻrab, javobini oʻrgatish.",
        ],
        ustozga: "Oʻzbek tilida u soʻzi ikkala jins uchun bir xil, shuning uchun bolalar he va she ni koʻp adashtiradi — har safar rasm yoki haqiqiy bolani koʻrsating. Qoʻgʻirchoq yasash choʻzilib ketmasin: shablonni oldindan tayyorlang.",
      },
      {
        focus: "Monty phonics (p, b), Who is that? oʻyini va hikoya",
        sb: "14–15",
        maqsad: [
          "Oʻquvchilar p va b tovushlarini farqlab talaffuz qila oladilar.",
          "Oʻquvchilar rasm qismiga qarab qahramonni topib, He is … / She is … deb ayta oladilar.",
          "Oʻquvchilar hikoyani tinglab, uni rolda sahnalashtira oladilar.",
        ],
        lugat: [
          "pink – pushti",
          "blue – koʻk",
          "pen – ruchka",
          "bag – sumka",
          "pencil – qalam",
          "eraser – oʻchirgʻich",
          "Activity Book – mashq daftari (hikoyadagi kitob)",
        ],
        resurslar: [
          "SB 14–15",
          "Audio CD1 29, 32 (boʻlmasa ustoz oʻzi oʻqiydi va rolda aytadi)",
          "Katta qalam va oʻchirgʻich (yoki ularning rasmi) — act out uchun",
          "Qahramon niqoblari (Marie, Maskman, Monty)",
          "Qogʻoz parchalari (p va b kartalari)",
        ],
        blocks: [
          {
            title: "Warm-up: qoʻshiq va Who is that?",
            minutes: 10,
            points: [
              "8-mashq qoʻshigʻi (CD1 27) qoʻgʻirchoqlar bilan kuylanadi.",
              "Ustoz bolalarni koʻrsatib Who is that? deydi, sinf He is … / She is … deb javob beradi.",
              "Sinf buyumlari tezkor takror: Show me an eraser!",
            ],
          },
          {
            title: "Monty phonics: p va b (SB 14, 9-mashq)",
            minutes: 12,
            points: [
              "9-mashq (CD1 29): Monty phonics — pink va blue soʻzlari tinglanadi. Audio boʻlmasa, ustoz aniq talaffuz qiladi.",
              "Ogʻiz oldiga qogʻoz parchasi tutiladi: p aytilganda qogʻoz qimirlaydi, b da qimirlamaydi.",
              "Kitobdagi ibora sekin, keyin tez takrorlanadi; ustoz soʻz aytadi (pen, bag, book, pencil), bolalar P yoki B kartasini koʻtaradi.",
            ],
          },
          {
            title: "Savol-javob (SB 14, 10-mashq)",
            minutes: 15,
            points: [
              "10-mashq: Ask and answer — bolalar faqat oyoq qismi koʻringan sakkizta rasmga qarab qahramonni topadi.",
              "Ustoz birinchi rasmda namuna koʻrsatadi: Who is that? — He is Mr Star.",
              "Bolalar juftlikda navbat bilan soʻraydi, keyin javoblar sinf bilan tekshiriladi.",
            ],
          },
          {
            title: "Hikoya: tinglash (SB 15, 11-mashq)",
            minutes: 15,
            points: [
              "Ustoz kadrlardagi buyumlarni soʻraydi: What is this? — bolalar pencil, eraser, book deb javob beradi.",
              "11-mashq (CD1 32): Listen to the story — bolalar tinglab, kadrlarni barmoq bilan kuzatadi.",
              "Audio boʻlmasa, ustoz hikoyani kadrma-kadr mimika bilan aytadi; oxirida oʻzbekcha soʻraydi: Maskman nima qildi, Marie nega hayron?",
            ],
          },
          {
            title: "Harakatli tanaffus: Pass the pencil",
            minutes: 8,
            points: [
              "Musiqa yoki ustoz qarsagi ostida qalam qoʻldan qoʻlga uzatiladi.",
              "Toʻxtaganda qalam qoʻlidagi bola bitta sinf buyumini yoki rangni aytadi.",
            ],
          },
          {
            title: "Act out the story (SB 15, 12-mashq)",
            minutes: 20,
            points: [
              "12-mashq: Act out the story — sinf uchta guruhga boʻlinadi, har guruh oʻz qahramoni rolini oladi.",
              "Ustoz har kadr uchun oddiy soʻz yoki ibora beradi (pencil, eraser, Oh no!); bolalar harakat va mimika qoʻshadi.",
              "Ikki-uch guruh sinf oldida chiqib hikoyani koʻrsatadi; tomoshabinlar kadr raqamini aytib boradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Unit 2 soʻzlari: What is missing? oʻyini bilan takror.",
              "Har bir bola bitta p yoki b soʻzini aytib chiqadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Pushti ruchka va koʻk sumka rasmini chizib, tagiga pink pen, blue bag deb yozish.",
          "Hikoyani rasmlarga qarab oilaga oʻzbekcha aytib berish va sinf buyumlarini inglizcha nomlash.",
        ],
        ustozga: "p va b ni farqlash oʻzbek bolalariga qiyin emas, lekin soʻz oxirida (bag) b ni p qilib aytishadi — soʻz oxirini choʻzmasdan, jarangli aytishni koʻrsating. Act out da matnni yodlatmang, harakat va bir-ikki soʻz yetarli.",
      },
      {
        focus: "Marie sahifasi (maths): qoʻshish va Trevor values: doʻst orttirish",
        sb: "16–17",
        maqsad: [
          "Oʻquvchilar sinf buyumlarini sanab, 10 gacha qoʻshish amalini inglizcha ayta oladilar.",
          "Oʻquvchilar oʻyinga taklif qilish va rozilik bildirish iboralarini ishlata oladilar.",
          "Oʻquvchilar yangi doʻst orttirish nega muhimligini muhokama qila oladilar.",
        ],
        lugat: [
          "plus – qoʻshuv",
          "equals – teng",
          "adding – qoʻshish",
          "friend – doʻst",
          "Great! – Zoʻr!",
          "Come on! – Qani, kel!",
          "Letʼs play. – Keling, oʻynaymiz.",
          "OK – Xoʻp",
        ],
        resurslar: [
          "SB 16–17",
          "Audio CD1 33, 34, 35 (boʻlmasa ustoz oʻzi aytadi va rolda oʻqiydi)",
          "Sinf buyumlari (qalam, ruchka, kitob, oʻchirgʻich) — sanash uchun",
          "1–10 son kartochkalari, + va = belgilari",
          "Toʻp",
        ],
        blocks: [
          {
            title: "Warm-up: sonlar va buyumlar",
            minutes: 10,
            points: [
              "Sonlar chanti (CD1 6) va buyumlar chanti (CD1 22) takrorlanadi.",
              "Ustoz stolga buyumlar qoʻyadi, bolalar sanab aytadi: five pencils.",
            ],
          },
          {
            title: "Marie sahifasi (maths): Look and say the number (SB 16, 1-mashq)",
            minutes: 15,
            points: [
              "Ustoz haqiqiy qalamlar bilan koʻrsatadi: two pencils plus three pencils — five! Doskada + va = belgilari rasm bilan yoziladi.",
              "1-mashq: Look and say the number — bolalar toʻrtta rasmdagi buyumlarni sanab, natija sonini aytadi.",
              "Juftlikda: bir bola buyumlarni qoʻshib koʻrsatadi, sherigi natijani aytadi.",
            ],
          },
          {
            title: "Listen, point and say (SB 16, 2-mashq)",
            minutes: 12,
            points: [
              "2-mashq (CD1 33): Listen, point and say — gʻildirakdagi ruchkalar bilan qoʻshish misollari tinglanadi, bolalar koʻrsatib natijani aytadi.",
              "Audio boʻlmasa, ustoz oʻzi misol aytadi (three plus four), bolalar rasmdan sanab javob topadi.",
              "Tezkor oʻyin: ustoz ikki son kartochkasini koʻrsatadi, birinchi toʻgʻri javob bergan qator ochko oladi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Maths jump",
            minutes: 8,
            points: [
              "Ustoz one plus two! deydi, bolalar javob soniga teng marta sakraydi.",
              "Ikki-uch bola misolni oʻzi aytib boshqaradi.",
            ],
          },
          {
            title: "Trevor values: hikoya (SB 17, 3-mashq)",
            minutes: 15,
            points: [
              "Ustoz rasmlarni koʻrsatib oʻzbekcha soʻraydi: Bu bola nimani his qilyapti? U yolgʻizmi?",
              "3-mashq (CD1 34): Listen to the story — bolalar kadrlarni kuzatib tinglaydi. Audio boʻlmasa, ustoz kadrma-kadr sodda inglizcha va imo-ishora bilan aytib beradi.",
              "Functions iboralari doskaga yoziladi: Great! Come on! Letʼs play. OK.",
            ],
          },
          {
            title: "Qadriyat muhokamasi va act out (SB 17, 4-mashq)",
            minutes: 20,
            points: [
              "4-mashq (CD1 35): Listen and say the number. Act it out — bolalar eshitgan iboraga mos kadr raqamini aytadi, keyin juftlikda sahnalashtiradi. Audio boʻlmasa, ustoz iborani aytadi.",
              "Oʻzbekcha muhokama: Yangi kelgan sinfdosh yoki hovlida yolgʻiz turgan bolani oʻyinga qanday chaqirasiz? Bolalar hayotiy misol aytadi (mahallada, maktab tanaffusida).",
              "Rolli oʻyin: bir bola yolgʻiz turadi, boshqasi toʻp bilan kelib Come on! Letʼs play. deydi, u OK! Great! deb javob beradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Pass the ball: toʻpni olgan bola Letʼs play! deydi, keyingisi OK! deb javob beradi.",
              "Bugun kim yangi doʻst bilan oʻynaganini soʻrab, yulduzcha beriladi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Oʻziga yoqqan ikki guruh buyum chizib, qoʻshish misolini tuzish (masalan, 2 + 3 = 5) va uni oilaga inglizcha aytib berish.",
          "Doʻsti bilan oʻynayotgan rasmini chizish.",
        ],
        ustozga: "Qoʻshishda bolalar sonni tez topadi, lekin plus soʻzini aytmay qoʻyadi — misolni toʻliq ovoz chiqarib aytishni talab qiling. Values muhokamasini oʻzbekcha olib boring, lekin rolli oʻyinda inglizcha iboralar ishlatilsin.",
      },
    ],
  },

  // ───────────────────────────── UNIT 3 ─────────────────────────────
  {
    unit: 3,
    title: "Unit 3 · Favourite toys",
    description: "Oʻquvchilar oʻyinchoqlar va yangi ranglarni nomlaydi hamda buyum qayerdaligini in, on, under, next to bilan aytadi.",
    objectives: [
      "Oltita oʻyinchoq va toʻrtta yangi rangni nomlab ayta oladi.",
      "Buyum qayerdaligini It is in / on / under / next to … deb ayta oladi.",
      "Is … in / on / under …? deb soʻrab, Yes yoki No bilan javob ayta oladi.",
    ],
    vocabulary: [
      "ball",
      "bike",
      "car",
      "computer",
      "doll",
      "train",
      "black",
      "brown",
      "grey",
      "white",
      "in",
      "on",
      "under",
      "next to",
    ],
    grammar: "Where is the ball? It is in / next to / on / under … / Is your ball in your bag? Yes, it is. / No, it is not.",
    lessons: [
      {
        focus: "Oʻyinchoqlar va yangi ranglar chanti",
        sb: "18–19",
        maqsad: [
          "Oʻquvchilar oltita oʻyinchoq nomini tanib, ayta oladilar.",
          "Oʻquvchilar black, brown, grey, white ranglarini nomlay oladilar.",
          "Oʻquvchilar oʻyinchoqni rang bilan birga ayta oladilar (a red car).",
        ],
        lugat: [
          "ball – toʻp",
          "bike – velosiped",
          "car – mashina",
          "computer – kompyuter",
          "doll – qoʻgʻirchoq",
          "train – poyezd",
          "black – qora",
          "brown – jigarrang",
          "grey – kulrang",
          "white – oq",
        ],
        resurslar: [
          "SB 18–19",
          "Audio CD1 36, 37, 39, 40 (boʻlmasa ustoz oʻzi aytadi)",
          "Oʻyinchoqlar (toʻp, mashina, qoʻgʻirchoq) yoki ularning rasmlari",
          "Rang kartochkalari (11 ta rang)",
          "Xalta yoki quti",
        ],
        blocks: [
          {
            title: "Warm-up: Unit 2 takrori",
            minutes: 10,
            points: [
              "8-mashq qoʻshigʻi (CD1 27) va buyumlar chanti (CD1 22) takrorlanadi.",
              "Ustoz Who is that? deb bolalarni koʻrsatadi, sinf He is / She is bilan javob beradi.",
              "Ranglar kartochkalari bilan tezkor takror.",
            ],
          },
          {
            title: "Lugʻat: oʻyinchoqlar (SB 18, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz xaltadan oʻyinchoqlarni birma-bir chiqarib nomini aytadi.",
              "1-mashq (CD1 36): Listen and point — bolalar rasmda eshitgan oʻyinchoqni koʻrsatadi. Audio boʻlmasa, ustoz soʻzlarni aralash tartibda aytadi.",
              "2-mashq (CD1 37): Listen and repeat — soʻzlar harakat bilan takrorlanadi (bike — pedal aylantirish, train — chu-chu).",
            ],
          },
          {
            title: "Tinglash (SB 19, 3-mashq)",
            minutes: 12,
            points: [
              "3-mashq (CD1 39): Listen and say the number — bolalar eshitgan oʻyinchoqning raqamini aytadi. Audio boʻlmasa, ustoz oʻyinchoq nomini aytadi, bolalar raqamni topadi.",
              "Teskarisi: ustoz raqam aytadi, bolalar oʻyinchoq va uning rangini aytadi (a green ball).",
            ],
          },
          {
            title: "Yangi ranglar va chant (SB 19, 4-mashq)",
            minutes: 15,
            points: [
              "Ustoz black, brown, grey, white kartochkalarini koʻrsatadi, sinfdan shu rangdagi narsalarni topishni soʻraydi.",
              "4-mashq (CD1 40): Say the chant — bolalar tinglab, har bir rang aytilganda shu rangdagi kartochkani koʻtaradi.",
              "Audio boʻlmasa, ustoz ranglarni ritm bilan aytadi; chant ikki guruhda navbat bilan takrorlanadi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Toy actions",
            minutes: 8,
            points: [
              "Ustoz oʻyinchoq nomini aytadi, bolalar uning harakatini koʻrsatadi: ball — toʻp tepish, car — rul burish, doll — beshik tebratish.",
              "Tezlik oshiriladi, keyin bolalar navbat bilan boshqaradi.",
            ],
          },
          {
            title: "Oʻyinlar: Memory va Feely bag",
            minutes: 20,
            points: [
              "Memory: doskaga oʻyinchoq rasmlari va soʻz kartochkalari teskari yopishtiriladi, bolalar juftini topib nomini aytadi.",
              "Feely bag: xaltadagi oʻyinchoqni ushlab koʻrib It is a car! deb topish.",
              "Rang + oʻyinchoq: ustoz a white car desa, bolalar rasmni shu rangga boʻyaydi (qisqa, ustoz bilan birga).",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Chant yana bir marta aytiladi.",
              "Har bir bola sevimli oʻyinchogʻini inglizcha aytadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Sevimli oʻyinchogʻini chizib, boʻyab, tagiga nomini va rangini yozish (a red car).",
          "Uydagi oʻyinchoqlarni oila aʼzolariga inglizcha nomlab berish.",
        ],
        ustozga: "Bolalar grey va green ni, brown va black ni adashtirishi mumkin — kartochkani doim yonma-yon koʻrsating. Rang oʻyinchoqdan oldin kelishi (a red car) oʻzbek tiliga oʻxshash, bu yerda qiyinchilik kam, lekin a artiklini tushirib qoldirishadi.",
      },
      {
        focus: "Joy predloglari: in, on, under, next to va qoʻshiq",
        sb: "20–21",
        maqsad: [
          "Oʻquvchilar in, on, under, next to predloglarini harakat bilan koʻrsata oladilar.",
          "Oʻquvchilar buyum qayerdaligini It is in / on / under / next to … deb ayta oladilar.",
          "Oʻquvchilar Is … under the chair? kabi savolga Yes yoki No bilan javob bera oladilar.",
        ],
        lugat: [
          "in – ichida",
          "on – ustida",
          "under – ostida",
          "next to – yonida",
          "Where is …? – … qayerda?",
          "bag – sumka",
          "chair – stul",
          "table – stol",
        ],
        resurslar: [
          "SB 20–21",
          "Audio CD1 42, 43, 45 (boʻlmasa ustoz oʻzi aytadi)",
          "Karton quti va kichik oʻyinchoq (yoki Monty kabi yumshoq sichqoncha)",
          "Stol, stul, sumka",
          "Predlog kartochkalari (quti va toʻp rasmi)",
        ],
        blocks: [
          {
            title: "Warm-up: oʻyinchoqlar va ranglar",
            minutes: 10,
            points: [
              "4-mashq chanti (CD1 40) kartochkalar bilan aytiladi.",
              "Ustoz oʻyinchoq rasmini qisman ochib koʻrsatadi, bolalar topadi.",
              "Uy vazifasi rasmlari koʻrib chiqiladi: It is a … bilan.",
            ],
          },
          {
            title: "Predloglar bilan tanishuv (quti va oʻyinchoq)",
            minutes: 12,
            points: [
              "Ustoz oʻyinchoqni qutining ichiga, ustiga, ostiga, yoniga qoʻyib har safar It is in / on / under / next to the box. deydi.",
              "Har bir predlogga qoʻl harakati beriladi (in — kaftni idish qilish, on — kaft ustiga musht, under — musht kaft ostida, next to — ikki musht yonma-yon).",
              "Ustoz harakat qiladi, bolalar predlogni aytadi; keyin teskarisi.",
            ],
          },
          {
            title: "Listen and do the actions (SB 20, 5–6-mashqlar)",
            minutes: 15,
            points: [
              "5-mashq (CD1 42): Listen and do the actions — Star oilasining xonasidagi voqea tinglanadi, bolalar eshitgan predlogni qoʻl harakati bilan koʻrsatadi. Audio boʻlmasa, ustoz rasmdagi buyumlar joyini aytadi.",
              "6-mashq (CD1 43): Listen and repeat — savol va javob xor bilan takrorlanadi.",
              "Ustoz rasmdan soʻraydi: Where is the ball? — bolalar javob beradi.",
            ],
          },
          {
            title: "Qoʻshiq (SB 21, 7-mashq)",
            minutes: 15,
            points: [
              "Rasmdagi soʻroq belgilari koʻrib chiqiladi: Suzy nimanidir qidiryapti.",
              "7-mashq (CD1 45): Sing the song — bolalar tinglab, har bir soʻroq belgisini barmoq bilan koʻrsatadi va predlog harakatini qiladi.",
              "Audio boʻlmasa, ustoz sodda ohangda qidiruv savollarini kuylaydi, bolalar javobni harakat bilan qaytaradi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Put your hand on your head",
            minutes: 8,
            points: [
              "Ustoz buyruq beradi: Put your pencil on your book! Put your hand under the table! Stand next to the door!",
              "Bolalar bajaradi, tezlik oshiriladi.",
            ],
          },
          {
            title: "Ask and answer (SB 21, 8-mashq) va Where is Monty? oʻyini",
            minutes: 20,
            points: [
              "8-mashq: Ask and answer — ustoz fotodagi namuna boʻyicha soʻraydi: Is Monty under the chair? Bolalar Yes, he is. / No, he is not. deb javob beradi.",
              "Oʻyin: bir bola eshikdan chiqadi, sinf oʻyinchoqni yashiradi; bola qaytib Is it in the bag? Is it under the table? deb soʻraydi, sinf Yes / No deb javob beradi.",
              "Juftlikda: kitobdagi 7-mashq rasmiga qarab savol-javob.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Toʻrtta predlog harakat bilan tezkor takrorlanadi.",
              "Ustoz oʻyinchoqni qoʻyadi, bolalar joyini aytib chiqib ketadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Xonasini chizib, bitta oʻyinchoqni stol ustiga, bittasini stul ostiga chizish va tagiga on, under deb yozish.",
          "Uyda oʻyinchoqni yashirib, oila aʼzosiga predlog bilan qayerdaligini inglizcha aytish.",
        ],
        ustozga: "Oʻzbek tilida predlog soʻzdan keyin keladi (stol ustida), ingliz tilida esa oldin (on the table) — bolalar the table on deb aytishi mumkin, tartibni qoʻl harakati bilan mustahkamlang. in va on ni eng koʻp adashtirishadi.",
      },
      {
        focus: "Monty phonics (t, d), Hide and play va hikoya",
        sb: "22–23",
        maqsad: [
          "Oʻquvchilar t va d tovushlarini train va doll soʻzlarida aniq talaffuz qila oladilar.",
          "Oʻquvchilar yashirilgan buyumni savol berib topa oladilar.",
          "Oʻquvchilar hikoyani tinglab, gap toʻgʻri yoki notoʻgʻriligini Yes / No bilan ayta oladilar.",
        ],
        lugat: [
          "train – poyezd",
          "doll – qoʻgʻirchoq",
          "ten – oʻn",
          "car – mashina",
          "computer – kompyuter",
          "Yes / No – Ha / Yoʻq",
        ],
        resurslar: [
          "SB 22–23",
          "Audio CD1 48, 51, 52 (boʻlmasa ustoz oʻzi oʻqiydi va rolda aytadi)",
          "Sumka va 4–5 ta sinf buyumi (kitob, qalam, ruchka, oʻchirgʻich)",
          "Qahramon niqoblari (Marie, Maskman, Monty)",
          "T va D kartalari",
        ],
        blocks: [
          {
            title: "Warm-up: qoʻshiq va predloglar",
            minutes: 10,
            points: [
              "7-mashq qoʻshigʻi (CD1 45) harakat bilan kuylanadi.",
              "Ustoz Where is my pen? deb soʻraydi, bolalar It is on the table. deb javob beradi.",
              "Oʻyinchoqlar soʻzlari flashcard bilan tezkor takrorlanadi.",
            ],
          },
          {
            title: "Monty phonics: t va d (SB 22, 9-mashq)",
            minutes: 12,
            points: [
              "9-mashq (CD1 48): Monty phonics — train va doll soʻzlari tinglanadi. Audio boʻlmasa, ustoz aniq talaffuz qiladi.",
              "Kitobdagi ibora sekin, keyin tez takrorlanadi; bolalar poyezd boʻlib saf tortib aytadi.",
              "Ustoz soʻz aytadi (table, desk, ten, doll, two, Suzy), bolalar T yoki D kartasini koʻtaradi.",
            ],
          },
          {
            title: "Hide and play (SB 22, 10-mashq)",
            minutes: 15,
            points: [
              "10-mashq: Hide and play — fotodagi kabi bir bola sumka yoki stul atrofiga buyum yashiradi, sherigi rasmga qarab Is the book under the chair? deb soʻraydi.",
              "Ustoz avval bir bola bilan namuna koʻrsatadi, keyin juftliklar oʻynaydi.",
              "Toʻgʻri topgan bola rol almashadi.",
            ],
          },
          {
            title: "Hikoya: tinglash (SB 23, 11-mashq)",
            minutes: 15,
            points: [
              "Ustoz kadrlarni koʻrsatib soʻraydi: What is Maskman looking for? — bolalar rasmdan taxmin qiladi (car).",
              "11-mashq (CD1 51): Listen to the story — bolalar kadrlarni kuzatib tinglaydi.",
              "Audio boʻlmasa, ustoz hikoyani kadrma-kadr ovoz va mimika bilan aytadi; har kadrda Where is the car? deb bolalardan soʻraydi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Train game",
            minutes: 8,
            points: [
              "Bolalar poyezd boʻlib sinf boʻylab yuradi; ustoz stansiya nomi oʻrniga predlog aytadi (next to the door!), poyezd oʻsha joyda toʻxtaydi.",
              "Poyezd boshidagi bola almashib turadi.",
            ],
          },
          {
            title: "Yes or no va act out (SB 23, 12-mashq)",
            minutes: 20,
            points: [
              "12-mashq (CD1 52): Listen and say yes or no — bolalar hikoya haqidagi gapni tinglab Yes yoki No deydi. Audio boʻlmasa, ustoz hikoya haqida oʻzi toʻgʻri va notoʻgʻri gaplar aytadi.",
              "Yes deganlar qoʻlini yuqoriga, No deganlar pastga tushiradi — butun sinf ishtirok etadi.",
              "Uch bola niqob taqib hikoyani qisqa sahnalashtiradi: Maskman mashinani qidiradi, sinf predlog bilan maslahat beradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Unit 3 soʻzlari Pass the ball bilan takrorlanadi: toʻpni olgan bola oʻyinchoq yoki rang aytadi.",
              "Yulduzcha bilan baholash.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Poyezd chizib, vagonlariga oʻnta qoʻgʻirchoq chizish va sanab, oilaga inglizcha aytib berish.",
          "Bitta oʻyinchoq uchun kartochka yasash: bir tomonida rasm, orqasida nomi.",
        ],
        ustozga: "Hikoyadagi Yes / No mashqida bolalar taxmin bilan javob beradi — javobdan keyin rasmga qaytib tekshiring. Hide and play da oʻquvchilar savol oʻrniga faqat predlog aytadi; Is it … ? boshlanmasini doskada qoldiring.",
      },
    ],
  },

  // ───────────────────────────── UNIT 4 ─────────────────────────────
  {
    unit: 4,
    title: "Unit 4 · My family",
    description: "Oʻquvchilar oila aʼzolarini nomlaydi, odamlarni sifatlar bilan tasvirlaydi va 1–4-unitlarni takrorlaydi.",
    objectives: [
      "Oltita oila aʼzosini nomlab, oilasini tanishtira oladi.",
      "Odamni He is / She is va sifat bilan (happy, old, young …) tasvirlab ayta oladi.",
      "Ranglarni aralashtirib hosil boʻlgan rangni va kechirim, minnatdorlik iboralarini ayta oladi.",
    ],
    vocabulary: [
      "brother",
      "sister",
      "father",
      "mother",
      "grandfather",
      "grandmother",
      "beautiful",
      "ugly",
      "happy",
      "sad",
      "old",
      "young",
      "family",
    ],
    grammar: "He is / She is beautiful / ugly / happy / sad / old / young. / No, she is not. / Here you are. Thanks. I am sorry. That is OK.",
    lessons: [
      {
        focus: "Oila aʼzolari",
        sb: "24–25",
        maqsad: [
          "Oʻquvchilar oltita oila aʼzosini tanib, nomlay oladilar.",
          "Oʻquvchilar rasmga qarab This is my … deb oila aʼzosini tanishtira oladilar.",
          "Oʻquvchilar eshitgan soʻzni rasm raqami bilan moslay oladilar.",
        ],
        lugat: [
          "family – oila",
          "mother – ona",
          "father – ota",
          "sister – opa, singil",
          "brother – aka, uka",
          "grandmother – buvi",
          "grandfather – bobo",
        ],
        resurslar: [
          "SB 24–25",
          "Audio CD2 2, 3, 5, 6 (boʻlmasa ustoz oʻzi aytadi)",
          "Oila aʼzolari flashcardlari (yoki doskaga chizilgan oila daraxti)",
          "Ustozning oila surati yoki chizilgan oila rasmi",
          "Qogʻoz va rangli qalamlar",
        ],
        blocks: [
          {
            title: "Warm-up: Unit 3 takrori",
            minutes: 10,
            points: [
              "Predloglar qoʻshigʻi (CD1 45) harakat bilan kuylanadi.",
              "Ustoz buyumni yashiradi, bolalar Is it under the …? deb soʻrab topadi.",
              "Oʻyinchoqlar va ranglar tezkor takrorlanadi.",
            ],
          },
          {
            title: "Lugʻat: oila (SB 24, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz oʻz oilasi rasmini koʻrsatib This is my mother. deb tanishtiradi.",
              "1-mashq (CD2 2): Listen and point — Suzy oila albomidagi suratlar; bolalar eshitgan oila aʼzosini koʻrsatadi. Audio boʻlmasa, ustoz soʻzlarni aralash aytadi.",
              "2-mashq (CD2 3): Listen and repeat — soʻzlar xor, keyin qatorlar boʻyicha takrorlanadi.",
            ],
          },
          {
            title: "Tinglash (SB 25, 3-mashq)",
            minutes: 12,
            points: [
              "3-mashq (CD2 5): Listen and say the number — Stella oilasining suratlari; bolalar eshitgan oila aʼzosining raqamini aytadi. Audio boʻlmasa, ustoz Stella rolida oila aʼzosini aytadi.",
              "Ustoz raqam aytadi, bolalar oila aʼzosini aytadi.",
            ],
          },
          {
            title: "Look, listen and say (SB 25, 4-mashq)",
            minutes: 13,
            points: [
              "4-mashq (CD2 6): Look, listen and say the words — bolalar suratlarga qarab tinglaydi va soʻzni aytadi. Audio boʻlmasa, ustoz suratni koʻrsatib, bolalar oʻzi aytadi.",
              "Flashcardlar tez almashtiriladi: Flash! — bolalar soʻzni aytadi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Family actions",
            minutes: 8,
            points: [
              "Har bir oila aʼzosiga harakat: grandfather — hassaga suyanib yurish, baby sister — beshik tebratish, mother — ovqat pishirish.",
              "Ustoz soʻzni aytadi, bolalar harakat qiladi; keyin bolalar boshqaradi.",
            ],
          },
          {
            title: "Oila rasmi va Pass the ball",
            minutes: 22,
            points: [
              "Bolalar oʻz oilasini chizadi (10 daqiqa), ustoz yurib Who is this? deb soʻraydi.",
              "Juftlikda rasmlarni koʻrsatib This is my brother. He is … deb tanishtiradi.",
              "Pass the ball: toʻpni olgan bola bitta oila aʼzosini aytadi, takrorlash mumkin emas.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Uch-toʻrt bola oila rasmini sinfga koʻrsatadi.",
              "Flashcardlar bilan tezkor yakuniy takror.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Oila rasmini tugatib, har bir odam tagiga mother, father, sister va h.k. deb imzolash.",
          "Oila aʼzolarini inglizcha nomlab, ularga oʻrgatish.",
        ],
        ustozga: "Oʻzbek tilida aka va uka, opa va singil alohida soʻz, ingliz tilida esa bitta — bolalar bunga hayron boʻladi, oldindan tushuntiring. Oilasi toʻliq boʻlmagan bolalar boʻlishi mumkin: rasmga kimni xohlasa, shuni chizishiga ruxsat bering.",
      },
      {
        focus: "Sifatlar: He is / She is happy, old … va qoʻshiq",
        sb: "26–27",
        maqsad: [
          "Oʻquvchilar oltita sifatni mimika bilan koʻrsatib, ayta oladilar.",
          "Oʻquvchilar He is / She is + sifat bilan odamni tasvirlay oladilar.",
          "Oʻquvchilar oila qoʻshigʻini kuylab, chantni ayta oladilar.",
        ],
        lugat: [
          "happy – xursand",
          "sad – xafa",
          "old – qari, keksa",
          "young – yosh",
          "beautiful – chiroyli",
          "ugly – xunuk",
          "party – bayram, ziyofat",
        ],
        resurslar: [
          "SB 26–27",
          "Audio CD2 8, 9, 11, 13 (boʻlmasa ustoz oʻzi aytadi)",
          "Sifat flashcardlari (xursand va xafa yuz, keksa va yosh odam)",
          "Oila aʼzolari flashcardlari",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: oila soʻzlari",
            minutes: 10,
            points: [
              "Family actions harakatli oʻyini bilan oila soʻzlari takrorlanadi.",
              "Ikki-uch bola oila rasmini koʻrsatib This is my … deydi.",
            ],
          },
          {
            title: "Sifatlar bilan tanishuv (SB 26, 5-mashq)",
            minutes: 15,
            points: [
              "Ustoz yuz ifodasi va gavda bilan koʻrsatadi: happy — tabassum, sad — yigʻlamsirash, old — bukchayib yurish, young — sakrash.",
              "5-mashq (CD2 8): Listen and point — Star oilasi uy oldida; bolalar eshitgan sifatga mos odamni koʻrsatadi. Audio boʻlmasa, ustoz He is sad. kabi gaplarni aytadi.",
              "Ustoz doskaga He is / She is + sifat jadvalini chizadi.",
            ],
          },
          {
            title: "Listen and do the actions (SB 26, 6-mashq)",
            minutes: 12,
            points: [
              "6-mashq (CD2 9): Listen and do the actions — bolalar eshitgan sifatni mimika bilan koʻrsatadi. Audio boʻlmasa, ustoz sifatlarni tartibsiz aytadi.",
              "Charades: bir bola sifatni imo bilan koʻrsatadi, sinf He is happy! / She is old! deb topadi.",
            ],
          },
          {
            title: "Qoʻshiq (SB 27, 7-mashq)",
            minutes: 15,
            points: [
              "Rasmdagi bayram koʻrib chiqiladi: Who is this? — She is Grandma. She is happy.",
              "7-mashq (CD2 11): Sing the song — bolalar tinglab, oila aʼzosi aytilganda uning harakatini qiladi, keyin birga kuylaydi.",
              "Audio boʻlmasa, ustoz sodda ohangda oila aʼzolari va sifatlarni kuylaydi, bolalar qaytaradi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Freeze dance",
            minutes: 8,
            points: [
              "Qoʻshiq yoki qarsak ostida bolalar raqs tushadi; ustoz toʻxtab sifat aytadi (sad!), bolalar shu holatda qotib qoladi.",
              "Eng yaxshi qotgan bola keyingi sifatni aytadi.",
            ],
          },
          {
            title: "Chant va Guess who oʻyini (SB 27, 8-mashq)",
            minutes: 20,
            points: [
              "8-mashq (CD2 13): Listen and chant — bolalar ritm bilan qarsak chalib chantni aytadi. Audio boʻlmasa, ustoz oila soʻzlari va sifatlarni ritm bilan aytadi.",
              "Guess who: ustoz kitobdagi bir qahramonni tasvirlaydi (She is old. She is happy.), bolalar kimligini topadi.",
              "Juftlikda: bir bola tasvirlaydi, sherigi rasmdan topadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Sifatlar mimika bilan tezkor takrorlanadi.",
              "Har bir bola bitta oila aʼzosini sifat bilan aytib chiqadi (My grandmother is happy).",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Xursand va xafa yuz chizib, tagiga happy va sad deb yozish.",
          "Oila aʼzolaridan birini sifat bilan tasvirlab, uyga inglizcha aytib berish (My father is happy).",
        ],
        ustozga: "ugly soʻzini sinfdoshlarga nisbatan ishlatmaslikni kelishib oling — faqat multfilm qahramonlari va niqoblar uchun. Bolalar He is ni tushirib, faqat sifatni aytadi; toʻliq gapni doskadagi jadval bilan eslating.",
      },
      {
        focus: "Monty phonics (a), Listen and correct va hikoya",
        sb: "28–29",
        maqsad: [
          "Oʻquvchilar a tovushini sad, happy, cat soʻzlarida aniq talaffuz qila oladilar.",
          "Oʻquvchilar notoʻgʻri tasvirni No, she is not. She is … deb toʻgʻrilay oladilar.",
          "Oʻquvchilar hikoyani tinglab, kadr raqamini topa oladilar.",
        ],
        lugat: [
          "cat – mushuk",
          "sad – xafa",
          "happy – xursand",
          "beautiful – chiroyli",
          "ugly – xunuk",
          "Look at … – … ga qara",
        ],
        resurslar: [
          "SB 28–29",
          "Audio CD2 14, 15, 18, 19 (boʻlmasa ustoz oʻzi oʻqiydi va rolda aytadi)",
          "Sifat flashcardlari",
          "Qahramon niqoblari (Marie, Maskman, Monty)",
          "Xursand va xafa yuzli ikki tomonlama kartochka (har bir bolaga)",
        ],
        blocks: [
          {
            title: "Warm-up: qoʻshiq va sifatlar",
            minutes: 10,
            points: [
              "7-mashq qoʻshigʻi (CD2 11) harakat bilan kuylanadi.",
              "Charades: sifatlar mimika bilan topiladi.",
              "Oila soʻzlari flashcard bilan tezkor takrorlanadi.",
            ],
          },
          {
            title: "Monty phonics: a tovushi (SB 28, 9-mashq)",
            minutes: 12,
            points: [
              "9-mashq (CD2 14): Monty phonics — sad va happy soʻzlari tinglanadi; bolalar xafa va xursand mushuk yuzini koʻrsatadi. Audio boʻlmasa, ustoz aniq talaffuz qiladi.",
              "Kitobdagi ibora avval xafa ovozda, keyin xursand ovozda takrorlanadi.",
              "Ustoz soʻz aytadi (cat, bag, pen, black, red, happy), a tovushi boʻlsa bolalar xursand yuzni koʻrsatadi.",
            ],
          },
          {
            title: "Listen and correct (SB 28, 10-mashq)",
            minutes: 15,
            points: [
              "Rasmdagi gʻalati oila koʻrib chiqiladi: Who is this? — bolalar oila soʻzlari bilan javob beradi.",
              "10-mashq (CD2 15): Listen and correct — audio notoʻgʻri tasvir aytadi, bolalar No, she is not. She is … deb toʻgʻrilaydi. Audio boʻlmasa, ustoz rasmga qarab atayin notoʻgʻri gaplar aytadi.",
              "Juftlikda: bir bola notoʻgʻri gap aytadi, sherigi toʻgʻrilaydi.",
            ],
          },
          {
            title: "Hikoya: tinglash (SB 29, 11-mashq)",
            minutes: 15,
            points: [
              "Ustoz kadrlarni koʻrsatib oʻzbekcha soʻraydi: Monty nega xafa? Oxirida nima boʻldi?",
              "11-mashq (CD2 18): Listen to the story — bolalar kadrlarni kuzatib tinglaydi.",
              "Audio boʻlmasa, ustoz hikoyani kadrma-kadr ovoz va mimika bilan aytadi, har kadrda Is Monty happy or sad? deb soʻraydi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Happy or sad?",
            minutes: 8,
            points: [
              "Ustoz vaziyat aytadi (oʻzbekcha: tugʻilgan kun, toʻp yoʻqoldi), bolalar happy yoki sad deb yuz ifodasi bilan koʻrsatadi.",
              "Keyin inglizcha: ustoz happy desa sakraydi, sad desa choʻkkalaydi.",
            ],
          },
          {
            title: "Kadr raqami va act out (SB 29, 12-mashq)",
            minutes: 20,
            points: [
              "12-mashq (CD2 19): Listen and say the number — bolalar eshitgan qismga mos kadr raqamini aytadi. Audio boʻlmasa, ustoz kadr mazmunini sodda gap bilan aytadi.",
              "Uch guruh (Marie, Maskman, Monty) hikoyani ovoz va mimika bilan sahnalashtiradi.",
              "Tomoshabinlar har kadrda qahramonning holatini (happy, sad) aytib boradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Unit 4 soʻzlari Pass the ball bilan takrorlanadi.",
              "Yulduzcha bilan baholash.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Xafa mushuk va xursand mushuk chizib, tagiga sad cat, happy cat deb yozish.",
          "Hikoyani rasmlarga qarab oilaga oʻzbekcha aytib berish.",
        ],
        ustozga: "a tovushini bolalar e ga yaqin aytishi kerak (cat, bag) — ogʻizni keng ochib koʻrsating. Listen and correct da No dan keyin qisqa inkor gapni toʻliq aytishni talab qilmang, No, she is … She is beautiful. kifoya.",
      },
      {
        focus: "Marie sahifasi (art): ranglarni aralashtirish va Trevor values: mehribon boʻlish",
        sb: "30–31",
        maqsad: [
          "Oʻquvchilar ikki rang aralashmasidan qaysi rang chiqishini inglizcha ayta oladilar.",
          "Oʻquvchilar Here you are. Thanks. I am sorry. That is OK. iboralarini oʻrinli ishlata oladilar.",
          "Oʻquvchilar mehribonlik va kechirim soʻrash haqida hayotiy misol bilan fikr bildira oladilar.",
        ],
        lugat: [
          "mix – aralashtirmoq",
          "What is blue and red? – Koʻk va qizil nima boʻladi?",
          "Here you are. – Mana, ol.",
          "Thanks. – Rahmat.",
          "I am sorry. – Kechirasiz.",
          "That is OK. – Hechqisi yoʻq.",
          "kind – mehribon",
        ],
        resurslar: [
          "SB 30–31",
          "Audio CD2 20, 21, 22 (boʻlmasa ustoz oʻzi aytadi va rolda oʻqiydi)",
          "Guash yoki akvarel boʻyoqlar (qizil, sariq, koʻk, oq, qora), moʻyqalam, suv",
          "Qogʻoz, salfetka",
          "Rang kartochkalari",
        ],
        blocks: [
          {
            title: "Warm-up: ranglar",
            minutes: 10,
            points: [
              "Unit 1 ranglar qoʻshigʻi (CD1 10) va Unit 3 chanti (CD1 40) takrorlanadi.",
              "Touch something … oʻyini bilan barcha 11 ta rang takrorlanadi.",
            ],
          },
          {
            title: "Marie sahifasi (art): Listen and say (SB 30, 1-mashq)",
            minutes: 12,
            points: [
              "1-mashq (CD2 20): Listen and say — palitradagi rang aralashmalari tinglanadi, bolalar hosil boʻlgan rangni aytadi. Audio boʻlmasa, ustoz ikki rangni aytib, natijani bolalar bilan birga topadi.",
              "Ustoz doskaga rang + rang = ? sxemasini rangli bor bilan chizadi.",
            ],
          },
          {
            title: "Look and guess. Do. (SB 30, 2-mashq)",
            minutes: 18,
            points: [
              "2-mashq: Look and guess — bolalar uchta idishdagi aralashma qaysi rang boʻlishini taxmin qiladi: What is blue and red? — Purple!",
              "Do: bolalar guruhlarda boʻyoqlarni haqiqatan aralashtirib, taxmin toʻgʻri chiqqanini tekshiradi.",
              "Har guruh natijani koʻrsatib Red and white — pink! deb aytadi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Colour mix",
            minutes: 7,
            points: [
              "Bolalarga rang kartochkalari tarqatiladi; ustoz Purple! desa koʻk va qizil kartali bolalar bir-birini topib qoʻl ushlashadi.",
              "Ikki-uch tur oʻynaladi.",
            ],
          },
          {
            title: "Trevor values: hikoya (SB 31, 3-mashq)",
            minutes: 15,
            points: [
              "Ustoz birinchi kadrni koʻrsatib oʻzbekcha soʻraydi: Nima boʻldi? Qiz bola nimani his qildi?",
              "3-mashq (CD2 21): Listen to the story — bolalar kadrlarni kuzatib tinglaydi. Audio boʻlmasa, ustoz kadrma-kadr sodda inglizcha va imo-ishora bilan aytib beradi.",
              "Functions iboralari doskaga yoziladi va imo bilan takrorlanadi: Here you are. Thanks. I am sorry. That is OK.",
            ],
          },
          {
            title: "Qadriyat muhokamasi va act out (SB 31, 4-mashq)",
            minutes: 18,
            points: [
              "4-mashq (CD2 22): Listen and say the number. Act it out — bolalar eshitgan iboraga mos kadr raqamini aytadi, keyin juftlikda sahnalashtiradi. Audio boʻlmasa, ustoz iborani aytadi.",
              "Oʻzbekcha muhokama: Birovni bexosdan turtib yuborsangiz yoki qalamini sindirsangiz nima deysiz? Sinfdoshingizning qalami boʻlmasa-chi? Bolalar oʻz hayotidan misol aytadi.",
              "Rolli oʻyin: bir bola qalamini tushiradi, sherigi olib Here you are. deydi; bir bola bexosdan urilib I am sorry. deydi, sherigi That is OK. deb javob beradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz har bir bolaga bittadan kartochka uzatib Here you are. deydi, bola Thanks. deb oladi.",
              "Bugun kim mehribonlik qilganini soʻrab, yulduzcha beriladi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Ikki rangni aralashtirib (boʻyoq yoki qalam bilan), natijani chizish va tagiga red + yellow = orange kabi yozish.",
          "Uyda bir kun davomida Here you are, Thanks, I am sorry iboralarini oilada ishlatib koʻrish.",
        ],
        ustozga: "Boʻyoq bilan ishlashda vaqt choʻzilib ketadi — materiallarni oldindan guruhlarga tarqatib qoʻying va salfetka tayyorlang. Values muhokamasida bolalarni ayblamang, ijobiy misollarni maqtang.",
      },
      {
        focus: "Review 1–4: takrorlash oʻyinlari va spinner",
        sb: "32–33",
        maqsad: [
          "Oʻquvchilar 1–4-unitlar lugʻatini (sonlar, ranglar, sinf buyumlari, oʻyinchoqlar, oila) eslab ayta oladilar.",
          "Oʻquvchilar buyumni rang va joy bilan tasvirlab, sherigiga topishmoq qila oladilar.",
          "Oʻquvchilar spinner yasab, oʻyinda oila aʼzolari va sifatlarni ishlata oladilar.",
        ],
        lugat: [
          "spinner – aylanadigan oʻyinchoq (charxpalak)",
          "guess – topmoq",
          "number – raqam",
          "colour – rang",
          "It is green. – U yashil.",
          "It is on a chair. – U stul ustida.",
        ],
        resurslar: [
          "SB 32–33",
          "Audio CD2 23, 25 (boʻlmasa ustoz oʻzi aytadi)",
          "Spinner uchun qalin qogʻoz shabloni (olti burchak), qaychi, yelim, qalam, rangli qalamlar",
          "1–4-unitlar flashcardlari",
          "Toʻp va jamoa ochkolari uchun doska",
        ],
        blocks: [
          {
            title: "Warm-up: qoʻshiqlar marafoni",
            minutes: 10,
            points: [
              "Har unitdan bitta qoʻshiq yoki chant qisqa aytiladi: sonlar (CD1 6), ranglar (CD1 10), buyumlar (CD1 22), oila qoʻshigʻi (CD2 11).",
              "Sinf ikki jamoaga boʻlinadi, darsning oxirigacha ochko yigʻiladi.",
            ],
          },
          {
            title: "Listen and say the number (SB 32, 1-mashq)",
            minutes: 15,
            points: [
              "1-mashq (CD2 23): Listen and say the number — oʻnta rasm; bolalar eshitgan tasvirga mos rasm raqamini aytadi. Audio boʻlmasa, ustoz rasmni tasvirlaydi (rang, son, joy bilan).",
              "Jamoaviy: birinchi toʻgʻri raqam aytgan jamoa ochko oladi.",
              "Har rasmdagi soʻz qaysi unitdan ekanini birga eslaymiz.",
            ],
          },
          {
            title: "Say and guess (SB 32, 2-mashq)",
            minutes: 15,
            points: [
              "2-mashq: Say and guess — ustoz fotodagi namuna boʻyicha bitta rasmni rang va joy bilan tasvirlaydi, bolalar raqamini topadi.",
              "Juftlikda: bir bola 1-mashq rasmlaridan birini tanlab ikki gap bilan tasvirlaydi, sherigi raqamni aytadi.",
              "Kuchli oʻquvchilar sinfdagi haqiqiy buyumlar haqida topishmoq qiladi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Simon says (1–4-unitlar)",
            minutes: 7,
            points: [
              "Simon says: touch something blue, put your pen on your book, be happy, be old …",
              "Buyruqlarda barcha unitlar soʻzlari aralashtiriladi.",
            ],
          },
          {
            title: "Listen and colour. Make a spinner. (SB 33, 3-mashq)",
            minutes: 18,
            points: [
              "3-mashq (CD2 25): Listen and colour — bolalar spinner shablonining boʻlaklarini eshitgan rangga boʻyaydi. Audio boʻlmasa, ustoz raqam va rangni aytadi (Number one is red).",
              "Fotodagi bosqichlar boʻyicha: kesish, yelimlash, oʻrtasiga qalam oʻtkazish. Ustoz shablonni oldindan tayyorlab beradi.",
              "Tayyor boʻlganlar spinnerni aylantirib, chiqqan son va rangni aytadi.",
            ],
          },
          {
            title: "Play the game (SB 33, 4-mashq)",
            minutes: 15,
            points: [
              "4-mashq: Play the game — juftlikda spinner aylantiriladi; chiqqan raqamdagi qahramon (Star oilasi) topiladi va u haqida gapiriladi: He is Mr Star. He is the father. He is happy.",
              "Bir qahramon ikki marta chiqsa, yangi sifat bilan tasvirlash kerak.",
              "Ustoz yurib yordam beradi, eng yaxshi tasvir uchun jamoaga ochko beradi.",
            ],
          },
          {
            title: "Yakun: jamoa natijasi va uy vazifasi",
            minutes: 10,
            points: [
              "Ochkolar sanaladi, gʻolib jamoa tabriklanadi.",
              "Har bir bola 1–4-unitlardan eng yoqqan soʻzini aytadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Spinnerni uyga olib borib, oila aʼzosi bilan oʻynash: chiqqan son va rangni inglizcha aytish.",
          "1–4-unitlardan sevimli beshta soʻz uchun flashcard yasash (bir tomonida rasm, orqasida soʻz).",
        ],
        ustozga: "Review darsida baho qoʻyish emas, qaysi soʻzlar esdan chiqqanini aniqlash muhim — tez-tez adashilgan soʻzlarni daftarga belgilab, keyingi darslar warm-up iga qoʻshing. Spinner yasashga vaqt koʻp ketmasligi uchun shablonlarni oldindan kesib qoʻyish mumkin.",
      },
    ],
  },
];
