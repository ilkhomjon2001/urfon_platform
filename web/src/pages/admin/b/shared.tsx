// admin-b sahifalari uchun umumiy yordamchilar: yorliqlar, CSV yuklab olish, nusxalash, kirish maʼlumotlari oynasi.
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Alert, Badge, Button, Dialog, Icon, IconButton, Select } from "@/components/ui";
import { api, type QueryParams } from "@/lib/api";
import { cn } from "@/lib/cn";
import { MONTHS } from "@/lib/format";
import { toastError, useApiQuery } from "@/lib/query";
import type { Role, Tone } from "@/lib/types";
import type { Credential, PaymentMethod, PaymentStatus, StudentStatus } from "./types";

// ─────────── Yorliqlar ───────────

export const STUDENT_STATUS: Record<StudentStatus, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Faol", tone: "primary" },
  ACADEMIC_LEAVE: { label: "Taʼtilda", tone: "gold" },
  GRADUATED: { label: "Bitirgan", tone: "success" },
  LEFT: { label: "Ketgan", tone: "neutral" },
};

export const STUDENT_STATUS_LONG: Record<StudentStatus, string> = {
  ACTIVE: "Faol taʼlimda",
  ACADEMIC_LEAVE: "Akademik taʼtilda",
  GRADUATED: "Bitirgan",
  LEFT: "Ketgan",
};

export const PAY_STATUS: Record<PaymentStatus, { label: string; tone: Tone; icon: string }> = {
  PAID: { label: "Toʻlangan", tone: "success", icon: "check_circle" },
  PENDING: { label: "Kutilmoqda", tone: "warning", icon: "hourglass_top" },
  OVERDUE: { label: "Muddati oʻtgan", tone: "danger", icon: "warning" },
  CANCELLED: { label: "Bekor qilingan", tone: "neutral", icon: "block" },
};

export const METHOD: Record<PaymentMethod, { label: string; icon: string }> = {
  CASH: { label: "Naqd (kassa)", icon: "payments" },
  CARD: { label: "Karta", icon: "credit_card" },
  CLICK: { label: "Click", icon: "bolt" },
  PAYME: { label: "Payme", icon: "account_balance_wallet" },
  TRANSFER: { label: "Bank oʻtkazmasi", icon: "account_balance" },
};

export const ROLE_UZ: Record<Role | "SYSTEM", string> = {
  ADMIN: "Admin",
  TEACHER: "Ustoz",
  PARENT: "Ota-ona",
  STUDENT: "Oʻquvchi",
  SYSTEM: "Tizim",
};

export const ROLE_TONE: Record<Role | "SYSTEM", Tone> = {
  ADMIN: "navy",
  TEACHER: "primary",
  PARENT: "gold",
  STUDENT: "success",
  SYSTEM: "neutral",
};

export function StudentStatusBadge({ status, className }: { status: StudentStatus; className?: string }) {
  const s = STUDENT_STATUS[status];
  return (
    <Badge tone={s.tone} className={className}>
      {s.label}
    </Badge>
  );
}

export function PayStatusBadge({ status, className }: { status: PaymentStatus | null | undefined; className?: string }) {
  if (!status) return <span className="text-on-surface-muted">—</span>;
  const s = PAY_STATUS[status];
  return (
    <Badge tone={s.tone} icon={s.icon} className={className}>
      {s.label}
    </Badge>
  );
}

export function TelegramBadge({ linked }: { linked: boolean }) {
  return linked ? (
    <Badge tone="primary" icon="check_circle">
      Ulangan
    </Badge>
  ) : (
    <Badge tone="neutral" icon="cancel">
      Ulanmagan
    </Badge>
  );
}

/** "Ota" → "Otasi", "Ona" → "Onasi", "Vasiy" → "Vasiysi" */
export const relationOf = (r: string) => (r === "Ota" ? "Otasi" : r === "Ona" ? "Onasi" : r === "Vasiy" ? "Vasiysi" : r);

// ─────────── Davr (YYYY-MM) ───────────

export function periodLabel(period: string) {
  const [y, m] = period.split("-").map(Number);
  const name = MONTHS[m - 1] ?? "";
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`;
}

export function shiftPeriod(period: string, n: number) {
  const [y, m] = period.split("-").map(Number);
  const idx = y * 12 + (m - 1) + n;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}

/** Oy oxirgi kuni "YYYY-MM-DD" */
export function periodEnd(period: string) {
  const [y, m] = period.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${period}-${String(last).padStart(2, "0")}`;
}

/** Davr tanlagichi: mavjud davrlar + joriy oy atrofidagi 12 oy. */
export function PeriodSelect({
  value,
  onChange,
  periods,
  className,
  size = "md",
  allowAll,
}: {
  value: string;
  onChange: (v: string) => void;
  periods: string[];
  className?: string;
  size?: "sm" | "md";
  allowAll?: boolean;
}) {
  const uniq = [...new Set([value, ...periods].filter(Boolean))].sort().reverse();
  return (
    <Select
      aria-label="Davr"
      size={size}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      wrapperClassName={className}
      options={[...(allowAll ? [{ value: "", label: "Barcha davrlar" }] : []), ...uniq.map((p) => ({ value: p, label: periodLabel(p) }))]}
    />
  );
}

// ─────────── Guruh / level variantlari (oʻz endpointimiz, sigʻim bilan) ───────────

export interface GroupOption {
  id: string;
  code: string;
  name: string;
  status: "ENROLLING" | "ACTIVE" | "FINISHED";
  capacity: number;
  taken: number;
  monthlyFee: number;
  level: string | null;
  levelId: string | null;
  teacher: string | null;
}
export interface FormOptions {
  groups: GroupOption[];
  levels: { id: string; code: string; name: string; label: string }[];
}

export function useFormOptions() {
  return useApiQuery<FormOptions>(["admin", "b", "options"], "/admin/students/options", { staleTime: 60_000 });
}

// ─────────── CSV yuklab olish ───────────

export async function downloadCsv(path: string, params: QueryParams, filename: string) {
  try {
    const res = await api.get<Response>(path, { params, raw: true, headers: { Accept: "text/csv" } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    toast.success("CSV fayl yuklab olindi");
  } catch (e) {
    toastError(e, "Eksport qilib boʻlmadi");
  }
}

export function ExportButton({
  path,
  params,
  filename,
  label = "Eksport (CSV)",
  variant = "outline",
  size = "md",
  className,
}: {
  path: string;
  params: QueryParams;
  filename: string;
  label?: string;
  variant?: "outline" | "secondary" | "ghost";
  size?: "sm" | "md";
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant={variant}
      size={size}
      icon="file_download"
      loading={busy}
      className={className}
      onClick={async () => {
        setBusy(true);
        await downloadCsv(path, params, filename);
        setBusy(false);
      }}
    >
      {label}
    </Button>
  );
}

// ─────────── Nusxalash ───────────

export async function copyText(text: string, what = "Nusxalandi") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(what);
  } catch {
    toast.error("Nusxalab boʻlmadi — qoʻlda belgilang");
  }
}

export function CopyButton({ value, label = "Nusxalash", className }: { value: string; label?: string; className?: string }) {
  return <IconButton icon="content_copy" label={label} size="sm" variant="ghost" className={className} onClick={() => copyText(value)} />;
}

// ─────────── Kirish maʼlumotlari (vaqtinchalik parol faqat bir marta) ───────────

export function CredentialsDialog({
  open,
  onOpenChange,
  credentials,
  title = "Kirish maʼlumotlari",
  intro,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  credentials: Credential[];
  title?: string;
  intro?: ReactNode;
}) {
  const withPw = credentials.filter((c) => c.password);
  const allText = withPw
    .map((c) => `${c.role === "STUDENT" ? "Oʻquvchi" : "Ota-ona"}: ${c.fullName}\nLogin: ${c.login}\nVaqtinchalik parol: ${c.password}`)
    .join("\n\n");
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={intro ?? "Vaqtinchalik parollar faqat hozir koʻrsatiladi. Birinchi kirishda parolni almashtirish soʻraladi."}
      size="md"
      footer={
        <>
          {withPw.length > 1 ? (
            <Button variant="outline" icon="content_copy" onClick={() => copyText(allText, "Barcha maʼlumotlar nusxalandi")}>
              Hammasini nusxalash
            </Button>
          ) : null}
          <Button onClick={() => onOpenChange(false)}>Tayyor</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {credentials.map((c) => (
          <div key={`${c.role}-${c.userId}`} className="rounded-xl border border-outline-variant/70 bg-surface-container-low p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Icon name={c.role === "STUDENT" ? "school" : "family_restroom"} className="text-primary" />
                <span className="truncate font-label-lg text-label-lg text-on-surface">{c.fullName}</span>
              </div>
              <Badge tone={c.role === "STUDENT" ? "primary" : "gold"}>
                {c.role === "STUDENT" ? "Oʻquvchi" : c.relation ? `Ota-ona · ${c.relation}` : "Ota-ona"}
              </Badge>
            </div>
            <CredLine label="Login" value={c.login} />
            {c.password ? (
              <CredLine label="Vaqtinchalik parol" value={c.password} mono strong />
            ) : (
              <p className="mt-1 flex items-center gap-1.5 text-body-sm text-on-surface-variant">
                <Icon name="link" size={16} />
                Mavjud akkaunt bogʻlandi — paroli oʻzgarmadi.
              </p>
            )}
          </div>
        ))}
        {credentials.some((c) => c.role === "PARENT") ? (
          <Alert tone="primary" title="Telegram botni ulash">
            Ota-ona kabinetga kirgach, «Sozlamalar → Telegram» boʻlimidan botni ulaydi. Shundan soʻng davomat, baho va toʻlov
            xabarlari Telegramga keladi.
          </Alert>
        ) : null}
      </div>
    </Dialog>
  );
}

function CredLine({ label, value, mono, strong }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-body-sm text-on-surface-variant">{label}</span>
      <span className="flex min-w-0 items-center gap-1">
        <span className={cn("truncate tabular-nums text-on-surface", mono && "font-mono tracking-wider", strong ? "text-body-lg font-semibold" : "text-body-md")}>{value}</span>
        <CopyButton value={value} label={`${label}ni nusxalash`} />
      </span>
    </div>
  );
}

/** Kichik "kalit: qiymat" qatori (profil panellari uchun). */
export function InfoRow({ label, children, icon }: { label: ReactNode; children: ReactNode; icon?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-body-sm">
      <span className="flex shrink-0 items-center gap-1.5 text-on-surface-variant">
        {icon ? <Icon name={icon} size={16} /> : null}
        {label}
      </span>
      <span className="min-w-0 text-right font-medium text-on-surface">{children}</span>
    </div>
  );
}

/** Jadval uchun ixcham Telegram belgisi (ikonka + ekran oʻquvchi matni). */
export function TelegramDot({ linked }: { linked: boolean }) {
  return (
    <span
      title={linked ? "Telegram bot ulangan" : "Telegram bot ulanmagan"}
      className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full", linked ? "bg-primary-fixed text-primary" : "bg-surface-container text-outline")}
    >
      <Icon name={linked ? "send" : "cancel"} size={16} filled={linked} />
      <span className="sr-only">{linked ? "Ulangan" : "Ulanmagan"}</span>
    </span>
  );
}
