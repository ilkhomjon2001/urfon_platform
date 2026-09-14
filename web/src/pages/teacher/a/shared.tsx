// teacher-a sahifalari uchun umumiy kichik komponentlar va yordamchilar.
import { useEffect, useState, type ReactNode } from "react";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import { MONTHS } from "@/lib/format";
import type { Tone } from "@/lib/types";
import type { AttStatus, GroupStatus, LessonStatus, LevelDto, Skill, TopicLite } from "./types";

export const qk = {
  dashboard: ["teacher", "a", "dashboard"] as const,
  groups: ["teacher", "a", "groups"] as const,
  group: (id: string) => ["teacher", "a", "group", id] as const,
  groupAll: ["teacher", "a", "group"] as const,
  student: (groupId: string, studentId: string) => ["teacher", "a", "group-student", groupId, studentId] as const,
  studentAll: ["teacher", "a", "group-student"] as const,
  lesson: (id: string) => ["teacher", "a", "lesson", id] as const,
  lessonAll: ["teacher", "a", "lesson"] as const,
  schedule: ["teacher", "a", "schedule"] as const,
  rooms: ["teacher", "a", "rooms"] as const,
};

/** Dars/baho o'zgarganda yangilanadigan barcha teacher-a ro'yxatlari. */
export const lessonSideKeys = [qk.dashboard, qk.groups, qk.groupAll, qk.studentAll, qk.schedule];
/** Baho o'zgarganda: dars sahifasi + guruh/o'quvchi profillari + dashboard. */
export const gradeKeys = [qk.lessonAll, qk.groupAll, qk.studentAll, qk.groups, qk.dashboard];

export const LESSON_STATUS: Record<LessonStatus, { label: string; tone: Tone; icon: string }> = {
  PLANNED: { label: "Rejada", tone: "neutral", icon: "schedule" },
  IN_PROGRESS: { label: "Jarayonda", tone: "warning", icon: "play_circle" },
  DONE: { label: "Oʻtildi", tone: "success", icon: "done_all" },
  CANCELLED: { label: "Bekor qilindi", tone: "danger", icon: "event_busy" },
};

export function LessonStatusBadge({ status, next, className }: { status: LessonStatus; next?: boolean; className?: string }) {
  if (next && status === "PLANNED") {
    return (
      <Badge tone="gold" dot className={className}>
        Navbatdagi
      </Badge>
    );
  }
  const s = LESSON_STATUS[status];
  return (
    <Badge tone={s.tone} icon={s.icon} className={className}>
      {s.label}
    </Badge>
  );
}

export const ATT: Record<AttStatus, { label: string; tone: Tone; icon: string }> = {
  PRESENT: { label: "Keldi", tone: "success", icon: "check_circle" },
  LATE: { label: "Kechikdi", tone: "warning", icon: "schedule" },
  EXCUSED: { label: "Sababli", tone: "primary", icon: "event_note" },
  ABSENT: { label: "Kelmadi", tone: "danger", icon: "cancel" },
};
export const ATT_ORDER: AttStatus[] = ["PRESENT", "LATE", "EXCUSED", "ABSENT"];

export const GROUP_STATUS: Record<GroupStatus, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Faol", tone: "success" },
  ENROLLING: { label: "Yangi qabul", tone: "warning" },
  FINISHED: { label: "Yakunlangan", tone: "neutral" },
};

export const SKILL_LABEL: Record<Skill, string> = {
  SPEAKING: "Speaking",
  LISTENING: "Listening",
  READING: "Reading",
  WRITING: "Writing",
  GRAMMAR: "Grammar",
  VOCABULARY: "Vocabulary",
};

/** Davomat foizi ohangi. */
export const pctTone = (p: number | null | undefined): Tone =>
  p == null ? "neutral" : p >= 90 ? "success" : p >= 75 ? "primary" : p >= 60 ? "warning" : "danger";

export const topicText = (t: TopicLite) => `Unit ${t.unit} — ${t.title}`;

export function lessonTitle(l: { title: string | null; topics?: TopicLite[] }) {
  if (l.title) return l.title;
  if (l.topics?.length) return topicText(l.topics[0]);
  return "Mavzu tanlanmagan";
}

/** "Level 2" / "Kids" */
export const levelShort = (l: LevelDto | null | undefined) => (l ? (/^L\d+$/.test(l.code) ? `Level ${l.order}` : l.name) : null);

/** "Ertalab" / "Kunduzi" / "Kechqurun" */
export function dayPart(hhmm: string) {
  const h = Number(hhmm.slice(0, 2));
  return h < 12 ? "Ertalab" : h < 16 ? "Kunduzi" : "Kechqurun";
}

/** Har daqiqada qayta chizish uchun "hozir". */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** "YYYY-MM-DD" ga n kun qo'shadi (sof kalendar hisob). */
export function addDaysYmd(ymd: string, n: number) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const ymdParts = (ymd: string) => ({ y: Number(ymd.slice(0, 4)), m: Number(ymd.slice(5, 7)) - 1, d: Number(ymd.slice(8, 10)) });

/** "14–20 sentabr, 2026" yoki "28-sentabr – 4-oktabr, 2026" */
export function fmtWeekRange(start: string, end: string) {
  const a = ymdParts(start);
  const b = ymdParts(end);
  if (a.m === b.m && a.y === b.y) return `${a.d}–${b.d} ${MONTHS[a.m]}, ${a.y}`;
  if (a.y === b.y) return `${a.d}-${MONTHS[a.m]} – ${b.d}-${MONTHS[b.m]}, ${b.y}`;
  return `${a.d}-${MONTHS[a.m]}, ${a.y} – ${b.d}-${MONTHS[b.m]}, ${b.y}`;
}

/** "14-sentabr" (YYYY-MM-DD dan) */
export const fmtYmdDayMonth = (ymd: string) => {
  const p = ymdParts(ymd);
  return `${p.d}-${MONTHS[p.m]}`;
};

/** Ota-onaga yozish (teacher-b Xabarlar sahifasi). */
export const messageLink = (toUserId: string, studentId?: string) =>
  `/ustoz/xabarlar?to=${encodeURIComponent(toUserId)}${studentId ? `&studentId=${encodeURIComponent(studentId)}` : ""}`;

/** Xato holati kartasi. */
export function ErrorCard({ error, onRetry, className }: { error: Error | null; onRetry?: () => void; className?: string }) {
  return (
    <Card className={className}>
      <EmptyState
        icon="error"
        title="Maʼlumotni yuklab boʻlmadi"
        description={error?.message ?? "Serverda xatolik yuz berdi"}
        action={
          onRetry ? (
            <Button variant="outline" icon="refresh" onClick={onRetry}>
              Qayta urinish
            </Button>
          ) : undefined
        }
      />
    </Card>
  );
}

/** Kartadagi kichik ko'rsatkich (O'QUVCHILAR 14/16 nafar). */
export function MiniStat({ label, value, sub, tone, className }: { label: ReactNode; value: ReactNode; sub?: ReactNode; tone?: Tone; className?: string }) {
  const toneCls: Record<Tone, string> = {
    neutral: "text-on-surface",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-error",
    gold: "text-tertiary",
    navy: "text-navy",
  };
  return (
    <div className={cn("flex min-w-0 flex-col items-center justify-center px-2 text-center", className)}>
      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">{label}</span>
      <span className={cn("mt-1 font-headline-md text-headline-md tabular-nums", toneCls[tone ?? "neutral"])}>
        {value}
        {sub ? <span className="ml-1 font-label-sm text-label-sm font-normal text-on-surface-muted">{sub}</span> : null}
      </span>
    </div>
  );
}
