import * as three from "three";
import { ThreeCanvas } from "./canvas";
import { positionNeighbors } from "./lib/utils";

const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
if (!canvas) {
  console.error("Canvas element with class 'webgl' not found.");
}

const hexagonGroupWidth = 8;

const threeCanvas = new ThreeCanvas({
  canvas,
  initShadow: false,
});

const textures = [
  threeCanvas.textureLoader.load("/matcap/1.webp"),
  threeCanvas.textureLoader.load("/matcap/2.webp"),
];

const basicMaterial = new three.MeshMatcapMaterial({
  // color: 0x00ff00,
  flatShading: true,
  matcap: textures[1],
});

threeCanvas.scene.add(new three.AxesHelper(20));

const createHexagons = (): three.Group => {
  const hexagonGroup = new three.Group();

  for (let i = -hexagonGroupWidth; i < hexagonGroupWidth; i++) {
    for (let j = -hexagonGroupWidth; j < hexagonGroupWidth; j++) {
      const height = Math.random() * 2;
      const hexagon = new three.Mesh(
        new three.CylinderGeometry(1, 1, height, 6, 1, false),
        basicMaterial
      );
      const newPosition = positionNeighbors(i, j);

      // how far from the origin ( 0, 0, 0 )
      // we want a circle grid ( or square if you want, up to you )
      if (newPosition.length() < 12) {
        const { x, y, z } = newPosition;
        hexagon.position.set(x, height / 2, z);
        hexagonGroup.add(hexagon);
      }
    }
  }

  return hexagonGroup;
};

const hexagonGroup = createHexagons();
threeCanvas.scene.add(hexagonGroup);
