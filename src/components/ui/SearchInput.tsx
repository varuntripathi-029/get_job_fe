import { Search, X } from "lucide-react";
import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface SearchInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    // `size` is a number on a native input; here it names a visual scale.
    "onChange" | "value" | "className" | "size"
  > {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  className?: string;
  size?: "md" | "lg";
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onChange, onClear, className, size = "md", placeholder = "Search…", ...rest },
  ref,
) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <Search
        className={cn(
          "text-text-muted pointer-events-none absolute left-12",
          size === "lg" ? "size-18" : "size-16",
        )}
        aria-hidden
      />
      <input
        ref={ref}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "bg-surface border-border rounded-input text-text-primary w-full border pr-36 pl-36 outline-none",
          "focus:border-signal-indigo transition-colors duration-150",
          // The browser's own clear button would sit next to ours.
          "[&::-webkit-search-cancel-button]:appearance-none",
          size === "lg" ? "text-body py-12" : "text-body-sm py-8",
        )}
        {...rest}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onChange("");
            onClear?.();
          }}
          className="text-text-muted hover:text-text-primary absolute right-12 transition-colors duration-150"
        >
          <X className="size-14" aria-hidden />
        </button>
      )}
    </div>
  );
});
