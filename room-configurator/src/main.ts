import {
    DomEl,
    ACTIVE_MODEL_CLICKED,
    INACTIVE_MODEL_EVENT,
    roomConfigDimensions,
    roomConfigTextures,
} from "./lib/constants";
import { DomHandler } from "./lib/UI/dom-handler";
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
 * ===== Init HTML Renders =====
 */
const roomConfigContent = DomEl.roomConfigurator.querySelector(
    ".content"
) as HTMLDivElement;
const roomTexturesContent = DomEl.floorTextureModal.querySelector(
    ".textures-container"
) as HTMLDivElement;

roomConfigContent.innerHTML = roomConfigDimensions
    .map(
        (d) => `
            <div class="content-child"
                data-dimension="${d.key}"
                data-change-step="${d.step}"
                data-change-min="${d.min}"
                data-change-max="${d.max}">
                <label>${d.label}</label>
                <div class="content-child__action">
                <button data-action="decrement" class="subtract-btn hover-animate">-</button>
                <div><span class="value">${d.value}</span>m</div>
                <button data-action="increment" class="add-btn hover-animate">+</button>
                </div>
            </div>
        `
    )
    .join("");

roomTexturesContent.innerHTML = roomConfigTextures
    .map(
        (t, index) =>
            ` <div class="texture">
                <div class="texture-name">${t.name}</div>
                <img
                    src="${t.src}"
                    alt="${t.alt}"
                    data-texture-map="${t.map}"
                    class="texture-img ${index === 0 ? "active" : ""}"
                />
            </div>
            `
    )
    .join("");
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

// ===== Todo: edit max wall divider width to match new max width / depth ===== //
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
