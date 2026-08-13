import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const nextLabel = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={nextLabel}
      title={nextLabel}
      className={`text-text-secondary hover:text-text-primary hover:bg-surface-raised rounded-pill p-8 transition-colors duration-150 ${className ?? ""}`}
    >
      {theme === "dark" ? (
        <Sun className="size-16" aria-hidden />
      ) : (
        <Moon className="size-16" aria-hidden />
      )}
    </button>
  );
}
