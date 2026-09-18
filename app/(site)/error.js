"use client";

import { useEffect } from "react";
import { RotateCcw, Home } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";

export default function SiteError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center bg-hero-glow">
      <Container className="py-20 sm:py-28">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">Something went wrong</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            We hit an unexpected problem
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Please try again. If the problem continues, you can still reach the clinic by phone.
          </p>
          {error?.digest && <p className="mt-2 text-xs text-slate-400">Reference: {error.digest}</p>}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={reset} size="lg" leftIcon={RotateCcw}>
              Try again
            </Button>
            <Button href={routes.home} variant="secondary" size="lg" leftIcon={Home}>
              Back to home
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
