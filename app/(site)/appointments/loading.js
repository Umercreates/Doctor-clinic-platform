import { Container } from "@/components/layout/Container";
import { Skeleton } from "@/components/ui/Skeleton";

/** Route-level loading UI shown while a public page streams in. */
export default function SiteLoading() {
  return (
    <div className="bg-hero-glow" aria-busy="true" aria-live="polite">
      <Container className="py-16 sm:py-24">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-5 h-12 w-3/4 max-w-2xl" />
        <Skeleton className="mt-3 h-12 w-1/2 max-w-md" />
        <Skeleton className="mt-6 h-5 w-full max-w-xl" />
        <Skeleton className="mt-2 h-5 w-2/3 max-w-lg" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-3xl" />
          ))}
        </div>
        <span className="sr-only">Loading page</span>
      </Container>
    </div>
  );
}
