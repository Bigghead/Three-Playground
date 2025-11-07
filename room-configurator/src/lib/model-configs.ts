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

/**
 * How big in room width the default models are sized down to
 */
const modelRoomScales = {
    bed: 33,
    sofa: 45,
    table: 25,
    cabinet: 15,
    lamp: 5,
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

// ===== Todo: better way to set configs? Cause kinda a lot copying ===== //
export const models = {
    bed: {
        bed1: {
            url: "/models/bed/bed-1-draco.glb",
            imageUrl: "images/bed/bed-1.webp",
            roomSizeScale: modelRoomScales.bed,
            offset: {
                rotation: {
                    y: Math.PI / 2,
                },
            },
        },
        bed2: {
            url: "/models/bed/bed-2-draco.glb",
            imageUrl: "images/bed/bed-2.webp",
            roomSizeScale: modelRoomScales.bed,
            offset: {
                position: { y: -0.15 },
                rotation: {
                    y: Math.PI / 2,
                },
            },
        },

        bed3: {
            url: "/models/bed/bed-3-draco.glb",
            roomSizeScale: modelRoomScales.bed,
            offset: {
                position: { y: -0.25 },
                rotation: {
                    y: -Math.PI / 2,
                },
            },
            imageUrl: "images/bed/bed-3.webp",
        },
        bed4: {
            url: "/models/bed/bed-4-draco.glb",
            roomSizeScale: modelRoomScales.bed,
            offset: {
                rotation: {
                    y: -Math.PI / 2,
                },
            },
            imageUrl: "images/bed/bed-4.webp",
        },
    },
    sofa: {
        sofa1: {
            url: "/models/sofa/sofa-1-draco.glb",
            imageUrl: "images/sofa/sofa-1.webp",
            roomSizeScale: 50,
            offset: {
                position: { y: 0.7 },
            },
        },
        sofa2: {
            url: "/models/sofa/sofa-2-draco.glb",
            imageUrl: "images/sofa/sofa-2.webp",
            roomSizeScale: modelRoomScales.sofa,
            offset: {
                position: { y: -0.55 },
            },
        },
        sofa3: {
            url: "/models/sofa/sofa-3-draco.glb",
            imageUrl: "images/sofa/sofa-3.webp",
            roomSizeScale: modelRoomScales.sofa,
        },
        sofa4: {
            url: "/models/sofa/sofa-4-draco.glb",
            imageUrl: "images/sofa/sofa-4.webp",
            roomSizeScale: modelRoomScales.sofa,
        },
    },

    table: {
        table1: {
            url: "/models/table/table-1-draco.glb",
            imageUrl: "images/table/table-1.webp",
            roomSizeScale: modelRoomScales.table,
        },
        table2: {
            url: "/models/table/table-2-draco.glb",
            imageUrl: "images/table/table-2.webp",
            roomSizeScale: modelRoomScales.table,
        },
        table3: {
            url: "/models/table/table-3-draco.glb",
            imageUrl: "images/table/table-3.webp",
            roomSizeScale: modelRoomScales.table,
        },
        table4: {
            url: "/models/table/table-4-draco.glb",
            imageUrl: "images/table/table-4.webp",
            roomSizeScale: modelRoomScales.table,
        },
    },

    cabinet: {
        cabinet1: {
            url: "/models/cabinet/cabinet-1.glb",
            imageUrl: "images/cabinet/cabinet-1.webp",
            roomSizeScale: modelRoomScales.cabinet,
        },
        cabinet2: {
            url: "/models/cabinet/cabinet-2.glb",
            imageUrl: "images/cabinet/cabinet-2.webp",
            roomSizeScale: modelRoomScales.cabinet,
        },
        cabinet3: {
            url: "/models/cabinet/cabinet-3.glb",
            imageUrl: "images/cabinet/cabinet-3.webp",
            roomSizeScale: modelRoomScales.cabinet,
        },
    },

    lighting: {
        lamp1: {
            url: "/models/lamp/lamp-1-draco.glb",
            imageUrl: "images/lamp/lamp-1.webp",
            roomSizeScale: modelRoomScales.lamp,
        },
        lamp2: {
            url: "/models/lamp/lamp-2-draco.glb",
            imageUrl: "images/lamp/lamp-2.webp",
            roomSizeScale: modelRoomScales.lamp,
        },
        lamp3: {
            url: "/models/lamp/lamp-3-draco.glb",
            imageUrl: "images/lamp/lamp-3.webp",
            roomSizeScale: modelRoomScales.lamp,
        },
        lamp4: {
            url: "/models/lamp/lamp-4-draco.glb",
            imageUrl: "images/lamp/lamp-4.webp",
            roomSizeScale: modelRoomScales.lamp,
        },
    },

    bathroom: {
        toilet: {
            url: "/models/bathroom/toilet-draco.glb",
            imageUrl: "images/bathroom/toilet.webp",
            roomSizeScale: modelRoomScales.toilet,
        },
        shower: {
            url: "/models/bathroom/shower-draco.glb",
            imageUrl: "images/bathroom/shower-1.webp",
            roomSizeScale: modelRoomScales.shower,
            offset: {
                rotation: {
                    y: Math.PI,
                },
            },
        },
        sink: {
            url: "/models/bathroom/sink-1-draco.glb",
            imageUrl: "images/bathroom/sink.webp",
            roomSizeScale: 8,
            offset: {
                rotation: {
                    y: -Math.PI / 2,
                },
            },
        },
        sink2: {
            url: "/models/bathroom/sink-2-draco.glb",
            imageUrl: "images/bathroom/sink-2.webp",
            roomSizeScale: modelRoomScales.sink,
        },
    },
    wall: {
        divider: {
            imageUrl: "images/wall/wall.webp",
        },
    },
};
