import { floorWidth, type PointPosition } from "./constants";

export const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const buildRandomVertexPosition = (): PointPosition => {
  return {
    x: getRandomNumber(-floorWidth, floorWidth),
    y: getRandomNumber(12, 20),
    z: getRandomNumber(-floorWidth, floorWidth),
  };
};
