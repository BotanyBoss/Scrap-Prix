# Scrap Prix: Phase 3C | Side-view animation stage and motion language

**Status:** Implementation brief; no work implemented by this document.
**Work branch:** `codex/side-view-animation-stage`, based on completed Phase 3B commit `ccc0d78715d41e02302720978612539433261648`.
**Goal:** Stop using unfinished pre-rendered car views as the main way of experimenting with motion. Make **one simple, reusable, animation-friendly 2D side stage** where body, wheels, road, scenery and camera can actually move independently. Prove it works inside a real experimental race, then stop for owner review.

## Context to read

Read `AGENTS.md`, `docs/ROADMAP.md`, `docs/RACE-PRESENTATION-DIRECTION.md`, and the implementation in `src/32-ordinary-timeline.js`, `src/33-race-frames.js`, `src/34-ordinary-film.js`, `src/25-app.js`, `previews/vehicle-pipeline/assembly.js`, and `previews/vehicle-pipeline/build.py`.

Owner feedback on Phase 3B: **camera angle variation is good, but timing and pan speeds are jarring, and unfinished car/scenery art makes the results hard to judge**. Do not try to repair this by polishing the old render or adding more camera angles. The owner has already accepted the prior POCs as technical proofs. They should remain untouched.

## Scope: one reusable animation stage, not a new engine

Build a focused 480x270 2D side-view stage that can be previewed with deliberately simple, clearly temporary shapes and exported as a usable runtime component. Use layered objects rather than one flattened moving screenshot:

- A chassis/body layer with a stable origin and defined ground-contact geometry.
- Wheel assemblies at the actual chassis wheel hubs, rotating independently from body motion. Longbody's six wheels should stay six, not become four. Preserve the recognizable Needle silhouette if included.
- Separate placeholder equipment cues (engine/tyres/gadget) derived from existing loadout IDs and/or shared mounting points where available. Never claim to show equipment it does not actually represent.
- A horizontally travelling road with ground lines, a middle-distance layer and a distant background at deliberately different parallax speeds. Keep scenery generic; final track art is *not* this milestone.
- One virtual camera with an adjustable follow/lead/lag position. Prefer holding and making simple intentional moves over wandering constantly.

**This is not steering physics.** Continue to let `ScrapEngine` calculate the real racing outcomes. The 2D stage samples the existing shot timeline; its visuals must not write back to the engine or consume gameplay RNG.

## Motion vocabulary

Implement **small, reusable motion controls**, all sampleable deterministically at an absolute elapsed time, regardless of refresh rate, and composable from a short cue/timeline:

1. Idle / hold and normal road travel.
2. Accelerate and decelerate with visible easing and readable ground movement.
3. Small chassis bounce/roll and independent wheel spin, grounded on the tyres.
4. Brief lift/jump **only when a real event/outcome authorizes it**, with anticipation, a clear airborne beat and a landing compression/rebound.
5. Impact/shudder **only when a real event/outcome authorizes it**, without inventing physical damage.
6. Camera follow and lead-in/settle easing, with tunable speed and shot duration.

Use a lightweight cue table (start time, duration, subject, action, intensity, optional source event key/actual resolved outcome). Author a few useful presets with shared primitives, **not** a second event-specific animation engine, rigidbody simulation, or one bespoke animation file per chassis. Include reduced-motion alternatives. Avoid adding random screen shake just to mask missing poses.

## Deliverable A: actual Art Forge animation playground

Reuse the **existing local Studio Playground / Art Forge** infrastructure if available, with an isolated Scrap Prix workspace and its existing navigation. If the local project is not accessible, provide an isolated offline preview under `previews/` and a simple installation path, rather than inventing a whole new platform.

The playground should allow us to:
- Choose a supported loadout (start with Salvaged GT; test Longbody wheel geometry; Needle if practical).
- Switch action presets: cruise, accelerate/brake, bump, takeoff/landing, impact.
- Play, pause, restart, loop, step/scrub, 1x/2x/4x, reduce motion.
- Adjust a few **meaningful** parameters such as duration, acceleration easing, bounce height, camera follow and camera lead. Show current cue, position and wheel-ground references.
- Inspect motion at original 480x270, without the old HUD obscuring it.
- Save or copy a lightweight preset/config for repeatability; avoid a sprawling animation editor.

Don't use elaborate finished art. Simple but deliberate silhouettes and readable mechanical motion are the point. Reuse approved geometry/mount data when practical, but do not spend days trying to make the current 3D-derived bitmap behave like a skeletal sprite.

## Deliverable B: one visible integration into the REAL experimental race

**Do not stop at another unrelated POC.** Connect the **same reusable side-stage implementation**, not a second rewritten renderer, to at least the ordinary **side-tracking driving shot** in the real opt-in theatrical DEV mode.

Use **seed 2** to prove the game genuinely displays the new stage for launch/ordinary travel and resumes the heatwave with true engine outcome. The stage must support the actual chosen loadout if represented; when unsupported, display an honest existing-renderer fallback, not a made-up generic car pretending to match its installed components.

Use **seed 3** as the route-choice regression fixture. No requirement to make an elaborate Dune Shortcut cinematic; prove the stage doesn't interfere with holding for a choice, safe/risky recalculation, re-anchoring, results or skip.

An optional brief reaction to an already resolved ordinary outcome is welcome **only if genuinely grounded in that engine result**. Do not create fake jumps, collisions, overtakes or damage for a heatwave. For stage demo presets, clearly label illustrative motions that are *not* effects witnessed in an actual race.

The side stage should become the *reliable action shot*; preserve existing rear/front views for now. No new angle library or major camera choreography pass. The player should immediately see a more readable side view, even with temporary shapes.

## Deliverable C: timing checks and evidence

- Test the same timeline timestamp multiple times and after seeking back: identical pose/frame, no drifting wheel angle, camera or parallax.
- Validate wheel contact, axle count, body bounce, motion/ground speed relationship and no clipping in 480x270 across representative chassis.
- Check pause, restart, playback speeds, reduced motion and skipped/interrupted real races.
- Compare original Phase 3B side shot to new animated side shot **at equivalent camera/scene time**, plus supply a short actual motion capture and at least one real end-to-end race.
- Confirm unchanged engine outcomes/standings/equipment/wear/rewards, and run the ordinary-race, First Flight, vehicle-pipeline, save/reload, bounty/Encyclopaedia and build/smoke checks.
- Run browser inspection; a source-only implementation or screenshots of static shapes do not count as the delivered result.
- If any tests are flaky, distinguish retries from proven fixes and do not weaken gameplay assertions.

Commit in a few small steps: stage primitives, playground controls, one real-race integration, verification. Deliver exact commits, local preview/Art Forge route, screenshots and a short recording, plus a list of limitations. No main merge or production deployment.

## Explicit non-goals

- No art polish to the POCs; no finished chassis or track assets.
- No mass-building all 40 parts, 17 gag cars, full animation catalogues or legendary takeovers.
- No changing gameplay, events, mechanics, probabilities, economy or balance.
- No real-time 3D driver or physics solver; no parallel race-state simulation.
- No new services, asset production systems, or complete UI redesign.
- No "fix all camera timing" work across every existing shot.

**Stop after one convincing reusable animated side stage and its first real-game shot.** Ask for owner visual review before broadening the animation vocabulary.