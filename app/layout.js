import { Inter } from "next/font/google";
import { siteConfig, getSiteUrl, absoluteUrl } from "@/lib/site";
import { DEFAULT_OG_IMAGE } from "@/lib/metadata";
import { getClinicSettings } from "@/server/services/contentService";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/** Site-wide metadata defaults, built from the clinic profile in website settings. */
export async function generateMetadata() {
  const clinic = await getClinicSettings();
  const title = `${clinic.name} | Medical Practice in ${clinic.city}, ${clinic.state}`;
  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: title,
      template: `%s | ${clinic.name}`,
    },
    description: clinic.description,
    applicationName: clinic.name,
    keywords: [
      `medical practice ${clinic.city}`,
      `doctor ${clinic.city}`,
      `book doctor appointment ${clinic.city}`,
      clinic.name,
    ],
    authors: [{ name: clinic.name }],
    creator: clinic.name,
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: getSiteUrl(),
      siteName: clinic.name,
      title,
      description: clinic.description,
      images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), width: 1200, height: 630, alt: `${clinic.name} - ${clinic.descriptor}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: clinic.description,
      images: [absoluteUrl(DEFAULT_OG_IMAGE)],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    alternates: { canonical: "/" },
    category: "health",
  };
}

export const viewport = {
  themeColor: siteConfig.themeColor,
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
