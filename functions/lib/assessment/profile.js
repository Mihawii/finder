import { convertToClb } from "./crs.js";

const EDUCATION = {
  "PhD": "phd", "Master's": "masters",
  "Two or more credentials (one 3+ yr)": "two_plus",
  "Bachelor's (3+ yr)": "bachelors", "2-year post-secondary": "two_year",
  "1-year post-secondary": "one_year", "High school diploma": "high_school",
  "Less than high school": "below_hs",
};
const WORK_YEARS = {
  "None": 0, "1 year": 1, "2 years": 2, "3 years": 3, "4 years": 4,
  "5+ years": 5, "4-5 years": 4, "6+ years": 6, "4+ years": 4, "3+ years": 3,
};
const TESTS = {
  "IELTS General Training": "ielts", "CELPIP General": "celpip", "PTE Core": "pte",
  "No test yet": "none", "No test": "none", "IELTS": "ielts", "CELPIP": "celpip",
  "TEF Canada": "tef", "TCF Canada": "tcf",
};
const TEER = {
  "TEER 0": "0", "TEER 1": "1", "TEER 2": "2", "TEER 3": "3",
  "TEER 4 or 5": "4_or_5", "Not sure": null,
};
const MARITAL = {
  "Single": "single", "Married": "married", "Common-law": "common_law",
  "Divorced": "divorced", "Separated": "separated", "Widowed": "widowed",
};
const NOMINATION_TYPES = {
  express_entry: "express_entry", non_express_entry: "non_express_entry", unknown: "unknown",
  "Express Entry": "express_entry", "Non-Express Entry": "non_express_entry", "Not sure": "unknown",
};
const asAnswer = value => value === "Yes" || value === true ? true : value === "No" || value === false ? false : null;
const asNumber = value => value === "" || value == null ? null : typeof value === "number" || typeof value === "string" ? Number(value) : NaN;

/** Translate questionnaire answers without treating an unanswered fact as false. */
export function mapProfileForCRS(formProfile = {}) {
  const scores = (prefix = "") => Object.fromEntries(["reading", "writing", "listening", "speaking"].map(ability => [
    ability, asNumber(formProfile[prefix ? prefix + ability[0].toUpperCase() + ability.slice(1) : ability]),
  ]));
  const hasProvincialNomination = asAnswer(formProfile.provincialNomination);
  const nominationType = hasProvincialNomination === true ? NOMINATION_TYPES[formProfile.nominationType] ?? null : null;
  const mapped = {
    destination: formProfile.destination ?? "ca",
    age: asNumber(formProfile.age),
    maritalStatus: MARITAL[formProfile.maritalStatus] ?? null,
    spouseAccompanying: asAnswer(formProfile.spouseAccompanying),
    spouseIsCitizenPR: asAnswer(formProfile.spouseIsCitizenPR),
    dependentChildren: asNumber(formProfile.dependentChildren),
    citizenship: formProfile.citizenship ?? "",
    education: EDUCATION[formProfile.education] ?? null,
    educationCountry: formProfile.educationCountry === "In Canada" ? "canada" : formProfile.educationCountry === "Outside Canada" ? "foreign" : null,
    ecaObtained: asAnswer(formProfile.ecaObtained),
    canadianEducationYears: formProfile.educationCountry === "In Canada"
      ? ({ "1 year or less": 1, "2 years": 2, "3+ years (degree program)": 3, "1 year": 1, "3+ years": 3 }[formProfile.canadianEducationYears] ?? null) : 0,
    firstLangTest: TESTS[formProfile.firstLangTest] ?? null,
    firstLangScores: scores(),
    hasSecondLang: asAnswer(formProfile.hasSecondLang),
    secondLangTest: TESTS[formProfile.secondLangTest] ?? null,
    secondLangScores: scores("fr"),
    spouseEducation: EDUCATION[formProfile.spouseEducation] ?? null,
    spouseLangTest: TESTS[formProfile.spouseLangTest] ?? null,
    spouseClbScores: scores("spouse"),
    spouseCanadianWorkYears: WORK_YEARS[formProfile.spouseCanadianWorkYears] ?? null,
    foreignWorkYears: WORK_YEARS[formProfile.foreignWorkYears] ?? null,
    canadianWorkYears: WORK_YEARS[formProfile.canadianWorkYears] ?? null,
    nocTeer: TEER[formProfile.nocTeer] ?? null,
    inCanada: asAnswer(formProfile.inCanada),
    currentProvince: formProfile.currentProvince ?? "",
    siblingInCanada: asAnswer(formProfile.siblingInCanada),
    hasProvincialNomination,
    nominationType,
    // Only an Express Entry nomination supplies CRS points. A base PNP
    // nomination remains in the profile for the separate preparation route.
    // IRCC source, verified 2026-10-11:
    // canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees/express-entry/get-confirm-nomination.html
    provincialNomination: hasProvincialNomination === true && nominationType === "express_entry",
    provincePreference: formProfile.provincePreference || "Open to any",
    hasJobOffer: asAnswer(formProfile.hasJobOffer),
    workAuthorizedInCanada: asAnswer(formProfile.workAuthorizedInCanada),
    settlementFunds: asNumber(formProfile.settlementFunds),
    previousRefusals: asAnswer(formProfile.previousRefusals),
    criminalHistory: asAnswer(formProfile.criminalHistory),
    openToStudy: asAnswer(formProfile.openToStudy),
  };
  mapped.clb = convertToClb(mapped.firstLangTest, mapped.firstLangScores);
  mapped.clb2 = mapped.hasSecondLang ? convertToClb(mapped.secondLangTest, mapped.secondLangScores) : convertToClb("none");
  mapped.spouseClb = convertToClb(mapped.spouseLangTest, mapped.spouseClbScores);
  return mapped;
}
