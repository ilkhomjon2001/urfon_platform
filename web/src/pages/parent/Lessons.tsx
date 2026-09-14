// /ota-ona/darslar — dars kunlari taqvimi va davomat (mockup: urfon_ota_ona_kabineti_dars_kunlari_taqvimi_va_davomat_monitoringi).
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Badge, Button, Card, CardContent, EmptyState, Icon, IconButton, PageHeader, ProgressBar, Skeleton, Tabs, TabsList, TabsTrigger, buttonVariants } from "@/components/ui";
import { downloadFile } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtDate, fmtDayMonth, fmtDays, fmtFileSize, fmtTime, fmtTimeRange, fmtWeekday, gradeLabel, todayYmd, toYmd, WEEKDAYS_SHORT } from "@/lib/format";
import { toastError } from "@/lib/query";
import { iconTileTone } from "@/components/ui";
import {
  contactLink,
  DAY_CELL,
  DAY_DOT,
  DAY_META,
  ErrorCard,
  fmtGrade,
  fmtPeriod,
  InfoRow,
  isAttended,
  NoChild,
  PageSkeleton,
  PARENT_BASE,
  shiftMonth,
  STUDENT_STATUS,
  TeacherAvatar,
  useChildQuery,
} from "./p/shared";
import type { CalendarLesson, DayState, LessonDetailData, LessonsData } from "./p/types";

const DAY_MS = 86_400_000;
const lessonName = (l: { title: string | null; topics: { unit: number; title: string }[] }) =>
  l.title ?? (l.topics[0] ? `Unit ${l.topics[0].unit} — ${l.topics[0].title}` : "Dars");

function buildGrid(month: string) {
  const [y, m] = month.split("-").map(Number);
  const first = Date.UTC(y, m - 1, 1);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (new Date(first).getUTCDay() + 6) % 7; // 0 = Du
  const total = Math.ceil((lead + days) / 7) * 7;
  return Array.from({ length: total }, (_, i) => {
    const d = new Date(first + (i - lead) * DAY_MS);
    return { ymd: d.toISOString().slice(0, 10), day: d.getUTCDate(), inMonth: d.getUTCMonth() === m - 1, weekday: (i % 7) + 1 };
  });
}

export default function ParentLessons() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const currentMonth = todayYmd().slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(sp.get("oy") ?? "") ? (sp.get("oy") as string) : currentMonth;
  const view = sp.get("k") === "royxat" ? "list" : "calendar";
  const { data, isLoading, error, refetch, child, isPlaceholderData } = useChildQuery<LessonsData>(["lessons"], "/parent/lessons", { month }, { keepPrevious: true });
  const [picked, setPicked] = useState<string | null>(null);

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(sp);
    if (v == null) next.delete(k);
    else next.set(k, v);
    setSp(next, { replace: true });
  };

  const lessons = useMemo(() => (data && data.month === month ? data.lessons : (data?.lessons ?? [])), [data, month]);
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarLesson[]>();
    for (const l of lessons) {
      const k = toYmd(l.startsAt);
      map.set(k, [...(map.get(k) ?? []), l]);
    }
    return map;
  }, [lessons]);

  const today = todayYmd();
  const selectedId = useMemo(() => {
    if (picked && lessons.some((l) => l.id === picked)) return picked;
    const now = Date.now();
    return (
      byDay.get(today)?.[0]?.id ??
      [...lessons].reverse().find((l) => new Date(l.startsAt).getTime() <= now)?.id ??
      lessons[0]?.id ??
      null
    );
  }, [picked, lessons, byDay, today]);

  if (!child) return <NoChild />;
  if (isLoading) return <PageSkeleton cards={5} />;
  if (error || !data) return <ErrorCard error={error} onRetry={() => void refetch()} />;

  const s = data.stats;
  const g = data.child.group;
  const canPrev = !data.range.first || month > data.range.first;
  const canNext = !data.range.last || month < data.range.last || month < currentMonth;
  const missedDays = lessons.filter((l) => l.state === "ABSENT" || l.state === "EXCUSED");
  const monthName = fmtPeriod(month).split(",")[0];
  const st = STUDENT_STATUS[data.child.status] ?? STUDENT_STATUS.ACTIVE;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Bosh sahifa", to: PARENT_BASE }, { label: "Davomat va darslar" }]}
        title="Dars kunlari va davomat"
        subtitle={`${data.child.fullName}ning dars kunlari, davomati va darsdagi natijalari`}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-display text-headline-sm font-bold text-on-primary">
                {data.child.fullName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((w) => Array.from(w)[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-headline-md text-headline-md text-on-surface">{data.child.fullName}</h2>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </div>
                <p className="truncate text-body-sm text-on-surface-variant">
                  {g ? `${g.name}${g.level?.label ? ` · ${g.level.label}` : ""}` : "Guruh biriktirilmagan"}
                </p>
              </div>
            </div>
            {g ? (
              <div className="space-y-2 rounded-xl bg-surface-container-low p-3">
                {g.room || g.branch ? (
                  <InfoRow icon="location_on">{[g.branch?.name, g.room?.name].filter(Boolean).join(", ")}</InfoRow>
                ) : null}
                <InfoRow icon="schedule">{fmtDays(g.days, g.startTime, g.endTime)}</InfoRow>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:col-span-8", isPlaceholderData && "opacity-60")}>
          <MiniStat label="Jami darslar" icon="calendar_month" value={s.planned} sub={`${monthName} rejasida`} />
          <MiniStat label="Qatnashdi" icon="check_circle" tone="success" value={s.attended} sub={s.late ? `${s.late} tasida kechikdi` : "Oʻz vaqtida"} />
          <MiniStat
            label="Kelmadi"
            icon="cancel"
            tone="danger"
            value={s.missed}
            sub={
              missedDays.length
                ? missedDays
                    .slice(0, 2)
                    .map((l) => `${fmtDayMonth(l.startsAt)}${l.state === "EXCUSED" ? " (sababli)" : ""}`)
                    .join(", ")
                : "Qoldirmagan"
            }
          />
          <MiniStat label="Boʻlajak" icon="event_upcoming" value={s.upcoming} sub="Oy oxirigacha" />
          <div className="col-span-2 flex flex-col justify-between rounded-xl bg-primary p-4 text-on-primary shadow-card sm:col-span-1">
            <div className="flex items-center justify-between font-label-md text-label-md">
              Davomat
              <Icon name="donut_large" size={20} />
            </div>
            <div className="mt-3">
              <div className="font-display text-display-sm font-bold">{s.percent != null ? `${s.percent}%` : "—"}</div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-on-primary/20">
                <div className="h-full rounded-full bg-gold" style={{ width: `${s.percent ?? 0}%` }} />
              </div>
              <div className="mt-1.5 text-body-sm opacity-80">{s.marked ? `${s.marked} darsdan ${s.attended} tasi` : "Hali dars oʻtilmagan"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-xl bg-surface-container-low p-1">
                  <IconButton icon="chevron_left" label="Oldingi oy" size="sm" disabled={!canPrev} onClick={() => { setPicked(null); setParam("oy", shiftMonth(month, -1)); }} />
                  <span className="min-w-[8.5rem] text-center font-headline-md text-headline-md text-on-surface">{fmtPeriod(month)}</span>
                  <IconButton icon="chevron_right" label="Keyingi oy" size="sm" disabled={!canNext} onClick={() => { setPicked(null); setParam("oy", shiftMonth(month, 1)); }} />
                </div>
                {month !== currentMonth ? (
                  <Button variant="secondary" size="sm" onClick={() => { setPicked(null); setParam("oy", null); }}>
                    Bugun
                  </Button>
                ) : null}
              </div>
              <Tabs value={view} onValueChange={(v) => setParam("k", v === "list" ? "royxat" : null)} variant="segmented">
                <TabsList>
                  <TabsTrigger value="calendar" icon="calendar_view_month">
                    Oylik taqvim
                  </TabsTrigger>
                  <TabsTrigger value="list" icon="view_list">
                    Roʻyxat
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Legend />

            <div className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
              {view === "calendar" ? (
                <CalendarGrid month={month} byDay={byDay} today={today} selectedId={selectedId} onPick={setPicked} />
              ) : (
                <LessonList lessons={lessons} onOpen={(id) => navigate(`${PARENT_BASE}/darslar/${id}`)} />
              )}
            </div>

            {g ? (
              <div className="flex items-start gap-2 rounded-xl bg-surface-container-low px-4 py-3 text-body-sm text-on-surface-variant">
                <Icon name="info" size={18} className="mt-px shrink-0 text-primary" />
                <span>Dars kunlari: {fmtDays(g.days, g.startTime, g.endTime)}. Jadval oʻzgarsa, administrator oldindan xabar beradi.</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-6">
          {selectedId ? (
            <LessonPreview key={selectedId} lessonId={selectedId} />
          ) : (
            <Card>
              <EmptyState compact icon="event_busy" title="Bu oyda dars yoʻq" description="Boshqa oyni tanlang." />
            </Card>
          )}
          <Card>
            <CardContent className="flex gap-3">
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", iconTileTone.primary)}>
                <Icon name="lightbulb" size={20} />
              </span>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Ota-ona uchun eslatma</h3>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  Farzandingiz darsga kela olmaydigan kunlarda sababini{" "}
                  <Link to={contactLink({ teacherId: g?.teacher?.id })} className="font-semibold text-primary underline">
                    «Ustoz bilan aloqa»
                  </Link>{" "}
                  boʻlimi orqali oldindan yuboring.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, icon, value, sub, tone }: { label: string; icon: string; value: number; sub: string; tone?: "success" | "danger" }) {
  return (
    <div className="flex min-w-0 flex-col justify-between rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-4 shadow-card">
      <div className={cn("flex items-center justify-between gap-2 font-label-md text-label-md", tone === "success" ? "text-success" : tone === "danger" ? "text-error" : "text-on-surface-variant")}>
        <span className="truncate">{label}</span>
        <Icon name={icon} size={20} />
      </div>
      <div className="mt-3">
        <span className={cn("font-metric-num text-metric-num", tone === "success" ? "text-success" : tone === "danger" ? "text-error" : "text-on-surface")}>{value}</span>
        <span className="ml-1 text-body-sm text-on-surface-muted">ta</span>
        <div className={cn("mt-1 truncate text-body-sm", tone === "danger" && value ? "text-error" : "text-on-surface-variant")} title={sub}>
          {sub}
        </div>
      </div>
    </div>
  );
}

const LEGEND: DayState[] = ["PRESENT", "LATE", "EXCUSED", "ABSENT", "PLANNED"];

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-surface-container-low px-4 py-2.5 font-label-md text-label-md text-on-surface">
      {LEGEND.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-full", DAY_DOT[s])} />
          {DAY_META[s].short}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full border-2 border-primary" />
        Bugun
      </span>
    </div>
  );
}

function CalendarGrid({
  month,
  byDay,
  today,
  selectedId,
  onPick,
}: {
  month: string;
  byDay: Map<string, CalendarLesson[]>;
  today: string;
  selectedId: string | null;
  onPick: (id: string) => void;
}) {
  const cells = buildGrid(month);
  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
        {WEEKDAYS_SHORT.map((d, i) => (
          <div key={d} className={cn("text-center font-label-sm text-label-sm uppercase tracking-wider", i >= 5 ? "text-outline" : "text-on-surface-variant")}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((c) => {
          const ls = byDay.get(c.ymd) ?? [];
          const l = ls[0];
          const isToday = c.ymd === today;
          const selected = !!l && ls.some((x) => x.id === selectedId);
          if (!l) {
            return (
              <div
                key={c.ymd}
                className={cn(
                  "min-h-[52px] rounded-lg p-1.5 sm:min-h-[92px] sm:rounded-xl sm:p-2",
                  c.inMonth ? "bg-surface-container-low/60" : "bg-transparent",
                  isToday && "ring-2 ring-primary",
                )}
              >
                <span className={cn("font-label-md text-label-md", c.inMonth ? (c.weekday >= 6 ? "text-outline" : "text-on-surface-variant") : "text-outline-variant")}>{c.day}</span>
              </div>
            );
          }
          const meta = DAY_META[l.state];
          const grade = l.gradeAvg;
          return (
            <button
              key={c.ymd}
              type="button"
              onClick={() => onPick(l.id)}
              aria-pressed={selected}
              aria-label={`${fmtDate(l.startsAt)}, ${lessonName(l)}: ${meta.label}`}
              className={cn(
                "group flex min-h-[52px] min-w-0 flex-col rounded-lg border p-1.5 text-left transition-shadow hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:min-h-[92px] sm:rounded-xl sm:p-2",
                selected ? "border-primary-container bg-primary-container text-on-primary" : DAY_CELL[l.state],
                isToday && !selected && "ring-2 ring-primary",
                !c.inMonth && "opacity-50",
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={cn("font-label-lg text-label-lg", selected ? "text-on-primary" : "text-on-surface")}>{c.day}</span>
                {isToday ? (
                  <span className={cn("hidden rounded px-1.5 font-label-sm text-label-sm sm:inline", selected ? "bg-gold text-on-tertiary-fixed" : "bg-primary text-on-primary")}>Bugun</span>
                ) : (
                  <Icon name={meta.icon} size={16} className={cn("hidden sm:inline", selected ? "text-on-primary" : iconColor(l.state))} />
                )}
              </div>
              <span className={cn("mt-auto h-1.5 w-1.5 rounded-full sm:hidden", selected ? "bg-gold" : DAY_DOT[l.state])} />
              <div className={cn("mt-auto hidden min-w-0 rounded-md px-1.5 py-1 sm:block", selected ? "bg-surface-container-lowest text-on-surface" : "bg-surface-container-lowest/70")}>
                <div className={cn("truncate font-label-sm text-label-sm", selected ? "text-primary" : "text-on-surface")}>
                  {fmtTime(l.startsAt)} · {lessonName(l)}
                </div>
                <div className={cn("truncate text-[11px] leading-4", iconColor(l.state))}>
                  {meta.short}
                  {l.attendance?.arrivedAt && isAttended(l.attendance.status) ? ` (${fmtTime(l.attendance.arrivedAt)})` : ""}
                  {grade != null ? ` · ${fmtGrade(grade)}` : ""}
                </div>
              </div>
              {ls.length > 1 ? <span className="mt-0.5 hidden text-[11px] sm:block">+{ls.length - 1} dars</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function iconColor(s: DayState) {
  return s === "PRESENT" ? "text-success" : s === "LATE" ? "text-warning" : s === "ABSENT" ? "text-error" : s === "EXCUSED" ? "text-primary" : "text-on-surface-muted";
}

function LessonList({ lessons, onOpen }: { lessons: CalendarLesson[]; onOpen: (id: string) => void }) {
  if (!lessons.length) return <EmptyState compact icon="event_busy" title="Bu oyda dars yoʻq" />;
  return (
    <ul className="divide-y divide-outline-variant/70 overflow-hidden rounded-xl border border-outline-variant/70">
      {lessons.map((l) => {
        const meta = DAY_META[l.state];
        return (
          <li key={l.id}>
            <button type="button" onClick={() => onOpen(l.id)} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-surface-container-low sm:px-4">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-container">
                <span className="font-headline-sm text-headline-sm leading-5 text-on-surface">{fmtDayMonth(l.startsAt).split("-")[0]}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">{fmtWeekday(l.startsAt, true)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-label-lg text-label-lg text-on-surface">{lessonName(l)}</div>
                <div className="truncate text-body-sm text-on-surface-variant">
                  {fmtTimeRange(l.startsAt, l.endsAt)}
                  {l.room ? ` · ${l.room.name}` : ""}
                  {l.attendance?.arrivedAt && isAttended(l.attendance.status) ? ` · keldi ${fmtTime(l.attendance.arrivedAt)}` : ""}
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5 sm:hidden">
                  <Badge tone={meta.tone} icon={meta.icon}>{meta.short}</Badge>
                  {l.gradeAvg != null ? <Badge tone="gold">Baho: {fmtGrade(l.gradeAvg)}</Badge> : null}
                </div>
              </div>
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                {l.gradeAvg != null ? <Badge tone="gold">Baho: {fmtGrade(l.gradeAvg)}</Badge> : null}
                <Badge tone={meta.tone} icon={meta.icon}>
                  {meta.short}
                </Badge>
              </div>
              <Icon name="chevron_right" className="shrink-0 text-outline" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ─────────────────────────────── Tanlangan dars (o'ng panel)

function LessonPreview({ lessonId }: { lessonId: string }) {
  const { data, isLoading, error, refetch } = useChildQuery<LessonDetailData>(["lesson", lessonId], `/parent/lessons/${lessonId}`);
  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }
  if (error || !data) return <ErrorCard error={error} onRetry={() => void refetch()} />;
  const { lesson: l, attendance: a } = data;
  const meta = DAY_META[l.state];
  const arrivalDiff = a?.arrivedAt ? Math.round((new Date(a.arrivedAt).getTime() - new Date(l.startsAt).getTime()) / 60_000) : null;
  const grade = data.grades.find((g) => g.kind === "CLASSWORK") ?? data.grades[0];
  const hw = data.homework[0];
  const material = data.materials.find((m) => m.file) ?? null;
  const topic = l.topics[0];

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge tone="primary" shape="square">
              Tanlangan dars
            </Badge>
            <h3 className="mt-2 font-headline-lg text-headline-lg text-on-surface">{fmtDate(l.startsAt)}</h3>
            <p className="flex items-center gap-1 text-body-sm text-on-surface-variant">
              <Icon name="schedule" size={16} />
              {fmtWeekday(l.startsAt)} · {fmtTimeRange(l.startsAt, l.endsAt)}
            </p>
          </div>
          <Badge tone={meta.tone} icon={meta.icon}>
            {meta.short}
          </Badge>
        </div>

        <div className="rounded-xl bg-surface-container-low p-4">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">Dars mavzusi</p>
          <p className="mt-1 font-headline-sm text-headline-sm text-on-surface">{topic ? `Unit ${topic.unit} — ${topic.title}` : (l.title ?? "Dars")}</p>
          {topic?.description ? <p className="mt-1 line-clamp-3 text-body-sm text-on-surface-variant">{topic.description}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-outline-variant/70 p-3">
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconTileTone[a && isAttended(a.status) ? "success" : "neutral"])}>
              <Icon name="login" size={18} />
            </span>
            <div className="min-w-0">
              <div className="truncate text-body-sm text-on-surface-variant">{a?.source === "TURNSTILE" ? "Turniket" : "Keldi"}</div>
              <div className="font-label-lg text-label-lg text-on-surface">
                {a?.arrivedAt ? fmtTime(a.arrivedAt) : "—"}
                {arrivalDiff != null ? (
                  <span className={cn("ml-1 text-[11px]", arrivalDiff > 0 ? "text-warning" : "text-success")}>
                    ({arrivalDiff > 0 ? "+" : "−"}{Math.abs(arrivalDiff)} daq)
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-outline-variant/70 p-3">
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconTileTone.primary)}>
              <Icon name="meeting_room" size={18} />
            </span>
            <div className="min-w-0">
              <div className="text-body-sm text-on-surface-variant">Auditoriya</div>
              <div className="truncate font-label-lg text-label-lg text-on-surface">{l.room?.name ?? "—"}</div>
            </div>
          </div>
        </div>

        {l.teacher ? (
          <div className="flex items-center gap-3">
            <TeacherAvatar teacher={l.teacher} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-label-lg text-label-lg text-on-surface">{l.teacher.fullName}</div>
              <div className="truncate text-body-sm text-on-surface-variant">
                {[l.teacher.title, l.teacher.specialization].filter(Boolean).join(" · ")}
              </div>
            </div>
            <Link to={contactLink({ teacherId: l.teacher.id })} className={buttonVariants({ variant: "ghost", size: "sm", className: "text-primary" })} aria-label="Ustozga yozish" title="Ustozga yozish">
              <Icon name="chat" size={20} />
            </Link>
          </div>
        ) : null}

        {grade ? (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-tertiary-fixed/60 p-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-on-tertiary-fixed">
                <Icon name="star" size={20} filled />
              </span>
              <div>
                <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-tertiary-fixed-variant">{grade.kindLabel}</div>
                <div className="font-headline-md text-headline-md text-on-surface">
                  {fmtGrade(grade.value)} ({gradeLabel(grade.value)})
                </div>
              </div>
            </div>
            {data.coins.total > 0 ? (
              <Badge tone="gold" variant="outline" icon="toll">
                +{data.coins.total} tanga
              </Badge>
            ) : null}
          </div>
        ) : null}

        {hw ? (
          <div className="rounded-xl bg-surface-container-low p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-label-lg text-label-lg text-on-surface">
                <Icon name="assignment" size={18} className="text-primary" />
                Uyga vazifa berildi
              </span>
              <Badge tone={hw.state === "reviewed" ? "success" : hw.state === "missed" ? "danger" : hw.state === "open" ? "gold" : "primary"}>
                {hw.state === "open" ? "Jarayonda" : hw.state === "submitted" ? "Topshirildi" : hw.state === "reviewed" ? `Baho: ${hw.submission?.score ?? "—"}` : hw.state === "returned" ? "Qaytarildi" : "Topshirilmadi"}
              </Badge>
            </div>
            <p className="mt-1 text-body-md text-on-surface">{hw.title}</p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-body-sm text-on-surface-variant">
              <span>
                Muddati: {fmtDayMonth(hw.dueAt)}, {fmtTime(hw.dueAt)} gacha
              </span>
              <Link to={`${PARENT_BASE}/vazifalar`} className="font-label-md text-label-md text-primary hover:underline">
                Vazifalar →
              </Link>
            </div>
          </div>
        ) : null}

        {l.summary ? (
          <div>
            <p className="mb-2 flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant">
              <Icon name="rate_review" size={16} /> Ustoz izohi
            </p>
            <blockquote className="border-l-4 border-primary-container pl-3 text-body-md italic text-on-surface">«{l.summary}»</blockquote>
          </div>
        ) : null}

        {material?.file ? (
          <div className="flex items-center gap-3 rounded-xl border border-outline-variant/70 p-3">
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconTileTone.danger)}>
              <Icon name="description" size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-label-lg text-label-lg text-on-surface">{material.title}</div>
              <div className="text-body-sm text-on-surface-muted">
                {fmtFileSize(material.file.size)}
                {data.materials.length > 1 ? ` · yana ${data.materials.length - 1} ta material` : ""}
              </div>
            </div>
            <IconButton
              icon="download"
              label="Yuklab olish"
              size="sm"
              className="text-primary"
              onClick={() => downloadFile(material.file!.id, material.file!.originalName).catch((e) => toastError(e))}
            />
          </div>
        ) : null}

        {!a && l.state === "PLANNED" ? <ProgressBar value={0} size="sm" label="Dars hali boʻlib oʻtmagan" /> : null}

        <div className="grid grid-cols-2 gap-3">
          <Link to={`${PARENT_BASE}/darslar/${l.id}#savol`} className={buttonVariants({ variant: "primary", block: true })}>
            <Icon name="help" size={18} />
            Savol berish
          </Link>
          <Link to={`${PARENT_BASE}/darslar/${l.id}`} className={buttonVariants({ variant: "outline", block: true })}>
            <Icon name="visibility" size={18} />
            Batafsil
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
