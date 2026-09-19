"use client";

import { useRouter } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { dashboardRoutes, routes } from "@/lib/routes";

const ROLE_LABELS = { admin: "Administrator", doctor: "Doctor", staff: "Front desk" };

function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

/**
 * Dashboard top bar: menu toggle (mobile), appointment search, signed-in user.
 * The search box submits to the appointments list (?search=), which matches
 * patient name, email and booking reference server-side.
 */
export function DashboardHeader({ user, onOpenSidebar }) {
  const router = useRouter();
  const submitSearch = (event) => {
    event.preventDefault();
    const term = new FormData(event.currentTarget).get("search")?.toString().trim().slice(0, 100);
    router.push(term ? `${dashboardRoutes.appointments}?search=${encodeURIComponent(term)}` : dashboardRoutes.appointments);
  };
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

      <form role="search" className="relative hidden flex-1 md:block md:max-w-md" onSubmit={submitSearch}>
        <label htmlFor="dashboard-search" className="sr-only">
          Search appointments and patients
        </label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          id="dashboard-search"
          name="search"
          type="search"
          placeholder="Search appointments by name, email or reference…"
          className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <Badge variant={user?.role === "admin" ? "brand" : "accent"} className="hidden sm:inline-flex">
          {ROLE_LABELS[user?.role] || user?.role}
        </Badge>
        <div className="flex items-center gap-3 rounded-full border border-slate-200 py-1 pl-1 pr-3" title={user?.email}>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white" aria-hidden="true">
            {initials(user?.name) || "?"}
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="max-w-[10rem] truncate text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="max-w-[10rem] truncate text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
        <Button href={routes.appointments} size="sm" variant="secondary" className="hidden lg:inline-flex">
          New booking
        </Button>
      </div>
    </header>
  );
}
