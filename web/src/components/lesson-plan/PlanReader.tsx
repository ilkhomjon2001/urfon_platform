// Dars rejalarini oʻqish sahifasi: chapda bosqich va darslar roʻyxati, oʻngda bitta darsning toʻliq rejasi.
// Ustoz darsga tayyorlanayotganda yoki dars paytida ekranda ochib qoʻyadi — shuning uchun matn yirik,
// boʻlimlar raqamlangan, har bosqichning vaqti koʻrinib turadi. "Chop etish" A4 ga chiqaradi.
import { useEffect, useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Button, EmptyState, Field, Icon, Select, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useApiQuery } from "@/lib/query";
import type { LevelPlanResponse, PlanLesson, PlanUnitDto } from "@/lib/types";

export interface ReaderLevel {
  id: string;
  label: string;
  audience: string | null;
  cefr: string | null;
}

type Flat = { unit: PlanUnitDto; lesson: PlanLesson; part: number; parts: number; no: number };

const clock = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

/** "fans – muxlislar" → ["fans", "muxlislar"] */
function splitTerm(s: string): [string, string] {
  const m = s.match(/^(.+?)\s+[–—-]\s+(.+)$/);
  return m ? [m[1], m[2]] : [s, ""];
}

function Section({ n, title, aside, children }: { n: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-14 break-inside-avoid-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[14px] font-semibold text-primary">{n}</div>
          <h2 className="mt-1 font-display text-[24px] font-extrabold uppercase leading-8 tracking-tight text-on-surface sm:text-[28px] sm:leading-9">{title}</h2>
        </div>
        {aside}
      </div>
      <div className="mt-3 h-px bg-outline-variant" />
      <div className="mt-6">{children}</div>
    </section>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {items.map((s, i) => (
        <li key={i} className="grid grid-cols-[32px_minmax(0,1fr)] gap-2">
          <span className="font-display text-[17px] font-bold leading-7 text-primary tabular-nums">{i + 1}.</span>
          <span className="text-[17px] leading-7 text-on-surface">{s}</span>
        </li>
      ))}
    </ol>
  );
}

function Meta({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 bg-surface-container-lowest p-4 sm:p-5">
      <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-muted">{label}</dt>
      <dd className="text-[16px] font-semibold leading-6 text-on-surface">{value}</dd>
      {sub ? <dd className="text-[13px] leading-5 text-on-surface-variant">{sub}</dd> : null}
    </div>
  );
}

/** Bitta darsning toʻliq sahifasi. */
function LessonPage({ f, total, level, prev, next, go }: {
  f: Flat;
  total: number;
  level: LevelPlanResponse["level"];
  prev?: Flat;
  next?: Flat;
  go: (no: number) => void;
}) {
  const { unit: u, lesson: l } = f;
  const blocks = l.blocks ?? [];
  const minutes = blocks.reduce((s, b) => s + b.minutes, 0);
  let t = 0;
  const timed = blocks.map((b) => {
    const start = t;
    t += b.minutes;
    return { ...b, start, end: t };
  });
  const isTest = !l.sb || l.sb === "—";

  return (
    <article className="min-w-0 max-w-[900px]">
      <nav aria-label="Joylashuv" className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[13px] text-on-surface-variant">
        <span>{level.label}</span>
        <Icon name="chevron_right" size={16} className="text-outline" />
        <span>Unit {u.unit}</span>
        <Icon name="chevron_right" size={16} className="text-outline" />
        <span className="font-semibold text-primary">{f.part}-dars</span>
      </nav>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {isTest ? (
          <span className="rounded-full bg-tertiary-fixed px-3 py-1 font-mono text-[12px] font-semibold uppercase tracking-wider text-tertiary">Nazorat darsi</span>
        ) : (
          <span className="rounded-full bg-primary-fixed px-3 py-1 font-mono text-[12px] font-semibold uppercase tracking-wider text-primary">SB {l.sb}</span>
        )}
        {level.audience ? (
          <span className="rounded-full bg-surface-container px-3 py-1 font-mono text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant">{level.audience}</span>
        ) : null}
        <span className="flex-1" />
        <Button variant="outline" size="sm" icon="print" onClick={() => window.print()} className="print:hidden">
          Chop etish
        </Button>
      </div>

      <h1 className="mt-4 text-balance font-display text-[32px] font-extrabold leading-[40px] tracking-tight text-on-surface sm:text-[44px] sm:leading-[52px]">{l.focus}</h1>
      <p className="mt-3 text-[17px] leading-7 text-primary">▸ {u.title}</p>

      <dl className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-outline-variant bg-outline-variant shadow-card sm:grid-cols-2 md:grid-cols-3">
        <Meta label="Bosqich" value={level.label} sub={[level.audience, level.cefr ? `CEFR ${level.cefr}` : null].filter(Boolean).join(" · ") || undefined} />
        <Meta label="Unit" value={`Unit ${u.unit}`} sub={`${f.part}-dars (unitda ${f.parts} ta)`} />
        <Meta label="Dars raqami" value={`${f.no} / ${total}`} sub="bosqich boʻyicha" />
        <Meta label="Grammatika" value={u.grammar || "—"} />
        <Meta label="Kitob" value={isTest ? "Markaz testi" : `Student Book, ${l.sb}-bet`} />
        <Meta label="Davomiyligi" value={`${minutes || 90} daqiqa`} sub="1,5 soat" />
      </dl>

      {l.maqsad?.length ? (
        <Section n="01" title="Darsning maqsadi">
          <NumberedList items={l.maqsad} />
        </Section>
      ) : null}

      {l.lugat?.length ? (
        <Section n="02" title="Lugʻat" aside={<span className="text-[14px] text-on-surface-variant">{l.lugat.length} ta soʻz</span>}>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {l.lugat.map((s, i) => {
              const [word, meaning] = splitTerm(s);
              return (
                <li key={i} className="flex flex-col rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3">
                  <span className="text-[17px] font-semibold leading-6 text-on-surface">{word}</span>
                  {meaning ? <span className="text-[15px] leading-6 text-on-surface-variant">{meaning}</span> : null}
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {l.resurslar?.length ? (
        <Section n="03" title="Kerakli materiallar">
          <ul className="flex flex-col gap-3">
            {l.resurslar.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-[17px] leading-7 text-on-surface">
                <Icon name="task_alt" size={22} className="mt-0.5 shrink-0 text-primary" />
                {s}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {timed.length ? (
        <Section n="04" title="Dars bosqichlari" aside={<span className="text-[14px] font-semibold text-primary">{minutes} daqiqa</span>}>
          {/* 90 daqiqa qanday taqsimlangani: har boʻlak eni bosqich vaqtiga teng */}
          <div className="print:hidden">
            <div className="flex h-11 w-full gap-[3px] overflow-hidden rounded-xl" role="img" aria-label="Bosqichlar vaqt boʻyicha taqsimoti">
              {timed.map((b, i) => (
                <div
                  key={i}
                  style={{ flexGrow: b.minutes, flexBasis: 0 }}
                  title={`${i + 1}. ${b.title} — ${b.minutes} daqiqa`}
                  className={cn("flex min-w-0 items-center justify-center text-[13px] font-bold text-on-primary", i % 2 ? "bg-primary/80" : "bg-primary")}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[12px] text-on-surface-muted">
              <span>0:00</span>
              <span>{clock(Math.round(minutes / 2))}</span>
              <span>{clock(minutes)}</span>
            </div>
          </div>

          <ol className="mt-6 divide-y divide-outline-variant overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest">
            {timed.map((b, i) => (
              <li key={i} className="grid gap-3 p-5 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-6 sm:p-6 print:break-inside-avoid">
                <div className="flex items-baseline gap-3 sm:block">
                  <div className="font-display text-[34px] font-extrabold leading-none text-primary tabular-nums">
                    {b.minutes}
                    <span className="ml-1 text-[15px] font-semibold text-on-surface-variant">daq</span>
                  </div>
                  <div className="font-mono text-[12px] text-on-surface-muted sm:mt-2">
                    {clock(b.start)}–{clock(b.end)}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-muted">{i + 1}-bosqich</div>
                  <h3 className="mt-1 text-[20px] font-bold leading-7 text-on-surface">{b.title}</h3>
                  <ul className="mt-3 flex flex-col gap-2.5">
                    {b.points.map((p, k) => (
                      <li key={k} className="flex gap-3 text-[16px] leading-7 text-on-surface-variant">
                        <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                        <span className="min-w-0">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {l.uyga?.length ? (
        <Section n="05" title="Uy vazifasi">
          <NumberedList items={l.uyga} />
        </Section>
      ) : null}

      {l.ustozga ? (
        <Section n="06" title="Ustozga eslatma">
          <div className="flex gap-4 rounded-2xl border border-gold/50 bg-tertiary-fixed/40 p-5 sm:p-6">
            <Icon name="lightbulb" size={28} className="shrink-0 text-tertiary" />
            <p className="text-[17px] leading-7 text-on-surface">{l.ustozga}</p>
          </div>
        </Section>
      ) : null}

      <div className="mt-14 grid gap-3 border-t border-outline-variant pt-6 sm:grid-cols-2 print:hidden">
        {prev ? (
          <button
            type="button"
            onClick={() => go(prev.no)}
            className="flex flex-col items-start gap-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-left transition-colors hover:border-primary"
          >
            <span className="flex items-center gap-1 font-mono text-[12px] font-semibold uppercase tracking-wider text-on-surface-muted">
              <Icon name="chevron_left" size={16} /> Oldingi dars
            </span>
            <span className="line-clamp-2 text-[16px] font-semibold leading-6 text-on-surface">
              {prev.no}. {prev.lesson.focus}
            </span>
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button
            type="button"
            onClick={() => go(next.no)}
            className="flex flex-col items-end gap-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-right transition-colors hover:border-primary"
          >
            <span className="flex items-center gap-1 font-mono text-[12px] font-semibold uppercase tracking-wider text-on-surface-muted">
              Keyingi dars <Icon name="chevron_right" size={16} />
            </span>
            <span className="line-clamp-2 text-[16px] font-semibold leading-6 text-on-surface">
              {next.no}. {next.lesson.focus}
            </span>
          </button>
        ) : null}
      </div>
    </article>
  );
}

/**
 * URL: ?level=<id>&dars=<bosqichdagi tartib raqami>.
 * Boshqa sahifadan havola: ?level=<id>&unit=<topicId>&part=<unitdagi dars> — kerakli darsga oʻtib, keyin dars= ga aylanadi.
 */
export function PlanReader({ levels, loadingLevels, defaultLevelId, planPath, queryKey }: {
  levels: ReaderLevel[];
  loadingLevels?: boolean;
  defaultLevelId?: string | null;
  planPath: (levelId: string) => string;
  queryKey: readonly unknown[];
}) {
  const [params, setParams] = useSearchParams();
  const patch = (next: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(next)) {
          if (v == null || v === "") p.delete(k);
          else p.set(k, v);
        }
        return p;
      },
      { replace: true },
    );

  const levelId = params.get("level") || defaultLevelId || levels[0]?.id || null;
  const q = useApiQuery<LevelPlanResponse>([...queryKey, levelId], levelId ? planPath(levelId) : null);

  const { flat, offsets } = useMemo(() => {
    const out: Flat[] = [];
    const off = new Map<string, number>();
    for (const u of q.data?.units ?? []) {
      off.set(u.id, out.length);
      u.lessons.forEach((lesson, i) => out.push({ unit: u, lesson, part: i + 1, parts: u.lessons.length, no: out.length + 1 }));
    }
    return { flat: out, offsets: off };
  }, [q.data]);

  const unitParam = params.get("unit");
  const partParam = params.get("part");
  useEffect(() => {
    if (!unitParam || !flat.length) return;
    const part = Number(partParam) || 1;
    const hit = flat.find((f) => f.unit.id === unitParam && f.part === part) ?? flat.find((f) => f.unit.id === unitParam);
    patch({ dars: hit ? String(hit.no) : null, unit: null, part: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitParam, partParam, flat]);

  const dars = Math.min(Math.max(Number(params.get("dars")) || 1, 1), Math.max(flat.length, 1));
  const cur = flat[dars - 1];

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [dars, levelId]);

  const go = (no: number) => patch({ dars: String(no) });
  const selected = levels.find((l) => l.id === levelId);
  const units = (q.data?.units ?? []).filter((u) => u.lessons.length);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-10 print:block">
      <aside className="flex flex-col gap-4 lg:sticky lg:top-20 print:hidden">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
          <Field label="Bosqich">
            <Select
              value={levelId ?? ""}
              onChange={(e) => patch({ level: e.target.value, dars: null })}
              disabled={loadingLevels || !levels.length}
              placeholder={loadingLevels ? "Yuklanmoqda…" : "Bosqichni tanlang"}
              options={levels.map((l) => ({ value: l.id, label: `${l.label}${l.audience ? ` — ${l.audience}` : ""}` }))}
            />
          </Field>
          {selected ? (
            <p className="mt-2 text-[13px] leading-5 text-on-surface-variant">
              {[selected.audience, selected.cefr ? `CEFR ${selected.cefr}` : null, flat.length ? `${flat.length} dars` : null].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          {flat.length ? (
            <div className="mt-3 lg:hidden">
              <Field label="Dars">
                <Select
                  value={String(dars)}
                  onChange={(e) => go(Number(e.target.value))}
                  options={flat.map((f) => ({ value: String(f.no), label: `${f.no}. Unit ${f.unit.unit} · ${f.lesson.focus}` }))}
                />
              </Field>
            </div>
          ) : null}
        </div>

        {units.length ? (
          <nav
            aria-label="Darslar"
            className="scrollbar-thin hidden max-h-[calc(100dvh-14rem)] overflow-y-auto rounded-2xl border border-outline-variant bg-surface-container-lowest p-2 lg:block"
          >
            {units.map((u) => (
              <div key={u.id} className="pb-1">
                <div className="px-3 pb-1.5 pt-3 font-mono text-[11px] font-semibold uppercase leading-4 tracking-[0.1em] text-on-surface-muted">{u.title}</div>
                {u.lessons.map((l, i) => {
                  const no = (offsets.get(u.id) ?? 0) + i + 1;
                  const on = no === dars;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => go(no)}
                      aria-current={on ? "true" : undefined}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                        on ? "bg-primary text-on-primary" : "text-on-surface hover:bg-surface-container-low",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-px flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md px-1 text-[12px] font-bold tabular-nums",
                          on ? "bg-on-primary/20" : "bg-surface-container text-on-surface-variant",
                        )}
                      >
                        {no}
                      </span>
                      <span className="line-clamp-2 text-[14px] font-medium leading-5">{l.focus}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        ) : null}
      </aside>

      <div className="min-w-0">
        {q.isLoading || (loadingLevels && !q.data) ? (
          <div className="flex max-w-[900px] flex-col gap-4">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        ) : q.error ? (
          <Alert tone="danger" title="Reja yuklanmadi">
            {q.error.message}
          </Alert>
        ) : !levelId ? (
          <EmptyState icon="auto_stories" title="Bosqich yoʻq" description="Avval Mavzular bazasida bosqich yarating" />
        ) : !cur || !q.data ? (
          <div className="max-w-[900px] rounded-2xl border border-outline-variant bg-surface-container-lowest">
            <EmptyState
              icon="auto_stories"
              title="Bu bosqich uchun darsma-dars reja hali tayyorlanmagan"
              description={
                q.data?.level.description || "Mavzular (unitlar) bazada bor, lekin har bir dars uchun batafsil reja yozilmagan. Kitob olingach qoʻshiladi."
              }
            />
          </div>
        ) : (
          <LessonPage f={cur} total={flat.length} level={q.data.level} prev={flat[dars - 2]} next={flat[dars]} go={go} />
        )}
      </div>
    </div>
  );
}
