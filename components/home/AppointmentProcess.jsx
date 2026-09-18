import { CalendarCheck } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { appointmentProcess } from "@/data/clinic";
import { routes } from "@/lib/routes";

export function AppointmentProcess() {
  return (
    <Section tone="white" aria-labelledby="process-heading">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <Reveal className="lg:sticky lg:top-28">
            <SectionHeading
              eyebrow="How it works"
              title="Book in six simple steps"
              description="Our online booking takes just a few minutes. No account required."
            />
            <Button href={routes.appointments} size="lg" leftIcon={CalendarCheck} className="mt-8">
              Start booking
            </Button>
          </Reveal>
        </div>

        <ol className="relative grid gap-4 sm:grid-cols-2 lg:col-span-8" aria-label="Appointment booking steps">
          {appointmentProcess.map((item, index) => (
            <Reveal as="li" key={item.step} delay={index * 70}>
              <div className="group relative flex h-full gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-accent-200 hover:shadow-lift sm:p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-950 text-sm font-bold tabular-nums text-white transition-colors duration-300 group-hover:bg-accent-500">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 sm:text-lg">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </Section>
  );
}
