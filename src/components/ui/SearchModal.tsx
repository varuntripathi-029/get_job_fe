import { useQuery } from "@tanstack/react-query";
import { CornerDownLeft, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useDebounce } from "@/hooks/useDebounce";
import { searchApi } from "@/lib/api";
import { eventMeta, label as labelOf, momentum } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Modal } from "./Modal";
import { Skeleton } from "./Skeleton";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

interface Hit {
  id: string;
  to: string;
  title: string;
  meta: string;
  accent?: string;
  group: string;
}

const PER_GROUP = 5;

export function SearchModal({ open, onClose }: SearchModalProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const debounced = useDebounce(query, 300);

  const enabled = open && debounced.trim().length >= 2;

  const { data, isFetching } = useQuery({
    queryKey: ["search", "modal", debounced],
    queryFn: () => searchApi.query({ q: debounced.trim(), per_page: PER_GROUP }),
    enabled,
    staleTime: 30_000,
  });

  // Flattened so arrow keys can walk the whole list across group boundaries.
  const hits = useMemo<Hit[]>(() => {
    if (!data) return [];
    return [
      ...data.companies.items.map((company) => ({
        id: `company-${company.id}`,
        to: `/companies/${company.slug}`,
        title: company.name,
        meta: [company.industry && labelOf(company.industry), momentum(company.momentum_label).label]
          .filter(Boolean)
          .join(" · "),
        accent: momentum(company.momentum_label).cssVar,
        group: "Companies",
      })),
      ...data.jobs.items.map((job) => ({
        id: `job-${job.id}`,
        to: job.company_slug ? `/companies/${job.company_slug}?tab=jobs` : "/jobs",
        title: job.title,
        meta: [job.company_name, job.seniority && labelOf(job.seniority), job.location_raw]
          .filter(Boolean)
          .join(" · "),
        group: "Jobs",
      })),
      ...data.events.items.map((event) => ({
        id: `event-${event.id}`,
        to: event.company_slug ? `/companies/${event.company_slug}?tab=events` : "/events",
        title: event.title,
        meta: [event.company_name, eventMeta(event.event_type).label].filter(Boolean).join(" · "),
        accent: eventMeta(event.event_type).cssVar,
        group: "Events",
      })),
    ];
  }, [data]);

  useEffect(() => setCursor(0), [debounced]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((value) => (hits.length ? (value + 1) % hits.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((value) => (hits.length ? (value - 1 + hits.length) % hits.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = hits[cursor];
      // With no highlighted hit, Enter falls through to the full results page.
      if (hit) go(hit.to);
      else if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  let lastGroup = "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Search HireSignal"
      maxWidth="max-w-640"
      align="top"
      showClose={false}
      className="overflow-hidden"
    >
      <div className="border-border flex items-center gap-12 border-b px-20 py-16">
        <Search className="text-text-muted size-18 shrink-0" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search companies, jobs and signals…"
          aria-label="Search query"
          className="text-body text-text-primary w-full bg-transparent outline-none"
        />
        <kbd className="text-mono-xs text-text-muted border-border rounded-input hidden border px-6 py-4 sm:block">
          ESC
        </kbd>
      </div>

      <div className="max-h-400 overflow-y-auto p-8">
        {!enabled && (
          <p className="text-mono-sm text-text-muted px-12 py-24 text-center">
            Type at least two characters
          </p>
        )}

        {enabled && isFetching && hits.length === 0 && (
          <div className="space-y-8 p-12">
            <Skeleton width="70%" />
            <Skeleton width="50%" />
            <Skeleton width="60%" />
          </div>
        )}

        {enabled && !isFetching && hits.length === 0 && (
          <p className="text-mono-sm text-text-muted px-12 py-24 text-center">
            No results for “{debounced}”
          </p>
        )}

        {hits.map((hit, index) => {
          const showHeader = hit.group !== lastGroup;
          lastGroup = hit.group;
          return (
            <div key={hit.id}>
              {showHeader && (
                <p className="text-mono-xs text-text-muted px-12 pt-12 pb-6 uppercase">{hit.group}</p>
              )}
              <button
                type="button"
                onMouseEnter={() => setCursor(index)}
                onClick={() => go(hit.to)}
                className={cn(
                  "rounded-input flex w-full items-center gap-12 px-12 py-10 text-left transition-colors duration-150",
                  index === cursor ? "bg-surface-raised" : "hover:bg-surface-raised",
                )}
              >
                <span
                  aria-hidden
                  className="size-8 shrink-0 rounded-avatar"
                  style={{ background: hit.accent ?? "var(--color-text-muted)" }}
                />
                <span className="min-w-0 flex-1">
                  <span className="text-body-sm text-text-primary block truncate">{hit.title}</span>
                  {hit.meta && (
                    <span className="text-mono-sm text-text-muted block truncate">{hit.meta}</span>
                  )}
                </span>
                {index === cursor && (
                  <CornerDownLeft className="text-text-muted size-12 shrink-0" aria-hidden />
                )}
              </button>
            </div>
          );
        })}

        {enabled && hits.length > 0 && (
          <button
            type="button"
            onClick={() => go(`/search?q=${encodeURIComponent(debounced.trim())}`)}
            className="text-mono-sm text-signal-indigo hover:bg-surface-raised rounded-input mt-8 w-full px-12 py-10 text-left transition-colors duration-150"
          >
            See all results for “{debounced}” →
          </button>
        )}
      </div>
    </Modal>
  );
}
