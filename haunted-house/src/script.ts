import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Timer } from "three/addons/misc/Timer.js";
import { Sky } from "three/examples/jsm/Addons.js";
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

// Textures
scene.add(house, floor, ...bushes, graves);

/**
 * Lights
 */
// Ambient light
const ambientLight = new three.AmbientLight("#86cdff", 0.2);
scene.add(ambientLight);

// Directional light
const directionalLight = new three.DirectionalLight("#86cdff", 3);
directionalLight.position.set(4, 5, -8);
const directionalLightHelper = new three.DirectionalLightHelper(
  directionalLight
);
scene.add(directionalLight);
gui.add(directionalLight, "intensity", 1, 8, 0.5).name("Light Intensity");

const [ghost1, ghost2, ghost3, ghost4] = ghosts;
scene.add(ghost1, ghost2, ghost3, ghost4);

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
camera.position.y = 3.5;
camera.position.z = 8.5;
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
 * Shadows
 */
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = three.PCFSoftShadowMap;
directionalLight.castShadow = true;
ghost1.castShadow = true;
ghost2.castShadow = true;
ghost3.castShadow = true;

for (const grave of graves.children) {
  grave.castShadow = true;
  grave.receiveShadow = true;
}
floor.receiveShadow = true;

// Light mapping for shadow performance improvements

// Vector2 defining the width and height of the shadow map.
// Higher values give better quality shadows at the cost of computation time.

const {
  shadow: { mapSize, camera: lightCamera },
} = directionalLight;
mapSize.width = 256;
mapSize.height = 256;
Object.assign(lightCamera, {
  top: 8,
  right: 8,
  bottom: -8,
  left: -8,
  // how far the camera shadow mapping can see
  near: 1,
  far: 20,
});

for (const ghost of ghosts) {
  ghost.shadow.mapSize.width = 256;
  ghost.shadow.mapSize.height = 256;
  ghost.shadow.camera.far = 20;
}

console.log(house.children);

/**
 * Sky
 */
// Example code from threejs demo:
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_shaders_sky.html
const sky = new Sky();
const {
  material: { uniforms },
} = sky;
uniforms["turbidity"].value = 10;
uniforms["rayleigh"].value = 3;
uniforms["mieCoefficient"].value = 0.005;
uniforms["mieDirectionalG"].value = 0.7;
uniforms["sunPosition"].value.set(-0.5, -0.038, -1.2);

// the sky is a box
sky.scale.set(100, 100, 100);
scene.add(sky);
gui.add(uniforms.turbidity, "value", -20, 40, 5).name("Sky Turbidity");
const skyPosition = gui.addFolder(" Sky Position");
skyPosition.add(uniforms.sunPosition.value, "x", -2, 5, 0.1);
skyPosition.add(uniforms.sunPosition.value, "z", -5, 5, 0.1);

// fog is easier
scene.fog = new three.Fog("#02343f", 2, 20);

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
    Math.sin(ghostAngle) * 3.5,
    Math.cos(ghostAngle * 2) / Math.cos(ghostAngle / 3), // randomized popping above y axis
    Math.cos(ghostAngle) * 4.5
  );

  const ghostAngle2 = elapsedTime * 0.4;
  ghost2.position.set(
    Math.cos(ghostAngle) * 5,
    (Math.sin(ghostAngle) / Math.sin(ghostAngle * 2.77)) *
      Math.sin(ghostAngle * 4.533),
    Math.sin(ghostAngle) * 8
  );

  ghost3.position.set(
    Math.sin(ghostAngle2) * 7,
    (Math.sin(ghostAngle2) / Math.sin(ghostAngle2 * 2.77)) *
      Math.sin(ghostAngle2 * 4.533),
    Math.cos(ghostAngle2) * 10
  );

  const ghostAngle3 = elapsedTime * 0.62;
  ghost4.position.set(
    Math.cos(ghostAngle3) * 8.5,
    (Math.cos(ghostAngle3) / Math.sin(ghostAngle2 * 4.98)) *
      Math.cos(ghostAngle3 * 1.6),
    Math.sin(ghostAngle3) * 8.5
  );
  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
