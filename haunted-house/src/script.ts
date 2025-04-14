import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Timer } from "three/addons/misc/Timer.js";
import GUI from "lil-gui";
import { house, floor, bushes, graves, ghosts } from "./textures";
/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;

// Scene
const scene = new three.Scene();
scene.add(new three.AxesHelper(5));

// Textures
scene.add(house, floor, ...bushes, graves);
gui
  .add(floor.material, "displacementScale", 0, 1, 0.001)
  .name("Floor Display Scale");
gui
  .add(floor.material, "displacementBias", -1, 1, 0.001)
  .name("Floor Display Bias");

/**
 * Lights
 */
// Ambient light
const ambientLight = new three.AmbientLight("#86cdff", 0.3);
scene.add(ambientLight);

// Directional light
const directionalLight = new three.DirectionalLight("#86cdff", 1.5);
directionalLight.position.set(4, 5, -8);
const directionalLightHelper = new three.DirectionalLightHelper(
  directionalLight
);
scene.add(directionalLight);

const [ghost1, ghost2, ghost3] = ghosts;
scene.add(ghost1, ghost2, ghost3);

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
camera.position.x = 8;
camera.position.y = 2;
camera.position.z = 10;
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

  const ghostAngle = elapsedTime / 2;
  ghost1.position.set(
    Math.sin(ghostAngle) * 4.5,
    Math.cos(ghostAngle * 2) / Math.cos(ghostAngle / 3), // randomized popping above y axis
    Math.cos(ghostAngle) * 4.5
  );

  const ghostAngle2 = elapsedTime * 0.4;
  ghost2.position.set(
    Math.cos(ghostAngle) * 8,
    (Math.sin(ghostAngle) / Math.sin(ghostAngle * 2.77)) *
      Math.sin(ghostAngle * 4.533),
    Math.sin(ghostAngle) * 8
  );

  ghost3.position.set(
    Math.sin(ghostAngle2) * 10,
    (Math.sin(ghostAngle2) / Math.sin(ghostAngle2 * 2.77)) *
      Math.sin(ghostAngle2 * 4.533),
    Math.cos(ghostAngle2) * 10
  );

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
