import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Accessible name for the dialog. */
  label: string;
  maxWidth?: string;
  /** Search wants the panel high on screen; everything else centres it. */
  align?: "center" | "top";
  showClose?: boolean;
  className?: string;
}

export function Modal({
  open,
  onClose,
  children,
  label,
  maxWidth = "max-w-400",
  align = "center",
  showClose = true,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      // Keep Tab inside the dialog — a focus ring wandering behind the backdrop
      // is how keyboard users get stranded.
      if (event.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    // Move focus in, so the first Tab lands somewhere sensible.
    requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>("input, button, a[href]")?.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "z-modal fixed inset-0 flex justify-center px-16 backdrop-blur-sm",
        align === "center" ? "items-center" : "items-start pt-80",
      )}
      style={{ background: "var(--backdrop-modal)" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          "animate-scale-in bg-surface border-border-bright rounded-modal shadow-modal relative w-full border",
          maxWidth,
          className,
        )}
      >
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-text-muted hover:text-text-primary absolute top-16 right-16 z-raised transition-colors duration-150"
          >
            <X className="size-16" aria-hidden />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
