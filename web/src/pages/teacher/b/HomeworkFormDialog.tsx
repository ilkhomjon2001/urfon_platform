// Yangi uyga vazifa / tahrirlash oynasi (turi, muddat, QUIZ savollari, fayllar).
import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Button, Checkbox, Dialog, Field, Icon, IconButton, Input, Select, Skeleton, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtDayMonth, fmtFileSize } from "@/lib/format";
import { toastError, useApiMutation, useApiQuery } from "@/lib/query";
import type { FileMeta } from "@/lib/types";
import { ACCEPT_ALL, INV, MAX_UPLOAD_MB, TB, tooLarge, uploadFiles } from "./api";
import type { GroupRef, Homework, HomeworkDetail, HwFormOptions, HwType, QuizQuestion } from "./types";
import { QueryError, TYPE_META, defaultDue, fromLocalInput, toLocalInput } from "./ui";

export interface HomeworkFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: GroupRef[];
  /** Tahrirlash rejimi */
  editId?: string | null;
  defaultGroupId?: string;
  onSaved?: (hw: Homework) => void;
}

export function HomeworkFormDialog({ open, onOpenChange, groups, editId, defaultGroupId, onSaved }: HomeworkFormDialogProps) {
  const detail = useApiQuery<HomeworkDetail>([TB, "homework-detail", editId], editId ? `/teacher/homework/${editId}` : null, { enabled: open });
  const title = editId ? "Vazifani tahrirlash" : "Yangi uyga vazifa";
  const description = editId ? "Oʻzgarishlar darhol oʻquvchilarga koʻrinadi" : "Guruh oʻquvchilari va ota-onalariga xabar yuboriladi";
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description} size="lg">
      {editId && detail.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : editId && detail.error ? (
        <QueryError error={detail.error} onRetry={() => detail.refetch()} compact />
      ) : open ? (
        <HomeworkForm
          key={editId ?? "new"}
          groups={groups}
          initial={editId ? (detail.data ?? null) : null}
          defaultGroupId={defaultGroupId}
          onCancel={() => onOpenChange(false)}
          onSaved={(hw) => {
            onOpenChange(false);
            onSaved?.(hw);
          }}
        />
      ) : null}
    </Dialog>
  );
}

type QDraft = { id: string; text: string; options: string[]; answer: number | null };
const newQ = (): QDraft => ({ id: `q${Math.random().toString(36).slice(2, 8)}`, text: "", options: ["", ""], answer: null });

function HomeworkForm({
  groups,
  initial,
  defaultGroupId,
  onCancel,
  onSaved,
}: {
  groups: GroupRef[];
  initial: HomeworkDetail | null;
  defaultGroupId?: string;
  onCancel: () => void;
  onSaved: (hw: Homework) => void;
}) {
  const [groupId, setGroupId] = useState(initial?.group.id ?? defaultGroupId ?? (groups.length === 1 ? groups[0].id : ""));
  const [lessonId, setLessonId] = useState(initial?.lesson?.id ?? "");
  const [topicId, setTopicId] = useState(initial?.topic?.id ?? "");
  const [type, setType] = useState<HwType>(initial?.type ?? "TEXT");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [due, setDue] = useState(initial ? toLocalInput(initial.dueAt) : defaultDue());
  const [questions, setQuestions] = useState<QDraft[]>(() => {
    const qs = (initial?.content?.questions ?? []) as QuizQuestion[];
    return qs.length ? qs.map((q) => ({ id: q.id, text: q.text, options: [...q.options], answer: q.answer })) : [newQ()];
  });
  const [existing, setExisting] = useState<FileMeta[]>(initial?.files ?? []);
  const [removed, setRemoved] = useState<string[]>([]);
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [uploading, setUploading] = useState(false);
  const [notify, setNotify] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const typeLocked = !!initial && initial.stats.submitted > 0;
  // Tashqi/eski formatdagi test ({ questions: 20, … }) — savollar tahrirlanmaydi, tarkib o'zgarmaydi
  const legacyQuiz = !!initial && initial.type === "QUIZ" && !Array.isArray(initial.content?.questions);
  const quizMode = type === "QUIZ" && !legacyQuiz;
  const opts = useApiQuery<HwFormOptions>([TB, "hw-options", groupId], groupId ? "/teacher/homework/form-options" : null, { params: { groupId } });

  const save = useApiMutation(
    (body: Record<string, unknown>) =>
      initial ? api.put<Homework>(`/teacher/homework/${initial.id}`, body) : api.post<Homework>("/teacher/homework", body),
    { invalidate: INV },
  );

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    e.target.value = "";
    const room = 5 - existing.length - files.length;
    if (!list.length) return;
    if (tooLarge(list)) {
      toast.error(`Fayl hajmi ${MAX_UPLOAD_MB} MB dan oshmasin`);
      return;
    }
    if (list.length > room) toast.warning(`Koʻpi bilan 5 ta fayl biriktiriladi`);
    setUploading(true);
    try {
      const up = await uploadFiles(list.slice(0, Math.max(0, room)));
      setFiles((f) => [...f, ...up]);
    } catch (err) {
      toastError(err);
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!groupId) e.group = "Guruhni tanlang";
    if (title.trim().length < 2) e.title = "Sarlavha kamida 2 belgi";
    if (!due) e.due = "Muddatni kiriting";
    else if (fromLocalInput(due).getTime() < Date.now() + 5 * 60_000 && (!initial || toLocalInput(initial.dueAt) !== due)) e.due = "Muddat kelajakdagi vaqt boʻlishi kerak";
    if (quizMode) {
      questions.forEach((q, i) => {
        if (!q.text.trim()) e[`q${i}`] = `${i + 1}-savol matni boʻsh`;
        else if (q.options.some((o) => !o.trim())) e[`q${i}`] = `${i + 1}-savol: boʻsh variantni toʻldiring yoki oʻchiring`;
        else if (q.answer == null) e[`q${i}`] = `${i + 1}-savol: toʻgʻri javobni belgilang`;
      });
      if (!questions.length) e.quiz = "Kamida 1 ta savol";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    const content =
      quizMode
        ? { questions: questions.map((q) => ({ id: q.id, text: q.text.trim(), options: q.options.map((o) => o.trim()), answer: q.answer })) }
        : undefined;
    const dueIso = fromLocalInput(due).toISOString();
    let body: Record<string, unknown>;
    if (initial) {
      body = {
        title: title.trim(),
        description: desc.trim() || null,
        lessonId: lessonId || null,
        topicId: topicId || null,
        ...(typeLocked ? {} : { type }),
        ...(toLocalInput(initial.dueAt) !== due ? { dueAt: dueIso } : {}),
        ...(content ? { content } : {}),
        addFileIds: files.map((f) => f.id),
        removeFileIds: removed,
      };
    } else {
      body = {
        groupId,
        lessonId: lessonId || null,
        topicId: topicId || null,
        title: title.trim(),
        description: desc.trim() || null,
        type,
        dueAt: dueIso,
        ...(content ? { content } : {}),
        fileIds: files.map((f) => f.id),
        notify,
      };
    }
    const hw = await save.mutateAsync(body);
    toast.success(initial ? "Vazifa yangilandi" : "Uyga vazifa berildi", {
      description: initial ? undefined : notify ? `${hw.stats.students} ta oʻquvchi va ota-onalariga xabar yuborildi` : undefined,
    });
    onSaved(hw);
  };

  const setQ = (i: number, patch: Partial<QDraft>) => setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void submit().catch(() => {});
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Guruh" required error={errors.group}>
          <Select
            value={groupId}
            disabled={!!initial}
            onChange={(e) => {
              setGroupId(e.target.value);
              setLessonId("");
              setTopicId("");
            }}
            placeholder="Guruhni tanlang…"
            options={groups.map((g) => ({ value: g.id, label: `${g.name} (${g.code})` }))}
          />
        </Field>
        <Field label="Dars (ixtiyoriy)" hint={groupId && opts.data && !opts.data.lessons.length ? "Yaqin darslar topilmadi" : undefined}>
          <Select
            value={lessonId}
            disabled={!groupId || opts.isLoading}
            onChange={(e) => {
              const id = e.target.value;
              setLessonId(id);
              const l = opts.data?.lessons.find((x) => x.id === id);
              if (l?.topicId && !topicId) setTopicId(l.topicId);
            }}
            placeholder="Darsga bogʻlanmagan"
            options={(opts.data?.lessons ?? []).map((l) => ({
              value: l.id,
              label: `${fmtDayMonth(l.startsAt)}${l.number ? ` · ${l.number}-dars` : ""}${l.title ? ` · ${l.title}` : ""}`,
            }))}
          />
        </Field>
      </div>

      <Field label="Format">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(TYPE_META) as HwType[]).map((t) => (
            <button
              key={t}
              type="button"
              disabled={typeLocked && t !== type}
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 font-label-md text-label-md transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                type === t ? "border-primary bg-primary-fixed text-primary" : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary/50",
              )}
            >
              <Icon name={TYPE_META[t].icon} size={18} />
              {TYPE_META[t].short}
            </button>
          ))}
        </div>
        {typeLocked ? <p className="text-body-sm text-on-surface-muted">Topshiriqlar bor — formatni oʻzgartirib boʻlmaydi</p> : null}
        {legacyQuiz && type === "QUIZ" ? (
          <p className="flex items-center gap-1.5 text-body-sm text-on-surface-muted">
            <Icon name="info" size={16} className="text-primary" />
            Test tarkibi tashqi formatda ({initial?.questionsCount ?? "—"} ta savol) — savollar shu oynada oʻzgartirilmaydi
          </p>
        ) : null}
      </Field>

      <Field label="Sarlavha" required error={errors.title}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: Unit 4 — Family words" maxLength={200} />
      </Field>

      <Field label="Koʻrsatma va talablar">
        <Textarea
          rows={3}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Soʻzlar soni, audio uzunligi, eʼtibor beriladigan grammatika…"
          maxLength={5000}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Topshirish muddati" required error={errors.due} hint="Toshkent vaqti">
          <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <Field label="Mavzu (ixtiyoriy)">
          <Select
            value={topicId}
            disabled={!groupId || !opts.data?.topics.length}
            onChange={(e) => setTopicId(e.target.value)}
            placeholder={opts.data && !opts.data.topics.length ? "Guruh Levelida mavzu yoʻq" : "Mavzuni tanlang"}
            options={(opts.data?.topics ?? []).map((t) => ({ value: t.id, label: `Unit ${t.unit} — ${t.title}` }))}
          />
        </Field>
      </div>

      {quizMode ? (
        <div className="space-y-3 rounded-xl border border-outline-variant bg-surface-container-low/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-label-lg text-label-lg text-on-surface">
              <Icon name="quiz" size={18} className="text-primary" />
              Test savollari ({questions.length})
            </span>
            <span className="text-body-sm text-on-surface-muted">Toʻgʻri javob oʻquvchiga koʻrsatilmaydi</span>
          </div>
          {questions.map((q, i) => (
            <div key={q.id} className="space-y-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
              <div className="flex items-start gap-2">
                <span className="mt-2.5 w-6 shrink-0 font-label-md text-label-md text-on-surface-muted">{i + 1}.</span>
                <Input value={q.text} onChange={(e) => setQ(i, { text: e.target.value })} placeholder="Savol matni" maxLength={1000} />
                <IconButton
                  icon="delete"
                  label="Savolni oʻchirish"
                  size="md"
                  disabled={questions.length <= 1}
                  onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))}
                />
              </div>
              <div className="space-y-1.5 pl-8">
                {q.options.map((o, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`ans-${q.id}`}
                      checked={q.answer === oi}
                      onChange={() => setQ(i, { answer: oi })}
                      aria-label={`${oi + 1}-variant toʻgʻri`}
                      className="h-4 w-4 shrink-0 cursor-pointer accent-success"
                    />
                    <Input
                      size="sm"
                      value={o}
                      onChange={(e) => setQ(i, { options: q.options.map((x, xi) => (xi === oi ? e.target.value : x)) })}
                      placeholder={`${oi + 1}-variant`}
                      maxLength={300}
                      className={q.answer === oi ? "border-success" : undefined}
                    />
                    <IconButton
                      icon="close"
                      label="Variantni oʻchirish"
                      size="sm"
                      disabled={q.options.length <= 2}
                      onClick={() =>
                        setQ(i, {
                          options: q.options.filter((_, xi) => xi !== oi),
                          answer: q.answer == null ? null : q.answer === oi ? null : q.answer > oi ? q.answer - 1 : q.answer,
                        })
                      }
                    />
                  </div>
                ))}
                {q.options.length < 8 ? (
                  <Button variant="link" size="sm" icon="add" onClick={() => setQ(i, { options: [...q.options, ""] })}>
                    Variant qoʻshish
                  </Button>
                ) : null}
              </div>
              {errors[`q${i}`] ? <p className="pl-8 text-body-sm text-error">{errors[`q${i}`]}</p> : null}
            </div>
          ))}
          {questions.length < 50 ? (
            <Button variant="outline" size="sm" icon="add" onClick={() => setQuestions((qs) => [...qs, newQ()])}>
              Savol qoʻshish
            </Button>
          ) : null}
          {errors.quiz ? <p className="text-body-sm text-error">{errors.quiz}</p> : null}
        </div>
      ) : null}

      <div className="space-y-2 rounded-xl border border-outline-variant bg-surface-container-low/60 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-body-md font-medium text-on-surface">
            <Icon name="attach_file" size={20} className="text-primary" />
            Materiallar, PDF qoʻllanma yoki audio namuna
          </span>
          <input ref={fileRef} type="file" multiple accept={ACCEPT_ALL} className="hidden" onChange={(e) => void onPick(e)} />
          <Button
            variant="outline"
            size="sm"
            icon="upload"
            loading={uploading}
            disabled={existing.length + files.length >= 5}
            onClick={() => fileRef.current?.click()}
          >
            Fayl tanlash
          </Button>
        </div>
        {existing.length + files.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {[...existing.map((f) => ({ f, old: true })), ...files.map((f) => ({ f, old: false }))].map(({ f, old }) => (
              <li key={f.id} className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-surface-container-lowest px-2 py-1 text-body-sm text-on-surface ring-1 ring-outline-variant">
                <Icon name="description" size={16} className="text-primary" />
                <span className="max-w-[200px] truncate">{f.originalName}</span>
                <span className="text-on-surface-muted">{fmtFileSize(f.size)}</span>
                <button
                  type="button"
                  aria-label="Olib tashlash"
                  className="text-on-surface-variant hover:text-error"
                  onClick={() => {
                    if (old) {
                      setExisting((x) => x.filter((y) => y.id !== f.id));
                      setRemoved((r) => [...r, f.id]);
                    } else setFiles((x) => x.filter((y) => y.id !== f.id));
                  }}
                >
                  <Icon name="close" size={16} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-sm text-on-surface-muted">Ixtiyoriy · koʻpi bilan 5 ta fayl, har biri 25 MB gacha</p>
        )}
      </div>

      {!initial ? (
        <Checkbox
          checked={notify}
          onChange={(e) => setNotify(e.target.checked)}
          label="Oʻquvchilar va ota-onalarga xabar yuborish"
          description="Ota-onalar Telegram bot orqali qisqa xabar oladi"
        />
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 border-t border-outline-variant pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={save.isPending}>
          Bekor qilish
        </Button>
        <Button type="submit" icon={initial ? "save" : "publish"} loading={save.isPending} disabled={uploading}>
          {initial ? "Saqlash" : "Vazifani eʼlon qilish"}
        </Button>
      </div>
    </form>
  );
}
