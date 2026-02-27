import * as three from "three";
import { ThreeCanvas } from "@/../Shared/three-canvas";
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
    wireframe: true,
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

class ButterflyBoid {
    private _mesh: three.Mesh;
    private _position: three.Vector3;
    private _velocity: three.Vector3;
    private _maxSpeed = 0.005;

    constructor(
        geometry: typeof butterflyGeo,
        material: typeof butterflyMaterial,
    ) {
        this._mesh = new three.Mesh(geometry, material);
        this._position = this._mesh.position;
        this._velocity = new three.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5,
        );
        this._maxSpeed = 0.05;
        this._position.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
        );
    }

    public get mesh() {
        return this._mesh;
    }

    public update() {
        // speed governor, how much butterfly moves each frame
        this._velocity.clampLength(0, this._maxSpeed);

        // this is the 1st magic, we "add" smooth position vs "set" new position
        this._position.add(this._velocity);

        // 2nd magic, tells the head to look at a direction
        const target = this._position.clone().add(this._velocity);
        this._mesh.lookAt(target);

        /**
         * this "flips" the mesh so its head is pointing towards velocity
         * we set it last cause "lookAt" above resets the object rotation ( destructive action )
         */
        this._mesh.rotateX(Math.PI / 2);
    }
}

const butterflies: ButterflyBoid[] = [];
for (let i = 0; i < 1; i++) {
    const b = new ButterflyBoid(butterflyGeo, butterflyMaterial);

    scene.add(b.mesh);
    butterflies.push(b);
}

threeCanvas.addAnimationCallback(generateUUID(), (elapsedTime) => {
    butterflyMaterial.uniforms.uTime.value = elapsedTime;

    butterflies.forEach((b) => {
        b.update();
    });
});
