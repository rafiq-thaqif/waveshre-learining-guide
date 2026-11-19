import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// External focus targets use mesh-name prefixes rather than a single mesh.
// This lets the camera frame the complete connector/port assembly.
const PARTS = {
  di: { prefixes: ['07 - Digital inputs DI1-DI8'], fallback: [20, 11, 38], side: 1 },
  do: { prefixes: ['06 - Digital outputs DO1-DO8'], fallback: [-38, 11, 38], side: 1 },
  power: { prefixes: ['08 - 7-36V power input'], fallback: [56, 11, 38], side: 1 },
  rs485: { prefixes: ['09 - RS485 terminals'], fallback: [-57, 11, -38], side: -1 },
  can: { prefixes: ['10 - CAN terminals'], fallback: [-41, 11, -38], side: -1 },
  aux: { prefixes: ['18 - Rear 8-way terminal'], fallback: [-11, 11, -38], side: -1 },
  usb: { prefixes: ['12 - USB-C'], fallback: [32, 12, -33], side: -1 },
  ethernet: { prefixes: ['13 - Ethernet'], fallback: [47, 14, -37], side: -1 },
  antenna: { prefixes: ['14 - Antenna'], fallback: [63, 14, -46], side: -1 },
  mcu: { internalName: 'Internal - ESP32-S3 module', internal: true },
  buzzer: { internalName: 'Internal - Onboard buzzer', internal: true }
};

const HIDE_PREFIXES = ['04 - Top printed label decal'];

const mat = (color, roughness = 0.65, metalness = 0.05) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function addBox(parent, name, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addRounded(parent, name, size, position, material, radius = 0.6, segments = 3) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], segments, radius), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, name, radius, height, position, material, segments = 24) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addSilkscreen(parent, text, width, height, position, color = '#dceeff', fontSize = 54) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.font = `700 ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64, 500);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide })
  );
  label.name = `PCB silkscreen - ${text}`;
  label.rotation.x = -Math.PI / 2;
  label.position.set(...position);
  parent.add(label);
  return label;
}

function addIC(parent, name, x, z, width, depth, height, options = {}) {
  const group = new THREE.Group();
  group.name = `Internal - ${name}`;
  parent.add(group);
  const top = options.top ?? 11.2;
  const bodyMat = options.material || mat('#20262e', 0.48, 0.12);
  addRounded(group, `${name} IC body`, [width, height, depth], [x, top + height / 2, z], bodyMat, 0.45, 3);
  if (options.pins !== false) {
    const pinMat = options.pinMaterial || mat('#aeb8c2', 0.34, 0.72);
    const count = Math.max(3, Math.floor(width / 2.2));
    for (const side of [-1, 1]) {
      for (let i = 0; i < count; i++) {
        const px = x - width / 2 + (i + 0.5) * width / count;
        addBox(group, `${name} pin ${side} ${i + 1}`, [0.65, 0.42, 0.9], [px, top + 0.18, z + side * (depth / 2 + 0.35)], pinMat);
      }
    }
  }
  return group;
}

function addSmd(parent, name, x, z, width = 2.0, depth = 1.0, color = '#c9b99a', top = 11.25) {
  const bodyMat = mat(color, 0.72, 0.04);
  const metalMat = mat('#b8c1c9', 0.38, 0.7);
  addBox(parent, `${name} body`, [width, 0.72, depth], [x, top + 0.36, z], bodyMat);
  addBox(parent, `${name} end cap left`, [0.35, 0.45, depth + 0.1], [x - width / 2 - 0.08, top + 0.3, z], metalMat);
  addBox(parent, `${name} end cap right`, [0.35, 0.45, depth + 0.1], [x + width / 2 + 0.08, top + 0.3, z], metalMat);
}

function createInternalModel() {
  const group = new THREE.Group();
  group.name = 'Simplified 3D PCB assembly';

  const pcbMat = mat('#07539a', 0.72, 0.08);
  const solderMaskMat = mat('#0a65ad', 0.62, 0.08);
  const darkMat = mat('#141a20', 0.5, 0.12);
  const chipMat = mat('#252c34', 0.42, 0.12);
  const silverMat = mat('#b9c2ca', 0.3, 0.78);
  const goldMat = mat('#c9a34e', 0.32, 0.72);
  const capMat = mat('#aeb9c4', 0.3, 0.55);
  const tanMat = mat('#c9b895', 0.78, 0.02);
  const boardY = 9.4;
  const boardTop = boardY + 1.6;

  // Main blue PCB. The exterior connectors remain as the original GLB meshes,
  // so their positions stay aligned with the enclosure and printed terminal labels.
  addRounded(group, 'Blue PCB substrate', [156, 1.6, 90], [0, boardY, 0], pcbMat, 2.2, 5);
  addBox(group, 'PCB solder mask inset', [151, 0.08, 85], [0, boardTop + 0.04, 0], solderMaskMat);

  // Four mounting holes and plated rings.
  for (const x of [-73, 73]) {
    for (const z of [-39, 39]) {
      addCylinder(group, `Mounting hole dark center ${x} ${z}`, 2.7, 0.22, [x, boardTop + 0.12, z], darkMat, 28);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.38, 8, 28), goldMat);
      ring.name = `Mounting hole plated ring ${x} ${z}`;
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, boardTop + 0.25, z);
      group.add(ring);
    }
  }

  // ESP32-S3 module with a metallic RF shield and a small dark antenna end.
  const mcuGroup = new THREE.Group();
  mcuGroup.name = 'Internal - ESP32-S3 module';
  group.add(mcuGroup);
  addRounded(mcuGroup, 'ESP32-S3 module PCB', [25, 1.0, 20], [55, boardTop + 0.55, -15], darkMat, 0.7, 3);
  addRounded(mcuGroup, 'ESP32-S3 RF shield', [22, 2.8, 17], [55, boardTop + 2.25, -15], silverMat, 1.0, 4);
  addRounded(mcuGroup, 'ESP32-S3 shield inset', [17, 0.18, 12], [55, boardTop + 3.72, -15], mat('#929da7', 0.42, 0.62), 0.4, 3);
  addSilkscreen(mcuGroup, 'ESP32-S3', 12, 2.3, [55, boardTop + 3.84, -15], '#27323c', 52);
  for (let i = 0; i < 12; i++) {
    const px = 44.5 + i * 1.9;
    addBox(mcuGroup, `ESP32-S3 castellated pad ${i + 1}`, [0.8, 0.35, 0.65], [px, boardTop + 0.85, -25.2], goldMat);
    addBox(mcuGroup, `ESP32-S3 castellated pad far ${i + 1}`, [0.8, 0.35, 0.65], [px, boardTop + 0.85, -4.8], goldMat);
  }

  // Main Ethernet controller and the digital input/output isolation/driver ICs.
  addIC(group, 'W5500 Ethernet controller', 39, -15, 11, 11, 1.8);
  addSilkscreen(group, 'W5500', 9, 2, [39, boardTop + 2.05, -15], '#dce6ef', 54);
  addIC(group, 'Digital input isolator bank A', 18, 15, 9, 6, 1.7);
  addIC(group, 'Digital input isolator bank B', 18, 7, 9, 6, 1.7);
  addIC(group, 'Digital output driver bank A', -38, 15, 10, 6, 1.7);
  addIC(group, 'Digital output driver bank B', -38, 7, 10, 6, 1.7);
  addIC(group, 'Input logic controller', 1, 12, 12, 8, 1.8);
  addIC(group, 'Output logic controller', -18, 12, 12, 8, 1.8);

  // Isolated serial interface ICs.
  addIC(group, 'CAN transceiver', -41, -16, 8, 6, 1.7);
  addIC(group, 'RS485 transceiver', -59, -16, 8, 6, 1.7);
  addIC(group, 'CAN isolation controller', -41, -7, 7, 5, 1.5);
  addIC(group, 'RS485 isolation controller', -59, -7, 7, 5, 1.5);

  // Power conversion section: inductor, regulator and electrolytic capacitors.
  addRounded(group, 'Power inductor 470', [11, 4.2, 10], [43, boardTop + 2.1, 22], silverMat, 0.7, 3);
  addSilkscreen(group, '470', 6, 2, [43, boardTop + 4.25, 22], '#4a5661', 58);
  addIC(group, 'Power regulator IC', 29, 22, 7, 6, 1.8);
  addCylinder(group, 'Power capacitor 1', 2.7, 4.4, [54, boardTop + 2.2, 12], capMat, 24);
  addCylinder(group, 'Power capacitor 2', 2.3, 4.0, [35, boardTop + 2.0, 11], capMat, 24);
  addCylinder(group, 'Power capacitor 3', 2.0, 3.6, [24, boardTop + 1.8, -1], capMat, 24);
  addCylinder(group, 'Power capacitor 4', 2.0, 3.6, [14, boardTop + 1.8, -1], capMat, 24);

  // RTC coin-cell holder and cell.
  addCylinder(group, 'RTC coin cell holder', 7.0, 1.3, [-29, boardTop + 0.65, -7], silverMat, 40);
  addCylinder(group, 'RTC coin cell', 5.8, 1.8, [-29, boardTop + 2.05, -7], mat('#c5cbd1', 0.28, 0.82), 40);
  addBox(group, 'RTC holder contact tab', [2.2, 0.6, 7], [-29, boardTop + 3.1, -1], goldMat);

  // Header strip near the lower edge of the PCB.
  addRounded(group, 'GPIO header black base', [42, 1.8, 4.5], [11, boardTop + 0.9, -29], darkMat, 0.35, 3);
  for (let i = 0; i < 18; i++) {
    const x = -9 + i * 2.35;
    addBox(group, `GPIO header pin ${i + 1}`, [0.65, 3.1, 0.65], [x, boardTop + 2.25, -29], goldMat);
  }

  // Reset switch and onboard buzzer are distinct, selectable 3D components.
  const resetGroup = new THREE.Group();
  resetGroup.name = 'Internal - Reset button';
  group.add(resetGroup);
  addRounded(resetGroup, 'Reset switch body', [7, 2.1, 6], [68, boardTop + 1.05, 1], silverMat, 0.8, 3);
  addCylinder(resetGroup, 'Reset switch cap', 2.0, 1.3, [68, boardTop + 2.65, 1], mat('#f2f3f4', 0.42, 0.05), 24);
  addSilkscreen(group, 'RESET', 8, 1.8, [68, boardTop + 0.12, 5], '#dceeff', 54);

  const buzzerGroup = new THREE.Group();
  buzzerGroup.name = 'Internal - Onboard buzzer';
  group.add(buzzerGroup);
  addCylinder(buzzerGroup, 'Buzzer black body', 4.2, 3.6, [-18, boardTop + 1.8, -34], darkMat, 32);
  addCylinder(buzzerGroup, 'Buzzer top grille', 3.1, 0.35, [-18, boardTop + 3.78, -34], mat('#303941', 0.68, 0.04), 32);
  addCylinder(buzzerGroup, 'Buzzer sound opening', 1.15, 0.18, [-18, boardTop + 4.03, -34], mat('#080c10', 0.85, 0), 20);

  // Representative SMD resistors, diodes and small passives around the ICs.
  const smdRows = [
    { x: 17, z: 25, count: 8, dx: 3.2 },
    { x: -38, z: 25, count: 8, dx: 3.2 },
    { x: 0, z: -20, count: 10, dx: 3.1 },
    { x: 43, z: -1, count: 6, dx: 3.0 },
    { x: -49, z: 2, count: 6, dx: 2.8 }
  ];
  let smdIndex = 0;
  for (const row of smdRows) {
    for (let i = 0; i < row.count; i++) {
      addSmd(group, `SMD passive ${++smdIndex}`, row.x + (i - (row.count - 1) / 2) * row.dx, row.z, 2.0, 1.1, i % 3 === 0 ? '#d6c7a7' : '#9daab4');
    }
  }
  for (let i = 0; i < 12; i++) {
    const x = -8 + i * 1.5;
    addBox(group, `Signal diode ${i + 1}`, [0.95, 0.75, 2.0], [x, boardTop + 0.38, 27], mat('#c8d0d8', 0.4, 0.55));
  }

  // Board markings are intentionally sparse: enough to identify major regions
  // without pretending to reproduce every PCB silkscreen detail.
  addSilkscreen(group, 'DIGITAL INPUTS', 25, 2.2, [18, boardTop + 0.12, 30], '#e0efff', 42);
  addSilkscreen(group, 'DIGITAL OUTPUTS', 27, 2.2, [-38, boardTop + 0.12, 30], '#e0efff', 42);
  addSilkscreen(group, 'CAN', 8, 2, [-41, boardTop + 0.12, -23], '#e0efff', 48);
  addSilkscreen(group, 'RS485', 10, 2, [-59, boardTop + 0.12, -23], '#e0efff', 48);
  addSilkscreen(group, 'ESP32-S3', 15, 2, [55, boardTop + 0.12, -27], '#e0efff', 48);

  return group;
}

const gltfLoader = new GLTFLoader();
const modelUrl = new URL('./assets/Final_Waveshare.glb', import.meta.url).href;
const gltfPromise = gltfLoader.loadAsync(modelUrl);

async function createViewer(host) {
  const mode = host.dataset.viewer || 'meet';
  const width = Math.max(1, host.clientWidth);
  const height = Math.max(1, host.clientHeight);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 1200);
  camera.position.set(245, 170, 265);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x8d99a6, 1.45);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(210, 320, 240);
  key.castShadow = true;
  key.shadow.mapSize.set(1536, 1536);
  key.shadow.camera.left = -230;
  key.shadow.camera.right = 230;
  key.shadow.camera.top = 230;
  key.shadow.camera.bottom = -230;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd9eaff, 1.0);
  fill.position.set(-220, 140, -180);
  scene.add(fill);
  const rim = new THREE.PointLight(0xa9d7ff, 190, 500);
  rim.position.set(20, 170, 220);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200),
    new THREE.MeshStandardMaterial({ color: '#f0f3f6', roughness: 1, metalness: 0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(600, 30, 0xd6dfe8, 0xe5eaf0);
  grid.position.y = -0.6;
  grid.material.transparent = true;
  grid.material.opacity = 0.34;
  scene.add(grid);

  const turntable = new THREE.Mesh(
    new THREE.CylinderGeometry(118, 118, 5, 80),
    mat('#e7ecf1', 0.8, 0.02)
  );
  turntable.position.y = -3;
  turntable.receiveShadow = true;
  scene.add(turntable);

  let glbRoot;
  let internalGroup = null;
  let controls;
  let cameraAnimation = null;
  let highlightedMaterials = [];
  let highlightOverlays = [];
  let selectionLight = null;
  let selectionPulseStart = 0;
  let inView = true;
  const exteriorMaterialStates = [];
  const exteriorObjectStates = [];
  const hiddenObjectStates = [];

  try {
    const gltf = await gltfPromise;
    glbRoot = gltf.scene.clone(true);

    // The exported file has six loose duplicate terminal pieces and a default
    // Cube.001 as extra scene roots. Keep the named `world` model root only.
    const worldNode = glbRoot.getObjectByName('world');
    if (worldNode) {
      [...glbRoot.children].forEach(child => {
        if (child !== worldNode) glbRoot.remove(child);
      });
    } else {
      glbRoot.traverse(object => {
        if (object.name === 'Cube.001') object.parent?.remove(object);
      });
    }

    glbRoot.traverse(object => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      if (Array.isArray(object.material)) object.material = object.material.map(material => material.clone());
      else if (object.material) object.material = object.material.clone();
    });
  } catch (error) {
    console.error('Unable to load the Waveshare GLB:', error);
    const errorNotice = document.createElement('div');
    errorNotice.className = 'viewer-error';
    errorNotice.textContent = 'The 3D model could not be loaded. Check assets/Final_Waveshare.glb.';
    host.appendChild(errorNotice);
    return;
  }

  const modelRoot = new THREE.Group();
  modelRoot.name = 'Waveshare model root';
  glbRoot.scale.setScalar(1000);
  modelRoot.add(glbRoot);
  scene.add(modelRoot);
  modelRoot.updateMatrixWorld(true);

  // Centre the mounting plate and place its underside at y=0.
  const basePlate = glbRoot.getObjectByName('01 - Mounting base plate 175x90x5');
  if (basePlate) {
    const baseBounds = new THREE.Box3().setFromObject(basePlate);
    const baseCenter = baseBounds.getCenter(new THREE.Vector3());
    glbRoot.position.add(new THREE.Vector3(-baseCenter.x, -baseBounds.min.y, -baseCenter.z));
  } else {
    glbRoot.position.y += 4;
  }
  modelRoot.updateMatrixWorld(true);

  if (mode === 'meet') {
    internalGroup = createInternalModel();
    internalGroup.visible = false;
    // Keep the simplified PCB within the physical enclosure footprint.
    // The original 156 x 90 mm board filled the mounting plate and appeared
    // to protrude beyond the enclosure in the transparent view.
    // Fit the PCB inside the enclosure and move it farther toward the rear
    // edge (the upper side in the default viewer angle). Reducing the depth
    // slightly prevents the front edge from extending beyond the inner shell.
    internalGroup.scale.set(0.92, 1, 0.55);
    internalGroup.position.set(0, 0, -8.0);
    modelRoot.add(internalGroup);
    modelRoot.updateMatrixWorld(true);
  }

  glbRoot.traverse(object => {
    if (!object.isMesh) return;
    exteriorObjectStates.push({
      object,
      castShadow: object.castShadow,
      receiveShadow: object.receiveShadow
    });
    if (object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => exteriorMaterialStates.push({
        material,
        transparent: material.transparent,
        opacity: material.opacity,
        depthWrite: material.depthWrite,
        alphaTest: material.alphaTest
      }));
    }
    if (HIDE_PREFIXES.some(prefix => object.name.startsWith(prefix))) {
      hiddenObjectStates.push({ object, visible: object.visible });
    }
  });

  function setInternals(show) {
    if (!internalGroup) return;
    internalGroup.visible = show;
    // Fade every exterior mesh, not only a short list of enclosure pieces.
    // This makes the PCB and its components visible through the complete case.
    exteriorMaterialStates.forEach(state => {
      state.material.transparent = show ? true : state.transparent;
      state.material.opacity = show ? Math.min(state.opacity, 0.12) : state.opacity;
      state.material.depthWrite = show ? false : state.depthWrite;
      state.material.alphaTest = show ? 0 : state.alphaTest;
      state.material.needsUpdate = true;
    });
    exteriorObjectStates.forEach(state => {
      state.object.castShadow = show ? false : state.castShadow;
      state.object.receiveShadow = show ? false : state.receiveShadow;
    });
    hiddenObjectStates.forEach(state => { state.object.visible = show ? false : state.visible; });
  }

  function getPartBounds(part, id) {
    if (part.internal && internalGroup) {
      const internalObject = internalGroup.getObjectByName(part.internalName);
      if (internalObject) {
        internalObject.updateWorldMatrix(true, true);
        return new THREE.Box3().setFromObject(internalObject);
      }
    }

    const bounds = new THREE.Box3();
    let found = 0;
    if (part.prefixes) {
      glbRoot.traverse(object => {
        if (!object.isMesh || !part.prefixes.some(prefix => object.name.startsWith(prefix))) return;
        object.updateWorldMatrix(true, false);
        bounds.union(new THREE.Box3().setFromObject(object));
        found++;
      });
    }

    if (found > 0 && !bounds.isEmpty()) return bounds;
    console.warn(`No GLB meshes found for component '${id}'. Using its calibrated fallback position.`);
    const fallback = new THREE.Vector3(...(part.fallback || [0, 22, 0]));
    return new THREE.Box3(fallback.clone().addScalar(-5), fallback.clone().addScalar(5));
  }

  function getPartMeshes(part) {
    const meshes = [];
    if (part.internal && internalGroup) {
      const component = internalGroup.getObjectByName(part.internalName);
      if (component) component.traverse(object => { if (object.isMesh) meshes.push(object); });
      return meshes;
    }
    if (part.prefixes) {
      glbRoot.traverse(object => {
        if (object.isMesh && part.prefixes.some(prefix => object.name.startsWith(prefix))) meshes.push(object);
      });
    }
    return meshes;
  }

  function clearHighlight() {
    highlightedMaterials.forEach(state => {
      if (state.material.emissive) state.material.emissive.copy(state.emissive);
      if ('emissiveIntensity' in state.material) state.material.emissiveIntensity = state.originalEmissiveIntensity;
      state.material.needsUpdate = true;
    });
    highlightedMaterials = [];

    highlightOverlays.forEach(({ overlay, material }) => {
      overlay.parent?.remove(overlay);
      material.dispose();
    });
    highlightOverlays = [];

    if (selectionLight) {
      scene.remove(selectionLight);
      selectionLight = null;
    }
  }

  function setHighlight(part, bounds) {
    clearHighlight();
    const glowColor = new THREE.Color('#70d9ff');
    const meshes = getPartMeshes(part);

    meshes.forEach(mesh => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach(material => {
        if (!material || !material.emissive) return;
        highlightedMaterials.push({
          material,
          emissive: material.emissive.clone(),
          originalEmissiveIntensity: material.emissiveIntensity ?? 1
        });
        material.emissive.copy(glowColor);
        material.emissiveIntensity = 0.22;
        material.needsUpdate = true;
      });

      // Overlay the selected mesh itself (not its bounding box). Add it to
      // modelRoot with the mesh's complete world matrix so nested GLB objects
      // such as terminals, ports and their sub-parts highlight in the right place.
      if (mesh.geometry) {
        mesh.updateWorldMatrix(true, false);
        const overlayMaterial = new THREE.MeshBasicMaterial({
          color: glowColor,
          transparent: true,
          opacity: 0.10,
          blending: THREE.AdditiveBlending,
          depthTest: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1
        });
        const overlay = new THREE.Mesh(mesh.geometry, overlayMaterial);
        overlay.name = `Soft selection glow - ${mesh.name}`;
        overlay.matrixAutoUpdate = false;
        overlay.matrix.copy(mesh.matrixWorld);
        overlay.matrixWorldNeedsUpdate = true;
        overlay.renderOrder = 50;
        overlay.frustumCulled = false;
        overlay.castShadow = false;
        overlay.receiveShadow = false;
        modelRoot.add(overlay);
        highlightOverlays.push({ overlay, material: overlayMaterial });
      }
    });

    if (!meshes.length) console.warn('No meshes matched selected component:', part);

    selectionLight = new THREE.PointLight(glowColor, 0.28, 52, 2);
    selectionLight.position.copy(bounds.getCenter(new THREE.Vector3()));
    scene.add(selectionLight);
    selectionPulseStart = performance.now();
  }

  const controlsTarget = new THREE.Vector3(0, 22, 0);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(controlsTarget);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.enablePan = false;
  controls.minDistance = 55;
  controls.maxDistance = 600;
  controls.minPolarAngle = 0.18;
  controls.maxPolarAngle = 1.52;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.55;

  function focusPart(id) {
    const part = PARTS[id];
    if (!part) return;
    controls.autoRotate = false;
    modelRoot.updateMatrixWorld(true);
    const bounds = getPartBounds(part, id);
    const target = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    setHighlight(part, bounds);

    let direction;
    if (part.internal) {
      direction = new THREE.Vector3(0.22, 0.94, 0.26).normalize();
    } else {
      const xSide = target.x >= 0 ? 0.18 : -0.18;
      const zSide = part.side || (target.z >= 0 ? 1 : -1);
      direction = new THREE.Vector3(xSide, 0.62, zSide * 0.77).normalize();
    }

    const largestDimension = Math.max(size.x, size.y, size.z);
    const distance = THREE.MathUtils.clamp(largestDimension * 1.65 + 18, 58, 132);
    const destination = target.clone().add(direction.multiplyScalar(distance));

    cameraAnimation = {
      start: performance.now(),
      duration: part.internal ? 480 : 900,
      fromPosition: camera.position.clone(),
      toPosition: destination,
      fromTarget: controls.target.clone(),
      toTarget: target
    };
  }

  function resetView(resume = true) {
    clearHighlight();
    cameraAnimation = {
      start: performance.now(),
      duration: 700,
      fromPosition: camera.position.clone(),
      toPosition: new THREE.Vector3(245, 170, 265),
      fromTarget: controls.target.clone(),
      toTarget: new THREE.Vector3(0, 22, 0)
    };
    if (resume) controls.autoRotate = true;
  }

  if (mode === 'meet') {
    window.addEventListener('board:focus', event => {
      const id = event.detail?.id;
      const part = PARTS[id];
      if (!part) return;
      setInternals(Boolean(part.internal));
      focusPart(id);
    });

    window.addEventListener('board:reset', () => {
      setInternals(false);
      resetView(true);
    });

    window.addEventListener('board:spin', event => {
      controls.autoRotate = Boolean(event.detail?.enabled);
    });

    window.addEventListener('board:internals', event => {
      // The toolbar button is visibility-only: do not select a component,
      // animate the camera, or reset the user's current view.
      setInternals(Boolean(event.detail?.show));
    });
  }

  function resize() {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const visibility = new IntersectionObserver(entries => {
    if (entries[0]?.isIntersecting) resize();
  });
  visibility.observe(host);
  const viewportObserver = new IntersectionObserver(entries => {
    inView = Boolean(entries[0]?.isIntersecting);
    if (inView) resize();
  });
  viewportObserver.observe(host);

  function animate() {
    requestAnimationFrame(animate);
    if (!inView || document.visibilityState !== 'visible') return;
    const now = performance.now();
    if (cameraAnimation) {
      const t = Math.min(1, (now - cameraAnimation.start) / cameraAnimation.duration);
      const eased = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(cameraAnimation.fromPosition, cameraAnimation.toPosition, eased);
      controls.target.lerpVectors(cameraAnimation.fromTarget, cameraAnimation.toTarget, eased);
      if (t >= 1) cameraAnimation = null;
    }
    if (highlightedMaterials.length || highlightOverlays.length || selectionLight) {
      // One calm pulse every 2.8 seconds; selected physical surfaces gently glow.
      const pulse = (Math.sin(((now - selectionPulseStart) / 2800) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      highlightedMaterials.forEach(state => {
        state.material.emissiveIntensity = 0.16 + pulse * 0.52;
      });
      highlightOverlays.forEach(({ material }) => {
        material.opacity = 0.07 + pulse * 0.18;
      });
      if (selectionLight) selectionLight.intensity = 0.12 + pulse * 0.34;
    }
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  host._cleanup = () => {
    observer.disconnect();
    visibility.disconnect();
    viewportObserver.disconnect();
    controls.dispose();
    clearHighlight();
    renderer.dispose();
  };
}

document.querySelectorAll('.three-host').forEach(host => { createViewer(host); });
