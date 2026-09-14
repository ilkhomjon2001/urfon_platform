import { keepPreviousData } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Badge, Card, EmptyState, Icon, PageHeader, Tabs, TabsContent, TabsList, TabsTrigger, buttonVariants } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fmtRelDateTime, gradeTone } from "@/lib/format";
import { useSearchParamState } from "@/lib/hooks";
import { useApiQuery } from "@/lib/query";
import { CardsSkeleton, CoinChip, ErrorState, HW_TYPE_ICON, HwStateBadge, dueText, leftText, useNow } from "./components/common";
import type { HomeworkList, HomeworkListItem } from "./components/types";

const TABS = ["open", "done", "all"] as const;

export default function StudentHomeworkPage() {
  const [tabRaw, setTab] = useSearchParamState("t", "open");
  const tab = (TABS as readonly string[]).includes(tabRaw) ? tabRaw : "open";
  const { data, isLoading, error, refetch, isFetching } = useApiQuery<HomeworkList>(["student", "homework", "list"], "/student/homework", {
    params: { status: tab },
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Uyga vazifalar"
        subtitle={
          data
            ? `Vazifani oʻz vaqtida topshirsangiz, ustoz tekshirgach +${data.coinReward} tanga olasiz.`
            : "Bajariladigan va topshirilgan vazifalar"
        }
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="open" icon="pending_actions" count={data?.counts.open}>
            Bajariladigan
          </TabsTrigger>
          <TabsTrigger value="done" icon="task_alt" count={data?.counts.done}>
            Topshirilgan
          </TabsTrigger>
          <TabsTrigger value="all" icon="list" count={data?.counts.all}>
            Barchasi
          </TabsTrigger>
        </TabsList>
        {TABS.map((t) => (
          <TabsContent key={t} value={t} className={cn("mt-5", isFetching && !isLoading && "opacity-70 transition-opacity")}>
            {isLoading ? (
              <CardsSkeleton rows={3} />
            ) : error || !data ? (
              <Card>
                <ErrorState error={error} onRetry={() => void refetch()} />
              </Card>
            ) : data.items.length === 0 ? (
              <Card>
                <EmptyState
                  icon={t === "open" ? "celebration" : "assignment"}
                  title={t === "open" ? "Hozircha bajariladigan vazifa yoʻq" : t === "done" ? "Hali topshirilgan vazifa yoʻq" : "Vazifalar yoʻq"}
                  description={t === "open" ? "Barakalla! Yangi vazifa berilganda shu yerda koʻrinadi." : "Topshirgan vazifalaringiz va ustoz bahosi shu yerda koʻrinadi."}
                  action={
                    t !== "open" && data.counts.open ? (
                      <Link to="/oquvchi/vazifalar" className={buttonVariants({ variant: "outline" })}>
                        Bajariladigan vazifalar
                      </Link>
                    ) : undefined
                  }
                />
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {data.items.map((h) => (
                  <HomeworkItem key={h.id} h={h} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}

function HomeworkItem({ h }: { h: HomeworkListItem }) {
  const now = useNow();
  const left = h.open ? leftText(h.dueAt, now) : null;
  const urgent = h.open && !h.overdue && new Date(h.dueAt).getTime() - now < 24 * 3600_000;
  const s = h.submission;
  return (
    <Link
      to={`/oquvchi/vazifalar/${h.id}`}
      className="group block rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-4 shadow-card transition-shadow hover:shadow-float focus-visible:ring-2 focus-visible:ring-primary/40 sm:p-5"
    >
      <div className="flex gap-3 sm:gap-4">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12", h.open ? "bg-primary-fixed text-primary" : "bg-surface-container text-on-surface-variant")}>
          <Icon name={HW_TYPE_ICON[h.type]} size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <HwStateBadge state={h.state} overdue={h.overdue} />
            <Badge tone="navy" shape="square">
              {h.group.name}
            </Badge>
            {h.topic ? (
              <Badge tone="primary" shape="square">
                Unit {h.topic.unit}
              </Badge>
            ) : null}
            <span className="text-body-sm text-on-surface-muted">{h.typeLabel}</span>
          </div>
          <h3 className="mt-2 font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-primary">{h.title}</h3>
          {h.description ? <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">{h.description}</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-body-sm">
            {h.open ? (
              <>
                <span className={cn("inline-flex items-center gap-1", h.overdue ? "text-error" : urgent ? "text-warning" : "text-on-surface-variant")}>
                  <Icon name="alarm" size={16} />
                  {h.overdue ? `Muddat oʻtgan: ${dueText(h.dueAt).replace(" gacha", "")}` : dueText(h.dueAt)}
                  {left ? ` · ${left}` : ""}
                </span>
                {!h.overdue ? (
                  <span className="inline-flex items-center gap-1.5 text-on-surface-muted">
                    <CoinChip amount={h.coinReward} />
                    oʻz vaqtida topshirilsa
                  </span>
                ) : null}
                {s && (s.fileCount || s.hasText) ? (
                  <span className="inline-flex items-center gap-1 text-on-surface-muted">
                    <Icon name="save" size={16} />
                    Qoralama: {s.fileCount ? `${s.fileCount} ta fayl` : ""}
                    {s.fileCount && s.hasText ? ", " : ""}
                    {s.hasText ? "matn" : ""}
                  </span>
                ) : null}
              </>
            ) : null}
            {s?.status === "SUBMITTED" && s.submittedAt ? (
              <span className="inline-flex items-center gap-1 text-on-surface-variant">
                <Icon name="send" size={16} />
                Topshirildi: {fmtRelDateTime(s.submittedAt)}
                {s.isLate ? " · muddatidan keyin" : ""}
              </span>
            ) : null}
            {s?.status === "REVIEWED" ? (
              <>
                {s.score != null ? (
                  <Badge tone={gradeTone(s.score)} size="md">
                    {s.score} · {s.scoreLabel}
                  </Badge>
                ) : null}
                {s.coinsAwarded > 0 ? <CoinChip amount={s.coinsAwarded} /> : null}
                {s.feedback ? <span className="line-clamp-1 min-w-0 italic text-on-surface-variant">«{s.feedback}»</span> : null}
              </>
            ) : null}
          </div>
        </div>
        <Icon name="chevron_right" className="hidden self-center text-outline transition-colors group-hover:text-primary sm:block" />
      </div>
    </Link>
  );
}
