import { cn } from "@/lib/utils";
import { Container } from "./Container";

const tones = {
  white: "bg-white",
  muted: "bg-surface-muted",
  subtle: "bg-surface-subtle",
  dark: "bg-brand-gradient text-white",
  transparent: "",
};

const paddings = {
  default: "py-16 sm:py-20 lg:py-24",
  compact: "py-12 sm:py-14 lg:py-16",
  large: "py-20 sm:py-24 lg:py-32",
  none: "",
};

/**
 * Page section with consistent vertical rhythm and background tones.
 */
export function Section({
  as: Component = "section",
  tone = "white",
  padding = "default",
  containerSize = "default",
  className,
  containerClassName,
  children,
  ...props
}) {
  return (
    <Component className={cn("relative", tones[tone], paddings[padding], className)} {...props}>
      <Container size={containerSize} className={containerClassName}>
        {children}
      </Container>
    </Component>
  );
}
