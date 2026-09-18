import { clinic } from "@/data/clinic";
import { absoluteUrl } from "@/lib/site";
import { routes } from "@/lib/routes";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Local-business structured data for Los Angeles local SEO. */
export function buildClinicJsonLd({ doctors = [] } = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": absoluteUrl("/#clinic"),
    name: clinic.name,
    description: clinic.description,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/images/logo/logo.png"),
    image: absoluteUrl("/opengraph-image"),
    telephone: clinic.contact.phone,
    email: clinic.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${clinic.address.line1}, ${clinic.address.line2}`,
      addressLocality: clinic.address.city,
      addressRegion: clinic.address.state,
      postalCode: clinic.address.postalCode,
      addressCountry: "US",
    },
    areaServed: { "@type": "City", name: clinic.city },
    openingHoursSpecification: clinic.hours.schedule
      .filter((d) => d.open)
      .map((d) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DAY_NAMES[d.day],
        opens: d.open,
        closes: d.close,
      })),
    medicalSpecialty: "PrimaryCare",
    employee: doctors.map((doctor) => ({
      "@type": "Physician",
      name: doctor.name,
      jobTitle: doctor.role,
      url: absoluteUrl(routes.doctor(doctor.slug)),
      image: absoluteUrl(doctor.photo.src),
    })),
    potentialAction: {
      "@type": "ReserveAction",
      target: absoluteUrl(routes.appointments),
      name: "Book an appointment",
    },
  };
}

export function buildDoctorJsonLd(doctor) {
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: doctor.name,
    jobTitle: doctor.role,
    description: doctor.shortBio,
    image: absoluteUrl(doctor.photo.src),
    url: absoluteUrl(routes.doctor(doctor.slug)),
    worksFor: { "@id": absoluteUrl("/#clinic") },
    address: {
      "@type": "PostalAddress",
      addressLocality: clinic.address.city,
      addressRegion: clinic.address.state,
      addressCountry: "US",
    },
  };
}

export function buildFaqJsonLd(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function buildBreadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", href: "/" }, ...items].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label || item.name,
      item: absoluteUrl(item.href),
    })),
  };
}
