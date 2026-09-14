// Admin: Boshqaruv markazi — bosh sahifa.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert, Badge, Button, buttonVariants, Card, CardContent, CardHeader, DropdownMenu, EmptyState, Icon, IconButton, PageHeader, ProgressBar, Skeleton,
  StatCard, Table, TBody, TD, TH, THead, TR, Tabs, TabsList, TabsTrigger,
} from "@/components/ui";
import { useCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import {
  dayDiff, fmtDateShort, fmtDayMonth, fmtMoney, fmtMonthYear, fmtNum, fmtPercent, fmtRelDay, fmtTime, fmtTimeRange, fmtWeekday, MONTHS, relDayWord, tzParts,
} from "@/lib/format";
import { useSearchParamState } from "@/lib/hooks";
import { useApiQuery } from "@/lib/query";
import type { Tone } from "@/lib/types";
import { AttendanceChart, GrowthChart, RevenueChart } from "./a/DashCharts";
import { LESSON_STATUS } from "./a/shared";
import type { AlertSeverity, DashboardAlert, DashboardData } from "./a/types";

const SEVERITY: Record<AlertSeverity, { label: string; tone: Tone }> = {
  high: { label: "Yuqori", tone: "danger" },
  medium: { label: "Oʻrta", tone: "warning" },
  low: { label: "Past", tone: "neutral" },
};

const ALERT_ICON: Record<string, { icon: string; cls: string }> = {
  group_without_teacher: { icon: "person_cancel", cls: "text-error" },
  overdue_payments: { icon: "credit_card_off", cls: "text-error" },
  low_attendance: { icon: "event_busy", cls: "text-warning" },
  late_reviews: { icon: "assignment_late", cls: "text-warning" },
  unmarked_lessons: { icon: "pending_actions", cls: "text-on-surface-variant" },
};

function dueOf(a: DashboardAlert, now: Date): { text: string; cls: string; icon?: string } {
  if (!a.dueAt) return { text: "Navbatsiz", cls: "text-on-surface-variant" };
  const diff = dayDiff(now, a.dueAt);
  switch (a.kind) {
    case "group_without_teacher":
      return diff >= 0
        ? { text: `${diff === 0 ? "Bugun" : `${diff} kun`} (dars ${fmtWeekday(a.dueAt).toLowerCase()}, ${fmtDayMonth(a.dueAt)})`, cls: "text-error", icon: "timer" }
        : { text: "Dars boshlangan", cls: "text-error", icon: "timer" };
    case "overdue_payments":
      return { text: `${Math.max(1, -diff)} kun kechikkan`, cls: "text-error" };
    case "late_reviews":
      return { text: `${Math.max(2, -diff)} kun kechikmoqda`, cls: "text-warning" };
    default:
      return { text: fmtRelDay(a.dueAt), cls: "text-on-surface-variant" };
  }
}

export default function AdminDashboardPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const q = useApiQuery<DashboardData>(["admin", "dashboard"], "/admin/dashboard", { refetchInterval: 60_000 });
  const d = q.data;
  const k = d?.kpis;
  const now = d ? new Date(d.now) : new Date();
  const [chartTab, setChartTab] = useSearchParamState("chart", "students");
  const [tableView, setTableView] = useState(false);
  const np = tzParts(now);

  const attTone: { label: string; tone: Tone } | null =
    k?.attendance.todayPct == null ? null : k.attendance.todayPct >= 85 ? { label: "Normal", tone: "success" } : k.attendance.todayPct >= 75 ? { label: "Oʻrtacha", tone: "warning" } : { label: "Past", tone: "danger" };

  const growth = d?.charts.studentsGrowth ?? [];
  const netGrowth = growth.length > 1 ? growth[growth.length - 1].count - growth[0].count : 0;
  const netPct = growth.length > 1 && growth[0].count ? Math.round((netGrowth / growth[0].count) * 100) : null;
  const trend = d?.charts.attendanceTrend ?? [];
  const lastWeek = [...trend].reverse().find((t) => t.pct != null);
  const topLevel = [...(d?.charts.levels ?? [])].sort((a, b) => b.students - a.students)[0];
  const maxLevel = Math.max(1, ...(d?.charts.levels ?? []).map((l) => l.students));

  return (
    <>
      <PageHeader
        title={`Xush kelibsiz, ${user.fullName}`}
        documentTitle="Bosh sahifa"
        badge={<Badge tone="primary">Boshqaruv markazi</Badge>}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <Icon name="verified_user" size={16} className="text-primary" />
            Oʻquv markazining umumiy boshqaruv va nazorat markazi
            <span className="text-outline">·</span>
            Soʻnggi yangilanish: {q.dataUpdatedAt ? `bugun ${fmtTime(q.dataUpdatedAt)}` : "—"}
          </span>
        }
        actions={
          <>
            <div className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 shadow-xs">
              <Icon name="calendar_today" size={18} className="text-primary" />
              <span className="font-label-lg text-label-lg">Joriy oy: {fmtMonthYear(now)}</span>
              <span className="text-body-sm text-on-surface-variant">
                (1–{np.day} {MONTHS[np.month]})
              </span>
            </div>
            <IconButton icon="refresh" label="Yangilash" variant="outline" loading={q.isFetching} onClick={() => void q.refetch()} />
            <DropdownMenu
              label="Tezkor qoʻshish"
              trigger={
                <Button variant="navy" icon="add_circle">
                  Tezkor qoʻshish
                </Button>
              }
              items={[
                { label: "Guruh", icon: "group_add", to: "/admin/guruhlar?new=1" },
                { label: "Ustoz", icon: "person_add", to: "/admin/ustozlar?new=1" },
                { label: "Mavzu", icon: "menu_book", to: "/admin/mavzular?new=1" },
                { label: "Oʻquvchi", icon: "school", to: "/admin/oquvchilar?new=1" },
                { label: "Toʻlov", icon: "add_card", to: "/admin/tolovlar?new=1" },
              ]}
            />
          </>
        }
      />

      {q.error && !d ? (
        <Alert tone="danger" title="Maʼlumotlar yuklanmadi" className="mb-6" action={<Button size="sm" variant="outline" onClick={() => void q.refetch()}>Qayta urinish</Button>}>
          {q.error.message}
        </Alert>
      ) : null}

      {/* ─── KPI ─── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Faol oʻquvchilar"
          value={fmtNum(k?.students.active ?? 0)}
          unit="nafar"
          icon="school"
          loading={!k}
          badge={k?.students.newThisMonth ? <Badge tone="primary">+{k.students.newThisMonth} yangi</Badge> : undefined}
          delta={k?.students.changePct != null ? { value: `${k.students.changePct >= 0 ? "+" : ""}${fmtNum(k.students.changePct)}%`, positive: k.students.changePct >= 0 } : undefined}
          sub={k ? "oʻtgan oyga nisbatan" : undefined}
          onClick={() => navigate("/admin/oquvchilar")}
        />
        <StatCard
          label="Bugungi davomat"
          value={k?.attendance.todayPct != null ? fmtPercent(k.attendance.todayPct, 0) : "—"}
          icon="fingerprint"
          iconTone="navy"
          loading={!k}
          badge={attTone ? <Badge tone={attTone.tone}>{attTone.label}</Badge> : undefined}
          sub={
            k
              ? k.attendance.todayMarked
                ? `${k.attendance.todayPresent} / ${k.attendance.todayExpected} keldi · ${k.attendance.todayExcused} sababli`
                : `Hali belgilanmagan · oy boʻyicha ${fmtPercent(k.attendance.monthPct, 0)}`
              : undefined
          }
          onClick={() => document.getElementById("today-lessons")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        />
        <StatCard
          label="Toʻlovlar (bu oy)"
          value={fmtNum(k?.payments.collected ?? 0)}
          unit="soʻm"
          icon="payments"
          iconTone="success"
          loading={!k}
          progress={k?.payments.planPct ?? 0}
          progressTone="success"
          sub={k ? `Rejaning ${fmtPercent(k.payments.planPct, 0)} bajarildi` : undefined}
          onClick={() => navigate("/admin/tolovlar")}
        />
        <StatCard
          label="Faol guruhlar"
          value={fmtNum(k?.groups.active ?? 0)}
          unit="ta guruh"
          icon="groups"
          iconTone="primary"
          loading={!k}
          badge={k?.groups.enrolling ? <Badge tone="navy" variant="solid">{k.groups.enrolling} ta yangi qabulda</Badge> : undefined}
          sub={k ? (k.groups.withoutTeacher ? `${k.groups.withoutTeacher} ta guruh ustozsiz` : `${fmtPercent(k.groups.roomsUsagePct, 0)} xonalar bandligi`) : undefined}
          subTone={k?.groups.withoutTeacher ? "danger" : undefined}
          onClick={() => navigate("/admin/guruhlar")}
        />
        <StatCard
          label="Ustozlar"
          value={fmtNum(k?.teachers.active ?? 0)}
          unit="nafar"
          icon="psychology"
          iconTone="gold"
          loading={!k}
          sub={k ? `Oʻrtacha ${fmtNum(k.teachers.avgGroups, 1)} guruh/ustoz` : undefined}
          onClick={() => navigate("/admin/ustozlar")}
        />
      </div>

      {/* ─── Grafiklar ─── */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="min-w-0 lg:col-span-7">
          <CardHeader
            icon="show_chart"
            title={chartTab === "revenue" ? "Tushum dinamikasi" : chartTab === "attendance" ? "Davomat trendi" : "Oʻquvchilar oʻsishi dinamikasi"}
            description={chartTab === "attendance" ? "Soʻnggi 8 hafta, haftalik davomat foizi" : "Soʻnggi 6 oy"}
            action={
              <div className="flex items-center gap-1">
                <Tabs value={chartTab} onValueChange={setChartTab} variant="segmented">
                  <TabsList>
                    <TabsTrigger value="students">Oʻquvchilar</TabsTrigger>
                    <TabsTrigger value="revenue">Tushum</TabsTrigger>
                    <TabsTrigger value="attendance">Davomat</TabsTrigger>
                  </TabsList>
                </Tabs>
                <IconButton
                  icon={tableView ? "monitoring" : "table_rows"}
                  label={tableView ? "Grafik koʻrinishi" : "Jadval koʻrinishi"}
                  size="sm"
                  onClick={() => setTableView((v) => !v)}
                />
              </div>
            }
            className="flex-col sm:flex-row"
          />
          <CardContent>
            {!d ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <>
                <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg bg-surface-container-low p-3 sm:grid-cols-3">
                  {(chartTab === "revenue"
                    ? [
                        { l: "Bu oy yigʻilgan", v: fmtMoney(k!.payments.collected) },
                        { l: `Kutilmoqda (${k!.payments.pendingCount})`, v: fmtMoney(k!.payments.pending) },
                        { l: `Muddati oʻtgan (${k!.payments.overdueCount})`, v: fmtMoney(k!.payments.overdue), danger: k!.payments.overdue > 0 },
                      ]
                    : chartTab === "attendance"
                      ? [
                          { l: "Joriy oy", v: fmtPercent(k!.attendance.monthPct) },
                          { l: "Oxirgi hafta", v: fmtPercent(lastWeek?.pct ?? null) },
                          { l: "Bu oy belgilangan", v: `${fmtNum(k!.attendance.monthMarked)} ta` },
                        ]
                      : [
                          { l: "Sof oʻsish (6 oy)", v: `${netGrowth >= 0 ? "+" : "−"}${fmtNum(Math.abs(netGrowth))} nafar${netPct != null ? ` (${netPct >= 0 ? "+" : ""}${netPct}%)` : ""}`, primary: true },
                          { l: "Bu oy yangi", v: `${fmtNum(k!.students.newThisMonth)} nafar` },
                          { l: "Bu oy ketgan", v: `${fmtNum(k!.students.leftThisMonth)} nafar` },
                        ]
                  ).map((m) => (
                    <div key={m.l} className="min-w-0">
                      <div className="truncate font-label-sm text-label-sm text-on-surface-variant">{m.l}</div>
                      <div
                        className={cn(
                          "truncate font-headline-md text-headline-md",
                          "primary" in m && m.primary ? "text-primary" : "danger" in m && m.danger ? "text-error" : "text-on-surface",
                        )}
                      >
                        {m.v}
                      </div>
                    </div>
                  ))}
                </div>
                {tableView ? (
                  <ChartTable tab={chartTab} d={d} />
                ) : chartTab === "revenue" ? (
                  <RevenueChart data={d.charts.revenue} />
                ) : chartTab === "attendance" ? (
                  <AttendanceChart data={d.charts.attendanceTrend} />
                ) : (
                  <GrowthChart data={d.charts.studentsGrowth} />
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="flex min-w-0 flex-col lg:col-span-5">
          <CardHeader icon="stacked_bar_chart" title="Level boʻyicha taqsimot" description="Faol guruhlardagi oʻquvchilar" badge={d ? <Badge>{d.charts.levels.length} yoʻnalish</Badge> : null} />
          <CardContent className="flex flex-1 flex-col">
            {!d ? (
              <Skeleton className="h-56 w-full" />
            ) : d.charts.levels.length === 0 ? (
              <EmptyState compact icon="school" title="Faol oʻquvchi yoʻq" />
            ) : (
              <>
                <div className="mb-4 flex items-baseline gap-2">
                  <span className="font-display text-[40px] font-bold leading-none text-on-surface">{fmtNum(d.charts.levelTotal)}</span>
                  <span className="text-body-md text-on-surface-variant">oʻquvchi guruhlarda</span>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {d.charts.levels.map((l) => (
                    <li key={l.id ?? "none"}>
                      <Link
                        to={l.id ? `/admin/guruhlar?level=${l.id}` : "/admin/guruhlar"}
                        className="group block rounded-lg p-1.5 transition-colors hover:bg-surface-container-low"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2 text-body-sm">
                          <span className="truncate font-label-md text-label-md text-on-surface group-hover:text-primary">{l.label}</span>
                          <span className="shrink-0 tabular-nums text-on-surface-variant">
                            <b className="text-on-surface">{fmtNum(l.students)}</b> ta · {fmtPercent(l.pct, 0)}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-primary-fixed/60">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${(l.students / maxLevel) * 100}%` }} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                {topLevel ? (
                  <div className="mt-auto flex items-center justify-between gap-2 rounded-lg bg-surface-container-low p-2.5 pt-2.5 text-body-sm">
                    <span className="text-on-surface-variant">Eng koʻp oʻquvchi:</span>
                    <span className="truncate font-label-md text-label-md text-primary">
                      {topLevel.label} ({fmtPercent(topLevel.pct, 0)})
                    </span>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Diqqat talab qiladi + lenta ─── */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="min-w-0 lg:col-span-8">
          <CardHeader
            title="Diqqat talab qiladi"
            description="Zudlik bilan administrator yechimi zarur boʻlgan operatsion holatlar"
            badge={d?.alerts.length ? <Badge tone="danger">{d.alerts.length} ta tezkor masala</Badge> : null}
          />
          {!d ? (
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          ) : d.alerts.length === 0 ? (
            <EmptyState compact icon="task_alt" title="Hammasi joyida" description="Hozircha zudlik bilan hal qilinadigan masala yoʻq" />
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Muammo / holat</TH>
                  <TH className="hidden 2xl:table-cell">Boʻlim / guruh</TH>
                  <TH>Darajasi</TH>
                  <TH className="hidden sm:table-cell">Muddati</TH>
                  <TH className="text-right">Amal</TH>
                </tr>
              </THead>
              <TBody>
                {d.alerts.map((a) => {
                  const ic = ALERT_ICON[a.kind] ?? { icon: "info", cls: "text-primary" };
                  const due = dueOf(a, now);
                  const sev = SEVERITY[a.severity];
                  return (
                    <TR key={a.id} className="hover:bg-surface-container-low/60">
                      <TD>
                        <div className="flex min-w-[220px] items-start gap-2.5">
                          <Icon name={ic.icon} size={20} className={cn("mt-0.5", ic.cls)} />
                          <div className="min-w-0">
                            <div className="font-label-lg text-label-lg text-on-surface">{a.title}</div>
                            {a.items?.length ? null : (
                              <div className="text-body-sm text-on-surface-variant">
                                {a.kind === "overdue_payments" && a.amount != null ? `Jami qarz: ${fmtMoney(a.amount)}` : a.subtitle}
                              </div>
                            )}
                            <div className="mt-0.5 text-[11px] text-on-surface-muted 2xl:hidden">
                              {a.section}
                              {a.context ? ` · ${a.context}` : ""}
                            </div>
                            {a.items?.length ? (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {a.items.slice(0, 4).map((it) => (
                                  <Link key={it.id} to={it.to} className="rounded bg-surface-container px-1.5 py-0.5 text-[11px] text-on-surface-variant hover:text-primary">
                                    {it.label}
                                  </Link>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </TD>
                      <TD className="hidden 2xl:table-cell">
                        <div className="font-label-md text-label-md">{a.section}</div>
                        {a.context ? <div className="max-w-[180px] truncate text-body-sm text-on-surface-variant">{a.context}</div> : null}
                      </TD>
                      <TD>
                        <Badge tone={sev.tone}>{sev.label}</Badge>
                      </TD>
                      <TD className="hidden max-w-[170px] sm:table-cell">
                        <span className={cn("inline-flex items-start gap-1 font-label-md text-label-md", due.cls)}>
                          {due.icon ? <Icon name={due.icon} size={14} /> : null}
                          {due.text}
                        </span>
                      </TD>
                      <TD className="text-right">
                        <Button size="sm" variant={a.severity === "high" ? "navy" : "secondary"} onClick={() => navigate(a.to)}>
                          {a.action}
                        </Button>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </Card>

        <Card className="flex min-w-0 flex-col lg:col-span-4">
          <CardHeader
            icon="history"
            title="Jonli tizim lentasi"
            action={
              <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Har daqiqada
              </span>
            }
          />
          <CardContent className="flex flex-1 flex-col">
            {!d ? (
              <Skeleton className="h-64 w-full" />
            ) : d.recentAudit.length === 0 ? (
              <p className="text-body-sm text-on-surface-muted">Hali harakat yoʻq</p>
            ) : (
              <ol className="flex flex-col gap-3.5">
                {d.recentAudit.map((e) => (
                  <li key={e.id} className="flex items-start gap-3">
                    <span className="h-fit shrink-0 rounded bg-surface-container px-1.5 py-0.5 font-label-sm text-label-sm tabular-nums text-on-surface">
                      {relDayWord(e.at, now) === "Bugun" ? fmtTime(e.at) : fmtDateShort(e.at).slice(0, 5)}
                    </span>
                    <div className="min-w-0 text-body-sm leading-tight">
                      <span className="font-semibold text-on-surface">{e.actor}</span>{" "}
                      <span className="text-on-surface">{e.summary ?? e.action}</span>
                      <div className="mt-0.5 font-label-sm text-label-sm text-on-surface-muted">{e.action}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <Link
              to="/admin/jurnal"
              className="mt-4 flex items-center justify-between rounded-lg bg-surface-container-low p-2.5 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container"
            >
              Barcha tizim jurnalini koʻrish
              <Icon name="arrow_forward" size={16} />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ─── Bugungi darslar + Telegram ─── */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <Card className="min-w-0 scroll-mt-20 lg:col-span-8" id="today-lessons">
          <CardHeader
            icon="today"
            title="Bugungi darslar"
            description={`${fmtWeekday(now)}, ${fmtDayMonth(now)}`}
            badge={d ? <Badge tone="primary">{d.todayLessons.length} ta</Badge> : null}
            action={
              <Link to="/admin/guruhlar" className={buttonVariants({ variant: "link", size: "sm" })}>
                Barcha guruhlar
              </Link>
            }
          />
          {!d ? (
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          ) : d.todayLessons.length === 0 ? (
            <EmptyState compact icon="event_available" title="Bugun dars yoʻq" />
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Vaqt</TH>
                  <TH>Guruh</TH>
                  <TH className="hidden md:table-cell">Ustoz</TH>
                  <TH className="hidden sm:table-cell">Xona</TH>
                  <TH className="text-right">Davomat</TH>
                  <TH>Holat</TH>
                </tr>
              </THead>
              <TBody>
                {d.todayLessons.map((l) => {
                  const st = l.live
                    ? { label: "Hozir davom etmoqda", tone: "primary" as Tone }
                    : l.overdue
                      ? { label: "Yakunlanmagan", tone: "warning" as Tone }
                      : LESSON_STATUS[l.status];
                  return (
                    <TR key={l.id} className="cursor-pointer hover:bg-surface-container-low" onClick={() => navigate(`/admin/guruhlar?group=${l.group.id}`)}>
                      <TD className="whitespace-nowrap font-label-lg text-label-lg tabular-nums">{fmtTimeRange(l.startsAt, l.endsAt)}</TD>
                      <TD>
                        <div className="font-label-lg text-label-lg">{l.group.name}</div>
                        <div className="text-body-sm text-on-surface-variant">{l.number ? `${l.number}-dars` : l.group.code}</div>
                      </TD>
                      <TD className="hidden md:table-cell">{l.teacher?.fullName ?? <span className="text-error">Ustoz yoʻq</span>}</TD>
                      <TD className="hidden sm:table-cell">{l.room ?? "—"}</TD>
                      <TD className="text-right tabular-nums">
                        {l.marked ? (
                          <span>
                            {l.present}/{l.students}
                          </span>
                        ) : (
                          <span className="text-body-sm text-on-surface-muted">{l.status === "CANCELLED" ? "—" : "belgilanmagan"}</span>
                        )}
                      </TD>
                      <TD>
                        <Badge tone={st.tone} dot={l.live}>
                          {st.label}
                        </Badge>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </Card>

        <div className="flex min-w-0 flex-col gap-6 lg:col-span-4">
          <Card>
            <CardHeader icon="send" title="Telegram bot qamrovi" description="Xabar va hisobotlar bot orqali boradi" />
            <CardContent className="flex flex-col gap-4">
              {!k ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <ProgressBar value={k.telegram.parentsPct ?? 0} label={`Ota-onalar: ${k.telegram.parentsLinked} / ${k.telegram.parentsTotal}`} showValue />
                  <ProgressBar value={k.telegram.studentsPct ?? 0} tone="navy" label={`Oʻquvchilar: ${k.telegram.studentsLinked} / ${k.telegram.studentsTotal}`} showValue />
                  <Link to="/admin/ota-onalar" className="text-body-sm text-primary hover:underline">
                    {k.telegram.parentsTotal - k.telegram.parentsLinked} ta ota-ona hali ulanmagan →
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader icon="receipt_long" title="Toʻlovlar holati" description={d ? `${MONTHS[np.month]} davri` : undefined} />
            <CardContent className="flex flex-col gap-2.5">
              {!k ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  {[
                    { l: `Yigʻilgan (${k.payments.collectedCount})`, v: fmtMoney(k.payments.collected), cls: "text-success", to: "/admin/tolovlar?status=PAID" },
                    { l: `Kutilmoqda (${k.payments.pendingCount})`, v: fmtMoney(k.payments.pending), cls: "text-warning", to: "/admin/tolovlar?status=PENDING" },
                    { l: `Muddati oʻtgan (${k.payments.overdueCount})`, v: fmtMoney(k.payments.overdue), cls: "text-error", to: "/admin/tolovlar?status=OVERDUE" },
                  ].map((r) => (
                    <Link key={r.l} to={r.to} className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low p-2.5 hover:bg-surface-container">
                      <span className="text-body-sm text-on-surface-variant">{r.l}</span>
                      <span className={cn("font-label-lg text-label-lg tabular-nums", r.cls)}>{r.v}</span>
                    </Link>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function ChartTable({ tab, d }: { tab: string; d: DashboardData }) {
  if (tab === "revenue") {
    return (
      <Table>
        <THead>
          <tr>
            <TH>Oy</TH>
            <TH className="text-right">Yigʻilgan</TH>
            <TH className="text-right">Kutilmoqda</TH>
            <TH className="text-right">Muddati oʻtgan</TH>
          </tr>
        </THead>
        <TBody>
          {d.charts.revenue.map((r) => (
            <TR key={r.period}>
              <TD>{r.label}</TD>
              <TD className="text-right tabular-nums">{fmtMoney(r.collected)}</TD>
              <TD className="text-right tabular-nums">{fmtMoney(r.pending)}</TD>
              <TD className="text-right tabular-nums">{fmtMoney(r.overdue)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    );
  }
  if (tab === "attendance") {
    return (
      <Table>
        <THead>
          <tr>
            <TH>Hafta</TH>
            <TH className="text-right">Davomat</TH>
            <TH className="text-right">Belgilangan</TH>
          </tr>
        </THead>
        <TBody>
          {d.charts.attendanceTrend.map((r) => (
            <TR key={r.label}>
              <TD>{r.label}</TD>
              <TD className="text-right tabular-nums">{fmtPercent(r.pct)}</TD>
              <TD className="text-right tabular-nums">{fmtNum(r.marked)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    );
  }
  return (
    <Table>
      <THead>
        <tr>
          <TH>Oy</TH>
          <TH className="text-right">Oʻquvchilar</TH>
        </tr>
      </THead>
      <TBody>
        {d.charts.studentsGrowth.map((r) => (
          <TR key={r.period}>
            <TD>{r.label}</TD>
            <TD className="text-right tabular-nums">{fmtNum(r.count)} nafar</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
