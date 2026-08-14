import type { ActivityEvent } from "./event";
import type { IndustryBreakdown, TrendingCompany } from "./company";

export interface DashboardStats {
  total_companies: number;
  total_active_jobs: number;
  total_events_30d: number;
  total_sources: number;
  last_crawl_at: string | null;
}

export interface TrendingResponse {
  trending: TrendingCompany[];
}

export interface ActivityResponse {
  events: ActivityEvent[];
}

export interface IndustriesResponse {
  industries: IndustryBreakdown[];
}

export interface QuotaRow {
  api: string;
  used: number;
  limit: number;
  remaining: number;
  exhausted: boolean;
}

/** `GET /dashboard/crawl-budget`. The free-tier lookup allowance for the day.
 * `paused` is only true once every configured vendor is spent — while one has
 * budget left the crawl is still finding things. */
export interface CrawlBudget {
  paused: boolean;
  resets_at: string;
  message: string | null;
  vendors: QuotaRow[];
}

/** `GET /admin/metrics`. Sources are bucketed by status rather than counted
 * flat, because "pending" is a queue the admin has to work through. */
export interface AdminMetrics {
  total_companies: number;
  active_companies: number;
  sources_by_status: Record<string, number>;
  total_sources: number;
  total_events: number;
  active_jobs: number;
  closed_jobs: number;
  total_users: number;
  total_subscribers: number;
}

export interface CrawlerHealthRow {
  source_id: string;
  url: string;
  company_name: string | null;
  source_type: string;
  fetch_tier: string;
  status: string;
  last_crawl_at: string | null;
  last_successful_crawl_at: string | null;
  next_crawl_at: string | null;
  consecutive_failures: number;
  last_failure_reason: string | null;
  content_hash: string | null;
  total_crawls: number;
  total_events_extracted: number;
}

export interface NewsletterSendResult {
  edition_number: number;
  sent: number;
  failed: number;
  skipped_rate_limit: number;
  recipients: number;
}
