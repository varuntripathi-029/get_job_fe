import { EmptyState } from "@/components/ui/EmptyState";
import { label as labelOf, SERIES_COLORS } from "@/lib/constants";
import { cn, formatCount } from "@/lib/utils";

export interface JobBreakdownDatum {
  family: string;
  count: number;
}

interface JobBreakdownChartProps {
  data: JobBreakdownDatum[];
  className?: string;
}

/** One stacked bar showing the shape of a company's open roles, with a pill
 * legend beneath. A single bar reads faster than twelve tiny ones when the
 * question is "what kind of company is this hiring-wise". */
export function JobBreakdownChart({ data, className }: JobBreakdownChartProps) {
  const rows = data.filter((row) => row.count > 0).sort((a, b) => b.count - a.count);
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  if (total === 0) {
    return <EmptyState title="No open roles" description="Nothing is currently listed for this company." />;
  }

  return (
    <div className={cn("flex flex-col gap-16", className)}>
      <div className="rounded-pill flex h-24 w-full overflow-hidden" role="img" aria-label="Open roles by function">
        {rows.map((row, index) => (
          <div
            key={row.family}
            className="h-full transition-opacity duration-200 hover:opacity-80"
            title={`${labelOf(row.family)}: ${row.count}`}
            style={{
              width: `${(row.count / total) * 100}%`,
              background: SERIES_COLORS[index % SERIES_COLORS.length],
            }}
          />
        ))}
      </div>

      <ul className="flex flex-wrap gap-x-16 gap-y-8">
        {rows.map((row, index) => (
          <li key={row.family} className="flex items-center gap-6">
            <span
              aria-hidden
              className="rounded-avatar size-8 shrink-0"
              style={{ background: SERIES_COLORS[index % SERIES_COLORS.length] }}
            />
            <span className="text-mono-sm text-text-secondary">
              {labelOf(row.family)}
              <span className="text-text-muted ml-6 tabular-nums">{formatCount(row.count)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
