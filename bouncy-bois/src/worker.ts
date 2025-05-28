import RAPIER from "@dimforge/rapier3d-compat";

import {
  floorWidth,
  getRandomNumber,
  type ObjectBody,
  type randomGeometry,
} from "./utils";
await RAPIER.init();

export const world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

const rapierFloor =
  RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0, 0);
const rapierFloorBody = world.createRigidBody(rapierFloor);
const floorColliderDesc = RAPIER.ColliderDesc.cuboid(
  floorWidth,
  0.001,
  floorWidth
).setRestitution(0.5);
world.createCollider(floorColliderDesc, rapierFloorBody);

postMessage({
  type: "Rapier Ready",
  payload: {
    floor: rapierFloorBody,
  },
});

const createRapierBody = (
  geometry: randomGeometry,
  position: [number, number, number],
  randomScale: number
): {
  rapierBody: RAPIER.RigidBody;
  rapierCollider: RAPIER.ColliderDesc;
} => {
  const [x, y, z] = position;
  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setCanSleep(true)
    .setTranslation(x, y, z);
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
    rapierBody,
    rapierCollider,
  };
};

self.onmessage = ({ data: { type, payload } }) => {
  console.log(type, payload);
  if (type === "Add Objects") {
    const { data } = payload;
    data.forEach(({ geometry, position, randomScale }: ObjectBody) => {
      createRapierBody(geometry, position, randomScale);
    });
  }
};
