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
