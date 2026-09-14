// "Uyga vazifa berish" — teacher-b endpointi: POST /api/teacher/homework (fayllar avval POST /api/files).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Dialog, Field, Icon, Input, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import { fmtFileSize, todayYmd, toYmd } from "@/lib/format";
import { useApiMutation } from "@/lib/query";
import type { FileMeta } from "@/lib/types";
import { addDaysYmd, qk, topicText } from "./shared";
import type { HomeworkType, TopicLite } from "./types";

const TYPES: { value: HomeworkType; label: string }[] = [
  { value: "TEXT", label: "Matnli javob" },
  { value: "AUDIO", label: "Audio yozuv (Speaking)" },
  { value: "FILE", label: "Fayl yuklash" },
];

const ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.webp,.mp3,.m4a,.wav,.ogg,.mp4,.zip";

export function HomeworkDialog({
  open,
  onOpenChange,
  lessonId,
  groupId,
  topics,
  lessonTitle,
  nextLessonAt,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lessonId: string;
  groupId: string;
  topics: TopicLite[];
  lessonTitle: string | null;
  nextLessonAt: string | null;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<HomeworkType>("TEXT");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("20:00");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(topics[0] ? topicText(topics[0]) : (lessonTitle ?? ""));
    setType("TEXT");
    setDescription("");
    setDate(nextLessonAt ? toYmd(nextLessonAt) : addDaysYmd(todayYmd(), 2));
    setTime("20:00");
    setFiles([]);
    setError(null);
  }, [open, topics, lessonTitle, nextLessonAt]);

  const create = useApiMutation(
    async () => {
      let fileIds: string[] = [];
      if (files.length) {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f));
        const up = await api.upload<{ files: FileMeta[] }>("/files", fd);
        fileIds = up.files.map((f) => f.id);
      }
      return api.post("/teacher/homework", {
        groupId,
        lessonId,
        topicId: topics[0]?.id ?? null,
        title: title.trim(),
        description: description.trim() || null,
        type,
        dueAt: `${date}T${time}:00+05:00`,
        fileIds,
      });
    },
    {
      silentError: true,
      invalidate: [qk.lesson(lessonId), ["teacher", "homework"]],
      success: "Uyga vazifa berildi — oʻquvchilar va ota-onalarga xabar yuborildi",
      onSuccess: () => onOpenChange(false),
      onError: (e) => setError(e.message),
    },
  );

  const dueTs = date && time ? new Date(`${date}T${time}:00+05:00`).getTime() : NaN;
  const invalid = title.trim().length < 2 ? "Sarlavha kamida 2 belgi" : !Number.isFinite(dueTs) ? "Muddatni kiriting" : dueTs < Date.now() + 5 * 60_000 ? "Muddat kelajakdagi vaqt boʻlishi kerak" : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !create.isPending && onOpenChange(o)}
      title="Uyga vazifa berish"
      description="Vazifa shu darsga biriktiriladi. Oʻquvchilar va ota-onalar Telegram orqali xabar oladi."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Bekor qilish
          </Button>
          <Button icon="send" loading={create.isPending} disabled={!!invalid} onClick={() => create.mutate()}>
            Vazifani berish
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!invalid) create.mutate();
        }}
      >
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Field label="Sarlavha" required error={title && title.trim().length < 2 ? "Sarlavha kamida 2 belgi" : undefined}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Unit 4 — Family words" autoFocus />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Turi" className="sm:col-span-1">
            <Select value={type} onChange={(e) => setType(e.target.value as HomeworkType)} options={TYPES} />
          </Field>
          <Field label="Muddat (sana)" required>
            <Input type="date" value={date} min={todayYmd()} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Vaqt" required>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
        <Field label="Topshiriq matni" hint="Nima qilish kerakligini qisqa yozing">
          <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} placeholder="Masalan: 20 ta yangi soʻz bilan gap tuzing va audio yozib yuboring." />
        </Field>
        <Field label="Ilova fayllar (ixtiyoriy, 5 tagacha)">
          <Input
            type="file"
            multiple
            accept={ACCEPT}
            className="h-auto py-2 file:mr-3 file:rounded-md file:border-0 file:bg-surface-container file:px-3 file:py-1 file:font-label-md file:text-label-md"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
          />
        </Field>
        {files.length ? (
          <ul className="flex flex-col gap-1 text-body-sm text-on-surface-variant">
            {files.map((f) => (
              <li key={f.name} className="flex items-center gap-2">
                <Icon name="attach_file" size={16} />
                <span className="truncate">{f.name}</span>
                <span className="text-on-surface-muted">{fmtFileSize(f.size)}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {invalid && title.trim().length >= 2 ? <p className="text-body-sm text-error">{invalid}</p> : null}
        <p className="text-body-sm text-on-surface-muted">
          Test (savol-javob) turidagi vazifani{" "}
          <Link to="/ustoz/vazifalar" className="text-primary hover:underline">
            Vazifalar
          </Link>{" "}
          boʻlimida yarating.
        </p>
      </form>
    </Dialog>
  );
}
