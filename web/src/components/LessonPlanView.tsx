// Darsma-dars reja koʻrinishi. Admin (Mavzular bazasi) va ustoz (dars oʻtkazish) sahifalarida bir xil ishlatiladi.
// Reja ustoz uchun yozilgan: har bosqichda necha daqiqa va nima qilinishi aniq koʻrsatiladi.
import { useState, type ReactNode } from "react";
import { Badge, Button, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { PlanLesson } from "@/lib/types";

function Section({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">
        <Icon name={icon} size={14} />
        {title}
      </div>
      {children}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-0.5 pl-5 text-body-sm text-on-surface-variant">
      {items.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ul>
  );
}

/** Bitta darsning toʻliq rejasi: maqsad, lugʻat, resurslar, bosqichlar (daqiqa bilan), uy vazifasi, ustozga eslatma. */
export function LessonPlanCard({ plan, no, active, badge }: { plan: PlanLesson; no: number; active?: boolean; badge?: ReactNode }) {
  // eski formatdagi reja hali yangilanmagan boʻlishi mumkin — shuning uchun hamma joyda himoya
  const total = (plan.blocks ?? []).reduce((s, b) => s + b.minutes, 0);
  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-3 sm:p-4",
        active ? "border-primary/40 bg-surface-container-lowest shadow-card" : "border-outline-variant/60 bg-surface-container-lowest/60",
      )}
    >
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-label-lg text-label-lg text-on-surface">
          {no}-dars · {plan.focus}
        </span>
        {plan.sb && plan.sb !== "—" ? <Badge tone="neutral">SB {plan.sb}</Badge> : null}
        {total ? <Badge tone="neutral">{total} daqiqa</Badge> : null}
        {badge}
      </header>

      {plan.maqsad?.length ? (
        <Section icon="check_circle" title="Maqsad">
          <Bullets items={plan.maqsad} />
        </Section>
      ) : null}

      {plan.lugat?.length ? (
        <Section icon="spellcheck" title="Lugʻat">
          <Bullets items={plan.lugat} />
        </Section>
      ) : null}

      {plan.resurslar?.length ? (
        <Section icon="attach_file" title="Kerakli materiallar">
          <Bullets items={plan.resurslar} />
        </Section>
      ) : null}

      {plan.blocks?.length ? (
        <Section icon="menu_book" title="Dars bosqichlari">
          <ol className="flex flex-col gap-2">
            {plan.blocks.map((b, i) => (
              <li key={i} className="rounded-lg bg-surface-container-low p-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <span className="font-label-md text-label-md text-on-surface">
                    {i + 1}. {b.title}
                  </span>
                  <span className="shrink-0 font-label-sm text-label-sm tabular-nums text-primary">{b.minutes} daqiqa</span>
                </div>
                <Bullets items={b.points} />
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {plan.uyga?.length ? (
        <Section icon="assignment" title="Uy vazifasi">
          <Bullets items={plan.uyga} />
        </Section>
      ) : null}

      {plan.ustozga ? (
        <div className="flex items-start gap-2 rounded-lg bg-tertiary-fixed/40 p-2.5">
          <Icon name="lightbulb" size={18} className="mt-0.5 shrink-0 text-tertiary" />
          <p className="text-body-sm text-on-surface">
            <b className="font-semibold">Ustozga:</b> {plan.ustozga}
          </p>
        </div>
      ) : null}
    </article>
  );
}

/** Ustoz sahifasi: bugungi dars ochiq turadi, qolganlarini tugma bilan koʻrish mumkin. */
export function LessonPlanToday({ plan, part }: { plan: PlanLesson[]; part: number }) {
  const [all, setAll] = useState(false);
  const idx = Math.min(Math.max(part, 1), plan.length) - 1;
  const shown = all ? plan.map((p, i) => ({ p, i })) : [{ p: plan[idx], i: idx }];
  return (
    <div className="mt-2 flex flex-col gap-2">
      {shown.map(({ p, i }) => (
        <LessonPlanCard key={i} plan={p} no={i + 1} active={i === idx} badge={i === idx ? <Badge tone="primary">Shu dars</Badge> : undefined} />
      ))}
      {plan.length > 1 ? (
        <Button variant="link" size="sm" className="self-start" onClick={() => setAll((v) => !v)}>
          {all ? "Faqat shu dars" : `Unitning barcha darslari (${plan.length})`}
        </Button>
      ) : null}
    </div>
  );
}

/** Admin sahifasi: unitning barcha darslari, ochiladigan roʻyxat. */
export function LessonPlanAll({ plan }: { plan: PlanLesson[] }) {
  const total = plan.reduce((s, p) => s + (p.blocks ?? []).reduce((x, b) => x + b.minutes, 0), 0);
  return (
    <details className="mt-2.5 rounded-lg bg-surface-container-low px-3 py-2">
      <summary className="cursor-pointer font-label-md text-label-md text-on-surface">
        Dars rejasi · {plan.length} dars
        {total ? <span className="font-normal text-on-surface-variant"> · {Math.round((total / 60) * 10) / 10} soat</span> : null}
      </summary>
      <div className="mt-2 flex flex-col gap-2">
        {plan.map((p, i) => (
          <LessonPlanCard key={i} plan={p} no={i + 1} />
        ))}
      </div>
    </details>
  );
}
