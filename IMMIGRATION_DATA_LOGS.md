# Immigration Data Change Log — PathwayFinder

> This file tracks all changes made to **IMMIGRATION_DATA.md** (static) and **IMMIGRATION_DATA_UPDATES.md** (dynamic).
> New entries are added at the top.

---

## 2026-06-15 — Draw refresh (#406–#418)
- **Added 13 new Express Entry rounds** (#406 through #418, Mar 30 – May 28, 2026) to IMMIGRATION_DATA_UPDATES.md draw table; #418 (French-Language Proficiency, May 28, 2026, 4,500 ITAs, CRS 409) is now the most recent draw.
- Updated "Last Fetched" header to 2026-06-15 and the Draw Results heading to "30 draws held so far".
- Settlement funds and job-offer-points rule unchanged — no contradictions introduced with the hardcoded facts in functions/index.js.
- **Summary-table corrections:** reordered draw table to strict descending (#418→#389); refreshed "Recent CRS Cutoff Ranges" (CEC ~507–518/9, PNP ~710–805/11, French ~393–419/6, added Trade Occupations 477); updated "Key 2026 Express Entry Facts" (header to June 15, total to ~79,800 across 30 draws, next-draw note); updated category-draw tables (French to 6 draws, added Trade occupations row, removed Trade from no-draws-yet); IRCC Draws source-fetch date to 2026-06-15. Other section dates (Settlement Funds, Provincial, Program Changes, Active Categories) left at original dates — not re-verified.

---

## 2026-03-29 — Update by Data Checker Agent
- **Sources fetched:**
  - ✅ IRCC Express Entry Draws (via WebSearch + immigration2canada.com, immigration.ca)
  - ✅ IRCC Category-Based Selection (official page)
  - ✅ IRCC CRS Criteria (official page)
  - ✅ IRCC Settlement Funds (official page)
  - ✅ Alberta AAIP (official page)
  - ✅ Ontario OINP (official page)
  - ✅ BC PNP (via WebSearch — official page returned 404, used CIC News and other sources)
  - ⚠️ Saskatchewan SINP (hub page only — no detailed stream data available)
- **Changes found:**
  - Confirmed all 17 draws (#389–#405) with complete data; no new draws since #405 (Mar 18)
  - Total 2026 ITAs updated to ~52,724 across 17 draws
  - IRCC now lists **10 active categories** for category-based selection (added Transport, Researchers, Skilled military recruits to tracked list)
  - Settlement funds confirmed unchanged (last IRCC update: July 7, 2025)
  - CRS criteria: confirmed job offer points removal (Mar 25, 2025) still in effect; no new changes
  - BC PNP: IPG stream officially closed Jan 7, 2026; graduate streams remain suspended since Apr 2025
  - BC PNP: 2026 draw activity data added (5 entrepreneur draws, 2 SI draws with 889 ITAs)
  - AAIP: documented recent changes (Rural Renewal modifications Nov 2025, additional allocations Sep 2025, PTE Core Apr 2025)
  - OINP: Employer Portal requirement (Jul 2, 2025) documented
  - Added "Program Changes & Announcements" section to track notable changes
  - Added "Data Sources Status" table to track fetch results
- **No changes:** Draw data matches previous file (no new draws since Mar 18)
- **Issues:** BC PNP official URL (welcomebc.ca/immigrate-to-b-c/bc-pnp) returned 404; SINP hub page lacks detailed stream data

---

## March 29, 2026
- **Restructured** immigration data into three separate files:
  - `IMMIGRATION_DATA.md` — static program rules, requirements, costs, provincial structures
  - `IMMIGRATION_DATA_UPDATES.md` — draws, CRS cutoffs, category-based draws, program changes (updated daily)
  - `IMMIGRATION_DATA_LOGS.md` — this changelog
- No content changes; data split only.

## March 18, 2026 (v3-final)
- Added **FSW 67-point selection grid breakdown** table with per-factor maximums and scoring details.
- Job offer CRS bullet now states confirmed facts: removed March 25, 2025 per Ministerial Instructions (confirmed on IRCC CRS criteria page), described as temporary measure, IRCC March 2026 interest in reintroducing for high-wage occupations noted.

## March 18, 2026 (v3 — cleaned & de-speculated)
- Clarified that this file covers **economic + PNP pathways only** (no Quebec/family/caregivers/refugees).
- Express Entry section now clearly marks draw cutoffs as **historical examples**; removed "program cutoff" language.
- Removed or softened any **speculative statements**; job offer CRS now references confirmed IRCC sources.
- FSW and CEC sections updated to describe **program rules** separately from recent CRS outcomes.
- Ontario section rewritten to distinguish between confirmed regulation changes and expected/analyst commentary.
- Provincial sections simplified to **high-level structures** and trends; removed hard-coded predictions.
- Costs and settlement funds clearly labeled as **approximate, example values** requiring verification.
- PGWP language requirements sourced to IRCC official guidance page (effective November 1, 2024).

## March 18, 2026 (v2)
- Added scope/accuracy notes; clarified draws as "so far"; linked PGWP changes to IRCC guidance; added warnings on costs/settlement funds.

## March 18, 2026 (v1)
- Initial creation with detailed provincial and Express Entry data.
