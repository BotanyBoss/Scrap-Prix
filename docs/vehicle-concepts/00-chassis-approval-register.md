# Scrap Prix — Chassis Design Approval Register

**Snapshot: 11 November 2026**  
**Source of truth:** Explicit owner selections in the Scrap Prix concept conversation, plus the actual in-game chassis catalogue (`src/02-catalogue.js`). Auto-generated labels or approval badges appearing inside images are NOT authoritative.

## Summary
- All **10/10** chassis have been considered; Carbon-Lite is now explored.
- **3 accepted / approved directions**: Salvaged GT, Soapbox and Needle (Needle has a multi-view consistency caveat).
- **4 selected/promising directions awaiting final visual sign-off**: Boilerplate, Longbody, Hauler, Aero Pod.
- **1 unresolved, parked**: Wobble Wagon.
- **1 promising candidate awaiting refinement / confirmation**: Armoured Tub.
- **1 new candidate awaiting first owner review**: Carbon-Lite.
- **0/10 production 3D masters** approved or integrated. Standalone procedural garage prototypes are experiments, not these final asset models.

| # | Catalogue ID | Chassis | Visual state | Next approval / production gate |
|---|---|---|---|---|
| 01 | `stock-chassis` | Salvaged GT | **APPROVED** | Archive master artwork; model the approved rounded, patched coupe shell, then modular mounts and camera QA |
| 02 | `soapbox` | Soapbox Frame | **APPROVED** | Preserve wooden seat, simple hoop and substantial bonnet; archive reference and build clean GLB |
| 03 | `needle-frame` | Needle Frame | **ACCEPTED DIRECTION** | Reconcile contradictory angle sketches in a single 3D master, retain long narrow nose |
| 04 | `boilerplate` | Boilerplate Chassis | **SELECTED DIRECTION** | Open riveted cylinder with visible interchangeable engine bay, protected cockpit; request final owner sign-off |
| 05 | `wobble-wagon` | Wobble Wagon | **PARKED — NOT APPROVED** | Resolve real LEFT/RIGHT chassis height asymmetry (not front-to-rear wedge); animate roll about longitudinal axis |
| 06 | `longbody` | Longbody Frame | **PROMISING CONCEPT** | Verify latest shortened six-wheel body and rear view; 1 front axle + 2 rear axles, 3 mounting stations per side |
| 07 | `hauler` | Hauler Frame | **SELECTED DIRECTION, REFINEMENT PENDING** | Bare four-wheel workhorse chassis, short industrial nose, protected cockpit, heavy stepped rear; prior images retained fixed wheels/lights |
| 08 | `armoured-tub` | Armoured Tub | **PROMISING CONCEPT** | Low, wide bunker-like enclosing tub, recessed cockpit; refine to avoid Hauler similarity, then owner review |
| 09 | `aero-pod` | Aero Pod Frame | **SELECTED DIRECTION, SIGN-OFF PENDING** | Rounded low wide pod, smooth panels, side intakes; lighter clean wear and gadget/fin clearance |
| 10 | `carbon-lite` | Carbon-Lite Monocoque | **FIRST CONCEPT, SIGN-OFF PENDING** | Precision-engineered angular composite monocoque; see `10-carbon-lite-monocoque.md` |

## Rules applying to every chassis
- The **core chassis** is a geometry asset distinct from engines, tyres and gadgets. Even if a concept artist depicts equipped parts, those parts are not inherently locked to the chassis.
- Approved clean masters look salvaged but are mechanically sound at 100% durability. Rust, cracks and serious failures come from per-part condition textures/geometry.
- Every final clean master requires matching front, side, elevated rear three-quarter, top and true rear views produced from **one coherent 3D model**.
- Design primarily for the new **slightly elevated, centred rear chase camera** without sacrificing front/garage silhouette.
- Preserve existing chassis stats, recipes, economy and game systems.
- Avoid false precision from generated concept sheets. Any generated dimensions, mechanical specs or approval labels not sourced from the game/reviewer are only visual placeholders.
- Production gates: visual sign-off → engineering/mounting conventions → clean GLB → damage + modular testing → garage + race-view QA → game integration.

## Recommended approval order
1. Ask owner to review **Carbon-Lite** candidate and decide whether it needs a chassis-only refinement.
2. Finalise **Boilerplate** open-cylinder core and **Longbody** tandem-rear geometry.
3. Obtain approval for **Aero Pod** and **Armoured Tub** after shape/attachment cleanup.
4. Complete **Hauler** bare chassis; retry **Wobble Wagon** using explicit front/rear structural elevation drawings to force true left/right asymmetry.
5. Archive image masters and begin quality-controlled 3D construction in groups rather than generating more decorative equipment-heavy concept sheets.

## Artefact limitations
Visual concept images were shared through the conversation, but **not all image masters are present in the GitHub repository**. Before modelling handoff, add approved original concept PNGs to an asset folder and associate the exact approval record. Do not claim visual or file approval from this text register alone.
