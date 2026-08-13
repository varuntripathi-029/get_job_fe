import type { MomentumLevel, RoleFamily, Seniority, Stage, WorkMode } from "./common";
import type { EventType } from "./common";

/** Search returns purpose-built slim rows, not the full list shapes — so the
 * result cards read from these, not from Company/Job/HireEvent. */
export interface CompanySearchResult {
  id: string;
  slug: string;
  name: string;
  industry: string | null;
  stage: Stage | null;
  momentum_score: number | null;
  momentum_label: MomentumLevel | null;
}

export interface JobSearchResult {
  id: string;
  title: string;
  company_name: string | null;
  company_slug: string | null;
  role_family: RoleFamily | null;
  seniority: Seniority | null;
  work_mode: WorkMode | null;
  location_raw: string | null;
  is_active: boolean;
  first_seen_at: string;
}

export interface EventSearchResult {
  id: string;
  event_type: EventType;
  title: string;
  company_name: string | null;
  company_slug: string | null;
  event_occurred_at: string | null;
  observed_at: string;
  extraction_confidence: number | null;
}

export interface SearchSection<T> {
  items: T[];
  total: number;
}

export type SearchType = "all" | "company" | "job" | "event";

export interface SearchResponse {
  query: string;
  type: SearchType;
  companies: SearchSection<CompanySearchResult>;
  jobs: SearchSection<JobSearchResult>;
  events: SearchSection<EventSearchResult>;
  total: number;
  page: number;
  per_page: number;
}
