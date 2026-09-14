// Oʻquvchi toʻlov daftari (balans modeli): pul qabul qilish (istalgan summa, eng eski qarzdan yopiladi, ortigʻi avans),
// toʻliq daftar (hisoblar + tushumlar) va storno. API: /admin/payments/students/:id/ledger, /receive, /transactions/:id/reverse.
import { useEffect, useState } from "react";
import { Alert, Avatar, Badge, Button, Dialog, Field, Icon, IconButton, Input, Skeleton, Table, TBody, TD, TH, THead, TR, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtDate, fmtDateTime, fmtMoney, fmtNum, fmtPhone, todayYmd } from "@/lib/format";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { StudentPicker } from "./ParentParts";
import {
  allocationPreview,
  chargeOrder,
  errMsg,
  groupReceipts,
  isOpenCharge,
  isPartial,
  MethodBadge,
  MethodPicker,
  mergeAllocations,
  MoneyInput,
  parseAmount,
  PAYMENT_KEYS,
  type PickedStudent,
  type ReceiptTarget,
  shortPeriod,
  StatusCell,
} from "./PaymentParts";
import { periodLabel, relationOf, STUDENT_STATUS, TelegramDot } from "./shared";
import type { Ledger, PaymentMethod, PaymentRow, PaymentTx, ReceiveResult } from "./types";

export function useLedger(studentId: string | null) {
  return useApiQuery<Ledger>(["admin", "payments", "ledger", studentId], studentId ? `/admin/payments/students/${studentId}/ledger` : null);
}

/** Oylik toʻlov: faol (kutishda boʻlmagan) guruhlar yigʻindisi; hammasi kutishda boʻlsa — oʻsha guruhlarniki. */
function monthlyTotal(L: Ledger) {
  const active = L.groups.filter((g) => !g.waiting).reduce((s, g) => s + g.monthlyFee, 0);
  return active || L.groups.reduce((s, g) => s + g.monthlyFee, 0) || L.monthlyFee || 0;
}

// ─────────── Kichik qismlar ───────────

/** Jadvaldagi "Qarz / Avans" katagi. */
export function BalanceValue({ outstanding, advance, overdue, align = "right" }: { outstanding: number; advance: number; overdue?: number; align?: "left" | "right" }) {
  const cls = cn("flex flex-col", align === "right" ? "items-end text-right" : "items-start");
  if (outstanding > 0)
    return (
      <div className={cls}>
        <span className="whitespace-nowrap font-headline-sm text-headline-sm font-bold tabular-nums text-error">
          {fmtNum(outstanding)} <span className="hidden text-body-sm font-normal sm:inline">soʻm</span>
        </span>
        <span className="text-body-sm text-error">{overdue ? `Qarz · ${fmtNum(overdue)} muddati oʻtgan` : "Qarz"}</span>
      </div>
    );
  if (advance > 0)
    return (
      <div className={cls}>
        <span className="whitespace-nowrap font-headline-sm text-headline-sm font-bold tabular-nums text-success">
          {fmtNum(advance)} <span className="hidden text-body-sm font-normal sm:inline">soʻm</span>
        </span>
        <span className="text-body-sm text-success">Avans</span>
      </div>
    );
  return (
    <div className={cls}>
      <span className="font-headline-sm text-headline-sm tabular-nums text-on-surface-muted">0</span>
      <span className="text-body-sm text-on-surface-variant">Qarz yoʻq</span>
    </div>
  );
}

function MiniStat({ label, value, tone, sub }: { label: string; value: number; tone?: "error" | "success" | "warning"; sub?: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-surface-container-low p-3">
      <p className="truncate font-label-sm text-label-sm text-on-surface-variant">{label}</p>
      <p
        className={cn(
          "font-headline-sm text-headline-sm tabular-nums",
          value > 0 && tone === "error" && "text-error",
          value > 0 && tone === "success" && "text-success",
          value > 0 && tone === "warning" && "text-warning",
          value === 0 && "text-on-surface-muted",
        )}
      >
        {fmtNum(value)} <span className="text-body-sm font-normal">soʻm</span>
      </p>
      {sub ? <p className="truncate text-body-sm text-on-surface-variant">{sub}</p> : null}
    </div>
  );
}

/** Oylar lentasi: ✓ toʻlangan, ◐ qisman, ✗ toʻlanmagan; muddati oʻtgan — qizil. */
export function MonthChips({ charges, onSelect }: { charges: PaymentRow[]; onSelect?: (c: PaymentRow) => void }) {
  const list = charges.filter((c) => c.status !== "CANCELLED").sort((a, b) => a.period.localeCompare(b.period) || (a.group?.name ?? "").localeCompare(b.group?.name ?? ""));
  const multi = new Set(list.map((c) => c.group?.id ?? "-")).size > 1;
  if (!list.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {list.map((c) => {
          const paid = c.status === "PAID";
          const partial = isPartial(c);
          const overdue = c.status === "OVERDUE";
          const Comp = onSelect ? "button" : "span";
          return (
            <Comp
              key={c.id}
              type={onSelect ? "button" : undefined}
              onClick={onSelect ? () => onSelect(c) : undefined}
              title={`${periodLabel(c.period)} · ${c.group?.name ?? "Qoʻshimcha"} · ${fmtMoney(c.paidAmount)} / ${fmtMoney(c.amount)}`}
              className={cn(
                "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 font-label-sm text-label-sm tabular-nums",
                paid && "border-success/30 bg-success-container/60 text-on-success-container",
                !paid && overdue && "border-error/40 bg-error-container/70 text-error",
                !paid && !overdue && partial && "border-warning/30 bg-warning-container/60 text-on-warning-container",
                !paid && !overdue && !partial && "border-outline-variant bg-surface-container-lowest text-on-surface-variant",
                onSelect && "hover:shadow-float",
              )}
            >
              <Icon name={paid ? "check_circle" : partial ? "donut_large" : "cancel"} size={15} filled={paid} />
              {shortPeriod(c.period)}
              {multi && c.group ? <span className="hidden max-w-[110px] truncate font-normal opacity-80 sm:inline">· {c.group.name}</span> : null}
              {partial ? <span className="font-normal">· {fmtNum(c.paidAmount)}/{fmtNum(c.amount)}</span> : null}
            </Comp>
          );
        })}
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-on-surface-variant">
        <span className="inline-flex items-center gap-1">
          <Icon name="check_circle" size={14} filled className="text-success" /> toʻlangan
        </span>
        <span className="inline-flex items-center gap-1">
          <Icon name="donut_large" size={14} className="text-warning" /> qisman
        </span>
        <span className="inline-flex items-center gap-1">
          <Icon name="cancel" size={14} /> toʻlanmagan
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-error" /> muddati oʻtgan
        </span>
      </p>
    </div>
  );
}

/** Tushum qaysi oylarni yopgani (+ avans) — chiplar. */
export function AllocationChips({ tx, compact }: { tx: PaymentTx; compact?: boolean }) {
  const allocs = mergeAllocations(tx.allocations);
  const muted = !!tx.reversed;
  return (
    <div className="flex flex-wrap gap-1">
      {allocs.map((a) => (
        <Badge key={a.paymentId} tone={muted ? "neutral" : "navy"} shape="square" className={cn(muted && "line-through")} title={a.group?.name}>
          {compact ? shortPeriod(a.period) : a.periodLabel} — {fmtNum(a.amount)}
        </Badge>
      ))}
      {tx.advance > 0 ? (
        <Badge tone="success" shape="square" icon="savings">
          Avans — {fmtNum(tx.advance)}
        </Badge>
      ) : null}
      {!allocs.length && !tx.advance ? <span className="text-body-sm text-on-surface-muted">—</span> : null}
    </div>
  );
}

// ─────────── Toʻlov qabul qilish ───────────

export function ReceiveDialog({
  open,
  onOpenChange,
  initialStudent,
  onReceived,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialStudent: PickedStudent | null;
  onReceived: (transactionId: string) => void;
}) {
  const [student, setStudent] = useState<PickedStudent | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [date, setDate] = useState(todayYmd());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);
  const initialId = initialStudent?.id ?? null;

  useEffect(() => {
    if (open) {
      setStudent(initialStudent);
      setAmount("");
      setMethod("CASH");
      setDate(todayYmd());
      setNote("");
      setError(null);
      setPrefilledFor(null);
    }
    // faqat oyna ochilganda yoki boshqa oʻquvchi berilganda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialId]);

  const ledger = useLedger(open ? (student?.id ?? null) : null);
  const L = ledger.data && ledger.data.student.id === student?.id ? ledger.data : undefined;
  useEffect(() => {
    if (L && prefilledFor !== L.student.id) {
      setPrefilledFor(L.student.id);
      setAmount(L.suggestedAmount > 0 ? String(L.suggestedAmount) : "");
    }
  }, [L, prefilledFor]);

  const amountNum = parseAmount(amount);
  const receive = useApiMutation(
    () => api.post<ReceiveResult>("/admin/payments/receive", { studentId: student?.id, amount: amountNum, method, paidAt: date, note: note.trim() || undefined }),
    {
      invalidate: PAYMENT_KEYS,
      silentError: true,
      success: (r) => `Toʻlov qabul qilindi · ${r.transaction.receiptNo}`,
      onSuccess: (r) => {
        onOpenChange(false);
        onReceived(r.transaction.id);
      },
      onError: (e) => setError(errMsg(e)),
    },
  );

  const open_ = L ? L.charges.filter((c) => isOpenCharge(c) && c.outstanding > 0).sort(chargeOrder) : [];
  const preview = L && amountNum > 0 ? allocationPreview(L.charges, amountNum) : null;
  const monthly = L ? monthlyTotal(L) : 0;
  const multiGroup = new Set(open_.map((c) => c.group?.id ?? "-")).size > 1;
  const valid = !!student && amountNum >= 1000 && amountNum <= 100_000_000;
  const waitingGroups = L?.groups.filter((g) => g.waiting) ?? [];
  const pickerValue = student ? { id: student.id, fullName: L?.student.fullName ?? student.fullName, code: L?.student.code ?? student.code } : null;
  const afterOutstanding = L && preview ? L.balance.outstanding - preview.allocated : 0;
  const afterAdvance = L && preview ? L.balance.advance + preview.advance : 0;

  const quick: { label: string; value: number }[] = [];
  if (L) {
    if (L.balance.outstanding > 0) quick.push({ label: "Toʻliq qarz", value: L.balance.outstanding });
    if (L.balance.overdue > 0 && L.balance.overdue < L.balance.outstanding) quick.push({ label: "Muddati oʻtgan", value: L.balance.overdue });
    if (monthly > 0) quick.push({ label: "Oylik toʻlov", value: monthly });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Toʻlov qabul qilish"
      description="Istalgan summa qabul qilinadi: pul eng eski qarzdan boshlab yopiladi, ortigʻi avans boʻlib qoladi."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button icon="check_circle" disabled={!valid} loading={receive.isPending} onClick={() => (setError(null), receive.mutate())}>
            {valid ? `${fmtMoney(amountNum)} qabul qilish` : "Qabul qilish"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Field label="Oʻquvchi" required>
          <StudentPicker
            value={pickerValue}
            onChange={(s) => {
              setStudent(s);
              setAmount("");
              setPrefilledFor(null);
            }}
          />
        </Field>

        {student && !L ? (
          ledger.error ? (
            <Alert tone="danger">{ledger.error.message}</Alert>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          )
        ) : null}

        {L ? (
          <>
            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
              <MiniStat label="Qarzdorlik" value={L.balance.outstanding} tone="error" sub={L.balance.openCount ? `${fmtNum(L.balance.openCount)} ta ochiq hisob` : "Ochiq hisob yoʻq"} />
              <MiniStat label="Muddati oʻtgan" value={L.balance.overdue} tone="error" />
              <MiniStat label="Avans" value={L.balance.advance} tone="success" />
            </div>
            {L.student.status === "LEFT" ? <Alert tone="warning">Oʻquvchi markazdan ketgan. Faqat qolgan qarzni yopish uchun qabul qiling.</Alert> : null}
            {waitingGroups.length ? (
              <Alert tone="primary" icon="hourglass_top">
                {waitingGroups.map((g) => `«${g.name}»`).join(", ")} — kutish roʻyxati, guruh hali boshlanmagan. Unga oylik hisob yozilmaydi; qabul qilingan pul avans boʻlib turadi va
                guruh boshlangach birinchi hisobni yopadi.
              </Alert>
            ) : null}
            <div>
              <p className="mb-1.5 font-label-md text-label-md text-on-surface-variant">Ochiq oylar (toʻlanish tartibida)</p>
              {open_.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {open_.map((c) => (
                    <span
                      key={c.id}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-label-sm text-label-sm tabular-nums",
                        c.status === "OVERDUE" ? "border-error/40 bg-error-container/70 text-error" : "border-outline-variant bg-surface-container-low text-on-surface",
                      )}
                    >
                      <Icon name={isPartial(c) ? "donut_large" : c.status === "OVERDUE" ? "warning" : "schedule"} size={15} />
                      {periodLabel(c.period)}
                      {multiGroup && c.group ? <span className="max-w-[120px] truncate font-normal">· {c.group.name}</span> : null}
                      <span className="font-semibold">· {fmtNum(c.outstanding)}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-on-surface-variant">Ochiq hisob yoʻq — qabul qilingan summa avans sifatida saqlanadi va keyingi oylik hisoblarni avtomatik yopadi.</p>
              )}
            </div>
          </>
        ) : null}

        <Field label="Summa" required hint={amount && amountNum < 1000 ? "Kamida 1 000 soʻm" : undefined}>
          <MoneyInput value={amount} onChange={setAmount} size="lg" />
        </Field>
        {quick.length ? (
          <div className="-mt-2 flex flex-wrap gap-2">
            {quick.map((b) => (
              <Button key={b.label} type="button" size="sm" variant={amountNum === b.value ? "secondary" : "outline"} onClick={() => setAmount(String(b.value))}>
                {b.label} · <span className="tabular-nums">{fmtNum(b.value)}</span>
              </Button>
            ))}
          </div>
        ) : null}

        {preview && L && amountNum >= 1000 ? (
          <div className="rounded-xl border border-outline-variant/70 bg-surface-container-low/60 p-4">
            <p className="mb-2 flex items-center gap-1.5 font-label-md text-label-md text-on-surface">
              <Icon name="list" size={18} className="text-primary" />
              Pul qanday taqsimlanadi
            </p>
            <ul className="flex flex-col gap-1.5 text-body-sm">
              {preview.lines.map((l) => (
                <li key={l.charge.id} className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="min-w-0">
                    {periodLabel(l.charge.period)}
                    {l.charge.group ? <span className="text-on-surface-variant"> · {l.charge.group.name}</span> : null}
                    <span className={cn("ml-1.5", l.closes ? "text-success" : "text-warning")}>{l.closes ? "toʻliq yopiladi" : `qisman · qoldiq ${fmtNum(l.left)}`}</span>
                  </span>
                  <span className="font-semibold tabular-nums">{fmtMoney(l.take)}</span>
                </li>
              ))}
              {preview.advance > 0 ? (
                <li className="flex flex-wrap items-baseline justify-between gap-x-3 text-success">
                  <span>{preview.lines.length ? "Qolgani avans (keyingi oylar uchun)" : "Avans (keyingi oylar uchun)"}</span>
                  <span className="font-semibold tabular-nums">{fmtMoney(preview.advance)}</span>
                </li>
              ) : null}
            </ul>
            <p className="mt-3 border-t border-outline-variant/70 pt-2 text-body-sm text-on-surface-variant">
              Qabul qilingach:{" "}
              {afterOutstanding > 0 ? (
                <b className="text-error">qarzdorlik {fmtMoney(afterOutstanding)}</b>
              ) : afterAdvance > 0 ? (
                <b className="text-success">qarz yoʻq, avans {fmtMoney(afterAdvance)}</b>
              ) : (
                <b className="text-on-surface">qarz ham, avans ham yoʻq</b>
              )}
            </p>
          </div>
        ) : null}

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

// ─────────── Toʻlov daftari ───────────

export function LedgerDialog({
  studentId,
  open,
  onOpenChange,
  onReceive,
  onReceipt,
  onReverse,
  onPay,
}: {
  studentId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onReceive: (s: PickedStudent) => void;
  onReceipt: (t: ReceiptTarget) => void;
  onReverse: (tx: PaymentTx) => void;
  onPay: (c: PaymentRow) => void;
}) {
  const q = useLedger(open ? studentId : null);
  const L = q.data && q.data.student.id === studentId ? q.data : undefined;
  const st = L?.student.status && L.student.status !== "ACTIVE" ? STUDENT_STATUS[L.student.status] : null;
  const bal = L?.balance;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      className="max-w-5xl"
      title={
        L ? (
          <span className="flex flex-wrap items-center gap-2">
            {L.student.fullName}
            {st ? <Badge tone={st.tone}>{st.label}</Badge> : null}
          </span>
        ) : (
          "Toʻlov daftari"
        )
      }
      description={L ? `#${L.student.code} · toʻlov daftari` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Yopish
          </Button>
          <Button icon="payments" disabled={!L} onClick={() => L && onReceive({ id: L.student.id, fullName: L.student.fullName, code: L.student.code })}>
            Toʻlov qabul qilish
          </Button>
        </>
      }
    >
      {!L ? (
        q.error ? (
          <Alert tone="danger">{q.error.message}</Alert>
        ) : (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        )
      ) : (
        <div className="flex flex-col gap-5">
          {/* Guruhlar va ota-onalar */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-outline-variant/70 p-3">
              <p className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Guruhlar</p>
              {L.groups.length ? (
                <ul className="flex flex-col gap-1.5">
                  {L.groups.map((g) => (
                    <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 text-body-sm">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <Badge tone="navy" shape="square">
                          {g.name}
                        </Badge>
                        {g.waiting ? (
                          <Badge tone="gold" icon="hourglass_top">
                            Kutish roʻyxati
                          </Badge>
                        ) : null}
                      </span>
                      <span className="tabular-nums text-on-surface-variant">{fmtMoney(g.monthlyFee)} / oy</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-sm text-on-surface-variant">Faol guruh yoʻq</p>
              )}
            </div>
            <div className="rounded-xl border border-outline-variant/70 p-3">
              <p className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Ota-onalar</p>
              {L.parents.length ? (
                <ul className="flex flex-col gap-1.5">
                  {L.parents.map((p, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 text-body-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <Avatar name={p.fullName} size="xs" tone="neutral" />
                        <span className="truncate">
                          {p.fullName} <span className="text-on-surface-variant">· {relationOf(p.relation)}</span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {p.phone ? (
                          <a href={`tel:${p.phone}`} className="tabular-nums text-primary hover:underline">
                            {fmtPhone(p.phone)}
                          </a>
                        ) : null}
                        <TelegramDot linked={p.telegramLinked} />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-sm text-on-surface-variant">Ota-ona bogʻlanmagan</p>
              )}
            </div>
          </div>

          {/* Balans */}
          {bal ? (
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <MiniStat label="Qarzdorlik" value={bal.outstanding} tone="error" sub={bal.openCount ? `${fmtNum(bal.openCount)} ta ochiq hisob` : "Ochiq hisob yoʻq"} />
              <MiniStat label="Muddati oʻtgan" value={bal.overdue} tone="error" />
              <MiniStat label="Avans" value={bal.advance} tone="success" sub="keyingi oylar uchun" />
              <div className="min-w-0 rounded-xl bg-surface-container-low p-3">
                <p className="font-label-sm text-label-sm text-on-surface-variant">Balans</p>
                <p className={cn("font-headline-sm text-headline-sm tabular-nums", bal.balance < 0 ? "text-error" : bal.balance > 0 ? "text-success" : "text-on-surface-muted")}>
                  {bal.balance < 0 ? "−" : bal.balance > 0 ? "+" : ""}
                  {fmtNum(Math.abs(bal.balance))} <span className="text-body-sm font-normal">soʻm</span>
                </p>
                <p className="text-body-sm text-on-surface-variant">{bal.balance < 0 ? "qarzdor" : bal.balance > 0 ? "oldindan toʻlagan" : "hisob-kitob teng"}</p>
              </div>
            </div>
          ) : null}

          <MonthChips charges={L.charges} onSelect={(c) => (isOpenCharge(c) ? onPay(c) : groupReceipts(c.receipts)[0] ? onReceipt({ paymentId: c.id }) : undefined)} />

          {/* Oylik hisoblar */}
          <section>
            <h3 className="mb-2 font-headline-sm text-headline-sm">Oylik hisoblar</h3>
            {L.charges.length ? (
              <div className="overflow-hidden rounded-xl border border-outline-variant/70">
                <Table>
                  <THead>
                    <tr>
                      <TH>Davr</TH>
                      <TH className="hidden sm:table-cell">Guruh</TH>
                      <TH className="text-right">Summa</TH>
                      <TH className="hidden text-right md:table-cell">Toʻlangan</TH>
                      <TH className="text-right">Qoldiq</TH>
                      <TH>Holat</TH>
                      <TH className="hidden md:table-cell">Kvitansiyalar</TH>
                      <TH className="text-right">
                        <span className="sr-only">Amal</span>
                      </TH>
                    </tr>
                  </THead>
                  <TBody>
                    {L.charges.map((c) => {
                      const rc = groupReceipts(c.receipts);
                      return (
                        <TR key={c.id} className={cn(c.status === "OVERDUE" && "bg-error-container/20", c.status === "CANCELLED" && "opacity-60")}>
                          <TD className="whitespace-nowrap font-medium">{periodLabel(c.period)}</TD>
                          <TD className="hidden text-body-sm sm:table-cell">{c.group?.name ?? <span className="text-on-surface-variant">Qoʻshimcha</span>}</TD>
                          <TD className={cn("whitespace-nowrap text-right tabular-nums", c.status === "CANCELLED" && "line-through")}>{fmtNum(c.amount)}</TD>
                          <TD className="hidden whitespace-nowrap text-right tabular-nums text-on-surface-variant md:table-cell">{c.paidAmount ? fmtNum(c.paidAmount) : "—"}</TD>
                          <TD className={cn("whitespace-nowrap text-right font-semibold tabular-nums", c.outstanding > 0 ? "text-error" : "text-on-surface-muted")}>
                            {c.outstanding > 0 ? fmtNum(c.outstanding) : "—"}
                          </TD>
                          <TD>
                            <StatusCell p={c} />
                          </TD>
                          <TD className="hidden md:table-cell">
                            {rc.length ? (
                              <div className="flex flex-col items-start gap-0.5">
                                {rc.map((r) => (
                                  <button
                                    key={r.transactionId}
                                    type="button"
                                    onClick={() => onReceipt({ transactionId: r.transactionId })}
                                    className="whitespace-nowrap font-mono text-body-sm text-primary hover:underline"
                                    title={`${fmtMoney(r.amount)} · ${fmtDateTime(r.paidAt)}`}
                                  >
                                    {r.receiptNo}
                                  </button>
                                ))}
                              </div>
                            ) : c.receiptNo ? (
                              <button type="button" onClick={() => onReceipt({ paymentId: c.id })} className="font-mono text-body-sm text-primary hover:underline">
                                {c.receiptNo}
                              </button>
                            ) : (
                              <span className="text-on-surface-muted">—</span>
                            )}
                          </TD>
                          <TD className="text-right">
                            {isOpenCharge(c) ? (
                              <IconButton icon="payments" label="Shu hisobni qabul qilish" size="sm" variant="ghost" className="text-primary" onClick={() => onPay(c)} />
                            ) : null}
                          </TD>
                        </TR>
                      );
                    })}
                  </TBody>
                </Table>
              </div>
            ) : (
              <p className="rounded-xl bg-surface-container-low p-4 text-body-sm text-on-surface-variant">
                Hali oylik hisob yozilmagan.
                {L.groups.some((g) => g.waiting) ? " Oʻquvchi kutish roʻyxatida — guruh boshlangach hisob yoziladi." : ""}
              </p>
            )}
          </section>

          {/* Tushumlar */}
          <section>
            <h3 className="mb-2 font-headline-sm text-headline-sm">Tushumlar (kassaga kelgan pul)</h3>
            {L.transactions.length ? (
              <ul className="flex flex-col divide-y divide-outline-variant/60 overflow-hidden rounded-xl border border-outline-variant/70">
                {L.transactions.map((t) => (
                  <TxItem key={t.id} t={t} onReceipt={() => onReceipt({ transactionId: t.id })} onReverse={() => onReverse(t)} />
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-surface-container-low p-4 text-body-sm text-on-surface-variant">Hali toʻlov qabul qilinmagan.</p>
            )}
          </section>
        </div>
      )}
    </Dialog>
  );
}

function TxItem({ t, onReceipt, onReverse }: { t: PaymentTx; onReceipt: () => void; onReverse: () => void }) {
  const rev = t.reversed;
  return (
    <li className={cn("flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between", rev && "bg-surface-container-low/70")}>
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("font-mono text-body-md font-semibold", rev && "text-on-surface-muted line-through")}>{t.receiptNo}</span>
          <MethodBadge method={t.method} muted={!!rev} />
          {rev ? (
            <Badge tone="danger" icon="undo">
              Bekor qilingan
            </Badge>
          ) : null}
        </div>
        <p className="text-body-sm text-on-surface-variant">
          {fmtDateTime(t.paidAt)} · Qabul qildi: {t.createdBy ?? "—"}
          {t.note ? ` · ${t.note}` : ""}
        </p>
        <AllocationChips tx={t} />
        {rev ? (
          <p className="text-body-sm text-error">
            Storno {fmtDate(rev.at)}
            {rev.by ? ` · ${rev.by}` : ""} · Sabab: {rev.reason ?? "—"}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
        <span className={cn("whitespace-nowrap font-headline-sm text-headline-sm tabular-nums", rev ? "text-on-surface-muted line-through" : "text-on-surface")}>{fmtMoney(t.amount)}</span>
        <span className="flex items-center gap-1">
          <IconButton icon="receipt_long" label="Kvitansiya" size="sm" variant="ghost" className="text-primary" onClick={onReceipt} />
          {!rev ? (
            <Button size="sm" variant="ghost" icon="undo" className="text-error hover:bg-error-container/50 hover:text-error" onClick={onReverse}>
              Storno
            </Button>
          ) : null}
        </span>
      </div>
    </li>
  );
}

// ─────────── Storno ───────────

export function ReverseDialog({ tx, open, onOpenChange }: { tx: PaymentTx | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
    }
  }, [open, tx?.id]);
  const ledger = useLedger(open && tx ? tx.student.id : null);
  const bal = ledger.data?.student.id === tx?.student.id ? ledger.data?.balance : undefined;
  const rev = useApiMutation(() => api.post<{ id: string; receiptNo: string }>(`/admin/payments/transactions/${tx?.id}/reverse`, { reason: reason.trim() }), {
    invalidate: PAYMENT_KEYS,
    silentError: true,
    success: (r) => `Tushum bekor qilindi (storno) · ${r.receiptNo}`,
    onSuccess: () => onOpenChange(false),
    onError: (e) => setError(errMsg(e)),
  });
  if (!tx) return null;
  const after = bal ? bal.balance - tx.amount : null;
  const allocs = mergeAllocations(tx.allocations);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Tushumni bekor qilish (storno)"
      description="Yozuv oʻchirilmaydi — kassa daftarida «bekor qilingan» boʻlib qoladi, ota-onaga xabar boradi."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Orqaga
          </Button>
          <Button variant="danger" icon="undo" disabled={reason.trim().length < 3} loading={rev.isPending} onClick={() => (setError(null), rev.mutate())}>
            Bekor qilish
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-4">
          <div className="min-w-0">
            <p className="font-mono text-body-md font-semibold">{tx.receiptNo}</p>
            <p className="truncate text-body-sm text-on-surface-variant">
              {tx.student.fullName} · {fmtDateTime(tx.paidAt)}
            </p>
          </div>
          <span className="font-headline-md text-headline-md tabular-nums">{fmtMoney(tx.amount)}</span>
        </div>
        {allocs.length || tx.advance ? (
          <div>
            <p className="mb-1.5 font-label-md text-label-md text-on-surface-variant">Qayta ochiladigan oylar</p>
            <AllocationChips tx={tx} />
          </div>
        ) : null}
        {after == null ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <Alert tone={after < 0 ? "warning" : "primary"}>
            {after < 0
              ? `Qaytarilgach oʻquvchi ${fmtMoney(-after)} qarzdor boʻladi.`
              : after > 0
                ? `Qaytarilgach oʻquvchida ${fmtMoney(after)} avans qoladi.`
                : "Qaytarilgach oʻquvchining na qarzi, na avansi qoladi."}
          </Alert>
        )}
        <Field label="Sabab" required hint="Jurnalga yoziladi, oʻchirib boʻlmaydi">
          <Textarea rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Masalan: summa xato kiritilgan" />
        </Field>
      </div>
    </Dialog>
  );
}
