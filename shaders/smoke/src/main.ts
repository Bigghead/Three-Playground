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

scene.add(cube, new three.AxesHelper(10));

const perlinTexture = textureLoader.load("/perlin.png");
perlinTexture.wrapS = three.RepeatWrapping;
perlinTexture.wrapT = three.RepeatWrapping;
console.log(perlinTexture);

const smokeGeo = new three.PlaneGeometry(1, 1, 16, 64);
const smokeMaterial = new three.ShaderMaterial({
    // wireframe: true,
    transparent: true,
    side: three.DoubleSide,
    vertexShader,
    fragmentShader,
    uniforms: {
        uPerlinTexture: { value: perlinTexture },
    },
});

// moves the origin / pivot point of the geometry to the very bottom ( height of geo / 2 )
smokeGeo.translate(0, 0.5, 0);
smokeGeo.scale(10, 10, 1.5);
const smokeMesh = new three.Mesh(smokeGeo, smokeMaterial);
smokeMesh.position.y = -5;

scene.add(smokeMesh);
