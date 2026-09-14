import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/types";
import { Icon } from "./Icon";
import { softTone, solidTone, textTone } from "./tones";

export interface BadgeProps extends ComponentProps<"span"> {
  tone?: Tone;
  /** soft (default) — och fon; solid — to'liq rang; outline — oq fon + chegara */
  variant?: "soft" | "solid" | "outline";
  icon?: string;
  /** Oldida kichik nuqta ("● Faol") */
  dot?: boolean;
  /** pill (rounded-full, holatlar) yoki square (rounded, guruh teglari) */
  shape?: "pill" | "square";
  size?: "sm" | "md";
}

/**
 * Holat chipi / teg.
 *   <Badge tone="success" dot>Faol</Badge>  <Badge tone="danger">2 kechikkan</Badge>
 *   <Badge tone="navy" shape="square">IELTS Foundation #3</Badge>
 */
export function Badge({
  tone = "neutral",
  variant = "soft",
  icon,
  dot,
  shape = "pill",
  size = "sm",
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center gap-1 whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 font-label-sm text-label-sm" : "px-2.5 py-1 font-label-md text-label-md",
        shape === "pill" ? "rounded-full" : "rounded",
        variant === "soft" && softTone[tone],
        variant === "solid" && solidTone[tone],
        variant === "outline" && cn("border border-outline-variant bg-surface-container-lowest", textTone[tone]),
        className,
      )}
      {...rest}
    >
      {dot ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" /> : null}
      {icon ? <Icon name={icon} size={size === "sm" ? 14 : 16} /> : null}
      <span className="truncate">{children}</span>
    </span>
  );
}

/** Badge bilan bir xil (nomlash qulayligi uchun). */
export const Chip = Badge;
