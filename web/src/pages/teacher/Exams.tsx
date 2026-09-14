// Ustoz: Mock imtihonlar — o'z guruhlari imtihonlari (yaratish, natija kiritish) va markaz imtihonlari (faqat ko'rish).
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  Dialog,
  DropdownMenu,
  EmptyState,
  Field,
  Icon,
  IconButton,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { MONTHS, fmtNum, fmtRelDay, fmtTimeRange, fmtWeekday, relDayWord, tzParts } from "@/lib/format";
import { useFlagParam, useSearchParamState } from "@/lib/hooks";
import { useApiMutation, useApiQuery } from "@/lib/query";
import type { Tone } from "@/lib/types";
import { INV, TB } from "./b/api";
import type { Exam, ExamDetail, ExamResultValues, ExamType, TeacherGroup } from "./b/types";
import { GroupChip, KpiCard, MiniLabel, QueryError, defaultDue, fromLocalInput, toLocalInput, whenLabel } from "./b/ui";

const TYPE_LABEL: Record<ExamType, string> = { MOCK: "Mock imtihon", MIDTERM: "Oraliq imtihon", FINAL: "Yakuniy imtihon", QUIZ: "Test" };
const TYPE_TONE: Record<ExamType, Tone> = { MOCK: "navy", MIDTERM: "primary", FINAL: "gold", QUIZ: "success" };

/** IELTS umumiy band: 4 ko'nikma o'rtachasi, eng yaqin 0.5 ga (x.25 → x.5, x.75 → x+1). */
export function ieltsOverall(vals: number[]) {
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 2 + 1e-9) / 2;
}
const fmtBand = (v: number | null | undefined) => (v == null ? "—" : fmtNum(v, 1));

export default function TeacherExamsPage() {
  const [tab, setTab] = useSearchParamState("t", "upcoming");
  const [groupId, setGroupId] = useSearchParamState("g", "");
  const [examParam, setExamParam] = useSearchParamState("exam", "");
  const [createOpen, setCreateOpen] = useFlagParam("new");
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [deleteExam, setDeleteExam] = useState<Exam | null>(null);

  const groupsQ = useApiQuery<TeacherGroup[]>([TB, "ann-groups"], "/teacher/announcements/groups");
  const listQ = useApiQuery<Exam[]>([TB, "exams"], "/teacher/exams", { params: { scope: "all", groupId: groupId || undefined } });
  const del = useApiMutation((id: string) => api.delete(`/teacher/exams/${id}`), { invalidate: INV, success: "Imtihon oʻchirildi" });

  const groups = groupsQ.data ?? [];
  const { upcoming, past } = useMemo(() => {
    const all = listQ.data ?? [];
    return {
      upcoming: all.filter((e) => e.status !== "past").sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt)),
      past: all.filter((e) => e.status === "past").sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt)),
    };
  }, [listQ.data]);
  const shown = tab === "past" ? past : tab === "all" ? [...upcoming, ...past] : upcoming;

  const pendingResults = past.filter((e) => e.canEdit && e.resultsCount < e.candidates);
  const mockBands = past.filter((e) => e.type === "MOCK" && e.avgBand != null).slice(0, 5);
  const avgBand = mockBands.length ? ieltsOverall(mockBands.map((e) => e.avgBand!)) : null;
  const resultsTotal = (listQ.data ?? []).reduce((a, e) => a + e.resultsCount, 0);
  const next = upcoming[0];
  const loading = listQ.isLoading;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Bosh sahifa", to: "/ustoz" }, { label: "Mock imtihonlar" }]}
        title="Mock imtihonlar"
        subtitle="Guruhlaringiz imtihonlarini rejalashtirish, natijalarni kiritish va ota-onalarga yetkazish"
        actions={
          <Button icon="add_circle" onClick={() => setCreateOpen(true)} disabled={!groups.length && !groupsQ.isLoading}>
            Yangi imtihon
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Kelgusi imtihonlar"
          value={fmtNum(upcoming.length)}
          unit="ta rejalashtirilgan"
          icon="event_upcoming"
          loading={loading}
          footerIcon="schedule"
          footer={next ? `Eng yaqini: ${whenLabel(next.startsAt)}` : "Rejalashtirilmagan"}
        />
        <KpiCard
          label="Natija kutilmoqda"
          value={fmtNum(pendingResults.length)}
          unit="ta imtihon"
          icon="pending_actions"
          accent={pendingResults.length > 0}
          loading={loading}
          footer="Oʻtgan imtihonlar natijasi"
          chip={pendingResults.length ? "Kiritish kerak" : "Hammasi kiritilgan"}
          chipTone={pendingResults.length ? "danger" : "success"}
          onClick={pendingResults.length ? () => setTab("past") : undefined}
        />
        <KpiCard
          label="Oʻrtacha band"
          value={fmtBand(avgBand)}
          unit="IELTS"
          icon="military_tech"
          tone="gold"
          loading={loading}
          footerIcon="insights"
          footer={mockBands.length ? `Oxirgi ${mockBands.length} ta Mock imtihon` : "Mock natijalari yoʻq"}
        />
        <KpiCard
          label="Kiritilgan natijalar"
          value={fmtNum(resultsTotal)}
          unit="ta oʻquvchi"
          icon="fact_check"
          tone="success"
          loading={loading}
          footer={`${past.length} ta oʻtgan imtihon`}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section className="flex min-w-0 flex-col gap-4 lg:col-span-8">
          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="scrollbar-none flex items-center gap-1 overflow-x-auto rounded-lg bg-surface-container-low p-1" role="tablist">
              {[
                { key: "upcoming", label: "Kelgusi", count: upcoming.length },
                { key: "past", label: "Oʻtgan", count: past.length },
                { key: "all", label: "Barchasi", count: upcoming.length + past.length },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 font-label-md text-label-md transition-colors",
                    tab === t.key ? "bg-surface-container-lowest text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface",
                  )}
                >
                  {t.label}
                  {!loading ? <span className="rounded-full bg-surface-container px-1.5 text-[11px] tabular-nums">{t.count}</span> : null}
                </button>
              ))}
            </div>
            <label className="flex min-w-0 flex-col gap-1 sm:w-72">
              <MiniLabel>Guruh boʻyicha</MiniLabel>
              <Select
                size="sm"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                options={[{ value: "", label: "Barcha guruhlar va markaz" }, ...groups.map((g) => ({ value: g.id, label: `${g.name} (${g.code})` }))]}
              />
            </label>
          </Card>

          {loading ? (
            Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)
          ) : listQ.error ? (
            <Card>
              <QueryError error={listQ.error} onRetry={() => listQ.refetch()} />
            </Card>
          ) : !shown.length ? (
            <Card>
              <EmptyState
                icon="quiz"
                title={tab === "past" ? "Oʻtgan imtihonlar yoʻq" : "Kelgusi imtihonlar yoʻq"}
                description="Guruhingiz uchun Mock imtihon yoki test rejalashtiring — oʻquvchi va ota-onalarga xabar boradi."
                action={
                  <Button icon="add_circle" onClick={() => setCreateOpen(true)}>
                    Yangi imtihon
                  </Button>
                }
              />
            </Card>
          ) : (
            shown.map((e) => (
              <ExamCard key={e.id} e={e} onResults={() => setExamParam(e.id)} onEdit={() => setEditExam(e)} onDelete={() => setDeleteExam(e)} />
            ))
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-5 lg:col-span-4">
          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-[15.5px] font-bold text-on-surface">
              <Icon name="calendar_month" size={20} className="text-primary" />
              Yaqin kunlar
            </h2>
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : upcoming.length ? (
              <ul className="space-y-2.5">
                {upcoming.slice(0, 5).map((e) => (
                  <li key={e.id}>
                    <button type="button" onClick={() => setExamParam(e.id)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-surface-container-low">
                      <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-container">
                        <span className="font-display text-[15px] font-extrabold leading-none text-on-surface">{tzParts(e.startsAt).day}</span>
                        <span className="text-[10px] font-semibold text-on-surface-muted">{MONTHS[tzParts(e.startsAt).month].slice(0, 3)}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-label-lg text-label-lg text-on-surface">{e.title}</span>
                        <span className="block truncate text-body-sm text-on-surface-muted">
                          {fmtRelDay(e.startsAt)}, {fmtTimeRange(e.startsAt, e.endsAt)} · {e.group?.name ?? "Markaz"}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body-md text-on-surface-muted">Yaqin kunlarda imtihon yoʻq.</p>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="mb-2 flex items-center gap-2 font-display text-[15.5px] font-bold text-on-surface">
              <Icon name="calculate" size={20} className="text-primary" />
              Umumiy band qanday hisoblanadi
            </h2>
            <p className="text-body-sm leading-relaxed text-on-surface-variant">
              Listening, Reading, Writing va Speaking ballari kiritilsa, umumiy band avtomatik hisoblanadi: toʻrttasining oʻrtachasi eng yaqin 0.5 ga
              yaxlitlanadi (6.25 → 6.5, 6.75 → 7.0, 6.125 → 6.0). Natija saqlangach, ota-onaga Telegram orqali yuboriladi.
            </p>
          </Card>
        </aside>
      </div>

      <ExamFormDialog
        open={createOpen || !!editExam}
        onOpenChange={(o) => {
          if (!o) {
            setCreateOpen(false);
            setEditExam(null);
          }
        }}
        groups={groups}
        exam={editExam}
        defaultGroupId={groupId || undefined}
      />
      <ExamResultsDialog id={examParam || null} open={!!examParam} onOpenChange={(o) => !o && setExamParam(null)} />
      <ConfirmDialog
        open={!!deleteExam}
        onOpenChange={(o) => !o && setDeleteExam(null)}
        title="Imtihon oʻchirilsinmi?"
        description={deleteExam ? `“${deleteExam.title}” rejadan olib tashlanadi.` : undefined}
        confirmLabel="Oʻchirish"
        onConfirm={() => del.mutateAsync(deleteExam!.id)}
      />
    </>
  );
}

// ---------------------------------------------------------------- imtihon kartasi

function ExamCard({ e, onResults, onEdit, onDelete }: { e: Exam; onResults: () => void; onEdit: () => void; onDelete: () => void }) {
  const p = tzParts(e.startsAt);
  const done = e.candidates > 0 && e.resultsCount >= e.candidates;
  const statusBadge =
    e.status === "ongoing" ? (
      <Badge tone="danger" dot>
        Hozir davom etmoqda
      </Badge>
    ) : e.status === "upcoming" ? (
      <Badge tone="primary" icon="schedule">
        {relDayWord(e.startsAt) ?? "Kelgusi"}
      </Badge>
    ) : done ? (
      <Badge tone="success" icon="task_alt">
        Natijalar kiritilgan
      </Badge>
    ) : e.canEdit ? (
      <Badge tone="warning" icon="pending">
        Natija kutilmoqda
      </Badge>
    ) : (
      <Badge tone="neutral">Oʻtgan</Badge>
    );
  const avg = e.avgBand != null ? `Oʻrtacha band ${fmtBand(e.avgBand)}` : e.avgPercent != null ? `Oʻrtacha ${fmtNum(e.avgPercent)}%` : null;
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-card transition-all hover:border-primary/40 hover:shadow-float sm:flex-row">
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-container">
        <span className="font-display text-[22px] font-extrabold leading-none text-on-surface">{p.day}</span>
        <span className="mt-0.5 text-[11px] font-semibold text-on-surface-muted">
          {MONTHS[p.month].slice(0, 3)} · {fmtWeekday(e.startsAt, true)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={TYPE_TONE[e.type]} shape="square">
            {TYPE_LABEL[e.type]}
          </Badge>
          {e.group ? (
            <GroupChip group={e.group} />
          ) : (
            <Badge tone="gold" shape="square" icon="apartment">
              Markaz imtihoni
            </Badge>
          )}
          {statusBadge}
        </div>
        <h2 className="mt-2 font-display text-[17px] font-bold text-on-surface">{e.title}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-on-surface-variant">
          <span className="inline-flex items-center gap-1">
            <Icon name="schedule" size={16} className="text-primary" />
            {fmtRelDay(e.startsAt)}, {fmtTimeRange(e.startsAt, e.endsAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="timer" size={16} className="text-primary" />
            {e.durationMin} daqiqa
          </span>
          {e.location ? (
            <span className="inline-flex items-center gap-1">
              <Icon name="location_on" size={16} className="text-primary" />
              {e.location}
            </span>
          ) : null}
        </div>
        {e.description ? <p className="mt-2 line-clamp-2 text-body-sm text-on-surface-variant">{e.description}</p> : null}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-surface-container pt-3">
          <span className="text-body-sm text-on-surface-variant">
            <span className="font-semibold text-on-surface">
              {e.resultsCount}/{e.candidates}
            </span>{" "}
            {e.isCenter ? "oʻquvchingiz natijasi" : "natija kiritilgan"}
            {avg ? <span className="ml-2 font-semibold text-primary">· {avg}</span> : null}
          </span>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant={e.canEdit && e.status !== "upcoming" && !done ? "primary" : "secondary"} icon={e.canEdit ? "edit_note" : "visibility"} onClick={onResults}>
              {e.canEdit ? (done ? "Natijalar" : "Natijalarni kiritish") : "Natijalarni koʻrish"}
            </Button>
            {e.canEdit ? (
              <DropdownMenu
                trigger={<IconButton icon="more_vert" label="Amallar" size="sm" />}
                items={[
                  { label: "Tahrirlash", icon: "edit", onSelect: onEdit },
                  "separator",
                  {
                    label: "Oʻchirish",
                    icon: "delete",
                    tone: "danger",
                    disabled: e.resultsCount > 0,
                    description: e.resultsCount > 0 ? "Natijalar kiritilgan" : undefined,
                    onSelect: onDelete,
                  },
                ]}
              />
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------- yaratish / tahrirlash

function ExamFormDialog({
  open,
  onOpenChange,
  groups,
  exam,
  defaultGroupId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  groups: TeacherGroup[];
  exam: Exam | null;
  defaultGroupId?: string;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={exam ? "Imtihonni tahrirlash" : "Yangi imtihon"}
      description={exam ? undefined : "Oʻquvchilar va ota-onalarga sana va joy haqida xabar yuboriladi"}
      size="lg"
    >
      {open ? <ExamForm key={exam?.id ?? "new"} groups={groups} exam={exam} defaultGroupId={defaultGroupId} onDone={() => onOpenChange(false)} /> : null}
    </Dialog>
  );
}

function ExamForm({ groups, exam, defaultGroupId, onDone }: { groups: TeacherGroup[]; exam: Exam | null; defaultGroupId?: string; onDone: () => void }) {
  const [groupId, setGroupId] = useState(exam?.group?.id ?? defaultGroupId ?? (groups.length === 1 ? groups[0].id : ""));
  const [title, setTitle] = useState(exam?.title ?? "");
  const [type, setType] = useState<ExamType>(exam?.type ?? "MOCK");
  const [startsAt, setStartsAt] = useState(exam ? toLocalInput(exam.startsAt) : defaultDue("09:00", 3));
  const [duration, setDuration] = useState(String(exam?.durationMin ?? 180));
  const [location, setLocation] = useState(exam?.location ?? "");
  const [description, setDescription] = useState(exam?.description ?? "");
  const [notify, setNotify] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = useApiMutation(
    (body: Record<string, unknown>) => (exam ? api.put<Exam>(`/teacher/exams/${exam.id}`, body) : api.post<Exam>("/teacher/exams", body)),
    { invalidate: INV },
  );

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!groupId) e.group = "Guruhni tanlang";
    if (title.trim().length < 2) e.title = "Nomi kamida 2 belgi";
    if (!startsAt) e.startsAt = "Sana va vaqtni kiriting";
    const d = Number(duration);
    if (!Number.isInteger(d) || d < 10 || d > 600) e.duration = "10 dan 600 daqiqagacha";
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = {
      title: title.trim(),
      type,
      startsAt: fromLocalInput(startsAt).toISOString(),
      durationMin: d,
      location: location.trim() || null,
      description: description.trim() || null,
      ...(exam ? {} : { groupId, notify }),
    };
    await save.mutateAsync(body);
    toast.success(exam ? "Imtihon yangilandi" : "Imtihon rejalashtirildi", {
      description: !exam && notify && fromLocalInput(startsAt).getTime() > Date.now() ? "Oʻquvchi va ota-onalarga xabar yuborildi" : undefined,
    });
    onDone();
  };

  const future = startsAt ? fromLocalInput(startsAt).getTime() > Date.now() : false;
  return (
    <form
      className="space-y-4"
      onSubmit={(ev) => {
        ev.preventDefault();
        void submit().catch(() => {});
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Guruh" required error={errors.group}>
          <Select
            value={groupId}
            disabled={!!exam}
            onChange={(ev) => setGroupId(ev.target.value)}
            placeholder="Guruhni tanlang…"
            options={groups.map((g) => ({ value: g.id, label: `${g.name} (${g.code})` }))}
          />
        </Field>
        <Field label="Turi">
          <Select value={type} onChange={(ev) => setType(ev.target.value as ExamType)} options={(Object.keys(TYPE_LABEL) as ExamType[]).map((t) => ({ value: t, label: TYPE_LABEL[t] }))} />
        </Field>
      </div>
      <Field label="Nomi" required error={errors.title}>
        <Input value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder="Masalan: Mini Mock imtihon (Unit 6)" maxLength={200} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Boshlanish" required error={errors.startsAt} hint="Toshkent vaqti" className="sm:col-span-2">
          <Input type="datetime-local" value={startsAt} onChange={(ev) => setStartsAt(ev.target.value)} />
        </Field>
        <Field label="Davomiyligi" required error={errors.duration}>
          <Input type="number" inputMode="numeric" min={10} max={600} step={5} value={duration} onChange={(ev) => setDuration(ev.target.value)} rightSlot={<span className="pr-2 text-body-sm">daq</span>} />
        </Field>
      </div>
      <Field label="Joy">
        <Input value={location} onChange={(ev) => setLocation(ev.target.value)} placeholder="Masalan: 204-xona yoki Katta zal" maxLength={200} />
      </Field>
      <Field label="Izoh">
        <Textarea rows={3} value={description} onChange={(ev) => setDescription(ev.target.value)} placeholder="Qaysi boʻlimlar, nima olib kelish kerak…" maxLength={3000} />
      </Field>
      {!exam ? (
        <Checkbox
          checked={notify && future}
          disabled={!future}
          onChange={(ev) => setNotify(ev.target.checked)}
          label="Oʻquvchilar va ota-onalarga xabar yuborish"
          description={future ? "Ota-onalar Telegram bot orqali oladi" : "Oʻtgan sana uchun xabar yuborilmaydi"}
        />
      ) : null}
      <div className="flex flex-wrap justify-end gap-2 border-t border-outline-variant pt-4">
        <Button variant="ghost" onClick={onDone} disabled={save.isPending}>
          Bekor qilish
        </Button>
        <Button type="submit" icon="event_available" loading={save.isPending}>
          {exam ? "Saqlash" : "Rejalashtirish"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- natijalar

type Cell = Record<"listening" | "reading" | "writing" | "speaking" | "band" | "percent" | "comment", string>;
const SKILLS = [
  { key: "listening", label: "L", full: "Listening" },
  { key: "reading", label: "R", full: "Reading" },
  { key: "writing", label: "W", full: "Writing" },
  { key: "speaking", label: "S", full: "Speaking" },
] as const;

const str = (v: number | null | undefined) => (v == null ? "" : String(v));
const toCell = (r: ExamResultValues | null): Cell => ({
  listening: str(r?.listening),
  reading: str(r?.reading),
  writing: str(r?.writing),
  speaking: str(r?.speaking),
  band: str(r?.band),
  percent: str(r?.percent),
  comment: r?.comment ?? "",
});
const num = (s: string) => (s.trim() === "" ? null : Number(s.trim().replace(",", ".")));
const bandOk = (s: string) => {
  const v = num(s);
  return v == null || (Number.isFinite(v) && v >= 0 && v <= 9 && Number.isInteger(v * 2));
};
const pctOk = (s: string) => s.trim() === "" || (/^\d{1,3}$/.test(s.trim()) && Number(s) <= 100);

function overallOf(c: Cell): number | null {
  const skills = SKILLS.map((k) => num(c[k.key]));
  if (skills.every((v) => v != null) && SKILLS.every((k) => bandOk(c[k.key]))) return ieltsOverall(skills as number[]);
  return bandOk(c.band) ? num(c.band) : null;
}
const allSkills = (c: Cell) => SKILLS.every((k) => c[k.key].trim() !== "");

function ExamResultsDialog({ id, open, onOpenChange }: { id: string | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const q = useApiQuery<ExamDetail>([TB, "exam", id], id ? `/teacher/exams/${id}` : null, { enabled: open });
  const e = q.data;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      title={e?.title ?? "Natijalar"}
      description={e ? `${TYPE_LABEL[e.type]} · ${e.group?.name ?? "Markaz imtihoni"} · ${fmtRelDay(e.startsAt)}, ${fmtTimeRange(e.startsAt, e.endsAt)}` : undefined}
      bodyClassName="p-0 sm:p-0"
    >
      {q.isLoading ? (
        <div className="space-y-2 p-5">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : q.error ? (
        <QueryError error={q.error} onRetry={() => q.refetch()} compact />
      ) : e ? (
        <ResultsGrid key={`${e.id}-${q.dataUpdatedAt}`} exam={e} onDone={() => onOpenChange(false)} />
      ) : null}
    </Dialog>
  );
}

function ResultsGrid({ exam, onDone }: { exam: ExamDetail; onDone: () => void }) {
  const mock = exam.type === "MOCK";
  const readOnly = !exam.canEdit;
  const initial = useMemo(() => Object.fromEntries(exam.rows.map((r) => [r.student.id, toCell(r.result)])) as Record<string, Cell>, [exam]);
  const [cells, setCells] = useState<Record<string, Cell>>(initial);
  const [notify, setNotify] = useState(true);

  const save = useApiMutation(
    (items: Record<string, unknown>[]) => api.put<{ saved: number; removed: number; unchanged: number }>(`/teacher/exams/${exam.id}/results`, { items, notify }),
    { invalidate: INV },
  );

  const set = (sid: string, key: keyof Cell, v: string) => setCells((c) => ({ ...c, [sid]: { ...c[sid], [key]: v } }));
  const dirty = exam.rows.filter((r) => JSON.stringify(cells[r.student.id]) !== JSON.stringify(initial[r.student.id]));
  const invalid = exam.rows.some((r) => {
    const c = cells[r.student.id];
    return !SKILLS.every((k) => bandOk(c[k.key])) || !bandOk(c.band) || !pctOk(c.percent);
  });

  const submit = async () => {
    const items = dirty.map((r) => {
      const c = cells[r.student.id];
      return {
        studentId: r.student.id,
        listening: num(c.listening),
        reading: num(c.reading),
        writing: num(c.writing),
        speaking: num(c.speaking),
        band: overallOf(c),
        percent: c.percent.trim() === "" ? null : Number(c.percent),
        comment: c.comment.trim() || null,
      };
    });
    const res = await save.mutateAsync(items);
    toast.success(`${res.saved} ta natija saqlandi${res.removed ? `, ${res.removed} ta oʻchirildi` : ""}`, {
      description: notify && res.saved ? "Ota-onalarga Telegram orqali yuborildi" : undefined,
    });
    onDone();
  };

  // guruh o'rtachasi
  const avgOf = (vals: (number | null)[]) => {
    const xs = vals.filter((v): v is number => v != null && Number.isFinite(v));
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  };
  const colAvg = (key: keyof Cell) => avgOf(exam.rows.map((r) => (bandOk(cells[r.student.id][key]) ? num(cells[r.student.id][key]) : null)));
  const overallAvg = avgOf(exam.rows.map((r) => overallOf(cells[r.student.id])));
  const pctAvg = avgOf(exam.rows.map((r) => (pctOk(cells[r.student.id].percent) ? num(cells[r.student.id].percent) : null)));

  if (!exam.rows.length) return <EmptyState compact icon="group_off" title="Oʻquvchilar yoʻq" description="Bu imtihonga tegishli oʻquvchi topilmadi." />;

  return (
    <div className="flex flex-col">
      {readOnly ? (
        <div className="px-5 pt-5 sm:px-6">
          <Alert tone="primary" icon="apartment" title="Markaz imtihoni">
            Natijalarni administrator kiritadi. Bu yerda faqat oʻz oʻquvchilaringiz natijalari koʻrinadi.
          </Alert>
        </div>
      ) : null}
      <div className="overflow-x-auto px-2 py-4 sm:px-4">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-body-md">
          <thead>
            <tr className="font-label-md text-label-md uppercase tracking-wider text-on-surface-muted">
              <th className="sticky left-0 z-10 bg-surface-container-lowest px-3 py-2 text-left">Oʻquvchi</th>
              {mock
                ? SKILLS.map((k) => (
                    <th key={k.key} className="px-1.5 py-2 text-center" title={k.full}>
                      {k.label}
                    </th>
                  ))
                : null}
              <th className="px-1.5 py-2 text-center">{mock ? "Umumiy" : "Band"}</th>
              {!mock ? <th className="px-1.5 py-2 text-center">Foiz</th> : null}
              <th className="px-3 py-2 text-left">Izoh</th>
            </tr>
          </thead>
          <tbody>
            {exam.rows.map((r) => {
              const c = cells[r.student.id];
              const auto = mock && allSkills(c) && SKILLS.every((k) => bandOk(c[k.key]));
              const ov = overallOf(c);
              const changed = JSON.stringify(c) !== JSON.stringify(initial[r.student.id]);
              return (
                <tr key={r.student.id} className={cn(changed && "bg-primary-light/60")}>
                  <td className={cn("sticky left-0 z-10 border-t border-surface-container px-3 py-2", changed ? "bg-primary-light" : "bg-surface-container-lowest")}>
                    <span className="flex items-center gap-2.5">
                      <Avatar name={r.student.fullName} size="sm" />
                      <span className="min-w-0">
                        <span className="block max-w-[180px] truncate font-medium text-on-surface">{r.student.fullName}</span>
                        <span className="block text-[11px] text-on-surface-muted">
                          {exam.isCenter ? r.group.name : r.student.code ? `#${r.student.code}` : ""}
                          {!r.active ? " · guruhdan chiqqan" : ""}
                        </span>
                      </span>
                    </span>
                  </td>
                  {mock
                    ? SKILLS.map((k) => (
                        <td key={k.key} className="border-t border-surface-container px-1 py-2 text-center">
                          {readOnly ? (
                            <span className="tabular-nums">{fmtBand(num(c[k.key]))}</span>
                          ) : (
                            <Input
                              size="sm"
                              inputMode="decimal"
                              aria-label={`${r.student.fullName} — ${k.full}`}
                              value={c[k.key]}
                              invalid={!bandOk(c[k.key])}
                              onChange={(ev) => set(r.student.id, k.key, ev.target.value)}
                              className="w-14 px-1 text-center tabular-nums"
                              placeholder="—"
                            />
                          )}
                        </td>
                      ))
                    : null}
                  <td className="border-t border-surface-container px-1 py-2 text-center">
                    {readOnly || auto ? (
                      <span
                        className={cn(
                          "inline-flex min-w-12 justify-center rounded-md px-2 py-1 font-display text-[14px] font-bold tabular-nums",
                          ov != null ? "bg-primary-fixed text-primary" : "text-on-surface-muted",
                        )}
                        title={auto ? "Avtomatik hisoblandi" : undefined}
                      >
                        {fmtBand(ov)}
                      </span>
                    ) : (
                      <Input
                        size="sm"
                        inputMode="decimal"
                        aria-label={`${r.student.fullName} — umumiy band`}
                        value={c.band}
                        invalid={!bandOk(c.band)}
                        onChange={(ev) => set(r.student.id, "band", ev.target.value)}
                        className="w-16 px-1 text-center tabular-nums"
                        placeholder="—"
                      />
                    )}
                  </td>
                  {!mock ? (
                    <td className="border-t border-surface-container px-1 py-2 text-center">
                      {readOnly ? (
                        <span className="tabular-nums">{c.percent ? `${c.percent}%` : "—"}</span>
                      ) : (
                        <Input
                          size="sm"
                          inputMode="numeric"
                          aria-label={`${r.student.fullName} — foiz`}
                          value={c.percent}
                          invalid={!pctOk(c.percent)}
                          onChange={(ev) => set(r.student.id, "percent", ev.target.value)}
                          className="w-16 px-1 text-center tabular-nums"
                          rightSlot={<span className="pr-1 text-[11px]">%</span>}
                        />
                      )}
                    </td>
                  ) : null}
                  <td className="border-t border-surface-container px-3 py-2">
                    {readOnly ? (
                      <span className="text-body-sm text-on-surface-variant">{c.comment || "—"}</span>
                    ) : (
                      <Input size="sm" value={c.comment} onChange={(ev) => set(r.student.id, "comment", ev.target.value)} placeholder="Qisqa izoh" maxLength={500} className="min-w-[140px]" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-semibold text-on-surface">
              <td className="sticky left-0 z-10 border-t-2 border-outline-variant bg-surface-container-low px-3 py-2.5 text-body-sm">Guruh oʻrtachasi</td>
              {mock
                ? SKILLS.map((k) => (
                    <td key={k.key} className="border-t-2 border-outline-variant bg-surface-container-low px-1 py-2.5 text-center tabular-nums">
                      {colAvg(k.key) != null ? fmtNum(colAvg(k.key)!, 1) : "—"}
                    </td>
                  ))
                : null}
              <td className="border-t-2 border-outline-variant bg-surface-container-low px-1 py-2.5 text-center tabular-nums text-primary">
                {overallAvg != null ? fmtNum(overallAvg, 1) : "—"}
              </td>
              {!mock ? (
                <td className="border-t-2 border-outline-variant bg-surface-container-low px-1 py-2.5 text-center tabular-nums">{pctAvg != null ? `${fmtNum(Math.round(pctAvg))}%` : "—"}</td>
              ) : null}
              <td className="border-t-2 border-outline-variant bg-surface-container-low" />
            </tr>
          </tfoot>
        </table>
      </div>
      {!readOnly ? (
        <div className="sticky bottom-0 z-20 flex flex-col gap-3 border-t border-outline-variant bg-surface-container-low px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Checkbox checked={notify} onChange={(ev) => setNotify(ev.target.checked)} label="Ota-onalarga natijani yuborish" description="Faqat yangi yoki oʻzgargan natijalar" />
          <div className="flex items-center gap-2">
            {invalid ? (
              <span className="flex items-center gap-1 text-body-sm text-error">
                <Icon name="error" size={16} />
                Band 0–9 (0.5 qadam), foiz 0–100
              </span>
            ) : (
              <span className="text-body-sm text-on-surface-muted">{dirty.length ? `${dirty.length} ta oʻzgarish` : "Oʻzgarish yoʻq"}</span>
            )}
            <Button icon="save" onClick={() => void submit().catch(() => {})} loading={save.isPending} disabled={!dirty.length || invalid}>
              Saqlash
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
