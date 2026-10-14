# PathwayFinder — Agent Instructions

## Product and scope

PathwayFinder is a Canadian immigration assessment followed by personalized results and an optional, partial application-preparation worksheet. The current prototype has no database, accounts or document uploads. Preparation drafts exist in browser memory only and disappear on refresh. A report PDF is not an official immigration form.

Read `AGENTS.md` for the required 21st.dev references, shared controls, photography and country-flow preferences. Never route U.S. profiles through Canadian scoring. Do not represent preparation as a complete application, verified eligibility or an available filing service.

## Critical rule: commit after changes

Every agent MUST commit each logical code change with a descriptive message:

```bash
git add .
git commit -m "descriptive message of what changed"
```

Do not skip the commit, batch unrelated tasks or force-push `main`. In coordinated work, respect file ownership and let the coordinating agent commit the integrated logical change; do not stage another agent's unfinished files.

## First steps

1. Read `.claude/projects/-Users-baha-Desktop-my-apps/memory/MEMORY.md` and `architecture.md` there.
2. Read `CRS_RULES.md`, `REPORT_RULES.md` and the three `IMMIGRATION_DATA*.md` files.
3. Check recent git history and the working tree. Older memory notes may describe bugs already fixed; the current shared modules and regression tests are authoritative for implementation.

## Stack and important files

React 18 + Vite, shared pure JavaScript modules, Firebase Cloud Functions (Node 20 / Python 3.12), Anthropic (`claude-sonnet-4-6` in the current backend), ReportLab and Firebase Hosting. Firebase project: `pathwayfinder-3b040`.

| File | Responsibility |
|------|----------------|
| `pathwayfinder-app (2).jsx` | Routing, assessment/results lifecycle, report rendering and service entry |
| `src/report-view.jsx`, `src/styles/report.css` | One active report chapter, related bento cards, scenarios and report export controls |
| `src/assessment_flow.jsx`, `src/assessment-data.js` | Grouped questionnaire, conditional fields, review and form state |
| `functions/lib/assessment/crs.js` | Shared language conversion and CRS calculation |
| `functions/lib/assessment/profile.js` | Form-to-profile mapping; unknowns and nomination types |
| `functions/lib/assessment/validation.js` | Input contract; canonical CLB and CRS recalculation |
| `functions/lib/assessment/funds.js` | Versioned Express Entry funds rule and conditional exemptions |
| `functions/lib/report.js` | Report v2 validation, deterministic scenarios, normalization and snapshot metadata |
| `functions/index.js` | `analyzeProfile`, `validatePromoCode`, model prompt and snapshot loading |
| `src/preparation-flow.jsx` | Session-only preparation wizard and partial text export |
| `functions/lib/preparation/model.js`, `registry.js` | Confirmable facts, chronology checks, route scope and output coverage |
| `pdf-function/main.py`, `generate_report.py` | Informational report PDF export; no official-form filling |
| `tests/*.test.js` | Scoring, validation, report and preparation regression tests |

Keep shared pure modules inside `functions/lib/` so Firebase deploys the same implementation the browser imports. Never duplicate scoring arithmetic in the UI or ask the model to calculate it. Never commit `functions/.env` or log applicant facts/model response bodies.

## Verification

```bash
npm run dev        # Vite on port 3000
npm test           # Node regression tests
npm run typecheck
npm run build
```

Test the actual flows after contract/UI changes. `VITE_ANALYZE_PROFILE_URL` and `VITE_GENERATE_PDF_URL` override the existing production endpoints for staging or local services. Coordinate compatible hosting, Node-functions and PDF-function versions when deploying; a successful local build does not update hosted functions. The existing promo endpoint remains, but the report UI currently bypasses its gate for beta testing; it is not payment authorization.

## Domain constraints

- Validate normalized profiles on the server. Reject non-Canada input; ignore browser-supplied CLBs and breakdowns and recalculate from raw test scores.
- Unknown answers remain unknown. `nocTeer: null` is not TEER 1. A non-Express Entry or unconfirmed nomination adds no CRS nomination points.
- Report v2 has no approval percentages. Requirements use `true`, `false` or `null`; uncertainty must remain visible in the UI and exports.
- CRS scenarios are conditional arithmetic, not eligibility, forecasts or spending recommendations. Preserve the previously fixed spouse-column, French-bonus and language-conversion logic; see `CRS_RULES.md` for the additional corrections verified on 2026-10-11.
- Funds include both partners' dependent children and a spouse even if not accompanying. An offer-based exemption requires both a valid offer and work authorization. Do not infer a CEC application from work experience alone.
- Never recommend Quebec programs, family sponsorship, unverified occupation categories or closed programs as available. Only include a study route when requested in the profile.
- `IMMIGRATION_DATA.md` and `IMMIGRATION_DATA_UPDATES.md` are dated snapshots, not live/daily feeds. The updates file still records 2026-06-15 as its last fetch. The 2026-10-11 checks of CRS, language and funds sources do not refresh those program/draw snapshots.

## Before a production preparation service

The current scope is a partial worksheet for adult, non-business nominees using the Canadian non-Express Entry PNP process. Authentication, persistent profiles, private document storage, professional review, authenticated portal mapping, official PDF compatibility/validation and complete family-member coverage are not implemented. Establish those capabilities and access/retention/deletion controls before claiming a saved or filing-ready application service. Keep published capability labels tied to tested coverage.
