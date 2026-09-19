import { Hero } from "@/components/hero/Hero";
import { Introduction } from "@/components/home/Introduction";
import { ServicesSection } from "@/components/home/ServicesSection";
import { DoctorsSection } from "@/components/home/DoctorsSection";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { AppointmentProcess } from "@/components/home/AppointmentProcess";
import { ClinicInfo } from "@/components/home/ClinicInfo";
import { FaqPreview } from "@/components/home/FaqPreview";
import { Testimonials } from "@/components/home/Testimonials";
import { CtaSection } from "@/components/layout/CtaSection";
import { buildMetadata } from "@/lib/metadata";
import { listFaqs } from "@/server/repositories/faqsRepository";
import { listTestimonials } from "@/server/repositories/testimonialsRepository";
import { getClinicSettings, getLeadDoctorCached, getPublicDoctors, getPublicServices, getSiteContent } from "@/server/services/contentService";

export async function generateMetadata() {
  const [clinic, leadDoctor] = await Promise.all([getClinicSettings(), getLeadDoctorCached()]);
  const led = leadDoctor ? ` with ${leadDoctor.name} and` : " with";
  return buildMetadata({
    title: `${clinic.name} | Medical Practice in ${clinic.city}, ${clinic.state}`,
    description: `Book an appointment${led} the ${clinic.name} team in ${clinic.city}, ${clinic.stateFull}. Patient-centered general medical care with convenient online booking.`,
    path: "/",
    siteName: clinic.name,
    absoluteTitle: true,
  });
}

export default async function HomePage() {
  const [clinic, content, leadDoctor, doctors, services, faqs, testimonials] = await Promise.all([
    getClinicSettings(),
    getSiteContent(),
    getLeadDoctorCached(),
    getPublicDoctors(),
    getPublicServices(),
    listFaqs({ featuredOnly: true }),
    listTestimonials({ publicOnly: true }).catch(() => []),
  ]);

  return (
    <>
      <Hero doctor={leadDoctor} clinic={clinic} content={content["home.hero"]} />
      <Introduction doctor={leadDoctor} content={content["home.introduction"]} />
      <ServicesSection services={services.slice(0, 6)} doctors={doctors} />
      <DoctorsSection doctors={doctors} />
      <WhyChooseUs content={content["home.why"]} />
      <AppointmentProcess />
      <Testimonials testimonials={testimonials} />
      <ClinicInfo clinic={clinic} />
      <FaqPreview faqs={faqs} />
      <CtaSection />
    </>
  );
}
