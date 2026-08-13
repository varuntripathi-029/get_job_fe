import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function Toggle({ checked, onChange, label, className }: ToggleProps) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-8", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "rounded-pill relative h-20 w-36 shrink-0 transition-colors duration-150 ease-out",
          checked ? "bg-signal-indigo" : "bg-border-bright",
        )}
      >
        <span
          className={cn(
            "absolute top-2 size-16 rounded-avatar bg-white transition-transform duration-150 ease-out",
            checked ? "translate-x-18" : "translate-x-2",
          )}
        />
      </button>
      {label && <span className="text-mono text-text-secondary">{label}</span>}
    </label>
  );
}
