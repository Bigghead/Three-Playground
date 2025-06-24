import * as three from "three";

export const positionNeighbors = (x: number, y: number): three.Vector3 => {
  return new three.Vector3((x + (y % 2) * 0.5) * 1.85, 0, y * 1.6);
};
