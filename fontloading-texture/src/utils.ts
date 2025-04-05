import * as three from "three";

const getRandomVertex = (num: number) => (Math.random() - 0.5) * num;

export function renderRandomizedGeometry({
  amount,
  geometry,
  material,
  scene,
}: {
  amount: number;
  geometry: three.BufferGeometry;
  material: three.Material;
  scene: three.Scene;
}) {
  for (let i = 0; i <= amount; i++) {
    const randomScale = Math.floor(Math.random() * 2);
    const mesh = new three.Mesh(geometry, material);
    mesh.position.set(
      getRandomVertex(50),
      getRandomVertex(50),
      getRandomVertex(50)
    );
    mesh.rotation.x = Math.PI * Math.random();
    mesh.rotation.y = Math.PI * Math.random();
    mesh.scale.set(randomScale, randomScale, randomScale);
    scene.add(mesh);
  }
}
