import * as three from "three";
import { ThreeCanvas } from "../../Shared/three-canvas";
import videoSource from "/video/footage.mp4";

const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
if (!canvas) {
    console.error("Canvas element not found.");
}

const threeCanvas = new ThreeCanvas({ canvas, initShadow: false });
const { cursor: mouseCursor, threeCamera, threeRaycaster, scene } = threeCanvas;
threeCamera.updateCameraPosition(new three.Vector3(0, 0, 20));

const gridSize = 50;
const gridSpacing = 0.65;
const gridGroup = new three.Group();
const gridMaterial = new three.MeshBasicMaterial({ side: three.FrontSide });
let pixelData: ImageDataArray;
const videoRatio = {
    width: 0,
    height: 0,
};

const loadVideoTexture = () => {
    try {
        const video = document.createElement("video");
        video.src = videoSource;
        video.crossOrigin = "anonymous";
        video.loop = true;
        video.muted = true;
        video.play();

        video.onloadedmetadata = () => {
            const originalWidth = video.videoWidth;
            const originalHeight = video.videoHeight;
            const aspectRatio = originalWidth / originalHeight;

            // Adjust gridWidth or gridHeight based on the video shape
            if (aspectRatio > 1) {
                videoRatio.width = gridSize;
                videoRatio.height = Math.round(gridSize / aspectRatio);
            } else {
                videoRatio.height = gridSize;
                videoRatio.width = Math.round(gridSize * aspectRatio);
            }

            createVideoMap();
            createGrid();
        };

        const videoTexture = new three.VideoTexture(video);
        videoTexture.flipY = true;
        // ===== expensive calculation every frame ===== //
        videoTexture.minFilter = three.NearestFilter;
        videoTexture.magFilter = three.NearestFilter;
        videoTexture.generateMipmaps = false;
        // ===== expensive calculation every frame ===== //
        videoTexture.colorSpace = three.SRGBColorSpace;
        videoTexture.wrapS = three.ClampToEdgeWrapping;
        videoTexture.wrapT = three.ClampToEdgeWrapping;
        gridMaterial.map = videoTexture;
    } catch (e) {
        console.error(`Error in loading video texture. Error: ${e}`);
    }
};

const createVideoMap = () => {
    const { height, width } = videoRatio;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    canvas.width = width;
    canvas.height = height;

    /**
     * draw invisible black / white background
     * we need to check black / white to render the "grid" below later
     * start will full black background, and draw white "map"
     */
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "white";
    ctx.font = `${gridSize * 0.8}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // ===== start drawing in the middle of canvas ===== //
    ctx.fillText("❤", width / 2, height / 2);

    pixelData = ctx.getImageData(0, 0, width, height).data;
};

// ===== Todo: instancedMesh box. Though I think it's fine for 10 x 10 for now ===== //
const createGrid = () => {
    const { width, height } = videoRatio;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const geometry = new three.BoxGeometry(0.55, 0.55, 0.55);
            const uv = geometry.attributes.uv;

            // ===== shift index by 4 to check "r, g, b, a" values from canvas image we created ===== //
            const colorIndex = (y * width + x) * 4;
            const r = pixelData[colorIndex];
            const g = pixelData[colorIndex + 1];
            const b = pixelData[colorIndex + 2];

            // ===== 255 is full white, we need to ignore the threshold to black ===== //
            if ((r + g + b) / 3 < 128) {
                continue;
            }

            // ===== 24 vertices "count" from 6 face cube X 4 edges ===== //
            for (let i = 0; i < uv.count; i++) {
                let u = uv.getX(i);
                let v = uv.getY(i);

                /**
                 * split each "face" to take in a percentage of the video
                 * the video grid goes from 0 -> 100% texture or 0 -> 1 in uv sizing
                 * if the gridsize is 10, each face will take in 10% or 0.1 of the texture
                 */
                u /= width;
                v /= height;

                /**
                 * shift uv position to take in the next slice of the texture
                 * if gridsize is 10
                 * if x is 0, do nothing
                 * If the cube is at x = 1, we add 0.10 to the coordinates. Now it’s looking the 0.1 - 0.2 mark of the x texture.
                 */
                u += x / width;
                v = 1.0 - y / height - 1.0 / height + v;

                uv.setXY(i, u, v);
            }
            const cube: three.Mesh<three.BoxGeometry, three.MeshBasicMaterial> =
                new three.Mesh(geometry, gridMaterial);

            cube.position.x = (x - (width - 1) / 2) * gridSpacing;
            // Flip Y: Canvas (0 is top) vs Three.js (0 is center, positive is up)
            cube.position.y = -(y - (height - 1) / 2) * gridSpacing;
            cube.position.z = 0;

            cube.userData.originalPosition = cube.position.clone();

            gridGroup.add(cube);
        }
    }

    renderGrid();
};

// ===== Quick maffs ===== //
const animateCells = () => {
    threeCanvas.addAnimationCallback((elapsedTime: number) => {
        if (!gridGroup.children.length) return;

        const { x: mouseX, y: mouseY } =
            threeRaycaster.getNormalizedDeviceCoords(
                mouseCursor,
                threeCamera.camera,
            );

        gridGroup.children.forEach((cube) => {
            const orig = cube.userData.originalPosition;
            /**
             * check how close the mouse is to each cube
             * and have them "follow" the mouse cursor
             */
            const dx = mouseX - cube.position.x;
            const dy = mouseY - cube.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // ===== this "eases" the animation ===== //
            const offset = Math.max(0, 5 - dist);
            // const targetX = orig.x + dx * (offset / 5) * 0.5;
            const targetY = orig.y + dy * (offset / 5) * 0.5;
            const targetZ = (offset - cube.position.z) * 0.5;

            // cube.position.x += targetX - cube.position.x;
            cube.position.y += targetY - cube.position.y;
            cube.position.z += targetZ;
        });
    });
};

const renderGrid = () => {
    animateCells();
    const box = new three.Box3().setFromObject(gridGroup);

    const center = new three.Vector3();
    box.getCenter(center);

    gridGroup.position.sub(center);
    threeCanvas.scene.add(gridGroup);
};

loadVideoTexture();

const axes = new three.AxesHelper(15);
scene.add(axes);
