# Scrap Prix | Natural-run economy and bounty stress review

**Date:** 13 November 2026  
**Branch:** `codex/theatrical-race-integration` (unmerged review only)  
**Verified full-run CI:** [Build and check #43481402288](https://github.com/BotanyBoss/Scrap-Prix/actions/runs/43481402288)  
**Engine snapshot for numbers:** `3e3447f`  
**Simulator:** [scripts/economy-playthrough.cjs](../scripts/economy-playthrough.cjs)

## Executive findings

- All 24 fresh-seed cautious no-bounty runs reached race **65**, but all 24 eventually struck out before race **120**. The average race counts were **84.3** without Bodge and **89.3** with Bodge.
- Emergency Bodge improved average cautious survival by **5.0 races** without making runs infinite; Bodge was used 71 times across 24 runs, close to the 72-use cap across that cohort.
- Selective bounties increased average cautious survival to **92.2**; accepting every offer reduced it to **85.9** and incurred **664 locked-garage visits**.
- The aggressive swapper bundles more frequent buying, Reckless when healthy, and fewer repairs. It lasted around **75.1 races**, but this experiment **does not isolate whether swapping alone helps or harms**.
- At strikeout the cautious groups averaged **£174–£214** remaining while averaging essentially **zero wrenches**. Wear, repair-resource exhaustion, and lack of an appropriate affordable critical replacement are the plausible bottlenecks, rather than the cash balance alone.
- Witnessed-only long shots are genuinely rare and highly punishing. Mature-archive players received **72** such offers in **2138** races, accepted **67**, and succeeded **2** times. Most losses require facing the regular advertised penalty.

## Method

- **24 matched deterministic seeds** `101` through `182238`, spaced by 7919, across **7** policies: **168 runs** and **14,185 simulated races** in total.
- Start from `E.newRun(seed)` with real starting parts, £130, no extra wrenches, real engine score and event RNG. Maximum **120 races** per playthrough; no invented future event outcomes, artificial gear, money or wear caps.
- Shop choices are determined from available offers, visible course/weather, relative part effectiveness, wear and real purchase prices. Repairs use actual available wrenches; Emergency Bodge is used only where the engine considers it eligible. Choices go through `E.race`.
- A reproducible viewing policy watches the full race **68%** of the time, watches only its opening lap **20%**, and skips immediately **12%**. It creates receipt tokens only for actually resolved and modelled watched effects, then calls the real `E.finalizeWitnessBounties`. This is a *model of player attention*, not a filmed UI playthrough.
- Standard groups begin with a **new empty discovery archive for each run**, so long-shot eligibility is conservatively low versus a real returning player. The seventh `veteran-archive-every-offer` group starts with all prior Encyclopaedia prerequisites known, but still a regular starter car and the exact same normal game RNG. This is a deliberate **eligibility upper-bound sensitivity test**, not a normal first run.
- "Selective" contracts use a fixed imperfect willingness-to-risk policy. "Accept every" always takes the shop's offer if a slot is free. No claim that either is optimal human decision-making.
- The simulator's initial 65-race bounty totals mistakenly read the pre-post-playback result. The corrected, **post-settlement 120-race totals below supersede those early bounty totals**. The simulator now asserts that deferred settlement is accounted for.

## Policy comparison

| Behaviour | Mean races survived | Median | Reached race 100 | Bodges | Accepted bounties | Won / failed bounties | Repair-locked visits |
|---|---:|---:|---:|---:|---:|---:|---:|
| Cautious, no Bodge, no bounties | 84.3 | 85 | 3/24 | 0 | 0 | 0/0 | 0 |
| Cautious, Bodge, no bounties | 89.3 | 89 | 2/24 | 71 | 0 | 0/0 | 0 |
| Cautious, selective contracts | 92.2 | 92 | 4/24 | 71 | 500 | 156/344 | 37 |
| Cautious, accept every contract | 85.9 | 88 | 1/24 | 72 | 1912 | 263/1617 | 664 |
| Aggressive swapper, selective | 75.1 | 77 | 0/24 | 72 | 399 | 136/263 | 45 |
| Aggressive swapper, accept all | 75.1 | 77 | 0/24 | 72 | 1671 | 254/1385 | 561 |
| Veteran archive, accept all | 89.1 | 90 | 3/24 | 72 | 1937 | 278/1630 | 674 |

**Interpretation:** Every cohort had 24/24 strikeouts by race 120. The cautious selective group won **31.2%** of settled contracts. The cautious take-everything group won **14.0%**. Some accepted contracts remained active when a run ended and therefore appear in neither settled outcome count.

### Where the economy pinches

| Cautious condition | No Bodge / no board | Bodge / no board | Selective bounties | Accept every offer |
|---|---:|---:|---:|---:|
| Mean completed race count (all started, incl. DNS/DNF) | 84.3 | 89.3 | 92.2 | 85.9 |
| DNS | 72 | 72 | 72 | 72 |
| Mid-race DNF | 25 | 32 | 42 | 43 |
| Part replacements | 1110 | 1141 | 1148 | 1088 |
| Repairs | 643 | 672 | 737 | 702 |
| Mean final cash | £174 | £214 | £212 | £195 |
| Mean final wrenches | 0 | 0 | 0 | 0 |

The standard model's pragmatic spending gives the intended part-swapping loop plenty of use: roughly **one replacement every two races** in the cautious cohorts. However its shopping/racing decisions are not a proof of optimal strategy.

## Witnessed-only bounty feasibility

The mature-archive sensitivity scenario offered the following six contracts. "Failed" means an actual settled failure, not simply an accepted offer whose deadline was still running when the car struck out.

| Mature archive contract | Offered | Accepted | Success | Failure |
|---|---:|---:|---:|---:|
| Whiteout Broadcasting | 13 | 11 | 0 | 10 |
| Winter Coverage | 19 | 18 | 2 | 16 |
| First Contact, Second Time | 14 | 13 | 0 | 13 |
| Front Row to Disaster | 16 | 16 | 0 | 15 |
| The Lights Came Back | 4 | 3 | 0 | 3 |
| Legendary Special Order | 6 | 6 | 0 | 5 |

The only mature-archive long-shot successes were **Winter Coverage (2)**. Repeating a rare specific Legendary or a four-stage finale within a short deadline is extraordinarily unlikely. It can be a deliberate hidden gamble, but such a contract should not be represented as a normal, approachable earning opportunity. Not even 168 simulated sessions prove exact probability for genuinely rare events.

### Decisions proposed, not implemented

1. **Do not apply broad damage caps or economy buffs based on simulated players.** The existing escalating attrition works as an endless high-score system; use human play sessions to establish whether the curve feels enjoyable.
2. **Keep Bodge's present three-use cooldown/debt for now.** It is a last resort that adds a limited survival margin, not a free reset.
3. **Separate the most extreme Legendary Special Orders visually from ordinary short-term contracts, or explicitly label their odds as deliberately absurd.** Review whether their 8-race repeat-event deadlines and repair-lock penalties match the intended comedy/risk. Do not secretly increase event rates.
4. **Do a controlled swapping-only experiment** with the *same* repair and driving behaviour. The current "aggressive swapper" also uses Reckless and fewer repairs, so the lower lifespan cannot be attributed solely to replacing parts.
5. **Human test the first 10 races, one troubled mid-run around race 40, and recovery late around 70–95**, including skipped choices and bounty acceptance UX.

## Regression and reproduction

```bash
node scripts/economy-playthrough.cjs --quick
node scripts/economy-playthrough.cjs
```

`--quick` runs a small CI safety sample; no argument runs the full 24-seed × seven-cohort × 120-race study. Both use deterministic policy choices and verify game-state non-mutation, legal purchases/repairs, save round trips, exact-once witnessed settlement, and non-negative resources.

**Scope warning:** This does not validate audio, actual animations, difficult route choices made through the browser, player comprehension, realistic human adaptation, or future Steam release economics. No source gameplay constants, event frequencies, or balances were changed for this report.
