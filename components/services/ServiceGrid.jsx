import { Stethoscope } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ServiceCard } from "./ServiceCard";
import { cn } from "@/lib/utils";

export function ServiceGrid({ services = [], doctors = [], variant = "default", className }) {
  if (!services.length) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="No services listed yet"
        description="Services will appear here as soon as they are published."
      />
    );
  }

  return (
    <ul className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {services.map((service, index) => (
        <Reveal as="li" key={service.id} delay={(index % 3) * 90} className="h-full">
          <ServiceCard service={service} doctors={doctors} variant={variant} />
        </Reveal>
      ))}
    </ul>
  );
}
