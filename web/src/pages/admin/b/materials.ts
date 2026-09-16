// admin-b: resurslar bazasi turlari va yordamchilari (/api/admin/materials).
import type { QueryKey } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FileMeta, ISODate, Paginated, Role } from "@/lib/types";

// ─────────── Query kalitlari ───────────

/** Sahifaning barcha so'rovlari shu prefiks bilan (FRONTEND-KONVENSIYA §7: [rol, resurs, …]). */
export const MAT_KEY = ["admin", "materials"] as const;

/** O'zgartiruvchi amallardan keyin yangilanadi (mavzular bazasidagi material soni ham). */
export const MAT_INV: QueryKey[] = [["admin", "materials"], ["admin", "curriculum"], ["admin", "dashboard"]];

// ─────────── Turlar ───────────

export type MaterialType = "PDF" | "AUDIO" | "VIDEO" | "DOC" | "IMAGE" | "LINK";

export interface LevelRef {
  id: string;
  code: string;
  name: string;
}

export interface GroupRef {
  id: string;
  code: string;
  name: string;
}

export interface TopicRef {
  id: string;
  unit: number;
  title: string;
}

export interface AdminMaterial {
  id: string;
  title: string;
  description: string | null;
  type: MaterialType;
  url: string | null;
  file: FileMeta | null;
  level: LevelRef | null;
  topic: TopicRef | null;
  group: GroupRef | null;
  lesson: { id: string; title: string | null; number: number | null; startsAt: ISODate } | null;
  uploadedBy: { id: string; fullName: string; role: Role };
  downloads: number;
  createdAt: ISODate;
  /** library — umumiy baza (groupId = null), group — guruhga biriktirilgan */
  scope: "library" | "group";
}

export interface AdminMaterialList extends Paginated<AdminMaterial> {
  types: Partial<Record<MaterialType, number>>;
}

export interface AdminMaterialStats {
  total: number;
  library: number;
  inGroups: number;
  groupsWithMaterials: number;
  withoutLevel: number;
  totalDownloads: number;
  totalSize: number;
  byType: { type: MaterialType; count: number; size: number }[];
  byLevel: { level: LevelRef; count: number; size: number }[];
  recent: AdminMaterial[];
}

export interface AdminMaterialOptions {
  levels: LevelRef[];
  topics: (TopicRef & { levelId: string })[];
  groups: (GroupRef & { levelId: string | null })[];
}

// ─────────── Tur yorliqlari ───────────

export const MAT_TYPE: Record<MaterialType, { label: string; icon: string; tile: string; chip: string }> = {
  PDF: { label: "PDF", icon: "picture_as_pdf", tile: "bg-error-container text-error", chip: "bg-error-container text-on-error-container" },
  AUDIO: { label: "Audio", icon: "volume_up", tile: "bg-tertiary-fixed text-tertiary", chip: "bg-tertiary-fixed text-on-tertiary-fixed-variant" },
  VIDEO: { label: "Video", icon: "movie", tile: "bg-primary-fixed text-primary", chip: "bg-primary-fixed text-on-primary-fixed-variant" },
  DOC: { label: "Hujjat", icon: "description", tile: "bg-surface-container-high text-primary", chip: "bg-surface-container text-on-surface-variant" },
  IMAGE: { label: "Rasm", icon: "image", tile: "bg-success-container text-success", chip: "bg-success-container text-on-success-container" },
  LINK: { label: "Havola", icon: "link", tile: "bg-secondary-container text-navy", chip: "bg-secondary-container text-on-secondary-container" },
};

export const TYPE_ORDER: MaterialType[] = ["PDF", "AUDIO", "VIDEO", "DOC", "IMAGE", "LINK"];

export const BAR_CLS: Record<MaterialType, string> = {
  PDF: "bg-primary",
  AUDIO: "bg-gold",
  VIDEO: "bg-navy",
  DOC: "bg-success",
  IMAGE: "bg-warning",
  LINK: "bg-outline",
};

/** Serverdagi typeFromMime bilan bir xil mantiq (api/src/routes/teacher/resources.ts). */
export function materialTypeFromMime(mime: string): MaterialType {
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("audio/")) return "AUDIO";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("image/")) return "IMAGE";
  return "DOC";
}

/** Chip matni: "PDF", "MP3 Audio", "DOCX", "Havola" */
export function extLabel(m: Pick<AdminMaterial, "type" | "file">) {
  if (m.type === "LINK" || !m.file) return MAT_TYPE[m.type].label;
  const ext = m.file.originalName.split(".").pop()?.toUpperCase() ?? "";
  if (m.type === "AUDIO") return `${ext} Audio`;
  if (m.type === "VIDEO") return `${ext} Video`;
  return ext || MAT_TYPE[m.type].label;
}

// ─────────── Fayl yuklash ───────────

/** Brauzerdagi fayl tanlash oynasi uchun ruxsat etilgan turlar (api/src/lib/storage.ts bilan bir xil). */
export const ACCEPT_ALL =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.webp,.gif,.mp3,.m4a,.wav,.ogg,.webm,.mp4,.zip";

export const MAX_UPLOAD_MB = 25;

/** Hajmi katta birinchi fayl (serverga yubormasdan tekshirish). */
export function tooLarge(files: File[]) {
  return files.find((f) => f.size > MAX_UPLOAD_MB * 1024 * 1024) ?? null;
}

/** POST /api/files (multipart) → yuklangan fayllar metamaʼlumoti. Keyin fileId material bilan biriktiriladi. */
export async function uploadFiles(files: File[]): Promise<FileMeta[]> {
  if (!files.length) return [];
  const fd = new FormData();
  for (const f of files) fd.append("files", f, f.name);
  const res = await api.upload<{ files: FileMeta[] }>("/files", fd);
  return res.files;
}

// ─────────── Yuklovchi roli ───────────

export const UPLOADER_ROLE: Record<Role, string> = {
  ADMIN: "Administrator",
  TEACHER: "Ustoz",
  PARENT: "Ota-ona",
  STUDENT: "Oʻquvchi",
};
