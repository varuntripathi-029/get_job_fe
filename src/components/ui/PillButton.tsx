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
      "bg-brand text-text-on-brand font-medium",
      !disabled && "hover:bg-brand-light hover:-translate-y-px active:translate-y-0 active:scale-97 active:bg-brand-dim",
    ],
    variant === "outlined" && [
      "border",
      active
        ? "border-brand bg-brand-10 text-brand"
        : "border-border-bright text-text-primary",
      !disabled && !active && "hover:border-brand hover:bg-brand-5 hover:text-brand",
      !disabled && active && "hover:bg-brand-15",
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
