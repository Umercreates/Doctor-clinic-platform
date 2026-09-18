import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";

/**
 * items: [{ label, href }] — the last item is the current page.
 */
export function Breadcrumbs({ items = [], className }) {
  const all = [{ label: "Home", href: routes.home }, ...items];
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-slate-500">
        {all.map((item, index) => {
          const isLast = index === all.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {isLast || !item.href ? (
                <span className="font-medium text-slate-800" aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="link-underline rounded-sm hover:text-slate-800">
                  {item.label}
                </Link>
              )}
              {!isLast && <ChevronRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
