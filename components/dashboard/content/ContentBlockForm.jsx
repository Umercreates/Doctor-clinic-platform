"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Textarea } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { validateContentBlock } from "@/lib/validation/content";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/dates";

/** Convert a stored block value into editable form state (arrays become text). */
function toFormState(fields, value) {
  const state = {};
  for (const field of fields) {
    const raw = value?.[field.name];
    if (field.type === "lines") state[field.name] = Array.isArray(raw) ? raw.join("\n") : "";
    else if (field.type === "items") state[field.name] = Array.isArray(raw) ? raw.map((item) => ({ ...item })) : [];
    else state[field.name] = raw ?? "";
  }
  return state;
}

/** Convert form state back into the API payload. */
function toPayload(fields, state) {
  const payload = {};
  for (const field of fields) {
    const raw = state[field.name];
    if (field.type === "lines") payload[field.name] = String(raw || "").split("\n");
    else payload[field.name] = raw;
  }
  return payload;
}

/**
 * Editor for one `content_blocks` row. Fields are declared in data/content.js
 * so the form, the validator and the public page always agree.
 */
export function ContentBlockForm({ block }) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState(() => toFormState(block.fields, block.value));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [dirty, setDirty] = useState(false);

  const setField = (name, next) => {
    setValues((v) => ({ ...v, [name]: next }));
    setErrors((e) => ({ ...e, [name]: undefined }));
    setDirty(true);
  };

  const setItem = (name, index, sub, next) => {
    setValues((v) => {
      const items = [...(v[name] || [])];
      items[index] = { ...items[index], [sub]: next };
      return { ...v, [name]: items };
    });
    setErrors((e) => ({ ...e, [name]: undefined }));
    setDirty(true);
  };

  const save = async (event) => {
    event.preventDefault();
    const payload = toPayload(block.fields, values);
    const validation = validateContentBlock(block.key, payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      setError("Please correct the highlighted fields.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.updateContentBlock(block.key, validation.value);
      toast.success(`${block.label} saved. The public site has been updated.`);
      setDirty(false);
      router.refresh();
    } catch (err) {
      if (err.details) setErrors(err.details);
      setError(err.message || "Could not save this section.");
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      const response = await api.resetContentBlock(block.key);
      setValues(toFormState(block.fields, response.data.value));
      setErrors({});
      setDirty(false);
      setConfirmReset(false);
      toast.success(`${block.label} restored to the default text.`);
      router.refresh();
    } catch (err) {
      setError(err.message || "Could not restore the default text.");
    } finally {
      setBusy(false);
    }
  };

  const formId = `content-${block.key.replace(/\W+/g, "-")}`;

  return (
    <form id={formId} onSubmit={save} noValidate className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{block.label}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {block.isCustomized && block.updatedAt ? `Last saved ${formatDateTime(block.updatedAt)}` : "Using the default text"}
            {" · "}
            <span className="font-mono">{block.key}</span>
          </p>
        </div>
        <Badge variant={block.isCustomized ? "brand" : "neutral"}>{block.isCustomized ? "Customized" : "Default"}</Badge>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        You can write <span className="font-mono">{"{clinic}"}</span>, <span className="font-mono">{"{city}"}</span>,{" "}
        <span className="font-mono">{"{state}"}</span> and <span className="font-mono">{"{leadDoctor}"}</span>; they are replaced with the
        current clinic profile on the website.
      </p>

      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {block.fields.map((field) => {
          const id = `${formId}-${field.name}`;
          if (field.type === "text") {
            return (
              <Input
                key={field.name}
                id={id}
                label={field.label}
                value={values[field.name]}
                maxLength={field.max}
                onChange={(e) => setField(field.name, e.target.value)}
                error={errors[field.name]}
                hint={`${String(values[field.name] || "").length}/${field.max}`}
                required
              />
            );
          }
          if (field.type === "textarea") {
            return (
              <Textarea
                key={field.name}
                id={id}
                label={field.label}
                rows={3}
                className="md:col-span-2"
                value={values[field.name]}
                maxLength={field.max}
                onChange={(e) => setField(field.name, e.target.value)}
                error={errors[field.name]}
                hint={`${String(values[field.name] || "").length}/${field.max}`}
                required
              />
            );
          }
          if (field.type === "lines") {
            return (
              <Textarea
                key={field.name}
                id={id}
                label={field.label}
                rows={3}
                className="md:col-span-2"
                value={values[field.name]}
                onChange={(e) => setField(field.name, e.target.value)}
                error={errors[field.name]}
                hint={`One entry per line, up to ${field.max}.`}
                required
              />
            );
          }
          if (field.type === "items") {
            const items = values[field.name] || [];
            return (
              <fieldset key={field.name} className="md:col-span-2">
                <legend className="text-sm font-medium text-slate-800">{field.label}</legend>
                {errors[field.name] && (
                  <p className="mt-1 text-xs font-medium text-rose-600" role="alert">
                    {errors[field.name]}
                  </p>
                )}
                <ol className="mt-3 grid gap-3 lg:grid-cols-2">
                  {items.map((item, index) => (
                    <li key={index} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Entry {index + 1}</p>
                      <div className="mt-3 space-y-3">
                        {field.fields.map((sub) =>
                          sub === "description" ? (
                            <Textarea
                              key={sub}
                              id={`${id}-${index}-${sub}`}
                              label="Description"
                              rows={2}
                              value={item[sub] || ""}
                              maxLength={400}
                              onChange={(e) => setItem(field.name, index, sub, e.target.value)}
                              required
                            />
                          ) : (
                            <Input
                              key={sub}
                              id={`${id}-${index}-${sub}`}
                              label={sub[0].toUpperCase() + sub.slice(1)}
                              value={item[sub] || ""}
                              maxLength={120}
                              onChange={(e) => setItem(field.name, index, sub, e.target.value)}
                              required
                            />
                          ),
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </fieldset>
            );
          }
          return null;
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <Button type="button" variant="ghost" size="sm" leftIcon={RotateCcw} onClick={() => setConfirmReset(true)} disabled={busy || !block.isCustomized}>
          Restore default
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setValues(toFormState(block.fields, block.value));
              setErrors({});
              setError("");
              setDirty(false);
            }}
            disabled={busy || !dirty}
          >
            Discard changes
          </Button>
          <Button type="submit" size="sm" leftIcon={Save} loading={busy}>
            Save section
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={reset}
        busy={busy}
        title={`Restore "${block.label}" to the default text?`}
        description="Your customized text for this section will be removed and the bundled default will show on the website."
        confirmLabel="Restore default"
        cancelLabel="Keep my text"
      />
    </form>
  );
}
