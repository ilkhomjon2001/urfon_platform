import { cn } from "@/lib/cn";

/** URFON logotipi (apply_kanon.py LOGO_SVG bilan bir xil; ranglar tokenlardan). */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8 shrink-0", className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M10.5 9v8.25a5.5 5.5 0 0 0 11 0V9"
        fill="none"
        className="stroke-white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="25" cy="7.5" r="2.5" className="fill-gold" />
    </svg>
  );
}

/** Logo + "URFON" + kabinet nomi (sidebar boshi). */
export function Brand({ cabinet, className }: { cabinet: string; className?: string }) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <Logo />
      <span className="flex flex-col leading-none">
        <span className="font-headline-md text-headline-md font-bold tracking-tight text-navy">URFON</span>
        <span className="mt-1 font-label-sm text-label-sm text-on-surface-variant">{cabinet}</span>
      </span>
    </span>
  );
}
