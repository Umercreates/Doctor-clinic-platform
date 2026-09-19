/**
 * Static presentation data for the dashboard. Everything shown in the
 * dashboard comes from PostgreSQL; only labels and badge variants live here.
 */

export const DASHBOARD_DEMO_NOTICE = "This section shows placeholder data.";

export const appointmentStatusMeta = {
  pending: { label: "Pending", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "brand" },
  rescheduled: { label: "Rescheduled", variant: "accent" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
  no_show: { label: "No show", variant: "neutral" },
};
