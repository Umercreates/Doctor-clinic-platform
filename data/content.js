/**
 * Default website content blocks.
 *
 * Each key maps to a `content_blocks` row (JSONB) that the admin can edit in
 * /dashboard/content. When a row is missing, the default here is used, so the
 * public site always renders. Copy that refers to unverified facts stays
 * neutral and is labelled demo where shown.
 */

export const contentBlockDefaults = {
  "home.hero": {
    badge: "Accepting new patients",
    headlineLine1: "Thoughtful care,",
    headlineLine2: "built around you.",
    description:
      "{clinic} is a modern medical practice in {city}, led by {leadDoctor}. Unhurried appointments, clear communication, and care plans built around your life.",
    primaryCta: "Book Appointment",
    secondaryCta: "Contact the clinic",
    highlights: ["Online booking in minutes", "Same-week appointments", "Patient-centered care"],
    chipTitle: "Book online",
    chipSubtitle: "Choose your doctor & time",
  },
  "home.introduction": {
    eyebrow: "About the practice",
    title: "Welcome to {clinic}, a calmer way to see your doctor",
    description:
      "{clinic} is a private medical practice in {city}, {state}. Every appointment is designed to feel unhurried and personal, from the first conversation to the follow-up.",
    pillars: [
      { title: "Led by {leadDoctor}", description: "A practice built on attentive, personal care and continuity with the same doctor over time." },
      { title: "Patient-focused approach", description: "We listen first, explain clearly, and plan your care together around your goals." },
      { title: "Clear next steps", description: "You leave every visit knowing what happens next and how to reach us." },
    ],
    ctaLabel: "More about the practice",
  },
  "home.cta": {
    eyebrow: "Ready when you are",
    title: "Book your appointment today",
    description: "Choose a doctor, pick a time that suits you, and we will take care of the rest. Same-week availability for most visits.",
    primaryCta: "Book Appointment",
  },
  "about.intro": {
    eyebrow: "About",
    title: "A medical practice built around the patient",
    description:
      "{clinic} was founded on a simple belief: the best care starts with listening. We are a private practice in {city}, {state}, led by {leadDoctor}.",
    sectionEyebrow: "The practice",
    sectionTitle: "Unhurried appointments, clear answers, and a team that knows you",
    sectionDescription:
      "Every part of {clinic} is designed to make seeing a doctor calmer and simpler: online booking, a comfortable clinic environment, and appointments that leave time for your questions.",
  },
  "about.mission": {
    mission:
      "To provide thoughtful, accessible medical care that treats every patient as a whole person, with clear communication, genuine attention, and respect for your time.",
    vision: "A practice where every patient in {city} feels known, heard, and confident in their care.",
  },
  "about.values": {
    eyebrow: "Values",
    title: "What guides every visit",
    description: "Four principles shape how we work with patients and with each other.",
    items: [
      { icon: "heart", title: "Compassion", description: "We treat every patient with kindness, dignity, and respect." },
      { icon: "shield-check", title: "Integrity", description: "Honest guidance and transparent communication at every step." },
      { icon: "eye", title: "Attentiveness", description: "Careful, unhurried attention to the details that matter to you." },
      { icon: "users", title: "Partnership", description: "Your health is a shared journey. We make decisions together." },
    ],
  },
  "about.approach": {
    eyebrow: "Patient care approach",
    title: "How we work with you",
    description: "A consistent approach to every appointment, from the first hello to the follow-up.",
    steps: [
      { title: "We listen first", description: "Your visit begins with your story. We take the time to understand your concerns before recommending anything." },
      { title: "We explain clearly", description: "You will always understand what we recommend and why, in plain language, without jargon." },
      { title: "We plan together", description: "Care plans are built around your goals, preferences, and daily life, and adjusted as your needs change." },
      { title: "We follow through", description: "Clear next steps and timely follow-up so nothing falls through the cracks between visits." },
    ],
  },
  "home.why": {
    eyebrow: "Why our practice",
    title: "Care that respects your time, your questions, and your story",
    description: "We built the practice around the things patients tell us matter most.",
    items: [
      { icon: "heart-handshake", title: "Patient-centered experience", description: "Every visit starts with listening. We take time to understand your concerns and involve you in decisions about your care." },
      { icon: "calendar-check", title: "Convenient appointments", description: "Book online in minutes, choose the doctor you prefer, and pick a time that fits your schedule." },
      { icon: "building", title: "Modern care environment", description: "A calm, clean, and comfortable clinic designed to make each visit as stress-free as possible." },
      { icon: "message-circle", title: "Clear communication", description: "Plain-language explanations, clear next steps, and prompt follow-up so you always know what to expect." },
      { icon: "user-check", title: "Personalized attention", description: "Care plans that reflect your goals, history, and lifestyle, never a one-size-fits-all approach." },
      { icon: "shield-check", title: "Continuity of care", description: "See the same team over time so your care stays coordinated and your story never has to be repeated." },
    ],
  },
  "footer": {
    description:
      "{clinic} is a modern medical practice in {city}, {state}, led by {leadDoctor}. We provide attentive, patient-centered care in a calm and welcoming environment.",
  },
};

/** Sections shown in /dashboard/content, with the editable fields per block. */
export const contentSections = [
  {
    id: "homepage",
    label: "Homepage",
    blocks: [
      {
        key: "home.hero",
        label: "Hero",
        fields: [
          { name: "badge", label: "Badge text", type: "text", max: 60 },
          { name: "headlineLine1", label: "Headline (line 1)", type: "text", max: 60 },
          { name: "headlineLine2", label: "Headline (line 2, highlighted)", type: "text", max: 60 },
          { name: "description", label: "Description", type: "textarea", max: 400 },
          { name: "primaryCta", label: "Primary button", type: "text", max: 40 },
          { name: "secondaryCta", label: "Secondary button", type: "text", max: 40 },
          { name: "highlights", label: "Highlights (one per line, max 3)", type: "lines", max: 3, itemMax: 60 },
          { name: "chipTitle", label: "Floating card title", type: "text", max: 40 },
          { name: "chipSubtitle", label: "Floating card subtitle", type: "text", max: 60 },
        ],
      },
      {
        key: "home.introduction",
        label: "Practice introduction",
        fields: [
          { name: "eyebrow", label: "Eyebrow", type: "text", max: 40 },
          { name: "title", label: "Title", type: "text", max: 120 },
          { name: "description", label: "Description", type: "textarea", max: 500 },
          { name: "pillars", label: "Pillars (exactly 3)", type: "items", count: 3, fields: ["title", "description"] },
          { name: "ctaLabel", label: "Button label", type: "text", max: 40 },
        ],
      },
      {
        key: "home.why",
        label: "Why our practice",
        fields: [
          { name: "eyebrow", label: "Eyebrow", type: "text", max: 40 },
          { name: "title", label: "Title", type: "text", max: 120 },
          { name: "description", label: "Description", type: "textarea", max: 300 },
          { name: "items", label: "Reasons (exactly 6)", type: "items", count: 6, fields: ["title", "description"] },
        ],
      },
      {
        key: "home.cta",
        label: "Final call to action",
        fields: [
          { name: "eyebrow", label: "Eyebrow", type: "text", max: 40 },
          { name: "title", label: "Title", type: "text", max: 120 },
          { name: "description", label: "Description", type: "textarea", max: 300 },
          { name: "primaryCta", label: "Button label", type: "text", max: 40 },
        ],
      },
    ],
  },
  {
    id: "about",
    label: "About page",
    blocks: [
      {
        key: "about.intro",
        label: "Introduction",
        fields: [
          { name: "eyebrow", label: "Eyebrow", type: "text", max: 40 },
          { name: "title", label: "Page title", type: "text", max: 120 },
          { name: "description", label: "Page description", type: "textarea", max: 400 },
          { name: "sectionEyebrow", label: "Section eyebrow", type: "text", max: 40 },
          { name: "sectionTitle", label: "Section title", type: "text", max: 140 },
          { name: "sectionDescription", label: "Section description", type: "textarea", max: 500 },
        ],
      },
      {
        key: "about.mission",
        label: "Mission & vision",
        fields: [
          { name: "mission", label: "Mission", type: "textarea", max: 400 },
          { name: "vision", label: "Vision", type: "textarea", max: 300 },
        ],
      },
      {
        key: "about.values",
        label: "Values",
        fields: [
          { name: "eyebrow", label: "Eyebrow", type: "text", max: 40 },
          { name: "title", label: "Title", type: "text", max: 120 },
          { name: "description", label: "Description", type: "textarea", max: 300 },
          { name: "items", label: "Values (exactly 4)", type: "items", count: 4, fields: ["title", "description"] },
        ],
      },
      {
        key: "about.approach",
        label: "Patient care approach",
        fields: [
          { name: "eyebrow", label: "Eyebrow", type: "text", max: 40 },
          { name: "title", label: "Title", type: "text", max: 120 },
          { name: "description", label: "Description", type: "textarea", max: 300 },
          { name: "steps", label: "Steps (exactly 4)", type: "items", count: 4, fields: ["title", "description"] },
        ],
      },
    ],
  },
  {
    id: "footer",
    label: "Footer",
    blocks: [
      {
        key: "footer",
        label: "Footer",
        fields: [{ name: "description", label: "Footer description", type: "textarea", max: 400 }],
      },
    ],
  },
];

/**
 * Replace {clinic}, {city}, {state}, {leadDoctor} tokens so editors can write
 * copy that stays correct when the clinic profile changes.
 */
export function fillTokens(value, tokens) {
  if (typeof value === "string") {
    return value.replace(/\{(clinic|city|state|leadDoctor)\}/g, (_, key) => tokens[key] ?? "");
  }
  if (Array.isArray(value)) return value.map((v) => fillTokens(v, tokens));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fillTokens(v, tokens)]));
  }
  return value;
}
