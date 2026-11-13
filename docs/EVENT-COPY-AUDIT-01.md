# Scrap Prix — Non-Visual Polish Sprint 01: Event Copy & Feedback Audit

**Snapshot:** 2026-11-13 (source: `main` at `ff5a825`).
**Status:** Review audit, not a gameplay patch. **No code, probabilities, saves, event timings, graphics or race outcomes changed**.
**Goal:** Strengthen the existing experience before adding content. Most event descriptions are already good: preserve the voice and improve the delivery/clarity around them rather than rewriting for the sake of it.

## Confirmed source architecture
- `src/02-catalogue.js` defines event descriptions, optional outcomes, multi-stage text, risk labels and gameplay metadata.
- `src/03-engine.js` produces seeded outcomes (including distributed per-slot damage) and preselects multi-stage progression, so narration does not decide results.
- `src/04-cosmetic-surprises.js` has seeded **presentation-only** alternate headlines/dialogue, with a 12% text variation chance for supported IDs.
- `src/05-presentation.js` builds the race replay, adding damage, performance and credit messages directly to each event's `copy`.
- `src/12-event-director.js` has presentation-only event timing profiles. Camera/event animation changes are deferred to Studio Playground.

## Priority observations

1. **Strong core writing, awkward delivery:** The event's setup/punchline is concatenated with mechanically useful but dry sentences such as `Damage: 4. Race performance -3.`. In the longer term, preserve the event story as its own line and present actual outcomes in a separate, concise mechanical readout. Do not suppress player-facing mechanical information.
2. **Repetitive lap openings:** Every lap begins with `<weather>. Normal wear this lap: <number>.` even when interesting events occur later. Explore a small set of harmless, deterministic alternative lead-ins or a shorter status treatment. Do not introduce more RNG.
3. **Weather label needs a targeted test:** `src/05-presentation.js` updates the in-event `shownWeather` for `anomaly` or `chain` effects only; other event definitions also carry `weatherId` (for example `torrential-downpour` and `heatwave-event`). Confirm if the HUD displays base weather rather than the active event's weather. If reproduced, fix in the *presentation layer only*.
4. **Damage readout should not claim damage to the named target alone:** The engine distributes incident damage over the loadout. A total `Damage: N` line is accurate but less informative than an available per-slot breakdown. Use `damageBySlot` when the UI needs specific attribution.
5. **No artificial damage caps or rescue RNG:** Consecutive unlucky events are intentional. Existing choices, repairs, parts and driving approaches remain the player's risk management tools.
6. **Stage chains already have the right philosophy:** Failed follow-up rolls do **not** kill a chain; continuation may occur on later laps. Preserve incomplete stories and rare full sequences.

## First ten event reviews

| Event ID | Assessment | Editorial decision |
| --- | --- | --- |
| `cargo-spill` | Distinct setup and concrete objects; invoices make it funny | **Keep** the current copy |
| `massive-pileup` | Distinct hazard with suitable impact and tone | **Keep** |
| `long-grass` | Strong, short joke and recognisable route hazard | **Keep** |
| `flooded-section` | Very similar 'course acquired depth' joke is used by separate `flood` event | **Consider** a more distinct line |
| `crosswind-blast` | 'Atmosphere attempts...' wording recurs across related wind events | **Consider** a specific punchline rather than repeating this formula |
| `pothole-chain` | 'This is urban planning' is exactly the right dry voice | **Keep** |
| `wreckage-shortcut` | Choice and rewards read clearly; failure is vague | **Consider** tightening failure outcome text only |
| `broken-bridge-jump` | Good risk prompt; safe/success/fail outcomes all distinct | **Keep** |
| `too-fast-camera` | Animation-aware and amusing without mechanical bloat | **Keep** |
| `deja-vu` | Four-stage escalating story, strong minimalist ending | **Keep**; do not advertise its final stage |

### Targeted draft replacements for editorial approval

These are **proposals**, not applied to the live source:

- `flooded-section.text`: **“The next straight has become a canal. Race control insists it's a water feature.”** Keeps the hazard clear without duplicating `flood`.
- `crosswind-blast.text`: **“A sudden gust tries to steer the car from the passenger seat.”** Different from the other atmosphere jokes, still communicates a sideways impact.
- `wreckage-shortcut.choice.failText`: **“You find the gap. Unfortunately, the gap is smaller than the car.”** More specific and visualisable without adding a new mechanical consequence.

All three must be checked in context, especially escaping single quotes in the source code. Retain existing definitions and numbers untouched.

## Non-visual QA plan

1. Verify displayed event weather for `torrential-downpour`, `heatwave-event`, `storm-front` stage 2 and at least one regular event without `weatherId`. Assert no effect on weather selection or wear calculations.
2. Verify `event.damage === sum(Object.values(event.damageBySlot))`, including mitigated and zero-damage events, before changing any damage feedback.
3. Preview `wreckage-shortcut`, `broken-bridge-jump`, `flooded-shortcut` for safe/success/failure wording under seeded fixtures; choices should never display the wrong branch.
4. Exercise `deja-vu`, `storm-front` and `tremors` with early, late and missed continuation rolls; no guaranteed full finale.
5. Run the repository's existing syntax, determinism and smoke tests if changes to the presentation or copy are staged; unchanged gameplay results must remain identical.

## Scope boundary

Current sprint: writing, labels, explanatory feedback and deterministic QA. Event camera direction can be captured as **notes**, but no new images, camera animations, balancing, branches, outcomes, rarity odds, gadgets or legendary encounters in this sprint.

The nuclear-metamorphosis, plane pilot-cam, Epic tier and handshake concepts are documented/planned **separately** and do not become demo blockers.
