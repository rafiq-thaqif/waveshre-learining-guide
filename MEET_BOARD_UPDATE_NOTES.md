# Meet the Board update

This revision implements the requested interaction changes.

## Changes

- Removed the floating Three.js hotspot sprites and their pointer raycasting.
- Component selection now happens through the Component Index only.
- Each component description expands directly underneath its own component name; the old detail block at the bottom of the panel was removed.
- Selecting an external component animates the camera to the matching named object in `Final_Waveshare.glb`.
- Selecting the ESP32-S3 module or onboard buzzer automatically opens the internal view and focuses the supplied PCB photograph.
- Replaced the previous invented/simplified internal board shapes with a photographic PCB reference made from the user-supplied image. The photo is cropped to the PCB outline and embedded as `assets/actual-pcb-reference.png`.
- During internal view, the outer enclosure becomes translucent and duplicated exterior terminal/port meshes are hidden so the photographed PCB is not covered by a second set of connectors.
- Removed the second toolbar that was being created dynamically inside `board3d.js`. The three controls in the HTML stage toolbar are now the only controls.

## Important accuracy note

The internal view is a photographic reference plane based on the supplied PCB image. It is not a fully modelled, dimensionally verified 3D reconstruction of the PCB components. Internal focus positions are approximate visual targets.

## Files changed

- `board3d.js`
- `app.js`
- `index.html`
- `Waveshare-Digital-Twin.html`
- `styles.css`
- `assets/actual-pcb-reference.png` (new)

The existing GLB file and other lesson content are retained.
