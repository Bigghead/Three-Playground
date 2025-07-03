import * as three from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";

export const basicMaterial = new three.MeshStandardMaterial({
  flatShading: true,
  envMapIntensity: 0.2,
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

/**
 * Water "texture", this is easier than we thought and slick af
 */
export const createSea = ({
  width,
  maxHeight,
  texture,
}: {
  width: number;
  maxHeight: number;
  texture: three.Texture;
}): three.Mesh => {
  const sea = new three.Mesh(
    new three.CylinderGeometry(width, width, maxHeight),

    new three.MeshStandardMaterial({
      color: new three.Color("#55aaff").convertSRGBToLinear().multiplyScalar(3),
      transparent: true,
      opacity: 0.75,
      roughness: 0.9,
      metalness: 0.025,
      roughnessMap: texture,
      metalnessMap: texture,
    })
  );
  sea.receiveShadow = true;
  sea.position.y = maxHeight / 2;
  return sea;
};

export const createSky = (): Sky => {
  const sky = new Sky();
  const {
    material: { uniforms },
  } = sky;
  uniforms["turbidity"].value = 10;
  uniforms["rayleigh"].value = 3;
  uniforms["mieCoefficient"].value = 0.005;
  uniforms["mieDirectionalG"].value = 0.7;
  uniforms["sunPosition"].value.set(0, 0.3, 15);
  uniforms["sunPosition"].value.normalize();

  sky.scale.setScalar(10000);

  return sky;
};

export const createDirtFloor = ({
  width,
  maxHeight,
  texture,
}: {
  width: number;
  maxHeight: number;
  texture: three.Texture;
}): three.Mesh => {
  const material = basicMaterial.clone();
  const floor = new three.Mesh(
    new three.CylinderGeometry(width, width, maxHeight),
    material
  );

  floor.material.map = texture;
  floor.material.side = three.DoubleSide;
  floor.position.y = maxHeight / 2 - 1.5;
  return floor;
};
