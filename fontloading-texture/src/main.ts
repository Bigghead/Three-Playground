import * as three from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { renderRandomizedGeometry } from "./utils";
import { gsap } from "gsap";

/**
 * Globals
 */
const canvas = document.querySelector(".webgl") as HTMLCanvasElement;
const canvasSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const scene = new three.Scene();
const axesHelper = new three.AxesHelper(5);
scene.add(axesHelper);

/**
 * Camera
 */
const camera = new three.PerspectiveCamera(
  75,
  canvasSize.width / canvasSize.height
);
camera.position.set(0, 0, 25);

/**
 * Textures
 */

const textureLoader = new three.TextureLoader();
const textureMaps = {
  1: textureLoader.load("/matcaps/1.png"),
};
textureMaps[1].colorSpace = three.SRGBColorSpace;

/**
 * Geometries
 */
const torusGeometry = new three.TorusGeometry();
const material = new three.MeshMatcapMaterial({
  matcap: textureMaps[1],
});
renderRandomizedGeometry({
  // doing brute force neightbor check in the util
  // gets slow for a lot of geometries ( makes sense )
  amount: 200,
  geometry: torusGeometry,
  material,
  scene,
});

/**
 * Font
 */
const fontLoader = new FontLoader();
fontLoader.load("/fonts/WinkySans_Bold.json", (font) => {
  console.log(font);
  const textGeometry = new TextGeometry("Hello, Beautiful!", {
    font,
    size: 1,
    depth: 0.2,
    curveSegments: 2,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 4,
  });
  textGeometry.center();

  // Todo remove orbitcontrols and use gsap and / or js mouse events for camera move
  scene.add(new three.Mesh(textGeometry, material));
  gsap.to(camera.position, {
    z: 4,
    duration: 2,
  });
});

/**
 * Renderer
 */
const renderer = new three.WebGLRenderer({
  canvas,
});
renderer.setSize(canvasSize.width, canvasSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

(function animate() {
  renderer.render(scene, camera);
  controls.update();
  requestAnimationFrame(animate);
})();
