# Theatrical Race Integration Review

Branch `codex/theatrical-race-integration` was based on `feature/threejs-garage-first-pass` (`e30f48c0`). This includes UNMERGED Bodge, bounty, Encyclopaedia, anonymous dialogue and opt-in 3D garage prototypes. None is automatically approved for main or production.

The branch adds the November 13 creative roadmap and audit, a read-only Race Manifest + factual beat list, regression tests and a presentation-only event weather HUD fix.

The manifest is **not loaded into the playable game's HTML** and deliberately **does not invent intermediate standings or change the race outcome**. The 2D theatrical rendering pipeline is NOT implemented yet.

Next: verify CI, audit conflicting save/witness/choice semantics, then prove a three-chassis modular shot system in Studio Playground. Preserve original PR branches and main.

## 13 November correctness pass: archive recovery

The race engine labels ordinary rolled events `optional`, whereas the permanent Encyclopaedia previously accepted only `wildcard`. This caused normal witnessed events and shortcuts to vanish from the archive. `src/27-encyclopaedia.js` now normalises both to stable `wildcard:<id>` entries. Recovered `phase=result` saves and normal race finalisation reconcile only engine-resolved effects as missed while preserving previously seen discoveries; bounty result recording remains idempotent across reload. Regression: `tests/encyclopaedia-recovery.cjs`.

This is a documentation and bug-fix pass, not completion of rare-weather/Legendary contracts, Bodge balance review, dialogue, animated races, or live deployment.

## Run identity migration (13 Nov)

New UI runs receive a stable `archiveRunId` preserved through existing optional-field save validation; importing a save switches the Encyclopaedia to that source ID. Previous standalone saves lacking an ID get a deterministic legacy fingerprint (identical old files dedupe; genuinely different old continuations without native IDs cannot always be proven to be the same source). The permanent result ledger is no longer cleared by `startRun` and now keeps a per-source last recorded race counter, preventing repeat imports of older races. No race odds, rewards, or engine determinism changed. Tests: `tests/archive-run-identity.cjs`.

## Six witnessed-only long-shot bounties (13 Nov)

Two rare-weather, three rare-event (including a four-stage finale), and one Legendary Special Order are implemented on this isolated integration branch. Offers are locked behind *previous witnessed discovery* and new contracts settle only after the current race's actual presentation has recorded event/weather receipts. Skipping the scene cannot pay; expired contracts still apply their advertised failure penalties. All other bounty outcomes remain pre-resolved. `tests/witness-bounties.cjs` checks real seeded Blizzard and First Contact runs, save/reload, deadlines and idempotence. Offer weights and rewards remain **provisional pending balance review**.
