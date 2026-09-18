import { cn } from "@/lib/utils";

/**
 * Surface card. `interactive` adds the hover lift used across the site.
 */
export function Card({ as: Component = "div", interactive = false, className, children, ...props }) {
  return (
    <Component
      className={cn(
        "rounded-3xl border border-slate-200/80 bg-white shadow-soft",
        interactive &&
          "transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
