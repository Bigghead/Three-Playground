import * as three from "three";
import Stats from "stats.js";
import GUI from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Position } from "./lib/types";

/**
 * Base
 */
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

const gui = new GUI();

const defaultCamera: Record<string, Position> = {
  superSmol: [20, 48, -92],
  mobile: [25, 60, -110],
  tablet: [30, 35, -72],
  desktop: [34, 30, -45.5],
};

const getDefaultCamera = (width: number): Position => {
  if (width <= 500) return defaultCamera.superSmol;
  if (width <= 768) return defaultCamera.mobile;
  if (width <= 1200) return defaultCamera.tablet;
  return defaultCamera.desktop;
};

export class GUIManager {
  constructor({
    canvas,
    initCamera,
  }: {
    canvas: ThreeCanvas;
    initCamera: boolean;
  }) {
    this.init(canvas, initCamera);
  }

  init(canvas: ThreeCanvas, initCamera: boolean) {
    if (initCamera) {
      gui.add(canvas.camera.position, "x", -70, 70, 1);
      gui.add(canvas.camera.position, "y", -70, 70, 1);
      gui.add(canvas.camera.position, "z", -70, 70, 1);
    }
  }
}

type AnimatedMesh = three.Mesh | three.Group;
type AnimatedObject = {
  object: AnimatedMesh;
  animationFunc: (object: AnimatedMesh) => void;
};

export class ThreeCanvas {
  sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  cursor = { x: 0, y: 0 };

  scene = new three.Scene();
  ambientLight = new three.AmbientLight(0xffffff, 0.3);
  directionalLight = new three.DirectionalLight(new three.Color("#FFCB8E"), 5);
  camera = new three.PerspectiveCamera(
    75,
    this.sizes.width / this.sizes.height,
    1,
    500
  );
  textureLoader = new three.TextureLoader();
  clock = new three.Clock();

  directionalLighthelper: three.DirectionalLightHelper | null = null;
  shadowHelper: three.CameraHelper | null = null;
  controls: OrbitControls;
  renderer: three.WebGLRenderer;
  stats: Stats;
  objectsToAnimate: AnimatedObject[] = [];

  constructor({
    canvas,
    initShadow,
  }: {
    canvas: HTMLCanvasElement;
    initShadow: boolean;
  }) {
    this.directionalLight.position.set(0, 15, 15);

    this.camera.position.set(...getDefaultCamera(this.sizes.width));

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;

    this.stats = stats;
    // camera check, leaving this in
    this.controls.addEventListener("change", () =>
      console.log(this.controls.object.position)
    );

    this.renderer = new three.WebGLRenderer({
      canvas,
    });
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (initShadow) {
      this.initShadow();
    }
    this.scene.add(this.ambientLight, this.directionalLight, this.camera);

    // Add event listeners (important for functionality)
    window.addEventListener("resize", this.resizeCanvas);
    window.addEventListener("scroll", this.handleScroll);
    window.addEventListener("mousemove", this.handleMouseMove);

    this.animationTick();
  }

  initShadow = (): void => {
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.set(1024, 1024);
    this.directionalLight.shadow.camera.far = 50;
    this.directionalLight.shadow.camera.left = -30;
    this.directionalLight.shadow.camera.top = 30;
    this.directionalLight.shadow.camera.right = 30;
    this.directionalLight.shadow.camera.bottom = -30;

    this.directionalLight.shadow.camera.updateProjectionMatrix();

    this.directionalLighthelper = new three.DirectionalLightHelper(
      this.directionalLight
    );
    this.shadowHelper = new three.CameraHelper(
      this.directionalLight.shadow.camera
    );
    this.directionalLighthelper.update();
    this.shadowHelper.update();

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = three.PCFSoftShadowMap;
    // this.scene.add(this.directionalLighthelper, this.shadowHelper);
  };

  /**
   * Event Actions
   */
  public resizeCanvas = (): void => {
    // Update sizes
    this.sizes.width = window.innerWidth;
    this.sizes.height = window.innerHeight;

    // Update camera
    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer?.setSize(this.sizes.width, this.sizes.height);
    this.renderer?.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  public handleScroll = (): void => {
    scrollY = window.scrollY;
  };

  public handleMouseMove = (e: MouseEvent): void => {
    const { clientX, clientY } = e;
    const { width, height } = this.sizes;
    this.cursor.x = clientX / width - 0.5;
    this.cursor.y = clientY / height - 0.5;
  };

  /**
   * Animate
   */
  public animationTick = (): void => {
    if (this.stats) this.stats.begin();

    // Update controls
    this.controls.update();

    this.objectsToAnimate.forEach(({ object, animationFunc }) => {
      animationFunc(object);
    });
    // Render
    this.renderer.render(this.scene, this.camera);

    // Call tick again on the next frame
    if (this.stats) this.stats.end();
    window.requestAnimationFrame(this.animationTick);
  };

  public addAnimatedObject = (object: AnimatedObject): void => {
    this.objectsToAnimate.push(object);
  };

  public dispose = (): void => {
    window.removeEventListener("resize", this.resizeCanvas);
    window.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener("mousemove", this.handleMouseMove);
    this.controls.dispose();
    this.renderer.dispose();
    gui.destroy();
  };
}
