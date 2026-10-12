/**
 * Pure Canadian assessment scoring, shared by the browser and Cloud Functions.
 * Source: https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html
 * CRS tables checked 2026-10-11. This computes points for the supplied factors;
 * it does not establish program eligibility or verify supporting documents.
 *
 * The CLB 4 row, accompanying-spouse 4-year work row, spouse-work table and
 * education/foreign-work transferability bands and caps were corrected against
 * that source. Previously fixed spouse-column and French-bonus logic is retained.
 */

const CRS_AGE = [
  [17,0,0],[18,99,90],[19,105,95],[20,110,100],[21,110,100],[22,110,100],[23,110,100],
  [24,110,100],[25,110,100],[26,110,100],[27,110,100],[28,110,100],[29,110,100],
  [30,105,95],[31,99,90],[32,94,85],[33,88,80],[34,83,75],[35,77,70],[36,72,65],
  [37,66,60],[38,61,55],[39,55,50],[40,50,45],[41,39,35],[42,28,25],[43,17,15],[44,6,5],
];

export const CRS_EDUCATION = [
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
  { clb: 4, single: 6, spouse: 6 },
];

const CRS_SECOND_LANG = [
  { clb: 9, single: 6, spouse: 6 }, { clb: 8, single: 3, spouse: 3 },
  { clb: 7, single: 3, spouse: 3 }, { clb: 6, single: 1, spouse: 1 },
  { clb: 5, single: 1, spouse: 1 }, { clb: 4, single: 0, spouse: 0 },
];

const CRS_CAN_WORK = [
  { years: 5, single: 80, spouse: 70 }, { years: 4, single: 72, spouse: 63 },
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
  { years: 5, pts: 10 }, { years: 4, pts: 9 }, { years: 3, pts: 8 },
  { years: 2, pts: 7 }, { years: 1, pts: 5 }, { years: 0, pts: 0 },
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

export function convertToClb(test, scores = {}) {
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

export function calcCRS(profile) {
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
  // IRCC: a single post-secondary credential (including a bachelor's) uses
  // the 13/25 band. Only multiple credentials, a master's or a PhD use 25/50.
  const isP2 = ["phd", "masters", "two_plus"].includes(eduLevel);
  const isP1 = ["bachelors", "two_year", "one_year"].includes(eduLevel);
  let elp = isP2 && minClb >= 9 ? 50 : isP2 && minClb >= 7 ? 25 : isP1 && minClb >= 9 ? 25 : isP1 && minClb >= 7 ? 13 : 0;
  let ecp = isP2 && canYears >= 2 ? 50 : isP2 && canYears >= 1 ? 25 : isP1 && canYears >= 2 ? 25 : isP1 && canYears >= 1 ? 13 : 0;
  const fy = parseInt(profile.foreignWorkYears) || 0;
  let fwlp = fy >= 3 && minClb >= 9 ? 50 : fy >= 3 && minClb >= 7 ? 25 : fy >= 1 && minClb >= 9 ? 25 : fy >= 1 && minClb >= 7 ? 13 : 0;
  let fwcp = fy >= 3 && canYears >= 2 ? 50 : fy >= 3 && canYears >= 1 ? 25 : fy >= 1 && canYears >= 2 ? 25 : fy >= 1 && canYears >= 1 ? 13 : 0;
  // The education combinations share one 50-point cap; foreign-work
  // combinations share another. The overall transferability cap is 100.
  breakdown.skillTransfer = Math.min(Math.min(elp + ecp, 50) + Math.min(fwlp + fwcp, 50), 100);

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
