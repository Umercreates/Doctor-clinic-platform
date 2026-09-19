import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildClinicJsonLd, buildWebsiteJsonLd } from "@/lib/seo";
import { getClinicSettings, getPublicDoctors, getPublicServices, getSiteContent } from "@/server/services/contentService";

/**
 * Public website shell: sticky navigation, page content, footer.
 * Clinic settings and content blocks are loaded here once per request
 * (React cache) and shared with the pages through the same helpers.
 */
export default async function SiteLayout({ children }) {
  const [clinic, content, services, doctors] = await Promise.all([getClinicSettings(), getSiteContent(), getPublicServices(), getPublicDoctors()]);

  return (
    <>
      <JsonLd data={[buildClinicJsonLd({ clinic, doctors }), buildWebsiteJsonLd({ clinic })]} />
      <Navbar clinic={clinic} />
      <main id="main-content" className="flex-1 overflow-x-clip">
        {children}
      </main>
      <Footer services={services} clinic={clinic} content={content.footer} />
    </>
  );
}
