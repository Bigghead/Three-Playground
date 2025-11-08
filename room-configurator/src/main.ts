import {
    DomEl,
    ACTIVE_MODEL_CLICKED,
    INACTIVE_MODEL_EVENT,
    WALL_DIVIDER,
    ROOM_CONFIG_ACTION_ADD,
    ROOM_CONFIG_ACTION_SUBTRACT,
    ROOM_SIZE,
    FLOOR_TEXTURE,
} from "./lib/constants";
import { models, type ModelVector3 } from "./lib/model-configs";
import type {
    ModelType,
    ModelName,
    DimensionChange,
    EditableTextures,
} from "./lib/types";

document.addEventListener("DOMContentLoaded", async () => {
    const {
        renderModel,
        createWall,
        rotateModel,
        editWidthModel,
        resetModelChanges,
        removeActiveModel,
        editRoomDimensions,
        updateFloorTexture,
    } = await import("./canvas");

    const originalWallWidth = 3;

    /**
     * ===== Event Handlers =====
     *
     */

    const handleModelImageClick =
        (modelType: ModelType, modelKey: ModelName) =>
        async (e: MouseEvent) => {
            const div = e.currentTarget as HTMLDivElement;
            try {
                if (modelType === "wall") {
                    return createWall();
                }

                const overlay = document.createElement("div");
                overlay.classList.add("overlay");

                const progressBar = document.createElement("progress");
                progressBar.max = 100;
                progressBar.value = 70;
                progressBar.textContent = "70%";
                overlay.appendChild(progressBar);

                div.appendChild(overlay);
                await renderModel(modelType, modelKey, ({ loaded, total }) => {
                    console.log(loaded / total);
                });
            } catch (e) {
                console.error(e);
            }
        };

    const clearModelImages = (): void => {
        DomEl.configuratorContent.innerHTML = "";
    };

    const renderModelImages = (modelType: ModelType): void => {
        clearModelImages();
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
            div.addEventListener(
                "click",
                handleModelImageClick(modelType, modelKey)
            );

            DomEl.configuratorContent.append(div);
        }
    };

    const removeCurrentlyActiveElement = (elementSelector: string): void => {
        const activeMenu = document.querySelector(elementSelector);
        activeMenu?.classList.remove("active");
    };

    const hideConfigModal = (): void => {
        DomEl.configModal.style.visibility = "hidden";
    };

    const initWidthSlider = (scale: ModelVector3): void => {
        const { x } = scale;
        DomEl.modelWidthSliderContainer.style.display = "block";
        const widthValue = (originalWallWidth * x).toString();
        DomEl.modelWidthText.innerText = widthValue;
        DomEl.modelWidthSlider.value = widthValue;
    };

    const initRotationSlider = (rotation: ModelVector3): void => {
        const { y } = rotation;

        // need to turn rotation radians back to degrees
        const degrees = (y * 180) / Math.PI;
        const normalizedY = Math.round(degrees / 5) * 5;
        const degreeValue = normalizedY.toString();

        DomEl.modelRotationText.innerText = degreeValue;
        DomEl.modelRotationSlider.value = degreeValue;
        DomEl.configModal.style.visibility = "visible";
    };

    const resetSliders = (): void => {
        DomEl.modelWidthText.innerText = originalWallWidth.toString();
        DomEl.modelWidthSlider.value = originalWallWidth.toString();
        DomEl.modelRotationText.innerText = "0";
        DomEl.modelRotationSlider.value = "0";
        hideConfigModal();
    };

    const handleEditRoomAction = (
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

    const closeConfigModals = (): void => {
        DomEl.roomSizeModal.style.display = "none";
        DomEl.floorTextureModal.style.display = "none";
    };

    /**
     * ===== Listeners =====
     *
     */

    DomEl.configSidebarMenu.forEach((menu): void => {
        menu.addEventListener("click", (e) => {
            e.stopPropagation();

            const target = e.target as HTMLElement;
            const {
                dataset: { content },
            } = target;

            if (content) {
                removeCurrentlyActiveElement(
                    ".configurator-sidebar > .menu.active"
                );
                renderModelImages(content as ModelType);
                target.classList.add("active");
            }
        });
    });

    DomEl.canvas.addEventListener(ACTIVE_MODEL_CLICKED, (e) => {
        const custom = e as CustomEvent;
        DomEl.modelWidthSliderContainer.style.display = "none";

        if (custom.detail.type && custom.detail.type === WALL_DIVIDER) {
            initWidthSlider(custom.detail.scale);
        }

        initRotationSlider(custom.detail.rotation);
    });

    DomEl.canvas.addEventListener(INACTIVE_MODEL_EVENT, () => {
        hideConfigModal();
    });

    DomEl.modelRotationSlider.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        DomEl.modelRotationText.innerText = target.value;
        rotateModel(target.value);
    });

    DomEl.modelWidthSlider.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        DomEl.modelWidthText.innerText = target.value;
        editWidthModel(target.value);
    });

    DomEl.configModalAction.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (!target.matches("button")) return;

        const { actionType: btnAction } = target.dataset;

        if (btnAction === "reset") {
            resetModelChanges();
        } else if (btnAction === "delete") {
            removeActiveModel();
        }

        resetSliders();
    });

    DomEl.roomConfigurator.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (!target.matches("button")) return;

        if (target.classList.contains("close")) {
            return closeConfigModals();
        }

        const { configuratorAction } = target.dataset;
        if (!configuratorAction) return;

        DomEl.roomSizeModal.style.display =
            configuratorAction === ROOM_SIZE ? "block" : "none";

        DomEl.floorTextureModal.style.display =
            configuratorAction === FLOOR_TEXTURE ? "block" : "none";
    });

    DomEl.roomConfigRowElement.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const contentChild = target.closest(".content-child") as HTMLElement;

        if (!contentChild) return;

        if (target.matches("button")) {
            handleEditRoomAction(target, contentChild);
        }
    });

    DomEl.floorTextureModal.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;

        if (!target.matches("img")) return;

        const textureMap = target.dataset.textureMap as EditableTextures;
        updateFloorTexture(textureMap);

        removeCurrentlyActiveElement(".texture-img.active");
        target.classList.add("active");
    });
});
