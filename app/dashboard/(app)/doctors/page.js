import Image from "next/image";
import { CalendarClock, Pencil, Plus } from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { dashboardRoutes, routes } from "@/lib/routes";
import { listDoctors } from "@/server/repositories/doctorsRepository";
import { listServices } from "@/server/repositories/servicesRepository";
import { requirePagePermission } from "@/server/auth/pageGuards";
import { can } from "@/server/auth/permissions";

export const metadata = { title: "Doctors" };
export const dynamic = "force-dynamic";

export default async function DashboardDoctorsPage() {
  const user = await requirePagePermission("doctors:read", dashboardRoutes.doctors);
  const canEdit = can(user, "doctors:write");
  const [doctors, services] = await Promise.all([listDoctors({ includeInactive: canEdit }), listServices()]);

  return (
    <>
      <PageTitle
        title="Doctors"
        description={canEdit ? "Profiles shown on the public website. Add doctors, assign services and manage their weekly hours." : "Profiles shown on the public website."}
        demo={false}
        actions={
          canEdit && (
            <Button size="sm" leftIcon={Plus} href={`${dashboardRoutes.doctors}/new`}>
              Add doctor
            </Button>
          )
        }
      />
      {doctors.length === 0 ? (
        <EmptyState title="No doctors yet" description="Add the first doctor profile to start taking bookings." action={canEdit && <Button size="sm" leftIcon={Plus} href={`${dashboardRoutes.doctors}/new`}>Add doctor</Button>} />
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {doctors.map((doctor) => {
            const hasHours = doctor.schedule.some((d) => d.blocks.length);
            return (
              <li key={doctor.id}>
                <Card className="flex h-full flex-col p-5">
                  <div className="flex items-center gap-4">
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                      <Image src={doctor.photo.src} alt="" fill sizes="64px" className="object-cover" style={{ objectPosition: doctor.photo.position }} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{doctor.name}</p>
                      <p className="truncate text-sm text-slate-500">{doctor.role}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Badge variant={doctor.isActive ? "success" : "neutral"} dot>
                          {doctor.isActive ? "Published" : "Deactivated"}
                        </Badge>
                        {doctor.isLead && <Badge variant="brand">Lead</Badge>}
                      </div>
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Services</dt>
                      <dd className="mt-1 text-slate-700">
                        {doctor.serviceIds.length} of {services.length}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Weekly hours</dt>
                      <dd className={`mt-1 ${hasHours ? "text-slate-700" : "text-amber-700"}`}>{hasHours ? `${doctor.schedule.filter((d) => d.blocks.length).length} days` : "Not set"}</dd>
                    </div>
                  </dl>
                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    {canEdit ? (
                      <>
                        <Button href={`${dashboardRoutes.doctors}/${doctor.id}`} variant="secondary" size="sm" leftIcon={Pencil} className="flex-1">
                          Edit
                        </Button>
                        <Button href={`${dashboardRoutes.schedule}?doctor=${doctor.id}`} variant="ghost" size="sm" leftIcon={CalendarClock} className="flex-1">
                          Hours
                        </Button>
                      </>
                    ) : (
                      doctor.isActive && (
                        <Button href={routes.doctor(doctor.slug)} variant="ghost" size="sm" className="flex-1">
                          View public
                        </Button>
                      )
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
