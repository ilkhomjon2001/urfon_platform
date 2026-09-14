// admin-a: sahifalar orasida umumiy kichik komponentlar va yordamchilar.
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Alert, Avatar, Badge, Button, Dialog, Icon, Skeleton, softTone, type DialogProps } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fmtPhone, WEEKDAYS_SHORT } from "@/lib/format";
import { useApiQuery } from "@/lib/query";
import type { Tone } from "@/lib/types";
import type { EnrollmentStatus, GroupStatus, LessonStatus, Lookups, RoomAvailability, TeacherAvailability, TopicStatus } from "./types";

// ─── Holat chiplari ───
export const GROUP_STATUS: Record<GroupStatus, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Faol", tone: "success" },
  ENROLLING: { label: "Yangi qabul", tone: "primary" },
  FINISHED: { label: "Yakunlangan", tone: "neutral" },
};

export const ENROLLMENT_STATUS: Record<EnrollmentStatus, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Faol", tone: "success" },
  WAITING: { label: "Kutmoqda", tone: "gold" },
  LEFT: { label: "Chiqqan", tone: "neutral" },
};

export const LESSON_STATUS: Record<LessonStatus, { label: string; tone: Tone }> = {
  PLANNED: { label: "Rejada", tone: "neutral" },
  IN_PROGRESS: { label: "Davom etmoqda", tone: "primary" },
  DONE: { label: "Oʻtildi", tone: "success" },
  CANCELLED: { label: "Bekor qilindi", tone: "danger" },
};

export const TOPIC_STATUS: Record<TopicStatus, { label: string; tone: Tone; icon: string }> = {
  PUBLISHED: { label: "Tasdiqlangan", tone: "success", icon: "check_circle" },
  DRAFT: { label: "Qoralama", tone: "warning", icon: "edit_note" },
  ARCHIVED: { label: "Arxivlangan", tone: "neutral", icon: "inventory_2" },
};

export function GroupStatusBadge({ status, className }: { status: GroupStatus; className?: string }) {
  const s = GROUP_STATUS[status];
  return (
    <Badge tone={s.tone} dot className={className}>
      {s.label}
    </Badge>
  );
}

/** Level chipi rangi: har bir level o'z rangini saqlaydi (tartib bo'yicha emas, kod bo'yicha). */
export function levelTone(code: string | null | undefined): Tone {
  switch (code) {
    case "L1":
      return "neutral";
    case "L2":
    case "L3":
      return "primary";
    case "L4":
      return "gold";
    case "L5":
    case "L6":
      return "navy";
    default:
      return "neutral";
  }
}

/** Level chipi — tor ustunda ikki qatorga o'raladi (mockupdagidek). */
export function LevelChip({ code, label }: { code: string; label: string | null }) {
  return (
    <span className={cn("inline-flex max-w-[160px] items-start gap-1.5 rounded-2xl px-2.5 py-1 font-label-sm text-label-sm leading-tight", softTone[levelTone(code)])}>
      <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      <span>{label}</span>
    </span>
  );
}

/** "IELTS Foundation #3" → "IF3" (jadvaldagi guruh kvadrati) */
export function groupMonogram(name: string) {
  const num = name.match(/#\s*(\d+)/)?.[1] ?? "";
  const letters = name
    .replace(/#\s*\d+/, "")
    .split(/[\s&()+.,/-]+/)
    .filter((w) => /^[A-Za-zʻʼ]/.test(w))
    .slice(0, num ? 2 : 3)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (letters + num).slice(0, 4) || "GR";
}

// ─── Dialog variantlari ───
/** O'ng tomondan chiquvchi panel (drawer). Mobilda to'liq ekran. */
export const SHEET_CLASS =
  "left-auto right-0 top-0 h-dvh max-h-dvh w-full max-w-xl translate-x-0 translate-y-0 rounded-none sm:rounded-l-2xl data-[state=open]:animate-fade-in";

/** Markaziy dialog, mobilda to'liq ekran. */
export const MOBILE_FULL_CLASS =
  "max-sm:left-0 max-sm:top-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:data-[state=open]:animate-fade-in";

export function Sheet({ className, ...props }: DialogProps) {
  return <Dialog {...props} className={cn(SHEET_CLASS, className)} />;
}

// ─── Lookups ───
export function useLookups() {
  return useApiQuery<Lookups>(["admin", "lookups"], "/admin/lookups", { staleTime: 60_000 });
}

/** Mutatsiyadan keyin yangilanadigan admin-a kalitlari. */
export const ADMIN_A_KEYS = {
  groups: [["admin", "groups"], ["admin", "lookups"], ["admin", "dashboard"], ["admin", "teachers"], ["admin", "rooms"], ["me", "nav-badges"]],
  teachers: [["admin", "teachers"], ["admin", "lookups"], ["admin", "groups"], ["admin", "dashboard"], ["me", "nav-badges"]],
  curriculum: [["admin", "curriculum"]],
} as const satisfies Record<string, readonly (readonly string[])[]>;

export const keys = (k: keyof typeof ADMIN_A_KEYS) => ADMIN_A_KEYS[k].map((x) => [...x]);

// ─── Hafta kunlari tanlagich ───
export function DayPicker({ value, onChange, invalid }: { value: number[]; onChange: (days: number[]) => void; invalid?: boolean }) {
  const toggle = (d: number) => onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d].sort((a, b) => a - b));
  return (
    <div className={cn("grid grid-cols-7 gap-1", invalid && "rounded-lg ring-2 ring-error/30")} role="group" aria-label="Dars kunlari">
      {WEEKDAYS_SHORT.map((label, i) => {
        const d = i + 1;
        const on = value.includes(d);
        return (
          <button
            key={d}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(d)}
            className={cn(
              "h-10 rounded-lg font-label-md text-label-md transition-colors",
              on ? "bg-primary text-on-primary shadow-xs" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Vaqtinchalik parol (bir marta ko'rsatiladi) ───
export function TempPasswordDialog({
  data,
  onClose,
}: {
  data: { name: string; login: string; password: string; created?: boolean } | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(`Login: ${data.login}\nParol: ${data.password}`);
      setCopied(true);
      toast.success("Login va parol nusxalandi");
    } catch {
      toast.error("Nusxalab boʻlmadi — qoʻlda koʻchirib oling");
    }
  };
  return (
    <Dialog
      open={!!data}
      onOpenChange={(o) => {
        if (!o) {
          setCopied(false);
          onClose();
        }
      }}
      title={data?.created ? "Ustoz akkaunti ochildi" : "Yangi vaqtinchalik parol"}
      description={data?.name}
      size="sm"
      footer={
        <>
          <Button variant="outline" icon={copied ? "check" : "content_copy"} onClick={copy}>
            {copied ? "Nusxalandi" : "Nusxalash"}
          </Button>
          <Button onClick={onClose}>Tushunarli</Button>
        </>
      }
    >
      {data ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-surface-container-low p-4">
            <div className="text-body-sm text-on-surface-variant">Login (telefon)</div>
            <div className="font-label-lg text-label-lg tabular-nums text-on-surface">{fmtPhone(data.login)}</div>
            <div className="mt-3 text-body-sm text-on-surface-variant">Vaqtinchalik parol</div>
            <div className="select-all font-mono text-[22px] font-semibold tracking-[0.12em] text-primary">{data.password}</div>
          </div>
          <Alert tone="warning" title="Parol faqat hozir koʻrsatiladi">
            Uni ustozga xavfsiz yoʻl bilan yetkazing. Birinchi kirishda ustoz parolni oʻzgartirishi shart.
          </Alert>
        </div>
      ) : null}
    </Dialog>
  );
}

// ─── Ustoz tanlash (bo'sh/band holati va yuklama bilan) ───
export interface SlotQuery {
  days: number[];
  startTime: string;
  endTime: string;
  startDate?: string;
  excludeGroupId?: string;
}

export const isTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
export const slotReady = (s: SlotQuery) => s.days.length > 0 && isTime(s.startTime) && isTime(s.endTime) && s.endTime > s.startTime;

export function TeacherPickList({
  slot,
  value,
  onChange,
  allowNone,
}: {
  slot: SlotQuery;
  value: string | null;
  onChange: (id: string | null) => void;
  allowNone?: boolean;
}) {
  const ready = slotReady(slot);
  const q = useApiQuery<{ items: TeacherAvailability[]; slotText: string }>(["admin", "teachers", "availability"], ready ? "/admin/teachers/availability" : null, {
    params: { days: slot.days.join(","), startTime: slot.startTime, endTime: slot.endTime, startDate: slot.startDate, excludeGroupId: slot.excludeGroupId },
    placeholderData: (p) => p,
  });
  if (!ready) return <p className="text-body-sm text-on-surface-muted">Avval dars kunlari va vaqtini tanlang — ustozlarning bandligi shunga qarab koʻrsatiladi.</p>;
  if (q.isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (q.error) return <Alert tone="danger">{q.error.message}</Alert>;
  const items = q.data?.items ?? [];
  return (
    <div className={cn("flex flex-col gap-2", q.isFetching && "opacity-70")} role="radiogroup" aria-label="Ustoz">
      {allowNone ? (
        <PickCard selected={value == null} onSelect={() => onChange(null)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
            <Icon name="person_off" size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-label-lg text-label-lg text-on-surface">Hozircha biriktirmaslik</div>
            <div className="text-body-sm text-on-surface-variant">Guruh “Ustozsiz” roʻyxatida turadi</div>
          </div>
        </PickCard>
      ) : null}
      {items.length === 0 ? <p className="text-body-sm text-on-surface-muted">Faol ustozlar yoʻq.</p> : null}
      {items.map((t) => (
        <PickCard key={t.id} selected={value === t.id} disabled={t.busy} onSelect={() => onChange(t.id)}>
          <Avatar name={t.fullName} src={t.avatarUrl} size="md" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-label-lg text-label-lg text-on-surface">{t.fullName}</div>
            <div className="truncate text-body-sm text-on-surface-variant">
              {[t.specialization, `hozirda ${t.groupsCount} ta guruhda`, `haftasiga ${t.weeklyHours} soat`].filter(Boolean).join(" · ")}
            </div>
            {t.busy ? (
              <div className="mt-0.5 truncate text-body-sm text-error">Band: {t.conflicts.map((c) => `${c.name} (${c.scheduleText})`).join("; ")}</div>
            ) : null}
          </div>
          {t.busy ? (
            <Badge tone="danger">Band</Badge>
          ) : t.recommended ? (
            <Badge tone="primary" variant="solid">
              Tavsiya
            </Badge>
          ) : t.highLoad ? (
            <Badge tone="warning">Yuklama yuqori</Badge>
          ) : (
            <Badge tone="success">Vaqti mos</Badge>
          )}
        </PickCard>
      ))}
    </div>
  );
}

export function RoomPickList({
  slot,
  capacity,
  value,
  onChange,
  allowNone,
}: {
  slot: SlotQuery;
  capacity?: number;
  value: string | null;
  onChange: (id: string | null) => void;
  allowNone?: boolean;
}) {
  const ready = slotReady(slot);
  const q = useApiQuery<{ items: RoomAvailability[] }>(["admin", "rooms", "availability"], ready ? "/admin/rooms/availability" : null, {
    params: {
      days: slot.days.join(","), startTime: slot.startTime, endTime: slot.endTime, startDate: slot.startDate,
      excludeGroupId: slot.excludeGroupId, capacity,
    },
    placeholderData: (p) => p,
  });
  if (!ready) return <p className="text-body-sm text-on-surface-muted">Avval dars kunlari va vaqtini tanlang.</p>;
  if (q.isLoading) return <Skeleton className="h-40 w-full rounded-lg" />;
  if (q.error) return <Alert tone="danger">{q.error.message}</Alert>;
  return (
    <div className={cn("flex flex-col gap-2", q.isFetching && "opacity-70")} role="radiogroup" aria-label="Xona">
      {allowNone ? (
        <PickCard selected={value == null} onSelect={() => onChange(null)}>
          <Icon name="block" className="text-on-surface-variant" />
          <div className="font-label-lg text-label-lg text-on-surface">Xonasiz</div>
        </PickCard>
      ) : null}
      {q.data?.items.map((r) => (
        <PickCard key={r.id} selected={value === r.id} disabled={r.busy} onSelect={() => onChange(r.id)}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary">
            <Icon name="meeting_room" size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-label-lg text-label-lg text-on-surface">{r.name}</div>
            <div className="truncate text-body-sm text-on-surface-variant">
              {[r.location, r.kind, `${r.capacity} oʻrin`].filter(Boolean).join(" · ")}
            </div>
            {r.busy ? <div className="mt-0.5 truncate text-body-sm text-error">Band: {r.conflicts.map((c) => `${c.name} (${c.scheduleText})`).join("; ")}</div> : null}
          </div>
          {r.busy ? <Badge tone="danger">Band</Badge> : !r.fits ? <Badge tone="warning">Sigʻim kichik</Badge> : <Badge tone="success">Boʻsh</Badge>}
        </PickCard>
      ))}
    </div>
  );
}

function PickCard({ selected, disabled, onSelect, children }: { selected: boolean; disabled?: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border bg-surface-container-lowest p-2.5 text-left transition-colors",
        selected ? "border-primary ring-2 ring-primary/15" : "border-outline-variant hover:bg-surface-container-low",
        disabled && "cursor-not-allowed opacity-60 hover:bg-surface-container-lowest",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-primary" : "border-outline",
        )}
      >
        {selected ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
      </span>
      {children}
    </button>
  );
}

// ─── CSV eksport (Excel ochadi) ───
export function downloadCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[";\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Kichik ma'lumot bloki (drawer ichidagi 2 ustunli grid). */
export function InfoItem({ icon, label, children, action }: { icon: string; label: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl bg-surface-container-low p-3">
      <Icon name={icon} size={20} className="mt-0.5 text-primary" />
      <div className="min-w-0 flex-1">
        <div className="text-body-sm text-on-surface-variant">{label}</div>
        <div className="break-words font-label-lg text-label-lg text-on-surface">{children}</div>
      </div>
      {action}
    </div>
  );
}
