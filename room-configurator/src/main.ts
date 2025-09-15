import { models } from "./lib/model-configs";
import type { ModelType, ModelName } from "./lib/types";

document.addEventListener("DOMContentLoaded", async () => {
	const { renderModel, rotateModel } = await import("./canvas");

	let activeMenu = "home";

	/**
	 * Elements
	 */
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

	const slider = document.querySelector(
		".config-modal .config-modal-slider"
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

	//Todo - reset / store sliders for other model rotations
	slider.addEventListener("input", (e) => {
		const target = e.target as HTMLInputElement;
		rotationText.innerText = target.value;
		rotateModel(target.value);
	});
});
