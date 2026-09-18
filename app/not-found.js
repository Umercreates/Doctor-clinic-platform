import { Compass, Home, CalendarCheck } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";
import { listServices } from "@/server/repositories/servicesRepository";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default async function NotFound() {
  const services = await listServices();
  return (
    <>
      <Navbar />
      <main id="main-content" className="flex flex-1 items-center overflow-x-clip bg-hero-glow">
        <Container className="py-20 sm:py-28">
          <div className="mx-auto max-w-xl text-center animate-slide-up">
            <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-brand-600 shadow-card ring-1 ring-slate-200">
              <Compass className="h-7 w-7" aria-hidden="true" />
            </span>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Error 404</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              We could not find that page
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              The link may be out of date or the page may have moved. You can head back home or book an
              appointment directly.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href={routes.home} variant="secondary" size="lg" leftIcon={Home}>
                Back to home
              </Button>
              <Button href={routes.appointments} size="lg" leftIcon={CalendarCheck}>
                Book Appointment
              </Button>
            </div>
          </div>
        </Container>
      </main>
      <Footer services={services} />
    </>
  );
}
