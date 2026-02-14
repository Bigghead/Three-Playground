import {
    DomEl,
    ACTIVE_MODEL_CLICKED,
    INACTIVE_MODEL_EVENT,
    roomConfigDimensions,
    roomConfigTextures,
    INCREMENT,
    DECREMENT,
    ROOM_WIDTH,
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

const { modelWidthSlider } = DomEl;

/**
 * ===== Listeners =====
 *
 */
DomEl.menuButton.addEventListener("click", (e) => {
    domHandler.toggleSidebar(e.currentTarget as HTMLButtonElement);
});

DomEl.configSidebarMenu.forEach((menu): void => {
    menu.addEventListener("click", (e) => {
        domHandler.handleMenuClick(e);
    });
});

DomEl.canvas.addEventListener(ACTIVE_MODEL_CLICKED, (e) => {
    domHandler.handleActiveModelClick(e as CustomEvent);
});

DomEl.canvas.addEventListener(INACTIVE_MODEL_EVENT, () => {
    domHandler.hideConfigModal();
});

DomEl.modelRotationSlider.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    DomEl.modelRotationText.innerText = target.value;
    rotateModel(target.value);
});

modelWidthSlider.addEventListener("input", (e) => {
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

    domHandler.resetSliders();
});

DomEl.roomConfigurator.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (!target.matches("button")) return;

    if (target.classList.contains("close")) {
        return domHandler.closeConfigModals();
    }

    const { configuratorAction } = target.dataset;
    if (!configuratorAction) return;

    domHandler.handleRenderConfigModals(configuratorAction);
});

// ===== Todo: edit max wall divider width to match new max width / depth ===== //
DomEl.roomConfigRowElement.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const contentChild = target.closest(".content-child") as HTMLElement;

    if (!contentChild) return;

    if (target.matches("button")) {
        const { dimension } = contentChild.dataset;
        const { action } = target.dataset;

        domHandler.handleEditRoomAction(target, contentChild);
        if (dimension !== ROOM_WIDTH) return;

        changeWidthSliderRanges(action);
    }
});

DomEl.floorTextureModal.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    if (!target.matches("img")) return;

    const textureMap = target.dataset.textureMap as EditableTextures;
    updateFloorTexture(textureMap);

    domHandler.removeCurrentlyActiveElement(".texture-img.active");
    target.classList.add("active");
});

const changeWidthSliderRanges = (action: string | undefined): void => {
    const sliderMaxWidth = parseFloat(modelWidthSlider.max);
    if (action === INCREMENT) {
        modelWidthSlider.max = Math.min(20, sliderMaxWidth + 1.0).toString();
    } else if (action === DECREMENT) {
        modelWidthSlider.max = Math.max(3, sliderMaxWidth - 1.0).toString();
    }
};
