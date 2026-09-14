// Guruh tafsiloti (o'ng panel): umumiy, o'quvchilar, darslar, tarix.
import { useState } from "react";
import {
  Alert, Avatar, Badge, Button, ConfirmDialog, EmptyState, Icon, IconButton, ProgressBar, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui";
import { api } from "@/lib/api";
import { fmtDate, fmtDateShort, fmtMoney, fmtNum, fmtPercent, fmtPhone, fmtRelDateTime, fmtTime, fmtTimeRange } from "@/lib/format";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { AddStudentsDialog } from "./GroupDialogs";
import { ENROLLMENT_STATUS, GroupStatusBadge, InfoItem, keys, LESSON_STATUS, Sheet } from "./shared";
import type { GroupDetail } from "./types";

export function GroupDrawer({
  groupId,
  onClose,
  onEdit,
  onAssignTeacher,
  onAssignRoom,
  onFinish,
}: {
  groupId: string | null;
  onClose: () => void;
  onEdit: (g: GroupDetail) => void;
  onAssignTeacher: (g: GroupDetail) => void;
  onAssignRoom: (g: GroupDetail) => void;
  onFinish: (g: GroupDetail) => void;
}) {
  const q = useApiQuery<GroupDetail>(["admin", "groups", "detail", groupId], groupId ? `/admin/groups/${groupId}` : null);
  const g = q.data;
  const [tab, setTab] = useState("info");
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [showLeft, setShowLeft] = useState(false);
  const remove = useApiMutation((studentId: string) => api.delete(`/admin/students/${studentId}/enrollments/${groupId}`), {
    invalidate: [...keys("groups"), ["admin", "students"]],
    success: "Oʻquvchi guruhdan chiqarildi",
  });

  const current = g?.students.filter((s) => s.enrollmentStatus !== "LEFT") ?? [];
  const left = g?.students.filter((s) => s.enrollmentStatus === "LEFT") ?? [];

  return (
    <Sheet
      open={!!groupId}
      onOpenChange={(o) => !o && onClose()}
      title={
        g ? (
          <span className="flex flex-wrap items-center gap-2">
            {g.name}
            <GroupStatusBadge status={g.status} />
          </span>
        ) : (
          "Guruh"
        )
      }
      description={g ? `${g.code}${g.level?.label ? ` · ${g.level.label}` : ""}` : undefined}
      bodyClassName="px-4 sm:px-6"
      footer={
        g ? (
          <>
            {g.status !== "FINISHED" ? (
              <Button variant="ghost" icon="archive" className="mr-auto text-error" onClick={() => onFinish(g)}>
                Yakunlash
              </Button>
            ) : null}
            <Button variant="outline" icon="edit" onClick={() => onEdit(g)}>
              Tahrirlash
            </Button>
          </>
        ) : null
      }
    >
      {q.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : q.error ? (
        <Alert tone="danger" title="Guruh yuklanmadi">
          {q.error.message}
        </Alert>
      ) : g ? (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="info">Umumiy</TabsTrigger>
            <TabsTrigger value="students" count={current.length}>
              Oʻquvchilar
            </TabsTrigger>
            <TabsTrigger value="lessons">Darslar</TabsTrigger>
            <TabsTrigger value="history">Tarix</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="flex flex-col gap-4">
            {g.teacher ? (
              <div className="flex items-center gap-3 rounded-xl border border-outline-variant p-3">
                <Avatar name={g.teacher.fullName} src={g.teacher.avatarUrl} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="text-body-sm text-on-surface-variant">Masʼul ustoz</div>
                  <div className="truncate font-label-lg text-label-lg text-on-surface">{g.teacher.fullName}</div>
                  <div className="truncate text-body-sm text-tertiary">{g.teacher.specialization ?? g.teacher.title}</div>
                </div>
                {g.status !== "FINISHED" ? (
                  <Button size="sm" variant="secondary" onClick={() => onAssignTeacher(g)}>
                    Almashtirish
                  </Button>
                ) : null}
              </div>
            ) : (
              <Alert
                tone="danger"
                icon="person_off"
                title="Ustoz biriktirilmagan"
                action={
                  g.status !== "FINISHED" ? (
                    <Button size="sm" variant="navy" icon="person_add" onClick={() => onAssignTeacher(g)}>
                      Ustoz biriktirish
                    </Button>
                  ) : null
                }
              >
                {g.nextLesson ? `Keyingi dars: ${fmtRelDateTime(g.nextLesson.startsAt)}` : "Guruhga masʼul ustozni tanlang"}
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <InfoItem
                icon="meeting_room"
                label="Xona"
                action={
                  g.status !== "FINISHED" ? (
                    <IconButton icon="edit" label="Xonani oʻzgartirish" size="sm" onClick={() => onAssignRoom(g)} />
                  ) : null
                }
              >
                {g.room ? (
                  <>
                    {g.room.name}
                    <span className="block text-body-sm font-normal text-on-surface-variant">
                      {[g.room.location, `${g.room.capacity} oʻrin`].filter(Boolean).join(" · ")}
                    </span>
                  </>
                ) : (
                  <span className="text-warning">Biriktirilmagan</span>
                )}
              </InfoItem>
              <InfoItem icon="schedule" label="Jadval">
                {g.scheduleText}
                <span className="block text-body-sm font-normal text-on-surface-variant">haftasiga {fmtNum(g.weeklyHours)} soat</span>
              </InfoItem>
              <InfoItem icon="groups" label="Oʻquvchilar">
                <span className="tabular-nums">
                  {g.studentsCount} / {g.capacity}
                </span>
                {g.waitingCount ? <span className="block text-body-sm font-normal text-tertiary">{g.waitingCount} nafar kutish roʻyxatida</span> : null}
              </InfoItem>
              <InfoItem icon="payments" label="Oylik toʻlov">
                {fmtMoney(g.monthlyFee)}
              </InfoItem>
              <InfoItem icon="event" label="Muddati">
                {fmtDate(g.startDate)}
                <span className="block text-body-sm font-normal text-on-surface-variant">
                  {g.endDate ? `${fmtDate(g.endDate)} gacha` : "tugash sanasi hisoblanmoqda"}
                </span>
              </InfoItem>
              <InfoItem icon="event_upcoming" label="Keyingi dars">
                {g.nextLesson ? fmtRelDateTime(g.nextLesson.startsAt) : "—"}
                {g.nextLesson?.number ? <span className="block text-body-sm font-normal text-on-surface-variant">{g.nextLesson.number}-dars</span> : null}
              </InfoItem>
            </div>

            <div className="rounded-xl bg-surface-container-low p-4">
              <ProgressBar
                value={g.progress.percent}
                label={`Oʻquv dasturi: ${g.progress.done} / ${g.progress.total} dars oʻtildi`}
                showValue
              />
              <div className="mt-3 grid grid-cols-2 gap-3 text-body-sm">
                <div>
                  <div className="text-on-surface-variant">Davomat (joriy oy)</div>
                  <div className="font-label-lg text-label-lg tabular-nums">{fmtPercent(g.attendance.monthPct)}</div>
                </div>
                <div>
                  <div className="text-on-surface-variant">Davomat (umumiy)</div>
                  <div className="font-label-lg text-label-lg tabular-nums">{fmtPercent(g.attendance.overallPct)}</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="students" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-body-sm text-on-surface-variant">
                {g.studentsCount} faol{g.waitingCount ? ` · ${g.waitingCount} kutmoqda` : ""} · sigʻim {g.capacity}
              </span>
              {g.status !== "FINISHED" ? (
                <Button size="sm" icon="person_add" onClick={() => setAddOpen(true)}>
                  Oʻquvchi qoʻshish
                </Button>
              ) : null}
            </div>
            {current.length === 0 ? (
              <EmptyState compact icon="group_add" title="Guruhda oʻquvchi yoʻq" description="“Oʻquvchi qoʻshish” orqali roʻyxatni toʻldiring" />
            ) : (
              <ul className="divide-y divide-outline-variant/70 rounded-xl border border-outline-variant">
                {current.map((s) => (
                  <li key={s.id} className="flex items-start gap-3 p-3">
                    <Avatar name={s.fullName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate font-label-lg text-label-lg text-on-surface">{s.fullName}</span>
                        <Badge tone={ENROLLMENT_STATUS[s.enrollmentStatus].tone}>{ENROLLMENT_STATUS[s.enrollmentStatus].label}</Badge>
                      </div>
                      <div className="text-body-sm text-on-surface-variant">
                        {s.code ? `#${s.code}` : ""} · {fmtDateShort(s.joinedAt)} dan
                        {s.attendancePct != null ? ` · davomat ${fmtPercent(s.attendancePct)}` : ""}
                      </div>
                      {s.parents.length ? (
                        <div className="mt-0.5 flex flex-wrap gap-x-3 text-body-sm text-on-surface-variant">
                          {s.parents.map((p) => (
                            <span key={p.id} className="inline-flex items-center gap-1">
                              <Icon name="family_restroom" size={14} />
                              {p.fullName} ({p.relation}) {fmtPhone(p.phone)}
                              {p.telegramLinked ? <Icon name="send" size={14} className="text-primary" aria-label="Telegram ulangan" /> : null}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    {g.status !== "FINISHED" ? (
                      <IconButton icon="person_remove" label="Guruhdan chiqarish" size="sm" onClick={() => setRemoveTarget({ id: s.id, name: s.fullName })} />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {left.length ? (
              <div>
                <Button variant="link" size="sm" iconRight={showLeft ? "expand_less" : "expand_more"} onClick={() => setShowLeft((v) => !v)}>
                  Chiqqanlar ({left.length})
                </Button>
                {showLeft ? (
                  <ul className="mt-2 flex flex-col gap-1 text-body-sm text-on-surface-variant">
                    {left.map((s) => (
                      <li key={s.id}>
                        {s.fullName} {s.code ? `#${s.code}` : ""} · {s.leftAt ? `${fmtDateShort(s.leftAt)} da chiqqan` : "chiqqan"}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="lessons" className="flex flex-col gap-4">
            <section>
              <h3 className="mb-2 font-headline-sm text-headline-sm">Yaqin darslar</h3>
              {g.upcoming.length === 0 ? (
                <p className="text-body-sm text-on-surface-muted">Rejalashtirilgan dars yoʻq</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {g.upcoming.map((l) => (
                    <li key={l.id} className="flex items-center gap-3 rounded-lg bg-surface-container-low p-2.5">
                      <div className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-container-lowest">
                        <span className="font-label-lg text-label-lg tabular-nums">{fmtTime(l.startsAt)}</span>
                        <span className="text-[10px] text-on-surface-muted">{l.number ? `${l.number}-dars` : ""}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-label-md text-label-md">{fmtRelDateTime(l.startsAt).split(",")[0]}</div>
                        <div className="truncate text-body-sm text-on-surface-variant">
                          {fmtTimeRange(l.startsAt, l.endsAt)}
                          {l.room ? ` · ${l.room}` : ""}
                          {l.title ? ` · ${l.title}` : ""}
                        </div>
                      </div>
                      <Badge tone={LESSON_STATUS[l.status].tone}>{LESSON_STATUS[l.status].label}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h3 className="mb-2 font-headline-sm text-headline-sm">Oxirgi oʻtilgan darslar</h3>
              {g.recent.length === 0 ? (
                <p className="text-body-sm text-on-surface-muted">Hali dars oʻtilmagan</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {g.recent.map((l) => (
                    <li key={l.id} className="rounded-lg border border-outline-variant p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-label-md text-label-md">
                          {fmtDate(l.startsAt)}
                          {l.number ? ` · ${l.number}-dars` : ""}
                        </span>
                        <span className="text-body-sm tabular-nums text-on-surface-variant">
                          Keldi: {l.present}/{l.marked || g.studentsCount}
                        </span>
                      </div>
                      <div className="truncate text-body-sm text-on-surface-variant">{l.topics.join(", ") || l.title || "Mavzu belgilanmagan"}</div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </TabsContent>

          <TabsContent value="history">
            {g.history.length === 0 ? (
              <p className="text-body-sm text-on-surface-muted">Oʻzgarishlar tarixi boʻsh</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {g.history.map((h) => (
                  <li key={h.id} className="flex gap-3">
                    <span className="mt-0.5 h-fit shrink-0 rounded bg-surface-container px-1.5 py-0.5 font-label-sm text-label-sm tabular-nums">
                      {fmtDateShort(h.at)}
                    </span>
                    <div className="min-w-0 text-body-sm">
                      <div className="text-on-surface">{h.summary ?? h.action}</div>
                      <div className="text-on-surface-muted">
                        {h.actor ?? "Tizim"} · {fmtTime(h.at)}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>
        </Tabs>
      ) : null}

      <AddStudentsDialog
        group={addOpen && g ? g : null}
        existingIds={g?.students.filter((s) => s.enrollmentStatus !== "LEFT").map((s) => s.id) ?? []}
        onClose={() => setAddOpen(false)}
      />
      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title="Oʻquvchi guruhdan chiqarilsinmi?"
        description={`${removeTarget?.name ?? ""} ${g?.name ?? ""} guruhidan chiqariladi. Davomat va baholar tarixi saqlanib qoladi.`}
        confirmLabel="Chiqarish"
        onConfirm={async () => {
          if (removeTarget) await remove.mutateAsync(removeTarget.id);
        }}
      />
    </Sheet>
  );
}
