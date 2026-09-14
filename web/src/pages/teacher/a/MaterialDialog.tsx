// "Material biriktirish" — fayl POST /api/files, keyin teacher-b: POST /api/teacher/materials { lessonId, groupId, … }.
import { useEffect, useState } from "react";
import { Alert, Button, Dialog, Field, Input, Tabs, TabsList, TabsTrigger, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import { fmtFileSize } from "@/lib/format";
import { useApiMutation } from "@/lib/query";
import type { FileMeta } from "@/lib/types";
import { qk } from "./shared";

const ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.webp,.gif,.mp3,.m4a,.wav,.ogg,.mp4,.zip";

export function MaterialDialog({
  open,
  onOpenChange,
  lessonId,
  groupId,
  topicId,
  levelId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lessonId: string;
  groupId: string;
  topicId: string | null;
  levelId: string | null;
}) {
  const [mode, setMode] = useState<"file" | "link">("file");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMode("file");
    setTitle("");
    setFile(null);
    setUrl("");
    setDescription("");
    setError(null);
  }, [open]);

  const create = useApiMutation(
    async () => {
      let fileId: string | null = null;
      if (mode === "file" && file) {
        const fd = new FormData();
        fd.append("files", file);
        const up = await api.upload<{ files: FileMeta[] }>("/files", fd);
        fileId = up.files[0]?.id ?? null;
      }
      return api.post("/teacher/materials", {
        title: title.trim(),
        ...(mode === "file" ? { fileId } : { url: url.trim(), type: "LINK" }),
        groupId,
        lessonId,
        topicId,
        levelId,
        description: description.trim() || null,
      });
    },
    {
      silentError: true,
      invalidate: [qk.lesson(lessonId), ["teacher", "materials"]],
      success: "Material darsga biriktirildi",
      onSuccess: () => onOpenChange(false),
      onError: (e) => setError(e.message),
    },
  );

  const invalid =
    title.trim().length < 2
      ? "Nomi kamida 2 belgi"
      : mode === "file"
        ? !file
          ? "Faylni tanlang"
          : null
        : !/^https?:\/\/\S+$/i.test(url.trim())
          ? "Havola http(s):// bilan boshlansin"
          : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !create.isPending && onOpenChange(o)}
      title="Material biriktirish"
      description="Material shu dars va guruh oʻquvchilariga koʻrinadi."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Bekor qilish
          </Button>
          <Button icon="upload" loading={create.isPending} disabled={!!invalid} onClick={() => create.mutate()}>
            Biriktirish
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
        <Tabs value={mode} onValueChange={(v) => setMode(v as "file" | "link")} variant="segmented">
          <TabsList>
            <TabsTrigger value="file" icon="upload_file">
              Fayl
            </TabsTrigger>
            <TabsTrigger value="link" icon="link">
              Havola
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {mode === "file" ? (
          <Field label="Fayl" required hint="PDF, slayd, audio, video yoki rasm">
            <Input
              type="file"
              accept={ACCEPT}
              className="h-auto py-2 file:mr-3 file:rounded-md file:border-0 file:bg-surface-container file:px-3 file:py-1 file:font-label-md file:text-label-md"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f && !title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ""));
              }}
            />
          </Field>
        ) : (
          <Field label="Havola" required>
            <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" />
          </Field>
        )}
        {file && mode === "file" ? (
          <p className="text-body-sm text-on-surface-variant">
            {file.name} · {fmtFileSize(file.size)}
          </p>
        ) : null}
        <Field label="Nomi" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Unit 4 — Presentation Slides" />
        </Field>
        <Field label="Izoh (ixtiyoriy)">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
        </Field>
      </form>
    </Dialog>
  );
}
