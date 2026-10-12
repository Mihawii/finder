# PathwayFinder report contract — version 2.0

## Ownership and request flow

`functions/lib/assessment/validation.js` validates the normalized profile, recomputes language levels from official test scores and calculates the canonical CRS breakdown. `functions/index.js` sends those facts and the deterministic funds result to the model. `functions/lib/report.js` parses, validates and finalizes the response for both server and browser.

The API request contains `{ "profile": { ... } }`. Any compatibility `breakdown` or client-supplied CLBs must be ignored by the server. Invalid profile input returns HTTP 400 with `{ error, issues: [{ field, message }] }`. Truncated or malformed reports return an error, not a repaired or partially invented success. Do not log applicant facts or model responses.

The model supplies explanations and preliminary pathway requirements. Code owns CRS totals, category maxima/losses, score scenarios, funds comparisons, version/destination metadata and snapshot dates. This separation does not make model-written program requirements a verified eligibility engine.

## Final report shape

This is the contract outline; the runtime validator is in `functions/lib/report.js`.

```text
profile: { summary: string, strengths: string[], gaps: string[] }
crs: { total: number, competitiveness: string, keyInsight: string }
scoreAnalysis:
  losses: [{ category, currentPoints, maxPoints, pointsLost, explanation, fixable }]
  opportunities: [{ id, action, pointsGain, difficulty, timeframe, cost, explanation }]
  projectedTotal: number
  projectedScore: string
pathways: [{
  rank, name, stream, timeline, cost, status, why,
  requirements: [{ item: string, met: true | false | null }],
  requirementState,
  details?: { description, applicationProcess: string[], processingTime,
              officialLink, alternatives, improvementTips }
}]
actionPlan: [{ step, action, where, cost, time, priority }]
costs: { total: string, items: [{ name: string, amount: nonnegative number }] }
timeline: [{ month, label, tasks }]
assessment: { version: "2.0", destination: "ca", breakdown, funds,
              dataAsOf: date | null, dataStale: boolean, limitations: string[] }
dataDisclaimer: string
```

`pathways` may contain zero to five entries. Never pad results to reach a quota. The model's legacy `chance` field is discarded; neither the UI nor report exports may show approval probabilities or numerical match confidence.

`requirements.met` means:

| Value | Meaning | Display |
|-------|---------|---------|
| `true` | Supplied facts support this preliminary requirement | Check mark; still subject to review |
| `false` | A known gap is identified | Gap |
| `null` | Facts or verification are missing | Unknown, never a failed requirement |

`requirementState()` returns `Gaps identified`, `Missing information`, `Review requirements` or `Needs review`. None means the application is eligible, approved or ready for filing. Program status is separate: `active`, `limited`, `changing`, `requires_action` or `unverified`.

## Deterministic calculations

- Always use the shared `calcCRS()` output, not a score supplied by the browser or model.
- Category maxima reflect whether spouse factors apply. A difference from a category maximum is not a missing eligibility requirement.
- `scoreScenarios()` evaluates English at least CLB 9 and French at least NCLC 7 while preserving higher existing levels. It recomputes their combined effect through the shared calculator; never add individual gains because factors interact and share caps.
- Scenarios are conditional illustrations, not predictions, category-draw eligibility or recommendations to buy courses. Display their assumptions and explanation. Additional simulator choices must also recompute the profile, not use fixed point deltas.
- `assessSettlementFunds()` returns `sufficient`, `insufficient`, `exempt` or `unknown`, alongside `required`, `available`, `familySize`, `sourceUrl`, `verifiedAt` and supporting metadata. Show the actual comparison and route caveat instead of claiming a universal immigration funds threshold.
- The funds table is for Express Entry FSW/FST. Count the applicant, spouse/common-law partner and all dependent children of either partner once, including non-accompanying family and Canadian citizens/PRs. A separated family composition remains unresolved for review.
- CEC is exempt when evaluating that specific program. Otherwise, an offer-based exemption requires both a valid job offer and authorization to work in Canada. An unanswered exemption question stays unknown. Canadian work experience alone does not select the CEC exemption.
- The normalizer removes model-written funds gaps/actions that conflict with the canonical check and adds a conditional shortfall action when needed. Other program-specific financial rules require separate verification.

Funds source checked on 2026-10-11: [IRCC proof of funds](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html). The source table remains effective July 7, 2025; this check does not establish that other program data is current.

## Sources and limitations

The system prompt loads the deployed copies of `IMMIGRATION_DATA.md` and `IMMIGRATION_DATA_UPDATES.md`. Firebase predeploy copies these files into `functions/`. `dataAsOf` comes from the updates file's `Last Fetched` field, currently 2026-06-15. Do not describe this as a daily or live feed. Unknown/invalid dates or snapshots older than 30 days mark program status `unverified`. This date check does not itself verify individual programs even when the snapshot is recent.

Use explicit profile facts only. Do not infer occupation or sector from TEER/education. Do not recommend occupation-specific draws without the necessary NOC and experience evidence. Do not recommend Quebec or family sponsorship. Only offer study-based possibilities when `openToStudy` is true. Treat refusals/admissibility answers as review needs rather than automatic ineligibility.

Costs, processing times and invitations are conditional and may change. Use official sources and dated estimates; do not invent fees, links, program availability or outcomes. A disclaimer is not a substitute for reliable calculations or professional review of the intended commercial service.

## Preparation is a separate capability

The preparation route uses `functions/lib/preparation/registry.js` and `model.js`, not the report's preliminary pathway ranking as proof of eligibility. Its session-only worksheet has sourced route scope, confirmable facts, unresolved questions and partial coverage. No official PDFs are filled, no application is submitted, no documents are uploaded and no complete family application is produced.

Before offering saved applications or filing-ready outputs, require route-specific professional review, complete form inventories, authenticated portal mapping, proven official-PDF fill/validate/save/reopen behavior, account authorization, protected storage and retention/deletion controls. User confirmation of a note does not verify an official document or eliminate an unknown answer.

## Verification

Run `npm test`, `npm run typecheck` and `npm run build` for relevant contract changes. Tests cover server recomputation, invalid input, preserved uncertainty, no probabilities, deterministic scenarios, funds, partial preparation and chronology. Exercise success/error/retry flows in the browser and render the informational PDF when changing its adapter. HTML, share text and PDF must preserve identical unknown states and calculation meaning. Keep hosting and both function codebases compatible during rollout; local changes are not a deployment.
