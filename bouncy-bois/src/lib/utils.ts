import { floorWidth } from "./constants";

export const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const buildRandomVertexPosition = (): [number, number, number] => {
  return [
    getRandomNumber(-floorWidth, floorWidth),
    getRandomNumber(17, 22),
    getRandomNumber(-floorWidth, floorWidth),
  ];
};
