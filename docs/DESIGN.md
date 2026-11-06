# Game design overview

Derived from the code (`src/02-catalogue.js`, `src/03-engine.js`) as of 2026-11-06. If the code and this document disagree, the code wins; please update this file.

## Pitch

A racing roguelike. Build a wacky car from four parts, race through procedurally themed courses, and survive cartoon-level events. Certain exact four-part combinations transform the car into a hidden gag vehicle.

## Run loop

1. **Garage** (`phase: garage`): buy or swap parts, tune, repair, pick a driving approach, then race.
2. **Race**: the deterministic engine resolves the race from the seed, car, course, surface, weather and events. Events may offer choices.
3. **Result**: prize credits, points and possible wrenches are awarded; the run continues to the next garage.
4. A run ends when the car fails to start three times (`noStartStrikes`). Post-cap stress and rival pressure rise per race, so runs get harder rather than ending at a fixed race count.

Starting state: 130 credits, 0 wrenches, all parts at 100% durability.

## Car

- Four slots: `engine`, `tyres`, `chassis`, `gadget`. The first three are critical.
- Stats: Power, Grip, Armour, Cooling. Parts are levelled 1–10 (+5% per level), capped by a Market Level that rises with race number (`marketCadence: 4`).
- Durability: efficiency drops as condition falls; a part at 0% supplies no stats or perks (a 0% gadget stays fitted, and so does a gag recipe).
- Driving approach: Careful, Balanced or Reckless trade Power/Grip against wear.
- 40 parts in the catalogue; the shop offers 3 at a time with one refresh per stop.

## Races

- 9 tracks, 9 surfaces, 8 weather types, 9 signatures, 48 wildcards and 4 rivals combine to decide what a car "wants".
- Finishing position multiplies the prize (`2, 1.5, 1.25, 1, 0.75`).
- Wrench drop chance starts at 80% and decays to a 20% floor.

## Events

- 26 pass events (9% base chance) and 7 fake pass events (2.5%).
- Anomalies and events are presented through the effect modules `11`–`19` and director `12`. Presentation must stay separate from outcomes, which the engine decides.

## Gag vehicles

- 17 exact four-part recipes (`src/08-gag-recipes.js`), with near-match handling (tested in `tests/check.cjs`).
- Gag affinity grows by 0.1% per race up to 5%. Discovered gags and the current streak are saved.
- Transformation animations and gag vehicle art are owned by the project owner and deferred.

## Determinism and saves

- The same seed and choices must produce the same run. `tests/determinism.cjs` enforces this with stored snapshots.
- Saves are validated in `validateSave` (400 KB limit). Save format changes should bump `TUNING.version`.
- Browser saves and review ratings live in local storage.

## Tests

| Command | Covers |
| --- | --- |
| `node tests/check.cjs` | Script syntax, gag recipes, projections, Street layout |
| `node tests/determinism.cjs` | Seeded engine runs match across instances and the stored snapshot |
| `node tests/smoke.cjs` | Headless Chrome: title, new run, race, and no script errors |

After an intentional gameplay change, regenerate the engine snapshot with `node tests/determinism.cjs --update` and say so in the pull request.
