// Admin: Ustozlar — yuklama, davomat, tekshiruvlar; akkaunt yaratish, bloklash, parol tiklash.
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Alert, Avatar, Badge, Button, Card, ConfirmDialog, DataTable, DropdownMenu, EmptyState, Icon, IconButton, PageHeader, SearchInput, Skeleton, StatCard,
  Tabs, TabsList, TabsTrigger, type Column,
} from "@/components/ui";
import { useShellSearch } from "@/components/shell/ShellSearch";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtNum, fmtPercent, fmtPhone, fmtRelDateTime } from "@/lib/format";
import { useDebouncedValue, useFlagParam, useSearchParamState } from "@/lib/hooks";
import { toastError, useApiMutation, useApiQuery } from "@/lib/query";
import { useNavigate } from "react-router-dom";
import { keys, TempPasswordDialog } from "./a/shared";
import { LoadCell, TeacherDrawer, TeacherFormDialog } from "./a/TeacherParts";
import type { ConflictRef, TeacherDetail, TeacherRow, TeachersResponse } from "./a/types";

type Target = { id: string; fullName: string; isActive?: boolean };

/** Telefon (<768px) uchun ustozlar ro'yxati — jadval o'rniga. */
function TeacherMobileList({ rows, loading, onOpen }: { rows: TeacherRow[] | undefined; loading: boolean; onOpen: (t: TeacherRow) => void }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4 md:hidden">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }
  if (!rows?.length) {
    return (
      <div className="md:hidden">
        <EmptyState compact icon="person_search" title="Ustoz topilmadi" />
      </div>
    );
  }
  return (
    <ul className="divide-y divide-outline-variant/70 md:hidden">
      {rows.map((t) => (
        <li key={t.id}>
          <button type="button" onClick={() => onOpen(t)} className={cn("flex w-full items-start gap-3 p-4 text-left", !t.isActive && "opacity-60")}>
            <Avatar name={t.fullName} src={t.avatarUrl} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 font-headline-sm text-headline-sm text-on-surface">{t.fullName}</span>
                {t.isActive ? <Badge tone="success" dot>Faol</Badge> : <Badge tone="danger" dot>Bloklangan</Badge>}
              </div>
              <div className="truncate text-body-sm text-on-surface-variant">
                <span className="font-semibold text-tertiary">{t.specialization ?? t.title ?? "Ustoz"}</span> · {fmtPhone(t.phone)}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-body-sm tabular-nums text-on-surface-variant">
                <span>{t.groupsCount} guruh</span>
                <span className={t.highLoad ? "text-warning" : undefined}>{fmtNum(t.weeklyHours)} soat/hafta</span>
                <span>{fmtNum(t.studentsCount)} oʻquvchi</span>
                <span>davomat {fmtPercent(t.attendancePct, 0)}</span>
              </div>
              {t.pendingReviews ? (
                <Badge tone={t.overdueReviews ? "danger" : "warning"} className="mt-1.5">
                  {t.pendingReviews} ta vazifa tekshiruvda{t.overdueReviews ? ` · ${t.overdueReviews} tasi 48 soatdan oshdi` : ""}
                </Badge>
              ) : null}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function AdminTeachersPage() {
  const navigate = useNavigate();
  const [q, setQ] = useSearchParamState("q");
  const [status, setStatus] = useSearchParamState("status", "all");
  const [teacherId, setTeacherId] = useSearchParamState("teacher");
  const [createOpen, setCreateOpen] = useFlagParam("new");
  const { query: shellQuery } = useShellSearch();
  const dq = useDebouncedValue(q || shellQuery, 300);
  const list = useApiQuery<TeachersResponse>(["admin", "teachers", "list"], "/admin/teachers", {
    params: { q: dq, status },
    placeholderData: (p) => p,
  });
  const s = list.data?.summary;

  const [editTarget, setEditTarget] = useState<TeacherDetail | null>(null);
  const [resetTarget, setResetTarget] = useState<Target | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Target | null>(null);
  const [forceTarget, setForceTarget] = useState<(Target & { groups: ConflictRef[]; message: string }) | null>(null);
  const [password, setPassword] = useState<{ name: string; login: string; password: string; created?: boolean } | null>(null);

  const reset = useApiMutation((id: string) => api.post<{ login: string; tempPassword: string }>(`/admin/teachers/${id}/reset-password`), {
    invalidate: keys("teachers"),
  });
  const deactivate = useApiMutation(
    (v: { id: string; force?: boolean }) => api.post<{ unassignedGroups: number }>(`/admin/teachers/${v.id}/deactivate`, { force: v.force ?? false }),
    { invalidate: keys("teachers"), silentError: true },
  );
  const activate = useApiMutation((id: string) => api.post(`/admin/teachers/${id}/activate`), {
    invalidate: keys("teachers"),
    success: "Ustoz akkaunti qayta faollashtirildi",
  });

  const openEdit = async (id: string) => {
    try {
      setEditTarget(await api.get<TeacherDetail>(`/admin/teachers/${id}`));
    } catch (e) {
      toastError(e);
    }
  };

  const columns: Column<TeacherRow>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Ustoz",
        cell: (t) => (
          <div className="flex min-w-[220px] items-center gap-3">
            <Avatar name={t.fullName} src={t.avatarUrl} size="md" className={cn(!t.isActive && "grayscale")} />
            <div className="min-w-0">
              <div className="truncate font-headline-sm text-headline-sm text-on-surface">{t.fullName}</div>
              <div className="truncate text-body-sm text-on-surface-variant">
                <span className="font-semibold text-tertiary">{t.specialization ?? t.title ?? "Ustoz"}</span> · {fmtPhone(t.phone)}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "groups",
        header: "Guruhlar",
        // juda keng ekranda (≥1536px); aks holda guruhlar tafsilot panelida
        className: "hidden 2xl:table-cell",
        headerClassName: "hidden 2xl:table-cell",
        cell: (t) =>
          t.groups.length ? (
            <div className="flex max-w-[260px] flex-wrap gap-1">
              {t.groups.slice(0, 3).map((g) => (
                <Badge key={g.id} tone="navy" shape="square" title={g.scheduleText}>
                  {g.name}
                </Badge>
              ))}
              {t.groups.length > 3 ? <Badge tone="neutral" shape="square">+{t.groups.length - 3}</Badge> : null}
            </div>
          ) : (
            <span className="text-body-sm text-on-surface-muted">Guruh yoʻq</span>
          ),
      },
      {
        key: "students",
        header: "Oʻquvchi",
        align: "right",
        className: "px-3",
        headerClassName: "px-3",
        cell: (t) => <span className="tabular-nums">{fmtNum(t.studentsCount)}</span>,
      },
      { key: "load", header: "Haftalik yuklama", className: "px-3", headerClassName: "px-3", cell: (t) => <LoadCell t={t} /> },
      {
        key: "attendance",
        header: "Davomat",
        align: "right",
        hideBelow: "md",
        className: "px-3",
        headerClassName: "px-3",
        cell: (t) => (
          <span className={cn("tabular-nums", t.attendancePct != null && t.attendancePct < 75 ? "text-error" : "text-on-surface")}>
            {fmtPercent(t.attendancePct, 0)}
          </span>
        ),
      },
      {
        key: "reviews",
        header: "Tekshiruv",
        hideBelow: "md",
        className: "px-3",
        headerClassName: "px-3",
        cell: (t) =>
          t.pendingReviews ? (
            <div className="flex flex-col items-start gap-0.5 whitespace-nowrap">
              <span className="tabular-nums">{t.pendingReviews} ta kutmoqda</span>
              {t.overdueReviews ? <Badge tone="danger">{t.overdueReviews} ta 48 soatdan oshdi</Badge> : null}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-body-sm text-success">
              <Icon name="task_alt" size={16} /> Tekshirilgan
            </span>
          ),
      },
      {
        key: "login",
        header: "Soʻnggi kirish",
        className: "hidden 2xl:table-cell",
        headerClassName: "hidden 2xl:table-cell",
        cell: (t) => (
          <div className="flex flex-col items-start gap-0.5 whitespace-nowrap text-body-sm">
            <span className="text-on-surface-variant">{t.lastLoginAt ? fmtRelDateTime(t.lastLoginAt) : "Hali kirmagan"}</span>
            <span className="inline-flex items-center gap-1">
              <Icon name="send" size={14} className={t.telegramLinked ? "text-primary" : "text-outline"} />
              <span className={t.telegramLinked ? "text-primary" : "text-on-surface-muted"}>{t.telegramLinked ? "Telegram ulangan" : "Telegram yoʻq"}</span>
            </span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Holat",
        cell: (t) => (
          <div className="flex flex-col items-start gap-1">
            {t.isActive ? <Badge tone="success" dot>Faol</Badge> : <Badge tone="danger" dot>Bloklangan</Badge>}
            {t.mustChangePassword ? <Badge tone="warning">Vaqtinchalik parol</Badge> : null}
          </div>
        ),
      },
      {
        key: "actions",
        header: <span className="sr-only">Amallar</span>,
        align: "right",
        cell: (t) => (
          <div className="inline-flex" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu
              trigger={<IconButton icon="more_vert" label="Amallar" size="sm" />}
              items={[
                { label: "Batafsil", icon: "open_in_new", onSelect: () => setTeacherId(t.id) },
                { label: "Tahrirlash", icon: "edit", onSelect: () => void openEdit(t.id) },
                { label: "Guruhlarini koʻrish", icon: "groups", onSelect: () => navigate(`/admin/guruhlar?teacher=${t.id}`) },
                { label: "Parolni tiklash", icon: "lock_reset", onSelect: () => setResetTarget(t) },
                "separator",
                t.isActive
                  ? { label: "Bloklash", icon: "block", tone: "danger", onSelect: () => setToggleTarget(t) }
                  : { label: "Faollashtirish", icon: "check_circle", onSelect: () => setToggleTarget(t) },
              ]}
            />
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setTeacherId, navigate],
  );

  const doDeactivate = async (t: Target, force = false) => {
    try {
      const r = await deactivate.mutateAsync({ id: t.id, force });
      toast.success(`${t.fullName} bloklandi${r.unassignedGroups ? ` · ${r.unassignedGroups} ta guruh ustozsiz qoldi` : ""}`);
    } catch (e) {
      if (e instanceof ApiError && e.code === "TEACHER_HAS_GROUPS" && !force) {
        const groups = ((e.details as unknown as { groups?: ConflictRef[] })?.groups ?? []) as ConflictRef[];
        setForceTarget({ ...t, groups, message: e.message });
        return;
      }
      toastError(e);
      throw e;
    }
  };

  return (
    <>
      <PageHeader
        title="Ustozlar"
        subtitle="Ustozlar akkauntlari, haftalik yuklama, guruhlar davomati va vazifalar tekshiruvi"
        actions={
          <Button icon="person_add" onClick={() => setCreateOpen(true)}>
            Yangi ustoz
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Faol ustozlar"
          value={fmtNum(s?.active ?? 0)}
          unit="nafar"
          icon="person_apron"
          loading={!s}
          sub={s ? (s.inactive ? `${s.inactive} ta akkaunt bloklangan` : "Barcha akkauntlar faol") : undefined}
          onClick={() => setStatus("active")}
        />
        <StatCard
          label="Haftalik yuklama"
          value={fmtNum(s?.totalWeeklyHours ?? 0)}
          unit="soat dars"
          icon="schedule"
          iconTone="navy"
          loading={!s}
          sub={s ? `Oʻrtacha ${fmtNum(s.avgGroups, 1)} guruh/ustoz` : undefined}
        />
        <StatCard
          label="Tekshirilmagan vazifalar"
          value={fmtNum(s?.pendingReviews ?? 0)}
          unit="ta"
          icon="assignment_late"
          iconTone={s?.overdueReviews ? "warning" : "primary"}
          loading={!s}
          sub={s ? (s.overdueReviews ? `${s.overdueReviews} tasi 48 soatdan oshgan` : "Muddati oʻtgani yoʻq") : undefined}
          subTone={s?.overdueReviews ? "danger" : undefined}
        />
        <StatCard
          label="Ustozsiz guruhlar"
          value={fmtNum(s?.unassignedGroups ?? 0)}
          unit="ta"
          icon={s?.unassignedGroups ? "priority_high" : "check_circle"}
          iconTone={s?.unassignedGroups ? "danger" : "success"}
          loading={!s}
          className={s?.unassignedGroups ? "border-error/30 bg-error-container/30" : undefined}
          sub={s ? (s.unassignedGroups ? "Biriktirish uchun bosing →" : `Telegram ulanmagan: ${s.withoutTelegram} ta ustoz`) : undefined}
          subTone={s?.unassignedGroups ? "danger" : undefined}
          onClick={s?.unassignedGroups ? () => navigate("/admin/guruhlar?teacher=none") : undefined}
        />
      </div>

      <Card className="mb-4 flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <SearchInput value={q} onValueChange={(v) => setQ(v || null)} placeholder="Ism, telefon yoki mutaxassislik…" wrapperClassName="flex-1" />
        <Tabs value={status} onValueChange={(v) => setStatus(v)} variant="segmented">
          <TabsList>
            <TabsTrigger value="all">Barchasi</TabsTrigger>
            <TabsTrigger value="active" count={s?.active}>
              Faol
            </TabsTrigger>
            <TabsTrigger value="inactive" count={s?.inactive}>
              Bloklangan
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </Card>

      <Card className={cn("overflow-hidden", list.isFetching && !list.isLoading && "opacity-80")}>
        {list.error ? (
          <Alert tone="danger" title="Ustozlar yuklanmadi" className="m-4">
            {list.error.message}
          </Alert>
        ) : (
          <>
          <TeacherMobileList rows={list.data?.items} loading={list.isLoading} onOpen={(t) => setTeacherId(t.id)} />
          <div className="hidden md:block">
          <DataTable
            columns={columns}
            rows={list.data?.items}
            loading={list.isLoading}
            getRowId={(t) => t.id}
            onRowClick={(t) => setTeacherId(t.id)}
            rowClassName={(t) => (!t.isActive ? "opacity-60" : undefined)}
            empty={{
              icon: "person_search",
              title: q || status !== "all" ? "Ustoz topilmadi" : "Hali ustoz qoʻshilmagan",
              description: q ? "Qidiruv soʻzini oʻzgartiring" : undefined,
              action: (
                <Button icon="person_add" onClick={() => setCreateOpen(true)}>
                  Yangi ustoz
                </Button>
              ),
            }}
          />
          </div>
          </>
        )}
      </Card>

      <TeacherDrawer
        teacherId={teacherId || null}
        onClose={() => setTeacherId(null)}
        onEdit={(t) => setEditTarget(t)}
        onResetPassword={(t) => setResetTarget(t)}
        onToggleActive={(t) => setToggleTarget(t)}
      />
      <TeacherFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(r) => {
          setPassword({ name: r.teacher.fullName, login: r.teacher.login, password: r.tempPassword, created: true });
          setTeacherId(r.teacher.id);
        }}
      />
      <TeacherFormDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        teacher={editTarget}
        onSaved={() => toast.success("Ustoz maʼlumotlari saqlandi")}
      />
      <TempPasswordDialog data={password} onClose={() => setPassword(null)} />

      <ConfirmDialog
        open={!!resetTarget}
        onOpenChange={(o) => !o && setResetTarget(null)}
        tone="primary"
        title="Parol tiklansinmi?"
        description={`${resetTarget?.fullName ?? ""} uchun yangi vaqtinchalik parol yaratiladi. Eski parol va barcha ochiq sessiyalar bekor qilinadi.`}
        confirmLabel="Parolni tiklash"
        onConfirm={async () => {
          if (!resetTarget) return;
          const r = await reset.mutateAsync(resetTarget.id);
          setPassword({ name: resetTarget.fullName, login: r.login, password: r.tempPassword });
        }}
      />
      <ConfirmDialog
        open={!!toggleTarget}
        onOpenChange={(o) => !o && setToggleTarget(null)}
        tone={toggleTarget?.isActive ? "danger" : "primary"}
        title={toggleTarget?.isActive ? "Ustoz bloklansinmi?" : "Ustoz akkaunti faollashtirilsinmi?"}
        description={
          toggleTarget?.isActive
            ? `${toggleTarget.fullName} tizimga kira olmaydi, barcha sessiyalari yopiladi. Maʼlumotlari saqlanadi.`
            : `${toggleTarget?.fullName ?? ""} yana tizimga kira oladi.`
        }
        confirmLabel={toggleTarget?.isActive ? "Bloklash" : "Faollashtirish"}
        onConfirm={async () => {
          if (!toggleTarget) return;
          if (toggleTarget.isActive) await doDeactivate(toggleTarget);
          else await activate.mutateAsync(toggleTarget.id);
        }}
      />
      <ConfirmDialog
        open={!!forceTarget}
        onOpenChange={(o) => !o && setForceTarget(null)}
        title="Ustozda faol guruhlar bor"
        description={
          forceTarget ? (
            <span className="flex flex-col gap-2">
              <span>Bloklasangiz, quyidagi guruhlar ustozsiz qoladi va “Diqqat talab qiladi” roʻyxatiga tushadi:</span>
              <span className="flex flex-col gap-1">
                {forceTarget.groups.map((g) => (
                  <span key={g.id} className="rounded-lg bg-surface-container-low px-2.5 py-1.5 text-body-sm text-on-surface">
                    <b>{g.name}</b> · {g.scheduleText}
                  </span>
                ))}
              </span>
            </span>
          ) : undefined
        }
        confirmLabel="Baribir bloklash"
        onConfirm={async () => {
          if (forceTarget) await doDeactivate(forceTarget, true);
        }}
      />
    </>
  );
}
