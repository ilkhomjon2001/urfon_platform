// QUIZ uyga vazifalari uchun savollar banki (ilova formati: { questions: [{ id, text, options[], answer }] },
// answer — to'g'ri variant indeksi) va o'quvchi javoblari (Submission.answers = { [questionId]: variantIndeksi }).
import type { Skill } from "@prisma/client";
import { Rng } from "../util.js";

type Q = [text: string, options: string[], answer: number];
const TFNG = ["True", "False", "Not Given"];

const BANK: Record<string, Q[]> = {
  "vocab-basic": [
    ["Choose the opposite of “cheap”.", ["expensive", "small", "early", "empty"], 0],
    ["Where do you usually buy medicine?", ["at a bakery", "at a pharmacy", "at a library", "at a stadium"], 1],
    ["Which word is a family member?", ["cousin", "kitchen", "ticket", "pencil"], 0],
    ["The day after Friday is ___.", ["Thursday", "Sunday", "Saturday", "Monday"], 2],
    ["Complete: a ___ of bread.", ["loaf", "glass", "bar", "bottle"], 0],
    ["Which is a room in a house?", ["bedroom", "station", "market", "office"], 0],
    ["Twelve plus eight is ___.", ["eighteen", "twenty", "twenty-two", "thirty"], 1],
    ["You wear ___ on your feet.", ["gloves", "a hat", "shoes", "a scarf"], 2],
    ["Which word describes the weather?", ["sunny", "hungry", "tired", "angry"], 0],
    ["The opposite of “arrive” is ___.", ["leave", "open", "stay", "bring"], 0],
  ],
  "vocab-intro": [
    ["“Where are you from?” asks about your ___.", ["job", "hometown", "age", "hobby"], 1],
    ["Your “occupation” is your ___.", ["job", "family", "address", "nationality"], 0],
    ["Choose the best reply to “Nice to meet you.”", ["Nice to meet you too.", "I'm fine, thanks.", "See you later.", "Yes, please."], 0],
    ["A person from Uzbekistan is ___.", ["Uzbek", "Uzbekish", "Uzbekian", "Uzbekese"], 0],
    ["“Fluency” means speaking ___.", ["very slowly", "smoothly and easily", "only in writing", "with many pauses"], 1],
    ["Which question is about your studies?", ["What do you study?", "Where do you live?", "How old are you?", "What's your name?"], 0],
    ["“Family background” means your family's ___.", ["history and origin", "garden", "photo album", "car"], 0],
    ["The town where you were born and grew up is your ___.", ["hometown", "downtown", "capital", "abroad"], 0],
    ["“Introduce yourself” means ___.", ["say who you are", "leave the room", "write an essay", "ask for help"], 0],
    ["IELTS Speaking Part 1 questions are usually about ___.", ["familiar topics", "science reports", "maps", "graphs"], 0],
  ],
  "grammar-diag": [
    ["She ___ to school every day.", ["go", "goes", "going", "gone"], 1],
    ["___ you like pizza?", ["Do", "Does", "Are", "Is"], 0],
    ["They ___ football yesterday.", ["play", "plays", "played", "playing"], 2],
    ["Where ___ he live?", ["do", "does", "is", "are"], 1],
    ["We ___ TV right now.", ["watch", "are watching", "watches", "watched"], 1],
    ["There ___ two books on the table.", ["is", "are", "am", "be"], 1],
    ["He didn't ___ his homework.", ["do", "did", "does", "done"], 0],
    ["My sister is ___ than me.", ["tall", "taller", "tallest", "more tall"], 1],
    ["I have ___ apple in my bag.", ["a", "an", "the", "some"], 1],
    ["I ___ never been to London.", ["have", "has", "am", "did"], 0],
  ],
  "ps-pc": [
    ["Look! It ___.", ["rains", "is raining", "rain", "rained"], 1],
    ["I usually ___ to music in the evening.", ["listen", "am listening", "listens", "listening"], 0],
    ["What ___ you doing now?", ["do", "are", "does", "is"], 1],
    ["She ___ tennis on Saturdays.", ["plays", "is playing", "play", "playing"], 0],
    ["They ___ on a new project this week.", ["work", "are working", "works", "worked"], 1],
    ["Water ___ at 100 degrees Celsius.", ["boils", "is boiling", "boil", "boiling"], 0],
    ["I ___ my grandmother at the moment.", ["visit", "am visiting", "visits", "visited"], 1],
    ["He never ___ coffee.", ["drinks", "is drinking", "drink", "drinking"], 0],
    ["Which sentence is correct?", ["I am knowing the answer.", "I know the answer.", "I knowing the answer.", "I am know the answer."], 1],
    ["My brother ___ a book right now, so he can't talk.", ["reads", "is reading", "read", "has read"], 1],
  ],
  "listening-personal": [
    ["Transcript: “My name is Sarah Collins — C-O-L-L-I-N-S.” What is her surname?", ["Colins", "Collins", "Collings", "Kollins"], 1],
    ["Transcript: “I live at 24 Park Road.” What is the house number?", ["14", "24", "42", "44"], 1],
    ["Transcript: “My number is 0791 336 204.” The last three digits are ___.", ["204", "240", "336", "791"], 0],
    ["Transcript: “I'm 19 and I study medicine.” What does she study?", ["music", "medicine", "maths", "media"], 1],
    ["Transcript: “I moved here from Manchester two years ago.” Where is he from?", ["London", "Manchester", "Leeds", "Bristol"], 1],
    ["Transcript: “My email is tom dot baker at mail dot com.” Which is correct?", ["tom.baker@mail.com", "tombaker@mail.com", "tom_baker@mail.com", "tom.baker@email.com"], 0],
    ["Transcript: “I was born on the 3rd of March.” When is her birthday?", ["3 May", "13 March", "3 March", "30 March"], 2],
    ["Transcript: “I work part-time as a waiter.” What is his job?", ["cook", "waiter", "driver", "teacher"], 1],
  ],
  "listening-numbers": [
    ["Transcript: “The ticket costs fifteen pounds fifty.” What is the price?", ["£50.15", "£15.50", "£5.50", "£15.15"], 1],
    ["Transcript: “Your room is three-oh-eight.” Which room?", ["38", "308", "380", "3008"], 1],
    ["Transcript: “The course starts on the twenty-first.” Which date?", ["21st", "20th", "12th", "31st"], 0],
    ["Transcript: “There are about thirteen hundred students.” How many?", ["130", "1,300", "13,000", "3,100"], 1],
    ["Transcript: “It's K-A-M-O-L-A.” Which name is spelled?", ["Camola", "Kamola", "Kamala", "Komola"], 1],
    ["Transcript: “The bus leaves at quarter to nine.” What time?", ["8:15", "8:45", "9:15", "9:45"], 1],
    ["Transcript: “The postcode is S-W-one, nine-A-B.” Which postcode?", ["SW19 AB", "SW1 9AB", "SW9 1AB", "SW1 A9B"], 1],
    ["Transcript: “Double seven, five, two.” Which number?", ["7752", "7725", "7572", "2577"], 0],
  ],
  "listening-leisure": [
    ["Transcript: “At weekends I swim, but in winter I prefer chess.” What does he do in winter?", ["swimming", "chess", "running", "cycling"], 1],
    ["Transcript: “The club meets every Tuesday evening.” When does the club meet?", ["Monday", "Tuesday", "Thursday", "Saturday"], 1],
    ["Transcript: “Membership is free for students.” Students pay ___.", ["nothing", "£5", "£10", "half price"], 0],
    ["Transcript: “I started painting when I was twelve.” When did she start?", ["at 10", "at 12", "at 20", "last year"], 1],
    ["Transcript: “The cinema is next to the library.” Where is the cinema?", ["opposite the bank", "next to the library", "behind the park", "near the station"], 1],
    ["Transcript: “Please bring your own racket.” What should they bring?", ["a ball", "a racket", "shoes", "water"], 1],
    ["Transcript: “I relax by reading detective stories.” How does she relax?", ["cooking", "reading", "gaming", "gardening"], 1],
    ["Transcript: “The hiking trip takes about three hours.” How long is the trip?", ["1 hour", "2 hours", "3 hours", "4 hours"], 2],
  ],
  "listening-time": [
    ["Transcript: “Classes begin at 8:30 and finish at 2:15.” When do classes finish?", ["2:15", "2:50", "8:30", "12:15"], 0],
    ["Transcript: “The library is closed on Sundays.” When is it closed?", ["Monday", "Saturday", "Sunday", "Friday"], 2],
    ["Transcript: “The next train is at ten past six.” What time?", ["6:10", "6:50", "10:06", "5:50"], 0],
    ["Transcript: “On weekdays I get up at half past six.” What time?", ["6:00", "6:30", "7:30", "5:30"], 1],
    ["Transcript: “The lunch break lasts forty-five minutes.” How long?", ["15 minutes", "30 minutes", "45 minutes", "60 minutes"], 2],
    ["Transcript: “The gym opens at 7 a.m., two hours before the office.” When does the office open?", ["5 a.m.", "7 a.m.", "9 a.m.", "10 a.m."], 2],
    ["Transcript: “We meet twice a week — on Mondays and Thursdays.” Which days?", ["Mon & Wed", "Tue & Thu", "Mon & Thu", "Wed & Fri"], 2],
    ["Transcript: “The exam is on the 15th, not the 5th.” Which date?", ["5th", "15th", "25th", "50th"], 1],
  ],
  "listening-general": [
    ["Transcript: “Could I book a table for four at 7 p.m.?” How many people?", ["2", "3", "4", "7"], 2],
    ["Transcript: “The museum entrance is on the left side of the building.” Where is the entrance?", ["on the right", "on the left", "at the back", "underground"], 1],
    ["Transcript: “Bring a photo and a copy of your passport.” What is NOT mentioned?", ["a photo", "a passport copy", "a bank card"], 2],
    ["Transcript: “Adults pay £12 and children pay half price.” Children pay ___.", ["£4", "£6", "£12", "£24"], 1],
    ["Transcript: “Parking is available behind the sports centre.” Where can you park?", ["in front", "behind the centre", "next to the café", "on the roof"], 1],
    ["Transcript: “The deadline has moved from Friday to Monday.” What is the new deadline?", ["Friday", "Monday", "Sunday", "Tuesday"], 1],
    ["Transcript: “You can pay by card or in cash, but not by cheque.” How can you pay?", ["card only", "cash only", "card or cash", "cheque"], 2],
    ["Transcript: “We recommend arriving fifteen minutes early.” How early?", ["5 minutes", "10 minutes", "15 minutes", "50 minutes"], 2],
  ],
  "reading-headings": [
    ["Paragraph: “Many teenagers find it hard to wake up early. Scientists say their body clocks naturally shift later.” Best heading?", ["Why teenagers sleep late", "How to cook breakfast", "School sports clubs", "The history of clocks"], 0],
    ["Paragraph: “Tashkent has a modern metro with stations decorated with marble and mosaics.” Best heading?", ["A city's impressive transport", "Cheap hotels", "Weather in Central Asia", "Learning languages"], 0],
    ["Paragraph: “Regular exercise improves mood and helps people concentrate at work.” Best heading?", ["Benefits of exercise", "Dangers of sport", "Office design", "Food prices"], 0],
    ["Paragraph: “Online courses let people study at any time, but they require self-discipline.” Best heading?", ["Pros and cons of online learning", "The first computer", "Classroom rules", "Exam results"], 0],
    ["Paragraph: “Family meals are becoming less common as parents work longer hours.” Best heading?", ["Changing family eating habits", "Popular recipes", "New restaurants", "Toys for children"], 0],
    ["Paragraph: “Plastic waste in the oceans harms fish and birds.” Best heading?", ["Environmental damage at sea", "Holiday destinations", "Fishing as a hobby", "Bird watching"], 0],
    ["Paragraph: “Smartphones help us keep in touch, yet many people feel lonelier.” Best heading?", ["A communication paradox", "Phone prices", "Repairing phones", "Early telephones"], 0],
    ["Paragraph: “Volunteering gives young people useful work experience.” Best heading?", ["Advantages of volunteering", "Summer holidays", "Sports competitions", "Part-time wages"], 0],
  ],
  "reading-tfng": [
    ["Text: “The library opens at 9 a.m. on weekdays and 11 a.m. on Saturdays.” Statement: The library opens later on Saturdays.", TFNG, 0],
    ["Text: “Anna has two brothers and no sisters.” Statement: Anna has a sister.", TFNG, 1],
    ["Text: “The café sells coffee and tea.” Statement: The café is the most popular one in town.", TFNG, 2],
    ["Text: “Most visitors come to the city in summer.” Statement: The city is busier in summer.", TFNG, 0],
    ["Text: “The course lasts six weeks.” Statement: The course is two months long.", TFNG, 1],
    ["Text: “Tom plays the guitar in a band.” Statement: Tom's band has four members.", TFNG, 2],
    ["Text: “Cycling to work is becoming more popular.” Statement: Fewer people cycle to work now.", TFNG, 1],
    ["Text: “Lessons are free for children under seven.” Statement: A five-year-old pays nothing.", TFNG, 0],
    ["Text: “The bridge was designed by a local engineer.” Statement: The engineer won an award for it.", TFNG, 2],
  ],
  "reading-short": [
    ["Text: “Jamshid gets up at 6:30 and cycles to college.” How does Jamshid travel?", ["by bus", "by bike", "on foot", "by car"], 1],
    ["Text: “The market is busiest on Sunday mornings.” When is it busiest?", ["Saturday evening", "Sunday morning", "Monday", "every day"], 1],
    ["Text: “Laylo collects old coins from different countries.” What is her hobby?", ["collecting coins", "painting", "travelling", "cooking"], 0],
    ["Text: “The festival takes place in the park every August.” Where is the festival?", ["in a stadium", "in the park", "at school", "in a museum"], 1],
    ["Text: “Tickets cost $5 for adults and $2 for students.” How much does a student pay?", ["$2", "$3", "$5", "$7"], 0],
    ["Text: “Our English club meets after classes on Wednesdays.” When does it meet?", ["before classes", "on Wednesdays after classes", "at weekends", "on Mondays"], 1],
    ["Text: “He stopped playing football after a knee injury.” Why did he stop?", ["lack of time", "an injury", "bad weather", "a new job"], 1],
    ["Text: “The recipe needs two eggs, flour and a little sugar.” How many eggs?", ["one", "two", "three", "four"], 1],
  ],
  "kids-vocab": [
    ["What colour is the sky on a sunny day?", ["blue", "green", "black", "pink"], 0],
    ["Which animal says “moo”?", ["cat", "cow", "dog", "duck"], 1],
    ["How many legs does a spider have?", ["four", "six", "eight", "ten"], 2],
    ["Which one is a fruit?", ["apple", "pencil", "chair", "bus"], 0],
    ["You write with a ___.", ["ruler", "pencil", "bag", "desk"], 1],
    ["Which animal can fly?", ["fish", "bird", "elephant", "horse"], 1],
    ["It's cold and white. It's ___.", ["snow", "sun", "rain", "grass"], 0],
    ["Which one is a toy?", ["kite", "milk", "window", "shoe"], 0],
    ["Your mum's mum is your ___.", ["sister", "aunt", "grandma", "cousin"], 2],
    ["Six plus four is ___.", ["eight", "nine", "ten", "eleven"], 2],
  ],
  "grammar-basic": [
    ["There ___ a cat under the table.", ["is", "are", "am", "be"], 0],
    ["She ___ got two brothers.", ["has", "have", "is", "does"], 0],
    ["We ___ in Samarkand last summer.", ["are", "were", "was", "be"], 1],
    ["Can you ___ English?", ["speak", "speaks", "speaking", "spoke"], 0],
    ["They ___ to the cinema yesterday.", ["go", "went", "goes", "gone"], 1],
    ["This is ___ book. It belongs to me.", ["my", "me", "mine", "I"], 0],
    ["How ___ apples do you want?", ["much", "many", "any", "some"], 1],
    ["Is there ___ milk in the fridge?", ["a", "any", "many", "an"], 1],
    ["The bank is ___ the pharmacy and the café.", ["between", "under", "on", "into"], 0],
    ["He ___ like fish.", ["don't", "doesn't", "isn't", "not"], 1],
  ],
  "grammar-c1": [
    ["Never ___ such a beautiful sunset.", ["I have seen", "have I seen", "I saw", "did I saw"], 1],
    ["Had I known about the traffic, I ___ earlier.", ["would leave", "would have left", "will leave", "had left"], 1],
    ["It is essential that every student ___ the form by Friday.", ["submits", "submit", "submitted", "will submit"], 1],
    ["Not only ___ late, but he also forgot his notes.", ["he was", "was he", "he is", "did he"], 1],
    ["Seldom ___ such a clear explanation.", ["we hear", "do we hear", "we heard", "hear we"], 1],
    ["If she hadn't moved abroad, she ___ here now.", ["would be working", "would have worked", "will work", "works"], 0],
    ["What I need ___ a quiet place to study.", ["are", "is", "be", "being"], 1],
    ["The report ___ by the committee next week.", ["will review", "will be reviewed", "reviews", "is reviewing"], 1],
    ["Hardly had the lecture begun ___ the fire alarm rang.", ["than", "when", "then", "as"], 1],
    ["I'd rather you ___ this outside the meeting.", ["don't mention", "didn't mention", "not mention", "won't mention"], 1],
  ],
  "vocab-b2": [
    ["The government should ___ measures to reduce pollution.", ["make", "take", "do", "give"], 1],
    ["The researchers ___ a clear conclusion from the data.", ["drew", "made", "took", "got"], 0],
    ["Rising sea levels ___ a serious threat to coastal cities.", ["pose", "put", "make", "do"], 0],
    ["There is ___ evidence that sleep affects memory.", ["heavy", "strong", "big", "tall"], 1],
    ["We must take all factors into ___.", ["account", "mind", "view", "thought"], 0],
    ["The new policy had a ___ impact on small businesses.", ["significant", "strong-minded", "heavyweight", "big-time"], 0],
    ["Experts have ___ concerns about data privacy.", ["raised", "rose", "risen", "arisen"], 0],
    ["The city is heavily ___ on tourism.", ["dependent", "depending", "dependable", "dependence"], 0],
    ["Online learning has become ___ in recent years.", ["widespread", "wide-spreading", "widely", "spreadwide"], 0],
    ["After long talks, the two sides finally ___ a consensus.", ["reached", "arrived", "got to", "achieved at"], 0],
  ],
  "reading-academic": [
    ["Text: “Although renewable energy is costly to install, it reduces long-term expenses.” The writer suggests renewable energy is ___.", ["cheap to install", "expensive at first but saves money later", "always too expensive", "not effective"], 1],
    ["Text: “The findings were largely consistent with earlier research.” The new results ___ previous studies.", ["contradicted", "mostly agreed with", "ignored", "replaced"], 1],
    ["Text: “Critics argue that the survey sample was too small.” The main criticism concerns ___.", ["the method of payment", "the number of participants", "the cost", "the date"], 1],
    ["Text: “Urban green spaces may lower stress, though more data is needed.” The writer's attitude is ___.", ["certain", "cautious", "angry", "uninterested"], 1],
    ["Text: “Consequently, many rural schools closed.” “Consequently” introduces ___.", ["a contrast", "a result", "an example", "a definition"], 1],
    ["Text: “Unlike bees, wasps do not produce honey.” Which is true?", ["Wasps produce honey", "Bees produce honey", "Neither produces honey", "Both produce honey"], 1],
    ["Text: “The population doubled between 1950 and 2000.” In 2000 it was ___ in 1950.", ["half of what it was", "twice as large as", "the same as", "three times smaller than"], 1],
    ["Text: “This theory, however, has been widely challenged.” The theory is ___.", ["universally accepted", "disputed by many", "completely new", "proven"], 1],
  ],
  "listening-academic": [
    ["Lecture: “Today we'll focus on three causes of urban migration.” How many causes?", ["two", "three", "four", "five"], 1],
    ["Lecture: “The first stage involves collecting raw data.” What is the first stage?", ["analysing results", "collecting data", "writing reports", "presenting findings"], 1],
    ["Lecture: “Unlike earlier models, this one accounts for climate variation.” The new model ___.", ["ignores climate", "includes climate variation", "is older", "is cheaper"], 1],
    ["Seminar: “I'm not entirely convinced by that argument.” The speaker is ___.", ["in full agreement", "doubtful", "excited", "bored"], 1],
    ["Lecture: “Roughly 40 percent of participants dropped out.” How many dropped out?", ["about 14%", "about 40%", "exactly 44%", "over 50%"], 1],
    ["Lecture: “To sum up, funding remains the biggest obstacle.” The main problem is ___.", ["staff", "money", "time", "equipment"], 1],
    ["Tutor: “Your literature review should cover at least ten sources.” How many sources?", ["5", "10", "15", "20"], 1],
    ["Lecture: “The experiment was repeated in 2019 with similar results.” When was it repeated?", ["2009", "2019", "2021", "1990"], 1],
  ],
};

const ADVANCED = new Set(["L3", "L4", "L5", "L6"]);

function tagsFor(title: string, skill: Skill, group: string, level: string | null): string[] {
  const t = title.toLowerCase();
  const byTitle: [string, string][] = [
    ["level 1 lugʻat", "vocab-basic"], ["grammar diagnostika", "grammar-diag"], ["personal details", "listening-personal"],
    ["numbers", "listening-numbers"], ["leisure", "listening-leisure"], ["timetable", "listening-time"], ["present simple", "ps-pc"],
    ["matching headings", "reading-headings"], ["true/false", "reading-tfng"], ["short answers", "reading-short"], ["lugʻat kartochka", "vocab-intro"],
  ];
  for (const [k, tag] of byTitle) if (t.includes(k)) return [tag];
  const adv = (level !== null && ADVANCED.has(level)) || group === "GR-09";
  switch (skill) {
    case "VOCABULARY":
      return level === "KIDS" ? ["kids-vocab"] : level === "L1" ? ["vocab-basic"] : adv ? ["vocab-b2"] : ["vocab-intro", "vocab-basic"];
    case "GRAMMAR":
      return group === "GR-09" ? ["grammar-c1"] : level === "L1" || level === "KIDS" ? ["grammar-basic"] : ["grammar-diag", "ps-pc"];
    case "READING":
      return adv ? ["reading-academic"] : ["reading-short", "reading-tfng"];
    case "LISTENING":
      return adv ? ["listening-academic"] : ["listening-general", "listening-time"];
    default:
      return adv ? ["vocab-b2"] : ["grammar-diag"];
  }
}

export type QuizQuestion = { id: string; text: string; options: string[]; answer: number };

/** 8–10 ta savol: vazifa nomi, ko'nikma va Level'ga mos; variantlar deterministik aralashtiriladi (TFNG dan tashqari). */
export function buildQuiz(title: string, skill: Skill, group: string, level: string | null, seed: string): { questions: QuizQuestion[] } {
  const rng = new Rng(`quiz:${seed}`);
  const pool = tagsFor(title, skill, group, level).flatMap((tag) => BANK[tag]);
  const n = Math.min(pool.length, rng.int(8, 10));
  const questions = rng.shuffle(pool).slice(0, n).map(([text, options, answer], i) => {
    if (options === TFNG) return { id: `q${i + 1}`, text, options: [...TFNG], answer };
    const order = rng.shuffle(options.map((_, k) => k));
    return { id: `q${i + 1}`, text, options: order.map((k) => options[k]), answer: order.indexOf(answer) };
  });
  return { questions };
}

/** Ustoz ilovasidagi avtomatik tavsiya bilan bir xil: ≥85% → 5, ≥70% → 4, ≥50% → 3, aks holda 2. */
export const suggestFromPercent = (p: number) => (p >= 85 ? 5 : p >= 70 ? 4 : p >= 50 ? 3 : 2);

/**
 * O'quvchi javoblari { q1: 2, q2: 0, … }. score berilsa, to'g'ri javoblar soni shu bahoga mos tanlanadi
 * (suggestFromPercent(round(k/n·100)) === score); aks holda o'quvchi darajasiga qarab.
 */
export function answersFor(questions: QuizQuestion[], score: number | null, mean: number, rng: Rng) {
  const n = questions.length;
  let k: number;
  if (score !== null) {
    const ks = Array.from({ length: n + 1 }, (_, i) => i).filter((i) => suggestFromPercent(Math.round((i * 100) / n)) === score);
    k = ks[Math.min(ks.length - 1, Math.floor(rng.next() * ks.length * 1.3))];
  } else {
    const p = Math.max(35, Math.min(100, 45 + (mean - 3.2) * 28 + (rng.next() - 0.5) * 20));
    k = Math.round((p * n) / 100);
  }
  const correct = new Set(rng.shuffle(questions.map((q) => q.id)).slice(0, k));
  const answers: Record<string, number> = {};
  for (const q of questions) {
    if (correct.has(q.id)) answers[q.id] = q.answer;
    else {
      const wrong = q.options.map((_, i) => i).filter((i) => i !== q.answer);
      answers[q.id] = rng.pick(wrong);
    }
  }
  return { answers, correct: k };
}
