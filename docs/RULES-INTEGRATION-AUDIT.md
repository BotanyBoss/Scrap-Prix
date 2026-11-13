# Scrap Prix | Rules Integration Audit (13 November 2026)

**Branch:** `codex/theatrical-race-integration`, derived from the *unmerged* feature stack. No production merge, new balance tuning or animation work.

## Verified correctness

- **Event archive ID mismatch fixed:** Engine sends ordinary event kind `optional`, but the persistent Encyclopaedia used to accept only `wildcard`. Both are now represented as one canonical `wildcard:<id>` entry; choice shortcuts go in the Shortcuts tab.
- **Interrupted replay recovery fixed:** Engine has already resolved a race and saved its result before visual playback. On a refresh during the cartoon, the recovered result now reconciles *only effects actually resolved*, not future scheduled events. Events already witnessed stay discovered, while rolled-but-unseen effects remain hidden as missed.
- **Bounty result deduplication:** `recordResult` uses the persisted archive session identifier and race number to avoid counting completed bounty records twice on a result revisit/reload.
- **Bodge + bounty + choice recomputation:** Dedicated regression seeds across real naturally rolled choice events verify that safe-default and explicit-safe paths agree, resolving risk twice from the same committed garage state is identical, neither branch mutates the starting state, repayments and reward accounting happen exactly once, and save round-trips preserve Bodge debt and bounty settlement.
- **Existing balance tools:** Original Bodge stress tests and the larger bounty suite remain in CI. Synthetic tests are not a substitute for human-like natural-run balance.

## Genuine remaining questions / risks

1. **Bounty balance is not signed off.** Emergency Bodge (three uses, cooldown, debt), 41 contracts and their penalties are review features; assess realistic acceptance rates, repairs, credit/wrench scarcity and race 40–100+ play before merging.
2. **Witnessed-only bounties aren't built yet.** They will need an explicit event-witness settlement transaction *after* playback, not the existing `E.race` pre-resolution. Archive now records seen vs missed; no secret rewards should be handed out on an unseen event.
3. **Importing a different completed run into an already-used Encyclopaedia session may collide on the same race index.** `recordResult` currently deduplicates by session ID and race number, but the save import path does not establish a new archive run identity. An imported result with the same race number could have its permanent bounty/track record suppressed. Define an import identity/deduplication policy and test repeated imports before changing the archive format. Do not simply reset the archive, because that would discard discoveries.
4. **Legacy multi-stage discoveries:** The archive currently treats `anomaly:<id>` and `chain:<id>` as different keys even when both are stages of one sequence; decide how much of a completed chain should appear without spoiling final stages.
5. **The active replay is not restored on mid-race reload.** The engine result is recoverable and unseen entries are now reconciled, but the cinematic resumes at the results screen, not at the exact frame or unresolved choice. Full shot-timeline persistence belongs to the upcoming Race Director contract.
6. **The optional Bodge/contract balance choices remain user review gates.** Do not introduce automatic damage protection or rewrite event odds to improve test outcomes.

## Next work

- Audit imported-save archive identity and stage disclosure policy.
- Add seeded save/skip/reload tests for witness-dependent future contract eligibility before implementing long-shots.
- Run matched natural-run, human-like Bodge/bounty economy playtests and report practical success/expiry/repair-lock consequences.
- Keep the 3D-to-2D rendering prototype isolated until these rules are reliable.
