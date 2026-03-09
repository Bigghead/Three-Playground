import * as three from "three";
import type { QuadrantCheck } from "./QuadrantCheck";

const dummyTempPosition = new three.Vector3(0, 0, 0);

/**
 * Todos:
 * 1) Neighbor collision check / reverse
 * 2) Flock following simulation
 */
export class ButterflyBoid {
    private _maxSpeed = 0.02;
    private _meshBoundary = 30;
    private _boundaryMargin = 5; // where to start slowing down from the boundary, or can hard stop at the boundary

    private _position: three.Vector3 = new three.Vector3(
        (Math.random() - 0.5) * this._meshBoundary,
        (Math.random() - 0.5) * this._meshBoundary,
        (Math.random() - 0.5) * this._meshBoundary,
    );
    private _velocity: three.Vector3 = new three.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5,
    );

    constructor(dummyInstance: three.Object3D) {
        dummyInstance.position.copy(this._position);
    }

    get position() {
        return this._position;
    }

    get velocity() {
        return this._velocity;
    }

    public update(): void {
        const distance = this._position.length();

        if (distance > this._meshBoundary - this._boundaryMargin) {
            this.steerOff(15);
        }

        // speed governor, how much butterfly moves each frame
        this._velocity.clampLength(this._maxSpeed * 0.5, this._maxSpeed);

        // this is the 1st magic, we "add" smooth position vs "set" new position
        this._position.add(this._velocity);
    }

    public getMatrix(dummy: three.Object3D): three.Matrix4 {
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

    private getRandomNewVector3(multiplier: number = 5): three.Vector3 {
        return new three.Vector3(
            (Math.random() - 0.5) * multiplier,
            (Math.random() - 0.5) * multiplier,
            (Math.random() - 0.5) * multiplier,
        );
    }

    private steerOff(multiplier: number = 5) {
        const pushBack = this.getRandomNewVector3(multiplier)
            .clone()
            .sub(this._position)
            .normalize();

        // change direction
        // 0.001 means it takes ~20 frames to fully turn around.
        this._velocity.add(pushBack.multiplyScalar(0.000035));
    }
}
