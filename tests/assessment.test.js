import test from "node:test";
import assert from "node:assert/strict";
import { calcCRS, convertToClb } from "../functions/lib/assessment/crs.js";
import { mapProfileForCRS } from "../functions/lib/assessment/profile.js";
import { validateAssessmentProfile } from "../functions/lib/assessment/validation.js";
import { assessSettlementFunds } from "../functions/lib/assessment/funds.js";

const all = value => ({ reading: value, writing: value, listening: value, speaking: value });
const form = overrides => ({
  age: "30", maritalStatus: "Single", dependentChildren: "0", citizenship: "India",
  education: "Master's", educationCountry: "Outside Canada", ecaObtained: "Yes",
  firstLangTest: "IELTS General Training", reading: "8", writing: "8", listening: "8", speaking: "8",
  hasSecondLang: "No", foreignWorkYears: "3 years", canadianWorkYears: "None", nocTeer: "Not sure",
  inCanada: "No", siblingInCanada: "No", provincialNomination: "No", hasJobOffer: "No",
  settlementFunds: "20000", previousRefusals: "No", criminalHistory: "No", openToStudy: "No",
  ...overrides,
});
const normalized = overrides => ({ ...mapProfileForCRS(form()), ...overrides });
const scoreProfile = overrides => ({
  age: 30, maritalStatus: "single", education: "masters", clb: all(8),
  foreignWorkYears: 3, canadianWorkYears: 0, ...overrides,
});

test("IELTS bands are converted per ability, not confused with CLB", () => {
  assert.deepEqual(convertToClb("ielts", all(8)), { reading: 10, writing: 10, listening: 9, speaking: 10 });
  const result = validateAssessmentProfile(normalized());
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.breakdown, {
    age: 105, education: 135, firstLanguage: 133, secondLanguage: 0,
    canadianWork: 0, spouse: 0, skillTransfer: 100, additional: 0, total: 473,
  });
  assert.equal(calcCRS(scoreProfile()).total, 382, "382 is the all-CLB-8 profile, not IELTS 8 in every ability");
});

test("previously corrected spouse column and second-language caps stay intact", () => {
  const partner = scoreProfile({ maritalStatus: "married", spouseAccompanying: true, spouseIsCitizenPR: false, hasSecondLang: true, clb2: all(9) });
  assert.equal(calcCRS(partner).age, 95);
  assert.equal(calcCRS(partner).secondLanguage, 22);
  assert.equal(calcCRS({ ...partner, spouseAccompanying: false }).age, 105);
  assert.equal(calcCRS({ ...partner, spouseIsCitizenPR: true }).secondLanguage, 24);
});

test("French bonus distinguishes CLB 5 English and caps additional factors", () => {
  const bilingual = scoreProfile({ hasSecondLang: true, clb2: all(7), clb: all(5) });
  assert.equal(calcCRS(bilingual).additional, 50);
  assert.equal(calcCRS({ ...bilingual, clb: all(4) }).additional, 25);
  assert.equal(calcCRS({ ...bilingual, provincialNomination: true, siblingInCanada: true, canadianEducationYears: 3 }).additional, 600);
});

test("CLB 4 has six first-language points per ability", () => {
  assert.equal(calcCRS(scoreProfile({ clb: all(4) })).firstLanguage, 24);
  assert.equal(calcCRS(scoreProfile({ clb: all(3) })).firstLanguage, 0);
});

test("IRCC accompanying-spouse Canadian work rows use 63 and 5/7/8/9/10", () => {
  const partner = scoreProfile({ maritalStatus: "married", spouseAccompanying: true, spouseIsCitizenPR: false, canadianWorkYears: 4 });
  assert.equal(calcCRS(partner).canadianWork, 63);
  for (const [years, points] of [[0, 0], [1, 5], [2, 7], [3, 8], [4, 9], [5, 10]]) {
    assert.equal(calcCRS({ ...partner, spouseCanadianWorkYears: years }).spouse, points);
  }
});

test("one credential uses the lower transferability band, including a bachelor’s", () => {
  for (const education of ["one_year", "two_year", "bachelors"]) {
    assert.equal(calcCRS(scoreProfile({ education, clb: all(7), foreignWorkYears: 0 })).skillTransfer, 13);
    assert.equal(calcCRS(scoreProfile({ education, clb: all(9), foreignWorkYears: 0 })).skillTransfer, 25);
  }
  assert.equal(calcCRS(scoreProfile({ education: "bachelors", clb: all(7), foreignWorkYears: 0 })).total, 306);
  const married = calcCRS(scoreProfile({
    age: 35, maritalStatus: "married", spouseAccompanying: true, spouseIsCitizenPR: false,
    education: "bachelors", clb: all(7), foreignWorkYears: 0,
    spouseEducation: "masters", spouseClb: all(7),
  }));
  assert.equal(married.total, 281, "all-CLB-7 spouse fixture with corrected bachelor transferability");
});

test("transferability caps education and foreign work independently before overall cap", () => {
  assert.equal(calcCRS(scoreProfile({ clb: all(9), canadianWorkYears: 2, foreignWorkYears: 0 })).skillTransfer, 50);
  assert.equal(calcCRS(scoreProfile({ clb: all(9), canadianWorkYears: 2, education: "below_hs" })).skillTransfer, 50);
  assert.equal(calcCRS(scoreProfile({ clb: all(9), canadianWorkYears: 2 })).skillTransfer, 100);
  assert.equal(calcCRS(scoreProfile({ age: 25, education: "phd", clb: all(10), hasSecondLang: true, clb2: all(10), canadianWorkYears: 5, provincialNomination: true })).total, 1200);
});

test("language table lower thresholds produce official CLB values", () => {
  assert.deepEqual(convertToClb("pte", { reading: 60, writing: 69, listening: 60, speaking: 68 }), all(7));
  assert.deepEqual(convertToClb("tef", { reading: 207, writing: 310, listening: 249, speaking: 310 }), all(7));
  assert.deepEqual(convertToClb("tcf", { reading: 453, writing: 10, listening: 458, speaking: 10 }), all(7));
  assert.deepEqual(convertToClb("celpip", all(12)), all(10));
  assert.deepEqual(convertToClb("none"), all(0));
});

test("unknown occupation and unanswered booleans remain unknown", () => {
  const mapped = mapProfileForCRS(form({ hasJobOffer: "", settlementFunds: "" }));
  assert.equal(mapped.nocTeer, null);
  assert.equal(mapped.hasJobOffer, null);
  assert.equal(mapped.workAuthorizedInCanada, null);
  assert.equal(mapped.settlementFunds, null);
  assert.equal(mapProfileForCRS(form({ nocTeer: "TEER 0" })).nocTeer, "0");
  assert.equal(mapProfileForCRS(form({ nocTeer: "TEER 4 or 5" })).nocTeer, "4_or_5");
  assert.deepEqual(validateAssessmentProfile(normalized()).issues, [], "TEER and work authorization can explicitly remain unknown");
});

test("no-test selection does not invent IELTS results", () => {
  const mapped = mapProfileForCRS(form({ firstLangTest: "No test yet", reading: "", writing: "", listening: "", speaking: "" }));
  const result = validateAssessmentProfile(mapped);
  assert.deepEqual(result.issues, []);
  assert.equal(result.profile.firstLangTest, "none");
  assert.deepEqual(result.profile.clb, all(0));
  assert.equal(result.breakdown.firstLanguage, 0);
});

test("non-Express Entry and unknown nominations never receive 600 CRS points", () => {
  for (const nominationType of ["non_express_entry", "unknown"]) {
    const result = validateAssessmentProfile(mapProfileForCRS(form({ provincialNomination: "Yes", nominationType })));
    assert.deepEqual(result.issues, []);
    assert.equal(result.profile.hasProvincialNomination, true);
    assert.equal(result.profile.provincialNomination, false);
    assert.equal(result.breakdown.additional, 0);
  }
  const result = validateAssessmentProfile(mapProfileForCRS(form({ provincialNomination: "Yes", nominationType: "express_entry" })));
  assert.equal(result.profile.provincialNomination, true);
  assert.equal(result.breakdown.additional, 600);
});

test("server validation ignores tampered CLB, breakdown, nomination points and extra fields", () => {
  const result = validateAssessmentProfile(normalized({
    clb: all(999), clb2: all(999), spouseClb: all(999),
    breakdown: { total: 1200 }, provincialNomination: true, admin: true,
  }));
  assert.deepEqual(result.issues, []);
  assert.equal(result.breakdown.total, 473);
  assert.equal(result.profile.provincialNomination, false);
  assert.equal(result.profile.admin, undefined);
  assert.equal(result.profile.breakdown, undefined);
});

test("missing or invalid request data produces field issues and no score", () => {
  for (const input of [undefined, null, [], "profile", 12, {}]) {
    const result = validateAssessmentProfile(input);
    assert.equal(result.profile, null);
    assert.equal(result.breakdown, null);
    assert.ok(result.issues.length > 0);
  }
  for (const [field, value] of [["destination", "us"], ["age", "30"], ["age", 30.5], ["age", NaN], ["hasJobOffer", "false"], ["settlementFunds", -1], ["dependentChildren", 2.5], ["education", "invented"], ["nocTeer", "6"], ["workAuthorizedInCanada", "Yes"]]) {
    const result = validateAssessmentProfile(normalized({ [field]: value }));
    assert.equal(result.breakdown, null, field);
    assert.ok(result.issues.some(issue => issue.field === field), field);
  }
});

test("conditional spouse, nomination and language details are required", () => {
  for (const [overrides, field] of [
    [{ maritalStatus: "married", spouseAccompanying: null }, "spouseAccompanying"],
    [{ maritalStatus: "married", spouseAccompanying: true, spouseIsCitizenPR: null }, "spouseIsCitizenPR"],
    [{ hasProvincialNomination: true, nominationType: null }, "nominationType"],
    [{ hasSecondLang: true, secondLangTest: null }, "secondLangTest"],
    [{ firstLangScores: { ...all(8), reading: undefined } }, "firstLangScores.reading"],
    [{ firstLangTest: "ielts", firstLangScores: all(7.25) }, "firstLangScores.reading"],
    [{ firstLangTest: "celpip", firstLangScores: all(13) }, "firstLangScores.reading"],
    [{ firstLangTest: "pte", firstLangScores: all(95) }, "firstLangScores.reading"],
    [{ hasSecondLang: true, secondLangTest: "tef", secondLangScores: all(699) }, "secondLangScores.reading"],
  ]) {
    const result = validateAssessmentProfile(normalized(overrides));
    assert.equal(result.profile, null);
    assert.ok(result.issues.some(issue => issue.field === field), field);
  }
});

test("funds include non-accompanying partners and all dependent children", () => {
  const funds = assessSettlementFunds(normalized({ maritalStatus: "married", spouseAccompanying: false, spouseIsCitizenPR: true, dependentChildren: 2, settlementFunds: 28362 }));
  assert.equal(funds.familySize, 4);
  assert.equal(funds.required, 28362);
  assert.equal(funds.status, "sufficient");
  assert.equal(assessSettlementFunds(normalized({ maritalStatus: "married", dependentChildren: 6 })).required, 44504);
  assert.equal(assessSettlementFunds(normalized({ maritalStatus: "married", dependentChildren: 7 })).required, 48616);
});

test("funds boundaries distinguish zero, missing amounts and exemptions", () => {
  assert.equal(assessSettlementFunds(normalized({ settlementFunds: 15262.99 })).status, "insufficient");
  assert.equal(assessSettlementFunds(normalized({ settlementFunds: 15263 })).status, "sufficient");
  assert.equal(assessSettlementFunds(normalized({ settlementFunds: 0 })).available, 0);
  assert.equal(assessSettlementFunds(normalized({ settlementFunds: null })).status, "unknown");
  assert.equal(assessSettlementFunds(normalized({ dependentChildren: null })).status, "unknown");
  assert.equal(assessSettlementFunds(normalized({ maritalStatus: "separated" })).status, "unknown");
  assert.equal(assessSettlementFunds(null).status, "unknown");
  assert.equal(assessSettlementFunds(normalized({ hasJobOffer: true, workAuthorizedInCanada: false, settlementFunds: 0 })).status, "insufficient");
  assert.equal(assessSettlementFunds(normalized({ hasJobOffer: true, workAuthorizedInCanada: null, settlementFunds: 0 })).status, "unknown");
  assert.equal(assessSettlementFunds(normalized({ hasJobOffer: true, workAuthorizedInCanada: true, settlementFunds: 0 })).status, "exempt");
  assert.equal(assessSettlementFunds(normalized({ settlementFunds: 0 }), { program: "cec" }).status, "exempt");
  assert.equal(assessSettlementFunds(normalized({ canadianWorkYears: 2, settlementFunds: 0 })).status, "insufficient", "work experience alone must not select CEC");
  assert.equal(assessSettlementFunds(normalized(), { program: "pnp" }).status, "unknown");
});
