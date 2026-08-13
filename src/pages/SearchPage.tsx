import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventTypeBadge } from "@/components/ui/EventTypeBadge";
import { MomentumBadge } from "@/components/ui/MomentumScore";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlState } from "@/hooks/useUrlState";
import { searchApi } from "@/lib/api";
import { label as labelOf } from "@/lib/constants";
import { formatScore, relativeTime, setPageTitle } from "@/lib/utils";
import type { SearchType } from "@/types";

export function SearchPage() {
  const { get, getNumber, patch } = useUrlState();
  const query = get("q");
  const type = (get("type", "all") || "all") as SearchType;
  const page = getNumber("page", 1);

  const [draft, setDraft] = useState(query);
  const debounced = useDebounce(draft, 300);

  useEffect(() => setPageTitle(query ? `“${query}”` : "Search"), [query]);

  useEffect(() => {
    if (debounced !== query) patch({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // Keep the box in step when the URL changes from elsewhere (back button).
  useEffect(() => setDraft(query), [query]);

  const { data, isPending, isError } = useQuery({
    queryKey: ["search", { query, type, page }],
    queryFn: () => searchApi.query({ q: query, type, page, per_page: 20 }),
    enabled: query.trim().length >= 2,
    placeholderData: keepPreviousData,
  });

  const tabs = [
    { value: "all" as const, label: "All", badge: data?.total },
    { value: "company" as const, label: "Companies", badge: data?.companies.total },
    { value: "job" as const, label: "Jobs", badge: data?.jobs.total },
    { value: "event" as const, label: "Signals", badge: data?.events.total },
  ];

  const showCompanies = type === "all" || type === "company";
  const showJobs = type === "all" || type === "job";
  const showEvents = type === "all" || type === "event";

  const totalPages = type === "all" ? 1 : (data ? Math.ceil(data.total / data.per_page) : 1);

  return (
    <div className="pb-32">
      <PageHeader title="Search" />

      <SearchInput
        value={draft}
        onChange={setDraft}
        size="lg"
        autoFocus
        placeholder="Search companies, jobs and signals…"
        className="max-w-720"
      />

      {query.trim().length < 2 ? (
        <EmptyState
          icon={Search}
          title="What are you looking for?"
          description="Search across every tracked company, open role and extracted signal."
        />
      ) : (
        <>
          <Tabs
            className="mt-32"
            tabs={tabs}
            active={type}
            onChange={(value) => patch({ type: value, page: undefined })}
          />

          <div className="pt-24">
            {isPending && !data ? (
              <div className="space-y-12">
                <Skeleton height="64px" />
                <Skeleton height="64px" />
                <Skeleton height="64px" />
              </div>
            ) : isError ? (
              <EmptyState icon={Search} title="Search failed" description="Try again in a moment." />
            ) : data && data.total === 0 ? (
              <EmptyState
                icon={Search}
                title={`No results for “${query}”`}
                description="Check the spelling, or try a shorter query."
              />
            ) : (
              <div className="flex flex-col gap-32">
                {showCompanies && data && data.companies.items.length > 0 && (
                  <Section
                    title="Companies"
                    total={data.companies.total}
                    showAll={type === "all" && data.companies.total > data.companies.items.length}
                    onShowAll={() => patch({ type: "company" })}
                  >
                    {data.companies.items.map((company) => (
                      <ResultRow
                        key={company.id}
                        to={`/companies/${company.slug}`}
                        title={<Highlight text={company.name} query={query} />}
                        meta={[company.industry && labelOf(company.industry), company.stage && labelOf(company.stage)]
                          .filter(Boolean)
                          .join(" · ")}
                        trailing={
                          <span className="flex items-center gap-8">
                            <span className="text-mono text-text-secondary tabular-nums">
                              {formatScore(company.momentum_score)}
                            </span>
                            <MomentumBadge level={company.momentum_label} />
                          </span>
                        }
                      />
                    ))}
                  </Section>
                )}

                {showJobs && data && data.jobs.items.length > 0 && (
                  <Section
                    title="Jobs"
                    total={data.jobs.total}
                    showAll={type === "all" && data.jobs.total > data.jobs.items.length}
                    onShowAll={() => patch({ type: "job" })}
                  >
                    {data.jobs.items.map((job) => (
                      <ResultRow
                        key={job.id}
                        to={job.company_slug ? `/companies/${job.company_slug}?tab=jobs` : "/jobs"}
                        title={<Highlight text={job.title} query={query} />}
                        meta={[
                          job.company_name,
                          job.seniority && labelOf(job.seniority),
                          job.work_mode && labelOf(job.work_mode),
                          job.location_raw,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                        trailing={
                          <span className="text-mono-sm text-text-muted">
                            {relativeTime(job.first_seen_at)}
                          </span>
                        }
                      />
                    ))}
                  </Section>
                )}

                {showEvents && data && data.events.items.length > 0 && (
                  <Section
                    title="Signals"
                    total={data.events.total}
                    showAll={type === "all" && data.events.total > data.events.items.length}
                    onShowAll={() => patch({ type: "event" })}
                  >
                    {data.events.items.map((event) => (
                      <ResultRow
                        key={event.id}
                        to={event.company_slug ? `/companies/${event.company_slug}?tab=events` : "/events"}
                        title={<Highlight text={event.title} query={query} />}
                        meta={event.company_name ?? ""}
                        trailing={<EventTypeBadge type={event.event_type} />}
                      />
                    ))}
                  </Section>
                )}
              </div>
            )}
          </div>

          {type !== "all" && totalPages > 1 && (
            <Pagination
              className="mt-32"
              page={page}
              totalPages={totalPages}
              onChange={(next) => patch({ page: next })}
            />
          )}
        </>
      )}
    </div>
  );
}

function Section({
  title,
  total,
  showAll,
  onShowAll,
  children,
}: {
  title: string;
  total: number;
  showAll: boolean;
  onShowAll: () => void;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-12 flex items-baseline justify-between gap-12">
        <h2 className="text-mono-sm text-text-muted uppercase">
          {title} <span className="text-text-secondary">{total}</span>
        </h2>
        {showAll && (
          <button
            type="button"
            onClick={onShowAll}
            className="text-mono-sm text-signal-indigo hover:text-indigo-light transition-colors duration-150"
          >
            See all {total} →
          </button>
        )}
      </div>
      <div className="bg-surface border-border rounded-card divide-border divide-y border">
        {children}
      </div>
    </section>
  );
}

function ResultRow({
  to,
  title,
  meta,
  trailing,
}: {
  to: string;
  title: ReactNode;
  meta: string;
  trailing?: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="hover:bg-surface-raised flex items-center gap-16 p-16 transition-colors duration-150"
    >
      <span className="min-w-0 flex-1">
        <span className="text-body-sm text-text-primary block truncate font-medium">{title}</span>
        {meta && <span className="text-mono-sm text-text-muted block truncate">{meta}</span>}
      </span>
      {trailing && <span className="shrink-0">{trailing}</span>}
    </Link>
  );
}

/** Wraps every case-insensitive occurrence of the query in a <mark>. */
function Highlight({ text, query }: { text: string; query: string }) {
  const parts = useMemo(() => {
    const needle = query.trim();
    if (!needle) return [text];
    // Escape so a query like "C++" cannot blow up the regex.
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.split(new RegExp(`(${escaped})`, "ig"));
  }, [text, query]);

  const needle = query.trim().toLowerCase();

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === needle ? (
          <mark key={index} className="bg-indigo-15 text-signal-indigo rounded-input px-2">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}
