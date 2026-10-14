import { useState, useEffect, useRef } from "react";
import DEV_CONFIG from "./dev.config.js";
import AssessmentFlow, { AssessmentReportPending, AssessmentReportError } from "./src/assessment_flow.jsx";
import CountryExperience from "./src/country-experience.jsx";
import PreparationFlow from "./src/preparation-flow.jsx";
import ReportView from "./src/report-view.jsx";
import { Button } from "./components/ui/button";
import { mapProfileForCRS } from "./functions/lib/assessment/profile.js";
import { validateAssessmentProfile } from "./functions/lib/assessment/validation.js";
import { parseReport, finalizeReport } from "./functions/lib/report.js";

// ============================================================
// SHARED: DISCLAIMER COMPONENTS
// ============================================================

function DisclaimerModal({ onAccept, onDecline }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current.showModal();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className="assessment-disclaimer" aria-labelledby="disclaimer-title" onCancel={onDecline}>
    <span className="eyebrow">YOUR CANADIAN CHAPTER</span>
    <h2 id="disclaimer-title">Before you begin.</h2>
    <p><strong>PathwayFinder is an independent informational tool.</strong> It is not affiliated with IRCC, any provincial program, or any government agency.</p>
    <p>Your assessment provides general information based on publicly available program data. It does not constitute immigration or legal advice, and does not guarantee eligibility or approval.</p>
    <p>Rules and circumstances change. Always verify current requirements and consult a licensed RCIC or immigration lawyer before making decisions. You remain responsible for decisions and actions based on this information.</p>
    <div className="disclaimer-actions"><Button variant="secondary" onClick={onDecline}>Go back</Button><Button onClick={onAccept}>I understand — continue →</Button></div>
  </dialog>;
}

// ============================================================
// AI ADVISORY LAYER
// ============================================================

// Direct Cloud Run URL — bypasses Firebase Hosting rewrite to avoid proxy timeouts
const ANALYZE_FUNCTION_URL = import.meta.env.VITE_ANALYZE_PROFILE_URL || "https://analyzeprofile-vxgeluq7dq-uc.a.run.app";

async function callAI(profile, breakdown, onRetry) {
  const MAX_RETRIES = 3;
  // Retain breakdown for old deployments during rollout; the v2 server ignores it.
  const body = JSON.stringify({ profile, breakdown });
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(ANALYZE_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (response.status === 502 && attempt < MAX_RETRIES) {
      if (onRetry) onRetry(attempt);
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || `Server error ${response.status}`);
    }
    const data = await response.json();
    return JSON.stringify(data);
  }
  throw new Error("Server unavailable after multiple attempts. Please try again.");
}

// The report lifecycle stays separate from its focused chapter presentation.
function ResultsPage({ report, breakdown, profile, onBack, onRestart, onPrepare, onReport }) {
  const [parsedReport, setParsedReport] = useState(() => {
    if (!report) return null;
    try {
      const parsed = parseReport(report);
      return finalizeReport(parsed, profile, { dataAsOf: parsed.assessment?.dataAsOf ?? null });
    } catch { return null; }
  });
  const [failed, setFailed] = useState(false);
  const requestStarted = useRef(false);

  useEffect(() => {
    if (parsedReport || requestStarted.current) return;
    requestStarted.current = true;
    // Keep one request per assessment revision, including StrictMode replays.
    // AssessmentPage retains this instance during edits and replaces it on submit.
    (async () => {
      try {
        const result = report || (DEV_CONFIG.enabled ? DEV_CONFIG.mockReport : await callAI(profile, breakdown));
        const parsed = parseReport(result);
        const normalized = finalizeReport(parsed, profile, { dataAsOf: parsed.assessment?.dataAsOf ?? null });
        setParsedReport(normalized);
        onReport?.(result);
      } catch { setFailed(true); }
    })();
  }, []);

  if (failed) return <AssessmentReportError onBack={onBack} />;
  if (!parsedReport) return <AssessmentReportPending onBack={onBack} />;
  return <ReportView report={parsedReport} profile={profile} breakdown={parsedReport.assessment.breakdown}
    onBack={onBack} onRestart={onRestart} onPrepare={onPrepare} />;
}

function AssessmentPage({ onBack, onPrepare }) {
  const [analysisState, setAnalysisState] = useState("form");
  const [assessmentRevision, setAssessmentRevision] = useState(0);
  const currentRevision = useRef(0);
  const [assessmentError, setAssessmentError] = useState(""); // "form" | "loading" | "results"
  const [report, setReport] = useState("");
  const [mappedProfile, setMappedProfile] = useState(null);
  const [formProfile, setFormProfile] = useState(null);
  const [breakdown, setBreakdown] = useState({});

  const restartAssessment = () => {
    window.scrollTo(0, 0);
    currentRevision.current += 1;
    setAnalysisState("form");
    setReport("");
    setMappedProfile(null);
    setFormProfile(null);
    setBreakdown({});
  };

  const handleComplete = (formProfile) => {
    setFormProfile(formProfile);
    window.scrollTo(0, 0);
    const mapped = mapProfileForCRS(formProfile);
    const validation = validateAssessmentProfile(mapped);
    if (validation.issues.length) {
      setAssessmentError(validation.issues.map(issue => issue.message).join(" "));
      return false;
    }
    const bd = validation.breakdown;
    setAssessmentError("");
    currentRevision.current += 1;
    setAssessmentRevision(currentRevision.current);
    setMappedProfile(validation.profile);
    setBreakdown(bd);
    setReport("");
    setAnalysisState("results");
  };

  return <>
    {analysisState === "form" && <>
      {assessmentError && <p role="alert" style={{ padding: 20, color: "#efafa8" }}>{assessmentError}</p>}
      <AssessmentFlow onComplete={handleComplete} onBack={onBack} initialProfile={formProfile} />
    </>}
    {mappedProfile && <div hidden={analysisState !== "results"}>
      <ResultsPage key={assessmentRevision} report={report} breakdown={breakdown} profile={mappedProfile}
        onBack={() => { setAnalysisState("form"); window.scrollTo(0, 0); }} onRestart={restartAssessment}
        onReport={result => { if (currentRevision.current === assessmentRevision) setReport(result); }}
        onPrepare={() => onPrepare(formProfile)} />
    </div>}
  </>;
}

// ============================================================
// MAIN APP — ROUTER
// ============================================================

export default function App() {
  const [page, setPage] = useState(DEV_CONFIG.enabled ? "assessment" : "landing");
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(DEV_CONFIG.enabled);
  const [assessmentStarted, setAssessmentStarted] = useState(DEV_CONFIG.enabled);
  const [preparationSession, setPreparationSession] = useState(null);
  const [preparationReturnTo, setPreparationReturnTo] = useState("landing");

  const openPreparation = (profile = null, returnTo = "landing") => {
    // One worksheet per tab session. Assessment edits never overwrite confirmed facts.
    setPreparationSession(current => current || { profile });
    setPreparationReturnTo(returnTo);
    setPage("preparation");
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (!document.querySelector('meta[name="viewport"]')) {
      const m = document.createElement("meta");
      m.name = "viewport";
      m.content = "width=device-width, initial-scale=1";
      document.head.appendChild(m);
    }
  }, []);

  const handleStart = () => {
    if (disclaimerAccepted) { setAssessmentStarted(true); setPage("assessment"); window.scrollTo(0, 0); }
    else { window.scrollTo(0, 0); setShowDisclaimer(true); }
  };

  const handleAccept = () => {
    setDisclaimerAccepted(true);
    setShowDisclaimer(false);
    setAssessmentStarted(true);
    setPage("assessment");
  };

  return (
    <>
      {showDisclaimer && <DisclaimerModal onAccept={handleAccept} onDecline={() => setShowDisclaimer(false)} />}
      {page === "landing" && <CountryExperience onStartCanada={handleStart} onOpenPreparation={() => openPreparation()} />}
      {assessmentStarted && <div className="dark-assessment" hidden={page !== "assessment"}><AssessmentPage
        onBack={() => { setPage("landing"); window.scrollTo(0, 0); }}
        onPrepare={profile => openPreparation(profile, "assessment")} /></div>}
      {preparationSession && <div className="dark-assessment" hidden={page !== "preparation"}><PreparationFlow
        assessmentProfile={preparationSession.profile}
        backLabel={preparationReturnTo === "assessment" ? "Back to report" : "Back to Canada"}
        onBack={() => { setPage(preparationReturnTo); window.scrollTo(0, 0); }} /></div>}
    </>
  );
}

