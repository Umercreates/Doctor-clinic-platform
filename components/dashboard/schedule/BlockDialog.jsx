"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input, Select } from "@/components/ui/FormField";
import { validateScheduleBlock } from "@/lib/validation/availability";
import { WEEKDAY_LABELS } from "@/data/doctors";

const WEEKDAY_OPTIONS = [1, 2, 3, 4, 5, 6, 0].map((day) => ({ value: String(day), label: WEEKDAY_LABELS[day] }));

/**
 * Create or edit a weekly availability block { weekday, start, end }.
 */
export function BlockDialog({ open, onClose, onSubmit, doctorId, block = null }) {
  const [values, setValues] = useState({
    weekday: String(block?.weekday ?? 1),
    start: block?.start || "09:00",
    end: block?.end || "17:00",
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => {
    setValues((v) => ({ ...v, [field]: event.target.value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = { doctorId, weekday: Number(values.weekday), start: values.start, end: values.end };
    const validation = validateScheduleBlock(payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit(block ? { weekday: payload.weekday, start: payload.start, end: payload.end } : payload);
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
      title={block ? "Edit availability block" : "Add availability block"}
      description="Patients can book within these hours on the chosen weekday."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="block-form" loading={busy}>
            {block ? "Save changes" : "Add block"}
          </Button>
        </>
      }
    >
      <form id="block-form" onSubmit={submit} noValidate className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Select id="block-weekday" label="Weekday" value={values.weekday} onChange={update("weekday")} options={WEEKDAY_OPTIONS} error={errors.weekday} required />
        <div className="grid grid-cols-2 gap-3">
          <Input id="block-start" label="Start" type="time" step="900" value={values.start} onChange={update("start")} error={errors.start} required />
          <Input id="block-end" label="End" type="time" step="900" value={values.end} onChange={update("end")} error={errors.end} required />
        </div>
      </form>
    </Modal>
  );
}
