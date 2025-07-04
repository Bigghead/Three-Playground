import * as three from "three";

export type MaterialType = "dirt" | "dirt2" | "stone" | "sand" | "grass";

export type InstancedHexagon = Record<
  string,
  {
    mesh: three.InstancedMesh;
    count: number;
  }
>;

export type Position = [number, number, number];

export type HexagonMesh = {
  type: string;
  position: Position;
};

export type TextureMapGeometry = {
  type: string;
  map: three.Texture;
};
