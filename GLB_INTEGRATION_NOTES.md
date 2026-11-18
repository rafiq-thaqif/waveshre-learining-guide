# GLB integration notes

The site now loads the finished Blender model from `assets/Final_Waveshare.glb` using Three.js `GLTFLoader`.

## What changed

- Replaced the procedural exterior board in the three.js viewer with the supplied Blender GLB.
- Preserved the existing Home, Meet the Board, and Guide viewers.
- Repositioned the existing component hotspots by reading the named GLB objects at runtime, so the markers follow the actual model geometry.
- Added an Auxiliary signal terminals hotspot for the rear eight-way terminal block.
- Preserved the existing Reset, Pause spin, orbit/zoom, and Show internals controls.
- The Show internals view still uses the original simplified conceptual internal layout; it is not a verified scan of the physical PCB.

## Cleanup applied to the website GLB

The supplied GLB had seven loose scene-root objects at the origin: six duplicate connector detail meshes and a 2 m `Cube.001`. The website copy's active scene now references only the `world` collection containing the assembled Waveshare model. The embedded image, materials, and assembled model geometry are retained. The uploaded `.blend` file was not changed.

## Deploy

1. Extract the ZIP.
2. Open the `waveshare-digital-twin` folder.
3. Upload its contents to the root of the existing GitHub Pages repository, replacing `board3d.js` and `app.js` and adding `assets/Final_Waveshare.glb`.
4. Commit and push.
5. Open the published site over HTTPS and test Home, Meet the Board, and Guide.

Do not rename or move `assets/Final_Waveshare.glb` unless you also update the URL in `board3d.js`.

## Test checklist

- Home 3D preview loads and rotates.
- Meet the Board loads the same model.
- Hotspots for DI, DO, power, RS485, CAN, auxiliary terminals, USB-C, Ethernet, antenna, ESP32-S3, and buzzer work.
- Component list selection moves the camera to the matching hotspot.
- Reset and Pause spin work.
- Show internals reveals the simplified conceptual internal layout through the translucent enclosure.
- Guide's small 3D reference model loads.
