import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:pointer-events-none disabled:opacity-60 active:scale-[0.98]";

const variants = {
  primary:
    "bg-brand-600 text-white shadow-brand hover:bg-brand-700 hover:shadow-lift hover:-translate-y-0.5",
  accent:
    "bg-accent-500 text-white shadow-[0_10px_30px_-10px_rgb(34_168_152_/_0.5)] hover:bg-accent-600 hover:-translate-y-0.5",
  secondary:
    "bg-white text-slate-900 border border-slate-200 shadow-soft hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5",
  outline:
    "bg-transparent text-brand-700 border border-brand-200 hover:bg-brand-50 hover:border-brand-300",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900",
  "ghost-light": "bg-white/10 text-white border border-white/15 hover:bg-white/15 backdrop-blur-sm",
  inverse: "bg-white text-brand-800 shadow-lift hover:bg-brand-50 hover:-translate-y-0.5",
  link: "bg-transparent text-brand-700 hover:text-brand-800 p-0 h-auto rounded-md",
};

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm sm:text-[0.95rem]",
  lg: "h-12 px-6 text-base sm:h-13 sm:px-7",
  xl: "h-14 px-8 text-base",
  icon: "h-11 w-11 p-0",
};

/**
 * Premium button. Renders a Next.js `Link` when `href` is provided.
 *
 * Props: variant, size, loading, leftIcon, rightIcon, fullWidth, href, className
 */
export const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    fullWidth = false,
    href,
    className,
    children,
    type,
    disabled,
    ...props
  },
  ref,
) {
  const classes = cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);

  const content = (
    <>
      {loading ? (
        <Spinner className="h-4 w-4" aria-hidden="true" />
      ) : (
        LeftIcon && <LeftIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span>{children}</span>
      {RightIcon && !loading && (
        <RightIcon
          className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/btn:translate-x-0.5"
          aria-hidden="true"
        />
      )}
    </>
  );

  if (href) {
    return (
      <Link ref={ref} href={href} className={classes} aria-disabled={disabled || undefined} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      type={type || "button"}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </button>
  );
});
