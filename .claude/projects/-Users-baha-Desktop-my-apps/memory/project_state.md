---
name: Project State
description: Current state of PathwayFinder - active version, recent work, known issues, and what's been deployed
type: project
---

# PathwayFinder - Current State

## Current Version: v6 (Promo Code Gate)
- Free users see CRS score + basic analysis + blurred full report
- Promo code PATHFINDER23 unlocks complete AI-generated report
- Server-side validation via Cloud Function

## Recent Work (as of March 27, 2026)
- Loading screen redesigned with progress bar and timed steps
- Loading spinner visibility fixes
- Promo gate rendering fix
- AI prompt updated to stop assuming occupation sector
- Rules docs updated

## Known Bugs (Documented in CRS_RULES.md)
1. **Spouse column logic inverted** - uses wrong column when spouse not accompanying or is PR/citizen
2. **French bonus logic backwards** - 50 pts condition is reversed
3. **PTE/TEF/TCF converters broken** - return all zeros instead of correct CLB values

## Immigration Data
- Last updated: March 24, 2026
- Draw results through March 18, 2026
- Category-based draws require 12-month work experience (as of Feb 18, 2026)

## Deployment
- Firebase project: pathwayfinder-3b040
- GitHub: https://github.com/ib0285/Pathfinder.git
- Uses direct Cloud Run URL for analyzeProfile to avoid Firebase rewrite timeout issues
