import { useQuery } from "@tanstack/react-query";
import { GitCompare, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ComparisonChart, type ComparisonSeries } from "@/components/charts/ComparisonChart";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { MomentumBadge } from "@/components/ui/MomentumScore";
import { SearchInput } from "@/components/ui/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlState } from "@/hooks/useUrlState";
import { companiesApi } from "@/lib/api";
import { label as labelOf, momentum, SERIES_COLORS } from "@/lib/constants";
import { cn, formatScore, setPageTitle } from "@/lib/utils";
import type { CompanyComparison } from "@/types";

const MAX_COMPANIES = 5;

export function ComparisonPage() {
  const { getAll, patch } = useUrlState();
  // `slugs` is what the backend expects; the design doc called it `ids`.
  const slugs = getAll("slugs").slice(0, MAX_COMPANIES);

  useEffect(() => setPageTitle("Compare companies"), []);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["companies", "compare", slugs],
    queryFn: () => companiesApi.compare(slugs),
    enabled: slugs.length >= 2,
  });

  const companies = data?.companies ?? [];

  const series: ComparisonSeries[] = companies.map((company, index) => ({
    name: company.name,
    data: company.score_history ?? [],
    color: SERIES_COLORS[index % SERIES_COLORS.length],
  }));

  const remove = (slug: string) => patch({ slugs: slugs.filter((item) => item !== slug) });
  const add = (slug: string) => {
    if (slugs.includes(slug) || slugs.length >= MAX_COMPANIES) return;
    patch({ slugs: [...slugs, slug] });
  };

  return (
    <div className="pb-32">
      <PageHeader
        title="Compare"
        subtitle={`Put up to ${MAX_COMPANIES} companies side by side.`}
      />

      <CompanyPicker onAdd={add} disabled={slugs.length >= MAX_COMPANIES} selected={slugs} />

      {slugs.length < 2 ? (
        <EmptyState
          icon={GitCompare}
          title="Pick at least two companies"
          description="Search above, or hit Compare on any company page to start from there."
        />
      ) : isPending ? (
        <div className="mt-24 space-y-16">
          <Skeleton variant="chart" />
          <Skeleton height="240px" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={GitCompare}
          title="Couldn't load the comparison"
          description={error instanceof Error ? error.message : undefined}
        />
      ) : (
        <>
          <section className="bg-surface border-border rounded-card mt-24 border p-24">
            <h2 className="text-mono-sm text-text-muted mb-16 uppercase">Momentum over time</h2>
            <ComparisonChart companies={series} />
          </section>

          <ComparisonTable companies={companies} colors={SERIES_COLORS} onRemove={remove} />
        </>
      )}
    </div>
  );
}

/* ── Picker ───────────────────────────────────────────────────────────── */

function CompanyPicker({
  onAdd,
  disabled,
  selected,
}: {
  onAdd: (slug: string) => void;
  disabled: boolean;
  selected: string[];
}) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 300);

  const { data } = useQuery({
    queryKey: ["companies", "picker", debounced],
    queryFn: () => companiesApi.list({ search: debounced, per_page: 8 }),
    enabled: debounced.trim().length >= 2,
  });

  const results = (data?.items ?? []).filter((company) => !selected.includes(company.slug));

  return (
    <div className="relative max-w-420">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={disabled ? `Maximum ${MAX_COMPANIES} companies` : "Add a company…"}
        disabled={disabled}
      />
      {!disabled && results.length > 0 && debounced.trim().length >= 2 && (
        <ul className="animate-scale-in bg-surface border-border-bright rounded-card shadow-hover z-dropdown absolute inset-x-0 top-full mt-8 border p-4">
          {results.map((company) => (
            <li key={company.id}>
              <button
                type="button"
                onClick={() => {
                  onAdd(company.slug);
                  setQuery("");
                }}
                className="text-body-sm text-text-primary rounded-input hover:bg-surface-raised flex w-full items-center gap-8 px-12 py-8 text-left transition-colors duration-150"
              >
                <Plus className="text-text-muted size-14 shrink-0" aria-hidden />
                <span className="flex-1 truncate">{company.name}</span>
                <span className="text-mono-sm text-text-muted">
                  {formatScore(company.momentum_score)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Table ────────────────────────────────────────────────────────────── */

function ComparisonTable({
  companies,
  colors,
  onRemove,
}: {
  companies: CompanyComparison[];
  colors: string[];
  onRemove: (slug: string) => void;
}) {
  const rows: { label: string; render: (company: CompanyComparison) => React.ReactNode }[] = [
    {
      label: "Momentum score",
      render: (company) => (
        <div>
          <span className={cn("text-score-sm tabular-nums", momentum(company.momentum_label).text)}>
            {formatScore(company.momentum_score)}
          </span>
          <div className="bg-surface-raised rounded-pill mt-8 h-6 overflow-hidden">
            <div
              className="h-full rounded-pill transition-[width] duration-500 ease-out"
              style={{
                width: `${company.momentum_score ?? 0}%`,
                background: momentum(company.momentum_label).cssVar,
              }}
            />
          </div>
        </div>
      ),
    },
    { label: "Active jobs", render: (company) => <Value>{company.active_jobs}</Value> },
    { label: "Signals (recent)", render: (company) => <Value>{company.recent_events}</Value> },
    {
      label: "Industry",
      render: (company) => <Value>{company.industry ? labelOf(company.industry) : "—"}</Value>,
    },
    {
      label: "Stage",
      render: (company) => <Value>{company.stage ? labelOf(company.stage) : "—"}</Value>,
    },
  ];

  return (
    <div className="-mx-16 mt-24 overflow-x-auto px-16 sm:mx-0 sm:px-0">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th scope="col" className="w-140" />
            {companies.map((company, index) => (
              <th key={company.slug} scope="col" className="min-w-180 p-12 text-left align-top">
                <div className="flex items-start justify-between gap-8">
                  <span className="min-w-0">
                    <span
                      aria-hidden
                      className="mb-8 block h-2 w-32 rounded-pill"
                      style={{ background: colors[index % colors.length] }}
                    />
                    <Link
                      to={`/companies/${company.slug}`}
                      className="text-body text-text-primary hover:text-signal-indigo block truncate font-medium transition-colors duration-150"
                    >
                      {company.name}
                    </Link>
                    <MomentumBadge level={company.momentum_label} className="mt-8" />
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(company.slug)}
                    aria-label={`Remove ${company.name} from comparison`}
                    className="text-text-muted hover:text-signal-red shrink-0 transition-colors duration-150"
                  >
                    <X className="size-14" aria-hidden />
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-border border-t">
              <th
                scope="row"
                className="text-mono-sm text-text-muted p-12 text-left align-middle font-normal uppercase"
              >
                {row.label}
              </th>
              {companies.map((company) => (
                <td key={company.slug} className="p-12 align-middle">
                  {row.render(company)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Value({ children }: { children: React.ReactNode }) {
  return <span className="text-body-sm text-text-primary tabular-nums">{children}</span>;
}
