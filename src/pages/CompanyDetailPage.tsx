import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Building2, Briefcase, ExternalLink, Radio, Rss, Zap } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { EventCard } from "@/components/cards/EventCard";
import { JobCard } from "@/components/cards/JobCard";
import { JobBreakdownChart } from "@/components/charts/JobBreakdownChart";
import { ScoreHistoryChart } from "@/components/charts/ScoreHistoryChart";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterPillGroup } from "@/components/ui/FilterPillGroup";
import { MomentumBadge, MomentumScore, ScoreDelta } from "@/components/ui/MomentumScore";
import { Pagination } from "@/components/ui/Pagination";
import { pillClasses } from "@/components/ui/PillButton";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { StatCard } from "@/components/ui/StatCard";
import { EventCardSkeleton, JobCardSkeleton, Skeleton, StatCardSkeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { useUrlState } from "@/hooks/useUrlState";
import { companiesApi } from "@/lib/api";
import { colorForName, EVENT_TYPE_OPTIONS, label as labelOf } from "@/lib/constants";
import { cn, formatDate, initialOf, prettyUrl, relativeTime, setPageTitle } from "@/lib/utils";
import type { CompanyDetail, EventType } from "@/types";

type TabValue = "overview" | "jobs" | "events" | "sources";

const TABS = [
  { value: "overview" as const, label: "Overview" },
  { value: "jobs" as const, label: "Jobs" },
  { value: "events" as const, label: "Events" },
  { value: "sources" as const, label: "Sources" },
];

export function CompanyDetailPage() {
  const { slug = "" } = useParams();
  const { get, patch } = useUrlState();
  const tab = (TABS.some((item) => item.value === get("tab")) ? get("tab") : "overview") as TabValue;

  const { data: company, isPending, isError, error } = useQuery({
    queryKey: ["company", slug],
    queryFn: () => companiesApi.detail(slug),
    enabled: Boolean(slug),
  });

  useEffect(() => {
    if (company) setPageTitle(company.name);
  }, [company]);

  const { data: history } = useQuery({
    queryKey: ["company", slug, "score-history", 90],
    queryFn: () => companiesApi.scoreHistory(slug, { days: 90, limit: 90 }),
    enabled: Boolean(slug),
  });

  if (isPending) return <CompanyDetailSkeleton />;

  if (isError || !company) {
    return (
      <EmptyState
        icon={Building2}
        title="Company not found"
        description={error instanceof Error ? error.message : `No company matches “${slug}”.`}
      />
    );
  }

  const series = history ?? company.score_history ?? [];

  return (
    <div className="pb-32">
      <CompanyHeader company={company} />

      {/* Score history */}
      <section className="bg-surface border-border rounded-card mt-24 border p-24">
        <h2 className="text-mono-sm text-text-muted mb-16 uppercase">Momentum, last 90 days</h2>
        <ScoreHistoryChart data={series} />
      </section>

      <Tabs
        className="mt-32"
        tabs={TABS}
        active={tab}
        onChange={(value) => patch({ tab: value, page: undefined })}
      />

      <div className="pt-24">
        {tab === "overview" && <OverviewTab company={company} />}
        {tab === "jobs" && <JobsTab slug={slug} />}
        {tab === "events" && <EventsTab slug={slug} />}
        {tab === "sources" && <SourcesTab company={company} />}
      </div>
    </div>
  );
}

/* ── Header ───────────────────────────────────────────────────────────── */

function CompanyHeader({ company }: { company: CompanyDetail }) {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        className="pb-16"
        title={company.name}
        subtitle={
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            {company.industry && <Chip>{labelOf(company.industry)}</Chip>}
            {company.stage && <Chip>{labelOf(company.stage)}</Chip>}
            {company.location_hq && <span>{company.location_hq}</span>}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer noopener"
                className="text-signal-indigo hover:text-indigo-light inline-flex items-center gap-4 transition-colors duration-150"
              >
                {prettyUrl(company.website, 32)}
                <ExternalLink className="size-12" aria-hidden />
              </a>
            )}
          </div>
        }
        actions={
          <button
            type="button"
            onClick={() => navigate(`/companies/compare?slugs=${company.slug}`)}
            className={pillClasses({ variant: "outlined", size: "sm" })}
          >
            Compare
          </button>
        }
      />

      <div className="bg-surface border-border rounded-card flex flex-wrap items-center gap-32 border p-24">
        <span
          aria-hidden
          className="rounded-avatar text-h1 hidden size-64 shrink-0 items-center justify-center text-white sm:flex"
          style={{ background: colorForName(company.name) }}
        >
          {initialOf(company.name)}
        </span>

        <div className="flex-1">
          <div className="flex flex-wrap items-end gap-16">
            <MomentumScore score={company.momentum_score} level={company.momentum_label} size="lg" />
            <ScoreDelta delta={company.score_delta} size="md" />
            <MomentumBadge level={company.momentum_label} />
          </div>
          <p className="text-mono-sm text-text-muted mt-12">
            {company.scored_at ? `Last scored ${relativeTime(company.scored_at)}` : "Not scored yet"}
          </p>
          {company.description && (
            <p className="text-body-sm text-text-secondary mt-16 max-w-720">{company.description}</p>
          )}
        </div>

        {/* max-lg:hidden rather than "hidden lg:flex" — the gauge's own
            inline-flex is emitted after .hidden and would override it. */}
        <ScoreGauge
          score={company.momentum_score}
          level={company.momentum_label}
          className="max-lg:hidden"
        />
      </div>
    </>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-pill border-border-bright text-mono-xs text-text-secondary border px-8 py-4">
      {children}
    </span>
  );
}

/* ── Overview ─────────────────────────────────────────────────────────── */

function OverviewTab({ company }: { company: CompanyDetail }) {
  // The detail payload has no job breakdown, so it is derived from whatever
  // recent jobs are on hand rather than firing an extra request per role family.
  const { data: jobs } = useQuery({
    queryKey: ["company", company.slug, "jobs", "breakdown"],
    queryFn: () => companiesApi.jobs(company.slug, { per_page: 100, is_active: true }),
  });

  const breakdown = Object.entries(
    (jobs?.items ?? []).reduce<Record<string, number>>((acc, job) => {
      const family = job.role_family ?? "other";
      acc[family] = (acc[family] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([family, count]) => ({ family, count }));

  const skills = [
    ...new Set((jobs?.items ?? []).flatMap((job) => job.skills ?? [])),
  ].slice(0, 24);

  return (
    <div className="flex flex-col gap-32">
      <div className="grid grid-cols-2 gap-16 lg:grid-cols-4">
        <StatCard label="Active Jobs" value={company.active_job_count} icon={Briefcase} />
        <StatCard label="Signals" value={company.total_event_count} icon={Zap} />
        <StatCard label="Sources" value={company.sources.length} icon={Rss} />
        <StatCard
          label="Last Crawled"
          value={
            company.sources.length > 0
              ? relativeTime(
                  company.sources
                    .map((source) => source.last_crawl_at)
                    .filter(Boolean)
                    .sort()
                    .reverse()[0],
                )
              : "—"
          }
          icon={Radio}
        />
      </div>

      {company.recent_events.length > 0 && (
        <section>
          <h2 className="text-h3 text-text-primary mb-16">Recent signals</h2>
          <div className="flex flex-col gap-12">
            {company.recent_events.slice(0, 5).map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        </section>
      )}

      {breakdown.length > 0 && (
        <section>
          <h2 className="text-h3 text-text-primary mb-16">Open roles by function</h2>
          <JobBreakdownChart data={breakdown} />
        </section>
      )}

      {skills.length > 0 && (
        <section>
          <h2 className="text-h3 text-text-primary mb-16">Skills in demand</h2>
          <div className="flex flex-wrap gap-8">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-pill bg-indigo-10 text-mono-sm text-signal-indigo px-12 py-6"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ── Jobs ─────────────────────────────────────────────────────────────── */

function JobsTab({ slug }: { slug: string }) {
  const { getNumber, patch } = useUrlState();
  const page = getNumber("page", 1);

  const { data, isPending } = useQuery({
    queryKey: ["company", slug, "jobs", page],
    queryFn: () => companiesApi.jobs(slug, { page, per_page: 20, is_active: true }),
    placeholderData: keepPreviousData,
  });

  if (isPending && !data) {
    return (
      <div className="flex flex-col gap-12">
        <JobCardSkeleton />
        <JobCardSkeleton />
        <JobCardSkeleton />
      </div>
    );
  }

  const jobs = data?.items ?? [];
  if (jobs.length === 0) {
    return <EmptyState icon={Briefcase} title="No open roles" description="Nothing is listed right now." />;
  }

  return (
    <>
      <div className="flex flex-col gap-12">
        {jobs.map((job, index) => (
          <JobCard key={job.id} job={job} index={index} />
        ))}
      </div>
      {data && data.total_pages > 1 && (
        <Pagination
          className="mt-24"
          page={page}
          totalPages={data.total_pages}
          onChange={(next) => patch({ page: next })}
        />
      )}
    </>
  );
}

/* ── Events ───────────────────────────────────────────────────────────── */

function EventsTab({ slug }: { slug: string }) {
  const { get, getNumber, patch } = useUrlState();
  const page = getNumber("page", 1);
  const eventType = get("event_type") as EventType | "";

  const { data, isPending } = useQuery({
    queryKey: ["company", slug, "events", page, eventType],
    queryFn: () =>
      companiesApi.events(slug, {
        page,
        per_page: 20,
        event_type: eventType || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const events = data?.items ?? [];

  return (
    <>
      <FilterPillGroup
        className="mb-24"
        label="Signal type"
        options={EVENT_TYPE_OPTIONS}
        selected={eventType ? [eventType] : []}
        onChange={(selected) => patch({ event_type: selected[0] ?? "" })}
      />

      {isPending && !data ? (
        <div className="flex flex-col gap-12">
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No signals recorded"
          description={
            eventType
              ? "Nothing of this type. Try clearing the filter."
              : "Nothing has been extracted for this company yet."
          }
        />
      ) : (
        <div className="flex flex-col gap-12">
          {events.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </div>
      )}

      {data && data.total_pages > 1 && (
        <Pagination
          className="mt-24"
          page={page}
          totalPages={data.total_pages}
          onChange={(next) => patch({ page: next })}
        />
      )}
    </>
  );
}

/* ── Sources ──────────────────────────────────────────────────────────── */

function SourcesTab({ company }: { company: CompanyDetail }) {
  if (company.sources.length === 0) {
    return (
      <EmptyState
        icon={Rss}
        title="No sources tracked"
        description="This company has no crawl targets yet."
        action={undefined}
      />
    );
  }

  return (
    <ul className="bg-surface border-border rounded-card divide-border divide-y border">
      {company.sources.map((source) => (
        <li key={source.id} className="flex flex-wrap items-center gap-12 p-16">
          <StatusDot lastCrawl={source.last_crawl_at} />
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-mono text-text-primary hover:text-signal-indigo min-w-0 flex-1 truncate transition-colors duration-150"
          >
            {prettyUrl(source.url, 60)}
          </a>
          <span className="rounded-pill border-border-bright text-mono-xs text-text-secondary border px-8 py-4">
            {labelOf(source.source_type)}
          </span>
          <span className="text-mono-sm text-text-muted" title={formatDate(source.last_crawl_at)}>
            {relativeTime(source.last_crawl_at)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Green under a day, amber under a week, red beyond that or never crawled. */
function StatusDot({ lastCrawl }: { lastCrawl: string | null }) {
  const hoursAgo = lastCrawl ? (Date.now() - new Date(lastCrawl).getTime()) / 3_600_000 : Infinity;
  const tone =
    hoursAgo < 24 ? "bg-signal-green" : hoursAgo < 168 ? "bg-momentum-amber" : "bg-signal-red";
  const title =
    hoursAgo < 24 ? "Crawled recently" : hoursAgo < 168 ? "Getting stale" : "Stale or never crawled";

  return <span className={cn("size-8 shrink-0 rounded-avatar", tone)} title={title} role="img" aria-label={title} />;
}

/* ── Loading ──────────────────────────────────────────────────────────── */

function CompanyDetailSkeleton() {
  return (
    <div className="pt-32 pb-32">
      <Skeleton width="280px" height="36px" />
      <Skeleton width="200px" height="14px" className="mt-12" />
      <div className="bg-surface border-border rounded-card mt-24 border p-24">
        <Skeleton width="120px" height="48px" />
        <Skeleton width="320px" height="14px" className="mt-16" />
      </div>
      <Skeleton variant="chart" className="mt-24" />
      <div className="mt-32 grid grid-cols-2 gap-16 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    </div>
  );
}
