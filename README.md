# Waveshare ESP32-S3-POE-ETH-8DI-8DO Digital Twin

Static GitHub Pages learning guide using Three.js and the user's Blender-exported Waveshare GLB.

## Website sections

- **Home** - landing page and rotating 3D model.
- **Meet the Board** - component index with expandable descriptions and camera focus.
- **Guide** - Local I/O Control, Wi-Fi AP, Wi-Fi STA, MQTT & Node-RED.
- **Lessons** - adapted practical exercises.
- **Reference** - board documentation and reference material.

## Meet the Board interactions

- Floating hotspot sprites are removed. The Component Index is the only component-selection method.
- Selecting a component expands its description directly beneath its name.
- The camera frames the full named GLB component assembly using its world-space bounding box.
- The selected assembly receives a slow, soft blue pulsing outline.
- Selecting the ESP32-S3 module or onboard buzzer opens the simplified 3D PCB view automatically.
- The internal view is built from 3D geometry (PCB, module, ICs, transceivers, power components, capacitors, headers, reset switch and buzzer). No photograph is used as the internal model.
- The top label decal is hidden in internal view, while the enclosure becomes translucent and the real terminal/port meshes remain visible.
- There is one toolbar only: Reset view, Pause/Resume spin, Show/Hide internals.

The PCB is a simplified educational reconstruction based on the supplied reference photograph. It is not precision CAD and should not be used for engineering measurements or board repair.

## Files

- `assets/Final_Waveshare.glb` - final exterior Waveshare model.
- `board3d.js` - GLB loading, world-space component focus, pulsing highlight and simplified 3D internal model.
- `app.js` - component index, accordion descriptions and viewer controls.
- `styles.css` - website styling.
- `index.html` - GitHub Pages entry point.
- `Waveshare-Digital-Twin.html` - alternate HTML entry file retained from the project.

## Run locally

Use an HTTP server such as VS Code Live Server. Do not open `index.html` with `file://`, because the site uses JavaScript modules and GLB assets.

## GitHub Pages deployment

Upload the contents of this folder to the repository root. Keep `assets/Final_Waveshare.glb` at that exact path. Keep `.nojekyll` and the existing firmware folder. Do not upload the editable `.blend` file to the website repository.

## Browser USB connection and firmware

The Guide's browser USB serial interface requires companion firmware implementing the documented JSON serial protocol. The browser firmware installer is not enabled until a verified merged firmware image and correct board flash layout are prepared.

## Safety

Verify all power polarity, voltage, current ratings and terminal functions against the official Waveshare documentation before wiring. The board's digital outputs are sinking transistor outputs, not mechanical relays.
