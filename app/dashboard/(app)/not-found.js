import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { dashboardRoutes } from "@/lib/routes";

export default function DashboardNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft">
      <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
        <Compass className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Not found</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">We could not find that record</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">It may have been removed, or the link may be out of date.</p>
      <Button href={dashboardRoutes.root} variant="secondary" className="mt-6" leftIcon={Home}>
        Back to overview
      </Button>
    </div>
  );
}
