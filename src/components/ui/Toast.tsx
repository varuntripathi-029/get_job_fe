import { AlertTriangle, CheckCircle2, Info, X, XCircle, type LucideIcon } from "lucide-react";

import { useToast, type ToastItem, type ToastType } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

const STYLES: Record<ToastType, { border: string; text: string; bar: string; icon: LucideIcon }> = {
  success: {
    border: "border-l-signal-green",
    text: "text-signal-green",
    bar: "bg-signal-green",
    icon: CheckCircle2,
  },
  error: {
    border: "border-l-signal-red",
    text: "text-signal-red",
    bar: "bg-signal-red",
    icon: XCircle,
  },
  info: {
    border: "border-l-signal-blue",
    text: "text-signal-blue",
    bar: "bg-signal-blue",
    icon: Info,
  },
  warning: {
    border: "border-l-momentum-amber",
    text: "text-momentum-amber",
    bar: "bg-momentum-amber",
    icon: AlertTriangle,
  },
};

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const style = STYLES[toast.type];
  const Icon = style.icon;

  return (
    <div
      role="status"
      className={cn(
        "animate-slide-in-right bg-surface shadow-hover rounded-input relative w-320 max-w-full overflow-hidden border-l-3 pt-12 pr-12 pb-16 pl-12",
        style.border,
      )}
    >
      <div className="flex items-start gap-8">
        <Icon className={cn("mt-2 size-16 shrink-0", style.text)} aria-hidden />
        <p className="text-body-sm text-text-primary flex-1 break-words">{toast.message}</p>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss notification"
          className="text-text-muted hover:text-text-primary -mt-2 shrink-0 transition-colors duration-150"
        >
          <X className="size-14" aria-hidden />
        </button>
      </div>
      {toast.duration > 0 && (
        <div
          className={cn("absolute bottom-0 left-0 h-2", style.bar)}
          style={{ animation: `progress-bar ${toast.duration}ms linear forwards` }}
        />
      )}
    </div>
  );
}

/** Rendered once, in the shell. Top-right, newest at the bottom of the stack. */
export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      aria-live="polite"
      className="z-toast pointer-events-none fixed top-64 right-16 flex flex-col gap-8 sm:right-24"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}
