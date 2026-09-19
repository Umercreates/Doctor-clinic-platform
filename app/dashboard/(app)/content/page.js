import { PageTitle } from "@/components/dashboard/PageTitle";
import { ContentManager } from "@/components/dashboard/content/ContentManager";
import { dashboardRoutes } from "@/lib/routes";
import { requirePagePermission } from "@/server/auth/pageGuards";
import { listContentForAdmin } from "@/server/services/contentService";
import { listFaqs } from "@/server/repositories/faqsRepository";
import { listTestimonials } from "@/server/repositories/testimonialsRepository";
import { listDoctors } from "@/server/repositories/doctorsRepository";

export const metadata = { title: "Website content" };
export const dynamic = "force-dynamic";

export default async function DashboardContentPage({ searchParams }) {
  await requirePagePermission("content:write", dashboardRoutes.content);
  const [{ tab }, sections, faqs, testimonials, doctors] = await Promise.all([
    searchParams,
    listContentForAdmin(),
    listFaqs({ includeInactive: true }),
    listTestimonials({ publicOnly: false }),
    listDoctors({ includeInactive: true }),
  ]);

  return (
    <>
      <PageTitle
        title="Website content"
        description="Edit the text shown on the public website, manage FAQs and record patient testimonials. Changes go live as soon as they are saved."
        demo={false}
      />
      <ContentManager
        sections={sections}
        faqs={faqs}
        testimonials={testimonials}
        doctors={doctors.map((d) => ({ id: d.id, name: d.name }))}
        initialTab={typeof tab === "string" ? tab : undefined}
      />
    </>
  );
}
