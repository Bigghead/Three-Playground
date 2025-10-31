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
        uFlapMagnitude: { value: 1.0 },
    },
});

butterflyGeo.scale(3, 3, 1.5);
const butterfly = new three.Mesh(butterflyGeo, butterflyMaterial);
butterfly.rotation.x = -Math.PI / 2;
butterfly.rotation.set(
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2
);

scene.add(butterfly);

// ===== Testing movment with just threejs ===== //
/**
 * This is wonky, might have to test out boids algo in js
 */
const start = new three.Vector3(0, 0, 0);

const control = new three.Vector3(
    Math.random() * 2 - 1,
    Math.random() * 2,
    Math.random() * 2 - 1
);

const end = new three.Vector3(
    Math.random() * 2 + 2,
    Math.random() * 1,
    Math.random() * 2 - 1
);

const curve = new three.QuadraticBezierCurve3(start, control, end);
let move = 0;

threeCanvas.addAnimationCallback((elapsedTime) => {
    butterflyMaterial.uniforms.uTime.value = elapsedTime;

    // todo - change the mesh position to follow a flight direction following
    // where its head is pointing

    // kinda works but wonky
    move += 0.002;
    if (move > 1) move = 0;

    const point = curve.getPointAt(move);
    butterfly.position.copy(point);

    const tangent = curve.getTangentAt(move);
    butterfly.lookAt(point.clone().add(tangent));
});
