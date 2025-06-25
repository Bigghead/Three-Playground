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
  initShadow: false,
});

const textures = [
  threeCanvas.textureLoader.load("/matcap/1.webp"),
  threeCanvas.textureLoader.load("/matcap/2.webp"),
  threeCanvas.textureLoader.load("/textures/dirt.webp"),
  threeCanvas.textureLoader.load("/textures/dirt2.webp"),
  threeCanvas.textureLoader.load("/textures/grass.webp"),
  threeCanvas.textureLoader.load("/textures/sand.webp"),
  threeCanvas.textureLoader.load("/textures/stone.webp"),
  threeCanvas.textureLoader.load("/textures/water.webp"),
];

for (const [index, texture] of textures.entries()) {
  if (index > 1) {
    texture.colorSpace = three.SRGBColorSpace;
  }
}

const basicMaterial = new three.MeshMatcapMaterial({
  flatShading: true,
  matcap: textures[1],
  map: textures[2],
});

// threeCanvas.scene.add(new three.AxesHelper(20));

const createHexagons = (): three.Group => {
  const hexagonGroup = new three.Group();

  for (let i = -hexagonGroupWidth; i < hexagonGroupWidth; i++) {
    for (let j = -hexagonGroupWidth; j < hexagonGroupWidth; j++) {
      // doing random y axis height with math.random kinda works but randomized and not smoothed

      // using simplex noise for gradient height mapping
      // just passing in the i/j index works for simplex, but too tall
      const height = Math.pow(Math.abs(noise2D(i * 0.1, j * 0.1)), 1.3) * 10;

      const material = basicMaterial.clone();
      material.map =
        textures[Math.floor(Math.random() * (textures.length - 2 + 1)) + 2];
      const hexagon = new three.Mesh(
        new three.CylinderGeometry(1, 1, height, 6, 1, false),
        material
      );
      const newPosition = positionNeighbors(i, j);

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

const hexagonGroup = createHexagons();
threeCanvas.scene.add(hexagonGroup);
