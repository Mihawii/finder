---
name: Project Architecture
description: Canadian assessment/report v2 and session-only preparation prototype; shared modules and production boundaries
type: project
---

# PathwayFinder architecture

Updated 2026-10-13. This describes the current source tree, not a deployment confirmation. Historical `project_state.md` notes predate the shared modules and must not be used to reintroduce already-fixed bugs.

## Product boundary

The core flow remains a Canadian profile assessment and personalized report. A separate partial preparation worksheet supports adult, non-business nominees using the non-Express Entry PNP process. No accounts, database, document uploads, official-form generation or automated submission exist. Both worksheet entry points share one App-level React-memory draft; internal navigation and assessment edits preserve it. Refreshing or closing the tab clears it. Assessment edits do not overwrite confirmed preparation facts. Do not imply that an application has been saved or completed.

## Code ownership

| Location | Responsibility |
|----------|----------------|
| `src/main.jsx` | React entry point |
| `src/country-experience.jsx` | Destination experience and Canada entry; preserve photography/flags |
| `pathwayfinder-app (2).jsx` | Assessment/results/preparation orchestration, report UI and export requests |
| `src/report-view.jsx`, `src/styles/report.css` | Focused report chapters, bento presentation, score scenarios and export actions |
| `src/assessment_flow.jsx`, `src/assessment-data.js` | Grouped assessment and editable review |
| `functions/lib/assessment/crs.js` | Pure CRS tables, conversions and calculation |
| `functions/lib/assessment/profile.js` | Normalized profile with explicit unknowns and nomination type |
| `functions/lib/assessment/validation.js` | Server/browser contract, raw-score validation and recalculation |
| `functions/lib/assessment/funds.js` | Source-dated Express Entry funds comparison |
| `functions/lib/report.js` | Report v2 parser, schema checks, code-owned calculations and metadata |
| `functions/index.js` | Firebase HTTP endpoints and Anthropic request |
| `src/preparation-flow.jsx`, `src/styles/preparation.css` | Partial preparation wizard |
| `functions/lib/preparation/model.js` | Fact sources/confirmation, history rows, gaps and text worksheet |
| `functions/lib/preparation/registry.js` | Versioned route, official sources, supported scope and incomplete outputs |
| `pdf-function/main.py`, `generate_report.py` | Informational report PDF service, separate from official immigration forms |
| `tests/assessment.test.js`, `report.test.js`, `preparation.test.js` | Domain and contract regressions |

Pure shared modules deliberately live under `functions/lib/`: Vite imports them directly and Firebase includes them in the Node function deployment. No copy of scoring logic belongs in the frontend.

The assessment retains the selected 21st.dev wizard's grouped navigation, validation and editable review, with one question or related score group visible at a time. Review displays one selected section. The report shows one of seven chapters at a time; pathway details, plan items and budget views use progressive disclosure. Preparation similarly displays one question, history collection/entry or review section. All answers and drafts remain in React memory during internal navigation.

## Assessment and report flow

```text
Grouped questionnaire + review
  -> mapProfileForCRS(form)
  -> validateAssessmentProfile(normalized input)
  -> canonical local breakdown
  -> analyzeProfile({ profile })
  -> server validation + raw language-score conversion + CRS/funds calculation
  -> model-generated explanatory JSON using dated program snapshots
  -> parseReport / validateReport / finalizeReport
  -> report v2 + optional informational PDF
```

The server never trusts client `clb`, `clb2`, `spouseClb` or `breakdown`. Non-Canada input is rejected. Unknown TEER stays null; combined TEER 4/5 stays combined. Only an Express Entry nomination sets the CRS nomination flag. Unknown exemption facts are retained rather than coerced to false.

Report v2 permits zero to five pathways and uses `requirements.met: true | false | null`; no approval percentages are generated or displayed. Code determines scores, category losses, conditional language scenarios, funds comparisons, report version and date metadata. The model's program explanations still need verification. See `CRS_RULES.md` and `REPORT_RULES.md` for exact contracts and known scope limits.

The promo validation endpoint remains; report access is currently bypassed in the UI for beta testing. Do not assume it implements billing or server authorization.

## Preparation flow

```text
Confirmed route gate
  -> applicant details
  -> family notes + address/activity/travel histories
  -> document reminders
  -> editable review + fact confirmations + unresolved questions
  -> downloadable partial text worksheet
```

Assessment-seeded answers retain their source and require confirmation. Do not derive dates of birth from ages or convert unknown dates into guessed values. Editing a fact resets its confirmation. Chronology checks can highlight gaps; they do not establish complete official application coverage. Authenticated portal mappings, full family-member forms, background declarations, signatures, official PDFs and professional review remain unimplemented. The registry exposes these limits explicitly.

## Program snapshots and sources

- `IMMIGRATION_DATA.md`: dated program rules/costs snapshot.
- `IMMIGRATION_DATA_UPDATES.md`: dated draws/changes; last fetch recorded as 2026-06-15.
- `IMMIGRATION_DATA_LOGS.md`: historical snapshot changes.
- No functioning daily feed is established by these filenames or comments.
- CRS, language conversion guidance and funds sources were checked separately on 2026-10-11; this did not refresh the draw/program snapshots.
- Report metadata preserves `dataAsOf`; stale or unknown program data receives `unverified` status.

## Runtime and deployment

Frontend: React 18/Vite. Node function: Node 20 and Anthropic model configured in `functions/index.js`. PDF function: Python 3.12/ReportLab. Hosting project: `pathwayfinder-3b040`.

Firebase has `node-functions` (`functions/`) and `pdf-functions` (`pdf-function/`) codebases. The Node predeploy step copies the two source-data files into `functions/`. Hosting serves `dist/` and rewrites `/api/analyzeProfile`; verify environment endpoint configuration and emulator proxy before browser testing. Deploy compatible frontend, Node and PDF contract versions together. Never commit `.env` secrets or log applicant facts/model responses.

Run `npm test`, `npm run typecheck` and `npm run build`; also verify browser flows and render report PDFs when relevant. Keep commits atomic and never force-push main.

## Production preparation gates

A saved application service requires a deliberate architecture revision: authenticated profiles, per-applicant/reviewer authorization, private storage, consent, retention/deletion and audit controls. Before filing-ready claims, complete the route inventory, get professional review, verify authenticated portal coverage and test each official PDF through fill, validation, save and reopen. A successful text export proves none of those capabilities.
