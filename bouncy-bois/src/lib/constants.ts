import * as three from "three";
export const floorWidth = 15;
export const INACTIVITY_THRESHOLD_MS = 500;
export const OBJECT_REMOVAL_WHEN_RAINING_TIMER = 1000;

export type randomGeometry = "sphere" | "cone" | "box";

export type PointPosition = {
  x: number;
  y: number;
  z: number;
};

type DefaultMesh = {
  id: string;
  geometry: randomGeometry;
};

export type ObjectBody = DefaultMesh & {
  randomScale: number;
  position: [number, number, number];
  isInitialObject?: boolean;
};

export type WorldObjects = ObjectBody & {
  mesh: three.Mesh;
};

export type MeshPool = DefaultMesh & {
  mesh: three.Mesh;
};

export type ActivePoolMesh = DefaultMesh & {
  position: three.Vector3Tuple;
  randomScale: number;
};

export const WorkerEnum = {
  RAPIER_READY: "Rapier Ready",
  ADD_OBJECTS: "Add Objects",
  WORLD_STEP: "World Step",
  UPDATE_MESHES: "Update Meshes",
  ROTATE_FLOOR: "Rotate Floor",
  REMOVE_BODY: "Remove Body",
  REMOVE_INACTIVES: "Remove Inactives",
};
