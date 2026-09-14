import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";
import { Spinner } from "./Spinner";

const base =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg font-label-md transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants = {
  /** Asosiy amal: koʻk, hover navy */
  primary: "bg-primary text-on-primary shadow-xs hover:bg-primary-container",
  /** Navy (mockup: "Savol yoʻllash", "Ustoz biriktirish") */
  navy: "bg-primary-container text-on-primary shadow-xs hover:bg-primary",
  /** Kulrang-koʻk fon (mockup: "Davomat koʻrish", "Materiallar") */
  secondary: "bg-surface-container text-on-surface hover:bg-surface-container-high",
  outline: "border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low",
  ghost: "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
  danger: "bg-error text-on-error shadow-xs hover:bg-red-700",
  /** Matnli havola koʻrinishi */
  link: "h-auto px-0 text-primary hover:text-primary-container hover:underline underline-offset-2",
} as const;

const sizes = {
  sm: "h-8 gap-1.5 px-3 text-label-md",
  md: "h-10 gap-2 px-4 text-label-md",
  lg: "h-12 gap-2 px-6 text-label-lg",
} as const;

const iconSizes = { sm: 16, md: 18, lg: 20 } as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

/** <Link className={buttonVariants({ variant: "outline" })}> uchun. */
export function buttonVariants(opts: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string } = {}) {
  const { variant = "primary", size = "md", block, className } = opts;
  return cn(base, sizes[size], variants[variant], variant === "link" && "h-auto px-0", block && "w-full", className);
}

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Chapdagi Material ikonka nomi */
  icon?: string;
  iconRight?: string;
  loading?: boolean;
  block?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading,
  block,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const is = iconSizes[size];
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonVariants({ variant, size, block, className })}
      {...rest}
    >
      {loading ? <Spinner size={is} /> : icon ? <Icon name={icon} size={is} /> : null}
      {children}
      {iconRight && !loading ? <Icon name={iconRight} size={is} /> : null}
    </button>
  );
}

const iconBtnSizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" } as const;

export interface IconButtonProps extends Omit<ComponentProps<"button">, "children"> {
  icon: string;
  /** Majburiy: ekran o'quvchilar va tooltip uchun */
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  filled?: boolean;
  loading?: boolean;
  /** O'ng yuqorida qizil nuqta */
  dot?: boolean;
}

/** Faqat ikonkali kvadrat tugma. */
export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  filled,
  loading,
  dot,
  className,
  type = "button",
  disabled,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      className={cn(base, variants[variant], iconBtnSizes[size], "relative p-0", className)}
      {...rest}
    >
      {loading ? <Spinner size={iconSizes[size]} /> : <Icon name={icon} filled={filled} size={iconSizes[size] + 2} />}
      {dot ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error ring-2 ring-surface-container-lowest" /> : null}
    </button>
  );
}
