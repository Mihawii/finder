# PathwayFinder - Agent Instructions

## Project Overview
PathwayFinder is an AI-powered Canadian immigration assessment tool. Users fill out a profile form, get a real-time CRS score, and receive a detailed AI-generated immigration report with ranked pathways, action plans, costs, and timelines.

## Critical Rule: Always Commit After Changes
Every agent MUST run the following after making any code changes:
```bash
git add .
git commit -m "descriptive message of what changed"
```
Do NOT skip this. Do NOT batch commits across multiple tasks. Commit immediately after each logical change.

## First Steps for New Agents
1. Read `.claude/projects/-Users-baha-Desktop-my-apps/memory/MEMORY.md` for the memory index
2. Read `architecture.md` in the memory folder for full project structure
3. Read `CRS_RULES.md`, `REPORT_RULES.md`, `IMMIGRATION_DATA.md`, `IMMIGRATION_DATA_UPDATES.md`, and `IMMIGRATION_DATA_LOGS.md` for domain rules
4. Check recent git log to understand what's been worked on

## Tech Stack
- **Frontend:** React 18 + Vite (JSX, inline CSS, no framework)
- **Backend:** Firebase Cloud Functions (Node.js 20 + Python 3.12)
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514) via @anthropic-ai/sdk
- **PDF:** ReportLab (Python)
- **Hosting:** Firebase Hosting
- **Project ID:** pathwayfinder-3b040

## Key Files
| File | What It Does |
|------|-------------|
| `pathwayfinder-app (2).jsx` | **MAIN APP** (3,746 lines) - CRS calculator, form, AI integration, report rendering, promo gate |
| `src/assessment_flow.jsx` | Form UI components (inputs, dropdowns, toggles) |
| `src/main.jsx` | React entry point |
| `functions/index.js` | Cloud Functions: analyzeProfile + validatePromoCode |
| `functions/.env` | ANTHROPIC_KEY (never commit secrets) |
| `pdf-function/generate_report.py` | PDF generation with ReportLab |
| `pdf-function/main.py` | HTTP handler for PDF function |
| `IMMIGRATION_DATA.md` | Static immigration program rules, costs, provincial structures |
| `IMMIGRATION_DATA_UPDATES.md` | Dynamic draw results, CRS cutoffs, program changes (updated daily) |
| `IMMIGRATION_DATA_LOGS.md` | Changelog for immigration data files |
| `dev.config.js` | Dev mode config with mock data |

## Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Build to dist/
firebase deploy      # Deploy hosting + functions
```

## Architecture Quick Reference
```
User fills form → CRS calculated locally → Promo code check →
Cloud Function (analyzeProfile) → Claude API → JSON report →
Report rendered in browser → Optional PDF download via Python function
```

## Rules & Constraints
- **No database** - app is stateless, no user accounts
- **Promo code** PATHFINDER23 unlocks full report (free users see CRS + blurred report)
- **CRS calculator** has known bugs documented in CRS_RULES.md - check before modifying
- **AI system prompt** is in functions/index.js — instructions are hardcoded, immigration data is read from `IMMIGRATION_DATA.md` (static) and `IMMIGRATION_DATA_UPDATES.md` (dynamic) at runtime
- **Immigration data** is split into 3 files: `IMMIGRATION_DATA.md` (static programs/costs), `IMMIGRATION_DATA_UPDATES.md` (draws/cutoffs, updated daily), `IMMIGRATION_DATA_LOGS.md` (changelog)
- Never recommend Quebec programs or family sponsorship in AI reports
- Settlement funds must be checked against family size minimums

## Known Bugs (from CRS_RULES.md)
All three historically-documented CRS bugs were verified FIXED in the current code as of 2026-06-15 (correct since commit c21f138). Do NOT re-fix — the logic in `pathwayfinder-app (2).jsx` (calcCRS / convertToClb) already matches official IRCC criteria.
1. ✅ FIXED — Spouse column logic (single vs spouse scoring): `useSpouseColumn` correctly gates on spouse accompanying AND not a Canadian citizen/PR.
2. ✅ FIXED — French bonus: correctly awards 50 (NCLC 7+ with English CLB 5+) / 25 (NCLC 7+ otherwise).
3. ✅ FIXED — PTE/TEF/TCF converters: conversion tables present and wired in `convertToClb`.
4. ✅ FIXED (2026-06-15) — Second-language subtotal now clamped to 22 in the with-spouse column (24 single), per IRCC with-spouse max.

## Git Workflow
- Main branch: `main`
- Always commit with descriptive messages
- Never force push to main
- Keep commits atomic (one logical change per commit)
