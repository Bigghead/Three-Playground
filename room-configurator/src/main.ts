import {
    DomEl,
    ACTIVE_MODEL_CLICKED,
    INACTIVE_MODEL_EVENT,
} from "./lib/constants";
import { DomHandler } from "./lib/dom-handler";
import type { EditableTextures } from "./lib/types";

const {
    rotateModel,
    editWidthModel,
    resetModelChanges,
    removeActiveModel,
    updateFloorTexture,
} = await import("./canvas");

const domHandler = new DomHandler();

/**
 * ===== Listeners =====
 *
 */
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

DomEl.roomConfigRowElement.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const contentChild = target.closest(".content-child") as HTMLElement;

    if (!contentChild) return;

    if (target.matches("button")) {
        domHandler.handleEditRoomAction(target, contentChild);
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
