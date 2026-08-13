import { eventMeta } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { EventType } from "@/types";

interface EventTypeBadgeProps {
  type: EventType | string;
  className?: string;
}

export function EventTypeBadge({ type, className }: EventTypeBadgeProps) {
  const meta = eventMeta(type);
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "rounded-pill text-mono-xs inline-flex items-center gap-4 px-8 py-4 font-medium",
        meta.bg,
        meta.text,
        className,
      )}
    >
      <Icon className="size-12" aria-hidden />
      {meta.label}
    </span>
  );
}
