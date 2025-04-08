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
scene.add(new three.AxesHelper(5));

// Textures
const textureLoader = new three.TextureLoader();
const textureMaps = {
  floor: textureLoader.load("/floor/alpha.jpg"),
  coast_land: textureLoader.load("/floor/coast_land.jpg"),
  coast_land_normal: textureLoader.load("/floor/coast_land_normal.png"),
  mud_cracked_normal: textureLoader.load("/floor/mud_cracked-min.png"),
};
textureMaps.coast_land.colorSpace = three.SRGBColorSpace;

/**
 * House
 */
// Temporary sphere
// const sphere = new three.Mesh(
//   new three.SphereGeometry(1, 32, 32),
//   new three.MeshStandardMaterial({ roughness: 0.7 })
// );

const house = new three.Group();
const houseMaterial = new three.MeshStandardMaterial();

const walls = new three.Mesh(new three.BoxGeometry(4, 2.5, 4), houseMaterial);
// centered at x-axis, move the y up by half the height of the geometry
walls.position.y = 2.5 / 2;

const roof = new three.Mesh(new three.ConeGeometry(3.5, 1.5, 4), houseMaterial);
// half of height of walls + walls position y ( walls height ) offset + height of roof
// 2.5 + 2 + 2.5
roof.position.y = (2.5 + 2.5 + 1.5) / 2;
roof.rotation.y = Math.PI / 4;

house.add(walls, roof);

// const floorGeometry = new three.PlaneGeometry(50, 50);
// floorGeometry.rotateX(-Math.PI / 2);
const floor = new three.Mesh(
  new three.PlaneGeometry(50, 50),
  new three.MeshStandardMaterial({
    color: "white",
    side: three.DoubleSide,
    alphaMap: textureMaps.floor,
    map: textureMaps.coast_land,
    normalMap: textureMaps.mud_cracked_normal,
    alphaTest: 0.5,
  })
);
// floor.position.set(0, -1, 0);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;

scene.add(house, floor);

/**
 * Lights
 */
// Ambient light
const ambientLight = new three.AmbientLight("#ffffff", 0.5);
scene.add(ambientLight);

// Directional light
const directionalLight = new three.DirectionalLight("#ffffff", 3);
directionalLight.position.set(3, 2, -8);
const directionalLightHelper = new three.DirectionalLightHelper(
  directionalLight
);
scene.add(directionalLight, directionalLightHelper);

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
