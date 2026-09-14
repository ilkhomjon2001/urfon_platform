// Topshiriqni tekshirish oynasi: javob (matn/audio/fayl/test), 2–5 baho, izoh, tanga ishorasi, navbat bo'yicha oldinga/orqaga.
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { Alert, Avatar, Badge, Button, Dialog, Icon, Skeleton, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { avgLabel, fmtAvg, fmtRelDateTime, gradeLabel } from "@/lib/format";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { INV, TB } from "./api";
import type { SubmissionDetail } from "./types";
import { FileTile, GRADE_SELECTED, GroupChip, QueryError, TYPE_META, TypeChip, whenLabel } from "./ui";

const QUICK_PHRASES = [
  "Ajoyib ish, shunday davom eting!",
  "Soʻz boyligingiz yaxshi.",
  "Talaffuzga koʻproq eʼtibor bering.",
  "Grammatik xatolarni qayta koʻrib chiqing.",
  "Javobni kengaytiring — koʻproq misol keltiring.",
  "Muddatga eʼtibor bering.",
];

export interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Navbatdagi topshiriq ID'lari (ochilganda suratga olinadi) */
  queue: string[];
  startId: string | null;
}

export function ReviewDialog({ open, onOpenChange, queue, startId }: ReviewDialogProps) {
  const qc = useQueryClient();
  const [snap, setSnap] = useState<{ ids: string[]; idx: number }>({ ids: [], idx: 0 });

  // Navbat oyna ochilganda suratga olinadi — tekshirilganlar ro'yxatdan chiqsa ham navigatsiya barqaror
  useEffect(() => {
    if (!open) {
      setSnap({ ids: [], idx: 0 });
      return;
    }
    setSnap((s) => {
      if (s.ids.length > 1) return s;
      const base = [...queue];
      if (startId && !base.includes(startId)) base.unshift(startId);
      const i = Math.max(0, startId ? base.indexOf(startId) : 0);
      // o'zgarmagan bo'lsa o'sha holat qaytadi (aks holda qayta-render sikli)
      return s.idx === i && s.ids.join("|") === base.join("|") ? s : { ids: base, idx: i };
    });
  }, [open, startId, queue]);

  const id = snap.ids[snap.idx] ?? null;
  const nextId = snap.ids[snap.idx + 1] ?? null;
  const q = useApiQuery<SubmissionDetail>([TB, "submission", id], id ? `/teacher/submissions/${id}` : null, { enabled: open });

  useEffect(() => {
    if (open && nextId) {
      void qc.prefetchQuery({ queryKey: [TB, "submission", nextId], queryFn: () => api.get<SubmissionDetail>(`/teacher/submissions/${nextId}`) });
    }
  }, [open, nextId, qc]);

  const go = (delta: number) => setSnap((s) => ({ ...s, idx: Math.min(s.ids.length - 1, Math.max(0, s.idx + delta)) }));

  const afterSave = (advance: boolean) => {
    if (advance && nextId) go(1);
    else if (advance) {
      toast.success("Navbatdagi barcha ishlar koʻrib chiqildi");
      onOpenChange(false);
    }
  };

  const total = snap.ids.length;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      title={
        <span className="flex flex-wrap items-center gap-2">
          Topshiriqni tekshirish
          {total > 1 ? (
            <Badge tone="primary" shape="square">
              {snap.idx + 1} / {total}
            </Badge>
          ) : null}
        </span>
      }
      description={q.data ? `${q.data.homework.title} · ${q.data.homework.group.name}` : "Yuklanmoqda…"}
      bodyClassName="p-0 sm:p-0"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon="chevron_left" disabled={snap.idx <= 0} onClick={() => go(-1)}>
              Oldingi
            </Button>
            <Button variant="outline" size="sm" iconRight="chevron_right" disabled={!nextId} onClick={() => go(1)}>
              Keyingi
            </Button>
          </div>
          <span className="hidden text-body-sm text-on-surface-muted md:inline">Tezkor tugmalar: 2–5 — baho, Ctrl+Enter — saqlash</span>
        </div>
      }
    >
      {q.isLoading || !id ? (
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : q.error ? (
        <QueryError error={q.error} onRetry={() => q.refetch()} />
      ) : q.data ? (
        <ReviewBody key={q.data.id} d={q.data} hasNext={!!nextId} onSaved={afterSave} />
      ) : null}
    </Dialog>
  );
}

function ReviewBody({ d, hasNext, onSaved }: { d: SubmissionDetail; hasNext: boolean; onSaved: (advance: boolean) => void }) {
  const [score, setScore] = useState<number | null>(d.score);
  const [feedback, setFeedback] = useState(d.feedback ?? "");
  const [err, setErr] = useState<string | null>(null);
  const canReview = d.status === "SUBMITTED" || d.status === "REVIEWED";
  const first = d.status === "SUBMITTED";

  const review = useApiMutation(
    (b: { score: number; feedback: string }) => api.post<SubmissionDetail>(`/teacher/submissions/${d.id}/review`, b),
    { invalidate: INV },
  );
  const ret = useApiMutation((b: { feedback: string }) => api.post<SubmissionDetail>(`/teacher/submissions/${d.id}/return`, b), {
    invalidate: [[TB]],
  });

  const save = async () => {
    if (!canReview || review.isPending) return;
    if (score == null) {
      setErr("Bahoni tanlang (2–5)");
      return;
    }
    setErr(null);
    const res = await review.mutateAsync({ score, feedback: feedback.trim() });
    const coins = res.coinsAwardedNow ?? 0;
    toast.success(`${d.student.fullName}: ${score} (${gradeLabel(score)})${coins ? ` · +${coins} tanga` : ""}`, {
      description: first ? "Oʻquvchi va ota-onasiga xabar yuborildi" : d.score !== score ? `Baho oʻzgartirildi: ${d.score} → ${score}` : "Izoh saqlandi",
    });
    onSaved(first);
  };

  const sendBack = async () => {
    if (feedback.trim().length < 3) {
      setErr("Qaytarish uchun nimani tuzatish kerakligini izohda yozing");
      return;
    }
    setErr(null);
    await ret.mutateAsync({ feedback: feedback.trim() });
    toast.success(`${d.student.fullName}ga qayta ishlash uchun qaytarildi`);
    onSaved(true);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const inText = (e.target as HTMLElement).tagName === "TEXTAREA" || (e.target as HTMLElement).tagName === "INPUT";
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void save().catch(() => {});
      return;
    }
    if (!inText && canReview && ["2", "3", "4", "5"].includes(e.key)) setScore(Number(e.key));
  };

  const addPhrase = (p: string) => setFeedback((f) => (f.trim() ? `${f.trim()} ${p}` : p));
  const hasContent = !!d.text || d.files.length > 0 || !!d.quiz;

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]" onKeyDown={onKey}>
      {/* Chap: javob */}
      <div className="min-w-0 space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={d.student.fullName} size="lg" />
            <div className="min-w-0">
              <div className="font-headline-sm text-headline-sm text-on-surface">{d.student.fullName}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-on-surface-muted">
                {d.student.code ? <span>#{d.student.code}</span> : null}
                <GroupChip group={d.homework.group} />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <TypeChip type={d.homework.type} />
            <span className="text-body-sm text-on-surface-variant">
              Topshirildi: {d.submittedAt ? fmtRelDateTime(d.submittedAt) : "—"}
            </span>
            {d.isLate ? (
              <Badge tone="warning" icon="schedule">
                Kechikkan (muddat {whenLabel(d.homework.dueAt)})
              </Badge>
            ) : (
              <Badge tone="success" icon="check_circle">
                Oʻz vaqtida
              </Badge>
            )}
          </div>
        </div>

        <details className="group rounded-xl border border-outline-variant bg-surface-container-low/60 p-3.5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-label-lg text-label-lg text-on-surface">
            <span className="flex items-center gap-2">
              <Icon name="assignment" size={18} className="text-primary" />
              Topshiriq sharti: {d.homework.title}
            </span>
            <Icon name="expand_more" className="text-on-surface-variant transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 space-y-3">
            {d.homework.description ? <p className="whitespace-pre-wrap text-body-md text-on-surface-variant">{d.homework.description}</p> : null}
            {d.homework.files.length ? (
              <div className="grid min-w-0 grid-cols-1 gap-2">
                {d.homework.files.map((f) => (
                  <FileTile key={f.id} file={f} />
                ))}
              </div>
            ) : null}
            {!d.homework.description && !d.homework.files.length ? <p className="text-body-sm text-on-surface-muted">Qoʻshimcha koʻrsatma yoʻq.</p> : null}
          </div>
        </details>

        <section className="space-y-3">
          <h3 className="flex items-center gap-2 font-headline-sm text-headline-sm text-on-surface">
            <Icon name={TYPE_META[d.homework.type].icon} size={20} className="text-primary" />
            Oʻquvchi javobi
          </h3>
          {d.text ? (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
              <p className="whitespace-pre-wrap break-words text-body-lg leading-relaxed text-on-surface">{d.text}</p>
              <p className="mt-3 border-t border-surface-container pt-2 text-body-sm text-on-surface-muted">{d.wordCount} ta soʻz</p>
            </div>
          ) : null}
          {d.files.length ? (
            <div className="grid min-w-0 grid-cols-1 gap-2">
              {d.files.map((f) => (
                <FileTile key={f.id} file={f} />
              ))}
            </div>
          ) : null}
          {d.quiz ? <QuizBreakdown quiz={d.quiz} /> : null}
          {!hasContent ? (
            <p className="rounded-xl border border-dashed border-outline-variant p-6 text-center text-body-md text-on-surface-muted">Javob matni yoki fayl yoʻq</p>
          ) : null}
        </section>
      </div>

      {/* O'ng: baholash */}
      <aside className="space-y-4 border-t border-outline-variant bg-surface-container-low/50 p-5 sm:p-6 lg:border-l lg:border-t-0">
        {d.status === "RETURNED" ? (
          <Alert tone="warning" title="Qayta ishlashga qaytarilgan">
            Oʻquvchi qayta topshirgach baholay olasiz.
            {d.feedback ? <span className="mt-1 block italic">“{d.feedback}”</span> : null}
          </Alert>
        ) : null}
        {d.status === "REVIEWED" ? (
          <Alert tone="success" icon="task_alt" title={`Tekshirilgan: ${d.score} (${gradeLabel(d.score)})`}>
            {d.reviewer ? `${d.reviewer.fullName}, ` : ""}
            {d.reviewedAt ? fmtRelDateTime(d.reviewedAt) : ""}. Bahoni oʻzgartirsangiz, tizim jurnaliga yoziladi.
          </Alert>
        ) : null}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-label-lg text-label-lg text-on-surface">Baho</span>
            {d.quiz ? (
              <button
                type="button"
                disabled={!canReview}
                onClick={() => setScore(d.quiz!.suggested)}
                className="text-body-sm font-semibold text-primary hover:underline disabled:opacity-50"
              >
                Tavsiya: {d.quiz.suggested} ({d.quiz.percent}%)
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-4 gap-2 lg:grid-cols-2">
            {[5, 4, 3, 2].map((v) => (
              <button
                key={v}
                type="button"
                disabled={!canReview}
                aria-pressed={score === v}
                onClick={() => {
                  setScore(v);
                  setErr(null);
                }}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border-2 px-1 py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  score === v ? GRADE_SELECTED[v] : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/50",
                )}
              >
                <span className="font-display text-[22px] font-extrabold leading-none">{v}</span>
                <span className="mt-1 font-label-sm text-label-sm">{gradeLabel(v)}</span>
              </button>
            ))}
          </div>
        </div>

        {d.coinsAwarded > 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-tertiary-fixed px-3 py-2 text-body-sm font-semibold text-on-tertiary-fixed-variant">
            <Icon name="toll" size={18} />+{d.coinsAwarded} tanga berilgan
          </div>
        ) : d.coinsOnReview > 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-tertiary-fixed px-3 py-2 text-body-sm font-semibold text-on-tertiary-fixed-variant">
            <Icon name="toll" size={18} />+{d.coinsOnReview} tanga — oʻz vaqtida topshirilgan
          </div>
        ) : d.isLate ? (
          <div className="flex items-center gap-2 rounded-lg bg-warning-container px-3 py-2 text-body-sm font-medium text-on-warning-container">
            <Icon name="info" size={18} />
            Kechikkan — baho qoʻyiladi, tanga berilmaydi
          </div>
        ) : null}

        <div>
          <label htmlFor="rv-feedback" className="mb-1.5 block font-label-lg text-label-lg text-on-surface">
            Izoh (oʻquvchi va ota-onaga koʻrinadi)
          </label>
          <Textarea
            id="rv-feedback"
            rows={4}
            value={feedback}
            disabled={d.status === "RETURNED"}
            onChange={(e) => {
              setFeedback(e.target.value);
              setErr(null);
            }}
            placeholder="Nimasi yaxshi, nimani yaxshilash kerak…"
            maxLength={2000}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_PHRASES.map((p) => (
              <button
                key={p}
                type="button"
                disabled={d.status === "RETURNED"}
                onClick={() => addPhrase(p)}
                className="rounded-full border border-outline-variant bg-surface-container-lowest px-2.5 py-1 text-[11.5px] text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {err ? (
          <p className="flex items-center gap-1.5 text-body-sm text-error">
            <Icon name="error" size={16} />
            {err}
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          <Button block icon="grading" onClick={() => void save().catch(() => {})} loading={review.isPending} disabled={!canReview || ret.isPending}>
            {first ? (hasNext ? "Baholash va keyingisi" : "Baholash") : "Bahoni saqlash"}
          </Button>
          {d.status === "SUBMITTED" ? (
            <Button block variant="outline" icon="undo" onClick={() => void sendBack().catch(() => {})} loading={ret.isPending} disabled={review.isPending}>
              Qayta ishlashga qaytarish
            </Button>
          ) : null}
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3 text-body-sm">
          <div className="text-on-surface-muted">Uyga vazifalar boʻyicha oʻrtacha baho</div>
          <div className="mt-0.5 font-semibold text-on-surface">
            {d.studentStats.homeworkAvg != null
              ? `${fmtAvg(d.studentStats.homeworkAvg)} (${avgLabel(d.studentStats.homeworkAvg)}) · ${d.studentStats.homeworkGraded} ta baho`
              : "Hali baho yoʻq"}
          </div>
        </div>
      </aside>
    </div>
  );
}

function QuizBreakdown({ quiz }: { quiz: NonNullable<SubmissionDetail["quiz"]> }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center justify-between gap-2 border-b border-surface-container px-4 py-3">
        <span className="flex items-center gap-2 font-label-lg text-label-lg text-on-surface">
          <Icon name="smart_toy" size={18} className="text-success" />
          Avtomatik tekshiruv
        </span>
        <Badge tone={quiz.percent >= 85 ? "success" : quiz.percent >= 50 ? "warning" : "danger"}>
          {quiz.correct}/{quiz.total} · {quiz.percent}%
        </Badge>
      </div>
      <ol className="divide-y divide-surface-container">
        {(quiz.items ?? []).map((it, i) => (
          <li key={it.id} className="px-4 py-3">
            <div className="flex items-start gap-2">
              <Icon name={it.correct ? "check_circle" : "cancel"} size={18} className={cn("mt-0.5 shrink-0", it.correct ? "text-success" : "text-error")} />
              <div className="min-w-0 flex-1">
                <p className="text-body-md font-medium text-on-surface">
                  {i + 1}. {it.text}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {it.options.map((o, oi) => (
                    <span
                      key={oi}
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-body-sm",
                        oi === it.answer
                          ? "border-success/40 bg-success-container text-on-success-container"
                          : oi === it.given
                            ? "border-error/40 bg-error-container text-on-error-container"
                            : "border-outline-variant text-on-surface-variant",
                      )}
                    >
                      {o}
                    </span>
                  ))}
                  {it.given == null ? <span className="text-body-sm italic text-on-surface-muted">javob berilmagan</span> : null}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
