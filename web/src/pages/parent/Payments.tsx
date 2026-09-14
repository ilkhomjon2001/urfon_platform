// /ota-ona/tolovlar — to'lovlar va kvitansiyalar. Onlayn to'lov integratsiyasi hozircha yo'q: yo'riqnoma matn ko'rinishida.
import { useState } from "react";
import { createPortal } from "react-dom";
import { Alert, Badge, Button, Card, CardContent, CardHeader, DataTable, Dialog, Icon, PageHeader, StatCard, type Column } from "@/components/ui";
import { iconTileTone } from "@/components/ui";
import { useCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { fmtDate, fmtDateShort, fmtDateTime, fmtMoney, fmtPhone } from "@/lib/format";
import { ErrorCard, fmtPeriod, METHOD_LABEL, NoChild, PAY_META, PageSkeleton, PARENT_BASE, printWith, PrintStyles, useChildQuery } from "./p/shared";
import type { PaymentRow, PaymentsData } from "./p/types";

export default function ParentPayments() {
  const { data, isLoading, error, refetch, child } = useChildQuery<PaymentsData>(["payments"], "/parent/payments");
  const [receipt, setReceipt] = useState<PaymentRow | null>(null);

  if (!child) return <NoChild />;
  if (isLoading) return <PageSkeleton cards={3} blocks={1} />;
  if (error || !data) return <ErrorCard error={error} onRetry={() => void refetch()} />;

  const cur = data.current;
  const sm = data.summary;

  const columns: Column<PaymentRow>[] = [
    { key: "period", header: "Davr", cell: (p) => <span className="whitespace-nowrap font-label-lg text-label-lg">{fmtPeriod(p.period)}</span> },
    { key: "amount", header: "Summa", align: "right", cell: (p) => <span className="whitespace-nowrap tabular-nums">{fmtMoney(p.amount)}</span> },
    {
      key: "status",
      header: "Holat",
      cell: (p) => (
        <Badge tone={PAY_META[p.status].tone} icon={PAY_META[p.status].icon}>
          {PAY_META[p.status].label}
        </Badge>
      ),
    },
    { key: "due", header: "Muddat", hideBelow: "md", cell: (p) => <span className="tabular-nums">{fmtDateShort(p.dueDate)}</span> },
    {
      key: "paid",
      header: "Toʻlangan",
      hideBelow: "sm",
      cell: (p) =>
        p.paidAt ? (
          <div className="whitespace-nowrap">
            <div className="tabular-nums">{fmtDateShort(p.paidAt)}</div>
            {p.method ? <div className="text-body-sm text-on-surface-muted">{METHOD_LABEL[p.method]}</div> : null}
          </div>
        ) : (
          "—"
        ),
    },
    {
      key: "receipt",
      header: "Kvitansiya",
      align: "right",
      cell: (p) =>
        p.status === "PAID" ? (
          <Button size="sm" variant="outline" icon="receipt_long" onClick={() => setReceipt(p)} title="Kvitansiyani koʻrish">
            <span className="hidden tabular-nums sm:inline">{p.receiptNo ?? "Koʻrish"}</span>
          </Button>
        ) : (
          <span className="text-on-surface-muted">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PrintStyles />
      <PageHeader
        breadcrumbs={[{ label: "Bosh sahifa", to: PARENT_BASE }, { label: "Toʻlovlar va kvitansiyalar" }]}
        title="Toʻlovlar va kvitansiyalar"
        subtitle={`${data.child.fullName} (#${data.child.code}) boʻyicha oylik toʻlovlar tarixi`}
      />

      {sm.outstandingCount > 0 ? (
        <Alert tone={sm.hasOverdue ? "danger" : "warning"} title={sm.hasOverdue ? "Toʻlov muddati oʻtgan" : "Toʻlov kutilmoqda"}>
          {sm.outstandingCount} ta oy uchun jami {fmtMoney(sm.outstanding)}.{sm.nextDue ? ` Eng yaqin muddat: ${fmtDate(sm.nextDue.dueDate)}.` : ""} Toʻlov usullari pastda koʻrsatilgan.
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CurrentCard current={cur} period={data.period} onReceipt={setReceipt} />
        <StatCard
          label="Qarzdorlik"
          icon={sm.outstanding ? "account_balance_wallet" : "check_circle"}
          iconTone={sm.outstanding ? (sm.hasOverdue ? "danger" : "warning") : "success"}
          value={fmtMoney(sm.outstanding)}
          sub={sm.outstanding ? `${sm.outstandingCount} ta toʻlanmagan oy` : "Qarzdorlik yoʻq"}
        />
        <StatCard
          label={`${data.period.slice(0, 4)}-yilda toʻlangan`}
          icon="payments"
          value={fmtMoney(sm.paidThisYear)}
          sub={sm.monthlyFee ? `Oylik toʻlov: ${fmtMoney(sm.monthlyFee)}` : `${sm.paidCount} ta toʻlov`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
        <Card className="min-w-0 2xl:col-span-2">
          <CardHeader icon="history" title="Toʻlovlar tarixi" badge={<Badge>{data.items.length}</Badge>} />
          <DataTable
            rows={data.items}
            getRowId={(p) => p.id}
            columns={columns}
            empty={{ icon: "receipt_long", title: "Hali toʻlov yozuvlari yoʻq" }}
          />
        </Card>
        <InstructionsCard data={data} />
      </div>

      <ReceiptDialog payment={receipt} data={data} onClose={() => setReceipt(null)} />
    </div>
  );
}

function CurrentCard({ current, period, onReceipt }: { current: PaymentRow | null; period: string; onReceipt: (p: PaymentRow) => void }) {
  if (!current) {
    return (
      <Card>
        <CardContent>
          <p className="font-label-md text-label-md text-on-surface-variant">{fmtPeriod(period)}</p>
          <p className="mt-2 text-body-md text-on-surface-variant">Bu oy uchun toʻlov hali hisoblanmagan.</p>
        </CardContent>
      </Card>
    );
  }
  const m = PAY_META[current.status];
  return (
    <Card className={cn(current.status === "OVERDUE" && "border-error/40")}>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-label-md text-label-md text-on-surface-variant">
            {current.period === period ? "Joriy oy" : "Soʻnggi hisob"} · {fmtPeriod(current.period)}
          </span>
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconTileTone[m.tone === "neutral" ? "neutral" : m.tone])}>
            <Icon name={m.icon} size={22} />
          </span>
        </div>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-metric-num text-metric-num text-on-surface">{fmtMoney(current.amount)}</span>
          <Badge tone={m.tone}>{m.label}</Badge>
        </div>
        <p className="text-body-sm text-on-surface-variant">
          {current.status === "PAID"
            ? `Toʻlandi: ${current.paidAt ? fmtDate(current.paidAt) : "—"}${current.method ? ` · ${METHOD_LABEL[current.method]}` : ""}`
            : `Toʻlov muddati: ${fmtDate(current.dueDate)}`}
          {current.group ? ` · ${current.group.name}` : ""}
        </p>
        {current.status === "PAID" ? (
          <Button size="sm" variant="secondary" icon="receipt_long" onClick={() => onReceipt(current)}>
            Kvitansiyani koʻrish
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

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
    <Card className="min-w-0">
      <CardHeader icon="info" title="Qanday toʻlash mumkin" description="Onlayn toʻlov tez orada ilovaning oʻzida paydo boʻladi" />
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 2xl:grid-cols-1">
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
        <p className="text-body-sm text-on-surface-muted">
          Toʻlov administrator tomonidan tasdiqlangach, holati shu sahifada «Toʻlangan» boʻladi va kvitansiyani chop etish mumkin.
          {b?.phone ? ` Savollar boʻyicha: ${fmtPhone(b.phone)}.` : ""}
        </p>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────── Kvitansiya

function ReceiptBody({ p, data, parentName }: { p: PaymentRow; data: PaymentsData; parentName: string }) {
  const rows: [string, string][] = [
    ["Kvitansiya raqami", p.receiptNo ?? "—"],
    ["Toʻlov sanasi", p.paidAt ? fmtDateTime(p.paidAt) : "—"],
    ["Toʻlovchi", parentName],
    ["Oʻquvchi", `${data.child.fullName} (#${data.child.code})`],
    ["Guruh", p.group?.name ?? data.child.group?.name ?? "—"],
    ["Toʻlov davri", fmtPeriod(p.period)],
    ["Toʻlov usuli", p.method ? METHOD_LABEL[p.method] : "—"],
  ];
  return (
    <div className="space-y-4 text-on-surface">
      <div className="flex items-start justify-between gap-3 border-b border-dashed border-outline-variant pb-4">
        <div>
          <div className="font-display text-headline-lg font-bold text-primary">URFON</div>
          <div className="text-body-sm text-on-surface-variant">{data.branch?.name ?? "Oʻquv markazi"}</div>
          {data.branch?.address ? <div className="text-body-sm text-on-surface-muted">{data.branch.address}</div> : null}
          {data.branch?.phone ? <div className="text-body-sm text-on-surface-muted">{fmtPhone(data.branch.phone)}</div> : null}
        </div>
        <div className="text-right">
          <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">Toʻlov kvitansiyasi</div>
          <Badge tone="success" icon="check_circle" className="mt-1">
            Toʻlangan
          </Badge>
        </div>
      </div>
      <dl className="space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 text-body-md">
            <dt className="text-on-surface-variant">{k}</dt>
            <dd className="text-right font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-baseline justify-between border-t border-dashed border-outline-variant pt-4">
        <span className="font-label-lg text-label-lg text-on-surface-variant">Jami toʻlangan</span>
        <span className="font-metric-num text-metric-num">{fmtMoney(p.amount)}</span>
      </div>
      {p.note ? <p className="text-body-sm text-on-surface-muted">Izoh: {p.note}</p> : null}
      <p className="text-center text-body-sm text-on-surface-muted">Elektron kvitansiya URFON platformasi orqali shakllantirildi · {fmtDateShort(new Date())}</p>
    </div>
  );
}

function ReceiptDialog({ payment, data, onClose }: { payment: PaymentRow | null; data: PaymentsData; onClose: () => void }) {
  const user = useCurrentUser();
  return (
    <>
      <Dialog
        open={!!payment}
        onOpenChange={(o) => !o && onClose()}
        title="Toʻlov kvitansiyasi"
        description={payment ? `${fmtPeriod(payment.period)} · ${payment.receiptNo ?? ""}` : undefined}
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
        {payment ? <ReceiptBody p={payment} data={data} parentName={user.fullName} /> : null}
      </Dialog>
      {payment
        ? createPortal(
            <div className="print-area print-only mx-auto max-w-lg p-6">
              <ReceiptBody p={payment} data={data} parentName={user.fullName} />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
