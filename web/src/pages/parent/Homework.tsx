// /ota-ona/vazifalar — farzandning uyga vazifalari (faqat ko'rish; bajarish o'quvchi kabinetida).
import { Link, useSearchParams } from "react-router-dom";
import { Badge, Card, CardContent, EmptyState, Icon, PageHeader, StatCard, Tabs, TabsList, TabsTrigger } from "@/components/ui";
import { iconTileTone } from "@/components/ui";
import { downloadFile } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtDate, fmtDayMonth, fmtFileSize, fmtNum, fmtRelDateTime, fmtTime, gradeLabel, gradeTone, relDayWord } from "@/lib/format";
import { toastError } from "@/lib/query";
import { dueLeft, ErrorCard, fileKind, HW_META, HW_TYPE_LABEL, MATERIAL_ICON, NoChild, PageSkeleton, PARENT_BASE, useChildQuery } from "./p/shared";
import type { FileInfo, HomeworkData, HomeworkItem, HwState } from "./p/types";

const TABS: { value: HwState | "all"; label: string }[] = [
  { value: "all", label: "Barchasi" },
  { value: "open", label: "Bajarilishi kerak" },
  { value: "submitted", label: "Tekshirilmoqda" },
  { value: "reviewed", label: "Tekshirildi" },
  { value: "returned", label: "Qaytarildi" },
  { value: "missed", label: "Topshirilmadi" },
];

const TYPE_ICON: Record<string, string> = { TEXT: "edit_note", AUDIO: "mic", FILE: "attach_file", QUIZ: "quiz" };

export default function ParentHomework() {
  const [sp, setSp] = useSearchParams();
  const tab = TABS.some((t) => t.value === sp.get("t")) ? (sp.get("t") as HwState | "all") : "all";
  const { data, isLoading, error, refetch, child, isPlaceholderData } = useChildQuery<HomeworkData>(["homework"], "/parent/homework", { status: tab }, { keepPrevious: true });

  if (!child) return <NoChild />;
  if (isLoading) return <PageSkeleton cards={4} blocks={1} />;
  if (error || !data) return <ErrorCard error={error} onRetry={() => void refetch()} />;

  const setTab = (v: string) => {
    const next = new URLSearchParams(sp);
    if (v === "all") next.delete("t");
    else next.set("t", v);
    setSp(next, { replace: true });
  };
  const firstName = data.child.fullName.split(" ")[0];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Bosh sahifa", to: PARENT_BASE }, { label: "Uyga vazifalar" }]}
        title="Uyga vazifalar"
        subtitle={`${firstName} vazifalarni oʻz kabinetida bajaradi — bu yerda holati, muddati va ustoz bahosini kuzatasiz`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Bajarilgan"
          icon="task_alt"
          iconTone="success"
          value={
            <span>
              {fmtNum(data.summary.done)}
              <span className="text-headline-md text-on-surface-muted">/{fmtNum(data.summary.total)}</span>
            </span>
          }
          progress={data.summary.percent ?? 0}
          progressTone="success"
          sub={data.summary.percent != null ? `${data.summary.percent}% vazifa topshirilgan` : "Hali vazifa berilmagan"}
        />
        <StatCard label="Oʻz vaqtida" icon="schedule" value={fmtNum(data.summary.onTime)} unit="ta" sub="muddatidan oldin topshirilgan" />
        <StatCard
          label="Bajarilishi kerak"
          icon="pending_actions"
          iconTone="gold"
          value={fmtNum(data.counts.open + data.counts.returned)}
          unit="ta"
          sub={data.counts.returned ? `${data.counts.returned} tasi qayta ishlashga qaytarilgan` : "ochiq vazifalar"}
        />
        <StatCard label="Topshirilmagan" icon="event_busy" iconTone="danger" value={fmtNum(data.counts.missed)} unit="ta" sub="muddati oʻtib ketgan" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} count={data.counts[t.value]}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className={cn("space-y-4 transition-opacity", isPlaceholderData && "opacity-60")}>
        {data.items.length === 0 ? (
          <Card>
            <EmptyState
              icon="assignment"
              title={tab === "all" ? "Hali uyga vazifa berilmagan" : "Bu boʻlimda vazifa yoʻq"}
              description={tab === "open" ? `${firstName}da hozircha bajarilishi kerak boʻlgan vazifa yoʻq.` : undefined}
            />
          </Card>
        ) : (
          data.items.map((h) => <HomeworkCard key={h.id} h={h} now={data.now} />)
        )}
      </div>
    </div>
  );
}

function HomeworkCard({ h, now }: { h: HomeworkItem; now: string }) {
  const m = HW_META[h.state];
  const s = h.submission;
  const left = h.state === "open" ? dueLeft(h.dueAt, now) : null;
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", iconTileTone[m.tone === "navy" ? "primary" : m.tone])}>
              <Icon name={TYPE_ICON[h.type] ?? "assignment"} size={22} />
            </span>
            <div className="min-w-0">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{h.title}</h3>
              <p className="text-body-sm text-on-surface-variant">
                {[h.group.name, h.topic ? `Unit ${h.topic.unit}` : null, HW_TYPE_LABEL[h.type], h.teacher?.fullName].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {left ? <Badge tone={left.urgent ? "danger" : "primary"} icon="timer">{left.text}</Badge> : null}
            <Badge tone={m.tone} icon={m.icon}>
              {m.label}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-body-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <Icon name="event" size={16} className="text-outline" />
            Muddat: <b className="text-on-surface">{relDayWord(h.dueAt, now) ?? fmtDate(h.dueAt)}, {fmtTime(h.dueAt)}</b>
          </span>
          <span className="flex items-center gap-1">
            <Icon name="toll" size={16} className="text-tertiary" />
            Oʻz vaqtida topshirsa +{h.coinReward} tanga
          </span>
          {h.lesson ? (
            <Link to={`${PARENT_BASE}/darslar/${h.lesson.id}`} className="flex items-center gap-1 text-primary hover:underline">
              <Icon name="event_note" size={16} />
              {fmtDayMonth(h.lesson.startsAt)} darsi
            </Link>
          ) : null}
        </div>

        {h.description ? <p className="line-clamp-4 whitespace-pre-line text-body-md text-on-surface-variant">{h.description}</p> : null}
        {h.files.length ? <Files files={h.files} label="Vazifa fayllari" /> : null}

        {h.hasDraft && !s ? (
          <p className="flex items-center gap-1.5 rounded-lg bg-surface-container-low px-3 py-2 text-body-sm text-on-surface-variant">
            <Icon name="edit_note" size={18} className="text-outline" />
            Qoralama saqlangan, lekin hali topshirilmagan
          </p>
        ) : null}

        {s ? (
          <div className="space-y-2 rounded-xl bg-surface-container-low p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-body-sm text-on-surface-variant">
                {s.submittedAt ? (
                  <>
                    Topshirildi: <b className="text-on-surface">{fmtRelDateTime(s.submittedAt, now)}</b>
                    {s.isLate ? <span className="text-warning"> · kechikib</span> : null}
                  </>
                ) : (
                  "Topshirilgan"
                )}
              </span>
              {s.score != null ? (
                <span className="flex items-center gap-2">
                  <span className="font-headline-md text-headline-md tabular-nums text-on-surface">{s.score} / 5</span>
                  <Badge tone={gradeTone(s.score)}>{gradeLabel(s.score)}</Badge>
                </span>
              ) : null}
            </div>
            {s.feedback ? (
              <div className="flex gap-2 rounded-lg bg-surface-container-lowest p-3 text-body-md text-on-surface">
                <Icon name="rate_review" size={18} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <span className="italic">«{s.feedback}»</span>
                  {s.reviewer ? <span className="mt-0.5 block text-body-sm text-on-surface-muted">— {s.reviewer}{s.reviewedAt ? `, ${fmtRelDateTime(s.reviewedAt, now)}` : ""}</span> : null}
                </div>
              </div>
            ) : null}
            {s.coinsAwarded > 0 ? (
              <p className="flex items-center gap-1 text-body-sm text-on-surface-variant">
                <Icon name="toll" size={16} className="text-tertiary" /> +{s.coinsAwarded} kumush tanga berildi
              </p>
            ) : null}
            {s.files.length ? <Files files={s.files} label={`Topshirilgan fayllar`} /> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Files({ files, label }: { files: FileInfo[]; label: string }) {
  return (
    <div>
      <p className="mb-1.5 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {files.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => downloadFile(f.id, f.originalName).catch((e) => toastError(e))}
            className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 py-1.5 text-body-sm text-on-surface hover:border-primary hover:text-primary"
          >
            <Icon name={MATERIAL_ICON[fileKind(f.mime)].icon} size={16} />
            <span className="truncate">{f.originalName}</span>
            <span className="shrink-0 text-on-surface-muted">{fmtFileSize(f.size)}</span>
            <Icon name="download" size={16} className="shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
