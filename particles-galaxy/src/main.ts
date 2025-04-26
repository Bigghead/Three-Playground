import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 300 });
const guiObj: Record<string, any> = {
  count: 50000, // how many particles
  size: 0.02, // how big are each
  radius: 8, // how long are the branches
  branches: 3, // bruh
  spin: 2, // how bent are the branches
  axisRange: 0.5, // how close to the y axis center line are the particles positioned
  randomnessPower: 5, // ^ kinda related but how random particles are placed from center line
  centerColor: "#ff3c30",
  branchEndColor: "#68c3d9",
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
 * Particles
 */

// Need to keep a reference to check if these are empty before calling lil-gui re-render
// Otherwise lil-gui will create new particles inside the onFinishChange
type ParticleMesh = {
  particleGeometry: three.BufferGeometry;
  particleMaterial: three.Material;
  mesh: three.Points;
};
let particleMeshes: Record<string, ParticleMesh> = {};

const GALAXY_MAIN = "galaxy-main";
const GALAXY = "galaxy";
const RANDOM_PARTICLES = "random-particles";

/**
 * Generates a new particle system (random particles or galaxy) and optionally replaces the main galaxy.
 *
 * This function creates and returns a `THREE.Points` mesh based on the provided options.
 * If the type is `"galaxy-main"`, it disposes of and removes any previously created galaxy with that ID.
 * The returned mesh includes vertex positions and, for galaxies, per-vertex colors to create gradient effects.
 *
 * @param {Object} options - GuiObject params
 */
// Todo - Refactor, cause oh boi
const generateParticles = (options: {
  type: typeof GALAXY_MAIN | typeof GALAXY | typeof RANDOM_PARTICLES; // Allows to choose between random or galaxy
  count: number;
  size: number;
  radius?: number;
  branches?: number;
  spin?: number;
  axisRange?: number;
  randomnessPower?: number;
  centerColor?: string;
  branchEndColor?: string;
}): three.Points => {
  const { type, count, size } = options;
  // remove all previously generated particles if exists
  if (type === GALAXY_MAIN && particleMeshes["galaxy-main"]) {
    const { particleGeometry, particleMaterial, mesh } =
      particleMeshes["galaxy-main"];
    particleGeometry?.dispose();
    particleMaterial?.dispose();
    scene.remove(mesh);
    delete particleMeshes[GALAXY_MAIN];
  }

  const isGalaxy = type === GALAXY || type === GALAXY_MAIN;
  const particleGeometry = new three.BufferGeometry();
  const particleMaterial = new three.PointsMaterial({
    size,
    alphaMap: textureMap.star,

    // small ( maybe kinda big ) gotcha, can't set global color if using vertexColors for galaxy
    // color: centerColor,
    transparent: true,
    alphaTest: 0.001,
    depthWrite: false,
    vertexColors: isGalaxy,
  });

  const vertices: number[] = [];
  const vertexColors: number[] = [];

  if (!isGalaxy) {
    for (let i = 0; i <= count; i++) {
      const x = three.MathUtils.randFloatSpread(500);
      const y = three.MathUtils.randFloatSpread(500);
      const z = three.MathUtils.randFloatSpread(500);

      vertices.push(x, y, z);
    }
  }

  if (isGalaxy) {
    const {
      radius,
      branches,
      spin,
      axisRange,
      randomnessPower: randomness,
      centerColor,
      branchEndColor,
    } = options;

    // We're gonna "mix" 2 colors using lerp https://threejs.org/docs/#api/en/math/Color.lerp
    const insideColor = new three.Color(centerColor);
    const outsideColor = new three.Color(branchEndColor);

    const randomOffset = (): number =>
      Math.pow(Math.random(), randomness ?? 1) *
      (Math.random() < 0.5 ? 1 : -1) *
      (axisRange ?? 100);

    for (let i = 0; i < count; i++) {
      const branchRadius = Math.random() * radius!;

      // branchAngle gives an angle that corresponds to a position in a circle for each branch
      // this is also how each branch are split equally inside the circle
      const branchAngle = ((i % branches!) / branches!) * Math.PI * 2;
      const spinAngle = branchRadius * spin!;

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
        .lerp(outsideColor, branchRadius / radius!);

      vertexColors[i * 3] = mixedColors.r;
      vertexColors[i * 3 + 1] = mixedColors.g;
      vertexColors[i * 3 + 2] = mixedColors.b;
    }
  }
  particleGeometry.setAttribute(
    "position",
    new three.Float32BufferAttribute(vertices, 3)
  );

  if (!isGalaxy) {
    // typescript fix, the material doesnt have direct color poperty
    (particleMaterial as three.PointsMaterial).color.set("#ffffff");
  }

  if (isGalaxy) {
    particleMaterial.blending = three.AdditiveBlending; // particles that overlap get brighter in colors. Cool but performance hit
    particleGeometry.setAttribute(
      "color",
      new three.BufferAttribute(new Float32Array(vertexColors), 3)
    );
  }
  const particleMesh = new three.Points(particleGeometry, particleMaterial);

  if (type === GALAXY_MAIN) {
    particleMeshes["galaxy-main"] = {
      particleGeometry: particleGeometry,
      particleMaterial: particleMaterial,
      mesh: particleMesh,
    };
  }

  return particleMesh;
};

const generateGalaxy = (): three.Points => {
  return generateParticles({
    type: GALAXY_MAIN,
    count: guiObj.count,
    size: guiObj.size,
    ...guiObj,
  });
};
const stars = generateParticles({
  ...guiObj,
  type: RANDOM_PARTICLES,
  count: guiObj.count,
  size: guiObj.size,
});
const galaxy = generateGalaxy();

const galaxy2 = generateParticles({
  ...guiObj,
  type: GALAXY,
  count: 10000,
  size: guiObj.size,
  centerColor: "#ff88cc",
  branchEndColor: "#88ffb3",
  radius: 10,
});
galaxy2.position.set(-75, -15, -30);

scene.add(stars, galaxy, galaxy2);

const guiUpdateFinishChange = (): void => {
  scene.add(generateGalaxy());
};

gui
  .add(guiObj, "count", 100, 100000, 100)
  .name("Particle Count")
  .onFinishChange(guiUpdateFinishChange);
gui
  .add(guiObj, "size", 0.001, 0.2, 0.001)
  .name("Galaxy Size")
  .onFinishChange(guiUpdateFinishChange);
gui
  .add(guiObj, "radius", 0.02, 20, 0.02)
  .name("Galaxy Radius")
  .onFinishChange(guiUpdateFinishChange);
gui
  .add(guiObj, "branches", 1, 15, 1)
  .name("Galaxy Radius")
  .onFinishChange(guiUpdateFinishChange);
gui
  .add(guiObj, "axisRange", 0, 2, 0.001)
  .name("Axis Range")
  .onFinishChange(guiUpdateFinishChange);
gui
  .add(guiObj, "randomnessPower", 1, 10, 0.001)
  .name("Galaxy Star Randomness")
  .onFinishChange(guiUpdateFinishChange);
gui
  .addColor(guiObj, "centerColor")
  .name("Center Color")
  .onFinishChange(guiUpdateFinishChange);
gui
  .addColor(guiObj, "branchEndColor")
  .name("Branch End Color")
  .onFinishChange(guiUpdateFinishChange);

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
camera.position.set(3, 2.5, 5);
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

  // Spinny bois
  galaxy.rotation.y = elapsedTime * 0.008;
  stars.rotation.y = elapsedTime * 0.005;
  stars.rotation.x = elapsedTime * 0.005;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
