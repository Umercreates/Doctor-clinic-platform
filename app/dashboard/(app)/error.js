"use client";

import { useEffect } from "react";
import { Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { dashboardRoutes } from "@/lib/routes";

/** Dashboard error boundary: keeps the shell, shows a safe message (no stack traces). */
export default function DashboardError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">Something went wrong</p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">This page could not be loaded</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        The problem has been logged on the server. Try again, or go back to the overview. If it keeps happening, contact the administrator.
      </p>
      {error?.digest && <p className="mt-2 text-xs text-slate-400">Reference: {error.digest}</p>}
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={reset} leftIcon={RotateCcw}>
          Try again
        </Button>
        <Button href={dashboardRoutes.root} variant="secondary" leftIcon={Home}>
          Overview
        </Button>
      </div>
    </div>
  );
}
