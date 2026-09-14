import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ConfirmDialog,
  Icon,
  Input,
  Skeleton,
  Textarea,
  buttonVariants,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { fmtNum, fmtRelDateTime, gradeTone } from "@/lib/format";
import { useDocumentTitle } from "@/lib/hooks";
import { toastError, useApiQuery } from "@/lib/query";
import type { FileMeta } from "@/lib/types";
import { AudioRecorder } from "./components/AudioRecorder";
import { CoinChip, ErrorState, FileChip, HwStateBadge, MaterialRow, dueText, leftText, useNow } from "./components/common";
import type { DraftResponse, HomeworkDetail, SubmitResponse } from "./components/types";

const TEXT_MAX = 5000;
const ACCEPT: Record<string, string> = {
  AUDIO: "audio/*,.mp3,.m4a,.wav,.ogg,.webm,image/*,.pdf",
  FILE: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.webp,.gif,.mp3,.m4a,.wav,.ogg,.webm,.mp4,.zip",
  TEXT: "image/*,.pdf,.doc,.docx",
};

export default function StudentHomeworkDoPage() {
  const { homeworkId = "" } = useParams();
  const { data: hw, isLoading, error, refetch } = useApiQuery<HomeworkDetail>(["student", "homework", "detail", homeworkId], `/student/homework/${homeworkId}`);
  useDocumentTitle(hw?.title ?? "Uyga vazifa");

  if (isLoading) return <DetailSkeleton />;
  if (error || !hw) {
    return (
      <Card>
        <ErrorState
          error={error}
          onRetry={() => void refetch()}
          notFoundTitle="Vazifa topilmadi"
          action={
            <Link to="/oquvchi/vazifalar" className={buttonVariants({ variant: "outline" })}>
              Uyga vazifalar roʻyxati
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <TopBar hw={hw} />
      <Hero hw={hw} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
          <Instructions hw={hw} />
          <Materials hw={hw} />
          {hw.state === "REVIEWED" ? <ReviewedView hw={hw} /> : hw.state === "SUBMITTED" ? <SubmittedView hw={hw} /> : hw.canEdit ? <AnswerEditor key={hw.id} hw={hw} /> : <ClosedNote />}
        </div>
        <aside className="flex min-w-0 flex-col gap-6 lg:col-span-4">
          <TeacherCard hw={hw} />
          <CriteriaCard hw={hw} />
          {hw.canEdit ? <StreakCard hw={hw} /> : null}
          <PreviousCard hw={hw} />
        </aside>
      </div>
    </div>
  );
}

// ─────────────────────────── sarlavha ───────────────────────────

function TopBar({ hw }: { hw: HomeworkDetail }) {
  const state =
    hw.state === "NEW" || hw.state === "DRAFT"
      ? `Holat: ${hw.state === "DRAFT" ? "Jarayonda" : "Boshlanmagan"} (Topshirilmagan)`
      : `Holat: ${hw.stateLabel}`;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 font-label-md text-label-md text-on-surface-variant">
        <Link to="/oquvchi/vazifalar" className="inline-flex items-center gap-1 text-primary hover:underline">
          <Icon name="arrow_back" size={16} />
          Uyga vazifalar roʻyxatiga qaytish
        </Link>
        <span className="hidden text-outline sm:inline">|</span>
        <span className="hidden items-center gap-1 sm:inline-flex">
          <Link to="/oquvchi" className="hover:text-primary">
            Bosh sahifa
          </Link>
          <Icon name="chevron_right" size={14} className="text-outline" />
          <Link to="/oquvchi/vazifalar" className="hover:text-primary">
            Uyga vazifalar
          </Link>
          <Icon name="chevron_right" size={14} className="text-outline" />
          <span className="max-w-[16rem] truncate text-on-surface" aria-current="page">
            {hw.title}
          </span>
        </span>
      </nav>
      <span className="inline-flex items-center gap-2 self-start rounded-full bg-surface-container px-3 py-1 font-label-md text-label-md text-on-surface-variant">
        <span className={cn("h-2 w-2 rounded-full", hw.state === "REVIEWED" ? "bg-success" : hw.state === "SUBMITTED" ? "bg-primary" : hw.overdue ? "bg-error" : "bg-outline")} />
        {state}
      </span>
    </div>
  );
}

function Hero({ hw }: { hw: HomeworkDetail }) {
  const now = useNow(30_000);
  const left = leftText(hw.dueAt, now);
  const done = hw.state === "SUBMITTED" || hw.state === "REVIEWED";
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-navy p-5 text-on-primary shadow-card sm:p-7">
      <div aria-hidden="true" className="bg-dots pointer-events-none absolute inset-0" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 lg:max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-on-primary/15 px-2.5 py-0.5 font-label-sm text-label-sm">
              {hw.topic ? `Unit ${hw.topic.unit} · ` : ""}
              {hw.typeLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 font-label-sm text-label-sm text-on-tertiary-fixed">
              <Icon name="toll" filled size={14} />
              Mukofot: +{hw.reward.onTime} tanga
            </span>
          </div>
          <h1 className="mt-3 break-words font-headline-xl-mobile text-headline-xl-mobile sm:font-headline-xl sm:text-headline-xl">{hw.title}</h1>
          {hw.description ? <p className="mt-2 text-body-md text-on-primary/85">{hw.description}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-on-primary/15 bg-on-primary/10 p-4 backdrop-blur-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-on-primary/15">
            <Icon name={done ? "task_alt" : "alarm"} size={28} className="text-gold" />
          </span>
          <div>
            <p className="font-label-sm text-label-sm uppercase tracking-wide text-on-primary/75">{done ? "Topshirildi" : "Topshirish muddati"}</p>
            <p className="font-headline-md text-headline-md">
              {done && hw.submission?.submittedAt ? fmtRelDateTime(hw.submission.submittedAt) : dueText(hw.dueAt)}
            </p>
            {!done ? (
              <p className={cn("mt-0.5 inline-flex items-center gap-1 font-label-md text-label-md", hw.overdue ? "text-on-primary" : "text-gold")}>
                <Icon name={hw.overdue ? "error" : "hourglass_top"} size={14} />
                {hw.overdue ? "Muddat oʻtgan — hali ham topshirishingiz mumkin" : left}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── yo'riqnoma va materiallar ───────────────────────────

function Instructions({ hw }: { hw: HomeworkDetail }) {
  const { steps, vocabulary, tip } = hw.content;
  if (!steps.length && !vocabulary.length && !tip) return null;
  return (
    <Card>
      <CardHeader
        title="Topshiriq yoʻriqnomasi"
        icon="checklist"
        description={steps.length ? `Ustoz tomonidan belgilangan ${steps.length} ta aniq bosqich` : "Ustoz koʻrsatmalari"}
        action={steps.length ? <Badge tone="primary">{steps.length} bosqich</Badge> : undefined}
      />
      <CardContent className="flex flex-col gap-3">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-3 rounded-xl bg-surface-container-low p-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-label-md text-label-md text-on-primary">{i + 1}</span>
            <div className="min-w-0">
              {s.title ? <p className="font-label-lg text-label-lg text-on-surface">{s.title}</p> : null}
              {s.text ? <p className={cn("text-body-md text-on-surface-variant", s.title && "mt-1")}>{s.text}</p> : null}
            </div>
          </div>
        ))}
        {vocabulary.length ? (
          <div className="rounded-xl border border-outline-variant/70 p-4">
            <p className="flex items-center gap-1.5 font-label-lg text-label-lg text-on-surface">
              <Icon name="translate" size={18} className="text-primary" />
              Yangi soʻzlar ({vocabulary.length} ta)
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {vocabulary.map((w) => (
                <span key={w} className="rounded-full bg-primary-fixed px-2.5 py-1 text-body-sm text-on-primary-fixed">
                  {w}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {tip ? (
          <div className="flex items-start gap-2.5 rounded-xl bg-tertiary-fixed/60 p-4 text-body-md text-on-surface">
            <Icon name="lightbulb" size={20} className="mt-px text-on-tertiary-fixed-variant" />
            <p>
              <b className="text-on-tertiary-fixed-variant">Kichik maslahat:</b> {tip}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Materials({ hw }: { hw: HomeworkDetail }) {
  const n = hw.attachments.length + hw.lessonMaterials.length;
  if (!n) return null;
  return (
    <Card>
      <CardHeader title="Topshiriq materiallari va qoʻllanmalar" icon="folder_special" description="Yuklab olish yoki tinglash uchun" action={<Badge tone="primary">{n} ta fayl</Badge>} />
      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {hw.attachments.map((f) => (
          <FileChip key={f.id} f={f} />
        ))}
        {hw.lessonMaterials.map((m) => (
          <MaterialRow key={m.id} m={m} />
        ))}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────── javob muharriri ───────────────────────────

type SaveState = "idle" | "saving" | "saved" | "error";

function AnswerEditor({ hw }: { hw: HomeworkDetail }) {
  const qc = useQueryClient();
  const { refreshMe } = useAuth();
  const key = ["student", "homework", "detail", hw.id];
  const sub = hw.submission;
  const files = sub?.files ?? [];
  const isQuiz = hw.type === "QUIZ";
  const questions = hw.content.questions;

  const [text, setText] = useState(sub?.text ?? "");
  const [answers, setAnswers] = useState<Record<string, string | number>>(sub?.answers ?? {});
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>(sub ? "saved" : "idle");
  const [savedAt, setSavedAt] = useState<string | null>(sub?.updatedAt ?? null);
  const [uploading, setUploading] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const latest = useRef({ text, answers });
  latest.current = { text, answers };
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const payload = useCallback(
    () => (isQuiz ? { answers: latest.current.answers } : { text: latest.current.text }),
    [isQuiz],
  );

  /** Qoralamani saqlash (so'rovlar navbat bilan — autosave va fayl yuklash to'qnashmaydi). */
  const saveDraft = useCallback(
    (extra: { fileIds?: string[] } = {}) => {
      const run = async () => {
        setSaveState("saving");
        try {
          const res = await api.put<DraftResponse>(`/student/homework/${hw.id}/draft`, { ...payload(), ...extra });
          qc.setQueryData<HomeworkDetail>(key, (old) => (old ? { ...old, submission: res.submission, state: res.state, stateLabel: res.stateLabel } : old));
          setSaveState("saved");
          setSavedAt(res.submission.updatedAt);
          return res;
        } catch (e) {
          setSaveState("error");
          throw e;
        }
      };
      const p = queue.current.then(run, run);
      queue.current = p.catch(() => {});
      return p;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hw.id, payload, qc],
  );

  // Autosave: yozishdan to'xtagandan 1.2 s keyin
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      setDirty(false);
      saveDraft().catch(() => {});
    }, 1200);
    return () => clearTimeout(t);
  }, [text, answers, dirty, saveDraft]);

  const uploadFiles = async (list: File[]) => {
    const room = Math.min(5, hw.requirements.maxFiles - files.length);
    if (room <= 0) {
      toast.error(`Koʻpi bilan ${hw.requirements.maxFiles} ta fayl biriktirish mumkin`);
      throw new Error("limit");
    }
    const pick = list.slice(0, room);
    if (list.length > room) toast.message(`Faqat ${room} ta fayl yuklanadi`);
    setUploading(pick.map((f) => f.name));
    try {
      const fd = new FormData();
      pick.forEach((f) => fd.append("files", f));
      const up = await api.upload<{ files: FileMeta[] }>("/files", fd);
      await saveDraft({ fileIds: up.files.map((f) => f.id) });
      void qc.invalidateQueries({ queryKey: ["student", "dashboard"] });
      toast.success(pick.length > 1 ? "Fayllar qoralamaga saqlandi" : "Fayl qoralamaga saqlandi");
    } catch (e) {
      toastError(e, "Faylni yuklab boʻlmadi");
      throw e;
    } finally {
      setUploading([]);
    }
  };

  const removeFile = async (f: FileMeta) => {
    setDeleting(f.id);
    try {
      await api.delete(`/student/homework/${hw.id}/files/${f.id}`);
      qc.setQueryData<HomeworkDetail>(key, (old) =>
        old?.submission ? { ...old, submission: { ...old.submission, files: old.submission.files.filter((x) => x.id !== f.id) } } : old,
      );
      void qc.invalidateQueries({ queryKey: ["student", "dashboard"] });
    } catch (e) {
      toastError(e);
    } finally {
      setDeleting(null);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const list = Array.from(e.dataTransfer.files ?? []);
    if (list.length) uploadFiles(list).catch(() => {});
  };

  const answered = questions.filter((q) => answers[q.id] !== undefined && String(answers[q.id]).trim() !== "").length;
  const missing =
    hw.type === "AUDIO" && !files.length
      ? "Topshirish uchun audio yozing yoki audio faylni yuklang"
      : hw.type === "FILE" && !files.length
        ? "Topshirish uchun kamida bitta fayl yuklang"
        : hw.type === "TEXT" && !text.trim()
          ? "Topshirish uchun javob matnini yozing"
          : isQuiz && answered < questions.length
            ? `Barcha savollarga javob bering (${questions.length} tadan ${answered} tasi belgilangan)`
            : null;

  const submit = async () => {
    try {
      const r = await api.post<SubmitResponse>(`/student/homework/${hw.id}/submit`, payload());
      toast.success(r.expectedCoins ? `Vazifa topshirildi! Ustoz tekshirgach +${r.expectedCoins} tanga olasiz.` : "Vazifa topshirildi!");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["student"] }),
        qc.invalidateQueries({ queryKey: ["me", "nav-badges"] }),
        refreshMe().catch(() => null),
      ]);
    } catch (e) {
      toastError(e);
      throw e;
    }
  };

  const teacherName = hw.teacher?.fullName;

  return (
    <Card>
      <CardHeader
        title="Javobingizni topshirish"
        icon="cloud_upload"
        description={
          isQuiz
            ? `Har bir savolga javob belgilang${hw.content.timeLimitMin ? ` · tavsiya etilgan vaqt: ${hw.content.timeLimitMin} daqiqa` : ""}`
            : "Fayllar, audio yozuv va oʻz izohingizni biriktiring"
        }
        action={
          !isQuiz ? (
            <Badge tone={files.length ? "gold" : "neutral"}>{files.length ? `${files.length} ta fayl tayyor` : "Fayl yoʻq"}</Badge>
          ) : (
            <Badge tone={answered === questions.length && questions.length ? "success" : "neutral"}>
              {answered} / {questions.length}
            </Badge>
          )
        }
      />
      <CardContent className="flex flex-col gap-5">
        {hw.state === "RETURNED" ? (
          <Alert tone="warning" icon="undo" title="Ustoz vazifani qayta ishlashga qaytardi">
            {sub?.feedback ? `«${sub.feedback}»` : "Izohlarni koʻrib chiqing, javobni tuzating va qayta topshiring."}
          </Alert>
        ) : null}

        {isQuiz ? (
          <QuizForm
            questions={questions}
            answers={answers}
            onChange={(id, v) => {
              setAnswers((a) => ({ ...a, [id]: v }));
              setDirty(true);
            }}
          />
        ) : (
          <>
            {hw.type === "AUDIO" ? <AudioRecorder onSave={(f) => uploadFiles([f])} disabled={!!uploading.length} /> : null}

            <div>
              <p className="mb-2 font-label-lg text-label-lg text-on-surface">{hw.type === "AUDIO" ? "Daftar rasmi yoki audio faylni yuklash" : "Fayl yuklash"}</p>
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
                  dragOver ? "border-primary bg-primary-light" : "border-outline-variant bg-surface-container-low hover:border-primary/60",
                )}
              >
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept={ACCEPT[hw.type]}
                  className="sr-only"
                  onChange={(e) => {
                    const list = Array.from(e.target.files ?? []);
                    e.target.value = "";
                    if (list.length) uploadFiles(list).catch(() => {});
                  }}
                />
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-lowest text-primary shadow-card">
                  <Icon name={uploading.length ? "hourglass_top" : "add_a_photo"} size={26} />
                </span>
                <p className="mt-3 font-label-lg text-label-lg text-on-surface">
                  {uploading.length ? `Yuklanmoqda: ${uploading.join(", ")}` : (
                    <>
                      Fayllarni shu yerga sudrab keltiring yoki <span className="text-primary underline">tanlang</span>
                    </>
                  )}
                </p>
                <p className="mt-1 text-body-sm text-on-surface-muted">Rasm, audio yoki hujjat: PNG, JPG, PDF, MP3, M4A, WAV</p>
              </label>
            </div>

            {files.length ? (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-label-lg text-label-lg text-on-surface">
                    Yuklangan fayllaringiz ({files.length}/{hw.requirements.maxFiles}):
                  </p>
                  <span className="font-label-md text-label-md text-success">Qoralamada saqlangan</span>
                </div>
                <div className="flex flex-col gap-2">
                  {files.map((f) => (
                    <FileChip key={f.id} f={f} onDelete={() => void removeFile(f)} deleting={deleting === f.id} />
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label htmlFor="hw-text" className="font-label-lg text-label-lg text-on-surface">
                  {hw.type === "TEXT" ? "Javobingiz:" : "Matnli javob yoki izohingiz:"}
                </label>
                <span className="text-body-sm tabular-nums text-on-surface-muted">
                  {fmtNum(text.length)} / {fmtNum(TEXT_MAX)} ta belgi
                </span>
              </div>
              <Textarea
                id="hw-text"
                rows={5}
                maxLength={TEXT_MAX}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setDirty(true);
                }}
                placeholder={hw.type === "TEXT" ? "Javobingizni shu yerga yozing…" : "Masalan: eng yoqqan yangi iboram — …"}
              />
            </div>
          </>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              icon="save"
              loading={saveState === "saving"}
              onClick={() =>
                saveDraft()
                  .then(() => toast.success("Qoralama saqlandi"))
                  .catch((e) => toastError(e))
              }
            >
              Qoralama sifatida saqlash
            </Button>
            <SaveStatus state={saveState} at={savedAt} />
          </div>
          <Button size="lg" iconRight="send" disabled={!!missing || !!uploading.length} onClick={() => setConfirmOpen(true)} className="w-full sm:w-auto">
            Topshirish
          </Button>
        </div>
        {missing ? (
          <p className="-mt-2 flex items-center gap-1.5 text-body-sm text-on-surface-muted sm:justify-end">
            <Icon name="info" size={16} />
            {missing}
          </p>
        ) : null}

        <div className="flex items-start gap-2.5 rounded-xl bg-surface-container-low p-3.5 text-body-sm text-on-surface-variant">
          <Icon name="info" size={18} className="mt-px text-primary" />
          <p>
            Topshirilgandan soʻng holat avtomatik ravishda <b>«Tekshiruvda»</b> ga oʻzgaradi va {teacherName ? `ustoz ${teacherName}` : "ustoz"} tekshiruviga yuboriladi.
            Tanga ustoz tekshirgandan keyin beriladi: oʻz vaqtida topshirilsa <b>+{hw.reward.onTime} tanga</b>.
          </p>
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        tone="primary"
        title="Vazifani topshirasizmi?"
        description={
          `Topshirilgandan soʻng javobni oʻzgartirib boʻlmaydi. ${teacherName ? `Ustoz ${teacherName}` : "Ustoz"} tekshiradi.` +
          (hw.overdue
            ? " Muddat oʻtgan — vazifa kechikkan deb belgilanadi va bu safar tanga berilmaydi."
            : ` Oʻz vaqtida topshirilgani uchun tekshiruvdan keyin +${hw.reward.onTime} tanga olasiz.`)
        }
        confirmLabel="Topshirish"
        cancelLabel="Hali emas"
        onConfirm={submit}
      />
    </Card>
  );
}

function SaveStatus({ state, at }: { state: SaveState; at: string | null }) {
  if (state === "saving")
    return (
      <span className="inline-flex items-center gap-1 text-body-sm text-on-surface-muted">
        <Icon name="sync" size={16} className="animate-spin" />
        Saqlanmoqda…
      </span>
    );
  if (state === "error")
    return (
      <span className="inline-flex items-center gap-1 text-body-sm text-error">
        <Icon name="error" size={16} />
        Saqlanmadi — qayta urinib koʻring
      </span>
    );
  if (state === "saved" && at)
    return (
      <span className="inline-flex items-center gap-1 text-body-sm text-on-surface-muted">
        <Icon name="cloud_done" size={16} className="text-success" />
        Saqlandi · {fmtRelDateTime(at)}
      </span>
    );
  return null;
}

function QuizForm({
  questions,
  answers,
  onChange,
  readOnly,
}: {
  questions: HomeworkDetail["content"]["questions"];
  answers: Record<string, string | number>;
  onChange?: (id: string, v: string | number) => void;
  readOnly?: boolean;
}) {
  if (!questions.length) return <Alert tone="warning">Bu testda savollar yoʻq — ustozga murojaat qiling.</Alert>;
  return (
    <div className="flex flex-col gap-3">
      {questions.map((q, i) => {
        const a = answers[q.id];
        const revealed = q.correct !== undefined;
        return (
          <div key={q.id} className="rounded-xl bg-surface-container-low p-4">
            <p id={`q-${q.id}`} className="flex gap-2 font-label-lg text-label-lg text-on-surface">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] text-on-primary">{i + 1}</span>
              <span className="pt-0.5">{q.text}</span>
            </p>
            {q.options ? (
              <div role="radiogroup" aria-labelledby={`q-${q.id}`} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {q.options.map((o, oi) => {
                  const sel = a === oi;
                  const ok = revealed && Number(q.correct) === oi;
                  return (
                    <button
                      key={oi}
                      type="button"
                      role="radio"
                      aria-checked={sel}
                      disabled={readOnly}
                      onClick={() => onChange?.(q.id, oi)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-body-md transition-colors disabled:cursor-default",
                        sel ? "border-primary bg-primary-fixed text-on-primary-fixed" : "border-outline-variant bg-surface-container-lowest text-on-surface",
                        !readOnly && !sel && "hover:border-primary/60",
                        ok && "border-success bg-success-container text-on-success-container",
                      )}
                    >
                      <Icon name={sel ? "radio_button_checked" : "radio_button_unchecked"} size={18} className={sel ? "text-primary" : "text-outline"} />
                      <span className="min-w-0 flex-1">{o}</span>
                      {ok ? <Icon name="check" size={18} className="text-success" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : readOnly ? (
              <p className="mt-3 rounded-lg bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface">{a != null && a !== "" ? String(a) : "—"}</p>
            ) : (
              <Input className="mt-3" value={a != null ? String(a) : ""} maxLength={2000} placeholder="Javobingiz" aria-labelledby={`q-${q.id}`} onChange={(e) => onChange?.(q.id, e.target.value)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────── topshirilgan / tekshirilgan ───────────────────────────

function AnswerReadonly({ hw }: { hw: HomeworkDetail }) {
  const s = hw.submission;
  if (!s) return null;
  return (
    <div className="flex flex-col gap-3">
      {hw.type === "QUIZ" ? <QuizForm questions={hw.content.questions} answers={s.answers ?? {}} readOnly /> : null}
      {s.files.length ? (
        <div className="flex flex-col gap-2">
          <p className="font-label-lg text-label-lg text-on-surface">Topshirilgan fayllar ({s.files.length}):</p>
          {s.files.map((f) => (
            <FileChip key={f.id} f={f} />
          ))}
        </div>
      ) : null}
      {s.text ? (
        <div>
          <p className="mb-1.5 font-label-lg text-label-lg text-on-surface">Matnli javob:</p>
          <p className="whitespace-pre-wrap break-words rounded-xl bg-surface-container-low p-4 text-body-md text-on-surface">{s.text}</p>
        </div>
      ) : null}
    </div>
  );
}

function SubmittedView({ hw }: { hw: HomeworkDetail }) {
  const s = hw.submission!;
  return (
    <Card>
      <CardHeader
        title="Javobingiz topshirildi"
        icon="hourglass_top"
        description={s.submittedAt ? `Topshirildi: ${fmtRelDateTime(s.submittedAt)}${s.isLate ? " · muddatidan keyin" : ""}` : undefined}
        action={<HwStateBadge state="SUBMITTED" />}
      />
      <CardContent className="flex flex-col gap-4">
        <Alert tone={s.isLate ? "warning" : "primary"} icon="toll">
          {s.isLate
            ? "Vazifa muddatidan keyin topshirildi — bu safar tanga berilmaydi. Keyingi vazifani oʻz vaqtida topshirishga harakat qiling."
            : `Ustoz tekshirgach, oʻz vaqtida topshirganingiz uchun +${hw.reward.onTime} tanga olasiz. Natija va izoh shu sahifada koʻrinadi.`}
        </Alert>
        <AnswerReadonly hw={hw} />
      </CardContent>
    </Card>
  );
}

function ReviewedView({ hw }: { hw: HomeworkDetail }) {
  const s = hw.submission!;
  return (
    <Card>
      <CardHeader
        title="Ustoz tekshirdi"
        icon="task_alt"
        description={s.reviewedAt ? `${s.reviewer?.fullName ?? "Ustoz"} · ${fmtRelDateTime(s.reviewedAt)}` : undefined}
        action={<HwStateBadge state="REVIEWED" />}
      />
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-xl bg-surface-container-low p-4">
            <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display-sm text-display-sm", s.score != null ? (s.score >= 5 ? "bg-success-container text-on-success-container" : s.score === 4 ? "bg-primary-fixed text-primary" : "bg-warning-container text-on-warning-container") : "bg-surface-container text-on-surface-variant")}>
              {s.score ?? "—"}
            </span>
            <div>
              <p className="text-body-sm text-on-surface-muted">Baho</p>
              <p className="font-headline-md text-headline-md text-on-surface">{s.scoreLabel ?? "Baholanmagan"}</p>
              {s.score != null ? (
                <Badge tone={gradeTone(s.score)} className="mt-1">
                  5 ballik tizimda
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-surface-container-low p-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-tertiary-fixed">
              <Icon name="toll" filled size={30} className="text-on-tertiary-fixed-variant" />
            </span>
            <div className="min-w-0">
              <p className="text-body-sm text-on-surface-muted">Kumush tanga</p>
              {s.coinsAwarded > 0 ? (
                <p className="font-headline-md text-headline-md text-on-surface">+{fmtNum(s.coinsAwarded)} tanga olindi</p>
              ) : (
                <p className="font-label-lg text-label-lg text-on-surface-variant">{s.isLate ? "Kechikib topshirilgani uchun tanga berilmadi" : "Bu vazifa uchun tanga berilmadi"}</p>
              )}
            </div>
          </div>
        </div>
        {s.feedback ? (
          <div className="rounded-xl border border-outline-variant/70 p-4">
            <p className="flex items-center gap-1.5 font-label-lg text-label-lg text-on-surface">
              <Icon name="rate_review" size={18} className="text-primary" />
              Ustoz taqrizi
            </p>
            <p className="mt-2 whitespace-pre-wrap text-body-md italic text-on-surface-variant">«{s.feedback}»</p>
          </div>
        ) : null}
        <AnswerReadonly hw={hw} />
      </CardContent>
    </Card>
  );
}

function ClosedNote() {
  return (
    <Card>
      <CardContent>
        <Alert tone="primary" icon="lock">
          Bu guruhdagi vazifalarni endi topshirib boʻlmaydi. Savollar boʻlsa, ustozga yozing.
        </Alert>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────── yon panel ───────────────────────────

function TeacherCard({ hw }: { hw: HomeworkDetail }) {
  const t = hw.teacher;
  if (!t) return null;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <Avatar name={t.fullName} src={t.avatarUrl} size="lg" />
        <div className="min-w-0">
          <p className="font-headline-sm text-headline-sm text-on-surface">{t.fullName}</p>
          <p className="truncate font-label-md text-label-md text-primary">
            {t.title ?? "Guruh ustozi"}
            {t.specialization ? ` · ${t.specialization}` : ""}
          </p>
        </div>
      </div>
      <p className="mt-3 text-body-md text-on-surface-variant">Vazifa boʻyicha tushunarsiz joy bormi? Ikkilanmasdan ustozingizga savol yoʻllang.</p>
      <Link to={`/oquvchi/chat?to=${t.id}`} className={buttonVariants({ variant: "secondary", block: true, className: "mt-4 text-primary" })}>
        <Icon name="chat" size={18} />
        Ustozga savol berish
      </Link>
    </Card>
  );
}

function CriteriaCard({ hw }: { hw: HomeworkDetail }) {
  const c = hw.content.criteria;
  const max = c.reduce((a, b) => a + (b.points ?? 0), 0);
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-headline-sm text-headline-sm text-on-surface">
          <Icon name="rule" size={20} className="text-primary" />
          {c.length ? "Baholash mezonlari" : "Baholash"}
        </p>
        {max ? <Badge tone="gold">Maks. {max} ball</Badge> : null}
      </div>
      {c.length ? (
        <ul className="mt-3 flex flex-col gap-2">
          {c.map((x) => (
            <li key={x.label} className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low px-3 py-2.5 text-body-md">
              <span className="min-w-0 text-on-surface">{x.label}</span>
              {x.points != null ? <span className="shrink-0 font-label-lg text-label-lg text-on-surface">{x.points} ball</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-body-md text-on-surface-variant">Ustoz javobingizni 5 ballik tizimda baholaydi va izoh qoldiradi.</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-body-sm text-on-surface-muted">
        Mukofot:
        <CoinChip amount={hw.reward.onTime} />
        <span>(oʻz vaqtida topshirilsa)</span>
      </div>
    </Card>
  );
}

function StreakCard({ hw }: { hw: HomeworkDetail }) {
  const s = hw.streak;
  let body: ReactNode;
  if (s.activeToday) body = <>Bugun faol boʻldingiz — {s.days} kunlik seriyangiz davom etmoqda.</>;
  else if (s.days > 0)
    body = (
      <>
        Bugun topshirsangiz, <b>{s.days} kunlik</b> seriyangiz <b>{s.days + 1} kunga</b> uzayadi (+{s.bonus} tanga).
      </>
    );
  else body = <>Bugun topshirsangiz, yangi seriya boshlanadi. Har kungi faollik uchun +{s.bonus} tanga.</>;
  return (
    <div className="flex items-start gap-3 rounded-xl bg-gradient-to-br from-tertiary-fixed to-gold p-5 shadow-card">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-container-lowest">
        <Icon name="local_fire_department" filled size={24} className="text-warning" />
      </span>
      <div className="min-w-0">
        <p className="font-headline-md text-headline-md text-on-tertiary-fixed">{s.activeToday ? "Seriya davom etmoqda" : "Seriyangizni davom ettiring"}</p>
        <p className="mt-1 text-body-md text-on-tertiary-fixed-variant">{body}</p>
      </div>
    </div>
  );
}

function PreviousCard({ hw }: { hw: HomeworkDetail }) {
  const p = hw.previous;
  if (!p) return null;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-headline-sm text-headline-sm text-on-surface">Oldingi vazifangiz</p>
        <Badge tone="primary">Tekshirilgan</Badge>
      </div>
      <Link to={`/oquvchi/vazifalar/${p.homework.id}`} className="mt-3 block rounded-xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 font-label-lg text-label-lg text-on-surface">{p.homework.title}</p>
          {p.score != null ? (
            <span className="shrink-0 font-label-lg text-label-lg text-primary">
              {p.score} ({p.scoreLabel})
            </span>
          ) : null}
        </div>
        {p.feedback ? (
          <div className="mt-2 rounded-lg bg-surface-container-lowest p-3">
            <p className="font-label-md text-label-md text-on-surface-variant">Ustoz taqrizi:</p>
            <p className="mt-1 text-body-sm italic text-on-surface-variant">«{p.feedback}»</p>
          </div>
        ) : null}
      </Link>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-6 w-72" />
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
