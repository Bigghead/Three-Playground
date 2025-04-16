import * as three from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { renderRandomizedGeometry } from "./utils";
import { gsap } from "gsap";
import { Sky } from "three/examples/jsm/Addons.js";
import GUI from "lil-gui";

/**
 * Globals
 */
const introTexts = [
  "Get in here!",
  "Hello, awesome!",
  "Ready to roll?",
  "Let’s make magic!",
  "Ready, set, go!",
  "Step into cool.",
  "Lights, camera, action!",
  "Hey, superstar!",
  "Jump on in!",
];
const canvas = document.querySelector(".webgl") as HTMLCanvasElement;
const canvasSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const scene = new three.Scene();
const gui = new GUI();
const guiActions: { [key: string]: () => void } = {};

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

// taken from here:
// https://stackoverflow.com/questions/52614371/apply-color-gradient-to-material-on-mesh-three-js
const gradientMaterial = new three.ShaderMaterial({
  uniforms: {
    color1: {
      value: new three.Color("blue"),
    },
    color2: {
      value: new three.Color("red"),
    },
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color1;
    uniform vec3 color2;
  
    varying vec2 vUv;
    
    void main() {
      
      gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
    }
  `,
  wireframe: true,
});
const geometryGroup = renderRandomizedGeometry({
  amount: 150,
  geometry: torusGeometry,
  material,
});
const boxGeo = renderRandomizedGeometry({
  amount: 100,
  geometry: new three.SphereGeometry(),
  material: gradientMaterial,
});
scene.add(geometryGroup, boxGeo);
console.log(boxGeo);

const sky = new Sky();
const {
  material: { uniforms },
} = sky;
uniforms["turbidity"].value = 10;
uniforms["rayleigh"].value = 3;
uniforms["mieCoefficient"].value = 0.005;
uniforms["mieDirectionalG"].value = 0.7;
uniforms["sunPosition"].value.set(-0.5, -0.038, -1.2);

// the sky is a box
sky.scale.set(100, 100, 100);
scene.add(sky);

/**
 * Font
 */
let textMesh: three.Mesh;
let gsapCamera: gsap.core.Timeline;
const fontLoader = new FontLoader();
fontLoader.load("/fonts/WinkySans_Bold.json", (font) => {
  console.log(font);
  const textGeometry = new TextGeometry(
    introTexts[Math.floor(Math.random() * introTexts.length)],
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

  (guiActions["spin"] = () => {
    console.log("spin");
    gsap.to(textMesh.rotation, {
      // tricky gsap, once the rotation fills, won't do it again if we do
      // y: Math.Pi * 2
      // cause it thinks there is nothing to animate after the 1st time
      y: textMesh.rotation.y + Math.PI * 2,
      duration: 1,
      ease: "power1.inOut",
    });
  }),
    gui.add(guiActions, "spin");
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
