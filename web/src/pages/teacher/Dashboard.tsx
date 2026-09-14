import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Avatar,
  Badge,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  Icon,
  ProgressBar,
  Skeleton,
  StatCard,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  buttonVariants,
  textTone,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { fmtAvg, fmtDate, fmtMonthYear, fmtNum, fmtPercent, fmtRelDateTime, WEEKDAYS_SHORT } from "@/lib/format";
import { useDocumentTitle } from "@/lib/hooks";
import { useApiQuery } from "@/lib/query";
import { ErrorCard, LessonStatusBadge, addDaysYmd, dayPart, lessonTitle, pctTone, qk } from "./a/shared";
import type { DashboardResponse, TodayLesson } from "./a/types";

const HW_TYPE: Record<string, string> = { TEXT: "Matn", AUDIO: "Audio", FILE: "Fayl", QUIZ: "Test" };
const EXAM_TYPE: Record<string, string> = { MOCK: "Mock imtihon", MIDTERM: "Oraliq nazorat", FINAL: "Yakuniy imtihon", QUIZ: "Test" };

export default function TeacherDashboardPage() {
  useDocumentTitle("Bosh sahifa");
  const q = useApiQuery<DashboardResponse>(qk.dashboard, "/teacher/dashboard", { refetchInterval: 60_000 });

  if (q.isLoading) return <DashboardSkeleton />;
  if (q.error || !q.data) return <ErrorCard error={q.error} onRetry={() => q.refetch()} />;
  const d = q.data;
  const s = d.stats;
  const next = d.nextLesson;
  const nextToday = d.todayLessons.find((l) => l.isNext);

  return (
    <div className="flex flex-col gap-6">
      {/* Salomlashish */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="font-headline-xl-mobile text-headline-xl-mobile tracking-tight text-on-surface sm:font-headline-xl sm:text-headline-xl">
              Xush kelibsiz, {d.teacher.fullName}!
            </h1>
            <Badge tone="primary" dot>
              {fmtMonthYear(`${d.today.date}T12:00:00+05:00`)} oylik sikli
            </Badge>
          </div>
          <p className="mt-1 flex items-center gap-2 text-body-md text-on-surface-variant">
            <Icon name="domain" size={18} className="text-secondary" />
            URFON Taʼlim Markazi • Bugun: {fmtDate(`${d.today.date}T12:00:00+05:00`)} ({d.today.weekdayName})
          </p>
        </div>
        <div className="flex items-center gap-4 self-start rounded-xl border border-outline-variant/70 bg-surface-container-lowest px-4 py-2.5 shadow-card lg:self-auto">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Guruhlar faoliyati</span>
            <span className="font-label-md text-label-md text-on-surface">
              {s.groups === 0 ? "Guruh biriktirilmagan" : s.activeGroups === s.groups ? `Barcha ${s.groups} guruh faol` : `${s.activeGroups} faol · ${s.enrollingGroups} yangi qabul`}
            </span>
          </div>
          <div className="h-8 w-px bg-surface-container-high" />
          <div className="flex min-w-0 flex-col">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Navbatdagi dars</span>
            {next ? (
              <Link to={`/ustoz/darslar/${next.id}`} className="truncate font-label-md text-label-md text-primary hover:underline">
                {next.group.name} • {fmtRelDay(next.startsAt, d.today.date)}
                {next.start}
              </Link>
            ) : (
              <span className="font-label-md text-label-md text-on-surface-muted">Rejalashtirilgan dars yoʻq</span>
            )}
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Faol guruhlarim"
          value={fmtNum(s.groups)}
          unit="ta guruh biriktirilgan"
          icon="groups"
          sub={`Haftasiga ${fmtNum(s.weeklyHours)} soat dars`}
          subIcon="schedule"
        />
        <StatCard
          label="Bugungi darslar"
          value={fmtNum(s.todayLessons)}
          unit="ta dars"
          icon="event_available"
          badge={s.todayDone ? <Badge tone="primary">{s.todayDone} tasi oʻtildi</Badge> : undefined}
          sub={nextToday ? `Navbatdagisi: ${nextToday.start}${nextToday.room ? ` (${nextToday.room.name})` : ""}` : s.todayLessons ? "Bugungi darslar yakunlandi" : "Bugun dars yoʻq"}
          subIcon="schedule"
        />
        <Link to="/ustoz/vazifalar" className="block rounded-xl focus-visible:ring-2 focus-visible:ring-primary/40">
          <StatCard
            className="h-full hover:shadow-float"
            label="Tekshiruvdagi ishlar"
            value={fmtNum(s.pendingReviews)}
            unit="ta topshiriq"
            icon="fact_check"
            iconTone="gold"
            sub={s.pendingReviews ? "Tekshiruvni kutmoqda" : "Hammasi tekshirilgan"}
            subIcon={s.pendingReviews ? "priority_high" : "check_circle"}
            subTone={s.pendingReviews ? "gold" : "success"}
          />
        </Link>
        <StatCard
          label="Jami oʻquvchilarim"
          value={fmtNum(s.students)}
          unit="nafar faol oʻquvchi"
          icon="school"
          badge={s.monthAttendancePct != null ? <Badge tone={pctTone(s.monthAttendancePct)}>{fmtPercent(s.monthAttendancePct)} davomat</Badge> : undefined}
          sub="Joriy oy davomati"
          subIcon="trending_up"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Chap ustun */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
          <Card>
            <CardHeader
              title="Bugungi darslar jadvali"
              badge={<Badge tone="primary">{s.todayLessons} ta dars</Badge>}
              divider
              action={
                <Link to="/ustoz/jadval" className={buttonVariants({ variant: "link", size: "sm" })}>
                  Dars jadvali
                  <Icon name="arrow_forward" size={16} />
                </Link>
              }
            />
            <CardContent className="flex flex-col gap-3">
              {d.todayLessons.length === 0 ? (
                <EmptyState compact icon="event_available" title="Bugun dars yoʻq" description="Haftalik jadvalni koʻrish uchun “Dars jadvali” boʻlimiga oʻting." />
              ) : (
                d.todayLessons.map((l) => <TodayLessonRow key={l.id} l={l} />)
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Soʻnggi topshirilgan ishlar"
              description="Uyga vazifalar va Mock javoblari — tekshiruv kutmoqda"
              badge={<Badge tone="gold">{s.pendingReviews} ta tekshiruvda</Badge>}
            />
            {d.latestSubmissions.length === 0 ? (
              <CardContent>
                <EmptyState compact icon="task_alt" title="Tekshiruvni kutayotgan ish yoʻq" description="Oʻquvchilar yangi ish topshirganda shu yerda koʻrinadi." />
              </CardContent>
            ) : (
              <SubmissionsTable rows={d.latestSubmissions} />
            )}
            <div className="flex flex-col gap-2 border-t border-outline-variant/70 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span className="text-body-sm text-on-surface-variant">
                Jami {fmtNum(s.pendingReviews)} ta tekshiruvdagi ishdan {d.latestSubmissions.length} tasi koʻrsatilmoqda
              </span>
              <Link to="/ustoz/vazifalar" className={buttonVariants({ variant: "link", size: "sm" })}>
                Barcha topshiriqlarni tekshirish
                <Icon name="chevron_right" size={16} />
              </Link>
            </div>
          </Card>

          <Card>
            <CardHeader title="Guruhlar koʻrsatkichlari" description="Sillabus boʻyicha progress, joriy oy davomati va oʻrtacha baho" />
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {d.groupProgress.length === 0 ? (
                <EmptyState compact icon="groups" title="Guruh biriktirilmagan" className="md:col-span-2" />
              ) : (
                d.groupProgress.map((g) => (
                  <Link
                    key={g.id}
                    to={`/ustoz/guruhlar/${g.id}`}
                    className="flex flex-col gap-3 rounded-xl bg-surface-container-low/70 p-4 transition-colors hover:bg-surface-container-low"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-headline-sm text-headline-sm text-on-surface">{g.name}</div>
                        <div className="text-body-sm text-on-surface-variant">
                          {g.code}
                          {g.level ? ` · ${g.level.label}` : ""}
                        </div>
                      </div>
                      {g.status === "ENROLLING" ? <Badge tone="warning">Yangi qabul</Badge> : null}
                    </div>
                    <ProgressBar
                      value={g.progressPct}
                      label={`${g.doneLessons}/${g.totalLessons} dars oʻtildi${g.currentUnit ? ` · Unit ${g.currentUnit.unit}` : ""}`}
                      showValue
                      size="sm"
                    />
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-on-surface-variant">
                      <span>
                        Davomat:{" "}
                        <b className={cn("font-semibold", textTone[pctTone(g.monthAttendancePct)])}>
                          {fmtPercent(g.monthAttendancePct)}
                        </b>
                      </span>
                      <span>
                        Oʻrtacha baho: <b className="font-semibold text-on-surface">{fmtAvg(g.averageGrade)}</b>
                        {g.averageGradeLabel ? ` (${g.averageGradeLabel})` : ""}
                      </span>
                      <span>{fmtNum(g.studentsCount)} oʻquvchi</span>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* O'ng ustun */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-4">
          <Card>
            <CardHeader title="Tezkor amallar" description="Kundalik ish uchun qisqa yoʻllar" />
            <CardContent className="flex flex-col gap-2.5">
              <QuickLink
                to={nextToday ? `/ustoz/darslar/${nextToday.id}` : "/ustoz/jadval"}
                icon="how_to_reg"
                title="Davomat va dars oʻtish"
                desc={nextToday ? `${nextToday.group.name}, ${nextToday.start}` : "Dars jadvalidan darsni tanlang"}
              />
              <QuickLink
                to="/ustoz/vazifalar"
                icon="fact_check"
                tone="gold"
                title="Vazifalarni tekshirish"
                desc={s.pendingReviews ? `${fmtNum(s.pendingReviews)} ta ish tekshiruvni kutmoqda` : "Yangi topshiriq yoʻq"}
                badge={s.pendingReviews ? <Badge tone="gold">{fmtNum(s.pendingReviews)}</Badge> : undefined}
              />
              <QuickLink
                to="/ustoz/xabarlar"
                icon="forum"
                title="Xabarlar"
                desc={d.unreadMessages ? `${fmtNum(d.unreadMessages)} ta oʻqilmagan suhbat` : "Yangi xabar yoʻq"}
                badge={d.unreadMessages ? <Badge tone="primary" variant="solid">{fmtNum(d.unreadMessages)}</Badge> : undefined}
              />
              <QuickLink to="/ustoz/resurslar" icon="cloud_upload" title="Yangi dars materiali yuklash" desc="PDF, audio testlar va slaydlar" />
              <QuickLink to="/ustoz/imtihonlar" icon="quiz" title="Mock natijalarini kiritish" desc="Reading, Listening va Writing" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Yaqin imtihonlar" icon="event" />
            <CardContent className="flex flex-col gap-3">
              {d.upcomingExams.length === 0 ? (
                <EmptyState compact icon="event_available" title="Yaqin imtihon yoʻq" />
              ) : (
                d.upcomingExams.map((e) => (
                  <Link
                    key={e.id}
                    to="/ustoz/imtihonlar"
                    className="flex gap-3 rounded-xl border-l-4 border-gold bg-surface-container-low/70 p-3.5 transition-colors hover:bg-surface-container-low"
                  >
                    <Icon name="timer" size={22} className="mt-0.5 text-tertiary" />
                    <div className="min-w-0">
                      <div className="font-label-lg text-label-lg text-on-surface">{e.title}</div>
                      <div className="text-body-sm text-on-surface-variant">
                        {EXAM_TYPE[e.type] ?? e.type} · {e.group ? e.group.name : "Markaz miqyosida"}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1 font-label-md text-label-md text-tertiary">
                        <Icon name="calendar_today" size={14} />
                        {fmtRelDateTime(e.startsAt)}
                        {e.location ? ` · ${e.location}` : ""}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <WeekStrip today={d.today.date} weekday={d.today.weekday} />

          <Card>
            <CardHeader title="Soʻnggi faollik" icon="history" />
            <CardContent>
              {d.recentActivity.length === 0 ? (
                <EmptyState compact icon="history" title="Hozircha faollik yoʻq" />
              ) : (
                <ol className="flex flex-col">
                  {d.recentActivity.map((a, i) => {
                    const body = (
                      <div className="flex gap-3 py-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-primary">
                          <Icon name={a.icon} size={18} />
                        </span>
                        <div className="min-w-0">
                          <div className="text-body-md text-on-surface">{a.text}</div>
                          <div className="text-body-sm text-on-surface-muted">{fmtRelDateTime(a.at)}</div>
                        </div>
                      </div>
                    );
                    return (
                      <li key={a.id} className={cn(i > 0 && "border-t border-outline-variant/60")}>
                        {a.link ? (
                          <Link to={a.link} className="block rounded-lg transition-colors hover:bg-surface-container-low">
                            {body}
                          </Link>
                        ) : (
                          body
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** "Bugun, " / "Ertaga, " / "16-sentabr, " — navbatdagi dars chipi uchun. */
function fmtRelDay(iso: string, todayYmd: string) {
  const t = new Date(new Date(iso).getTime() + 5 * 3_600_000).toISOString().slice(0, 10);
  if (t === todayYmd) return "";
  if (t === addDaysYmd(todayYmd, 1)) return "Ertaga, ";
  return `${fmtDate(iso, { year: false })}, `;
}

function TodayLessonRow({ l }: { l: TodayLesson }) {
  const highlight = l.isNext || l.status === "IN_PROGRESS";
  const btn =
    l.action === "start"
      ? { label: "Darsni boshlash", icon: "play_arrow", variant: "primary" as const }
      : l.action === "continue"
        ? { label: "Davom ettirish", icon: "play_circle", variant: "primary" as const }
        : { label: "Koʻrish", icon: "visibility", variant: "secondary" as const };
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-4 rounded-xl p-4 transition-colors sm:flex-row sm:items-center",
        highlight
          ? "border-2 border-primary/80 bg-surface-container-lowest shadow-float"
          : "bg-surface-container-low/60 hover:bg-surface-container-low",
        l.status === "CANCELLED" && "opacity-60",
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={cn(
            "flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg",
            highlight ? "bg-primary-container text-on-primary" : "bg-surface-container text-on-surface-variant",
          )}
        >
          <span className={cn("font-label-sm text-[10px] uppercase", highlight ? "text-on-primary-container" : "text-outline")}>{dayPart(l.start)}</span>
          <span className={cn("font-label-lg text-label-lg tabular-nums", highlight ? "text-on-primary" : "text-on-surface")}>{l.start}</span>
          <span className={cn("text-[11px] tabular-nums", highlight ? "text-on-primary-container" : "text-outline")}>{l.end}</span>
        </div>
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge tone="navy" shape="square">
              {l.group.name}
            </Badge>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{l.group.code}</span>
            <LessonStatusBadge status={l.status} next={l.isNext} />
          </div>
          <h3 className="truncate text-body-lg font-medium text-on-surface">{lessonTitle(l)}</h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-on-surface-variant">
            {l.room ? (
              <span className="inline-flex items-center gap-1">
                <Icon name="meeting_room" size={16} />
                {l.room.name}
                {l.room.kind && l.room.kind !== l.room.name ? ` (${l.room.kind})` : ""}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Icon name="groups" size={16} />
              {l.marked > 0 ? `${l.attended}/${l.total} oʻquvchi keldi` : `${l.total} nafar oʻquvchi roʻyxatda`}
            </span>
          </div>
        </div>
      </div>
      <Link to={`/ustoz/darslar/${l.id}`} className={buttonVariants({ variant: btn.variant, className: "self-stretch sm:self-auto" })}>
        <Icon name={btn.icon} size={18} />
        {btn.label}
      </Link>
    </div>
  );
}

function SubmissionsTable({ rows }: { rows: DashboardResponse["latestSubmissions"] }) {
  const navigate = useNavigate();
  return (
    <Table>
      <THead>
        <tr>
          <TH>Oʻquvchi</TH>
          <TH className="hidden md:table-cell">Guruh</TH>
          <TH>Vazifa</TH>
          <TH className="hidden sm:table-cell">Topshirilgan</TH>
        </tr>
      </THead>
      <TBody>
        {rows.map((r) => (
          <TR
            key={r.id}
            tabIndex={0}
            onClick={() => navigate("/ustoz/vazifalar")}
            onKeyDown={(e) => e.key === "Enter" && navigate("/ustoz/vazifalar")}
            className="cursor-pointer hover:bg-surface-container-low"
          >
            <TD>
              <div className="flex items-center gap-3">
                <Avatar name={r.student.fullName} size="sm" />
                <div className="min-w-0">
                  <div className="font-medium text-on-surface">{r.student.fullName}</div>
                  <div className="text-body-sm text-on-surface-muted">
                    {r.student.code ? `#${r.student.code}` : ""} · {r.group.code}
                  </div>
                </div>
              </div>
            </TD>
            <TD className="hidden md:table-cell">
              <Badge shape="square">{r.group.name}</Badge>
            </TD>
            <TD>
              <div className="min-w-0">
                <div className="text-on-surface">{r.homework.title}</div>
                <div className="text-body-sm text-on-surface-muted">{HW_TYPE[r.homework.type] ?? r.homework.type}</div>
              </div>
            </TD>
            <TD className="hidden whitespace-nowrap sm:table-cell">
              <div className="text-body-sm text-on-surface-variant">{r.submittedAt ? fmtRelDateTime(r.submittedAt) : "—"}</div>
              {r.isLate ? (
                <Badge tone="warning" className="mt-1">
                  Kechikkan
                </Badge>
              ) : null}
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

function QuickLink({ to, icon, title, desc, badge, tone }: { to: string; icon: string; title: string; desc: string; badge?: ReactNode; tone?: "gold" }) {
  return (
    <Link to={to} className="group flex items-center justify-between gap-3 rounded-xl bg-surface-container-low/70 p-3.5 transition-colors hover:bg-surface-container-low">
      <div className="flex min-w-0 items-center gap-3.5">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            tone === "gold" ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-surface-container-lowest text-primary shadow-xs",
          )}
        >
          <Icon name={icon} size={20} />
        </span>
        <div className="min-w-0">
          <div className="truncate font-label-lg text-label-lg text-on-surface">{title}</div>
          <div className="truncate text-body-sm text-on-surface-variant">{desc}</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {badge}
        <Icon name="chevron_right" size={20} className="text-on-surface-variant transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function WeekStrip({ today, weekday }: { today: string; weekday: number }) {
  const monday = addDaysYmd(today, -(weekday - 1));
  const days = Array.from({ length: 6 }, (_, i) => addDaysYmd(monday, i));
  return (
    <Link to="/ustoz/jadval" className="block rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-4 shadow-card transition-shadow hover:shadow-float">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-label-md text-label-md text-on-surface">Haftalik dars jadvali</span>
        <span className="font-label-md text-label-md text-primary">{fmtMonthYear(`${today}T12:00:00+05:00`)}</span>
      </div>
      <div className="grid grid-cols-6 gap-1 text-center">
        {days.map((d, i) => {
          const isToday = d === today;
          return (
            <div key={d} className={cn("rounded-lg py-1.5", isToday ? "bg-primary text-on-primary" : "text-on-surface-variant")}>
              <div className="font-label-sm text-label-sm">{WEEKDAYS_SHORT[i]}</div>
              <div className={cn("font-label-md text-label-md tabular-nums", isToday ? "text-on-primary" : "text-on-surface")}>{Number(d.slice(8))}</div>
            </div>
          );
        })}
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div>
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="mt-2 h-4 w-64 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatCard key={i} label={<Skeleton className="h-4 w-24" />} value="" loading />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="p-6 lg:col-span-8">
          <Skeleton className="mb-4 h-6 w-56" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="mb-3 h-20 w-full" />
          ))}
        </Card>
        <Card className="p-6 lg:col-span-4">
          <Skeleton className="mb-4 h-6 w-40" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="mb-3 h-14 w-full" />
          ))}
        </Card>
      </div>
    </div>
  );
}

