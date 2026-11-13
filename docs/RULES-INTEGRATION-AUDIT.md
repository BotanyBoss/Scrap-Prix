# Scrap Prix | Rules Integration Audit (13 November 2026)

**Branch:** `codex/theatrical-race-integration`, derived from the *unmerged* feature stack. No production merge, new balance tuning or animation work.

## Verified correctness

- **Event archive ID mismatch fixed:** Engine sends ordinary event kind `optional`, but the persistent Encyclopaedia used to accept only `wildcard`. Both are now represented as one canonical `wildcard:<id>` entry; choice shortcuts go in the Shortcuts tab.
- **Interrupted replay recovery fixed:** Engine has already resolved a race and saved its result before visual playback. On a refresh during the cartoon, the recovered result now reconciles *only effects actually resolved*, not future scheduled events. Events already witnessed stay discovered, while rolled-but-unseen effects remain hidden as missed.
- **Bounty result deduplication:** `recordResult` uses the persisted archive session identifier and race number to avoid counting completed bounty records twice on a result revisit/reload.
- **Bodge + bounty + choice recomputation:** Dedicated regression seeds across real naturally rolled choice events verify that safe-default and explicit-safe paths agree, resolving risk twice from the same committed garage state is identical, neither branch mutates the starting state, repayments and reward accounting happen exactly once, and save round-trips preserve Bodge debt and bounty settlement.
- **Existing balance tools:** Original Bodge stress tests and the larger bounty suite remain in CI. Synthetic tests are not a substitute for human-like natural-run balance.

## Genuine remaining questions / risks

1. **Bounty balance is not signed off.** Emergency Bodge (three uses, cooldown, debt), 47 contracts and their penalties are review features; assess realistic acceptance rates, offer frequencies, repairs, credit/wrench scarcity and race 40–100+ play before merging.
2. **Witnessed-only contracts are now implemented on the isolated review branch.** Six gated long shots settle after playback from validated current-race receipts; skip/expiry cannot produce a hidden win. These need human-style rarity and economy validation before release.
3. **Run import identity collision addressed.** New saves persist a source run ID and permanent result high-water ledger; identical legacy exports get stable fingerprint IDs. Two independently progressed pre-ID legacy saves cannot always be proven to share an origin, a documented migration limitation.
4. **Multi-stage discoveries now record the highest genuinely witnessed stage** separately from generic anomaly/chain entries. Hidden contracts can require a specific finale without leaking its existence. Further Encyclopaedia display polish is optional.
5. **The active replay is not restored on mid-race reload.** The engine result is recoverable and unseen entries are now reconciled, but the cinematic resumes at the results screen, not at the exact frame or unresolved choice. Full shot-timeline persistence belongs to the upcoming Race Director contract.
6. **The optional Bodge/contract balance choices remain user review gates.** Do not introduce automatic damage protection or rewrite event odds to improve test outcomes.

## Next work

- Continue validating imported-save identity, stage disclosure, and witnessed-only contract playthroughs against unusual crash/skip/choice sequences.
- Run matched natural-run, human-like Bodge/bounty economy playtests and report practical success/expiry/repair-lock consequences.
- Keep the 3D-to-2D rendering prototype isolated until these rules are reliable.
