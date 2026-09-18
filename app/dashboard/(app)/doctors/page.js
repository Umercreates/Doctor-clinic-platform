import Image from "next/image";
import { Pencil, Plus } from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { routes } from "@/lib/routes";
import { listDoctors } from "@/server/repositories/doctorsRepository";
import { listServices } from "@/server/repositories/servicesRepository";

export const metadata = { title: "Doctors" };

export default async function DashboardDoctorsPage() {
  const [doctors, services] = await Promise.all([listDoctors(), listServices()]);

  return (
    <>
      <PageTitle
        title="Doctors"
        description="Profiles shown on the public website. Edit names, roles, biographies, and the services each doctor offers."
        actions={
          <Button size="sm" leftIcon={Plus}>
            Add doctor
          </Button>
        }
      />
      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {doctors.map((doctor) => (
          <li key={doctor.id}>
            <Card className="flex h-full flex-col p-5">
              <div className="flex items-center gap-4">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-slate-200">
                  <Image src={doctor.photo.src} alt="" fill sizes="64px" className="object-cover" style={{ objectPosition: doctor.photo.position }} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{doctor.name}</p>
                  <p className="truncate text-sm text-slate-500">{doctor.role}</p>
                  <Badge variant={doctor.isActive ? "success" : "neutral"} dot className="mt-1.5">
                    {doctor.isActive ? "Published" : "Hidden"}
                  </Badge>
                </div>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Services</p>
              <p className="mt-1 text-sm text-slate-700">
                {doctor.serviceIds.length} of {services.length} services
              </p>
              <div className="mt-auto flex gap-2 pt-5">
                <Button variant="secondary" size="sm" leftIcon={Pencil} className="flex-1">
                  Edit
                </Button>
                <Button href={routes.doctor(doctor.slug)} variant="ghost" size="sm" className="flex-1">
                  View public
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
