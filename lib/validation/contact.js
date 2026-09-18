import { email, firstError, maxLength, minLength, normalizeString, phone, required } from "./common";

export const CONTACT_LIMITS = {
  nameMin: 2,
  nameMax: 100,
  subjectMax: 150,
  messageMin: 10,
  messageMax: 2000,
};

export const CONTACT_TOPICS = [
  { value: "general", label: "General question" },
  { value: "appointment", label: "Appointment enquiry" },
  { value: "results", label: "Question about a visit" },
  { value: "billing", label: "Billing or insurance" },
  { value: "feedback", label: "Feedback" },
];

export function validateContactMessage(input = {}) {
  const errors = {};

  const fullName = normalizeString(input.fullName);
  const nameError = firstError(
    required(fullName, "Full name"),
    minLength(fullName, CONTACT_LIMITS.nameMin, "Full name"),
    maxLength(fullName, CONTACT_LIMITS.nameMax, "Full name"),
  );
  if (nameError) errors.fullName = nameError;

  const emailError = email(input.email);
  if (emailError) errors.email = emailError;

  // Phone is optional on the contact form.
  const phoneValue = normalizeString(input.phone);
  if (phoneValue) {
    const phoneError = phone(phoneValue);
    if (phoneError) errors.phone = phoneError;
  }

  const topic = normalizeString(input.topic) || "general";
  if (!CONTACT_TOPICS.some((t) => t.value === topic)) errors.topic = "Please choose a topic.";

  const message = normalizeString(input.message);
  const messageError = firstError(
    required(message, "Message"),
    minLength(message, CONTACT_LIMITS.messageMin, "Message"),
    maxLength(message, CONTACT_LIMITS.messageMax, "Message"),
  );
  if (messageError) errors.message = messageError;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      fullName,
      email: normalizeString(input.email).toLowerCase(),
      phone: phoneValue,
      topic,
      message,
    },
  };
}
