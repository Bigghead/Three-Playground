import * as three from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { createNoise2D } from "simplex-noise";

import { GUIManager, ThreeCanvas } from "./canvas";
import { getLayer, positionNeighbors } from "./lib/utils";

const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
if (!canvas) {
  console.error("Canvas element with class 'webgl' not found.");
}

const noise2D = createNoise2D();

const hexagonGroupWidth = 15;
const maxHeight = 10;

const threeCanvas = new ThreeCanvas({
  canvas,
  initShadow: true,
});

const { scene } = threeCanvas;
scene.background = new three.Color("#f3f0f0");

const guiManager = new GUIManager({ canvas: threeCanvas, initCamera: false });

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

const basicMaterial = new three.MeshStandardMaterial({
  flatShading: true,
});

const createHexagons = (): three.Group => {
  const hexagonGroup = new three.Group();

  for (let i = -hexagonGroupWidth; i < hexagonGroupWidth; i++) {
    for (let j = -hexagonGroupWidth; j < hexagonGroupWidth; j++) {
      // doing random y axis height with math.random kinda works but randomized and not smoothed

      // using simplex noise for gradient height mapping
      // just passing in the i/j index works for simplex, but too tall
      const height =
        Math.pow(Math.abs((noise2D(i * 0.1, j * 0.1) + 1) / 2), 1.3) *
        maxHeight;

      const material = basicMaterial.clone();
      const { type, map } = getTextureMap(height);
      material.map = map;
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

        if (type === "stone") {
          const stoneMesh = new three.Mesh(
            new three.SphereGeometry(1, 6, 6),
            new three.MeshStandardMaterial({
              map: textures.stone,
            })
          );
          const randomScale = Math.random() / 2;
          stoneMesh.scale.set(randomScale, randomScale, randomScale);
          stoneMesh.position.set(
            Math.random() * 0.4 + x,
            height,
            Math.random() * 0.4 + z
          );
          scene.add(stoneMesh);
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

/**
 * Water "texture", this is easier than we thought and slick af
 */
const sea = new three.Mesh(
  new three.CylinderGeometry(
    hexagonGroupWidth + 5,
    hexagonGroupWidth + 5,
    maxHeight * 0.2
  ),

  new three.MeshPhysicalMaterial({
    color: new three.Color("#55aaff").convertSRGBToLinear().multiplyScalar(3),
    // index of refraction? How light passes
    ior: 1.4,
    transmission: 0.2,
    transparent: true,
    opacity: 0.85,
    thickness: 2,
    roughness: 1,
    metalness: 0.025,
    roughnessMap: textures.water,
    metalnessMap: textures.water,
  })
);
sea.receiveShadow = true;
sea.position.y = (maxHeight * 0.2) / 2 - 0.002;

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

const floor = new three.Mesh(
  new three.CylinderGeometry(
    hexagonGroupWidth + 6,
    hexagonGroupWidth + 6,
    maxHeight * 0.2
  ),

  new three.MeshStandardMaterial({
    map: textures.dirt2,
    side: three.DoubleSide,
  })
);
floor.position.y = (maxHeight * 0.2) / 2 - 1.5;

// gradientBackground is still a maybe if we want it
scene.add(hexagonGroup, sea, floor, sky);
