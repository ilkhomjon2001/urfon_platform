import { keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Card, CardContent, CardHeader, EmptyState, Icon, PageHeader, Pagination, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fmtDate, fmtDayMonth, fmtDays, fmtNum, fmtPercent, fmtRelDay, fmtTime, fmtTimeRange, fmtWeekday, gradeTone, relDayWord, toYmd } from "@/lib/format";
import { useSearchParamState } from "@/lib/hooks";
import { useApiQuery } from "@/lib/query";
import type { Tone } from "@/lib/types";
import { CardsSkeleton, CoinChip, ErrorState, HwStateBadge, MaterialRow } from "./components/common";
import type { AttendanceStatus, LessonBase, LessonDetail, PastLessons, UpcomingLessons } from "./components/types";

const DAYS = 14;
const ATT_TONE: Record<AttendanceStatus, Tone> = { PRESENT: "success", LATE: "warning", EXCUSED: "neutral", ABSENT: "danger" };
const ATT_ICON: Record<AttendanceStatus, string> = { PRESENT: "check_circle", LATE: "schedule", EXCUSED: "event_busy", ABSENT: "cancel" };

export default function StudentLessonsPage() {
  const [tab, setTab] = useSearchParamState("t", "upcoming");
  return (
    <>
      <PageHeader title="Mening darslarim" subtitle="Dars jadvali, oʻtilgan mavzular, davomat va baholaringiz" />
      <Tabs value={tab === "past" ? "past" : "upcoming"} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="upcoming" icon="event_upcoming">
            Kelgusi darslar
          </TabsTrigger>
          <TabsTrigger value="past" icon="history">
            Oʻtgan darslar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-5">
          <Upcoming />
        </TabsContent>
        <TabsContent value="past" className="mt-5">
          <Past />
        </TabsContent>
      </Tabs>
    </>
  );
}

// ─────────────────────────── kelgusi ───────────────────────────

const dayTitle = (d: string) => {
  const w = relDayWord(d);
  return w ? `${w}, ${fmtDayMonth(d)}` : `${fmtWeekday(d)}, ${fmtDayMonth(d)}`;
};

function Upcoming() {
  const { data, isLoading, error, refetch } = useApiQuery<UpcomingLessons>(["student", "lessons", "upcoming"], "/student/lessons", { params: { range: "upcoming", days: DAYS } });
  if (isLoading) return <CardsSkeleton rows={3} />;
  if (error || !data) return <Card><ErrorState error={error} onRetry={() => void refetch()} /></Card>;

  const byDay = new Map<string, UpcomingLessons["items"]>();
  for (const l of data.items) {
    const k = toYmd(l.startsAt);
    byDay.set(k, [...(byDay.get(k) ?? []), l]);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="flex min-w-0 flex-col gap-5 lg:col-span-8">
        {data.items.length === 0 ? (
          <Card>
            <EmptyState
              icon="event_available"
              title={`Yaqin ${DAYS} kunda dars yoʻq`}
              description={data.next ? `Keyingi dars: ${dayTitle(data.next.startsAt)}, ${fmtTime(data.next.startsAt)} — ${data.next.title}` : "Dars jadvali eʼlon qilinganda shu yerda koʻrinadi."}
            />
          </Card>
        ) : (
          [...byDay.entries()].map(([ymd, list]) => (
            <section key={ymd} aria-label={dayTitle(list[0].startsAt)}>
              <h2 className={cn("mb-2 flex items-center gap-2 font-headline-sm text-headline-sm", relDayWord(list[0].startsAt) === "Bugun" ? "text-primary" : "text-on-surface")}>
                <Icon name="calendar_today" size={18} />
                {dayTitle(list[0].startsAt)}
              </h2>
              <div className="flex flex-col gap-3">
                {list.map((l) => (
                  <UpcomingRow key={l.id} l={l} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
      <aside className="flex min-w-0 flex-col gap-6 lg:col-span-4">
        <Card>
          <CardHeader title="Haftalik jadval" icon="schedule" />
          <CardContent className="flex flex-col gap-3">
            {data.schedule.length ? (
              data.schedule.map((s) => (
                <div key={s.group.id} className="rounded-xl bg-surface-container-low p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="navy" shape="square">
                      {s.group.name}
                    </Badge>
                    {s.enrollment === "WAITING" ? <Badge tone="warning">{fmtDate(s.startDate)} dan boshlanadi</Badge> : null}
                  </div>
                  <p className="mt-2 font-label-lg text-label-lg text-on-surface">{fmtDays(s.days, s.startTime, s.endTime)}</p>
                  <div className="mt-1.5 flex flex-col gap-1 text-body-sm text-on-surface-variant">
                    {s.room ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="meeting_room" size={16} />
                        {s.room.name}
                        {s.room.location ? ` · ${s.room.location}` : ""}
                      </span>
                    ) : null}
                    {s.teacher ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="person" size={16} />
                        Ustoz {s.teacher.fullName}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-body-md text-on-surface-variant">Siz hali guruhga biriktirilmagansiz.</p>
            )}
          </CardContent>
        </Card>
        {data.exams.length ? (
          <Card>
            <CardHeader title="Yaqin imtihonlar" icon="event_note" />
            <CardContent className="flex flex-col gap-2.5">
              {data.exams.map((e) => (
                <div key={e.id} className="rounded-xl border border-outline-variant/70 p-3">
                  <p className="font-label-lg text-label-lg text-on-surface">{e.title}</p>
                  <p className="mt-0.5 text-body-sm text-on-surface-muted">
                    {fmtRelDay(e.startsAt)}, {fmtTime(e.startsAt)}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </aside>
    </div>
  );
}

function StatusChip({ l }: { l: LessonBase }) {
  if (l.status === "CANCELLED") return <Badge tone="danger" icon="event_busy">Bekor qilindi</Badge>;
  if (l.isNow) return <Badge tone="success" dot>Hozir davom etmoqda</Badge>;
  if (l.status === "DONE") return <Badge tone="neutral" icon="check">Oʻtildi</Badge>;
  return null;
}

function UpcomingRow({ l }: { l: UpcomingLessons["items"][number] }) {
  return (
    <div className={cn("flex gap-3 rounded-xl border bg-surface-container-lowest p-4 shadow-card sm:gap-4", l.isNow ? "border-primary" : "border-outline-variant/70", l.status === "CANCELLED" && "opacity-70")}>
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-container">
        <span className="font-label-lg text-label-lg tabular-nums text-on-surface">{fmtTime(l.startsAt)}</span>
        <span className="text-body-sm tabular-nums text-on-surface-muted">{fmtTime(l.endsAt)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusChip l={l} />
          <Badge tone="primary" shape="square">
            {l.group.name}
          </Badge>
          {l.number ? <span className="text-body-sm text-on-surface-muted">{l.number}-dars</span> : null}
        </div>
        <p className={cn("mt-1 font-headline-sm text-headline-sm text-on-surface", l.status === "CANCELLED" && "line-through")}>{l.title}</p>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-on-surface-variant">
          {l.room ? (
            <span className="inline-flex items-center gap-1">
              <Icon name="location_on" size={16} />
              {l.room.name}
            </span>
          ) : null}
          {l.teacher ? (
            <span className="inline-flex items-center gap-1">
              <Icon name="person" size={16} />
              {l.teacher.fullName}
            </span>
          ) : null}
        </div>
        {l.homeworkNote ? <p className="mt-2 rounded-lg bg-surface-container-low px-3 py-2 text-body-sm text-on-surface-variant">{l.homeworkNote}</p> : null}
      </div>
    </div>
  );
}

// ─────────────────────────── o'tgan ───────────────────────────

function Past() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useApiQuery<PastLessons>(["student", "lessons", "past"], "/student/lessons", {
    params: { range: "past", page, pageSize: 10 },
    placeholderData: keepPreviousData,
  });
  if (isLoading) return <CardsSkeleton rows={3} />;
  if (error || !data) return <Card><ErrorState error={error} onRetry={() => void refetch()} /></Card>;
  const st = data.stats;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat icon="event_available" label="Davomat" value={st.percent != null ? fmtPercent(st.percent) : "—"} sub={`${fmtNum(st.attended)} / ${fmtNum(st.marked)} dars`} />
        <MiniStat icon="schedule" label="Kechikkan" value={fmtNum(st.late)} sub="marta" />
        <MiniStat icon="event_busy" label="Sababli" value={fmtNum(st.excused)} sub="dars" />
        <MiniStat icon="cancel" label="Qoldirilgan" value={fmtNum(st.absent)} sub="dars" />
      </div>
      {data.items.length === 0 ? (
        <Card>
          <EmptyState icon="history" title="Hali oʻtilgan dars yoʻq" description="Darslar oʻtilgach, mavzu, davomat va baholaringiz shu yerda koʻrinadi." />
        </Card>
      ) : (
        data.items.map((l) => <PastLessonCard key={l.id} l={l} />)
      )}
      {data.pages > 1 ? <Pagination page={data.page} pageCount={data.pages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} /> : null}
    </div>
  );
}

function MiniStat({ icon, label, value, sub }: { icon: string; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-4 shadow-card">
      <p className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant">
        <Icon name={icon} size={16} className="text-primary" />
        {label}
      </p>
      <p className="mt-1 font-metric-num text-metric-num tabular-nums text-on-surface">{value}</p>
      <p className="text-body-sm text-on-surface-muted">{sub}</p>
    </div>
  );
}

function PastLessonCard({ l }: { l: LessonDetail }) {
  const a = l.attendance;
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-label-md text-label-md text-on-surface-variant">
            {fmtWeekday(l.startsAt)}, {fmtDate(l.startsAt)} · {fmtTimeRange(l.startsAt, l.endsAt)}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {l.status === "CANCELLED" ? (
              <Badge tone="danger">Bekor qilindi</Badge>
            ) : a ? (
              <Badge tone={ATT_TONE[a.status]} icon={ATT_ICON[a.status]}>
                {a.label}
                {a.arrivedAt && (a.status === "PRESENT" || a.status === "LATE") ? ` · ${fmtTime(a.arrivedAt)}` : ""}
              </Badge>
            ) : (
              <Badge tone="neutral">Davomat belgilanmagan</Badge>
            )}
            {l.coins > 0 ? <CoinChip amount={l.coins} /> : null}
          </div>
        </div>
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">{l.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="navy" shape="square">
              {l.group.name}
            </Badge>
            {l.topics.map((t) => (
              <Badge key={t.id} tone="primary" shape="square">
                Unit {t.unit}
              </Badge>
            ))}
            {l.teacher ? <span className="text-body-sm text-on-surface-muted">Ustoz {l.teacher.fullName}</span> : null}
          </div>
        </div>
        {l.summary ? (
          <div className="rounded-xl bg-surface-container-low p-3.5">
            <p className="font-label-md text-label-md text-on-surface-variant">Dars xulosasi</p>
            <p className="mt-1 whitespace-pre-wrap text-body-md text-on-surface">{l.summary}</p>
          </div>
        ) : null}
        {l.grades.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-body-sm text-on-surface-muted">Baholaringiz:</span>
            {l.grades.map((g) => (
              <Badge key={g.id} tone={gradeTone(g.value)} size="md" title={g.comment ?? undefined}>
                {g.title ?? g.kindLabel}: {fmtNum(g.value)} ({g.label})
              </Badge>
            ))}
          </div>
        ) : null}
        {l.materials.length ? (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {l.materials.map((m) => (
              <MaterialRow key={m.id} m={m} compact />
            ))}
          </div>
        ) : null}
        {l.homework.length ? (
          <div className="flex flex-col gap-2">
            {l.homework.map((h) => (
              <Link
                key={h.id}
                to={`/oquvchi/vazifalar/${h.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-outline-variant/70 px-3.5 py-2.5 transition-colors hover:bg-surface-container-low"
              >
                <span className="flex min-w-0 items-center gap-2 text-body-md text-on-surface">
                  <Icon name="assignment" size={18} className="text-primary" />
                  <span className="truncate">Uyga vazifa: {h.title}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  {h.score != null ? <Badge tone={gradeTone(h.score)}>{h.score}</Badge> : null}
                  <HwStateBadge state={h.state} overdue={(h.state === "NEW" || h.state === "DRAFT") && new Date(h.dueAt) < new Date()} />
                </span>
              </Link>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
