import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export interface IconProps extends Omit<ComponentProps<"span">, "children"> {
  /** Material Symbols nomi: "groups", "calendar_month", "toll" … */
  name: string;
  /** To'ldirilgan variant (faol menyu, yulduzcha va h.k.) */
  filled?: boolean;
  /** px. Berilmasa 20px (className'dagi text-[18px] bilan ham o'zgartirsa bo'ladi). */
  size?: number;
}

/** Material Symbols Outlined ikonka. Dekorativ (aria-hidden); maʼno bo'lsa yoniga matn yoki aria-label qo'ying. */
export function Icon({ name, filled, size, className, style, ...rest }: IconProps) {
  return (
    <span
      aria-hidden="true"
      translate="no"
      {...rest}
      className={cn("icon", filled && "icon-filled", size == null && "text-[20px]", className)}
      style={size != null ? { fontSize: size, ...style } : style}
    >
      {name}
    </span>
  );
}
