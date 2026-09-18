import { ArrowUpRight, Minus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const trendMeta = {
  up: { icon: ArrowUpRight, className: "text-emerald-600 bg-emerald-50" },
  flat: { icon: Minus, className: "text-slate-500 bg-slate-100" },
  attention: { icon: AlertCircle, className: "text-amber-600 bg-amber-50" },
};

export function StatCard({ label, value, change, trend = "flat", className }) {
  const meta = trendMeta[trend] || trendMeta.flat;
  return (
    <div className={cn("rounded-3xl border border-slate-200 bg-white p-5 shadow-soft", className)}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium", meta.className)}>
          <meta.icon className="h-3.5 w-3.5" aria-hidden="true" />
          {change}
        </span>
      </div>
    </div>
  );
}
