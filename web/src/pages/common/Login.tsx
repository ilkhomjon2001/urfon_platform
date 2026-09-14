import { useState, type FormEvent } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/shell/Logo";
import { Alert, Button, Field, FullScreenSpinner, Icon, Input, PasswordInput } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useDocumentTitle } from "@/lib/hooks";
import { safeNext } from "@/lib/roles";

const FEATURES = [
  { icon: "fact_check", title: "Davomat va baholar", text: "Har bir dars natijasi kabinetda real vaqtda." },
  { icon: "assignment", title: "Uyga vazifalar va materiallar", text: "Topshiriqlar, audio va slaydlar bir joyda." },
  { icon: "notifications_active", title: "Telegram bildirishnomalari", text: "Ota-onalarga tezkor xabarlar va eslatmalar." },
];

export default function LoginPage() {
  useDocumentTitle("Tizimga kirish");
  const { status, user, login } = useAuth();
  const [params] = useSearchParams();
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (status === "loading") return <FullScreenSpinner />;
  if (status === "authed" && user) return <Navigate to={safeNext(params.get("next"), user.role)} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginValue.trim() || !password) {
      setError("Login va parolni kiriting");
      return;
    }
    setError(null);
    setPending(true);
    try {
      // Server "+998 90 123-45-67" va "ST-8492" ni o'zi normallashtiradi — yozilganicha yuboramiz.
      await login(loginValue.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kirishda xatolik yuz berdi. Qayta urinib koʻring");
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Brend paneli (desktop) */}
      <aside className="relative hidden w-[44%] max-w-[640px] flex-col justify-between overflow-hidden bg-navy p-10 text-white lg:flex xl:p-14">
        <div aria-hidden="true" className="bg-dots absolute inset-0" />
        <div aria-hidden="true" className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-primary/50 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-40 -left-24 h-[360px] w-[360px] rounded-full bg-primary/30 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <Logo className="h-11 w-11" />
          <div className="leading-none">
            <div className="font-display text-[26px] font-extrabold tracking-tight">URFON</div>
            <div className="mt-1.5 font-label-md text-label-md text-on-primary-container">Taʼlim markazi platformasi</div>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display-sm text-display-sm text-white">
            Taʼlim jarayoni — <span className="text-gold">bitta oynada</span>
          </h1>
          <p className="mt-4 text-body-lg text-on-primary-container">
            Ustozlar, oʻquvchilar va ota-onalar uchun yagona kabinet: darslar, davomat, uyga vazifalar va toʻlovlar bir joyda.
          </p>
          <ul className="mt-10 space-y-5">
            {FEATURES.map((f) => (
              <li key={f.icon} className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-gold ring-1 ring-white/10">
                  <Icon name={f.icon} size={22} />
                </span>
                <span>
                  <span className="block font-label-lg text-label-lg text-white">{f.title}</span>
                  <span className="mt-0.5 block text-body-sm text-on-primary-container">{f.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-body-sm text-on-primary-container">
          <Icon name="apartment" size={18} />
          URFON Taʼlim Markazi
        </div>
      </aside>

      {/* Kirish formasi */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo className="h-10 w-10" />
            <div className="leading-none">
              <div className="font-headline-md text-headline-md font-bold tracking-tight text-navy">URFON</div>
              <div className="mt-1 font-label-sm text-label-sm text-on-surface-variant">Taʼlim markazi platformasi</div>
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-6 shadow-float sm:p-8">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Tizimga kirish</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">Kabinetingizga kirish uchun login va parolingizni kiriting.</p>

            <form onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
              {error ? <Alert tone="danger">{error}</Alert> : null}
              <Field label="Login yoki telefon raqam" hint="Oʻquvchilar ID raqami bilan kiradi, masalan ST-8492">
                <Input
                  size="lg"
                  icon="person"
                  value={loginValue}
                  onChange={(e) => setLoginValue(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="off"
                  spellCheck={false}
                  autoFocus
                  placeholder="+998 90 123-45-67"
                />
              </Field>
              <Field label="Parol">
                <PasswordInput
                  size="lg"
                  icon="lock"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </Field>
              <Button type="submit" size="lg" block loading={pending} iconRight="arrow_forward" className="mt-2">
                Kirish
              </Button>
            </form>

            <div className="mt-6 flex items-start gap-2.5 rounded-lg bg-surface-container-low p-3 text-body-sm text-on-surface-variant">
              <Icon name="help" size={18} className="mt-px text-primary" />
              <span>Parolni unutdingizmi? Administratorga murojaat qiling.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
