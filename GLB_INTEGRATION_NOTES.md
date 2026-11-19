# GLB integration and Meet the Board notes

The 3D viewer loads `assets/Final_Waveshare.glb` using Three.js `GLTFLoader`.

## Current Meet the Board behaviour

- The floating hotspot sprites have been removed.
- The Component Index is the only component-selection interface.
- Selecting a component expands its description directly below that component name and animates the camera towards the corresponding GLB object.
- The ESP32-S3 module and onboard buzzer are treated as internal components. Selecting either automatically opens the internal PCB reference view.
- The internal view uses `assets/actual-pcb-reference.png`, cropped from the user-supplied photograph. The enclosure is made translucent and duplicate exterior terminal/port meshes are hidden while the photo is visible.
- The internal image is a photographic reference plane, not a fully modelled or dimensionally verified 3D PCB.
- The toolbar is defined once in the HTML stage header. `board3d.js` does not create another toolbar.

## Model notes

- The GLB is scaled for the viewer and centred using the named mounting base plate.
- The stray `Cube.001` object is excluded from the viewer scene.
- External focus positions are calculated from the named GLB mesh bounds at runtime.
- Internal focus coordinates are approximate visual targets on the PCB photograph.

## Files

- `assets/Final_Waveshare.glb` - exterior Waveshare model.
- `assets/actual-pcb-reference.png` - photographic internal PCB reference.
- `board3d.js` - Three.js model loading, camera focus and internal-view behaviour.
- `app.js` - component accordion and control events.
