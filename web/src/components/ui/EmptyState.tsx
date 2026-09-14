import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

export interface EmptyStateProps {
  icon?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** Kichikroq (jadval, karta ichida) */
  compact?: boolean;
  className?: string;
}

/** Bo'sh holat: <EmptyState icon="assignment" title="Vazifalar yoʻq" description="…" action={<Button>…</Button>} /> */
export function EmptyState({ icon = "inbox", title, description, action, compact, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "px-4 py-8" : "px-6 py-14", className)}>
      <div
        className={cn(
          "mb-4 flex items-center justify-center rounded-full bg-surface-container-low text-primary",
          compact ? "h-12 w-12" : "h-16 w-16",
        )}
      >
        <Icon name={icon} size={compact ? 24 : 30} />
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-body-md text-on-surface-variant">{description}</p> : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
