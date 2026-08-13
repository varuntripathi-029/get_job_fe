import { useEffect, useState } from "react";

import { useCountUp } from "@/hooks/useCountUp";
import { momentum } from "@/lib/constants";
import { clamp, cn } from "@/lib/utils";
import type { MomentumLevel } from "@/types";
import { MomentumBadge } from "./MomentumScore";

interface ScoreGaugeProps {
  score: number | null;
  level: MomentumLevel | string | null;
  size?: number;
  className?: string;
}

/** Circular momentum readout. The arc fills from 0 to the score over 1000ms
 * by transitioning stroke-dashoffset, which the GPU can composite cheaply. */
export function ScoreGauge({ score, level, size = 120, className }: ScoreGaugeProps) {
  const meta = momentum(level);
  const target = clamp(score ?? 0, 0, 100);
  const [filled, setFilled] = useState(false);
  const displayed = useCountUp(target, 1000, score !== null);

  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (filled ? target : 0) / 100);

  // Paint at zero first, then transition — setting the final offset on the very
  // first paint would leave nothing to animate.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return (
    <div className={cn("inline-flex flex-col items-center gap-12", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={score === null ? "Not scored yet" : `Momentum score ${target.toFixed(1)} of 100`}
          // Start the arc at 12 o'clock rather than 3 o'clock.
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={meta.cssVar}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset var(--duration-gauge) var(--ease-out)",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-score-md tabular-nums", meta.text)} aria-hidden>
            {score === null ? "—" : displayed.toFixed(0)}
          </span>
        </div>
      </div>
      <MomentumBadge level={level} />
    </div>
  );
}
