import * as three from "three";

export const basicMaterial = new three.MeshStandardMaterial({
  flatShading: true,
});

export const createStone = ({
  textureMap,
  position,
}: {
  meshType: string;
  textureMap: three.Texture;
  position: [number, number, number];
}): three.Mesh => {
  const stoneMesh = new three.Mesh(
    new three.SphereGeometry(1, 6, 6),
    basicMaterial.clone()
  );
  stoneMesh.material.map = textureMap;
  const randomScale = Math.random() / 2;
  stoneMesh.scale.set(randomScale, randomScale, randomScale);
  stoneMesh.position.set(...position);
  return stoneMesh;
};

export const createTree = ({
  height,
  texture,
  position,
}: {
  height: number;
  texture: three.Texture;
  position: [number, number, number];
}): three.Group => {
  const tree = new three.Group();
  const y = position[1];
  const bottomRadius = 1;
  const material = basicMaterial.clone();

  const treeTop = new three.Mesh(
    new three.CylinderGeometry(0, bottomRadius + 1, height / 1.5),
    material
  );
  treeTop.position.y = y + 0.3;
  treeTop.material.map = texture;

  const treeMiddle = new three.Mesh(
    new three.CylinderGeometry(0, bottomRadius + 1.8, height / 2.5),
    material
  );
  treeMiddle.position.y = y - 2;
  treeMiddle.material.map = texture;

  const treeTrunk = new three.Mesh(
    new three.CylinderGeometry(0.25, 0.25, height),
    material.clone()
  );
  treeTrunk.material.color = new three.Color("brown");

  tree.add(treeTop, treeMiddle, treeTrunk);

  const randomScale = Math.random() * 0.4;
  tree.scale.set(randomScale, randomScale, randomScale);

  tree.position.set(...position);
  return tree;
};
