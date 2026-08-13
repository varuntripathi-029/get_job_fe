import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { useEffect } from "react";

import { EventCard } from "@/components/cards/EventCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterPillGroup } from "@/components/ui/FilterPillGroup";
import { Pagination } from "@/components/ui/Pagination";
import { PillButton } from "@/components/ui/PillButton";
import { EventCardSkeleton } from "@/components/ui/Skeleton";
import { useUrlState } from "@/hooks/useUrlState";
import { eventsApi } from "@/lib/api";
import { EVENT_TYPE_OPTIONS, TIME_RANGES } from "@/lib/constants";
import { formatCount, setPageTitle } from "@/lib/utils";
import type { EventType } from "@/types";

export function EventsPage() {
  const { get, getNumber, patch, clear } = useUrlState();

  useEffect(() => setPageTitle("Signals"), []);

  const page = getNumber("page", 1);
  const perPage = getNumber("per_page", 24);
  const eventType = get("event_type") as EventType | "";
  const days = get("days", "90");

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["events", { page, perPage, eventType, days }],
    queryFn: () =>
      eventsApi.list({
        page,
        per_page: perPage,
        event_type: eventType || undefined,
        days: Number(days),
        sort_by: "observed_at",
        sort_order: "desc",
      }),
    placeholderData: keepPreviousData,
  });

  const events = data?.items ?? [];
  const hasFilters = Boolean(eventType) || days !== "90";

  return (
    <div className="pb-32">
      <PageHeader
        title="Signals"
        subtitle="Every event carries the source it came from. Nothing here is a prediction."
      />

      <div className="bg-surface border-border rounded-card mb-24 flex flex-col gap-16 border p-16">
        <FilterPillGroup
          label="Signal type"
          options={EVENT_TYPE_OPTIONS}
          selected={eventType ? [eventType] : []}
          onChange={(selected) => patch({ event_type: selected[0] ?? "" })}
        />
        <div className="flex flex-wrap items-end justify-between gap-16">
          <FilterPillGroup
            label="Time range"
            options={TIME_RANGES}
            selected={[days]}
            onChange={(selected) => patch({ days: selected[0] ?? "90" })}
          />
          {hasFilters && (
            <PillButton variant="outlined" size="sm" onClick={() => clear()}>
              Clear filters
            </PillButton>
          )}
        </div>
      </div>

      <p className="text-mono text-text-secondary mb-16">
        {isPending && !data
          ? "Loading…"
          : `${formatCount(data?.total ?? 0)} ${data?.total === 1 ? "signal" : "signals"}`}
      </p>

      {isError ? (
        <EmptyState
          icon={Zap}
          title="Couldn't load signals"
          description={error instanceof Error ? error.message : undefined}
        />
      ) : isPending && !data ? (
        <div className="flex flex-col gap-12">
          {Array.from({ length: 6 }, (_, index) => (
            <EventCardSkeleton key={index} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No signals in this window"
          description="Widen the time range, or clear the type filter."
          action={hasFilters ? { label: "Clear filters", onClick: () => clear() } : undefined}
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
