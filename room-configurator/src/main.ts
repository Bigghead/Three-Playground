import * as three from "three";
import { ThreeCanvas } from "./lib/three-manager";

const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
if (!canvas) {
	console.error("Canvas element with class 'webgl' not found.");
}

const threeCanvas = new ThreeCanvas({ canvas, initShadow: false });

const room = new three.Group();

const floorMaterial = new three.MeshBasicMaterial({
	color: "white", // need like floor texture later
	side: three.DoubleSide,
});
const floorGeo = new three.PlaneGeometry(10, 10);

const floor = new three.Mesh(floorGeo, floorMaterial);
floor.rotation.x = Math.PI / 2;
const {
	parameters: { width: floorWidth },
} = floorGeo;

const wallGeo = new three.BoxGeometry(10, 3, 0.3);
const wallMaterial = new three.MeshBasicMaterial({
	color: "brown",
});
const {
	parameters: { width: wallWidth, height: wallheight, depth: wallDepth },
} = wallGeo;

const wall = new three.Mesh(wallGeo, wallMaterial);
wall.position.y = wallheight / 2 + 0.001; //z-fighting
wall.position.z = -(floorWidth / 2 - wallDepth / 2);

const wall2 = wall.clone();
wall2.rotation.y = Math.PI / 2;
wall2.position.z = 0;
wall2.position.x = -(floorWidth / 2 - wallDepth / 2);

const wall3 = wall.clone();
wall3.rotation.y = Math.PI / 2;
wall3.position.z = 0;
wall3.position.x = floorWidth / 2 - wallDepth / 2;

const cube = new three.Mesh(
	new three.BoxGeometry(1, 1, 1),
	new three.MeshBasicMaterial({ color: 0x00ff00 })
);

room.add(floor, wall, wall2, wall3);
threeCanvas.scene.add(room, cube);
