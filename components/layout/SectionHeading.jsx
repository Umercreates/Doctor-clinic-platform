import { cn } from "@/lib/utils";

/**
 * Eyebrow + heading + description block used at the top of most sections.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
  as: Heading = "h2",
  className,
  children,
}) {
  const light = tone === "light";
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "mb-3 text-xs font-semibold uppercase tracking-[0.18em]",
            light ? "text-accent-300" : "text-brand-600",
          )}
        >
          {eyebrow}
        </p>
      )}
      <Heading
        className={cn(
          "text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]",
          light ? "text-white" : "text-slate-900",
        )}
      >
        {title}
      </Heading>
      {description && (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed sm:text-lg",
            light ? "text-white/75" : "text-slate-600",
          )}
        >
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
