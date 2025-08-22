import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { type GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

import { ThreeRaycaster } from "./three-raycaster";

let { scrollY } = window;

type Dimensions = {
	width: number;
	height: number;
};

class Sizes {
	width = window.innerWidth * 0.65;
	height = window.innerHeight;

	public resize() {
		this.width = window.innerWidth * 0.65;
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
		this.camera.position.set(0, 5, 8);
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

class ThreeModelLoader {
	gltfLoader: GLTFLoader = new GLTFLoader();
	dracoLoader: DRACOLoader = new DRACOLoader();

	constructor() {
		this.dracoLoader.setDecoderPath("/loader/draco/");
		this.gltfLoader.setDRACOLoader(this.dracoLoader);
	}

	async initModel(modelSrc: string): Promise<GLTF> {
		return new Promise((resolve, reject) => {
			this.gltfLoader.load(
				modelSrc,
				(gltf) => resolve(gltf),
				(progress) => {},
				(e) => {
					console.error(e);
					reject(e);
				}
			);
		});
	}
}

export class ThreeCanvas {
	cursor = { x: 0, y: 0 };
	sizes: Sizes;
	threeCamera: ThreeCamera;
	controls: OrbitControls;
	threeRenderer: ThreeRenderer;
	lighting: ThreeLighting;
	modelLoader: ThreeModelLoader;
	threeRaycaster: ThreeRaycaster;

	scene = new three.Scene();
	textureLoader = new three.TextureLoader();
	clock = new three.Clock();

	textureMaps: Record<string, three.Texture> = {};
	renderCallbacks: Array<() => void> = [];

	constructor({
		canvas,
		initShadow,
	}: {
		canvas: HTMLCanvasElement;
		initShadow: boolean;
	}) {
		console.log(canvas);
		this.sizes = new Sizes();
		this.threeCamera = new ThreeCamera(this.sizes);
		this.controls = new ThreeControls(this.threeCamera.camera, canvas).controls;
		this.threeRenderer = new ThreeRenderer(canvas, this.sizes);
		this.lighting = new ThreeLighting({
			scene: this.scene,
			renderer: this.threeRenderer.renderer,
			initShadow,
		});
		this.modelLoader = new ThreeModelLoader();
		this.threeRaycaster = new ThreeRaycaster({
			canvas,
			camera: this.threeCamera.camera,
			scene: this.scene,
			controls: this.controls,
		});

		this.initTextureMap();

		this.scene.add(
			this.lighting.ambientLight,
			this.lighting.directionalLight,
			this.threeCamera.camera
		);

		// Add event listeners (important for functionality)
		window.addEventListener("resize", this.resizeCanvas);
		window.addEventListener("scroll", this.handleScroll);

		this.animationTick();
	}

	private initTextureMap(): void {
		this.textureMaps = {
			beigeWall: this.textureLoader.load(
				"textures/beige_wall/beige_wall_001_diff_1k.webp"
			),
			laminateFloor: this.textureLoader.load(
				"/textures/laminate_floor/laminate_floor_02_diff_2k.webp"
			),
			plasterWall: this.textureLoader.load(
				"textures/plaster_wall/painted_plaster_wall_diff_1k.webp"
			),
			rosewood: this.textureLoader.load(
				"textures/rosewood/rosewood_veneer1_diff_1k.webp"
			),
			wood: this.textureLoader.load("/textures/wood/wood_floor_diff_1k.webp"),
		};

		for (const map in this.textureMaps) {
			const texture = this.textureMaps[map];
			texture.colorSpace = three.SRGBColorSpace;
			texture.repeat.set(4, 4);
			texture.wrapS = three.RepeatWrapping;
			texture.wrapT = three.RepeatWrapping;
		}
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

	/**
	 * Animate
	 */
	public animationTick = (): void => {
		const elapsedTime = this.clock.getElapsedTime();

		// Update controls
		this.controls.update();

		this.renderCallbacks.forEach((callback) => callback());

		// Render
		this.threeRenderer.renderer.render(this.scene, this.threeCamera.camera);

		// Call tick again on the next frame
		window.requestAnimationFrame(this.animationTick);
	};

	public addRenderCallback(callback: () => void) {
		this.renderCallbacks.push(callback);
	}

	public dispose = (): void => {
		window.removeEventListener("resize", this.resizeCanvas);
		window.removeEventListener("scroll", this.handleScroll);
		this.controls.dispose();
		this.threeRenderer.renderer.dispose();
	};
}
