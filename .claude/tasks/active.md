# Active Tasks

## Task: Bypass Promo Gate for Beta Testing
- **ID:** TASK-3
- **Status:** DONE
- **Priority:** HIGH
- **Description:** Temporarily bypass the promo code gate so all users see the full report without entering a code. No promo UI or validation code deleted — just bypassed with a flag.
- **Files modified:**
  - `pathwayfinder-app (2).jsx` — Set `unlocked` state to default `true` (line 531), added auto-trigger useEffect to call AI on mount (after line 602)
- **Acceptance criteria:**
  - [x] `unlocked` defaults to `true`
  - [x] AI call auto-triggers on page load (no promo code needed)
  - [x] All promo code UI and validation code preserved (not deleted)
  - [x] Comment marks the bypass: `// TEMP: promo gate bypassed for beta testing — revert before launch`
  - [x] `npm run build` succeeds
  - [x] `firebase deploy --only hosting` succeeds
- **Notes:** To revert, change `useState(true)` back to `useState(false)` on the `unlocked` line and remove the auto-trigger useEffect. Search for "TEMP: promo gate bypassed" to find both locations.

---

## Task: Update App to Use Split Immigration Data Files
- **ID:** TASK-2
- **Status:** DONE
- **Priority:** HIGH
- **Description:** The immigration data was split from one file into three (`IMMIGRATION_DATA.md`, `IMMIGRATION_DATA_UPDATES.md`, `IMMIGRATION_DATA_LOGS.md`). The app's Cloud Function currently has all immigration data (draws, cutoffs, program rules) hardcoded in the `SYSTEM_PROMPT` string inside `functions/index.js`. This task updates the Cloud Function to dynamically read from both the static and updates files so the AI prompt always uses current data — and updates all documentation references to reflect the new 3-file structure.

### Why
The Data Checker agent will update `IMMIGRATION_DATA_UPDATES.md` daily with new draw results and program changes. If the system prompt stays hardcoded, the AI will always use stale data regardless of updates. The function needs to read both files at startup (or per-request) so the AI prompt automatically reflects the latest data.

### Files to read first
- `IMMIGRATION_DATA.md` — static program rules, costs, provincial structures
- `IMMIGRATION_DATA_UPDATES.md` — draws, CRS cutoffs, category-based draws (updated daily)
- `IMMIGRATION_DATA_LOGS.md` — changelog (for context only, not used in code)
- `functions/index.js` — current Cloud Function with hardcoded `SYSTEM_PROMPT` (~160 lines)
- `.claude/data_checker.md` — Data Checker agent spec (references the file structure)

### Files to modify
1. **`functions/index.js`** — Main changes:
   - Extract the immigration data portion out of the hardcoded `SYSTEM_PROMPT` string
   - Read `IMMIGRATION_DATA.md` and `IMMIGRATION_DATA_UPDATES.md` at runtime (e.g., via `fs.readFileSync` or at function cold-start)
   - Construct the system prompt by combining: the static instruction/formatting rules (keep hardcoded) + content from static file + content from updates file
   - The system prompt structure should be: instructions/format rules → static program data → dynamic draw/cutoff data
   - Keep the prompt's tone and instruction format identical — only change WHERE the data comes from
   - **Important:** Cloud Functions deploy the `functions/` directory. The `.md` files are in the project root. Either:
     - (a) Copy the `.md` files into `functions/` at deploy time (add a predeploy script), OR
     - (b) Read them from a relative path `../IMMIGRATION_DATA.md` (works locally but verify in deployed environment), OR
     - (c) Store them in a Cloud Storage bucket and fetch at cold-start
   - Recommend option (a): add a `predeploy` script in `firebase.json` that copies the two `.md` files into `functions/` before deploy. This is simplest and most reliable.

2. **`firebase.json`** — If using predeploy approach:
   - Add a predeploy hook for functions: `"predeploy": ["cp IMMIGRATION_DATA.md IMMIGRATION_DATA_UPDATES.md functions/"]`
   - Add the copied `.md` files to `functions/.gitignore` so they don't get committed twice

3. **`functions/.gitignore`** — Add entries for the copied `.md` files (if using predeploy approach)

4. **`CLAUDE.md`** — Update references:
   - Line 17: `IMMIGRATION_DATA.md` reference in "First Steps" should mention all 3 files
   - Line 60: `IMMIGRATION_DATA.md` description should note the split into 3 files
   - The Key Files table should list all 3 files with their purposes

5. **`.claude/ProjectManager.md`** — Update file mapping table:
   - Line 109: `AI Prompt/Rules` row currently lists `IMMIGRATION_DATA.md` — update to include `IMMIGRATION_DATA_UPDATES.md`

6. **`.claude/projects/-Users-baha-Desktop-my-apps/memory/architecture.md`** — Update directory listing:
   - Line 22: Add `IMMIGRATION_DATA_UPDATES.md` and `IMMIGRATION_DATA_LOGS.md` to the file tree

7. **`.claude/logs.md`** — Add entry noting the data split is complete and code update task created

### Implementation guidance

#### System prompt construction in `functions/index.js`
```
// Pseudocode for the new approach:

import { readFileSync } from 'fs';
import { join, dirname } from 'path';

// Read data files (copied to functions/ by predeploy script)
const staticData = readFileSync(join(dirname(import.meta.url), 'IMMIGRATION_DATA.md'), 'utf-8');
const updatesData = readFileSync(join(dirname(import.meta.url), 'IMMIGRATION_DATA_UPDATES.md'), 'utf-8');

// Keep instruction/format portion hardcoded (the JSON schema, rules, etc.)
const SYSTEM_PROMPT = `You are PathwayFinder's immigration pathway advisor...

[JSON format rules, scoring rules, constraints — keep as-is]

=== STATIC PROGRAM DATA ===
${staticData}

=== LATEST DRAW & UPDATE DATA ===
${updatesData}
`;
```

#### Key gotchas
- The current `SYSTEM_PROMPT` has ~160 lines mixing instructions WITH data. You need to carefully separate which lines are instructions/rules (keep hardcoded) vs data (replace with file reads). The data starts roughly at the "EXPRESS ENTRY DRAWS" section.
- `fs.readFileSync` is fine for Cloud Functions — files are read once at cold start and cached in memory for the function instance lifetime.
- Make sure the prompt doesn't exceed Claude's context window — both files combined are ~500 lines of markdown which is fine.
- Test that the Cloud Function still returns valid JSON after the prompt restructure.
- If using ES modules (`import`), use `import.meta.url` to resolve file paths. If using CommonJS (`require`), use `__dirname`.

### Acceptance criteria
- [x] `functions/index.js` reads from `IMMIGRATION_DATA.md` and `IMMIGRATION_DATA_UPDATES.md` instead of hardcoding all data
- [x] System prompt instruction/format rules remain unchanged (JSON schema, scoring rules, constraints)
- [x] Immigration data in the prompt comes from the two `.md` files
- [x] Deploy mechanism works: `.md` files are available to the Cloud Function at runtime
- [x] `firebase.json` has predeploy hook (if using that approach) to copy files
- [x] Copied files are in `functions/.gitignore`
- [x] `CLAUDE.md` updated to reference all 3 immigration data files
- [x] `.claude/ProjectManager.md` file mapping updated
- [x] `architecture.md` directory listing updated
- [x] Cloud Function still returns valid JSON report when called
- [x] No regressions in report quality or content

### Dependencies
- Depends on the immigration data split (already completed — commit `039b7aa`)

### Notes
- The Data Checker agent (`.claude/data_checker.md`) is already configured to update `IMMIGRATION_DATA_UPDATES.md` and `IMMIGRATION_DATA_LOGS.md`. Once this task is done, daily data updates will automatically flow into the AI prompt.
- Check `functions/package.json` to confirm whether the project uses ES modules or CommonJS — this affects how you read files.
