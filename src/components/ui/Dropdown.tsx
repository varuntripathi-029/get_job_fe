import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface MenuItem {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  /** Renders a hairline above this item instead of a normal entry. */
  divider?: boolean;
  danger?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: MenuItem[];
  align?: "left" | "right";
  className?: string;
  triggerLabel?: string;
}

export function Dropdown({ trigger, items, align = "right", className, triggerLabel }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={triggerLabel}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-6"
      >
        {trigger}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "animate-scale-in bg-surface border-border-bright rounded-card shadow-hover z-dropdown absolute top-full mt-8 min-w-180 border p-4",
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left",
          )}
        >
          {items.map((item, index) =>
            item.divider ? (
              <div key={`divider-${index}`} className="bg-border my-4 h-px" role="separator" />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
                className={cn(
                  "text-body-sm rounded-input hover:bg-surface-raised flex w-full items-center gap-8 px-12 py-8 text-left transition-colors duration-150",
                  item.danger ? "text-signal-red" : "text-text-primary",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

interface SelectProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

/** A native <select> wearing the design's input skin.
 *
 * Deliberately native rather than a custom listbox: it gets keyboard support,
 * type-ahead and a usable mobile picker for free, and these are plain
 * single-choice filters with nothing custom to render per option. */
export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  placeholder,
  className,
}: SelectProps<T>) {
  return (
    <label className={cn("relative inline-flex items-center", className)}>
      {label && <span className="sr-only">{label}</span>}
      <select
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value as T)}
        className={cn(
          "bg-surface border-border rounded-input text-mono text-text-primary w-full appearance-none border py-8 pr-32 pl-12",
          "hover:border-border-bright focus:border-signal-indigo cursor-pointer transition-colors duration-150 outline-none",
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="text-text-muted pointer-events-none absolute right-12 size-14"
        aria-hidden
      />
    </label>
  );
}
