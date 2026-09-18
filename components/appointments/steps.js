/** Ordered booking steps. `confirmation` is terminal and not shown in the indicator count. */
export const BOOKING_STEPS = [
  { id: "doctor", label: "Doctor", title: "Choose a doctor", description: "Select who you would like to see." },
  { id: "service", label: "Service", title: "Choose a service", description: "Pick the type of visit you need." },
  { id: "date", label: "Date", title: "Choose a date", description: "Days the doctor is available are highlighted." },
  { id: "time", label: "Time", title: "Choose a time", description: "Select an open time slot." },
  { id: "details", label: "Details", title: "Your information", description: "Tell us who the appointment is for." },
  { id: "review", label: "Review", title: "Review your appointment", description: "Check everything before you confirm." },
  { id: "confirmation", label: "Confirmed", title: "Appointment requested", description: "" },
];

export const STEP_INDEX = Object.fromEntries(BOOKING_STEPS.map((step, index) => [step.id, index]));
export const VISIBLE_STEPS = BOOKING_STEPS.filter((s) => s.id !== "confirmation");
