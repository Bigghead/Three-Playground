import * as RAPIER from "@dimforge/rapier3d-compat";
import {
  floorWidth,
  OBJECT_REMOVAL_WHEN_RAINING_TIMER,
  type ObjectBody,
  type randomGeometry,
  WorkerEnum,
} from "./constants";

(async () => {
  await RAPIER.init();

  type RapierBody = {
    id: string;
    rapierBody: RAPIER.RigidBody;
    rapierCollider: RAPIER.ColliderDesc;
  };

  let rapierBodies: Map<string, RapierBody> = new Map();

  type RapierPool = {
    id: string;
    body: RAPIER.RigidBody;
    collider: RAPIER.ColliderDesc;
  };

  let pooledRapierBodies: RapierPool[] = [];

  const world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

  let isRainingTimeouts: number[] = [];

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
    const pooledRapier = pooledRapierBodies.length && pooledRapierBodies.pop();

    if (pooledRapier) {
      const { body, collider } = pooledRapier;
      const [x, y, z] = position;
      body.setTranslation({ x, y, z }, true);
      body.setRotation(new RAPIER.Quaternion(0, 0, 0, 1), true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      body.wakeUp();
      body.setEnabled(true);

      rapierBody = body;
      rapierCollider = collider;
    } else {
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
    if (isRaining) {
      removeInactiveBodies();
    } else {
      if (isRainingTimeouts.length) {
        isRainingTimeouts.forEach((timeout) => clearTimeout(timeout));
        isRainingTimeouts = [];
      }
    }
  };

  /**
   * Start clearing inactive objects, x seconds after rain has started
   * Works, but we're creating several hundred timers per each rain cycle
   *
   * Todo - more efficient removal ( batch? )
   */
  const removeInactiveBodies = (): void => {
    if (rapierBodies.size < 100) return;

    const idsToRemove: string[] = [];

    isRainingTimeouts.push(
      setTimeout(() => {
        rapierBodies.forEach((body, id) => {
          if (body.rapierBody.isSleeping()) {
            idsToRemove.push(id);
          }
        });

        // yes, we need 2 foreach loops here, because updaing the ^map while it's looping the 1st time
        // will break the map structure loop
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
      }, OBJECT_REMOVAL_WHEN_RAINING_TIMER)
    );
  };

  const removeFallingBody = ({
    id,
    reusable,
  }: {
    id: string;
    reusable: boolean;
  }): void => {
    const rigidBody = rapierBodies.get(id);
    const shoudReuseBody = reusable;
    if (rigidBody) {
      if (!shoudReuseBody) {
        rapierBodies.delete(id);
        world.removeRigidBody(rigidBody.rapierBody);
      } else {
        pooledRapierBodies.push({
          id: id,
          body: rigidBody.rapierBody,
          collider: rigidBody.rapierCollider,
        });
        rigidBody.rapierBody.setEnabled(false);
      }
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

        const physicsData: any[] = [];
        rapierBodies.forEach((body) => {
          const translation = body.rapierBody.translation();
          const rotation = body.rapierBody.rotation();
          physicsData.push({
            id: body.id,
            position: { x: translation.x, y: translation.y, z: translation.z },
            rotation: {
              x: rotation.x,
              y: rotation.y,
              z: rotation.z,
              w: rotation.w,
            },
          });
        });

        postMessage({
          type: WorkerEnum.UPDATE_MESHES,
          payload: { data: physicsData },
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
