import { Mail, MapPin, Phone, Printer } from "lucide-react";
import { clinic } from "@/data/clinic";
import { cn } from "@/lib/utils";

function Row({ icon: IconComponent, label, children }) {
  return (
    <div className="flex items-start gap-4">
      <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
        <IconComponent className="h-4.5 w-4.5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <div className="mt-1 text-[0.95rem] text-slate-800">{children}</div>
      </div>
    </div>
  );
}

export function ContactDetails({ className, showFax = false }) {
  const { address, contact } = clinic;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${address.line1}, ${address.city}, ${address.state} ${address.postalCode}`,
  )}`;

  return (
    <div className={cn("space-y-6", className)}>
      <Row icon={MapPin} label="Address">
        <address className="not-italic leading-relaxed">
          {address.line1}, {address.line2}
          <br />
          {address.city}, {address.state} {address.postalCode}, {address.country}
        </address>
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="link-underline mt-1 inline-block rounded-sm text-sm font-medium text-brand-700"
        >
          Get directions
        </a>
      </Row>
      <Row icon={Phone} label="Phone">
        <a href={contact.phoneHref} className="link-underline rounded-sm font-medium">
          {contact.phone}
        </a>
      </Row>
      <Row icon={Mail} label="Email">
        <a href={`mailto:${contact.email}`} className="link-underline break-all rounded-sm font-medium">
          {contact.email}
        </a>
      </Row>
      {showFax && (
        <Row icon={Printer} label="Fax">
          {contact.fax}
        </Row>
      )}
    </div>
  );
}
