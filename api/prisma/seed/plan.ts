// Xotiradagi model: guruh sanalari (T ga nisbatan), 124 o'quvchi, ota-onalar, aka-uka/opa-singillar, Telegram.
// DB ga hech narsa yozmaydi — faqat deterministik reja.
import type { StudentStatus } from "@prisma/client";
import { GROUPS, NAMED_STUDENTS, STAFF, type GroupSpec, type StaffSpec } from "./data/canon.js";
import { FEMALE, MALE, SURNAMES, femaleSurname } from "./data/names.js";
import { Rng, cid, lessonDatesFrom, lessonDayBack, nextWeekday, ymdAdd, type Clock } from "./util.js";

export type GroupPlan = GroupSpec & {
  id: string;
  startDate: string;
  endDate: string;
  allDates: string[]; // totalLessons ta dars sanasi
  dates: string[]; // seed yaratadigan darslar (GR-03: hammasi, qolganlari T+21 gacha)
  createdYmd: string;
};

export type Enrollment = { group: string; status: "ACTIVE" | "WAITING" | "LEFT"; joined: string; left?: string };

export type StudentPlan = {
  id: string;
  key: string;
  fullName: string;
  code: string;
  gender: "m" | "f";
  status: StudentStatus;
  enrollments: Enrollment[]; // ACTIVE/WAITING birinchisi — asosiy guruh
  birthYmd: string;
  enrolledYmd: string;
  leftYmd?: string;
  goal: string | null;
  turnstile: boolean;
  named: boolean;
  coins?: number;
  mean: number; // o'rtacha baho darajasi
  attend: number; // davomat ehtimoli
  parentIds: string[];
  siblingDiscount: boolean;
};

export type ParentPlan = {
  id: string;
  key: string;
  fullName: string;
  phone: string;
  relation: "Ota" | "Ona";
  telegram: { username: string; chatId: string } | null;
  children: string[];
};

export type StaffPlan = StaffSpec & { id: string };

export type Model = {
  clock: Clock;
  groups: Map<string, GroupPlan>;
  students: StudentPlan[];
  byKey: Map<string, StudentPlan>;
  parents: ParentPlan[];
  parentByKey: Map<string, ParentPlan>;
  staff: Map<string, StaffPlan>;
  /** GR-03 ning T dan k-chi oldingi dars kuni (L(0) = T) */
  L: (k: number) => string;
  primary: (s: StudentPlan) => string | null;
};

const LATIN = (s: string) => s.toLowerCase().replace(/[ʻʼ']/g, "").replace(/\s+/g, "_");

export function buildModel(clock: Clock): Model {
  const { T } = clock;
  const rng = new Rng("urfon-people");

  // ── Guruhlar ──
  const groups = new Map<string, GroupPlan>();
  for (const g of GROUPS) {
    const startDate = g.doneBeforeT > 0 ? lessonDayBack(g.days, T, g.doneBeforeT) : nextWeekday(T, 1);
    const allDates = lessonDatesFrom(g.days, startDate, g.totalLessons);
    const horizon = ymdAdd(T, 21);
    const dates = g.code === "GR-03" ? allDates : allDates.filter((d) => d <= horizon);
    const createdYmd = g.code === "GR-05" ? ymdAdd(T, -14) : g.code === "GR-04" ? ymdAdd(T, -20) : ymdAdd(startDate, -14);
    groups.set(g.code, { ...g, id: cid(), startDate, endDate: allDates[allDates.length - 1], allDates, dates, createdYmd });
  }
  const G = (c: string) => groups.get(c)!;

  // ── Xodimlar ──
  const staff = new Map<string, StaffPlan>();
  for (const s of STAFF) staff.set(s.key, { ...s, id: cid() });

  // ── O'quvchilar ──
  const usedNames = new Set<string>([...NAMED_STUDENTS.map((s) => s.fullName), ...STAFF.map((s) => s.fullName)]);
  const usedCodes = new Set<string>(NAMED_STUDENTS.map((s) => s.code));
  for (let n = 8505; n <= 8514; n++) usedCodes.add(`ST-${n}`);
  const newCode = () => {
    for (;;) {
      const c = `ST-${rng.int(7000, 9899)}`;
      if (!usedCodes.has(c)) {
        usedCodes.add(c);
        return c;
      }
    }
  };
  const newName = (gender: "m" | "f", surname?: string) => {
    for (;;) {
      const sur = surname ?? rng.pick(SURNAMES);
      const full = gender === "m" ? `${rng.pick(MALE)} ${sur}` : `${rng.pick(FEMALE)} ${femaleSurname(sur)}`;
      if (!usedNames.has(full)) {
        usedNames.add(full);
        return { full, sur };
      }
    }
  };
  const ageRange: Record<string, [number, number]> = {
    "GR-15": [7, 10], "GR-17": [7, 10], "GR-16": [11, 15], "GR-03": [14, 17], "GR-04": [14, 18], "GR-05": [14, 18],
    "GR-11": [15, 19], "GR-12": [16, 21], "GR-18": [17, 23],
  };
  const birthFor = (grp: string | null) => {
    const [a, b] = ageRange[grp ?? ""] ?? [15, 22];
    const age = rng.int(a, b);
    return ymdAdd(`${Number(T.slice(0, 4)) - age}-01-01`, rng.int(0, 364));
  };

  const students: StudentPlan[] = [];
  const surnameOf = new Map<string, string>(); // id → erkak shakli familiya
  const mk = (p: Partial<StudentPlan> & Pick<StudentPlan, "fullName" | "code" | "gender" | "key">): StudentPlan => {
    const s: StudentPlan = {
      id: cid(), status: "ACTIVE", enrollments: [], birthYmd: T, enrolledYmd: T, goal: null, turnstile: true, named: false,
      mean: 4.2, attend: 0.93, parentIds: [], siblingDiscount: false, ...p,
    };
    students.push(s);
    return s;
  };

  // nomli o'quvchilar
  for (const n of NAMED_STUDENTS) {
    const first = n.groups[0] ?? n.leftGroup ?? null;
    const s = mk({
      key: n.key, fullName: n.fullName, code: n.code, gender: n.gender, named: true, coins: n.coins,
      status: n.status ?? "ACTIVE", goal: n.goal ?? null, turnstile: n.turnstile ?? true, birthYmd: birthFor(first),
      mean: n.key === "ali" ? 4.6 : n.coins ? 4.3 + (n.coins - 900) / 1500 : 4.0 + rng.next() * 0.8,
      attend: n.key === "ali" ? 0.93 : 0.9 + rng.next() * 0.08,
    });
    surnameOf.set(s.id, n.fullName.split(" ").slice(-1)[0].replace(/(ov|ev)a$/, "$1"));
  }
  const byKey = new Map(students.map((s) => [s.key, s]));
  const K = (k: string) => byKey.get(k)!;
  // Ali: 15-yanvar (canon) = T dan 130 kun oldin; 15 yosh
  K("ali").enrolledYmd = ymdAdd(T, -130);
  K("ali").birthYmd = `${Number(T.slice(0, 4)) - 15}-03-12`;
  K("fotima").birthYmd = `${Number(T.slice(0, 4)) - 9}-10-02`;

  // generatsiya qilinadigan o'quvchilar (guruh bo'yicha soni)
  const genCount: Record<string, number> = { "GR-03": 7, "GR-04": 8, "GR-05": 10, "GR-18": 14, "GR-11": 15, "GR-12": 9, "GR-15": 9, "GR-17": 11, "GR-16": 14 };
  const gen: Record<string, StudentPlan[]> = {};
  let gr05seq = 8505;
  for (const [code, n] of Object.entries(genCount)) {
    gen[code] = [];
    for (let i = 0; i < n; i++) {
      const gender = rng.chance(0.5) ? "m" : "f";
      const { full, sur } = newName(gender);
      const s = mk({
        key: `${code}-${i}`, fullName: full, code: code === "GR-05" ? `ST-${gr05seq++}` : newCode(), gender, birthYmd: birthFor(code),
        mean: 3.5 + rng.next() * 1.35, attend: 0.86 + rng.next() * 0.12, goal: goalFor(code, rng),
      });
      surnameOf.set(s.id, sur);
      gen[code].push(s);
    }
  }
  // akademik ta'tildagilar (5 ta + Jasur Umidov) va bitirganlar (2)
  const leaveGroups = ["GR-11", "GR-16", "GR-18", "GR-17", "GR-12"];
  const leave: StudentPlan[] = [];
  for (const [i, lg] of leaveGroups.entries()) {
    const gender = rng.chance(0.5) ? "m" : "f";
    const { full, sur } = newName(gender);
    const s = mk({ key: `leave-${i}`, fullName: full, code: newCode(), gender, status: "ACADEMIC_LEAVE", birthYmd: birthFor(lg), mean: 3.6 + rng.next(), attend: 0.8 });
    surnameOf.set(s.id, sur);
    leave.push(s);
  }
  const grads: StudentPlan[] = [];
  for (let i = 0; i < 2; i++) {
    const gender = i === 0 ? "m" : "f";
    const { full, sur } = newName(gender);
    const s = mk({ key: `grad-${i}`, fullName: full, code: newCode(), gender, status: "GRADUATED", birthYmd: birthFor(null), mean: 4.5, attend: 0.95, goal: "IELTS 7.5+", turnstile: false });
    surnameOf.set(s.id, sur);
    grads.push(s);
  }

  // ── Guruh a'zoligi ──
  const enroll = (s: StudentPlan, code: string, status: Enrollment["status"] = "ACTIVE", joined?: string, left?: string) => {
    s.enrollments.push({ group: code, status, joined: joined ?? G(code).startDate, left });
  };
  const roster: Record<string, StudentPlan[]> = {
    "GR-03": [K("ali"), K("bekzod"), K("malikay"), K("doniyor"), K("nilufar"), K("temur"), K("sevara"), ...gen["GR-03"]],
    "GR-04": gen["GR-04"],
    "GR-05": [K("sardor"), K("otabek_n"), K("zarina"), K("asadbek"), ...gen["GR-05"]],
    "GR-18": [K("madina_rh"), K("shahnoza"), ...gen["GR-18"]],
    "GR-11": [K("madina_r"), ...gen["GR-11"]],
    "GR-12": [K("kamila"), K("diyorbek"), K("jasur_t"), ...gen["GR-12"]],
    "GR-15": [K("fotima"), ...gen["GR-15"]],
    "GR-17": gen["GR-17"],
    "GR-16": [K("shaxboz"), ...gen["GR-16"]],
  };
  for (const [code, list] of Object.entries(roster)) {
    for (const s of list) {
      if (code === "GR-05") {
        const joined = s.key === "sardor" ? T : s.key === "asadbek" ? ymdAdd(T, -1) : ymdAdd(T, -rng.int(2, 12));
        s.enrolledYmd = s.key === "sardor" ? ymdAdd(T, -2) : joined;
        enroll(s, code, "WAITING", joined);
        continue;
      }
      enroll(s, code);
      if (s.key !== "ali") {
        const back = s.coins ? rng.int(200, 320) : code === "GR-04" ? rng.int(0, 10) : rng.int(0, 150);
        s.enrolledYmd = ymdAdd(G(code).startDate, -back);
      }
    }
  }
  // Fotima Ali'dan keyin kelgan (ota-ona kabinetida Ali birinchi, standart farzand bo'lsin)
  K("fotima").enrolledYmd = ymdAdd(G("GR-15").startDate, -5) > K("ali").enrolledYmd ? ymdAdd(G("GR-15").startDate, -5) : ymdAdd(K("ali").enrolledYmd, 21);
  // qo'shimcha guruhlar (asosiy paketga kiritilgan)
  const gr18g = gen["GR-18"];
  for (const s of [...roster["GR-12"], K("shahnoza"), ...gr18g.slice(0, 5)]) enroll(s, "GR-09");
  const gr20 = [K("malikay"), K("doniyor"), K("nilufar"), gen["GR-04"][6], gen["GR-04"][7], K("madina_rh"), gr18g[5], gr18g[6], gr18g[7], K("kamila"), gen["GR-12"][5], gen["GR-12"][6]];
  for (const s of gr20) enroll(s, "GR-20", "ACTIVE", ymdAdd(G("GR-20").startDate, rng.int(0, 2) * 7));
  for (const s of [...gen["GR-04"].slice(2, 6), ...gen["GR-11"].slice(10, 15)]) enroll(s, "GR-21");
  enroll(gen["GR-15"][8], "GR-17");
  // akademik ta'til
  const leaveAll: [StudentPlan, string][] = [[K("jasur_u"), "GR-15"], ...leave.map((s, i): [StudentPlan, string] => [s, leaveGroups[i]])];
  for (const [s, code] of leaveAll) {
    const left = s.key === "jasur_u" ? ymdAdd(T, -6) : ymdAdd(T, -rng.int(10, 45));
    s.enrolledYmd = ymdAdd(G(code).startDate, -rng.int(30, 160));
    enroll(s, code, "LEFT", G(code).startDate < left ? G(code).startDate : ymdAdd(left, -30), left);
  }
  for (const s of grads) {
    s.enrolledYmd = ymdAdd(T, -rng.int(380, 520));
    s.leftYmd = ymdAdd(T, -rng.int(30, 90));
  }

  // ── Aka-uka / opa-singillar (birinchisi — kichigi, oilaviy chegirma oladi) ──
  const pairs: [StudentPlan, StudentPlan][] = [
    [gen["GR-15"][0], gen["GR-16"][0]], [gen["GR-17"][0], gen["GR-11"][1]], [gen["GR-17"][1], gen["GR-04"][0]],
    [gen["GR-15"][1], gen["GR-18"][2]], [gen["GR-16"][1], gen["GR-12"][3]], [gen["GR-17"][2], gen["GR-05"][4]],
    [gen["GR-15"][2], gen["GR-03"][0]],
  ];
  for (const [a, b] of pairs) {
    const sur = surnameOf.get(b.id)!;
    const first = a.fullName.split(" ")[0];
    usedNames.delete(a.fullName);
    a.fullName = a.gender === "m" ? `${first} ${sur}` : `${first} ${femaleSurname(sur)}`;
    usedNames.add(a.fullName);
    surnameOf.set(a.id, sur);
    a.siblingDiscount = true;
  }
  K("fotima").siblingDiscount = true;

  // ── Ota-onalar ──
  const parents: ParentPlan[] = [];
  const parentByKey = new Map<string, ParentPlan>();
  const usedPhones = new Set<string>(["+998901234567", "+998977401122", "+998935128899", "+998913334455", "+998909987766", "+998946543210", ...STAFF.map((s) => s.login)]);
  const newPhone = () => {
    for (;;) {
      const p = `+998${rng.pick(["90", "91", "93", "94", "97", "99", "88", "33", "95"])}${String(rng.int(0, 9_999_999)).padStart(7, "0")}`;
      if (!usedPhones.has(p)) {
        usedPhones.add(p);
        return p;
      }
    }
  };
  const addParent = (key: string, fullName: string, relation: "Ota" | "Ona", phone?: string) => {
    const p: ParentPlan = { id: cid(), key, fullName, relation, phone: phone ?? newPhone(), telegram: null, children: [] };
    parents.push(p);
    parentByKey.set(key, p);
    return p;
  };
  const link = (p: ParentPlan, s: StudentPlan) => {
    if (!p.children.includes(s.id)) p.children.push(s.id);
    if (!s.parentIds.includes(p.id)) s.parentIds.push(p.id);
  };
  for (const n of NAMED_STUDENTS) {
    const p = parentByKey.get(n.parent.key) ?? addParent(n.parent.key, n.parent.fullName, n.parent.relation, n.parent.phone);
    link(p, K(n.key));
  }
  const siblingOf = new Map<string, StudentPlan>();
  for (const [a, b] of pairs) siblingOf.set(a.id, b);
  const twoParentFamilies = new Set([gen["GR-11"][3].id, gen["GR-18"][8].id, gen["GR-12"][7].id, gen["GR-03"][3].id]);
  for (const s of students) {
    if (s.parentIds.length || siblingOf.has(s.id)) continue;
    const sur = surnameOf.get(s.id)!;
    const father = rng.chance(0.58);
    const p = father
      ? addParent(`p-${s.key}`, `${rng.pick(MALE)} ${sur}`, "Ota")
      : addParent(`p-${s.key}`, `${rng.pick(FEMALE)} ${femaleSurname(sur)}`, "Ona");
    link(p, s);
    if (twoParentFamilies.has(s.id)) {
      const q = father ? addParent(`p2-${s.key}`, `${rng.pick(FEMALE)} ${femaleSurname(sur)}`, "Ona") : addParent(`p2-${s.key}`, `${rng.pick(MALE)} ${sur}`, "Ota");
      link(q, s);
    }
  }
  for (const [a, b] of pairs) for (const pid of b.parentIds) link(parents.find((p) => p.id === pid)!, a);

  // ── Telegram: 108 o'quvchining ota-onasi ulangan, 16 tasi ulanmagan (bir farzandli, bir ota-onali oilalar) ──
  const unlinkedStudents = new Set<string>([
    K("bekzod").id, K("jasur_u").id,
    gen["GR-05"][0].id, gen["GR-05"][1].id, gen["GR-05"][2].id, gen["GR-05"][3].id,
    gen["GR-17"][5].id, gen["GR-17"][6].id, gen["GR-16"][5].id, gen["GR-16"][6].id,
    gen["GR-11"][5].id, gen["GR-11"][6].id, gen["GR-04"][4].id, gen["GR-18"][10].id, leave[1].id, grads[1].id,
  ]);
  // birinchi yozuv ustun (Fotima yozuvi Rustamning Telegram ma'lumotini bosib ketmasin)
  const explicit = new Map<string, (typeof NAMED_STUDENTS)[number]["parent"]>();
  for (const n of NAMED_STUDENTS) if (!explicit.has(n.parent.key)) explicit.set(n.parent.key, n.parent);
  let chat = 5_210_400;
  for (const p of parents) {
    const off = p.children.some((c) => unlinkedStudents.has(c));
    const ex = explicit.get(p.key);
    if (off || ex?.telegram === false) continue;
    const handle = typeof ex?.telegram === "string" ? ex.telegram : LATIN(p.fullName).replace(/^(\w)\w*_/, "$1_");
    chat += rng.int(1_000, 90_000);
    p.telegram = { username: handle, chatId: ex?.chatId ?? String(chat) };
  }

  const L = (k: number) => (k === 0 ? T : lessonDayBack([1, 3, 5], T, k));
  const primary = (s: StudentPlan) => s.enrollments.find((e) => e.status !== "LEFT")?.group ?? null;
  return { clock, groups, students, byKey: new Map(students.map((s) => [s.key, s])), parents, parentByKey, staff, L, primary };
}

function goalFor(code: string, rng: Rng) {
  if (code === "GR-15" || code === "GR-17") return "Ingliz tilida erkin muloqot";
  if (code === "GR-16") return rng.pick(["Level 2 ga oʻtish", "Grammatikani mustahkamlash"]);
  if (code === "GR-18" || code === "GR-12") return rng.pick(["IELTS 7.0+", "IELTS 7.5+", "IELTS 8.0"]);
  return rng.pick(["IELTS 6.0+", "IELTS 6.5+", "IELTS 7.0+"]);
}
