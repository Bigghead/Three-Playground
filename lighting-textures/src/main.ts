import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import { HDRJPGLoader } from "@monogrid/gainmap-js";
import { createSphere, rotateGeometry } from "./utils";

const canvas = document.querySelector(".webgl") as HTMLCanvasElement;
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const scene = new three.Scene();
const gui = new GUI({
  closeFolders: true,
});
gui.add(document, "title");
gui.close();

/**
 * Utils
 */
// const axes = new three.AxesHelper(5);
// scene.add(axes);

/**
 * Camera
 */
const camera = new three.PerspectiveCamera(75, sizes.width / sizes.height);
camera.position.set(-4, -0.5, 3.5);
scene.add(camera);

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Lighting
 */
const ambientLight = new three.AmbientLight();
const pointLight = new three.PointLight(0xffa500, 200);
pointLight.position.set(2, 3, 4);
const pointLightHelper = new three.PointLightHelper(pointLight);
scene.add(ambientLight, pointLight, pointLightHelper);

const pointLightTweaks = gui.addFolder("Point Light");
pointLightTweaks.add(pointLight, "intensity", 100, 500, 10);
pointLightTweaks.add(pointLight.position, "x", -20, 20, 0.5);
pointLightTweaks.add(pointLight.position, "y", -20, 20, 0.5);
pointLightTweaks.add(pointLight.position, "z", -20, 20, 0.5);

/**
 * Textures
 */
const textureLoader = new three.TextureLoader();
const textureMap = {
  metal_sheet: textureLoader.load("/textures/metal_sheet.jpg"),
  blue_metal: textureLoader.load("/textures/blue_metal.jpg"),
  coast_land: textureLoader.load("/textures/coast_land.jpg"),
  rock_wall: textureLoader.load("/textures/rock_wall.jpg"),
  blue_metal_normal: textureLoader.load("/textures/blue_plate_normal.png"),
  coast_land_normal: textureLoader.load("/textures/coast_land_normal.png"),
  mud_normal: textureLoader.load("/textures/mud_cracked-min.png"),
  rusty_normal: textureLoader.load("/textures/rusty_metal_normal.png"),
  rusty_metal: textureLoader.load("/textures/rusty_metal_metal.png"),
};
textureMap.metal_sheet.colorSpace = three.SRGBColorSpace;
// textureMap.metal_sheet.magFilter = three.NearestFilter;
// textureMap.metal_sheet.minFilter = three.LinearMipMapLinearFilter;
textureMap.blue_metal.colorSpace = three.SRGBColorSpace;
textureMap.coast_land.colorSpace = three.SRGBColorSpace;
textureMap.rock_wall.colorSpace = three.SRGBColorSpace;

/**
 * Objects
 */

const redSphere = createSphere(
  textureMap.metal_sheet,
  [-2, 1.5, 0],
  "Red Sphere",
  textureMap.mud_normal
);
const rockSphere = createSphere(
  textureMap.rock_wall,
  [2, -1.5, 0],
  "Rock Sphere",
  textureMap.mud_normal
);
const blueMetalSphere = createSphere(
  textureMap.blue_metal,
  [2, 1.5, 0],
  "Blue Metal Sphere",
  textureMap.rusty_normal,
  textureMap.rusty_metal
);
const coastSphere = createSphere(
  textureMap.coast_land,
  [-2, -1.5, 0],
  "Coast Land Sphere",
  textureMap.coast_land_normal
);
const metalSphere = new three.Mesh(
  new three.SphereGeometry(),
  new three.MeshStandardMaterial({
    metalness: 0.7,
    roughness: 0.02,
    map: textureLoader.load("/textures/metal_plate.png"),
  })
);
gui.add(metalSphere.material, "metalness", 0, 5, 0.01);
gui.add(metalSphere.material, "roughness", 0, 5, 0.01);

// testing geometry to see where the pointlight is
// const box = new three.Mesh(new three.BoxGeometry(), new three.MeshBasicMaterial({ color: 'red' }))
// box.position.set(2, 3, 4)

scene.add(blueMetalSphere, rockSphere, coastSphere, redSphere, metalSphere);

/**
 * Renderer
 */
const renderer = new three.WebGLRenderer({
  canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Environment Map
 */
const loader = new HDRJPGLoader(renderer);

const result = await loader.loadAsync(
  "/environment/rogland_clear_night_4k.jpg"
);
console.log(result);
scene.background = result.renderTarget.texture;
scene.background.mapping = three.EquirectangularReflectionMapping;

const clock = new three.Clock();

(function animate() {
  const elapsedTime = clock.getElapsedTime();
  controls.update();

  rotateGeometry(blueMetalSphere, [elapsedTime * 0.15, 0, elapsedTime * 0.15]);
  rotateGeometry(rockSphere, [elapsedTime * 0.1, elapsedTime * 0.15, 0]);
  rotateGeometry(metalSphere, [
    elapsedTime * 0.2,
    elapsedTime * 0.15,
    elapsedTime * 0.1,
  ]);
  rotateGeometry(coastSphere, [0, elapsedTime * 0.1, elapsedTime * 0.15]);
  rotateGeometry(redSphere, [elapsedTime * 0.1, elapsedTime * 0.15, 0]);

  // rotate the point light around grouped spheres
  pointLight.position.set(
    Math.sin(elapsedTime) * 8,
    Math.cos(elapsedTime) * 8,
    Math.sin(elapsedTime) * 8
  );

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
})();

/**
 * Browser Events
 */
window.addEventListener("resize", () => {
  // resize canvas, update camera field of view, re-render
  const { innerHeight: height, innerWidth: width } = window;
  sizes.height = height;
  sizes.width = width;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
