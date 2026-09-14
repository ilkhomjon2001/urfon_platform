import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

/** Oq karta: rounded-xl, shadow-card, yupqa chegara. Ichki padding CardHeader/CardContent'da. */
export function Card({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border border-outline-variant/70 bg-surface-container-lowest shadow-card", className)}
      {...rest}
    />
  );
}

export interface CardHeaderProps extends Omit<ComponentProps<"div">, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  /** Sarlavha oldidagi Material ikonka */
  icon?: string;
  /** Sarlavha yonidagi chip (masalan <Badge>4 ta</Badge>) */
  badge?: ReactNode;
  /** O'ngdagi amal (tugma, havola) */
  action?: ReactNode;
  /** Pastida chiziq */
  divider?: boolean;
}

/**
 *  <CardHeader title="Bugungi darslar" badge={<Badge>4 ta</Badge>} action={<Button size="sm">…</Button>} />
 *  yoki children bilan erkin tarkib.
 */
export function CardHeader({ title, description, icon, badge, action, divider, className, children, ...rest }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "card-header flex items-start justify-between gap-3 px-5 pb-4 pt-5 sm:px-6 sm:pt-6",
        divider && "mb-4 border-b border-outline-variant/70",
        className,
      )}
      {...rest}
    >
      {title != null || description != null ? (
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {icon ? <Icon name={icon} size={22} className="text-primary" /> : null}
            <CardTitle>{title}</CardTitle>
            {badge}
          </div>
          {description ? <CardDescription className="mt-0.5">{description}</CardDescription> : null}
        </div>
      ) : null}
      {children}
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function CardTitle({ className, ...rest }: ComponentProps<"h2">) {
  return <h2 className={cn("font-headline-md text-headline-md text-on-surface", className)} {...rest} />;
}

export function CardDescription({ className, ...rest }: ComponentProps<"p">) {
  return <p className={cn("text-body-sm text-on-surface-variant", className)} {...rest} />;
}

/** Karta tanasi. CardHeader'dan keyin kelsa yuqori padding olib tashlanadi. */
export function CardContent({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cn("p-5 sm:p-6 [.card-header+&]:pt-0", className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center justify-between gap-3 border-t border-outline-variant/70 px-5 py-3.5 sm:px-6", className)}
      {...rest}
    />
  );
}
