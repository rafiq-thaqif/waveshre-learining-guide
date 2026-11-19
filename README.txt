WAVESHARE MEET THE BOARD - INTERNAL POSITION AND VISIBILITY FIX

Replace these two files in the ROOT of your GitHub repository:
  1. board3d.js
  2. app.js

Do not upload this ZIP itself. Extract it first, then upload the two files
using GitHub -> Add file -> Upload files, replacing the existing root files.

What changed:
- The simplified 3D PCB assembly is shifted farther toward the upper/rear
  side of the enclosure and made slightly shallower so it stays inside.
- Component highlighting overlays the selected mesh using its full world
  transform. This applies to exterior and interior component meshes, not a box.
- The Show/Hide Internals toolbar button only toggles exterior transparency.
  It does not select the ESP32-S3, zoom the camera, reset the camera, or stop spin.
- Selecting an internal component in the component index still reveals the
  internal view, zooms to that component and highlights it.

After committing, wait for GitHub Pages to publish and press Ctrl+Shift+R.
The existing GLB, index.html, styles.css, firmware folder and .nojekyll remain.
