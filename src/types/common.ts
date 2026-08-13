/* Shared primitives and the enum vocabularies the backend actually uses.
 *
 * Every union here was read off the backend's own model constants rather than
 * the design-time contract, which drifted: stages are growth/bootstrapped
 * rather than series_d/series_e, work_mode has no "unknown", and source types
 * are far more granular. */

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export type MomentumLevel = "very_high" | "high" | "moderate" | "low" | "none";

export type EventType =
  | "funding"
  | "new_office"
  | "leadership_change"
  | "product_launch"
  | "engineering_expansion"
  | "ai_division"
  | "infrastructure_investment"
  | "acquisition"
  | "partnership"
  | "layoff"
  | "career_page_update";

export type RoleFamily =
  | "engineering"
  | "product"
  | "design"
  | "data"
  | "devops"
  | "marketing"
  | "sales"
  | "operations"
  | "hr"
  | "finance"
  | "legal"
  | "other";

export type Seniority =
  | "intern"
  | "junior"
  | "mid"
  | "senior"
  | "staff"
  | "principal"
  | "director"
  | "vp"
  | "c_level";

export type WorkMode = "remote" | "hybrid" | "onsite";

export type EmploymentType = "full_time" | "part_time" | "contract" | "internship";

export type Stage =
  | "pre_seed"
  | "seed"
  | "series_a"
  | "series_b"
  | "series_c"
  | "growth"
  | "public"
  | "bootstrapped"
  | "unknown";

export type SourceType =
  | "career_page"
  | "engineering_blog"
  | "company_blog"
  | "news_site"
  | "rss_feed"
  | "ats_api"
  | "github_org"
  | "news_api"
  | "search_api";

export type FetchTier =
  | "ats_api"
  | "rss"
  | "static_http"
  | "playwright"
  | "news_api"
  | "search_api";

export type SourceStatus = "pending" | "approved" | "rejected" | "disabled";

export type IndexingStatus = "pending" | "processing" | "ready" | "failed";

export type SortOrder = "asc" | "desc";

/** Standard FastAPI error body. */
export interface ApiError {
  detail: string;
}

/** Page-level query parameters every list endpoint accepts. */
export interface PageParams {
  page?: number;
  per_page?: number;
}
