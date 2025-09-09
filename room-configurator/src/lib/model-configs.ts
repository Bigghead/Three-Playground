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
	bed: {
		bed1: {
			url: "/models/bed/bed-1-draco.glb",
			offset: {
				rotation: {
					y: Math.PI / 2,
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
				position: { x: 0.75, y: 0.55 },
				rotation: {
					y: Math.PI,
				},
			},
			imageUrl: "images/bed/bed-3.webp",
		},
		bed4: {
			url: "/models/bed/bed-4-draco.glb",
			offset: {
				position: { y: -0.125 },
				rotation: {
					y: -Math.PI / 2,
				},
			},
			imageUrl: "images/bed/bed-4.webp",
		},
		bed5: {
			url: "/models/bed/bed-5-draco.glb",
			offset: {
				position: { x: 0.8, y: 0.3 },

				rotation: {
					y: Math.PI,
				},
			},
			imageUrl: "images/bed/bed-5.webp",
		},
	},

	bathroom: {
		toilet: {
			url: "/models/bathroom/toilet-draco.glb",
		},
		shower: {
			url: "/models/bathroom/shower-draco.glb",
		},
		sink: {
			url: "/models/bathroom/sink-draco.glb",
		},
	},
};
