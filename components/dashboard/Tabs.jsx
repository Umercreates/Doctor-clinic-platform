"use client";

import { cn } from "@/lib/utils";

/**
 * Accessible tab strip. `tabs: [{ id, label, count? }]`, controlled via
 * `value`/`onChange`. Panels are rendered by the parent using `value`.
 */
export function Tabs({ tabs, value, onChange, className }) {
  const onKeyDown = (event) => {
    const index = tabs.findIndex((t) => t.id === value);
    if (index === -1) return;
    let next = null;
    if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
    if (event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
    if (event.key === "Home") next = tabs[0];
    if (event.key === "End") next = tabs[tabs.length - 1];
    if (next) {
      event.preventDefault();
      onChange(next.id);
      document.getElementById(`tab-${next.id}`)?.focus();
    }
  };

  return (
    <div className={cn("-mx-1 overflow-x-auto", className)}>
      <div role="tablist" aria-label="Sections" className="inline-flex min-w-full gap-1 border-b border-slate-200 px-1" onKeyDown={onKeyDown}>
        {tabs.map((tab) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={cn(
                "-mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100",
                selected ? "border-brand-600 text-brand-700" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900",
              )}
            >
              {tab.label}
              {typeof tab.count === "number" && (
                <span className={cn("rounded-full px-2 py-0.5 text-xs", selected ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-600")}>{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TabPanel({ id, active, children, className }) {
  if (!active) return null;
  return (
    <div id={`panel-${id}`} role="tabpanel" aria-labelledby={`tab-${id}`} className={cn("pt-6", className)}>
      {children}
    </div>
  );
}
