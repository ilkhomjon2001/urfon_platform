// Yutuqlar va kumush tangalar. KANON §8 — bosimsiz: avval bolaning O'Z o'sishi,
// guruhdagi faollik esa alohida, tinch tabda (o'rin raqamlari, medallar, boshqalarning seriyasi/Level'i yo'q).
import { keepPreviousData } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  EmptyState,
  Icon,
  PageHeader,
  Pagination,
  ProgressBar,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { MONTHS, fmtDayMonth, fmtNum, fmtRelDateTime, tzParts } from "@/lib/format";
import { useSearchParamState } from "@/lib/hooks";
import { useApiQuery } from "@/lib/query";
import type { Paginated } from "@/lib/types";
import { CoinIcon, ErrorState, signed } from "./components/common";
import type { Achievements, CoinTx } from "./components/types";

const RULE_ICON: Record<string, string> = {
  HOMEWORK_ON_TIME: "assignment_turned_in",
  ATTENDANCE: "event_available",
  ACTIVITY: "record_voice_over",
  STREAK: "local_fire_department",
};
const REASON_ICON: Record<string, string> = { ...RULE_ICON, MANUAL: "redeem", SPEND: "shopping_bag" };
const MILESTONE_ICON: Record<string, string> = {
  first_step: "flag",
  homework_10: "menu_book",
  lessons_row: "event_available",
  active_week: "bolt",
  level_done: "school",
  long_streak: "local_fire_department",
  speaking: "mic",
  exam: "workspace_premium",
};
const MILESTONE_TILE = ["bg-primary", "bg-success", "bg-warning", "bg-navy"];

export default function StudentAchievementsPage() {
  const [tab, setTab] = useSearchParamState("t", "growth");
  const { data, isLoading, error, refetch } = useApiQuery<Achievements>(["student", "achievements"], "/student/achievements");

  const showRules = () => {
    setTab(null);
    setTimeout(() => document.getElementById("qoidalar")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    <>
      <PageHeader
        title="Kumush tangalar va yutuqlar"
        subtitle="Har bir foydali harakat uchun tanga yigʻing va oʻz oʻsishingizni kuzating."
        breadcrumbs={[{ label: "Bosh sahifa", to: "/oquvchi" }, { label: "Yutuqlar va tangalar" }]}
        actions={
          <Button variant="outline" icon="info" onClick={showRules}>
            Tangalar qoidalari
          </Button>
        }
      />
      {isLoading ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : error || !data ? (
        <Card>
          <ErrorState error={error} onRetry={() => void refetch()} />
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <Hero a={data} />
          <Tabs value={tab === "group" ? "group" : "growth"} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="growth" icon="trending_up">
                Mening oʻsishim
              </TabsTrigger>
              <TabsTrigger value="group" icon="groups">
                Guruhdagi faollik
              </TabsTrigger>
            </TabsList>
            <TabsContent value="growth" className="mt-5">
              <GrowthTab a={data} />
            </TabsContent>
            <TabsContent value="group" className="mt-5">
              <GroupTab a={data} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </>
  );
}

// ─────────────────────────── hisob ───────────────────────────

function Hero({ a }: { a: Achievements }) {
  const t = a.title;
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-navy p-5 text-on-primary shadow-card sm:p-6">
      <div aria-hidden="true" className="bg-dots pointer-events-none absolute inset-0" />
      <div className="relative grid grid-cols-1 items-center gap-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
        <div className="flex items-center gap-4">
          <div className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full bg-gradient-to-br from-surface-container-lowest to-surface-container-high ring-4 ring-on-primary/20 sm:h-24 sm:w-24">
            <CoinIcon size={40} className="text-on-tertiary-fixed-variant" />
            <span className="font-label-sm text-label-sm tracking-widest text-on-surface-muted">URFON</span>
          </div>
          <div className="min-w-0">
            <p className="font-label-sm text-label-sm uppercase tracking-wide text-on-primary/75">Mening hisobim</p>
            <p className="flex items-baseline gap-2">
              <span className="font-display-lg text-display-lg tabular-nums">{fmtNum(a.balance)}</span>
              <span className="font-headline-md text-headline-md text-gold">tanga</span>
            </p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-on-primary/15 px-2.5 py-0.5 font-label-sm text-label-sm">
              <Icon name="verified" size={14} />
              {t.current} unvoni
            </span>
          </div>
        </div>

        <div className="min-w-0">
          {a.streak.days > 0 ? (
            <span className="inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-lg bg-on-primary/10 px-3 py-1.5 text-body-sm">
              <Icon name="local_fire_department" filled size={18} className="text-gold" />
              <b>{a.streak.days} kunlik seriya</b>
              <span className="text-on-primary/80">
                — {a.streak.activeToday ? "ertaga" : "bugun faol boʻlsangiz"} yana <b className="text-gold">+{a.streak.bonus} tanga</b>
              </span>
            </span>
          ) : null}
          {t.next ? (
            <>
              <div className="mt-3 flex items-end justify-between gap-3 text-body-sm">
                <span>
                  {t.next.name} unvonigacha <b>{fmtNum(t.next.remaining)} tanga</b>
                </span>
                <span className="tabular-nums text-on-primary/80">
                  {fmtNum(a.balance)} / {fmtNum(t.next.target)}
                </span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-on-primary/15" role="progressbar" aria-valuenow={t.progress} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-gold" style={{ width: `${Math.max(3, t.progress)}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-body-sm text-on-primary/75">
                <span>{t.current}</span>
                <span>
                  {t.next.name} ({fmtNum(t.next.target)})
                </span>
              </div>
            </>
          ) : (
            <p className="mt-3 text-body-md">Siz eng yuqori unvonga erishgansiz — ajoyib mehnat!</p>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-on-primary/15 bg-on-primary/10 p-4 lg:w-56">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-on-primary/15">
            <Icon name="trending_up" size={22} />
          </span>
          <div>
            <p className="text-body-sm text-on-primary/75">Oxirgi 7 kun</p>
            <p className="font-headline-md text-headline-md">{signed(a.growth.thisWeek)} tanga</p>
            <p className="text-body-sm text-on-primary/75">Oʻtgan hafta: {signed(a.growth.lastWeek)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── o'z o'sishi ───────────────────────────

function GrowthTab({ a }: { a: Achievements }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
          <WeeklyCard a={a} />
          <Rules a={a} />
        </div>
        <aside className="flex min-w-0 flex-col gap-6 lg:col-span-4">
          <Milestones a={a} />
          <Transactions a={a} />
          <Titles a={a} />
        </aside>
      </div>
    </div>
  );
}

const shortDate = (d: string) => {
  const p = tzParts(d);
  return `${p.day}-${MONTHS[p.month].slice(0, 3)}`;
};

/** Oxirgi 8 hafta — bitta seriya (faqat o'zi), ingichka ustunlar, joriy hafta ta'kidlangan, hover/focus'da tooltip. */
function WeeklyChart({ weeks }: { weeks: Achievements["growth"]["weeks"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...weeks.map((w) => w.coins));
  const n = weeks.length;
  return (
    <div>
      <div className="relative flex h-44 items-end gap-2 border-b border-outline-variant sm:gap-3" onMouseLeave={() => setHover(null)}>
        {weeks.map((w, i) => {
          const h = Math.round((w.coins / max) * 100);
          const label = w.current || i === n - 2;
          return (
            <button
              key={w.start}
              type="button"
              className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end outline-none"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${fmtDayMonth(w.start)} – ${fmtDayMonth(w.end)}: ${signed(w.coins)} tanga`}
            >
              {label || hover === i ? (
                <span className={cn("mb-1 font-label-md text-label-md tabular-nums", w.current ? "text-on-surface" : "text-on-surface-variant")}>{signed(w.coins)}</span>
              ) : null}
              {w.coins > 0 ? (
                <span
                  className={cn("w-full max-w-9 rounded-t-[4px] transition-colors", w.current ? "bg-primary" : "bg-primary/35", hover === i && !w.current && "bg-primary/55")}
                  style={{ height: `${Math.max(3, h)}%` }}
                />
              ) : (
                <span className="h-[2px] w-full max-w-9 rounded-full bg-outline-variant" />
              )}
              {hover === i ? (
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-max -translate-x-1/2 rounded-lg bg-inverse-surface px-2.5 py-1.5 text-body-sm text-inverse-on-surface shadow-float">
                  {fmtDayMonth(w.start)} – {fmtDayMonth(w.end)}
                  <br />
                  <b>{signed(w.coins)} tanga</b>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-2 sm:gap-3" aria-hidden="true">
        {weeks.map((w) => (
          <span key={w.start} className={cn("min-w-0 flex-1 truncate text-center text-[11px]", w.current ? "font-semibold text-primary" : "text-on-surface-muted")}>
            {w.current ? "Soʻnggi" : shortDate(w.start)}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Haftalik tangalar</caption>
        <thead>
          <tr>
            <th>Hafta</th>
            <th>Tanga</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.start}>
              <td>
                {fmtDayMonth(w.start)} – {fmtDayMonth(w.end)}
              </td>
              <td>{w.coins}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WeeklyCard({ a }: { a: Achievements }) {
  const g = a.growth;
  const total = g.thisWeekByReason.reduce((s, r) => s + r.amount, 0);
  let note: ReactNode;
  if (g.diff > 0) note = <>Oʻtgan haftadan <b>{fmtNum(g.diff)} tanga</b> koʻproq yigʻdingiz — oʻz rekordingizga yaqinlashyapsiz!</>;
  else if (g.diff === 0 && g.thisWeek > 0) note = <>Oʻtgan haftadagidek barqaror natija — shunday davom eting.</>;
  else note = <>Hafta hali tugamadi — har bir dars va vazifa hisobga olinadi.</>;
  return (
    <Card>
      <CardHeader title="Haftalik tangalar" icon="bar_chart" description="Har bir ustun — 7 kun, oxirgi 8 hafta. Faqat oʻzingizning natijangiz" />
      <CardContent className="flex flex-col gap-5">
        <WeeklyChart weeks={g.weeks} />
        <div className="flex items-start gap-2.5 rounded-xl bg-primary-light p-3.5 text-body-md text-on-surface">
          <Icon name="trending_up" size={20} className="mt-px text-primary" />
          <p>
            {note}
            {g.thisMonth ? <span className="text-on-surface-variant"> Bu oy jami: {signed(g.thisMonth)} tanga.</span> : null}
          </p>
        </div>
        {g.thisWeekByReason.length ? (
          <div>
            <p className="mb-2.5 font-label-lg text-label-lg text-on-surface">Oxirgi 7 kunda nimalardan yigʻdingiz</p>
            <ul className="flex flex-col gap-2.5">
              {g.thisWeekByReason
                .slice()
                .sort((x, y) => y.amount - x.amount)
                .map((r) => (
                  <li key={r.reason} className="flex items-center gap-3">
                    <Icon name={REASON_ICON[r.reason] ?? "toll"} size={18} className="text-primary" />
                    <span className="w-40 shrink-0 truncate text-body-md text-on-surface sm:w-48">{r.label}</span>
                    <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-container-high">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.round((r.amount / Math.max(1, total)) * 100)}%` }} />
                    </span>
                    <span className="w-14 shrink-0 text-right font-label-lg text-label-lg tabular-nums text-on-surface">{signed(r.amount)}</span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Rules({ a }: { a: Achievements }) {
  return (
    <section id="qoidalar" className="scroll-mt-24">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-headline-lg text-headline-lg text-on-surface">
          <Icon name="savings" size={24} className="text-primary" />
          Kumush tangalarni qanday toʻplash mumkin?
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {a.rules.map((r) => (
          <div key={r.key} className="flex flex-col rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", r.key === "ACTIVITY" ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" : "bg-surface-container-high text-primary")}>
                <Icon name={RULE_ICON[r.key] ?? "toll"} size={22} />
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 font-label-md text-label-md text-on-surface">
                <CoinIcon size={14} />
                {r.amount != null ? `+${r.amount}` : `+${r.min}…+${r.max}`}
              </span>
            </div>
            <p className="mt-3 font-headline-sm text-headline-sm text-on-surface">{r.title}</p>
            <p className="mt-1 flex-1 text-body-md text-on-surface-variant">{r.description}</p>
            <p className="mt-3 inline-flex items-center gap-1 font-label-md text-label-md text-primary">
              <Icon name="check_circle" size={16} />
              {r.hint}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Milestones({ a }: { a: Achievements }) {
  const got = a.milestones.filter((m) => m.achieved).length;
  const total = a.milestones.length;
  return (
    <Card>
      <CardHeader
        title="Mening nishonlarim"
        icon="military_tech"
        description={`${got} / ${total} ta nishon qoʻlga kiritildi`}
        action={<span className="font-label-lg text-label-lg text-primary">{total ? Math.round((got / total) * 100) : 0}%</span>}
      />
      <CardContent className="flex flex-col gap-4">
        <ProgressBar value={got} max={Math.max(1, total)} />
        <div className="grid grid-cols-2 gap-2.5">
          {a.milestones.map((m, i) => (
            <div key={m.key} className={cn("flex flex-col items-center rounded-xl p-3 text-center", m.achieved ? "bg-surface-container-low" : "bg-surface-container-low/50")}>
              <span className={cn("flex h-12 w-12 items-center justify-center rounded-full", m.achieved ? cn(MILESTONE_TILE[i % MILESTONE_TILE.length], "text-on-primary shadow-card") : "bg-surface-container text-outline")}>
                <Icon name={MILESTONE_ICON[m.key] ?? "star_rate"} size={24} />
              </span>
              <p className={cn("mt-2 font-label-lg text-label-lg", m.achieved ? "text-on-surface" : "text-on-surface-muted")}>{m.title}</p>
              <p className={cn("mt-0.5 inline-flex items-center gap-1 text-[11px]", m.achieved ? "font-semibold text-primary" : "text-on-surface-muted")}>
                <Icon name={m.achieved ? "done_all" : "lock"} size={12} />
                {m.achieved ? "Ochildi" : m.date ? fmtDayMonth(m.date) : m.hint}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TxRow({ t }: { t: CoinTx }) {
  const body = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest text-primary">
        <Icon name={REASON_ICON[t.reason] ?? "toll"} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-label-lg text-label-lg text-on-surface">{t.title}</span>
        <span className="block truncate text-body-sm text-on-surface-muted">
          {fmtRelDateTime(t.createdAt)}
          {t.detail ? ` · ${t.detail}` : ""}
        </span>
      </span>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-label-md text-label-md tabular-nums",
          t.amount > 0 ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" : "bg-surface-container text-on-surface-variant",
        )}
      >
        <CoinIcon size={14} className={t.amount > 0 ? "text-on-tertiary-fixed-variant" : "text-on-surface-variant"} />
        {signed(t.amount)}
      </span>
    </>
  );
  const cls = "flex items-center gap-3 rounded-xl bg-surface-container-low p-2.5";
  return t.link ? (
    <Link to={t.link} className={cn(cls, "transition-colors hover:bg-surface-container")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function Transactions({ a }: { a: Achievements }) {
  const [open, setOpen] = useState(false);
  const items = a.transactions.items;
  return (
    <Card>
      <CardHeader
        title="Soʻnggi tangalar jurnali"
        icon="history"
        action={
          a.transactions.total > items.length ? (
            <Button variant="link" size="sm" onClick={() => setOpen(true)}>
              Barchasi ({fmtNum(a.transactions.total)})
            </Button>
          ) : undefined
        }
      />
      <CardContent className="flex flex-col gap-2">
        {items.length ? items.map((t) => <TxRow key={t.id} t={t} />) : <EmptyState compact icon="toll" title="Hali tanga yoʻq" description="Darsga keling va vazifalarni topshiring — tangalar shu yerda koʻrinadi." />}
      </CardContent>
      <AllTransactionsDialog open={open} onOpenChange={setOpen} />
    </Card>
  );
}

function AllTransactionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useApiQuery<Paginated<CoinTx>>(["student", "achievements", "tx"], open ? "/student/achievements/transactions" : null, {
    params: { page, pageSize: 20 },
    placeholderData: keepPreviousData,
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Tangalar jurnali" description="Barcha kumush tanga harakatlaringiz" size="lg">
      <div className="flex flex-col gap-2">
        {isLoading || !data ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14 rounded-xl" />) : data.items.map((t) => <TxRow key={t.id} t={t} />)}
      </div>
      {data && data.pages > 1 ? <Pagination className="mt-4" page={data.page} pageCount={data.pages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} /> : null}
    </Dialog>
  );
}

function Titles({ a }: { a: Achievements }) {
  return (
    <Card>
      <CardHeader title="Unvonlar" icon="workspace_premium" description="Tanga yigʻilgan sari yangi unvon ochiladi" />
      <CardContent>
        <ol className="flex flex-col gap-2">
          {a.title.all.map((t) => {
            const cur = t.name === a.title.current;
            return (
              <li key={t.name} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5", cur ? "border border-primary bg-primary-light" : "bg-surface-container-low")}>
                <Icon name={t.reached ? "verified" : "lock"} size={20} className={t.reached ? "text-primary" : "text-outline"} />
                <span className={cn("min-w-0 flex-1 font-label-lg text-label-lg", t.reached ? "text-on-surface" : "text-on-surface-muted")}>{t.name}</span>
                {cur ? <Badge tone="primary">Hozirgi</Badge> : null}
                <span className="shrink-0 text-body-sm tabular-nums text-on-surface-muted">{fmtNum(t.min)}+</span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────── guruhdagi faollik (alohida, tinch) ───────────────────────────

function GroupTab({ a }: { a: Achievements }) {
  if (!a.groups.length) {
    return (
      <Card>
        <EmptyState icon="groups" title="Guruh topilmadi" description="Guruhga qoʻshilganingizdan keyin guruhdagi faollik shu yerda koʻrinadi." />
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {a.groups.map((g) => (
        <div key={g.group.id} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="min-w-0 lg:col-span-8">
            <CardHeader title="Guruhdagi faollik" icon="groups" description={`${g.group.name} · oxirgi 7 kun (${fmtDayMonth(g.weekStart)} dan)`} />
            <CardContent className="flex flex-col gap-4">
              <Alert tone="primary" icon="favorite">
                Bu yerda guruhdoshlaringiz oxirgi 7 kunda yigʻgan tangalar koʻrinadi. Eng muhimi — oʻz oʻsishingiz: har kim oʻz tezligida oʻrganadi.
              </Alert>
              <ul className="flex flex-col divide-y divide-outline-variant/60 overflow-hidden rounded-xl border border-outline-variant/70">
                {g.members.map((m, i) => (
                  <li key={`${m.name}-${i}`} className={cn("flex items-center gap-3 px-4 py-3", m.isMe ? "border-l-4 border-l-primary bg-primary-light" : "bg-surface-container-lowest")}>
                    <Avatar name={m.name} size="md" tone={m.isMe ? "solid" : "neutral"} />
                    <span className={cn("min-w-0 flex-1 truncate font-label-lg text-label-lg", m.isMe ? "text-primary" : "text-on-surface")}>{m.name}</span>
                    {m.isMe ? (
                      <Badge tone="primary" variant="solid">
                        Siz
                      </Badge>
                    ) : null}
                    <span className="w-24 shrink-0 text-right">
                      <span className="font-label-lg text-label-lg tabular-nums text-on-surface">{signed(m.coins)}</span>
                      <span className="ml-1 text-body-sm text-on-surface-muted">tanga</span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <aside className="flex min-w-0 flex-col gap-6 lg:col-span-4">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tertiary-fixed text-on-tertiary-fixed-variant">
                  <Icon name="diversity_3" size={24} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-headline-sm text-headline-sm text-on-surface">Guruh umumiy jamgʻarmasi</p>
                    <Badge tone="primary">Birgalikda</Badge>
                  </div>
                  <p className="mt-1 text-body-md text-on-surface-variant">
                    {g.group.name} oxirgi 7 kunda birgalikda <b className="text-on-surface">{fmtNum(g.total.week)} tanga</b> yigʻdi.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2.5 text-body-sm">
                <span className="text-on-surface-variant">Guruh jami</span>
                <span className="inline-flex items-center gap-1 font-label-lg text-label-lg tabular-nums text-on-surface">
                  <CoinIcon size={16} />
                  {fmtNum(g.total.allTime)}
                </span>
              </div>
            </Card>
          </aside>
        </div>
      ))}
    </div>
  );
}
