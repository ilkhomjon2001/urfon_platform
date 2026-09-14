import type { Role } from "./types";

/** Har bir rolning URL bazasi (= bosh sahifa). */
export const ROLE_BASE: Record<Role, string> = {
  ADMIN: "/admin",
  TEACHER: "/ustoz",
  PARENT: "/ota-ona",
  STUDENT: "/oquvchi",
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  TEACHER: "Ustoz",
  PARENT: "Ota-ona",
  STUDENT: "Oʻquvchi",
};

export const CABINET_NAME: Record<Role, string> = {
  ADMIN: "Admin paneli",
  TEACHER: "Ustoz kabineti",
  PARENT: "Ota-ona kabineti",
  STUDENT: "Oʻquvchi kabineti",
};

export const roleHome = (role: Role) => ROLE_BASE[role];
export const settingsPath = (role: Role) => `${ROLE_BASE[role]}/sozlamalar`;

/** Login'dan keyingi `?next=` manzilini tekshiradi: faqat shu rolning ichki yoʻli qabul qilinadi. */
export function safeNext(next: string | null | undefined, role: Role) {
  const base = ROLE_BASE[role];
  if (next && next.startsWith("/") && !next.startsWith("//") && (next === base || next.startsWith(base + "/"))) {
    return next;
  }
  return base;
}
