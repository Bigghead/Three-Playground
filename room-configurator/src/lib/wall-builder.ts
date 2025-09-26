import * as three from "three";
import type { ModelVector3 } from "./model-configs";

// walls are only rotated on y axis, unless you're a weirdo and want to flip on z
type WallConfigType = Array<
	ModelVector3 & {
		rotationY?: number;
	}
>;

export class WallBuilder {
	private floorWidth: number;
	private wallMaterial: three.MeshStandardMaterial;

	constructor(floorWidth: number, textureMap: three.Texture) {
		this.floorWidth = floorWidth;
		this.wallMaterial = new three.MeshStandardMaterial({
			map: textureMap,
		});
	}

	createWall(
		wallWidth: number,
		wallDepth: number = 0.1
	): {
		geometry: three.BoxGeometry;
		mesh: three.Mesh;
	} {
		const wallGeo = new three.BoxGeometry(wallWidth, 2.5, wallDepth);
		const wallY = wallGeo.parameters.height / 2 + 0.001;
		const wallMesh = new three.Mesh(wallGeo, this.wallMaterial);
		wallMesh.position.y = wallY;

		return {
			geometry: wallGeo,
			mesh: wallMesh,
		};
	}

	private getWallConfigs(wallGeo: three.BoxGeometry, wallGroupType = "room") {
		const { height, width, depth } = wallGeo.parameters;

		const wallY = height / 2 + 0.001;
		const wallOffset = width / 2 - depth / 2; //edge of room

		const wallConfigs = {
			room: [
				{
					x: 0,
					z: -wallOffset,
				},
				{
					x: -wallOffset,
					z: 0,
					rotationY: Math.PI / 2,
				},
				{
					x: wallOffset,
					z: 0,
					rotationY: Math.PI / 2,
				},
			],
		};
		return wallConfigs[wallGroupType as keyof typeof wallConfigs];
	}

	private buildWalls(
		wallConfigs: WallConfigType,
		sceneGroup: three.Group,
		wallMesh: three.Mesh
	): three.Group {
		wallConfigs.forEach((config) => {
			const { x, y, z, rotationY = 0 } = config;
			const newWall = wallMesh.clone();
			newWall.position.set(x, wallMesh.position.y, z);
			newWall.rotation.y = rotationY;

			sceneGroup.add(newWall);
		});
		return sceneGroup;
	}

	createWalls(): {
		roomWalls: three.Group;
	} {
		const roomWallGroup = new three.Group();

		const { geometry: roomWallGeo, mesh: roomWallMesh } = this.createWall(10);
		const roomWallConfigs = this.getWallConfigs(roomWallGeo, "room");
		const roomWalls = this.buildWalls(
			roomWallConfigs,
			roomWallGroup,
			roomWallMesh
		);

		return { roomWalls };
	}
}
