import * as three from "three";

const defaultWallHeight = 2.5;
const defaultWallDepth = 0.1;

export class WallBuilder {
    private floorWidth: number;
    private floorDepth: number;
    private wallMaterial: three.MeshStandardMaterial;

    constructor(
        floorWidth: number,
        floorDepth: number,
        textureMap: three.Texture
    ) {
        this.floorWidth = floorWidth;
        this.floorDepth = floorDepth;
        this.wallMaterial = new three.MeshStandardMaterial({
            map: textureMap,
        });
    }

    createWall(width: number, height: number = defaultWallHeight): three.Mesh {
        const wallGeo = new three.BoxGeometry(width, height, defaultWallDepth);
        const wallY = wallGeo.parameters.height / 2 + 0.001;
        const wallMesh = new three.Mesh(wallGeo, this.wallMaterial);
        wallMesh.position.y = wallY;
        console.log(wallGeo.parameters);
        return wallMesh;
    }

    private buildWalls(sceneGroup: three.Group): three.Group {
        const floorWidth = this.floorWidth;
        const floorDepth = this.floorDepth;

        const backWall = this.createWall(floorWidth, defaultWallHeight);
        backWall.position.set(
            0,
            backWall.position.y,
            -(floorDepth / 2 - defaultWallDepth / 2)
        );

        const leftWall = this.createWall(floorDepth, defaultWallHeight);
        leftWall.position.set(
            floorWidth / 2 - defaultWallDepth / 2,
            leftWall.position.y,
            0
        );
        leftWall.rotation.y = Math.PI / 2;

        const rightWall = this.createWall(floorDepth, defaultWallHeight);
        rightWall.position.set(
            -(floorWidth / 2 - defaultWallDepth / 2),
            rightWall.position.y,
            0
        );
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
