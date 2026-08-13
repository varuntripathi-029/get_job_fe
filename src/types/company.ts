import type { MomentumLevel, PageParams, SortOrder, Stage } from "./common";
import type { HireEvent } from "./event";

/** Fields shared by every company representation the API returns. */
export interface CompanyBase {
  id: string;
  slug: string;
  name: string;
  canonical_domain: string;
  aliases: string[] | null;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  industry: string | null;
  stage: Stage | null;
  headcount_estimate: number | null;
  location_hq: string | null;
  founded_year: number | null;
  ats_provider: string | null;
  ats_board_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** A row in `GET /companies`. Carries the latest score and job count. */
export interface CompanyListItem extends CompanyBase {
  momentum_score: number | null;
  momentum_label: MomentumLevel | null;
  active_job_count: number;
}

/** One append-only scoring result. The backend never mutates these. */
export interface ScorePoint {
  momentum_score: number;
  momentum_label: MomentumLevel;
  score_delta: number | null;
  scored_at: string;
}

export interface CompanySourceSummary {
  id: string;
  url: string;
  source_type: string;
  last_crawl_at: string | null;
}

/** `GET /companies/{slug}`. */
export interface CompanyDetail extends CompanyBase {
  momentum_score: number | null;
  momentum_label: MomentumLevel | null;
  scored_at: string | null;
  score_delta: number | null;
  active_job_count: number;
  total_event_count: number;
  recent_events: HireEvent[];
  score_history: ScorePoint[];
  sources: CompanySourceSummary[];
}

/** One column of `GET /companies/compare`. Deliberately narrower than detail. */
export interface CompanyComparison {
  slug: string;
  name: string;
  industry: string | null;
  stage: Stage | null;
  momentum_score: number | null;
  momentum_label: MomentumLevel | null;
  active_jobs: number;
  active_jobs_by_family: Record<string, number>;
  recent_events: number;
  score_history: ScorePoint[];
  top_events: HireEvent[];
}

export interface CompareResponse {
  companies: CompanyComparison[];
}

/** `GET /dashboard/trending` — score_delta is non-null by construction. */
export interface TrendingCompany {
  slug: string;
  name: string;
  industry: string | null;
  momentum_score: number;
  momentum_label: MomentumLevel;
  score_delta: number;
  top_signal: string | null;
  active_jobs: number;
}

export interface IndustryBreakdown {
  name: string;
  count: number;
  avg_score: number | null;
}

export type CompanySortField = "name" | "momentum_score" | "active_jobs" | "created_at";

export interface CompanyListParams extends PageParams {
  industry?: string;
  stage?: Stage;
  is_active?: boolean;
  search?: string;
  min_score?: number;
  has_active_jobs?: boolean;
  sort_by?: CompanySortField;
  sort_order?: SortOrder;
}
