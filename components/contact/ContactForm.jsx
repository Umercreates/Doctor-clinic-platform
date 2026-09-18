"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Input, Select, Textarea } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { api } from "@/lib/api";
import { CONTACT_LIMITS, CONTACT_TOPICS, validateContactMessage } from "@/lib/validation/contact";
import { clinic } from "@/data/clinic";

const initialValues = { fullName: "", email: "", phone: "", topic: "general", message: "" };

export function ContactForm() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [result, setResult] = useState(null);
  const [serverError, setServerError] = useState("");

  const update = (field) => (event) => {
    const value = event.target.value;
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateContactMessage(values);
    if (!validation.valid) {
      setErrors(validation.errors);
      const firstField = Object.keys(validation.errors)[0];
      document.getElementById(`contact-${firstField}`)?.focus();
      return;
    }

    setStatus("submitting");
    setServerError("");
    try {
      const response = await api.sendContactMessage(validation.value);
      setResult(response.data);
      setStatus("success");
    } catch (error) {
      if (error.details) setErrors(error.details);
      setServerError(error.message || "We could not send your message. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center animate-fade-in" role="status">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-emerald-600 shadow-soft">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </span>
        <h3 className="mt-5 text-xl font-semibold text-slate-900">Thank you, your message has been received</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          We aim to reply within one business day during opening hours. Your reference is{" "}
          <span className="font-semibold text-slate-900">{result?.reference}</span>.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Demo environment: messages are not yet delivered to the clinic inbox.
        </p>
        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => {
            setValues(initialValues);
            setResult(null);
            setStatus("idle");
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-describedby="contact-form-note">
      {status === "error" && serverError && (
        <Alert tone="error" title="Message not sent">
          {serverError}
        </Alert>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          id="contact-fullName"
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="Jane Doe"
          value={values.fullName}
          onChange={update("fullName")}
          error={errors.fullName}
          maxLength={CONTACT_LIMITS.nameMax}
          required
        />
        <Input
          id="contact-email"
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={update("email")}
          error={errors.email}
          required
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          id="contact-phone"
          label="Phone number"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="(213) 555-0100"
          value={values.phone}
          onChange={update("phone")}
          error={errors.phone}
          optional
        />
        <Select
          id="contact-topic"
          label="Topic"
          name="topic"
          value={values.topic}
          onChange={update("topic")}
          error={errors.topic}
          options={CONTACT_TOPICS}
        />
      </div>

      <Textarea
        id="contact-message"
        label="Message"
        name="message"
        rows={5}
        placeholder="How can we help?"
        value={values.message}
        onChange={update("message")}
        error={errors.message}
        hint={`${values.message.length}/${CONTACT_LIMITS.messageMax} characters. Please do not include sensitive medical details.`}
        maxLength={CONTACT_LIMITS.messageMax}
        required
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p id="contact-form-note" className="text-xs leading-relaxed text-slate-500">
          For emergencies call 911. For urgent matters, please phone {clinic.contact.phone}.
        </p>
        <Button type="submit" size="lg" leftIcon={Send} loading={status === "submitting"} className="sm:min-w-[11rem]">
          {status === "submitting" ? "Sending" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
