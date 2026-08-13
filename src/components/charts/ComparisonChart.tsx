import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatShortDate } from "@/lib/utils";
import type { ScorePoint } from "@/types";
import { AXIS_LINE, AXIS_TICK, ChartTooltip, GRID_STROKE } from "./chartTheme";

export interface ComparisonSeries {
  name: string;
  data: ScorePoint[];
  color: string;
}

interface ComparisonChartProps {
  companies: ComparisonSeries[];
  height?: number;
}

/** Overlaid score histories. Each company scores on its own schedule, so the
 * series are merged onto a shared date axis with gaps left as holes rather
 * than interpolated — an invented point is a lie in a comparison view. */
export function ComparisonChart({ companies, height = 300 }: ComparisonChartProps) {
  const withData = companies.filter((company) => company.data.length > 0);

  if (withData.length === 0) {
    return <EmptyState title="No score history" description="None of these companies have been scored yet." />;
  }

  const byDate = new Map<string, Record<string, number | string>>();
  for (const company of withData) {
    for (const point of company.data) {
      const day = point.scored_at.slice(0, 10);
      const row = byDate.get(day) ?? { scored_at: day };
      row[company.name] = point.momentum_score;
      byDate.set(day, row);
    }
  }

  const rows = [...byDate.values()].sort((a, b) =>
    String(a.scored_at).localeCompare(String(b.scored_at)),
  );

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="scored_at"
            tickFormatter={formatShortDate}
            tick={AXIS_TICK}
            axisLine={AXIS_LINE}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis domain={[0, 100]} tick={AXIS_TICK} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            cursor={{ stroke: GRID_STROKE, strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <ChartTooltip
                  title={formatDate(String(label))}
                  rows={payload.map((entry) => ({
                    label: String(entry.name),
                    value: Number(entry.value).toFixed(1),
                    color: String(entry.color),
                  }))}
                />
              );
            }}
          />
          {withData.map((company) => (
            <Line
              key={company.name}
              type="monotone"
              dataKey={company.name}
              stroke={company.color}
              strokeWidth={2}
              dot={false}
              // Keeps the line going across dates where this company was not scored.
              connectNulls
              activeDot={{ r: 4, stroke: "var(--color-surface)", strokeWidth: 2 }}
              isAnimationActive
              animationDuration={600}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
