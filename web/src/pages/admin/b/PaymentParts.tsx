// Toʻlovlar sahifasi dialoglari: qabul qilish, kvitansiya (chop etish), bekor qilish, oylik hisob-kitob, yangi toʻlov.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Alert, Badge, Button, Checkbox, Dialog, Field, Icon, Input, Select, Skeleton, Textarea } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtDate, fmtDateTime, fmtMoney, fmtNum, todayYmd } from "@/lib/format";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { StudentPicker } from "./ParentParts";
import { METHOD, PAY_STATUS, periodLabel, PeriodSelect, useFormOptions } from "./shared";
import { useStudentDetail } from "./StudentPanel";
import type { PaymentMethod, PaymentRow, Receipt } from "./types";

export const PAYMENT_KEYS = [["admin", "payments"], ["admin", "reports"], ["admin", "students"], ["admin", "audit"], ["me", "nav-badges"]];
const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Xatolik yuz berdi");

function MethodPicker({ value, onChange }: { value: PaymentMethod; onChange: (m: PaymentMethod) => void }) {
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

// ─────────── Qabul qilish ───────────

export function PayDialog({ payment, open, onOpenChange, onPaid }: { payment: PaymentRow | null; open: boolean; onOpenChange: (o: boolean) => void; onPaid: (id: string) => void }) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [date, setDate] = useState(todayYmd());
  const [note, setNote] = useState("");
  useEffect(() => {
    if (open) {
      setMethod("CASH");
      setDate(todayYmd());
      setNote("");
    }
  }, [open]);
  const pay = useApiMutation(() => api.post<PaymentRow>(`/admin/payments/${payment?.id}/pay`, { method, paidAt: date, note: note.trim() || undefined }), {
    invalidate: PAYMENT_KEYS,
    success: (r) => `Toʻlov qabul qilindi · ${r.receiptNo}`,
    onSuccess: (r) => {
      onOpenChange(false);
      onPaid(r.id);
    },
  });
  if (!payment) return null;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Toʻlovni qabul qilish"
      description="Kvitansiya raqami avtomatik beriladi, ota-onaga xabar yuboriladi."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button icon="check_circle" loading={pay.isPending} onClick={() => pay.mutate()}>
            {fmtMoney(payment.amount)} qabul qilish
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low p-4">
          <div className="min-w-0">
            <p className="truncate font-label-lg text-label-lg">{payment.student.fullName}</p>
            <p className="text-body-sm text-on-surface-variant">
              #{payment.student.code} · {payment.group?.name ?? "Qoʻshimcha toʻlov"} · {periodLabel(payment.period)}
            </p>
          </div>
          <span className="shrink-0 font-headline-md text-headline-md tabular-nums">{fmtMoney(payment.amount)}</span>
        </div>
        {payment.status === "OVERDUE" ? <Alert tone="danger">Muddati {fmtNum(payment.daysOverdue)} kun oldin oʻtgan.</Alert> : null}
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

export function ReceiptDialog({ paymentId, open, onOpenChange }: { paymentId: string | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const r = useApiQuery<Receipt>(["admin", "payments", "receipt", paymentId], open && paymentId ? `/admin/payments/${paymentId}/receipt` : null);
  const d = r.data;
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
          {d.status === "CANCELLED" ? (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="-rotate-12 rounded-lg border-4 border-error px-4 py-1 font-headline-lg text-headline-lg text-error opacity-60">BEKOR QILINGAN</span>
            </span>
          ) : null}
          <div className="flex items-start justify-between gap-3 border-b border-dashed border-outline-variant pb-3">
            <div>
              <p className="font-headline-sm text-headline-sm text-navy">{d.center.name}</p>
              <p className="text-body-sm text-on-surface-variant">{[d.center.branch, d.center.address].filter(Boolean).join(", ")}</p>
              {d.center.phone ? <p className="text-body-sm text-on-surface-variant">Tel: {d.center.phone}</p> : null}
            </div>
            <div className="text-right">
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
            <dd className="text-right font-medium">{d.group ? d.group.name : "Qoʻshimcha toʻlov"}</dd>
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
          <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-4 py-3">
            <span className="font-label-lg text-label-lg">Jami toʻlandi</span>
            <span className="font-headline-md text-headline-md tabular-nums">{d.amountLabel}</span>
          </div>
          <div className="mt-6 flex items-end justify-between gap-4 text-body-sm text-on-surface-variant">
            <span>Qabul qildi: {d.cashier ?? "—"}</span>
            <span>Imzo: ____________</span>
          </div>
        </div>
      )}
    </Dialog>
  );
}

// ─────────── Bekor qilish ───────────

export function CancelDialog({ payment, open, onOpenChange }: { payment: PaymentRow | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (open) setReason("");
  }, [open]);
  const cancel = useApiMutation(() => api.post(`/admin/payments/${payment?.id}/cancel`, { reason: reason.trim() }), {
    invalidate: PAYMENT_KEYS,
    success: "Toʻlov bekor qilindi",
    onSuccess: () => onOpenChange(false),
  });
  if (!payment) return null;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Toʻlovni bekor qilish"
      description={`${payment.student.fullName} · ${periodLabel(payment.period)} · ${fmtMoney(payment.amount)}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Orqaga
          </Button>
          <Button variant="danger" disabled={reason.trim().length < 3} loading={cancel.isPending} onClick={() => cancel.mutate()}>
            Bekor qilish
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {payment.status === "PAID" ? <Alert tone="warning">Bu toʻlov qabul qilingan ({payment.receiptNo}). Bekor qilinsa yigʻilgan summadan chiqariladi.</Alert> : null}
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
  const [dueDate, setDueDate] = useState(`${defaultPeriod}-25`);
  const [groupId, setGroupId] = useState("");
  const [notify, setNotify] = useState(true);
  const opts = useFormOptions();
  useEffect(() => {
    if (open) {
      setPeriod(defaultPeriod);
      setDueDate(`${defaultPeriod}-25`);
      setGroupId("");
      setNotify(true);
    }
  }, [open, defaultPeriod]);
  const gen = useApiMutation(
    () => api.post<{ created: number; skippedExisting: number; skippedInactive: number; totalAmount: number }>("/admin/payments/generate", { period, dueDate, groupId: groupId || undefined, notify }),
    {
      invalidate: PAYMENT_KEYS,
      success: (r) => `${fmtNum(r.created)} ta hisob yaratildi (${fmtMoney(r.totalAmount)}) · ${fmtNum(r.skippedExisting)} ta avval bor edi`,
      onSuccess: () => onOpenChange(false),
    },
  );
  const [y, m] = period.split("-").map(Number);
  const next = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}`;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Oylik hisob-kitob"
      description="Faol guruhlardagi faol oʻquvchilar uchun «kutilmoqda» holatidagi oylik toʻlov yaratiladi. Mavjud hisoblar takrorlanmaydi."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button icon="receipt_long" loading={gen.isPending} disabled={!dueDate} onClick={() => gen.mutate()}>
            Hisoblarni yaratish
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Davr">
          <PeriodSelect value={period} onChange={(p) => (setPeriod(p), setDueDate(`${p}-25`))} periods={[...periods, next, defaultPeriod]} />
        </Field>
        <Field label="Toʻlov muddati">
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
          Akademik taʼtildagi va ketgan oʻquvchilarga hisob yozilmaydi. Summa — guruhning oylik toʻlovi.
        </Alert>
      </div>
    </Dialog>
  );
}

// ─────────── Yangi toʻlov (qoʻlda) ───────────

export function NewPaymentDialog({ open, onOpenChange, defaultPeriod, onPaid }: { open: boolean; onOpenChange: (o: boolean) => void; defaultPeriod: string; onPaid: (id: string) => void }) {
  const [student, setStudent] = useState<{ id: string; fullName: string; code: string } | null>(null);
  const [groupId, setGroupId] = useState("");
  const [period, setPeriod] = useState(defaultPeriod);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(todayYmd());
  const [note, setNote] = useState("");
  const [payNow, setPayNow] = useState(true);
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
      setPayNow(true);
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

  const amountNum = Number(amount.replace(/\D/g, ""));
  const save = useApiMutation(
    () =>
      api.post<PaymentRow>("/admin/payments", {
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
      success: (r) => (r.status === "PAID" ? `Toʻlov qabul qilindi · ${r.receiptNo}` : "Hisob yaratildi"),
      onSuccess: (r) => {
        onOpenChange(false);
        if (r.status === "PAID") onPaid(r.id);
      },
      onError: (e) => setError(errMsg(e)),
    },
  );
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Yangi toʻlov"
      description="Qoʻlda hisob yaratish yoki kassada qabul qilingan toʻlovni kiritish"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button icon={payNow ? "check_circle" : "add"} disabled={!student || amountNum < 1000} loading={save.isPending} onClick={() => (setError(null), save.mutate())}>
            {payNow ? "Qabul qilish" : "Hisob yaratish"}
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
            <Input inputMode="numeric" value={amount ? fmtNum(amountNum) : ""} onChange={(e) => setAmount(e.target.value)} rightSlot={<span className="pr-2 text-body-sm">soʻm</span>} />
          </Field>
          <Field label="Muddat">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="Izoh" className="sm:col-span-2">
            <Input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="Masalan: darslik uchun" />
          </Field>
        </div>
        <Checkbox checked={payNow} onChange={(e) => setPayNow(e.target.checked)} label="Toʻlov hozir qabul qilindi" description="Kvitansiya raqami beriladi va ota-onaga xabar ketadi" />
        {payNow ? (
          <Field label="Toʻlov usuli">
            <MethodPicker value={method} onChange={setMethod} />
          </Field>
        ) : null}
        {student && detail.data?.payments.some((p) => p.period === period && p.status !== "CANCELLED" && p.group?.id === groupId) ? (
          <Alert tone="warning">
            {periodLabel(period)} uchun bu guruh hisobi allaqachon bor — roʻyxatdan «Qabul qilish» tugmasini ishlating.
          </Alert>
        ) : null}
      </div>
    </Dialog>
  );
}

export function StatusCell({ p }: { p: PaymentRow }) {
  const s = PAY_STATUS[p.status];
  return (
    <div className="flex min-w-[130px] flex-col items-start gap-1">
      <Badge tone={s.tone} icon={s.icon} variant={p.status === "OVERDUE" ? "solid" : "soft"}>
        {s.label}
      </Badge>
      <span className={cn("whitespace-nowrap text-body-sm tabular-nums", p.status === "OVERDUE" ? "text-error" : "text-on-surface-variant")}>
        {p.status === "PAID"
          ? `Chek: ${p.receiptNo ?? "—"}`
          : p.status === "OVERDUE"
            ? `${fmtNum(p.daysOverdue)} kun kechikkan`
            : p.status === "PENDING"
              ? `Muddat: ${fmtDate(p.dueDate ?? "", { year: false })}`
              : (p.note?.split("Bekor qilindi: ")[1] ?? "Bekor qilingan")}
      </span>
    </div>
  );
}
