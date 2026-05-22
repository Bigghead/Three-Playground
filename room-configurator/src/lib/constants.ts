export const ACTIVE_MODEL_CLICKED = "active model clicked";
export const INACTIVE_MODEL_EVENT = "inactive model event";

export const WALL_DIVIDER = "wall divider";
export const ROOM_WIDTH = "room-width";
export const ROOM_DEPTH = "room-depth";
export const ROOM_HEIGHT = "room-height";
export const ROOM_SIZE = "room-size";
export const FLOOR_TEXTURE = "floor-texture";

export const INCREMENT = "increment";
export const DECREMENT = "decrement";
export const BUTTON_ACTION_RESET = "reset";
export const BUTTON_ACTION_DELETE = "delete";

export const defaultWallHeight = 2.5;
export const defaultWallDepth = 0.1;
export const defaultRoomWidth = 10;

export const roomConfigDimensions = [
    { label: "Width", value: 10, step: 1, min: 5, max: 20, key: "room-width" },
    {
        label: "Height",
        value: 2.5,
        step: 0.5,
        min: 2.5,
        max: 5,
        key: "room-height",
    },
    { label: "Depth", value: 10, step: 1, min: 5, max: 20, key: "room-depth" },
];

export const roomConfigTextures = [
    {
        name: "Wood Floor",
        src: "images/textures/wood-floor.webp",
        alt: "wood floor image",
        map: "wood-floor",
    },
    {
        name: "Rosewood Floor",
        src: "images/textures/rosewood.webp",
        alt: "rosewood floor image",
        map: "rosewood-floor",
    },
    {
        name: "Laminate Floor",
        src: "images/textures/laminate-floor.webp",
        alt: "laminate floor image",
        map: "laminate-floor",
    },
    {
        name: "Granite Tile",
        src: "images/textures/granite-tile.webp",
        alt: "granite tile floor image",
        map: "granite-tile",
    },
];

export const DomEl = {
    // ===== canvas ===== //
    get canvas() {
        return document.querySelector("canvas.webgl") as HTMLCanvasElement;
    },

    // ===== sidebar configurator ===== //
    get menuButton() {
        return document.querySelector(".menu-button") as HTMLButtonElement;
    },
    get configurator() {
        return document.querySelector(".configurator") as HTMLDivElement;
    },
    get configuratorContent() {
        return document.querySelector(
            ".configurator-content",
        ) as HTMLDivElement;
    },
    get configSidebar() {
        return document.querySelector(
            ".configurator-sidebar",
        ) as HTMLDivElement;
    },
    get configSidebarMenu() {
        return document.querySelectorAll(
            ".configurator-sidebar > .menu",
        ) as NodeListOf<HTMLDivElement>;
    },

    // ===== action modals ===== //
    get configModal() {
        return document.querySelector(".config-modal") as HTMLDivElement;
    },

    get modelConfigInput() {
        return document.querySelector(
            ".config-modal input",
        ) as HTMLInputElement;
    },
    get modelRotationSlider() {
        return document.querySelector(
            ".config-modal input#model-rotation",
        ) as HTMLInputElement;
    },
    get modelRotationText() {
        return document.querySelector(
            ".config-modal .item-rotation",
        ) as HTMLSpanElement;
    },

    get modelWidthSliderContainer() {
        return document.querySelector(
            ".config-modal-slider--container__hidden",
        ) as HTMLDivElement;
    },
    get modelWidthSlider() {
        return document.querySelector(
            ".config-modal input#model-width",
        ) as HTMLInputElement;
    },
    get modelWidthText() {
        return document.querySelector(
            ".config-modal .item-width",
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
            ".room-configurator .content",
        ) as HTMLDivElement;
    },

    get floorTextureModal() {
        return document.querySelector(".floor-texture-modal") as HTMLDivElement;
    },
};
