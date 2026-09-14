// /ota-ona/tolovlar — farzand balansi (qarz / avans), oylar boʻyicha holat, oylik hisoblar va tushumlar tarixi.
// Pul oyga emas, eng eski ochiq hisobga yopiladi; ortigʻi avans. Onlayn toʻlov hozircha yoʻq — yoʻriqnoma matn.
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Badge, Button, Card, CardContent, CardHeader, Dialog, EmptyState, Icon, PageHeader, Table, TBody, TD, TH, THead, TR, iconTileTone } from "@/components/ui";
import { useCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { dayDiff, fmtDate, fmtDateShort, fmtDateTime, fmtMoney, fmtNum, fmtPhone } from "@/lib/format";
import type { Tone } from "@/lib/types";
import { ErrorCard, fmtPeriod, METHOD_LABEL, NoChild, PAY_META, PageSkeleton, PARENT_BASE, printWith, PrintStyles, useChildQuery } from "./p/shared";
import type { ChargeRow, PaymentsData, PaymentTx } from "./p/types";

/** Tarix yozuvi: tushum yoki eski (tushumsiz) toʻlangan hisob. Kvitansiya shundan quriladi. */
interface Entry {
  key: string;
  amount: number;
  paidAt: string | null;
  receiptNo: string | null;
  method: string;
  note: string | null;
  reversed: PaymentTx["reversed"];
  months: { period: string; group: string | null; amount: number }[];
  advance: number;
}

/** Bir tushumning bir oyga bir necha boʻlagi (qayta taqsimotdan keyin) bitta qatorga yigʻiladi. */
function mergeMonths(list: PaymentTx["allocations"]) {
  const m = new Map<string, Entry["months"][number]>();
  for (const a of list) {
    const k = `${a.period}|${a.group ?? ""}`;
    const cur = m.get(k);
    if (cur) cur.amount += a.amount;
    else m.set(k, { period: a.period, group: a.group, amount: a.amount });
  }
  return [...m.values()].sort((a, b) => a.period.localeCompare(b.period));
}

function buildHistory(data: PaymentsData): Entry[] {
  const txs: Entry[] = data.transactions.map((t) => ({
    key: t.id,
    amount: t.amount,
    paidAt: t.paidAt,
    receiptNo: t.receiptNo,
    method: t.methodLabel,
    note: t.note,
    reversed: t.reversed,
    months: mergeMonths(t.allocations),
    advance: t.advance,
  }));
  // tushum tizimidan oldin toʻlangan hisoblar (kvitansiya raqami hisobning oʻzida)
  const legacy: Entry[] = data.items
    .filter((p) => p.status === "PAID" && !p.transactionId)
    .map((p) => ({
      key: `p-${p.id}`,
      amount: p.amount,
      paidAt: p.paidAt ?? null,
      receiptNo: p.receiptNo ?? null,
      method: p.method ? METHOD_LABEL[p.method] : "—",
      note: p.note ?? null,
      reversed: null,
      months: [{ period: p.period, group: p.group?.name ?? null, amount: p.amount }],
      advance: 0,
    }));
  const t = (e: Entry) => (e.paidAt ? new Date(e.paidAt).getTime() : 0);
  return [...txs, ...legacy].sort((a, b) => t(b) - t(a));
}

/** "10 kun kechikdi" / "bugun oxirgi kun" / "3 kun qoldi" (kalendar kunlari, Toshkent). */
function dueText(dueDate: string, now: string) {
  const d = dayDiff(dueDate, now);
  if (d > 0) return `${d} kun kechikdi`;
  if (d === 0) return "bugun oxirgi kun";
  return `${-d} kun qoldi`;
}

export default function ParentPayments() {
  const { data, isLoading, error, refetch, child } = useChildQuery<PaymentsData>(["payments"], "/parent/payments");
  const [receipt, setReceipt] = useState<Entry | null>(null);

  if (!child) return <NoChild />;
  if (isLoading) return <PageSkeleton cards={1} blocks={2} />;
  if (error || !data) return <ErrorCard error={error} onRetry={() => void refetch()} />;

  const history = buildHistory(data);
  const hasCharges = data.items.length > 0;
  const showHowTo = () => document.getElementById("tolash")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="space-y-6">
      <PrintStyles />
      <PageHeader
        breadcrumbs={[{ label: "Bosh sahifa", to: PARENT_BASE }, { label: "Toʻlovlar va kvitansiyalar" }]}
        title="Toʻlovlar va kvitansiyalar"
        subtitle={`${data.child.fullName} (#${data.child.code}) · balans, oylik hisoblar va kvitansiyalar`}
      />

      {/* Kompyuterda: 1-qator — balans + oylar (8) | yoʻriqnoma (4), keyin jadval va tarix toʻliq enida.
          Mobil/planshetda yoʻriqnoma eng oxirida (balans kartasidagi tugma unga olib boradi). */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-8">
          {hasCharges || data.summary.advance > 0 ? <BalanceCard data={data} onHowTo={showHowTo} /> : <NoChargesCard dueDay={data.dueDay} />}
          {hasCharges ? <MonthsCard items={data.items} /> : null}
        </div>
        <aside className="order-last min-w-0 xl:order-none xl:col-span-4">
          <InstructionsCard data={data} />
        </aside>
        {hasCharges || history.length ? (
          <div className="flex min-w-0 flex-col gap-6 xl:col-span-12">
            {hasCharges ? <ChargesCard data={data} /> : null}
            <HistoryCard entries={history} onReceipt={setReceipt} />
          </div>
        ) : null}
      </div>

      <ReceiptDialog entry={receipt} data={data} onClose={() => setReceipt(null)} />
    </div>
  );
}

// ─────────────────────────────── Balans

function BalanceCard({ data, onHowTo }: { data: PaymentsData; onHowTo: () => void }) {
  const sm = data.summary;
  const debt = sm.balance < 0 ? -sm.balance : 0;
  const state = debt > 0 ? "debt" : sm.advance > 0 ? "advance" : "clear";
  const tone: Tone = state === "debt" ? (sm.hasOverdue ? "danger" : "warning") : "success";
  const next = sm.nextDue;
  const year = data.period.slice(0, 4);

  return (
    <Card className={cn("overflow-hidden", state === "debt" && sm.hasOverdue && "border-error/40")}>
      <div className={cn("h-1.5", state === "debt" ? (sm.hasOverdue ? "bg-error" : "bg-warning") : "bg-success")} aria-hidden="true" />
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", iconTileTone[tone])}>
            <Icon name={state === "debt" ? "account_balance_wallet" : state === "advance" ? "savings" : "check_circle"} size={26} filled={state === "clear"} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-label-md text-label-md text-on-surface-variant">
              {state === "debt" ? "Qarzdorlik" : state === "advance" ? "Avans (keyingi oylar uchun)" : "Balans"}
            </p>
            <p
              className={cn(
                "font-display text-[1.875rem] font-bold leading-tight tabular-nums sm:text-[2.25rem]",
                state === "debt" ? "text-error" : "text-success",
              )}
            >
              {state === "debt" ? fmtMoney(debt) : state === "advance" ? fmtMoney(sm.advance) : "Qarzdorlik yoʻq"}
            </p>
            <p className="mt-0.5 text-body-sm text-on-surface-variant">
              {state === "debt"
                ? `${sm.outstandingCount} ta ochiq hisob${sm.hasOverdue ? "" : " · muddati hali oʻtmagan"}`
                : state === "advance"
                  ? "Keyingi oy hisobi yozilganda avansdan avtomatik yopiladi"
                  : "Barcha oylik hisoblar toʻlangan"}
            </p>
          </div>
        </div>

        {state === "debt" && sm.overdue > 0 ? (
          <div className="flex items-start gap-2 rounded-lg bg-error-container px-3 py-2.5 text-on-error-container">
            <Icon name="error" size={20} className="mt-px shrink-0" />
            <p className="text-body-md">
              Muddati oʻtgan: <b className="tabular-nums">{fmtMoney(sm.overdue)}</b>
              {sm.overdue < debt ? <span className="text-body-sm"> · qolgan {fmtMoney(debt - sm.overdue)} muddati hali kelmagan</span> : null}
            </p>
          </div>
        ) : null}

        {state === "debt" && next ? (
          <div className="rounded-xl bg-surface-container-low p-3.5 sm:p-4">
            <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">Eng yaqin toʻlov</p>
            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="font-label-lg text-label-lg text-on-surface">
                {fmtPeriod(next.period)}
                {next.group ? <span className="font-normal text-on-surface-variant"> · {next.group.name}</span> : null}
              </span>
              <span className="font-headline-sm text-headline-sm tabular-nums text-on-surface">{fmtMoney(next.outstanding)}</span>
            </div>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              {next.partial ? `${fmtMoney(next.paidAmount)} toʻlangan (${fmtMoney(next.amount)} dan) · ` : ""}
              Muddat: {fmtDate(next.dueDate)} ·{" "}
              <span className={cn("font-semibold", next.status === "OVERDUE" ? "text-error" : "text-on-surface")}>{dueText(next.dueDate, data.now)}</span>
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-outline-variant/70 pt-4 text-body-sm text-on-surface-variant sm:flex-row sm:flex-wrap sm:gap-x-6">
          <span className="flex items-center gap-1.5">
            <Icon name="event" size={18} className="shrink-0 text-primary" />
            <span>
              Toʻlov muddati — <b className="text-on-surface">har oyning {data.dueDay}-sanasigacha</b>
            </span>
          </span>
          {sm.monthlyFee ? (
            <span className="flex items-center gap-1.5">
              <Icon name="payments" size={18} className="shrink-0 text-primary" />
              <span>
                Oylik toʻlov: <b className="tabular-nums text-on-surface">{fmtMoney(sm.monthlyFee)}</b>
                {sm.monthlyFees?.length ? ` (${sm.monthlyFees.map((f) => f.group).join(" + ")})` : data.child.group ? ` (${data.child.group.name})` : ""}
              </span>
            </span>
          ) : null}
          <span className="flex items-center gap-1.5">
            <Icon name="check_circle" size={18} className="shrink-0 text-primary" />
            <span>
              {year}-yilda toʻlangan: <b className="tabular-nums text-on-surface">{fmtMoney(sm.paidThisYear)}</b>
            </span>
          </span>
        </div>

        {state === "debt" ? (
          <Button variant={sm.hasOverdue ? "danger" : "outline"} icon="info" onClick={onHowTo} className="w-full sm:w-auto">
            Qanday toʻlash mumkin
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function NoChargesCard({ dueDay }: { dueDay: number }) {
  return (
    <Card>
      <EmptyState
        icon="receipt_long"
        title="Hali hisob yozilmagan"
        description={`Oylik toʻlov hisobi har oy boshida yoziladi va har oyning ${dueDay}-sanasigacha toʻlanadi. Hisob yozilishi bilan u shu yerda koʻrinadi.`}
      />
    </Card>
  );
}

// ─────────────────────────────── Oylar boʻyicha holat (chiplar)

type MonthState = "paid" | "partial" | "unpaid";

interface MonthCell {
  period: string;
  amount: number;
  paid: number;
  open: boolean;
  overdue: boolean;
}

/** Bir oyda bir necha guruh hisobi boʻlsa, bitta chipga yigʻiladi. */
function monthCells(items: ChargeRow[]): MonthCell[] {
  const m = new Map<string, MonthCell>();
  for (const p of items) {
    const c = m.get(p.period) ?? { period: p.period, amount: 0, paid: 0, open: false, overdue: false };
    c.amount += p.amount;
    c.paid += p.paidAmount;
    if (p.status !== "PAID") c.open = true;
    if (p.status === "OVERDUE") c.overdue = true;
    m.set(p.period, c);
  }
  return [...m.values()].sort((a, b) => b.period.localeCompare(a.period)).slice(0, 12);
}

const CHIP: Record<MonthState | "overdue", { cls: string; icon: string; label: string }> = {
  paid: { cls: "border-success/25 bg-success-container/50 text-on-success-container", icon: "check_circle", label: "Toʻlangan" },
  partial: { cls: "border-warning/30 bg-warning-container/60 text-on-warning-container", icon: "donut_large", label: "Qisman" },
  unpaid: { cls: "border-outline-variant bg-surface-container-low text-on-surface-variant", icon: "cancel", label: "Toʻlanmagan" },
  overdue: { cls: "border-error/30 bg-error-container/60 text-on-error-container", icon: "error", label: "Kechikkan" },
};

function MonthsCard({ items }: { items: ChargeRow[] }) {
  const cells = monthCells(items);
  return (
    <Card>
      <CardHeader icon="calendar_month" title="Oylar boʻyicha holat" description={cells.length > 1 ? `Soʻnggi ${cells.length} oy` : undefined} />
      <CardContent>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6 xl:grid-cols-4 2xl:grid-cols-6">
          {cells.map((c) => {
            const state: MonthState = !c.open ? "paid" : c.paid > 0 ? "partial" : "unpaid";
            const meta = CHIP[c.overdue ? "overdue" : state];
            const [name, year] = fmtPeriod(c.period).split(", ");
            return (
              <li key={c.period} className={cn("flex min-w-0 flex-col rounded-xl border p-2.5 sm:p-3", meta.cls)}>
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate font-label-lg text-label-lg">{name}</span>
                  <Icon name={meta.icon} size={18} className="shrink-0" filled={state === "paid"} />
                </div>
                <span className="font-label-sm text-label-sm opacity-75">{year}</span>
                <span className="mt-1.5 font-label-md text-label-md">
                  {c.overdue && state === "partial" ? "Kechikkan · qisman" : meta.label}
                </span>
                {state === "partial" ? (
                  <span className="text-body-sm tabular-nums">
                    {fmtNum(c.paid)} / {fmtNum(c.amount)}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────── Oylik hisoblar

function StatusBadges({ p, className }: { p: ChargeRow; className?: string }) {
  const m = PAY_META[p.status];
  return (
    <span className={cn("flex flex-wrap justify-end gap-1", className)}>
      <Badge tone={m.tone} icon={m.icon}>
        {m.label}
      </Badge>
      {p.partial ? (
        <Badge tone="warning" icon="donut_large">
          Qisman
        </Badge>
      ) : null}
    </span>
  );
}

function Left({ p }: { p: ChargeRow }) {
  if (p.outstanding <= 0) return <span className="text-on-surface-muted">—</span>;
  return <span className={cn("font-semibold tabular-nums", p.status === "OVERDUE" ? "text-error" : "text-on-surface")}>{fmtMoney(p.outstanding)}</span>;
}

function ChargesCard({ data }: { data: PaymentsData }) {
  const [all, setAll] = useState(false);
  const rows = all ? data.items : data.items.slice(0, 12);
  return (
    <Card className="min-w-0">
      <CardHeader
        icon="receipt_long"
        title="Oylik hisoblar"
        badge={<Badge>{data.items.length}</Badge>}
        description={`Har oy uchun yozilgan toʻlov · muddat har oyning ${data.dueDay}-sanasigacha`}
      />

      {/* mobil/planshet: kartalar */}
      <ul className="divide-y divide-outline-variant/70 border-t border-outline-variant/70 xl:hidden">
        {rows.map((p) => (
          <li key={p.id} className="px-5 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-label-lg text-label-lg text-on-surface">{fmtPeriod(p.period)}</div>
                {p.group ? <div className="truncate text-body-sm text-on-surface-variant">{p.group.name}</div> : null}
              </div>
              <StatusBadges p={p} />
            </div>
            <dl className="mt-2.5 grid grid-cols-3 gap-2 text-body-sm">
              <div className="min-w-0">
                <dt className="text-on-surface-muted">Summa</dt>
                <dd className="font-semibold tabular-nums text-on-surface">{fmtMoney(p.amount)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-on-surface-muted">Toʻlangan</dt>
                <dd className="font-semibold tabular-nums text-on-surface">{p.paidAmount > 0 ? fmtMoney(p.paidAmount) : "—"}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-on-surface-muted">Qoldiq</dt>
                <dd>
                  <Left p={p} />
                </dd>
              </div>
            </dl>
            <p className="mt-1.5 text-body-sm text-on-surface-muted">
              Muddat: {fmtDate(p.dueDate)}
              {p.status === "PAID" && p.paidAt ? ` · toʻlandi ${fmtDate(p.paidAt)}` : ""}
            </p>
          </li>
        ))}
      </ul>

      {/* kompyuter: jadval (guruh davr ostida — ustunlar karta eniga sigʻadi) */}
      <Table containerClassName="hidden xl:block">
        <THead>
          <tr>
            <TH>Davr / guruh</TH>
            <TH className="text-right">Summa</TH>
            <TH className="text-right">Toʻlangan</TH>
            <TH className="text-right">Qoldiq</TH>
            <TH>Holat</TH>
            <TH>Muddat</TH>
          </tr>
        </THead>
        <TBody>
          {rows.map((p) => (
            <TR key={p.id} className={cn(p.status === "OVERDUE" && "bg-error-container/20")}>
              <TD>
                <div className="whitespace-nowrap font-label-lg text-label-lg">{fmtPeriod(p.period)}</div>
                {p.group ? <div className="max-w-[240px] truncate text-body-sm text-on-surface-variant">{p.group.name}</div> : null}
              </TD>
              <TD className="whitespace-nowrap text-right tabular-nums">{fmtMoney(p.amount)}</TD>
              <TD className="whitespace-nowrap text-right tabular-nums">
                {p.paidAmount > 0 ? fmtMoney(p.paidAmount) : <span className="text-on-surface-muted">—</span>}
              </TD>
              <TD className="whitespace-nowrap text-right">
                <Left p={p} />
              </TD>
              <TD>
                <StatusBadges p={p} className="justify-start" />
              </TD>
              <TD className="whitespace-nowrap tabular-nums text-on-surface-variant">{fmtDateShort(p.dueDate)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>

      {data.items.length > 12 ? (
        <div className="flex justify-center border-t border-outline-variant/70 p-3">
          <Button variant="ghost" size="sm" iconRight={all ? "expand_less" : "expand_more"} onClick={() => setAll((v) => !v)}>
            {all ? "Qisqaroq koʻrsatish" : `Barchasini koʻrsatish (${data.items.length})`}
          </Button>
        </div>
      ) : (
        <div className="h-2" />
      )}
    </Card>
  );
}

// ─────────────────────────────── Toʻlovlar tarixi

function HistoryCard({ entries, onReceipt }: { entries: Entry[]; onReceipt: (e: Entry) => void }) {
  return (
    <Card className="min-w-0">
      <CardHeader icon="history" title="Toʻlovlar tarixi" badge={<Badge>{entries.length}</Badge>} description="Qabul qilingan toʻlovlar va ular yopgan oylar" />
      <CardContent>
        {entries.length === 0 ? (
          <EmptyState compact icon="payments" title="Hali toʻlov qabul qilinmagan" description="Toʻlov kassada qabul qilingach, shu yerda kvitansiyasi bilan koʻrinadi." />
        ) : (
          <ul className="space-y-3">
            {entries.map((e) => (
              <HistoryRow key={e.key} e={e} onReceipt={onReceipt} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function monthLabel(m: Entry["months"][number], all: Entry["months"]) {
  const dup = all.filter((x) => x.period === m.period).length > 1;
  return `${fmtPeriod(m.period)}${dup && m.group ? ` · ${m.group}` : ""}`;
}

function HistoryRow({ e, onReceipt }: { e: Entry; onReceipt: (e: Entry) => void }) {
  const off = !!e.reversed;
  return (
    <li className={cn("rounded-xl border border-outline-variant/70 p-3.5 sm:p-4", off ? "bg-surface-container-low" : "bg-surface-container-lowest")}>
      <div className="flex items-start gap-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconTileTone[off ? "neutral" : "success"])}>
          <Icon name={off ? "block" : "payments"} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <span className={cn("font-headline-sm text-headline-sm tabular-nums", off ? "text-on-surface-muted line-through" : "text-on-surface")}>
              {fmtMoney(e.amount)}
            </span>
            <span className="text-body-sm tabular-nums text-on-surface-variant">{e.paidAt ? fmtDateTime(e.paidAt) : "—"}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-body-sm text-on-surface-variant">
            <span>{e.method}</span>
            {e.receiptNo ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">Kvitansiya № {e.receiptNo}</span>
              </>
            ) : null}
          </div>

          {e.months.length || e.advance > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {e.months.map((m) => (
                <Badge key={`${m.period}|${m.group}`} tone={off ? "neutral" : "primary"} shape="square" className={cn(off && "line-through")} title={m.group ?? undefined}>
                  {monthLabel(m, e.months)}: {fmtMoney(m.amount)}
                </Badge>
              ))}
              {e.advance > 0 ? (
                <Badge tone="success" shape="square" icon="savings">
                  Avans: {fmtMoney(e.advance)}
                </Badge>
              ) : null}
            </div>
          ) : null}

          {off ? (
            <p className="mt-2 flex items-start gap-1.5 text-body-sm text-error">
              <Icon name="block" size={16} className="mt-0.5 shrink-0" />
              <span>
                <b>Bekor qilingan</b> — {e.reversed?.reason || "sabab koʻrsatilmagan"}
                {e.reversed ? ` · ${fmtDateShort(e.reversed.at)}` : ""}
              </span>
            </p>
          ) : e.note ? (
            <p className="mt-1.5 text-body-sm text-on-surface-muted">Izoh: {e.note}</p>
          ) : null}

          {!off ? (
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="outline" icon="receipt_long" onClick={() => onReceipt(e)}>
                Kvitansiya
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

// ─────────────────────────────── Qanday toʻlash mumkin

function InstructionsCard({ data }: { data: PaymentsData }) {
  const b = data.branch;
  const code = `#${data.child.code}`;
  const ways = [
    {
      name: "Click",
      icon: "smartphone",
      text: `Click ilovasida taʼlim xizmatlari uchun toʻlov qiling. Izohga oʻquvchi ID raqamini (${code}) va ismini yozing.`,
    },
    {
      name: "Payme",
      icon: "qr_code_scanner",
      text: `Payme orqali toʻlashda ham izohga oʻquvchi ID raqamini (${code}) yozing — administrator toʻlovni shu raqam boʻyicha tasdiqlaydi.`,
    },
    {
      name: "Naqd yoki karta",
      icon: "storefront",
      text: `Filial kassasida${b?.address ? ` (${b.address})` : ""} naqd yoki plastik karta bilan toʻlang — kvitansiya darhol beriladi.`,
    },
  ];
  return (
    <Card id="tolash" className="min-w-0 scroll-mt-20">
      <CardHeader icon="info" title="Qanday toʻlash mumkin" description="Onlayn toʻlov tez orada ilovaning oʻzida paydo boʻladi" />
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 rounded-xl bg-primary-light px-3.5 py-3 text-body-sm text-on-surface">
          <Icon name="event" size={18} className="mt-px shrink-0 text-primary" />
          <p>
            <b>Toʻlov muddati — har oyning {data.dueDay}-sanasigacha.</b> Shu kungacha toʻlanmagan boʻlsa, Telegram bot ulangan ota-onaga eslatma yuboriladi.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
          {ways.map((w) => (
            <div key={w.name} className="flex gap-3 rounded-xl bg-surface-container-low p-3.5">
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconTileTone.primary)}>
                <Icon name={w.icon} size={18} />
              </span>
              <div className="min-w-0">
                <div className="font-label-lg text-label-lg text-on-surface">{w.name}</div>
                <p className="text-body-sm text-on-surface-variant">{w.text}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-body-sm text-on-surface-variant">
          Qisman toʻlash ham mumkin: tushgan pul avval eng eski qarzni yopadi, ortigʻi avans boʻlib keyingi oylarga oʻtadi.
        </p>
        <p className="text-body-sm text-on-surface-muted">
          Toʻlov administrator tomonidan qabul qilingach, u shu sahifadagi «Toʻlovlar tarixi»da paydo boʻladi va kvitansiyani chop etish mumkin.
          {b?.phone ? ` Savollar boʻyicha: ${fmtPhone(b.phone)}.` : ""}
        </p>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────── Kvitansiya

function ReceiptBody({ e, data, parentName }: { e: Entry; data: PaymentsData; parentName: string }) {
  const rows: [string, ReactNode][] = [
    ["Kvitansiya raqami", e.receiptNo ?? "—"],
    ["Toʻlov sanasi", e.paidAt ? fmtDateTime(e.paidAt) : "—"],
    ["Toʻlovchi", parentName],
    ["Oʻquvchi", `${data.child.fullName} (#${data.child.code})`],
    ["Toʻlov usuli", e.method],
  ];
  return (
    <div className="space-y-4 text-on-surface">
      <div className="flex items-start justify-between gap-3 border-b border-dashed border-outline-variant pb-4">
        <div className="min-w-0">
          <div className="font-display text-headline-lg font-bold text-primary">URFON</div>
          <div className="text-body-sm text-on-surface-variant">{data.branch?.name ?? "Oʻquv markazi"}</div>
          {data.branch?.address ? <div className="text-body-sm text-on-surface-muted">{data.branch.address}</div> : null}
          {data.branch?.phone ? <div className="text-body-sm text-on-surface-muted">{fmtPhone(data.branch.phone)}</div> : null}
        </div>
        <div className="shrink-0 text-right">
          <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">Toʻlov kvitansiyasi</div>
          <Badge tone="success" icon="check_circle" className="mt-1">
            Qabul qilindi
          </Badge>
        </div>
      </div>
      <dl className="space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 text-body-md">
            <dt className="shrink-0 text-on-surface-variant">{k}</dt>
            <dd className="min-w-0 break-words text-right font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <div>
        <p className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">Toʻlov nima uchun</p>
        <ul className="divide-y divide-outline-variant/70 rounded-lg border border-outline-variant/70">
          {e.months.map((m) => (
            <li key={`${m.period}|${m.group}`} className="flex items-baseline justify-between gap-3 px-3 py-2 text-body-md">
              <span className="min-w-0">
                {fmtPeriod(m.period)}
                {m.group ? <span className="block text-body-sm text-on-surface-muted">{m.group}</span> : null}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{fmtMoney(m.amount)}</span>
            </li>
          ))}
          {e.advance > 0 ? (
            <li className="flex items-baseline justify-between gap-3 px-3 py-2 text-body-md">
              <span>Avans (keyingi oylar uchun)</span>
              <span className="shrink-0 font-semibold tabular-nums">{fmtMoney(e.advance)}</span>
            </li>
          ) : null}
        </ul>
      </div>
      <div className="flex items-baseline justify-between gap-3 border-t border-dashed border-outline-variant pt-4">
        <span className="font-label-lg text-label-lg text-on-surface-variant">Jami toʻlangan</span>
        <span className="font-metric-num text-metric-num tabular-nums">{fmtMoney(e.amount)}</span>
      </div>
      {e.note ? <p className="text-body-sm text-on-surface-muted">Izoh: {e.note}</p> : null}
      <p className="text-center text-body-sm text-on-surface-muted">Elektron kvitansiya URFON platformasi orqali shakllantirildi · {fmtDateShort(new Date())}</p>
    </div>
  );
}

function ReceiptDialog({ entry, data, onClose }: { entry: Entry | null; data: PaymentsData; onClose: () => void }) {
  const user = useCurrentUser();
  return (
    <>
      <Dialog
        open={!!entry}
        onOpenChange={(o) => !o && onClose()}
        title="Toʻlov kvitansiyasi"
        description={entry ? [entry.receiptNo, entry.paidAt ? fmtDate(entry.paidAt) : null].filter(Boolean).join(" · ") : undefined}
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              Yopish
            </Button>
            <Button icon="print" onClick={() => printWith("printing-area")}>
              Chop etish
            </Button>
          </>
        }
      >
        {entry ? <ReceiptBody e={entry} data={data} parentName={user.fullName} /> : null}
      </Dialog>
      {entry
        ? createPortal(
            <div className="print-area print-only mx-auto max-w-lg p-6">
              <ReceiptBody e={entry} data={data} parentName={user.fullName} />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
