import * as three from "three";
import { ThreeCanvas } from "./canvas";

import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
if (!canvas) {
    console.error("Canvas element not found.");
}

const { textureLoader, scene } = new ThreeCanvas({ canvas, initShadow: false });

const cube: three.Mesh<three.BoxGeometry, three.MeshBasicMaterial> =
    new three.Mesh(
        new three.BoxGeometry(1, 1, 1),
        new three.MeshBasicMaterial({ color: 0x00ff00 })
    );

scene.add(cube);

const perlinTexture = textureLoader.load("/perlin.png");
console.log(perlinTexture);

const smokeMaterial = new three.ShaderMaterial({
    vertexShader,
    fragmentShader,
});
const smokeMesh = new three.Mesh(
    new three.PlaneGeometry(1, 1, 16, 64),
    smokeMaterial
);

scene.add(smokeMesh);
