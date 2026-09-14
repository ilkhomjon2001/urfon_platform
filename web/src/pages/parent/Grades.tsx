// /ota-ona/baholar — farzandning to'liq profili va o'zlashtirish monitoringi
// (mockup: urfon_ota_ona_kabineti_farzand_to_liq_profili_va_o_zlashtirish_monitoringi).
// Guruh o'rtachasi / reyting YO'Q — faqat farzandning o'z natijasi va "Aʼlo chegarasi (4.5)" mo'ljal chizig'i (KANON §8).
import { useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { Badge, Button, Card, CardContent, CardHeader, Icon, PageHeader, ProgressBar, StatCard, Table, TBody, TD, TH, THead, TR, Tabs, TabsList, TabsTrigger, buttonVariants } from "@/components/ui";
import { iconTileTone } from "@/components/ui";
import { cn } from "@/lib/cn";
import { avgLabel, avgTone, dayDiff, fmtAvg, fmtDate, fmtDayMonth, fmtDays, fmtNum, fmtPhone, MONTHS, todayYmd, toYmd, gradeLabel, gradeTone } from "@/lib/format";
import {
  contactLink,
  ErrorCard,
  fmtGrade,
  NoChild,
  PageSkeleton,
  PARENT_BASE,
  printWith,
  PrintStyles,
  SKILL_LABEL,
  STUDENT_STATUS,
  TeacherAvatar,
  useChildQuery,
} from "./p/shared";
import type { GradesData } from "./p/types";

// Grafik ranglari tokenlarga mos (SVG atributlari Tailwind klassini qabul qilmaydi):
const C_PRIMARY = "#1E4FC2"; // primary
const C_GRID = "#E2E8F0"; // outline-variant
const C_AXIS = "#64748B"; // on-surface-muted
const C_REF = "#94A3B8"; // outline
const C_SURFACE = "#FFFFFF"; // surface

const RANGES = [
  { value: "all", label: "Butun davr" },
  { value: "3m", label: "Soʻnggi 3 oy" },
  { value: "month", label: "Joriy oy" },
] as const;

const EXAM_TYPE: Record<string, string> = { MOCK: "Mock imtihon", MIDTERM: "Oraliq nazorat", FINAL: "Yakuniy imtihon", QUIZ: "Test" };

export default function ParentGrades() {
  const [sp, setSp] = useSearchParams();
  const range = RANGES.some((r) => r.value === sp.get("davr")) ? (sp.get("davr") as string) : "all";
  const params =
    range === "3m" ? { from: toYmd(Date.now() - 90 * 86_400_000) } : range === "month" ? { from: `${todayYmd().slice(0, 7)}-01` } : {};
  const { data, isLoading, error, refetch, child, isPlaceholderData } = useChildQuery<GradesData>(["grades"], "/parent/grades", params, { keepPrevious: true });

  if (!child) return <NoChild />;
  if (isLoading) return <PageSkeleton />;
  if (error || !data) return <ErrorCard error={error} onRetry={() => void refetch()} />;

  const setRange = (v: string) => {
    const next = new URLSearchParams(sp);
    if (v === "all") next.delete("davr");
    else next.set("davr", v);
    setSp(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <PrintStyles />
      <PageHeader
        breadcrumbs={[{ label: "Bosh sahifa", to: PARENT_BASE }, { label: "Baholar va oʻzlashtirish" }, { label: "Farzand profili" }]}
        title="Farzandning toʻliq profili"
        documentTitle="Baholar va oʻzlashtirish"
        subtitle="Oʻquv jarayoni, Level boʻyicha rivojlanish va batafsil koʻrsatkichlar"
        actions={
          <Button icon="print" className="no-print" onClick={() => printWith("printing-page")}>
            Profilni chop etish / PDF
          </Button>
        }
      />

      <div className="no-print flex flex-wrap items-center gap-3">
        <Tabs value={range} onValueChange={setRange} variant="segmented">
          <TabsList>
            {RANGES.map((r) => (
              <TabsTrigger key={r.value} value={r.value}>
                {r.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <span className="text-body-sm text-on-surface-muted">
          {data.range.from ? `${fmtDate(data.range.from)} — ${fmtDate(data.range.to)}` : "Oʻqish boshlangandan buyon"}
        </span>
      </div>

      <div className={cn("space-y-6 transition-opacity", isPlaceholderData && "opacity-60")}>
        <ProfileHeader data={data} />
        <KpiRow data={data} />
        {data.levelMap.length ? <LevelMap data={data} /> : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="min-w-0 space-y-6 xl:col-span-8">
            <DynamicsCard data={data} />
            <RecentGradesCard data={data} />
            <ExamsCard data={data} />
          </div>
          <div className="min-w-0 space-y-6 xl:col-span-4">
            <TeacherCard data={data} />
            <DistributionCard data={data} />
            <AttendanceCard data={data} />
            {data.upcomingExams.length ? <UpcomingExams data={data} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────── Profil sarlavhasi

function ProfileHeader({ data }: { data: GradesData }) {
  const c = data.child;
  const g = c.group;
  const st = STUDENT_STATUS[c.status] ?? STUDENT_STATUS.ACTIVE;
  const months = c.enrolledAt ? Math.max(0, Math.round(dayDiff(c.enrolledAt, data.now) / 30)) : null;
  const initials = c.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => Array.from(w)[0])
    .join("")
    .toUpperCase();
  return (
    <Card className="print-break-avoid">
      <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="relative mx-auto shrink-0 lg:mx-0">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-fixed font-display text-[32px] font-bold text-on-primary-fixed sm:h-28 sm:w-28">{initials}</div>
          {c.status === "ACTIVE" ? <span className="absolute bottom-1.5 right-1.5 h-5 w-5 rounded-full bg-success ring-4 ring-surface-container-lowest" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface sm:font-headline-xl sm:text-headline-xl">{c.fullName}</h2>
            <Badge tone={st.tone}>
              {st.label}
              {g ? ` · ${g.name}` : ""}
            </Badge>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 text-body-sm text-on-surface-variant md:grid-cols-2">
            <Row icon="badge">
              ID: <b className="text-on-surface">#{c.code}</b>
            </Row>
            {g ? (
              <Row icon="groups">
                Guruh: <b className="text-on-surface">{g.name}</b> ({fmtDays(g.days, g.startTime)})
              </Row>
            ) : null}
            {g?.branch || g?.room ? (
              <Row icon="location_on">
                Filial: <b className="text-on-surface">{[g.branch?.name, g.room?.name].filter(Boolean).join(", ")}</b>
              </Row>
            ) : null}
            {c.enrolledAt ? (
              <Row icon="event">
                Oʻqishni boshlagan: <b className="text-on-surface">{fmtDate(c.enrolledAt)}</b>
                {months ? ` (${months} oy)` : ""}
              </Row>
            ) : null}
          </div>
          {c.goal ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-body-sm text-on-surface">
              <Badge tone="gold" icon="flag" shape="square">
                Maqsad
              </Badge>
              {c.goal}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
          {c.turnstileId ? (
            <div className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3">
              <Icon name="qr_code_2" size={28} className="text-primary" />
              <div>
                <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">Turniket ID</div>
                <div className="font-headline-sm text-headline-sm tracking-wide text-primary">{c.turnstileId}</div>
              </div>
            </div>
          ) : null}
          {g?.teacher ? (
            <Link to={contactLink({ teacherId: g.teacher.id })} className={buttonVariants({ variant: "primary", className: "no-print" })}>
              <Icon name="chat" size={18} />
              Ustozga savol yoʻllash
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon name={icon} size={18} className="mt-px shrink-0 text-outline" />
      <span className="min-w-0">{children}</span>
    </div>
  );
}

// ─────────────────────────────── KPI

function KpiRow({ data }: { data: GradesData }) {
  const a = data.attendance;
  const hw = data.homework;
  const cur = data.levelMap.find((l) => l.state === "CURRENT");
  const nextLv = data.levelMap.find((l) => l.state === "NEXT");
  const growth = data.growth;
  const dist = data.distribution.filter((d) => d.count > 0).slice(0, 2);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Davomat koʻrsatkichi"
        icon="event_available"
        value={a.percent != null ? `${a.percent}%` : "—"}
        badge={a.percent != null && a.percent >= 90 ? <Badge tone="success">Yaxshi natija</Badge> : null}
        progress={a.percent ?? 0}
        sub={a.marked ? `${a.attended}/${a.marked} dars · ${a.missed} ta qoldirilgan${a.excused ? ` (${a.excused} sababli)` : ""}` : "Hali dars oʻtilmagan"}
      />
      <StatCard
        label="Oʻrtacha baho"
        icon="star"
        iconTone="gold"
        value={
          <span>
            {fmtAvg(data.average)}
            <span className="ml-1 text-body-md text-on-surface-muted">/ 5.0</span>
          </span>
        }
        badge={
          growth != null && Math.abs(growth) >= 0.05 ? (
            <Badge tone={growth > 0 ? "success" : "neutral"} icon={growth > 0 ? "trending_up" : "trending_down"}>
              {growth > 0 ? "+" : "−"}
              {fmtAvg(Math.abs(growth))} {growth > 0 ? "oʻsish" : "pasayish"}
            </Badge>
          ) : data.average != null ? (
            <Badge tone={avgTone(data.average)}>{avgLabel(data.average)}</Badge>
          ) : null
        }
        progress={data.average != null ? (data.average / 5) * 100 : 0}
        progressTone="gold"
        sub={dist.length ? dist.map((d) => `${d.value} baho: ${d.percent}%`).join(" · ") : "Hali baho qoʻyilmagan"}
      />
      <StatCard
        label="Uyga vazifalar"
        icon="task_alt"
        iconTone="success"
        value={hw.percent != null ? `${hw.percent}%` : "—"}
        badge={hw.total ? <Badge tone="primary">{`${hw.done} / ${hw.total} ta`}</Badge> : null}
        progress={hw.percent ?? 0}
        progressTone="success"
        sub={hw.done ? `${hw.onTime} tasi oʻz vaqtida topshirilgan` : "Hali topshirilgan vazifa yoʻq"}
      />
      <StatCard
        label="Joriy Level"
        icon="trending_up"
        value={
          cur ? (
            <span>
              {cur.code.startsWith("L") ? `Level ${cur.code.slice(1)}` : cur.name}
              {cur.code.startsWith("L") ? <span className="ml-1 text-body-md text-on-surface-muted">/ {data.levelMap.length}</span> : null}
            </span>
          ) : (
            "—"
          )
        }
        badge={data.level ? <Badge tone="primary">{data.level.progress}% tugallandi</Badge> : null}
        progress={data.level?.progress ?? 0}
        progressTone="navy"
        sub={
          cur
            ? cur.code.startsWith("L")
              ? `${cur.name}${nextLv ? ` → ${nextLv.name}` : ""}`
              : data.level
                ? `${data.level.lessonsDone} / ${data.level.totalLessons} dars oʻtildi`
                : cur.name
            : "Guruh biriktirilmagan"
        }
      />
    </div>
  );
}

// ─────────────────────────────── Level xaritasi

function LevelMap({ data }: { data: GradesData }) {
  return (
    <Card className="print-break-avoid">
      <CardHeader title="Level boʻyicha oʻsish xaritasi" description={`${data.levelMap.length} ta Leveldan iborat akademik reja va joriy holat`} />
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {data.levelMap.map((l) => {
            const current = l.state === "CURRENT";
            const icon = l.state === "DONE" ? "check_circle" : current ? "radio_button_checked" : l.state === "NEXT" ? "arrow_forward" : "lock";
            return (
              <div
                key={l.id}
                className={cn(
                  "flex min-w-0 flex-col rounded-xl border p-3.5",
                  current ? "border-primary bg-primary text-on-primary shadow-float" : "border-outline-variant/70 bg-surface-container-low",
                )}
              >
                <div className={cn("flex items-center justify-between font-label-sm text-label-sm uppercase tracking-wider", current ? "text-on-primary/80" : "text-on-surface-muted")}>
                  {l.code.startsWith("L") ? `Level ${l.code.slice(1)}` : l.code}
                  {current ? <Badge tone="gold" variant="solid">Joriy</Badge> : <Icon name={icon} size={16} className={l.state === "DONE" ? "text-success" : ""} />}
                </div>
                <div className={cn("mt-2 font-label-lg text-label-lg", current ? "text-on-primary" : "text-on-surface")}>{l.name}</div>
                <div className={cn("mt-0.5 text-body-sm", current ? "text-on-primary/85" : l.state === "DONE" ? "text-success" : "text-on-surface-muted")}>
                  {l.state === "DONE"
                    ? "100% tugallangan"
                    : current
                      ? `${l.progress}%${l.finalExamAt ? ` · Imtihon: ${fmtDayMonth(l.finalExamAt)}` : ""}`
                      : l.state === "NEXT"
                        ? "Navbatdagi Level"
                        : "Rejada"}
                </div>
                <div className={cn("mt-3 h-1.5 overflow-hidden rounded-full", current ? "bg-on-primary/25" : "bg-surface-container-high")}>
                  <div className={cn("h-full rounded-full", current ? "bg-gold" : "bg-success")} style={{ width: `${l.progress}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────── Dinamika grafigi

type Point = { label: string; average: number | null; count: number; best: GradesData["series"][number]["best"]; start: string };

function bucketLabel(iso: string, bucket: "week" | "month") {
  if (bucket === "week") return fmtDayMonth(iso);
  const d = new Date(new Date(iso).getTime() + 5 * 3_600_000);
  const m = MONTHS[d.getUTCMonth()];
  return `${m.charAt(0).toUpperCase()}${m.slice(1)}`;
}

function ChartTooltip({ active, payload, bucket }: TooltipProps<number, string> & { bucket: "week" | "month" }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as Point;
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 shadow-float">
      <div className="flex items-baseline gap-2">
        <span className="font-headline-sm text-headline-sm text-on-surface">{fmtAvg(p.average)}</span>
        <span className="text-body-sm text-on-surface-variant">{avgLabel(p.average)}</span>
      </div>
      <div className="text-body-sm text-on-surface-variant">
        {bucket === "week" ? `${p.label} haftasi` : p.label} · {p.count} ta baho
      </div>
      {p.best?.title ? (
        <div className="mt-1 max-w-[220px] text-body-sm text-on-surface-muted">
          Eng yuqori: {p.best.title} — {fmtGrade(p.best.value)}
        </div>
      ) : null}
    </div>
  );
}

function DynamicsCard({ data }: { data: GradesData }) {
  const [mode, setMode] = useState<"chart" | "table">("chart");
  const points: Point[] = data.series.map((s) => ({ label: bucketLabel(s.start, data.bucket), average: s.average, count: s.count, best: s.best, start: s.start }));
  const last = points.at(-1);
  // Y o'qi: 5 dan eng past qiymatdan bir pog'ona pastgacha (2 dan past emas) — butun sonli belgilar bilan
  const minVal = Math.min(...points.map((p) => p.average ?? 5), data.threshold);
  const yMin = Math.max(2, Math.floor(minVal) - 1);
  const yTicks = Array.from({ length: 5 - yMin + 1 }, (_, i) => yMin + i);
  return (
    <Card className="print-break-avoid">
      <CardHeader
        title="Baholar va oʻzlashtirish dinamikasi"
        description={`${data.child.fullName.split(" ")[0]}ning ${data.bucket === "week" ? "haftalik" : "oylik"} oʻrtacha bahosi (5 ballik)`}
        className="flex-col sm:flex-row"
        action={
          <Tabs value={mode} onValueChange={(v) => setMode(v as "chart" | "table")} variant="segmented" className="no-print">
            <TabsList>
              <TabsTrigger value="chart" icon="show_chart">
                Grafik
              </TabsTrigger>
              <TabsTrigger value="table" icon="table_rows">
                Jadval
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />
      <CardContent className="space-y-5">
        {points.length === 0 ? (
          <p className="py-10 text-center text-body-md text-on-surface-variant">Bu davrda baho qoʻyilmagan.</p>
        ) : mode === "chart" ? (
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-4 font-label-md text-label-md text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded bg-primary" /> Oʻrtacha baho
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-dashed border-outline" /> Aʼlo chegarasi ({fmtAvg(data.threshold)})
              </span>
              {last?.average != null ? <span className="ml-auto text-on-surface">Soʻnggi: {fmtAvg(last.average)}</span> : null}
            </div>
            <div className="h-[240px] sm:h-[280px]" role="img" aria-label="Oʻrtacha baho dinamikasi grafigi">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={C_GRID} strokeWidth={1} />
                  <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: C_GRID }} tick={{ fontSize: 11, fill: C_AXIS }} minTickGap={18} interval="preserveStartEnd" />
                  <YAxis domain={[yMin, 5]} ticks={yTicks} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: C_AXIS }} width={40} />
                  <ReferenceLine
                    y={data.threshold}
                    stroke={C_REF}
                    strokeDasharray="5 4"
                    strokeWidth={1.5}
                    label={{ value: `Aʼlo chegarasi (${fmtAvg(data.threshold)})`, position: "insideBottomRight", fill: C_AXIS, fontSize: 11 }}
                  />
                  <Tooltip cursor={{ stroke: C_REF, strokeWidth: 1 }} content={<ChartTooltip bucket={data.bucket} />} />
                  <Area
                    type="monotone"
                    dataKey="average"
                    stroke={C_PRIMARY}
                    strokeWidth={2}
                    fill={C_PRIMARY}
                    fillOpacity={0.1}
                    connectNulls
                    isAnimationActive={false}
                    dot={{ r: 4, strokeWidth: 2, stroke: C_SURFACE, fill: C_PRIMARY }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: C_SURFACE, fill: C_PRIMARY }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>{data.bucket === "week" ? "Hafta" : "Oy"}</TH>
                <TH className="text-right">Oʻrtacha</TH>
                <TH className="text-right">Baholar</TH>
                <TH>Eng yuqori</TH>
              </tr>
            </THead>
            <TBody>
              {[...points].reverse().map((p) => (
                <TR key={p.start}>
                  <TD>{p.label}</TD>
                  <TD className="text-right tabular-nums">
                    {fmtAvg(p.average)} <span className="text-on-surface-muted">({avgLabel(p.average)})</span>
                  </TD>
                  <TD className="text-right tabular-nums">{p.count}</TD>
                  <TD className="max-w-[240px] truncate">{p.best ? `${p.best.title ?? "—"} — ${fmtGrade(p.best.value)}` : "—"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}

        {data.skills.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {data.skills.map((s) => {
              const up = s.trend != null && s.trend >= 0.1;
              const down = s.trend != null && s.trend <= -0.1;
              return (
                <div key={s.skill} className="rounded-xl bg-surface-container-low p-3 text-center">
                  <div className="text-body-sm text-on-surface-variant">{SKILL_LABEL[s.skill] ?? s.skill}</div>
                  <div className="font-headline-lg text-headline-lg text-primary">{fmtAvg(s.average)}</div>
                  <div className={cn("font-label-sm text-label-sm", up ? "text-success" : s.belowAla ? "text-warning" : "text-on-surface-muted")}>
                    {up ? `+${fmtAvg(s.trend)} oʻsish` : down ? `${fmtAvg(s.trend)} pasaydi` : s.belowAla ? "Eʼtibor zarur" : "Barqaror"}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────── Baholar ro'yxati

function RecentGradesCard({ data }: { data: GradesData }) {
  const [all, setAll] = useState(false);
  const list = all ? data.grades : data.grades.slice(0, 6);
  return (
    <Card>
      <CardHeader
        title="Soʻnggi baholar va ustoz izohlari"
        badge={<Badge>{fmtNum(data.count)} ta</Badge>}
        action={
          data.grades.length > 6 ? (
            <Button variant="link" size="sm" className="no-print" onClick={() => setAll((a) => !a)}>
              {all ? "Qisqaroq" : "Barchasini koʻrish"}
            </Button>
          ) : null
        }
      />
      <CardContent className="space-y-3">
        {list.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">Bu davrda baho qoʻyilmagan.</p>
        ) : (
          list.map((g) => (
            <div key={g.id} className="print-break-avoid flex gap-3 rounded-xl bg-surface-container-low p-3.5 sm:p-4">
              <span className={cn("hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:flex", iconTileTone.primary)}>
                <Icon name={g.kind === "SPEAKING" ? "mic" : g.kind === "TEST" ? "quiz" : g.kind === "HOMEWORK" ? "assignment" : g.kind === "WRITING" ? "edit_note" : "school"} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-label-lg text-label-lg text-on-surface">{g.title ?? g.kindLabel}</div>
                <div className="text-body-sm text-on-surface-variant">
                  {fmtDate(g.gradedAt)} · {g.kindLabel}
                  {g.skill ? ` · ${SKILL_LABEL[g.skill] ?? g.skill}` : ""}
                  {g.lesson?.title ? ` · ${g.lesson.title}` : ""}
                </div>
                {g.comment ? <p className="mt-1 text-body-sm italic text-on-surface-variant">«{g.comment}»</p> : null}
                {g.lesson ? (
                  <Link to={`${PARENT_BASE}/darslar/${g.lesson.id}`} className="no-print mt-1 inline-flex items-center gap-0.5 font-label-sm text-label-sm text-primary hover:underline">
                    Dars tafsiloti <Icon name="chevron_right" size={14} />
                  </Link>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <div className="font-headline-md text-headline-md tabular-nums text-primary">{fmtGrade(g.value)} / 5</div>
                <Badge tone={gradeTone(g.value)}>{gradeLabel(g.value)}</Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ExamsCard({ data }: { data: GradesData }) {
  if (!data.exams.length) return null;
  return (
    <Card>
      <CardHeader icon="military_tech" title="Imtihon natijalari" />
      <CardContent className="space-y-3">
        {data.exams.map((r) => {
          const secs = Object.entries(r.sections).filter(([, v]) => v != null) as [string, number][];
          return (
            <div key={r.id} className="print-break-avoid rounded-xl border border-outline-variant/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-label-lg text-label-lg text-on-surface">{r.exam.title}</div>
                  <div className="text-body-sm text-on-surface-variant">
                    {EXAM_TYPE[r.exam.type] ?? r.exam.type} · {fmtDate(r.exam.startsAt)}
                    {r.exam.location ? ` · ${r.exam.location}` : ""}
                  </div>
                </div>
                <div className="font-headline-lg text-headline-lg text-primary">
                  {r.band != null ? `${fmtNum(r.band)} band` : r.percent != null ? `${r.percent}%` : "—"}
                </div>
              </div>
              {secs.length ? (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {secs.map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-surface-container-low px-3 py-2">
                      <div className="text-body-sm text-on-surface-variant">{SKILL_LABEL[k.toUpperCase()] ?? k}</div>
                      <div className="font-label-lg text-label-lg text-on-surface">{fmtNum(v)}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              {r.comment ? <p className="mt-2 text-body-sm italic text-on-surface-variant">«{r.comment}»</p> : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────── O'ng ustun

function TeacherCard({ data }: { data: GradesData }) {
  const t = data.teacher;
  if (!t) return null;
  const phone = data.child.group?.branch?.phone;
  return (
    <Card className="print-break-avoid">
      <CardContent className="space-y-4">
        <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">Masʼul ustoz</p>
        <div className="flex items-start gap-4">
          <TeacherAvatar teacher={t} size="xl" className="rounded-xl" />
          <div className="min-w-0">
            <div className="font-headline-md text-headline-md text-on-surface">{t.fullName}</div>
            <div className="font-label-md text-label-md text-primary">{[t.title, t.specialization].filter(Boolean).join(" · ")}</div>
            {t.experienceYears ? <p className="mt-1 text-body-sm text-on-surface-variant">{t.experienceYears} yillik tajriba</p> : null}
          </div>
        </div>
        {t.responseTime ? (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-low px-3.5 py-2.5 text-body-sm">
            <span className="flex items-center gap-2 text-on-surface-variant">
              <Icon name="forum" size={18} /> Javob berish vaqti:
            </span>
            <span className="font-semibold text-on-surface">{t.responseTime}</span>
          </div>
        ) : null}
        <div className="no-print grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link to={contactLink({ teacherId: t.id })} className={buttonVariants({ variant: "primary", block: true })}>
            <Icon name="chat" size={18} />
            Xabar yozish
          </Link>
          {phone ? (
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={buttonVariants({ variant: "secondary", block: true })} title={`Filial: ${fmtPhone(phone)}`}>
              <Icon name="call" size={18} />
              Qoʻngʻiroq qilish
            </a>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function DistributionCard({ data }: { data: GradesData }) {
  return (
    <Card className="print-break-avoid">
      <CardHeader title="Baholar taqsimoti" description={`${fmtNum(data.count)} ta baho boʻyicha`} />
      <CardContent className="space-y-3">
        {data.distribution.map((d) => (
          <div key={d.value} className="flex items-center gap-3">
            <span className="w-24 shrink-0 font-label-md text-label-md text-on-surface">
              {d.value} · {gradeLabel(d.value)}
            </span>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full rounded-r bg-primary" style={{ width: `${d.percent}%` }} />
            </div>
            <span className="w-16 shrink-0 text-right text-body-sm tabular-nums text-on-surface-variant">
              {d.percent}% ({d.count})
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AttendanceCard({ data }: { data: GradesData }) {
  const a = data.attendance;
  const rows = [
    { label: "Oʻz vaqtida keldi", value: a.present, dot: "bg-success" },
    { label: "Kechikib keldi", value: a.late, dot: "bg-warning" },
    { label: "Kelmadi (sababli)", value: a.excused, dot: "bg-primary" },
    { label: "Kelmadi", value: a.absent, dot: "bg-error" },
  ];
  return (
    <Card className="print-break-avoid">
      <CardHeader title="Davomat va vazifalar" action={<Link to={`${PARENT_BASE}/darslar`} className="no-print font-label-md text-label-md text-primary hover:underline">Taqvim</Link>} />
      <CardContent className="space-y-4">
        <ProgressBar value={a.percent ?? 0} label={`Davomat · ${a.marked} ta dars`} showValue tone="success" />
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between text-body-sm">
              <span className="flex items-center gap-2 text-on-surface-variant">
                <span className={cn("h-2.5 w-2.5 rounded-full", r.dot)} />
                {r.label}
              </span>
              <span className="font-semibold tabular-nums text-on-surface">{r.value}</span>
            </li>
          ))}
        </ul>
        <ProgressBar
          value={data.homework.percent ?? 0}
          label={`Uyga vazifalar · ${data.homework.done}/${data.homework.total}`}
          showValue
          tone="primary"
        />
      </CardContent>
    </Card>
  );
}

function UpcomingExams({ data }: { data: GradesData }) {
  return (
    <Card>
      <CardHeader icon="event" title="Yaqinlashayotgan imtihonlar" />
      <CardContent className="space-y-3">
        {data.upcomingExams.map((e) => (
          <div key={e.id} className="rounded-xl bg-surface-container-low p-3">
            <div className="font-label-lg text-label-lg text-on-surface">{e.title}</div>
            <div className="text-body-sm text-on-surface-variant">
              {fmtDate(e.startsAt)} · {EXAM_TYPE[e.type] ?? e.type}
              {e.location ? ` · ${e.location}` : ""}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
