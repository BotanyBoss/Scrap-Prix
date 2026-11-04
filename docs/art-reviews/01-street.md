# Environment 01 — Street / Urban | Review gate

**Baseline:** main @ `a7615f0` (4 November 2026)  
**Status:** Existing layout ready for owner review; no artwork approved and no renderer changes in this branch.

## Authoritative implementation
- `src/10-environments.js`: `street` preset, `streets` road, `suburb` landscape, `shops` scenery.
- `src/20-scene.js`: `streetLots()`, `drawStreetFrontage()`, street pavement in `road()`, backdrop in `venueBackdrop()`.
- `scripts/build.py` already preselects Street in `dist/STREET-PREVIEW.html`.
- `OPEN-STREET-PREVIEW.cmd` builds and launches the preview.
- `tests/check.cjs` checks grouped counts, gap size, lot width and continuity.

## Existing design to preserve
- 4–7 houses within each group; gaps vary between 4 and 7 world units.
- Fixed 3.8-world-unit frontage per house.
- Left/right house groups staggered, not mirrored identical sequences.
- Buildings remain anchored in world distance and pass out of frame naturally.
- Continuous pavement, coloured facade blocks, shop awnings, windows and doors.
- Straight rear-view camera, readable car silhouettes, no altered road physics.

## First visual review (480 × 270 native size)
1. Start `OPEN-STREET-PREVIEW.cmd` or build and open `dist/STREET-PREVIEW.html`.
2. Check **clear moving**, then **paused** at a near-building frame.
3. Check **rain** and **fog** only for obstruction; the dedicated weather pass comes later.
4. Test both native 480×270 and optional 2× inspection; judge usability at native size.
5. Capture at least 3 frames: distant approach, building alongside, and gap between groups.

## What we are evaluating
- **Street identity**: does this look like an inhabited road, not identical kiosks or a row of coloured blocks?
- **Depth**: visible side walls, foundation and correct approach/parallax.
- **Variation**: sign, window, roof and awning personality without random flickering.
- **Composition**: moderate verge detail without interfering with cars or events.
- **Motion**: houses stay in place in world coordinates and exit via canvas clipping.
- **Readability**: car and rivals remain distinct at actual race size.

## Candidate changes, pending comparison
- Refine shop facade colour grouping and simplify repeated window pattern at native scale.
- Introduce restrained, stable roofline and awning silhouette variety using lot serials.
- Improve ground-contact shading and modest pavement details near the storefronts.

**Avoid** changing lot grouping, distances, camera, or gameplay. No new tracks.

## Acceptance gate
Owner chooses Keep / Polish / Rework after viewing real renderer frames. Only then author the Street-specific art patch in a separate commit on this branch, compare before/after images, run:
```
python scripts/build.py
node tests/check.cjs
```
and verify the actual 480×270 scene. Do not describe a code-only or automated-only check as final visual approval.

## Next environments
After Street is reviewed and accepted, proceed one environment at a time (Airstrip, F1, Circuit, Drag Strip, Rally, Off-Road, Pile-up, then DEV-only concepts). No bulk changes.
