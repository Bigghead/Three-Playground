import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Timer } from "three/addons/misc/Timer.js";
import GUI from "lil-gui";

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;

// Scene
const scene = new three.Scene();

// Textures
const textureLoader = new three.TextureLoader();
const textureMaps = {
  floor: textureLoader.load("/floor/alpha.jpg"),
  coast_land: textureLoader.load("/floor/coast_land.jpg"),
  coast_land_normal: textureLoader.load("/floor/coast_land_normal.jpg"),
};
textureMaps.coast_land.colorSpace = three.SRGBColorSpace;

/**
 * House
 */
// Temporary sphere
const sphere = new three.Mesh(
  new three.SphereGeometry(1, 32, 32),
  new three.MeshStandardMaterial({ roughness: 0.7 })
);

const floor = new three.Mesh(
  new three.PlaneGeometry(50, 50),
  new three.MeshStandardMaterial({
    color: "white",
    side: three.DoubleSide,
    alphaMap: textureMaps.floor,
    map: textureMaps.coast_land,
    normalMap: textureMaps.coast_land_normal,
  })
);
floor.position.set(0, -1, 0);
floor.rotation.x = Math.PI / 2;
floor.receiveShadow = true;
scene.add(sphere, floor);

/**
 * Lights
 */
// Ambient light
const ambientLight = new three.AmbientLight("#ffffff", 0.5);
scene.add(ambientLight);

// Directional light
const directionalLight = new three.DirectionalLight("#ffffff", 1.5);
directionalLight.position.set(3, 2, -8);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new three.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 5;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new three.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const timer = new Timer();

const tick = () => {
  // Timer
  timer.update();
  const elapsedTime = timer.getElapsed();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
