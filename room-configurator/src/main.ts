import * as three from "three";
import { ThreeCanvas } from "./lib/three-manager";
import {
	models,
	type ModelConfig,
	type ModelOffset,
	type ModelVector3,
} from "./lib/model-configs";
import { type GLTF } from "three/examples/jsm/Addons.js";
import { WallBuilder } from "./lib/wall-builder";

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

const wallBuilder = new WallBuilder(floorWidth, textureMaps.plasterWall);
const { roomWalls, bathroomWalls } = wallBuilder.createWalls();

room.add(floor, roomWalls);

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

const bathroom = new three.Group();
bathroom.add(bathroomWalls);

scene.add(room, bathroom);
bathroom.rotation.y = Math.PI / 2;

scene.add(bed.scene);

threeRaycaster.addDraggableModel(bed.scene);

// testing adding multiple models to move around
let bedCount = 1;
const interval = setInterval(async () => {
	if (bedCount > 6) {
		return clearInterval(interval);
	}
	const bed = await loadModel(models[`bed${bedCount}`]);
	scene.add(bed.scene);
	threeRaycaster.addDraggableModel(bed.scene);
	bedCount++;
}, 2000);

window.addEventListener("mousedown", (event: MouseEvent) => {
	if (event.button !== 0) return;
	threeRaycaster.onMouseDown(event);
});

window.addEventListener("mouseup", (event: MouseEvent) => {
	if (event.button !== 0) return;
	threeRaycaster.onMouseUp();
});

window.addEventListener("mousemove", (event: MouseEvent) => {
	threeRaycaster.onMouseMove(event);
});
