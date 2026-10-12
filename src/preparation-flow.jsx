import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/ui/country-flag";
import { AssessmentChoice, AssessmentSelect, AssessmentStepper } from "@/components/ui/assessment-controls";
import { AssessmentShell } from "./assessment_flow.jsx";
import { DOCUMENTS, PREPARATION_ROUTE, PROTOTYPE_PROVINCES } from "../functions/lib/preparation/registry.js";
import {
  SECTION_KEYS, ROUTE_LABELS, IDENTITY_LABELS, ROW_FIELDS, COLLECTION_LABELS,
  createPreparationDraft, updatePreparationFact, addPreparationRow, removePreparationRow,
  confirmPreparationSection, isSectionConfirmed, sectionFacts, validatePreparationSection,
  preparationIssues, buildPreparationWorksheet,
} from "../functions/lib/preparation/model.js";
import "./styles/preparation.css";

// Reuses the project's 21st.dev Multi-step Wizard adaptation (demo 7821).
const STEPS = [
  { id: "route", label: "Route", title: "Start with your route.", description: "This prototype is for adult, non-business provincial nominees using the non-Express Entry process." },
  { id: "identity", label: "Applicant", title: "Your applicant details.", description: "Use your actual details. Answers brought from the assessment still need your confirmation." },
  { id: "history", label: "Family & history", title: "Build your personal record.", description: "Capture family notes and your own history. Full family-member forms are outside this prototype." },
  { id: "documents", label: "Documents", title: "Plan your documents.", description: "Track what you have. These reminders cover only part of the official checklist." },
  { id: "review", label: "Review", title: "Review your worksheet.", description: "Confirm the answers you checked, edit anything uncertain, then download a partial worksheet." },
];
const YES_NO = ["Yes", "No", "Not sure"];
const DATE_KNOWLEDGE = ["Known month", "Not sure"];
const END_KNOWLEDGE = ["Known month", "Current", "Not sure"];
const DOCUMENT_STATES = ["Not started", "Gathering", "Have a copy", "Not applicable", "Not sure"];
const ROW_OPTIONS = {
  relationship: ["Parent", "Sibling", "Spouse / Partner", "Child", "Other"],
  accompanying: ["Yes", "No", "Not applicable", "Not sure"],
  activity: ["Employment", "Self-employment", "Study", "Unemployed", "Retired", "Travel", "Other", "Not sure"],
  startKnowledge: DATE_KNOWLEDGE,
  endKnowledge: END_KNOWLEDGE,
};
const COLLECTION_HINTS = {
  family: "Include parents, siblings (including half and step siblings), your partner and all children, even if they are not coming with you. These notes do not complete IMM 5406.",
  addresses: "Add full residential addresses. Generally cover the last ten years or since age 18, whichever is more recent, without gaps.",
  activities: "Include work, study, unemployment and other activities without gaps. If you have not worked in the past ten years, include your personal history since age 18.",
  trips: "List your trips outside your country of origin or residence over the last ten years or since age 18, whichever is more recent. Month-level notes still need checking against the official form.",
};
const fieldId = path => `preparation-${path.replaceAll(".", "-")}`;
const atPath = (value, path) => path.split(".").reduce((current, key) => current[key], value);

function PreparationField({ path, label, draft, update, errors, options, choice = false, type = "text", hint, wide = false }) {
  const item = atPath(draft, path), id = fieldId(path), error = errors[path];
  const description = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const props = { id, name: path, value: item.value, "aria-invalid": Boolean(error) || undefined, "aria-describedby": description };
  return <div className={`assessment-field${wide ? " assessment-field--wide" : ""}`}>
    {choice ? <span className="assessment-label" id={`${id}-label`}>{label}</span> : <label className="assessment-label" htmlFor={id}>{label}</label>}
    {choice ? <AssessmentChoice id={id} value={item.value} options={options} onChange={value => update(path, value)} invalid={Boolean(error)} describedBy={description} />
      : options ? <AssessmentSelect {...props} options={options} onChange={event => update(path, event.target.value)} />
        : <input {...props} className="assessment-input" type={type} autoComplete="off" maxLength={type === "text" ? 300 : undefined} onChange={event => update(path, event.target.value)} />}
    {hint && <p className="assessment-hint" id={`${id}-hint`}>{hint}</p>}
    {item.source === "assessment" && <p className="assessment-hint">From your assessment · {item.confirmed ? "confirmed" : "please check"}</p>}
    {error && <p className="assessment-error" id={`${id}-error`}>{error}</p>}
  </div>;
}

function HistoryCollection({ collection, draft, update, setDraft, errors, nextId }) {
  const block = draft.history[collection], path = `history.${collection}`;
  const options = collection === "trips" ? ["Add entries", "Did not travel", "Not sure"] : ["Add entries", "Not sure"];
  return <section className="preparation-history-section" aria-labelledby={`preparation-${collection}-title`}>
    <h2 id={`preparation-${collection}-title`}>{COLLECTION_LABELS[collection]}</h2>
    <p className="preparation-copy">{COLLECTION_HINTS[collection]}</p>
    <PreparationField path={`${path}.answer`} label={collection === "trips" ? "Did you travel during this period?" : "What can you add?"} draft={draft} update={update} errors={errors} options={options} />
    {block.answer.value === "Add entries" && <>
      {block.rows.map((row, index) => <fieldset key={row.id} className="preparation-record">
        <legend>{COLLECTION_LABELS[collection]} · {index + 1}</legend>
        <div className="assessment-fields">
          {Object.entries(ROW_FIELDS[collection]).filter(([key]) => !(key === "from" && row.startKnowledge.value !== "Known month") && !(key === "to" && row.endKnowledge.value !== "Known month")).map(([key, label]) => <PreparationField
            key={key} path={`${path}.rows.${index}.${key}`} label={label} draft={draft} update={update} errors={errors}
            options={ROW_OPTIONS[key]} type={["from", "to"].includes(key) ? "month" : "text"}
            wide={["address", "details", "name"].includes(key)}
            hint={key === "startKnowledge" && collection !== "family" ? "Choose “Not sure” instead of estimating a date." : undefined} />)}
        </div>
        <Button variant="secondary" className="preparation-remove" onClick={() => setDraft(current => removePreparationRow(current, collection, row.id))} aria-label={`Remove ${COLLECTION_LABELS[collection].toLowerCase()} entry ${index + 1}`}>Remove entry</Button>
      </fieldset>)}
      <Button variant="secondary" className="preparation-add" onClick={() => setDraft(current => addPreparationRow(current, collection, `${collection}-${nextId.current++}`))}>Add {collection === "family" ? "person" : "entry"}</Button>
    </>}
    {block.answer.value !== "Add entries" && block.rows.length > 0 && <p className="assessment-hint">Your previous entries are kept in this session. They are excluded from the worksheet while this answer is selected.</p>}
  </section>;
}

function ReviewSection({ index, draft, setDraft, onEdit }) {
  const section = SECTION_KEYS[index];
  const reviewFact = (label, item, key) => <div key={key}><dt>{label}</dt><dd>{item.value || "Unanswered"}{!item.confirmed && <span className="preparation-unconfirmed">Not confirmed</span>}</dd></div>;
  return <section className="assessment-review-section preparation-review-section">
    <header><h2>{STEPS[index].label}</h2><Button variant="secondary" onClick={() => onEdit(index)} aria-label={`Edit ${STEPS[index].label}`}>Edit <ArrowRight size={13} aria-hidden="true" /></Button></header>
    {section === "history" ? <>
      <dl>{reviewFact("Worked during the past ten years", draft.history.workedPastTenYears, "worked")}</dl>
      {Object.entries(COLLECTION_LABELS).map(([key, label]) => <details className="preparation-review-details" key={key}>
        <summary>{label} <span>{draft.history[key].answer.value === "Add entries" ? `${draft.history[key].rows.length} entries` : draft.history[key].answer.value || "Unanswered"}</span></summary>
        <dl>{sectionFacts(draft, "history").filter(item => item.path.startsWith(`history.${key}.rows.`)).map(item => {
          const parts = item.path.split(".");
          return reviewFact(`${Number(parts[3]) + 1}. ${ROW_FIELDS[key][parts[4]]}`, item.fact, item.path);
        })}</dl>
      </details>)}
    </> : <dl>{Object.entries(section === "route" ? ROUTE_LABELS : section === "identity" ? IDENTITY_LABELS : Object.fromEntries(DOCUMENTS.map(item => [item.id, item.label]))).map(([key, label]) => reviewFact(label, draft[section][key], key))}</dl>}
    <label className="preparation-confirm"><input type="checkbox" checked={isSectionConfirmed(draft, section)} onChange={event => setDraft(current => confirmPreparationSection(current, section, event.target.checked))} /><span>I checked these answers. Any “Not sure” answers still need follow-up.</span></label>
  </section>;
}

export default function PreparationFlow({ assessmentProfile, onBack, backLabel = "Back to report" }) {
  const [draft, setDraft] = useState(() => createPreparationDraft(assessmentProfile));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [downloaded, setDownloaded] = useState(false);
  const heading = useRef(null);
  const nextId = useRef(1);
  const current = STEPS[step];
  const validations = SECTION_KEYS.map(section => validatePreparationSection(draft, section));
  const firstIncomplete = validations.findIndex(validation => Object.keys(validation).length > 0);
  const available = firstIncomplete === -1 ? 4 : firstIncomplete;
  const issues = preparationIssues(draft);
  const unsupported = Object.entries({ destination: "Canada", adult: "Yes", nominated: "Yes", process: "Non-Express Entry", business: "No" }).some(([key, expected]) => draft.route[key].value && draft.route[key].value !== expected);
  const update = (path, value) => {
    setDraft(currentDraft => updatePreparationFact(currentDraft, path, value));
    setErrors(previous => { const next = { ...previous }; delete next[path]; return next; });
    setDownloaded(false);
  };
  const goTo = index => {
    setStep(index); setErrors({});
    requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "start", behavior: "auto" }); });
  };
  const showErrors = (nextErrors, index) => {
    setStep(index); setErrors(nextErrors);
    requestAnimationFrame(() => document.getElementById(fieldId(Object.keys(nextErrors)[0]))?.focus());
  };
  const submit = event => {
    event.preventDefault();
    if (step < 4) {
      if (Object.keys(validations[step]).length) { showErrors(validations[step], step); return; }
      goTo(Math.min(step + 1, available));
      return;
    }
    if (firstIncomplete !== -1) { showErrors(validations[firstIncomplete], firstIncomplete); return; }
    const text = buildPreparationWorksheet(draft);
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "PathwayFinder-partial-preparation-worksheet.txt";
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  };
  const field = (path, label, extra = {}) => <PreparationField path={path} label={label} draft={draft} update={update} errors={errors} {...extra} />;
  return <div className="preparation-flow"><AssessmentShell onBack={onBack} backLabel={backLabel}>
    <div className="preparation-scope"><strong>Partial preparation worksheet</strong><p>Organize your notes for Canada’s non-Express Entry PNP. This does not fill official forms or determine eligibility.</p><p>Kept only while this page stays open. Refreshing clears your draft. No documents are uploaded.</p></div>
    <AssessmentStepper steps={STEPS} active={step} completed={validations.map(validation => !Object.keys(validation).length)} available={available} onSelect={goTo} />
    <form onSubmit={submit} noValidate>
      <div className="assessment-title"><h1 ref={heading} tabIndex={-1}>{current.title}</h1><p>{current.description}</p></div>
      {step === 0 && <>
        <div className="assessment-fields">
          {field("route.destination", <span className="preparation-country"><CountryFlag country="ca" /> Destination</span>, { options: ["Canada", "Other", "Not sure"], choice: true, wide: true })}
          {field("route.adult", "Are you the principal applicant, age 18 or older?", { options: YES_NO, choice: true, wide: true })}
          {field("route.nominated", "Have you received your provincial nomination?", { options: YES_NO, choice: true, wide: true })}
          {field("route.process", "Which process does your nomination confirm?", { options: ["Non-Express Entry", "Express Entry", "Not sure"], wide: true, hint: "Check your nomination confirmation. A nomination answer in the assessment does not establish this route." })}
          {field("route.business", "Is this a business or entrepreneur nomination?", { options: YES_NO, choice: true, wide: true })}
          {field("route.province", ROUTE_LABELS.province, { options: PROTOTYPE_PROVINCES, wide: true })}
          {field("route.stream", ROUTE_LABELS.stream, { wide: true })}
        </div>
        {unsupported && <div className="preparation-notice" role="status"><p>This worksheet does not cover this route or an unconfirmed route. This is not an eligibility decision.</p><Button variant="secondary" onClick={onBack}>{backLabel}</Button></div>}
      </>}
      {step === 1 && <div className="assessment-fields">
        {field("identity.fullName", IDENTITY_LABELS.fullName, { wide: true })}
        {field("identity.birthDate", IDENTITY_LABELS.birthDate, { type: "date", hint: "Use your actual date. An unknown date needs clarification before continuing." })}
        {field("identity.citizenship", IDENTITY_LABELS.citizenship, { hint: "List all citizenships, or write “Stateless” if applicable." })}
        {field("identity.residenceCountry", IDENTITY_LABELS.residenceCountry)}
        {field("identity.maritalStatus", IDENTITY_LABELS.maritalStatus, { options: ["Single", "Married", "Common-law", "Divorced", "Legally separated", "Widowed", "Annulled marriage", "Not sure"] })}
      </div>}
      {step === 2 && <div className="preparation-history">
        {field("history.workedPastTenYears", "Have you worked during the past ten years?", { options: YES_NO, choice: true, hint: "This determines how far back your personal history needs to go." })}
        {Object.keys(ROW_FIELDS).map(collection => <HistoryCollection key={collection} collection={collection} draft={draft} update={update} setDraft={setDraft} errors={errors} nextId={nextId} />)}
        <p className="preparation-copy">“Not sure” keeps information unresolved. It never becomes a guessed date or a “No” declaration.</p>
      </div>}
      {step === 3 && <>
        <div className="assessment-fields">{DOCUMENTS.map(item => <PreparationField key={item.id} path={`documents.${item.id}`} label={item.label} draft={draft} update={update} errors={errors} options={DOCUMENT_STATES} wide />)}</div>
        <p className="preparation-copy preparation-document-note">Copies are not checked here. Family circumstances, translations and country-specific instructions can add requirements. Review the <a href={PREPARATION_ROUTE.sources[0].url} target="_blank" rel="noreferrer">current IRCC instructions and IMM 0199 checklist</a>.</p>
      </>}
      {step === 4 && <div className="assessment-review">
        {SECTION_KEYS.map((section, index) => <ReviewSection key={section} index={index} draft={draft} setDraft={setDraft} onEdit={goTo} />)}
        <section className="preparation-open-questions"><h2>Remaining questions</h2>{issues.length ? <ul>{issues.map(issue => <li key={issue}>{issue}</li>)}</ul> : <p>No open questions detected in these limited fields. Official application coverage is still incomplete.</p>}</section>
        <details className="preparation-review-details"><summary>Coverage and official sources</summary>
          <p className="preparation-copy">Public guidance checked {PREPARATION_ROUTE.reviewedAt}. The authenticated portal and official PDFs have not been tested. No professional review has been completed.</p>
          <dl className="preparation-coverage">{PREPARATION_ROUTE.outputs.map(item => <div key={item.form}><dt>{item.form}</dt><dd>{item.coverage}</dd></div>)}</dl>
          <ul className="preparation-source-list">{PREPARATION_ROUTE.sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul>
        </details>
        <p className="preparation-copy">The download includes unresolved and unconfirmed answers. It is a text worksheet, not a complete application or official PDF.</p>
      </div>}
      {Object.keys(errors).length > 0 && <p className="assessment-validation" role="alert">Check the highlighted answers to continue.</p>}
      {downloaded && step === 4 && <p className="preparation-download-status" role="status">Your partial worksheet was downloaded.</p>}
      <footer className="assessment-actions">
        <Button variant="secondary" onClick={() => step === 0 ? onBack?.() : goTo(step - 1)}><ArrowLeft size={15} aria-hidden="true" /> Back</Button>
        <Button type="submit" disabled={step === 0 && unsupported}>{step === 4 ? "Download worksheet" : "Continue"}<ArrowRight size={15} aria-hidden="true" /></Button>
      </footer>
    </form>
    <p className="assessment-footnote">Independent preparation notes. Not affiliated with IRCC. Check the official instructions before filing.</p>
  </AssessmentShell></div>;
}
