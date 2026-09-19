import { PageTitle } from "@/components/dashboard/PageTitle";
import { DoctorForm } from "@/components/dashboard/catalog/DoctorForm";
import { dashboardRoutes } from "@/lib/routes";
import { requirePagePermission } from "@/server/auth/pageGuards";
import { listServices } from "@/server/repositories/servicesRepository";

export const metadata = { title: "Add doctor" };
export const dynamic = "force-dynamic";

export default async function NewDoctorPage() {
  await requirePagePermission("doctors:write", dashboardRoutes.doctors);
  const services = await listServices();
  return (
    <>
      <PageTitle title="Add doctor" description="Create a profile for the public website. You will set weekly hours in the next step." demo={false} />
      <DoctorForm services={services.map((s) => ({ id: s.id, name: s.name, durationMinutes: s.durationMinutes }))} />
    </>
  );
}
