import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

const tones = {
  primary: { box: "border-primary-fixed bg-primary-light", icon: "text-primary", def: "info" },
  success: { box: "border-success/20 bg-success-container/60", icon: "text-success", def: "check_circle" },
  warning: { box: "border-warning/25 bg-warning-container/70", icon: "text-warning", def: "warning" },
  danger: { box: "border-error/20 bg-error-container/70", icon: "text-error", def: "error" },
} as const;

export interface AlertProps {
  tone?: keyof typeof tones;
  icon?: string;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Sahifa ichidagi ogohlantirish/izoh bloki. */
export function Alert({ tone = "primary", icon, title, children, action, className }: AlertProps) {
  const t = tones[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center", t.box, className)}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon name={icon ?? t.def} size={22} className={cn("mt-px", t.icon)} />
        <div className="min-w-0">
          {title ? <div className="font-label-lg text-label-lg text-on-surface">{title}</div> : null}
          {children ? <div className={cn("text-body-md text-on-surface-variant", title && "mt-0.5")}>{children}</div> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
