// Admin: Resurslar bazasi — markazning barcha oʻquv materiallari (PDF, audio, video, havola).
// Ustoz yuklagan fayllar ham shu yerda koʻrinadi; admin istalganini tahrirlaydi yoki oʻchiradi.
import { keepPreviousData } from "@tanstack/react-query";
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  EmptyState,
  Field,
  Icon,
  IconButton,
  Input,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  Spinner,
  StatCard,
  Textarea,
} from "@/components/ui";
import { api, downloadFile, openFile } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtFileSize, fmtNum, fmtPercent, fmtRelDateTime, fmtRelDay } from "@/lib/format";
import { useDebouncedValue, useFlagParam, useSearchParamState } from "@/lib/hooks";
import { toastError, useApiMutation, useApiQuery } from "@/lib/query";
import type { FileMeta } from "@/lib/types";
import {
  ACCEPT_ALL,
  BAR_CLS,
  MAT_INV,
  MAT_KEY,
  MAT_TYPE,
  MAX_UPLOAD_MB,
  TYPE_ORDER,
  UPLOADER_ROLE,
  extLabel,
  materialTypeFromMime,
  tooLarge,
  uploadFiles,
  type AdminMaterial,
  type AdminMaterialList,
  type AdminMaterialOptions,
  type AdminMaterialStats,
} from "./b/materials";

const NOTE_KEY = "urfon.admin.resourcesNote";
const PAGE_SIZE = 10;

export default function AdminResourcesPage() {
  const [q, setQ] = useSearchParamState("q");
  const dq = useDebouncedValue(q, 300);
  const [type, setType] = useSearchParamState("type");
  const [src, setSrc] = useSearchParamState("src");
  const [level, setLevel] = useSearchParamState("level");
  const [sort, setSort] = useSearchParamState("sort", "new");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useFlagParam("new");
  const [editMat, setEditMat] = useState<AdminMaterial | null>(null);
  const [delMat, setDelMat] = useState<AdminMaterial | null>(null);
  const [noteHidden, setNoteHidden] = useState(() => {
    try {
      return localStorage.getItem(NOTE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => setPage(1), [dq, type, src, level, sort]);

  const listQ = useApiQuery<AdminMaterialList>([...MAT_KEY, "list"], "/admin/materials", {
    params: {
      q: dq || undefined,
      type: type || undefined,
      scope: src === "library" ? "library" : src === "group" ? "group" : "all",
      groupId: src.startsWith("g:") ? src.slice(2) : undefined,
      levelId: level || undefined,
      sort,
      page,
      pageSize: PAGE_SIZE,
    },
    placeholderData: keepPreviousData,
  });
  const statsQ = useApiQuery<AdminMaterialStats>([...MAT_KEY, "stats"], "/admin/materials/stats");
  const optsQ = useApiQuery<AdminMaterialOptions>([...MAT_KEY, "options"], "/admin/materials/options", { staleTime: 5 * 60_000 });
  const del = useApiMutation((id: string) => api.delete(`/admin/materials/${id}`), { invalidate: MAT_INV, success: "Material oʻchirildi" });

  const s = statsQ.data;
  const list = listQ.data;
  const opts = optsQ.data;
  const typeCounts = list?.types ?? {};
  const typeTotal = Object.values(typeCounts).reduce((a, b) => a + (b ?? 0), 0);
  const hasFilters = !!(dq || type || src || level);

  const hideNote = () => {
    setNoteHidden(true);
    try {
      localStorage.setItem(NOTE_KEY, "1");
    } catch {
      /* localStorage yoʻq */
    }
  };

  const preview = (m: AdminMaterial) => {
    if (m.type === "LINK" && m.url) window.open(m.url, "_blank", "noopener,noreferrer");
    else if (m.file && m.type !== "DOC") openFile(m.file.id).catch(toastError);
    else if (m.file) downloadFile(m.file.id, m.file.originalName).catch(toastError);
  };
  const download = (m: AdminMaterial) => m.file && downloadFile(m.file.id, m.file.originalName).catch(toastError);

  return (
    <>
      <PageHeader
        title="Resurslar bazasi"
        documentTitle="Resurslar bazasi"
        breadcrumbs={[{ label: "Boshqaruv markazi", to: "/admin" }, { label: "Akademik reja" }, { label: "Resurslar bazasi" }]}
        subtitle="Markazning barcha oʻquv materiallari: darsliklar, audio yozuvlar, imtihon topshiriqlari va foydali havolalar"
        actions={
          <Button icon="upload" onClick={() => setCreateOpen(true)}>
            Yangi resurs yuklash
          </Button>
        }
      />

      {!noteHidden ? (
        <Alert
          tone="primary"
          icon="lightbulb"
          className="mb-6"
          title="Resurs kimga koʻrinadi?"
          action={<IconButton icon="close" label="Yopish" size="sm" onClick={hideNote} />}
        >
          <ul className="flex list-disc flex-col gap-1 pl-4">
            <li>
              <b>Umumiy bazaga</b> yuklangan resursni <b>barcha ustozlar</b> koʻradi va darsda ishlatadi.
            </li>
            <li>
              <b>Levelga</b> biriktirilsa — shu leveldagi guruhlar va oʻquvchilarga tegishli boʻladi: oʻquvchi kabinetida faqat oʻz leveli materiallari chiqadi.
              Level tanlanmasa, umumiy bazadagi resurs barcha oʻquvchilarga koʻrinaveradi.
            </li>
            <li>
              <b>Mavzuga (Unit)</b> biriktirilsa — ustoz shu mavzuni oʻtayotganda uni darrov koʻradi, «Mavzular bazasi»da esa unit yonida material soni chiqadi.
            </li>
            <li>
              <b>Guruhga</b> biriktirilsa — faqat shu guruh ustozi, oʻquvchilari va ota-onalari koʻradi.
            </li>
            <li>Ustozlar ham oʻzi resurs yuklay oladi — ularning fayllari ham shu roʻyxatda koʻrinadi.</li>
          </ul>
        </Alert>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Jami resurslar"
          value={fmtNum(s?.total)}
          unit="ta fayl va havola"
          icon="menu_book"
          loading={statsQ.isLoading}
          subIcon="download"
          sub={s ? `${fmtNum(s.totalDownloads)} marta yuklab olingan` : undefined}
        />
        <StatCard
          label="Fayllar hajmi"
          value={s ? fmtFileSize(s.totalSize) || "0 B" : "—"}
          icon="cloud"
          loading={statsQ.isLoading}
          subIcon="check_circle"
          sub="Markaz serverida saqlanadi"
        />
        <StatCard
          label="Umumiy bazada"
          value={fmtNum(s?.library)}
          unit="ta resurs"
          icon="public"
          iconTone="navy"
          loading={statsQ.isLoading}
          subIcon="groups"
          sub="Barcha ustozlarga koʻrinadi"
        />
        <StatCard
          label="Guruhlarga biriktirilgan"
          value={fmtNum(s?.inGroups)}
          unit="ta resurs"
          icon="share"
          iconTone="success"
          loading={statsQ.isLoading}
          subIcon="school"
          sub={s ? `${fmtNum(s.groupsWithMaterials)} ta guruhda` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section className="flex min-w-0 flex-col gap-6 lg:col-span-8">
          <Card className="flex flex-col gap-4 p-5">
            <SearchInput value={q} onValueChange={setQ} placeholder="Resurs nomi, fayl nomi yoki mavzu boʻyicha qidiruv…" />
            <div className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
              {[{ key: "", label: "Barchasi", count: typeTotal }, ...TYPE_ORDER.filter((t) => typeCounts[t]).map((t) => ({ key: t as string, label: MAT_TYPE[t].label, count: typeCounts[t] ?? 0 }))].map(
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
                    ...(opts?.groups ?? []).map((g) => ({ value: `g:${g.id}`, label: `${g.name} (${g.code})` })),
                  ]}
                />
              </label>
              <label className="flex flex-col gap-1">
                <MiniLabel>Level</MiniLabel>
                <Select
                  size="sm"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  options={[{ value: "", label: "Barcha Levellar" }, ...(opts?.levels ?? []).map((l) => ({ value: l.id, label: l.name }))]}
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
                    { value: "downloads", label: "Eng koʻp yuklab olingan" },
                    { value: "title", label: "Nomi boʻyicha (A–Z)" },
                  ]}
                />
              </label>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container p-4">
              <div className="min-w-0">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Barcha materiallar</h2>
                <p className="text-body-sm text-on-surface-muted">Admin va ustozlar yuklagan fayllar, havolalar</p>
              </div>
              {list ? (
                <Badge tone="neutral" shape="square">
                  {fmtNum(list.total)} ta natija
                </Badge>
              ) : null}
            </div>
            {listQ.isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : listQ.error ? (
              <EmptyState
                icon="cloud_off"
                title="Maʼlumotni yuklab boʻlmadi"
                description={listQ.error.message}
                action={
                  <Button variant="outline" size="sm" icon="refresh" onClick={() => listQ.refetch()}>
                    Qayta urinish
                  </Button>
                }
              />
            ) : !list?.items.length ? (
              <EmptyState
                icon="folder_off"
                title={hasFilters ? "Hech narsa topilmadi" : "Resurslar bazasi hali boʻsh"}
                description={
                  hasFilters
                    ? "Qidiruv yoki filtrlarni oʻzgartiring."
                    : "Birinchi materialni yuklang — u umumiy bazaga tushadi va barcha ustozlarga koʻrinadi."
                }
                action={
                  <Button icon="upload" onClick={() => setCreateOpen(true)}>
                    Resurs yuklash
                  </Button>
                }
              />
            ) : (
              <div className={cn("divide-y divide-surface-container", listQ.isPlaceholderData && "opacity-60")}>
                {list.items.map((m) => (
                  <MaterialRow
                    key={m.id}
                    m={m}
                    onPreview={() => preview(m)}
                    onDownload={() => download(m)}
                    onEdit={() => setEditMat(m)}
                    onDelete={() => setDelMat(m)}
                  />
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
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-display text-[15.5px] font-bold text-on-surface">Xotira tahlili</h2>
              <span className="font-display text-[13px] font-bold text-primary">{fmtFileSize(s?.totalSize ?? 0) || "0 B"}</span>
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
                        {t.type === "LINK" ? "—" : fmtFileSize(t.size) || "0 B"}{" "}
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
            <h2 className="mb-3 font-display text-[15.5px] font-bold text-on-surface">Level boʻyicha</h2>
            {statsQ.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : s?.byLevel.length ? (
              <ul className="flex flex-col gap-2">
                {s.byLevel.map((l) => (
                  <li key={l.level.id}>
                    <button
                      type="button"
                      onClick={() => setLevel(level === l.level.id ? "" : l.level.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
                        level === l.level.id ? "border-primary bg-primary-light" : "border-outline-variant hover:bg-surface-container-low",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-label-md text-label-md text-on-surface">{l.level.name}</span>
                        <span className="text-body-sm text-on-surface-muted">
                          {l.count} ta · {fmtFileSize(l.size) || "0 B"}
                        </span>
                      </span>
                      <Badge tone="neutral" shape="square">
                        {l.level.code}
                      </Badge>
                    </button>
                  </li>
                ))}
                {s.withoutLevel ? (
                  <li className="px-1 pt-1 text-body-sm text-on-surface-muted">
                    Levelsiz: {fmtNum(s.withoutLevel)} ta — umumiy bazadagilari barcha oʻquvchilarga koʻrinadi.
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="text-body-sm text-on-surface-muted">Hali levelga biriktirilgan resurs yoʻq.</p>
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
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", MAT_TYPE[m.type].tile)}>
                      <Icon name={MAT_TYPE[m.type].icon} size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-body-sm leading-snug text-on-surface">
                        <span className="font-semibold">{m.uploadedBy.fullName}</span> ({UPLOADER_ROLE[m.uploadedBy.role]}){" "}
                        {m.group ? `${m.group.name} guruhiga` : "umumiy bazaga"} yukladi: <span className="font-medium">{m.title}</span>
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

      <MaterialDialog open={createOpen} onOpenChange={setCreateOpen} options={opts} />
      <MaterialDialog open={!!editMat} onOpenChange={(o) => !o && setEditMat(null)} options={opts} material={editMat} />
      <ConfirmDialog
        open={!!delMat}
        onOpenChange={(o) => !o && setDelMat(null)}
        title="Material oʻchirilsinmi?"
        description={
          delMat
            ? `“${delMat.title}” va uning fayli serverdan butunlay oʻchiriladi. Uni ustozlar ham, oʻquvchilar ham koʻra olmaydi.`
            : undefined
        }
        confirmLabel="Oʻchirish"
        onConfirm={() => del.mutateAsync(delMat!.id)}
      />
    </>
  );
}

// ─────────── Roʻyxat qatori ───────────

function MiniLabel({ children }: { children: ReactNode }) {
  return <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">{children}</span>;
}

function MaterialRow({
  m,
  onPreview,
  onDownload,
  onEdit,
  onDelete,
}: {
  m: AdminMaterial;
  onPreview: () => void;
  onDownload: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = MAT_TYPE[m.type];
  const meta = [
    ...(m.file ? [fmtFileSize(m.file.size)] : []),
    `${fmtNum(m.downloads)} marta yuklab olingan`,
    `${m.uploadedBy.fullName} (${UPLOADER_ROLE[m.uploadedBy.role]})`,
    fmtRelDay(m.createdAt),
  ];
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
              <Badge tone={m.group ? "primary" : "navy"} shape="square">
                {m.group ? `${m.group.name} guruhi` : "Umumiy baza"}
              </Badge>
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
              {meta.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-2">
                  {i > 0 ? <span className="text-outline">•</span> : null}
                  {p}
                </span>
              ))}
            </div>
            {m.description ? <p className="mt-1 line-clamp-1 text-body-sm text-on-surface-variant">{m.description}</p> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 self-end md:self-center">
          <Button size="sm" variant="secondary" icon={m.type === "LINK" ? "open_in_new" : "visibility"} onClick={onPreview}>
            {m.type === "LINK" ? "Ochish" : "Koʻrish"}
          </Button>
          {m.file ? <IconButton icon="download" label="Yuklab olish" size="sm" onClick={onDownload} /> : null}
          <IconButton icon="edit" label="Tahrirlash" size="sm" onClick={onEdit} />
          <IconButton icon="delete" label="Oʻchirish" size="sm" className="text-error" onClick={onDelete} />
        </div>
      </div>
    </div>
  );
}

// ─────────── Yuklash / tahrirlash oynasi ───────────

function MaterialDialog({
  open,
  onOpenChange,
  options,
  material,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  options: AdminMaterialOptions | undefined;
  material?: AdminMaterial | null;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={material ? "Resursni tahrirlash" : "Yangi resurs yuklash"}
      description={material ? material.title : "Fayl yoki havola — umumiy bazaga, levelga, mavzuga yoki guruhga"}
      size="lg"
    >
      {open ? <MaterialForm key={material?.id ?? "new"} options={options} material={material ?? null} onDone={() => onOpenChange(false)} /> : null}
    </Dialog>
  );
}

function MaterialForm({
  options,
  material,
  onDone,
}: {
  options: AdminMaterialOptions | undefined;
  material: AdminMaterial | null;
  onDone: () => void;
}) {
  const editing = !!material;
  const [mode, setMode] = useState<"file" | "link">("file");
  const [file, setFile] = useState<FileMeta | null>(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState(material?.title ?? "");
  const [description, setDescription] = useState(material?.description ?? "");
  const [scope, setScope] = useState<"library" | "group">(material?.group ? "group" : "library");
  const [groupId, setGroupId] = useState(material?.group?.id ?? "");
  const [levelId, setLevelId] = useState(material?.level?.id ?? "");
  const [topicId, setTopicId] = useState(material?.topic?.id ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const topics = (options?.topics ?? []).filter((t) => !levelId || t.levelId === levelId);

  const pick = async (list: File[]) => {
    const f = list[0];
    if (!f) return;
    if (tooLarge([f])) {
      toast.error(`Fayl hajmi ${MAX_UPLOAD_MB} MB dan oshmasin`);
      return;
    }
    setUploading(true);
    try {
      const [up] = await uploadFiles([f]);
      setFile(up);
      setErrors((e) => ({ ...e, file: "" }));
      if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
    } catch (err) {
      toastError(err);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrag(false);
    void pick(Array.from(e.dataTransfer.files));
  };

  const save = useApiMutation(
    (body: Record<string, unknown>) =>
      editing ? api.put<AdminMaterial>(`/admin/materials/${material!.id}`, body) : api.post<AdminMaterial>("/admin/materials", body),
    { invalidate: MAT_INV },
  );

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!editing && mode === "file" && !file) e.file = "Faylni tanlang";
    if (!editing && mode === "link" && !/^https?:\/\/\S+\.\S+/i.test(url.trim())) e.url = "Havola http:// yoki https:// bilan boshlansin";
    if (title.trim().length < 2) e.title = "Nomi kamida 2 belgi";
    if (scope === "group" && !groupId) e.group = "Guruhni tanlang";
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    await save.mutateAsync({
      title: title.trim(),
      ...(editing ? {} : mode === "file" ? { fileId: file!.id } : { url: url.trim() }),
      groupId: scope === "group" ? groupId : null,
      levelId: levelId || null,
      topicId: topicId || null,
      description: description.trim() || null,
    });
    toast.success(editing ? "Material yangilandi" : scope === "group" ? "Material guruhga biriktirildi" : "Material resurslar bazasiga yuklandi");
    onDone();
  };

  const levelHint =
    scope === "group"
      ? "Guruh materialini faqat shu guruh ustozi, oʻquvchilari va ota-onalari koʻradi."
      : levelId
        ? "Umumiy bazadagi bu resurs faqat shu leveldagi guruh oʻquvchilariga koʻrinadi; ustozlarning hammasi koʻra oladi."
        : "Level tanlanmasa, resurs barcha oʻquvchilarning kutubxonasida koʻrinadi. Muayyan bosqich uchun boʻlsa — levelni tanlang.";

  return (
    <form
      className="space-y-4"
      onSubmit={(ev) => {
        ev.preventDefault();
        void submit().catch(() => {});
      }}
    >
      {editing ? (
        <div className="flex min-w-0 items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low/60 p-3">
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", MAT_TYPE[material.type].tile)}>
            <Icon name={MAT_TYPE[material.type].icon} size={22} />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-label-md text-label-md text-on-surface">{material.file?.originalName ?? material.url ?? "—"}</span>
            <span className="text-body-sm text-on-surface-muted">
              {material.file ? `${fmtFileSize(material.file.size)} · ` : ""}
              Faylni almashtirib boʻlmaydi — yangi resurs yuklang
            </span>
          </span>
        </div>
      ) : (
        <>
          <div className="inline-flex rounded-lg bg-surface-container-low p-1" role="tablist">
            {(
              [
                ["file", "Fayl", "upload_file"],
                ["link", "Havola", "link"],
              ] as const
            ).map(([k, label, icon]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={mode === k}
                onClick={() => setMode(k)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-md px-3 font-label-md text-label-md transition-colors",
                  mode === k ? "bg-surface-container-lowest text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                <Icon name={icon} size={16} />
                {label}
              </button>
            ))}
          </div>

          {mode === "file" ? (
            <div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && inputRef.current?.click()}
                onDragOver={(ev) => {
                  ev.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
                  drag ? "border-primary bg-primary-light" : errors.file ? "border-error/60 bg-error-container/30" : "border-outline-variant bg-surface-container-low/60 hover:border-primary/60",
                )}
              >
                <input ref={inputRef} type="file" accept={ACCEPT_ALL} className="hidden" onChange={(ev) => void pick(Array.from(ev.target.files ?? [])).finally(() => (ev.target.value = ""))} />
                {uploading ? (
                  <>
                    <Spinner size={28} className="text-primary" />
                    <span className="text-body-md text-on-surface-variant">Yuklanmoqda…</span>
                  </>
                ) : file ? (
                  <>
                    <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl", MAT_TYPE[materialTypeFromMime(file.mime)].tile)}>
                      <Icon name={MAT_TYPE[materialTypeFromMime(file.mime)].icon} size={26} />
                    </span>
                    <span className="max-w-full truncate font-label-lg text-label-lg text-on-surface">{file.originalName}</span>
                    <span className="text-body-sm text-on-surface-muted">
                      {fmtFileSize(file.size)} · {MAT_TYPE[materialTypeFromMime(file.mime)].label} · almashtirish uchun bosing
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                      <Icon name="cloud_upload" size={26} />
                    </span>
                    <span className="font-label-lg text-label-lg text-on-surface">Faylni shu yerga tashlang yoki tanlang</span>
                    <span className="text-body-sm text-on-surface-muted">PDF, DOCX, PPTX, MP3, M4A, MP4, rasm · {MAX_UPLOAD_MB} MB gacha</span>
                  </>
                )}
              </div>
              {errors.file ? <p className="mt-1.5 text-body-sm text-error">{errors.file}</p> : null}
            </div>
          ) : (
            <Field label="Havola" required error={errors.url}>
              <Input value={url} onChange={(ev) => setUrl(ev.target.value)} placeholder="https://…" inputMode="url" icon="link" />
            </Field>
          )}
        </>
      )}

      <Field label="Nomi" required error={errors.title}>
        <Input value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder="Masalan: Prepare 2e — Unit 4 Audio" maxLength={200} />
      </Field>

      <Field label="Joylashuv">
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["library", "Umumiy baza", "Barcha ustozlar foydalanadi", "public"],
              ["group", "Bitta guruhga", "Faqat shu guruh ustozi va oʻquvchilari", "groups"],
            ] as const
          ).map(([k, label, hint, icon]) => (
            <button
              key={k}
              type="button"
              aria-pressed={scope === k}
              onClick={() => setScope(k)}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                scope === k ? "border-primary bg-primary-light" : "border-outline-variant hover:border-primary/50",
              )}
            >
              <Icon name={icon} size={20} className={scope === k ? "text-primary" : "text-on-surface-variant"} />
              <span>
                <span className="block font-label-lg text-label-lg text-on-surface">{label}</span>
                <span className="block text-body-sm text-on-surface-muted">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      </Field>

      {scope === "group" ? (
        <Field label="Guruh" required error={errors.group}>
          <Select
            value={groupId}
            onChange={(ev) => {
              setGroupId(ev.target.value);
              const g = options?.groups.find((x) => x.id === ev.target.value);
              if (g?.levelId && !levelId) setLevelId(g.levelId);
            }}
            placeholder="Guruhni tanlang…"
            options={(options?.groups ?? []).map((g) => ({ value: g.id, label: `${g.name} (${g.code})` }))}
          />
        </Field>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Level" hint={levelHint}>
          <Select
            value={levelId}
            onChange={(ev) => {
              setLevelId(ev.target.value);
              setTopicId("");
            }}
            placeholder="Tanlanmagan"
            options={(options?.levels ?? []).map((l) => ({ value: l.id, label: l.name }))}
          />
        </Field>
        <Field label="Mavzu (Unit)" hint={levelId ? "Ustoz shu mavzuni oʻtayotganda darrov koʻradi" : undefined}>
          <Select
            value={topicId}
            disabled={!levelId}
            onChange={(ev) => setTopicId(ev.target.value)}
            placeholder={levelId ? "Tanlanmagan" : "Avval Levelni tanlang"}
            options={topics.map((t) => ({ value: t.id, label: `Unit ${t.unit} — ${t.title}` }))}
          />
        </Field>
      </div>

      <Field label="Izoh">
        <Textarea rows={2} value={description} onChange={(ev) => setDescription(ev.target.value)} placeholder="Qisqa tavsif (ixtiyoriy)" maxLength={2000} />
      </Field>

      <div className="flex flex-wrap justify-end gap-2 border-t border-outline-variant pt-4">
        <Button variant="ghost" onClick={onDone} disabled={save.isPending}>
          Bekor qilish
        </Button>
        <Button type="submit" icon="cloud_done" loading={save.isPending} disabled={uploading}>
          Saqlash
        </Button>
      </div>
    </form>
  );
}
