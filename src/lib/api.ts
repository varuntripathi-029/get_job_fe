/* Typed wrapper over the backend.
 *
 * Every function here was written against the running backend's OpenAPI
 * document, not designs/api-contract.md — the two disagree in about a dozen
 * places (companies are addressed by slug not id, trending and industries live
 * under /dashboard, newsletter confirm is a POST with the token in the body).
 * Where they differ, the server wins. */

import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

import type {
  ActivityResponse,
  AdminMetrics,
  CompanyDetail,
  CompanyListItem,
  CompanyListParams,
  CompareResponse,
  CrawlBudget,
  CrawlerHealthRow,
  DashboardStats,
  EventListParams,
  HireEvent,
  IndustriesResponse,
  JobDetail,
  JobListParams,
  JobMatchParams,
  JobMatchesResponse,
  Job,
  NewsletterSendResult,
  PaginatedResponse,
  Resume,
  ResumeUploadResponse,
  ScorePoint,
  SearchResponse,
  SearchType,
  Source,
  SourceBrowseResponse,
  SourceStats,
  SourceSubmitBody,
  TokenResponse,
  TrendingResponse,
  User,
} from "@/types";

export const ACCESS_TOKEN_KEY = "hiresignal:access_token";
export const REFRESH_TOKEN_KEY = "hiresignal:refresh_token";

export const tokenStore = {
  access: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  refresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.access();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

/** Notifies the auth context that the session died, so it can drop the user
 * without this module needing to import React or the router. */
type SessionEndedHandler = () => void;
let onSessionEnded: SessionEndedHandler = () => {};
export function setSessionEndedHandler(handler: SessionEndedHandler) {
  onSessionEnded = handler;
}

/* A single in-flight refresh shared by every 401'd request. Without this, a
   page that fires six queries at once on an expired token would kick off six
   refreshes and five of them would fail against a rotated refresh token. */
let refreshInFlight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh_token = tokenStore.refresh();
  if (!refresh_token) throw new Error("no refresh token");

  // Deliberately a bare axios call: going through `api` would re-enter this
  // interceptor and loop if the refresh itself 401s.
  const { data } = await axios.post<TokenResponse>(
    `${api.defaults.baseURL}/auth/refresh`,
    { refresh_token },
    { headers: { "Content-Type": "application/json" } },
  );
  tokenStore.set(data.access_token, data.refresh_token);
  return data.access_token;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthCall = original?.url?.includes("/auth/refresh") || original?.url?.includes("/auth/google");

    if (error.response?.status !== 401 || !original || original._retried || isAuthCall) {
      return Promise.reject(error);
    }

    original._retried = true;
    try {
      refreshInFlight ??= refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
      const token = await refreshInFlight;
      original.headers.set("Authorization", `Bearer ${token}`);
      return api(original);
    } catch {
      tokenStore.clear();
      onSessionEnded();
      return Promise.reject(error);
    }
  },
);

/** Pulls a readable message out of whatever the backend or network produced.
 *
 * Two shapes are possible. Everything raised from the AppError hierarchy comes
 * back flat as `{error, message}` — that is the documented contract and covers
 * essentially every deliberate failure. FastAPI's own request-validation and
 * bare HTTPException responses still use `detail`, so both are read. Checking
 * only `detail` is how a 401 with "Invalid or expired Google token." reached
 * the user as axios's "Request failed with status code 401". */
export function errorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: unknown; error?: unknown; detail?: unknown }
      | undefined;

    if (typeof data?.message === "string" && data.message) return data.message;

    const detail = data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string };
      if (first?.msg) return first.msg;
    }

    if (error.code === "ERR_NETWORK") return "Can't reach the API. Is the backend running?";
    if (error.response?.status === 404) return "Not found";
    if (error.response?.status === 403) return "You don't have access to that";

    // Last resort before axios's opaque "Request failed with status code N":
    // the machine code at least names the failure.
    if (typeof data?.error === "string" && data.error) return data.error;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/* Axios serialises `undefined` params away on its own, so callers can pass
   partially-filled param objects straight through. */
async function get<T>(url: string, params?: object): Promise<T> {
  const { data } = await api.get<T>(url, { params });
  return data;
}

/* ── Auth ─────────────────────────────────────────────────────────────── */

export const authApi = {
  /** `credential` is the Google ID token from GoogleLogin's onSuccess. */
  google: (credential: string) =>
    api.post<TokenResponse>("/auth/google", { credential }).then((r) => r.data),
  me: () => get<User>("/auth/me"),
};

/* ── Dashboard ────────────────────────────────────────────────────────── */

export const dashboardApi = {
  stats: () => get<DashboardStats>("/dashboard/stats"),
  trending: (params?: { limit?: number; industry?: string }) =>
    get<TrendingResponse>("/dashboard/trending", params),
  activity: (params?: { limit?: number; event_type?: string }) =>
    get<ActivityResponse>("/dashboard/activity", params),
  industries: () => get<IndustriesResponse>("/dashboard/industries"),
  crawlBudget: () => get<CrawlBudget>("/dashboard/crawl-budget"),
};

/* ── Companies ────────────────────────────────────────────────────────── */

export const companiesApi = {
  list: (params?: CompanyListParams) =>
    get<PaginatedResponse<CompanyListItem>>("/companies", params),
  detail: (slug: string) => get<CompanyDetail>(`/companies/${slug}`),
  scoreHistory: (slug: string, params?: { days?: number; limit?: number }) =>
    get<ScorePoint[]>(`/companies/${slug}/score-history`, params),
  jobs: (slug: string, params?: { is_active?: boolean; page?: number; per_page?: number }) =>
    get<PaginatedResponse<Job>>(`/companies/${slug}/jobs`, params),
  events: (
    slug: string,
    params?: { event_type?: string; days?: number; page?: number; per_page?: number },
  ) => get<PaginatedResponse<HireEvent>>(`/companies/${slug}/events`, params),
  /** Takes slugs, not ids — the query key is `slugs`. */
  compare: (slugs: string[]) => get<CompareResponse>("/companies/compare", { slugs: slugs.join(",") }),
};

/* ── Jobs ─────────────────────────────────────────────────────────────── */

export const jobsApi = {
  list: (params?: JobListParams) => get<PaginatedResponse<Job>>("/jobs", params),
  detail: (id: string) => get<JobDetail>(`/jobs/${id}`),
};

/* ── Events ───────────────────────────────────────────────────────────── */

export const eventsApi = {
  list: (params?: EventListParams) => get<PaginatedResponse<HireEvent>>("/events", params),
};

/* ── Search ───────────────────────────────────────────────────────────── */

export const searchApi = {
  query: (params: { q: string; type?: SearchType; page?: number; per_page?: number }) =>
    get<SearchResponse>("/search", params),
};

/* ── Sources ──────────────────────────────────────────────────────────── */

export const sourcesApi = {
  browse: () => get<SourceBrowseResponse>("/sources/browse"),
  stats: () => get<SourceStats>("/sources/stats"),
  mySubmissions: (params?: { page?: number; per_page?: number }) =>
    get<PaginatedResponse<Source>>("/sources/my-submissions", params),
  submit: (body: SourceSubmitBody) =>
    api.post<Source>("/sources/submit", body).then((r) => r.data),
};

/* ── Resume ───────────────────────────────────────────────────────────── */

export const resumesApi = {
  /** Resolves to null on 404 — "no resume yet" is a normal state, not an error. */
  async me(): Promise<Resume | null> {
    try {
      return await get<Resume>("/resumes/me");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  },
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    // Content-Type is left unset so the browser can add the multipart boundary.
    return api
      .post<ResumeUploadResponse>("/resumes/upload", form, {
        headers: { "Content-Type": undefined },
      })
      .then((r) => r.data);
  },
  remove: () => api.delete<void>("/resumes/me").then(() => undefined),
  matches: (params?: JobMatchParams) => get<JobMatchesResponse>("/resumes/matches", params),
  refreshMatches: () =>
    api.post<ResumeUploadResponse>("/resumes/refresh-matches").then((r) => r.data),
};

/* ── Newsletter ───────────────────────────────────────────────────────── */

export const newsletterApi = {
  subscribe: (email: string) =>
    api.post<{ message: string }>("/newsletter/subscribe", { email }).then((r) => r.data),
  /** POST with the token in the body — not a GET on a token path. */
  confirm: (token: string) =>
    api.post<{ message: string }>("/newsletter/confirm", { token }).then((r) => r.data),
  unsubscribe: (token: string) =>
    api.post<{ message: string }>("/newsletter/unsubscribe", { token }).then((r) => r.data),
};

/* ── Admin ────────────────────────────────────────────────────────────── */

export const adminApi = {
  metrics: () => get<AdminMetrics>("/admin/metrics"),
  crawlerHealth: (params?: { limit?: number; only_failing?: boolean; search?: string }) =>
    get<CrawlerHealthRow[]>("/admin/crawler/health", params),
  pendingSources: (params?: { page?: number; per_page?: number }) =>
    get<PaginatedResponse<Source>>("/admin/sources/pending", params),
  approveSource: (id: string) =>
    api.post<Source>(`/admin/sources/${id}/approve`).then((r) => r.data),
  rejectSource: (id: string, reason: string) =>
    api.post<Source>(`/admin/sources/${id}/reject`, { reason }).then((r) => r.data),
  crawlNow: (id: string) =>
    api
      .post<{ crawled: boolean; url: string; result: Record<string, unknown> }>(
        `/admin/sources/${id}/crawl-now`,
      )
      .then((r) => r.data),
  redetectTier: (id: string) =>
    api.post<Source>(`/admin/sources/${id}/redetect-tier`).then((r) => r.data),
  /** Sweep all sources and promote any now recognisable as a parseable ATS. */
  retierAll: () =>
    api
      .post<{ upgraded: number; urls: string[] }>("/admin/sources/retier")
      .then((r) => r.data),
  disableSource: (id: string) =>
    api.post<Source>(`/admin/sources/${id}/disable`).then((r) => r.data),
  /** Re-approving a disabled source resumes crawling. */
  enableSource: (id: string) =>
    api.post<Source>(`/admin/sources/${id}/approve`).then((r) => r.data),
  deleteSource: (id: string) =>
    api.delete<void>(`/admin/sources/${id}`).then((r) => r.data),
  /** Returns a rendered HTML document, not JSON. */
  newsletterPreview: () =>
    api.get<string>("/admin/newsletter/preview", { responseType: "text" }).then((r) => r.data),
  sendNewsletter: (force = false) =>
    api
      .post<NewsletterSendResult>("/admin/newsletter/send-now", null, { params: { force } })
      .then((r) => r.data),
  weeklyStats: () => get<Record<string, unknown>>("/admin/stats/weekly"),
};
