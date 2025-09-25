import {
	DomEl,
	ACTIVE_MODEL_CLICKED,
	INACTIVE_MODEL_EVENT,
	WALL_DIVIDER,
} from "./lib/constants";
import { models, type ModelVector3 } from "./lib/model-configs";
import type { ModelType, ModelName } from "./lib/types";

document.addEventListener("DOMContentLoaded", async () => {
	const {
		renderModel,
		createWall,
		rotateModel,
		editWidthModel,
		resetModelChanges,
		removeActiveModel,
	} = await import("./canvas");

	let activeMenu = "home";
	const originalWallWidth = 3;

	/**
	 * Elements
	 */

	const handleModelImageClick =
		(modelType: ModelType, modelKey: ModelName) => async () => {
			try {
				if (modelType === "wall") {
					return createWall();
				}

				await renderModel(modelType, modelKey);
			} catch (e) {
				console.error(e);
			}
		};

	const clearModelImages = (): void => {
		DomEl.configuratorContent.innerHTML = "";
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

			DomEl.configuratorContent.append(div);
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

	const handleWidthSlider = (scale: ModelVector3): void => {
		const { x } = scale;
		DomEl.modelWidthSliderContainer.style.display = "block";
		const widthValue = (originalWallWidth * x).toString();
		DomEl.modelWidthText.innerText = widthValue;
		DomEl.modelWidthSlider.value = widthValue;
	};

	const handleRotationSlider = (rotation: ModelVector3): void => {
		const { y } = rotation;

		// need to turn rotation radians back to degrees
		const degrees = (y * 180) / Math.PI;
		const normalizedY = Math.round(degrees / 5) * 5;
		const degreeValue = normalizedY.toString();

		DomEl.modelRotationText.innerText = degreeValue;
		DomEl.modelRotationSlider.value = degreeValue;
		DomEl.configModal.style.visibility = "visible";
	};

	const resetSliders = (): void => {
		DomEl.modelWidthText.innerText = originalWallWidth.toString();
		DomEl.modelWidthSlider.value = originalWallWidth.toString();
		DomEl.modelRotationText.innerText = "0";
		DomEl.modelRotationSlider.value = "0";
	};

	const handleResetModel = (): void => {
		resetModelChanges();
		resetSliders();
	};

	const resetModel = () => {};

	/**
	 * Listeners
	 */

	DomEl.configSidebarMenu.forEach((menu): void => {
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

	DomEl.canvas.addEventListener(ACTIVE_MODEL_CLICKED, (e) => {
		const custom = e as CustomEvent;
		DomEl.modelWidthSliderContainer.style.display = "none";

		if (custom.detail.type && custom.detail.type === WALL_DIVIDER) {
			handleWidthSlider(custom.detail.scale);
		}

		handleRotationSlider(custom.detail.rotation);
	});

	DomEl.canvas.addEventListener(INACTIVE_MODEL_EVENT, (e) => {
		DomEl.configModal.style.visibility = "hidden";
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

	DomEl.resetButton.addEventListener("click", () => {
		handleResetModel();
	});
});
