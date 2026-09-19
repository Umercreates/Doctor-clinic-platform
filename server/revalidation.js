/**
 * Targeted cache revalidation for the public site.
 *
 * Public pages are statically rendered and only re-rendered when the content
 * that feeds them changes. Every admin write calls one of these helpers so
 * the change is visible immediately without a rebuild. Paths are kept as
 * narrow as possible; `revalidatePath("/", "layout")` is reserved for
 * settings that appear in the shared shell (navbar, footer, JSON-LD).
 */
import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";
import { log } from "@/server/log";

function revalidateAll(paths) {
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch (error) {
      log.error("revalidate.failed", { path, error });
    }
  }
}

/** Doctor profile changes: cards on home/about, listing, profile, service pages, sitemap. */
export function revalidateDoctors(slugs = []) {
  revalidateAll([
    routes.home,
    routes.about,
    routes.doctors,
    ...slugs.filter(Boolean).map((slug) => routes.doctor(slug)),
    "/doctors/[id]",
    routes.services,
    "/services/[id]",
    routes.appointments,
    "/sitemap.xml",
  ]);
}

/** Weekly schedule changes only affect the hours shown on doctor profiles. */
export function revalidateSchedule() {
  revalidateAll(["/doctors/[id]"]);
}

/**
 * Service changes: the footer lists services on every public page, so the
 * whole public layout is revalidated (plus the sitemap).
 */
export function revalidateServices() {
  revalidatePath("/", "layout");
  revalidateAll(["/sitemap.xml"]);
}

/** FAQ changes: FAQ page and the homepage preview (+ FAQ JSON-LD). */
export function revalidateFaqs() {
  revalidateAll([routes.home, routes.faq]);
}

/** Testimonial changes: homepage section. */
export function revalidateTestimonials() {
  revalidateAll([routes.home]);
}

/** Content blocks map to the pages that render them. */
const CONTENT_BLOCK_PATHS = {
  "home.hero": [routes.home],
  "home.introduction": [routes.home],
  "home.why": [routes.home],
  "home.cta": [routes.home],
  "about.intro": [routes.about],
  "about.mission": [routes.about],
  "about.values": [routes.about],
  "about.approach": [routes.about],
};

export function revalidateContentBlock(key) {
  const paths = CONTENT_BLOCK_PATHS[key];
  if (paths) {
    revalidateAll(paths);
    return;
  }
  // Footer (and any block rendered inside the shared shell).
  revalidatePath("/", "layout");
}

/** Clinic settings feed metadata, navbar, footer and JSON-LD on every page. */
export function revalidateSettings(key) {
  if (key === "booking") {
    revalidateAll([routes.appointments]);
    return;
  }
  revalidatePath("/", "layout");
}
