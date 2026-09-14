// Ota-onalar sahifasi qismlari: oʻquvchi tanlagich, dialoglar va tafsilot paneli.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  DropdownMenu,
  EmptyState,
  Field,
  Icon,
  IconButton,
  Input,
  SearchInput,
  Select,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtDateTime, fmtPhone, fmtRelDateTime } from "@/lib/format";
import { useDebouncedValue } from "@/lib/hooks";
import { useApiMutation, useApiQuery } from "@/lib/query";
import type { Paginated } from "@/lib/types";
import { CopyButton, CredentialsDialog, InfoRow, ROLE_UZ, StudentStatusBadge } from "./shared";
import { normPhone, STUDENT_KEYS } from "./StudentDialogs";
import type { Credential, ParentDetail, ParentLookup, Relation, ResetResult, StudentRow } from "./types";

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Xatolik yuz berdi");
const REL_OPTS = [
  { value: "Ota", label: "Ota" },
  { value: "Ona", label: "Ona" },
  { value: "Vasiy", label: "Vasiy" },
];

// ─────────── Oʻquvchi tanlagich (GET /admin/students?q=) ───────────

export function StudentPicker({
  value,
  onChange,
  exclude = [],
}: {
  value: { id: string; fullName: string; code: string } | null;
  onChange: (s: { id: string; fullName: string; code: string } | null) => void;
  exclude?: string[];
}) {
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 250);
  const res = useApiQuery<Paginated<StudentRow>>(["admin", "students", "list"], dq.trim().length >= 2 ? "/admin/students" : null, {
    params: { q: dq.trim(), pageSize: 8 },
  });
  if (value)
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/40 bg-primary-fixed/40 px-3 py-2">
        <span className="flex min-w-0 items-center gap-2">
          <Avatar name={value.fullName} size="sm" />
          <span className="truncate font-label-md text-label-md">{value.fullName}</span>
          <span className="text-body-sm text-on-surface-variant">#{value.code}</span>
        </span>
        <IconButton icon="close" label="Boshqa oʻquvchi" size="sm" variant="ghost" onClick={() => onChange(null)} />
      </div>
    );
  const items = (res.data?.items ?? []).filter((s) => !exclude.includes(s.id));
  return (
    <div className="flex flex-col gap-1.5">
      <SearchInput value={q} onValueChange={setQ} placeholder="Oʻquvchi ismi yoki ID (kamida 2 belgi)…" autoFocus />
      {dq.trim().length >= 2 ? (
        <div className="max-h-56 overflow-y-auto rounded-lg border border-outline-variant/70">
          {res.isFetching && !res.data ? (
            <div className="p-3">
              <Skeleton className="h-4 w-40" />
            </div>
          ) : items.length ? (
            items.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange({ id: s.id, fullName: s.fullName, code: s.code })}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-surface-container-low"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar name={s.fullName} size="sm" />
                  <span className="truncate font-label-md text-label-md">{s.fullName}</span>
                  <span className="text-body-sm text-on-surface-variant">#{s.code}</span>
                </span>
                <span className="truncate text-body-sm text-on-surface-muted">{s.groups[0]?.name ?? ""}</span>
              </button>
            ))
          ) : (
            <p className="p-3 text-body-sm text-on-surface-variant">Topilmadi</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ─────────── Yangi ota-ona / mavjudini farzandga bogʻlash ───────────

export function CreateParentDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: (c: Credential, parentId: string) => void;
}) {
  const [student, setStudent] = useState<{ id: string; fullName: string; code: string } | null>(null);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [relation, setRelation] = useState<Relation>("Ota");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setStudent(null);
      setPhone("");
      setFullName("");
      setRelation("Ota");
      setError(null);
    }
  }, [open]);
  const norm = normPhone(useDebouncedValue(phone, 350));
  const lookup = useApiQuery<ParentLookup>(["admin", "parents", "lookup", norm], norm ? "/admin/parents/lookup" : null, { params: norm ? { phone: norm } : undefined });
  const existing = norm ? lookup.data?.parent : null;
  const conflict = norm ? lookup.data?.conflictRole : null;
  const save = useApiMutation(
    () => api.post<{ parent: { id: string }; credentials: Credential }>("/admin/parents", { phone: normPhone(phone), fullName: fullName.trim() || undefined, relation, studentId: student?.id }),
    {
      invalidate: STUDENT_KEYS,
      silentError: true,
      success: (r) => (r.credentials.existing ? "Mavjud ota-ona farzandga bogʻlandi" : "Ota-ona akkaunti yaratildi"),
      onSuccess: (r) => {
        onOpenChange(false);
        onDone(r.credentials, r.parent.id);
      },
      onError: (e) => setError(errMsg(e)),
    },
  );
  const phoneInvalid = phone.trim() !== "" && !normPhone(phone);
  const canSave = !!student && !!normPhone(phone) && !conflict && (existing || fullName.trim().length >= 3);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ota-ona qoʻshish"
      description="Telefon raqami login boʻladi. Raqam tizimda boʻlsa, mavjud akkaunt farzandga bogʻlanadi."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button icon="person_add" disabled={!canSave} loading={save.isPending} onClick={() => save.mutate()}>
            Saqlash
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Field label="Farzand (oʻquvchi)" required>
          <StudentPicker value={student} onChange={setStudent} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <Field label="Telefon" required className="sm:col-span-3" error={phoneInvalid ? "+998XXXXXXXXX koʻrinishida kiriting" : conflict ? `Bu raqam ${ROLE_UZ[conflict].toLowerCase()} akkauntiga tegishli` : undefined}>
            <Input inputMode="tel" placeholder="+998 90 123-45-67" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Qarindoshlik" className="sm:col-span-2">
            <Select value={relation} onChange={(e) => setRelation(e.target.value as Relation)} options={REL_OPTS} />
          </Field>
          <Field label="Ism-familiya" required={!existing} className="sm:col-span-5">
            <Input value={existing ? existing.fullName : fullName} disabled={!!existing} onChange={(e) => setFullName(e.target.value)} placeholder="Masalan: Gulnoza Rahimova" />
          </Field>
        </div>
        {existing ? (
          <Alert tone="primary" title="Mavjud akkaunt">
            {existing.fullName} — farzandlari: {existing.children.map((c) => c.fullName).join(", ") || "yoʻq"}. Parol oʻzgarmaydi.
          </Alert>
        ) : null}
      </div>
    </Dialog>
  );
}

function LinkChildDialog({ parent, open, onOpenChange }: { parent: ParentDetail; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [student, setStudent] = useState<{ id: string; fullName: string; code: string } | null>(null);
  const [relation, setRelation] = useState<Relation>((parent.title as Relation) || "Ota");
  useEffect(() => {
    if (open) setStudent(null);
  }, [open]);
  const save = useApiMutation(() => api.post(`/admin/parents/${parent.id}/children`, { studentId: student?.id, relation }), {
    invalidate: STUDENT_KEYS,
    success: "Farzand bogʻlandi",
    onSuccess: () => onOpenChange(false),
  });
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Farzand bogʻlash"
      description={parent.fullName}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button icon="link" disabled={!student} loading={save.isPending} onClick={() => save.mutate()}>
            Bogʻlash
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Oʻquvchi" required>
          <StudentPicker value={student} onChange={setStudent} exclude={parent.children.map((c) => c.id)} />
        </Field>
        <Field label="Qarindoshlik">
          <Select value={relation} onChange={(e) => setRelation(e.target.value as Relation)} options={REL_OPTS} />
        </Field>
      </div>
    </Dialog>
  );
}

function EditParentDialog({ parent, open, onOpenChange }: { parent: ParentDetail; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [fullName, setFullName] = useState(parent.fullName);
  const [phone, setPhone] = useState(fmtPhone(parent.phone));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setFullName(parent.fullName);
      setPhone(parent.phone ? fmtPhone(parent.phone) : "");
      setError(null);
    }
  }, [open, parent]);
  const norm = normPhone(phone);
  const save = useApiMutation(() => api.put(`/admin/parents/${parent.id}`, { fullName: fullName.trim(), ...(norm && norm !== parent.phone ? { phone: norm } : {}) }), {
    invalidate: STUDENT_KEYS,
    silentError: true,
    success: "Saqlandi",
    onSuccess: () => onOpenChange(false),
    onError: (e) => setError(errMsg(e)),
  });
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ota-ona maʼlumotlari"
      description="Telefon oʻzgarsa, login ham oʻzgaradi"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button disabled={!norm || fullName.trim().length < 3} loading={save.isPending} onClick={() => save.mutate()}>
            Saqlash
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Field label="Ism-familiya" required>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Telefon (login)" required error={phone && !norm ? "+998XXXXXXXXX koʻrinishida kiriting" : undefined}>
          <Input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}

function ParentMessageDialog({ parent, open, onOpenChange }: { parent: ParentDetail; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [studentId, setStudentId] = useState(parent.children[0]?.id ?? "");
  const [body, setBody] = useState("");
  useEffect(() => {
    if (open) {
      setStudentId(parent.children[0]?.id ?? "");
      setBody("");
    }
  }, [open, parent]);
  const send = useApiMutation(() => api.post("/messages", { toUserId: parent.id, body: body.trim(), ...(studentId ? { studentId } : {}) }), {
    success: "Xabar yuborildi",
    onSuccess: () => onOpenChange(false),
  });
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Xabar yuborish"
      description={`${parent.fullName} · kabinetda va Telegram botda koʻrinadi`}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button icon="send" disabled={body.trim().length < 2} loading={send.isPending} onClick={() => send.mutate()}>
            Yuborish
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {parent.children.length > 1 ? (
          <Field label="Qaysi farzand haqida">
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} options={parent.children.map((c) => ({ value: c.id, label: c.fullName }))} />
          </Field>
        ) : null}
        <Field label="Xabar matni" required>
          <Textarea rows={5} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}

// ─────────── Tafsilot paneli ───────────

type Dlg = "edit" | "link" | "message" | "reset" | "block" | "unblock" | null;

const NOTIF_STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  SENT: { label: "Yuborildi", tone: "success" },
  PENDING: { label: "Navbatda", tone: "warning" },
  FAILED: { label: "Xato", tone: "danger" },
  SKIPPED: { label: "Faqat ilovada", tone: "neutral" },
};

export function ParentPanel({ id, onClose, bare }: { id: string; onClose?: () => void; bare?: boolean }) {
  const { data: p, isLoading, error } = useApiQuery<ParentDetail>(["admin", "parents", "detail", id], `/admin/parents/${id}`);
  const [dlg, setDlg] = useState<Dlg>(null);
  const [creds, setCreds] = useState<Credential[] | null>(null);
  const [unlink, setUnlink] = useState<{ id: string; name: string } | null>(null);
  const [reason, setReason] = useState("");

  const reset = useApiMutation(() => api.post<ResetResult>(`/admin/parents/${id}/reset-password`), {
    invalidate: [["admin", "parents"], ["admin", "audit"]],
    onSuccess: (r) => setCreds([{ role: "PARENT", userId: r.userId, fullName: r.fullName, login: r.login, password: r.password, existing: false }]),
  });
  const setActive = useApiMutation((isActive: boolean) => api.post(`/admin/parents/${id}/active`, { isActive, reason: reason.trim() || undefined }), {
    invalidate: STUDENT_KEYS,
    success: (_, a) => (a ? "Akkaunt faollashtirildi" : "Akkaunt bloklandi"),
  });
  const doUnlink = useApiMutation((studentId: string) => api.delete(`/admin/parents/${id}/children/${studentId}`), {
    invalidate: STUDENT_KEYS,
    success: "Bogʻlanish uzildi",
  });

  if (isLoading)
    return (
      <div className={cn("flex flex-col gap-4", !bare && "rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-6 shadow-card")}>
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  if (error || !p)
    return (
      <div className={cn(!bare && "rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-6 shadow-card")}>
        <EmptyState compact icon="person_off" title="Ota-ona topilmadi" description={error?.message} />
      </div>
    );

  return (
    <>
      <div className={cn("flex flex-col gap-4", !bare && "rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-5 shadow-card sm:p-6")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={p.fullName} size="xl" tone={p.isActive ? "solid" : "neutral"} className="rounded-xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-headline-md text-headline-md text-on-surface">{p.fullName}</h3>
                {p.isActive ? <Badge tone="primary">Faol</Badge> : <Badge tone="danger">Bloklangan</Badge>}
              </div>
              <p className="mt-0.5 flex items-center gap-1 whitespace-nowrap text-body-sm tabular-nums text-on-surface-variant">
                {fmtPhone(p.login)} <CopyButton value={p.login} label="Loginni nusxalash" />
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <DropdownMenu
              trigger={<IconButton icon="more_vert" label="Amallar" size="sm" variant="ghost" />}
              label="Boshqarish"
              items={[
                { label: "Tahrirlash", icon: "edit", onSelect: () => setDlg("edit") },
                { label: "Parolni tiklash", icon: "lock_reset", onSelect: () => setDlg("reset") },
                "separator",
                p.isActive
                  ? { label: "Bloklash", icon: "block", tone: "danger", onSelect: () => (setReason(""), setDlg("block")) }
                  : { label: "Qayta faollashtirish", icon: "lock_open", onSelect: () => setDlg("unblock") },
              ]}
            />
            {onClose ? <IconButton icon="close" label="Yopish" size="sm" variant="ghost" onClick={onClose} /> : null}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-lg bg-surface-container-low p-3 text-center">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Farzandlar</p>
            <p className="font-headline-md text-headline-md tabular-nums text-primary">{p.children.length}</p>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Xabarlar</p>
            <p className="font-headline-md text-headline-md tabular-nums">{(p.notificationStats.SENT ?? 0) + (p.notificationStats.SKIPPED ?? 0) + (p.notificationStats.PENDING ?? 0)}</p>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Telegram</p>
            <p className={cn("font-headline-md text-headline-md", p.telegram.linked ? "text-primary" : "text-on-surface-muted")}>{p.telegram.linked ? "Bor" : "Yoʻq"}</p>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-low p-4">
          <InfoRow label="Telefon:" icon="call">
            <span className="inline-flex items-center gap-0.5">
              {fmtPhone(p.phone)}
              {p.phone ? <CopyButton value={p.phone} label="Telefonni nusxalash" /> : null}
            </span>
          </InfoRow>
          <InfoRow label="Telegram bot:" icon="send">
            {p.telegram.linked ? <span className="text-primary">@{p.telegram.username ?? "ulangan"}</span> : "Ulanmagan"}
          </InfoRow>
          {p.telegram.linkedAt ? <InfoRow label="Ulangan sana:" icon="event">{fmtDateTime(p.telegram.linkedAt)}</InfoRow> : null}
          <InfoRow label="Soʻnggi kirish:" icon="schedule">
            {p.lastLoginAt ? fmtRelDateTime(p.lastLoginAt) : "Hali kirmagan"}
          </InfoRow>
          {p.mustChangePassword ? (
            <p className="mt-1 flex items-center gap-1.5 text-body-sm text-warning">
              <Icon name="key" size={16} /> Vaqtinchalik parol hali almashtirilmagan
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Farzandlar</span>
            <Button size="sm" variant="link" icon="link" onClick={() => setDlg("link")}>
              Farzand bogʻlash
            </Button>
          </div>
          {p.children.length ? (
            <ul className="flex flex-col gap-2">
              {p.children.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-outline-variant/70 px-3 py-2">
                  <Link to={`/admin/oquvchilar?id=${c.id}`} className="flex min-w-0 items-center gap-2 hover:text-primary">
                    <Avatar name={c.fullName} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate font-label-md text-label-md">{c.fullName}</span>
                      <span className="block truncate text-body-sm text-on-surface-variant">
                        #{c.code} · {c.relation}
                        {c.groups.length ? ` · ${c.groups.map((g) => g.name).join(", ")}` : ""}
                      </span>
                    </span>
                  </Link>
                  <span className="flex shrink-0 items-center gap-1">
                    <StudentStatusBadge status={c.status} />
                    <IconButton icon="link_off" label="Bogʻlanishni uzish" size="sm" variant="ghost" onClick={() => setUnlink({ id: c.id, name: c.fullName })} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Alert tone="warning">Farzand bogʻlanmagan</Alert>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Soʻnggi bildirishnomalar</span>
          {p.notifications.length ? (
            <ul className="flex flex-col divide-y divide-outline-variant/60">
              {p.notifications.map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-2 py-1.5 text-body-sm">
                  <span className="min-w-0 truncate">{n.title}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-on-surface-muted">
                    {fmtRelDateTime(n.createdAt)}
                    <Badge tone={NOTIF_STATUS[n.status]?.tone ?? "neutral"} size="sm">
                      {NOTIF_STATUS[n.status]?.label ?? n.status}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body-sm text-on-surface-variant">Hali bildirishnoma yoʻq</p>
          )}
        </div>

        {p.audit.length ? (
          <div className="flex flex-col gap-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Jurnal</span>
            <ul className="flex flex-col gap-1.5">
              {p.audit.slice(0, 5).map((a) => (
                <li key={a.id} className="text-body-sm">
                  <span className="text-on-surface">{a.summary ?? a.action}</span>
                  <span className="block text-on-surface-muted">
                    {fmtDateTime(a.at)} · {a.actor?.fullName ?? "Tizim"}
                  </span>
                </li>
              ))}
            </ul>
            <Link to={`/admin/jurnal?q=${encodeURIComponent(p.id)}`} className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:underline">
              Tizim jurnalida <Icon name="arrow_forward" size={16} />
            </Link>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Button block icon="send" onClick={() => setDlg("message")} disabled={!p.isActive}>
            Xabar yuborish
          </Button>
          <Button block variant="secondary" icon="lock_reset" onClick={() => setDlg("reset")}>
            Parolni tiklash
          </Button>
        </div>
      </div>

      <EditParentDialog parent={p} open={dlg === "edit"} onOpenChange={(o) => setDlg(o ? "edit" : null)} />
      <LinkChildDialog parent={p} open={dlg === "link"} onOpenChange={(o) => setDlg(o ? "link" : null)} />
      <ParentMessageDialog parent={p} open={dlg === "message"} onOpenChange={(o) => setDlg(o ? "message" : null)} />
      <ConfirmDialog
        open={dlg === "reset"}
        onOpenChange={(o) => setDlg(o ? "reset" : null)}
        tone="primary"
        title="Parolni tiklash"
        description={`${p.fullName} uchun yangi vaqtinchalik parol yaratiladi, barcha sessiyalar yopiladi.`}
        confirmLabel="Tiklash"
        onConfirm={() => reset.mutateAsync()}
      />
      <Dialog
        open={dlg === "block"}
        onOpenChange={(o) => setDlg(o ? "block" : null)}
        title="Akkauntni bloklash"
        description={`${p.fullName} tizimga kira olmaydi, sessiyalari yopiladi. Farzand bogʻlanishlari saqlanadi.`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDlg(null)}>
              Bekor qilish
            </Button>
            <Button variant="danger" loading={setActive.isPending} onClick={() => setActive.mutate(false, { onSuccess: () => setDlg(null) })}>
              Bloklash
            </Button>
          </>
        }
      >
        <Field label="Sabab" hint="Jurnalga yoziladi">
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
        </Field>
      </Dialog>
      <ConfirmDialog
        open={dlg === "unblock"}
        onOpenChange={(o) => setDlg(o ? "unblock" : null)}
        tone="primary"
        title="Qayta faollashtirish"
        description={`${p.fullName} yana tizimga kira oladi.`}
        confirmLabel="Faollashtirish"
        onConfirm={() => setActive.mutateAsync(true)}
      />
      <ConfirmDialog
        open={!!unlink}
        onOpenChange={(o) => !o && setUnlink(null)}
        title="Bogʻlanish uzilsinmi?"
        description={unlink ? `${p.fullName} endi ${unlink.name} maʼlumotlarini koʻrmaydi va bildirishnoma olmaydi.` : undefined}
        confirmLabel="Uzish"
        onConfirm={() => (unlink ? doUnlink.mutateAsync(unlink.id) : undefined)}
      />
      <CredentialsDialog open={!!creds} onOpenChange={(o) => !o && setCreds(null)} credentials={creds ?? []} />
    </>
  );
}
