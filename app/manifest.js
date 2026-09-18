import { clinic } from "@/data/clinic";
import { siteConfig } from "@/lib/site";

export default function manifest() {
  return {
    name: `${clinic.name} - ${clinic.descriptor}`,
    short_name: clinic.name,
    description: siteConfig.description,
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
