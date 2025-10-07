import * as three from "three";
import { defaultWallDepth, defaultWallHeight } from "./constants";

export class WallBuilder {
    private floorWidth: number;
    private floorDepth: number;
    private wallHeight: number = defaultWallHeight;
    private wallMaterial: three.MeshStandardMaterial;

    constructor({
        floorWidth,
        floorDepth,
        wallHeight,
        textureMap,
    }: {
        floorWidth: number;
        floorDepth: number;
        wallHeight?: number;
        textureMap: three.Texture;
    }) {
        this.floorWidth = floorWidth;
        this.floorDepth = floorDepth;
        if (wallHeight) {
            this.wallHeight = wallHeight;
        }
        this.wallMaterial = new three.MeshStandardMaterial({
            map: textureMap,
        });
    }

    createWall(width: number, height: number = this.wallHeight): three.Mesh {
        const wallGeo = new three.BoxGeometry(width, height, defaultWallDepth);
        const wallY = wallGeo.parameters.height / 2 + 0.001;
        const wallMesh = new three.Mesh(wallGeo, this.wallMaterial);
        wallMesh.position.y = wallY;

        return wallMesh;
    }

    private buildWalls(sceneGroup: three.Group): three.Group {
        const floorWidth = this.floorWidth;
        const floorDepth = this.floorDepth;
        const offsetWallZ = -(floorDepth / 2 - defaultWallDepth / 2);
        const offsetWallX = floorWidth / 2 - defaultWallDepth / 2;

        const backWall = this.createWall(floorWidth, defaultWallHeight);
        backWall.position.set(0, backWall.position.y, offsetWallZ);

        const leftWall = this.createWall(floorDepth, defaultWallHeight);
        leftWall.position.set(offsetWallX, leftWall.position.y, 0);
        leftWall.rotation.y = Math.PI / 2;

        const rightWall = this.createWall(floorDepth, defaultWallHeight);
        rightWall.position.set(-offsetWallX, rightWall.position.y, 0);
        rightWall.rotation.y = Math.PI / 2;

        sceneGroup.add(backWall, leftWall, rightWall);

        return sceneGroup;
    }

    createWalls(): {
        roomWalls: three.Group;
    } {
        const roomWallGroup = new three.Group();

        const roomWalls = this.buildWalls(roomWallGroup);

        return { roomWalls };
    }
}
