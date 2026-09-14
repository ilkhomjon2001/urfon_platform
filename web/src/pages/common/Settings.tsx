import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Field,
  Icon,
  PageHeader,
  PasswordInput,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth, useCurrentUser } from "@/lib/auth";
import { fmtPhone } from "@/lib/format";
import { toastError, useApiMutation } from "@/lib/query";
import { CABINET_NAME, ROLE_LABEL } from "@/lib/roles";
import type { User } from "@/lib/types";

export default function SettingsPage() {
  const user = useCurrentUser();
  return (
    <>
      <PageHeader title="Sozlamalar" subtitle="Profil maʼlumotlari, xavfsizlik va Telegram bildirishnomalari" />
      {user.mustChangePassword ? (
        <Alert tone="warning" icon="lock_reset" title="Parolni almashtiring" className="mb-6">
          Siz vaqtinchalik parol bilan kirdingiz. Xavfsizlik uchun yangi parol oʻrnating — shundan soʻng kabinetning barcha boʻlimlari
          ochiladi.
        </Alert>
      ) : null}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <ProfileCard user={user} />
        <div className="flex min-w-0 flex-col gap-6">
          <PasswordCard />
          <TelegramCard user={user} />
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- profil

function ProfileCard({ user }: { user: User }) {
  const rows: { icon: string; label: string; value: string }[] = [
    { icon: "badge", label: "Login", value: user.login },
    { icon: "call", label: "Telefon", value: fmtPhone(user.phone) },
    { icon: "shield_person", label: "Rol", value: ROLE_LABEL[user.role] },
  ];
  if (user.student) {
    rows.push({ icon: "tag", label: "Oʻquvchi ID", value: `#${user.student.code}` });
    rows.push({ icon: "groups", label: "Guruh", value: user.student.group?.name ?? "—" });
  }
  return (
    <Card>
      <CardContent className="flex flex-col items-center text-center">
        {/* Oʻquvchi surati ishlatilmaydi — bosh harflar */}
        <Avatar
          name={user.fullName}
          src={user.role === "STUDENT" ? null : user.avatarUrl}
          tone="solid"
          size="xl"
          className="h-20 w-20 text-[24px]"
        />
        <h2 className="mt-4 font-headline-md text-headline-md text-on-surface">{user.fullName}</h2>
        <p className="text-body-md text-on-surface-variant">{user.title ?? ROLE_LABEL[user.role]}</p>
        <Badge tone="primary" className="mt-3">
          {CABINET_NAME[user.role]}
        </Badge>
      </CardContent>
      <dl className="divide-y divide-outline-variant/70 border-t border-outline-variant/70">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
            <dt className="flex shrink-0 items-center gap-2.5 text-body-md text-on-surface-variant">
              <Icon name={r.icon} size={18} />
              {r.label}
            </dt>
            <dd className="truncate font-label-lg text-label-lg text-on-surface">{r.value}</dd>
          </div>
        ))}
      </dl>
      {user.children?.length ? (
        <div className="border-t border-outline-variant/70 px-5 py-4 sm:px-6">
          <div className="mb-3 font-label-md text-label-md text-on-surface-variant">Farzandlar</div>
          <ul className="space-y-2.5">
            {user.children.map((c) => (
              <li key={c.id} className="flex items-center gap-3">
                <Avatar name={c.fullName} size="sm" />
                <div className="min-w-0">
                  <div className="truncate font-label-lg text-label-lg text-on-surface">{c.fullName}</div>
                  <div className="truncate text-body-sm text-on-surface-variant">
                    #{c.code}
                    {c.groupName ? ` · ${c.groupName}` : ""}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="flex items-start gap-2 border-t border-outline-variant/70 px-5 py-4 text-body-sm text-on-surface-muted sm:px-6">
        <Icon name="info" size={16} className="mt-px" />
        Maʼlumotlarni oʻzgartirish uchun administratorga murojaat qiling.
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- parol

type PwErrors = Partial<Record<"current" | "next" | "confirm" | "form", string>>;

function PasswordCard() {
  const { refreshMe } = useAuth();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<PwErrors>({});
  const change = useApiMutation((body: { currentPassword: string; newPassword: string }) => api.post("/me/password", body), {
    silentError: true,
  });

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: PwErrors = {};
    if (!form.current) errs.current = "Joriy parolni kiriting";
    if (form.next.length < 8) errs.next = "Parol kamida 8 belgidan iborat boʻlsin";
    else if (form.next === form.current) errs.next = "Yangi parol joriy paroldan farq qilishi kerak";
    if (form.confirm !== form.next) errs.confirm = "Parollar mos kelmadi";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await change.mutateAsync({ currentPassword: form.current, newPassword: form.next });
      toast.success("Parol muvaffaqiyatli yangilandi");
      setForm({ current: "", next: "", confirm: "" });
      await refreshMe().catch(() => null);
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : "Parolni yangilab boʻlmadi" });
    }
  };

  return (
    <Card>
      <CardHeader title="Parolni almashtirish" icon="lock" description="Parol kamida 8 belgidan iborat boʻlsin. Uni hech kimga bermang." />
      <CardContent>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2" noValidate>
          {errors.form ? (
            <Alert tone="danger" className="md:col-span-2">
              {errors.form}
            </Alert>
          ) : null}
          <Field label="Joriy parol" error={errors.current} className="md:col-span-2">
            <PasswordInput value={form.current} onChange={set("current")} autoComplete="current-password" />
          </Field>
          <Field label="Yangi parol" error={errors.next}>
            <PasswordInput value={form.next} onChange={set("next")} autoComplete="new-password" />
          </Field>
          <Field label="Yangi parolni takrorlang" error={errors.confirm}>
            <PasswordInput value={form.confirm} onChange={set("confirm")} autoComplete="new-password" />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit" icon="check" loading={change.isPending}>
              Parolni saqlash
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- Telegram

function TelegramCard({ user }: { user: User }) {
  const { refreshMe } = useAuth();
  const [link, setLink] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const create = useApiMutation(() => api.post<{ url: string }>("/me/telegram-link"));

  const connect = async () => {
    // Popup bloklanmasligi uchun oynani darhol ochamiz, havolani keyin beramiz.
    const win = window.open("about:blank", "_blank");
    try {
      const { url } = await create.mutateAsync();
      setLink(url);
      if (win) {
        win.opener = null;
        win.location.href = url;
      }
    } catch {
      win?.close();
    }
  };

  const check = async () => {
    setChecking(true);
    try {
      const u = await refreshMe();
      if (u?.telegramLinked) toast.success("Telegram bot ulandi");
      else toast.info("Hali ulanmagan. Botda «Start» tugmasini bosganingizni tekshiring.");
    } catch (e) {
      toastError(e);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Telegram bildirishnomalari"
        icon="send"
        description="Darsga kelish, baholar, uyga vazifalar va toʻlov eslatmalari Telegram orqali keladi."
        badge={
          user.telegramLinked ? (
            <Badge tone="success" icon="check_circle">
              Ulangan
            </Badge>
          ) : (
            <Badge tone="neutral">Ulanmagan</Badge>
          )
        }
      />
      <CardContent>
        {user.telegramLinked ? (
          <Alert tone="success" title="Telegram bot ulangan">
            Bildirishnomalar Telegram hisobingizga yuboriladi.
          </Alert>
        ) : (
          <div className="flex flex-col gap-4">
            <Button icon="link" onClick={connect} loading={create.isPending} className="self-start">
              Telegram botni ulash
            </Button>
            {link ? (
              <>
                <ol className="space-y-3 rounded-xl bg-surface-container-low p-4 text-body-md text-on-surface-variant">
                  <Step n={1}>
                    Yangi oynada Telegram ochiladi. Ochilmasa,{" "}
                    <a href={link} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
                      shu havolani bosing
                    </a>
                    .
                  </Step>
                  <Step n={2}>
                    Botda <span className="font-semibold text-on-surface">Start</span> tugmasini bosing.
                  </Step>
                  <Step n={3}>Bot ulanganini tasdiqlagach, quyidagi tugma bilan tekshiring.</Step>
                </ol>
                <Button variant="outline" icon="refresh" onClick={check} loading={checking} className="self-start">
                  Ulanganini tekshirish
                </Button>
              </>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary font-label-sm text-label-sm text-on-primary">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}
