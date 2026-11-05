# Scrap Prix — shared environment art asset roadmap

**Scope: approved approach — retain the existing system; build one piece at a time.**
Source of truth: `src/10-environments.js` has 36 environment recipes. `src/02-catalogue.js` defines 9 gameplay tracks; some share a visual recipe.
**No tracks or environment recipes are being removed, disabled or deferred from gameplay.**
Our previous "five playable tracks" proposal is superseded: the five groups below are **shared art families**, not five tracks or an implementation cap.

## Five visual art families (all 36 current environment recipes)

| Family | Environments (DEV recipe IDs) | Reusable art techniques |
| --- | --- | --- |
| **Urban** | `city`, `street`, `factory`, `sewer`, `rooftops`, `utopia`, `cyber` | modular building fronts, industrial structures, windows, street furniture, perspective silhouettes |
| **Motorsport** | `drag`, `f1`, `circuit`, `airstrip` | barriers, stands, paddocks, signage, gantries, road furniture |
| **Nature** | `rally`, `forest`, `beach`, `mountains`, `jungle`, `prehistoric`, `swamp` | layered vegetation, hills, trees, shorelines, ground contact |
| **Harsh terrain** | `desert`, `snow`, `ice`, `offroad`, `pileup`, `wasteland`, `raiders`, `junkyard`, `warzone`, `volcano` | rocks, debris, terrain ridges, surface damage, visibility and depth |
| **Spectacle** | `space`, `moon`, `underwater`, `miniature`, `haunted`, `toyroom`, `alien`, `medieval` | themed silhouettes, landmark structures, scaled motifs, unusual lighting |

Family grouping is **a production convenience**, not a new layer of gameplay architecture. Keep each environment's own character; share the art kit wherever it genuinely fits.

The nine existing gameplay tracks and their mapping to these recipes remain intact. The broader DEV catalogue remains intact too. Asset work is prioritized **one item at a time**, starting with the Street tyre workshop, without sacrificing environment variety.

## Asset-production workflow

1. Select **one specific asset**, e.g. Street's tyre workshop.
2. Draw/refine it in the **real game renderer**, not as a detached concept image.
3. Inspect close, distant and moving frames at native `480×270` with rivals visible.
4. Record owner feedback; polish that asset until approved.
5. Add the approved piece to a reusable family kit where appropriate.
6. Proceed to the next asset, then integrate the full environment for review.

**Do not** redesign multiple environments at once, force all recipes into one generic look, delete unused assets or reduce the race rotation simply to meet an art-scope target.

## Shared kit (reusable across multiple tracks)

- [ ] Robust world-to-screen anchors, shadows and depth fade rules. Reuse the existing renderer; no independent scrolling overlays.
- [ ] Road-surface detailing rules: markings, material wear, subtle patches and edge contact.
- [ ] Scalable kerbs, pavements, barriers and verges with near/medium/far appearances.
- [ ] Two-tone silhouettes and 2–3 background depth layers, with an always-open race corridor.
- [ ] Small grounded roadside props with limited colour palettes: light, sign, bin/barrier, plant/rock.
- [ ] Readability/occlusion checks at native 480×270, with 164×113 player and smaller rivals.

These are **rendering patterns**, not an excuse to create one generic scenery asset for every setting.

## Street / Urban — first environment

**Work ONE item to approval before the next.** Preserve 4–7-building groups, existing gaps, road camera, world positioning and gameplay.

1. [ ] **One tyre workshop**: strong garage door, sign shape, awning/cornice, visible front/side faces and believable pavement contact. Approve both near and distant appearance before adding others.
2. [ ] **One café / corner shop**: distinctly different window and awning layout; no tiny unreadable text.
3. [ ] **One residential frontage**: pitched or stepped roof and recognisable upper windows.
4. [ ] **One industrial workshop / warehouse**: tall service shutters, vents and reinforced corners.
5. [ ] **One municipal / office frontage**: distinct silhouette but no tall object blocking the horizon.
6. [ ] **A second roof/storefront variation** made from approved pieces rather than a near duplicate.
7. [ ] **Distant skyline**: two layered, subdued building tiers framing an open road, not forming an obstacle.
8. [ ] **One streetlight**: grounded, perspective-scaled, readable without hiding the track.
9. [ ] **One tree / planter**: chunky layered foliage and contact shadow.
10. [ ] **One small utility prop**: bin or roadside sign; sparse, stable world position.
11. [ ] **One pavement detail kit**: joins, kerb colour variation and a small set of contact shadows.
12. [ ] **Street integration review**: check mixed building arrangements at 3+ race times, motion, native pixel scale and weather readability.

Target ~5–6 distinctive core building models plus a handful of reusable prop types, not 50 unique buildings.

## F1 Circuit — after Street approval

- [ ] Pit garage / paddock building module, including readable open bays.
- [ ] Single-sided continuous pit wall with marshal/flag accents.
- [ ] Tiered grandstand silhouette with very sparse crowd detail.
- [ ] Racing kerb / tyre-barrier kit with depth and contact shadows.
- [ ] Timing gantry / scoreboard and a small number of legible signs.
- [ ] Native-scale smoke/rain/clear visibility review.

## Drag Strip

- [ ] **One** starting-light tree, only at the start.
- [ ] Clean timing-board / finish-line silhouette.
- [ ] Track rubber marks and runway-like surface patches, subtle enough for vehicles.
- [ ] Distance markers and low spectator safety barriers.
- [ ] A few paddock tents / trailers far from the lane, if readable.

## Rally Course

- [ ] Two or three hillside / wooded background layers.
- [ ] One approved pine-tree shape with deterministic height/rotation variations.
- [ ] Gravel and rut surface details respecting perspective.
- [ ] Proper flexible rally banners/tape and one marshal hut.
- [ ] Roadside stones, scrub and ground-transition accents.

## Off-Road Trail

- [ ] Layered rocky terrain / escarpment silhouettes.
- [ ] Two boulder types with visible side faces and shadows.
- [ ] Mud/rut texture kit with readable driving corridor.
- [ ] Sparse dry shrubs and grass clumps.
- [ ] Occasional route marker / hazard barricade, without blocking the road.

## Per-asset approval gate

- [ ] Native in-game renderer output, **not a standalone AI image**.
- [ ] Compare baseline and candidate at identical 480×270 canvas settings.
- [ ] Show at least one close, one distant and one in-motion frame.
- [ ] Clear silhouette/identity, believable perspective anchoring, no repeated visual glitches.
- [ ] Works with player and rival cars; no lane obstruction.
- [ ] Owner verdict (Keep / Polish / Rework / Not ready) recorded.
- [ ] Only approved assets become building blocks for the next assets.

## Engineering rules

- Work on separate art branches; do not merge into `main` without owner approval.
- Keep track IDs, event probabilities, physics, deterministic race outcome, save formats, exact gag recipes and transformations unchanged.
- Do not delete unused recipes, assets or existing gameplay tracks. Five groups are reusable art families only, not a proposed five-track rotation. All 36 environment recipes and nine gameplay tracks stay available.
- Build with `python scripts/build.py`, then run `node tests/check.cjs`. Independently inspect actual renderer frames; tests alone cannot certify aesthetic quality.
