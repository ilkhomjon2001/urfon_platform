import * as DM from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

export const menuContentClass =
  "z-[70] min-w-[200px] rounded-xl border border-outline-variant bg-surface-container-lowest p-1.5 shadow-float outline-none data-[state=open]:animate-pop-in";

const itemClass =
  "flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-body-md outline-none transition-colors " +
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

export interface MenuItem {
  label: ReactNode;
  icon?: string;
  description?: ReactNode;
  onSelect?: () => void;
  /** Ichki havola (react-router) */
  to?: string;
  tone?: "default" | "danger";
  disabled?: boolean;
  /** Tanlangan belgisi (✓) */
  checked?: boolean;
}

export function DropdownMenuItem({ label, icon, description, onSelect, to, tone = "default", disabled, checked }: MenuItem) {
  const cls = cn(
    itemClass,
    tone === "danger"
      ? "text-error data-[highlighted]:bg-error-container"
      : "text-on-surface data-[highlighted]:bg-surface-container-low",
  );
  const body = (
    <>
      {icon ? <Icon name={icon} size={20} className={tone === "danger" ? "text-error" : "text-on-surface-variant"} /> : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{label}</span>
        {description ? <span className="truncate text-body-sm text-on-surface-variant">{description}</span> : null}
      </span>
      {checked ? <Icon name="check" size={18} className="text-primary" /> : null}
    </>
  );
  if (to) {
    return (
      <DM.Item asChild disabled={disabled} onSelect={onSelect} className={cls}>
        <Link to={to}>{body}</Link>
      </DM.Item>
    );
  }
  return (
    <DM.Item disabled={disabled} onSelect={onSelect} className={cls}>
      {body}
    </DM.Item>
  );
}

export interface DropdownMenuProps {
  trigger: ReactNode;
  items?: (MenuItem | "separator")[];
  /** Menyu boshidagi kichik sarlavha */
  label?: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  children?: ReactNode;
  contentClassName?: string;
}

/**
 *  <DropdownMenu trigger={<IconButton icon="more_vert" label="Amallar" />}
 *    items={[{ label: "Tahrirlash", icon: "edit", onSelect: … }, "separator", { label: "Oʻchirish", icon: "delete", tone: "danger", onSelect: … }]} />
 */
export function DropdownMenu({ trigger, items, label, align = "end", side = "bottom", children, contentClassName }: DropdownMenuProps) {
  return (
    <DM.Root modal={false}>
      <DM.Trigger asChild>{trigger}</DM.Trigger>
      <DM.Portal>
        <DM.Content align={align} side={side} sideOffset={6} collisionPadding={8} className={cn(menuContentClass, contentClassName)}>
          {label ? (
            <DM.Label className="px-2.5 pb-1 pt-1.5 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">
              {label}
            </DM.Label>
          ) : null}
          {items?.map((it, i) =>
            it === "separator" ? (
              <DM.Separator key={`s${i}`} className="mx-1 my-1 h-px bg-outline-variant" />
            ) : (
              <DropdownMenuItem key={i} {...it} />
            ),
          )}
          {children}
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}

export const DropdownMenuSeparator = () => <DM.Separator className="mx-1 my-1 h-px bg-outline-variant" />;
