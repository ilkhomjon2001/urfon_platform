import * as D from "@radix-ui/react-dialog";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button, IconButton } from "./Button";
import { Icon } from "./Icon";

const sizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Ochuvchi element (open boshqarilmasa) */
  trigger?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Pastki tugmalar qatori */
  footer?: ReactNode;
  size?: keyof typeof sizes;
  hideClose?: boolean;
  className?: string;
  bodyClassName?: string;
}

/**
 *  <Dialog open={open} onOpenChange={setOpen} title="Yangi guruh" footer={<><Button variant="outline" onClick={…}>Bekor qilish</Button><Button>Saqlash</Button></>}>
 *    …forma…
 *  </Dialog>
 */
export function Dialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  size = "md",
  hideClose,
  className,
  bodyClassName,
}: DialogProps) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <D.Trigger asChild>{trigger}</D.Trigger> : null}
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-[60] bg-on-surface/40 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <D.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed left-1/2 top-1/2 z-[61] flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col",
            "rounded-2xl bg-surface-container-lowest shadow-modal outline-none data-[state=open]:animate-dialog-in",
            sizes[size],
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-outline-variant/70 px-5 pb-4 pt-5 sm:px-6">
            <div className="min-w-0">
              <D.Title className="font-headline-md text-headline-md text-on-surface">{title}</D.Title>
              {description ? (
                <D.Description className="mt-1 text-body-sm text-on-surface-variant">{description}</D.Description>
              ) : null}
            </div>
            {!hideClose ? (
              <D.Close asChild>
                <IconButton icon="close" label="Yopish" size="sm" className="-mr-1.5 -mt-0.5" />
              </D.Close>
            ) : null}
          </div>
          <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6", bodyClassName)}>{children}</div>
          {footer ? (
            <div className="flex flex-wrap items-center justify-end gap-2 rounded-b-2xl border-t border-outline-variant/70 bg-surface-container-low/50 px-5 py-4 sm:px-6">
              {footer}
            </div>
          ) : null}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

export const DialogClose = D.Close;

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  /** Promise qaytarsa tugma "loading" bo'ladi; xato bo'lsa dialog ochiq qoladi. */
  onConfirm: () => unknown | Promise<unknown>;
}

/** Tasdiqlash oynasi: <ConfirmDialog open={…} onOpenChange={…} title="Oʻchirilsinmi?" onConfirm={() => del.mutateAsync(id)} /> */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Tasdiqlash",
  cancelLabel = "Bekor qilish",
  tone = "danger",
  onConfirm,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  const handle = async () => {
    setPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      /* xato toast'i mutation keshida ko'rsatiladi */
    } finally {
      setPending(false);
    }
  };
  return (
    <D.Root open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-[60] bg-on-surface/40 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <D.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className="fixed left-1/2 top-1/2 z-[61] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface-container-lowest p-6 shadow-modal outline-none data-[state=open]:animate-dialog-in"
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                tone === "danger" ? "bg-error-container text-error" : "bg-primary-fixed text-primary",
              )}
            >
              <Icon name={tone === "danger" ? "warning" : "help"} size={24} />
            </div>
            <div className="min-w-0 pt-1">
              <D.Title className="font-headline-sm text-headline-sm text-on-surface">{title}</D.Title>
              {description ? (
                <D.Description className="mt-1.5 text-body-md text-on-surface-variant">{description}</D.Description>
              ) : null}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              {cancelLabel}
            </Button>
            <Button variant={tone === "danger" ? "danger" : "primary"} onClick={handle} loading={pending}>
              {confirmLabel}
            </Button>
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
