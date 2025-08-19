export type ModelOffset = {
	position?: {
		x?: number;
		y?: number;
		z?: number;
	};
	rotation?: {
		x?: number;
		y?: number;
		z?: number;
	};
};

export type ModelConfig = {
	url: string;
	offset?: ModelOffset;
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
		offset: {
			rotation: {
				y: Math.PI / 2,
			},
		},
	},
	bed4: {
		url: "/models/bed/bed-4-draco.glb",
		offset: {
			rotation: {
				y: Math.PI / 2,
			},
		},
	},
	bed5: {
		url: "/models/bed/bed-5-draco.glb",
	},
	bed6: {
		url: "/models/bed/bed-6-draco.glb",
		offset: {
			position: {
				y: -0.12,
			},
			rotation: {
				y: -Math.PI / 2,
			},
		},
	},
	bunkBed: {
		url: "/models/bed/bunk-bed-draco.glb",
	},
};
