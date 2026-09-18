import { clinic } from "@/data/clinic";

/** Absolute site URL, without a trailing slash. */
export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** Build an absolute URL for a path. */
export function absoluteUrl(path = "/") {
  const base = getSiteUrl();
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}

export const siteConfig = {
  name: clinic.name,
  shortName: clinic.shortName,
  description: clinic.description,
  locale: "en_US",
  themeColor: "#1a80c4",
};
