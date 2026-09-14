import { cn } from "@/lib/cn";

export function Spinner({ size = 20, className, label = "Yuklanmoqda" }: { size?: number; className?: string; label?: string }) {
  return (
    <svg
      role="status"
      aria-label={label}
      className={cn("shrink-0 animate-spin", className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Sahifa ichidagi yuklanish (lazy sahifa, birinchi so'rov). */
export function PageSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-[50vh] items-center justify-center text-primary", className)}>
      <Spinner size={28} />
    </div>
  );
}

/** Butun ekran (sessiya tiklanayotganda). */
export function FullScreenSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background text-primary">
      <Spinner size={32} />
    </div>
  );
}
