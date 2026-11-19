import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Component focus targets are derived from the named GLB meshes. Internal
// targets use approximate positions on the supplied top-down PCB photograph.
const PARTS = {
  di: { object: '07 - Digital inputs DI1-DI8 - green body', offset: [0, 2, 0], focus: 92 },
  do: { object: '06 - Digital outputs DO1-DO8 - green body', offset: [0, 2, 0], focus: 92 },
  power: { object: '08 - 7-36V power input - green body', offset: [0, 2, 0], focus: 82 },
  rs485: { object: '09 - RS485 terminals - green body', offset: [0, 2, 0], focus: 82 },
  can: { object: '10 - CAN terminals - green body', offset: [0, 2, 0], focus: 82 },
  aux: { object: '18 - Rear 8-way terminal - green body', offset: [0, 2, 0], focus: 82 },
  usb: { object: '12 - USB-C metal bezel', offset: [0, 2, 0], focus: 76 },
  ethernet: { object: '13 - Ethernet jack housing', offset: [0, 2, 0], focus: 82 },
  antenna: { object: '14 - Antenna base collar', offset: [0, 8, 0], focus: 100 },
  mcu: { internal: true, internalFocus: [-64, 20.5, -17], focus: 78 },
  buzzer: { internal: true, internalFocus: [-18, 20.5, -40], focus: 82 }
};

const INTERNAL_HIDE_PREFIXES = [
  '04 - Top printed label decal',
  '06 - Digital outputs',
  '07 - Digital inputs',
  '08 - 7-36V power input',
  '09 - RS485 terminals',
  '10 - CAN terminals',
  '11 - Header',
  '12 - USB-C',
  '13 - Ethernet',
  '14 - Antenna',
  '18 - Rear 8-way terminal'
];

const material = (color, roughness = 0.65, metalness = 0.08) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function createInternalReference(renderer) {
  const group = new THREE.Group();
  group.name = 'Actual PCB photographic reference';

  const textureUrl = new URL('./assets/actual-pcb-reference.png', import.meta.url).href;
  const texture = new THREE.TextureLoader().load(textureUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  // The supplied photograph is cropped to the PCB outline. The plane is a
  // visual reference, not a claim that every component has been rebuilt in 3D.
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(156, 90),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.025,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  board.name = 'PCB reference photograph';
  board.rotation.x = Math.PI / 2;
  board.position.set(0, 20.5, 0);
  board.renderOrder = 2;
  group.add(board);
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
    material('#e7ecf1', 0.8, 0.02)
  );
  turntable.position.y = -3;
  turntable.receiveShadow = true;
  scene.add(turntable);

  let glbRoot;
  let internalGroup = null;
  let controls;
  let cameraAnimation = null;
  let inView = true;
  let viewerHint = null;
  const exteriorMaterialStates = [];
  const internalHiddenStates = [];

  try {
    const gltf = await gltfPromise;
    glbRoot = gltf.scene.clone(true);
    glbRoot.traverse(object => {
      if (object.name === 'Cube.001') {
        object.parent?.remove(object);
        return;
      }
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

  // Centre the mounting plate and place its underside at y=0.
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

  if (mode === 'meet') {
    internalGroup = createInternalReference(renderer);
    internalGroup.visible = false;
    modelRoot.add(internalGroup);
  }

  glbRoot.traverse(object => {
    if (!object.isMesh || !object.material) return;
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    mats.forEach(mat => exteriorMaterialStates.push({
      material: mat,
      transparent: mat.transparent,
      opacity: mat.opacity,
      depthWrite: mat.depthWrite
    }));

    if (INTERNAL_HIDE_PREFIXES.some(prefix => object.name.startsWith(prefix))) {
      internalHiddenStates.push({ object, visible: object.visible });
    }
  });

  function setInternals(show) {
    if (!internalGroup) return;
    internalGroup.visible = show;
    if (viewerHint) viewerHint.textContent = show
      ? 'Internal view: photographic reference of the actual PCB'
      : 'Choose a component from the index to zoom in';
    exteriorMaterialStates.forEach(state => {
      state.material.transparent = show ? true : state.transparent;
      state.material.opacity = show ? 0.16 : state.opacity;
      state.material.depthWrite = show ? false : state.depthWrite;
      state.material.needsUpdate = true;
    });
    internalHiddenStates.forEach(state => {
      state.object.visible = show ? false : state.visible;
    });
  }

  function getPartPosition(part) {
    if (part.object) {
      const object = glbRoot.getObjectByName(part.object);
      if (object) {
        const bounds = new THREE.Box3().setFromObject(object);
        const center = bounds.getCenter(new THREE.Vector3());
        center.add(new THREE.Vector3(...(part.offset || [0, 0, 0])));
        return center;
      }
    }
    return new THREE.Vector3(0, 22, 0);
  }

  loading.remove();
  if (mode === 'meet') {
    viewerHint = document.createElement('div');
    viewerHint.className = 'viewer-hint';
    viewerHint.textContent = 'Choose a component from the index to zoom in';
    host.appendChild(viewerHint);
  }

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 22, 0);
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

    let target;
    let destination;
    if (part.internal) {
      target = new THREE.Vector3(...part.internalFocus);
      // Use a high oblique angle rather than a perfectly vertical camera so
      // OrbitControls keeps its normal world-up orientation reliably.
      destination = target.clone().add(new THREE.Vector3(0.16, 0.93, 0.30).normalize().multiplyScalar(part.focus || 82));
    } else {
      target = getPartPosition(part);
      let direction = camera.position.clone().sub(controls.target).normalize();
      if (!Number.isFinite(direction.x) || direction.length() < 0.1 || Math.abs(direction.y) > 0.88) {
        direction = new THREE.Vector3(0.65, 0.55, 0.65).normalize();
      }
      destination = target.clone().add(direction.multiplyScalar(part.focus || 88));
    }

    cameraAnimation = {
      start: performance.now(),
      duration: 820,
      fromPosition: camera.position.clone(),
      toPosition: destination,
      fromTarget: controls.target.clone(),
      toTarget: target
    };
  }

  function resetView(resume = true) {
    cameraAnimation = {
      start: performance.now(),
      duration: 680,
      fromPosition: camera.position.clone(),
      toPosition: new THREE.Vector3(245, 170, 265),
      fromTarget: controls.target.clone(),
      toTarget: new THREE.Vector3(0, 22, 0)
    };
    if (resume) controls.autoRotate = true;
  }

  // The single toolbar is the one already present in index.html. Do not add
  // another toolbar inside the canvas host.
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
      const show = Boolean(event.detail?.show);
      setInternals(show);
      if (show) {
        focusPart('mcu');
      } else {
        resetView(false);
      }
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
