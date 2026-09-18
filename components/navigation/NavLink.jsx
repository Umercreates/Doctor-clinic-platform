"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function isActivePath(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// React 19: `ref` is a regular prop for function components.
export function NavLink({ href, children, className, variant = "desktop", onClick, ref }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  if (variant === "mobile") {
    return (
      <Link
        ref={ref}
        href={href}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center justify-between rounded-2xl px-4 py-3.5 text-base font-medium transition-colors",
          active ? "bg-brand-50 text-brand-700" : "text-slate-800 hover:bg-slate-50",
          className,
        )}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      ref={ref}
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative inline-flex h-10 items-center rounded-full px-3.5 text-[0.925rem] font-medium transition-colors duration-200",
        active ? "text-brand-700" : "text-slate-700 hover:text-slate-900",
        className,
      )}
    >
      <span className="relative">
        {children}
        <span
          aria-hidden="true"
          className={cn(
            "absolute -bottom-1.5 left-0 h-0.5 w-full origin-left rounded-full bg-brand-600 transition-transform duration-300 ease-out",
            active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
          )}
        />
      </span>
    </Link>
  );
}
