// Oʻquvchi formalari: yaratish (ota-ona bilan), tahrirlash, holat, guruhga yozish, xabar, ota-ona bogʻlash.
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Alert, Badge, Button, Checkbox, Dialog, Field, Icon, IconButton, Input, Select, Textarea } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { fmtPhone, todayYmd } from "@/lib/format";
import { useDebouncedValue } from "@/lib/hooks";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { STUDENT_STATUS_LONG, useFormOptions, type GroupOption } from "./shared";
import type { CreateStudentResult, Credential, ParentLookup, Relation, StudentDetail, StudentStatus } from "./types";

export const STUDENT_KEYS = [["admin", "students"], ["admin", "parents"], ["admin", "b", "options"], ["admin", "audit"], ["me", "nav-badges"]];

/** "+998 90 123-45-67" / "901234567" → "+998901234567" yoki null */
export function normPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length === 12 && digits.startsWith("998")) return `+${digits}`;
  return null;
}

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Xatolik yuz berdi");

export function groupLabel(g: GroupOption) {
  const full = g.taken >= g.capacity;
  return `${g.name} · ${g.taken}/${g.capacity}${full ? " (toʻla)" : g.status === "ENROLLING" ? " (qabul)" : ""}`;
}

/** Guruh tanlash + sigʻim ogohlantirishi. */
function GroupPicker({
  value,
  onChange,
  waiting,
  onWaiting,
  exclude = [],
  optional,
}: {
  value: string;
  onChange: (v: string) => void;
  waiting: boolean;
  onWaiting: (v: boolean) => void;
  exclude?: string[];
  optional?: boolean;
}) {
  const { data, isLoading } = useFormOptions();
  const groups = (data?.groups ?? []).filter((g) => !exclude.includes(g.id));
  const g = groups.find((x) => x.id === value);
  const full = g ? g.taken >= g.capacity : false;
  useEffect(() => {
    if (!full && waiting) onWaiting(false);
  }, [full, waiting, onWaiting]);
  return (
    <div className="flex flex-col gap-2">
      <Field label="Guruh" hint={optional ? "Ixtiyoriy — keyin ham qoʻshish mumkin" : undefined} required={!optional}>
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isLoading ? "Yuklanmoqda…" : optional ? "Hozircha guruhsiz" : "Guruhni tanlang…"}
          options={groups.map((x) => ({ value: x.id, label: groupLabel(x) }))}
        />
      </Field>
      {g && full ? (
        <Alert tone="warning" title={`Guruh toʻla (${g.taken}/${g.capacity})`}>
          <Checkbox checked={waiting} onChange={(e) => onWaiting(e.target.checked)} label="Kutish roʻyxatiga qoʻshish" description="Joy boʻshaganda faol holatga oʻtkaziladi" />
        </Alert>
      ) : g && g.status === "ENROLLING" ? (
        <p className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
          <Icon name="info" size={16} /> Guruh hali boshlanmagan — oʻquvchi «kutmoqda» holatida yoziladi.
        </p>
      ) : null}
    </div>
  );
}

// ─────────── Ota-ona qatori (telefon boʻyicha mavjud akkauntni aniqlash) ───────────

interface ParentDraft {
  key: number;
  phone: string;
  fullName: string;
  relation: Relation;
}

function useParentLookup(phone: string) {
  const norm = normPhone(useDebouncedValue(phone, 350));
  const q = useApiQuery<ParentLookup>(["admin", "parents", "lookup", norm], norm ? "/admin/parents/lookup" : null, {
    params: norm ? { phone: norm } : undefined,
    staleTime: 10_000,
  });
  return { norm, lookup: norm ? q.data : undefined, loading: q.isFetching };
}

function ParentFields({
  value,
  onChange,
  onRemove,
  index,
}: {
  value: ParentDraft;
  onChange: (p: ParentDraft) => void;
  onRemove?: () => void;
  index: number;
}) {
  const { lookup, loading } = useParentLookup(value.phone);
  const existing = lookup?.parent;
  const conflict = lookup?.conflictRole;
  const phoneInvalid = value.phone.trim() !== "" && !normPhone(value.phone);
  return (
    <div className="rounded-xl border border-outline-variant/70 bg-surface-container-low p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-label-md text-label-md text-on-surface-variant">{index + 1}-ota-ona</span>
        {onRemove ? <IconButton icon="close" label="Olib tashlash" size="sm" variant="ghost" onClick={onRemove} /> : null}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <Field
          label="Telefon"
          required
          className="sm:col-span-3"
          error={phoneInvalid ? "+998XXXXXXXXX koʻrinishida kiriting" : conflict ? "Bu raqam ota-ona boʻlmagan akkauntga tegishli" : undefined}
        >
          <Input
            inputMode="tel"
            placeholder="+998 90 123-45-67"
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
            rightSlot={loading ? <Icon name="progress_activity" size={18} className="animate-spin" /> : undefined}
          />
        </Field>
        <Field label="Qarindoshlik" className="sm:col-span-2">
          <Select
            value={value.relation}
            onChange={(e) => onChange({ ...value, relation: e.target.value as Relation })}
            options={[
              { value: "Ota", label: "Ota" },
              { value: "Ona", label: "Ona" },
              { value: "Vasiy", label: "Vasiy" },
            ]}
          />
        </Field>
        <Field label="Ism-familiya" required={!existing} className="sm:col-span-5">
          <Input
            placeholder="Masalan: Rustam Valiyev"
            value={existing ? existing.fullName : value.fullName}
            disabled={!!existing}
            onChange={(e) => onChange({ ...value, fullName: e.target.value })}
          />
        </Field>
      </div>
      {existing ? (
        <p className="mt-3 flex items-start gap-1.5 text-body-sm text-primary">
          <Icon name="link" size={16} className="mt-0.5" />
          <span>
            Mavjud akkaunt bogʻlanadi: <b>{existing.fullName}</b>
            {existing.children.length ? ` · farzandlari: ${existing.children.map((c) => c.fullName).join(", ")}` : ""}. Yangi parol berilmaydi.
          </span>
        </p>
      ) : null}
    </div>
  );
}

// ─────────── Yangi oʻquvchi ───────────

let keySeq = 1;
const newParent = (relation: Relation = "Ota"): ParentDraft => ({ key: keySeq++, phone: "", fullName: "", relation });

export function CreateStudentDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (r: CreateStudentResult) => void;
}) {
  const [form, setForm] = useState({ fullName: "", birthDate: "", phone: "", goal: "", turnstileId: "", enrolledAt: todayYmd(), groupId: "" });
  const [waiting, setWaiting] = useState(false);
  const [parents, setParents] = useState<ParentDraft[]>([newParent()]);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ fullName: "", birthDate: "", phone: "", goal: "", turnstileId: "", enrolledAt: todayYmd(), groupId: "" });
      setParents([newParent()]);
      setWaiting(false);
      setError(null);
      setTouched(false);
    }
  }, [open]);

  const create = useApiMutation((body: unknown) => api.post<CreateStudentResult>("/admin/students", body), {
    invalidate: STUDENT_KEYS,
    silentError: true,
    success: (r) => `${r.student.fullName} qoʻshildi (#${r.student.code})`,
    onSuccess: (r) => {
      onOpenChange(false);
      onCreated(r);
    },
    onError: (e) => setError(errMsg(e)),
  });

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const nameErr = touched && form.fullName.trim().length < 3 ? "Ism-familiyani toʻliq kiriting" : undefined;
  const phoneErr = form.phone.trim() && !normPhone(form.phone) ? "+998XXXXXXXXX koʻrinishida kiriting" : undefined;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (form.fullName.trim().length < 3 || phoneErr) return;
    if (parents.some((p) => !normPhone(p.phone))) return setError("Ota-ona telefon raqamini +998XXXXXXXXX koʻrinishida kiriting");
    create.mutate({
      fullName: form.fullName.trim(),
      phone: form.phone.trim() ? normPhone(form.phone) : undefined,
      birthDate: form.birthDate || undefined,
      goal: form.goal.trim() || undefined,
      turnstileId: form.turnstileId.trim() || undefined,
      enrolledAt: form.enrolledAt || undefined,
      parents: parents.map((p) => ({ phone: normPhone(p.phone), fullName: p.fullName.trim() || undefined, relation: p.relation })),
      groupId: form.groupId || undefined,
      enrollmentStatus: waiting ? "WAITING" : undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Yangi oʻquvchi"
      description="Oʻquvchi va ota-ona akkauntlari bitta amalda yaratiladi. Kod (ST-####) va vaqtinchalik parollar avtomatik beriladi."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Bekor qilish
          </Button>
          <Button type="submit" form="create-student" icon="person_add" loading={create.isPending}>
            Oʻquvchini qoʻshish
          </Button>
        </>
      }
    >
      <form id="create-student" onSubmit={submit} className="flex flex-col gap-5" noValidate>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Ism-familiya" required error={nameErr} className="sm:col-span-2">
            <Input autoFocus placeholder="Masalan: Sardor Aliyev" value={form.fullName} onChange={set("fullName")} />
          </Field>
          <Field label="Tugʻilgan sana">
            <Input type="date" value={form.birthDate} onChange={set("birthDate")} max={todayYmd()} />
          </Field>
          <Field label="Oʻquvchi telefoni" hint="Ixtiyoriy" error={phoneErr}>
            <Input inputMode="tel" placeholder="+998 9X XXX-XX-XX" value={form.phone} onChange={set("phone")} />
          </Field>
          <Field label="Maqsad" hint="Masalan: IELTS 7.5+">
            <Input value={form.goal} onChange={set("goal")} />
          </Field>
          <Field label="Oʻqishga kelgan sana">
            <Input type="date" value={form.enrolledAt} onChange={set("enrolledAt")} />
          </Field>
          <Field label="Turniket ID" hint="Ixtiyoriy">
            <Input placeholder="TURN-0000" value={form.turnstileId} onChange={set("turnstileId")} />
          </Field>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-label-lg text-label-lg text-on-surface">Ota-ona</h3>
            {parents.length < 3 ? (
              <Button type="button" variant="link" size="sm" icon="add" onClick={() => setParents((p) => [...p, newParent(p.length === 1 && p[0].relation === "Ota" ? "Ona" : "Ota")])}>
                Yana ota-ona
              </Button>
            ) : null}
          </div>
          {parents.map((p, i) => (
            <ParentFields
              key={p.key}
              index={i}
              value={p}
              onChange={(np) => setParents((all) => all.map((x) => (x.key === p.key ? np : x)))}
              onRemove={parents.length > 1 ? () => setParents((all) => all.filter((x) => x.key !== p.key)) : undefined}
            />
          ))}
        </section>

        <section>
          <GroupPicker value={form.groupId} onChange={(v) => setForm((f) => ({ ...f, groupId: v }))} waiting={waiting} onWaiting={setWaiting} optional />
        </section>
      </form>
    </Dialog>
  );
}

// ─────────── Tahrirlash ───────────

export function EditStudentDialog({ student, open, onOpenChange }: { student: StudentDetail; open: boolean; onOpenChange: (o: boolean) => void }) {
  const init = () => ({
    fullName: student.fullName,
    phone: student.phone ? fmtPhone(student.phone) : "",
    birthDate: student.birthDate ?? "",
    goal: student.goal ?? "",
    turnstileId: student.turnstileId ?? "",
    enrolledAt: student.enrolledAt ?? "",
  });
  const [form, setForm] = useState(init);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setForm(init());
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const save = useApiMutation((body: unknown) => api.put(`/admin/students/${student.id}`, body), {
    invalidate: STUDENT_KEYS,
    silentError: true,
    success: "Maʼlumotlar saqlandi",
    onSuccess: () => onOpenChange(false),
    onError: (e) => setError(errMsg(e)),
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const phoneErr = form.phone.trim() && !normPhone(form.phone) ? "+998XXXXXXXXX koʻrinishida kiriting" : undefined;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (phoneErr || form.fullName.trim().length < 3) return;
    save.mutate({
      fullName: form.fullName.trim(),
      phone: form.phone.trim() ? normPhone(form.phone) : null,
      birthDate: form.birthDate || null,
      goal: form.goal.trim() || null,
      turnstileId: form.turnstileId.trim() || null,
      ...(form.enrolledAt ? { enrolledAt: form.enrolledAt } : {}),
    });
  };
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Oʻquvchi maʼlumotlarini tahrirlash"
      description={`#${student.code} · login oʻzgarmaydi`}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button type="submit" form="edit-student" loading={save.isPending}>
            Saqlash
          </Button>
        </>
      }
    >
      <form id="edit-student" onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2" noValidate>
        {error ? <Alert tone="danger" className="sm:col-span-2">{error}</Alert> : null}
        <Field label="Ism-familiya" required className="sm:col-span-2" error={form.fullName.trim().length < 3 ? "Ism-familiyani toʻliq kiriting" : undefined}>
          <Input value={form.fullName} onChange={set("fullName")} />
        </Field>
        <Field label="Tugʻilgan sana">
          <Input type="date" value={form.birthDate} onChange={set("birthDate")} />
        </Field>
        <Field label="Telefon" error={phoneErr}>
          <Input inputMode="tel" value={form.phone} onChange={set("phone")} />
        </Field>
        <Field label="Maqsad">
          <Input value={form.goal} onChange={set("goal")} />
        </Field>
        <Field label="Oʻqishga kelgan sana">
          <Input type="date" value={form.enrolledAt} onChange={set("enrolledAt")} />
        </Field>
        <Field label="Turniket ID" className="sm:col-span-2">
          <Input value={form.turnstileId} onChange={set("turnstileId")} />
        </Field>
      </form>
    </Dialog>
  );
}

// ─────────── Holat ───────────

export function StatusDialog({ student, open, onOpenChange }: { student: StudentDetail; open: boolean; onOpenChange: (o: boolean) => void }) {
  const choices = (Object.keys(STUDENT_STATUS_LONG) as StudentStatus[]).filter((s) => s !== student.status);
  const [status, setStatus] = useState<StudentStatus>(choices[0]);
  const [date, setDate] = useState(todayYmd());
  const [note, setNote] = useState("");
  useEffect(() => {
    if (open) {
      setStatus(choices[0]);
      setDate(todayYmd());
      setNote("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, student.status]);
  const save = useApiMutation((body: unknown) => api.post(`/admin/students/${student.id}/status`, body), {
    invalidate: STUDENT_KEYS,
    success: "Holat oʻzgartirildi",
    onSuccess: () => onOpenChange(false),
  });
  const closing = status === "LEFT" || status === "GRADUATED";
  const openGroups = student.groups.filter((g) => g.enrollmentStatus !== "LEFT");
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Holatni oʻzgartirish"
      description={`${student.fullName} · hozir: ${STUDENT_STATUS_LONG[student.status]}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button variant={closing ? "danger" : "primary"} loading={save.isPending} onClick={() => save.mutate({ status, date, note: note.trim() || undefined })}>
            Tasdiqlash
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Yangi holat">
          <Select value={status} onChange={(e) => setStatus(e.target.value as StudentStatus)} options={choices.map((s) => ({ value: s, label: STUDENT_STATUS_LONG[s] }))} />
        </Field>
        <Field label="Sana">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Izoh / sabab" hint="Jurnalga yoziladi">
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Masalan: oila koʻchib ketdi" />
        </Field>
        {closing && openGroups.length ? (
          <Alert tone="warning" title="Guruhlardan chiqariladi">
            {openGroups.map((g) => g.name).join(", ")}
          </Alert>
        ) : null}
      </div>
    </Dialog>
  );
}

// ─────────── Guruhga qoʻshish ───────────

export function EnrollDialog({
  studentId,
  studentName,
  exclude,
  open,
  onOpenChange,
}: {
  studentId: string;
  studentName: string;
  exclude: string[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [groupId, setGroupId] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setGroupId("");
      setWaiting(false);
      setError(null);
    }
  }, [open]);
  const save = useApiMutation((body: unknown) => api.post<{ group: { name: string } }>(`/admin/students/${studentId}/enrollments`, body), {
    invalidate: STUDENT_KEYS,
    silentError: true,
    success: (r) => `${r.group.name} guruhiga qoʻshildi`,
    onSuccess: () => onOpenChange(false),
    onError: (e) => setError(errMsg(e)),
  });
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Guruhga qoʻshish"
      description={`${studentName} · ota-onaga bildirishnoma yuboriladi`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button disabled={!groupId} loading={save.isPending} onClick={() => save.mutate({ groupId, ...(waiting ? { status: "WAITING" } : {}) })}>
            Qoʻshish
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <GroupPicker value={groupId} onChange={setGroupId} waiting={waiting} onWaiting={setWaiting} exclude={exclude} />
      </div>
    </Dialog>
  );
}

// ─────────── Ota-onaga xabar (umumiy /api/messages) ───────────

export function MessageDialog({
  studentId,
  studentName,
  parents,
  open,
  onOpenChange,
}: {
  studentId: string;
  studentName: string;
  parents: { id: string; fullName: string; relation: string }[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [to, setTo] = useState(parents[0]?.id ?? "");
  const [body, setBody] = useState("");
  useEffect(() => {
    if (open) {
      setTo(parents[0]?.id ?? "");
      setBody("");
    }
  }, [open, parents]);
  const send = useApiMutation(() => api.post("/messages", { toUserId: to, studentId, body: body.trim() }), {
    success: "Xabar yuborildi",
    onSuccess: () => onOpenChange(false),
  });
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ota-onaga xabar yuborish"
      description={`${studentName} haqida · ota-ona kabinetida va Telegram botda koʻrinadi`}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button icon="send" disabled={!to || body.trim().length < 2} loading={send.isPending} onClick={() => send.mutate()}>
            Yuborish
          </Button>
        </>
      }
    >
      {parents.length ? (
        <div className="flex flex-col gap-3">
          {parents.length > 1 ? (
            <Field label="Kimga">
              <Select value={to} onChange={(e) => setTo(e.target.value)} options={parents.map((p) => ({ value: p.id, label: `${p.fullName} (${p.relation})` }))} />
            </Field>
          ) : (
            <p className="text-body-md text-on-surface">
              Kimga: <b>{parents[0].fullName}</b> <Badge tone="neutral">{parents[0].relation}</Badge>
            </p>
          )}
          <Field label="Xabar matni" required>
            <Textarea rows={5} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Assalomu alaykum! …" />
          </Field>
        </div>
      ) : (
        <Alert tone="warning">Oʻquvchiga ota-ona bogʻlanmagan. Avval ota-ona hisobini ulang.</Alert>
      )}
    </Dialog>
  );
}

// ─────────── Ota-ona bogʻlash / yangi ota-ona ───────────

export function LinkParentDialog({
  studentId,
  studentName,
  open,
  onOpenChange,
  onCreated,
}: {
  studentId: string;
  studentName: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (c: Credential[]) => void;
}) {
  const [draft, setDraft] = useState<ParentDraft>(newParent());
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setDraft(newParent());
      setError(null);
    }
  }, [open]);
  const save = useApiMutation(
    (body: unknown) => api.post<{ credentials: Credential }>("/admin/parents", body),
    {
      invalidate: STUDENT_KEYS,
      silentError: true,
      success: (r) => (r.credentials.existing ? "Mavjud ota-ona bogʻlandi" : "Ota-ona akkaunti yaratildi"),
      onSuccess: (r) => {
        onOpenChange(false);
        onCreated([r.credentials]);
      },
      onError: (e) => setError(errMsg(e)),
    },
  );
  const norm = useMemo(() => normPhone(draft.phone), [draft.phone]);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ota-ona hisobini ulash"
      description={`${studentName} · telefon mavjud boʻlsa akkaunt bogʻlanadi, boʻlmasa yangisi yaratiladi`}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button icon="link" disabled={!norm} loading={save.isPending} onClick={() => save.mutate({ phone: norm, fullName: draft.fullName.trim() || undefined, relation: draft.relation, studentId })}>
            Ulash
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <ParentFields index={0} value={draft} onChange={setDraft} />
      </div>
    </Dialog>
  );
}
