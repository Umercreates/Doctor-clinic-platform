import { Hero } from "@/components/hero/Hero";
import { Introduction } from "@/components/home/Introduction";
import { ServicesSection } from "@/components/home/ServicesSection";
import { DoctorsSection } from "@/components/home/DoctorsSection";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { AppointmentProcess } from "@/components/home/AppointmentProcess";
import { ClinicInfo } from "@/components/home/ClinicInfo";
import { FaqPreview } from "@/components/home/FaqPreview";
import { CtaSection } from "@/components/layout/CtaSection";
import { buildMetadata } from "@/lib/metadata";
import { clinic } from "@/data/clinic";
import { listDoctors, getLeadDoctor } from "@/server/repositories/doctorsRepository";
import { listServices } from "@/server/repositories/servicesRepository";
import { listFaqs } from "@/server/repositories/faqsRepository";

export const metadata = buildMetadata({
  title: `${clinic.name} | Medical Practice in ${clinic.city}, ${clinic.state}`,
  description: `Book an appointment with Dr. Williams and the ${clinic.name} team in ${clinic.city}, ${clinic.stateFull}. Patient-centered general medical care with convenient online booking.`,
  path: "/",
  absoluteTitle: true,
});

export default async function HomePage() {
  const [leadDoctor, doctors, services, faqs] = await Promise.all([
    getLeadDoctor(),
    listDoctors(),
    listServices(),
    listFaqs({ featuredOnly: true }),
  ]);

  return (
    <>
      <Hero doctor={leadDoctor} />
      <Introduction doctor={leadDoctor} />
      <ServicesSection services={services.slice(0, 6)} doctors={doctors} />
      <DoctorsSection doctors={doctors} />
      <WhyChooseUs />
      <AppointmentProcess />
      <ClinicInfo />
      <FaqPreview faqs={faqs} />
      <CtaSection />
    </>
  );
}
