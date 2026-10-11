import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/ui/brand";
import { AssessmentChoice, AssessmentCombobox, AssessmentSelect, AssessmentStepper } from "@/components/ui/assessment-controls";
import {
  INITIAL_PROFILE, EDUCATION_OPTIONS, MARITAL_OPTIONS, ENGLISH_TESTS, SPOUSE_TESTS,
  FRENCH_TESTS, WORK_FOREIGN_OPTIONS, WORK_CANADIAN_OPTIONS, WORK_CANADIAN_SPOUSE_OPTIONS,
  TEER_OPTIONS, PROVINCES, PROVINCE_PREFERENCE, COUNTRIES, updateAssessmentProfile,
} from "./assessment-data";
import "./styles/assessment.css";

// Section validation and directional transitions adapted from 21st.dev MCP demo 7821:
// https://21st.dev/@dhileepkumargm/components/multi-step-wizard
const STEPS = [
  { id: "profile", label: "About you", title: "About you." },
  { id: "education", label: "Education", title: "Education." },
  { id: "language", label: "Language", title: "Language tests.", description: "Use the scores on your official test results." },
  { id: "work", label: "Experience", title: "Work experience." },
  { id: "canada", label: "Canada", title: "Connections to Canada." },
  { id: "plans", label: "Your plans", title: "Your plans." },
  { id: "review", label: "Review", title: "Review your profile.", description: "Check your answers before creating your report." },
];

const scoreNames = ["Reading", "Writing", "Listening", "Speaking"];
const scoreFields = (prefix, test) => scoreNames.map(label => ({
  key: prefix ? `${prefix}${label}` : label.toLowerCase(), label, type: "number", min: 0,
  step: test.startsWith("IELTS") ? 0.5 : 1,
  ...(test.startsWith("IELTS") ? { max: 9 } : test.startsWith("CELPIP") ? { min: 1, max: 12 } : {}),
}));

function getSections(profile) {
  const partner = ["Married", "Common-law"].includes(profile.maritalStatus);
  const accompanying = partner && profile.spouseAccompanying === "Yes";
  const spouseTest = accompanying && profile.spouseIsCitizenPR !== "Yes";
  const select = (key, label, options, extra = {}) => ({ key, label, options, type: "select", ...extra });
  const choice = (key, label, extra = {}) => ({ key, label, type: "choice", ...extra });
  const scores = (key, label, prefix, test, extra = {}) => ({ key, label, type: "scores", fields: scoreFields(prefix, test), wide: true, ...extra });
  return [
    [
      { key: "age", label: "Age", type: "number", min: 17, max: 65, placeholder: "Years" },
      { key: "dependentChildren", label: "Dependent children", type: "number", min: 0, max: 6, placeholder: "0" },
      select("maritalStatus", "Marital status", MARITAL_OPTIONS),
      { key: "citizenship", label: "Country of citizenship", type: "country" },
      ...(partner ? [choice("spouseAccompanying", "Will your partner come with you?", { wide: true })] : []),
      ...(accompanying ? [choice("spouseIsCitizenPR", "Is your partner a Canadian citizen or permanent resident?", { wide: true })] : []),
    ],
    [
      select("education", "Highest qualification", EDUCATION_OPTIONS, { wide: true }),
      choice("educationCountry", "Where did you study?", { options: ["In Canada", "Outside Canada"], wide: true }),
      ...(profile.educationCountry === "In Canada" ? [select("canadianEducationYears", "Length of study in Canada", ["1 year or less", "2 years", "3+ years (degree program)"], { wide: true })] : []),
      ...(profile.educationCountry === "Outside Canada" ? [choice("ecaObtained", "Do you have a credential assessment (ECA)?", { hint: "An ECA verifies the Canadian equivalency of your foreign qualification.", wide: true })] : []),
      ...(accompanying ? [select("spouseEducation", "Your partner’s highest qualification", EDUCATION_OPTIONS, { wide: true })] : []),
    ],
    [
      select("firstLangTest", "English test", ENGLISH_TESTS, { wide: true }),
      ...(profile.firstLangTest && profile.firstLangTest !== "No test yet" ? [scores("englishScores", "Your English scores", "", profile.firstLangTest, { hint: profile.firstLangTest.startsWith("IELTS") ? "IELTS: 0–9, in increments of 0.5." : profile.firstLangTest.startsWith("CELPIP") ? "CELPIP: 1–12 for each skill." : undefined })] : []),
      choice("hasSecondLang", "Have you taken a French test?", { wide: true }),
      ...(profile.hasSecondLang === "Yes" ? [select("secondLangTest", "French test", FRENCH_TESTS, { wide: true })] : []),
      ...(profile.hasSecondLang === "Yes" && profile.secondLangTest ? [scores("frenchScores", "Your French scores", "fr", profile.secondLangTest)] : []),
      ...(spouseTest ? [select("spouseLangTest", "Your partner’s English test", SPOUSE_TESTS, { wide: true })] : []),
      ...(spouseTest && profile.spouseLangTest && profile.spouseLangTest !== "No test" ? [scores("spouseScores", "Your partner’s scores", "spouse", profile.spouseLangTest)] : []),
    ],
    [
      select("foreignWorkYears", "Skilled work outside Canada", WORK_FOREIGN_OPTIONS),
      select("canadianWorkYears", "Skilled work in Canada", WORK_CANADIAN_OPTIONS),
      select("nocTeer", "Occupation level (NOC TEER)", TEER_OPTIONS, { wide: true, help: true }),
      ...(accompanying ? [select("spouseCanadianWorkYears", "Your partner’s work in Canada", WORK_CANADIAN_SPOUSE_OPTIONS, { wide: true })] : []),
    ],
    [
      choice("inCanada", "Are you currently in Canada?", { wide: true }),
      ...(profile.inCanada === "Yes" ? [select("currentProvince", "Current province or territory", PROVINCES, { wide: true })] : []),
      choice("siblingInCanada", "Sibling with Canadian citizenship or PR", { wide: true }),
      choice("provincialNomination", "Provincial nomination"),
      choice("hasJobOffer", "Valid Canadian job offer"),
      select("provincePreference", "Preferred province or territory", PROVINCE_PREFERENCE, { optional: true, placeholder: "Open to any", wide: true }),
    ],
    [
      { key: "settlementFunds", label: "Available settlement funds", type: "number", min: 0, step: 0.01, suffix: "CAD", placeholder: "20,000", hint: "Funds available for your move. We’ll compare this with your family size.", wide: true },
      choice("previousRefusals", "Previous visa refusals"),
      choice("criminalHistory", "Criminal history"),
      choice("openToStudy", "Would you consider studying in Canada?", { wide: true }),
    ],
  ];
}

function fieldError(field, profile) {
  const value = profile[field.key];
  if (field.optional) return "";
  if (value === "") return field.type === "number" ? "Enter a number." : "Choose an answer.";
  if (field.type === "number") {
    const number = Number(value);
    if (!Number.isFinite(number) || number < field.min || (field.max !== undefined && number > field.max)) {
      return field.max !== undefined ? `Enter a number from ${field.min} to ${field.max}.` : `Enter ${field.min} or more.`;
    }
    const step = field.step ?? 1;
    if (Math.abs(number / step - Math.round(number / step)) > 0.00001) return step === 1 ? "Use a whole number." : `Use increments of ${step}.`;
  }
  return "";
}

function sectionErrors(fields, profile) {
  return Object.fromEntries(fields.flatMap(field => field.fields || [field]).map(field => [field.key, fieldError(field, profile)]).filter(([, error]) => error));
}

function Field({ field, profile, update, errors }) {
  const id = `assessment-${field.key}`;
  const error = errors[field.key];
  const describedBy = [field.hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const props = { id, name: field.key, value: profile[field.key], "aria-invalid": !!error || undefined, "aria-describedby": describedBy };
  if (field.type === "scores") return <fieldset className="assessment-score-group assessment-field--wide">
    <legend>{field.label}</legend>
    <div className="assessment-score-grid">{field.fields.map(child => <Field key={child.key} field={child} profile={profile} update={update} errors={errors} />)}</div>
    {field.hint && <p className="assessment-hint">{field.hint}</p>}
  </fieldset>;
  return <div className={`assessment-field${field.wide ? " assessment-field--wide" : ""}`}>
    {field.type === "choice" ? <span className="assessment-label" id={`${id}-label`}>{field.label}</span> : <label className="assessment-label" htmlFor={id}>{field.label}{field.optional && <span>Optional</span>}</label>}
    {field.type === "select" ? <AssessmentSelect {...props} options={field.options} placeholder={field.placeholder} onChange={event => update(field.key, event.target.value)} />
      : field.type === "choice" ? <AssessmentChoice id={id} value={profile[field.key]} onChange={value => update(field.key, value)} options={field.options} invalid={!!error} describedBy={describedBy} />
      : field.type === "country" ? <AssessmentCombobox {...props} options={COUNTRIES} placeholder="Search country" onChange={value => update(field.key, value)} />
      : <div className={field.suffix ? "assessment-input-affix" : undefined}>
        <input {...props} className="assessment-input" type="number" min={field.min} max={field.max} step={field.step ?? 1} inputMode={field.step && field.step < 1 ? "decimal" : "numeric"} placeholder={field.placeholder ?? "0"} onChange={event => update(field.key, event.target.value)} />
        {field.suffix && <span>{field.suffix}</span>}
      </div>}
    {field.hint && <p className="assessment-hint" id={`${id}-hint`}>{field.hint}</p>}
    {error && <p className="assessment-error" id={`${id}-error`}>{error}</p>}
    {field.help && <details className="assessment-help"><summary>Find your TEER level <ChevronDown size={13} aria-hidden="true" /></summary>
      <dl><div><dt>0</dt><dd>Management</dd></div><div><dt>1</dt><dd>Professional roles, such as engineers and doctors</dd></div><div><dt>2</dt><dd>Technical roles and skilled trades</dd></div><div><dt>3</dt><dd>Roles such as bakers and dental assistants</dd></div><div><dt>4 / 5</dt><dd>Other occupations, including labour roles</dd></div></dl>
      <p>Choose “Not sure” if you don’t know your classification.</p>
    </details>}
  </div>;
}

function Review({ sections, profile, onEdit }) {
  const value = field => field.key === "settlementFunds" ? `${Number(profile[field.key]).toLocaleString()} CAD` : profile[field.key] || "Open to any";
  return <div className="assessment-review">{sections.map((fields, index) => <section className="assessment-review-section" key={STEPS[index].id}>
    <header><h2>{STEPS[index].label}</h2><Button variant="secondary" onClick={() => onEdit(index)} aria-label={`Edit ${STEPS[index].label}`}>Edit <ArrowRight size={13} aria-hidden="true" /></Button></header>
    <dl>{fields.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.fields ? field.fields.map(child => `${child.label}: ${profile[child.key]}`).join(" · ") : value(field)}</dd></div>)}</dl>
  </section>)}</div>;
}

export function AssessmentShell({ children, onBack, backLabel = "Exit assessment" }) {
  return <div className="assessment-shell">
    <header className="assessment-header"><a href="/?country=ca" onClick={event => { event.preventDefault(); onBack?.(); }} className="assessment-wordmark"><Brand /></a>
      <Button variant="secondary" onClick={onBack}><ArrowLeft size={14} aria-hidden="true" /> {backLabel}</Button>
    </header>
    <div className="assessment-layout">
      <aside className="assessment-photo"><img src="/images/canada.jpg" alt="Toronto skyline and the CN Tower beside Lake Ontario" /><div><h2>Canada.</h2></div></aside>
      <main className="assessment-main">{children}</main>
    </div>
  </div>;
}

export function AssessmentReportPending({ onBack }) {
  return <AssessmentShell onBack={onBack} backLabel="Back to profile"><div className="assessment-report-pending" role="status">
    <p className="assessment-kicker">PROFILE COMPLETE</p><h1>Finding your pathways.</h1>
    <p>We’re preparing your score breakdown and personalized report. This can take about two minutes.</p>
    <div className="assessment-loading-track" role="progressbar" aria-label="Preparing your pathway report"><span /></div>
    <small>Keep this page open while your report is being prepared.</small>
  </div></AssessmentShell>;
}

export function AssessmentReportError({ onBack }) {
  return <AssessmentShell onBack={onBack} backLabel="Back to profile"><div className="assessment-report-pending" role="alert">
    <h1>We couldn’t create your report.</h1>
    <p>Your answers are still here. Return to your profile and try creating the report again.</p>
    <Button onClick={onBack}>Back to my profile <ArrowRight size={15} aria-hidden="true" /></Button>
  </div></AssessmentShell>;
}

export default function AssessmentFlow({ onComplete, onBack, initialProfile }) {
  const [profile, setProfile] = useState(() => ({ ...INITIAL_PROFILE, ...initialProfile }));
  const [step, setStep] = useState(initialProfile ? 6 : 0);
  const [errors, setErrors] = useState({});
  const [direction, setDirection] = useState(1);
  const [editing, setEditing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const heading = useRef(null);
  const sectionTop = useRef(null);
  const focusNext = useRef(false);
  const reducedMotion = useReducedMotion();
  const sections = getSections(profile);
  const completed = sections.map(fields => Object.keys(sectionErrors(fields, profile)).length === 0);
  const firstIncomplete = completed.findIndex(done => !done);
  const available = firstIncomplete === -1 ? 6 : firstIncomplete;
  const current = STEPS[step];

  useEffect(() => {
    if (focusNext.current) {
      heading.current?.focus({ preventScroll: true });
      sectionTop.current?.scrollIntoView({ block: "start", behavior: "instant" });
      focusNext.current = false;
    }
  }, [step]);

  const update = (key, value) => {
    setProfile(prev => {
      const next = updateAssessmentProfile(prev, key, value);
      // Scores from a different exam aren't interchangeable.
      const prefix = key === "firstLangTest" ? "" : key === "secondLangTest" ? "fr" : key === "spouseLangTest" ? "spouse" : null;
      if (prefix !== null && prev[key] !== value) scoreFields(prefix, value).forEach(field => { next[field.key] = ""; });
      return next;
    });
    setErrors(prev => ({ ...prev, [key]: "" }));
  };
  const goTo = index => {
    if (index === step) return;
    setDirection(index > step ? 1 : -1);
    setErrors({});
    focusNext.current = true;
    setStep(index);
  };
  const focusError = nextErrors => {
    requestAnimationFrame(() => document.getElementById(`assessment-${Object.keys(nextErrors)[0]}`)?.focus());
  };
  const handleSubmit = event => {
    event.preventDefault();
    if (submitted) return;
    if (step === 6) {
      if (firstIncomplete !== -1) {
        const nextErrors = sectionErrors(sections[firstIncomplete], profile);
        goTo(firstIncomplete);
        setErrors(nextErrors);
        focusError(nextErrors);
        return;
      }
      setSubmitted(true);
      onComplete?.(profile);
      return;
    }
    const nextErrors = sectionErrors(sections[step], profile);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { focusError(nextErrors); return; }
    if (editing) {
      if (firstIncomplete === -1) { setEditing(false); goTo(6); }
      else { goTo(firstIncomplete); }
    } else goTo(step + 1);
  };

  return <AssessmentShell onBack={onBack}>
    <div ref={sectionTop} className="assessment-section-top">
      <AssessmentStepper steps={STEPS} active={step} completed={completed} available={available} onSelect={index => { setEditing(false); goTo(index); }} />
    </div>
    <form className="assessment-form" noValidate onSubmit={handleSubmit}>
      <motion.div key={current.id} initial={reducedMotion ? false : { opacity: 0, x: direction * 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
        <div className="assessment-title"><h1 ref={heading} tabIndex={-1}>{current.title}</h1>{current.description && <p>{current.description}</p>}</div>
        {step === 6 ? <Review sections={sections} profile={profile} onEdit={index => { setEditing(true); goTo(index); }} />
          : <div className="assessment-fields">{sections[step].map(field => <Field key={field.key} field={field} profile={profile} update={update} errors={errors} />)}</div>}
      </motion.div>
      {Object.values(errors).some(Boolean) && <p className="assessment-validation" role="alert">Check the highlighted answers to continue.</p>}
      <footer className="assessment-actions">
        <Button variant="secondary" onClick={() => step === 0 ? onBack?.() : goTo(step - 1)}><ArrowLeft size={15} aria-hidden="true" /> Back</Button>
        <Button type="submit" disabled={submitted}>{step === 6 ? "Create my report" : editing ? "Save changes" : "Continue"}<ArrowRight size={15} aria-hidden="true" /></Button>
      </footer>
    </form>
    <p className="assessment-footnote">Independent guidance. Not affiliated with IRCC. <span>For information, not legal advice.</span></p>
  </AssessmentShell>;
}
