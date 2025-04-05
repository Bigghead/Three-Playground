import * as three from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

/**
 * Globals
 */
const canvas = document.querySelector(".webgl") as HTMLCanvasElement;
const canvasSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const scene = new three.Scene();
console.log(canvasSize);
const textureLoader = new three.TextureLoader();
const textureMaps = {
  1: textureLoader.load("/matcaps/1.png"),
};
textureMaps[1].colorSpace = three.SRGBColorSpace;
/**
 * Font
 */
const fontLoader = new FontLoader();
const loader = fontLoader.load("/fonts/WinkySans_Bold.json", (font) => {
  console.log(font);
  const textGeometry = new TextGeometry("Hello, Beautiful!", {
    font,
    size: 80,
    depth: 5,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 10,
    bevelSize: 8,
    bevelOffset: 0,
    bevelSegments: 5,
  });
  const material = new three.MeshMatcapMaterial({
    matcap: textureMaps[1],
  });
  scene.add(new three.Mesh(textGeometry, material));
});

/**
 * Camera
 */
const camera = new three.PerspectiveCamera(
  75,
  canvasSize.width / canvasSize.height
);

/**
 * Renderer
 */
const renderer = new three.WebGLRenderer({
  canvas,
});
renderer.setSize(canvasSize.width, canvasSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.render(scene, camera);
