import { ACTIVE_MODEL_CLICKED, INACTIVE_MODEL_EVENT } from "./lib/constants";
import { models } from "./lib/model-configs";
import type { ModelType, ModelName } from "./lib/types";

document.addEventListener("DOMContentLoaded", async () => {
	const { renderModel, rotateModel } = await import("./canvas");

	let activeMenu = "home";

	/**
	 * Elements
	 */
	const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;

	const configurator = document.querySelector(
		".configurator"
	) as HTMLDivElement;
	const configuratorContent = document.querySelector(
		".configurator-content"
	) as HTMLDivElement;
	const configSidebar = document.querySelector(
		".configurator-sidebar"
	) as HTMLDivElement;
	const configSidebarMenu = document.querySelectorAll(
		".configurator-sidebar > .menu"
	) as NodeListOf<HTMLDivElement>;

	const configModal = document.querySelector(".config-modal") as HTMLDivElement;
	const slider = document.querySelector(
		".config-modal input#rotation"
	) as HTMLInputElement;
	const rotationText = document.querySelector(
		".config-modal .item-rotation"
	) as HTMLSpanElement;

	const handleModelImageClick =
		(modelType: ModelType, modelKey: ModelName) => async () => {
			try {
				await renderModel(modelType, modelKey);
			} catch (e) {
				console.error(e);
			}
		};

	const clearModelImages = (): void => {
		configuratorContent.innerHTML = "";
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
			div.addEventListener("click", handleModelImageClick(modelType, modelKey));

			configuratorContent.append(div);
		}
	};

	/**
	 * Event Handlers
	 */
	const removeCurrentlyActiveMenu = (): void => {
		const activeMenu = document.querySelector(
			".configurator-sidebar > .menu.active"
		);
		activeMenu?.classList.remove("active");
	};

	/**
	 * Listeners
	 */

	configSidebarMenu.forEach((menu): void => {
		menu.addEventListener("click", (e) => {
			e.stopPropagation();

			const target = e.target as HTMLElement;
			const {
				dataset: { content },
			} = target;

			if (content) {
				removeCurrentlyActiveMenu();
				activeMenu = content;
				renderModelImages(content as ModelType);
				target.classList.add("active");
			}
		});
	});

	canvas.addEventListener(ACTIVE_MODEL_CLICKED, (e) => {
		const custom = e as CustomEvent;
		const { y } = custom.detail?.rotation;

		// need to turn rotation radians back to degrees
		const degrees = (y * 180) / Math.PI;
		const normalizedY = Math.round(degrees / 5) * 5;
		const degreeValue = normalizedY.toString();

		rotationText.innerText = degreeValue;
		slider.value = degreeValue;
		configModal.style.visibility = "visible";
	});

	canvas.addEventListener(INACTIVE_MODEL_EVENT, (e) => {
		configModal.style.visibility = "hidden";
	});

	slider.addEventListener("input", (e) => {
		const target = e.target as HTMLInputElement;
		rotationText.innerText = target.value;
		rotateModel(target.value);
	});
});
