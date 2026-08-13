import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PillVariant = "filled" | "outlined";
export type PillSize = "sm" | "md";

interface PillClassOptions {
  variant?: PillVariant;
  size?: PillSize;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Exported separately so anchors and router Links can wear the same skin
 * without nesting an <a> inside a <button>. */
export function pillClasses({
  variant = "filled",
  size = "md",
  active = false,
  disabled = false,
  className,
}: PillClassOptions = {}): string {
  return cn(
    "inline-flex items-center justify-center gap-6 rounded-pill text-mono-ui whitespace-nowrap",
    "transition-all duration-200 ease-out select-none",
    size === "sm" ? "px-16 py-6" : "px-20 py-8",
    variant === "filled" && [
      "bg-signal-indigo text-text-on-indigo font-medium",
      !disabled && "hover:bg-indigo-light hover:-translate-y-px active:translate-y-0 active:scale-97 active:bg-indigo-dim",
    ],
    variant === "outlined" && [
      "border",
      active
        ? "border-signal-indigo bg-indigo-10 text-signal-indigo"
        : "border-border-bright text-text-primary",
      !disabled && !active && "hover:border-signal-indigo hover:bg-indigo-5 hover:text-signal-indigo",
      !disabled && active && "hover:bg-indigo-15",
    ],
    disabled && "cursor-not-allowed opacity-40",
    className,
  );
}

interface PillButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variant?: PillVariant;
  size?: PillSize;
  active?: boolean;
  className?: string;
  children: ReactNode;
}

export function PillButton({
  variant = "filled",
  size = "md",
  active = false,
  disabled = false,
  className,
  children,
  type = "button",
  ...rest
}: PillButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      aria-pressed={variant === "outlined" ? active : undefined}
      className={pillClasses({ variant, size, active, disabled, className })}
      {...rest}
    >
      {children}
    </button>
  );
}
