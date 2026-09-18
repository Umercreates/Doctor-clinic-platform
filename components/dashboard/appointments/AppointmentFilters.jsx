"use client";

import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { dashboardRoutes } from "@/lib/routes";
import { APPOINTMENT_STATUS_VALUES } from "@/lib/validation/appointmentAdmin";
import { appointmentStatusMeta } from "@/data/dashboard";

/**
 * Filter bar for the appointments list. Submits as URL query params so the
 * server page re-renders with filtered PostgreSQL data (shareable URLs).
 */
export function AppointmentFilters({ doctors = [], values = {}, showDoctorFilter = true }) {
  const router = useRouter();

  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["status", "date", "doctorId", "search"]) {
      const value = String(form.get(key) || "").trim();
      if (value) params.set(key, value);
    }
    router.push(`${dashboardRoutes.appointments}${params.toString() ? `?${params}` : ""}`);
  };

  const control =
    "h-10 rounded-full border border-slate-200 bg-white px-3.5 text-sm text-slate-900 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100";

  return (
    <form onSubmit={submit} className="mb-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-5" role="search">
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-search" className="text-xs font-medium text-slate-600">
          Patient or reference
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input id="filter-search" name="search" defaultValue={values.search || ""} placeholder="Name, email, DOC-…" className={`${control} w-full pl-9`} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-date" className="text-xs font-medium text-slate-600">
          Date
        </label>
        <input id="filter-date" name="date" type="date" defaultValue={values.date || ""} className={`${control} w-full`} />
      </div>
      {showDoctorFilter && (
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-doctor" className="text-xs font-medium text-slate-600">
            Doctor
          </label>
          <select id="filter-doctor" name="doctorId" defaultValue={values.doctorId || ""} className={`${control} w-full`}>
            <option value="">All doctors</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-status" className="text-xs font-medium text-slate-600">
          Status
        </label>
        <select id="filter-status" name="status" defaultValue={values.status || ""} className={`${control} w-full`}>
          <option value="">Any status</option>
          {APPOINTMENT_STATUS_VALUES.map((status) => (
            <option key={status} value={status}>
              {appointmentStatusMeta[status]?.label || status}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-2">
        <button type="submit" className="h-10 flex-1 rounded-full bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800">
          Apply
        </button>
        <button
          type="button"
          onClick={() => router.push(dashboardRoutes.appointments)}
          className="inline-flex h-10 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
          aria-label="Clear filters"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Clear
        </button>
      </div>
    </form>
  );
}
