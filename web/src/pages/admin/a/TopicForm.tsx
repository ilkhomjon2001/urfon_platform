// Mavzular bazasi: mavzu va bosqich (level) formalari.
import { useEffect, useState } from "react";
import { Alert, Button, Checkbox, Dialog, Field, Input, Select, Textarea } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useApiMutation } from "@/lib/query";
import { keys, MOBILE_FULL_CLASS } from "./shared";
import type { LevelStat, TopicRow } from "./types";

interface TopicFormState {
  levelId: string;
  title: string;
  description: string;
  objectives: string;
  vocabulary: string;
  grammar: string;
  lessonsCount: string;
  hours: string;
  published: boolean;
}

export function TopicFormDialog({
  open,
  onOpenChange,
  topic,
  levels,
  defaultLevelId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  topic?: TopicRow | null;
  levels: LevelStat[];
  defaultLevelId?: string;
  onSaved?: (msg: string) => void;
}) {
  const editing = !!topic;
  const [f, setF] = useState<TopicFormState>({
    levelId: "", title: "", description: "", objectives: "", vocabulary: "", grammar: "", lessonsCount: "4", hours: "6", published: true,
  });
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setServerError(null);
    setF(
      topic
        ? {
            levelId: defaultLevelId ?? "",
            title: topic.title,
            description: topic.description ?? "",
            objectives: topic.objectives.join("\n"),
            vocabulary: topic.vocabulary.join(", "),
            grammar: topic.grammar ?? "",
            lessonsCount: String(topic.lessonsCount),
            hours: String(topic.hours),
            published: topic.status === "PUBLISHED",
          }
        : { levelId: defaultLevelId ?? levels[0]?.id ?? "", title: "", description: "", objectives: "", vocabulary: "", grammar: "", lessonsCount: "4", hours: "6", published: true },
    );
  }, [open, topic, defaultLevelId, levels]);

  const set = (k: keyof TopicFormState) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const lessons = Number(f.lessonsCount);
  const hours = Number(f.hours);
  const errors: Partial<Record<keyof TopicFormState, string>> = {};
  if (f.title.trim().length < 3) errors.title = "Mavzu nomi kamida 3 belgi";
  if (!editing && !f.levelId) errors.levelId = "Levelni tanlang";
  if (!Number.isInteger(lessons) || lessons < 1 || lessons > 100) errors.lessonsCount = "1 dan 100 gacha";
  if (!Number.isFinite(hours) || hours < 0.5 || hours > 300) errors.hours = "0.5 dan 300 gacha";
  const invalid = Object.keys(errors).length > 0;
  const err = (k: keyof TopicFormState) => (touched ? errors[k] : undefined);

  const save = useApiMutation(
    (body: object) => (editing ? api.put(`/admin/curriculum/topics/${topic?.id}`, body) : api.post("/admin/curriculum/topics", body)),
    { invalidate: keys("curriculum"), silentError: true },
  );

  const submit = async () => {
    setTouched(true);
    setServerError(null);
    if (invalid) return;
    const body = {
      title: f.title.trim(),
      description: f.description.trim() || null,
      objectives: f.objectives.split("\n").map((s) => s.trim()).filter(Boolean),
      vocabulary: f.vocabulary.split(",").map((s) => s.trim()).filter(Boolean),
      grammar: f.grammar.trim() || null,
      lessonsCount: lessons,
      hours,
      // tahrirda arxivlangan mavzu holati formadan o'zgarmaydi (arxivdan tiklash alohida)
      ...(editing && topic?.status === "ARCHIVED" ? {} : { status: f.published ? "PUBLISHED" : "DRAFT" }),
      ...(editing ? {} : { levelId: f.levelId }),
    };
    try {
      await save.mutateAsync(body);
      onOpenChange(false);
      onSaved?.(editing ? "Mavzu saqlandi" : f.published ? "Mavzu qoʻshildi va tasdiqlandi" : "Mavzu qoralama sifatida qoʻshildi");
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Saqlab boʻlmadi");
    }
  };

  const level = levels.find((l) => l.id === (editing ? defaultLevelId : f.levelId));
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !save.isPending && onOpenChange(o)}
      size="lg"
      className={MOBILE_FULL_CLASS}
      title={editing ? `Unit ${topic?.unit} — tahrirlash` : "Yangi mavzu qoʻshish"}
      description={level ? `${level.label ?? level.name} oʻquv rejasiga` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Bekor qilish
          </Button>
          <Button icon="save" onClick={submit} loading={save.isPending} disabled={touched && invalid}>
            {f.published && topic?.status !== "ARCHIVED" ? "Saqlash va tasdiqlash" : "Saqlash"}
          </Button>
        </>
      }
    >
      <form
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {serverError ? <Alert tone="danger" className="sm:col-span-2">{serverError}</Alert> : null}
        <Field label="Mavzu nomi" required error={err("title")} className="sm:col-span-2" hint="“Unit N” raqami tartibga qarab avtomatik qoʻyiladi">
          <Input value={f.title} onChange={set("title")} placeholder="Masalan: Travel, Transport & Places" maxLength={160} autoFocus />
        </Field>
        {!editing ? (
          <Field label="Level (bosqich)" required error={err("levelId")} className="sm:col-span-2">
            <Select value={f.levelId} onChange={set("levelId")} options={levels.map((l) => ({ value: l.id, label: l.label ?? l.name }))} />
          </Field>
        ) : null}
        <Field label="Darslar soni" required error={err("lessonsCount")}>
          <Input type="number" min={1} max={100} value={f.lessonsCount} onChange={set("lessonsCount")} />
        </Field>
        <Field label="Akademik soat" required error={err("hours")}>
          <Input type="number" min={0.5} step={0.5} value={f.hours} onChange={set("hours")} rightSlot={<span className="pr-2 text-body-sm">soat</span>} />
        </Field>
        <Field label="Mavzu tavsifi va qisqacha mazmuni" className="sm:col-span-2">
          <Textarea rows={3} value={f.description} onChange={set("description")} maxLength={2000} />
        </Field>
        <Field label="Oʻquv maqsadlari" hint="Har bir maqsad alohida qatorda" className="sm:col-span-2">
          <Textarea rows={3} value={f.objectives} onChange={set("objectives")} placeholder={"Oila aʼzolarini tasvirlay oladi\n1–2 daqiqalik monolog tayyorlaydi"} />
        </Field>
        <Field label="Lugʻat" hint="Vergul bilan: relative, sibling, cousin">
          <Input value={f.vocabulary} onChange={set("vocabulary")} />
        </Field>
        <Field label="Grammatika">
          <Input value={f.grammar} onChange={set("grammar")} placeholder="Present Simple vs Continuous" maxLength={500} />
        </Field>
        {topic?.status === "ARCHIVED" ? (
          <Alert tone="warning" className="sm:col-span-2">
            Mavzu arxivda. Uni qayta ishlatish uchun kartadagi “Arxivdan tiklash” tugmasini bosing.
          </Alert>
        ) : (
          <div className="rounded-lg bg-surface-container-low p-3 sm:col-span-2">
            <Checkbox
              checked={f.published}
              onChange={(e) => setF((s) => ({ ...s, published: e.target.checked }))}
              label="Ustozlar uchun dars rejasida darhol koʻrinsin"
              description="Tasdiqlangan mavzuni ustozlar darsni oʻtkazishda tanlay oladi. Belgilanmasa — qoralama."
            />
          </div>
        )}
      </form>
    </Dialog>
  );
}

const EMPTY_LEVEL = { code: "", name: "", audience: "", cefr: "", weeks: "", description: "" };

/** Bosqich (level) yaratish va tavsifini tahrirlash. Tavsif admin panelda bosqichlar roʻyxatida koʻrinadi. */
export function LevelDialog({
  open,
  onOpenChange,
  onCreated,
  level,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (id: string) => void;
  /** berilsa — tahrirlash rejimi */
  level?: LevelStat | null;
}) {
  const editing = !!level;
  const [f, setF] = useState(EMPTY_LEVEL);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setF(
        level
          ? {
              code: level.code,
              name: level.name,
              audience: level.audience ?? "",
              cefr: level.cefr ?? "",
              weeks: level.weeks != null ? String(level.weeks) : "",
              description: level.description ?? "",
            }
          : EMPTY_LEVEL,
      );
      setError(null);
    }
  }, [open, level]);

  const save = useApiMutation(
    (b: Record<string, unknown>) =>
      editing ? api.put<{ id: string }>(`/admin/curriculum/levels/${level!.id}`, b) : api.post<{ id: string }>("/admin/curriculum/levels", b),
    {
      invalidate: [["admin", "curriculum"], ["admin", "lookups"]],
      silentError: true,
      success: editing ? "Bosqich tavsifi saqlandi" : "Yangi bosqich yaratildi",
    },
  );

  const submit = async () => {
    if (!editing && !/^[A-Za-z0-9_-]{1,12}$/.test(f.code.trim())) return setError("Kod lotin harf va raqamlardan iborat boʻlsin (masalan L7)");
    if (f.name.trim().length < 2) return setError("Bosqich nomini kiriting");
    const weeks = f.weeks.trim() ? Number(f.weeks) : null;
    if (weeks !== null && (!Number.isInteger(weeks) || weeks < 1 || weeks > 200)) return setError("Davomiyligi 1 dan 200 gacha hafta boʻlsin");
    setError(null);
    try {
      const l = await save.mutateAsync({
        ...(editing ? {} : { code: f.code.trim().toUpperCase() }),
        name: f.name.trim(),
        audience: f.audience.trim() || null,
        cefr: f.cefr.trim() || null,
        weeks,
        description: f.description.trim() || null,
      });
      onOpenChange(false);
      onCreated(l.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Saqlab boʻlmadi");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !save.isPending && onOpenChange(o)}
      size="md"
      title={editing ? `Bosqich: ${level!.label ?? level!.name}` : "Yangi bosqich yaratish"}
      description={
        editing
          ? "Bu maʼlumotlar bosqichlar roʻyxatida koʻrinadi va yangi xodimga qaysi bosqich kimga moʻljallanganini tushuntiradi"
          : "Kod “L7” koʻrinishida boʻlsa, nom “Level 7 · …” deb koʻrsatiladi"
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Bekor qilish
          </Button>
          <Button icon={editing ? "save" : "add"} onClick={submit} loading={save.isPending}>
            {editing ? "Saqlash" : "Yaratish"}
          </Button>
        </>
      }
    >
      <form
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {error ? (
          <div className="sm:col-span-2">
            <Alert tone="danger">{error}</Alert>
          </div>
        ) : null}
        <Field label="Kod" required hint={editing ? "Kodni oʻzgartirib boʻlmaydi" : undefined}>
          <Input value={f.code} onChange={(e) => setF((s) => ({ ...s, code: e.target.value }))} placeholder="L7" maxLength={12} disabled={editing} autoFocus={!editing} />
        </Field>
        <Field label="Nomi" required>
          <Input value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} placeholder="Business English" maxLength={80} autoFocus={editing} />
        </Field>
        <Field label="Kimga moʻljallangan" hint="Guruh ochayotganda shu yozuv koʻrinadi">
          <Input value={f.audience} onChange={(e) => setF((s) => ({ ...s, audience: e.target.value }))} placeholder="13–16 yosh" maxLength={60} />
        </Field>
        <Field label="CEFR darajasi">
          <Input value={f.cefr} onChange={(e) => setF((s) => ({ ...s, cefr: e.target.value }))} placeholder="A2 → B1" maxLength={40} />
        </Field>
        <Field label="Davomiyligi (hafta)" hint="Boʻsh qoldirilsa darslar sonidan hisoblanadi">
          <Input value={f.weeks} onChange={(e) => setF((s) => ({ ...s, weeks: e.target.value }))} inputMode="numeric" placeholder="10" maxLength={3} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Tavsif" hint="Bosqich nima oʻrgatadi, qaysi kitob asosida, nima bilan farq qiladi">
            <Textarea
              value={f.description}
              onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))}
              rows={3}
              maxLength={1000}
              placeholder="Prepare 2e Level 1 asosida, Starter va 1–10-unitlar. Nolldan boshlaydiganlar uchun."
            />
          </Field>
        </div>
      </form>
    </Dialog>
  );
}
