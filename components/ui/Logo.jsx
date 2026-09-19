import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { clinic as defaultClinic } from "@/data/clinic";
import { routes } from "@/lib/routes";

const LOGO_SRC = "/images/logo/logo.png";

/**
 * Clinic logo lockup: provided logo mark + wordmark.
 * `tone="light"` is used on dark surfaces (footer, CTA sections).
 * `clinic` (name/descriptor) comes from website settings; defaults are bundled.
 */
export function Logo({
  clinic = defaultClinic,
  href = routes.home,
  size = 40,
  tone = "dark",
  showWordmark = true,
  showDescriptor = true,
  className,
  priority = false,
}) {
  const content = (
    <>
      <span
        className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/90 shadow-soft ring-1 ring-slate-200/70"
        style={{ width: size, height: size }}
      >
        <Image
          src={LOGO_SRC}
          alt=""
          width={size}
          height={size}
          priority={priority}
          className="h-full w-full object-contain p-1"
        />
      </span>
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "text-[1.05rem] font-bold tracking-tight sm:text-lg",
              tone === "light" ? "text-white" : "text-slate-900",
            )}
          >
            {clinic.name}
          </span>
          {showDescriptor && (
            <span
              className={cn(
                "mt-1 text-[0.68rem] font-medium uppercase tracking-[0.14em]",
                tone === "light" ? "text-white/60" : "text-slate-500",
              )}
            >
              {clinic.descriptor}
            </span>
          )}
        </span>
      )}
    </>
  );

  const classes = cn("inline-flex items-center gap-3 rounded-xl", className);

  if (!href) {
    return <span className={classes}>{content}</span>;
  }

  return (
    <Link href={href} className={classes} aria-label={`${clinic.name} - home`}>
      {content}
    </Link>
  );
}
