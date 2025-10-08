export const ACTIVE_MODEL_CLICKED = "active model clicked";
export const INACTIVE_MODEL_EVENT = "inactive model event";

export const WALL_DIVIDER = "wall divider";
export const ROOM_CONFIG_ACTION_ADD = "room config action add";
export const ROOM_CONFIG_ACTION_SUBTRACT = "room config action subtract";
export const ROOM_WIDTH = "room-width";
export const ROOM_DEPTH = "room-depth";
export const ROOM_HEIGHT = "room-height";
export const ROOM_SIZE = "room-size";

export const defaultWallHeight = 2.5;
export const defaultWallDepth = 0.1;
export const defaultRoomWidth = 10;

export const DomEl = {
    // ===== canvas ===== //
    get canvas() {
        return document.querySelector("canvas.webgl") as HTMLCanvasElement;
    },

    // ===== sidebar configurator ===== //
    get configurator() {
        return document.querySelector(".configurator") as HTMLDivElement;
    },
    get configuratorContent() {
        return document.querySelector(
            ".configurator-content"
        ) as HTMLDivElement;
    },
    get configSidebar() {
        return document.querySelector(
            ".configurator-sidebar"
        ) as HTMLDivElement;
    },
    get configSidebarMenu() {
        return document.querySelectorAll(
            ".configurator-sidebar > .menu"
        ) as NodeListOf<HTMLDivElement>;
    },

    // ===== action modals ===== //
    get configModal() {
        return document.querySelector(".config-modal") as HTMLDivElement;
    },
    get modelRotationSlider() {
        return document.querySelector(
            ".config-modal input#model-rotation"
        ) as HTMLInputElement;
    },
    get modelRotationText() {
        return document.querySelector(
            ".config-modal .item-rotation"
        ) as HTMLSpanElement;
    },

    get modelWidthSliderContainer() {
        return document.querySelector(
            ".config-modal-slider--container__hidden"
        ) as HTMLDivElement;
    },
    get modelWidthSlider() {
        return document.querySelector(
            ".config-modal input#model-width"
        ) as HTMLInputElement;
    },
    get modelWidthText() {
        return document.querySelector(
            ".config-modal .item-width"
        ) as HTMLSpanElement;
    },

    get configModalAction() {
        return document.querySelector(".config-modal-action") as HTMLDivElement;
    },

    // ===== room configurator ===== //
    get roomConfigurator() {
        return document.querySelector(".room-configurator") as HTMLDivElement;
    },

    get roomSizeModal() {
        return document.querySelector(".room-size-modal") as HTMLDivElement;
    },

    get roomConfigRowElement() {
        return document.querySelector(
            ".room-configurator .content"
        ) as HTMLDivElement;
    },
};
