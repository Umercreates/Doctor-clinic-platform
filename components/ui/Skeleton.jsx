import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-slate-200/70", className)}
      aria-hidden="true"
      {...props}
    />
  );
}
