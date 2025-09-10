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

export const modelRoomScales = {
	bed: 33,
	sofa: 45,
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
				position: { y: -0.15 },
				rotation: {
					y: Math.PI / 2,
				},
			},
			imageUrl: "images/bed/bed-2.webp",
		},

		bed3: {
			url: "/models/bed/bed-3-draco.glb",
			offset: {
				position: { y: -0.25 },
				rotation: {
					y: -Math.PI / 2,
				},
			},
			imageUrl: "images/bed/bed-3.webp",
		},
	},
	sofa: {
		sofa1: {
			url: "/models/sofa/sofa-1-draco.glb",
			imageUrl: "images/sofa/sofa-1.png",
			offset: {
				position: { y: 0.7 },
			},
		},
		sofa2: {
			url: "/models/sofa/sofa-2-draco.glb",
			imageUrl: "images/sofa/sofa-2.png",
			offset: {
				position: { y: -0.55 },
			},
		},
		sofa3: {
			url: "/models/sofa/sofa-3-draco.glb",
			imageUrl: "images/sofa/sofa-3.png",
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
