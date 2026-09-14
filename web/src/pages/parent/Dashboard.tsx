// /ota-ona — farzand kuzatuvi bosh sahifasi (mockup: urfon_ota_ona_kabineti_bosh_sahifa_farzand_kuzatuvi).
// Faqat farzandning o'z ko'rsatkichlari; boshqa bolalar bilan solishtirish yo'q (KANON §8).
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Alert, Badge, Button, Card, CardContent, CardHeader, Icon, PageHeader, ProgressBar, StatCard, Tabs, TabsList, TabsTrigger, buttonVariants } from "@/components/ui";
import { downloadFile } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  avgLabel,
  avgTone,
  fmtAvg,
  fmtDate,
  fmtDayMonth,
  fmtFileSize,
  fmtMoney,
  fmtNum,
  fmtPhone,
  fmtRelDateTime,
  fmtTime,
  fmtTimeRange,
  fmtWeekday,
  gradeLabel,
  gradeTone,
  relDayWord,
  todayYmd,
  toYmd,
} from "@/lib/format";
import { toastError } from "@/lib/query";
import { settingsPath } from "@/lib/roles";
import { iconTileTone } from "@/components/ui";
import type { Tone } from "@/lib/types";
import {
  contactLink,
  dueLeft,
  ErrorCard,
  fmtGrade,
  fmtPeriod,
  NoChild,
  PAY_META,
  PageSkeleton,
  Panel,
  PARENT_BASE,
  SKILL_LABEL,
  STUDENT_STATUS,
  TeacherAvatar,
  TextLink,
  useChildQuery,
} from "./p/shared";
import type { ActivityItem, DashboardData, LessonBrief, TodayState } from "./p/types";

const lessonName = (l: Pick<LessonBrief, "title" | "topics">) =>
  l.title ?? (l.topics[0] ? `Unit ${l.topics[0].unit} — ${l.topics[0].title}` : "Dars");

export default function ParentDashboard() {
  const { data, isLoading, error, refetch, child, dataUpdatedAt } = useChildQuery<DashboardData>(["dashboard"], "/parent/dashboard", {}, { refetchInterval: 60_000 });

  if (!child) return <NoChild />;
  if (isLoading) return <PageSkeleton />;
  if (error || !data) return <ErrorCard error={error} onRetry={() => void refetch()} />;

  const firstName = data.child.fullName.split(" ")[0];
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Bosh sahifa", to: PARENT_BASE }, { label: "Farzand kuzatuvi" }]}
        title="Farzandingiz taʼlim jarayoni monitoringi"
        documentTitle="Bosh sahifa"
        subtitle={`${data.child.fullName}ning davomati, baholari va darsdagi faolligi haqida maʼlumot`}
        actions={
          <Badge tone="primary" variant="outline" icon="autorenew" size="md">
            Yangilandi: {fmtTime(dataUpdatedAt || Date.now())}
          </Badge>
        }
      />

      {data.payment ? <PaymentBanner payment={data.payment} /> : null}

      <ChildCard data={data} />

      <MetricCards data={data} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-6 xl:col-span-2">
          {data.latestSummary ? <SummaryCard summary={data.latestSummary} /> : null}
          <ActivityCard items={data.activity} now={data.now} firstName={firstName} />
          <SkillsCard skills={data.metrics.skills} />
        </div>
        <div className="min-w-0 space-y-6">
          <NextLessonCard lesson={data.nextLesson} />
          <OpenHomeworkCard items={data.openHomework} now={data.now} />
          {data.upcomingExam ? <ExamCard exam={data.upcomingExam} /> : null}
          <RecentGradesCard grades={data.recentGrades} />
          <CoinsCard coins={data.metrics.coins} firstName={firstName} />
          <ContactCard data={data} />
          <TelegramCard telegram={data.telegram} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────── To'lov banneri

function PaymentBanner({ payment }: { payment: NonNullable<DashboardData["payment"]> }) {
  const p = payment.current;
  // kron PENDING→OVERDUE ni kuniga bir marta qiladi — muddat oʻtganini sanadan ham tekshiramiz
  const overdue = payment.hasOverdue || toYmd(p.dueDate) < todayYmd();
  const paid = p.paidAmount ?? 0;
  const left = p.amount - paid;
  return (
    <Alert
      tone={overdue ? "danger" : "warning"}
      icon={PAY_META[overdue ? "OVERDUE" : p.status].icon}
      title={
        overdue
          ? `Toʻlov muddati oʻtgan · qarzdorlik: ${fmtMoney(payment.totalDue)}`
          : payment.count > 1
            ? `Toʻlov kutilmoqda: ${fmtMoney(payment.totalDue)}`
            : `${fmtPeriod(p.period)} uchun toʻlov kutilmoqda: ${fmtMoney(left)}`
      }
      action={
        <Link to={`${PARENT_BASE}/tolovlar`} className={buttonVariants({ variant: overdue ? "danger" : "outline", size: "sm" })}>
          Toʻlovlarni koʻrish
        </Link>
      }
    >
      {payment.count > 1 ? `${payment.count} ta toʻlanmagan hisob. ` : ""}
      {paid > 0 ? `${fmtPeriod(p.period)}: ${fmtMoney(paid)} toʻlangan, qoldiq ${fmtMoney(left)}. ` : ""}
      Toʻlov muddati: {fmtDate(p.dueDate)}
      {p.group ? ` · ${p.group.name}` : ""}
    </Alert>
  );
}

// ─────────────────────────────── Farzand kartasi + bugungi holat

const TODAY_TONE: Record<TodayState, Tone> = {
  NO_LESSON: "neutral",
  CANCELLED: "neutral",
  NOT_YET: "primary",
  ARRIVED: "success",
  IN_LESSON: "success",
  ATTENDED: "success",
  NOT_ARRIVED: "warning",
  EXCUSED: "warning",
  ABSENT: "danger",
  UNMARKED: "neutral",
};

const TODAY_ICON: Record<TodayState, string> = {
  NO_LESSON: "event_available",
  CANCELLED: "event_busy",
  NOT_YET: "schedule",
  ARRIVED: "how_to_reg",
  IN_LESSON: "co_present",
  ATTENDED: "task_alt",
  NOT_ARRIVED: "hourglass_top",
  EXCUSED: "event_busy",
  ABSENT: "cancel",
  UNMARKED: "help",
};

function todayText(d: DashboardData) {
  const { state, lesson, attendance } = d.today;
  const arrived = attendance?.arrivedAt ? fmtTime(attendance.arrivedAt) : null;
  const via = attendance?.source === "TURNSTILE" ? " turniket orqali" : "";
  const late = attendance?.status === "LATE" ? " (kechikib)" : "";
  const range = lesson ? fmtTimeRange(lesson.startsAt, lesson.endsAt) : "";
  const room = lesson?.room?.name ? `, ${lesson.room.name}` : "";
  switch (state) {
    case "NO_LESSON":
      return {
        short: "Bugun dars yoʻq",
        long: d.nextLesson ? `Keyingi dars: ${nextLessonWhen(d.nextLesson.startsAt)}` : "Yaqin kunlarda dars rejalashtirilmagan",
      };
    case "CANCELLED":
      return { short: "Bugungi dars bekor qilindi", long: `${range}${room}` };
    case "NOT_YET":
      return { short: "Bugun darsi bor", long: `Dars ${fmtTime(lesson!.startsAt)} da boshlanadi${room}` };
    case "ARRIVED":
      return { short: "Bugun darsga keldi", long: `${arrived ?? ""} da${via} keldi${late} · dars ${fmtTime(lesson!.startsAt)} da boshlanadi` };
    case "IN_LESSON":
      return { short: "Hozir darsda", long: `${arrived ? `${arrived} da${via} keldi${late} · ` : ""}dars ${range}${room}` };
    case "ATTENDED":
      return { short: "Bugun darsga keldi", long: `${arrived ? `${arrived} da${via} keldi${late} · ` : ""}dars ${fmtTime(lesson!.endsAt)} da tugadi` };
    case "NOT_ARRIVED":
      return { short: "Hali kelgani qayd etilmagan", long: `Dars ${fmtTime(lesson!.startsAt)} da boshlandi${room}` };
    case "EXCUSED":
      return { short: "Bugun darsga kelmadi (sababli)", long: `Dars ${range}${attendance?.note ? ` · ${attendance.note}` : ""}` };
    case "ABSENT":
      return { short: "Bugun darsga kelmadi", long: `Dars ${range}${room}` };
    case "UNMARKED":
      return { short: "Dars tugadi", long: "Davomat hali belgilanmagan" };
  }
}

function nextLessonWhen(iso: string) {
  const w = relDayWord(iso);
  return `${w ?? fmtWeekday(iso)}, ${fmtDayMonth(iso)} · ${fmtTime(iso)}`;
}

function ChildCard({ data }: { data: DashboardData }) {
  const c = data.child;
  const g = c.group;
  const t = todayText(data);
  const tone = TODAY_TONE[data.today.state];
  const st = STUDENT_STATUS[c.status] ?? STUDENT_STATUS.ACTIVE;
  return (
    <Card>
      <CardContent className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative shrink-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed font-display text-[20px] font-bold text-on-primary-fixed">
              {c.fullName
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => Array.from(w)[0])
                .join("")
                .toUpperCase()}
            </div>
            <span
              className={cn(
                "absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full ring-2 ring-surface-container-lowest",
                tone === "success" ? "bg-success" : tone === "danger" ? "bg-error" : tone === "warning" ? "bg-warning" : "bg-outline",
              )}
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">{c.fullName}</h2>
              <Badge tone={st.tone} dot>
                {st.label}
              </Badge>
            </div>
            <p className="mt-0.5 text-body-sm text-on-surface-variant">
              {[g?.name, g?.level?.code.startsWith("L") ? `Level ${g.level.code.slice(1)}` : g?.level?.name, g?.branch?.name, `#${c.code}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          <div className={cn("flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5", iconTileTone[tone === "neutral" ? "neutral" : tone])}>
            <Icon name={TODAY_ICON[data.today.state]} size={22} />
            <div className="min-w-0">
              <div className="font-label-lg text-label-lg">{t.short}</div>
              <div className="text-body-sm opacity-90">{t.long}</div>
            </div>
          </div>
          {data.teacher ? (
            <Link to={contactLink({ teacherId: data.teacher.id })} className={buttonVariants({ variant: "navy", className: "sm:self-stretch sm:h-auto" })}>
              <Icon name="chat" size={18} />
              Savol yoʻllash
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────── Ko'rsatkichlar

function MetricCards({ data }: { data: DashboardData }) {
  const m = data.metrics;
  const att = m.attendance.total;
  const month = m.attendance.month;
  const dist = m.grades.distribution.filter((d) => d.count > 0);
  const hw = m.homework;
  const nearestHw = data.openHomework[0];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Davomat koʻrsatkichi"
        icon="event_available"
        value={att.percent != null ? `${att.percent}%` : "—"}
        badge={month.percent != null ? <Badge tone="primary">Bu oy {month.percent}%</Badge> : null}
        sub={att.marked ? `${fmtNum(att.marked)} darsdan ${fmtNum(att.attended)} tasida qatnashdi` : "Hali darslar oʻtilmagan"}
        progress={att.percent ?? 0}
      />
      <StatCard
        label="Oʻrtacha baho"
        icon="star"
        iconTone="gold"
        value={fmtAvg(m.grades.average)}
        badge={m.grades.average != null ? <Badge tone={avgTone(m.grades.average)}>{avgLabel(m.grades.average)}</Badge> : null}
        sub={dist.length ? dist.map((d) => `${d.value} baho: ${d.percent}%`).join(" · ") : "Hali baho qoʻyilmagan"}
        progress={m.grades.average != null ? (m.grades.average / 5) * 100 : 0}
        progressTone="gold"
      />
      <StatCard
        label="Oʻtilgan darslar"
        icon="menu_book"
        value={m.level ? fmtNum(m.level.lessonsDone) : "—"}
        unit={m.level ? "ta" : undefined}
        badge={m.level ? <Badge tone="primary">{m.level.progress}% yakunlandi</Badge> : null}
        sub={m.level ? `${m.level.label} · jami ${fmtNum(m.level.totalLessons)} ta darsdan` : "Guruh biriktirilmagan"}
        progress={m.level?.progress ?? 0}
        progressTone="navy"
      />
      <StatCard
        label="Bajarilgan vazifalar"
        icon="assignment_turned_in"
        value={
          <span>
            {fmtNum(hw.done)}
            <span className="text-headline-md text-on-surface-muted">/{fmtNum(hw.total)}</span>
          </span>
        }
        badge={hw.done ? <Badge tone="success">{fmtNum(hw.onTime)} tasi oʻz vaqtida</Badge> : null}
        sub={
          nearestHw
            ? `${hw.open} ta vazifa · muddat ${relDayWord(nearestHw.dueAt, data.now)?.toLowerCase() ?? fmtDayMonth(nearestHw.dueAt)} ${fmtTime(nearestHw.dueAt)} gacha`
            : hw.total
              ? "Ochiq vazifa yoʻq"
              : "Hali vazifa berilmagan"
        }
        progress={hw.percent ?? 0}
        progressTone="navy"
      />
    </div>
  );
}

// ─────────────────────────────── Ustoz xulosasi

function SummaryCard({ summary }: { summary: NonNullable<DashboardData["latestSummary"]> }) {
  return (
    <Card>
      <CardHeader
        icon="rate_review"
        title="Ustozning soʻnggi dars xulosasi"
        description={`${fmtDate(summary.startsAt)} · ${summary.title ?? "Dars"}`}
        action={<TextLink to={`${PARENT_BASE}/darslar/${summary.lessonId}`}>Dars tafsiloti</TextLink>}
      />
      <CardContent>
        <div className="flex gap-3 rounded-xl bg-surface-container-low p-4">
          <Icon name="format_quote" size={28} className="shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="whitespace-pre-line text-body-lg italic text-on-surface">{summary.summary}</p>
            {summary.teacher ? <p className="mt-2 font-label-md text-label-md text-on-surface-variant">— {summary.teacher.fullName}</p> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────── Faoliyat lentasi

const ACTIVITY_FILTERS = [
  { value: "all", label: "Barchasi" },
  { value: "grade", label: "Baholar" },
  { value: "attendance", label: "Davomat" },
  { value: "homework", label: "Vazifalar" },
  { value: "material", label: "Resurslar" },
] as const;

function ActivityCard({ items, now, firstName }: { items: ActivityItem[]; now: string; firstName: string }) {
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState(false);
  const list = items.filter((i) => filter === "all" || i.type === filter);
  const shown = expanded ? list : list.slice(0, 6);
  return (
    <Card>
      <CardHeader icon="history_edu" title="Soʻnggi faoliyat" className="flex-col sm:flex-row">
        <Tabs value={filter} onValueChange={(v) => { setFilter(v); setExpanded(false); }} variant="segmented" className="max-w-full">
          <TabsList>
            {ACTIVITY_FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {shown.length === 0 ? (
          <p className="py-8 text-center text-body-md text-on-surface-variant">Bu turdagi faoliyat hali yoʻq</p>
        ) : (
          <ol className="relative space-y-4 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-outline-variant">
            {shown.map((i) => (
              <ActivityRow key={i.id} item={i} now={now} firstName={firstName} />
            ))}
          </ol>
        )}
        {list.length > 6 ? (
          <div className="mt-5 flex justify-center">
            <Button variant="secondary" iconRight={expanded ? "arrow_upward" : "arrow_downward"} onClick={() => setExpanded((e) => !e)}>
              {expanded ? "Qisqaroq koʻrsatish" : "Barcha faoliyat tarixini koʻrish"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ActivityRow({ item, now, firstName }: { item: ActivityItem; now: string; firstName: string }) {
  let icon = "star", tone: Tone = "gold", title = "", tag = "", body: ReactNode = null, extra: ReactNode = null, link: string | null = null;
  if (item.type === "grade") {
    icon = "star";
    tone = "gold";
    title = `${item.title ?? item.kindLabel}: ${fmtGrade(item.value)} (${gradeLabel(item.value)})`;
    tag = item.kindLabel;
    body = `${item.teacher} tomonidan baholandi${item.lessonTitle ? ` · ${item.lessonTitle}` : ""}`;
    if (item.comment) {
      extra = (
        <span className="inline-flex max-w-full items-start gap-1.5 rounded-lg border border-outline-variant/70 bg-surface-container-lowest px-2.5 py-1.5 text-body-sm text-primary">
          <Icon name="rate_review" size={16} className="mt-px shrink-0" />
          <span>Ustoz izohi: «{item.comment}»</span>
        </span>
      );
    }
    link = item.lessonId ? `${PARENT_BASE}/darslar/${item.lessonId}` : null;
  } else if (item.type === "attendance") {
    const m = {
      PRESENT: { icon: "check", tone: "success" as Tone, title: "Darsga keldi" },
      LATE: { icon: "schedule", tone: "warning" as Tone, title: "Darsga kechikib keldi" },
      EXCUSED: { icon: "event_busy", tone: "primary" as Tone, title: "Darsga kelmadi (sababli)" },
      ABSENT: { icon: "close", tone: "danger" as Tone, title: "Darsga kelmadi" },
    }[item.status];
    icon = m.icon;
    tone = m.tone;
    title = m.title;
    tag = "Davomat";
    const via = item.source === "TURNSTILE" && item.arrivedAt ? `, turniket orqali qayd etildi (${fmtTime(item.arrivedAt)})` : "";
    body = `${item.lessonTitle ?? "Dars"}${item.room ? ` · ${item.room}` : ""}${via}`;
    link = `${PARENT_BASE}/darslar/${item.lessonId}`;
  } else if (item.type === "homework") {
    icon = "assignment_turned_in";
    tone = "primary";
    title = item.isLate ? "Uyga vazifa kechikib topshirildi" : "Uyga vazifa topshirildi";
    tag = "Vazifa";
    body = item.title;
    link = `${PARENT_BASE}/vazifalar`;
  } else {
    icon = "article";
    tone = "navy";
    title = "Yangi oʻquv materiali ulashildi";
    tag = "Resurs";
    body = `${item.title}${item.file ? ` (${fmtFileSize(item.file.size)})` : ""} ${firstName}ning kabinetiga biriktirildi`;
    const file = item.file;
    if (file) {
      extra = (
        <Button
          size="sm"
          variant="outline"
          icon="download"
          onClick={() => downloadFile(file.id, file.originalName).catch((e) => toastError(e))}
        >
          Yuklab olish
        </Button>
      );
    } else if (item.url) {
      extra = (
        <a href={item.url} target="_blank" rel="noreferrer" className={buttonVariants({ size: "sm", variant: "outline" })}>
          <Icon name="open_in_new" size={16} />
          Havolani ochish
        </a>
      );
    }
    link = item.lessonId ? `${PARENT_BASE}/darslar/${item.lessonId}` : null;
  }

  return (
    <li className="relative flex gap-3">
      <span className={cn("relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-surface-container-lowest", iconTileTone[tone])}>
        <Icon name={icon} size={18} />
      </span>
      <div className="min-w-0 flex-1 rounded-xl bg-surface-container-low p-3.5 sm:p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {link ? (
              <Link to={link} className="font-label-lg text-label-lg text-on-surface hover:text-primary">
                {title}
              </Link>
            ) : (
              <span className="font-label-lg text-label-lg text-on-surface">{title}</span>
            )}
            <Badge tone={tone === "gold" ? "gold" : tone} shape="square">
              {tag}
            </Badge>
          </div>
          <span className="shrink-0 font-label-sm text-label-sm text-on-surface-muted">{fmtRelDateTime(item.at, now)}</span>
        </div>
        {body ? <p className="mt-1 text-body-md text-on-surface-variant">{body}</p> : null}
        {extra ? <div className="mt-2">{extra}</div> : null}
      </div>
    </li>
  );
}

// ─────────────────────────────── Ko'nikmalar

function SkillsCard({ skills }: { skills: DashboardData["metrics"]["skills"] }) {
  const list = skills.filter((s) => s.average != null);
  return (
    <Card>
      <CardHeader icon="insights" title="Koʻnikmalar boʻyicha oʻzlashtirish" description="Oʻrtacha baho (5 ballik) · belgi — Aʼlo chegarasi (4.5)" action={<TextLink to={`${PARENT_BASE}/baholar`}>Batafsil</TextLink>} />
      <CardContent>
        {list.length === 0 ? (
          <p className="py-4 text-center text-body-md text-on-surface-variant">Koʻnikmalar boʻyicha baholar hali yoʻq</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((s) => (
              <Panel key={s.skill}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label-md text-label-md text-on-surface-variant">{SKILL_LABEL[s.skill] ?? s.skill}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-muted">{fmtNum(s.count)} ta baho</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-on-surface">{fmtAvg(s.average)}</span>
                  <Badge tone={avgTone(s.average)}>{avgLabel(s.average)}</Badge>
                </div>
                <div className="relative mt-3">
                  <ProgressBar value={((s.average ?? 0) / 5) * 100} size="sm" tone="primary" />
                  <span className="absolute -top-1 h-3.5 w-0.5 rounded bg-on-surface-muted" style={{ left: "90%" }} title="Aʼlo chegarasi (4.5)" />
                </div>
              </Panel>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────── O'ng ustun

function NextLessonCard({ lesson }: { lesson: LessonBrief | null }) {
  if (!lesson) {
    return (
      <Card>
        <CardHeader icon="event" title="Keyingi dars" />
        <CardContent>
          <p className="text-body-md text-on-surface-variant">Yaqin kunlarda dars rejalashtirilmagan.</p>
        </CardContent>
      </Card>
    );
  }
  const minutes = Math.round((new Date(lesson.endsAt).getTime() - new Date(lesson.startsAt).getTime()) / 60_000);
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Badge tone="primary" icon="schedule" size="md">
            {nextLessonWhen(lesson.startsAt)}
          </Badge>
          <span className="font-label-sm text-label-sm text-on-surface-muted">{minutes} daqiqa</span>
        </div>
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">Keyingi dars</p>
          <h3 className="mt-1 font-headline-md text-headline-md text-on-surface">{lessonName(lesson)}</h3>
          <p className="mt-0.5 text-body-sm text-on-surface-variant">
            {lesson.group.name}
            {lesson.group.level ? ` · ${lesson.group.level.name}` : ""}
          </p>
        </div>
        {lesson.teacher ? (
          <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
            <TeacherAvatar teacher={lesson.teacher} size="md" />
            <div className="min-w-0">
              <div className="truncate font-label-lg text-label-lg text-on-surface">{lesson.teacher.fullName}</div>
              <div className="truncate text-body-sm text-on-surface-variant">{lesson.teacher.title ?? "Ustoz"}</div>
            </div>
          </div>
        ) : null}
        {lesson.room ? (
          <div className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
            <Icon name="location_on" size={18} className="text-primary" />
            {lesson.room.name}
            {lesson.room.location ? ` · ${lesson.room.location}` : ""}
          </div>
        ) : null}
        {lesson.homeworkNote ? (
          <div className="flex items-start gap-2 rounded-lg bg-warning-container/60 px-3 py-2 text-body-sm text-on-warning-container">
            <Icon name="info" size={18} className="mt-px shrink-0" />
            {lesson.homeworkNote}
          </div>
        ) : null}
        <Link to={`${PARENT_BASE}/darslar/${lesson.id}`} className={buttonVariants({ variant: "secondary", block: true })}>
          Dars tafsiloti
          <Icon name="arrow_forward" size={18} />
        </Link>
      </CardContent>
    </Card>
  );
}

function OpenHomeworkCard({ items, now }: { items: DashboardData["openHomework"]; now: string }) {
  return (
    <Card>
      <CardHeader icon="assignment" title="Uyga vazifalar" badge={items.length ? <Badge tone="primary">{items.length}</Badge> : null} action={<TextLink to={`${PARENT_BASE}/vazifalar`}>Barchasi</TextLink>} />
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">Hozircha bajarilishi kerak boʻlgan vazifa yoʻq.</p>
        ) : (
          items.map((h) => {
            const left = dueLeft(h.dueAt, now);
            return (
              <Link key={h.id} to={`${PARENT_BASE}/vazifalar`} className="block rounded-xl bg-surface-container-low p-3.5 transition-colors hover:bg-surface-container">
                <div className="font-label-lg text-label-lg text-on-surface">{h.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant">
                  <span>
                    Muddat: {relDayWord(h.dueAt, now) ?? fmtDayMonth(h.dueAt)}, {fmtTime(h.dueAt)}
                  </span>
                  <Badge tone={h.submissionStatus === "RETURNED" ? "warning" : left.urgent ? "danger" : "primary"}>
                    {h.submissionStatus === "RETURNED" ? "Qayta ishlash kerak" : left.text}
                  </Badge>
                </div>
                {h.submissionStatus === "DRAFT" ? (
                  <p className="mt-1.5 flex items-center gap-1 text-body-sm text-on-surface-muted">
                    <Icon name="edit_note" size={16} /> Qoralama saqlangan, hali topshirilmagan
                  </p>
                ) : null}
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function ExamCard({ exam }: { exam: NonNullable<DashboardData["upcomingExam"]> }) {
  return (
    <Card>
      <CardContent className="flex gap-4">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", iconTileTone.gold)}>
          <Icon name="military_tech" size={24} />
        </span>
        <div className="min-w-0">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">Yaqinlashayotgan imtihon</p>
          <h3 className="mt-0.5 font-headline-sm text-headline-sm text-on-surface">{exam.title}</h3>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {relDayWord(exam.startsAt) ?? fmtWeekday(exam.startsAt)}, {fmtDate(exam.startsAt)} · {fmtTime(exam.startsAt)}
            {exam.location ? ` · ${exam.location}` : ""}
          </p>
          <p className="text-body-sm text-on-surface-muted">Davomiyligi: {exam.durationMin} daqiqa</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentGradesCard({ grades }: { grades: DashboardData["recentGrades"] }) {
  return (
    <Card>
      <CardHeader icon="grade" title="Oxirgi baholar" action={<TextLink to={`${PARENT_BASE}/baholar`}>Barchasi</TextLink>} />
      <CardContent className="space-y-2">
        {grades.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">Hali baho qoʻyilmagan.</p>
        ) : (
          grades.map((g) => (
            <div key={g.id} className="flex items-start gap-3 rounded-xl p-2 hover:bg-surface-container-low">
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-headline-sm font-bold tabular-nums", iconTileTone[gradeTone(g.value)])}>
                {fmtGrade(g.value)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-label-lg text-label-lg text-on-surface">{g.title ?? g.kindLabel}</div>
                <div className="text-body-sm text-on-surface-muted">
                  {fmtDayMonth(g.gradedAt)} · {g.kindLabel} · {gradeLabel(g.value)}
                </div>
                {g.comment ? <p className="mt-0.5 line-clamp-2 text-body-sm italic text-on-surface-variant">«{g.comment}»</p> : null}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CoinsCard({ coins, firstName }: { coins: DashboardData["metrics"]["coins"]; firstName: string }) {
  const diff = coins.last7Days - coins.prev7Days;
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant">{firstName}ning kumush tangalari</p>
            <div className="mt-1 flex items-center gap-2">
              <Icon name="toll" size={28} className="text-gold" filled />
              <span className="font-metric-num text-metric-num text-on-surface">{fmtNum(coins.balance)}</span>
            </div>
          </div>
          <Badge tone="gold" icon="workspace_premium" size="md">
            {coins.title}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Panel className="p-3">
            <p className="text-body-sm text-on-surface-variant">Kunlik seriya</p>
            <p className="mt-0.5 flex items-center gap-1 font-label-lg text-label-lg text-on-surface">
              <Icon name="local_fire_department" size={18} className="text-warning" /> {coins.streakDays} kun
            </p>
          </Panel>
          <Panel className="p-3">
            <p className="text-body-sm text-on-surface-variant">Oxirgi 7 kun</p>
            <p className="mt-0.5 font-label-lg text-label-lg text-on-surface">+{fmtNum(coins.last7Days)} tanga</p>
          </Panel>
        </div>
        <p className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
          <Icon name={diff >= 0 ? "trending_up" : "trending_flat"} size={18} className={diff > 0 ? "text-success" : "text-on-surface-muted"} />
          Oʻtgan haftada +{fmtNum(coins.prev7Days)} tanga{diff > 0 ? ` — bu hafta ${fmtNum(diff)} taga koʻproq` : ""}
        </p>
        {coins.next ? (
          <p className="text-body-sm text-on-surface-muted">
            «{coins.next.name}» unvonigacha {fmtNum(coins.next.remaining)} tanga
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ContactCard({ data }: { data: DashboardData }) {
  const t = data.teacher;
  const phone = data.branch?.phone;
  if (!t && !phone) return null;
  return (
    <Card>
      <CardHeader title="Tezkor bogʻlanish" />
      <CardContent className="space-y-3">
        {t ? (
          <div className="rounded-xl bg-surface-container-low p-3">
            <div className="flex items-center gap-3">
              <TeacherAvatar teacher={t} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-label-lg text-label-lg text-on-surface">{t.fullName}</div>
                <div className="truncate text-body-sm text-on-surface-variant">{t.title ?? "Guruh ustozi"}</div>
                {t.responseTime ? (
                  <div className="mt-0.5 flex items-center gap-1 text-body-sm text-on-surface-muted">
                    <Icon name="bolt" size={14} /> Javob: {t.responseTime}
                  </div>
                ) : null}
              </div>
            </div>
            <Link to={contactLink({ teacherId: t.id })} className={buttonVariants({ variant: "primary", block: true, className: "mt-3" })}>
              <Icon name="chat" size={18} />
              Xabar yozish
            </Link>
          </div>
        ) : null}
        {phone ? (
          <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
            <Icon name="call" size={22} className="text-primary" />
            <div className="min-w-0 flex-1">
              <div className="font-label-lg text-label-lg text-on-surface">{fmtPhone(phone)}</div>
              <div className="text-body-sm text-on-surface-variant">{data.branch?.name ?? "Filial"} koordinatori</div>
            </div>
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Qoʻngʻiroq
            </a>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TelegramCard({ telegram }: { telegram: DashboardData["telegram"] }) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
            <Icon name="send" size={20} />
          </span>
          {telegram.linked ? (
            <Badge tone="success" icon="check_circle">
              Faol
            </Badge>
          ) : (
            <Badge tone="neutral">Ulanmagan</Badge>
          )}
        </div>
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">{telegram.linked ? "Telegram bot ulangan" : "Telegram botni ulang"}</h3>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Farzandingiz darsga kelgan vaqti, qoʻyilgan baholar va ustoz izohlari @{telegram.botUsername} orqali telefoningizga avtomatik yetkaziladi.
          </p>
        </div>
        {telegram.linked ? (
          <a href={`https://t.me/${telegram.botUsername}`} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "primary", block: true })}>
            Botni ochish
            <Icon name="open_in_new" size={18} />
          </a>
        ) : (
          <Link to={settingsPath("PARENT")} className={buttonVariants({ variant: "primary", block: true })}>
            Sozlamalarda ulash
            <Icon name="arrow_forward" size={18} />
          </Link>
        )}
        {telegram.linked && telegram.linkedAt ? (
          <p className="text-body-sm text-on-surface-muted">Ulangan sana: {fmtDate(telegram.linkedAt)}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
