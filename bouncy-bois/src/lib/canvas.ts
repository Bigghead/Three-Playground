import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { floorWidth } from "./constants";

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

export class ThreeCanvas {
  scene = new three.Scene();
  ambientLight = new three.AmbientLight(0xffffff, 2.1);
  directionalLight = new three.DirectionalLight("#ffffff", 2);

  camera = new three.PerspectiveCamera(
    75,
    sizes.width / sizes.height,
    0.1,
    100
  );
  directionalLighthelper: three.DirectionalLightHelper;
  shadowHelper: three.CameraHelper;
  controls: OrbitControls;
  renderer: three.WebGLRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.directionalLight.position.set(-10, 10, -10);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.set(1024, 1024);
    this.directionalLight.shadow.camera.far = 40;
    this.directionalLight.shadow.camera.left = -floorWidth * 1.5;
    this.directionalLight.shadow.camera.top = floorWidth * 1.5;
    this.directionalLight.shadow.camera.right = floorWidth * 1.5;
    this.directionalLight.shadow.camera.bottom = -floorWidth * 1.5;

    this.directionalLighthelper = new three.DirectionalLightHelper(
      this.directionalLight
    );
    this.shadowHelper = new three.CameraHelper(
      this.directionalLight.shadow.camera
    );
    this.directionalLighthelper.update();
    this.shadowHelper.update();

    this.camera.position.set(25, 18, 25);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;

    this.renderer = new three.WebGLRenderer({
      canvas,
    });
    this.renderer.setSize(sizes.width, sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // always forget about this with shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = three.PCFSoftShadowMap;

    this.scene.add(this.ambientLight, this.directionalLight, this.camera);
  }

  public resizeCanvas = (): void => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    this.camera.aspect = sizes.width / sizes.height;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer?.setSize(sizes.width, sizes.height);
    this.renderer?.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };
}
