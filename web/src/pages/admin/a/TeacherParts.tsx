// Ustozlar sahifasi: tafsilot paneli va akkaunt formasi.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert, Avatar, Badge, Button, Dialog, Field, Icon, Input, ProgressBar, Skeleton, Textarea,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtDateShort, fmtNum, fmtPercent, fmtPhone, fmtRelDateTime, fmtTime, fmtTimeRange, WEEKDAYS_SHORT } from "@/lib/format";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { GroupStatusBadge, InfoItem, keys, MOBILE_FULL_CLASS, Sheet } from "./shared";
import type { TeacherDetail, TeacherRow } from "./types";

export const MAX_WEEKLY_HOURS = 24; // yuklama chizig'i uchun me'yor (haftasiga)

export function TeacherDrawer({
  teacherId,
  onClose,
  onEdit,
  onResetPassword,
  onToggleActive,
}: {
  teacherId: string | null;
  onClose: () => void;
  onEdit: (t: TeacherDetail) => void;
  onResetPassword: (t: { id: string; fullName: string }) => void;
  onToggleActive: (t: { id: string; fullName: string; isActive: boolean }) => void;
}) {
  const q = useApiQuery<TeacherDetail>(["admin", "teachers", "detail", teacherId], teacherId ? `/admin/teachers/${teacherId}` : null);
  const t = q.data;
  return (
    <Sheet
      open={!!teacherId}
      onOpenChange={(o) => !o && onClose()}
      title={t ? t.fullName : "Ustoz"}
      description={t ? [t.title, t.profile.specialization].filter(Boolean).join(" · ") : undefined}
      footer={
        t ? (
          <>
            <Button
              variant="ghost"
              icon={t.isActive ? "block" : "check_circle"}
              className={cn("mr-auto", t.isActive ? "text-error" : "text-success")}
              onClick={() => onToggleActive(t)}
            >
              {t.isActive ? "Bloklash" : "Faollashtirish"}
            </Button>
            <Button variant="outline" icon="lock_reset" onClick={() => onResetPassword(t)}>
              Parolni tiklash
            </Button>
            <Button icon="edit" onClick={() => onEdit(t)}>
              Tahrirlash
            </Button>
          </>
        ) : null
      }
    >
      {q.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : q.error ? (
        <Alert tone="danger">{q.error.message}</Alert>
      ) : t ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={t.fullName} src={t.avatarUrl} size="xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1.5">
                {t.isActive ? <Badge tone="success" dot>Faol</Badge> : <Badge tone="danger" dot>Bloklangan</Badge>}
                {t.mustChangePassword ? <Badge tone="warning" icon="key">Vaqtinchalik parol</Badge> : null}
                {t.telegramLinked ? (
                  <Badge tone="primary" icon="send">Telegram{t.telegramUsername ? ` @${t.telegramUsername}` : ""}</Badge>
                ) : (
                  <Badge tone="neutral" icon="send">Telegram ulanmagan</Badge>
                )}
              </div>
              <div className="mt-1.5 text-body-sm text-on-surface-variant">
                {fmtPhone(t.phone)} · soʻnggi kirish: {t.lastLoginAt ? fmtRelDateTime(t.lastLoginAt) : "hali kirmagan"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { label: "Guruhlar", value: fmtNum(t.stats.groupsCount) },
              { label: "Oʻquvchilar", value: fmtNum(t.stats.studentsCount) },
              { label: "Haftalik soat", value: fmtNum(t.stats.weeklyHours) },
              { label: "Davomat (oy)", value: fmtPercent(t.stats.attendancePct, 0) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-surface-container-low p-3 text-center">
                <div className="text-body-sm text-on-surface-variant">{s.label}</div>
                <div className="font-headline-md text-headline-md text-on-surface">{s.value}</div>
              </div>
            ))}
          </div>
          {t.stats.pendingReviews ? (
            <Alert tone={t.stats.overdueReviews ? "warning" : "primary"} icon="assignment_late">
              Tekshiruvni kutayotgan {t.stats.pendingReviews} ta vazifa
              {t.stats.overdueReviews ? `, shundan ${t.stats.overdueReviews} tasi 48 soatdan oshgan` : ""}.
            </Alert>
          ) : null}

          <section>
            <h3 className="mb-2 font-headline-sm text-headline-sm">Haftalik jadval</h3>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {t.timetable
                .filter((d) => d.items.length || d.day <= 6)
                .map((d) => (
                  <div key={d.day} className="flex items-start gap-2 rounded-lg bg-surface-container-low p-2">
                    <span className="w-8 shrink-0 pt-0.5 font-label-md text-label-md text-on-surface-variant">{WEEKDAYS_SHORT[d.day - 1]}</span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      {d.items.length ? (
                        d.items.map((it) => (
                          <Link
                            key={it.groupId + it.startTime}
                            to={`/admin/guruhlar?group=${it.groupId}`}
                            className="truncate text-body-sm text-on-surface hover:text-primary"
                          >
                            <span className="tabular-nums text-on-surface-variant">{fmtTimeRange(it.startTime, it.endTime)}</span> {it.name}
                            {it.room ? ` · ${it.room}` : ""}
                          </Link>
                        ))
                      ) : (
                        <span className="text-body-sm text-on-surface-muted">Dars yoʻq</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-headline-sm text-headline-sm">Guruhlar ({t.groups.length})</h3>
            {t.groups.length === 0 ? (
              <p className="text-body-sm text-on-surface-muted">Guruh biriktirilmagan</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {t.groups.map((g) => (
                  <li key={g.id}>
                    <Link to={`/admin/guruhlar?group=${g.id}`} className="block rounded-xl border border-outline-variant p-3 transition-colors hover:bg-surface-container-low">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-label-lg text-label-lg text-on-surface">{g.name}</span>
                        <GroupStatusBadge status={g.status} />
                      </div>
                      <div className="mt-0.5 text-body-sm text-on-surface-variant">
                        {g.scheduleText}
                        {g.room ? ` · ${g.room.name}` : ""} · {g.studentsCount}/{g.capacity} nafar
                      </div>
                      <ProgressBar value={g.progress} size="sm" className="mt-2" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <InfoItem icon="workspace_premium" label="Sertifikatlar">
              {t.profile.certificates.length ? t.profile.certificates.join(", ") : "—"}
            </InfoItem>
            <InfoItem icon="history_edu" label="Tajriba">
              {t.profile.experienceYears != null ? `${t.profile.experienceYears} yil` : "—"}
            </InfoItem>
            <InfoItem icon="schedule_send" label="Javob vaqti">
              {t.profile.responseTime ?? "—"}
            </InfoItem>
            <InfoItem icon="badge" label="Akkaunt ochilgan">
              {fmtDateShort(t.createdAt)}
            </InfoItem>
          </section>
          {t.profile.bio ? <p className="rounded-xl bg-surface-container-low p-3 text-body-md text-on-surface-variant">{t.profile.bio}</p> : null}

          <section>
            <h3 className="mb-2 font-headline-sm text-headline-sm">Yaqin darslar</h3>
            {t.upcoming.length === 0 ? (
              <p className="text-body-sm text-on-surface-muted">Rejalashtirilgan dars yoʻq</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {t.upcoming.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 text-body-sm">
                    <span className="truncate">
                      <span className="font-label-md text-label-md">{fmtRelDateTime(l.startsAt)}</span> · {l.group.name}
                    </span>
                    <span className="shrink-0 text-on-surface-variant">{l.room ?? ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 font-headline-sm text-headline-sm">Soʻnggi faollik</h3>
            {t.activity.length === 0 ? (
              <p className="text-body-sm text-on-surface-muted">Harakatlar yoʻq</p>
            ) : (
              <ol className="flex flex-col gap-2.5">
                {t.activity.map((a) => (
                  <li key={a.id} className="flex gap-3 text-body-sm">
                    <span className="h-fit shrink-0 rounded bg-surface-container px-1.5 py-0.5 font-label-sm text-label-sm tabular-nums">{fmtTime(a.at)}</span>
                    <div className="min-w-0">
                      <div className="text-on-surface">{a.summary ?? a.action}</div>
                      <div className="text-on-surface-muted">
                        {fmtDateShort(a.at)} · {a.actor ?? "Tizim"}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      ) : null}
    </Sheet>
  );
}

// ─── Akkaunt formasi ───
interface TeacherForm {
  fullName: string;
  phone: string;
  title: string;
  specialization: string;
  certificates: string;
  experienceYears: string;
  responseTime: string;
  bio: string;
}

const emptyForm: TeacherForm = {
  fullName: "", phone: "+998 ", title: "Ustoz", specialization: "", certificates: "", experienceYears: "", responseTime: "", bio: "",
};

/** "+998 90 123-45-67" / "901234567" → "+998901234567" yoki null */
export function normalizePhone(raw: string) {
  const d = raw.replace(/\D/g, "");
  const full = d.length === 9 ? `998${d}` : d;
  return /^998\d{9}$/.test(full) ? `+${full}` : null;
}

type EditSource = Pick<TeacherDetail, "id" | "fullName" | "phone" | "title" | "profile"> | null;

export function TeacherFormDialog({
  open,
  onOpenChange,
  teacher,
  onCreated,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  teacher?: EditSource;
  onCreated?: (r: { teacher: { id: string; fullName: string; login: string }; tempPassword: string }) => void;
  onSaved?: () => void;
}) {
  const editing = !!teacher;
  const [f, setF] = useState<TeacherForm>(emptyForm);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setServerError(null);
    setF(
      teacher
        ? {
            fullName: teacher.fullName,
            phone: fmtPhone(teacher.phone),
            title: teacher.title ?? "",
            specialization: teacher.profile.specialization ?? "",
            certificates: teacher.profile.certificates.join(", "),
            experienceYears: teacher.profile.experienceYears != null ? String(teacher.profile.experienceYears) : "",
            responseTime: teacher.profile.responseTime ?? "",
            bio: teacher.profile.bio ?? "",
          }
        : emptyForm,
    );
  }, [open, teacher]);

  const phone = normalizePhone(f.phone);
  const errors: Partial<Record<keyof TeacherForm, string>> = {};
  if (f.fullName.trim().length < 3) errors.fullName = "F.I.Sh. kamida 3 belgi";
  if (!phone) errors.phone = "Telefon +998 XX XXX-XX-XX koʻrinishida";
  const exp = f.experienceYears.trim() ? Number(f.experienceYears) : null;
  if (exp != null && (!Number.isInteger(exp) || exp < 0 || exp > 60)) errors.experienceYears = "0 dan 60 gacha";
  const invalid = Object.keys(errors).length > 0;
  const err = (k: keyof TeacherForm) => (touched ? errors[k] : undefined);
  const set = (k: keyof TeacherForm) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  type Created = { teacher: { id: string; fullName: string; login: string }; tempPassword: string };
  const save = useApiMutation(
    (body: object): Promise<Created | { ok: true }> =>
      editing ? api.put<{ ok: true }>(`/admin/teachers/${teacher?.id}`, body) : api.post<Created>("/admin/teachers", body),
    { invalidate: keys("teachers"), silentError: true },
  );

  const submit = async () => {
    setTouched(true);
    setServerError(null);
    if (invalid) return;
    const body = {
      fullName: f.fullName.trim(),
      phone,
      title: f.title.trim() || null,
      specialization: f.specialization.trim() || null,
      certificates: f.certificates.split(",").map((s) => s.trim()).filter(Boolean),
      experienceYears: exp,
      responseTime: f.responseTime.trim() || null,
      bio: f.bio.trim() || null,
    };
    try {
      const res = await save.mutateAsync(body);
      onOpenChange(false);
      if (!editing && "tempPassword" in res) onCreated?.(res);
      else onSaved?.();
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Saqlab boʻlmadi");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !save.isPending && onOpenChange(o)}
      size="lg"
      className={MOBILE_FULL_CLASS}
      title={editing ? `${teacher?.fullName} — tahrirlash` : "Yangi ustoz akkaunti"}
      description={editing ? "Telefon raqami oʻzgarsa, kirish logini ham oʻzgaradi" : "Login — telefon raqami. Vaqtinchalik parol saqlangandan keyin bir marta koʻrsatiladi"}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Bekor qilish
          </Button>
          <Button icon={editing ? "save" : "person_add"} onClick={submit} loading={save.isPending} disabled={touched && invalid}>
            {editing ? "Saqlash" : "Akkaunt ochish"}
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
        <Field label="F.I.Sh." required error={err("fullName")} className="sm:col-span-2">
          <Input value={f.fullName} onChange={set("fullName")} placeholder="Masalan: Alisher Qosimov" autoFocus={!editing} maxLength={80} />
        </Field>
        <Field label="Telefon (login)" required error={err("phone")} hint={phone ? `Login: ${fmtPhone(phone)}` : undefined}>
          <Input value={f.phone} onChange={set("phone")} inputMode="tel" autoComplete="off" icon="call" />
        </Field>
        <Field label="Unvon" hint="Masalan: IELTS katta ustozi">
          <Input value={f.title} onChange={set("title")} maxLength={80} />
        </Field>
        <Field label="Mutaxassislik" hint="Masalan: IELTS 8.5, CELTA">
          <Input value={f.specialization} onChange={set("specialization")} maxLength={80} />
        </Field>
        <Field label="Tajriba (yil)" error={err("experienceYears")}>
          <Input type="number" min={0} max={60} value={f.experienceYears} onChange={set("experienceYears")} />
        </Field>
        <Field label="Sertifikatlar" hint="Vergul bilan ajrating: IELTS 8.5, CELTA" className="sm:col-span-2">
          <Input value={f.certificates} onChange={set("certificates")} />
        </Field>
        <Field label="Javob vaqti" hint="Ota-onalarga koʻrinadi: “odatda 1–2 soat”">
          <Input value={f.responseTime} onChange={set("responseTime")} maxLength={60} />
        </Field>
        <div className="hidden sm:block" />
        <Field label="Qisqacha maʼlumot" className="sm:col-span-2">
          <Textarea rows={3} value={f.bio} onChange={set("bio")} maxLength={1500} />
        </Field>
      </form>
    </Dialog>
  );
}

/** Jadvaldagi yuklama katakchasi */
export function LoadCell({ t }: { t: Pick<TeacherRow, "weeklyHours" | "groupsCount" | "highLoad"> }) {
  return (
    <div className="w-32">
      <div className="flex justify-between font-label-sm text-label-sm tabular-nums">
        <span>{fmtNum(t.weeklyHours)} soat</span>
        <span className={t.highLoad ? "text-warning" : "text-on-surface-variant"}>{t.groupsCount} guruh</span>
      </div>
      <ProgressBar value={t.weeklyHours} max={MAX_WEEKLY_HOURS} size="sm" tone={t.highLoad ? "warning" : "primary"} className="mt-1.5" />
      {t.highLoad ? (
        <div className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] text-warning">
          <Icon name="trending_up" size={12} /> yuklama yuqori
        </div>
      ) : null}
    </div>
  );
}
