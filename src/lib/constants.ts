/* Every map the UI needs to turn a backend enum string into something visible.
 *
 * Each entry carries the colour twice on purpose:
 *   `classes` — Tailwind class names, for DOM elements. Written out in full so
 *               the JIT scanner can see them; never build these by templating.
 *   `cssVar`  — a var() reference, for the places that take a colour as a value
 *               rather than a class: SVG attributes and Recharts props.
 * Both resolve to the same token, so light mode follows automatically. */

import {
  AlertTriangle,
  Brain,
  Briefcase,
  Building2,
  Code2,
  DollarSign,
  Handshake,
  Link2,
  Rocket,
  Server,
  UserRoundCog,
  type LucideIcon,
} from "lucide-react";

import type {
  EventType,
  MomentumLevel,
  RoleFamily,
  Seniority,
  SourceType,
  Stage,
  WorkMode,
} from "@/types";

/* ── Momentum ─────────────────────────────────────────────────────────── */

export interface MomentumMeta {
  label: string;
  minScore: number;
  cssVar: string;
  text: string;
  bg: string;
  border: string;
  stroke: string;
}

export const MOMENTUM_LEVELS: Record<MomentumLevel, MomentumMeta> = {
  very_high: {
    label: "VERY HIGH",
    minScore: 75,
    cssVar: "var(--color-momentum-lime)",
    text: "text-momentum-lime",
    bg: "bg-momentum-lime-bg",
    border: "border-momentum-lime",
    stroke: "stroke-momentum-lime",
  },
  high: {
    label: "HIGH",
    minScore: 50,
    cssVar: "var(--color-momentum-teal)",
    text: "text-momentum-teal",
    bg: "bg-momentum-teal-bg",
    border: "border-momentum-teal",
    stroke: "stroke-momentum-teal",
  },
  moderate: {
    label: "MODERATE",
    minScore: 25,
    cssVar: "var(--color-momentum-amber)",
    text: "text-momentum-amber",
    bg: "bg-momentum-amber-bg",
    border: "border-momentum-amber",
    stroke: "stroke-momentum-amber",
  },
  low: {
    label: "LOW",
    minScore: 1,
    cssVar: "var(--color-momentum-gray)",
    text: "text-momentum-gray",
    bg: "bg-momentum-gray-bg",
    border: "border-momentum-gray",
    stroke: "stroke-momentum-gray",
  },
  none: {
    label: "NONE",
    minScore: 0,
    cssVar: "var(--color-momentum-none)",
    text: "text-momentum-none",
    bg: "bg-momentum-none-bg",
    border: "border-momentum-none",
    stroke: "stroke-momentum-none",
  },
};

/** Total lookup — an unrecognised or missing label degrades to "none" rather
 * than throwing, because the label is a free-text column on the server. */
export function momentum(level: MomentumLevel | string | null | undefined): MomentumMeta {
  if (level && level in MOMENTUM_LEVELS) {
    return MOMENTUM_LEVELS[level as MomentumLevel];
  }
  return MOMENTUM_LEVELS.none;
}

/* ── Event types ──────────────────────────────────────────────────────── */

export interface EventTypeMeta {
  label: string;
  icon: LucideIcon;
  cssVar: string;
  text: string;
  bg: string;
  border: string;
}

export const EVENT_TYPE_META: Record<EventType, EventTypeMeta> = {
  funding: {
    label: "FUNDING",
    icon: DollarSign,
    cssVar: "var(--color-signal-green)",
    text: "text-signal-green",
    bg: "bg-signal-green-bg",
    border: "border-signal-green",
  },
  new_office: {
    label: "NEW OFFICE",
    icon: Building2,
    cssVar: "var(--color-signal-blue)",
    text: "text-signal-blue",
    bg: "bg-signal-blue-bg",
    border: "border-signal-blue",
  },
  leadership_change: {
    label: "LEADERSHIP",
    icon: UserRoundCog,
    cssVar: "var(--color-signal-purple)",
    text: "text-signal-purple",
    bg: "bg-signal-purple-bg",
    border: "border-signal-purple",
  },
  product_launch: {
    label: "PRODUCT LAUNCH",
    icon: Rocket,
    cssVar: "var(--color-signal-orange)",
    text: "text-signal-orange",
    bg: "bg-signal-orange-bg",
    border: "border-signal-orange",
  },
  engineering_expansion: {
    label: "ENG EXPANSION",
    icon: Code2,
    cssVar: "var(--color-signal-indigo)",
    text: "text-signal-indigo",
    bg: "bg-indigo-15",
    border: "border-signal-indigo",
  },
  ai_division: {
    label: "AI DIVISION",
    icon: Brain,
    cssVar: "var(--color-signal-purple)",
    text: "text-signal-purple",
    bg: "bg-signal-purple-bg",
    border: "border-signal-purple",
  },
  infrastructure_investment: {
    label: "INFRASTRUCTURE",
    icon: Server,
    cssVar: "var(--color-signal-orange)",
    text: "text-signal-orange",
    bg: "bg-signal-orange-bg",
    border: "border-signal-orange",
  },
  acquisition: {
    label: "ACQUISITION",
    icon: Handshake,
    cssVar: "var(--color-signal-green)",
    text: "text-signal-green",
    bg: "bg-signal-green-bg",
    border: "border-signal-green",
  },
  partnership: {
    label: "PARTNERSHIP",
    icon: Link2,
    cssVar: "var(--color-signal-blue)",
    text: "text-signal-blue",
    bg: "bg-signal-blue-bg",
    border: "border-signal-blue",
  },
  career_page_update: {
    label: "HIRING PAGE",
    icon: Briefcase,
    cssVar: "var(--color-signal-indigo)",
    text: "text-signal-indigo",
    bg: "bg-indigo-15",
    border: "border-signal-indigo",
  },
  layoff: {
    label: "LAYOFF",
    icon: AlertTriangle,
    cssVar: "var(--color-signal-red)",
    text: "text-signal-red",
    bg: "bg-signal-red-bg",
    border: "border-signal-red",
  },
};

const UNKNOWN_EVENT: EventTypeMeta = {
  label: "SIGNAL",
  icon: Briefcase,
  cssVar: "var(--color-text-muted)",
  text: "text-text-muted",
  bg: "bg-surface-raised",
  border: "border-border-bright",
};

export function eventMeta(type: EventType | string | null | undefined): EventTypeMeta {
  if (type && type in EVENT_TYPE_META) return EVENT_TYPE_META[type as EventType];
  return UNKNOWN_EVENT;
}

export const EVENT_TYPES = Object.keys(EVENT_TYPE_META) as EventType[];

export const EVENT_TYPE_OPTIONS = EVENT_TYPES.map((value) => ({
  value,
  label: EVENT_TYPE_META[value].label,
}));

/* ── Seniority ────────────────────────────────────────────────────────── */

export const SENIORITY_CLASSES: Record<Seniority, string> = {
  intern: "text-text-muted",
  junior: "text-text-secondary",
  mid: "text-text-primary",
  senior: "text-signal-blue",
  staff: "text-signal-purple",
  principal: "text-signal-purple",
  director: "text-signal-orange",
  vp: "text-signal-orange",
  c_level: "text-signal-red",
};

export function seniorityClass(value: Seniority | string | null | undefined): string {
  if (value && value in SENIORITY_CLASSES) return SENIORITY_CLASSES[value as Seniority];
  return "text-text-secondary";
}

/* ── Option lists for filters ─────────────────────────────────────────── */

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

/** Turns a snake_case enum value into something readable: "c_level" → "C Level". */
export function humanize(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const ROLE_FAMILIES: RoleFamily[] = [
  "engineering",
  "product",
  "design",
  "data",
  "devops",
  "marketing",
  "sales",
  "operations",
  "hr",
  "finance",
  "legal",
  "other",
];

export const SENIORITIES: Seniority[] = [
  "intern",
  "junior",
  "mid",
  "senior",
  "staff",
  "principal",
  "director",
  "vp",
  "c_level",
];

export const WORK_MODES: WorkMode[] = ["remote", "hybrid", "onsite"];

export const STAGES: Stage[] = [
  "pre_seed",
  "seed",
  "series_a",
  "series_b",
  "series_c",
  "growth",
  "public",
  "bootstrapped",
  "unknown",
];

export const SOURCE_TYPES: SourceType[] = [
  "career_page",
  "engineering_blog",
  "company_blog",
  "news_site",
  "rss_feed",
  "ats_api",
  "github_org",
  "news_api",
  "search_api",
];

/* A couple of labels read badly under plain humanize(). */
const LABEL_OVERRIDES: Record<string, string> = {
  hr: "HR",
  devops: "DevOps",
  c_level: "C-Level",
  vp: "VP",
  ats_api: "ATS API",
  rss_feed: "RSS Feed",
  news_api: "News API",
  search_api: "Search API",
  github_org: "GitHub Org",
  pre_seed: "Pre-Seed",
  series_a: "Series A",
  series_b: "Series B",
  series_c: "Series C",
};

export function label(value: string): string {
  return LABEL_OVERRIDES[value] ?? humanize(value);
}

function options<T extends string>(values: T[]): Option<T>[] {
  return values.map((value) => ({ value, label: label(value) }));
}

export const ROLE_FAMILY_OPTIONS = options(ROLE_FAMILIES);
export const SENIORITY_OPTIONS = options(SENIORITIES);
export const WORK_MODE_OPTIONS = options(WORK_MODES);
export const STAGE_OPTIONS = options(STAGES);
export const SOURCE_TYPE_OPTIONS = options(SOURCE_TYPES);

/** Time windows offered wherever a `days` filter exists. */
export const TIME_RANGES: Option[] = [
  { value: "7", label: "7 Days" },
  { value: "30", label: "30 Days" },
  { value: "90", label: "90 Days" },
  { value: "365", label: "All Time" },
];

export const PER_PAGE_OPTIONS = [12, 24, 48, 96];

/** The colour rotation for multi-series charts and comparison columns. */
export const SERIES_COLORS = [
  "var(--color-signal-indigo)",
  "var(--color-signal-blue)",
  "var(--color-signal-purple)",
  "var(--color-signal-green)",
  "var(--color-signal-orange)",
  "var(--color-momentum-teal)",
  "var(--color-momentum-amber)",
];

/** Deterministic avatar tint, so a company keeps the same colour everywhere. */
export function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 100000;
  }
  return SERIES_COLORS[hash % SERIES_COLORS.length];
}
