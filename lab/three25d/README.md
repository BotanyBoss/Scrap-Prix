# Scrap Prix 2.5D / Three.js proof of concept

This is an isolated technical experiment, **not** a replacement of the current race renderer or game rules.

## Purpose
- Verify that actual 3D building geometry solves the flat-frontage problem while keeping a fixed straight rear camera.
- Demonstrate a car with four separate geometry/mounting groups (chassis, engine, tyres, gadget).
- Demonstrate in-browser recolouring, part swaps, real-time rendering and loading local Meshy/Blender .glb assets.
- Measure draw-call and triangle counts before deciding whether Three.js is viable for Scrap Prix.

## How to use
Open `lab/three25d/index.html` on a web host or its dedicated Vercel lab. The site loads Three.js 0.162.0 from jsDelivr; an internet connection is required.

Use Pause / Restart approach / Speed and change each vehicle part and its paint colour. For import, select a local GLB model; it replaces a reference building on the left side of the road. The model stays inside the browser and is not uploaded.

## What is real
Houses have 3D wall, side, and roof meshes. Roadside movement is a world-space loop. The car is constructed from four independent geometry groups.

## What is still placeholder
- Car parts and architecture have only deliberately simplified geometry. None of the final approved art is replaced.
- No race physics, event integration, normal save data or economy wiring.
- No exported Meshy model is included.
- Materials and outlines are rudimentary.

## Baseline test (8 November 2026)
Headless Chrome CI passed (real render, part swap, recolouring, controls; no browser console errors).
The software-rendered capture reported ~39 FPS and 640 draw calls at native internal resolution (480x270); this is not evidence of production performance.
Optimize with geometry batching / instancing and a tighter visible-object budget before broader adoption. Compare on ordinary hardware.

**Approval gate:** do not move the main game's visuals to Three.js or bulk-generate 3D models until a representative street, 4-part modular vehicle, and event/camera handoff pass visual and performance review.
