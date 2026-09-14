import { keepPreviousData } from "@tanstack/react-query";
import { Badge, Card, CardContent, CardHeader, EmptyState, PageHeader, SearchInput, Select, Tabs, TabsList, TabsTrigger, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fmtDayMonth, fmtFileSize, fmtNum } from "@/lib/format";
import { useDebouncedValue, useSearchParamState } from "@/lib/hooks";
import { useApiQuery } from "@/lib/query";
import { CardsSkeleton, ErrorState, MATERIAL_META, MaterialRow } from "./components/common";
import type { MaterialItem, MaterialType, MaterialsResponse } from "./components/types";

const TYPES: MaterialType[] = ["PDF", "AUDIO", "VIDEO", "DOC", "IMAGE", "LINK"];

export default function StudentMaterialsPage() {
  const [type, setType] = useSearchParamState("type");
  const [topicId, setTopicId] = useSearchParamState("topic");
  const [scope, setScope] = useSearchParamState("scope", "all");
  const [q, setQ] = useSearchParamState("q");
  const dq = useDebouncedValue(q, 300);
  const { data, isLoading, error, refetch, isFetching } = useApiQuery<MaterialsResponse>(["student", "materials"], "/student/materials", {
    params: { type: type || undefined, topicId: topicId || undefined, scope, q: dq || undefined },
    placeholderData: keepPreviousData,
  });
  const filtered = !!(type || topicId || dq || scope !== "all");

  return (
    <>
      <PageHeader title="Oʻquv materiallari" subtitle="Dars slaydlari, audio, qoʻllanmalar va umumiy kutubxona — mavzular boʻyicha" />

      <Card className="mb-6 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput value={q} onValueChange={setQ} placeholder="Material nomi boʻyicha qidirish…" className="lg:max-w-sm" />
          <Select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value || null)}
            placeholder="Barcha mavzular"
            options={(data?.topics ?? []).map((t) => ({ value: t.id, label: `${t.label} (${t.count})` }))}
            wrapperClassName="lg:max-w-xs"
            aria-label="Mavzu"
          />
          <Tabs value={scope} onValueChange={setScope} variant="segmented" className="lg:ml-auto">
            <TabsList>
              <TabsTrigger value="all">Hammasi</TabsTrigger>
              <TabsTrigger value="group">Guruhim</TabsTrigger>
              <TabsTrigger value="library">Kutubxona</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="scrollbar-none -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-0.5" role="group" aria-label="Material turi">
          <TypeChip active={!type} onClick={() => setType(null)} label="Barchasi" count={data ? Object.values(data.counts).reduce((a, b) => a + (b ?? 0), 0) : undefined} />
          {TYPES.filter((t) => data?.counts[t]).map((t) => (
            <TypeChip key={t} active={type === t} onClick={() => setType(type === t ? null : t)} label={MATERIAL_META[t].label} icon={MATERIAL_META[t].icon} count={data?.counts[t]} />
          ))}
        </div>
      </Card>

      {isLoading ? (
        <CardsSkeleton rows={3} />
      ) : error || !data ? (
        <Card>
          <ErrorState error={error} onRetry={() => void refetch()} />
        </Card>
      ) : data.sections.length === 0 ? (
        <Card>
          <EmptyState
            icon={filtered ? "search_off" : "folder_open"}
            title={filtered ? "Hech narsa topilmadi" : "Hozircha material yoʻq"}
            description={filtered ? "Filtrlarni oʻzgartirib koʻring." : "Ustoz dars materiallarini qoʻshganda shu yerda koʻrinadi."}
            action={
              filtered ? (
                <Button
                  variant="outline"
                  icon="filter_alt_off"
                  onClick={() => {
                    setType(null);
                    setTopicId(null);
                    setScope(null);
                    setQ(null);
                  }}
                >
                  Filtrlarni tozalash
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className={cn("flex flex-col gap-6", isFetching && "opacity-70 transition-opacity")}>
          {data.sections.map((s) => (
            <Card key={s.topic?.id ?? "general"}>
              <CardHeader
                title={s.topic?.label ?? "Umumiy materiallar"}
                icon={s.topic ? "menu_book" : "library_books"}
                description={s.topic?.level ?? "Mavzuga bogʻlanmagan qoʻllanmalar"}
                action={<Badge tone="primary">{fmtNum(s.items.length)} ta</Badge>}
              />
              <CardContent className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
                {s.items.map((m) => (
                  <MaterialRow key={m.id} m={m} meta={metaLine(m)} extra={<SourceChip m={m} />} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function metaLine(m: MaterialItem) {
  return [MATERIAL_META[m.type].label, m.file ? fmtFileSize(m.file.size) : null, m.lesson ? `${fmtDayMonth(m.lesson.startsAt)} darsi` : fmtDayMonth(m.createdAt)]
    .filter(Boolean)
    .join(" · ");
}

function SourceChip({ m }: { m: MaterialItem }) {
  return m.source === "library" ? (
    <Badge tone="neutral" icon="local_library">
      Kutubxona
    </Badge>
  ) : (
    <Badge tone="primary" shape="square">
      {m.group?.name ?? "Guruh"}
    </Badge>
  );
}

function TypeChip({ active, onClick, label, icon, count }: { active: boolean; onClick: () => void; label: string; icon?: string; count?: number }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 font-label-md text-label-md transition-colors",
        active ? "border-primary bg-primary text-on-primary" : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary",
      )}
    >
      {icon ? <span className="icon text-[16px]">{icon}</span> : null}
      {label}
      {count != null ? <span className={cn("tabular-nums", active ? "text-on-primary/80" : "text-on-surface-muted")}>{count}</span> : null}
    </button>
  );
}
