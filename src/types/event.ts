import type { EventType, PageParams, SortOrder } from "./common";

/** One piece of supporting evidence behind an event.
 *
 * The backend types this as an untyped JSON list, so the fields are all
 * optional here — the UI renders whichever ones are present rather than
 * assuming a shape the API does not guarantee. */
export interface Evidence {
  source_url?: string | null;
  url?: string | null;
  source_type?: string | null;
  excerpt?: string | null;
  snippet?: string | null;
  title?: string | null;
  observed_at?: string | null;
  published_at?: string | null;
}

/* Named HireEvent rather than Event so it cannot be confused with the DOM
   Event type, which is in scope in every component file. */
export interface HireEvent {
  id: string;
  company_id: string;
  company_name: string | null;
  company_slug: string | null;
  event_type: EventType;
  title: string;
  /** When the event happened. Drives score decay; may be unknown. */
  event_occurred_at: string | null;
  /** When the crawler first saw it. Drives "what's new". Always set. */
  observed_at: string;
  structured_data: Record<string, unknown> | null;
  evidence: Evidence[];
  source_count: number;
  extraction_confidence: number | null;
}

/** Slimmer shape returned by `GET /dashboard/activity`. */
export interface ActivityEvent {
  id: string;
  event_type: EventType;
  title: string;
  company_name: string;
  company_slug: string;
  observed_at: string;
  event_occurred_at: string | null;
  source_count: number;
}

export type EventSortField = "observed_at" | "event_occurred_at";

export interface EventListParams extends PageParams {
  company_slug?: string;
  event_type?: EventType;
  days?: number;
  sort_by?: EventSortField;
  sort_order?: SortOrder;
}
