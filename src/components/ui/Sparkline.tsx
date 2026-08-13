import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  /** Any CSS colour, including a var() reference. */
  color?: string;
  className?: string;
}

/**
 * Inline score trend. Draws its stroke left-to-right on mount by animating
 * stroke-dashoffset from the path's own length down to zero.
 */
export function Sparkline({
  data,
  width = 120,
  height = 32,
  color = "var(--color-signal-indigo)",
  className,
}: SparklineProps) {
  const gradientId = useId();
  const pathRef = useRef<SVGPathElement>(null);
  const [length, setLength] = useState(0);

  // Take the last 10 readings, per the spec.
  const points = data.slice(-10);

  useEffect(() => {
    if (pathRef.current) setLength(pathRef.current.getTotalLength());
  }, [data]);

  // One point is a dot, not a trend; below that there is nothing to draw.
  if (points.length < 2) {
    return (
      <div
        className={cn("flex items-center", className)}
        style={{ width, height }}
        aria-hidden
      >
        <span className="text-mono-xs text-text-muted">no trend yet</span>
      </div>
    );
  }

  const padding = 2;
  const min = Math.min(...points);
  const max = Math.max(...points);
  // A perfectly flat series would divide by zero; draw it down the middle.
  const range = max - min || 1;
  const stepX = (width - padding * 2) / (points.length - 1);

  const coords = points.map((value, index) => {
    const x = padding + index * stepX;
    const y =
      max === min
        ? height / 2
        : height - padding - ((value - min) / range) * (height - padding * 2);
    return [x, y] as const;
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1][0].toFixed(2)},${height} L${coords[0][0].toFixed(2)},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      role="img"
      aria-label={`Score trend, ${points.length} readings, latest ${points[points.length - 1].toFixed(1)}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      <path d={area} fill={`url(#${gradientId})`} />
      <path
        ref={pathRef}
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={
          length
            ? {
                strokeDasharray: length,
                animation: `draw-line var(--duration-sparkline) var(--ease-in-out) both`,
                // The keyframe reads its start offset from this variable.
                ["--line-length" as string]: `${length}`,
              }
            : undefined
        }
      />
    </svg>
  );
}
