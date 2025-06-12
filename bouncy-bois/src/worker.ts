import * as RAPIER from "@dimforge/rapier3d-compat";
import {
  floorWidth,
  INACTIVITY_THRESHOLD_MS,
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
    lastActiveTime: number;
    isCurrentlySleeping: boolean;
  };

  let rapierBodies: Map<string, RapierBody> = new Map();

  type RapierPool = {
    id: string;
    body: RAPIER.RigidBody;
    collider: RAPIER.ColliderDesc;
  };

  let pooledRapierBodies: RapierPool[] = [];

  const world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

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
    if (pooledRapierBodies.length) {
      const pooledRapier = pooledRapierBodies.pop();

      if (pooledRapier) {
        const { body, collider } = pooledRapier;
        const [x, y, z] = position;
        body.setTranslation({ x, y, z }, true);
        body.setRotation(new RAPIER.Quaternion(0, 0, 0, 1), true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        body.wakeUp();
        body.setEnabled(true);

        return {
          id,
          rapierBody: body,
          rapierCollider: collider,
          lastActiveTime: performance.now(),
          isCurrentlySleeping: false,
        };
      }
    }
    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setCanSleep(true)
      .setTranslation(...position);
    const rapierBody = world.createRigidBody(rigidBodyDesc);
    let rapierCollider: RAPIER.ColliderDesc = RAPIER.ColliderDesc.ball(
      1 * randomScale
    );

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
      lastActiveTime: performance.now(),
      isCurrentlySleeping: false,
    };
  };

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

        const currentTime = performance.now();

        const physicsData: any[] = [];
        rapierBodies.forEach((body) => {
          if (!body.rapierBody.isSleeping()) {
            body.lastActiveTime = currentTime;
          } else if (!body.isCurrentlySleeping) {
            body.lastActiveTime = currentTime;
            body.isCurrentlySleeping = true;
          }

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

        const idsToRemove: string[] = [];
        rapierBodies.forEach((body, id) => {
          if (
            body.rapierBody.isSleeping() &&
            currentTime - body.lastActiveTime > INACTIVITY_THRESHOLD_MS
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

        const {
          isFloorAnimating,
          floorRotationX,
          endFloorRotationAngle,
          timeDelta,
        } = payload;

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
      }

      if (type === WorkerEnum.REMOVE_BODY) {
        const rigidBody = rapierBodies.get(payload.id);
        const shoudReuseBody = payload.reusable;
        if (rigidBody) {
          if (!shoudReuseBody) {
            rapierBodies.delete(payload.id);
            world.removeRigidBody(rigidBody.rapierBody);
          } else {
            pooledRapierBodies.push({
              id: payload.id,
              body: rigidBody.rapierBody,
              collider: rigidBody.rapierCollider,
            });
            rigidBody.rapierBody.setEnabled(false);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };
})();
