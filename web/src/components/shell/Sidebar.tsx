import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { NavBadges } from "@/lib/types";
import { Brand } from "./Logo";
import { badgeText, type NavBadgeTone, type NavItem, type RoleNav } from "./nav";
import { RoleWidget } from "./RoleWidget";

const BADGE: Record<NavBadgeTone, string> = {
  muted: "bg-surface-container text-on-surface-variant",
  primary: "bg-primary text-on-primary",
  error: "bg-error-container text-on-error-container",
};

export function SidebarLink({
  item,
  active,
  badge,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  badge?: number | string | null;
  onNavigate?: () => void;
}) {
  const text = badgeText(badge);
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={item.hint}
      className={cn(
        "relative flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 font-label-lg text-label-lg transition-colors",
        active ? "bg-primary/[0.08] text-primary" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
      )}
    >
      {active ? <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-primary" /> : null}
      <span className="flex min-w-0 items-center gap-3">
        <Icon name={item.icon} filled={active} />
        <span className="truncate">{item.label}</span>
      </span>
      {text ? (
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 font-label-sm text-label-sm", BADGE[item.badgeTone ?? "primary"])}>
          {text}
        </span>
      ) : null}
    </Link>
  );
}

export function LogoutButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-label-lg text-label-lg text-error transition-colors hover:bg-error-container"
    >
      <Icon name="logout" />
      <span>Chiqish</span>
    </button>
  );
}

interface SidebarProps {
  nav: RoleNav;
  activeKey: string;
  badges?: NavBadges;
  onLogout: () => void;
}

/** Desktop (≥1024px) chap panel: w-64, fixed. */
export function Sidebar({ nav, activeKey, badges, onLogout }: SidebarProps) {
  return (
    <aside
      data-urfon-shell="sidebar"
      className="fixed inset-y-0 left-0 z-50 hidden w-64 print:!hidden flex-col border-r border-outline-variant bg-surface-container-lowest lg:flex"
    >
      <Link to={nav.base} className="flex h-16 shrink-0 items-center border-b border-outline-variant px-5">
        <Brand cabinet={nav.cabinet} />
      </Link>
      <RoleWidget role={nav.role} />
      <nav aria-label="Asosiy menyu" className="scrollbar-thin flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {nav.items.map((item) => (
          <Fragment key={item.key}>
            {item.section ? (
              <div className="mt-3 px-3 pb-1 pt-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">{item.section}</div>
            ) : item.dividerBefore ? (
              <div className="mx-3 my-2 h-px bg-outline-variant" />
            ) : null}
            <SidebarLink item={item} active={item.key === activeKey} badge={badges?.[item.key]} />
          </Fragment>
        ))}
      </nav>
      <div className="flex shrink-0 flex-col gap-1 border-t border-outline-variant px-3 py-3">
        <SidebarLink item={nav.settings} active={activeKey === nav.settings.key} />
        <LogoutButton onClick={onLogout} />
      </div>
    </aside>
  );
}
