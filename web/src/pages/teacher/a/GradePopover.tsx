// Darsdagi baho qo'yish / bahoni tahrirlash (PUT /teacher/grades/:id — audit "grade.update" 4 → 5).
import { useState, type ReactNode } from "react";
import { Button, ConfirmDialog, Popover, Select, Textarea, softTone, solidTone } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { gradeLabel, gradeTone } from "@/lib/format";
import { useApiMutation } from "@/lib/query";
import { SKILL_LABEL, gradeKeys } from "./shared";
import type { GradeDto, Skill } from "./types";

const VALUES = [5, 4, 3, 2] as const;
const SKILL_OPTIONS = (Object.keys(SKILL_LABEL) as Skill[]).map((s) => ({ value: s, label: SKILL_LABEL[s] }));

type Props =
  | { mode: "create"; trigger: ReactNode; lessonId: string; studentId: string; studentName: string }
  | { mode: "edit"; trigger: ReactNode; grade: GradeDto; studentName: string };

export function GradePopover(props: Props) {
  const edit = props.mode === "edit" ? props.grade : null;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<number | null>(edit ? edit.value : null);
  const [skill, setSkill] = useState<string>(edit?.skill ?? "");
  const [comment, setComment] = useState(edit?.comment ?? "");
  const [confirmDel, setConfirmDel] = useState(false);

  const onOpenChange = (o: boolean) => {
    if (o) {
      setValue(edit ? edit.value : null);
      setSkill(edit?.skill ?? "");
      setComment(edit?.comment ?? "");
    }
    setOpen(o);
  };

  const save = useApiMutation(
    () => {
      const body = { value, skill: skill || null, comment: comment.trim() || null };
      return props.mode === "create"
        ? api.post(`/teacher/lessons/${props.lessonId}/grades`, { ...body, studentId: props.studentId })
        : api.put(`/teacher/grades/${props.grade.id}`, body);
    },
    {
      invalidate: gradeKeys,
      success: () =>
        props.mode === "create"
          ? `${props.studentName}: ${value} (${gradeLabel(value)}) qoʻyildi — ota-onaga xabar yuborildi`
          : "Baho yangilandi",
      onSuccess: () => setOpen(false),
    },
  );
  const del = useApiMutation(() => api.delete(`/teacher/grades/${edit!.id}`), {
    invalidate: gradeKeys,
    success: "Baho oʻchirildi",
    onSuccess: () => setOpen(false),
  });

  const canDelete = !!edit && edit.kind === "CLASSWORK";
  const unchanged = !!edit && value === edit.value && (skill || null) === (edit.skill ?? null) && (comment.trim() || null) === (edit.comment ?? null);

  return (
    <>
      <Popover trigger={props.trigger} open={open} onOpenChange={onOpenChange} align="end" className="w-[min(20rem,calc(100vw-2rem))] p-4">
        <div className="mb-3">
          <div className="font-label-lg text-label-lg text-on-surface">{edit ? "Bahoni oʻzgartirish" : "Baho qoʻyish"}</div>
          <div className="truncate text-body-sm text-on-surface-variant">
            {props.studentName}
            {edit?.title ? ` · ${edit.title}` : ""}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Baho">
          {VALUES.map((v) => {
            const on = value === v;
            const tone = gradeTone(v);
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setValue(v)}
                className={cn(
                  "flex h-14 flex-col items-center justify-center rounded-lg border transition-colors",
                  on ? cn(solidTone[tone], "border-transparent") : cn("border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low"),
                )}
              >
                <span className="font-headline-md text-headline-md tabular-nums">{v}</span>
                <span className={cn("text-[10px] leading-none", on ? "opacity-90" : "text-on-surface-muted")}>{gradeLabel(v)}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <Select value={skill} onChange={(e) => setSkill(e.target.value)} options={SKILL_OPTIONS} placeholder="Koʻnikma (ixtiyoriy)" size="sm" aria-label="Koʻnikma" />
          <Textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} placeholder="Izoh (ixtiyoriy, ota-onaga koʻrinadi)" aria-label="Izoh" />
        </div>
        {edit && value !== edit.value && value != null ? (
          <p className={cn("mt-2 rounded-lg px-2.5 py-1.5 text-body-sm", softTone.warning)}>
            {edit.value} → {value}: oʻzgarish tizim jurnaliga yoziladi va ota-onaga xabar boradi.
          </p>
        ) : null}
        <div className="mt-3 flex items-center justify-between gap-2">
          {canDelete ? (
            <Button variant="ghost" size="sm" icon="delete" className="text-error hover:bg-error-container hover:text-error" onClick={() => setConfirmDel(true)}>
              Oʻchirish
            </Button>
          ) : (
            <span />
          )}
          <Button size="sm" icon="check" disabled={value == null || unchanged} loading={save.isPending} onClick={() => save.mutate()}>
            Saqlash
          </Button>
        </div>
      </Popover>
      {canDelete ? (
        <ConfirmDialog
          open={confirmDel}
          onOpenChange={setConfirmDel}
          title="Baho oʻchirilsinmi?"
          description={`${props.studentName}: ${edit!.value} (${gradeLabel(edit!.value)}). Amal tizim jurnaliga yoziladi.`}
          confirmLabel="Oʻchirish"
          onConfirm={() => del.mutateAsync()}
        />
      ) : null}
    </>
  );
}
