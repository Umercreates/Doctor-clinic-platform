/**
 * Services offered (demo data).
 *
 * These are general, non-specialist service descriptions. They make no claims
 * about clinical outcomes or specialist qualifications and are flagged as demo
 * content. The shape mirrors the `services` and `doctor_services` tables in
 * `lib/database/schema.sql`. `icon` keys map to `components/ui/Icon.jsx`.
 */

export const services = [
  {
    id: "general-consultation",
    slug: "general-consultation",
    name: "General Consultation",
    icon: "stethoscope",
    durationMinutes: 30,
    shortDescription:
      "A thorough, unhurried visit for new concerns, ongoing symptoms, or questions about your health.",
    description: [
      "A general consultation is the right starting point for most health concerns. During the visit, your doctor will listen to your concerns, review your history, and discuss any next steps, which may include further assessment or a follow-up visit.",
      "You can book a general consultation with any doctor on our team. If you are unsure which service to choose, this is a good place to start.",
    ],
    highlights: [
      "Discuss new or ongoing symptoms",
      "Review medications and health history",
      "Receive clear guidance on next steps",
      "Referrals or follow-up arranged where appropriate",
    ],
    doctorIds: ["dr-williams", "dr-jones", "dr-jennifer"],
    isDemo: true,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "preventive-health-screening",
    slug: "preventive-health-screening",
    name: "Preventive Health Check-up",
    icon: "heart-pulse",
    durationMinutes: 45,
    shortDescription:
      "A structured review of your overall health to help identify risks early and keep you on track.",
    description: [
      "Preventive check-ups focus on staying well rather than treating a specific complaint. Your doctor will review your general health, lifestyle, and personal risk factors, and discuss any routine screening that may be appropriate for you.",
      "Preventive visits are an opportunity to ask questions and set realistic goals for the year ahead.",
    ],
    highlights: [
      "General health and lifestyle review",
      "Discussion of appropriate routine screening",
      "Personalized prevention plan",
      "Time for your questions",
    ],
    doctorIds: ["dr-williams", "dr-jennifer"],
    isDemo: true,
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "follow-up-care",
    slug: "follow-up-care",
    name: "Follow-up & Ongoing Care",
    icon: "clipboard-check",
    durationMinutes: 20,
    shortDescription:
      "Continuity visits to review progress, adjust care plans, and keep your care coordinated.",
    description: [
      "Follow-up visits are shorter appointments designed to review how a plan is working, discuss results, and make any adjustments. Seeing the same doctor over time helps keep your care consistent and coordinated.",
      "Book a follow-up when your doctor has asked to see you again or when you would like to review an existing plan.",
    ],
    highlights: [
      "Review results and progress",
      "Adjust an existing care plan",
      "Coordinate ongoing care",
      "Shorter, focused appointment",
    ],
    doctorIds: ["dr-williams", "dr-jones", "dr-jennifer"],
    isDemo: true,
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "minor-illness-injury",
    slug: "minor-illness-injury",
    name: "Minor Illness & Injury Care",
    icon: "bandage",
    durationMinutes: 30,
    shortDescription:
      "Same-week appointments for common, non-emergency illnesses and minor injuries.",
    description: [
      "For everyday, non-urgent problems such as colds, minor infections, sprains, or small cuts, our team can assess the issue and advise on care. If a concern needs more specialized attention, we will help arrange the appropriate next step.",
      "This service is not for emergencies. If you believe you are experiencing a medical emergency, call 911 or go to the nearest emergency room.",
    ],
    highlights: [
      "Assessment of common, non-urgent conditions",
      "Advice on self-care and recovery",
      "Guidance on when further care is needed",
      "Not for emergencies. Call 911 if urgent",
    ],
    doctorIds: ["dr-williams", "dr-jones"],
    isDemo: true,
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "wellness-lifestyle",
    slug: "wellness-lifestyle",
    name: "Wellness & Lifestyle Guidance",
    icon: "leaf",
    durationMinutes: 40,
    shortDescription:
      "Practical, personalized support for sleep, nutrition, activity, and everyday wellbeing.",
    description: [
      "Small, sustainable changes can have a meaningful impact on how you feel day to day. In a wellness visit, your doctor will explore the areas that matter most to you and help you build realistic routines around sleep, nutrition, movement, and stress.",
      "These visits are collaborative and paced around your goals.",
    ],
    highlights: [
      "Personalized wellbeing review",
      "Realistic, sustainable goal setting",
      "Guidance on sleep, nutrition and activity",
      "Optional follow-up check-ins",
    ],
    doctorIds: ["dr-williams", "dr-jennifer"],
    isDemo: true,
    sortOrder: 5,
    isActive: true,
  },
  {
    id: "virtual-consultation",
    slug: "virtual-consultation",
    name: "Virtual Consultation",
    icon: "video",
    durationMinutes: 20,
    shortDescription:
      "Secure video visits for follow-ups, questions, and concerns that do not require an in-person exam.",
    description: [
      "Virtual consultations offer a convenient way to speak with your doctor from home for follow-up discussions, questions about a care plan, or concerns that can be assessed without a physical examination.",
      "If your doctor determines that an in-person visit is needed, we will help you arrange one promptly.",
    ],
    highlights: [
      "Convenient video appointment",
      "Ideal for follow-ups and questions",
      "In-person visit arranged if needed",
      "Same attentive care, from home",
    ],
    doctorIds: ["dr-williams", "dr-jones", "dr-jennifer"],
    isDemo: true,
    sortOrder: 6,
    isActive: true,
  },
];
