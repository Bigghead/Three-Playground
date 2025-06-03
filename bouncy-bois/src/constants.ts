export const floorWidth = 15;

export type randomGeometry = "sphere" | "cone" | "box";

export type PointPosition = {
  x: number;
  y: number;
  z: number;
};

export type ObjectBody = {
  id: string;
  geometry: randomGeometry;
  position: [number, number, number];
  randomScale: number;
};

export const WorkerEnum = {
  RAPIER_READY: "Rapier Ready",
  ADD_OBJECTS: "Add Objects",
  WORLD_STEP: "World Step",
  UPDATE_MESHES: "Update Meshes",
  ROTATE_FLOOR: "Rotate Floor",
  REMOVE_BODY: "Remove Body",
};
