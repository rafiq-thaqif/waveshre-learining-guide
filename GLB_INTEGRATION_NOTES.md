# GLB integration and Meet the Board notes

The viewer loads `assets/Final_Waveshare.glb` with Three.js `GLTFLoader`.

## Component focus correction

Component focus now finds all meshes whose names begin with the component's GLB prefix, updates their world matrices, unions their world-space bounding boxes and uses the resulting centre to drive the camera. This prevents the camera from silently falling back to the board centre when a component consists of multiple meshes.

The camera approaches the front or rear edge from the corresponding side of the board. Focus distance is derived from the selected assembly's bounds.

## Selection highlight

A bounding outline and subtle translucent fill pulse slowly around the selected component. The pulse period is 2.8 seconds; it is intentionally gentle rather than a fast flash. The highlight is cleared on Reset view.

## Internal model

The internal view is generated entirely from Three.js 3D geometry. It includes a blue PCB substrate, mounting holes, ESP32-S3 RF shield/module, W5500 controller, digital input isolator banks, output driver banks, CAN and RS485 interface ICs, power regulator/inductor, capacitors, RTC coin cell, GPIO header, reset switch, onboard buzzer and representative SMD components.

No supplied photograph is used as a plane or texture in the internal view. The simplified board layout is oriented to match the external model's front and rear terminal positions. It is a learning representation, not precision engineering CAD.

In internal mode, the enclosure/base/mounting details become translucent, the top printed decal is hidden, and the existing GLB terminal blocks and ports remain visible. This avoids replacing real geometry with a flat picture.

## Toolbar

The single toolbar remains in the HTML stage header. `board3d.js` does not create a second toolbar.
