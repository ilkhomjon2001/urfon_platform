import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LessonPlanToday } from "@/components/LessonPlanView";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  EmptyState,
  Icon,
  IconButton,
  Input,
  ProgressBar,
  SearchInput,
  Skeleton,
  Spinner,
  Textarea,
  buttonVariants,
  softTone,
  solidTone,
} from "@/components/ui";
import { api, ApiError, downloadFile, openFile } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtDate, fmtFileSize, fmtNum, fmtRelDateTime, fmtTime, fmtTimeRange, fmtWeekday, gradeTone } from "@/lib/format";
import { useDocumentTitle } from "@/lib/hooks";
import { toastError, useApiMutation, useApiQuery } from "@/lib/query";
import { GradePopover } from "./a/GradePopover";
import { HomeworkDialog } from "./a/HomeworkDialog";
import { MaterialDialog } from "./a/MaterialDialog";
import { ATT, ATT_ORDER, ErrorCard, LessonStatusBadge, lessonSideKeys, lessonTitle, qk, topicText } from "./a/shared";
import type { AttStatus, LessonResponse, LessonStudent, MaterialType } from "./a/types";

const MAT_ICON: Record<MaterialType, string> = { PDF: "picture_as_pdf", AUDIO: "headphones", VIDEO: "movie", DOC: "description", IMAGE: "image", LINK: "link" };
const HW_ICON: Record<string, string> = { TEXT: "edit_note", AUDIO: "mic", FILE: "upload_file", QUIZ: "quiz" };
const HW_LABEL: Record<string, string> = { TEXT: "Matn", AUDIO: "Audio", FILE: "Fayl", QUIZ: "Test" };

function recount(students: LessonStudent[]): LessonResponse["counts"] {
  const act = students.filter((s) => s.active);
  const c = (st: AttStatus) => act.filter((s) => s.attendance?.status === st).length;
  return { total: act.length, present: c("PRESENT"), late: c("LATE"), excused: c("EXCUSED"), absent: c("ABSENT"), unmarked: act.filter((s) => !s.attendance).length };
}

export default function TeacherLessonConductPage() {
  const { lessonId = "" } = useParams();
  const key = qk.lesson(lessonId);
  const qc = useQueryClient();
  const q = useApiQuery<LessonResponse>(key, lessonId ? `/teacher/lessons/${lessonId}` : null, { refetchInterval: 30_000 });
  const d = q.data;
  useDocumentTitle(d ? `${d.group.name} — dars` : "Dars");

  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [hwOpen, setHwOpen] = useState(false);
  const [matOpen, setMatOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);

  // Xulosa (lokal qoralama — fon yangilanishi yozilayotgan matnni o'chirmaydi)
  const [summary, setSummary] = useState("");
  const [hwNote, setHwNote] = useState("");
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (d && !dirty) {
      setSummary(d.lesson.summary ?? "");
      setHwNote(d.lesson.homeworkNote ?? "");
    }
  }, [d?.lesson.id, d?.lesson.summary, d?.lesson.homeworkNote, dirty]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setDirty(false), [lessonId]);

  const refreshSide = () => lessonSideKeys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
  const setBusyFor = (ids: string[], on: boolean) =>
    setBusy((b) => {
      const n = { ...b };
      ids.forEach((id) => (on ? (n[id] = true) : delete n[id]));
      return n;
    });

  // ── Davomat (optimistik)
  const mark = useApiMutation(
    (items: { studentId: string; status: AttStatus }[]) =>
      api.put<{ changed: number; notified: number }>(`/teacher/lessons/${lessonId}/attendance`, { items }),
    {
      onMutate: async (items) => {
        await qc.cancelQueries({ queryKey: key });
        const prev = qc.getQueryData<LessonResponse>(key);
        setBusyFor(
          items.map((i) => i.studentId),
          true,
        );
        if (prev) {
          const map = new Map(items.map((i) => [i.studentId, i.status]));
          const students = prev.students.map((s) =>
            map.has(s.id)
              ? {
                  ...s,
                  attendance: {
                    status: map.get(s.id)!,
                    arrivedAt: s.attendance?.arrivedAt ?? null,
                    source: s.attendance?.source ?? "MANUAL",
                    note: s.attendance?.note ?? null,
                    markedBy: s.attendance?.markedBy ?? null,
                    updatedAt: new Date().toISOString(),
                  },
                  activity: map.get(s.id) === "ABSENT" || map.get(s.id) === "EXCUSED" ? null : s.activity,
                }
              : s,
          );
          qc.setQueryData<LessonResponse>(key, { ...prev, students, counts: recount(students) });
        }
        return { prev };
      },
      onError: (_e, _v, ctx) => {
        const c = ctx as { prev?: LessonResponse } | undefined;
        if (c?.prev) qc.setQueryData(key, c.prev);
      },
      onSuccess: (r, items) => {
        if (items.length > 1) toast.success(`${items.length} ta oʻquvchi «Keldi» deb belgilandi`);
        if (r.notified) toast.message("Ota-onaga Telegram orqali xabar yuborildi");
      },
      onSettled: (_r, _e, items) => {
        setBusyFor(
          items.map((i) => i.studentId),
          false,
        );
        qc.invalidateQueries({ queryKey: key });
        refreshSide();
      },
    },
  );

  // ── Faollik tangasi (+1..+5; aktiv chipni qayta bosish — bekor qilish)
  const activity = useApiMutation(
    (v: { studentId: string; amount: number | null }) =>
      v.amount == null
        ? api.delete(`/teacher/lessons/${lessonId}/activity/${v.studentId}`)
        : api.post(`/teacher/lessons/${lessonId}/activity`, { studentId: v.studentId, amount: v.amount }),
    {
      onMutate: async (v) => {
        await qc.cancelQueries({ queryKey: key });
        const prev = qc.getQueryData<LessonResponse>(key);
        setBusyFor([`a:${v.studentId}`], true);
        if (prev) {
          qc.setQueryData<LessonResponse>(key, {
            ...prev,
            students: prev.students.map((s) => (s.id === v.studentId ? { ...s, activity: v.amount == null ? null : { amount: v.amount, note: null } } : s)),
          });
        }
        return { prev };
      },
      onError: (_e, _v, ctx) => {
        const c = ctx as { prev?: LessonResponse } | undefined;
        if (c?.prev) qc.setQueryData(key, c.prev);
      },
      onSettled: (_r, _e, v) => {
        setBusyFor([`a:${v.studentId}`], false);
        qc.invalidateQueries({ queryKey: key });
        refreshSide();
      },
    },
  );

  const start = useApiMutation(() => api.post(`/teacher/lessons/${lessonId}/start`), {
    invalidate: [key, ...lessonSideKeys],
    success: "Dars boshlandi",
  });

  const saveSummary = useApiMutation(
    () => api.patch(`/teacher/lessons/${lessonId}`, { summary: summary.trim() || null, homeworkNote: hwNote.trim() || null }),
    { invalidate: [key], success: "Dars xulosasi saqlandi", onSuccess: () => setDirty(false) },
  );

  if (q.isLoading) return <LessonSkeleton />;
  if (q.error || !d) {
    return (
      <>
        <BackLink />
        <ErrorCard error={q.error} onRetry={() => q.refetch()} />
      </>
    );
  }

  const { lesson: l, group: g, counts } = d;
  const readOnlyReason = l.status === "CANCELLED" ? "Dars bekor qilingan" : l.isFuture ? "Davomat dars kuni ochiladi" : null;
  const unmarked = d.students.filter((s) => s.active && !s.attendance);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Sarlavha kartasi */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <BackLink inline />
              <Link to={`/ustoz/guruhlar/${g.id}`}>
                <Badge tone="navy" shape="square">
                  {g.name}
                </Badge>
              </Link>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{g.code}</span>
              {g.level ? <Badge shape="square">{g.level.label}</Badge> : null}
              <LessonStatusBadge status={l.status} />
            </div>
            <h1 className="font-headline-xl-mobile text-headline-xl-mobile tracking-tight text-on-surface sm:font-headline-xl sm:text-headline-xl">{lessonTitle({ title: l.title, topics: d.topics })}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-md text-on-surface-variant">
              <span className="inline-flex items-center gap-1">
                <Icon name="calendar_today" size={16} />
                {fmtWeekday(l.startsAt)}, {fmtDate(l.startsAt)}
                {l.isToday ? " · Bugun" : ""}
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Icon name="schedule" size={16} />
                {fmtTimeRange(fmtTime(l.startsAt), fmtTime(l.endsAt))}
              </span>
              {l.room ? (
                <span className="inline-flex items-center gap-1">
                  <Icon name="meeting_room" size={16} />
                  {l.room.name}
                  {l.room.kind && l.room.kind !== l.room.name ? ` (${l.room.kind})` : ""}
                </span>
              ) : null}
              {l.number ? (
                <span className="inline-flex items-center gap-1">
                  <Icon name="tag" size={16} />
                  {l.number}/{g.totalLessons}-dars
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {d.nav.prev ? (
              <Link to={`/ustoz/darslar/${d.nav.prev.id}`} className={buttonVariants({ variant: "outline", size: "md", className: "w-10 px-0" })} aria-label="Oldingi dars" title="Oldingi dars">
                <Icon name="chevron_left" />
              </Link>
            ) : null}
            {d.nav.next ? (
              <Link to={`/ustoz/darslar/${d.nav.next.id}`} className={buttonVariants({ variant: "outline", size: "md", className: "w-10 px-0" })} aria-label="Keyingi dars" title="Keyingi dars">
                <Icon name="chevron_right" />
              </Link>
            ) : null}
            {l.canStart ? (
              <Button icon="play_arrow" loading={start.isPending} onClick={() => start.mutate()} className="flex-1 sm:flex-none">
                Darsni boshlash
              </Button>
            ) : null}
            {l.canFinish ? (
              <Button variant={l.status === "IN_PROGRESS" ? "primary" : "outline"} icon="flag" onClick={() => setFinishOpen(true)} className="flex-1 sm:flex-none">
                Darsni yakunlash
              </Button>
            ) : null}
          </div>
        </div>

        {/* davomat qisqacha */}
        <div className="mt-4 flex flex-col gap-2 border-t border-outline-variant/70 pt-4 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-wrap gap-1.5">
            {ATT_ORDER.map((st) => (
              <Badge key={st} tone={ATT[st].tone} icon={ATT[st].icon}>
                {ATT[st].label}: {counts[st === "PRESENT" ? "present" : st === "LATE" ? "late" : st === "EXCUSED" ? "excused" : "absent"]}
              </Badge>
            ))}
            {counts.unmarked ? <Badge>Belgilanmagan: {counts.unmarked}</Badge> : null}
          </div>
          <ProgressBar value={counts.total - counts.unmarked} max={Math.max(1, counts.total)} size="sm" className="sm:max-w-xs" />
        </div>
      </Card>

      {l.status === "CANCELLED" ? (
        <Alert tone="danger" title="Dars bekor qilingan">
          Bu dars uchun davomat va baho kiritilmaydi.
        </Alert>
      ) : l.isFuture ? (
        <Alert tone="primary" title="Kelgusi dars">
          Dars {fmtRelDateTime(l.startsAt)} da boʻladi. Hozir mavzuni tanlab, material va uyga vazifani tayyorlab qoʻyishingiz mumkin. Davomat dars kuni ochiladi.
        </Alert>
      ) : l.status === "DONE" ? (
        <Alert tone="success" title="Dars yakunlangan">
          Davomat va baholarni tuzatish mumkin — har bir oʻzgarish tizim jurnaliga yoziladi va kerak boʻlsa ota-onaga xabar boradi.
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:grid-rows-[auto_auto_1fr] lg:items-start">
        <TopicCard d={d} className="lg:col-span-4 lg:col-start-9 lg:row-start-1" />

        {/* ── O'quvchilar ro'yxati */}
        <Card className="min-w-0 lg:col-span-8 lg:col-start-1 lg:row-span-3 lg:row-start-1">
          <CardHeader
            title="Davomat va faollik"
            description={`Keldi / Kechikdi: +${d.coinRules.attendance} tanga · Faollik: +${d.coinRules.activity.min}…+${d.coinRules.activity.max} · Kelmadi yoki kechikdi — ota-onaga xabar`}
            badge={
              <Badge tone="primary">
                {counts.total - counts.unmarked}/{counts.total} belgilandi
              </Badge>
            }
            action={
              <Button
                variant="secondary"
                size="sm"
                icon="done_all"
                disabled={!!readOnlyReason || unmarked.length === 0 || mark.isPending}
                onClick={() => mark.mutate(unmarked.map((s) => ({ studentId: s.id, status: "PRESENT" as const })))}
              >
                Hammasi keldi
              </Button>
            }
          />
          <CardContent>
            {d.students.length === 0 ? (
              <EmptyState compact icon="person_off" title="Guruhda faol oʻquvchi yoʻq" />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {d.students.map((s) => (
                  <StudentRow
                    key={s.id}
                    s={s}
                    lessonId={l.id}
                    startsAt={l.startsAt}
                    disabledReason={readOnlyReason ?? (s.active ? null : "Guruhdan chiqqan")}
                    busy={!!busy[s.id]}
                    activityBusy={!!busy[`a:${s.id}`]}
                    activityRange={d.coinRules.activity}
                    onMark={(status) => s.attendance?.status !== status && mark.mutate([{ studentId: s.id, status }])}
                    onActivity={(amount) => activity.mutate({ studentId: s.id, amount })}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── Dars xulosasi */}
        <Card className="min-w-0 lg:col-span-4 lg:col-start-9 lg:row-start-2">
          <CardHeader title="Dars xulosasi" description="Ota-onalarga dars tafsilotida koʻrinadi" icon="summarize" />
          <CardContent className="flex flex-col gap-3">
            <Textarea
              rows={4}
              value={summary}
              maxLength={3000}
              disabled={l.status === "CANCELLED"}
              onChange={(e) => {
                setSummary(e.target.value);
                setDirty(true);
              }}
              placeholder="Bugun nima oʻtildi, qaysi mashqlar qilindi…"
              aria-label="Dars xulosasi"
            />
            <Input
              value={hwNote}
              maxLength={1000}
              disabled={l.status === "CANCELLED"}
              onChange={(e) => {
                setHwNote(e.target.value);
                setDirty(true);
              }}
              placeholder="Uyga vazifa boʻyicha qisqa izoh (ixtiyoriy)"
              aria-label="Uyga vazifa izohi"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-body-sm text-on-surface-muted">{dirty ? "Saqlanmagan oʻzgarish bor" : l.summary ? "Saqlangan" : ""}</span>
              <Button size="sm" variant="outline" icon="save" disabled={!dirty} loading={saveSummary.isPending} onClick={() => saveSummary.mutate()}>
                Saqlash
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Uyga vazifa va materiallar */}
        <Card className="min-w-0 lg:col-span-4 lg:col-start-9 lg:row-start-3">
          <CardHeader title="Uyga vazifa va materiallar" icon="attach_file" />
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" icon="assignment_add" disabled={l.status === "CANCELLED"} onClick={() => setHwOpen(true)}>
                Uyga vazifa berish
              </Button>
              <Button size="sm" variant="outline" icon="upload_file" disabled={l.status === "CANCELLED"} onClick={() => setMatOpen(true)}>
                Material biriktirish
              </Button>
            </div>
            <section>
              <h3 className="mb-1.5 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">Uyga vazifa</h3>
              {d.homework.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">Bu darsga vazifa berilmagan.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {d.homework.map((h) => (
                    <li key={h.id}>
                      <Link to="/ustoz/vazifalar" className="flex items-center gap-3 rounded-lg bg-surface-container-low/70 p-2.5 hover:bg-surface-container-low">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest text-primary">
                          <Icon name={HW_ICON[h.type] ?? "assignment"} size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-body-md text-on-surface">{h.title}</div>
                          <div className="text-body-sm text-on-surface-muted">
                            {HW_LABEL[h.type]} · muddat {fmtRelDateTime(h.dueAt)} · {h.submitted} ta topshirildi
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h3 className="mb-1.5 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">Materiallar</h3>
              {d.materials.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">Material biriktirilmagan.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {d.materials.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 rounded-lg bg-surface-container-low/70 p-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest text-primary">
                        <Icon name={MAT_ICON[m.type]} size={18} />
                      </span>
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => (m.file ? openFile(m.file.id).catch(toastError) : m.url && window.open(m.url, "_blank", "noopener"))}
                      >
                        <div className="truncate text-body-md text-on-surface hover:text-primary">{m.title}</div>
                        <div className="truncate text-body-sm text-on-surface-muted">{m.file ? `${m.file.originalName} · ${fmtFileSize(m.file.size)}` : m.url}</div>
                      </button>
                      {m.file ? (
                        <IconButton icon="download" label="Yuklab olish" size="sm" onClick={() => downloadFile(m.file!.id, m.file!.originalName).catch(toastError)} />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </CardContent>
        </Card>
      </div>

      <HomeworkDialog
        open={hwOpen}
        onOpenChange={setHwOpen}
        lessonId={l.id}
        groupId={g.id}
        topics={d.topics}
        lessonTitle={l.title}
        nextLessonAt={d.nav.next?.startsAt ?? null}
      />
      <MaterialDialog open={matOpen} onOpenChange={setMatOpen} lessonId={l.id} groupId={g.id} topicId={d.topics[0]?.id ?? null} levelId={g.level?.id ?? null} />
      <FinishDialog
        open={finishOpen}
        onOpenChange={setFinishOpen}
        d={d}
        summary={summary}
        setSummary={(v) => {
          setSummary(v);
          setDirty(true);
        }}
        hwNote={hwNote}
        onMarkRest={() => mark.mutate(unmarked.map((s) => ({ studentId: s.id, status: "PRESENT" as const })))}
        marking={mark.isPending}
        onDone={() => setDirty(false)}
      />
    </div>
  );
}

function BackLink({ inline }: { inline?: boolean }) {
  return (
    <Link
      to="/ustoz/jadval"
      className={cn("inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-primary", !inline && "mb-4")}
    >
      <Icon name="arrow_back" size={16} />
      Dars jadvali
    </Link>
  );
}

// ───────────── O'quvchi qatori ─────────────
function StudentRow({
  s,
  lessonId,
  startsAt,
  disabledReason,
  busy,
  activityBusy,
  activityRange,
  onMark,
  onActivity,
}: {
  s: LessonStudent;
  lessonId: string;
  startsAt: string;
  disabledReason: string | null;
  busy: boolean;
  activityBusy: boolean;
  activityRange: { min: number; max: number };
  onMark: (st: AttStatus) => void;
  onActivity: (amount: number | null) => void;
}) {
  const a = s.attendance;
  const disabled = !!disabledReason;
  const absent = a?.status === "ABSENT" || a?.status === "EXCUSED";
  const lateMin = a?.status === "LATE" && a.arrivedAt ? Math.round((new Date(a.arrivedAt).getTime() - new Date(startsAt).getTime()) / 60_000) : 0;
  const amounts = Array.from({ length: activityRange.max - activityRange.min + 1 }, (_, i) => activityRange.min + i);

  return (
    <li className={cn("flex flex-col gap-2.5 rounded-xl border border-outline-variant/70 p-3", !s.active && "opacity-60", !a && !disabled && "border-dashed")}>
      <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
      <div className="flex min-w-0 items-center gap-3 md:w-56 md:shrink-0">
        <Avatar name={s.fullName} size="md" />
        <div className="min-w-0">
          <div className="truncate font-label-lg text-label-lg text-on-surface">{s.fullName}</div>
          <div className="flex flex-wrap items-center gap-1.5 text-body-sm text-on-surface-muted">
            {s.code ? <span>#{s.code}</span> : null}
            {a?.arrivedAt ? (
              <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5", softTone[a.source === "TURNSTILE" ? "primary" : "neutral"])} title={a.source === "TURNSTILE" ? "Turniketdan oʻtgan vaqti" : "Kelgan vaqti"}>
                <Icon name={a.source === "TURNSTILE" ? "door_open" : "login"} size={13} />
                {a.source === "TURNSTILE" ? "Turniket " : ""}
                {fmtTime(a.arrivedAt)}
              </span>
            ) : null}
            {lateMin > 0 ? <span className="text-warning">+{lateMin} daq</span> : null}
            {s.coins ? (
              <span className="inline-flex items-center gap-0.5 font-semibold text-tertiary">
                <Icon name="toll" filled size={13} />+{s.coins}
              </span>
            ) : null}
            {!s.active ? <Badge>Guruhdan chiqqan</Badge> : null}
          </div>
        </div>
      </div>

      <div role="radiogroup" aria-label={`${s.fullName} davomati`} className="grid flex-1 grid-cols-4 gap-1.5">
        {ATT_ORDER.map((st) => {
          const on = a?.status === st;
          return (
            <button
              key={st}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled}
              title={disabledReason ?? ATT[st].label}
              onClick={() => onMark(st)}
              className={cn(
                "flex h-11 min-w-0 items-center justify-center gap-1 rounded-lg border px-1 font-label-md text-label-md transition-colors disabled:cursor-not-allowed",
                on ? cn(solidTone[ATT[st].tone], "border-transparent") : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low",
                disabled && !on && "opacity-50",
              )}
            >
              {busy && on ? <Spinner size={14} /> : <Icon name={ATT[st].icon} size={16} filled={on} className="hidden sm:inline-block" />}
              <span className="truncate">{ATT[st].label}</span>
            </button>
          );
        })}
      </div>

      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 md:pl-12">
        <div className="flex items-center gap-1" role="group" aria-label="Darsdagi faollik tangasi">
          <Icon name="toll" size={18} className={cn("mr-0.5", s.activity ? "text-tertiary" : "text-outline")} />
          {amounts.map((n) => {
            const on = s.activity?.amount === n;
            return (
              <button
                key={n}
                type="button"
                disabled={disabled || absent || activityBusy}
                aria-pressed={on}
                title={absent ? "Darsda qatnashmagan" : on ? "Bekor qilish" : `Faollik: +${n} tanga`}
                onClick={() => onActivity(on ? null : n)}
                className={cn(
                  "h-9 w-9 rounded-full font-label-md text-label-md tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  on ? "bg-gold text-on-tertiary-fixed" : "bg-surface-container-low text-on-surface-variant hover:bg-tertiary-fixed",
                )}
              >
                +{n}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1">
          {s.grades.map((gr) => (
            <GradePopover
              key={gr.id}
              mode="edit"
              grade={gr}
              studentName={s.fullName}
              trigger={
                <button
                  type="button"
                  disabled={disabled && !s.active}
                  className={cn("h-9 min-w-9 rounded-lg px-2 font-headline-sm text-headline-sm tabular-nums", softTone[gradeTone(gr.value)])}
                  title={`${gr.label ?? ""}${gr.comment ? ` — ${gr.comment}` : ""} (oʻzgartirish)`}
                >
                  {fmtNum(gr.value)}
                </button>
              }
            />
          ))}
          {!disabled ? (
            <GradePopover
              mode="create"
              lessonId={lessonId}
              studentId={s.id}
              studentName={s.fullName}
              trigger={
                <button
                  type="button"
                  className="flex h-9 items-center gap-1 rounded-lg border border-outline-variant px-2 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                  title="Baho qoʻyish"
                >
                  <Icon name="add" size={16} />
                  Baho
                </button>
              }
            />
          ) : null}
        </div>
      </div>
    </li>
  );
}

// ───────────── Mavzu tanlash (mavzular bazasidan) ─────────────
function TopicCard({ d, className }: { d: LessonResponse; className?: string }) {
  const lessonId = d.lesson.id;
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(d.topics.length === 0);
  const [clicked, setClicked] = useState<string | null>(null);
  useEffect(() => setShowList(d.topics.length === 0), [lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useApiMutation((topicIds: string[]) => api.put<{ title: string | null }>(`/teacher/lessons/${lessonId}/topics`, { topicIds }), {
    invalidate: [qk.lesson(lessonId), ...lessonSideKeys],
    success: (_r, ids) => (ids.length ? "Dars mavzusi saqlandi" : "Mavzu olib tashlandi"),
    onSuccess: (_r, ids) => ids.length && setShowList(false),
    onSettled: () => setClicked(null),
  });

  const selected = new Set(d.topics.map((t) => t.id));
  const suggested = d.availableTopics.find((t) => t.id === d.suggestedTopicId) ?? null;
  const filtered = useMemo(() => {
    const n = search.trim().toLocaleLowerCase();
    return n ? d.availableTopics.filter((t) => t.label.toLocaleLowerCase().includes(n) || String(t.unit) === n) : d.availableTopics;
  }, [d.availableTopics, search]);
  const disabled = d.lesson.status === "CANCELLED" || save.isPending;
  const pick = (ids: string[], id: string) => {
    setClicked(id);
    save.mutate(ids);
  };

  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader
        title="Dars mavzusi"
        icon="menu_book"
        description={d.group.level ? `Mavzular bazasidan · ${d.group.level.label}` : "Mavzular bazasi"}
        action={
          d.availableTopics.length && d.topics.length ? (
            <Button variant="link" size="sm" onClick={() => setShowList((v) => !v)}>
              {showList ? "Yopish" : "Oʻzgartirish"}
            </Button>
          ) : undefined
        }
      />
      <CardContent className="flex flex-col gap-3">
        {!d.group.level ? (
          <EmptyState compact icon="menu_book" title="Guruhga level biriktirilmagan" description="Bu guruh uchun mavzular bazasi yoʻq — dars xulosasida mavzuni yozib qoldiring." />
        ) : d.availableTopics.length === 0 ? (
          <EmptyState compact icon="menu_book" title="Mavzular bazasi boʻsh" description="Administrator bu level uchun mavzularni eʼlon qilgach, shu yerda tanlanadi." />
        ) : (
          <>
            {d.topics.length ? (
              <ul className="flex flex-col gap-2">
                {d.topics.map((t) => (
                  <li key={t.id} className="flex items-start gap-2 rounded-xl bg-primary-light p-3">
                    <Icon name="check_circle" filled size={20} className="mt-0.5 text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="font-label-lg text-label-lg text-on-surface">{topicText(t)}</div>
                      {t.grammar ? <div className="text-body-sm text-on-surface-variant">Grammar: {t.grammar}</div> : null}
                      {t.vocabulary.length ? <div className="line-clamp-2 text-body-sm text-on-surface-muted">Lugʻat: {t.vocabulary.slice(0, 8).join(", ")}</div> : null}
                      {t.lessonPlan?.length ? <LessonPlanToday plan={t.lessonPlan} part={t.part} /> : null}
                      {t.lessonPlan?.length && d.group.level ? (
                        <Link
                          to={`/ustoz/dars-rejalari?level=${d.group.level.id}&track=${d.group.ageGroup === "KIDS" ? "kids" : "teen"}&unit=${t.id}&part=${t.part}`}
                          className="mt-2 inline-flex items-center gap-1.5 font-label-md text-label-md text-primary hover:underline"
                        >
                          <Icon name="open_in_new" size={16} />
                          Rejani toʻliq ekranda ochish
                        </Link>
                      ) : null}
                    </div>
                    <IconButton
                      icon="close"
                      label="Mavzuni olib tashlash"
                      size="sm"
                      disabled={disabled}
                      onClick={() => pick(d.topics.filter((x) => x.id !== t.id).map((x) => x.id), t.id)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body-sm text-on-surface-variant">Mavzu hali tanlanmagan. Tavsiya etilgan mavzuni tanlang yoki roʻyxatdan qidiring.</p>
            )}

            {suggested && !selected.has(suggested.id) ? (
              <div className="flex flex-col gap-2 rounded-xl border border-gold bg-tertiary-fixed/40 p-3">
                <div className="flex items-center gap-1.5 font-label-sm text-label-sm uppercase tracking-wider text-tertiary">
                  <Icon name="auto_awesome" size={14} />
                  Tavsiya: keyingi oʻtilmagan mavzu
                </div>
                <div className="font-label-lg text-label-lg text-on-surface">{suggested.label}</div>
                <Button size="sm" variant="navy" icon="check" loading={save.isPending && clicked === suggested.id} disabled={disabled} onClick={() => pick([suggested.id], suggested.id)}>
                  Shu mavzuni tanlash
                </Button>
              </div>
            ) : null}
            {d.lastTopic && !selected.has(d.lastTopic.id) ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => pick([d.lastTopic!.id], d.lastTopic!.id)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-body-sm text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50"
              >
                <Icon name="replay" size={16} className="text-primary" />
                <span className="min-w-0">
                  Oldingi darsni davom ettirish: <b className="font-semibold text-on-surface">{topicText(d.lastTopic)}</b>
                </span>
              </button>
            ) : null}

            {showList ? (
              <div className="flex flex-col gap-2">
                <SearchInput value={search} onValueChange={setSearch} placeholder="Unit raqami yoki nomi…" size="sm" />
                <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto pr-1">
                  {filtered.map((t) => {
                    const on = selected.has(t.id);
                    return (
                      <li key={t.id} className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => pick(on ? d.topics.filter((x) => x.id !== t.id).map((x) => x.id) : [t.id], t.id)}
                          aria-pressed={on}
                          className={cn(
                            "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors disabled:opacity-60",
                            on ? "bg-primary-light" : "hover:bg-surface-container-low",
                          )}
                        >
                          {save.isPending && clicked === t.id ? (
                            <Spinner size={16} className="text-primary" />
                          ) : (
                            <Icon name={on ? "radio_button_checked" : "radio_button_unchecked"} size={18} className={on ? "text-primary" : "text-outline"} />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-body-md text-on-surface">{t.label}</span>
                            <span className="block text-body-sm text-on-surface-muted">
                              {t.covered ? `${t.coveredLessons} darsda oʻtilgan` : "Hali oʻtilmagan"} · {t.lessonsCount} dars
                            </span>
                          </span>
                          {t.id === d.suggestedTopicId ? <Badge tone="gold">Tavsiya</Badge> : t.covered ? <Icon name="check" size={16} className="text-success" /> : null}
                        </button>
                        {!on && d.topics.length > 0 && d.topics.length < 5 ? (
                          <IconButton icon="add" label="Qoʻshimcha mavzu sifatida qoʻshish" size="sm" disabled={disabled} onClick={() => pick([...d.topics.map((x) => x.id), t.id], t.id)} />
                        ) : null}
                      </li>
                    );
                  })}
                  {filtered.length === 0 ? <li className="px-2 py-3 text-body-sm text-on-surface-muted">Mos mavzu topilmadi</li> : null}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ───────────── Yakunlash ─────────────
function FinishDialog({
  open,
  onOpenChange,
  d,
  summary,
  setSummary,
  hwNote,
  onMarkRest,
  marking,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  d: LessonResponse;
  summary: string;
  setSummary: (v: string) => void;
  hwNote: string;
  onMarkRest: () => void;
  marking: boolean;
  onDone: () => void;
}) {
  const [missing, setMissing] = useState<{ id: string; fullName: string }[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setMissing(null);
      setErr(null);
    }
  }, [open]);
  const unmarked = d.students.filter((s) => s.active && !s.attendance);
  const finish = useApiMutation(
    () => api.post(`/teacher/lessons/${d.lesson.id}/finish`, { summary: summary.trim() || null, homeworkNote: hwNote.trim() || null }),
    {
      silentError: true,
      invalidate: [qk.lesson(d.lesson.id), ...lessonSideKeys],
      success: "Dars yakunlandi",
      onSuccess: () => {
        onDone();
        onOpenChange(false);
      },
      onError: (e) => {
        if (e instanceof ApiError && e.code === "ATTENDANCE_INCOMPLETE") {
          setMissing(((e.details as unknown as { students?: { id: string; fullName: string }[] })?.students) ?? []);
          setErr(null);
        } else setErr(e.message);
      },
    },
  );
  const list = missing ?? (unmarked.length ? unmarked.map((s) => ({ id: s.id, fullName: s.fullName })) : null);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !finish.isPending && onOpenChange(o)}
      title="Darsni yakunlash"
      description={`${d.group.name} · ${fmtDate(d.lesson.startsAt)}, ${fmtTime(d.lesson.startsAt)}`}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={finish.isPending}>
            Bekor qilish
          </Button>
          <Button icon="flag" loading={finish.isPending} disabled={!!list?.length && unmarked.length > 0} onClick={() => finish.mutate()}>
            Yakunlash
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {err ? <Alert tone="danger">{err}</Alert> : null}
        {list?.length && unmarked.length ? (
          <Alert
            tone="warning"
            title={`Davomat belgilanmagan: ${unmarked.length} ta oʻquvchi`}
            action={
              <Button size="sm" variant="secondary" icon="done_all" loading={marking} onClick={onMarkRest}>
                Qolganlari «Keldi»
              </Button>
            }
          >
            {unmarked.map((s) => s.fullName).join(", ")}
          </Alert>
        ) : (
          <Alert tone="success">Barcha oʻquvchilar davomati belgilangan.</Alert>
        )}
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          {ATT_ORDER.map((st) => (
            <div key={st} className={cn("rounded-lg px-2 py-2", softTone[ATT[st].tone])}>
              <div className="font-headline-md text-headline-md tabular-nums">
                {d.counts[st === "PRESENT" ? "present" : st === "LATE" ? "late" : st === "EXCUSED" ? "excused" : "absent"]}
              </div>
              <div className="font-label-sm text-label-sm">{ATT[st].label}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="finish-summary" className="font-label-md text-label-md text-on-surface">
            Dars xulosasi (ota-onalarga koʻrinadi)
          </label>
          <Textarea id="finish-summary" rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={3000} placeholder="Bugun nima oʻtildi…" />
        </div>
        {!d.topics.length && d.group.level ? <p className="text-body-sm text-warning">Mavzu tanlanmagan — sillabus progressi uchun mavzuni tanlash tavsiya etiladi.</p> : null}
      </div>
    </Dialog>
  );
}

function LessonSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <Card className="p-5">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="mt-3 h-8 w-96 max-w-full" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </Card>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="p-5 lg:col-span-8">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="mb-3 h-16 w-full" />
          ))}
        </Card>
        <Card className="p-5 lg:col-span-4">
          <Skeleton className="h-40 w-full" />
        </Card>
      </div>
    </div>
  );
}
