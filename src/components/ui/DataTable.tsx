import { ArrowDown, ArrowUp } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { SortOrder } from "@/types";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  sortBy,
  sortOrder = "desc",
  onSort,
  onRowClick,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  className,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    // Tables stay tabular on mobile and scroll sideways rather than collapsing
    // — these are dense admin views where the columns are the point.
    <div className={cn("-mx-16 overflow-x-auto px-16 sm:mx-0 sm:px-0", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-border border-b">
            {columns.map((column) => {
              const isSorted = sortBy === column.key;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={isSorted ? (sortOrder === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(
                    "text-mono-sm text-text-muted px-12 py-12 text-left font-normal uppercase whitespace-nowrap",
                    column.className,
                  )}
                >
                  {column.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.key)}
                      className="hover:text-text-primary inline-flex items-center gap-4 transition-colors duration-150"
                    >
                      {column.header}
                      {isSorted &&
                        (sortOrder === "asc" ? (
                          <ArrowUp className="size-12" aria-hidden />
                        ) : (
                          <ArrowDown className="size-12" aria-hidden />
                        ))}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-border hover:bg-surface-raised border-b transition-colors duration-150",
                onRowClick && "cursor-pointer",
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn("text-body-sm text-text-primary px-12 py-12", column.className)}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
