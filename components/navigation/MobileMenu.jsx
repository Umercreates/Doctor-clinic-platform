"use client";

import { useEffect, useRef } from "react";
import { CalendarCheck, Mail, Phone } from "lucide-react";
import { NavLink } from "./NavLink";
import { Button } from "@/components/ui/Button";
import { primaryNavigation, routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function MobileMenu({ open, onClose, clinic }) {
  const firstLinkRef = useRef(null);

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => firstLinkRef.current?.focus(), 120);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-x-0 bottom-0 top-[4.25rem] z-40 bg-slate-900/30 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Panel */}
      <div
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={cn(
          "absolute inset-x-0 top-full z-50 origin-top border-b border-slate-200 bg-white shadow-lift transition-all duration-300 ease-out lg:hidden",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
        )}
      >
        <div className="mx-auto max-h-[calc(100dvh-4.25rem)] w-full max-w-7xl overflow-y-auto px-4 pb-6 pt-3 sm:px-6">
          <nav aria-label="Mobile primary">
            <ul className="flex flex-col gap-1">
              {primaryNavigation.map((item, index) => (
                <li
                  key={item.href}
                  className={cn("transition-all duration-300 ease-out", open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")}
                  style={{ transitionDelay: open ? `${60 + index * 35}ms` : "0ms" }}
                >
                  <NavLink href={item.href} variant="mobile" onClick={onClose} ref={index === 0 ? firstLinkRef : undefined}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <Button href={routes.appointments} fullWidth size="lg" leftIcon={CalendarCheck} onClick={onClose}>
              Book Appointment
            </Button>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <a
                href={clinic.contact.phoneHref}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-100"
              >
                <Phone className="h-4 w-4 text-brand-600" aria-hidden="true" />
                {clinic.contact.phone}
              </a>
              <a
                href={`mailto:${clinic.contact.email}`}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-100"
              >
                <Mail className="h-4 w-4 text-brand-600" aria-hidden="true" />
                <span className="truncate">{clinic.contact.email}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
