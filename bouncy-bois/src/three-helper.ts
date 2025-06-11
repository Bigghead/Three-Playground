import * as three from "three";
import { buildRandomVertexPosition, getRandomNumber } from "./utils";
import { type randomGeometry } from "./constants";

/**
 * Textures
 */
const textureLoader = new three.TextureLoader();
const textureMap = Array.from({ length: 14 }).map((_, index) =>
  textureLoader.load(`/matcaps/${index + 1}.webp`)
);

const defaultGeometry = new three.SphereGeometry(1);
const boxGeometry = new three.BoxGeometry(1);
const basicMaterial = new three.MeshMatcapMaterial({
  matcap: textureMap[0],
});

export const createMesh = (
  geometry: randomGeometry,
  position = buildRandomVertexPosition()
): {
  mesh: three.Mesh;
  geometry: randomGeometry;
  randomScale: number;
  id: string;
} => {
  // slight perf improvement by not creating a new geometry everytime
  let body: three.BufferGeometry = defaultGeometry.clone();

  switch (geometry) {
    case "box":
      body = boxGeometry.clone();
  }
  const { x, y, z } = position;
  const material = basicMaterial.clone();
  material.matcap = textureMap[getRandomNumber(1, textureMap.length)];
  const mesh = new three.Mesh(body, material);
  mesh.position.set(x, y, z);

  const randomScale = Math.random() + 0.2;
  mesh.scale.set(randomScale, randomScale, randomScale);

  mesh.castShadow = true;
  return {
    mesh,
    geometry,
    randomScale,
    id: mesh.uuid,
  };
};

export const disposeMesh = (mesh: three.Mesh): void => {
  mesh?.geometry.dispose();
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((mat) => mat.dispose());
    } else {
      mesh.material.dispose();
    }
  }
};
