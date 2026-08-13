import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CompanyCard } from "@/components/cards/CompanyCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Dropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { MomentumBadge } from "@/components/ui/MomentumScore";
import { Pagination } from "@/components/ui/Pagination";
import { PillButton } from "@/components/ui/PillButton";
import { SearchInput } from "@/components/ui/SearchInput";
import { CompanyCardSkeleton } from "@/components/ui/Skeleton";
import { Toggle } from "@/components/ui/Toggle";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlState } from "@/hooks/useUrlState";
import { companiesApi, dashboardApi } from "@/lib/api";
import { label as labelOf, STAGE_OPTIONS } from "@/lib/constants";
import { cn, formatCount, formatScore, setPageTitle } from "@/lib/utils";
import type { CompanyListItem, CompanySortField, SortOrder, Stage } from "@/types";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "momentum_score:desc", label: "Highest score" },
  { value: "momentum_score:asc", label: "Lowest score" },
  { value: "active_jobs:desc", label: "Most jobs" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "created_at:desc", label: "Recently added" },
];

export function CompaniesPage() {
  const navigate = useNavigate();
  const { get, getNumber, getBool, patch, clear, params } = useUrlState();
  const searchRef = useRef<HTMLInputElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => setPageTitle("Companies"), []);

  // Local mirror so typing stays instant; the URL updates on the debounce.
  const [searchDraft, setSearchDraft] = useState(() => get("search"));
  const debouncedSearch = useDebounce(searchDraft, 300);

  useEffect(() => {
    if (debouncedSearch !== get("search")) patch({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // "/" focuses search, the way it does on every list-heavy site.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable=true]")) return;
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const view = get("view", "grid") === "list" ? "list" : "grid";
  const page = getNumber("page", 1);
  const perPage = getNumber("per_page", 24);
  const industry = get("industry");
  const stage = get("stage") as Stage | "";
  const minScore = getNumber("min_score", 0);
  const hasActiveJobs = getBool("has_active_jobs");
  const [sortBy, sortOrder] = (get("sort", "momentum_score:desc").split(":") as [
    CompanySortField,
    SortOrder,
  ]);

  const { data: industriesData } = useQuery({
    queryKey: ["dashboard", "industries"],
    queryFn: dashboardApi.industries,
    staleTime: 5 * 60_000,
  });

  const { data, isPending, isError, error } = useQuery({
    queryKey: [
      "companies",
      { page, perPage, industry, stage, minScore, hasActiveJobs, sortBy, sortOrder, search: get("search") },
    ],
    queryFn: () =>
      companiesApi.list({
        page,
        per_page: perPage,
        industry: industry || undefined,
        stage: stage || undefined,
        min_score: minScore > 0 ? minScore : undefined,
        has_active_jobs: hasActiveJobs || undefined,
        search: get("search") || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
    // Keeps the previous page on screen while the next one loads, instead of
    // flashing the whole grid back to skeletons on every filter change.
    placeholderData: keepPreviousData,
  });

  const companies = data?.items ?? [];
  const hasFilters =
    Boolean(industry || stage || get("search")) || minScore > 0 || hasActiveJobs;
  // Search is always on screen, so it is not counted on the mobile badge —
  // the badge is about what is hidden behind the toggle.
  const activeFilterCount =
    (industry ? 1 : 0) + (stage ? 1 : 0) + (minScore > 0 ? 1 : 0) + (hasActiveJobs ? 1 : 0);

  const industryOptions = [
    { value: "", label: "All industries" },
    ...(industriesData?.industries ?? []).map((row) => ({
      value: row.name,
      label: `${labelOf(row.name)} (${row.count})`,
    })),
  ];

  const columns: Column<CompanyListItem>[] = [
    {
      key: "name",
      header: "Company",
      render: (row) => <span className="text-text-primary font-medium">{row.name}</span>,
      sortable: true,
    },
    {
      key: "momentum_score",
      header: "Score",
      sortable: true,
      render: (row) => (
        <span className="text-mono tabular-nums">{formatScore(row.momentum_score)}</span>
      ),
    },
    {
      key: "level",
      header: "Momentum",
      render: (row) => <MomentumBadge level={row.momentum_label} />,
    },
    {
      key: "active_jobs",
      header: "Jobs",
      sortable: true,
      render: (row) => <span className="text-mono tabular-nums">{row.active_job_count}</span>,
    },
    {
      key: "industry",
      header: "Industry",
      render: (row) => (
        <span className="text-text-secondary">{row.industry ? labelOf(row.industry) : "—"}</span>
      ),
    },
  ];

  return (
    <div className="pb-32">
      <PageHeader
        title="Companies"
        subtitle="Ranked by hiring momentum, computed from public signals."
        actions={
          <div className="border-border rounded-pill flex items-center gap-2 border p-2">
            <ViewButton
              active={view === "grid"}
              label="Grid view"
              icon={LayoutGrid}
              onClick={() => patch({ view: "grid", page })}
            />
            <ViewButton
              active={view === "list"}
              label="List view"
              icon={List}
              onClick={() => patch({ view: "list", page })}
            />
          </div>
        }
      />

      {/* Filter bar. Search stays visible at every width; the rest collapses
          behind a toggle on mobile so the controls do not eat the first
          screenful before a single company is visible. */}
      <div className="bg-surface border-border rounded-card mb-24 border p-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
          <div className="flex items-center gap-12">
            <SearchInput
              ref={searchRef}
              value={searchDraft}
              onChange={setSearchDraft}
              placeholder="Search companies…  (press /)"
              className="min-w-0 flex-1 lg:max-w-320"
            />
            <PillButton
              variant="outlined"
              size="sm"
              active={filtersOpen}
              className="shrink-0 lg:hidden"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="size-14" aria-hidden />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-signal-indigo text-text-on-indigo rounded-pill ml-2 px-6 py-2 text-mono-xs">
                  {activeFilterCount}
                </span>
              )}
            </PillButton>
          </div>

          <div className={cn("flex-wrap items-center gap-12", filtersOpen ? "flex" : "hidden lg:flex")}>
            <Select
              label="Industry"
              value={industry}
              options={industryOptions}
              onChange={(value) => patch({ industry: value })}
            />
            <Select
              label="Stage"
              value={stage}
              options={[{ value: "", label: "All stages" }, ...STAGE_OPTIONS]}
              onChange={(value) => patch({ stage: value })}
            />
            <Select
              label="Sort by"
              value={`${sortBy}:${sortOrder}`}
              options={SORT_OPTIONS}
              onChange={(value) => patch({ sort: value })}
            />
          </div>
        </div>

        <div
          className={cn(
            "border-border mt-16 flex-wrap items-center gap-24 border-t pt-16",
            filtersOpen ? "flex" : "hidden lg:flex",
          )}
        >
          <label className="flex items-center gap-12">
            <span className="text-mono-sm text-text-muted uppercase">Min score</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={minScore}
              onChange={(event) => patch({ min_score: event.target.value })}
              className="accent-signal-indigo w-140"
              aria-label="Minimum momentum score"
            />
            <span className="text-mono text-text-primary w-24 tabular-nums">{minScore}</span>
          </label>

          <Toggle
            checked={hasActiveJobs}
            onChange={(checked) => patch({ has_active_jobs: checked ? "true" : "" })}
            label="Has active jobs"
          />

          {hasFilters && (
            <PillButton
              variant="outlined"
              size="sm"
              className="ml-auto"
              onClick={() => {
                setSearchDraft("");
                clear(["view"]);
              }}
            >
              Clear filters
            </PillButton>
          )}
        </div>
      </div>

      {/* Result count */}
      <p className="text-mono text-text-secondary mb-16">
        {isPending && !data
          ? "Loading…"
          : `${formatCount(data?.total ?? 0)} ${data?.total === 1 ? "company" : "companies"}`}
      </p>

      {isError ? (
        <EmptyState
          icon={SlidersHorizontal}
          title="Couldn't load companies"
          description={error instanceof Error ? error.message : undefined}
        />
      ) : isPending && !data ? (
        <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <CompanyCardSkeleton key={index} />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          icon={SlidersHorizontal}
          title="No companies match your filters"
          description="Try widening the score range or clearing the industry filter."
          action={
            hasFilters
              ? {
                  label: "Clear filters",
                  onClick: () => {
                    setSearchDraft("");
                    clear(["view"]);
                  },
                }
              : undefined
          }
        />
      ) : view === "grid" ? (
        <div
          // Re-keyed on the query so cards remount and re-stagger when filters change.
          key={params.toString()}
          className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3"
        >
          {companies.map((company, index) => (
            <CompanyCard key={company.id} company={company} index={index} />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={companies}
          rowKey={(row) => row.id}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(key) => {
            const nextOrder = sortBy === key && sortOrder === "desc" ? "asc" : "desc";
            patch({ sort: `${key}:${nextOrder}` });
          }}
          onRowClick={(row) => navigate(`/companies/${row.slug}`)}
        />
      )}

      {data && data.total_pages > 1 && (
        <Pagination
          className="mt-32"
          page={page}
          totalPages={data.total_pages}
          hasNext={data.has_next}
          hasPrev={data.has_prev}
          onChange={(next) => patch({ page: next })}
          perPage={perPage}
          onPerPageChange={(next) => patch({ per_page: next, page: 1 })}
        />
      )}
    </div>
  );
}

function ViewButton({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: typeof LayoutGrid;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "rounded-pill p-8 transition-colors duration-150",
        active ? "bg-indigo-10 text-signal-indigo" : "text-text-muted hover:text-text-primary",
      )}
    >
      <Icon className="size-16" aria-hidden />
    </button>
  );
}
