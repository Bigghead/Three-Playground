import * as three from "three";
import { ThreeCanvas } from "./lib/three-manager";
import { type GLTF } from "three/examples/jsm/Addons.js";

const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
if (!canvas) {
	console.error("Canvas element with class 'webgl' not found.");
}

const { textureMaps, scene, modelLoader } = new ThreeCanvas({
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

const loadModel = async (url: string): Promise<GLTF> => {
	try {
		const model = await modelLoader.initModel(url);
		return model;
	} catch (e) {
		console.error(e);
		throw e;
	}
};

// Models
const cube = new three.Mesh(
	new three.BoxGeometry(1, 1, 1),
	new three.MeshBasicMaterial({ color: 0x00ff00 })
);

const bed1 = await loadModel("/models/bed/bed-agape-draco.glb");
scene.add(bed1.scene);

room.add(floor, wallGroup);
scene.add(room, cube);
