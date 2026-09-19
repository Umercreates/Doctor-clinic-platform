import { Badge } from "@/components/ui/Badge";
import { DASHBOARD_DEMO_NOTICE } from "@/data/dashboard";

export function PageTitle({ title, description, actions, demo = false }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {demo && <Badge variant="warning">Placeholder data</Badge>}
        </div>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-slate-600 sm:text-[0.95rem]">{description}</p>}
        {demo && <p className="mt-2 text-xs text-slate-500">{DASHBOARD_DEMO_NOTICE}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
