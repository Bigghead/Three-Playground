import * as three from "three";
import { ThreeCanvas } from "../../Shared/three-canvas";
import videoSource from "/video/video.mp4";

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
        video.src = videoSource;
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
            const geometry = new three.BoxGeometry(0.65, 0.65, 0.65);
            const uv = geometry.attributes.uv;
            console.log(uv);

            // ===== 24 vertices "count" from 6 face cube X 4 edges ===== //
            for (let i = 0; i < uv.count; i++) {
                let u = uv.getX(i);
                let v = uv.getY(i);

                /**
                 * split each "face" to take in a percentage of the video
                 * the video grid goes from 0 -> 100% texture or 0 -> 1 in uv sizing
                 * if the gridsize is 10, each face will take in 10% or 0.1 of the texture
                 */
                u /= gridSize;
                v /= gridSize;

                /**
                 * shift uv position to take in the next slice of the texture
                 * if gridsize is 10
                 * if x is 0, do nothing
                 * If the cube is at x = 1, we add 0.10 to the coordinates. Now it’s looking the 0.1 - 0.2 mark of the x texture.
                 */
                u += x / gridSize;
                v += y / gridSize;

                uv.setXY(i, u, v);
            }
            const cube: three.Mesh<three.BoxGeometry, three.MeshBasicMaterial> =
                new three.Mesh(geometry, gridMaterial);

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
