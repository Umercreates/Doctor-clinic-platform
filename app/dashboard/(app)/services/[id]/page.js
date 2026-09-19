import { notFound } from "next/navigation";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { ServiceForm } from "@/components/dashboard/catalog/ServiceForm";
import { dashboardRoutes } from "@/lib/routes";
import { isUuid } from "@/lib/validation/common";
import { requirePagePermission } from "@/server/auth/pageGuards";
import { getServiceById } from "@/server/repositories/servicesRepository";
import { listDoctors } from "@/server/repositories/doctorsRepository";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const service = isUuid(id) ? await getServiceById(id, { includeInactive: true }) : null;
  return { title: service ? `Edit ${service.name}` : "Service" };
}

export default async function EditServicePage({ params }) {
  await requirePagePermission("services:write", dashboardRoutes.services);
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [service, doctors] = await Promise.all([getServiceById(id, { includeInactive: true }), listDoctors({ includeInactive: true })]);
  if (!service) notFound();
  // Doctors already assigned stay selectable even if deactivated; others must be active.
  const selectable = doctors.filter((d) => d.isActive || service.allDoctorIds.includes(d.id));
  return (
    <>
      <PageTitle title={service.name} description="Edit the service details, price and the doctors who offer it." demo={false} />
      <ServiceForm service={service} doctors={selectable.map((d) => ({ id: d.id, name: d.name, role: d.role, isActive: d.isActive }))} />
    </>
  );
}
