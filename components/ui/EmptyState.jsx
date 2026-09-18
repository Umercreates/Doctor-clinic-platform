import { cn } from "@/lib/utils";

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-soft ring-1 ring-slate-200">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-slate-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
