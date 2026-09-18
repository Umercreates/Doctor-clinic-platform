import { Inter } from "next/font/google";
import { siteConfig, getSiteUrl, absoluteUrl } from "@/lib/site";
import { DEFAULT_OG_IMAGE } from "@/lib/metadata";
import { clinic } from "@/data/clinic";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const title = `${clinic.name} | Medical Practice in ${clinic.city}, ${clinic.state}`;

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "medical practice Los Angeles",
    "doctor Los Angeles",
    "book doctor appointment Los Angeles",
    "Dr. Williams",
    clinic.name,
  ],
  authors: [{ name: clinic.name }],
  creator: clinic.name,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: getSiteUrl(),
    siteName: siteConfig.name,
    title,
    description: siteConfig.description,
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), width: 1200, height: 630, alt: `${clinic.name} - ${clinic.descriptor}` }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: siteConfig.description,
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
