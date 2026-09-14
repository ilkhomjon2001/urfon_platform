// Guruh ichidagi o'quvchi mini-profili (o'ng tomondan chiquvchi panel).
import { Link } from "react-router-dom";
import { Avatar, Badge, Dialog, EmptyState, Icon, Skeleton, buttonVariants, softTone, textTone } from "@/components/ui";
import { cn } from "@/lib/cn";
import { avgTone, fmtAvg, fmtDate, fmtDateShort, fmtPercent, fmtPhone, fmtTime, gradeTone } from "@/lib/format";
import { useApiQuery } from "@/lib/query";
import { GradePopover } from "./GradePopover";
import { ATT, SKILL_LABEL, messageLink, pctTone, qk } from "./shared";
import type { StudentProfileResponse } from "./types";

const KIND_LABEL: Record<string, string> = {
  HOMEWORK: "Uyga vazifa",
  CLASSWORK: "Darsdagi javob",
  TEST: "Test",
  SPEAKING: "Speaking",
  WRITING: "Writing",
  MOCK: "Mock",
};

export function StudentDrawer({ groupId, studentId, onClose }: { groupId: string; studentId: string; onClose: () => void }) {
  const q = useApiQuery<StudentProfileResponse>(
    qk.student(groupId, studentId || "-"),
    studentId ? `/teacher/groups/${groupId}/students/${studentId}` : null,
  );
  const d = q.data;
  return (
    <Dialog
      open={!!studentId}
      onOpenChange={(o) => !o && onClose()}
      title={d?.student.fullName ?? "Oʻquvchi"}
      description={d ? [d.student.code ? `#${d.student.code}` : null, d.student.goal ? `Maqsad: ${d.student.goal}` : null].filter(Boolean).join(" · ") || undefined : undefined}
      className="left-auto right-0 top-0 h-dvh max-h-dvh w-full max-w-md translate-x-0 translate-y-0 rounded-none data-[state=open]:animate-fade-in sm:rounded-l-2xl"
      bodyClassName="flex flex-col gap-5"
    >
      {q.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : q.error || !d ? (
        <EmptyState compact icon="error" title="Maʼlumotni yuklab boʻlmadi" description={q.error?.message} />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Avatar name={d.student.fullName} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap gap-1.5">
                {d.student.enrollmentStatus === "WAITING" ? <Badge tone="warning">Guruh boshlanishini kutmoqda</Badge> : <Badge tone="success" dot>Faol</Badge>}
                {d.student.enrolledAt ? <Badge>{fmtDate(d.student.enrolledAt)} dan oʻqiydi</Badge> : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Davomat" value={fmtPercent(d.stats.attendance.pct)} sub={`${d.stats.attendance.attended}/${d.stats.attendance.total} dars`} cls={textTone[pctTone(d.stats.attendance.pct)]} />
            <Stat label="Oʻrtacha baho" value={fmtAvg(d.stats.averageGrade)} sub={d.stats.averageGradeLabel ?? "—"} cls={textTone[avgTone(d.stats.averageGrade)]} />
            <Stat label="Uyga vazifa" value={`${d.stats.homework.done}/${d.stats.homework.total}`} sub="topshirilgan" />
          </div>

          <section>
            <h3 className="mb-2 font-label-md text-label-md uppercase tracking-wider text-on-surface-muted">Ota-onalar</h3>
            {d.parents.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">Ota-ona biriktirilmagan.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {d.parents.map((p) => (
                  <div key={p.id} className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="font-label-lg text-label-lg text-on-surface">
                        {p.fullName} <span className="font-normal text-on-surface-variant">· {p.relation}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant">
                        <span className="tabular-nums">{fmtPhone(p.phone)}</span>
                        {p.telegramLinked ? (
                          <Badge tone="success" icon="send">
                            Telegram ulangan
                          </Badge>
                        ) : (
                          <Badge icon="link_off">Telegram ulanmagan</Badge>
                        )}
                      </div>
                    </div>
                    <Link to={messageLink(p.id, d.student.id)} className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0" })}>
                      <Icon name="chat" size={16} />
                      Ota-onaga yozish
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-2 font-label-md text-label-md uppercase tracking-wider text-on-surface-muted">Soʻnggi baholar</h3>
            {d.recentGrades.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">Hali baho qoʻyilmagan.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-outline-variant/70 rounded-xl border border-outline-variant/70">
                {d.recentGrades.map((g) => (
                  <li key={g.id} className="flex items-center gap-3 px-3 py-2.5">
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-headline-sm text-headline-sm tabular-nums", softTone[gradeTone(g.value)])}>
                      {fmtAvg(g.value).replace(/\.0$/, "")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-body-md text-on-surface">{g.title ?? KIND_LABEL[g.kind]}</div>
                      <div className="truncate text-body-sm text-on-surface-muted">
                        {KIND_LABEL[g.kind]}
                        {g.skill ? ` · ${SKILL_LABEL[g.skill]}` : ""} · {fmtDateShort(g.gradedAt)}
                      </div>
                    </div>
                    <GradePopover
                      mode="edit"
                      grade={g}
                      studentName={d.student.fullName}
                      trigger={
                        <button type="button" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-primary" aria-label="Bahoni oʻzgartirish" title="Bahoni oʻzgartirish">
                          <Icon name="edit" size={18} />
                        </button>
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 font-label-md text-label-md uppercase tracking-wider text-on-surface-muted">Soʻnggi davomat</h3>
            {d.recentAttendance.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">Hali dars oʻtilmagan.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {d.recentAttendance.map((a) => (
                  <li key={a.lessonId}>
                    <Link to={`/ustoz/darslar/${a.lessonId}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-container-low">
                      <div className="min-w-0">
                        <div className="truncate text-body-md text-on-surface">{a.title ?? "Dars"}</div>
                        <div className="text-body-sm text-on-surface-muted">
                          {fmtDateShort(a.startsAt)}
                          {a.arrivedAt ? ` · keldi ${fmtTime(a.arrivedAt)}` : ""}
                        </div>
                      </div>
                      {a.status ? (
                        <Badge tone={ATT[a.status].tone} icon={ATT[a.status].icon}>
                          {ATT[a.status].label}
                        </Badge>
                      ) : (
                        <Badge>Belgilanmagan</Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </Dialog>
  );
}

function Stat({ label, value, sub, cls }: { label: string; value: string; sub: string; cls?: string }) {
  return (
    <div className="rounded-xl bg-surface-container-low px-2 py-3 text-center">
      <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">{label}</div>
      <div className={cn("mt-1 font-headline-md text-headline-md tabular-nums text-on-surface", cls)}>{value}</div>
      <div className="text-body-sm text-on-surface-variant">{sub}</div>
    </div>
  );
}
