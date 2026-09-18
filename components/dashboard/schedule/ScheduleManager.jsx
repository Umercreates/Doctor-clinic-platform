"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, CalendarX2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { BlockDialog } from "./BlockDialog";
import { ExceptionDialog } from "./ExceptionDialog";
import { api } from "@/lib/api";
import { formatLongDate, formatTime12h, todayIso } from "@/lib/dates";
import { WEEKDAY_LABELS } from "@/data/doctors";
import { cn } from "@/lib/utils";

const WEEK = [1, 2, 3, 4, 5, 6, 0];

/**
 * Availability management: weekly blocks + date exceptions per doctor.
 * Admins choose any doctor; doctors manage only their own schedule
 * (the API enforces this regardless of what the UI shows).
 */
export function ScheduleManager({ doctors, canManageAll, initialDoctorId, readOnly = false }) {
  const toast = useToast();
  const [doctorId, setDoctorId] = useState(initialDoctorId || doctors[0]?.id || null);
  const [data, setData] = useState({ key: null, blocks: [], exceptions: [], error: "" });
  const [reloadKey, setReloadKey] = useState(0);
  const [dialog, setDialog] = useState(null); // { type: 'block'|'exception', item? } | { type: 'delete-block'|'delete-exception', item }
  const [busy, setBusy] = useState(false);

  const requestKey = `${doctorId}|${reloadKey}`;
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!doctorId) return undefined;
    const controller = new AbortController();
    const key = requestKey;
    api
      .listAvailability({ doctorId, from: todayIso(), includeInactive: "1" })
      .then((response) => setData({ key, blocks: response.data.blocks, exceptions: response.data.exceptions, error: "" }))
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setData({ key, blocks: [], exceptions: [], error: error.message || "Could not load the schedule." });
      });
    return () => controller.abort();
  }, [doctorId, requestKey]);

  const loading = data.key !== requestKey;
  const doctor = doctors.find((d) => d.id === doctorId);

  const runAction = async (fn, successMessage) => {
    setBusy(true);
    try {
      await fn();
      toast.success(successMessage);
      setDialog(null);
      refresh();
    } catch (error) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Dialog submit handlers throw so the dialog can show field errors.
  const submitBlock = async (payload) => {
    if (dialog?.item) await api.updateScheduleBlock(dialog.item.id, payload);
    else await api.createScheduleBlock(payload);
    toast.success(dialog?.item ? "Availability block updated." : "Availability block added.");
    setDialog(null);
    refresh();
  };
  const submitException = async (payload) => {
    if (dialog?.item) await api.updateException(dialog.item.id, payload);
    else await api.createException(payload);
    toast.success(dialog?.item ? "Exception updated." : "Exception saved.");
    setDialog(null);
    refresh();
  };

  const toggleBlockActive = (block) =>
    runAction(() => api.updateScheduleBlock(block.id, { isActive: !block.isActive }), block.isActive ? "Block deactivated. Patients can no longer book these hours." : "Block reactivated.");

  return (
    <div className="space-y-6">
      {canManageAll && (
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="schedule-doctor" className="text-sm font-medium text-slate-800">
            Doctor
          </label>
          <select
            id="schedule-doctor"
            value={doctorId || ""}
            onChange={(event) => setDoctorId(event.target.value)}
            className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {data.error && !loading && <Alert tone="error">{data.error}</Alert>}

      {/* Weekly schedule */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Weekly hours{doctor ? ` · ${doctor.name}` : ""}</h2>
            <p className="text-sm text-slate-500">Recurring availability. Several blocks per day are allowed (e.g. morning and afternoon).</p>
          </div>
          {!readOnly && (
            <Button size="sm" leftIcon={Plus} onClick={() => setDialog({ type: "block" })} disabled={!doctorId}>
              Add block
            </Button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7" aria-busy={loading}>
          {WEEK.map((day) => {
            const blocks = data.blocks.filter((b) => b.weekday === day);
            return (
              <div key={day} className={cn("rounded-2xl border p-3", blocks.some((b) => b.isActive) ? "border-brand-100 bg-brand-50/50" : "border-dashed border-slate-200 bg-slate-50/50")}>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{WEEKDAY_LABELS[day].slice(0, 3)}</p>
                {loading ? (
                  <Skeleton className="mt-2 h-8" />
                ) : blocks.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">Off</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {blocks.map((block) => (
                      <li key={block.id} className={cn("group rounded-xl bg-white p-2 text-xs ring-1 ring-slate-200", !block.isActive && "opacity-60")}>
                        <p className="font-medium tabular-nums text-slate-800">
                          {formatTime12h(block.start)} – {formatTime12h(block.end)}
                        </p>
                        {!block.isActive && <Badge variant="neutral" className="mt-1">Inactive</Badge>}
                        {!readOnly && (
                        <div className="mt-1.5 flex gap-1">
                          <button type="button" onClick={() => setDialog({ type: "block", item: block })} className="rounded-md px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Edit block">
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button type="button" onClick={() => toggleBlockActive(block)} disabled={busy} className="rounded-md px-1.5 py-0.5 text-[11px] text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                            {block.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button type="button" onClick={() => setDialog({ type: "delete-block", item: block })} className="rounded-md px-1.5 py-0.5 text-rose-500 hover:bg-rose-50" aria-label="Delete block">
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Exceptions */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Blocked dates &amp; exceptions</h2>
            <p className="text-sm text-slate-500">Upcoming days off, partial blocks, and extra hours. Clinic-wide entries apply to every doctor.</p>
          </div>
          {!readOnly && (
            <Button size="sm" variant="secondary" leftIcon={CalendarPlus} onClick={() => setDialog({ type: "exception" })} disabled={!doctorId}>
              Add exception
            </Button>
          )}
        </div>

        <div className="mt-5" aria-busy={loading}>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : data.exceptions.length === 0 ? (
            <EmptyState icon={CalendarX2} title="No upcoming exceptions" description="The weekly hours apply to every date. Add an exception to block a day or add extra hours." />
          ) : (
            <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
              {data.exceptions.map((exception) => (
                <li key={exception.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">
                      {formatLongDate(exception.date, { weekday: "short", month: "short" })}
                      {exception.start ? ` · ${formatTime12h(exception.start)} – ${formatTime12h(exception.end)}` : " · all day"}
                    </p>
                    <p className="text-xs text-slate-500">{exception.reason || (exception.isAvailable ? "Extra availability" : "Unavailable")}</p>
                  </div>
                  <Badge variant={exception.isAvailable ? "success" : "danger"}>{exception.isAvailable ? "Extra hours" : "Blocked"}</Badge>
                  {exception.doctorId === null && <Badge variant="neutral">Clinic-wide</Badge>}
                  {!readOnly && (canManageAll || exception.doctorId) && (
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setDialog({ type: "exception", item: exception })} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Edit exception">
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => setDialog({ type: "delete-exception", item: exception })} className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50" aria-label="Delete exception">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {dialog?.type === "block" && <BlockDialog open onClose={() => setDialog(null)} onSubmit={submitBlock} doctorId={doctorId} block={dialog.item || null} />}
      {dialog?.type === "exception" && (
        <ExceptionDialog open onClose={() => setDialog(null)} onSubmit={submitException} doctorId={doctorId} exception={dialog.item || null} allowClinicWide={canManageAll} />
      )}
      <ConfirmDialog
        open={dialog?.type === "delete-block"}
        onClose={() => setDialog(null)}
        busy={busy}
        onConfirm={() => runAction(() => api.deleteScheduleBlock(dialog.item.id), "Availability block removed.")}
        title="Remove this availability block?"
        description="Patients will no longer be able to book these hours. Existing appointments are not affected."
        confirmLabel="Remove block"
      />
      <ConfirmDialog
        open={dialog?.type === "delete-exception"}
        onClose={() => setDialog(null)}
        busy={busy}
        onConfirm={() => runAction(() => api.deleteException(dialog.item.id), "Exception removed.")}
        title="Remove this exception?"
        description="The regular weekly hours will apply to this date again."
        confirmLabel="Remove exception"
      />
    </div>
  );
}
