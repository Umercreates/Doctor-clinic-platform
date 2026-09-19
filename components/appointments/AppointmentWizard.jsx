"use client";

import { useEffect, useRef } from "react";
import { ShieldCheck } from "lucide-react";
import { BookingProvider, useBooking } from "./BookingContext";
import { BOOKING_STEPS, STEP_INDEX } from "./steps";
import { canContinue } from "./bookingReducer";
import { StepIndicator } from "./StepIndicator";
import { StepNavigation } from "./StepNavigation";
import { DoctorSelector } from "./DoctorSelector";
import { ServiceSelector } from "./ServiceSelector";
import { DateSelector } from "./DateSelector";
import { TimeSlotSelector } from "./TimeSlotSelector";
import { PatientForm } from "./PatientForm";
import { AppointmentSummary } from "./AppointmentSummary";
import { BookingConfirmation } from "./BookingConfirmation";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { useHydrated } from "@/hooks/useHydrated";
import { api } from "@/lib/api";
import { validatePatientDetails } from "@/lib/validation/appointment";

const PATIENT_FORM_ID = "booking-patient-form";

/** Highest step index the patient may navigate to given current selections. */
function furthestReachableStep(state) {
  if (!state.doctorId) return STEP_INDEX.doctor;
  if (!state.serviceId) return STEP_INDEX.service;
  if (!state.date) return STEP_INDEX.date;
  if (!state.time) return STEP_INDEX.time;
  return STEP_INDEX.review;
}

function WizardBody({ rules, clinic }) {
  const { state, dispatch, doctors, availableServices, doctor, service } = useBooking();
  const hydrated = useHydrated();
  const topRef = useRef(null);
  const isFirstRender = useRef(true);

  const step = BOOKING_STEPS[state.stepIndex];
  const isConfirmation = step.id === "confirmation";

  // Bring the wizard header into view when the step changes (not on first paint).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state.stepIndex]);

  const goTo = (index) => dispatch({ type: "GO_TO", stepIndex: index });
  const next = () => dispatch({ type: "NEXT" });
  const back = () => dispatch({ type: "BACK" });

  const handlePatientSubmit = (event) => {
    event.preventDefault();
    const validation = validatePatientDetails(state.patient);
    if (!validation.valid) {
      dispatch({ type: "SET_ERRORS", errors: validation.errors });
      const first = Object.keys(validation.errors)[0];
      document.getElementById(`patient-${first}`)?.focus();
      return;
    }
    dispatch({ type: "SET_ERRORS", errors: {} });
    next();
  };

  const handleConfirm = async () => {
    dispatch({ type: "SUBMIT_START" });
    try {
      const response = await api.createAppointment({
        doctorId: state.doctorId,
        serviceId: state.serviceId,
        date: state.date,
        time: state.time,
        patient: state.patient,
      });
      dispatch({ type: "SUBMIT_SUCCESS", confirmation: response.data });
    } catch (error) {
      dispatch({
        type: "SUBMIT_FAILURE",
        code: error.code,
        error:
          error.status === 0 || error.status >= 500
            ? "Something went wrong. Please try again."
            : error.message || "We could not complete your booking. Please try again.",
        fieldErrors: error.details,
      });
    }
  };

  const renderStep = () => {
    switch (step.id) {
      case "doctor":
        return (
          <DoctorSelector
            doctors={doctors}
            selectedId={state.doctorId}
            onSelect={(selected) => dispatch({ type: "SET_DOCTOR", doctor: selected })}
          />
        );
      case "service":
        return (
          <ServiceSelector
            services={availableServices}
            selectedId={state.serviceId}
            doctorName={doctor?.name}
            onSelect={(serviceId) => dispatch({ type: "SET_SERVICE", serviceId })}
          />
        );
      case "date":
        // The calendar depends on the visitor's clock; render it client-side only.
        if (!hydrated) {
          return (
            <div className="mx-auto max-w-lg" aria-busy="true">
              <Skeleton className="h-6 w-40 mx-auto" />
              <Skeleton className="mt-6 h-72 w-full" />
            </div>
          );
        }
        return (
          <DateSelector
            doctor={doctor}
            service={service}
            rules={rules}
            value={state.date}
            onChange={(date) => dispatch({ type: "SET_DATE", date })}
          />
        );
      case "time":
        return (
          <TimeSlotSelector
            doctor={doctor}
            service={service}
            date={state.date}
            value={state.time}
            onChange={(time) => dispatch({ type: "SET_TIME", time })}
            onChangeDate={() => goTo(STEP_INDEX.date)}
            refreshKey={state.slotRefreshKey}
          />
        );
      case "details":
        return (
          <PatientForm
            formId={PATIENT_FORM_ID}
            values={state.patient}
            errors={state.errors}
            onChange={(field, value) => dispatch({ type: "SET_PATIENT_FIELD", field, value })}
            onJumpTo={goTo}
            onSubmit={handlePatientSubmit}
            doctor={doctor}
            service={service}
            date={state.date}
            time={state.time}
          />
        );
      case "review":
        return (
          <div className="space-y-5">
            <AppointmentSummary
              mode="review"
              doctor={doctor}
              service={service}
              date={state.date}
              time={state.time}
              patient={state.patient}
              onJumpTo={goTo}
            />
            <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" aria-hidden="true" />
              By confirming you agree to be contacted about this appointment. {clinic?.emergencyNotice}
            </p>
          </div>
        );
      case "confirmation":
        return <BookingConfirmation confirmation={state.confirmation} clinic={clinic} onBookAnother={() => dispatch({ type: "RESET" })} />;
      default:
        return null;
    }
  };

  const navigation = () => {
    if (isConfirmation) return null;
    if (step.id === "details") {
      return <StepNavigation onBack={back} nextType="submit" formId={PATIENT_FORM_ID} nextLabel="Review appointment" canGoNext />;
    }
    if (step.id === "review") {
      return (
        <StepNavigation
          onBack={back}
          onNext={handleConfirm}
          nextLabel="Confirm appointment"
          nextLoading={state.submission.status === "submitting"}
          hint="You will receive a reference number."
        />
      );
    }
    return <StepNavigation onBack={back} onNext={next} canGoBack={state.stepIndex > 0} canGoNext={canContinue(state)} />;
  };

  return (
    <div ref={topRef} className="scroll-mt-24">
      <StepIndicator currentIndex={state.stepIndex} completedIndex={furthestReachableStep(state)} onNavigate={goTo} />

      <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          <section
            key={step.id}
            aria-labelledby="booking-step-title"
            className="animate-slide-up rounded-3xl border border-slate-200 bg-white p-5 shadow-card sm:p-8"
          >
            {!isConfirmation && (
              <header className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                  Step {state.stepIndex + 1}
                </p>
                <h2 id="booking-step-title" className="mt-1.5 text-2xl font-bold text-slate-900 sm:text-3xl">
                  {step.title}
                </h2>
                {step.description && <p className="mt-2 text-sm text-slate-600 sm:text-base">{step.description}</p>}
              </header>
            )}

            {state.submission.status === "error" && state.submission.error && (
              <Alert tone={step.id === "time" ? "warning" : "error"} className="mb-6" title={step.id === "time" ? "This slot is no longer available" : "Booking not completed"}>
                {state.submission.error}
              </Alert>
            )}

            {renderStep()}
            {navigation()}
          </section>
        </div>

        {!isConfirmation && (
          <aside className="lg:col-span-4" aria-label="Appointment summary">
            <div className="lg:sticky lg:top-28">
              <AppointmentSummary doctor={doctor} service={service} date={state.date} time={state.time} mode="sidebar" />
              {clinic?.contact?.phone && (
                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                  Need help? Call <a href={clinic.contact.phoneHref} className="font-medium text-slate-700 underline-offset-2 hover:underline">{clinic.contact.phone}</a> during opening hours.
                </p>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

/**
 * Multi-step appointment booking wizard.
 * Receives the doctor/service catalogue from the server (later: the API) and
 * optional prefills from the URL (?doctor=slug&service=slug).
 */
export function AppointmentWizard({ doctors, services, initialDoctor, initialService, bookingRules, clinic }) {
  return (
    <BookingProvider doctors={doctors} services={services} initialDoctor={initialDoctor} initialService={initialService}>
      <WizardBody rules={bookingRules} clinic={clinic} />
    </BookingProvider>
  );
}
