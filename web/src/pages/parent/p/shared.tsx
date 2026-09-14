// Ota-ona kabineti uchun umumiy yordamchilar: so'rov hook'i, holat nomlari/ohanglari, kichik komponentlar.
// Faqat @/components/ui va @/lib/* dan foydalanadi.
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Avatar, Button, Card, EmptyState, Icon, Skeleton } from "@/components/ui";
import { useFileObjectUrl } from "@/lib/api";
import { cn } from "@/lib/cn";
import { MONTHS } from "@/lib/format";
import { useSelectedChild } from "@/lib/parent-child";
import { useApiQuery } from "@/lib/query";
import type { QueryParams } from "@/lib/api";
import type { Tone } from "@/lib/types";
import type { AttendanceStatus, DayState, HwState, MaterialType, PaymentMethod, PaymentStatus, TeacherCard } from "./types";

export const PARENT_BASE = "/ota-ona";

/**
 * Tanlangan farzand bo'yicha GET so'rov. studentId avtomatik qo'shiladi va queryKey'da bor —
 * sidebar'da farzand almashtirilsa hamma narsa qayta yuklanadi.
 */
export function useChildQuery<T>(
  key: (string | number | null | undefined)[],
  path: string,
  params: QueryParams = {},
  opts: { refetchInterval?: number; enabled?: boolean; keepPrevious?: boolean } = {},
) {
  const { child } = useSelectedChild();
  const q = useApiQuery<T>(["parent", ...key, child?.id ?? null], child ? path : null, {
    params: child ? { studentId: child.id, ...params } : undefined,
    enabled: opts.enabled ?? true,
    refetchInterval: opts.refetchInterval,
    // Filtr/oy almashganda eski ma'lumot xira holda qoladi (sakrash yo'q). Farzand almashsa — yo'q.
    placeholderData: opts.keepPrevious ? (prev, prevQuery) => (prevQuery?.queryKey.includes(child?.id ?? null) ? prev : undefined) : undefined,
  });
  return { ...q, child };
}

export const STUDENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Faol oʻquvchi", tone: "success" },
  ACADEMIC_LEAVE: { label: "Akademik taʼtilda", tone: "warning" },
  GRADUATED: { label: "Bitirgan", tone: "primary" },
  LEFT: { label: "Oʻqishni tugatgan", tone: "neutral" },
};

// ── Davomat holatlari ──

export const DAY_META: Record<DayState, { label: string; short: string; tone: Tone; icon: string }> = {
  PRESENT: { label: "Keldi", short: "Keldi", tone: "success", icon: "check_circle" },
  LATE: { label: "Kechikib keldi", short: "Kechikdi", tone: "warning", icon: "schedule" },
  EXCUSED: { label: "Kelmadi (sababli)", short: "Sababli", tone: "primary", icon: "event_busy" },
  ABSENT: { label: "Kelmadi", short: "Kelmadi", tone: "danger", icon: "cancel" },
  PLANNED: { label: "Rejalashtirilgan", short: "Rejada", tone: "neutral", icon: "event" },
  IN_PROGRESS: { label: "Dars ketmoqda", short: "Darsda", tone: "navy", icon: "play_circle" },
  UNMARKED: { label: "Davomat belgilanmagan", short: "Belgilanmagan", tone: "neutral", icon: "help" },
  CANCELLED: { label: "Dars bekor qilindi", short: "Bekor", tone: "neutral", icon: "block" },
};

/** Kalendar katagi ranglari (holat bo'yicha). */
export const DAY_CELL: Record<DayState, string> = {
  PRESENT: "bg-success-container/50 border-success/25",
  LATE: "bg-warning-container/60 border-warning/30",
  EXCUSED: "bg-primary-light border-primary-fixed-dim",
  ABSENT: "bg-error-container/60 border-error/25",
  PLANNED: "bg-surface-container-low border-outline-variant/70",
  IN_PROGRESS: "bg-primary-light border-primary/40",
  UNMARKED: "bg-surface-container-low border-outline-variant/70",
  CANCELLED: "bg-surface-container-low border-dashed border-outline-variant",
};

export const DAY_DOT: Record<DayState, string> = {
  PRESENT: "bg-success",
  LATE: "bg-warning",
  EXCUSED: "bg-primary",
  ABSENT: "bg-error",
  PLANNED: "bg-outline",
  IN_PROGRESS: "bg-navy",
  UNMARKED: "bg-outline",
  CANCELLED: "bg-outline-variant",
};

export const isAttended = (s: AttendanceStatus | null | undefined) => s === "PRESENT" || s === "LATE";

// ── Baholar ──

/** 5 → "5", 4.6 → "4.6" */
export const fmtGrade = (v: number | null | undefined) => (v == null ? "—" : Number.isInteger(v) ? String(v) : v.toFixed(1));

export const SKILL_LABEL: Record<string, string> = {
  SPEAKING: "Speaking",
  LISTENING: "Listening",
  READING: "Reading",
  WRITING: "Writing",
  GRAMMAR: "Grammar",
  VOCABULARY: "Lugʻat",
};

// ── Uyga vazifalar ──

export const HW_META: Record<HwState, { label: string; tone: Tone; icon: string }> = {
  open: { label: "Bajarilishi kerak", tone: "primary", icon: "pending_actions" },
  submitted: { label: "Topshirildi · tekshirilmoqda", tone: "navy", icon: "outgoing_mail" },
  reviewed: { label: "Tekshirildi", tone: "success", icon: "task_alt" },
  returned: { label: "Qayta ishlashga qaytarildi", tone: "warning", icon: "undo" },
  missed: { label: "Topshirilmadi", tone: "danger", icon: "event_busy" },
};

export const HW_TYPE_LABEL: Record<string, string> = { TEXT: "Matn", AUDIO: "Audio", FILE: "Fayl", QUIZ: "Test" };

/** Muddatgacha qolgan vaqt: "3 soat 20 daqiqa qoldi", "2 kun qoldi", "Muddati oʻtdi". */
export function dueLeft(dueAt: string, now: string | Date = new Date()) {
  const ms = new Date(dueAt).getTime() - new Date(now).getTime();
  if (ms <= 0) return { text: "Muddati oʻtdi", urgent: true };
  const min = Math.floor(ms / 60_000);
  const days = Math.floor(min / 1440);
  const hours = Math.floor((min % 1440) / 60);
  const mins = min % 60;
  if (days >= 2) return { text: `${days} kun qoldi`, urgent: false };
  if (days === 1) return { text: `1 kun ${hours} soat qoldi`, urgent: false };
  if (hours > 0) return { text: `${hours} soat ${mins} daqiqa qoldi`, urgent: true };
  return { text: `${mins} daqiqa qoldi`, urgent: true };
}

// ── To'lovlar ──

export const PAY_META: Record<PaymentStatus, { label: string; tone: Tone; icon: string }> = {
  PAID: { label: "Toʻlangan", tone: "success", icon: "check_circle" },
  PENDING: { label: "Kutilmoqda", tone: "warning", icon: "hourglass_top" },
  OVERDUE: { label: "Muddati oʻtgan", tone: "danger", icon: "error" },
  CANCELLED: { label: "Bekor qilingan", tone: "neutral", icon: "block" },
};

/** API (lib/billing METHOD_LABEL) bilan bir xil — tushumlarda `methodLabel` shu matnlarda keladi. */
export const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Naqd (kassa)",
  CARD: "Karta",
  CLICK: "Click",
  PAYME: "Payme",
  TRANSFER: "Bank oʻtkazmasi",
};

/** "2024-05" → "May, 2024" */
export function fmtPeriod(period: string) {
  const [y, m] = period.split("-").map(Number);
  const name = MONTHS[(m ?? 1) - 1] ?? "";
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}, ${y}`;
}

/** "2024-05" ± n oy */
export function shiftMonth(period: string, n: number) {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// ── Materiallar ──

export const MATERIAL_ICON: Record<MaterialType, { icon: string; tone: Tone; label: string }> = {
  PDF: { icon: "picture_as_pdf", tone: "danger", label: "PDF" },
  AUDIO: { icon: "headphones", tone: "gold", label: "Audio" },
  VIDEO: { icon: "movie", tone: "primary", label: "Video" },
  DOC: { icon: "description", tone: "primary", label: "Hujjat" },
  IMAGE: { icon: "image", tone: "success", label: "Rasm" },
  LINK: { icon: "link", tone: "neutral", label: "Havola" },
};

export function fileKind(mime: string): MaterialType {
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("audio/")) return "AUDIO";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("image/")) return "IMAGE";
  return "DOC";
}

// ── Komponentlar ──

/** Ustoz surati: /api/files/:id bo'lsa token bilan yuklanadi, aks holda to'g'ridan-to'g'ri. */
export function TeacherAvatar({ teacher, size = "lg", className }: { teacher: Pick<TeacherCard, "fullName" | "avatarUrl">; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const m = teacher.avatarUrl?.match(/^\/api\/files\/([^/?#]+)/);
  const { url } = useFileObjectUrl(m ? m[1] : null);
  const src = m ? url : teacher.avatarUrl;
  return <Avatar name={teacher.fullName} src={src} size={size} className={className} />;
}

/** Farzand biriktirilmagan bo'lsa ko'rsatiladi. */
export function NoChild() {
  return (
    <Card>
      <EmptyState
        icon="family_restroom"
        title="Farzand biriktirilmagan"
        description="Akkauntingizga hali farzand bogʻlanmagan. Markaz administratoriga murojaat qiling."
      />
    </Card>
  );
}

/** Yuklashda xato: qayta urinish tugmasi bilan. */
export function ErrorCard({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  const message = error instanceof Error ? error.message : "Maʼlumotni yuklab boʻlmadi";
  return (
    <Card className={className}>
      <EmptyState
        icon="cloud_off"
        title="Maʼlumotni yuklab boʻlmadi"
        description={message}
        action={
          onRetry ? (
            <Button variant="outline" icon="refresh" onClick={onRetry}>
              Qayta urinish
            </Button>
          ) : undefined
        }
      />
    </Card>
  );
}

/** Sahifa skeleti: sarlavha + kartalar. */
export function PageSkeleton({ cards = 4, blocks = 2 }: { cards?: number; blocks?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Yuklanmoqda">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {Array.from({ length: blocks }, (_, i) => (
          <Skeleton key={i} className={cn("h-72 rounded-xl", i === 0 && "xl:col-span-2")} />
        ))}
      </div>
    </div>
  );
}

/** Ichki panel (mockup: bg-surface-container-low rounded-xl). */
export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl bg-surface-container-low p-4", className)}>{children}</div>;
}

/** Kichik "label: qiymat" qatori. */
export function InfoRow({ icon, label, children, className }: { icon: string; label?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-start gap-2 text-body-sm text-on-surface-variant", className)}>
      <Icon name={icon} size={18} className="mt-px shrink-0 text-outline" />
      <span className="min-w-0">
        {label ? <span>{label} </span> : null}
        <span className="font-semibold text-on-surface">{children}</span>
      </span>
    </div>
  );
}

// ── Chop etish (kvitansiya, profil) ──

/**
 * Chop etish uslublari. printing-area — faqat body'ning bevosita .print-area bolasi (portal) chiqadi;
 * printing-page — qobiq (sidebar, header, pastki panel) yashiriladi, sahifa kontenti chiqadi.
 */
export function PrintStyles() {
  return (
    <style>{`
      .print-only { display: none; }
      @media print {
        @page { margin: 12mm; }
        body { background: #fff !important; }
        body.printing-area > *:not(.print-area) { display: none !important; }
        body.printing-area > .print-area { display: block !important; }
        body.printing-page aside, body.printing-page header, body.printing-page nav, body.printing-page .no-print { display: none !important; }
        body.printing-page main { padding-top: 0 !important; padding-bottom: 0 !important; }
        body.printing-page .lg\\:pl-64 { padding-left: 0 !important; }
        body.printing-page .print-break-avoid { break-inside: avoid; }
      }
    `}</style>
  );
}

/** window.print() ni berilgan rejimda chaqiradi; tugagach body klassi olib tashlanadi. */
export function printWith(mode: "printing-area" | "printing-page") {
  const body = document.body;
  body.classList.add(mode);
  const done = () => {
    body.classList.remove(mode);
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
  // ba'zi brauzerlarda afterprint kelmaydi
  setTimeout(done, 60_000);
}

/** Ustozga yozish havolasi (ChatView yangi suhbat/mavjud suhbatni ochadi). */
export function contactLink(opts: { teacherId?: string | null; threadId?: string | null } = {}) {
  if (opts.threadId) return `${PARENT_BASE}/aloqa?t=${encodeURIComponent(opts.threadId)}`;
  if (opts.teacherId) return `${PARENT_BASE}/aloqa?to=${encodeURIComponent(opts.teacherId)}`;
  return `${PARENT_BASE}/aloqa`;
}

export function TextLink({ to, children, icon = "arrow_forward", className }: { to: string; children: ReactNode; icon?: string; className?: string }) {
  return (
    <Link to={to} className={cn("inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:underline", className)}>
      {children}
      <Icon name={icon} size={16} />
    </Link>
  );
}
