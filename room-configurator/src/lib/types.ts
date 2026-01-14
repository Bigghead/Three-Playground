import type { ROOM_DEPTH, ROOM_HEIGHT, ROOM_WIDTH } from "./constants";
import type { models } from "./THREE/model-configs";

export type ModelType = keyof typeof models;
export type ModelName = keyof (typeof models)[ModelType];

export type DimensionChange =
    | typeof ROOM_WIDTH
    | typeof ROOM_DEPTH
    | typeof ROOM_HEIGHT;

export type EditableTextures = "laminate-floor" | "granite-tile";
