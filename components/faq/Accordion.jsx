"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Accessible accordion. Each item: { id, question, answer }.
 * Uses a CSS grid-rows transition for smooth open/close without measuring.
 */
export function Accordion({ items = [], allowMultiple = false, defaultOpen = [], className }) {
  const baseId = useId();
  const [openIds, setOpenIds] = useState(() => new Set(defaultOpen));

  const toggle = (id) => {
    setOpenIds((prev) => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={cn("divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white shadow-soft", className)}>
      {items.map((item) => {
        const open = openIds.has(item.id);
        const buttonId = `${baseId}-${item.id}-button`;
        const panelId = `${baseId}-${item.id}-panel`;
        return (
          <div key={item.id} className="px-5 sm:px-6">
            <h3 className="m-0">
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 rounded-lg"
              >
                <span className={cn("text-base font-semibold sm:text-[1.05rem]", open ? "text-brand-700" : "text-slate-900")}>
                  {item.question}
                </span>
                <span
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                    open ? "rotate-45 border-brand-200 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-500",
                  )}
                  aria-hidden="true"
                >
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!open}
              aria-hidden={!open}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="pb-5 pr-6 text-[0.95rem] leading-relaxed text-slate-600">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
