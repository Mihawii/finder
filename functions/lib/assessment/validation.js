import { calcCRS, convertToClb, CRS_EDUCATION } from "./crs.js";

const ABILITIES = ["reading", "writing", "listening", "speaking"];
const EDUCATION = CRS_EDUCATION.map(item => item.level);
const MARITAL = ["single", "married", "common_law", "divorced", "separated", "widowed"];
const PROVINCES = ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"];
const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
const zeroScores = () => Object.fromEntries(ABILITIES.map(ability => [ability, 0]));

/**
 * Validate normalized questionnaire input before building prompts or scoring.
 * Caller-supplied CLB values, score breakdowns and unknown properties are never
 * used. Results contain only allowlisted fields; invalid input returns no score.
 */
export function validateAssessmentProfile(input) {
  const issues = [];
  const fail = (field, message) => issues.push({ field, message });
  if (!isRecord(input)) return { profile: null, breakdown: null, issues: [{ field: "profile", message: "Provide a profile object." }] };
  const profile = {};
  const enumField = (field, allowed, nullable = false) => {
    const value = input[field];
    if (nullable && value == null) return profile[field] = null;
    if (!allowed.includes(value)) fail(field, `Choose a valid ${field}.`);
    return profile[field] = value;
  };
  const booleanField = (field, nullable = false) => {
    const value = input[field];
    if (nullable && value == null) return profile[field] = null;
    if (typeof value !== "boolean") fail(field, "Choose Yes or No.");
    return profile[field] = value;
  };
  const numberField = (field, min, max, integer = true) => {
    const value = input[field];
    if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
      fail(field, `Enter ${integer ? "a whole number" : "a number"} from ${min} to ${max}.`);
    }
    return profile[field] = value;
  };
  const textField = (field, required = false, maxLength = 100) => {
    const value = input[field] ?? "";
    if (typeof value !== "string" || value.length > maxLength || (required && !value.trim())) fail(field, "Provide a valid answer.");
    return profile[field] = typeof value === "string" ? value.trim() : "";
  };
  const exam = (testField, scoresField, allowed) => {
    const test = enumField(testField, allowed);
    if (test === "none") return profile[scoresField] = zeroScores();
    const raw = input[scoresField];
    if (!isRecord(raw)) {
      fail(scoresField, "Provide all four official test scores.");
      return profile[scoresField] = zeroScores();
    }
    const scores = {};
    for (const ability of ABILITIES) {
      const value = raw[ability];
      let min = 0, max = 0, step = 1;
      if (test === "ielts") { max = 9; step = 0.5; }
      if (test === "celpip") { min = 1; max = 12; }
      if (test === "pte") { min = 10; max = 90; }
      // IRCC uses the TEF certificate's "Équivalence ancien score" column,
      // not "Score / 699". Source checked 2026-10-11:
      // canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html
      if (test === "tef") max = { reading: 300, writing: 450, listening: 360, speaking: 450 }[ability];
      if (test === "tcf") max = ["reading", "listening"].includes(ability) ? 699 : 20;
      if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max || Math.abs(value / step - Math.round(value / step)) > 0.00001) {
        fail(`${scoresField}.${ability}`, `Enter a valid ${ability} score for this test.`);
      }
      scores[ability] = value;
    }
    return profile[scoresField] = scores;
  };

  enumField("destination", ["ca"]);
  numberField("age", 17, 120);
  enumField("maritalStatus", MARITAL);
  numberField("dependentChildren", 0, 30);
  textField("citizenship", true);
  const partner = ["married", "common_law"].includes(profile.maritalStatus);
  if (partner) booleanField("spouseAccompanying");
  else profile.spouseAccompanying = false;
  if (partner && profile.spouseAccompanying === true) booleanField("spouseIsCitizenPR");
  else profile.spouseIsCitizenPR = null;
  const spouseFactors = partner && profile.spouseAccompanying === true && profile.spouseIsCitizenPR === false;

  enumField("education", EDUCATION);
  enumField("educationCountry", ["canada", "foreign"]);
  if (profile.educationCountry === "foreign") booleanField("ecaObtained");
  else profile.ecaObtained = null;
  if (profile.educationCountry === "canada") numberField("canadianEducationYears", 0, 3);
  else profile.canadianEducationYears = 0;

  exam("firstLangTest", "firstLangScores", ["ielts", "celpip", "pte", "none"]);
  booleanField("hasSecondLang");
  if (profile.hasSecondLang === true) exam("secondLangTest", "secondLangScores", ["tef", "tcf"]);
  else { profile.secondLangTest = null; profile.secondLangScores = zeroScores(); }
  if (spouseFactors) {
    enumField("spouseEducation", EDUCATION);
    exam("spouseLangTest", "spouseClbScores", ["ielts", "celpip", "pte", "none"]);
    numberField("spouseCanadianWorkYears", 0, 50);
  } else {
    profile.spouseEducation = null;
    profile.spouseLangTest = "none";
    profile.spouseClbScores = zeroScores();
    profile.spouseCanadianWorkYears = 0;
  }

  numberField("foreignWorkYears", 0, 50);
  numberField("canadianWorkYears", 0, 50);
  enumField("nocTeer", ["0", "1", "2", "3", "4", "5", "4_or_5"], true);
  booleanField("inCanada");
  if (profile.inCanada === true) enumField("currentProvince", PROVINCES);
  else profile.currentProvince = "";
  booleanField("siblingInCanada");
  booleanField("hasProvincialNomination");
  if (profile.hasProvincialNomination === true) enumField("nominationType", ["express_entry", "non_express_entry", "unknown"]);
  else profile.nominationType = null;
  profile.provincialNomination = profile.hasProvincialNomination === true && profile.nominationType === "express_entry";
  if (input.provincePreference == null || input.provincePreference === "") profile.provincePreference = "Open to any";
  else enumField("provincePreference", [...PROVINCES, "Open to any"]);
  booleanField("hasJobOffer");
  booleanField("workAuthorizedInCanada", true);
  numberField("settlementFunds", 0, 1_000_000_000, false);
  booleanField("previousRefusals");
  booleanField("criminalHistory");
  booleanField("openToStudy");

  if (issues.length) return { profile: null, breakdown: null, issues };
  profile.clb = convertToClb(profile.firstLangTest, profile.firstLangScores);
  profile.clb2 = profile.hasSecondLang ? convertToClb(profile.secondLangTest, profile.secondLangScores) : zeroScores();
  profile.spouseClb = spouseFactors ? convertToClb(profile.spouseLangTest, profile.spouseClbScores) : zeroScores();
  return { profile, breakdown: calcCRS(profile), issues };
}
