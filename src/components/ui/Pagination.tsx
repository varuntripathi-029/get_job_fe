import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";

import { PER_PAGE_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Select } from "./Dropdown";
import { PillButton } from "./PillButton";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
  className?: string;
  /** Binds ← / → to page changes. Off inside modals and nested lists. */
  keyboard?: boolean;
  /** The API returns these alongside total_pages. Prefer them when present —
   * they are computed server-side against the same query that produced the
   * rows, so they stay right even if the count shifts between requests. */
  hasNext?: boolean;
  hasPrev?: boolean;
}

export function Pagination({
  page,
  totalPages,
  onChange,
  perPage,
  onPerPageChange,
  perPageOptions = PER_PAGE_OPTIONS,
  className,
  keyboard = true,
  hasNext,
  hasPrev,
}: PaginationProps) {
  const canPrevious = hasPrev ?? page > 1;
  const canNext = hasNext ?? page < totalPages;

  useEffect(() => {
    if (!keyboard) return;

    const onKeyDown = (event: KeyboardEvent) => {
      // Never steal arrow keys from someone typing or from a modal.
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "ArrowLeft" && canPrevious) onChange(page - 1);
      if (event.key === "ArrowRight" && canNext) onChange(page + 1);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keyboard, page, canPrevious, canNext, onChange]);

  if (totalPages <= 1 && !onPerPageChange) return null;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-between gap-16", className)}
    >
      <span className="text-mono text-text-secondary">
        Page {page} of {Math.max(totalPages, 1)}
      </span>

      <div className="flex items-center gap-8">
        {onPerPageChange && perPage !== undefined && (
          <Select
            label="Results per page"
            value={String(perPage)}
            options={perPageOptions.map((option) => ({
              value: String(option),
              label: `${option} / page`,
            }))}
            onChange={(value) => onPerPageChange(Number(value))}
          />
        )}
        <PillButton
          variant="outlined"
          size="sm"
          disabled={!canPrevious}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="size-14" aria-hidden />
          Prev
        </PillButton>
        <PillButton
          variant="outlined"
          size="sm"
          disabled={!canNext}
          onClick={() => onChange(page + 1)}
        >
          Next
          <ChevronRight className="size-14" aria-hidden />
        </PillButton>
      </div>
    </nav>
  );
}
