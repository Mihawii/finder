import { onRequest } from "firebase-functions/v2/https";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// ============================================================
// READ IMMIGRATION DATA FILES (copied by predeploy script)
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const staticData = readFileSync(join(__dirname, "IMMIGRATION_DATA.md"), "utf-8");
const updatesData = readFileSync(join(__dirname, "IMMIGRATION_DATA_UPDATES.md"), "utf-8");

// ============================================================
// SYSTEM PROMPT — Instructions + data from files
// ============================================================

const SYSTEM_PROMPT = `You are PathwayFinder's immigration pathway advisor. You analyze candidate profiles against Canadian immigration programs using the latest verified data provided below.

You MUST return ONLY valid JSON. No markdown, no backticks, no preamble text, no explanation outside the JSON.

Every field value must contain ONLY final, polished text written for the end user — no reasoning, no self-corrections, no meta-commentary, no step-by-step working, and never filler words like "WAIT", "actually", or "let me reconsider". Do any analysis silently and write only the final conclusion.

JSON SCHEMA — return exactly this structure:
{
  "profile": { "summary": string, "strengths": [string], "gaps": [string] },
  "crs": { "total": number, "competitiveness": string, "keyInsight": string },
  "scoreAnalysis": {
    "losses": [{ "category": string, "currentPoints": number, "maxPoints": number, "pointsLost": number, "explanation": string, "fixable": boolean }],
    "opportunities": [{ "action": string, "pointsGain": number, "difficulty": "easy"|"medium"|"hard", "timeframe": string, "cost": string, "explanation": string }],
    "projectedScore": string
  },
  "pathways": [{ "rank": number, "name": string, "stream": string, "chance": number, "timeline": string, "cost": string, "status": "active"|"limited"|"changing"|"requires_action", "why": string, "requirements": [{ "item": string, "met": boolean }], "details": { "description": string, "applicationProcess": [string], "processingTime": string, "officialLink": string, "alternatives": string, "improvementTips": string } }],
  "actionPlan": [{ "step": number, "action": string, "where": string, "cost": string, "time": string, "priority": "urgent"|"high"|"medium" }],
  "costs": { "total": string, "items": [{ "name": string, "amount": number }] },
  "timeline": [{ "month": string, "label": string, "tasks": string }],
  "dataDisclaimer": string
}

FIELD RULES:
- "total" in crs: use the CRS score from the user profile — do NOT recalculate
- "chance" (0-100): an informed estimate based on profile fit vs program requirements and recent draw patterns, NOT a guarantee. 80-95 = meets ALL requirements + score well above cutoffs. 60-79 = meets most + competitive. 40-59 = borderline or limited spots. 20-39 = has gaps to fill. 5-19 = major barriers. Never use 0 or 100.
- "status": "active" = currently accepting, "limited" = few spots or infrequent draws, "changing" = redesign or restructuring underway, "requires_action" = candidate must do something first
- Include 3-5 pathways ranked by chance
- All text fields must use plain English — explain every acronym the first time (e.g. "CEC (Canadian Experience Class)")
- "where" in actionPlan must be a specific website (e.g. "ircc.canada.ca", "oinp.gov.on.ca")
- "dataDisclaimer": set to "Data valid as of [date from the data below] — verify current program details on official sites."

SCORE ANALYSIS RULES (most important section):
- "losses": list EVERY CRS category where user loses more than 10 points below max. Categories: Age (max 110), Education (max 150), First Language (max 136), Second Language (max 24), Canadian Work (max 80), Spouse Factors (max 40), Skill Transferability (max 100), Additional Points (max 600). Use the CRS BREAKDOWN values provided in the user prompt. Mark fixable=false for unchangeable factors (age, past education). Mark fixable=true for improvable factors (language, Canadian work, French).
- "opportunities": list 3-5 concrete actions ranked by pointsGain (highest first). Each must include realistic pointsGain, difficulty (easy=test/form, medium=2-6 months, hard=6+ months or major life change), timeframe, and cost in CAD. IMPORTANT: Always reference the user's ACTUAL TEST SCORES, not CLB levels. Use the test type and scores from the profile. Example — WRONG: "Improve IELTS Writing from CLB 8 to CLB 9". RIGHT: "Improve IELTS Writing from 6.5 to 7.0 (which raises your CLB from 8 to 9)". Only mention CLB in parentheses as context. Only suggest realistic opportunities.
- "projectedScore": must be REALISTIC. Rules: 1) Do NOT include Provincial Nomination (+600) in the projected score calculation. 2) Only sum the top 2-3 achievable improvements (language, French, work experience). 3) The projected score must NEVER exceed currentScore + 200. 4) Example: if CRS is 333, projected might be 390-450, NEVER 900+. Frame positively: "Your score could go from X → Y, which puts you in range for Z draws"

CRITICAL RULES:
- You are NOT providing immigration advice or legal advice
- Do NOT recommend ECA (Educational Credential Assessment) for Canadian credentials — Canadian degrees do not need ECA
- Do NOT recommend Quebec programs (not covered by this tool)
- Do NOT recommend family sponsorship through siblings (siblings cannot sponsor)
- Do NOT claim job offers currently add CRS points — job offer CRS points were removed effective March 25, 2025 per Ministerial Instructions. IRCC described this as a "temporary measure" and has indicated interest in reintroducing points for high-wage occupations as of March 2026, but no implementation date has been published. Job offers are still required for FST eligibility and some PNP streams.
- Do NOT recommend programs that are CLOSED or SUSPENDED as active options
- Do NOT give chance above 80% unless profile is an extremely strong match
- Do NOT say "guaranteed" or "certain" about any outcome
- Be honest about low chances — do not inflate numbers
- If a profile has red flags (refusals, criminal history), acknowledge them honestly
- SETTLEMENT FUNDS CHECK (MANDATORY): Work through this in order. (1) Calculate family size from the profile: 1 = applicant, +1 if the spouse is accompanying, + the number of dependent children. (2) Look up the required minimum for that family size: 1 person=$15,263, 2=$19,001, 3=$23,360, 4=$28,362, 5=$32,168, 6=$36,280, 7+=$40,392. (3) Compare the applicant's settlement funds to that minimum, then write ONLY the outcome that applies:
  - If funds are BELOW the minimum: treat it as an FSW eligibility problem — (a) list it in "gaps" as the FIRST item, worded exactly like "Settlement funds ($X) below minimum ($Y required for family of Z) — FSW ineligible until resolved", (b) add it to "actionPlan" as step 1 with priority "urgent", and (c) note it in the "requirements" of any FSW-dependent pathway.
  - If funds MEET OR EXCEED the minimum: funds are sufficient — do NOT list settlement funds in "gaps", do NOT add a settlement-funds step to "actionPlan", and do NOT mark settlement funds as an unmet requirement. Omit the topic entirely.
  Decide which single case applies and output only that result — never both cases, and never the comparison reasoning itself. Exemption: CEC applicants and applicants with a valid job offer are exempt from the settlement-funds requirement.
- CRITICAL: Only recommend the Study Pathway (Study Permit → PGWP → PR) if the user's profile includes "Open to study pathway: Yes". If it says "No", do NOT include any study-based pathway in the recommendations. This is mandatory.
- CATEGORY-BASED DRAW RESTRICTION: Do NOT recommend category-based draws (Healthcare, STEM, Trade, Agriculture, Education) unless the user's profile explicitly mentions working in that sector. TEER level alone does not determine sector eligibility. If the user's specific occupation or sector is unknown, only recommend general Express Entry draws (CEC, FSW, PNP, French-language). Never assume a candidate works in healthcare, STEM, trades, or any specific sector based only on their education level or TEER.
- NO ASSUMPTIONS RULE: When recommending pathways, only use information the user actually provided. Do not infer or assume occupation, employer, sector, or field of work. If key information is missing, note it as a limitation in the report rather than guessing.

=== STATIC PROGRAM DATA ===
${staticData}

=== LATEST DRAW & UPDATE DATA ===
${updatesData}`;

// ============================================================
// EDUCATION LABELS — mirrors the client-side CRS_EDUCATION
// ============================================================

const EDUCATION_LABELS = {
  phd: "PhD",
  masters: "Master's / professional degree",
  two_plus: "Two or more credentials (one 3+ yr)",
  bachelors: "Bachelor's degree (3+ yr)",
  two_year: "2-year post-secondary",
  one_year: "1-year post-secondary",
  high_school: "High school diploma",
  below_hs: "Less than high school",
};

// ============================================================
// BUILD USER PROMPT from profile + breakdown
// ============================================================

function buildUserPrompt(profile, breakdown) {
  const clb = profile.clb || {};
  const minClb = Math.min(
    clb.reading || 0,
    clb.writing || 0,
    clb.listening || 0,
    clb.speaking || 0
  );

  return `Analyze this immigration candidate profile:

AGE: ${profile.age || "Not provided"}
MARITAL STATUS: ${profile.maritalStatus}${profile.spouseAccompanying ? " (spouse accompanying)" : ""}
DEPENDENTS: ${profile.dependentChildren || 0} children
CITIZENSHIP: ${profile.citizenship || "Not provided"}

EDUCATION: ${EDUCATION_LABELS[profile.education] || "Not provided"}
Education country: ${profile.educationCountry || "Not provided"}
ECA obtained: ${profile.ecaObtained ? "Yes" : "No"}
Canadian education: ${profile.canadianEducationYears || 0} years

FIRST LANGUAGE (${profile.firstLangTest?.toUpperCase() || "IELTS"}):
CLB scores — R:${clb.reading || "?"} W:${clb.writing || "?"} L:${clb.listening || "?"} S:${clb.speaking || "?"}
Minimum CLB: ${minClb || "?"}
${profile.hasSecondLang ? `FRENCH: Yes (${profile.secondLangTest?.toUpperCase()})` : "FRENCH: No"}

WORK EXPERIENCE:
Foreign skilled work: ${profile.foreignWorkYears || 0} years
Canadian skilled work: ${profile.canadianWorkYears || 0} years
NOC TEER level: ${profile.nocTeer || "Not provided"}

CURRENT STATUS:
In Canada: ${profile.inCanada ? "Yes" : "No"}${profile.inCanada ? `\nProvince: ${profile.currentProvince}\nWork permit: ${profile.currentWorkPermitType}\nMonths with employer: ${profile.monthsWithEmployer || 0}` : ""}

CONNECTIONS:
Sibling in Canada: ${profile.siblingInCanada ? "Yes" : "No"}
Provincial nomination: ${profile.provincialNomination ? "Yes" : "No"}
Province preference: ${profile.provincePreference || "Open to any"}
Job offer: ${profile.hasJobOffer ? "Yes" : "No"}
Settlement funds: $${profile.settlementFunds || "Not provided"} CAD
Family size for settlement: ${1 + (profile.spouseAccompanying ? 1 : 0) + (parseInt(profile.dependentChildren) || 0)} people

${
  profile.spouseAccompanying
    ? `SPOUSE:
Education: ${EDUCATION_LABELS[profile.spouseEducation] || "Not provided"}
Canadian work: ${profile.spouseCanadianWorkYears || 0} years`
    : ""
}

FLAGS:
Previous refusals: ${profile.previousRefusals ? "YES" : "No"}
Criminal history: ${profile.criminalHistory ? "YES" : "No"}
Quebec intent: ${profile.quebecIntent ? "YES" : "No"}
Open to study pathway: ${profile.openToStudy ? "Yes" : "No"}
Open to any province: ${profile.openToAnyProvince ? "Yes" : "No"}

CRS SCORE BREAKDOWN:
Total: ${breakdown.total}
- Age: ${breakdown.age}/110
- Education: ${breakdown.education}/150
- First language: ${breakdown.firstLanguage}/136
- Second language: ${breakdown.secondLanguage}/24
- Canadian work: ${breakdown.canadianWork}/80
- Spouse factors: ${breakdown.spouse}/40
- Skill transferability: ${breakdown.skillTransfer}/100
- Additional: ${breakdown.additional}/600`;
}

// ============================================================
// RESPONSE SANITIZATION
// ============================================================

// Parse the model's JSON response, tolerating ```json fences / surrounding prose.
// Returns the parsed object, or null if it can't be parsed (e.g. truncated).
function extractReportJson(text) {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || first >= last) return null;
  try {
    return JSON.parse(text.substring(first, last + 1));
  } catch {
    return null;
  }
}

// Deterministic safety net (belt-and-suspenders on top of the prompt instructions):
// a gap should never reassure or contradict itself. Strip any gap entry that either
// (a) references settlement funds AND claims sufficiency, or (b) contains a reassurance
// phrase outright. Mutates the report in place and logs each removal.
function sanitizeGaps(report) {
  const REASSURANCE = ["no gap here", "funds are sufficient", "is sufficient", "are sufficient", "not a gap"];
  const contradictoryFundsGap = (low) => {
    const fundsRef = low.includes("settlement fund") || (low.includes("fund") && low.includes("minimum"));
    const sufficiency = ["sufficient", "no gap", "not a gap", "meets minimum", "meets the minimum", "exceed"].some((p) => low.includes(p));
    return fundsRef && sufficiency;
  };
  const shouldStrip = (g) => {
    if (typeof g !== "string") return false;
    const low = g.toLowerCase();
    return REASSURANCE.some((p) => low.includes(p)) || contradictoryFundsGap(low);
  };
  const scrub = (arr, where) => {
    if (!Array.isArray(arr)) return;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (shouldStrip(arr[i])) {
        console.warn(`[analyzeProfile] Stripped contradictory/reassuring gap from ${where}: ${JSON.stringify(arr[i])}`);
        arr.splice(i, 1);
      }
    }
  };
  if (report && report.profile) scrub(report.profile.gaps, "profile.gaps");
  if (report) scrub(report.gaps, "gaps");
}

// ============================================================
// CLOUD FUNCTION — analyzeProfile
// ============================================================

export const analyzeProfile = onRequest(
  { cors: true, timeoutSeconds: 300, memory: "512MiB" },
  async (req, res) => {
    // Only allow POST
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { profile, breakdown } = req.body;

    if (!profile || !breakdown) {
      res.status(400).json({ error: "Missing profile or breakdown data" });
      return;
    }

    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_KEY });

      const userPrompt = buildUserPrompt(profile, breakdown);

      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      const text =
        message.content?.map((b) => b.text || "").join("") ||
        '{"error": "Empty response from AI"}';

      // Parse the model's JSON (it often wraps output in ```json fences) so we can
      // sanitize before returning. If it won't parse (e.g. truncated), fall back to the
      // raw text so the client can attempt its own repair.
      const parsed = extractReportJson(text);
      if (!parsed) {
        res.status(200).json({ raw: text });
        return;
      }

      // Deterministic safety net: strip self-contradictory / reassuring "gaps" entries.
      sanitizeGaps(parsed);

      // Return the sanitized JSON — client will parse it
      res.status(200).set("Content-Type", "application/json").send(JSON.stringify(parsed));
    } catch (err) {
      console.error("Anthropic API error:", err);
      res.status(500).json({
        error: "Failed to generate analysis",
        message: err.message,
      });
    }
  }
);

// ============================================================
// PROMO CODE VALIDATION
// ============================================================

const VALID_PROMO_CODES = ["PATHFINDER23"];

export const validatePromoCode = onRequest(
  { cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { code } = req.body || {};
    if (!code || typeof code !== "string") {
      res.json({ valid: false });
      return;
    }

    const isValid = VALID_PROMO_CODES.includes(code.trim().toUpperCase());
    res.json({ valid: isValid });
  }
);
