"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CalendarCheck, Menu, Phone, X } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { NavLink } from "./NavLink";
import { MobileMenu } from "./MobileMenu";
import { primaryNavigation, routes } from "@/lib/routes";
import { clinic } from "@/data/clinic";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);

  // Elevate the header once the page is scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu when the route changes (state adjustment during render).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // Close on Escape and lock body scroll while the menu is open.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Close if the viewport grows to desktop while the menu is open.
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = (event) => {
      if (event.matches) setOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled || open
          ? "border-b border-slate-200/70 bg-white/85 shadow-[0_1px_0_rgb(15_23_42_/_0.03),0_8px_24px_-16px_rgb(15_23_42_/_0.25)] backdrop-blur-xl"
          : "border-b border-transparent bg-white/0",
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <Container>
        <div className="flex h-[4.25rem] items-center justify-between gap-4 lg:h-20">
          <Logo priority size={42} showDescriptor />

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {primaryNavigation.map((item) => (
                <li key={item.href}>
                  <NavLink href={item.href}>{item.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={clinic.contact.phoneHref}
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 xl:inline-flex"
            >
              <Phone className="h-4 w-4 text-brand-600" aria-hidden="true" />
              {clinic.contact.phone}
            </a>
            <Button href={routes.appointments} size="md" leftIcon={CalendarCheck} className="hidden sm:inline-flex">
              Book Appointment
            </Button>
            <Button href={routes.appointments} size="sm" leftIcon={CalendarCheck} className="sm:hidden" aria-label="Book Appointment">
              Book
            </Button>
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              aria-label={open ? "Close menu" : "Open menu"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-soft transition-colors hover:bg-slate-50 lg:hidden"
            >
              <span className="relative block h-5 w-5">
                <Menu
                  className={cn(
                    "absolute inset-0 h-5 w-5 transition-all duration-200",
                    open ? "rotate-90 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100",
                  )}
                  aria-hidden="true"
                />
                <X
                  className={cn(
                    "absolute inset-0 h-5 w-5 transition-all duration-200",
                    open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-75 opacity-0",
                  )}
                  aria-hidden="true"
                />
              </span>
            </button>
          </div>
        </div>
      </Container>

      <MobileMenu open={open} onClose={close} />
    </header>
  );
}
