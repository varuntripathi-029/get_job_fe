import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

export type SkeletonVariant = "text" | "circle" | "card" | "chart" | "table-row";

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
  className?: string;
  style?: CSSProperties;
}

const VARIANTS: Record<SkeletonVariant, string> = {
  text: "h-12 rounded-input",
  circle: "size-40 rounded-avatar",
  card: "h-180 rounded-card",
  chart: "h-240 rounded-chart",
  "table-row": "h-48 rounded-input",
};

/** A shimmering block the shape of the content that will replace it.
 * The product never shows spinners — see DESIGN.md, "Don't". */
export function Skeleton({ variant = "text", width, height, className, style }: SkeletonProps) {
  return (
    <div
      aria-hidden
      // surface-raised, not surface: skeletons sit *on* cards, and in light
      // theme a surface-coloured block on a surface-coloured card is invisible.
      className={cn("bg-surface-raised relative overflow-hidden", VARIANTS[variant], className)}
      style={{ width, height, ...style }}
    >
      <div className="animate-shimmer absolute inset-0" />
    </div>
  );
}

/** Placeholder in the exact shape of a CompanyCard, so the grid does not
 * reflow when real data lands. */
export function CompanyCardSkeleton() {
  return (
    <div className="bg-surface border-border rounded-card border p-20">
      <div className="flex items-center gap-12">
        <Skeleton variant="circle" />
        <div className="flex-1 space-y-8">
          <Skeleton width="60%" />
          <Skeleton width="35%" height="10px" />
        </div>
      </div>
      <div className="mt-20 flex items-end justify-between">
        <Skeleton width="80px" height="40px" />
        <Skeleton width="72px" height="20px" />
      </div>
      <div className="border-border mt-16 flex items-center justify-between border-t pt-16">
        <Skeleton width="120px" height="32px" />
        <Skeleton width="64px" height="12px" />
      </div>
    </div>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="bg-surface border-border rounded-card border p-16">
      <Skeleton width="55%" height="18px" />
      <Skeleton width="30%" height="12px" className="mt-8" />
      <div className="mt-16 flex gap-8">
        <Skeleton width="88px" height="22px" className="rounded-pill" />
        <Skeleton width="72px" height="22px" className="rounded-pill" />
        <Skeleton width="64px" height="22px" className="rounded-pill" />
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="bg-surface border-border-bright rounded-r-input border-l-3 p-16">
      <Skeleton width="110px" height="20px" className="rounded-pill" />
      <Skeleton width="75%" height="16px" className="mt-12" />
      <Skeleton width="40%" height="12px" className="mt-8" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-surface border-border rounded-card border p-20">
      <Skeleton width="60%" height="11px" />
      <Skeleton width="45%" height="28px" className="mt-12" />
    </div>
  );
}

interface SkeletonListProps {
  count: number;
  children: (index: number) => React.ReactNode;
  className?: string;
}

export function SkeletonList({ count, children, className }: SkeletonListProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>{children(index)}</div>
      ))}
    </div>
  );
}
