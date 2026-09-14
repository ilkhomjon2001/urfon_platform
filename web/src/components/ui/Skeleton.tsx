import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Yuklanish joy egallovchisi: <Skeleton className="h-4 w-32" /> */
export function Skeleton({ className, ...rest }: ComponentProps<"div">) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-surface-container-high/80", className)} {...rest} />;
}
