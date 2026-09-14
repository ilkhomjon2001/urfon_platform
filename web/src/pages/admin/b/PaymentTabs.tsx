// Toʻlovlar sahifasi tablari: «Qarzdorlar va balans», «Oylik hisoblar», «Tushumlar» (kassa daftari).
// Filtrlar URL'da: umumiy q/group/m; balans — f, sort, bp; hisoblar — p, s (eski havolalar: status), page; tushumlar — range, from, to, rev, tp.
import type { ReactNode } from "react";
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  DataTable,
  DropdownMenu,
  Icon,
  IconButton,
  Input,
  Pagination,
  SearchInput,
  Select,
  StatCard,
  Tabs,
  TabsList,
  TabsTrigger,
  type Column,
  type MenuItem,
} from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtDateShort, fmtMoney, fmtNum, fmtPercent, fmtPhone, fmtTime, todayYmd, toYmd, tzParts } from "@/lib/format";
import { useDebouncedValue, useSearchParamState } from "@/lib/hooks";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { AllocationChips, BalanceValue } from "./PaymentLedger";
import { AmountCell, groupReceipts, isOpenCharge, isPartial, MethodBadge, type PickedStudent, type ReceiptTarget, StatusCell, usePageParam, useParamPatch } from "./PaymentParts";
import { ExportButton, METHOD, periodLabel, PeriodSelect, relationOf, TelegramDot, useFormOptions } from "./shared";
import type { BalanceFilter, BalanceList, BalanceRow, PaymentList, PaymentRow, PaymentTx, TxList } from "./types";

const PAGE_SIZE = 20;
const STATUSES = ["PAID", "PENDING", "OVERDUE", "CANCELLED"];

const shortName = (full: string | null) => {
  if (!full) return null;
  const [a, ...rest] = full.split(/\s+/);
  return rest.length ? `${a[0]}. ${rest.join(" ")}` : full;
};

function TableFooter({ d, onPage }: { d: { page: number; pageSize: number; total: number; pages: number } | undefined; onPage: (p: number) => void }) {
  if (!d || d.total <= 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/60 px-5 py-3">
      <span className="font-label-sm text-label-sm text-on-surface-variant">
        Koʻrsatilmoqda: {fmtNum((d.page - 1) * d.pageSize + 1)}–{fmtNum(Math.min(d.page * d.pageSize, d.total))} dan {fmtNum(d.total)} ta yozuv
      </span>
      <Pagination page={d.page} pageCount={d.pages} onPageChange={onPage} />
    </div>
  );
}

function Panel({ toolbar, children }: { toolbar: ReactNode; children: ReactNode }) {
  return (
    // relative — jadval ichidagi sr-only (absolute) elementlar ham shu yerda kesiladi, sahifani kengaytirmaydi
    <div className="relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-outline-variant/70 bg-surface-container-lowest shadow-card">
      <div className="flex flex-col gap-3 border-b border-outline-variant/60 p-4">{toolbar}</div>
      {children}
    </div>
  );
}

// ─────────── Filtr hooklari (sahifa sarlavhasidagi eksport ham ishlatadi) ───────────

export function useChargeFilters() {
  const [q, setQ] = useSearchParamState("q");
  const [groupId, setGroupId] = useSearchParamState("group");
  const [method, setMethod] = useSearchParamState("m");
  const [s] = useSearchParamState("s", "all");
  const [legacy] = useSearchParamState("status");
  const patch = useParamPatch();
  const status = s !== "all" ? s : STATUSES.includes(legacy) ? legacy : "all";
  const setStatus = (v: string | null) => patch({ s: !v || v === "all" ? null : v, status: null });
  const dq = useDebouncedValue(q, 300);
  const params = { q: dq || undefined, groupId: groupId || undefined, method: method || undefined, status: status === "all" ? undefined : status };
  return { q, setQ, dq, groupId, setGroupId, method, setMethod, status, setStatus, params, patch };
}

export type RangePreset = "today" | "week" | "month" | "custom";

export function rangeOf(preset: string, from: string, to: string) {
  const today = todayYmd();
  if (preset === "today") return { from: today, to: today };
  if (preset === "week") return { from: toYmd(Date.now() - (tzParts(new Date()).weekday - 1) * 86_400_000), to: today };
  if (preset === "custom") return { from, to };
  return { from: `${today.slice(0, 7)}-01`, to: today };
}

export function useTxFilters() {
  const [range] = useSearchParamState("range", "month");
  const [from, setFrom] = useSearchParamState("from");
  const [to, setTo] = useSearchParamState("to");
  const [method, setMethod] = useSearchParamState("m");
  const [q, setQ] = useSearchParamState("q");
  const [rev, setRev] = useSearchParamState("rev");
  const patch = useParamPatch();
  const dq = useDebouncedValue(q, 300);
  const r = rangeOf(range, from, to);
  const setRange = (v: string) => (v === "custom" ? patch({ range: "custom", from: r.from, to: r.to }) : patch({ range: v === "month" ? null : v, from: null, to: null }));
  const params = { from: r.from || undefined, to: r.to || undefined, method: method || undefined, q: dq || undefined, reversed: rev === "1" ? undefined : ("exclude" as const) };
  const label =
    range === "today"
      ? "Bugun"
      : range === "week"
        ? "Shu hafta"
        : range === "custom"
          ? r.from || r.to
            ? `${r.from ? fmtDateShort(r.from) : "…"} – ${r.to ? fmtDateShort(r.to) : "…"}`
            : "Barcha vaqt"
          : "Shu oy";
  return { range, setRange, from, setFrom, to, setTo, method, setMethod, q, setQ, rev, setRev, params, label, patch };
}

// ─────────── Qarzdorlar va balans ───────────

const FILTERS: { value: BalanceFilter; label: string }[] = [
  { value: "all", label: "Hammasi" },
  { value: "debtors", label: "Qarzdorlar" },
  { value: "overdue", label: "Muddati oʻtgan" },
  { value: "partial", label: "Qisman toʻlagan" },
  { value: "advance", label: "Avansi bor" },
  { value: "clear", label: "Toʻlagan" },
  { value: "none", label: "Hisobsiz" },
];

const EMPTY: Record<BalanceFilter, string> = {
  all: "Oʻquvchilar yoʻq",
  debtors: "Qarzdor oʻquvchi yoʻq",
  overdue: "Muddati oʻtgan qarz yoʻq",
  partial: "Qisman toʻlaganlar yoʻq",
  advance: "Avansi bor oʻquvchi yoʻq",
  clear: "Toʻliq toʻlaganlar yoʻq",
  none: "Hisobsiz oʻquvchi yoʻq",
};

export function BalancesTab({ onReceive, onLedger }: { onReceive: (s: PickedStudent) => void; onLedger: (studentId: string) => void }) {
  const [filter, setFilter] = useSearchParamState("f", "all");
  const [sort, setSort] = useSearchParamState("sort", "debt");
  const [q, setQ] = useSearchParamState("q");
  const [groupId, setGroupId] = useSearchParamState("group");
  const patch = useParamPatch();
  const dq = useDebouncedValue(q, 300);
  const [page, setPage] = usePageParam("bp", `${filter}|${sort}|${dq}|${groupId}`);
  const opts = useFormOptions();
  const list = useApiQuery<BalanceList>(["admin", "payments", "balances"], "/admin/payments/balances", {
    params: { filter, sort, q: dq || undefined, groupId: groupId || undefined, page, pageSize: PAGE_SIZE },
    placeholderData: (p) => p,
  });
  const d = list.data;
  const c = d?.counts;
  const t = d?.totals;
  const hasFilters = !!(q || groupId || filter !== "all");
  const fKey = (FILTERS.some((f) => f.value === filter) ? filter : "all") as BalanceFilter;

  const columns: Column<BalanceRow>[] = [
    {
      key: "student",
      header: "Oʻquvchi",
      cell: (r) => (
        <div className="flex min-w-0 max-w-[190px] items-center gap-3 md:min-w-[170px] md:max-w-none">
          <Avatar name={r.student.fullName} size="md" tone={r.overdue > 0 ? "solid" : "soft"} className={r.overdue > 0 ? "bg-error text-on-error" : undefined} />
          <div className="flex min-w-0 flex-col">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-label-md text-label-md font-bold text-on-surface">{r.student.fullName}</span>
              {r.student.status === "LEFT" ? <Badge tone="neutral">Ketgan</Badge> : r.student.status === "ACADEMIC_LEAVE" ? <Badge tone="gold">Taʼtilda</Badge> : null}
            </span>
            <span className={cn("truncate font-label-sm text-label-sm", r.overdue > 0 ? "text-error" : "text-on-surface-variant")}>
              #{r.student.code}
              <span className="md:hidden">{r.groups[0] ? ` · ${r.groups[0].name}` : ""}</span>
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "group",
      header: "Guruh",
      hideBelow: "md",
      className: "px-3",
      headerClassName: "px-3",
      cell: (r) => {
        if (!r.groups.length) return <span className="text-body-sm text-on-surface-muted">Guruhsiz</span>;
        const active = r.groups.filter((g) => !g.waiting);
        const fee = active.reduce((s, g) => s + g.monthlyFee, 0);
        return (
          <div className="flex max-w-[220px] flex-col" title={r.groups.map((g) => `${g.name}${g.waiting ? " (kutish roʻyxati)" : ""}`).join("\n")}>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-label-md text-label-md text-on-surface">{r.groups[0].name}</span>
              {r.groups.length > 1 ? <Badge tone="neutral">+{r.groups.length - 1}</Badge> : null}
            </span>
            {active.length ? (
              <span className="whitespace-nowrap text-body-sm tabular-nums text-on-surface-variant">{fmtNum(fee)} soʻm / oy</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-body-sm text-warning">
                <Icon name="hourglass_top" size={14} /> Kutish roʻyxati
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "parent",
      header: "Ota-ona",
      hideBelow: "lg",
      className: "px-3",
      headerClassName: "px-3",
      cell: (r) => {
        const p = r.parents[0];
        if (!p) return <span className="text-body-sm text-on-surface-muted">Bogʻlanmagan</span>;
        return (
          <div className="flex items-center gap-2">
            <TelegramDot linked={p.telegramLinked} />
            <div className="flex min-w-0 flex-col">
              <span className="whitespace-nowrap text-body-sm tabular-nums text-on-surface">{p.phone ? fmtPhone(p.phone) : "—"}</span>
              <span className="max-w-[160px] truncate text-body-sm text-on-surface-variant">
                {p.fullName} · {relationOf(p.relation)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "charged",
      header: (
        <>
          Hisoblangan /<br />
          toʻlangan
        </>
      ),
      hideBelow: "xl",
      align: "right",
      className: "px-3",
      headerClassName: "px-3",
      cell: (r) => {
        // api `paid` faqat tushumlarni sanaydi; balans modelidan oldin (tushumsiz) yopilgan hisoblar ham chiqishi uchun:
        // toʻlangan = yopilgan qism + avans (yangi yozuvlarda `paid` bilan teng)
        const paid = Math.max(r.paid, r.charged - r.outstanding + r.advance);
        if (!r.charged && !paid) return <span className="text-on-surface-muted">—</span>;
        return (
          <div className="flex flex-col items-end whitespace-nowrap tabular-nums">
            <span className="text-on-surface">{fmtNum(r.charged)}</span>
            <span className={cn("text-body-sm", paid ? "text-success" : "text-on-surface-variant")}>{paid ? `${fmtNum(paid)} toʻlangan` : "toʻlanmagan"}</span>
          </div>
        );
      },
    },
    {
      key: "balance",
      header: "Qarz / Avans",
      align: "right",
      className: "px-3",
      headerClassName: "px-3",
      cell: (r) => <BalanceValue outstanding={r.outstanding} advance={r.advance} overdue={r.overdue} />,
    },
    {
      key: "last",
      header: "Oxirgi toʻlov",
      hideBelow: "lg",
      className: "px-3",
      headerClassName: "px-3",
      cell: (r) =>
        r.lastPaidAt ? (
          <span className="whitespace-nowrap text-body-sm tabular-nums text-on-surface-variant">
            {fmtDateShort(r.lastPaidAt)},<br />
            {fmtTime(r.lastPaidAt)}
          </span>
        ) : (
          <span className="text-on-surface-muted">—</span>
        ),
    },
    {
      key: "act",
      header: <span className="sr-only">Amal</span>,
      align: "right",
      // mobilda qator bosilsa daftar ochiladi — u yerda «Toʻlov qabul qilish» bor
      hideBelow: "sm",
      cell: (r) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant={r.overdue > 0 ? "danger" : r.outstanding > 0 ? "primary" : "outline"}
            icon="payments"
            aria-label={`${r.student.fullName}: toʻlov qabul qilish`}
            title="Toʻlov qabul qilish"
            onClick={() => onReceive({ id: r.student.id, fullName: r.student.fullName, code: r.student.code })}
          >
            {/* tor desktopda faqat ikonka — jadval karta eniga sigʻadi */}
            <span className="hidden min-[1600px]:inline">Qabul qilish</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Jami qarzdorlik"
          value={<span className={t?.outstanding ? "text-error" : undefined}>{fmtNum(t?.outstanding)}</span>}
          unit="soʻm"
          icon="account_balance_wallet"
          loading={list.isLoading}
          onClick={() => setFilter("debtors")}
          sub={c ? `${fmtNum(c.debtors)} nafar oʻquvchining ochiq hisoblari` : undefined}
        />
        <StatCard
          label="Muddati oʻtgan"
          value={<span className={t?.overdue ? "text-error" : undefined}>{fmtNum(t?.overdue)}</span>}
          unit="soʻm"
          icon="warning"
          iconTone="danger"
          loading={list.isLoading}
          onClick={() => setFilter("overdue")}
          sub={c ? `${fmtNum(c.overdue)} nafar · muddat har oy 5-sanada` : undefined}
        />
        <StatCard
          label="Avanslar"
          value={<span className={t?.advance ? "text-success" : undefined}>{fmtNum(t?.advance)}</span>}
          unit="soʻm"
          icon="savings"
          iconTone="success"
          loading={list.isLoading}
          onClick={() => setFilter("advance")}
          sub={c ? `${fmtNum(c.advance)} nafar oldindan toʻlagan` : undefined}
        />
        <StatCard
          label="Qarzdorlar soni"
          value={fmtNum(t?.debtors)}
          unit="nafar"
          icon="group"
          iconTone="gold"
          loading={list.isLoading}
          onClick={() => setFilter("partial")}
          sub={c ? `${fmtNum(c.partial)} nafari qisman toʻlagan` : undefined}
        />
      </div>

      <Panel
        toolbar={
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-12">
              <SearchInput value={q} onValueChange={(v) => setQ(v)} placeholder="Oʻquvchi, ID, ota-ona ismi yoki telefoni…" wrapperClassName="sm:col-span-2 xl:col-span-6" />
              <Select
                aria-label="Guruh"
                wrapperClassName="xl:col-span-3"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                options={[{ value: "", label: "Barcha guruhlar" }, ...(opts.data?.groups ?? []).map((g) => ({ value: g.id, label: g.name }))]}
              />
              <Select
                aria-label="Saralash"
                wrapperClassName="xl:col-span-3"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                options={[
                  { value: "debt", label: "Avval eng katta qarz" },
                  { value: "name", label: "Ism boʻyicha (A–Z)" },
                  { value: "lastPaid", label: "Oxirgi toʻlov boʻyicha" },
                ]}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Tabs value={fKey} onValueChange={setFilter} variant="segmented" className="max-w-full">
                <TabsList>
                  {FILTERS.map((f) => (
                    <TabsTrigger key={f.value} value={f.value} count={c ? fmtNum(c[f.value]) : undefined} className={f.value === "overdue" ? "data-[state=active]:text-error" : undefined}>
                      {f.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              {hasFilters ? (
                <Button variant="link" size="sm" icon="filter_alt_off" onClick={() => patch({ q: null, group: null, f: null })}>
                  Filtrlarni tozalash
                </Button>
              ) : null}
            </div>
          </>
        }
      >
        <DataTable
          rows={d?.items}
          loading={list.isLoading}
          skeletonRows={8}
          getRowId={(r) => r.student.id}
          columns={columns}
          onRowClick={(r) => onLedger(r.student.id)}
          rowClassName={(r) => (r.overdue > 0 ? "bg-error-container/20" : undefined)}
          empty={{
            icon: fKey === "debtors" || fKey === "overdue" ? "task_alt" : "person_search",
            title: q || groupId ? "Hech narsa topilmadi" : EMPTY[fKey],
            description: q || groupId ? "Qidiruv yoki guruh filtrini oʻzgartirib koʻring" : fKey === "none" ? "Hisobsiz — hali oylik hisob yozilmagan va toʻlov qilmagan oʻquvchilar" : undefined,
          }}
        />
        <TableFooter d={d} onPage={setPage} />
      </Panel>
    </>
  );
}

// ─────────── Oylik hisoblar ───────────

export function ChargesTab({
  period,
  setPeriod,
  periods,
  loadingPeriods,
  onPay,
  onCancel,
  onReceipt,
  onLedger,
  onGenerate,
  onNewCharge,
}: {
  period: string;
  setPeriod: (p: string) => void;
  periods: string[];
  loadingPeriods: boolean;
  onPay: (r: PaymentRow) => void;
  onCancel: (r: PaymentRow) => void;
  onReceipt: (t: ReceiptTarget) => void;
  onLedger: (studentId: string) => void;
  onGenerate: () => void;
  onNewCharge: () => void;
}) {
  const f = useChargeFilters();
  const [page, setPage] = usePageParam("page", `${period}|${f.status}|${f.dq}|${f.groupId}|${f.method}`);
  const opts = useFormOptions();
  const list = useApiQuery<PaymentList>(["admin", "payments", "list"], period ? "/admin/payments" : null, {
    params: { period, ...f.params, page, pageSize: PAGE_SIZE },
    placeholderData: (p) => p,
  });
  const remind = useApiMutation((id: string) => api.post<{ sent: number }>(`/admin/payments/${id}/remind`), {
    invalidate: [["admin", "audit"]],
    success: (r) => `Eslatma ${fmtNum(r.sent)} ta ota-onaga yuborildi`,
  });
  const t = list.data?.totals;
  const d = list.data;
  const hasFilters = !!(f.q || f.groupId || f.method || f.status !== "all");
  const tabCount = (n: number | undefined) => (t ? fmtNum(n) : undefined);

  const columns: Column<PaymentRow>[] = [
    {
      key: "student",
      header: "Oʻquvchi",
      cell: (r) => (
        <div className="flex min-w-[160px] items-center gap-3">
          <Avatar name={r.student.fullName} size="md" tone={r.status === "OVERDUE" ? "solid" : "soft"} className={r.status === "OVERDUE" ? "bg-error text-on-error" : undefined} />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-label-md text-label-md font-bold text-on-surface">{r.student.fullName}</span>
            <span className={`font-label-sm text-label-sm ${r.status === "OVERDUE" ? "text-error" : "text-on-surface-variant"}`}>#{r.student.code}</span>
          </div>
        </div>
      ),
    },
    {
      key: "group",
      header: "Guruh",
      hideBelow: "md",
      className: "px-3",
      headerClassName: "px-3",
      cell: (r) =>
        r.group ? (
          <div className="flex max-w-[200px] flex-col">
            <span className="font-label-md text-label-md text-on-surface">{r.group.name}</span>
            <span className="text-body-sm text-on-surface-variant">{[r.group.room, shortName(r.group.teacher)].filter(Boolean).join(" · ")}</span>
          </div>
        ) : (
          <span className="text-body-sm text-on-surface-variant">Qoʻshimcha{r.note ? ` · ${r.note.split(" · ")[0]}` : ""}</span>
        ),
    },
    { key: "amount", header: "Summa", className: "px-3", headerClassName: "px-3", cell: (r) => <AmountCell p={r} /> },
    {
      key: "method",
      header: "Toʻlov usuli",
      hideBelow: "lg",
      className: "px-3",
      headerClassName: "px-3",
      cell: (r) => (r.method && r.paidAmount > 0 ? <MethodBadge method={r.method} /> : <span className="text-on-surface-muted">—</span>),
    },
    { key: "status", header: "Holat", className: "px-3", headerClassName: "px-3", cell: (r) => <StatusCell p={r} /> },
    {
      key: "date",
      header: "Sana / vaqt",
      hideBelow: "xl",
      className: "px-3",
      headerClassName: "px-3",
      cell: (r) =>
        r.paidAt ? (
          <span className="whitespace-nowrap text-body-sm tabular-nums text-on-surface-variant">
            {fmtDateShort(r.paidAt)},<br />
            {fmtTime(r.paidAt)}
          </span>
        ) : (
          <span className="text-on-surface-muted">—</span>
        ),
    },
    {
      key: "act",
      header: "Amallar",
      align: "right",
      cell: (r) => {
        const open = isOpenCharge(r);
        const rc = groupReceipts(r.receipts ?? []);
        const items: (MenuItem | "separator")[] = [
          ...rc.map((x) => ({
            label: `Kvitansiya ${x.receiptNo}`,
            icon: "receipt_long",
            description: `${fmtMoney(x.amount)} · ${fmtDateShort(x.paidAt)}`,
            onSelect: () => onReceipt({ transactionId: x.transactionId }),
          })),
          ...(!rc.length && r.receiptNo && r.status === "PAID" ? [{ label: "Kvitansiyani ochish", icon: "receipt_long", onSelect: () => onReceipt({ paymentId: r.id }) }] : []),
          ...(open
            ? [
                { label: isPartial(r) ? "Qoldiqni qabul qilish" : "Qabul qilish", icon: "payments", onSelect: () => onPay(r) },
                {
                  label: r.status === "OVERDUE" ? "Qarzdorlik eslatmasi" : "Eslatma yuborish",
                  icon: "notifications_active",
                  onSelect: () => remind.mutate(r.id),
                  description: "Ota-onaga Telegram/kabinet orqali",
                },
              ]
            : []),
          { label: "Oʻquvchi toʻlov daftari", icon: "account_balance_wallet", onSelect: () => onLedger(r.student.id) },
          ...(r.status !== "CANCELLED" ? ["separator" as const, { label: "Hisobni bekor qilish", icon: "block", tone: "danger" as const, onSelect: () => onCancel(r) }] : []),
        ];
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {r.status === "PAID" ? (
              <IconButton
                icon="receipt_long"
                label="Kvitansiya"
                size="sm"
                variant="ghost"
                className="text-primary"
                onClick={() => onReceipt(rc.length ? { transactionId: rc[rc.length - 1].transactionId } : { paymentId: r.id })}
              />
            ) : open ? (
              <Button size="sm" variant={r.status === "OVERDUE" ? "danger" : "primary"} icon="payments" aria-label="Qabul qilish" onClick={() => onPay(r)}>
                <span className="hidden sm:inline">Qabul qilish</span>
              </Button>
            ) : null}
            <DropdownMenu trigger={<IconButton icon="more_vert" label="Amallar" size="sm" variant="ghost" />} items={items} />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Yigʻilgan toʻlovlar"
          value={fmtNum(t?.collected)}
          unit="soʻm"
          icon="account_balance_wallet"
          loading={list.isLoading}
          sub={
            t ? (
              <span className="flex items-center gap-1.5">
                <Badge tone="primary" size="sm">
                  {fmtPercent(t.collectedPercent ?? 0)} reja
                </Badge>
                {fmtNum(t.students.PAID)} nafar toʻliq toʻlagan
              </span>
            ) : undefined
          }
        />
        <StatCard
          label="Kutilayotgan tushum"
          value={fmtNum(t?.pending)}
          unit="soʻm"
          icon="pending_actions"
          iconTone="gold"
          loading={list.isLoading}
          onClick={() => f.setStatus("PENDING")}
          sub={
            t ? (
              <span className="flex items-center gap-1.5">
                <Badge tone="gold" size="sm">
                  {fmtNum(t.students.PENDING)} ta oʻquvchi
                </Badge>
                {t.partial ? `${fmtNum(t.partial)} ta hisob qisman toʻlangan` : "Muddati hali oʻtmagan"}
              </span>
            ) : undefined
          }
        />
        <StatCard
          label="Muddati oʻtgan (Qarzdorlik)"
          value={<span className="text-error">{fmtNum(t?.overdue)}</span>}
          unit="soʻm"
          icon="warning"
          iconTone="danger"
          loading={list.isLoading}
          onClick={() => f.setStatus("OVERDUE")}
          sub={
            t ? (
              <span className="flex items-center gap-1.5">
                <Badge tone="danger" size="sm">
                  {fmtNum(t.counts.OVERDUE)} ta kechikish
                </Badge>
                Roʻyxatni koʻrish
              </span>
            ) : undefined
          }
        />
        <StatCard label="Oʻrtacha abonent toʻlovi" value={fmtNum(t?.avgAmount)} unit="soʻm / oy" icon="receipt" iconTone="neutral" loading={list.isLoading} sub="Barcha yoʻnalishlar boʻyicha" />
      </div>

      <Panel
        toolbar={
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-12">
              <SearchInput value={f.q} onValueChange={(v) => f.setQ(v)} placeholder="Oʻquvchi ismi, ID, guruh yoki chek raqami…" wrapperClassName="sm:col-span-2 xl:col-span-5" />
              <PeriodSelect value={period} onChange={setPeriod} periods={periods} className="xl:col-span-2" />
              <Select
                aria-label="Guruh"
                wrapperClassName="xl:col-span-3"
                value={f.groupId}
                onChange={(e) => f.setGroupId(e.target.value)}
                options={[{ value: "", label: "Barcha guruhlar" }, ...(opts.data?.groups ?? []).map((g) => ({ value: g.id, label: g.name }))]}
              />
              <Select
                aria-label="Toʻlov usuli"
                wrapperClassName="xl:col-span-2"
                value={f.method}
                onChange={(e) => f.setMethod(e.target.value)}
                options={[{ value: "", label: "Barcha toʻlov turlari" }, ...Object.entries(METHOD).map(([k, v]) => ({ value: k, label: v.label }))]}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Tabs value={f.status} onValueChange={f.setStatus} variant="segmented" className="max-w-full">
                <TabsList>
                  <TabsTrigger value="all" count={tabCount(t?.counts.ALL)}>
                    Barchasi
                  </TabsTrigger>
                  <TabsTrigger value="PAID" count={tabCount(t?.counts.PAID)}>
                    Toʻlangan
                  </TabsTrigger>
                  <TabsTrigger value="PENDING" count={tabCount(t?.counts.PENDING)}>
                    Kutilmoqda
                  </TabsTrigger>
                  <TabsTrigger value="OVERDUE" count={tabCount(t?.counts.OVERDUE)} className="data-[state=active]:text-error">
                    Muddati oʻtgan
                  </TabsTrigger>
                  {t?.counts.CANCELLED ? (
                    <TabsTrigger value="CANCELLED" count={tabCount(t.counts.CANCELLED)}>
                      Bekor qilingan
                    </TabsTrigger>
                  ) : null}
                </TabsList>
              </Tabs>
              <div className="flex flex-wrap items-center gap-2">
                {hasFilters ? (
                  <Button variant="link" size="sm" icon="filter_alt_off" onClick={() => f.patch({ q: null, group: null, m: null, s: null, status: null })}>
                    Filtrlarni tozalash
                  </Button>
                ) : null}
                <Button variant="outline" size="sm" icon="add" onClick={onNewCharge} disabled={!period}>
                  Qoʻlda hisob
                </Button>
              </div>
            </div>
          </>
        }
      >
        <DataTable
          rows={d?.items}
          loading={list.isLoading || loadingPeriods}
          skeletonRows={8}
          getRowId={(r) => r.id}
          columns={columns}
          onRowClick={(r) => onLedger(r.student.id)}
          rowClassName={(r) => (r.status === "OVERDUE" ? "bg-error-container/20" : undefined)}
          empty={{
            icon: "payments",
            title: hasFilters ? "Hech narsa topilmadi" : `${period ? periodLabel(period) : "Bu davr"} uchun hisoblar yoʻq`,
            description: hasFilters ? "Filtrlarni oʻzgartirib koʻring" : "Hisoblar har oy 1-sanada avtomatik yoziladi. Hozir yaratish uchun «Oylik hisob-kitob»ni bosing.",
            action: hasFilters ? undefined : (
              <Button size="sm" icon="receipt_long" onClick={onGenerate}>
                Oylik hisob-kitob
              </Button>
            ),
          }}
        />
        <TableFooter d={d} onPage={setPage} />
      </Panel>
    </>
  );
}

// ─────────── Tushumlar (kassa daftari) ───────────

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "today", label: "Bugun" },
  { value: "week", label: "Shu hafta" },
  { value: "month", label: "Shu oy" },
  { value: "custom", label: "Oraliq" },
];

export function TransactionsTab({ onReceipt, onReverse, onLedger }: { onReceipt: (t: ReceiptTarget) => void; onReverse: (tx: PaymentTx) => void; onLedger: (studentId: string) => void }) {
  const f = useTxFilters();
  const [page, setPage] = usePageParam("tp", JSON.stringify(f.params));
  const list = useApiQuery<TxList>(["admin", "payments", "tx"], "/admin/payments/transactions", {
    params: { ...f.params, page, pageSize: PAGE_SIZE },
    placeholderData: (p) => p,
  });
  const d = list.data;
  const t = d?.totals;
  const today = todayYmd();

  const columns: Column<PaymentTx>[] = [
    {
      key: "receipt",
      header: "Kvitansiya",
      cell: (x) => (
        <div className="flex min-w-[140px] flex-col">
          <span className={cn("whitespace-nowrap font-mono text-body-md font-semibold", x.reversed ? "text-on-surface-muted line-through" : "text-on-surface")}>{x.receiptNo}</span>
          <span className="whitespace-nowrap text-body-sm tabular-nums text-on-surface-variant">
            {fmtDateShort(x.paidAt)} {fmtTime(x.paidAt)}
          </span>
          <span className="max-w-[170px] truncate text-body-sm text-on-surface sm:hidden">{x.student.fullName}</span>
        </div>
      ),
    },
    {
      key: "student",
      header: "Oʻquvchi",
      hideBelow: "sm",
      className: "px-3",
      headerClassName: "px-3",
      cell: (x) => (
        <div className="flex min-w-[150px] flex-col">
          <span className="truncate font-label-md text-label-md font-bold text-on-surface">{x.student.fullName}</span>
          {x.reversed ? (
            <span className="max-w-[240px] truncate text-body-sm text-error" title={x.reversed.reason ?? undefined}>
              Bekor qilingan · {x.reversed.reason ?? "—"}
            </span>
          ) : (
            <span className="font-label-sm text-label-sm text-on-surface-variant">#{x.student.code}</span>
          )}
        </div>
      ),
    },
    {
      key: "amount",
      header: "Summa",
      align: "right",
      className: "px-3",
      headerClassName: "px-3",
      cell: (x) => (
        <span className={cn("whitespace-nowrap font-headline-sm text-headline-sm tabular-nums", x.reversed ? "text-on-surface-muted line-through" : "text-on-surface")}>
          {fmtNum(x.amount)} <span className="text-body-sm font-normal">soʻm</span>
        </span>
      ),
    },
    { key: "method", header: "Usul", hideBelow: "md", className: "px-3", headerClassName: "px-3", cell: (x) => <MethodBadge method={x.method} muted={!!x.reversed} /> },
    { key: "alloc", header: "Qaysi oylar", hideBelow: "lg", className: "px-3", headerClassName: "px-3", cell: (x) => <AllocationChips tx={x} compact /> },
    {
      key: "by",
      header: "Qabul qildi",
      hideBelow: "xl",
      className: "px-3",
      headerClassName: "px-3",
      cell: (x) => <span className="whitespace-nowrap text-body-sm text-on-surface-variant">{shortName(x.createdBy) ?? "—"}</span>,
    },
    {
      key: "act",
      header: <span className="sr-only">Amallar</span>,
      align: "right",
      cell: (x) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <IconButton icon="receipt_long" label="Kvitansiya" size="sm" variant="ghost" className="text-primary" onClick={() => onReceipt({ transactionId: x.id })} />
          <DropdownMenu
            trigger={<IconButton icon="more_vert" label="Amallar" size="sm" variant="ghost" />}
            items={[
              { label: "Kvitansiyani ochish", icon: "receipt_long", onSelect: () => onReceipt({ transactionId: x.id }) },
              { label: "Oʻquvchi toʻlov daftari", icon: "account_balance_wallet", onSelect: () => onLedger(x.student.id) },
              "separator",
              {
                label: x.reversed ? "Allaqachon bekor qilingan" : "Bekor qilish (storno)",
                icon: "undo",
                tone: "danger",
                disabled: !!x.reversed,
                description: x.reversed ? undefined : "Yopgan oylari qayta ochiladi",
                onSelect: () => onReverse(x),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <Panel
      toolbar={
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={f.range} onValueChange={f.setRange} variant="segmented" className="max-w-full">
              <TabsList>
                {PRESETS.map((p) => (
                  <TabsTrigger key={p.value} value={p.value}>
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {f.range === "custom" ? (
              <div className="flex flex-wrap items-center gap-2">
                <Input type="date" size="sm" aria-label="Boshlanish sanasi" value={f.from} max={f.to || today} onChange={(e) => f.setFrom(e.target.value)} className="w-[150px]" />
                <span className="text-on-surface-variant">–</span>
                <Input type="date" size="sm" aria-label="Tugash sanasi" value={f.to} min={f.from || undefined} max={today} onChange={(e) => f.setTo(e.target.value)} className="w-[150px]" />
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-12 xl:items-center">
            <SearchInput value={f.q} onValueChange={(v) => f.setQ(v)} placeholder="Oʻquvchi, ID, kvitansiya raqami yoki izoh…" wrapperClassName="sm:col-span-2 xl:col-span-4" />
            <Select
              aria-label="Toʻlov usuli"
              wrapperClassName="xl:col-span-3"
              value={f.method}
              onChange={(e) => f.setMethod(e.target.value)}
              options={[{ value: "", label: "Barcha toʻlov turlari" }, ...Object.entries(METHOD).map(([k, v]) => ({ value: k, label: v.label }))]}
            />
            <Checkbox className="whitespace-nowrap xl:col-span-3" checked={f.rev === "1"} onChange={(e) => f.setRev(e.target.checked ? "1" : null)} label="Bekor qilinganlarni koʻrsatish" />
            <ExportButton
              path="/admin/payments/transactions/export.csv"
              params={f.params}
              filename={`tushumlar-${f.params.from ?? "boshidan"}-${f.params.to ?? today}.csv`}
              size="sm"
              className="xl:col-span-2 xl:justify-self-end"
            />
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-3 border-b border-outline-variant/60 bg-surface-container-low/50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Jami tushum · {f.label}</p>
          <p className="font-headline-md text-headline-md tabular-nums text-on-surface">
            {t ? fmtMoney(t.amount) : "—"}
            <span className="ml-2 text-body-sm font-normal text-on-surface-variant">{t ? `${fmtNum(t.count)} ta toʻlov${f.rev === "1" ? " · bekor qilinganlar hisobga olinmagan" : ""}` : ""}</span>
          </p>
        </div>
        {t?.methods.length ? (
          <div className="flex flex-wrap gap-2">
            {t.methods.map((m) => (
              <button
                key={m.method}
                type="button"
                onClick={() => f.setMethod(f.method === m.method ? null : m.method)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-body-sm transition-colors",
                  f.method === m.method ? "border-primary bg-primary-fixed/60 text-primary" : "border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low",
                )}
              >
                <Icon name={METHOD[m.method].icon} size={16} />
                {m.label}
                <b className="tabular-nums">{fmtNum(m.amount)}</b>
                <span className="text-on-surface-variant">· {fmtNum(m.count)} ta</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <DataTable
        rows={d?.items}
        loading={list.isLoading}
        skeletonRows={8}
        getRowId={(x) => x.id}
        columns={columns}
        onRowClick={(x) => onLedger(x.student.id)}
        rowClassName={(x) => (x.reversed ? "bg-surface-container-low/60" : undefined)}
        empty={{
          icon: "payments",
          title: "Bu oraliqda tushum yoʻq",
          description: f.q || f.method ? "Filtrlarni oʻzgartirib koʻring" : "Boshqa sana oraligʻini tanlang yoki «Toʻlov qabul qilish» orqali pul kiriting",
        }}
      />
      <TableFooter d={d} onPage={setPage} />
    </Panel>
  );
}
