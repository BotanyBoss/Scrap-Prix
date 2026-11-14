# Side animation stage

Run `py -3 previews/side-stage/build.py` and open `dist/SIDE-STAGE.html`.
To install the route into the existing local Art Forge project, pass its root
as the final argument to that build command. It adds `#/side-stage` to the
existing navigation and copies the offline preview into `public/race-director/`.

The runtime is `src/35-side-stage.js`. Both the playground and the experimental
DEV race bundle this same file. `createRig(loadout, Pipeline)` reuses the original
hub and mount data and returns null for unsupported equipment. The supported
parts are exactly the pipeline's three chassis and three choices per other slot.
Artwork is deliberately temporary. The in-game caption identifies the study.

`preset(name, parameters, illustrative)` produces a serialisable cue table.
`sample(plan, elapsedMs, reducedMotion)` returns absolute-time pose, camera,
distance and velocity. `draw(ctx, rig, plan, elapsedMs, options)` paints native
480 by 270 coordinates. It respects the caller's canvas transform.
Wheel angle is integrated travel distance divided by each wheel's radius.
Body bounce leaves the wheel hubs grounded. Jump uses anticipation, airborne
lift and landing compression, while impact uses a decaying shudder.

Road speed and playback speed are separate controls. Duration scales preset cue
timing. Acceleration easing blends linear and smooth velocity ramps. Body bounce
changes suspension travel. Camera settle controls the lead-in time, and camera
lead changes the final held framing. Config JSON restores the preset, loadout
and these parameters. Stage playback and reduced motion are session controls.

Bump, jump and impact presets are explicitly illustrative. The real-game adapter
only calls idle, accelerate and cruise with illustrative permission disabled.
It does not infer physical impacts from generic damage or perform a jump for
heatwave. Side grid/driving shots use this stage; the existing renderer handles
unsupported loadouts and the other shots. Race timing, route holds and settlement
remain owned by the existing app.

Build the game with `py -3 scripts/build.py`. In `dist/dev.html`, enable
Options > Experimental theatrical race and start seed 2. Seed 3 exercises
Dune Shortcut, including both safe and risky route decisions.

## Verification

- `node tests/side-stage.cjs` checks 81 rigs, wheel contacts and distance/velocity
  consistency, absolute sampling, cue phases and reduced motion.
- `node tests/side-stage-browser.cjs` checks the controls and captures actual
  playback. Set PLAYWRIGHT_MODULE and CHROME_PATH for the local browser.
  Optional FORGE_URL selects the embedded route, PROOF_DIR selects capture
  output, and BASELINE_DEV selects a Phase 3B dev.html for an exact elapsed-zero
  opening comparison.
- `node tests/ordinary-race-browser.cjs` checks complete real races, stage
  equipment continuity, safe/risky choices, pause, skip and reload.
- Existing vehicle-pipeline and First Flight checks remain applicable.

## Current limits

The scenery is a generic motion study. Far wheels are slightly offset behind
the near wheels for readability in the side view. Parts have simple symbolic
shapes and unanimated equipment details. The study exposes presets rather than
an arbitrary keyframe editor. Jump and impact have no live-race mappings in this
slice. The completed game still includes the earlier camera and consequence
shots, whose timing is outside this stage review.

## Phase 3D | Real Flying Spare Parts in seed 18

The DEV theatrical race now recognizes only genuinely resolved `debris` signature/wildcard
occurrences. One existing replay step is divided into a front-camera anticipation
hold, a side-stage reaction and a side-stage recovery. It does not change step
length or engine outcomes, and uses the same absolute event clock across both
side-stage shots. The car may jolt only when actual effect damage is positive;
a mitigated zero-damage occurrence uses an evasive reaction instead.

To review: build with `py -3 scripts/build.py`, open `dist/dev.html`,
enable **Options > Experimental theatrical race**, and start seed **18**
with the original starter car (do not buy equipment in the garage). Flying
Spare Parts arrives in the five-lap run. Pause, Next, 1–4x and Skip still use
the existing replay controls. The stage currently uses temporary shapes.

Run `node tests/ordinary-timeline.cjs` and `node tests/side-stage.cjs`
for factual timing/pose checks. For real browser continuity, run
`node tests/ordinary-race-browser.cjs` with Playwright and Chromium configured.
Production `dist/index.html` remains independent of all DEV theatre modules.

## Art Forge | Real Race Review (seed 18)

Use **Real Race Review · Seed 18**, next to the original Motion Lab mode
inside the *same* Side Stage route. It regenerates a new `ScrapEngine.newRun(18)`,
resolves `ScrapEngine.race`, compiles the production Race Manifest and
Phase 3D ordinary shots, and isolates the real Flying Spare Parts occurrence.
The replay timing and source-derived damage are the authoritative facts;
the road/sky/part silhouettes are temporary inspection artwork.

The viewer offers three phase jumps (warning, reaction, recovery), a frame scrubber,
1×/2×/4×, pause, loop, reduced motion, still-frame PNG download and
reproducible JSON capture. It intentionally makes **no edits to gameplay**.
This source-built preview is not equivalent to a full game UI/visual playtest.

To rebuild **without touching Art Forge's approved grouped navigation**:

```sh
py -3 previews/side-stage/build.py
py -3 previews/side-stage/build.py --refresh "<existing-Art-Forge-project-root>"
```

The second command requires that `src/main.tsx`, `src/model.ts` and
`public/race-director/side-stage.html` already contain the Side Stage integration.
It changes **only** the existing public Side Stage HTML and leaves the navigation
and project source untouched. An unrecognised installation fails without changes.

Verification: `node tests/seed18-review.cjs`, `node tests/side-stage.cjs`,
`node tests/ordinary-timeline.cjs` and `node tests/side-stage-browser.cjs`
(Playwright/Chromium for the last test). Run visual assessment at normal speed
before considering the sequence approved.
