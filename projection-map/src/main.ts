import * as three from "three";
import { gsap } from "gsap";
import { ThreeCanvas } from "../../Shared/three-canvas";

const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
if (!canvas) {
    console.error("Canvas element not found.");
}

const threeCanvas = new ThreeCanvas({ canvas, initShadow: false });
const { cursor: mouseCursor, threeCamera, threeRaycaster, scene } = threeCanvas;
threeCamera.updateCameraPosition(new three.Vector3(0, 0, 20));
scene.background = new three.Color(0x0000ff);
(scene.background as three.Color).lerpColors(
    new three.Color(0x0000ff),
    new three.Color(0x00ff00),
    0.5,
);

const videoSources = {
    gridVideo: "/video/tunnel.mp4",
    backgroundVideo: "/video/stars.mp4",
};

/**
 * Todo: Performance
 * - Chunk building the "grid" in waves / rows etc
 * - InstancedMesh grid cells
 * - Shaders for the uv projection in grid?
 */
class ProjectionMap {
    _gridSize = 75;
    _gridSpacing = 0.65;
    _gridGroup = new three.Group();
    _gridMaterial = new three.MeshBasicMaterial({ side: three.FrontSide });
    _pixelData: ImageDataArray = new Uint8ClampedArray(0);
    _videoRatio = {
        width: 0,
        height: 0,
    };
    _isAnimatingGsap = false;
    constructor() {}

    loadVideoTexture = () => {
        try {
            const video = this.createVideoElement(videoSources.gridVideo);
            video.onloadedmetadata = async () => {
                await document.fonts.ready;
                this.resizeGridAspect(video);

                /**
                 * kinda need this to avoid a "pause" / lag spike on first load
                 * since onloadedmetadata does heavy video computation stuff, alongside our grid rendering stuff
                 */
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        this.createVideoMap();
                        this.createGrid();
                    }, 100);
                });
            };
            const videoTexture = this.createVideoTexture(video);
            this._gridMaterial.map = videoTexture;
        } catch (e) {
            console.error(`Error in loading video texture. Error: ${e}`);
        }
    };

    createVideoElement = (videoSource: string): HTMLVideoElement => {
        const video = document.createElement("video");
        video.src = videoSource;
        video.crossOrigin = "anonymous";
        video.loop = true;
        video.muted = true;
        video.playbackRate = 0.75;
        video.addEventListener(
            "canplaythrough",
            () => {
                video.play();
            },
            { once: true },
        );
        return video;
    };

    createVideoTexture = (
        videoElement: HTMLVideoElement,
    ): three.VideoTexture => {
        const videoTexture = new three.VideoTexture(videoElement);
        videoTexture.flipY = true;
        // ===== expensive calculation every frame ===== //
        videoTexture.minFilter = three.NearestFilter;
        videoTexture.magFilter = three.NearestFilter;
        videoTexture.generateMipmaps = false;
        // ===== expensive calculation every frame ===== //
        videoTexture.colorSpace = three.SRGBColorSpace;
        videoTexture.wrapS = three.ClampToEdgeWrapping;
        videoTexture.wrapT = three.ClampToEdgeWrapping;
        return videoTexture;
    };

    private resizeGridAspect = (videoElement: HTMLVideoElement): void => {
        const originalWidth = videoElement.videoWidth;
        const originalHeight = videoElement.videoHeight;
        const aspectRatio = originalWidth / originalHeight;

        // Adjust gridWidth or gridHeight based on the video shape
        if (aspectRatio > 1) {
            this._videoRatio.width = this._gridSize;
            this._videoRatio.height = Math.round(this._gridSize / aspectRatio);
        } else {
            this._videoRatio.height = this._gridSize;
            this._videoRatio.width = Math.round(this._gridSize * aspectRatio);
        }
    };

    private getRandomUnicodeShape = (): string => {
        const unicodeShapes = ["❤", "★", "♣", "♠", "❄", "✽", "❣", "❧"];

        return unicodeShapes[Math.floor(Math.random() * unicodeShapes.length)];
    };

    /**
     * Creates invisible canvas with video dimensions
     */
    private createCanvasCtx = ({
        height,
        width,
    }: {
        height: number;
        width: number;
    }): CanvasRenderingContext2D => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        canvas.width = width;
        canvas.height = height;

        /**
         * draw invisible black / white background
         * we need to check black / white to render the "grid" below later
         */
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "white";

        const BASE = 100;
        ctx.font = `${BASE}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        return ctx;
    };

    /**
     * Using ^canvas, scale our unicode shape to fit the canvas
     * Store individual pixel data
     */
    private createVideoMap = (): void => {
        const { height, width } = this._videoRatio;
        const ctx = this.createCanvasCtx({ height, width });

        /**
         * There was a bug with the shape "clipping" cause we were guessing the size using the canvas width / height
         * the fix is to use the actual unicode shape to scale out in the 2d canvas
         */
        const text = this.getRandomUnicodeShape();
        const measurement = ctx.measureText(text);

        const glyphW =
            measurement.actualBoundingBoxLeft +
            measurement.actualBoundingBoxRight;
        const glyphH =
            measurement.actualBoundingBoxAscent +
            measurement.actualBoundingBoxDescent;

        const scale = Math.min(width / glyphW, height / glyphH) * 0.9;

        // ===== center at 0, 0 ===== //
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);

        ctx.fillText(text, 0, measurement.actualBoundingBoxAscent - glyphH / 2);

        this._pixelData = ctx.getImageData(0, 0, width, height).data;
    };

    // ===== Todo: instancedMesh box. Though I think it's fine for 10 x 10 for now ===== //
    private createGrid = (): void => {
        const { width, height } = this._videoRatio;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const geometry = new three.BoxGeometry(0.55, 0.55, 0.55);
                const uv = geometry.attributes.uv;

                // ===== shift index by 4 to check "r, g, b, a" values from canvas _pixelData we created ===== //
                const colorIndex = (y * width + x) * 4;
                const r = this._pixelData[colorIndex];
                const g = this._pixelData[colorIndex + 1];
                const b = this._pixelData[colorIndex + 2];

                // ===== 255 is full white, we need to ignore the threshold to black ===== //
                if ((r + g + b) / 3 < 129) {
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
                const cube: three.Mesh<
                    three.BoxGeometry,
                    three.MeshBasicMaterial
                > = new three.Mesh(geometry, this._gridMaterial);

                cube.position.x = (x - (width - 1) / 2) * this._gridSpacing;
                // Flip Y: Canvas (0 is top) vs Three.js (0 is center, positive is up)
                cube.position.y = -(y - (height - 1) / 2) * this._gridSpacing;
                cube.position.z = 0;

                cube.userData.originalX = cube.position.x;
                cube.userData.originalY = cube.position.y;
                cube.userData.originalZ = cube.position.z;

                this._gridGroup.add(cube);
            }
        }

        this.renderGrid();
    };

    // ===== Quick maffs ===== //
    private animateCells = (): void => {
        threeCanvas.addAnimationCallback((elapsedTime: number) => {
            const lerpRadius = 3.0;
            const pullStrength = 5;
            if (!this._gridGroup.children.length || this._isAnimatingGsap)
                return;

            const { x: mouseX, y: mouseY } =
                threeRaycaster.getNormalizedDeviceCoords(
                    mouseCursor,
                    threeCamera.camera,
                );

            this._gridGroup.children.forEach((cube) => {
                const { originalX, originalY, originalZ } = cube.userData;
                /**
                 * check how close the mouse is to each cube
                 * and have them "follow" the mouse cursor
                 */
                const dx = mouseX - cube.position.x;
                const dy = mouseY - cube.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const distSq = dx * dx + dy * dy;

                // ===== this "eases" the animation ===== //
                const offset = Math.max(0, 5 - dist);

                const falloff = Math.exp(
                    -distSq / (10 * Math.pow(lerpRadius, 2)),
                );

                const targetX = originalX + dx * (offset / 5);
                const targetY = originalY + dy * (offset / 5);
                // ===== Smooth lerp for z , cause the bulge following cursor is intense ===== //
                const targetZ = originalZ + falloff * pullStrength;

                cube.position.x += targetX - cube.position.x;
                cube.position.y += targetY - cube.position.y;
                cube.position.z += targetZ - cube.position.z;
                // const targetZ = offset - cube.position.z;
                // cube.position.z += targetZ;
            });
        });
    };

    private renderGrid = (): void => {
        this.animateCells();

        // ===== center origin point in middle of canvas ===== //
        const box = new three.Box3().setFromObject(this._gridGroup);
        const center = new three.Vector3();
        box.getCenter(center);
        this._gridGroup.position.sub(center);
        threeCanvas.scene.add(this._gridGroup);
    };

    public animageGsapCells = async (): Promise<void> => {
        const animationIntensity = 10;
        this._isAnimatingGsap = true;

        const tl = gsap.timeline({
            delay: 0.5 * 0.25,
            defaults: { ease: "power1.out", duration: 2 },
        });

        this._gridGroup.children.forEach((cell) => {
            const { originalX, originalY } = cell.userData;
            // ===== atan2 gives angle from center origin to move away from  ===== //
            const angleToFly = Math.atan2(originalY, originalX);

            const newTargetX =
                originalX + Math.cos(angleToFly) * animationIntensity;
            const newTargetY =
                originalY + Math.cos(angleToFly) * -animationIntensity;

            tl.to(
                cell.scale,
                { x: 0, y: 0, z: 0, ease: "power3.inOut" },
                0.001,
            ).to(cell.position, { x: newTargetX, y: newTargetY, z: 10 }, "<");
        });

        await tl;
        tl.revert();
        this._isAnimatingGsap = false;
    };
}

const projectionMap = new ProjectionMap();
projectionMap.loadVideoTexture();

setTimeout(() => {
    projectionMap.animageGsapCells();
}, 500);
// ===== still undecided if we want canvas background ===== //
// const backgroundVideo = projectionMap.createVideoElement(
//     videoSources.backgroundVideo,
// );
// const backgroundTexture = projectionMap.createVideoTexture(backgroundVideo);
// scene.background = backgroundTexture;
