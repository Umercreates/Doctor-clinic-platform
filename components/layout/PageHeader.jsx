import { Container } from "./Container";
import { Breadcrumbs } from "./Breadcrumbs";
import { cn } from "@/lib/utils";

/**
 * Standard header for inner pages: breadcrumbs, eyebrow, H1, intro copy.
 */
export function PageHeader({ eyebrow, title, description, breadcrumbs, actions, className, compact = false }) {
  return (
    <header className={cn("relative overflow-hidden bg-hero-glow", className)}>
      <div className="bg-grid-soft pointer-events-none absolute inset-0" aria-hidden="true" />
      <Container className={cn("relative", compact ? "py-10 sm:py-12 lg:py-14" : "py-14 sm:py-16 lg:py-24")}>
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-6 animate-fade-in" />}
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 animate-slide-up">
              {eyebrow}
            </p>
          )}
          <h1
            className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08] animate-slide-up"
            style={{ animationDelay: "60ms" }}
          >
            {title}
          </h1>
          {description && (
            <p
              className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg animate-slide-up"
              style={{ animationDelay: "120ms" }}
            >
              {description}
            </p>
          )}
          {actions && (
            <div className="mt-8 flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: "180ms" }}>
              {actions}
            </div>
          )}
        </div>
      </Container>
    </header>
  );
}
