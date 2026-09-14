// Ustoz: Vazifalar va topshiriqlar markazi (mockup: urfon_vazifalar_topshiriqlar_markazi_mukammal_dizayn).
import { useMemo, useState } from "react";
import { Avatar, Badge, Button, Card, ConfirmDialog, DropdownMenu, EmptyState, Icon, IconButton, PageHeader, Select, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { avgLabel, fmtAvg, fmtNum, fmtPercent, fmtRelDateTime, fmtWeekday } from "@/lib/format";
import { useFlagParam, useSearchParamState } from "@/lib/hooks";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { INV, TB } from "./b/api";
import { HomeworkDetailDialog } from "./b/HomeworkDetailDialog";
import { HomeworkFormDialog } from "./b/HomeworkFormDialog";
import { ReviewDialog } from "./b/ReviewDialog";
import type { Homework, HwStatsSummary, HwType, Submission, SubmissionList, TeacherGroup } from "./b/types";
import { GroupChip, KpiCard, MiniLabel, QueryError, SegBar, TYPE_META, TypeChip, dueInfo, timeLeft } from "./b/ui";

type Tab = "all" | "review" | "returned" | "archive";

export default function TeacherHomeworkPage() {
  // ?t=review — bildirishnoma/dashboard havolalari shu tab'ni ochadi (FRONTEND-KONVENSIYA §8)
  const [tab, setTab] = useSearchParamState("t", "all");
  const [groupId, setGroupId] = useSearchParamState("g", "");
  const [type, setType] = useSearchParamState("type", "");
  const [status, setStatus] = useSearchParamState("st", "");
  const [reviewParam, setReviewParam] = useSearchParamState("review", "");
  const [hwParam, setHwParam] = useSearchParamState("hw", "");
  const [createOpen, setCreateOpen] = useFlagParam("new");
  const [editId, setEditId] = useState<string | null>(null);
  const [review, setReview] = useState<{ queue: string[]; startId: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filters = { groupId: groupId || undefined, type: type || undefined };
  const groupsQ = useApiQuery<TeacherGroup[]>([TB, "ann-groups"], "/teacher/announcements/groups");
  const statsQ = useApiQuery<HwStatsSummary>([TB, "hw-stats"], "/teacher/homework/stats");
  const listQ = useApiQuery<Homework[]>([TB, "homework"], "/teacher/homework", { params: { ...filters, limit: 200 } });
  const queueQ = useApiQuery<SubmissionList>([TB, "submissions", "SUBMITTED"], "/teacher/submissions", {
    params: { status: "SUBMITTED", ...filters, pageSize: 200 },
  });
  const returnedQ = useApiQuery<SubmissionList>([TB, "submissions", "RETURNED"], "/teacher/submissions", {
    params: { status: "RETURNED", ...filters, pageSize: 100 },
    enabled: tab === "returned",
  });

  const remind = useApiMutation((id: string) => api.post<{ students: number; parents: number }>(`/teacher/homework/${id}/remind`, { parents: true }), {
    success: (d) => `${d.students} ta oʻquvchiga eslatma yuborildi${d.parents ? ` (${d.parents} ta ota-ona)` : ""}`,
  });
  const del = useApiMutation((id: string) => api.delete(`/teacher/homework/${id}`), { invalidate: INV, success: "Vazifa oʻchirildi" });

  const groups = groupsQ.data ?? [];
  const queue = useMemo(() => queueQ.data?.items ?? [], [queueQ.data]);
  const queueIds = useMemo(() => queue.map((s) => s.id), [queue]);

  const { active, archived } = useMemo(() => {
    const all = listQ.data ?? [];
    const isArchived = (h: Homework) => !h.isOpen && h.stats.awaiting === 0;
    const act = all
      .filter((h) => !isArchived(h))
      .sort((a, b) => (a.isOpen === b.isOpen ? (a.isOpen ? +new Date(a.dueAt) - +new Date(b.dueAt) : +new Date(b.dueAt) - +new Date(a.dueAt)) : a.isOpen ? -1 : 1));
    return { active: act, archived: all.filter(isArchived) };
  }, [listQ.data]);

  const shown = useMemo(() => {
    if (tab === "archive") return archived;
    return active.filter((h) => (status === "open" ? h.isOpen : status === "overdue" ? !h.isOpen : status === "review" ? h.stats.awaiting > 0 : true));
  }, [tab, status, active, archived]);

  const openReview = (q: string[], startId: string) => setReview({ queue: q, startId });
  const reviewOpen = !!review || !!reviewParam;
  const closeReview = () => {
    setReview(null);
    if (reviewParam) setReviewParam(null);
  };
  const reviewQueueFor = (hwId: string) => queue.filter((s) => s.homework.id === hwId).map((s) => s.id);

  const s = statsQ.data;
  const onTimeDelta = s?.onTimeRate != null && s.onTimeRatePrev != null ? Math.round((s.onTimeRate - s.onTimeRatePrev) * 10) / 10 : null;
  const writtenAwaiting = s ? s.awaitingByType.TEXT + s.awaitingByType.FILE + s.awaitingByType.QUIZ : 0;

  const tabs: { key: Tab; label: string; count: number | undefined; hot?: boolean }[] = [
    { key: "all", label: "Barcha vazifalar", count: listQ.data ? active.length : undefined },
    { key: "review", label: "Tekshirish kutilmoqda", count: queueQ.data?.counts.SUBMITTED, hot: true },
    { key: "returned", label: "Qayta ishlashga", count: queueQ.data?.counts.RETURNED },
    { key: "archive", label: "Arxiv", count: listQ.data ? archived.length : undefined },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Bosh sahifa", to: "/ustoz" }, { label: "Vazifalar" }]}
        title="Vazifalar va topshiriqlar markazi"
        documentTitle="Vazifalar"
        subtitle="Guruhlar boʻyicha uyga vazifalarni yaratish, qabul qilish, tekshirish va oʻquvchilar faolligi monitoringi"
        actions={
          <Button icon="add_circle" onClick={() => setCreateOpen(true)} disabled={!groups.length && !groupsQ.isLoading}>
            Yangi vazifa yuklash
          </Button>
        }
      />

      {/* KPI */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Faol vazifalar"
          value={s ? fmtNum(s.activeHomework) : "—"}
          unit="ta mavjud"
          icon="assignment"
          loading={statsQ.isLoading}
          footerIcon="groups"
          footer={s ? `${s.activeGroups} ta guruh kesimida` : "—"}
          chip="Muddati ochiq"
        />
        <KpiCard
          label="Tekshirish navbatida"
          value={s ? fmtNum(s.awaiting) : "—"}
          unit="topshiriq navbatda"
          icon="pending_actions"
          accent={!!s?.awaiting}
          loading={statsQ.isLoading}
          footer={s ? `${writtenAwaiting} yozma/test, ${s.awaitingByType.AUDIO} audio` : "—"}
          chip={s ? (s.awaiting ? "Tezkor eʼtibor" : "Navbat boʻsh") : undefined}
          chipTone={s?.awaiting ? "danger" : "success"}
          onClick={() => setTab("review")}
        />
        <KpiCard
          label="Oʻz vaqtida topshirish"
          value={s?.onTimeRate != null ? fmtPercent(s.onTimeRate) : "—"}
          unit="intizom koʻrsatkichi"
          icon="timer"
          tone="success"
          loading={statsQ.isLoading}
          footerIcon={onTimeDelta != null && onTimeDelta < 0 ? "trending_down" : "trending_up"}
          footer="Oldingi 30 kunga nisbatan"
          chip={onTimeDelta != null ? `${onTimeDelta >= 0 ? "+" : "−"}${Math.abs(onTimeDelta)}%` : undefined}
          chipTone={onTimeDelta != null && onTimeDelta < 0 ? "danger" : "success"}
        />
        <KpiCard
          label="Oʻrtacha baho"
          value={s?.avgScore != null ? fmtAvg(s.avgScore) : "—"}
          unit={s?.avgScore != null ? avgLabel(s.avgScore) : undefined}
          icon="military_tech"
          tone="gold"
          loading={statsQ.isLoading}
          footerIcon="check_circle"
          footer={s ? `${fmtNum(s.reviewedTotal)} ta tekshirilgan ish` : "—"}
          chip="5 ballik tizim"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Chap ustun */}
        <section className="flex min-w-0 flex-col gap-4 lg:col-span-7 xl:col-span-8">
          <Card className="flex flex-col gap-3.5 p-4">
            <div className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1" role="tablist">
              {tabs.map((t) => {
                const on = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                      on ? "bg-primary text-on-primary shadow-xs" : "text-on-surface-variant hover:bg-surface-container-low",
                    )}
                  >
                    {t.label}
                    {t.count != null ? (
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 font-display text-[11px] font-bold tabular-nums",
                          on ? "bg-on-primary/20 text-on-primary" : t.hot && t.count ? "bg-error-container text-on-error-container" : "bg-surface-container text-on-surface-muted",
                        )}
                      >
                        {t.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-1 gap-3 border-t border-surface-container pt-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1">
                <MiniLabel>Guruh boʻyicha</MiniLabel>
                <Select
                  size="sm"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  options={[{ value: "", label: `Barcha guruhlar (${groups.length})` }, ...groups.map((g) => ({ value: g.id, label: `${g.name} (${g.code})` }))]}
                />
              </label>
              <label className="flex flex-col gap-1">
                <MiniLabel>Format boʻyicha</MiniLabel>
                <Select
                  size="sm"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  options={[{ value: "", label: "Barcha formatlar" }, ...(Object.keys(TYPE_META) as HwType[]).map((t) => ({ value: t, label: TYPE_META[t].label }))]}
                />
              </label>
              <label className="flex flex-col gap-1">
                <MiniLabel>Holat boʻyicha</MiniLabel>
                <Select
                  size="sm"
                  value={status}
                  disabled={tab !== "all"}
                  onChange={(e) => setStatus(e.target.value)}
                  options={[
                    { value: "", label: "Barcha holatlar" },
                    { value: "open", label: "Faol (muddatli)" },
                    { value: "overdue", label: "Muddat tugagan" },
                    { value: "review", label: "Tekshiruv kutilmoqda" },
                  ]}
                />
              </label>
            </div>
          </Card>

          {tab === "review" || tab === "returned" ? (
            <SubmissionColumn
              q={tab === "review" ? queueQ : returnedQ}
              returned={tab === "returned"}
              onOpen={(id) => openReview(tab === "review" ? queueIds : [id], id)}
            />
          ) : listQ.isLoading ? (
            Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)
          ) : listQ.error ? (
            <Card>
              <QueryError error={listQ.error} onRetry={() => listQ.refetch()} />
            </Card>
          ) : shown.length === 0 ? (
            <Card>
              <EmptyState
                icon={tab === "archive" ? "inventory_2" : "assignment_add"}
                title={tab === "archive" ? "Arxiv boʻsh" : "Vazifalar topilmadi"}
                description={tab === "archive" ? "Muddati tugagan va toʻliq tekshirilgan vazifalar shu yerda turadi." : "Filtrlarni oʻzgartiring yoki yangi uyga vazifa bering."}
                action={
                  tab !== "archive" ? (
                    <Button icon="add_circle" onClick={() => setCreateOpen(true)}>
                      Yangi vazifa
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            shown.map((h) => (
              <HomeworkCard
                key={h.id}
                h={h}
                onReview={() => {
                  const ids = reviewQueueFor(h.id);
                  if (ids.length) openReview(ids, ids[0]);
                }}
                onDetails={() => setHwParam(h.id)}
                onEdit={() => setEditId(h.id)}
                onDelete={() => setDeleteId(h.id)}
                onRemind={() => remind.mutate(h.id)}
                reminding={remind.isPending && remind.variables === h.id}
              />
            ))
          )}
        </section>

        {/* O'ng ustun */}
        <aside className="flex min-w-0 flex-col gap-5 lg:col-span-5 xl:col-span-4">
          <QueueCard q={queueQ} onOpen={(id) => openReview(queueIds, id)} />
          <EfficiencyCard s={s} loading={statsQ.isLoading} />
        </aside>
      </div>

      <ReviewDialog open={reviewOpen} onOpenChange={(o) => !o && closeReview()} queue={review?.queue ?? queueIds} startId={review?.startId ?? (reviewParam || null)} />
      <HomeworkFormDialog
        open={createOpen || !!editId}
        onOpenChange={(o) => {
          if (!o) {
            setCreateOpen(false);
            setEditId(null);
          }
        }}
        groups={groups}
        editId={editId}
        defaultGroupId={groupId || undefined}
      />
      <HomeworkDetailDialog
        id={hwParam || null}
        open={!!hwParam}
        onOpenChange={(o) => !o && setHwParam(null)}
        onReview={(q, id) => {
          setHwParam(null);
          openReview(q, id);
        }}
        onEdit={(id) => {
          setHwParam(null);
          setEditId(id);
        }}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Vazifa oʻchirilsinmi?"
        description="Vazifa va unga biriktirilgan fayllar butunlay oʻchiriladi. Topshiriqlar boʻlsa oʻchirib boʻlmaydi."
        confirmLabel="Oʻchirish"
        onConfirm={() => del.mutateAsync(deleteId!)}
      />
    </>
  );
}

// ---------------------------------------------------------------- vazifa kartasi

function HomeworkCard({
  h,
  onReview,
  onDetails,
  onEdit,
  onDelete,
  onRemind,
  reminding,
}: {
  h: Homework;
  onReview: () => void;
  onDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRemind: () => void;
  reminding: boolean;
}) {
  const st = h.stats;
  const due = dueInfo(h.dueAt);
  const base = Math.max(st.students, st.submitted);
  const pct = base ? Math.round((st.submitted / base) * 100) : 0;
  const full = base > 0 && st.missing === 0;
  const reviewLabel = h.type === "AUDIO" ? "Audio tekshiruv" : h.isOpen ? "Tekshirishga oʻtish" : "Tekshirish";
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-card transition-all hover:border-primary/40 hover:shadow-float">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <GroupChip group={h.group} />
            <TypeChip type={h.type} />
            {full ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-success-container px-2.5 py-1 text-[11.5px] font-bold text-on-success-container">
                <Icon name="verified" size={15} />
                100% topshirildi
              </span>
            ) : null}
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11.5px] font-bold",
              due.tone === "danger" ? "border border-error/25 bg-error-container/60 text-on-error-container" : "bg-surface-container text-on-surface",
            )}
          >
            <Icon name={due.icon} size={15} className={due.tone === "danger" ? undefined : "text-primary"} />
            {due.text}
          </span>
        </div>
        <button type="button" onClick={onDetails} className="text-left">
          <h2 className="mt-1 font-display text-[17px] font-bold text-on-surface transition-colors hover:text-primary">{h.title}</h2>
        </button>
        {h.description ? <p className="line-clamp-2 text-[13px] leading-relaxed text-on-surface-variant">{h.description}</p> : null}
      </div>

      {h.files.length || h.type === "QUIZ" ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-outline-variant/70 bg-surface-container-low px-3 py-2 text-[12px] text-on-surface-variant">
          <Icon name={h.type === "QUIZ" ? "smart_toy" : "attachment"} size={17} className={h.type === "QUIZ" ? "text-success" : "text-primary"} />
          <span className="min-w-0 flex-1 truncate">
            {h.type === "QUIZ" ? `Avtomatik test tekshiruvi: ${h.questionsCount ?? 0} ta savol` : ""}
            {h.type === "QUIZ" && h.files.length ? " · " : ""}
            {h.files.length ? `${h.files.length} ta fayl: ${h.files.map((f) => f.originalName).join(", ")}` : ""}
          </span>
        </div>
      ) : null}

      <div className="flex flex-col gap-2.5 rounded-xl border border-outline-variant/70 bg-surface-container-low p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-on-surface">
              {st.submitted}/{st.students} topshirildi <span className={cn("font-bold", full ? "text-success" : "text-primary")}>({pct}%)</span>
            </span>
            <span className="text-outline">•</span>
            <span className="font-medium text-on-surface-variant">{st.reviewed} ta tekshirildi</span>
            {st.awaiting ? (
              <>
                <span className="text-outline">•</span>
                <span className="flex items-center gap-1 font-bold text-error">
                  <Icon name="hourglass_top" size={15} />
                  {st.awaiting} ta kutmoqda
                </span>
              </>
            ) : null}
            {st.returned ? (
              <>
                <span className="text-outline">•</span>
                <span className="font-medium text-warning">{st.returned} ta qaytarilgan</span>
              </>
            ) : null}
          </div>
          <span className={cn("text-[11.5px] font-medium", full ? "font-bold text-success" : "text-on-surface-muted")}>
            {full ? "Mukammal topshirish" : h.isOpen ? timeLeft(h.dueAt) : st.late ? `${st.late} ta kechikkan` : "Muddat tugagan"}
          </span>
        </div>
        <SegBar
          total={base}
          segments={[
            { value: st.reviewed, className: full ? "bg-success" : "bg-primary", title: "Tekshirilgan" },
            { value: st.awaiting + st.returned, className: "bg-gold", title: "Kutmoqda" },
            { value: st.missing, className: "bg-outline/40", title: "Topshirmagan" },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-container pt-3">
        <div className="flex flex-wrap items-center gap-2">
          {st.awaiting ? (
            <Button size="sm" icon={h.type === "AUDIO" ? "graphic_eq" : "rate_review"} onClick={onReview}>
              {reviewLabel} ({st.awaiting})
            </Button>
          ) : (
            <Button size="sm" variant="secondary" icon="table_chart" onClick={onDetails}>
              Natijalar
            </Button>
          )}
          <Button size="sm" variant="outline" icon="description" className="text-primary" onClick={onDetails}>
            Tafsilotlar{h.files.length ? ` & Fayllar (${h.files.length})` : ""}
          </Button>
        </div>
        <div className="flex items-center gap-1">
          {h.isOpen && st.missing > 0 ? (
            <Button size="sm" variant="ghost" icon="notifications_active" loading={reminding} onClick={onRemind}>
              Eslatma yuborish
            </Button>
          ) : null}
          <DropdownMenu
            trigger={<IconButton icon="more_vert" label="Amallar" size="sm" />}
            items={[
              { label: "Tahrirlash", icon: "edit", onSelect: onEdit },
              { label: "Tafsilotlar", icon: "visibility", onSelect: onDetails },
              "separator",
              {
                label: "Oʻchirish",
                icon: "delete",
                tone: "danger",
                disabled: st.submitted > 0 || st.drafts > 0,
                description: st.submitted > 0 || st.drafts > 0 ? "Topshiriqlar bor" : undefined,
                onSelect: onDelete,
              },
            ]}
          />
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------- topshiriqlar ro'yxati (chap ustun)

function SubmissionColumn({
  q,
  returned,
  onOpen,
}: {
  q: { data?: SubmissionList; isLoading: boolean; error: Error | null; refetch: () => unknown };
  returned: boolean;
  onOpen: (id: string) => void;
}) {
  if (q.isLoading) return <>{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</>;
  if (q.error)
    return (
      <Card>
        <QueryError error={q.error} onRetry={() => q.refetch()} />
      </Card>
    );
  const items = q.data?.items ?? [];
  if (!items.length)
    return (
      <Card>
        <EmptyState
          icon="task_alt"
          title={returned ? "Qaytarilgan ishlar yoʻq" : "Tekshirish navbati boʻsh"}
          description={returned ? "Qayta ishlashga yuborilgan topshiriqlar shu yerda koʻrinadi." : "Barcha topshiriqlar tekshirilgan. Ajoyib!"}
        />
      </Card>
    );
  return (
    <Card className="divide-y divide-surface-container overflow-hidden">
      {items.map((s, i) => (
        <button key={s.id} type="button" onClick={() => onOpen(s.id)} className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-surface-container-low/70">
          <Avatar name={s.student.fullName} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-label-lg text-label-lg text-on-surface">{s.student.fullName}</span>
              <span className="text-body-sm text-on-surface-muted">{s.submittedAt ? fmtRelDateTime(s.submittedAt) : ""}</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-body-sm text-on-surface-muted">
              <span>
                {s.homework.group.name} · {s.homework.group.code}
              </span>
              {!returned ? <span>· Navbatda #{i + 1}</span> : null}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-on-surface">
              <Icon name={TYPE_META[s.homework.type].icon} size={16} className="text-primary" />
              <span className="truncate">{s.homework.title}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant">
              <SubMeta s={s} />
              {s.isLate ? <Badge tone="warning">Kechikkan</Badge> : null}
            </div>
            {returned && s.feedback ? <p className="mt-1.5 line-clamp-2 text-body-sm italic text-on-surface-variant">“{s.feedback}”</p> : null}
          </div>
          <Icon name="chevron_right" className="mt-2 text-outline" />
        </button>
      ))}
    </Card>
  );
}

function SubMeta({ s }: { s: Submission }) {
  const parts: string[] = [];
  if (s.text) parts.push(`${s.wordCount} soʻz`);
  const audio = s.files.filter((f) => f.mime.startsWith("audio/")).length;
  const other = s.files.length - audio;
  if (audio) parts.push(`${audio} ta audio`);
  if (other) parts.push(`${other} ta fayl`);
  if (s.quiz) parts.push(`Test: ${s.quiz.correct}/${s.quiz.total} (${s.quiz.percent}%)`);
  return <span>{parts.join(" • ") || "Javob"}</span>;
}

// ---------------------------------------------------------------- o'ng ustun

function QueueCard({ q, onOpen }: { q: { data?: SubmissionList; isLoading: boolean; error: Error | null; refetch: () => unknown }; onOpen: (id: string) => void }) {
  const items = q.data?.items ?? [];
  const total = q.data?.counts.SUBMITTED ?? items.length;
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={cn("h-2.5 w-2.5 rounded-full", total ? "animate-pulse bg-error" : "bg-success")} />
          <h2 className="font-display text-[16px] font-bold text-on-surface">Tezkor tekshiruv navbati</h2>
        </div>
        {total ? (
          <Badge tone="danger" shape="square">
            {total} ta kutilmoqda
          </Badge>
        ) : null}
      </div>
      <p className="-mt-2 text-[12px] leading-snug text-on-surface-variant">Oʻquvchilar tomonidan eng soʻnggi topshirilgan ishlar. Tezroq javob — kuchliroq motivatsiya.</p>
      {q.isLoading ? (
        Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
      ) : q.error ? (
        <QueryError error={q.error} onRetry={() => q.refetch()} compact />
      ) : !items.length ? (
        <EmptyState compact icon="task_alt" title="Navbat boʻsh" description="Barcha topshiriqlar tekshirilgan." />
      ) : (
        items.slice(0, 4).map((s, i) => (
          <div key={s.id} className="flex flex-col gap-3 rounded-xl border border-outline-variant/70 bg-surface-container-low p-3.5 transition-colors hover:border-primary/40">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={s.student.fullName} size="md" className="h-10 w-10 ring-1 ring-outline-variant" />
                <div className="min-w-0">
                  <div className="truncate font-display text-[13px] font-bold leading-snug text-on-surface">{s.student.fullName}</div>
                  <div className="truncate text-[11px] font-medium text-on-surface-muted">
                    {s.homework.group.name} · {s.homework.group.code}
                  </div>
                </div>
              </div>
              <span className={cn("shrink-0 rounded px-2 py-0.5 font-display text-[10.5px] font-bold", i < 2 ? "bg-surface-container-highest text-primary" : "bg-surface-container text-on-surface-muted")}>
                {s.submittedAt ? fmtRelDateTime(s.submittedAt) : ""}
              </span>
            </div>
            <div className="flex flex-col gap-1 pl-1">
              <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-on-surface">
                <Icon name={TYPE_META[s.homework.type].icon} size={16} className="shrink-0 text-primary" />
                <span className="truncate">{s.homework.title}</span>
              </div>
              <span className="text-[11.5px] text-on-surface-variant">
                <SubMeta s={s} />
                {s.isLate ? " • kechikkan" : ""}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-outline-variant/50 pt-2">
              {i === 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-error">
                  <span className="h-1.5 w-1.5 rounded-full bg-error" />
                  Tekshirish kutilmoqda
                </span>
              ) : (
                <span className="text-[11px] font-medium text-on-surface-muted">Navbatda: #{i + 1}</span>
              )}
              <Button size="sm" variant={i === 0 ? "primary" : "outline"} icon={s.homework.type === "AUDIO" ? "headset" : "grading"} onClick={() => onOpen(s.id)} className={i === 0 ? undefined : "text-primary"}>
                {s.homework.type === "AUDIO" ? "Tinglash va baholash" : "Tekshirish"}
              </Button>
            </div>
          </div>
        ))
      )}
      {items.length ? (
        <Button size="lg" block icon="queue_play_next" onClick={() => onOpen(items[0].id)}>
          Barcha {total} ta ishni ketma-ket tekshirish
        </Button>
      ) : null}
    </Card>
  );
}

function EfficiencyCard({ s, loading }: { s?: HwStatsSummary; loading: boolean }) {
  const days = s?.reviewedByDay ?? [];
  const max = Math.max(1, ...days.map((d) => d.count));
  const week = days.reduce((a, d) => a + d.count, 0);
  const planPct = s && s.todayTarget ? Math.round((s.reviewedToday / s.todayTarget) * 100) : 0;
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2">
        <Icon name="speed" size={20} className="text-primary" />
        <h3 className="font-display text-[15.5px] font-bold text-on-surface">Tekshiruv samaradorligi</h3>
      </div>
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 rounded-xl border border-outline-variant/60 bg-surface-container-low p-3">
              <MiniLabel>Oʻrtacha tezlik</MiniLabel>
              <span className="font-display text-[22px] font-extrabold text-primary">{s?.avgReviewHours != null ? `${fmtNum(s.avgReviewHours)} soat` : "—"}</span>
              <span className="text-[11px] text-on-surface-variant">topshirilgandan bahogacha</span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-outline-variant/60 bg-surface-container-low p-3">
              <MiniLabel>Bugungi reja</MiniLabel>
              <span className="font-display text-[22px] font-extrabold text-on-surface">
                {s?.reviewedToday ?? 0} / {s?.todayTarget ?? 0} ta
              </span>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                <div className="h-full rounded-full bg-primary" style={{ width: `${planPct}%` }} />
              </div>
              <span className="mt-0.5 text-[11px] font-bold text-primary">{planPct}% bajarildi</span>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-low p-3.5">
            <div className="flex items-center justify-between text-[11.5px] font-semibold">
              <span className="text-on-surface">Oxirgi 7 kunda tekshirilgan ishlar</span>
              <span className="font-bold text-primary">Jami: {week} ta</span>
            </div>
            <div className="flex h-24 items-end justify-between gap-1 px-1 pt-5">
              {days.map((d, i) => {
                const today = i === days.length - 1;
                const h = d.count ? Math.max(6, Math.round((d.count / max) * 56)) : 3;
                return (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold tabular-nums text-on-surface-muted">{d.count || ""}</span>
                    <div
                      className={cn("w-6 rounded-t", today ? "bg-primary" : d.count ? "bg-primary/40" : "bg-surface-container-high")}
                      style={{ height: h }}
                      title={`${fmtWeekday(`${d.date}T12:00:00+05:00`)}: ${d.count} ta`}
                    />
                    <span className={cn("text-[10px] font-medium", today ? "font-bold text-primary" : "text-on-surface-muted")}>{fmtWeekday(`${d.date}T12:00:00+05:00`, true)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {s && s.coinsOnTime ? (
            <div className="flex items-start gap-2 text-[11.5px] leading-snug text-on-surface-muted">
              <Icon name="toll" size={17} className="shrink-0 text-tertiary" />
              <span>Oʻz vaqtida topshirilgan har bir vazifa tekshirilganda oʻquvchiga +{s.coinsOnTime} kumush tanga beriladi.</span>
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
}
