import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const PARTS = {
  di: { label: 'Digital inputs DI1-DI8', object: '07 - Digital inputs DI1-DI8 - green body', offset: [0, 12, 0], focus: 82 },
  do: { label: 'Digital outputs DO1-DO8', object: '06 - Digital outputs DO1-DO8 - green body', offset: [0, 12, 0], focus: 82 },
  power: { label: '7-36 V power input', object: '08 - 7-36V power input - green body', offset: [0, 12, 0], focus: 76 },
  rs485: { label: 'RS485 terminals', object: '09 - RS485 terminals - green body', offset: [0, 12, 0], focus: 76 },
  can: { label: 'CAN terminals', object: '10 - CAN terminals - green body', offset: [0, 12, 0], focus: 76 },
  aux: { label: 'Auxiliary signal terminals', object: '18 - Rear 8-way terminal - green body', offset: [0, 12, 0], focus: 76 },
  usb: { label: 'USB Type-C', object: '12 - USB-C metal bezel', offset: [0, 12, 0], focus: 70 },
  ethernet: { label: 'Ethernet / PoE', object: '13 - Ethernet jack housing', offset: [0, 12, 0], focus: 74 },
  antenna: { label: 'External antenna', object: '14 - Antenna base collar', offset: [0, 16, 0], focus: 88 },
  mcu: { label: 'ESP32-S3 controller', fallback: [0, 28, 0], focus: 88 },
  buzzer: { label: 'Onboard buzzer', fallback: [-59, 27, -15], focus: 76 }
};

const material = (color, roughness = 0.65, metalness = 0.08) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

function roundedBox(parent, size, position, mat, radius = 2, segments = 3) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], segments, radius), mat);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function box(parent, size, position, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, radius, height, position, mat, segments = 20, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), mat);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addTextPlane(parent, text, width, height, position, rotation, color = '#e9f0f5', fontSize = 18) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);
  ctx.fillStyle = color;
  ctx.font = `700 ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64, 500);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function makeHotspotTexture(active = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(64, 64, 43, 0, Math.PI * 2);
  ctx.fillStyle = active ? '#132235' : 'rgba(255,255,255,.97)';
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = active ? '#f2ad35' : '#2777c9';
  ctx.stroke();
  ctx.fillStyle = active ? '#fff' : '#2777c9';
  ctx.font = 'bold 76px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', 64, 68);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// These are deliberately simplified, conceptual internals retained from the
// original learning guide. They are not represented as a verified PCB scan.
function createInternalModel() {
  const group = new THREE.Group();
  roundedBox(group, [145, 2.2, 62], [0, 19, 0], material('#176747', 0.6, 0.04), 1, 3);
  const goldPad = material('#c7a35c', 0.32, 0.72);
  for (let i = 0; i < 30; i++) {
    const x = -67 + (i % 15) * 9.5;
    const z = i < 15 ? -27 : 27;
    roundedBox(group, [4, 0.8, 2.8], [x, 20.6, z], goldPad, 0.4, 2);
  }
  roundedBox(group, [35, 6, 25], [0, 24, -2], material('#aeb9c1', 0.28, 0.78), 2, 4);
  roundedBox(group, [28, 0.6, 18], [0, 27.3, -2], material('#d7dce0', 0.28, 0.65), 0.25, 3);
  addTextPlane(group, 'ESP32-S3-WROOM-1U', 27, 5, [0, 27.8, -2], [-Math.PI / 2, 0, 0], '#243342', 18);
  roundedBox(group, [17, 4, 16], [-43, 22.5, 3], material('#171d24', 0.42, 0.15), 1, 3);
  addTextPlane(group, 'W5500', 13, 4, [-43, 24.8, 3], [-Math.PI / 2, 0, 0], '#e9eff4', 22);
  roundedBox(group, [12, 3.5, 12], [37, 22.2, 6], material('#1a2027', 0.45, 0.12), 1, 3);
  addTextPlane(group, 'TCA9554', 10, 3, [37, 24.3, 6], [-Math.PI / 2, 0, 0], '#e9eff4', 18);
  roundedBox(group, [27, 8, 17], [55, 24, -16], material('#242b32', 0.58, 0.15), 1, 3);
  for (let i = 0; i < 8; i++) {
    roundedBox(group, [5, 4, 6], [-59 + i * 8, 22.5, 15], material(i % 2 ? '#d6dbe0' : '#a7b3bc', 0.4, 0.4), 0.7, 2);
  }
  cylinder(group, 6.5, 5, [-59, 23, -15], material('#171d22', 0.72, 0.04), 28);
  roundedBox(group, [11, 3, 10], [56, 22, 16], material('#222a31', 0.45, 0.12), 1, 3);
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

  const loading = document.createElement('div');
  loading.className = 'viewer-hint';
  loading.textContent = 'Loading Waveshare 3D model...';
  host.appendChild(loading);

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

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshStandardMaterial({ color: '#f0f3f6', roughness: 1, metalness: 0 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1;
  floor.receiveShadow = true;
  scene.add(floor);
  const grid = new THREE.GridHelper(600, 30, 0xd6dfe8, 0xe5eaf0);
  grid.position.y = -0.6;
  grid.material.transparent = true;
  grid.material.opacity = 0.34;
  scene.add(grid);
  const turntable = new THREE.Mesh(new THREE.CylinderGeometry(118, 118, 5, 80), material('#e7ecf1', 0.8, 0.02));
  turntable.position.y = -3;
  turntable.receiveShadow = true;
  scene.add(turntable);

  let glbRoot;
  let internalGroup;
  let controls;
  let markers = [];
  let markerPositions = {};
  let cameraAnimation = null;
  let inView = true;

  try {
    const gltf = await gltfPromise;
    glbRoot = gltf.scene.clone(true);
    glbRoot.traverse(object => {
      if (object.name === 'Cube.001') object.parent?.remove(object);
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      if (Array.isArray(object.material)) object.material = object.material.map(mat => mat.clone());
      else if (object.material) object.material = object.material.clone();
    });
  } catch (error) {
    console.error('Unable to load the Waveshare GLB:', error);
    loading.textContent = 'The 3D model could not be loaded. Check that assets/Final_Waveshare.glb is present.';
    return;
  }

  const modelRoot = new THREE.Group();
  modelRoot.name = 'Waveshare model root';
  glbRoot.scale.setScalar(1000);
  modelRoot.add(glbRoot);
  scene.add(modelRoot);
  modelRoot.updateMatrixWorld(true);

  // Use the measured mounting plate to centre the board and put its underside
  // on y=0. This also keeps the hotspot coordinates aligned to the GLB.
  const basePlate = glbRoot.getObjectByName('01 - Mounting base plate 175x90x5');
  if (basePlate) {
    const baseBounds = new THREE.Box3().setFromObject(basePlate);
    const baseCenter = baseBounds.getCenter(new THREE.Vector3());
    glbRoot.position.x -= baseCenter.x;
    glbRoot.position.y -= baseBounds.min.y;
    glbRoot.position.z -= baseCenter.z;
  } else {
    glbRoot.position.y += 4;
    glbRoot.position.z += 13.174;
  }
  modelRoot.updateMatrixWorld(true);

  internalGroup = createInternalModel();
  internalGroup.visible = false;
  modelRoot.add(internalGroup);

  const exteriorMaterialStates = [];
  glbRoot.traverse(object => {
    if (!object.isMesh || !object.material) return;
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    mats.forEach(mat => exteriorMaterialStates.push({
      material: mat,
      transparent: mat.transparent,
      opacity: mat.opacity,
      depthWrite: mat.depthWrite
    }));
  });

  function setInternals(show) {
    internalGroup.visible = show;
    exteriorMaterialStates.forEach(state => {
      state.material.transparent = show ? true : state.transparent;
      state.material.opacity = show ? 0.18 : state.opacity;
      state.material.depthWrite = show ? false : state.depthWrite;
      state.material.needsUpdate = true;
    });
  }

  function getPartPosition(part) {
    if (part.object) {
      const object = glbRoot.getObjectByName(part.object);
      if (object) {
        const bounds = new THREE.Box3().setFromObject(object);
        const center = bounds.getCenter(new THREE.Vector3());
        center.add(new THREE.Vector3(...part.offset));
        return center;
      }
    }
    return new THREE.Vector3(...(part.fallback || [0, 25, 0]));
  }

  if (mode !== 'home') {
    const markerGroup = new THREE.Group();
    markerGroup.name = 'Component hotspots';
    modelRoot.add(markerGroup);
    Object.entries(PARTS).forEach(([id, part]) => {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeHotspotTexture(false), depthTest: false, depthWrite: false, transparent: true }));
      const position = getPartPosition(part);
      sprite.position.copy(position);
      sprite.scale.set(8.5, 8.5, 1);
      sprite.userData = { id, label: part.label };
      markerGroup.add(sprite);
      markers.push(sprite);
      markerPositions[id] = position;
    });
    loading.remove();
    const hint = document.createElement('div');
    hint.className = 'viewer-hint';
    hint.textContent = 'Select a component to pause rotation and move closer';
    host.appendChild(hint);
  } else {
    loading.remove();
  }

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 22, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.enablePan = false;
  controls.minDistance = 75;
  controls.maxDistance = 600;
  controls.minPolarAngle = 0.28;
  controls.maxPolarAngle = 1.48;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.55;

  function setMarkerActive(id) {
    markers.forEach(sprite => {
      const active = sprite.userData.id === id;
      sprite.material.map = makeHotspotTexture(active);
      sprite.material.needsUpdate = true;
      sprite.scale.setScalar(active ? 11 : 8.5);
    });
  }

  function focusPart(id) {
    const part = PARTS[id];
    const target = markerPositions[id];
    if (!part || !target) return;
    controls.autoRotate = false;
    const direction = camera.position.clone().sub(controls.target).normalize();
    if (!Number.isFinite(direction.x) || direction.length() < 0.1) direction.set(0.65, 0.55, 0.65).normalize();
    const destination = target.clone().add(direction.multiplyScalar(part.focus || 82));
    cameraAnimation = {
      start: performance.now(), duration: 780,
      fromPosition: camera.position.clone(), toPosition: destination,
      fromTarget: controls.target.clone(), toTarget: target.clone()
    };
    setMarkerActive(id);
  }

  function resetView(resume = true) {
    cameraAnimation = {
      start: performance.now(), duration: 650,
      fromPosition: camera.position.clone(), toPosition: new THREE.Vector3(245, 170, 265),
      fromTarget: controls.target.clone(), toTarget: new THREE.Vector3(0, 22, 0)
    };
    if (resume) controls.autoRotate = true;
    if (mode !== 'home') setMarkerActive(null);
  }

  if (mode !== 'home') {
    const toolbar = document.createElement('div');
    toolbar.className = 'viewer-controls';
    toolbar.innerHTML = '<button type="button" data-view-action="reset">Reset</button><button type="button" data-view-action="spin">Pause spin</button><button type="button" data-view-action="internals">Show internals</button>';
    host.appendChild(toolbar);
    toolbar.addEventListener('pointerdown', event => event.stopPropagation());
    toolbar.addEventListener('click', event => {
      const button = event.target.closest('button[data-view-action]');
      if (!button) return;
      if (button.dataset.viewAction === 'reset') {
        setInternals(false);
        toolbar.querySelector('[data-view-action="internals"]').textContent = 'Show internals';
        resetView(true);
        toolbar.querySelector('[data-view-action="spin"]').textContent = 'Pause spin';
      }
      if (button.dataset.viewAction === 'spin') {
        controls.autoRotate = !controls.autoRotate;
        button.textContent = controls.autoRotate ? 'Pause spin' : 'Resume spin';
      }
      if (button.dataset.viewAction === 'internals') {
        const showing = !internalGroup.visible;
        setInternals(showing);
        button.textContent = showing ? 'Hide internals' : 'Show internals';
        controls.autoRotate = false;
        if (showing) focusPart('mcu');
      }
    });
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down = null;
  if (mode !== 'home') {
    renderer.domElement.addEventListener('pointerdown', event => { down = { x: event.clientX, y: event.clientY }; });
    renderer.domElement.addEventListener('pointermove', event => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(markers, false)[0];
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
    });
    renderer.domElement.addEventListener('pointerup', event => {
      if (!down) return;
      const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y);
      down = null;
      if (moved > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(markers, false)[0];
      if (hit?.object?.userData?.id) {
        const id = hit.object.userData.id;
        focusPart(id);
        window.dispatchEvent(new CustomEvent('board:component-selected', { detail: { id } }));
      }
    });
  }

  window.addEventListener('board:focus', event => { if (mode !== 'home' && event.detail?.id) focusPart(event.detail.id); });
  window.addEventListener('board:reset', () => resetView(true));
  window.addEventListener('board:spin', event => { controls.autoRotate = Boolean(event.detail?.enabled); });
  window.addEventListener('board:internals', event => { setInternals(Boolean(event.detail?.show)); });

  function resize() {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const visibility = new IntersectionObserver(entries => { if (entries[0]?.isIntersecting) resize(); });
  visibility.observe(host);
  const viewportObserver = new IntersectionObserver(entries => { inView = Boolean(entries[0]?.isIntersecting); if (inView) resize(); });
  viewportObserver.observe(host);

  function animate() {
    requestAnimationFrame(animate);
    if (!inView || document.visibilityState !== 'visible') return;
    if (cameraAnimation) {
      const t = Math.min(1, (performance.now() - cameraAnimation.start) / cameraAnimation.duration);
      const eased = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(cameraAnimation.fromPosition, cameraAnimation.toPosition, eased);
      controls.target.lerpVectors(cameraAnimation.fromTarget, cameraAnimation.toTarget, eased);
      if (t >= 1) cameraAnimation = null;
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
    renderer.dispose();
  };
}

document.querySelectorAll('.three-host').forEach(host => { createViewer(host); });
