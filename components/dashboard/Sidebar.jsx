"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Settings,
  Stethoscope,
  Users,
  UserRound,
  CalendarClock,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SignOutButton } from "./SignOutButton";
import { dashboardRoutes, routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

/**
 * Navigation items with the permission each requires. Items a role cannot use
 * are hidden here AND enforced server-side on the page and API.
 */
export const dashboardNavigation = [
  { label: "Overview", href: dashboardRoutes.root, icon: LayoutDashboard, exact: true, roles: ["admin", "staff", "doctor"] },
  { label: "Appointments", href: dashboardRoutes.appointments, icon: CalendarDays, roles: ["admin", "staff", "doctor"] },
  { label: "Patients", href: dashboardRoutes.patients, icon: Users, roles: ["admin", "staff", "doctor"] },
  { label: "Doctors", href: dashboardRoutes.doctors, icon: UserRound, roles: ["admin", "staff"] },
  { label: "Services", href: dashboardRoutes.services, icon: Stethoscope, roles: ["admin", "staff"] },
  { label: "Schedule", href: dashboardRoutes.schedule, icon: CalendarClock, roles: ["admin", "staff", "doctor"] },
  { label: "Website content", href: dashboardRoutes.content, icon: FileText, roles: ["admin"] },
  { label: "Settings", href: dashboardRoutes.settings, icon: Settings, roles: ["admin"] },
];

function isActive(pathname, item) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Dashboard sidebar. Persistent on desktop; slides in as a drawer on mobile.
 */
export function Sidebar({ user, open, onClose }) {
  const pathname = usePathname();
  const items = dashboardNavigation.filter((item) => item.roles.includes(user?.role));

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        id="dashboard-sidebar"
        aria-label="Dashboard navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-out lg:translate-x-0",
          open ? "translate-x-0 shadow-lift" : "-translate-x-full",
        )}
      >
        <div className="flex h-[4.25rem] items-center justify-between border-b border-slate-100 px-5">
          <Logo href={dashboardRoutes.root} size={36} showDescriptor={false} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">Manage</p>
          <ul className="space-y-1">
            {items.map((item) => {
              const active = isActive(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                    )}
                  >
                    <item.icon
                      className={cn("h-4.5 w-4.5 shrink-0", active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600")}
                      aria-hidden="true"
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-1 border-t border-slate-100 p-3">
          <Link
            href={routes.home}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ExternalLink className="h-4.5 w-4.5 text-slate-400" aria-hidden="true" />
            View public website
          </Link>
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}
