import type { Option } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PillButton } from "./PillButton";

interface FilterPillGroupProps<T extends string> {
  options: Option<T>[];
  selected: T[];
  onChange: (selected: T[]) => void;
  /** Multi lets several be active at once; single toggles one on and the rest off. */
  multi?: boolean;
  label?: string;
  className?: string;
}

export function FilterPillGroup<T extends string>({
  options,
  selected,
  onChange,
  multi = false,
  label,
  className,
}: FilterPillGroupProps<T>) {
  const toggle = (value: T) => {
    if (!multi) {
      // Clicking the active pill clears the filter rather than being a no-op.
      onChange(selected.includes(value) ? [] : [value]);
      return;
    }
    onChange(
      selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value],
    );
  };

  return (
    // min-w-0 is load-bearing: as a flex item this div would otherwise take
    // min-width:auto and size itself to the full pill row, overflowing the
    // page instead of letting the row below scroll.
    <div className={cn("min-w-0", className)}>
      {label && (
        <span className="text-mono-sm text-text-muted mb-8 block uppercase">{label}</span>
      )}
      <div
        role="group"
        aria-label={label}
        className="no-scrollbar scroll-fade-x flex gap-8 overflow-x-auto pb-2"
      >
        {options.map((option) => (
          <PillButton
            key={option.value}
            variant="outlined"
            size="sm"
            active={selected.includes(option.value)}
            onClick={() => toggle(option.value)}
            className={cn("shrink-0")}
          >
            {option.label}
          </PillButton>
        ))}
      </div>
    </div>
  );
}
