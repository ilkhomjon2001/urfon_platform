// Bosh sahifa grafiklari (recharts). SVG rang talab qiladi — qiymatlar tailwind.urfon tokenlaridan olingan:
// primary #1E4FC2, yellow-600 #D99210, error #DC2626, outline-variant #E2E8F0, on-surface-muted #64748B.
// Palitra dataviz validatori bilan tekshirilgan (primary / yellow-600 / error — CVD ΔE ≥ 13).
import type { ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtMoney, fmtNum, fmtPercent } from "@/lib/format";

export const CHART = {
  primary: "#1E4FC2",
  pending: "#D99210",
  overdue: "#DC2626",
  grid: "#E2E8F0",
  axis: "#64748B",
  surface: "#FFFFFF",
} as const;

const axisProps = {
  tick: { fill: CHART.axis, fontSize: 11, fontFamily: "Inter Variable, Inter, system-ui, sans-serif" },
  tickLine: false,
  axisLine: { stroke: CHART.grid },
} as const;

function TipBox({ title, rows }: { title: ReactNode; rows: { color?: string; label: string; value: string }[] }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 shadow-float">
      <div className="mb-1 font-label-md text-label-md text-on-surface">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4 text-body-sm">
          <span className="inline-flex items-center gap-1.5 text-on-surface-variant">
            {r.color ? <span className="h-2 w-2 rounded-full" style={{ background: r.color }} /> : null}
            {r.label}
          </span>
          <span className="font-semibold tabular-nums text-on-surface">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// recharts Tooltip content'ining minimal turi (payload[0].payload — nuqta ma'lumoti)
type TipProps<T> = { active?: boolean; payload?: { payload?: T }[] };
const pointOf = <T,>(p: TipProps<T>) => (p.active ? p.payload?.[0]?.payload : undefined);

/** Oxirgi nuqtadagi qiymat yorlig'i (faqat bitta — har nuqtaga emas). */
function endLabel(len: number, fmt: (v: number) => string) {
  return function EndLabel(props: { x?: number | string; y?: number | string; value?: number | string; index?: number }) {
    if (props.index !== len - 1 || props.value == null) return null;
    return (
      <text x={Number(props.x)} y={Number(props.y) - 12} textAnchor="end" fill="#0F172A" fontSize={12} fontWeight={700}>
        {fmt(Number(props.value))}
      </text>
    );
  };
}

export function GrowthChart({ data }: { data: { label: string; count: number }[] }) {
  // o'qi toza chegaralarda: pastki — 10 ga karrali (0 dan kichik emas), yuqori — 10% zaxira bilan
  const vals = data.map((d) => d.count);
  const lo = vals.length ? Math.max(0, Math.floor((Math.min(...vals) * 0.8) / 10) * 10) : 0;
  const hi = vals.length ? Math.max(lo + 10, Math.ceil((Math.max(...vals) * 1.1) / 10) * 10) : 10;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 24, right: 16, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="growthFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.12} />
            <stop offset="100%" stopColor={CHART.primary} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={CHART.grid} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} axisLine={false} allowDecimals={false} width={48} domain={[lo, hi]} tickFormatter={(v: number) => fmtNum(Math.max(0, Math.round(v)))} />
        <Tooltip
          cursor={{ stroke: CHART.axis, strokeWidth: 1 }}
          content={(props: TipProps<{ label: string; count: number }>) => {
            const p = pointOf(props);
            return p ? <TipBox title={p.label} rows={[{ color: CHART.primary, label: "Oʻquvchilar", value: `${fmtNum(p.count)} nafar` }]} /> : null;
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={CHART.primary}
          strokeWidth={2}
          fill="url(#growthFill)"
          dot={{ r: 4, fill: CHART.primary, stroke: CHART.surface, strokeWidth: 2 }}
          activeDot={{ r: 6, fill: CHART.primary, stroke: CHART.surface, strokeWidth: 2 }}
          isAnimationActive={false}
        >
          <LabelList dataKey="count" content={endLabel(data.length, (v) => `${fmtNum(v)} nafar`)} />
        </Area>
      </AreaChart>
    </ResponsiveContainer>
  );
}

const millions = (v: number) => (v >= 1_000_000 ? `${fmtNum(v / 1_000_000, v % 1_000_000 === 0 ? 0 : 1)} mln` : fmtNum(v));

export function RevenueChart({ data }: { data: { label: string; collected: number; pending: number; overdue: number }[] }) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={232}>
        <BarChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -4 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} axisLine={false} width={56} tickFormatter={millions} />
          <Tooltip
            cursor={{ fill: "#F3F6FC" }}
            content={(props: TipProps<{ label: string; collected: number; pending: number; overdue: number }>) => {
              const p = pointOf(props);
              if (!p) return null;
              return (
                <TipBox
                  title={p.label}
                  rows={[
                    { color: CHART.primary, label: "Yigʻilgan", value: fmtMoney(p.collected) },
                    { color: CHART.pending, label: "Kutilmoqda", value: fmtMoney(p.pending) },
                    { color: CHART.overdue, label: "Muddati oʻtgan", value: fmtMoney(p.overdue) },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="collected" stackId="m" fill={CHART.primary} stroke={CHART.surface} strokeWidth={2} maxBarSize={24} isAnimationActive={false} />
          <Bar dataKey="pending" stackId="m" fill={CHART.pending} stroke={CHART.surface} strokeWidth={2} maxBarSize={24} isAnimationActive={false} />
          <Bar dataKey="overdue" stackId="m" fill={CHART.overdue} stroke={CHART.surface} strokeWidth={2} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      <Legend
        items={[
          { color: CHART.primary, label: "Yigʻilgan" },
          { color: CHART.pending, label: "Kutilmoqda" },
          { color: CHART.overdue, label: "Muddati oʻtgan" },
        ]}
      />
    </div>
  );
}

export function AttendanceChart({ data }: { data: { label: string; pct: number | null; marked: number }[] }) {
  const values = data.map((d) => d.pct).filter((v): v is number => v != null);
  const min = values.length ? Math.max(0, Math.floor((Math.min(...values) - 5) / 5) * 5) : 0;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 24, right: 16, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} stroke={CHART.grid} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} axisLine={false} width={48} domain={[min, 100]} tickFormatter={(v: number) => `${v}%`} />
        <Tooltip
          cursor={{ stroke: CHART.axis, strokeWidth: 1 }}
          content={(props: TipProps<{ label: string; pct: number | null; marked: number }>) => {
            const p = pointOf(props);
            return p ? (
              <TipBox
                title={`${p.label} haftasi`}
                rows={[
                  { color: CHART.primary, label: "Davomat", value: fmtPercent(p.pct) },
                  { label: "Belgilangan", value: fmtNum(p.marked) },
                ]}
              />
            ) : null;
          }}
        />
        <Line
          type="monotone"
          dataKey="pct"
          stroke={CHART.primary}
          strokeWidth={2}
          connectNulls
          dot={{ r: 4, fill: CHART.primary, stroke: CHART.surface, strokeWidth: 2 }}
          activeDot={{ r: 6, fill: CHART.primary, stroke: CHART.surface, strokeWidth: 2 }}
          isAnimationActive={false}
        >
          <LabelList dataKey="pct" content={endLabel(data.length, (v) => fmtPercent(v))} />
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-body-sm text-on-surface-variant">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
