import { useQuery } from "@tanstack/react-query";
import { PiggyBank, X } from "lucide-react";
import { useState } from "react";

import { dashboardApi } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Minutes until the daily budget resets, rendered the way a person would say it. */
function untilReset(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return "shortly";

  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `in ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) return rest > 0 ? `in ${hours}h ${rest}m` : `in ${hours}h`;
  return "tomorrow";
}

/**
 * Says plainly when the free-tier lookup budget is spent.
 *
 * Without this the site just stops turning up new roles and looks abandoned.
 * A visible, honest "we ran out of budget, back in 6h" is a much better read
 * than silence, and it is dismissable because it is not the user's problem to
 * solve.
 */
export function CrawlBudgetBanner() {
  const [dismissed, setDismissed] = useState(false);

  const { data } = useQuery({
    queryKey: ["dashboard", "crawl-budget"],
    queryFn: dashboardApi.crawlBudget,
    // The budget only moves when a crawl runs, and a stale banner is worse
    // than a slightly late one — refresh on an interval rather than on focus.
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
    refetchOnWindowFocus: false,
    // A failure here must never surface: it is an explanation, not a feature.
    retry: false,
  });

  if (dismissed || !data?.message) return null;

  return (
    <div
      role="status"
      className={cn(
        "glass rounded-card animate-fade-in mb-24 flex items-start gap-12 p-12",
        data.paused ? "border-momentum-amber" : "border-border",
      )}
    >
      <PiggyBank
        className={cn(
          "mt-2 size-16 shrink-0",
          data.paused ? "text-momentum-amber" : "text-text-muted",
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-body-sm text-text-primary">{data.message}</p>
        <p className="text-mono-sm text-text-muted mt-4">
          Budget resets {untilReset(data.resets_at)}.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="text-text-muted hover:text-text-primary shrink-0 transition-colors duration-150"
      >
        <X className="size-14" aria-hidden />
      </button>
    </div>
  );
}
