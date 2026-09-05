import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { useRef, type ReactNode } from "react";

import { useCountUp } from "@/hooks/useCountUp";
import { useMagicCard } from "@/hooks/useMagicCard";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  /** Percentage change. Omit when there is nothing to compare against. */
  trend?: number | null;
  icon?: LucideIcon;
  hint?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, trend, icon: Icon, hint, className }: StatCardProps) {
  const numeric = typeof value === "number";
  const counted = useCountUp(numeric ? value : 0, 800, numeric);
  const cardRef = useRef<HTMLDivElement>(null);
  useMagicCard(cardRef, { particleCount: 0, clickEffect: true });

  return (
    <div
      ref={cardRef}
      className={cn("magic-card bg-surface border-border rounded-card border p-20", className)}
    >
      <div className="flex items-start justify-between gap-8">
        <span className="text-mono-sm text-text-muted uppercase">{label}</span>
        {Icon && <Icon className="text-text-muted size-16 shrink-0" aria-hidden />}
      </div>

      <div className="mt-12 flex items-baseline gap-8">
        <span className="text-score-sm text-text-primary tabular-nums">
          {numeric ? Math.round(counted).toLocaleString("en-IN") : value}
        </span>
        {trend != null && trend !== 0 && (
          <span
            className={cn(
              "text-mono-sm inline-flex items-center gap-2",
              trend > 0 ? "text-momentum-lime" : "text-signal-red",
            )}
          >
            {trend > 0 ? (
              <ArrowUp className="size-12" aria-hidden />
            ) : (
              <ArrowDown className="size-12" aria-hidden />
            )}
            {Math.abs(trend).toFixed(0)}%
          </span>
        )}
      </div>

      {hint && <p className="text-mono-xs text-text-muted mt-8">{hint}</p>}
    </div>
  );
}
