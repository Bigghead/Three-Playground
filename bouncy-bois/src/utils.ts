import * as three from "three";
import RAPIER from "@dimforge/rapier3d-compat";
await RAPIER.init();

/**
 * Textures
 */
const textureLoader = new three.TextureLoader();
const textureMap = [
  textureLoader.load("/matcaps/1.webp"),
  textureLoader.load("/matcaps/2.webp"),
  textureLoader.load("/matcaps/3.webp"),
  textureLoader.load("/matcaps/4.webp"),
  textureLoader.load("/matcaps/5.webp"),
  textureLoader.load("/matcaps/6.webp"),
  textureLoader.load("/matcaps/7.webp"),
  textureLoader.load("/matcaps/8.webp"),
];

type randomGeometry = "sphere" | "cone" | "box";
const basicMaterial = new three.MeshMatcapMaterial({
  matcap: textureMap[0],
});

const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
export const buildRandomVertexPosition = (): [number, number, number] => {
  return [
    getRandomNumber(-7, 7),
    getRandomNumber(7, 15),
    getRandomNumber(-7, 7),
  ];
};

export const world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

export const createGeometry = (
  geometry: randomGeometry,
  position: [number, number, number]
): {
  mesh: three.Mesh;
  rapierBody: RAPIER.RigidBody;
  rapierCollider: RAPIER.ColliderDesc;
} => {
  let body: three.BufferGeometry = new three.SphereGeometry(1);

  switch (geometry) {
    case "box":
      body = new three.BoxGeometry(1);
    // case "cone":
    //   body = new three.ConeGeometry(1);
    //   break;
  }
  const material = basicMaterial.clone();
  material.matcap = textureMap[getRandomNumber(1, textureMap.length)];
  const mesh = new three.Mesh(body, material);
  mesh.position.set(...position);

  const randomScale = Math.random() + 0.2;
  mesh.scale.set(randomScale, randomScale, randomScale);

  mesh.castShadow = true;

  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setCanSleep(true)
    .setTranslation(mesh.position.x, mesh.position.y, mesh.position.z);
  const rapierBody = world.createRigidBody(rigidBodyDesc);
  let rapierCollider: RAPIER.ColliderDesc;

  switch (geometry) {
    case "sphere":
      rapierCollider = RAPIER.ColliderDesc.ball(1 * randomScale);
      break;

    case "box":
      const halfExtent = (1 * randomScale) / 2;
      rapierCollider = RAPIER.ColliderDesc.cuboid(
        halfExtent,
        halfExtent,
        halfExtent
      );
      break;
    case "cone":
      // no default cone shape in rapier, this is kind of annoying
      const posAttr = body.attributes.position;
      const vertexCount = posAttr.count;
      const flatPositions = new Float32Array(vertexCount * 3);

      for (let i = 0; i < vertexCount; i++) {
        flatPositions[i * 3 + 0] = posAttr.getX(i) * randomScale;
        flatPositions[i * 3 + 1] = posAttr.getY(i) * randomScale;
        flatPositions[i * 3 + 2] = posAttr.getZ(i) * randomScale;
      }

      const hullCollider = RAPIER.ColliderDesc.convexHull(flatPositions);

      if (!hullCollider) {
        throw new Error(
          "Failed to create convex hull collider from cone geometry"
        );
      }

      rapierCollider = hullCollider;
      break;

    default:
      throw new Error(`Unsupported geometry: ${geometry}`);
  }
  rapierCollider.restitution = 0.5;
  world.createCollider(rapierCollider, rapierBody);
  return { mesh, rapierBody, rapierCollider };
};
