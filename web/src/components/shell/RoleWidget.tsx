import { Avatar, DropdownMenu, Icon } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { fmtPercent } from "@/lib/format";
import { useSelectedChild } from "@/lib/parent-child";
import type { Role } from "@/lib/types";

/** Sidebar'dagi rolga xos blok: ota-ona — farzand tanlagich, oʻquvchi — Level widgeti. */
export function RoleWidget({ role, className }: { role: Role; className?: string }) {
  if (role === "PARENT") return <ChildSwitcher className={className} />;
  if (role === "STUDENT") return <LevelWidget className={className} />;
  return null;
}

function ChildSwitcher({ className }: { className?: string }) {
  const { child, children, setChildId } = useSelectedChild();
  if (!child) {
    return (
      <div className={cn("mx-3 mt-4 rounded-xl bg-surface-container-low p-3 text-body-sm text-on-surface-variant", className)}>
        Farzand biriktirilmagan
      </div>
    );
  }
  return (
    <div className={cn("mx-3 mt-4 flex items-center gap-3 rounded-xl bg-surface-container-low p-3", className)}>
      <Avatar name={child.fullName} size="md" className="text-label-md" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-label-lg text-label-lg text-on-surface">{child.fullName}</div>
        <div className="truncate font-label-sm text-label-sm text-on-surface-variant">{child.groupName ?? `#${child.code}`}</div>
      </div>
      {children.length > 1 ? (
        <DropdownMenu
          label="Farzandni tanlang"
          trigger={
            <button
              type="button"
              title="Farzandni almashtirish"
              aria-label="Farzandni almashtirish"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high"
            >
              <Icon name="swap_horiz" />
            </button>
          }
          items={children.map((c) => ({
            label: c.fullName,
            description: c.groupName ?? `#${c.code}`,
            checked: c.id === child.id,
            onSelect: () => setChildId(c.id),
          }))}
        />
      ) : null}
    </div>
  );
}

function LevelWidget({ className }: { className?: string }) {
  const { user } = useAuth();
  const level = user?.student?.level;
  if (!level) return null;
  const pct = Math.min(100, Math.max(0, level.progress));
  return (
    <div className={cn("mx-3 mt-4 rounded-xl bg-surface-container-low p-3", className)}>
      <div className="flex items-center justify-between gap-2 font-label-sm text-label-sm text-on-surface-variant">
        <span className="truncate">{level.name}</span>
        <span className="text-primary">{fmtPercent(pct, 0)}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
