# PathwayFinder — Local Setup & Git Guide

## Running the App Locally

### Prerequisites
- [Node.js](https://nodejs.org) v20 or higher
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

## UI Components, Tailwind, and TypeScript

The app supports TypeScript alongside the existing JSX screens. Run `npm run typecheck`
to check the TypeScript components and `npm run build` for the production build.

- Shared UI components: `/components/ui` (import as `@/components/ui/...`).
- Shared utilities and onboarding content: `/lib` (import as `@/lib/...`).
- Tailwind styles and shadcn theme tokens: `/src/styles/globals.css`.
- Existing landing-page styles: `/src/country-experience.css`.

`components/ui` is the shared destination for reusable UI and shadcn CLI additions.
Keeping it separate from the existing feature screens in `src` makes imports predictable
and keeps generated components in one place. `components.json`, `tsconfig.json`, and
`vite.config.js` all agree on the root `@/` alias.

Tailwind uses its Vite plugin. Its global Preflight reset is omitted to preserve the
existing landing page and assessment styles; the onboarding dialog has a scoped reset.
See the [Tailwind Vite setup](https://tailwindcss.com/docs/installation/using-vite)
and [Preflight documentation](https://tailwindcss.com/docs/preflight).

The configuration is already installed in this repository. For a fresh Vite React
project, choose the React TypeScript template, then initialize shadcn:

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm install -D tailwindcss @tailwindcss/vite
npx shadcn@latest init
npm install motion embla-carousel-react lucide-react clsx tailwind-merge
```

Configure the Tailwind Vite plugin and the `@/` alias as shown in this repository.
See [shadcn's manual setup](https://ui.shadcn.com/docs/installation/manual) for
the CSS tokens and component aliases. To add another UI component to this configured
project, use `npx shadcn@latest add <component>`.

### Onboarding dialog

`components/ui/onboarding-dialog.tsx` uses a compact Embla/Motion carousel
with a heading, destination photography, one sentence, and navigation.
Its reference is [21st.dev's Onboarding Dialog](https://21st.dev/@patrick-xin/components/onboarding-dialog),
retrieved through the 21st.dev MCP. `components/ui/button.tsx` uses its primary/secondary
hierarchy with the existing landing-page pill shape. Shared `--control-*` tokens in
`src/styles/globals.css` keep action colors and radii consistent across the landing
page, onboarding, and consent dialog.
`components/ui/demo.tsx` is the standalone usage example, including restart behavior.
The production integration opens from the destination CTA or a pathway button in
`src/country-experience.jsx`. It uses the destination-specific slides in
`lib/onboarding-slides.ts`. Canada has two introductory steps leading into the
existing assessment. The U.S. entry shows its actual availability and offers an
explicit switch to Canada; it does not redirect users to external visa guides or
run U.S. profiles through Canadian scoring.

The component accepts `defaultOpen`, `slides`, `onComplete`, `onSkip`,
`onDismiss`, `showRestart`, and `completeLabel`. Each slide has `id`, `title`, `description`, `image`, and `alt`.
State is local; no context provider, account, or persistent storage is
needed. The introduction can be reopened from the same CTA, starting at the first slide.

Next, Back, swiping, and Left/Right arrow keys navigate the slides. Skip and
Start assessment lead to the Canadian consent dialog. The U.S. entry's Explore
Canada button switches destinations; Back closes the dialog.
The close button and Escape return to the landing page. The native modal dialog
traps focus, restores focus on close, and locks background scrolling. It fits mobile
screens, scrolls on short viewports, and respects reduced-motion preferences.

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
