import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import { createGeometry } from "./utils";
import RAPIER from "@dimforge/rapier3d-compat";

console.log(RAPIER);

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;

// Scene
const scene = new three.Scene();

/**
 * Textures
 */
const textureLoader = new three.TextureLoader();
const textureMap = {};

/**
 * Light
 */

const ambientLight = new three.AmbientLight(0xffffff, 2.1);
scene.add(ambientLight);

const directionalLight = new three.DirectionalLight("#ffffff", 2);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
scene.add(directionalLight);

/**
 * Meshes
 */
const cube = createGeometry("box", [0, 1.5, 0]);
const cone = createGeometry("cone", [-2, 1, -2]);
const sphere = createGeometry("sphere", [2, 1, 0]);

const floorGeometry = new three.PlaneGeometry(15, 15);
const floorMaterial = new three.MeshStandardMaterial({
  color: "#777777",
  metalness: 0.3,
  roughness: 0.4,
  envMapIntensity: 0.5,
  side: three.DoubleSide,
});

// forgot standard material needs lighting
const floor = new three.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(cube, cone, sphere, floor);

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
const camera = new three.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(3, 3, 3);
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

// always forget about this with shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = three.PCFSoftShadowMap;

/**
 * Animate
 */
const clock = new three.Clock();

const tick = (): void => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
