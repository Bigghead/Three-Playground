import * as three from "three";

import {
    GLTFLoader,
    type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

import { ThreeCanvas } from "@/../Shared/three-canvas";
import { ThreeRaycaster } from "./three-raycaster";

type TextureCache = {
    textureMap?: three.Texture;
    normalMap?: three.Texture;
    armMap?: three.Texture;
};

type TextureEntry = {
    texture: string;
    normal?: string;
    arm?: string;
    hasCached: boolean;
    loadedMaps: TextureCache;
};

type TextureMap = {
    [key: string]: TextureEntry;
};

const createTextureEntry = (
    data: Partial<TextureEntry> & { texture: string },
): TextureEntry => ({
    hasCached: false,
    loadedMaps: {},
    ...data,
});

class ThreeModelLoader {
    gltfLoader: GLTFLoader = new GLTFLoader();
    dracoLoader: DRACOLoader = new DRACOLoader();

    constructor() {
        this.dracoLoader.setDecoderPath("/loader/draco/");
        this.gltfLoader.setDRACOLoader(this.dracoLoader);
    }

    async initModel(
        modelSrc: string,
        progressCallback?: (progress: ProgressEvent) => void,
    ): Promise<GLTF> {
        // ===== Todo - caching the promise works but it breaks the progress callback ===== //
        return new Promise<GLTF>((resolve, reject) => {
            this.gltfLoader.load(
                modelSrc,
                (gltf) => resolve(gltf),
                (progress) => {
                    if (progressCallback) {
                        progressCallback(progress);
                    }
                },
                (e) => {
                    console.error(e);
                    reject(e);
                },
            );
        });
    }
}

export class ThreeCanvasLocal extends ThreeCanvas {
    modelLoader: ThreeModelLoader;
    threeRaycasterLocal: ThreeRaycaster;

    textureMaps: TextureMap = {};
    renderCallbacks: Array<() => void> = [];

    constructor({
        canvas,
        initShadow,
    }: {
        canvas: HTMLCanvasElement;
        initShadow: boolean;
    }) {
        super({
            canvas,
            initShadow,
        });

        this.threeCamera.camera.position.set(0, 7, 10);
        this.modelLoader = new ThreeModelLoader();
        this.threeRaycasterLocal = new ThreeRaycaster({
            canvas,
            camera: this.threeCamera.camera,
            scene: this.scene,
            controls: this.controls,
            renderer: this.threeRenderer.renderer,
        });
        this.lighting.ambientLight.color.set("#FFDBBB");
        this.lighting.directionalLight.color.set("#ffffff");

        this.resizeCameraAndRenderer(canvas);

        this.initTextureMap();

        this.scene.add(
            this.lighting.ambientLight,
            this.lighting.directionalLight,
            this.threeCamera.camera,
        );

        window.addEventListener("resize", () =>
            this.resizeCameraAndRenderer(canvas),
        );
        window.addEventListener("scroll", this.handleScroll);
    }

    private initTextureMap(): void {
        this.textureMaps = {
            "beige-wall": createTextureEntry({
                texture: "textures/beige_wall/beige_wall_001_diff_1k.webp",
            }),
            "plaster-wall": createTextureEntry({
                texture:
                    "textures/plaster_wall/painted_plaster_wall_diff_1k.webp",
            }),
            "rosewood-floor": createTextureEntry({
                texture: "textures/rosewood/rosewood_veneer1_diff_1k.webp",
                normal: "textures/rosewood/rosewood_veneer1_nor_gl_1k.webp",
                arm: "textures/rosewood/rosewood_veneer1_arm_1k.webp",
            }),
            "laminate-floor": createTextureEntry({
                texture:
                    "/textures/laminate_floor/laminate_floor_02_diff_2k.webp",
                normal: "/textures/laminate_floor/laminate_floor_02_nor_gl_1k.webp",
                arm: "/textures/laminate_floor/laminate_floor_02_arm_1k.webp",
            }),
            "wood-floor": createTextureEntry({
                texture: "/textures/wood_floor/wood_floor_diff_1k.webp",
                normal: "/textures/wood_floor/wood_floor_nor_dx_1k.webp",
                arm: "/textures/wood_floor/wood_floor_arm_1k.webp",
            }),
            "granite-tile": createTextureEntry({
                texture: "/textures/granite_tile/granite_tile_diff_1k.webp",
                normal: "/textures/granite_tile/granite_tile_nor_dx_1k.webp",
                arm: "/textures/granite_tile/granite_tile_arm_1k.webp",
            }),
        };
    }

    public normalizeTextureMap(texture: three.Texture): void {
        texture.colorSpace = three.SRGBColorSpace;
        texture.wrapS = three.RepeatWrapping;
        texture.wrapT = three.RepeatWrapping;
        texture.repeat.set(4, 4);
    }

    public loadTexture = async (key: string): Promise<TextureCache> => {
        const entry = this.textureMaps[key];

        if (entry.hasCached) {
            return entry.loadedMaps;
        }

        const loader = this.textureLoader;

        const [textureMap, normalMap, armMap] = await Promise.all([
            loader.loadAsync(entry.texture),
            entry.normal
                ? loader.loadAsync(entry.normal)
                : Promise.resolve(undefined),
            entry.arm
                ? loader.loadAsync(entry.arm)
                : Promise.resolve(undefined),
        ]);

        this.normalizeTextureMap(textureMap);
        entry.loadedMaps = { textureMap, normalMap, armMap };
        entry.hasCached = true;

        return entry.loadedMaps;
    };

    /**
     * Event Actions
     */
    public resizeCanvasLocal =
        (canvas: HTMLCanvasElement): (() => void) =>
        () => {
            this.resizeCanvas();

            this.threeRaycasterLocal.collisionManager.setNewCanvasBounds(
                canvas,
            );
        };

    private updateCanvasSize(canvas: HTMLCanvasElement) {
        const fullscreenSizeMax = 0.65;
        const isMobile = window.innerWidth <= 768;

        const width = isMobile
            ? window.innerWidth
            : window.innerWidth * fullscreenSizeMax;
        const height = window.innerHeight;

        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        this.threeRaycasterLocal.collisionManager.setNewCanvasBounds(canvas);

        return { width, height };
    }

    private resizeCameraAndRenderer(canvas: HTMLCanvasElement) {
        const { width, height } = this.updateCanvasSize(canvas);

        // Update camera
        this.threeCamera.camera.aspect = width / height;
        this.threeCamera.camera.updateProjectionMatrix();

        // Update renderer
        this.threeRenderer.renderer.setSize(width, height, false);
        this.threeRenderer.renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 2),
        );
    }

    /**
     * Overrides standard renderer, using raycaster's composer
     */
    protected override renderFrame(): void {
        if (this.threeRaycasterLocal) {
            this.threeRaycasterLocal.animate();
        } else {
            super.renderFrame();
        }
    }
}
