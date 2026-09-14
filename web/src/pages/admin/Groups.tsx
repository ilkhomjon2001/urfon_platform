// Admin: Guruhlar boshqaruvi va ustoz biriktirish.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert, Avatar, Badge, Button, Card, ConfirmDialog, DataTable, DropdownMenu, EmptyState, IconButton, PageHeader, Pagination, ProgressBar, SearchInput,
  Select, Skeleton, StatCard, type Column,
} from "@/components/ui";
import { useShellSearch } from "@/components/shell/ShellSearch";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { academicYearLabel, dayDiff, fmtDate, fmtDayMonth, fmtDays, fmtNum, fmtPercent, fmtTimeRange } from "@/lib/format";
import { useDebouncedValue, useFlagParam, useSearchParamState } from "@/lib/hooks";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { AssignRoomDialog, AssignTeacherDialog, RoomsDialog } from "./a/GroupDialogs";
import { GroupDrawer } from "./a/GroupDrawer";
import { GroupFormDialog } from "./a/GroupForm";
import { downloadCsv, GROUP_STATUS, groupMonogram, GroupStatusBadge, keys, LevelChip, useLookups } from "./a/shared";
import type { GroupDetail, GroupRow, GroupsResponse } from "./a/types";

const PAGE_SIZE = 20;
const DISMISS_KEY = "urfon.admin.noTeacherBanner";

/** Telefon (<768px) uchun guruhlar ro'yxati — jadval o'rniga. */
function GroupMobileList({
  rows,
  loading,
  onOpen,
  onAssign,
  emptyTitle,
  emptyAction,
}: {
  rows: GroupRow[] | undefined;
  loading: boolean;
  onOpen: (g: GroupRow) => void;
  onAssign: (g: GroupRow) => void;
  emptyTitle: string;
  emptyAction: ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4 md:hidden">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }
  if (!rows?.length) {
    return (
      <div className="md:hidden">
        <EmptyState compact icon="groups" title={emptyTitle} action={emptyAction} />
      </div>
    );
  }
  return (
    <ul className="divide-y divide-outline-variant/70 md:hidden">
      {rows.map((g) => {
        const pct = Math.round((g.studentsCount / Math.max(1, g.capacity)) * 100);
        return (
          <li key={g.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onOpen(g)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen(g)}
              className={cn(
                "flex w-full cursor-pointer flex-col gap-2.5 p-4 text-left outline-none focus-visible:bg-surface-container-low",
                !g.teacher && g.status !== "FINISHED" && "bg-error-container/15",
                g.status === "FINISHED" && "opacity-70",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-headline-sm text-[13px] font-bold text-primary">
                  {groupMonogram(g.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 font-headline-sm text-headline-sm text-on-surface">{g.name}</span>
                    <GroupStatusBadge status={g.status} />
                  </div>
                  <div className="text-body-sm text-on-surface-variant">
                    {g.code} · {g.room?.name ?? "xona yoʻq"}
                  </div>
                  <div className="text-body-sm tabular-nums text-on-surface-variant">
                    {fmtDays(g.days)}, {fmtTimeRange(g.startTime, g.endTime)}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                {g.teacher ? (
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar name={g.teacher.fullName} src={g.teacher.avatarUrl} size="xs" />
                    <span className="truncate text-body-sm text-on-surface">{g.teacher.fullName}</span>
                  </span>
                ) : g.status !== "FINISHED" ? (
                  <Button
                    size="sm"
                    variant="navy"
                    icon="person_add"
                    className="h-7 px-2.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssign(g);
                    }}
                  >
                    Ustoz biriktirish
                  </Button>
                ) : (
                  <span />
                )}
                <span className="shrink-0 text-body-sm tabular-nums text-on-surface-variant">
                  {g.studentsCount}/{g.capacity} nafar{g.waitingCount ? ` · ${g.waitingCount} kutmoqda` : ""}
                </span>
              </div>
              <ProgressBar value={pct} size="sm" tone={pct >= 100 ? "navy" : "primary"} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function AdminGroupsPage() {
  const [q, setQ] = useSearchParamState("q");
  const [status, setStatus] = useSearchParamState("status");
  const [levelId, setLevelId] = useSearchParamState("level");
  const [teacherId, setTeacherId] = useSearchParamState("teacher");
  const [roomId, setRoomId] = useSearchParamState("room");
  const [pageStr, setPageStr] = useSearchParamState("page", "1");
  const [groupId, setGroupId] = useSearchParamState("group");
  const [assignFlag, setAssignFlag] = useFlagParam("assign");
  const [createOpen, setCreateOpen] = useFlagParam("new");
  const [roomsOpen, setRoomsOpen] = useFlagParam("rooms");
  const { query: shellQuery } = useShellSearch();
  const page = Math.max(1, Number(pageStr) || 1);
  const dq = useDebouncedValue(q || shellQuery, 300);

  const lookups = useLookups();
  const list = useApiQuery<GroupsResponse>(["admin", "groups", "list"], "/admin/groups", {
    params: { q: dq, status, levelId, teacherId, roomId, page, pageSize: PAGE_SIZE },
    placeholderData: (p) => p,
  });
  const data = list.data;
  const summary = data?.summary;

  const [editGroup, setEditGroup] = useState<GroupRow | GroupDetail | null>(null);
  const [teacherTarget, setTeacherTarget] = useState<GroupRow | GroupDetail | null>(null);
  const [roomTarget, setRoomTarget] = useState<GroupRow | GroupDetail | null>(null);
  const [finishTarget, setFinishTarget] = useState<GroupRow | GroupDetail | null>(null);
  const [dismissed, setDismissed] = useState<string>(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) ?? "";
    } catch {
      return "";
    }
  });

  // Bosh sahifadan "?group=…&assign=1" bilan kelinsa — ustoz biriktirish oynasini ochish
  const detailForAssign = useApiQuery<GroupDetail>(["admin", "groups", "detail", groupId], assignFlag && groupId ? `/admin/groups/${groupId}` : null);
  useEffect(() => {
    if (assignFlag && detailForAssign.data) {
      setTeacherTarget(detailForAssign.data);
      setAssignFlag(false);
    }
  }, [assignFlag, detailForAssign.data, setAssignFlag]);

  const finish = useApiMutation((id: string) => api.post<{ cancelledLessons: number }>(`/admin/groups/${id}/finish`), {
    invalidate: keys("groups"),
    success: (r) => `Guruh yakunlandi · ${r.cancelledLessons} ta rejalashtirilgan dars bekor qilindi`,
  });

  const setFilter = (setter: (v: string | null) => void) => (v: string | null) => {
    setter(v);
    setPageStr(null);
  };
  const filtersActive = !!(q || status || levelId || teacherId || roomId);
  const resetFilters = () => {
    for (const s of [setQ, setStatus, setLevelId, setTeacherId, setRoomId, setPageStr]) s(null);
  };

  const noTeacher = summary?.withoutTeacher ?? [];
  const bannerKey = noTeacher.map((g) => g.id).join(",");
  const showBanner = noTeacher.length > 0 && dismissed !== bannerKey;
  const firstNoTeacher = noTeacher[0];
  const daysLeft = firstNoTeacher ? dayDiff(new Date(), firstNoTeacher.nextLessonAt ?? firstNoTeacher.startDate) : null;

  const openAssignFor = (id: string) => {
    const row = data?.items.find((r) => r.id === id);
    if (row) setTeacherTarget(row);
    else {
      setGroupId(id);
      setAssignFlag(true);
    }
  };

  const exportCsv = async () => {
    const all = await api.get<GroupsResponse>("/admin/groups", { params: { q: dq, status, levelId, teacherId, roomId, page: 1, pageSize: 200 } });
    downloadCsv(
      `guruhlar-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Kod", "Guruh", "Level", "Ustoz", "Xona", "Jadval", "Oʻquvchilar", "Sigʻim", "Kutmoqda", "Oylik toʻlov (soʻm)", "Holat", "Oʻtilgan darslar", "Jami darslar", "Boshlanish"],
      all.items.map((g) => [
        g.code, g.name, g.level?.label ?? "", g.teacher?.fullName ?? "biriktirilmagan", g.room?.name ?? "", g.scheduleText,
        g.studentsCount, g.capacity, g.waitingCount, g.monthlyFee, GROUP_STATUS[g.status].label, g.progress.done, g.totalLessons,
        fmtDate(g.startDate),
      ]),
    );
  };

  const columns: Column<GroupRow>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Guruh nomi va xona",
        cell: (g) => {
          const isNew = dayDiff(g.createdAt, new Date()) <= 14;
          return (
            <div className="flex min-w-[200px] items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-headline-sm text-[13px] font-bold",
                  g.status === "FINISHED" ? "bg-surface-container text-on-surface-muted" : "bg-primary/10 text-primary",
                )}
              >
                {groupMonogram(g.name)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-headline-sm text-headline-sm text-on-surface">{g.name}</span>
                  {isNew && g.status !== "FINISHED" ? (
                    <Badge tone="primary" variant="solid" shape="square" className="text-[10px]">
                      Yangi
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-0.5 flex min-w-0 items-center gap-1 text-body-sm text-on-surface-variant">
                  <span className="shrink-0 whitespace-nowrap font-label-sm text-label-sm text-on-surface-muted">{g.code}</span>
                  <span aria-hidden>·</span>
                  {g.room ? (
                    <span className="truncate">
                      {g.room.name}
                      {g.room.location ? ` (${g.room.location})` : ""}
                    </span>
                  ) : (
                    <span className="text-warning">xona biriktirilmagan</span>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: "level",
        header: "Bosqich (Level)",
        hideBelow: "lg",
        className: "px-3",
        headerClassName: "px-3",
        cell: (g) =>
          g.level ? (
            <LevelChip code={g.level.code} label={g.level.label} />
          ) : (
            <span className="text-body-sm text-on-surface-muted">—</span>
          ),
      },
      {
        key: "teacher",
        header: "Masʼul ustoz",
        className: "px-3",
        headerClassName: "px-3",
        cell: (g) =>
          g.teacher ? (
            <div className="flex min-w-[150px] items-center gap-2.5">
              <Avatar name={g.teacher.fullName} src={g.teacher.avatarUrl} size="sm" />
              <div className="min-w-0">
                <div className="truncate font-label-md text-label-md text-on-surface">{g.teacher.fullName}</div>
                <div className="truncate text-[11px] font-semibold text-tertiary">{g.teacher.specialization ?? g.teacher.title}</div>
              </div>
            </div>
          ) : g.status === "FINISHED" ? (
            <span className="text-body-sm text-on-surface-muted">—</span>
          ) : (
            <div className="flex min-w-[150px] flex-col items-start gap-1">
              <span className="inline-flex items-center gap-1 font-label-md text-label-md text-error">Ustoz biriktirilmagan</span>
              <Button
                size="sm"
                variant="navy"
                icon="person_add"
                className="h-7 px-2.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setTeacherTarget(g);
                }}
              >
                Ustoz biriktirish
              </Button>
            </div>
          ),
      },
      {
        key: "students",
        header: "Oʻquvchilar soni",
        className: "px-3",
        headerClassName: "px-3",
        cell: (g) => {
          const full = g.studentsCount >= g.capacity;
          const pct = Math.round((g.studentsCount / Math.max(1, g.capacity)) * 100);
          return (
            <div className="w-32">
              <div className="flex justify-between font-label-sm text-label-sm tabular-nums text-on-surface">
                <span>
                  {g.studentsCount} / {g.capacity} nafar
                </span>
                <span className={full ? "text-tertiary" : "text-on-surface-variant"}>{full ? "Toʻla" : `${pct}%`}</span>
              </div>
              <ProgressBar value={pct} size="sm" tone={full ? "navy" : "primary"} className="mt-1.5" />
              <div className={cn("mt-0.5 text-[11px]", g.waitingCount ? "font-medium text-primary" : "text-on-surface-variant")}>
                {g.waitingCount
                  ? `${g.waitingCount} nafar kutmoqda`
                  : g.status === "FINISHED"
                    ? `${g.progress.done} dars oʻtilgan`
                    : full
                      ? "Maksimal sigʻim"
                      : `${g.capacity - g.studentsCount} ta joy mavjud`}
              </div>
            </div>
          );
        },
      },
      {
        key: "schedule",
        header: "Jadval va vaqt",
        hideBelow: "md",
        className: "px-3",
        headerClassName: "px-3",
        cell: (g) => (
          <div className="whitespace-nowrap">
            <div className="font-label-md text-label-md text-on-surface">{fmtDays(g.days)}</div>
            <div className="text-body-sm tabular-nums text-on-surface-variant">{fmtTimeRange(g.startTime, g.endTime)}</div>
          </div>
        ),
      },
      {
        key: "status",
        header: "Holat",
        className: "px-3",
        headerClassName: "px-3",
        cell: (g) => (
          <div className="flex flex-col items-start gap-1">
            <GroupStatusBadge status={g.status} />
            <span className="text-[11px] tabular-nums text-on-surface-muted">
              {g.status === "ENROLLING" && g.nextLesson ? `${fmtDayMonth(g.nextLesson.startsAt)} boshlanadi` : `${g.progress.done}/${g.progress.total} dars`}
            </span>
          </div>
        ),
      },
      {
        key: "actions",
        header: <span className="sr-only">Amallar</span>,
        align: "right",
        cell: (g) => (
          <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <IconButton icon="edit" label="Tahrirlash" size="sm" className="text-primary" onClick={() => setEditGroup(g)} />
            <DropdownMenu
              trigger={<IconButton icon="more_vert" label="Boshqa amallar" size="sm" />}
              items={[
                { label: "Batafsil", icon: "open_in_new", onSelect: () => setGroupId(g.id) },
                ...(g.status !== "FINISHED"
                  ? [
                      { label: g.teacher ? "Ustozni almashtirish" : "Ustoz biriktirish", icon: "person_check", onSelect: () => setTeacherTarget(g) },
                      { label: "Xona biriktirish", icon: "meeting_room", onSelect: () => setRoomTarget(g) },
                      "separator" as const,
                      { label: "Guruhni yakunlash", icon: "archive", tone: "danger" as const, onSelect: () => setFinishTarget(g) },
                    ]
                  : [{ label: "Qayta faollashtirish", icon: "restart_alt", onSelect: () => setEditGroup(g) }]),
              ]}
            />
          </div>
        ),
      },
    ],
    [setGroupId],
  );

  const levels = lookups.data?.levels ?? [];
  const teachers = lookups.data?.teachers ?? [];
  const rooms = lookups.data?.rooms ?? [];
  const activePct = summary && summary.total ? Math.round((summary.active / summary.total) * 100) : 0;

  return (
    <>
      {showBanner && firstNoTeacher ? (
        <Alert
          tone="danger"
          icon="warning"
          className="mb-5"
          title={
            <span className="flex flex-wrap items-center gap-2">
              {noTeacher.length} ta guruhda masʼul ustoz tayinlanmagan!
              <Badge tone="danger" variant="solid" className="uppercase tracking-wider">
                Shoshilinch
              </Badge>
            </span>
          }
          action={
            <div className="flex items-center gap-1">
              <Button variant="danger" icon="person_add" onClick={() => openAssignFor(firstNoTeacher.id)}>
                Hozir biriktirish
              </Button>
              <IconButton
                icon="close"
                label="Yopish"
                onClick={() => {
                  setDismissed(bannerKey);
                  try {
                    sessionStorage.setItem(DISMISS_KEY, bannerKey);
                  } catch {
                    /* sessionStorage yo'q */
                  }
                }}
              />
            </div>
          }
        >
          <b className="text-on-surface">{firstNoTeacher.name}</b> guruhi dars jadvali tasdiqlangan ({firstNoTeacher.scheduleText}), ammo masʼul ustoz biriktirilmagan.
          {daysLeft != null && daysLeft >= 0
            ? ` Dars boshlanishiga ${daysLeft === 0 ? "bugun" : `${daysLeft} kun qoldi`} (${fmtDayMonth(firstNoTeacher.nextLessonAt ?? firstNoTeacher.startDate)}).`
            : ""}
          {noTeacher.length > 1 ? ` Yana ${noTeacher.length - 1} ta guruh: ${noTeacher.slice(1).map((g) => g.name).join(", ")}.` : ""}
        </Alert>
      ) : null}

      <PageHeader
        title="Guruhlar boshqaruvi"
        badge={<Badge tone="primary">{academicYearLabel().replace(" oʻquv yili", "")}</Badge>}
        subtitle="Oʻquv markazidagi barcha akademik guruhlar, dars jadvallari va masʼul ustozlar nazorati"
        actions={
          <>
            <Button variant="outline" icon="meeting_room" onClick={() => setRoomsOpen(true)}>
              Xonalar
            </Button>
            <Button variant="outline" icon="file_download" onClick={() => void exportCsv()} disabled={!data?.total}>
              Eksport (CSV)
            </Button>
            <Button icon="add" onClick={() => setCreateOpen(true)}>
              Yangi guruh ochish
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Jami guruhlar"
          value={fmtNum(summary?.total ?? 0)}
          unit="ta oʻquv guruhi"
          icon="groups"
          loading={!summary}
          delta={summary?.newThisMonth ? { value: `+${summary.newThisMonth} ta`, positive: true } : undefined}
          sub={summary ? (summary.newThisMonth ? "bu oy ochilgan" : `${summary.finished} ta yakunlangan arxivda`) : undefined}
          onClick={() => setFilter(setStatus)(null)}
        />
        <StatCard
          label="Faol guruhlar"
          value={fmtNum(summary?.active ?? 0)}
          unit={`ta guruh (${activePct}%)`}
          icon="play_circle"
          loading={!summary}
          progress={activePct}
          progressTone="navy"
          sub={summary ? `${fmtNum(summary.studentsCount)} nafar oʻquvchi oʻqimoqda` : undefined}
          onClick={() => setFilter(setStatus)("ACTIVE")}
        />
        <StatCard
          label="Yangi qabul"
          value={fmtNum(summary?.enrolling ?? 0)}
          unit="ta guruhda qabul"
          icon="door_open"
          loading={!summary}
          sub={summary ? `${fmtNum(summary.waitingStudents)} nafar boʻlajak oʻquvchi navbatda` : undefined}
          subTone="primary"
          onClick={() => setFilter(setStatus)("ENROLLING")}
        />
        <StatCard
          label="Ustozsiz guruh"
          value={fmtNum(noTeacher.length)}
          unit={noTeacher.length ? "ta (kritik!)" : "ta"}
          icon={noTeacher.length ? "priority_high" : "check_circle"}
          iconTone={noTeacher.length ? "danger" : "success"}
          loading={!summary}
          className={noTeacher.length ? "border-error/30 bg-error-container/30" : undefined}
          sub={noTeacher.length ? `${firstNoTeacher?.name} · biriktirish →` : "Barcha guruhlarda ustoz bor"}
          subTone={noTeacher.length ? "danger" : "success"}
          onClick={noTeacher.length ? () => setFilter(setTeacherId)("none") : undefined}
        />
      </div>

      <Card className="mb-4 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <SearchInput
          value={q}
          onValueChange={(v) => setFilter(setQ)(v || null)}
          placeholder="Guruh nomi, kod, xona yoki ustoz boʻyicha qidiruv…"
          wrapperClassName="flex-1"
        />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:flex-nowrap">
          <Select
            aria-label="Level"
            value={levelId}
            onChange={(e) => setFilter(setLevelId)(e.target.value || null)}
            placeholder="Level: barchasi"
            options={levels.map((l) => ({ value: l.id, label: l.label ?? l.name }))}
            wrapperClassName="sm:w-48"
          />
          <Select
            aria-label="Ustoz"
            value={teacherId}
            onChange={(e) => setFilter(setTeacherId)(e.target.value || null)}
            placeholder="Ustoz: barchasi"
            options={[
              { value: "none", label: `Ustoz biriktirilmaganlar (${noTeacher.length})` },
              ...teachers.map((t) => ({ value: t.id, label: t.fullName })),
            ]}
            wrapperClassName="sm:w-52"
          />
          <Select
            aria-label="Xona"
            value={roomId}
            onChange={(e) => setFilter(setRoomId)(e.target.value || null)}
            placeholder="Xona: barchasi"
            options={rooms.map((r) => ({ value: r.id, label: r.name }))}
            wrapperClassName="sm:w-40"
          />
          <Select
            aria-label="Holat"
            value={status}
            onChange={(e) => setFilter(setStatus)(e.target.value || null)}
            placeholder="Holat: barchasi"
            options={[
              { value: "ACTIVE", label: "Faol guruhlar" },
              { value: "ENROLLING", label: "Yangi qabul" },
              { value: "FINISHED", label: "Yakunlangan" },
            ]}
            wrapperClassName="sm:w-44"
          />
          <IconButton icon="filter_alt_off" label="Filtrlarni tozalash" variant="secondary" onClick={resetFilters} disabled={!filtersActive} />
        </div>
      </Card>

      <Card className={cn("overflow-hidden", list.isFetching && !list.isLoading && "opacity-80")}>
        {list.error ? (
          <Alert tone="danger" title="Guruhlar yuklanmadi" className="m-4" action={<Button size="sm" variant="outline" onClick={() => void list.refetch()}>Qayta urinish</Button>}>
            {list.error.message}
          </Alert>
        ) : (
          <>
          {/* telefonda keng jadval o'rniga kartalar (layout viewport kengayib ketmasin) */}
          <GroupMobileList
            rows={data?.items}
            loading={list.isLoading}
            onOpen={(g) => setGroupId(g.id)}
            onAssign={(g) => setTeacherTarget(g)}
            emptyTitle={filtersActive ? "Filtr boʻyicha guruh topilmadi" : "Hali guruh ochilmagan"}
            emptyAction={
              filtersActive ? (
                <Button variant="outline" onClick={resetFilters}>
                  Filtrlarni tozalash
                </Button>
              ) : (
                <Button icon="add" onClick={() => setCreateOpen(true)}>
                  Yangi guruh ochish
                </Button>
              )
            }
          />
          <div className="hidden md:block">
          <DataTable
            columns={columns}
            rows={data?.items}
            loading={list.isLoading}
            getRowId={(g) => g.id}
            onRowClick={(g) => setGroupId(g.id)}
            rowClassName={(g) => (!g.teacher && g.status !== "FINISHED" ? "bg-error-container/15" : g.status === "FINISHED" ? "opacity-70" : undefined)}
            empty={{
              icon: "groups",
              title: filtersActive ? "Filtr boʻyicha guruh topilmadi" : "Hali guruh ochilmagan",
              description: filtersActive ? "Filtrlarni oʻzgartiring yoki tozalang" : "Birinchi guruhni oching — dars jadvali avtomatik tuziladi",
              action: filtersActive ? (
                <Button variant="outline" onClick={resetFilters}>
                  Filtrlarni tozalash
                </Button>
              ) : (
                <Button icon="add" onClick={() => setCreateOpen(true)}>
                  Yangi guruh ochish
                </Button>
              ),
            }}
          />
          </div>
          </>
        )}
        {data && data.total > 0 ? (
          <div className="border-t border-outline-variant/70 bg-surface-container-low px-4">
            <Pagination page={data.page} pageCount={data.pages} total={data.total} pageSize={data.pageSize} onPageChange={(p) => setPageStr(String(p))} />
          </div>
        ) : null}
      </Card>

      {data && summary ? (
        <p className="mt-3 text-body-sm text-on-surface-muted">
          Faol guruhlar sigʻimi: {fmtNum(summary.studentsCount)} / {fmtNum(summary.capacity)} oʻrin band (
          {fmtPercent(summary.capacity ? (summary.studentsCount / summary.capacity) * 100 : null, 0)}).
        </p>
      ) : null}

      <GroupDrawer
        groupId={groupId || null}
        onClose={() => setGroupId(null)}
        onEdit={(g) => setEditGroup(g)}
        onAssignTeacher={(g) => setTeacherTarget(g)}
        onAssignRoom={(g) => setRoomTarget(g)}
        onFinish={(g) => setFinishTarget(g)}
      />
      <GroupFormDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => setGroupId(id)} />
      <GroupFormDialog open={!!editGroup} onOpenChange={(o) => !o && setEditGroup(null)} group={editGroup} />
      <AssignTeacherDialog group={teacherTarget} onClose={() => setTeacherTarget(null)} />
      <AssignRoomDialog group={roomTarget} onClose={() => setRoomTarget(null)} />
      <RoomsDialog open={roomsOpen} onOpenChange={setRoomsOpen} />
      <ConfirmDialog
        open={!!finishTarget}
        onOpenChange={(o) => !o && setFinishTarget(null)}
        title={`${finishTarget?.name ?? ""} yakunlansinmi?`}
        description="Guruh arxivga oʻtadi, kelajakdagi rejalashtirilgan darslar bekor qilinadi, kutish roʻyxati yopiladi. Oʻtilgan darslar, davomat va baholar saqlanadi."
        confirmLabel="Yakunlash"
        onConfirm={async () => {
          if (finishTarget) await finish.mutateAsync(finishTarget.id);
        }}
      />
    </>
  );
}
