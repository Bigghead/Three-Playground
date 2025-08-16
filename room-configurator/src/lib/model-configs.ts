export type ModelConfig = {
	url: string;
	offset?: {
		position?: {
			x: number;
			y: number;
			z: number;
		};
	};
};

export const models = {
	bed1: {
		url: "/models/bed/bed-1-draco.glb",
	},
	bed2: {
		url: "/models/bed/bed-2-draco.glb",
	},
	bed3: {
		url: "/models/bed/bed-3-draco.glb",
	},
	bed4: {
		url: "/models/bed/bed-4-draco.glb",
	},
	bed5: {
		url: "/models/bed/bed-5-draco.glb",
	},
	bed6: {
		url: "/models/bed/bed-6-draco.glb",
		offset: {
			position: {
				x: 0,
				y: -0.12,
				z: 0,
			},
		},
	},
};
