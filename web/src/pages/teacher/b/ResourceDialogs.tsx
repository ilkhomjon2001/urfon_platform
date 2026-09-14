// Resurslar: yuklash oynasi (drag & drop → POST /api/files → POST /teacher/materials) va guruhga ulashish formasi.
import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { Button, Checkbox, Dialog, Field, Icon, IconButton, Input, Select, Spinner, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtFileSize } from "@/lib/format";
import { toastError, useApiMutation, useApiQuery } from "@/lib/query";
import type { FileMeta } from "@/lib/types";
import { ACCEPT_ALL, INV, MAX_UPLOAD_MB, TB, tooLarge, uploadFiles } from "./api";
import type { GroupRef, Material, MaterialOptions, MaterialType } from "./types";

export const MAT_TYPE: Record<MaterialType, { label: string; icon: string; tile: string; chip: string }> = {
  PDF: { label: "PDF", icon: "picture_as_pdf", tile: "bg-error-container text-error", chip: "bg-error-container text-on-error-container" },
  AUDIO: { label: "Audio", icon: "volume_up", tile: "bg-tertiary-fixed text-tertiary", chip: "bg-tertiary-fixed text-on-tertiary-fixed-variant" },
  VIDEO: { label: "Video", icon: "movie", tile: "bg-primary-fixed text-primary", chip: "bg-primary-fixed text-on-primary-fixed-variant" },
  DOC: { label: "Hujjat", icon: "description", tile: "bg-surface-container-high text-primary", chip: "bg-surface-container text-on-surface-variant" },
  IMAGE: { label: "Rasm", icon: "image", tile: "bg-success-container text-success", chip: "bg-success-container text-on-success-container" },
  LINK: { label: "Havola", icon: "link", tile: "bg-secondary-container text-navy", chip: "bg-secondary-container text-on-secondary-container" },
};

export function materialTypeFromMime(mime: string): MaterialType {
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("audio/")) return "AUDIO";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("image/")) return "IMAGE";
  return "DOC";
}

/** Chip matni: "PDF", "MP3 Audio", "DOCX", "Havola" */
export function extLabel(m: Pick<Material, "type" | "file">) {
  if (m.type === "LINK" || !m.file) return MAT_TYPE[m.type].label;
  const ext = m.file.originalName.split(".").pop()?.toUpperCase() ?? "";
  if (m.type === "AUDIO") return `${ext} Audio`;
  if (m.type === "VIDEO") return `${ext} Video`;
  return ext || MAT_TYPE[m.type].label;
}

// ---------------------------------------------------------------- yuklash

export function UploadMaterialDialog({ open, onOpenChange, defaultGroupId }: { open: boolean; onOpenChange: (o: boolean) => void; defaultGroupId?: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Yangi resurs yuklash" description="Fayl yoki havola — umumiy bazaga yoki guruhingizga" size="lg">
      {open ? <UploadForm defaultGroupId={defaultGroupId} onDone={() => onOpenChange(false)} /> : null}
    </Dialog>
  );
}

function UploadForm({ defaultGroupId, onDone }: { defaultGroupId?: string; onDone: () => void }) {
  const opts = useApiQuery<MaterialOptions>([TB, "material-options"], "/teacher/materials/options", { staleTime: 5 * 60_000 });
  const [mode, setMode] = useState<"file" | "link">("file");
  const [file, setFile] = useState<FileMeta | null>(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<"library" | "group">(defaultGroupId ? "group" : "library");
  const [groupId, setGroupId] = useState(defaultGroupId ?? "");
  const [levelId, setLevelId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [description, setDescription] = useState("");
  const [notify, setNotify] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const o = opts.data;
  const topics = (o?.topics ?? []).filter((t) => !levelId || t.levelId === levelId);

  const pick = async (list: File[]) => {
    const f = list[0];
    if (!f) return;
    if (tooLarge([f])) {
      toast.error(`Fayl hajmi ${MAX_UPLOAD_MB} MB dan oshmasin`);
      return;
    }
    setUploading(true);
    try {
      const [up] = await uploadFiles([f]);
      setFile(up);
      setErrors((e) => ({ ...e, file: "" }));
      if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
    } catch (err) {
      toastError(err);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrag(false);
    void pick(Array.from(e.dataTransfer.files));
  };

  const save = useApiMutation((body: Record<string, unknown>) => api.post<Material>("/teacher/materials", body), { invalidate: INV });

  const submit = async () => {
    const e: Record<string, string> = {};
    if (mode === "file" && !file) e.file = "Faylni tanlang";
    if (mode === "link" && !/^https?:\/\/\S+\.\S+/i.test(url.trim())) e.url = "Havola http:// yoki https:// bilan boshlansin";
    if (title.trim().length < 2) e.title = "Nomi kamida 2 belgi";
    if (scope === "group" && !groupId) e.group = "Guruhni tanlang";
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    await save.mutateAsync({
      title: title.trim(),
      ...(mode === "file" ? { fileId: file!.id } : { url: url.trim(), type: "LINK" }),
      groupId: scope === "group" ? groupId : null,
      levelId: levelId || null,
      topicId: topicId || null,
      description: description.trim() || null,
      notify: scope === "group" && notify,
    });
    toast.success(scope === "group" ? "Material guruhga biriktirildi" : "Material resurslar bazasiga yuklandi");
    onDone();
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(ev) => {
        ev.preventDefault();
        void submit().catch(() => {});
      }}
    >
      <div className="inline-flex rounded-lg bg-surface-container-low p-1" role="tablist">
        {(
          [
            ["file", "Fayl", "upload_file"],
            ["link", "Havola", "link"],
          ] as const
        ).map(([k, label, icon]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={mode === k}
            onClick={() => setMode(k)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-md px-3 font-label-md text-label-md transition-colors",
              mode === k ? "bg-surface-container-lowest text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            <Icon name={icon} size={16} />
            {label}
          </button>
        ))}
      </div>

      {mode === "file" ? (
        <div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && inputRef.current?.click()}
            onDragOver={(ev) => {
              ev.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
              drag ? "border-primary bg-primary-light" : errors.file ? "border-error/60 bg-error-container/30" : "border-outline-variant bg-surface-container-low/60 hover:border-primary/60",
            )}
          >
            <input ref={inputRef} type="file" accept={ACCEPT_ALL} className="hidden" onChange={(ev) => void pick(Array.from(ev.target.files ?? [])).finally(() => (ev.target.value = ""))} />
            {uploading ? (
              <>
                <Spinner size={28} className="text-primary" />
                <span className="text-body-md text-on-surface-variant">Yuklanmoqda…</span>
              </>
            ) : file ? (
              <>
                <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl", MAT_TYPE[materialTypeFromMime(file.mime)].tile)}>
                  <Icon name={MAT_TYPE[materialTypeFromMime(file.mime)].icon} size={26} />
                </span>
                <span className="max-w-full truncate font-label-lg text-label-lg text-on-surface">{file.originalName}</span>
                <span className="text-body-sm text-on-surface-muted">
                  {fmtFileSize(file.size)} · {MAT_TYPE[materialTypeFromMime(file.mime)].label} · almashtirish uchun bosing
                </span>
              </>
            ) : (
              <>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                  <Icon name="cloud_upload" size={26} />
                </span>
                <span className="font-label-lg text-label-lg text-on-surface">Faylni shu yerga tashlang yoki tanlang</span>
                <span className="text-body-sm text-on-surface-muted">PDF, DOCX, PPTX, MP3, M4A, MP4, rasm · {MAX_UPLOAD_MB} MB gacha</span>
              </>
            )}
          </div>
          {errors.file ? <p className="mt-1.5 text-body-sm text-error">{errors.file}</p> : null}
        </div>
      ) : (
        <Field label="Havola" required error={errors.url}>
          <Input value={url} onChange={(ev) => setUrl(ev.target.value)} placeholder="https://…" inputMode="url" icon="link" />
        </Field>
      )}

      <Field label="Nomi" required error={errors.title}>
        <Input value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder="Masalan: Unit 4 — Presentation Slides" maxLength={200} />
      </Field>

      <Field label="Joylashuv">
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["library", "Umumiy baza", "Barcha ustozlar foydalana oladi", "public"],
              ["group", "Guruhimga", "Faqat shu guruh oʻquvchilari va ota-onalari", "groups"],
            ] as const
          ).map(([k, label, hint, icon]) => (
            <button
              key={k}
              type="button"
              aria-pressed={scope === k}
              onClick={() => setScope(k)}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                scope === k ? "border-primary bg-primary-light" : "border-outline-variant hover:border-primary/50",
              )}
            >
              <Icon name={icon} size={20} className={scope === k ? "text-primary" : "text-on-surface-variant"} />
              <span>
                <span className="block font-label-lg text-label-lg text-on-surface">{label}</span>
                <span className="block text-body-sm text-on-surface-muted">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      </Field>

      {scope === "group" ? (
        <Field label="Guruh" required error={errors.group}>
          <Select
            value={groupId}
            onChange={(ev) => {
              setGroupId(ev.target.value);
              const g = o?.groups.find((x) => x.id === ev.target.value);
              if (g?.levelId && !levelId) setLevelId(g.levelId);
            }}
            placeholder="Guruhni tanlang…"
            options={(o?.groups ?? []).map((g) => ({ value: g.id, label: `${g.name} (${g.code})` }))}
          />
        </Field>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Level">
          <Select
            value={levelId}
            onChange={(ev) => {
              setLevelId(ev.target.value);
              setTopicId("");
            }}
            placeholder="Tanlanmagan"
            options={(o?.levels ?? []).map((l) => ({ value: l.id, label: l.name }))}
          />
        </Field>
        <Field label="Mavzu">
          <Select
            value={topicId}
            disabled={!levelId}
            onChange={(ev) => setTopicId(ev.target.value)}
            placeholder={levelId ? "Tanlanmagan" : "Avval Levelni tanlang"}
            options={topics.map((t) => ({ value: t.id, label: `Unit ${t.unit} — ${t.title}` }))}
          />
        </Field>
      </div>

      <Field label="Izoh">
        <Textarea rows={2} value={description} onChange={(ev) => setDescription(ev.target.value)} placeholder="Qisqa tavsif (ixtiyoriy)" maxLength={2000} />
      </Field>

      {scope === "group" ? (
        <Checkbox checked={notify} onChange={(ev) => setNotify(ev.target.checked)} label="Oʻquvchilarga bildirishnoma yuborish" description="Yangi material haqida ilova va Telegram orqali" />
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 border-t border-outline-variant pt-4">
        <Button variant="ghost" onClick={onDone} disabled={save.isPending}>
          Bekor qilish
        </Button>
        <Button type="submit" icon="cloud_done" loading={save.isPending} disabled={uploading}>
          Saqlash
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- guruhga ulashish

export function ShareMaterialDialog({ material, onOpenChange, groups }: { material: Material | null; onOpenChange: (o: boolean) => void; groups: GroupRef[] }) {
  return (
    <Dialog open={!!material} onOpenChange={onOpenChange} title="Guruhga ulashish" description={material?.title} size="md">
      {material ? <ShareForm key={material.id} material={material} groups={groups} onDone={() => onOpenChange(false)} /> : null}
    </Dialog>
  );
}

/** Material tanlangan bo'lsa (dialog) — faqat guruh; aks holda (o'ng panel) material ham tanlanadi. */
export function ShareForm({ material, materials, groups, onDone }: { material?: Material | null; materials?: Material[]; groups: GroupRef[]; onDone?: () => void }) {
  const [groupId, setGroupId] = useState("");
  const [matId, setMatId] = useState(material?.id ?? "");
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const share = useApiMutation(
    (b: { id: string; groupId: string; note: string | null; notify: boolean }) =>
      api.post<Material>(`/teacher/materials/${b.id}/share`, { groupId: b.groupId, note: b.note, notify: b.notify }),
    { invalidate: INV },
  );
  const selected = material ?? materials?.find((m) => m.id === matId) ?? null;
  const targets = groups.filter((g) => g.id !== selected?.group?.id);
  const candidates = (materials ?? []).filter((m) => !groupId || m.group?.id !== groupId);

  const submit = async () => {
    if (!selected) return setErr("Materialni tanlang");
    if (!groupId) return setErr("Guruhni tanlang");
    setErr(null);
    const g = groups.find((x) => x.id === groupId);
    await share.mutateAsync({ id: selected.id, groupId, note: note.trim() || null, notify });
    toast.success(`“${selected.title}” ${g?.name ?? ""} guruhiga ulashildi`, { description: notify ? "Oʻquvchilarga bildirishnoma yuborildi" : undefined });
    setNote("");
    if (!material) setMatId("");
    onDone?.();
  };

  return (
    <div className="flex flex-col gap-3.5">
      <Field label="Qabul qiluvchi guruh">
        <Select value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="Guruhni tanlang…" options={targets.map((g) => ({ value: g.id, label: `${g.name} (${g.code})` }))} />
      </Field>
      {!material ? (
        <Field label="Resurs yoki materialni tanlang">
          <Select
            value={matId}
            onChange={(e) => setMatId(e.target.value)}
            placeholder={materials ? "Materialni tanlang…" : "Yuklanmoqda…"}
            options={candidates.map((m) => ({ value: m.id, label: `${m.title} (${extLabel(m)})` }))}
          />
        </Field>
      ) : null}
      <Field label="Oʻquvchilar uchun eslatma (ixtiyoriy)">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ertangi darsgacha oʻrganib chiqing" maxLength={300} />
      </Field>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-outline-variant bg-surface-container-low/60 px-3 py-2.5">
        <span className="flex items-center gap-2 text-body-md text-on-surface">
          <Icon name="notifications_active" size={18} className="text-primary" />
          Oʻquvchilarga bildirishnoma yuborish
        </span>
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 cursor-pointer accent-primary" />
      </label>
      {err ? <p className="text-body-sm text-error">{err}</p> : null}
      <Button block icon="share" loading={share.isPending} onClick={() => void submit().catch(() => {})}>
        Biriktirish va ulashish
      </Button>
      {selected?.file ? (
        <p className="flex items-start gap-1.5 text-[11.5px] leading-snug text-on-surface-muted">
          <Icon name="info" size={15} className="mt-px shrink-0" />
          Guruhga faylning alohida nusxasi biriktiriladi — asl material oʻchirilsa ham guruhda saqlanib qoladi.
        </p>
      ) : null}
    </div>
  );
}

/** Kichik "yopish" tugmasi bilan fayl chipi (boshqa formalarda qayta ishlatish uchun). */
export function PendingFileChip({ file, onRemove }: { file: { name: string; size: number }; onRemove: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-surface-container px-2 py-1 text-body-sm text-on-surface">
      <Icon name="attach_file" size={16} />
      <span className="max-w-[200px] truncate">{file.name}</span>
      <span className="text-on-surface-muted">{fmtFileSize(file.size)}</span>
      <IconButton icon="close" label="Olib tashlash" size="sm" className="h-6 w-6" onClick={onRemove} />
    </span>
  );
}
