WAVESHARE MEET THE BOARD UPDATE

Replace these four files in the root of your GitHub repository:
- board3d.js
- app.js
- index.html
- Waveshare-Digital-Twin.html

Keep assets/Final_Waveshare.glb, styles.css, .nojekyll, firmware/, and other assets unchanged.

Changes:
- Stretch only the antenna-side portion of the internal PCB assembly, keeping the I/O-side edge fixed.
- Add a metallic gold SMA connector stem and foot between the antenna and enclosure.
- Include the added connector in antenna highlighting and exterior transparency.
- Remove Reset View and Pause Spin buttons.
- Clicking the currently selected component again collapses its description, restores the exterior, resets the camera, and resumes rotation.
- Show Internals remains a camera-independent transparency toggle.
