import * as three from "three";
import { createNoise2D } from "simplex-noise";
import { ThreeCanvas } from "./canvas";
import { positionNeighbors } from "./lib/utils";

const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
if (!canvas) {
  console.error("Canvas element with class 'webgl' not found.");
}

const noise2D = createNoise2D();

const hexagonGroupWidth = 15;

const threeCanvas = new ThreeCanvas({
  canvas,
  initShadow: true,
});

const textures = {
  matcap1: threeCanvas.textureLoader.load("/matcap/1.webp"),
  matcap2: threeCanvas.textureLoader.load("/matcap/2.webp"),
  dirt: threeCanvas.textureLoader.load("/textures/dirt.webp"),
  dirt2: threeCanvas.textureLoader.load("/textures/dirt2.webp"),
  grass: threeCanvas.textureLoader.load("/textures/grass.webp"),
  sand: threeCanvas.textureLoader.load("/textures/sand.webp"),
  stone: threeCanvas.textureLoader.load("/textures/stone.webp"),
  water: threeCanvas.textureLoader.load("/textures/water.webp"),
};

for (const [key, texture] of Object.entries(textures)) {
  if (!key.includes("matcap")) {
    texture.colorSpace = three.SRGBColorSpace;
  }
}

const basicMaterial = new three.MeshStandardMaterial({
  flatShading: true,
});

// threeCanvas.scene.add(new three.AxesHelper(20));

const createHexagons = (): three.Group => {
  const hexagonGroup = new three.Group();

  for (let i = -hexagonGroupWidth; i < hexagonGroupWidth; i++) {
    for (let j = -hexagonGroupWidth; j < hexagonGroupWidth; j++) {
      // doing random y axis height with math.random kinda works but randomized and not smoothed

      // using simplex noise for gradient height mapping
      // just passing in the i/j index works for simplex, but too tall
      // let height = (noise2D(i * 0.1, j * 0.1) + 1) * 0.5;
      // height = Math.pow(height, 1.5) * 10;
      const height =
        Math.pow(Math.abs((noise2D(i * 0.1, j * 0.1) + 1) / 2), 1.3) * 10;

      const material = basicMaterial.clone();
      material.map = getTextureMap(height);
      const hexagon = new three.Mesh(
        new three.CylinderGeometry(1, 1, height, 6, 1, false),
        material
      );
      const newPosition = positionNeighbors(i, j);
      hexagon.castShadow = true;
      hexagon.receiveShadow = true;

      // how far from the origin ( 0, 0, 0 )
      // we want a circle grid ( or square if you want, up to you )
      if (newPosition.length() < hexagonGroupWidth + 3) {
        const { x, z } = newPosition;
        hexagon.position.set(x, height / 2, z);
        hexagonGroup.add(hexagon);
      }
    }
  }

  return hexagonGroup;
};

const getTextureMap = (height: number): three.Texture => {
  if (height > 8) {
    return textures.stone;
  } else if (height > 7) {
    return textures.dirt;
  } else if (height > 5) {
    return textures.grass;
  } else if (height > 3) {
    return textures.sand;
  } else if (height > 0) {
    return textures.dirt2;
  }
  return textures.dirt2;
};

const hexagonGroup = createHexagons();
threeCanvas.scene.add(hexagonGroup);
