// O'quvchi kabineti sahifalari uchun umumiy kichik komponentlar va yordamchilar.
import { useEffect, useState, type ReactNode } from "react";
import { Badge, Button, EmptyState, Icon, IconButton, Skeleton } from "@/components/ui";
import { downloadFile, isApiError, openFile, useFileObjectUrl } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtDayMonth, fmtFileSize, fmtNum, fmtTime, relDayWord } from "@/lib/format";
import { toastError } from "@/lib/query";
import type { FileMeta, Tone } from "@/lib/types";
import type { HwState, HwType, MaterialType } from "./types";

// ─────────────────────────── tanga ───────────────────────────

/** Kumush tanga belgisi (Material "toll", KANON §8). */
export function CoinIcon({ size = 18, className }: { size?: number; className?: string }) {
  return <Icon name="toll" filled size={size} className={cn("text-tertiary", className)} />;
}

/** "+10 tanga" chipi. */
export function CoinChip({ amount, sign = true, label = "tanga", className }: { amount: number; sign?: boolean; label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full bg-tertiary-fixed px-2 py-0.5 font-label-sm text-label-sm text-on-tertiary-fixed-variant", className)}>
      <CoinIcon size={14} className="text-on-tertiary-fixed-variant" />
      <span className="tabular-nums">
        {sign && amount > 0 ? "+" : ""}
        {fmtNum(amount)}
      </span>
      {label ? <span>{label}</span> : null}
    </span>
  );
}

export const signed = (n: number) => `${n > 0 ? "+" : ""}${fmtNum(n)}`;

// ─────────────────────────── vaqt ───────────────────────────

/** Har `ms` da yangilanadigan "hozir" (countdown uchun). */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** "Bugun, 20:00 gacha" / "Ertaga, 20:00 gacha" / "18-sentabr, 20:00 gacha" */
export function dueText(dueAt: string) {
  const w = relDayWord(dueAt);
  return `${w ?? fmtDayMonth(dueAt)}, ${fmtTime(dueAt)} gacha`;
}

/** Qolgan vaqt: "6 soat qoldi", "45 daqiqa qoldi", "3 kun qoldi"; o'tgan bo'lsa null. */
export function leftText(dueAt: string, now: number) {
  const ms = new Date(dueAt).getTime() - now;
  if (ms <= 0) return null;
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${Math.max(1, min)} daqiqa qoldi`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} soat qoldi`;
  return `${Math.floor(h / 24)} kun qoldi`;
}

// ─────────────────────────── vazifa ───────────────────────────

export const HW_TYPE_ICON: Record<HwType, string> = { AUDIO: "mic", TEXT: "edit_note", FILE: "upload_file", QUIZ: "quiz" };

const STATE_BADGE: Record<HwState, { tone: Tone; label: string; icon: string }> = {
  NEW: { tone: "neutral", label: "Bajarilmagan", icon: "radio_button_unchecked" },
  DRAFT: { tone: "warning", label: "Qoralama", icon: "edit" },
  SUBMITTED: { tone: "primary", label: "Tekshiruvda", icon: "hourglass_top" },
  REVIEWED: { tone: "success", label: "Tekshirildi", icon: "task_alt" },
  RETURNED: { tone: "danger", label: "Qayta ishlash", icon: "undo" },
};

export function HwStateBadge({ state, overdue, className }: { state: HwState; overdue?: boolean; className?: string }) {
  if (overdue && (state === "NEW" || state === "DRAFT")) {
    return (
      <Badge tone="danger" icon="schedule" className={className}>
        Muddati oʻtgan
      </Badge>
    );
  }
  const b = STATE_BADGE[state];
  return (
    <Badge tone={b.tone} icon={b.icon} className={className}>
      {b.label}
    </Badge>
  );
}

// ─────────────────────────── materiallar ───────────────────────────

export const MATERIAL_META: Record<MaterialType, { icon: string; tile: string; label: string }> = {
  PDF: { icon: "picture_as_pdf", tile: "bg-error-container text-error", label: "PDF" },
  AUDIO: { icon: "headphones", tile: "bg-primary-fixed text-primary", label: "Audio" },
  VIDEO: { icon: "smart_display", tile: "bg-primary-fixed text-primary", label: "Video" },
  DOC: { icon: "description", tile: "bg-surface-container-high text-primary", label: "Hujjat" },
  IMAGE: { icon: "image", tile: "bg-success-container text-on-success-container", label: "Rasm" },
  LINK: { icon: "link", tile: "bg-tertiary-fixed text-on-tertiary-fixed-variant", label: "Havola" },
};

export function fileKind(f: Pick<FileMeta, "mime" | "originalName">): "audio" | "image" | "pdf" | "video" | "file" {
  if (f.mime.startsWith("audio/")) return "audio";
  if (f.mime.startsWith("image/")) return "image";
  if (f.mime.startsWith("video/")) return "video";
  if (f.mime === "application/pdf" || f.originalName.toLowerCase().endsWith(".pdf")) return "pdf";
  return "file";
}

export const FILE_KIND_ICON = { audio: "graphic_eq", image: "image", pdf: "picture_as_pdf", video: "smart_display", file: "description" } as const;

/** Auth bilan himoyalangan audio pleyer (blob object URL). */
export function AuthAudio({ fileId, className }: { fileId: string; className?: string }) {
  const { url, loading, error } = useFileObjectUrl(fileId);
  if (error) return <p className="text-body-sm text-error">Audio yuklanmadi</p>;
  if (loading || !url) return <Skeleton className={cn("h-9 w-full rounded-full", className)} />;
  return <audio controls preload="metadata" src={url} className={cn("h-9 w-full", className)} />;
}

/** Auth bilan himoyalangan rasm (kichik ko'rinish). */
export function AuthImage({ fileId, alt, className }: { fileId: string; alt: string; className?: string }) {
  const { url, error } = useFileObjectUrl(fileId);
  if (error) {
    return (
      <span title="Rasm yuklanmadi" className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container text-on-surface-muted", className)}>
        <Icon name="broken_image" size={22} />
      </span>
    );
  }
  if (!url) return <Skeleton className={cn("h-12 w-12 rounded-lg", className)} />;
  return <img src={url} alt={alt} className={cn("h-12 w-12 rounded-lg object-cover", className)} />;
}

type Openable = { type: MaterialType; url: string | null; file: FileMeta | null; title: string };

/**
 * Material amali: PDF/video — ochish, audio — tinglash (joyida pleyer), hujjat/rasm — yuklab olish, havola — yangi tab.
 * `onToggleAudio` berilsa, audio uchun tugma pleyerni ochib-yopadi.
 */
export function MaterialActionButton({ m, playing, onToggleAudio, size = "sm" }: { m: Openable; playing?: boolean; onToggleAudio?: () => void; size?: "sm" | "md" }) {
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toastError(e, "Faylni ochib boʻlmadi");
    } finally {
      setBusy(false);
    }
  };
  if (m.type === "LINK" && m.url) {
    return (
      <a
        href={m.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-label-md text-label-md text-primary hover:bg-surface-container-low"
      >
        <Icon name="open_in_new" size={16} />
        Ochish
      </a>
    );
  }
  const f = m.file;
  if (!f) return null;
  if (m.type === "AUDIO" && onToggleAudio) {
    return (
      <Button size={size} variant="outline" icon={playing ? "close" : "play_arrow"} className="text-primary" onClick={onToggleAudio}>
        {playing ? "Yopish" : "Tinglash"}
      </Button>
    );
  }
  if (m.type === "PDF" || m.type === "VIDEO" || m.type === "IMAGE") {
    return (
      <Button size={size} variant="outline" icon="visibility" className="text-primary" loading={busy} onClick={() => run(() => openFile(f.id))}>
        Ochish
      </Button>
    );
  }
  return (
    <Button size={size} variant="outline" icon="download" className="text-primary" loading={busy} onClick={() => run(() => downloadFile(f.id, f.originalName))}>
      Yuklab olish
    </Button>
  );
}

/** Material qatori: ikonka, nom, izoh, amal; audio bo'lsa pastida pleyer ochiladi. */
export function MaterialRow({ m, meta, compact, extra }: { m: Openable & { id: string }; meta?: ReactNode; compact?: boolean; extra?: ReactNode }) {
  const [playing, setPlaying] = useState(false);
  const mm = MATERIAL_META[m.type];
  const sub = meta ?? [mm.label, m.file ? fmtFileSize(m.file.size) : null].filter(Boolean).join(" · ");
  return (
    <div className={cn("rounded-xl border border-outline-variant/70 bg-surface-container-low/60", compact ? "p-2.5" : "p-3")}>
      <div className="flex items-center gap-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", mm.tile)}>
          <Icon name={mm.icon} size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 break-words font-label-lg text-label-lg text-on-surface" title={m.title}>
            {m.title}
          </p>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-on-surface-muted">
            <span className="truncate">{sub}</span>
            {extra}
          </div>
        </div>
        <MaterialActionButton m={m} playing={playing} onToggleAudio={() => setPlaying((p) => !p)} />
      </div>
      {playing && m.file ? <AuthAudio fileId={m.file.id} className="mt-2.5" /> : null}
    </div>
  );
}

/** Oddiy fayl (vazifa ilovasi) — ikonka + nom + ochish/yuklab olish. */
export function FileChip({ f, onDelete, deleting }: { f: FileMeta; onDelete?: () => void; deleting?: boolean }) {
  const kind = fileKind(f);
  const [busy, setBusy] = useState(false);
  const open = async () => {
    setBusy(true);
    try {
      if (kind === "pdf" || kind === "image" || kind === "video") await openFile(f.id);
      else await downloadFile(f.id, f.originalName);
    } catch (e) {
      toastError(e, "Faylni ochib boʻlmadi");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-3">
      <div className="flex items-center gap-3">
        {kind === "image" ? (
          <AuthImage fileId={f.id} alt={f.originalName} />
        ) : (
          <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg", kind === "audio" ? "bg-primary text-on-primary" : kind === "pdf" ? "bg-error-container text-error" : "bg-primary-fixed text-primary")}>
            <Icon name={kind === "audio" ? "mic" : FILE_KIND_ICON[kind]} size={24} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-label-lg text-label-lg text-on-surface" title={f.originalName}>
            {f.originalName}
          </p>
          <p className="text-body-sm text-on-surface-muted">{fmtFileSize(f.size)}</p>
        </div>
        {kind !== "audio" ? <IconButton icon={kind === "file" ? "download" : "visibility"} label={kind === "file" ? "Yuklab olish" : "Ochish"} size="sm" loading={busy} onClick={open} /> : null}
        {onDelete ? <IconButton icon="delete" label="Oʻchirish" size="sm" className="hover:text-error" loading={deleting} onClick={onDelete} /> : null}
      </div>
      {kind === "audio" ? <AuthAudio fileId={f.id} className="mt-2.5" /> : null}
    </div>
  );
}

// ─────────────────────────── holatlar ───────────────────────────

/** Yuklashda xato: 404 bo'lsa "topilmadi", aks holda qayta urinish tugmasi. */
export function ErrorState({ error, onRetry, notFoundTitle = "Maʼlumot topilmadi", action }: { error: unknown; onRetry?: () => void; notFoundTitle?: string; action?: ReactNode }) {
  const nf = isApiError(error) && error.status === 404;
  return (
    <EmptyState
      icon={nf ? "search_off" : "cloud_off"}
      title={nf ? notFoundTitle : "Maʼlumotni yuklab boʻlmadi"}
      description={nf ? "Bu sahifa sizga tegishli emas yoki oʻchirilgan boʻlishi mumkin." : error instanceof Error ? error.message : undefined}
      action={
        <>
          {!nf && onRetry ? (
            <Button variant="outline" icon="refresh" onClick={onRetry}>
              Qayta urinish
            </Button>
          ) : null}
          {action}
        </>
      }
    />
  );
}

/** Kartalar uchun skelet. */
export function CardsSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-5 shadow-card">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-3 h-6 w-2/3" />
          <Skeleton className="mt-3 h-4 w-full" />
        </div>
      ))}
    </div>
  );
}
