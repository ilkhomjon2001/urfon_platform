// Admin → Oʻquvchilar va ota-onalar boshqaruvi (mockup: urfon_admin_o_quvchilar_va_ota_onalar_boshqaruvi).
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  Dialog,
  Icon,
  IconButton,
  PageHeader,
  Pagination,
  ProgressBar,
  SearchInput,
  Select,
  StatCard,
  Tabs,
  TabsList,
  TabsTrigger,
  type Column,
} from "@/components/ui";
import { fmtNum, fmtPercent, fmtPhone, fmtTime } from "@/lib/format";
import { useDebouncedValue, useFlagParam, useMediaQuery, useSearchParamState } from "@/lib/hooks";
import { useApiQuery } from "@/lib/query";
import type { Paginated } from "@/lib/types";
import { CreateStudentDialog } from "./b/StudentDialogs";
import { StudentPanel, pctTone } from "./b/StudentPanel";
import { CredentialsDialog, ExportButton, relationOf, StudentStatusBadge, TelegramDot, useFormOptions } from "./b/shared";
import type { CreateStudentResult, Credential, StudentRow, StudentStats } from "./b/types";

const PAGE_SIZE = 20;

export default function AdminStudentsPage() {
  const [tab, setTab] = useSearchParamState("t", "all");
  const [q, setQ] = useSearchParamState("q");
  const [groupId, setGroupId] = useSearchParamState("group");
  const [levelId, setLevelId] = useSearchParamState("level");
  const [telegram, setTelegram] = useSearchParamState("tg");
  const [payment, setPayment] = useSearchParamState("pay");
  const [sort, setSort] = useSearchParamState("sort", "name");
  const [pageStr, setPageStr] = useSearchParamState("page", "1");
  const [selected, setSelected] = useSearchParamState("id");
  const [createOpen, setCreateOpen] = useFlagParam("new");
  const [creds, setCreds] = useState<Credential[] | null>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const page = Math.max(1, Number(pageStr) || 1);
  const dq = useDebouncedValue(q, 300);

  const params = {
    page,
    pageSize: PAGE_SIZE,
    q: dq || undefined,
    status: tab === "all" ? undefined : tab,
    groupId: groupId || undefined,
    levelId: levelId || undefined,
    telegram: telegram || undefined,
    payment: payment || undefined,
    sort,
  };
  const list = useApiQuery<Paginated<StudentRow>>(["admin", "students", "list"], "/admin/students", { params, placeholderData: (p) => p });
  const stats = useApiQuery<StudentStats>(["admin", "students", "stats"], "/admin/students/stats");
  const opts = useFormOptions();

  // filtr oʻzgarsa birinchi sahifaga
  const filterKey = `${tab}|${dq}|${groupId}|${levelId}|${telegram}|${payment}|${sort}`;
  const [lastKey, setLastKey] = useState(filterKey);
  useEffect(() => {
    if (filterKey !== lastKey) {
      setLastKey(filterKey);
      if (page !== 1) setPageStr(null);
    }
  }, [filterKey, lastKey, page, setPageStr]);

  // desktopda birinchi qatorni avtomatik tanlash (mockupdagidek panel doim toʻla)
  useEffect(() => {
    if (isDesktop && !selected && list.data?.items.length) setSelected(list.data.items[0].id);
  }, [isDesktop, selected, list.data, setSelected]);

  const st = stats.data;
  const hasFilters = !!(q || groupId || levelId || telegram || payment || tab !== "all");
  const clearFilters = () => {
    setQ(null);
    setGroupId(null);
    setLevelId(null);
    setTelegram(null);
    setPayment(null);
    setTab(null);
  };

  const onCreated = (r: CreateStudentResult) => {
    setCreds(r.credentials);
    setSelected(r.student.id);
  };

  const columns: Column<StudentRow>[] = useMemo(
    () => [
      {
        key: "student",
        header: "Oʻquvchi",
        cell: (r) => (
          <div className="flex min-w-[150px] items-center gap-3">
            <Avatar name={r.fullName} size="md" tone={r.id === selected ? "solid" : r.status === "ACADEMIC_LEAVE" ? "gold" : "soft"} />
            <div className="flex min-w-0 flex-col">
              <span className={`truncate font-label-md text-label-md font-bold ${r.id === selected ? "text-primary" : "text-on-surface"}`}>{r.fullName}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">#{r.code}</span>
            </div>
          </div>
        ),
      },
      {
        key: "group",
        header: "Guruh & Bosqich",
        hideBelow: "md",
        className: "px-3",
        headerClassName: "px-3",
        cell: (r) =>
          r.groups.length ? (
            <div className="flex max-w-[130px] flex-col">
              <span className="font-label-md text-label-md font-semibold text-on-surface">{r.groups[0].name}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {[r.groups[0].level, r.groups[0].enrollmentStatus === "WAITING" ? "kutmoqda" : null, r.groups.length > 1 ? `+${r.groups.length - 1} guruh` : null]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </span>
            </div>
          ) : (
            <span className="text-body-sm text-on-surface-muted">Guruhsiz</span>
          ),
      },
      {
        key: "parent",
        header: "Ota-ona",
        hideBelow: "lg",
        className: "px-3",
        headerClassName: "px-3",
        cell: (r) => {
          const p = r.parents[0];
          if (!p) return <span className="text-body-sm text-warning">Bogʻlanmagan</span>;
          return (
            <div className="flex max-w-[170px] flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-label-md text-label-md font-medium text-on-surface">{p.fullName}</span>
                <span className="rounded bg-surface-container px-1.5 py-0.5 text-[10px] font-label-sm text-on-surface-variant">{relationOf(p.relation)}</span>
              </div>
              <span className="whitespace-nowrap font-label-sm text-label-sm tabular-nums text-on-surface-variant">{fmtPhone(p.phone)}</span>
            </div>
          );
        },
      },
      { key: "tg", header: "Bot", hideBelow: "md", align: "center", className: "px-2", headerClassName: "px-2", cell: (r) => <TelegramDot linked={r.telegramLinked} /> },
      {
        key: "att",
        header: "Davomat",
        hideBelow: "sm",
        className: "px-3",
        headerClassName: "px-3",
        cell: (r) =>
          r.attendance == null ? (
            <span className="text-body-sm text-on-surface-muted">—</span>
          ) : (
            <div className="flex items-center gap-2">
              <ProgressBar value={r.attendance} size="sm" tone={pctTone(r.attendance)} className="w-10" />
              <span className="font-label-sm text-label-sm font-bold tabular-nums text-on-surface">{fmtPercent(r.attendance)}</span>
            </div>
          ),
      },
      { key: "status", header: "Holat", cell: (r) => <StudentStatusBadge status={r.status} /> },
    ],
    [selected, setSelected],
  );

  const d = list.data;
  const from = d && d.total ? (d.page - 1) * d.pageSize + 1 : 0;
  const to = d ? Math.min(d.page * d.pageSize, d.total) : 0;
  const levelOpts = opts.data?.levels ?? [];
  const groupOpts = opts.data?.groups ?? [];

  return (
    <>
      <PageHeader
        title="Oʻquvchilar va ota-onalar boshqaruvi"
        documentTitle="Oʻquvchilar"
        subtitle={
          st
            ? `Markazdagi ${fmtNum(st.total)} nafar oʻquvchi, ularning ota-onalari aloqa maʼlumotlari, Telegram bot integratsiyasi va individual monitoringi`
            : "Oʻquvchilar, ota-onalar aloqa maʼlumotlari va Telegram bot integratsiyasi"
        }
        breadcrumbs={[{ label: "Boshqaruv markazi", to: "/admin" }, { label: "Oʻquvchilar va ota-onalar", to: "/admin/ota-onalar" }, { label: "Roʻyxat & Monitoring" }]}
        actions={
          <>
            <ExportButton
              path="/admin/students/export.csv"
              params={{ ...params, page: undefined, pageSize: undefined }}
              filename="oquvchilar.csv"
              variant="secondary"
            />
            <Button icon="person_add" onClick={() => setCreateOpen(true)}>
              Yangi oʻquvchi qoʻshish
            </Button>
          </>
        }
      />

      {/* KPI */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Jami oʻquvchilar"
          value={fmtNum(st?.total)}
          unit="nafar"
          icon="group"
          loading={stats.isLoading}
          sub={st ? `${fmtNum(st.byStatus.ACTIVE)} faol · ${fmtNum(st.byStatus.ACADEMIC_LEAVE)} taʼtilda · ${fmtNum(st.byStatus.GRADUATED)} bitirgan` : undefined}
        />
        <StatCard
          label="Telegram bot qamrovi"
          value={fmtNum(st?.telegram.linked)}
          unit={st ? `/ ${fmtNum(st.telegram.total)} ota-ona` : undefined}
          icon="send"
          loading={stats.isLoading}
          badge={st?.telegram.percent != null ? <Badge tone="primary">{fmtPercent(st.telegram.percent)}</Badge> : undefined}
          progress={st?.telegram.percent ?? 0}
        />
        <StatCard
          label="Oʻrtacha davomat"
          value={fmtPercent(st?.attendanceMonth)}
          unit="ushbu oy"
          icon="calendar_today"
          loading={stats.isLoading}
          subIcon={st?.attendanceMonth != null && st.attendanceMonth >= 85 ? "trending_up" : "info"}
          subTone={st?.attendanceMonth != null && st.attendanceMonth >= 85 ? "primary" : "warning"}
          sub={
            st?.attendanceMonth == null
              ? "Bu oy davomat belgilanmagan"
              : st.attendanceMonth >= 90
                ? "Barqaror intizom darajasi"
                : st.attendanceMonth >= 85
                  ? "Meʼyorida"
                  : "Eʼtibor talab etiladi"
          }
        />
        <StatCard
          label="Botga ulanmaganlar"
          value={<span className="text-tertiary">{fmtNum(st?.parents.unlinked)}</span>}
          unit="nafar ota-ona"
          icon="phonelink_erase"
          iconTone="gold"
          loading={stats.isLoading}
          sub={
            <span className="flex w-full items-center justify-between gap-2">
              <span>Aloqa uzilgan</span>
              <Link to="/admin/ota-onalar?tg=unlinked" className="inline-flex items-center font-semibold text-primary hover:underline">
                Roʻyxat <Icon name="arrow_forward" size={14} />
              </Link>
            </span>
          }
        />
      </div>

      {/* Filtrlar */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={tab} onValueChange={setTab} variant="segmented" className="max-w-full">
            <TabsList>
              <TabsTrigger value="all">Barchasi{st ? ` (${fmtNum(st.total + st.byStatus.LEFT)})` : ""}</TabsTrigger>
              <TabsTrigger value="ACTIVE">Faol taʼlimda{st ? ` (${fmtNum(st.byStatus.ACTIVE)})` : ""}</TabsTrigger>
              <TabsTrigger value="ACADEMIC_LEAVE">Akademik taʼtilda{st ? ` (${fmtNum(st.byStatus.ACADEMIC_LEAVE)})` : ""}</TabsTrigger>
              <TabsTrigger value="GRADUATED">Bitirgan{st ? ` (${fmtNum(st.byStatus.GRADUATED)})` : ""}</TabsTrigger>
              {st?.byStatus.LEFT ? <TabsTrigger value="LEFT">Ketgan ({fmtNum(st.byStatus.LEFT)})</TabsTrigger> : null}
            </TabsList>
          </Tabs>
          <span className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
            <span className={`h-2 w-2 rounded-full ${list.isFetching ? "animate-pulse bg-gold" : "bg-primary"}`} />
            {list.dataUpdatedAt ? `Yangilandi: ${fmtTime(list.dataUpdatedAt)}` : "Yuklanmoqda…"}
          </span>
        </div>
        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2 lg:grid-cols-12">
          <SearchInput
            value={q}
            onValueChange={(v) => setQ(v)}
            placeholder="Oʻquvchi ismi, ID yoki telefon raqami boʻyicha qidiruv…"
            wrapperClassName="sm:col-span-2 lg:col-span-4"
          />
          <Select
            aria-label="Guruh"
            wrapperClassName="lg:col-span-2"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            options={[{ value: "", label: "Guruh: Barchasi" }, ...groupOpts.map((g) => ({ value: g.id, label: g.name }))]}
          />
          <Select
            aria-label="Bosqich"
            wrapperClassName="lg:col-span-2"
            value={levelId}
            onChange={(e) => setLevelId(e.target.value)}
            options={[{ value: "", label: "Bosqich (Level): Barchasi" }, ...levelOpts.map((l) => ({ value: l.id, label: l.label }))]}
          />
          <Select
            aria-label="Telegram bot"
            wrapperClassName="lg:col-span-2"
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            options={[
              { value: "", label: "Telegram bot: Barchasi" },
              { value: "linked", label: `Ulangan${st ? ` (${fmtNum(st.telegram.linked)})` : ""}` },
              { value: "unlinked", label: `Ulanmagan${st ? ` (${fmtNum(st.telegram.total - st.telegram.linked)})` : ""}` },
            ]}
          />
          <div className="flex items-center gap-2 lg:col-span-2">
            <Select
              aria-label="Toʻlov"
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              options={[
                { value: "", label: "Toʻlov: Barchasi" },
                { value: "PAID", label: "Toʻlangan" },
                { value: "PENDING", label: "Kutilmoqda" },
                { value: "OVERDUE", label: "Muddati oʻtgan" },
                { value: "NONE", label: "Hisob yoʻq" },
              ]}
            />
            <IconButton icon="filter_alt_off" label="Filtrlarni tozalash" variant="secondary" disabled={!hasFilters} onClick={clearFilters} />
          </div>
        </div>
      </div>

      {/* Jadval + panel */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-outline-variant/70 bg-surface-container-lowest shadow-card lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-container-low px-5 py-3">
            <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              Koʻrsatilmoqda: {d ? `${fmtNum(from)}–${fmtNum(to)} / ${fmtNum(d.total)}` : "…"}
            </span>
            <label className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
              Saralash:
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="cursor-pointer rounded bg-transparent font-semibold text-on-surface outline-none hover:text-primary"
              >
                <option value="name">Ism boʻyicha</option>
                <option value="code">ID boʻyicha</option>
                <option value="newest">Yangi qoʻshilganlar</option>
              </select>
            </label>
          </div>
          <DataTable
            rows={d?.items}
            loading={list.isLoading}
            skeletonRows={8}
            getRowId={(r) => r.id}
            columns={columns}
            onRowClick={(r) => setSelected(r.id)}
            rowClassName={(r) => (r.id === selected ? "bg-surface-container-high/60" : undefined)}
            empty={{
              icon: "person_search",
              title: hasFilters ? "Hech narsa topilmadi" : "Oʻquvchilar yoʻq",
              description: hasFilters ? "Filtrlarni oʻzgartirib koʻring" : "Birinchi oʻquvchini qoʻshing",
              action: hasFilters ? (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Filtrlarni tozalash
                </Button>
              ) : (
                <Button size="sm" icon="person_add" onClick={() => setCreateOpen(true)}>
                  Yangi oʻquvchi
                </Button>
              ),
            }}
          />
          {d && d.total > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/60 px-5 py-3">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Sahifada {fmtNum(d.items.length)} ta · Jami {fmtNum(d.total)} yozuv
              </span>
              <Pagination page={d.page} pageCount={d.pages} onPageChange={(p) => setPageStr(String(p))} />
            </div>
          ) : null}
        </div>

        <aside className="hidden min-w-0 flex-col gap-4 lg:col-span-4 lg:flex">
          {selected && isDesktop ? (
            <StudentPanel key={selected} id={selected} onClose={() => setSelected(null)} />
          ) : (
            <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center text-body-sm text-on-surface-variant">
              <Icon name="touch_app" className="mb-2 text-outline" size={28} />
              <p>Tafsilotlarni koʻrish uchun oʻquvchini tanlang</p>
            </div>
          )}
          <div className="flex items-start gap-3 rounded-xl bg-surface-container-high p-4">
            <Icon name="info" className="mt-0.5 shrink-0 text-primary" />
            <div className="flex flex-col gap-1">
              <span className="font-label-md text-label-md text-on-surface">Telegram bot integratsiyasi haqida</span>
              <p className="text-body-sm leading-relaxed text-on-surface-variant">
                Ota-onalar botga ulanganda har kungi darsga kelish-ketish vaqti, ustoz izohlari hamda oylik hisob-fakturalar toʻgʻridan-toʻgʻri ularning
                shaxsiy Telegramiga joʻnatiladi.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobil: tafsilot oynada */}
      {!isDesktop ? (
        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)} title="Oʻquvchi tafsiloti" size="lg">
          {selected ? <StudentPanel key={selected} id={selected} bare /> : null}
        </Dialog>
      ) : null}

      <CreateStudentDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={onCreated} />
      <CredentialsDialog
        open={!!creds}
        onOpenChange={(o) => !o && setCreds(null)}
        credentials={creds ?? []}
        title="Oʻquvchi qoʻshildi — kirish maʼlumotlari"
      />
    </>
  );
}
