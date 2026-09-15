import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js';

const canvas = document.getElementById('car3d');
if (!canvas) throw new Error('3D showroom canvas not found');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080b0f);
scene.fog = new THREE.Fog(0x080b0f, 9, 24);

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(6.8, 3.2, 7.6);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 11;
controls.minPolarAngle = 0.72;
controls.maxPolarAngle = 1.42;
controls.target.set(0, 0.95, 0);

const showroom = new THREE.Group();
scene.add(showroom);

const hemi = new THREE.HemisphereLight(0xddeeff, 0x080a0d, 2.1);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xfff1d1, 4.5);
key.position.set(5, 8, 5);
scene.add(key);
const rim = new THREE.DirectionalLight(0x8eb8ff, 3.2);
rim.position.set(-6, 4, -5);
scene.add(rim);
const fill = new THREE.PointLight(0xd8a34a, 2.5, 12);
fill.position.set(2, 2.5, 4);
scene.add(fill);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(10, 64),
  new THREE.MeshStandardMaterial({ color: 0x0c1015, metalness: 0.35, roughness: 0.72 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.03;
scene.add(floor);

const ring = new THREE.Mesh(
  new THREE.RingGeometry(3.7, 3.75, 96),
  new THREE.MeshBasicMaterial({ color: 0xd8a34a, transparent: true, opacity: 0.32, side: THREE.DoubleSide })
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.01;
scene.add(ring);

const materials = {
  black: new THREE.MeshPhysicalMaterial({ color: 0x111419, metalness: 0.78, roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.12 }),
  white: new THREE.MeshPhysicalMaterial({ color: 0xe7e8e8, metalness: 0.65, roughness: 0.22, clearcoat: 0.75 }),
  red: new THREE.MeshPhysicalMaterial({ color: 0x8d1820, metalness: 0.7, roughness: 0.2, clearcoat: 0.85 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x111a25, metalness: 0.1, roughness: 0.08, transmission: 0.08, transparent: true, opacity: 0.9 }),
  tire: new THREE.MeshStandardMaterial({ color: 0x050607, metalness: 0.05, roughness: 0.78 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xc9cdd2, metalness: 0.95, roughness: 0.18 }),
  light: new THREE.MeshBasicMaterial({ color: 0xffe7aa })
};

let paint = materials.black;
const car = new THREE.Group();
showroom.add(car);

function box(name, size, pos, material, bevel = 0) {
  const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = name;
  mesh.position.set(pos.x, pos.y, pos.z);
  car.add(mesh);
  return mesh;
}

function wheel(x, z) {
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.34, 32), materials.tire);
  tire.rotation.z = Math.PI / 2;
  tire.position.set(x, 0.55, z);
  car.add(tire);
  const rimMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.36, 24), materials.chrome);
  rimMesh.rotation.z = Math.PI / 2;
  rimMesh.position.set(x, 0.55, z);
  car.add(rimMesh);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.39, 16), materials.tire);
  hub.rotation.z = Math.PI / 2;
  hub.position.set(x, 0.55, z);
  car.add(hub);
}

function buildCar() {
  box('lower-body', { x: 3.8, y: 0.72, z: 1.8 }, { x: 0, y: 0.78, z: 0 }, paint);
  box('hood', { x: 1.18, y: 0.22, z: 1.72 }, { x: 1.28, y: 1.18, z: 0 }, paint);
  box('rear-deck', { x: 0.9, y: 0.24, z: 1.72 }, { x: -1.42, y: 1.14, z: 0 }, paint);
  box('cabin', { x: 2.05, y: 0.72, z: 1.58 }, { x: -0.2, y: 1.55, z: 0 }, materials.glass);
  box('roof', { x: 1.5, y: 0.14, z: 1.45 }, { x: -0.18, y: 1.94, z: 0 }, paint);
  box('front-bumper', { x: 0.22, y: 0.48, z: 1.82 }, { x: 1.94, y: 0.7, z: 0 }, paint);

  const grille = box('grille', { x: 0.03, y: 0.28, z: 0.86 }, { x: 2.06, y: 0.78, z: 0 }, materials.tire);
  grille.rotation.y = 0;

  [-0.67, 0.67].forEach(z => {
    const lamp = box('headlamp', { x: 0.05, y: 0.13, z: 0.38 }, { x: 2.075, y: 1.05, z }, materials.light);
    lamp.rotation.y = 0;
  });

  [-0.86, 0.86].forEach(z => wheel(1.25, z));
  [-0.86, 0.86].forEach(z => wheel(-1.25, z));

  const accent = box('side-accent', { x: 2.5, y: 0.045, z: 0.035 }, { x: 0, y: 0.92, z: 0.91 }, new THREE.MeshBasicMaterial({ color: 0xd8a34a }));
  accent.rotation.y = 0;
}

buildCar();

function setPaint(material) {
  paint = material;
  car.traverse(obj => {
    if (obj.isMesh && ['lower-body', 'hood', 'rear-deck', 'roof', 'front-bumper'].includes(obj.name)) obj.material = paint;
  });
}

document.querySelectorAll('[data-car-color]').forEach(button => {
  button.addEventListener('click', () => {
    const value = button.dataset.carColor;
    setPaint(materials[value]);
    document.querySelectorAll('[data-car-color]').forEach(b => b.classList.toggle('active', b === button));
  });
});

document.getElementById('reset3d')?.addEventListener('click', () => {
  camera.position.set(6.8, 3.2, 7.6);
  controls.target.set(0, 0.95, 0);
  controls.update();
});

function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const width = Math.max(280, rect.width);
  const height = Math.max(360, rect.height);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

let t = 0;
function animate() {
  requestAnimationFrame(animate);
  t += 0.005;
  ring.rotation.z += 0.0015;
  fill.intensity = 2.25 + Math.sin(t * 2) * 0.18;
  controls.update();
  renderer.render(scene, camera);
}
animate();
