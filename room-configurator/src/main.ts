import * as three from "three";
import { ThreeCanvas } from "./lib/three-manager";
import {
	models,
	type ModelConfig,
	type ModelOffset,
} from "./lib/model-configs";
import { type GLTF } from "three/examples/jsm/Addons.js";

const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
if (!canvas) {
	console.error("Canvas element with class 'webgl' not found.");
}

const { textureMaps, scene, modelLoader, threeRaycaster, threeCamera } =
	new ThreeCanvas({
		canvas,
		initShadow: false,
	});

const room = new three.Group();

const floorMaterial = new three.MeshStandardMaterial({
	side: three.DoubleSide,
	map: textureMaps.wood,
});

const floorGeo = new three.PlaneGeometry(10, 10);

const floor = new three.Mesh(floorGeo, floorMaterial);
floor.rotation.x = Math.PI / 2;
const {
	parameters: { width: floorWidth },
} = floorGeo;

const wallGeo = new three.BoxGeometry(10, 3, 0.3);
const wallMaterial = new three.MeshStandardMaterial({
	map: textureMaps.beigeWall,
});

const wall = new three.Mesh(wallGeo, wallMaterial);
const wallGroup = new three.Group();

const getWallConfigs = (wallGeo: three.BoxGeometry) => {
	const { height: wallheight, depth: wallDepth } = wallGeo.parameters;

	const wallY = wallheight / 2 + 0.001;
	const wallOffset = floorWidth / 2 - wallDepth / 2;

	const wallConfigs = [
		{
			x: 0,
			y: wallY,
			z: -wallOffset,
		},
		{
			x: -wallOffset,
			y: wallY,
			z: 0,
			rotation: {
				y: Math.PI / 2,
			},
		},
		{
			x: wallOffset,
			y: wallY,
			z: 0,
			rotation: {
				y: Math.PI / 2,
			},
		},
	];
	return wallConfigs;
};

(function createWalls(): void {
	const wallConfigs = getWallConfigs(wallGeo);
	wallConfigs.forEach((emptyWall) => {
		const { x, y, z, rotation } = emptyWall;
		const newWall = wall.clone();
		newWall.position.set(x, y, z);
		if (rotation) {
			newWall.rotation.y = emptyWall.rotation.y ?? 0;
		}
		wallGroup.add(newWall);
	});
})();

room.add(floor, wallGroup);

/**
 *
 * forces the loaded model to have x percentage width of the room ( scaled cause these models load big )
 */
const normalizeModelScale = (
	model: GLTF,
	roomWidthPercentage: number = 15
): void => {
	const roomBox = new three.Box3().setFromObject(room);
	const roomSize = roomBox.getSize(new three.Vector3());

	const modelBox = new three.Box3().setFromObject(model.scene);
	const modelSize = modelBox.getSize(new three.Vector3());

	const targetWidth = roomSize.x * (roomWidthPercentage / 100);

	const scale = targetWidth / modelSize.x;

	model.scene.scale.setScalar(scale);
};

type OffsetKey = "position" | "rotation";

const applyModelConfigOffset = (
	model: GLTF,
	modelOffset: ModelOffset
): void => {
	for (const key in modelOffset) {
		// I hate TypeScript a lot sometimes
		const offsetKey = key as OffsetKey;
		const offsetValue = modelOffset[offsetKey];

		if (offsetValue) {
			model.scene[offsetKey].set(
				offsetValue.x || 0,
				offsetValue.y || 0,
				offsetValue.z || 0
			);
		}
	}
};

const loadModel = async (modelConfig: ModelConfig): Promise<GLTF> => {
	try {
		const { url, offset } = modelConfig;
		const model = await modelLoader.initModel(url);
		normalizeModelScale(model);

		if (offset) {
			applyModelConfigOffset(model, offset);
		}

		return model;
	} catch (e) {
		console.error(e);
		throw e;
	}
};

// ----- Models ----- //

// testing to see what they look like, can't load them all at once
// for some reason, bed3 is positioned waaaaay outside the room

const bed = await loadModel(models.bed3);
// const bed = await loadModel("/models/bed/bed-2-draco.glb");
// const bed = await loadModel("/models/bed/bed-3-draco.glb");
// const bed = await loadModel("/models/bed/bunk-bed-draco.glb");

scene.add(room);

scene.add(bed.scene);

threeRaycaster.addDraggableModel(bed.scene);

// testing adding multiple models to move around
let bedCount = 1;
const interval = setInterval(async () => {
	if (bedCount >= 6) {
		return clearInterval(interval);
	}
	const bed = await loadModel(models[`bed${bedCount}`]);
	scene.add(bed.scene);
	threeRaycaster.addDraggableModel(bed.scene);
	bedCount++;
}, 2000);

window.addEventListener("mousedown", (event: MouseEvent) => {
	threeRaycaster.onMouseDown(event);
});

window.addEventListener("mouseup", (event: MouseEvent) => {
	threeRaycaster.onMouseUp();
});

window.addEventListener("mousemove", (event: MouseEvent) => {
	threeRaycaster.onMouseMove(event);
});
