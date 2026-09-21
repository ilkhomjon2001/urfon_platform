import type { BookUnit } from "../prepare1/types.js";

// Starter (8–12 yosh) — Cambridge Kid Box 1, Pupil Book, 9–12-unitlar (kitob betlari 64–93).
// Markazda faqat Pupil Book bor: Activity Book, Teacher Book va audio yoʻq,
// shuning uchun har audio qadamda ustoz oʻzi oʻqib beradigan muqobil yozilgan.

export const KB1_UNITS_09_12: BookUnit[] = [
  // ───────────────────────────── Unit 9 ─────────────────────────────
  {
    unit: 9,
    title: "Unit 9 · Fun time!",
    description: "Sport va boʻsh vaqt mashgʻulotlari, can / cannot bilan nima qila olishini aytish.",
    objectives: [
      "Sport va oʻyin mashgʻulotlarini (play football, swim, ride a bike) nomlab ayta oladi.",
      "I can … / I cannot … bilan oʻzi va boshqalar nima qila olishini ayta oladi.",
      "Can you …? savolini berib, Yes, I can. / No, I cannot. deb javob ayta oladi.",
    ],
    vocabulary: [
      "play basketball",
      "play football",
      "play tennis",
      "play the guitar",
      "play the piano",
      "swim",
      "ride a bike",
      "ride a horse",
      "sing",
      "draw",
      "drive a car",
    ],
    grammar: "I / You / He / She can … ; I / You / He / She cannot (can not) … ; Can you …? – Yes, I can. / No, I cannot. ; Who can …?",
    lessons: [
      {
        focus: "Sport va oʻyinlar: play football, swim, ride a bike",
        sb: "64–65",
        maqsad: [
          "Oʻquvchilar 8 ta mashgʻulot nomini rasmga qarab ayta oladilar.",
          "Oʻquvchilar mashgʻulotni harakat bilan koʻrsatib, nomini xor bilan takrorlay oladilar.",
          "Oʻquvchilar Maskman qoʻshigʻini harakatlar bilan kuylay oladilar.",
        ],
        lugat: [
          "play football – futbol oʻynamoq",
          "play basketball – basketbol oʻynamoq",
          "play tennis – tennis oʻynamoq",
          "play the guitar – gitara chalmoq",
          "play the piano – pianino chalmoq",
          "swim – suzmoq",
          "ride a bike – velosiped haydamoq",
          "fun – qiziqarli, maroqli",
        ],
        resurslar: [
          "SB 64–65",
          "Audio CD3 38, 39, 41, 42 (boʻlmasa ustoz oʻzi oʻqiydi)",
          "Mashgʻulot flashcardlari (8 ta, ustoz oldindan chizadi yoki chop etadi)",
          "Kichik yumshoq toʻp",
          "Doska va rangli markerlar",
        ],
        blocks: [
          {
            title: "Warm-up: Unit 8 kiyimlarini takrorlash",
            minutes: 10,
            points: [
              "Ustoz kiyim flashcardlarini (jacket, shoes, skirt, socks, trousers, T-shirt) tez koʻrsatadi, bolalar nomini aytadi.",
              "Stand up if you have got … oʻyini: ustoz kiyim va rangni aytadi, shunday kiyim kiygan bolalar oʻrnidan turadi.",
            ],
          },
          {
            title: "Yangi soʻzlar: flashcard va harakat (SB 64, 1-mashq)",
            minutes: 15,
            points: [
              "Ustoz har mashgʻulotni harakat bilan koʻrsatadi (toʻp tepish, suzish, gitara chalish) va nomini aytadi; bolalar harakatni takrorlaydi.",
              "1-mashq (CD3 38): Listen and point — bolalar tinglab, kitobdagi rasmni barmogʻi bilan koʻrsatadi. Audio boʻlmasa, ustoz soʻzlarni aralash tartibda oʻqiydi.",
              "2-mashq (CD3 39): Listen and repeat — xor bilan, keyin qator-qator takrorlanadi. Audio boʻlmasa, ustoz oʻzi aytadi.",
            ],
          },
          {
            title: "TPR oʻyini: Simon says",
            minutes: 10,
            points: [
              "Ustoz Simon says, play tennis! / Simon says, swim! deydi, bolalar harakatni bajaradi; Simon says siz aytilsa harakat qilinmaydi.",
              "Yutqazgan bola chiqmaydi, balki ustoz yordamchisi boʻlib keyingi buyruqni aytadi.",
            ],
          },
          {
            title: "Listen and answer: Maskman (SB 65, 3-mashq)",
            minutes: 15,
            points: [
              "3-mashq (CD3 41): bolalar tinglaydi va Maskman nima qilayotganini rasm raqami bilan aytadi. Audio boʻlmasa, ustoz raqamni aytib soʻraydi: Number 4. What is it? — Swim!",
              "Juftlikda: biri raqam aytadi, sherigi mashgʻulot nomini aytadi, keyin almashadi.",
            ],
          },
          {
            title: "Harakatli tanaffus va qoʻshiq (SB 65, 4-mashq)",
            minutes: 15,
            points: [
              "4-mashq (CD3 42): Sing the song — avval tinglanadi, keyin har mashgʻulot uchun harakat kelishib olinadi.",
              "Qoʻshiq ikki marta harakat bilan kuylanadi. Audio boʻlmasa, ustoz kitobdagi 6 rasm tartibida mashgʻulotlarni oddiy kuyga solib aytadi, bolalar takrorlaydi.",
            ],
          },
          {
            title: "Oʻyin: Pass the ball",
            minutes: 15,
            points: [
              "Bolalar doira boʻlib turadi, toʻp qoʻldan qoʻlga oʻtadi; ustoz qarsak chalganda toʻp kimda boʻlsa, ustoz koʻrsatgan flashcardni nomlaydi.",
              "Ikkinchi aylanada bola oʻzi harakat qiladi, qolganlar nomini topadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz flashcardlarni doskaga ilib bittasini yashiradi; bolalar qaysi biri yoʻqligini topadi (What is missing?).",
              "Uy vazifasi tushuntiriladi, qoʻshiq yana bir marta kuylanadi.",
            ],
          },
        ],
        uyga: [
          "Oʻzingiz yaxshi koʻradigan 2 ta mashgʻulotni chizib, tagiga inglizcha nomini ustoz namunasidan koʻchirib yozing.",
          "Oilangizga 8 ta mashgʻulotni harakat bilan koʻrsatib, inglizcha nomini oʻrgating.",
        ],
        ustozga: "Bolalar play soʻzini swim va ride a bike oldiga ham qoʻshib yuboradi — musiqa asbobi va toʻpli oʻyinlarda play, qolganlarida yoʻqligini harakat bilan farqlang. play the guitar / the piano da the ni tushirib qoldirmaslikka eʼtibor bering.",
      },
      {
        focus: "I can / I cannot va Who can …?",
        sb: "66–67",
        maqsad: [
          "Oʻquvchilar I can … / I cannot … bilan oʻzi haqida 3 ta gap ayta oladilar.",
          "Oʻquvchilar He can … / She can … bilan rasmdagi odamni tasvirlay oladilar.",
          "Oʻquvchilar Who can …? savoliga ism bilan javob bera oladilar.",
        ],
        lugat: [
          "can – qila olmoq",
          "cannot (can not) – qila olmaslik",
          "sing – qoʻshiq aytmoq",
          "draw – rasm chizmoq",
          "ride a horse – ot minmoq",
          "drive a car – mashina haydamoq",
          "fish – baliq tutmoq",
          "who – kim",
        ],
        resurslar: [
          "SB 66–67",
          "Audio CD3 44, 45, 47, 48 (boʻlmasa ustoz oʻzi oʻqiydi)",
          "Mashgʻulot flashcardlari",
          "Doskada chizilgan jadval: yashil belgi (can) va qizil belgi (cannot)",
          "Yulduzcha stikerlar",
        ],
        blocks: [
          {
            title: "Warm-up: mashgʻulotlarni takrorlash",
            minutes: 10,
            points: [
              "Oʻtgan darsdagi qoʻshiq harakat bilan kuylanadi.",
              "Ustoz jim turib harakat qiladi, bolalar nomini topadi (Mime and guess).",
            ],
          },
          {
            title: "Grammar: can / cannot (SB 66, 5–6-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz oʻzi haqida koʻrsatadi: I can swim (bosh irgʻab, yashil belgi). I cannot play the piano (bosh chayqab, qizil belgi).",
              "5-mashq (CD3 44): Listen and point — rasmdagi portretlar va bolalar gaplari tinglanadi, bolalar kim haqida gap ketayotganini koʻrsatadi. Audio boʻlmasa, ustoz gaplarni oʻzi aytadi.",
              "6-mashq (CD3 45): Listen and repeat — gaplar xor bilan takrorlanadi; cannot da bosh chayqash harakati qoʻshiladi.",
            ],
          },
          {
            title: "Oʻzi haqida: can yoki cannot",
            minutes: 15,
            points: [
              "Ustoz flashcardni koʻtaradi, har bola oʻzi uchun I can … yoki I cannot … deydi va bosh harakati qiladi.",
              "Bolalar doskadagi jadvalga ismini yozadi yoki stiker yopishtiradi: kim nima qila oladi.",
              "Jadvalga qarab ustoz soʻraydi, bolalar javob beradi: Ali can swim. Madina cannot ride a horse.",
            ],
          },
          {
            title: "Chant: harakatli tanaffus (SB 67, 7-mashq)",
            minutes: 10,
            points: [
              "7-mashq (CD3 47): Say the chant — rasmlarga qarab chant tinglanadi va qarsak bilan ritm ushlanadi.",
              "Audio boʻlmasa, ustoz rasmlar tartibida I can … / I cannot … gaplarini ritm bilan aytadi, bolalar qaytaradi; ikki guruh navbatma-navbat aytadi.",
            ],
          },
          {
            title: "Listen and answer: Who can …? (SB 67, 8-mashq)",
            minutes: 15,
            points: [
              "8-mashq (CD3 48): bolalar tinglaydi va Who can …? savoliga rasmdagi odam nomi bilan javob beradi. Audio boʻlmasa, ustoz 7 ta rasm boʻyicha savolni oʻzi beradi.",
              "Bolalar rasmdagi personajni tanlab, sherigiga He can … / She can … deb tasvirlaydi.",
            ],
          },
          {
            title: "Oʻyin: Find someone who can …",
            minutes: 15,
            points: [
              "Har bolaga 3 ta rasmli kartochka beriladi (swim, ride a bike, draw va h.k.).",
              "Bolalar sinf boʻylab yurib Can you swim? deb soʻraydi; Yes, I can javobini bergan bolaning ismini kartochkaga yozadi.",
              "Oʻyin oxirida 3–4 bola natijani aytadi: Sardor can swim.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz tez savol beradi: Who can sing? — bolalar qoʻl koʻtaradi va I can sing! deydi.",
              "Uy vazifasi tushuntiriladi, chant yana bir marta aytiladi.",
            ],
          },
        ],
        uyga: [
          "Oʻzingizni ikki rasmda chizing: biri qila oladigan ishingiz, ikkinchisi qila olmaydigan ishingiz; ustoz bilan yozgan I can … / I cannot … gapini tagiga koʻchiring.",
          "Chantni uyda oila aʼzolari bilan ritm bilan takrorlang.",
        ],
        ustozga: "Bolalar He cans swim yoki She can swims deb qoʻshimcha qoʻshib yuboradi — can dan keyin feʼl oʻzgarmasligini koʻp misol bilan eshittiring. cannot ni bosh chayqash harakati bilan bogʻlasangiz, inkorni tezroq eslab qoladilar.",
      },
      {
        focus: "Monty phonics (l) va hikoya: Maskman qoʻshiq aytadi",
        sb: "68–69",
        maqsad: [
          "Oʻquvchilar l tovushini soʻz boshida va oʻrtasida toʻgʻri talaffuz qila oladilar.",
          "Oʻquvchilar Can you …? savolini berib, qisqa javob bera oladilar.",
          "Oʻquvchilar rasmli hikoyani tinglab, uni rollarga boʻlib sahnalashtira oladilar.",
        ],
        lugat: [
          "Lily – Lili (ot ismi)",
          "blue – koʻk",
          "yellow – sariq",
          "tail – dum",
          "Can you …? – … qila olasanmi?",
          "Yes, I can. – Ha, qila olaman.",
          "No, I cannot. – Yoʻq, qila olmayman.",
          "story – hikoya",
        ],
        resurslar: [
          "SB 68–69",
          "Audio CD3 49, 51 (boʻlmasa ustoz oʻzi oʻqiydi)",
          "Mashgʻulot flashcardlari",
          "Hikoya uchun oddiy rekvizit: niqob (Maskman), sichqon quloqlari (Monty)",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: can / cannot takrori",
            minutes: 10,
            points: [
              "Ustoz flashcard koʻrsatadi va bitta bolaga Can you …? deb soʻraydi; bola harakat bilan javob beradi.",
              "Chant bir marta qarsak bilan takrorlanadi.",
            ],
          },
          {
            title: "Monty phonics: l tovushi (SB 68, 9-mashq)",
            minutes: 12,
            points: [
              "9-mashq (CD3 49): Lily, blue va rasm ostidagi gap tinglanadi; bolalar l harfi rangli yozilgan joylarni barmogʻi bilan koʻrsatadi. Audio boʻlmasa, ustoz sekin va aniq oʻqiydi.",
              "Tilni tishlar orqasiga tekkizish koʻrsatiladi; gap avval sekin, keyin tez, keyin shivirlab aytiladi (tongue twister oʻyini).",
              "Bolalar l tovushi bor boshqa soʻzlarni eslaydi: lion, leg, lorry, long.",
            ],
          },
          {
            title: "Ask and answer: Can you …? (SB 68, 10-mashq)",
            minutes: 15,
            points: [
              "10-mashq: ustoz fotosuratdagi ikki bola suhbatini bir oʻquvchi bilan namuna qilib koʻrsatadi.",
              "Juftlikda: bolalar flashcardlar boʻyicha bir-biriga 4 ta savol beradi va qisqa javob qaytaradi.",
              "2–3 juftlik sinf oldida chiqib savol-javob qiladi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Musical statues",
            minutes: 8,
            points: [
              "Ustoz qoʻshiq qoʻyadi yoki qarsak chaladi, bolalar harakat qiladi; toʻxtaganda ustoz bitta mashgʻulotni aytadi va bolalar shu holatda qotib qoladi (swim, play the guitar).",
            ],
          },
          {
            title: "Hikoya: Listen to the story (SB 69, 11-mashq)",
            minutes: 17,
            points: [
              "Tinglashdan oldin ustoz 6 ta rasmni koʻrsatib soʻraydi: Who is this? What can Maskman do? — bolalar taxmin qiladi.",
              "11-mashq (CD3 51): hikoya ikki marta tinglanadi, bolalar rasm raqamini barmogʻi bilan kuzatadi. Audio boʻlmasa, ustoz har rasm voqeasini oddiy inglizcha gaplar va ohang bilan oʻzi aytib beradi.",
              "Tushunishni tekshirish: ustoz rasmlar boʻyicha Yes / No savollar beradi, bolalar bosh harakati bilan javob beradi.",
            ],
          },
          {
            title: "Act out the story (SB 69, 12-mashq)",
            minutes: 18,
            points: [
              "12-mashq: sinf 4 kishilik guruhlarga boʻlinadi, rollar taqsimlanadi (Maskman, Trevor, Monty, Marie).",
              "Har rol uchun 1–2 ta qisqa gapni ustoz doskaga yozib beradi; bolalar kitobdagi hikoya matnini emas, oʻz soʻzlari bilan sodda gapni aytadi.",
              "Guruhlar navbat bilan sahnalashtiradi, sinf qarsak chaladi; eng yaxshi harakat uchun yulduzcha beriladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Unit 9 boʻyicha qisqa savollar: Who can play the guitar in our class? Can you ride a horse?",
              "Uy vazifasi tushuntiriladi, phonics gapi bir marta xor bilan aytiladi.",
            ],
          },
        ],
        uyga: [
          "Koʻk va sariq dumli otni chizing va phonics gapini ota-onangizga aytib bering.",
          "Oila aʼzolaringizdan Can you swim? Can you sing? deb soʻrang va kim nima qila olishini ertaga sinfga aytib bering.",
        ],
        ustozga: "Hikoyada bolalar matnni yodlashga urinmasin — rasm va harakat orqali voqeani tushunish muhim. Qisqa javoblarda bolalar Yes, I can swim deb toʻliq javob beradi — bu xato emas, lekin qisqa Yes, I can shaklini ham koʻp mashq qildiring.",
      },
    ],
  },

  // ───────────────────────────── Unit 10 ─────────────────────────────
  {
    unit: 10,
    title: "Unit 10 · At the funfair",
    description: "Transport vositalari va hozir bajarilayotgan ish: What are you doing? – I am driving / flying / riding.",
    objectives: [
      "Transport vositalarini (bus, lorry, plane, helicopter, boat, motorbike) nomlab ayta oladi.",
      "What are you doing? savoliga I am driving / flying / riding / walking deb javob ayta oladi.",
      "Jamoada ishlash va bir-biriga yordam berish haqida I can help you. iborasini ayta oladi.",
    ],
    vocabulary: [
      "boat",
      "bus",
      "helicopter",
      "lorry",
      "motorbike",
      "plane",
      "car",
      "train",
      "drive",
      "fly",
      "ride",
      "walk",
      "play table-tennis",
      "sail",
    ],
    grammar: "What are you doing? – I am driving / flying / riding / walking. ; Are you flying your helicopter? ; You are driving a lorry. ; I can help you. Work in teams.",
    lessons: [
      {
        focus: "Transport vositalari va chant",
        sb: "70–71",
        maqsad: [
          "Oʻquvchilar 6 ta transport vositasini rasmga qarab ayta oladilar.",
          "Oʻquvchilar chantni harakatlar bilan aytib bera oladilar.",
          "Oʻquvchilar Is the … in / on / under …? savoliga Yes, it is. / No, it is not. deb javob bera oladilar.",
        ],
        lugat: [
          "bus – avtobus",
          "lorry – yuk mashinasi",
          "plane – samolyot",
          "helicopter – vertolyot",
          "boat – qayiq",
          "motorbike – mototsikl",
          "funfair – bayram sayli, attraksionlar bogʻi",
          "in / on / under – ichida / ustida / tagida",
        ],
        resurslar: [
          "SB 70–71",
          "Audio CD4 2, 3, 5, 6 (boʻlmasa ustoz oʻzi oʻqiydi)",
          "Transport flashcardlari (6 ta + car, train)",
          "Oʻyinchoq mashina, qayiq yoki samolyot (boʻlsa) va quti",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: can / cannot takrori",
            minutes: 10,
            points: [
              "Unit 9 qoʻshigʻi harakat bilan kuylanadi.",
              "Ustoz tez savollar beradi: Can you ride a bike? Can you swim? — bolalar qisqa javob beradi.",
            ],
          },
          {
            title: "Yangi soʻzlar: transport (SB 70, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz flashcardni koʻrsatib, har transport uchun ovoz va harakat qiladi (vertolyot parragi, samolyot qanotlari, rul aylantirish).",
              "1-mashq (CD4 2): Listen and point — bolalar karuseldagi transportni koʻrsatadi. Audio boʻlmasa, ustoz soʻzlarni aralash tartibda aytadi.",
              "2-mashq (CD4 3): Listen and repeat — xor bilan, keyin ovozni baland-past qilib takrorlanadi.",
            ],
          },
          {
            title: "Oʻyin: Flashcard Slap",
            minutes: 10,
            points: [
              "Flashcardlar doskaga ilinadi; ikki bola doska oldida turadi, ustoz soʻzni aytganda birinchi urgan bola ochko oladi.",
              "Ikki jamoa navbatma-navbat oʻynaydi.",
            ],
          },
          {
            title: "Chant: Do the actions (SB 71, 3-mashq)",
            minutes: 15,
            points: [
              "3-mashq (CD4 5): Say the chant. Do the actions — rasmlar boʻyicha har transport uchun harakat kelishiladi, chant tinglanadi.",
              "Chant ikki-uch marta harakat bilan aytiladi. Audio boʻlmasa, ustoz rasmlar tartibida transport nomlarini ritm bilan aytadi, bolalar harakat qilib qaytaradi.",
            ],
          },
          {
            title: "Listen and answer: Where is it? (SB 71, 4-mashq)",
            minutes: 15,
            points: [
              "Avval ustoz oʻyinchoqni qutining ichiga, ustiga, tagiga qoʻyib in / on / under ni takrorlaydi.",
              "4-mashq (CD4 6): bolalar rasmdagi xonaga qarab savollarga Yes, it is. / No, it is not. deb javob beradi. Audio boʻlmasa, ustoz rasm boʻyicha savollarni oʻzi beradi.",
              "Juftlikda: bittasi rasm boʻyicha savol beradi, sherigi javob beradi.",
            ],
          },
          {
            title: "Oʻyin: Transport Bingo",
            minutes: 15,
            points: [
              "Bolalar 4 katakli jadval chizib, har katakka bitta transportni kichik rasm bilan chizadi.",
              "Ustoz transport nomini aytadi, bolalar rasmni belgilaydi; 4 tasi belgilangan bola Bingo! deydi va nomlarni qaytarib aytadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz transport ovozini chiqaradi, bolalar nomini topadi.",
              "Uy vazifasi tushuntiriladi, chant yana bir marta aytiladi.",
            ],
          },
        ],
        uyga: [
          "Oʻz xonangizni chizing va 3 ta oʻyinchoq transportni rasmga joylang (on the bed, under the chair); ertaga sinfda koʻrsatib aytib bering.",
          "Kichik kartochkalarga 6 ta transportni chizib, flashcard yasang.",
        ],
        ustozga: "Oʻzbek bolalari lorry va car ni aralashtiradi va lorry dagi r ni qattiq aytadi — rasmdagi katta yuk mashinasiga ishora qilib farqni koʻrsating. helicopter soʻzini boʻgʻinlarga boʻlib qarsak bilan aytdiring.",
      },
      {
        focus: "What are you doing? – I am driving / flying",
        sb: "72–73",
        maqsad: [
          "Oʻquvchilar What are you doing? savolini bera oladilar.",
          "Oʻquvchilar I am driving / flying / riding / walking bilan harakatini ayta oladilar.",
          "Oʻquvchilar What am I doing? oʻyinida You are … bilan taxminini ayta oladilar.",
        ],
        lugat: [
          "drive – haydamoq (mashina, avtobus)",
          "fly – uchmoq, uchirmoq",
          "ride – minmoq (velosiped, mototsikl)",
          "walk – piyoda yurmoq",
          "What are you doing? – Nima qilyapsan?",
          "I am driving. – Men haydayapman.",
          "You are flying. – Sen uchyapsan.",
          "toy – oʻyinchoq",
        ],
        resurslar: [
          "SB 72–73",
          "Audio CD4 7, 8, 10 (boʻlmasa ustoz oʻzi oʻqiydi)",
          "Transport flashcardlari",
          "Harakat kartochkalari: driving, flying, riding, walking",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: transportni takrorlash",
            minutes: 10,
            points: [
              "Transport chanti harakat bilan aytiladi.",
              "Ustoz flashcardni sekin-asta ochadi, bolalar qaysi transport ekanini taxmin qiladi.",
            ],
          },
          {
            title: "Grammar: I am …ing (SB 72, 5–6-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz oʻzi harakat qiladi va aytadi: I am driving. I am flying. — harakat davom etayotganini koʻrsatish uchun toʻxtamasdan harakat qiladi.",
              "5-mashq (CD4 7): Listen and point — Monty savoli va Maskman javobi tinglanadi, bolalar personajlarni koʻrsatadi. Audio boʻlmasa, ustoz ikki ovozda oʻzi aytadi.",
              "6-mashq (CD4 8): Listen and repeat — savol va javob xor bilan, keyin ikki guruhga boʻlinib takrorlanadi.",
            ],
          },
          {
            title: "Zanjir: What are you doing?",
            minutes: 15,
            points: [
              "Bolalar doira boʻlib turadi; birinchi bola harakat qilayotgan sherigidan What are you doing? deb soʻraydi, u I am flying my plane. deb javob beradi va keyingisidan soʻraydi.",
              "Ustoz driving, flying, riding, walking kartochkalarini koʻrsatib, bolalar harakatini almashtirib turadi.",
            ],
          },
          {
            title: "Qoʻshiq: harakatli tanaffus (SB 73, 7-mashq)",
            minutes: 15,
            points: [
              "7-mashq (CD4 10): Sing the song — karusel rasmiga qarab tinglanadi; bolalar karusel kabi doira boʻlib aylanib, har transportga harakat qiladi.",
              "Audio boʻlmasa, ustoz rasmdagi transportlar boʻyicha I am driving / I am flying gaplarini oddiy kuyga solib aytadi, bolalar takrorlaydi.",
            ],
          },
          {
            title: "Oʻyin: What am I doing? (SB 73, 8-mashq)",
            minutes: 15,
            points: [
              "8-mashq: Do the actions. Play the game — ustoz namuna koʻrsatadi: jim turib yuk mashinasi haydaydi va soʻraydi What am I doing?, bolalar You are driving a lorry. deb javob beradi.",
              "Bolalar navbat bilan transport flashcardini yashirin oladi, harakat qiladi va sinfdan soʻraydi.",
              "Jamoalarga boʻlinib ochko hisoblanadi: toʻliq gap bilan topgan jamoa 2 ochko oladi.",
            ],
          },
          {
            title: "Qisqa yozma ish: ustoz bilan birga",
            minutes: 10,
            points: [
              "Doskaga I am driving a … gapi yoziladi; bolalar daftarga koʻchirib, oxiriga oʻzi tanlagan transportni rasm bilan chizadi.",
              "Ustoz aylanib, yozuvni tekshiradi va qoʻllab-quvvatlaydi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz tez savollar beradi: What are you doing? — bolalar harakat bilan javob beradi.",
              "Uy vazifasi tushuntiriladi, qoʻshiq yana bir marta kuylanadi.",
            ],
          },
        ],
        uyga: [
          "Oilangiz bilan What am I doing? oʻyinini oʻynang: siz harakat qiling, ular inglizcha topishga harakat qilsin.",
          "Karuselda oʻzingiz qaysi transportda ketayotganingizni chizing va tagiga I am … gapini yozing.",
        ],
        ustozga: "Bolalar I driving yoki I am drive deb aytadi — am va -ing ikkalasi ham kerakligini harakat bilan eslatib turing (qoʻlni koʻtarib am, aylantirib -ing). ride uchun velosiped va mototsikl, drive uchun mashina va avtobus ekanini rasm bilan farqlang.",
      },
      {
        focus: "Monty phonics (u) va hikoya: Maskman qahramon",
        sb: "74–75",
        maqsad: [
          "Oʻquvchilar qisqa u tovushini (duck, bus, under) toʻgʻri talaffuz qila oladilar.",
          "Oʻquvchilar notoʻgʻri gapni No, you are … bilan toʻgʻrilay oladilar.",
          "Oʻquvchilar hikoyani tinglab, gapga mos rasm raqamini ayta oladilar.",
        ],
        lugat: [
          "duck – oʻrdak",
          "under – tagida",
          "bus – avtobus",
          "car – mashina",
          "help – yordam bermoq",
          "superhero – super qahramon",
          "sea – dengiz",
          "No, you are walking. – Yoʻq, sen piyoda ketyapsan.",
        ],
        resurslar: [
          "SB 74–75",
          "Audio CD4 13, 14, 16, 17 (boʻlmasa ustoz oʻzi oʻqiydi)",
          "Transport va harakat flashcardlari",
          "Oʻyinchoq oʻrdak yoki rasm, stul",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: What am I doing?",
            minutes: 10,
            points: [
              "Karusel qoʻshigʻi harakat bilan kuylanadi.",
              "3–4 bola harakat qilib What am I doing? deb soʻraydi, sinf javob beradi.",
            ],
          },
          {
            title: "Monty phonics: u tovushi (SB 74, 9-mashq)",
            minutes: 12,
            points: [
              "9-mashq (CD4 13): duck, under, bus va rasm ostidagi gap tinglanadi, bolalar rangli u harflarini topadi. Audio boʻlmasa, ustoz oʻzi aniq talaffuz qiladi.",
              "Ustoz oʻrdak rasmini stul tagiga qoʻyib gapni harakat bilan koʻrsatadi; gap tez va sekin, baland va shivirlab aytiladi.",
              "Bolalar shu tovushli boshqa soʻzlarni eslaydi: mum, sun, run, jump.",
            ],
          },
          {
            title: "Listen and correct (SB 74, 10-mashq)",
            minutes: 15,
            points: [
              "10-mashq (CD4 14): bolalar tinglaydi, rasmga qaraydi va notoʻgʻri gapni No, you are … bilan toʻgʻrilaydi. Audio boʻlmasa, ustoz har rasm uchun ataylab notoʻgʻri gap aytadi (I am driving my car.).",
              "Juftlikda: biri rasmni koʻrsatib notoʻgʻri gap aytadi, sherigi toʻgʻrilaydi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Traffic lights",
            minutes: 8,
            points: [
              "Ustoz yashil kartochka koʻrsatsa bolalar joyida yuradi yoki haydaydi, sariqda sekinlashadi, qizilda toʻxtaydi; har safar ustoz I am walking / I am driving deb harakatni almashtiradi.",
            ],
          },
          {
            title: "Hikoya: Listen to the story (SB 75, 11-mashq)",
            minutes: 17,
            points: [
              "Tinglashdan oldin: ustoz rasmlarni koʻrsatib soʻraydi — Where is the boy? What is Maskman doing? — bolalar taxmin qiladi.",
              "11-mashq (CD4 16): hikoya ikki marta tinglanadi, bolalar rasmni barmoq bilan kuzatadi. Audio boʻlmasa, ustoz har rasm voqeasini oddiy gaplar va ovoz effektlari bilan aytib beradi.",
              "Qisqa muhokama (oʻzbekcha): Maskman kimga yordam berdi? Yoʻlda Monty bilan nima boʻldi?",
            ],
          },
          {
            title: "Listen and say the number (SB 75, 12-mashq)",
            minutes: 18,
            points: [
              "12-mashq (CD4 17): bolalar gapni tinglab, mos rasm raqamini aytadi. Audio boʻlmasa, ustoz har rasm boʻyicha oddiy gap aytadi, bolalar raqamni topadi.",
              "Jamoaviy oʻyin: ustoz gap aytadi, jamoadan bitta bola doskadagi 1–6 raqamlaridan kerakligini birinchi urib ochko oladi.",
              "Oxirida bolalar juftlikda 2 ta rasmni tanlab, uni harakat bilan koʻrsatadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Phonics gapi xor bilan aytiladi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Oʻrdaklar va avtobus rasmini chizib, phonics gapini oilangizga aytib bering.",
          "Hikoyaning eng yoqqan rasmini chizing va ertaga u haqida 1 ta inglizcha gap ayting.",
        ],
        ustozga: "Qisqa u tovushini bolalar oʻzbekcha u kabi aytadi (bus ni bus deb) — ogʻizni biroz ochib, qisqa a ga yaqin tovush chiqarishni koʻrsating. Hikoya ikki qismdan iborat: dengizdagi qutqaruv va yoʻldagi voqea — rasmlarni ikkiga ajratib muhokama qilsangiz tushunish osonlashadi.",
      },
      {
        focus: "Marie sports: sport turlari va Trevor values: jamoada ishlash",
        sb: "76–77",
        maqsad: [
          "Oʻquvchilar fotosuratlar boʻyicha They are playing basketball / sailing deb ayta oladilar.",
          "Oʻquvchilar jamoada ishlash va yordam berish muhimligini hayotiy misol bilan tushuntira oladilar.",
          "Oʻquvchilar I can help you. iborasini sahnada toʻgʻri vaziyatda ishlata oladilar.",
        ],
        lugat: [
          "play table-tennis – stol tennisi oʻynamoq",
          "sail – yelkanli qayiqda suzmoq",
          "riding horses – ot minish",
          "riding bikes – velosiped haydash",
          "They are sailing. – Ular yelkanli qayiqda suzishyapti.",
          "team – jamoa",
          "work in teams – jamoada ishlamoq",
          "I can help you. – Men senga yordam bera olaman.",
        ],
        resurslar: [
          "SB 76–77",
          "Audio CD4 18, 19, 20 (boʻlmasa ustoz oʻzi oʻqiydi)",
          "Sport flashcardlari",
          "Kichik suv idishi yoki xarita (sahnalashtirish uchun rekvizit)",
          "Rangli lentalar yoki stikerlar (jamoalarni belgilash uchun)",
        ],
        blocks: [
          {
            title: "Warm-up: Unit 9–10 harakatlari",
            minutes: 10,
            points: [
              "Ustoz Simon says bilan sport va transport harakatlarini aralash beradi: Simon says, play tennis! Simon says, fly your plane!",
              "Bolalar harakat qilib turganida ustoz soʻraydi: What are you doing? — I am swimming.",
            ],
          },
          {
            title: "Marie sports: Listen and say (SB 76, 1-mashq)",
            minutes: 15,
            points: [
              "Ustoz fotosuratlarni koʻrsatib yangi soʻzlarni tanishtiradi: table-tennis, sailing; bolalar harakat bilan takrorlaydi.",
              "1-mashq (CD4 18): bolalar tinglaydi va har fotosurat uchun They are … deb aytadi. Audio boʻlmasa, ustoz raqamni aytadi, bolalar gapni tuzadi.",
              "Qisqa suhbat (oʻzbekcha): Bu sport turlaridan qaysi birini koʻrgansiz yoki oʻynagansiz?",
            ],
          },
          {
            title: "Say and answer: topishmoq (SB 76, 2-mashq)",
            minutes: 12,
            points: [
              "2-mashq: ustoz namuna koʻrsatadi — bitta fotosuratdagi buyumni tasvirlaydi (They have got a big orange ball.), bolalar sportni topadi.",
              "Juftlikda: biri fotosurat haqida They have got … deb topishmoq aytadi, sherigi They are … deb topadi.",
            ],
          },
          {
            title: "Harakatli tanaffus: jamoa estafetasi",
            minutes: 8,
            points: [
              "Sinf ikki jamoaga boʻlinadi; har jamoa qoʻl ushlashib doskaga borib kelishi kerak — hech kim qoʻlni qoʻyib yubormasligi shart.",
              "Oʻyindan keyin ustoz soʻraydi (oʻzbekcha): Nima uchun birga borish kerak boʻldi?",
            ],
          },
          {
            title: "Trevor values: Listen to the story (SB 77, 3-mashq)",
            minutes: 15,
            points: [
              "Tinglashdan oldin ustoz 4 ta rasmni koʻrsatadi va soʻraydi (oʻzbekcha): Bolalar qayerda? Kimga yordam kerak?",
              "3-mashq (CD4 19): hikoya tinglanadi, bolalar rasmni kuzatadi. Audio boʻlmasa, ustoz har rasmni oddiy inglizcha gap va imo-ishora bilan aytib beradi.",
              "Muhokama (oʻzbekcha): Qaysi jamoa birinchi keldi va nima uchun? Siz sinfda yoki uyda kimga qanday yordam bergansiz (sumkasini koʻtarish, darsni tushuntirish, suv berish)?",
            ],
          },
          {
            title: "Listen, say the number, act it out (SB 77, 4-mashq)",
            minutes: 20,
            points: [
              "4-mashq (CD4 20): bolalar gapni tinglab mos rasm raqamini aytadi. Audio boʻlmasa, ustoz har rasm uchun I can help you. yoki Work in teams. gaplari bilan vaziyatni aytadi.",
              "4–5 kishilik guruhlar hikoyani sahnalashtiradi: bitta bola charchagan boʻladi, qolganlari I can help you. deb yordam beradi.",
              "Har guruh sahnasidan keyin sinf qarsak chaladi, ustoz eng yaxshi jamoaviy ish uchun yulduzcha beradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Bolalar doira boʻlib, har biri oʻng tomondagi sherigiga I can help you. deb qoʻl beradi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Bugun uyda kimga yordam berganingizni chizing va tagiga I can help you. deb yozing.",
          "Oilangizga sevimli sport turingizni inglizcha aytib bering va uni harakat bilan koʻrsating.",
        ],
        ustozga: "Values muhokamasini qisqa va aniq misollar bilan oʻtkazing — bolalar oʻz hayotidan misol aytsin, ustoz nasihat qilmasin. They are sailing gapida are ni tushirib qoldirishadi — oldingi darsdagi I am …ing bilan bogʻlab eslating.",
      },
    ],
  },

  // ───────────────────────────── Unit 11 ─────────────────────────────
  {
    unit: 11,
    title: "Unit 11 · Our house",
    description: "Uy xonalari va boshqa odam hozir nima qilayotgani: What is he / she doing? – He is / She is …ing.",
    objectives: [
      "Uydagi xonalarni (bedroom, bathroom, kitchen, living room, dining room, hall) nomlab ayta oladi.",
      "Where is …? savoliga It is in the … deb javob ayta oladi.",
      "What is he / she doing? savoliga He is / She is …ing deb javob ayta oladi.",
    ],
    vocabulary: [
      "bathroom",
      "bedroom",
      "dining room",
      "hall",
      "kitchen",
      "living room",
      "house",
      "reading",
      "eating",
      "watching TV",
      "drawing",
      "listening to music",
    ],
    grammar: "Where is …? – It is in the … ; What is he / she doing? – He is / She is …ing. ; What are they doing? – They are …ing. ; Is he / she …ing? – Yes, he / she is. / No, he / she is not.",
    lessons: [
      {
        focus: "Uy xonalari: Where is the …?",
        sb: "78–79",
        maqsad: [
          "Oʻquvchilar 6 ta xona nomini rasmga qarab ayta oladilar.",
          "Oʻquvchilar Where is the …? savoliga It is in the … deb javob bera oladilar.",
          "Oʻquvchilar notoʻgʻri gapni No, he is not. He is in the … bilan toʻgʻrilay oladilar.",
        ],
        lugat: [
          "house – uy",
          "bedroom – yotoqxona",
          "bathroom – hammom",
          "kitchen – oshxona",
          "living room – mehmonxona (yashash xonasi)",
          "dining room – ovqatlanish xonasi",
          "hall – dahliz",
          "Where is …? – … qayerda?",
        ],
        resurslar: [
          "SB 78–79",
          "Audio CD4 21, 22, 24, 25 (boʻlmasa ustoz oʻzi oʻqiydi)",
          "Xona flashcardlari (6 ta)",
          "Katta qogʻozga chizilgan uy sxemasi va kichik buyum kartochkalari",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: transport va harakatlarni takrorlash",
            minutes: 10,
            points: [
              "Karusel qoʻshigʻi yoki transport chanti harakat bilan aytiladi.",
              "Ustoz What am I doing? deb 3–4 ta harakat qiladi, bolalar You are … deb javob beradi.",
            ],
          },
          {
            title: "Yangi soʻzlar: xonalar (SB 78, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz doskaga oddiy uy chizadi va har xona uchun harakat koʻrsatadi: yotoqxona — uxlash, oshxona — ovqat pishirish, hammom — yuvinish.",
              "1-mashq (CD4 21): Listen and point — bolalar rasmdagi xonani koʻrsatadi. Audio boʻlmasa, ustoz xona nomlarini aralash aytadi.",
              "2-mashq (CD4 22): Listen and repeat — xor bilan, keyin qatorlar boʻyicha takrorlanadi.",
            ],
          },
          {
            title: "TPR oʻyini: Run to the room",
            minutes: 10,
            points: [
              "Sinfning 6 burchagiga xona flashcardlari ilinadi.",
              "Ustoz xona nomini aytadi, bolalar oʻsha burchakka yuguradi va xonaga mos harakat qiladi.",
            ],
          },
          {
            title: "Listen and correct (SB 79, 3-mashq)",
            minutes: 12,
            points: [
              "3-mashq (CD4 24): bolalar tinglaydi va rasm boʻyicha notoʻgʻri gapni No, he is not. He is in the … deb toʻgʻrilaydi. Audio boʻlmasa, ustoz personajlar haqida ataylab notoʻgʻri gap aytadi.",
              "Bir nechta bola ustoz rolida notoʻgʻri gap aytadi, sinf toʻgʻrilaydi.",
            ],
          },
          {
            title: "Listen and answer: Where is the …? (SB 79, 4-mashq)",
            minutes: 15,
            points: [
              "4-mashq (CD4 25): uy rasmiga qarab Where is the …? savollariga It is in the … deb javob beriladi. Audio boʻlmasa, ustoz rasmdagi buyumlar (ball, computer, fish, book) boʻyicha savolni oʻzi beradi.",
              "Juftlikda: bittasi rasmdagi buyum haqida soʻraydi, sherigi javob beradi, keyin almashadi.",
            ],
          },
          {
            title: "Oʻyin: Hide the toy",
            minutes: 18,
            points: [
              "Katta uy sxemasi doskaga ilinadi; bitta bola koʻzini yumadi, ustoz oʻyinchoq kartochkasini biror xonaga yashiradi.",
              "Bola taxmin qiladi: Is it in the kitchen? — sinf Yes, it is. / No, it is not. deb javob beradi.",
              "Toʻgʻri topgan bola keyingi navbatda yashiradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz xona harakatini koʻrsatadi, bolalar xona nomini aytadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Oʻz uyingiz sxemasini chizing va har xonani inglizcha imzolang (ustoz namunasidan koʻchirib).",
          "Oila aʼzolaringizga xona nomlarini inglizcha oʻrgating: har xonaga kirganda nomini ayting.",
        ],
        ustozga: "Bolalar living room va dining room ni aralashtiradi — birinchisi divan va televizor, ikkinchisi stol va stullar bilan bogʻlansin. It is in the … gapida the ni tushirib qoldirishadi, doimo toʻliq namuna bering.",
      },
      {
        focus: "What is he / she doing? – He is drawing",
        sb: "80–81",
        maqsad: [
          "Oʻquvchilar What is he / she doing? savolini bera oladilar.",
          "Oʻquvchilar He is / She is …ing bilan rasmdagi odam harakatini tasvirlay oladilar.",
          "Oʻquvchilar savol-javobda harakat va xonani birga ayta oladilar.",
        ],
        lugat: [
          "What is he doing? – U (oʻgʻil) nima qilyapti?",
          "She is reading a book. – U (qiz) kitob oʻqiyapti.",
          "drawing a picture – rasm chizyapti",
          "listening to music – musiqa tinglayapti",
          "watching TV – televizor koʻryapti",
          "eating – ovqatlanyapti",
          "playing – oʻynayapti",
          "sofa – divan",
        ],
        resurslar: [
          "SB 80–81",
          "Audio CD4 26, 27, 29 (boʻlmasa ustoz oʻzi oʻqiydi)",
          "Xona va harakat flashcardlari",
          "Kitob, qalam, quloqchin kabi rekvizitlar",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: xonalarni takrorlash",
            minutes: 10,
            points: [
              "Run to the room oʻyini tezlashtirilgan holda 2–3 daqiqa oʻynaladi.",
              "Ustoz soʻraydi: Where is your bed? Where is the TV? — bolalar It is in the … deb javob beradi.",
            ],
          },
          {
            title: "Grammar: He is / She is …ing (SB 80, 5–6-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz ikki bolani chaqiradi: biri rasm chizadi, ikkinchisi kitob oʻqiydi; sinfga soʻraydi What is he doing? — He is drawing.",
              "5-mashq (CD4 26): Listen and point — mehmonxonadagi bolalar haqida gaplar tinglanadi, bolalar kim haqida ekanini koʻrsatadi. Audio boʻlmasa, ustoz rasm boʻyicha oʻzi aytadi.",
              "6-mashq (CD4 27): Listen and repeat — savol va javob ikki guruhga boʻlinib takrorlanadi.",
            ],
          },
          {
            title: "Rasm boʻyicha savol-javob (SB 80)",
            minutes: 12,
            points: [
              "Bolalar 5-mashq rasmiga qarab juftlikda har personaj haqida savol beradi: What is she doing? — She is listening to music.",
              "Ustoz jamoalarga savol beradi, toʻgʻri toʻliq javob uchun ochko qoʻyiladi.",
            ],
          },
          {
            title: "Qoʻshiq: harakatli tanaffus (SB 81, 7-mashq)",
            minutes: 15,
            points: [
              "7-mashq (CD4 29): Sing the song — 5 ta rasm boʻyicha tinglanadi, har rasm uchun harakat kelishiladi (baliq yeyish, televizor koʻrish, vannada yuvinish, kitob oʻqish, eshikdan kirish).",
              "Qoʻshiq ikki marta harakat bilan kuylanadi. Audio boʻlmasa, ustoz har rasm uchun He is … / She is … in the … gapini oddiy kuyda aytadi, bolalar qaytaradi.",
            ],
          },
          {
            title: "Ask and answer (SB 81, 8-mashq)",
            minutes: 15,
            points: [
              "8-mashq: ustoz bitta oʻquvchi bilan fotosuratdagi suhbat shaklini namuna qiladi — harakat va xonani soʻrash.",
              "Juftlikda: bolalar 7-mashq rasmlari boʻyicha What is she doing? va Where is she? savollarini beradi.",
              "3 juftlik sinf oldida chiqib suhbatni koʻrsatadi.",
            ],
          },
          {
            title: "Oʻyin: Charades — What is she doing?",
            minutes: 13,
            points: [
              "Bir bola sinf oldida jim harakat qiladi; ustoz sinfga soʻraydi What is he / she doing? — bolalar He is / She is … deb taxmin qiladi.",
              "Toʻgʻri topgan bola keyingi harakatni koʻrsatadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz sinfdagi haqiqiy harakatlar boʻyicha soʻraydi: What is Aziz doing? — He is sitting.",
              "Uy vazifasi tushuntiriladi, qoʻshiq yana bir marta kuylanadi.",
            ],
          },
        ],
        uyga: [
          "Kechqurun oila aʼzolaringiz nima qilayotganini kuzating va 2 ta rasm chizing; ertaga She is … / He is … deb aytib bering.",
          "Qoʻshiqni harakatlari bilan uyda takrorlang.",
        ],
        ustozga: "He va She ni aralashtirish bu yoshda juda koʻp uchraydi — oʻgʻil va qiz rasmlarini alohida rangli belgi bilan koʻrsating. Bolalar -ing ni unutib She is read deydi; ustoz qoʻlini aylantirib -ing ni eslatsin.",
      },
      {
        focus: "Monty phonics (h) va hikoya: Trevor va qalamlar",
        sb: "82–83",
        maqsad: [
          "Oʻquvchilar h tovushini soʻz boshida toʻgʻri talaffuz qila oladilar.",
          "Oʻquvchilar rasm boʻyicha They are …ing gapini tuzib, sherigi topadigan topishmoq ayta oladilar.",
          "Oʻquvchilar hikoyani tinglab, gap toʻgʻri yoki notoʻgʻri ekanini yes / no bilan ayta oladilar.",
        ],
        lugat: [
          "horse – ot",
          "hippo – begemot",
          "helicopter – vertolyot",
          "They are eating fish. – Ular baliq yeyishyapti.",
          "swimming – suzyapti",
          "watching – koʻryapti",
          "pencils – qalamlar",
          "Number four. – Toʻrtinchi raqam.",
        ],
        resurslar: [
          "SB 82–83",
          "Audio CD4 31, 33, 34 (boʻlmasa ustoz oʻzi oʻqiydi)",
          "Harakat flashcardlari",
          "Rangli qalamlar qutisi (hikoya uchun rekvizit)",
          "Yes / No kartochkalari (har bolaga)",
        ],
        blocks: [
          {
            title: "Warm-up: He is / She is …ing",
            minutes: 10,
            points: [
              "Oʻtgan dars qoʻshigʻi harakat bilan kuylanadi.",
              "Charades oʻyini 3–4 bola bilan qisqa takrorlanadi.",
            ],
          },
          {
            title: "Monty phonics: h tovushi (SB 82, 9-mashq)",
            minutes: 12,
            points: [
              "9-mashq (CD4 31): horse, hippo va rasm ostidagi gap tinglanadi, bolalar rangli h harflarini topadi. Audio boʻlmasa, ustoz oʻzi aniq aytadi.",
              "Qoʻlni ogʻiz oldiga tutib h da nafas chiqishini sezish mashqi qilinadi; gap sekin, tez, shivirlab aytiladi.",
              "Bolalar h bilan boshlanadigan boshqa soʻzlarni eslaydi: hall, house, happy, hand.",
            ],
          },
          {
            title: "Say and guess (SB 82, 10-mashq)",
            minutes: 15,
            points: [
              "10-mashq: ustoz qutidagi soʻzlarni oʻqiydi, bolalar takrorlaydi va harakat qiladi.",
              "Ustoz namuna beradi: 8 ta rasmdan biri haqida They are … deydi, bolalar raqamni aytadi.",
              "Juftlikda: navbat bilan gap aytib, sherigi raqamni topadi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Hippo, horse, helicopter",
            minutes: 8,
            points: [
              "Ustoz uch soʻzdan birini aytadi: hippo — bolalar ogʻzini katta ochadi, horse — joyida chopadi, helicopter — qoʻlini aylantiradi; ustoz tezlikni oshirib boradi.",
            ],
          },
          {
            title: "Hikoya: Listen to the story (SB 83, 11-mashq)",
            minutes: 17,
            points: [
              "Tinglashdan oldin ustoz rasmlarni koʻrsatib soʻraydi: Where are the pencils? What is Trevor doing? — bolalar taxmin qiladi.",
              "11-mashq (CD4 33): hikoya ikki marta tinglanadi, bolalar rasmni kuzatadi. Audio boʻlmasa, ustoz har rasm voqeasini oddiy gap va ohang bilan aytib beradi.",
              "Qisqa muhokama (oʻzbekcha): Qalamlar qayerga ketdi? Trevor nima qildi?",
            ],
          },
          {
            title: "Listen and say yes or no (SB 83, 12-mashq)",
            minutes: 18,
            points: [
              "12-mashq (CD4 34): bolalar gaplarni tinglaydi va yes / no kartochkasini koʻtaradi. Audio boʻlmasa, ustoz hikoya haqida toʻgʻri va notoʻgʻri gaplar aytadi.",
              "Bolalar 4 kishilik guruhda hikoyaning 2–3 ta rasmini tanlab qisqa sahnalashtiradi; Marie, Trevor, Stella, Suzy rollari taqsimlanadi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Unit 11 boʻyicha tez savollar: Where is your TV? What is your mum doing now?",
              "Uy vazifasi tushuntiriladi, phonics gapi bir marta aytiladi.",
            ],
          },
        ],
        uyga: [
          "Vertolyotdagi ot va begemotni chizing, phonics gapini oilangizga aytib bering.",
          "Uyingizdagi 3 ta xona va u yerda kim nima qilayotganini chizing; ertaga bitta gap bilan aytib bering.",
        ],
        ustozga: "Oʻzbek bolalari h ni x kabi boʻgʻiq aytadi — nafasni yumshoq chiqarish kerakligini koʻrsating. They are gapini bolalar They is deb aytadi: bitta va koʻp odam rasmlarini yonma-yon qoʻyib farqlang.",
      },
    ],
  },

  // ───────────────────────────── Unit 12 ─────────────────────────────
  {
    unit: 12,
    title: "Unit 12 · Party time!",
    description: "Ovqat va mevalar, yoqtirish va yoqtirmaslik (I like / I do not like / Do you like …?), gigiyena, 9–12-unitlar takrori va yakuniy test.",
    objectives: [
      "Bayram taomlari va mevalarni (apple, banana, cake, ice cream, burger, chocolate) nomlab ayta oladi.",
      "I like … / I do not like … bilan nimani yoqtirishini ayta oladi.",
      "Do you like …? savolini berib, Yes, I do. / No, I do not. deb javob ayta oladi.",
    ],
    vocabulary: [
      "apple",
      "banana",
      "burger",
      "cake",
      "chocolate",
      "ice cream",
      "orange",
      "fish",
      "grapes",
      "lemon",
      "pear",
      "watermelon",
      "wash your hands",
      "clean your teeth",
    ],
    grammar: "I like … ; I do not like … ; Do you like …? – Yes, I do. / No, I do not. ; Keep clean: wash your hands, clean your teeth, wash apples.",
    lessons: [
      {
        focus: "Bayram taomlari va chant",
        sb: "84–85",
        maqsad: [
          "Oʻquvchilar 7 ta taom va meva nomini rasmga qarab ayta oladilar.",
          "Oʻquvchilar chantni ritm bilan aytib bera oladilar.",
          "Oʻquvchilar rasm haqidagi gap toʻgʻri yoki notoʻgʻri ekanini yes / no bilan ayta oladilar.",
        ],
        lugat: [
          "apple – olma",
          "banana – banan",
          "orange – apelsin",
          "cake – tort",
          "ice cream – muzqaymoq",
          "burger – burger",
          "chocolate – shokolad",
          "party – bayram, ziyofat",
        ],
        resurslar: [
          "SB 84–85",
          "Audio CD4 35, 36, 38, 39 (boʻlmasa ustoz oʻzi oʻqiydi)",
          "Taom flashcardlari (7 ta)",
          "Sehrli xalta va haqiqiy meva yoki oʻyinchoq ovqatlar (boʻlsa)",
          "Yes / No kartochkalari",
        ],
        blocks: [
          {
            title: "Warm-up: Unit 11 takrori",
            minutes: 10,
            points: [
              "Uy qoʻshigʻi harakat bilan kuylanadi.",
              "Ustoz soʻraydi: Where is the cooker? What is your sister doing? — bolalar javob beradi.",
            ],
          },
          {
            title: "Yangi soʻzlar: taomlar (SB 84, 1–2-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz sehrli xaltadan meva yoki oʻyinchoq ovqatni birma-bir chiqaradi va nomini aytadi; bolalar yeyish harakati bilan takrorlaydi.",
              "1-mashq (CD4 35): Listen and point — bolalar piknik rasmidagi taomni koʻrsatadi. Audio boʻlmasa, ustoz soʻzlarni aralash aytadi.",
              "2-mashq (CD4 36): Listen and repeat — xor bilan, keyin qiziq ovozlarda (katta, kichik, xursand) takrorlanadi.",
            ],
          },
          {
            title: "Oʻyin: Memory",
            minutes: 12,
            points: [
              "Doskaga flashcardlar teskari ilinadi (har taom ikkitadan: rasm va rasm).",
              "Jamoalar navbat bilan ikkita kartani ochadi va nomini aytadi; juft chiqsa kartalarni oladi.",
            ],
          },
          {
            title: "Chant: harakatli tanaffus (SB 85, 3-mashq)",
            minutes: 13,
            points: [
              "3-mashq (CD4 38): Say the chant — poyezd vagonlaridagi taomlar tartibida tinglanadi; bolalar poyezd boʻlib bir-birining yelkasidan ushlab sinfda yuradi.",
              "Audio boʻlmasa, ustoz vagonlar tartibida taom nomlarini ritm bilan aytadi, poyezd bilan qaytariladi.",
            ],
          },
          {
            title: "Listen and say yes or no (SB 85, 4-mashq)",
            minutes: 15,
            points: [
              "4-mashq (CD4 39): hayvonot bogʻi rasmiga qarab gaplar tinglanadi, bolalar yes / no kartochkasini koʻtaradi. Audio boʻlmasa, ustoz rasm haqida toʻgʻri va notoʻgʻri gaplar aytadi (hayvonlar, taom, harakatlar).",
              "Juftlikda: biri rasm haqida gap aytadi, sherigi yes yoki no deydi.",
              "Bu mashq Unit 7 hayvonlari va Unit 11 harakatlarini ham takrorlaydi — ustoz buni ataylab qoʻshsin.",
            ],
          },
          {
            title: "Oʻyin: Pass the ball — taom nomlari",
            minutes: 15,
            points: [
              "Toʻp qoʻldan qoʻlga oʻtadi; toʻxtaganda toʻp kimda boʻlsa, bitta taom nomini aytadi — takrorlash mumkin emas.",
              "Ikkinchi aylanada bola taom nomi va rangini aytadi: a yellow banana, a red apple.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "What is missing? oʻyini: ustoz bitta flashcardni yashiradi, bolalar topadi.",
              "Uy vazifasi tushuntiriladi, chant yana bir marta aytiladi.",
            ],
          },
        ],
        uyga: [
          "Tugʻilgan kun stolini chizing va 4 ta taomni inglizcha imzolang.",
          "Uyingizdagi mevalarni inglizcha nomlab oilangizga aytib bering.",
        ],
        ustozga: "ice cream va chocolate soʻzlarida bolalar harflar boʻyicha oʻqishga urinadi — faqat eshitish orqali oʻrgating. orange soʻzi Unit 1 da rang sifatida oʻtilgan: meva va rang bir xil soʻz ekanini qiziq fakt sifatida koʻrsating.",
      },
      {
        focus: "I like / I do not like / Do you like …?",
        sb: "86–87",
        maqsad: [
          "Oʻquvchilar I like … / I do not like … bilan yoqtirishini ayta oladilar.",
          "Oʻquvchilar Do you like …? savolini berib, Yes, I do. / No, I do not. deb javob bera oladilar.",
          "Oʻquvchilar sinfdoshlaridan soʻrab, natijani qisqa aytib bera oladilar.",
        ],
        lugat: [
          "like – yoqtirmoq",
          "I like … – Men … ni yoqtiraman.",
          "I do not like … – Men … ni yoqtirmayman.",
          "Do you like …? – Sen … ni yoqtirasanmi?",
          "Yes, I do. – Ha, yoqtiraman.",
          "No, I do not. – Yoʻq, yoqtirmayman.",
          "fish – baliq",
          "chocolate cake – shokoladli tort",
        ],
        resurslar: [
          "SB 86–87",
          "Audio CD4 40, 41, 43 (boʻlmasa ustoz oʻzi oʻqiydi)",
          "Taom flashcardlari",
          "Kulgan va xafa yuz kartochkalari (har bolaga bittadan)",
          "Soʻrovnoma jadvali (ustoz oldindan tayyorlaydi)",
        ],
        blocks: [
          {
            title: "Warm-up: taomlarni takrorlash",
            minutes: 10,
            points: [
              "Poyezd chanti harakat bilan aytiladi.",
              "Ustoz flashcardni tez koʻrsatib yashiradi, bolalar nomini aytadi (Flash the card).",
            ],
          },
          {
            title: "Grammar: I like / I do not like (SB 86, 5–6-mashqlar)",
            minutes: 15,
            points: [
              "Ustoz flashcard bilan koʻrsatadi: I like apples (kulib, qornini silab). I do not like fish (yuzini burishtirib).",
              "5-mashq (CD4 40): Listen and point — oshxonadagi bolalar gaplari tinglanadi, bolalar kim gapirayotganini koʻrsatadi. Audio boʻlmasa, ustoz uch ovozda oʻzi aytadi.",
              "6-mashq (CD4 41): Listen and repeat — gaplar xor bilan va yuz harakatlari bilan takrorlanadi.",
            ],
          },
          {
            title: "Kulgan yuz, xafa yuz",
            minutes: 12,
            points: [
              "Ustoz taom nomini aytadi, bolalar kulgan yoki xafa yuz kartochkasini koʻtarib I like … yoki I do not like … deydi.",
              "Ustoz tanlab soʻraydi: Do you like chocolate? — bola Yes, I do. / No, I do not. deb javob beradi.",
            ],
          },
          {
            title: "Qoʻshiq: harakatli tanaffus (SB 87, 7-mashq)",
            minutes: 15,
            points: [
              "7-mashq (CD4 43): Sing the song — maktab oshxonasi rasmiga qarab tinglanadi; bolalar taomni tanlash va rad etish harakatlarini qiladi.",
              "Qoʻshiq ikki marta harakat bilan kuylanadi. Audio boʻlmasa, ustoz rasmdagi taomlar boʻyicha I like … / I do not like … gaplarini oddiy kuyda aytadi, bolalar qaytaradi.",
            ],
          },
          {
            title: "Ask and answer (SB 87, 8-mashq)",
            minutes: 13,
            points: [
              "8-mashq: ustoz bir oʻquvchi bilan namuna qiladi — Do you like …? savoli va ikki xil qisqa javob.",
              "Juftlikda: bolalar flashcardlar boʻyicha bir-biriga 5 ta savol beradi.",
            ],
          },
          {
            title: "Oʻyin: sinf soʻrovnomasi",
            minutes: 15,
            points: [
              "Har bola jadvalda 3 ta taom va 3 ta sinfdosh ismini oladi; sinf boʻylab yurib Do you like …? deb soʻraydi va javobni belgilaydi.",
              "Oxirida ustoz natijani birga hisoblaydi: How many children like ice cream? — bolalar sanab javob beradi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Har bola bitta gap aytadi: I like … and … .",
              "Uy vazifasi tushuntiriladi, qoʻshiq yana bir marta kuylanadi.",
            ],
          },
        ],
        uyga: [
          "Qogʻozni ikkiga boʻling: bir tomonga yoqtirgan 3 ta taomni, ikkinchi tomonga yoqtirmagan 2 ta taomni chizing; tepasiga ustoz bilan yozgan I like / I do not like ni yozing.",
          "Oila aʼzolaringizdan Do you like …? deb soʻrang va ertaga sinfga aytib bering.",
        ],
        ustozga: "Bolalar I no like yoki I not like deb aytadi — do not ni bitta boʻlak sifatida harakat bilan mashq qildiring. Koʻplikda apples, bananas deyish kerakligini qoida qilib emas, namuna orqali eshittiring.",
      },
      {
        focus: "Monty phonics (i_e) va hikoya: Maskman torti",
        sb: "88–89",
        maqsad: [
          "Oʻquvchilar like, bike, white soʻzlaridagi uzun i tovushini toʻgʻri talaffuz qila oladilar.",
          "Oʻquvchilar rasmli matnni oʻqib-tinglab, gap kim haqida ekanini ayta oladilar.",
          "Oʻquvchilar hikoyani rollarga boʻlib sahnalashtira oladilar.",
        ],
        lugat: [
          "like – yoqtirmoq",
          "bike – velosiped",
          "white – oq",
          "but – lekin",
          "or – yoki",
          "and – va",
          "cake – tort",
          "birthday – tugʻilgan kun",
        ],
        resurslar: [
          "SB 88–89",
          "Audio CD4 46, 47, 49 (boʻlmasa ustoz oʻzi oʻqiydi)",
          "Taom, sport, hayvon va kiyim flashcardlari (10-mashq uchun)",
          "Hikoya uchun rekvizit: qogʻoz tort, niqob, sichqon quloqlari",
          "Doska va marker",
        ],
        blocks: [
          {
            title: "Warm-up: Do you like …?",
            minutes: 10,
            points: [
              "Oshxona qoʻshigʻi harakat bilan kuylanadi.",
              "Zanjir: har bola keyingisidan Do you like …? deb soʻraydi, javob olib, oʻzi ham savol beradi.",
            ],
          },
          {
            title: "Monty phonics: uzun i (SB 88, 9-mashq)",
            minutes: 12,
            points: [
              "9-mashq (CD4 46): like, white, bike va rasm ostidagi gap tinglanadi, bolalar rangli harflarni topadi. Audio boʻlmasa, ustoz oʻzi aniq aytadi.",
              "Ustoz koʻrsatadi: soʻz oxiridagi e oʻqilmaydi, lekin i ni uzun qiladi; bolalar velosiped haydash harakati bilan gapni aytadi.",
              "Bolalar shu tovushli soʻzlarni eslaydi: kite, nine, ride, five.",
            ],
          },
          {
            title: "Read. Listen and say the name (SB 88, 10-mashq)",
            minutes: 18,
            points: [
              "10-mashq: ustoz har qatordagi rasmlarni bolalar bilan birga nomlaydi (sport, hayvon, kiyim, taom) — bu Unit 5, 8, 9 soʻzlarini ham takrorlaydi.",
              "Bolalar ustoz bilan birga qatorlarni oʻqiydi; but soʻzida qoʻlni burab qarama-qarshilik koʻrsatiladi.",
              "CD4 47: bolalar tinglab, gap Sam, Sue, May yoki Ben haqida ekanini aytadi. Audio boʻlmasa, ustoz bittasining qatorini aralash tartibda aytadi, bolalar ismini topadi.",
            ],
          },
          {
            title: "Harakatli tanaffus: Four corners",
            minutes: 8,
            points: [
              "Sinfning 4 burchagiga Sam, Sue, May, Ben ismlari ilinadi; ustoz bitta yoqtirish gapini aytadi, bolalar shu odam burchagiga yuguradi.",
            ],
          },
          {
            title: "Hikoya: Listen to the story (SB 89, 11-mashq)",
            minutes: 15,
            points: [
              "Tinglashdan oldin ustoz rasmlarni koʻrsatib soʻraydi: What is it? Who likes cake? — bolalar taxmin qiladi.",
              "11-mashq (CD4 49): hikoya ikki marta tinglanadi, bolalar rasmni kuzatadi. Audio boʻlmasa, ustoz har rasm voqeasini oddiy gap va ovoz effektlari bilan aytib beradi.",
              "Qisqa muhokama (oʻzbekcha): Tortga nima boʻldi? Personajlar oxirida nima uchun xursand?",
            ],
          },
          {
            title: "Act out the story (SB 89, 12-mashq)",
            minutes: 17,
            points: [
              "12-mashq: 4 kishilik guruhlar tuziladi, rollar taqsimlanadi (Maskman, Trevor, Monty, Marie).",
              "Ustoz har rol uchun 1–2 ta sodda gapni doskaga yozadi (masalan I like cake!); bolalar kitob matnini emas, oʻz soʻzlarini ishlatadi.",
              "Guruhlar navbat bilan sahnalashtiradi, sinf qarsak chaladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Phonics gapi xor bilan va velosiped harakati bilan aytiladi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Oʻzingiz haqida 10-mashqdagi kabi bitta qator tuzing: 2 ta yoqtirgan va 2 ta yoqtirmagan narsani chizing, ustoz namunasi boʻyicha I like … but I do not like … deb yozing.",
          "Oq velosipedli bolani chizib, phonics gapini oilangizga aytib bering.",
        ],
        ustozga: "10-mashqda bolalar rasmlarni koʻplikda aytishga qiynaladi — ustoz avval har rasmni birga nomlab chiqsin. Uzun i ni bolalar qisqa aytadi (lik, bik): soʻzni choʻzib aytish oʻyini bilan mashq qildiring.",
      },
      {
        focus: "Marie art: mevalar rasmlarda va Trevor values: toza boʻl",
        sb: "90–91",
        maqsad: [
          "Oʻquvchilar mashhur rasmlardagi mevalarni (grapes, lemon, pear, watermelon) nomlay oladilar.",
          "Oʻquvchilar shaxsiy gigiyena qoidalarini hayotiy misol bilan tushuntira oladilar.",
          "Oʻquvchilar wash your hands, clean your teeth, wash apples iboralarini harakat bilan ayta oladilar.",
        ],
        lugat: [
          "painting – rasm (moʻyqalam bilan chizilgan)",
          "grapes – uzum",
          "lemon – limon",
          "pear – nok",
          "watermelon – tarvuz",
          "wash your hands – qoʻlingni yuv",
          "clean your teeth – tishingni tozala",
          "wash apples – olmalarni yuv",
          "keep clean – toza yur",
        ],
        resurslar: [
          "SB 90–91",
          "Audio CD4 50, 51, 52 (boʻlmasa ustoz oʻzi oʻqiydi)",
          "Meva flashcardlari (yangi 4 ta + apple, orange, banana)",
          "Tish choʻtkasi, sovun yoki rasmi (rekvizit)",
          "Rangli qalamlar va A4 qogʻoz",
        ],
        blocks: [
          {
            title: "Warm-up: I like / I do not like",
            minutes: 10,
            points: [
              "Taom chanti harakat bilan aytiladi.",
              "Ustoz meva flashcardini koʻrsatadi, 4–5 bola I like … yoki I do not like … deydi.",
            ],
          },
          {
            title: "Marie art: Point and say the food (SB 90, 1-mashq)",
            minutes: 15,
            points: [
              "Ustoz yangi mevalarni flashcard bilan tanishtiradi: grapes, lemon, pear, watermelon; bolalar takrorlaydi.",
              "1-mashq: bolalar 4 ta rasmda mevalarni topib koʻrsatadi va nomini aytadi.",
              "Qisqa suhbat (oʻzbekcha): 4-rasmda nimani koʻryapsiz? Rassom mevalardan nima yasagan?",
            ],
          },
          {
            title: "Listen and say the number (SB 90, 2-mashq)",
            minutes: 12,
            points: [
              "2-mashq (CD4 50): bolalar tinglab, rasm raqamini aytadi. Audio boʻlmasa, ustoz har rasmdagi mevalarni sanab aytadi, bolalar raqamni topadi.",
              "Juftlikda: biri rasmdagi mevalarni aytadi, sherigi raqamni topadi.",
            ],
          },
          {
            title: "Kichik rassomlar: mevali natyurmort",
            minutes: 15,
            points: [
              "Bolalar 3–4 ta mevadan iborat oʻz rasmini chizadi va mevalarni ustoz yordamida imzolaydi.",
              "3–4 bola rasmini koʻrsatib aytadi: I like grapes and pears.",
            ],
          },
          {
            title: "Trevor values: Listen and point (SB 91, 3-mashq)",
            minutes: 13,
            points: [
              "3-mashq (CD4 51): 3 ta rasm boʻyicha tinglanadi, bolalar rasmni koʻrsatadi. Audio boʻlmasa, ustoz har rasm uchun iborani aytadi va harakat qiladi.",
              "Muhokama (oʻzbekcha): Ovqatdan oldin nima uchun qoʻl yuviladi? Mevani yeyishdan oldin nima qilish kerak? Tishni kuniga necha marta tozalaysiz?",
              "Bolalar oʻz hayotidan misol aytadi: maktabdan kelganda, hojatxonadan keyin, ovqatdan oldin.",
            ],
          },
          {
            title: "Chant: Do the actions (SB 91, 4-mashq)",
            minutes: 15,
            points: [
              "4-mashq (CD4 52): Say the chant. Do the actions — bolalar qoʻl yuvish, tish tozalash, olma yuvish harakatlarini qiladi.",
              "Audio boʻlmasa, ustoz uch iborani ritm bilan takrorlab aytadi, bolalar harakat qilib qaytaradi; tezlik oshirib boriladi.",
              "Simon says varianti: Simon says, wash your hands! — bolalar harakat qiladi.",
            ],
          },
          {
            title: "Yakun va uy vazifasi",
            minutes: 10,
            points: [
              "Ustoz harakatni koʻrsatadi, bolalar iborani aytadi.",
              "Uy vazifasi tushuntiriladi; Review darsi uchun Unit 9–12 soʻzlarini takrorlash tavsiya qilinadi.",
            ],
          },
        ],
        uyga: [
          "Keep clean plakatini chizing: qoʻl yuvish, tish tozalash va meva yuvish rasmlari, har biriga inglizcha ibora; plakatni uyda hammom yoniga iling.",
          "Bir hafta davomida har kuni ertalab va kechqurun tish tozalaganingizda iborani inglizcha ayting.",
        ],
        ustozga: "Gigiyena muhokamasini qoʻrqitmasdan, ijobiy odat sifatida oʻtkazing — kim nima qilayotganini maqtang. grapes soʻzini bolalar birlikda grape deb aytadi: uzum boshi koʻp donadan iboratligini rasm bilan koʻrsating.",
      },
      {
        focus: "Review: Unit 9–12 takrori",
        sb: "92–93",
        maqsad: [
          "Oʻquvchilar Unit 9–12 soʻzlarini (sport, transport, xonalar, taomlar) ayta oladilar.",
          "Oʻquvchilar rasmli matnni oʻqib, can, like va …ing tuzilmalarini tushuna oladilar.",
          "Oʻquvchilar stol oʻyinida hayvonlar va odamlar nima qilayotganini ayta oladilar.",
        ],
        lugat: [
          "review – takrorlash",
          "The elephant is drinking water. – Fil suv ichyapti.",
          "The hippo is reading. – Begemot kitob oʻqiyapti.",
          "I can … but I cannot … – … qila olaman, lekin … qila olmayman.",
          "I am eating a banana. – Men banan yeyapman.",
          "start / finish – boshlanish / tugash",
          "dice – oʻyin toshi (kubik)",
        ],
        resurslar: [
          "SB 92–93",
          "Audio CD4 53 (boʻlmasa ustoz oʻzi oʻqiydi)",
          "Unit 9–12 flashcardlari",
          "Oʻyin kubiklari (har guruhga bittadan) va fishkalar (tugma yoki qogʻoz)",
          "Yulduzcha stikerlar",
        ],
        blocks: [
          {
            title: "Warm-up: sevimli qoʻshiq va chantlar",
            minutes: 10,
            points: [
              "Bolalar Unit 9–12 dan sevimli qoʻshiq yoki chantni tanlaydi va harakat bilan kuylaydi.",
              "Ustoz Unit 9–12 flashcardlarini tez koʻrsatadi, sinf nomini aytadi.",
            ],
          },
          {
            title: "Listen and answer: hayvonlar uyi (SB 92, 1-mashq)",
            minutes: 15,
            points: [
              "Ustoz rasmdagi uyni birga koʻrib chiqadi: Where is the lion? What is the hippo doing?",
              "1-mashq (CD4 53): bolalar savollarni tinglaydi va xona hamda harakat bilan javob beradi. Audio boʻlmasa, ustoz 6 ta hayvon boʻyicha Where is …? va What is … doing? savollarini oʻzi beradi.",
              "Juftlikda: bittasi hayvonni tanlaydi, sherigi uni savol berib topadi (Is it in the kitchen? Is it eating?).",
            ],
          },
          {
            title: "Read: Ben haqida (SB 92, 2-mashq)",
            minutes: 15,
            points: [
              "Ustoz bilan birga matn oʻqiladi; rasmlar oʻrniga bolalar soʻzni aytadi.",
              "Ustoz tushunish savollari beradi: How old is Ben? Can he swim? Does he like chocolate? — bolalar qisqa javob beradi.",
              "Bolalar oʻzi haqida shunday 2–3 gap aytadi: I am … . I can … . I like … .",
            ],
          },
          {
            title: "Harakatli tanaffus: Mix and match",
            minutes: 8,
            points: [
              "Ustoz Unit 9–12 dan buyruqlar beradi: Ride a bike! Go to the kitchen! Eat an ice cream! Wash your hands! — bolalar tez harakat qiladi.",
            ],
          },
          {
            title: "Play the game: stol oʻyini (SB 93, 3-mashq)",
            minutes: 20,
            points: [
              "3-mashq: ustoz qoidani koʻrsatadi — kubik tashlanadi, fishka yuriladi, tushgan katakdagi rasm haqida gap aytiladi (masalan fil suv ichayotgani haqida). Narvon tepaga olib chiqadi, banan pastga tushiradi.",
              "3–4 kishilik guruhlar oʻynaydi; yulduzli katakka tushgan bola ustoz bergan savolga javob beradi (Can you …? Do you like …?).",
              "Ustoz guruhlarni aylanib, toʻliq gap aytilishini kuzatadi.",
            ],
          },
          {
            title: "Oʻyin: Team quiz",
            minutes: 12,
            points: [
              "Ikki jamoa: ustoz har unitdan savol beradi — flashcardni nomlash, gapni toʻgʻrilash, harakatni tasvirlash.",
              "Toʻgʻri javob uchun ochko; oxirida hamma jamoa yulduzcha oladi.",
            ],
          },
          {
            title: "Yakun: testga tayyorgarlik",
            minutes: 10,
            points: [
              "Ustoz keyingi dars oʻyinli test boʻlishini tushuntiradi va test topshiriq turlarini (rasmni moslash, yes / no, ustoz bilan suhbat) qisqa koʻrsatadi.",
              "Uy vazifasi tushuntiriladi.",
            ],
          },
        ],
        uyga: [
          "Ben kabi oʻzingiz haqida rasmli matn tayyorlang: yosh, qila oladigan va yoqtiradigan narsalar (soʻz oʻrniga rasm ham boʻladi).",
          "Test uchun flashcardlaringiz bilan Unit 7–12 soʻzlarini oilangiz bilan takrorlang.",
        ],
        ustozga: "Stol oʻyinida bolalar tez yurishga berilib gap aytmay qoʻyadi — gap aytmaguncha fishka yurmasin degan qoidani qatʼiy qoʻying. Review darsida zaif bolalarni kuzating va test oldidan ularga qoʻshimcha yordam rejalashtiring.",
      },
      {
        focus: "End-of-level test (Starter)",
        sb: "—",
        maqsad: [
          "Oʻquvchilar Kid Box 1 soʻz va grammatikasini (asosan Unit 7–12) oʻyinli test formatida koʻrsata oladilar.",
          "Oʻquvchilar qisqa ogʻzaki topshiriqni tinglab, rasmga moslay oladilar.",
          "Oʻquvchilar ustoz bilan yakkama-yakka qisqa suhbatda oʻzi haqida gapira oladilar.",
        ],
        lugat: [
          "test – nazorat ishi",
          "listen – tingla",
          "match – moslamoq",
          "colour – boʻyamoq",
          "circle – aylana ichiga olmoq",
          "tick – belgi qoʻymoq",
          "yes / no – ha / yoʻq",
          "well done – barakalla",
        ],
        resurslar: [
          "Markaz yakuniy testi (Starter, Unit 1–12, asosan 7–12)",
          "Test uchun rasmli varaqlar (ustoz tinglash qismini oʻzi oʻqiydi)",
          "Unit 1–12 flashcardlari (speaking uchun)",
          "Rangli qalamlar va yulduzcha stikerlar",
          "Ota-onalar uchun natija varaqasi",
        ],
        blocks: [
          {
            title: "Warm-up: qoʻshiq va flashcardlar",
            minutes: 10,
            points: [
              "Bolalar sevimli qoʻshigʻini harakat bilan kuylaydi — hayajonni pasaytirish uchun.",
              "Ustoz Unit 1–12 flashcardlarini tez koʻrsatadi; har topshiriq turini bitta namuna bilan tushuntiradi.",
            ],
          },
          {
            title: "Listening: rasmni tingla va mosla",
            minutes: 15,
            points: [
              "Ustoz test varaqasidagi gaplarni ikki marta sekin oʻqiydi; bolalar rasmga chiziq bilan moslaydi yoki toʻgʻri rasmni belgilaydi.",
              "Topshiriqlar: hayvonlar va kiyimlar (Unit 7–8), sport va transport (Unit 9–10), xona va harakat (Unit 11), taomlar (Unit 12).",
            ],
          },
          {
            title: "Listen and colour",
            minutes: 12,
            points: [
              "Ustoz koʻrsatma beradi (masalan olma qizil, avtobus sariq, kitob oshxonada) — bolalar rasmni rang bilan boʻyaydi yoki joylashtiradi.",
              "Bu qismda ranglar, predloglar (in / on / under) va Unit 1–6 soʻzlari ham tekshiriladi.",
            ],
          },
          {
            title: "Reading va grammatika: rasm va gap",
            minutes: 15,
            points: [
              "Bolalar rasm yonidagi qisqa gapni oʻqib yes / no belgilaydi (He can swim. She is reading. I like bananas.).",
              "Toʻgʻri soʻzni tanlash: can / cannot, is / are, like / do not like — rasmga qarab.",
              "Ustoz koʻrsatmani oʻqib beradi, lekin javobni aytmaydi.",
            ],
          },
          {
            title: "Speaking: ustoz bilan yakkama-yakka",
            minutes: 20,
            points: [
              "Ustoz har bolani navbat bilan chaqiradi (2–3 daqiqa) va flashcardlar boʻyicha soʻraydi: What is this? Can you …? Do you like …? What is he doing? Where is the …?",
              "Baholash: soʻzni bilishi, toʻliq javob, talaffuz — oddiy 3 yulduzli shkala.",
              "Qolgan bolalar shu vaqtda Mening sevimli kunim rasmini chizib, 2 ta inglizcha soʻz bilan imzolaydi.",
            ],
          },
          {
            title: "Oʻyin shaklida tahlil",
            minutes: 10,
            points: [
              "Ustoz testdagi eng koʻp xato qilingan 3–4 savolni sinf bilan oʻyin tarzida qayta koʻrib chiqadi (jamoa boʻlib toʻgʻri javobni topish).",
              "Har bola oʻz yulduzchalarini oladi va bitta shaxsiy maqtov eshitadi.",
            ],
          },
          {
            title: "Yakun: ota-onalarga natija",
            minutes: 8,
            points: [
              "Ustoz har bolaga natija varaqasini beradi: kuchli tomoni, yana nimani mashq qilish kerakligi va keyingi levelga tavsiya.",
              "Starter level yakuni tabriklanadi, sinf birga sevimli chantni aytadi.",
            ],
          },
        ],
        uyga: [
          "Natija varaqasini ota-onangizga koʻrsating va ular bilan birga oʻqing.",
          "Kid Box 1 dagi sevimli qoʻshiq yoki chantni oila oldida aytib bering.",
        ],
        ustozga: "Testni bolalarga oʻyin deb tanishtiring va bosim oʻtkazmang — audio yoʻqligi sababli tinglash qismini sekin va bir xil tezlikda ikki marta oʻqing. Natijalarni ota-onalarga yozma varaqa va qisqa suhbat orqali yetkazing: faqat ball emas, bolaning yutuqlari va keyingi qadamlarini ayting.",
      },
    ],
  },
];
