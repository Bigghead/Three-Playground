import * as three from "three";
import { ThreeCanvas } from "../../Shared/three-canvas";

const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
if (!canvas) {
    console.error("Canvas element not found.");
}

const threeCanvas = new ThreeCanvas({ canvas, initShadow: false });
threeCanvas.threeCamera.updateCameraPosition(new three.Vector3(0, 0, 10));

const gridGroup = new three.Group();
const gridMaterial = new three.MeshBasicMaterial({});

// ===== Todo: split video into each individual child geo ===== //
const loadVideoTexture = () => {
    try {
        const video = document.createElement("video");
        video.src =
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
        video.crossOrigin = "anonymous";
        video.loop = true;
        video.muted = true;
        video.play();

        const videoTexture = new three.VideoTexture(video);
        // ===== expensive calculation every frame ===== //
        videoTexture.minFilter = three.LinearFilter;
        videoTexture.magFilter = three.LinearFilter;
        videoTexture.generateMipmaps = false;
        // ===== expensive calculation every frame ===== //
        videoTexture.colorSpace = three.SRGBColorSpace;
        gridMaterial.map = videoTexture;
    } catch (e) {
        console.error(`Error in loading video texture. Error: ${e}`);
    }
};

const createGrid = () => {
    const gridSize = 10;
    const gridSpacing = 1;

    for (let x = 0; x <= gridSize; x++) {
        for (let y = 0; y <= gridSize; y++) {
            const cube: three.Mesh<three.BoxGeometry, three.MeshBasicMaterial> =
                new three.Mesh(
                    new three.BoxGeometry(0.65, 0.65, 0.65),
                    gridMaterial,
                );
            cube.position.x = (x - gridSize / 2) * gridSpacing;
            cube.position.y = (y - gridSize / 2) * gridSpacing;
            cube.position.z = 0;

            gridGroup.add(cube);
        }
    }

    threeCanvas.scene.add(gridGroup);
};

loadVideoTexture();
createGrid();
const axes = new three.AxesHelper(15);
threeCanvas.scene.add(axes);
