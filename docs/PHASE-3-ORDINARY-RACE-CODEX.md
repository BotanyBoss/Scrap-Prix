# Scrap Prix: Phase 3A | First complete ordinary theatrical race

**Status:** Codex implementation brief, not an implemented feature.  
**Review branch:** \`codex/ordinary-race-integration-first-flight\` based on \`edd3dc7b44eb7db8747fcdd3e982d47d3c01685d\` on \`codex/modular-vehicle-pipeline\`.  
**Purpose:** Build one genuinely playable end-to-end ordinary race using real saved garage state, real seeded game outcomes, the working race director and the modular vehicle-frame pipeline. Show a race, not another isolated tech demo.

## Must-read context

Read \`AGENTS.md\`, \`docs/ROADMAP.md\`, \`docs/RACE-PRESENTATION-DIRECTION.md\`, \`docs/ECONOMY-PLAYTHROUGH-2026-11-13.md\` and both POC READMEs.

Trace the actual code before editing:
- \`src/02-catalogue.js\` and \`src/03-engine.js\`: immutable authority over event selection, race mechanics, choices, damage, finishing positions and rewards.
- \`src/05-presentation.js\`, \`src/12-event-director.js\`, \`src/25-app.js\`: existing replay state, choice re-anchor, skip, speed, HUD, garage/results/continue.
- \`src/26-bounties.js\`, \`src/27-encyclopaedia.js\`: deferred witness settlement and discovery.
- \`src/30-race-manifest.js\`: read-only facts.
- \`src/31-race-director.js\`: a **Broken Bridge-only** shot planner, not a general race timeline. **Do not stretch the 24.3s bridge sequence across an entire race.**
- \`previews/first-flight/\`: completed, owner-accepted mechanical POC. **Do not polish or rebuild it.**
- \`previews/vehicle-pipeline/\`: shared geometry and two rendering paths, three supported chassis, nine other component choices, 164×113 transparent camera frames and bounded LRU. Temporary donor geometry, not approved production art.
- \`src/09-vehicle-art.js\`: existing supported fallback that preserves actual equipment identities.

## The end-to-end acceptance goal

A player uses the **existing Scrap Prix DEV garage** (not a fake second garage) to prepare a real loadout, select an approach, press Start Race, watch the whole genuine 3–7-lap race as a small procedurally directed cartoon, choose an actual optional route when rolled, finish with the real result/awards and return to the normal garage.

It should run in a **clearly opt-in experimental theatrical mode in the dev build / Studio Playground**. Keep the existing race renderer as an immediate fallback and the default. Do not deploy experimental visuals into the public game or require a new platform/service. If connecting to local Art Forge is practical, expose the same experimental mode there with the existing workspace patterns, not a new standalone app. The standalone POCs remain intact.

**We are testing integration and truthful flow, NOT animation polish.** Simple, janky placeholder artwork is fine if the scenes are legible, the vehicle stays recognisable and the experience behaves like the real game. User explicitly approved leaving previous POCs unpolished.

## Slice sequence

### A. General Race Timeline adapter (first commit)

Implement a small, serialisable, deterministic *general ordinary race* shot timeline from a resolved \`ScrapRaceManifest\` and the existing replay/event-timing data. Keep \`src/31-race-director.js\`'s Broken Bridge contract working unchanged; add a separate reusable adapter if necessary.

Required reusable shot families:
1. Establishing/grid + track/weather reveal.
2. Driving/road movement between events, with visible passage of time and lap progression.
3. Real scheduled event cutaway, with event ID, source occurrence, lap, actual outcome and relevant weather.
4. Choice/decision hold, showing the existing safe/risk labels and build suitability; no advance until the user acts.
5. Consequence/condition close-up that displays real slot-by-slot damage, performance and sponsorship effects.
6. Finish or real DNF/DNS treatment leading into the already existing result UI.

Use only real engine-resolved laps and effects (not scheduled future events after a DNF). Preserve event occurrence keys so repeated occurrences cannot be confused. No fabricated rival overtakes, mid-lap rankings, eliminations or dramatic damages: the engine does not currently record a complete intermediate position history. If a cinematic category has no specific art, use a generic truthful shot and existing event text rather than silently omitting it. Do not introduce event outcomes or extra simulation.

Use a **single authoritative visual clock**, deterministic absolute-time sampling and an explicit player-choice pause; support re-planning/re-anchoring after the existing \`E.race(before, choices)\` calculation. Rebuild only the necessary scene/frame cache when a player's chosen branch changes.

### B. Reuse modular frames in a real moving race (second commit)

Make a small race-frame provider around \`previews/vehicle-pipeline/assembly.js\` and \`render.js\`; reuse its source geometry, camera convention, materials and on-demand cached captures where possible, rather than copy-pasting a new approximation.

Supported geometry at this proof stage: Salvaged GT (\`stock-chassis\`), Needle (\`needle-frame\`) and real six-wheel Longbody (\`longbody\`) with available component combinations. Use source-grounded rig/slot combinations, retaining wheel count, scale and gear identity in side/rear/front views. **Do not fake missing parts as similar donor parts.** When the current garage loadout is unsupported, choose the real existing \`ScrapVehicleArt\` renderer (or display a clear unavailable message with working fallback); never render a different build while claiming it is the player's car.

Use clean bounds and cache invalidation when equipment changes; do not generate all possible combinations in advance. Keep 480×270 as the canonical race viewport. Shared 3D/2D geometry is an asset source, **not** a demand for real-time 3D driving physics.

### C. DEV gameplay integration + controls (third commit)

Add a dev-only opt-in theatrical race mode behind an explicit switch. Preserve default production gameplay/race view and all save formats.

The actual game must still own:
- Garage/shop/repair/Bodge/loadout/approach decisions.
- Start, choice submission, finish, rewards and return-to-garage.
- 3–7-lap race progression, real weather/track, event ordering and actual slot damage.
- Pausing, 1×/2×/3×/4× speed, skip, Next where supported, reduced motion, keyboard/touch accessibility.
- Deterministic replay and choice re-anchor, including safe defaults only for unresolved choices on skip.
- Encyclopaedia seen-vs-missed tracking and witnessed-only bounty settlement, with no duplicate rewards/penalties on skip, rerender, reload, choice recomputation or replay.

Keep the existing HUD understandable. Do not make the film a separate post-race replay: while this experimental mode is active, it replaces the *presentation* of the actual race, without replacing game rules. The result screen remains the same real outcome. A browser reload during an unfinished film must recover the committed state according to existing recovery rules, not silently award unseen events.

### D. Test and prove real variety (fourth commit)

Inspect and use these **real first-race seeded fixtures**. They have been checked against the current catalogue/engine at Phase 3A start; verify them again in the local working tree:

| Seed | Real first-race state | Specific gate |
| --- | --- | --- |
| \`2\` | 3 laps, signature \`heatwave\` on lap 2 | Minimum-length ordinary race |
| \`18\` | 5 laps, signature \`debris\`, optional \`deep-sand\` | Multiple actual events over longer race |
| \`71\` | 7 laps, \`lucky-gap\` plus signature \`debris\` | Maximum-length ordinary race |
| \`3\` | 3 laps, \`dune-shortcut\` choice at occurrence \`late\` | Real branching choice and re-anchor |
| \`76\` and \`385\` | Existing Broken Bridge safe/fail/success cases | Regression; **do not polish old POC** |

Also verify a real DNF and no-start, and test the exact 3 supported chassis with available parts. Do not force particular results in a live race by modifying its game state or RNG; tests may use explicitly labelled, legal setup fixtures.

Perform browser checks at 480×270 and a responsive outer UI size. Record at least one actual full animated ordinary race, including transitions and finish, and one with a choice. Verify no JS console errors, no money/damage/standings changes from old renderer, consistent repeated-frame output, no missing laps/events and working controls.

Run existing build/check, deterministic, Race Manifest, First Flight, reward/bounty/witness/Encyclopaedia, 3D garage and browser smoke suites. Existing tests relying on fixed script indices may need narrowly scoped updates when adding modules; preserve their gameplay assertions.

## Phase 3A sign-off checklist

- [ ] A real garage-built car takes part in a complete 3–7-lap visible race, then reaches the real results screen and can continue.
- [ ] All actual event beats, lap changes and mechanical results are represented; no imaginary overtakes or damage.
- [ ] Existing safe/risk decisions change authoritative outcome once, with correct scene re-anchor.
- [ ] Supported 3D-to-2D frames depict the real current equipment; unsupported loadouts retain an honest source-faithful fallback.
- [ ] Skip, speed, pause, reduce motion and interrupted playback preserve saved-state/bounty/discovery correctness.
- [ ] Experimental renderer is opt-in and cannot affect the public production build or existing game by default.
- [ ] Tests pass and Codex supplies **browser screenshots / short capture, exact commit and local preview instructions**.
- [ ] Unfinished art (donor geometry, stylised quality, hero shots) is transparently labelled; no silent approval of final chassis assets.

## Explicitly out of scope

Do **not** touch balancing, event frequencies, the 47-bounty library, Epic/Legendary takeovers, audio production, multi-stage spectacle art, unusual gag transformations, new vehicle models, the 10-second CLICK alternate-art event, catastrophic animation-quality RNG, overhaul UI styling or polish the Broken Bridge/vehicle pipeline POCs.

Do not create another separate racing app or duplicate the engine. Avoid broad infrastructure / microservice refactors. Do not merge into \`main\`, close existing stacked PRs or deploy. Preserve the two verified POC commits.

**Stop after the real ordinary race is playable and browser-tested.** The user's next checkpoint is to judge whether an actual full-length race is entertaining, not to rate how polished the placeholder drawings are.
