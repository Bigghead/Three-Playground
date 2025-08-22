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

	private createWall(
		wallWidth: number,
		wallDepth: number = 0.3
	): {
		geometry: three.BoxGeometry;
		mesh: three.Mesh;
	} {
		const wallGeo = new three.BoxGeometry(wallWidth, 3, wallDepth);
		return {
			geometry: wallGeo,
			mesh: new three.Mesh(wallGeo, this.wallMaterial),
		};
	}

	private getWallConfigs(
		wallGeo: three.BoxGeometry,
		wallGroupType: "room" | "bathroom" = "room"
	) {
		const { height, width, depth } = wallGeo.parameters;

		const wallY = height / 2 + 0.001;
		const wallOffset = width / 2 - depth / 2; //edge of room

		const wallConfigs = {
			room: [
				{
					x: 0,
					y: wallY,
					z: -wallOffset,
				},
				{
					x: -wallOffset,
					y: wallY,
					z: 0,
					rotationY: Math.PI / 2,
				},
				{
					x: wallOffset,
					y: wallY,
					z: 0,
					rotationY: Math.PI / 2,
				},
			],
			bathroom: [
				{
					x: wallOffset,
					y: wallY,
					z: wallOffset,
				},
				{
					x: 0,
					y: wallY,
					z: 0,
					rotationY: Math.PI / 2,
				},
			],
		};
		return wallConfigs[wallGroupType];
	}

	private buildWalls(
		wallConfigs: WallConfigType,
		sceneGroup: three.Group,
		wallMesh: three.Mesh
	): three.Group {
		wallConfigs.forEach((config) => {
			const { x, y, z, rotationY = 0 } = config;
			const newWall = wallMesh.clone();
			newWall.position.set(x, y, z);
			newWall.rotation.y = rotationY;

			sceneGroup.add(newWall);
		});
		return sceneGroup;
	}

	createWalls(): {
		roomWalls: three.Group;
		bathroomWalls: three.Group;
	} {
		const roomWallGroup = new three.Group();
		const bathroomWallGroup = new three.Group();

		const { geometry: roomWallGeo, mesh: roomWallMesh } = this.createWall(10);
		const roomWallConfigs = this.getWallConfigs(roomWallGeo, "room");
		const roomWalls = this.buildWalls(
			roomWallConfigs,
			roomWallGroup,
			roomWallMesh
		);

		const { geometry: bathroomWallGeo, mesh: bathroomWallMesh } =
			this.createWall(3);

		const bathroomWallConfigs = this.getWallConfigs(
			bathroomWallGeo,
			"bathroom"
		);
		const bathroomWalls = this.buildWalls(
			bathroomWallConfigs,
			bathroomWallGroup,
			bathroomWallMesh
		);

		return { roomWalls, bathroomWalls };
	}
}
