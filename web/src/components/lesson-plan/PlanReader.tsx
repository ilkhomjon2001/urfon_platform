// Dars rejalari (B varianti): avval levelning unit kartalari, dars bosilganda — shu darsning toʻliq sahifasi.
// Har level alohida kitob; bitta level ichida 13–16 va 8–12 yosh uchun alohida reja (almashtirgich).
// Ustoz darsga tayyorlanayotganda yoki dars paytida ekranda ochib qoʻyadi — matn yirik, har bosqichning vaqti koʻrinadi.
import { useEffect, useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Button, Field, Icon, Select, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useApiQuery } from "@/lib/query";
import type { LevelPlanResponse, PlanLesson, PlanTrack, PlanUnitDto } from "@/lib/types";

export interface ReaderLevel {
  id: string;
  label: string;
  audience: string | null;
  cefr: string | null;
}

type Flat = { unit: PlanUnitDto; lesson: PlanLesson; part: number; parts: number; no: number };

const TRACK_LABEL: Record<PlanTrack, string> = { teen: "13–16 yosh", kids: "8–12 yosh" };
const clock = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

/** "Unit 2 · My family + Culture" → { tag: "Unit 2", name: "My family + Culture" } */
function unitName(u: PlanUnitDto) {
  const name = u.title.replace(/^Unit\s+\d+\s*[·:.-]\s*/i, "").replace(/^Starter\s*[·:.-]\s*/i, "");
  return { tag: u.unit === 0 ? "Starter" : `Unit ${u.unit}`, name: name || u.title };
}

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

/** Yosh toifasi almashtirgichi: 13–16 | 8–12 */
function TrackSwitch({ track, onChange }: { track: PlanTrack; onChange: (t: PlanTrack) => void }) {
  return (
    <div role="radiogroup" aria-label="Yosh toifasi" className="inline-flex rounded-xl bg-surface-container p-1">
      {(["teen", "kids"] as const).map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={track === t}
          onClick={() => onChange(t)}
          className={cn(
            "h-9 rounded-lg px-4 font-label-lg text-label-lg transition-colors",
            track === t ? "bg-surface-container-lowest text-primary shadow-card" : "text-on-surface-variant hover:text-on-surface",
          )}
        >
          {TRACK_LABEL[t]}
        </button>
      ))}
    </div>
  );
}

// ───────────────────────── 1-ekran: unit kartalari ─────────────────────────
function UnitGrid({ units, offsets, onOpen }: { units: PlanUnitDto[]; offsets: Map<string, number>; onOpen: (no: number) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {units.map((u) => {
        const { tag, name } = unitName(u);
        const start = offsets.get(u.id) ?? 0;
        return (
          <article key={u.id} className="flex flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">{tag}</span>
              <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-[12px] font-semibold text-on-surface-variant">{u.lessons.length} dars</span>
            </div>
            <h3 className="mt-2 text-balance font-display text-[19px] font-bold leading-7 text-on-surface">{name}</h3>
            {u.grammar ? <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-on-surface-variant">{u.grammar}</p> : null}
            <ol className="mt-4 flex flex-col gap-1.5">
              {u.lessons.map((l, i) => {
                const no = start + i + 1;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => onOpen(no)}
                      className="group flex w-full items-center gap-3 rounded-xl border border-transparent bg-surface-container-low px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-primary-fixed/40"
                    >
                      <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest px-1 text-[13px] font-bold tabular-nums text-primary">{no}</span>
                      <span className="min-w-0 flex-1 text-[15px] font-medium leading-5 text-on-surface">{l.focus}</span>
                      <Icon name="chevron_right" size={18} className="shrink-0 text-on-surface-muted group-hover:text-primary" />
                    </button>
                  </li>
                );
              })}
            </ol>
          </article>
        );
      })}
    </div>
  );
}

// ───────────────────────── 2-ekran: bitta dars ─────────────────────────
function LessonPage({ f, prev, next, go }: { f: Flat; prev?: Flat; next?: Flat; go: (no: number) => void }) {
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
  const { tag, name } = unitName(u);

  return (
    <article className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        {isTest ? (
          <span className="rounded-full bg-tertiary-fixed px-3 py-1 text-[12px] font-bold uppercase tracking-wider text-tertiary">Nazorat darsi</span>
        ) : (
          <span className="rounded-full bg-primary-fixed px-3 py-1 text-[12px] font-bold uppercase tracking-wider text-primary">Kitob: {l.sb}-bet</span>
        )}
        <span className="flex-1" />
        <Button variant="outline" size="sm" icon="print" onClick={() => window.print()} className="print:hidden">
          Chop etish
        </Button>
      </div>

      <h1 className="mt-4 text-balance font-display text-[32px] font-extrabold leading-[40px] tracking-tight text-on-surface sm:text-[44px] sm:leading-[52px]">{l.focus}</h1>
      <p className="mt-3 text-[17px] leading-7 text-primary">
        ▸ {tag} · {name}
      </p>

      <dl className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-outline-variant bg-outline-variant shadow-card sm:grid-cols-3">
        <Meta label="Unit" value={tag} sub={`${f.part}-dars, unitda ${f.parts} ta`} />
        <Meta label="Grammatika" value={u.grammar || "—"} />
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
            <span className="flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wider text-on-surface-muted">
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
            <span className="flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wider text-on-surface-muted">
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
 * URL: ?level=<id>&track=teen|kids — unit kartalari; &dars=<leveldagi tartib raqami> — bitta dars.
 * Boshqa sahifadan havola: ?level=<id>&track=…&unit=<topicId>&part=<unitdagi dars> — kerakli darsga oʻtib, dars= ga aylanadi.
 */
export function PlanReader({ levels, loadingLevels, defaultLevelId, defaultTrack, planPath, queryKey }: {
  levels: ReaderLevel[];
  loadingLevels?: boolean;
  defaultLevelId?: string | null;
  defaultTrack?: PlanTrack;
  planPath: (levelId: string, track: PlanTrack) => string;
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
      { replace: false },
    );

  const levelId = params.get("level") || defaultLevelId || levels[0]?.id || null;
  const wantTrack: PlanTrack = params.get("track") === "kids" ? "kids" : params.get("track") === "teen" ? "teen" : (defaultTrack ?? "teen");
  const q = useApiQuery<LevelPlanResponse>([...queryKey, levelId, wantTrack], levelId ? planPath(levelId, wantTrack) : null);
  const data = q.data;
  const hasKids = !!data?.tracks.kids;
  const track: PlanTrack = hasKids ? wantTrack : "teen";

  const { flat, offsets, units } = useMemo(() => {
    const out: Flat[] = [];
    const off = new Map<string, number>();
    const list = (data?.units ?? []).filter((u) => u.lessons.length);
    for (const u of list) {
      off.set(u.id, out.length);
      u.lessons.forEach((lesson, i) => out.push({ unit: u, lesson, part: i + 1, parts: u.lessons.length, no: out.length + 1 }));
    }
    return { flat: out, offsets: off, units: list };
  }, [data]);

  // boshqa sahifadan (Mavzular bazasi, ustozning dars sahifasi) unit + part bilan kelganda
  const unitParam = params.get("unit");
  const partParam = params.get("part");
  useEffect(() => {
    if (!unitParam || !flat.length) return;
    const part = Number(partParam) || 1;
    const hit = flat.find((f) => f.unit.id === unitParam && f.part === part) ?? flat.find((f) => f.unit.id === unitParam);
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (hit) p.set("dars", String(hit.no));
        p.delete("unit");
        p.delete("part");
        return p;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitParam, partParam, flat]);

  const darsParam = Number(params.get("dars")) || 0;
  const dars = darsParam ? Math.min(Math.max(darsParam, 1), Math.max(flat.length, 1)) : 0;
  const cur = dars ? flat[dars - 1] : undefined;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [dars, levelId, track]);

  const go = (no: number) => patch({ dars: String(no) });
  const selected = levels.find((l) => l.id === levelId);
  const months = flat.length ? Math.max(1, Math.round(flat.length / 3 / 4.3)) : 0;

  // ── Tepadagi panel: level, yosh toifasi, (darsda) orqaga va varaqlash ──
  const toolbar = (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 print:hidden">
      {cur ? (
        <Button variant="outline" icon="arrow_back" onClick={() => patch({ dars: null })}>
          Unitlarga qaytish
        </Button>
      ) : (
        <Field label="Level" className="min-w-[min(100%,300px)]">
          <Select
            value={levelId ?? ""}
            onChange={(e) => patch({ level: e.target.value, dars: null })}
            disabled={loadingLevels || !levels.length}
            placeholder={loadingLevels ? "Yuklanmoqda…" : "Levelni tanlang"}
            options={levels.map((l) => ({ value: l.id, label: l.label }))}
          />
        </Field>
      )}
      {hasKids ? <TrackSwitch track={track} onChange={(t) => patch({ track: t, dars: null })} /> : null}
      <span className="flex-1" />
      {cur ? (
        <div className="flex items-center gap-2">
          <Button variant="outline" icon="chevron_left" onClick={() => go(dars - 1)} disabled={dars <= 1} aria-label="Oldingi dars" />
          <span className="min-w-[88px] text-center font-display text-[16px] font-bold tabular-nums text-on-surface">
            {dars} / {flat.length}
          </span>
          <Button variant="navy" icon="chevron_right" onClick={() => go(dars + 1)} disabled={dars >= flat.length} aria-label="Keyingi dars" />
        </div>
      ) : flat.length ? (
        <span className="text-[14px] text-on-surface-variant">
          {units.length} unit · {flat.length} dars · ≈ {months} oy
        </span>
      ) : null}
    </div>
  );

  let body: ReactNode;
  if (q.isLoading || (loadingLevels && !data)) {
    body = (
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
    );
  } else if (q.error) {
    body = (
      <Alert tone="danger" title="Reja yuklanmadi">
        {q.error.message}
      </Alert>
    );
  } else if (!flat.length) {
    // bu levelda hali reja yoʻq — hech narsa koʻrsatilmaydi, faqat qisqa izoh
    body = (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-16 text-center">
        <Icon name="auto_stories" size={36} className="text-on-surface-muted" />
        <p className="font-display text-[18px] font-bold text-on-surface">{selected?.label ?? "Bu level"} uchun hali dars rejasi yoʻq</p>
        <p className="max-w-md text-[14px] text-on-surface-variant">Bu level alohida kitob asosida oʻtiladi. Kitob tanlangach, rejalar shu yerda paydo boʻladi.</p>
      </div>
    );
  } else if (cur) {
    body = (
      <div className="mx-auto max-w-[960px]">
        <LessonPage f={cur} prev={flat[dars - 2]} next={flat[dars]} go={go} />
      </div>
    );
  } else {
    body = (
      <>
        {data?.level.description ? <p className="max-w-3xl text-[15px] leading-6 text-on-surface-variant">{data.level.description}</p> : null}
        <UnitGrid units={units} offsets={offsets} onOpen={go} />
      </>
    );
  }

  return (
    <div className={cn("flex flex-col gap-5", cur && "mx-auto w-full max-w-[960px]")}>
      {toolbar}
      {cur && selected ? (
        <p className="font-mono text-[13px] text-on-surface-variant print:hidden">
          {selected.label} · {hasKids ? `${TRACK_LABEL[track]} · ` : ""}{unitName(cur.unit).tag}
        </p>
      ) : null}
      {body}
    </div>
  );
}
