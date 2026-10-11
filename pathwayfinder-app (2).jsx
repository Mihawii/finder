import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import DEV_CONFIG from "./dev.config.js";
import AssessmentFlow, { AssessmentReportPending, AssessmentReportError } from "./src/assessment_flow.jsx";
import CountryExperience from "./src/country-experience.jsx";

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return width;
}

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
    <div className="disclaimer-actions"><button onClick={onDecline}>Go back</button><button onClick={onAccept}>I understand — continue →</button></div>
  </dialog>;
}

// ============================================================
// DATA LAYER
// ============================================================

const SETTLEMENT_FUNDS = [
  { family_size: 1, amount: 15263 }, { family_size: 2, amount: 19001 },
  { family_size: 3, amount: 23360 }, { family_size: 4, amount: 28362 },
  { family_size: 5, amount: 32168 }, { family_size: 6, amount: 36280 },
  { family_size: 7, amount: 40392 },
];

const CRS_AGE = [
  [17,0,0],[18,99,90],[19,105,95],[20,110,100],[21,110,100],[22,110,100],[23,110,100],
  [24,110,100],[25,110,100],[26,110,100],[27,110,100],[28,110,100],[29,110,100],
  [30,105,95],[31,99,90],[32,94,85],[33,88,80],[34,83,75],[35,77,70],[36,72,65],
  [37,66,60],[38,61,55],[39,55,50],[40,50,45],[41,39,35],[42,28,25],[43,17,15],[44,6,5],
];

const CRS_EDUCATION = [
  { level: "phd", label: "PhD", single: 150, spouse: 140 },
  { level: "masters", label: "Master's / professional degree", single: 135, spouse: 126 },
  { level: "two_plus", label: "Two or more credentials (one 3+ yr)", single: 128, spouse: 119 },
  { level: "bachelors", label: "Bachelor's degree (3+ yr)", single: 120, spouse: 112 },
  { level: "two_year", label: "2-year post-secondary", single: 98, spouse: 91 },
  { level: "one_year", label: "1-year post-secondary", single: 90, spouse: 84 },
  { level: "high_school", label: "High school diploma", single: 30, spouse: 28 },
  { level: "below_hs", label: "Less than high school", single: 0, spouse: 0 },
];

const CRS_FIRST_LANG = [
  { clb: 10, single: 34, spouse: 32 }, { clb: 9, single: 31, spouse: 29 },
  { clb: 8, single: 23, spouse: 22 }, { clb: 7, single: 17, spouse: 16 },
  { clb: 6, single: 9, spouse: 8 }, { clb: 5, single: 6, spouse: 6 },
  { clb: 4, single: 0, spouse: 0 },
];

const CRS_SECOND_LANG = [
  { clb: 9, single: 6, spouse: 6 }, { clb: 8, single: 3, spouse: 3 },
  { clb: 7, single: 3, spouse: 3 }, { clb: 6, single: 1, spouse: 1 },
  { clb: 5, single: 1, spouse: 1 }, { clb: 4, single: 0, spouse: 0 },
];

const CRS_CAN_WORK = [
  { years: 5, single: 80, spouse: 70 }, { years: 4, single: 72, spouse: 64 },
  { years: 3, single: 64, spouse: 56 }, { years: 2, single: 53, spouse: 46 },
  { years: 1, single: 40, spouse: 35 }, { years: 0, single: 0, spouse: 0 },
];

const SPOUSE_EDU = [
  { level: "phd", pts: 10 }, { level: "masters", pts: 10 },
  { level: "two_plus", pts: 9 }, { level: "bachelors", pts: 8 },
  { level: "two_year", pts: 7 }, { level: "one_year", pts: 6 },
  { level: "high_school", pts: 2 }, { level: "below_hs", pts: 0 },
];

const SPOUSE_LANG = [
  { clb: 9, pts: 5 }, { clb: 8, pts: 3 }, { clb: 7, pts: 3 },
  { clb: 6, pts: 1 }, { clb: 5, pts: 1 }, { clb: 4, pts: 0 },
];

const SPOUSE_CAN_WORK = [
  { years: 5, pts: 10 }, { years: 4, pts: 10 }, { years: 3, pts: 9 },
  { years: 2, pts: 8 }, { years: 1, pts: 5 }, { years: 0, pts: 0 },
];

const IELTS_TO_CLB = [
  { clb: 10, r: 8.0, w: 7.5, l: 8.5, s: 7.5 },
  { clb: 9, r: 7.0, w: 7.0, l: 8.0, s: 7.0 },
  { clb: 8, r: 6.5, w: 6.5, l: 7.5, s: 6.5 },
  { clb: 7, r: 6.0, w: 6.0, l: 6.0, s: 6.0 },
  { clb: 6, r: 5.0, w: 5.5, l: 5.5, s: 5.5 },
  { clb: 5, r: 4.0, w: 5.0, l: 5.0, s: 5.0 },
  { clb: 4, r: 3.5, w: 4.0, l: 4.5, s: 4.0 },
];

const PTE_TO_CLB = [
  { clb: 10, r: 88, w: 90, l: 89, s: 89 },
  { clb: 9, r: 78, w: 88, l: 82, s: 84 },
  { clb: 8, r: 69, w: 79, l: 71, s: 76 },
  { clb: 7, r: 60, w: 69, l: 60, s: 68 },
  { clb: 6, r: 51, w: 60, l: 50, s: 59 },
  { clb: 5, r: 42, w: 51, l: 39, s: 51 },
  { clb: 4, r: 33, w: 41, l: 28, s: 42 },
];

const TEF_TO_CLB = [
  { clb: 10, r: 263, w: 393, l: 316, s: 393 },
  { clb: 9, r: 248, w: 371, l: 298, s: 371 },
  { clb: 8, r: 233, w: 349, l: 280, s: 349 },
  { clb: 7, r: 207, w: 310, l: 249, s: 310 },
  { clb: 6, r: 181, w: 271, l: 217, s: 271 },
  { clb: 5, r: 151, w: 226, l: 181, s: 226 },
  { clb: 4, r: 121, w: 181, l: 145, s: 181 },
];

const TCF_TO_CLB = [
  { clb: 10, r: 549, w: 16, l: 549, s: 16 },
  { clb: 9, r: 524, w: 14, l: 523, s: 14 },
  { clb: 8, r: 499, w: 12, l: 503, s: 12 },
  { clb: 7, r: 453, w: 10, l: 458, s: 10 },
  { clb: 6, r: 406, w: 7, l: 398, s: 7 },
  { clb: 5, r: 375, w: 6, l: 369, s: 6 },
  { clb: 4, r: 342, w: 4, l: 331, s: 4 },
];

// ============================================================
// LANGUAGE CONVERSION
// ============================================================

function tableToClb(table, score, ability) {
  const s = parseFloat(score);
  if (isNaN(s)) return 0;
  const key = ability === "reading" ? "r" : ability === "writing" ? "w" : ability === "listening" ? "l" : "s";
  for (const row of table) { if (s >= row[key]) return row.clb; }
  return 3;
}

function celpipToClb(score) {
  const s = parseFloat(score);
  if (isNaN(s)) return 0;
  if (s >= 10) return 10;
  return s >= 4 ? Math.floor(s) : 3;
}

function convertToClb(test, scores) {
  if (test === "clb_direct") return { reading: parseInt(scores.reading) || 0, writing: parseInt(scores.writing) || 0, listening: parseInt(scores.listening) || 0, speaking: parseInt(scores.speaking) || 0 };
  if (test === "ielts") return { reading: tableToClb(IELTS_TO_CLB, scores.reading, "reading"), writing: tableToClb(IELTS_TO_CLB, scores.writing, "writing"), listening: tableToClb(IELTS_TO_CLB, scores.listening, "listening"), speaking: tableToClb(IELTS_TO_CLB, scores.speaking, "speaking") };
  if (test === "celpip") return { reading: celpipToClb(scores.reading), writing: celpipToClb(scores.writing), listening: celpipToClb(scores.listening), speaking: celpipToClb(scores.speaking) };
  if (test === "pte") return { reading: tableToClb(PTE_TO_CLB, scores.reading, "reading"), writing: tableToClb(PTE_TO_CLB, scores.writing, "writing"), listening: tableToClb(PTE_TO_CLB, scores.listening, "listening"), speaking: tableToClb(PTE_TO_CLB, scores.speaking, "speaking") };
  if (test === "tef") return { reading: tableToClb(TEF_TO_CLB, scores.reading, "reading"), writing: tableToClb(TEF_TO_CLB, scores.writing, "writing"), listening: tableToClb(TEF_TO_CLB, scores.listening, "listening"), speaking: tableToClb(TEF_TO_CLB, scores.speaking, "speaking") };
  if (test === "tcf") return { reading: tableToClb(TCF_TO_CLB, scores.reading, "reading"), writing: tableToClb(TCF_TO_CLB, scores.writing, "writing"), listening: tableToClb(TCF_TO_CLB, scores.listening, "listening"), speaking: tableToClb(TCF_TO_CLB, scores.speaking, "speaking") };
  return { reading: 0, writing: 0, listening: 0, speaking: 0 };
}

// ============================================================
// CRS CALCULATOR ENGINE
// ============================================================

function calcCRS(profile) {
  const hasPartner = profile.maritalStatus === "married" || profile.maritalStatus === "common_law";
  const useSpouseColumn = hasPartner && profile.spouseAccompanying && !profile.spouseIsCitizenPR;
  const col = useSpouseColumn ? "spouse" : "single";
  const breakdown = {};
  const age = parseInt(profile.age) || 0;
  if (age >= 45 || age <= 17) breakdown.age = 0;
  else { const row = CRS_AGE.find(r => r[0] === age); breakdown.age = row ? row[col === "single" ? 1 : 2] : 0; }

  const eduRow = CRS_EDUCATION.find(e => e.level === profile.education);
  breakdown.education = eduRow ? eduRow[col] : 0;

  const clbScores = profile.clb || { reading: 0, writing: 0, listening: 0, speaking: 0 };
  let langPts = 0;
  ["reading", "writing", "listening", "speaking"].forEach(ab => {
    const clb = clbScores[ab] || 0;
    const row = CRS_FIRST_LANG.find(r => clb >= r.clb) || { [col]: 0 };
    langPts += row[col] || 0;
  });
  breakdown.firstLanguage = langPts;

  let lang2Pts = 0;
  if (profile.hasSecondLang && profile.clb2) {
    ["reading", "writing", "listening", "speaking"].forEach(ab => {
      const clb = profile.clb2[ab] || 0;
      const row = CRS_SECOND_LANG.find(r => clb >= r.clb) || { [col]: 0 };
      lang2Pts += row[col] || 0;
    });
  }
  breakdown.secondLanguage = Math.min(lang2Pts, col === "spouse" ? 22 : 24);

  const canYears = parseInt(profile.canadianWorkYears) || 0;
  const canRow = CRS_CAN_WORK.find(r => canYears >= r.years) || { [col]: 0 };
  breakdown.canadianWork = canRow[col] || 0;

  let spousePts = 0;
  if (useSpouseColumn) {
    const spEduRow = SPOUSE_EDU.find(e => e.level === profile.spouseEducation);
    let spLang = 0;
    if (profile.spouseClb) { ["reading", "writing", "listening", "speaking"].forEach(ab => { const clb = profile.spouseClb[ab] || 0; const row = SPOUSE_LANG.find(r => clb >= r.clb) || { pts: 0 }; spLang += row.pts; }); }
    const spCanYears = parseInt(profile.spouseCanadianWorkYears) || 0;
    const spCanRow = SPOUSE_CAN_WORK.find(r => spCanYears >= r.years) || { pts: 0 };
    spousePts = (spEduRow ? spEduRow.pts : 0) + spLang + spCanRow.pts;
  }
  breakdown.spouse = spousePts;

  const minClb = Math.min(clbScores.reading || 0, clbScores.writing || 0, clbScores.listening || 0, clbScores.speaking || 0);
  const eduLevel = profile.education;
  const isP2 = ["phd", "masters", "two_plus", "bachelors", "two_year"].includes(eduLevel);
  const isP1 = eduLevel === "one_year";
  let elp = isP2 && minClb >= 9 ? 50 : isP2 && minClb >= 7 ? 25 : isP1 && minClb >= 9 ? 25 : isP1 && minClb >= 7 ? 13 : 0;
  let ecp = isP2 && canYears >= 2 ? 50 : isP2 && canYears >= 1 ? 25 : isP1 && canYears >= 2 ? 25 : isP1 && canYears >= 1 ? 13 : 0;
  const fy = parseInt(profile.foreignWorkYears) || 0;
  let fwlp = fy >= 3 && minClb >= 9 ? 50 : fy >= 3 && minClb >= 7 ? 25 : fy >= 1 && minClb >= 9 ? 25 : fy >= 1 && minClb >= 7 ? 13 : 0;
  let fwcp = fy >= 3 && canYears >= 2 ? 50 : fy >= 3 && canYears >= 1 ? 25 : fy >= 1 && canYears >= 2 ? 25 : fy >= 1 && canYears >= 1 ? 13 : 0;
  breakdown.skillTransfer = Math.min(Math.min(elp, 50) + Math.min(ecp, 50) + Math.min(fwlp, 50) + Math.min(fwcp, 50), 100);

  let addPts = 0;
  if (profile.provincialNomination) addPts += 600;
  if (profile.canadianEducationYears >= 3) addPts += 30; else if (profile.canadianEducationYears >= 1) addPts += 15;
  if (profile.siblingInCanada) addPts += 15;
  if (profile.hasSecondLang && profile.clb2) {
    const frMin = Math.min(profile.clb2.reading || 0, profile.clb2.writing || 0, profile.clb2.listening || 0, profile.clb2.speaking || 0);
    if (frMin >= 7 && minClb >= 5) addPts += 50; else if (frMin >= 7) addPts += 25;
  }
  breakdown.additional = Math.min(addPts, 600);

  breakdown.total = breakdown.age + breakdown.education + breakdown.firstLanguage + breakdown.secondLanguage + breakdown.canadianWork + breakdown.spouse + breakdown.skillTransfer + breakdown.additional;
  return breakdown;
}

// ============================================================
// FORM COMPONENTS
// ============================================================

const STEPS = [
  { id: "personal", label: "Personal", icon: "👤" },
  { id: "education", label: "Education", icon: "🎓" },
  { id: "language", label: "Language", icon: "💬" },
  { id: "work", label: "Work", icon: "💼" },
  { id: "connections", label: "Ties", icon: "🔗" },
  { id: "status", label: "Status", icon: "📋" },
];

const initialProfile = {
  age: "", maritalStatus: "single", spouseAccompanying: false, spouseIsCitizenPR: false, dependentChildren: 0, citizenship: "", currentCountry: "",
  education: "", fieldOfStudy: "", educationCountry: "", canadianCredential: false, ecaObtained: false,
  firstLangTest: "ielts", firstLangScores: { reading: "", writing: "", listening: "", speaking: "" },
  hasSecondLang: false, secondLangTest: "tef", secondLangScores: { reading: "", writing: "", listening: "", speaking: "" },
  foreignWorkYears: "", canadianWorkYears: "", primaryNoc: "", nocTeer: "",
  inCanada: false, currentProvince: "", currentWorkPermitType: "", monthsWithEmployer: "",
  siblingInCanada: false, previousCanadianEducation: false, canadianEducationYears: 0,
  previousCanadianWork: false, provincePreference: "", settlementFunds: "", provincialNomination: false,
  hasJobOffer: false, spouseEducation: "below_hs",
  spouseClbScores: { reading: "", writing: "", listening: "", speaking: "" },
  spouseCanadianWorkYears: "0", spouseLangTest: "ielts",
  previousRefusals: false, criminalHistory: false, medicalConditions: false, quebecIntent: false,
  openToStudy: false, openToAnyProvince: false,
};
// (Old form components removed — see git history for StepPersonal, StepEducation, etc.)

// ============================================================
// AI ADVISORY LAYER
// ============================================================

// Direct Cloud Run URL — bypasses Firebase Hosting rewrite to avoid proxy timeouts
const ANALYZE_FUNCTION_URL = "https://analyzeprofile-vxgeluq7dq-uc.a.run.app";

async function callAI(profile, breakdown, onRetry) {
  const MAX_RETRIES = 3;
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
      throw new Error(err.message || `Server error ${response.status}`);
    }
    const data = await response.json();
    console.log("[PathwayFinder] callAI response — has raw:", !!data.raw, "type of data:", typeof data, "keys:", typeof data === "object" ? Object.keys(data).slice(0, 5) : "N/A");
    if (data.raw) {
      console.log("[PathwayFinder] returning data.raw, type:", typeof data.raw, "first 200:", String(data.raw).substring(0, 200));
      return data.raw;
    }
    const str = JSON.stringify(data);
    console.log("[PathwayFinder] returning JSON.stringify(data), length:", str.length, "first 200:", str.substring(0, 200));
    return str;
  }
  throw new Error("Server unavailable after multiple attempts. Please try again.");
}

// ============================================================
// TOOLTIP COMPONENT
// ============================================================

const TOOLTIP_MAP = {
  CRS: "Comprehensive Ranking System — Canada's scoring system for Express Entry candidates. Score out of 1,200.",
  CLB: "Canadian Language Benchmark — Canada's standard for measuring language ability. CLB 7 ≈ IELTS 6.0",
  CEC: "Canadian Experience Class — an Express Entry program for people with Canadian work experience",
  FSW: "Federal Skilled Worker — an Express Entry program for skilled workers with foreign experience",
  FST: "Federal Skilled Trades — an Express Entry program for people with trades qualifications",
  PNP: "Provincial Nominee Program — provinces can nominate candidates, adding 600 CRS points",
  AAIP: "Alberta Advantage Immigration Program — Alberta's provincial nominee program",
  OINP: "Ontario Immigrant Nominee Program — Ontario's provincial nominee program",
  SINP: "Saskatchewan Immigrant Nominee Program",
  MPNP: "Manitoba Provincial Nominee Program",
  AIP: "Atlantic Immigration Program — for employers in Canada's Atlantic provinces",
  ECA: "Educational Credential Assessment — proves your foreign degree is equivalent to a Canadian one",
  ITA: "Invitation to Apply — if your CRS is high enough, IRCC invites you to apply for permanent residency",
  PGWP: "Post-Graduation Work Permit — allows international graduates to work in Canada after studying",
  TEER: "Training, Education, Experience and Responsibilities — Canada's job classification system (TEER 0-5)",
  NOC: "National Occupational Classification — Canada's system for categorizing jobs",
  LMIA: "Labour Market Impact Assessment — a document an employer needs to hire a foreign worker",
  IRCC: "Immigration, Refugees and Citizenship Canada — the federal department that manages immigration",
  RCIC: "Regulated Canadian Immigration Consultant — a licensed professional who can give immigration advice",
  EE: "Express Entry — Canada's online system for managing applications for permanent residence",
  NCLC: "Niveaux de compétence linguistique canadiens — the French equivalent of CLB",
  PR: "Permanent Residence / Permanent Resident",
};

const CHANCE_TOOLTIPS = { high: "Strong match — you meet most or all requirements and your profile is competitive", moderate: "Moderate match — competitive but may need improvements or the program has limited spots", low: "Possible but challenging — you have gaps to fill or the program is uncertain", veryLow: "Low chance currently — significant changes needed to be competitive" };
const STATUS_TOOLTIPS = { active: "This program is currently accepting applications with regular draws", limited: "This program has few spots, infrequent draws, or restricted eligibility", changing: "This program is undergoing redesign or restructuring — requirements may change", requires_action: "You need to take specific steps before you can apply to this program" };

function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: true });
  const ref = { current: null };
  const handleEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ top: rect.top > 120 });
    setShow(true);
  };
  return (
    <span style={{ position: "relative", display: "inline", cursor: "help", borderBottom: "1px dotted #4ade8088" }}
      onMouseEnter={handleEnter} onMouseLeave={() => setShow(false)}
      onClick={(e) => { e.stopPropagation(); setShow(prev => !prev); }}>
      {children}
      {show && (
        <span style={{ position: "absolute", [pos.top ? "bottom" : "top"]: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "#211d1e", border: "1px solid #634148", color: "#e8f5ee", fontSize: 12, lineHeight: 1.5, padding: "8px 12px", borderRadius: 8, maxWidth: 280, width: "max-content", zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", animation: "fadeSlideIn 0.15s ease-out", pointerEvents: "none" }}>
          <span style={{ position: "absolute", [pos.top ? "bottom" : "top"]: -5, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 8, height: 8, background: "#211d1e", borderRight: pos.top ? "1px solid #634148" : "none", borderBottom: pos.top ? "1px solid #634148" : "none", borderLeft: pos.top ? "none" : "1px solid #634148", borderTop: pos.top ? "none" : "1px solid #634148" }} />
          {text}
        </span>
      )}
    </span>
  );
}

function TT({ term, children }) {
  const tip = TOOLTIP_MAP[term || children];
  if (!tip) return children || term;
  return <Tooltip text={tip}>{children || term}</Tooltip>;
}

// Auto-wrap known acronyms in text with tooltips
function TooltipText({ children }) {
  if (typeof children !== "string") return children;
  const pattern = new RegExp(`\\b(${Object.keys(TOOLTIP_MAP).join("|")})\\b`, "g");
  const parts = [];
  let last = 0;
  let match;
  const seen = new Set();
  while ((match = pattern.exec(children)) !== null) {
    if (match.index > last) parts.push(children.slice(last, match.index));
    const term = match[1];
    if (!seen.has(term)) {
      parts.push(<Tooltip key={match.index} text={TOOLTIP_MAP[term]}>{term}</Tooltip>);
      seen.add(term);
    } else {
      parts.push(term);
    }
    last = pattern.lastIndex;
  }
  if (last < children.length) parts.push(children.slice(last));
  return <>{parts}</>;
}

// ============================================================
// WHAT-IF SCORE SIMULATOR
// ============================================================

function WhatIfSimulator({ profile, breakdown, mounted }) {
  const isMobile = useWindowWidth() < 768;
  const hasPartner = (profile.maritalStatus === "married" || profile.maritalStatus === "common_law") && profile.spouseAccompanying && !profile.spouseIsCitizenPR;
  const minClb = profile.clb ? Math.min(profile.clb.reading || 0, profile.clb.writing || 0, profile.clb.listening || 0, profile.clb.speaking || 0) : 0;
  const canYears = parseInt(profile.canadianWorkYears) || 0;

  const scenarios = useMemo(() => {
    const s = [];
    if (minClb < 9) s.push({ id: "ielts9", label: "I improve English to CLB 9+ all abilities", apply: (p) => { p.clb = { reading: 10, writing: 10, listening: 10, speaking: 10 }; } });
    if (canYears < 1) s.push({ id: "canwork1", label: "I get 1 year Canadian work experience", apply: (p) => { p.canadianWorkYears = "1"; } });
    if (!profile.hasSecondLang || !profile.clb2 || Math.min(profile.clb2.reading || 0, profile.clb2.writing || 0, profile.clb2.listening || 0, profile.clb2.speaking || 0) < 7) {
      s.push({ id: "french7", label: "I learn French to NCLC 7", apply: (p) => { p.hasSecondLang = true; p.clb2 = { reading: 7, writing: 7, listening: 7, speaking: 7 }; } });
    }
    if (!profile.provincialNomination) s.push({ id: "pnp", label: "I get a provincial nomination", apply: (p) => { p.provincialNomination = true; } });
    if (hasPartner && profile.spouseClb) {
      const spMin = Math.min(profile.spouseClb.reading || 0, profile.spouseClb.writing || 0, profile.spouseClb.listening || 0, profile.spouseClb.speaking || 0);
      if (spMin < 9) s.push({ id: "spouse9", label: "My spouse improves to CLB 9+", apply: (p) => { p.spouseClb = { reading: 9, writing: 9, listening: 9, speaking: 9 }; } });
    }
    return s;
  }, [profile]);

  const [toggles, setToggles] = useState({});
  const simScore = useMemo(() => {
    const p = { ...profile };
    Object.keys(toggles).forEach(id => {
      if (toggles[id]) {
        const sc = scenarios.find(s => s.id === id);
        if (sc) sc.apply(p);
      }
    });
    return calcCRS(p);
  }, [profile, toggles, scenarios]);

  const diff = simScore.total - breakdown.total;
  const anyActive = Object.values(toggles).some(v => v);

  const thresholds = [
    { label: "CEC", min: 508 }, { label: "French draws", min: 397 },
    { label: "Healthcare", min: 400 }, { label: "STEM", min: 480 }, { label: "Trade", min: 350 },
  ];

  return (
    <div>
      <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#e8f5ee", fontFamily: "'Playfair Display', serif" }}>What If? Score Simulator</h3>
      <p style={{ fontSize: 13, color: "#8fb5a0", margin: "0 0 20px" }}>See how your score changes with different scenarios</p>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {scenarios.map(sc => (
          <div key={sc.id} onClick={() => setToggles(prev => ({ ...prev, [sc.id]: !prev[sc.id] }))}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, cursor: "pointer", border: `1px solid ${toggles[sc.id] ? "#4ade80" : "#1e3a2e"}`, background: toggles[sc.id] ? "#14532d" : "#0a1612", transition: "all 0.2s" }}>
            <div style={{ width: 36, height: 20, borderRadius: 10, background: toggles[sc.id] ? "#4ade80" : "#1e3a2e", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
              <div style={{ width: 16, height: 16, borderRadius: 8, background: "#151515", position: "absolute", top: 2, left: toggles[sc.id] ? 18 : 2, transition: "left 0.2s" }} />
            </div>
            <span style={{ fontSize: 13, color: toggles[sc.id] ? "#e8f5ee" : "#8fb5a0" }}>{sc.label}</span>
          </div>
        ))}
      </div>
      {anyActive && (
        <div style={{ padding: 20, background: "linear-gradient(135deg, #14532d, #1e3a2e)", borderRadius: 12, border: "1px solid #4ade8033", animation: "fadeSlideIn 0.3s ease-out" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: "#fb923c" }}>{breakdown.total}</span>
            <span style={{ fontSize: 20, color: "#8fb5a0" }}>→</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 800, color: "#4ade80" }}>{simScore.total}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 700, color: "#4ade80" }}>(+{diff})</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {thresholds.map(t => {
              const wasBelow = breakdown.total < t.min;
              const nowAbove = simScore.total >= t.min;
              return (
                <span key={t.label} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 4, background: nowAbove ? "#14532d" : "#7f1d1d33", color: nowAbove ? "#4ade80" : "#f8717188", fontWeight: 600 }}>
                  {nowAbove ? "✓" : "✗"} {t.label} ({t.min})
                  {wasBelow && nowAbove && <span style={{ color: "#4ade80", marginLeft: 4 }}>NEW!</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================================
// RESULTS PAGE
// ============================================================

function ResultsPage({
  report,
  breakdown,
  profile,
  onBack,
  onRestart,
  calcCRS,
}) {
  console.log("[PathwayFinder] ResultsPage render — report type:", typeof report, "report is empty:", report === "", "report length:", typeof report === "string" ? report.length : "N/A");
  const [parsedReport, setParsedReport] = useState(null);
  const [rawFallback, setRawFallback] = useState("");
  const [expandedPathway, setExpandedPathway] = useState(0);
  const [visibleSections, setVisibleSections] = useState({
    top: true, profile: true, crs: true, losses: true, opps: true,
    projected: true, pathways: true, sim: true, compare: true,
    plan: true, costs: true, timeline: true, share: true
  });
  const [reportReady, setReportReady] = useState(false);
  const [simulatorState, setSimulatorState] = useState({
    improveIelts: false,
    canadianWork: false,
    french: false,
    nomination: false,
    spouseLanguage: false,
  });
  const [pdfGenerating, setPdfGenerating] = useState(false);
  // TEMP: promo gate bypassed for beta testing — revert before launch
  const [unlocked, setUnlocked] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [aiState, setAiState] = useState("idle"); // "idle" | "loading" | "done" | "error"
  const [aiReport, setAiReport] = useState(null); // stores AI result locally after promo unlock
  const reportContentRef = useRef(null);
  const reportRequestStarted = useRef(false);

  const sectionRefs = useRef([]);

  useEffect(() => {
    if (aiState === "loading") { setReportReady(false); return; }
    if (aiState === "done" || aiState === "error") {
      // Report arrived — brief beat before swapping the loading screen for the report.
      const t = setTimeout(() => setReportReady(true), 600);
      return () => clearTimeout(t);
    }
  }, [aiState]);

  // TEMP: promo gate bypassed for beta testing — auto-trigger AI call on mount
  useEffect(() => {
    if (unlocked && aiState === "idle" && !aiReport && !reportRequestStarted.current) {
      // StrictMode replays mount effects in development; generate once per report.
      reportRequestStarted.current = true;
      setAiState("loading");
      (async () => {
        try {
          let result;
          if (DEV_CONFIG.enabled) {
            await new Promise(r => setTimeout(r, 900));
            result = DEV_CONFIG.mockReport;
          } else {
            result = await callAI(profile, breakdown);
          }
          setAiReport(result);
          setAiState("done");
        } catch (err) {
          setAiReport("Sorry, we couldn't generate your report right now. Please try again in a moment.\n\nError: " + err.message);
          setAiState("error");
        }
      })();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Use aiReport (from promo unlock) if available, otherwise fall back to report prop
    const activeReport = aiReport !== null ? aiReport : report;

    if (activeReport === null || activeReport === undefined || activeReport === "") {
      setParsedReport(null);
      setRawFallback("");
      return;
    }

    if (typeof activeReport === "object") {
      setParsedReport(activeReport);
      setRawFallback("");
      return;
    }

    if (typeof activeReport === "string") {
      // Try to parse, with cleanup for AI responses that have prefix text or truncation
      const tryParse = (str) => {
        // Strip anything before first { and after last }
        let cleaned = str;
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
        return JSON.parse(cleaned);
      };

      // Repair truncated JSON by closing open strings, arrays, and objects
      const repairTruncated = (str) => {
        let s = str;
        const firstBrace = s.indexOf("{");
        if (firstBrace !== -1) s = s.substring(firstBrace);
        // Remove any trailing incomplete string value
        s = s.replace(/,\s*"[^"]*":\s*"[^"]*$/, "");
        s = s.replace(/,\s*"[^"]*":\s*$/, "");
        s = s.replace(/,\s*\{[^}]*$/, "");
        s = s.replace(/,\s*"[^"]*$/, "");
        // Count open brackets and braces, close them
        let openBraces = 0, openBrackets = 0, inString = false, escape = false;
        for (let i = 0; i < s.length; i++) {
          const c = s[i];
          if (escape) { escape = false; continue; }
          if (c === "\\") { escape = true; continue; }
          if (c === '"') { inString = !inString; continue; }
          if (inString) continue;
          if (c === "{") openBraces++;
          if (c === "}") openBraces--;
          if (c === "[") openBrackets++;
          if (c === "]") openBrackets--;
        }
        // If we're inside a string, close it
        if (inString) s += '"';
        for (let i = 0; i < openBrackets; i++) s += "]";
        for (let i = 0; i < openBraces; i++) s += "}";
        return JSON.parse(s);
      };

      try {
        const parsed = tryParse(activeReport);
        console.log("[PathwayFinder] Parse SUCCESS, keys:", Object.keys(parsed));
        setParsedReport(parsed);
        setRawFallback("");
      } catch (e) {
        console.warn("[PathwayFinder] Initial parse failed:", e.message, "— attempting truncation repair");
        try {
          const repaired = repairTruncated(activeReport);
          // Truncation repair fired — the AI response was incomplete (likely hit max_tokens).
          // Surface it loudly instead of silently dropping trailing fields.
          console.warn(
            "[PathwayFinder] ⚠ TRUNCATION REPAIR FIRED — AI JSON was incomplete and auto-closed; trailing fields may be missing. Missing expected fields:",
            ["pathways", "actionPlan", "costs", "timeline", "dataDisclaimer"].filter((k) => !(k in repaired))
          );
          console.log("[PathwayFinder] Repair SUCCESS, keys:", Object.keys(repaired));
          setParsedReport(repaired);
          setRawFallback("");
        } catch (e2) {
          console.error("[PathwayFinder] Repair also failed:", e2.message);
          setParsedReport(null);
          setRawFallback(activeReport);
        }
      }
      return;
    }

    setParsedReport(null);
    setRawFallback(String(activeReport));
  }, [report, aiReport]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const key = entry.target.getAttribute("data-section");
            setVisibleSections((prev) => ({ ...prev, [key]: true }));
          }
        });
      },
      { threshold: 0.12 }
    );

    sectionRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [parsedReport]);

  const addSectionRef = (el, index) => {
    sectionRefs.current[index] = el;
  };

  const safeReport = parsedReport || {};
  const safeProfile = profile || {};
  const safeBreakdown = breakdown || {};

  const topPathway = useMemo(() => {
    const items = Array.isArray(safeReport.pathways) ? safeReport.pathways : [];
    if (!items.length) return null;
    return [...items].sort((a, b) => (a?.rank || 999) - (b?.rank || 999))[0];
  }, [safeReport.pathways]);

  useEffect(() => {
    if (topPathway) setExpandedPathway(0);
  }, [topPathway]);

  const loading = aiState === "loading" && !reportReady;

  const categoryCutoffs = [
    { label: "CEC", min: 507, max: 511 },
    { label: "French", min: 393, max: 400 },
    { label: "Healthcare", min: 467, max: 467 },
    { label: "Senior Mgrs", min: 429, max: 429 },
    { label: "PNP", min: 710, max: 789 },
    { label: "Trade", min: 350, max: 400 },
  ];

  const summaryCards = useMemo(() => {
    const total = safeReport?.crs?.total ?? safeBreakdown?.total ?? 0;
    const bestName = topPathway?.name || "Not available";
    const confidence =
      typeof topPathway?.chance === "number"
        ? `${topPathway.chance}%`
        : topPathway?.chance || "—";
    const insight = safeReport?.crs?.keyInsight || "Your report highlights the most realistic pathways based on your profile.";

    return [
      { label: "CRS Score", value: total || "—", tone: "default" },
      { label: "Best Pathway", value: bestName, tone: "default" },
      { label: "Top Match", value: confidence, tone: "positive" },
      { label: "Key Insight", value: insight, tone: "wide" },
    ];
  }, [safeReport, safeBreakdown, topPathway]);

  const breakdownItems = [
    { label: "Age", value: safeBreakdown.age || 0, max: 110 },
    { label: "Education", value: safeBreakdown.education || 0, max: 150 },
    { label: "First Language", value: safeBreakdown.firstLanguage || 0, max: 160 },
    { label: "Second Language", value: safeBreakdown.secondLanguage || 0, max: 50 },
    { label: "Canadian Work", value: safeBreakdown.canadianWork || 0, max: 80 },
    { label: "Spouse", value: safeBreakdown.spouse || 0, max: 40 },
    { label: "Skill Transfer", value: safeBreakdown.skillTransfer || 0, max: 100 },
    { label: "Additional", value: safeBreakdown.additional || 0, max: 600 },
  ];

  const safeLosses = Array.isArray(safeReport?.scoreAnalysis?.losses)
    ? safeReport.scoreAnalysis.losses
    : [];
  const safeOpportunities = Array.isArray(safeReport?.scoreAnalysis?.opportunities)
    ? [...safeReport.scoreAnalysis.opportunities].sort((a, b) => (b?.pointsGain || 0) - (a?.pointsGain || 0))
    : [];
  const safePathways = Array.isArray(safeReport?.pathways)
    ? [...safeReport.pathways].sort((a, b) => (a?.rank || 999) - (b?.rank || 999)).slice(0, 5)
    : [];
  const safeActionPlan = Array.isArray(safeReport?.actionPlan) ? safeReport.actionPlan : [];
  const safeTimeline = Array.isArray(safeReport?.timeline) ? safeReport.timeline : [];
  const costItems = Array.isArray(safeReport?.costs?.items) ? safeReport.costs.items : [];

  const formatMoney = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "string") return value;
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusStyle = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized.includes("active")) {
      return { background: "#151515", color: "#9fceb4" };
    }
    if (normalized.includes("limited")) {
      return { background: "#211c16", color: "#d9b888" };
    }
    if (normalized.includes("changing")) {
      return { background: "#282018", color: "#e2b786" };
    }
    if (normalized.includes("action")) {
      return { background: "#18202b", color: "#9bbce9" };
    }
    return { background: "#1b1e24", color: "#c1c8d2" };
  };

  const getPriorityStyle = (priority) => {
    const normalized = String(priority || "").toLowerCase();
    if (normalized.includes("urgent")) return { background: "#2c1919", color: "#ee9991" };
    if (normalized.includes("high")) return { background: "#282018", color: "#e2b786" };
    return { background: "#18202b", color: "#9bbce9" };
  };

  const simulatorOptions = useMemo(() => {
    const marital = String(safeProfile?.maritalStatus || safeProfile?.marital || "").toLowerCase();
    const hasSpouse = marital.includes("married") || marital.includes("common") || !!safeProfile?.hasSpouse;
    const canadianWorkYears = Number(safeProfile?.canadianWorkExperience || safeProfile?.canadianWorkYears || 0);

    return [
      { key: "improveIelts", label: "I improve IELTS to CLB 9+ all abilities", show: true },
      { key: "canadianWork", label: "I get 1 year Canadian work experience", show: canadianWorkYears < 1 },
      { key: "french", label: "I learn French to CLB 7", show: true },
      { key: "nomination", label: "I get a provincial nomination", show: true },
      { key: "spouseLanguage", label: "My spouse improves language scores", show: hasSpouse },
    ].filter((item) => item.show);
  }, [safeProfile]);

  const simulatedProfile = useMemo(() => {
    const next = JSON.parse(JSON.stringify(safeProfile));

    if (simulatorState.improveIelts) {
      // Set CLB 9+ on all abilities (calcCRS reads from profile.clb)
      next.clb = { reading: 10, writing: 10, listening: 10, speaking: 10 };
      // Also update raw scores so re-conversion won't overwrite
      next.firstLangTest = "clb_direct";
      next.firstLangScores = { reading: "10", writing: "10", listening: "10", speaking: "10" };
    }
    if (simulatorState.canadianWork) {
      next.canadianWorkYears = String(Math.max(1, Number(next.canadianWorkYears || 0)));
    }
    if (simulatorState.french) {
      next.hasSecondLang = true;
      next.clb2 = { reading: 7, writing: 7, listening: 7, speaking: 7 };
      next.secondLangTest = "clb_direct";
      next.secondLangScores = { reading: "7", writing: "7", listening: "7", speaking: "7" };
    }
    if (simulatorState.nomination) {
      next.provincialNomination = true;
    }
    if (simulatorState.spouseLanguage) {
      next.spouseClb = { reading: 9, writing: 9, listening: 9, speaking: 9 };
      next.spouseLangTest = "clb_direct";
      next.spouseClbScores = { reading: "9", writing: "9", listening: "9", speaking: "9" };
    }

    return next;
  }, [safeProfile, simulatorState]);

  const simulatedScore = useMemo(() => {
    const current = safeReport?.crs?.total ?? safeBreakdown?.total ?? 0;

    if (typeof calcCRS === "function") {
      try {
        const result = calcCRS(simulatedProfile);
        if (typeof result === "number") return result;
        if (typeof result?.total === "number") return result.total;
      } catch {
        return current;
      }
    }

    let projected = current;
    if (simulatorState.improveIelts) projected += 40;
    if (simulatorState.canadianWork) projected += 53;
    if (simulatorState.french) projected += 24;
    if (simulatorState.nomination) projected += 600;
    if (simulatorState.spouseLanguage) projected += 20;
    return projected;
  }, [calcCRS, simulatedProfile, safeReport, safeBreakdown, simulatorState]);

  // Calculate projected score by adding realistic opportunity gains (exclude PNP +600)
  const projectedScore = (() => {
    const current = safeReport?.crs?.total ?? safeBreakdown?.total ?? 0;
    const totalGain = safeOpportunities
      .filter((item) => (item?.pointsGain || 0) < 500)
      .reduce((sum, item) => sum + (item?.pointsGain || 0), 0);
    const raw = totalGain > 0 ? current + totalGain : simulatedScore;
    // Safety cap: projected score should never exceed current + 200
    return Math.min(raw, current + 200);
  })();

  const shareSummary = () => {
    const summaryText = [
      `PathwayFinder Report`,
      `CRS Score: ${safeReport?.crs?.total ?? safeBreakdown?.total ?? "—"}`,
      `Best Pathway: ${topPathway?.name || "Not available"}`,
      `Top Match: ${typeof topPathway?.chance === "number" ? `${topPathway?.chance}%` : topPathway?.chance || "—"}`,
      `Key Insight: ${safeReport?.crs?.keyInsight || "—"}`,
    ].join("\n");

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(summaryText);
    }
  };

  const handleDownloadPdf = async () => {
    if (pdfGenerating) return;
    setPdfGenerating(true);
    try {
      const response = await fetch('https://us-central1-pathwayfinder-3b040.cloudfunctions.net/generatePdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: parsedReport,
          breakdown: breakdown
        })
      });
      if (!response.ok) throw new Error('PDF generation failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'PathwayFinder-Report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[PathwayFinder] PDF download failed:', err);
      alert('PDF download failed. Please try again.');
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleUnlock = async () => {
    if (promoLoading) return;
    setPromoError("");
    setPromoLoading(true);
    try {
      const response = await fetch('https://us-central1-pathwayfinder-3b040.cloudfunctions.net/validatePromoCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode })
      });
      const data = await response.json();
      if (data.valid) {
        setUnlocked(true);
        setPromoLoading(false);
        setAiState("loading");
        // Trigger AI call
        try {
          let result;
          if (DEV_CONFIG.enabled) {
            await new Promise(r => setTimeout(r, 900));
            result = DEV_CONFIG.mockReport;
          } else {
            result = await callAI(profile, breakdown);
          }
          setAiReport(result);
          setAiState("done");
        } catch (err) {
          setAiReport("Sorry, we couldn't generate your report right now. Please try again in a moment.\n\nError: " + err.message);
          setAiState("error");
        }
      } else {
        setPromoError("Invalid code. Please check and try again.");
        setPromoLoading(false);
      }
    } catch {
      setPromoError("Something went wrong. Please try again.");
      setPromoLoading(false);
    }
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#090909",
      color: "#eeede8",
      fontFamily: "'Manrope', 'Segoe UI', sans-serif",
      overflowX: "hidden",
    },
    container: {
      width: "100%",
      maxWidth: "1180px",
      margin: "0 auto",
      padding: "0 20px",
      boxSizing: "border-box",
    },
    header: {
      position: "sticky",
      top: 0,
      zIndex: 20,
      background: "rgba(9,9,9,0.94)",
      backdropFilter: "blur(8px)",
      borderBottom: "1px solid rgba(220,210,200,0.10)",
    },
    headerInner: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "20px",
      padding: "20px 0",
    },
    brand: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    brandMark: {
      width: "40px",
      height: "40px",
      borderRadius: "12px",
      background: "#a83f49",
      color: "#FFFFFF",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      fontWeight: 800,
      boxShadow: "0 10px 20px rgba(190,95,105,0.18)",
    },
    brandTitle: {
      fontSize: "18px",
      fontWeight: 800,
      color: "#eeede8",
      lineHeight: 1.1,
      margin: 0,
    },
    brandSub: {
      fontSize: "13px",
      color: "#aaa7a1",
      margin: "4px 0 0",
    },
    buttonRow: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: "12px",
    },
    primaryBtn: {
      minHeight: "46px",
      borderRadius: "999px",
      border: "none",
      background: "#a83f49",
      color: "#FFFFFF",
      padding: "0 18px",
      fontWeight: 800,
      cursor: "pointer",
      boxShadow: "0 12px 24px rgba(190,95,105,0.18)",
      transition: "transform 180ms ease, box-shadow 180ms ease, background 180ms ease",
    },
    secondaryBtn: {
      minHeight: "46px",
      borderRadius: "999px",
      border: "1px solid rgba(220,210,200,0.16)",
      background: "#151515",
      color: "#eeede8",
      padding: "0 18px",
      fontWeight: 800,
      cursor: "pointer",
      transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
    },
    section: {
      padding: "34px 0",
    },
    card: {
      background: "#151515",
      border: "1px solid rgba(220,210,200,0.12)",
      borderRadius: "24px",
      boxShadow: "0 18px 34px rgba(20,33,27,0.06)",
      padding: "24px",
    },
    sectionTitle: {
      fontFamily: "'Instrument Serif', Georgia, serif",
      fontSize: "clamp(2rem, 4vw, 3rem)",
      lineHeight: 1.02,
      color: "#eeede8",
      margin: "0 0 10px",
    },
    sectionLead: {
      fontSize: "15px",
      lineHeight: 1.7,
      color: "#aaa7a1",
      margin: "0 0 24px",
      maxWidth: "760px",
    },
    summaryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: "14px",
    },
    summaryCard: {
      background: "#151515",
      border: "1px solid rgba(220,210,200,0.12)",
      borderRadius: "24px",
      boxShadow: "0 16px 28px rgba(20,33,27,0.05)",
      padding: "20px",
      minHeight: "122px",
    },
    label: {
      fontSize: "12px",
      color: "#aaa7a1",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      fontWeight: 800,
      marginBottom: "10px",
    },
    summaryValue: {
      fontSize: "28px",
      fontWeight: 800,
      color: "#eeede8",
      lineHeight: 1.2,
    },
    summaryWide: {
      fontSize: "15px",
      lineHeight: 1.65,
      color: "#c5c2ba",
      fontWeight: 600,
    },
    twoCol: {
      display: "grid",
      gridTemplateColumns: "1.1fr 0.9fr",
      gap: "18px",
      alignItems: "start",
    },
    splitList: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px",
      marginTop: "20px",
    },
    listBox: {
      borderRadius: "20px",
      padding: "18px",
      border: "1px solid rgba(220,210,200,0.08)",
    },
    listTitle: {
      fontSize: "18px",
      fontWeight: 800,
      margin: "0 0 12px",
    },
    listItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      fontSize: "14px",
      lineHeight: 1.65,
      color: "#c5c2ba",
      marginBottom: "10px",
    },
    scoreHero: {
      display: "grid",
      gridTemplateColumns: "280px 1fr",
      gap: "18px",
      alignItems: "start",
    },
    scoreCard: {
      background: "linear-gradient(180deg, #151515 0%, #151515 100%)",
      border: "1px solid rgba(220,210,200,0.12)",
      borderRadius: "24px",
      padding: "24px",
      minHeight: "220px",
      boxShadow: "0 18px 34px rgba(20,33,27,0.06)",
    },
    scoreNumber: {
      fontFamily: "'Instrument Serif', Georgia, serif",
      fontSize: "82px",
      lineHeight: 0.9,
      color: "#eeede8",
      margin: "4px 0 0",
      fontVariantNumeric: "tabular-nums",
    },
    mono: {
      fontVariantNumeric: "tabular-nums",
    },
    barsWrap: {
      display: "grid",
      gap: "12px",
    },
    barRow: {
      display: "grid",
      gridTemplateColumns: "120px 1fr 42px",
      gap: "12px",
      alignItems: "center",
    },
    barTrack: {
      width: "100%",
      height: "10px",
      background: "#151515",
      borderRadius: "999px",
      overflow: "hidden",
    },
    barFill: (width) => ({
      width: `${Math.max(0, Math.min(100, width))}%`,
      height: "100%",
      borderRadius: "999px",
      background: "linear-gradient(90deg, #a83f49 0%, #d77b84 100%)",
      transition: "width 900ms cubic-bezier(0.2, 0.8, 0.2, 1)",
    }),
    cutoffWrap: {
      display: "grid",
      gap: "10px",
      marginTop: "24px",
    },
    cutoffRow: {
      display: "grid",
      gridTemplateColumns: "90px 1fr 50px",
      gap: "12px",
      alignItems: "center",
    },
    cutoffTrack: {
      position: "relative",
      width: "100%",
      height: "12px",
      borderRadius: "999px",
      background: "#151515",
      overflow: "hidden",
    },
    cutoffRange: (left, width) => ({
      position: "absolute",
      left: `${left}%`,
      width: `${width}%`,
      top: 0,
      bottom: 0,
      borderRadius: "999px",
      background: "rgba(82,183,136,0.45)",
    }),
    cutoffMarker: (position) => ({
      position: "absolute",
      left: `calc(${position}% - 7px)`,
      top: "50%",
      width: "14px",
      height: "14px",
      borderRadius: "999px",
      background: "#242021",
      border: "2px solid #FFFFFF",
      transform: "translateY(-50%)",
      boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
    }),
    tableCard: {
      overflowX: "auto",
    },
    lossTable: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "720px",
    },
    th: {
      textAlign: "left",
      fontSize: "12px",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: "#aaa7a1",
      padding: "0 0 14px",
      borderBottom: "1px solid rgba(220,210,200,0.10)",
    },
    td: {
      fontSize: "14px",
      color: "#c5c2ba",
      lineHeight: 1.6,
      padding: "16px 0",
      borderBottom: "1px solid rgba(220,210,200,0.08)",
      verticalAlign: "top",
    },
    badge: (bg, color) => ({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "28px",
      padding: "0 10px",
      borderRadius: "999px",
      background: bg,
      color,
      fontSize: "12px",
      fontWeight: 800,
      whiteSpace: "nowrap",
    }),
    opportunitiesGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "16px",
    },
    opportunityCard: {
      position: "relative",
      background: "linear-gradient(180deg, #151515 0%, #151515 100%)",
      border: "1px solid rgba(220,210,200,0.12)",
      borderRadius: "24px",
      padding: "22px",
      boxShadow: "0 18px 34px rgba(20,33,27,0.06)",
      minHeight: "240px",
    },
    plusNumber: {
      fontFamily: "'Instrument Serif', Georgia, serif",
      fontSize: "54px",
      color: "#e09a9f",
      lineHeight: 0.9,
      margin: 0,
      fontVariantNumeric: "tabular-nums",
    },
    highlightBanner: {
      background: "linear-gradient(135deg, #171314 0%, #242021 100%)",
      color: "#F7FBF8",
      borderRadius: "28px",
      padding: "28px",
      boxShadow: "0 22px 46px rgba(22,56,44,0.18)",
    },
    pathwaysGrid: {
      display: "grid",
      gap: "16px",
    },
    pathwayCard: {
      background: "#151515",
      border: "1px solid rgba(220,210,200,0.12)",
      borderRadius: "24px",
      boxShadow: "0 18px 34px rgba(20,33,27,0.06)",
      overflow: "hidden",
    },
    pathwayHead: {
      padding: "22px 22px 18px",
    },
    pathwayTop: {
      display: "grid",
      gridTemplateColumns: "auto 1fr auto",
      gap: "14px",
      alignItems: "start",
    },
    rankBadge: {
      width: "42px",
      height: "42px",
      borderRadius: "999px",
      background: "#151515",
      color: "#eeede8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      flexShrink: 0,
    },
    pathwayName: {
      fontSize: "24px",
      fontWeight: 800,
      color: "#eeede8",
      lineHeight: 1.2,
      margin: 0,
    },
    streamText: {
      fontSize: "13px",
      color: "#aaa7a1",
      marginTop: "6px",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
    pathwayMetaRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      alignItems: "center",
      marginTop: "14px",
    },
    pathwayStats: {
      display: "grid",
      gridTemplateColumns: "1fr 180px",
      gap: "16px",
      alignItems: "center",
      marginTop: "18px",
    },
    progressWrap: {
      display: "grid",
      gap: "10px",
    },
    whyBox: {
      marginTop: "18px",
      border: "1px solid rgba(220,210,200,0.12)",
      borderRadius: "18px",
      background: "#151515",
      padding: "14px 16px",
    },
    checklist: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "10px 16px",
      marginTop: "18px",
    },
    checklistItem: {
      display: "flex",
      gap: "8px",
      alignItems: "flex-start",
      fontSize: "14px",
      lineHeight: 1.6,
      color: "#c5c2ba",
    },
    accordionBtn: {
      width: "100%",
      border: "none",
      borderTop: "1px solid rgba(220,210,200,0.08)",
      background: "#151515",
      padding: "16px 22px",
      textAlign: "left",
      fontWeight: 800,
      color: "#eeede8",
      cursor: "pointer",
    },
    accordionBody: {
      padding: "0 22px 22px",
      borderTop: "1px solid rgba(220,210,200,0.08)",
      background: "#151515",
    },
    simulatorGrid: {
      display: "grid",
      gridTemplateColumns: "0.95fr 1.05fr",
      gap: "18px",
      alignItems: "start",
    },
    toggleList: {
      display: "grid",
      gap: "12px",
    },
    toggleRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "14px",
      padding: "14px 16px",
      borderRadius: "18px",
      border: "1px solid rgba(220,210,200,0.10)",
      background: "#151515",
    },
    toggle: (active) => ({
      width: "52px",
      height: "30px",
      borderRadius: "999px",
      border: "none",
      cursor: "pointer",
      position: "relative",
      background: active ? "#a83f49" : "#383331",
      transition: "background 180ms ease",
      flexShrink: 0,
    }),
    toggleKnob: (active) => ({
      position: "absolute",
      top: "4px",
      left: active ? "26px" : "4px",
      width: "22px",
      height: "22px",
      borderRadius: "999px",
      background: "#151515",
      transition: "left 180ms ease",
      boxShadow: "0 3px 8px rgba(0,0,0,0.12)",
    }),
    compareTable: {
      minWidth: "860px",
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: 0,
    },
    compareCell: {
      padding: "14px 16px",
      fontSize: "14px",
      color: "#c5c2ba",
      borderBottom: "1px solid rgba(220,210,200,0.08)",
      verticalAlign: "top",
      background: "#151515",
    },
    stepGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "16px",
    },
    actionCard: {
      background: "#151515",
      border: "1px solid rgba(220,210,200,0.12)",
      borderRadius: "24px",
      boxShadow: "0 18px 34px rgba(20,33,27,0.06)",
      padding: "22px",
      minHeight: "220px",
    },
    costGrid: {
      display: "grid",
      gap: "14px",
    },
    costRow: {
      display: "grid",
      gridTemplateColumns: "180px 1fr 100px",
      gap: "12px",
      alignItems: "center",
    },
    costTrack: {
      width: "100%",
      height: "12px",
      borderRadius: "999px",
      background: "#151515",
      overflow: "hidden",
    },
    costFill: (width) => ({
      width: `${width}%`,
      height: "100%",
      borderRadius: "999px",
      background: "linear-gradient(90deg, #a83f49 0%, #d77b84 100%)",
    }),
    timelineWrap: {
      position: "relative",
      display: "grid",
      gap: "16px",
      paddingLeft: "24px",
    },
    timelineLine: {
      position: "absolute",
      left: "8px",
      top: "6px",
      bottom: "6px",
      width: "2px",
      background: "#3a3432",
    },
    timelineItem: {
      position: "relative",
      background: "#151515",
      border: "1px solid rgba(220,210,200,0.12)",
      borderRadius: "22px",
      boxShadow: "0 16px 28px rgba(20,33,27,0.05)",
      padding: "18px 18px 18px 22px",
    },
    timelineDot: {
      position: "absolute",
      left: "-23px",
      top: "24px",
      width: "14px",
      height: "14px",
      borderRadius: "999px",
      background: "#a83f49",
      border: "3px solid #090909",
      boxShadow: "0 4px 8px rgba(190,95,105,0.18)",
    },
    downloadRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: "12px",
      alignItems: "center",
    },
    fallbackText: {
      fontSize: "15px",
      lineHeight: 1.8,
      color: "#c5c2ba",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    },
    reveal: (key, delay = 0) => ({
      opacity: visibleSections[key] ? 1 : 0,
      transform: visibleSections[key] ? "translateY(0px)" : "translateY(18px)",
      transition: `opacity 650ms ease ${delay}ms, transform 650ms ease ${delay}ms`,
    }),
  };

  if (loading) {
    return <AssessmentReportPending onBack={onBack} />;
  }

  if (aiState === "error") {
    return <AssessmentReportError onBack={onBack} />;
  }

  if (!parsedReport && rawFallback) {
    return (
      <div style={styles.page}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; }
          html { scroll-behavior: smooth; }
          body { margin: 0; }
          button:focus-visible, a:focus-visible { outline: 2px solid #df969b; outline-offset: 3px; }
        `}</style>
        <div style={styles.header}>
          <div style={{ ...styles.container, ...styles.headerInner }}>
            <div style={styles.brand}>
              <div style={styles.brandMark}>🍁</div>
              <div>
                <p style={styles.brandTitle}>PathwayFinder</p>
                <p style={styles.brandSub}>Immigration Pathway Evaluation</p>
              </div>
            </div>
            <div style={styles.buttonRow}>
              <button type="button" style={styles.secondaryBtn} onClick={onBack}>Edit profile</button>
              <button type="button" style={styles.primaryBtn} onClick={onRestart}>New assessment</button>
            </div>
          </div>
        </div>
        <section style={styles.section}>
          <div style={styles.container}>
            <div style={styles.card}>
              <div style={styles.label}>{unlocked ? "Full report" : "Free preview"}</div>
              <h1 style={{ ...styles.sectionTitle, marginBottom: 16 }}>Your Pathway Report</h1>
              {!unlocked && (
                <div style={{ padding: "32px 0" }}>
                  <div style={{ textAlign: "center", fontSize: 40, marginBottom: 12 }}>🔒</div>
                  <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24, fontWeight: 600, color: "#eeede8", margin: "0 0 8px", textAlign: "center" }}>
                    Unlock Your Full Report
                  </h2>
                  <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, color: "#aaa7a1", lineHeight: 1.6, margin: "0 0 20px", textAlign: "center" }}>
                    Enter your access code to view the full report.
                  </p>
                  <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }} placeholder="Enter access code" style={{ width: "100%", height: 48, borderRadius: 12, border: "1px solid rgba(220,210,200,0.12)", padding: "0 14px", fontFamily: "'Manrope', sans-serif", fontSize: 15, color: "#eeede8", outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
                  <button type="button" onClick={handleUnlock} disabled={promoLoading} style={{ width: "100%", border: "none", background: "#a83f49", color: "#fff", padding: "12px 16px", borderRadius: 12, fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 700, cursor: promoLoading ? "wait" : "pointer", opacity: promoLoading ? 0.7 : 1 }}>
                    {promoLoading ? "Validating..." : "Unlock Report →"}
                  </button>
                  {promoError && <p style={{ color: "#ee9696", fontSize: 13, fontWeight: 600, marginTop: 10, marginBottom: 0 }}>{promoError}</p>}
                </div>
              )}
              <div style={!unlocked ? { filter: "blur(8px)", pointerEvents: "none", userSelect: "none", maxHeight: 200, overflow: "hidden", position: "relative" } : {}}>
                <div style={styles.fallbackText}>{rawFallback}</div>
              </div>
              {!unlocked && (
                <div style={{ textAlign: "center", paddingTop: 16, background: "linear-gradient(to bottom, rgba(18,18,18,0) 0%, rgba(18,18,18,1) 40%)", marginTop: -60, position: "relative", zIndex: 2, paddingBottom: 8 }}>
                  <p style={{ fontSize: 13, color: "#aaa7a1" }}>Enter your access code above to see the full report</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  const totalCost = safeReport?.costs?.total || costItems.reduce((sum, item) => sum + Number(item?.amount || 0), 0);
  const biggestCost = Math.max(...costItems.map((item) => Number(item?.amount || 0)), 1);
  const currentScore = safeReport?.crs?.total ?? safeBreakdown?.total ?? 0;

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; }
        button:focus-visible, a:focus-visible { outline: 2px solid #df969b; outline-offset: 3px; }
        .pf-primary:hover { transform: translateY(-1px); box-shadow: 0 18px 30px rgba(45,106,79,0.24) !important; background: #bf4e59 !important; }
        .pf-secondary:hover { transform: translateY(-1px); box-shadow: 0 14px 24px rgba(20,33,27,0.08); border-color: rgba(27,67,50,0.26) !important; }
        .pf-pathway-card:hover, .pf-opportunity-card:hover, .pf-action-card:hover { transform: translateY(-3px); box-shadow: 0 24px 40px rgba(20,33,27,0.09) !important; }
        @media (max-width: 1080px) {
          .pf-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .pf-two-col, .pf-score-hero, .pf-simulator-grid { grid-template-columns: 1fr !important; }
          .pf-opportunities-grid, .pf-step-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 760px) {
          .pf-container { padding: 0 16px !important; }
          .pf-header-inner { flex-direction: column !important; align-items: stretch !important; }
          .pf-button-row { justify-content: stretch !important; }
          .pf-button-row button { width: 100%; }
          .pf-summary-grid, .pf-opportunities-grid, .pf-step-grid, .pf-split-list, .pf-checklist { grid-template-columns: 1fr !important; }
          .pf-pathway-top { grid-template-columns: auto 1fr !important; }
          .pf-pathway-top > :last-child { grid-column: 1 / -1; }
          .pf-pathway-stats { grid-template-columns: 1fr !important; }
          .pf-bar-row { grid-template-columns: 92px 1fr 36px !important; }
          .pf-cutoff-row { grid-template-columns: 76px 1fr 46px !important; }
          .pf-cost-row { grid-template-columns: 120px 1fr 76px !important; }
        }
        @media print {
          body { background: #ffffff !important; }
          .dark-assessment, .dark-assessment div, .dark-assessment section, .dark-assessment header, .dark-assessment footer, .dark-assessment button { background: #fff !important; color: #111 !important; }
          .dark-assessment p, .dark-assessment span, .dark-assessment h1, .dark-assessment h2, .dark-assessment h3, .dark-assessment td, .dark-assessment th { color: #111 !important; }
          .no-print { display: none !important; }
          .print-expand { display: block !important; }
          .pf-page, .pf-card, .pf-pathway-card { background: #ffffff !important; box-shadow: none !important; }
          * { animation: none !important; transition: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          * { animation: none !important; transition: none !important; }
        }
        /* === PDF CAPTURE STYLES === */
        .pf-pdf-capture .no-print, .pf-pdf-capture .pdf-hide { display: none !important; }
        .pf-pdf-capture .pf-primary:hover, .pf-pdf-capture .pf-secondary:hover,
        .pf-pdf-capture .pf-pathway-card:hover, .pf-pdf-capture .pf-opportunity-card:hover,
        .pf-pdf-capture .pf-action-card:hover { transform: none !important; box-shadow: none !important; }
        .pf-pdf-capture .pf-pathway-details { display: block !important; }
        .pf-pdf-capture * { animation: none !important; transition: none !important; }

        /* CHANGE 1: Flatten layout — single-column grids for PDF */
        .pf-pdf-capture .pf-summary-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
        .pf-pdf-capture .pf-two-col { grid-template-columns: 1fr !important; }
        .pf-pdf-capture .pf-split-list { grid-template-columns: 1fr !important; }
        .pf-pdf-capture .pf-opportunities-grid { grid-template-columns: 1fr !important; }
        .pf-pdf-capture .pf-step-grid { grid-template-columns: 1fr !important; }
        .pf-pdf-capture .pf-checklist { grid-template-columns: 1fr !important; }
        .pf-pdf-capture .pf-score-hero { grid-template-columns: 1fr !important; }
        .pf-pdf-capture .pf-bar-row { grid-template-columns: 120px 1fr 50px !important; }
        .pf-pdf-capture .pf-cutoff-row { grid-template-columns: 100px 1fr 70px !important; }
        .pf-pdf-capture .pf-cost-row { grid-template-columns: 140px 1fr 90px !important; }

        /* CHANGE 2: Reduce spacing to minimize white gaps */
        .pf-pdf-capture section { padding-top: 12px !important; padding-bottom: 12px !important; }
        .pf-pdf-capture h1 { font-size: 28px !important; margin-bottom: 8px !important; }
        .pf-pdf-capture h2 { font-size: 22px !important; margin-bottom: 6px !important; }
        .pf-pdf-capture .pf-card { padding: 16px !important; margin-bottom: 8px !important; }
        .pf-pdf-capture .pf-pathway-card { padding: 16px !important; margin-bottom: 8px !important; }
        .pf-pdf-capture .pf-opportunity-card { padding: 14px !important; margin-bottom: 8px !important; }
        .pf-pdf-capture .pf-action-card { padding: 14px !important; margin-bottom: 8px !important; }

        /* CHANGE 3: Break large cards into smaller blocks — cards CAN split, sub-sections stay together */
        .pf-pdf-capture .pf-pathway-card { break-inside: auto !important; }
        .pf-pdf-capture .pf-pathway-card > * { break-inside: avoid; }
        .pf-pdf-capture .pf-pathway-details { break-inside: avoid; }
        .pf-pdf-capture .pf-pathway-top { break-inside: avoid; }
        .pf-pdf-capture .pf-action-card > * { break-inside: avoid; }
        .pf-pdf-capture .pf-card, .pf-pdf-capture .pf-opportunity-card,
        .pf-pdf-capture .pf-cost-row, .pf-pdf-capture .pf-timeline-item,
        .pf-pdf-capture tr { page-break-inside: avoid; break-inside: avoid; }
        .pf-pdf-capture .pf-section-break { page-break-before: always; break-before: page; }
        .pf-pdf-capture h2 { page-break-after: avoid; break-after: avoid; }

        /* CHANGE 4: Ensure bars and dots are visible */
        .pf-pdf-capture .pf-cost-fill { min-width: 8px !important; min-height: 12px !important; }
        .pf-pdf-capture .pf-cutoff-dot { min-width: 10px !important; min-height: 10px !important; }
        .pf-pdf-capture .pf-bar-fill { min-height: 14px !important; }

        /* CHANGE 5: Prevent text overflow and hyphenation */
        .pf-pdf-capture * {
          word-break: normal !important;
          overflow-wrap: anywhere !important;
          hyphens: none !important;
          -webkit-hyphens: none !important;
        }
        .pf-pdf-capture .pf-mono, .pf-pdf-capture .pf-score-number { white-space: nowrap !important; }
        .pf-pdf-capture p, .pf-pdf-capture div, .pf-pdf-capture span, .pf-pdf-capture td, .pf-pdf-capture th {
          font-size: max(11px, inherit) !important;
        }

        /* CHANGE 6: Eliminate blank last page */
        .pf-pdf-capture [data-section="footer"] { page-break-before: avoid !important; break-before: avoid !important; padding-top: 8px !important; }
      `}</style>

      <div className="no-print" style={styles.header}>
        <div className="pf-container pf-header-inner" style={{ ...styles.container, ...styles.headerInner }}>
          <div style={styles.brand}>
            <div style={styles.brandMark}>🍁</div>
            <div>
              <p style={styles.brandTitle}>PathwayFinder</p>
              <p style={styles.brandSub}>Immigration Pathway Evaluation</p>
            </div>
          </div>
          <div className="pf-button-row" style={styles.buttonRow}>
            <button type="button" className="pf-secondary" style={styles.secondaryBtn} onClick={onBack}>
              Edit profile
            </button>
            <button type="button" className="pf-primary" style={styles.primaryBtn} onClick={onRestart}>
              New assessment
            </button>
          </div>
        </div>
      </div>

      <div ref={reportContentRef} id="report-container">
      <section
        ref={(el) => addSectionRef(el, 0)}
        data-section="top"
        style={{ ...styles.section, paddingTop: 28 }}
      >
        <div className="pf-container" style={styles.container}>
          <div style={styles.reveal("top") }>
            <div style={styles.label}>{unlocked ? "Full report" : "Free preview"}</div>
            <h1 style={{ ...styles.sectionTitle, marginBottom: 12 }}>Your Pathway Report</h1>
            <p style={styles.sectionLead}>
              A personalized immigration report based on your profile, your current Comprehensive Ranking System (CRS) score, and a comparison across federal and provincial pathways.
            </p>
          </div>
          <div className="pf-summary-grid" style={styles.summaryGrid}>
            {summaryCards.map((card, index) => (
              <div
                key={card.label}
                style={{ ...styles.summaryCard, ...styles.reveal("top", index * 90) }}
              >
                <div style={styles.label}>{card.label}</div>
                {card.tone === "wide" ? (
                  <div style={styles.summaryWide}>{card.value}</div>
                ) : (
                  <div style={styles.summaryValue}>{card.value}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {!unlocked && aiState === "idle" && (
        <div className="no-print" style={{ maxWidth: 520, margin: "0 auto", padding: "40px 20px 0" }}>
          <div style={{
            background: "#151515",
            border: "1px solid rgba(220,210,200,0.12)",
            borderRadius: 20,
            padding: 32,
            boxShadow: "0 24px 80px rgba(220,210,200,0.06)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28, fontWeight: 600, color: "#eeede8", margin: "0 0 8px" }}>
              Unlock Your Full Report
            </h2>
            <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 15, color: "#aaa7a1", lineHeight: 1.6, margin: "0 0 24px" }}>
              Enter your access code to view personalized pathways, action plan, costs, timeline, and download your PDF report.
            </p>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
              placeholder="Enter access code"
              style={{
                width: "100%",
                height: 56,
                borderRadius: 16,
                border: "1px solid rgba(220,210,200,0.12)",
                background: "#151515",
                padding: "0 16px",
                fontFamily: "'Manrope', sans-serif",
                fontSize: 16,
                color: "#eeede8",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 16,
              }}
            />
            <button
              type="button"
              onClick={handleUnlock}
              disabled={promoLoading}
              style={{
                width: "100%",
                border: "none",
                background: "#a83f49",
                color: "#fff",
                padding: "14px 20px",
                borderRadius: 14,
                fontFamily: "'Manrope', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                cursor: promoLoading ? "wait" : "pointer",
                opacity: promoLoading ? 0.7 : 1,
                boxShadow: "0 12px 28px rgba(190,95,105,0.22)",
              }}
            >
              {promoLoading ? "Validating..." : "Unlock Report →"}
            </button>
            {promoError && (
              <p style={{ color: "#ee9696", fontSize: 14, fontWeight: 600, marginTop: 12, marginBottom: 0 }}>
                {promoError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* When idle (no AI call yet), show static fake placeholder behind blur */}
      {aiState === "idle" && (
        <div style={{ filter: "blur(8px)", pointerEvents: "none", userSelect: "none", maxHeight: 400, overflow: "hidden", position: "relative" }}>
          <section style={styles.section}>
            <div className="pf-container" style={styles.container}>
              <h2 style={styles.sectionTitle}>Your Immigration Pathways</h2>
              <p style={styles.sectionLead}>Personalized pathway analysis based on your profile.</p>
              <div style={{ display: "grid", gap: 16 }}>
                {[
                  { name: "Express Entry — Federal Skilled Worker", chance: "High", timeline: "6–8 months" },
                  { name: "Provincial Nominee Program (Ontario)", chance: "Moderate", timeline: "12–16 months" },
                  { name: "Canadian Experience Class", chance: "Moderate", timeline: "4–6 months" },
                ].map((pw, i) => (
                  <div key={i} style={{ ...styles.card, padding: 22 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: "999px", background: "#151515", color: "#eeede8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>#{i + 1}</div>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#eeede8" }}>{pw.name}</div>
                        <div style={{ fontSize: 13, color: "#aaa7a1", marginTop: 4 }}>Estimated timeline: {pw.timeline}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <span style={{ ...styles.badge("#242021", "#eeede8"), fontSize: 12 }}>Chance: {pw.chance}</span>
                      <span style={{ ...styles.badge("#242019", "#d9c897"), fontSize: 12 }}>Action plan included</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
      {aiState === "idle" && (
        <div style={{ textAlign: "center", padding: "0 20px 24px", background: "linear-gradient(to bottom, rgba(9,9,9,0) 0%, rgba(9,9,9,1) 30%)", marginTop: -80, position: "relative", zIndex: 2 }}>
          <p style={{ fontSize: 14, color: "#aaa7a1", fontWeight: 600 }}>Enter your access code above to unlock the full report</p>
        </div>
      )}

      {/* Full report content — only rendered after AI completes */}
      <div style={aiState !== "idle" && !unlocked ? { filter: "blur(8px)", pointerEvents: "none", userSelect: "none", maxHeight: 400, overflow: "hidden", position: "relative" } : aiState === "idle" ? { display: "none" } : {}}>

      <section
        ref={(el) => addSectionRef(el, 1)}
        data-section="profile"
        style={styles.section}
      >
        <div className="pf-container" style={styles.container}>
          <div className="pf-two-col" style={styles.twoCol}>
            <div style={{ ...styles.card, ...styles.reveal("profile") }}>
              <div style={styles.label}>Profile summary</div>
              <div style={{ fontSize: 16, lineHeight: 1.8, color: "#c5c2ba" }}>
                {safeReport?.profile?.summary || "Your profile summary will appear here once the report is generated."}
              </div>
            </div>
            <div style={{ ...styles.card, ...styles.reveal("profile", 100) }}>
              <div style={styles.label}>At a glance</div>
              <div style={{ fontSize: 16, lineHeight: 1.8, color: "#c5c2ba" }}>
                {safeReport?.crs?.competitiveness || "This section explains how competitive your current profile appears today."}
              </div>
            </div>
          </div>

          <div className="pf-split-list" style={{ ...styles.splitList, ...styles.reveal("profile", 160) }}>
            <div style={{ ...styles.listBox, background: "#151515" }}>
              <div style={{ ...styles.listTitle, color: "#9fceb4" }}>Strengths</div>
              {(Array.isArray(safeReport?.profile?.strengths) ? safeReport.profile.strengths : []).map((item, index) => (
                <div key={`${item}-${index}`} style={styles.listItem}>
                  <span style={{ color: "#df969b", fontWeight: 900 }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ ...styles.listBox, background: "#211c16" }}>
              <div style={{ ...styles.listTitle, color: "#d9b888" }}>Gaps</div>
              {(Array.isArray(safeReport?.profile?.gaps) ? safeReport.profile.gaps : []).map((item, index) => (
                <div key={`${item}-${index}`} style={styles.listItem}>
                  <span style={{ color: "#D4A373", fontWeight: 900 }}>⚠</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        ref={(el) => addSectionRef(el, 2)}
        data-section="crs"
        style={styles.section}
      >
        <div className="pf-container" style={styles.container}>
          <div style={styles.reveal("crs") }>
            <h2 style={styles.sectionTitle}>CRS score analysis</h2>
            <p style={styles.sectionLead}>
              This section shows where your score comes from, how competitive it looks, and which draw categories are closer to your current profile.
            </p>
          </div>
          <div className="pf-score-hero" style={styles.scoreHero}>
            <div style={{ ...styles.scoreCard, ...styles.reveal("crs", 60) }}>
              <div style={styles.label}>Current score</div>
              <div style={{ ...styles.scoreNumber, ...styles.mono }}>{currentScore}</div>
              <div style={{ fontSize: 14, color: "#aaa7a1", marginTop: 6 }}>out of 1,200</div>
              <div style={{ marginTop: 18, fontSize: 15, lineHeight: 1.7, color: "#c5c2ba" }}>
                {safeReport?.crs?.competitiveness || "Competitiveness summary not available."}
              </div>
              <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.7, color: "#e09a9f", fontWeight: 700 }}>
                {safeReport?.crs?.keyInsight || "Key insight not available."}
              </div>
            </div>

            <div style={{ ...styles.card, ...styles.reveal("crs", 120) }}>
              <div style={styles.label}>Breakdown</div>
              <div className="pf-bars-wrap" style={styles.barsWrap}>
                {breakdownItems.map((item) => {
                  const width = item.max ? (item.value / item.max) * 100 : 0;
                  return (
                    <div key={item.label} className="pf-bar-row" style={styles.barRow}>
                      <div style={{ fontSize: 14, color: "#c5c2ba", fontWeight: 700 }}>{item.label}</div>
                      <div style={styles.barTrack} aria-hidden="true">
                        <div style={styles.barFill(width)} />
                      </div>
                      <div style={{ fontSize: 14, color: "#eeede8", textAlign: "right", fontWeight: 800, ...styles.mono }}>{item.value}</div>
                    </div>
                  );
                })}
              </div>

              <div style={styles.cutoffWrap}>
                <div style={{ ...styles.label, marginTop: 8 }}>Draw comparison</div>
                {categoryCutoffs.map((cutoff) => {
                  const left = (cutoff.min / 1200) * 100;
                  const width = ((cutoff.max - cutoff.min) / 1200) * 100;
                  const marker = (currentScore / 1200) * 100;
                  return (
                    <div key={cutoff.label} className="pf-cutoff-row" style={styles.cutoffRow}>
                      <div style={{ fontSize: 13, color: "#c5c2ba", fontWeight: 700 }}>{cutoff.label}</div>
                      <div style={styles.cutoffTrack}>
                        <div style={styles.cutoffRange(left, width)} />
                        <div style={styles.cutoffMarker(marker)} />
                      </div>
                      <div style={{ fontSize: 13, color: "#aaa7a1", textAlign: "right", ...styles.mono }}>{cutoff.min}-{cutoff.max}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={(el) => addSectionRef(el, 3)}
        data-section="losses"
        style={styles.section}
      >
        <div className="pf-container" style={styles.container}>
          <div style={styles.reveal("losses") }>
            <h2 style={styles.sectionTitle}>Where you’re losing points</h2>
            <p style={styles.sectionLead}>
              These are the areas where your current profile is below the maximum available score.
            </p>
          </div>
          <div style={{ ...styles.card, ...styles.tableCard, ...styles.reveal("losses", 80) }}>
            <table style={styles.lossTable}>
              <thead>
                <tr>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Current / max</th>
                  <th style={styles.th}>Points lost</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Explanation</th>
                </tr>
              </thead>
              <tbody>
                {safeLosses.map((item, index) => (
                  <tr key={`${item?.category || "loss"}-${index}`}>
                    <td style={styles.td}>{item?.category || "—"}</td>
                    <td style={{ ...styles.td, ...styles.mono }}>{item?.currentPoints ?? item?.current ?? "—"} / {item?.maxPoints ?? item?.max ?? "—"}</td>
                    <td style={{ ...styles.td, ...styles.mono }}>{item?.pointsLost ?? item?.lost ?? "—"}</td>
                    <td style={styles.td}>
                      {item?.fixable ? (
                        <span style={styles.badge("#282018", "#e2b786")}>Improvable</span>
                      ) : (
                        <span style={styles.badge("#2c1919", "#ee9991")}>Can’t change</span>
                      )}
                    </td>
                    <td style={styles.td}>{item?.explanation || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section
        ref={(el) => addSectionRef(el, 4)}
        data-section="opps"
        style={styles.section}
      >
        <div className="pf-container" style={styles.container}>
          <div style={styles.reveal("opps") }>
            <h2 style={styles.sectionTitle}>How to gain points</h2>
            <p style={styles.sectionLead}>
              These are the highest-value improvements based on your current profile.
            </p>
          </div>
          <div className="pf-opportunities-grid" style={styles.opportunitiesGrid}>
            {safeOpportunities.map((item, index) => (
              <div
                key={`${item?.action || "opportunity"}-${index}`}
                className="pf-opportunity-card"
                style={{ ...styles.opportunityCard, ...styles.reveal("opps", index * 90) }}
              >
                <div style={styles.label}>Opportunity</div>
                <p style={styles.plusNumber}>+{item?.pointsGain ?? 0}</p>
                <div style={{ fontSize: 18, lineHeight: 1.45, color: "#eeede8", fontWeight: 800, marginTop: 10 }}>
                  {item?.action || "Action not available"}
                </div>
                <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span style={styles.badge("#18202b", "#9bbce9")}>{item?.difficulty || "Unknown"}</span>
                  <span style={styles.badge("#232121", "#b4b0a9")}>{item?.timeframe || "Timeline not set"}</span>
                </div>
                <div style={{ marginTop: 14, fontSize: 14, color: "#c5c2ba", lineHeight: 1.65 }}>
                  Estimated cost: <strong>{formatMoney(item?.cost)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        ref={(el) => addSectionRef(el, 5)}
        data-section="projected"
        style={styles.section}
      >
        <div className="pf-container" style={styles.container}>
          <div style={{ ...styles.highlightBanner, ...styles.reveal("projected") }}>
            <div style={{ ...styles.label, color: "#AFDCC3" }}>Projected score</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 68, lineHeight: 0.9, ...styles.mono }}>
                {currentScore}
              </div>
              <div style={{ fontSize: 28, opacity: 0.8 }}>→</div>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 68, lineHeight: 0.9, color: "#df969b", ...styles.mono }}>
                {projectedScore}
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 16, lineHeight: 1.75, color: "#E4F2EA" }}>
              Your score could go from <strong>{currentScore}</strong> to <strong>{projectedScore}</strong> based on the strongest improvement opportunities in this report.
            </div>
            <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 10 }}>
              {categoryCutoffs.filter((item) => projectedScore >= item.min).map((item) => (
                <span key={item.label} style={styles.badge("rgba(255,255,255,0.12)", "#FFFFFF")}>Crosses {item.label} range</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        ref={(el) => addSectionRef(el, 6)}
        data-section="pathways"
        className="pf-section-break"
        style={styles.section}
      >
        <div className="pf-container" style={styles.container}>
          <div style={styles.reveal("pathways") }>
            <h2 style={styles.sectionTitle}>Recommended pathways</h2>
            <p style={styles.sectionLead}>
              These are the strongest pathways for your profile right now, ranked by fit, timing, and overall practicality.
            </p>
          </div>
          <div className="pf-pathways-grid" style={styles.pathwaysGrid}>
            {safePathways.map((pathway, index) => {
              const statusStyle = getStatusStyle(pathway?.status);
              const chance = typeof pathway?.chance === "number" ? pathway.chance : Number(String(pathway?.chance || "").replace("%", "")) || 0;
              const expanded = expandedPathway === index;
              const reqs = Array.isArray(pathway?.requirements) ? pathway.requirements : [];
              return (
                <div
                  key={`${pathway?.name || "pathway"}-${index}`}
                  className="pf-pathway-card"
                  style={{ ...styles.pathwayCard, ...styles.reveal("pathways", index * 90) }}
                >
                  <div style={styles.pathwayHead}>
                    <div className="pf-pathway-top" style={styles.pathwayTop}>
                      <div style={styles.rankBadge}>#{pathway?.rank || index + 1}</div>
                      <div>
                        <h3 style={styles.pathwayName}>{pathway?.name || "Pathway"}</h3>
                        <div style={styles.streamText}>{pathway?.stream || "Stream not specified"}</div>
                        <div style={styles.pathwayMetaRow}>
                          <span style={styles.badge(statusStyle.background, statusStyle.color)}>{pathway?.status || "Unknown"}</span>
                          <span style={styles.badge("#232121", "#b4b0a9")}>{pathway?.timeline || "Timeline not set"}</span>
                          <span style={styles.badge("#232121", "#b4b0a9")}>{formatMoney(pathway?.cost)}</span>
                        </div>
                      </div>
                      <div style={{ minWidth: 120, textAlign: "right" }}>
                        <div style={styles.label}>Match confidence</div>
                        <div style={{ fontSize: 36, fontWeight: 800, color: "#eeede8", ...styles.mono }}>{chance}%</div>
                      </div>
                    </div>

                    <div className="pf-pathway-stats" style={styles.pathwayStats}>
                      <div style={styles.progressWrap}>
                        <div style={styles.barTrack}>
                          <div style={styles.barFill(chance)} />
                        </div>
                      </div>
                      <div style={{ fontSize: 14, color: "#aaa7a1", textAlign: "right" }}>
                        Timeline: <strong style={{ color: "#c5c2ba" }}>{pathway?.timeline || "—"}</strong>
                      </div>
                    </div>

                    <div style={styles.whyBox}>
                      <div style={{ ...styles.label, marginBottom: 8 }}>Why this fits you</div>
                      <div style={{ fontSize: 14, lineHeight: 1.7, color: "#c5c2ba" }}>{pathway?.why || "No explanation available."}</div>
                    </div>

                    <div className="pf-checklist" style={styles.checklist}>
                      {reqs.map((req, reqIndex) => {
                        const label = typeof req === "string" ? req : (req?.label || req?.item);
                        const met = typeof req === "string" ? true : !!req?.met;
                        return (
                          <div key={`${label}-${reqIndex}`} style={styles.checklistItem}>
                            <span style={{ color: met ? "#9fceb4" : "#ee9991", fontWeight: 900 }}>{met ? "✓" : "✗"}</span>
                            <span>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="no-print"
                    style={styles.accordionBtn}
                    onClick={() => setExpandedPathway((prev) => (prev === index ? -1 : index))}
                  >
                    {expanded ? "Hide full details" : "Show full details"}
                  </button>

                  {(expanded || false) && (
                    <div className="print-expand" style={styles.accordionBody}>
                      <div style={{ display: "grid", gap: 16, paddingTop: 16 }}>
                        <div>
                          <div style={styles.label}>Description</div>
                          <div style={{ fontSize: 14, color: "#c5c2ba", lineHeight: 1.7 }}>
                            {pathway?.details?.description || "No description available."}
                          </div>
                        </div>

                        <div>
                          <div style={styles.label}>Application process</div>
                          <div style={{ display: "grid", gap: 8 }}>
                            {(Array.isArray(pathway?.details?.applicationProcess) ? pathway.details.applicationProcess : []).map((step, stepIndex) => (
                              <div key={`${step}-${stepIndex}`} style={{ fontSize: 14, color: "#c5c2ba", lineHeight: 1.7 }}>
                                <strong>{stepIndex + 1}.</strong> {step}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
                          <div>
                            <div style={styles.label}>Processing time</div>
                            <div style={{ fontSize: 14, color: "#c5c2ba" }}>{pathway?.details?.processingTime || "—"}</div>
                          </div>
                          <div>
                            <div style={styles.label}>Alternatives</div>
                            <div style={{ fontSize: 14, color: "#c5c2ba" }}>{pathway?.details?.alternatives || "—"}</div>
                          </div>
                          <div>
                            <div style={styles.label}>Official link</div>
                            {pathway?.details?.officialLink ? (
                              <a
                                href={pathway.details.officialLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#e09a9f", fontWeight: 700, textDecoration: "none" }}
                              >
                                View source
                              </a>
                            ) : (
                              <div style={{ fontSize: 14, color: "#c5c2ba" }}>—</div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div style={styles.label}>Improvement tips</div>
                          <div style={{ fontSize: 14, color: "#c5c2ba", lineHeight: 1.7 }}>
                            {pathway?.details?.improvementTips || "No improvement tips available."}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        ref={(el) => addSectionRef(el, 7)}
        data-section="sim"
        className="pdf-hide"
        style={styles.section}
      >
        <div className="pf-container" style={styles.container}>
          <div style={styles.reveal("sim") }>
            <h2 style={styles.sectionTitle}>What If? Score Simulator</h2>
            <p style={styles.sectionLead}>
              Explore how common improvements could change your score and open stronger draw categories.
            </p>
          </div>
          <div className="pf-simulator-grid" style={styles.simulatorGrid}>
            <div style={{ ...styles.card, ...styles.reveal("sim", 60) }}>
              <div className="pf-toggle-list" style={styles.toggleList}>
                {simulatorOptions.map((option) => (
                  <div key={option.key} style={styles.toggleRow}>
                    <div style={{ fontSize: 14, color: "#c5c2ba", fontWeight: 700, lineHeight: 1.5 }}>{option.label}</div>
                    <button
                      type="button"
                      className="no-print"
                      aria-pressed={!!simulatorState[option.key]}
                      style={styles.toggle(!!simulatorState[option.key])}
                      onClick={() => setSimulatorState((prev) => ({ ...prev, [option.key]: !prev[option.key] }))}
                    >
                      <span style={styles.toggleKnob(!!simulatorState[option.key])} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...styles.card, ...styles.reveal("sim", 120) }}>
              <div style={styles.label}>Projected outcome</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#aaa7a1", ...styles.mono }}>Current: {currentScore}</div>
                <div style={{ fontSize: 22, color: "#aaa7a1" }}>→</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: "#e09a9f", ...styles.mono }}>
                  Projected: {simulatedScore}
                </div>
                <div style={styles.badge("#18231d", "#9fceb4")}>+{simulatedScore - currentScore}</div>
              </div>
              <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 10 }}>
                {categoryCutoffs.filter((item) => simulatedScore >= item.min).map((item) => (
                  <span key={item.label} style={styles.badge("#18231d", "#9fceb4")}>Could enter {item.label} range</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={(el) => addSectionRef(el, 8)}
        data-section="compare"
        style={styles.section}
      >
        <div className="pf-container" style={styles.container}>
          <div style={styles.reveal("compare") }>
            <h2 style={styles.sectionTitle}>Pathway comparison</h2>
            <p style={styles.sectionLead}>
              Compare your top options side by side before you decide where to focus.
            </p>
          </div>
          <div style={{ ...styles.card, ...styles.tableCard, ...styles.reveal("compare", 80) }}>
            <table style={styles.compareTable}>
              <thead>
                <tr>
                  <th style={styles.th}>Criteria</th>
                  {safePathways.map((pathway, index) => (
                    <th key={`${pathway?.name}-${index}`} style={styles.th}>
                      {index === 0 ? "★ " : ""}{pathway?.name || "Pathway"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Program", (p) => p?.stream || "—"],
                  ["Match %", (p) => (typeof p?.chance === "number" ? `${p.chance}%` : p?.chance || "—")],
                  ["Timeline", (p) => p?.timeline || "—"],
                  ["Cost", (p) => formatMoney(p?.cost)],
                  ["Status", (p) => p?.status || "—"],
                  ["Key missing requirement", (p) => {
                    const unmet = (Array.isArray(p?.requirements) ? p.requirements : []).find((req) => typeof req !== "string" && !req?.met);
                    return typeof unmet === "string" ? unmet : unmet?.label || "None highlighted";
                  }],
                ].map(([rowLabel, getter]) => (
                  <tr key={rowLabel}>
                    <td style={{ ...styles.compareCell, fontWeight: 800 }}>{rowLabel}</td>
                    {safePathways.map((pathway, index) => (
                      <td
                        key={`${rowLabel}-${pathway?.name}-${index}`}
                        style={{
                          ...styles.compareCell,
                          background: index === 0 ? "#1b1818" : "#121212",
                        }}
                      >
                        {getter(pathway)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section
        ref={(el) => addSectionRef(el, 9)}
        data-section="plan"
        className="pf-section-break"
        style={styles.section}
      >
        <div className="pf-container" style={styles.container}>
          <div style={styles.reveal("plan") }>
            <h2 style={styles.sectionTitle}>Action plan</h2>
            <p style={styles.sectionLead}>
              Start with the highest-priority moves first.
            </p>
          </div>
          <div className="pf-step-grid" style={styles.stepGrid}>
            {safeActionPlan.map((item, index) => {
              const priorityStyle = getPriorityStyle(item?.priority);
              return (
                <div
                  key={`${item?.action || "action"}-${index}`}
                  className="pf-action-card"
                  style={{ ...styles.actionCard, ...styles.reveal("plan", index * 90) }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
                    <div style={styles.rankBadge}>{item?.step || index + 1}</div>
                    <span style={styles.badge(priorityStyle.background, priorityStyle.color)}>{item?.priority || "Medium"}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#eeede8", lineHeight: 1.4 }}>{item?.action || "—"}</div>
                  <div style={{ marginTop: 12, fontSize: 14, color: "#c5c2ba", lineHeight: 1.7 }}>
                    Where: <span style={{ color: "#e09a9f", fontWeight: 700 }}>{item?.where || "—"}</span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 14, color: "#c5c2ba", lineHeight: 1.7 }}>
                    Cost: <strong>{formatMoney(item?.cost)}</strong>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 14, color: "#c5c2ba", lineHeight: 1.7 }}>
                    Time: <strong>{item?.time || "—"}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        ref={(el) => addSectionRef(el, 10)}
        data-section="costs"
        className="pf-section-break"
        style={styles.section}
      >
        <div className="pf-container" style={styles.container}>
          <div style={styles.reveal("costs") }>
            <h2 style={styles.sectionTitle}>Estimated costs</h2>
            <p style={styles.sectionLead}>
              A rough view of the main costs you may need to plan for.
            </p>
          </div>
          <div style={{ ...styles.card, ...styles.reveal("costs", 80) }}>
            <div style={styles.label}>Estimated total</div>
            <div style={{
              ...styles.scoreNumber,
              fontSize: typeof totalCost === "string" && !/^\$?[\d,.]+$/.test(totalCost.trim()) ? 28 : 64,
              fontFamily: typeof totalCost === "string" && !/^\$?[\d,.]+$/.test(totalCost.trim()) ? "'Manrope', sans-serif" : undefined,
              marginBottom: 20,
            }}>{formatMoney(totalCost)}</div>
            <div style={styles.costGrid}>
              {[...costItems].sort((a, b) => Number(b?.amount || 0) - Number(a?.amount || 0)).map((item, index) => {
                const width = biggestCost ? (Number(item?.amount || 0) / biggestCost) * 100 : 0;
                return (
                  <div key={`${item?.name || "cost"}-${index}`} className="pf-cost-row" style={styles.costRow}>
                    <div style={{ fontSize: 14, color: "#c5c2ba", fontWeight: 700 }}>{item?.name || "—"}</div>
                    <div style={styles.costTrack}><div className="pf-cost-fill" style={styles.costFill(width)} /></div>
                    <div style={{ fontSize: 14, color: "#eeede8", textAlign: "right", fontWeight: 800, ...styles.mono }}>
                      {formatMoney(item?.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section
        ref={(el) => addSectionRef(el, 11)}
        data-section="timeline"
        style={styles.section}
      >
        <div className="pf-container" style={styles.container}>
          <div style={styles.reveal("timeline") }>
            <h2 style={styles.sectionTitle}>Timeline</h2>
            <p style={styles.sectionLead}>
              A simple phased timeline based on your likely next steps.
            </p>
          </div>
          <div style={{ ...styles.timelineWrap, ...styles.reveal("timeline", 80) }}>
            <div style={styles.timelineLine} />
            {safeTimeline.map((item, index) => (
              <div key={`${item?.month || "month"}-${index}`} style={styles.timelineItem}>
                <div style={styles.timelineDot} />
                <div style={{ ...styles.label, marginBottom: 8 }}>{item?.month || "Phase"}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#eeede8", marginBottom: 8 }}>{item?.label || "Timeline step"}</div>
                <div style={{ fontSize: 14, color: "#c5c2ba", lineHeight: 1.7 }}>{item?.tasks || "—"}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        ref={(el) => addSectionRef(el, 12)}
        data-section="share"
        className="pdf-hide"
        style={styles.section}
      >
        <div className="pf-container" style={styles.container}>
          <div style={{ ...styles.card, ...styles.reveal("share") }}>
            <h2 style={{ ...styles.sectionTitle, fontSize: "clamp(1.8rem, 3vw, 2.5rem)", marginBottom: 10 }}>Download & share</h2>
            <p style={{ ...styles.sectionLead, marginBottom: 22 }}>
              Save a print-friendly version of your report or copy a short summary to share with a consultant.
            </p>
            <div className="download-row no-print" style={styles.downloadRow}>
              <button type="button" className="pf-primary" style={styles.primaryBtn} onClick={handleDownloadPdf} disabled={pdfGenerating}>
                {pdfGenerating ? "Generating PDF..." : "Download PDF"}
              </button>
              <button type="button" className="pf-secondary" style={styles.secondaryBtn} onClick={shareSummary}>
                Share with consultant
              </button>
            </div>
          </div>
        </div>
      </section>

      {safeReport?.dataDisclaimer && (
        <section data-section="footer" style={{ padding: "0 0 12px" }}>
          <div className="pf-container" style={styles.container}>
            <div style={{ padding: "16px 20px", background: "#242019", border: "1px solid #50452f", borderRadius: 16, fontSize: 13, lineHeight: 1.7, color: "#d9c897" }}>
              {safeReport.dataDisclaimer}
            </div>
          </div>
        </section>
      )}
      </div>{/* end blur wrapper */}
      {aiState !== "idle" && !unlocked && (
        <div style={{ textAlign: "center", padding: "0 20px 24px", background: "linear-gradient(to bottom, rgba(9,9,9,0) 0%, rgba(9,9,9,1) 30%)", marginTop: -80, position: "relative", zIndex: 2 }}>
          <p style={{ fontSize: 14, color: "#aaa7a1", fontWeight: 600 }}>Enter your access code above to unlock the full report</p>
        </div>
      )}
      </div>{/* end report-container */}

      <footer style={{ borderTop: "1px solid rgba(220,210,200,0.10)", padding: "28px 0 54px" }}>
        <div className="pf-container" style={styles.container}>
          <div style={{ fontSize: 14, lineHeight: 1.75, color: "#aaa7a1" }}>
            This report is for informational purposes only and is not legal or immigration advice. Data valid as of March 2026 — verify current program details on official sources before making important decisions.
          </div>
        </div>
      </footer>
    </div>
  );
}


// ============================================================
// PROFILE MAPPING: AssessmentFlow → calcCRS format
// ============================================================

function mapProfileForCRS(formProfile) {
  const educationMap = {
    "PhD": "phd",
    "Master's": "masters",
    "Two or more credentials (one 3+ yr)": "two_plus",
    "Bachelor's (3+ yr)": "bachelors",
    "2-year post-secondary": "two_year",
    "1-year post-secondary": "one_year",
    "High school diploma": "high_school",
    "Less than high school": "below_hs",
  };

  const workYearsMap = {
    "None": 0, "1 year": 1, "2 years": 2, "3 years": 3,
    "4 years": 4, "5+ years": 5, "4-5 years": 4, "6+ years": 6,
    "4+ years": 4, "3+ years": 3,
  };

  const langTestMap = {
    "IELTS General Training": "ielts",
    "CELPIP General": "celpip",
    "PTE Core": "pte",
    "No test yet": "",
    "IELTS": "ielts",
    "CELPIP": "celpip",
    "TEF Canada": "tef",
    "TCF Canada": "tcf",
  };

  const teerMap = {
    "TEER 0": "0", "TEER 1": "1", "TEER 2": "2", "TEER 3": "3", "TEER 4 or 5": "4", "Not sure": "1",
  };

  const maritalMap = {
    "Single": "single", "Married": "married", "Common-law": "common_law",
    "Divorced": "single", "Separated": "single", "Widowed": "single",
  };

  const mapped = {
    age: Number(formProfile.age) || 0,
    maritalStatus: maritalMap[formProfile.maritalStatus] || "single",
    spouseAccompanying: formProfile.spouseAccompanying === "Yes",
    spouseIsCitizenPR: formProfile.spouseIsCitizenPR === "Yes",
    dependentChildren: Number(formProfile.dependentChildren) || 0,
    citizenship: formProfile.citizenship || "",
    education: educationMap[formProfile.education] || "high_school",
    educationCountry: formProfile.educationCountry === "In Canada" ? "canada" : "foreign",
    ecaObtained: formProfile.ecaObtained === "Yes",
    canadianEducationYears: formProfile.educationCountry === "In Canada" ? ({"1 year or less": 1, "2 years": 2, "3+ years (degree program)": 3, "1 year": 1, "3+ years": 3}[formProfile.canadianEducationYears] || 0) : 0,
    firstLangTest: langTestMap[formProfile.firstLangTest] || "ielts",
    firstLangScores: {
      reading: Number(formProfile.reading) || 0,
      writing: Number(formProfile.writing) || 0,
      listening: Number(formProfile.listening) || 0,
      speaking: Number(formProfile.speaking) || 0,
    },
    hasSecondLang: formProfile.hasSecondLang === "Yes",
    secondLangTest: langTestMap[formProfile.secondLangTest] || "",
    secondLangScores: {
      reading: Number(formProfile.frReading) || 0,
      writing: Number(formProfile.frWriting) || 0,
      listening: Number(formProfile.frListening) || 0,
      speaking: Number(formProfile.frSpeaking) || 0,
    },
    spouseEducation: educationMap[formProfile.spouseEducation] || "below_hs",
    spouseLangTest: langTestMap[formProfile.spouseLangTest] || "ielts",
    spouseClbScores: {
      reading: Number(formProfile.spouseReading) || 0,
      writing: Number(formProfile.spouseWriting) || 0,
      listening: Number(formProfile.spouseListening) || 0,
      speaking: Number(formProfile.spouseSpeaking) || 0,
    },
    spouseCanadianWorkYears: workYearsMap[formProfile.spouseCanadianWorkYears] || 0,
    foreignWorkYears: workYearsMap[formProfile.foreignWorkYears] || 0,
    canadianWorkYears: workYearsMap[formProfile.canadianWorkYears] || 0,
    nocTeer: teerMap[formProfile.nocTeer] || "1",
    inCanada: formProfile.inCanada === "Yes",
    currentProvince: formProfile.currentProvince || "",
    siblingInCanada: formProfile.siblingInCanada === "Yes",
    provincialNomination: formProfile.provincialNomination === "Yes",
    provincePreference: formProfile.provincePreference || "Open to any",
    hasJobOffer: formProfile.hasJobOffer === "Yes",
    settlementFunds: Number(formProfile.settlementFunds) || 0,
    previousRefusals: formProfile.previousRefusals === "Yes",
    criminalHistory: formProfile.criminalHistory === "Yes",
    openToStudy: formProfile.openToStudy === "Yes",
  };

  // Compute CLB scores from raw test scores
  if (mapped.firstLangScores.reading > 0) {
    mapped.clb = convertToClb(mapped.firstLangTest, mapped.firstLangScores);
  }
  if (mapped.hasSecondLang && mapped.secondLangScores.reading > 0) {
    mapped.clb2 = convertToClb(mapped.secondLangTest, mapped.secondLangScores);
  }
  if (mapped.spouseClbScores.reading > 0) {
    mapped.spouseClb = convertToClb(mapped.spouseLangTest, mapped.spouseClbScores);
  }

  return mapped;
}

// ============================================================
// ASSESSMENT PAGE
// ============================================================

function AssessmentPage({ onBack }) {
  const [analysisState, setAnalysisState] = useState("form"); // "form" | "loading" | "results"
  const [report, setReport] = useState("");
  const [mappedProfile, setMappedProfile] = useState(null);
  const [formProfile, setFormProfile] = useState(null);
  const [breakdown, setBreakdown] = useState({});

  // DEV: reset to dev profile on restart
  const devReset = () => {
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
    const bd = calcCRS(mapped);
    setMappedProfile(mapped);
    setBreakdown(bd);
    setReport("");
    setAnalysisState("results");
  };

  if (analysisState === "results") {
    return (
      <ResultsPage
        report={report}
        breakdown={breakdown}
        profile={mappedProfile || {}}
        onBack={() => setAnalysisState("form")}
        onRestart={devReset}
        calcCRS={calcCRS}
      />
    );
  }

  return <AssessmentFlow onComplete={handleComplete} onBack={onBack} initialProfile={formProfile} />;
}

/* ============================================================
   OLD TAB-BASED FORM COMPONENTS (kept for reference)
   ============================================================
function OldAssessmentPage({ onBack }) {
  // ... old tab-based form code removed — see git history
}
============================================================ */

// ============================================================
// MAIN APP — ROUTER
// ============================================================

export default function App() {
  const [page, setPage] = useState(DEV_CONFIG.enabled ? "assessment" : "landing");
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(DEV_CONFIG.enabled);

  useEffect(() => {
    if (!document.querySelector('meta[name="viewport"]')) {
      const m = document.createElement("meta");
      m.name = "viewport";
      m.content = "width=device-width, initial-scale=1";
      document.head.appendChild(m);
    }
  }, []);

  const handleStart = () => {
    if (disclaimerAccepted) { setPage("assessment"); window.scrollTo(0, 0); }
    else { window.scrollTo(0, 0); setShowDisclaimer(true); }
  };

  const handleAccept = () => {
    setDisclaimerAccepted(true);
    setShowDisclaimer(false);
    setPage("assessment");
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet" />
      {showDisclaimer && <DisclaimerModal onAccept={handleAccept} onDecline={() => setShowDisclaimer(false)} />}
      {page === "landing" && <CountryExperience onStartCanada={handleStart} />}
      {page === "assessment" && <div className="dark-assessment"><AssessmentPage onBack={() => { setPage("landing"); window.scrollTo(0, 0); }} /></div>}
    </>
  );
}

