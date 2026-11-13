# Working in this repository

**Current direction (13 November 2026):** Read docs/ROADMAP.md, docs/DIRECTION-IMPACT-AUDIT.md and docs/RACE-PRESENTATION-DIRECTION.md before planning new work. Street-first notes below are historical. Keep the 3D garage, aim for directed 2D cartoon races, prove modular vehicle-to-shot rendering in Studio Playground before mass producing assets. Many game systems are in unmerged stacked PRs, not main; preserve deterministic gameplay and saved-run compatibility. Do not merge or deploy without explicit review.

- Read README.md and docs/PROJECT-STATUS.md for the active scope.
- Edit src/, assets/ and previews/. Do not edit generated dist/ files.
- Run Python scripts/build.py and node tests/check.cjs after relevant changes.
- Use browser inspection at 480x270 for visual changes; automated tests do not establish artwork quality.
- Preserve exact recipes, saved-game compatibility and deterministic engine behaviour unless the user explicitly requests a gameplay change.
- Environment work proceeds one environment at a time. Current focus is Street; weather follows environment review.
- Gag vehicle artwork and special transformation animations are deferred to the owner. Preserve those modules during environment work.
- User instructions take precedence over this guidance.
