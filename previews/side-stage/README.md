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
