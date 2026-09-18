import { cn } from "@/lib/utils";

const sizes = {
  default: "max-w-7xl",
  narrow: "max-w-3xl",
  medium: "max-w-5xl",
  wide: "max-w-[88rem]",
};

export function Container({ as: Component = "div", size = "default", className, children, ...props }) {
  return (
    <Component className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizes[size], className)} {...props}>
      {children}
    </Component>
  );
}
