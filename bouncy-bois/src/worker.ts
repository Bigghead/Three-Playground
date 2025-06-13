import * as RAPIER from "@dimforge/rapier3d-compat";
import {
  floorWidth,
  OBJECT_REMOVAL_WHEN_RAINING_TIMER,
  type ObjectBody,
  type randomGeometry,
  WorkerEnum,
} from "./lib/constants";

(async () => {
  await RAPIER.init();

  type RapierBody = {
    id: string;
    rapierBody: RAPIER.RigidBody;
    rapierCollider: RAPIER.ColliderDesc;
    sleepStartTime?: number;
  };

  let rapierBodies: Map<string, RapierBody> = new Map();

  // SharedArrayBuffer is like the name, shared across threads instead of deeply cloned.
  // The deep cloning gets slow when your object data gets bigger over time
  const maxObjects = 5000;
  const buffer = new SharedArrayBuffer(
    maxObjects * 7 * Float32Array.BYTES_PER_ELEMENT
  );
  const floatArray = new Float32Array(buffer);
  const world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

  let rainStartTime: number | null = null;

  const rapierFloor =
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0, 0);
  const rapierFloorBody = world.createRigidBody(rapierFloor);
  const floorColliderDesc = RAPIER.ColliderDesc.cuboid(
    floorWidth,
    0.05,
    floorWidth
  ).setRestitution(0.5);

  world.createCollider(floorColliderDesc, rapierFloorBody);

  postMessage({
    type: WorkerEnum.RAPIER_READY,
    payload: {
      floor: rapierFloorBody,
    },
  });

  const createRapierBody = (
    id: string,
    geometry: randomGeometry,
    position: [number, number, number],
    randomScale: number
  ): RapierBody => {
    let rapierBody: RAPIER.RigidBody;
    let rapierCollider: RAPIER.ColliderDesc;

    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setCanSleep(true)
      .setTranslation(...position);
    rapierBody = world.createRigidBody(rigidBodyDesc);
    rapierCollider = RAPIER.ColliderDesc.ball(1 * randomScale);

    if (geometry === "box") {
      const halfExtent = (1 * randomScale) / 2;
      rapierCollider = RAPIER.ColliderDesc.cuboid(
        halfExtent,
        halfExtent,
        halfExtent
      );
    }

    rapierCollider.restitution = 0.5;
    world.createCollider(rapierCollider, rapierBody);
    return {
      id,
      rapierBody,
      rapierCollider,
    };
  };

  const shouldRemoveInactiveBodies = ({
    isRaining,
  }: {
    isRaining: boolean;
  }): void => {
    startRain(isRaining);
    if (isRaining) {
      removeInactiveBodies();
    } else {
      rainStartTime = null;
    }
  };

  const startRain = (isRaining: boolean): void => {
    if (isRaining && rainStartTime === null) {
      rainStartTime = performance.now();
    }
  };

  /**
   * Start clearing inactive objects, x seconds after rain has started
   *
   * Todo - more efficient removal ( batch? )
   */
  const removeInactiveBodies = (): void => {
    if (rapierBodies.size < 100) return;

    const idsToRemove: string[] = [];
    const removalThreshold =
      performance.now() - OBJECT_REMOVAL_WHEN_RAINING_TIMER;

    rapierBodies.forEach((body, id) => {
      if (
        body.rapierBody.isSleeping() &&
        body.sleepStartTime &&
        body.sleepStartTime > removalThreshold
      ) {
        idsToRemove.push(id);
      }
    });

    idsToRemove.forEach((id) => {
      const bodyToRemove = rapierBodies.get(id);
      if (bodyToRemove) {
        world.removeRigidBody(bodyToRemove.rapierBody);
        rapierBodies.delete(id);
      }
    });

    if (idsToRemove.length > 0) {
      postMessage({
        type: WorkerEnum.REMOVE_INACTIVES,
        payload: { ids: idsToRemove, reusable: true },
      });
    }
  };

  const removeFallingBody = ({
    id,
  }: {
    id: string;
    reusable: boolean;
  }): void => {
    const rigidBody = rapierBodies.get(id);
    if (rigidBody) {
      rapierBodies.delete(id);
      world.removeRigidBody(rigidBody.rapierBody);
    }
  };

  const shouldRotateFloor = ({
    isFloorAnimating,
    floorRotationX,
    endFloorRotationAngle,
    timeDelta,
  }: {
    isFloorAnimating: boolean;
    floorRotationX: number;
    endFloorRotationAngle: number;
    timeDelta: number;
  }): void => {
    if (isFloorAnimating) {
      if (floorRotationX <= endFloorRotationAngle) {
        const newFloorRotationX = floorRotationX + timeDelta * 0.1;
        const quat = new RAPIER.Quaternion(
          0,
          0,
          Math.sin(newFloorRotationX),
          Math.cos(newFloorRotationX)
        );

        rapierFloorBody.setRotation(quat, true);

        postMessage({
          type: WorkerEnum.ROTATE_FLOOR,
          payload: {
            newFloorRotationX,
            translation: rapierFloorBody.translation(),
            rotation: rapierFloorBody.rotation(),
          },
        });
      }
    } else {
      // trippy rapier rotation, setting all 0s doesnt put it back to 0
      // needs that last 1 in the w param for some reason, but it works
      // rapierFloor.setRotation(new RAPIER.Quaternion(0, 0, 0, 1), true);
      rapierFloorBody.setRotation(new RAPIER.Quaternion(0, 0, 0, 1), true);
      postMessage({
        type: WorkerEnum.ROTATE_FLOOR,
        payload: {
          newFloorRotationX: 0,
          translation: rapierFloorBody.translation(),
          rotation: rapierFloorBody.rotation(),
        },
      });
    }
  };

  /**
   *
   * Worker Event Capturing
   * @param {Object} message The message event object from the main thread.
   * @returns void
   */
  self.onmessage = ({ data: { type, payload } }) => {
    try {
      if (type === WorkerEnum.ADD_OBJECTS) {
        const { data } = payload;
        data.forEach(({ id, geometry, position, randomScale }: ObjectBody) => {
          rapierBodies.set(
            id,
            createRapierBody(id, geometry, position, randomScale)
          );
        });
      }

      if (type === WorkerEnum.WORLD_STEP) {
        if (!world) return;

        world.step();

        const {
          isFloorAnimating,
          floorRotationX,
          endFloorRotationAngle,
          timeDelta,
          isRaining,
        } = payload;

        const idsToUpdate: string[] = [];

        let i = 0;
        rapierBodies.forEach((body) => {
          // push and pass the ids into the main
          // why? because the sharedarraybuffer will only take in numbers
          // so we keep track of ids in another array
          idsToUpdate.push(body.id);
          const t = body.rapierBody.translation();
          const r = body.rapierBody.rotation();

          floatArray[i++] = t.x;
          floatArray[i++] = t.y;
          floatArray[i++] = t.z;
          floatArray[i++] = r.x;
          floatArray[i++] = r.y;
          floatArray[i++] = r.z;
          floatArray[i++] = r.w;

          if (body.rapierBody.isSleeping()) {
            if (!body.sleepStartTime) {
              body.sleepStartTime = performance.now();
            }
          }
        });

        postMessage({
          type: WorkerEnum.UPDATE_MESHES,
          payload: {
            buffer: floatArray.buffer,
            count: rapierBodies.size,
            ids: idsToUpdate,
          },
        });

        shouldRemoveInactiveBodies({ isRaining });

        shouldRotateFloor({
          isFloorAnimating,
          floorRotationX,
          endFloorRotationAngle,
          timeDelta,
        });
      }

      if (type === WorkerEnum.REMOVE_BODY) {
        removeFallingBody(payload);
      }
    } catch (e) {
      console.error(e);
    }
  };
})();
