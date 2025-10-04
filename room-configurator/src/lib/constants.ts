export const ACTIVE_MODEL_CLICKED = "active model clicked";
export const INACTIVE_MODEL_EVENT = "inactive model event";

export const WALL_DIVIDER = "wall divider";
export const ROOM_CONFIG_ACTION_ADD = "room config action add";
export const ROOM_CONFIG_ACTION_SUBTRACT = "room config action subtract";
export const ROOM_WIDTH = "room width";
export const ROOM_DEPTH = "room depth";

export const DomEl = {
    get canvas() {
        return document.querySelector("canvas.webgl") as HTMLCanvasElement;
    },

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

    get resetButton() {
        return document.querySelector(
            ".config-modal-action #reset-btn"
        ) as HTMLButtonElement;
    },
    get deleteButton() {
        return document.querySelector(
            ".config-modal-action #delete-btn"
        ) as HTMLButtonElement;
    },

    get roomConfigurator() {
        return document.querySelector(".room-configurator") as HTMLDivElement;
    },

    get roomConfigActionRoom() {
        return document.querySelector(
            '.room-configurator__actions button[data-configurator-action="room-size"]'
        ) as HTMLButtonElement;
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
