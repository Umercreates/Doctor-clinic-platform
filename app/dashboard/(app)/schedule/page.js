import { CalendarPlus } from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatTime12h } from "@/lib/dates";
import { WEEKDAY_LABELS } from "@/data/doctors";
import { listDoctors } from "@/server/repositories/doctorsRepository";

export const metadata = { title: "Schedule" };

const WEEK = [1, 2, 3, 4, 5, 6, 0];

export default async function DashboardSchedulePage() {
  const doctors = await listDoctors();

  return (
    <>
      <PageTitle
        title="Schedule"
        description="Weekly working hours per doctor. Time off and exceptions are managed here in the dashboard phase."
        actions={
          <Button size="sm" leftIcon={CalendarPlus}>
            Add time off
          </Button>
        }
      />
      <div className="space-y-6">
        {doctors.map((doctor) => (
          <Card key={doctor.id} className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{doctor.name}</h2>
                <p className="text-sm text-slate-500">{doctor.role}</p>
              </div>
              <Badge variant="neutral">{doctor.schedule.length} working days</Badge>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {WEEK.map((day) => {
                const entry = doctor.schedule.find((s) => s.day === day);
                return (
                  <div
                    key={day}
                    className={
                      entry
                        ? "rounded-2xl border border-brand-100 bg-brand-50/60 p-3"
                        : "rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-3"
                    }
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{WEEKDAY_LABELS[day].slice(0, 3)}</p>
                    {entry ? (
                      <ul className="mt-2 space-y-1 text-xs font-medium tabular-nums text-slate-800">
                        {entry.blocks.map((block) => (
                          <li key={block.start}>
                            {formatTime12h(block.start)} – {formatTime12h(block.end)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400">Off</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
