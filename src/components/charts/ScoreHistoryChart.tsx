import { useId } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatShortDate } from "@/lib/utils";
import type { ScorePoint } from "@/types";
import { AXIS_LINE, AXIS_TICK, ChartTooltip, GRID_STROKE, INDIGO } from "./chartTheme";

interface ScoreHistoryChartProps {
  data: ScorePoint[];
  height?: number;
}

export function ScoreHistoryChart({ data, height = 260 }: ScoreHistoryChartProps) {
  const gradientId = useId();

  if (data.length < 2) {
    return (
      <EmptyState
        title="Not enough history yet"
        description="A trend line needs at least two scoring runs. Check back once the crawler has been round again."
      />
    );
  }

  // Oldest first, so the line reads left to right.
  const series = [...data]
    .sort((a, b) => new Date(a.scored_at).getTime() - new Date(b.scored_at).getTime())
    .map((point) => ({
      scored_at: point.scored_at,
      score: point.momentum_score,
      label: point.momentum_label,
    }));

  // With many points, every other tick keeps the axis readable.
  const tickInterval = series.length > 12 ? Math.ceil(series.length / 8) : 0;

  // Scores can be recomputed several times a day. When the whole series fits
  // inside about two days, a date axis just repeats "8 Aug" across the width,
  // so fall back to clock time and let the tooltip carry the full date.
  const spanMs =
    new Date(series[series.length - 1].scored_at).getTime() -
    new Date(series[0].scored_at).getTime();
  const intraday = spanMs < 2 * 24 * 3600 * 1000;
  const formatTick = (iso: string) =>
    intraday
      ? new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
      : formatShortDate(iso);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={INDIGO} stopOpacity={0.2} />
              <stop offset="100%" stopColor={INDIGO} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="scored_at"
            tickFormatter={formatTick}
            tick={AXIS_TICK}
            axisLine={AXIS_LINE}
            tickLine={false}
            interval={tickInterval}
            minTickGap={16}
          />
          <YAxis
            domain={[0, 100]}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: GRID_STROKE, strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as (typeof series)[number];
              return (
                <ChartTooltip
                  title={
                    intraday
                      ? new Date(point.scored_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : formatDate(point.scored_at)
                  }
                  rows={[{ label: "Score", value: point.score.toFixed(1), color: INDIGO }]}
                />
              );
            }}
          />

          <Area
            type="monotone"
            dataKey="score"
            stroke="none"
            fill={`url(#${gradientId})`}
            isAnimationActive
            animationDuration={600}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke={INDIGO}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: INDIGO, stroke: "var(--color-surface)", strokeWidth: 2 }}
            isAnimationActive
            animationDuration={600}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
