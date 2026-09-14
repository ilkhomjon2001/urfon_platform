import type { QueryKey } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FileMeta } from "@/lib/types";

/** Query kaliti prefiksi (FRONTEND-KONVENSIYA §7: [rol, resurs, …]). */
export const TB = "teacher" as const;

/** O'zgartiruvchi amallardan keyin: ustoz so'rovlari + sidebar badge'lari (Vazifalar 22, Xabarlar 5). */
export const INV: QueryKey[] = [[TB], ["me", "nav-badges"]];

/** POST /api/files (multipart) → yuklangan fayllar metamaʼlumoti. */
export async function uploadFiles(files: File[]): Promise<FileMeta[]> {
  if (!files.length) return [];
  const fd = new FormData();
  for (const f of files) fd.append("files", f, f.name);
  const res = await api.upload<{ files: FileMeta[] }>("/files", fd);
  return res.files;
}

/** Brauzerdagi fayl tanlash oynasi uchun ruxsat etilgan turlar (api/src/lib/storage.ts bilan bir xil). */
export const ACCEPT_ALL =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.webp,.gif,.mp3,.m4a,.wav,.ogg,.webm,.mp4,.zip";

export const MAX_UPLOAD_MB = 25;

/** Fayl hajmini tekshiradi (serverga yubormasdan oldin). */
export function tooLarge(files: File[]) {
  return files.find((f) => f.size > MAX_UPLOAD_MB * 1024 * 1024) ?? null;
}
