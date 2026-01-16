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
    imageUrl: string;
    roomSizeScale: number;
    offset?: ModelOffset;
};

export const modelScaling = {
    bed: 22.5,
};

/**
 * How big in room width percentage ( 100 spans the whole room ) the default models are sized down to
 */
const modelRoomScales = {
    bed: 33,
    sofa: 45,
    table: 25,
    cabinet: 15,
    lamp: 5,
    bathroom: 0,
    toilet: 10,
    sink: 10,
    shower: 12.5,
};

/**
 * This is probably the most annoying part of this project
 * Every new additional model takes a lot of manual work to be usable before it loads in properly
 * - convert assets:
 * 		- convert model to draco ahead of time
 * 		- compress images to webp
 * - remove unnecessary planes in the models in blender ( a lot of the creators add invidible floors for some reason )
 * - set default model position ( the offsets ) cause creators will have wildly different model origins
 */

// ===== Todo: Normalize origin and pivot points on all dynamic loaded models ===== //
const generateModelConfig = (
    modelCategory: keyof typeof modelRoomScales,
    modelName: string,
    offset: ModelOffset = {},
    customScale: number | null = null,
): ModelConfig => {
    const roomSizeScale = customScale || modelRoomScales[modelCategory];
    return {
        url: `/models/${modelCategory}/${modelName}-draco.glb`,
        imageUrl: `images/${modelCategory}/${modelName}.webp`,
        roomSizeScale,
        offset: {
            ...offset,
        },
    };
};

export const models = {
    bed: {
        bed1: generateModelConfig("bed", "bed-1", {
            rotation: { y: Math.PI / 2 },
        }),
        bed2: generateModelConfig("bed", "bed-2", {
            position: { y: -0.15 },
            rotation: { y: Math.PI / 2 },
        }),
        bed3: generateModelConfig("bed", "bed-3", {
            position: { y: -0.25 },
            rotation: { y: -Math.PI / 2 },
        }),
        bed4: generateModelConfig("bed", "bed-4", {
            rotation: { y: -Math.PI / 2 },
        }),
    },
    sofa: {
        sofa1: generateModelConfig(
            "sofa",
            "sofa-1",
            { position: { y: 0.7 } },
            50,
        ),
        sofa2: generateModelConfig("sofa", "sofa-2", {
            position: { y: -0.55 },
        }),
        sofa3: generateModelConfig("sofa", "sofa-3"),
        sofa4: generateModelConfig("sofa", "sofa-4"),
    },
    table: {
        table1: generateModelConfig("table", "table-1"),
        table2: generateModelConfig("table", "table-2"),
        table3: generateModelConfig("table", "table-3"),
        table4: generateModelConfig("table", "table-4"),
    },
    cabinet: {
        cabinet1: generateModelConfig("cabinet", "cabinet-1"),
        cabinet2: generateModelConfig("cabinet", "cabinet-2"),
        cabinet3: generateModelConfig("cabinet", "cabinet-3"),
    },
    lighting: {
        lamp1: generateModelConfig("lamp", "lamp-1"),
        lamp2: generateModelConfig("lamp", "lamp-2"),
        lamp3: generateModelConfig("lamp", "lamp-3"),
        lamp4: generateModelConfig("lamp", "lamp-4"),
    },
    bathroom: {
        toilet: generateModelConfig(
            "bathroom",
            "toilet",
            {},
            modelRoomScales.toilet,
        ),
        shower: generateModelConfig(
            "bathroom",
            "shower-1",
            {
                rotation: { y: Math.PI },
            },
            modelRoomScales.shower,
        ),
        sink: generateModelConfig(
            "bathroom",
            "sink-1",
            { rotation: { y: -Math.PI / 2 } },
            8,
        ),
        sink2: generateModelConfig(
            "bathroom",
            "sink-2",
            {},
            modelRoomScales.sink,
        ),
    },
    wall: {
        // Special case: wall is not generated, just provides image
        divider: {
            imageUrl: "images/wall/wall.webp",
        },
    },
};
