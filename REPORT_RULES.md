# PathwayFinder Report Generation Rules

## Purpose
This file defines how the AI-generated immigration report must be structured, what data is verified, and what rules the AI must follow. This prevents hallucinations and ensures accuracy.

## Architecture
- The Cloud Function (`functions/index.js`) sends user profile data to Claude API
- Claude must return ONLY valid JSON matching the schema below
- The frontend (`src/App.jsx`) renders the JSON as visual components
- The system prompt in the Cloud Function must embed the verified data from this file

---

## JSON OUTPUT SCHEMA

Claude must return ONLY this JSON structure. No markdown, no backticks, no preamble text.

```json
{
  "profile": {
    "summary": "3-4 sentence plain-English summary of the candidate",
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "gaps": ["gap 1", "gap 2"]
  },
  "crs": {
    "total": 453,
    "competitiveness": "One sentence summary of where they stand",
    "keyInsight": "The single most important thing they should know about their score"
  },
  "scoreAnalysis": {
    "losses": [
      { "category": "Age", "currentPoints": 55, "maxPoints": 110, "pointsLost": 55, "explanation": "At age 38, you're losing 55 points compared to someone aged 20-29. Unfortunately, this cannot be changed.", "fixable": false },
      { "category": "Canadian Work", "currentPoints": 0, "maxPoints": 80, "pointsLost": 80, "explanation": "You have no Canadian work experience, which costs you up to 80 points. Even 1 year would add 40 points.", "fixable": true }
    ],
    "opportunities": [
      { "action": "Improve IELTS to CLB 9+ in all abilities", "pointsGain": 25, "difficulty": "medium", "timeframe": "2-3 months", "cost": "$320", "explanation": "Your Writing and Speaking are at CLB 7. Reaching CLB 9 in all four abilities would add approximately 25 CRS points." },
      { "action": "Learn French to NCLC 7", "pointsGain": 50, "difficulty": "hard", "timeframe": "6-12 months", "cost": "$2,000-4,000", "explanation": "French proficiency at NCLC 7+ adds 25-50 bonus CRS points AND makes you eligible for French-language draws with cutoffs as low as 379." },
      { "action": "Get 1 year Canadian work experience", "pointsGain": 40, "difficulty": "hard", "timeframe": "12 months", "cost": "N/A", "explanation": "One year of skilled Canadian work adds 40 CRS points and makes you eligible for CEC (Canadian Experience Class)." }
    ],
    "projectedScore": "If you improve IELTS to CLB 9 (+25 pts) and learn French to NCLC 7 (+50 pts), your CRS could reach approximately 528 — above the CEC cutoff of 509."
  },
  "pathways": [
    {
      "rank": 1,
      "name": "Full Program Name",
      "stream": "Specific Stream Name",
      "chance": 78,
      "timeline": "6-12 months",
      "cost": "$1,350",
      "status": "active",
      "why": "2-3 sentences explaining why this fits, in plain English",
      "requirements": [
        { "item": "Requirement description", "met": true },
        { "item": "Requirement description", "met": false }
      ]
    }
  ],
  "actionPlan": [
    {
      "step": 1,
      "action": "What to do in plain English",
      "where": "specific-website.ca",
      "cost": "$300",
      "time": "5-7 weeks",
      "priority": "urgent"
    }
  ],
  "costs": {
    "total": "$4,800 - $6,200",
    "items": [
      { "name": "Cost item name", "amount": 320 }
    ]
  },
  "timeline": [
    {
      "month": "Month 1-2",
      "label": "Foundation",
      "tasks": "Create EE profile, order ECA, gather documents"
    }
  ]
}
```

---

## SCORE ANALYSIS RULES (NEW — most important section of the report)

The `scoreAnalysis` section is what makes this report worth paying for. It tells users exactly where they're losing points and how to gain them.

### losses array:
- List EVERY CRS category where the user is losing more than 10 points below max
- Categories to check: Age, Education, First Language, Second Language, Canadian Work, Spouse Factors, Skill Transferability, Additional Points
- For each: show currentPoints, maxPoints, pointsLost, and a plain-English explanation
- Mark `fixable: false` for things they can't change (age, past education level)
- Mark `fixable: true` for things they CAN improve (language scores, Canadian work, French)
- Be specific: "You have CLB 7 in Writing. If you score 7.0+ on IELTS Writing (CLB 9), you'd gain approximately 16 additional points"

### opportunities array:
- List 3-5 concrete actions ranked by points gain (highest first)
- Each must include: action description, exact points gain, difficulty (easy/medium/hard), realistic timeframe, cost in CAD
- Be very specific: "Improve IELTS Writing from 6.0 to 7.0" not just "improve English"
- difficulty guide: easy = just needs a test or form, medium = 2-6 months work, hard = 6+ months or major life change
- Only suggest realistic opportunities — don't suggest "get younger" or "change education"

### projectedScore:
- Calculate what their CRS would be if they did the top 2-3 opportunities
- Compare the projected score to specific draw cutoffs
- Frame it positively: "Your score could go from 337 → 412, which puts you in range for French-language draws (cutoff 379-446)"

---

## CHANCE PERCENTAGE RULES

The `chance` field (0-100) is an INFORMED ESTIMATE, not a guarantee. It must be calculated based on:

### How to estimate chance:
- **80-95%**: Profile meets ALL requirements AND score is well above recent cutoffs AND program is active with regular draws
- **60-79%**: Profile meets most requirements AND score is competitive AND program is active
- **40-59%**: Profile meets requirements but score is borderline OR program has limited spots OR requires additional steps
- **20-39%**: Profile has gaps to fill first (e.g., need French, need Canadian work experience) OR program status uncertain
- **5-19%**: Significant barriers but theoretically possible with major changes
- **Never use 0% or 100%**

### Factors that increase chance:
- CRS score above program's recent draw cutoff (+20%)
- Meeting all mandatory requirements (+15%)
- Program has many allocation spots (+10%)
- Profile matches provincial priority sector (+10%)
- Having Canadian education or work experience (+10%)

### Factors that decrease chance:
- CRS below cutoff (-20%)
- Missing mandatory requirement (-30%)
- Program suspended or restructuring (-25%)
- Very limited allocation spots (-15%)
- Age over 40 for age-sensitive programs (-10%)

---

## VERIFIED DATA — FEBRUARY 2026

### Express Entry Draw Cutoffs (use these exact ranges)
| Draw Type | CRS Range | Frequency |
|-----------|-----------|-----------|
| CEC (Canadian Experience Class) | 509-511 | Every 2 weeks |
| PNP (Provincial Nominee) | 667-855 | Every 2 weeks (includes 600 PNP boost) |
| French-language proficiency | 379-446 | Periodic |
| Healthcare occupations | 400-510 | Periodic |
| Education occupations | 430-470 | Periodic |
| Trade occupations | 350-400 | Periodic |
| STEM | 480-510 | Rare (no draws in 2025) |

### Federal Programs

**Federal Skilled Worker (FSW)**
- Requires: 1 year skilled work (TEER 0-3), CLB 7+, 67/100 selection points, settlement funds
- ECA required for foreign education
- Settlement funds: $15,263 (single) to $40,392+ (family of 7)

**Canadian Experience Class (CEC)**
- Requires: 1 year Canadian skilled work in last 3 years, CLB 7 (TEER 0-1) or CLB 5 (TEER 2-3)
- NO settlement funds required
- NO ECA required

**Federal Skilled Trades (FST)**
- Requires: 2 years trades experience, CLB 5 reading/writing + CLB 4 speaking/listening
- Job offer OR certificate of qualification required

**Study Pathway**
- Route: Study Permit → PGWP → Canadian Work → PR
- 2026 study permit cap: 408,000
- PGWP requirements (Nov 2024 changes): CLB 7 (university) or CLB 5 (college)
- College PGWP requires field-of-study alignment with labor needs

### Provincial Programs

**Alberta AAIP**
- Express Entry Stream: CRS 300+, tech pathway ~1 month processing
- Alberta Opportunity Stream: 12 months Alberta work (6 for PGWP), TEER 0-5, CLB 4-5
- Fee: $500 (EE stream), $1,500 (other streams)
- 2026 allocation: 6,403 spots
- STATUS: Family Connection CLOSED. Tech Pathway ACTIVE.

**Ontario OINP**
- HCP: No draws in 2025, uncertain future
- Skilled Trades: SUSPENDED November 2025
- Masters Graduate / PhD Graduate: May be eliminated late 2026
- Employer Job Offer streams: Phase 1 merger Spring 2026, Phase 2 redesign Late 2026
- Fee: $1,500-$2,000
- 2026 allocation: 14,119 spots
- STATUS: MAJOR REDESIGN IN PROGRESS

**British Columbia PNP**
- Skilled Worker, Health Authority, ELSS streams active
- Graduate streams: ON HOLD since April 2025
- IPG (International Post-Graduate): CLOSED January 2026
- Fee: $1,750 (increased January 2026)
- 2026 allocation: 5,254 spots
- STATUS: Active but limited. Prioritizing high economic impact.

**Saskatchewan SINP**
- 2026 COMPREHENSIVE RESTRUCTURING: sector-based allocation model
- Priority 50% (2,381 spots): Healthcare, Agriculture, Trades, Mining, Manufacturing, Energy, Tech
- Capped 25% (1,190 spots): Food Service, Trucking, Retail (intake windows)
- Other 25% (1,190 spots): All other sectors
- Entrepreneur/Farm: PERMANENTLY CLOSED
- Spousal OWP holders: INELIGIBLE
- PGWP outside SK: INELIGIBLE for SK Experience stream
- Fee: $350
- 2026 allocation: 4,761 spots

**Manitoba MPNP**
- Skilled Worker in Manitoba, Skilled Worker Overseas, International Education streams
- TRRP Hospitality: REMOVED February 2026
- 16 new trades added February 2026
- Fee: $500
- 2026 allocation: TBD

**Atlantic Immigration Program (AIP)**
- NOT a PNP — direct IRCC application
- Requires designated employer + job offer
- NB employer designations: PAUSED February 2026
- 2026 allocation: ~4,000 spots (down from 6,500 in 2024)
- Processing: ~8 months

### Category-Based Draws 2026
**Confirmed categories:**
- French-language proficiency (NCLC 7+ all abilities)
- Healthcare and social services (6+ months experience)
- STEM (6+ months)
- Trade occupations (6+ months)
- Agriculture and agri-food (6+ months)
- Education (6+ months)
- Physicians with Canadian experience (NEW December 2025)

**Proposed (not yet confirmed):**
- Leadership (senior managers)
- Research & Innovation
- National Security & Defence

---

## COSTS REFERENCE (use these exact amounts)

| Item | Cost (CAD) |
|------|-----------|
| IELTS General Training | $320 |
| CELPIP General | $280-320 |
| PTE Core | $300-350 |
| TEF Canada | $350-400 |
| ECA (WES) | $220-300 |
| ECA (ICAS) | $200-250 |
| Express Entry PR application (principal) | $1,365 |
| Express Entry PR application (spouse) | $1,365 |
| Express Entry PR application (dependent child) | $230 |
| Right of Permanent Residence Fee | $515 (included in $1,365) |
| Biometrics | $85/person |
| Medical exam | $200-400/person |
| Police certificates | $25-100/country |
| Alberta AAIP EE stream | $500 |
| Alberta AAIP other streams | $1,500 |
| Ontario OINP | $1,500-$2,000 |
| BC PNP | $1,750 |
| Saskatchewan SINP | $350 |
| Manitoba MPNP | $500 |

---

## RULES THE AI MUST FOLLOW

### Do:
- Use plain English — explain every acronym the first time
- Be specific with numbers (costs, timelines, score thresholds)
- Only recommend programs the person actually qualifies for or can realistically qualify for
- Distinguish between "you qualify now" vs "you could qualify after X"
- Use the verified data above — do not invent draw cutoffs or program requirements
- Include 3-5 pathways ranked by chance percentage
- Be honest about low chances — don't inflate numbers to make people feel good
- Acknowledge when programs are suspended, restructuring, or uncertain

### Do NOT:
- Assume or infer the user's occupation, employer, sector, or field of work from their education level, TEER level, or any other indirect signal. If the user did not explicitly state their sector, do NOT recommend category-based draws (Healthcare, STEM, Trade, Agriculture, Education). Only recommend general Express Entry draws (CEC, FSW, PNP, French-language). Note missing occupation/sector as a limitation in the report.
- Recommend ECA for Canadian credentials (Canadian degrees don't need ECA)
- Recommend Quebec programs (not covered by this tool)
- Recommend family sponsorship through siblings (siblings cannot sponsor)
- Recommend Start-Up Visa unless the profile strongly suggests entrepreneurship
- Invent program names or streams that don't exist
- Use draw cutoff numbers outside the verified ranges above
- Claim job offers add CRS points (REMOVED March 2025)
- Recommend programs that are CLOSED or SUSPENDED as active options
- Give a chance percentage above 80% unless the profile is an extremely strong match
- Say "guaranteed" or "certain" about any outcome

### Age handling:
- If age is 0 or missing, note this gap but don't assume the worst
- Ages 20-29 get maximum CRS age points
- Ages 30-35 still get strong points
- Ages 36-44 get reduced but meaningful points
- Age 45+ gets 0 CRS age points but can still use PNP and other pathways

### Settlement funds (only required for FSW, exempt for CEC and valid job offer):
| Family Size | Amount Required |
|-------------|----------------|
| 1 | $15,263 |
| 2 | $19,001 |
| 3 | $23,360 |
| 4 | $28,362 |
| 5 | $32,168 |
| 6 | $36,280 |
| 7+ | $40,392 + $4,112 per additional |

---

## FRONTEND RENDERING NOTES

When building the ResultsPage component:

### Theme & Colors — HIGH CONTRAST, not dark-green-on-dark-green
- Background: #0a1612 (very dark)
- Cards: #13231c (slightly lighter)
- Primary text: #e8f5ee (near white, high contrast)
- Secondary text: #8fb5a0 (readable sage)
- Accent green: #4ade80 (bright, for positive indicators)
- Accent orange: #fb923c (for warnings/gaps)
- Accent red: #f87171 (for things below cutoff)
- Bar backgrounds: #1e3a2e (visible against card background)
- All text must pass WCAG AA contrast ratio against its background

### Score Analysis Section — THE MOST IMPORTANT PART
This is what makes the report valuable. Render the scoreAnalysis JSON as:

**"Where You're Losing Points" table:**
- Show each category as a row with: category name, current/max points, points lost, explanation
- Color code: red for fixable=false (can't change), orange for fixable=true (opportunity)
- Use a visual bar showing current vs potential

**"How to Gain Points" cards:**
- Each opportunity gets its own card with: action title, "+XX points" in large green text, difficulty badge (easy/medium/hard), timeframe, cost, explanation
- Sort by points gain (highest first)
- These are the money cards — make them visually prominent

**"Projected Score" banner:**
- Full-width highlight showing: "Your score could go from 337 → 528 if you take these steps"
- Show a before/after comparison bar
- Include which draw cutoffs they'd cross

### CRS Gauge
- Circular SVG with animated fill
- Score number large and white, not green-on-green
- Below the gauge: clear red/green badge saying "X pts below CEC cutoff" or "Above CEC cutoff"

### CRS Breakdown Bars
- Use bright colors that contrast against dark background
- Show value/max as white text, not dim green
- Bars should be at least 8px tall with rounded corners

### Draw Cutoff Comparison
- Make it a simple horizontal chart
- Your score = thick bright line (green if above, orange if below)
- Cutoff range = highlighted zone
- Labels must be large enough to read
- Add clear legend

### Pathway Cards
- Large rank number
- Status badge: bright green for active, bright yellow for limited, bright orange for changing
- Chance percentage: large number, color-coded (green 60+, yellow 40-59, orange below 40)
- Animated progress bar
- Requirements: bright green checkmark ✅ or bright red ❌
- "Why this fits" explanation in a left-bordered box

### Costs
- Horizontal bar chart, sorted largest first
- Dollar amounts in white monospace font
- Bars use gradient green

### Timeline
- Vertical line with dots
- Each step: month label, title, description
- Animated reveal on scroll

### General
- All animations should stagger on load
- Fonts: DM Sans for body, DM Mono for numbers, Playfair Display for headings
- Mobile responsive — single column on small screens

---

## INTERACTIVE FEATURES (Round 1)

### Feature 1: Tooltips on All Terms
Add hover tooltips to every technical term, acronym, percentage, and badge in the report. Implement as a reusable `<Tooltip text="explanation">` wrapper component that shows a small popup on hover (desktop) or tap (mobile).

**Required tooltips (minimum):**
| Term | Tooltip Text |
|------|-------------|
| CRS | "Comprehensive Ranking System — Canada's scoring system for Express Entry candidates. Score out of 1,200." |
| CLB | "Canadian Language Benchmark — Canada's standard for measuring language ability. CLB 7 ≈ IELTS 6.0" |
| CEC | "Canadian Experience Class — an Express Entry program for people with Canadian work experience" |
| FSW | "Federal Skilled Worker — an Express Entry program for skilled workers with foreign experience" |
| FST | "Federal Skilled Trades — an Express Entry program for people with trades qualifications" |
| PNP | "Provincial Nominee Program — provinces can nominate candidates, adding 600 CRS points" |
| AAIP | "Alberta Advantage Immigration Program — Alberta's provincial nominee program" |
| OINP | "Ontario Immigrant Nominee Program — Ontario's provincial nominee program" |
| SINP | "Saskatchewan Immigrant Nominee Program" |
| MPNP | "Manitoba Provincial Nominee Program" |
| AIP | "Atlantic Immigration Program — for employers in Canada's Atlantic provinces" |
| ECA | "Educational Credential Assessment — a document that proves your foreign degree is equivalent to a Canadian one" |
| ITA | "Invitation to Apply — if your CRS is high enough, IRCC invites you to apply for permanent residency" |
| PGWP | "Post-Graduation Work Permit — allows international graduates to work in Canada after studying" |
| TEER | "Training, Education, Experience and Responsibilities — Canada's job classification system (TEER 0-5)" |
| NOC | "National Occupational Classification — Canada's system for categorizing jobs" |
| LMIA | "Labour Market Impact Assessment — a document an employer needs to hire a foreign worker" |
| IRCC | "Immigration, Refugees and Citizenship Canada — the federal department that manages immigration" |
| RCIC | "Regulated Canadian Immigration Consultant — a licensed professional who can give immigration advice" |
| EE | "Express Entry — Canada's online system for managing applications for permanent residence" |
| NCLC | "Niveaux de compétence linguistique canadiens — the French equivalent of CLB" |
| PR | "Permanent Residence / Permanent Resident" |

**Percentage tooltips:**
- 75-95% → "Strong match — you meet most or all requirements and your profile is competitive"
- 50-74% → "Moderate match — you're competitive but may need some improvements or the program has limited spots"
- 25-49% → "Possible but challenging — you have gaps to fill or the program is uncertain"
- 5-24% → "Low chance currently — significant changes needed to be competitive"

**Status badge tooltips:**
- ACTIVE → "This program is currently accepting applications with regular draws"
- LIMITED → "This program has few spots, infrequent draws, or restricted eligibility"
- CHANGING → "This program is undergoing redesign or restructuring — requirements may change"
- ACTION REQUIRED → "You need to take specific steps before you can apply to this program"

**Tooltip styling:**
- Background: #1a3a2a
- Border: 1px solid #2D6A4F
- Text: #e8f5ee
- Max width: 280px
- Small arrow pointing to the term
- Fade in animation
- On mobile: tap to show, tap elsewhere to dismiss

### Feature 2: Expandable Pathway Cards
Each pathway card should be expandable. Default view shows the current compact card. Clicking "Show details" expands to reveal:

**Expanded content (AI must include this in JSON):**
Add to each pathway object in the JSON schema:
```json
{
  "details": {
    "description": "Full plain-English description of the program (3-4 sentences)",
    "applicationProcess": [
      "Step 1: Create Express Entry profile at canada.ca",
      "Step 2: Submit Expression of Interest to the province",
      "Step 3: Receive provincial nomination",
      "Step 4: Accept nomination and receive ITA",
      "Step 5: Submit PR application within 60 days"
    ],
    "processingTime": "Current processing: 3-6 months for nomination, then 6 months for PR",
    "officialLink": "https://alberta.ca/aaip",
    "alternatives": "If this doesn't work, consider Saskatchewan SINP or Manitoba MPNP as similar options",
    "improvementTips": "To increase your chances: establish a connection to Alberta through job searching or networking, and improve your IELTS scores"
  }
}
```

**UI behavior:**
- Default: collapsed, shows rank/name/chance/timeline/cost/requirements
- Click "Show full details ▼" → smoothly expands to show description, step-by-step process, processing time, link, alternatives, tips
- Click "Hide details ▲" → collapses back
- Animate with height transition
- Only one card expanded at a time (accordion behavior)

### Feature 3: What-If Score Simulator
Add a section AFTER the CRS Score Analysis called "What If? Score Simulator". This is a CLIENT-SIDE feature — no AI call needed. It uses the existing calcCRS function.

**UI:**
- Section title: "What If? Score Simulator"
- Subtitle: "See how your score changes with different scenarios"
- Show a row of toggle switches, each representing a possible improvement:

| Toggle | What it does | Points impact |
|--------|-------------|---------------|
| "I improve IELTS to 8.0+ all abilities" | Sets all CLB to 9+ | Recalculates language points |
| "I get 1 year Canadian work experience" | Sets canadianWorkYears to 1 | Adds work + skill transfer points |
| "I learn French to CLB 7" | Adds second language CLB 7 all | Adds 2nd lang + bonus points |
| "I get a provincial nomination" | Sets provincialNomination true | Adds 600 points |
| "My spouse improves IELTS to CLB 9" | Sets spouse CLB to 9 all | Recalculates spouse points |

**Behavior:**
- Each toggle recalculates the CRS score in real time using the existing calcCRS() function with modified profile values
- Show the new projected score next to the current score: "337 → 487 (+150)"
- Animate the score change
- Show which draw cutoffs the new score would cross (with green checkmarks)
- The toggles that are relevant depend on the user's profile (don't show "improve spouse IELTS" for single users, don't show "get Canadian work" if they already have it)
- This is the WOW feature — users can play with scenarios and see instant results

**Implementation notes:**
- Clone the current profile object
- Apply the toggle modifications
- Run calcCRS() on the modified profile
- Display the difference
- No API call needed — all client-side

### Feature 4: Comparison Table
Add a section AFTER the pathway cards called "Compare Your Pathways". Shows a side-by-side table.

**Columns:** One for each recommended pathway (3-5 columns)
**Rows:**
- Program name (header)
- Match confidence (with colored percentage)
- Timeline
- Total cost
- Your score vs requirement (green if above, red if below)
- Status badge
- Key requirement you're missing (if any)

**Styling:**
- Horizontal scrollable on mobile
- Highlight the #1 recommended pathway column with a subtle border or background
- Color code: green cells for advantages, orange/red for disadvantages
- Sticky first column (row labels) on mobile scroll

---

## INTERACTIVE FEATURES (Round 2 — implement after Round 1)

### Feature 5: Save/Share/Print
- "Save Report" button → uses browser print API with a print-friendly CSS stylesheet (white background, no animations)
- "Share with Consultant" button → copies a shareable summary to clipboard (text format with key findings)
- Print stylesheet: @media print { hide navigation, use white background, expand all collapsed sections }

### Feature 6: Interactive Checklist
- Action Plan items become checkable
- Store checked state in React state (localStorage not available)
- Show progress: "2 of 6 steps completed"
- Checked items get a strikethrough and green background
- Uncompleted items stay prominent

