import * as three from "three";
import { ThreeCanvas } from "./lib/three-manager";
import {
	modelRoomScales,
	models,
	type ModelConfig,
	type ModelOffset,
	type ModelVector3,
} from "./lib/model-configs";
import { type GLTF } from "three/examples/jsm/Addons.js";
import { WallBuilder } from "./lib/wall-builder";
import type { ModelName, ModelType } from "./lib/types";

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
const roomBox = new three.Box3().setFromObject(room);
const roomSize = roomBox.getSize(new three.Vector3());
threeRaycaster.setRoomBoundingBox(roomSize);

/**
 *
 * forces the loaded model to have x percentage width of the room ( scaled cause these models load big )
 */
const normalizeModelScale = (
	model: GLTF,
	roomWidthPercentage: number
): void => {
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

const loadModel = async (
	modelConfig: ModelConfig,
	modelScale: number = 15
): Promise<three.Group> => {
	try {
		const wrapper = new three.Group();
		const { url, offset } = modelConfig;
		const model = await modelLoader.initModel(url);
		normalizeModelScale(model, modelScale);

		if (offset) {
			applyModelConfigOffset(model, offset);
		}

		wrapper.add(model.scene);
		return wrapper;
	} catch (e) {
		console.error(e);
		throw e;
	}
};

// ----- Models ----- //
const bed = await loadModel(models.bed.bed1);

const bathroom = new three.Group();
bathroom.add(bathroomWalls);
bathroom.rotation.y = Math.PI / 2;
bathroom.position.x = -1.5;
bathroom.position.z = -0.5;

const toilet = await loadModel(models.bathroom.toilet, 10);
toilet.rotation.y = -Math.PI / 2;
toilet.position.set(3.75, 0.01, -1.2);

const shower = await loadModel(models.bathroom.shower, 12.5);
shower.rotation.y = Math.PI / 2;
shower.position.set(3.8, 0.001, -2.725);

const sink = await loadModel(models.bathroom.sink, 10);

sink.rotation.y = -Math.PI / 2;

sink.position.set(1, 1.2, -3);
bathroom.add(toilet, shower, sink);

scene.add(room, bathroom);

scene.add(bed);

threeRaycaster.addDraggableModel(bed);

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

export const renderModel = async (
	modelType: ModelType,
	modelName: ModelName
): Promise<void> => {
	console.log(modelName);
	const model = await loadModel(
		models[modelType][modelName],
		modelRoomScales[modelType as keyof typeof modelRoomScales]
	);
	scene.add(model);
	threeRaycaster.addDraggableModel(model);
};
