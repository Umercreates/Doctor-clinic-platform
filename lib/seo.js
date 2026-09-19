import { absoluteUrl } from "@/lib/site";
import { routes } from "@/lib/routes";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Structured data policy: only facts the practice has verified are emitted.
 * Settings groups flagged `isDemo` (placeholder phone, address, opening
 * hours) are left out entirely rather than published as if they were real.
 * Ratings/reviews are never emitted.
 */

/** Local-business structured data (MedicalClinic) for the site shell. */
export function buildClinicJsonLd({ clinic, doctors = [] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": absoluteUrl("/#clinic"),
    name: clinic.name,
    description: clinic.description,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/images/logo/logo.png"),
    image: absoluteUrl("/opengraph-image"),
    // City and state are verified facts about the practice.
    address: {
      "@type": "PostalAddress",
      addressLocality: clinic.city,
      addressRegion: clinic.state,
      addressCountry: "US",
    },
    areaServed: { "@type": "City", name: clinic.city },
    medicalSpecialty: "PrimaryCare",
    employee: doctors.map((doctor) => ({
      "@type": "Physician",
      name: doctor.name,
      jobTitle: doctor.role,
      url: absoluteUrl(routes.doctor(doctor.slug)),
      ...(doctor.photo?.src && !doctor.photo.src.endsWith("placeholder.svg") ? { image: absoluteUrl(doctor.photo.src) } : {}),
    })),
    potentialAction: {
      "@type": "ReserveAction",
      target: absoluteUrl(routes.appointments),
      name: "Book an appointment",
    },
  };

  if (clinic.contact && !clinic.contact.isDemo) {
    data.telephone = clinic.contact.phone;
    data.email = clinic.contact.email;
  }
  if (clinic.address && !clinic.address.isDemo) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: [clinic.address.line1, clinic.address.line2].filter(Boolean).join(", "),
      addressLocality: clinic.address.city,
      addressRegion: clinic.address.state,
      postalCode: clinic.address.postalCode,
      addressCountry: "US",
    };
  }
  if (clinic.hours && !clinic.hours.isDemo) {
    data.openingHoursSpecification = (clinic.hours.schedule || [])
      .filter((d) => d.open)
      .map((d) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DAY_NAMES[d.day],
        opens: d.open,
        closes: d.close,
      }));
  }
  const social = (clinic.social?.links || []).map((l) => l.href).filter((href) => href && href !== "#");
  if (social.length) data.sameAs = social;
  return data;
}

/** WebSite entity so search engines attribute pages to the practice site. */
export function buildWebsiteJsonLd({ clinic }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: clinic.name,
    url: absoluteUrl("/"),
    publisher: { "@id": absoluteUrl("/#clinic") },
    inLanguage: "en-US",
  };
}

export function buildDoctorJsonLd(doctor, clinic) {
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: doctor.name,
    jobTitle: doctor.role,
    ...(doctor.shortBio ? { description: doctor.shortBio } : {}),
    ...(doctor.photo?.src && !doctor.photo.src.endsWith("placeholder.svg") ? { image: absoluteUrl(doctor.photo.src) } : {}),
    url: absoluteUrl(routes.doctor(doctor.slug)),
    worksFor: { "@id": absoluteUrl("/#clinic") },
    address: {
      "@type": "PostalAddress",
      addressLocality: clinic.city,
      addressRegion: clinic.state,
      addressCountry: "US",
    },
  };
}

export function buildServiceJsonLd(service, clinic) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: service.name,
    description: service.shortDescription || service.description,
    url: absoluteUrl(routes.service(service.slug)),
    provider: { "@id": absoluteUrl("/#clinic") },
    areaServed: { "@type": "City", name: clinic.city },
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
