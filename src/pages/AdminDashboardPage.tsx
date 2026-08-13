import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Building2, Inbox, Mail, RefreshCw, Rss, Users, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PillButton, pillClasses } from "@/components/ui/PillButton";
import { Skeleton, StatCardSkeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/context/ToastContext";
import { adminApi, errorMessage } from "@/lib/api";
import { label as labelOf } from "@/lib/constants";
import { cn, formatDate, prettyUrl, relativeTime, setPageTitle } from "@/lib/utils";
import type { CrawlerHealthRow, Source } from "@/types";

export function AdminDashboardPage() {
  useEffect(() => setPageTitle("Admin"), []);

  return (
    <div className="flex flex-col gap-48 pb-32">
      <PageHeader
        title="Admin"
        subtitle="Instance health, crawl status and the review queue."
        actions={
          <Link to="/admin/newsletter" className={pillClasses({ variant: "outlined", size: "sm" })}>
            <Mail className="size-14" aria-hidden />
            Newsletter
          </Link>
        }
      />
      <MetricsRow />
      <PendingQueue />
      <CrawlerHealth />
    </div>
  );
}

/* ── Metrics ──────────────────────────────────────────────────────────── */

function MetricsRow() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: adminApi.metrics,
  });

  if (isError) return <EmptyState title="Couldn't load metrics" />;

  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-16 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  const pending = data.sources_by_status?.pending ?? 0;

  return (
    <div className="grid grid-cols-2 gap-16 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard label="Companies" value={data.total_companies} icon={Building2} hint={`${data.active_companies} active`} />
      <StatCard label="Sources" value={data.total_sources} icon={Rss} hint={`${pending} awaiting review`} />
      <StatCard label="Active jobs" value={data.active_jobs} icon={Briefcase} hint={`${data.closed_jobs} closed`} />
      <StatCard label="Signals" value={data.total_events} icon={Zap} />
      <StatCard label="Subscribers" value={data.total_subscribers} icon={Mail} />
      <StatCard label="Users" value={data.total_users} icon={Users} />
    </div>
  );
}

/* ── Pending queue ────────────────────────────────────────────────────── */

function PendingQueue() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [rejecting, setRejecting] = useState<Source | null>(null);
  const [reason, setReason] = useState("");

  const { data, isPending } = useQuery({
    queryKey: ["admin", "sources", "pending"],
    queryFn: () => adminApi.pendingSources({ per_page: 50 }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "sources", "pending"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "metrics"] });
  };

  const approve = useMutation({
    mutationFn: (id: string) => adminApi.approveSource(id),
    onSuccess: () => {
      toast.success("Source approved and queued for crawling");
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error, "Could not approve")),
  });

  const reject = useMutation({
    mutationFn: ({ id, why }: { id: string; why: string }) => adminApi.rejectSource(id, why),
    onSuccess: () => {
      toast.success("Source rejected");
      setRejecting(null);
      setReason("");
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error, "Could not reject")),
  });

  const sources = data?.items ?? [];

  return (
    <section>
      <h2 className="text-h2 text-text-primary mb-16">
        Review queue
        {sources.length > 0 && (
          <span className="text-mono text-momentum-amber ml-12 align-middle">{sources.length}</span>
        )}
      </h2>

      {isPending ? (
        <div className="space-y-12">
          <Skeleton height="80px" />
          <Skeleton height="80px" />
        </div>
      ) : sources.length === 0 ? (
        <EmptyState icon={Inbox} title="Queue is empty" description="No sources are waiting for review." />
      ) : (
        <ul className="flex flex-col gap-12">
          {sources.map((source) => (
            <li
              key={source.id}
              className="bg-surface border-border rounded-card flex flex-wrap items-center gap-12 border p-16"
            >
              <div className="min-w-0 flex-1">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-mono text-text-primary hover:text-signal-indigo block truncate transition-colors duration-150"
                >
                  {prettyUrl(source.url, 64)}
                </a>
                <p className="text-mono-sm text-text-muted mt-4">
                  {labelOf(source.source_type)} · {labelOf(source.fetch_tier)} · submitted{" "}
                  {formatDate(source.created_at)}
                </p>
              </div>

              <div className="flex gap-8">
                <PillButton
                  size="sm"
                  disabled={approve.isPending}
                  onClick={() => approve.mutate(source.id)}
                >
                  Approve
                </PillButton>
                <PillButton
                  variant="outlined"
                  size="sm"
                  className="hover:border-signal-red hover:text-signal-red"
                  onClick={() => setRejecting(source)}
                >
                  Reject
                </PillButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        label="Reject source"
        maxWidth="max-w-480"
      >
        <div className="p-32">
          <h2 className="text-h3 text-text-primary">Reject this source</h2>
          <p className="text-mono-sm text-text-muted mt-8 break-all">
            {rejecting && prettyUrl(rejecting.url, 60)}
          </p>
          <label className="mt-24 block">
            <span className="text-mono-sm text-text-muted uppercase">Reason</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="Shown to whoever submitted it."
              className="bg-void border-border rounded-input text-body-sm text-text-primary focus:border-signal-indigo mt-8 w-full resize-y border px-16 py-12 transition-colors duration-150 outline-none"
            />
          </label>
          <div className="mt-24 flex justify-end gap-8">
            <PillButton variant="outlined" onClick={() => setRejecting(null)}>
              Cancel
            </PillButton>
            <PillButton
              disabled={!reason.trim() || reject.isPending}
              onClick={() => rejecting && reject.mutate({ id: rejecting.id, why: reason.trim() })}
            >
              {reject.isPending ? "Rejecting…" : "Reject"}
            </PillButton>
          </div>
        </div>
      </Modal>
    </section>
  );
}

/* ── Crawler health ───────────────────────────────────────────────────── */

type HealthSort = "consecutive_failures" | "last_crawl_at";

function CrawlerHealth() {
  const toast = useToast();
  const [onlyFailing, setOnlyFailing] = useState(false);
  const [sortBy, setSortBy] = useState<HealthSort>("consecutive_failures");

  const { data, isPending, isError } = useQuery({
    queryKey: ["admin", "crawler-health", onlyFailing],
    queryFn: () => adminApi.crawlerHealth({ limit: 200, only_failing: onlyFailing }),
  });

  const crawlNow = useMutation({
    mutationFn: (id: string) => adminApi.crawlNow(id),
    onSuccess: () => toast.success("Crawl queued"),
    onError: (error) => toast.error(errorMessage(error, "Could not queue crawl")),
  });

  const rows = useMemo(() => {
    const list = [...(data ?? [])];
    list.sort((a, b) => {
      if (sortBy === "consecutive_failures") {
        return b.consecutive_failures - a.consecutive_failures;
      }
      // Never-crawled sorts to the top: it is the most urgent, not the least.
      const aTime = a.last_crawl_at ? new Date(a.last_crawl_at).getTime() : 0;
      const bTime = b.last_crawl_at ? new Date(b.last_crawl_at).getTime() : 0;
      return aTime - bTime;
    });
    return list;
  }, [data, sortBy]);

  const columns: Column<CrawlerHealthRow>[] = [
    {
      key: "status",
      header: "",
      className: "w-24",
      render: (row) => <HealthDot failures={row.consecutive_failures} status={row.status} />,
    },
    {
      key: "url",
      header: "Source",
      render: (row) => (
        <a
          href={row.url}
          target="_blank"
          rel="noreferrer noopener"
          className="text-mono text-text-primary hover:text-signal-indigo transition-colors duration-150"
          title={row.url}
        >
          {prettyUrl(row.url, 44)}
        </a>
      ),
    },
    {
      key: "company",
      header: "Company",
      render: (row) => (
        <span className="text-text-secondary">{row.company_name ?? "— global —"}</span>
      ),
    },
    {
      key: "tier",
      header: "Tier",
      render: (row) => <span className="text-mono-sm">{labelOf(row.fetch_tier)}</span>,
    },
    {
      key: "last_crawl_at",
      header: "Last crawl",
      sortable: true,
      render: (row) => (
        <span className="text-mono-sm text-text-secondary" title={formatDate(row.last_crawl_at)}>
          {relativeTime(row.last_crawl_at)}
        </span>
      ),
    },
    {
      key: "next_crawl_at",
      header: "Next crawl",
      render: (row) => (
        <span className="text-mono-sm text-text-muted" title={formatDate(row.next_crawl_at)}>
          {relativeTime(row.next_crawl_at)}
        </span>
      ),
    },
    {
      key: "consecutive_failures",
      header: "Fails",
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            "text-mono tabular-nums",
            row.consecutive_failures > 7
              ? "text-signal-red"
              : row.consecutive_failures > 3
                ? "text-momentum-amber"
                : "text-text-secondary",
          )}
          title={row.last_failure_reason ?? undefined}
        >
          {row.consecutive_failures}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <PillButton
          variant="outlined"
          size="sm"
          disabled={crawlNow.isPending}
          onClick={() => crawlNow.mutate(row.source_id)}
        >
          <RefreshCw className="size-12" aria-hidden />
          Crawl
        </PillButton>
      ),
    },
  ];

  return (
    <section>
      <div className="mb-16 flex flex-wrap items-center justify-between gap-16">
        <h2 className="text-h2 text-text-primary">Crawler health</h2>
        <div className="flex items-center gap-16">
          <Toggle checked={onlyFailing} onChange={setOnlyFailing} label="Only failing" />
        </div>
      </div>

      {isPending ? (
        <div className="space-y-8">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} variant="table-row" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState title="Couldn't load crawler health" />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(row) => row.source_id}
          sortBy={sortBy}
          sortOrder="desc"
          onSort={(key) => setSortBy(key as HealthSort)}
          emptyTitle={onlyFailing ? "Nothing is failing" : "No sources"}
          emptyDescription={onlyFailing ? "Every source crawled cleanly last time round." : undefined}
        />
      )}
    </section>
  );
}

function HealthDot({ failures, status }: { failures: number; status: string }) {
  const disabled = status === "disabled";
  const tone = disabled || failures > 7 ? "bg-signal-red" : failures > 3 ? "bg-momentum-amber" : "bg-signal-green";
  const title = disabled
    ? "Disabled"
    : failures > 7
      ? `Failing — ${failures} consecutive`
      : failures > 3
        ? `Unstable — ${failures} consecutive failures`
        : "Healthy";

  return (
    <span
      className={cn("block size-8 rounded-avatar", tone)}
      title={title}
      role="img"
      aria-label={title}
    />
  );
}
