# Project instructions

Read `CLAUDE.md` for the project architecture, constraints, and commit workflow.

## UI preferences

- Use the 21st.dev MCP for design work and component selection. This is an explicit user preference, not an optional source of inspiration.
- The selected onboarding reference is `https://21st.dev/@patrick-xin/components/onboarding-dialog` (MCP component demo ID 10480). Reuse it rather than selecting an unrelated design system.
- The assessment uses the 21st.dev Multi-step Wizard reference: `https://21st.dev/@dhileepkumargm/components/multi-step-wizard` (MCP demo ID 7821). Keep its grouped sections, field validation, progress states, and editable review; use the site's typography, photography, and shared action buttons.
- Action buttons share `--control-*` tokens and the existing off-white pill shape. Use `components/ui/button.tsx` for new React button instances; keep choice controls visually distinct from action buttons.
- If the MCP is unavailable, explain the connection issue. Do not claim independent design work came from 21st.dev. Continue concrete restorations the user has explicitly requested while the connection is resolved.
- Preserve the destination photography; the user values its atmosphere. Compact layouts should not strip out the photos.
- Use full-color, correctly proportioned national flags for country indicators and selectors. Preserve the existing country arrival/loading animations, which are explicitly exempt from this preference.
- Keep copy short, spacing purposeful, and typography, colors, and buttons consistent with the established site. Avoid decorative badges, redundant labels, and unrelated icons.
- PathwayFinder's core experience is a profile assessment followed by personalized immigration results. Do not substitute a directory of external guides for that experience.
- The current assessment and report backend is Canada-specific. Confirm the intended U.S. product flow before expanding it; never pass U.S. profiles through Canadian scoring or present an unimplemented assessment as available.
