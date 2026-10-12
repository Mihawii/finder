# CRS Calculator Rules — PathwayFinder

## Scope and source

The shared calculator is `functions/lib/assessment/crs.js`; the browser and server import the same implementation. `profile.js` maps questionnaire answers, and `validation.js` validates raw test scores and recalculates all CLBs and the score. Do not trust scores supplied by the client or model.

The CRS rows and corrections below were checked against [IRCC CRS criteria](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html) on **2026-10-11**. Language tables were checked against [IRCC language-test guidance](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html). This review did not refresh program availability, draw results or the `IMMIGRATION_DATA*.md` snapshots.

The result is a points calculation from supplied factors, not a finding of Express Entry eligibility. Qualification of work/education, ECA validity, language-test expiry and supporting documents still require review. The questionnaire uses English first and French second and does not optimize language designation. Certificate-of-qualification points are not implemented because the necessary intake is missing. Keep these limits visible rather than claiming a complete official calculator.

## Historical fixes — retain, do not redo

- **Verified 2026-06-15, already correct since `c21f138`:** spouse-column selection applies only to an accompanying spouse/common-law partner who is not a Canadian citizen/PR. Non-accompanying or Canadian spouses use the single column.
- **Verified 2026-06-15, already correct since `c21f138`:** French bonus is 50 with NCLC 7+ and English CLB 5+ in every ability; otherwise 25 with French NCLC 7+.
- **Verified 2026-06-15, already correct since `c21f138`:** PTE Core, TEF and TCF conversions are implemented. They do not return zero for every profile.
- **Fixed 2026-06-15:** second-language subtotal is capped at 22 with spouse factors, 24 otherwise.

These were previously described as open bugs in older memory files. They are not outstanding work.

## Additional corrections — 2026-10-11

- First-language CLB 4 earns 6 points per ability, previously 0.
- Four years of principal-applicant Canadian work in the spouse column earns 63, previously 64.
- Spouse Canadian work at 2/3/4 years earns 7/8/9, previously 8/9/10.
- A single one-year, two-year or bachelor's credential uses the 13/25 transferability band. The higher band requires two qualifying credentials, a master's/professional degree or doctorate.
- Education transferability combinations share a 50-point cap; foreign-work combinations share another 50-point cap. Apply the overall 100-point cap after those group caps.
- Only an explicitly identified Express Entry nomination sets the 600-point scoring flag. Non-Express Entry and unknown nomination types are retained separately and add no nomination points. See [IRCC nomination confirmation](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees/express-entry/get-confirm-nomination.html); nomination acceptance/validity still requires checking.
- Unknown TEER is `null`, never an assumed TEER 1. “No test yet” remains no test; missing answers are not invented facts.

Regression coverage is in `tests/assessment.test.js`. Do not restore the old mislabeled IELTS/CLB examples; corrected fixtures appear below.

---

## SINGLE vs SPOUSE COLUMN RULES

The CRS has two sets of points for core human capital factors. The "single" column gives MORE points because there's no spouse to share the allocation with.

| Situation | Column to Use |
|-----------|--------------|
| Never married / Single / Divorced / Widowed | Single |
| Married/CL, spouse NOT accompanying | Single |
| Married/CL, spouse IS Canadian citizen/PR | Single |
| Married/CL, spouse accompanying, spouse NOT citizen/PR | Spouse |

---

## AGE POINTS

| Age | Single | With Spouse |
|-----|--------|-------------|
| 17 or under | 0 | 0 |
| 18 | 99 | 90 |
| 19 | 105 | 95 |
| 20-29 | 110 | 100 |
| 30 | 105 | 95 |
| 31 | 99 | 90 |
| 32 | 94 | 85 |
| 33 | 88 | 80 |
| 34 | 83 | 75 |
| 35 | 77 | 70 |
| 36 | 72 | 65 |
| 37 | 66 | 60 |
| 38 | 61 | 55 |
| 39 | 55 | 50 |
| 40 | 50 | 45 |
| 41 | 39 | 35 |
| 42 | 28 | 25 |
| 43 | 17 | 15 |
| 44 | 6 | 5 |
| 45+ | 0 | 0 |

---

## EDUCATION POINTS

| Level | Single | With Spouse |
|-------|--------|-------------|
| Less than high school | 0 | 0 |
| High school | 30 | 28 |
| 1-year post-secondary | 90 | 84 |
| 2-year post-secondary | 98 | 91 |
| Bachelor's (3+ yr) | 120 | 112 |
| Two or more credentials (one 3+ yr) | 128 | 119 |
| Master's or professional | 135 | 126 |
| PhD | 150 | 140 |

---

## FIRST OFFICIAL LANGUAGE POINTS (per ability)

| CLB Level | Single | With Spouse |
|-----------|--------|-------------|
| Less than CLB 4 | 0 | 0 |
| CLB 4-5 | 6 | 6 |
| CLB 6 | 9 | 8 |
| CLB 7 | 17 | 16 |
| CLB 8 | 23 | 22 |
| CLB 9 | 31 | 29 |
| CLB 10+ | 34 | 32 |

Max: 136 (single), 128 (with spouse) — 4 abilities × max per ability

---

## SECOND OFFICIAL LANGUAGE POINTS (per ability)

| CLB Level | Single | With Spouse |
|-----------|--------|-------------|
| CLB 4 or less | 0 | 0 |
| CLB 5-6 | 1 | 1 |
| CLB 7-8 | 3 | 3 |
| CLB 9+ | 6 | 6 |

Max: 24 (single), **22 (with spouse)**

---

## CANADIAN WORK EXPERIENCE POINTS

| Years | Single | With Spouse |
|-------|--------|-------------|
| None | 0 | 0 |
| 1 year | 40 | 35 |
| 2 years | 53 | 46 |
| 3 years | 64 | 56 |
| 4 years | 72 | 63 |
| 5+ years | 80 | 70 |

---

## SPOUSE FACTORS (only if spouse is accompanying AND not Canadian citizen/PR)

### Spouse Education

| Level | Points |
|-------|--------|
| Less than high school | 0 |
| High school | 2 |
| 1-year post-secondary | 6 |
| 2-year post-secondary | 7 |
| Bachelor's (3+ yr) | 8 |
| Two or more credentials | 9 |
| Master's or professional | 10 |
| PhD | 10 |

### Spouse Language (per ability)

| CLB | Points |
|-----|--------|
| CLB 4 or less | 0 |
| CLB 5-6 | 1 |
| CLB 7-8 | 3 |
| CLB 9+ | 5 |

Max: 20 (4 abilities × 5)

### Spouse Canadian Work

| Years | Points |
|-------|--------|
| None | 0 |
| 1 year | 5 |
| 2 years | 7 |
| 3 years | 8 |
| 4 years | 9 |
| 5+ years | 10 |

---

## SKILL TRANSFERABILITY (max 100 total)

The two education combinations share a **50-point education cap**. The two foreign-work combinations share a **50-point foreign-work cap**. The current implementation computes:

```js
Math.min(Math.min(educationLanguage + educationCanadianWork, 50)
       + Math.min(foreignLanguage + foreignCanadianWork, 50), 100)
```

“Two qualifying credentials” means two or more post-secondary credentials with at least one program of three years or longer. All first-language abilities must reach the indicated CLB threshold. “CLB 7-8” means every ability is at least 7 and at least one is below 9. Secondary education or less gives zero education-transferability points.

### 1. Education + Language

| Education | CLB 7-8 | CLB 9+ |
|-----------|---------|--------|
| One post-secondary credential of 1+ year, including a bachelor's | 13 | 25 |
| Two qualifying credentials, master's/professional degree or PhD | 25 | 50 |

### 2. Education + Canadian Work

| Education | 1 year CAN work | 2+ years CAN work |
|-----------|-----------------|-------------------|
| One post-secondary credential of 1+ year, including a bachelor's | 13 | 25 |
| Two qualifying credentials, master's/professional degree or PhD | 25 | 50 |

### 3. Foreign Work + Language

| Foreign Work | CLB 7-8 | CLB 9+ |
|-------------|---------|--------|
| 1-2 years | 13 | 25 |
| 3+ years | 25 | 50 |

### 4. Foreign Work + Canadian Work

| Foreign Work | 1 year CAN work | 2+ years CAN work |
|-------------|-----------------|-------------------|
| 1-2 years | 13 | 25 |
| 3+ years | 25 | 50 |

### 5. Certificate of Qualification + Language — not implemented

| Certificate | CLB 5-6 | CLB 7+ |
|------------|---------|--------|
| Has certificate | 25 | 50 |

These official factors need additional intake and qualified review before implementation; the current calculator does not award them. Do not imply it supports every trades profile.

---

## ADDITIONAL POINTS (max 600)

| Factor | Points |
|--------|--------|
| Confirmed Express Entry provincial/territorial nomination | 600 |
| Canadian education (1-2 years) | 15 |
| Canadian education (3+ years) | 30 |
| Sibling in Canada (citizen/PR, 18+) | 15 |
| French: NCLC 7+ AND English CLB 5+ | **50** |
| French: NCLC 7+ WITHOUT English CLB 5+ | **25** |
| Valid job offer — REMOVED March 2025 | **0** (no longer applies) |

---

## LANGUAGE TEST CONVERSION TABLES

### IELTS General Training → CLB

| CLB | Reading | Writing | Listening | Speaking |
|-----|---------|---------|-----------|----------|
| 10 | 8.0 | 7.5 | 8.5 | 7.5 |
| 9 | 7.0 | 7.0 | 8.0 | 7.0 |
| 8 | 6.5 | 6.5 | 7.5 | 6.5 |
| 7 | 6.0 | 6.0 | 6.0 | 6.0 |
| 6 | 5.0 | 5.5 | 5.5 | 5.5 |
| 5 | 4.0 | 5.0 | 5.0 | 5.0 |
| 4 | 3.5 | 4.0 | 4.5 | 4.0 |

### CELPIP General → CLB
CELPIP scores map directly: CELPIP 4 = CLB 4, CELPIP 5 = CLB 5, ... CELPIP 10+ = CLB 10

### PTE Core → CLB

| CLB | Reading | Writing | Listening | Speaking |
|-----|---------|---------|-----------|----------|
| 10 | 88 | 90 | 89 | 89 |
| 9 | 78 | 88 | 82 | 84 |
| 8 | 69 | 79 | 71 | 76 |
| 7 | 60 | 69 | 60 | 68 |
| 6 | 51 | 60 | 50 | 59 |
| 5 | 42 | 51 | 39 | 51 |
| 4 | 33 | 41 | 28 | 42 |

### TEF Canada → CLB (NCLC)

Use the certificate's **Équivalence ancien score** column, not **Score / 699**. The API rejects values outside this scale; do not mix the two scales.

| CLB/NCLC | Compréhension écrite (Reading) | Expression écrite (Writing) | Compréhension orale (Listening) | Expression orale (Speaking) |
|----------|-------------------------------|----------------------------|--------------------------------|---------------------------|
| 10 | 263-300 | 393-450 | 316-360 | 393-450 |
| 9 | 248-262 | 371-392 | 298-315 | 371-392 |
| 8 | 233-247 | 349-370 | 280-297 | 349-370 |
| 7 | 207-232 | 310-348 | 249-279 | 310-348 |
| 6 | 181-206 | 271-309 | 217-248 | 271-309 |
| 5 | 151-180 | 226-270 | 181-216 | 226-270 |
| 4 | 121-150 | 181-225 | 145-180 | 181-225 |

### TCF Canada → CLB (NCLC)

| CLB/NCLC | Compréhension écrite (Reading) | Expression écrite (Writing) | Compréhension orale (Listening) | Expression orale (Speaking) |
|----------|-------------------------------|----------------------------|--------------------------------|---------------------------|
| 10 | 549-699 | 16-20 | 549-699 | 16-20 |
| 9 | 524-548 | 14-15 | 523-548 | 14-15 |
| 8 | 499-523 | 12-13 | 503-522 | 12-13 |
| 7 | 453-498 | 10-11 | 458-502 | 10-11 |
| 6 | 406-452 | 7-9 | 398-457 | 7-9 |
| 5 | 375-405 | 6 | 369-397 | 6 |
| 4 | 342-374 | 4-5 | 331-368 | 4-5 |

---

## CATEGORY-BASED DRAW ELIGIBILITY

CRS points do not establish category-draw eligibility. TEER alone is insufficient: the current questionnaire does not capture an exact NOC and its qualifying work history, so it cannot establish occupation-category eligibility. Do not infer sector from education or occupation level. Requirements, category lists and invitation rounds must be checked against current official sources separately; no category list was refreshed during this scoring update.

---

## MAXIMUM POINTS SUMMARY

| Section | Maximum |
|---------|---------|
| Core Human Capital (age + education + language + Canadian work) | 500 (single) / 460 (spouse) |
| Spouse Factors | 0 (single) / 40 (spouse) |
| Skill Transferability | 100 |
| Additional Points | 600 |
| **TOTAL** | **1,200** |

---

## REGRESSION PROFILES

The following fixtures assume the stated factors qualify for points. Unless mentioned, there is no French, Canadian work, spouse factor or additional point. Run `node --test tests/assessment.test.js`.

### 1. Actual IELTS bands — total 473

Single, age 30, master's, IELTS **8/8/8/8** (reading/writing/listening/speaking), three years foreign work:

| Category | Points |
|----------|--------|
| Age | 105 |
| Education | 135 |
| First language: CLB 10/10/9/10 | 133 |
| Skill transferability: education 50 + foreign work 50 | 100 |
| Other factors | 0 |
| **Total** | **473** |

IELTS 8 in every skill does **not** mean CLB 8 in every skill. The older 382 example mislabeled this input.

### 2. Explicit CLB 8 — total 382

For the same profile with **CLB 8 in all abilities** (for example IELTS reading 6.5, writing 6.5, listening 7.5, speaking 6.5): age 105 + education 135 + language 92 + transferability 50 = **382**. `clb_direct` is an internal calculation/simulation tool, not a public server intake test type.

### 3. Accompanying spouse, explicit CLB 7 — total 281

Married, accompanying spouse who is not a Canadian citizen/PR, age 35, bachelor's, principal CLB 7 in all abilities, no foreign/Canadian work; spouse master's, CLB 7 in all abilities, no Canadian work:

| Category | Points |
|----------|--------|
| Age | 70 |
| Education | 112 |
| First language | 64 |
| Spouse education + language | 10 + 12 = 22 |
| Education-language transferability | 13 |
| Other factors | 0 |
| **Total** | **281** |

The old 301/293 totals used incorrect spouse-language or bachelor's transferability assumptions. If the principal instead has actual **IELTS 7/7/7/7**, their CLBs are 9/9/7/9, language contributes 103, and the total is **320**; the spouse remains explicitly CLB 7.

### Boundary checks

- CLB 4 in all first-language abilities: 24 language points.
- Accompanying-spouse four-year Canadian work: 63 principal points.
- Spouse work years 0/1/2/3/4/5+: 0/5/7/8/9/10.
- Master's, CLB 9, two Canadian years, no foreign work: education transferability is capped at 50, not 100.
- No education transferability, CLB 9, three foreign years and two Canadian years: foreign-work transferability is capped at 50, not 100.
- Combined maximum remains 1,200; additional factors cannot exceed 600.
