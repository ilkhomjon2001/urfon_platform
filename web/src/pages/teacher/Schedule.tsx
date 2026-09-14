import { Fragment, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  Icon,
  IconButton,
  Input,
  PageHeader,
  ProgressBar,
  Skeleton,
  StatCard,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { useCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { fmtNum, fmtTimeRange, WEEKDAYS_FULL, WEEKDAYS_SHORT } from "@/lib/format";
import { useSearchParamState } from "@/lib/hooks";
import { useApiQuery } from "@/lib/query";
import { ErrorCard, LessonStatusBadge, fmtWeekRange, fmtYmdDayMonth, lessonTitle, qk } from "./a/shared";
import type { RoomsResponse, ScheduleExam, ScheduleLesson, ScheduleResponse } from "./a/types";

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const EXAM_TYPE: Record<string, string> = { MOCK: "Mock imtihon", MIDTERM: "Oraliq nazorat", FINAL: "Yakuniy imtihon", QUIZ: "Test" };

type Item = { kind: "lesson"; l: ScheduleLesson } | { kind: "exam"; e: ScheduleExam };

export default function TeacherSchedulePage() {
  const user = useCurrentUser();
  const [week, setWeek] = useSearchParamState("w", "");
  const [view, setView] = useSearchParamState("t", "week");
  const [roomDate, setRoomDate] = useSearchParamState("d", "");

  const q = useApiQuery<ScheduleResponse>(qk.schedule, "/teacher/schedule", {
    params: { weekStart: week || undefined },
    placeholderData: (prev) => prev,
    refetchInterval: 60_000,
  });
  const d = q.data;
  const rooms = useApiQuery<RoomsResponse>(qk.rooms, view === "rooms" ? "/teacher/rooms-occupancy" : null, {
    params: { date: roomDate || undefined },
    placeholderData: (prev) => prev,
  });

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Bosh sahifa", to: "/ustoz" }, { label: "Dars jadvali" }]}
        title="Dars jadvali va auditoriyalar bandligi"
        documentTitle="Dars jadvali"
        badge={
          <Badge tone="primary" icon="verified">
            {user.fullName}
            {user.title ? ` • ${user.title}` : ""}
          </Badge>
        }
        subtitle="Haftalik dars taqvimi, xonalar bandligi va imtihonlar"
        actions={
          <Tabs value={view} onValueChange={setView} variant="segmented">
            <TabsList>
              <TabsTrigger value="week" icon="calendar_view_week">
                Haftalik
              </TabsTrigger>
              <TabsTrigger value="rooms" icon="meeting_room">
                Auditoriyalar
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {q.isLoading ? (
        <ScheduleSkeleton />
      ) : q.error || !d ? (
        <ErrorCard error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <>
          <Card className="mb-6 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <IconButton icon="chevron_left" label="Oldingi hafta" variant="outline" size="sm" onClick={() => setWeek(d.prevWeekStart)} />
              <IconButton icon="chevron_right" label="Keyingi hafta" variant="outline" size="sm" onClick={() => setWeek(d.nextWeekStart)} />
              <span className="ml-1 font-headline-md text-headline-md text-on-surface">{fmtWeekRange(d.weekStart, d.weekEnd)}</span>
              {d.isCurrentWeek ? (
                <Badge tone="primary">Joriy hafta</Badge>
              ) : (
                <Button variant="link" size="sm" onClick={() => setWeek(null)}>
                  Bugunga qaytish
                </Button>
              )}
              {q.isFetching ? <Icon name="progress_activity" size={18} className="animate-spin text-primary" /> : null}
            </div>
            <span className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant">
              <Icon name="schedule" size={16} />
              Filial ish vaqti: {fmtTimeRange(d.workHours.from, d.workHours.to)}
            </span>
          </Card>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Haftalik dars yuki" value={fmtNum(d.stats.hours)} unit="soat" icon="timer" sub={`${d.stats.lessons} ta dars, ${d.stats.groups} ta guruh`} />
            <StatCard
              label="Bugungi darslar"
              value={fmtNum(d.stats.todayLessons)}
              unit="ta dars"
              icon="event_available"
              sub={
                d.stats.nextLesson
                  ? `Keyingisi: ${d.stats.nextLesson.date === d.today ? "" : `${fmtYmdDayMonth(d.stats.nextLesson.date)}, `}${d.stats.nextLesson.start}${d.stats.nextLesson.room ? ` (${d.stats.nextLesson.room.name})` : ""}`
                  : "Bu hafta dars qolmadi"
              }
              subIcon="schedule"
            />
            <StatCard
              label="Auditoriyalar"
              value={fmtNum(d.stats.rooms.length)}
              unit="xona"
              icon="meeting_room"
              sub={d.stats.rooms.map((r) => r.name).join(", ") || "—"}
            />
            <StatCard
              label="Bu haftadagi imtihonlar"
              value={fmtNum(d.exams.length)}
              unit="ta"
              icon="quiz"
              iconTone="gold"
              sub={d.exams[0] ? `${d.exams[0].title} · ${fmtYmdDayMonth(d.exams[0].date)}, ${d.exams[0].start}` : "Rejalashtirilmagan"}
            />
          </div>

          {view === "rooms" ? (
            <RoomsView d={d} q={rooms} date={roomDate || (d.isCurrentWeek ? d.today : d.weekStart)} setDate={setRoomDate} />
          ) : (
            <WeekView d={d} />
          )}
        </>
      )}
    </>
  );
}

// ───────────── Haftalik ko'rinish ─────────────
function WeekView({ d }: { d: ScheduleResponse }) {
  const nextId = d.stats.nextLesson?.id;
  const days = d.days.filter((day) => day.weekday < 7 || day.lessonsCount + day.examsCount > 0);
  const items = useMemo(() => {
    const all: (Item & { date: string; start: string; end: string })[] = [
      ...d.lessons.map((l) => ({ kind: "lesson" as const, l, date: l.date, start: l.start, end: l.end })),
      ...d.exams.map((e) => ({ kind: "exam" as const, e, date: e.date, start: e.start, end: e.end })),
    ];
    return all;
  }, [d]);
  const slots = useMemo(() => {
    // qator vaqti: shu boshlanish vaqtidagi eng ko'p uchraydigan tugash vaqti (14:00–15:30, 16:30 emas)
    const m = new Map<string, Map<string, number>>();
    for (const it of items) {
      const ends = m.get(it.start) ?? new Map<string, number>();
      ends.set(it.end, (ends.get(it.end) ?? 0) + 1);
      m.set(it.start, ends);
    }
    return [...m.entries()]
      .map(([start, ends]) => [start, [...ends.entries()].sort((a, b) => b[1] - a[1])[0][0]] as [string, string])
      .sort((a, b) => toMin(a[0]) - toMin(b[0]));
  }, [items]);

  if (items.length === 0) {
    return (
      <Card>
        <EmptyState icon="event_busy" title="Bu haftada dars yoʻq" description="Boshqa haftani tanlang yoki administrator bilan bogʻlaning." />
      </Card>
    );
  }

  const legend = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-body-sm text-on-surface-variant">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        Navbatdagi / jarayondagi dars
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-success" />
        Oʻtilgan
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full border border-outline bg-surface-container-lowest" />
        Rejada
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-gold" />
        Imtihon
      </span>
    </div>
  );

  return (
    <>
      {/* Planshet va kompyuter: jadval to'ri */}
      <Card className="hidden md:block">
        <CardHeader title="Haftalik taqvim" description="Darsni bosing — dars sahifasi (mavzu, davomat, faollik) ochiladi" action={legend} />
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid min-w-[760px] gap-2" style={{ gridTemplateColumns: `96px repeat(${days.length}, minmax(0, 1fr))` }}>
              <div className="flex items-center justify-center font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">Vaqt</div>
              {days.map((day) => (
                <div
                  key={day.date}
                  className={cn(
                    "rounded-lg px-2 py-2 text-center",
                    day.isToday ? "border-2 border-primary bg-primary-light" : "bg-surface-container-low",
                  )}
                >
                  <div className={cn("font-label-sm text-label-sm", day.isToday ? "text-primary" : "text-on-surface-variant")}>
                    {day.long}
                    {day.isToday ? " · Bugun" : ""}
                  </div>
                  <div className="font-headline-md text-headline-md tabular-nums text-on-surface">{Number(day.date.slice(8))}</div>
                  <div className={cn("text-[11px]", day.lessonsCount ? "text-primary" : "text-on-surface-muted")}>
                    {day.lessonsCount ? `${day.lessonsCount} ta dars` : day.examsCount ? "Imtihon kuni" : "Dars yoʻq"}
                  </div>
                </div>
              ))}
              {slots.map(([start, end]) => (
                <Fragment key={start}>
                  <div className="flex items-center justify-center text-center font-label-md text-label-md tabular-nums text-on-surface-variant">
                    {start}
                    <br />
                    {end}
                  </div>
                  {days.map((day) => {
                    const cell = items.filter((it) => it.date === day.date && it.start === start);
                    return (
                      <div key={day.date + start} className={cn("flex min-h-[112px] flex-col gap-2 rounded-lg", day.isToday && "bg-primary-light/40")}>
                        {cell.length === 0 ? (
                          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-outline-variant/70 text-body-sm text-outline">Boʻsh</div>
                        ) : (
                          cell.map((it) =>
                            it.kind === "lesson" ? <LessonCell key={it.l.id} l={it.l} next={it.l.id === nextId} /> : <ExamCell key={it.e.id} e={it.e} />,
                          )
                        )}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Telefon: kunlar ro'yxati */}
      <div className="flex flex-col gap-4 md:hidden">
        <div className="px-1">{legend}</div>
        {days.map((day) => {
          const list = items.filter((it) => it.date === day.date).sort((a, b) => toMin(a.start) - toMin(b.start));
          return (
            <Card key={day.date} className={cn(day.isToday && "border-primary")}>
              <div className="flex items-center justify-between border-b border-outline-variant/70 px-4 py-3">
                <span className="font-headline-sm text-headline-sm">
                  {day.long}, {fmtYmdDayMonth(day.date)}
                </span>
                {day.isToday ? <Badge tone="primary">Bugun</Badge> : <span className="text-body-sm text-on-surface-muted">{list.length ? `${list.length} ta` : "Dars yoʻq"}</span>}
              </div>
              {list.length ? (
                <div className="flex flex-col gap-2 p-3">
                  {list.map((it) =>
                    it.kind === "lesson" ? <LessonCell key={it.l.id} l={it.l} next={it.l.id === nextId} wide /> : <ExamCell key={it.e.id} e={it.e} wide />,
                  )}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </>
  );
}

function LessonCell({ l, next, wide }: { l: ScheduleLesson; next?: boolean; wide?: boolean }) {
  const hot = next || l.status === "IN_PROGRESS";
  return (
    <Link
      to={`/ustoz/darslar/${l.id}`}
      className={cn(
        "group flex flex-col gap-1 rounded-lg p-2.5 text-left transition-shadow hover:shadow-float",
        hot
          ? "bg-primary-container text-on-primary"
          : l.status === "DONE"
            ? "bg-surface-container-low"
            : l.status === "CANCELLED"
              ? "bg-surface-container-low opacity-60"
              : "border border-outline-variant bg-surface-container-lowest",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-1">
        <span className={cn("rounded px-1.5 py-0.5 font-label-sm text-label-sm", hot ? "bg-primary text-on-primary" : "bg-primary-fixed text-on-primary-fixed-variant")}>
          {l.group.code}
        </span>
        {hot ? (
          <span className="font-label-sm text-label-sm text-on-primary-container">{l.status === "IN_PROGRESS" ? "Jarayonda" : "Navbatdagi"}</span>
        ) : (
          <LessonStatusBadge status={l.status} className="px-1.5" />
        )}
      </div>
      <div className={cn("font-label-lg text-label-lg leading-snug", hot ? "text-on-primary" : "text-on-surface", l.status === "CANCELLED" && "line-through")}>
        {l.group.name}
      </div>
      <div className={cn("line-clamp-2 text-body-sm", hot ? "text-on-primary-container" : "text-on-surface-variant")}>{lessonTitle(l)}</div>
      <div className={cn("mt-auto flex flex-wrap items-center justify-between gap-x-2 text-[11px]", hot ? "text-on-primary-container" : "text-on-surface-muted")}>
        <span className="inline-flex items-center gap-0.5">
          <Icon name="meeting_room" size={13} />
          {l.room?.name ?? "—"}
          {wide ? ` · ${l.start}–${l.end}` : ""}
        </span>
        <span className="tabular-nums">{l.status === "DONE" || l.attended ? `${l.attended}/${l.total} keldi` : `${l.total} oʻquvchi`}</span>
      </div>
    </Link>
  );
}

function ExamCell({ e }: { e: ScheduleExam; wide?: boolean }) {
  return (
    <Link to="/ustoz/imtihonlar" className="flex flex-col gap-1 rounded-lg bg-tertiary-fixed p-2.5 text-on-tertiary-fixed transition-shadow hover:shadow-float">
      <div className="flex items-center justify-between gap-1">
        <span className="rounded bg-gold px-1.5 py-0.5 font-label-sm text-label-sm">{EXAM_TYPE[e.type] ?? e.type}</span>
        <span className="font-label-sm text-label-sm tabular-nums">
          {e.start}–{e.end}
        </span>
      </div>
      <div className="font-label-lg text-label-lg leading-snug">{e.title}</div>
      <div className="text-[11px] text-on-tertiary-fixed-variant">
        {e.group ? e.group.name : "Markaz miqyosida"}
        {e.location ? ` · ${e.location}` : ""}
      </div>
    </Link>
  );
}

// ───────────── Auditoriyalar bandligi ─────────────
function RoomsView({
  d,
  q,
  date,
  setDate,
}: {
  d: ScheduleResponse;
  q: { data?: RoomsResponse; isLoading: boolean; error: Error | null; refetch: () => unknown; isFetching: boolean };
  date: string;
  setDate: (v: string | null) => void;
}) {
  const r = q.data;
  const from = toMin(r?.workHours.from ?? "08:30");
  const to = toMin(r?.workHours.to ?? "21:00");
  const span = to - from;
  const ticks: number[] = [];
  for (let h = Math.ceil(from / 60); h * 60 <= to; h += 2) ticks.push(h * 60);
  const pos = (hhmm: string) => `${Math.max(0, Math.min(100, ((toMin(hhmm) - from) * 100) / span))}%`;
  const width = (a: string, b: string) => `${Math.max(1.5, ((toMin(b) - toMin(a)) * 100) / span)}%`;

  return (
    <Card>
      <CardHeader
        title="Auditoriyalar bandligi"
        description="Barcha xonalar boʻyicha kunlik band vaqtlar. Oʻz darslaringiz koʻk rangda — bosib ochish mumkin."
        action={q.isFetching ? <Icon name="progress_activity" size={18} className="animate-spin text-primary" /> : undefined}
      />
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {d.days
              .filter((x) => x.weekday < 7)
              .map((x) => (
                <button
                  key={x.date}
                  type="button"
                  onClick={() => setDate(x.date)}
                  aria-pressed={x.date === date}
                  className={cn(
                    "flex min-w-12 flex-col items-center rounded-lg px-2.5 py-1.5 transition-colors",
                    x.date === date ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container",
                  )}
                >
                  <span className="font-label-sm text-label-sm">{WEEKDAYS_SHORT[x.weekday - 1]}</span>
                  <span className="font-label-md text-label-md tabular-nums">{Number(x.date.slice(8))}</span>
                </button>
              ))}
          </div>
          <Input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} size="sm" className="sm:w-44" aria-label="Sana" wrapperClassName="sm:w-auto" />
        </div>

        {q.isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : q.error || !r ? (
          <EmptyState compact icon="error" title="Maʼlumotni yuklab boʻlmadi" description={q.error?.message} />
        ) : (
          <>
            <div className="text-body-sm text-on-surface-variant">
              {WEEKDAYS_FULL[r.weekday - 1]}, {fmtYmdDayMonth(r.date)}
              {r.date === r.today ? " · Bugun" : ""}
            </div>
            <div className="hidden pl-[200px] md:block">
              <div className="relative h-4">
                {ticks.map((t) => (
                  <span key={t} className="absolute -translate-x-1/2 text-[11px] tabular-nums text-on-surface-muted" style={{ left: `${((t - from) * 100) / span}%` }}>
                    {String(t / 60).padStart(2, "0")}:00
                  </span>
                ))}
              </div>
            </div>
            <ul className="flex flex-col gap-2">
              {r.rooms.map((room) => (
                <li key={room.id} className={cn("flex flex-col gap-2 rounded-xl p-3 md:flex-row md:items-center", room.hasOwn ? "bg-primary-light" : "bg-surface-container-low/60")}>
                  <div className="flex w-full shrink-0 items-start justify-between gap-2 md:w-[188px] md:flex-col md:items-stretch md:justify-start md:gap-1">
                    <div className="min-w-0">
                      <div className="font-label-lg text-label-lg text-on-surface">{room.name}</div>
                      <div className="truncate text-body-sm text-on-surface-muted">
                        {[room.kind, room.location].filter(Boolean).join(" · ") || `${room.capacity} oʻrin`}
                      </div>
                    </div>
                    <div className="w-24 md:w-full">
                      <ProgressBar value={room.loadPct} size="sm" tone={room.loadPct >= 75 ? "warning" : "primary"} label={`${room.loadPct}% band`} />
                    </div>
                  </div>
                  {/* timeline (md+) */}
                  <div className="relative hidden h-12 flex-1 rounded-lg bg-surface-container-lowest md:block">
                    {ticks.map((t) => (
                      <span key={t} className="absolute inset-y-0 w-px bg-outline-variant/70" style={{ left: `${((t - from) * 100) / span}%` }} />
                    ))}
                    {room.lessons.map((l, i) => {
                      const cls = cn(
                        "absolute inset-y-1 flex min-w-0 flex-col justify-center overflow-hidden rounded-md px-1.5 text-[11px] leading-tight",
                        l.own ? "bg-primary text-on-primary hover:bg-primary-container" : "bg-surface-container-high text-on-surface-variant",
                      );
                      const style = { left: pos(l.start), width: width(l.start, l.end) };
                      const title = `${l.start}–${l.end} · ${l.group.name}${l.teacher ? ` · ${l.teacher.fullName}` : ""}`;
                      const body = (
                        <>
                          <span className="truncate font-semibold">{l.group.name}</span>
                          <span className="truncate opacity-90">
                            {l.start}–{l.end}
                            {l.teacher && !l.own ? ` · ${l.teacher.fullName}` : ""}
                          </span>
                        </>
                      );
                      return l.own && l.id ? (
                        <Link key={i} to={`/ustoz/darslar/${l.id}`} className={cls} style={style} title={title}>
                          {body}
                        </Link>
                      ) : (
                        <div key={i} className={cls} style={style} title={title}>
                          {body}
                        </div>
                      );
                    })}
                  </div>
                  {/* telefon: ro'yxat */}
                  <div className="flex flex-col gap-1 md:hidden">
                    {room.lessons.length === 0 ? (
                      <span className="text-body-sm text-on-surface-muted">Kun boʻyi boʻsh</span>
                    ) : (
                      room.lessons.map((l, i) => {
                        const row = (
                          <span className="flex items-center justify-between gap-2 text-body-sm">
                            <span className="min-w-0 truncate">
                              <b className="font-semibold tabular-nums">
                                {l.start}–{l.end}
                              </b>{" "}
                              {l.group.name}
                            </span>
                            <span className="shrink-0 text-on-surface-muted">{l.own ? "Siz" : l.teacher?.fullName ?? ""}</span>
                          </span>
                        );
                        return l.own && l.id ? (
                          <Link key={i} to={`/ustoz/darslar/${l.id}`} className="rounded-md bg-primary px-2 py-1 text-on-primary">
                            {row}
                          </Link>
                        ) : (
                          <div key={i} className="rounded-md bg-surface-container-lowest px-2 py-1 text-on-surface-variant">
                            {row}
                          </div>
                        );
                      })
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {r.unassigned.length ? (
              <p className="text-body-sm text-on-surface-variant">Xona biriktirilmagan darslar: {r.unassigned.map((l) => `${l.start} ${l.group.name}`).join(", ")}</p>
            ) : null}
            {r.rooms.length === 0 ? <EmptyState compact icon="meeting_room" title="Xonalar kiritilmagan" /> : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ScheduleSkeleton() {
  return (
    <>
      <Skeleton className="mb-6 h-14 w-full rounded-xl" />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatCard key={i} label={<Skeleton className="h-4 w-24" />} value="" loading />
        ))}
      </div>
      <Skeleton className="h-[480px] w-full rounded-xl" />
    </>
  );
}

