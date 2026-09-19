import { siteConfig } from "@/lib/site";
import { getClinicSettings } from "@/server/services/contentService";

export default async function manifest() {
  const clinic = await getClinicSettings();
  return {
    name: `${clinic.name} - ${clinic.descriptor}`,
    short_name: clinic.shortName || clinic.name,
    description: clinic.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: siteConfig.themeColor,
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
