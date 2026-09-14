import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, EmptyState, Icon, PageHeader, ProgressBar, SearchInput, Select, Skeleton, StatCard, buttonVariants } from "@/components/ui";
import { cn } from "@/lib/cn";
import { academicYearLabel, fmtAvg, fmtDate, fmtNum, fmtPercent, fmtRelDateTime } from "@/lib/format";
import { useSearchParamState } from "@/lib/hooks";
import { useApiQuery } from "@/lib/query";
import { ErrorCard, GROUP_STATUS, MiniStat, lessonTitle, levelShort, pctTone, qk, topicText } from "./a/shared";
import type { GroupCard, GroupsResponse } from "./a/types";

const SORTS = [
  { value: "time", label: "Dars vaqti boʻyicha" },
  { value: "name", label: "Nomi boʻyicha" },
  { value: "attendance", label: "Davomat boʻyicha" },
  { value: "progress", label: "Progress boʻyicha" },
];

const FILTERS = [
  { value: "all", label: "Barchasi" },
  { value: "ACTIVE", label: "Faol" },
  { value: "ENROLLING", label: "Yangi qabul" },
  { value: "FINISHED", label: "Yakunlangan" },
] as const;

export default function TeacherGroupsPage() {
  const q = useApiQuery<GroupsResponse>(qk.groups, "/teacher/groups");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useSearchParamState("f", "all");
  const [sort, setSort] = useSearchParamState("sort", "time");

  const items = useMemo(() => {
    const all = q.data?.items ?? [];
    const needle = search.trim().toLocaleLowerCase();
    const rows = all.filter((g) => {
      if (filter !== "all" && g.status !== filter) return false;
      if (!needle) return true;
      return [g.name, g.code, g.room?.name, g.level?.label, g.schedule.text].some((v) => v?.toLocaleLowerCase().includes(needle));
    });
    const by: Record<string, (a: GroupCard, b: GroupCard) => number> = {
      time: (a, b) => a.schedule.startTime.localeCompare(b.schedule.startTime) || a.code.localeCompare(b.code),
      name: (a, b) => a.name.localeCompare(b.name),
      attendance: (a, b) => (b.monthAttendancePct ?? -1) - (a.monthAttendancePct ?? -1),
      progress: (a, b) => b.progressPct - a.progressPct,
    };
    return [...rows].sort(by[sort] ?? by.time);
  }, [q.data, search, filter, sort]);

  const header = (
    <PageHeader
      title="Mening guruhlarim"
      badge={
        <Badge tone="success" dot>
          {academicYearLabel()}
        </Badge>
      }
      subtitle="Oʻquv jarayoni, davomat va oʻzlashtirish monitoringi"
      actions={
        <>
          <Link to="/ustoz/jadval" className={buttonVariants({ variant: "outline" })}>
            <Icon name="calendar_month" size={18} />
            Dars jadvali
          </Link>
          <Link to="/ustoz/xabarlar" className={buttonVariants({ variant: "primary" })}>
            <Icon name="campaign" size={18} />
            Guruhlarga eʼlon
          </Link>
        </>
      }
    />
  );

  if (q.isLoading) {
    return (
      <>
        {header}
        <GroupsSkeleton />
      </>
    );
  }
  if (q.error || !q.data) {
    return (
      <>
        {header}
        <ErrorCard error={q.error} onRetry={() => q.refetch()} />
      </>
    );
  }

  const s = q.data.summary;
  const count = (v: string) => (v === "all" ? q.data.items.length : q.data.items.filter((g) => g.status === v).length);

  return (
    <>
      {header}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Faol guruhlar"
          value={fmtNum(s.groups)}
          unit="ta guruh"
          icon="groups"
          sub={s.enrollingGroups ? `${s.activeGroups} ta faol, ${s.enrollingGroups} ta yangi qabul` : "Barchasi faol"}
        />
        <StatCard
          label="Jami oʻquvchilar"
          value={fmtNum(s.students)}
          unit="nafar"
          icon="school"
          sub={`Haftasiga ${fmtNum(s.weeklyHours)} soat dars`}
          subIcon="schedule"
        />
        <StatCard
          label="Oʻrtacha guruh davomati"
          value={<span className={cn(s.monthAttendancePct != null && s.monthAttendancePct >= 90 && "text-success")}>{fmtPercent(s.monthAttendancePct)}</span>}
          icon="event_available"
          iconTone="success"
          sub="Joriy oy boʻyicha"
          subIcon="trending_up"
        />
        <StatCard
          label="Oʻrtacha baho"
          value={fmtAvg(s.averageGrade)}
          icon="grade"
          iconTone="gold"
          badge={s.averageGradeLabel ? <Badge tone="gold">{s.averageGradeLabel}</Badge> : undefined}
          sub={s.pendingReviews ? `${fmtNum(s.pendingReviews)} ta ish tekshiruvda` : "Tekshiruvda ish yoʻq"}
          subIcon="fact_check"
        />
      </div>

      <Card className="mb-6 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <SearchInput value={search} onValueChange={setSearch} placeholder="Guruh nomi, kod yoki xona boʻyicha qidiruv…" wrapperClassName="lg:max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.filter((f) => f.value === "all" || count(f.value) > 0).map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={cn(
                "h-8 rounded-lg px-3 font-label-md text-label-md transition-colors",
                filter === f.value ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container",
              )}
            >
              {f.label} ({count(f.value)})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 lg:ml-auto">
          <span className="hidden text-body-sm text-on-surface-variant sm:inline">Saralash:</span>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} options={SORTS} size="sm" wrapperClassName="sm:w-56" aria-label="Saralash" />
        </div>
      </Card>

      {q.data.items.length === 0 ? (
        <Card>
          <EmptyState icon="groups" title="Sizga hali guruh biriktirilmagan" description="Administrator guruh biriktirgach, u shu yerda koʻrinadi." />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon="search_off"
            title="Guruh topilmadi"
            description="Qidiruv yoki filtr boʻyicha mos guruh yoʻq."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
              >
                Filtrni tozalash
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {items.map((g) => (
            <GroupCardView key={g.id} g={g} />
          ))}
        </div>
      )}
    </>
  );
}

function GroupCardView({ g }: { g: GroupCard }) {
  const st = GROUP_STATUS[g.status];
  const detail = `/ustoz/guruhlar/${g.id}`;
  const next = g.nextLesson;
  const last = g.lastLesson;
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {g.level ? (
                <Badge tone="primary" shape="square">
                  {levelShort(g.level)} · {g.level.name}
                </Badge>
              ) : (
                <Badge tone="gold" shape="square">
                  Level biriktirilmagan
                </Badge>
              )}
              <Badge shape="square" className="font-mono">
                {g.code}
              </Badge>
            </div>
            <Link to={detail} className="mt-2 block font-headline-lg text-headline-lg text-on-surface transition-colors hover:text-primary">
              {g.name}
            </Link>
          </div>
          <Badge tone={st.tone} dot>
            {st.label} • {g.doneLessons}/{g.totalLessons} dars
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-2.5 py-1 text-body-sm text-on-surface">
            <Icon name="calendar_month" size={16} className="text-on-surface-variant" />
            {g.schedule.text}
          </span>
          {g.room ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-2.5 py-1 text-body-sm text-on-surface">
              <Icon name="meeting_room" size={16} className="text-on-surface-variant" />
              {g.room.name}
              {g.room.kind && g.room.kind !== g.room.name ? ` (${g.room.kind})` : ""}
            </span>
          ) : null}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2 text-body-sm">
            <span className="text-on-surface">
              {g.doneLessons}/{g.totalLessons} dars yakunlandi
            </span>
            <span className="font-semibold text-primary">{g.progressPct}% bajarildi</span>
          </div>
          <ProgressBar value={g.progressPct} />
          <div className="mt-1.5 flex justify-between gap-2 text-body-sm text-on-surface-muted">
            <span>Boshlangan: {fmtDate(g.startDate)}</span>
            {g.endDate ? <span>Tugash sanasi: {fmtDate(g.endDate)}</span> : null}
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-outline-variant rounded-xl bg-surface-container-low py-3">
          <MiniStat label="Oʻquvchilar" value={g.studentsCount} sub={`/ ${g.capacity} nafar`} />
          <MiniStat label="Davomat" value={fmtPercent(g.monthAttendancePct)} tone={pctTone(g.monthAttendancePct)} />
          <MiniStat label="Oʻrtacha baho" value={fmtAvg(g.averageGrade)} tone="primary" />
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-outline-variant p-3.5 text-body-sm">
          <div className="flex items-start gap-2">
            <Icon name="history_edu" size={16} className="mt-0.5 text-on-surface-muted" />
            <span className="text-on-surface-variant">Oxirgi mavzu:</span>
            <span className="min-w-0 font-medium text-on-surface">
              {last ? (last.topics[0] ? topicText(last.topics[0]) : lessonTitle(last)) : "Hali dars oʻtilmagan"}
            </span>
          </div>
          <div className="flex items-start gap-2 border-t border-outline-variant/70 pt-2">
            <Icon name="event_upcoming" size={16} className="mt-0.5 text-primary" />
            <span className="text-primary">Keyingi dars:</span>
            <span className="min-w-0 font-medium text-on-surface">
              {next ? `${fmtRelDateTime(next.startsAt)} • ${lessonTitle(next)}` : "Rejalashtirilmagan"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-outline-variant/70 bg-surface-container-low/50 px-5 py-4 sm:px-6">
        {next ? (
          <Link to={`/ustoz/darslar/${next.id}`} className={buttonVariants({ size: "sm" })}>
            <Icon name={next.status === "IN_PROGRESS" ? "play_circle" : "edit_calendar"} size={16} />
            {next.status === "IN_PROGRESS" ? "Darsni davom ettirish" : "Elektron jurnal va davomat"}
          </Link>
        ) : (
          <Link to={`${detail}?t=lessons`} className={buttonVariants({ size: "sm" })}>
            <Icon name="edit_calendar" size={16} />
            Elektron jurnal
          </Link>
        )}
        <Link to={`${detail}?t=students`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Icon name="person" size={16} />
          Oʻquvchilar ({g.studentsCount})
        </Link>
        <Link to={`${detail}?t=syllabus`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Icon name="menu_book" size={16} />
          Sillabus
        </Link>
        {g.pendingReviews ? (
          <Link to={`/ustoz/vazifalar?groupId=${g.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Icon name="fact_check" size={16} />
            Tekshiruv
            <Badge tone="gold">{g.pendingReviews}</Badge>
          </Link>
        ) : null}
      </div>
    </Card>
  );
}

function GroupsSkeleton() {
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatCard key={i} label={<Skeleton className="h-4 w-24" />} value="" loading />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="flex flex-col gap-4 p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-14 w-full" />
          </Card>
        ))}
      </div>
    </>
  );
}
