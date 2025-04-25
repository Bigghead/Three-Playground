import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

/**
 * Base
 */
// Debug
const gui = new GUI();
const guiObj: Record<string, any> = {
  count: 10000,
  size: 0.02,
  radius: 5,
  branches: 3,
  spin: 0.25,
  axisRange: 1,
  randomnessPower: 2,
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
scene.add(new three.AxesHelper(5));

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

  const {
    count,
    size,
    radius,
    branches,
    spin,
    axisRange,
    randomnessPower: randomness,
  } = guiObj;

  particleGeometry = new three.BufferGeometry();
  particleMaterial = new three.PointsMaterial({
    size,
    alphaMap: textureMap.star,
    color: "#ff88cc",
    transparent: true,
    alphaTest: 0.001,
    depthWrite: false,
    // vertexColors: true,
  });
  const vertices = [];
  const randomOffset = (): number =>
    Math.pow(Math.random(), randomness) *
    (Math.random() < 0.5 ? 1 : -1) *
    axisRange;

  for (let i = 0; i < count; i++) {
    const branchRadius = Math.random() * radius;

    // branchAngle gives an angle that corresponds to a position in a circle for each branch
    // this is also how each branch are split equally inside the circle
    const branchAngle = ((i % branches) / branches) * Math.PI * 2;
    const spinAngle = branchRadius * spin;

    // how far away from the axis we plot the vertex on
    const randomX = randomOffset();
    const randomY = randomOffset();
    const randomZ = randomOffset();

    // x axis
    vertices[i * 3] =
      Math.cos(branchAngle + spinAngle) * branchRadius + randomX;
    // y axis
    vertices[i * 3 + 1] = randomY;
    // z axis
    vertices[i * 3 + 2] =
      Math.sin(branchAngle + spinAngle) * branchRadius + randomZ;
  }

  // copy vertex array into float32array that threejs will accept
  const typedVertices = new Float32Array(vertices);
  particleGeometry.setAttribute(
    "position",
    new three.BufferAttribute(typedVertices, 3)
  );
  particleMesh = new three.Points(particleGeometry, particleMaterial);
  console.log(particleMesh.position);

  scene.add(particleMesh);
};
generateRandomParticles();

gui
  .add(guiObj, "count", 100, 100000, 100)
  .onFinishChange(generateRandomParticles);
gui
  .add(guiObj, "size", 0.001, 0.2, 0.001)
  .onFinishChange(generateRandomParticles);
gui
  .add(guiObj, "radius", 0.02, 20, 0.02)
  .onFinishChange(generateRandomParticles);
gui.add(guiObj, "branches", 1, 15, 1).onFinishChange(generateRandomParticles);
gui.add(guiObj, "spin", -5, 5, 0.001).onFinishChange(generateRandomParticles);
gui
  .add(guiObj, "axisRange", 0, 2, 0.001)
  .onFinishChange(generateRandomParticles);
gui
  .add(guiObj, "randomnessPower", 1, 10, 0.001)
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
camera.position.set(3, 5, 8);
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
