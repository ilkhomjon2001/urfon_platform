// Admin → Hisobotlar va moliyaviy monitoring (mockup: urfon_admin_hisobotlar_va_to_lovlar_monitoringi).
// Toʻlov raqamlari Toʻlovlar sahifasi bilan bitta backend funksiyasidan (paymentTotals) keladi.
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Alert, Avatar, Badge, Button, Card, DropdownMenu, EmptyState, Icon, PageHeader, ProgressBar, Skeleton, StatCard } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtDateShort, fmtMoney, fmtNum, fmtPercent, fmtPhone } from "@/lib/format";
import { useSearchParamState } from "@/lib/hooks";
import { useApiMutation, useApiQuery } from "@/lib/query";
import type { Tone } from "@/lib/types";
import { downloadCsv, periodEnd, periodLabel, PeriodSelect, PAY_STATUS } from "./b/shared";
import type { PaymentPeriods, Report } from "./b/types";

const PRINT_CSS = `@media print {
  aside, header, nav, [data-no-print] { display: none !important; }
  body, main { background: #fff !important; }
  main, main > div { padding: 0 !important; margin: 0 !important; }
  .shadow-card { box-shadow: none !important; }
  @page { size: A4 landscape; margin: 10mm; }
}`;

const attTone = (p: number | null): Tone => (p == null ? "neutral" : p < 85 ? "danger" : p >= 95 ? "primary" : "navy");
const loadTone = (p: number): Tone => (p >= 90 ? "danger" : p >= 55 ? "primary" : "gold");
const loadText = (p: number) => (p >= 90 ? "text-error" : p >= 55 ? "text-primary" : "text-tertiary");
const mln = (v: number) => (v >= 1_000_000 ? `${fmtNum(Math.round(v / 100_000) / 10)} mln` : fmtNum(v));

function SectionCard({ eyebrow, title, badge, children, className }: { eyebrow: string; title: string; badge?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={cn("flex min-w-0 flex-col gap-4 p-5 sm:p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{eyebrow}</p>
          <h2 className="mt-1 font-headline-md text-headline-md text-on-surface">{title}</h2>
        </div>
        {badge}
      </div>
      {children}
    </Card>
  );
}

function Pill({ children, tone = "primary" }: { children: ReactNode; tone?: Tone }) {
  return (
    <Badge tone={tone} className="shrink-0 whitespace-nowrap">
      {children}
    </Badge>
  );
}

// ─────────── Tushum grafigi (reja vs yigʻilgan, 6 oy) ───────────

// Ranglar dataviz validatori bilan tekshirilgan: reja = blue-300 (#8EABEF), yigʻilgan = primary (#1E4FC2) — CVD ΔE 27.
// Reja rangi oq fonda <3:1 kontrast → koʻrinadigan jadval rejimi majburiy (pastdagi "Jadval" tugmasi).
function RevenueChart({ series, current }: { series: Report["revenue"]["series"]; current: string }) {
  const [asTable, setAsTable] = useState(false);
  if (asTable)
    return (
      <div className="flex flex-col gap-3">
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" icon="bar_chart" onClick={() => setAsTable(false)}>
            Grafik
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-left text-body-sm">
            <thead>
              <tr className="border-b border-outline-variant text-on-surface-variant">
                <th className="py-2 font-label-sm text-label-sm uppercase tracking-wider">Davr</th>
                <th className="py-2 text-right font-label-sm text-label-sm uppercase tracking-wider">Reja</th>
                <th className="py-2 text-right font-label-sm text-label-sm uppercase tracking-wider">Yigʻilgan</th>
                <th className="py-2 text-right font-label-sm text-label-sm uppercase tracking-wider">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50 tabular-nums">
              {series.map((s) => (
                <tr key={s.period} className={s.period === current ? "font-semibold" : undefined}>
                  <td className="py-2">{s.label}</td>
                  <td className="py-2 text-right">{fmtMoney(s.plan)}</td>
                  <td className="py-2 text-right">{fmtMoney(s.collected)}</td>
                  <td className="py-2 text-right">{fmtPercent(s.percent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  return <RevenueBars series={series} current={current} onTable={() => setAsTable(true)} />;
}

function RevenueBars({ series, current, onTable }: { series: Report["revenue"]["series"]; current: string; onTable: () => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...series.map((s) => Math.max(s.plan, s.collected)));
  const step = [1, 2, 5, 10, 20, 50, 100, 200, 500].map((x) => x * 1_000_000).find((x) => x * 4 >= max) ?? Math.ceil(max / 4);
  const top = step * 4;
  const ticks = [4, 3, 2, 1, 0].map((i) => i * step);
  const h = (v: number) => `${(v / top) * 100}%`;
  const hovered = series.find((s) => s.period === hover);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4 text-body-sm text-on-surface-variant">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-blue-300" /> Reja (hisoblangan)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Yigʻilgan
        </span>
        <span className="ml-auto h-5 text-on-surface">
          {hovered ? (
            <>
              <b>{hovered.label}:</b> {fmtMoney(hovered.collected)} / {fmtMoney(hovered.plan)} ({fmtPercent(hovered.percent ?? 0)})
            </>
          ) : null}
        </span>
        <Button size="sm" variant="ghost" icon="table_view" onClick={onTable}>
          Jadval
        </Button>
      </div>
      <div className="relative flex h-52 gap-2 pl-[4.5rem]" aria-hidden="true">
        {ticks.map((t) => (
          <div key={t} className="pointer-events-none absolute inset-x-0 flex items-center" style={{ bottom: h(t), transform: "translateY(50%)" }}>
            <span className="w-16 whitespace-nowrap pr-2 text-right text-[11px] tabular-nums text-on-surface-muted">{mln(t)}</span>
            <span className="h-px flex-1 bg-outline-variant/70" />
          </div>
        ))}
        {series.map((s) => {
          const isCur = s.period === current;
          return (
            <div
              key={s.period}
              className={cn("relative z-10 flex flex-1 flex-col justify-end rounded-md", hover === s.period && "bg-surface-container-low/70")}
              onMouseEnter={() => setHover(s.period)}
              onMouseLeave={() => setHover(null)}
            >
              <div className="flex h-full items-end justify-center gap-0.5">
                <div className="w-full max-w-[22px] rounded-t bg-blue-300" style={{ height: h(s.plan) }} />
                <div className="relative w-full max-w-[22px] rounded-t bg-primary" style={{ height: h(s.collected) }}>
                  {isCur && s.percent != null ? (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-on-surface">{fmtPercent(s.percent)}</span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 pl-[4.5rem]">
        {series.map((s) => (
          <span key={s.period} className={cn("flex-1 text-center text-[11px]", s.period === current ? "font-semibold text-on-surface" : "text-on-surface-variant")}>
            {s.label.split(" ")[0].slice(0, 3)}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Oylik tushum: reja va yigʻilgan</caption>
        <thead>
          <tr>
            <th>Davr</th>
            <th>Reja</th>
            <th>Yigʻilgan</th>
          </tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.period}>
              <td>{s.label}</td>
              <td>{fmtMoney(s.plan)}</td>
              <td>{fmtMoney(s.collected)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────── Sahifa ───────────

export default function AdminReportsPage() {
  const periodsQ = useApiQuery<PaymentPeriods>(["admin", "payments", "periods"], "/admin/payments/periods");
  const pd = periodsQ.data;
  const defaultPeriod = pd ? (pd.items.some((i) => i.period === pd.current) ? pd.current : pd.latest) : "";
  const [periodParam, setPeriod] = useSearchParamState("p");
  const period = periodParam || defaultPeriod;
  const rq = useApiQuery<Report>(["admin", "reports", period], period ? "/admin/reports" : null, { params: { period }, placeholderData: (p) => p });
  const r = rq.data;
  const loading = rq.isLoading || periodsQ.isLoading;

  const remind = useApiMutation((id: string) => api.post<{ sent: number }>(`/admin/payments/${id}/remind`), {
    invalidate: [["admin", "audit"]],
    success: (x) => `Eslatma ${fmtNum(x.sent)} ta ota-onaga yuborildi`,
  });

  const csv = (table: string, label: string) => ({
    label,
    icon: "table_view",
    onSelect: () => downloadCsv("/admin/reports/export.csv", { period, table }, `hisobot-${period}-${table}.csv`),
  });

  const lowAtt = r?.attendance.groups.filter((g) => g.percent != null && g.percent < 85) ?? [];
  const t = r?.revenue;

  return (
    <>
      {createPortal(<style>{PRINT_CSS}</style>, document.head)}
      <PageHeader
        title="Hisobotlar va moliyaviy monitoring"
        documentTitle="Hisobotlar"
        subtitle="Oʻquv markazi boʻyicha davomat, ustozlar yuklamasi, oʻquvchilar dinamikasi hamda toʻlovlar intizomi tahlili"
        breadcrumbs={[{ label: "Boshqaruv paneli", to: "/admin" }, { label: "Statistika & Buxgalteriya" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-no-print>
            <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest pl-3">
              <Icon name="calendar_month" size={18} className="text-primary" />
              <PeriodSelect value={period} onChange={(p) => setPeriod(p === defaultPeriod ? null : p)} periods={pd?.items.map((i) => i.period) ?? []} className="w-40" size="sm" />
              {period ? <span className="hidden pr-3 text-body-sm text-on-surface-variant xl:inline">{fmtDateShort(`${period}-01T12:00:00+05:00`)} — {fmtDateShort(`${periodEnd(period)}T12:00:00+05:00`)}</span> : null}
            </div>
            <DropdownMenu
              trigger={
                <Button variant="outline" icon="grid_on" iconRight="expand_more" disabled={!period}>
                  Excel (CSV)
                </Button>
              }
              label="Jadvalni yuklab olish"
              items={[
                csv("summary", "Umumiy koʻrsatkichlar"),
                csv("revenue", "Tushum (6 oy)"),
                csv("overdue", "Qarzdorlar roʻyxati"),
                csv("attendance", "Davomat — guruhlar"),
                csv("teachers", "Ustozlar yuklamasi"),
                csv("homework", "Uyga vazifa — guruhlar"),
                csv("telegram", "Botga ulanmagan ota-onalar"),
              ]}
            />
            <Button variant="outline" icon="picture_as_pdf" onClick={() => window.print()} disabled={!r}>
              PDF
            </Button>
          </div>
        }
      />

      {loading && !r ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="flex flex-col gap-3 p-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-48" />
              {[0, 1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-6 w-full" />
              ))}
            </Card>
          ))}
        </div>
      ) : !r ? (
        <Card>
          <EmptyState icon="query_stats" title="Hisobot tayyor emas" description={rq.error?.message ?? "Davrni tanlang"} />
        </Card>
      ) : (
        <div className={cn("flex flex-col gap-8 transition-opacity", rq.isFetching && "opacity-70")}>
          {/* 1-qator: davomat, ustozlar, dinamika */}
          <section className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
            <SectionCard
              eyebrow="Davomat monitoringi"
              title="Guruhlar kesimida davomat"
              badge={r.attendance.average != null ? <Pill>{fmtPercent(r.attendance.average)} oʻrtacha</Pill> : undefined}
            >
              {r.attendance.groups.length ? (
                <ul className="flex flex-col gap-3">
                  {r.attendance.groups.map((g) => (
                    <li key={g.groupId}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-body-sm">
                        <span className="truncate font-medium text-on-surface">{g.name}</span>
                        <span className={cn("font-semibold tabular-nums", (g.percent ?? 0) < 85 ? "text-error" : "text-on-surface")}>{fmtPercent(g.percent)}</span>
                      </div>
                      <ProgressBar value={g.percent ?? 0} tone={attTone(g.percent)} size="sm" />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState compact icon="event_busy" title="Bu oy davomat belgilanmagan" />
              )}
              {lowAtt.length ? (
                <Alert tone="danger" className="mt-auto" title={`${lowAtt[lowAtt.length - 1].name}: ${fmtPercent(lowAtt[lowAtt.length - 1].percent)}`}>
                  Davomat 85% dan past — ota-onalar bilan bogʻlanish zarur
                </Alert>
              ) : null}
            </SectionCard>

            <SectionCard
              eyebrow="Pedagogik tarkib"
              title="Ustozlar yuklamasi"
              badge={
                <Pill tone="neutral">
                  {fmtNum(r.teachers.items.length)} ta ustoz · {fmtNum(r.teachers.totalGroups)} ta guruh
                </Pill>
              }
            >
              <ul className="flex flex-col gap-4">
                {r.teachers.items.filter((x) => x.groups > 0).slice(0, 6).map((x) => (
                  <li key={x.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <Avatar name={x.fullName} size="xs" tone="neutral" />
                        <span className="truncate font-label-md text-label-md text-on-surface">{x.fullName}</span>
                      </span>
                      <span className={cn("shrink-0 text-body-sm font-semibold", loadText(x.loadPercent))}>
                        {fmtPercent(x.loadPercent)} — {x.loadLabel}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-body-sm text-on-surface-variant">
                      <span>
                        {fmtNum(x.groups)} guruh · {fmtNum(x.students)} oʻquvchi
                      </span>
                      <span>Haftada {fmtNum(x.weeklyHours)} soat</span>
                    </div>
                    <ProgressBar value={Math.min(100, x.loadPercent)} tone={loadTone(x.loadPercent)} size="sm" className="mt-1.5" />
                  </li>
                ))}
                {r.teachers.items.every((x) => x.groups === 0) ? <EmptyState compact icon="person_apron" title="Guruh biriktirilgan ustoz yoʻq" /> : null}
              </ul>
              <div className="mt-auto flex flex-col gap-2">
                {r.teachers.unassignedGroups.length ? (
                  <Alert tone="warning" title="Ustoz biriktirilmagan">
                    {r.teachers.unassignedGroups.map((g) => g.name).join(", ")}
                  </Alert>
                ) : null}
                <div className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-lg bg-surface-container-low px-4 py-3 text-body-sm">
                  <span className="text-on-surface-variant">Yuklama meʼyori:</span>
                  <span className="font-medium text-on-surface">
                    haftada {fmtNum(r.teachers.normHours)} soat · 1 ustozga oʻrtacha {fmtNum(r.teachers.avgStudents ?? 0)} nafar oʻquvchi
                  </span>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Oʻquvchilar balansi"
              title="Oqim dinamikasi (sof oʻsish)"
              badge={
                <Pill tone={r.students.net >= 0 ? "primary" : "danger"}>
                  <Icon name={r.students.net >= 0 ? "trending_up" : "trending_down"} size={14} /> {r.students.net > 0 ? "+" : ""}
                  {fmtNum(r.students.net)} nafar
                </Pill>
              }
            >
              <div className="flex flex-col gap-3">
                <DynRow icon="person_add" tone="primary" title="Yangi qabul qilingan" sub={`Oy boshida ${fmtNum(r.students.start)} → oy oxirida ${fmtNum(r.students.end)} nafar`} value={`+${fmtNum(r.students.new)}`} valueClass="text-primary" />
                <DynRow
                  icon="person_remove"
                  tone="danger"
                  title="Chiqib ketganlar"
                  sub={r.students.leftList.length ? r.students.leftList.slice(0, 2).map((x) => `${x.fullName}${x.note ? ` — ${x.note}` : ""}`).join("; ") : "Bu oy ketgan oʻquvchi yoʻq"}
                  value={r.students.left ? `−${fmtNum(r.students.left)}` : "0"}
                  valueClass="text-error"
                />
                <DynRow icon="school" tone="gold" title="Kursni bitirganlar" sub="Holati «Bitirgan» deb belgilangan" value={fmtNum(r.students.graduated)} valueClass="text-on-surface" />
              </div>
              <div className="mt-auto">
                <div className="mb-1.5 flex items-center justify-between text-body-sm">
                  <span className="text-on-surface-variant">Saqlanish darajasi (retention):</span>
                  <span className="font-semibold text-primary">
                    {fmtPercent(r.students.retention)} · churn {fmtPercent(r.students.churn)}
                  </span>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-surface-container">
                  <div className="h-full bg-primary" style={{ width: `${r.students.retention ?? 0}%` }} />
                  <div className="h-full bg-error" style={{ width: `${r.students.churn ?? 0}%` }} />
                </div>
              </div>
            </SectionCard>
          </section>

          {/* 2: Toʻlovlar */}
          <section className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-headline-xl text-headline-lg text-on-surface">Toʻlovlar va moliyaviy hisob</h2>
                <p className="text-body-md text-on-surface-variant">{periodLabel(period)} · abonent toʻlovlari oqimi va tushumlar intizomi</p>
              </div>
              <Link to={`/admin/tolovlar?p=${period}`} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-high px-3 py-1.5 font-label-md text-label-md text-on-surface hover:text-primary" data-no-print>
                <span className="h-2 w-2 rounded-full bg-primary" /> Toʻlovlar daftari <Icon name="arrow_forward" size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Yigʻilgan toʻlovlar"
                value={fmtNum(t?.collected)}
                unit="soʻm"
                icon="account_balance_wallet"
                sub={
                  <span className="flex items-center gap-1.5">
                    <Badge tone="primary" size="sm">
                      {fmtPercent(t?.collectedPercent ?? 0)} reja
                    </Badge>
                    {fmtNum(t?.students.PAID)} nafar oʻquvchi toʻlagan
                  </span>
                }
              />
              <StatCard
                label="Kutilayotgan tushum"
                value={fmtNum(t?.pending)}
                unit="soʻm"
                icon="pending_actions"
                iconTone="gold"
                sub={
                  <span className="flex items-center gap-1.5">
                    <Badge tone="gold" size="sm">
                      {fmtNum(t?.students.PENDING)} ta oʻquvchi
                    </Badge>
                    muddati oʻtmagan
                  </span>
                }
              />
              <StatCard
                label="Muddati oʻtgan (Qarzdorlik)"
                value={<span className="text-error">{fmtNum(t?.overdue)}</span>}
                unit="soʻm"
                icon="warning"
                iconTone="danger"
                sub={
                  <span className="flex items-center gap-1.5">
                    <Badge tone="danger" size="sm">
                      {fmtNum(t?.counts.OVERDUE)} ta kechikish
                    </Badge>
                    pastdagi roʻyxat
                  </span>
                }
              />
              <StatCard label="Oʻrtacha abonent toʻlovi" value={fmtNum(t?.avgAmount)} unit="soʻm / oy" icon="receipt" iconTone="neutral" sub="Barcha yoʻnalishlar boʻyicha" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <SectionCard eyebrow="Tushum dinamikasi" title="Reja va yigʻilgan (6 oy)" className="lg:col-span-7">
                <RevenueChart series={r.revenue.series} current={period} />
              </SectionCard>
              <SectionCard eyebrow="Toʻlov holatlari" title={`${periodLabel(period)} taqsimoti`} className="lg:col-span-5">
                <StatusBreakdown r={r} />
              </SectionCard>
            </div>

            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/60 px-5 py-4">
                <div>
                  <h3 className="font-headline-sm text-headline-sm">Qarzdorlar roʻyxati</h3>
                  <p className="text-body-sm text-on-surface-variant">Muddati oʻtgan toʻlovlar · {periodLabel(period)}</p>
                </div>
                <Button variant="outline" size="sm" icon="file_download" onClick={() => downloadCsv("/admin/reports/export.csv", { period, table: "overdue" }, `qarzdorlar-${period}.csv`)} data-no-print>
                  CSV
                </Button>
              </div>
              {r.overdue.length ? (
                <ul className="divide-y divide-outline-variant/60">
                  {r.overdue.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={o.student.fullName} size="md" tone="solid" className="bg-error text-on-error" />
                        <div className="min-w-0">
                          <Link to={`/admin/oquvchilar?id=${o.student.id}`} className="font-label-md text-label-md text-on-surface hover:text-primary">
                            {o.student.fullName}
                          </Link>
                          <p className="text-body-sm text-on-surface-variant">
                            #{o.student.code} · {o.group?.name ?? "Qoʻshimcha"} · {o.parents.map((p) => `${p.fullName} ${fmtPhone(p.phone)}`).join(", ") || "ota-ona yoʻq"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-headline-sm text-headline-sm tabular-nums text-error" title="Qolgan (toʻlanmagan) qarz">
                            {fmtMoney(o.amount)}
                          </p>
                          <p className="text-body-sm text-error">
                            {o.paidAmount > 0 ? <span className="text-on-surface-variant">{fmtNum(o.paidAmount)} toʻlangan · </span> : null}
                            {fmtNum(o.daysOverdue)} kun kechikkan
                          </p>
                        </div>
                        <Button size="sm" variant="danger" icon="sms" loading={remind.isPending && remind.variables === o.id} onClick={() => remind.mutate(o.id)} data-no-print>
                          Qarzdorlik eslatmasi
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState compact icon="task_alt" title="Qarzdorlik yoʻq" description="Bu davrda muddati oʻtgan toʻlov yoʻq" />
              )}
            </Card>
          </section>

          {/* 3: Telegram va uyga vazifa */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard
              eyebrow="Aloqa kanali"
              title="Telegram bot qamrovi"
              badge={<Pill>{fmtPercent(r.telegram.students.percent)} oʻquvchi</Pill>}
            >
              <div className="grid grid-cols-2 gap-3">
                <MiniMeter label="Oʻquvchilar (ota-onasi ulangan)" a={r.telegram.students.linked} b={r.telegram.students.total} />
                <MiniMeter label="Ota-onalar" a={r.telegram.parents.linked} b={r.telegram.parents.total} />
              </div>
              {r.telegram.unlinkedParents.length ? (
                <div>
                  <p className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Botga ulanmaganlar</p>
                  <ul className="flex flex-col divide-y divide-outline-variant/60">
                    {r.telegram.unlinkedParents.slice(0, 6).map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-body-sm">
                        <Link to={`/admin/ota-onalar?id=${p.id}`} className="min-w-0 truncate font-medium hover:text-primary">
                          {p.fullName} <span className="font-normal text-on-surface-variant">· {p.children.map((c) => c.fullName).join(", ")}</span>
                        </Link>
                        <span className="shrink-0 tabular-nums text-on-surface-variant">{fmtPhone(p.phone)}</span>
                      </li>
                    ))}
                  </ul>
                  {r.telegram.unlinkedParents.length > 6 ? (
                    <Link to="/admin/ota-onalar?tg=unlinked" className="mt-2 inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:underline">
                      Hammasi ({fmtNum(r.telegram.unlinkedParents.length)}) <Icon name="arrow_forward" size={16} />
                    </Link>
                  ) : null}
                </div>
              ) : (
                <Alert tone="success">Barcha faol ota-onalar botga ulangan.</Alert>
              )}
            </SectionCard>

            <SectionCard
              eyebrow="Oʻquv jarayoni"
              title="Uyga vazifa bajarilishi"
              badge={r.homework.average != null ? <Pill>{fmtPercent(r.homework.average)} oʻrtacha</Pill> : undefined}
            >
              {r.homework.groups.length ? (
                <ul className="flex flex-col gap-3">
                  {r.homework.groups.map((g) => (
                    <li key={g.groupId}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-body-sm">
                        <span className="truncate font-medium">{g.name}</span>
                        <span className="shrink-0 tabular-nums text-on-surface-variant">
                          {fmtNum(g.done)}/{fmtNum(g.expected)} · <b className="text-on-surface">{fmtPercent(g.percent)}</b>
                        </span>
                      </div>
                      <ProgressBar value={g.percent ?? 0} tone={(g.percent ?? 0) < 70 ? "gold" : "primary"} size="sm" />
                      <p className="mt-0.5 text-[11px] text-on-surface-muted">
                        {fmtNum(g.homework)} ta vazifa · oʻz vaqtida: {fmtNum(g.onTime)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState compact icon="assignment" title="Bu oy muddati tugagan vazifa yoʻq" />
              )}
            </SectionCard>
          </section>
        </div>
      )}
    </>
  );
}

function DynRow({ icon, tone, title, sub, value, valueClass }: { icon: string; tone: Tone; title: string; sub: string; value: string; valueClass: string }) {
  const tile: Record<string, string> = { primary: "bg-primary-fixed text-primary", danger: "bg-error-container text-error", gold: "bg-tertiary-fixed text-on-tertiary-fixed" };
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-4">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", tile[tone] ?? tile.primary)}>
        <Icon name={icon} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-label-md text-label-md text-on-surface">{title}</p>
        <p className="truncate text-body-sm text-on-surface-variant" title={sub}>
          {sub}
        </p>
      </div>
      <span className={cn("font-headline-md text-headline-md tabular-nums", valueClass)}>{value}</span>
    </div>
  );
}

function MiniMeter({ label, a, b }: { label: string; a: number; b: number }) {
  const p = b ? Math.round((a / b) * 100) : 0;
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <p className="text-body-sm text-on-surface-variant">{label}</p>
      <p className="mt-1 font-headline-md text-headline-md">
        {fmtNum(a)} <span className="text-body-sm font-normal text-on-surface-variant">/ {fmtNum(b)}</span>
      </p>
      <ProgressBar value={p} size="sm" className="mt-2" />
    </div>
  );
}

function StatusBreakdown({ r }: { r: Report }) {
  const t = r.revenue;
  const rows = [
    { key: "PAID" as const, amount: t.collected, count: t.counts.PAID, bar: "bg-success" },
    { key: "PENDING" as const, amount: t.pending, count: t.counts.PENDING, bar: "bg-warning" },
    { key: "OVERDUE" as const, amount: t.overdue, count: t.counts.OVERDUE, bar: "bg-error" },
    { key: "CANCELLED" as const, amount: t.cancelled, count: t.counts.CANCELLED, bar: "bg-outline" },
  ];
  const planTotal = Math.max(1, t.plan);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-surface-container" aria-hidden="true">
        {rows.slice(0, 3).map((x) => (x.amount ? <div key={x.key} className={cn("h-full", x.bar)} style={{ width: `${(x.amount / planTotal) * 100}%` }} /> : null))}
      </div>
      <ul className="flex flex-col divide-y divide-outline-variant/60">
        {rows.map((x) => (
          <li key={x.key} className="flex items-center justify-between gap-2 py-2">
            <span className="flex items-center gap-2 text-body-sm">
              <span className={cn("h-2.5 w-2.5 rounded-sm", x.bar)} />
              <Icon name={PAY_STATUS[x.key].icon} size={16} className="text-on-surface-variant" />
              {PAY_STATUS[x.key].label}
              <span className="text-on-surface-muted">· {fmtNum(x.count)} ta</span>
            </span>
            <span className="font-label-md text-label-md tabular-nums">{fmtMoney(x.amount)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-4 py-2.5 text-body-sm">
        <span className="text-on-surface-variant">Jami reja (bekor qilinganlarsiz)</span>
        <span className="font-semibold tabular-nums">{fmtMoney(t.plan)}</span>
      </div>
      {r.methods.length ? (
        <div>
          <p className="mb-1.5 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Toʻlov usullari</p>
          <div className="flex flex-wrap gap-1.5">
            {r.methods.map((m) => (
              <Badge key={m.method} tone="neutral">
                {m.label}: {fmtMoney(m.amount)}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
