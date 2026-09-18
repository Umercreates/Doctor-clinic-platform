"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input, Select } from "@/components/ui/FormField";
import { validateScheduleException } from "@/lib/validation/availability";
import { todayIso } from "@/lib/dates";

const KIND_OPTIONS = [
  { value: "blocked-day", label: "Block the whole day" },
  { value: "blocked-range", label: "Block a time range" },
  { value: "extra", label: "Add extra availability" },
];

function kindOf(exception) {
  if (!exception) return "blocked-day";
  if (exception.isAvailable) return "extra";
  return exception.start ? "blocked-range" : "blocked-day";
}

/**
 * Create or edit a schedule exception: blocked day, blocked time range, or an
 * extra availability window. `doctorId === null` means clinic-wide (admin only).
 */
export function ExceptionDialog({ open, onClose, onSubmit, doctorId, exception = null, allowClinicWide = false }) {
  const [values, setValues] = useState({
    kind: kindOf(exception),
    date: exception?.date || todayIso(),
    start: exception?.start || "09:00",
    end: exception?.end || "12:00",
    reason: exception?.reason || "",
    scope: exception ? (exception.doctorId ? "doctor" : "clinic") : "doctor",
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => {
    setValues((v) => ({ ...v, [field]: event.target.value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const withTimes = values.kind !== "blocked-day";

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      doctorId: values.scope === "clinic" ? null : doctorId,
      date: values.date,
      start: withTimes ? values.start : null,
      end: withTimes ? values.end : null,
      isAvailable: values.kind === "extra",
      reason: values.reason,
    };
    const validation = validateScheduleException(payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { doctorId: ignored, ...patch } = validation.value;
      await onSubmit(exception ? patch : { ...patch, doctorId: ignored });
    } catch (err) {
      if (err.details) setErrors(err.details);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      title={exception ? "Edit exception" : "Block a date or add extra hours"}
      description="Exceptions override the weekly schedule for a single date."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="exception-form" loading={busy}>
            {exception ? "Save changes" : "Save exception"}
          </Button>
        </>
      }
    >
      <form id="exception-form" onSubmit={submit} noValidate className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        {allowClinicWide && !exception && (
          <Select
            id="exception-scope"
            label="Applies to"
            value={values.scope}
            onChange={update("scope")}
            options={[
              { value: "doctor", label: "This doctor only" },
              { value: "clinic", label: "Whole clinic (all doctors)" },
            ]}
          />
        )}
        <Select id="exception-kind" label="Type" value={values.kind} onChange={update("kind")} options={KIND_OPTIONS} />
        <Input id="exception-date" label="Date" type="date" min={todayIso()} value={values.date} onChange={update("date")} error={errors.date} required />
        {withTimes && (
          <div className="grid grid-cols-2 gap-3">
            <Input id="exception-start" label="From" type="time" step="900" value={values.start} onChange={update("start")} error={errors.start} required />
            <Input id="exception-end" label="To" type="time" step="900" value={values.end} onChange={update("end")} error={errors.end} required />
          </div>
        )}
        <Input id="exception-reason" label="Reason" value={values.reason} onChange={update("reason")} error={errors.reason} maxLength={200} placeholder="e.g. Conference, holiday" optional />
      </form>
    </Modal>
  );
}
