# Modular vehicle pipeline proof

Build with `python previews/vehicle-pipeline/build.py` and open `dist/VEHICLE-PIPELINE.html`.
To refresh the installed Art Forge workspace, append the existing Art Forge project directory
to that command. Open its normal Vite dev server at `/#/vehicle-pipeline`.

The assembly uses game catalogue IDs, native donor faces, ground-centre origin, +Y up
and +Z forward. Rigid parts retain their donor scale. Tyre radius controls ride height.
Longbody adds a supported rear axle to the original four-wheel donor. The test offers
three engines, three tyre sets and three gadgets per chassis. Wear tints a slot.
The mounts and axle beams are temporary fabrication geometry.

The inspector uploads slot-owned triangles and lines to browser WebGL. Each race capture
uses the same buffers, an orthographic camera and a transparent 164 × 113 bitmap.
The other frame uses the game's depth and edge raster with exactly the same faces,
materials and camera. Both exports share a ground pivot at (82,84).
The direct WebGL adapter avoids the prototype garage's runtime Three.js CDN import.
The viewer needs WebGL for the interactive comparison and runs offline from one HTML file.

## Measurements and review

On Edge / GTX 1080 Ti, 81 assemblies produced 243 views per renderer. All were
nonempty and inside the frame, including worn-component and repeat-render spot checks.
Median / p95 milliseconds: WebGL capture with readback 0.7 / 1.2, game raster 2.1 / 2.9,
assembly plus changed buffer upload 0.5 / 3.2. Thirty-draw orbit batches averaged
0.047 ms per submission at the median batch, not a display refresh-rate measurement.
Final loadout used 265,824 bytes of vertex buffers. Twelve cached pairs occupy at most
1,779,072 bytes of raw RGBA, excluding browser textures, geometry objects and overhead.
The immutable donor cache holds 12 slot assets. Equipment changes invalidate only
dependent geometry; repeated frame requests reuse a bounded LRU until eviction.

Use a shared modular rig for production. Bake and reuse on-demand frames for common
camera cuts. The game raster gives clearer high-contrast wheel and panel boundaries
at small size; evaluate those edges on GPU captures before selecting the default.
A parallel hand-authored sprite rig would require corresponding pivots, occlusion
and wear treatments for every camera. No finished mesh set, physical collision
solver, independent hand-painted sprite benchmark or gag-body validation is part of this proof.
The next art decision is whether these silhouettes, sockets and edge styles are acceptable.

For repeatable review, set PLAYWRIGHT_MODULE to an existing playwright-core installation
and CHROME_PATH to Chromium or Edge. Run `node previews/vehicle-pipeline/check.cjs`.
Optional PROOF_DIR selects the screenshot directory and FORGE_URL tests the embedded route.
