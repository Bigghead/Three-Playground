import * as three from "three";
import { ThreeCanvas } from "../../../Shared/three-canvas";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import { QuadrantCheck } from "../lib/QuadrantCheck";
import { ButterflyBoid } from "../lib/ButterflyBoid";

const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
if (!canvas) {
    console.error("Canvas element not found.");
}

const threeCanvas = new ThreeCanvas({ canvas, initShadow: false });
const { scene, textureLoader, threeCamera } = threeCanvas;
threeCamera.camera.position.set(0, 0, 20);

/**
 * Butterfly Setup
 */
const instancedMeshCount = 1000;

const butterflyTexture = textureLoader.load("/butterfly-transparent.webp");
const butterflyGeo = new three.PlaneGeometry(1, 1, 2, 2);

// for having the diff "meshes" have different flapping timing
const offsets = new Float32Array(instancedMeshCount);
for (let i = 0; i < instancedMeshCount; i++) {
    offsets[i] = Math.random() * Math.PI * 2;
}

butterflyGeo.setAttribute(
    "instanceOffset",
    new three.InstancedBufferAttribute(offsets, 1),
);

const butterflyMaterial = new three.ShaderMaterial({
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

/**
 * Instanced Meshing
 */
const dummyInstance = new three.Object3D();

const instancedMesh = new three.InstancedMesh(
    butterflyGeo,
    butterflyMaterial,
    instancedMeshCount,
);
instancedMesh.instanceColor = new three.InstancedBufferAttribute(
    new Float32Array(instancedMeshCount * 3),
    3,
);
scene.add(instancedMesh);

const Quadrants = new QuadrantCheck();
const tempColor = new three.Color();
const butterflies: ButterflyBoid[] = Array.from(
    { length: instancedMeshCount },
    () => {
        const boid = new ButterflyBoid(dummyInstance);
        Quadrants.setBoidQuadrant(boid);
        return boid;
    },
);

console.log(Quadrants.quadrants);

threeCanvas.addAnimationCallback("butterfly-update", (elapsedTime) => {
    butterflyMaterial.uniforms.uTime.value = elapsedTime;

    Quadrants.clearQuadrant();

    for (const boid of butterflies) {
        Quadrants.setBoidQuadrant(boid);
    }

    butterflies.forEach((boid, i) => {
        boid.update();
        const { hasNeighbors } = Quadrants.checkNeigbors(boid);

        // ===== Todo: check neighbors in the boid and checnge color / steer off there ===== //
        if (hasNeighbors) {
            tempColor.set(0xff0000);
        } else {
            tempColor.set(0xffffff);
        }

        const matrix = boid.getMatrix(dummyInstance);
        instancedMesh.setMatrixAt(i, matrix);
        instancedMesh.setColorAt(i, tempColor);
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.instanceColor.needsUpdate = true;
});
