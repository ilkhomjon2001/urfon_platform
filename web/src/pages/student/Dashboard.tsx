import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, Badge, Card, CardContent, CardHeader, EmptyState, Icon, ProgressBar, Skeleton, buttonVariants, iconTileTone } from "@/components/ui";
import type { Tone } from "@/lib/types";
import { cn } from "@/lib/cn";
import { avgLabel, fmtAvg, fmtDayMonth, fmtNum, fmtPercent, fmtRelDateTime, fmtRelDay, fmtTime, fmtTimeRange, fmtWeekday, gradeTone, initials, relDayWord } from "@/lib/format";
import { useDocumentTitle } from "@/lib/hooks";
import { useApiQuery } from "@/lib/query";
import { CoinChip, CoinIcon, ErrorState, MaterialRow, MATERIAL_META, dueText, leftText, signed, useNow } from "./components/common";
import type { DashLesson, DashOpenHomework, StudentDashboard } from "./components/types";
import { fmtFileSize } from "@/lib/format";

const lessonDay = (d: string) => relDayWord(d) ?? `${fmtWeekday(d)}, ${fmtDayMonth(d)}`;

export default function StudentDashboardPage() {
  useDocumentTitle("Bosh sahifa");
  const { data, isLoading, error, refetch } = useApiQuery<StudentDashboard>(["student", "dashboard"], "/student/dashboard", { refetchInterval: 120_000 });

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="flex flex-col gap-6">
      <Hero d={data} />
      <StatsRow d={data} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
          <OpenHomeworkCard d={data} />
          <LessonsCard d={data} />
        </div>
        <aside className="flex min-w-0 flex-col gap-6 lg:col-span-5">
          <MaterialsCard d={data} />
          <GrowthCard d={data} />
          <TeacherCard d={data} />
        </aside>
      </div>
    </div>
  );
}

// ─────────────────────────── salom ───────────────────────────

function Hero({ d }: { d: StudentDashboard }) {
  const s = d.student;
  const pending = d.openHomework.filter((h) => !h.overdue).length;
  const today = d.todayLessons.find((l) => new Date(l.endsAt) > new Date(d.now));
  const parts: string[] = [];
  if (today) parts.push(`Bugun ${fmtTime(today.startsAt)} da darsingiz bor.`);
  parts.push(pending ? `Rejangizda ${pending} ta muhim vazifa bor.` : "Barcha vazifalar topshirilgan — oʻz ritmingizda davom eting.");
  const dots = Math.min(7, s.streakDays);
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-navy p-5 text-on-primary shadow-card sm:p-7">
      <div aria-hidden="true" className="bg-dots pointer-events-none absolute inset-0" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-fixed font-headline-lg text-headline-lg text-on-primary-fixed shadow-card sm:h-20 sm:w-20">
              {initials(s.fullName)}
            </div>
            <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-gold ring-2 ring-primary" title={s.title.current}>
              <Icon name="workspace_premium" size={16} className="text-on-tertiary-fixed" />
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {d.level ? (
                <span className="rounded bg-on-primary/15 px-2 py-0.5 font-label-sm text-label-sm">{d.level.group.name}</span>
              ) : null}
              {d.level?.shortName ? (
                <Badge tone="gold" icon="school">
                  {d.level.shortName}
                </Badge>
              ) : null}
            </div>
            <h1 className="mt-2 font-headline-xl-mobile text-headline-xl-mobile sm:font-display-sm sm:text-display-sm">Salom, {s.firstName}!</h1>
            <p className="mt-1 text-body-md text-on-primary/85">{parts.join(" ")}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-on-primary/15 bg-on-primary/10 px-4 py-3 backdrop-blur-sm lg:max-w-xs">
          <Icon name="local_fire_department" filled size={30} className="text-gold" />
          <div className="min-w-0">
            <p className="font-headline-sm text-headline-sm">{s.streakDays ? `${s.streakDays} kunlik seriya` : "Seriyani bugun boshlang"}</p>
            <p className="text-body-sm text-on-primary/80">
              {s.streakDays
                ? s.streakActiveToday
                  ? "Barakalla, shu ritmda davom eting."
                  : "Bugun biror vazifa topshirsangiz, seriya davom etadi."
                : "Har kungi kichik qadam katta natija beradi."}
            </p>
            {dots ? (
              <div className="mt-1.5 flex gap-1.5" aria-hidden="true">
                {Array.from({ length: 7 }, (_, i) => (
                  <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i < dots ? "bg-gold" : "bg-on-primary/25")} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── ko'rsatkichlar ───────────────────────────

function StatsRow({ d }: { d: StudentDashboard }) {
  const nav = useNavigate();
  const a = d.stats.attendance;
  const hw = d.stats.homework;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-12">
      <LevelCard d={d} />
      <Kpi
        className="lg:col-span-2"
        label="Kelgan darslar"
        value={fmtNum(a.attended)}
        unit="ta"
        icon="event_available"
        badge={a.percent != null ? <Badge tone="primary">{fmtPercent(a.percent)}</Badge> : undefined}
        sub={a.missed ? `Qoldirilgan: ${a.missed} ta${a.excused ? ` (${a.excused} tasi sababli)` : ""}` : a.total ? "Hamma darslarga keldingiz" : "Hali dars oʻtilmagan"}
        onClick={() => nav("/oquvchi/darslar?t=past")}
      />
      <Kpi
        className="lg:col-span-2"
        label="Kumush tangalar"
        value={fmtNum(d.student.coinBalance)}
        icon="toll"
        iconTone="gold"
        badge={d.growth.thisWeek ? <CoinChip amount={d.growth.thisWeek} label="7 kunda" /> : undefined}
        sub="Vazifa, davomat va faollik uchun"
        onClick={() => nav("/oquvchi/yutuqlar")}
      />
      <Kpi
        className="lg:col-span-2"
        label="Bajarilgan vazifalar"
        value={fmtNum(hw.done)}
        unit="ta"
        icon="task_alt"
        badge={
          <Badge tone="primary">
            {hw.done}/{hw.total}
          </Badge>
        }
        sub={hw.pending ? `Kutilmoqda: ${hw.pending} ta` : "Ochiq vazifa yoʻq"}
        onClick={() => nav("/oquvchi/vazifalar")}
      />
    </div>
  );
}

/** Mockupdagi ixcham KPI kartasi: ikonka + chip, yorliq, katta raqam, pastda o'raladigan izoh paneli. */
function Kpi({
  label,
  value,
  unit,
  icon,
  iconTone = "primary",
  badge,
  sub,
  onClick,
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: string;
  iconTone?: Tone;
  badge?: ReactNode;
  sub?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-col rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-4 text-left shadow-card transition-shadow hover:shadow-float focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconTileTone[iconTone])}>
          <Icon name={icon} filled={icon === "toll"} size={22} />
        </span>
        {badge}
      </div>
      <p className="mt-3 font-label-md text-label-md text-on-surface-variant">{label}</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="font-display-sm text-display-sm tabular-nums text-on-surface">{value}</span>
        {unit ? <span className="font-label-lg text-label-lg text-on-surface-variant">{unit}</span> : null}
      </p>
      {sub ? (
        <span className="mt-auto block w-full pt-3">
          <span className="block rounded-lg bg-surface-container-low px-2.5 py-2 text-body-sm text-on-surface-variant">{sub}</span>
        </span>
      ) : null}
    </button>
  );
}

function LevelCard({ d }: { d: StudentDashboard }) {
  const lv = d.level;
  if (!lv) {
    return (
      <Card className="p-5 sm:col-span-3 lg:col-span-6">
        <EmptyState compact icon="school" title="Guruh biriktirilmagan" description="Administrator sizni guruhga qoʻshgach, Level rivoji shu yerda koʻrinadi." />
      </Card>
    );
  }
  const title = lv.shortName && lv.levelName ? `${lv.shortName}: ${lv.levelName}` : lv.name;
  return (
    <Card className="flex flex-col p-5 sm:col-span-3 lg:col-span-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
            <Icon name="workspace_premium" size={24} />
          </span>
          <div className="min-w-0">
            <p className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-muted">Level rivoji</p>
            <p className="break-words font-headline-md text-headline-md text-on-surface">{title}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display-sm text-display-sm tabular-nums text-primary">{lv.progress}%</p>
          <p className="text-body-sm text-on-surface-variant">Umumiy koʻrsatkich</p>
        </div>
      </div>
      <ProgressBar value={lv.progress} size="lg" className="mt-4" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 font-label-md text-label-md">
        {lv.prev ? (
          <span className="inline-flex items-center gap-1 text-on-surface-variant">
            <Icon name="check_circle" size={16} className="text-success" />
            {lv.prev.shortName} (Tugallandi)
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5 text-primary">
          <span className="h-2 w-2 rounded-full bg-primary" />
          {lv.shortName ?? lv.name} (Hozirgi)
        </span>
        {lv.next ? (
          <span className="inline-flex items-center gap-1 text-on-surface-muted">
            <Icon name="lock" size={16} />
            {lv.next.shortName} · {lv.next.levelName}
          </span>
        ) : null}
      </div>
      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-container-low px-3 py-2.5 text-body-sm text-on-surface-variant">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Icon name="info" size={16} className="text-primary" />
            <span>
              {lv.shortName ?? "Level"} ning <b className="text-primary">{lv.progress}%</b> i tugallandi.
              {lv.finalExam ? ` Yakuniy imtihon: ${fmtDayMonth(lv.finalExam.startsAt)}.` : ""}
            </span>
          </span>
          <Badge tone="primary">
            {lv.doneLessons} / {lv.totalLessons} dars
          </Badge>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────── ochiq vazifa ───────────────────────────

type CheckItem = { icon: string; label: string; done: boolean; optional?: boolean };

function checklist(h: DashOpenHomework): CheckItem[] {
  const p = h.progress;
  switch (h.type) {
    case "AUDIO":
      return [
        { icon: "mic", label: "Speaking audio", done: p.audioCount > 0 },
        { icon: "photo_camera", label: "Daftar rasmi yoki fayl", done: p.fileCount - p.audioCount > 0, optional: true },
        { icon: "notes", label: "Matnli izoh", done: p.hasText, optional: true },
      ];
    case "FILE":
      return [
        { icon: "upload_file", label: "Fayl yuklash", done: p.fileCount > 0 },
        { icon: "notes", label: "Matnli izoh", done: p.hasText, optional: true },
      ];
    case "TEXT":
      return [{ icon: "notes", label: "Javob matni", done: p.hasText }];
    case "QUIZ":
      return [{ icon: "quiz", label: `Savollarga javob: ${p.answered} / ${p.questionCount}`, done: p.questionCount > 0 && p.answered >= p.questionCount }];
  }
}

function OpenHomeworkCard({ d }: { d: StudentDashboard }) {
  const now = useNow();
  const h = d.openHomework[0];
  if (!h) {
    return (
      <Card>
        <EmptyState
          icon="task_alt"
          title="Ochiq vazifa yoʻq"
          description="Yangi uyga vazifa berilganda shu yerda koʻrinadi."
          action={
            <Link to="/oquvchi/vazifalar?t=done" className={buttonVariants({ variant: "outline" })}>
              Topshirilgan vazifalar
            </Link>
          }
        />
      </Card>
    );
  }
  const left = leftText(h.dueAt, now);
  const urgent = !h.overdue && new Date(h.dueAt).getTime() - now < 24 * 3600_000;
  const items = checklist(h);
  const more = d.openHomework.length - 1;
  return (
    <Card className="overflow-hidden">
      <div aria-hidden="true" className="h-1.5 bg-gradient-to-r from-primary via-navy to-gold" />
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={h.overdue ? "danger" : urgent ? "danger" : "warning"} icon="alarm">
              {h.overdue ? "Muddati oʻtgan" : `Muddat: ${dueText(h.dueAt)}`}
            </Badge>
            <CoinChip amount={h.coinReward} />
          </div>
          <Badge tone="primary" shape="square">
            {h.topic ? `Unit ${h.topic.unit} · ` : ""}Uyga vazifa
          </Badge>
        </div>
        <h2 className="mt-3 font-headline-lg text-headline-lg text-on-surface">{h.title}</h2>
        {h.description ? <p className="mt-2 line-clamp-3 text-body-md text-on-surface-variant">{h.description}</p> : null}
        <ul className="mt-4 flex flex-col gap-2.5 rounded-xl bg-surface-container-low p-4">
          {items.map((it) => (
            <li key={it.label} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2.5 text-body-md text-on-surface">
                <Icon name={it.icon} size={18} className="text-on-surface-muted" />
                <span className="truncate">{it.label}</span>
              </span>
              {it.done ? (
                <span className="inline-flex shrink-0 items-center gap-1 font-label-md text-label-md text-success">
                  <Icon name="check_circle" size={16} />
                  Tayyor
                </span>
              ) : it.optional ? (
                <span className="shrink-0 font-label-md text-label-md text-on-surface-muted">Ixtiyoriy</span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 font-label-md text-label-md text-warning">
                  <Icon name="schedule" size={16} />
                  Kutilmoqda
                </span>
              )}
            </li>
          ))}
        </ul>
        {h.state === "DRAFT" && h.progress.draftUpdatedAt ? (
          <p className="mt-2 flex items-center gap-1.5 text-body-sm text-on-surface-muted">
            <Icon name="save" size={15} />
            Qoralama saqlangan · {fmtRelDateTime(h.progress.draftUpdatedAt)}. Vazifa hali topshirilmagan.
          </p>
        ) : null}
        {h.state === "RETURNED" ? (
          <p className="mt-2 flex items-center gap-1.5 text-body-sm text-error">
            <Icon name="undo" size={15} />
            Ustoz vazifani qayta ishlashga qaytardi.
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link to={`/oquvchi/vazifalar/${h.id}`} className={buttonVariants({ size: "lg" })}>
            {h.state === "NEW" ? "Boshlash" : "Davom ettirish"}
            <Icon name="arrow_forward" size={20} />
          </Link>
          {more > 0 ? (
            <Link to="/oquvchi/vazifalar" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Yana {more} ta vazifa
            </Link>
          ) : null}
          {left ? <span className="ml-auto text-body-sm text-on-surface-muted">{left}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────── darslar ───────────────────────────

function LessonHighlight({ l, now }: { l: DashLesson; now: string }) {
  const today = relDayWord(l.startsAt, now) === "Bugun";
  const live = new Date(l.startsAt) <= new Date(now) && new Date(l.endsAt) >= new Date(now);
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="navy" variant="solid">
          {live ? "Hozir davom etmoqda" : today ? "Bugungi dars" : "Boʻlajak dars"}
        </Badge>
        <span className="font-label-md text-label-md text-primary">
          {lessonDay(l.startsAt)} · {fmtTimeRange(l.startsAt, l.endsAt)}
        </span>
      </div>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="min-w-0 font-headline-md text-headline-md text-on-surface">{l.title}</h3>
        {l.room ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface-variant">
            <Icon name="meeting_room" size={16} />
            {l.room.name}
            {l.room.location ? ` (${l.room.location})` : ""}
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-body-sm">
        {l.teacher ? (
          <span className="inline-flex items-center gap-2">
            <Icon name="person" size={18} className="text-primary" />
            <span>
              <span className="block text-on-surface-muted">Ustoz</span>
              <span className="font-label-lg text-label-lg text-on-surface">{l.teacher.fullName}</span>
            </span>
          </span>
        ) : null}
        <span className="inline-flex items-center gap-2">
          <Icon name="groups" size={18} className="text-primary" />
          <span>
            <span className="block text-on-surface-muted">Guruh</span>
            <span className="font-label-lg text-label-lg text-on-surface">{l.group.name}</span>
          </span>
        </span>
      </div>
    </div>
  );
}

function LessonsCard({ d }: { d: StudentDashboard }) {
  const list = [...d.todayLessons.filter((l) => new Date(l.endsAt) >= new Date(d.now)), ...d.upcomingLessons];
  const [first, ...rest] = list;
  const last = d.lastLesson;
  return (
    <Card>
      <CardHeader
        title="Mening darslarim"
        icon="calendar_month"
        action={
          <Link to="/oquvchi/darslar" className={buttonVariants({ variant: "link", size: "sm" })}>
            Barcha darslar jadvali
            <Icon name="arrow_forward" size={16} />
          </Link>
        }
      />
      <CardContent className="flex flex-col gap-3">
        {first ? <LessonHighlight l={first} now={d.now} /> : <p className="rounded-xl bg-surface-container-low p-4 text-body-md text-on-surface-variant">Yaqin kunlarda rejalashtirilgan dars yoʻq.</p>}
        {rest.slice(0, 2).map((l) => (
          <div key={l.id} className="rounded-xl border border-outline-variant/70 p-4">
            <div className="flex flex-wrap items-center gap-2 font-label-md text-label-md text-on-surface-variant">
              {lessonDay(l.startsAt)} · {fmtTimeRange(l.startsAt, l.endsAt)}
              {l.group.id !== first?.group.id ? (
                <Badge tone="primary" shape="square">
                  {l.group.name}
                </Badge>
              ) : null}
            </div>
            <div className="mt-1 flex items-start justify-between gap-3">
              <p className="min-w-0 font-headline-sm text-headline-sm text-on-surface">{l.title}</p>
              {l.room ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-body-sm text-on-surface-muted">
                  <Icon name="location_on" size={16} />
                  {l.room.name}
                </span>
              ) : null}
            </div>
          </div>
        ))}
        {last ? (
          <div className="rounded-xl border border-outline-variant/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-body-sm text-on-surface-muted">
                {fmtDayMonth(last.startsAt)} ({fmtWeekday(last.startsAt)})
                <Badge tone="primary" icon="check">
                  Yakunlangan
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {last.attendance && last.attendance.status !== "PRESENT" ? (
                  <Badge tone={last.attendance.status === "LATE" ? "warning" : "neutral"}>{last.attendance.label}</Badge>
                ) : null}
                {last.grade?.value != null ? (
                  <Badge tone={gradeTone(last.grade.value)}>
                    {fmtNum(last.grade.value)} ({last.grade.label})
                  </Badge>
                ) : null}
                {last.coins > 0 ? <CoinChip amount={last.coins} /> : null}
              </div>
            </div>
            <p className="mt-1 font-headline-sm text-headline-sm text-on-surface">{last.title}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────── materiallar ───────────────────────────

function MaterialsCard({ d }: { d: StudentDashboard }) {
  return (
    <Card>
      <CardHeader
        title="Oʻquv materiallari"
        icon="folder_open"
        action={
          <Link to="/oquvchi/materiallar" className={buttonVariants({ variant: "link", size: "sm" })}>
            Barchasi ({fmtNum(d.materials.total)})
            <Icon name="chevron_right" size={16} />
          </Link>
        }
      />
      <CardContent className="flex flex-col gap-2.5">
        {d.materials.latest.length ? (
          d.materials.latest.map((m) => (
            <MaterialRow
              key={m.id}
              m={m}
              compact
              meta={[MATERIAL_META[m.type].label, m.file ? fmtFileSize(m.file.size) : null, m.topic].filter(Boolean).join(" · ")}
            />
          ))
        ) : (
          <EmptyState compact icon="folder_open" title="Hozircha material yoʻq" description="Ustoz dars materiallarini qoʻshganda shu yerda koʻrinadi." />
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────── o'z o'sishi ───────────────────────────

function GrowthRow({ icon, title, sub, value, strong }: { icon: ReactNode; title: string; sub: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl p-3", strong ? "bg-primary-container text-on-primary" : "border border-outline-variant/70")}>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", strong ? "bg-on-primary/15" : "bg-surface-container-low text-on-surface-variant")}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={cn("font-label-lg text-label-lg", strong ? "" : "text-on-surface")}>{title}</p>
        <p className={cn("truncate text-body-sm", strong ? "text-on-primary/75" : "text-on-surface-muted")}>{sub}</p>
      </div>
      <span className={cn("shrink-0 font-headline-sm text-headline-sm tabular-nums", strong ? "" : "text-on-surface")}>{value}</span>
    </div>
  );
}

function GrowthCard({ d }: { d: StudentDashboard }) {
  const g = d.growth;
  const weekEnd = new Date(new Date(g.weekStart).getTime() - 86_400_000).toISOString();
  const hw = d.openHomework.find((h) => !h.overdue);
  const avg = d.grades.average;
  const trend = g.grades.current != null && g.grades.previous != null ? g.grades.current - g.grades.previous : null;
  return (
    <Card>
      <CardHeader
        title="Mening oʻsishim"
        icon="trending_up"
        description="Oʻtgan haftaga nisbatan"
        action={
          g.diff > 0 ? (
            <Badge tone="success" icon="arrow_upward">
              {signed(g.diff)} tanga
            </Badge>
          ) : undefined
        }
      />
      <CardContent className="flex flex-col gap-2.5">
        <GrowthRow
          strong
          icon={<CoinIcon size={20} className="text-gold" />}
          title="Oxirgi 7 kun"
          sub={`${fmtDayMonth(g.weekStart)} – ${fmtDayMonth(d.now)}`}
          value={`${signed(g.thisWeek)} tanga`}
        />
        <GrowthRow icon={<Icon name="history" size={20} />} title="Oʻtgan hafta" sub={`${fmtDayMonth(g.lastWeekStart)} – ${fmtDayMonth(weekEnd)}`} value={`${signed(g.lastWeek)} tanga`} />
        <GrowthRow
          icon={<Icon name="local_fire_department" size={20} className="text-warning" />}
          title="Kunlik seriya"
          sub={`Har kuni +${g.streakBonus} tanga`}
          value={`${g.streakDays} kun`}
        />
        {avg != null ? (
          <GrowthRow
            icon={<Icon name="grade" size={20} className="text-primary" />}
            title="Oʻrtacha baho"
            sub={
              trend != null && Math.abs(trend) >= 0.1
                ? `Oxirgi 30 kun: ${fmtAvg(g.grades.current)} (oldin ${fmtAvg(g.grades.previous)})`
                : `${d.grades.count} ta baho asosida`
            }
            value={`${fmtAvg(avg)} · ${avgLabel(avg)}`}
          />
        ) : null}
        {d.grades.recent.length ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-body-sm text-on-surface-muted">Soʻnggi baholar:</span>
            {d.grades.recent.map((gr) => (
              <Badge key={gr.id} tone={gradeTone(gr.value)} title={`${gr.title ?? gr.kindLabel} · ${fmtRelDay(gr.gradedAt)}`}>
                {fmtNum(gr.value)}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="mt-1 flex items-start gap-2.5 rounded-xl bg-tertiary-fixed/60 p-3 text-body-sm text-on-surface">
          <Icon name="auto_awesome" size={18} className="mt-px text-on-tertiary-fixed-variant" />
          <p>
            {g.diff > 0 ? (
              <>
                Oʻtgan haftadan <b>{fmtNum(g.diff)} tanga</b> koʻproq yigʻdingiz — zoʻr natija!
              </>
            ) : g.diff === 0 && g.thisWeek > 0 ? (
              <>Oʻtgan haftadagidek barqaror natija — shunday davom eting.</>
            ) : (
              <>Hafta hali tugamadi — har bir kichik qadam hisobga olinadi.</>
            )}
            {hw ? (
              <>
                {" "}
                «{hw.title}» vazifasini oʻz vaqtida topshirsangiz, ustoz tekshirgach yana <b>+{hw.coinReward} tanga</b>.
              </>
            ) : null}
          </p>
        </div>
        {d.upcomingExam ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-outline-variant/70 p-3 text-body-sm">
            <Icon name="event_note" size={20} className="text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block font-label-lg text-label-lg text-on-surface">{d.upcomingExam.title}</span>
              <span className="text-on-surface-muted">
                {fmtRelDay(d.upcomingExam.startsAt)}, {fmtTime(d.upcomingExam.startsAt)}
                {d.upcomingExam.location ? ` · ${d.upcomingExam.location}` : ""}
              </span>
            </span>
            <Badge tone="primary">Imtihon</Badge>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────── ustoz ───────────────────────────

function TeacherCard({ d }: { d: StudentDashboard }) {
  const t = d.teacher;
  if (!t) return null;
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <Avatar name={t.fullName} src={t.avatarUrl} size="lg" />
        <div className="min-w-0">
          <p className="font-headline-sm text-headline-sm text-on-surface">Ustoz: {t.fullName}</p>
          <p className="mt-0.5 text-body-sm text-on-surface-variant">
            Dars mavzulari yoki vazifa boʻyicha savolingiz boʻlsa, bemalol xabar yoʻllang!
            {t.responseTime ? ` Javob vaqti: ${t.responseTime}.` : ""}
          </p>
        </div>
      </div>
      <Link to={`/oquvchi/chat?to=${t.id}`} className={buttonVariants({ variant: "secondary", block: true, className: "mt-4 text-primary" })}>
        <Icon name="chat" size={18} />
        Ustozga savol berish
      </Link>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-12">
        <Skeleton className="h-44 rounded-xl sm:col-span-3 lg:col-span-6" />
        <Skeleton className="h-44 rounded-xl lg:col-span-2" />
        <Skeleton className="h-44 rounded-xl lg:col-span-2" />
        <Skeleton className="h-44 rounded-xl lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Skeleton className="h-80 rounded-xl lg:col-span-7" />
        <Skeleton className="h-80 rounded-xl lg:col-span-5" />
      </div>
    </div>
  );
}
