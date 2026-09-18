"use client";

import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { routes } from "@/lib/routes";

/**
 * Dashboard top bar: menu toggle (mobile), search, notifications, user chip.
 * Search and notifications are wired to real data in the dashboard phase.
 */
export function DashboardHeader({ onOpenSidebar }) {
  return (
    <header className="sticky top-0 z-30 flex h-[4.25rem] items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
        aria-controls="dashboard-sidebar"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <form role="search" className="relative hidden flex-1 md:block md:max-w-md" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="dashboard-search" className="sr-only">
          Search appointments and patients
        </label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          id="dashboard-search"
          type="search"
          placeholder="Search appointments, patients..."
          className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <Badge variant="warning" className="hidden sm:inline-flex">
          Demo mode
        </Badge>
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <Bell className="h-4.5 w-4.5" aria-hidden="true" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-3 rounded-full border border-slate-200 py-1 pl-1 pr-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white" aria-hidden="true">
            DW
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-slate-900">Dr. Williams</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
        </div>
        <Button href={routes.appointments} size="sm" variant="secondary" className="hidden lg:inline-flex">
          New booking
        </Button>
      </div>
    </header>
  );
}
