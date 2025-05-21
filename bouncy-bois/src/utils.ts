import * as three from "three";

type randomGeometry = "sphere" | "cone" | "box";
const basicMaterial = new three.MeshBasicMaterial();

export const createGeometry = (
  geometry: randomGeometry,
  position: [number, number, number]
): three.Mesh => {
  let body: three.BufferGeometry;

  switch (geometry) {
    case "sphere":
      body = new three.SphereGeometry(1);
      break;
    case "cone":
      body = new three.ConeGeometry(1);
      break;
    case "box":
      body = new three.BoxGeometry(1);
  }

  const mesh = new three.Mesh(body, basicMaterial);
  mesh.position.set(...position);

  const randomScale = Math.random() + 0.2;
  mesh.scale.set(randomScale, randomScale, randomScale);

  mesh.castShadow = true;

  return mesh;
};
