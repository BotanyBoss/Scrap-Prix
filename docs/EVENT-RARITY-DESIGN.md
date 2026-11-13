# Scrap Prix — Event rarity and spectacle tiers

**Design decision:** Introduce **EPIC** as an event rarity between Rare and Legendary.
**Status:** Approved *design direction*, not an implemented gameplay change. 2026-11-12.

## Principle

Scrap Prix is controlled chaos: fair, consistent mechanics and genuinely unpredictable situations. Events are predominantly spectacle, comedy and sometimes modest component damage. Rarity represents how unusual an **encounter** is, not its mechanical severity, damage, reward or animation budget. A harmless event can be Epic or Legendary.

| Tier | Intent | Illustrative content |
| --- | --- | --- |
| Common | Everyday colourful racing mishaps | Cow crossings, potholes, loose scrap |
| Uncommon | Interesting deviations | Runaway machinery, peculiar road hazards |
| Rare | Memorable unusual moments | Odd creatures, strange sightings |
| **EPIC** | Large, attention-grabbing set pieces; may spill from backdrop onto the race | Jet crash, kaiju battle, spectacular collisions |
| **Legendary** | Exceptionally rare spectacles, transformations or hidden resolutions | Nuclear Fallout, extraordinary plane recovery |

These are descriptive categories until exact selection weights and event inventory are explicitly reviewed. Do not infer probabilities from the table.

## Critical distinction: encounter tier vs outcome rarity

One shared encounter can have multiple deterministic, weighted branches. Its baseline **eventTier** is distinct from a specific **outcomeTier**.

**Epic example: falling jet**
- Shared beginning: jet descends in smoke, camera follows, impact apparently inevitable.
- Common ending **within the Epic encounter**: distant background crash, no effect.
- Other endings: debris near the roadway; damage to the player's car; a real rival incident, with race results reflecting what happened.
- Legendary hidden ending: engine restarts, extraordinary barrel roll, jet clears the racing surface, huge 'WHOOOOOOOO!' overlay, flies away. No damage or special reward needed.

Do not advertise every possible branch or give away its legendary ending. Hidden payoffs support discovery.

**Epic example: kaiju battle**
- Most often a large-scale background spectacle with no mechanical effect.
- Sometimes falling debris enters the track, or a combatant lands in the racing line.
- Outcome and any actual rival elimination must be decided by the deterministic engine, not the animation.

**Legendary example: nuclear fallout**
- The nuke can detonate on *any eligible lap*, even the last of a 3–7-lap race.
- Detonation produces the flash, shockwave and immediate change to the **background** layer.
- Each following lap independently rolls to advance to the next uncompleted stage: roadside, then road. A failed continuation roll does **not** cancel the chain; it rolls again on later laps.
- Reuse the existing Radioactive Fallout track's background, roadside and road as the target visual theme. Keep the transformation race-local.
- A rare vault-door scene is a possible final payoff, never required. Short or late-triggered races may never see the whole chain.

## Handshakes are trigger rules, not a sixth tier

Weather + parts + gag build + player choice + current stage can unlock a conditional encounter or outcome. Handshakes may be Rare, Epic or Legendary. These combinations should make sense in hindsight, not be mandatory objectives.

## Implementation compatibility and review gate

As of the current source:
- `src/02-catalogue.js` represents event occurrence predominantly with individual `weight` values and some `legendary` tags; it does **not** yet enforce a unified five-tier rarity enum.
- `src/03-engine.js` preselects deterministic events and already schedules multi-stage anomaly continuation rolls each subsequent lap.
- `src/12-event-director.js` owns presentation-only timing and cinematic beats; an event's visual prominence must not silently change its mechanics.
- The actual event library and legacy 'legendary' tags are **not** automatically reclassified by this design note.

A later small implementation can introduce explicit rarity metadata (`eventTier`, optional `outcomeTier`) and curated weights, without changing existing odds by accident. Before altering odds or event results, inspect the event inventory, model encounter and branch frequencies, run determinism/regression tests, and obtain gameplay review.

**Non-goals for this change:** new animations, asset generation, new damage protections, forced victory, replacement event engine, live gameplay/economy changes or unrequested deployment.
