# Asset provenance

PNG assets were decoded losslessly from the inherited latest standalone build. `assets/manifest.json` records their MIME types, sizes and SHA-256 hashes. Rebuilding embeds the PNG bytes again.

- `assets/vehicles/mechanical-fossil-garage.png` and `mechanical-fossil-rear.png`: original illustrated studies generated in this project, approved by the owner as the production art direction on 3 November 2026. They are not cropped from the supplied concept sheet. The later runtime animation/palette treatment remains a work in progress.
- `assets/embedded/*.png`: four inherited PNGs from the existing game source. Their earlier authorship/licensing was not independently audited during this repository packaging task.
- Native canvas/vector vehicle, scenery and UI artwork remains in its source modules.

External design-reference sheets, personal review exports, browser saves, chat attachments and historical build archives are excluded from this initial repository. No third-party licence was assigned or changed by packaging.
