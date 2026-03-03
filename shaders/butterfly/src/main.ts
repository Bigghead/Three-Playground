import * as three from "three";
import { ThreeCanvas } from "../../../Shared/three-canvas";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import { generateUUID } from "three/src/math/MathUtils.js";

const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
if (!canvas) {
    console.error("Canvas element not found.");
}

const threeCanvas = new ThreeCanvas({ canvas, initShadow: false });
const { scene, textureLoader } = threeCanvas;

const butterflyTexture = textureLoader.load("/butterfly-transparent.webp");

const butterflyGeo = new three.PlaneGeometry(1, 1, 16, 16);

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
 * Instanced Mesh
 */
const instancedMeshCount = 1;
const dummyInstance = new three.Object3D();
const dummyTempPosition = new three.Vector3(0, 0, 0);

const instanceMesh = new three.InstancedMesh(
    butterflyGeo,
    butterflyMaterial,
    instancedMeshCount,
);
scene.add(instanceMesh);

class ButterflyBoid {
    private _position: three.Vector3 = new three.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
    );
    private _velocity: three.Vector3 = new three.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5,
    );
    private _maxSpeed = 0.02;

    constructor() {
        dummyInstance.position.copy(this._position);
    }

    get position() {
        return this._position;
    }

    get velocity() {
        return this._velocity;
    }

    public update() {
        // speed governor, how much butterfly moves each frame
        this._velocity.clampLength(0, this._maxSpeed);

        // this is the 1st magic, we "add" smooth position vs "set" new position
        this._position.add(this._velocity);
    }

    public getMatrix(dummy: three.Object3D) {
        dummy.position.copy(this._position);

        // need to kinda redo the position update cause we're telling the "mesh" to look forward
        // we're not moving the mesh here
        const target = dummyTempPosition
            .copy(this._position)
            .add(this._velocity);

        // 2nd magic, tells the head to look at a direction
        dummy.lookAt(target);

        /**
         * this "flips" the mesh so its head is pointing towards velocity
         * we set it last cause "lookAt" above resets the object rotation ( destructive action )
         */
        dummy.rotateX(Math.PI / 2);
        dummy.updateMatrix();
        return dummy.matrix;
    }
}

const butterflies: ButterflyBoid[] = Array.from(
    { length: instancedMeshCount },
    () => new ButterflyBoid(),
);

threeCanvas.addAnimationCallback("butterfly-update", (elapsedTime) => {
    butterflyMaterial.uniforms.uTime.value = elapsedTime;

    butterflies.forEach((b, i) => {
        b.update();

        const matrix = b.getMatrix(dummyInstance);
        // instanceMesh.setMatrixAt(i, matrix);
    });

    instanceMesh.instanceMatrix.needsUpdate = true;
});
