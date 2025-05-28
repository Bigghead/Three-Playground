import * as three from "three";

/**
 * Textures
 */
const textureLoader = new three.TextureLoader();
const textureMap = Array.from({ length: 14 }).map((_, index) =>
  textureLoader.load(`/matcaps/${index + 1}.webp`)
);

export type randomGeometry = "sphere" | "cone" | "box";
const basicMaterial = new three.MeshMatcapMaterial({
  matcap: textureMap[0],
});

export const floorWidth = 12;

export const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const buildRandomVertexPosition = (): [number, number, number] => {
  return [
    getRandomNumber(-floorWidth, floorWidth),
    getRandomNumber(12, 20),
    getRandomNumber(-floorWidth, floorWidth),
  ];
};

export const createMesh = (
  geometry: randomGeometry,
  position: [number, number, number]
): {
  mesh: three.Mesh;
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

  return { mesh };
};
