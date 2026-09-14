import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/types";
import { Icon } from "./Icon";
import { ProgressBar } from "./ProgressBar";
import { Skeleton } from "./Skeleton";
import { iconTileTone, textTone } from "./tones";

export interface StatCardProps {
  label: ReactNode;
  /** Asosiy raqam (formatlangan): fmtNum(124), "93%", "4.6" */
  value: ReactNode;
  /** Raqam yonidagi birlik: "nafar", "ta guruh" */
  unit?: ReactNode;
  icon?: string;
  iconTone?: Tone;
  /** Raqam qatoridagi chip: <Badge tone="gold">Aʼlo daraja</Badge> */
  badge?: ReactNode;
  /** O'zgarish: { value: "+12%", positive: true } */
  delta?: { value: ReactNode; positive?: boolean };
  /** Pastki izoh matni */
  sub?: ReactNode;
  subIcon?: string;
  subTone?: Tone;
  /** Pastki progress chizig'i (0–100) */
  progress?: number;
  progressTone?: Tone;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * KPI kartasi (mockup: "Faol guruhlarim 5 ta guruh biriktirilgan").
 *   <StatCard label="Jami oʻquvchilar" value={fmtNum(124)} unit="nafar" icon="school" delta={{ value: "+12%", positive: true }} sub="oʻtgan oyga nisbatan" />
 */
export function StatCard({
  label,
  value,
  unit,
  icon,
  iconTone = "primary",
  badge,
  delta,
  sub,
  subIcon,
  subTone,
  progress,
  progressTone = "primary",
  loading,
  onClick,
  className,
}: StatCardProps) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-5 text-left shadow-card transition-shadow",
        onClick && "cursor-pointer hover:shadow-float focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-surface-container-low transition-transform group-hover:scale-110"
      />
      <div className="relative flex items-start justify-between gap-3">
        <span className="pt-1 font-label-md text-label-md text-on-surface-variant">{label}</span>
        {icon ? (
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconTileTone[iconTone])}>
            <Icon name={icon} size={22} />
          </span>
        ) : null}
      </div>
      <div className="relative mt-2 flex flex-wrap items-baseline justify-between gap-2">
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="font-metric-num text-metric-num tabular-nums text-on-surface">{value}</span>
            {unit ? <span className="font-label-sm text-label-sm text-on-surface-variant">{unit}</span> : null}
          </div>
        )}
        {badge}
      </div>
      {progress != null ? <ProgressBar value={progress} tone={progressTone} size="sm" className="relative mt-3" /> : null}
      {sub != null || delta ? (
        <div
          className={cn(
            "relative mt-3 flex min-w-0 items-center gap-1.5 text-body-sm",
            subTone ? textTone[subTone] : "text-on-surface-variant",
          )}
        >
          {delta ? (
            <span className={cn("inline-flex shrink-0 items-center gap-0.5 font-semibold", delta.positive === false ? "text-error" : "text-success")}>
              <Icon name={delta.positive === false ? "trending_down" : "trending_up"} size={16} />
              {delta.value}
            </span>
          ) : null}
          {subIcon ? <Icon name={subIcon} size={16} /> : null}
          {sub != null ? <span className="truncate">{sub}</span> : null}
        </div>
      ) : null}
    </Comp>
  );
}
