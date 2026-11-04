# Current project status

Snapshot: 2026-11-04. Imported from the latest Street working build, not from an older review snapshot. The inherited UI still contains older v0.7.23p/n labels; they are not a new upstream version claim.

## Active work

Street environment layout and personality. Current rows contain 4–7 houses between gaps, with varying 4–7-world-unit gaps. Both sides are staggered, and lots retain their world position as the camera moves. Buildings leave through canvas clipping. Each house has a 3.8-world-unit frontage.

A first shared colour/shading pass is present: shaded building faces and foundations, two-tone trees, lighter distance layers, shaded mountains/mesas and a subtle ground-colour transition. Six environments were visually sampled in that pass; this does not mean all 36 are finalised.

Next changes should follow the owner's review of Street before progressing environment by environment and subsequently through weather.

## Preserve

- Completed Truck proportions and native artwork.
- Current Mechanical Fossil illustrated sprites and race-display fixes; later art/animation work belongs to the owner.
- Exact four-part recipes and normal modular behaviour.
- Gameplay, race outcomes, economy, saves and event probabilities during visual-only tasks.
- Special gag transformation events, which are deferred.

## QA and limitations

At import, the reconstructed DEV file matched the latest source byte for byte. The repository checks pass. Historical visual checks and notes are summarised here; old review exports and scores were deliberately not imported as current findings.

The browser's iframe comparison galleries previously reported a MutationObserver diagnostic of unconfirmed origin while rendering successfully. The standalone environment preview was checked without observed console errors. No claim of a full campaign regression or final art approval is made.

Browser saves and review ratings live in local storage and are not included in this repository. Start previews to inspect art without assembling a recipe through a campaign run.
