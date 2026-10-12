import { DOCUMENTS, PREPARATION_ROUTE, PROTOTYPE_PROVINCES } from "./registry.js";

export const SECTION_KEYS = ["route", "identity", "history", "documents"];
export const ROUTE_LABELS = { destination: "Destination", adult: "Adult principal applicant", nominated: "Nomination received", process: "Nomination process", business: "Business nomination", province: "Nominating province or territory", stream: "Stream on nomination confirmation" };
export const IDENTITY_LABELS = { fullName: "Full name as shown on identity document", birthDate: "Date of birth", citizenship: "Citizenship", residenceCountry: "Country of residence", maritalStatus: "Marital status" };
export const ROW_FIELDS = {
  family: { name: "Full name", relationship: "Relationship", accompanying: "Accompanying to Canada" },
  addresses: { startKnowledge: "Start date precision", from: "From month", endKnowledge: "End date precision", to: "To month", address: "Residential address", country: "Country" },
  activities: { startKnowledge: "Start date precision", from: "From month", endKnowledge: "End date precision", to: "To month", activity: "Activity", details: "Role, organization or explanation", country: "Country", status: "Status in country" },
  trips: { startKnowledge: "Departure date precision", from: "Departure month", endKnowledge: "Return date precision", to: "Return month", destination: "Destination", purpose: "Purpose" },
};
export const COLLECTION_LABELS = { family: "Family notes", addresses: "Address history", activities: "Personal history", trips: "Travel history" };

export const fact = (value = "", source = "applicant") => ({ value, source, confirmed: false });
const factsFor = labels => Object.fromEntries(Object.keys(labels).map(key => [key, fact()]));
export function createPreparationDraft(assessmentProfile = {}) {
  const identity = factsFor(IDENTITY_LABELS);
  for (const key of ["citizenship", "maritalStatus"]) {
    if (typeof assessmentProfile?.[key] === "string" && assessmentProfile[key]) identity[key] = fact(assessmentProfile[key], "assessment");
  }
  return {
    schemaVersion: "1.0", routeId: PREPARATION_ROUTE.id, routeVersion: PREPARATION_ROUTE.version,
    route: factsFor(ROUTE_LABELS), identity,
    history: { workedPastTenYears: fact(), ...Object.fromEntries(Object.keys(ROW_FIELDS).map(key => [key, { answer: fact(), rows: [] }])) },
    documents: Object.fromEntries(DOCUMENTS.map(item => [item.id, fact()])),
  };
}

function transformAt(value, path, transform) {
  if (!path.length) return transform(value);
  const [key, ...rest] = path;
  const next = Array.isArray(value) ? [...value] : { ...value };
  next[key] = transformAt(value[key], rest, transform);
  return next;
}
export function updatePreparationFact(draft, path, value) {
  return transformAt(draft, path.split("."), old => ({ ...old, value, source: "applicant", confirmed: false }));
}
export function addPreparationRow(draft, collection, id) {
  const row = { id, ...factsFor(ROW_FIELDS[collection]) };
  return { ...draft, history: { ...draft.history, [collection]: { answer: fact("Add entries"), rows: [...draft.history[collection].rows, row] } } };
}
export function removePreparationRow(draft, collection, id) {
  const current = draft.history[collection];
  return { ...draft, history: { ...draft.history, [collection]: { ...current, answer: { ...current.answer, confirmed: false }, rows: current.rows.filter(row => row.id !== id) } } };
}

function activeRowFacts(row, collection) {
  return Object.keys(ROW_FIELDS[collection]).filter(key => !(key === "from" && row.startKnowledge?.value !== "Known month") && !(key === "to" && row.endKnowledge?.value !== "Known month")).map(key => [key, row[key]]);
}
export function sectionFacts(draft, section) {
  if (section !== "history") return Object.entries(draft[section]).map(([key, item]) => ({ path: `${section}.${key}`, fact: item }));
  const result = [{ path: "history.workedPastTenYears", fact: draft.history.workedPastTenYears }];
  for (const key of Object.keys(ROW_FIELDS)) {
    const collection = draft.history[key];
    result.push({ path: `history.${key}.answer`, fact: collection.answer });
    if (collection.answer.value === "Add entries") collection.rows.forEach((row, index) => activeRowFacts(row, key).forEach(([field, item]) => result.push({ path: `history.${key}.rows.${index}.${field}`, fact: item })));
  }
  return result;
}
export function confirmPreparationSection(draft, section, confirmed) {
  let next = draft;
  for (const item of sectionFacts(draft, section)) next = transformAt(next, item.path.split("."), current => ({ ...current, confirmed: Boolean(confirmed && String(current.value).trim()) }));
  return next;
}
export function isSectionConfirmed(draft, section) {
  const items = sectionFacts(draft, section);
  return items.length > 0 && items.every(item => item.fact.confirmed && String(item.fact.value).trim());
}

export function routeGate(route) {
  const expected = { destination: "Canada", adult: "Yes", nominated: "Yes", process: "Non-Express Entry", business: "No" };
  const errors = {};
  for (const key of Object.keys(expected)) {
    if (!route[key]?.value) errors[`route.${key}`] = "Choose an answer.";
    else if (route[key].value !== expected[key]) errors[`route.${key}`] = "This answer is outside this preparation prototype’s scope. It is not an eligibility decision.";
  }
  if (!PROTOTYPE_PROVINCES.includes(route.province?.value)) errors["route.province"] = "Choose the province or territory on your nomination.";
  if (!route.stream?.value?.trim()) errors["route.stream"] = "Enter the stream on your nomination confirmation.";
  return errors;
}

export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function monthIndex(value) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null;
  const [year, month] = value.split("-").map(Number);
  return year * 12 + month - 1;
}
const monthLabel = index => `${Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, "0")}`;
export function historyGaps(rows, startMonth, endMonth) {
  const start = monthIndex(startMonth), end = monthIndex(endMonth);
  if (start === null || end === null || start > end) return [];
  const periods = rows.filter(row => row.startKnowledge.value === "Known month" && ["Known month", "Current"].includes(row.endKnowledge.value)).map(row => [monthIndex(row.from.value), row.endKnowledge.value === "Current" ? end : monthIndex(row.to.value)]).filter(([a, b]) => a !== null && b !== null && a <= b && a <= end && b >= start).sort((a, b) => a[0] - b[0]);
  const gaps = [];
  let cursor = start;
  for (const [a, b] of periods) { if (a > cursor) gaps.push([monthLabel(cursor), monthLabel(Math.min(a - 1, end))]); cursor = Math.max(cursor, b + 1); }
  if (cursor <= end) gaps.push([monthLabel(cursor), monthLabel(end)]);
  return gaps;
}

export function validatePreparationSection(draft, section, today = new Date().toISOString().slice(0, 10)) {
  if (section === "route") return routeGate(draft.route);
  const errors = {};
  const required = (path, item, label = "this answer") => { if (!String(item?.value ?? "").trim()) errors[path] = `Enter or choose ${label}.`; };
  if (section === "identity") {
    for (const key of Object.keys(IDENTITY_LABELS)) required(`identity.${key}`, draft.identity[key]);
    const birth = draft.identity.birthDate.value;
    if (birth && (!validDate(birth) || birth > today)) errors["identity.birthDate"] = "Enter your actual date of birth. Do not estimate a date.";
    else if (birth) {
      const adultDate = `${Number(birth.slice(0, 4)) + 18}${birth.slice(4)}`;
      if (adultDate > today) errors["identity.birthDate"] = "This prototype covers adult principal applicants only.";
    }
  }
  if (section === "history") {
    required("history.workedPastTenYears", draft.history.workedPastTenYears);
    for (const collection of Object.keys(ROW_FIELDS)) {
      const block = draft.history[collection], path = `history.${collection}`;
      required(`${path}.answer`, block.answer);
      if (block.answer.value !== "Add entries") continue;
      if (!block.rows.length) errors[`${path}.answer`] = "Add an entry, or choose the answer that applies.";
      block.rows.forEach((row, index) => {
        const prefix = `${path}.rows.${index}`;
        activeRowFacts(row, collection).forEach(([key, item]) => required(`${prefix}.${key}`, item));
        if (collection === "family") return;
        const from = monthIndex(row.from.value), to = row.endKnowledge.value === "Current" ? monthIndex(today.slice(0, 7)) : monthIndex(row.to.value);
        if (row.startKnowledge.value === "Known month" && (from === null || from > monthIndex(today.slice(0, 7)))) errors[`${prefix}.from`] = "Enter a valid past or current month.";
        if (row.endKnowledge.value === "Known month" && (to === null || to > monthIndex(today.slice(0, 7)))) errors[`${prefix}.to`] = "Enter a valid past or current month.";
        if (row.startKnowledge.value === "Known month" && from !== null && to !== null && row.endKnowledge.value !== "Not sure" && from > to) errors[`${prefix}.to`] = "The end month cannot be before the start month.";
        if (row.startKnowledge.value === "Known month" && from !== null && validDate(draft.identity.birthDate.value) && from < monthIndex(draft.identity.birthDate.value.slice(0, 7))) errors[`${prefix}.from`] = "The start month cannot be before your birth.";
      });
    }
  }
  if (section === "documents") DOCUMENTS.forEach(item => required(`documents.${item.id}`, draft.documents[item.id]));
  return errors;
}

export function preparationIssues(draft, today = new Date().toISOString().slice(0, 10)) {
  const issues = [];
  const unconfirmed = SECTION_KEYS.flatMap(section => sectionFacts(draft, section)).filter(item => item.fact.value && !item.fact.confirmed).length;
  if (unconfirmed) issues.push(`${unconfirmed} answers have not been confirmed in the review.`);
  for (const key of Object.keys(ROW_FIELDS)) {
    const collection = draft.history[key];
    if (collection.answer.value === "Not sure") issues.push(`${COLLECTION_LABELS[key]} is still unknown.`);
    if (collection.answer.value === "Add entries" && collection.rows.some(row => activeRowFacts(row, key).some(([, item]) => item.value === "Not sure"))) issues.push(`${COLLECTION_LABELS[key]} contains uncertain answers; coverage cannot be fully checked.`);
  }
  const birth = draft.identity.birthDate.value;
  if (validDate(birth)) {
    const adult = `${Number(birth.slice(0, 4)) + 18}${birth.slice(4, 7)}`;
    const tenYearsAgo = `${Number(today.slice(0, 4)) - 10}${today.slice(4, 7)}`;
    for (const key of ["addresses", "activities"]) {
      const block = draft.history[key];
      if (block.answer.value !== "Add entries") continue;
      const horizon = key === "activities" && draft.history.workedPastTenYears.value === "No" ? adult : [adult, tenYearsAgo].sort().at(-1);
      const gaps = historyGaps(block.rows, horizon, today.slice(0, 7));
      if (gaps.length) issues.push(`${COLLECTION_LABELS[key]} has uncovered months: ${gaps.map(([from, to]) => from === to ? from : `${from} to ${to}`).join(", ")}.`);
    }
  }
  if (draft.history.workedPastTenYears.value === "Not sure") issues.push("Confirm whether you worked during the past ten years; this affects the personal-history period.");
  if (draft.history.family.answer.value === "Add entries" && draft.history.family.rows.some(row => /Spouse|Partner|Child/.test(row.relationship.value))) issues.push("Family-member forms and histories are not covered by this principal-applicant worksheet.");
  if (Object.values(draft.documents).some(item => item.value !== "Have a copy")) issues.push("Some document reminders remain unresolved or need an applicability check. Copies are not verified here.");
  return issues;
}

export function buildPreparationWorksheet(draft, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const errors = Object.assign({}, ...SECTION_KEYS.map(section => validatePreparationSection(draft, section, today)));
  if (Object.keys(errors).length) throw new Error("Complete the required worksheet answers before export.");
  const lines = ["PATHWAYFINDER — PARTIAL PREPARATION WORKSHEET", "Not an official application. Not ready for filing.", `Generated: ${now.toISOString()}`, `Route: ${PREPARATION_ROUTE.label}`, `Route version: ${draft.routeVersion}; schema: ${draft.schemaVersion}`, "", ...PREPARATION_ROUTE.limitations.map(item => `• ${item}`), ""];
  const addFact = (label, item) => lines.push(`${label}: ${String(item.value || "Unanswered")} [${item.confirmed ? "applicant confirmed" : "UNCONFIRMED"}; source: ${item.source}]`);
  for (const section of ["route", "identity"]) {
    lines.push(section.toUpperCase());
    for (const [key, label] of Object.entries(section === "route" ? ROUTE_LABELS : IDENTITY_LABELS)) addFact(label, draft[section][key]);
    lines.push("");
  }
  addFact("Worked during the past ten years", draft.history.workedPastTenYears);
  for (const [key, label] of Object.entries(COLLECTION_LABELS)) {
    lines.push("", label.toUpperCase());
    const block = draft.history[key];
    addFact("Answer", block.answer);
    if (block.answer.value === "Add entries") block.rows.forEach((row, index) => { lines.push(`Entry ${index + 1}`); activeRowFacts(row, key).forEach(([field, item]) => addFact(ROW_FIELDS[key][field], item)); });
  }
  lines.push("", "DOCUMENT REMINDERS — SELF-REPORTED, NOT VERIFIED");
  DOCUMENTS.forEach(item => addFact(item.label, draft.documents[item.id]));
  lines.push("", "REMAINING QUESTIONS");
  const issues = preparationIssues(draft, today);
  lines.push(...(issues.length ? issues.map(item => `• ${item}`) : ["No open questions detected in the limited fields collected. Official application coverage is still incomplete."]));
  lines.push("", "OFFICIAL FORM COVERAGE");
  PREPARATION_ROUTE.outputs.forEach(item => lines.push(`${item.form} (${item.channel}): ${item.coverage}`));
  lines.push("", `PUBLIC SOURCES — REVIEWED ${PREPARATION_ROUTE.reviewedAt}`, "Authenticated portal and professional review: not completed.");
  PREPARATION_ROUTE.sources.forEach(item => lines.push(`${item.title}: ${item.url}`));
  return lines.join("\n");
}
