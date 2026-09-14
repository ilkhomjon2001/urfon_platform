// Sillabus (Mavzular bazasi). Muallif: Dr. Nigora Karimova. Level 2 — KANON §6 (12 mavzu, 48 dars, 72 soat).

export type TopicSpec = {
  unit: number;
  title: string;
  description: string;
  objectives: string[];
  vocabulary: string[];
  grammar: string;
  lessons: number;
  status?: "DRAFT";
};

const t = (
  unit: number, title: string, lessons: number, description: string, objectives: string[], vocabulary: string[], grammar: string, status?: "DRAFT",
): TopicSpec => ({ unit, title, lessons, description, objectives, vocabulary, grammar, status });

export const SYLLABUS: Record<string, TopicSpec[]> = {
  L1: [
    t(1, "Hello! Greetings & Introductions", 6, "Salomlashish, oʻzini tanishtirish, alifbo va harflab aytish. Birinchi dars soʻzlashuv iboralari.", ["Oʻzini va doʻstini tanishtira oladi", "Ism va familiyani harflab ayta oladi", "Oddiy savollarga javob beradi"], ["hello", "name", "surname", "nice to meet you", "spell", "country"], "to be (am/is/are)"),
    t(2, "Numbers, Dates & Time", 6, "Sonlar, sana va vaqtni aytish, hafta kunlari va oylar.", ["1–1000 gacha sonlarni tushunadi", "Sana va vaqtni soʻraydi va aytadi"], ["o'clock", "half past", "Monday", "birthday", "calendar", "date"], "Prepositions of time (in/on/at)"),
    t(3, "My Home & Family", 6, "Uy xonalari, oila aʼzolari va egalik shakllari.", ["Oilasini qisqacha tasvirlaydi", "Uy-joyini tasvirlab beradi"], ["kitchen", "bedroom", "brother", "sister", "parents", "cousin"], "Possessive adjectives, have got"),
    t(4, "Daily Life & Present Simple", 6, "Kundalik ishlar, odatlar va ish kuni tartibi.", ["Kun tartibini gapirib beradi", "Present Simple da savol tuzadi"], ["get up", "have breakfast", "go to school", "usually", "never", "weekend"], "Present Simple (+/−/?)"),
    t(5, "Food & Shopping", 6, "Oziq-ovqat, doʻkonda xarid qilish, narx soʻrash.", ["Doʻkonda muloqot qiladi", "Sanaladigan va sanalmaydigan otlarni farqlaydi"], ["bread", "rice", "kilo", "price", "cheap", "bill"], "Countable/uncountable, some/any"),
    t(6, "Places in Town", 6, "Shahar joylari, yoʻl soʻrash va yoʻl koʻrsatish.", ["Yoʻl soʻraydi va tushuntiradi", "Joylashuvni tasvirlaydi"], ["bank", "pharmacy", "turn left", "opposite", "next to", "bus stop"], "There is / there are, prepositions of place"),
    t(7, "My Last Weekend", 6, "Oʻtgan voqealar haqida hikoya qilish.", ["Oʻtgan dam olish kunini gapirib beradi", "Notoʻgʻri fellarning oʻtgan shaklini qoʻllaydi"], ["yesterday", "last week", "visited", "went", "bought", "ago"], "Past Simple (regular/irregular)"),
    t(8, "Review & Level 1 Final Test", 6, "Level 1 boʻyicha umumiy takrorlash va yakuniy test.", ["Level 1 materialini mustahkamlaydi", "Yakuniy testni topshiradi"], ["review", "test", "result", "progress", "certificate", "level"], "Barcha Level 1 grammatikasi"),
  ],
  L2: [
    t(1, "Introduction to IELTS & Everyday Communication", 4, "Kundalik tanishuv, shaxsiy maʼlumotlar, savol-javob strukturasi va fonetik asoslar. Part 1 umumiy savollari bilan ishlash.", ["IELTS formati va band tizimini tushunadi", "Speaking Part 1 savollariga toʻliq javob beradi", "Shaxsiy maʼlumotlarni tinglab yozib oladi"], ["introduce", "hometown", "occupation", "background", "pronunciation", "fluency"], "Question forms, Present Simple"),
    t(2, "Hobbies, Free Time & Present Simple/Continuous", 4, "Qiziqishlar, boʻsh vaqt faoliyatlari, chastota ravishlari va zamonlar qiyosiy tahlili. Mini insho (Paragraph writing).", ["Qiziqishlari haqida ravon gapiradi", "Present Simple va Continuous ni farqlaydi", "Qisqa paragraf yozadi"], ["hobby", "leisure", "keen on", "spare time", "outdoor", "collect"], "Present Simple vs Present Continuous"),
    t(3, "Daily Routines, Habitual Actions & Frequency Adverbs", 4, "Kun tartibi, ish va oʻqish faoliyati, vaqtni boshqarish leksikasi va individual taqdimot matni tayyorlash.", ["Kun tartibini batafsil tasvirlaydi", "Chastota ravishlarini oʻrinli qoʻllaydi", "1 daqiqalik taqdimot qiladi"], ["routine", "commute", "schedule", "deadline", "rarely", "occasionally"], "Adverbs of frequency, time expressions"),
    t(4, "My Family & Relationships", 4, "Oila aʼzolari, qarindoshlik rishtalari, xarakter tasvirlari va 1-2 daqiqalik monolog nutq tayyorlash (IELTS Cue Card uslubi).", ["Oila aʼzolarini xarakteri bilan tasvirlaydi", "Cue Card boʻyicha 1–2 daqiqa gapiradi", "Present Perfect va Past Simple ni qiyoslaydi"], ["immediate family", "extended relatives", "sibling", "supportive", "get along with", "take after"], "Present Perfect vs Past Simple"),
    t(5, "Food, Culture & Ordering in a Restaurant", 4, "Taomlar, madaniy anʼanalar, sanaladigan va sanalmaydigan otlar, dialogik nutq va restoran etikasiga doir iboralar.", ["Restoranda buyurtma beradi", "Milliy taomlar haqida gapiradi", "Quantifiers ni toʻgʻri qoʻllaydi"], ["cuisine", "ingredient", "starter", "main course", "spicy", "tradition"], "Countable/uncountable nouns, quantifiers"),
    t(6, "Midterm Progress Check & Mini Mock Exam", 4, "1–5 unitlar boʻyicha oraliq nazorat sinovi, individual Speaking interview va leksik-grammatik test audit.", ["1–5 unitlar boʻyicha bilimini koʻrsatadi", "Mini Mock imtihonni topshiradi"], ["assessment", "band score", "feedback", "accuracy", "range", "coherence"], "1–5 unitlar grammatikasi"),
    t(7, "Travel, Transport & Places", 4, "Sayohat turlari, transport vositalari, marshrutlar va yoʻl soʻrash qoidalari. IELTS Speaking Part 2 “A memorable trip” mavzusiga tayyorgarlik.", ["Sayohat tajribasini hikoya qiladi", "Transport afzalliklarini taqqoslaydi", "Yoʻnalish soʻraydi va tushuntiradi"], ["journey", "destination", "public transport", "sightseeing", "itinerary", "crowded"], "Past Continuous, comparatives"),
    t(8, "Health, Sport & Healthy Lifestyle", 4, "Sogʻlom turmush tarzi, sport turlari, maslahat berish va majburiyat iboralari. Listening Section 2 amaliyoti.", ["Sogʻliq haqida maslahat beradi", "Sport odatlarini taqqoslaydi"], ["fitness", "balanced diet", "work out", "injury", "stress", "habit"], "Modal verbs: should, must, have to"),
    t(9, "Education, Work & Future Plans", 4, "Taʼlim tizimi, kasblar va kelajak rejalari. Writing Task 2 uchun kirish paragrafi.", ["Kelajak rejalarini aniq ifodalaydi", "Kasb tanlash haqida fikr bildiradi"], ["career", "degree", "apply for", "ambition", "part-time", "qualification"], "Future forms: will, be going to, Present Continuous"),
    t(10, "Technology, Media & Communication", 4, "Texnologiya, ijtimoiy tarmoqlar va ommaviy axborot vositalari. Reading: Matching information.", ["Texnologiyaning taʼsirini muhokama qiladi", "Present Perfect da tajriba haqida gapiradi"], ["device", "online", "social media", "privacy", "download", "influence"], "Present Perfect: for/since, already/yet"),
    t(11, "Environment, Weather & Nature", 4, "Ob-havo, iqlim oʻzgarishi va tabiatni asrash. Writing Task 1 uchun jadval tahlili.", ["Ekologik muammolarni tushuntiradi", "Shart gaplarda yechim taklif qiladi"], ["climate", "pollution", "recycle", "forecast", "drought", "renewable"], "First Conditional, quantifiers"),
    t(12, "Final Review & Level 2 Mock Exam", 4, "Level 2 boʻyicha umumiy takrorlash, toʻliq Mock imtihon va Level 3 ga tayyorgarlik.", ["Level 2 materialini mustahkamlaydi", "Toʻliq Mock imtihonni topshiradi"], ["revision", "mock test", "time management", "strategy", "self-check", "target band"], "Level 2 grammatikasi (umumiy)"),
  ],
  L3: [
    t(1, "IELTS Band 5.5 → 6.0 Strategy", 4, "Band 6.0 ga oʻtish strategiyasi, har bir koʻnikma boʻyicha diagnostika.", ["Kuchli va zaif tomonlarini aniqlaydi", "Shaxsiy oʻquv rejasini tuzadi"], ["target", "diagnostic", "weakness", "strategy", "descriptor", "improve"], "Tense review"),
    t(2, "People & Personality", 3, "Xarakter sifatlari, odamlarni tasvirlash va Speaking Part 2.", ["Insonni batafsil tasvirlaydi"], ["outgoing", "reliable", "ambitious", "stubborn", "generous", "role model"], "Relative clauses"),
    t(3, "Cities & Urbanisation", 4, "Shahar hayoti, urbanizatsiya muammolari va yechimlar.", ["Shahar va qishloq hayotini taqqoslaydi"], ["urban", "infrastructure", "congestion", "suburb", "housing", "amenities"], "Comparatives and superlatives"),
    t(4, "Listening Section 2–3: Maps & Plans", 3, "Xarita va reja topshiriqlari, yoʻnalish leksikasi.", ["Xarita boʻyicha tinglash topshiriqlarini bajaradi"], ["north-east", "entrance", "adjacent", "corridor", "layout", "facility"], "Prepositions of place"),
    t(5, "Reading: Matching Headings", 4, "Paragraf gʻoyasini topish va sarlavhalarni moslashtirish.", ["Asosiy gʻoyani tez topadi"], ["main idea", "skim", "paraphrase", "heading", "detail", "gist"], "Paraphrasing techniques"),
    t(6, "Writing Task 1: Line & Bar Graphs", 3, "Grafiklarni tasvirlash, trend leksikasi va overview yozish.", ["Grafik boʻyicha 150 soʻzlik hisobot yozadi"], ["increase", "fluctuate", "peak", "decline", "steadily", "proportion"], "Past Simple for trends"),
    t(7, "Work & Careers", 4, "Ish dunyosi, kasbiy koʻnikmalar va intervyu.", ["Ish tajribasi haqida gapiradi"], ["employer", "promotion", "skills", "salary", "colleague", "interview"], "Gerunds and infinitives"),
    t(8, "Speaking Part 2: Describing Experiences", 3, "Tajriba va voqealarni hikoya qilish, cue card strategiyasi.", ["2 daqiqa uzluksiz gapiradi"], ["memorable", "unexpected", "at first", "eventually", "moment", "experience"], "Narrative tenses"),
    t(9, "Crime & Society", 4, "Jinoyat, jazo va jamiyat muammolari.", ["Ijtimoiy muammo boʻyicha fikr bildiradi"], ["crime", "punishment", "offender", "prevent", "community", "law"], "Passive voice (intro)"),
    t(10, "Writing Task 2: Advantages & Disadvantages", 3, "Afzallik va kamchilik esselarining tuzilishi.", ["250 soʻzlik esse yozadi"], ["benefit", "drawback", "on the other hand", "furthermore", "in conclusion", "outweigh"], "Linking words"),
    t(11, "Science & Innovation", 4, "Ilm-fan, ixtirolar va kelajak texnologiyalari.", ["Ixtirolar taʼsirini tushuntiradi"], ["invention", "research", "breakthrough", "experiment", "innovative", "discovery"], "Future Perfect / Continuous"),
    t(12, "Reading: Summary Completion", 3, "Summary va jadval toʻldirish topshiriqlari.", ["Summary topshiriqlarida 7/10+ natija"], ["summary", "keyword", "synonym", "scan", "gap", "context"], "Word forms"),
    t(13, "Global Issues & Passive Voice", 3, "Global muammolar va akademik uslubda passiv nisbat.", ["Akademik uslubda yozadi"], ["poverty", "globalisation", "migration", "policy", "impact", "solution"], "Passive voice (all tenses)"),
    t(14, "Midterm Mock & Feedback", 3, "Toʻliq Mock imtihon va individual tahlil.", ["Mock natijasi boʻyicha reja tuzadi"], ["mock", "band", "feedback", "review", "plan", "goal"], "Umumiy takrorlash", "DRAFT"),
  ],
  L4: [
    t(1, "Advanced Mock Orientation & Band Descriptors", 5, "Band deskriptorlari, baholash mezonlari va Mock rejimi.", ["Band deskriptorlarini tushunadi", "Oʻz ishini mezon boʻyicha baholaydi"], ["descriptor", "criteria", "task response", "lexical resource", "coherence", "cohesion"], "Complex sentence review"),
    t(2, "Writing Task 2: Discussion & Opinion", 5, "Discussion va opinion esselari, argument qurish.", ["Ikki nuqtai nazarni muvozanatli yozadi"], ["argue", "perspective", "compelling", "controversial", "stance", "justify"], "Concessive clauses"),
    t(3, "Writing Task 1: Processes & Maps", 5, "Jarayon va xarita diagrammalari.", ["Jarayonni passiv nisbatda tasvirlaydi"], ["stage", "subsequently", "transformed", "relocated", "cycle", "expanded"], "Passive voice, sequencing"),
    t(4, "Reading: Academic Passages at Speed", 5, "Akademik matnlarni vaqt ichida oʻqish strategiyalari.", ["60 daqiqada 3 ta matnni yakunlaydi"], ["hypothesis", "evidence", "claim", "author's view", "inference", "notion"], "Reference words"),
    t(5, "Listening Section 4: Lectures", 5, "Maʼruza tinglash va konspekt yozish.", ["Maʼruzani toʻliq konspekt qiladi"], ["lecture", "notes", "signpost", "furthermore", "consequently", "outline"], "Noun phrases"),
    t(6, "Speaking Part 3: Abstract Topics", 5, "Abstrakt mavzularda fikrni asoslash.", ["Fikrini misollar bilan asoslaydi"], ["arguably", "in the long run", "to some extent", "society", "trend", "generation"], "Speculation language"),
    t(7, "Lexical Resource: Collocations", 5, "Akademik kollokatsiyalar va aniq soʻz tanlash.", ["Mavzuga oid kollokatsiyalarni qoʻllaydi"], ["pose a threat", "draw a conclusion", "reach a consensus", "take into account", "heavily dependent", "widespread"], "Collocation patterns"),
    t(8, "Grammatical Range: Complex Sentences", 5, "Murakkab gaplar, inversiya va shart gaplar.", ["Grammatik xilma-xillikni oshiradi"], ["inversion", "cleft", "participle", "conditional", "relative", "emphasis"], "Mixed conditionals, inversion"),
    t(9, "Full Mock Exam Series I", 4, "Toʻliq Mock imtihonlar seriyasi (1-qism).", ["Imtihon rejimida ishlaydi"], ["timing", "accuracy", "review", "band", "section", "answer sheet"], "Umumiy"),
    t(10, "Full Mock Exam Series II & Final Feedback", 4, "Toʻliq Mock imtihonlar (2-qism) va yakuniy tahlil.", ["Maqsadli bandga tayyor"], ["final", "feedback", "strategy", "confidence", "exam day", "result"], "Umumiy"),
  ],
  L5: [
    t(1, "Band 7+ Diagnostics & Study Strategy", 6, "Band 7.0+ uchun diagnostika va individual strategiya.", ["Band 7+ talablarini biladi", "Shaxsiy strategiya tuzadi"], ["band 7", "precision", "nuance", "consistency", "benchmark", "self-study"], "Advanced tense control"),
    t(2, "Listening Section 3–4: Academic Notes", 6, "Akademik munozara va maʼruzalarni tinglash.", ["Section 4 da 9/10 natija"], ["seminar", "tutor", "assignment", "methodology", "findings", "notes"], "Noun phrases, reduced clauses"),
    t(3, "Reading: True/False/Not Given Mastery", 6, "TFNG va YNNG topshiriqlarini mukammal bajarish.", ["TFNG da xatolarni kamaytiradi"], ["not given", "contradict", "qualify", "claim", "writer's view", "assumption"], "Hedging language"),
    t(4, "Speaking Part 3: Abstract Discussion", 6, "Chuqur muhokama, fikrni rivojlantirish va baholash.", ["Abstrakt savollarga kengaytirilgan javob beradi"], ["implication", "on balance", "debatable", "profound", "shift", "perception"], "Speculating and hypothesising"),
    t(5, "Writing Task 2: Opinion vs Discussion Essays", 6, "Opinion va Discussion esselari tuzilmasi va kogeziya.", ["Task Response 7+ mezoniga javob beradi", "Kogeziya vositalarini aniq qoʻllaydi"], ["cohesion", "thesis", "counter-argument", "rebuttal", "exemplify", "coherent"], "Complex subordination"),
    t(6, "Writing Task 1: Complex Data & Processes", 6, "Aralash grafiklar va murakkab jarayonlar.", ["Aralash maʼlumotni tanlab tasvirlaydi"], ["respectively", "marginally", "overall", "whereas", "account for", "comprise"], "Comparison structures"),
    t(7, "Lexical Resource: C1 Collocations & Idioms", 6, "C1 kollokatsiyalar va idiomalarni tabiiy qoʻllash.", ["Lexical Resource 7+"], ["a double-edged sword", "bear in mind", "far-reaching", "vicious circle", "tip of the iceberg", "by and large"], "Idiomatic structures"),
    t(8, "Full Mock Marathon & Band Descriptors", 6, "Mock marafon va band deskriptorlari boʻyicha yakuniy tahlil.", ["Barqaror 7.0+ natija"], ["marathon", "stamina", "benchmark", "descriptor", "final review", "exam strategy"], "Umumiy"),
  ],
  L6: [
    t(1, "Academic Presentations", 8, "Akademik taqdimot tayyorlash va ommaviy nutq.", ["10 daqiqalik taqdimot qiladi"], ["slide", "audience", "signposting", "Q&A", "visual aid", "conclude"], "Presentation language"),
    t(2, "Critical Reading & Argument Analysis", 8, "Tanqidiy oʻqish va argumentlarni tahlil qilish.", ["Argument zaif joylarini topadi"], ["bias", "fallacy", "premise", "evaluate", "credible", "counterclaim"], "Hedging and boosting"),
    t(3, "Research Writing: Summaries & Citations", 8, "Annotatsiya, iqtibos va plagiatdan saqlanish.", ["Manbani toʻgʻri iqtibos qiladi"], ["citation", "paraphrase", "reference list", "abstract", "plagiarism", "source"], "Reporting verbs"),
    t(4, "Seminar Discussions & Debate", 8, "Seminar muhokamalari va debat qoidalari.", ["Debatda asosli qatnashadi"], ["motion", "rebut", "moderator", "consensus", "concede", "point of order"], "Discourse markers"),
    t(5, "Academic Vocabulary in Use", 8, "Akademik soʻz roʻyxati (AWL) va uslub.", ["AWL soʻzlarini faol qoʻllaydi"], ["analyse", "concept", "significant", "framework", "derive", "interpret"], "Nominalisation", "DRAFT"),
    t(6, "Capstone Project: Mini Research Paper", 8, "Yakuniy loyiha: kichik tadqiqot maqolasi.", ["2000 soʻzlik maqola yozadi"], ["methodology", "findings", "limitation", "discussion", "appendix", "peer review"], "Academic style", "DRAFT"),
  ],
  KIDS: [
    t(1, "Hello, Friends! Colours & Numbers", 6, "Salomlashish, ranglar va 1–20 gacha sonlar. Qoʻshiq va oʻyinlar.", ["Ranglar va sonlarni aytadi", "Doʻstiga salom beradi"], ["red", "blue", "green", "one", "ten", "friend"], "What colour is it?"),
    t(2, "My School Things", 6, "Maktab buyumlari va sinfdagi buyruqlar.", ["Buyumlarni nomlaydi", "Sinf buyruqlarini tushunadi"], ["pencil", "book", "bag", "ruler", "desk", "open your book"], "This is / These are"),
    t(3, "Animals Around Us", 6, "Uy va yovvoyi hayvonlar, ularning ovozlari.", ["Hayvonlarni tasvirlaydi"], ["cat", "dog", "lion", "elephant", "farm", "zoo"], "It has got / It can"),
    t(4, "My Body & Clothes", 6, "Tana aʼzolari va kiyimlar.", ["Kiyimlarini aytadi"], ["head", "hands", "T-shirt", "shoes", "hat", "wear"], "I'm wearing…"),
    t(5, "Food I Like", 6, "Sevimli taomlar, yoqtirish va yoqtirmaslik.", ["Nimani yoqtirishini aytadi"], ["apple", "milk", "pizza", "juice", "like", "don't like"], "I like / I don't like"),
    t(6, "My Family & Home", 6, "Oila aʼzolari va uy xonalari.", ["Oilasini tanishtiradi"], ["mum", "dad", "grandma", "baby", "room", "garden"], "Have got"),
    t(7, "Toys & Games", 6, "Oʻyinchoqlar, oʻyinlar va qobiliyatlar.", ["Nima qila olishini aytadi"], ["ball", "doll", "kite", "jump", "swim", "can"], "Can / can't"),
    t(8, "Seasons, Weather & Holidays", 6, "Fasllar, ob-havo va bayramlar.", ["Ob-havoni tasvirlaydi"], ["sunny", "rainy", "snow", "summer", "winter", "holiday"], "It's sunny / It's cold"),
  ],
};
