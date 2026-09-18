"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-triggered reveal using IntersectionObserver + CSS transitions.
 *
 * SEO/no-JS safe: the server-rendered markup is fully visible. On the client,
 * elements that are off-screen at mount are hidden and revealed when they
 * enter the viewport; elements already in view are left untouched (no flash).
 * All work happens through class names, so no React state is involved.
 *
 * Props:
 *  - variant: "up" | "fade" | "left" | "right" | "scale"
 *  - delay: milliseconds
 *  - as: element type
 *  - once: unobserve after the first reveal (default true)
 */
export function Reveal({
  as: Component = "div",
  variant = "up",
  delay = 0,
  once = true,
  threshold = 0.15,
  className,
  children,
  ...props
}) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const rect = node.getBoundingClientRect();
    const alreadyInView = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    if (alreadyInView) {
      node.classList.add("is-visible");
      return undefined;
    }

    node.classList.add("is-hidden");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("is-hidden");
            entry.target.classList.add("is-visible");
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove("is-visible");
            entry.target.classList.add("is-hidden");
          }
        });
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, threshold]);

  return (
    <Component
      ref={ref}
      data-variant={variant}
      className={cn("reveal", className)}
      style={delay ? { "--reveal-delay": `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </Component>
  );
}
