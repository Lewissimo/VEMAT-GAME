import { Vector2D } from '../types';

export const getDistance = (v1: Vector2D, v2: Vector2D): number => {
  const dx = v1.x - v2.x;
  const dy = v1.y - v2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const checkCollision = (p1: Vector2D, r1: number, p2: Vector2D, r2: number): boolean => {
  return getDistance(p1, p2) < (r1 + r2);
};

export const constrainMap = (pos: Vector2D, width: number, height: number, radius: number): Vector2D => {
  return {
    x: Math.max(radius, Math.min(width - radius, pos.x)),
    y: Math.max(radius, Math.min(height - radius, pos.y)),
  };
};

export const generateRandomPosition = (width: number, height: number, padding: number): Vector2D => {
  return {
    x: padding + Math.random() * (width - 2 * padding),
    y: padding + Math.random() * (height - 2 * padding),
  };
};

export const getRandomEnum = <T extends object>(anEnum: T): T[keyof T] => {
  const enumValues = Object.keys(anEnum) as Array<keyof T>;
  const randomIndex = Math.floor(Math.random() * enumValues.length);
  return anEnum[enumValues[randomIndex]];
};
