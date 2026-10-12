import test from "node:test";
import assert from "node:assert/strict";
import { DOCUMENTS, PREPARATION_ROUTE } from "../functions/lib/preparation/registry.js";
import {
  createPreparationDraft, updatePreparationFact, addPreparationRow, removePreparationRow,
  confirmPreparationSection, isSectionConfirmed, routeGate, validDate, monthIndex,
  historyGaps, validatePreparationSection, preparationIssues, buildPreparationWorksheet,
} from "../functions/lib/preparation/model.js";

const NOW = new Date("2026-10-11T12:00:00Z");
const TODAY = "2026-10-11";
const set = (draft, values) => Object.entries(values).reduce((current, [path, value]) => updatePreparationFact(current, path, value), draft);
function completeDraft() {
  let draft = set(createPreparationDraft(), {
    "route.destination": "Canada", "route.adult": "Yes", "route.nominated": "Yes", "route.process": "Non-Express Entry", "route.business": "No", "route.province": "Ontario", "route.stream": "Employer Job Offer",
    "identity.fullName": "Example Applicant", "identity.birthDate": "1990-02-12", "identity.citizenship": "Example country", "identity.residenceCountry": "Example country", "identity.maritalStatus": "Single",
    "history.workedPastTenYears": "Yes", "history.family.answer": "Not sure", "history.addresses.answer": "Not sure", "history.activities.answer": "Not sure", "history.trips.answer": "Did not travel",
  });
  for (const item of DOCUMENTS) draft = updatePreparationFact(draft, `documents.${item.id}`, "Not sure");
  return draft;
}
function period(from, to = "Current") {
  return { startKnowledge: { value: "Known month" }, from: { value: from }, endKnowledge: { value: to === "Current" ? "Current" : "Known month" }, to: { value: to === "Current" ? "" : to } };
}

test("assessment seeds stay unconfirmed and do not invent a nomination route, birth date or declarations", () => {
  const draft = createPreparationDraft({ citizenship: "Canada", maritalStatus: "Single", age: 33, provincialNomination: "Yes", criminalHistory: "No" });
  assert.equal(draft.identity.citizenship.source, "assessment");
  assert.equal(draft.identity.citizenship.confirmed, false);
  assert.equal(draft.identity.birthDate.value, "");
  assert.equal(draft.route.nominated.value, "");
  assert.equal(draft.route.process.value, "");
  assert.equal(draft.history.trips.answer.value, "");
  assert.equal("declarations" in draft, false);
  assert.equal(Object.keys(routeGate(draft.route)).length, 7);
});

test("every out-of-scope or unknown gate answer blocks progression without an ineligibility claim", () => {
  const draft = completeDraft();
  assert.deepEqual(routeGate(draft.route), {});
  for (const [field, value] of [["destination", "United States"], ["adult", "No"], ["nominated", "No"], ["process", "Express Entry"], ["process", "Not sure"], ["business", "Yes"]]) {
    const result = routeGate(updatePreparationFact(draft, `route.${field}`, value).route);
    assert.match(result[`route.${field}`], /not an eligibility decision/);
  }
  assert.ok(routeGate(updatePreparationFact(draft, "route.province", "Quebec").route)["route.province"]);
});

test("changing a confirmed answer resets its confirmation and preserves the previous immutable draft", () => {
  const confirmed = confirmPreparationSection(completeDraft(), "identity", true);
  assert.equal(isSectionConfirmed(confirmed, "identity"), true);
  const edited = updatePreparationFact(confirmed, "identity.fullName", "Corrected Applicant");
  assert.equal(edited.identity.fullName.confirmed, false);
  assert.equal(isSectionConfirmed(edited, "identity"), false);
  assert.equal(confirmed.identity.fullName.value, "Example Applicant");
  assert.equal(confirmed.identity.fullName.confirmed, true);
});

test("core missing answers and a contradictory minor birth date block export", () => {
  assert.throws(() => buildPreparationWorksheet(createPreparationDraft(), NOW), /required worksheet answers/);
  const missingName = updatePreparationFact(completeDraft(), "identity.fullName", " ");
  assert.throws(() => buildPreparationWorksheet(missingName, NOW), /required worksheet answers/);
  const minor = updatePreparationFact(completeDraft(), "identity.birthDate", "2010-10-11");
  assert.match(validatePreparationSection(minor, "identity", TODAY)["identity.birthDate"], /adult/);
  assert.equal(validDate("2024-02-29"), true);
  assert.equal(validDate("2025-02-29"), false);
  assert.equal(monthIndex("2026-13"), null);
});

test("gap detection combines concurrent activities and reports exact uncovered months", () => {
  const rows = [period("2025-01", "2025-03"), period("2025-03", "2025-05"), period("2025-07")];
  assert.deepEqual(historyGaps(rows, "2025-01", "2025-10"), [["2025-06", "2025-06"]]);
  assert.deepEqual(historyGaps([period("2024-01")], "2025-01", "2025-10"), []);
  assert.deepEqual(historyGaps([], "2025-01", "2025-10"), [["2025-01", "2025-10"]]);
});

test("unknown dates remain blank and cannot establish chronology coverage", () => {
  let draft = addPreparationRow(completeDraft(), "activities", "activity-1");
  draft = set(draft, {
    "history.activities.rows.0.startKnowledge": "Not sure", "history.activities.rows.0.endKnowledge": "Not sure",
    "history.activities.rows.0.activity": "Employment", "history.activities.rows.0.details": "Example role",
    "history.activities.rows.0.country": "Example country", "history.activities.rows.0.status": "Citizen",
  });
  assert.equal(draft.history.activities.rows[0].from.value, "");
  assert.equal(draft.history.activities.rows[0].to.value, "");
  assert.deepEqual(validatePreparationSection(draft, "history", TODAY), {});
  assert.ok(preparationIssues(draft, TODAY).some(issue => /Personal history has uncovered months: 2016-10 to 2026-10/.test(issue)));
  assert.ok(preparationIssues(draft, TODAY).some(issue => /uncertain answers/.test(issue)));
});

test("the no-work exception checks history since 18 rather than only ten years", () => {
  let draft = addPreparationRow(completeDraft(), "activities", "activity-1");
  draft = set(draft, {
    "history.workedPastTenYears": "No", "history.activities.rows.0.startKnowledge": "Known month", "history.activities.rows.0.from": "2016-10",
    "history.activities.rows.0.endKnowledge": "Current", "history.activities.rows.0.activity": "Retired",
    "history.activities.rows.0.details": "Retired", "history.activities.rows.0.country": "Example country", "history.activities.rows.0.status": "Citizen",
  });
  assert.ok(preparationIssues(draft, TODAY).some(issue => /2008-02 to 2016-09/.test(issue)));
});

test("date order and future dates are rejected, and adding or removing rows clears collection confirmation", () => {
  const confirmed = confirmPreparationSection(completeDraft(), "history", true);
  let draft = addPreparationRow(confirmed, "trips", "trip-1");
  assert.equal(draft.history.trips.answer.confirmed, false);
  draft = set(draft, {
    "history.trips.rows.0.startKnowledge": "Known month", "history.trips.rows.0.from": "2025-06",
    "history.trips.rows.0.endKnowledge": "Known month", "history.trips.rows.0.to": "2025-05",
    "history.trips.rows.0.destination": "Example place", "history.trips.rows.0.purpose": "Tourism",
  });
  assert.match(validatePreparationSection(draft, "history", TODAY)["history.trips.rows.0.to"], /before the start/);
  draft = updatePreparationFact(draft, "history.trips.rows.0.to", "2027-01");
  assert.match(validatePreparationSection(draft, "history", TODAY)["history.trips.rows.0.to"], /past or current/);
  draft = removePreparationRow(draft, "trips", "trip-1");
  assert.equal(draft.history.trips.rows.length, 0);
  assert.ok(validatePreparationSection(draft, "history", TODAY)["history.trips.answer"]);
});

test("a download is explicitly partial, versioned, sourced and flags unconfirmed facts", () => {
  const worksheet = buildPreparationWorksheet(completeDraft(), NOW);
  assert.match(worksheet, /PARTIAL PREPARATION WORKSHEET/);
  assert.match(worksheet, /Not an official application\. Not ready for filing/);
  assert.match(worksheet, /UNCONFIRMED; source: applicant/);
  assert.match(worksheet, /Did not travel/);
  assert.match(worksheet, /IMM 0199/);
  assert.match(worksheet, /declarations not implemented/);
  assert.ok(worksheet.includes(PREPARATION_ROUTE.version));
  assert.equal(PREPARATION_ROUTE.portalVerifiedAt, null);
  assert.equal(PREPARATION_ROUTE.professionalReviewedAt, null);
  assert.ok(PREPARATION_ROUTE.sources.every(source => source.url.startsWith("https://www.canada.ca/")));
});

test("hidden historical entries never appear as active facts after an explicit no-travel answer", () => {
  let draft = addPreparationRow(completeDraft(), "trips", "trip-1");
  draft = updatePreparationFact(draft, "history.trips.rows.0.destination", "Old draft destination");
  draft = updatePreparationFact(draft, "history.trips.answer", "Did not travel");
  const worksheet = buildPreparationWorksheet(draft, NOW);
  assert.equal(worksheet.includes("Old draft destination"), false);
  assert.equal(draft.history.trips.rows[0].destination.value, "Old draft destination");
});
