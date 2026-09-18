/**
 * Doctor directory (demo data).
 *
 * Verified information provided by the practice:
 *   - Dr. Williams: primary doctor, Los Angeles, California, USA. Profession: Doctor
 *   - Dr. Jones and Dr. Jennifer: names and photos only
 *
 * Any bio, focus area, or schedule below is placeholder content and is flagged
 * with `isDemo`. Nothing here should be read as a credential, license, degree,
 * or board certification. The shape mirrors the `doctors`, `doctor_care_areas`
 * and `doctor_schedules` tables in `lib/database/schema.sql`.
 */

/**
 * Weekly working schedule used by the booking calendar.
 * `day` follows JS Date.getDay() (0 = Sunday). Times are 24h "HH:MM".
 */
const standardWeek = [
  { day: 1, blocks: [{ start: "09:00", end: "12:30" }, { start: "13:30", end: "17:00" }] },
  { day: 2, blocks: [{ start: "09:00", end: "12:30" }, { start: "13:30", end: "17:00" }] },
  { day: 3, blocks: [{ start: "09:00", end: "12:30" }, { start: "13:30", end: "17:00" }] },
  { day: 4, blocks: [{ start: "09:00", end: "12:30" }, { start: "13:30", end: "17:00" }] },
  { day: 5, blocks: [{ start: "09:00", end: "13:00" }] },
];

export const doctors = [
  {
    id: "dr-williams",
    slug: "dr-williams",
    name: "Dr. Williams",
    title: "Doctor",
    role: "Primary Doctor",
    roleIsDemo: false,
    isLead: true,
    location: "Los Angeles, California, USA",
    photo: {
      src: "/images/doctors/dr-williams.png",
      alt: "Portrait of Dr. Williams, primary doctor at the Doctor practice in Los Angeles",
      width: 1182,
      height: 1330,
      position: "50% 22%",
    },
    shortBio:
      "Dr. Williams leads the practice with a calm, attentive approach that puts patients at the center of every decision.",
    bio: [
      "Dr. Williams is the primary doctor at the Doctor practice in Los Angeles in Los Angeles, California. The practice was built around a simple idea: patients deserve unhurried attention, clear explanations, and a care plan that fits their life.",
      "Patients describe visits with Dr. Williams as thoughtful and reassuring. Each appointment begins with listening, followed by a plain-language discussion of options and next steps.",
    ],
    bioIsDemo: true,
    careAreas: [
      "General medical consultations",
      "Preventive health reviews",
      "Ongoing care & follow-up visits",
      "Health and lifestyle guidance",
    ],
    careAreasAreDemo: true,
    serviceIds: [
      "general-consultation",
      "preventive-health-screening",
      "follow-up-care",
      "minor-illness-injury",
      "wellness-lifestyle",
      "virtual-consultation",
    ],
    languages: ["English"],
    languagesAreDemo: true,
    schedule: standardWeek,
    scheduleIsDemo: true,
    acceptingNewPatients: true,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "dr-jones",
    slug: "dr-jones",
    name: "Dr. Jones",
    title: "Doctor",
    role: "Medical Professional",
    roleIsDemo: true,
    isLead: false,
    location: "Los Angeles, California, USA",
    photo: {
      src: "/images/doctors/dr-jones.jpg",
      alt: "Portrait of Dr. Jones, medical professional at the Doctor practice in Los Angeles",
      width: 380,
      height: 526,
      position: "50% 20%",
    },
    shortBio:
      "Dr. Jones brings a warm, approachable manner to every visit and a strong focus on clear patient communication.",
    bio: [
      "Dr. Jones is a member of the medical team at the Doctor practice in Los Angeles. Known for a friendly and reassuring style, Dr. Jones focuses on making sure every patient leaves an appointment understanding their options and next steps.",
      "Outside of patient visits, Dr. Jones helps shape the practice approach to patient communication and follow-up.",
    ],
    bioIsDemo: true,
    careAreas: [
      "General medical consultations",
      "Minor illness & injury care",
      "Follow-up visits",
      "Patient education",
    ],
    careAreasAreDemo: true,
    serviceIds: [
      "general-consultation",
      "follow-up-care",
      "minor-illness-injury",
      "virtual-consultation",
    ],
    languages: ["English"],
    languagesAreDemo: true,
    schedule: [
      { day: 1, blocks: [{ start: "10:00", end: "13:00" }, { start: "14:00", end: "18:00" }] },
      { day: 3, blocks: [{ start: "10:00", end: "13:00" }, { start: "14:00", end: "18:00" }] },
      { day: 5, blocks: [{ start: "09:00", end: "13:00" }] },
      { day: 6, blocks: [{ start: "09:00", end: "12:30" }] },
    ],
    scheduleIsDemo: true,
    acceptingNewPatients: true,
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "dr-jennifer",
    slug: "dr-jennifer",
    name: "Dr. Jennifer",
    title: "Doctor",
    role: "Medical Professional",
    roleIsDemo: true,
    isLead: false,
    location: "Los Angeles, California, USA",
    photo: {
      src: "/images/doctors/dr-jennifer.jpg",
      alt: "Portrait of Dr. Jennifer, medical professional at the Doctor practice in Los Angeles",
      width: 1200,
      height: 1803,
      position: "50% 18%",
    },
    shortBio:
      "Dr. Jennifer is known for a patient, thorough approach and for helping patients feel at ease from the first visit.",
    bio: [
      "Dr. Jennifer is a member of the medical team at the Doctor practice in Los Angeles. Patients appreciate a thorough, unhurried style and a genuine interest in the whole person, not just the reason for the visit.",
      "Dr. Jennifer places particular emphasis on preventive care and on helping patients build sustainable, healthy routines.",
    ],
    bioIsDemo: true,
    careAreas: [
      "General medical consultations",
      "Preventive health reviews",
      "Wellness & lifestyle guidance",
      "Ongoing care coordination",
    ],
    careAreasAreDemo: true,
    serviceIds: [
      "general-consultation",
      "preventive-health-screening",
      "follow-up-care",
      "wellness-lifestyle",
      "virtual-consultation",
    ],
    languages: ["English"],
    languagesAreDemo: true,
    schedule: [
      { day: 2, blocks: [{ start: "08:30", end: "12:00" }, { start: "13:00", end: "16:30" }] },
      { day: 3, blocks: [{ start: "08:30", end: "12:00" }] },
      { day: 4, blocks: [{ start: "08:30", end: "12:00" }, { start: "13:00", end: "16:30" }] },
      { day: 5, blocks: [{ start: "08:30", end: "12:00" }, { start: "13:00", end: "16:30" }] },
    ],
    scheduleIsDemo: true,
    acceptingNewPatients: true,
    sortOrder: 3,
    isActive: true,
  },
];

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
