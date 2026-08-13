import { ArrowDown, ArrowUp } from "lucide-react";

import { useCountUp } from "@/hooks/useCountUp";
import { momentum } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { MomentumLevel } from "@/types";

/* ── Score ────────────────────────────────────────────────────────────── */

type ScoreSize = "lg" | "md" | "sm";

const SIZES: Record<ScoreSize, string> = {
  lg: "text-score",
  md: "text-score-md",
  sm: "text-score-sm",
};

interface MomentumScoreProps {
  score: number | null;
  level: MomentumLevel | string | null;
  animated?: boolean;
  size?: ScoreSize;
  className?: string;
}

export function MomentumScore({
  score,
  level,
  animated = true,
  size = "lg",
  className,
}: MomentumScoreProps) {
  const meta = momentum(level);
  const target = score ?? 0;
  const value = useCountUp(target, 800, animated && score !== null);

  return (
    <span
      className={cn("tabular-nums", SIZES[size], meta.text, className)}
      // The animating number is noise to a screen reader; announce the real one.
      aria-label={score === null ? "Not scored yet" : `Momentum score ${target.toFixed(1)}`}
    >
      <span aria-hidden>{score === null ? "—" : value.toFixed(1)}</span>
    </span>
  );
}

/* ── Delta ────────────────────────────────────────────────────────────── */

interface ScoreDeltaProps {
  delta: number | null;
  size?: "sm" | "md";
  className?: string;
}

/** A null delta means "no previous score to compare against" — which is not
 * the same as "no change", so it renders as a dash rather than a zero. */
export function ScoreDelta({ delta, size = "sm", className }: ScoreDeltaProps) {
  const sizeClass = size === "sm" ? "text-mono" : "text-mono-lg";

  if (delta === null || delta === 0) {
    return (
      <span className={cn(sizeClass, "text-text-muted", className)} aria-label="No change">
        —
      </span>
    );
  }

  const positive = delta > 0;
  const Icon = positive ? ArrowUp : ArrowDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 tabular-nums",
        sizeClass,
        positive ? "text-momentum-lime" : "text-signal-red",
        className,
      )}
      aria-label={`${positive ? "Up" : "Down"} ${Math.abs(delta).toFixed(1)} points`}
    >
      <Icon className="size-12" aria-hidden />
      <span aria-hidden>{Math.abs(delta).toFixed(1)}</span>
    </span>
  );
}

/* ── Badge ────────────────────────────────────────────────────────────── */

interface MomentumBadgeProps {
  level: MomentumLevel | string | null;
  className?: string;
}

export function MomentumBadge({ level, className }: MomentumBadgeProps) {
  const meta = momentum(level);
  const isVeryHigh = level === "very_high";

  return (
    <span
      className={cn(
        "rounded-pill text-mono-xs inline-flex items-center px-8 py-2 font-medium",
        meta.bg,
        meta.text,
        // Only the top tier glows — if everything pulses, nothing stands out.
        isVeryHigh && "animate-pulse-glow",
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
