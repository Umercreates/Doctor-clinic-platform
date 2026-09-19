import { MapPin } from "lucide-react";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { DEMO_CLINIC_NOTICE } from "@/data/clinic";
import { cn } from "@/lib/utils";

/**
 * Embedded map of the clinic area. Uses the keyless Google Maps embed URL and
 * loads lazily. The query comes from the address settings (city until a
 * verified address is supplied).
 */
export function MapSection({ clinic, className, height = 420 }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(clinic.address.mapQuery)}&z=12&output=embed`;
  return (
    <div className={cn("overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft", className)}>
      <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
          <MapPin className="h-4 w-4 text-brand-600" aria-hidden="true" />
          {clinic.city}, {clinic.stateFull}
        </p>
        {clinic.address?.isDemo && <DemoNotice text={DEMO_CLINIC_NOTICE} />}
      </div>
      <iframe
        title={`Map of ${clinic.name} location area in ${clinic.city}`}
        src={src}
        width="100%"
        height={height}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="block w-full grayscale-[15%]"
        style={{ border: 0 }}
      />
    </div>
  );
}
