export const ACTIVE_MODEL_CLICKED = "active model clicked";
export const INACTIVE_MODEL_EVENT = "inactive model event";

export const WALL_DIVIDER = "wall divider";

export const DomEl = {
	get canvas() {
		return document.querySelector("canvas.webgl") as HTMLCanvasElement;
	},

	get configurator() {
		return document.querySelector(".configurator") as HTMLDivElement;
	},
	get configuratorContent() {
		return document.querySelector(".configurator-content") as HTMLDivElement;
	},
	get configSidebar() {
		return document.querySelector(".configurator-sidebar") as HTMLDivElement;
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
};
