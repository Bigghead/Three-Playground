import * as three from "three";
import { ThreeCanvas } from "../../Shared/three-canvas";
import { ANIMATE_ENTRY, ANIMATE_EXIT } from "./constants";
import { ProjectionMap } from "./projection-map";

const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
if (!canvas) {
    console.error("Canvas element not found.");
}

const threeCanvas = new ThreeCanvas({ canvas, initShadow: false });
const { threeCamera, scene } = threeCanvas;

threeCamera.updateCameraPosition(new three.Vector3(0, 0, 20));
scene.background = new three.Color(0x0000ff);
(scene.background as three.Color).lerpColors(
    new three.Color(0x0000ff),
    new three.Color(0x00ff00),
    0.5,
);

// ===== global for looping through video projections since we dont have much ===== //
let videoIndex = 0;

let currentMap = new ProjectionMap({
    threeCanvas,
    videoIndex,
    defaultHidden: false,
});
await currentMap.loadVideoTexture();
videoIndex++;

// ===== todo: actually destroy previous map ===== //
async function loadNextMap(): Promise<void> {
    if (currentMap) {
        await currentMap.animateGsapCells(ANIMATE_EXIT);
        currentMap.destroyMap();
    }

    currentMap = new ProjectionMap({
        threeCanvas,
        videoIndex,
        defaultHidden: true,
    });
    await currentMap.loadVideoTexture();
    videoIndex++;
    currentMap.animateGsapCells(ANIMATE_ENTRY);
}

setInterval(async () => {
    await loadNextMap();
}, 8000);
