// Admin → Toʻlovlar: operatsion daftar (vizual til — hisobotlar mockupidagi "Toʻlovlar va moliyaviy hisob" boʻlimi).
import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  DropdownMenu,
  Icon,
  IconButton,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatCard,
  Tabs,
  TabsList,
  TabsTrigger,
  type Column,
} from "@/components/ui";
import { api } from "@/lib/api";
import { fmtDateShort, fmtNum, fmtPercent, fmtTime } from "@/lib/format";
import { useDebouncedValue, useFlagParam, useSearchParamState } from "@/lib/hooks";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { CancelDialog, GenerateDialog, NewPaymentDialog, PAYMENT_KEYS, PayDialog, ReceiptDialog, StatusCell } from "./b/PaymentParts";
import { ExportButton, METHOD, periodLabel, PeriodSelect, useFormOptions } from "./b/shared";
import type { PaymentList, PaymentPeriods, PaymentRow } from "./b/types";

const PAGE_SIZE = 20;
const shortName = (full: string | null) => {
  if (!full) return null;
  const [a, ...rest] = full.split(/\s+/);
  return rest.length ? `${a[0]}. ${rest.join(" ")}` : full;
};

export default function AdminPaymentsPage() {
  const periodsQ = useApiQuery<PaymentPeriods>(["admin", "payments", "periods"], "/admin/payments/periods");
  const pd = periodsQ.data;
  const defaultPeriod = pd ? (pd.items.some((i) => i.period === pd.current) ? pd.current : pd.latest) : "";
  const [periodParam, setPeriod] = useSearchParamState("p");
  const period = periodParam || defaultPeriod;
  const [status, setStatus] = useSearchParamState("s", "all");
  const [q, setQ] = useSearchParamState("q");
  const [groupId, setGroupId] = useSearchParamState("group");
  const [method, setMethod] = useSearchParamState("m");
  const [pageStr, setPageStr] = useSearchParamState("page", "1");
  const [newOpen, setNewOpen] = useFlagParam("new");
  const [genOpen, setGenOpen] = useState(false);
  const [payRow, setPayRow] = useState<PaymentRow | null>(null);
  const [cancelRow, setCancelRow] = useState<PaymentRow | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const page = Math.max(1, Number(pageStr) || 1);
  const dq = useDebouncedValue(q, 300);
  const opts = useFormOptions();

  const filterParams = { period, q: dq || undefined, groupId: groupId || undefined, method: method || undefined };
  const list = useApiQuery<PaymentList>(["admin", "payments", "list"], period ? "/admin/payments" : null, {
    params: { ...filterParams, status: status === "all" ? undefined : status, page, pageSize: PAGE_SIZE },
    placeholderData: (p) => p,
  });

  const filterKey = `${period}|${status}|${dq}|${groupId}|${method}`;
  const [lastKey, setLastKey] = useState(filterKey);
  useEffect(() => {
    if (filterKey !== lastKey) {
      setLastKey(filterKey);
      if (page !== 1) setPageStr(null);
    }
  }, [filterKey, lastKey, page, setPageStr]);

  const remind = useApiMutation((id: string) => api.post<{ sent: number }>(`/admin/payments/${id}/remind`), {
    invalidate: [["admin", "audit"]],
    success: (r) => `Eslatma ${fmtNum(r.sent)} ta ota-onaga yuborildi`,
  });

  const t = list.data?.totals;
  const d = list.data;
  const hasFilters = !!(q || groupId || method || status !== "all");

  const columns: Column<PaymentRow>[] = useMemo(
    () => [
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
      {
        key: "amount",
        header: "Summa",
        className: "px-3",
        headerClassName: "px-3",
        cell: (r) => (
          <span className={`whitespace-nowrap font-headline-sm text-headline-sm tabular-nums ${r.status === "OVERDUE" ? "text-error" : r.status === "CANCELLED" ? "text-on-surface-muted line-through" : "text-on-surface"}`}>
            {fmtNum(r.amount)} <span className="text-body-sm font-normal">soʻm</span>
          </span>
        ),
      },
      {
        key: "method",
        header: "Toʻlov usuli",
        hideBelow: "lg",
        className: "px-3",
        headerClassName: "px-3",
        cell: (r) =>
          r.method ? (
            <Badge tone="primary" icon={METHOD[r.method].icon}>
              {METHOD[r.method].label}
            </Badge>
          ) : (
            <span className="text-on-surface-muted">—</span>
          ),
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
        cell: (r) => (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {r.status === "PAID" ? (
              <IconButton icon="receipt_long" label="Kvitansiya" size="sm" variant="ghost" className="text-primary" onClick={() => setReceiptId(r.id)} />
            ) : r.status === "PENDING" || r.status === "OVERDUE" ? (
              <Button size="sm" variant={r.status === "OVERDUE" ? "danger" : "primary"} icon="payments" onClick={() => setPayRow(r)}>
                <span className="hidden sm:inline">Qabul qilish</span>
              </Button>
            ) : null}
            {r.status !== "CANCELLED" ? (
              <DropdownMenu
                trigger={<IconButton icon="more_vert" label="Amallar" size="sm" variant="ghost" />}
                items={[
                  ...(r.status === "PAID"
                    ? [{ label: "Kvitansiyani ochish", icon: "receipt_long", onSelect: () => setReceiptId(r.id) }]
                    : [
                        { label: "Qabul qilish", icon: "payments", onSelect: () => setPayRow(r) },
                        {
                          label: r.status === "OVERDUE" ? "Qarzdorlik eslatmasi" : "Eslatma yuborish",
                          icon: "notifications_active",
                          onSelect: () => remind.mutate(r.id),
                          description: "Ota-onaga Telegram/kabinet orqali",
                        },
                      ]),
                  "separator" as const,
                  { label: "Bekor qilish", icon: "block", tone: "danger" as const, onSelect: () => setCancelRow(r) },
                ]}
              />
            ) : (
              <span className="px-2 text-on-surface-muted">—</span>
            )}
          </div>
        ),
      },
    ],
    [remind],
  );

  const tabCount = (n: number | undefined) => (t ? ` (${fmtNum(n)})` : "");

  return (
    <>
      <PageHeader
        title="Toʻlovlar va moliyaviy hisob"
        documentTitle="Toʻlovlar"
        subtitle="Abonent toʻlovlari oqimi, tushumlar intizomi va kutilayotgan hisob-kitoblar"
        breadcrumbs={[{ label: "Boshqaruv markazi", to: "/admin" }, { label: "Toʻlovlar" }]}
        actions={
          <>
            <ExportButton path="/admin/payments/export.csv" params={{ ...filterParams, status: status === "all" ? undefined : status }} filename={`tolovlar-${period}.csv`} variant="secondary" />
            <Button variant="outline" icon="receipt_long" onClick={() => setGenOpen(true)} disabled={!period}>
              Oylik hisob-kitob
            </Button>
            <Button icon="add_card" onClick={() => setNewOpen(true)} disabled={!period}>
              Yangi toʻlov
            </Button>
          </>
        }
      />

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
                {fmtNum(t.students.PAID)} nafar oʻquvchi toʻlagan
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
          sub={
            t ? (
              <span className="flex items-center gap-1.5">
                <Badge tone="gold" size="sm">
                  {fmtNum(t.students.PENDING)} ta oʻquvchi
                </Badge>
                Muddati hali oʻtmagan
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
          onClick={() => setStatus("OVERDUE")}
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

      <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-outline-variant/70 bg-surface-container-lowest shadow-card">
        <div className="flex flex-col gap-3 border-b border-outline-variant/60 p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-12">
            <SearchInput value={q} onValueChange={(v) => setQ(v)} placeholder="Oʻquvchi ismi, ID, guruh yoki chek raqami…" wrapperClassName="sm:col-span-2 xl:col-span-5" />
            <PeriodSelect value={period} onChange={(p) => setPeriod(p === defaultPeriod ? null : p)} periods={pd?.items.map((i) => i.period) ?? []} className="xl:col-span-2" />
            <Select
              aria-label="Guruh"
              wrapperClassName="xl:col-span-3"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              options={[{ value: "", label: "Barcha guruhlar" }, ...(opts.data?.groups ?? []).map((g) => ({ value: g.id, label: g.name }))]}
            />
            <Select
              aria-label="Toʻlov usuli"
              wrapperClassName="xl:col-span-2"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              options={[{ value: "", label: "Barcha toʻlov turlari" }, ...Object.entries(METHOD).map(([k, v]) => ({ value: k, label: v.label }))]}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Tabs value={status} onValueChange={setStatus} variant="segmented" className="max-w-full">
              <TabsList>
                <TabsTrigger value="all">Barchasi{tabCount(t?.counts.ALL)}</TabsTrigger>
                <TabsTrigger value="PAID">Toʻlangan{tabCount(t?.counts.PAID)}</TabsTrigger>
                <TabsTrigger value="PENDING">Kutilmoqda{tabCount(t?.counts.PENDING)}</TabsTrigger>
                <TabsTrigger value="OVERDUE" className="data-[state=active]:text-error">
                  Muddati oʻtgan{tabCount(t?.counts.OVERDUE)}
                </TabsTrigger>
                {t?.counts.CANCELLED ? <TabsTrigger value="CANCELLED">Bekor qilingan{tabCount(t.counts.CANCELLED)}</TabsTrigger> : null}
              </TabsList>
            </Tabs>
            {hasFilters ? (
              <Button variant="link" size="sm" icon="filter_alt_off" onClick={() => (setQ(null), setGroupId(null), setMethod(null), setStatus(null))}>
                Filtrlarni tozalash
              </Button>
            ) : null}
          </div>
        </div>
        <DataTable
          rows={d?.items}
          loading={list.isLoading || periodsQ.isLoading}
          skeletonRows={8}
          getRowId={(r) => r.id}
          columns={columns}
          rowClassName={(r) => (r.status === "OVERDUE" ? "bg-error-container/20" : undefined)}
          empty={{
            icon: "payments",
            title: hasFilters ? "Hech narsa topilmadi" : `${period ? periodLabel(period) : "Bu davr"} uchun toʻlovlar yoʻq`,
            description: hasFilters ? "Filtrlarni oʻzgartirib koʻring" : "«Oylik hisob-kitob» bilan faol oʻquvchilarga hisob yarating",
            action: hasFilters ? undefined : (
              <Button size="sm" icon="receipt_long" onClick={() => setGenOpen(true)}>
                Oylik hisob-kitob
              </Button>
            ),
          }}
        />
        {d && d.total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/60 px-5 py-3">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Koʻrsatilmoqda: {fmtNum((d.page - 1) * d.pageSize + 1)}–{fmtNum(Math.min(d.page * d.pageSize, d.total))} dan {fmtNum(d.total)} ta yozuv
            </span>
            <Pagination page={d.page} pageCount={d.pages} onPageChange={(p) => setPageStr(String(p))} />
          </div>
        ) : null}
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-body-sm text-on-surface-variant">
        <Icon name="verified_user" size={16} className="text-primary" />
        Har bir qabul qilish va bekor qilish tizim jurnaliga oʻchirilmas yozuv sifatida tushadi.
      </p>

      <PayDialog payment={payRow} open={!!payRow} onOpenChange={(o) => !o && setPayRow(null)} onPaid={(id) => setReceiptId(id)} />
      <CancelDialog payment={cancelRow} open={!!cancelRow} onOpenChange={(o) => !o && setCancelRow(null)} />
      <ReceiptDialog paymentId={receiptId} open={!!receiptId} onOpenChange={(o) => !o && setReceiptId(null)} />
      {period ? <GenerateDialog open={genOpen} onOpenChange={setGenOpen} defaultPeriod={period} periods={pd?.items.map((i) => i.period) ?? []} /> : null}
      {period ? <NewPaymentDialog open={newOpen} onOpenChange={setNewOpen} defaultPeriod={period} onPaid={(id) => setReceiptId(id)} /> : null}
    </>
  );
}

export { PAYMENT_KEYS };
