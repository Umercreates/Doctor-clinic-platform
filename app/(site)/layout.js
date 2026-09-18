import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildClinicJsonLd } from "@/lib/seo";
import { listServices } from "@/server/repositories/servicesRepository";
import { listDoctors } from "@/server/repositories/doctorsRepository";

/**
 * Public website shell: sticky navigation, page content, footer.
 * The dashboard lives outside this route group and has its own shell.
 */
export default async function SiteLayout({ children }) {
  const [services, doctors] = await Promise.all([listServices(), listDoctors()]);

  return (
    <>
      <JsonLd data={buildClinicJsonLd({ doctors })} />
      <Navbar />
      <main id="main-content" className="flex-1 overflow-x-clip">
        {children}
      </main>
      <Footer services={services} />
    </>
  );
}
