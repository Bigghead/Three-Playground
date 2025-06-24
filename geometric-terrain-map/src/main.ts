import * as three from "three";
import { ThreeCanvas } from "./canvas";
import { positionNeighbors } from "./lib/utils";

const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
if (!canvas) {
  console.error("Canvas element with class 'webgl' not found.");
}

const hexagonGroupWidth = 5;

const threeCanvas = new ThreeCanvas({
  canvas,
  initShadow: false,
});

const basicMaterial = new three.MeshStandardMaterial({
  color: 0x00ff00,
  flatShading: true,
});

threeCanvas.scene.add(new three.AxesHelper(20));

const createHexagons = (): three.Group => {
  const hexagonGroup = new three.Group();

  for (let i = -hexagonGroupWidth; i < hexagonGroupWidth; i++) {
    for (let j = -hexagonGroupWidth; j < hexagonGroupWidth; j++) {
      const hexagon = new three.Mesh(
        new three.CylinderGeometry(1, 1, 1, 6, 1, false),
        basicMaterial
      );
      const { x, y, z } = positionNeighbors(i, j);
      hexagon.position.set(x, y, z);
      hexagonGroup.add(hexagon);
    }
  }

  return hexagonGroup;
};

const hexagonGroup = createHexagons();
threeCanvas.scene.add(hexagonGroup);
