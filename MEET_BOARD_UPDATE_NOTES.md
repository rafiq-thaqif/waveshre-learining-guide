# Meet the Board - interaction and internal model update

1. Fixed focus targeting by finding all GLB meshes for each component prefix and calculating their world-space bounding box.
2. Added side-aware camera approach: front terminal groups are approached from the front; CAN, RS485, auxiliary terminals, USB-C, Ethernet and antenna are approached from the rear.
3. Added a soft blue selection outline with a slow 2.8-second pulse. Reset view clears the highlight.
4. Replaced the photographic PCB plane with a simplified 3D internal model built from Three.js geometry.
5. Corrected internal orientation to align the front DI/DO/power terminals and rear auxiliary/CAN/RS485 groups with the exterior model.
6. The internal model includes major board features only; it is an educational approximation, not precision CAD.
7. Preserved the single toolbar in the HTML stage header.

## Upload

Replace `board3d.js`, `app.js`, and `styles.css` in the existing repository. Upload `assets/Final_Waveshare.glb` to the existing assets folder (the model itself is unchanged). Keep `index.html`, `Waveshare-Digital-Twin.html`, `.nojekyll`, and `firmware/` unless separately instructed.

The old `assets/actual-pcb-reference.png` is no longer requested by `board3d.js`. It can be deleted from GitHub after confirming the new 3D internal view works.
