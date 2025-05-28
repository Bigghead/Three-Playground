import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import {
  buildRandomVertexPosition,
  floorWidth,
  type randomGeometry,
  type ObjectBody,
} from "./utils";
import RAPIER from "@dimforge/rapier3d-compat";
import { createMesh } from "./three-helper";
await RAPIER.init();

const worker = new Worker(new URL("worker.ts", import.meta.url), {
  type: "module",
});

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
type WorldObjects = ObjectBody & {
  mesh: three.Mesh;
};
let worldObjects: WorldObjects[] = [];
let rapierFloor: RAPIER.RigidBody;

worker.onmessage = ({ data: { type, payload } }) => {
  console.log(type);
  if (type === "Rapier Ready") {
    worldObjects = Array.from({ length: 20 }).map(() => createMesh("sphere"));
    console.log("here");

    worker.postMessage({
      type: "Add Objects",
      payload: {
        data: worldObjects.map(({ geometry, position, randomScale }) => ({
          geometry,
          position,
          randomScale,
        })),
      },
    });
  }
};

const floorGeometry = new three.BoxGeometry(
  floorWidth * 2,
  0.01,
  floorWidth * 2
);
const floorMaterial = new three.MeshStandardMaterial({
  color: "#777777",
  metalness: 0.3,
  roughness: 0.4,
  envMapIntensity: 0.5,
  side: three.DoubleSide,
});

// forgot standard material needs lighting
const floor = new three.Mesh(floorGeometry, floorMaterial);
// floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const generateObjects = (): void => {
  worldObjects.forEach(({ mesh }) => scene.add(mesh));
};
generateObjects();

/**
 * Rapier Physics
 */

/**
 * GUI Functions
 */
const guiObj = {
  floorRotationX: 0,
  isFloorAnimating: false,
  endFloorRotationAngle: 0.25, // stops at 25 degrees
  isRaining: false,
  rainSpeedTimer: 5,
  rainingInterval: null as number | null, // setInterval returns a number type
  createObject: () => {
    // just do all spheres for now
    // const geometryType = Math.random() < 0.5 ? "box" : "sphere";
    worldObjects.push(createMesh("sphere"));
    generateObjects();
  },

  tipFloor: () => {
    guiObj.isFloorAnimating = true;
  },

  resetFloor: () => {
    guiObj.isFloorAnimating = false;
    guiObj.floorRotationX = 0;

    // trippy rapier rotation, setting all 0s doesnt put it back to 0
    // needs that last 1 in the w param for some reason, but it works
    // rapierFloor.setRotation(new RAPIER.Quaternion(0, 0, 0, 1), true);
  },

  makeItRain: () => {
    if (!guiObj.isRaining) {
      guiObj.isRaining = true;
      guiObj.rainingInterval = setInterval(() => {
        const sphere = createMesh(
          Math.random() < 0.5 ? "box" : "sphere",
          buildRandomVertexPosition()
        );
        worldObjects.push(sphere);
        scene.add(sphere.mesh);
      }, guiObj.rainSpeedTimer);
    }
  },

  clearRain: () => {
    // typescript, bruhh...
    // it's screaming for type mismatch before this line check if null
    if (guiObj.rainingInterval != null) {
      guiObj.isRaining = false;
      clearInterval(guiObj.rainingInterval);
      guiObj.rainingInterval = null;
    }
  },

  changeRainSpeed: (speed: number) => {
    if (!guiObj.isRaining) return;
    guiObj.rainSpeedTimer = speed;
    guiObj.clearRain();
    guiObj.makeItRain();
  },
};

gui.add(guiObj, "createObject").name("Add Ball");
gui.add(guiObj, "tipFloor").name("Tip Floor");
gui.add(guiObj, "resetFloor").name("Reset Floor");
gui.add(guiObj, "makeItRain").name("Make It Rain!");

// we're going to use this to check performance later
// like defaulting to 1 to make that CPU work
gui
  .add(guiObj, "rainSpeedTimer", 5, 200, 5)
  .name("Rain Speed!")
  .onFinishChange((speed: number) => {
    guiObj.changeRainSpeed(speed);
  });

gui.add(guiObj, "clearRain").name("Stop Rain!");

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
camera.position.set(0, 7, 25);
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
let deltaTime = 0;

const tick = (): void => {
  const elapsedTime = clock.getElapsedTime();
  const timeDelta = elapsedTime - deltaTime;
  deltaTime = elapsedTime;

  // Update controls
  controls.update();

  // world.step();
  // worldObjects.forEach(({ mesh, rapierBody }, index) => {
  //   /**
  //    * Todo, fix cone
  //    */
  //   // for cone shape, the translation would give the threejs mesh
  //   // Craaaaaaaaaaazy wild variations on the position axis
  //   // +/- 2000 in x/y/z axis
  //   mesh.position.copy(rapierBody.translation());
  //   mesh.quaternion.copy(rapierBody.rotation());

  //   // get rid of object if it's below floor ( assuming cause it fell off the sides )
  //   if (mesh.position.y <= -20) {
  //     scene.remove(mesh);
  //     // world.removeRigidBody(rapierBody);
  //     worldObjects.splice(index, 1);
  //   }
  // });

  // if (guiObj.isFloorAnimating) {
  //   if (guiObj.floorRotationX <= guiObj.endFloorRotationAngle) {
  //     guiObj.floorRotationX += timeDelta * 0.1;
  //     const quat = new RAPIER.Quaternion(
  //       0,
  //       0,
  //       Math.sin(guiObj.floorRotationX),
  //       Math.cos(guiObj.floorRotationX)
  //     );

  //     rapierFloorBody.setRotation(quat, true);
  //   }
  // }
  // floor.position.copy(rapierFloorBody.translation());
  // const rQuat = rapierFloorBody.rotation();
  // floor.quaternion.set(rQuat.x, rQuat.y, rQuat.z, rQuat.w);

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
