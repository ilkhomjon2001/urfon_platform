// Oʻquvchi tafsilot paneli (mockupdagi oʻng karta) va toʻliq profil oynasi.
import { useState } from "react";
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
  Icon,
  IconButton,
  ProgressBar,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  avgTone,
  fmtAvg,
  fmtDate,
  fmtDateShort,
  fmtDateTime,
  fmtDayMonth,
  fmtDays,
  fmtMoney,
  fmtNum,
  fmtPercent,
  fmtPhone,
  fmtRelDateTime,
  fmtTime,
  fmtWeekday,
  gradeLabel,
} from "@/lib/format";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { CopyButton, CredentialsDialog, InfoRow, METHOD, PayStatusBadge, ROLE_UZ, STUDENT_STATUS, StudentStatusBadge, periodLabel } from "./shared";
import { EditStudentDialog, EnrollDialog, LinkParentDialog, MessageDialog, STUDENT_KEYS, StatusDialog } from "./StudentDialogs";
import type { Credential, ResetResult, StudentDetail } from "./types";

type DialogKind = "edit" | "status" | "enroll" | "message" | "link" | "reset" | "profile" | null;

export function useStudentDetail(id: string | null) {
  return useApiQuery<StudentDetail>(["admin", "students", "detail", id], id ? `/admin/students/${id}` : null);
}

const pctTone = (p: number | null | undefined) => (p == null ? "neutral" : p >= 90 ? "primary" : p >= 80 ? "navy" : p >= 70 ? "gold" : "danger");

/** Panel + barcha amallar (dialoglar shu komponent ichida). */
export function StudentPanel({ id, onClose, bare }: { id: string; onClose?: () => void; bare?: boolean }) {
  const { data: s, isLoading, error } = useStudentDetail(id);
  const [dlg, setDlg] = useState<DialogKind>(null);
  const [creds, setCreds] = useState<Credential[] | null>(null);
  const [unenroll, setUnenroll] = useState<{ id: string; name: string } | null>(null);

  const reset = useApiMutation(() => api.post<ResetResult>(`/admin/students/${id}/reset-password`), {
    invalidate: [["admin", "audit"]],
    onSuccess: (r) => setCreds([{ role: "STUDENT", userId: r.userId, fullName: r.fullName, login: r.login, password: r.password, existing: false }]),
  });
  const leave = useApiMutation((groupId: string) => api.delete(`/admin/students/${id}/enrollments/${groupId}`), {
    invalidate: STUDENT_KEYS,
    success: "Guruhdan chiqarildi",
  });

  if (isLoading) return <PanelSkeleton bare={bare} />;
  if (error || !s)
    return (
      <div className={cn(!bare && "rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-6 shadow-card")}>
        <EmptyState icon="person_off" title="Oʻquvchi topilmadi" description={error?.message} compact />
      </div>
    );

  const active = s.groups.find((g) => g.enrollmentStatus !== "LEFT");
  const mainParent = s.parents[0];
  const anyLinked = s.parents.some((p) => p.telegram.linked);
  const openGroupIds = s.groups.filter((g) => g.enrollmentStatus !== "LEFT").map((g) => g.id);
  const avatarTone = s.status === "ACTIVE" ? "solid" : s.status === "ACADEMIC_LEAVE" ? "gold" : "neutral";

  return (
    <>
      <div className={cn("flex flex-col gap-4", !bare && "rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-5 shadow-card sm:p-6")}>
        {/* Sarlavha */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={s.fullName} size="xl" tone={avatarTone} className="rounded-xl font-headline-md" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-headline-md text-headline-md text-on-surface">{s.fullName}</h3>
                <StudentStatusBadge status={s.status} />
              </div>
              <p className="mt-0.5 text-body-sm text-on-surface-variant">
                ID: #{s.code} · Roʻyxatdan: {fmtDateShort(s.enrolledAt)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <DropdownMenu
              trigger={<IconButton icon="more_vert" label="Amallar" size="sm" variant="ghost" />}
              label="Boshqarish"
              items={[
                { label: "Tahrirlash", icon: "edit", onSelect: () => setDlg("edit") },
                { label: "Holatni oʻzgartirish", icon: "swap_horiz", onSelect: () => setDlg("status") },
                { label: "Guruhga qoʻshish", icon: "group_add", onSelect: () => setDlg("enroll"), disabled: s.status === "LEFT" || s.status === "GRADUATED" },
                "separator",
                { label: "Parolni tiklash", icon: "lock_reset", onSelect: () => setDlg("reset") },
              ]}
            />
            {onClose ? <IconButton icon="close" label="Yopish" size="sm" variant="ghost" onClick={onClose} /> : null}
          </div>
        </div>

        {/* Koʻrsatkichlar */}
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-surface-container-low p-3 text-center">
          <div className="flex flex-col">
            <span className="text-label-sm font-label-sm text-on-surface-variant">Davomat</span>
            <span className="font-headline-md text-headline-md tabular-nums text-primary">{fmtPercent(s.attendance.total.percent)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-label-sm font-label-sm text-on-surface-variant">Oʻzlashtirish</span>
            <span className="font-headline-md text-headline-md tabular-nums text-on-surface">
              {fmtAvg(s.grades.average)} <span className="text-body-sm font-normal text-on-surface-variant">/ 5.0</span>
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-label-sm font-label-sm text-on-surface-variant">Toʻlov holati</span>
            <span className="mt-1">
              {s.payment.status ? <PayStatusBadge status={s.payment.status} /> : <span className="text-body-sm text-on-surface-muted">Hisob yoʻq</span>}
            </span>
          </div>
        </div>

        {/* Ota-ona */}
        {mainParent ? (
          <div className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Bogʻlangan ota-ona hisobi</span>
              {anyLinked ? (
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Faol ulanish
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                  <span className="h-2 w-2 rounded-full bg-outline" /> Bot ulanmagan
                </span>
              )}
            </div>
            {s.parents.map((p) => (
              <div key={p.id} className="flex flex-col gap-1 border-t border-outline-variant/60 pt-2 first-of-type:border-0 first-of-type:pt-0">
                <div className="flex items-center gap-3 pt-1">
                  <Avatar name={p.fullName} size="md" tone="neutral" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/ota-onalar?id=${p.id}`} className="block truncate font-label-md text-label-md text-on-surface hover:text-primary">
                      {p.fullName}
                    </Link>
                    <span className="text-body-sm text-on-surface-variant">
                      Rol: {p.relation}
                      {!p.isActive ? " · bloklangan" : ""}
                    </span>
                  </div>
                </div>
                <InfoRow label="Telefon:" icon="call">
                  <span className="inline-flex items-center gap-0.5">
                    {fmtPhone(p.phone)}
                    {p.phone ? <CopyButton value={p.phone} label="Telefonni nusxalash" /> : null}
                  </span>
                </InfoRow>
                <InfoRow label="Telegram bot:" icon="send">
                  {p.telegram.linked ? <span className="text-primary">@{p.telegram.username ?? "ulangan"}</span> : <span className="text-on-surface-variant">Ulanmagan</span>}
                </InfoRow>
                <InfoRow label="Soʻnggi kirish:" icon="schedule">
                  {p.lastLoginAt ? fmtRelDateTime(p.lastLoginAt) : "Hali kirmagan"}
                </InfoRow>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to={`/admin/ota-onalar?id=${mainParent.id}`}
                className="inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-surface-container-lowest px-2 font-label-sm text-label-sm text-on-surface shadow-xs hover:bg-surface-container"
              >
                <Icon name="login" size={16} className="text-primary" /> Ota-ona kabineti
              </Link>
              <button
                type="button"
                onClick={() => setDlg("message")}
                className="inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-surface-container-lowest px-2 font-label-sm text-label-sm text-on-surface shadow-xs hover:bg-surface-container"
              >
                <Icon name="sms" size={16} className="text-primary" /> Xabar
              </button>
            </div>
          </div>
        ) : (
          <Alert tone="warning" title="Ota-ona bogʻlanmagan">
            Bildirishnomalar hech kimga bormaydi. Ota-ona hisobini ulang.
          </Alert>
        )}

        {/* Akademik */}
        <div className="flex flex-col gap-2">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Akademik maʼlumotlar</span>
          <div className="rounded-lg bg-surface-container-low px-3 py-2">
            {active ? (
              <>
                <InfoRow label="Guruh:">
                  {active.name}
                  {active.enrollmentStatus === "WAITING" ? <Badge tone="gold" className="ml-1.5">kutmoqda</Badge> : null}
                </InfoRow>
                <InfoRow label="Masʼul ustoz:">{active.teacher?.fullName ?? <span className="text-warning">Biriktirilmagan</span>}</InfoRow>
                <InfoRow label="Dars jadvali:">{fmtDays(active.days, active.startTime, active.endTime)}</InfoRow>
                <InfoRow label="Xona:">{active.room ? `${active.room.name}${active.room.location ? ` (${active.room.location})` : ""}` : "—"}</InfoRow>
                <InfoRow label="Keyingi mashgʻulot:">
                  {s.nextLesson ? (
                    <span className="text-primary">
                      {fmtWeekday(s.nextLesson.startsAt)}, {fmtDayMonth(s.nextLesson.startsAt)}, {fmtTime(s.nextLesson.startsAt)}
                    </span>
                  ) : (
                    "—"
                  )}
                </InfoRow>
                {s.groups.filter((g) => g.enrollmentStatus !== "LEFT").length > 1 ? (
                  <InfoRow label="Boshqa guruhlar:">
                    {s.groups
                      .filter((g) => g.enrollmentStatus !== "LEFT" && g.id !== active.id)
                      .map((g) => g.name)
                      .join(", ")}
                  </InfoRow>
                ) : null}
              </>
            ) : (
              <p className="py-1 text-body-sm text-on-surface-variant">Faol guruh yoʻq</p>
            )}
          </div>
        </div>

        {/* Amallar */}
        <div className="flex flex-col gap-2 pt-1">
          <Button block icon="send" onClick={() => setDlg("message")} disabled={!s.parents.length}>
            Ota-onaga xabar yuborish
          </Button>
          <Button block variant="secondary" icon="link" onClick={() => setDlg("link")}>
            Ota-ona hisobiga ulash / Qayta biriktirish
          </Button>
          <Button block variant="ghost" icon="badge" className="text-primary" onClick={() => setDlg("profile")}>
            Toʻliq profil kartochkasini ochish
          </Button>
        </div>
      </div>

      <StudentProfileDialog
        s={s}
        open={dlg === "profile"}
        onOpenChange={(o) => setDlg(o ? "profile" : null)}
        onAction={(k) => setDlg(k)}
        onUnenroll={(g) => setUnenroll(g)}
      />
      <EditStudentDialog student={s} open={dlg === "edit"} onOpenChange={(o) => setDlg(o ? "edit" : null)} />
      <StatusDialog student={s} open={dlg === "status"} onOpenChange={(o) => setDlg(o ? "status" : null)} />
      <EnrollDialog studentId={s.id} studentName={s.fullName} exclude={openGroupIds} open={dlg === "enroll"} onOpenChange={(o) => setDlg(o ? "enroll" : null)} />
      <MessageDialog studentId={s.id} studentName={s.fullName} parents={s.parents} open={dlg === "message"} onOpenChange={(o) => setDlg(o ? "message" : null)} />
      <LinkParentDialog studentId={s.id} studentName={s.fullName} open={dlg === "link"} onOpenChange={(o) => setDlg(o ? "link" : null)} onCreated={(c) => (c.some((x) => x.password) ? setCreds(c) : null)} />
      <ConfirmDialog
        open={dlg === "reset"}
        onOpenChange={(o) => setDlg(o ? "reset" : null)}
        tone="primary"
        title="Parolni tiklash"
        description={`${s.fullName} (${s.login}) uchun yangi vaqtinchalik parol yaratiladi, barcha sessiyalar yopiladi.`}
        confirmLabel="Tiklash"
        onConfirm={() => reset.mutateAsync()}
      />
      <ConfirmDialog
        open={!!unenroll}
        onOpenChange={(o) => !o && setUnenroll(null)}
        title="Guruhdan chiqarilsinmi?"
        description={unenroll ? `${s.fullName} «${unenroll.name}» guruhidan chiqariladi. Amal jurnalga yoziladi.` : undefined}
        confirmLabel="Chiqarish"
        onConfirm={() => (unenroll ? leave.mutateAsync(unenroll.id) : undefined)}
      />
      <CredentialsDialog open={!!creds} onOpenChange={(o) => !o && setCreds(null)} credentials={creds ?? []} />
    </>
  );
}

function PanelSkeleton({ bare }: { bare?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-4", !bare && "rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-6 shadow-card")}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-16 w-16 rounded-xl" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-52" />
        </div>
      </div>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

// ─────────── Toʻliq profil ───────────

function StudentProfileDialog({
  s,
  open,
  onOpenChange,
  onAction,
  onUnenroll,
}: {
  s: StudentDetail;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAction: (k: DialogKind) => void;
  onUnenroll: (g: { id: string; name: string }) => void;
}) {
  const [tab, setTab] = useState("general");
  const att = s.attendance;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      title={
        <span className="flex flex-wrap items-center gap-2">
          {s.fullName} <StudentStatusBadge status={s.status} />
        </span>
      }
      description={`#${s.code} · login ${s.login}${s.mustChangePassword ? " · parolni almashtirishi kerak" : ""}`}
      footer={
        <>
          <Button variant="outline" icon="edit" onClick={() => onAction("edit")}>
            Tahrirlash
          </Button>
          <Button variant="outline" icon="swap_horiz" onClick={() => onAction("status")}>
            Holat
          </Button>
          <Button variant="outline" icon="lock_reset" onClick={() => onAction("reset")}>
            Parolni tiklash
          </Button>
        </>
      }
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="general">Umumiy</TabsTrigger>
          <TabsTrigger value="study">Oʻzlashtirish</TabsTrigger>
          <TabsTrigger value="pay" count={s.payments.length || undefined}>
            Toʻlovlar
          </TabsTrigger>
          <TabsTrigger value="audit">Jurnal</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            <InfoRow label="Telefon">{fmtPhone(s.phone)}</InfoRow>
            <InfoRow label="Tugʻilgan sana">{s.birthDate ? fmtDate(s.birthDate) : "—"}</InfoRow>
            <InfoRow label="Maqsad">{s.goal ?? "—"}</InfoRow>
            <InfoRow label="Turniket ID">{s.turnstileId ?? "—"}</InfoRow>
            <InfoRow label="Oʻqishga kelgan">{s.enrolledAt ? fmtDate(s.enrolledAt) : "—"}</InfoRow>
            <InfoRow label="Oxirgi kirish">{s.lastLoginAt ? fmtRelDateTime(s.lastLoginAt) : "Hali kirmagan"}</InfoRow>
            {s.leftAt ? <InfoRow label="Chiqqan sana">{fmtDate(s.leftAt)}</InfoRow> : null}
            <InfoRow label="Level">{s.level ?? "—"}</InfoRow>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="font-label-lg text-label-lg text-on-surface">Guruhlar</h4>
              <Button size="sm" variant="link" icon="group_add" onClick={() => onAction("enroll")} disabled={s.status === "LEFT" || s.status === "GRADUATED"}>
                Guruhga qoʻshish
              </Button>
            </div>
            {s.groups.length ? (
              <ul className="flex flex-col divide-y divide-outline-variant/60 rounded-xl border border-outline-variant/70">
                {s.groups.map((g) => (
                  <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-label-md text-label-md text-on-surface">{g.name}</span>
                        <Badge tone={g.enrollmentStatus === "ACTIVE" ? "primary" : g.enrollmentStatus === "WAITING" ? "gold" : "neutral"}>
                          {g.enrollmentStatus === "ACTIVE" ? "Faol" : g.enrollmentStatus === "WAITING" ? "Kutmoqda" : "Chiqqan"}
                        </Badge>
                      </div>
                      <p className="text-body-sm text-on-surface-variant">
                        {[g.level, g.teacher?.fullName, fmtDays(g.days, g.startTime, g.endTime), fmtMoney(g.monthlyFee) + "/oy"].filter(Boolean).join(" · ")}
                      </p>
                      <p className="text-body-sm text-on-surface-muted">
                        {fmtDateShort(g.joinedAt)} dan{g.leftAt ? ` · ${fmtDateShort(g.leftAt)} gacha` : ""}
                      </p>
                    </div>
                    {g.enrollmentStatus !== "LEFT" ? (
                      <Button size="sm" variant="ghost" icon="logout" className="text-error" onClick={() => onUnenroll({ id: g.id, name: g.name })}>
                        Chiqarish
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact icon="groups" title="Guruhga yozilmagan" />
            )}
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="font-label-lg text-label-lg text-on-surface">Ota-onalar</h4>
              <Button size="sm" variant="link" icon="link" onClick={() => onAction("link")}>
                Ota-ona ulash
              </Button>
            </div>
            <ul className="flex flex-col gap-2">
              {s.parents.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-container-low px-4 py-2.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar name={p.fullName} size="sm" tone="neutral" />
                    <span className="truncate font-label-md text-label-md">{p.fullName}</span>
                    <Badge tone="neutral">{p.relation}</Badge>
                  </span>
                  <span className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                    {fmtPhone(p.phone)}
                    <Badge tone={p.telegram.linked ? "primary" : "neutral"} icon={p.telegram.linked ? "check_circle" : "cancel"}>
                      {p.telegram.linked ? "Telegram" : "Ulanmagan"}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="study" className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MiniStat label="Davomat (jami)" value={fmtPercent(att.total.percent)} sub={`${fmtNum(att.total.attended)} / ${fmtNum(att.total.total)} dars`} progress={att.total.percent} />
            <MiniStat label={`Davomat (${periodLabel(att.period)})`} value={fmtPercent(att.month.percent)} sub={`${fmtNum(att.month.attended)} / ${fmtNum(att.month.total)} dars`} progress={att.month.percent} />
            <MiniStat label="Uyga vazifalar" value={`${fmtNum(s.homework.done)}/${fmtNum(s.homework.total)}`} sub={fmtPercent(s.homework.percent)} progress={s.homework.percent} />
          </div>
          <div className="flex flex-wrap gap-2 text-body-sm">
            <Badge tone="success">Keldi: {att.total.byStatus.PRESENT}</Badge>
            <Badge tone="gold">Kechikdi: {att.total.byStatus.LATE}</Badge>
            <Badge tone="primary">Sababli: {att.total.byStatus.EXCUSED}</Badge>
            <Badge tone="danger">Kelmadi: {att.total.byStatus.ABSENT}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-container-low p-4">
              <p className="text-body-sm text-on-surface-variant">Oʻrtacha baho</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="font-metric-num text-metric-num tabular-nums">{fmtAvg(s.grades.average)}</span>
                {s.grades.label ? <Badge tone={avgTone(s.grades.average)}>{s.grades.label}</Badge> : null}
              </p>
              <p className="text-body-sm text-on-surface-muted">{fmtNum(s.grades.count)} ta baho asosida</p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-4">
              <p className="text-body-sm text-on-surface-variant">Kumush tanga</p>
              <p className="mt-1 flex items-center gap-2">
                <Icon name="toll" filled className="text-tertiary" />
                <span className="font-metric-num text-metric-num tabular-nums">{fmtNum(s.coins.balance)}</span>
              </p>
              <p className="text-body-sm text-on-surface-muted">Seriya: {fmtNum(s.coins.streakDays)} kun</p>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-label-lg text-label-lg">Soʻnggi baholar</h4>
            {s.grades.recent.length ? (
              <ul className="flex flex-col divide-y divide-outline-variant/60">
                {s.grades.recent.map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-3 py-2 text-body-sm">
                    <span className="min-w-0 truncate">
                      {g.title ?? g.kind} <span className="text-on-surface-muted">· {g.group}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-on-surface-muted">{fmtDateShort(g.gradedAt)}</span>
                      <Badge tone={avgTone(g.value)}>
                        {fmtAvg(g.value)} · {gradeLabel(g.value)}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact icon="grade" title="Hali baho yoʻq" />
            )}
          </div>
        </TabsContent>

        <TabsContent value="pay">
          {s.payments.length ? (
            <ul className="flex flex-col divide-y divide-outline-variant/60 rounded-xl border border-outline-variant/70">
              {s.payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-label-md text-label-md">
                      {periodLabel(p.period)} · <span className="tabular-nums">{fmtMoney(p.amount)}</span>
                    </p>
                    <p className="text-body-sm text-on-surface-variant">
                      {p.group?.name ?? "Qoʻshimcha"} ·{" "}
                      {p.paidAt ? `${fmtDateTime(p.paidAt)}${p.method ? `, ${METHOD[p.method].label}` : ""}${p.receiptNo ? ` · ${p.receiptNo}` : ""}` : `Muddat: ${fmtDateShort(p.dueDate)}`}
                    </p>
                  </div>
                  <PayStatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact icon="payments" title="Toʻlovlar yoʻq" />
          )}
          <Link to={`/admin/tolovlar?q=${encodeURIComponent(s.code)}`} className="mt-3 inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:underline">
            Toʻlovlar sahifasida ochish <Icon name="arrow_forward" size={16} />
          </Link>
        </TabsContent>

        <TabsContent value="audit">
          {s.audit.length ? (
            <ol className="relative flex flex-col gap-3 border-l border-outline-variant pl-5">
              {s.audit.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-surface-container-lowest" />
                  <p className="text-body-sm text-on-surface">{a.summary ?? a.action}</p>
                  <p className="text-body-sm text-on-surface-muted">
                    {fmtDateTime(a.at)} · {a.actor?.fullName ?? "Tizim"}
                    {a.actorRole ? ` (${ROLE_UZ[a.actorRole]})` : ""} · <code className="font-mono text-[11px]">{a.action}</code>
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState compact icon="history" title="Yozuvlar yoʻq" />
          )}
          <Link to={`/admin/jurnal?q=${encodeURIComponent(s.id)}`} className="mt-3 inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:underline">
            Tizim jurnalida ochish <Icon name="arrow_forward" size={16} />
          </Link>
        </TabsContent>
      </Tabs>
    </Dialog>
  );
}

function MiniStat({ label, value, sub, progress }: { label: string; value: string; sub?: string; progress?: number | null }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <p className="text-body-sm text-on-surface-variant">{label}</p>
      <p className="mt-1 font-headline-md text-headline-md tabular-nums text-on-surface">{value}</p>
      {progress != null ? <ProgressBar value={progress} size="sm" tone={pctTone(progress)} className="mt-2" /> : null}
      {sub ? <p className="mt-1 text-body-sm text-on-surface-muted">{sub}</p> : null}
    </div>
  );
}

export { pctTone, STUDENT_STATUS };
