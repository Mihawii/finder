const guide = "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/application-forms-guides/";

export const PREPARATION_ROUTE = Object.freeze({
  id: "ca-pnp-non-express-entry",
  version: "2026-10-11.prototype-1",
  country: "CA",
  label: "Provincial nominee · Non-Express Entry",
  capability: "partial-preparation-worksheet",
  reviewedAt: "2026-10-11",
  portalVerifiedAt: null,
  professionalReviewedAt: null,
  sources: [
    { id: "pnp-documents", title: "IRCC provincial nominee document requirements", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees/non-express-entry/documents.html" },
    { id: "imm0008", title: "IMM 0008 · Applicant information", url: `${guide}imm0008.html` },
    { id: "imm5669", title: "IMM 5669 · Background and history", url: `${guide}imm5669.html` },
    { id: "imm5406", title: "IMM 5406 · Family information", url: `${guide}imm5406.html` },
    { id: "imm5562", title: "IMM 5562 · Travel history", url: `${guide}imm5562.html` },
  ],
  outputs: [
    { form: "IMM 0008", channel: "portal", coverage: "Partial applicant notes only" },
    { form: "IMM 5669", channel: "portal", coverage: "Partial principal-applicant history; declarations not implemented" },
    { form: "IMM 5406", channel: "portal", coverage: "Partial family notes; complete per-person forms not implemented" },
    { form: "IMM 5562", channel: "portal", coverage: "Partial principal-applicant travel notes only" },
    { form: "IMM 0199", channel: "pdf", coverage: "Official checklist not filled; preparation reminders only" },
    { form: "IMM 0008 Schedule 4", channel: "pdf", coverage: "Not implemented" },
    { form: "IMM 0008 Schedule 4A", channel: "pdf", coverage: "Business nominees outside prototype scope" },
    { form: "IMM 5604 / IMM 5409 / IMM 5476", channel: "conditional", coverage: "Applicability and forms not implemented" },
  ],
  limitations: [
    "Partial preparation worksheet, not an official application or eligibility decision.",
    "Principal-applicant notes only. Complete family-member forms and histories remain to be prepared.",
    "Identity, family and document fields cover only part of the official questions.",
    "Background declarations, signatures, document verification and official form filling are not implemented.",
    "No authenticated portal mapping, professional review or PDF compatibility testing has been completed.",
    "Use the current IRCC instructions and official checklist before filing. Additional documents or forms may apply.",
  ],
});

export const DOCUMENTS = [
  { id: "nomination", label: "Provincial nomination confirmation" },
  { id: "identity", label: "Passport or travel-document copies" },
  { id: "civil", label: "Identity and civil-status documents" },
  { id: "photos", label: "Application photos" },
  { id: "police", label: "Police certificates — check countries and requirements" },
  { id: "translations", label: "Required translations — check English/French requirements" },
];

export const PROTOTYPE_PROVINCES = ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia", "Ontario", "Prince Edward Island", "Saskatchewan", "Yukon"];
