import { cn } from "@/lib/cn";
import { fmtNum } from "@/lib/format";
import { IconButton } from "./Button";

function pageList(page: number, count: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const set = new Set([1, count, page - 1, page, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Berilsa chapda "124 tadan 1–20" yoziladi */
  total?: number;
  pageSize?: number;
  className?: string;
}

/** <Pagination page={page} pageCount={data.pages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} /> */
export function Pagination({ page, pageCount, onPageChange, total, pageSize, className }: PaginationProps) {
  if (pageCount <= 1 && total == null) return null;
  const from = total && pageSize ? (page - 1) * pageSize + 1 : 0;
  const to = total && pageSize ? Math.min(total, page * pageSize) : 0;
  return (
    <div className={cn("flex flex-col items-center justify-between gap-3 py-3 sm:flex-row", className)}>
      <span className="text-body-sm tabular-nums text-on-surface-variant">
        {total != null && pageSize ? (total === 0 ? "Natija yoʻq" : `${fmtNum(total)} tadan ${from}–${to} koʻrsatilmoqda`) : null}
      </span>
      {pageCount > 1 ? (
        <nav aria-label="Sahifalar" className="flex items-center gap-1">
          <IconButton icon="chevron_left" label="Oldingi sahifa" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} />
          {pageList(page, pageCount).map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="w-8 text-center text-on-surface-muted">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "h-8 min-w-8 rounded-lg px-2 font-label-md text-label-md tabular-nums transition-colors",
                  p === page ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-low",
                )}
              >
                {p}
              </button>
            ),
          )}
          <IconButton
            icon="chevron_right"
            label="Keyingi sahifa"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          />
        </nav>
      ) : null}
    </div>
  );
}
