/**
 * Frequently asked questions (demo data).
 * Mirrors the `faqs` table in `lib/database/schema.sql`.
 * `featured` items are shown in the homepage preview.
 */

export const faqCategories = [
  { id: "appointments", label: "Appointments" },
  { id: "visits", label: "Your visit" },
  { id: "clinic", label: "The clinic" },
];

export const faqs = [
  {
    id: "how-to-book",
    category: "appointments",
    question: "How do I book an appointment?",
    answer:
      "You can book online in a few minutes. Choose a doctor, select the type of visit, pick an available date and time, and enter your details. You will receive a confirmation reference once your request is submitted. You can also call the clinic during opening hours to book by phone.",
    featured: true,
    sortOrder: 1,
  },
  {
    id: "choose-doctor",
    category: "appointments",
    question: "Can I choose which doctor I see?",
    answer:
      "Yes. When booking online you can select any doctor on our team. Each doctor profile lists their areas of care and typical availability to help you decide.",
    featured: true,
    sortOrder: 2,
  },
  {
    id: "reschedule",
    category: "appointments",
    question: "Can I reschedule or cancel my appointment?",
    answer:
      "Of course. Please contact the clinic as early as possible if you need to change or cancel a visit so we can offer the time to another patient. We kindly ask for at least 24 hours notice where possible.",
    featured: true,
    sortOrder: 3,
  },
  {
    id: "what-to-bring",
    category: "visits",
    question: "What should I bring to my appointment?",
    answer:
      "Please bring a photo ID, your insurance details if applicable, a list of any medications you currently take, and any relevant medical records or recent test results. Arriving a few minutes early helps us start your visit on time.",
    featured: true,
    sortOrder: 4,
  },
  {
    id: "after-booking",
    category: "appointments",
    question: "What happens after I book?",
    answer:
      "You will receive a confirmation reference for your request. Our team reviews new requests during opening hours and will contact you if anything needs to be adjusted. If you have not heard from us and have questions, please get in touch.",
    featured: true,
    sortOrder: 5,
  },
  {
    id: "contact",
    category: "clinic",
    question: "How can I contact the clinic?",
    answer:
      "You can reach us by phone during opening hours, by email, or through the contact form on this website. For medical emergencies, always call 911.",
    featured: true,
    sortOrder: 6,
  },
  {
    id: "new-patients",
    category: "clinic",
    question: "Are you accepting new patients?",
    answer:
      "Yes, our doctors are currently welcoming new patients. Simply book a general consultation online or contact the clinic and we will help you get started.",
    featured: false,
    sortOrder: 7,
  },
  {
    id: "virtual",
    category: "visits",
    question: "Do you offer virtual appointments?",
    answer:
      "Yes. Virtual consultations are available for follow-ups, questions about a care plan, and concerns that do not require a physical examination. If an in-person visit is needed, we will help arrange one.",
    featured: false,
    sortOrder: 8,
  },
  {
    id: "first-visit",
    category: "visits",
    question: "What can I expect at my first visit?",
    answer:
      "Your first visit typically includes a conversation about your health history, current concerns, and goals. Your doctor will explain any recommended next steps in plain language and make sure your questions are answered.",
    featured: false,
    sortOrder: 9,
  },
  {
    id: "running-late",
    category: "visits",
    question: "What if I am running late?",
    answer:
      "Please call the clinic to let us know. We will do our best to accommodate you, although in some cases we may need to reschedule your visit to make sure every patient receives the time they need.",
    featured: false,
    sortOrder: 10,
  },
  {
    id: "parking",
    category: "clinic",
    question: "Is parking available?",
    answer:
      "Parking and public transport details for the clinic will be listed here. Demo content: replace with verified information about parking and access.",
    featured: false,
    sortOrder: 11,
  },
];
