import { STEP_INDEX } from "./steps";

export const emptyPatient = { fullName: "", email: "", phone: "", notes: "" };

export const initialBookingState = {
  stepIndex: 0,
  doctorId: null,
  serviceId: null,
  date: null,
  time: null,
  patient: { ...emptyPatient },
  errors: {},
  submission: { status: "idle", error: null },
  confirmation: null,
};

/**
 * Build the initial state from URL prefill (doctor / service slugs).
 * Starts the wizard at the first step that still needs input.
 */
export function createInitialState({ doctorId = null, serviceId = null, doctors = [], services = [] } = {}) {
  const doctor = doctors.find((d) => d.id === doctorId || d.slug === doctorId) || null;
  const service = services.find((s) => s.id === serviceId || s.slug === serviceId) || null;
  const serviceAllowed = doctor && service ? doctor.serviceIds.includes(service.id) : Boolean(service);

  let stepIndex = STEP_INDEX.doctor;
  if (doctor && service && serviceAllowed) stepIndex = STEP_INDEX.date;
  else if (doctor) stepIndex = STEP_INDEX.service;

  return {
    ...initialBookingState,
    stepIndex,
    doctorId: doctor ? doctor.id : null,
    serviceId: service && serviceAllowed ? service.id : null,
  };
}

export function bookingReducer(state, action) {
  switch (action.type) {
    case "SET_DOCTOR": {
      const { doctor } = action;
      const keepService = state.serviceId && doctor.serviceIds.includes(state.serviceId);
      return {
        ...state,
        doctorId: doctor.id,
        serviceId: keepService ? state.serviceId : null,
        date: null,
        time: null,
      };
    }
    case "SET_SERVICE":
      return { ...state, serviceId: action.serviceId, time: null };
    case "SET_DATE":
      return { ...state, date: action.date, time: null };
    case "SET_TIME":
      return { ...state, time: action.time };
    case "SET_PATIENT_FIELD":
      return {
        ...state,
        patient: { ...state.patient, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: undefined },
      };
    case "SET_ERRORS":
      return { ...state, errors: action.errors || {} };
    case "NEXT":
      return { ...state, stepIndex: Math.min(state.stepIndex + 1, STEP_INDEX.confirmation) };
    case "BACK":
      return { ...state, stepIndex: Math.max(state.stepIndex - 1, 0), submission: { status: "idle", error: null } };
    case "GO_TO":
      return { ...state, stepIndex: action.stepIndex, submission: { status: "idle", error: null } };
    case "SUBMIT_START":
      return { ...state, submission: { status: "submitting", error: null } };
    case "SUBMIT_SUCCESS":
      return {
        ...state,
        submission: { status: "success", error: null },
        confirmation: action.confirmation,
        stepIndex: STEP_INDEX.confirmation,
      };
    case "SUBMIT_FAILURE":
      return {
        ...state,
        submission: { status: "error", error: action.error },
        errors: action.fieldErrors ? { ...state.errors, ...action.fieldErrors } : state.errors,
        // A time conflict sends the patient back to the time step.
        stepIndex: action.fieldErrors?.time ? STEP_INDEX.time : state.stepIndex,
        time: action.fieldErrors?.time ? null : state.time,
      };
    case "RESET":
      return { ...initialBookingState, patient: { ...emptyPatient } };
    default:
      return state;
  }
}

/** Whether the current step has everything it needs to continue. */
export function canContinue(state) {
  switch (state.stepIndex) {
    case STEP_INDEX.doctor:
      return Boolean(state.doctorId);
    case STEP_INDEX.service:
      return Boolean(state.serviceId);
    case STEP_INDEX.date:
      return Boolean(state.date);
    case STEP_INDEX.time:
      return Boolean(state.time);
    default:
      return true;
  }
}
