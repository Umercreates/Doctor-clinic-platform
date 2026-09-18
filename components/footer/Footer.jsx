import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/ui/Logo";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { socialIconMap } from "@/components/ui/SocialIcons";
import { clinic, DEMO_CLINIC_NOTICE } from "@/data/clinic";
import { dashboardRoutes, footerNavigation, routes } from "@/lib/routes";
import { formatTime12h } from "@/lib/dates";

function FooterHeading({ children }) {
  return <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/90">{children}</h2>;
}

function FooterLink({ href, children }) {
  return (
    <Link href={href} className="link-underline inline-block rounded-sm text-[0.95rem] text-white/70 transition-colors hover:text-white">
      {children}
    </Link>
  );
}

export function Footer({ services = [] }) {
  const year = new Date().getFullYear();
  const openDays = clinic.hours.schedule.filter((d) => d.open);
  const closedDays = clinic.hours.schedule.filter((d) => !d.open);

  return (
    <footer className="relative mt-auto bg-brand-950 text-white" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-400/60 to-transparent" aria-hidden="true" />

      <Container className="py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Logo tone="light" size={44} />
            <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-white/70">{clinic.description}</p>
            <div className="mt-6 flex items-center gap-2">
              {clinic.social.links.map((item) => {
                const IconComponent = socialIconMap[item.id];
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    aria-label={`${item.label} (placeholder link)`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    {IconComponent && <IconComponent className="h-4.5 w-4.5" />}
                  </a>
                );
              })}
            </div>
            {clinic.social.isDemo && (
              <DemoNotice tone="light" text="Social links are placeholders." className="mt-3" />
            )}
          </div>

          {/* Navigation */}
          <div className="lg:col-span-2">
            <FooterHeading>Navigate</FooterHeading>
            <ul className="mt-5 space-y-3">
              {footerNavigation.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="lg:col-span-3">
            <FooterHeading>Services</FooterHeading>
            <ul className="mt-5 space-y-3">
              {services.map((service) => (
                <li key={service.id}>
                  <FooterLink href={routes.service(service.slug)}>{service.name}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & hours */}
          <div className="lg:col-span-3">
            <FooterHeading>Contact & hours</FooterHeading>
            <address className="mt-5 space-y-3 not-italic text-[0.95rem] text-white/70">
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent-300" aria-hidden="true" />
                <span>
                  {clinic.address.line1}, {clinic.address.line2}
                  <br />
                  {clinic.address.city}, {clinic.address.state} {clinic.address.postalCode}
                </span>
              </p>
              <p className="flex items-center gap-3">
                <Phone className="h-4.5 w-4.5 shrink-0 text-accent-300" aria-hidden="true" />
                <a href={clinic.contact.phoneHref} className="link-underline rounded-sm hover:text-white">
                  {clinic.contact.phone}
                </a>
              </p>
              <p className="flex items-center gap-3">
                <Mail className="h-4.5 w-4.5 shrink-0 text-accent-300" aria-hidden="true" />
                <a href={`mailto:${clinic.contact.email}`} className="link-underline break-all rounded-sm hover:text-white">
                  {clinic.contact.email}
                </a>
              </p>
            </address>
            <div className="mt-5 flex items-start gap-3 text-[0.95rem] text-white/70">
              <Clock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent-300" aria-hidden="true" />
              <dl className="space-y-1">
                {openDays.map((day) => (
                  <div key={day.day} className="flex justify-between gap-4">
                    <dt className="w-10 shrink-0">{day.label.slice(0, 3)}</dt>
                    <dd className="whitespace-nowrap tabular-nums">
                      {formatTime12h(day.open)} – {formatTime12h(day.close)}
                    </dd>
                  </div>
                ))}
                {closedDays.map((day) => (
                  <div key={day.day} className="flex justify-between gap-4">
                    <dt className="w-10 shrink-0">{day.label.slice(0, 3)}</dt>
                    <dd>Closed</dd>
                  </div>
                ))}
              </dl>
            </div>
            <DemoNotice tone="light" text={DEMO_CLINIC_NOTICE} className="mt-4" />
          </div>
        </div>

        {/* Disclaimer + legal */}
        <div className="mt-14 border-t border-white/10 pt-8">
          <p className="max-w-4xl text-xs leading-relaxed text-white/50">
            <span className="font-semibold text-white/70">Medical disclaimer: </span>
            {clinic.medicalDisclaimer} {clinic.emergencyNotice}
          </p>
          <div className="mt-6 flex flex-col gap-3 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} {clinic.name}. All rights reserved. {clinic.city}, {clinic.stateFull}.
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link href={routes.privacy} className="link-underline rounded-sm hover:text-white/80">
                Privacy
              </Link>
              <Link href={routes.terms} className="link-underline rounded-sm hover:text-white/80">
                Terms
              </Link>
              <Link href={dashboardRoutes.login} className="link-underline rounded-sm hover:text-white/80">
                Staff sign in
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
