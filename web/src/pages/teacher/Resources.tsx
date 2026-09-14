// Ustoz: Resurslar va o'quv materiallari bazasi (mockup: urfon_resurslar_va_o_quv_materiallari_bazasi).
import { keepPreviousData } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DropdownMenu,
  EmptyState,
  Icon,
  IconButton,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
} from "@/components/ui";
import { api, downloadFile, openFile } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtFileSize, fmtNum, fmtPercent, fmtRelDateTime, fmtRelDay } from "@/lib/format";
import { useDebouncedValue, useFlagParam, useSearchParamState } from "@/lib/hooks";
import { toastError, useApiMutation, useApiQuery } from "@/lib/query";
import type { Tone } from "@/lib/types";
import { INV, TB } from "./b/api";
import { MAT_TYPE, ShareForm, ShareMaterialDialog, UploadMaterialDialog, extLabel } from "./b/ResourceDialogs";
import type { Material, MaterialList, MaterialStats, MaterialType, TeacherGroup } from "./b/types";
import { AudioPlayer, KpiCard, MiniLabel, QueryError } from "./b/ui";

const TYPE_ORDER: MaterialType[] = ["PDF", "AUDIO", "VIDEO", "DOC", "IMAGE", "LINK"];
const BAR_CLS: Record<MaterialType, string> = {
  PDF: "bg-primary",
  AUDIO: "bg-gold",
  VIDEO: "bg-navy",
  DOC: "bg-success",
  IMAGE: "bg-warning",
  LINK: "bg-outline",
};
const COLLECTION_TONES: { tile: string; chip: Tone; icon: string }[] = [
  { tile: "bg-primary-fixed text-primary group-hover:bg-primary group-hover:text-on-primary", chip: "primary", icon: "folder" },
  { tile: "bg-secondary-container text-navy group-hover:bg-navy group-hover:text-on-primary", chip: "navy", icon: "library_books" },
  { tile: "bg-tertiary-fixed text-tertiary group-hover:bg-gold group-hover:text-on-tertiary-fixed", chip: "gold", icon: "headphones" },
  { tile: "bg-success-container text-success group-hover:bg-success group-hover:text-on-success", chip: "success", icon: "assignment" },
];

export default function TeacherResourcesPage() {
  const [q, setQ] = useSearchParamState("q", "");
  const dq = useDebouncedValue(q, 300);
  const [type, setType] = useSearchParamState("type", "");
  const [src, setSrc] = useSearchParamState("src", "");
  const [level, setLevel] = useSearchParamState("level", "");
  const [sort, setSort] = useSearchParamState("sort", "new");
  const [view, setView] = useSearchParamState("view", "list");
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useFlagParam("new");
  const [shareMat, setShareMat] = useState<Material | null>(null);
  const [delMat, setDelMat] = useState<Material | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [allCollections, setAllCollections] = useState(false);

  useEffect(() => setPage(1), [dq, type, src, level, sort, view]);

  const pageSize = view === "grid" ? 12 : 10;
  const listQ = useApiQuery<MaterialList>([TB, "materials"], "/teacher/materials", {
    params: {
      q: dq || undefined,
      type: type || undefined,
      scope: src === "library" ? "library" : src === "group" ? "group" : "all",
      groupId: src.startsWith("g:") ? src.slice(2) : undefined,
      mine: src === "mine" ? "1" : undefined,
      levelId: level || undefined,
      sort,
      page,
      pageSize,
    },
    placeholderData: keepPreviousData,
  });
  const statsQ = useApiQuery<MaterialStats>([TB, "material-stats"], "/teacher/materials/stats");
  const groupsQ = useApiQuery<TeacherGroup[]>([TB, "ann-groups"], "/teacher/announcements/groups");
  const pickQ = useApiQuery<MaterialList>([TB, "materials", "pick"], "/teacher/materials", { params: { scope: "all", sort: "name", pageSize: 100 } });
  const del = useApiMutation((id: string) => api.delete(`/teacher/materials/${id}`), { invalidate: INV, success: "Material oʻchirildi" });

  const s = statsQ.data;
  const groups = groupsQ.data ?? [];
  const list = listQ.data;
  const typeCounts = list?.types ?? {};
  const typeTotal = Object.values(typeCounts).reduce((a, b) => a + (b ?? 0), 0);
  const levels = s?.byLevel ?? [];

  const preview = (m: Material) => {
    if (m.type === "LINK" && m.url) window.open(m.url, "_blank", "noopener,noreferrer");
    else if (m.type === "AUDIO" && m.file) setPlaying((p) => (p === m.id ? null : m.id));
    else if (m.file && (m.type === "PDF" || m.type === "IMAGE" || m.type === "VIDEO")) openFile(m.file.id).catch(toastError);
    else if (m.file) downloadFile(m.file.id, m.file.originalName).catch(toastError);
  };
  const download = (m: Material) => m.file && downloadFile(m.file.id, m.file.originalName).catch(toastError);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Bosh sahifa", to: "/ustoz" }, { label: "Resurslar va oʻquv materiallari" }]}
        title="Resurslar va oʻquv materiallari bazasi"
        documentTitle="Resurslar bazasi"
        subtitle="Darsliklar, qoʻllanmalar, audio yozuvlar va imtihon materiallari ombori"
        actions={
          <Button icon="upload" onClick={() => setUploadOpen(true)}>
            Yangi resurs yuklash
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Jami resurslar"
          value={s ? fmtNum(s.total) : "—"}
          unit="ta oʻquv fayli"
          icon="menu_book"
          loading={statsQ.isLoading}
          footer={s ? `${s.groups} ta guruh va umumiy baza kesimida` : "—"}
          chip={s ? `${fmtNum(s.library)} umumiy` : undefined}
        />
        <div className="flex flex-col justify-between rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-muted">Fayllar hajmi</span>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-high text-primary">
              <Icon name="cloud" size={24} />
            </span>
          </div>
          {statsQ.isLoading ? (
            <Skeleton className="mt-2 h-8 w-28" />
          ) : (
            <div className="mt-1">
              <span className="font-metric-num text-metric-num tabular-nums text-on-surface">{fmtFileSize(s?.totalSize ?? 0)}</span>
              <div className="mt-2.5 flex h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                {(s?.byType ?? []).map((t) =>
                  t.size ? <div key={t.type} className={BAR_CLS[t.type]} style={{ width: `${(t.size / Math.max(1, s!.totalSize)) * 100}%` }} title={`${MAT_TYPE[t.type].label}: ${fmtFileSize(t.size)}`} /> : null,
                )}
              </div>
              <p className="mt-1.5 flex items-center gap-1 text-body-sm text-on-surface-variant">
                <Icon name="check_circle" size={15} className="text-success" />
                Markaz serverida xavfsiz saqlanadi
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-muted">Eng koʻp foydalanilgan</span>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-tertiary-fixed text-tertiary">
              <Icon name="local_fire_department" size={24} />
            </span>
          </div>
          {statsQ.isLoading ? (
            <Skeleton className="mt-2 h-10 w-full" />
          ) : s?.top ? (
            <div className="mt-1 min-w-0">
              <div className="truncate font-display text-[17px] font-bold text-on-surface" title={s.top.title}>
                {s.top.title}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge tone="gold" shape="square">
                  {fmtNum(s.top.downloads)} marta
                </Badge>
                <span className="text-body-sm text-on-surface-variant">yuklab olingan</span>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-body-sm text-on-surface-muted">Hali yuklab olinmagan</p>
          )}
        </div>
        <KpiCard
          label="Guruhlarga ulashilgan"
          value={s ? fmtNum(s.inGroups) : "—"}
          unit="ta material"
          icon="share"
          tone="success"
          loading={statsQ.isLoading}
          footer={s ? `${s.groupsWithMaterials} / ${s.groups} ta guruhda` : "—"}
          chip={s ? `${fmtNum(s.totalDownloads)} yuklab olish` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section className="flex min-w-0 flex-col gap-6 lg:col-span-8">
          {/* Qidiruv va filtrlar */}
          <Card className="flex flex-col gap-4 p-5">
            <SearchInput value={q} onValueChange={setQ} placeholder="Resurs nomi, mavzu yoki kalit soʻz boʻyicha qidiruv…" />
            <div className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
              {[{ key: "", label: "Barcha resurslar", count: typeTotal }, ...TYPE_ORDER.filter((t) => typeCounts[t]).map((t) => ({ key: t, label: MAT_TYPE[t].label, count: typeCounts[t] ?? 0 }))].map(
                (p) => (
                  <button
                    key={p.key || "all"}
                    type="button"
                    aria-pressed={type === p.key}
                    onClick={() => setType(p.key)}
                    className={cn(
                      "shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
                      type === p.key ? "bg-primary text-on-primary shadow-xs" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
                    )}
                  >
                    {p.label} <span className={cn("ml-0.5 font-bold", type === p.key ? "text-on-primary" : "text-primary")}>({fmtNum(p.count)})</span>
                  </button>
                ),
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 border-t border-surface-container pt-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1">
                <MiniLabel>Manba</MiniLabel>
                <Select
                  size="sm"
                  value={src}
                  onChange={(e) => setSrc(e.target.value)}
                  options={[
                    { value: "", label: "Barcha manbalar" },
                    { value: "library", label: "Umumiy baza" },
                    { value: "group", label: "Guruh materiallari" },
                    { value: "mine", label: "Men yuklaganlar" },
                    ...groups.map((g) => ({ value: `g:${g.id}`, label: `${g.name} (${g.code})` })),
                  ]}
                />
              </label>
              <label className="flex flex-col gap-1">
                <MiniLabel>Level</MiniLabel>
                <Select
                  size="sm"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  options={[{ value: "", label: "Barcha Levellar" }, ...levels.map((l) => ({ value: l.level.id, label: l.level.name }))]}
                />
              </label>
              <label className="flex flex-col gap-1">
                <MiniLabel>Saralash</MiniLabel>
                <Select
                  size="sm"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  options={[
                    { value: "new", label: "Eng soʻnggi" },
                    { value: "popular", label: "Eng koʻp yuklab olingan" },
                    { value: "name", label: "Nomi boʻyicha (A–Z)" },
                  ]}
                />
              </label>
            </div>
          </Card>

          {/* Level to'plamlari */}
          {levels.length ? (
            <div>
              <div className="mb-3.5 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-display text-[16px] font-bold text-on-surface">
                  <Icon name="folder" filled size={20} className="text-primary" />
                  Level boʻyicha toʻplamlar
                </h2>
                {levels.length > 4 ? (
                  <Button variant="link" size="sm" onClick={() => setAllCollections((v) => !v)}>
                    {allCollections ? "Qisqartirish" : `Barchasini koʻrish (${levels.length} ta)`}
                  </Button>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(allCollections ? levels : levels.slice(0, 4)).map((l, i) => {
                  const tone = COLLECTION_TONES[i % COLLECTION_TONES.length];
                  const on = level === l.level.id;
                  return (
                    <button
                      key={l.level.id}
                      type="button"
                      onClick={() => setLevel(on ? "" : l.level.id)}
                      className={cn(
                        "group rounded-xl border bg-surface-container-lowest p-4 text-left shadow-card transition-all hover:border-primary/40 hover:shadow-float",
                        on ? "border-primary ring-2 ring-primary/15" : "border-outline-variant/70",
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl transition-colors", tone.tile)}>
                          <Icon name={tone.icon} size={24} />
                        </span>
                        {on ? <Icon name="filter_alt" size={20} className="text-primary" /> : null}
                      </div>
                      <h3 className="mt-3 font-label-lg text-label-lg text-on-surface transition-colors group-hover:text-primary">{l.level.name} toʻplami</h3>
                      <div className="mt-2 flex items-center justify-between gap-2 text-body-sm text-on-surface-muted">
                        <span>
                          {l.count} ta fayl · {fmtFileSize(l.size)}
                        </span>
                        <Badge tone={tone.chip} shape="square">
                          {l.level.code}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Ro'yxat */}
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container p-4">
              <div className="min-w-0">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Barcha yuklangan materiallar va fayllar</h3>
                <p className="text-body-sm text-on-surface-muted">Umumiy baza va guruhlaringizga tarqatilgan resurslar</p>
              </div>
              <div className="flex items-center gap-2">
                {list ? (
                  <Badge tone="neutral" shape="square">
                    {fmtNum(list.total)} ta natija
                  </Badge>
                ) : null}
                <div className="flex rounded-lg bg-surface-container-low p-0.5">
                  <IconButton icon="view_list" label="Roʻyxat" size="sm" className={cn(view === "list" && "bg-surface-container-lowest text-primary shadow-xs")} onClick={() => setView("list")} />
                  <IconButton icon="grid_view" label="Katakcha" size="sm" className={cn(view === "grid" && "bg-surface-container-lowest text-primary shadow-xs")} onClick={() => setView("grid")} />
                </div>
              </div>
            </div>
            {listQ.isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : listQ.error ? (
              <QueryError error={listQ.error} onRetry={() => listQ.refetch()} />
            ) : !list?.items.length ? (
              <EmptyState
                icon="folder_off"
                title={dq || type || src || level ? "Hech narsa topilmadi" : "Resurslar hali yoʻq"}
                description={dq || type || src || level ? "Qidiruv yoki filtrlarni oʻzgartiring." : "Birinchi materialni yuklang — u guruhlaringizga ulashishga tayyor boʻladi."}
                action={
                  <Button icon="upload" onClick={() => setUploadOpen(true)}>
                    Resurs yuklash
                  </Button>
                }
              />
            ) : view === "grid" ? (
              <div className={cn("grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3", listQ.isPlaceholderData && "opacity-60")}>
                {list.items.map((m) => (
                  <MaterialCard key={m.id} m={m} onPreview={() => preview(m)} onShare={() => setShareMat(m)} onDownload={() => download(m)} onDelete={() => setDelMat(m)} playing={playing === m.id} />
                ))}
              </div>
            ) : (
              <div className={cn("divide-y divide-surface-container", listQ.isPlaceholderData && "opacity-60")}>
                {list.items.map((m) => (
                  <MaterialRow key={m.id} m={m} onPreview={() => preview(m)} onShare={() => setShareMat(m)} onDownload={() => download(m)} onDelete={() => setDelMat(m)} playing={playing === m.id} />
                ))}
              </div>
            )}
            {list && list.pages > 1 ? (
              <div className="border-t border-surface-container px-4">
                <Pagination page={list.page} pageCount={list.pages} total={list.total} pageSize={list.pageSize} onPageChange={setPage} />
              </div>
            ) : null}
          </Card>
        </section>

        <aside className="flex min-w-0 flex-col gap-5 lg:col-span-4">
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2.5 font-display text-[15.5px] font-bold text-on-surface">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                <Icon name="bolt" size={18} />
              </span>
              Guruhga tezkor resurs biriktirish
            </h2>
            <ShareForm materials={pickQ.data?.items} groups={groups} />
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-display text-[15.5px] font-bold text-on-surface">Xotira tahlili</h2>
              <span className="font-display text-[13px] font-bold text-primary">{fmtFileSize(s?.totalSize ?? 0)}</span>
            </div>
            {statsQ.isLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : s && s.byType.length ? (
              <>
                <div className="mb-4 flex h-2.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                  {s.byType.map((t) => (t.size ? <div key={t.type} className={BAR_CLS[t.type]} style={{ width: `${(t.size / Math.max(1, s.totalSize)) * 100}%` }} /> : null))}
                </div>
                <ul className="space-y-2.5">
                  {s.byType.map((t) => (
                    <li key={t.type} className="flex items-center justify-between gap-2 text-body-sm">
                      <span className="flex items-center gap-2 text-on-surface-variant">
                        <span className={cn("h-2.5 w-2.5 rounded-full", BAR_CLS[t.type])} />
                        {MAT_TYPE[t.type].label} ({t.count} ta)
                      </span>
                      <span className="font-semibold tabular-nums text-on-surface">
                        {t.type === "LINK" ? "—" : fmtFileSize(t.size)}{" "}
                        <span className="font-normal text-on-surface-muted">({fmtPercent(s.totalSize ? (t.size / s.totalSize) * 100 : 0, 0)})</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-body-sm text-on-surface-muted">Hali fayl yoʻq.</p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-display text-[15.5px] font-bold text-on-surface">Soʻnggi yuklanganlar</h2>
            {statsQ.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : s?.recent.length ? (
              <ul className="space-y-3.5">
                {s.recent.map((m) => (
                  <li key={m.id} className="flex items-start gap-3">
                    <Avatar name={m.uploadedBy.fullName} size="sm" tone={m.mine ? "solid" : "soft"} />
                    <div className="min-w-0">
                      <p className="text-body-sm leading-snug text-on-surface">
                        <span className="font-semibold">{m.mine ? "Siz" : m.uploadedBy.fullName}</span> {m.group ? `${m.group.name} guruhiga` : "umumiy bazaga"} yukladi:{" "}
                        <span className="font-medium">{m.title}</span>
                      </p>
                      <span className="text-[11px] text-on-surface-muted">{fmtRelDateTime(m.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body-sm text-on-surface-muted">Hali yuklanmagan.</p>
            )}
          </Card>
        </aside>
      </div>

      <UploadMaterialDialog open={uploadOpen} onOpenChange={setUploadOpen} defaultGroupId={src.startsWith("g:") ? src.slice(2) : undefined} />
      <ShareMaterialDialog material={shareMat} onOpenChange={(o) => !o && setShareMat(null)} groups={groups} />
      <ConfirmDialog
        open={!!delMat}
        onOpenChange={(o) => !o && setDelMat(null)}
        title="Material oʻchirilsinmi?"
        description={delMat ? `“${delMat.title}” va uning fayli butunlay oʻchiriladi. Guruhlarga ulashilgan nusxalar saqlanib qoladi.` : undefined}
        confirmLabel="Oʻchirish"
        onConfirm={() => del.mutateAsync(delMat!.id)}
      />
    </>
  );
}

// ---------------------------------------------------------------- qator va katakcha

interface ItemProps {
  m: Material;
  onPreview: () => void;
  onShare: () => void;
  onDownload: () => void;
  onDelete: () => void;
  playing: boolean;
}

function metaLine(m: Material) {
  const parts: string[] = [];
  if (m.file) parts.push(fmtFileSize(m.file.size));
  parts.push(`${fmtNum(m.downloads)} marta yuklab olingan`);
  parts.push(m.group ? `${m.group.name} guruhiga biriktirilgan` : "Umumiy baza");
  parts.push(`Yuklandi: ${fmtRelDay(m.createdAt)}`);
  if (!m.mine) parts.push(m.uploadedBy.fullName);
  return parts;
}

function previewLabel(m: Material, playing: boolean) {
  if (m.type === "AUDIO") return playing ? "Yopish" : "Tinglash";
  if (m.type === "LINK") return "Ochish";
  if (m.type === "DOC") return "Yuklab olish";
  return "Koʻrish";
}

function ItemMenu({ m, onDelete }: { m: Material; onDelete: () => void }) {
  return (
    <DropdownMenu
      trigger={<IconButton icon="more_vert" label="Amallar" size="sm" />}
      items={[
        ...(m.type === "LINK" && m.url ? [{ label: "Havolani nusxalash", icon: "content_copy", onSelect: () => void navigator.clipboard?.writeText(m.url!) }] : []),
        {
          label: "Oʻchirish",
          icon: "delete",
          tone: "danger" as const,
          disabled: !m.mine,
          description: m.mine ? undefined : "Faqat oʻzingiz yuklaganini",
          onSelect: onDelete,
        },
      ]}
    />
  );
}

function MaterialRow({ m, onPreview, onShare, onDownload, onDelete, playing }: ItemProps) {
  const t = MAT_TYPE[m.type];
  return (
    <div className="p-4 transition-colors hover:bg-surface-container-low/60">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", t.tile)}>
            <Icon name={t.icon} size={22} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={onPreview} className="min-w-0 text-left font-label-lg text-label-lg text-on-surface transition-colors hover:text-primary">
                {m.title}
              </button>
              <span className={cn("rounded px-2 py-0.5 text-[11px] font-bold", t.chip)}>{extLabel(m)}</span>
              {m.level ? (
                <Badge tone="neutral" shape="square">
                  {m.level.name}
                </Badge>
              ) : null}
              {m.topic ? (
                <Badge tone="neutral" shape="square" className="hidden sm:inline-flex">
                  Unit {m.topic.unit}
                </Badge>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-body-sm text-on-surface-muted">
              {metaLine(m).map((p, i) => (
                <span key={i} className={cn("inline-flex items-center gap-2", i === (m.file ? 1 : 0) && "font-medium text-primary")}>
                  {i > 0 ? <span className="text-outline">•</span> : null}
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-end md:self-center">
          <Button size="sm" variant="secondary" icon="share" className="text-primary" onClick={onShare}>
            Ulashish
          </Button>
          <Button size="sm" variant="secondary" icon={m.type === "AUDIO" ? (playing ? "stop_circle" : "play_circle") : m.type === "LINK" ? "open_in_new" : "visibility"} onClick={onPreview}>
            {previewLabel(m, playing)}
          </Button>
          {m.file && m.type !== "DOC" ? <IconButton icon="download" label="Yuklab olish" size="sm" onClick={onDownload} /> : null}
          <ItemMenu m={m} onDelete={onDelete} />
        </div>
      </div>
      {playing && m.file ? <AudioPlayer file={m.file} className="mt-3 md:ml-[54px]" /> : null}
    </div>
  );
}

function MaterialCard({ m, onPreview, onShare, onDownload, onDelete, playing }: ItemProps) {
  const t = MAT_TYPE[m.type];
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-4 transition-all hover:border-primary/40 hover:shadow-float">
      <div className="flex items-start justify-between gap-2">
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", t.tile)}>
          <Icon name={t.icon} size={24} />
        </span>
        <ItemMenu m={m} onDelete={onDelete} />
      </div>
      <button type="button" onClick={onPreview} className="text-left">
        <h4 className="line-clamp-2 font-label-lg text-label-lg text-on-surface hover:text-primary">{m.title}</h4>
      </button>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn("rounded px-2 py-0.5 text-[11px] font-bold", t.chip)}>{extLabel(m)}</span>
        <Badge tone={m.group ? "primary" : "neutral"} shape="square">
          {m.group ? m.group.code : "Umumiy baza"}
        </Badge>
      </div>
      <p className="text-body-sm text-on-surface-muted">
        {m.file ? `${fmtFileSize(m.file.size)} · ` : ""}
        {fmtNum(m.downloads)} marta · {fmtRelDay(m.createdAt)}
      </p>
      {playing && m.file ? <AudioPlayer file={m.file} /> : null}
      <div className="mt-auto flex items-center gap-2 border-t border-surface-container pt-3">
        <Button size="sm" variant="secondary" icon="share" className="flex-1 text-primary" onClick={onShare}>
          Ulashish
        </Button>
        <IconButton icon={m.type === "AUDIO" ? (playing ? "stop_circle" : "play_circle") : m.type === "LINK" ? "open_in_new" : "visibility"} label={previewLabel(m, playing)} size="sm" onClick={onPreview} />
        {m.file ? <IconButton icon="download" label="Yuklab olish" size="sm" onClick={onDownload} /> : null}
      </div>
    </div>
  );
}
