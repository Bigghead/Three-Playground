import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

/**
 * Base
 */
// Debug
const gui = new GUI();
const guiObj: Record<string, unknown> = {
  count: 1000,
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
const generateRandomParticles = (count: number): three.Points => {
  const geometry = new three.BufferGeometry();
  const material = new three.PointsMaterial({
    size: 0.1,
    alphaMap: textureMap.star,
    color: "#ff88cc",
    transparent: true,
    alphaTest: 0.001,
    depthWrite: false,
    // vertexColors: true,
  });
  const vertices = [];
  const axisRange = 50;
  for (let i = 0; i < count * 3; i++) {
    vertices[i] = three.MathUtils.randFloatSpread(axisRange);
  }

  // copy vertex array into float32array that threejs will accept
  const typedVertices = new Float32Array(vertices);
  geometry.setAttribute(
    "position",
    new three.BufferAttribute(typedVertices, 3)
  );

  return new three.Points(geometry, material);
};
scene.add(generateRandomParticles(500));

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
