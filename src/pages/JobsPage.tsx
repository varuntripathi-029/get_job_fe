import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Briefcase, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { JobCard } from "@/components/cards/JobCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Select } from "@/components/ui/Dropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterPillGroup } from "@/components/ui/FilterPillGroup";
import { Pagination } from "@/components/ui/Pagination";
import { PillButton } from "@/components/ui/PillButton";
import { SearchInput } from "@/components/ui/SearchInput";
import { JobCardSkeleton } from "@/components/ui/Skeleton";
import { Toggle } from "@/components/ui/Toggle";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlState } from "@/hooks/useUrlState";
import { companiesApi, jobsApi } from "@/lib/api";
import { ROLE_FAMILY_OPTIONS, SENIORITY_OPTIONS, WORK_MODE_OPTIONS } from "@/lib/constants";
import { formatCount, setPageTitle } from "@/lib/utils";
import type { JobSortField, RoleFamily, Seniority, SortOrder, WorkMode } from "@/types";

const SORT_OPTIONS = [
  { value: "first_seen_at:desc", label: "Newest first" },
  { value: "first_seen_at:asc", label: "Oldest first" },
  { value: "title:asc", label: "Title A–Z" },
];

export function JobsPage() {
  const { get, getNumber, getBool, patch, clear } = useUrlState();
  const searchRef = useRef<HTMLInputElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => setPageTitle("Jobs"), []);

  const [searchDraft, setSearchDraft] = useState(() => get("search"));
  const debouncedSearch = useDebounce(searchDraft, 300);

  useEffect(() => {
    if (debouncedSearch !== get("search")) patch({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

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

  const page = getNumber("page", 1);
  const perPage = getNumber("per_page", 24);
  const roleFamily = get("role_family") as RoleFamily | "";
  const seniority = get("seniority") as Seniority | "";
  const workMode = get("work_mode") as WorkMode | "";
  const companySlug = get("company_slug");
  const isActive = getBool("is_active", true);
  const [sortBy, sortOrder] = get("sort", "first_seen_at:desc").split(":") as [JobSortField, SortOrder];

  const { data, isPending, isError, error } = useQuery({
    queryKey: [
      "jobs",
      { page, perPage, roleFamily, seniority, workMode, companySlug, isActive, sortBy, sortOrder, search: get("search") },
    ],
    queryFn: () =>
      jobsApi.list({
        page,
        per_page: perPage,
        role_family: roleFamily || undefined,
        seniority: seniority || undefined,
        work_mode: workMode || undefined,
        company_slug: companySlug || undefined,
        is_active: isActive,
        search: get("search") || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
    placeholderData: keepPreviousData,
  });

  const jobs = data?.items ?? [];
  const hasFilters = Boolean(roleFamily || seniority || workMode || companySlug || get("search")) || !isActive;

  const filters = (
    <div className="flex flex-col gap-24">
      <SearchInput
        ref={searchRef}
        value={searchDraft}
        onChange={setSearchDraft}
        placeholder="Job title…  (press /)"
      />

      <CompanyFilter
        value={companySlug}
        onChange={(slug) => patch({ company_slug: slug })}
      />

      <FilterPillGroup
        label="Function"
        options={ROLE_FAMILY_OPTIONS}
        selected={roleFamily ? [roleFamily] : []}
        onChange={(selected) => patch({ role_family: selected[0] ?? "" })}
      />
      <FilterPillGroup
        label="Seniority"
        options={SENIORITY_OPTIONS}
        selected={seniority ? [seniority] : []}
        onChange={(selected) => patch({ seniority: selected[0] ?? "" })}
      />
      <FilterPillGroup
        label="Work mode"
        options={WORK_MODE_OPTIONS}
        selected={workMode ? [workMode] : []}
        onChange={(selected) => patch({ work_mode: selected[0] ?? "" })}
      />

      <Toggle
        checked={isActive}
        onChange={(checked) => patch({ is_active: String(checked) })}
        label="Open roles only"
      />

      {hasFilters && (
        <PillButton
          variant="outlined"
          size="sm"
          onClick={() => {
            setSearchDraft("");
            clear();
          }}
        >
          Clear filters
        </PillButton>
      )}
    </div>
  );

  return (
    <div className="pb-32">
      <PageHeader
        title="Jobs"
        subtitle="Roles pulled straight from company boards, not reposted listings."
        actions={
          <PillButton
            variant="outlined"
            size="sm"
            className="lg:hidden"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal className="size-14" aria-hidden />
            Filters
          </PillButton>
        }
      />

      <div className="flex gap-32">
        {/* Desktop sidebar */}
        <aside className="w-sidebar sticky hidden shrink-0 self-start lg:block top-nav pt-24">
          {filters}
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-16 flex flex-wrap items-center justify-between gap-12">
            <p className="text-mono text-text-secondary">
              {isPending && !data
                ? "Loading…"
                : `${formatCount(data?.total ?? 0)} ${data?.total === 1 ? "job" : "jobs"}`}
            </p>
            <Select
              label="Sort by"
              value={`${sortBy}:${sortOrder}`}
              options={SORT_OPTIONS}
              onChange={(value) => patch({ sort: value })}
            />
          </div>

          {isError ? (
            <EmptyState
              icon={Briefcase}
              title="Couldn't load jobs"
              description={error instanceof Error ? error.message : undefined}
            />
          ) : isPending && !data ? (
            <div className="flex flex-col gap-12">
              {Array.from({ length: 5 }, (_, index) => (
                <JobCardSkeleton key={index} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No jobs match your filters"
              description="Try removing the seniority or work-mode filter."
              action={
                hasFilters
                  ? {
                      label: "Clear filters",
                      onClick: () => {
                        setSearchDraft("");
                        clear();
                      },
                    }
                  : undefined
              }
            />
          ) : (
            <div className="flex flex-col gap-12">
              {jobs.map((job, index) => (
                <JobCard key={job.id} job={job} index={index} />
              ))}
            </div>
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
      </div>

      {/* Mobile bottom sheet */}
      {filtersOpen && (
        <div className="z-modal fixed inset-0 lg:hidden">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: "var(--backdrop-modal)" }}
            onClick={() => setFiltersOpen(false)}
          />
          <div className="bg-surface border-border rounded-t-modal animate-slide-up max-h-sheet absolute inset-x-0 bottom-0 overflow-y-auto border-t p-24">
            <div className="mb-24 flex items-center justify-between">
              <h2 className="text-h3 text-text-primary">Filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="text-text-muted hover:text-text-primary"
              >
                <X className="size-18" aria-hidden />
              </button>
            </div>
            {filters}
            <PillButton className="mt-24 w-full" onClick={() => setFiltersOpen(false)}>
              Show {formatCount(data?.total ?? 0)} results
            </PillButton>
          </div>
        </div>
      )}
    </div>
  );
}

/** Typeahead over companies, storing the slug because that is what the jobs
 * endpoint filters on. */
function CompanyFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (slug: string) => void;
}) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 300);

  const { data } = useQuery({
    queryKey: ["companies", "filter", debounced],
    queryFn: () => companiesApi.list({ search: debounced, per_page: 8 }),
    enabled: debounced.trim().length >= 2,
  });

  if (value) {
    return (
      <div>
        <span className="text-mono-sm text-text-muted mb-8 block uppercase">Company</span>
        <PillButton variant="outlined" size="sm" active onClick={() => onChange("")}>
          {value}
          <X className="size-12" aria-hidden />
        </PillButton>
      </div>
    );
  }

  return (
    <div className="relative">
      <span className="text-mono-sm text-text-muted mb-8 block uppercase">Company</span>
      <SearchInput value={query} onChange={setQuery} placeholder="Any company" />
      {(data?.items.length ?? 0) > 0 && debounced.trim().length >= 2 && (
        <ul className="animate-scale-in bg-surface border-border-bright rounded-card shadow-hover z-dropdown absolute inset-x-0 top-full mt-8 border p-4">
          {data?.items.map((company) => (
            <li key={company.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(company.slug);
                  setQuery("");
                }}
                className="text-body-sm text-text-primary rounded-input hover:bg-surface-raised block w-full truncate px-12 py-8 text-left transition-colors duration-150"
              >
                {company.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
