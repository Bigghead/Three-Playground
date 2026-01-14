import { createWall, editRoomDimensions, renderModel } from "../../canvas";
import {
    DomEl,
    FLOOR_TEXTURE,
    ROOM_CONFIG_ACTION_ADD,
    ROOM_CONFIG_ACTION_SUBTRACT,
    ROOM_SIZE,
    WALL_DIVIDER,
} from "../constants";

import { type ModelType, type ModelName, type DimensionChange } from "../types";
import { models, type ModelVector3 } from "../THREE/model-configs";

export class DomHandler {
    originalWallWidth = 3;

    private modelCache: Map<string, boolean> = new Map();

    /**
     * ===== Event Handlers =====
     *
     */

    /**
     * preload model asset in the background on image hover but not render
     */
    private loadBackgroundModel =
        (modelType: ModelType, modelName: ModelName) => async () => {
            const modelKey = `${modelType} - ${modelName}`;

            if (this.modelCache.get(modelKey)) {
                // only prefetch once, duh
                return;
            }

            this.modelCache.set(modelKey, true);

            try {
                await renderModel({
                    modelType,
                    modelName,
                    addToScene: false,
                    // progressCallback: (progress) => console.log(progress),
                });
            } catch (e) {
                console.error(`Error loading background model. Error: ${e}`);
            }
        };

    private renderOverlayProgress = (): HTMLDivElement => {
        const overlayElement = document.createElement("div");
        overlayElement.classList.add("overlay");

        const progressBar = document.createElement("progress");
        progressBar.max = 100;
        progressBar.value = 0;
        overlayElement.appendChild(progressBar);
        return overlayElement;
    };

    private handleModelImageClick =
        (modelType: ModelType, modelName: ModelName) =>
        async (e: MouseEvent) => {
            const div = e.currentTarget as HTMLDivElement;
            try {
                if (modelType === "wall") {
                    return createWall();
                }

                /**
                 * Still to be determined if we need this
                 * biggest asset is 10MB but it loads decently fast
                 * and the progress bar ends up looking like a bug cause it just flashes on the page since model loads quick
                 */
                const overlayElement = this.renderOverlayProgress();
                const progressBar = overlayElement
                    .children[0] as HTMLProgressElement;
                div.appendChild(overlayElement);

                this.toggleSidebar(DomEl.menuButton);

                await renderModel({
                    modelType,
                    modelName,
                    addToScene: true,
                    progressCallback: ({ loaded, total }) => {
                        progressBar.value = Math.round((loaded / total) * 100);
                        console.log(progressBar.value);
                        if (progressBar.value >= 100) {
                            overlayElement.remove();
                        }
                    },
                });
            } catch (e) {
                console.error(e);
            }
        };

    private clearModelImages = (): void => {
        DomEl.configuratorContent.innerHTML = "";
    };

    private renderModelImages = (modelType: ModelType): void => {
        this.clearModelImages();
        const chosenModels = models[modelType];

        for (const key in chosenModels) {
            const modelKey = key as keyof typeof chosenModels;
            const { imageUrl } = chosenModels[modelKey];

            const div = document.createElement("div");
            div.classList.add("image-container");

            const img = document.createElement("img");
            img.src = imageUrl;
            img.alt = `${modelType} - ${modelKey}`;

            div.appendChild(img);

            // ===== preload asset on hover ===== //
            div.addEventListener(
                "mouseenter",
                this.loadBackgroundModel(modelType, modelKey)
            );
            div.addEventListener(
                "click",
                this.handleModelImageClick(modelType, modelKey)
            );

            DomEl.configuratorContent.append(div);
        }
    };

    private initWidthSlider = (scale: ModelVector3): void => {
        const { x } = scale;
        DomEl.modelWidthSliderContainer.style.display = "block";
        const widthValue = (this.originalWallWidth * x).toString();
        DomEl.modelWidthText.innerText = widthValue;
        DomEl.modelWidthSlider.value = widthValue;
    };

    private initRotationSlider = (rotation: ModelVector3): void => {
        const { y } = rotation;

        // need to turn rotation radians back to degrees
        const degrees = (y * 180) / Math.PI;
        const normalizedY = Math.round(degrees / 5) * 5;
        const degreeValue = normalizedY.toString();

        DomEl.modelRotationText.innerText = degreeValue;
        DomEl.modelRotationSlider.value = degreeValue;
        DomEl.configModal.style.visibility = "visible";
    };

    toggleSidebar = (button: HTMLButtonElement): void => {
        const configurator = DomEl.configurator;
        const isOpen = configurator.classList.toggle("open");
        button.textContent = isOpen ? "X" : "☰";
    };

    removeCurrentlyActiveElement = (elementSelector: string): void => {
        const activeMenu = document.querySelector(elementSelector);
        activeMenu?.classList.remove("active");
    };

    handleMenuClick = (e: PointerEvent): void => {
        e.stopPropagation();

        const target = e.target as HTMLElement;
        const {
            dataset: { content },
        } = target;

        if (content) {
            this.removeCurrentlyActiveElement(
                ".configurator-sidebar > .menu.active"
            );
            this.renderModelImages(content as ModelType);
            target.classList.add("active");
        }
    };

    handleActiveModelClick = (e: CustomEvent): void => {
        const custom = e as CustomEvent;
        DomEl.modelWidthSliderContainer.style.display = "none";

        if (custom.detail.type && custom.detail.type === WALL_DIVIDER) {
            this.initWidthSlider(custom.detail.scale);
        }

        this.initRotationSlider(custom.detail.rotation);
    };

    hideConfigModal = (): void => {
        DomEl.configModal.style.visibility = "hidden";
    };

    resetSliders = (): void => {
        DomEl.modelWidthText.innerText = this.originalWallWidth.toString();
        DomEl.modelWidthSlider.value = this.originalWallWidth.toString();
        DomEl.modelRotationText.innerText = "0";
        DomEl.modelRotationSlider.value = "0";
        this.hideConfigModal();
    };

    handleRenderConfigModals = (configuratorAction: string): void => {
        DomEl.roomSizeModal.style.display =
            configuratorAction === ROOM_SIZE ? "block" : "none";

        DomEl.floorTextureModal.style.display =
            configuratorAction === FLOOR_TEXTURE ? "block" : "none";
    };

    handleEditRoomAction = (
        targetElement: HTMLElement,
        containerElement: HTMLElement
    ): void => {
        const btnAction = targetElement.classList.contains("add-btn")
            ? ROOM_CONFIG_ACTION_ADD
            : ROOM_CONFIG_ACTION_SUBTRACT;

        const valueEl = containerElement.querySelector(".value") as HTMLElement;
        const value = parseFloat(valueEl.textContent);

        const {
            dimension: dimensionToChange,
            changeStep = "1",
            changeMin = "10",
            changeMax = "20",
        } = containerElement.dataset;

        const isAdding = btnAction === ROOM_CONFIG_ACTION_ADD;
        const step = parseFloat(changeStep);
        const min = parseFloat(changeMin);
        const max = parseFloat(changeMax);
        const newValue = isAdding ? value + step : value - step;

        if (newValue < min || newValue > max) return;

        valueEl.textContent = newValue.toString();
        editRoomDimensions(newValue, dimensionToChange as DimensionChange);
    };

    closeConfigModals = (): void => {
        DomEl.roomSizeModal.style.display = "none";
        DomEl.floorTextureModal.style.display = "none";
    };
}
