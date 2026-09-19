/**
 * Central route registry. Use these constants instead of hard-coding paths so
 * navigation, sitemaps, and the future dashboard stay in sync.
 */

export const routes = {
  home: "/",
  about: "/about",
  doctors: "/doctors",
  doctor: (slug) => `/doctors/${slug}`,
  services: "/services",
  service: (slug) => `/services/${slug}`,
  appointments: "/appointments",
  bookWith: ({ doctor, service } = {}) => {
    const params = new URLSearchParams();
    if (doctor) params.set("doctor", doctor);
    if (service) params.set("service", service);
    const query = params.toString();
    return query ? `/appointments?${query}` : "/appointments";
  },
  contact: "/contact",
  faq: "/faq",
  privacy: "/privacy",
  terms: "/terms",
};

/** Dashboard routes (protected by `proxy.js` and the page guards). */
export const dashboardRoutes = {
  root: "/dashboard",
  login: "/dashboard/login",
  appointments: "/dashboard/appointments",
  patients: "/dashboard/patients",
  doctors: "/dashboard/doctors",
  services: "/dashboard/services",
  schedule: "/dashboard/schedule",
  content: "/dashboard/content",
  settings: "/dashboard/settings",
};

/** Primary navigation shown in the header. */
export const primaryNavigation = [
  { label: "Home", href: routes.home },
  { label: "About", href: routes.about },
  { label: "Doctors", href: routes.doctors },
  { label: "Services", href: routes.services },
  { label: "FAQ", href: routes.faq },
  { label: "Contact", href: routes.contact },
];

/** Footer navigation columns. */
export const footerNavigation = [
  { label: "Home", href: routes.home },
  { label: "About the practice", href: routes.about },
  { label: "Our doctors", href: routes.doctors },
  { label: "Services", href: routes.services },
  { label: "Book an appointment", href: routes.appointments },
  { label: "FAQ", href: routes.faq },
  { label: "Contact", href: routes.contact },
];

/** Static public routes included in the sitemap. */
export const publicStaticRoutes = [
  routes.home,
  routes.about,
  routes.doctors,
  routes.services,
  routes.appointments,
  routes.contact,
  routes.faq,
];
