import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

let { scrollY } = window;

type Dimensions = {
    width: number;
    height: number;
};

class Sizes {
    width = window.innerWidth;
    height = window.innerHeight;

    public resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }
}

class ThreeCamera {
    camera: three.PerspectiveCamera;
    sizes: Dimensions;

    constructor(sizes: Sizes) {
        this.sizes = sizes;
        this.camera = new three.PerspectiveCamera(
            75,
            this.sizes.width / this.sizes.height,
            0.1,
            100,
        );
        this.camera.position.set(3, 3, 3);
    }

    public resize() {
        this.camera.aspect = this.sizes.width / this.sizes.height;
        this.camera.updateProjectionMatrix();
    }

    public updateCameraPosition(newPosition: three.Vector3) {
        const { x, y, z } = newPosition;
        this.camera.position.set(x, y, z);
    }
}

class ThreeRenderer {
    renderer: three.WebGLRenderer;
    sizes: Dimensions;

    constructor(canvas: HTMLCanvasElement, sizes: Sizes) {
        this.renderer = new three.WebGLRenderer({
            canvas,
            // alpha: true,
        });
        this.sizes = sizes;
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    public resize() {
        this.renderer?.setSize(this.sizes.width, this.sizes.height);
        this.renderer?.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
}

class ThreeControls {
    controls: OrbitControls;

    constructor(camera: three.PerspectiveCamera, canvas: HTMLCanvasElement) {
        this.controls = new OrbitControls(camera, canvas);
        this.controls.enableDamping = true;
    }
}

class ThreeLighting {
    ambientLight = new three.AmbientLight(0xffffff, 2.1);
    directionalLight = new three.DirectionalLight("#ffffff", 2);
    scene: three.Scene;
    renderer: three.WebGLRenderer;
    directionalLighthelper: three.DirectionalLightHelper | null = null;
    shadowHelper: three.CameraHelper | null = null;

    constructor({
        scene,
        renderer,
        initShadow = false,
    }: {
        scene: three.Scene;
        renderer: three.WebGLRenderer;
        initShadow?: boolean;
    }) {
        this.scene = scene;
        this.renderer = renderer;
        this.directionalLight.position.set(-10, 10, -10);
        if (initShadow) {
            this.initShadow();
        }
    }

    initShadow = (): void => {
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.set(1024, 1024);
        this.directionalLight.shadow.camera.far = 40;
        this.directionalLight.shadow.camera.left = -10;
        this.directionalLight.shadow.camera.top = 10;
        this.directionalLight.shadow.camera.right = 10;
        this.directionalLight.shadow.camera.bottom = -10;

        this.directionalLight.shadow.camera.updateProjectionMatrix();
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = three.PCFSoftShadowMap;

        this.directionalLighthelper = new three.DirectionalLightHelper(
            this.directionalLight,
        );
        this.shadowHelper = new three.CameraHelper(
            this.directionalLight.shadow.camera,
        );
        this.directionalLighthelper.update();
        this.shadowHelper.update();
        this.scene.add(this.directionalLighthelper);
        this.scene.add(this.shadowHelper);
    };
}

class ThreeRaycaster {
    /**
     * Mouse tracking on 2d flat plane
     */
    raycaster = new three.Raycaster();
    // ==== empty coords to store where we intersect ===== //
    mouseWorld = new three.Vector3();
    // ===== infinite flat plane facing camera, on z axis ===== //
    plane = new three.Plane(new three.Vector3(0, 0, 1), 0);

    constructor() {}

    /**
     *
     * Convert a 2d coordinate ( defaults with mouse ) into usable threejs world coordinates.
     * Useful for cursor tracking
     * @returns threejs vector3 coordinates
     */
    public getNormalizedDeviceCoords = (
        coords: three.Vector2,
        camera: three.Camera,
    ): three.Vector3 => {
        /**
         * track 2d coordinated from camera, store when we intersect ( infinite flat plane ) in mouseworld coords
         */
        this.raycaster.setFromCamera(coords, camera);
        this.raycaster.ray.intersectPlane(this.plane, this.mouseWorld);

        return this.mouseWorld;
    };
}

export class ThreeCanvas {
    /**
     * set this to some insane offsides vector
     * cause our object starts at 0,0 for animation
     * might break other things later
     */
    cursor = new three.Vector2(9999, 9999);

    sizes: Sizes;
    threeCamera: ThreeCamera;
    controls: OrbitControls;
    threeRenderer: ThreeRenderer;
    lighting: ThreeLighting;
    threeRaycaster: ThreeRaycaster;

    scene = new three.Scene();
    textureLoader = new three.TextureLoader();
    clock = new three.Clock();

    animationCallbacks: Array<(time: number) => void> = [];

    constructor({
        canvas,
        initShadow,
    }: {
        canvas: HTMLCanvasElement;
        initShadow: boolean;
    }) {
        this.sizes = new Sizes();
        this.threeCamera = new ThreeCamera(this.sizes);
        this.controls = new ThreeControls(
            this.threeCamera.camera,
            canvas,
        ).controls;
        this.threeRenderer = new ThreeRenderer(canvas, this.sizes);
        this.lighting = new ThreeLighting({
            scene: this.scene,
            renderer: this.threeRenderer.renderer,
            initShadow,
        });
        this.threeRaycaster = new ThreeRaycaster();

        this.scene.add(
            this.lighting.ambientLight,
            this.lighting.directionalLight,
            this.threeCamera.camera,
        );

        // Add event listeners (important for functionality)
        window.addEventListener("resize", this.resizeCanvas);
        window.addEventListener("scroll", this.handleScroll);
        window.addEventListener("mousemove", this.handleMouseMove);

        this.animationTick();
    }

    /**
     * Event Actions
     */
    public resizeCanvas = (): void => {
        // Update sizes
        this.sizes.resize();
        // Update camera
        this.threeCamera.resize();
        // Update renderer
        this.threeRenderer.resize();
    };

    public handleScroll = (): void => {
        scrollY = window.scrollY;
    };

    public handleMouseMove = (e: MouseEvent): void => {
        const { clientX, clientY } = e;
        const { width, height } = this.sizes;
        this.cursor.x = (clientX / width) * 2 - 1;
        this.cursor.y = -(clientY / height) * 2 + 1;
    };

    /**
     * Animate
     */
    public animationTick = (): void => {
        stats.begin();

        const elapsedTime = this.clock.getElapsedTime();

        this.controls.update();

        this.animationCallbacks.forEach((callback) => callback(elapsedTime));

        this.renderFrame();

        stats.end();

        window.requestAnimationFrame(this.animationTick);
    };

    public addAnimationCallback(callback: (time: number) => void) {
        this.animationCallbacks.push(callback);
    }

    public dispose = (): void => {
        window.removeEventListener("resize", this.resizeCanvas);
        window.removeEventListener("scroll", this.handleScroll);
        window.removeEventListener("mousemove", this.handleMouseMove);
        this.controls.dispose();
        this.threeRenderer.renderer.dispose();
    };

    // ===== Make different renderers able to be set from inherited children  ===== //
    protected renderFrame(): void {
        this.threeRenderer.renderer.render(this.scene, this.threeCamera.camera);
    }
}
