import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { useDocumentTitle } from "@/lib/hooks";
import { Icon } from "./Icon";

export interface Crumb {
  label: ReactNode;
  to?: string;
}

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** O'ngdagi tugmalar */
  actions?: ReactNode;
  /** [{ label: "Guruhlarim", to: "/ustoz/guruhlar" }, { label: "IELTS Foundation #3" }] */
  breadcrumbs?: Crumb[];
  /** Sarlavha yonidagi chip */
  badge?: ReactNode;
  /** Brauzer tab sarlavhasi (default: title satr bo'lsa o'zi) */
  documentTitle?: string;
  className?: string;
}

/** Har bir sahifaning boshi. document.title ni ham o'rnatadi. */
export function PageHeader({ title, subtitle, actions, breadcrumbs, badge, documentTitle, className }: PageHeaderProps) {
  useDocumentTitle(documentTitle ?? (typeof title === "string" ? title : undefined));
  const last = (breadcrumbs?.length ?? 0) - 1;
  return (
    <div className={cn("mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="min-w-0">
        {breadcrumbs?.length ? (
          <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 font-label-md text-label-md text-on-surface-variant">
            {breadcrumbs.map((c, i) => (
              <Fragment key={i}>
                {i > 0 ? <Icon name="chevron_right" size={16} className="text-outline" /> : null}
                {c.to && i < last ? (
                  <Link to={c.to} className="transition-colors hover:text-primary">
                    {c.label}
                  </Link>
                ) : (
                  <span className={i === last ? "text-primary" : undefined} aria-current={i === last ? "page" : undefined}>
                    {c.label}
                  </span>
                )}
              </Fragment>
            ))}
          </nav>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="font-headline-xl-mobile text-headline-xl-mobile tracking-tight text-on-surface sm:font-headline-xl sm:text-headline-xl">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle ? <p className="mt-1 text-body-md text-on-surface-variant">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
