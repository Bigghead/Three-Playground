import * as three from "three";
const textureLoader = new three.TextureLoader();

export function loadTexture({
  path,
  repeat,
  wrap,
  colorSpace,
}: {
  path: string;
  repeat?: [number, number];
  wrap?: boolean;
  colorSpace?: string; // three srgbcolor
}) {
  const texture = textureLoader.load(path);
  if (repeat) {
    texture.repeat.set(...repeat);
  }
  if (wrap) {
    texture.wrapS = three.RepeatWrapping;
    texture.wrapT = three.RepeatWrapping;
  }
  if (colorSpace) {
    texture.colorSpace = colorSpace;
  }
  return texture;
}

export function createBushes({
  map,
  normalMap,
  armMap,
}: {
  map: three.Texture;
  normalMap?: three.Texture;
  armMap?: three.Texture;
}): three.Mesh[] {
  const bushGeometry = new three.SphereGeometry(1, 16);
  const bushMaterial = new three.MeshStandardMaterial({
    map,
    color: "#ccffcc",
  });
  if (normalMap) {
    bushMaterial.normalMap = normalMap;
  }
  if (armMap) {
    bushMaterial.aoMap = armMap;
    bushMaterial.roughnessMap = armMap;
    bushMaterial.metalnessMap = armMap;
  }
  console.log(bushMaterial);

  const bushes: three.Mesh[] = [
    { scale: 0.5, position: [0.8, 0.2, 2.2] },
    { scale: 0.25, position: [1.4, 0.1, 2.1] },
    { scale: 0.4, position: [-0.8, 0.1, 2.2] },
    { scale: 0.15, position: [-1, 0.05, 2.6] },
  ].map(({ scale, position }) => {
    const bush = new three.Mesh(bushGeometry, bushMaterial);
    bush.scale.set(scale, scale, scale);
    bush.position.set(...position);
    return bush;
  });
  return bushes;
}

const getRandom = (min: number, max: number): number => {
  const randomInt = Math.random() * (max - min);
  return Math.random() < 0.5 ? -randomInt : randomInt;
};

export function createGraves({
  amount,
  alpha,
  normalMap,
  armMap,
}: {
  amount: number;
  alpha: three.Texture;
  normalMap: three.Texture;
  armMap: three.Texture;
}): three.Group<three.Object3DEventMap> {
  const graveGroup = new three.Group();
  const graveGeo = new three.BoxGeometry(0.6, 0.8, 0.2);
  const graveMaterial = new three.MeshStandardMaterial({
    map: alpha,
    normalMap,
    aoMap: armMap,
    roughnessMap: armMap,
    metalnessMap: armMap,
  });

  for (let i = 0; i <= amount; i++) {
    const graveMesh = new three.Mesh(graveGeo, graveMaterial);
    // This kinda works but needs collision detection for the house / bushes
    // graveMesh.position.set(getRandom(4, 15), 0.4, getRandom(4, 15));

    // get random angle in a circle ( our circle floor )
    const randomAngle = Math.random() * Math.PI * 2;

    // pass random angle to sin / cos to get x / y coordinates on a circle
    // but since y axis is static ( has a floor ), then use x / z
    // Doing this gives a perfect circle, but we need randomly placed
    // graves around a circle

    // 4 ( walls width ) - radius outside the house so it won't collide
    const randomRadius = 4 + Math.random() * 10;
    const x = Math.sin(randomAngle) * randomRadius;
    const z = Math.cos(randomAngle) * randomRadius;
    graveMesh.position.set(x, (Math.random() * 1) / 2, z);

    graveMesh.rotation.x = Math.random() - 0.5;
    graveMesh.rotation.z = Math.random() - 0.5;

    // graveMesh.position.set(getRandom(4, 4), 0.8 / 2, getRandom(4, 4));
    graveGroup.add(graveMesh);
  }
  return graveGroup;
}
