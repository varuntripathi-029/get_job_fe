import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronDown, Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { pillClasses } from "@/components/ui/PillButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { useUrlState } from "@/hooks/useUrlState";
import { sourcesApi } from "@/lib/api";
import { label as labelOf } from "@/lib/constants";
import { cn, formatDate, prettyUrl, setPageTitle } from "@/lib/utils";
import type { Source, SourceStatus } from "@/types";
import { Link } from "react-router-dom";

const STATUS_STYLES: Record<SourceStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-momentum-amber-bg", text: "text-momentum-amber", label: "PENDING" },
  approved: { bg: "bg-signal-green-bg", text: "text-signal-green", label: "APPROVED" },
  rejected: { bg: "bg-signal-red-bg", text: "text-signal-red", label: "REJECTED" },
  disabled: { bg: "bg-momentum-gray-bg", text: "text-momentum-gray", label: "DISABLED" },
};

export function SubmissionsPage() {
  const navigate = useNavigate();
  const { getNumber, patch } = useUrlState();
  const page = getNumber("page", 1);

  useEffect(() => setPageTitle("My submissions"), []);

  const { data, isPending, isError } = useQuery({
    queryKey: ["sources", "my-submissions", page],
    queryFn: () => sourcesApi.mySubmissions({ page, per_page: 20 }),
    placeholderData: keepPreviousData,
  });

  const submissions = data?.items ?? [];

  return (
    <div className="pb-32">
      <PageHeader
        title="My submissions"
        subtitle="Sources you've sent in, and where each one got to."
        actions={
          <Link to="/submit-source" className={pillClasses({ size: "sm" })}>
            Submit a source
          </Link>
        }
      />

      {isPending && !data ? (
        <div className="space-y-12">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} height="72px" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState icon={Inbox} title="Couldn't load your submissions" />
      ) : submissions.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="You haven't submitted any sources yet"
          description="Know a careers page or engineering blog we're missing? Send it over."
          action={{ label: "Submit a source", onClick: () => navigate("/submit-source") }}
        />
      ) : (
        <ul className="flex flex-col gap-12">
          {submissions.map((source) => (
            <SubmissionRow key={source.id} source={source} />
          ))}
        </ul>
      )}

      {data && data.total_pages > 1 && (
        <Pagination
          className="mt-32"
          page={page}
          totalPages={data.total_pages}
          onChange={(next) => patch({ page: next })}
        />
      )}
    </div>
  );
}

function SubmissionRow({ source }: { source: Source }) {
  const [expanded, setExpanded] = useState(false);
  const style = STATUS_STYLES[source.status] ?? STATUS_STYLES.pending;
  const canExpand = source.status === "rejected" && Boolean(source.rejection_reason);

  return (
    <li className="bg-surface border-border rounded-card border p-16">
      <div className="flex flex-wrap items-center gap-12">
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
        <span
          className={cn("rounded-pill text-mono-xs px-8 py-2 font-medium", style.bg, style.text)}
        >
          {style.label}
        </span>
      </div>

      <p className="text-mono-sm text-text-muted mt-8">Submitted {formatDate(source.created_at)}</p>

      {canExpand && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="text-mono-sm text-text-secondary hover:text-text-primary mt-12 inline-flex items-center gap-4 transition-colors duration-150"
          >
            <ChevronDown
              className={cn("size-12 transition-transform duration-200", expanded && "rotate-180")}
              aria-hidden
            />
            Why it was rejected
          </button>
          {expanded && (
            <p className="text-caption text-text-secondary border-border mt-12 border-t pt-12">
              {source.rejection_reason}
            </p>
          )}
        </>
      )}
    </li>
  );
}
