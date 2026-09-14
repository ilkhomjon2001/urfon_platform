import * as T from "@radix-ui/react-tabs";
import { createContext, useContext, type ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

type Variant = "underline" | "segmented";
const VariantCtx = createContext<Variant>("underline");

export interface TabsProps extends ComponentProps<typeof T.Root> {
  /** underline — sahifa bo'limlari; segmented — karta ichidagi filtr ("Oylik | Haftalik") */
  variant?: Variant;
}

/**
 *  <Tabs defaultValue="all" variant="segmented">
 *    <TabsList><TabsTrigger value="all" count={18}>Barchasi</TabsTrigger>…</TabsList>
 *    <TabsContent value="all">…</TabsContent>
 *  </Tabs>
 */
export function Tabs({ variant = "underline", className, ...rest }: TabsProps) {
  return (
    <VariantCtx.Provider value={variant}>
      <T.Root className={cn("flex flex-col", className)} {...rest} />
    </VariantCtx.Provider>
  );
}

export function TabsList({ className, ...rest }: ComponentProps<typeof T.List>) {
  const v = useContext(VariantCtx);
  return (
    <T.List
      className={cn(
        "scrollbar-none max-w-full overflow-x-auto",
        v === "segmented"
          ? "inline-flex items-center gap-1 self-start rounded-lg bg-surface-container-low p-1"
          : "flex items-center gap-6 border-b border-outline-variant",
        className,
      )}
      {...rest}
    />
  );
}

export interface TabsTriggerProps extends ComponentProps<typeof T.Trigger> {
  count?: number | string;
  icon?: string;
}

export function TabsTrigger({ className, count, icon, children, ...rest }: TabsTriggerProps) {
  const v = useContext(VariantCtx);
  return (
    <T.Trigger
      className={cn(
        "group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap outline-none transition-colors disabled:opacity-50",
        v === "segmented"
          ? "h-8 rounded-md px-3 font-label-md text-label-md text-on-surface-variant hover:text-on-surface data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-xs"
          : "relative -mb-px h-11 border-b-2 border-transparent font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface data-[state=active]:border-primary data-[state=active]:text-primary",
        "focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} size={18} /> : null}
      {children}
      {count != null ? (
        <span className="min-w-5 rounded-full bg-surface-container px-1.5 text-center font-label-sm text-label-sm leading-5 text-on-surface-variant group-data-[state=active]:bg-primary group-data-[state=active]:text-on-primary">
          {count}
        </span>
      ) : null}
    </T.Trigger>
  );
}

export function TabsContent({ className, ...rest }: ComponentProps<typeof T.Content>) {
  return <T.Content className={cn("mt-4 outline-none", className)} {...rest} />;
}
