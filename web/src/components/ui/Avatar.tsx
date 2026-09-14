import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

const sizes = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-[12px]",
  md: "h-9 w-9 text-[12px]",
  lg: "h-12 w-12 text-[15px]",
  xl: "h-16 w-16 text-[20px]",
} as const;

const tones = {
  /** Default: och koʻk fon (KANON: bolalar avatarlari "AV") */
  soft: "bg-primary-fixed text-on-primary-fixed",
  /** Header'dagi foydalanuvchi: koʻk fon, oq harf */
  solid: "bg-primary text-on-primary",
  gold: "bg-tertiary-fixed text-on-tertiary-fixed",
  neutral: "bg-surface-container text-on-surface-variant",
} as const;

export interface AvatarProps {
  name: string;
  /** Faqat kattalar (ustoz, admin) uchun. Oʻquvchi/bolalar uchun src BERILMAYDI — har doim bosh harflar. */
  src?: string | null;
  size?: keyof typeof sizes;
  tone?: keyof typeof tones;
  /** Oq halqa (surat ustida) */
  ring?: boolean;
  className?: string;
}

/** Surat yoki bosh harflar ("AV"). Surat yuklanmasa bosh harflarga qaytadi. */
export function Avatar({ name, src, size = "md", tone = "soft", ring, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const common = cn("shrink-0 rounded-full", sizes[size], ring && "ring-2 ring-surface-container-lowest", className);
  if (src && !failed) {
    return <img src={src} alt={name} onError={() => setFailed(true)} className={cn(common, "object-cover")} />;
  }
  return (
    <div
      role="img"
      aria-label={name}
      className={cn(common, "flex select-none items-center justify-center font-semibold leading-none", tones[tone])}
    >
      {initials(name)}
    </div>
  );
}
