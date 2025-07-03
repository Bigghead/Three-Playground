import * as three from "three";

export type Position = [number, number, number];

export type HexagonMesh = {
  hexagon: three.Mesh;
  type: string;
  position: Position;
};

export type TextureMapGeometry = {
  type: string;
  map: three.Texture;
};
