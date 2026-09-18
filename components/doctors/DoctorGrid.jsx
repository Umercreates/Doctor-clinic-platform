import { Users } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState } from "@/components/ui/EmptyState";
import { DoctorCard } from "./DoctorCard";
import { cn } from "@/lib/utils";

export function DoctorGrid({ doctors = [], variant = "default", className, animate = true }) {
  if (!doctors.length) {
    return (
      <EmptyState
        icon={Users}
        title="No doctors to show yet"
        description="Doctor profiles will appear here as soon as they are published."
      />
    );
  }

  return (
    <ul className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {doctors.map((doctor, index) =>
        animate ? (
          <Reveal as="li" key={doctor.id} delay={index * 90} className="h-full">
            <DoctorCard doctor={doctor} variant={variant} />
          </Reveal>
        ) : (
          <li key={doctor.id} className="h-full">
            <DoctorCard doctor={doctor} variant={variant} />
          </li>
        ),
      )}
    </ul>
  );
}
