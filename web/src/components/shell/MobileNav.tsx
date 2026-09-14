import * as D from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon, IconButton } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { NavBadges } from "@/lib/types";
import { badgeText, type NavItem, type RoleNav } from "./nav";
import { RoleWidget } from "./RoleWidget";
import { LogoutButton, SidebarLink } from "./Sidebar";

interface MobileNavProps {
  nav: RoleNav;
  activeKey: string;
  badges?: NavBadges;
  onLogout: () => void;
}

const tabCls = "relative flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold leading-none transition-colors";

/** Mobil (<1024px): pastki panel (4 punkt + "Yana") va qolgan punktlar uchun pastdan chiquvchi oyna. */
export function MobileNav({ nav, activeKey, badges, onLogout }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  const tabs = nav.mobileTabs.map((k) => nav.items.find((i) => i.key === k)).filter((i): i is NavItem => !!i);
  const rest = nav.items.filter((i) => !nav.mobileTabs.includes(i.key));
  const moreActive = !tabs.some((t) => t.key === activeKey);
  const moreDot = rest.some((i) => badgeText(badges?.[i.key]));

  return (
    <>
      <nav
        aria-label="Pastki menyu"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-surface-container-lowest/95 backdrop-blur-xl lg:hidden"
      >
        <div className="grid h-16 grid-cols-5">
          {tabs.map((t) => {
            const active = t.key === activeKey;
            const dot = badgeText(badges?.[t.key]);
            return (
              <Link
                key={t.key}
                to={t.to}
                aria-current={active ? "page" : undefined}
                className={cn(tabCls, active ? "text-primary" : "text-on-surface-variant")}
              >
                {active ? <span className="absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-primary" /> : null}
                <span className="relative">
                  <Icon name={t.icon} filled={active} size={24} />
                  {dot ? <span className="absolute -right-1.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-error ring-2 ring-surface-container-lowest" /> : null}
                </span>
                <span className="max-w-full truncate">{t.short ?? t.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(tabCls, moreActive ? "text-primary" : "text-on-surface-variant")}
            aria-haspopup="dialog"
          >
            {moreActive ? <span className="absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-primary" /> : null}
            <span className="relative">
              <Icon name="menu" size={24} />
              {moreDot ? <span className="absolute -right-1.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-error ring-2 ring-surface-container-lowest" /> : null}
            </span>
            <span>Yana</span>
          </button>
        </div>
      </nav>

      <D.Root open={open} onOpenChange={setOpen}>
        <D.Portal>
          <D.Overlay className="fixed inset-0 z-[60] bg-on-surface/40 data-[state=open]:animate-fade-in lg:hidden" />
          <D.Content
            aria-describedby={undefined}
            className="pb-safe fixed inset-x-0 bottom-0 z-[61] max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-surface-container-lowest shadow-modal outline-none data-[state=open]:animate-sheet-in lg:hidden"
          >
            <div className="sticky top-0 z-10 bg-surface-container-lowest px-4 pb-2 pt-2.5">
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-outline-variant" />
              <div className="flex items-center justify-between">
                <D.Title className="font-headline-sm text-headline-sm text-on-surface">{nav.cabinet}</D.Title>
                <D.Close asChild>
                  <IconButton icon="close" label="Yopish" size="sm" />
                </D.Close>
              </div>
            </div>
            <RoleWidget role={nav.role} className="mt-1" />
            <div className="flex flex-col gap-1 px-3 py-3">
              {rest.map((item) => (
                <SidebarLink key={item.key} item={item} active={item.key === activeKey} badge={badges?.[item.key]} />
              ))}
            </div>
            <div className="flex flex-col gap-1 border-t border-outline-variant px-3 py-3">
              <SidebarLink item={nav.settings} active={activeKey === nav.settings.key} />
              <LogoutButton onClick={onLogout} />
            </div>
          </D.Content>
        </D.Portal>
      </D.Root>
    </>
  );
}
