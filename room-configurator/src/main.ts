import {
    DomEl,
    ACTIVE_MODEL_CLICKED,
    INACTIVE_MODEL_EVENT,
    roomConfigDimensions,
    roomConfigTextures,
    INCREMENT,
    DECREMENT,
    ROOM_WIDTH,
    BUTTON_ACTION_RESET,
    BUTTON_ACTION_DELETE,
} from "./lib/constants";
import { DomHandler } from "./lib/UI/dom-handler";
import type { EditableTextures } from "./lib/types";
import { DimensionControl, TextureCard } from "./lib/UI/components";

const {
    rotateModel,
    editWidthModel,
    resetModelChanges,
    removeActiveModel,
    updateFloorTexture,
} = await import("./canvas");

const domHandler = new DomHandler();
const {
    menuButton,
    configSidebarMenu,
    canvas,
    modelConfigInput,
    modelWidthSlider,
    configModalAction,
    roomConfigurator,
    roomConfigRowElement,
    floorTextureModal,
} = DomEl;

/**
 * ===== Init HTML Renders =====
 */
(function initRender() {
    const roomConfigContent = DomEl.roomConfigurator.querySelector(
        ".content",
    ) as HTMLDivElement;
    const roomTexturesContent = DomEl.floorTextureModal.querySelector(
        ".textures-container",
    ) as HTMLDivElement;

    roomConfigDimensions.forEach((dimension) =>
        roomConfigContent.appendChild(DimensionControl(dimension)),
    );

    roomConfigTextures.forEach((texture, index) =>
        roomTexturesContent.appendChild(TextureCard(texture, index === 0)),
    );
})();

/**
 * ===== Listeners =====
 *
 */
menuButton.addEventListener("click", (e) => {
    domHandler.toggleSidebar(e.currentTarget as HTMLButtonElement);
});

configSidebarMenu.forEach((menu): void => {
    menu.addEventListener("click", (e) => {
        domHandler.handleMenuClick(e);
    });
});

canvas.addEventListener(ACTIVE_MODEL_CLICKED, (e) => {
    domHandler.handleActiveModelClick(e as CustomEvent);
});

canvas.addEventListener(INACTIVE_MODEL_EVENT, () => {
    domHandler.hideConfigModal();
});

modelConfigInput.addEventListener("input", (e) => {
    const target = e.target;

    if (!(target instanceof HTMLInputElement)) return;

    if (target.id === "model-rotation") {
        DomEl.modelRotationText.innerText = target.value;
        rotateModel(target.value);
    } else if (target.id === "model-width") {
        DomEl.modelWidthText.innerText = target.value;
        editWidthModel(target.value);
    }
});

configModalAction.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (!target.matches("button")) return;

    const { actionType: btnAction } = target.dataset;

    if (btnAction === BUTTON_ACTION_RESET) {
        resetModelChanges();
    } else if (btnAction === BUTTON_ACTION_DELETE) {
        removeActiveModel();
    }

    domHandler.resetSliders();
});

roomConfigurator.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (!target.matches("button")) return;

    if (target.classList.contains("close")) {
        return domHandler.closeConfigModals();
    }

    const { configuratorAction } = target.dataset;
    if (!configuratorAction) return;

    domHandler.handleRenderConfigModals(configuratorAction);
});

roomConfigRowElement.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const contentChild = target.closest(".content-child") as HTMLElement;

    if (!contentChild || !target.matches("button")) return;

    const { dimension } = contentChild.dataset;
    const { action } = target.dataset;

    domHandler.handleEditRoomAction(target, contentChild);
    if (dimension !== ROOM_WIDTH) return;

    changeWidthSliderRanges(action);
});

floorTextureModal.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    if (!target.matches("img")) return;

    const textureMap = target.dataset.textureMap as EditableTextures;
    updateFloorTexture(textureMap);

    domHandler.removeCurrentlyActiveElement(".texture-img.active");
    target.classList.add("active");
});

/**
 * ===== Actions =====
 *
 */
const changeWidthSliderRanges = (action: string | undefined): void => {
    const sliderMaxWidth = parseFloat(modelWidthSlider.max);
    if (action === INCREMENT) {
        modelWidthSlider.max = Math.min(20, sliderMaxWidth + 1.0).toString();
    } else if (action === DECREMENT) {
        modelWidthSlider.max = Math.max(3, sliderMaxWidth - 1.0).toString();
    }
};
