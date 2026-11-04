# Scrap Prix

A browser-based car-building roguelike racer with procedural environments, modular parts and hidden gag-vehicle recipes.

This repository starts from the latest local working build on **4 November 2026**, including the current Street layout: groups of **4–7 houses**, with varying gaps between groups. It preserves the completed Truck changes and the current Mechanical Fossil work.

## Run

Prerequisites: Python 3. Node.js is needed only for automated checks. No npm packages or Python packages are required.

```sh
python scripts/build.py
```

On Windows you can use `py -3 scripts/build.py`, or double-click **BUILD-AND-PLAY.cmd**.

After building, open:

- `dist/index.html` — playable game.
- `dist/dev.html` — DEV Studio with Parts, Environment and Event Motion Labs.
- `dist/STREET-PREVIEW.html` — instant environment preview, starting at Street.
- `dist/FOSSIL-TEST-DRIVE.html` — preserved vehicle test screen.

These builds are standalone HTML files with images embedded. They can be opened directly. For a local server, run `python -m http.server 8765 --bind 127.0.0.1` from this folder, then open `http://127.0.0.1:8765/dist/`.

## Work on the game

Edit `src/`, `assets/` and `previews/`, then rebuild. Generated files in `dist/` are ignored by Git.

- `src/game.template.html` — page structure and module placement.
- `src/game.css` — game and DEV Studio styling.
- `src/02-catalogue.js`, `03-engine.js` — catalogue and deterministic rules.
- `src/08-gag-recipes.js`, `09-vehicle-art.js` — exact visual recipes and vehicle rendering.
- `src/10-environments.js`, `20-scene.js` — environment definitions and scenery drawing.
- `src/11-event-effects.js` through `19-transform-cinematics.js` — event presentation modules.
- `src/21-art-review.js` through `24-event-motion-lab.js` — review tools and labs.
- `src/25-app.js` — application screens and controls.
- `assets/vehicles/` — original approved Mechanical Fossil illustrated masters.
- `assets/embedded/` — other PNGs extracted losslessly from the inherited build.
- `previews/` — standalone preview control panels.

The build embeds source and assets in their original order. `{{ASSET:path}}` tokens become data URIs; script/style tokens in the template become inline modules. Keep these tokens intact when moving assets.

## Check

```sh
python scripts/build.py
node tests/check.cjs
```

Checks cover script syntax, all 17 exact gag recipes and near-matches, finite vehicle projections, gameplay-to-visual IDs, Street house counts, gap widths and motion continuity. Browser visual review is still necessary for artwork and animations.

The one-time import check below proves parity with the original handoff. It is expected to differ after intentional source edits:

```sh
python scripts/build.py --check-import
```

## Current art pass

Environment work proceeds **one environment at a time**, then weather conditions. Street is currently under review. The goal is personality and restrained depth through colour/shading, retaining the retro 2D style. Street uses world-anchored building frontages that pass out of frame, rather than isolated repeating house props.

Gag-vehicle artwork and animation are deferred to the owner for a later Pixel Animation Studio pass. Preserve existing vehicle work while editing environments. Gameplay, economy, save rules and event probabilities are outside the current visual-polish scope.

See [project status](docs/PROJECT-STATUS.md), [asset provenance](docs/ASSET-PROVENANCE.md) and [GitHub setup](docs/GITHUB-SETUP.md).

No open-source licence has been selected for this initial repository. No licence grant is implied by the handoff.
