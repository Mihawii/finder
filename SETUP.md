# PathwayFinder — Local Setup & Git Guide

## Running the App Locally

### Prerequisites
- [Node.js](https://nodejs.org) v18 or higher
- npm (comes with Node.js)

### Steps

**1. Install dependencies** (only needed the first time)
```bash
npm install
```

**2. Start the development server**
```bash
npm run dev
```

**3. Open in your browser**
```
http://localhost:3000
```

The app hot-reloads automatically — any changes you save to the JSX file will appear instantly in the browser.

---

## Pushing Changes to GitHub

The repo is connected to: `https://github.com/ib0285/Pathfinder.git`

### Step 1 — Stage your changes
```bash
# Stage a specific file
git add "pathwayfinder-app (2).jsx"

# Or stage all changed files (except .DS_Store — see tip below)
git add .
```

> **Tip:** Add a `.gitignore` to avoid committing junk files:
> ```
> node_modules/
> .DS_Store
> dist/
> ```

### Step 2 — Commit with a message
```bash
git commit -m "your message here"
```

Example messages:
```bash
git commit -m "add mobile responsive layout"
git commit -m "fix CRS panel on small screens"
git commit -m "update AI system prompt"
```

### Step 3 — Push to GitHub
```bash
git push
```

Or explicitly:
```bash
git push origin main
```

---

## Full Example (all three steps together)

```bash
git add "pathwayfinder-app (2).jsx"
git commit -m "describe what you changed"
git push
```

---

## Useful Git Commands

| Command | What it does |
|---|---|
| `git status` | See which files have changed |
| `git diff` | See exactly what changed line by line |
| `git log --oneline` | View recent commits |
| `git pull` | Fetch and merge latest changes from GitHub |
