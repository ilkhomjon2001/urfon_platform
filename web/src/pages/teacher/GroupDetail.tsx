import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Avatar,
  Badge,
  Card,
  CardContent,
  CardHeader,
  DataTable,
  EmptyState,
  Icon,
  PageHeader,
  ProgressBar,
  SearchInput,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  buttonVariants,
  textTone,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { avgLabel, avgTone, fmtAvg, fmtDate, fmtDateShort, fmtNum, fmtPercent, fmtRelDateTime, fmtTime, fmtWeekday, tzParts, MONTHS } from "@/lib/format";
import { useSearchParamState } from "@/lib/hooks";
import { useApiQuery } from "@/lib/query";
import { StudentDrawer } from "./a/StudentDrawer";
import { ErrorCard, GROUP_STATUS, LessonStatusBadge, lessonTitle, pctTone, qk, topicText } from "./a/shared";
import type { GroupDetailResponse, GroupLessonRow, GroupStudentRow } from "./a/types";

export default function TeacherGroupDetailPage() {
  const { groupId = "" } = useParams();
  const q = useApiQuery<GroupDetailResponse>(qk.group(groupId), groupId ? `/teacher/groups/${groupId}` : null);
  const [tab, setTab] = useSearchParamState("t", "students");
  const [studentId, setStudentId] = useSearchParamState("s", "");

  const crumbs = [{ label: "Guruhlarim", to: "/ustoz/guruhlar" }, { label: q.data?.group.name ?? "Guruh" }];

  if (q.isLoading) {
    return (
      <>
        <PageHeader title={<Skeleton className="h-8 w-72" />} documentTitle="Guruh" breadcrumbs={crumbs} />
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </>
    );
  }
  if (q.error || !q.data) {
    return (
      <>
        <PageHeader title="Guruh" breadcrumbs={crumbs} />
        <ErrorCard error={q.error} onRetry={() => q.refetch()} />
      </>
    );
  }

  const { group: g, students, lessons, syllabus, activity } = q.data;
  const st = GROUP_STATUS[g.status];
  const next = g.nextLesson;

  return (
    <>
      <PageHeader
        breadcrumbs={crumbs}
        title={g.name}
        badge={
          <>
            <Badge shape="square" className="font-mono">
              {g.code}
            </Badge>
            <Badge tone={st.tone} dot>
              {st.label}
            </Badge>
          </>
        }
        subtitle={[g.level?.label ?? "Level biriktirilmagan", g.schedule.text, g.room ? `${g.room.name}${g.room.location ? ` (${g.room.location})` : ""}` : null]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            <Link to="/ustoz/xabarlar" className={buttonVariants({ variant: "outline" })}>
              <Icon name="campaign" size={18} />
              Ota-onalarga eʼlon
            </Link>
            {next ? (
              <Link to={`/ustoz/darslar/${next.id}`} className={buttonVariants({})}>
                <Icon name={next.status === "IN_PROGRESS" ? "play_circle" : "edit_calendar"} size={18} />
                {next.status === "IN_PROGRESS" ? "Darsni davom ettirish" : "Keyingi dars"}
              </Link>
            ) : null}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi label="Oʻquvchilar" value={`${g.studentsCount}`} sub={`/ ${g.capacity} oʻrin${g.waitingCount ? ` · ${g.waitingCount} kutmoqda` : ""}`} icon="groups" />
        <Card className="col-span-2 p-4 lg:col-span-1">
          <div className="font-label-md text-label-md text-on-surface-variant">Sillabus progressi</div>
          <div className="mt-1 font-metric-num text-metric-num tabular-nums">
            {g.doneLessons}
            <span className="ml-1 font-label-sm text-label-sm text-on-surface-variant">/ {g.totalLessons} dars</span>
          </div>
          <ProgressBar value={g.progressPct} size="sm" className="mt-2" />
        </Card>
        <Kpi label="Oylik davomat" value={fmtPercent(g.monthAttendancePct)} valueCls={textTone[pctTone(g.monthAttendancePct)]} icon="event_available" />
        <Kpi label="Oʻrtacha baho" value={fmtAvg(g.averageGrade)} sub={g.averageGradeLabel ?? undefined} valueCls={textTone[avgTone(g.averageGrade)]} icon="grade" />
        <Link to={`/ustoz/vazifalar?groupId=${g.id}`} className="rounded-xl focus-visible:ring-2 focus-visible:ring-primary/40">
          <Kpi label="Tekshiruvda" value={fmtNum(g.pendingReviews)} sub="ta ish" icon="fact_check" className="h-full hover:shadow-float" />
        </Link>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="students" icon="person" count={students.length}>
            Oʻquvchilar
          </TabsTrigger>
          <TabsTrigger value="lessons" icon="event_note" count={lessons.length}>
            Darslar
          </TabsTrigger>
          <TabsTrigger value="syllabus" icon="menu_book" count={syllabus.total ? `${syllabus.coveredCount}/${syllabus.total}` : undefined}>
            Sillabus
          </TabsTrigger>
          <TabsTrigger value="activity" icon="toll">
            Guruhdagi faollik
          </TabsTrigger>
        </TabsList>
        <TabsContent value="students">
          <StudentsTab rows={students} onOpen={setStudentId} />
        </TabsContent>
        <TabsContent value="lessons">
          <LessonsTab rows={lessons} />
        </TabsContent>
        <TabsContent value="syllabus">
          <SyllabusTab data={syllabus} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab data={activity} />
        </TabsContent>
      </Tabs>

      <StudentDrawer groupId={g.id} studentId={studentId} onClose={() => setStudentId(null)} />
    </>
  );
}

function Kpi({ label, value, sub, icon, valueCls, className }: { label: string; value: string; sub?: string; icon: string; valueCls?: string; className?: string }) {
  return (
    <Card className={cn("p-4 transition-shadow", className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="font-label-md text-label-md text-on-surface-variant">{label}</span>
        <Icon name={icon} size={20} className="text-primary" />
      </div>
      <div className={cn("mt-1 font-metric-num text-metric-num tabular-nums text-on-surface", valueCls)}>{value}</div>
      {sub ? <div className="text-body-sm text-on-surface-variant">{sub}</div> : null}
    </Card>
  );
}

// ───────────── O'quvchilar ─────────────
function StudentsTab({ rows, onOpen }: { rows: GroupStudentRow[]; onOpen: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const n = search.trim().toLocaleLowerCase();
    return n ? rows.filter((r) => r.fullName.toLocaleLowerCase().includes(n) || r.code?.toLocaleLowerCase().includes(n)) : rows;
  }, [rows, search]);

  const columns: Column<GroupStudentRow>[] = [
    {
      key: "name",
      header: "Oʻquvchi",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.fullName} size="sm" />
          <div className="min-w-0">
            <div className="truncate font-medium text-on-surface">{r.fullName}</div>
            <div className="flex items-center gap-1.5 text-body-sm text-on-surface-muted">
              {r.code ? `#${r.code}` : ""}
              {r.enrollmentStatus === "WAITING" ? <Badge tone="warning">Kutmoqda</Badge> : null}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "att",
      header: "Davomat",
      cell: (r) => (
        <div className="w-24">
          <div className={cn("font-semibold tabular-nums", textTone[pctTone(r.attendance.pct)])}>{fmtPercent(r.attendance.pct)}</div>
          <div className="text-body-sm text-on-surface-muted tabular-nums">
            {r.attendance.attended}/{r.attendance.total} dars
          </div>
        </div>
      ),
    },
    {
      key: "grade",
      header: "Oʻrtacha baho",
      cell: (r) =>
        r.averageGrade != null ? (
          <div className="flex items-center gap-2">
            <span className="font-semibold tabular-nums">{fmtAvg(r.averageGrade)}</span>
            <Badge tone={avgTone(r.averageGrade)}>{avgLabel(r.averageGrade)}</Badge>
          </div>
        ) : (
          <span className="text-on-surface-muted">—</span>
        ),
    },
    {
      key: "hw",
      header: "Uyga vazifa",
      hideBelow: "md",
      cell: (r) => (
        <span className="tabular-nums">
          {r.homework.done}/{r.homework.total}
        </span>
      ),
    },
    {
      key: "coins",
      header: "Tanga (hafta)",
      hideBelow: "lg",
      cell: (r) => (
        <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-tertiary">
          <Icon name="toll" filled size={16} />+{fmtNum(r.coinsWeek)}
        </span>
      ),
    },
    {
      key: "tg",
      header: "Ota-ona Telegram",
      hideBelow: "md",
      cell: (r) =>
        r.parents.length === 0 ? (
          <span className="text-on-surface-muted">—</span>
        ) : (
          <span title={r.parents.map((p) => `${p.fullName} (${p.relation}): ${p.telegramLinked ? "ulangan" : "ulanmagan"}`).join("\n")}>
            {r.parentTelegramLinked ? (
              <Icon name="check_circle" filled size={20} className="text-success" aria-label="Ulangan" />
            ) : (
              <Icon name="cancel" size={20} className="text-outline" aria-label="Ulanmagan" />
            )}
          </span>
        ),
    },
    { key: "go", header: "", width: 40, cell: () => <Icon name="chevron_right" className="text-on-surface-variant" /> },
  ];

  return (
    <Card>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onValueChange={setSearch} placeholder="Oʻquvchi qidirish…" wrapperClassName="sm:max-w-xs" />
        <span className="text-body-sm text-on-surface-variant">Qatorni bosing — oʻquvchi profili, baholar va ota-ona bilan aloqa</span>
      </div>
      <DataTable
        rows={filtered}
        columns={columns}
        getRowId={(r) => r.id}
        onRowClick={(r) => onOpen(r.id)}
        empty={{ icon: "person_off", title: rows.length ? "Oʻquvchi topilmadi" : "Guruhda oʻquvchi yoʻq" }}
      />
    </Card>
  );
}

// ───────────── Darslar ─────────────
function LessonsTab({ rows }: { rows: GroupLessonRow[] }) {
  const [filter, setFilter] = useState<"all" | "past" | "future">("all");
  const now = Date.now();
  const upcoming = rows.filter((l) => new Date(l.endsAt).getTime() >= now && l.status !== "DONE");
  const past = rows.filter((l) => !(new Date(l.endsAt).getTime() >= now && l.status !== "DONE")).reverse();
  const sections = [
    filter !== "past" ? { key: "future", title: "Kelgusi darslar", rows: upcoming } : null,
    filter !== "future" ? { key: "past", title: "Oʻtilgan darslar", rows: past } : null,
  ].filter(Boolean) as { key: string; title: string; rows: GroupLessonRow[] }[];

  return (
    <Card>
      <CardHeader
        title="Darslar tarixi va rejasi"
        description="Mavzu, holat va davomat — darsni ochish uchun bosing"
        action={
          <div className="inline-flex rounded-lg bg-surface-container-low p-1">
            {(
              [
                ["all", "Barchasi"],
                ["past", "Oʻtilgan"],
                ["future", "Kelgusi"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setFilter(v)}
                className={cn(
                  "h-8 rounded-md px-3 font-label-md text-label-md",
                  filter === v ? "bg-surface-container-lowest text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />
      <CardContent className="flex flex-col gap-6">
        {rows.length === 0 ? (
          <EmptyState compact icon="event_busy" title="Darslar hali yaratilmagan" />
        ) : (
          sections.map((s) => (
            <section key={s.key}>
              <h3 className="mb-2 font-label-md text-label-md uppercase tracking-wider text-on-surface-muted">
                {s.title} ({s.rows.length})
              </h3>
              {s.rows.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">Yoʻq.</p>
              ) : (
                <ol className="relative flex flex-col gap-2 border-l-2 border-outline-variant pl-4">
                  {s.rows.map((l, i) => (
                    <LessonTimelineRow key={l.id} l={l} highlight={s.key === "future" && i === 0} />
                  ))}
                </ol>
              )}
            </section>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function LessonTimelineRow({ l, highlight }: { l: GroupLessonRow; highlight?: boolean }) {
  const p = tzParts(l.startsAt);
  const a = l.attendance;
  return (
    <li className="relative">
      <span
        className={cn(
          "absolute -left-[23px] top-5 h-3 w-3 rounded-full ring-4 ring-surface-container-lowest",
          l.status === "DONE" ? "bg-success" : l.status === "CANCELLED" ? "bg-error" : highlight || l.status === "IN_PROGRESS" ? "bg-primary" : "bg-outline",
        )}
      />
      <Link
        to={`/ustoz/darslar/${l.id}`}
        className={cn(
          "flex flex-col gap-3 rounded-xl p-3 transition-colors sm:flex-row sm:items-center",
          highlight ? "border border-primary/60 bg-primary-light" : "bg-surface-container-low/60 hover:bg-surface-container-low",
          l.status === "CANCELLED" && "opacity-60",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-container-lowest shadow-xs">
            <span className="font-headline-sm text-headline-sm leading-none tabular-nums">{p.day}</span>
            <span className="text-[11px] text-on-surface-muted">{MONTHS[p.month].slice(0, 3)}</span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant">
              {l.number ? <span className="font-semibold">#{l.number}</span> : null}
              <span>
                {fmtWeekday(l.startsAt, true)}, {fmtTime(l.startsAt)}–{fmtTime(l.endsAt)}
              </span>
              <LessonStatusBadge status={l.status} next={highlight} />
            </div>
            <div className="truncate font-medium text-on-surface">{lessonTitle(l)}</div>
            {l.summary ? <div className="line-clamp-1 text-body-sm text-on-surface-muted">{l.summary}</div> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 pl-[68px] text-body-sm sm:pl-0">
          {a.marked > 0 ? (
            <span className={cn("inline-flex items-center gap-1 tabular-nums", textTone[pctTone(a.total ? (a.attended * 100) / a.total : null)])}>
              <Icon name="how_to_reg" size={16} />
              {a.attended}/{a.total} keldi
            </span>
          ) : l.status !== "CANCELLED" && new Date(l.startsAt).getTime() < Date.now() ? (
            <span className="inline-flex items-center gap-1 text-warning">
              <Icon name="pending_actions" size={16} />
              Davomat yoʻq
            </span>
          ) : null}
          <Icon name="chevron_right" className="text-on-surface-variant" />
        </div>
      </Link>
    </li>
  );
}

// ───────────── Sillabus ─────────────
function SyllabusTab({ data }: { data: GroupDetailResponse["syllabus"] }) {
  if (!data.level) {
    return (
      <Card>
        <EmptyState icon="menu_book" title="Guruhga level biriktirilmagan" description="Bu guruh (masalan, klub) sillabus boʻyicha ishlamaydi — mavzular bazasi yoʻq." />
      </Card>
    );
  }
  const pct = data.total ? Math.round((data.coveredCount * 100) / data.total) : 0;
  return (
    <Card>
      <CardHeader
        title={`Sillabus — ${data.level.label}`}
        description="Mavzular bazasidagi tartib boʻyicha. Oʻtilgan deb yakunlangan darsga biriktirilgan mavzu hisoblanadi."
        action={<Badge tone="primary">{data.coveredCount}/{data.total} mavzu oʻtildi</Badge>}
      />
      <CardContent className="flex flex-col gap-4">
        <ProgressBar value={pct} showValue label="Mavzular boʻyicha progress" />
        {data.topics.length === 0 ? (
          <EmptyState compact icon="menu_book" title="Mavzular bazasi boʻsh" description="Administrator bu level uchun mavzular kiritgach koʻrinadi." />
        ) : (
          <ol className="flex flex-col gap-2">
            {data.topics.map((t) => {
              const isNext = data.nextTopic?.id === t.id;
              return (
                <li
                  key={t.id}
                  className={cn(
                    "flex gap-3 rounded-xl p-3.5",
                    isNext ? "border border-gold bg-tertiary-fixed/40" : t.covered ? "bg-surface-container-low/60" : "border border-outline-variant/70",
                  )}
                >
                  <Icon
                    name={t.covered ? "check_circle" : isNext ? "arrow_circle_right" : "radio_button_unchecked"}
                    filled={t.covered || isNext}
                    size={22}
                    className={cn("mt-0.5", t.covered ? "text-success" : isNext ? "text-tertiary" : "text-outline")}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-label-lg text-label-lg text-on-surface">{topicText(t)}</span>
                      {isNext ? <Badge tone="gold">Keyingi mavzu</Badge> : null}
                      {t.status === "ARCHIVED" ? <Badge>Arxivda</Badge> : null}
                    </div>
                    {t.description ? <p className="mt-0.5 line-clamp-2 text-body-sm text-on-surface-variant">{t.description}</p> : null}
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-on-surface-muted">
                      <span>
                        {t.lessonsCount} dars · {fmtNum(t.hours)} soat
                      </span>
                      {t.grammar ? <span>Grammar: {t.grammar}</span> : null}
                      {t.covered ? (
                        <span className="text-success">
                          {t.coveredLessons} darsda oʻtildi{t.lastCoveredAt ? ` · oxirgisi ${fmtDate(t.lastCoveredAt)}` : ""}
                        </span>
                      ) : null}
                      {t.nextPlannedAt ? <span className="text-primary">Rejada: {fmtRelDateTime(t.nextPlannedAt)}</span> : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

// ───────────── Guruhdagi faollik (faqat guruh ichida — KANON §8) ─────────────
function ActivityTab({ data }: { data: GroupDetailResponse["activity"] }) {
  const max = Math.max(1, ...data.items.map((i) => i.coins));
  const diff = data.groupTotal - data.prevWeekTotal;
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <Card className="min-w-0 lg:col-span-8">
        <CardHeader
          title="Guruhdagi faollik"
          description={`Shu haftadagi kumush tangalar (${fmtDateShort(data.weekStart)} dan). Faqat guruh ichida koʻrinadi.`}
          icon="toll"
        />
        <CardContent>
          {data.items.length === 0 ? (
            <EmptyState compact icon="toll" title="Faol oʻquvchi yoʻq" />
          ) : (
            <ul className="flex flex-col gap-3">
              {data.items.map((r) => (
                <li key={r.studentId} className="flex items-center gap-3">
                  <Avatar name={r.fullName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-body-md text-on-surface">{r.fullName}</span>
                      <span className="inline-flex shrink-0 items-center gap-1 font-semibold tabular-nums text-tertiary">
                        <Icon name="toll" filled size={16} />+{fmtNum(r.coins)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${(r.coins * 100) / max}%` }} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-body-sm text-on-surface-muted">
                      <span>Davomat +{r.attendance}</span>
                      <span>Faollik +{r.activity}</span>
                      <span>Uyga vazifa +{r.homework}</span>
                      {r.other ? <span>Boshqa +{r.other}</span> : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <div className="flex min-w-0 flex-col gap-4 lg:col-span-4">
        <Card className="p-5">
          <div className="font-label-md text-label-md text-on-surface-variant">Guruh jamgʻarmasi (bu hafta)</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-metric-num text-metric-num tabular-nums text-on-surface">+{fmtNum(data.groupTotal)}</span>
            <span className="text-body-sm text-on-surface-variant">tanga</span>
          </div>
          <div className={cn("mt-2 flex items-center gap-1 text-body-sm", diff >= 0 ? "text-success" : "text-on-surface-variant")}>
            <Icon name={diff >= 0 ? "trending_up" : "trending_flat"} size={16} />
            Oʻtgan hafta: +{fmtNum(data.prevWeekTotal)} tanga
          </div>
        </Card>
        <Card className="p-5 text-body-sm text-on-surface-variant">
          <div className="mb-2 flex items-center gap-2 font-label-lg text-label-lg text-on-surface">
            <Icon name="info" size={18} className="text-primary" />
            Tanga qoidalari
          </div>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>Darsga kelish: +5</li>
            <li>Darsdagi faollik: +1 dan +5 gacha (ustoz belgilaydi)</li>
            <li>Uyga vazifa oʻz vaqtida: +10</li>
          </ul>
          <p className="mt-2">Bu roʻyxat oʻquvchilarni markaz boʻyicha solishtirmaydi va ota-onalarga koʻrsatilmaydi.</p>
        </Card>
      </div>
    </div>
  );
}
