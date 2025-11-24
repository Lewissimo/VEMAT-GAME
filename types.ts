export type Vector3 = { x: number; y: number; z: number };

export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum BonusType {
  HEALTH = 'HEALTH',
  DAMAGE = 'DAMAGE',
  MULTI_SHOT = 'MULTI_SHOT',
}

export type PlayerState = {
  id: number;
  position: Vector3;
  rotation: number;
  velocity: Vector3;
  health: number;
  color: string;
  name: string;
  cooldown: number;
  damageLevel: number;
  shotCount: number;
};

export type Snowball = {
  id: string;
  ownerId: number;
  position: Vector3;
  velocity: Vector3;
  active: boolean;
  damage: number;
};

export type Bonus = {
  id: string;
  type: BonusType;
  position: Vector3;
};

export type Particle = {
  id: string;
  position: Vector3;
  velocity: Vector3;
  life: number;
  color: string;
};