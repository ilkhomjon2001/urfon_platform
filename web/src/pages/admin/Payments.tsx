// Admin → Toʻlovlar: balans daftari (Tarbion modeli). Oylik hisoblar (Payment) va kassaga kelgan pul — tushumlar
// (PaymentTransaction) alohida; pul eng eski qarzdan yopiladi, ortigʻi avans. Bekor qilish — storno.
// URL: ?t=balance|charges|tx, ?ledger=<oʻquvchi>, ?receive=1|<oʻquvchi>, ?new=1 (header menyusi → qabul qilish).
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, DropdownMenu, Icon, PageHeader, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { useFlagParam, useSearchParamState } from "@/lib/hooks";
import { useApiQuery } from "@/lib/query";
import { LedgerDialog, ReceiveDialog, ReverseDialog } from "./b/PaymentLedger";
import { CancelDialog, GenerateDialog, NewPaymentDialog, PAYMENT_KEYS, PayDialog, type PickedStudent, ReceiptDialog, type ReceiptTarget, useParamPatch } from "./b/PaymentParts";
import { BalancesTab, ChargesTab, TransactionsTab, useChargeFilters, useTxFilters } from "./b/PaymentTabs";
import { downloadCsv, periodLabel } from "./b/shared";
import type { PaymentPeriods, PaymentRow, PaymentTx } from "./b/types";

export default function AdminPaymentsPage() {
  const periodsQ = useApiQuery<PaymentPeriods>(["admin", "payments", "periods"], "/admin/payments/periods");
  const pd = periodsQ.data;
  const defaultPeriod = pd ? (pd.items.some((i) => i.period === pd.current) ? pd.current : pd.latest) : "";
  const [periodParam, setPeriod] = useSearchParamState("p");
  const period = periodParam || defaultPeriod;
  const [sp] = useSearchParams();
  const [tabParam] = useSearchParamState("t");
  // eski havolalar (?p=, ?status=) oylik hisoblar tabiga olib boradi
  const tab = tabParam || (sp.get("p") || sp.get("s") || sp.get("status") ? "charges" : "balance");
  const patch = useParamPatch();

  const [ledgerId] = useSearchParamState("ledger");
  const [receiveParam] = useSearchParamState("receive");
  const [newFlag] = useFlagParam("new");
  const [receiveStudent, setReceiveStudent] = useState<PickedStudent | null>(null);
  const [receipt, setReceipt] = useState<ReceiptTarget | null>(null);
  const [reverseTx, setReverseTx] = useState<PaymentTx | null>(null);
  const [payRow, setPayRow] = useState<PaymentRow | null>(null);
  const [cancelRow, setCancelRow] = useState<PaymentRow | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [newChargeOpen, setNewChargeOpen] = useState(false);
  const cf = useChargeFilters();
  const tf = useTxFilters();

  const receiveOpen = newFlag || !!receiveParam;
  const receiveId = receiveParam && receiveParam !== "1" ? receiveParam : null;
  const initialStudent = receiveId ? (receiveStudent?.id === receiveId ? receiveStudent : { id: receiveId, fullName: "", code: "" }) : null;
  const openReceive = (s?: PickedStudent) => {
    setReceiveStudent(s ?? null);
    patch({ receive: s ? s.id : "1", new: null });
  };
  const openLedger = (id: string) => patch({ ledger: id });
  const openReceipt = (t: ReceiptTarget) => setReceipt(t);

  return (
    <>
      <PageHeader
        title="Toʻlovlar va moliyaviy hisob"
        documentTitle="Toʻlovlar"
        subtitle="Oʻquvchilar balansi, oylik hisoblar va kassaga kelgan tushumlar"
        breadcrumbs={[{ label: "Boshqaruv markazi", to: "/admin" }, { label: "Toʻlovlar" }]}
        actions={
          <>
            <DropdownMenu
              label="CSV eksport"
              align="end"
              trigger={
                <Button variant="secondary" icon="file_download" iconRight="expand_more">
                  Eksport
                </Button>
              }
              items={[
                {
                  label: "Oylik hisoblar (CSV)",
                  icon: "receipt_long",
                  description: period ? `${periodLabel(period)} · joriy filtrlar bilan` : undefined,
                  disabled: !period,
                  onSelect: () => downloadCsv("/admin/payments/export.csv", { period, ...cf.params }, `tolovlar-${period}.csv`),
                },
                {
                  label: "Tushumlar (CSV)",
                  icon: "payments",
                  description: `${tf.label} · kassa daftari`,
                  onSelect: () => downloadCsv("/admin/payments/transactions/export.csv", tf.params, `tushumlar-${tf.params.from ?? "boshidan"}-${tf.params.to ?? ""}.csv`),
                },
              ]}
            />
            <Button variant="outline" icon="receipt_long" onClick={() => setGenOpen(true)} disabled={!period}>
              Oylik hisob-kitob
            </Button>
            <Button icon="payments" onClick={() => openReceive()}>
              Toʻlov qabul qilish
            </Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => patch({ t: v })}>
        <TabsList>
          <TabsTrigger value="balance" icon="account_balance_wallet">
            Qarzdorlar va balans
          </TabsTrigger>
          <TabsTrigger value="charges" icon="receipt_long">
            Oylik hisoblar
          </TabsTrigger>
          <TabsTrigger value="tx" icon="payments">
            Tushumlar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="balance" className="mt-6 min-w-0">
          <BalancesTab onReceive={openReceive} onLedger={openLedger} />
        </TabsContent>
        <TabsContent value="charges" className="mt-6 min-w-0">
          <ChargesTab
            period={period}
            setPeriod={(p) => setPeriod(p === defaultPeriod ? null : p)}
            periods={pd?.items.map((i) => i.period) ?? []}
            loadingPeriods={periodsQ.isLoading}
            onPay={setPayRow}
            onCancel={setCancelRow}
            onReceipt={openReceipt}
            onLedger={openLedger}
            onGenerate={() => setGenOpen(true)}
            onNewCharge={() => setNewChargeOpen(true)}
          />
        </TabsContent>
        <TabsContent value="tx" className="mt-6 min-w-0">
          <TransactionsTab onReceipt={openReceipt} onReverse={setReverseTx} onLedger={openLedger} />
        </TabsContent>
      </Tabs>

      <div className="mt-4 flex flex-col gap-1.5 text-body-sm text-on-surface-variant">
        <p className="flex items-start gap-1.5">
          <Icon name="event_repeat" size={16} className="mt-0.5 shrink-0 text-primary" />
          Oylik hisoblar har oyning 1-sanasida avtomatik yoziladi, toʻlov muddati — 5-sana; shu kuni qarzdorlarning ota-onalariga Telegram eslatma boradi.
        </p>
        <p className="flex items-start gap-1.5">
          <Icon name="verified_user" size={16} className="mt-0.5 shrink-0 text-primary" />
          Har bir qabul qilish va bekor qilish (storno) tizim jurnaliga oʻchirilmas yozuv sifatida tushadi.
        </p>
      </div>

      <ReceiveDialog open={receiveOpen} onOpenChange={(o) => !o && patch({ receive: null, new: null })} initialStudent={initialStudent} onReceived={(id) => openReceipt({ transactionId: id })} />
      <LedgerDialog
        studentId={ledgerId || null}
        open={!!ledgerId}
        onOpenChange={(o) => !o && patch({ ledger: null })}
        onReceive={openReceive}
        onReceipt={openReceipt}
        onReverse={setReverseTx}
        onPay={setPayRow}
      />
      <PayDialog payment={payRow} open={!!payRow} onOpenChange={(o) => !o && setPayRow(null)} onPaid={(id) => openReceipt({ transactionId: id })} />
      <CancelDialog payment={cancelRow} open={!!cancelRow} onOpenChange={(o) => !o && setCancelRow(null)} onOpenLedger={openLedger} />
      <ReverseDialog tx={reverseTx} open={!!reverseTx} onOpenChange={(o) => !o && setReverseTx(null)} />
      <ReceiptDialog target={receipt} open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)} />
      {period ? <GenerateDialog open={genOpen} onOpenChange={setGenOpen} defaultPeriod={period} periods={pd?.items.map((i) => i.period) ?? []} /> : null}
      {period ? <NewPaymentDialog open={newChargeOpen} onOpenChange={setNewChargeOpen} defaultPeriod={period} onPaid={(id) => openReceipt({ transactionId: id })} /> : null}
    </>
  );
}

export { PAYMENT_KEYS };
