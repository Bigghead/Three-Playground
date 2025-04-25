import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

/**
 * Base
 */
// Debug
const gui = new GUI();
const guiObj: Record<string, any> = {
  count: 50000, // how many particles
  size: 0.02, // how big are each
  radius: 8, // how long are the branches
  branches: 3, // bruh
  spin: 2, // how bent are the branches
  axisRange: 0.5, // how close to the y axis center line are the particles positioned
  randomnessPower: 5, // ^ kinda related but how random particles are placed from center line
  centerColor: "#ff88cc",
  branchEndColor: "#88ffb3",
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
// scene.add(cube);
// scene.add(new three.AxesHelper(5));

/**
 * Particles
 */

// Need to keep a reference to check if these are empty before calling lil-gui re-render
// Otherwise lil-gui will create new particles inside the onFinishChange
let particleGeometry: three.BufferGeometry | null = null;
let particleMaterial: three.Material | null = null;
let particleMesh: three.Points | null = null;

const generateRandomParticles = (): void => {
  const { count, size } = guiObj;
  particleGeometry = new three.BufferGeometry();
  particleMaterial = new three.PointsMaterial({
    size,
    alphaMap: textureMap.star,
    color: "#ffffff",
    transparent: true,
    alphaTest: 0.001,
    depthWrite: false,
  });

  const vertices: number[] = [];

  for (let i = 0; i <= count; i++) {
    const x = three.MathUtils.randFloatSpread(500);
    const y = three.MathUtils.randFloatSpread(500);
    const z = three.MathUtils.randFloatSpread(500);

    vertices.push(x, y, z);
  }
  particleGeometry.setAttribute(
    "position",
    new three.Float32BufferAttribute(vertices, 3)
  );
  scene.add(new three.Points(particleGeometry, particleMaterial));
};
generateRandomParticles();

const generateGalaxy = (): void => {
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
    centerColor,
    branchEndColor,
  } = guiObj;

  particleGeometry = new three.BufferGeometry();
  particleMaterial = new three.PointsMaterial({
    size,
    alphaMap: textureMap.star,

    // small ( maybe kinda big ) gotcha, can't set global color if using vertexColors
    // color: centerColor,
    transparent: true,
    alphaTest: 0.001,
    depthWrite: false,
    blending: three.AdditiveBlending, // particles that overlap get brighter in colors. Cool but performance hit
    vertexColors: true,
  });
  const vertices: number[] = [];
  const vertexColors: number[] = [];

  const randomOffset = (): number =>
    Math.pow(Math.random(), randomness) *
    (Math.random() < 0.5 ? 1 : -1) *
    axisRange;

  // We're gonna "mix" 2 colors using lerp https://threejs.org/docs/#api/en/math/Color.lerp
  const insideColor = new three.Color(centerColor);
  const outsideColor = new three.Color(branchEndColor);

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

    // goes from one color, takes an argument of another color and a number from 0 - 1, where 0 is original color and 1 is the 2nd color
    // 0.5 is a perfect mix of both colors
    const mixedColors = insideColor
      .clone()
      .lerp(outsideColor, branchAngle / radius);

    vertexColors[i * 3] = mixedColors.r;
    vertexColors[i * 3 + 1] = mixedColors.g;
    vertexColors[i * 3 + 2] = mixedColors.b;
  }

  // copy vertex array into float32array that threejs will accept
  const typedVertices = new Float32Array(vertices);
  particleGeometry.setAttribute(
    "position",
    new three.BufferAttribute(typedVertices, 3)
  );
  particleGeometry.setAttribute(
    "color",
    new three.BufferAttribute(new Float32Array(vertexColors), 3)
  );
  particleMesh = new three.Points(particleGeometry, particleMaterial);

  scene.add(particleMesh);
};
generateGalaxy();

gui.add(guiObj, "count", 100, 100000, 100).onFinishChange(generateGalaxy);
gui.add(guiObj, "size", 0.001, 0.2, 0.001).onFinishChange(generateGalaxy);
gui.add(guiObj, "radius", 0.02, 20, 0.02).onFinishChange(generateGalaxy);
gui.add(guiObj, "branches", 1, 15, 1).onFinishChange(generateGalaxy);
gui.add(guiObj, "axisRange", 0, 2, 0.001).onFinishChange(generateGalaxy);
gui.add(guiObj, "randomnessPower", 1, 10, 0.001).onFinishChange(generateGalaxy);
gui.addColor(guiObj, "centerColor").onFinishChange(generateGalaxy);
gui.addColor(guiObj, "branchEndColor").onFinishChange(generateGalaxy);

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
