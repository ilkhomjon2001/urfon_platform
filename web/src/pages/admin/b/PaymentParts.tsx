// Toʻlovlar sahifasi: umumiy yordamchilar va dialoglar — hisobni qabul qilish (qisman ham), kvitansiya (chop etish),
// hisobni bekor qilish, oylik hisob-kitob, qoʻlda hisob. Balans daftari (qabul qilish, storno) — PaymentLedger.tsx.
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { Alert, Badge, Button, buttonVariants, Checkbox, Dialog, Field, Icon, Input, Select, Skeleton, Textarea } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtDate, fmtDateTime, fmtMoney, fmtNum, todayYmd } from "@/lib/format";
import { useSearchParamState } from "@/lib/hooks";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { StudentPicker } from "./ParentParts";
import { METHOD, PAY_STATUS, periodLabel, PeriodSelect, useFormOptions } from "./shared";
import { useStudentDetail } from "./StudentPanel";
import type { ChargeReceipt, GenerateResult, PaymentMethod, PaymentRow, Receipt, StudentBalance, TxAllocation } from "./types";

export const PAYMENT_KEYS = [["admin", "payments"], ["admin", "reports"], ["admin", "students"], ["admin", "audit"], ["me", "nav-badges"]];
export const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Xatolik yuz berdi");

export type PickedStudent = { id: string; fullName: string; code: string };
export type ReceiptTarget = { paymentId: string } | { transactionId: string };

// ─────────── Yordamchilar ───────────

/** "425 000" → 425000 */
export const parseAmount = (s: string) => Number(s.replace(/\D/g, "")) || 0;

export const isOpenCharge = (p: Pick<PaymentRow, "status">) => p.status === "PENDING" || p.status === "OVERDUE";
export const isPartial = (p: Pick<PaymentRow, "status" | "paidAmount">) => isOpenCharge(p) && p.paidAmount > 0;

/** Pul taqsimlanish tartibi (api lib/billing.ts → applyCredit bilan bir xil): muddat, davr, yaratilgan vaqt. */
export function chargeOrder(a: PaymentRow, b: PaymentRow) {
  return (a.dueDate ?? "").localeCompare(b.dueDate ?? "") || a.period.localeCompare(b.period) || String(a.createdAt).localeCompare(String(b.createdAt));
}

export interface PreviewLine {
  charge: PaymentRow;
  take: number;
  closes: boolean;
  left: number;
}

/** Summa ochiq hisoblarga qanday taqsimlanishi (eng eskisidan), ortigʻi — avans. Faqat koʻrsatish uchun; haqiqiy taqsimot serverda. */
export function allocationPreview(charges: PaymentRow[], amount: number) {
  const lines: PreviewLine[] = [];
  let rest = Math.max(0, amount);
  for (const c of charges.filter(isOpenCharge).sort(chargeOrder)) {
    if (rest <= 0) break;
    if (c.outstanding <= 0) continue;
    const take = Math.min(c.outstanding, rest);
    rest -= take;
    lines.push({ charge: c, take, closes: take === c.outstanding, left: c.outstanding - take });
  }
  return { lines, advance: rest, allocated: amount - rest };
}

/** Bir tushum bir hisobga bir necha boʻlib taqsimlangan boʻlishi mumkin — hisob boʻyicha jamlanadi. */
export function mergeAllocations(list: TxAllocation[]) {
  const m = new Map<string, TxAllocation>();
  for (const a of list) {
    const cur = m.get(a.paymentId);
    m.set(a.paymentId, cur ? { ...cur, amount: cur.amount + a.amount } : { ...a });
  }
  return [...m.values()].sort((a, b) => a.period.localeCompare(b.period));
}

/** Hisobni yopgan tushumlar (tushum boʻyicha jamlangan). */
export function groupReceipts(list: ChargeReceipt[]) {
  const m = new Map<string, ChargeReceipt>();
  for (const r of list) {
    const cur = m.get(r.transactionId);
    m.set(r.transactionId, cur ? { ...cur, amount: cur.amount + r.amount } : { ...r });
  }
  return [...m.values()];
}

const SHORT_MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
/** "2026-09" → "Sen 2026" */
export function shortPeriod(period: string) {
  const [y, m] = period.split("-").map(Number);
  return `${SHORT_MONTHS[m - 1] ?? ""} ${y}`;
}

/** Bir nechta URL parametrini bitta navigatsiyada oʻzgartirish (ketma-ket setSearchParams bir-birini bosib ketadi). */
export function useParamPatch() {
  const [, setParams] = useSearchParams();
  return useCallback(
    (patch: Record<string, string | null | undefined>) =>
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v == null || v === "") p.delete(k);
            else p.set(k, v);
          }
          return p;
        },
        { replace: true },
      ),
    [setParams],
  );
}

/** Sahifa raqami URL'da; filtrlar oʻzgarsa 1-sahifaga qaytadi. */
export function usePageParam(key: string, filterKey: string): [number, (p: number) => void] {
  const [pageStr, setPageStr] = useSearchParamState(key, "1");
  const page = Math.max(1, Number(pageStr) || 1);
  const [last, setLast] = useState(filterKey);
  useEffect(() => {
    if (filterKey !== last) {
      setLast(filterKey);
      if (page !== 1) setPageStr(null);
    }
  }, [filterKey, last, page, setPageStr]);
  return [page, (p: number) => setPageStr(String(p))];
}

export function MethodBadge({ method, muted }: { method: PaymentMethod; muted?: boolean }) {
  return (
    <Badge tone={muted ? "neutral" : "primary"} icon={METHOD[method].icon}>
      {METHOD[method].label}
    </Badge>
  );
}

/** Pul maydoni: raqamlar guruhlab koʻrsatiladi, qiymat — faqat raqamlar satri. */
export function MoneyInput({ value, onChange, size = "md", autoFocus }: { value: string; onChange: (digits: string) => void; size?: "md" | "lg"; autoFocus?: boolean }) {
  return (
    <Input
      inputMode="numeric"
      autoComplete="off"
      size={size}
      autoFocus={autoFocus}
      value={value ? fmtNum(parseAmount(value)) : ""}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 9))}
      placeholder="0"
      className="font-semibold tabular-nums"
      rightSlot={<span className="pr-2 text-body-sm">soʻm</span>}
    />
  );
}

export function MethodPicker({ value, onChange }: { value: PaymentMethod; onChange: (m: PaymentMethod) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Toʻlov usuli">
      {(Object.keys(METHOD) as PaymentMethod[]).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={value === m}
          onClick={() => onChange(m)}
          className={cn(
            "flex h-10 items-center gap-2 rounded-lg border px-3 text-left font-label-md text-label-md transition-colors",
            value === m ? "border-primary bg-primary-fixed/50 text-primary" : "border-outline-variant text-on-surface hover:bg-surface-container-low",
          )}
        >
          <Icon name={METHOD[m].icon} size={18} />
          <span className="truncate">{METHOD[m].label}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────── Hisobni qabul qilish (qisman ham) ───────────

type PayResult = PaymentRow & { transactionId: string; receiptNo: string; balance: StudentBalance };

export function PayDialog({
  payment,
  open,
  onOpenChange,
  onPaid,
}: {
  payment: PaymentRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPaid: (transactionId: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [date, setDate] = useState(todayYmd());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const remaining = payment ? payment.outstanding || payment.amount - payment.paidAmount : 0;
  useEffect(() => {
    if (open) {
      setAmount(String(remaining || ""));
      setMethod("CASH");
      setDate(todayYmd());
      setNote("");
      setError(null);
    }
    // faqat oyna ochilganda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payment?.id]);
  const amountNum = parseAmount(amount);
  const pay = useApiMutation(
    () => api.post<PayResult>(`/admin/payments/${payment?.id}/pay`, { method, paidAt: date, note: note.trim() || undefined, amount: amountNum }),
    {
      invalidate: PAYMENT_KEYS,
      silentError: true,
      success: (r) => `Toʻlov qabul qilindi · ${r.receiptNo}`,
      onSuccess: (r) => {
        onOpenChange(false);
        onPaid(r.transactionId);
      },
      onError: (e) => setError(errMsg(e)),
    },
  );
  if (!payment) return null;
  const tooSmall = amountNum < 1000;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Hisobni qabul qilish"
      description="Toʻliq yoki qisman qabul qilish mumkin. Kvitansiya raqami avtomatik beriladi, ota-onaga xabar yuboriladi."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button icon="check_circle" loading={pay.isPending} disabled={tooSmall} onClick={() => (setError(null), pay.mutate())}>
            {tooSmall ? "Qabul qilish" : `${fmtMoney(amountNum)} qabul qilish`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-4">
          <div className="min-w-0">
            <p className="truncate font-label-lg text-label-lg">{payment.student.fullName}</p>
            <p className="text-body-sm text-on-surface-variant">
              #{payment.student.code} · {payment.group?.name ?? "Qoʻshimcha toʻlov"} · {periodLabel(payment.period)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-headline-md text-headline-md tabular-nums">{fmtMoney(payment.amount)}</p>
            {payment.paidAmount > 0 ? (
              <p className="text-body-sm tabular-nums text-on-surface-variant">
                {fmtNum(payment.paidAmount)} toʻlangan · qoldiq <b className="text-on-surface">{fmtNum(remaining)}</b>
              </p>
            ) : null}
          </div>
        </div>
        {payment.status === "OVERDUE" ? <Alert tone="danger">Muddati {fmtNum(payment.daysOverdue)} kun oldin oʻtgan.</Alert> : null}
        <Field
          label="Qabul qilinadigan summa"
          required
          labelAction={
            amountNum !== remaining ? (
              <Button variant="link" size="sm" onClick={() => setAmount(String(remaining))}>
                Qoldiq: {fmtMoney(remaining)}
              </Button>
            ) : undefined
          }
          hint={
            tooSmall
              ? "Kamida 1 000 soʻm"
              : amountNum < remaining
                ? `Qisman toʻlov — ${fmtMoney(remaining - amountNum)} ochiq qoladi`
                : amountNum > remaining
                  ? `Ortigʻi (${fmtMoney(amountNum - remaining)}) boshqa ochiq oylarga yoki avansga oʻtadi`
                  : "Hisob toʻliq yopiladi"
          }
        >
          <MoneyInput value={amount} onChange={setAmount} />
        </Field>
        <Field label="Toʻlov usuli" required>
          <MethodPicker value={method} onChange={setMethod} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Toʻlov sanasi">
            <Input type="date" value={date} max={todayYmd()} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Izoh" hint="Masalan: Payme chek raqami">
            <Input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}

// ─────────── Kvitansiya ───────────

const PRINT_CSS = `@media print {
  body * { visibility: hidden !important; }
  #urfon-receipt-print, #urfon-receipt-print * { visibility: visible !important; }
  #urfon-receipt-print { position: fixed !important; left: 0; top: 0; width: 100%; padding: 24px; background: #fff; box-shadow: none !important; }
  @page { size: A5; margin: 12mm; }
}`;

export function receiptPath(t: ReceiptTarget) {
  return "transactionId" in t ? `/admin/payments/transactions/${t.transactionId}/receipt` : `/admin/payments/${t.paymentId}/receipt`;
}

export function ReceiptDialog({ target, open, onOpenChange }: { target: ReceiptTarget | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const path = target ? receiptPath(target) : null;
  const r = useApiQuery<Receipt>(["admin", "payments", "receipt", path], open && path ? path : null);
  const d = r.data;
  const allocs = d ? mergeAllocations(d.allocations ?? []) : [];
  const cancelled = d?.status === "CANCELLED";
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Toʻlov kvitansiyasi"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Yopish
          </Button>
          <Button icon="print" disabled={!d} onClick={() => window.print()}>
            Chop etish
          </Button>
        </>
      }
    >
      {typeof document !== "undefined" ? createPortal(<style>{PRINT_CSS}</style>, document.head) : null}
      {r.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : r.error || !d ? (
        <Alert tone="danger">{r.error?.message ?? "Kvitansiya topilmadi"}</Alert>
      ) : (
        <div id="urfon-receipt-print" className="relative overflow-hidden rounded-xl border border-outline-variant p-5 text-on-surface">
          {cancelled ? (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="-rotate-12 rounded-lg border-4 border-error px-4 py-1 font-headline-lg text-headline-lg text-error opacity-60">BEKOR QILINGAN</span>
            </span>
          ) : null}
          <div className="flex items-start justify-between gap-3 border-b border-dashed border-outline-variant pb-3">
            <div className="min-w-0">
              <p className="font-headline-sm text-headline-sm text-navy">{d.center.name}</p>
              <p className="text-body-sm text-on-surface-variant">{[d.center.branch, d.center.address].filter(Boolean).join(", ")}</p>
              {d.center.phone ? <p className="text-body-sm text-on-surface-variant">Tel: {d.center.phone}</p> : null}
            </div>
            <div className="shrink-0 text-right">
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Kvitansiya</p>
              <p className="font-mono text-body-md font-semibold">№ {d.receiptNo}</p>
            </div>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 py-4 text-body-sm">
            <dt className="text-on-surface-variant">Sana:</dt>
            <dd className="text-right font-medium">{fmtDateTime(d.paidAt)}</dd>
            <dt className="text-on-surface-variant">Oʻquvchi:</dt>
            <dd className="text-right font-medium">
              {d.student.fullName} (#{d.student.code})
            </dd>
            {d.payers.length ? (
              <>
                <dt className="text-on-surface-variant">Toʻlovchi:</dt>
                <dd className="text-right font-medium">{d.payers.join(", ")}</dd>
              </>
            ) : null}
            <dt className="text-on-surface-variant">Guruh:</dt>
            <dd className="text-right font-medium">{d.group ? d.group.name : "—"}</dd>
            <dt className="text-on-surface-variant">Toʻlov davri:</dt>
            <dd className="text-right font-medium">{d.periodLabel}</dd>
            <dt className="text-on-surface-variant">Toʻlov usuli:</dt>
            <dd className="text-right font-medium">{d.methodLabel ?? "—"}</dd>
            {d.note ? (
              <>
                <dt className="text-on-surface-variant">Izoh:</dt>
                <dd className="text-right">{d.note}</dd>
              </>
            ) : null}
          </dl>
          {allocs.length || d.advance > 0 ? (
            <div className="mb-3 border-t border-dashed border-outline-variant pt-3">
              <p className="mb-1.5 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Qaysi oylar uchun</p>
              <ul className="flex flex-col gap-1 text-body-sm">
                {allocs.map((a) => (
                  <li key={a.paymentId} className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0">
                      {a.periodLabel}
                      {a.group ? <span className="text-on-surface-variant"> · {a.group.name}</span> : null}
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">{fmtMoney(a.amount)}</span>
                  </li>
                ))}
                {d.advance > 0 ? (
                  <li className="flex items-baseline justify-between gap-3">
                    <span>Avans (keyingi oylar uchun)</span>
                    <span className="shrink-0 font-medium tabular-nums">{fmtMoney(d.advance)}</span>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
          <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-4 py-3">
            <span className="font-label-lg text-label-lg">Jami toʻlandi</span>
            <span className={cn("font-headline-md text-headline-md tabular-nums", cancelled && "line-through")}>{d.amountLabel}</span>
          </div>
          {d.reversed ? (
            <p className="mt-3 text-body-sm text-error">
              Bekor qilingan (storno): {fmtDateTime(d.reversed.at)}
              {d.reversed.by ? ` · ${d.reversed.by}` : ""}
              {d.reversed.reason ? ` · Sabab: ${d.reversed.reason}` : ""}
            </p>
          ) : null}
          <div className="mt-6 flex items-end justify-between gap-4 text-body-sm text-on-surface-variant">
            <span>Qabul qildi: {d.cashier ?? "—"}</span>
            <span>Imzo: ____________</span>
          </div>
        </div>
      )}
    </Dialog>
  );
}

// ─────────── Hisobni bekor qilish ───────────

export function CancelDialog({
  payment,
  open,
  onOpenChange,
  onOpenLedger,
}: {
  payment: PaymentRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onOpenLedger: (studentId: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
    }
  }, [open]);
  const cancel = useApiMutation(() => api.post(`/admin/payments/${payment?.id}/cancel`, { reason: reason.trim() }), {
    invalidate: PAYMENT_KEYS,
    silentError: true,
    success: "Hisob bekor qilindi",
    onSuccess: () => onOpenChange(false),
    onError: (e) => setError(errMsg(e)),
  });
  if (!payment) return null;
  const ledgerBtn = (
    <Button
      variant="outline"
      size="sm"
      icon="account_balance_wallet"
      onClick={() => {
        onOpenChange(false);
        onOpenLedger(payment.student.id);
      }}
    >
      Toʻlov daftari
    </Button>
  );
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Hisobni bekor qilish"
      description={`${payment.student.fullName} · ${periodLabel(payment.period)} · ${fmtMoney(payment.amount)}`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Orqaga
          </Button>
          <Button variant="danger" disabled={reason.trim().length < 3} loading={cancel.isPending} onClick={() => (setError(null), cancel.mutate())}>
            Hisobni bekor qilish
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {error ? (
          <Alert tone="danger" title="Bekor qilib boʻlmadi" action={ledgerBtn}>
            {error}
          </Alert>
        ) : payment.paidAmount > 0 ? (
          <Alert tone="warning" title="Bu hisobga pul taqsimlangan" action={ledgerBtn}>
            {fmtMoney(payment.paidAmount)} toʻlangan ({groupReceipts(payment.receipts).map((r) => r.receiptNo).join(", ") || payment.receiptNo}). Avval shu tushumni
            «Tushumlar» boʻlimida yoki oʻquvchi daftarida bekor qiling (storno).
          </Alert>
        ) : (
          <p className="text-body-sm text-on-surface-variant">Hisob roʻyxatda «Bekor qilingan» boʻlib qoladi va qarzdorlikka qoʻshilmaydi.</p>
        )}
        <Field label="Sabab" required hint="Jurnalga yoziladi, oʻchirib boʻlmaydi">
          <Textarea rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Masalan: dublikat hisob" />
        </Field>
      </div>
    </Dialog>
  );
}

// ─────────── Oylik hisob-kitob ───────────

export function GenerateDialog({ open, onOpenChange, defaultPeriod, periods }: { open: boolean; onOpenChange: (o: boolean) => void; defaultPeriod: string; periods: string[] }) {
  const [period, setPeriod] = useState(defaultPeriod);
  const [dueDate, setDueDate] = useState(`${defaultPeriod}-05`);
  const [groupId, setGroupId] = useState("");
  const [notify, setNotify] = useState(true);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const opts = useFormOptions();
  useEffect(() => {
    if (open) {
      setPeriod(defaultPeriod);
      setDueDate(`${defaultPeriod}-05`);
      setGroupId("");
      setNotify(true);
      setResult(null);
    }
  }, [open, defaultPeriod]);
  const gen = useApiMutation(() => api.post<GenerateResult>("/admin/payments/generate", { period, dueDate, groupId: groupId || undefined, notify }), {
    invalidate: PAYMENT_KEYS,
    success: (r) => `${periodLabel(r.period)}: ${fmtNum(r.created)} ta hisob yaratildi`,
    onSuccess: (r) => setResult(r),
  });
  const [y, m] = period.split("-").map(Number);
  const next = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}`;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Oylik hisob-kitob"
      description={
        result
          ? `${periodLabel(result.period)} · toʻlov muddati ${fmtDate(result.dueDate, { year: false })}`
          : "Har oyning 1-sanasida avtomatik bajariladi. Bu yerda qoʻlda ishga tushirish mumkin — mavjud hisoblar takrorlanmaydi."
      }
      footer={
        result ? (
          <>
            <Button variant="outline" icon="replay" onClick={() => setResult(null)}>
              Yana hisob-kitob
            </Button>
            <Button onClick={() => onOpenChange(false)}>Tayyor</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button icon="receipt_long" loading={gen.isPending} disabled={!dueDate} onClick={() => gen.mutate()}>
              Hisoblarni yaratish
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultStat label="Yangi hisoblar" value={`${fmtNum(result.created)} ta`} sub={fmtMoney(result.totalAmount)} strong />
            <ResultStat label="Avval yozilgan" value={`${fmtNum(result.skippedExisting)} ta`} sub="takrorlanmadi" />
            <ResultStat label="Faol emas" value={`${fmtNum(result.skippedInactive)} ta`} sub="taʼtildagi yoki ketgan" />
            <ResultStat label="Avansdan yopildi" value={fmtMoney(result.coveredByAdvance)} sub="oldindan toʻlanganlar" />
          </div>
          {result.waiting > 0 ? (
            <Alert
              tone="warning"
              icon="hourglass_top"
              title="Kutish roʻyxati"
              action={
                <Link to="/admin/guruhlar" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Guruhlar sahifasi
                </Link>
              }
            >
              {fmtNum(result.waiting)} ta oʻquvchi kutish roʻyxatida — guruh hali boshlanmagan, ularga hisob yozilmadi. Guruhlar sahifasida guruhni «Boshlash» qiling.
            </Alert>
          ) : null}
          {result.coveredByAdvance > 0 ? (
            <Alert tone="success" icon="savings">
              Avansi bor oʻquvchilarning yangi hisoblaridan {fmtMoney(result.coveredByAdvance)} avtomatik yopildi.
            </Alert>
          ) : null}
          {result.created === 0 && result.waiting === 0 ? (
            <Alert tone="primary">Yangi hisob yaratilmadi — {periodLabel(result.period)} uchun faol oʻquvchilarning hammasiga hisob allaqachon yozilgan.</Alert>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Davr">
            <PeriodSelect value={period} onChange={(p) => (setPeriod(p), setDueDate(`${p}-05`))} periods={[...periods, next, defaultPeriod]} />
          </Field>
          <Field
            label="Toʻlov muddati"
            hint={dueDate && dueDate < todayYmd() ? undefined : "Odatda oyning 5-sanasi"}
            error={dueDate && dueDate < todayYmd() ? "Bu sana oʻtib ketgan — yangi hisoblar darhol «muddati oʻtgan» boʻladi" : undefined}
          >
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="Guruh" className="sm:col-span-2">
            <Select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              options={[{ value: "", label: "Barcha faol guruhlar" }, ...(opts.data?.groups ?? []).map((g) => ({ value: g.id, label: `${g.name} · ${fmtMoney(g.monthlyFee)}` }))]}
            />
          </Field>
          <Checkbox className="sm:col-span-2" checked={notify} onChange={(e) => setNotify(e.target.checked)} label="Ota-onalarga yangi toʻlov haqida xabar yuborish" description="Telegram bot va kabinet bildirishnomasi" />
          <Alert tone="primary" className="sm:col-span-2">
            Akademik taʼtildagi, ketgan va kutish roʻyxatidagi (guruhi hali boshlanmagan) oʻquvchilarga hisob yozilmaydi. Summa — guruhning oylik toʻlovi; avansi bor
            oʻquvchining hisobi darhol yopiladi.
          </Alert>
        </div>
      )}
    </Dialog>
  );
}

function ResultStat({ label, value, sub, strong }: { label: string; value: string; sub?: string; strong?: boolean }) {
  return (
    <div className={cn("rounded-xl p-4", strong ? "bg-primary-fixed/50" : "bg-surface-container-low")}>
      <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
      <p className={cn("font-headline-sm text-headline-sm tabular-nums", strong ? "text-primary" : "text-on-surface")}>{value}</p>
      {sub ? <p className="text-body-sm text-on-surface-variant">{sub}</p> : null}
    </div>
  );
}

// ─────────── Qoʻlda hisob (ixtiyoriy darhol qabul qilish bilan) ───────────

export function NewPaymentDialog({
  open,
  onOpenChange,
  defaultPeriod,
  onPaid,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultPeriod: string;
  onPaid: (transactionId: string) => void;
}) {
  const [student, setStudent] = useState<PickedStudent | null>(null);
  const [groupId, setGroupId] = useState("");
  const [period, setPeriod] = useState(defaultPeriod);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(todayYmd());
  const [note, setNote] = useState("");
  const [payNow, setPayNow] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [error, setError] = useState<string | null>(null);
  const detail = useStudentDetail(student?.id ?? null);
  const groups = (detail.data?.groups ?? []).filter((g) => g.enrollmentStatus !== "LEFT");

  useEffect(() => {
    if (open) {
      setStudent(null);
      setGroupId("");
      setPeriod(defaultPeriod);
      setAmount("");
      setDueDate(todayYmd());
      setNote("");
      setPayNow(false);
      setMethod("CASH");
      setError(null);
    }
  }, [open, defaultPeriod]);
  useEffect(() => {
    if (groups.length && !groupId) {
      setGroupId(groups[0].id);
      setAmount(String(groups[0].monthlyFee));
    }
  }, [groups, groupId]);

  const amountNum = parseAmount(amount);
  const save = useApiMutation(
    () =>
      api.post<PaymentRow & { transactionId: string | null }>("/admin/payments", {
        studentId: student?.id,
        groupId: groupId || undefined,
        period,
        amount: amountNum,
        dueDate,
        note: note.trim() || undefined,
        ...(payNow ? { pay: { method, paidAt: todayYmd() } } : {}),
      }),
    {
      invalidate: PAYMENT_KEYS,
      silentError: true,
      success: (r) => (r.transactionId ? `Toʻlov qabul qilindi · ${r.receiptNo}` : "Hisob yaratildi"),
      onSuccess: (r) => {
        onOpenChange(false);
        if (r.transactionId) onPaid(r.transactionId);
      },
      onError: (e) => setError(errMsg(e)),
    },
  );
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Qoʻlda hisob yaratish"
      description="Oylik hisob-kitobdan tashqari hisob (masalan, darslik yoki qoʻshimcha dars). Oddiy pul qabul qilish uchun «Toʻlov qabul qilish» tugmasini ishlating."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button icon={payNow ? "check_circle" : "add"} disabled={!student || amountNum < 1000} loading={save.isPending} onClick={() => (setError(null), save.mutate())}>
            {payNow ? "Yaratish va qabul qilish" : "Hisob yaratish"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Field label="Oʻquvchi" required>
          <StudentPicker
            value={student}
            onChange={(s) => {
              setStudent(s);
              setGroupId("");
              setAmount("");
            }}
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Guruh">
            <Select
              value={groupId}
              onChange={(e) => {
                setGroupId(e.target.value);
                const g = groups.find((x) => x.id === e.target.value);
                if (g) setAmount(String(g.monthlyFee));
              }}
              options={[...groups.map((g) => ({ value: g.id, label: `${g.name} · ${fmtMoney(g.monthlyFee)}` })), { value: "", label: "Qoʻshimcha toʻlov (guruhsiz)" }]}
              disabled={!student}
            />
          </Field>
          <Field label="Davr">
            <PeriodSelect value={period} onChange={setPeriod} periods={[defaultPeriod]} />
          </Field>
          <Field label="Summa" required>
            <MoneyInput value={amount} onChange={setAmount} />
          </Field>
          <Field label="Muddat">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="Izoh" className="sm:col-span-2">
            <Input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="Masalan: darslik uchun" />
          </Field>
        </div>
        <Checkbox checked={payNow} onChange={(e) => setPayNow(e.target.checked)} label="Pul hozir qabul qilindi" description="Kvitansiya raqami beriladi va ota-onaga xabar ketadi" />
        {payNow ? (
          <Field label="Toʻlov usuli">
            <MethodPicker value={method} onChange={setMethod} />
          </Field>
        ) : null}
        {student && detail.data?.payments.some((p) => p.period === period && p.status !== "CANCELLED" && p.group?.id === groupId) ? (
          <Alert tone="warning">{periodLabel(period)} uchun bu guruh hisobi allaqachon bor — pulni «Toʻlov qabul qilish» orqali kiriting.</Alert>
        ) : null}
      </div>
    </Dialog>
  );
}

// ─────────── Jadval kataklari ───────────

export function StatusCell({ p }: { p: PaymentRow }) {
  const s = PAY_STATUS[p.status];
  const receipts = groupReceipts(p.receipts ?? []);
  return (
    <div className="flex min-w-[130px] flex-col items-start gap-1">
      <div className="flex flex-wrap items-center gap-1">
        <Badge tone={s.tone} icon={s.icon} variant={p.status === "OVERDUE" ? "solid" : "soft"}>
          {s.label}
        </Badge>
        {isPartial(p) ? (
          <Badge tone="gold" icon="donut_large">
            Qisman
          </Badge>
        ) : null}
      </div>
      <span className={cn("whitespace-nowrap text-body-sm tabular-nums", p.status === "OVERDUE" ? "text-error" : "text-on-surface-variant")}>
        {p.status === "PAID"
          ? receipts.length > 1
            ? `${fmtNum(receipts.length)} ta kvitansiya`
            : `Chek: ${p.receiptNo ?? "—"}`
          : p.status === "OVERDUE"
            ? `${fmtNum(p.daysOverdue)} kun kechikkan`
            : p.status === "PENDING"
              ? `Muddat: ${fmtDate(p.dueDate ?? "", { year: false })}`
              : (p.note?.split("Bekor qilindi: ")[1] ?? "Bekor qilingan")}
      </span>
    </div>
  );
}

export function AmountCell({ p }: { p: PaymentRow }) {
  return (
    <div className="flex flex-col">
      <span
        className={cn(
          "whitespace-nowrap font-headline-sm text-headline-sm tabular-nums",
          p.status === "OVERDUE" ? "text-error" : p.status === "CANCELLED" ? "text-on-surface-muted line-through" : "text-on-surface",
        )}
      >
        {fmtNum(p.amount)} <span className="text-body-sm font-normal">soʻm</span>
      </span>
      {isPartial(p) ? (
        <span className="whitespace-nowrap text-body-sm tabular-nums text-on-surface-variant">
          {fmtNum(p.paidAmount)} toʻlangan · qoldiq <b className={p.status === "OVERDUE" ? "text-error" : "text-on-surface"}>{fmtNum(p.outstanding)}</b>
        </span>
      ) : null}
    </div>
  );
}
