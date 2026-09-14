// /ota-ona/darslar/:lessonId — dars tafsiloti va ustozga savol (mockup: urfon_ota_ona_kabineti_dars_tafsiloti_va_ustozga_savol_yo_llash).
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Badge, Button, Card, CardContent, CardHeader, EmptyState, Icon, IconButton, PageHeader, Textarea, buttonVariants } from "@/components/ui";
import { iconTileTone } from "@/components/ui";
import { api, downloadFile, openFile, useFileObjectUrl } from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { fmtDate, fmtDayMonth, fmtFileSize, fmtPhone, fmtRelDateTime, fmtTime, fmtTimeRange, fmtWeekday, gradeLabel } from "@/lib/format";
import { toastError, useApiMutation } from "@/lib/query";
import {
  contactLink,
  DAY_META,
  ErrorCard,
  fileKind,
  fmtGrade,
  HW_META,
  isAttended,
  MATERIAL_ICON,
  NoChild,
  PageSkeleton,
  PARENT_BASE,
  TeacherAvatar,
  useChildQuery,
} from "./p/shared";
import type { FileInfo, LessonDetailData } from "./p/types";

const QUESTION_CHIPS = [
  { icon: "assignment", text: "Uyga vazifa nima edi?" },
  { icon: "co_present", text: "Farzandim darsda qanday qatnashdi?" },
  { icon: "menu_book", text: "Qaysi mavzularni takrorlash kerak?" },
  { icon: "event_note", text: "Keyingi darsga nima tayyorlash kerak?" },
  { icon: "family_restroom", text: "Uyda qanday yordam bera olaman?" },
];

export default function ParentLessonDetail() {
  const { lessonId = "" } = useParams();
  const { data, isLoading, error, refetch, child } = useChildQuery<LessonDetailData>(["lesson", lessonId], `/parent/lessons/${lessonId}`, {}, { refetchInterval: 30_000 });
  const { hash } = useLocation();
  const askRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hash === "#savol" && data) askRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash, data]);

  if (!child) return <NoChild />;
  if (isLoading) return <PageSkeleton cards={3} />;
  if (error || !data) {
    const nf = (error as { status?: number } | null)?.status === 404;
    return nf ? (
      <Card>
        <EmptyState
          icon="event_busy"
          title="Dars topilmadi"
          description={`Bu dars ${child.fullName}ning guruhiga tegishli emas yoki oʻchirilgan.`}
          action={
            <Link to={`${PARENT_BASE}/darslar`} className={buttonVariants({ variant: "outline" })}>
              Taqvimga qaytish
            </Link>
          }
        />
      </Card>
    ) : (
      <ErrorCard error={error} onRetry={() => void refetch()} />
    );
  }

  const l = data.lesson;
  const monthParam = l.startsAt ? `?oy=${new Date(new Date(l.startsAt).getTime() + 5 * 3_600_000).toISOString().slice(0, 7)}` : "";
  const title = l.topics[0] ? `Unit ${l.topics[0].unit} — ${l.topics[0].title}` : (l.title ?? "Dars");
  const meta = DAY_META[l.state];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Bosh sahifa", to: PARENT_BASE },
          { label: "Davomat va darslar", to: `${PARENT_BASE}/darslar${monthParam}` },
          { label: `${fmtDayMonth(l.startsAt)} darsi tafsiloti` },
        ]}
        title={`${fmtDayMonth(l.startsAt)} darsi`}
        documentTitle={`${fmtDayMonth(l.startsAt)} darsi tafsiloti`}
        className="mb-0"
        actions={
          <Link to={`${PARENT_BASE}/darslar${monthParam}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "text-primary" })}>
            <Icon name="arrow_back" size={18} />
            Taqvimga qaytish
          </Link>
        }
      />

      {/* Sarlavha kartasi */}
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary-container via-primary to-primary-fixed-dim" />
        <CardContent className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral" shape="square" size="md">
                {fmtDate(l.startsAt).toUpperCase()} · {fmtWeekday(l.startsAt).toUpperCase()} · {fmtTimeRange(l.startsAt, l.endsAt)}
              </Badge>
              <Badge tone={l.status === "DONE" ? "success" : l.status === "CANCELLED" ? "neutral" : "primary"} icon={l.status === "DONE" ? "check_circle" : "schedule"}>
                {l.status === "DONE" ? "Oʻtildi" : l.status === "IN_PROGRESS" ? "Dars ketmoqda" : l.status === "CANCELLED" ? "Bekor qilindi" : "Rejada"}
              </Badge>
              <Badge tone="gold">{l.group.name}</Badge>
            </div>
            <h2 className="mt-3 font-headline-xl-mobile text-headline-xl-mobile text-on-surface sm:font-display-sm sm:text-display-sm">{title}</h2>
            {l.title && l.topics[0] && l.title !== title ? <p className="mt-1 font-label-lg text-label-lg text-on-surface-variant">{l.title}</p> : null}
            {l.topics[0]?.description ? <p className="mt-2 max-w-3xl text-body-md text-on-surface-variant">{l.topics[0].description}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {l.room ? (
                <Badge tone="neutral" variant="outline" icon="location_on" size="md">
                  {[l.branch?.name, l.room.name].filter(Boolean).join(" · ")}
                </Badge>
              ) : null}
              <Badge tone="neutral" variant="outline" icon="timer" size="md">
                Davomiyligi: {l.durationMin} daqiqa
              </Badge>
              {l.number ? (
                <Badge tone="neutral" variant="outline" icon="format_list_numbered" size="md">
                  {l.number}/{l.group.totalLessons}-dars
                </Badge>
              ) : null}
            </div>
          </div>
          {l.teacher ? (
            <div className="flex shrink-0 items-center gap-3 rounded-xl bg-surface-container-low p-4 lg:max-w-xs">
              <TeacherAvatar teacher={l.teacher} size="xl" />
              <div className="min-w-0">
                <div className="font-headline-sm text-headline-sm text-on-surface">{l.teacher.fullName}</div>
                <div className="text-body-sm text-on-surface-variant">{[l.teacher.title, l.teacher.specialization].filter(Boolean).join(" · ")}</div>
                {l.teacher.responseTime ? (
                  <div className="mt-1 flex items-center gap-1 font-label-sm text-label-sm text-primary">
                    <Icon name="bolt" size={14} /> Javob: {l.teacher.responseTime}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="min-w-0 space-y-6 xl:col-span-7">
          <ResultCard data={data} childName={data.child.fullName} stateLabel={meta.label} />
          <TopicsCard data={data} />
          <HomeworkCard data={data} />
          <MaterialsCard data={data} />
        </div>
        <div className="min-w-0 space-y-6 xl:col-span-5" ref={askRef} id="savol">
          <AskCard data={data} studentId={child.id} lessonId={lessonId} />
          <HistoryCard data={data} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────── Natija

function ResultCard({ data, childName, stateLabel }: { data: LessonDetailData; childName: string; stateLabel: string }) {
  const a = data.attendance;
  const l = data.lesson;
  const diff = a?.arrivedAt ? Math.round((new Date(a.arrivedAt).getTime() - new Date(l.startsAt).getTime()) / 60_000) : null;
  const classGrade = data.grades.find((g) => g.kind === "CLASSWORK") ?? data.grades[0] ?? null;
  const hw = data.homework[0];
  const attTone = !a ? "neutral" : isAttended(a.status) ? (a.status === "LATE" ? "warning" : "success") : a.status === "EXCUSED" ? "primary" : "danger";
  return (
    <Card>
      <CardHeader icon="monitoring" title={`${childName}ning natijasi`} />
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ResultTile label="Davomat" icon="verified" tone={attTone}>
            <div className="font-headline-md text-headline-md text-on-surface">{a ? DAY_META[a.status].short : stateLabel}</div>
            <div className="text-body-sm text-on-surface-variant">
              {a?.arrivedAt
                ? `${a.source === "TURNSTILE" ? "Turniket" : "Keldi"}: ${fmtTime(a.arrivedAt)}${diff != null ? (diff <= 0 ? " (oʻz vaqtida)" : ` (${diff} daq kechikib)`) : ""}`
                : a?.note ?? (l.state === "PLANNED" ? "Dars hali boʻlmagan" : "—")}
            </div>
          </ResultTile>
          <ResultTile label="Faollik va baho" icon="emoji_events" tone="gold">
            <div className="font-headline-md text-headline-md text-primary">
              {classGrade ? `${fmtGrade(classGrade.value)} (${gradeLabel(classGrade.value)})` : "—"}
            </div>
            <div className="text-body-sm text-on-surface-variant">
              {data.coins.total > 0 ? `+${data.coins.total} kumush tanga` : classGrade ? classGrade.kindLabel : "Baho qoʻyilmagan"}
            </div>
          </ResultTile>
          <ResultTile label="Uyga vazifa" icon="assignment" tone="primary">
            <div className="font-headline-md text-headline-md text-on-surface">{hw ? "Berildi" : "Berilmadi"}</div>
            <div className="text-body-sm text-on-surface-variant">{hw ? `Muddat: ${fmtDayMonth(hw.dueAt)}, ${fmtTime(hw.dueAt)}` : "Bu darsda vazifa yoʻq"}</div>
          </ResultTile>
        </div>

        {data.grades.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {data.grades.map((g) => (
              <Badge key={g.id} tone="gold" size="md">
                {g.title ?? g.kindLabel}: {fmtGrade(g.value)}
              </Badge>
            ))}
          </div>
        ) : null}

        {l.summary || classGrade?.comment ? (
          <div className="flex gap-3 rounded-xl bg-surface-container-low p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary">
              <Icon name="format_quote" size={18} />
            </span>
            <div className="min-w-0">
              <p className="font-label-md text-label-md text-on-surface">
                Ustozning sharhi{l.teacher ? <span className="font-normal text-on-surface-muted"> · {l.teacher.fullName}</span> : null}
              </p>
              {l.summary ? <p className="mt-1 whitespace-pre-line text-body-lg italic text-on-surface">«{l.summary}»</p> : null}
              {classGrade?.comment ? <p className="mt-1 text-body-md text-on-surface-variant">Baho izohi: «{classGrade.comment}»</p> : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ResultTile({ label, icon, tone, children }: { label: string; icon: string; tone: "neutral" | "primary" | "success" | "warning" | "danger" | "gold"; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <div className="mb-2 flex items-center justify-between font-label-md text-label-md text-on-surface-variant">
        {label}
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", iconTileTone[tone])}>
          <Icon name={icon} size={16} />
        </span>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────── Mavzular

function TopicsCard({ data }: { data: LessonDetailData }) {
  const topics = data.lesson.topics;
  const items: { title: string; text: string }[] = [];
  for (const t of topics) {
    for (const o of t.objectives) items.push({ title: o, text: "" });
    if (t.grammar) items.push({ title: "Grammatika", text: t.grammar });
    if (t.vocabulary.length) items.push({ title: `Yangi lugʻat (${t.vocabulary.length} ta)`, text: t.vocabulary.slice(0, 24).join(", ") });
  }
  return (
    <Card>
      <CardHeader icon="auto_stories" title="Darsda nima oʻtildi?" />
      <CardContent className="space-y-4">
        {topics.length === 0 && !data.lesson.title ? (
          <p className="text-body-md text-on-surface-variant">Mavzu hali biriktirilmagan.</p>
        ) : (
          <p className="text-body-lg text-on-surface-variant">
            {topics.length ? topics.map((t) => `Unit ${t.unit} — ${t.title}`).join("; ") : data.lesson.title}
          </p>
        )}
        {items.length ? (
          <ol className="space-y-2.5">
            {items.map((it, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-surface-container-low p-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest font-headline-sm text-headline-sm text-primary shadow-xs">{i + 1}</span>
                <div className="min-w-0">
                  <div className="font-label-lg text-label-lg text-on-surface">{it.title}</div>
                  {it.text ? <p className="mt-0.5 break-words text-body-sm text-on-surface-variant">{it.text}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        ) : null}
        {data.lesson.homeworkNote ? (
          <div className="flex items-start gap-2 rounded-lg bg-warning-container/60 px-3 py-2 text-body-sm text-on-warning-container">
            <Icon name="info" size={18} className="mt-px shrink-0" />
            {data.lesson.homeworkNote}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────── Uyga vazifa

function HomeworkCard({ data }: { data: LessonDetailData }) {
  if (!data.homework.length) return null;
  return (
    <Card>
      <CardHeader icon="assignment" title="Berilgan uyga vazifa" action={<Link to={`${PARENT_BASE}/vazifalar`} className="font-label-md text-label-md text-primary hover:underline">Barcha vazifalar</Link>} />
      <CardContent className="space-y-3">
        {data.homework.map((h) => {
          const m = HW_META[h.state];
          return (
            <div key={h.id} className="rounded-xl border border-outline-variant/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-label-lg text-label-lg text-on-surface">{h.title}</div>
                  <div className="text-body-sm text-on-surface-variant">
                    Muddat: {fmtDate(h.dueAt)}, {fmtTime(h.dueAt)} · +{h.coinReward} tanga (oʻz vaqtida)
                  </div>
                </div>
                <Badge tone={m.tone} icon={m.icon}>
                  {m.label}
                </Badge>
              </div>
              {h.description ? <p className="mt-2 whitespace-pre-line text-body-md text-on-surface-variant">{h.description}</p> : null}
              {h.files.length ? <FileChips files={h.files} className="mt-2" /> : null}
              {h.submission?.status === "DRAFT" ? (
                <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-surface-container-low px-3 py-2 text-body-sm text-on-surface-variant">
                  <Icon name="edit_note" size={18} className="text-outline" />
                  Qoralama saqlangan, lekin hali topshirilmagan
                </p>
              ) : h.submission ? (
                <div className="mt-3 rounded-lg bg-surface-container-low p-3 text-body-sm text-on-surface-variant">
                  {h.submission.submittedAt ? (
                    <div>
                      Topshirildi: {fmtRelDateTime(h.submission.submittedAt)}
                      {h.submission.isLate ? <span className="text-warning"> (kechikib)</span> : null}
                    </div>
                  ) : null}
                  {h.submission.score != null ? (
                    <div className="mt-0.5 font-label-lg text-label-lg text-on-surface">
                      Baho: {h.submission.score} ({gradeLabel(h.submission.score)})
                    </div>
                  ) : null}
                  {h.submission.feedback ? <p className="mt-1 italic">«{h.submission.feedback}»</p> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────── Materiallar

function MaterialsCard({ data }: { data: LessonDetailData }) {
  const mats = data.materials;
  return (
    <Card>
      <CardHeader icon="folder_open" title="Dars materiallari va resurslar" badge={mats.length ? <Badge>{mats.length} ta</Badge> : null} />
      <CardContent>
        {mats.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">Bu darsga material biriktirilmagan.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {mats.map((m) => (
              <MaterialTile key={m.id} m={m} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MaterialTile({ m }: { m: LessonDetailData["materials"][number] }) {
  const [play, setPlay] = useState(false);
  const meta = MATERIAL_ICON[m.type] ?? MATERIAL_ICON.DOC;
  const f = m.file;
  const ext = f?.originalName.split(".").pop()?.toUpperCase();
  const previewable = !!f && /^(application\/pdf|image\/)/.test(f.mime);
  return (
    <div className="flex min-w-0 flex-col rounded-xl bg-surface-container-low p-4">
      <div className="flex items-start gap-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconTileTone[meta.tone])}>
          <Icon name={meta.icon} size={20} />
        </span>
        <div className="min-w-0">
          <div className="truncate font-label-lg text-label-lg text-on-surface" title={m.title}>
            {m.title}
          </div>
          {m.description ? <div className="line-clamp-1 text-body-sm text-on-surface-variant">{m.description}</div> : null}
          <div className="mt-0.5 font-label-sm text-label-sm text-on-surface-muted">
            {f ? `${fmtFileSize(f.size)} · ${ext ?? meta.label}` : meta.label}
          </div>
        </div>
      </div>
      {play && f ? <AudioPlayer fileId={f.id} /> : null}
      <div className="mt-3 flex gap-2">
        {f ? (
          m.type === "AUDIO" || f.mime.startsWith("audio/") ? (
            <Button size="sm" variant="outline" block icon={play ? "stop" : "play_arrow"} onClick={() => setPlay((p) => !p)}>
              {play ? "Yopish" : "Tinglash"}
            </Button>
          ) : (
            <Button size="sm" variant="outline" block icon="download" className="text-primary" onClick={() => downloadFile(f.id, f.originalName).catch((e) => toastError(e))}>
              Yuklab olish
            </Button>
          )
        ) : m.url ? (
          <a href={m.url} target="_blank" rel="noreferrer" className={buttonVariants({ size: "sm", variant: "outline", block: true })}>
            <Icon name="open_in_new" size={16} />
            Havolani ochish
          </a>
        ) : null}
        {f && previewable ? <IconButton icon="visibility" label="Koʻrish" size="sm" variant="outline" onClick={() => openFile(f.id).catch((e) => toastError(e))} /> : null}
        {f && (m.type === "AUDIO" || f.mime.startsWith("audio/")) ? (
          <IconButton icon="download" label="Yuklab olish" size="sm" variant="outline" onClick={() => downloadFile(f.id, f.originalName).catch((e) => toastError(e))} />
        ) : null}
      </div>
    </div>
  );
}

function AudioPlayer({ fileId }: { fileId: string }) {
  const { url, loading } = useFileObjectUrl(fileId);
  if (loading || !url) return <div className="mt-3 h-9 animate-pulse rounded-full bg-surface-container-high" />;
  return <audio controls autoPlay src={url} className="mt-3 h-9 w-full" />;
}

function FileChips({ files, className }: { files: FileInfo[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {files.map((f) => {
        const k = MATERIAL_ICON[fileKind(f.mime)];
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => downloadFile(f.id, f.originalName).catch((e) => toastError(e))}
            className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 py-1.5 text-body-sm text-on-surface hover:border-primary hover:text-primary"
          >
            <Icon name={k.icon} size={16} />
            <span className="truncate">{f.originalName}</span>
            <span className="shrink-0 text-on-surface-muted">{fmtFileSize(f.size)}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────── Ustozga savol

function AskCard({ data, studentId, lessonId }: { data: LessonDetailData; studentId: string; lessonId: string }) {
  const user = useCurrentUser();
  const [text, setText] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const teacher = data.lesson.teacher;
  const send = useApiMutation(
    (body: string) =>
      api.post<{ threadId: string }>("/messages", { toUserId: teacher!.id, studentId, lessonId, isQuestion: true, body }),
    {
      invalidate: [["parent", "lesson", lessonId], ["messages"]],
      success: "Savolingiz ustozga yuborildi",
      onSuccess: () => setText(""),
    },
  );
  const body = text.trim();

  return (
    <Card>
      <CardHeader icon="help" title="Ustozga savol yoʻllash" description="Tez va qulay aloqa · savol shu darsga bogʻlanadi" />
      <CardContent className="space-y-4">
        {!teacher ? (
          <p className="text-body-md text-on-surface-variant">Guruhga hali ustoz biriktirilmagan. Savollar uchun administratorga yozing.</p>
        ) : (
          <>
            <p className="text-body-md text-on-surface-variant">
              Farzandingizning darsdagi natijasi yoki tushunishi boʻyicha savolingiz bormi? Tayyor savollardan birini tanlang yoki oʻzingiz yozing:
            </p>
            <div className="space-y-2">
              {QUESTION_CHIPS.map((c) => (
                <button
                  key={c.text}
                  type="button"
                  onClick={() => {
                    setText(c.text);
                    taRef.current?.focus();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left font-label-md text-label-md transition-colors",
                    text === c.text ? "border-primary bg-primary-light text-primary" : "border-outline-variant/70 bg-surface-container-low text-on-surface hover:border-primary/50",
                  )}
                >
                  <Icon name={c.icon} size={18} className="shrink-0 text-primary" />
                  <span className="flex-1">{c.text}</span>
                  <Icon name={text === c.text ? "check" : "add"} size={18} className="shrink-0 text-outline" />
                </button>
              ))}
            </div>
            <div>
              <label htmlFor="ask-text" className="mb-1.5 block font-label-md text-label-md text-on-surface">
                Yoki oʻz savolingizni yozing:
              </label>
              <Textarea
                id="ask-text"
                ref={taRef}
                rows={4}
                maxLength={4000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Dars, mavzu yoki farzandingizning oʻzlashtirishi boʻyicha ustozga savol yoki xabaringizni yozing…"
              />
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-1.5 text-body-sm text-on-surface-muted">
                <Icon name={user.telegramLinked ? "send" : "notifications"} size={16} />
                {user.telegramLinked ? "Ustoz javobi Telegram botingizga ham keladi" : "Javob kelganda bildirishnoma olasiz"}
              </p>
              <Button variant="navy" iconRight="send" loading={send.isPending} disabled={!body} onClick={() => send.mutate(body)}>
                Yuborish
              </Button>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-surface-container-low p-3 text-body-sm text-on-surface-variant">
              <Icon name="info" size={18} className="mt-px shrink-0 text-outline" />
              <span>
                Ustoz {teacher.responseTime ? `${teacher.responseTime.replace(/^odatda\s*/i, "odatda ")} ichida` : "imkon qadar tez"} javob beradi.
                {data.lesson.branch?.phone ? (
                  <>
                    {" "}
                    Shoshilinch masalalarda filial: <a href={`tel:${data.lesson.branch.phone}`} className="font-semibold text-on-surface">{fmtPhone(data.lesson.branch.phone)}</a>
                  </>
                ) : null}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryCard({ data }: { data: LessonDetailData }) {
  const items = data.questions.items;
  return (
    <Card>
      <CardHeader icon="forum" title="Shu dars boʻyicha muloqot" badge={items.length ? <Badge>{items.length}</Badge> : null} />
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">Bu dars boʻyicha hali savol yuborilmagan.</p>
        ) : (
          items.map((m) =>
            m.mine ? (
              <div key={m.id} className="ml-auto flex max-w-[90%] flex-col items-end">
                <div className="mb-1 flex items-baseline gap-2 text-body-sm">
                  <span className="font-label-md text-label-md text-on-surface">Siz</span>
                  <span className="text-on-surface-muted">{fmtRelDateTime(m.createdAt)}</span>
                </div>
                <div className="whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-primary-fixed px-3.5 py-2.5 text-body-md text-on-surface">{m.body}</div>
                {m.files.length ? <FileChips files={m.files} className="mt-1.5 justify-end" /> : null}
              </div>
            ) : (
              <div key={m.id} className="flex max-w-[90%] flex-col items-start">
                <div className="mb-1 flex flex-wrap items-baseline gap-2 text-body-sm">
                  <span className="font-label-md text-label-md text-on-surface">{m.sender.fullName}</span>
                  <Badge tone="primary" shape="square">
                    {m.sender.role === "TEACHER" ? "Ustoz" : "Maʼmuriyat"}
                  </Badge>
                  <span className="text-on-surface-muted">{fmtRelDateTime(m.createdAt)}</span>
                </div>
                <div className="whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-body-md text-on-surface">{m.body}</div>
                {m.files.length ? <FileChips files={m.files} className="mt-1.5" /> : null}
              </div>
            ),
          )
        )}
        {data.questions.threadId ? (
          <Link to={contactLink({ threadId: data.questions.threadId })} className={buttonVariants({ variant: "secondary", block: true, className: "text-primary" })}>
            Barcha yozishmalarni koʻrish
            <Icon name="arrow_forward" size={18} />
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
