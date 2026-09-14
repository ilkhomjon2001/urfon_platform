// teacher-b sahifalari uchun umumiy kichik komponentlar va yordamchilar.
import type { ReactNode } from "react";
import { Badge, Button, EmptyState, Icon, IconButton, Skeleton, iconTileTone } from "@/components/ui";
import { downloadFile, openFile, useFileObjectUrl } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtDayMonth, fmtFileSize, fmtTime, relDayWord, tzParts } from "@/lib/format";
import { toastError } from "@/lib/query";
import type { FileMeta, Tone } from "@/lib/types";
import type { GroupRef, HwType } from "./types";

// ---------------------------------------------------------------- vazifa turlari

export const TYPE_META: Record<HwType, { label: string; short: string; icon: string; chip: string }> = {
  TEXT: { label: "Yozma ish", short: "Matn", icon: "edit_note", chip: "bg-surface-container text-on-surface-variant" },
  AUDIO: { label: "Audio / Speaking", short: "Audio", icon: "graphic_eq", chip: "bg-tertiary-fixed text-on-tertiary-fixed-variant" },
  FILE: { label: "Fayl topshiriq", short: "Fayl", icon: "upload_file", chip: "bg-primary-fixed text-on-primary-fixed-variant" },
  QUIZ: { label: "Test / Quiz", short: "Test", icon: "quiz", chip: "bg-success-container text-on-success-container" },
};

export function TypeChip({ type, className }: { type: HwType; className?: string }) {
  const m = TYPE_META[type];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11.5px] font-semibold", m.chip, className)}>
      <Icon name={m.icon} size={15} />
      {m.label}
    </span>
  );
}

export function GroupChip({ group, className }: { group: Pick<GroupRef, "name" | "code">; className?: string }) {
  return (
    <span className={cn("inline-flex max-w-full items-center truncate rounded-md bg-primary-fixed px-2.5 py-1 font-display text-[11.5px] font-bold text-primary", className)}>
      <span className="truncate">
        {group.name} ({group.code})
      </span>
    </span>
  );
}

// ---------------------------------------------------------------- baholar

/** Baho tugmasi tanlangan holati (5 ballik tizim, KANON §3). */
export const GRADE_SELECTED: Record<number, string> = {
  5: "border-success bg-success-container text-on-success-container",
  4: "border-primary bg-primary-fixed text-on-primary-fixed-variant",
  3: "border-warning bg-warning-container text-on-warning-container",
  2: "border-error bg-error-container text-on-error-container",
};

// ---------------------------------------------------------------- KPI kartasi (mockup uslubi)

export interface KpiCardProps {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  icon: string;
  tone?: Tone;
  /** Qizil urg'u (tekshirish navbati) */
  accent?: boolean;
  footer?: ReactNode;
  footerIcon?: string;
  chip?: ReactNode;
  chipTone?: Tone;
  loading?: boolean;
  onClick?: () => void;
}

export function KpiCard({ label, value, unit, icon, tone = "primary", accent, footer, footerIcon, chip, chipTone = "neutral", loading, onClick }: KpiCardProps) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex flex-col justify-between rounded-xl border bg-surface-container-lowest p-5 text-left shadow-card transition-shadow hover:shadow-float",
        accent ? "border-error/25" : "border-outline-variant/70",
        onClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={cn("font-label-md text-label-md uppercase tracking-wider", accent ? "text-error" : "text-on-surface-muted")}>{label}</span>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <span className={cn("font-metric-num text-metric-num tabular-nums", accent ? "text-error" : "text-on-surface")}>{value}</span>
            )}
            {unit ? <span className="text-body-sm font-medium text-on-surface-muted">{unit}</span> : null}
          </div>
        </div>
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", iconTileTone[accent ? "danger" : tone])}>
          <Icon name={icon} size={24} />
        </span>
      </div>
      {footer != null || chip != null ? (
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-surface-container pt-3 text-body-sm">
          <span className="flex min-w-0 items-center gap-1.5 font-medium text-on-surface-variant">
            {footerIcon ? <Icon name={footerIcon} size={16} className="shrink-0 text-primary" /> : null}
            <span className="truncate">{footer}</span>
          </span>
          {chip != null ? (
            <Badge tone={chipTone} shape="square">
              {chip}
            </Badge>
          ) : null}
        </div>
      ) : null}
    </Comp>
  );
}

// ---------------------------------------------------------------- ko'p bo'lakli progress

export function SegBar({ segments, total, className }: { segments: { value: number; className: string; title: string }[]; total: number; className?: string }) {
  return (
    <div className={cn("flex h-2 w-full overflow-hidden rounded-full bg-surface-container-high", className)} role="img" aria-label={segments.map((s) => `${s.title}: ${s.value}`).join(", ")}>
      {total > 0
        ? segments.map((s, i) =>
            s.value > 0 ? <div key={i} className={cn("h-full", s.className)} style={{ width: `${Math.min(100, (s.value / total) * 100)}%` }} title={`${s.title}: ${s.value}`} /> : null,
          )
        : null}
    </div>
  );
}

// ---------------------------------------------------------------- vaqt

const pad = (n: number) => String(n).padStart(2, "0");

/** "Bugun, 20:00" / "Ertaga, 09:00" / "27-may, 14:00" */
export function whenLabel(d: string | Date) {
  return `${relDayWord(d) ?? fmtDayMonth(d)}, ${fmtTime(d)}`;
}

export function dueInfo(dueAt: string, now = Date.now()): { text: string; tone: Tone; icon: string; past: boolean } {
  const t = new Date(dueAt).getTime();
  if (t < now) return { text: `Muddat tugagan · ${whenLabel(dueAt)}`, tone: "neutral", icon: "event_busy", past: true };
  const hours = (t - now) / 3_600_000;
  return { text: `${whenLabel(dueAt)} gacha`, tone: hours <= 24 ? "danger" : "neutral", icon: hours <= 24 ? "alarm" : "schedule", past: false };
}

export function timeLeft(dueAt: string, now = Date.now()) {
  const ms = new Date(dueAt).getTime() - now;
  if (ms < 0) return "Muddat tugagan";
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return "1 soatdan kam qoldi";
  if (h < 24) return `${h} soat qoldi`;
  return `Muddatga ${Math.floor(h / 24)} kun bor`;
}

/** datetime-local qiymati (Toshkent vaqti): "2024-05-24T20:00" */
export function toLocalInput(d: Date | string) {
  const p = tzParts(d);
  return `${p.year}-${pad(p.month + 1)}-${pad(p.day)}T${pad(p.hours)}:${pad(p.minutes)}`;
}

/** datetime-local (Toshkent) → Date */
export function fromLocalInput(s: string) {
  return new Date(`${s}:00+05:00`);
}

/** Ertaga soat HH:MM (Toshkent) — forma uchun standart muddat. */
export function defaultDue(hhmm = "20:00", days = 1) {
  return `${toLocalInput(new Date(Date.now() + days * 86_400_000)).slice(0, 10)}T${hhmm}`;
}

// ---------------------------------------------------------------- fayllar

export type FileKind = "audio" | "image" | "pdf" | "video" | "file";
export function fileKind(mime: string, name = ""): FileKind {
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf" || name.toLowerCase().endsWith(".pdf")) return "pdf";
  return "file";
}

export function AudioPlayer({ file, className }: { file: FileMeta; className?: string }) {
  const { url, error } = useFileObjectUrl(file.id);
  return (
    <div className={cn("rounded-xl border border-outline-variant bg-surface-container-lowest p-3", className)}>
      <div className="mb-2 flex items-center gap-2 text-body-sm text-on-surface">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
          <Icon name="graphic_eq" size={16} />
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold">{file.originalName}</span>
        <span className="shrink-0 text-on-surface-muted">{fmtFileSize(file.size)}</span>
        <IconButton icon="download" label="Yuklab olish" size="sm" className="text-primary" onClick={() => downloadFile(file.id, file.originalName).catch(toastError)} />
      </div>
      {error ? (
        <p className="text-body-sm text-error">Audio faylni yuklab boʻlmadi</p>
      ) : url ? (
        <audio controls src={url} preload="metadata" className="h-10 w-full" />
      ) : (
        <Skeleton className="h-10 w-full rounded-full" />
      )}
    </div>
  );
}

function ImageThumb({ file }: { file: FileMeta }) {
  const { url } = useFileObjectUrl(file.id);
  return (
    <button
      type="button"
      onClick={() => openFile(file.id).catch(toastError)}
      title={`${file.originalName} — kattalashtirish`}
      className="group relative block overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low"
    >
      {url ? <img src={url} alt={file.originalName} className="max-h-64 w-full object-contain" /> : <Skeleton className="h-40 w-full rounded-none" />}
      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-on-surface/70 px-2 py-1 text-[11px] font-semibold text-on-primary opacity-0 transition-opacity group-hover:opacity-100">
        <Icon name="open_in_new" size={14} />
        Ochish
      </span>
    </button>
  );
}

/** Fayl ko'rinishi: audio — pleer, rasm — kichik ko'rinish, PDF — yangi tabda ochish, qolgani — yuklab olish. */
export function FileTile({ file }: { file: FileMeta }) {
  const kind = fileKind(file.mime, file.originalName);
  if (kind === "audio") return <AudioPlayer file={file} />;
  if (kind === "image") return <ImageThumb file={file} />;
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-3">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", kind === "pdf" ? "bg-error-container text-error" : "bg-primary-fixed text-primary")}>
        <Icon name={kind === "pdf" ? "picture_as_pdf" : kind === "video" ? "movie" : "description"} size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-label-lg text-label-lg text-on-surface">{file.originalName}</span>
        <span className="text-body-sm text-on-surface-muted">{fmtFileSize(file.size)}</span>
      </span>
      {kind === "pdf" || kind === "video" ? (
        <Button size="sm" variant="secondary" icon="open_in_new" onClick={() => openFile(file.id).catch(toastError)}>
          Ochish
        </Button>
      ) : null}
      <IconButton icon="download" label="Yuklab olish" size="sm" className="text-primary" onClick={() => downloadFile(file.id, file.originalName).catch(toastError)} />
    </div>
  );
}

// ---------------------------------------------------------------- holatlar

export function QueryError({ error, onRetry, compact }: { error: unknown; onRetry?: () => void; compact?: boolean }) {
  return (
    <EmptyState
      compact={compact}
      icon="cloud_off"
      title="Maʼlumotni yuklab boʻlmadi"
      description={error instanceof Error ? error.message : undefined}
      action={
        onRetry ? (
          <Button variant="outline" size="sm" icon="refresh" onClick={onRetry}>
            Qayta urinish
          </Button>
        ) : undefined
      }
    />
  );
}

/** Kichik bo'lim sarlavhasi (forma ichidagi "GURUH BO'YICHA" kabi) */
export function MiniLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted", className)}>{children}</span>;
}
