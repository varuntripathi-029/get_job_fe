import { Inbox, type LucideIcon } from "lucide-react";

import { PillButton } from "./PillButton";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-24 py-48 text-center">
      <Icon className="text-text-muted size-48" strokeWidth={1.25} aria-hidden />
      <h3 className="text-h3 text-text-primary mt-16">{title}</h3>
      {description && (
        <p className="text-body-sm text-text-secondary mt-8 max-w-420">{description}</p>
      )}
      {action && (
        <PillButton variant="outlined" className="mt-24" onClick={action.onClick}>
          {action.label}
        </PillButton>
      )}
    </div>
  );
}
