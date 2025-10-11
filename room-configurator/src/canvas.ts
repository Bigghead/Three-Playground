import * as three from "three";
import { ThreeCanvas } from "./lib/three-manager";
import {
    models,
    type ModelConfig,
    type ModelOffset,
} from "./lib/model-configs";
import { type GLTF } from "three/examples/jsm/Addons.js";
import { WallBuilder } from "./lib/wall-builder";
import type {
    DimensionChange,
    EditableTextures,
    ModelName,
    ModelType,
} from "./lib/types";
import {
    defaultRoomWidth,
    defaultWallHeight,
    ROOM_DEPTH,
    ROOM_HEIGHT,
    ROOM_WIDTH,
    WALL_DIVIDER,
} from "./lib/constants";

const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
if (!canvas) {
    console.error("Canvas element with class 'webgl' not found.");
}

const { textureMaps, scene, modelLoader, threeRaycaster, threeCamera } =
    new ThreeCanvas({
        canvas,
        initShadow: false,
    });

const defaultFloorDimension = 10;
const room = new three.Group();
let wallBuilder: WallBuilder | null = null;
let roomSize: three.Vector3 = new three.Vector3(0, 0, 0);
let floorMesh: three.Mesh;

const removeMeshMaterial = (mesh: three.Mesh): void => {
    if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
    } else if (mesh.material) {
        mesh.material.dispose();
    }
};

const removeGroupChildren = (group: three.Group): void => {
    while (group.children.length > 0) {
        const child = group.children[0];

        if ((child as three.Mesh).isMesh) {
            const mesh = child as three.Mesh;

            if (mesh.geometry) {
                mesh.geometry.dispose();
            }

            removeMeshMaterial(mesh);
        }
        group.remove(child);
    }
};

const createRoom = ({
    floorWidth,
    floorDepth,
    parentGroup,
    wallHeight,
}: {
    floorWidth: number;
    floorDepth: number;
    parentGroup: three.Group;
    wallHeight?: number;
}): void => {
    removeGroupChildren(parentGroup);

    const floorMaterial = new three.MeshStandardMaterial({
        side: three.DoubleSide,
        map: textureMaps["wood-floor"].texture,
    });

    const floorGeo = new three.PlaneGeometry(floorWidth, floorDepth);

    floorMesh = new three.Mesh(floorGeo, floorMaterial);
    floorMesh.rotation.x = Math.PI / 2;

    wallBuilder = new WallBuilder({
        floorWidth,
        floorDepth,
        textureMap: textureMaps["plaster-wall"].texture,
        wallHeight,
    });

    const { roomWalls } = wallBuilder.createWalls();
    parentGroup.add(floorMesh, roomWalls);
};

const calculateRoomBoundingBox = (roomMesh: three.Group = room): void => {
    const roomBox = new three.Box3().setFromObject(roomMesh);
    roomSize = roomBox.getSize(new three.Vector3());
    threeRaycaster.setRoomBoundingBox(roomSize);
};

const initRoom = ({
    floorWidth = defaultFloorDimension,
    floorDepth = defaultFloorDimension,
    parentGroup = room,
    wallHeight,
}: {
    floorWidth?: number;
    floorDepth?: number;
    parentGroup?: three.Group;
    wallHeight?: number;
}): void => {
    createRoom({ floorWidth, floorDepth, parentGroup, wallHeight });
    calculateRoomBoundingBox();
};

initRoom({
    floorWidth: defaultFloorDimension,
    floorDepth: defaultFloorDimension,
    parentGroup: room,
    wallHeight: defaultWallHeight,
});

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

    // we're using default model scale since room dimensions can be changed now
    const targetWidth = defaultRoomWidth * (roomWidthPercentage / 100);

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

scene.add(room, bed);

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
    const model = await loadModel(
        models[modelType][modelName],
        models[modelType][modelName]["roomSizeScale"]
    );
    scene.add(model);
    threeRaycaster.addDraggableModel(model);
};

export const createWall = (): void => {
    const wallMesh = (wallBuilder as WallBuilder).createWall(3);
    const wall = new three.Group();
    wall.userData.type = WALL_DIVIDER;
    wall.add(wallMesh);
    room.add(wall);
    threeRaycaster.addDraggableModel(wall);
};

export const rotateModel = (value: string): void => {
    threeRaycaster.rotateModel(value);
};

export const editWidthModel = (value: string): void => {
    threeRaycaster.editWidthModel(value);
};

export const resetModelChanges = () => {
    threeRaycaster.resetModelChanges();
};

export const removeActiveModel = () => {
    threeRaycaster.removeActiveModel();
};

export const editRoomDimensions = (
    newDimensionValue: number,
    dimensionToChange: DimensionChange
): void => {
    initRoom({
        floorWidth:
            dimensionToChange === ROOM_WIDTH
                ? newDimensionValue
                : Math.round(roomSize.x),
        floorDepth:
            dimensionToChange === ROOM_DEPTH
                ? newDimensionValue
                : Math.round(roomSize.z),
        wallHeight:
            dimensionToChange === ROOM_HEIGHT
                ? newDimensionValue
                : Math.round(roomSize.y),
    });
};

export const updateFloorTexture = (newTexture: EditableTextures): void => {
    try {
        const { texture } = textureMaps[newTexture];
        const newFloorMaterial = new three.MeshStandardMaterial({
            side: three.DoubleSide,
            map: texture,
        });

        removeMeshMaterial(floorMesh);
        floorMesh.material = newFloorMaterial;
    } catch (e) {
        console.error(e);
    }
};
