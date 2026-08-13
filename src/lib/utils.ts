import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** "3 days ago", "just now". Returns "—" for a missing timestamp so callers
 * never have to special-case null in JSX. */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";

  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, secondsPer] of units) {
    if (Math.abs(seconds) >= secondsPer) {
      return formatter.format(-Math.round(seconds / secondsPer), unit);
    }
  }
  return "just now";
}

/** "9 Aug 2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Short axis label: "9 Aug". */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** 1_234 → "1,234". */
export function formatCount(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("en-IN");
}

/** Scores render to one decimal; a missing score is a dash, never a zero —
 * "not scored yet" and "scored zero" mean different things here. */
export function formatScore(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toFixed(1);
}

/** Strips the scheme and any trailing slash for compact display. */
export function prettyUrl(url: string, maxLength = 52): string {
  const trimmed = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

export function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

/** True for a syntactically plausible http(s) URL. */
export function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/** Clamps into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Sets the tab title, always suffixed so the brand is never lost. */
export function setPageTitle(title?: string) {
  document.title = title ? `${title} — HireSignal` : "HireSignal — hiring intelligence for Indian startups";
}
