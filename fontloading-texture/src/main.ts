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

const targetCameraPosition = new three.Vector3();

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
camera.position.set(-25, 4, -25);
camera.lookAt(0, 0, 0);

/**
 * Textures
 */

const textureLoader = new three.TextureLoader();
const textureMaps = [
  textureLoader.load("/matcaps/2.png"),
  textureLoader.load("/matcaps/4.png"),
  textureLoader.load("/matcaps/5.png"),
  textureLoader.load("/matcaps/6.png"),
  textureLoader.load("/matcaps/8.png"),
];
textureMaps.forEach((texture) => {
  texture.colorSpace = three.SRGBColorSpace;
});

/**
 * Geometries
 */
const torusGeometry = new three.TorusGeometry();
const material = new three.MeshMatcapMaterial({
  matcap: textureMaps[Math.floor(Math.random() * textureMaps.length)],
});
const geometryGroup = renderRandomizedGeometry({
  // doing brute force neightbor check in the util
  // gets slow for a lot of geometries ( makes sense )
  amount: 200,
  geometry: torusGeometry,
  material,
});
scene.add(geometryGroup);

/**
 * Font
 */
let textMesh;
let gsapCamera: gsap.core.Timeline;
const fontLoader = new FontLoader();
fontLoader.load("/fonts/WinkySans_Bold.json", (font) => {
  console.log(font);
  const textGeometry = new TextGeometry(
    "If you're reading this, you're beautiful!",
    {
      font,
      size: 1,
      depth: 0.2,
      curveSegments: 2,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 4,
    }
  );
  textGeometry.center();

  // Todo remove orbitcontrols and use gsap and / or js mouse events for camera move
  textMesh = new three.Mesh(textGeometry, material);
  scene.add(textMesh);

  gsapCamera = gsap.timeline();

  gsapCamera.to(camera.position, {
    x: 0,
    y: 0,
    z: 8,
    duration: 2,
  });

  gsapCamera.to(camera.position, {
    duration: 5,
    y: 0.8,
    x: -0.5,
    yoyo: true,
    repeat: -1,
    ease: "power1.inOut",
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

// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;

const clock = new three.Clock();

(function animate() {
  const elapsedTime = clock.getElapsedTime();
  // console.log(elapsedTime);

  geometryGroup.rotation.y = elapsedTime * 0.02;
  geometryGroup.rotation.z = elapsedTime * 0.02;

  // camera follows mouse but broken since we're animating camera position above with gsap
  // camera.position.x = targetCameraPosition.x * 10;
  // camera.position.y = targetCameraPosition.y * 10;

  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  // controls.update();
  requestAnimationFrame(animate);
})();

/**
 * Event Listener
 */
window.addEventListener("resize", () => {
  const { innerWidth, innerHeight } = window;

  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

// Todo - update camera controls on mousemove
// clashes with gsap AND orbitcontrols, no idea how to fix for now
// const { width, height } = canvasSize;
// window.addEventListener("mousemove", (e) => {
//   controls.enabled = false;
//   gsapCamera.pause();
//   const { clientX, clientY } = e;

//   targetCameraPosition.x = clientX / width - 0.5;
//   targetCameraPosition.y = (clientY / height - 0.5) * -1;
// });
