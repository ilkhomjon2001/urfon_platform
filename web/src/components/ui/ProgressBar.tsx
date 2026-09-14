import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { fmtPercent } from "@/lib/format";
import type { Tone } from "@/lib/types";
import { barTone } from "./tones";

export interface ProgressBarProps {
  /** 0–max (default max=100) */
  value: number;
  max?: number;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  label?: ReactNode;
  /** O'ngda foizni ko'rsatish */
  showValue?: boolean;
  className?: string;
}

/** <ProgressBar value={58} label="Level 2 · IELTS Foundation" showValue /> */
export function ProgressBar({ value, max = 100, tone = "primary", size = "md", label, showValue, className }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={cn("w-full", className)}>
      {label != null || showValue ? (
        <div className="mb-1.5 flex items-center justify-between gap-2 font-label-sm text-label-sm text-on-surface-variant">
          <span className="truncate">{label}</span>
          {showValue ? <span className="tabular-nums text-primary">{fmtPercent(pct, 0)}</span> : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "w-full overflow-hidden rounded-full bg-surface-container-high",
          size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2",
        )}
      >
        <div className={cn("h-full rounded-full transition-[width] duration-500", barTone[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
