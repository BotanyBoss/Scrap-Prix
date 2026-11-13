
# Scrap Prix | New Presentation Impact & Non-Art Gap Audit

**13 November 2026.** Source review: main ff5a825e; unmerged feature/threejs-garage-first-pass e30f48c0; standalone codex/garage-3d-first-flight review branch.

## Verdict and main risks

**Feasible in principle.** The current deterministic racing roguelike already computes results, events, wear and rewards without real-time driving physics. That architecture is useful for an assembled racing cartoon.

**Not yet proven:** (1) mass-customisable 3D cars becoming convincing and fast 2D animated shots from multiple angles; (2) a truthful race-story timeline from a result system that currently tracks final placing much more fully than intermediate rival positions; (3) satisfying normal cartoon races without mountains of bespoke animation content.

Rendering 2D does not automatically create high-quality animation. A good procedural director, reuse of poses/backgrounds, soundtrack and careful transition timing are still substantial creative work.

## Integration trap: production and feature code are split

- Main has the original playable 2.5D race, but not Bodge, Bounty Board, Encyclopaedia, 3D garage integration or temporary dialogue UI.
- The newest open stack includes PR #2 (Emergency Bodge), #3 (Bounty core), #5 (content auditing), #6 (board UI), #7 (nine more contracts), #8 (Encyclopaedia), #9 (in-race bounties), #10 (temporary dialogue), #11 (opt-in 3D garage).
- The existing codex/garage-3d-first-flight review branch has separate previews, chassis decisions and newer art/theatrical-direction docs. It does not contain that stacked feature implementation.
- These need an intentional integration worktree/branch, saved-game migration tests, and review. Do NOT merge the whole stack or push to production on the strength of old CI alone. The final #11 branch build/check passed on 9 Nov but a complete human playtest is not evidenced.

## Compatibility by file/asset

| Current asset / code | Treatment | Why / collision |
| --- | --- | --- |
| src/02-catalogue.js + src/03-engine.js | KEEP + SMALL EXTENSIONS | Core balance, RNG, damage, choices, stats and 3–7-lap rules survive; no physics engine needed |
| src/08-gag-recipes.js | KEEP | Exact 17 four-part combinations remain gameplay authority, and must also match animation assets |
| src/04-cosmetic-surprises.js | KEEP | Cosmetic seed isolation can choose deterministic alternate shot/dialogue without affecting mechanics |
| src/05-presentation.js | REFACTOR | Old replay/camera steps need manifest-to-shot translation; currently interpolates overtakes from final placement |
| src/12-event-director.js | EXTEND | Timing profiles, overtakes, choice re-anchor are valuable; add shot plans and transition/fallback logic |
| src/09-vehicle-art.js | REUSE SELECTIVELY | Existing Canvas projected-face rigs and palettes useful as fallback/reference; not guaranteed sufficient final cartoon art |
| src/10-environments.js | ADAPT | Existing environments, sky/roadside/road concepts and colours become illustrated backgrounds and per-shot layers |
| src/20-scene.js | REUSE FX, RETIRE AS MANDATORY CORE | Current world-unit road projection and rear-view track motion cannot dictate all cinematic shots; archive until replacement works |
| src/11-event-effects.js and 13–19 | PORT SELECTIVELY | Many animations depend on specific 480x270 camera coordinates, perspective and pixel scale; timing/content ideas survive |
| src/25-app.js + src/game.css | REFACTOR RACE UI ONLY | Preserve garage/shop/results; change race canvas/HUD, full-screen takeover, choice prompt, pause/skip and audio access |
| src/26-bounties.js | KEEP + FINISH | 41 implemented contracts; wraps race, repair, purchase, save. Real integration risk with choice replays and event witness settlement |
| src/27-encyclopaedia.js | KEEP + EXTEND | Permanent player-earned discoveries. Epic rarity currently absent; witnessed vs missed needed for hidden long-shot bounties |
| src/28-dialogue-ui.js | KEEP PROTOTYPE | Anonymous captions only; casting and actual dialogue remain a separate workstream per owner |
| src/29-three-garage.js | KEEP IDEA, REDO PLACEHOLDER MODEL | Real opt-in Three.js scene, four groups and lazy CDN import, but approximate component shapes and fixed four-wheel layout |
| previews/garage-3d-*.html | REFERENCE | Useful turntable, modular and damage experiments, but no certified shipping GLB asset masters |
| docs/vehicle-concepts/ | KEEP VISUAL INTENT | Six approved directions, Needle accepted; Hauler/Tub awaiting true art refinements; Wobble parked. Need socket/pose review before production |
| Mechanical Fossil PNG originals | KEEP | Approved source identity/art reference; still need animation-compatible views/rigging for multi-angle cartoon shots |
| scripts/build.py + game.template.html | EXTEND | Current single-file embedded HTML and external lazy Three.js CDN are not a finished guaranteed-offline 3D/Steam pipeline |
| tests/* and GitHub workflow | UPDATE | Already valuable. Some tests assume script[25] and exact script counts and will break with new modules; add storyboard, replay and save tests |
| Local game saves and permanent archive | MIGRATION GATE | Main run import/export and separate PR Encyclopaedia state must survive branch merger and changing replay formats |

## Non-art gaps and blockers, ranked

| Priority | Missing/unfinished | Evidence | Exit criteria |
| --- | --- | --- | --- |
| P0 | One coherent baseline from open PR stack | Main lacks 26–29 modules; stacked branch has them | Green full regression and explicit non-deploying review |
| P0 | Versioned Race Manifest and truthful Shot Plan | Existing replay uses final-position interpolation | All depicted wins/passes/damage/choices match engine truth |
| P0 | Choice + skip + resume correctness | Current replay re-resolves choices and reanchors; skip defaults safe | Never double-pays contracts or contradicts seen/hidden events |
| P0 | Real vehicle 3D sockets, wheel layouts, pose/view compatibility | Present garage model is schematic; Longbody is actually six-wheel | 3 chassis, 3 views, alternative equipment and damage accepted |
| P0 | Performance/asset-generation validation | No production 3D-to-2D capture rig yet | Benchmarked memory/latency/FPS on representative devices |
| P0 | Full bounty/Bodge balance and feature-branch integration | Synthetic tests, no full natural-run proof | Realistic seeded playtest and state/reward correctness |
| P1 | Finish rare-weather/event and Legendary Special Order bounty library | 41 existing but long-shot categories remain undone | Hidden/witness-safe goals, deadlines, settlement and tests |
| P1 | Epic/outcome rarity in data and Encyclopaedia | Current simple event weights/legendary tags and order lacks Epic | Correct display and probabilities reviewed independently |
| P1 | Sound system | No central audio/music mixer observed | Trigger/duck/mute, sound categories, accessible captions |
| P1 | Onboarding, feedback and accessibility | Some tips, motion CSS, speed/skip exist | New-player guidance, reduced flash/shake, captions/touch/keyboard |
| P1 | Event narrative vs mechanical feedback | Current replay appends score/damage onto jokes | Clear separate effect readout, accurate per-part damage |
| P1 | Permanent archive export/restore and run crash recovery | Current game exports run; PR Encyclopaedia is separate localStorage | Documented backups and no silent progress loss |
| P1 | Cross-browser/offline packaging | CDN-imported Three.js; standalone HTML for main game | Offline 3D garage and playable packaged demo |
| P2 | Achievement meta, additional race types, large epic/legendary library | Future ideas | Not required for first demo |

## Concrete technical risks to design around

**Truthful rivals:** Current rival "incidents" reduce a score and visual overtakes are distributed according to final place. A future falling plane eliminating a rival would need actual engine DNF semantics. A dramatic camera cut cannot be allowed to manufacture gameplay truth.

**Race choices:** Current start-of-race calculation assumes safe route, and choosing risk during replay recomputes the same seeded race. The director must re-plan safely, preserve the current cut anchor, and prevent duplicating bounty/Encyclopaedia transactions. New user decisions still happen during the cartoon.

**Bounty witnessed-only rewards:** PR #8 intentionally marks an event seen only if actually watched. An event appearing in the engine result then skipped should not qualify for a future witnessed-only long-shot. Contract expiry/reward must have one clear transaction point, with save/resume interruption tests.

**Modular assembly:** Chassis-specific sockets and part geometry (six wheels Longbody; Wobble longitudinal roll/asymmetry; Needle extreme dimensions) must survive 3D garage and 2D shot rendering. Pre-rendering all car combinations would explode combinatorially.

**Old race art and environments:** Current Street buildings, road-perspective procedural depth, and much of the event FX assume a constant rear-view 2.5D camera. Reuse themes/illustrations, not necessarily their coordinates. The playable catalogue includes **nine track definitions**, not the entire 36-environment idea list.

**No accidental new mechanics:** The style change should not retune the shop, introduce extra damage protections, guarantee full multi-stage finales or rewrite the endless rules. Multi-stage misses should still roll again on subsequent laps.

**Ordinary fun:** The theatrical baseline must work without a kaiju/nuke/Pilot Cam. A repeating slideshow of event cards is not an adequate replacement for racing.

## Groundwork already demonstrated

- Seeded race calculation and tests separate game rules from presentation.
- 40 parts, 17 exact gag recipes, actual shop/repair decisions, weather/hazard interactions.
- 48 wildcards, 37 anomalies, 26 special passes, seven fake passes with content-audit tests in an unmerged branch.
- Reusable staged anomaly continuation rolls, choice resolution and presentation timing families.
- Preliminary modular 3D garage with distinct chassis/engine/tyres/gadget groups, plus standalone experimental viewers.
- 41 contract definitions, persistent Encyclopaedia and in-race bounty viewer in unmerged, tested PRs.
- Fast/skip/pause and reduced-motion support exists in part, not yet adapted to a cartoon shot player.

## Production success gates

**A. Baseline:** Consolidate/tests without deploying; preserve saved runs and source authority.
**B. Engine contract:** Deterministic Race Manifest plus Shot Plan, branches/skip/resume correctly represented.
**C. Visual pipeline:** Actual assembled 3D car outputs believable matching 2D angles with damage, cache and animation; three dissimilar chassis pass.
**D. Entertainment:** Complete ordinary race plus one choice and result works without expensive epic assets.
**E. Demo:** New-player comprehension, bounty/economy integrity, sound/comfort, offline reliability, full regression and playtesting.

**Verdict:** Lock the creative vision. Do NOT lock the exact 2D rendering technique or throw away working 2.5D assets until C and D pass.
