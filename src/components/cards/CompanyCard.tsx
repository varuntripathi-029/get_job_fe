import { Link } from "react-router-dom";

import { MomentumBadge, MomentumScore, ScoreDelta } from "@/components/ui/MomentumScore";
import { Sparkline } from "@/components/ui/Sparkline";
import { colorForName, label as labelOf, momentum } from "@/lib/constants";
import { cn, formatCount, initialOf } from "@/lib/utils";
import type { CompanyListItem, ScorePoint } from "@/types";

interface CompanyCardProps {
  company: CompanyListItem;
  /** Score history is not on the list payload, so callers that have it
   * (trending, detail) can pass it in to light up the sparkline. */
  history?: ScorePoint[] | number[];
  delta?: number | null;
  /** Position in the grid, used to stagger the reveal by 40ms per card. */
  index?: number;
  compact?: boolean;
  className?: string;
}

function toSeries(history: CompanyCardProps["history"]): number[] {
  if (!history) return [];
  return history.map((point) => (typeof point === "number" ? point : point.momentum_score));
}

export function CompanyCard({
  company,
  history,
  delta = null,
  index = 0,
  compact = false,
  className,
}: CompanyCardProps) {
  const meta = momentum(company.momentum_label);
  const series = toSeries(history);
  const tint = colorForName(company.name);

  return (
    <Link
      to={`/companies/${company.slug}`}
      className={cn(
        "animate-fade-in bg-surface border-border rounded-card group block border transition-all duration-250 ease-out",
        "hover:border-border-bright hover:shadow-hover hover:-translate-y-2",
        compact ? "w-260 shrink-0 p-16" : "p-20",
        className,
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Identity */}
      <div className="flex items-start gap-12">
        <span
          aria-hidden
          className="rounded-avatar text-h3 flex size-40 shrink-0 items-center justify-center text-white"
          style={{ background: tint }}
        >
          {initialOf(company.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-body text-text-primary group-hover:text-signal-indigo truncate font-medium transition-colors duration-200">
            {company.name}
          </h3>
          <div className="text-caption text-text-secondary mt-4 flex flex-wrap items-center gap-x-8 gap-y-2">
            {company.industry && <span className="truncate">{labelOf(company.industry)}</span>}
            {company.location_hq && (
              <>
                <span aria-hidden className="text-text-muted">
                  ·
                </span>
                <span className="truncate">{company.location_hq}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* The score is the anchor of the card — biggest thing on it. */}
      <div className="mt-16 flex items-end justify-between gap-12">
        <div className="flex items-baseline gap-8">
          <MomentumScore
            score={company.momentum_score}
            level={company.momentum_label}
            size={compact ? "sm" : "lg"}
          />
          {/* The list endpoint carries no delta, so callers pass one only when
              they actually have it. A dash on every card is noise, not data. */}
          {delta !== null && <ScoreDelta delta={delta} />}
        </div>
        <MomentumBadge level={company.momentum_label} />
      </div>

      {/* Trend + jobs. The sparkline slot collapses when there is no history
          rather than printing "no trend yet" down the whole grid. */}
      <div className="border-border mt-16 flex items-center justify-between gap-12 border-t pt-16">
        {series.length >= 2 ? (
          <Sparkline data={series} color={meta.cssVar} width={compact ? 96 : 120} />
        ) : (
          <span />
        )}
        <span className="text-mono text-text-secondary whitespace-nowrap">
          {formatCount(company.active_job_count)} {company.active_job_count === 1 ? "job" : "jobs"}
        </span>
      </div>
    </Link>
  );
}
