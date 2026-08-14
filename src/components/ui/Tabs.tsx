import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
  /** Rendered after the label, e.g. a result count. */
  badge?: string | number;
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Underline slides between tabs rather than cutting, so the eye can follow
 * which one it moved to. Position is measured from the live DOM because the
 * tabs are text-width and vary with their labels. */
export function Tabs<T extends string>({ tabs, active, onChange, className }: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const current = list.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (!current) return;
    setIndicator({ left: current.offsetLeft, width: current.offsetWidth });
  }, [active]);

  useLayoutEffect(measure, [measure, tabs]);

  // Labels reflow when the font finishes loading or the window resizes.
  useEffect(() => {
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <div className={cn("border-border relative border-b", className)}>
      <div ref={listRef} className="no-scrollbar flex gap-24 overflow-x-auto" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.value === active;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-tab={tab.value}
              onClick={() => onChange(tab.value)}
              className={cn(
                "text-mono-lg -mb-px shrink-0 border-b-2 border-transparent pb-12 whitespace-nowrap transition-colors duration-200 ease-out",
                isActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
              )}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span className="text-text-muted ml-6">{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>
      <span
        aria-hidden
        className="bg-brand absolute bottom-0 block h-2 transition-all duration-200 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
    </div>
  );
}
