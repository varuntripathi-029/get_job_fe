import { ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { EventTypeBadge } from "@/components/ui/EventTypeBadge";
import { eventMeta } from "@/lib/constants";
import { cn, formatDate, prettyUrl, relativeTime } from "@/lib/utils";
import type { Evidence, HireEvent } from "@/types";

interface EventCardProps {
  event: HireEvent;
  /** Compact drops the coloured left rail — used inside the timeline, where
   * the rail would compete with the timeline's own dots and line. */
  compact?: boolean;
  index?: number;
  className?: string;
}

function evidenceUrl(item: Evidence): string | null {
  return item.source_url ?? item.url ?? null;
}

function evidenceText(item: Evidence): string | null {
  return item.excerpt ?? item.snippet ?? item.title ?? null;
}

export function EventCard({ event, compact = false, index = 0, className }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = eventMeta(event.event_type);
  const hasEvidence = event.evidence.length > 0;

  // Occurrence date is the truth when known; observation is the fallback.
  const when = event.event_occurred_at ?? event.observed_at;

  return (
    <article
      className={cn(
        "animate-fade-in bg-surface p-16",
        compact ? "rounded-card" : cn("rounded-r-input border-l-3", meta.border),
        className,
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex flex-wrap items-center gap-8">
        <EventTypeBadge type={event.event_type} />
        {event.company_slug && event.company_name && (
          <Link
            to={`/companies/${event.company_slug}`}
            className="text-mono text-signal-indigo hover:text-indigo-light transition-colors duration-150"
          >
            {event.company_name}
          </Link>
        )}
      </div>

      <h3 className="text-body-sm text-text-primary mt-12 font-medium">{event.title}</h3>

      <div className="text-mono-sm text-text-muted mt-8 flex flex-wrap items-center gap-x-12 gap-y-4">
        <time dateTime={when} title={formatDate(when)}>
          {relativeTime(when)}
        </time>
        {event.source_count > 0 && (
          <span>
            {event.source_count} {event.source_count === 1 ? "source" : "sources"}
          </span>
        )}
        {event.extraction_confidence != null && (
          <span>{Math.round(event.extraction_confidence * 100)}% confidence</span>
        )}
      </div>

      {hasEvidence && (
        <div className="mt-12">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="text-mono-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-4 transition-colors duration-150"
          >
            <ChevronDown
              className={cn("size-12 transition-transform duration-200", expanded && "rotate-180")}
              aria-hidden
            />
            {expanded ? "Hide" : "Show"} evidence
          </button>

          {expanded && (
            <ul className="border-border mt-12 space-y-12 border-t pt-12">
              {event.evidence.map((item, itemIndex) => {
                const url = evidenceUrl(item);
                const text = evidenceText(item);
                return (
                  <li key={url ?? itemIndex} className="text-caption text-text-secondary">
                    {text && <p className="mb-4">{text}</p>}
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-mono-sm text-signal-indigo hover:text-indigo-light inline-flex items-center gap-4 break-all transition-colors duration-150"
                      >
                        {prettyUrl(url, 46)}
                        <ExternalLink className="size-11 shrink-0" aria-hidden />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}
