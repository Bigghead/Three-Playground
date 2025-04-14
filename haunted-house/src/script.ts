import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Timer } from "three/addons/misc/Timer.js";
import GUI from "lil-gui";
import { createBushes, createGraves, loadTexture } from "./utils";

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
const textureMap = {
  floorAlpha: loadTexture({
    path: "floor/alpha.jpg",
  }),
  floor: loadTexture({
    path: "floor/brown_mud_leaves_01_1k/brown_mud_leaves_01_diff_1k.jpg",
    repeat: [8, 8],
    wrap: true,
    colorSpace: three.SRGBColorSpace,
  }),
  floorDisp: loadTexture({
    path: "floor/brown_mud_leaves_01_1k/brown_mud_leaves_01_disp_1k.jpg",
  }),
  floorNormal: loadTexture({
    path: "floor/brown_mud_leaves_01_1k/brown_mud_leaves_01_nor_dx_1k.jpg",
  }),
  floorARM: loadTexture({
    path: "floor/brown_mud_leaves_01_1k/brown_mud_leaves_01_arm_1k.jpg",
  }),
  doorTexture: loadTexture({
    path: "/door/color.jpg",
    colorSpace: three.SRGBColorSpace,
  }),
  doorNormal: loadTexture({
    path: "/door/normal.jpg",
  }),
  doorAO: loadTexture({
    path: "/door/ambientOcclusion.jpg",
  }),
  wallTexture: loadTexture({
    path: "/textures/mixed_brick_wall.jpg",
  }),
  wallNormal: loadTexture({
    path: "/textures/mixed_brick_wall_normal.png",
  }),
  wallARM: loadTexture({
    path: "/textures/castle_brick_arm.png",
  }),
  roofTexture: loadTexture({
    path: "/textures/herringbone_pavement.png",
    colorSpace: three.SRGBColorSpace,
  }),
  bush: loadTexture({
    path: "/bush/leaves_forest_ground_diff_1k.webp",
    colorSpace: three.SRGBColorSpace,
  }),
  bushARM: loadTexture({
    path: "/bush/leaves_forest_ground_arm_1k.webp",
  }),
  bushNormal: loadTexture({
    path: "/bush/leaves_forest_ground_nor_gl_1k.webp",
  }),
  plaster: loadTexture({
    path: "/grave/plastered_stone_wall_diff_1k.webp",
    colorSpace: three.SRGBColorSpace,
  }),
  plasterNormal: loadTexture({
    path: "/grave/plastered_stone_wall_nor_gl_1k.webp",
  }),
  plasterARM: loadTexture({
    path: "/grave/plastered_stone_wall_arm_1k.webp",
  }),
};

/**
 * House
 */
// Temporary sphere
// const sphere = new three.Mesh(
//   new three.SphereGeometry(1, 32, 32),
//   new three.MeshStandardMaterial({ roughness: 0.7 })
// );

const house = new three.Group();

const walls = new three.Mesh(
  new three.BoxGeometry(4, 2.5, 4),
  new three.MeshStandardMaterial({
    color: "#C4A484",
    map: textureMap.wallTexture,
    normalMap: textureMap.wallNormal,
    metalnessMap: textureMap.wallARM,
    roughnessMap: textureMap.wallARM,
  })
);
// centered at x-axis, move the y up by half the height of the geometry
walls.position.y = 2.5 / 2;

const roof = new three.Mesh(
  new three.ConeGeometry(3.5, 1.5, 4),
  new three.MeshStandardMaterial({
    color: "brown",
    map: textureMap.roofTexture,
  })
);
// half of height of walls + walls position y ( walls height ) offset + height of roof
// 2.5 + 2 + 2.5
roof.position.y = (2.5 + 2.5 + 1.5) / 2;
roof.rotation.y = Math.PI / 4;

const door = new three.Mesh(
  new three.PlaneGeometry(1.5, 2),
  new three.MeshStandardMaterial({
    // color: "red",
    side: three.DoubleSide,
    map: textureMap.doorTexture,
    normalMap: textureMap.doorNormal,
    aoMap: textureMap.doorAO,
  })
);
// door.rotation.y = Math.PI;
door.position.set(0.01, 1 + 0.01, 4 / 2 + 0.01);
house.add(walls, roof, door);

// const floorGeometry = new three.PlaneGeometry(50, 50);
// floorGeometry.rotateX(-Math.PI / 2);
const floor = new three.Mesh(
  // add more faces on the plane / floor to see displacement
  new three.PlaneGeometry(50, 50, 100, 100),
  new three.MeshStandardMaterial({
    // wireframe: true,
    color: "#C4A484",
    map: textureMap.floor,
    normalMap: textureMap.floorNormal,
    alphaMap: textureMap.floorAlpha,
    transparent: true,

    // if using displacement, need scale / bias to offset the higher vertices on x axis
    displacementMap: textureMap.floorDisp,
    displacementScale: 0.3,
    displacementBias: -0.125,
    aoMap: textureMap.floorARM,
    metalnessMap: textureMap.floorARM,
    roughnessMap: textureMap.floorARM,
  })
);
gui
  .add(floor.material, "displacementScale", 0, 1, 0.001)
  .name("Floor Display Scale");
gui
  .add(floor.material, "displacementBias", -1, 1, 0.001)
  .name("Floor Display Bias");

// floor.position.set(0, -1, 0);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;

scene.add(house, floor);

// Bushes
const bushes = createBushes({
  map: textureMap.bush,
  normalMap: textureMap.bushNormal,
  armMap: textureMap.bushARM,
});
scene.add(...bushes);

// Graves
const graves = createGraves({
  amount: 30,
  alpha: textureMap.plaster,
  normalMap: textureMap.plasterNormal,
  armMap: textureMap.plasterARM,
});
scene.add(graves);

/**
 * Lights
 */
// Ambient light
const ambientLight = new three.AmbientLight("#ffffff", 0.5);
scene.add(ambientLight);

// Directional light
const directionalLight = new three.DirectionalLight("#ffffff", 3);
directionalLight.position.set(4, 5, -8);
const directionalLightHelper = new three.DirectionalLightHelper(
  directionalLight
);
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

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
