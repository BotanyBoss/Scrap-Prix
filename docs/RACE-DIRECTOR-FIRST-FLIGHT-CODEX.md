# Scrap Prix | Codex implementation brief: Race Director First Flight

**Status:** Real shot-planning module committed; the browser animation is NOT implemented yet.  
**Base:** branch codex/race-director-first-flight, based on codex/theatrical-race-integration. Do not merge into main or deploy.  
**Milestone:** A playable, visually inspectable 20–30-second excerpt based on the EXISTING Broken Bridge Jump event. Stop at one good event.

## The result we want

Build a working developer preview that actually animates the road and the currently equipped car. When a broken bridge approaches, show the existing route choice. Choosing TAKE DETOUR leads to a wide safe route; JUMP THE GAP leads to either a real success landing or a real impact, as the seeded engine decided. Show the actual mechanical consequences, then return to the right race beat. A genuine event, not a pre-authored GIF pasted over a different result.

The committed shot-plan adapter in src/31-race-director.js already returns seven events/shot cues, 24.3 seconds of planned footage, excluding the indefinite player decision hold. The source-backed tests in tests/race-director-first-flight.cjs verify:
- Seed 76 safe = actual detour with zero bridge damage.
- Seed 76 risk = actual failed jump.
- Seed 385 risk = actual successful jump.
Do not change those outcomes or smuggle damage/score/position calculations into animation code.

## Read these files FIRST

AGENTS.md; README.md; docs/PROJECT-STATUS.md; docs/RACE-PRESENTATION-DIRECTION.md; docs/ROADMAP.md; src/02-catalogue.js; src/03-engine.js; src/05-presentation.js; src/12-event-director.js; src/25-app.js; src/29-three-garage.js; src/09-vehicle-art.js; src/30-race-manifest.js; src/31-race-director.js; tests/race-manifest.cjs; tests/race-director-first-flight.cjs.

The UI currently resolves safe choices initially, then E.race(before, choices) recalculates the whole result on a risk selection, and src/12-event-director.js can re-anchor the scene. Preserve these semantics.

## Where to build the viewer

The user already has a LOCAL React + TypeScript + Vite Art Forge project evolving into a small central Studio Playground. This project is NOT verified as a GitHub repository. Search the local Codex workspaces for it rather than making assumptions about a path. If present, add a thin, isolated Scrap Prix Race Director workspace, following existing nav and viewer patterns. Do not rewrite Art Forge, invent a broader studio-management platform, or pull game production into the playground.

If the local Studio Playground cannot be accessed, implement an isolated development-only preview inside Scrap Prix (for example previews/), with the same compact controls and an explicit handoff boundary for a future Playground integration. Do NOT create another app with an unrelated engine or build a new service.

## Concrete Slice A implementation

1. Build the review viewer using the REAL catalogue, engine, Race Manifest and shot-plan adapter. The viewer must display actual animation, not a table of JSON, a static storyboard, or a concept image.
2. Show a useful camera sequence with at least rear racing, wide bridge establishing, side crossing and close-up impact/condition readout. Reuse the existing Scrap Prix road, environment and vehicle drawing routines wherever possible. Temporary simple animation is acceptable, but the action must be legible and match the selected branch.
3. Show the genuine game's decision labels and outcome text. At the choice shot, stop progression indefinitely until the user chooses TAKE DETOUR or JUMP THE GAP. Re-evaluate E.race using the original garage snapshot and the selected event key, then rebuild the manifest/plan. Never merely swap a success sprite over a safe result.
4. Controls: play/pause, replay/restart, time seek, 1x/2x/3x/4x, skip, reduced motion, clear elapsed/progress. Skip defaults unresolved choices to safe. All controls must leave game state unchanged except an explicitly submitted route choice. Seeking samples from an absolute time rather than accumulating frame drift.
5. Make all three real fixtures inspectable: seed 76 safe, seed 76 risky fail, seed 385 risky success. Display fixture source and the real engine effects/damage beside the viewport.
6. At the final shot, show actual per-slot damage and performance changes. Do not claim a rival overtake or elimination unless real engine data justifies it. The Race Manifest currently contains FINAL standings, not trustworthy lap-by-lap rankings.
7. Preserve the original game, event RNG, bounty/witness logic, Emergency Bodge, save/import identity and existing race view. Nothing on the production game page needs to be replaced in Slice A.

## Next visual research gate, NOT a reason to bloat Slice A

After a working excerpt exists, validate the exact 3D garage car -> consistent 2D shot views. Test Salvaged GT, Needle and Longbody with actual engines, tyres and gadgets. Longbody MUST visibly have six wheels, two at the front and four at the rear. The existing experimental Three.js garage has generic shape hints; its four-wheel shape is not approval of a real modular 3D pipeline. If the correct assets and mounts are missing, report which assets are needed rather than fake them or redesign the approved art.

The wider animation-quality RNG, disastrous cardboard animation versions, Retro Monochrome throwback and the ten-second CLICK unified-style reality shift are EXPLICITLY OUT OF SCOPE until this event is actually playing well.

## Acceptance and proof

- Working visible 480x270 race preview in a browser, with actual animated car and bridge, at normal speed and during pause/seek.
- Safe/risk-success/risk-failure scenes distinguishable without reading hidden state.
- Only one genuine player choice, re-anchored after engine recalculation.
- No fabricated outcomes, race position changes, double-settled bounties or mutated saves.
- Existing production entrypoints and original review feature branches unchanged.
- Run Python scripts/build.py, node tests/check.cjs, tests/determinism.cjs, tests/race-manifest.cjs, tests/race-director-first-flight.cjs, tests/choice-bounty-recalculation.cjs, tests/witness-bounties.cjs and full existing CI where practical.
- Browser-test real frames at 480x270 and a larger UI view; record snapshots/screenshots, timing, console errors and reduced-motion behavior.
- Commit Slice A only after green tests; report exact changed paths, branch/commit, how to open the preview, and passes vs limitations. Never announce animation completed from a passing model-only test.

**No independent deployment, no production merge, no unreviewed redraw of approved chassis artwork.**

## Short Codex instruction

Implement Slice A of docs/RACE-DIRECTOR-FIRST-FLIGHT-CODEX.md on the branch codex/race-director-first-flight. Start from existing model/tests; find and reuse local Studio Playground if accessible, otherwise build a strictly isolated Scrap Prix development preview. Deliver a working browser-animated Broken Bridge Jump excerpt, real seeded choice branches and controls, with browser proof and regression tests. Keep main and production untouched. Do not expand scope into modular 3D final assets, quality RNG, new events or extra art styles.
