// Menyular KANON §2 va design-system/tools/apply_kanon.py (NAV) bilan bir xil: nomlar, tartib, ikonkalar.
import { fmtNum } from "@/lib/format";
import { CABINET_NAME, ROLE_BASE } from "@/lib/roles";
import type { Role } from "@/lib/types";

/** muted — kulrang son (12, 124); primary — koʻk (22, 5); error — qizil ("2 kechikkan", "1 yangi") */
export type NavBadgeTone = "muted" | "primary" | "error";

export interface NavItem {
  /** GET /api/me/nav-badges kaliti ham shu */
  key: string;
  label: string;
  /** Mobil pastki paneldagi qisqa nom */
  short?: string;
  icon: string;
  to: string;
  badgeTone?: NavBadgeTone;
  /** Qo'shimcha yo'l prefikslari (masalan /ustoz/darslar/:id → "Dars jadvali" faol) */
  match?: string[];
  /** Oldidan ajratuvchi chiziq */
  dividerBefore?: boolean;
  /** Menyu bo'limi sarlavhasi (shu punktdan boshlanadi) */
  section?: string;
  /** Punkt ustiga kursor kelganda chiqadigan izoh */
  hint?: string;
}

export interface RoleNav {
  role: Role;
  base: string;
  cabinet: string;
  searchPlaceholder: string;
  items: NavItem[];
  settings: NavItem;
  /** Mobil pastki paneldagi 4 ta punkt (qolgani "Yana" oynasida) */
  mobileTabs: string[];
}

const settings = (role: Role): NavItem => ({
  key: "settings",
  label: "Sozlamalar",
  icon: "settings",
  to: `${ROLE_BASE[role]}/sozlamalar`,
});

export const NAV: Record<Role, RoleNav> = {
  ADMIN: {
    role: "ADMIN",
    base: ROLE_BASE.ADMIN,
    cabinet: CABINET_NAME.ADMIN,
    searchPlaceholder: "Oʻquvchi, ustoz, guruh yoki toʻlov qidirish…",
    items: [
      { key: "home", label: "Bosh sahifa", short: "Bosh", icon: "space_dashboard", to: "/admin", hint: "Markazning bugungi holati: darslar, davomat, toʻlovlar" },
      { key: "groups", section: "Markaz", label: "Guruhlar", icon: "groups", to: "/admin/guruhlar", badgeTone: "muted", hint: "Guruh ochish, ustoz va xona biriktirish, dars jadvali" },
      { key: "teachers", label: "Ustozlar", icon: "person_apron", to: "/admin/ustozlar", badgeTone: "muted", hint: "Ustozlar roʻyxati, yuklama va kabinet kirish maʼlumotlari" },
      { key: "students", label: "Oʻquvchilar", icon: "school", to: "/admin/oquvchilar", badgeTone: "muted", hint: "Oʻquvchini qabul qilish, guruhga qoʻshish, chiqarish" },
      { key: "parents", label: "Ota-onalar", icon: "family_restroom", to: "/admin/ota-onalar", hint: "Ota-ona kabinetlari va Telegram hisobotga ulanish" },
      { key: "curriculum", section: "Oʻquv dasturi", label: "Mavzular bazasi", short: "Mavzular", icon: "menu_book", to: "/admin/mavzular", hint: "Levellar va unitlar: sillabus hamda darsma-dars reja" },
      { key: "materials", label: "Resurslar bazasi", short: "Resurslar", icon: "folder_open", to: "/admin/resurslar", hint: "Darslik PDF, audio va boshqa fayllar — ustozlarga koʻrinadi" },
      { key: "payments", section: "Moliya va nazorat", label: "Toʻlovlar", icon: "payments", to: "/admin/tolovlar", badgeTone: "error", hint: "Oylik hisob-kitob, naqd qabul qilish, qarzdorlar" },
      { key: "reports", label: "Hisobotlar", icon: "analytics", to: "/admin/hisobotlar", hint: "Davomat, oʻzlashtirish va daromad boʻyicha tahlil" },
      { key: "audit", label: "Tizim jurnali", short: "Jurnal", icon: "receipt_long", to: "/admin/jurnal", hint: "Kim, qachon, nimani oʻzgartirgani — toʻliq tarix" },
    ],
    settings: settings("ADMIN"),
    mobileTabs: ["home", "groups", "students", "payments"],
  },
  TEACHER: {
    role: "TEACHER",
    base: ROLE_BASE.TEACHER,
    cabinet: CABINET_NAME.TEACHER,
    searchPlaceholder: "Guruh, oʻquvchi yoki topshiriq qidirish…",
    items: [
      { key: "home", label: "Bosh sahifa", short: "Bosh", icon: "space_dashboard", to: "/ustoz" },
      { key: "groups", label: "Guruhlarim", icon: "groups", to: "/ustoz/guruhlar" },
      { key: "schedule", label: "Dars jadvali", short: "Jadval", icon: "calendar_month", to: "/ustoz/jadval", match: ["/ustoz/darslar"] },
      { key: "homework", label: "Vazifalar", icon: "assignment", to: "/ustoz/vazifalar", badgeTone: "primary" },
      { key: "exams", label: "Mock imtihonlar", short: "Imtihonlar", icon: "quiz", to: "/ustoz/imtihonlar" },
      { key: "resources", label: "Resurslar bazasi", short: "Resurslar", icon: "folder_open", to: "/ustoz/resurslar" },
      { key: "messages", label: "Xabarlar", icon: "forum", to: "/ustoz/xabarlar", badgeTone: "primary" },
    ],
    settings: settings("TEACHER"),
    mobileTabs: ["home", "groups", "schedule", "messages"],
  },
  PARENT: {
    role: "PARENT",
    base: ROLE_BASE.PARENT,
    cabinet: CABINET_NAME.PARENT,
    searchPlaceholder: "Darslar, baholar yoki vazifalarni qidirish…",
    items: [
      { key: "home", label: "Bosh sahifa", short: "Bosh", icon: "home", to: "/ota-ona" },
      { key: "lessons", label: "Davomat va darslar", short: "Darslar", icon: "calendar_month", to: "/ota-ona/darslar" },
      { key: "grades", label: "Baholar va oʻzlashtirish", short: "Baholar", icon: "insights", to: "/ota-ona/baholar" },
      { key: "homework", label: "Uyga vazifalar", short: "Vazifalar", icon: "assignment", to: "/ota-ona/vazifalar", badgeTone: "primary" },
      { key: "payments", label: "Toʻlovlar va kvitansiyalar", short: "Toʻlovlar", icon: "receipt_long", to: "/ota-ona/tolovlar" },
      { key: "contact", label: "Ustoz bilan aloqa", short: "Aloqa", icon: "forum", to: "/ota-ona/aloqa", badgeTone: "primary" },
    ],
    settings: settings("PARENT"),
    mobileTabs: ["home", "lessons", "grades", "homework"],
  },
  STUDENT: {
    role: "STUDENT",
    base: ROLE_BASE.STUDENT,
    cabinet: CABINET_NAME.STUDENT,
    searchPlaceholder: "Darslar, mavzular va lugʻat qidirish…",
    items: [
      { key: "home", label: "Bosh sahifa", short: "Bosh", icon: "space_dashboard", to: "/oquvchi" },
      { key: "lessons", label: "Mening darslarim", short: "Darslar", icon: "menu_book", to: "/oquvchi/darslar" },
      { key: "homework", label: "Uyga vazifalar", short: "Vazifalar", icon: "assignment", to: "/oquvchi/vazifalar", badgeTone: "error" },
      { key: "materials", label: "Oʻquv materiallari", short: "Materiallar", icon: "folder_open", to: "/oquvchi/materiallar" },
      { key: "achievements", label: "Yutuqlar va tangalar", short: "Yutuqlar", icon: "military_tech", to: "/oquvchi/yutuqlar" },
      { key: "chat", label: "Ustoz bilan chat", short: "Chat", icon: "forum", to: "/oquvchi/chat", badgeTone: "primary" },
    ],
    settings: settings("STUDENT"),
    mobileTabs: ["home", "lessons", "homework", "achievements"],
  },
};

/** Eng uzun mos prefiks bo'yicha faol punkt (har doim bittasi). */
export function findActiveKey(nav: RoleNav, pathname: string): string {
  const path = pathname.replace(/\/+$/, "") || "/";
  let best = { key: nav.items[0].key, len: -1 };
  for (const item of [...nav.items, nav.settings]) {
    for (const prefix of [item.to, ...(item.match ?? [])]) {
      if ((path === prefix || path.startsWith(prefix + "/")) && prefix.length > best.len) {
        best = { key: item.key, len: prefix.length };
      }
    }
  }
  return best.key;
}

/** Badge qiymati: 0 / bo'sh bo'lsa null (ko'rsatilmaydi). */
export function badgeText(v: number | string | null | undefined): string | null {
  if (v == null || v === 0 || v === "" || v === "0") return null;
  return typeof v === "number" ? fmtNum(v) : v;
}
