---
name: Project Architecture
description: Full architecture of PathwayFinder - directory structure, tech stack, data flow, APIs, deployment config
type: project
---

# PathwayFinder Architecture

## Directory Structure
```
/
├── index.html                          # HTML entry point
├── package.json                        # React 18, Vite 6 dependencies
├── vite.config.js                      # Dev server on port 3000, proxy to Firebase emulator
├── firebase.json                       # Hosting (dist/), function sources, rewrites
├── .firebaserc                         # Project: pathwayfinder-3b040
├── dev.config.js                       # Dev mode: pre-filled form + mock report (335 lines)
│
├── CLAUDE.md                           # Agent instructions
├── CRS_RULES.md                        # CRS formula spec + 3 known bugs
├── REPORT_RULES.md                     # AI report JSON schema + validation rules
├── IMMIGRATION_DATA.md                 # Static program rules, costs, provincial structures
├── IMMIGRATION_DATA_UPDATES.md         # Dynamic draws, CRS cutoffs, program changes (updated daily)
├── IMMIGRATION_DATA_LOGS.md            # Changelog for immigration data files
├── SETUP.md                            # Local dev setup guide
│
├── src/
│   ├── main.jsx                        # React root render (10 lines)
│   └── assessment_flow.jsx             # Form UI components (1,392 lines)
│
├── pathwayfinder-app (2).jsx           # MAIN APP FILE (3,746 lines)
│   ├── CRS calculator engine           #   Lines ~1-800: scoring tables, language converters
│   ├── Form field components           #   Lines ~800-1500: UI components
│   ├── AI analysis integration         #   Lines ~1500-2200: API calls, report generation
│   ├── Report rendering                #   Lines ~2200-3200: report display components
│   ├── Promo code gate                 #   Lines ~3200-3500: free vs paid logic
│   └── Main App component              #   Lines ~3500-3746: app orchestration
│
├── functions/                          # Node.js Cloud Functions
│   ├── index.js                        # analyzeProfile + validatePromoCode (326 lines)
│   ├── package.json                    # Node 20, firebase-functions, @anthropic-ai/sdk
│   └── .env                            # ANTHROPIC_KEY (secret - not in git)
│
├── pdf-function/                       # Python Cloud Function
│   ├── main.py                         # HTTP handler (45 lines)
│   ├── generate_report.py              # PDF engine with ReportLab (919 lines)
│   ├── requirements.txt                # Flask, ReportLab, firebase-functions
│   └── venv/                           # Python virtualenv (not in git)
│
└── dist/                               # Vite build output (deployed to Firebase Hosting)
```

## Data Flow
```
1. User fills 6-step assessment form
   (Personal → Education → Language → Work → Connections → Status)

2. CRS score calculated in-browser (real-time)
   - Language test scores → CLB conversion (lookup tables)
   - 8 scoring categories applied
   - Two-column logic: "single" vs "spouse" (higher/lower point caps)
   - Skill transferability: education+language, education+Canadian work,
     foreign work+language, foreign work+Canadian work
   - Additional points: provincial nomination, Canadian education, sibling, French

3. Promo code gate
   - Free users: CRS score + basic summary + blurred full report
   - Code PATHFINDER23: unlocks full report
   - Validated server-side via POST /api/validatePromoCode

4. AI report generation
   - POST to Cloud Function analyzeProfile (or direct Cloud Run URL)
   - Cloud Function builds prompt from profile + CRS breakdown
   - Sends to Claude Sonnet with 160+ line system prompt
   - Claude returns structured JSON (profile, crs_analysis, score_analysis,
     pathways[5], action_plan, costs, timeline)
   - 3 retry attempts on 502 errors, 120s timeout

5. Report rendered in browser
   - Profile summary with strengths/gaps
   - CRS breakdown with losses & opportunities
   - 5 ranked immigration pathways (chance 0-100%)
   - 6+ step action plan with costs & websites
   - 18-month timeline
   - Settlement fund requirements

6. Optional PDF download
   - POST report JSON to Python Cloud Function
   - ReportLab generates professional A4 PDF
   - Returns PDF file for download
```

## API Endpoints
| Endpoint | Method | Function | Runtime |
|----------|--------|----------|---------|
| `/api/analyzeProfile` | POST | analyzeProfile | Node.js 20 |
| `/api/validatePromoCode` | POST | validatePromoCode | Node.js 20 |
| Cloud Run direct URL | POST | generatePdf | Python 3.12 |

## Firebase Config
- **Hosting:** serves `dist/` folder
- **Rewrites:** `/api/analyzeProfile` → function, `**` → `/index.html` (SPA)
- **Functions:** 2 codebases (node-functions, pdf-functions)
- **Cloud Run direct URL** used for analyzeProfile to bypass Firebase rewrite timeout

## CRS Scoring Categories
1. Age (max 110 single / 100 spouse)
2. Education (max 150 single / 140 spouse)
3. First official language (max 136 single / 128 spouse)
4. Second official language (max 24 single / 22 spouse)
5. Canadian work experience (max 80 single / 70 spouse)
6. Spouse factors (max 40 if applicable)
7. Skill transferability (max 100)
8. Additional points (max 600)
**Total max: 1,200 points**

## Supported Language Tests
- IELTS General → CLB (score ranges)
- CELPIP → CLB (whole numbers)
- PTE Core → CLB (score ranges)
- TEF Canada → CLB (score ranges)
- TCF Canada → CLB (score ranges)
- CLB Direct (no conversion needed)

## Version History
- v1: Initial version
- v2: Landing page, report page, loading screen, March 2026 data
- v3: Bug fixes before PDF redesign
- v4: Working PDF with ReportLab
- v5: CRS accuracy improvements
- v5.1: AI settlement funds check
- v6: Promo code gating (current)
