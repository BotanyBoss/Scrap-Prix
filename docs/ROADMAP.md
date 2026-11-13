
# Scrap Prix | Updated Development Roadmap

**Updated:** 13 November 2026
**Direction:** Interactive 3D garage, procedurally directed 2D animated cartoon for the racing itself. The race remains part of the real car-building roguelike, not an optional post-race replay.
**Creative north star:** A wild Wacky Races/Mario Kart level of unpredictable spectacle. This is inspiration, NOT a mandate for real-time steering or a physics-driven racing simulator.
**Development rule:** Garage = strategy; race = show; deterministic rules + controlled chaos.
**Status:** Direction selected; vehicle-to-cartoon production pipeline remains unproven. No live gameplay change implied.

## Baseline reality

- Shipped main (ff5a825e, 6 Nov): four-slot car assembly, 40 parts, 17 exact gag recipes, endless 3–7 lap races, deterministic events/outcomes, shop/repair/tuning, race recap, replay controls, records, local save/export, and a rear-view 2.5D Canvas renderer.
- Branch feature/threejs-garage-first-pass (e30f48c0, 9 Nov): unmerged and stacked on earlier PRs. Includes Emergency Bodge, 41 bounties, an Encyclopaedia, Bounty Board, in-race bounty browser, anonymous dialogue UI prototype and an opt-in procedural Three.js garage. Last checked Build and check run succeeded, but natural human-style playtest and release review are not complete.
- Branch codex/garage-3d-first-flight: separate isolated garage previews/chassis approvals, Epic design note, event copy audit, weather-HUD review fix, and the new animation direction. This branch does NOT include the bounty PR chain. Do not treat the two branches as already integrated.
- Older Street-first notes (PROJECT-STATUS) document historical progress, not the new priority.

## What stays, changes and waits

| System | Direction | Required work |
| --- | --- | --- |
| Four-slot garage, shop, economy, durability, approaches | KEEP | Preserve balance, original decision-making and unpredictable risk |
| Existing seeded race engine | KEEP/EXTEND | Keep calculations authoritative; add race-story data only where needed |
| 17 gag recipes | KEEP | The same actual assembled vehicle must be visible in garage and cartoon |
| 3D garage | KEEP/FINISH | Replace procedural placeholders with actual modular assets and sockets; offline performance |
| Race presentation | REFACTOR | From persistent rear chase camera to an authored shot/scene timeline |
| Old 2.5D scenes and effects | REUSE SELECTIVELY | Backdrops, themes, parallax, sprites and event cues; do not force old perspective everywhere |
| Bounties, Bodge, Encyclopaedia, dialogue UI | REVIEW AND INTEGRATE | Currently in stacked, unmerged branches |
| 2D race production method | PROTOTYPE | Render/capture modular 3D vehicles or use layered 2D rigs, choose by measured results |
| Characters and written dialogue | SEPARATE WORKSTREAM | Intentionally excluded from the present non-art audit |
| Extra tracks and cinematic spectacles | DEFER UNTIL BASE WORKS | New content must not obscure release-critical work |

## Phase 0 | Reconcile the active development branches (FIRST)

1. Inventory dependencies: main -> Emergency Bodge PR #2 -> bounty core #3 -> content audit #5 -> noticeboard #6 -> added bounties #7 -> Encyclopaedia #8 -> in-race viewer #9 -> placeholder dialogue #10 -> 3D garage #11.
2. Review all gameplay differences, save versions, event weights and economy changes, especially whether Emergency Bodge's extra rescue option should ship.
3. Construct one isolated integration baseline to test the combined system; incorporate this separate roadmap/approved art direction carefully. Never merge a stack blindly into main or push a production deployment.
4. Run all syntax, determinism, gag/buildability, event, bounty, browser smoke and save/import regression tests.
5. Treat standalone 3D and Three.js racing experiments as references, not the chosen live renderer.

**Gate:** A clearly identified, tested, reviewable working build; production main remains unchanged until approved.

## Phase 1 | Race manifest and cinematic direction contract (P0)

- Create a serialisable Race Manifest containing seed, race, 3–7 lap timeline, track/weather, the exact four equipped parts, rival IDs, effects, event choices, results, per-slot damage, finish, rewards and bounty consequences.
- Compile that result into a separate deterministic Shot Plan: scene ID, source event/outcome, focus subject, shot family, pose, duration, transition, text and mechanical outcome.
- The existing replay fabricates some visual overtake timings from final place rather than recording every real intermediate position. Add truthful deterministic narrative beats or carefully constrained visual transitions, without creating physics or inventing rival eliminations.
- Preserve interactive race choices. The current game pre-resolves safe choices and recalculates after selected risks, then re-anchors replay. A new director must preserve that, with no double settlement of rewards/bounties, no phantom discoveries, and correct skip-safe defaults.
- Support ordinary events, multi-stage continuations that can fail rolls without cancelling, background-only vs track-impact outcomes, passes and fake passes.
- Keep camera and animation randomness in a separate cosmetic seed domain. No rendering code affects race outcomes.

**Gate:** Same seed and decisions produce the same saved race facts, placements, damage and rewards before and after director changes.

## Phase 2 | Vehicle-to-cartoon pipeline test (P0 / GO-NO GO)

Use Studio Playground as a completely isolated test surface:
- Salvaged GT, Needle and Longbody (real six-wheel layout) with multiple engines, tyres and gadgets.
- Three consistent view families (side, rear 3/4, front 3/4), one mechanical close-up, damage state, bounce, acceleration and impact.
- Use the same assembled 3D car for the rotatable garage and as a candidate source of stylised 2D frames. Compare against layered 2D rigs rather than assuming one solution.
- Define per-chassis wheel positions, canonical scale, engine/gadget sockets, material/livery channels, occlusion and per-slot durability effects.
- Compose a 20–30 second branching scene using the existing Broken Bridge Jump: safe, risky success, risky failure and return to race.
- Measure first-frame render time, FPS, memory/cache sizes, frame generation, no-network functionality, mobile and lower-spec hardware, plus reduced motion and speed/skip.

**Gate:** All three radically different cars look consistent in every view, survive equipment swaps, animate without bespoke re-authoring, and meet agreed device performance. If not, simplify view vocabulary BEFORE mass-producing assets.

## Phase 3 | First complete theatrical race (P0)

- Build a reusable small vocabulary of establishing, racing, overtake, component close-up, consequence, event, decision and finish shots.
- Direct a complete 3–7-lap ordinary race that feels like a cartoon rather than a slideshow. Preserve visual continuity and clear race results.
- Adapt race HUD, choices, pausing, fast-forward (2x/3x/4x), skip, reduced-effects options, player control, loading fallback and return to garage.
- Separate comic narration from exact mechanical feedback; use actual distributed component damage, not guessed affected parts.
- Integrate a small number of already implemented ordinary and branching events. No Epic takeover required for this milestone.

**Gate:** Normal races are satisfying, readable and faithful even without any expensive legendary cinematics.

## Phase 4 | Complete the non-art gameplay/content foundation (P0/P1)

- Safely integrate the optional Bodge/bounty/Encyclopaedia chain only after approval and playtesting.
- 41 bounty contracts already exist on the latest feature branch: 15 basic + 9 expanded + 17 classified gag contracts. Preserve one new offer per garage, three active slots, deadlines, cancellation as failure, penalties and limited vouchers.
- Finish the missing rare-weather, rare-event long-shot and Legendary Special Order contracts. Finalise their eligibility, rewards, deadlines, hidden requirements and true witnessed-vs-skipped completion rules. The Encyclopaedia's permanent witnessed-only discovery is required to avoid spoiling secret outcomes.
- Add Epic to event/outcome metadata and Encyclopaedia sorting only after auditing current weights: event tier is not damage severity and a normal Epic encounter can have a Legendary ending.
- Improve event copy, result clarity, shop/repair/bounty feedback and new-player onboarding.
- Stress the economy and Bodge with realistic seeded playthroughs, not only synthetic high-resource tests. Verify all gag recipes can be assembled with legal shop actions, and separately investigate normal-run attainability.
- Validate run save migrations, separate permanent discovery storage, backups/export, reload and skip during an animation.
- Retain bad-luck outcomes; no extra damage caps or guaranteed rescues without explicit gameplay approval.

**Gate:** Contract and race facts remain consistent through choice, no-start, victory, DNF, penalties, voucher redemption, skip, save and reload.

## Phase 5 | Event direction and exceptional content (after the base race works)

- Port core ordinary FX and route branches; then multi-stage anomalies, real/fake passing events, background spectacles and rarity-specific shot direction.
- Add Epic encounters that can resolve harmlessly or impact the player/track. Engine must record real outcomes; avoid a visible rival death if the rules only recorded a setback.
- Nuclear Fallout: an anywhere-in-race legendary detonation transforms background immediately, then further lap continuation rolls can transform roadside and road; full completion is not guaranteed. Use existing Radioactive Fallout theme as target source, not a full world rebuild.
- Jet plane: shared crash approach, rare Legendary engine-restart barrel-roll ending with Pilot Cam and full-screen WHOOOO takeover. Future asset/content work, not a current implementation gate.
- Handshake events: weather + specific build/gag + choice + event stage conditions trigger unique deterministic paths. Keep secrets discoverable in hindsight.
- Long-term target: 10–20 truly exceptional takeovers, not 20 mandatory demo assets.

**Gate:** A new event can be authored with a definition, outcome table and reusable shot cues instead of rebuilding vehicle/world rendering.

## Phase 6 | Demo polish, stability and release (P0 before public testing)

- Test first 15 minutes and first three races for understanding of part wear/replacement, driving approaches, choices and bounties.
- Build audio infrastructure (event cues, volume/mute, music ducking and optional captions), with authored music/VO separate.
- Accessibility: safe flash/shake settings, reduced motion, readable scalable text/subtitles, focus/keyboard/touch layout and usable fast-forward controls.
- Robustness: network-free 3D dependency bundling for shipping, memory/performance, corrupted saves, long runs, autosave recovery, browser crash/refresh, deterministic replay/choice, responsive UI.
- Update tests relying on exact inline script indexes/counts when the renderer/modules change; add golden tests for manifest and cinematic sequence continuity.
- Create stable demo distribution/packaging beyond the current GitHub Pages HTML; Steam-specific steps when release decisions justify them.
- Playtest with actual players before declaring the full game or demo ready; no arbitrary release date required.

**Gate:** Demonstrably fun ordinary races, correct rules, reliable storage, accessible controls and repeatable builds.

## After demo / explicitly not required now

Additional 36-environment idea shelf, additional legendary takeovers and detailed cinematic actors, achievement catalogue, expansive special orders, optional arcade racer spin-off, localization and other unproven ambitions.

## Next work achievable here without art

1. Branch-integration inventory and safe merge plan.
2. Race Manifest / Shot Plan specification + deterministic choices/skip tests.
3. Bounty gap matrix: 41 existing plus rare weather/event and Special Order proposals, with witness rules and economy checks.
4. Event clarity and feedback correctness, grounded in existing race effects.
5. Prototype acceptance test/script for Studio Playground, then the visual experiment when assets are available.

**Conclusion:** Lock the creative direction, not an untested render technique. Ship working milestones, not just longer feature lists.
