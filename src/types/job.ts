import type {
  EmploymentType,
  PageParams,
  RoleFamily,
  Seniority,
  SortOrder,
  WorkMode,
} from "./common";

export interface Job {
  id: string;
  company_id: string;
  company_name: string | null;
  company_slug: string | null;
  title: string;
  department: string | null;
  role_family: RoleFamily | null;
  seniority: Seniority | null;
  employment_type: EmploymentType | null;
  work_mode: WorkMode | null;
  /** As written on the board. */
  location_raw: string | null;
  /** Cleaned up for filtering. Prefer this when showing a location. */
  location_normalized: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  skills: string[] | null;
  application_url: string | null;
  first_seen_at: string;
  last_seen_at: string;
  closed_at: string | null;
  is_active: boolean;
}

export interface JobDetail extends Job {
  description_text: string | null;
}

/** One row of `GET /resumes/matches`. The job is nested, not spread. */
export interface JobMatch {
  job: Job;
  similarity_score: number;
  match_reasons: string[];
}

export interface JobMatchesResponse {
  matches: JobMatch[];
  count: number;
  /** Set when the resume is not indexed yet, in which case matches is empty. */
  message: string | null;
}

export type JobSortField = "first_seen_at" | "last_seen_at" | "title";

export interface JobListParams extends PageParams {
  company_slug?: string;
  role_family?: RoleFamily;
  seniority?: Seniority;
  work_mode?: WorkMode;
  is_active?: boolean;
  search?: string;
  sort_by?: JobSortField;
  sort_order?: SortOrder;
}

export interface JobMatchParams {
  role_family?: RoleFamily;
  seniority?: Seniority;
  work_mode?: WorkMode;
  limit?: number;
}
