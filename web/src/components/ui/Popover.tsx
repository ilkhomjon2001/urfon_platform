import * as P from "@radix-ui/react-popover";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  className?: string;
}

/** <Popover trigger={<Button>Filtr</Button>} className="w-72 p-4">…</Popover> */
export function Popover({ trigger, children, open, onOpenChange, align = "end", side = "bottom", sideOffset = 8, className }: PopoverProps) {
  return (
    <P.Root open={open} onOpenChange={onOpenChange}>
      <P.Trigger asChild>{trigger}</P.Trigger>
      <P.Portal>
        <P.Content
          align={align}
          side={side}
          sideOffset={sideOffset}
          collisionPadding={8}
          className={cn(
            "z-[70] rounded-xl border border-outline-variant bg-surface-container-lowest shadow-float outline-none data-[state=open]:animate-pop-in",
            className,
          )}
        >
          {children}
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}

export const PopoverClose = P.Close;
