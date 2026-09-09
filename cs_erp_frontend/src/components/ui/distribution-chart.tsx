"use client";

import { cn } from "@/lib/utils";

interface DistributionItem {
  label: string;
  value: number;
  color: string;
}

interface DistributionChartProps {
  items: DistributionItem[];
  className?: string;
}

const CHART_COLORS = [
  "#531424",
  "#c9aa8f",
  "#310505",
  "#94a3b8",
  "#64748b",
  "#cbd5e1",
];

export function DistributionChart({ items, className }: DistributionChartProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (total <= 0) {
    return (
      <div
        className={cn(
          "flex h-48 items-center justify-center rounded-xl border border-dashed border-border bg-slate-50/50 text-sm text-slate-500",
          className
        )}
      >
        Sin datos de distribución
      </div>
    );
  }

  let cumulative = 0;
  const segments = items.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const start = cumulative;
    cumulative += percentage;
    return {
      ...item,
      percentage,
      start,
      end: cumulative,
      color: item.color || CHART_COLORS[index % CHART_COLORS.length],
    };
  });

  const gradient = segments
    .map((seg) => `${seg.color} ${seg.start}% ${seg.end}%`)
    .join(", ");

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center", className)}>
      <div className="relative mx-auto h-36 w-36 shrink-0">
        <div
          className="h-full w-full rounded-full shadow-[var(--shadow-card)]"
          style={{ background: `conic-gradient(${gradient})` }}
          role="img"
          aria-label="Distribución de costos por producto"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-center shadow-sm">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Total
              </p>
              <p className="text-xs font-semibold text-brand">100%</p>
            </div>
          </div>
        </div>
      </div>

      <ul className="flex-1 space-y-2">
        {segments.map((seg, index) => (
          <li key={`${seg.label}-${index}`} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="truncate text-slate-700">{seg.label}</span>
            </div>
            <span className="shrink-0 font-mono text-xs font-medium text-slate-500">
              {seg.percentage.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
