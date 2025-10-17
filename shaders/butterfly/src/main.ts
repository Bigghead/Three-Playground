import * as three from "three";
import { ThreeCanvas } from "./canvas";

import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
if (!canvas) {
    console.error("Canvas element not found.");
}

const threeCanvas = new ThreeCanvas({ canvas, initShadow: false });
const { scene, textureLoader } = threeCanvas;

const butterflyTexture = textureLoader.load("/butterfly-transparent.webp");
console.log(butterflyTexture);

const butterflyGeo = new three.PlaneGeometry(1, 1, 16, 16);
const butterflyMaterial = new three.ShaderMaterial({
    // wireframe: true,
    side: three.DoubleSide,
    transparent: true,
    depthWrite: false,
    vertexShader,
    fragmentShader,
    uniforms: {
        uTexture: { value: butterflyTexture },
        uTime: { value: 0.0 },
        uFlapSpeed: { value: 5.0 },
        uFlapMagnitude: { value: 0.15 },
    },
});

butterflyGeo.scale(3, 3, 1.5);
const butterfly = new three.Mesh(butterflyGeo, butterflyMaterial);

scene.add(butterfly);

threeCanvas.addAnimationCallback((elapsedTime) => {
    butterflyMaterial.uniforms.uTime.value = elapsedTime;
});
