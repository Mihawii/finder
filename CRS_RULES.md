# CRS Calculator Rules — PathwayFinder

## Purpose
This file defines the exact CRS (Comprehensive Ranking System) scoring rules that the calculator in `src/App.jsx` must follow. These rules are verified against the official IRCC CRS calculator at canada.ca/express-entry.

Any time the CRS calculator is modified, check this file to ensure compliance.

---

## CRITICAL BUG FIXES NEEDED

> ✅ **STATUS (verified 2026-06-15):** All three bugs below were ALREADY FIXED in the current code (correct since commit c21f138) and verified against official IRCC criteria. They are retained here as historical record only — do NOT re-fix working code. A separate fix (second-language with-spouse subtotal capped at 22) was added 2026-06-15.

### Bug 1: Spouse Column Logic — ✅ FIXED (verified 2026-06-15)
**Current behavior:** If person is married, always uses "spouse" column (lower points).
**Correct behavior:** Use "single" column (higher points) if ANY of these are true:
- Person is single/divorced/widowed (no spouse)
- Person has spouse but spouse is NOT accompanying to Canada
- Person's spouse IS a Canadian citizen or permanent resident

Use "spouse" column (lower points) ONLY if:
- Person has a spouse AND spouse IS accompanying AND spouse is NOT a Canadian citizen/PR

**Form change needed:** Add question: "Is your spouse or common-law partner a citizen or permanent resident of Canada?" (Yes/No)

### Bug 2: French Bonus Points — ✅ FIXED (verified 2026-06-15)
**Current code:** `if (frMin >= 7 && minClb >= 5) addPts += 25; else if (frMin >= 7) addPts += 50;`
**Correct logic:**
- French NCLC 7+ in all abilities AND English CLB 5+ in all abilities = **50 points** (bilingual bonus)
- French NCLC 7+ in all abilities WITHOUT English CLB 5+ = **25 points**
**Fix:** Swap the 25 and 50.

### Bug 3: PTE Core / TEF / TCF Return Zero — ✅ FIXED (verified 2026-06-15)
**Current behavior:** `convertToClb()` returns all zeros for PTE Core, TEF Canada, and TCF Canada.
**Fix needed:** Add proper conversion tables for these tests. See conversion tables below.

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

Max: 24 (single), 24 (with spouse)

---

## CANADIAN WORK EXPERIENCE POINTS

| Years | Single | With Spouse |
|-------|--------|-------------|
| None | 0 | 0 |
| 1 year | 40 | 35 |
| 2 years | 53 | 46 |
| 3 years | 64 | 56 |
| 4 years | 72 | 64 |
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
| 2 years | 8 |
| 3 years | 9 |
| 4 years | 10 |
| 5+ years | 10 |

---

## SKILL TRANSFERABILITY (max 100 total)

Five combinations, each capped at 50 points. Total capped at 100.

### 1. Education + Language
| Education | CLB 7-8 | CLB 9+ |
|-----------|---------|--------|
| 1-year post-secondary | 13 | 25 |
| 2+ year post-secondary or higher | 25 | 50 |

### 2. Education + Canadian Work
| Education | 1 year CAN work | 2+ years CAN work |
|-----------|-----------------|-------------------|
| 1-year post-secondary | 13 | 25 |
| 2+ year post-secondary or higher | 25 | 50 |

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

### 5. Certificate of Qualification + Language
| Certificate | CLB 5-6 | CLB 7+ |
|------------|---------|--------|
| Has certificate | 25 | 50 |

---

## ADDITIONAL POINTS (max 600)

| Factor | Points |
|--------|--------|
| Provincial/territorial nomination | 600 |
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

Category-based draws target candidates working in specific sectors. Eligibility depends on having qualifying work experience in specific NOC (National Occupational Classification) codes within that sector.

**TEER level alone does NOT determine category eligibility.** For example:
- A TEER 1 software engineer qualifies for STEM draws but NOT healthcare draws
- A TEER 1 nurse qualifies for healthcare draws but NOT STEM draws
- A TEER 0 restaurant manager does NOT qualify for any category draw unless their specific NOC is listed

**Category draw requirements (summary):**
| Category | Requirement |
|----------|-------------|
| Healthcare & Social Services | 12+ months experience in eligible healthcare/social services NOC codes |
| STEM | 12+ months experience in eligible STEM NOC codes |
| Trade Occupations | 12+ months experience in eligible trades NOC codes |
| Agriculture & Agri-food | 12+ months experience in eligible agriculture NOC codes |
| Education | 12+ months experience in eligible education NOC codes |
| French-language | NCLC 7+ in all abilities (sector-independent) |

**Rule for the AI report:** If the user's specific occupation or sector is not provided, do NOT recommend category-based draws. Only recommend general draws (CEC, FSW, PNP, French-language). Note the missing information as a limitation.

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

## TEST PROFILE FOR VERIFICATION

Use this profile to verify the calculator produces the correct score:

**Test case: Single, age 30, Master's, IELTS 8/8/8/8, 3 years foreign work, 0 Canadian work, no French, no additional points**

Expected breakdown:
- Age: 105 (single, age 30)
- Education: 135 (single, Master's)
- First Language: CLB 8 all = 23×4 = 92
- Second Language: 0
- Canadian Work: 0
- Spouse: 0
- Skill Transfer: Education(masters)+Language(CLB8) = 25, ForeignWork(3yr)+Language(CLB8) = 25 = 50
- Additional: 0
- **Total: 382**

**Test case 2: Married with accompanying spouse, age 35, Bachelor's, IELTS 7/7/7/7, spouse has Master's and CLB 7**

Expected breakdown:
- Age: 77 → with spouse column = 70
- Education: 120 → with spouse column = 112
- First Language: CLB 7 all = 16×4 = 64 (spouse column)
- Canadian Work: 0
- Spouse education: Master's = 10
- Spouse language: CLB 7×4 abilities = 3×4 = 12 (CLB 7-8 = 3 pts/ability; the 5 pts/ability rate applies only at CLB 9+)
- Spouse Canadian work: 0
- Skill Transfer: Education(bachelors)+Language(CLB7) = 25
- Additional: 0
- **Total: 293** (corrected 2026-06-15 — previously stated 301, which mistakenly used the CLB 9+ spouse-language rate of 5 for a CLB 7 input; the current code correctly produces 293)
