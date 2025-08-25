document.addEventListener("DOMContentLoaded", () => {
	let activeMenu = "home";

	/**
	 * Elements
	 */
	const configurator = document.querySelector(".configurator");
	const configSidebar = document.querySelector(".configurator-sidebar");
	const configSidebarMenu = document.querySelectorAll(
		".configurator-sidebar > .menu"
	) as NodeListOf<HTMLDivElement>;

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
});
