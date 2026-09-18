import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  info: { icon: Info, classes: "border-brand-200 bg-brand-50 text-brand-900", iconClass: "text-brand-600" },
  success: { icon: CheckCircle2, classes: "border-emerald-200 bg-emerald-50 text-emerald-900", iconClass: "text-emerald-600" },
  warning: { icon: AlertTriangle, classes: "border-amber-200 bg-amber-50 text-amber-900", iconClass: "text-amber-600" },
  error: { icon: XCircle, classes: "border-rose-200 bg-rose-50 text-rose-900", iconClass: "text-rose-600" },
};

export function Alert({ tone = "info", title, children, className, action, ...props }) {
  const { icon: Icon, classes, iconClass } = tones[tone] || tones.info;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-2xl border p-4 text-sm", classes, className)}
      {...props}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconClass)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn("leading-relaxed", title && "mt-1")}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
