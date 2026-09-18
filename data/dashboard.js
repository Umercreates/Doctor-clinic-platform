/**
 * Static presentation data for the dashboard. Appointments, patients, doctors,
 * services and schedules come from PostgreSQL; the items below describe
 * dashboard sections whose editors arrive in the dashboard phase.
 */

export const DASHBOARD_DEMO_NOTICE = "Editing tools for this section are added in the dashboard phase.";

export const appointmentStatusMeta = {
  pending: { label: "Pending", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "brand" },
  rescheduled: { label: "Rescheduled", variant: "accent" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
  no_show: { label: "No show", variant: "neutral" },
};

export const contentBlocks = [
  { key: "home.hero", label: "Homepage hero", description: "Headline, supporting text and call-to-action buttons.", updated: "Default" },
  { key: "home.introduction", label: "Practice introduction", description: "Intro paragraph and pillars on the homepage.", updated: "Default" },
  { key: "about.mission", label: "Mission & vision", description: "Mission, vision and values on the About page.", updated: "Default" },
  { key: "faqs", label: "FAQs", description: "Questions and answers shown on the FAQ page and homepage.", updated: "Seeded" },
  { key: "legal", label: "Legal pages", description: "Privacy policy and terms of use.", updated: "Default" },
];

export const settingsGroups = [
  { id: "profile", label: "Clinic profile", description: "Name, descriptor, tagline and description used across the site." },
  { id: "contact", label: "Contact details", description: "Address, phone, email and map location." },
  { id: "hours", label: "Opening hours", description: "Weekly opening hours shown in the footer and contact page." },
  { id: "booking", label: "Booking rules", description: "Booking window, lead time, slot length and cancellation policy." },
  { id: "notifications", label: "Notifications", description: "Email templates and sender settings for confirmations." },
  { id: "users", label: "Staff accounts", description: "Dashboard users, roles and access." },
];
