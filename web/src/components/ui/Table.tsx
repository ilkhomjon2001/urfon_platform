import type { ComponentProps, KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeleton";

/** Jadval o'z ichida gorizontal skroll qiladi (sahifa emas). */
export function Table({ className, containerClassName, ...rest }: ComponentProps<"table"> & { containerClassName?: string }) {
  return (
    <div className={cn("w-full overflow-x-auto", containerClassName)}>
      <table className={cn("w-full border-collapse text-left", className)} {...rest} />
    </div>
  );
}

export function THead({ className, ...rest }: ComponentProps<"thead">) {
  return <thead className={cn("bg-surface-container-low", className)} {...rest} />;
}

export function TBody({ className, ...rest }: ComponentProps<"tbody">) {
  return <tbody className={cn("divide-y divide-outline-variant/70", className)} {...rest} />;
}

export function TR({ className, ...rest }: ComponentProps<"tr">) {
  return <tr className={cn("transition-colors", className)} {...rest} />;
}

export function TH({ className, ...rest }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap px-4 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant first:pl-5 last:pr-5",
        className,
      )}
      {...rest}
    />
  );
}

export function TD({ className, ...rest }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-3.5 align-middle text-body-md text-on-surface first:pl-5 last:pr-5", className)} {...rest} />;
}

const alignCls = { left: "text-left", center: "text-center", right: "text-right" } as const;
const hideCls = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell", xl: "hidden xl:table-cell" } as const;

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  align?: keyof typeof alignCls;
  /** Tor ekranda yashirish */
  hideBelow?: keyof typeof hideCls;
  className?: string;
  headerClassName?: string;
  width?: string | number;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  getRowId?: (row: T, index: number) => string;
  loading?: boolean;
  skeletonRows?: number;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  empty?: { icon?: string; title?: ReactNode; description?: ReactNode; action?: ReactNode };
  className?: string;
}

/**
 *  <DataTable
 *    rows={data?.items} loading={isLoading} getRowId={(r) => r.id} onRowClick={(r) => navigate(r.id)}
 *    columns={[{ key: "name", header: "Oʻquvchi", cell: (r) => r.fullName }, { key: "sum", header: "Summa", align: "right", cell: (r) => fmtMoney(r.amount) }]}
 *  />
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading,
  skeletonRows = 5,
  onRowClick,
  rowClassName,
  empty,
  className,
}: DataTableProps<T>) {
  const cellCls = (c: Column<T>) => cn(c.align && alignCls[c.align], c.hideBelow && hideCls[c.hideBelow], c.className);
  const onKey = (e: KeyboardEvent, row: T) => {
    if (onRowClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onRowClick(row);
    }
  };
  return (
    <Table className={className}>
      <THead>
        <tr>
          {columns.map((c) => (
            <TH
              key={c.key}
              style={c.width != null ? { width: c.width } : undefined}
              className={cn(c.align && alignCls[c.align], c.hideBelow && hideCls[c.hideBelow], c.headerClassName)}
            >
              {c.header}
            </TH>
          ))}
        </tr>
      </THead>
      <TBody>
        {loading ? (
          Array.from({ length: skeletonRows }, (_, i) => (
            <TR key={`sk-${i}`}>
              {columns.map((c) => (
                <TD key={c.key} className={cellCls(c)}>
                  <Skeleton className="h-4 w-full max-w-[160px]" />
                </TD>
              ))}
            </TR>
          ))
        ) : !rows || rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length}>
              <EmptyState
                compact
                icon={empty?.icon ?? "inbox"}
                title={empty?.title ?? "Maʼlumot yoʻq"}
                description={empty?.description}
                action={empty?.action}
              />
            </td>
          </tr>
        ) : (
          rows.map((row, i) => (
            <TR
              key={getRowId ? getRowId(row, i) : i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (e) => onKey(e, row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              className={cn(
                onRowClick && "cursor-pointer outline-none hover:bg-surface-container-low focus-visible:bg-surface-container-low",
                rowClassName?.(row),
              )}
            >
              {columns.map((c) => (
                <TD key={c.key} className={cellCls(c)}>
                  {c.cell(row, i)}
                </TD>
              ))}
            </TR>
          ))
        )}
      </TBody>
    </Table>
  );
}
