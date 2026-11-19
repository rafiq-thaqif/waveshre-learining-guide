WAVESHARE MEET THE BOARD - FINAL ADJUSTMENTS

Replace these files in the ROOT of your GitHub repository:
- board3d.js
- index.html
- Waveshare-Digital-Twin.html (only if you also use this alternate page)

Keep these existing files and folders unchanged:
- assets/Final_Waveshare.glb
- app.js
- styles.css
- firmware/
- .nojekyll
- local-io3d.js

What changed:
1. Internal PCB assembly is slightly shallower and shifted toward the far/top edge to sit within the enclosure.
2. External and internal selected components receive a soft cyan surface glow, pulsing slowly every 2.8 seconds. No bounding cube is used.
3. The persistent "Loading Waveshare 3D model..." bubble is removed. A message appears only if the GLB actually fails to load.
4. Show Internals continues to reveal the 3D internal model and quickly focuses the ESP32-S3 module.
5. The 175 x 90 x 40 mm callout is removed from the Meet the Board heading.

After uploading, commit changes and hard-refresh the published site with Ctrl+Shift+R.
