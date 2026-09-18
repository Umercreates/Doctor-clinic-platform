import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_NOTICE } from "@/data/clinic";

/**
 * Small, honest label for placeholder content. Keeps demo information from
 * being mistaken for verified clinic details.
 */
export function DemoNotice({ text = DEMO_NOTICE, className, tone = "muted" }) {
  return (
    <p
      className={cn(
        "inline-flex items-start gap-1.5 text-xs leading-5",
        tone === "muted" && "text-slate-500",
        tone === "light" && "text-white/60",
        tone === "warning" && "text-amber-700",
        className,
      )}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </p>
  );
}
