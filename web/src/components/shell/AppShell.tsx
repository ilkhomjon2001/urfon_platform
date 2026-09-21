import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PageSpinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useApiQuery } from "@/lib/query";
import type { NavBadges, Role } from "@/lib/types";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { findActiveKey, NAV } from "./nav";
import { ShellSearchProvider } from "./ShellSearch";
import { Sidebar } from "./Sidebar";

/**
 * Rol kabineti qobig'i: Sidebar (lg+), Header, mobil pastki panel va sahifa (<Outlet/>).
 * Sahifa kontenti gorizontal padding bilan keladi — sahifalar o'zlari tashqi padding qo'shmaydi.
 */
export function AppShell({ role }: { role: Role }) {
  const nav = NAV[role];
  const { pathname } = useLocation();
  const activeKey = findActiveKey(nav, pathname);
  const { logout } = useAuth();
  const { data: badges } = useApiQuery<NavBadges>(["me", "nav-badges"], "/me/nav-badges", { refetchInterval: 60_000 });
  const handleLogout = () => void logout();

  return (
    <ShellSearchProvider>
      <div className="min-h-dvh bg-background">
        <Sidebar nav={nav} activeKey={activeKey} badges={badges} onLogout={handleLogout} />
        <Header nav={nav} onLogout={handleLogout} />
        <div className="lg:pl-64 print:pl-0">
          <main className="min-w-0 overflow-x-clip pb-24 pt-16 lg:pb-10 print:p-0">
            <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:py-6">
              <Suspense fallback={<PageSpinner />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
        </div>
        <MobileNav nav={nav} activeKey={activeKey} badges={badges} onLogout={handleLogout} />
      </div>
    </ShellSearchProvider>
  );
}
