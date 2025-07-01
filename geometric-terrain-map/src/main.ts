import * as three from "three";
import Stats from "stats.js";
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
} from "./lib/meshes";

const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
if (!canvas) {
  console.error("Canvas element with class 'webgl' not found.");
}

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

const noise2D = createNoise2D();

const hexagonGroupWidth = 20;
const maxHeight = 10;

const threeCanvas = new ThreeCanvas({
  canvas,
  initShadow: true,
  stats,
});

const { scene } = threeCanvas;
scene.background = new three.Color("#f3f0f0");

// const guiManager = new GUIManager({ canvas: threeCanvas, initCamera: false });

const textures = {
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

const createHexagons = (): three.Group => {
  const hexagonGroup = new three.Group();

  for (let i = -hexagonGroupWidth; i < hexagonGroupWidth; i++) {
    for (let j = -hexagonGroupWidth; j < hexagonGroupWidth; j++) {
      // doing random y axis height with math.random kinda works but randomized and not smoothed
      // just passing in the i/j index works for simplex, but too tall

      const newPosition = positionNeighbors(i, j);

      // how far from the origin ( 0, 0, 0 )
      // we want a circle grid ( or square if you want, up to you )
      if (newPosition.length() < hexagonGroupWidth + 3) {
        // using simplex noise for gradient height mapping
        const height =
          Math.pow(Math.abs((noise2D(i * 0.1, j * 0.1) + 1) / 2), 1.3) *
          (maxHeight * 0.999); // z fighting with water

        const material = basicMaterial.clone();
        const { type, map } = getTextureMap(height);
        material.map = map;
        const hexagon = new three.Mesh(
          new three.CylinderGeometry(1, 1, height, 6, 1, false),
          material
        );
        hexagon.castShadow = true;
        hexagon.receiveShadow = true;

        const { x, z } = newPosition;
        hexagon.position.set(x, height / 2, z);
        hexagonGroup.add(hexagon);

        const planeOffset = Math.random() * 0.4;
        const position: [number, number, number] = [
          planeOffset + x,
          height,
          planeOffset + z,
        ];

        if (type === "stone") {
          const stoneMesh = createStone({
            meshType: "stone",
            textureMap: textures.stone,
            position,
          });
          hexagonGroup.add(stoneMesh);
        }

        if (type === "grass") {
          const tree = createTree({
            height: 6,
            texture: textures.grass,
            position,
          });
          hexagonGroup.add(tree);
        }
      }
    }
  }

  return hexagonGroup;
};

type TextureMapGeometry = {
  type: string;
  map: three.Texture;
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

const hexagonGroup = createHexagons();
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

// gradientBackground is still a maybe if we want it
scene.add(hexagonGroup, sea, floor, sky);
