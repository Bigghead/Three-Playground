export type ModelVector3 = {
	x: number;
	y: number;
	z: number;
};

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

export const modelScaling = {
	bed: 22.5,
};

export const models = {
	bed1: {
		url: "/models/bed/bed-1-draco.glb",
		offset: {
			position: { y: -0.05 },
			rotation: {
				y: -Math.PI / 2,
			},
		},
		imageUrl: "images/bed/bed-1.webp",
	},
	bed2: {
		url: "/models/bed/bed-2-draco.glb",
		offset: {
			rotation: {
				y: Math.PI / 2,
			},
		},
		imageUrl: "images/bed/bed-2.webp",
	},
	bed3: {
		url: "/models/bed/bed-3-draco.glb",
		offset: {
			position: { y: -0.05 },
			rotation: {
				y: Math.PI / 2,
			},
		},
		imageUrl: "images/bed/bed-3.webp",
	},
	toilet: {
		url: "/models/bathroom/toilet-draco.glb",
	},
	shower: {
		url: "/models/bathroom/shower-draco.glb",
	},
	sink: {
		url: "/models/bathroom/sink-draco.glb",
	},
};
