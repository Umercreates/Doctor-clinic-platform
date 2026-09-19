import { notFound } from "next/navigation";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { DoctorForm } from "@/components/dashboard/catalog/DoctorForm";
import { dashboardRoutes } from "@/lib/routes";
import { isUuid } from "@/lib/validation/common";
import { requirePagePermission } from "@/server/auth/pageGuards";
import { getDoctorById } from "@/server/repositories/doctorsRepository";
import { listServices } from "@/server/repositories/servicesRepository";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const doctor = isUuid(id) ? await getDoctorById(id, { includeInactive: true }) : null;
  return { title: doctor ? `Edit ${doctor.name}` : "Doctor" };
}

export default async function EditDoctorPage({ params }) {
  await requirePagePermission("doctors:write", dashboardRoutes.doctors);
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [doctor, services] = await Promise.all([getDoctorById(id, { includeInactive: true }), listServices()]);
  if (!doctor) notFound();
  return (
    <>
      <PageTitle title={doctor.name} description="Edit the public profile, services offered and availability." demo={false} />
      <DoctorForm doctor={doctor} services={services.map((s) => ({ id: s.id, name: s.name, durationMinutes: s.durationMinutes }))} />
    </>
  );
}
