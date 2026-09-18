import { Badge } from "@/components/ui/Badge";
import { appointmentStatusMeta } from "@/data/dashboard";

export function StatusBadge({ status, className }) {
  const meta = appointmentStatusMeta[status] || { label: status, variant: "neutral" };
  return (
    <Badge variant={meta.variant} className={className}>
      {meta.label}
    </Badge>
  );
}
