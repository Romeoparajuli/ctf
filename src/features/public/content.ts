/**
 * Static Nepal Cyber Shield brand/marketing copy — content that doesn't have
 * a field in the (deliberately multi-event-capable) event data model, e.g.
 * "why participate" messaging, the organizer name, competition-stage
 * narrative. Genuinely per-event data (name, fees, dates, prize pool,
 * description, rules, team size, registration status) still comes from the
 * event record via the API, unchanged — this file exists so that brand copy
 * lives in exactly one place instead of being duplicated across section
 * components.
 *
 * The qualifier date below is stated in the Bikram Sambat calendar, as
 * officially announced — it is presentational text, not derived from the
 * event record's (Gregorian) date fields, and is not used for any
 * date-math or registration-window logic.
 */
export const BRAND = {
  tagline: "Where curiosity meets cybersecurity. Where skills meet challenges.",
  organizer: "Rotaract Club of Lumbini Stars",
  qualifierDateLabel: "Ashoj 3, 2083",
  finalDateLabel: "To Be Announced",
  finalVenueLabel: "To Be Announced",
  footerTagline: "Discover Cyber Talent · Promote Ethical Hacking · Build a Secure Digital Nepal",
  closingLine: "Hack to Defend. Secure the Future.",
};

export const WHY_CYBER_SHIELD = [
  {
    index: "01",
    title: "Discover Cyber Talent",
    description: "Identify and showcase emerging cybersecurity talent from across Nepal through practical, skill-based challenges.",
  },
  {
    index: "02",
    title: "Promote Ethical Hacking",
    description: "Encourage participants to apply cybersecurity knowledge responsibly within a safe and controlled competition environment.",
  },
  {
    index: "03",
    title: "Build a Secure Digital Nepal",
    description: "Support cybersecurity awareness, technical capability, and a culture of responsible security practices.",
  },
];

export const CHALLENGE_AREAS = [
  "Web Security",
  "Cryptography",
  "Digital Forensics",
  "Reverse Engineering",
  "Binary Exploitation",
  "OSINT",
  "Network Security",
  "General Cybersecurity",
];

export const PARTICIPANT_TYPES = [
  "Students interested in cybersecurity",
  "Cybersecurity enthusiasts",
  "Young professionals",
  "Ethical hacking enthusiasts",
  "Aspiring security researchers",
  "Participants interested in Capture the Flag competitions",
];

export const COMPETITION_STAGES = [
  {
    stage: "Stage 01",
    title: "Online Qualifier",
    description:
      "The competition begins with an online Capture the Flag qualification round. Participants will solve cybersecurity challenges designed to test technical knowledge, logical thinking, and problem-solving skills.",
    dateLabel: BRAND.qualifierDateLabel,
    confirmed: true,
  },
  {
    stage: "Stage 02",
    title: "Grand Final",
    description:
      "Qualified participants will compete in the final round at a physical venue. The strongest performers from the online qualifier advance to this stage.",
    dateLabel: BRAND.finalDateLabel,
    confirmed: false,
  },
];
