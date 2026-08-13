import type { IndexingStatus, RoleFamily, Seniority, WorkMode } from "./common";

/** Every parsed field is nullable: the resume exists from the moment it is
 * uploaded, but stays empty until the indexing worker finishes with it. */
export interface Resume {
  id: string;
  file_name: string | null;
  parsed_skills: string[] | null;
  parsed_role_families: RoleFamily[] | null;
  parsed_seniority: Seniority | null;
  parsed_experience_years: number | null;
  parsed_locations: string[] | null;
  work_mode_preference: WorkMode | null;
  parsed_at: string | null;
  expires_at: string | null;
  indexing_status: IndexingStatus;
  indexing_error: string | null;
  has_embedding: boolean;
}

export interface ResumeUploadResponse {
  resume: Resume;
  message: string;
}
