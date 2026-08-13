import { useNavigate } from "react-router-dom";

import { label as labelOf } from "@/lib/constants";
import { cn, formatCount } from "@/lib/utils";
import type { IndustryBreakdown } from "@/types";

interface IndustryBreakdownChartProps {
  data: IndustryBreakdown[];
  limit?: number;
  className?: string;
}

/**
 * Horizontal bars, hand-built rather than Recharts.
 *
 * The bars need a pill cap, a text label outside the plot area and a click
 * target that navigates — all of which fight Recharts' layout model, whereas
 * they are three lines of flexbox here. Recharts still owns the charts where
 * axes and interpolation actually matter.
 */
export function IndustryBreakdownChart({ data, limit = 10, className }: IndustryBreakdownChartProps) {
  const navigate = useNavigate();

  const rows = [...data].sort((a, b) => b.count - a.count).slice(0, limit);
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <div className={cn("flex flex-col gap-12", className)}>
      {rows.map((row, index) => (
        <button
          key={row.name}
          type="button"
          onClick={() => navigate(`/companies?industry=${encodeURIComponent(row.name)}`)}
          className="group text-left"
          aria-label={`${labelOf(row.name)}, ${row.count} companies. Filter companies by this industry.`}
        >
          <div className="mb-6 flex items-baseline justify-between gap-12">
            <span className="text-body-sm text-text-primary group-hover:text-signal-indigo truncate transition-colors duration-150">
              {labelOf(row.name)}
            </span>
            <span className="text-mono text-text-secondary shrink-0 tabular-nums">
              {formatCount(row.count)}
              {row.avg_score != null && (
                <span className="text-text-muted ml-8">avg {row.avg_score.toFixed(0)}</span>
              )}
            </span>
          </div>
          <div className="bg-surface-raised rounded-pill h-24 overflow-hidden">
            <div
              className="bg-signal-indigo group-hover:bg-indigo-light rounded-pill h-full transition-all duration-500 ease-out"
              style={{
                width: `${(row.count / max) * 100}%`,
                // Bars grow in sequence rather than all at once.
                transitionDelay: `${index * 40}ms`,
              }}
            />
          </div>
        </button>
      ))}
    </div>
  );
}
