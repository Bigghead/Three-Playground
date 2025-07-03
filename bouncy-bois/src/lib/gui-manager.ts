import {
  WorkerEnum,
  type ActivePoolMesh,
  type MeshPool,
  type randomGeometry,
  type WorldObjects,
} from "./constants";
import { createMesh } from "./three-helper";
import { buildRandomVertexPosition } from "./utils";
import * as three from "three";

/**
 * GUI Functions
 */
export class GUIManager {
  floorRotationX = 0;
  isFloorAnimating = false;
  endFloorRotationAngle = 0.25; // stops at 25 degrees
  isRaining = false;
  rainSpeedTimer = 5;
  rainingInterval: number | null = null; // setInterval returns a number type
  rainingDuration = 30;
  rainingTimeout: number | null = null;
  isCameraHelperOn = false;

  private readonly _meshPool: MeshPool[];
  private readonly _worldObjects: Map<string, WorldObjects>;
  private readonly _scene: three.Scene;
  private readonly _worker: Worker;
  private readonly _directionalLightHelper: three.DirectionalLightHelper;
  private readonly _shadowHelper: three.CameraHelper;

  constructor(
    meshPool: MeshPool[],
    worldObjects: Map<string, WorldObjects>,
    scene: three.Scene,
    worker: Worker,
    directionalLightHelper: three.DirectionalLightHelper,
    shadowHelper: three.CameraHelper
  ) {
    this._meshPool = meshPool;
    this._worldObjects = worldObjects;
    this._scene = scene;
    this._worker = worker;
    this._directionalLightHelper = directionalLightHelper;
    this._shadowHelper = shadowHelper;
  }

  public createObject = (geometry = "sphere"): void => {
    // check if any pooled objects exist and use that vs creating new mesh
    let activeObject: ActivePoolMesh;

    if (this._meshPool.length) {
      const pooledMesh = this._meshPool.pop()!; // really need to be shift() / FIFO but pop is faster
      activeObject = this.createObjectFromPool(pooledMesh);
    } else {
      activeObject = this.createObjectNew(geometry);
    }

    this._worker.postMessage({
      type: WorkerEnum.ADD_OBJECTS,
      payload: {
        data: [activeObject],
      },
    });
  };

  private createObjectFromPool = (pooledMesh: MeshPool): ActivePoolMesh => {
    const newPosition = buildRandomVertexPosition();
    pooledMesh?.mesh.position.set(...newPosition);

    pooledMesh.mesh.visible = true;
    this._worldObjects.set(pooledMesh.id, {
      id: pooledMesh.id,
      geometry: pooledMesh.geometry,
      randomScale: pooledMesh.mesh.scale.x,
      position: pooledMesh.mesh.position.toArray(),
      mesh: pooledMesh.mesh,
    });

    return {
      id: pooledMesh.id,
      geometry: pooledMesh.geometry,
      position: newPosition,
      randomScale: pooledMesh.mesh.scale.x,
    };
  };

  private createObjectNew = (geometry: string): ActivePoolMesh => {
    const newMesh = createMesh(geometry as randomGeometry);
    this._worldObjects.set(newMesh.id, newMesh);
    this._scene.add(newMesh.mesh);

    return {
      id: newMesh.id,
      geometry: newMesh.geometry,
      position: newMesh.mesh.position.toArray(),
      randomScale: newMesh.randomScale,
    };
  };

  public tipFloor = (): void => {
    this.isFloorAnimating = true;
  };

  public resetFloor = (): void => {
    this.clearRain();
  };

  public makeItRain = (): void => {
    if (!this.isRaining) {
      this.isRaining = true;
      this.tipFloor();

      this.rainingTimeout = setTimeout(() => {
        this.clearRain();
      }, this.rainingDuration * 1000);

      this.rainingInterval = setInterval(() => {
        this.createObject(Math.random() <= 0.5 ? "sphere" : "box");
      }, this.rainSpeedTimer);
    }
  };

  public clearRain = (): void => {
    this.isFloorAnimating = false;
    if (this.rainingInterval != null) {
      this.isRaining = false;
      clearInterval(this.rainingInterval);
      this.rainingInterval = null;
    }
    if (this.rainingTimeout != null) {
      clearTimeout(this.rainingTimeout);
      this.rainingTimeout = null;
    }
  };

  public updateRain = (speed: number, duration: number): void => {
    if (!this.isRaining) return;
    this.rainSpeedTimer = speed;
    this.rainingDuration = duration;
    this.clearRain();
    this.makeItRain();
  };

  public toggleShadowhelper = (): void => {
    if (this.isCameraHelperOn) {
      this._scene.remove(this._directionalLightHelper, this._shadowHelper);
      this.isCameraHelperOn = false;
    } else {
      this._scene.add(this._directionalLightHelper, this._shadowHelper);
      this.isCameraHelperOn = true;
    }
  };
}
