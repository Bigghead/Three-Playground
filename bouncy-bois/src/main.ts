import * as three from "three";
import Stats from "stats.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import {
  floorWidth,
  type randomGeometry,
  type PointPosition,
  WorkerEnum,
  type WorldObjects,
  type MeshPool,
} from "./constants";
import { createMesh, disposeMesh } from "./three-helper";
import { buildRandomVertexPosition } from "./utils";

const worker = new Worker(new URL("worker.ts", import.meta.url), {
  type: "module",
});

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
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
directionalLight.position.set(-10, 10, -10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 35;
directionalLight.shadow.camera.left = -floorWidth * 1.5;
directionalLight.shadow.camera.top = floorWidth * 1.5;
directionalLight.shadow.camera.right = floorWidth * 1.5;
directionalLight.shadow.camera.bottom = -floorWidth * 1.5;

const directionalLighthelper = new three.DirectionalLightHelper(
  directionalLight
);
const shadowHelper = new three.CameraHelper(directionalLight.shadow.camera);

scene.add(directionalLight);

/**
 * Meshes
 */

let worldObjects: Map<string, WorldObjects> = new Map();

let meshPool: MeshPool[] = [];

worker.onmessage = ({ data: { type, payload } }) => {
  if (type === WorkerEnum.RAPIER_READY) {
    Array.from({ length: 20 }).forEach(() => {
      const threeMesh = createMesh("sphere");
      worldObjects.set(threeMesh.id, threeMesh);
      scene.add(threeMesh.mesh);
    });

    worker.postMessage({
      type: WorkerEnum.ADD_OBJECTS,
      payload: {
        data: Array.from(worldObjects.values()).map(
          ({ id, geometry, mesh }) => ({
            id,
            geometry,
            position: mesh.position.toArray(),
            randomScale: mesh.scale.x,
          })
        ),
      },
    });
  }

  if (type === WorkerEnum.UPDATE_MESHES) {
    const { data } = payload;
    data.forEach(
      ({
        id,
        position,
        rotation,
      }: {
        id: string;
        position: PointPosition;
        rotation: PointPosition & {
          w: number;
        };
      }) => {
        worldObjects.get(id)?.mesh.position.copy(position);
        worldObjects.get(id)?.mesh.quaternion.copy(rotation);
      }
    );
  }

  if (type === WorkerEnum.ROTATE_FLOOR) {
    const { newFloorRotationX, translation, rotation } = payload;
    guiObj.floorRotationX = newFloorRotationX;
    floor.position.copy(translation);
    floor.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
  }

  if (type === WorkerEnum.REMOVE_INACTIVES) {
    const { ids } = payload;
    ids.forEach((id: string) => {
      const meshObject = worldObjects.get(id);
      if (meshObject) {
        worldObjects.delete(id);
        scene.remove(meshObject.mesh);
        disposeMesh(meshObject.mesh);
      }
    });
  }
};

const floorGeometry = new three.BoxGeometry(
  floorWidth * 2,
  0.1,
  floorWidth * 2
);
const floorMaterial = new three.MeshStandardMaterial({
  color: "#fff4ce",
  metalness: 0.3,
  roughness: 0.4,
  envMapIntensity: 0.5,
});

// forgot standard material needs lighting
const floor = new three.Mesh(floorGeometry, floorMaterial);
floor.receiveShadow = true;
scene.add(floor);

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
  rainingDuration: 30,
  rainingTimeout: null as number | null,
  isCameraHelperOn: false,

  createObject: (geometry = "sphere"): void => {
    // check if any pooled objects exist and use that vs creating new mesh
    let activeObject;
    if (meshPool.length) {
      const pooledMesh = meshPool.pop(); // really need to be shift() / FIFO but pop is faster

      if (pooledMesh) {
        const newPosition = buildRandomVertexPosition();
        pooledMesh?.mesh.position.set(...newPosition);

        pooledMesh.mesh.visible = true;
        worldObjects.set(pooledMesh.id, {
          id: pooledMesh.id,
          geometry: pooledMesh.geometry,
          randomScale: pooledMesh.mesh.scale.x,
          position: pooledMesh.mesh.position.toArray(),
          mesh: pooledMesh.mesh,
        });

        activeObject = {
          id: pooledMesh.id,
          geometry: pooledMesh.geometry,
          position: newPosition,
          randomScale: pooledMesh.mesh.scale.x,
        };
      }
    } else {
      const newMesh = createMesh(geometry as randomGeometry);
      worldObjects.set(newMesh.id, newMesh);
      scene.add(newMesh.mesh);

      activeObject = {
        id: newMesh.id,
        geometry: newMesh.geometry,
        position: newMesh.mesh.position.toArray(),
        randomScale: newMesh.randomScale,
      };
    }
    worker.postMessage({
      type: WorkerEnum.ADD_OBJECTS,
      payload: {
        data: [activeObject],
      },
    });
  },

  tipFloor: (): void => {
    guiObj.isFloorAnimating = true;
  },

  resetFloor: (): void => {
    guiObj.isFloorAnimating = false;
    guiObj.floorRotationX = 0;
  },

  makeItRain: (): void => {
    if (!guiObj.isRaining) {
      guiObj.isRaining = true;

      guiObj.rainingTimeout = setTimeout(() => {
        guiObj.clearRain();
      }, guiObj.rainingDuration * 1000);

      guiObj.rainingInterval = setInterval(() => {
        guiObj.createObject(Math.random() <= 0.5 ? "sphere" : "box");
      }, guiObj.rainSpeedTimer);
    }
  },

  clearRain: (): void => {
    if (guiObj.rainingInterval != null) {
      guiObj.isRaining = false;
      clearInterval(guiObj.rainingInterval);
      guiObj.rainingInterval = null;
    }
    if (guiObj.rainingTimeout != null) {
      clearTimeout(guiObj.rainingTimeout);
      guiObj.rainingTimeout = null;
    }
  },

  updateRain: (speed: number, duration: number): void => {
    if (!guiObj.isRaining) return;
    guiObj.rainSpeedTimer = speed;
    guiObj.rainingDuration = duration;
    guiObj.clearRain();
    guiObj.makeItRain();
  },

  toggleShadowhelper: (): void => {
    if (guiObj.isCameraHelperOn) {
      scene.remove(directionalLighthelper, shadowHelper);
      guiObj.isCameraHelperOn = false;
    } else {
      scene.add(directionalLighthelper, shadowHelper);
      guiObj.isCameraHelperOn = true;
    }
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
    guiObj.updateRain(speed, guiObj.rainingDuration);
  });

gui
  .add(guiObj, "rainingDuration", 1, 60, 1)
  .name("Rain Duration ( Seconds )")
  .onFinishChange((duration: number) => {
    guiObj.updateRain(guiObj.rainSpeedTimer, duration);
  });

gui.add(guiObj, "clearRain").name("Stop Rain!");
gui.add(guiObj, "toggleShadowhelper").name("Toggle Shadow Helper");

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
camera.position.set(12, 15, 35);
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
let frameCount = 0;

const tick = (): void => {
  stats.begin();
  const elapsedTime = clock.getElapsedTime();
  const timeDelta = elapsedTime - deltaTime;
  deltaTime = elapsedTime;

  // Update controls
  controls.update();

  worker.postMessage({
    type: WorkerEnum.WORLD_STEP,
    payload: {
      isFloorAnimating: guiObj.isFloorAnimating,
      floorRotationX: guiObj.floorRotationX,
      endFloorRotationAngle: guiObj.endFloorRotationAngle,
      timeDelta,
      isRaining: guiObj.isRaining,
    },
  });

  console.warn(worldObjects.size, " - ", meshPool.length);
  worldObjects.forEach(({ id, geometry, mesh }) => {
    // get rid of object if it's below floor ( assuming cause it fell off the sides )
    if (mesh.position.y <= -20) {
      worldObjects.delete(id);

      const workerMessage = {
        type: WorkerEnum.REMOVE_BODY,
        payload: {
          id,
          reusable: false,
        },
      };

      if (worldObjects.size > 500) {
        scene.remove(mesh);
        disposeMesh(mesh);
      } else {
        meshPool.push({ id, geometry, mesh });
        mesh.visible = false;
        workerMessage.payload.reusable = true;
      }

      worker.postMessage(workerMessage);
    }
  });

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  stats.end();
  window.requestAnimationFrame(tick);
  frameCount++;
};

tick();
