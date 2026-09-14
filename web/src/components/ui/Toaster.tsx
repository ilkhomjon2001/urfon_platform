import { Toaster as Sonner } from "sonner";

/** Ilova ildizida bir marta. Chaqirish: import { toast } from "sonner" yoki toastError/toastSuccess (lib/query). */
export function Toaster() {
  return (
    <Sonner
      position="top-right"
      duration={4000}
      gap={10}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 font-sans shadow-float sm:w-[360px]",
          title: "font-label-lg text-label-lg text-on-surface",
          description: "mt-0.5 text-body-sm text-on-surface-variant",
          icon: "mt-0.5 shrink-0",
          success: "[&_[data-icon]]:text-success",
          error: "border-error/30 [&_[data-icon]]:text-error",
          warning: "[&_[data-icon]]:text-warning",
          info: "[&_[data-icon]]:text-primary",
          actionButton: "ml-auto rounded-lg bg-primary px-3 py-1.5 font-label-md text-label-md text-on-primary",
          cancelButton: "rounded-lg bg-surface-container px-3 py-1.5 font-label-md text-label-md text-on-surface",
        },
      }}
    />
  );
}
