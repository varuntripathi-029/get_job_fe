import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-16 pt-32 pb-24", className)}>
      <div className="min-w-0">
        <h1 className="text-h1 text-text-primary">{title}</h1>
        {subtitle && <div className="text-body-sm text-text-secondary mt-8">{subtitle}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-8">{actions}</div>}
    </div>
  );
}
