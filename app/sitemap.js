import { absoluteUrl } from "@/lib/site";
import { publicStaticRoutes, routes } from "@/lib/routes";
import { listDoctors } from "@/server/repositories/doctorsRepository";
import { listServices } from "@/server/repositories/servicesRepository";

export default async function sitemap() {
  const [doctors, services] = await Promise.all([listDoctors(), listServices()]);
  const lastModified = new Date();

  const staticEntries = publicStaticRoutes.map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === routes.appointments ? 0.9 : 0.7,
  }));

  const doctorEntries = doctors.map((doctor) => ({
    url: absoluteUrl(routes.doctor(doctor.slug)),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const serviceEntries = services.map((service) => ({
    url: absoluteUrl(routes.service(service.slug)),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const legalEntries = [routes.privacy, routes.terms].map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  return [...staticEntries, ...doctorEntries, ...serviceEntries, ...legalEntries];
}
