import type { ReactNode } from "react";

/* Recharts takes colours as prop values rather than classes, so these are
   var() references — the same tokens the utilities use, which means charts
   follow [data-theme] without a re-render. */

export const AXIS_TICK = {
  fill: "var(--color-text-muted)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
} as const;

export const GRID_STROKE = "var(--color-border)";
export const INDIGO = "var(--color-signal-indigo)";

export const AXIS_LINE = { stroke: "var(--color-border)" } as const;

interface TooltipRow {
  label: string;
  value: ReactNode;
  color?: string;
}

interface ChartTooltipProps {
  title?: string;
  rows: TooltipRow[];
}

/** Shared tooltip shell so every chart's hover card looks the same. */
export function ChartTooltip({ title, rows }: ChartTooltipProps) {
  return (
    <div className="bg-surface border-border-bright rounded-tooltip shadow-hover border px-12 py-8">
      {title && <p className="text-mono-sm text-text-muted mb-6">{title}</p>}
      {rows.map((row) => (
        <p key={row.label} className="text-body-sm text-text-primary flex items-center gap-8">
          {row.color && (
            <span
              aria-hidden
              className="rounded-avatar size-8 shrink-0"
              style={{ background: row.color }}
            />
          )}
          <span className="text-text-secondary">{row.label}</span>
          <span className="ml-auto tabular-nums">{row.value}</span>
        </p>
      ))}
    </div>
  );
}
