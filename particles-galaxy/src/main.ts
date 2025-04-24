import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

/**
 * Base
 */
// Debug
const gui = new GUI();
const guiObj: Record<string, any> = {
  count: 1000,
  size: 0.02,
};

// Canvas
const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;

// Scene
const scene = new three.Scene();

/**
 * Textures
 */
const textureLoader = new three.TextureLoader();
const textureMap = {
  star: textureLoader.load("/particles/1.png"),
};

/**
 * Test cube
 */
const cube: three.Mesh<three.BoxGeometry, three.MeshBasicMaterial> =
  new three.Mesh(new three.BoxGeometry(1, 1, 1), new three.MeshBasicMaterial());
scene.add(cube);

/**
 * Particles
 */

// Need to keep a reference to check if these are empty before calling lil-gui re-render
// Otherwise lil-gui will create new particles inside the onFinishChange
let particleGeometry: three.BufferGeometry | null = null;
let particleMaterial: three.Material | null = null;
let particleMesh: three.Points | null = null;

const generateRandomParticles = (): void => {
  // remove all previously generated particles if exists
  if (particleMesh !== null) {
    particleGeometry?.dispose();
    particleMaterial?.dispose();
    scene.remove(particleMesh);
  }
  particleGeometry = new three.BufferGeometry();
  particleMaterial = new three.PointsMaterial({
    size: guiObj.size,
    alphaMap: textureMap.star,
    color: "#ff88cc",
    transparent: true,
    alphaTest: 0.001,
    depthWrite: false,
    // vertexColors: true,
  });
  const vertices = [];
  const axisRange = 50;
  for (let i = 0; i < guiObj.count * 3; i++) {
    vertices[i] = three.MathUtils.randFloatSpread(axisRange);
  }

  // copy vertex array into float32array that threejs will accept
  const typedVertices = new Float32Array(vertices);
  particleGeometry.setAttribute(
    "position",
    new three.BufferAttribute(typedVertices, 3)
  );
  particleMesh = new three.Points(particleGeometry, particleMaterial);
  scene.add(particleMesh);
};
generateRandomParticles();

gui
  .add(guiObj, "count", 100, 100000, 100)
  .onFinishChange(generateRandomParticles);
gui
  .add(guiObj, "size", 0.001, 0.2, 0.001)
  .onFinishChange(generateRandomParticles);

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
