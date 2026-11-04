# Working in this repository

- Read README.md and docs/PROJECT-STATUS.md for the active scope.
- Edit src/, assets/ and previews/. Do not edit generated dist/ files.
- Run Python scripts/build.py and node tests/check.cjs after relevant changes.
- Use browser inspection at 480x270 for visual changes; automated tests do not establish artwork quality.
- Preserve exact recipes, saved-game compatibility and deterministic engine behaviour unless the user explicitly requests a gameplay change.
- Environment work proceeds one environment at a time. Current focus is Street; weather follows environment review.
- Gag vehicle artwork and special transformation animations are deferred to the owner. Preserve those modules during environment work.
- User instructions take precedence over this guidance.
