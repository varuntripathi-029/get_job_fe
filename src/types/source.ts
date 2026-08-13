import type { FetchTier, SourceStatus, SourceType } from "./common";

export interface Source {
  id: string;
  company_id: string | null;
  url: string;
  source_type: SourceType;
  fetch_tier: FetchTier;
  status: SourceStatus;
  rejection_reason: string | null;
  crawl_frequency_minutes: number;
  /** The scheduler queue is this column — a due row is a queued job. */
  next_crawl_at: string | null;
  last_crawl_at: string | null;
  last_successful_crawl_at: string | null;
  consecutive_failures: number;
  requires_js: boolean;
  reliability_score: number | null;
  total_crawls: number;
  total_events_extracted: number;
  created_at: string;
}

export interface SourceBrowseItem {
  id: string;
  url: string;
  source_type: SourceType;
  fetch_tier: FetchTier;
  last_crawl_at: string | null;
}

export interface CompanySourceGroup {
  slug: string;
  name: string;
  sources: SourceBrowseItem[];
}

/** `GET /sources/browse` — grouped by company, plus unattached global feeds. */
export interface SourceBrowseResponse {
  companies: CompanySourceGroup[];
  global_sources: SourceBrowseItem[];
}

export interface SourceStats {
  total_sources: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  companies_with_sources: number;
  companies_without_sources: number;
}

export interface SourceSubmitBody {
  url: string;
  source_type: SourceType;
  company_id?: string | null;
  fetch_tier?: FetchTier | null;
  notes?: string | null;
}
