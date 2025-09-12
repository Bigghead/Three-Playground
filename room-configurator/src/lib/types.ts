import type { models } from "./model-configs";

export type ModelType = keyof typeof models;
export type ModelName = keyof (typeof models)[ModelType];
