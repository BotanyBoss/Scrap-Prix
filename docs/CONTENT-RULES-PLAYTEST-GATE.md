# Scrap Prix — Content & Rules Gate for the Next Full Playtest

Updated 8 November 2026. This work is on `feature/content-event-bounty-audit` (stacked on `feature/bounty-board-prototype`, which is stacked on Emergency Bodge). **None of it should be merged until reviewed.** The separate Three.js Street lab is not part of this branch.

## Content inventory

| Type | Count | Scope of audit |
| --- | ---: | --- |
| Ordinary race events / wildcards | 48 | Positive selection weights, event definitions, observed generation, full engine resolution and textual replay |
| Rare anomalies | 37 | Valid terrain/track constraints, observed generation, staged chain metadata, engine resolution and textual replay |
| Special passing events | 26 | Valid references and replay-timeline dispatch |
| Fake passing events | 7 | Valid references and replay-timeline dispatch |
| Gag vehicles | 17 | Four valid purchasable catalogue parts; exact recipe; legal shop assembly; successful race; discovery; bounty voucher |
| Playable track definitions | 9 | Valid signatures and generated rotation |
| Bounty types | 32 | 15 ordinary challenges and a classified contract for every gag vehicle |

These tests do not demonstrate that every bespoke event animation is finished, or that all 36 aspirational environment ideas are shipped. Those are separate art/presentation scope.

## Bounty pool: 15 ordinary challenges

1. The Perfect Third — exactly third.
2. Second Best — exactly second, not first.
3. Honourable Loser — exactly fourth.
4. The Wooden Spoon — exactly fifth without a retirement or no-start.
5. Déjà Vu — match the preceding finish.
6. From Hero to Zero — place at least two positions worse than the preceding race.
7. Against the Odds — finish in the top two using Reckless.
8. Middle Gear — finish top three using Balanced.
9. Slow and Steady — finish top two using Careful.
10. Barely a Scratch — finish losing at most 15 condition total.
11. Keep It Together — complete two consecutive races, each losing no more than 24 condition, in a three-race window.
12. Running on Fumes — finish starting at least one critical component at 25% or less.
13. The Comeback Kid — improve two places over the preceding finish.
14. Bad Shortcut, Good Story — successfully take a risky event route and finish top three.
15. Fresh From the Junkyard — finish top two having replaced a part at that race's garage.

Each has an explicit success reward, failure penalty and one-to-three-race deadline, and unit fixtures demonstrate both success and failure.

### Classified gag requests

All 17 approved four-part recipes have a corresponding optional "complete a race using this gag" bounty. The historical Tank contract keeps its original ID and five-race deadline to protect existing saves; the other sixteen have eight-race deadlines. The vehicle requirement is unreadable until that exact gag has been discovered. **Success:** one free replacement voucher, with a cap of three; an excess voucher is paid as one wrench. **Failure / expiry / cancellation:** advertised repair lockout (Tank three garage visits; the other sixteen two).

One new offer appears in the shop per race; the player can hold three active contracts; accepting a new contract is voluntary; cancellation counts as immediate failure; pending penalties survive saving/reloading. The offer isn't rerolled by refreshing shop stock.

## Mechanical corrections

- F1 Car: the 10% smooth-surface tyre-wear perk now operates on smooth terrain with fractional savings carried across race laps.
- Monster Truck: the obstacle-momentum perk now mitigates negative obstacle-event scores.
- Retro Space Car: the rocket grip penalty refund is derived from the named perk and installed rocket components instead of a hard-coded +1.
- Saves: bounty deadline validation uses the actual contract length, so the newly introduced eight-race gag offers can be accepted, saved and loaded.
- Keep It Together: made condition loss part of the requirement to avoid an almost automatic wrench reward for merely finishing.

## Automated evidence

- `tests/event-content-audit.cjs`: 150,000 generated race cards, all 85 regular/anomaly IDs observed and independently exercised through race results and presentation timelines; seven multi-stage anomalies observed.
- `tests/pass-event-audit.cjs`: all 26 special and seven fake passing effects schedule correctly in replay data.
- `tests/gag-buildability.cjs`: all 17 exact recipes assembled by normal shop purchases (one build action per garage), then completed races, registered discoveries and paid their bounty. Tests use artificially generous resources **only** to isolate item availability. They **do not** establish normal-run affordability or probability.
- `tests/gag-perks.cjs`: audits 21 named perk fields for engine references; compares outcomes with key bonus values disabled to prove F1, Monster Truck and Retro Space Car are mechanically active.
- `tests/bounty-goals.cjs`: 450 varied cases for each of the 15 ordinary bounties, with observed successful and failed outcomes.
- Existing `tests/bounty.cjs`, `tests/bounty-balance.cjs`, `tests/bounty-result-browser.cjs`, `tests/bodge.cjs`, `tests/determinism.cjs` and `tests/smoke.cjs` guard the previous rules, economy, UI and save compatibility.

Run `python scripts/build.py`, then `node tests/check.cjs` and the tests above, or inspect the GitHub Actions Build and check workflow.

## Next AI full-playtest instructions

Play on **`feature/content-event-bounty-audit`**. Do not use main or the standalone 3D branch for bounty gameplay. Preserve local edits in an isolated worktree. Do not merge or change balance during assessment.

1. Run full games across at least 20 matched seeds with no bounties, selective acceptance, reckless acceptance and adaptation policies. Include Emergency Bodge on/off where possible and report complete-run score, attempted races, race-40–70 conditions, wrenches and credits, failed starts, and bounty choices.
2. Evaluate bounties under realistic shop resources and normal race history. No injected credits/wrenches to claim a recipe is *economically likely*. Report whether eight-race mystery contracts are almost always impossible, and how often the player already holds two or three of the four required parts.
3. Stress a player with three simultaneous contracts and different deadlines, including success/expiry together, cancellation, shop refresh, repair locks, save/reload, voucher redemption at the cap, and an additional event retained through a no-start.
4. Check all four approaches (especially Careful vs Reckless), shop replacements and repair strategies. Confirm the stricter survival-bounty objective improves wrench-income balance without becoming irrelevant.
5. Replay unusual events, multi-stage anomalies, risky choices, signature hazards and real/fake passes in a browser. Report confusing UI, missing event text, incorrect outcome explanations, or effects that do not correspond to engine records.
6. Reproduce crashes and exploits with seed, race number, before/after state, exact decision sequence and expected vs actual outcome. Separate **correctness defects** from **balance opinions** and **unfinished art**.

**Release gates:** playable content and rules verified, save corruption absent, economically meaningful decision-making across normal runs, and good player-facing explanation. The final 3D asset/animation pass is a separate track.
