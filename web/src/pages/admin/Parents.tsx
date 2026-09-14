// Admin → Ota-onalar (mockup yoʻq — Oʻquvchilar sahifasi vizual tili).
import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  Dialog,
  Icon,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatCard,
  Tabs,
  TabsList,
  TabsTrigger,
  type Column,
} from "@/components/ui";
import { fmtNum, fmtPercent, fmtPhone, fmtRelDateTime } from "@/lib/format";
import { useDebouncedValue, useMediaQuery, useSearchParamState } from "@/lib/hooks";
import { useApiQuery } from "@/lib/query";
import type { Paginated } from "@/lib/types";
import { CreateParentDialog, ParentPanel } from "./b/ParentParts";
import { CredentialsDialog, ExportButton, TelegramDot } from "./b/shared";
import type { Credential, ParentRow, ParentStats } from "./b/types";

const PAGE_SIZE = 20;

export default function AdminParentsPage() {
  const [tab, setTab] = useSearchParamState("tg", "all");
  const [q, setQ] = useSearchParamState("q");
  const [sort, setSort] = useSearchParamState("sort", "name");
  const [pageStr, setPageStr] = useSearchParamState("page", "1");
  const [selected, setSelected] = useSearchParamState("id");
  const [createOpen, setCreateOpen] = useState(false);
  const [creds, setCreds] = useState<Credential[] | null>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const page = Math.max(1, Number(pageStr) || 1);
  const dq = useDebouncedValue(q, 300);

  const params = {
    page,
    pageSize: PAGE_SIZE,
    q: dq || undefined,
    telegram: tab === "linked" || tab === "unlinked" ? tab : undefined,
    active: tab === "blocked" ? "false" : undefined,
    sort,
  };
  const list = useApiQuery<Paginated<ParentRow>>(["admin", "parents", "list"], "/admin/parents", { params, placeholderData: (p) => p });
  const stats = useApiQuery<ParentStats>(["admin", "parents", "stats"], "/admin/parents/stats");
  const st = stats.data;

  const filterKey = `${tab}|${dq}|${sort}`;
  const [lastKey, setLastKey] = useState(filterKey);
  useEffect(() => {
    if (filterKey !== lastKey) {
      setLastKey(filterKey);
      if (page !== 1) setPageStr(null);
    }
  }, [filterKey, lastKey, page, setPageStr]);

  useEffect(() => {
    if (isDesktop && !selected && list.data?.items.length) setSelected(list.data.items[0].id);
  }, [isDesktop, selected, list.data, setSelected]);

  const columns: Column<ParentRow>[] = useMemo(
    () => [
      {
        key: "parent",
        header: "Ota-ona",
        cell: (r) => (
          <div className="flex min-w-[170px] items-center gap-3">
            <Avatar name={r.fullName} size="md" tone={r.id === selected ? "solid" : r.isActive ? "soft" : "neutral"} />
            <div className="flex min-w-0 flex-col">
              <span className={`flex items-center gap-1 truncate font-label-md text-label-md font-bold ${r.id === selected ? "text-primary" : "text-on-surface"}`}>
                <span className="truncate">{r.fullName}</span>
                {r.mustChangePassword ? <Icon name="key" size={14} className="shrink-0 text-warning" aria-label="Vaqtinchalik parol" /> : null}
              </span>
              <span className="whitespace-nowrap font-label-sm text-label-sm tabular-nums text-on-surface-variant">{fmtPhone(r.phone)}</span>
            </div>
          </div>
        ),
      },
      {
        key: "children",
        header: "Farzandlar",
        className: "px-3",
        headerClassName: "px-3",
        cell: (r) =>
          r.children.length ? (
            <div className="flex max-w-[190px] flex-col gap-0.5">
              {r.children.map((c) => (
                <span key={c.id} className="truncate text-body-sm">
                  <span className="font-label-md text-label-md text-on-surface">{c.fullName}</span>
                  <span className="text-on-surface-variant"> · {c.relation}{c.groups[0] ? ` · ${c.groups[0].name}` : ""}</span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-body-sm text-warning">Bogʻlanmagan</span>
          ),
      },
      { key: "tg", header: "Bot", hideBelow: "md", align: "center", className: "px-2", headerClassName: "px-2", cell: (r) => <TelegramDot linked={r.telegram.linked} /> },
      {
        key: "login",
        header: "Soʻnggi kirish",
        hideBelow: "xl",
        className: "px-3",
        headerClassName: "px-3",
        cell: (r) => <span className="whitespace-nowrap text-body-sm text-on-surface-variant">{r.lastLoginAt ? fmtRelDateTime(r.lastLoginAt) : "Hali kirmagan"}</span>,
      },
      {
        key: "status",
        header: "Holat",
        hideBelow: "sm",
        cell: (r) => (r.isActive ? <Badge tone="primary">Faol</Badge> : <Badge tone="danger">Bloklangan</Badge>),
      },
    ],
    [selected],
  );

  const d = list.data;
  const from = d && d.total ? (d.page - 1) * d.pageSize + 1 : 0;
  const to = d ? Math.min(d.page * d.pageSize, d.total) : 0;
  const hasFilters = !!(q || tab !== "all");

  return (
    <>
      <PageHeader
        title="Ota-onalar"
        subtitle="Ota-onalar akkauntlari, farzandlar bilan bogʻlanish, Telegram bot ulanishi va kirish nazorati"
        breadcrumbs={[{ label: "Boshqaruv markazi", to: "/admin" }, { label: "Oʻquvchilar va ota-onalar", to: "/admin/oquvchilar" }, { label: "Ota-onalar" }]}
        actions={
          <>
            <ExportButton path="/admin/parents/export.csv" params={{ ...params, page: undefined, pageSize: undefined }} filename="ota-onalar.csv" variant="secondary" />
            <Button icon="person_add" onClick={() => setCreateOpen(true)}>
              Ota-ona qoʻshish
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Jami ota-onalar" value={fmtNum(st?.total)} unit="nafar" icon="family_restroom" loading={stats.isLoading} sub="Barcha akkauntlar" />
        <StatCard
          label="Telegram botga ulangan"
          value={fmtNum(st?.telegram.linked)}
          unit={st ? `/ ${fmtNum(st.total)}` : undefined}
          icon="send"
          loading={stats.isLoading}
          badge={st?.telegram.percent != null ? <Badge tone="primary">{fmtPercent(st.telegram.percent)}</Badge> : undefined}
          progress={st?.telegram.percent ?? 0}
        />
        <StatCard
          label="Hali kirmaganlar"
          value={fmtNum(st?.neverLoggedIn)}
          unit="nafar"
          icon="login"
          iconTone="gold"
          loading={stats.isLoading}
          sub={st ? `${fmtNum(st.mustChangePassword)} tasida vaqtinchalik parol` : undefined}
        />
        <StatCard label="Bloklangan" value={fmtNum(st?.inactive)} unit="akkaunt" icon="block" iconTone="danger" loading={stats.isLoading} sub="Tizimga kira olmaydi" />
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={tab} onValueChange={setTab} variant="segmented" className="max-w-full">
            <TabsList>
              <TabsTrigger value="all">Barchasi{st ? ` (${fmtNum(st.total)})` : ""}</TabsTrigger>
              <TabsTrigger value="linked">Botga ulangan{st ? ` (${fmtNum(st.telegram.linked)})` : ""}</TabsTrigger>
              <TabsTrigger value="unlinked">Ulanmagan{st ? ` (${fmtNum(st.telegram.unlinked)})` : ""}</TabsTrigger>
              <TabsTrigger value="blocked">Bloklangan{st ? ` (${fmtNum(st.inactive)})` : ""}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <SearchInput value={q} onValueChange={(v) => setQ(v)} placeholder="Ota-ona ismi, telefon yoki farzand ismi/ID…" wrapperClassName="sm:col-span-2" />
          <Select
            aria-label="Saralash"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            options={[
              { value: "name", label: "Saralash: Ism boʻyicha" },
              { value: "lastLogin", label: "Saralash: Soʻnggi kirish" },
              { value: "newest", label: "Saralash: Yangi qoʻshilgan" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-outline-variant/70 bg-surface-container-lowest shadow-card lg:col-span-8">
          <div className="bg-surface-container-low px-5 py-3 font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            Koʻrsatilmoqda: {d ? `${fmtNum(from)}–${fmtNum(to)} / ${fmtNum(d.total)}` : "…"}
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
              icon: "family_restroom",
              title: hasFilters ? "Hech narsa topilmadi" : "Ota-onalar yoʻq",
              description: hasFilters ? "Filtrni oʻzgartirib koʻring" : "Oʻquvchi qoʻshilganda ota-ona akkaunti ham yaratiladi",
            }}
          />
          {d && d.total > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/60 px-5 py-3">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Jami {fmtNum(d.total)} yozuv</span>
              <Pagination page={d.page} pageCount={d.pages} onPageChange={(p) => setPageStr(String(p))} />
            </div>
          ) : null}
        </div>
        <aside className="hidden min-w-0 flex-col gap-4 lg:col-span-4 lg:flex">
          {selected && isDesktop ? (
            <ParentPanel key={selected} id={selected} onClose={() => setSelected(null)} />
          ) : (
            <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center text-body-sm text-on-surface-variant">
              <Icon name="touch_app" className="mb-2 text-outline" size={28} />
              <p>Tafsilotlarni koʻrish uchun ota-onani tanlang</p>
            </div>
          )}
          <div className="flex items-start gap-3 rounded-xl bg-surface-container-high p-4">
            <Icon name="info" className="mt-0.5 shrink-0 text-primary" />
            <p className="text-body-sm leading-relaxed text-on-surface-variant">
              Ota-ona login sifatida telefon raqamidan foydalanadi. Bitta akkaunt bir nechta farzandga bogʻlanishi mumkin — farzandni almashtirish
              kabinetning chap menyusida.
            </p>
          </div>
        </aside>
      </div>

      {!isDesktop ? (
        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)} title="Ota-ona tafsiloti" size="lg">
          {selected ? <ParentPanel key={selected} id={selected} bare /> : null}
        </Dialog>
      ) : null}

      <CreateParentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onDone={(c, pid) => {
          if (c.password) setCreds([c]);
          setSelected(pid);
        }}
      />
      <CredentialsDialog open={!!creds} onOpenChange={(o) => !o && setCreds(null)} credentials={creds ?? []} />
    </>
  );
}
