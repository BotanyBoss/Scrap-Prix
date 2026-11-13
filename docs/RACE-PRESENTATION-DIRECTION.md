# Scrap Prix — Theatrical Race Presentation: Creative Direction & Prototype Contract

**Status:** Creative direction selected, **technical pipeline not yet proven**. Review-branch design document, 13 November 2026.

## North star

**Garage is the strategy. Race is the show.** Scrap Prix is a deterministic survival/car-building roguelike with a **fully interactive, rotatable 3D garage**. A race is a procedurally directed **2D animated racing cartoon**, not a physics-led 3D driving world and not a separate replay after the race. The player remains a player: choices, build preparation, wear, events, fortune, failures and rewards have real consequences.

The ideal fantasy is a Mario Kart/Wacky Races level of absurd spectacle happening around the cars. That is a **creative target, not a request to build a full arcade driving game**.

Current creative decisions:
- Keep the interactive 3D garage, with modular chassis, engine, tyres and gadget, visible wear and 3D inspection.
- Render the race as deliberately composed 2D shots, limited animation, cuts, pans, zooms, dialogue, environmental inserts and occasional full-screen takeovers.
- Assemble a fresh race from prepared art/shot assets and the *already computed* deterministic result; **do not generate imagery with AI when the race plays**.
- Share car identity across garage and race, including **actual equipped parts, wheel layout, damage and gag forms**.
- Keep standard race controls: pause, 2x/3x/4x/skip, reduced motion, and a responsive choice prompt. No forced unskippable spectacle.
- Most events remain short and often mechanically modest; some Epic events are background spectacles, some hit the track. Legendary outcomes can temporarily become the entire screen.
- Actual 3D-vs-2D asset production technique is **not yet locked**. Candidate: render assembled modular 3D cars into reusable 2D frame/view assets and cache them. Alternative: layered 2D rigs. Choose by a real comparative benchmark.

## Existing authority and boundaries

The working engine in `src/03-engine.js` resolves seeded races, damage per part, event chains, route choices, position and rewards. Keep it authoritative.

`src/05-presentation.js` creates the replay/view model. `src/12-event-director.js` and event modules already control presentation timing and special moments. Extend these rather than introducing a second game engine.

**Invariant:** No shot, illustration, interpolation, camera choice, dialogue variant or cut may change the seeded result or consume the gameplay RNG stream. Cosmetic choices use their own deterministic namespace.

An event outcome and its apparent severity are different things: spectacular backgrounds can be harmless, but the engine can also choose true player damage or rival incidents. If something removes a rival, standings must genuinely reflect that outcome; don't fake an elimination.

## Build a race from a sequence of authored shot templates

The eventual director reads a deterministic *race manifest* of laps, participants, equip sets, effects, outcomes and condition changes. It emits a shot timeline. The exact schema awaits the prototype, but each shot needs at least:

- **Identity:** beat ID, race/lap number, source event key, selected outcome, view family.
- **Subjects:** player or rival, exact equipped car, optional environment/character.
- **Timing:** duration, emphasis, interruptible/cancellable and clear re-entry point.
- **Camera language:** side, front three-quarter, rear three-quarter, establishing, component close-up, background spectacle or character inset.
- **Art dependencies:** which premade poses, overlays, background layers and sound cues are required.
- **Feedback:** event dialogue and a *separate* mechanical readout for damage, performance and rewards.

Shot categories (not unique hand-authored movie files):
1. Establishing track/weather and starting-grid.
2. Continuous abbreviated race movement, starts, position changes and finishes.
3. Mechanical reactions: engine struggle, wheel failure, suspension impact, wear.
4. Route choices, waiting for player response, then matching success/failure shot.
5. Event reactions and cutaways: cow, bridge, meteor, kaiju fight, plane.
6. Epic/Legendary: event takes over the screen, then returns to the exact race beat.

**The director should not promise "perfect anime" from a handful of pans.** Coherent composition, sound, posing, animation spacing, consistent light/shadow and motivated editing remain genuine production work.

## Modular car art contract

To avoid a full hand-drawn film for every random build, each vehicle assembled in the 3D garage must have:
- A stable body origin, orientation, canonical scale and named wheel/engine/gadget mounting sockets.
- Chassis-specific wheel positions/counts and occlusion/overdraw order; e.g. **Longbody has six wheels**, not a four-wheel template with a fake extra tyre.
- Consistent material/colour mapping between 3D master and 2D render. "Clean at 100% durability" does not mean factory new: salvaged is a style; damage is an independent state.
- Limited author-approved *view families* used by the animation library, rather than every possible angle.
- Reusable motion controls: translation, tilt, bounce, speed smear, mechanical shudder, impact and failure. No requirement to reanimate an entire car for every new component.
- Support for extreme silhouettes, including **Needle's narrow frame** and **Wobble Wagon's eventual LEFT/RIGHT height asymmetry**.
- A full fallback: if an angle or specialised treatment is unavailable, use an approved simpler shot. Never silently substitute a different vehicle or incompatible fitted part.

**Do not preload/pre-render a combinatorial library of every possible chassis x engine x tyre x gadget x wear combination.** Assemble the exact vehicle and render/capture only the small set of required views for its current race, with bounded caching where benchmarked.

## Example treatment using a real existing event: Broken Bridge Jump

`broken-bridge-jump` is already in the event catalogue. The proposed sequence adds no event outcomes:
1. Establishing shot: damaged bridge approaching; existing race view gives way to the obstacle.
2. Choice framing: cut/freeze at the safe vs risky decision, display current build suitability.
3. Safe branch: short wide detour; reveal actual time/performance cost.
4. Risk-success: side-on lift, held air-time, landing, return to the race; show actual effects.
5. Risk-failure: same approach until impact, then comic crash/limp-away, show actual effects.
6. Rejoin race: preserve current lap, positions, weather and condition.

This event is better for validating **branching shot assembly** than immediately implementing a Legendary takeover.

## Studio Playground proof, not a production catalogue

**First experiment: ONE 20–30-second scripted race excerpt**, as a separate, non-production module using actual project components where practical.

Test three deliberately incompatible silhouettes:
- **Salvaged GT:** familiar baseline.
- **Needle:** extremely narrow, unusual dimensions.
- **Longbody:** one front axle + two rear axles, visibly six wheels.

Across the three, test two alternative engine/tyre/gadget sets, a minimum of **three coherent views** (side, front three-quarter, rear three-quarter), basic acceleration/bounce/impact, visible per-part wear, and ONE actual choice event (Broken Bridge Jump) with safe, success and failure variants.

**Acceptance gates:**
1. All assembled parts and their mounts stay recognisable in every required view; no impossible wheel count, floating engine or component overlap.
2. The same source car and material treatment reads consistently in garage and 2D race shots.
3. Shots and event endings are deterministic from the same result; no gameplay RNG consumed and replay produces the same events/placement/damage.
4. Choice prompts, skip, speed controls and interrupted transitions correctly resume or finish.
5. The shot composer is small enough to author additional events *without bespoke rework of every vehicle*.
6. Performance and memory are measured on representative target hardware before choosing live-to-texture rendering or cached frames.
7. The result is entertaining at both normal and fast speeds, not just pretty as a still image.

Until those are proven, **do not mass-produce the ten final chassis or redesign all environments for the new race format**.

## What we can improve now, without art

- Polish existing event writing and option/outcome clarity, preserving existing statistical outcomes.
- Separate narration from readable mechanical feedback in the replay UI.
- Fix verified presentation-state bugs such as weather event HUD mismatch.
- Document camera/shot intent for existing high-value events, without building new visuals.
- Build deterministic fixtures for rare multi-stage and choice branches.
- Keep the first playable demo as a bounded subset of the full spectacle vision.

**Deferred ideas, not demo blockers:** Epic vs Legendary takeover tiers, Pilot Cam/WHOOOO, nuclear fallout track metamorphosis, handshake conditions and full cinematic character dialogue. Preserve them as design directions, not immediate production tickets.
