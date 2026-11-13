# Theatrical Race Integration Review

Branch `codex/theatrical-race-integration` was based on `feature/threejs-garage-first-pass` (`e30f48c0`). This includes UNMERGED Bodge, bounty, Encyclopaedia, anonymous dialogue and opt-in 3D garage prototypes. None is automatically approved for main or production.

The branch adds the November 13 creative roadmap and audit, a read-only Race Manifest + factual beat list, regression tests and a presentation-only event weather HUD fix.

The manifest is **not loaded into the playable game's HTML** and deliberately **does not invent intermediate standings or change the race outcome**. The 2D theatrical rendering pipeline is NOT implemented yet.

Next: verify CI, audit conflicting save/witness/choice semantics, then prove a three-chassis modular shot system in Studio Playground. Preserve original PR branches and main.
