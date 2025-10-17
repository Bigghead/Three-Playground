import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

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
            100
        );
        this.camera.position.set(3, 3, 3);
    }

    public resize() {
        this.camera.aspect = this.sizes.width / this.sizes.height;
        this.camera.updateProjectionMatrix();
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
            this.directionalLight
        );
        this.shadowHelper = new three.CameraHelper(
            this.directionalLight.shadow.camera
        );
        this.directionalLighthelper.update();
        this.shadowHelper.update();
        this.scene.add(this.directionalLighthelper);
        this.scene.add(this.shadowHelper);
    };
}

export class ThreeCanvas {
    cursor = { x: 0, y: 0 };
    sizes: Sizes;
    threeCamera: ThreeCamera;
    controls: OrbitControls;
    threeRenderer: ThreeRenderer;
    lighting: ThreeLighting;

    scene = new three.Scene();
    textureLoader = new three.TextureLoader();
    clock = new three.Clock();

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
            canvas
        ).controls;
        this.threeRenderer = new ThreeRenderer(canvas, this.sizes);
        this.lighting = new ThreeLighting({
            scene: this.scene,
            renderer: this.threeRenderer.renderer,
            initShadow,
        });

        this.scene.add(
            this.lighting.ambientLight,
            this.lighting.directionalLight,
            this.threeCamera.camera
        );

        // Add event listeners (important for functionality)
        window.addEventListener("resize", this.resizeCanvas);

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

    /**
     * Animate
     */
    public animationTick = (): void => {
        const elapsedTime = this.clock.getElapsedTime();

        // Update controls
        this.controls.update();

        // Render
        this.threeRenderer.renderer.render(this.scene, this.threeCamera.camera);

        // Call tick again on the next frame
        window.requestAnimationFrame(this.animationTick);
    };

    public dispose = (): void => {
        window.removeEventListener("resize", this.resizeCanvas);

        this.controls.dispose();
        this.threeRenderer.renderer.dispose();
    };
}
