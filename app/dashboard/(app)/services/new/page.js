import { PageTitle } from "@/components/dashboard/PageTitle";
import { ServiceForm } from "@/components/dashboard/catalog/ServiceForm";
import { dashboardRoutes } from "@/lib/routes";
import { requirePagePermission } from "@/server/auth/pageGuards";
import { listDoctors } from "@/server/repositories/doctorsRepository";

export const metadata = { title: "Add service" };
export const dynamic = "force-dynamic";

export default async function NewServicePage() {
  await requirePagePermission("services:write", dashboardRoutes.services);
  const doctors = await listDoctors();
  return (
    <>
      <PageTitle title="Add service" description="Create a service patients can book. Assign at least one doctor so it appears in the booking flow." demo={false} />
      <ServiceForm doctors={doctors.map((d) => ({ id: d.id, name: d.name, role: d.role, isActive: d.isActive }))} />
    </>
  );
}
