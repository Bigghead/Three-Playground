import { models } from "./lib/model-configs";
import type { ModelType, ModelName } from "./lib/types";

document.addEventListener("DOMContentLoaded", async () => {
	const { renderModel } = await import("./canvas");

	let activeMenu = "home";

	/**
	 * Elements
	 */
	const configurator = document.querySelector(".configurator");
	const configuratorContent = document.querySelector(".configurator-content");
	const configSidebar = document.querySelector(".configurator-sidebar");
	const configSidebarMenu = document.querySelectorAll(
		".configurator-sidebar > .menu"
	) as NodeListOf<HTMLDivElement>;

	const renderModelImages = (modelType: ModelType): void => {
		const chosenModels = models[modelType];

		for (const key in chosenModels) {
			const modelKey = key as keyof typeof chosenModels;
			const { imageUrl } = chosenModels[modelKey];

			const div = document.createElement("div");
			div.classList.add("image-container");
			div.style.backgroundImage = `url(${imageUrl})`;
			configuratorContent?.append(div);
		}
	};

	/**
	 * Event Handlers
	 */
	const removeCurrentlyActiveMenu = (): void => {
		const activeMenu = document.querySelector(
			".configurator-sidebar > .menu.active"
		);
		console.log(activeMenu?.classList);
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
				target.classList.add("active");
			}
		});
	});

	// testing adding multiple models from configurator
	let bedCount = 1;
	const interval = setInterval(async () => {
		if (bedCount > 3) {
			return clearInterval(interval);
		}
		await renderModel("bed", `bed${bedCount}` as ModelName);
		bedCount++;
	}, 2000);
});
