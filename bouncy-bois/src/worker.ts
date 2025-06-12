import * as RAPIER from "@dimforge/rapier3d-compat";
import {
  floorWidth,
  type ObjectBody,
  type randomGeometry,
  WorkerEnum,
} from "./constants";

(async () => {
  await RAPIER.init();

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

  const createRapierBody = (
    id: string,
    geometry: randomGeometry,
    position: [number, number, number],
    randomScale: number
  ): RapierBody => {
    if (pooledRapierBodies.length) {
      const pooledRapier = pooledRapierBodies.pop();
      if (pooledRapier) {
        const [x, y, z] = position;
        pooledRapier.body.setTranslation({ x, y, z }, true);
        pooledRapier.body.setRotation(new RAPIER.Quaternion(0, 0, 0, 1), true);
        pooledRapier.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        pooledRapier.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        pooledRapier.body.wakeUp();
        pooledRapier.body.setEnabled(true);

        console.log(pooledRapier.body.translation());
        return {
          id,
          rapierBody: pooledRapier.body,
          rapierCollider: pooledRapier.collider,
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
    };
  };

  self.onmessage = ({ data: { type, payload } }) => {
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
      postMessage({
        type: WorkerEnum.UPDATE_MESHES,
        payload: {
          data: Array.from(rapierBodies.values()).map((body) => {
            const translation = body.rapierBody.translation();
            const rotation = body.rapierBody.rotation();
            return {
              id: body.id,
              position: {
                x: translation.x,
                y: translation.y,
                z: translation.z,
              },
              rotation: {
                x: rotation.x,
                y: rotation.y,
                z: rotation.z,
                w: rotation.w,
              },
            };
          }),
        },
      });

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
          world.removeRigidBody(rigidBody.rapierBody);
          rapierBodies.delete(payload.id);
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
  };
})();
