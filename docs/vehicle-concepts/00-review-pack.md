# Scrap Prix — Chassis Concept Approval Pack

**11 November 2026 · Review branch · Not a production asset release**

## What was consolidated
The strongest currently selected visual reference for **each of the ten real chassis** was identified in the original conversation. Two comparison boards were created for direct inline display in chat (01–05 and 06–10). The full-resolution image masters still need to be archived into the repository; review images are not automatically production-ready meshes.

## A — Previously settled, preserve design

- **01 Salvaged GT: approved.** Rounded, patched classic GT coupe; clean, wheel-free master; modest cosmetic wear. Do not reopen stylistic exploration.
- **02 Soapbox Frame: approved.** Open cockpit, wooden seat, hoop, patchwork wood and metal, comparatively substantial bonnet deliberately retained. Do not redesign bonnet because engine equipment varies.
- **03 Needle Frame: direction accepted, not engineering approved.** Long narrow nose and tubular single-seater. AI views contradict one another: the final 3D model must become the geometric authority.

## B — Visual directions approved by owner on 11 November 2026

1. **04 Boilerplate.** Owner-selected industrial hot rod with **open riveted cylinder ribs**, exposing the installed engine. Keep the heavier protected cockpit; cylinder is a structural cage, **not** a permanently fitted steam boiler. Reject older enclosed-cylinder variant. **VISUAL DIRECTION APPROVED by owner (11 November 2026)**; engine clearance and removable chimney/exhaust remain engineering tasks.
2. **06 Longbody.** Latest **shortened six-wheel** workhorse-like racer: **one front axle + two rear axles**, with the tandem rear wheels visible from the elevated rear camera. No fixed cargo or top clutter; not a normal four-wheeled GT and not an oversized hauler. **VISUAL DIRECTION APPROVED by owner (11 November 2026)**; verify 3 openings per side and rear view during engineering.
3. **09 Aero Pod.** Low, wide, broad-shouldered aerodynamic pod with curved salvage panels, recessed cockpit and side intakes. Differentiate from Carbon-Lite F1: less exposed racing suspension, more sculpted pod bodywork. **VISUAL DIRECTION APPROVED by owner (11 November 2026)**; fin/gadget clearance and lighter baseline wear remain 3D engineering tasks.
4. **10 Carbon-Lite.** **Latest F1-style design** with narrow central monocoque, open-wheel stations, shaped sidepods, low nose and race-car cockpit, not earlier smooth open pod. The F1 silhouette is the accepted direction; front/rear wing components must be cleanly separable from optional equipment. **VISUAL DIRECTION APPROVED by owner (11 November 2026)**; the clean monocoque master and optional aero equipment separation remain engineering tasks.

**All four received explicit owner visual approval on 11 November 2026.** Preserve the selected designs. This approval is **visual only**, and none is a finished production asset.

## C — Targeted fix queue, no broad redesigns

- **07 Hauler:** Existing image conveys strong frame, but last attempts did not achieve the requested clean base. Keep compact, exaggerated industrial nose; protect occupant with substantial side panels; give rear an intentionally *stepped, multi-layer* structure; remove roof lights, tanks, toolboxes, permanent exhaust and fitted tyres from chassis-only master. Check from rear at new camera angle. **Needs one successful chassis-only reference/3D structural pass.**
- **08 Armoured Tub:** Make the chassis a single low, broad armoured trough, its sidewalls wrapping around a deep cockpit. No upright truck A-pillar, open ladder frame, cylindrical nose or high cage; ensure identifiable solid rear mass. **Needs one distinct bare-shell form pass.**
- **05 Wobble Wagon:** Deliberately parked; older images all show an exaggerated *front-to-back rising roofline* instead of the intended *left-to-right chassis-side height offset*. First build a measurable front/rear geometry test with **one body side much closer to its wheel mounts than the other**, while wheel positions remain level. Then rock chassis gently about the longitudinal axis. Do not generate another multi-angle glamour sheet until the structural asymmetry can be seen from front/rear.

## Before any 3D chassis production handoff

1. Attach the exact approved master concept PNG and owner approval decision, not an AI-generated "approved" badge.
2. Mark the **four modular responsibilities** separately: chassis body, engine envelope, tyre mounts, gadget hardpoints.
3. Produce one coherent clean 3D mesh with the correct wheel geometry (Longbody = six wheels, all others as specified).
4. Validate the rear-elevated race camera silhouette at actual gameplay scale, including odd part combinations.
5. Export master `.glb` clean of demo wear, and check the per-part durability texture/material overlay can be reapplied independently.
6. Preserve game rules, part stats and inventory/save data; this is a visual asset pipeline.

## Candidate image identification

See [Master Approval Register](./00-chassis-approval-register.md) for the ten exact ChatGPT-generated source filenames. These are **not yet links in the GitHub repo**.

## Current decision

**Four new visual approvals were explicitly granted by the owner on 11 November 2026:** Boilerplate 04, Longbody 06, Aero Pod 09 and Carbon-Lite 10. They join the previously approved Salvaged GT 01 and Soapbox 02. Needle 03 remains direction-accepted; the remaining C-group designs are still unresolved. **Engineering, modular compatibility, production 3D modelling, game integration and clean GLB export are all pending.** No production assets or gameplay were changed.
