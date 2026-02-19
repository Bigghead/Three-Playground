import * as three from "three";
import { ThreeCanvasLocal as ThreeCanvas } from "@/src/lib/THREE/three-manager";
import {
    models,
    type ModelConfig,
    type ModelOffset,
} from "./lib/THREE/model-configs";
import { type GLTF } from "three/examples/jsm/Addons.js";
import { WallBuilder } from "./lib/THREE/wall-builder";
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

const { scene, modelLoader, threeRaycasterLocal, loadTexture } =
    new ThreeCanvas({
        canvas,
        initShadow: false,
    });

scene.background = new three.Color("#0A2342");

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

const createDefaultFloor = ({
    texture,
    normal,
    arm,
}: {
    texture: three.Texture | undefined;
    normal: three.Texture | undefined;
    arm: three.Texture | undefined;
}): three.MeshStandardMaterial => {
    return new three.MeshStandardMaterial({
        side: three.DoubleSide,
        map: texture,
        normalMap: normal,
        aoMap: arm,
        roughnessMap: arm,
        metalnessMap: arm,
    });
};

const createRoom = async ({
    parentGroup, // the room in this case
    floorWidth,
    floorDepth,
    wallHeight,
}: {
    parentGroup: three.Group;
    floorWidth: number;
    floorDepth: number;
    wallHeight?: number;
}): Promise<void> => {
    removeGroupChildren(parentGroup);

    try {
        // ===== use default floor 1st time page loads, use last floor when room dimension is updated ===== //
        const currentFloorMesh =
            floorMesh?.material as three.MeshLambertMaterial;
        const { textureMap, normalMap, armMap } =
            await loadTexture("wood-floor");
        const defaultFloorMaterial = {
            texture: currentFloorMesh?.map || textureMap,
            normal: currentFloorMesh?.normalMap || normalMap,
            arm: currentFloorMesh?.aoMap || armMap,
        };

        const floorMaterial = createDefaultFloor(defaultFloorMaterial);
        const floorGeo = new three.PlaneGeometry(floorWidth, floorDepth);
        floorMesh = new three.Mesh(floorGeo, floorMaterial);

        floorMesh.rotation.x = Math.PI / 2;

        wallBuilder = new WallBuilder({
            floorWidth,
            floorDepth,
            textureMap: (await loadTexture("plaster-wall")).textureMap!!,
            wallHeight,
        });

        const { roomWalls } = wallBuilder.createWalls();
        parentGroup.add(floorMesh, roomWalls);
    } catch (e) {
        console.error("Error in creating room, Error: ", e);
    }
};

const calculateRoomBoundingBox = (roomMesh: three.Group = room): void => {
    const roomBox = new three.Box3().setFromObject(roomMesh);
    roomSize = roomBox.getSize(new three.Vector3());
    threeRaycasterLocal.setRoomBoundingBox(roomSize);
};

/**
 * This is called everytime room dimensions are changed
 */
const initRoom = async ({
    parentGroup = room,
    floorWidth = defaultFloorDimension,
    floorDepth = defaultFloorDimension,
    wallHeight,
}: {
    parentGroup?: three.Group;
    floorWidth?: number;
    floorDepth?: number;
    wallHeight?: number;
}): Promise<void> => {
    /**
     * calculateRoomBoundingBox was returning all 0s vector3
     * cause we forgot we made createRoom async and it sets the room
     * then we took hours figuring out why everything broke.........
     */
    await createRoom({ parentGroup, floorWidth, floorDepth, wallHeight });
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
    roomWidthPercentage: number,
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
    modelOffset: ModelOffset,
): void => {
    for (const key in modelOffset) {
        // I hate TypeScript a lot sometimes
        const offsetKey = key as OffsetKey;
        const offsetValue = modelOffset[offsetKey];
        if (offsetValue) {
            model.scene[offsetKey].set(
                offsetValue.x || 0,
                offsetValue.y || 0,
                offsetValue.z || 0,
            );
        }
    }
};

const loadModel = async (
    modelConfig: ModelConfig,
    modelScale: number,
    progressCallback?: (progress: ProgressEvent) => void,
): Promise<three.Group> => {
    try {
        // need each model in a group for the mouse drag / raycaster
        const wrapper = new three.Group();
        const { url, offset } = modelConfig;
        const model = await modelLoader.initModel(url, progressCallback);
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
const bed = await loadModel(models.bed.bed2, 30);

room.matrixAutoUpdate = false;
scene.add(room, bed);

threeRaycasterLocal.addDraggableModel(bed);

window.addEventListener("mousedown", (event: MouseEvent) => {
    if (event.button !== 0) return;
    threeRaycasterLocal.onMouseDown(event);
});

window.addEventListener("mouseup", (event: MouseEvent) => {
    if (event.button !== 0) return;
    threeRaycasterLocal.onMouseUp();
});

window.addEventListener("mousemove", (event: MouseEvent) => {
    threeRaycasterLocal.onMouseMove(event);
});

export const renderModel = async ({
    modelType,
    modelName,
    addToScene = true,
    progressCallback,
}: {
    modelType: ModelType;
    modelName: ModelName;
    addToScene?: boolean;
    progressCallback?: (progress: ProgressEvent) => void;
}): Promise<void> => {
    const model = await loadModel(
        models[modelType][modelName],
        models[modelType][modelName]["roomSizeScale"],
        progressCallback,
    );

    if (addToScene) {
        scene.add(model);
        threeRaycasterLocal.addDraggableModel(model);
    }
};

export const createWall = (): void => {
    const wallMesh = (wallBuilder as WallBuilder).createWall(3);
    const wall = new three.Group();

    // ===== using cusomdata to check model type in custom click event in raycaster ===== //
    wall.userData.type = WALL_DIVIDER;
    wall.add(wallMesh);

    // ===== add wall into scene, not into room cause we reset room when we change dimensions ===== //
    scene.add(wall);
    threeRaycasterLocal.addDraggableModel(wall);
};

export const rotateModel = (value: string): void => {
    threeRaycasterLocal.rotateModel(value);
};

export const editWidthModel = (value: string): void => {
    threeRaycasterLocal.editWidthModel(value);
};

export const resetModelChanges = () => {
    threeRaycasterLocal.resetModelChanges();
};

export const removeActiveModel = () => {
    threeRaycasterLocal.removeActiveModel();
};

export const editRoomDimensions = (
    newDimensionValue: number,
    dimensionToChange: DimensionChange,
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
            dimensionToChange === ROOM_HEIGHT ? newDimensionValue : roomSize.y,
    });
};

export const updateFloorTexture = async (
    newTexture: EditableTextures,
): Promise<void> => {
    try {
        let { textureMap, normalMap, armMap } = await loadTexture(newTexture);

        const newFloorMaterial = new three.MeshStandardMaterial({
            side: three.DoubleSide,
            map: textureMap,
            normalMap: normalMap,
            aoMap: armMap,
            roughnessMap: armMap,
            metalnessMap: armMap,
        });

        removeMeshMaterial(floorMesh);
        floorMesh.material = newFloorMaterial;
    } catch (e) {
        console.error(e);
    }
};
