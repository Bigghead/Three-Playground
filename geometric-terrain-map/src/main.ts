import * as three from "three";
import { createNoise2D } from "simplex-noise";

import { GUIManager, ThreeCanvas } from "./canvas";
import { getLayer, positionNeighbors } from "./lib/utils";
import {
  basicMaterial,
  createDirtFloor,
  createSea,
  createSky,
  createStone,
  createTree,
  getInstancedStone,
} from "./lib/meshes";
import type {
  HexagonMesh,
  InstancedHexagon,
  MaterialType,
  Position,
  TextureMapGeometry,
} from "./lib/types";

const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
if (!canvas) {
  console.error("Canvas element with class 'webgl' not found.");
}

const noise2D = createNoise2D();

const hexagonGroupWidth = 35;
const maxHeight = 10;

const threeCanvas = new ThreeCanvas({
  canvas,
  initShadow: true,
});

const { scene } = threeCanvas;
scene.background = new three.Color("#f3f0f0");

// const guiManager = new GUIManager({ canvas: threeCanvas, initCamera: false });

const textures: Record<string, three.Texture> = {
  matcap1: threeCanvas.textureLoader.load("/matcap/1.webp"),
  matcap2: threeCanvas.textureLoader.load("/matcap/2.webp"),
  gradient: threeCanvas.textureLoader.load("/textures/gradient.webp"),
  dirt: threeCanvas.textureLoader.load("/textures/dirt.webp"),
  dirt2: threeCanvas.textureLoader.load("/textures/dirt2.webp"),
  grass: threeCanvas.textureLoader.load("/textures/grass.webp"),
  sand: threeCanvas.textureLoader.load("/textures/sand.webp"),
  stone: threeCanvas.textureLoader.load("/textures/stone.webp"),
  water: threeCanvas.textureLoader.load("/textures/water.webp"),
};

for (const [key, texture] of Object.entries(textures)) {
  if (!key.includes("matcap") || !key.includes("gradient")) {
    texture.colorSpace = three.SRGBColorSpace;
  }
}

const createInstancedHexagons = (): InstancedHexagon => {
  const materialTypes: MaterialType[] = [
    "dirt",
    "dirt2",
    "stone",
    "sand",
    "grass",
  ];

  const instances: InstancedHexagon = {};
  materialTypes.forEach((mat) => {
    const material = basicMaterial.clone();
    material.map = textures[mat];
    instances[mat] = {
      mesh: new three.InstancedMesh(
        new three.CylinderGeometry(1, 1, 1, 6, 1, false),
        material,
        hexagonGroupWidth * hexagonGroupWidth
      ),
      count: 0,
    };
  });
  return instances;
};

const instancedHexagons: InstancedHexagon = createInstancedHexagons();

const createHexagons = (): three.Group => {
  const hexagonGroup = new three.Group();
  const dummyInstance = new three.Object3D();

  for (let i = -hexagonGroupWidth; i < hexagonGroupWidth; i++) {
    for (let j = -hexagonGroupWidth; j < hexagonGroupWidth; j++) {
      // doing random y axis height with math.random kinda works but randomized and not smoothed
      // just passing in the i/j index works for simplex, but too tall

      const newPosition = positionNeighbors(i, j);

      // how far from the origin ( 0, 0, 0 )
      // we want a circle grid ( or square if you want, up to you )
      if (newPosition.length() < hexagonGroupWidth + 3) {
        const height = getGradientHeightPosition(i, j);

        const { type, position } = createRandomHeightHexagon(
          newPosition,
          height,
          dummyInstance
        );

        const decorationMesh = createDecorationMesh(type, position);
        if (decorationMesh) {
          hexagonGroup.add(decorationMesh);
        }
      }
    }
  }

  return hexagonGroup;
};

const getGradientHeightPosition = (x: number, z: number): number => {
  // using simplex noise for gradient height mapping
  const height =
    Math.pow(Math.abs((noise2D(x * 0.1, z * 0.1) + 1) / 2), 1.3) *
    (maxHeight * 0.995); // z fighting with water
  return height;
};

const createRandomHeightHexagon = (
  newPosition: three.Vector3,
  height: number,
  dummy: three.Object3D
): HexagonMesh => {
  const { type } = getTextureMap(height);

  const { x, z } = newPosition;

  const { mesh, count } = instancedHexagons[type];

  dummy.position.set(x, height / 2, z);
  dummy.scale.set(1, height, 1);
  dummy.updateMatrix();

  // this is where the instancedMesh is getting "drawn"
  mesh.setMatrixAt(count, dummy.matrix);
  instancedHexagons[type].count++;

  const planeOffset = Math.random() * 0.4;
  const position: [number, number, number] = [
    planeOffset + x,
    height,
    planeOffset + z,
  ];

  return {
    type,
    position,
  };
};

const createDecorationMesh = (
  type: string,
  position: Position
): three.Group | null => {
  // randomize how often to add decorations
  if (Math.random() <= 0.5) return null;
  if (type === "stone") {
    createStone({
      meshType: "stone",
      textureMap: textures.stone,
      position,
    });
  }

  if (type === "grass") {
    return createTree({
      height: 6,
      texture: textures.grass,
      position,
    });
  }

  return null;
};

const drawInstancedMeshes = () => {
  for (const [_, value] of Object.entries(instancedHexagons)) {
    const { mesh } = value;
    hexagonGroup.add(mesh);
  }
  hexagonGroup.add(getInstancedStone(textures.stone));
};

const getTextureMap = (height: number): TextureMapGeometry => {
  const textureGeo = {
    type: "dirt2",
    map: textures.dirt2,
  };
  if (height > 8) {
    textureGeo.type = "stone";
    textureGeo.map = textures.stone;
  } else if (height > 7) {
    textureGeo.type = "dirt";
    textureGeo.map = textures.dirt;
  } else if (height > 5) {
    textureGeo.type = "grass";
    textureGeo.map = textures.grass;
  } else if (height > 3) {
    textureGeo.type = "sand";
    textureGeo.map = textures.sand;
  } else if (height > 0) {
    return textureGeo;
  }
  return textureGeo;
};

const gradientBackground = getLayer({
  hue: 0.5,
  numSprites: 8,
  opacity: 0.2,
  radius: 10,
  size: 100,
  z: -20,
  map: textures.gradient,
});
gradientBackground.position.set(3, 18, -30);

const sea = createSea({
  width: hexagonGroupWidth + 5,
  maxHeight: maxHeight * 0.2,
  texture: textures.water,
});

const sky = createSky();

const floor = createDirtFloor({
  width: hexagonGroupWidth + 6,
  maxHeight: maxHeight * 0.2,
  texture: textures.dirt2,
});

const hexagonGroup = createHexagons();
drawInstancedMeshes();
hexagonGroup.add(sea, floor);

threeCanvas.addAnimatedObject({
  object: hexagonGroup,
  animationFunc: () => {
    hexagonGroup.rotation.y += 0.0001;
  },
});
// gradientBackground is still a maybe if we want it
scene.add(hexagonGroup, sky);
