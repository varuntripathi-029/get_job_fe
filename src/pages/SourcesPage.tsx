import { useQuery } from "@tanstack/react-query";
import { Plus, Rss } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { pillClasses } from "@/components/ui/PillButton";
import { SearchInput } from "@/components/ui/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { sourcesApi } from "@/lib/api";
import { label as labelOf } from "@/lib/constants";
import { cn, formatCount, formatDate, prettyUrl, relativeTime, setPageTitle } from "@/lib/utils";
import type { SourceBrowseItem } from "@/types";

export function SourcesPage() {
  const [filter, setFilter] = useState("");

  useEffect(() => setPageTitle("Sources"), []);

  const { data: stats } = useQuery({ queryKey: ["sources", "stats"], queryFn: sourcesApi.stats });
  const { data, isPending, isError } = useQuery({
    queryKey: ["sources", "browse"],
    queryFn: sourcesApi.browse,
  });

  const needle = filter.trim().toLowerCase();
  const groups = (data?.companies ?? []).filter(
    (group) =>
      !needle ||
      group.name.toLowerCase().includes(needle) ||
      group.sources.some((source) => source.url.toLowerCase().includes(needle)),
  );
  const globals = (data?.global_sources ?? []).filter(
    (source) => !needle || source.url.toLowerCase().includes(needle),
  );

  return (
    <div className="pb-32">
      <PageHeader
        title="Sources"
        subtitle="Everything HireSignal watches. Each one is a public page, feed or ATS board."
        actions={
          <Link to="/submit-source" className={pillClasses({ variant: "outlined", size: "sm" })}>
            <Plus className="size-14" aria-hidden />
            Submit a source
          </Link>
        }
      />

      {/* Coverage summary */}
      {stats && (
        <div className="bg-surface border-border rounded-card mb-24 border p-20">
          <p className="text-body text-text-primary">
            <span className="text-brand font-medium">{formatCount(stats.total_sources)}</span>{" "}
            sources across{" "}
            <span className="text-brand font-medium">
              {formatCount(stats.companies_with_sources)}
            </span>{" "}
            companies
            {stats.companies_without_sources > 0 && (
              <span className="text-text-muted">
                {" "}
                · {formatCount(stats.companies_without_sources)} still uncovered
              </span>
            )}
          </p>
          <div className="mt-16 flex flex-wrap gap-8">
            {Object.entries(stats.by_type)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <span
                  key={type}
                  className="rounded-pill border-border-bright text-mono-sm text-text-secondary border px-12 py-6"
                >
                  {labelOf(type)}
                  <span className="text-text-primary ml-8 tabular-nums">{formatCount(count)}</span>
                </span>
              ))}
          </div>
        </div>
      )}

      <SearchInput
        value={filter}
        onChange={setFilter}
        placeholder="Filter by company or URL…"
        className="mb-24 max-w-420"
      />

      {isPending ? (
        <div className="space-y-16">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} height="120px" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState icon={Rss} title="Couldn't load sources" />
      ) : groups.length === 0 && globals.length === 0 ? (
        <EmptyState
          icon={Rss}
          title="Nothing matches that filter"
          description="Try a different company name or domain."
        />
      ) : (
        <div className="flex flex-col gap-24">
          {globals.length > 0 && (
            <SourceGroup
              title="Global feeds"
              subtitle="Not tied to one company — these are scanned for mentions of every tracked company."
              sources={globals}
            />
          )}
          {groups.map((group) => (
            <SourceGroup
              key={group.slug}
              title={group.name}
              href={`/companies/${group.slug}`}
              sources={group.sources}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SourceGroup({
  title,
  subtitle,
  href,
  sources,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  sources: SourceBrowseItem[];
}) {
  return (
    <section className="bg-surface border-border rounded-card border">
      <div className="border-border border-b p-16">
        {href ? (
          <Link
            to={href}
            className="text-body text-text-primary hover:text-brand font-medium transition-colors duration-150"
          >
            {title}
          </Link>
        ) : (
          <h2 className="text-body text-text-primary font-medium">{title}</h2>
        )}
        {subtitle && <p className="text-caption text-text-secondary mt-4">{subtitle}</p>}
      </div>

      <ul className="divide-border divide-y">
        {sources.map((source) => (
          <li key={source.id} className="flex flex-wrap items-center gap-12 px-16 py-12">
            <StatusDot lastCrawl={source.last_crawl_at} />
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-mono text-text-primary hover:text-brand min-w-0 flex-1 truncate transition-colors duration-150"
            >
              {prettyUrl(source.url, 64)}
            </a>
            <span className="rounded-pill border-border-bright text-mono-xs text-text-secondary border px-8 py-4">
              {labelOf(source.source_type)}
            </span>
            <span
              className="text-mono-sm text-text-muted w-96 text-right"
              title={formatDate(source.last_crawl_at)}
            >
              {relativeTime(source.last_crawl_at)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StatusDot({ lastCrawl }: { lastCrawl: string | null | undefined }) {
  const hoursAgo = lastCrawl ? (Date.now() - new Date(lastCrawl).getTime()) / 3_600_000 : Infinity;
  const tone =
    hoursAgo < 24 ? "bg-signal-green" : hoursAgo < 168 ? "bg-momentum-amber" : "bg-signal-red";
  const title =
    hoursAgo < 24 ? "Crawled in the last day" : hoursAgo < 168 ? "Stale" : "Never crawled or failing";

  return (
    <span
      className={cn("size-8 shrink-0 rounded-avatar", tone)}
      title={title}
      role="img"
      aria-label={title}
    />
  );
}
