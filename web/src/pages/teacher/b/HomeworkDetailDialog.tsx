// Vazifa tafsilotlari: shart, fayllar, test savollari, guruh bo'yicha topshirish holati.
import { useState } from "react";
import { Avatar, Badge, Button, ConfirmDialog, Dialog, Icon, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtAvg, fmtRelDateTime, gradeLabel, gradeTone } from "@/lib/format";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { INV, TB } from "./api";
import type { HomeworkDetail, RosterRow } from "./types";
import { FileTile, GroupChip, QueryError, SegBar, TypeChip, dueInfo } from "./ui";

export interface HomeworkDetailDialogProps {
  id: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReview: (queue: string[], startId: string) => void;
  onEdit: (id: string) => void;
}

export function HomeworkDetailDialog({ id, open, onOpenChange, onReview, onEdit }: HomeworkDetailDialogProps) {
  const q = useApiQuery<HomeworkDetail>([TB, "homework-detail", id], id ? `/teacher/homework/${id}` : null, { enabled: open });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const h = q.data;

  const remind = useApiMutation(() => api.post<{ students: number; parents: number }>(`/teacher/homework/${id}/remind`, { parents: true }), {
    success: (d) => `${d.students} ta oʻquvchiga eslatma yuborildi${d.parents ? ` (${d.parents} ta ota-ona)` : ""}`,
  });
  const del = useApiMutation(() => api.delete(`/teacher/homework/${id}`), {
    invalidate: INV,
    success: "Vazifa oʻchirildi",
    onSuccess: () => onOpenChange(false),
  });

  const awaitingIds = (h?.roster ?? []).filter((r) => r.submission?.status === "SUBMITTED").map((r) => r.submission!.id);
  const canDelete = !!h && h.stats.submitted === 0 && h.stats.drafts === 0;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        size="xl"
        title={h?.title ?? "Vazifa"}
        description={h ? `${h.group.name} · ${dueInfo(h.dueAt).text}` : undefined}
        footer={
          h ? (
            <>
              {canDelete ? (
                <Button variant="ghost" icon="delete" className="mr-auto text-error hover:bg-error-container hover:text-error" onClick={() => setConfirmDelete(true)}>
                  Oʻchirish
                </Button>
              ) : null}
              {h.isOpen && h.stats.missing > 0 ? (
                <Button variant="outline" icon="notifications_active" loading={remind.isPending} onClick={() => remind.mutate()}>
                  Eslatma yuborish ({h.stats.missing})
                </Button>
              ) : null}
              <Button variant="outline" icon="edit" onClick={() => onEdit(h.id)}>
                Tahrirlash
              </Button>
              {awaitingIds.length ? (
                <Button icon="rate_review" onClick={() => onReview(awaitingIds, awaitingIds[0])}>
                  Tekshirish ({awaitingIds.length})
                </Button>
              ) : null}
            </>
          ) : null
        }
      >
        {q.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : q.error ? (
          <QueryError error={q.error} onRetry={() => q.refetch()} compact />
        ) : h ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <GroupChip group={h.group} />
              <TypeChip type={h.type} />
              {h.topic ? (
                <Badge tone="neutral" shape="square">
                  Unit {h.topic.unit} — {h.topic.title}
                </Badge>
              ) : null}
              {h.lesson ? (
                <Badge tone="neutral" shape="square" icon="event">
                  {h.lesson.number ? `${h.lesson.number}-dars` : "Dars"}
                  {h.lesson.title ? ` · ${h.lesson.title}` : ""}
                </Badge>
              ) : null}
            </div>
            {h.description ? <p className="whitespace-pre-wrap text-body-md text-on-surface-variant">{h.description}</p> : null}

            <div className="grid gap-3 sm:grid-cols-4">
              <MiniStat label="Topshirildi" value={`${h.stats.submitted}/${h.stats.students}`} />
              <MiniStat label="Kutmoqda" value={h.stats.awaiting} tone={h.stats.awaiting ? "text-error" : undefined} />
              <MiniStat label="Tekshirildi" value={h.stats.reviewed} />
              <MiniStat label="Oʻrtacha baho" value={h.stats.avgScore != null ? fmtAvg(h.stats.avgScore) : "—"} />
            </div>
            <SegBar
              total={Math.max(h.stats.students, h.stats.submitted)}
              segments={[
                { value: h.stats.reviewed, className: "bg-primary", title: "Tekshirilgan" },
                { value: h.stats.awaiting, className: "bg-gold", title: "Kutmoqda" },
                { value: h.stats.returned, className: "bg-warning", title: "Qaytarilgan" },
              ]}
            />

            {h.files.length ? (
              <section className="space-y-2">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Biriktirilgan fayllar ({h.files.length})</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {h.files.map((f) => (
                    <FileTile key={f.id} file={f} />
                  ))}
                </div>
              </section>
            ) : null}

            {h.type === "QUIZ" && h.content?.questions?.length ? (
              <section className="space-y-2">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Test savollari ({h.content.questions.length})</h3>
                <ol className="space-y-2">
                  {h.content.questions.map((qq, i) => (
                    <li key={qq.id} className="rounded-lg border border-outline-variant p-3">
                      <p className="text-body-md font-medium text-on-surface">
                        {i + 1}. {qq.text}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {qq.options.map((o, oi) => (
                          <span
                            key={oi}
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-body-sm",
                              oi === qq.answer ? "border-success/40 bg-success-container text-on-success-container" : "border-outline-variant text-on-surface-variant",
                            )}
                          >
                            {oi === qq.answer ? "✓ " : ""}
                            {o}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <section className="space-y-2">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Oʻquvchilar ({h.roster.length})</h3>
              <div className="overflow-x-auto rounded-xl border border-outline-variant">
                <table className="w-full min-w-[520px] text-left text-body-md">
                  <thead className="bg-surface-container-low font-label-md text-label-md uppercase tracking-wider text-on-surface-muted">
                    <tr>
                      <th className="px-4 py-2.5">Oʻquvchi</th>
                      <th className="px-4 py-2.5">Holat</th>
                      <th className="px-4 py-2.5">Topshirilgan</th>
                      <th className="px-4 py-2.5 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {h.roster.map((r) => (
                      <tr key={r.student.id}>
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-2.5">
                            <Avatar name={r.student.fullName} size="sm" />
                            <span className="font-medium text-on-surface">{r.student.fullName}</span>
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <RosterStatus r={r} />
                        </td>
                        <td className="px-4 py-2.5 text-on-surface-variant">
                          {r.submission?.submittedAt ? fmtRelDateTime(r.submission.submittedAt) : "—"}
                          {r.submission?.isLate ? <span className="ml-1.5 text-warning">· kechikkan</span> : null}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {r.submission ? (
                            <Button
                              size="sm"
                              variant={r.submission.status === "SUBMITTED" ? "primary" : "ghost"}
                              onClick={() =>
                                onReview(
                                  r.submission!.status === "SUBMITTED" ? awaitingIds : [r.submission!.id],
                                  r.submission!.id,
                                )
                              }
                            >
                              {r.submission.status === "SUBMITTED" ? "Tekshirish" : "Koʻrish"}
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}
      </Dialog>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Vazifa oʻchirilsinmi?"
        description="Vazifa va unga biriktirilgan fayllar butunlay oʻchiriladi."
        confirmLabel="Oʻchirish"
        onConfirm={() => del.mutateAsync()}
      />
    </>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low/60 p-3">
      <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">{label}</div>
      <div className={cn("mt-1 font-display text-[20px] font-bold tabular-nums text-on-surface", tone)}>{value}</div>
    </div>
  );
}

function RosterStatus({ r }: { r: RosterRow }) {
  const s = r.submission;
  if (!s) {
    return r.hasDraft ? (
      <Badge tone="neutral" icon="edit">
        Qoralama
      </Badge>
    ) : (
      <Badge tone="neutral">Topshirilmagan</Badge>
    );
  }
  if (s.status === "SUBMITTED") return <Badge tone="danger" dot>Tekshirish kutilmoqda</Badge>;
  if (s.status === "RETURNED") return <Badge tone="warning" icon="undo">Qaytarilgan</Badge>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge tone={gradeTone(s.score)}>
        {s.score} ({gradeLabel(s.score)})
      </Badge>
      {s.coinsAwarded ? (
        <span className="inline-flex items-center gap-0.5 text-body-sm font-semibold text-tertiary">
          <Icon name="toll" size={14} />+{s.coinsAwarded}
        </span>
      ) : null}
    </span>
  );
}
