/**
 * Clinic profile & site-wide information.
 *
 * Everything marked `isDemo: true` is placeholder content that must be
 * replaced with verified clinic details before launch. These values are the
 * fallback for the `website_settings` table: rows saved from /dashboard/settings
 * are merged over them (see server/repositories/pg/clinicRepository.js).
 */

export const DEMO_NOTICE = "Demo content — replace with verified information.";
export const DEMO_CLINIC_NOTICE = "Demo clinic information — replace with verified information.";

export const clinic = {
  name: "Doctor",
  shortName: "Doctor",
  /** Descriptor shown next to the name in the logo lockup and in metadata. */
  descriptor: "Medical Practice",
  tagline: "Thoughtful care, built around you.",
  description:
    "Doctor is a modern medical practice in Los Angeles, California, led by Dr. Williams. We provide attentive, patient-centered care in a calm and welcoming environment.",
  city: "Los Angeles",
  state: "CA",
  stateFull: "California",
  country: "USA",
  region: "Greater Los Angeles",
  // Verified facts provided by the practice.
  leadDoctorId: "dr-williams",

  address: {
    isDemo: true,
    line1: "1234 Wilshire Blvd",
    line2: "Suite 500",
    city: "Los Angeles",
    state: "CA",
    postalCode: "90017",
    country: "USA",
    mapQuery: "Los Angeles, CA",
  },

  contact: {
    isDemo: true,
    phone: "(213) 555-0142",
    phoneHref: "tel:+12135550142",
    email: "care@doctor-clinic-demo.com",
    fax: "(213) 555-0143",
  },

  /**
   * Opening hours. `day` follows JS Date.getDay() (0 = Sunday).
   * Times are 24h "HH:MM" strings in the clinic's local time zone.
   */
  hours: {
    isDemo: true,
    timeZone: "America/Los_Angeles",
    schedule: [
      { day: 1, label: "Monday", open: "08:00", close: "18:00" },
      { day: 2, label: "Tuesday", open: "08:00", close: "18:00" },
      { day: 3, label: "Wednesday", open: "08:00", close: "18:00" },
      { day: 4, label: "Thursday", open: "08:00", close: "18:00" },
      { day: 5, label: "Friday", open: "08:00", close: "17:00" },
      { day: 6, label: "Saturday", open: "09:00", close: "13:00" },
      { day: 0, label: "Sunday", open: null, close: null },
    ],
  },

  social: {
    isDemo: true,
    links: [
      { id: "facebook", label: "Facebook", href: "#" },
      { id: "instagram", label: "Instagram", href: "#" },
      { id: "linkedin", label: "LinkedIn", href: "#" },
    ],
  },

  emergencyNotice:
    "If you are experiencing a medical emergency, call 911 or go to your nearest emergency room immediately. This website and its booking tools are not for urgent or emergency care.",

  medicalDisclaimer:
    "The information on this website is provided for general informational purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional about your individual circumstances.",
};

/** Patient-focused reasons to choose the practice (no clinical claims). */
export const whyChooseUs = [
  {
    id: "patient-centered",
    icon: "heart-handshake",
    title: "Patient-centered experience",
    description:
      "Every visit starts with listening. We take time to understand your concerns and involve you in decisions about your care.",
  },
  {
    id: "convenient",
    icon: "calendar-check",
    title: "Convenient appointments",
    description:
      "Book online in minutes, choose the doctor you prefer, and pick a time that fits your schedule.",
  },
  {
    id: "modern",
    icon: "building",
    title: "Modern care environment",
    description:
      "A calm, clean, and comfortable clinic designed to make each visit as stress-free as possible.",
  },
  {
    id: "communication",
    icon: "message-circle",
    title: "Clear communication",
    description:
      "Plain-language explanations, clear next steps, and prompt follow-up so you always know what to expect.",
  },
  {
    id: "personal",
    icon: "user-check",
    title: "Personalized attention",
    description:
      "Care plans that reflect your goals, history, and lifestyle, never a one-size-fits-all approach.",
  },
  {
    id: "continuity",
    icon: "shield-check",
    title: "Continuity of care",
    description:
      "See the same team over time so your care stays coordinated and your story never has to be repeated.",
  },
];

/** The steps a patient goes through in the online booking flow. */
export const appointmentProcess = [
  {
    step: "01",
    title: "Choose a doctor",
    description: "Select the doctor you would like to see from our team.",
  },
  {
    step: "02",
    title: "Choose a service",
    description: "Pick the type of visit that best matches your needs.",
  },
  {
    step: "03",
    title: "Select a date",
    description: "Browse the calendar and choose a day the doctor is available.",
  },
  {
    step: "04",
    title: "Select a time",
    description: "Pick an open time slot that fits your schedule.",
  },
  {
    step: "05",
    title: "Enter your details",
    description: "Tell us who you are and anything we should know before your visit.",
  },
  {
    step: "06",
    title: "Confirm",
    description: "Review your request and receive a confirmation reference.",
  },
];

/** Values displayed on the About page. */
export const practiceValues = [
  {
    id: "compassion",
    icon: "heart",
    title: "Compassion",
    description: "We treat every patient with kindness, dignity, and respect.",
  },
  {
    id: "integrity",
    icon: "shield-check",
    title: "Integrity",
    description: "Honest guidance and transparent communication at every step.",
  },
  {
    id: "attentiveness",
    icon: "eye",
    title: "Attentiveness",
    description: "Careful, unhurried attention to the details that matter to you.",
  },
  {
    id: "partnership",
    icon: "users",
    title: "Partnership",
    description: "Your health is a shared journey. We make decisions together.",
  },
];

export const mission =
  "To provide thoughtful, accessible medical care that treats every patient as a whole person, with clear communication, genuine attention, and respect for your time.";

export const vision =
  "A practice where every patient in Los Angeles feels known, heard, and confident in their care.";

/** Patient-care approach shown on the About page. */
export const careApproach = [
  {
    id: "listen",
    title: "We listen first",
    description:
      "Your visit begins with your story. We take the time to understand your concerns before recommending anything.",
  },
  {
    id: "explain",
    title: "We explain clearly",
    description:
      "You will always understand what we recommend and why, in plain language, without jargon.",
  },
  {
    id: "plan",
    title: "We plan together",
    description:
      "Care plans are built around your goals, preferences, and daily life, and adjusted as your needs change.",
  },
  {
    id: "follow-up",
    title: "We follow through",
    description:
      "Clear next steps and timely follow-up so nothing falls through the cracks between visits.",
  },
];
