/**
 * Placeholder data for the dashboard foundation.
 *
 * All names and figures here are fictional and exist only so the layout can be
 * reviewed. Real appointments, patients, and metrics are loaded from
 * PostgreSQL in the dashboard phase. No real patient information is stored.
 */

export const DASHBOARD_DEMO_NOTICE =
  "Placeholder data for layout review only. Live data is connected in the dashboard phase.";

export const dashboardStats = [
  { id: "today", label: "Appointments today", value: "8", change: "+2 vs. yesterday", trend: "up" },
  { id: "week", label: "This week", value: "34", change: "On track", trend: "flat" },
  { id: "pending", label: "Pending requests", value: "5", change: "Needs review", trend: "attention" },
  { id: "patients", label: "Active patients", value: "412", change: "+9 this month", trend: "up" },
];

export const demoAppointments = [
  { id: "apt-1", reference: "DOC-7K3Q9D", patient: "A. Rivera", doctorId: "dr-williams", serviceId: "general-consultation", date: "Today", time: "09:00", status: "confirmed" },
  { id: "apt-2", reference: "DOC-2M8XWP", patient: "J. Chen", doctorId: "dr-jennifer", serviceId: "preventive-health-screening", date: "Today", time: "09:30", status: "confirmed" },
  { id: "apt-3", reference: "DOC-5RQ2LT", patient: "M. Okafor", doctorId: "dr-jones", serviceId: "minor-illness-injury", date: "Today", time: "10:00", status: "pending" },
  { id: "apt-4", reference: "DOC-9VBH4N", patient: "S. Patel", doctorId: "dr-williams", serviceId: "follow-up-care", date: "Today", time: "11:30", status: "completed" },
  { id: "apt-5", reference: "DOC-3ZJD6C", patient: "L. Nguyen", doctorId: "dr-jennifer", serviceId: "wellness-lifestyle", date: "Tomorrow", time: "08:30", status: "pending" },
  { id: "apt-6", reference: "DOC-8TWK1F", patient: "R. Alvarez", doctorId: "dr-jones", serviceId: "virtual-consultation", date: "Tomorrow", time: "14:00", status: "cancelled" },
];

export const demoPatients = [
  { id: "pat-1", name: "A. Rivera", email: "a.rivera@example.com", phone: "(213) 555-0101", lastVisit: "Today", visits: 6 },
  { id: "pat-2", name: "J. Chen", email: "j.chen@example.com", phone: "(213) 555-0102", lastVisit: "Today", visits: 2 },
  { id: "pat-3", name: "M. Okafor", email: "m.okafor@example.com", phone: "(213) 555-0103", lastVisit: "2 weeks ago", visits: 1 },
  { id: "pat-4", name: "S. Patel", email: "s.patel@example.com", phone: "(213) 555-0104", lastVisit: "1 month ago", visits: 11 },
  { id: "pat-5", name: "L. Nguyen", email: "l.nguyen@example.com", phone: "(213) 555-0105", lastVisit: "3 months ago", visits: 3 },
];

export const appointmentStatusMeta = {
  pending: { label: "Pending", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "brand" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
  no_show: { label: "No show", variant: "neutral" },
};

export const contentBlocks = [
  { key: "home.hero", label: "Homepage hero", description: "Headline, supporting text and call-to-action buttons.", updated: "Demo" },
  { key: "home.introduction", label: "Practice introduction", description: "Intro paragraph and pillars on the homepage.", updated: "Demo" },
  { key: "about.mission", label: "Mission & vision", description: "Mission, vision and values on the About page.", updated: "Demo" },
  { key: "faqs", label: "FAQs", description: "Questions and answers shown on the FAQ page and homepage.", updated: "Demo" },
  { key: "legal", label: "Legal pages", description: "Privacy policy and terms of use.", updated: "Demo" },
];

export const settingsGroups = [
  { id: "profile", label: "Clinic profile", description: "Name, descriptor, tagline and description used across the site." },
  { id: "contact", label: "Contact details", description: "Address, phone, email and map location." },
  { id: "hours", label: "Opening hours", description: "Weekly opening hours shown in the footer and contact page." },
  { id: "booking", label: "Booking rules", description: "Booking window, lead time, slot length and cancellation policy." },
  { id: "notifications", label: "Notifications", description: "Email templates and sender settings for confirmations." },
  { id: "users", label: "Staff accounts", description: "Dashboard users, roles and access." },
];
