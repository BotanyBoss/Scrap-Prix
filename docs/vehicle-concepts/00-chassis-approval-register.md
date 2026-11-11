# Scrap Prix — Chassis Approval Register

Snapshot: **11 November 2026**. Derived from the actual ten-item chassis catalogue and explicit user concept reviews. Approval labels rendered *inside generated images* are not authoritative.

**Progress (11 November 2026):** 10/10 explored; **6 visually approved** (Salvaged GT, Soapbox, Boilerplate, Longbody, Aero Pod, Carbon-Lite); 1 direction accepted but not visually final (Needle); 2 need structural refinement (Hauler, Armoured Tub); 1 parked (Wobble Wagon). **No production chassis GLBs approved or integrated.**

| # | Catalogue ID | Name | Visual decision | Next gate |
|---|---|---|---|---|
| 01 | `stock-chassis` | Salvaged GT | **Approved** | Clean master, modular mounts, rear camera |
| 02 | `soapbox` | Soapbox Frame | **Approved** | Preserve substantial bonnet/wooden seat; clean master |
| 03 | `needle-frame` | Needle Frame | **Direction accepted** | Reconcile inconsistent concept angles in one mesh |
| 04 | `boilerplate` | Boilerplate Chassis | **Visual direction APPROVED 2026-11-11** | Open cylindrical structural ribs around interchangeable engine; engineering, modular fitting and 3D master pending |
| 05 | `wobble-wagon` | Wobble Wagon | **Parked** | Demonstrate real *left/right* height asymmetry; roll about longitudinal axis |
| 06 | `longbody` | Longbody Frame | **Visual direction APPROVED 2026-11-11** | Keep shortened six-wheel silhouette: two front, four rear; engineering, modular fitting and 3D master pending |
| 07 | `hauler` | Hauler Frame | **Structural study done; visual approval PENDING** | Wheel-free 3D test of short nose, protected cockpit and three-step rear completed; polish concept and obtain sign-off |
| 08 | `armoured-tub` | Armoured Tub | **Structural study done; visual approval PENDING** | Continuous low armoured shell, empty wheel cutouts and rear recess tested; polish concept and obtain sign-off |
| 09 | `aero-pod` | Aero Pod Frame | **Visual direction APPROVED 2026-11-11** | Smooth low/wide aero body, optional fin/gadget clearances; engineering, modular fitting and 3D master pending |
| 10 | `carbon-lite` | Carbon-Lite Monocoque | **Visual direction APPROVED 2026-11-11** | Latest F1-style open-wheel concept, not earlier Aero Pod-like model; engineering, modular fitting and 3D master pending |

## Explicit visual approvals (11 November 2026)

The owner explicitly approved **Boilerplate Chassis 04**, **Longbody Frame 06**, **Aero Pod Frame 09**, and **Carbon-Lite Monocoque 10** in this conversation. These decisions approve the **existing selected concept-art visual directions only**. They do **not** approve engineered dimensions, wheel/engine/gadget attachment standards, final equipment-free `.glb` masters, durability implementation, race-camera QA or game integration. The two previously approved designs (Salvaged GT 01 and Soapbox 02) remain approved. Needle 03 is still direction-accepted rather than finally approved. Unresolved chassis 05, 07 and 08 retain their previous states.

## Actual source images

The owner-selected source images are in the **ChatGPT concept conversation** and need to be archived into the repo with full-resolution masters before production handoff. These local-source labels identify the selected images (not repo URLs):

| # | Selected conversation source |
|---|---|
| 01 | `a_polished_high_detail_3d_concept_sheet_turnaro.png` |
| 02 | `scrap_prix_soapbox_frame_concept_sheet.png` |
| 03 | `scrap_prix_needle_frame_chassis_sheet.png` |
| 04 | `a_highly_detailed_polished_game_concept_vehicle.png` (open cylinder) |
| 05 | `a_highly_detailed_concept_sheet_vehicle_design_b.png` (closest wedge; structurally wrong) |
| 06 | `a_polished_high_detail_concept_sheet_in_the_same.png` (shortened 6-wheel) |
| 07 | `a_highly_detailed_polished_concept_art_design_s.png` (base refinement; not clean master) |
| 08 | `a_highly_detailed_cinematic_vehicle_concept_shee.png` |
| 09 | `a_highly_detailed_professional_concept_art_desig.png` |
| 10 | `carbon_lite_monocoque_10_10.png` (F1 silhouette) |

## Approval policy
- "Selected" or "looks good" is not a blanket authority to mark **final visual approval**.
- Original full-resolution image needs to accompany final approved visual record.
- Chassis-only master must not permanently include wheels, engine, exhaust, gadgets or other replaceable equipment. Optional display components on concept sheets do not override this.
- Per-part damage comes from dynamic condition effects, not a fully broken clean texture at 100%.
- Use the **slightly elevated, centered rear chase camera** for readability checks, alongside front, side, true rear, garage 3/4.
- Keep original game stats, recipes, save contracts and economy unchanged through concept review.

See [Approval Review Pack](./00-review-pack.md) for the concrete remaining decisions, and individual chassis briefs for engineering constraints.
