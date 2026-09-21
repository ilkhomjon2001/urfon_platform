import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Avatar, Button, DropdownMenu, Icon } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { academicYearLabel, fmtNum } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/roles";
import type { StudentInfo, User } from "@/lib/types";
import { Logo } from "./Logo";
import type { RoleNav } from "./nav";
import { NotificationsBell } from "./NotificationsBell";
import { useShellSearch } from "./ShellSearch";

const chipCls = "h-10 items-center gap-2 rounded-lg bg-surface-container-low px-3 font-label-md text-label-md text-on-surface whitespace-nowrap";

function HeaderChip({ icon, children, className }: { icon: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("hidden xl:flex", chipCls, className)}>
      <Icon name={icon} size={18} className="text-primary" />
      {children}
    </div>
  );
}

function HeaderSearch({ placeholder, className }: { placeholder: string; className?: string }) {
  const { query, setQuery } = useShellSearch();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <label className={cn("relative min-w-0 max-w-md", className)}>
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
      <input
        ref={ref}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setQuery("")}
        placeholder={placeholder}
        aria-label="Qidirish"
        className="h-10 w-full rounded-lg border border-transparent bg-surface-container-low pl-10 pr-3 font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:bg-surface-container-lowest focus:outline-none focus:ring-0 lg:pr-16"
      />
      <kbd className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded bg-surface-container-high px-1.5 py-0.5 font-label-sm text-label-sm text-on-surface-variant lg:inline">
        Ctrl K
      </kbd>
    </label>
  );
}

function StudentChips({ student }: { student: StudentInfo }) {
  const pill = "h-9 items-center gap-1.5 rounded-full px-3 font-label-md text-label-md whitespace-nowrap";
  return (
    <>
      {student.streakDays > 0 ? (
        <div className={cn("hidden md:flex", pill, "bg-warning-container text-on-warning-container")}>
          <Icon name="local_fire_department" filled size={18} />
          {student.streakDays} kunlik seriya
        </div>
      ) : null}
      <div className={cn("flex", pill, "bg-tertiary-fixed text-on-tertiary-fixed")} title="Kumush tangalar">
        <Icon name="toll" filled size={18} className="text-tertiary" />
        {fmtNum(student.coinBalance)}
        <span className="hidden sm:inline"> tanga</span>
      </div>
    </>
  );
}

function AdminCreateMenu() {
  return (
    <DropdownMenu
      label="Yangi qoʻshish"
      trigger={
        <Button icon="add" aria-label="Yangi qoʻshish" className="max-md:w-10 max-md:px-0">
          <span className="hidden md:inline">Yangi qoʻshish</span>
        </Button>
      }
      items={[
        { label: "Oʻquvchi", icon: "person_add", to: "/admin/oquvchilar?new=1" },
        { label: "Guruh", icon: "group_add", to: "/admin/guruhlar?new=1" },
        { label: "Toʻlov", icon: "add_card", to: "/admin/tolovlar?new=1" },
      ]}
    />
  );
}

function UserMenu({ user, settingsTo, onLogout }: { user: User; settingsTo: string; onLogout: () => void }) {
  const subtitle = user.title ?? ROLE_LABEL[user.role];
  // Oʻquvchi (bola) surati ishlatilmaydi — faqat bosh harflar (KANON §5).
  const photo = user.role === "STUDENT" ? null : user.avatarUrl;
  return (
    <DropdownMenu
      label={user.fullName}
      trigger={
        <button type="button" className="flex items-center gap-3 border-l border-outline-variant pl-3 text-left sm:pl-4" aria-label="Profil menyusi">
          <span className="hidden max-w-[200px] text-right leading-tight sm:block">
            <span className="block truncate font-label-lg text-label-lg text-on-surface">{user.fullName}</span>
            <span className="block truncate font-label-sm text-label-sm text-on-surface-variant">{subtitle}</span>
          </span>
          <Avatar name={user.fullName} src={photo} tone="solid" ring={!!photo} className="text-label-md" />
        </button>
      }
      items={[
        { label: "Sozlamalar", icon: "settings", to: settingsTo },
        "separator",
        { label: "Chiqish", icon: "logout", tone: "danger", onSelect: onLogout },
      ]}
    />
  );
}

/** Yuqori panel: h-16, fixed, desktop'da left-64. Tarkibi KANON §2 "Headerlar". */
export function Header({ nav, onLogout }: { nav: RoleNav; onLogout: () => void }) {
  const { user } = useAuth();
  if (!user) return null;
  const role = nav.role;
  return (
    <header
      data-urfon-shell="header"
      className="fixed left-0 right-0 top-0 z-40 flex h-16 print:hidden items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-lowest/90 px-4 backdrop-blur-xl sm:px-6 lg:left-64 lg:gap-4"
    >
      <Link to={nav.base} className="flex min-w-0 items-center gap-2.5 lg:hidden" aria-label="Bosh sahifa">
        <Logo />
        <span className="hidden font-headline-md text-headline-md font-bold tracking-tight text-navy min-[380px]:inline">URFON</span>
      </Link>
      <HeaderSearch placeholder={nav.searchPlaceholder} className="hidden flex-1 md:block" />
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {role === "ADMIN" || role === "TEACHER" ? (
          <HeaderChip icon="apartment">{user.branch?.name ?? "URFON"}</HeaderChip>
        ) : null}
        {role === "PARENT" ? <HeaderChip icon="calendar_month">{academicYearLabel()}</HeaderChip> : null}
        {role === "STUDENT" && user.student ? <StudentChips student={user.student} /> : null}
        <NotificationsBell />
        {role === "ADMIN" ? <AdminCreateMenu /> : null}
        <UserMenu user={user} settingsTo={nav.settings.to} onLogout={onLogout} />
      </div>
    </header>
  );
}
