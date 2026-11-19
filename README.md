# Meet the Board: transparency and selection highlight fix

This patch updates only `board3d.js`. Keep the existing `assets/Final_Waveshare.glb` and all other website files.

## Changes

- Internal mode now fades all exterior GLB meshes to 12% opacity, disables their shadow contribution, and hides the top label decal. Exiting internal mode restores the original material and visibility states.
- The simplified 3D PCB is scaled to 92% in X and 72% in Z so its 156 x 90 mm starting footprint becomes approximately 143.5 x 64.8 mm, fitting inside the enclosure's approximate 150 x 66 mm shell footprint. The component layout is scaled with the PCB.
- Removed the wireframe bounding-box highlight.
- Selecting a component now applies a cyan emissive highlight to the actual matching GLB meshes (or the selected internal component) plus a low-intensity point light at the component's centre.
- The highlight pulses gently over a 2.8-second cycle. Resetting or selecting another component restores the previous materials.

## Upload

Replace only the repository-root `board3d.js` with the supplied file. Do not replace `index.html`, `app.js`, `styles.css`, or `assets/Final_Waveshare.glb` for this patch.

## Notes

The internal PCB is a simplified educational 3D reconstruction, not a dimensionally verified PCB CAD model. Check the deployed page in the browser after uploading; the final appearance depends on the browser's WebGL rendering and the current GLB materials.
