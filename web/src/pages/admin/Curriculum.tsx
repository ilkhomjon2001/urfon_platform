// Admin: Mavzular bazasi (o'quv dasturi va sillabus).
import { useEffect, useMemo, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Alert, Avatar, Badge, Button, buttonVariants, Card, ConfirmDialog, EmptyState, Icon, IconButton, PageHeader, ProgressBar, SearchInput, Skeleton,
} from "@/components/ui";
import { useShellSearch } from "@/components/shell/ShellSearch";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { academicYearLabel, fmtDate, fmtNum } from "@/lib/format";
import { useDebouncedValue, useFlagParam, useSearchParamState } from "@/lib/hooks";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { downloadCsv, keys, TOPIC_STATUS } from "./a/shared";
import { LevelDialog, TopicFormDialog } from "./a/TopicForm";
import type { LevelStat, TopicRow, TopicsResponse } from "./a/types";

const NOTE_KEY = "urfon.admin.curriculumNote";
const MATERIAL_LABEL: Record<string, string> = { PDF: "PDF", AUDIO: "Audio", VIDEO: "Video", DOC: "Hujjat", IMAGE: "Rasm", LINK: "Havola" };
const FILTERS = [
  { value: "ACTIVE", label: "Amaldagi" },
  { value: "PUBLISHED", label: "Tasdiqlangan" },
  { value: "DRAFT", label: "Qoralama" },
  { value: "ARCHIVED", label: "Arxiv" },
] as const;

export default function AdminCurriculumPage() {
  const levelsQ = useApiQuery<{ items: LevelStat[] }>(["admin", "curriculum", "levels"], "/admin/curriculum/levels");
  const levels = levelsQ.data?.items ?? [];
  const [levelParam, setLevelParam] = useSearchParamState("level");
  const [filter, setFilter] = useSearchParamState("t", "ACTIVE");
  const [q, setQ] = useSearchParamState("q");
  const [createOpen, setCreateOpen] = useFlagParam("new");
  const { query: shellQuery } = useShellSearch();
  const dq = useDebouncedValue(q || shellQuery, 300);

  // default: eng ko'p guruh ishlatayotgan level
  const defaultLevel = useMemo(() => [...levels].sort((a, b) => b.groupsCount - a.groupsCount || a.order - b.order)[0], [levels]);
  const levelId = levelParam || defaultLevel?.id || null;
  const level = levels.find((l) => l.id === levelId) ?? null;

  const topicsQ = useApiQuery<TopicsResponse>(["admin", "curriculum", "topics", levelId], levelId ? `/admin/curriculum/levels/${levelId}/topics` : null, {
    params: { status: filter, q: dq },
    placeholderData: (p) => (p && p.level.id === levelId ? p : undefined),
  });
  const data = topicsQ.data;

  const [editTopic, setEditTopic] = useState<TopicRow | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<TopicRow | null>(null);
  const [levelOpen, setLevelOpen] = useState(false);
  const [editLevel, setEditLevel] = useState<LevelStat | null>(null);
  const [noteHidden, setNoteHidden] = useState(() => {
    try {
      return localStorage.getItem(NOTE_KEY) === "1";
    } catch {
      return false;
    }
  });

  // tartib (drag & drop / strelkalar) — optimistik lokal tartib
  const [order, setOrder] = useState<string[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  useEffect(() => setOrder(null), [data]);
  const items = useMemo(() => {
    const list = data?.items ?? [];
    if (!order) return list;
    const byId = new Map(list.map((t) => [t.id, t]));
    return order.map((id) => byId.get(id)).filter((t): t is TopicRow => !!t);
  }, [data, order]);

  const reorder = useApiMutation((topicIds: string[]) => api.post<{ moved: number }>(`/admin/curriculum/levels/${levelId}/reorder`, { topicIds }), {
    invalidate: keys("curriculum"),
    success: "Mavzular tartibi saqlandi",
    onError: () => setOrder(null),
  });
  const updateStatus = useApiMutation((v: { id: string; status: "PUBLISHED" | "DRAFT" }) => api.put(`/admin/curriculum/topics/${v.id}`, { status: v.status }), {
    invalidate: keys("curriculum"),
    success: (_d, v) => (v.status === "PUBLISHED" ? "Mavzu tasdiqlandi — ustozlar uni tanlay oladi" : "Mavzu qoralamaga oʻtkazildi"),
  });
  const duplicate = useApiMutation((id: string) => api.post<TopicRow>(`/admin/curriculum/topics/${id}/duplicate`), {
    invalidate: keys("curriculum"),
    success: (t) => `Nusxa yaratildi: Unit ${t.unit} (qoralama)`,
  });
  const archive = useApiMutation((id: string) => api.post(`/admin/curriculum/topics/${id}/archive`), {
    invalidate: keys("curriculum"),
    success: "Mavzu arxivlandi",
  });

  const commitOrder = (ids: string[]) => {
    const before = items.map((t) => t.id).join(",");
    if (ids.join(",") === before) return;
    setOrder(ids);
    reorder.mutate(ids);
  };
  const move = (idx: number, dir: -1 | 1) => {
    const ids = items.map((t) => t.id);
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    commitOrder(ids);
  };
  const onDragOver = (e: DragEvent, overId: string) => {
    if (!dragId || dragId === overId) return;
    e.preventDefault();
    const ids = (order ?? items.map((t) => t.id)).filter((id) => id !== dragId);
    const at = ids.indexOf(overId);
    ids.splice(at, 0, dragId);
    setOrder(ids);
  };
  const onDrop = () => {
    if (order) {
      const ids = order;
      setDragId(null);
      if (ids.join(",") !== (data?.items ?? []).map((t) => t.id).join(",")) reorder.mutate(ids);
    }
  };

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(
      `sillabus-${data.level.code}.csv`,
      ["Unit", "Mavzu", "Holat", "Darslar", "Soat", "Grammatika", "Lugʻat", "Materiallar", "Darslarda ishlatilgan"],
      data.items.map((t) => [t.unit, t.title, TOPIC_STATUS[t.status].label, t.lessonsCount, t.hours, t.grammar ?? "", t.vocabulary.join(", "), t.materialsCount, t.usage]),
    );
  };

  // Davomiylik: dasturda koʻrsatilgan hafta, boʻlmasa darslar sonidan (haftasiga 3 dars) hisoblanadi.
  const weeks = level ? (level.weeks ?? Math.max(1, Math.round(level.lessons / 3))) : 0;
  const months = Math.max(1, Math.round(weeks / 4.3));

  return (
    <>
      <PageHeader
        title={
          <>
            Mavzular bazasi <span className="font-headline-lg text-headline-lg font-normal text-on-surface-variant">(Oʻquv dasturi va sillabus)</span>
          </>
        }
        documentTitle="Mavzular bazasi"
        breadcrumbs={[{ label: "Boshqaruv markazi", to: "/admin" }, { label: "Akademik reja" }, { label: "Mavzular bazasi" }]}
        subtitle="Oʻquv markazining barcha darajalari boʻyicha standartlashtirilgan akademik mavzular va dars rejalari"
        actions={
          <>
            <Badge tone="primary" size="md" dot className="hidden sm:inline-flex">
              {academicYearLabel().split(" · ")[0]}
            </Badge>
            <Button variant="outline" icon="file_download" onClick={exportCsv} disabled={!data?.items.length}>
              Eksport (CSV)
            </Button>
            <Button variant="navy" icon="add_circle" onClick={() => setCreateOpen(true)} disabled={!levels.length}>
              Yangi mavzu qoʻshish
            </Button>
          </>
        }
      />

      {!noteHidden ? (
        <Alert
          tone="primary"
          icon="lightbulb"
          className="mb-6"
          title="Metodologik eslatma"
          action={
            <IconButton
              icon="close"
              label="Yopish"
              size="sm"
              onClick={() => {
                setNoteHidden(true);
                try {
                  localStorage.setItem(NOTE_KEY, "1");
                } catch {
                  /* localStorage yo'q */
                }
              }}
            />
          }
        >
          Ustozlar darsni oʻtkazishda shu bazadan faqat <b>Tasdiqlangan</b> mavzularni tanlay oladi. Qoralama va arxivlangan mavzular ustoz kabinetida koʻrinmaydi.
          Har bir oʻzgarish tizim jurnaliga yoziladi.
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
        {/* ─── Chap ustun: bosqichlar ─── */}
        <div className="flex min-w-0 flex-col gap-4 xl:col-span-4">
          <Card className="p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Struktura</div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Akademik bosqichlar</h2>
              </div>
              <Badge tone="neutral">{levels.length} ta level</Badge>
            </div>
            {levelsQ.isLoading ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : levelsQ.error ? (
              <Alert tone="danger">{levelsQ.error.message}</Alert>
            ) : (
              <nav className="flex flex-col gap-1.5" aria-label="Leveller">
                {levels.map((l) => {
                  const active = l.id === levelId;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        setLevelParam(l.id);
                        setQ(null);
                      }}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "group flex items-center justify-between gap-3 rounded-lg p-2.5 text-left transition-all",
                        active ? "bg-primary text-on-primary shadow-float" : "hover:bg-surface-container",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-display text-[12px] font-bold",
                            active ? "bg-on-primary/15 text-on-primary" : "bg-surface-container text-on-surface-variant group-hover:bg-primary-fixed group-hover:text-primary",
                          )}
                        >
                          {l.code.length <= 3 ? l.code : l.code.slice(0, 2)}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate font-label-lg text-label-lg">{l.label ?? l.name}</span>
                            {l.groupsCount ? <span className="h-2 w-2 shrink-0 rounded-full bg-gold" title="Faol guruhlar bor" /> : null}
                          </span>
                          <span className={cn("block truncate text-body-sm", active ? "text-on-primary/80" : "text-on-surface-variant")}>
                            {[l.audience, l.cefr].filter(Boolean).join(" · ") || "Kimga moʻljallangani koʻrsatilmagan"}
                          </span>
                          <span className={cn("block truncate font-label-sm text-label-sm", active ? "text-on-primary/70" : "text-on-surface-muted")}>
                            {l.topicsCount} ta mavzu · {fmtNum(l.lessons)} dars{l.materialsCount ? ` · ${l.materialsCount} ta resurs` : ""}
                            {l.groupsCount ? ` · ${l.groupsCount} guruh` : ""}
                          </span>
                        </span>
                      </span>
                      <Icon name={active ? "arrow_forward" : "chevron_right"} size={18} className={active ? "text-on-primary" : "text-on-surface-variant"} />
                    </button>
                  );
                })}
              </nav>
            )}
            <Button variant="secondary" icon="add" block className="mt-3 text-primary" onClick={() => setLevelOpen(true)}>
              Yangi bosqich yaratish
            </Button>
          </Card>

          {level ? (
            <Card className="p-4 sm:p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Tanlangan bosqich</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">{level.label ?? level.name}</h3>
                </div>
                <IconButton icon="edit" label="Bosqich tavsifini tahrirlash" size="sm" onClick={() => setEditLevel(level)} />
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                <Badge tone="gold" icon="groups">
                  {level.audience ?? "Yosh guruhi koʻrsatilmagan"}
                </Badge>
                {level.cefr ? <Badge tone="neutral">CEFR: {level.cefr}</Badge> : null}
              </div>
              {level.description ? (
                <p className="mb-3 text-body-md leading-snug text-on-surface-variant">{level.description}</p>
              ) : (
                <p className="mb-3 text-body-sm text-on-surface-muted">
                  Bu bosqich nima oʻrgatishi yozilmagan. Qalamchani bosib tavsif qoʻshing — ustozlar va yangi xodimlar uchun ayni shu matn bosqichni tushuntiradi.
                </p>
              )}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col rounded-lg bg-surface-container-low p-2.5 text-center">
                  <span className="text-body-sm text-on-surface-variant">Umumiy yuklama</span>
                  <span className="mt-1 font-metric-num text-metric-num text-primary">{fmtNum(level.hours)}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">akademik soat</span>
                </div>
                <div className="flex flex-col rounded-lg bg-surface-container-low p-2.5 text-center">
                  <span className="text-body-sm text-on-surface-variant">Guruhlar</span>
                  <span className="mt-1 font-metric-num text-metric-num text-navy">{level.groupsCount} ta</span>
                  <span className="truncate font-label-sm text-label-sm text-on-surface-variant" title={level.groups.map((g) => g.name).join(", ")}>
                    {level.groups.length ? level.groups.map((g) => g.name.match(/#\d+/)?.[0] ?? g.code).join(" · ") : "guruh yoʻq"}
                  </span>
                </div>
                <div className="flex flex-col rounded-lg bg-surface-container-low p-2.5 text-center">
                  <span className="text-body-sm text-on-surface-variant">Davomiylik</span>
                  <span className="mt-1 font-metric-num text-metric-num text-tertiary">{weeks} hafta</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    ≈ {months} oy · {fmtNum(level.lessons)} dars
                  </span>
                </div>
              </div>
              {data ? (
                <div className="mt-3 rounded-lg bg-surface-container-low p-3">
                  <ProgressBar value={data.stats.materialsCoveragePct ?? 0} label="Materiallar bilan taʼminlanganlik" showValue />
                  <div className="mt-2 text-body-sm text-on-surface-variant">
                    {data.stats.published} tasdiqlangan · {data.stats.draft} qoralama · {data.stats.archived} arxivda
                  </div>
                </div>
              ) : null}
            </Card>
          ) : null}

          {data?.stats.lastUpdatedAt ? (
            <Card className="flex items-center gap-3 p-4">
              <Avatar name={data.stats.lastAuthor?.fullName ?? "Sillabus"} size="lg" tone="neutral" />
              <div className="min-w-0">
                <div className="truncate font-label-lg text-label-lg text-on-surface">{data.stats.lastAuthor?.fullName ?? "Muallif belgilanmagan"}</div>
                <div className="truncate text-body-sm text-on-surface-variant">{data.stats.lastAuthor?.title ?? "Sillabusning soʻnggi tahriri"}</div>
                <div className="font-label-sm text-label-sm text-primary">Soʻnggi yangilanish: {fmtDate(data.stats.lastUpdatedAt)}</div>
              </div>
            </Card>
          ) : null}
        </div>

        {/* ─── O'ng ustun: mavzular ─── */}
        <div className="flex min-w-0 flex-col gap-3 xl:col-span-8">
          <Card className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-headline-md text-headline-md text-on-surface">{level?.label ?? level?.name ?? "Level"}</h2>
                {data ? <Badge tone="primary">{data.stats.topics} ta mavzu</Badge> : null}
                {level?.audience ? <Badge tone="neutral">{level.audience}</Badge> : null}
              </div>
              <span className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant">
                <Icon name="swap_vert" size={16} className="text-primary" />
                Tartibni oʻzgartirish uchun sudrang yoki strelkalarni bosing
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <SearchInput value={q} onValueChange={(v) => setQ(v || null)} placeholder="Mavzu nomi yoki kalit soʻz (lugʻat, grammatika)…" wrapperClassName="flex-1" />
              <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Holat">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    role="tab"
                    aria-selected={filter === f.value}
                    onClick={() => setFilter(f.value)}
                    className={cn(
                      "h-9 shrink-0 whitespace-nowrap rounded-lg px-3 font-label-md text-label-md transition-colors",
                      filter === f.value ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:text-on-surface",
                    )}
                  >
                    {f.label}
                    {data ? ` (${data.counts[f.value]})` : ""}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {topicsQ.isLoading || (levelsQ.isLoading && !data) ? (
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)
          ) : topicsQ.error ? (
            <Alert tone="danger" title="Mavzular yuklanmadi">
              {topicsQ.error.message}
            </Alert>
          ) : !levelId ? (
            <Card>
              <EmptyState icon="menu_book" title="Level yoʻq" description="Avval akademik bosqich yarating" action={<Button onClick={() => setLevelOpen(true)}>Yangi bosqich</Button>} />
            </Card>
          ) : items.length === 0 ? (
            <Card>
              <EmptyState
                icon="topic"
                title={q ? "Qidiruv boʻyicha mavzu topilmadi" : filter === "ARCHIVED" ? "Arxiv boʻsh" : "Bu levelda hali mavzu yoʻq"}
                description={q ? "Boshqa kalit soʻz bilan urinib koʻring" : "Sillabusni birinchi mavzudan boshlang"}
                action={
                  <Button icon="add" onClick={() => setCreateOpen(true)}>
                    Yangi mavzu
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className={cn("flex flex-col gap-3", (topicsQ.isFetching || reorder.isPending) && "opacity-80")}>
              {items.map((t, idx) => (
                <TopicCard
                  key={t.id}
                  t={t}
                  first={idx === 0}
                  last={idx === items.length - 1}
                  dragging={dragId === t.id}
                  onDragStart={() => setDragId(t.id)}
                  onDragEnd={() => {
                    setDragId(null);
                  }}
                  onDragOver={(e) => onDragOver(e, t.id)}
                  onDrop={onDrop}
                  onUp={() => move(idx, -1)}
                  onDown={() => move(idx, 1)}
                  onEdit={() => setEditTopic(t)}
                  onDuplicate={() => duplicate.mutate(t.id)}
                  onArchive={() => setArchiveTarget(t)}
                  onRestore={() => updateStatus.mutate({ id: t.id, status: "DRAFT" })}
                  onPublish={() => updateStatus.mutate({ id: t.id, status: "PUBLISHED" })}
                  onUnpublish={() => updateStatus.mutate({ id: t.id, status: "DRAFT" })}
                  busy={reorder.isPending || updateStatus.isPending}
                />
              ))}
            </div>
          )}

          {data && items.length ? (
            <p className="text-center text-body-sm text-on-surface-muted">
              {data.counts.all} ta mavzudan {items.length} tasi koʻrsatilmoqda · jami {fmtNum(data.stats.lessons)} dars, {fmtNum(data.stats.hours)} soat
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-4">
            <div className="flex items-center gap-3">
              <Icon name="cloud_done" size={24} className="text-primary" />
              <div>
                <div className="font-label-lg text-label-lg text-on-surface">Oʻzgarishlar darhol saqlanadi</div>
                <div className="text-body-sm text-on-surface-variant">Tasdiqlangan mavzular ustozlarning dars oʻtkazish sahifasida darhol koʻrinadi.</div>
              </div>
            </div>
            <Link to="/admin/jurnal?entityType=Topic" className={buttonVariants({ variant: "outline", size: "sm", className: "text-primary" })}>
              Tarixni koʻrish (tizim jurnali)
            </Link>
          </div>
        </div>
      </div>

      <TopicFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        levels={levels}
        defaultLevelId={levelId ?? undefined}
        onSaved={(m) => toast.success(m)}
      />
      <TopicFormDialog
        open={!!editTopic}
        onOpenChange={(o) => !o && setEditTopic(null)}
        topic={editTopic}
        levels={levels}
        defaultLevelId={levelId ?? undefined}
        onSaved={(m) => toast.success(m)}
      />
      <LevelDialog open={levelOpen} onOpenChange={setLevelOpen} onCreated={(id) => setLevelParam(id)} />
      <LevelDialog open={!!editLevel} level={editLevel} onOpenChange={(o) => !o && setEditLevel(null)} onCreated={(id) => setLevelParam(id)} />
      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(o) => !o && setArchiveTarget(null)}
        title="Mavzu arxivlansinmi?"
        description={
          archiveTarget
            ? `Unit ${archiveTarget.unit}: ${archiveTarget.title} ustozlar tanlovidan olib tashlanadi.${
                archiveTarget.usage ? ` Mavzu ${archiveTarget.usage} ta darsda ishlatilgan — ular tarixda saqlanib qoladi.` : ""
              } Keyinroq arxivdan tiklash mumkin.`
            : undefined
        }
        confirmLabel="Arxivlash"
        onConfirm={async () => {
          if (archiveTarget) await archive.mutateAsync(archiveTarget.id);
        }}
      />
    </>
  );
}

/** Unitning darsma-dars rejasi (Prepare 2e asosida) — ochiladigan roʻyxat. */
function PlanDetails({ plan }: { plan: NonNullable<TopicRow["lessonPlan"]> }) {
  return (
    <details className="mt-2.5 rounded-lg bg-surface-container-low px-3 py-2 text-body-sm">
      <summary className="cursor-pointer font-label-md text-label-md text-on-surface">Dars rejasi · {plan.length} dars</summary>
      <ol className="mt-2 flex flex-col gap-2.5">
        {plan.map((p, i) => (
          <li key={i} className="flex flex-col gap-0.5">
            <span className="font-semibold text-on-surface">
              {i + 1}-dars · {p.focus}
              {p.sb && p.sb !== "—" ? <span className="font-normal tabular-nums text-on-surface-variant"> · SB {p.sb}</span> : null}
            </span>
            <ul className="list-disc pl-5 text-on-surface-variant">
              {p.steps.map((s, k) => (
                <li key={k}>{s}</li>
              ))}
            </ul>
            {p.homework ? (
              <span className="text-on-surface-variant">
                <b className="font-semibold text-on-surface">Uy vazifasi:</b> {p.homework}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </details>
  );
}

function TopicCard({
  t, first, last, dragging, busy, onDragStart, onDragEnd, onDragOver, onDrop, onUp, onDown, onEdit, onDuplicate, onArchive, onRestore, onPublish, onUnpublish,
}: {
  t: TopicRow;
  first: boolean;
  last: boolean;
  dragging: boolean;
  busy: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: () => void;
  onUp: () => void;
  onDown: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
}) {
  const st = TOPIC_STATUS[t.status];
  const live = t.currentGroups.length > 0 && t.status !== "ARCHIVED";
  const types = t.materialTypes.map((x) => MATERIAL_LABEL[x] ?? x).join(", ");
  return (
    <article
      draggable={!busy}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      className={cn(
        "group relative flex items-start gap-3 overflow-hidden rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-4 shadow-card transition-all sm:gap-4 sm:p-5",
        live && "shadow-float",
        dragging && "opacity-50 ring-2 ring-primary/40",
        t.status === "ARCHIVED" && "bg-surface-container-low/60",
      )}
    >
      {live ? <span className="absolute inset-y-0 left-0 w-1.5 bg-primary" aria-hidden /> : null}
      <div className={cn("flex cursor-grab flex-col items-center gap-1 pt-0.5 active:cursor-grabbing", live ? "text-primary" : "text-on-surface-variant/70 group-hover:text-primary")}>
        <Icon name="drag_indicator" size={20} />
        <span className={cn("font-display text-label-sm font-bold tabular-nums", live ? "text-primary" : "text-on-surface-variant")}>#{String(t.unit).padStart(2, "0")}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={cn("font-headline-md text-headline-md", live ? "text-primary" : "text-on-surface", t.status === "ARCHIVED" && "text-on-surface-variant")}>
            Unit {t.unit}: {t.title}
          </h3>
          <Badge tone="neutral">
            {t.lessonsCount} dars · {fmtNum(t.hours)} soat
          </Badge>
          {live ? (
            <Badge tone="gold" icon="stars">
              Guruhlarga oʻtilmoqda
            </Badge>
          ) : null}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge tone={st.tone} icon={st.icon}>
            {st.label}
          </Badge>
          {t.status === "PUBLISHED" ? (
            <span className="text-body-sm text-success">Ustozlar tanlay oladi</span>
          ) : t.status === "DRAFT" ? (
            <span className="text-body-sm text-on-surface-muted">Ustozlarga koʻrinmaydi</span>
          ) : null}
        </div>
        {t.description ? <p className="mt-2 text-body-md leading-snug text-on-surface-variant">{t.description}</p> : null}
        {t.grammar || t.vocabulary.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5 text-body-sm">
            {t.grammar ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary-fixed px-2 py-0.5 text-on-secondary-fixed-variant">
                <Icon name="spellcheck" size={14} /> {t.grammar}
              </span>
            ) : null}
            {t.vocabulary.slice(0, 6).map((v) => (
              <span key={v} className="rounded-md bg-surface-container px-2 py-0.5 text-on-surface-variant">
                {v}
              </span>
            ))}
            {t.vocabulary.length > 6 ? <span className="px-1 text-on-surface-muted">+{t.vocabulary.length - 6}</span> : null}
          </div>
        ) : null}
        {t.lessonPlan?.length ? <PlanDetails plan={t.lessonPlan} /> : null}
        {live ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-lg bg-surface-container-low p-2">
            <Icon name="record_voice_over" size={20} className="text-primary" />
            <span className="font-label-sm text-label-sm text-on-surface">Hozir oʻtilmoqda: {t.currentGroups.map((g) => g.name).join(", ")}</span>
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-label-sm text-label-sm text-on-surface-variant">
            <span className={cn("inline-flex items-center gap-1", t.materialsCount ? "text-primary" : "text-on-surface-muted")}>
              <Icon name="attach_file" size={16} />
              {t.materialsCount ? `${t.materialsCount} ta material (${types})` : "Material yoʻq"}
            </span>
            {t.homeworkCount ? (
              <span className="inline-flex items-center gap-1">
                <Icon name="assignment" size={16} /> Uyga vazifa: {t.homeworkCount} ta
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1" title={t.groupsUsing.map((g) => g.name).join(", ")}>
              <Icon name="history" size={16} />
              {t.usage ? `${t.usage} ta darsda · ${t.groupsUsing.length} guruh` : "Hali darsda ishlatilmagan"}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <IconButton icon="arrow_upward" label="Yuqoriga" size="sm" onClick={onUp} disabled={first || busy} />
            <IconButton icon="arrow_downward" label="Pastga" size="sm" onClick={onDown} disabled={last || busy} />
            {t.status === "DRAFT" ? (
              <Button size="sm" variant="secondary" icon="check_circle" className="mx-1 text-success" onClick={onPublish} disabled={busy}>
                Tasdiqlash
              </Button>
            ) : null}
            {t.status === "PUBLISHED" ? (
              <IconButton icon="unpublished" label="Qoralamaga qaytarish" size="sm" onClick={onUnpublish} disabled={busy} />
            ) : null}
            <IconButton icon="edit" label="Tahrirlash" size="sm" onClick={onEdit} />
            <IconButton icon="content_copy" label="Nusxalash" size="sm" onClick={onDuplicate} />
            {t.status === "ARCHIVED" ? (
              <IconButton icon="unarchive" label="Arxivdan tiklash" size="sm" onClick={onRestore} />
            ) : (
              <IconButton icon="archive" label="Arxivlash" size="sm" className="hover:bg-error-container hover:text-error" onClick={onArchive} />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
